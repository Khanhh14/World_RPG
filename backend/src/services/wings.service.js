const catalog = require('../config/wings.json');
const { characterView } = require('./progress.service');
const fail = (status, message) => Object.assign(new Error(message), { status });
const styles = new Set(catalog.styles.map(s => s.id));
function createWingsService(db) {
  async function transaction(userId, fn) {
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      const [rows] = await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE', [userId]);
      if (!rows[0]) throw fail(409, 'Hãy tạo nhân vật trước khi sử dụng cánh.');
      const char = rows[0];
      // Ba mẫu cơ bản miễn phí; mỗi mẫu có cấp nâng riêng, không cấp lại đá.
      for (const style of catalog.styles) await c.execute('INSERT IGNORE INTO character_wings (character_id, wing_id, upgrade_level) VALUES (?, ?, 0)', [char.id, style.id]);
      for (const stone of catalog.stones) await c.execute('INSERT IGNORE INTO character_wing_materials (character_id, item_id, quantity) VALUES (?, ?, 0)', [char.id, stone.id]);
      const result = await fn(c, char);
      await c.commit(); return result;
    } catch (error) { await c.rollback().catch(() => {}); throw error; }
    finally { c.release(); }
  }
  async function snapshot(c, char) {
    const [wings] = await c.execute('SELECT wing_id, upgrade_level FROM character_wings WHERE character_id = ? ORDER BY wing_id', [char.id]);
    const [materials] = await c.execute('SELECT item_id, quantity FROM character_wing_materials WHERE character_id = ? ORDER BY item_id', [char.id]);
    return { character: characterView(char), wings: {
      equipped: char.equipped_wing || null,
      collection: wings.map(w => ({ id: w.wing_id, level: Number(w.upgrade_level) })),
      materials: Object.fromEntries(materials.map(m => [m.item_id, Number(m.quantity)])),
      revision: Number(char.progress_version || 0)
    } };
  }
  return {
    load: userId => transaction(userId, snapshot),
    async mutate(userId, action, input = {}) {
      if (!['buy', 'equip', 'upgrade'].includes(action)) throw fail(404, 'Thao tác không tồn tại.');
      if (typeof input.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.requestId)) throw fail(400, 'Mã giao dịch không hợp lệ.');
      let payload;
      if (action === 'buy') {
        const stone = catalog.stones.find(s => s.id === input.itemId);
        if (!stone) throw fail(400, 'Loại đá không hợp lệ.');
        // Giá/số lượng do server quyết định: mỗi lần mua một viên.
        payload = { itemId: stone.id };
      } else {
        if (!styles.has(input.wingId) && !(action === 'equip' && input.wingId === null)) throw fail(400, 'Mẫu cánh không hợp lệ.');
        payload = { wingId: input.wingId };
        if (action === 'upgrade') {
          if (!Number.isInteger(input.expectedLevel) || input.expectedLevel < 0 || input.expectedLevel >= catalog.maxLevel) throw fail(400, 'Cấp nâng không hợp lệ hoặc đã tối đa.');
          payload.expectedLevel = input.expectedLevel;
        }
      }
      return transaction(userId, async (c, char) => {
        const [receipts] = await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?', [char.id, input.requestId]);
        if (receipts.length) {
          const previous = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== 'wing_' + action || Object.keys(previous).length !== Object.keys(payload).length || Object.keys(payload).some(key => previous[key] !== payload[key])) throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          return { ...await snapshot(c, char), replayed: true };
        }
        if (action === 'buy') {
          const p = input.position, merchant = catalog.merchant;
          if (!p || p.mapId !== merchant.mapId || !Number.isFinite(p.x) || !Number.isFinite(p.feetY) || Math.hypot(p.x - merchant.x, p.feetY - merchant.feetY) > merchant.range) throw fail(409, 'Hãy đến gặp Vũ sư Airi ở Ngoại ô thành YuNa.');
          const stone = catalog.stones.find(s => s.id === payload.itemId);
          const [materials] = await c.execute('SELECT quantity FROM character_wing_materials WHERE character_id = ? AND item_id = ? FOR UPDATE', [char.id, stone.id]);
          if (Number(materials[0]?.quantity) >= 999) throw fail(409, 'Mỗi loại đá chứa tối đa 999 viên.');
          if (Number(char.gold) < stone.price) throw fail(409, 'Không đủ vàng để mua đá nâng cấp cánh.');
          await c.execute('UPDATE characters SET gold = gold - ? WHERE id = ?', [stone.price, char.id]);
          await c.execute('UPDATE character_wing_materials SET quantity = quantity + 1 WHERE character_id = ? AND item_id = ?', [char.id, stone.id]);
          char.gold = Number(char.gold) - stone.price;
        } else if (action === 'equip') {
          await c.execute('UPDATE characters SET equipped_wing = ? WHERE id = ?', [payload.wingId, char.id]);
          char.equipped_wing = payload.wingId;
        } else {
          const [rows] = await c.execute('SELECT upgrade_level FROM character_wings WHERE character_id = ? AND wing_id = ? FOR UPDATE', [char.id, payload.wingId]);
          const level = Number(rows[0]?.upgrade_level);
          if (!Number.isInteger(level) || level !== payload.expectedLevel) throw fail(409, 'Cấp cánh đã thay đổi. Hãy kiểm tra lại trước khi nâng tiếp.');
          const stone = catalog.stones[Math.min(3, Math.floor(level / 3))];
          const [used] = await c.execute('UPDATE character_wing_materials SET quantity = quantity - 1 WHERE character_id = ? AND item_id = ? AND quantity > 0', [char.id, stone.id]);
          if (!used.affectedRows) throw fail(409, 'Bạn cần 1 ' + stone.name.toLowerCase() + '.');
          await c.execute('UPDATE character_wings SET upgrade_level = upgrade_level + 1 WHERE character_id = ? AND wing_id = ?', [char.id, payload.wingId]);
        }
        await c.execute('UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?', [char.id]);
        char.progress_version = Number(char.progress_version || 0) + 1;
        await c.execute('INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)', [char.id, input.requestId, 'wing_' + action, JSON.stringify(payload)]);
        return { ...await snapshot(c, char), replayed: false };
      });
    }
  };
}
module.exports = { createWingsService };
