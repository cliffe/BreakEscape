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

// m2 (R4): the Deadline Memo (notice_board1, 8.1875 x 0.6875 tiles, sprite 42 x 31) hangs on the same back
// wall and is marked wallMounted so its caffeine 20 mapping is reached by measuring to the part of the
// sprite level with the player. Note: the memo's top edge (y 22) is 30 px above the lowest stand point
// (y 52), so unmarked it is just inside the 32 px reach there; the mark is what keeps it in reach for
// every stand point along the sprite's height and any later nudge of the wall art, so the test pins the
// mark and the marked distances, and shows the unmarked distance is never shorter.
const memo = Object.values(scenario.rooms).flatMap(r => r.objects || []).find(o => o.id === 'deadline_memo');
const TILE = 32;
const memoSprite = { x: memo.position.x * TILE, y: memo.position.y * TILE, displayWidth: 42, displayHeight: 31, originX: 0, originY: 0, scenarioData: memo };

test('the Deadline Memo is marked wallMounted', () => {
    assert.ok(memo, 'deadline_memo exists');
    assert.equal(memo.wallMounted, true);
});

test('the Deadline Memo is within reach from the floor in front of it, and the mark never lengthens the reach', () => {
    const plain = { ...memoSprite, scenarioData: { ...memo, wallMounted: false } };
    const dist = (s, px, py) => Math.hypot(reachX(s, px) - px, reachY(s, py) - py);
    for (const [dx, py] of [[10, 49], [10, 52], [30, 52], [30, 40]]) {
        const px = memoSprite.x + dx;
        assert.ok(dist(memoSprite, px, py) <= RANGE, `(${px},${py}) is ${dist(memoSprite, px, py)} away`);
        assert.ok(dist(memoSprite, px, py) <= dist(plain, px, py));
    }
    assert.ok(dist(memoSprite, memoSprite.x + 10, 140) > RANGE, 'far away is still out of reach');
});
