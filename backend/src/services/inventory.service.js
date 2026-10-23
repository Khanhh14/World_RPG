const {validateVitalContext,calculateMaxVitals}=require('./vitalStats');
const tuLinhWeapons=require('../config/tuLinh.json').weapons;
const shopCatalog = require('../config/shop.json');
const foodRecipes = [
  { id: 'food_perch_soup', fishId: 'fish_perch', heal: 5, mana: 5 },
  { id: 'food_carp_stew', fishId: 'fish_carp', heal: 7, mana: 7 },
  { id: 'food_catfish_stew', fishId: 'fish_catfish', heal: 9, mana: 9 },
];
const legacyFoodIds = {
  fish_perch_food: 'food_perch_soup',
  fish_carp_food: 'food_carp_stew',
  fish_catfish_food: 'food_catfish_stew',
};
const foodById = new Map(foodRecipes.map(recipe => [recipe.id, recipe]));
const outskirts = { mapId: 'yuna-outskirts', x: 312, feetY: 624, range: 110 };
const occupiedSlots = rows => new Set(rows.filter(row => row.location === 'inventory').map(row => String(row.slot_key)));
const inventorySnapshot = rows => rows.map(row => ({
  id: row.item_definition_id,
  quantity: Number(row.quantity),
  location: row.location,
  slot: row.slot_key,
}));
const fail = (status, message) => Object.assign(new Error(message), { status });
const potionValue = id => {
  const match = /^(health|mana)_potion(?:_(\d+))?$/.exec(id);
  if (!match) return null;
  const level = Number(match[2] || 1);
  if (level < 1 || level > 5) return null;
  const values = match[1] === 'health' ? [50, 100, 200, 350, 500] : [25, 50, 100, 175, 250];
  return { kind: match[1], amount: values[level - 1] };
};
const equipmentSlots = new Set(['weapon', 'shield', 'armor', 'helmet', 'boots', 'gloves']);

function createInventoryService(db) {
  async function transaction(userId, operation) {
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      const [characters] = await c.execute(
        'SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',
        [userId],
      );
      const character = characters[0];
      if (!character) throw fail(409, 'Hãy tạo nhân vật trước khi dùng vật phẩm.');
      const result = await operation(c, character);
      await c.commit();
      return result;
    } catch (error) {
      await c.rollback().catch(() => {});
      throw error;
    } finally {
      c.release();
    }
  }

  async function currentVitals(c, character, context=null) {
    const [runtimeRows] = await c.execute(
      'SELECT hp, mana, version FROM character_runtime WHERE character_id = ? FOR UPDATE',
      [character.id],
    );
    const [gear] = await c.execute(
      "SELECT item_definition_id FROM character_items WHERE character_id = ? AND location = 'equipment' AND quantity > 0 FOR UPDATE",
      [character.id],
    );
    // Enhancement levels currently live in the existing per-character browser save.
    // Calculate their bonuses from known item stats; never accept a raw maxHP value.
    let ownedWings=[];
    if(context){[ownedWings]=await c.execute('SELECT wing_id, upgrade_level FROM character_wings WHERE character_id = ? ORDER BY wing_id',[character.id]);}
    const {maxHp,maxMana}=calculateMaxVitals(character.level,gear,ownedWings,context?.enhancements);
    return {
      hp: context?Math.min(maxHp,context.hp):Number(runtimeRows[0]?.hp ?? character.hp),
      mana: context?Math.min(maxMana,context.mp):Number(runtimeRows[0]?.mana ?? character.mana),
      maxHp,
      maxMana,
      hasRuntime: Boolean(runtimeRows[0]),
      runtimeVersion: runtimeRows[0] ? Number(runtimeRows[0].version) : null,
    };
  }

  async function saveVitals(c, character, vitals, hp, mana) {
    await c.execute(
      'UPDATE characters SET hp = ?, mana = ?, progress_version = progress_version + 1 WHERE id = ?',
      [hp, mana, character.id],
    );
    character.hp = hp;
    character.mana = mana;
    character.progress_version = Number(character.progress_version || 0) + 1;
    if (vitals.hasRuntime) {
      await c.execute(
        'UPDATE character_runtime SET hp = ?, mana = ?, version = version + 1 WHERE character_id = ?',
        [hp, mana, character.id],
      );
      return vitals.runtimeVersion + 1;
    }
    return null;
  }

  async function itemRows(c, characterId, itemId) {
    const [rows] = await c.execute(
      "SELECT id, quantity FROM character_items WHERE character_id = ? AND item_definition_id = ? AND location = 'inventory' AND quantity > 0 ORDER BY id FOR UPDATE",
      [characterId, itemId],
    );
    return rows;
  }

  async function allItemRows(c, characterId) {
    const [rows] = await c.execute(
      'SELECT ci.id, ci.item_definition_id, ci.quantity, ci.location, ci.slot_key FROM character_items ci WHERE ci.character_id = ? ORDER BY ci.id FOR UPDATE',
      [characterId],
    );
    return rows;
  }

  async function consumeQuantity(c, characterId, rows, quantity) {
    let remaining = quantity;
    for (const row of rows) {
      const consumed = Math.min(remaining, Number(row.quantity));
      if (consumed === Number(row.quantity)) {
        await c.execute('DELETE FROM character_items WHERE id = ? AND character_id = ?', [row.id, characterId]);
      } else {
        await c.execute('UPDATE character_items SET quantity = quantity - ? WHERE id = ? AND character_id = ?', [consumed, row.id, characterId]);
      }
      remaining -= consumed;
      if (!remaining) return;
    }
    throw fail(409, 'Số lượng vật phẩm trong CSDL đã thay đổi. Hãy tải lại túi đồ.');
  }

  async function addOne(c, characterId, rows, itemId, definition) {
    const stack = rows.find(row => row.item_definition_id === itemId && row.location === 'inventory'
      && Number(row.quantity) < Number(definition.max_stack));
    if (stack) {
      await c.execute('UPDATE character_items SET quantity = quantity + 1 WHERE id = ? AND character_id = ?', [stack.id, characterId]);
      return;
    }
    const occupied = occupiedSlots(rows);
    let slot = null;
    for (let index = 0; index < 28; index++) {
      if (!occupied.has(String(index))) { slot = String(index); break; }
    }
    if (slot === null) throw fail(409, 'Túi đồ trong CSDL đã đầy.');
    await c.execute(
      "INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'inventory', ?)",
      [characterId, itemId, slot],
    );
  }

  async function currentFoodBuff(c, characterId) {
    const [rows] = await c.execute(
      "SELECT payload FROM character_economy_events WHERE character_id = ? AND action_type = 'inventory_use' ORDER BY created_at DESC LIMIT 100",
      [characterId],
    );
    for (const row of rows) {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      if (payload.foodBuff && Number.isSafeInteger(payload.foodBuff.expiresAt)) {
        const foodId = legacyFoodIds[payload.foodBuff.foodId] || payload.foodBuff.foodId;
        if (!foodById.has(foodId) || payload.foodBuff.expiresAt <= Date.now()) return null;
        return { ...payload.foodBuff, foodId, nextTickAt: Math.max(payload.foodBuff.nextTickAt || 0, Date.now() + 1000) };
      }
    }
    return null;
  }

  async function characterItems(c, characterId) {
    const [rows] = await c.execute(
      'SELECT ci.id AS row_id, ci.item_definition_id, ci.quantity, ci.location, ci.slot_key, d.type FROM character_items ci JOIN item_definitions d ON d.id = ci.item_definition_id WHERE ci.character_id = ? ORDER BY ci.id FOR UPDATE',
      [characterId],
    );
    return rows.map(row => ({
      rowId: row.row_id,
      id: row.item_definition_id,
      quantity: Number(row.quantity),
      location: row.location,
      slot: row.slot_key,
      type: row.type,
    }));
  }

  function freeInventorySlot(rows) {
    // characterItems() chuẩn hóa slot_key thành slot trước khi truyền vào đây.
    const occupied = new Set(rows.filter(row => row.location === 'inventory').map(row => String(row.slot)));
    for (let slot = 0; slot < 28; slot++) if (!occupied.has(String(slot))) return String(slot);
    return null;
  }

  function temporaryInventorySlot(rows) {
    const occupied = new Set(rows.filter(row => row.location === 'inventory').map(row => String(row.slot)));
    for (let slot = 0; slot < 28; slot++) {
      const candidate = `tmp${slot}`;
      if (!occupied.has(candidate)) return candidate;
    }
    return `tmp${Date.now()}`;
  }

  async function consumeOne(c, characterId, rows) {
    const row = rows[0];
    const remaining = Number(row.quantity) - 1;
    if (remaining) {
      await c.execute('UPDATE character_items SET quantity = ? WHERE id = ? AND character_id = ?', [remaining, row.id, characterId]);
    } else {
      await c.execute('DELETE FROM character_items WHERE id = ? AND character_id = ?', [row.id, characterId]);
    }
    return rows.reduce((sum, stack) => sum + Number(stack.quantity), 0) - 1;
  }

  function validateRequest(input) {
    if (!input || typeof input.itemId !== 'string' || typeof input.requestId !== 'string'
      || !/^[a-f0-9-]{36}$/i.test(input.requestId)) {
      throw fail(400, 'Yêu cầu dùng vật phẩm không hợp lệ.');
    }
    const potion = potionValue(input.itemId);
    const itemId = legacyFoodIds[input.itemId] || input.itemId;
    const food = foodById.get(itemId);
    if (!potion && !food) throw fail(400, 'Vật phẩm này không thể sử dụng.');
    if (potion && !Object.hasOwn(shopCatalog, input.itemId)) throw fail(400, 'Bình thuốc không tồn tại.');
    return { potion, food, itemId };
  }

  return {
    async load(userId) {
      return transaction(userId, async (c, character) => {
        const rows = await allItemRows(c, character.id);
        return {
          characterId: String(character.id),
          items: inventorySnapshot(rows),
          foodBuff: await currentFoodBuff(c, character.id),
        };
      });
    },
    async use(userId, input = {}) {
      const { potion, food, itemId } = validateRequest(input);
      const context=validateVitalContext(input.context);
      return transaction(userId, async (c, character) => {
        const [receipts] = await c.execute(
          'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
          [character.id, input.requestId],
        );
        if (receipts.length) {
          const payload = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== 'inventory_use' || payload.itemId !== input.itemId) {
            throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          }
          const rows = await itemRows(c, character.id, itemId);
          const vitals = await currentVitals(c, character);
          return {
            requestId: input.requestId, itemId: input.itemId,
            quantity: rows.reduce((sum, row) => sum + Number(row.quantity), 0),
            hp: vitals.hp, mana: vitals.mana, runtimeVersion: vitals.runtimeVersion,
            foodBuff: payload.foodBuff || null, replayed: true,
          };
        }

        const [definitions] = await c.execute('SELECT id FROM item_definitions WHERE id = ?', [itemId]);
        if (!definitions.length) throw fail(503, 'Thiếu dữ liệu vật phẩm trong item_definitions.');
        const rows = await itemRows(c, character.id, itemId);
        if (!rows.length) throw fail(409, 'Bạn không có vật phẩm này trong túi đồ CSDL.');
        const quantity = await consumeOne(c, character.id, rows);
        const vitals = await currentVitals(c, character, context);
        let hp = vitals.hp, mana = vitals.mana, foodBuff = null;
          if (potion?.kind === 'health') hp = Math.max(hp,Math.min(vitals.maxHp, hp + potion.amount));
        if (potion?.kind === 'mana') mana = Math.max(mana,Math.min(vitals.maxMana, mana + potion.amount));
        if (food) {
          const now = Date.now();
          foodBuff = { foodId: food.id, expiresAt: now + 180000, nextTickAt: now + 1000 };
        }
        const runtimeVersion = await saveVitals(c, character, vitals, hp, mana);
        await c.execute(
          'INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
          [character.id, input.requestId, 'inventory_use', JSON.stringify({ itemId: input.itemId, foodBuff })],
        );
        return { requestId: input.requestId, itemId: input.itemId, quantity, hp, mana, runtimeVersion, foodBuff, replayed: false };
      });
    },
    async exchangeFood(userId, input = {}) {
      const recipe = foodById.get(input.recipeId);
      if (!recipe || typeof input.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.requestId)) {
        throw fail(400, 'Yêu cầu đổi món ăn không hợp lệ.');
      }
      const pos = input.position;
      if (!pos || pos.mapId !== outskirts.mapId || !Number.isFinite(pos.x) || !Number.isFinite(pos.feetY)
        || Math.hypot(pos.x - outskirts.x, pos.feetY - outskirts.feetY) > outskirts.range) {
        throw fail(409, 'Hãy đến gặp Yuna ở Ngoại ô YuNa để đổi món ăn.');
      }
      return transaction(userId, async (c, character) => {
        const [receipts] = await c.execute(
          'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
          [character.id, input.requestId],
        );
        if (receipts.length) {
          const payload = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== 'food_exchange' || payload.recipeId !== recipe.id) {
            throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          }
          return {
            requestId: input.requestId, recipeId: recipe.id,
            items: inventorySnapshot(await allItemRows(c, character.id)), replayed: true,
          };
        }
        const rows = await allItemRows(c, character.id);
        const mushrooms = rows.filter(row => row.item_definition_id === 'yuna_mushroom' && row.location === 'inventory');
        const fish = rows.filter(row => row.item_definition_id === recipe.fishId && row.location === 'inventory');
        if (mushrooms.reduce((sum, row) => sum + Number(row.quantity), 0) < 5
          || fish.reduce((sum, row) => sum + Number(row.quantity), 0) < 5) {
          throw fail(409, 'Cần 5 Nấm YuNa và 5 cá cùng loại trong túi đồ CSDL.');
        }
        const [definitions] = await c.execute(
          'SELECT id, max_stack FROM item_definitions WHERE id IN (?, ?, ?)',
          ['yuna_mushroom', recipe.fishId, recipe.id],
        );
        if (definitions.length !== 3) throw fail(503, 'Thiếu định nghĩa nấm, cá hoặc món ăn trong item_definitions.');
        const foodDefinition = definitions.find(value => value.id === recipe.id);
        const existingFood = rows.find(row => row.item_definition_id === recipe.id && row.location === 'inventory');
        await consumeQuantity(c, character.id, mushrooms, 5);
        await consumeQuantity(c, character.id, fish, 5);
        await addOne(c, character.id, await allItemRows(c, character.id), recipe.id, foodDefinition);
        await c.execute(
          'INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
          [character.id, input.requestId, 'food_exchange', JSON.stringify({ recipeId: recipe.id })],
        );
        return {
          requestId: input.requestId, recipeId: recipe.id,
          items: inventorySnapshot(await allItemRows(c, character.id)), replayed: false,
        };
      });
    },
    async harvestMushroom(userId, input = {}) {
      const match = /^patch-(\d+)$/.exec(input.patchId || '');
      if (!match || Number(match[1]) < 0 || Number(match[1]) >= 28
        || typeof input.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.requestId)) {
        throw fail(400, 'Yêu cầu hái nấm không hợp lệ.');
      }
      const index = Number(match[1]), row = Math.floor(index / 8), col = index % 8;
      const patch = { x: (33 + col * 1.35) * 48, feetY: (12.3 + row * 1.5) * 48 };
      const pos = input.position;
      if (!pos || pos.mapId !== 'yuna-outskirts' || !Number.isFinite(pos.x) || !Number.isFinite(pos.feetY)
        || Math.hypot(pos.x - patch.x, pos.feetY - patch.feetY) > 80) {
        throw fail(409, 'Hãy đứng cạnh cụm nấm ở Ngoại ô YuNa.');
      }
      return transaction(userId, async (c, character) => {
        const [receipts] = await c.execute(
          'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
          [character.id, input.requestId],
        );
        if (receipts.length) {
          const payload = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== 'mushroom_harvest' || payload.patchId !== input.patchId) {
            throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          }
          return {
            requestId: input.requestId, patchId: input.patchId, expiresAt: payload.expiresAt,
            items: inventorySnapshot(await allItemRows(c, character.id)), replayed: true,
          };
        }
        const rows = await allItemRows(c, character.id);
        if (!rows.some(item => item.item_definition_id === 'mushroom_basket' && item.location === 'inventory' && Number(item.quantity) > 0)) {
          throw fail(409, 'Cần có rổ hái nấm trong túi đồ CSDL.');
        }
        const [recent] = await c.execute(
          "SELECT payload FROM character_economy_events WHERE character_id = ? AND action_type = 'mushroom_harvest' ORDER BY created_at DESC LIMIT 100",
          [character.id],
        );
        for (const event of recent) {
          const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
          if (payload.patchId === input.patchId && Number(payload.expiresAt) > Date.now()) {
            throw fail(409, 'Cụm nấm chưa mọc lại.');
          }
        }
        const [definitions] = await c.execute('SELECT id, max_stack FROM item_definitions WHERE id = ?', ['yuna_mushroom']);
        if (!definitions.length) throw fail(503, 'Thiếu định nghĩa Nấm YuNa trong item_definitions.');
        await addOne(c, character.id, rows, 'yuna_mushroom', definitions[0]);
        const expiresAt = Date.now() + 30000;
        await c.execute(
          'INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
          [character.id, input.requestId, 'mushroom_harvest', JSON.stringify({ patchId: input.patchId, expiresAt })],
        );
        return {
          requestId: input.requestId, patchId: input.patchId, expiresAt,
          items: inventorySnapshot(await allItemRows(c, character.id)), replayed: false,
        };
      });
    },
    async equip(userId, input = {}) {
      if (!input || !['equip', 'unequip'].includes(input.action) || typeof input.itemId !== 'string'
        || typeof input.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.requestId)) {
        throw fail(400, 'Yêu cầu trang bị không hợp lệ.');
      }
      return transaction(userId, async (c, character) => {
        const [receipts] = await c.execute(
          'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
          [character.id, input.requestId],
        );
        if (receipts.length) {
          const payload = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== 'equipment_' + input.action || payload.itemId !== input.itemId) {
            throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          }
          return {
            requestId: input.requestId,
            items: (await characterItems(c, character.id)).map(({ rowId, ...item }) => item),
            replayed: true,
          };
        }

        const items = await characterItems(c, character.id);
        const definition = items.find(item => item.id === input.itemId)?.type;
        if (!equipmentSlots.has(definition)) throw fail(400, 'Vật phẩm này không phải trang bị hợp lệ.');
        const equipped = items.find(item => item.location === 'equipment' && item.slot === definition);

        if (input.action === 'equip') {
          const eventWeapon=Object.entries(tuLinhWeapons).find(([,w])=>w.id===input.itemId);
          if(eventWeapon&&eventWeapon[0]!==character.class_code)throw fail(403,'Vũ khí Tứ Linh này không dành cho class của bạn.');
          const target = items.find(item => item.id === input.itemId && item.location === 'inventory' && item.quantity > 0);
          if (!target) throw fail(409, 'Trang bị này không có trong túi đồ CSDL.');
          if (equipped?.id === input.itemId) throw fail(409, 'Vật phẩm này đã được trang bị.');

          if (target.quantity > 1) {
            const slot = equipped ? freeInventorySlot(items) : null;
            if (equipped && slot === null) throw fail(409, 'Cần một ô trống trong túi để đổi trang bị.');
            await c.execute(
              'UPDATE character_items SET quantity = quantity - 1 WHERE id = ? AND character_id = ?',
              [target.rowId, character.id],
            );
            if (equipped) {
              await c.execute(
                "UPDATE character_items SET location = 'inventory', slot_key = ? WHERE id = ? AND character_id = ?",
                [slot, equipped.rowId, character.id],
              );
            }
            // Giải phóng ô trang bị cũ trước khi thêm món mới; tránh vi phạm UNIQUE.
            await c.execute(
              "INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'equipment', ?)",
              [character.id, input.itemId, definition],
            );
          } else if (equipped) {
            const temporarySlot = temporaryInventorySlot(items);
            await c.execute(
              "UPDATE character_items SET location = 'inventory', slot_key = ? WHERE id = ? AND character_id = ?",
              [temporarySlot, equipped.rowId, character.id],
            );
            await c.execute(
              "UPDATE character_items SET location = 'equipment', slot_key = ? WHERE id = ? AND character_id = ?",
              [definition, target.rowId, character.id],
            );
            await c.execute(
              "UPDATE character_items SET slot_key = ? WHERE id = ? AND character_id = ?",
              [target.slot, equipped.rowId, character.id],
            );
          } else {
            await c.execute(
              "UPDATE character_items SET location = 'equipment', slot_key = ? WHERE id = ? AND character_id = ?",
              [definition, target.rowId, character.id],
            );
          }
        } else {
          if (!equipped || equipped.id !== input.itemId) throw fail(409, 'Vật phẩm này hiện không được trang bị.');
          const slot = freeInventorySlot(items);
          if (slot === null) throw fail(409, 'Túi đồ đã đầy. Hãy tạo một ô trống trước khi tháo trang bị.');
          await c.execute(
            "UPDATE character_items SET location = 'inventory', slot_key = ? WHERE id = ? AND character_id = ?",
            [slot, equipped.rowId, character.id],
          );
        }

        await c.execute('UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?', [character.id]);
        await c.execute(
          'INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
          [character.id, input.requestId, 'equipment_' + input.action, JSON.stringify({ itemId: input.itemId })],
        );
        return {
          requestId: input.requestId,
          items: (await characterItems(c, character.id)).map(({ rowId, ...item }) => item),
          replayed: false,
        };
      });
    },
  };
}

module.exports = { createInventoryService };