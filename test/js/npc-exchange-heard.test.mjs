// Scripted exchanges are heard once (docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md): every way an
// exchange can end. Played to the end: heard. Cut short (the pair breaks up: a use or queue that
// ends, a player conversation, a knock-out) after the player overheard a line: heard. Cut before
// any line reached the player: unplayed, so a later meeting plays it. Lines held up by the speech
// lock keep the pair together, at a cooler and in a coffee queue. heard_<knot> survives a reload.
// Run with: bin/test-js test/js/npc-exchange-heard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, requiredGlobalsHold, NEEDS_TICK_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

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

test('sync size: an exchange writes one heard_<knot> key, once, whatever the number of meetings', () => {
    const writes = [];
    const o = office();
    const orig = o.w.world.setGlobal;
    o.w.world.setGlobal = (n, v) => { writes.push(n); orig(n, v); };
    o.sys.step(40000);
    for (let i = 0; i < 3; i++) { o.meetAgain(); o.sys.step(40000); }
    assert.deepEqual(writes.filter(n => n.startsWith('heard_')), ['heard_ex_parcel']);
});
