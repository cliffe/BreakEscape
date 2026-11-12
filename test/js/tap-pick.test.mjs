// A tap goes to the thing under the pointer (systems/tap-pick.js, game.js pointerdown).
// The UX access R1 finding 6 cases and the C3 replay U3 case (Kim's phone and stick).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tapPickList, objectStandPoint, createPendingTapUse, PENDING_TAP_USE_MS } from '../../public/break_escape/js/systems/tap-pick.js';
import { withoutChairsIfOthers, withoutLeavingNpcsIfObjects } from '../../public/break_escape/js/systems/interaction-reach.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

const RANGE = 32;      // INTERACTION_RANGE
const SLOP = 32;       // TILE_SIZE, the tap slop in gatherInteractablesNearClick

// A sprite with Phaser-like bounds (origin 0,0 for scenario objects, 0.5 for NPCs)
function sprite(id, x, y, w, h, extra = {}) {
    const ox = extra.originX ?? 0, oy = extra.originY ?? 0;
    return {
        id, x, y, width: w, height: h, originX: ox, originY: oy, interactable: true,
        getBounds() {
            const left = x - ox * w, top = y - oy * h;
            return { left, top, right: left + w, bottom: top + h };
        },
        ...extra
    };
}
const inside = (s, tx, ty) => { const b = s.getBounds(); return tx >= b.left && tx <= b.right && ty >= b.top && ty <= b.bottom; };
const reach = (player, s) => Math.hypot(s.x - player.x, s.y - player.y) <= RANGE;

// The pointerdown pipeline in game.js, over plain sprites: gather in-reach things in bounds or
// slop (underTap when in bounds), far objects under the tap, then the pick list and the filters
function tap(player, sprites, tx, ty) {
    const gathered = sprites
        .filter(s => reach(player, s))
        .filter(s => inside(s, tx, ty) || Math.hypot(s.x - tx, s.y - ty) <= SLOP)
        .map(s => ({ label: s.id, sprite: s, isObject: !s.npc, isChair: !!s.chair, leavingNpc: !!s.leaving, underTap: inside(s, tx, ty) }));
    const farUnderTap = sprites.filter(s => !s.npc && !s.chair && !reach(player, s) && inside(s, tx, ty));
    const farNpc = sprites.filter(s => s.npc && !s.ko && !s.leaving && !reach(player, s) && inside(s, tx, ty)).slice(0, 1);
    const list = tapPickList(gathered, farUnderTap, (o) => ({ label: o.id, sprite: o, isObject: true, underTap: true, far: true }), farNpc);
    let out = withoutLeavingNpcsIfObjects(withoutChairsIfOthers(list));
    if (out.length && out.every(c => c.leavingNpc) && farUnderTap.length) out = [];
    if (out.length > 1) return { menu: out.map(c => (c.far ? `walk:${c.label}` : c.label)) };
    if (out.length === 1) return { act: out[0].far ? `walk:${out[0].label}` : out[0].label };
    // Empty: the NPC branch, then the object branch (walk to the top object under the tap)
    const top = sprites.find(s => inside(s, tx, ty) && !s.ko);
    return { fallThrough: top ? top.id : null };
}

// ── C3 U3: Kim knocked out drops her stick and her phone ──
test('U3: a tap on the stick from out of reach walks to the stick, not the in-reach phone', () => {
    const stick = sprite('kim_usb', 168, 129, 13, 8);
    const phone = sprite('kim_phone', 152, 129, 12, 21);
    const player = { x: 150, y: 100 };          // phone 29 px away (in reach), stick 34 px (out)
    assert.ok(reach(player, phone) && !reach(player, stick));
    const tx = 174.5, ty = 133;                 // the stick's centre
    assert.ok(!inside(phone, tx, ty), 'the two do not overlap');
    assert.ok(Math.hypot(phone.x - tx, phone.y - ty) <= SLOP, 'the phone is within tap slop, as in the replay');
    assert.deepEqual(tap(player, [stick, phone], tx, ty), { fallThrough: 'kim_usb' });
});

test('U3: a tap on the phone still picks up the phone', () => {
    const stick = sprite('kim_usb', 168, 129, 13, 8);
    const phone = sprite('kim_phone', 152, 129, 12, 21);
    assert.deepEqual(tap({ x: 150, y: 100 }, [stick, phone], 158, 140), { act: 'kim_phone' });
});

test('U3: with both in reach a tap on the stick between them still gives the menu', () => {
    const stick = sprite('kim_usb', 168, 129, 13, 8);
    const phone = sprite('kim_phone', 152, 129, 12, 21);
    assert.deepEqual(tap({ x: 160, y: 110 }, [stick, phone], 174.5, 133), { menu: ['kim_usb', 'kim_phone'] });
});

// ── UX access finding 6: Omar seated over his PC ──
const omarAt = () => sprite('omar', 120, 92, 40, 48, { npc: true, originX: 0.5, originY: 0.5 });
const pcAt = () => sprite('omar_pc', 104, 96, 32, 24);

test('finding 6: seated owner, PC out of reach, tap on the PC under him: menu with the PC as walk then use', () => {
    const omar = omarAt(), pc = pcAt();
    const player = { x: 128, y: 118 };          // Omar 27 px away (in reach), the PC 33 px (out)
    assert.ok(reach(player, omar) && !reach(player, pc));
    const tx = 110, ty = 100;                   // the PC's top-left area, inside Omar's frame too
    assert.ok(inside(pc, tx, ty) && inside(omar, tx, ty));
    assert.deepEqual(tap(player, [omar, pc], tx, ty), { menu: ['omar', 'walk:omar_pc'] });
});

test('finding 6: seated owner, PC out of reach, tap on the PC clear of him: walk to the PC', () => {
    const omar = omarAt(), pc = pcAt();
    const player = { x: 128, y: 118 };
    const tx = 134, ty = 118;                   // the PC's lower-right corner, outside Omar's frame
    assert.ok(inside(pc, tx, ty) && !inside(omar, tx, ty));
    assert.ok(Math.hypot(omar.x - tx, omar.y - ty) <= SLOP, 'Omar is within tap slop');
    assert.deepEqual(tap(player, [omar, pc], tx, ty), { fallThrough: 'omar_pc' });
});

test('finding 6: seated owner with both in reach: the pick-one menu stays', () => {
    const omar = omarAt(), pc = pcAt();
    const player = { x: 116, y: 110 };
    assert.ok(reach(player, omar) && reach(player, pc));
    assert.deepEqual(tap(player, [omar, pc], 110, 100), { menu: ['omar', 'omar_pc'] });
});

test('finding 6: a memo next to an NPC, both in reach: the menu stays', () => {
    const npc = sprite('clerk', 200, 200, 32, 48, { npc: true, originX: 0.5, originY: 0.5 });
    const memo = sprite('memo', 214, 214, 10, 8);
    assert.deepEqual(tap({ x: 205, y: 225 }, [npc, memo], 218, 218), { menu: ['clerk', 'memo'] });
});

test('finding 6: a plain tap on a seated NPC\'s head talks to them', () => {
    const omar = omarAt(), pc = pcAt();
    const player = { x: 128, y: 118 };
    const tx = 120, ty = 74;                    // his head, above the PC
    assert.ok(inside(omar, tx, ty) && !inside(pc, tx, ty));
    assert.deepEqual(tap(player, [omar, pc], tx, ty), { act: 'omar' });
    // ...and with the PC in reach too
    assert.deepEqual(tap({ x: 116, y: 110 }, [omar, pc], tx, ty), { menu: ['omar', 'omar_pc'] });
});

// ── m01 live finding: Sarah behind the reception desk, a note within slop of her head ──
test('a tap on an out-of-reach NPC walks to her, not the in-reach note near the tap', () => {
    const sarah = sprite('sarah_martinez', 128, 41, 80, 80, { npc: true, originX: 0.5, originY: 0.5 });
    const note = sprite('reception_area_notes_2', 135, 54, 16, 16);
    const player = { x: 154, y: 69 };
    assert.ok(!reach(player, sarah) && reach(player, note));
    assert.ok(!inside(note, 128, 30) && Math.hypot(note.x - 128, note.y - 30) <= SLOP);
    assert.deepEqual(tap(player, [sarah, note], 128, 30), { fallThrough: 'sarah_martinez' });
    // A tap on the note itself, inside her frame, still takes the note
    assert.deepEqual(tap(player, [sarah, note], 142, 62), { act: 'reception_area_notes_2' });
});

test('a far NPC walking away does not take the tap from the in-reach item near it', () => {
    const npc = sprite('leaver', 128, 41, 80, 80, { npc: true, leaving: true, originX: 0.5, originY: 0.5 });
    const note = sprite('note', 135, 54, 16, 16);
    assert.deepEqual(tap({ x: 154, y: 69 }, [npc, note], 128, 30), { act: 'note' });
});

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

// ── game.js wiring ──
test('game.js: pointerdown builds the pick list with tapPickList before the chair and leaving filters', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(src, /import \{ tapPickList, objectStandPoint, createPendingTapUse \} from '\.\.\/systems\/tap-pick\.js'/);
    assert.match(src, /tapPickList\(gatherInteractablesNearClick\(worldX, worldY, tapObjectIds\), farUnderTap, farObjectCandidate, farNpcUnderTap\)/);
    assert.match(src, /!isObjectInInteractionRange\(npcUnderTap\)\s*&& !npcGivesWay\(window\.player, npcUnderTap, tapObjectIds\)/);
    assert.match(src, /withoutLeavingNpcsIfObjects\(withoutChairsIfOthers\(gathered\)\)/);
    assert.match(src, /pendingTapUse\.clear\(\)/);
    assert.match(src, /pendingTapUse\.update\(Date\.now\(\)\)/);
});

test('game.js: the far object branch walks then uses, and seats still queue a sit', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(src, /walkToObjectThenUse\(obj\);/);
    const fn = src.slice(src.indexOf('function walkToObjectThenUse('), src.indexOf('function farObjectCandidate('));
    assert.match(fn, /objectStandPoint\(obj, player/);
    assert.match(fn, /window\.seating\?\.isSeat\(obj\)\) window\.seating\.queueSit\(obj\);\s*else pendingTapUse\.arm\(obj/);
    // candidates carry underTap from the sprite's own bounds
    assert.equal((src.match(/underTap: hitsBounds\(/g) || []).length, 3);
});
