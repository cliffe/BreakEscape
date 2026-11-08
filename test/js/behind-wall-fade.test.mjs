// Behind-the-wall fade, slice 1: detection (planning_notes/behind_wall_fade/DESIGN.md §2).
// Run with: node test/js/behind-wall-fade.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const mod = await import(dataUrl(readFileSync(join(js, 'systems/behind-wall-fade.js'), 'utf8')));
const { backWallStrip, roomsBehindWallAt, doorwayOpen } = mod;

const room = (x, y, w, h, extra = {}) =>
    ({ position: { x, y }, map: { widthInPixels: w, heightInPixels: h }, doorSprites: {}, ...extra });
// A body 18 wide centred on cx, feet at feetY.
const body = (cx, feetY, w = 18) => ({ left: cx - w / 2, right: cx + w / 2, feetY });

// hall 640 wide at y 0, strip y 0..64
const hall = () => ({ hall: room(0, 0, 640, 320) });

test('backWallStrip: two rows at the room top, null without a map', () => {
    assert.deepEqual(backWallStrip(room(320, 256, 320, 320)), { left: 320, right: 640, top: 256, bottom: 320 });
    assert.equal(backWallStrip({ position: { x: 0, y: 0 } }), null);
    assert.equal(backWallStrip(null), null);
});

test('inside the strip is in, feet on S floor are out, 4 px margin', () => {
    const rooms = hall();
    assert.deepEqual(roomsBehindWallAt(body(300, 40), rooms), ['hall']);
    assert.deepEqual(roomsBehindWallAt(body(300, 63.9), rooms), ['hall']);
    assert.deepEqual(roomsBehindWallAt(body(300, 64), rooms), []);
    assert.deepEqual(roomsBehindWallAt(body(300, 100), rooms), []);
    assert.deepEqual(roomsBehindWallAt(body(300, 4), rooms), []);
    assert.deepEqual(roomsBehindWallAt(body(300, 4.1), rooms), ['hall']);
});

test('x-range: centre past the side edge with the body overlapping is in, wholly past is out', () => {
    const rooms = hall();
    assert.deepEqual(roomsBehindWallAt(body(645, 40), rooms), ['hall']);   // left 636 < 640
    assert.deepEqual(roomsBehindWallAt(body(649, 40), rooms), []);         // left 640, touching only
    assert.deepEqual(roomsBehindWallAt(body(-5, 40), rooms), ['hall']);
    assert.deepEqual(roomsBehindWallAt(body(-9, 40), rooms), []);
});

test('S wider or narrower than N, left or right aligned: only S x-range matters', () => {
    // N (office) 320 wide at x 0 above the wide hall; S narrower than N: reception 320 wide under a 640 N
    const rooms = { office: room(0, -256, 640, 320), small: room(320, 0, 320, 320) };
    assert.deepEqual(roomsBehindWallAt(body(100, 40), rooms), []);
    assert.deepEqual(roomsBehindWallAt(body(500, 40), rooms), ['small']);
    // wide S under narrow N, right aligned
    const r2 = { n: room(320, -256, 320, 320), wide: room(0, 0, 640, 320) };
    assert.deepEqual(roomsBehindWallAt(body(100, 40), r2), ['wide']);
    assert.deepEqual(roomsBehindWallAt(body(600, 40), r2), ['wide']);
});

test('over the seam of two south rooms: both', () => {
    const rooms = { a: room(0, 256, 320, 320), b: room(320, 256, 320, 320) };
    assert.deepEqual(roomsBehindWallAt(body(320, 300), rooms).sort(), ['a', 'b']);
    assert.deepEqual(roomsBehindWallAt(body(100, 300), rooms), ['a']);
});

test('feet in a gap with no room above still count', () => {
    const rooms = { s: room(0, 1000, 320, 320) };
    assert.deepEqual(roomsBehindWallAt(body(100, 1040), rooms), ['s']);
});

// ---- open doorways -------------------------------------------------------------------
const doorSprite = (connectedRoom, worldX, extra = {}) =>
    ({ active: true, doorProperties: { connectedRoom, worldX, open: false, ...extra } });
const doorway = (to, x) => ({ to, direction: 'north', x });

function withDoor({ near, far, open } = {}) {
    const rooms = { n: room(0, -256, 320, 320), s: room(0, 0, 320, 320) };
    if (near) rooms.s.doorSprites.d = near;
    if (far) rooms.n.doorSprites.d = far;
    const doorways = (id) => id === 's' ? [doorway('n', 48), { to: 'e', direction: 'east', x: 300 }] : [];
    return { rooms, doorways };
}

test('closed door does not suppress, from either room', () => {
    let { rooms, doorways } = withDoor({ near: doorSprite('n', 48), far: doorSprite('s', 48) });
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), ['s']);
    ({ rooms, doorways } = withDoor({ far: doorSprite('s', 48) }));
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), ['s']);
});

test('open doorway suppresses: opener destroyed but listed, far sprite gone, gate open', () => {
    // opener inactive (destroyed) and listed with open = true; far sprite spliced out
    let { rooms, doorways } = withDoor({ near: { active: false, doorProperties: { connectedRoom: 'n', worldX: 48, open: true } } });
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), []);
    // no sprites at all
    ({ rooms, doorways } = withDoor());
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), []);
    // gate door: sprite active, open = true
    ({ rooms, doorways } = withDoor({ near: doorSprite('n', 48, { open: true }), far: doorSprite('s', 48, { open: true }) }));
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), []);
    assert.equal(doorwayOpen(rooms, 's', doorway('n', 48)), true);
});

test('a sprite for a different door (other x) does not close this doorway', () => {
    const { rooms, doorways } = withDoor({ near: doorSprite('n', 200) });
    assert.equal(doorwayOpen(rooms, 's', doorway('n', 48)), true);
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways }), []);
});

test('body centre 26 px from an open door is in (16 + half 9 = 25 reach), 25 is out', () => {
    const { rooms, doorways } = withDoor();
    assert.deepEqual(roomsBehindWallAt(body(48 + 26, 40), rooms, { doorways }), ['s']);
    assert.deepEqual(roomsBehindWallAt(body(48 + 25, 40), rooms, { doorways }), []);
    assert.deepEqual(roomsBehindWallAt(body(48 - 26, 40), rooms, { doorways }), ['s']);
});

test('only north doorways count; a throwing provider is ignored', () => {
    const { rooms } = withDoor();
    assert.deepEqual(roomsBehindWallAt(body(300, 40), rooms, { doorways: (id) => id === 's' ? [{ to: 'e', direction: 'east', x: 300 }] : [] }), ['s']);
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms, { doorways: () => { throw new Error('x'); } }), ['s']);
});

test('setFadeDoorways supplies the default provider', () => {
    const { rooms, doorways } = withDoor();
    mod.setFadeDoorways(doorways);
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms), []);
    mod.setFadeDoorways(null);
    assert.deepEqual(roomsBehindWallAt(body(48, 40), rooms), ['s']);
});

test('bad input gives an empty list', () => {
    assert.deepEqual(roomsBehindWallAt(null, hall()), []);
    assert.deepEqual(roomsBehindWallAt({ left: NaN, right: 1, feetY: 1 }, hall()), []);
    assert.deepEqual(roomsBehindWallAt(body(1, 40), null), []);
});

test('door-gaps.js registers the fade provider as well as the combat one', () => {
    const src = readFileSync(join(js, 'systems/door-gaps.js'), 'utf8');
    assert.match(src, /setFadeDoorways\(doorwayProvider\)/);
    assert.match(src, /setDoorwayProvider\(doorwayProvider\)/);
});
