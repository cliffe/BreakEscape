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
const start = src.indexOf('function roomPixelSize(');
const end = src.indexOf('function createSpriteAtRandomPosition(');
assert.ok(start > 0 && end > start, 'could not find applyScenarioObjectPosition');
const [placeRaw, roomPixelSize] = new Function('TILE_SIZE',
    `${src.slice(start, end)}; return [applyScenarioObjectPosition, roomPixelSize];`)(32);
// A 20x15 tile room at (640, 320): world rectangle x 640..1280, y 320..800.
const size = roomPixelSize({ json: { width: 20, height: 15 } });
const place = (s, pos, r) => placeRaw(s, pos, r, size);

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
    place(s, { px: 931.4, py: 521.3 }, room);
    assert.deepEqual([s.x, s.y], [Math.round(931.4 - 16), Math.round(521.3 - 12)]);
    // the room origin is not added: px/py are absolute
    assert.ok(s.x > room.x && s.x < room.x + size.width);
});

test('tile x/y win over px/py when both are present', () => {
    const s = sprite();
    place(s, { x: 1, y: 2, px: 900, py: 500 }, room);
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

test('room size comes from the map in tiles, with the 10 tile fallback', () => {
    assert.deepEqual(size, { width: 640, height: 480 });
    assert.deepEqual(roomPixelSize({ data: { width: 4, height: 3 } }), { width: 128, height: 96 });
    assert.deepEqual(roomPixelSize({ width: 5, height: 6 }), { width: 160, height: 192 });
    assert.deepEqual(roomPixelSize(undefined), { width: 320, height: 320 });
});

test('px/py outside the owning room keeps the fallback position', () => {
    for (const pos of [{ px: 90000, py: 90000 }, { px: 131, py: 221 }, { px: 900, py: 100 },
                       { px: 1300, py: 500 }, { px: -50, py: -50 }, { px: 900, py: 801 }]) {
        const s = sprite();
        place(s, pos, room);
        assert.deepEqual([s.x, s.y], [999, 777], JSON.stringify(pos));
    }
});

test('px/py inside another room\'s area is refused for this room', () => {
    // a neighbouring room sits at (1280, 320); a put-down centre there belongs to it
    const s = sprite();
    place(s, { px: 1400, py: 500 }, room);
    assert.deepEqual([s.x, s.y], [999, 777]);
    const t = sprite();
    placeRaw(t, { px: 1400, py: 500 }, { x: 1280, y: 320 }, size);
    assert.deepEqual([t.x, t.y], [Math.round(1400 - 16), Math.round(500 - 12)]);
});

test('px/py on the room edge is inside; non-finite stays refused with a room size', () => {
    const s = sprite();
    place(s, { px: 640, py: 320 }, room);
    assert.deepEqual([s.x, s.y], [640 - 16, 320 - 12]);
    const n = sprite();
    place(n, { px: NaN, py: 500 }, room);
    assert.deepEqual([n.x, n.y], [999, 777]);
});

test('tile x/y outside the room keep the fallback position (m1)', () => {
    for (const pos of [{ x: 99999, y: 3 }, { x: 3, y: 99999 }, { x: -1, y: 3 }, { x: 21, y: 3 }, { x: NaN, y: 3 }]) {
        const s = sprite();
        place(s, pos, room);
        assert.deepEqual([s.x, s.y], [999, 777], JSON.stringify(pos));
    }
    const edge = sprite();
    place(edge, { x: 20, y: 15 }, room);
    assert.deepEqual([edge.x, edge.y], [640 + 640, 320 + 480], 'the far edge is inside');
});

test('px inside the room with a non-finite py keeps the fallback position (m4c)', () => {
    for (const py of [Infinity, undefined, 'x']) {
        const s = sprite();
        place(s, { px: 900, py }, room);
        assert.deepEqual([s.x, s.y], [999, 777], String(py));
    }
});

test('createSpriteAtRandomPosition takes its room size from roomPixelSize (m3)', () => {
    const body = src.slice(end, src.indexOf('\n}\n', end));
    assert.match(body, /roomPixelSize\(map\)/);
    assert.doesNotMatch(body, /map\.json|map\.data|10 \* TILE_SIZE/);
});

test('without a room size, px/py is not trusted', () => {
    const s = sprite();
    placeRaw(s, { px: 900, py: 500 }, room);
    assert.deepEqual([s.x, s.y], [999, 777]);
});

// m3: the unit tests above run the helper in isolation, so also pin the call sites. Both
// createRoom branches (matched Tiled item, random fallback) must call it, after the sprite
// exists and before the sprite is placed or stored. Source-level check: rooms.js needs
// Phaser, so createRoom itself cannot run under node.
test('both createRoom branches call applyScenarioObjectPosition before placing the sprite', () => {
    const calls = [...src.matchAll(/applyScenarioObjectPosition\(sprite, scenarioObj\.position, position, roomPixelSize\(map\)\);/g)];
    assert.equal(calls.length, 2, 'one call per createRoom branch');
    const [matched, fallback] = calls.map(m => m.index);
    const before = (idx, createRe, afterRe) => {
        const created = src.lastIndexOf(createRe, idx);
        const placed = src.indexOf(afterRe, idx);
        assert.ok(created > 0 && created < idx, `${createRe} precedes the call`);
        assert.ok(placed > idx, `${afterRe} follows the call`);
    };
    before(matched, 'sprite = createSpriteFromMatch(', 'placeMatchedScenarioItem(');
    before(fallback, 'sprite = createSpriteAtRandomPosition(', 'setDepthAndStore(sprite');
});
