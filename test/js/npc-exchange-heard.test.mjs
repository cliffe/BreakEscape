// Scripted exchanges are heard once (docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md, superseded by E9,
// NPC_NEEDS_SYSTEM.md 5.6a): every way an exchange can end. Heard when the player overheard at least
// one of its lines, whether it played to the end or was cut short (the pair breaks up: a use or
// queue that ends, a player conversation, a knock-out). No line reached the player: unplayed, so a
// later meeting plays it. An exchange starts only with its first speaker in earshot (E9). Lines held up by the speech
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

/**
 * ann and bob (and any others), at a cooler or a queued coffee machine. Moves arrive at once.
 * Hearing: hears(id, radius) gives a boolean or { overheard, distance } (a no-argument function
 * still works); `distances` ({ npcId: px }, E7 to E9) hears an NPC when its distance is within the
 * radius asked for, and never one it does not list.
 */
function office({ coffee = false, globals = {}, hears = () => true, distances = null, ko = () => false, extra = {} } = {}) {
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
    w.world.playerHears = (id, radius) => {
        if (distances) {
            const d = distances[id];
            return Number.isFinite(d) ? { overheard: d <= radius, distance: d } : { overheard: false, distance: null };
        }
        const v = hears(id, radius);
        return v && typeof v === 'object' ? v : { overheard: !!v, distance: 50 };
    };
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

test('cut gives the held use back: a still-using NPC is not pinned for the rest of the exchange (R1 n2)', () => {
    let down = null;
    const o = office({ ko: id => id === down });
    o.until(() => o.exLines().length === 2, 30000, 'two lines overheard');
    const chat = o.sys._chats.get('cooler');
    const bob = o.sys.states.get('bob');
    const held = bob.job.useUntil;
    const bUseBefore = chat.ex.bUseBefore;
    assert.ok(Number.isFinite(bUseBefore) && held > bUseBefore, 'the hold pushed bob past his own cooler use');
    assert.ok(bUseBefore > o.sys.clockMs, 'the cut comes while bob still has use left');
    down = 'ann';                       // ko ann: the pair breaks while bob is still using
    o.sys.step(NEEDS_TICK_MS);
    assert.equal(o.evs('exchange_cut').length, 1, 'cut');
    assert.equal(bob.job.useUntil, bUseBefore, 'bob got the held time back: his use ends at his own pre-hold end');
    assert.ok(bob.job.useUntil < held, 'strictly less than the knot-end hold');
});

test('a cut while an exchange NPC is frozen in a player conversation hands the hold back off useRemaining (R1 n2)', () => {
    const o = office();
    o.until(() => o.exLines().length === 2, 30000, 'two lines');
    const bob = o.sys.states.get('bob');
    const held = bob.job.useUntil;
    o.w.setChat('bob');                 // bob freezes, then the pair is cut
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.evs('exchange_cut').length, 1, 'cut');
    assert.equal(bob.mode, 'frozen');
    const end = o.sys.clockMs + (bob.job.useRemaining || 0);
    assert.ok(end < held, 'bob is no longer held to the knot end once he unfreezes');
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

// ── E9: an exchange needs a heard first line (OFFICE_LIFE_MISSIONS_PLAN 9.1) ──

test('E9: the player hears only the second speaker: no exchange starts, the turn is a bark or picture', () => {
    const o = office({ distances: { ann: 400, bob: 50 } });   // LINES[0] is ann's
    o.sys.step(20000);
    assert.equal(o.evs('exchange_started').length, 0);
    assert.equal(o.exLines().length, 0);
    const turns = o.emitted('npc_chatted:');
    assert.ok(turns.length >= 2);
    assert.ok(turns.every(e => !e.data.exchange));
    assert.ok(turns.some(e => e.data.speakerId === 'bob' && e.data.line && e.data.overheard), 'bob\'s heard turn is a bark');
    assert.ok(turns.filter(e => e.data.speakerId === 'ann').every(e => e.data.picture), 'ann, unheard: pictures');
    assert.equal(o.globals.heard_ex_parcel, undefined);
});

// R1 M2: lab_physical_pentest's coffee_exchange shape. The exchange owner (Chris there, ann here)
// speaks first and is at the machine; the player stands by the queue end, hearing only the queued
// partner. The gate is on the first speaker, so nothing starts until ann is heard too.
test('E9: a coffee queue chat with only the queued speaker heard starts no exchange; hearing the user too starts it', () => {
    const distances = { bob: 50 };   // ann (LINES[0], at the machine) out of earshot
    const o = office({ coffee: true, distances });
    let chat = null;
    o.until(() => (chat = o.sys._chats.get('coffee')) && o.emitted('npc_chatted:coffee').length >= 2, 30000, 'queue chat turns');
    assert.ok(chat.queue, 'a queue chat');
    assert.equal(chat.a, 'ann', 'ann is using the machine');
    assert.equal(chat.b, 'bob', 'bob is the front of the queue');
    assert.equal(o.evs('exchange_started').length, 0, 'no exchange_started');
    assert.equal(o.exLines().length, 0);
    const turns = o.emitted('npc_chatted:coffee');
    assert.ok(turns.every(e => !e.data.exchange));
    assert.ok(turns.filter(e => e.data.speakerId === 'ann').every(e => e.data.picture && !e.data.overheard), 'ann, unheard: pictures');
    assert.equal(o.globals.heard_ex_parcel, undefined);
    distances.ann = 100;   // the player steps up to the machine, within ann's 160 px
    o.until(() => o.evs('exchange_started').length === 1, 10000, 'the exchange once ann is heard');
    assert.equal(o.exLines()[0]?.data.speakerId, 'ann');
});

test('E9: an object overhearRadius of 224 with the first speaker 200 px away starts the exchange; without it, not', () => {
    const wide = office({ distances: { ann: 200, bob: 200 } });
    wide.sys.world.getObject('cooler').affordance.overhearRadius = 224;
    wide.sys.step(40000);
    assert.equal(wide.evs('exchange_started').length, 1);
    assert.equal(wide.globals.heard_ex_parcel, true);
    const tight = office({ distances: { ann: 200, bob: 200 } });
    tight.sys.step(40000);
    assert.equal(tight.evs('exchange_started').length, 0);
    assert.equal(tight.globals.heard_ex_parcel, undefined);
});

test('E9: played to the end with no line overheard: exchange_unheard, not heard; the next meeting in earshot plays it from line 1', () => {
    let hearing = true;
    const o = office({ hears: () => hearing });
    o.sys._speechUntil = 8000;   // the first line waits for the speech lock...
    o.until(() => o.evs('exchange_started').length === 1, 20000, 'the start');
    hearing = false;             // ...and the player leaves before it
    o.sys.step(40000);
    assert.equal(o.exLines().length, LINES.length, 'played to the end');
    assert.ok(o.exLines().every(e => !e.data.overheard));
    assert.deepEqual(o.evs('exchange_unheard').map(e => [e.knot, e.of]), [['ex_parcel', LINES.length]]);
    assert.equal(o.evs('exchange_cut').length, 0);
    assert.equal(o.globals.heard_ex_parcel, undefined);
    assert.equal(o.emitted('npc_exchange_heard:').length, 0);
    assert.equal(o.sys._exPlayed.size, 0);
    hearing = true;
    o.meetAgain();
    o.sys.step(60000);
    const all = o.exLines();
    assert.equal(all.length, LINES.length * 2, 'played again');
    assert.equal(all[LINES.length].data.lineId, 'ex_parcel:0', 'from line 1');
    assert.equal(o.globals.heard_ex_parcel, true);
    assert.equal(o.emitted('npc_exchange_heard:ex_parcel').length, 1);
});

test('E9: a chained gate on heard_<first> opens only after a line of the first was heard', () => {
    let hearing = true;
    const o = office({
        hears: () => hearing,
        extra: { ann: { needs: thirsty(), exchanges: [{ with: 'bob', knot: 'ex_parcel' }, { with: 'bob', knot: 'ex_after', requireGlobal: { heard_ex_parcel: true } }] } }
    });
    const lines = (knot) => o.emitted('npc_chatted:').filter(e => e.data.exchange === knot);
    o.sys._speechUntil = 8000;
    o.until(() => o.evs('exchange_started').length === 1, 20000, 'the start');
    hearing = false;
    o.sys.step(40000);
    assert.equal(o.globals.heard_ex_parcel, undefined, 'the first played to an empty room');
    const A = o.sys.states.get('ann'), B = o.sys.states.get('bob');
    assert.equal(o.sys._findExchange(A, B).knot, 'ex_parcel', 'the chained one is still shut');
    hearing = true;
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.globals.heard_ex_parcel, true);
    assert.equal(lines('ex_after').length, 0, 'one exchange a meeting');
    o.meetAgain();
    o.sys.step(60000);
    assert.equal(o.globals.heard_ex_after, true, 'opened after a heard line of the first');
});

test('E9: a gate that opens mid-meeting: the exchange starts on the next turn with its first speaker heard', () => {
    const globals = { gate: false };
    const o = office({ globals, extra: { ann: { needs: thirsty(), exchanges: [{ with: 'bob', knot: 'ex_parcel', requireGlobal: 'gate' }] } } });
    o.sys.world.getObject('cooler').affordance.useSeconds = 60;
    o.until(() => o.emitted('npc_chatted:').length >= 3, 20000, 'three turns');
    const c = o.sys._chats.get('cooler');
    assert.ok(c, 'the pair are meeting');
    assert.ok(!c.exDone, 'still looking while gated');
    assert.equal(o.evs('exchange_started').length, 0);
    globals.gate = true;
    for (const id of ['ann', 'bob']) assert.equal(o.sys.states.get(id).job?.phase, 'using');
    o.until(() => o.evs('exchange_started').length === 1, 6000, 'the start once the gate opens');
    assert.equal(o.sys._chats.get('cooler'), c, 'the same meeting');
    o.sys.step(40000);
    assert.equal(o.exLines().length, LINES.length);
    assert.equal(o.globals.heard_ex_parcel, true);
});

test('E9: no entries for the pair, or the only entry heard: exDone after the first free turn, no second look', () => {
    for (const [label, opts] of [
        ['no entries', { extra: { ann: { needs: thirsty() } } }],
        ['only entry heard', { globals: { heard_ex_parcel: true } }]
    ]) {
        const o = office(opts);
        let looks = 0;
        const real = o.sys._findExchange.bind(o.sys);
        o.sys._findExchange = (A, B) => { looks++; return real(A, B); };
        o.until(() => o.sys._chats.has('cooler') && o.emitted('npc_chatted:').length >= 1, 20000, 'a turn');
        assert.equal(o.sys._chats.get('cooler').exDone, true, label);
        o.sys.step(8000);
        assert.equal(looks, 1, `${label}: looked once`);
    }
});

test('E9: a pool-only radius of 224 counts the start and every line at 200 px; heard', () => {
    const pool = { cooler: { lines: ['Busy day?'], overhearRadius: 224 } };
    const o = office({
        distances: { ann: 200, bob: 200 },
        extra: { ann: { ...EX, needs: thirsty(), chatter: pool }, bob: { needs: thirsty(), chatter: pool } }
    });
    o.sys.step(40000);
    assert.equal(o.evs('exchange_started').length, 1);
    assert.equal(o.exLines().length, LINES.length);
    assert.ok(o.exLines().every(e => e.data.overheard), 'each line counted at 224 px');
    assert.equal(o.evs('exchange_heard').length, 1);
    assert.equal(o.evs('exchange_unheard').length, 0);
    assert.equal(o.globals.heard_ex_parcel, true);
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
    // The player is out of earshot: a turn from the hush pool plays first (a picture since E7)
    o.until(() => o.emitted('npc_chatted:').length === 1, 20000, 'a first turn');
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
    // the fixture long lines also raise the 40-character bubble error (validator-exchange-line-length.test.mjs); not this test's point
    assert.deepEqual(issues.filter(s => s.includes('ex_') && !s.includes('a bubble holds')).length, 1, issues.join('\n'));
});
