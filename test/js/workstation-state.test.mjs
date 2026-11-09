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

// ── Access model step 9 (ACCESS_MODEL_PLAN.md 5.4, 5.5): one workstation rule ─────────────

/**
 * A rig whose env has the step 9 members: ownerPresent (presence), ownerTracked (the needs
 * system registers the owner), policyFor, clockMs and onTick (the needs clock).
 */
function rig9(objects, { npcs, present = {}, tracked = {}, policies = {}, seed = 's1' } = {}) {
    const globals = {}; const emitted = []; const handlers = {}; const tickFns = [];
    const sys = new NPCNeedsSystem({}, { seed });
    let clock = 0;
    const env = {
        objects: () => objects,
        npcs: () => npcs || [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: (p, cb) => { handlers[p] = cb; },
        emit: (n, d) => emitted.push([n, d]),
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
        ws, globals, emitted, handlers, present,
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
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, { autoLockMin: 0 }), true);
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, { autoLockMin: 5 }), false);
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1, undefined, { autoLockMin: null }), false);
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
    assert.deepEqual(emitted, ['workstation_owner_left:pc_a', 'workstation_auto_locked:pc_a', 'workstation_locked_attempt:pc_a']);
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
