// Office life slice 11 (OFFICE_LIFE_PLAN 2.10, 2.11): left-behind items (leftBehindBy,
// leftBehindChance, a seeded roll per real leave keyed on leaveCount), the owner collecting them
// on return, a taken item gone for good, stow on sight after a reload, and a queue-aware
// expectedAwayMs. The needs core on the sims stub (addLeftBehind), the live adapter on a fake
// window, and the validator.
// Run with: bin/test-js test/js/npc-left-behind.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { makeSimsWorld, runSimsDay, addLeftBehind, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TICKS_PER_MIN = 240;

/** The sims day (no doors opened) with Tom's badge; `tap(sys, w)` runs after every tick. */
function badgeDay({ minutes = 10, chance = 0.7, tap, w: given } = {}) {
    const w = given || makeSimsWorld();
    if (!given) addLeftBehind(w, { chance });
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    while (sys.tickCount < minutes * TICKS_PER_MIN) { sys.tick(); tap?.(sys, w); }
    const log = sys.getLog();
    // Leaves are emitted, not logged (npc_left_post); everything else is in the decision log
    const leaves = (npc = 'tom') => w.calls.emits.filter(e => e.name === `npc_left_post:${npc}`);
    return { sys, w, log, leaves, ev: (name, npc = 'tom') => log.filter(e => e.ev === name && e.npc === npc) };
}

// ── the roll ────────────────────────────────────────────────────────────────

test('one seeded roll per real leave, keyed on leaveCount, under leftBehindChance', () => {
    const { sys, ev, leaves: leavesOf } = badgeDay({ minutes: 12 });
    const leaves = leavesOf();
    assert.ok(leaves.length >= 3, `Tom leaves several times (${leaves.length})`);
    const shown = ev('left_behind');
    assert.ok(shown.length >= 1 && shown.length < leaves.length, `some leaves, not all (${shown.length}/${leaves.length})`);
    // Exactly the leaves whose roll falls under 0.7, numbered from 1
    const expected = leaves.map((_, i) => i + 1).filter(n => sys.roll('tom', `left:${n}:tom_badge`) < 0.7);
    assert.deepEqual(shown.map(e => e.leave), expected);
    assert.ok(shown.every(e => e.item === 'tom_badge'));
    assert.equal(sys.getState('tom').leaveCount, leaves.length);
    // Same seed, same day
    const again = badgeDay({ minutes: 12 });
    assert.deepEqual(again.log, badgeDay({ minutes: 12 }).log);
    assert.deepEqual(again.ev('left_behind').map(e => [e.t, e.leave]), shown.map(e => [e.t, e.leave]));
});

test('leftBehindChance 0 never leaves it, 1 leaves it on every real leave', () => {
    const none = badgeDay({ chance: 0 });
    assert.equal(none.ev('left_behind').length, 0);
    assert.equal(none.w.calls.leftShown.length, 0);
    const all = badgeDay({ chance: 1 });
    assert.equal(all.ev('left_behind').length, all.leaves().length);
});

test('own-desk work is not a leave: no roll and no count', () => {
    const { sys, log, leaves: leavesOf } = badgeDay({ minutes: 12, chance: 1 });
    const ownUses = log.filter(e => e.ev === 'used' && e.npc === 'tom' && e.target === 'tom_pc');
    assert.ok(ownUses.length >= 1, 'Tom works at his own PC');
    assert.equal(sys.getState('tom').leaveCount, leavesOf().length);
});

// ── reveal, collect, take ───────────────────────────────────────────────────

test('the item shows at the post on leaving, the owner collects it on return, and a later leave shows it again', () => {
    const seen = [];
    const { log, w } = badgeDay({ chance: 1, minutes: 12, tap: (sys, w) => {
        const st = sys.getState('tom');
        seen.push({ t: sys.tickCount, away: !st.atPost, shown: w.globals.tom_badge_left === true });
    } });
    const tom = log.filter(e => e.npc === 'tom' && ['left_behind', 'returned_post', 'stowed'].includes(e.ev)).map(e => e.ev + (e.reason ? ':' + e.reason : ''));
    // Every leave: left behind, then back at the post, then collected
    const pairs = [];
    for (let i = 0; i < tom.length; i++) if (tom[i] === 'left_behind') pairs.push(tom.slice(i, i + 3).join(' '));
    assert.ok(pairs.length >= 2, 'left and collected at least twice');
    for (const p of pairs.slice(0, -1)) assert.equal(p, 'left_behind returned_post stowed:collected');
    // Shown exactly while Tom is away (the tick he leaves through the tick he is back)
    for (const s of seen) if (s.shown) assert.ok(s.away, `badge on show only while Tom is away (tick ${s.t})`);
    assert.ok(w.calls.leftStowed.length >= 2);
    // npc_left_post names what was left; object_revealed carries the owner
    const left = w.calls.emits.find(e => e.name === 'npc_left_post:tom' && e.data.leftBehind);
    assert.deepEqual(left.data.leftBehind, ['tom_badge']);
    assert.ok(w.calls.emits.some(e => e.name === 'object_revealed:tom_badge' && e.data.leftBehindBy === 'tom'));
});

test('taken by the player: one beat, gone for good, and the owner notices on return', () => {
    let took = null;
    const { log, w, leaves } = badgeDay({ chance: 1, minutes: 15, tap: (sys, w) => {
        if (took === null && w.globals.tom_badge_left === true) { took = sys.tickCount; w.takeLeft('tom_badge'); }
    } });
    assert.ok(took !== null, 'it was left once');
    assert.equal(w.calls.leftShown.length, 1, 'never shown again');
    assert.equal(w.calls.leftStowed.length, 0, 'nothing to collect');
    const gone = log.filter(e => e.ev === 'left_item_gone');
    assert.equal(gone.length, 1);
    assert.equal(gone[0].item, 'tom_badge');
    const ev = w.calls.emits.filter(e => e.name === 'npc_left_item_gone:tom');
    assert.equal(ev.length, 1);
    assert.equal(ev[0].data.itemId, 'tom_badge');
    // Later leaves roll nothing: the item is not offered
    assert.ok(leaves().length >= 2, 'Tom leaves again');
    assert.equal(log.filter(e => e.ev === 'left_behind').length, 1);
});

test('reload with the item showing: stowed on sight, and a later leave can show it again', () => {
    const w = makeSimsWorld();
    addLeftBehind(w, { chance: 1 });
    w.globals.tom_badge_left = true;          // left before the reload; globals persist
    w.badge.pickable = true;
    const { log } = badgeDay({ w, minutes: 8 });
    assert.equal(w.calls.leftStowed[0], 'tom_badge', 'stowed on sight at install');
    assert.equal(log.find(e => e.ev === 'left_behind')?.leave, 1, 'the first leave after the reload shows it again');
});

// ── the decision log ────────────────────────────────────────────────────────

// Recorded in npc-needs-slots.test.mjs before slice 7; still the day with no slots or left items
const GOLDEN_SIMS_DAY = 'a87a652c0b54abe9d8c237f6ba4b8cc097f193097a546267bbcf6b5b86b86948';

test('the sims-day log is byte-identical where nothing is left behind', () => {
    const { sys } = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    assert.equal(createHash('sha256').update(JSON.stringify(sys.getLog())).digest('hex'), GOLDEN_SIMS_DAY);
    // A declared item that is never left (chance 0) changes nothing either
    const plain = badgeDay({ chance: 0, minutes: 10 }).log;
    const w = makeSimsWorld();
    const sys2 = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys2); sys2.registerAll();
    while (sys2.tickCount < 10 * TICKS_PER_MIN) sys2.tick();
    assert.deepEqual(plain, sys2.getLog());
});

// ── expectedAwayMs and the queue ────────────────────────────────────────────

const wantsCoffee = () => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } });
function queueOffice({ capacity = 1 } = {}) {
    const cfg = { npcs: {}, objects: [{ id: 'coffee', x: 300, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, capacity, queue: { cells: [{ dx: -1, dy: 1 }, { dx: -2, dy: 1 }, { dx: -3, dy: 1 }] } } }] };
    let x = 100;
    for (const id of ['ann', 'bob', 'cat', 'dan']) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, needs: wantsCoffee() } };
        x += 64;
    }
    const w = makeWorld(cfg);
    w.world.globalHolds = cond => requiredGlobalsHold(cond, {});
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(NEEDS_TICK_MS * 2);
    const away = id => w.calls.emits.find(e => e.name === `npc_left_post:${id}`).data.expectedAwayMs;
    // The straight-line walk there and back at 80 px/s plus one 10 s dwell, as slice 2 counts it
    const walk = id => {
        const home = sys.states.get(id).home, a = { x: 300, y: 132 };
        const start = { x: cfg.npcs[id].pos.x, y: 300 };
        return Math.round((Math.hypot(a.x - start.x, a.y - start.y) + Math.hypot(home.x - a.x, home.y - a.y)) / 80 * 1000 + 10000);
    };
    return { sys, away, walk };
}

test('expectedAwayMs adds one dwell per place in the queue', () => {
    const { sys, away, walk } = queueOffice();
    assert.equal(sys.getState('ann').job.phase, 'using');
    assert.equal(away('ann'), walk('ann'), 'the user: walk plus dwell, as before');
    assert.equal(sys.getState('bob').job.queuePlace, 1);
    assert.equal(away('bob'), walk('bob') + 10000, 'first in line waits one dwell');
    assert.equal(away('cat'), walk('cat') + 20000);
    assert.equal(away('dan'), walk('dan') + 30000);
});

test('expectedAwayMs: a capacity-2 machine shares the wait', () => {
    const { sys, away, walk } = queueOffice({ capacity: 2 });
    assert.equal(sys.getState('bob').job.phase, 'using');
    assert.equal(sys.getState('cat').job.queuePlace, 1);
    assert.equal(away('cat'), walk('cat') + 10000);
    assert.equal(away('dan'), walk('dan') + 10000, 'second in line, two places at the machine: one dwell');
});

// ── the live adapter on a fake window ───────────────────────────────────────

function fakeSprite(id, roomId, x, y, sd = {}) {
    return {
        objectId: id, roomId, x, y, width: 16, height: 16, displayWidth: 16, displayHeight: 16,
        originX: 0, originY: 0, depth: y + 16, visible: true, active: true, interactable: true,
        revealOnGlobal: sd.revealOnGlobal, scenarioData: { id, ...sd },
        setVisible(v) { this.visible = v; return this; },
        setDepth(d) { this.depth = d; return this; },
        setInteractive() { this.inputOn = true; return this; },
        disableInteractive() { this.inputOn = false; return this; },
        destroy() { this.destroyed = true; }
    };
}

function fakeWindow({ globals = {} } = {}) {
    const badge = fakeSprite('tom_badge', 'office', 100, 150, { type: 'id_badge', leftBehindBy: 'tom', leftBehindChance: 0.7, revealOnGlobal: 'tom_badge_left', takeable: true });
    const mug = fakeSprite('ann_mug', 'office', 200, 150, { type: 'mug', leftBehindBy: 'ann', leftBehindChance: 1, revealOnGlobal: 'ann_mug_left' });
    const plain = fakeSprite('tom_pc', 'office', 90, 140, { type: 'pc' });
    for (const sp of [badge, mug]) if (globals[sp.revealOnGlobal] !== true) sp.visible = false;
    const win = {
        rooms: { office: { position: { x: 0, y: 0 }, objects: { tom_badge: badge, ann_mug: mug, tom_pc: plain } } },
        gameState: { globalVariables: { ...globals } },
        inventory: { items: [] },
        npcManager: { getNPC: id => (id === 'tom' ? { id: 'tom', needsHome: 'tom_pc' } : null) },
        eventDispatcher: { on() {}, emit(n, d) { (win._emits = win._emits || []).push({ n, d }); } },
        showRevealedObject(obj) { obj.setVisible(true); obj.interactable = true; obj.setInteractive(); },
        hideRevealedObject(obj) { obj.setVisible(false); obj.interactable = false; obj.disableInteractive(); }
    };
    return { win, badge, plain };
}

function withWindow(win, fn) {
    globalThis.window = win;
    try { return fn(); } finally { delete globalThis.window; }
}

test('adapter: leftBehindItems lists the owner\'s items; reveal shows it, stowSlot collects it', () => {
    const { win, badge } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        assert.deepEqual(w.leftBehindItems('tom'), [{ id: 'tom_badge', chance: 0.7 }]);
        assert.equal(w.getObject('tom_badge').slot, true, 'a left-behind item is a slot');
        assert.equal(w.revealLeftBehind('tom_badge', 'tom'), true);
        assert.equal(badge.visible, true);
        assert.equal(win.gameState.globalVariables.tom_badge_left, true);
        assert.ok(win._emits.some(e => e.n === 'object_revealed:tom_badge' && e.d.leftBehindBy === 'tom'));
        assert.deepEqual(w.leftBehindItems('tom'), [], 'already showing');
        assert.equal(w.stowSlot('tom_badge'), true);
        assert.equal(badge.visible, false);
        assert.equal(win.gameState.globalVariables.tom_badge_left, false);
        assert.equal(win.rooms.office.objects.tom_badge, badge, 'still under its key');
        assert.deepEqual(w.leftBehindItems('tom'), [{ id: 'tom_badge', chance: 0.7 }], 'free again');
    });
});

test('adapter: shown above the owner\'s desk dressing, and back to its own depth when collected', () => {
    const { win, badge, plain } = fakeWindow();
    plain.depth = 205.5;                       // a desk's items share the PC's depth (desk front y)
    withWindow(win, () => {
        const w = createEngineWorld();
        const own = badge.depth;
        w.revealLeftBehind('tom_badge', 'tom');
        assert.equal(badge.depth, 205.6);
        w.stowSlot('tom_badge');
        assert.equal(badge.depth, own);
    });
});

test('adapter: a taken item is never offered or collected again', () => {
    const { win, badge } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        w.revealLeftBehind('tom_badge', 'tom');
        win.inventory.items.push(badge);           // the player picked it up
        badge.active = false;
        assert.equal(w.stowSlot('tom_badge'), false);
        assert.deepEqual(w.leftBehindItems('tom'), []);
        assert.equal(w.revealLeftBehind('tom_badge', 'tom'), false);
    });
});

test('adapter: reload with it showing: stowRevealedSlots files it', () => {
    const { win, badge } = fakeWindow({ globals: { tom_badge_left: true } });
    withWindow(win, () => {
        const w = createEngineWorld();
        assert.deepEqual(w.stowRevealedSlots(['office']), ['tom_badge']);
        assert.equal(badge.visible, false);
        assert.equal(win.gameState.globalVariables.tom_badge_left, false);
    });
});

// ── validator ───────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const scen = (item, { npc = {}, extra = [] } = {}) => ({
    globalVariables: { b_left: false },
    rooms: { office: { type: 'room_office', objects: [
        { id: 'tom_pc', type: 'pc' },
        { id: 'coffee', type: 'coffee_station1', affordance: { satisfies: 'caffeine', restores: 70 } },
        { id: 'badge', type: 'id_badge', takeable: true, leftBehindBy: 'tom', leftBehindChance: 0.7, revealOnGlobal: 'b_left', ...item },
        ...extra
    ], npcs: [{ id: 'tom', needsHome: 'tom_pc', needs: { caffeine: { decayPerMin: 10, urgentAt: 40 } }, ...npc }] } }
});
const has = (issues, frag) => issues.some(s => s.includes(frag));
const errs = issues => issues.filter(s => s.startsWith('❌'));

test('validator: leftBehindBy owner, chance range, own global, read in place', { skip }, () => {
    const ok = check(scen({}));
    assert.deepEqual(errs(ok), []);
    assert.ok(has(ok, "Left-behind item 'badge' (tom, chance 0.7): takeable"));
    assert.ok(has(check(scen({ leftBehindBy: 'ghost' })), "leftBehindBy names 'ghost'"));
    assert.ok(has(check(scen({}, { npc: { needsHome: undefined } })), 'has no needsHome'));
    assert.ok(has(check(scen({ leftBehindChance: 1.5 })), 'leftBehindChance must be a number from 0 to 1'));
    assert.ok(has(check(scen({ leftBehindChance: '0.5' })), 'leftBehindChance must be a number from 0 to 1'));
    assert.ok(has(check(scen({ leftBehindChance: undefined })), 'never left'));
    assert.ok(has(check(scen({ revealOnGlobal: undefined })), 'has leftBehindBy but no revealOnGlobal'));
    assert.ok(has(check(scen({}, { extra: [{ id: 'memo', type: 'notes1', observationVariants: [{ condition: 'globalVars.b_left', value: 'x' }] }] })), 'is used elsewhere'));
    assert.ok(has(check(scen({}, { extra: [{ id: 'other', type: 'key', leftBehindBy: 'tom', leftBehindChance: 0.1, revealOnGlobal: 'b_left' }] })), 'is shared with'));
    assert.ok(has(check(scen({ type: 'notes1', readable: true, text: 'x', takeable: false })), 'without readDisplay'));
    assert.ok(!has(check(scen({ type: 'notes1', readable: true, text: 'x', takeable: false, readDisplay: 'gameDisplay' })), 'without readDisplay'));
    assert.ok(has(check(scen({ outputOf: 'tom_pc' })), 'has both outputOf and leftBehindBy'));
    assert.ok(has(check(scen({ leftBehindBy: undefined })), 'sets leftBehindChance without leftBehindBy'));
});

test('validator: test_needs_sims has no errors and lists Tom\'s badge', { skip }, () => {
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(root, 'scenarios/test_needs_sims/scenario.json.erb')], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    const out = r.stdout + r.stderr;
    assert.ok(!/❌ ERROR/.test(out), out.split('\n').filter(l => l.includes('ERROR')).join('\n'));
    assert.ok(out.includes("Left-behind item 'tom_badge' (tom, chance 0.7)"));
});
