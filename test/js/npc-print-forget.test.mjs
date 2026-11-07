// Office life slice 17 (OFFICE_LIFE_PLAN 12.3): print and forget, and the print-job lever.
// Only a need use prints (never a delivery); a hook's `chance` is rolled at job start and the
// printing icon follows the roll and the slot check; a print by an NPC with a printHabit (or from a
// `print` command) is owned: reserved from other NPCs' interests, fetched after a seeded due time or
// forgotten; the fetch errand runs from idle (the wider _select guard: Tom has no interests),
// completes on arrival without `using`, and its leg back is the return (guarded caught check); a full
// pool recycles the oldest forgotten slot (read-in-place first); uncollected, gone and fetched events;
// the validator's printHabit checks. Most run with the tick cache on and off.
// Run with: bin/test-js test/js/npc-print-forget.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeSimsWorld, addCopierBeat, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TPS = 4;   // needs ticks per second
const CACHE = [true, false];

/**
 * The sims stub with the copier beat. Tom prints at his PC (hook `chance`) with `habit`; Sanjay's
 * hook is kept only with `sanjayPrints`. Tom's other needs are slowed so that his day is quiet.
 */
function printWorld({ tickCache = true, habit = null, chance, sanjayPrints = false, extraSlots = false, uncollected, seed = SIMS_SEED, amaraInterest = true } = {}) {
    const w = makeSimsWorld();
    addCopierBeat(w, { extraSlots, uncollectedAfterSeconds: uncollected });
    const tom = w.cfgNpcs.tom.rec;
    tom.needs = { caffeine: { decayPerMin: 0.1, urgentAt: 40, initial: 99 }, hunger: { decayPerMin: 0.1, urgentAt: 40, initial: 99 }, work: { decayPerMin: 0.1, urgentAt: 50, initial: 99 } };
    tom.onUse = { ...tom.onUse, tom_pc: { revealOutput: 'office_copier', ...(chance !== undefined ? { chance } : {}) } };
    if (habit) tom.printHabit = habit;
    if (!sanjayPrints) w.cfgNpcs.sanjay.rec.onUse = {};
    if (!amaraInterest) delete w.cfgNpcs.amara.rec.interests.printout;
    w.player = { distance: null, inMinigame: false };
    w.world.playerAtPost = () => ({ ...w.player });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true, tickCache });
    w.attach(sys);
    sys.registerAll();
    sys.tick();   // the first tick files every shown slot (stow on sight), as a load does
    const log = () => sys.getLog();
    const evs = (ev, npc) => log().filter(e => e.ev === ev && (!npc || e.npc === npc));
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const ticks = (n, tap) => { for (let i = 0; i < n; i++) { sys.tick(); tap?.(); } };
    const until = (fn, max = 4000) => { for (let i = 0; i < max && !fn(); i++) sys.tick(); return fn(); };
    const print = (opts = {}) => sys.control('tom', { print: { producer: 'office_copier', ...opts } });
    return { w, sys, log, evs, emitted, ticks, until, print };
}

// ── the hook: need uses only, chance at job start ───────────────────────────────

test('chance: about the authored share of 200 need uses print, the same for a seed, and the icon matches the roll', () => {
    const run = () => {
        const p = printWorld({ chance: 0.4 });
        const jobs = [];
        let started = null;
        const tap = () => {
            const s = p.sys.states.get('tom');
            if (s.job && s.job.kind === 'use' && s.job.targetId === 'tom_pc' && s.job !== started) {
                started = s.job;
                jobs.push({ printTo: s.job.printTo || null, icon: !!p.sys.getState('tom').job.prints });
            }
        };
        let uses = 0;
        while (uses < 200) {
            const s = p.sys.states.get('tom');
            if (!s.job && s.mode === 'idle') p.sys.control('tom', { set: { work: 0 } });
            p.sys.tick(); tap();
            uses = p.evs('used', 'tom').filter(e => e.target === 'tom_pc').length;
        }
        const printed = p.evs('revealed', 'tom').length;
        return { printed, jobs: jobs.slice(0, 200), revealed: p.evs('revealed', 'tom').map(e => e.item || e.reason) };
    };
    const a = run();
    assert.ok(a.printed >= 60 && a.printed <= 100, `share near 0.4 of 200 (${a.printed})`);
    assert.equal(a.jobs.filter(j => j.printTo).length, a.printed, 'every rolled print printed, and nothing else did');
    // No printHabit: nothing is reserved, Amara files Tom's prints, so a slot is always free or the
    // icon is honest about a full pool. A job that will not print never shows the icon.
    assert.ok(a.jobs.every(j => j.printTo || !j.icon), 'no icon for a job whose roll said no');
    assert.ok(a.jobs.some(j => j.printTo && j.icon));
    const b = run();
    assert.deepEqual(b.revealed, a.revealed, 'same seed, same prints');
});

test('a delivery to the hooked object prints nothing; a need use there does', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache });
        p.w.cfgNpcs.amara.rec.onUse = { amara_pc: { revealOutput: 'office_copier' } };
        p.w.drop('parcel', 'post', 200, 200);
        p.until(() => p.evs('used', 'amara').some(e => e.tag === 'post'));
        assert.equal(p.evs('revealed', 'amara').length, 0, `no print on the parcel delivery (cache ${tickCache})`);
        p.until(() => p.evs('used', 'amara').some(e => e.need === 'work'), 20000);
        assert.ok(p.evs('revealed', 'amara').length >= 1, 'her work use prints');
    }
});

// ── ownership and the errand ─────────────────────────────────────────────────────

test('the print command with forget false: due inside the window, fetched from idle, placed on his desk with no using phase', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: { fetchAfterSeconds: [30, 120], forgetChance: 1 } });
        p.ticks(4);
        assert.equal(p.print({ fetchAfterSeconds: [5, 10], forget: false }), true);
        const res = p.evs('print_reserved', 'tom')[0];
        assert.equal(res.item, 'copier_out_a');
        assert.equal(res.forgotten, false, 'the command overrides forgetChance 1');
        assert.ok(res.dueMs >= 5000 && res.dueMs <= 10000, `due ${res.dueMs}`);
        p.until(() => p.evs('print_fetched', 'tom').length, 400);
        const start = p.log().find(e => e.npc === 'tom' && e.ev === 'job_start' && e.item === 'copier_out_a');
        assert.ok(start, `errand started (cache ${tickCache})`);
        assert.ok(start.t >= res.t + res.dueMs / 250, 'not before its due time');
        const used = p.evs('used', 'tom').find(e => e.item === 'copier_out_a');
        assert.equal(used.target, 'tom_pc');
        assert.equal(used.outcome, 'place');
        assert.ok(!p.log().some(e => e.npc === 'tom' && e.ev === 'using' && e.t >= start.t && e.t <= used.t), 'no using phase');
        assert.ok(!p.evs('job_failed', 'tom').length, 'never item_gone on its own reserved slot');
        const fetched = p.emitted('npc_print_fetched:tom');
        assert.deepEqual(fetched.map(e => e.data), [{ npcId: 'tom', slotId: 'copier_out_a', producerId: 'office_copier', viaCommand: true }]);
        // npc_used:tom_pc rides along, with no need (the showcase's work mappings check data.need)
        assert.ok(p.emitted('npc_used:tom_pc').some(e => e.data.need === null && e.data.tag === 'printout'));
        // The way back is the return: npc_returned_post right after
        p.ticks(3);
        const back = p.evs('returned_post', 'tom').find(e => e.t >= used.t);
        assert.ok(back && back.t <= used.t + 2, 'returned_post on the next tick or so');
        // The estimate leaves out tom_pc's 10 s dwell
        const left = p.emitted('npc_left_post:tom').at(-1);
        assert.ok(left.data.expectedAwayMs < 10000, `expectedAwayMs ${left.data.expectedAwayMs}`);
        assert.equal(p.sys._prints.size, 0);
    }
});

test('a forgotten print gets no errand, is reserved from Amara, and is uncollected once', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: { forgetChance: 0 }, uncollected: 60 });
        p.print({ forget: true });
        p.ticks(5 * 60 * TPS);
        assert.ok(!p.log().some(e => e.ev === 'job_start' && e.item === 'copier_out_a'), `nobody fetched it (cache ${tickCache})`);
        assert.equal(p.w.globals.copier_out_a_shown, true, 'still on the tray');
        const unc = p.emitted('npc_print_uncollected:tom');
        assert.equal(unc.length, 1, 'once');
        assert.equal(unc[0].data.slotId, 'copier_out_a');
        assert.equal(unc[0].data.forgotten, true);
        assert.equal(unc[0].data.ageMs, 60000);
    }
});

test('Amara takes an unowned print and skips a reserved one; shareAfterSeconds releases it', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: { forgetChance: 1 }, sanjayPrints: true });
        p.print();   // forgotten by the habit: copier_out_a, Tom's
        p.until(() => p.evs('used', 'amara').some(e => e.tag === 'printout'), 8 * 60 * TPS);
        const used = p.evs('used', 'amara').find(e => e.tag === 'printout');
        assert.ok(used, `Amara delivered Sanjay's print (cache ${tickCache})`);
        assert.notEqual(used.item, 'copier_out_a');
        assert.ok(!p.log().some(e => e.npc === 'amara' && e.ev === 'job_start' && e.item === 'copier_out_a'));
        // Sanjay has no printHabit: his prints are never reserved
        assert.ok(!p.evs('print_reserved', 'sanjay').length);

        const q = printWorld({ tickCache, habit: { forgetChance: 1, shareAfterSeconds: 30 } });
        q.print();
        q.until(() => q.log().some(e => e.npc === 'amara' && e.ev === 'job_start' && e.item === 'copier_out_a'), 3 * 60 * TPS);
        const shared = q.evs('print_shared', 'tom')[0];
        const took = q.log().find(e => e.npc === 'amara' && e.ev === 'job_start' && e.item === 'copier_out_a');
        const made = q.evs('print_reserved', 'tom')[0];
        assert.ok(shared && took && took.t >= shared.t && shared.t - made.t === 30 * TPS, 'released at 30 s, then taken');
    }
});

test('taken before the due time: npc_print_gone at the due time and no walk', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: {} });
        p.print({ fetchAfterSeconds: [20, 20] });
        p.ticks(4);
        p.w.take('copier_out_a');
        p.ticks(16 * TPS);
        assert.equal(p.emitted('npc_print_gone:tom').length, 0, 'not before the due time');
        p.ticks(5 * TPS);
        const gone = p.emitted('npc_print_gone:tom');
        assert.equal(gone.length, 1, `gone once (cache ${tickCache})`);
        assert.equal(gone[0].data.slotId, 'copier_out_a');
        assert.ok(!p.log().some(e => e.npc === 'tom' && e.ev === 'job_start' && e.item === 'copier_out_a'));
        assert.ok(!p.emitted('npc_print_uncollected:tom').length, 'a taken print is not uncollected');
    }
});

test('a print by an NPC with no printHabit stays unowned; a hook print by one with a habit is owned and fetched', () => {
    const p = printWorld({ habit: { fetchAfterSeconds: [1, 2] } });
    p.sys.control('tom', { set: { work: 0 } });
    p.until(() => p.evs('print_fetched', 'tom').length, 4000);
    assert.equal(p.evs('print_reserved', 'tom').length, 1);
    assert.equal(p.emitted('npc_print_fetched:tom')[0].data.viaCommand, false);
    const q = printWorld({ habit: null });
    q.sys.control('tom', { set: { work: 0 } });
    q.until(() => q.evs('revealed', 'tom').length, 4000);
    assert.equal(q.evs('print_reserved').length, 0);
    assert.equal(q.w.slots.copier_out_a.printedBy, null, 'the stamp is cleared on an unowned reveal');
});

test('a fresh system after a reload has no reservations and files the shown slot', () => {
    const p = printWorld({ habit: { forgetChance: 1 } });
    p.print();
    assert.equal(p.sys._prints.size, 1);
    const sys2 = new NPCNeedsSystem(p.w.world, { seed: SIMS_SEED, manualClock: true });
    p.w.attach(sys2);
    sys2.registerAll();
    sys2.tick();
    assert.equal(sys2._prints.size, 0);
    assert.equal(p.w.globals.copier_out_a_shown, false, 'stowed on sight');
});

// ── the full pool ────────────────────────────────────────────────────────────────

test('a full pool with a forgotten print recycles it (read-in-place first) and the lever print gets its errand', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: {}, amaraInterest: false });
        for (let i = 0; i < 3; i++) { p.print({ forget: true }); p.ticks(2); }
        assert.deepEqual([...p.sys._prints.keys()].sort(), ['copier_out_a', 'copier_out_b', 'copier_out_c']);
        p.print({ fetchAfterSeconds: [1, 1], forget: false });
        const rec = p.evs('recycled', 'tom');
        assert.deepEqual(rec.map(e => e.item), ['copier_out_b'], `oldest read-in-place first (cache ${tickCache})`);
        assert.equal(p.evs('print_reserved', 'tom').at(-1).item, 'copier_out_b');
        p.until(() => p.evs('print_fetched', 'tom').length, 400);
        assert.equal(p.emitted('npc_print_fetched:tom')[0].data.slotId, 'copier_out_b');
        // b is on Tom's desk now; c (read in place) goes before the takeable a, every time
        p.print({ forget: true });
        p.print({ forget: true });
        assert.deepEqual(p.evs('recycled', 'tom').map(e => e.item), ['copier_out_b', 'copier_out_c', 'copier_out_c']);
        assert.equal(p.w.globals.copier_out_a_shown, true, 'the takeable forgotten printout still waits');
    }
});

test('a full pool with nothing forgotten: a cosmetic copy, print_no_slot, no errand and no printing icon', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: {}, amaraInterest: false });
        for (let i = 0; i < 3; i++) p.print({ fetchAfterSeconds: [3000, 3000] });
        const reserved = p.evs('print_reserved').length;
        p.sys.control('tom', { set: { work: 0 } });
        p.ticks(1);
        assert.equal(p.sys.getState('tom').job?.targetId, 'tom_pc');
        assert.equal(p.sys.getState('tom').job.prints, false, `no icon (cache ${tickCache})`);
        p.until(() => p.evs('used', 'tom').some(e => e.target === 'tom_pc'), 400);
        assert.equal(p.evs('print_no_slot', 'tom').length, 1);
        assert.equal(p.w.calls.cosmetics.length, 1);
        assert.equal(p.evs('print_reserved').length, reserved, 'the copy is nobody\'s');
    }
});

test('an unowned print with a full pool recycles the oldest forgotten slot, and Amara may take it', () => {
    const p = printWorld({ habit: {}, sanjayPrints: true });
    for (let i = 0; i < 3; i++) { p.print({ forget: true }); p.ticks(1); }
    p.sys.control('sanjay', { set: { work: 0 } });
    p.until(() => p.evs('revealed', 'sanjay').length, 2000);
    assert.equal(p.evs('recycled', 'sanjay')[0].item, 'copier_out_b');
    assert.equal(p.evs('revealed', 'sanjay')[0].item, 'copier_out_b');
    assert.ok(!p.sys._prints.has('copier_out_b'), 'unowned now');
    p.until(() => p.log().some(e => e.npc === 'amara' && e.ev === 'job_start' && e.item === 'copier_out_b'), 2000);
    assert.ok(p.log().some(e => e.npc === 'amara' && e.ev === 'job_start' && e.item === 'copier_out_b'));
});

// ── the return leg ───────────────────────────────────────────────────────────────

test('caught on the errand back: once, only on the leg back, and returned_post before the next work use', () => {
    for (const tickCache of CACHE) {
        // The player at the desk only while Tom walks out: nothing
        const p = printWorld({ tickCache, habit: {} });
        p.print({ fetchAfterSeconds: [1, 1] });
        p.until(() => p.evs('print_fetched', 'tom').length, 400, );
        let q = printWorld({ tickCache, habit: {} });
        q.print({ fetchAfterSeconds: [1, 1] });
        const tap = () => { const j = q.sys.states.get('tom').job; q.w.player.inMinigame = !!(j?.errand && !j.carrying); };
        for (let i = 0; i < 400 && !q.evs('print_fetched', 'tom').length; i++) { q.sys.tick(); tap(); }
        assert.ok(q.evs('print_fetched', 'tom').length);
        assert.equal(q.emitted('npc_caught_at_post:tom').length, 0, `not on the way out (cache ${tickCache})`);
        // In Tom's minigame throughout: exactly one, from the leg back
        q = printWorld({ tickCache, habit: {} });
        q.w.player.inMinigame = true;
        q.print({ fetchAfterSeconds: [1, 1] });
        q.until(() => q.evs('print_fetched', 'tom').length, 400);
        q.ticks(20);
        const caught = q.emitted('npc_caught_at_post:tom');
        assert.equal(caught.length, 1, 'one errand, one caught');
        assert.equal(caught[0].data.inMinigame, true);
        const c = q.evs('caught_at_post', 'tom')[0], f = q.evs('print_fetched', 'tom')[0];
        assert.ok(c.t <= f.t, 'caught on the leg, before the arrival');
        q.sys.control('tom', { set: { work: 0 } });
        q.until(() => q.evs('used', 'tom').some(e => e.need === 'work'), 400);
        const back = q.evs('returned_post', 'tom').find(e => e.t >= f.t);
        const work = q.evs('used', 'tom').find(e => e.need === 'work');
        assert.ok(back && back.t < work.t, 'returned_post before the next work use');
    }
});

test('an errand started from returning emits caught at most once across the walk home and the errand', () => {
    for (const tickCache of CACHE) {
        const p = printWorld({ tickCache, habit: {} });
        // Walks home do not arrive by themselves, so Tom is still `returning` when the errand is due
        const base = p.w.world.moveTo;
        let holdHome = false;
        p.w.world.moveTo = (id, x, y, ...rest) => {
            const home = p.sys.states.get('tom').home;
            if (id === 'tom' && holdHome && Math.hypot(x - home.x, y - home.y) < 2) { p.w.calls.moves.push({ id, x, y }); return; }
            return base(id, x, y, ...rest);
        };
        p.w.player.inMinigame = true;
        holdHome = true;
        p.sys.control('tom', { set: { caffeine: 0 } });
        p.until(() => p.evs('used', 'tom').some(e => e.need === 'caffeine'), 2000);
        p.ticks(2);
        assert.equal(p.sys.states.get('tom').mode, 'returning');
        assert.equal(p.emitted('npc_caught_at_post:tom').length, 1, 'caught on the walk home');
        p.print({ fetchAfterSeconds: [0, 0] });
        p.ticks(1);
        holdHome = false;
        p.until(() => p.evs('print_fetched', 'tom').length, 400);
        p.ticks(10);
        const start = p.log().find(e => e.npc === 'tom' && e.ev === 'job_start' && e.item === 'copier_out_a');
        assert.ok(start, `the errand ran (cache ${tickCache})`);
        assert.ok(!p.evs('returned_post', 'tom').some(e => e.t < start.t), 'it started from returning');
        assert.equal(p.emitted('npc_caught_at_post:tom').length, 1);
    }
});

test('a lab-shaped carry to an own needsHome keeps its dwell (useSeconds 6), with no errand', () => {
    const p = printWorld({ habit: {} });
    const pc = p.w.objs.find(o => o.id === 'amara_pc');
    pc.affordance = { ...pc.affordance, useSeconds: 6 };
    p.w.drop('parcel', 'post', 200, 200);
    p.until(() => p.evs('used', 'amara').some(e => e.tag === 'post'), 2000);
    const used = p.evs('used', 'amara').find(e => e.tag === 'post');
    const using = p.log().filter(e => e.npc === 'amara' && e.ev === 'using' && e.t <= used.t).at(-1);
    assert.equal(used.t - using.t, 6 * TPS, 'the 6 s plug-in dwell is kept');
    assert.ok(!p.evs('print_fetched').length);
});

// ── validator and schema ─────────────────────────────────────────────────────────

function validate(npcPatch, { copier = {}, mappings = [] } = {}) {
    const scen = {
        scenario_brief: 'print fixture', startRoom: 'office', globalVariables: { out_a_shown: false },
        rooms: { office: { type: 'room_office', connections: {}, objects: [
            { type: 'pc', id: 'tom_pc', name: 'PC', takeable: false, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } },
            { type: 'photocopier1', id: 'office_copier', name: 'Copier', takeable: false, ...copier },
            { type: 'notes1', id: 'out_a', name: 'Printout', takeable: true, readable: true, text: 'x', outputOf: 'office_copier', revealOnGlobal: 'out_a_shown' }
        ], npcs: [{ id: 'tom', displayName: 'Tom', npcType: 'person', position: { x: 2, y: 2 }, spriteSheet: 'hacker', needsHome: 'tom_pc',
            needs: { work: { decayPerMin: 8, urgentAt: 50, initial: 80 } }, eventMappings: mappings, ...npcPatch }] } }
    };
    const dir = mkdtempSync(join(tmpdir(), 'print-'));
    const f = join(dir, 'scenario.json');
    writeFileSync(f, JSON.stringify(scen));
    const script = `require 'json'; require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}; puts ValidateNpcNeeds.check(JSON.parse(File.read(ARGV[0])))`;
    const r = spawnSync('ruby', ['-e', script, f], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
}

test('validator: printHabit, chance, uncollectedAfterSeconds and the print command', () => {
    const ok = validate({ onUse: { tom_pc: { revealOutput: 'office_copier', chance: 0.4 } }, printHabit: { fetchAfterSeconds: [30, 120], forgetChance: 0.5 } },
        { copier: { affordance: { uncollectedAfterSeconds: 150 } } });
    assert.ok(!/ERROR|WARNING/.test(ok.split('\n').filter(l => /print|chance|uncollected/i.test(l)).join('\n')), ok);
    assert.match(ok, /Printing NPCs for 'office_copier': 1 \(tom\)/);
    assert.match(validate({ onUse: { tom_pc: { revealOutput: 'office_copier', chance: 1.5 } } }), /ERROR.*chance/);
    assert.match(validate({ printHabit: { fetchAfterSeconds: [60, 30] } }), /ERROR.*fetchAfterSeconds/);
    assert.match(validate({ printHabit: { forgetChance: 2 } }), /ERROR.*forgetChance/);
    assert.match(validate({ printHabit: { forgetChance: 0.5 } }), /WARNING.*printHabit.*no revealOutput hook/);
    assert.doesNotMatch(validate({ printHabit: { forgetChance: 0.5 } }, { mappings: [{ eventPattern: 'x', needs: { print: 'office_copier' } }] }), /WARNING.*printHabit/);
    assert.match(validate({ needsHome: undefined, printHabit: {}, onUse: { tom_pc: { revealOutput: 'office_copier' } } }), /ERROR.*printHabit.*needsHome/);
    assert.match(validate({}, { mappings: [{ eventPattern: 'x', needs: { print: { producer: 'nope' } } }] }), /ERROR.*print.*nope/);
    assert.match(validate({}, { mappings: [{ eventPattern: 'x', needs: { print: { producer: 'office_copier', fetchAfterSeconds: [5] } } }] }), /ERROR.*fetchAfterSeconds/);
    assert.match(validate({}, { copier: { affordance: { uncollectedAfterSeconds: -1 } } }), /ERROR.*uncollectedAfterSeconds/);
});
