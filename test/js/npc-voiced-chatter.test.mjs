// Office life slice 15 (OFFICE_LIFE_PLAN 11): voiced chatter and scripted exchanges. The seeded
// shuffle-bag, the per-NPC cooldown, picture chat, the speech lock, exchanges (audience, once,
// heard_<knot>, no replay after a reload), the separate ink story instance and the voice adapter.
// Run with: bin/test-js test/js/npc-voiced-chatter.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, bagOrder, createSeededRng, CHATTER_COOLDOWN_MIN,
    PICTURE_CHATTER, exchangeLineMs
} from '../../public/break_escape/js/systems/npc-needs.js';
import {
    NpcChatterVoice, splitPrefix, speakerFor, exchangeLinesFromStory
} from '../../public/break_escape/js/systems/npc-needs-chatter.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const storyText = (name) => readFileSync(join(here, `../../scenarios/test_needs_sims/ink/${name}.json`), 'utf8').replace(/^﻿/, '');

const thirsty = (initial = 20) => ({ thirst: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const cooler = (id = 'cooler', x = 300) => ({ id, x, y: 100, affordance: { satisfies: 'thirst', restores: 70, useSeconds: 15, capacity: 2, chatter: 'cooler' } });
const POOL = { cooler: ['Busy day?', 'Not bad, you?', 'Rain again.', 'Lunch?'] };
const LINES = [
    { speakerId: 'ann', text: 'Seen the new rota?' },
    { speakerId: 'bob', text: 'I wrote it.' },
    { speakerId: 'ann', text: 'Fridge duty again.' }
];

/** NPCs at coolers. `npcs`: { id: rec }. Moves arrive at once. */
function office(npcs, { objects = [cooler()], seed = 1, globals = {}, hears = true, chatter = POOL, lines = LINES, spacing = 64 } = {}) {
    const cfg = { npcs: {}, objects };
    let x = 100;
    for (const [id, rec] of Object.entries(npcs)) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, needs: thirsty(), ...rec } };
        x += spacing;
    }
    const w = makeWorld(cfg);
    const spoken = [];
    const exCalls = [];
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = () => ({ overheard: typeof hears === 'function' ? hears() : hears, distance: 50 });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.chatterConfig = () => chatter;
    w.world.speak = (id, line, info) => spoken.push({ id, line, at: sys.clockMs, until: sys.clockMs + info.ms, knot: info.knot || null });
    w.world.exchangeLines = (owner, knot) => { exCalls.push([owner, knot]); return typeof lines === 'function' ? lines(owner, knot) : lines; };
    w.world.setGlobal = (name, value) => { globals[name] = value; };
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const emitted = (prefix) => w.calls.emits.filter(e => e.name.startsWith(prefix));
    return { w, sys, globals, emitted, spoken, exCalls };
}

const EX = { exchanges: [{ with: 'bob', knot: 'ex_rota' }] };

// ── bag and cooldown ───────────────────────────────────────────────────────

test('bag: no line again until the bag is empty; the same seed gives the same order', () => {
    const lines = ['a', 'b', 'c', 'd', 'e'];
    const draw = (seed) => {
        const o = office({ ann: {} }, { seed });
        return Array.from({ length: 15 }, () => o.sys._bagNext('ann', 'cooler', lines));
    };
    const a = draw(7), b = draw(7);
    assert.deepEqual(a, b, 'deterministic for a seed');
    for (let r = 0; r < 3; r++) assert.deepEqual([...a.slice(r * 5, r * 5 + 5)].sort(), [0, 1, 2, 3, 4], `round ${r} is a permutation`);
    for (let i = 1; i < a.length; i++) assert.notEqual(a[i], a[i - 1], 'never the same line twice running, even across a refill');
    assert.notDeepEqual(draw(8), a, 'another seed, another order');
    // Pure order: a permutation, and the refill never starts with the last line
    const o = bagOrder(6, createSeededRng(3), 2);
    assert.deepEqual([...o].sort(), [0, 1, 2, 3, 4, 5]);
    assert.notEqual(o[0], 2);
    // Two topics, two NPCs: separate bags
    const t = office({ ann: {}, bob: {} });
    t.sys._bagNext('ann', 'cooler', lines);
    assert.equal(t.sys._bags.size, 1);
    t.sys._bagNext('bob', 'cooler', lines);
    t.sys._bagNext('ann', 'grumble', ['x']);
    assert.equal(t.sys._bags.size, 3);
});

test('cooldown: one bark, then pictures until chatterCooldownMin has passed (default 5 needs-clock minutes)', () => {
    const o = office({ ann: {}, bob: { chatterCooldownMin: 1 } });
    const ann = o.sys.states.get('ann');
    const first = o.sys._pickBark(ann, 'cooler');
    assert.ok(POOL.cooler.includes(first.line));
    assert.equal(first.picture, null);
    const second = o.sys._pickBark(ann, 'cooler');
    assert.equal(second.line, null, 'on cooldown');
    assert.ok(PICTURE_CHATTER.cooler.includes(second.picture));
    o.sys.clockMs += CHATTER_COOLDOWN_MIN * 60000 - 1;
    assert.equal(o.sys._pickBark(ann, 'cooler').line, null, 'still cooling down');
    o.sys.clockMs += 1;
    assert.ok(POOL.cooler.includes(o.sys._pickBark(ann, 'cooler').line), 'a bark again');
    const bob = o.sys.states.get('bob');
    o.sys._pickBark(bob, 'cooler');
    o.sys.clockMs += 60000;
    assert.ok(o.sys._pickBark(bob, 'cooler').line, 'chatterCooldownMin: 1');
});

test('picture chat once nothing is left; "chatter": false is silent; no built-in spoken lines', () => {
    const o = office({ ann: {}, bob: {} }, { lines: null });
    o.sys.step(20000);
    const turns = o.emitted('npc_chatted:cooler');
    assert.ok(turns.length >= 4, `got ${turns.length}`);
    assert.equal(turns.filter(e => e.data.line).length, 2, 'one bark each, then cooldown');
    for (const e of turns.slice(2)) {
        assert.equal(e.data.line, null);
        assert.ok(PICTURE_CHATTER.cooler.includes(e.data.picture));
        assert.equal(e.data.lineId, `picture:${e.data.picture}`);
    }
    assert.equal(o.spoken.length, 2, 'pictures are never spoken');
    const talking = o.sys.getState(turns.at(-1).data.speakerId).talking;
    if (talking) assert.ok(talking.picture);
    // No scenario or NPC pool for the topic: picture chat only
    const bare = office({ ann: {}, bob: {} }, { chatter: {}, lines: null });
    bare.sys.step(20000);
    assert.ok(bare.emitted('npc_chatted:').length >= 2);
    assert.ok(bare.emitted('npc_chatted:').every(e => e.data.line === null && e.data.picture));
    const off = office({ ann: {}, bob: {} }, { chatter: false, lines: null });
    off.sys.step(20000);
    assert.equal(off.emitted('npc_chatted:').length, 0);
});

// ── speech lock ────────────────────────────────────────────────────────────

test('speech lock: two pairs at two coolers never speak at once; the second pair queues', () => {
    const o = office({ ann: {}, bob: {}, cat: {}, dan: {} }, { objects: [cooler('c1', 300), cooler('c2', 500)], lines: null, spacing: 200 });
    o.sys.step(1000);
    assert.deepEqual([...o.sys._chats.keys()].sort(), ['c1', 'c2'], 'two pairs');
    o.sys.step(14000);
    const v = [...o.spoken].sort((x, y) => x.at - y.at);
    assert.equal(v.length, 4, 'one bark each');
    assert.equal(new Set(o.emitted('npc_chatted:').filter(e => e.data.line).map(e => e.data.objectId)).size, 2, 'both pairs spoke');
    for (let i = 1; i < v.length; i++) assert.ok(v[i].at >= v[i - 1].until, `line ${i} starts after the last one ends`);
});

// ── exchanges ──────────────────────────────────────────────────────────────

test('exchange: plays with the player in earshot, once, each line by its speaker, sets heard_<knot>', () => {
    const o = office({ ann: EX, bob: {} });
    o.sys.step(30000);
    const ex = o.emitted('npc_chatted:').filter(e => e.data.exchange === 'ex_rota');
    assert.deepEqual(ex.map(e => [e.data.speakerId, e.data.line]), LINES.map(l => [l.speakerId, l.text]));
    for (const e of ex) assert.equal(e.data.partnerId, e.data.speakerId === 'ann' ? 'bob' : 'ann');
    const heard = o.emitted('npc_exchange_heard:ex_rota');
    assert.equal(heard.length, 1);
    assert.deepEqual(heard[0].data.npcIds, ['ann', 'bob']);
    assert.equal(o.globals.heard_ex_rota, true);
    assert.deepEqual(o.spoken.filter(s => s.knot).map(s => [s.id, s.line]), LINES.map(l => [l.speakerId, l.text]), 'each line spoken in its speaker\'s voice');
    // After the exchange the same meeting goes on with barks, then pictures
    const after = o.emitted('npc_chatted:').filter(e => !e.data.exchange);
    assert.ok(after.length >= 1);
    assert.ok(after[0].data.line, 'a bark first');
    // The use was held for the knot
    assert.ok(o.sys.log.some(e => e.ev === 'exchange_started' && e.knot === 'ex_rota'));
    assert.ok(o.sys.log.some(e => e.ev === 'exchange_heard' && e.knot === 'ex_rota'));
    // A second meeting: no replay
    for (const id of ['ann', 'bob']) o.sys.states.get(id).levels.thirst = 10;
    o.sys.step(60000);
    assert.equal(o.emitted('npc_exchange_heard:').length, 1);
    assert.equal(o.emitted('npc_chatted:').filter(e => e.data.exchange).length, LINES.length);
});

test('exchange: not replayed after a reload (heard_<knot> true in the saved globals)', () => {
    const o = office({ ann: EX, bob: {} }, { globals: { heard_ex_rota: true } });
    o.sys.step(30000);
    assert.equal(o.emitted('npc_exchange_heard:').length, 0);
    assert.equal(o.emitted('npc_chatted:').filter(e => e.data.exchange).length, 0);
    assert.ok(o.emitted('npc_chatted:').some(e => e.data.line), 'a bark instead');
});

test('exchange: with no audience it stays unplayed and the pair barks or shows pictures', () => {
    const o = office({ ann: EX, bob: {} }, { hears: false });
    o.sys.step(30000);
    assert.equal(o.emitted('npc_exchange_heard:').length, 0);
    assert.equal(o.globals.heard_ex_rota, undefined);
    assert.equal(o.emitted('npc_chatted:').filter(e => e.data.exchange).length, 0);
    assert.ok(o.emitted('npc_chatted:').length >= 2);
    assert.equal(o.sys._exPlayed.size, 0);
    // The player walks up during a later meeting: now it plays
    let hearing = false;
    const p = office({ ann: EX, bob: {} }, { hears: () => hearing });
    p.sys.step(6000);
    assert.equal(p.emitted('npc_chatted:').filter(e => e.data.exchange).length, 0);
    hearing = true;
    p.sys.step(30000);
    assert.equal(p.emitted('npc_exchange_heard:ex_rota').length, 1);
});

test('exchange: requireGlobal, `with` by group, other speakers refused, story still loading', () => {
    const gated = office({ ann: { exchanges: [{ with: 'bob', knot: 'ex_rota', requireGlobal: 'rota_out' }] }, bob: {} });
    gated.sys.step(30000);
    assert.equal(gated.emitted('npc_exchange_heard:').length, 0, 'global not set');
    const open = office({ ann: { exchanges: [{ with: 'bob', knot: 'ex_rota', requireGlobal: 'rota_out' }] }, bob: {} }, { globals: { rota_out: true } });
    open.sys.step(30000);
    assert.equal(open.emitted('npc_exchange_heard:').length, 1);
    const grp = office({ ann: { exchanges: [{ with: 'group:team', knot: 'ex_rota' }] }, bob: { needsCompany: { groups: ['team'] } } });
    grp.sys.step(30000);
    assert.equal(grp.emitted('npc_exchange_heard:').length, 1, 'group match');
    const stranger = office({ ann: EX, bob: {} }, { lines: [...LINES, { speakerId: 'cat', text: 'Me too.' }] });
    stranger.sys.step(30000);
    assert.equal(stranger.emitted('npc_exchange_heard:').length, 0, 'a third speaker: not played');
    let ready = false;
    const loading = office({ ann: EX, bob: {} }, { lines: () => (ready ? LINES : null) });
    loading.sys.step(4000);
    assert.equal(loading.emitted('npc_chatted:').filter(e => e.data.exchange).length, 0);
    ready = true;
    loading.sys.step(30000);
    assert.equal(loading.emitted('npc_exchange_heard:').length, 1, 'tried again once the story arrived');
    // Bob's own list names ann: the pair is found either way
    const other = office({ ann: {}, bob: { exchanges: [{ with: 'ann', knot: 'ex_rota' }] } });
    other.sys.step(30000);
    assert.equal(other.emitted('npc_exchange_heard:ex_rota')[0].data.ownerId, 'bob');
    assert.ok(exchangeLineMs('x'.repeat(200)) <= 6000);
});

test('determinism: a whole chatter run with Math.random set to throw', () => {
    const real = Math.random;
    Math.random = () => { throw new Error('Math.random used'); };
    try {
        const run = () => {
            const o = office({ ann: EX, bob: {}, cat: {} }, { objects: [cooler('c1', 300), cooler('c2', 500)] });
            o.sys.step(60000);
            return o.emitted('npc_').map(e => [e.name, e.data.lineId || null, e.data.speakerId || null]);
        };
        assert.deepEqual(run(), run());
    } finally {
        Math.random = real;
    }
});

// ── the live adapter: separate story instance, voices ───────────────────────

const CAST = [
    { id: 'sanjay', displayName: 'Sanjay Mehta', voice: { name: 'Puck' } },
    { id: 'rosa', displayName: 'Rosa Delgado', voice: { name: 'Leda' } },
    { id: 'tom', displayName: 'Tom Fletcher', voice: { name: 'Charon' } },
    { id: 'amara', displayName: 'Amara Okoye', voice: { name: 'Aoede' } },
    { id: 'mute', displayName: 'Mute Person' }
];

test('prefixes: id or displayName, case-insensitive; npc is the owner; unknown is null', () => {
    assert.deepEqual(splitPrefix('Rosa: I wrote it.'), ['Rosa', 'I wrote it.']);
    assert.deepEqual(splitPrefix('No prefix here'), [null, 'No prefix here']);
    assert.equal(speakerFor('rosa', 'sanjay', CAST), 'rosa');
    assert.equal(speakerFor('Tom Fletcher', 'sanjay', CAST), 'tom');
    assert.equal(speakerFor('npc', 'sanjay', CAST), 'sanjay');
    assert.equal(speakerFor('Nobody', 'sanjay', CAST), null);
});

test('separate story instance: the showcase knots run without touching the NPC\'s conversation state', () => {
    const text = storyText('sanjay');
    // The player's conversation with Sanjay, mid-way through
    const convo = new inkjs.Story(text);
    convo.ChoosePathString('start');
    while (convo.canContinue) convo.Continue();
    const before = convo.state.ToJson();
    const touched = [];
    const prevWindow = globalThis.window;
    globalThis.window = {
        npcConversationStateManager: new Proxy({}, { get: (_, k) => { touched.push(k); return () => {}; } }),
        gameState: { globalVariables: { heard_exchange_rosa_rota: false } }
    };
    try {
        const v = new NpcChatterVoice({ inkjs, getNpc: id => CAST.find(n => n.id === id), allNpcs: () => CAST, storyJson: () => text });
        const lines = v.exchangeLines('sanjay', 'exchange_rosa_rota');
        assert.deepEqual(lines.map(l => l.speakerId), ['sanjay', 'rosa', 'sanjay', 'rosa', 'sanjay']);
        assert.equal(lines[1].text, 'I wrote it. Is something wrong with it?', 'prefix stripped: the text sent to /tts');
        assert.deepEqual(v.exchangeLines('sanjay', 'exchange_rosa_rota'), lines, 'a fresh instance each time');
        assert.equal(convo.state.ToJson(), before, 'the conversation story is untouched');
        assert.deepEqual(touched, [], 'the conversation state manager is never used');
        const amara = new NpcChatterVoice({ inkjs, getNpc: id => CAST.find(n => n.id === id), allNpcs: () => CAST, storyJson: () => storyText('amara') });
        assert.deepEqual(amara.exchangeLines('amara', 'exchange_tom_parcel').map(l => l.speakerId), ['tom', 'amara', 'tom', 'amara']);
    } finally {
        globalThis.window = prevWindow;
    }
    // A story that is not loaded yet: null, and the load starts
    let loads = 0;
    const lazy = new NpcChatterVoice({ inkjs, getNpc: id => CAST.find(n => n.id === id), allNpcs: () => CAST, storyJson: () => null, loadStory: async () => { loads++; return text; } });
    assert.equal(lazy.exchangeLines('sanjay', 'exchange_rosa_rota'), null);
    assert.equal(loads, 1);
    // exchangeLinesFromStory on a bare story
    const bare = new inkjs.Story(text);
    assert.equal(exchangeLinesFromStory(bare, 'exchange_rosa_rota', 'sanjay', CAST).length, 5);
});

test('voice: one line at a time, in the speaker\'s own TTS, only with a voice, in the player\'s room, unmuted', async () => {
    const plays = [];
    let busy = 0;
    const makeTts = (id) => ({
        audio: {},
        async play(npcId, text) {
            busy++;
            assert.equal(busy, 1, 'never two lines at once');
            plays.push({ id, npcId, text });
            await new Promise(r => setTimeout(r, 5));
            busy--;
            return 15;
        }
    });
    let muted = false;
    const v = new NpcChatterVoice({
        getNpc: id => CAST.find(n => n.id === id), allNpcs: () => CAST, makeTts,
        playerRoom: () => 'office', npcRoom: id => (id === 'tom' ? 'kitchen' : 'office'), distance: () => 100, muted: () => muted
    });
    v.say('sanjay', 'Have you seen the new kitchen rota?', { knot: 'exchange_rosa_rota' });
    v.say('rosa', 'I wrote it. Is something wrong with it?', { knot: 'exchange_rosa_rota' });
    v.say('tom', 'Oh, forget it.', { topic: 'grumble' });
    v.say('mute', 'Hello.', {});
    muted = true;
    await v.say('amara', 'Is it Friday yet?', {});
    assert.deepEqual(plays.map(p => [p.id, p.npcId, p.text]), [
        ['sanjay', 'sanjay', 'Have you seen the new kitchen rota?'],
        ['rosa', 'rosa', 'I wrote it. Is something wrong with it?']
    ]);
    assert.deepEqual(v.log.map(e => [e.npcId, e.spoken, e.reason || null]), [
        ['tom', false, 'other_room'], ['mute', false, 'no_voice'], ['amara', false, 'muted'],
        ['sanjay', true, null], ['rosa', true, null]
    ].sort((a, b) => (a[1] === b[1] ? 0 : a[1] ? 1 : -1)));
    assert.ok(v.log.filter(e => e.spoken).every(e => e.volume > 0 && e.volume <= 1));
});
