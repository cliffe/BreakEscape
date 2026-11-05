// NPC needs system (systems/npc-needs.js) acceptance tests on a stub world and
// the manual clock. Spec: docs/achitechture/NPC_NEEDS_SYSTEM.md section 12.
// The live engine path is proved separately by the headless playtest of
// scenarios/test_npc_needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, needTiming, NEEDS_TICK_MS, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

const TILE = 32;

/** A flat world: moves complete at once (arrival queued), no walls. */
function makeWorld({ npcs, objects, arrive = true }) {
    const pos = {};
    for (const [id, n] of Object.entries(npcs)) pos[id] = { ...n.pos, roomId: n.room || 'office' };
    const objs = objects.map(o => ({ roomId: 'office', pickable: true, ...o }));
    const calls = { moves: [], emits: [], globals: {}, consumed: [], dropped: [], cancels: [] };
    let sys = null;
    let chatWith = null;
    const world = {
        elapsedMs: () => 0,
        isVmActive: () => false,
        npcIds: () => Object.keys(npcs),
        getNpc: id => npcs[id]?.rec || null,
        npcPos: id => (pos[id] ? { ...pos[id] } : null),
        npcStatus: () => ({}),
        inChatWith: id => chatWith === id,
        listObjects: () => objs.filter(o => o.roomId),
        getObject: id => objs.find(o => o.id === id && o.roomId) || null,
        approachCell: o => ({ x: o.x, y: o.y + TILE }),
        tileToWorld: (r, x, y) => ({ x: x * TILE, y: y * TILE }),
        speedFor: () => 80,
        moveTo(id, x, y, speed, opts) {
            calls.moves.push({ id, x, y, yieldToPlayer: opts.yieldToPlayer });
            if (arrive) { pos[id].x = x; pos[id].y = y; sys.onArrived(id, 'needs'); }
        },
        cancelMove: id => calls.cancels.push(id),
        faceTo() {},
        pickUp(npcId, itemId) {
            const o = objs.find(x => x.id === itemId);
            if (!o || !o.roomId) return false;
            o.roomId = null; // gone from the world
            return true;
        },
        consumeHeld: (npcId, itemId) => calls.consumed.push({ npcId, itemId }),
        dropHeld: (npcId, itemId) => calls.dropped.push({ npcId, itemId }),
        emit: (name, data) => calls.emits.push({ name, data }),
        setGlobal: (name, v) => { calls.globals[name] = v; }
    };
    return {
        world, calls, objs, pos,
        attach(s) { sys = s; },
        setChat(id) { chatWith = id; }
    };
}

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
