const offhands = require('../config/offhands.json');
const catalog = require('../config/shop.json');
const { characterView } = require('./progress.service');
const fail = (status, message) => Object.assign(new Error(message), { status });
function createShopService(db) {
  async function addPurchasedItems(c, characterId, itemId, quantity) {
    const special=offhands[itemId];
    if(special) await c.execute(
      'INSERT IGNORE INTO item_definitions (id, name, type, tier, price, max_stack, attack_bonus, icon_key, description, available_in_shop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [itemId,special.name,'shield',special.level,special.price,1,special.attack,special.icon,special.description,1]
    );
    const [definitions] = await c.execute('SELECT id, max_stack FROM item_definitions WHERE id = ?', [itemId]);
    const maxStack = Number(definitions[0]?.max_stack);
    if (!definitions.length || !Number.isSafeInteger(maxStack) || maxStack < 1) {
      throw fail(503, 'Thiếu định nghĩa vật phẩm trong item_definitions.');
    }
    const [rows] = await c.execute(
      "SELECT id, item_definition_id, quantity, slot_key FROM character_items WHERE character_id = ? AND location = 'inventory' FOR UPDATE",
      [characterId],
    );
    const stacks = rows.filter(row => row.item_definition_id === itemId);
    const current = stacks.reduce((sum, row) => sum + Number(row.quantity), 0);
    const requiredStacks = Math.ceil((current + quantity) / maxStack);
    const occupied = new Set(rows.map(row => String(row.slot_key)));
    const freeSlots = 28 - occupied.size;
    if (requiredStacks > stacks.length + freeSlots) throw fail(409, 'Túi đồ trong CSDL đã đầy.');
    let remaining = quantity;
    for (const stack of stacks) {
      const added = Math.min(remaining, maxStack - Number(stack.quantity));
      if (added > 0) {
        await c.execute('UPDATE character_items SET quantity = quantity + ? WHERE id = ? AND character_id = ?', [added, stack.id, characterId]);
        remaining -= added;
      }
    }
    while (remaining > 0) {
      let slot = null;
      for (let index = 0; index < 28; index++) {
        if (!occupied.has(String(index))) { slot = String(index); break; }
      }
      if (slot === null) throw fail(409, 'Túi đồ trong CSDL đã đầy.');
      const added = Math.min(remaining, maxStack);
      await c.execute(
        "INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, ?, 'inventory', ?)",
        [characterId, itemId, added, slot],
      );
      occupied.add(slot);
      remaining -= added;
    }
  }
  return { async buy(userId, input = {}) {
    const { itemId, quantity, requestId } = input;
    if (typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) throw fail(400, 'Mã giao dịch không hợp lệ.');
    const item = Object.hasOwn(catalog, itemId || '') ? catalog[itemId] : null;
    if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > item.maxStack) throw fail(400, 'Vật phẩm hoặc số lượng không hợp lệ.');
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      const [rows] = await c.execute('SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE', [userId]);
      const char = rows[0];
      if (!char) throw fail(409, 'Hãy tạo nhân vật trước.');
      const [receipts] = await c.execute('SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?', [char.id, requestId]);
      if (receipts.length) {
        const receipt = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
        if (receipts[0].action_type !== 'purchase' || receipt.itemId !== itemId || receipt.quantity !== quantity) throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
        if (receipt.inventoryAdded !== true) {
          await addPurchasedItems(c, char.id, itemId, quantity);
          await c.execute(
            'UPDATE character_economy_events SET payload = ? WHERE character_id = ? AND request_id = ?',
            [JSON.stringify({ ...receipt, inventoryAdded: true }), char.id, requestId],
          );
        }
      } else {
        if (item.classCode && item.classCode !== char.class_code) throw fail(403, 'Vũ khí này không dành cho class của bạn.');
        const cost = item.price * quantity;
        if (Number(char.gold) < cost) throw fail(409, 'Không đủ vàng trong CSDL.');
        await addPurchasedItems(c, char.id, itemId, quantity);
        await c.execute('UPDATE characters SET gold = gold - ?, progress_version = progress_version + 1 WHERE id = ?', [cost, char.id]);
        await c.execute("INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, 'purchase', ?)", [char.id, requestId, JSON.stringify({ itemId, quantity, cost, inventoryAdded: true })]);
        char.gold = Number(char.gold) - cost;
        char.progress_version = Number(char.progress_version || 0) + 1;
      }
      await c.commit();
      return { character: characterView(char), purchase: { requestId, itemId, quantity } };
    } catch (error) { await c.rollback().catch(() => {}); throw error; }
    finally { c.release(); }
  } };
}
module.exports = { createShopService };
