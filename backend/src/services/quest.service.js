const { characterView, reward } = require('./progress.service');
const { randomInt } = require('node:crypto');
const failure = (status, message) => Object.assign(new Error(message), { status });
const dragonRuinsDrops = new Set(['dragon_bone', 'ancient_dragon_scale', 'jade_dragon_core']);
const dragonRuinsDropChance = 0.375;

const objectives = {
  first_steps: {
    event: 'visit',
    target: 3,
    maps: ['village', 'west-forest', 'atlast-lake'],
    label: 'Ghé thăm ba khu vực',
  },
  fishing_atlast_15: {
    event: 'fish',
    target: 15,
    map: 'atlast-lake',
    label: 'Câu cá tại Hồ Atlast',
  },
  hunt_west_forest_20: {
    event: 'monster_kill',
    target: 20,
    map: 'west-forest',
    label: 'Hạ quái tại Khu Rừng Phía Tây',
  },
};

const killRewards = { 'hiuuling-river': { exp: 45, gold: 15 }, 'west-forest': { exp: 30, gold: 10 }, 'noxii-entrance': { exp: 45, gold: 15 }, 'dia-long-forest': { exp: 68, gold: 23 }, 'dragon-ruins': { exp: 102, gold: 35 }, 'autumn-forest': { exp: 30, gold: 10 } };
const questIds = Object.keys(objectives);
const initialProgress = id => objectives[id].event === 'visit' ? { visited: [] } : { count: 0 };
const parseProgress = value => {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
};

function createQuestService(db) {
  async function inventorySnapshot(c, characterId) {
    const [rows] = await c.execute(
      'SELECT item_definition_id, quantity, location, slot_key FROM character_items WHERE character_id = ? AND quantity > 0 ORDER BY id',
      [characterId],
    );
    return rows.map(row => ({
      id: row.item_definition_id,
      quantity: Number(row.quantity),
      location: row.location,
      slot: row.slot_key,
    }));
  }

  async function addDragonRuinsDrop(c, characterId, itemId) {
    const definitions = {
      dragon_bone: ['Mảnh Long Cốt', 'bone', 'Mảnh xương hóa thạch rơi từ Long Cốt Vệ Sĩ tại Phế Tích Địa Long.'],
      ancient_dragon_scale: ['Vảy Địa Long Cổ', 'scale', 'Vảy rồng cổ rơi từ Địa Long Vảy Ngọc tại Phế Tích Địa Long.'],
      jade_dragon_core: ['Ngọc Tủy Long Mạch', 'core', 'Ngọc tủy quý hiếm rơi từ Long Ưng Tàn Tích tại Phế Tích Địa Long.'],
    };
    const [name, icon, description] = definitions[itemId];
    await c.execute(
      "INSERT IGNORE INTO item_definitions (id, name, type, tier, price, max_stack, attack_bonus, icon_key, description, available_in_shop) VALUES (?, ?, 'material', 1, 0, 99, 0, ?, ?, 0)",
      [itemId, name, icon, description],
    );
    const [rows] = await c.execute(
      "SELECT id, quantity, slot_key FROM character_items WHERE character_id = ? AND item_definition_id = ? AND location = 'inventory' ORDER BY id FOR UPDATE",
      [characterId, itemId],
    );
    const stack = rows.find(row => Number(row.quantity) < 99);
    if (stack) {
      await c.execute('UPDATE character_items SET quantity = quantity + 1 WHERE id = ? AND character_id = ?', [stack.id, characterId]);
      return;
    }
    const [occupiedRows] = await c.execute(
      "SELECT slot_key FROM character_items WHERE character_id = ? AND location = 'inventory' FOR UPDATE",
      [characterId],
    );
    const occupied = new Set(occupiedRows.map(row => String(row.slot_key)));
    let slot;
    for (let index = 0; index < 28; index++) {
      if (!occupied.has(String(index))) { slot = String(index); break; }
    }
    if (slot === undefined) throw failure(409, 'Túi đồ đã đầy. Hãy dọn túi trước khi nhặt vật phẩm rơi.');
    await c.execute(
      "INSERT INTO character_items (character_id, item_definition_id, quantity, location, slot_key) VALUES (?, ?, 1, 'inventory', ?)",
      [characterId, itemId, String(slot)],
    );
  }

  async function transaction(fn) {
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      const result = await fn(c);
      await c.commit();
      return result;
    } catch (error) {
      await c.rollback().catch(() => {});
      throw error;
    } finally {
      c.release();
    }
  }

  async function lockCharacter(c, userId) {
    const [rows] = await c.execute(
      'SELECT id, level, exp, gold, gems, hp, mana, progress_version FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',
      [userId],
    );
    if (!rows.length) throw failure(409, 'Hãy tạo nhân vật trước khi sử dụng nhiệm vụ.');
    return rows[0];
  }

  async function ensureQuestRows(c, characterId) {
    const marks = questIds.map(() => '?').join(',');
    const [catalog] = await c.execute(`SELECT id FROM quests WHERE id IN (${marks})`, questIds);
    if (catalog.length !== questIds.length) {
      throw failure(503, 'Thiếu dữ liệu nhiệm vụ trong bảng quests. Hãy kiểm tra các nhiệm vụ đã khởi tạo.');
    }

    for (const id of questIds) {
      await c.execute(
        'INSERT IGNORE INTO character_quests (character_id, quest_id, status, progress) VALUES (?, ?, ?, ?)',
        [characterId, id, 'active', JSON.stringify(initialProgress(id))],
      );
    }
  }

  async function listForCharacter(c, characterId, includeAll = false) {
    const [rows] = await c.execute(
      `SELECT q.id, q.name, q.description, q.reward_exp, q.reward_gold,
              cq.status, cq.progress, cq.claimed_at
       FROM quests q
       JOIN character_quests cq ON cq.quest_id = q.id
       WHERE cq.character_id = ? AND q.id IN (${questIds.map(() => '?').join(',')})
       ORDER BY FIELD(q.id, ${questIds.map(() => '?').join(',')})`,
      [characterId, ...questIds, ...questIds],
    );
    const quests = rows.map(row => {
      const objective = objectives[row.id];
      const progress = parseProgress(row.progress);
      const current = objective.event === 'visit'
        ? new Set(Array.isArray(progress.visited) ? progress.visited : []).size
        : Math.min(objective.target, Math.max(0, Number(progress.count) || 0));
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        reward: { exp: Number(row.reward_exp), gold: Number(row.reward_gold) },
        status: row.status,
        claimedAt: row.claimed_at,
        objective: { label: objective.label, current, target: objective.target },
      };
    });
    return includeAll ? quests : quests.filter(quest => quest.status !== 'claimed').slice(0, 1);
  }

  async function recordEvent(c, characterId, eventType, mapId, eventId) {
    const applicable = questIds.filter(id => {
      const objective = objectives[id];
      return objective.event === eventType &&
        (objective.maps ? objective.maps.includes(mapId) : objective.map === mapId);
    });
    if (!applicable.length) return;

    await ensureQuestRows(c, characterId);
    const [progressRows] = await c.execute(
      `SELECT quest_id, status FROM character_quests
       WHERE character_id = ? AND quest_id IN (${questIds.map(() => '?').join(',')})
       ORDER BY FIELD(quest_id, ${questIds.map(() => '?').join(',')}) FOR UPDATE`,
      [characterId, ...questIds, ...questIds],
    );
    const activeQuest = progressRows.find(row => row.status !== 'claimed');
    if (!activeQuest || !applicable.includes(activeQuest.quest_id) || activeQuest.status !== 'active') return;

    const [insert] = await c.execute(
      'INSERT IGNORE INTO quest_events (character_id, event_id, event_type, map_id) VALUES (?, ?, ?, ?)',
      [characterId, eventId, eventType, mapId],
    );
    if (!insert.affectedRows) return;

    const id = activeQuest.quest_id;
    const [rows] = await c.execute(
      'SELECT status, progress FROM character_quests WHERE character_id = ? AND quest_id = ? FOR UPDATE',
      [characterId, id],
    );
    const row = rows[0];
    if (!row || row.status !== 'active') return;

    const objective = objectives[id];
    const progress = parseProgress(row.progress);
    if (eventType === 'visit') {
      const visited = new Set(Array.isArray(progress.visited) ? progress.visited : []);
      visited.add(mapId);
      progress.visited = [...visited].filter(value => objective.maps.includes(value));
    } else {
      progress.count = Math.min(objective.target, Math.max(0, Number(progress.count) || 0) + 1);
    }

    const current = eventType === 'visit' ? progress.visited.length : progress.count;
    await c.execute(
      'UPDATE character_quests SET progress = ?, status = ? WHERE character_id = ? AND quest_id = ? AND status = ?',
      [JSON.stringify(progress), current >= objective.target ? 'completed' : 'active', characterId, id, 'active'],
    );
  }

  async function load(c, characterId, includeAll = false) {
    await ensureQuestRows(c, characterId);
    return listForCharacter(c, characterId, includeAll);
  }

  return {
    async list(userId) {
      return transaction(async c => {
        const character = await lockCharacter(c, userId);
        return { quests: await load(c, character.id), character: characterView(character) };
      });
    },

    async record(userId, input = {}) {
      const { eventType, mapId, eventId, dropItem } = input;
      if (!['visit', 'monster_kill'].includes(eventType)) throw failure(400, 'Sự kiện nhiệm vụ không hợp lệ.');
      if (typeof eventId !== 'string' || !/^[a-f0-9-]{36}$/i.test(eventId)) throw failure(400, 'Mã sự kiện nhiệm vụ không hợp lệ.');
      if (typeof mapId !== 'string' || !['village', 'west-forest', 'atlast-lake', 'noxii-entrance', 'dia-long-forest', 'dragon-ruins', 'autumn-forest', 'hiuuling-river'].includes(mapId)) {
        throw failure(400, 'Khu vực nhiệm vụ không hợp lệ.');
      }
      if (eventType === 'monster_kill' && !Object.hasOwn(killRewards, mapId)) throw failure(400, 'Không thể ghi nhận hạ quái tại khu vực này.');
      if (dropItem && (eventType !== 'monster_kill' || mapId !== 'dragon-ruins' || !dragonRuinsDrops.has(dropItem))) {
        throw failure(400, 'Vật phẩm rơi không hợp lệ cho khu vực này.');
      }

      return transaction(async c => {
        const character = await lockCharacter(c, userId);
        let awardedDrop = null;
        if (eventType === 'monster_kill') {
          const [receipts] = await c.execute(
            'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
            [character.id, eventId],
          );
          if (receipts.length) {
            const payload = typeof receipts[0].payload === 'string' ? JSON.parse(receipts[0].payload) : receipts[0].payload;
            if (receipts[0].action_type !== 'monster_kill' || payload.mapId !== mapId) {
              throw failure(409, 'Mã sự kiện đã được dùng cho thao tác khác.');
            }
            awardedDrop = payload.dropItem || null;
          } else {
            awardedDrop = mapId === 'dragon-ruins' && dropItem && randomInt(10000) < dragonRuinsDropChance * 10000
              ? dropItem
              : null;
            const [insert] = await c.execute(
              "INSERT IGNORE INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, 'monster_kill', ?)",
              [character.id, eventId, JSON.stringify({ mapId, ...(awardedDrop ? { dropItem: awardedDrop } : {}) })]);
            if (insert.affectedRows) {
              const gains = killRewards[mapId];
              await reward(c, character, gains.exp, gains.gold);
              await recordEvent(c, character.id, eventType, mapId, eventId);
              if (awardedDrop) await addDragonRuinsDrop(c, character.id, awardedDrop);
            }
          }
        }
        return {
          quests: await load(c, character.id),
          character: characterView(character),
          ...(mapId === 'dragon-ruins' && eventType === 'monster_kill'
            ? { dropItem: awardedDrop, items: await inventorySnapshot(c, character.id) }
            : {}),
        };
      });
    },

    async recordFishingCatch(c, characterId, eventId) {
      await recordEvent(c, characterId, 'fish', 'atlast-lake', eventId);
    },

    async listForCharacter(c, characterId) {
      return load(c, characterId);
    },

    async claim(userId, questId) {
      if (!Object.hasOwn(objectives, questId)) throw failure(404, 'Nhiệm vụ không tồn tại.');

      return transaction(async c => {
        const character = await lockCharacter(c, userId);
        const allQuests = await load(c, character.id, true);
        const quest = allQuests.find(item => item.id === questId);
        const currentQuests = allQuests.filter(item => item.status !== 'claimed').slice(0, 1);
        const [progressRows] = await c.execute(
          'SELECT status, claimed_at FROM character_quests WHERE character_id = ? AND quest_id = ? FOR UPDATE',
          [character.id, questId],
        );
        const progress = progressRows[0];
        if (progress.claimed_at || progress.status === 'claimed') {
          return { claimed: true, alreadyClaimed: true, quest, quests: currentQuests, character: characterView(character) };
        }
        if (currentQuests[0]?.id !== questId) throw failure(409, 'Hãy hoàn thành nhiệm vụ hiện tại trước khi nhận nhiệm vụ này.');
        if (progress.status !== 'completed') throw failure(409, 'Nhiệm vụ chưa hoàn thành.');

        await reward(c, character, quest.reward.exp, quest.reward.gold);
        await c.execute(
          "UPDATE character_quests SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP WHERE character_id = ? AND quest_id = ? AND status = 'completed' AND claimed_at IS NULL",
          [character.id, questId],
        );

        const updatedCharacter = character;
        const updatedQuests = await listForCharacter(c, character.id);
        return {
          claimed: true,
          alreadyClaimed: false,
          quest: { ...quest, status: 'claimed' },
          quests: updatedQuests,
          character: characterView(updatedCharacter),
        };
      });
    },
  };
}

module.exports = { createQuestService, killRewards };
