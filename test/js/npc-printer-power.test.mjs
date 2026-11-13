// Office life slice 22 (OFFICE_LIFE_PLAN 12.12): printer power. revealOutput (and the print
// command's producer) may list printers in preference order; a print goes to the first that is on
// (affordance.offWhen does not hold) and has a free or recyclable slot; with none on nothing prints
// (print_blocked, npc_print_blocked:<npcId>, a grumble_printer_off line or the blocked picture). The
// owner's errand walks to whichever printer printed, with a longer expectedAwayMs; a print on a tray
// stays when its printer is switched off, and an errand already walking there still collects; a
// copier that is a need source turns back through 18a. Validator fixtures for the list.
// Run with: bin/test-js test/js/npc-printer-power.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem, requiredGlobalsHold, PICTURE_CHATTER, printerList } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeSimsWorld, addCopierBeat, SIMS_SEED } from './fixtures/needs-sims-world.mjs';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = [true, false];
const BOTH = ['office_copier', 'kitchen_copier'];

/**
 * The sims stub with the copier beat, a switchable office copier (copier_off) and a second copier
 * in the kitchen (kitchen_copier_off) with two slots. Tom prints at his PC to `list`; his other
 * needs are slowed so that his day is quiet. Sanjay does not print.
 */
function powerWorld({ tickCache = true, list = BOTH, habit = null, power = {}, kitchen = true, chatter, seed = SIMS_SEED } = {}) {
    const w = makeSimsWorld();
    addCopierBeat(w);
    const office = w.objs.find(o => o.id === 'office_copier');
    office.affordance = { ...office.affordance, offWhen: 'copier_off' };
    w.objs.push({ id: 'kitchen_copier', room: 'kitchen', x: -150, y: 200, affordance: { useSeconds: 8, capacity: 1, useFrom: { dx: 0, dy: 1 }, offWhen: 'kitchen_copier_off' } });
    for (const id of ['kitchen_out_a', 'kitchen_out_b']) {
        const o = { id, room: 'kitchen', x: -150, y: 186, needsTag: 'printout', slot: true, pickable: false, outputOf: 'kitchen_copier', global: `${id}_shown`, takeable: true, home: { roomId: 'kitchen', x: -150, y: 186 } };
        w.objs.push(o);
        w.slots[id] = o;
    }
    const tom = w.cfgNpcs.tom.rec;
    tom.needs = { caffeine: { decayPerMin: 0.1, urgentAt: 40, initial: 99 }, hunger: { decayPerMin: 0.1, urgentAt: 40, initial: 99 }, work: { decayPerMin: 0.1, urgentAt: 50, initial: 99 } };
    tom.onUse = { ...tom.onUse, tom_pc: { revealOutput: list } };
    if (habit) tom.printHabit = habit;
    w.cfgNpcs.sanjay.rec.onUse = {};
    delete w.cfgNpcs.amara.rec.interests.printout;
    const globals = { copier_off: false, kitchen_copier_off: false, ...power };
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerAtPost = () => ({ distance: null, inMinigame: false });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.playerHears = () => ({ overheard: false, distance: null });
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true, tickCache });
    w.attach(sys);
    sys.registerAll();
    if (kitchen) w.loadRoom(sys, 'kitchen');
    sys.tick();
    const log = () => sys.getLog();
    const evs = (ev, npc) => log().filter(e => e.ev === ev && (!npc || e.npc === npc));
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const until = (fn, max = 4000) => { for (let i = 0; i < max && !fn(); i++) sys.tick(); return fn(); };
    const set = (name, v) => { globals[name] = v; sys.onGlobalChanged(name); };
    // Tom sits down to work now: one need use of tom_pc, which prints (chance 1)
    const work = () => { sys.control('tom', { set: { work: 0 } }); };
    return { w, sys, log, evs, emitted, until, set, work, globals };
}

const revealedTargets = p => p.evs('revealed', 'tom').map(e => [e.target, e.item || e.reason]);

// ── where the print goes ─────────────────────────────────────────────────────────

test('printerList: a string is a list of one; junk entries are dropped', () => {
    assert.deepEqual(printerList('a'), ['a']);
    assert.deepEqual(printerList(['a', '', 3, 'b']), ['a', 'b']);
    assert.deepEqual(printerList(''), []);
    assert.deepEqual(printerList(undefined), []);
    assert.deepEqual(PICTURE_CHATTER.grumble_printer_off, ['blocked']);
});

test('list order: both on, the first listed prints; the other order prints to the kitchen', () => {
    for (const tickCache of CACHE) {
        const p = powerWorld({ tickCache });
        p.work();
        assert.ok(p.until(() => p.evs('revealed', 'tom').length), `printed (cache ${tickCache})`);
        assert.deepEqual(revealedTargets(p), [['office_copier', 'copier_out_a']]);
        assert.equal(p.evs('revealed', 'tom')[0].skipped, undefined, 'nothing skipped, no field');
        const q = powerWorld({ tickCache, list: ['kitchen_copier', 'office_copier'] });
        q.work();
        q.until(() => q.evs('revealed', 'tom').length);
        assert.deepEqual(revealedTargets(q), [['kitchen_copier', 'kitchen_out_a']]);
    }
});

test('fallback: the office copier off, the print goes to the kitchen and the log says what was skipped', () => {
    for (const tickCache of CACHE) {
        const p = powerWorld({ tickCache, power: { copier_off: true } });
        p.work();
        p.until(() => p.evs('using', 'tom').length);
        assert.equal(p.sys.getState('tom').job.prints, true, 'the printing icon: the kitchen copier is on and has a slot');
        p.until(() => p.evs('revealed', 'tom').length);
        assert.deepEqual(revealedTargets(p), [['kitchen_copier', 'kitchen_out_a']]);
        assert.deepEqual(p.evs('revealed', 'tom')[0].skipped, ['office_copier']);
        assert.equal(p.w.globals.kitchen_out_a_shown, true);
        assert.notEqual(p.w.globals.copier_out_a_shown, true);
    }
});

test('fallback past a full pool: every office slot gone, the kitchen copier prints; both full, the first that is on gets the cosmetic copy', () => {
    const p = powerWorld();
    for (const id of ['copier_out_a', 'copier_out_b', 'copier_out_c']) p.w.take(id);
    p.work();
    p.until(() => p.evs('revealed', 'tom').length);
    assert.deepEqual(revealedTargets(p), [['kitchen_copier', 'kitchen_out_a']]);
    const q = powerWorld();
    for (const id of ['copier_out_a', 'copier_out_b', 'copier_out_c', 'kitchen_out_a', 'kitchen_out_b']) q.w.take(id);
    q.work();
    q.until(() => q.evs('using', 'tom').length);
    assert.equal(q.sys.getState('tom').job.prints, false, 'no printing icon with no slot anywhere');
    q.until(() => q.evs('revealed', 'tom').length);
    assert.deepEqual(revealedTargets(q), [['office_copier', 'no_free_slot']], 'today\'s full-pool path at the first printer that is on');
});

test('none on: nothing prints, print_blocked and npc_print_blocked, a grumble_printer_off line, no printing icon', () => {
    for (const tickCache of CACHE) {
        const chatter = { grumble_printer_off: ['The printers are all off.'] };
        const p = powerWorld({ tickCache, power: { copier_off: true, kitchen_copier_off: true }, chatter });
        p.work();
        p.until(() => p.evs('using', 'tom').length);
        assert.equal(p.sys.getState('tom').job.prints, false, 'no printing icon');
        p.until(() => p.evs('print_blocked', 'tom').length);
        assert.equal(p.evs('revealed', 'tom').length, 0);
        const b = p.evs('print_blocked', 'tom')[0];
        assert.equal(b.target, 'tom_pc');
        assert.deepEqual(b.producers, BOTH);
        const e = p.emitted('npc_print_blocked:tom');
        assert.equal(e.length, 1);
        assert.deepEqual({ ...e[0].data, playerNearby: undefined, playerDistance: undefined },
            { npcId: 'tom', objectId: 'tom_pc', producers: BOTH, viaCommand: false, playerNearby: undefined, playerDistance: undefined });
        const say = p.sys.states.get('tom').saying;
        assert.equal(say.topic, 'grumble_printer_off');
        assert.equal(say.line, 'The printers are all off.');
        assert.ok(!p.log().some(e2 => e2.ev === 'print_reserved'));
    }
});

test('none on with no lines: the blocked picture', () => {
    const p = powerWorld({ power: { copier_off: true, kitchen_copier_off: true }, chatter: {} });
    p.work();
    p.until(() => p.evs('print_blocked', 'tom').length);
    const say = p.sys.states.get('tom').saying;
    assert.equal(say.topic, 'grumble_printer_off');
    assert.equal(say.line, null);
    assert.equal(say.picture, 'blocked');
});

test('a string hook keeps its behaviour: on prints, off is blocked (a list of one)', () => {
    const p = powerWorld({ list: 'office_copier' });
    p.work();
    p.until(() => p.evs('revealed', 'tom').length);
    assert.deepEqual(revealedTargets(p), [['office_copier', 'copier_out_a']]);
    const q = powerWorld({ list: 'office_copier', power: { copier_off: true } });
    q.work();
    q.until(() => q.evs('print_blocked', 'tom').length);
    assert.deepEqual(q.evs('print_blocked', 'tom')[0].producers, ['office_copier']);
    assert.equal(q.evs('revealed', 'tom').length, 0);
});

test('a printer in a room not loaded is off in a list: the office copier off and the kitchen shut, the print is blocked', () => {
    const p = powerWorld({ power: { copier_off: true }, kitchen: false });
    p.work();
    p.until(() => p.evs('print_blocked', 'tom').length);
    assert.equal(p.evs('revealed', 'tom').length, 0);
});

// ── the errand and the away time ──────────────────────────────────────────────────

function errandRun({ tickCache = true, power = {} } = {}) {
    const p = powerWorld({ tickCache, power, habit: { fetchAfterSeconds: [5, 5], forgetChance: 0 } });
    p.work();
    p.until(() => p.evs('print_fetched', 'tom').length, 6000);
    const res = p.evs('print_reserved', 'tom')[0];
    const start = p.log().find(e => e.npc === 'tom' && e.ev === 'job_start' && e.item === res.item);
    const left = p.emitted('npc_left_post:tom').filter(e => e.data.targetId === 'tom_pc');
    const fetched = p.emitted('npc_print_fetched:tom');
    return { p, res, start, left, fetched };
}

test('the errand walks to whichever printer printed, and its expectedAwayMs is longer for the kitchen copier', () => {
    for (const tickCache of CACHE) {
        const a = errandRun({ tickCache });
        const b = errandRun({ tickCache, power: { copier_off: true } });
        assert.equal(a.res.target, 'office_copier');
        assert.equal(b.res.target, 'kitchen_copier');
        assert.equal(b.start.item, 'kitchen_out_a', `the errand fetches the kitchen print (cache ${tickCache})`);
        assert.equal(a.left.length, 1);
        assert.equal(b.left.length, 1);
        const ma = a.left[0].data.expectedAwayMs, mb = b.left[0].data.expectedAwayMs;
        assert.ok(mb > ma + 3000, `kitchen ${mb} ms against office ${ma} ms`);
        assert.equal(b.fetched.length, 1);
        assert.equal(b.fetched[0].data.producerId, 'kitchen_copier');
        assert.equal(b.fetched[0].data.slotId, 'kitchen_out_a');
        assert.equal(a.fetched[0].data.producerId, 'office_copier');
        assert.equal(b.p.w.calls.placed.at(-1).itemId, 'kitchen_out_a');
    }
});

test('switching off later: a print on the tray stays, and an errand already walking there still collects', () => {
    const p = powerWorld({ habit: { fetchAfterSeconds: [5, 5], forgetChance: 0 } });
    p.work();
    p.until(() => p.evs('print_reserved', 'tom').length);
    p.set('copier_off', true);
    p.sys.tick();
    assert.equal(p.w.globals.copier_out_a_shown, true, 'still on the tray');
    assert.equal(p.w.slots.copier_out_a.pickable, true);
    // Back on, then off again once he is on his way to it
    p.set('copier_off', false);
    p.until(() => { const j = p.sys.states.get('tom').job; return j && j.errand && j.phase === 'goto_item'; });
    p.set('copier_off', true);
    p.until(() => p.evs('print_fetched', 'tom').length, 4000);
    assert.equal(p.evs('print_fetched', 'tom').length, 1, 'collected');
    assert.equal(p.evs('turned_back', 'tom').length, 0, 'no off turn-back for a carry');
});

test('the print command takes a list: office off, it prints to the kitchen; none on, print_blocked with viaCommand and no grumble', () => {
    const p = powerWorld({ power: { copier_off: true }, habit: {} });
    assert.equal(p.sys.control('tom', { print: { producer: BOTH, fetchAfterSeconds: [5, 10], forget: false } }), true);
    assert.deepEqual(revealedTargets(p), [['kitchen_copier', 'kitchen_out_a']]);
    assert.equal(p.evs('print_command', 'tom')[0].target, 'kitchen_copier');
    assert.equal(p.sys.control('tom', { print: BOTH }), true, 'a bare list is a producer list');
    const q = powerWorld({ power: { copier_off: true, kitchen_copier_off: true }, habit: {}, chatter: { grumble_printer_off: ['Off again.'] } });
    q.sys.control('tom', { print: { producer: BOTH, forget: true } });
    const e = q.emitted('npc_print_blocked:tom');
    assert.equal(e.length, 1);
    assert.equal(e[0].data.viaCommand, true);
    assert.equal(e[0].data.objectId, null);
    assert.equal(q.sys.states.get('tom').saying, null, 'no grumble: he is not at his desk');
    assert.equal(q.sys.control('tom', { print: [] }), false);
});

test('determinism: the same power state gives the same log twice', () => {
    const run = () => {
        const p = powerWorld({ power: { copier_off: true }, habit: { fetchAfterSeconds: [20, 60], forgetChance: 0.5 } });
        for (let i = 0; i < 6; i++) { p.work(); p.until(() => p.sys.states.get('tom').mode === 'idle' && !p.sys.states.get('tom').job, 3000); p.until(() => false, 200); }
        return JSON.stringify(p.log());
    };
    const a = run();
    assert.ok(a.includes('kitchen_copier'));
    assert.equal(run(), a);
});

// ── a copier as a need source (18a, nothing new) ───────────────────────────────────

test('a copier that satisfies a need turns its walker back when switched off (18a)', () => {
    const T = 32;
    const globals = { copier_off: false };
    const w = makeWorld({ npcs: { tom: { pos: { x: 100, y: 500 }, rec: { id: 'tom', needsHome: { room: 'office', x: 100 / T, y: 500 / T }, needs: { work: { decayPerMin: 1, urgentAt: 50, initial: 90 } } } } },
        objects: [{ id: 'copier', x: 700, y: 100, affordance: { satisfies: 'work', restores: 60, useSeconds: 8, offWhen: 'copier_off' } }] });
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const sys = new NPCNeedsSystem(w.world, { seed: 5, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.control('tom', { set: { work: 10 } });
    sys.tick();
    assert.equal(sys.getState('tom').job.targetId, 'copier');
    globals.copier_off = true;
    sys.onGlobalChanged('copier_off');
    sys.tick();
    const tb = sys.getLog().filter(e => e.ev === 'turned_back');
    assert.deepEqual(tb.map(e => [e.npc, e.reason, e.target]), [['tom', 'off', 'copier']]);
});

// ── validator ───────────────────────────────────────────────────────────────────

function validate(npcPatch, { mappings = [], kitchenPrivate = false } = {}) {
    const scen = {
        scenario_brief: 'printer power fixture', startRoom: 'office', globalVariables: { out_a_shown: false, out_k_shown: false, copier_off: false },
        rooms: {
            office: { type: 'room_office', connections: { west: 'kitchen' }, objects: [
                { type: 'pc', id: 'tom_pc', name: 'PC', takeable: false, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } },
                { type: 'photocopier1', id: 'office_copier', name: 'Copier', takeable: false, affordance: { offWhen: 'copier_off' } },
                { type: 'wall_socket1', id: 'socket', name: 'Wall socket', takeable: false, triggerOnInteract: [{ type: 'set_global', key: 'copier_off', value: true }] },
                { type: 'notes1', id: 'out_a', name: 'Printout', takeable: true, readable: true, text: 'x', outputOf: 'office_copier', revealOnGlobal: 'out_a_shown' }
            ], npcs: [{ id: 'tom', displayName: 'Tom', npcType: 'person', position: { x: 2, y: 2 }, spriteSheet: 'hacker', needsHome: 'tom_pc',
                needs: { work: { decayPerMin: 8, urgentAt: 50, initial: 80 } }, eventMappings: mappings, ...npcPatch }] },
            kitchen: { type: 'room_break', connections: { east: 'office' }, ...(kitchenPrivate ? { needsPrivateTo: ['rosa'] } : {}), objects: [
                { type: 'photocopier1', id: 'kitchen_copier', name: 'Kitchen Copier', takeable: false },
                { type: 'photocopier1', id: 'bare_copier', name: 'Bare Copier', takeable: false },
                { type: 'notes1', id: 'out_k', name: 'Printout', takeable: true, readable: true, text: 'x', outputOf: 'kitchen_copier', revealOnGlobal: 'out_k_shown' }
            ] }
        }
    };
    const dir = mkdtempSync(join(tmpdir(), 'power-'));
    const f = join(dir, 'scenario.json');
    writeFileSync(f, JSON.stringify(scen));
    const script = `require 'json'; require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}; puts ValidateNpcNeeds.check(JSON.parse(File.read(ARGV[0])))`;
    const r = spawnSync('ruby', ['-e', script, f], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
}

test('validator: revealOutput and print lists', () => {
    const lines = out => out.split('\n').filter(l => /ERROR|WARNING/.test(l) && /revealOutput|print/i.test(l)).join('\n');
    const ok = validate({ onUse: { tom_pc: { revealOutput: BOTH } }, printHabit: {} }, { mappings: [{ eventPattern: 'x', needs: { print: { producer: BOTH, forget: true } } }] });
    assert.equal(lines(ok), '', ok);
    assert.match(validate({ onUse: { tom_pc: { revealOutput: ['office_copier', 'nope'] } } }), /ERROR.*revealOutput names 'nope'/);
    assert.match(validate({ onUse: { tom_pc: { revealOutput: [] } } }), /ERROR.*revealOutput is an empty list/);
    assert.match(validate({ onUse: { tom_pc: { revealOutput: ['office_copier', 'office_copier'] } } }), /WARNING.*lists a producer twice/);
    assert.match(validate({ onUse: { tom_pc: { revealOutput: ['office_copier', 'bare_copier'] } } }), /WARNING.*'bare_copier', but no object has outputOf/);
    assert.match(validate({}, { mappings: [{ eventPattern: 'x', needs: { print: ['office_copier', 'nope'] } }] }), /ERROR.*print producer 'nope'/);
    assert.match(validate({}, { mappings: [{ eventPattern: 'x', needs: { print: { producer: [] } } }] }), /ERROR.*needs.print must be/);
    // The owner cannot get into the kitchen (private to Rosa): its prints there are never fetched
    assert.match(validate({ onUse: { tom_pc: { revealOutput: BOTH } }, printHabit: {} }, { kitchenPrivate: true }), /WARNING.*prints to 'kitchen_copier' in room 'kitchen'/);
    assert.doesNotMatch(validate({ onUse: { tom_pc: { revealOutput: BOTH } }, printHabit: {} }, { kitchenPrivate: true }), /prints to 'office_copier'/);
});
