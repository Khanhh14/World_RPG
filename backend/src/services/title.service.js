const catalog = require('../config/titles.json');
const { characterView } = require('./progress.service');
const fail = (status, message) => Object.assign(new Error(message), { status });
const titles = new Map(catalog.titles.map(title => [title.id, title]));
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value);

function validateInput(input = {}) {
  const { action, titleId, requestId, position } = input;
  if (!['buy', 'equip', 'unequip'].includes(action) || !titles.has(titleId)) {
    throw fail(400, 'Danh hiệu hoặc thao tác không hợp lệ.');
  }
  if (!uuid(requestId)) throw fail(400, 'Mã giao dịch không hợp lệ.');
  if (action === 'buy' && (!position || position.mapId !== 'village'
    || !Number.isFinite(position.x) || !Number.isFinite(position.feetY)
    || Math.hypot(position.x - 360, position.feetY - 576) > 100)) {
    throw fail(409, 'Hãy đến gặp Trưởng làng để mua danh hiệu.');
  }
  return { action, titleId, requestId };
}

async function createTitleSchema(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS character_titles (
    character_id BIGINT UNSIGNED NOT NULL,
    title_id VARCHAR(64) NOT NULL,
    equipped TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, title_id),
    INDEX idx_character_titles_equipped (character_id, equipped)
  ) ENGINE=InnoDB`);
}

async function snapshot(c, char) {
  const [rows] = await c.execute(
    'SELECT title_id, equipped FROM character_titles WHERE character_id = ? ORDER BY created_at, title_id',
    [char.id],
  );
  const ownedTitles = rows.map(row => row.title_id);
  return {
    character: characterView(char),
    titles: ownedTitles,
    equippedTitle: rows.find(row => Number(row.equipped) === 1)?.title_id ?? null,
  };
}

function createTitleService(db) {
  return {
    async mutate(userId, input = {}) {
      const request = validateInput(input);
      const c = await db.getConnection();
      try {
        await c.beginTransaction();
        const [characters] = await c.execute(
          'SELECT * FROM characters WHERE user_id = ? ORDER BY id LIMIT 1 FOR UPDATE',
          [userId],
        );
        const char = characters[0];
        if (!char) throw fail(409, 'Hãy tạo nhân vật trước.');

        const [receipts] = await c.execute(
          'SELECT action_type, payload FROM character_economy_events WHERE character_id = ? AND request_id = ?',
          [char.id, request.requestId],
        );
        const actionType = `title_${request.action}`;
        if (receipts.length) {
          const previous = typeof receipts[0].payload === 'string'
            ? JSON.parse(receipts[0].payload) : receipts[0].payload;
          if (receipts[0].action_type !== actionType || previous.titleId !== request.titleId) {
            throw fail(409, 'Mã giao dịch đã được dùng cho thao tác khác.');
          }
          const result = await snapshot(c, char);
          await c.commit();
          return { ...result, replayed: true };
        }

        const [owned] = await c.execute(
          'SELECT title_id, equipped FROM character_titles WHERE character_id = ? AND title_id = ? FOR UPDATE',
          [char.id, request.titleId],
        );
        if (request.action === 'buy') {
          if (owned.length) throw fail(409, 'Bạn đã sở hữu danh hiệu này.');
          if (Number(char.gold) < catalog.cost.gold || Number(char.gems) < catalog.cost.gems) {
            throw fail(409, 'Cần 10.000 vàng và 500 đá quý để mua danh hiệu.');
          }
          await c.execute(
            'UPDATE characters SET gold = gold - ?, gems = gems - ? WHERE id = ?',
            [catalog.cost.gold, catalog.cost.gems, char.id],
          );
          await c.execute(
            'INSERT INTO character_titles (character_id, title_id, equipped) VALUES (?, ?, 0)',
            [char.id, request.titleId],
          );
          char.gold = Number(char.gold) - catalog.cost.gold;
          char.gems = Number(char.gems) - catalog.cost.gems;
        } else {
          if (!owned.length) throw fail(403, 'Bạn chưa sở hữu danh hiệu này.');
          if (request.action === 'unequip' && Number(owned[0].equipped) !== 1) {
            throw fail(409, 'Danh hiệu này hiện chưa được trang bị.');
          }
          if (request.action === 'equip') {
            await c.execute('UPDATE character_titles SET equipped = 0 WHERE character_id = ?', [char.id]);
            await c.execute(
              'UPDATE character_titles SET equipped = 1 WHERE character_id = ? AND title_id = ?',
              [char.id, request.titleId],
            );
          } else {
            await c.execute(
              'UPDATE character_titles SET equipped = 0 WHERE character_id = ? AND title_id = ?',
              [char.id, request.titleId],
            );
          }
        }

        await c.execute(
          'UPDATE characters SET progress_version = progress_version + 1 WHERE id = ?',
          [char.id],
        );
        char.progress_version = Number(char.progress_version || 0) + 1;
        await c.execute(
          'INSERT INTO character_economy_events (character_id, request_id, action_type, payload) VALUES (?, ?, ?, ?)',
          [char.id, request.requestId, actionType, JSON.stringify({ titleId: request.titleId })],
        );
        const result = await snapshot(c, char);
        await c.commit();
        return { ...result, replayed: false };
      } catch (error) {
        await c.rollback().catch(() => {});
        throw error;
      } finally {
        c.release();
      }
    },
  };
}

module.exports = { createTitleSchema, createTitleService, validateInput };
