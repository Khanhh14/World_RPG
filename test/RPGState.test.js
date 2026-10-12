import assert from 'node:assert/strict';
import test from 'node:test';
import { RPGState } from '../src/game/systems/RPGState.js';

class MemoryStorage {
    values = new Map();
    getItem(key) { return this.values.get(key) ?? null; }
    setItem(key, value) { this.values.set(key, value); }
}

test('saves and restores progress separately for each account', () => {
    const storage = new MemoryStorage();
    const userOne = new RPGState(storage, 'user-1');
    userOne.addGold(125);
    userOne.addExperience(100);

    const userTwo = new RPGState(storage, 'user-2');
    assert.equal(userTwo.data.gold, 50);
    assert.equal(userTwo.data.level, 1);

    userTwo.addItem('health_potion', 1);

    const restoredUserOne = new RPGState(storage, 'user-1');
    assert.equal(restoredUserOne.data.gold, 175);
    assert.equal(restoredUserOne.data.level, 2);
    assert.equal(restoredUserOne.data.inventory.health_potion, 5);

    const restoredUserTwo = new RPGState(storage, 'user-2');
    assert.equal(restoredUserTwo.data.gold, 50);
    assert.equal(restoredUserTwo.data.inventory.health_potion, 6);
});

test('does not load the old unscoped save for a new account', () => {
    const storage = new MemoryStorage();
    storage.setItem('tiny-rpg-progress-v1', JSON.stringify({
        version: 2,
        gold: 999999,
        level: 100,
        inventory: { iron_sword: 99 },
    }));

    const state = new RPGState(storage, 'new-user');
    assert.equal(state.data.gold, 50);
    assert.equal(state.data.level, 1);
    assert.equal(state.data.inventory.iron_sword, 1);
});

test('requires an account ID before constructing persistent game state', () => {
    assert.throws(() => new RPGState(new MemoryStorage()), /ID tài khoản/);
});

test('selects state using the authenticated account in the scene registry', () => {
    const storage = new MemoryStorage();
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    const values = new Map([['auth-user', { id: 'user-1' }]]);
    const registry = {
        get: key => values.get(key),
        set: (key, value) => values.set(key, value),
    };
    const scene = { registry };

    try {
        const userOne = RPGState.forScene(scene);
        userOne.addGold(25);
        registry.set('auth-user', { id: 'user-2' });
        const userTwo = RPGState.forScene(scene);

        assert.equal(userTwo.data.gold, 50);
        assert.notEqual(userTwo, userOne);
        registry.set('auth-user', { id: 'user-1' });
        assert.equal(RPGState.forScene(scene).data.gold, 75);
    } finally {
        if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
        else delete globalThis.localStorage;
    }
});
