const { randomUUID, randomInt } = require('node:crypto');
const defaults = require('../config/fishing');
const failure = (status, message) => Object.assign(new Error(message), { status });
function createFishingService(db, { config = defaults, now = Date.now, roll = randomInt } = {}) {
  const attempts = new Map(), queues = new Map();
  const allowed = [config.rodId, ...config.fish.map(f => f.id)];
  function serial(userId, operation) {
    const key = String(userId), previous = queues.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(operation); queues.set(key, next);
    return next.finally(() => { if (queues.get(key) === next) queues.delete(key); });
  }
  async function transaction(fn) {
    const connection = await db.getConnection();
    let committing = false;
    try { await connection.beginTransaction(); const value = await fn(connection); committing = true; await connection.commit(); return value; }
    catch (error) { if (committing) error.commitUncertain = true; await connection.rollback().catch(() => {}); throw error; }
    finally { connection.release(); }
  }
  async function character(c, userId, create = false) {
    // Khóa tài khoản trước khi tạo để không sinh nhiều nhân vật do hai tab cùng mở.
    const [users] = await c.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!users.length) throw failure(401, 'Tài khoản không tồn tại.');
    const [rows] = await c.execute('SELECT id, name FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE', [userId]);
    if (rows[0]) return rows[0];
    if (!create) throw failure(409, 'Hãy mở Giỏ cá để khởi tạo dữ liệu nhân vật.');
    const name = `CauCa_${userId}_${randomUUID().slice(0, 6)}`;
    const [result] = await c.execute('INSERT INTO characters (user_id, name) VALUES (?, ?)', [userId, name]);
    return { id: String(result.insertId), name };
  }
  async function inventory(c, characterId) {
    const [rows] = await c.execute('SELECT ci.id, ci.item_definition_id, ci.quantity, ci.location, ci.slot_key, d.name, d.max_stack FROM character_items ci JOIN item_definitions d ON d.id = ci.item_definition_id WHERE ci.character_id = ? FOR UPDATE', [characterId]);
    return rows;
  }
  async function definitions(c) {
    const marks = allowed.map(() => '?').join(',');
    const [rows] = await c.execute(`SELECT id, name, max_stack FROM item_definitions WHERE id IN (${marks})`, allowed);
    if (rows.length !== allowed.length) throw failure(503, 'Chưa có dữ liệu cần câu/cá. Hãy chạy fishing.sql.');
    return Object.fromEntries(rows.map(row => [row.id, row]));
  }
  function freeSlot(rows) {
    const used = new Set(rows.filter(row => row.location === 'inventory').map(row => String(row.slot_key)));
    for (let slot = 0; slot < config.capacity; slot++) if (!used.has(String(slot))) return String(slot);
    return null;
  }
  function canAdd(rows, id, defs) {
    return rows.some(r => r.location === 'inventory' && r.item_definition_id === id && Number(r.quantity) < Number(defs[id].max_stack)) || freeSlot(rows) !== null;
  }
  async function add(c, characterId, rows, id, defs) {
    const stack = rows.find(r => r.location === 'inventory' && r.item_definition_id === id && Number(r.quantity) < Number(defs[id].max_stack));
    if (stack) await c.execute('UPDATE character_items SET quantity = quantity + 1 WHERE id = ? AND character_id = ?', [stack.id, characterId]);
    else {
      const slot = freeSlot(rows);
      if (slot === null) throw failure(409, 'Túi đồ trong CSDL đã đầy. Không thể nhận thêm vật phẩm.');
      await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'inventory', ?)", [characterId, id, slot]);
    }
  }
  function snapshot(char, rows) {
    return { characterId: String(char.id), characterName: char.name, hasRod: rows.some(r => r.item_definition_id === config.rodId && Number(r.quantity) > 0), items: rows.filter(r => allowed.includes(r.item_definition_id)).map(r => ({ id: r.item_definition_id, name: r.name, quantity: Number(r.quantity) })) };
  }
  function position(input) {
    const s = config.spot;
    if (input?.mapId !== s.mapId || !Number.isFinite(input.x) || !Number.isFinite(input.feetY) || input.x < s.minX || input.x > s.maxX || input.feetY < s.minY || input.feetY > s.maxY) throw failure(400, 'Bạn phải đứng ở mép bến câu cá Hồ Atlast.');
  }
  function attempt(userId, id) {
    const value = attempts.get(String(userId));
    if (!value || value.id !== id || value.expiresAt < now()) throw failure(409, 'Lượt câu không còn hiệu lực. Hãy kiểm tra Giỏ cá và bắt đầu lượt mới.');
    return value;
  }
  const service = {
    bootstrap(userId) { return serial(userId, () => transaction(async c => {
      await definitions(c); const char = await character(c, userId, true); const rows = await inventory(c, char.id);
      const active = attempts.get(String(userId));
      return { ...snapshot(char, rows), spot: config.spot, activeId: active?.status === 'pending' && active.expiresAt > now() ? active.id : null };
    })); },
    grantRod(userId) { return serial(userId, () => transaction(async c => {
      const defs = await definitions(c), char = await character(c, userId, true), rows = await inventory(c, char.id);
      if (!rows.some(r => r.item_definition_id === config.rodId && Number(r.quantity) > 0)) await add(c, char.id, rows, config.rodId, defs);
      return snapshot(char, await inventory(c, char.id));
    })); },
    start(userId, input) { return serial(userId, async () => {
      position(input); const key = String(userId), previous = attempts.get(key);
      if (previous?.status === 'pending' && previous.expiresAt > now()) throw failure(409, 'Bạn đang có một lượt câu. Hãy hủy trước khi câu tiếp.');
      const char = await transaction(async c => {
        const defs = await definitions(c), char = await character(c, userId), rows = await inventory(c, char.id);
        if (!rows.some(r => r.item_definition_id === config.rodId && Number(r.quantity) > 0)) throw failure(409, 'Bạn cần có cần câu trong Giỏ cá.');
        // Chừa chỗ cho bất kỳ loại cá nào có thể được chọn.
        if (!config.fish.every(f => canAdd(rows, f.id, defs))) throw failure(409, 'Túi đồ trong CSDL không đủ chỗ nhận cá.');
        return char;
      });
      const value = { id: randomUUID(), characterId: String(char.id), readyAt: now() + config.durationMs, expiresAt: now() + config.durationMs + 120000, status: 'pending' };
      attempts.set(key, value);
      return { attemptId: value.id, durationMs: config.durationMs };
    }); },
    finish(userId, input) { return serial(userId, async () => {
      const value = attempt(userId, input?.attemptId);
      if (value.status === 'complete') return value.result; // Retry do mất phản hồi: không cộng cá lần hai.
      if (value.status !== 'pending') throw failure(409, 'Lượt câu đã đóng. Hãy kiểm tra Giỏ cá trước khi câu tiếp.');
      position(input);
      if (now() < value.readyAt) throw failure(409, 'Chưa đủ thời gian câu.');
      if (!value.fishId) {
        let number = roll(config.fish.reduce((sum, f) => sum + f.weight, 0));
        value.fishId = config.fish.find(f => { number -= f.weight; return number < 0; }).id;
      }
      let result;
      try { result = await transaction(async c => {
        const defs = await definitions(c), char = await character(c, userId), rows = await inventory(c, char.id);
        if (String(char.id) !== value.characterId) throw failure(409, 'Nhân vật đã thay đổi.');
        if (!rows.some(r => r.item_definition_id === config.rodId && Number(r.quantity) > 0)) throw failure(409, 'Bạn không còn cần câu.');
        await add(c, char.id, rows, value.fishId, defs);
        return { fish: { id: value.fishId, name: defs[value.fishId].name, quantity: 1 }, inventory: snapshot(char, await inventory(c, char.id)) };
      });
      } catch (error) {
        if (error.commitUncertain) { value.status = 'uncertain'; throw failure(503, 'Chưa xác nhận được kết quả lưu. Hãy mở Giỏ cá kiểm tra; lượt này không được nhận lại.'); }
        throw error;
      }
      value.status = 'complete'; value.result = result; value.expiresAt = now() + 300000;
      return result;
    }); },
    cancel(userId, id) { return serial(userId, async () => {
      const value = attempts.get(String(userId));
      if (!value || value.id !== id) return { canceled: true };
      if (value.status === 'complete') return { canceled: false, result: value.result };
      value.status = 'canceled'; value.expiresAt = now() + 60000;
      return { canceled: true };
    }); },
    prune() { for (const [key, value] of attempts) if (value.expiresAt < now() && !queues.has(key)) attempts.delete(key); },
  };
  return service;
}
module.exports = { createFishingService };
