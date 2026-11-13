// Scripted exchanges are heard once (docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md): every way an
// exchange can end. Played to the end: heard. Cut short (the pair breaks up: a use or queue that
// ends, a player conversation, a knock-out) after the player overheard a line: heard. Cut before
// any line reached the player: unplayed, so a later meeting plays it. Lines held up by the speech
// lock keep the pair together, at a cooler and in a coffee queue. heard_<knot> survives a reload.
// Run with: bin/test-js test/js/npc-exchange-heard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    NPCNeedsSystem, requiredGlobalsHold, NEEDS_TICK_MS,
    EXCHANGE_MAX_MS, EXCHANGE_LINE_MAX_MS, CHAT_BASE_MS, CHAT_PER_CHAR_MS, CHAT_GAP_MS
} from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skipRuby = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const ruby = (body, input = '') => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}\n${body}`;
    const r = spawnSync('ruby', ['-e', script], { input, encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
};

const thirsty = (initial = 20) => ({ thirst: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const wantsCoffee = (initial = 20) => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const cooler = () => ({ id: 'cooler', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 70, useSeconds: 15, capacity: 2, chatter: 'cooler' } });
const machine = () => ({
    id: 'coffee', x: 300, y: 100,
    affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, capacity: 1, chatter: 'coffee', queue: { cells: [{ dx: -1, dy: 1 }, { dx: -2, dy: 1 }] } }
});
const LINES = [
    { speakerId: 'ann', text: 'Was that parcel on the floor for you?' },
    { speakerId: 'bob', text: 'It was. New headsets for the team.' },
    { speakerId: 'ann', text: 'Any chance of one before Friday?' },
    { speakerId: 'bob', text: 'Get in the queue.' }
];
const EX = { exchanges: [{ with: 'bob', knot: 'ex_parcel' }] };

/** ann and bob (and any others), at a cooler or a queued coffee machine. Moves arrive at once. */
function office({ coffee = false, globals = {}, hears = () => true, ko = () => false, extra = {} } = {}) {
    const need = coffee ? wantsCoffee : thirsty;
    const npcs = { ann: { ...EX, needs: need() }, bob: { needs: need() }, ...extra };
    const cfg = { npcs: {}, objects: [coffee ? machine() : cooler()] };
    let x = 100;
    for (const [id, rec] of Object.entries(npcs)) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, needs: need(), ...rec } };
        x += 64;
    }
    const w = makeWorld(cfg);
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = () => ({ overheard: !!hears(), distance: 50 });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.chatterConfig = () => ({ cooler: ['Busy day?'], coffee: ['After you.'] });
    w.world.exchangeLines = () => LINES;
    w.world.setGlobal = (name, value) => { globals[name] = value; };
    w.world.npcStatus = id => ({ ko: !!ko(id) });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const emitted = (prefix) => w.calls.emits.filter(e => e.name.startsWith(prefix));
    const exLines = () => emitted('npc_chatted:').filter(e => e.data.exchange === 'ex_parcel');
    const evs = (ev) => sys.getLog().filter(e => e.ev === ev);
    /** Tick until fn() holds (or fail after ms). */
    const until = (fn, ms = 60000, what = 'condition') => {
        const end = sys.clockMs + ms;
        while (!fn()) { if (sys.clockMs >= end) assert.fail(`timed out waiting for ${what}`); sys.step(NEEDS_TICK_MS); }
    };
    const meetAgain = () => { for (const id of ['ann', 'bob']) sys.states.get(id).levels[coffee ? 'caffeine' : 'thirst'] = 10; };
    return { w, sys, globals, emitted, exLines, evs, until, meetAgain };
}

test('completed: heard once, heard_<knot> set, npc_exchange_heard complete, no replay at the next meeting', () => {
    const o = office();
    o.sys.step(40000);
    assert.equal(o.exLines().length, LINES.length);
    const heard = o.emitted('npc_exchange_heard:ex_parcel');
    assert.equal(heard.length, 1);
    assert.equal(heard[0].data.complete, true);
    assert.equal(o.globals.heard_ex_parcel, true);
    assert.equal(o.evs('exchange_cut').length, 0);
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.exLines().length, LINES.length, 'no replay');
    assert.equal(o.emitted('npc_exchange_heard:').length, 1);
});

test('root cause (live, game 2859): a use shorter than the exchange ends on the tick after the last line; it still counts', () => {
    // The parcel lines, a one-second use: the hold made at the start ends the use. Each line waits
    // for the next 250 ms tick, so the last line ends a little before the hold does, and the tick
    // that would finish it is the one where the use ends
    const o = office({ extra: {} });
    o.sys.world.getObject('cooler').affordance.useSeconds = 1;
    o.sys.step(40000);
    assert.equal(o.exLines().length, LINES.length);
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel').length, 1);
    assert.equal(o.globals.heard_ex_parcel, true);
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.exLines().length, LINES.length, 'no replay at the next meeting');
});

test('root cause: lines held up by the speech lock keep the pair at the cooler until the last line ends', () => {
    const o = office();
    o.until(() => o.exLines().length === 1, 20000, 'the first line');
    // Another NPC's voiced line holds the lock for 20 s: past the hold made at the start
    o.sys._speechUntil = o.sys.clockMs + 20000;
    o.sys.step(60000);
    assert.equal(o.exLines().length, LINES.length, 'every line played');
    assert.equal(o.evs('exchange_cut').length, 0, 'not cut');
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel')[0]?.data.complete, true);
    assert.equal(o.globals.heard_ex_parcel, true);
});

test('coffee queue: the user and the front of the queue finish the exchange, even past the queue wait limit', () => {
    const o = office({ coffee: true });
    o.until(() => o.exLines().length === 1, 30000, 'the first queue line');
    const chat = o.sys._chats.get('coffee');
    assert.ok(chat?.queue, 'a queue chat');
    o.sys._speechUntil = o.sys.clockMs + 35000;   // longer than the 30 s queue wait
    o.sys.step(80000);
    assert.equal(o.exLines().length, LINES.length, 'every line played');
    assert.equal(o.evs('exchange_cut').length, 0);
    assert.equal(o.evs('queue_left').filter(e => e.reason === 'max_wait').length, 0, 'the front waited for the exchange');
    assert.ok(o.evs('used').some(e => e.npc === 'bob' && e.target === 'coffee'), 'and then had its coffee');
    assert.equal(o.globals.heard_ex_parcel, true);
    o.meetAgain();
    o.sys.step(80000);
    assert.equal(o.exLines().length, LINES.length, 'no replay at the next queue');
});

test('cut by a player conversation after a heard line: heard (complete false), never replayed', () => {
    const o = office();
    o.until(() => o.exLines().length === 2, 30000, 'two lines');
    o.w.setChat('bob');
    o.sys.step(NEEDS_TICK_MS * 2);
    const cut = o.evs('exchange_cut');
    assert.equal(cut.length, 1);
    assert.equal(cut[0].reason, 'pair_ended');
    assert.equal(cut[0].heard, true);
    assert.equal(cut[0].heardLines, 2);
    const heard = o.emitted('npc_exchange_heard:ex_parcel');
    assert.equal(heard.length, 1);
    assert.equal(heard[0].data.complete, false);
    assert.equal(o.globals.heard_ex_parcel, true);
    o.w.setChat(null);
    o.sys.step(30000);
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.exLines().length, 2, 'the rest is not played later, nor the start again');
});

test('cut by a knock-out after a heard line: heard', () => {
    let down = null;
    const o = office({ ko: id => id === down });
    o.until(() => o.exLines().length === 1, 20000, 'the first line');
    down = 'ann';
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.evs('exchange_cut')[0]?.heard, true);
    assert.equal(o.globals.heard_ex_parcel, true);
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel').length, 1);
});

test('cut before any line reached the player: unplayed, and a later meeting plays it whole', () => {
    let down = null;
    const o = office({ ko: id => id === down });
    o.sys._speechUntil = 30000;   // someone else's voiced line: the first exchange line waits
    o.until(() => o.evs('exchange_started').length === 1, 20000, 'the start');
    assert.equal(o.exLines().length, 0);
    down = 'bob';
    o.sys.step(NEEDS_TICK_MS * 2);
    const cut = o.evs('exchange_cut');
    assert.equal(cut.length, 1);
    assert.equal(cut[0].heard, false);
    assert.equal(cut[0].heardLines, 0);
    assert.equal(o.globals.heard_ex_parcel, undefined);
    assert.equal(o.emitted('npc_exchange_heard:').length, 0);
    assert.equal(o.sys._exPlayed.size, 0);
    down = null;
    o.sys.step(30000);
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.exLines().length, LINES.length, 'played from the start at a later meeting');
    assert.equal(o.globals.heard_ex_parcel, true);
});

test('lines spoken out of earshot do not count: the player left before the first line, then the pair broke up', () => {
    let hearing = true;
    let down = null;
    const o = office({ hears: () => hearing, ko: id => id === down });
    o.sys._speechUntil = 8000;   // the first line waits for the lock
    o.until(() => o.evs('exchange_started').length === 1, 20000, 'the start');
    hearing = false;   // the player leaves the room before the first line
    o.until(() => o.exLines().length === 2, 30000, 'two lines');
    assert.deepEqual(o.exLines().map(e => e.data.overheard), [false, false]);
    down = 'ann';
    o.sys.step(NEEDS_TICK_MS * 2);
    const cut = o.evs('exchange_cut')[0];
    assert.equal(cut.heardLines, 0);
    assert.equal(cut.heard, false);
    assert.equal(o.globals.heard_ex_parcel, undefined, 'two lines said to nobody: still unplayed');
});

test('room change: the player leaves after the first line, the pair plays on to the end: heard', () => {
    let hearing = true;
    const o = office({ hears: () => hearing });
    o.until(() => o.exLines().length === 1, 20000, 'the first line');
    hearing = false;
    o.sys.step(40000);
    assert.equal(o.exLines().length, LINES.length);
    assert.deepEqual(o.exLines().map(e => e.data.overheard), [true, false, false, false]);
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel')[0]?.data.complete, true);
    assert.equal(o.globals.heard_ex_parcel, true);
});

test('reload: heard_<knot> saved after a cut exchange keeps it unplayed in a fresh session', () => {
    const o = office();
    o.until(() => o.exLines().length === 1, 20000, 'the first line');
    o.w.setChat('ann');
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.globals.heard_ex_parcel, true);
    // A reload: a new system, the saved globals
    const p = office({ globals: { ...o.globals } });
    p.sys.step(60000);
    assert.equal(p.exLines().length, 0);
    assert.equal(p.emitted('npc_exchange_heard:').length, 0);
    assert.ok(p.emitted('npc_chatted:').length >= 1, 'they chat with barks or pictures instead');
});

test('hush: a hush from an earlier bark does not cut the exchange after its first line (R1 n3)', () => {
    let hearing = false;
    let near = false;
    const o = office({ hears: () => hearing });
    o.w.world.chatterConfig = () => ({ cooler: { lines: ['Did you hear?', 'No, what?'], hush: true }, coffee: ['After you.'] });
    o.w.world.playerProximity = () => ({ nearby: near, distance: near ? 40 : 400 });
    // The player is out of earshot: a bark from the hush pool plays first
    o.until(() => o.emitted('npc_chatted:').length === 1, 20000, 'a bark');
    assert.equal(o.exLines().length, 0);
    assert.equal(o.sys._chats.get('cooler')?.hush, true, 'the bark set the hush');
    // The player comes into earshot: the exchange starts, then the player walks up close
    hearing = true;
    o.until(() => o.exLines().length === 1, 20000, 'the first exchange line');
    near = true;
    o.sys.step(40000);
    assert.equal(o.evs('exchange_cut').length, 0, 'not hushed');
    assert.equal(o.exLines().length, LINES.length, 'every line played');
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel')[0]?.data.complete, true);
    assert.equal(o.globals.heard_ex_parcel, true);
});

test('coffee queue on a long use: the front waits for the exchange only until its hold cap (R1 n1)', () => {
    const o = office({ coffee: true });
    o.sys.world.getObject('coffee').affordance.useSeconds = 200;
    o.until(() => o.exLines().length === 1, 30000, 'the first queue line');
    const chat = o.sys._chats.get('coffee');
    assert.ok(chat?.queue, 'a queue chat');
    const cap = chat.ex.holdCap;
    const userEnd = o.sys.states.get(chat.a).job.useUntil;
    assert.ok(userEnd > cap + 30000, 'the use outlasts the hold cap');
    o.sys._speechUntil = o.sys.clockMs + 150000;   // the lock starves the rest of the exchange
    o.until(() => o.evs('queue_left').some(e => e.reason === 'max_wait'), 100000, 'the front to give up');
    assert.ok(o.sys.clockMs >= cap, 'not before the hold cap');
    assert.ok(o.sys.clockMs < userEnd, 'and not left waiting for the whole use');
    const cut = o.evs('exchange_cut');
    assert.equal(cut.length, 1);
    assert.equal(cut[0].heard, true, 'cut after a heard line: heard');
});

test('sync size: an exchange writes one heard_<knot> key, once, whatever the number of meetings', () => {
    const writes = [];
    const o = office();
    const orig = o.w.world.setGlobal;
    o.w.world.setGlobal = (n, v) => { writes.push(n); orig(n, v); };
    o.sys.step(40000);
    for (let i = 0; i < 3; i++) { o.meetAgain(); o.sys.step(40000); }
    assert.deepEqual(writes.filter(n => n.startsWith('heard_')), ['heard_ex_parcel']);
});

// ── validator (scripts/validate_npc_needs.rb check_exchanges), R1 m3 ─────────

test('validator: the line timing matches the engine', { skip: skipRuby }, () => {
    const r = ruby(`puts JSON.generate(%w[EXCHANGE_MAX_MS EXCHANGE_LINE_MAX_MS CHAT_BASE_MS CHAT_PER_CHAR_MS CHAT_GAP_MS].map { |c| ValidateNpcNeeds.const_get(c) })`);
    assert.deepEqual(r, [EXCHANGE_MAX_MS, EXCHANGE_LINE_MAX_MS, CHAT_BASE_MS, CHAT_PER_CHAR_MS, CHAT_GAP_MS]);
});

test('validator: an exchange longer than EXCHANGE_MAX_MS is a warning; a short one is not', { skip: skipRuby }, () => {
    const scenario = {
        globalVariables: { heard_ex_long: false, heard_ex_short: false },
        rooms: { office: { type: 'room_office', objects: [], npcs: [
            { id: 'ann', voice: {}, storyPath: 'test/js/fixtures/exchange_long_knot.json',
              exchanges: [{ with: 'bob', knot: 'ex_long' }, { with: 'bob', knot: 'ex_short' }] },
            { id: 'bob', voice: {} }
        ] } }
    };
    const issues = ruby('puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))', JSON.stringify(scenario));
    const long = issues.filter(s => s.includes("'ex_long' runs about"));
    assert.equal(long.length, 1, issues.join('\n'));
    assert.match(long[0], /WARNING/);
    assert.match(long[0], /about 65\.0 s, over the 60 s/);
    assert.ok(!issues.some(s => s.includes("'ex_short' runs")), 'the short knot is fine');
    assert.deepEqual(issues.filter(s => s.includes('ex_')).length, 1, issues.join('\n'));
});
