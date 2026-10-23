const classes = require('../config/characterClasses');
const fail = (status, message) => Object.assign(new Error(message), { status });
const recognized = row => classes.some(c => c.code === row?.class_code);
function createCharacterService(db) {
  async function view(c, row) {
    const [items] = await c.execute('SELECT item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ?', [row.id]);
    return { id: String(row.id), name: row.name, classCode: row.class_code, class: classes.find(c => c.code === row.class_code), level: Number(row.level), exp: Number(row.exp), gold: Number(row.gold), gems: Number(row.gems || 0), revision: Number(row.progress_version || 0), hp: Number(row.hp), mana: Number(row.mana), mapId: row.map_id, items: items.map(i => ({ id: i.item_definition_id, quantity: Number(i.quantity), location: i.location, slot: i.slot_key })) };
  }
  return {
    async current(userId) {
      const [rows] = await db.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1', [userId]);
      return { classes, needsCreation: !recognized(rows[0]), character: recognized(rows[0]) ? await view(db, rows[0]) : null };
    },
    async create(userId, input = {}) {
      const selection = classes.find(c => c.code === input.classCode);
      const name = typeof input.name === 'string' ? input.name.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
      if (!selection) throw fail(400, 'Hãy chọn Kiếm sĩ, Pháp sư hoặc Đấu sĩ.');
      if ([...name].length < 3 || [...name].length > 24 || !/^[\p{L}\p{N} _]+$/u.test(name)) throw fail(400, 'Tên cần 3–24 ký tự: chữ, số, khoảng trắng hoặc dấu gạch dưới.');
      const c = await db.getConnection();
      try {
        await c.beginTransaction();
        const [users] = await c.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (!users.length) throw fail(401, 'Tài khoản không tồn tại.');
        const [existing] = await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE', [userId]);
        let row = existing[0];
        if (recognized(row)) {
          // Retry sau khi phản hồi tạo nhân vật bị mất không cấp vũ khí lần hai.
          if (row.name !== name || row.class_code !== selection.code) throw fail(409, 'Tài khoản đã có nhân vật. Hãy nhấn Kiểm tra lại để vào game.');
          const result = await view(c, row); await c.commit(); return result;
        }
        if (row && row.class_code !== 'adventurer') throw fail(409, 'Hồ sơ hiện có dùng class khác. Cần kiểm tra trước khi chuyển đổi.');
        const [definitions] = await c.execute('SELECT id, type FROM item_definitions WHERE id = ?', [selection.weaponId]);
        if (!definitions.length || definitions[0].type !== 'weapon') throw fail(503, 'Thiếu vũ khí khởi đầu. Hãy chạy character-starter.sql.');
        if (row) {
          // Giữ nguyên ID, chỉ số và đồ của hồ sơ tạm do câu cá tạo.
          await c.execute('UPDATE characters SET name = ?, class_code = ? WHERE id = ? AND user_id = ?', [name, selection.code, row.id, userId]);
        } else {
          const [created] = await c.execute('INSERT INTO characters (user_id, name, class_code) VALUES (?, ?, ?)', [userId, name, selection.code]);
          row = { id: String(created.insertId) };
        }
        const [items] = await c.execute('SELECT id, item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ? FOR UPDATE', [row.id]);
        if (!items.some(i => i.item_definition_id === selection.weaponId && Number(i.quantity) > 0)) {
          const occupied = new Set(items.filter(i => i.location === 'inventory').map(i => String(i.slot_key)));
          let slot; for (let i = 0; i < 28; i++) if (!occupied.has(String(i))) { slot = String(i); break; }
          if (slot === undefined) throw fail(409, 'Túi đồ CSDL đã đầy, chưa thể nhận vũ khí khởi đầu.');
          await c.execute("INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'inventory', ?)", [row.id, selection.weaponId, slot]);
        }
        const [updated] = await c.execute('SELECT * FROM characters WHERE id = ? AND user_id = ?', [row.id, userId]);
        const result = await view(c, updated[0]); await c.commit(); return result;
      } catch (error) {
        await c.rollback().catch(() => {});
        if (error.code === 'ER_DUP_ENTRY') throw fail(409, 'Tên nhân vật đã được sử dụng. Hãy chọn tên khác.');
        throw error;
      } finally { c.release(); }
    },
  };
}
module.exports = { createCharacterService };
