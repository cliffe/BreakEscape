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

// ====================== Slice 2: controller ==============================================
const { createBehindWallFade, drawnRect } = mod;

class Tile { constructor(index) { this.index = index; this.alpha = 1; this.visible = true; } }
function layer(depth, rows) {   // rows: array of arrays of gids (0 = no tile); rows 0..n
    const grid = rows.map(r => r.map(g => (g ? new Tile(g) : null)));
    return { depth, grid, getTileAt: (c, r) => grid[r]?.[c] ?? null };
}
let sceneTag = {};
function sprite(x, y, w, h, extra = {}) {
    const s = {
        x, y, displayWidth: w, displayHeight: h, originX: 0, originY: 0, alpha: 1, active: true, visible: true,
        scene: sceneTag, rotation: 0,
        setAlpha(v) { this.alpha = Math.max(0, Math.min(1, v)); return this; }, ...extra
    };
    return s;
}
// South room S at (0,256), 320 wide; strip y 256..320. North room N above.
function world({ objects = {}, layers } = {}) {
    const S = room(0, 256, 320, 320, {
        objects,
        layers: layers || {
            s_walls: layer(0.2, [[0, 5, 5, 5], [0, 5, 5, 5], [7, 7, 7, 7]]),
            s_room: layer(0.4, [[9, 9, 9, 9], [9, 9, 0, 9], [8, 8, 8, 8]]),
        }
    });
    S.map.width = 4;
    const N = room(0, 0, 320, 320, { objects: {} });
    const rooms = { N, S };
    const player = { body: { x: 100, y: 300 - 10, width: 18, height: 10 } }; // feet 300 => in S strip
    let reduced = false;
    const fade = createBehindWallFade({ rooms: () => rooms, player: () => player, reducedMotion: () => reduced, doorways: () => [] });
    return { rooms, S, N, player, fade, setReduced: (v) => { reduced = v; } };
}
const run = (fade, from, to, step) => { for (let t = from; t <= to; t += step) fade.update(t); };
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

test('k reaches 0.5 after 150 ms and 1 after 200 ms, at 16 ms and 500 ms steps', () => {
    for (const step of [16, 500]) {
        const w = world();
        w.fade.update(1000);
        run(w.fade, 1000 + step, 1000 + 150 + step, step);   // 250-clamped for 500 steps still lands
        assert.equal(w.fade.debugState().rooms.S.k, 0.5, `down at step ${step}`);
        w.player.body.y = 400;
        w.fade.update(5000);
        const t0 = 5000;
        run(w.fade, t0 + step, t0 + 200 + step, step);
        assert.equal(w.fade.debugState().rooms.S, undefined, `up at step ${step}`);
    }
});

test('first call and a backwards now give dt 0; reduced motion jumps', () => {
    const w = world();
    w.fade.update(1000);
    assert.equal(w.fade.debugState().rooms.S.k, 1);
    w.fade.update(500);
    assert.equal(w.fade.debugState().rooms.S.k, 1);
    w.setReduced(true);
    w.fade.update(501);
    assert.equal(w.fade.debugState().rooms.S.k, 0.5);
    w.player.body.y = 400;
    w.fade.update(502);
    assert.equal(w.fade.debugState().rooms.S, undefined);
});

test('lightWeights: none at 1, 0.5 at k 0.75, 1 at k 0.5, same array, empty when disabled', () => {
    const w = world();
    const a = w.fade.lightWeights();
    assert.equal(a.length, 0);
    w.fade.update(0); w.fade.update(75);
    near(w.fade.debugState().rooms.S.k, 0.75);
    const b = w.fade.lightWeights();
    assert.equal(b, a);
    assert.equal(b.length, 1);
    near(b[0].weight, 0.5);
    w.fade.update(300);
    near(w.fade.lightWeights()[0].weight, 1);
    w.fade.setEnabled(false);
    assert.equal(w.fade.lightWeights().length, 0);
});

test('lightWeights gaps: open north doorway x listed, closed one not', () => {
    const w = world();
    const doorways = () => [{ to: 'N', direction: 'north', x: 48 }];
    const f = createBehindWallFade({ rooms: () => w.rooms, player: () => w.player, doorways });
    f.update(0); f.update(300);
    assert.deepEqual([...f.lightWeights()[0].gaps], [48]);
    w.S.doorSprites.d = doorSprite('N', 48);
    assert.deepEqual([...f.lightWeights()[0].gaps], []);
});

test('a forced NaN snaps back, releases everything and writes nothing non-finite', () => {
    const pic = sprite(10, 270, 20, 20);
    const w = world({ objects: { pic } });
    w.fade.update(0); w.fade.update(300);
    assert.equal(pic.alpha, 0.5);
    w.fade._forceK('S', NaN);
    w.fade.update(316);
    assert.equal(pic.alpha, 1);
    assert.equal(w.S.layers.s_room.grid[0][0].alpha === 1, true);
    assert.equal(w.fade.lightWeights().length, 0);
});

test('tiles: face fades, walls tile hidden, null doorway cell skipped, row 2 untouched, restored at 1', () => {
    const w = world();
    const { s_walls: walls, s_room: roomL } = w.S.layers;
    w.fade.update(0); w.fade.update(300);
    assert.equal(roomL.grid[0][0].alpha, 0.5);
    assert.equal(walls.grid[0][1].visible, false);
    assert.equal(walls.grid[0][1].alpha, 1);          // hidden, not faded
    assert.equal(roomL.grid[1][2], null);             // doorway cell
    assert.equal(walls.grid[1][2].alpha, 0.5);        // walls-only cell is the face
    assert.equal(walls.grid[1][2].visible, true);
    assert.equal(roomL.grid[2][0].alpha, 1);
    assert.equal(walls.grid[2][0].visible, true);
    assert.equal(w.fade.debugState().rooms.S.hiddenTiles, 5);
    w.player.body.y = 400;
    w.fade.update(316);
    assert.ok(roomL.grid[0][0].alpha > 0.5 && roomL.grid[0][0].alpha < 1);
    w.fade.update(700);
    assert.equal(roomL.grid[0][0].alpha, 1);
    assert.equal(walls.grid[0][1].visible, true);
    assert.deepEqual(w.fade.debugState().rooms, {});
});

test('a room reveal (layer alpha) leaves tile alpha alone', () => {
    const w = world();
    w.fade.update(0); w.fade.update(300);
    w.S.layers.s_room.alpha = 1;
    w.fade.update(316);
    assert.equal(w.S.layers.s_room.grid[0][0].alpha, 0.5);
});

// ---- sprites: the eight worked cases (room-relative y + 256) -------------------------
test('worked cases: wall picture, desk pc, elevated lockpick, edge safe, desk, low safe, floor card, desk note', () => {
    const Y = 256;
    const pic = sprite(120, Y + 17, 17, 17, { elevation: 30 });
    const desk = sprite(76, Y + 42, 174, 47);
    const pc = sprite(150, Y + 36, 28, 28);
    const lockpick = sprite(275, Y + 26, 26, 30, { elevation: 32 });
    const safeEdge = sprite(85, Y + 62, 24, 33);
    const safeLow = sprite(219, Y + 67, 24, 30);
    const card = sprite(275, Y + 64, 10, 10);
    const note = sprite(202, Y + 67, 14, 11);
    desk._tableItems = new Set([pc, note]);
    const objects = { pic, desk, pc, lockpick, safeEdge, safeLow, card, note };
    for (const [id, sp] of Object.entries(objects)) sp.objectId = id;
    const w = world({ objects });
    w.fade.update(0); w.fade.update(300);
    for (const s of [pic, desk, pc, lockpick, safeEdge, note]) assert.equal(s.alpha, 0.5, s.objectId);
    for (const s of [safeLow, card]) assert.equal(s.alpha, 1, s.objectId);
    assert.equal(pic.behindWallK, 0.5);
    assert.equal(safeLow.behindWallK, undefined);
    assert.equal(w.fade.debugState().rooms.S.records, 6);
});

test('table followers: wholly below, back-edge member fade; moved-off does not; releases', () => {
    const Y = 256;
    const desk = sprite(76, Y + 42, 174, 47);
    const below = sprite(100, Y + 80, 10, 8);              // overlaps the desk, wholly below the strip
    const backEdge = sprite(100, Y + 32, 10, 7);           // bottom 3 px above table top (Y+42-... = Y+39)
    const away = sprite(100, Y + 150, 10, 8);              // moved off the table
    desk._tableItems = new Set([below, backEdge, away]);
    const objects = { desk, below, backEdge, away };
    const w = world({ objects });
    w.fade.update(0); w.fade.update(300);
    assert.equal(below.alpha, 0.5);
    assert.equal(backEdge.alpha, 0.5);
    assert.equal(away.alpha, 1);
    // unlisted, inactive, npc-carried: released that tick
    delete objects.below;
    backEdge.active = false;
    w.fade.update(316);
    assert.equal(below.alpha, 1);
    assert.equal(backEdge.alpha, 1);
    // leaving the strip releases every follower
    backEdge.active = true; objects.below = below;
    w.fade.update(332);
    assert.equal(below.alpha, 0.5);
    w.player.body.y = 400;
    run(w.fade, 348, 700, 16);
    assert.equal(below.alpha, 1);
    assert.equal(desk.alpha, 1);
});

test('a follower whose own rect reaches the strip stays when the table leaves it; one record only', () => {
    const Y = 256;
    const desk = sprite(76, Y + 42, 174, 47);
    const m = sprite(100, Y + 50, 10, 10);
    desk._tableItems = new Set([m]);
    const w = world({ objects: { desk, m } });
    w.fade.update(0); w.fade.update(300);
    assert.equal(w.fade.debugState().rooms.S.records, 2);
    desk.y = Y + 200;                                      // table pushed out of the strip
    w.fade.update(316);
    assert.equal(desk.alpha, 1);
    assert.equal(m.alpha, 0.5);
});

test('ownership: N-owned item in the strip untouched; roomId N but listed in S fades; listed in both with roomId N untouched', () => {
    const Y = 256;
    const nItem = sprite(256, Y + 0, 16, 10, { roomId: 'N' });
    const placed = sprite(50, Y + 30, 10, 10, { roomId: 'N' });
    const both = sprite(60, Y + 30, 10, 10, { roomId: 'N' });
    const w = world({ objects: { placed, both } });
    w.N.objects = { nItem, both };
    w.fade.update(0); w.fade.update(300);
    assert.equal(nItem.alpha, 1);
    assert.equal(placed.alpha, 0.5);
    assert.equal(both.alpha, 1);
});

test('NPC, carried item, player, door sprites and destroyed sprites are never touched', () => {
    const Y = 256;
    const npc = sprite(10, Y + 10, 20, 40, { _isNPC: true });
    const carried = sprite(40, Y + 10, 10, 10, { _npcCarried: true });
    const door = sprite(48, Y, 32, 64, { doorProperties: { connectedRoom: 'N' } });
    const gone = sprite(60, Y + 10, 10, 10, { scene: undefined });
    const w = world({ objects: { npc, carried, door, gone } });
    const doorOnly = sprite(70, Y, 32, 64, { doorProperties: { connectedRoom: 'N' } });
    w.S.doorSprites = { d: doorOnly };
    w.fade.update(0); w.fade.update(300);
    for (const s of [npc, carried, door, gone, doorOnly]) assert.equal(s.alpha, 1);
});

test('rotated prop uses getBounds', () => {
    const Y = 256;
    const prop = sprite(10, Y + 100, 10, 10, { rotation: 1, getBounds: () => ({ left: 0, top: Y + 40, right: 60, bottom: Y + 90 }) });
    const w = world({ objects: { prop } });
    w.fade.update(0); w.fade.update(300);
    assert.equal(prop.alpha, 0.5);
    assert.deepEqual(drawnRect(sprite(4, 8, 10, 20, { originX: 0.5, originY: 0.5 })), { left: -1, top: -2, right: 9, bottom: 18 });
});

test('cosmetic companions follow their producer; removal releases; destroyed is dropped', () => {
    const Y = 256;
    const printer = sprite(100, Y + 20, 30, 30);
    const copy = sprite(105, Y + 70, 10, 10, { _fadeOwner: printer });   // own rect is below the strip
    printer._fadeCompanions = new Set([copy]);
    const w = world({ objects: { printer } });
    w.fade.update(0); w.fade.update(300);
    assert.equal(copy.alpha, 0.5);
    printer._fadeCompanions.delete(copy);
    w.fade.update(316);
    assert.equal(copy.alpha, 1);
    printer._fadeCompanions.add(copy);
    w.fade.update(332);
    assert.equal(copy.alpha, 0.5);
    copy.scene = undefined;
    w.fade.update(348);
    assert.equal(w.fade.debugState().rooms.S.records, 1);
});

test('re-base on a revealRoom-style write, pulsing writer, third-party alpha left alone on restore', () => {
    const Y = 256;
    const a = sprite(10, Y + 10, 10, 10, { alpha: 0.8 });
    const b = sprite(30, Y + 10, 10, 10);
    const c = sprite(50, Y + 10, 10, 10);
    const w = world({ objects: { a, b, c } });
    w.fade.update(0); w.fade.update(300);
    near(a.alpha, 0.4);
    a.alpha = 1;                              // reveal
    w.fade.update(316);
    near(a.alpha, 0.5);
    for (let t = 332; t < 500; t += 16) { b.alpha = 0.6 + 0.4 * Math.sin(t); const want = b.alpha * 0.5; w.fade.update(t); near(b.alpha, want); }
    c.alpha = 0.3;                            // third party writes after our last write
    w.player.body.y = 400;
    run(w.fade, 516, 900, 16);
    near(a.alpha, 1);
    near(c.alpha, 0.3);
});

test('pickup / push-out / unlist end at base alpha', () => {
    const Y = 256;
    const picked = sprite(10, Y + 10, 10, 10), pushed = sprite(30, Y + 10, 10, 10), unlisted = sprite(50, Y + 10, 10, 10);
    const objects = { picked, pushed, unlisted };
    const w = world({ objects });
    w.fade.update(0); w.fade.update(300);
    picked.active = false; picked.visible = false;
    pushed.y = Y + 200;
    delete objects.unlisted;
    w.fade.update(316);
    for (const s of [picked, pushed, unlisted]) assert.equal(s.alpha, 1);
});

test('clear() touches nothing; setEnabled(false) restores everything even if one room throws', () => {
    const Y = 256;
    const a = sprite(10, Y + 10, 10, 10);
    const w = world({ objects: { a } });
    w.fade.update(0); w.fade.update(300);
    w.fade.clear();
    assert.equal(a.alpha, 0.5);
    assert.deepEqual(w.fade.debugState().rooms, {});
    const w2 = world({ objects: { a: sprite(10, Y + 10, 10, 10) } });
    w2.fade.update(0); w2.fade.update(300);
    const face = w2.S.layers.s_room.grid[0][0];
    w2.S.getTileAt = () => { throw new Error('boom'); };
    w2.fade.setEnabled(false);
    assert.equal(w2.S.objects.a.alpha, 1);
    assert.equal(face.alpha, 1);
    assert.equal(w2.fade.debugState().enabled, false);
    w2.fade.update(900);
    assert.deepEqual(w2.fade.debugState().rooms, {});
});

test('disabled at start never writes', () => {
    const a = sprite(10, 266, 10, 10);
    const w = world({ objects: { a } });
    const f = createBehindWallFade({ enabled: false, rooms: () => w.rooms, player: () => w.player });
    f.update(0); f.update(300);
    assert.equal(a.alpha, 1);
    assert.equal(w.S.layers.s_room.grid[0][0].alpha, 1);
});

test('NPCs / the player body outside every strip leave an idle controller empty', () => {
    const w = world();
    w.player.body.y = 500;
    w.fade.update(0); w.fade.update(100);
    assert.deepEqual(w.fade.debugState().rooms, {});
});

// ---- wiring (static checks) ----------------------------------------------------------
const read = (p) => readFileSync(join(js, p), 'utf8');

test('game.js installs after seating and updates between timers and lighting, without time.delta', () => {
    const g = read('core/game.js');
    assert.ok(g.indexOf('installSeating(this);') < g.indexOf('installBehindWallFade(this);'));
    const call = g.indexOf('window.behindWallFade?.update(this.time.now);');
    assert.ok(call > g.indexOf('window.scenarioTimerDispatcher.update('));
    assert.ok(call < g.indexOf('window.lightingSystem.update('));
    assert.ok(!/behindWallFade\?\.update\([^)]*delta/.test(g));
});
test('seating overlays copy the chair alpha; rooms.js records table items; npc-needs registers companions', () => {
    assert.match(read('systems/seating.js'), /\.setVisible\(chair\.visible\)\s*\.setAlpha\(chair\.alpha\)/);
    assert.match(read('core/rooms.js'), /group\.table\.sprite\._tableItems = new Set\(group\.items\.map\(item => item\.sprite\)\)/);
    const n = read('systems/npc-needs.js');
    assert.match(n, /_fadeCompanions \|\|= new Set\(\)\)\.add\(sp\)/);
    assert.match(n, /sp\?\._fadeOwner\?\._fadeCompanions\?\.delete\(sp\)/);
});
