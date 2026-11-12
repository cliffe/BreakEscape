// A tap goes to the thing under the pointer (systems/tap-pick.js, game.js pointerdown).
// The UX access R1 finding 6 cases and the C3 replay U3 case (Kim's phone and stick).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tapPickList, farUnderTap, npcYieldsToObject, opaqueAt, objectStandPoint, createPendingTapUse, PENDING_TAP_USE_MS } from '../../public/break_escape/js/systems/tap-pick.js';
import { withoutChairsIfOthers, withoutLeavingNpcsIfObjects } from '../../public/break_escape/js/systems/interaction-reach.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

const RANGE = 32;      // INTERACTION_RANGE
// The pointerdown pipeline itself (gathering, the far lists, the NPC and object branches) is
// tested through game.js's own handler code in tap-pick-handler.test.mjs.

// ── tapPickList on its own ──
test('tapPickList: nothing far under the tap leaves the list as it was', () => {
    const list = [{ label: 'a' }, { label: 'b', underTap: true }];
    assert.equal(tapPickList(list, [], () => ({})), list);
    assert.equal(tapPickList(list, undefined, () => ({})), list);
    assert.deepEqual(tapPickList(null, [], () => ({})), []);
});

test('tapPickList: a far NPC under the tap drops candidates only near it and joins no menu', () => {
    const near = { label: 'note' }, under = { label: 'memo', underTap: true };
    assert.deepEqual(tapPickList([near], [], () => ({}), [{ id: 'sarah' }]), []);
    assert.deepEqual(tapPickList([near, under], [], () => ({}), [{ id: 'sarah' }]).map(c => c.label), ['memo']);
    assert.deepEqual(tapPickList([near], [], () => ({}), [null]), [near]);
});

test('tapPickList: a far object under the tap keeps only candidates under the tap, then adds it', () => {
    const near = { label: 'phone' }, under = { label: 'owner', underTap: true };
    const out = tapPickList([near, under], [{ id: 'pc' }], (o) => ({ label: o.id, far: true }));
    assert.deepEqual(out.map(c => c.label), ['owner', 'pc']);
    assert.deepEqual(tapPickList([near], [{ id: 'pc' }], (o) => ({ label: o.id })), []);
});

test('tapPickList with the filters: a leaving owner gives way to the far PC under the same tap', () => {
    const owner = { label: 'owner', underTap: true, leavingNpc: true };
    const list = withoutLeavingNpcsIfObjects(withoutChairsIfOthers(
        tapPickList([owner], [{ id: 'pc' }], (o) => ({ label: o.id, isObject: true, underTap: true, far: true }))));
    assert.deepEqual(list.map(c => c.label), ['pc']);
});

test('tapPickList with the filters: an in-reach chair under the tap gives way to the far object', () => {
    const chair = { label: 'chair', underTap: true, isChair: true, isObject: true };
    const list = withoutChairsIfOthers(tapPickList([chair], [{ id: 'stick' }], (o) => ({ label: o.id, isObject: true, far: true })));
    assert.deepEqual(list.map(c => c.label), ['stick']);
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
    assert.deepEqual(tapPickList([sarah, note], [{ id: 'directory' }], (o) => ({ label: o.id, far: true })).map(c => c.label), ['sarah']);
    // ...and with an in-reach object under the tap too, the in-reach menu stays, no far entry
    const pc = { label: 'pc', underTap: true, isObject: true };
    assert.deepEqual(tapPickList([sarah, pc], [{ id: 'directory' }], (o) => ({ label: o.id })).map(c => c.label), ['sarah', 'pc']);
});

test('tapPickList: an in-reach hostile near the tap leaves the list as gathered (M1)', () => {
    const thug = { label: 'thug', isNpc: true, hostile: true };   // not even on his figure
    const list = [thug];
    assert.equal(tapPickList(list, [{ id: 'pc' }], (o) => ({ label: o.id })), list);
    assert.equal(tapPickList(list, [], () => ({}), [{ id: 'far_npc' }]), list);
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
    assert.match(src, /import \{ tapPickList, farUnderTap, npcYieldsToObject, opaqueAt, objectStandPoint, createPendingTapUse \} from '\.\.\/systems\/tap-pick\.js'/);
    assert.match(src, /tapPickList\(gatherInteractablesNearClick\(worldX, worldY, tapObjectIds, onPixels\), farObjects, farObjectCandidate, farNpcs\)/);
    assert.match(src, /withoutLeavingNpcsIfObjects\(withoutChairsIfOthers\(gathered\)\)/);
    assert.match(src, /pendingTapUse\.clear\(\)/);
    assert.match(src, /pendingTapUse\.update\(Date\.now\(\)\)/);
    assert.match(src, /window\.__clearPendingTapUse = \(\) => pendingTapUse\.clear\(\)/);
});

test('player.js: the E key drops a far tap\'s pending use before interacting (R1 m4)', () => {
    const src = readFileSync(join(js, 'core/player.js'), 'utf8');
    const e = src.slice(src.indexOf("if (key === 'e')"), src.indexOf("if (key === 'e')") + 400);
    assert.match(e, /window\.__clearPendingTapUse\?\.\(\);\s*if \(window\.tryInteractWithNearest\)/);
});
