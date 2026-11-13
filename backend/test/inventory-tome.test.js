const test = require('node:test');
const assert = require('node:assert/strict');
const { createInventoryService } = require('../src/services/inventory.service');

function createDatabase(initialItems) {
  const state = {
    character: { id: 7, progress_version: 0 },
    items: initialItems.map(item => ({ ...item })),
    levels: new Map(),
    receipts: new Map(),
    transactionSnapshot: null,
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const connection = {
    async beginTransaction() {
      state.transactionSnapshot = {
        character: clone(state.character),
        items: clone(state.items),
        levels: new Map(state.levels),
        receipts: new Map(state.receipts),
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
      if (sql.includes('SELECT action_type, payload FROM character_economy_events')) {
        const receipt = state.receipts.get(params[1]);
        return [receipt ? [{ action_type: receipt.actionType, payload: JSON.stringify(receipt.payload) }] : []];
      }
      if (sql.startsWith('INSERT IGNORE INTO character_tome_progress')) {
        if (!state.levels.has(params[1])) state.levels.set(params[1], 1);
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('SELECT level FROM character_tome_progress')) {
        const level = state.levels.get(params[1]);
        return [level === undefined ? [] : [{ level }]];
      }
      if (sql.startsWith('SELECT tome_id, level FROM character_tome_progress')) {
        return [[...state.levels].map(([tome_id, level]) => ({ tome_id, level }))];
      }
      if (sql.includes('FROM character_items ci WHERE')) {
        return [state.items.map(item => ({ ...item }))];
      }
      if (sql.startsWith('DELETE FROM character_items')) {
        state.items = state.items.filter(item => item.id !== params[0]);
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE character_items SET quantity = quantity -')) {
        const item = state.items.find(row => row.id === params[1]);
        item.quantity -= params[0];
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE character_tome_progress SET level = level + 1')) {
        state.levels.set(params[1], state.levels.get(params[1]) + 1);
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('UPDATE characters SET progress_version')) {
        state.character.progress_version++;
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO character_economy_events')) {
        state.receipts.set(params[1], {
          actionType: params[2],
          payload: JSON.parse(params[3]),
        });
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
  };
  return { state, getConnection: async () => connection };
}

test('upgrading consumes two duplicate copies and keeps the tome equipped', async () => {
  const db = createDatabase([
    { id: 1, item_definition_id: 'tome_wind', quantity: 1, location: 'equipment', slot_key: 'tome:tome_wind' },
    { id: 2, item_definition_id: 'tome_wind', quantity: 2, location: 'inventory', slot_key: '0' },
  ]);
  const service = createInventoryService(db);
  const input = {
    tomeId: 'tome_wind',
    expectedLevel: 1,
    requestId: '123e4567-e89b-42d3-a456-426614174000',
  };

  const result = await service.upgradeTome(1, input);
  assert.deepEqual(result.tomeLevels, { tome_wind: 2 });
  assert.deepEqual(result.items, [
    { id: 'tome_wind', quantity: 1, location: 'equipment', slot: 'tome:tome_wind' },
  ]);
  assert.equal(db.state.character.progress_version, 1);

  const replay = await service.upgradeTome(1, input);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.tomeLevels, { tome_wind: 2 });
  assert.equal(db.state.character.progress_version, 1);
});

test('upgrade requires three owned copies and leaves inventory unchanged on failure', async () => {
  const db = createDatabase([
    { id: 1, item_definition_id: 'tome_chain', quantity: 2, location: 'inventory', slot_key: '0' },
  ]);
  const service = createInventoryService(db);

  await assert.rejects(
    service.upgradeTome(1, {
      tomeId: 'tome_chain',
      expectedLevel: 1,
      requestId: '123e4567-e89b-42d3-a456-426614174001',
    }),
    error => error.status === 409,
  );
  assert.deepEqual(db.state.items, [
    { id: 1, item_definition_id: 'tome_chain', quantity: 2, location: 'inventory', slot_key: '0' },
  ]);
  assert.equal(db.state.levels.size, 0);
});
