// systems/workstation-state.js: screen lock on leave, occupied on return, seeded lockChance,
// workstation_accessed vs locked, and the npc-needs seededRoll helper.
// Run with: bin/test-js test/js/workstation-state.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkstationState, decideLocked, ownerOf, isWorkstation } from '../../public/break_escape/js/systems/workstation-state.js';
import { seededRoll, NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';

function rig(objects, seed = 's1') {
    const globals = {}; const emitted = []; const handlers = {};
    const sys = new NPCNeedsSystem({}, { seed });
    const env = {
        objects: () => objects,
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: (p, cb) => { handlers[p] = cb; },
        emit: (n, d) => emitted.push([n, d]),
        setGlobal: (k, v) => { globals[k] = v; },
        roll: (id, salt) => sys.roll(id, salt)
    };
    const ws = new WorkstationState(env).install();
    return { ws, globals, emitted, handlers };
}
const names = (e) => e.map(x => x[0]);

test('seededRoll is deterministic, in [0,1), and varies with seed/npc/salt', () => {
    assert.equal(seededRoll('x', 'ann', 1), seededRoll('x', 'ann', 1));
    const v = seededRoll('x', 'ann', 1);
    assert.ok(v >= 0 && v < 1);
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('x', 'ann', 2));
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('x', 'bob', 1));
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('y', 'ann', 1));
});

test('roll does not disturb the per-NPC RNG stream', () => {
    const sys = new NPCNeedsSystem({}, { seed: 'k' });
    sys.roll('ann', 'a'); sys.roll('ann', 'b');
    assert.equal(sys.roll('ann', 'a'), seededRoll('k', 'ann', 'a'));
});

test('workstation detection and owner resolution', () => {
    assert.equal(isWorkstation({ id: 'p' }), false);
    assert.equal(isWorkstation({ id: 'p', workstation: true }), true);
    assert.equal(isWorkstation({ id: 'p', lockChance: 0.5 }), true);
    assert.equal(ownerOf({ id: 'pc_a' }, [{ id: 'ann', needsHome: 'pc_a' }]), 'ann');
    assert.equal(ownerOf({ id: 'pc_a', screenOwner: 'zed' }, [{ id: 'ann', needsHome: 'pc_a' }]), 'zed');
});

test('default: leaves locked; locksScreenOnLeave:false leaves open; return occupies', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const r = rig([a, b]);
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    assert.equal(a.screenLocked, true);
    assert.equal(b.screenLocked, false);
    assert.equal(r.globals.pc_a_screen_locked, true);
    assert.equal(r.globals.pc_b_screen_locked, false);
    assert.equal(r.globals.pc_b_owner_away, true);
    r.ws.onReturned('bob');
    assert.equal(r.globals.pc_b_owner_away, false);
    assert.equal(r.ws.onInteract('pc_b'), 'attended');
});

test('interaction: open+away fires workstation_accessed, locked fires only the attempt, attended nothing', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const r = rig([a, b]);
    assert.equal(r.ws.onInteract('pc_b'), 'attended');
    assert.deepEqual(names(r.emitted), []);
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_a'), 'locked');
    assert.deepEqual(names(r.emitted), ['workstation_locked_attempt:pc_a']);
    assert.equal(r.globals.pc_a_accessed, undefined);
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_b'), 'accessed');
    assert.deepEqual(r.emitted, [['workstation_accessed:pc_b', { objectId: 'pc_b', ownerId: 'bob' }]]);
    assert.equal(r.globals.pc_b_accessed, true);
});

test('lockChance: 0 never, 1 always, fractional is deterministic under a seed', () => {
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1), false);
    assert.equal(decideLocked({ id: 'p', lockChance: 1 }, 'ann', 1), true);
    const seq = (seed) => {
        const d = { id: 'pc_a', lockChance: 0.5 };
        const r = rig([d], seed);
        const out = [];
        for (let i = 0; i < 12; i++) { r.ws.onLeft('ann'); out.push(d.screenLocked); r.ws.onReturned('ann'); }
        return out;
    };
    assert.deepEqual(seq('fixed'), seq('fixed'));
    const s = seq('fixed');
    assert.ok(s.includes(true) && s.includes(false), 'a 0.5 chance over 12 leaves yields both outcomes');
});

test('an NPC with no workstation, and a non-workstation object, are ignored', () => {
    const plain = { id: 'pc_a' };
    const r = rig([plain]);
    r.ws.onLeft('ann');
    assert.equal(plain.screenLocked, undefined);
    assert.equal(r.ws.onInteract('pc_a'), null);
    assert.equal(r.ws.onInteract('missing'), null);
});

test('the real dispatcher handlers are wired to left/returned events', () => {
    const a = { id: 'pc_a', workstation: true };
    const r = rig([a]);
    r.handlers['npc_left_post:*']({ npcId: 'ann' });
    assert.equal(a.screenLocked, true);
    r.handlers['npc_returned_post:*']({ npcId: 'ann' });
    assert.equal(a.screenLocked, false);
});

test('an own-desk work session keeps the owner present and the screen unchanged; a real trip away flips both', () => {
    const mk = (needsHome, extraObjs) => {
        const pc = { id: 'pc_a', x: 100, y: 68, workstation: true, locksScreenOnLeave: false,
            affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } };
        const other = { id: 'pc_other', x: 500, y: 300, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } };
        const objs = [pc, ...extraObjs(other)].map(o => ({ roomId: 'office', pickable: false, ...o }));
        const pos = { ann: { x: 100, y: 100, roomId: 'office' } };
        const rec = { id: 'ann', needsHome, needs: { work: { decayPerMin: 20, urgentAt: 40, initial: 30, jitterPct: 0 } } };
        const r = { globals: {}, handlers: {} };
        let sys;
        const world = {
            elapsedMs: () => 0, isVmActive: () => false, npcIds: () => ['ann'], getNpc: () => rec,
            npcPos: () => ({ ...pos.ann }), npcStatus: () => ({}), inChatWith: () => false,
            listObjects: () => objs, getObject: id => objs.find(o => o.id === id) || null,
            approachCell: o => ({ x: o.x, y: o.y + 32 }), tileToWorld: (rm, x, y) => ({ x: x * 32, y: y * 32 }),
            speedFor: () => 80, cancelMove() {}, faceTo() {}, pickUp: () => false, consumeHeld() {}, dropHeld() {},
            moveTo(id, x, y) { pos.ann.x = x; pos.ann.y = y; sys.onArrived(id, 'needs'); },
            emit: (n, d) => { for (const [pat, cb] of Object.entries(r.handlers)) if (pat.slice(0, -1) === n.slice(0, pat.length - 1)) cb(d); },
            setGlobal: (k, v) => { r.globals[k] = v; }
        };
        sys = new NPCNeedsSystem(world, { seed: 1, manualClock: true });
        const env = {
            objects: () => objs, npcs: () => [rec],
            on: (p, cb) => { r.handlers[p] = cb; }, emit: () => {}, setGlobal: world.setGlobal,
            roll: (id, salt) => sys.roll(id, salt)
        };
        new WorkstationState(env).install();
        sys.registerAll();
        r.sys = sys; r.pc = pc; r.world = world;
        return r;
    };
    // Own desk: owner never marked away, screen stays unlocked
    const own = mk('pc_a', () => []);
    own.sys.step(5 * 60000);
    assert.ok(own.sys.getLog().some(e => e.ev === 'used' && e.target === 'pc_a'));
    assert.notEqual(own.globals.pc_a_owner_away, true);
    assert.notEqual(own.pc.screenLocked, true);
    // Real trip to another PC: away is set and cleared again on return
    const trip = mk('pc_a', o => [o]);
    trip.sys.states.get('ann').cooldowns.pc_a = Infinity;
    trip.sys.step(4 * 60000);
    assert.ok(trip.sys.getLog().some(e => e.ev === 'used' && e.target === 'pc_other'));
    assert.equal(trip.globals.pc_a_owner_away, false);
    assert.ok('pc_a_owner_away' in trip.globals, 'away flag was written by the trip');
});

test('install resets saved away/locked globals to false (a reload puts every owner back at the desk)', () => {
    const globals = { pc_a_owner_away: true, pc_a_screen_locked: true, pc_b_owner_away: true, other: true };
    const env = {
        objects: () => [{ id: 'pc_a', workstation: true }, { id: 'pc_b', locksScreenOnLeave: false }, { id: 'lamp' }],
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: () => {}, emit: () => {}, setGlobal: (k, v) => { globals[k] = v; }, roll: () => 0.5
    };
    const ws = new WorkstationState(env).install();
    assert.deepEqual(globals, { pc_a_owner_away: false, pc_a_screen_locked: false, pc_b_owner_away: false, pc_b_screen_locked: false, other: true });
    assert.equal(ws.onInteract('pc_a'), 'attended');
});

test('install resets a workstation in an unloaded room by its saved global pair (lab staff_pc_2 after a reload)', () => {
    // Only pc_a's room is loaded; staff_pc_2's globals came back with the save. A lone
    // *_owner_away with no *_screen_locked partner is not a workstation's and is left alone.
    const globals = {
        pc_a_owner_away: true, pc_a_screen_locked: true,
        staff_pc_2_owner_away: true, staff_pc_2_screen_locked: false,
        guard_owner_away: true, other: true
    };
    const env = {
        objects: () => [{ id: 'pc_a', workstation: true }],
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }],
        globals: () => globals,
        on: () => {}, emit: () => {}, setGlobal: (k, v) => { globals[k] = v; }, roll: () => 0.5
    };
    new WorkstationState(env).install();
    assert.deepEqual(globals, {
        pc_a_owner_away: false, pc_a_screen_locked: false,
        staff_pc_2_owner_away: false, staff_pc_2_screen_locked: false,
        guard_owner_away: true, other: true
    });
});

// ── slice 16 (OFFICE_LIFE_PLAN 12.2): lock habits, auto-lock, workstation_screen_changed ──

import { habitOf, autoLockMs } from '../../public/break_escape/js/systems/workstation-state.js';

function rig16(objects, npcs, { seed = 's1', minigame = () => false } = {}) {
    const globals = {}; const emitted = []; const handlers = {};
    const sys = new NPCNeedsSystem({}, { seed });
    let now = 0;
    const env = {
        objects: () => objects, npcs: () => npcs,
        on: (p, cb) => { handlers[p] = cb; },
        emit: (n, d) => emitted.push([n, d]),
        setGlobal: (k, v) => { globals[k] = v; },
        roll: (id, salt) => sys.roll(id, salt),
        clock: () => now,
        inMinigame: (id) => minigame(id)
    };
    const ws = new WorkstationState(env).install();
    return { ws, sys, globals, emitted, handlers, setNow: (t) => { now = t; }, changes: () => emitted.filter(e => e[0].startsWith('workstation_screen_changed:')).map(e => e[1]) };
}

test('slice 16 precedence: object lockChance and locksScreenOnLeave win over the habit; workstation: true alone defers; no habit locks', () => {
    const never = { lockChance: 0 };
    assert.equal(decideLocked({ id: 'p', lockChance: 1 }, 'ann', 1, () => 0.9, never, 0), true, 'object lockChance wins');
    assert.equal(decideLocked({ id: 'p', locksScreenOnLeave: true }, 'ann', 1, () => 0.9, never, 0), true, 'object locksScreenOnLeave wins');
    assert.equal(decideLocked({ id: 'p', locksScreenOnLeave: false }, 'ann', 1, () => 0.9, { lockChance: 1 }, 0), false);
    assert.equal(decideLocked({ id: 'p', workstation: true }, 'ann', 1, () => 0.9, never, 0), false, 'workstation: true defers to the habit');
    assert.equal(decideLocked({ id: 'p', workstation: true }, 'ann', 1, () => 0.9, null, 0), true, 'no habit: the default locks');
    assert.equal(habitOf('ann', [{ id: 'ann', screenHabit: never }]), never);
    assert.equal(habitOf('bob', [{ id: 'ann', screenHabit: never }]), null);
});

test('slice 16 lockIfAwayOverSeconds: a short trip stays open, a long one locks; alone it implies lockChance 1; a null estimate is long', () => {
    const d = { id: 'p', workstation: true };
    const h = { lockIfAwayOverSeconds: 20 };
    assert.equal(decideLocked(d, 'ann', 1, () => 0.99, h, 12000), false, '12 s trip: open');
    assert.equal(decideLocked(d, 'ann', 1, () => 0.99, h, 20000), false, 'exactly the threshold: open');
    assert.equal(decideLocked(d, 'ann', 1, () => 0.99, h, 20001), true, 'over: locks (implied lockChance 1)');
    assert.equal(decideLocked(d, 'ann', 1, () => 0.99, h, null), true, 'no estimate counts as long');
    // both set: short stays open, long rolls
    const both = { lockIfAwayOverSeconds: 20, lockChance: 0.5 };
    assert.equal(decideLocked(d, 'ann', 1, () => 0.1, both, 5000), false);
    assert.equal(decideLocked(d, 'ann', 1, () => 0.1, both, 60000), true);
    assert.equal(decideLocked(d, 'ann', 1, () => 0.9, both, 60000), false);
});

test('slice 16 the habit rolls with its own salt; an object screen: sequence is unchanged by adding a habit', () => {
    const salts = [];
    const roll = (id, salt) => { salts.push(salt); return 0.3; };
    decideLocked({ id: 'pc_a', workstation: true }, 'ann', 4, roll, { lockChance: 0.5 }, 1000);
    assert.deepEqual(salts, ['habit:pc_a:4']);
    // object lockChance: the same screen: rolls with or without a habit on the owner
    const seq = (npcs) => {
        const pc = { id: 'pc_a', lockChance: 0.5 };
        const r = rig16([pc], npcs, { seed: 'fixed' });
        const out = [];
        for (let i = 0; i < 12; i++) { r.handlers['npc_left_post:*']({ npcId: 'ann', expectedAwayMs: 5000 }); out.push(pc.screenLocked); r.handlers['npc_returned_post:*']({ npcId: 'ann' }); }
        return out;
    };
    const plain = seq([{ id: 'ann', needsHome: 'pc_a' }]);
    const withHabit = seq([{ id: 'ann', needsHome: 'pc_a', screenHabit: { lockChance: 0.5, lockIfAwayOverSeconds: 1 } }]);
    assert.deepEqual(withHabit, plain);
    assert.ok(plain.includes(true) && plain.includes(false), 'the sequence mixes');
});

test('slice 16 install passes the leave payload: expectedAwayMs drives the habit; events carry how', () => {
    const pc = { id: 'pc_a', workstation: true };
    const r = rig16([pc], [{ id: 'ann', needsHome: 'pc_a', screenHabit: { lockIfAwayOverSeconds: 20 } }]);
    r.handlers['npc_left_post:*']({ npcId: 'ann', expectedAwayMs: 8000 });
    assert.equal(pc.screenLocked, false);
    assert.deepEqual(r.changes(), [], 'open on leave: no change, no event');
    r.handlers['npc_returned_post:*']({ npcId: 'ann' });
    assert.deepEqual(r.changes(), [], 'a return to an open screen fires nothing');
    r.handlers['npc_left_post:*']({ npcId: 'ann', expectedAwayMs: 45000 });
    assert.equal(pc.screenLocked, true);
    r.handlers['npc_returned_post:*']({ npcId: 'ann' });
    assert.deepEqual(r.changes(), [
        { objectId: 'pc_a', ownerId: 'ann', locked: true, how: 'leave' },
        { objectId: 'pc_a', ownerId: 'ann', locked: false, how: 'return' }
    ]);
    // workstation_owner_left keeps its payload
    const left = r.emitted.find(e => e[0] === 'workstation_owner_left:pc_a')[1];
    assert.deepEqual(Object.keys(left).sort(), ['objectId', 'ownerId', 'screenLocked']);
});

test('slice 16 auto-lock fires once after autoLockSeconds idle on the needs clock, and not after a return', () => {
    const pc = { id: 'pc_s', workstation: true, autoLockSeconds: 30 };
    const r = rig16([pc], [{ id: 'san', needsHome: 'pc_s', screenHabit: { lockChance: 0 } }]);
    r.setNow(1000);
    r.handlers['npc_left_post:*']({ npcId: 'san', expectedAwayMs: 60000 });
    assert.equal(pc.screenLocked, false);
    r.ws.tick(30999);
    assert.equal(pc.screenLocked, false, 'not yet');
    r.ws.tick(31000);
    assert.equal(pc.screenLocked, true);
    assert.equal(r.globals.pc_s_screen_locked, true);
    r.ws.tick(90000);
    assert.deepEqual(r.changes(), [{ objectId: 'pc_s', ownerId: 'san', locked: true, how: 'auto' }], 'once');
    r.handlers['npc_returned_post:*']({ npcId: 'san' });
    r.ws.tick(200000);
    assert.equal(pc.screenLocked, false, 'no auto-lock while the owner is back');
    assert.equal(autoLockMs({ autoLockSeconds: 0 }), null);
});

test('slice 16 auto-lock restarts on access and holds while a minigame is open on the object', () => {
    let open = false;
    const pc = { id: 'pc_s', workstation: true, autoLockSeconds: 30 };
    const r = rig16([pc], [{ id: 'san', needsHome: 'pc_s', screenHabit: { lockChance: 0 } }], { minigame: (id) => open && id === 'pc_s' });
    r.setNow(0);
    r.handlers['npc_left_post:*']({ npcId: 'san', expectedAwayMs: 60000 });
    r.setNow(20000);
    assert.equal(r.ws.onInteract('pc_s'), 'accessed');
    r.ws.tick(40000);
    assert.equal(pc.screenLocked, false, 'the access at 20 s restarted the clock');
    open = true;
    r.ws.tick(55000); r.ws.tick(120000);
    assert.equal(pc.screenLocked, false, 'never under a player using it');
    open = false;
    r.ws.tick(149999);
    assert.equal(pc.screenLocked, false);
    r.ws.tick(150000);
    assert.equal(pc.screenLocked, true, '30 s after the minigame closed');
});

test('slice 16 a station found after the leave decides through the habit with the stored estimate, idle clock from the leave, how late', () => {
    const objects = [];
    const npcs = [{ id: 'ann', needsHome: 'pc_a', screenHabit: { lockIfAwayOverSeconds: 20 } }, { id: 'san', needsHome: 'pc_s', screenHabit: { lockChance: 0 } }];
    const r = rig16(objects, npcs);
    r.setNow(0);
    r.handlers['npc_left_post:*']({ npcId: 'ann', expectedAwayMs: 60000 });
    r.handlers['npc_left_post:*']({ npcId: 'san', expectedAwayMs: 60000 });
    const a = { id: 'pc_a', workstation: true };
    const s = { id: 'pc_s', workstation: true, autoLockSeconds: 30 };
    objects.push(a, s);   // their room loads now
    r.setNow(45000);
    assert.equal(r.ws.onInteract('pc_a'), 'locked', 'long trip by the stored estimate');
    assert.equal(r.ws.onInteract('pc_s'), 'locked', 'habit leaves it open, but 45 s since the leave passes autoLockSeconds');
    assert.deepEqual(r.changes().map(c => c.how), ['late', 'late']);
});

test('slice 16 the reload reset is unchanged: install writes both globals false', () => {
    const r = rig16([{ id: 'pc_s', workstation: true, autoLockSeconds: 30 }], [{ id: 'san', needsHome: 'pc_s' }]);
    assert.equal(r.globals.pc_s_screen_locked, false);
    assert.equal(r.globals.pc_s_owner_away, false);
    assert.equal(r.ws.idle.size, 0);
});
