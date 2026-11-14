// NPC needs system (systems/npc-needs.js) acceptance tests on a stub world and
// the manual clock. Spec: docs/achitechture/NPC_NEEDS_SYSTEM.md section 12.
// The live engine path is proved separately by the headless playtest of
// scenarios/test_npc_needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NPCNeedsSystem, needTiming, NEEDS_TICK_MS, RETURN_YIELD_MS, createEngineWorld, requiredGlobalsHold } from '../../public/break_escape/js/systems/npc-needs.js';

import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { makeSimsWorld, addCopierBeat, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const TILE = 32;

function office(extra = {}) {
    return {
        npcs: {
            clerk: {
                pos: { x: 100, y: 100 },
                rec: {
                    id: 'clerk', needsHome: 'clerk_pc',
                    needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50, jitterPct: 10 } },
                    usePayload: { note: 'clerk-owned' },
                    onUse: { coffee_machine: { setGlobal: 'clerk_had_coffee' } }
                }
            },
            visitor: { pos: { x: 400, y: 100 }, rec: { id: 'visitor', displayName: 'No needs' } },
            ...extra.npcs
        },
        objects: [
            { id: 'clerk_pc', x: 100, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } },
            { id: 'coffee_machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 40 } },
            ...(extra.objects || [])
        ]
    };
}

function run(seed, minutes, cfg = office()) {
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(minutes * 60000);
    return { sys, w, log: JSON.stringify(sys.getLog()) };
}

const ticksFor = ms => ms / NEEDS_TICK_MS;

test('same seed gives a byte-identical decision log; another seed differs (jitter)', () => {
    const a = run(42, 30).log;
    const b = run(42, 30).log;
    const c = run(7, 30).log;
    assert.equal(a, b);
    assert.notEqual(a, c);
});

test('an NPC with no needs block is never registered or moved', () => {
    const { sys, w } = run(1, 20);
    assert.equal(sys.has('visitor'), false);
    assert.equal(w.calls.moves.filter(m => m.id === 'visitor').length, 0);
    assert.equal(sys.getLog().filter(e => e.npc === 'visitor').length, 0);
});

test('caffeine NPC vacates its post within T1 and again within P (bounded cycle)', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const { sys, w } = run(1, 30, cfg);
    const { t1, p } = needTiming(cfg.npcs.clerk.rec.needs.caffeine, 70);
    assert.equal(t1, 2.5);
    const left = w.calls.emits.filter(e => e.name === 'npc_left_post:clerk');
    const back = w.calls.emits.filter(e => e.name === 'npc_returned_post:clerk');
    const starts = sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'job_start').map(e => e.t);
    assert.ok(starts[0] <= ticksFor(t1 * 60000) + 1, `first departure at tick ${starts[0]}`);
    // Use dwell 40 s plus instant travel; next departure within P + use + 2 ticks
    const bound = ticksFor((p * 60 + 40) * 1000) + 2;
    for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] <= bound, `gap ${starts[i] - starts[i - 1]} > ${bound}`);
    assert.ok(starts.length >= 3, `departures in 30 min: ${starts.length}`);
    assert.ok(left.length >= 3 && back.length >= 3);
    assert.equal(w.calls.globals.clerk_had_coffee, true);
    // Away window: walk home yields to the player, the trip out does not
    assert.ok(w.calls.moves.some(m => m.id === 'clerk' && m.yieldToPlayer === true));
    assert.ok(w.calls.moves.some(m => m.id === 'clerk' && m.yieldToPlayer === false));
});

function curiousCfg() {
    const cfg = office({
        npcs: {
            finder: {
                pos: { x: 120, y: 100 },
                rec: {
                    id: 'finder', needsHome: 'finder_pc',
                    interests: { found_item: { weight: 2 } },
                    usePayload: { note: 'finder-owned' },
                    onUse: { finder_pc: { setGlobal: 'finder_used_item' } }
                }
            }
        },
        objects: [{ id: 'finder_pc', x: 200, y: 68, affordance: { accepts: ['found_item'], useSeconds: 15 } }]
    });
    return cfg;
}

test('interest: no matching item means no option, the NPC holds still', () => {
    const { sys, w } = run(3, 10, curiousCfg());
    assert.equal(w.calls.moves.filter(m => m.id === 'finder').length, 0);
    assert.equal(sys.getState('finder').mode, 'idle');
});

test('interest: a dropped tagged item is collected and used at an accepting PC', () => {
    const cfg = curiousCfg();
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(60000);
    // An untagged item and a wrongly tagged one are ignored
    w.objs.push({ id: 'junk', x: 150, y: 150, roomId: 'office', pickable: true, needsTag: null });
    w.objs.push({ id: 'other', x: 150, y: 150, roomId: 'office', pickable: true, needsTag: 'something_else' });
    sys.step(30000);
    assert.equal(w.calls.moves.filter(m => m.id === 'finder').length, 0);
    const dropTick = sys.tickCount;
    w.objs.push({ id: 'dropped_thing', x: 160, y: 160, roomId: 'office', pickable: true, needsTag: 'found_item' });
    sys.step(60000);
    const log = sys.getLog().filter(e => e.npc === 'finder');
    const start = log.find(e => e.ev === 'job_start');
    assert.ok(start && start.t - dropTick <= 1, 'collects on the next tick');
    assert.equal(start.item, 'dropped_thing');
    assert.ok(log.some(e => e.ev === 'picked_up' && e.item === 'dropped_thing'));
    const used = w.calls.emits.find(e => e.name === 'npc_used:finder_pc');
    assert.ok(used, 'npc_used fired');
    assert.deepEqual(used.data, { npcId: 'finder', objectId: 'finder_pc', need: null, itemId: 'dropped_thing', tag: 'found_item', payload: { note: 'finder-owned' }, playerNearby: false, playerDistance: null });
    assert.equal(w.calls.globals.finder_used_item, true);
    assert.deepEqual(w.calls.consumed, [{ npcId: 'finder', itemId: 'dropped_thing' }]);
    // the clerk has no interests and never touched it
    assert.ok(!sys.getLog().some(e => e.npc === 'clerk' && e.item));
});

test('two NPCs using the same object deliver their own payloads; the object holds none', () => {
    const cfg = office({
        npcs: {
            clerk2: {
                pos: { x: 500, y: 500 },
                rec: { id: 'clerk2', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50 } }, usePayload: ['clerk2', 2] }
            }
        }
    });
    const { w } = run(5, 6, cfg);
    const uses = w.calls.emits.filter(e => e.name === 'npc_used:coffee_machine');
    const byNpc = Object.fromEntries(uses.map(u => [u.data.npcId, u.data.payload]));
    assert.deepEqual(byNpc.clerk, { note: 'clerk-owned' });
    assert.deepEqual(byNpc.clerk2, ['clerk2', 2]);
    const machine = cfg.objects.find(o => o.id === 'coffee_machine');
    assert.deepEqual(Object.keys(machine.affordance).sort(), ['restores', 'satisfies', 'useSeconds']);
    // payload is a clone: mutating it does not reach the NPC
    uses.find(u => u.data.npcId === 'clerk').data.payload.note = 'changed';
    assert.equal(cfg.npcs.clerk.rec.usePayload.note, 'clerk-owned');
});

test('capacity 1: two urgent NPCs never use the coffee machine at once', () => {
    const cfg = office({
        npcs: { clerk2: { pos: { x: 500, y: 500 }, rec: { id: 'clerk2', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50 } } } } }
    });
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const { sys } = run(5, 6, cfg);
    const using = {};
    let overlap = false;
    for (const e of sys.getLog()) {
        if (e.ev === 'using' && e.target === 'coffee_machine') { using[e.npc] = true; if (Object.keys(using).length > 1) overlap = true; }
        if (e.ev === 'used' && e.target === 'coffee_machine') delete using[e.npc];
    }
    assert.equal(overlap, false);
});

test('conversation hard-freezes the NPC; the job resumes after', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld({ ...cfg });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    w.setChat('clerk');
    sys.step(5 * 60000); // caffeine goes urgent during the chat
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0);
    assert.equal(sys.getState('clerk').mode, 'frozen');
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'urgent'));
    w.setChat(null);
    sys.step(2000);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'job_start'));
});

test('a scripted move suspends needs until a resume mapping', () => {
    const cfg = office();
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(1000);
    sys.onExternalMove('clerk', undefined);
    sys.step(10 * 60000);
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0);
    assert.equal(sys.getState('clerk').scriptSuspended, true);
    sys.control('clerk', 'resume');
    sys.step(1000);
    assert.ok(w.calls.moves.some(m => m.id === 'clerk'));
    sys.control('clerk', { set: { caffeine: 0 } });
    assert.equal(sys.getState('clerk').levels.caffeine, 0);
});

test('an unreachable affordance fails visibly and the NPC goes home', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld({ ...cfg, arrive: false });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(4 * 60000);
    assert.ok(w.calls.emits.some(e => e.name === 'npc_job_failed:clerk' && e.data.reason === 'timeout'));
});

test('needs clock pauses on the VM and clamps long frames', () => {
    let now = 0, vm = false;
    const cfg = office();
    const w = makeWorld(cfg);
    w.world.elapsedMs = () => now;
    w.world.isVmActive = () => vm;
    const sys = new NPCNeedsSystem(w.world, { seed: 1 });
    w.attach(sys);
    sys.registerAll();
    sys.update();
    now += 60000; sys.update(); // a minute-long frame counts as 1 s
    assert.equal(sys.clockMs, 1000);
    vm = true; now += 500; sys.update();
    assert.equal(sys.clockMs, 1000);
    vm = false; now += 500; sys.update();
    assert.equal(sys.clockMs, 1500);
});

test('given the frame step, the needs clock follows it and not wall time', () => {
    // Below 5 fps Phaser holds the physics step near one normal frame while wall time runs on.
    // The engine passes that step, so a walk deadline cannot pass while the walker crawls.
    let now = 0, vm = false;
    const w = makeWorld(office());
    w.world.elapsedMs = () => now;
    w.world.isVmActive = () => vm;
    const sys = new NPCNeedsSystem(w.world, { seed: 1 });
    w.attach(sys);
    sys.registerAll();
    sys.update(16);                       // the first frame only sets the baseline
    assert.equal(sys.clockMs, 0);
    for (let i = 0; i < 40; i++) { now += 450; sys.update(25); }   // 18 s of wall time, 1 s of steps
    assert.equal(sys.clockMs, 1000);
    now += 450; sys.update(60000);        // a frame step is clamped like an elapsed one
    assert.equal(sys.clockMs, 2000);
    vm = true; now += 450; sys.update(500);
    assert.equal(sys.clockMs, 2000);
    vm = false;
    now += 500; sys.update(NaN);          // no usable step: elapsed time, as before
    assert.equal(sys.clockMs, 2500);
    now += 250; sys.update();
    assert.equal(sys.clockMs, 2750);
});

test('an unreachable nearer target is skipped, a reachable farther one is chosen', () => {
    const cfg = office({ objects: [
        { id: 'far_machine', x: 500, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } },
        { id: 'locked_machine', x: 120, y: 120, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }
    ] });
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld(cfg);
    w.world.reachable = (id, o) => o.id !== 'locked_machine' && o.id !== 'coffee_machine';
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(4 * 60000);
    const starts = sys.getLog().filter(e => e.ev === 'job_start');
    assert.ok(starts.length >= 1);
    assert.ok(starts.every(e => e.target === 'far_machine'), JSON.stringify(starts));
    assert.equal(w.calls.emits.filter(e => e.name === 'npc_job_failed:clerk').length, 0);
});

test('with nothing reachable the NPC holds still instead of failing', () => {
    const w = makeWorld(office());
    w.world.reachable = () => false;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(10 * 60000);
    assert.equal(w.calls.moves.length, 0);
    assert.equal(w.calls.emits.filter(e => e.name.startsWith('npc_job_failed')).length, 0);
});

test('npc_used carries playerNearby and playerDistance from the world', () => {
    for (const nearby of [true, false]) {
        const cfg = office();
        cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
        const w = makeWorld(cfg);
        w.world.playerProximity = () => ({ nearby, distance: 64.4 });
        const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
        w.attach(sys);
        sys.registerAll();
        sys.step(5 * 60000);
        const used = w.calls.emits.find(e => e.name === 'npc_used:coffee_machine');
        assert.ok(used);
        assert.equal(used.data.playerNearby, nearby);
        assert.equal(used.data.playerDistance, 64);
    }
});

test('wind-up: the tell is emitted at the post, the NPC leaves only after the delay', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld(cfg);
    w.world.windupMs = () => 1000;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const names = () => w.calls.emits.map(e => e.name);
    let guard = 0;
    while (!names().includes('npc_action_windup:clerk') && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.ok(names().includes('npc_action_windup:clerk'), 'tell emitted');
    assert.ok(!names().includes('npc_left_post:clerk'), 'still at the post');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0);
    assert.equal(sys.getState('clerk').job.windingUp, true);
    sys.step(1250);
    assert.ok(names().includes('npc_left_post:clerk'), 'leaves after the wind-up');
    assert.ok(names().indexOf('npc_action_windup:clerk') < names().indexOf('npc_left_post:clerk'));
    assert.ok(w.calls.moves.some(m => m.id === 'clerk'));
});

// ── needsHome preference (f816f09a5): _useCandidate and _carryCandidate ─────────

/** A clerk whose home object is the FARTHER of two caffeine machines. */
function homePrefCfg() {
    const cfg = office({ objects: [
        { id: 'near_machine', x: 130, y: 130, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } },
        { id: 'home_machine', x: 600, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }
    ] });
    cfg.objects = cfg.objects.filter(o => o.id !== 'coffee_machine');
    cfg.npcs.clerk.rec.needsHome = 'home_machine';
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    return cfg;
}

function firstTargets(cfg, tweak) {
    const w = makeWorld(cfg);
    if (tweak) tweak(w);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(4 * 60000);
    return { sys, w, targets: sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'job_start').map(e => e.target) };
}

test('needsHome: the NPC\'s own object beats a nearer free one', () => {
    const { targets } = firstTargets(homePrefCfg());
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'home_machine'), JSON.stringify(targets));
});

test('needsHome: without a home preference the nearer object wins (control)', () => {
    const cfg = homePrefCfg();
    cfg.npcs.clerk.rec.needsHome = undefined;
    const { targets } = firstTargets(cfg);
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'near_machine'), JSON.stringify(targets));
});

test('needsHome: an unreachable home object falls back to the nearest reachable one', () => {
    const { targets } = firstTargets(homePrefCfg(), w => { w.world.reachable = (id, o) => o.id !== 'home_machine'; });
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'near_machine'), JSON.stringify(targets));
});

test('needsHome: a busy home object (on cooldown) falls back to the nearest free one', () => {
    const cfg = homePrefCfg();
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.states.get('clerk').cooldowns.home_machine = Infinity;   // _free() reads the live state
    sys.step(4 * 60000);
    const targets = sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'job_start').map(e => e.target);
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'near_machine'), JSON.stringify(targets));
});

test('needsHome: a home object that does not satisfy the need is ignored (nearest wins)', () => {
    const cfg = homePrefCfg();
    cfg.npcs.clerk.rec.needsHome = 'clerk_pc';          // satisfies nothing
    const { targets } = firstTargets(cfg);
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'near_machine'), JSON.stringify(targets));
});

/** Carry job: the finder's home PC is farther than a second accepting PC. */
function carryHomeCfg() {
    const cfg = curiousCfg();
    cfg.objects.push({ id: 'near_pc', x: 170, y: 168, affordance: { accepts: ['found_item'], useSeconds: 15 } });
    return cfg;
}

function carryTarget(tweak) {
    const w = makeWorld(carryHomeCfg());
    if (tweak) tweak(w);
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(30000);
    w.objs.push({ id: 'dropped_thing', x: 160, y: 160, roomId: 'office', pickable: true, needsTag: 'found_item' });
    sys.step(60000);
    return sys.getLog().find(e => e.npc === 'finder' && e.ev === 'job_start');
}

test('needsHome (carry): the finder takes the item to its own PC, not the nearer accepting one', () => {
    const start = carryTarget();
    assert.ok(start, 'job started');
    assert.equal(start.target, 'finder_pc');
});

test('needsHome (carry): an unreachable home PC falls back to the nearest accepting one', () => {
    const start = carryTarget(w => { w.world.reachable = (id, o) => o.id !== 'finder_pc'; });
    assert.ok(start, 'job started');
    assert.equal(start.target, 'near_pc');
});

// ── provisional needsHome (D1): the home object registers after the NPC ─────────

test('needsHome: an object that appears after N ticks becomes the home and the preference applies', () => {
    const cfg = homePrefCfg();
    const home = cfg.objects.find(o => o.id === 'home_machine');
    home.roomId = null;                           // not registered yet (start-room order)
    const w = makeWorld(cfg);
    const lookups = [];
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    const resolve = sys._resolveHome.bind(sys);
    sys._resolveHome = (s, p) => { lookups.push(sys.tickCount); return resolve(s, p); };
    w.attach(sys);
    sys.registerAll();
    sys.step(10 * NEEDS_TICK_MS);
    let st = sys.getState('clerk');
    assert.equal(st.home.provisional, true);
    assert.equal(st.home.objectId, null);
    assert.ok(lookups.length >= 2 && lookups.length <= 4, `throttled retries: ${lookups}`);
    w.objs.find(o => o.id === 'home_machine').roomId = 'office';
    sys.step(8 * NEEDS_TICK_MS);
    st = sys.getState('clerk');
    assert.equal(st.home.provisional, false);
    assert.equal(st.home.objectId, 'home_machine');
    assert.deepEqual([st.home.x, st.home.y], [600, 300 + TILE]);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'home_resolved' && e.target === 'home_machine'));
    sys.step(4 * 60000);
    const targets = sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'job_start').map(e => e.target);
    assert.ok(targets.length >= 1);
    assert.ok(targets.every(t => t === 'home_machine'), JSON.stringify(targets));
});

test('needsHome: a home found on the first tick is never looked up again; coordinate homes are not provisional', () => {
    const cfg = homePrefCfg();
    const w = makeWorld(cfg);
    let lookups = 0;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    const resolve = sys._resolveHome.bind(sys);
    sys._resolveHome = (s, p) => { lookups++; return resolve(s, p); };
    w.attach(sys);
    sys.registerAll();
    sys.step(4 * 60000);
    assert.equal(lookups, 1);
    assert.equal(sys.getState('clerk').home.provisional, false);

    const cfg2 = office();
    cfg2.npcs.clerk.rec.needsHome = { room: 'office', x: 2, y: 3 };
    const { sys: sys2 } = run(1, 1, cfg2);
    const h = sys2.getState('clerk').home;
    assert.deepEqual([h.x, h.y, h.provisional], [64, 96, false]);
});

test('engine reachable(): an NPC already standing at the approach cell can reach it (EasyStar gives no path for start == end)', () => {
    globalThis.window = { pathfindingManager: { findWorldPath: (ax, ay, bx, by, cb) => cb(ax === bx && ay === by ? null : [[0, 0], [1, 1]]) } };
    try {
        const w = createEngineWorld();
        w.approachCell = () => ({ x: 92, y: 124 });
        w.npcPos = () => ({ x: 100, y: 130 });
        assert.equal(w.reachable('sanjay', {}), true);
        window.pathfindingManager.findWorldPath = (ax, ay, bx, by, cb) => cb(null);
        assert.equal(w.reachable('sanjay', {}), true);          // within a tile: no path query needed
        w.npcPos = () => ({ x: 300, y: 300 });
        assert.equal(w.reachable('sanjay', {}), false);         // far away and no path: unreachable
    } finally {
        delete globalThis.window;
    }
});

// ── own-desk work does not leave the post ───────────────────────────────────────

/** A clerk with a `work` need satisfied by her own PC and by a spare PC; plus a coffee need. */
function ownDeskCfg({ spare = false } = {}) {
    const cfg = office({ objects: [
        { id: 'own_pc', x: 100, y: 68, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } },
        ...(spare ? [{ id: 'spare_pc', x: 500, y: 300, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } }] : [])
    ] });
    cfg.npcs.clerk.rec.needsHome = 'own_pc';
    cfg.npcs.clerk.rec.needs = { work: { decayPerMin: 20, urgentAt: 40, initial: 30, jitterPct: 0 } };
    cfg.objects = cfg.objects.filter(o => o.id !== 'clerk_pc' && o.id !== 'coffee_machine');
    return cfg;
}

test('own-desk work: no left/returned events and the owner stays at the post', () => {
    for (const windup of [0, 1000]) {
        const w = makeWorld(ownDeskCfg());
        w.world.windupMs = () => windup;
        const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
        w.attach(sys);
        sys.registerAll();
        sys.step(10 * 60000);
        const names = w.calls.emits.map(e => e.name);
        assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'used' && e.target === 'own_pc'), 'worked at own desk');
        assert.ok(!names.includes('npc_left_post:clerk'), `left emitted (windup ${windup})`);
        assert.ok(!names.includes('npc_returned_post:clerk'), `returned emitted (windup ${windup})`);
        assert.ok(!names.includes('npc_action_windup:clerk'), 'no leaving tell for a desk session');
        assert.equal(sys.getState('clerk').atPost, true);
    }
});

test('work at another object still emits left then returned', () => {
    const cfg = ownDeskCfg({ spare: true });
    cfg.npcs.clerk.rec.needsHome = 'spare_pc';           // own_pc is now "elsewhere"
    cfg.objects.find(o => o.id === 'spare_pc').x = 600;
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.states.get('clerk').cooldowns.spare_pc = Infinity;  // forces the job to own_pc
    sys.step(4 * 60000);
    const names = w.calls.emits.map(e => e.name);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'used' && e.target === 'own_pc'));
    assert.ok(names.includes('npc_left_post:clerk'));
    assert.ok(names.includes('npc_returned_post:clerk'));
    assert.ok(names.indexOf('npc_left_post:clerk') < names.indexOf('npc_returned_post:clerk'));
});

test('a need for the own post that turns urgent while away: arriving for it is the return', () => {
    // Work turns urgent during the coffee, so the walk home becomes a job at the own PC. The
    // return is announced on arrival, not after the session there, and only once.
    const cfg = office({ objects: [
        { id: 'own_pc', x: 100, y: 68, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } }
    ] });
    cfg.objects = cfg.objects.filter(o => o.id !== 'clerk_pc');
    cfg.npcs.clerk.rec.needsHome = 'own_pc';
    cfg.npcs.clerk.rec.needs = {
        caffeine: { decayPerMin: 60, urgentAt: 50, initial: 55, jitterPct: 0 },
        work: { decayPerMin: 20, urgentAt: 40, initial: 45, jitterPct: 0 }
    };
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    slowWalks(w, sys);
    sys.registerAll();
    sys.step(90000);
    const log = sys.getLog().filter(e => e.npc === 'clerk');
    const at = (ev, target) => log.findIndex(e => e.ev === ev && (!target || e.target === target));
    assert.ok(at('used', 'coffee_machine') >= 0, 'had the coffee');
    const usingOwn = log.findIndex((e, i) => i > at('used', 'coffee_machine') && e.ev === 'using' && e.target === 'own_pc');
    const usedOwn = log.findIndex((e, i) => i > usingOwn && e.ev === 'used' && e.target === 'own_pc');
    const back = at('returned_post');
    assert.ok(usingOwn > 0 && usedOwn > usingOwn, 'worked at the own PC on the way back');
    assert.ok(back > at('used', 'coffee_machine') && back < usingOwn, 'returned on arrival, before the session');
    assert.equal(log[back].t, log[usingOwn].t, 'in the same tick as the arrival');
    assert.equal(log.filter(e => e.ev === 'returned_post').length, 1);
    assert.equal(w.calls.emits.filter(e => e.name === 'npc_returned_post:clerk').length, 1);
    assert.equal(sys.getState('clerk').atPost, true);
});

/** Walks that take two seconds (the stub's are instant), so a walk is still under way when
 *  the next tick's choices are made. Returns a probe for the walk in progress. */
function slowWalks(w, sys) {
    let walk = null;
    w.world.moveTo = (id, x, y) => { walk = { id, x, y, from: sys.tickCount, at: sys.tickCount + 8 }; };
    w.world.cancelMove = () => { walk = null; };
    sys.onTick(() => {
        if (!walk || sys.tickCount < walk.at) return;
        const m = walk; walk = null;
        w.pos[m.id].x = m.x; w.pos[m.id].y = m.y;
        sys.onArrived(m.id, 'needs');
    });
    return () => walk;
}

test('a delivery to the own post: arriving with the item is the return', () => {
    // A carry job whose target is the own post object (a printout taken back to the desk)
    // arrives the same way as a need for it. The return is announced on arrival, once, and
    // not after the session at the desk.
    const w = makeWorld(curiousCfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    slowWalks(w, sys);
    sys.registerAll();
    sys.step(30000);
    w.objs.push({ id: 'dropped_thing', x: 160, y: 160, roomId: 'office', pickable: true, needsTag: 'found_item' });
    sys.step(60000);
    const log = sys.getLog().filter(e => e.npc === 'finder');
    const start = log.find(e => e.ev === 'job_start');
    assert.equal(start?.target, 'finder_pc', 'the delivery is to the own PC');
    const names = w.calls.emits.map(e => e.name);
    assert.ok(names.includes('npc_left_post:finder'), 'it really left');
    const picked = log.findIndex(e => e.ev === 'picked_up');
    const using = log.findIndex(e => e.ev === 'using' && e.target === 'finder_pc');
    const used = log.findIndex(e => e.ev === 'used' && e.target === 'finder_pc');
    const back = log.findIndex(e => e.ev === 'returned_post');
    assert.ok(picked >= 0 && using > picked && used > using, 'picked up, carried home, used there');
    assert.ok(back > picked && back < using, 'returned on arrival, before the session');
    assert.equal(log[back].t, log[using].t, 'in the same tick as the arrival');
    assert.ok(log[used].t > log[back].t, 'the session comes after');
    assert.equal(log.filter(e => e.ev === 'returned_post').length, 1);
    assert.equal(w.calls.emits.filter(e => e.name === 'npc_returned_post:finder').length, 1);
    assert.equal(sys.getState('finder').atPost, true);
});

test('a delivery to the own post: a player at the desk while the owner fetches the item is not caught', () => {
    // The per-tick caught check runs only on the goto_target leg. On goto_item the owner has
    // just left the desk (still in the home room) to fetch the item: it is not a return.
    const w = makeWorld(curiousCfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    slowWalks(w, sys);
    let askedOnFetch = 0;
    w.world.playerAtPost = () => {
        const fetching = sys.getState('finder').job?.phase === 'goto_item';
        if (fetching) askedOnFetch++;
        return { distance: fetching ? 10 : 500, inMinigame: false };
    };
    sys.registerAll();
    sys.step(30000);
    w.objs.push({ id: 'dropped_thing', x: 160, y: 160, roomId: 'office', pickable: true, needsTag: 'found_item' });
    sys.step(60000);
    const log = sys.getLog().filter(e => e.npc === 'finder');
    assert.ok(log.some(e => e.ev === 'picked_up'), 'the item was fetched');
    assert.ok(log.some(e => e.ev === 'returned_post'), 'and carried back to the desk');
    assert.equal(askedOnFetch, 0, 'nothing asks where the player is while the owner fetches the item');
    assert.equal(w.calls.emits.filter(e => e.name === 'npc_caught_at_post:finder').length, 0);
});

test('a walk back that is a job for the own post checks for the player at the desk on every tick', () => {
    // An ordinary walk home is checked each tick. This one is a job, and was checked only on
    // the tick after the trip ended and on arrival: a player at the desk mid-walk who had
    // stepped away by the arrival was not caught.
    const cfg = office({ objects: [
        { id: 'own_pc', x: 100, y: 68, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } }
    ] });
    cfg.objects = cfg.objects.filter(o => o.id !== 'clerk_pc');
    cfg.npcs.clerk.rec.needsHome = 'own_pc';
    cfg.npcs.clerk.rec.needs = {
        caffeine: { decayPerMin: 60, urgentAt: 50, initial: 55, jitterPct: 0 },
        work: { decayPerMin: 20, urgentAt: 40, initial: 45, jitterPct: 0 }
    };
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    const walking = slowWalks(w, sys);
    // Near the desk only in the middle of the walk to the own PC: not on its first two ticks
    // and not on its last two
    const asked = [];
    w.world.playerAtPost = () => {
        const job = sys.getState('clerk').job;
        const walk = walking();
        const mid = !!(walk && job?.targetId === 'own_pc' && job.phase === 'goto_target'
            && sys.tickCount >= walk.from + 3 && sys.tickCount <= walk.at - 2);
        asked.push(mid);
        return { distance: mid ? 10 : 500, inMinigame: false };
    };
    sys.registerAll();
    sys.step(90000);
    assert.ok(asked.some(Boolean), 'the player was at the desk during the walk back');
    const caught = w.calls.emits.filter(e => e.name === 'npc_caught_at_post:clerk');
    assert.equal(caught.length, 1, 'caught once');
    assert.equal(caught[0].data.objectId, 'own_pc');
    assert.equal(w.calls.emits.filter(e => e.name === 'npc_returned_post:clerk').length, 1);
});

test('game.js hands the frame step to the needs clock', () => {
    // The needs clock follows Phaser's frame step only if the scene's update passes it on. A
    // tidy-up of the signature would bring the wall clock back with every other test passing.
    const src = readFileSync(new URL('../../public/break_escape/js/core/game.js', import.meta.url), 'utf8');
    assert.match(src, /export function update\(time, delta\)/, 'the scene update takes (time, delta)');
    assert.match(src, /npcNeedsSystem\?\.update\(delta\)/, 'and passes delta to the needs system');
});

// ── tick-cost hygiene (slice 1): office() logs are unchanged ────────────────────
// More in npc-needs-tick-cost.test.mjs (the test_needs_sims fixture, back-off, benchmark).

test('tick-cost steps 1-3 leave the office() decision logs byte-identical', () => {
    const legacy = { tickCache: false, selectBackoff: false };
    const cfgs = [() => office(), () => curiousCfg(), () => homePrefCfg(), () => carryHomeCfg(), () => ownDeskCfg({ spare: true })];
    for (const make of cfgs) {
        for (const reach of [null, (id, o) => !/home|finder_pc|coffee/.test(o.id)]) {
            const runWith = opts => {
                const w = makeWorld(make());
                if (reach) w.world.reachable = reach;
                const sys = new NPCNeedsSystem(w.world, { seed: 42, manualClock: true, ...opts });
                w.attach(sys);
                sys.registerAll();
                sys.step(3 * 60000);
                w.objs.push({ id: 'dropped_thing', x: 160, y: 160, roomId: 'office', pickable: true, needsTag: 'found_item' });
                sys.step(10 * 60000);
                return JSON.stringify(sys.getLog());
            };
            assert.equal(runWith({ selectBackoff: false }), runWith(legacy));
        }
    }
});

test('an own-desk use that is aborted emits neither left nor returned, and the owner stays at the post', () => {
    const w = makeWorld(ownDeskCfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    while (sys.getState('clerk').job?.phase !== 'using' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').job.targetId, 'own_pc');
    sys.control('clerk', 'suspend');
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'job_aborted' && e.target === 'own_pc'));
    sys.control('clerk', 'resume');
    sys.step(2000);
    const names = w.calls.emits.map(e => e.name);
    assert.ok(!names.includes('npc_left_post:clerk'));
    assert.ok(!names.includes('npc_returned_post:clerk'));
    assert.equal(sys.getState('clerk').atPost, true);
});

// ── slice 2: caught at the desk, expectedAwayMs ─────────────────────────────────

/** office() with no jitter, run until the clerk's first npc_left_post. */
function firstLeave(playerAtPost) {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld(cfg);
    if (playerAtPost) w.world.playerAtPost = playerAtPost;
    w.world.playerProximity = () => ({ nearby: false, distance: 250 });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    return { w, sys };
}

test('npc_left_post carries expectedAwayMs (walk out and back at speedFor, plus useSeconds) and player proximity', () => {
    const { w, sys } = firstLeave();
    sys.step(4 * 60000);
    const left = w.calls.emits.find(e => e.name === 'npc_left_post:clerk');
    const back = w.calls.emits.find(e => e.name === 'npc_returned_post:clerk');
    assert.ok(left && back);
    // clerk at (100,100) = home; coffee approach cell (300,332); speed 80 px/s; dwell 40 s
    const walk = 2 * Math.hypot(200, 232) / 80 * 1000;
    assert.equal(left.data.expectedAwayMs, Math.round(walk + 40000));
    assert.equal(left.data.targetId, 'coffee_machine');
    assert.equal(left.data.playerNearby, false);
    assert.equal(left.data.playerDistance, 250);
    assert.equal(back.data.playerDistance, 250);
});

test('expectedAwayMs for a carry includes the leg via the item', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.interests = { found_item: { weight: 5 } };
    cfg.objects.push({ id: 'thing', x: 100, y: 300, needsTag: 'found_item' });
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(NEEDS_TICK_MS * 2);
    const left = w.calls.emits.find(e => e.name === 'npc_left_post:clerk');
    assert.ok(left, 'left for the item');
    // (100,100) -> thing cell (100,332) -> clerk_pc cell (100,100) -> home (100,100); dwell 10 s
    assert.equal(left.data.expectedAwayMs, Math.round(232 * 2 / 80 * 1000 + 10000));
});

test('caught at the desk: once per return, before npc_returned_post, with distance and inMinigame', () => {
    const { w, sys } = firstLeave(() => ({ distance: 20.4, inMinigame: false }));
    sys.step(20 * 60000);
    const names = w.calls.emits.map(e => e.name);
    const caught = w.calls.emits.filter(e => e.name === 'npc_caught_at_post:clerk');
    const backs = names.filter(n => n === 'npc_returned_post:clerk').length;
    assert.ok(backs >= 2, `returns: ${backs}`);
    assert.equal(caught.length, backs, 'one catch per return');
    assert.ok(names.indexOf('npc_caught_at_post:clerk') < names.indexOf('npc_returned_post:clerk'));
    assert.deepEqual(caught[0].data, { npcId: 'clerk', objectId: 'clerk_pc', playerDistance: 20, inMinigame: false });
    assert.ok(sys.getLog().some(e => e.ev === 'caught_at_post'));
});

test('caught at the desk: a minigame open on the home object counts from any distance', () => {
    const { w, sys } = firstLeave((id, home) => ({ distance: null, inMinigame: home.objectId === 'clerk_pc' }));
    sys.step(4 * 60000);
    const caught = w.calls.emits.find(e => e.name === 'npc_caught_at_post:clerk');
    assert.deepEqual(caught?.data, { npcId: 'clerk', objectId: 'clerk_pc', playerDistance: null, inMinigame: true });
});

test('not caught when the player is elsewhere, or (with the player at the desk) after an own-desk use', () => {
    const far = firstLeave(() => ({ distance: 49, inMinigame: false }));
    far.sys.step(10 * 60000);
    assert.ok(far.w.calls.emits.some(e => e.name === 'npc_returned_post:clerk'));
    assert.ok(!far.w.calls.emits.some(e => e.name === 'npc_caught_at_post:clerk'));

    const w = makeWorld(ownDeskCfg());
    w.world.playerAtPost = () => ({ distance: 10, inMinigame: true });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(10 * 60000);
    assert.ok(sys.getLog().some(e => e.ev === 'used' && e.target === 'own_pc'));
    assert.ok(!w.calls.emits.some(e => e.name === 'npc_caught_at_post:clerk'));
});

test('caught at the desk: not while the returning NPC is still in another room', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld({ ...cfg, arrive: false });
    w.world.playerAtPost = () => ({ distance: 5, inMinigame: false });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const arriveAt = (x, y) => { w.pos.clerk.x = x; w.pos.clerk.y = y; sys.onArrived('clerk', 'needs'); };
    let guard = 0;
    while (sys.getState('clerk').job?.phase !== 'goto_target' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    w.pos.clerk.roomId = 'kitchen';
    arriveAt(300, 332);
    sys.step(41000);                                   // 40 s use, then returning
    assert.equal(sys.getState('clerk').mode, 'returning');
    const caught = () => w.calls.emits.filter(e => e.name === 'npc_caught_at_post:clerk').length;
    assert.equal(caught(), 0, 'still in the kitchen');
    w.pos.clerk.roomId = 'office';
    sys.step(NEEDS_TICK_MS);
    assert.equal(caught(), 1, 'caught once back in the office');
    sys.step(NEEDS_TICK_MS * 4);
    assert.equal(caught(), 1, 'once per return');
});

test('walk home: a player standing in the way holds it for at most RETURN_YIELD_MS, then it carries on without yielding', () => {
    // Live (lab_physical_pentest games 614, 619, 622, 623): the walk home yields to the player
    // (face_player) for as long as the player stands within 96 px, so an NPC back from coffee
    // stood in `returning` for 50 s+ and never sat down again.
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld({ ...cfg, arrive: false });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    while (sys.getState('clerk').job?.phase !== 'goto_target' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    w.pos.clerk.x = 300; w.pos.clerk.y = 332; sys.onArrived('clerk', 'needs');
    sys.step(41000);                                   // 40 s use, then returning
    assert.equal(sys.getState('clerk').mode, 'returning');
    const homeMoves = () => w.calls.moves.filter(m => m.id === 'clerk' && m.x === 100 && m.y === 100);
    assert.equal(homeMoves().length, 1);
    assert.equal(homeMoves()[0].yieldToPlayer, true, 'the walk home starts polite');

    // Walking: progress each tick, so no re-issue however long it takes
    for (let i = 0; i < 20; i++) { w.pos.clerk.x -= 4; sys.step(NEEDS_TICK_MS); }
    assert.equal(homeMoves().length, 1, 'a walk that is making progress is left alone');

    // The player stands beside it: it stops and faces them, then carries on
    sys.step(RETURN_YIELD_MS - NEEDS_TICK_MS);
    assert.equal(homeMoves().length, 1, 'a short courtesy pause');
    sys.step(NEEDS_TICK_MS * 2);
    assert.equal(homeMoves().length, 2, 'stalled walk home re-issued');
    assert.equal(homeMoves()[1].yieldToPlayer, false, 'and no longer yields to the player');
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'return_resumed'));

    // It gets there and counts as back
    w.pos.clerk.x = 100; w.pos.clerk.y = 100; sys.onArrived('clerk', 'needs');
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').mode, 'idle');
    assert.equal(sys.getState('clerk').atPost, true);
    assert.ok(w.calls.emits.some(e => e.name === 'npc_returned_post:clerk'));
});

test('own-desk work by a seated NPC (body ~30 px off its home cell) issues no move, before or after the use', () => {
    const cfg = ownDeskCfg();
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(NEEDS_TICK_MS);                          // home resolved at (100,100)
    w.pos.clerk.x = 120; w.pos.clerk.y = 122;         // seated pose moved the body
    sys.step(10 * 60000);
    assert.ok(sys.getLog().filter(e => e.ev === 'used' && e.target === 'own_pc').length >= 2);
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0, 'never moved');
    assert.equal(sys.getState('clerk').atPost, true);
});

// ── room leash and private objects (OFFICE_LIFE_PLAN 7.2, slice 2a) ───────────

/**
 * Three rooms in a row, kitchen | office | lounge, each 320 px wide. Reachability walks the room
 * adjacency and refuses any room in avoidRooms except the one the NPC stands in, as the live
 * pathfinder's start-room exemption does.
 */
function leashWorld({ npcs, objects, privateTo = {}, adj = { kitchen: ['office'], office: ['kitchen', 'lounge'], lounge: ['office'] } }) {
    const w = makeWorld({ npcs, objects });
    const roomOfX = x => (x < 0 ? 'kitchen' : x < 320 ? 'office' : 'lounge');
    w.reach = [];
    w.world.roomIds = () => Object.keys(adj);
    w.world.roomPrivateTo = r => privateTo[r] || null;
    w.world.reachable = (id, o, opts) => {
        const avoid = new Set(opts?.avoidRooms || []);
        w.reach.push({ id, target: o.id, avoidRooms: opts?.avoidRooms || null });
        const start = w.pos[id].roomId || roomOfX(w.pos[id].x);
        avoid.delete(start);
        const seen = new Set([start]), q = [start];
        while (q.length) {
            const r = q.shift();
            if (r === o.roomId) return true;
            for (const n of adj[r] || []) if (!seen.has(n) && !avoid.has(n)) { seen.add(n); q.push(n); }
        }
        return false;
    };
    const move = w.world.moveTo;
    w.world.moveTo = (id, x, y, speed, opts) => {
        move(id, x, y, speed, opts);
        w.calls.moves[w.calls.moves.length - 1].avoidRooms = opts.avoidRooms;
        w.pos[id].roomId = roomOfX(x);
    };
    return w;
}

function leashRun(cfg, minutes = 4, seed = 1) {
    const w = leashWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(minutes * 60000);
    const log = sys.getLog();
    return { sys, w, log, used: id => log.filter(e => e.npc === id && e.ev === 'used').map(e => e.target) };
}

const thirsty = { thirst: { decayPerMin: 30, urgentAt: 60, initial: 62, jitterPct: 0 } };
const tomRec = (extra = {}) => ({ id: 'tom', roomId: 'office', needsHome: 'tom_pc', needs: thirsty, ...extra });
const kitchenOffice = [
    { id: 'tom_pc', roomId: 'office', x: 100, y: 68, affordance: { useSeconds: 5 } },
    { id: 'lounge_cooler', roomId: 'lounge', x: 340, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } },
    { id: 'kitchen_cooler', roomId: 'kitchen', x: -200, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }
];

test('leash: no leash fields anywhere leaves choices alone and passes empty avoidRooms', () => {
    const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec() } }, objects: kitchenOffice });
    assert.equal(r.used('tom')[0], 'lounge_cooler', 'nearest wins');
    assert.equal(r.log.filter(e => e.ev === 'leashed').length, 0);
    assert.ok(r.w.calls.moves.every(m => Array.isArray(m.avoidRooms) && m.avoidRooms.length === 0));
});

test('leash: a deny list drops a room\'s objects, the next candidate wins, leashed is logged and emitted', () => {
    const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec({ needsAvoidRooms: ['lounge'] }) } }, objects: kitchenOffice });
    assert.deepEqual([...new Set(r.used('tom'))], ['kitchen_cooler']);
    const l = r.log.find(e => e.ev === 'leashed');
    assert.deepEqual({ need: l.need, skipped: l.skipped, chose: l.chose }, { need: 'thirst', skipped: ['lounge_cooler'], chose: 'kitchen_cooler' });
    const ev = r.w.calls.emits.find(e => e.name === 'npc_needs_leashed:tom');
    assert.deepEqual(ev.data, { npcId: 'tom', need: 'thirst', skipped: ['lounge_cooler'], chose: 'kitchen_cooler' });
    // Every move and every reachability search carries the forbidden room
    assert.ok(r.w.calls.moves.every(m => m.avoidRooms.join() === 'lounge'));
    assert.ok(r.w.reach.every(c => c.avoidRooms.join() === 'lounge'));
});

test('leash: an allow list implies the home room', () => {
    const objects = [...kitchenOffice, { id: 'office_cooler', roomId: 'office', x: 250, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }];
    const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec({ needsRooms: ['kitchen'] }) } }, objects });
    assert.deepEqual([...new Set(r.used('tom'))], ['office_cooler'], 'home room allowed although not listed');
    assert.ok(r.w.calls.moves.every(m => m.avoidRooms.join() === 'lounge'));
});

test('leash: an allow list while the home is still provisional takes the home room from scenario data (review M2)', () => {
    // tom_pc is not loaded yet, so the resolved home is provisional with no room; the spawn
    // roomId still exempts the office. Without it the office would be forbidden.
    const objects = [
        { id: 'office_cooler', roomId: 'office', x: 250, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } },
        { id: 'kitchen_cooler', roomId: 'kitchen', x: -200, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }
    ];
    const npcs = rec => ({ tom: { pos: { x: 100, y: 100 }, room: null, rec } });
    const a = leashRun({ npcs: npcs(tomRec({ needsRooms: ['kitchen'] })), objects });
    assert.equal(a.sys.getState('tom').home.provisional, true);
    assert.equal(a.used('tom')[0], 'office_cooler');
    const b = leashRun({ npcs: npcs(tomRec({ needsRooms: ['kitchen'], roomId: undefined })), objects });
    assert.equal(b.used('tom')[0], 'kitchen_cooler', 'control: with no spawn room the office is forbidden');
});

test('leash: needsPrivateTo lets the listed NPC in and keeps others out', () => {
    const cfg = {
        npcs: {
            tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec() },
            rosa: { pos: { x: 120, y: 100 }, room: 'office', rec: { id: 'rosa', roomId: 'office', needs: thirsty } }
        },
        objects: kitchenOffice,
        privateTo: { lounge: ['rosa'] }
    };
    const r = leashRun(cfg);
    assert.equal(r.used('rosa')[0], 'lounge_cooler');
    assert.equal(r.used('tom')[0], 'kitchen_cooler');
    assert.equal(r.log.filter(e => e.ev === 'leashed' && e.npc === 'rosa').length, 0);
});

test('leash: a target beyond a forbidden room is not chosen, and the search carries the room', () => {
    // Only the kitchen cooler; the NPC lives in the lounge and may not cross the office
    const objects = [kitchenOffice[2], { id: 'grace_sofa', roomId: 'lounge', x: 500, y: 100, affordance: { useSeconds: 5 } }];
    const r = leashRun({
        npcs: { grace: { pos: { x: 500, y: 140 }, room: 'lounge', rec: { id: 'grace', roomId: 'lounge', needsHome: 'grace_sofa', needs: thirsty, needsAvoidRooms: ['office'] } } },
        objects
    });
    assert.equal(r.used('grace').length, 0);
    assert.ok(r.w.reach.some(c => c.target === 'kitchen_cooler' && c.avoidRooms.join() === 'office'));
    // Without the leash the same NPC walks through the office to it
    const open = leashRun({ npcs: { grace: { pos: { x: 500, y: 140 }, room: 'lounge', rec: { id: 'grace', roomId: 'lounge', needsHome: 'grace_sofa', needs: thirsty } } }, objects });
    assert.equal(open.used('grace')[0], 'kitchen_cooler');
});

test('leash: an NPC a script left inside a forbidden room still walks home', () => {
    const r = leashRun({ npcs: { tom: { pos: { x: 400, y: 100 }, room: 'lounge', rec: tomRec({ needsAvoidRooms: ['lounge'] }) } }, objects: kitchenOffice }, 0.5);
    r.sys.control('tom', 'suspend');
    r.sys.control('tom', 'resume');
    const home = r.w.calls.moves.filter(m => m.id === 'tom' && m.yieldToPlayer === true);
    assert.ok(home.length >= 1, 'walk home issued');
    assert.equal(home[0].avoidRooms.join(), 'lounge', 'the start room is exempted by the pathfinder, not dropped here');
});

test('private objects: owner is explicit (a single id or a list); capacity 2 serves two owners', () => {
    // priv defaults true; owner and capacity are set per case (owner is top-level, step 8b)
    const coolerAt = (id, x, { priv = true, owner, capacity } = {}) => ({
        id, roomId: 'office', x, y: 100, private: priv,
        ...(owner !== undefined ? { owner } : {}),
        affordance: { satisfies: 'thirst', restores: 60, useSeconds: 30, ...(capacity !== undefined ? { capacity } : {}) }
    });
    const npc = (id, x) => ({ pos: { x, y: 100 }, room: 'office', rec: { id, roomId: 'office', needs: thirsty, needsHome: `${id}_desk` } });
    const desk = (id, x) => ({ id: `${id}_desk`, roomId: 'office', x, y: 68, affordance: { useSeconds: 5 } });
    // a private "desk" that satisfies thirst serves only its explicit owner
    let r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 200) },
        objects: [{ ...desk('amy', 100), private: true, owner: 'amy', affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }, coolerAt('pub', 280, { priv: false })]
    });
    assert.ok(r.used('amy').includes('amy_desk'));
    assert.ok(!r.used('ben').includes('amy_desk'));
    // a single-id owner
    r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 200) },
        objects: [desk('amy', 100), desk('ben', 200), coolerAt('kettle', 150, { owner: 'ben' }), coolerAt('pub', 280, { priv: false })]
    });
    assert.ok(r.used('ben').includes('kettle') && !r.used('amy').includes('kettle'));
    // an owner list with capacity 2: both owners together, the third waits or goes elsewhere
    r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 110), cat: npc('cat', 120) },
        objects: [desk('amy', 100), desk('ben', 110), desk('cat', 120), coolerAt('shared', 130, { owner: ['amy', 'ben'], capacity: 2 }), coolerAt('pub', 280, { priv: false })]
    });
    assert.ok(r.used('amy').includes('shared') && r.used('ben').includes('shared'));
    assert.ok(!r.used('cat').includes('shared') && r.used('cat').includes('pub'));
    const starts = r.log.filter(e => e.ev === 'job_start' && e.target === 'shared').map(e => e.t);
    assert.equal(starts[0], starts[1], 'the two owners share it at once');
});

test('private objects: another NPC may still deliver to a private object (OQ26)', () => {
    const cfg = {
        npcs: {
            sanjay: { pos: { x: 100, y: 100 }, room: 'office', rec: { id: 'sanjay', roomId: 'office', interests: { post: { weight: 5 } } } },
            tom: { pos: { x: 200, y: 100 }, room: 'office', rec: { id: 'tom', roomId: 'office', needsHome: 'tom_pc' } }
        },
        objects: [
            { id: 'tom_pc', roomId: 'office', x: 200, y: 68, private: true, owner: 'tom', affordance: { accepts: ['post'], useSeconds: 5 } },
            { id: 'letter', roomId: 'office', x: 120, y: 120, needsTag: 'post' }
        ]
    };
    const r = leashRun(cfg, 1);
    assert.ok(r.log.some(e => e.npc === 'sanjay' && e.ev === 'used' && e.target === 'tom_pc' && e.item === 'letter'));
});

test('leash: a job chosen after the leash removed an option carries job.leashed (the overlay label); an open choice does not', () => {
    const firstJob = rec => {
        const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec } }, objects: kitchenOffice }, 0);
        for (let i = 0; i < 400 && !r.sys.states.get('tom').job; i++) r.sys.step(250);
        return { raw: r.sys.states.get('tom').job, view: r.sys.getState('tom').job };
    };
    const leashed = firstJob(tomRec({ needsAvoidRooms: ['lounge'] }));
    assert.equal(leashed.raw?.targetId, 'kitchen_cooler');
    assert.equal(leashed.raw.leashed, true);
    assert.equal(leashed.view.leashed, true, 'getState (and so window.__test.needs.state) shows it');
    const open = firstJob(tomRec());
    assert.equal(open.raw?.targetId, 'lounge_cooler');
    assert.equal('leashed' in open.raw, false, 'no field on an unleashed job');
    assert.equal(open.view.leashed, false);
});

test('leash: nothing permitted left logs leashed once per urgent episode, with chose null', () => {
    const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec({ needsAvoidRooms: ['lounge', 'kitchen'] }) } }, objects: kitchenOffice }, 1);
    const l = r.log.filter(e => e.ev === 'leashed');
    assert.equal(l.length, 1);
    assert.deepEqual(l[0].skipped, ['lounge_cooler', 'kitchen_cooler']);
    assert.equal(r.w.calls.emits.find(e => e.name === 'npc_needs_leashed:tom').data.chose, null);
    assert.equal(r.used('tom').length, 0);
});

test('private objects: passing over another owner\'s private object is private_skipped, not leashed, and emits nothing', () => {
    // Amy is thirsty; Ben's private desk-kettle is nearer than the shared cooler
    const objects = [
        { id: 'amy_desk', roomId: 'office', x: 100, y: 68, affordance: { useSeconds: 5 } },
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, private: true, owner: ['ben'], affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } },
        { id: 'office_cooler', roomId: 'office', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }
    ];
    const r = leashRun({ npcs: { amy: { pos: { x: 100, y: 100 }, room: 'office', rec: { id: 'amy', roomId: 'office', needsHome: 'amy_desk', needs: thirsty } } }, objects }, 0);
    for (let i = 0; i < 400 && !r.sys.states.get('amy').job; i++) r.sys.step(250);
    const job = r.sys.states.get('amy').job;
    assert.equal(job.targetId, 'office_cooler');
    assert.equal('leashed' in job, false);
    assert.equal(job.privateSkipped, true, 'the overlay labels it "private"');
    assert.equal(r.sys.getState('amy').job.privateSkipped, true);
    const log = r.sys.getLog();
    assert.equal(log.filter(e => e.ev === 'leashed').length, 0);
    const p = log.find(e => e.ev === 'private_skipped');
    assert.deepEqual({ need: p.need, skipped: p.skipped, chose: p.chose }, { need: 'thirst', skipped: ['ben_kettle'], chose: 'office_cooler' });
    assert.equal(r.w.calls.emits.filter(e => e.name.startsWith('npc_needs_leashed')).length, 0);
});

test('private objects: with only another owner\'s private object left, private_skipped once per episode and no leashed', () => {
    const objects = [
        { id: 'amy_desk', roomId: 'office', x: 100, y: 68, affordance: { useSeconds: 5 } },
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, private: true, owner: ['ben'], affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }
    ];
    const r = leashRun({ npcs: { amy: { pos: { x: 100, y: 100 }, room: 'office', rec: { id: 'amy', roomId: 'office', needsHome: 'amy_desk', needs: thirsty } } }, objects }, 1);
    assert.equal(r.log.filter(e => e.ev === 'private_skipped').length, 1);
    assert.equal(r.log.filter(e => e.ev === 'leashed').length, 0);
    assert.equal(r.w.calls.emits.filter(e => e.name.startsWith('npc_needs_leashed')).length, 0);
    assert.equal(r.sys.states.get('amy').privateNoted.thirst, true);
    assert.ok(!Object.values(r.sys.states.get('amy').leashNoted).some(Boolean), 'the overlay does not say leashed');
});

test('leash and private together: leashed lists only the room-removed targets; the private one is logged apart', () => {
    const objects = [
        ...kitchenOffice,
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, private: true, owner: ['ben'], affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }
    ];
    const r = leashRun({ npcs: { tom: { pos: { x: 100, y: 100 }, room: 'office', rec: tomRec({ needsAvoidRooms: ['lounge'] }) } }, objects });
    const l = r.log.find(e => e.ev === 'leashed');
    assert.deepEqual(l.skipped, ['lounge_cooler']);
    assert.deepEqual(r.log.find(e => e.ev === 'private_skipped').skipped, ['ben_kettle']);
    assert.deepEqual(r.w.calls.emits.find(e => e.name === 'npc_needs_leashed:tom').data.skipped, ['lounge_cooler']);
});

// ── Access model step 9 (ACCESS_MODEL_PLAN.md 5.4): isAvailable and onTick ───────────────

test('step 9: isAvailable is false with no sprite and for ko, hostile and hidden, true otherwise', () => {
    const w = makeWorld(office());
    const status = {};
    w.world.npcStatus = (id) => status[id] || {};
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    assert.equal(sys.isAvailable('clerk'), true);
    for (const k of ['ko', 'hostile', 'hidden']) {
        status.clerk = { [k]: true };
        assert.equal(sys.isAvailable('clerk'), false, k);
    }
    status.clerk = {};
    delete w.pos.clerk;
    assert.equal(sys.isAvailable('clerk'), false, 'no sprite');
});

test('step 9: with no sprite _tickNpc only decays (no blocked, no home); with a sprite it blocks exactly when isAvailable is false', () => {
    const w = makeWorld(office());
    const status = {};
    w.world.npcStatus = (id) => status[id] || {};
    const saved = w.pos.clerk;
    delete w.pos.clerk;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const before = sys.getState('clerk').levels.caffeine;
    sys.step(60000);
    const s = sys.states.get('clerk');
    assert.ok(sys.getState('clerk').levels.caffeine < before, 'decayed');
    assert.equal(s.blocked, false);
    assert.equal(s.home, null);
    assert.ok(!sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'blocked'));
    // Sprite back, status ko: blocked once, then unblocked when available again
    w.pos.clerk = saved;
    status.clerk = { ko: true };
    sys.step(1000);
    assert.equal(s.blocked, true);
    assert.ok(s.home, 'home resolved before the availability test');
    assert.equal(sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'blocked').length, 1);
    status.clerk = {};
    sys.step(250);
    assert.equal(s.blocked, false);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'unblocked'));
});

test('step 9: an NPC with interests only is registered, so getState is not null for it', () => {
    const w = makeWorld(office({ npcs: { finder: { pos: { x: 200, y: 100 }, rec: { id: 'finder', needsHome: 'clerk_pc', interests: { found_item: 3 } } } } }));
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    assert.notEqual(sys.getState('finder'), null);
    assert.equal(sys.getState('visitor'), null);
});

test('step 9: onTick listeners run once at the end of each tick', () => {
    const w = makeWorld(office());
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const seen = [];
    const off = sys.onTick((s) => seen.push({ clock: s.clockMs, tick: s.tickCount, logLen: s.getLog().length }));
    sys.step(1000);
    assert.equal(seen.length, 4);
    assert.deepEqual(seen.map(x => x.tick), [1, 2, 3, 4]);
    assert.equal(seen[3].clock, 1000);
    // Called after the NPCs were processed: the log the listener saw includes this tick's entries
    assert.equal(seen[seen.length - 1].logLen, sys.getLog().length);
    off();
    sys.step(500);
    assert.equal(seen.length, 4, 'unsubscribed');
    // A reset keeps the listeners (the test bridge's setSeed)
    const again = [];
    sys.onTick(() => again.push(1));
    sys.reset(2);
    sys.step(250);
    assert.equal(again.length, 1);
});

// q53 (f): interests.<tag>.noticeRadius, tiles from where the NPC stands (default 24)
import { normaliseInterest, NOTICE_RADIUS_TILES } from '../../public/break_escape/js/systems/npc-needs.js';

test('noticeRadius: default 24 tiles; a number is clamped to 0.5..100; junk falls back to the default', () => {
    assert.equal(NOTICE_RADIUS_TILES, 24);
    assert.equal(normaliseInterest(3).noticeRadius, 24);
    assert.equal(normaliseInterest({ weight: 3 }).noticeRadius, 24);
    assert.equal(normaliseInterest({ weight: 3, noticeRadius: 4 }).noticeRadius, 4);
    assert.equal(normaliseInterest({ weight: 3, noticeRadius: 500 }).noticeRadius, 100);
    assert.equal(normaliseInterest({ weight: 3, noticeRadius: 0.1 }).noticeRadius, 0.5);
    assert.equal(normaliseInterest({ weight: 3, noticeRadius: 'wide' }).noticeRadius, 24);
    assert.equal(normaliseInterest({ weight: 3, noticeRadius: 0 }).noticeRadius, 24);
});

function noticeRun(radius, itemAt) {
    const cfg = curiousCfg();
    if (radius !== undefined) cfg.npcs.finder.rec.interests.found_item.noticeRadius = radius;
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(30000);
    w.objs.push({ id: 'dropped_thing', ...itemAt, roomId: 'office', pickable: true, needsTag: 'found_item' });
    sys.step(60000);
    return sys.getLog().find(e => e.npc === 'finder' && e.ev === 'job_start' && e.item === 'dropped_thing');
}

test('noticeRadius: an item beyond the radius is left alone; one within it is fetched', () => {
    // finder stands at (120, 100); 4 tiles = 128 px
    assert.ok(!noticeRun(4, { x: 120 + 5 * TILE, y: 100 }), 'five tiles away: not seen');
    assert.ok(noticeRun(4, { x: 120 + 3 * TILE, y: 100 }), 'three tiles away: fetched');
});

test('noticeRadius default keeps a room-wide notice: an item 20 tiles off in the room is fetched', () => {
    assert.ok(noticeRun(undefined, { x: 120 + 20 * TILE, y: 100 }));
    assert.ok(!noticeRun(undefined, { x: 120 + 25 * TILE, y: 100 }), '25 tiles: beyond the default');
});

// ── SIMS-1 (OFFICE_LIFE_SIMS_BUILD_PLAN 5.1): needs NPCs under attack ─────────
// isAvailable (npc-needs.js) treats a hostile, knocked-out or hidden NPC as not
// present: it never starts a job, and a coupled partner of one does not wait for
// it. The live engine path (combat, KO drop, reload) is proved by
// scenarios/test_needs_attack and tools/playtest/needs-attack-probe.mjs.

test('an NPC hostile from the first tick never starts a job and logs blocked once', () => {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld(cfg);
    w.world.npcStatus = id => (id === 'clerk' ? { hostile: true } : {});
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(20 * 60000);
    const mine = sys.getLog().filter(e => e.npc === 'clerk');
    assert.equal(mine.filter(e => e.ev === 'blocked').length, 1, 'blocked logged exactly once');
    assert.equal(mine.some(e => e.ev === 'job_start'), false, 'never starts a job');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0, 'never moved');
    assert.equal(w.calls.emits.some(e => e.name === 'npc_left_post:clerk'), false, 'never left its post');
});

function coupledPairCfg() {
    // Two staff who share a capacity-2 kettle. Fran is the one knocked out.
    return {
        npcs: {
            fran: { pos: { x: 100, y: 100 }, rec: {
                id: 'fran', needsHome: { room: 'office', x: 3, y: 3 },
                needs: { caffeine: { decayPerMin: 8, urgentAt: 40, initial: 50, jitterPct: 0 } }
            } },
            gil: { pos: { x: 160, y: 100 }, rec: {
                id: 'gil', needsHome: { room: 'office', x: 5, y: 3 },
                needs: { caffeine: { decayPerMin: 8, urgentAt: 40, initial: 50, jitterPct: 0 } }
            } }
        },
        objects: [
            { id: 'kettle', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 40, useSeconds: 25, capacity: 2, chatter: 'coffee' } }
        ]
    };
}

test('a coupled partner of a knocked-out NPC takes its break alone', () => {
    const cfg = coupledPairCfg();
    const w = makeWorld(cfg);
    w.world.npcStatus = id => (id === 'fran' ? { ko: true } : {});
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(20 * 60000);
    const log = sys.getLog();
    // Fran is down: blocked once, never starts a job, never moves.
    const franLog = log.filter(e => e.npc === 'fran');
    assert.equal(franLog.filter(e => e.ev === 'blocked').length, 1, 'fran blocked once');
    assert.equal(franLog.some(e => e.ev === 'job_start'), false, 'fran never starts a job');
    assert.equal(w.calls.moves.filter(m => m.id === 'fran').length, 0, 'fran never moved');
    // Gil breaks alone: leaves its post and uses the kettle, with no partner to pair.
    assert.ok(w.calls.emits.some(e => e.name === 'npc_left_post:gil'), 'gil left its post');
    assert.ok(log.some(e => e.npc === 'gil' && e.ev === 'used'), 'gil used the kettle');
    assert.equal(log.some(e => e.ev === 'exchange_started'), false, 'no pairing with the downed partner');
});


// ── SIMS-2 (OLMP E6): an arrival counts only where the NPC is ───────────────────
// A needs arrival counts for a job phase or a walk home only when the NPC is within
// ARRIVAL_NEAR_PX (48) of that move's destination and echoes the move's id. A short path
// that ends before the cell (an async path answer, a path stopped at a door) is logged
// `arrival_far` and re-issued, not taken as "using the object from the doorway". These tests
// read the raw state (sys.states.get) because getState() strips job.dest and job.moveId.

// Drive the office clerk to a coffee goto_target on an arrive:false world (no auto-arrival).
function driveToGoto() {
    const cfg = office();
    cfg.npcs.clerk.rec.needs.caffeine.jitterPct = 0;
    const w = makeWorld({ ...cfg, arrive: false });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    while (sys.states.get('clerk').job?.phase !== 'goto_target' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    return { sys, w };
}

test('SIMS-2: a matching arrival 200 px off is re-issued, then counts when near', () => {
    const { sys, w } = driveToGoto();
    const job = sys.states.get('clerk').job;
    const dest = { ...job.dest }, id0 = job.moveId;
    const movesBefore = w.calls.moves.filter(m => m.id === 'clerk').length;
    w.pos.clerk.x = dest.x - 200; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x - 200, y: dest.y, moveId: id0 });
    sys.step(NEEDS_TICK_MS);
    assert.ok(sys.getLog().some(e => e.ev === 'arrival_far' && e.phase === 'goto_target'), 'far arrival logged');
    assert.equal(sys.states.get('clerk').job?.phase, 'goto_target', 'still heading there, not using');
    const id1 = sys.states.get('clerk').job.moveId;
    assert.notEqual(id1, id0, 'the move was re-issued with a fresh id');
    assert.ok(w.calls.moves.filter(m => m.id === 'clerk').length > movesBefore, 'a new move was issued');
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: id1 });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'counts when near');
});

test('SIMS-2: two far arrivals in one phase fail the job and walk it home', () => {
    const { sys, w } = driveToGoto();
    const dest = { ...sys.states.get('clerk').job.dest };
    const far = () => { const id = sys.states.get('clerk').job.moveId; w.pos.clerk.x = dest.x - 300; w.pos.clerk.y = dest.y; sys.onArrived('clerk', 'needs', { x: dest.x - 300, y: dest.y, moveId: id }); sys.step(NEEDS_TICK_MS); };
    far();
    assert.equal(sys.getState('clerk').mode, 'job', 'still on the job after one far arrival');
    far();
    assert.equal(sys.getLog().filter(e => e.ev === 'arrival_far').length, 2, 'two far arrivals');
    assert.ok(w.calls.emits.some(e => e.name === 'npc_job_failed:clerk' && e.data.reason === 'arrival_far'), 'job failed with arrival_far');
    assert.equal(sys.getState('clerk').mode, 'returning', 'walks home');
});

test('SIMS-2: an arrival echoing another move\'s id is ignored and dropped', () => {
    const { sys, w } = driveToGoto();
    const job = sys.states.get('clerk').job;
    const dest = { ...job.dest }, id0 = job.moveId;
    const movesBefore = w.calls.moves.filter(m => m.id === 'clerk').length;
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: id0 + 999 });
    sys.step(NEEDS_TICK_MS);
    assert.ok(sys.getLog().some(e => e.ev === 'arrival_ignored' && e.moveId === id0 + 999 && e.want === id0), 'logged arrival_ignored');
    assert.equal(sys.states.get('clerk').job?.phase, 'goto_target', 'not taken as arrived');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, movesBefore, 'no re-issue for a stale id');
});

test('SIMS-2: an arrival with no id counts when near (transitional) and is re-issued when far', () => {
    let { sys, w } = driveToGoto();
    let dest = { ...sys.states.get('clerk').job.dest };
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs');
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'no-id arrival near the cell counts');
    ({ sys, w } = driveToGoto());
    dest = { ...sys.states.get('clerk').job.dest };
    const id0 = sys.states.get('clerk').job.moveId;
    w.pos.clerk.x = dest.x - 200; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs');
    sys.step(NEEDS_TICK_MS);
    assert.ok(sys.getLog().some(e => e.ev === 'arrival_far'), 'no-id arrival far the cell is re-issued');
    assert.notEqual(sys.states.get('clerk').job.moveId, id0, 're-issued with a fresh id');
});

// Review R1 Design M1 (gap in minor 3): a no-id arrival during `using` (seating's chair fetch,
// which walks with goToAndStay and carries no move id) is dropped silently — no `arrival_far`, no
// re-issued move — so a fetch at a non-own work object is never cut short mid-use.
function driveToUsing() {
    const { sys, w } = driveToGoto();
    const dest = { ...sys.states.get('clerk').job.dest }, id = sys.states.get('clerk').job.moveId;
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: id });
    sys.step(NEEDS_TICK_MS);
    return { sys, w, dest };
}

test('SIMS-2 M1: a far no-id arrival during `using` is dropped, not logged far, and issues no move', () => {
    const { sys, w, dest } = driveToUsing();
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'in a use to start with');
    const movesBefore = w.calls.moves.filter(m => m.id === 'clerk').length;
    const logBefore = sys.getLog().length;
    // Seating fetch: goToAndStay owner needs, no move id, ending 120 px from the use cell.
    w.pos.clerk.x = dest.x - 120; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x - 120, y: dest.y });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'still using, not cut short');
    assert.ok(!sys.getLog().slice(logBefore).some(e => e.ev === 'arrival_far' || e.ev === 'arrival_ignored'), 'no arrival_far/arrival_ignored during using');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, movesBefore, 'no move was issued');
});

test('SIMS-2: an early arrival while returning never sets atPost; re-issued once, then left to _watchReturn', () => {
    const { sys, w } = driveToGoto();
    let dest = { ...sys.states.get('clerk').job.dest };
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: sys.states.get('clerk').job.moveId });
    sys.step(41000);
    assert.equal(sys.getState('clerk').mode, 'returning', 'walking home');
    const home = sys.states.get('clerk').home;
    const homeMoves = () => w.calls.moves.filter(m => m.id === 'clerk' && Math.round(m.x) === Math.round(home.x) && Math.round(m.y) === Math.round(home.y)).length;
    const issued0 = homeMoves();
    const far = () => { const id = sys.states.get('clerk').returnMoveId; w.pos.clerk.x = home.x + 300; w.pos.clerk.y = home.y; sys.onArrived('clerk', 'needs', { x: home.x + 300, y: home.y, moveId: id }); sys.step(NEEDS_TICK_MS); };
    far();
    assert.ok(sys.getLog().some(e => e.ev === 'arrival_far' && e.phase === 'returning'), 'far while returning logged');
    assert.equal(sys.getState('clerk').atPost, false, 'an early arrival does not set atPost');
    assert.equal(sys.getState('clerk').mode, 'returning', 'still returning');
    assert.equal(homeMoves(), issued0 + 1, 'the walk home is re-issued once');
    far();
    assert.equal(homeMoves(), issued0 + 1, 'a second far arrival is left to _watchReturn, not re-issued again');
    assert.equal(sys.getState('clerk').mode, 'returning', 'and the NPC never fails while returning');
});

test('SIMS-2: a seated own-desk work job still starts at once (own-post shortcut unchanged)', () => {
    const w = makeWorld(ownDeskCfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(NEEDS_TICK_MS);
    w.pos.clerk.x = 120; w.pos.clerk.y = 122;
    let guard = 0;
    while (sys.states.get('clerk').job?.phase !== 'using' && guard++ < 400) sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'own-desk work reaches using with no walk');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0, 'no move issued for an own-post job');
    assert.equal(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'arrival_far'), false, 'and no far arrival');
});

test('SIMS-2 (m3): a capacity-2 besideCell the path cannot reach fails after two far arrivals', () => {
    // Review R1 m3: no longer "by construction". Two real caffeine NPCs both head for a capacity-2
    // kettle. The first takes the approach cell, so the second is routed to a real geometric
    // besideCell offset from it (OLMP E8 makes no path check). In this flat stub the second user's
    // path ends at the approach cell, 200 px short of the besideCell, so its arrival is genuinely
    // far. Two far arrivals re-issue once then fail the job, where today it would use the kettle
    // from wherever the path ended.
    const cfg = office();
    cfg.objects = cfg.objects.filter(o => o.id !== 'coffee_machine');
    cfg.objects.push({ id: 'kettle', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 30, capacity: 2 } });
    cfg.npcs.clerk.rec.needs.caffeine = { decayPerMin: 8, urgentAt: 30, initial: 20, jitterPct: 0 };
    cfg.npcs.mate = { pos: { x: 500, y: 100 }, rec: { id: 'mate', needsHome: 'mate_pc', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 20, jitterPct: 0 } } } };
    cfg.objects.push({ id: 'mate_pc', x: 500, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } });
    const w = makeWorld({ ...cfg, arrive: false });
    // The live adapter's besideCell offsets from the approach cell; here that offset is where no
    // path ends, so the second user's walk stops short and its arrival is far.
    w.world.besideCell = cell => ({ x: cell.x + 200, y: cell.y });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    while (guard++ < 400 && !(sys.states.get('clerk').job?.phase === 'goto_target' && sys.states.get('mate').job?.phase === 'goto_target')) sys.step(NEEDS_TICK_MS);
    const mate = sys.states.get('mate');
    assert.equal(mate.job.phase, 'goto_target', 'both heading for the kettle');
    assert.deepEqual(mate.job.dest, { x: 500, y: 332 }, 'the second user is routed to the besideCell, off the approach cell (300,332)');
    const far = () => { const id = sys.states.get('mate').job?.moveId; w.pos.mate.x = 300; w.pos.mate.y = 332; sys.onArrived('mate', 'needs', { x: 300, y: 332, moveId: id }); sys.step(NEEDS_TICK_MS); };
    far();
    assert.equal(sys.getState('mate').mode, 'job', 'one far arrival only re-issues');
    far();
    assert.equal(sys.getLog().filter(e => e.ev === 'arrival_far' && e.npc === 'mate').length, 2, 'two far arrivals at the same besideCell');
    assert.ok(w.calls.emits.some(e => e.name === 'npc_job_failed:mate' && e.data.reason === 'arrival_far'), 'the job fails with arrival_far');
    assert.equal(sys.getState('mate').mode, 'returning', 'and walks home');
});

test('SIMS-2 (Design M1): a far no-id arrival during `using` is dropped, not cut short', () => {
    // Review R1 Major 1: seating's chair fetch walks with goToAndStay (owner 'needs', no move id)
    // while the NPC is already `using` a non-own work object. That arrival must be dropped silently,
    // as before the slice, never turned into `arrival_far` + a mid-use re-issue that drops the chair.
    const { sys, w } = driveToGoto();
    const dest = { ...sys.states.get('clerk').job.dest };
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: sys.states.get('clerk').job.moveId });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'the clerk is using the machine');
    const movesBefore = w.calls.moves.filter(m => m.id === 'clerk').length;
    // a seating-shaped fetch arrival 100 px away, with no move id, during `using`
    w.pos.clerk.x = dest.x + 100; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x + 100, y: dest.y });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.states.get('clerk').job?.phase, 'using', 'still using: the fetch arrival did not cut it short');
    assert.equal(sys.getLog().some(e => e.ev === 'arrival_far'), false, 'no arrival_far during using');
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, movesBefore, 'no needs move re-issued mid-use');
});

test('SIMS-2 (m2): the far guard is keyed by phase and cell: a new queue cell re-issues, the same cell fails', () => {
    // Review R1 m2 (both reviews): queue steps all share the `queued` phase. Keying the far guard by
    // phase alone would fail the job when two different queue cells each arrive far. Keyed by cell,
    // only a repeat far arrival at the *same* cell fails.
    const { sys } = driveToGoto();
    const s = sys.states.get('clerk');
    s.mode = 'job'; s.job.phase = 'queued';
    let reissues = 0, fails = 0;
    sys._moveForPhase = () => { reissues++; };
    sys._failJob = () => { fails++; };
    const farAt = cell => {
        s.job.dest = { ...cell };
        const p = { x: cell.x + 500, y: cell.y };
        return sys._acceptArrival(s, p, { x: p.x, y: p.y, moveId: s.job.moveId });
    };
    farAt({ x: 100, y: 100 });   // queue cell A, first far
    assert.equal(reissues, 1); assert.equal(fails, 0);
    farAt({ x: 100, y: 100 });   // the same cell again
    assert.equal(fails, 1, 'a repeat far arrival at the same cell fails the job');
    s.job._farKey = null; reissues = 0; fails = 0;
    farAt({ x: 100, y: 100 });   // cell A
    farAt({ x: 300, y: 164 });   // a genuine step to cell B
    assert.equal(reissues, 2, 'each new cell re-issues'); assert.equal(fails, 0, 'two different queue cells never fail');
});

test('SIMS-2 (m2): a freeze/unfreeze resets the far guard so the re-issued move is not failed at once', () => {
    const { sys, w } = driveToGoto();
    const s = sys.states.get('clerk');
    const dest = { ...s.job.dest };
    const farOnce = () => { const id = sys.states.get('clerk').job.moveId; w.pos.clerk.x = dest.x - 300; w.pos.clerk.y = dest.y; sys.onArrived('clerk', 'needs', { x: dest.x - 300, y: dest.y, moveId: id }); sys.step(NEEDS_TICK_MS); };
    farOnce();                                        // _farKey set, the move re-issued
    assert.equal(sys.getState('clerk').mode, 'job');
    w.setChat('clerk'); sys.step(NEEDS_TICK_MS);      // freeze (a conversation)
    assert.equal(sys.getState('clerk').mode, 'frozen');
    w.setChat(null); sys.step(NEEDS_TICK_MS);         // unfreeze: _moveForPhase, _farKey cleared
    assert.equal(sys.getState('clerk').mode, 'job', 'back on the job');
    farOnce();                                        // a far arrival after the freeze re-issues, not fails
    assert.equal(sys.getState('clerk').mode, 'job', 'not failed: the far guard was reset on the unfreeze re-issue');
});

test('SIMS-2: a stale-id arrival while returning is ignored, not taken as home', () => {
    const { sys, w } = driveToGoto();
    const dest = { ...sys.states.get('clerk').job.dest };
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: sys.states.get('clerk').job.moveId });
    sys.step(41000);
    assert.equal(sys.getState('clerk').mode, 'returning', 'walking home');
    const home = sys.states.get('clerk').home;
    const want = sys.states.get('clerk').returnMoveId;
    w.pos.clerk.x = home.x; w.pos.clerk.y = home.y;
    sys.onArrived('clerk', 'needs', { x: home.x, y: home.y, moveId: want + 999 });
    sys.step(NEEDS_TICK_MS);
    assert.ok(sys.getLog().some(e => e.ev === 'arrival_ignored' && e.want === want), 'the stale id is ignored');
    assert.equal(sys.getState('clerk').atPost, false, 'a stale arrival does not set atPost');
    assert.equal(sys.getState('clerk').mode, 'returning', 'still returning');
});

test('SIMS-2 (m1): an unreachable home logs arrival_far once per return; _watchReturn keeps re-planning', () => {
    const { sys, w } = driveToGoto();
    const dest = { ...sys.states.get('clerk').job.dest };
    w.pos.clerk.x = dest.x; w.pos.clerk.y = dest.y;
    sys.onArrived('clerk', 'needs', { x: dest.x, y: dest.y, moveId: sys.states.get('clerk').job.moveId });
    sys.step(41000);
    assert.equal(sys.getState('clerk').mode, 'returning');
    const home = sys.states.get('clerk').home;
    const farHome = () => { const id = sys.states.get('clerk').returnMoveId; w.pos.clerk.x = home.x + 300; w.pos.clerk.y = home.y; sys.onArrived('clerk', 'needs', { x: home.x + 300, y: home.y, moveId: id }); sys.step(NEEDS_TICK_MS); };
    farHome();                                        // first far: logs arrival_far, re-issues home
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);        // _watchReturn takes over (position unmoved)
    farHome();                                        // a second far after a watch re-issue: no new log
    farHome();
    const farLines = sys.getLog().filter(e => e.ev === 'arrival_far' && e.phase === 'returning');
    assert.equal(farLines.length, 1, 'arrival_far logged once per return, not once per _watchReturn cycle');
    assert.ok(sys.getLog().some(e => e.ev === 'return_resumed'), '_watchReturn re-planned the walk');
    assert.equal(sys.getState('clerk').mode, 'returning', 'and the returner never fails');
    // a later near arrival finally sets atPost
    const id = sys.states.get('clerk').returnMoveId;
    w.pos.clerk.x = home.x; w.pos.clerk.y = home.y;
    sys.onArrived('clerk', 'needs', { x: home.x, y: home.y, moveId: id });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').atPost, true, 'a near arrival home sets atPost');
});

// ── SIMS-3 (OFFICE_LIFE_SIMS_BUILD_PLAN 5.3): the still NPC (Neil) and the print command ──

/** A Neil: one need (caffeine) met only by its own declared mug (seat stand), nothing else. */
function stillMugCfg() {
    const cfg = office({ objects: [
        { id: 'own_mug', x: 100, y: 68, affordance: { satisfies: 'caffeine', restores: 30, useSeconds: 4, capacity: 1, seat: 'stand' } }
    ] });
    cfg.npcs.clerk.rec.needsHome = 'own_mug';
    cfg.npcs.clerk.rec.swivel = false;
    cfg.npcs.clerk.rec.needs = { caffeine: { decayPerMin: 6, urgentAt: 45, initial: 60, jitterPct: 0 } };
    cfg.objects = cfg.objects.filter(o => o.id !== 'clerk_pc' && o.id !== 'coffee_machine');
    return cfg;
}

test('an NPC whose only need target is its own post object never issues a move over 30 minutes', () => {
    const w = makeWorld(stillMugCfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(30 * 60000);
    const names = w.calls.emits.map(e => e.name);
    const sips = sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'used' && e.target === 'own_mug');
    assert.ok(sips.length >= 5, `sipped at the mug across 30 min (${sips.length})`);
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 0, 'no move was ever issued for the still NPC');
    assert.ok(!names.includes('npc_left_post:clerk'), 'never leaves its post');
    assert.ok(!names.includes('npc_returned_post:clerk'), 'never returns (it never left)');
    assert.equal(sys.getState('clerk').atPost, true, 'stays at its post');
});

/** The sims stub with the copier beat and a quiet Tom, so the print command is the only event. */
function printCmdWorld() {
    const w = makeSimsWorld();
    addCopierBeat(w);
    w.cfgNpcs.tom.rec.needs = { work: { decayPerMin: 0.1, urgentAt: 50, initial: 99 } };
    w.cfgNpcs.tom.rec.onUse = {};
    delete w.cfgNpcs.amara.rec.interests.printout;   // nobody files the forgotten slot
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.tick();
    const evs = (ev, npc) => sys.getLog().filter(e => e.ev === ev && (!npc || e.npc === npc));
    const print = opts => sys.control('tom', { print: { producer: 'office_copier', ...opts } });
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    return { w, sys, evs, print, ticks };
}

test('the print command with forget:true reveals a slot and schedules no fetch', () => {
    const p = printCmdWorld();
    assert.equal(p.print({ forget: true }), true);
    p.ticks(5 * 60 * 4);   // five needs-clock minutes
    assert.equal(p.w.globals.copier_out_a_shown, true, 'the page is on the tray');
    const res = p.evs('print_reserved', 'tom');
    assert.equal(res.length, 1);
    assert.equal(res[0].item, 'copier_out_a');
    assert.equal(res[0].forgotten, true, 'forget:true marks it forgotten');
    assert.equal(p.evs('print_fetched', 'tom').length, 0, 'no fetch errand is scheduled');
    assert.ok(!p.sys.getLog().some(e => e.npc === 'tom' && e.ev === 'job_start' && e.item === 'copier_out_a'), 'nobody walks to fetch it');
    assert.ok(p.sys._prints.has('copier_out_a'), 'the slot is owned (reserved), so Amara leaves it');
});

test('a forgotten command print is the oldest recyclable slot once the tray fills', () => {
    const p = printCmdWorld();
    for (let i = 0; i < 3; i++) { p.print({ forget: true }); p.ticks(2); }
    assert.deepEqual([...p.sys._prints.keys()].sort(), ['copier_out_a', 'copier_out_b', 'copier_out_c'], 'the three slots are full and forgotten');
    p.print({ forget: true });   // the tray is full: the next command recycles the oldest read-in-place slot
    const rec = p.evs('recycled', 'tom');
    assert.deepEqual(rec.map(e => e.item), ['copier_out_b'], 'the oldest read-in-place forgotten slot is reused, the takeable a is kept');
    assert.equal(p.w.globals.copier_out_a_shown, true, 'the takeable forgotten printout still waits on the tray');
});

// ── SIMS-4 (plan 5.4): the staff-room pair's couplings, cooldown and gated exchanges ──
// The staff room's patterns, proved on the stub: a coupling on the use start that targets only the
// named partner, a use started straight from another job still emitting npc_use_started, the
// chatterCooldownMin: 0.25 window, a needs.set on an NPC whose room is not loaded doing nothing, and
// Jodie's three gated exchanges resolving in reading order (exchange_job_cleared never before
// heard_exchange_job_called).

const EX_LINES = {
    exchange_waiting: [
        { speakerId: 'keith', text: 'Quiet on the radio tonight.' },
        { speakerId: 'jodie', text: 'Long shift when it is this slow.' },
        { speakerId: 'keith', text: 'A brew while we can, then.' }
    ],
    exchange_job_called: [
        { speakerId: 'jodie', text: 'That light in here still flickering?' },
        { speakerId: 'keith', text: "Neil's put it out on the radio." },
        { speakerId: 'keith', text: "Someone'll be up soon, Jodie." }
    ],
    exchange_job_cleared: [
        { speakerId: 'keith', text: 'They sorted that flickering light.' },
        { speakerId: 'jodie', text: 'About time. Hurt my eyes, that did.' },
        { speakerId: 'keith', text: 'Peace and quiet again. Lovely.' }
    ]
};
const JODIE_EXCHANGES = [
    { with: 'keith', knot: 'exchange_job_called', requireGlobal: { job_called: true } },
    { with: 'keith', knot: 'exchange_job_cleared', requireGlobal: { job_cleared: true, heard_exchange_job_called: true } },
    { with: 'keith', knot: 'exchange_waiting' }
];

/** keith and jodie in the staff room: a boiler (caffeine), a cooler (thirst) and a microwave (hunger). */
function staffRoom({ globals = {}, registerJodie = true, keithNeeds, jodieNeeds } = {}) {
    const objects = [
        { id: 'staff_boiler', x: 200, y: 100, affordance: { satisfies: 'caffeine', restores: 40, useSeconds: 30, capacity: 2, chatter: 'staff_tea' } },
        { id: 'staff_cooler', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 40, useSeconds: 25, capacity: 2, chatter: 'staff_water' } },
        { id: 'staff_microwave', x: 400, y: 100, affordance: { satisfies: 'hunger', restores: 60, useSeconds: 10 } }
    ];
    const npcs = {
        keith: { pos: { x: 120, y: 300 }, rec: {
            id: 'keith', needsHome: { room: 'office', x: 4, y: 10 }, needsSpeed: 80, chatterCooldownMin: 0.25,
            needs: keithNeeds || { caffeine: { decayPerMin: 1, urgentAt: 40, initial: 95, jitterPct: 0 }, thirst: { decayPerMin: 1, urgentAt: 40, initial: 95, jitterPct: 0 } },
            chatter: { staff_tea: ['Best brew on site, this.'], staff_water: ['Keeps you sharp, water.'] }
        } }
    };
    if (registerJodie) npcs.jodie = { pos: { x: 180, y: 300 }, rec: {
        id: 'jodie', needsHome: { room: 'office', x: 6, y: 10 }, needsSpeed: 80, chatterCooldownMin: 0.25,
        needs: jodieNeeds || { thirst: { decayPerMin: 1, urgentAt: 40, initial: 95, jitterPct: 0 }, caffeine: { decayPerMin: 1, urgentAt: 40, initial: 95, jitterPct: 0 } },
        chatter: { staff_tea: ['Cheers, Keith.'], staff_water: ['Parched, so I am.'] },
        exchanges: JODIE_EXCHANGES
    } };
    const w = makeWorld({ npcs, objects });
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.exchangeLines = (owner, knot) => EX_LINES[knot] || null;
    w.world.chatterConfig = () => ({ staff_tea: ['Best brew on site, this.'], staff_water: ['Keeps you sharp, water.'] });
    w.world.playerHears = () => ({ overheard: true, distance: 50 });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.register('keith');
    if (registerJodie) sys.register('jodie');
    return { w, sys, globals };
}

test('SIMS-4 coupling: a boiler use start carries its npcId; the coupling sets only the named partner need', () => {
    const { w, sys } = staffRoom();
    sys.states.get('keith').levels.caffeine = 10;   // keith goes for a brew
    while (!w.calls.emits.some(e => e.name === 'npc_use_started:staff_boiler') && sys.clockMs < 30000) sys.step(NEEDS_TICK_MS);
    const start = w.calls.emits.find(e => e.name === 'npc_use_started:staff_boiler');
    assert.ok(start, 'the boiler use start was emitted');
    assert.equal(start.data.npcId, 'keith', 'the start names the user');
    // Jodie's coupling: fires on keith's boiler start only (condition data.npcId === "keith").
    const coupling = ev => { if (ev.name === 'npc_use_started:staff_boiler' && ev.data.npcId === 'keith') sys.control('jodie', { set: { caffeine: 20 } }); };
    coupling(start);
    assert.equal(sys.states.get('jodie').levels.caffeine, 20, "the partner's named need is set");
    assert.ok(sys.states.get('jodie').levels.thirst > 90, 'no other need of the partner is set to 20');
    // Jodie's own boiler start, or a microwave start, must not bring her through this coupling.
    coupling({ name: 'npc_use_started:staff_boiler', data: { npcId: 'jodie' } });   // condition false
    coupling({ name: 'npc_use_started:staff_microwave', data: { npcId: 'keith' } }); // wrong pattern
    assert.equal(sys.states.get('jodie').levels.caffeine, 20, 'neither fired the coupling again');
});

test('SIMS-4: every break emits npc_use_started, so a second coupled break still brings the partner', () => {
    // Two urgent needs: Keith takes a brew, then eats. Each use start emits npc_use_started, which
    // is the event the couplings listen on, so no break is silent to the partner.
    const { w, sys } = staffRoom({
        keithNeeds: {
            caffeine: { decayPerMin: 1, urgentAt: 40, initial: 10, jitterPct: 0 },
            hunger: { decayPerMin: 1, urgentAt: 40, initial: 10, jitterPct: 0 }
        }
    });
    while (sys.clockMs < 120000 && new Set(w.calls.emits.filter(e => e.name.startsWith('npc_use_started:')).map(e => e.name)).size < 2) sys.step(NEEDS_TICK_MS);
    const starts = w.calls.emits.filter(e => e.name.startsWith('npc_use_started:') && e.data.npcId === 'keith');
    const objs = starts.map(e => e.name.split(':')[1]);
    assert.ok(objs.includes('staff_boiler') && objs.includes('staff_microwave'), `both uses emitted a start: ${objs.join(', ')}`);
    assert.ok(starts.every(e => e.data.npcId === 'keith' && typeof e.data.need === 'string'), 'each start names its user and need');
});

test('SIMS-4: chatterCooldownMin 0.25 allows a pool line 15 s of needs clock after the last', () => {
    const { sys } = staffRoom();
    const s = sys.states.get('keith');
    s.chatterQuietUntil = 0; sys._speechUntil = 0;
    const first = sys._pickBark(s, 'staff_tea', {});
    assert.ok(first && first.line, 'a pool line is available');
    assert.equal(s.chatterQuietUntil, sys.clockMs + 15000, 'the 0.25 min cooldown is 15 s');
    const during = sys._pickBark(s, 'staff_tea', {});
    assert.ok(during && during.picture && !during.line, 'inside the cooldown it falls to a picture');
    sys.clockMs += 15000;   // 15 s of needs clock later
    const after = sys._pickBark(s, 'staff_tea', {});
    assert.ok(after && after.line, 'a pool line is allowed again 15 s on');
});

test('SIMS-4: a needs.set on an NPC whose room is not loaded does nothing', () => {
    const { sys } = staffRoom({ registerJodie: false });   // the staff room never loaded Jodie
    assert.equal(sys.states.get('jodie'), undefined, 'Jodie is not registered');
    assert.equal(sys.control('jodie', { set: { thirst: 20 } }), false, 'the set is a no-op on an unregistered NPC');
    assert.equal(sys.states.get('jodie'), undefined, 'and creates no state');
});

test('SIMS-4 exchange gates: the ungated waiting exchange plays first, then job_called once its global holds', () => {
    let g = {};
    let r = staffRoom({ globals: g });
    assert.equal(r.sys._findExchange({ npcId: 'jodie' }, { npcId: 'keith' }).knot, 'exchange_waiting', 'no global set: the ungated knot');
    g = { job_called: true };
    r = staffRoom({ globals: g });
    assert.equal(r.sys._findExchange({ npcId: 'jodie' }, { npcId: 'keith' }).knot, 'exchange_job_called', 'job_called held: its gated knot sorts first');
});

test('SIMS-4 exchange gates: exchange_job_cleared never plays before heard_exchange_job_called', () => {
    // waiting is marked heard so only the job knots are in play.
    let g = { job_cleared: true, heard_exchange_waiting: true };
    let r = staffRoom({ globals: g });
    assert.equal(r.sys._findExchange({ npcId: 'jodie' }, { npcId: 'keith' }), null, 'job_cleared alone opens nothing');
    g = { job_cleared: true, heard_exchange_job_called: true, heard_exchange_waiting: true };
    r = staffRoom({ globals: g });
    assert.equal(r.sys._findExchange({ npcId: 'jodie' }, { npcId: 'keith' }).knot, 'exchange_job_cleared', 'both keys held: the clearance exchange opens');
});
