import test from 'node:test';
import assert from 'node:assert/strict';
import { reachX } from '../../public/break_escape/js/systems/interaction-reach.js';

// A 42px-wide scenario object with a top-left origin, like sis02's wall panel.
const panel = { x: 385, y: 14, displayWidth: 42, originX: 0, scenarioData: {} };

test('standing below the right half measures to that part of the object', () => {
    assert.equal(reachX(panel, 418), 418);
    assert.equal(reachX(panel, 406), 406);
});

test('standing beyond either end measures to the nearest edge', () => {
    assert.equal(reachX(panel, 300), 385);
    assert.equal(reachX(panel, 500), 427);
});

test('a centred origin is respected', () => {
    const o = { x: 100, y: 0, displayWidth: 40, originX: 0.5, scenarioData: {} };
    assert.equal(reachX(o, 0), 80);
    assert.equal(reachX(o, 500), 120);
});

test('NPCs, doors and sprites without scenario data keep their own x', () => {
    assert.equal(reachX({ ...panel, _isNPC: true }, 418), 385);
    assert.equal(reachX({ ...panel, doorProperties: {} }, 418), 385);
    assert.equal(reachX({ ...panel, scenarioData: undefined }, 418), 385);
});

test('no width or no player x falls back to the sprite x', () => {
    assert.equal(reachX({ ...panel, displayWidth: 0 }, 418), 385);
    assert.equal(reachX(panel, NaN), 385);
});

import { aimX } from '../../public/break_escape/js/systems/interaction-reach.js';

test('aimX is the horizontal centre of the object', () => {
    assert.equal(aimX(panel), 406);
    assert.equal(aimX({ x: 100, displayWidth: 40, originX: 0.5, scenarioData: {} }), 100);
    assert.equal(aimX({ ...panel, _isNPC: true }), 385);
});

test('a rotated prop spans its rotated bounds', () => {
    const rot = { x: 385, y: 14, displayWidth: 42, originX: 0, rotation: 1.57, scenarioData: {},
        getBounds: () => ({ left: 350, right: 385, width: 35, centerX: 367.5 }) };
    assert.equal(reachX(rot, 300), 350);
    assert.equal(reachX(rot, 370), 370);
    assert.equal(reachX(rot, 500), 385);
    assert.equal(aimX(rot), 367.5);
});
