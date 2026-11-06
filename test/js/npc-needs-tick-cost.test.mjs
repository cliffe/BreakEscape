// Tick-cost hygiene in systems/npc-needs.js (docs/achitechture/OFFICE_LIFE_PLAN.md 2.0, slice 1):
// no object scan for an NPC with nothing urgent, one object list per tick, reachability cached per
// tick, and a 1 s select back-off for an NPC whose search found nothing.
// The office() fixture's byte-identity checks are in npc-needs.test.mjs; this file uses the
// test_needs_sims fixture (fixtures/needs-sims-world.mjs) and small purpose-built worlds.
// Run with: bin/test-js test/js/npc-needs-tick-cost.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { runSimsDay, makeSimsWorld, SIMS_SEED, simsApproachCell, RECORDED_CELLS } from './fixtures/needs-sims-world.mjs';

const LEGACY = { tickCache: false, selectBackoff: false };
const CACHE_ONLY = { selectBackoff: false };
const logOf = sys => JSON.stringify(sys.getLog());

// ── the sims fixture itself ──────────────────────────────────────────────────

test('sims fixture: approachCell honours useFrom like the live adapter, else the recorded live cell', () => {
    const w = makeSimsWorld();
    const obj = id => w.objs.find(o => o.id === id);
    // Live game 541: office_coffee (useFrom -1,0) -> (236,276); kitchen_coffee (0,-1) -> (-116,244);
    // fridge (0,1) -> (-268,124); lounge_sofa (0,-1) -> (540,244)
    assert.deepEqual(simsApproachCell(obj('office_coffee')), { x: 236, y: 276 });
    assert.deepEqual(simsApproachCell(obj('kitchen_coffee')), { x: -212, y: 244 }, 'game 585, tile (3,8)');
    assert.deepEqual(simsApproachCell(obj('lounge_kettle')), { x: 388, y: 108 }, 'game 585');
    assert.deepEqual(simsApproachCell(obj('fridge')), { x: -268, y: 124 });
    assert.deepEqual(simsApproachCell(obj('lounge_sofa')), { x: 540, y: 244 });
    assert.deepEqual(simsApproachCell(obj('tom_pc')), RECORDED_CELLS.tom_pc);
    // Rooms other than the office are not there until their door opens
    assert.equal(w.world.getObject('fridge'), null);
    assert.deepEqual(w.world.roomIds(), ['office']);
});

test('sims fixture: the scripted day reproduces the showcase beats', () => {
    const { sys, w } = runSimsDay(NPCNeedsSystem, { opts: LEGACY });
    const log = sys.getLog();
    const used = log.filter(e => e.ev === 'used').map(e => `${e.npc}:${e.need || e.tag}:${e.target}`);
    for (const beat of ['amara:caffeine:office_coffee', 'tom:caffeine:office_coffee', 'sanjay:work:sanjay_pc',
        'grace:dirty_mugs:washing_up_tray', 'amara:post:amara_pc', 'grace:rest:lounge_sofa', 'tom:hunger:microwave',
        'grace:thirst:water_cooler', 'sanjay:social:water_cooler', 'rosa:social:water_cooler', 'tom:work:tom_pc']) {
        assert.ok(used.includes(beat), `${beat} missing from ${used.join(', ')}`);
    }
    // Contention: Tom goes urgent while Amara holds the only loaded station and starts as she finishes
    const amaraDone = log.find(e => e.npc === 'amara' && e.ev === 'used' && e.target === 'office_coffee').t;
    const tomStart = log.find(e => e.npc === 'tom' && e.ev === 'job_start' && e.need === 'caffeine').t;
    assert.equal(tomStart, amaraDone);
    assert.equal(w.calls.globals.amara_opened_parcel, true);
});

test('sims fixture, slice 2a: own PCs only, the lounge for Rosa and Grace, the memo sends one of Tom and Amara to the kitchen', () => {
    const w = makeSimsWorld();
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const at = (tick, fn) => { while (sys.tickCount < tick) sys.tick(); fn(); };
    at(360, () => { w.loadRoom(sys, 'kitchen'); w.loadRoom(sys, 'lounge'); });
    // The deadline memo: its object_interacted mappings set both caffeine levels to 20 (game 585 did this at tick 641)
    const memo = () => { sys.control('tom', { set: { caffeine: 20 } }); sys.control('amara', { set: { caffeine: 20 } }); };
    at(640, memo);
    at(1280, memo);
    while (sys.tickCount < 6 * 240) sys.tick();
    const log = sys.getLog();
    const lounge = new Set(['lounge_kettle', 'lounge_sofa', 'rosa_laptop']);
    for (const id of ['amara', 'tom', 'sanjay']) {
        assert.ok(!log.some(e => e.npc === id && ['job_start', 'used'].includes(e.ev) && lounge.has(e.target)), `${id} chose a lounge target`);
    }
    // Everyone works at their own PC
    const homes = { amara: 'amara_pc', tom: 'tom_pc', sanjay: 'sanjay_pc' };
    const work = log.filter(e => e.ev === 'used' && e.need === 'work');
    assert.ok(work.length >= 3 && work.every(e => e.target === homes[e.npc]), work.map(e => `${e.npc}:${e.target}`).join(', '));
    // After each memo: one at the office station, the other in the kitchen, the kettle skipped although nearer
    const caf = log.filter(e => e.ev === 'used' && e.need === 'caffeine' && e.t > 640 && ['tom', 'amara'].includes(e.npc)).map(e => e.target);
    assert.ok(caf.includes('kitchen_coffee') && caf.includes('office_coffee'), caf.join(', '));
    const leashed = log.filter(e => e.ev === 'leashed' && e.need === 'caffeine' && e.chose === 'kitchen_coffee');
    assert.ok(leashed.length >= 1 && leashed.every(e => e.skipped.includes('lounge_kettle')));
    // Rosa makes her coffee at her own kettle
    assert.ok(log.some(e => e.npc === 'rosa' && e.ev === 'used' && e.target === 'lounge_kettle'));
});

// ── steps 1-3: same decisions, less work ─────────────────────────────────────

test('steps 1-3 keep the sims decision log byte-identical and cut the object scans', () => {
    const a = runSimsDay(NPCNeedsSystem, { opts: LEGACY });
    const b = runSimsDay(NPCNeedsSystem, { opts: CACHE_ONLY });
    assert.equal(logOf(b.sys), logOf(a.sys));
    assert.equal(b.w.searches, a.w.searches, 'reachability answers are only cached within a tick');
    assert.ok(b.sys.stats.objectScans * 3 < a.sys.stats.objectScans,
        `scans ${a.sys.stats.objectScans} -> ${b.sys.stats.objectScans}`);
    // One scan per tick at most, and none on a tick where nobody has anything to choose
    assert.ok(b.sys.stats.objectScans <= b.sys.stats.ticks + 40, 'about one scan per tick (plus re-scans after a pickup or an emit)');
});

test('step 1: an NPC with nothing urgent and no interests never scans the objects', () => {
    const w = makeWorld({
        npcs: { calm: { pos: { x: 0, y: 0 }, rec: { id: 'calm', needs: { caffeine: { decayPerMin: 1, urgentAt: 10, initial: 100 } } } } },
        objects: [{ id: 'm', x: 50, y: 50, affordance: { satisfies: 'caffeine', restores: 50 } }]
    });
    let scans = 0;
    const list = w.world.listObjects;
    w.world.listObjects = () => { scans++; return list(); };
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(60000);
    assert.equal(scans, 0);
});

test('step 3: reachability is asked once per NPC and object per tick', () => {
    // The home object is checked first, then the same object again among the nearest candidates
    const w = makeWorld({
        npcs: { clerk: { pos: { x: 100, y: 100 }, rec: { id: 'clerk', needsHome: 'home_m', needs: { caffeine: { decayPerMin: 60, urgentAt: 50, initial: 40 } } } } },
        objects: [{ id: 'home_m', x: 100, y: 68, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }]
    });
    const asked = [];
    w.world.reachable = (id, o) => { asked.push(`${w.calls.moves.length}:${o.id}`); return false; };
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true, ...CACHE_ONLY });
    w.attach(sys);
    sys.registerAll();
    sys.tick();
    assert.equal(asked.length, 1, `asked ${asked}`);
    const w2 = makeWorld({
        npcs: { clerk: { pos: { x: 100, y: 100 }, rec: { id: 'clerk', needsHome: 'home_m', needs: { caffeine: { decayPerMin: 60, urgentAt: 50, initial: 40 } } } } },
        objects: [{ id: 'home_m', x: 100, y: 68, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }]
    });
    let legacyAsked = 0;
    w2.world.reachable = () => { legacyAsked++; return false; };
    const legacy = new NPCNeedsSystem(w2.world, { seed: 1, manualClock: true, ...LEGACY });
    w2.attach(legacy);
    legacy.registerAll();
    legacy.tick();
    assert.equal(legacyAsked, 2, 'without the cache the home object is path-checked twice');
});

// ── step 4: select back-off ──────────────────────────────────────────────────

function unreachableWorld() {
    const w = makeWorld({
        npcs: { clerk: { pos: { x: 100, y: 100 }, rec: { id: 'clerk', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 20 } } } } },
        objects: [{ id: 'locked_machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }]
    });
    w.searches = 0;
    w.world.reachable = () => { w.searches++; return false; };
    return w;
}

test('step 4: a free but unreachable target is path-checked at most once a second', () => {
    const w = unreachableWorld();
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(60000);
    assert.ok(w.searches <= 61, `searches in 60 s: ${w.searches}`);
    assert.ok(w.searches >= 59, `still re-checks every second: ${w.searches}`);
    assert.equal(w.calls.moves.length, 0);
    const legacyW = unreachableWorld();
    const legacy = new NPCNeedsSystem(legacyW.world, { seed: 1, manualClock: true, ...LEGACY });
    legacyW.attach(legacy);
    legacy.registerAll();
    legacy.step(60000);
    assert.equal(legacyW.searches, 240, 'without back-off: every tick');
});

test('step 4: an NPC waiting on a claimed target does no search and keeps the 250 ms check', () => {
    const w = makeWorld({
        npcs: {
            amy: { pos: { x: 100, y: 100 }, rec: { id: 'amy', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 20 } } } },
            ben: { pos: { x: 500, y: 100 }, rec: { id: 'ben', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 20 } } } }
        },
        objects: [{ id: 'machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 30 } }]
    });
    let searches = 0;
    w.world.reachable = () => { searches++; return true; };
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(20000);
    assert.equal(searches, 1, 'only amy, once, when she picked the machine');
    assert.equal(sys.stats.backoffs, 0);
});

/**
 * Contention with back-off: ben's only free option is unreachable, so his selection searches,
 * finds nothing and backs off; the reachable machine is held by amy.
 */
function contentionRun(opts) {
    const w = makeWorld({
        npcs: {
            amy: { pos: { x: 100, y: 100 }, rec: { id: 'amy', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 20 } } } },
            ben: { pos: { x: 500, y: 100 }, rec: { id: 'ben', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 25 } } } }
        },
        objects: [
            { id: 'machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 7.3 } },
            { id: 'broken_machine', x: 520, y: 120, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 5 } }
        ]
    });
    w.world.reachable = (id, o) => o.id !== 'broken_machine';
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true, ...opts });
    w.attach(sys);
    sys.registerAll();
    sys.step(60000);
    const log = sys.getLog();
    const freed = log.find(e => e.npc === 'amy' && e.ev === 'used').t;
    const benStart = log.find(e => e.npc === 'ben' && e.ev === 'job_start' && e.target === 'machine').t;
    return { sys, freed, benStart };
}

test('step 4: a backed-off NPC still starts within four ticks of the target freeing', () => {
    const now = contentionRun({});
    const before = contentionRun(LEGACY);
    assert.ok(now.sys.stats.backoffs > 0, 'ben did back off while he waited');
    assert.ok(now.benStart - now.freed <= 4, `ben started ${now.benStart - now.freed} ticks after the machine freed`);
    assert.ok(Math.abs(now.benStart - before.benStart) <= 4);
    // Completion clears every back-off, so here the start tick does not move at all
    assert.equal(now.benStart, before.benStart);
});

test('step 4: a room load clears the back-offs (Grace sees the washing-up tray at once)', () => {
    // Before the kitchen loads, Grace can reach the office mugs but has nowhere to take them
    const w = makeSimsWorld();
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    while (sys.tickCount < 101) sys.tick();
    assert.ok(sys.states.get('grace').selectRetryAt > sys.tickCount, 'grace is backed off');
    const searchesBefore = w.searches;
    assert.ok(searchesBefore <= 30, `grace path-checked the mugs ${searchesBefore} times in 100 ticks`);
    w.loadRoom(sys, 'kitchen');
    sys.tick();
    const start = sys.getLog().find(e => e.npc === 'grace' && e.ev === 'job_start');
    assert.ok(start && start.t === sys.tickCount && start.item === 'office_mugs', JSON.stringify(start));
});

test('step 4 on the sims day: the same beats, every job start within four ticks of before', () => {
    const a = runSimsDay(NPCNeedsSystem, { opts: LEGACY, minutes: 8 });
    const c = runSimsDay(NPCNeedsSystem, { minutes: 8 });
    const starts = sys => sys.getLog().filter(e => e.ev === 'job_start').map(e => ({ k: `${e.npc}:${e.need || e.tag}:${e.target}`, t: e.t }));
    const sa = starts(a.sys), sc = starts(c.sys);
    assert.deepEqual(sc.map(s => s.k), sa.map(s => s.k));
    sc.forEach((s, i) => assert.ok(Math.abs(s.t - sa[i].t) <= 4, `${s.k}: ${sa[i].t} -> ${s.t}`));
    assert.ok(c.w.searches * 2 < a.w.searches, `path searches ${a.w.searches} -> ${c.w.searches}`);
});

// ── micro-benchmark ──────────────────────────────────────────────────────────

/** 20 NPCs, 200 objects (a quarter unreachable), four needs each. */
function benchWorld() {
    const needsNames = ['caffeine', 'hunger', 'thirst', 'work'];
    const npcs = {};
    for (let i = 0; i < 20; i++) {
        const id = `npc${String(i).padStart(2, '0')}`;
        const needs = {};
        needsNames.forEach((n, k) => { needs[n] = { decayPerMin: 6 + ((i + k) % 5) * 3, urgentAt: 40, initial: 50 + ((i * 7 + k * 13) % 50), jitterPct: 10 }; });
        npcs[id] = { pos: { x: (i % 5) * 120, y: Math.floor(i / 5) * 120 }, rec: { id, needs, interests: i % 4 === 0 ? { litter: 1 } : undefined } };
    }
    const objects = [];
    for (let j = 0; j < 200; j++) {
        objects.push({
            id: `obj${String(j).padStart(3, '0')}`, x: (j * 37) % 640, y: (j * 53) % 480,
            affordance: { satisfies: needsNames[j % 4], restores: 60, useSeconds: 10 + (j % 7) }
        });
    }
    const w = makeWorld({ npcs, objects });
    w.searches = 0;
    w.world.reachable = (id, o) => { w.searches++; return Number(o.id.slice(3)) % 4 !== 1; };
    return w;
}

function bench(opts) {
    const w = benchWorld();
    const sys = new NPCNeedsSystem(w.world, { seed: 'bench', manualClock: true, ...opts });
    w.attach(sys);
    sys.registerAll();
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) sys.tick();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    return { ms, scans: sys.stats.objectScans, searches: w.searches, log: logOf(sys) };
}

test('micro-benchmark: 20 NPCs x 200 objects x 1,000 ticks within budget, and far less work than before', () => {
    const before = bench(LEGACY);
    const cached = bench(CACHE_ONLY);
    const now = bench({});
    console.log(`[bench] before ${before.ms.toFixed(0)} ms, ${before.scans} scans, ${before.searches} searches | ` +
        `steps 1-3 ${cached.ms.toFixed(0)} ms, ${cached.scans} scans | all ${now.ms.toFixed(0)} ms, ${now.scans} scans, ${now.searches} searches`);
    assert.equal(cached.log, before.log, 'steps 1-3 leave the log unchanged');
    assert.ok(now.scans <= 1000 + 200, `at most about one scan per tick: ${now.scans}`);
    assert.ok(now.scans * 5 < before.scans, `${before.scans} -> ${now.scans}`);
    assert.ok(now.searches <= before.searches);
    // Budget: 1,000 ticks (250 s of needs time) in under 2 s even on a loaded test machine
    assert.ok(now.ms < 2000, `took ${now.ms} ms`);
    assert.ok(NEEDS_TICK_MS === 250);
});
