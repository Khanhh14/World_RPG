const { characterView, reward } = require('./progress.service');
const failure = (status, message) => Object.assign(new Error(message), { status });

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

const killRewards = { 'hiuuling-river': { exp: 45, gold: 15 }, 'west-forest': { exp: 30, gold: 10 }, 'noxii-entrance': { exp: 45, gold: 15 }, 'dia-long-forest': { exp: 68, gold: 23 }, 'autumn-forest': { exp: 30, gold: 10 } };
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
      const { eventType, mapId, eventId } = input;
      if (!['visit', 'monster_kill'].includes(eventType)) throw failure(400, 'Sự kiện nhiệm vụ không hợp lệ.');
      if (typeof eventId !== 'string' || !/^[a-f0-9-]{36}$/i.test(eventId)) throw failure(400, 'Mã sự kiện nhiệm vụ không hợp lệ.');
      if (typeof mapId !== 'string' || !['village', 'west-forest', 'atlast-lake', 'noxii-entrance', 'dia-long-forest', 'autumn-forest', 'hiuuling-river'].includes(mapId)) {
        throw failure(400, 'Khu vực nhiệm vụ không hợp lệ.');
      }
      if (eventType === 'monster_kill' && !Object.hasOwn(killRewards, mapId)) throw failure(400, 'Không thể ghi nhận hạ quái tại khu vực này.');

      return transaction(async c => {
        const character = await lockCharacter(c, userId);
        if (eventType === 'monster_kill') {
          // Khóa nhân vật phía trên + UNIQUE trong DB ngăn nhận thưởng hai lần.
          const [insert] = await c.execute(
            "INSERT IGNORE INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, 'monster_kill', ?)",
            [character.id, eventId, JSON.stringify({ mapId })]);
          if (insert.affectedRows) {
            const gains = killRewards[mapId];
            await reward(c, character, gains.exp, gains.gold);
            await recordEvent(c, character.id, eventType, mapId, eventId);
          }
        } else {
          await recordEvent(c, character.id, eventType, mapId, eventId);
        }
        return { quests: await load(c, character.id), character: characterView(character) };
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

module.exports = { createQuestService };
