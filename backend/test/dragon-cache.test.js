const test = require('node:test');
const assert = require('node:assert/strict');
const { createEventsService } = require('../src/services/events.service');
const { dragonRewardsForClass } = require('../src/services/inventory.service');

function createDatabase(initialItems = [], classCode = 'mage') {
  const state = {
    character: { id: 7, level: 1, exp: 0, gold: 100, gems: 0, hp: 100, mana: 50, progress_version: 0, class_code: classCode },
    items: initialItems.map((item, index) => ({ rowId: index + 1, location: 'inventory', slot_key: String(index), ...item })),
    receipts: [],
    definitions: new Map(dragonRewardsForClass('mage').map(id => [id, 1])),
    nextItemId: initialItems.length + 1,
    transactionSnapshot: null,
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const connection = {
    async beginTransaction() {
      state.transactionSnapshot = {
        character: clone(state.character),
        items: clone(state.items),
        receipts: clone(state.receipts),
        definitions: new Map(state.definitions),
        nextItemId: state.nextItemId,
      };
    },
    async commit() { state.transactionSnapshot = null; },
    async rollback() {
      if (!state.transactionSnapshot) return;
      Object.assign(state, state.transactionSnapshot);
      state.transactionSnapshot = null;
    },
    release() {},
    async execute(sql, params = []) {
      if (sql.startsWith('SELECT * FROM characters')) return [[{ ...state.character }]];
      if (sql.startsWith('SELECT skill_id FROM character_skill_books')) return [[]];
      if (sql.includes('FROM character_economy_events WHERE character_id = ? AND request_id = ?')) {
        const receipt = state.receipts.find(row => row.requestId === params[1]);
        return [receipt ? [{ action_type: receipt.actionType, payload: JSON.stringify(receipt.payload) }] : []];
      }
      if (sql.includes('FROM character_economy_events WHERE character_id = ? AND action_type IN')) {
        return [state.receipts.map(row => ({ action_type: row.actionType, payload: JSON.stringify(row.payload) }))];
      }
      if (sql.startsWith('SELECT item_definition_id, quantity, location, slot_key FROM character_items')) {
        return [state.items.map(row => ({
          item_definition_id: row.id,
          quantity: row.quantity,
          location: row.location,
          slot_key: row.slot_key,
        }))];
      }
      if (sql.startsWith('SELECT id, item_definition_id, quantity, location FROM character_items')) {
        const ids = params.slice(1);
        return [state.items.filter(row => row.location === 'inventory' && ids.includes(row.id)).map(row => ({
          id: row.rowId,
          item_definition_id: row.id,
          quantity: row.quantity,
          location: row.location,
        }))];
      }
      if (sql.startsWith('SELECT id, item_definition_id, quantity, slot_key FROM character_items')) {
        return [state.items.filter(row => row.location === 'inventory').map(row => ({
          id: row.rowId,
          item_definition_id: row.id,
          quantity: row.quantity,
          slot_key: row.slot_key,
        }))];
      }
      if (sql.startsWith('SELECT id, max_stack FROM item_definitions')) {
        const max_stack = state.definitions.get(params[0]);
        return [max_stack ? [{ id: params[0], max_stack }] : []];
      }
      if (sql.startsWith('INSERT INTO item_definitions')) {
        state.definitions.set(params[0], Number(params[3]));
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('DELETE FROM character_items')) {
        state.items = state.items.filter(row => row.rowId !== params[0]);
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE character_items SET quantity = quantity -')) {
        const row = state.items.find(item => item.rowId === params[1]);
        row.quantity -= params[0];
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE characters SET progress_version')) {
        state.character.progress_version++;
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO character_economy_events')) {
        state.receipts.push({
          requestId: params[1],
          actionType: params[2],
          payload: JSON.parse(params[3]),
        });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO character_items')) {
        state.items.push({
          rowId: state.nextItemId++,
          id: params[1],
          quantity: Number(params[2]),
          location: 'inventory',
          slot_key: params[3],
        });
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
  };
  return { state, getConnection: async () => connection };
}

const requestId = suffix => `123e4567-e89b-42d3-a456-426614174${suffix}`;
const npcPosition = { mapId: 'dragon-ruins', x: 696, feetY: 1416 };

test('exchanging 50 mixed ruins materials awards one replay-safe key', async () => {
  const db = createDatabase([
    { id: 'dragon_bone', quantity: 20 },
    { id: 'ancient_dragon_scale', quantity: 15 },
    { id: 'jade_dragon_core', quantity: 15 },
  ]);
  const service = createEventsService(db);
  const input = { requestId: requestId('001'), position: npcPosition };

  const result = await service.exchangeDragonKey(1, input);
  assert.equal(result.events.find(event => event.id === 'dragon-cache').keyCount, 1);
  assert.equal(result.items.reduce((sum, item) => sum + item.quantity, 0), 0);

  const replay = await service.exchangeDragonKey(1, input);
  assert.equal(replay.replayed, true);
  assert.equal(replay.events.find(event => event.id === 'dragon-cache').keyCount, 1);
  assert.equal(db.state.receipts.length, 1);
});

test('spinning consumes one key and replay returns the same class-compatible reward', async () => {
  const db = createDatabase([{ id: 'dragon_bone', quantity: 50 }]);
  const service = createEventsService(db);
  await service.exchangeDragonKey(1, { requestId: requestId('002'), position: npcPosition });
  const spin = { requestId: requestId('004') };

  const result = await service.spinDragonCache(1, spin);
  assert.ok(dragonRewardsForClass('mage').includes(result.rewardId));
  assert.equal(result.events.find(event => event.id === 'dragon-cache').keyCount, 0);
  assert.ok(result.items.some(item => item.id === result.rewardId));

  const replay = await service.spinDragonCache(1, spin);
  assert.equal(replay.replayed, true);
  assert.equal(replay.rewardId, result.rewardId);
  assert.equal(db.state.receipts.filter(row => row.actionType === 'dragon_cache_spin').length, 1);
});

test('key exchange and spin reject insufficient materials or keys without changing inventory', async () => {
  const db = createDatabase([{ id: 'dragon_bone', quantity: 49 }]);
  const service = createEventsService(db);

  await assert.rejects(service.exchangeDragonKey(1, { requestId: requestId('005'), position: npcPosition }), error => error.status === 409);
  assert.equal(db.state.items[0].quantity, 49);
  await assert.rejects(service.spinDragonCache(1, { requestId: requestId('006') }), error => error.status === 409);
  assert.equal(db.state.receipts.length, 0);
});

test('key exchange requires the player to be beside the ruins smith', async () => {
  const db = createDatabase([{ id: 'dragon_bone', quantity: 50 }]);
  const service = createEventsService(db);

  await assert.rejects(
    service.exchangeDragonKey(1, {
      requestId: requestId('007'),
      position: { mapId: 'village', x: 696, feetY: 1416 },
    }),
    error => error.status === 409,
  );
  assert.equal(db.state.items[0].quantity, 50);
  assert.equal(db.state.receipts.length, 0);
});
