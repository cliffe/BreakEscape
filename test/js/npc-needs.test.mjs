// NPC needs system (systems/npc-needs.js) acceptance tests on a stub world and
// the manual clock. Spec: docs/achitechture/NPC_NEEDS_SYSTEM.md section 12.
// The live engine path is proved separately by the headless playtest of
// scenarios/test_npc_needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NPCNeedsSystem, needTiming, NEEDS_TICK_MS, RETURN_YIELD_MS, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

import { makeWorld } from './fixtures/needs-stub-world.mjs';

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

test('private objects: owners from affordance.owners, screenOwner and needsHome; capacity 2 serves two owners', () => {
    const coolerAt = (id, x, aff) => ({ id, roomId: 'office', x, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 30, private: true, ...aff } });
    const npc = (id, x) => ({ pos: { x, y: 100 }, room: 'office', rec: { id, roomId: 'office', needs: thirsty, needsHome: `${id}_desk` } });
    const desk = (id, x) => ({ id: `${id}_desk`, roomId: 'office', x, y: 68, affordance: { useSeconds: 5 } });
    // needsHome rule: a private "desk" that satisfies thirst serves only its owner
    let r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 200) },
        objects: [{ ...desk('amy', 100), affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5, private: true } }, coolerAt('pub', 280, { private: false })]
    });
    assert.ok(r.used('amy').includes('amy_desk'));
    assert.ok(!r.used('ben').includes('amy_desk'));
    // screenOwner
    r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 200) },
        objects: [desk('amy', 100), desk('ben', 200), { ...coolerAt('kettle', 150), screenOwner: 'ben' }, coolerAt('pub', 280, { private: false })]
    });
    assert.ok(r.used('ben').includes('kettle') && !r.used('amy').includes('kettle'));
    // owners list with capacity 2: both owners together, the third waits or goes elsewhere
    r = leashRun({
        npcs: { amy: npc('amy', 100), ben: npc('ben', 110), cat: npc('cat', 120) },
        objects: [desk('amy', 100), desk('ben', 110), desk('cat', 120), coolerAt('shared', 130, { owners: ['amy', 'ben'], capacity: 2 }), coolerAt('pub', 280, { private: false })]
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
            { id: 'tom_pc', roomId: 'office', x: 200, y: 68, affordance: { accepts: ['post'], private: true, useSeconds: 5 } },
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
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5, private: true, owners: ['ben'] } },
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
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5, private: true, owners: ['ben'] } }
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
        { id: 'ben_kettle', roomId: 'office', x: 130, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5, private: true, owners: ['ben'] } }
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
