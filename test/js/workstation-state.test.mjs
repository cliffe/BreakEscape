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

import { habitOf, autoLockMs, minigameOnObject } from '../../public/break_escape/js/systems/workstation-state.js';

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
    assert.deepEqual(Object.keys(left).sort(), ['objectId', 'ownerId', 'reason', 'screenLocked']);
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

test('slice 16 minigameOnObject: object params (lockable, sprite) and the examine view\'s string itemId', () => {
    assert.equal(minigameOnObject({ lockable: { scenarioData: { id: 'pc_s' } } }, 'pc_s'), true);
    assert.equal(minigameOnObject({ sprite: { objectId: 'pc_s' } }, 'pc_s'), true);
    assert.equal(minigameOnObject({ title: "Sanjay's PC", itemId: 'pc_s', itemType: 'pc' }, 'pc_s'), true);
    assert.equal(minigameOnObject({ itemId: 'pc_a' }, 'pc_s'), false);
    assert.equal(minigameOnObject(null, 'pc_s'), false);
    assert.equal(minigameOnObject({ title: 'pc_s' }, 'pc_s'), false, 'only id fields count');
});

// ── Access model step 9 (ACCESS_MODEL_PLAN.md 5.4, 5.5): one workstation rule ─────────────

/**
 * A rig whose env has the step 9 members: ownerPresent (presence), ownerTracked (the needs
 * system registers the owner), policyFor, clockMs and onTick (the needs clock).
 */
function rig9(objects, { npcs, present = {}, tracked = {}, policies = {}, seed = 's1' } = {}) {
    const globals = {}; const emitted = []; const changes = []; const handlers = {}; const tickFns = [];
    const sys = new NPCNeedsSystem({}, { seed });
    let clock = 0;
    const env = {
        objects: () => objects,
        npcs: () => npcs || [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: (p, cb) => { handlers[p] = cb; },
        // The step 9 tests list the access model's own events; workstation_screen_changed
        // (slice 16, emitted alongside them) is counted apart, in `changes`.
        emit: (n, d) => { (n.startsWith('workstation_screen_changed:') ? changes : emitted).push([n, d]); },
        setGlobal: (k, v) => { globals[k] = v; },
        roll: (id, salt) => sys.roll(id, salt),
        ownerPresent: (id) => !!present[id],
        ownerTracked: (id) => tracked[id] !== false,
        policyFor: (d) => policies[d.policy] || null,
        clockMs: () => clock,
        onTick: (fn) => { tickFns.push(fn); }
    };
    const ws = new WorkstationState(env).install();
    return {
        ws, globals, emitted, changes, handlers, present,
        advance(ms) { clock += ms; tickFns.forEach(fn => fn()); },
        names: () => emitted.map(x => x[0])
    };
}

test('step 9: isWorkstation accepts a lockType login object with or without an owner; an unowned one answers signin with no event', () => {
    assert.equal(isWorkstation({ id: 'hot', lockType: 'login' }), true);
    assert.equal(isWorkstation({ id: 'pc_a', lockType: 'login' }), true);
    const hot = { id: 'hot', lockType: 'login' };
    const r = rig9([hot]);
    assert.equal(r.ws.onInteract('hot'), 'signin');
    assert.deepEqual(r.names(), []);
    // A plain unowned workstation follows the same rule
    const plain = { id: 'spare', workstation: true };
    const r2 = rig9([plain]);
    assert.equal(r2.ws.onInteract('spare'), 'signin');
    assert.deepEqual(r2.names(), []);
});

test('step 9: owner at the desk answers attended with no event; away open accessed; away locked locked', () => {
    const a = { id: 'pc_a', lockType: 'login', lockChance: 1 };
    const b = { id: 'pc_b', lockType: 'login', lockChance: 0 };
    const r = rig9([a, b], { present: { ann: true, bob: true } });
    assert.equal(r.ws.onInteract('pc_a'), 'attended');
    assert.equal(r.ws.onInteract('pc_b'), 'attended');
    assert.deepEqual(r.names(), []);
    r.present.ann = false; r.present.bob = false;
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_b'), 'accessed');
    assert.deepEqual(r.emitted, [['workstation_accessed:pc_b', { objectId: 'pc_b', ownerId: 'bob' }]]);
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_a'), 'locked');
    assert.deepEqual(r.emitted, [['workstation_locked_attempt:pc_a', { objectId: 'pc_a', ownerId: 'ann' }]]);
});

test('step 9: a tracked owner knocked out at the desk rolls the screen once, on a plain workstation as on a sign-in PC', () => {
    const plain = { id: 'pc_a', workstation: true, lockChance: 0 };
    const login = { id: 'pc_b', lockType: 'login', lockChance: 1 };
    const r = rig9([plain, login], { present: { ann: true, bob: true } });
    r.present.ann = false; r.present.bob = false;   // knocked out: not available
    r.handlers['npc_ko:*']({ npcId: 'ann' });
    r.handlers['npc_ko:*']({ npcId: 'bob' });
    assert.deepEqual(r.names(), ['workstation_owner_left:pc_a', 'workstation_owner_left:pc_b']);
    assert.equal(r.emitted[0][1].reason, 'ko');
    assert.equal(plain.screenLocked, false);
    assert.equal(login.screenLocked, true);
    assert.equal(r.globals.pc_a_owner_away, true);
    assert.equal(r.globals.pc_b_screen_locked, true);
    assert.equal(r.ws.away.get('ann').leaves, 1);
    // A second knock-out while away changes neither the leaves nor the screen
    r.emitted.length = 0;
    r.handlers['npc_ko:*']({ npcId: 'ann' });
    assert.equal(r.ws.away.get('ann').leaves, 1);
    assert.equal(plain.screenLocked, false);
    assert.deepEqual(r.names(), []);
    assert.equal(r.ws.onInteract('pc_a'), 'accessed');
    assert.equal(r.ws.onInteract('pc_b'), 'locked');
});

test('step 9: a knock-out while already away neither adds a leave nor re-rolls the screen', () => {
    const a = { id: 'pc_a', lockType: 'login', lockChance: 0 };
    const r = rig9([a]);
    r.ws.onLeft('ann');
    r.emitted.length = 0;
    r.handlers['npc_ko:*']({ npcId: 'ann' });
    assert.equal(r.ws.away.get('ann').leaves, 1);
    assert.equal(a.screenLocked, false);
    assert.deepEqual(r.names(), []);
});

test('step 9: an untracked owner knocked out sets no away record and answers signin', () => {
    const a = { id: 'pc_a', lockType: 'login', lockChance: 0 };
    const r = rig9([a], { present: {}, tracked: { ann: false } });
    r.handlers['npc_ko:*']({ npcId: 'ann' });
    assert.equal(r.ws.away.get('ann'), undefined);
    assert.equal(r.ws.onInteract('pc_a'), 'signin');
    assert.deepEqual(r.names(), []);
});

test('step 9: an owner removed, hidden, hostile, untracked or moved by a script (not present, no away record) answers signin and emits nothing', () => {
    for (const why of ['removed', 'hidden', 'hostile', 'untracked', 'scripted']) {
        const a = { id: 'pc_a', workstation: true, lockChance: 0 };
        const r = rig9([a], { present: { ann: false }, tracked: { ann: why !== 'untracked' } });
        assert.equal(r.ws.onInteract('pc_a'), 'signin', why);
        assert.deepEqual(r.names(), [], why);
        assert.equal(r.globals.pc_a_accessed, undefined, why);
    }
});

test('step 9: an env without ownerPresent keeps today\'s answers', () => {
    const a = { id: 'pc_a', workstation: true, locksScreenOnLeave: false };
    const r = rig([a]);
    assert.equal(r.ws.onInteract('pc_a'), 'attended');
    r.ws.onLeft('ann');
    assert.equal(r.ws.onInteract('pc_a'), 'accessed');
    r.ws.onReturned('ann');
    assert.equal(r.ws.onInteract('pc_a'), 'attended');
});

test('step 9: autoLockMin 0 locks in the leave roll, whatever lockChance says; the first click answers locked', () => {
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, null, null, { autoLockMin: 0 }), true);
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, null, null, { autoLockMin: 5 }), false);
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, null, null, { autoLockMin: null }), false);
    const a = { id: 'pc_a', lockType: 'login', lockChance: 0, policy: 'instant' };
    const r = rig9([a], { policies: { instant: { autoLockMin: 0 } } });
    r.ws.onLeft('ann');
    assert.equal(a.screenLocked, true);
    assert.equal(a.lockAt, undefined);
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_a'), 'locked');
    assert.deepEqual(r.names(), ['workstation_locked_attempt:pc_a']);
});

test('step 9: autoLockMin 5 locks an open screen once the clock passes five game minutes, not before, emitting workstation_auto_locked once', () => {
    const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    const r = rig9([a], { policies: { corp: { autoLockMin: 5 } } });
    r.advance(1000);
    r.ws.onLeft('ann');
    assert.equal(a.screenLocked, false);
    assert.equal(a.lockAt, 1000 + 5 * 60000);
    r.advance(4 * 60000);
    assert.equal(a.screenLocked, false);
    assert.equal(r.ws.onInteract('pc_a'), 'accessed');
    r.advance(60000 - 250);
    assert.equal(a.screenLocked, false);
    r.emitted.length = 0;
    r.advance(250);
    assert.equal(a.screenLocked, true);
    assert.equal(r.globals.pc_a_screen_locked, true);
    assert.deepEqual(r.emitted, [['workstation_auto_locked:pc_a', { objectId: 'pc_a', ownerId: 'ann' }]]);
    r.advance(60000);
    assert.deepEqual(r.names(), ['workstation_auto_locked:pc_a']);
    assert.equal(r.ws.onInteract('pc_a'), 'locked');
});

test('step 9: onInteract runs the auto lock check itself (a stub clock with no tick listener)', () => {
    const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    let clock = 0;
    const emitted = [];
    const env = {
        objects: () => [a], npcs: () => [{ id: 'ann', needsHome: 'pc_a' }],
        on: () => {}, emit: (n, d) => emitted.push(n), setGlobal: () => {}, roll: () => 0.5,
        ownerPresent: () => false, ownerTracked: () => true,
        policyFor: () => ({ autoLockMin: 5 }), clockMs: () => clock
    };
    const ws = new WorkstationState(env).install();
    ws.onLeft('ann');
    clock = 5 * 60000 + 1;
    assert.equal(ws.onInteract('pc_a'), 'locked');
    assert.deepEqual(emitted, ['workstation_owner_left:pc_a', 'workstation_auto_locked:pc_a', 'workstation_screen_changed:pc_a', 'workstation_locked_attempt:pc_a']);
});

test('step 9: the owner\'s return cancels a pending auto lock', () => {
    const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    const r = rig9([a], { policies: { corp: { autoLockMin: 5 } } });
    r.ws.onLeft('ann');
    r.advance(2 * 60000);
    r.ws.onReturned('ann');
    assert.equal(a.lockAt, undefined);
    r.advance(10 * 60000);
    assert.equal(a.screenLocked, false);
    assert.ok(!r.names().includes('workstation_auto_locked:pc_a'));
    // The next leave starts its own five minutes
    r.ws.onLeft('ann');
    assert.equal(a.lockAt, 12 * 60000 + 5 * 60000);
});

// ---- isLocked and wasLocked (screen states, PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md 3.1) ----

// NPC records shaped like npcManager.npcs values (the live env's npcs())
const liveNpcs = () => [
    { id: 'ann', displayName: 'Ann', npcType: 'person', roomId: 'office', needsHome: 'pc_a', position: { x: 4, y: 4 }, behavior: {}, _sprite: null },
    { id: 'bob', displayName: 'Bob', npcType: 'person', roomId: 'office', needsHome: 'pc_b', position: { x: 8, y: 4 }, behavior: {}, _sprite: null }
];

test('isLocked: false with the owner present, away and open, for an unowned or unknown object; true away and locked', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const hot = { id: 'hot', lockType: 'login' };
    const r = rig9([a, b, hot, { id: 'plant' }], { npcs: liveNpcs(), present: { ann: true, bob: true } });
    assert.equal(r.ws.isLocked('pc_a'), false);
    assert.equal(r.ws.isLocked('pc_b'), false);
    r.present.ann = false; r.present.bob = false;
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    r.emitted.length = 0;
    assert.equal(r.ws.isLocked('pc_a'), true);
    assert.equal(r.ws.isLocked('pc_b'), false);
    assert.equal(r.ws.isLocked('hot'), false);
    assert.equal(r.ws.isLocked('plant'), false);
    assert.equal(r.ws.isLocked('nope'), false);
    assert.deepEqual(r.names(), [], 'isLocked emits nothing');
    r.present.ann = true;
    r.ws.onReturned('ann');
    assert.equal(r.ws.isLocked('pc_a'), false);
});

test('isLocked: true after an auto lock fires, false before', () => {
    const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    const r = rig9([a], { npcs: liveNpcs(), policies: { corp: { autoLockMin: 5 } } });
    r.ws.onLeft('ann');
    r.advance(4 * 60000);
    assert.equal(r.ws.isLocked('pc_a'), false);
    r.advance(60000);
    assert.equal(r.ws.isLocked('pc_a'), true);
});

test('a station found after its owner left is rolled once: isLocked and onInteract agree in either order', () => {
    for (const first of ['isLocked', 'onInteract']) {
        for (const seed of ['s1', 's2', 's3', 's4', 's5', 's6']) {
            const objects = [];
            const r = rig9(objects, { npcs: liveNpcs(), seed });
            r.ws.onLeft('ann');                      // pc_a's room is not loaded yet
            const a = { id: 'pc_a', workstation: true, lockChance: 0.5 };
            objects.push(a);
            assert.equal(a.screenLocked, undefined);
            let locked, answer;
            if (first === 'isLocked') { locked = r.ws.isLocked('pc_a'); answer = r.ws.onInteract('pc_a'); }
            else { answer = r.ws.onInteract('pc_a'); locked = r.ws.isLocked('pc_a'); }
            assert.equal(answer, locked ? 'locked' : 'accessed', `${first} first, seed ${seed}`);
            assert.equal(a.screenLocked, locked);
            // The same roll the leave itself would have made
            assert.equal(locked, decideLocked(a, 'ann', 1, r.ws.env.roll));
            // The late roll writes the globals the on-object texts read
            assert.equal(r.globals.pc_a_screen_locked, locked);
            assert.equal(r.globals.pc_a_owner_away, true);
            // Asking again does not re-roll
            assert.equal(r.ws.isLocked('pc_a'), locked);
        }
    }
});

test('workstation_owner_returned carries wasLocked: true from a locked screen, false from an open one, true after an auto lock', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const r = rig9([a, b], { npcs: liveNpcs() });
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    r.emitted.length = 0;
    r.ws.onReturned('ann'); r.ws.onReturned('bob');
    assert.deepEqual(r.emitted, [
        ['workstation_owner_returned:pc_a', { objectId: 'pc_a', ownerId: 'ann', wasLocked: true }],
        ['workstation_owner_returned:pc_b', { objectId: 'pc_b', ownerId: 'bob', wasLocked: false }]
    ]);
    assert.equal(a.screenLocked, false);

    const c = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    const r2 = rig9([c], { npcs: liveNpcs(), policies: { corp: { autoLockMin: 5 } } });
    r2.ws.onLeft('ann');
    r2.advance(6 * 60000);
    r2.emitted.length = 0;
    r2.ws.onReturned('ann');
    assert.deepEqual(r2.emitted, [['workstation_owner_returned:pc_a', { objectId: 'pc_a', ownerId: 'ann', wasLocked: true }]]);
});

test('wasLocked does not depend on anything asking first: a station found after the leave is rolled on the return', () => {
    const objects = [];
    const r = rig9(objects, { npcs: liveNpcs() });
    r.ws.onLeft('ann');
    const a = { id: 'pc_a', workstation: true };
    objects.push(a);
    r.emitted.length = 0;
    r.ws.onReturned('ann');
    assert.deepEqual(r.emitted, [['workstation_owner_returned:pc_a', { objectId: 'pc_a', ownerId: 'ann', wasLocked: true }]]);
    assert.equal(a.screenLocked, false);
    // A station found while its owner is at the desk (never away) is not rolled
    const b = { id: 'pc_b', workstation: true };
    objects.push(b);
    r.emitted.length = 0;
    r.ws.onReturned('bob');
    assert.deepEqual(r.emitted, [['workstation_owner_returned:pc_b', { objectId: 'pc_b', ownerId: 'bob', wasLocked: false }]]);
});

// Code review R1 m3: a lock time that passed before the station was found has already happened.
test('a station found after its auto lock time is locked at once, with no workstation_auto_locked event then or on the next tick', () => {
    for (const first of ['isLocked', 'onInteract']) {
        const objects = [];
        const r = rig9(objects, { npcs: liveNpcs(), policies: { corp: { autoLockMin: 5 } } });
        r.ws.onLeft('ann');                          // at clock 0; pc_a's room is not loaded yet
        r.advance(10 * 60000);
        const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
        objects.push(a);
        r.emitted.length = 0;
        if (first === 'isLocked') assert.equal(r.ws.isLocked('pc_a'), true);
        else assert.equal(r.ws.onInteract('pc_a'), 'locked');
        assert.equal(a.screenLocked, true);
        assert.equal(a.lockAt, undefined);
        assert.equal(r.globals.pc_a_screen_locked, true);
        assert.equal(r.ws.pendingLocks.size, 0);
        r.advance(250);
        r.advance(60000);
        assert.ok(!r.names().includes('workstation_auto_locked:pc_a'), r.names().join(','));
        // the return still reports a locked screen
        r.ws.onReturned('ann');
        assert.deepEqual(r.emitted.at(-1), ['workstation_owner_returned:pc_a', { objectId: 'pc_a', ownerId: 'ann', wasLocked: true }]);
    }
});

test('a station found before its auto lock time stays open, keeps the leave-based lockAt, and locks with the event when it passes', () => {
    const objects = [];
    const r = rig9(objects, { npcs: liveNpcs(), policies: { corp: { autoLockMin: 5 } } });
    r.ws.onLeft('ann');
    r.advance(2 * 60000);
    const a = { id: 'pc_a', workstation: true, lockChance: 0, policy: 'corp' };
    objects.push(a);
    assert.equal(r.ws.isLocked('pc_a'), false);
    assert.equal(a.lockAt, 5 * 60000);
    r.emitted.length = 0;
    r.advance(3 * 60000);
    assert.deepEqual(r.names(), ['workstation_auto_locked:pc_a']);
    assert.equal(r.ws.isLocked('pc_a'), true);
});

// ── Both designs in one class: every change of the locked state says so twice ─────────────

test('merged: a policy auto lock and an idle auto lock both emit workstation_auto_locked and screen_changed how auto', () => {
    const a = { id: 'pc_a', workstation: true, locksScreenOnLeave: false, policy: 'five' };
    const r = rig9([a], { policies: { five: { autoLockMin: 5 } } });
    r.ws.onLeft('ann');
    r.advance(5 * 60000);
    assert.deepEqual(r.names().filter(n => n.includes('auto')), ['workstation_auto_locked:pc_a']);
    assert.deepEqual(r.changes.map(c => c[1].how), ['auto']);

    const b = { id: 'pc_s', workstation: true, locksScreenOnLeave: false, autoLockSeconds: 30 };
    const q = rig16([b], [{ id: 'sam', needsHome: 'pc_s' }]);
    q.ws.onLeft('sam');
    q.setNow(31000); q.ws.tick();
    assert.equal(b.screenLocked, true);
    assert.equal(q.emitted.filter(e => e[0] === 'workstation_auto_locked:pc_s').length, 1);
    assert.deepEqual(q.changes().map(c => c.how), ['auto']);
});

test('merged: a knock-out at the desk changes the screen with how ko; the return says wasLocked and how return', () => {
    const a = { id: 'pc_a', workstation: true };
    const r = rig9([a]);
    r.ws.onKnockedOut('ann');
    assert.equal(a.screenLocked, true);
    assert.deepEqual(r.changes.map(c => c[1].how), ['ko']);
    r.ws.onReturned('ann');
    assert.equal(r.emitted.at(-1)[1].wasLocked, true);
    assert.deepEqual(r.changes.map(c => c[1].how), ['ko', 'return']);
});

// ── Access 9.2 H-4 (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.4): users and guests at a hot desk ──

function hotRig({ autoLockMin = 5, userOf } = {}) {
    const globals = {}; const emitted = []; const handlers = {};
    let clock = 0;
    const objects = [{ id: 'hot_desk', lockType: 'login' }, { id: 'pc_a', lockType: 'login' }];
    const env = {
        objects: () => objects,
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }, { id: 'ian', needsHome: 'ian_pc' }],
        on: (p, cb) => { handlers[p] = cb; },
        emit: (n, d) => emitted.push([n, d]),
        setGlobal: (k, v) => { globals[k] = v; },
        roll: () => 0.5,
        ownerPresent: () => false,
        policyFor: () => (autoLockMin === null ? null : { autoLockMin }),
        clockMs: () => clock
    };
    if (userOf) env.userOf = userOf;
    const ws = new WorkstationState(env).install();
    return { ws, globals, emitted, handlers, tick: (ms) => { clock += ms; ws.checkAutoLocks(); } };
}

test('H-4: a PC in use by a non-owner answers attended, and presence names the user', () => {
    let user = 'ian';
    const { ws } = hotRig({ userOf: id => (id === 'hot_desk' ? user : null) });
    assert.equal(ws.onInteract('hot_desk'), 'attended');
    assert.equal(ws.presence('hot_desk').userId, 'ian');
    user = null;
    assert.equal(ws.onInteract('hot_desk'), 'signin');
});

test('H-4: a guest is recorded when the answer arrives; the leave publishes the globals and emits owner_left reason guest; a click is accessed', () => {
    const { ws, globals, emitted, handlers } = hotRig();
    assert.equal(ws.onInteract('hot_desk'), 'signin');
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    assert.equal(ws.guestOf('hot_desk'), 'ian');
    assert.equal(globals.hot_desk_owner_away, true);
    assert.equal(globals.hot_desk_screen_locked, false);
    const left = emitted.find(([n]) => n === 'workstation_owner_left:hot_desk')[1];
    assert.deepEqual(left, { objectId: 'hot_desk', ownerId: 'ian', screenLocked: false, reason: 'guest' });
    assert.equal(ws.onInteract('hot_desk'), 'accessed');
    assert.deepEqual(emitted.at(-1), ['workstation_accessed:hot_desk', { objectId: 'hot_desk', ownerId: 'ian', guest: true }]);
    assert.equal(ws.presence('hot_desk').guestId, 'ian');
});

test('H-4: autoLockMin ends the guest session at lockAt with workstation_auto_locked; the next click is the sign-in screen', () => {
    const { ws, globals, emitted, handlers, tick } = hotRig({ autoLockMin: 5 });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    tick(299000);
    assert.equal(ws.guestOf('hot_desk'), 'ian');
    tick(2000);
    assert.deepEqual(emitted.find(([n]) => n === 'workstation_auto_locked:hot_desk')[1], { objectId: 'hot_desk', ownerId: 'ian', guest: true });
    assert.equal(globals.hot_desk_screen_locked, true);
    assert.equal(ws.guestOf('hot_desk'), null);
    assert.equal(ws.onInteract('hot_desk'), 'signin');
});

test('R2 server m1: a refused guest claim locks the guest session before lockAt (the server timed it out on wall time)', () => {
    const { ws, globals, emitted, handlers, tick } = hotRig({ autoLockMin: 5 });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    tick(120000); // the needs clock stopped during VM time: only 2 minutes here
    assert.equal(ws.onInteract('hot_desk'), 'accessed');
    assert.equal(ws.guestClaimRefused('hot_desk'), true);
    assert.equal(ws.guestOf('hot_desk'), null);
    assert.equal(globals.hot_desk_screen_locked, true);
    assert.deepEqual(emitted.find(([n]) => n === 'workstation_auto_locked:hot_desk')[1], { objectId: 'hot_desk', ownerId: 'ian', guest: true });
    assert.equal(ws.onInteract('hot_desk'), 'signin', 'the next click sends no claim');
    assert.equal(ws.guestClaimRefused('hot_desk'), false, 'no guest: nothing to lock');
});

test('R3 n1: a refused claim for Ian keeps Rosa, recorded while the claim was answered', () => {
    const { ws, globals, emitted, handlers } = hotRig({ autoLockMin: 5 });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['npc_guest_left:*']({ npcId: 'rosa', objectId: 'hot_desk' });
    assert.equal(ws.guestOf('hot_desk'), 'rosa');
    assert.equal(ws.guestClaimRefused('hot_desk', 'ian'), false);
    assert.equal(ws.guestOf('hot_desk'), 'rosa');
    assert.notEqual(globals.hot_desk_screen_locked, true);
    assert.equal(emitted.filter(([n]) => n === 'workstation_auto_locked:hot_desk').length, 0);
    assert.equal(ws.guestClaimRefused('hot_desk', 'rosa'), true);
    assert.equal(ws.guestOf('hot_desk'), null);
});

test('H-4: the next NPC to sit down ends a guest session, with no workstation_owner_returned', () => {
    const { ws, globals, emitted, handlers } = hotRig({ autoLockMin: null });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['npc_sat_at:*']({ npcId: 'rosa', objectId: 'hot_desk' });
    assert.equal(ws.guestOf('hot_desk'), null);
    assert.equal(globals.hot_desk_owner_away, false);
    assert.equal(emitted.filter(([n]) => n.startsWith('workstation_owner_returned:')).length, 0);
    assert.equal(ws.onInteract('hot_desk'), 'signin');
});

test('H-4: a guest is never recorded at an owned PC; an env without userOf keeps today\'s answers', () => {
    const { ws, handlers } = hotRig();
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'pc_a' });
    assert.equal(ws.guestOf('pc_a'), null);
    const old = rig([{ id: 'pc_a', lockChance: 0 }]);
    assert.equal(old.ws.onInteract('pc_a'), 'attended');
    assert.equal(old.ws.presence('pc_a').userId, null);
});

test('R1 M1: the player\'s sign-out at the hot desk ends the guest session; the next click is the sign-in screen', () => {
    const { ws, globals, handlers } = hotRig({ autoLockMin: null });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['pc_signed_in']({ pcId: 'hot_desk', npcId: 'ian', via: 'claim' });
    assert.equal(ws.guestOf('hot_desk'), 'ian', 'claiming the guest session keeps the record');
    handlers['pc_signed_out']({ pcId: 'pc_a', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), 'ian', 'another PC');
    handlers['pc_signed_out']({ pcId: 'hot_desk', npcId: 'ian', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), null);
    assert.equal(globals.hot_desk_owner_away, false);
    assert.equal(ws.onInteract('hot_desk'), 'signin');
});

test('R1 M1: a password sign-in at the hot desk ends the guest session there', () => {
    const { ws, handlers } = hotRig({ autoLockMin: null });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['pc_signed_in']({ pcId: 'hot_desk', npcId: 'temp_user', via: 'password' });
    assert.equal(ws.guestOf('hot_desk'), null);
});

test('R1 M1: a displacement before the new guest is recorded keeps that guest', () => {
    const { ws, handlers } = hotRig({ autoLockMin: null });
    handlers['pc_signed_out']({ pcId: 'hot_desk', npcId: 'temp_user', reason: 'displaced' });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    assert.equal(ws.guestOf('hot_desk'), 'ian');
});

// Review R2 n3 (q44): a sign-out that awaits /logout says pc_signing_out first; its pc_signed_out
// ends only the guest record that was there when the request went
test('q44: a guest recorded during a slow /logout is kept; the one there when it was sent goes', () => {
    const { ws, handlers } = hotRig();
    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });   // the borrower sat, worked and left meanwhile
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), 'ian', 'recorded after the request: the server keeps it too');

    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'owner_returned' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'owner_returned' });
    assert.equal(ws.guestOf('hot_desk'), null, 'there when the request went: it ends');
});

test('q44: a guest replaced during a slow /logout is kept; a sign-out with no pc_signing_out ends the guest as before', () => {
    const { ws, handlers } = hotRig();
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    handlers['npc_sat_at:*']({ npcId: 'rosa', objectId: 'hot_desk' });
    handlers['npc_guest_left:*']({ npcId: 'rosa', objectId: 'hot_desk' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), 'rosa');
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'displaced' });
    assert.equal(ws.guestOf('hot_desk'), null, 'no request in flight (a displacement emits before its /logout)');
    // a password sign-in there does not spend a pending sign-out's mark
    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['pc_signed_in']({ pcId: 'pc_a', via: 'password' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), 'ian');
});

// q44 review R1 n4: a displaced or switched session at the PC while a sign-out's /logout is slow
// does not spend that sign-out's snapshot
test('q44 R1 n4: a displacement during a slow /logout leaves the snapshot for the sign-out it belongs to', () => {
    const { ws, handlers } = hotRig({ autoLockMin: null });
    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'displaced' });   // a second session there, displaced meanwhile
    handlers['npc_guest_left:*']({ npcId: 'ian', objectId: 'hot_desk' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'sign_out' });   // the slow one answers
    assert.equal(ws.guestOf('hot_desk'), 'ian', 'recorded after the request went: kept');
    handlers['pc_signing_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'switch' });
    handlers['pc_signed_out']({ pcId: 'hot_desk', reason: 'sign_out' });
    assert.equal(ws.guestOf('hot_desk'), null, 'there when its request went: the switch ended it, nothing is brought back');
});
