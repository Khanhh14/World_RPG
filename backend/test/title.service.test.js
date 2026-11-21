const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../src/config/titles.json');
const { createTitleService, validateInput } = require('../src/services/title.service');

function createDatabase() {
  const character = {
    id: 7, level: 12, exp: 34, gold: 30000, gems: 1500,
    hp: 1200, mana: 600, progress_version: 0,
  };
  const owned = [];
  const receipts = [];
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(sql, params = []) {
      if (sql.startsWith('SELECT * FROM characters')) return [[{ ...character }]];
      if (sql.includes('FROM character_economy_events')) {
        return [receipts.filter(item => item.character_id === params[0] && item.request_id === params[1])];
      }
      if (sql.includes('AND title_id = ? FOR UPDATE')) {
        return [owned.filter(item => item.character_id === params[0] && item.title_id === params[1]).map(item => ({ ...item }))];
      }
      if (sql.includes('FROM character_titles WHERE character_id = ? ORDER BY')) {
        return [owned.filter(item => item.character_id === params[0]).map(item => ({ ...item }))];
      }
      if (sql.startsWith('UPDATE characters SET gold = gold -')) {
        character.gold -= params[0];
        character.gems -= params[1];
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE characters SET progress_version')) {
        character.progress_version++;
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO character_titles')) {
        owned.push({ character_id: params[0], title_id: params[1], equipped: params[2] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE character_titles SET equipped = 0 WHERE character_id = ? AND title_id')) {
        const row = owned.find(item => item.character_id === params[0] && item.title_id === params[1]);
        if (row) row.equipped = 0;
        return [{ affectedRows: row ? 1 : 0 }];
      }
      if (sql.startsWith('UPDATE character_titles SET equipped = 0')) {
        for (const row of owned) if (row.character_id === params[0]) row.equipped = 0;
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE character_titles SET equipped = 1')) {
        const row = owned.find(item => item.character_id === params[0] && item.title_id === params[1]);
        if (row) row.equipped = 1;
        return [{ affectedRows: row ? 1 : 0 }];
      }
      if (sql.startsWith('INSERT INTO character_economy_events')) {
        receipts.push({
          character_id: params[0], request_id: params[1],
          action_type: params[2], payload: params[3],
        });
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL in test double: ${sql}`);
    },
  };
  return {
    getConnection: async () => connection,
    character,
    owned,
  };
}

const position = { mapId: 'village', x: 360, feetY: 576 };
const requestId = suffix => `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;

test('title catalog uses meaningful four-word Han-Viet titles and the requested price', () => {
  assert.deepEqual(catalog.cost, { gold: 10000, gems: 500 });
  assert(catalog.titles.length >= 4);
  for (const title of catalog.titles) assert.equal(title.name.trim().split(/\s+/).length, 4);
});

test('purchases require the village elder and a valid title', () => {
  const valid = { action: 'buy', titleId: catalog.titles[0].id, requestId: requestId(1), position };
  assert.deepEqual(validateInput(valid), { action: 'buy', titleId: valid.titleId, requestId: valid.requestId });
  assert.throws(() => validateInput({ ...valid, titleId: 'not-a-title' }), { status: 400 });
  assert.throws(() => validateInput({ ...valid, position: { ...position, x: 900 } }), { status: 409 });
  assert.throws(() => validateInput({ ...valid, requestId: 'invalid' }), { status: 400 });
});

test('title purchase is charged once and only one owned title can be equipped', async () => {
  const db = createDatabase();
  const service = createTitleService(db);
  const first = catalog.titles[0].id, second = catalog.titles[1].id;
  const purchase = { action: 'buy', titleId: first, requestId: requestId(2), position };
  const result = await service.mutate('user', purchase);
  assert.equal(result.character.gold, 20000);
  assert.equal(result.character.gems, 1000);
  assert.deepEqual(result.titles, [first]);
  const replay = await service.mutate('user', purchase);
  assert.equal(replay.replayed, true);
  assert.equal(replay.character.gold, 20000);

  await service.mutate('user', { action: 'buy', titleId: second, requestId: requestId(3), position });
  await service.mutate('user', { action: 'equip', titleId: first, requestId: requestId(4) });
  const equipped = await service.mutate('user', { action: 'equip', titleId: second, requestId: requestId(5) });
  assert.equal(equipped.equippedTitle, second);
  assert.equal(db.owned.filter(item => item.equipped === 1).length, 1);
});
