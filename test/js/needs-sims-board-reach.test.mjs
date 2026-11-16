// test_needs_sims: the Activity Board must be readable from the floor in front of it.
// The board hangs on the back wall (sprite 40 x 52 at 210,13, top-left origin) and the lowest
// the player can stand there is about y 49 to 52 (feet 80 to 83), so measured to the board's top
// edge (y 13) the player is 36 to 39 px away against a 32 px reach and a tap only walks. The
// board is marked "wallMounted", so reach is measured to the part of it level with the player.
// Without the mark the board's two object_interacted mappings (caffeine 10 for Amara and Tom) never
// fire, and the tour's row 3 queue does not form (the tour counts a stray event as the read).
//
// Run with: node test/js/needs-sims-board-reach.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reachX, reachY } from '../../public/break_escape/js/systems/interaction-reach.js';

const here = dirname(fileURLToPath(import.meta.url));
const scenario = JSON.parse(readFileSync(join(here, '../../scenarios/test_needs_sims/scenario.json.erb'), 'utf8'));
const board = Object.values(scenario.rooms).flatMap(r => r.objects || []).find(o => o.id === 'activity_board');
const RANGE = 32; // INTERACTION_RANGE (utils/constants.js)

// The board as the engine places it: top-left origin at (210, 13), 40 x 52
const sprite = { x: 210, y: 13, displayWidth: 40, displayHeight: 52, originX: 0, originY: 0, scenarioData: board };
const distFrom = (px, py) => Math.hypot(reachX(sprite, px) - px, reachY(sprite, py) - py);

test('the Activity Board is marked wallMounted', () => {
    assert.equal(board.wallMounted, true);
});

test('the lowest stand points in front of the board are within reach', () => {
    for (const [px, py] of [[217, 49], [217, 52], [230, 52], [245, 52]]) {
        assert.ok(distFrom(px, py) <= RANGE, `(${px},${py}) is ${distFrom(px, py)} away`);
    }
});

test('the same board unmarked is out of reach from there (the old behaviour)', () => {
    const plain = { ...sprite, scenarioData: { ...board, wallMounted: false } };
    const d = Math.hypot(reachX(plain, 217) - 217, reachY(plain, 52) - 52);
    assert.ok(d > RANGE, `unmarked distance ${d}`);
});

test('a player far from the board is still out of reach', () => {
    assert.ok(distFrom(217, 140) > RANGE);
});
