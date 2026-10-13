import assert from 'node:assert/strict';
import test from 'node:test';
import { Player } from '../src/game/entities/Player.js';

test('maps the starter axe to its visible sprite frame', () => {
    assert.equal(Player.prototype.getWeaponFrame.call({}, 'starter_axe'), 118);
});
