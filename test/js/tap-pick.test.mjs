// A tap goes to the thing under the pointer (systems/tap-pick.js, game.js pointerdown).
// The UX access R1 finding 6 cases and the C3 replay U3 case (Kim's phone and stick).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tapPickList, seatsGiveWay, pixelHits, soleHit, overlapStandPoint, overlapRetryTarget, OVERLAP_MARGINS, farUnderTap, npcYieldsToObject, npcYieldTarget, opaqueAt, opaqueNear, objectStandPoint, createPendingTapUse, PENDING_TAP_USE_MS } from '../../public/break_escape/js/systems/tap-pick.js';
import { withoutChairsIfOthers, withoutLeavingNpcsIfObjects } from '../../public/break_escape/js/systems/interaction-reach.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

const RANGE = 32;      // INTERACTION_RANGE
// The pointerdown pipeline itself (gathering, the far lists, the NPC and object branches) is
// tested through game.js's own handler code in tap-pick-handler.test.mjs.

// ── tapPickList on its own ──
test('tapPickList: nothing far under the tap leaves the list as it was', () => {
    const list = [{ label: 'a' }, { label: 'b', underTap: true }];
    assert.equal(tapPickList(list, []), list);
    assert.equal(tapPickList(list, undefined), list);
    assert.deepEqual(tapPickList(null, []), []);
});

test('tapPickList: a far NPC under the tap drops candidates only near it and joins no menu', () => {
    const near = { label: 'note' }, under = { label: 'memo', underTap: true };
    assert.deepEqual(tapPickList([near], [], [{ id: 'sarah' }]), []);
    assert.deepEqual(tapPickList([near, under], [], [{ id: 'sarah' }]).map(c => c.label), ['memo']);
    assert.deepEqual(tapPickList([near], [], [null]), [near]);
});

test('tapPickList: a far object under the tap keeps only candidates under the tap', () => {
    const near = { label: 'phone' }, under = { label: 'owner', underTap: true };
    const out = tapPickList([near, under], [{ id: 'pc' }]);
    assert.deepEqual(out.map(c => c.label), ['owner'], 'no far entry (overlap plan D5)');
    assert.deepEqual(tapPickList([near], [{ id: 'pc' }]), []);
});

test('tapPickList with the filters: a leaving owner over a far PC stays in the list (the handler walks to the PC)', () => {
    const owner = { label: 'owner', underTap: true, leavingNpc: true };
    const list = withoutLeavingNpcsIfObjects(withoutChairsIfOthers(tapPickList([owner], [{ id: 'pc' }])));
    assert.deepEqual(list.map(c => c.label), ['owner']);
});

test('tapPickList with the filters: an in-reach chair under the tap gives way to the far object', () => {
    const chair = { label: 'chair', underTap: true, isChair: true, isObject: true };
    assert.equal(seatsGiveWay([chair], [{ id: 'stick' }]), true);
    assert.deepEqual(tapPickList([chair], [{ id: 'stick' }]), []);
});

// ── objectStandPoint: the walk pulled out of pointerdown ──
test('objectStandPoint: aims the sprite centre half a reach short, as a feet target', () => {
    const player = { x: 0, y: 0, body: { center: { x: 0, y: 31 } } };
    const t = objectStandPoint({ x: 100, y: 0 }, player, { range: RANGE });
    assert.deepEqual(t, { x: 84, y: 31 });
});

test('objectStandPoint: no walk when the player stands on the object', () => {
    assert.equal(objectStandPoint({ x: 5, y: 5 }, { x: 5, y: 5 }, { range: RANGE }), null);
});

test('objectStandPoint: an aim snapped out of reach tries points round the object and keeps one in reach', () => {
    const player = { x: 0, y: 0 };
    const obj = { x: 100, y: 0 };
    // Every cell snaps 40 px left, except points right of the object, which are free
    const findCell = (x, y) => (x > 100 ? { x, y } : { x: x - 40, y });
    const t = objectStandPoint(obj, player, { range: RANGE, findCell });
    assert.ok(Math.hypot(t.x - obj.x, t.y - obj.y) <= RANGE - 4, `ends in reach: ${JSON.stringify(t)}`);
});

test('objectStandPoint: a stand point behind a wall is not kept when a clear one exists', () => {
    const player = { x: 0, y: 0 };
    const obj = { x: 100, y: 0 };
    const findCell = (x, y) => ({ x, y });
    const wallClear = (p) => p.y >= 0;           // anything above the object is behind a wall
    const t = objectStandPoint(obj, player, { range: RANGE, findCell, wallClear });
    assert.ok(t.y >= 0 && Math.hypot(t.x - obj.x, t.y - obj.y) <= RANGE - 4);
});

test('UX slice 15 R2 (M1): an object in a shared strip is approached from its own room, not across the line', () => {
    // usb_room's floor runs down to y 64, over the lobby's back wall; the lobby's feet start
    // at y 64. A stick dropped at (44, 60) belongs to usb_room. The player stands north of
    // it, feet (48, 16), sprite centre 31 px higher; the aim and the near cells south of it
    // are in the lobby, where the use is refused.
    const player = { x: 48, y: -15, body: { center: { x: 48, y: 16 } } };
    const obj = { x: 44, y: 60 };
    const findCell = (x, y) => ({ x, y });
    const sameRoom = (p) => p.y < 64;            // feet south of y 64 are in the lobby
    const t = objectStandPoint(obj, player, { range: RANGE, findCell, sameRoom });
    assert.ok(t.y < 64, `the stand point is on usb_room's side: ${JSON.stringify(t)}`);
    // In reach as the arrival check measures it: the sprite centre within the range
    assert.ok(Math.hypot(t.x - obj.x, t.y - 31 - obj.y) <= RANGE - 1, `and in reach on arrival: ${JSON.stringify(t)}`);
    // Without a sameRoom rule nothing changes: the nearest plain-reach point, in the lobby
    assert.ok(objectStandPoint(obj, player, { range: RANGE, findCell }).y >= 64);
    // From the lobby side (feet (48, 140)), with no rule, the aim is in the lobby
    const below = { x: 48, y: 109, body: { center: { x: 48, y: 140 } } };
    const plain = objectStandPoint(obj, below, { range: RANGE, findCell });
    assert.ok(plain.y >= 64, 'without the rule the walk would end in the lobby');
    const ruled = objectStandPoint(obj, below, { range: RANGE, findCell, sameRoom });
    assert.ok(ruled.y < 64, `with it, the walk goes through to usb_room's side: ${JSON.stringify(ruled)}`);
});

test('objectStandPoint: a blocked aim whose snapped cell is in reach returns the cell, not the raw aim (R3 m1)', () => {
    const player = { x: 0, y: 0 };
    const obj = { x: 100, y: 0 };
    // The raw aim (84, 0) is inside a desk; the pathfinder snaps it to the walkable cell (80, 8)
    const findCell = (x, y) => (Math.round(x) === 84 && Math.round(y) === 0 ? { x: 80, y: 8 } : { x, y });
    const t = objectStandPoint(obj, player, { range: RANGE, findCell });
    assert.deepEqual(t, { x: 80, y: 8 });
});

test('objectStandPoint: the ring search also returns a checked cell (R3 m1)', () => {
    const player = { x: 0, y: 0 };
    const obj = { x: 100, y: 0 };
    const cells = [];
    const findCell = (x, y) => { const c = x > 100 ? { x: Math.round(x), y: Math.round(y) } : { x: x - 40, y }; cells.push(c); return c; };
    const t = objectStandPoint(obj, player, { range: RANGE, findCell });
    assert.ok(cells.includes(t), 'the stand point is one of the cells the pathfinder gave');
});

// ── createPendingTapUse: walk, then use ──
function pendingRig(over = {}) {
    const state = { moving: true, inReach: false, used: [], minigame: false };
    const p = createPendingTapUse({
        inReach: () => state.inReach,
        isMoving: () => state.moving,
        use: (o) => state.used.push(o.id),
        minigameOpen: () => state.minigame,
        ...over
    });
    return { p, state };
}
const stickObj = () => ({ id: 'kim_usb', active: true, visible: true, interactable: true });

test('pending use: the object is used once the walk ends in reach, once only', () => {
    const { p, state } = pendingRig();
    p.arm(stickObj(), 0);
    p.update(100); p.update(900);
    assert.deepEqual(state.used, []);
    state.moving = false; state.inReach = true;
    p.update(1200); p.update(1300);
    assert.deepEqual(state.used, ['kim_usb']);
    assert.equal(p.get(), null);
});

test('pending use: not used while still walking, even in reach', () => {
    const { p, state } = pendingRig();
    p.arm(stickObj(), 0);
    state.inReach = true;
    p.update(500);
    assert.deepEqual(state.used, []);
    assert.ok(p.get());
});

test('pending use: dropped when the walk stops short, but not before the walk can start', () => {
    const { p, state } = pendingRig();
    state.moving = false;                        // the path is still being found
    p.arm(stickObj(), 0);
    p.update(100);
    assert.ok(p.get(), 'kept during the start-up grace');
    p.update(500);
    assert.equal(p.get(), null);
    assert.deepEqual(state.used, []);
});

test('pending use: dropped when the object is taken, a minigame opens, or time runs out', () => {
    const a = pendingRig(); const o = stickObj();
    a.p.arm(o, 0); o.active = false; a.p.update(10);
    assert.equal(a.p.get(), null);
    const b = pendingRig();
    b.p.arm(stickObj(), 0); b.state.minigame = true; b.p.update(10);
    assert.equal(b.p.get(), null);
    const c = pendingRig();
    c.p.arm(stickObj(), 0); c.p.update(PENDING_TAP_USE_MS + 1);
    assert.equal(c.p.get(), null);
    for (const r of [a, b, c]) assert.deepEqual(r.state.used, []);
});

test('pending use: clear() drops it (any new tap)', () => {
    const { p, state } = pendingRig();
    p.arm(stickObj(), 0); p.clear();
    state.moving = false; state.inReach = true; p.update(1000);
    assert.deepEqual(state.used, []);
});

// ── R1 fixes: tapPickList's NPC and hostile rules ──
test('tapPickList: an in-reach NPC on her figure under the tap wins, far objects join no menu (M1)', () => {
    const sarah = { label: 'sarah', underTap: true, isNpc: true };
    const note = { label: 'note' };
    assert.deepEqual(tapPickList([sarah, note], [{ id: 'directory' }]).map(c => c.label), ['sarah']);
    // ...and with an in-reach object under the tap too, the in-reach menu stays, no far entry
    const pc = { label: 'pc', underTap: true, isObject: true };
    assert.deepEqual(tapPickList([sarah, pc], [{ id: 'directory' }]).map(c => c.label), ['sarah', 'pc']);
});

test('tapPickList: a hostile near the tap is dropped (overlap plan D12)', () => {
    const thug = { label: 'thug', isNpc: true, hostile: true };   // not even on his figure
    assert.deepEqual(tapPickList([thug], [{ id: 'pc' }]), []);
    assert.deepEqual(tapPickList([thug], [], [{ id: 'far_npc' }]), []);
});

// ── opaqueAt: on the figure, not just the frame ──
const npcSprite = (over = {}) => ({
    x: 100, y: 100, originX: 0.5, originY: 0.5, scaleX: 1, scaleY: 1, flipX: false,
    texture: { key: 'sarah' }, frame: { name: 3, realWidth: 80, realHeight: 80, cutWidth: 80, cutHeight: 80 },
    ...over
});
const leftHalf = (x) => (x < 40 ? 255 : 0);

test('opaqueAt: reads the frame pixel under the tap, with origin', () => {
    const calls = [];
    const alphaAt = (x, y, key, frame) => { calls.push([x, y, key, frame]); return leftHalf(x); };
    assert.equal(opaqueAt(npcSprite(), 70, 90, alphaAt), true);    // local 10,30
    assert.deepEqual(calls[0], [10, 30, 'sarah', 3]);
    assert.equal(opaqueAt(npcSprite(), 130, 90, alphaAt), false);  // local 70,30
});

test('opaqueAt: flipX mirrors the lookup, scale divides it', () => {
    assert.equal(opaqueAt(npcSprite({ flipX: true }), 70, 90, (x) => leftHalf(x)), false);
    assert.equal(opaqueAt(npcSprite({ flipX: true }), 130, 90, (x) => leftHalf(x)), true);
    // scale 2: the frame covers 20..180; world 50 is local 15
    const seen = [];
    opaqueAt(npcSprite({ scaleX: 2, scaleY: 2 }), 50, 100, (x, y) => { seen.push([x, y]); return 255; });
    assert.deepEqual(seen[0], [15, 40]);
});

test('opaqueAt: outside the frame is false; no pixel test, or an unreadable frame, falls back to the bounds', () => {
    assert.equal(opaqueAt(npcSprite(), 200, 100, () => 255), false);
    assert.equal(opaqueAt(npcSprite(), 130, 90, null), true);
    assert.equal(opaqueAt(npcSprite(), 130, 90, () => null), true);
    assert.equal(opaqueAt(null, 0, 0, () => 255), false);
});

// ── farUnderTap: what takes the tap from in-reach things near it ──
test('farUnderTap: far objects not seats and of the player\'s room; far NPCs on their figure, of the room, not leaving', () => {
    const near = { id: 'near' }, far = { id: 'far' }, seat = { id: 'seat' }, other = { id: 'other_room' };
    const deps = {
        inReach: (o) => o.id === 'near' || o.id === 'npc_near',
        isSeat: (o) => o.id === 'seat',
        sameRoom: (o) => o.id !== 'other_room' && o.id !== 'npc_other',
        npcOnFigure: (n) => n.id !== 'npc_frame',
        givesWay: (n) => n.id === 'npc_leaving'
    };
    assert.deepEqual(farUnderTap({ objectsUnderTap: [near, far, seat, other] }, deps).farObjects.map(o => o.id), ['far']);
    const npcs = (id) => farUnderTap({ objectsUnderTap: [], npcUnderTap: { id } }, deps).farNpcs.map(n => n.id);
    assert.deepEqual(npcs('npc_far'), ['npc_far']);
    for (const id of ['npc_near', 'npc_other', 'npc_frame', 'npc_leaving']) assert.deepEqual(npcs(id), [], id);
});

// ── npcYieldsToObject: an object over an NPC (m3) ──
test('npcYieldsToObject: an object drawn above her where the tap is, or a tap off her figure, wins', () => {
    const sarah = { id: 'sarah', depth: 81 };
    const logBook = { id: 'log', depth: 90 }, board = { id: 'board', depth: 10 };
    const on = (ids) => ({ onPixels: (s) => ids.includes(s.id) });
    assert.equal(npcYieldsToObject(sarah, [logBook], on(['sarah', 'log'])), true);
    assert.equal(npcYieldsToObject(sarah, [board], on(['sarah', 'board'])), false);
    assert.equal(npcYieldsToObject(sarah, [board], on(['board'])), true, 'off her figure');
    assert.equal(npcYieldsToObject(sarah, [logBook], on(['sarah'])), false, 'off the log\'s pixels');
    assert.equal(npcYieldsToObject(sarah, [], on([])), false);
    assert.equal(npcYieldsToObject(sarah, [logBook], { ...on(['log']), hostile: () => true }), false, 'a hostile never gives way');
    assert.equal(npcYieldsToObject(sarah, [board], { ...on(['board']), isSeat: () => true }), false, 'her own chair');
    assert.equal(npcYieldsToObject(sarah, [board], { ...on(['board']), sameRoom: () => false }), false, 'another room');
});

// ── the pending use: progress, blocked walks, busy (R1 m4, m5) ──
function walkRig() {
    const state = { moving: true, inReach: false, used: [], busy: false, feet: { x: 0, y: 0 } };
    const p = createPendingTapUse({
        inReach: () => state.inReach, isMoving: () => state.moving, use: (o) => state.used.push(o.id),
        busy: () => state.busy, feet: () => ({ ...state.feet })
    });
    return { p, state };
}

test('pending use: a long walk that keeps moving outlasts the 10 s limit, which counts from the last progress', () => {
    const { p, state } = walkRig();
    p.arm(stickObj(), 0);
    for (let t = 500; t <= 15000; t += 500) { state.feet.x += 20; p.update(t); }
    assert.ok(p.get(), 'still armed after 15 s of walking');
    state.moving = false; state.inReach = true; p.update(15100);
    assert.deepEqual(state.used, ['kim_usb']);
});

test('pending use: a blocked walk (on a path, feet still for a second) drops it', () => {
    const { p, state } = walkRig();
    p.arm(stickObj(), 0);
    state.feet.x = 10; p.update(300);
    p.update(1000);
    assert.ok(p.get(), 'under a second without progress');
    p.update(1400);
    assert.equal(p.get(), null);
    state.moving = false; state.inReach = true; p.update(9000);   // the owner steps away later
    assert.deepEqual(state.used, []);
});

test('pending use: a menu or confirm opening on the way drops it (busy)', () => {
    const { p, state } = walkRig();
    p.arm(stickObj(), 0);
    state.busy = true; p.update(100);
    assert.equal(p.get(), null);
});

// ── game.js and player.js wiring ──
test('game.js: pointerdown builds the far lists with farUnderTap and the pick list with tapPickList', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(src, /import \{ tapPickList, farUnderTap, npcYieldsToObject, npcYieldTarget, opaqueAt, opaqueNear, objectStandPoint, createPendingTapUse, pixelHits, soleHit, overlapStandPoint, overlapRetryTarget, seatsGiveWay \} from '\.\.\/systems\/tap-pick\.js'/);
    assert.match(src, /const nearClick = gatherInteractablesNearClick\(worldX, worldY, tapObjectIds, tapTests\);/);
    assert.match(src, /tapPickList\(nearClick, farObjects, farNpcs\)/);
    assert.doesNotMatch(src, /farObjectCandidate/, 'no walk entries (overlap plan D5)');
    assert.match(src, /withoutLeavingNpcsIfObjects\(withoutChairsIfOthers\(gathered\)\)/);
    assert.match(src, /pendingTapUse\.clear\(\)/);
    assert.match(src, /pendingTapUse\.update\(Date\.now\(\)\)/);
    assert.match(src, /window\.__clearPendingTapUse = \(\) => \{ pendingTapUse\.clear\(\); clearOverlapWalk\(\); \}/);
    assert.match(src, /pendingOverlapWalk\.update\(Date\.now\(\)\)/);
});

test('player.js: the E key drops a far tap\'s pending use before interacting (R1 m4)', () => {
    const src = readFileSync(join(js, 'core/player.js'), 'utf8');
    const e = src.slice(src.indexOf("if (key === 'e')"), src.indexOf("if (key === 'e')") + 400);
    assert.match(e, /window\.__clearPendingTapUse\?\.\(\);\s*if \(window\.tryInteractWithNearest\)/);
});

test('player.js: keyboard walking drops a far tap\'s pending use (R2 M1)', () => {
    const src = readFileSync(join(js, 'core/player.js'), 'utf8');
    const k = src.slice(src.indexOf('function updatePlayerKeyboardMovement()'), src.indexOf('function updatePlayerKeyboardMovement()') + 300);
    assert.match(k, /window\.__clearPendingTapUse\?\.\(\);/);
});

// ── code review R2 ──
test('pending use: a keyboard walk (feet moving, no click-to-move) is not progress and never uses it (R2 M1)', () => {
    const { p, state } = walkRig();
    p.arm(stickObj(), 0);
    state.moving = false;
    for (let t = 100; t <= 3000; t += 100) { state.feet.y += 2; p.update(t); }
    state.inReach = true; state.feet.y += 2; p.update(3100);
    assert.deepEqual(state.used, []);
    assert.equal(p.get(), null);
    // even a keyboard step that lands in reach at once, before the stopped-short drop
    const r = walkRig();
    r.p.arm(stickObj(), 0);
    r.state.moving = false;
    for (let t = 100; t <= 1000; t += 100) { r.state.feet.x += 3; r.p.update(t); }
    assert.equal(r.p.get(), null, 'dropped 400 ms after the walk ended');
});

test('pending use: a blocked walk calls onBlocked once; stopping short does not (R2 m4)', () => {
    const blocked = [];
    const state = { moving: true, feet: { x: 0, y: 0 } };
    const p = createPendingTapUse({
        inReach: () => false, isMoving: () => state.moving, use: () => {},
        feet: () => ({ ...state.feet }), onBlocked: (o) => blocked.push(o.id)
    });
    p.arm(stickObj(), 0);
    p.update(1200); p.update(1300);
    assert.deepEqual(blocked, ['kim_usb']);
    p.arm(stickObj(), 2000);
    state.moving = false; p.update(2500);
    assert.equal(p.get(), null);
    assert.deepEqual(blocked, ['kim_usb']);
});

test('pending use: stopping short out of reach calls onStoppedShort once; a blocked walk does not (R3 m1)', () => {
    const short = [], blocked = [];
    const state = { moving: true, feet: { x: 0, y: 0 } };
    const p = createPendingTapUse({
        inReach: () => false, isMoving: () => state.moving, use: () => {},
        feet: () => ({ ...state.feet }), onBlocked: (o) => blocked.push(o.id), onStoppedShort: (o) => short.push(o.id)
    });
    p.arm(stickObj(), 0);
    state.moving = false; p.update(300);
    assert.deepEqual(short, [], 'not before the walk can start');
    p.update(500); p.update(600);
    assert.deepEqual(short, ['kim_usb']);
    state.moving = true; p.arm(stickObj(), 1000); p.update(2200);
    assert.deepEqual(short, ['kim_usb']);
    assert.deepEqual(blocked, ['kim_usb']);
});

test('game.js: busy covers a knocked-out or frozen player; a short stop says so (R3 m1, m2)', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    const cut = src.slice(src.indexOf('const pendingTapUse = createPendingTapUse({'));
    assert.match(cut, /busy: \(\) => tapWalkBusy\(\)/);
    assert.match(cut, /function tapWalkBusy\(\) \{[^]*?window\.playerHealth\?\.isKO\?\.\(\)[^]*?window\.player\?\.disableMovement;\n\}/);
    assert.match(cut, /onStoppedShort: \(\) => tapWalkStoppedShort\(\)/);
    assert.match(cut, /function tapWalkStoppedShort\(\) \{\n    window\.gameAlert\?\.\(npcBesidePlayer\(\) \? "Someone's in the way\." : "Can't reach it from here\."/);
});

test('opaqueAt: flipY mirrors the row; rotation is undone about the origin (R3 n3)', () => {
    const topHalf = (x, y) => (y < 40 ? 255 : 0);
    assert.equal(opaqueAt(npcSprite({ flipY: true }), 100, 70, topHalf), false);   // local row 10 shows row 70
    assert.equal(opaqueAt(npcSprite({ flipY: true }), 100, 130, topHalf), true);
    // A quarter turn clockwise: the frame's left half is drawn above the origin
    const turned = npcSprite({ rotation: Math.PI / 2 });
    assert.equal(opaqueAt(turned, 100, 70, (x) => leftHalf(x)), true);             // local 10,40
    assert.equal(opaqueAt(turned, 100, 130, (x) => leftHalf(x)), false);           // local 70,40
    assert.equal(opaqueAt(npcSprite({ rotation: Math.PI / 2, width: 80, height: 20,
        frame: { name: 0, realWidth: 80, realHeight: 20 } }), 100, 60, () => 255), true, 'a long thin frame turned upright');
});

test('opaqueAt: a trimmed frame passes untrimmed coordinates, as Phaser subtracts the trim (R2 m2)', () => {
    // An 80 px frame trimmed to the 40 px from x 20: Phaser getPixelAlpha subtracts frame.x itself
    const frame = { name: 1, realWidth: 80, realHeight: 80, x: 20, y: 0, cutWidth: 40, cutHeight: 80 };
    const texels = (x) => (x < 10 ? 255 : 0);          // the cut's own first 10 columns are opaque
    const phaserAlpha = (x, y) => { const cx = x - frame.x, cy = y - frame.y; return cx < 0 || cy < 0 || cx >= 40 || cy >= 80 ? null : texels(cx); };
    const s = npcSprite({ frame });
    assert.equal(opaqueAt(s, 85, 100, phaserAlpha), true);    // local 25: cut 5
    assert.equal(opaqueAt(s, 95, 100, phaserAlpha), false);   // local 35: cut 15
    assert.equal(opaqueAt(s, 70, 100, phaserAlpha), false);   // local 10: in the trimmed margin
});

test('opaqueAt: a flipped frame reads texel w - lx, so its outer column is the last texel (R2 n1)', () => {
    const seen = [];
    opaqueAt(npcSprite({ flipX: true }), 60.5, 100, (x) => { seen.push(x); return 255; });   // local 0.5
    opaqueAt(npcSprite({ flipX: true }), 60, 100, (x) => { seen.push(x); return 255; });     // local 0
    opaqueAt(npcSprite({ flipX: true }), 139.5, 100, (x) => { seen.push(x); return 255; });  // local 79.5
    assert.deepEqual(seen, [79, 79, 0]);
});

test('opaqueAt: Phaser\'s missing and default textures get no pixel test (R2 n4)', () => {
    for (const key of ['__MISSING', '__DEFAULT']) {
        assert.equal(opaqueAt(npcSprite({ texture: { key } }), 130, 90, () => 0), true, key);
    }
});

test('opaqueNear: a tap within 2 px of an opaque pixel is on the figure (R2 m5)', () => {
    const s = npcSprite();                               // left half opaque: local x < 40, world x < 100
    assert.equal(opaqueNear(s, 101.5, 100, leftHalf), true);
    assert.equal(opaqueNear(s, 102.5, 100, leftHalf), false);
    assert.equal(opaqueNear(s, 200, 100, leftHalf), false);
});

test('tapPickList: an in-reach object on its own pixels drops in-reach NPCs not under the tap (R2 m1)', () => {
    const memo = { label: 'memo', isObject: true, underTap: true, onObjectPixels: true };
    const covered = { label: 'sarah', isNpc: true, underTap: false };
    const onFigure = { label: 'sarah', isNpc: true, underTap: true };
    const chair = { label: 'chair', isObject: true, isChair: true, underTap: true, onObjectPixels: true };
    assert.deepEqual(tapPickList([memo, covered], []), [memo]);
    assert.deepEqual(tapPickList([memo, onFigure], []), [memo, onFigure]);
    assert.deepEqual(tapPickList([chair, covered], []), [chair, covered], 'a chair is not pointed at');
    assert.deepEqual(tapPickList([{ ...memo, onObjectPixels: false }, covered], []).length, 2, 'only near the memo');
    const thug = { label: 'thug', isNpc: true, hostile: true, underTap: false };
    assert.deepEqual(tapPickList([memo, thug], []), [memo], 'a hostile is dropped');
});

test('npcYieldTarget: names the object she gives way to (R2 n5)', () => {
    const sarah = { id: 'sarah', depth: 81 };
    const chair = { id: 'chair', depth: 95 }, board = { id: 'board', depth: 10 }, logBook = { id: 'log', depth: 90 };
    const deps = { onPixels: (s) => ['sarah', 'log', 'chair'].includes(s.id), isSeat: (o) => o.id === 'chair' };
    assert.equal(npcYieldTarget(sarah, [chair, board, logBook], deps), logBook);
    assert.equal(npcYieldTarget(sarah, [chair, board], deps), null);
    assert.equal(npcYieldTarget(sarah, [chair, board], { ...deps, npcOnPixels: () => false }), board, 'off her figure: the first non-seat');
});

// ── R3 m1: a far tap's walk goes round standing NPCs ──
test('hasPlayerLineOfSight: { avoidNpcs } refuses a line through a standing NPC, not a knocked-out one (R3 m1)', async () => {
    globalThis.window = globalThis.window || {};
    const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.hasWorldPhysicsLineOfSight = () => true;
    pm.getPreferAvoidRects = () => [];
    // m06 trading floor: the trader stands between the player and the workstation's stand point
    const trader = { npcId: 'trader', active: true, visible: true,
        body: { enable: true, left: 150, top: 180, right: 170, bottom: 190 } };
    const saved = { rooms: window.rooms, ko: window.npcHostileSystem };
    window.rooms = { trading_floor: { npcSprites: [trader] } };
    window.npcHostileSystem = { isNPCKO: () => false };
    try {
        assert.equal(pm.hasPlayerLineOfSight(160, 261, 172, 132), true, 'other walks: unchanged');
        assert.equal(pm.hasPlayerLineOfSight(160, 261, 172, 132, null, { avoidNpcs: true }), false);
        assert.equal(pm.hasPlayerLineOfSight(200, 261, 200, 132, null, { avoidNpcs: true }), true, 'a line clear of her');
        window.npcHostileSystem = { isNPCKO: (id) => id === 'trader' };
        assert.equal(pm.hasPlayerLineOfSight(160, 261, 172, 132, null, { avoidNpcs: true }), true, 'a knocked-out body');
    } finally {
        window.rooms = saved.rooms; window.npcHostileSystem = saved.ko;
    }
});

test('isPlayerAvoidedCell: the berth the player\'s search keeps round a movable NPC, not round an immovable one (live c10)', async () => {
    globalThis.window = globalThis.window || {};
    const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGridBounds = { minX: 0, minY: 0, cols: 40, rows: 40, step: 8 };
    const body = (l, t, r, b, immovable = false) => ({ enable: true, immovable, left: l, top: t, right: r, bottom: b });
    const saved = window.rooms;
    // Marek: body x 48..58, y 120..133 -> cells 6..7 x 15..16, berth cells 4..9 x 14..17
    window.rooms = { r: { npcSprites: [{ body: body(48, 120, 58, 133) }, { body: body(200, 200, 210, 210, true) }] } };
    try {
        assert.equal(pm.isPlayerAvoidedCell(44, 140), true, 'one row below his body: in the berth');
        assert.equal(pm.isPlayerAvoidedCell(44, 164), false, 'two rows further: clear');
        assert.equal(pm.isPlayerAvoidedCell(205, 205), false, 'an immovable (seated) body is not avoided by this search');
    } finally { window.rooms = saved; }
});

test('isPlayerAvoidedCell: the player\'s own cell is exempt, as the search skips its start cell (R4 n1)', async () => {
    globalThis.window = globalThis.window || {};
    const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGridBounds = { minX: 0, minY: 0, cols: 40, rows: 40, step: 8 };
    const saved = window.rooms;
    window.rooms = { r: { npcSprites: [{ body: { enable: true, immovable: false, left: 48, top: 120, right: 58, bottom: 133 } }] } };
    try {
        assert.equal(pm.isPlayerAvoidedCell(44, 140), true);
        assert.equal(pm.isPlayerAvoidedCell(44, 140, 41, 143), false, 'same cell as the feet: never avoided');
        assert.equal(pm.isPlayerAvoidedCell(44, 140, 41, 151), true, 'the feet are in another cell');
    } finally { window.rooms = saved; }
});

test('isPlayerAvoidedCell and _avoidNPCPositions agree on every cell, for several NPCs and edges (R4 m2)', async () => {
    globalThis.window = globalThis.window || {};
    const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    const cols = 30, rows = 30;
    pm.worldGridBounds = { minX: 16, minY: 8, cols, rows, step: 8 };
    pm.worldGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    const avoided = new Set();
    pm.worldPathfinder = { avoidAdditionalPoint: (cx, cy) => avoided.add(`${cx},${cy}`) };
    const b = (l, t, r, bo, immovable = false, enable = true) => ({ sprite: { body: { enable, immovable, left: l, top: t, right: r, bottom: bo } } }).sprite;
    const saved = window.rooms;
    window.rooms = {
        a: { npcSprites: [b(100, 100, 110, 113), b(17, 9, 27, 22), b(220, 230, 239, 247)] },   // mid, top-left corner, bottom-right corner
        c: { npcSprites: [b(130, 60, 136, 70), b(60, 150, 70, 160, true), b(70, 170, 80, 180, false, false)] }  // + immovable, disabled (not avoided)
    };
    try {
        pm._avoidNPCPositions(-1, -1);
        assert.ok(avoided.size > 40, 'some cells avoided');
        for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
            // a point inside the cell, off its edges
            const x = 16 + cx * 8 + 3, y = 8 + cy * 8 + 5;
            assert.equal(pm.isPlayerAvoidedCell(x, y), avoided.has(`${cx},${cy}`), `cell ${cx},${cy}`);
        }
        // The berth edges: first and last avoided row and column, and one past each, for the mid NPC
        // (body x 100..110 -> cells 10..11 (minX 16), y 100..113 -> cells 11..13)
        const at = (cx, cy) => pm.isPlayerAvoidedCell(16 + cx * 8 + 3, 8 + cy * 8 + 3);
        assert.equal(at(8, 12), true, 'left edge'); assert.equal(at(7, 12), false);
        assert.equal(at(13, 12), true, 'right edge'); assert.equal(at(14, 12), false);
        assert.equal(at(10, 10), true, 'top edge (one above the body)'); assert.equal(at(10, 9), false);
        assert.equal(at(10, 14), true, 'bottom edge'); assert.equal(at(10, 15), false);
    } finally { window.rooms = saved; }
});

test('overlapStandPoint: a hit\'s reach span joins its centre; the box is not cut to a span that sits to one side (R3/R4 m2)', () => {
    const player = { x: 0, y: 0 };
    const reach = 32;                                       // = range: lattice margin 0 reaches exactly this far
    const inReachFrom = (p, h, margin = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= reach - margin;
    const a = { id: 'a', x: 100, y: 0 };
    // The only walkable cell is on the far side of the centre from the span, exactly `reach` away
    const cases = [
        ['left of the span', { left: 106, right: 110, top: 0, bottom: 0 }, (x, y) => x <= 68 && y === 0],
        ['right of the span', { left: 92, right: 94, top: 0, bottom: 0 }, (x, y) => x >= 132 && y === 0],
        ['above the span', { left: 100, right: 100, top: 6, bottom: 10 }, (x, y) => y <= -32 && x === 100],
        ['below the span', { left: 100, right: 100, top: -12, bottom: -6 }, (x, y) => y >= 32 && x === 100]
    ];
    for (const [name, span, walkable] of cases) {
        const deps = { range: reach, inReachFrom, reachSpan: () => span,
            findCell: (x, y) => (walkable(x, y) ? { x, y } : null),
            occupied: (q) => !walkable(q.x, q.y) };   // named points elsewhere are refused too
        const p = overlapStandPoint([a], { x: 100, y: 0 }, player, deps);
        assert.ok(p && walkable(p.x, p.y), `${name}: ${JSON.stringify(p)}`);
    }
});

test('player.js and game.js: a far tap\'s walk passes { avoidNpcs } to every player line-of-sight test (R3 m1)', () => {
    const player = readFileSync(join(js, 'core/player.js'), 'utf8');
    assert.match(player, /export function movePlayerToPoint\(x, y, opts = null\)/);
    assert.match(player, /playerLosOpts = opts\?\.avoidNpcs \? \{ avoidNpcs: true \} : null;/);
    assert.equal((player.match(/hasPlayerLineOfSight\([^;]*playerLosOpts\)/g) || []).length, 3);
    assert.match(player, /smoothWorldPathForPlayer\(cx, cy, path, true, playerLosOpts\)/);
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /movePlayerToPoint\(target\.x, target\.y, \{ avoidNpcs: true \}\)/);
});

// ── Overlap plan: pixel hits, the sole hit, the overlap stand point (unit tests 1 to 15) ──
// A sprite at (x, y), origin 0, whose opaque pixels are given by `shape(lx, ly)`
const hs = (id, x, y, w, h, extra = {}) => ({ id, x, y, width: w, height: h, originX: 0, originY: 0, active: true,
    visible: true, interactable: true, depth: 0, texture: { key: id }, frame: { name: 0, realWidth: w, realHeight: h }, ...extra });
const SHAPES = new Map();
const alphaOf = (lx, ly, key) => (SHAPES.get(key) ? (SHAPES.get(key)(lx, ly) ? 255 : 0) : 255);
const strictAt = (tx, ty) => (s) => opaqueAt(s, tx, ty, alphaOf, { unreadable: false });
const strictNear = (tx, ty) => (s) => opaqueNear(s, tx, ty, alphaOf, 2, { unreadable: false });
const hitDeps = (tx, ty, extra = {}) => ({ onPixels: strictAt(tx, ty), npcOnFigure: strictNear(tx, ty), ...extra });
// The printout: 16 x 16, a diamond with empty corners; the copier 35 x 46, opaque all over
SHAPES.set('printout', (lx, ly) => Math.abs(lx - 7.5) + Math.abs(ly - 7.5) <= 8);
SHAPES.set('npcA', (lx, ly) => lx >= 30 && lx < 50 && ly >= 22 && ly < 62);
SHAPES.set('npcB', (lx, ly) => lx >= 30 && lx < 50 && ly >= 22 && ly < 62);
const copier = () => hs('copier', 100, 100, 35, 46, { depth: 10 });
const printout = () => hs('printout', 110, 100, 16, 16, { depth: 11 });

test('overlap 1: two objects on their pixels are both hits, topmost first', () => {
    const { allHits, menuHits } = pixelHits({ objectsUnderTap: [copier(), printout()] }, hitDeps(118, 108));
    assert.deepEqual(allHits.map(h => h.id), ['printout', 'copier']);
    assert.deepEqual(menuHits.map(h => h.id), ['printout', 'copier']);
});

test('overlap 2: the printout\'s transparent corner leaves only the copier as a hit', () => {
    const { allHits } = pixelHits({ objectsUnderTap: [printout(), copier()] }, hitDeps(110.5, 100.5));
    assert.deepEqual(allHits.map(h => h.id), ['copier']);
});

test('overlap 3: hidden, inactive, alpha 0 and other-room objects drop; seats are hits but not menu hits', () => {
    const tap = hitDeps(118, 108, { sameRoom: (o) => o.room !== 'other', isSeat: (o) => !!o.seat });
    const gone = [hs('a', 100, 100, 35, 46, { visible: false }), hs('b', 100, 100, 35, 46, { active: false }),
        hs('c', 100, 100, 35, 46, { alpha: 0 }), hs('d', 100, 100, 35, 46, { room: 'other' }),
        hs('e', 100, 100, 35, 46, { interactable: false })];
    assert.deepEqual(pixelHits({ objectsUnderTap: gone }, tap).allHits, []);
    const chair = hs('chair', 100, 100, 35, 46, { seat: true, depth: 20 });
    const r = pixelHits({ objectsUnderTap: [chair, copier()] }, tap);
    assert.deepEqual(r.allHits.map(h => h.id), ['chair', 'copier']);
    assert.deepEqual(r.menuHits.map(h => h.id), ['copier']);
});

test('overlap 4: NPCs count on their figures; KO, walking away and other-room ones drop', () => {
    const a = hs('npcA', 60, 60, 80, 80, { _isNPC: true }), b = hs('npcB', 70, 60, 80, 80, { _isNPC: true });
    assert.deepEqual(pixelHits({ npcsUnderTap: [a, b] }, hitDeps(105, 100)).allHits.map(h => h.id), ['npcA', 'npcB']);
    // Tap at x 115: off A's figure (x 90-110, plus 2 px), on B's (x 100-120)
    assert.deepEqual(pixelHits({ npcsUnderTap: [a, b] }, hitDeps(115, 100)).allHits.map(h => h.id), ['npcB']);
    assert.deepEqual(pixelHits({ npcsUnderTap: [a, b] }, hitDeps(105, 100, { givesWay: (n) => n.id === 'npcA',
        sameRoom: (n) => n.id !== 'npcB' })).allHits, []);
});

test('overlap 5: an NPC on her figure under an object opaque at the tap: both hits, either draw order', () => {
    const n = hs('npcA', 60, 60, 80, 80, { _isNPC: true, depth: 50 });
    for (const d of [40, 60]) {
        const o = hs('box', 95, 95, 20, 20, { depth: d });
        const ids = pixelHits({ objectsUnderTap: [o], npcsUnderTap: [n] }, hitDeps(100, 100)).allHits.map(h => h.id);
        assert.deepEqual(ids, d > 50 ? ['box', 'npcA'] : ['npcA', 'box']);
    }
});

test('overlap 6: an open door drops; a shut door counts on its pixels only', () => {
    SHAPES.set('door', (lx) => lx >= 4);
    const door = (open) => hs('door', 100, 100, 32, 32, { doorProperties: { open } });
    assert.deepEqual(pixelHits({ doorUnderTap: door(true) }, hitDeps(110, 110)).allHits, []);
    assert.equal(pixelHits({ doorUnderTap: door(false) }, hitDeps(110, 110)).allHits.length, 1);
    assert.deepEqual(pixelHits({ doorUnderTap: door(false) }, hitDeps(101, 110)).allHits, []);
});

test('overlap 7: identical stacked copies within 2 px collapse; 3 px apart or different keep both', () => {
    const key = (o) => `${o.name}|${o.texture.key}|${o.frame.name}|${o.obs}`;
    const tap = hitDeps(110, 110, { stackKey: key });
    const sheet = (id, x, extra = {}) => hs(id, x, 100, 30, 30, { name: 'Page', obs: 'A page.', texture: { key: 'page' }, ...extra });
    assert.equal(pixelHits({ objectsUnderTap: [sheet('p1', 100, { depth: 2 }), sheet('p2', 102)] }, tap).allHits.length, 1);
    assert.equal(pixelHits({ objectsUnderTap: [sheet('p1', 100, { depth: 2 }), sheet('p2', 102)] }, tap).allHits[0].id, 'p1');
    assert.equal(pixelHits({ objectsUnderTap: [sheet('p1', 100), sheet('p2', 103)] }, tap).allHits.length, 2);
    assert.equal(pixelHits({ objectsUnderTap: [sheet('p1', 100), sheet('p2', 101, { obs: 'Other.' })] }, tap).allHits.length, 2);
    assert.equal(pixelHits({ objectsUnderTap: [sheet('p1', 100), sheet('p2', 101, { texture: { key: 'note' } })] }, tap).allHits.length, 2);
});

test('overlap 8: unreadable alpha is no hit in the strict form; the old form still answers true', () => {
    const missing = hs('m', 100, 100, 20, 20, { texture: { key: '__MISSING' } });
    const nullAlpha = hs('n', 100, 100, 20, 20);
    const none = () => null;
    assert.equal(opaqueAt(missing, 105, 105, alphaOf, { unreadable: false }), false);
    assert.equal(opaqueAt(nullAlpha, 105, 105, none, { unreadable: false }), false);
    assert.equal(opaqueAt(nullAlpha, 105, 105, none), true);
    assert.equal(opaqueAt(missing, 105, 105, alphaOf), true);
    assert.equal(opaqueNear(nullAlpha, 105, 105, none, 2, { unreadable: false }), false);
    SHAPES.set('slop', (lx) => lx < 5);
    const slop = hs('slop', 100, 100, 20, 20);
    assert.equal(opaqueNear(slop, 106, 105, alphaOf, 2, { unreadable: false }), true, 'the slop is kept');
});

test('overlap 9: soleHit gives the one object, NPC or door; a seat or two hits give null', () => {
    const o = { id: 'o' }, seat = { id: 's', seat: true };
    const isSeat = (h) => !!h.seat;
    assert.equal(soleHit({ allHits: [o] }, isSeat), o);
    assert.equal(soleHit({ allHits: [{ _isNPC: true }] }, isSeat)._isNPC, true);
    assert.equal(soleHit({ allHits: [seat] }, isSeat), null);
    assert.equal(soleHit({ allHits: [o, seat] }, isSeat), null);
    assert.equal(soleHit({ allHits: [] }, isSeat), null);
});

test('overlap 10: hostileHit is set when an NPC hit is hostile', () => {
    const n = hs('npcA', 60, 60, 80, 80, { _isNPC: true });
    assert.equal(pixelHits({ npcsUnderTap: [n] }, hitDeps(100, 100, { hostile: () => true })).hostileHit, n);
    assert.equal(pixelHits({ npcsUnderTap: [n] }, hitDeps(100, 100)).hostileHit, null);
});

test('overlap 11: overlapStandPoint tries the click point, then each hit; skips walls and other rooms; null when none', () => {
    const player = { x: 0, y: 0 };
    const a = { id: 'a', x: 100, y: 0 }, b = { id: 'b', x: 110, y: 0 };
    const near = (p, h, r = 20) => Math.hypot(p.x - h.x, p.y - h.y) <= r;
    const base = { range: 32, inReachFrom: (p, h) => near(p, h) };
    // The click point's stand point (16 px short of x 105: x 89) is 11 px from a, 21 from b: misses b
    const p1 = overlapStandPoint([a, b], { x: 105, y: 0 }, player, { ...base, inReachFrom: (p, h) => near(p, h, 22) });
    assert.deepEqual(p1, { x: 89, y: 0 });
    // With 20 px it misses b; a's own stand point (x 84) misses b too; b's (x 94) reaches both
    assert.deepEqual(overlapStandPoint([a, b], { x: 105, y: 0 }, player, base), { x: 94, y: 0 });
    // A wall (or another room) refuses that point: objectStandPoint returns none usable there
    const walled = { ...base, findCell: (x, y) => ({ x, y }), wallClear: (p) => p.x < 90 };
    const p3 = overlapStandPoint([a, b], { x: 105, y: 0 }, player, walled);
    assert.ok(p3 === null || p3.x < 90, JSON.stringify(p3));
    assert.equal(overlapStandPoint([a, { id: 'c', x: 200, y: 0 }], { x: 150, y: 0 }, player, base), null);
    // A door hit is judged with the door range
    const seen = [];
    overlapStandPoint([{ id: 'd', x: 300, y: 0, doorProperties: {} }], { x: 300, y: 0 }, player,
        { ...base, doorRange: 64, inReachFrom: () => false, findCell: (x, y) => { seen.push(x); return { x, y }; } });
    assert.ok(seen.includes(268), `door stand point aims half the door range short: ${seen.slice(0, 3)}`);
});

test('overlap 11b: overlapStandPoint steps the reach margin 12, 8, 4, 0 over walkable cells; null with no joint cell', () => {
    assert.deepEqual(OVERLAP_MARGINS, [12, 8, 4, 0]);
    const player = { x: 0, y: 0 };
    const reach = 20;
    const inReachFrom = (p, h, margin = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= reach - margin;
    const base = { range: 32, inReachFrom, findCell: (x, y) => ({ x, y }) };
    const a = { id: 'a', x: 100, y: 0 };
    // Two hits d apart share a spot (their midpoint) only inside reach - margin, so the margin
    // that wins is the widest one that still has a cell: d 16 -> 12, 24 -> 8, 32 -> 4, 40 -> 0
    for (const [d, margin] of [[16, 12], [24, 8], [32, 4], [40, 0]]) {
        const b = { id: 'b', x: 100 + d, y: 0 };
        const p = overlapStandPoint([a, b], { x: 100 + d / 2, y: 0 }, player, base);
        assert.ok(p, `d ${d}: a spot`);
        assert.ok(inReachFrom(p, a, margin) && inReachFrom(p, b, margin), `d ${d}: reaches both at margin ${margin}`);
        if (margin < 12) assert.ok(!(inReachFrom(p, a, margin + 4) && inReachFrom(p, b, margin + 4)), `d ${d}: no wider margin was possible`);
    }
    // No joint cell: the hits are further apart than twice the reach
    assert.equal(overlapStandPoint([a, { id: 'b', x: 148, y: 0 }], { x: 124, y: 0 }, player, base), null);
    // Joint cells exist but none is walkable
    const b40 = { id: 'b', x: 140, y: 0 };
    assert.equal(overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { ...base, findCell: (x, y) => (x < 110 ? { x, y } : null) }), null);
    // A wall refuses the only joint cell
    assert.equal(overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { ...base, wallClear: () => false }), null);
    // A cell inside an NPC's body is skipped (the walk cannot end there)
    const pOcc = overlapStandPoint([a, { id: 'b', x: 124, y: 0 }], { x: 112, y: 0 }, player, { ...base, occupied: (p) => Math.abs(p.x - 112) < 6 && Math.abs(p.y) < 6 });
    assert.ok(pOcc && !(Math.abs(pOcc.x - 112) < 6 && Math.abs(pOcc.y) < 6), JSON.stringify(pOcc));
    assert.equal(overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { ...base, occupied: () => true }), null);
    // The margin-12 point still comes first when one exists (no lattice detour)
    const c = { id: 'c', x: 110, y: 0 };
    const pc = overlapStandPoint([a, c], { x: 105, y: 0 }, player, base);
    assert.ok(inReachFrom(pc, a, 12) && inReachFrom(pc, c, 12));
});

test('overlap 11c: overlapStandPoint picks the cell with the most slack at the winning margin, ties to the shortest walk', () => {
    const player = { x: 0, y: 0 };
    const hits = [{ id: 'a', x: 100, y: -4 }, { id: 'b', x: 100, y: 4 }];
    // Each walkable cell has a made-up room (the biggest margin it passes); all below 12, where slack is ranked
    const mk = (room) => {
        const key = (p) => `${p.x},${p.y}`;
        return { range: 32, inReachFrom: (p, h, m = 12) => (room[key(p)] ?? -1000) >= m, findCell: (x, y) => (key({ x, y }) in room ? { x, y } : null) };
    };
    const more = overlapStandPoint(hits, { x: 100, y: 0 }, player, mk({ '72,0': 8, '84,0': 11 }));
    assert.deepEqual(more, { x: 84, y: 0 }, 'more room beats the shorter walk');
    const tie = overlapStandPoint(hits, { x: 100, y: 0 }, player, mk({ '72,0': 8, '84,0': 8 }));
    assert.deepEqual(tie, { x: 72, y: 0 }, 'equal room goes to the shorter walk');
});

test('overlap 11d (R5 m1): slack beats walk length only within 48 px of the nearest passing cell', () => {
    const player = { x: 0, y: 0 };
    const hits = [{ id: 'a', x: 100, y: -4 }, { id: 'b', x: 100, y: 4 }];
    // Each walkable cell has a made-up room (the biggest margin it passes); other points pass nothing
    const room = { '72,0': 8, '132,28': 11, '80,0': 11 };   // all below 12, so slack is ranked (the cap is 12)
    const key = (p) => `${p.x},${p.y}`;
    const inReachFrom = (p, h, m = 12) => (room[key(p)] ?? -1000) >= m;
    const cells = (list) => (x, y) => (list.includes(`${x},${y}`) ? { x, y } : null);
    player.x = 60;
    // (132,28) has the most room but its walk (78) is more than 48 px longer than (72,0)'s (10)
    const capped = overlapStandPoint(hits, { x: 100, y: 0 }, player, { range: 32, inReachFrom, findCell: cells(['72,0', '132,28']) });
    assert.deepEqual(capped, { x: 72, y: 0 }, 'the cell across the way with more room loses');
    // (80,0) is 20 away: within 48 px of the nearest, so its extra room still wins
    const close = overlapStandPoint(hits, { x: 100, y: 0 }, player, { range: 32, inReachFrom, findCell: cells(['72,0', '80,0']) });
    assert.deepEqual(close, { x: 80, y: 0 });
});

test('overlap 11m (R3 m5): slack above 12 is not ranked: the shorter walk wins', () => {
    const player = { x: 60, y: 0 };
    const hits = [{ id: 'a', x: 100, y: -4 }, { id: 'b', x: 100, y: 4 }];
    const room = { '72,0': 12, '92,0': 40 };
    const key = (p) => `${p.x},${p.y}`;
    const inReachFrom = (p, h, m = 12) => (room[key(p)] ?? -1000) >= m;
    const findCell = (x, y) => (key({ x, y }) in room ? { x, y } : null);
    const p = overlapStandPoint(hits, { x: 100, y: 0 }, player, { range: 32, inReachFrom, findCell });
    assert.deepEqual(p, { x: 72, y: 0 }, 'a cell with 40 px of room does not beat one with 12');
});

test('overlap 11n (R3 m2): ranked by risk: a clear-line cell at margin 12 or 8, then a no-line one at 12 or 8, then the thin margins', () => {
    const slackOf = (p, hs) => Math.min(...hs.map(h => 32 - Math.hypot(p.x - h.x, p.y - h.y)));
    const inReachFrom = (p, h, m = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= 32 - m;
    const findCell = (x, y, r) => (r === 0 ? { x: Math.round(x / 4) * 4, y: Math.round(y / 4) * 4 } : null);
    const occupied = (p) => p.x % 4 !== 0 || p.y % 4 !== 0;   // only lattice cells compete
    const a = { id: 'a', x: 100, y: 0 }, b = { id: 'b', x: 140, y: 0 };
    const run = (pathClear) => overlapStandPoint([a, b], { x: 120, y: 0 }, { x: 121.3, y: 201.7 },
        { range: 32, inReachFrom, findCell, pathClear, occupied, wallClear: () => true });
    // The review's probe: lines only at the rim (slack under 4); the centre has 12 slack and no line
    const r = run((q) => slackOf(q, [a, b]) < 4);
    assert.ok(r && slackOf(r, [a, b]) >= 12, `the no-line wide-margin cell beats the thin clear-line one: ${JSON.stringify(r)} slack ${r && slackOf(r, [a, b])}`);
    // A clear line at margin 8 still beats a no-line cell at 12? No: the order is 12 clear, 8 clear, 12 none
    const r2 = run((q) => slackOf(q, [a, b]) >= 8);
    assert.ok(r2 && slackOf(r2, [a, b]) >= 8 && run(() => true), JSON.stringify(r2));
    // No line anywhere (the live Grace/Marek shape): still a joint cell, not null
    const r3 = run(() => false);
    assert.ok(r3 && inReachFrom(r3, a, 0) && inReachFrom(r3, b, 0), JSON.stringify(r3));
});

test('overlap 11o (R3 n1): the no-line fallback takes the cell with the most slack, not the shortest walk', () => {
    const player = { x: 60, y: 0 };
    const hits = [{ id: 'a', x: 100, y: -4 }, { id: 'b', x: 100, y: 4 }];
    const room = { '72,0': 8, '84,0': 11 };
    const key = (p) => `${p.x},${p.y}`;
    const p = overlapStandPoint(hits, { x: 100, y: 0 }, player, { range: 32, inReachFrom: (q, h, m = 12) => (room[key(q)] ?? -1000) >= m,
        findCell: (x, y) => (key({ x, y }) in room ? { x, y } : null), pathClear: () => false });
    assert.deepEqual(p, { x: 84, y: 0 });
});

test('overlap 11e (R5 m2/m3): the lattice stays inside the hits\' reach boxes, is not built when a named point has margin 12, and skips cells with no path', () => {
    const player = { x: 0, y: 0 };
    const reach = 20;
    const inReachFrom = (p, h, margin = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= reach - margin;
    const asked = [];
    const findCell = (x, y, r) => { if (r === 0) asked.push([x, y]); return { x, y }; };   // the lattice asks with radius 0
    // A named point passes at margin 12: the lattice is never queried
    const a = { id: 'a', x: 100, y: 0 }, c = { id: 'c', x: 106, y: 0 };
    overlapStandPoint([a, c], { x: 103, y: 0 }, player, { range: 32, inReachFrom: (p, h, m = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= 40 - m, findCell });
    assert.equal(asked.length, 0, 'no lattice scan');
    // No named point passes: the scan stays within the overlap of the reach boxes (32 px: x 68..132 and 108..172 -> 108..132)
    asked.length = 0;
    const b = { id: 'b', x: 130, y: 0 };
    overlapStandPoint([a, b], { x: 115, y: 0 }, player, { range: 32, inReachFrom, findCell });
    const lattice = asked;
    assert.ok(lattice.length > 0 && lattice.every(([x, y]) => x >= 98 && x <= 132 && y >= -32 && y <= 32), JSON.stringify(lattice.slice(0, 4)));
    // A lattice cell with no clear straight line is the last choice, not refused: 40 px apart only (120,0) reaches both
    const b40 = { id: 'b', x: 140, y: 0 };
    const reached = [];
    const refused = overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { range: 32, inReachFrom, findCell,
        pathClear: (q) => { reached.push(q); return false; } });
    assert.deepEqual(refused, { x: 120, y: 0 }, 'no clear line to the only cell: still offered (the walk pathfinds)');
    assert.deepEqual(reached, [{ x: 120, y: 0 }]);
    assert.deepEqual(overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { range: 32, inReachFrom, findCell, pathClear: () => true }), { x: 120, y: 0 });
    // A passing cell with a clear line beats a nearer one without
    const prefer = overlapStandPoint([a, b40], { x: 120, y: 0 }, player, { range: 32, inReachFrom: (p, h, m = 0) => Math.hypot(p.x - h.x, p.y - h.y) <= 30 - m, findCell, pathClear: (q) => q.y > 0 });
    assert.ok(prefer && prefer.y > 0, JSON.stringify(prefer));
});

test('overlap 11f (R5 M1): the retry target lies past the stand point, far enough from the feet to move, with every hit in reach', () => {
    const reach = 32;
    const inReachFrom = (p, h, m = 0) => Math.hypot(p.x - h.x, p.y - h.y) <= reach - m;
    const findCell = (x, y) => ({ x, y });
    const hits = [{ id: 'a', x: 100, y: 0 }, { id: 'b', x: 100, y: 10 }];
    const stand = { x: 80, y: 5 };
    for (const short of [1, 4, 7, 7.9]) {
        const feet = { x: stand.x - short, y: stand.y };   // the walk came from the west and stopped short
        const t = overlapRetryTarget(feet, stand, hits, { inReachFrom, findCell, arrival: 8 });
        assert.ok(t, `short ${short}: a target`);
        assert.ok(Math.hypot(t.x - feet.x, t.y - feet.y) > 8, `short ${short}: ${JSON.stringify(t)} moves the feet`);
        assert.ok(t.x >= stand.x, 'on or past the stand point along the approach');
        assert.ok(hits.every(h => inReachFrom(t, h, 0)));
    }
    // Aims 10 px past when that keeps everything in reach
    assert.deepEqual(overlapRetryTarget({ x: 73, y: 5 }, stand, hits, { inReachFrom, findCell }), { x: 90, y: 5 });
    // Past points that lose a hit are shortened; the cell must be walkable; nothing that moves: null
    const t2 = overlapRetryTarget({ x: 73, y: 5 }, stand, hits, { inReachFrom: (p, h, m) => inReachFrom(p, h, m) && p.x <= 84, findCell });
    assert.ok(t2.x <= 84 && Math.hypot(t2.x - 73, t2.y - 5) > 8, JSON.stringify(t2));
    assert.equal(overlapRetryTarget({ x: 73, y: 5 }, stand, hits, { inReachFrom: (p, h, m) => inReachFrom(p, h, m) && p.x <= 80, findCell }), null);
    assert.equal(overlapRetryTarget({ x: 73, y: 5 }, stand, hits, { inReachFrom, findCell: () => null }), null);
    assert.equal(overlapRetryTarget(stand, stand, hits, { inReachFrom, findCell }), null, 'already there');
});

test('overlap 11g (R2 m1): the lattice box follows each hit\'s reach span, so a wide desk and a monitor at its far end still get a joint cell', () => {
    const player = { x: 0, y: 200 };
    const findCell = (x, y) => ({ x: Math.round(x / 4) * 4, y: Math.round(y / 4) * 4 });
    const A = { id: 'A', x: 100, y: 0, w: 128 }, B = { id: 'B', x: 170, y: 0, w: 32 };
    // reach to the nearest x of each span (interaction-reach.js reachX); a desk west of x=166 hides the named points
    const reach = (p, h, m = 12) => { const nx = Math.max(h.x - h.w / 2, Math.min(p.x, h.x + h.w / 2)); return p.x >= 166 && Math.hypot(p.x - nx, p.y - h.y) <= 32 - m; };
    const reachSpan = (h) => ({ left: h.x - h.w / 2, right: h.x + h.w / 2, top: h.y, bottom: h.y });
    const base = { range: 32, inReachFrom: reach, findCell };
    // Centres only: the boxes (68..132 and 138..202) never meet and no cell is found
    assert.equal(overlapStandPoint([A, B], { x: 160, y: 0 }, player, base), null, 'without spans the box is empty');
    const p = overlapStandPoint([A, B], { x: 160, y: 0 }, player, { ...base, reachSpan });
    assert.ok(p && reach(p, A, 0) && reach(p, B, 0), JSON.stringify(p));
});

test('overlap 11h (R2 m2): a cell with no clear line ranks below every clear-line cell, across margins', () => {
    const player = { x: 0, y: 200 };
    const a = { id: 'a', x: 100, y: 0 }, b = { id: 'b', x: 140, y: 0 };
    const findCell = (x, y) => ({ x: Math.round(x / 4) * 4, y: Math.round(y / 4) * 4 });
    const inReachFrom = (p, h, m = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= 32 - m;
    // Only the y > 0 cells have a clear line; the y = 0 cells reach both at margin 12, the y = 4 ones at 8
    const r = overlapStandPoint([a, b], { x: 120, y: 0 }, player, { range: 32, inReachFrom, findCell, pathClear: (q) => q.y > 0 });
    assert.ok(r && r.y > 0, `the clear-line cell wins even at a lower margin: ${JSON.stringify(r)}`);
    assert.equal(inReachFrom(r, a, 8) && inReachFrom(r, b, 8), true);
});

test('overlap 11i (R2 m3): walk length is the straight line from the feet, not a path length (pinned)', () => {
    // A cell 40 px away in a straight line wins on slack over the nearest one, whatever route a path
    // to it would take: the pathfinder is asynchronous and the only hook is pathClear (a yes or no)
    const player = { x: 0, y: 0 };
    const hits = [{ id: 'a', x: 100, y: 0 }, { id: 'b', x: 100, y: 0 }];
    const inReachFrom = (p, h, m = 12) => Math.hypot(p.x - h.x, p.y - h.y) <= 30 - m;
    const cells = (set) => (x, y) => (set.includes(`${x},${y}`) ? { x, y } : null);
    const p = overlapStandPoint(hits, { x: 100, y: 0 }, player, { range: 32, inReachFrom, findCell: cells(['72,0', '108,0']) });
    assert.deepEqual(p, { x: 108, y: 0 }, 'more slack within the 48 px straight-line extra beats the shorter walk');
    assert.equal(overlapStandPoint.length, 4);
});

test('overlap 11j (R2 m4): the lattice box moves with the body offset: the feet are lower than the sprite', () => {
    const player = { x: 0, y: 0, body: { center: { x: 0, y: 31 } } };   // fy = 31
    const a = { id: 'a', x: 100, y: 0 }, b = { id: 'b', x: 140, y: 0 };
    const asked = [];
    const findCell = (x, y, r) => { if (r === 0) asked.push([x, y]); return { x, y }; };
    // The reach origin is the sprite position; the feet are fy lower, so a stand cell (feet) at y reaches from y - 31
    const inReachFrom = (p, h, m = 12) => Math.hypot(p.x - h.x, (p.y - 31) - h.y) <= 32 - m;
    const r = overlapStandPoint([a, b], { x: 120, y: 31 }, player, { range: 32, inReachFrom, findCell });
    assert.ok(asked.length > 0 && asked.every(([x, y]) => y >= -32 + 31 && y <= 32 + 31), JSON.stringify(asked.slice(0, 3)));
    assert.ok(r && inReachFrom(r, a, 0) && inReachFrom(r, b, 0), JSON.stringify(r));
    assert.ok(Math.abs(r.y - 31) <= 4, `feet about 31 px below the hits' y: ${JSON.stringify(r)}`);
});

test('overlap 11k (R2 n2): the retry target skips a cell outside the hits\' room', () => {
    const hits = [{ id: 'a', x: 100, y: 0 }, { id: 'b', x: 100, y: 10 }];
    const stand = { x: 80, y: 5 }, feet = { x: 73, y: 5 };
    const inReachFrom = (p, h, m = 0) => Math.hypot(p.x - h.x, p.y - h.y) <= 32 - m;
    const findCell = (x, y) => ({ x, y });
    assert.deepEqual(overlapRetryTarget(feet, stand, hits, { inReachFrom, findCell }), { x: 90, y: 5 });
    const t = overlapRetryTarget(feet, stand, hits, { inReachFrom, findCell, sameRoom: (c) => c.x <= 84 });
    assert.ok(t && t.x <= 84, JSON.stringify(t));
    assert.equal(overlapRetryTarget(feet, stand, hits, { inReachFrom, findCell, sameRoom: () => false }), null);
});

test('overlap 11l (R2 n7): the retry skips a cell inside an NPC body', () => {
    const hits = [{ id: 'a', x: 100, y: 0 }];
    const stand = { x: 80, y: 5 }, feet = { x: 73, y: 5 };
    const inReachFrom = (p, h, m = 0) => Math.hypot(p.x - h.x, p.y - h.y) <= 32 - m;
    const findCell = (x, y) => ({ x, y });
    const t = overlapRetryTarget(feet, stand, hits, { inReachFrom, findCell, occupied: (c) => c.x > 86 });
    assert.ok(t && t.x <= 86, JSON.stringify(t));
});

test('overlap 10b (R2 n5): a hostile NPC never joins the hits', () => {
    const n = hs('npcA', 60, 60, 80, 80, { _isNPC: true });
    const o = hs('obj', 60, 60, 80, 80, { interactable: true });
    const r = pixelHits({ objectsUnderTap: [o], npcsUnderTap: [n] }, hitDeps(100, 100, { hostile: () => true }));
    assert.equal(r.hostileHit, n);
    assert.ok(!r.allHits.includes(n) && !r.menuHits.includes(n), 'no hostile in allHits or menuHits');
});

test('pending use: onPartial starts one more step and keeps the walk pending (R5 n3)', () => {
    const steps = [];
    let moving = false, inReach = false;
    const p = createPendingTapUse({
        inReach: () => inReach, isMoving: () => moving, use: () => steps.push('use'),
        feet: () => ({ x: 0, y: 0 }), onPartial: () => { if (steps.length) return false; steps.push('retry'); moving = true; return true; },
        onStoppedShort: () => steps.push('short')
    });
    p.arm({ id: 'x', interactable: true }, 0);
    p.update(100);
    assert.deepEqual(steps, ['retry']);
    assert.ok(p.get(), 'still pending');
    moving = false; p.update(200);
    assert.deepEqual(steps, ['retry'], 'second call: no more steps, still within the stop-short wait');
    p.update(100 + 600);
    assert.deepEqual(steps, ['retry', 'short']);
});

test('overlap 12: farUnderTap with every NPC under the tap finds the far one on her figure', () => {
    const a = { id: 'a', on: false }, b = { id: 'b', on: true };
    const deps = { inReach: () => false, npcOnFigure: (n) => n.on };
    assert.deepEqual(farUnderTap({ npcsUnderTap: [a, b] }, deps).farNpcs, [b]);
    assert.deepEqual(farUnderTap({ npcUnderTap: b }, deps).farNpcs, [b], 'the single form still works');
    assert.deepEqual(farUnderTap({ npcUnderTap: a }, deps).farNpcs, []);
});

test('overlap 13: tapPickList keeps an in-reach NPC and object under the tap; far things add no entry; hostiles drop', () => {
    const sarah = { label: 'sarah', isNpc: true, underTap: true };
    const log_ = { label: 'log', isObject: true, underTap: true, onObjectPixels: true };
    const near = { label: 'phone', isObject: true };
    assert.deepEqual(tapPickList([sarah, log_], []).map(c => c.label), ['sarah', 'log']);
    assert.deepEqual(tapPickList([sarah, log_, near], [{ id: 'pc' }]).map(c => c.label), ['sarah', 'log']);
    assert.deepEqual(tapPickList([sarah, { label: 'thug', isNpc: true, hostile: true, underTap: true }], []).map(c => c.label), ['sarah']);
});

test('overlap 14: seatsGiveWay needs an in-reach seat under the tap, nothing else under it, and a far object (R4 m6)', () => {
    const chair = { label: 'chair', isChair: true, underTap: true };
    const pc = { label: 'pc', isObject: true, underTap: true };
    assert.equal(seatsGiveWay([chair], [{ id: 'stick' }]), true);
    assert.equal(seatsGiveWay([chair, pc], [{ id: 'stick' }]), false);
    assert.equal(seatsGiveWay([chair], []), false);
    assert.equal(seatsGiveWay([], [{ id: 'stick' }]), false, 'an empty in-reach set does not give way');
    assert.equal(seatsGiveWay([{ ...chair, underTap: false }], [{ id: 'stick' }]), false);
});

test('overlap 15: createPendingTapUse with alive keeps a list target while one hit is there', () => {
    const used = [];
    const state = { moving: false, inReach: false };
    const hits = [{ gone: true }, { gone: false }];
    const p = createPendingTapUse({ inReach: () => state.inReach, isMoving: () => state.moving, use: (t) => used.push(t),
        alive: (list) => list.some(h => !h.gone) });
    p.arm(hits, 0);
    p.update(100);
    assert.equal(p.get()?.obj, hits, 'still pending: one hit is there');
    hits[1].gone = true;
    p.update(200);
    assert.equal(p.get(), null);
    // Without alive: today's object check (a hidden object drops it)
    const q = createPendingTapUse({ inReach: () => false, isMoving: () => false, use: () => {} });
    q.arm({ interactable: true, visible: false }, 0); q.update(100);
    assert.equal(q.get(), null);
});
