// applyScenarioObjectPosition (core/rooms.js): a room object built from its scenario
// position. Tile x/y stay room-relative and win; a stored px/py (the world-pixel centre
// an NPC put-down or KO drop writes to objects_added) places the sprite there instead of
// leaving it at the random fallback spot (NPC carried items slice C, T1/T2 live run).
// The helper is sliced out of the source, because rooms.js needs Phaser.
// Run with: node test/js/room-object-position.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/core/rooms.js');
const src = readFileSync(file, 'utf8');
const start = src.indexOf('function applyScenarioObjectPosition(');
const end = src.indexOf('function createSpriteAtRandomPosition(');
assert.ok(start > 0 && end > start, 'could not find applyScenarioObjectPosition');
const place = new Function('TILE_SIZE', `${src.slice(start, end)}; return applyScenarioObjectPosition;`)(32);

// A sprite as createSpriteAtRandomPosition leaves it: somewhere random, origin top-left.
const sprite = () => ({ x: 999, y: 777, displayWidth: 32, displayHeight: 24 });
const room = { x: 640, y: 320 };

test('tile x/y are room-relative pixels, as before', () => {
    const s = sprite();
    place(s, { x: 4, y: 7 }, room);
    assert.deepEqual([s.x, s.y], [640 + 128, 320 + 224]);
});

test('a put-down px/py centre places the top-left half a sprite up and left, in world pixels', () => {
    const s = sprite();
    place(s, { px: 131.41557368075246, py: 221.28486531259992 }, room);
    assert.deepEqual([s.x, s.y], [Math.round(131.41557368075246 - 16), Math.round(221.28486531259992 - 12)]);
    // the room origin is not added: px/py are absolute
    assert.ok(s.x < room.x);
});

test('tile x/y win over px/py when both are present', () => {
    const s = sprite();
    place(s, { x: 1, y: 2, px: 5, py: 5 }, room);
    assert.deepEqual([s.x, s.y], [672, 384]);
});

test('a half or non-finite px/py leaves the fallback position alone', () => {
    for (const pos of [{ px: 10 }, { py: 10 }, { px: 'x', py: 3 }, { px: NaN, py: 1 }, { px: Infinity, py: 1 }, {}]) {
        const s = sprite();
        place(s, pos, room);
        assert.deepEqual([s.x, s.y], [999, 777], JSON.stringify(pos));
    }
});

test('no position, a string position or no sprite changes nothing and does not throw', () => {
    const s = sprite();
    place(s, undefined, room);
    place(s, null, room);
    place(s, 'as-type:desk', room);
    place(null, { px: 1, py: 1 }, room);
    assert.deepEqual([s.x, s.y], [999, 777]);
});

test('elevation alone (no coordinates) keeps the fallback position', () => {
    const s = sprite();
    place(s, { elevation: 30 }, room);
    assert.deepEqual([s.x, s.y], [999, 777]);
});
