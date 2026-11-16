// D34 option (c), the faint ambient draw and the conversation mute. An ambient chat turn the player
// cannot hear in full, but within the falloff range (or next door through an open door), draws a bag
// line and voices it faintly; the line never counts as heard (E9), gives way to a full line, ducks
// under a scripted bark, and is dimmed on screen. While a person-chat or phone-chat is open no
// chatter is overheard, voiced or toasted, including an exchange already playing.
// Run with: node --max-old-space-size=2048 test/js/npc-chatter-faint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { NpcChatterVoice } from '../../public/break_escape/js/systems/npc-needs-chatter.js';
import { conversationOpen, openDoorHearing } from '../../public/break_escape/js/systems/room-hearing.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const thirsty = () => ({ thirst: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } });
const cooler = () => ({ id: 'cooler', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 70, useSeconds: 60, capacity: 2, chatter: 'cooler' } });
const POOL = ['Busy day?', 'Did you see the rota?', 'Kettle is broken again.', 'Is it Friday yet?'];

/** ann and bob at a cooler. `ear` = what playerHears says; `faint` = what world.faintVolume says. */
function office({ ear = { overheard: false, distance: 300 }, faint = 0.5, withFaint = true, exchange = false } = {}) {
    const cfg = { npcs: {}, objects: [cooler()] };
    let x = 100;
    for (const id of ['ann', 'bob']) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, needs: thirsty(), ...(exchange && id === 'ann' ? { exchanges: [{ with: 'bob', knot: 'ex_x' }] } : {}) } };
        x += 64;
    }
    const w = makeWorld(cfg);
    const st = { ear, faint, fades: [], spoken: [], globals: {} };
    w.world.globalHolds = cond => requiredGlobalsHold(cond, st.globals);
    w.world.playerHears = () => (typeof st.ear === 'function' ? st.ear() : st.ear);
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.chatterConfig = () => ({ cooler: POOL, login_aloud: POOL });
    w.world.speak = (id, line, info) => st.spoken.push({ id, line, info });
    if (exchange) w.world.exchangeLines = () => [{ speakerId: 'ann', text: 'Was that parcel for you?' }, { speakerId: 'bob', text: 'It was.' }];
    w.world.setGlobal = (n, v) => { st.globals[n] = v; };
    if (withFaint) {
        w.world.faintVolume = () => (typeof st.faint === 'function' ? st.faint() : st.faint);
        w.world.fadeFaint = id => st.fades.push(id);
    }
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const until = (fn, ms = 60000, what = 'condition') => {
        const end = sys.clockMs + ms;
        while (!fn()) { if (sys.clockMs >= end) assert.fail(`timed out waiting for ${what}`); sys.step(NEEDS_TICK_MS); }
    };
    return { w, sys, st, emitted, until };
}

// ── the needs core: the faint draw ───────────────────────────────────────────────────────────────

test('out of earshot but within the falloff range, a chat turn draws a line and voices it faintly', () => {
    const o = office();
    o.until(() => o.st.spoken.length > 0, 90000, 'a faint line');
    const s = o.st.spoken[0];
    assert.ok(POOL.includes(s.line), 'a real pool line, not a picture');
    assert.equal(s.info.faint, true);
    assert.equal(s.info.overheard, false, 'never counts as heard (E9)');
    const turn = o.emitted('npc_chatted:').find(e => e.data.line === s.line);
    assert.equal(turn.data.overheard, false);
    assert.equal(o.emitted('npc_overheard:').length, 0, 'no npc_overheard for a faint line');
    assert.equal(o.sys._heardUntil || 0, 0, 'room tone does not duck for it');
    assert.equal(o.sys.getState('ann').talking?.faint ?? o.sys.getState(s.id).talking?.faint, true, 'talking carries faint, for the dimmed bubble');
    assert.ok(!o.sys.states.get(s.id).chatterQuietUntil, 'the full chatter cooldown is not started by a faint line (R1 M2)');
    assert.ok(o.sys.states.get(s.id).faintQuietUntil > o.sys.clockMs, 'a faint line has its own throttle');
});

test('with no faint volume (too far, a shut door, a conversation, the scenario flag) the turn is a picture and uses no bag line', () => {
    const o = office({ faint: 0 });
    o.sys.step(60000);
    assert.equal(o.st.spoken.length, 0, 'nothing voiced');
    assert.ok(o.emitted('npc_chatted:').some(e => e.data.picture), 'a picture turn');
    assert.ok(!o.sys.states.get('ann').chatterQuietUntil && !o.sys.states.get('bob').chatterQuietUntil, 'no cooldown started');
});

test('a world with no faintVolume keeps today\'s rule (a picture out of earshot)', () => {
    const o = office({ withFaint: false });
    o.sys.step(60000);
    assert.equal(o.st.spoken.length, 0);
});

test('a line the player hears in full is unchanged: voiced, overheard, not faint', () => {
    const o = office({ ear: { overheard: true, distance: 50 } });
    o.until(() => o.st.spoken.length > 0, 90000, 'a heard line');
    assert.equal(o.st.spoken[0].info.overheard, true);
    assert.ok(!o.st.spoken[0].info.faint);
});

test('an exchange never starts faint (E9): faint range alone does not start it', () => {
    const o = office({ exchange: true });
    o.sys.step(80000);
    assert.equal(o.emitted('npc_chatted:').filter(e => e.data.exchange).length, 0, 'no exchange line');
    assert.equal(o.st.globals.heard_ex_x, undefined);
});

// ── preempting ─────────────────────────────────────────────────────────────────────────────────

test('a faint line gives the lock to a line the player hears in full; a faint line never takes it', () => {
    const o = office();
    o.until(() => o.st.spoken.length > 0, 90000, 'a faint line');
    const sys = o.sys, f = sys._faintLine;
    assert.ok(f && sys._speechUntil > sys.clockMs, 'the faint line holds the lock');
    assert.equal(sys._speechFreeFor(true), false, 'a faint asker waits');
    assert.equal(sys._speechFreeFor(false), true, 'a full line takes it');
    assert.deepEqual(o.st.fades, [f.npcId], 'and the faint voice is told to fade');
    assert.equal(sys._faintLine, null);
    assert.equal(sys._speechFree(), true);
});

test('another line (not faint) holds the lock: nothing preempts it', () => {
    const o = office();
    o.sys._speechUntil = o.sys.clockMs + 5000;
    assert.equal(o.sys._speechFreeFor(false), false);
    o.sys._faintLine = { npcId: 'ann', until: o.sys.clockMs + 1000 };   // lock outlasts the faint line: held by another
    assert.equal(o.sys._speechFreeFor(false), false);
    assert.deepEqual(o.st.fades, []);
});

// ── the voice ──────────────────────────────────────────────────────────────────────────────────

const rooms = { office: { doorSprites: [] }, kitchen: { doorSprites: [] } };
function voiceRig(world = {}) {
    const w = { npcRoom: 'office', dist: 300, conversation: false, bark: false, ...world };
    const calls = [], gains = [], stops = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => w.npcRoom, playerRoom: () => 'office',
        doorHearing: (nr, pr) => openDoorHearing(nr, pr, rooms, { north: 'kitchen' }),
        distance: () => w.dist, conversation: () => w.conversation, barkPlaying: () => w.bark,
        makeTts: () => ({ play: async (n, l, o) => { calls.push({ n, l, o }); return w.ms ?? 40; }, setDistanceGain: g => gains.push(g), stop: () => stops.push(1) })
    });
    return { v, w, calls, gains, stops };
}
const wait = ms => new Promise(r => setTimeout(r, ms));

test('faintVolume: in range, through an open door, beyond the falloff range, no voice, conversation', () => {
    const { v, w } = voiceRig();
    assert.ok(v.faintVolume('a') > 0.5 && v.faintVolume('a') < 1, 'in range: the curve');
    w.dist = 481; assert.equal(v.faintVolume('a'), 0, 'beyond the far radius');
    w.dist = 200; w.npcRoom = 'kitchen';
    assert.ok(Math.abs(v.faintVolume('a') - 0.4 * (1 - 0.85 * 40 / 320)) < 1e-9, 'next room through an open door: x0.4');
    w.npcRoom = 'vault'; assert.equal(v.faintVolume('a'), 0, 'a wall');
    w.npcRoom = 'office'; w.conversation = true; assert.equal(v.faintVolume('a'), 0, 'a conversation is open');
    const mute = new NpcChatterVoice({ getNpc: id => ({ id }), muted: () => false, npcRoom: () => 'office', playerRoom: () => 'office', distance: () => 10 });
    assert.equal(mute.faintVolume('a'), 0, 'an NPC with no voice');
});

test('a faint line is voiced at the faint volume and ducks under a scripted bark', async () => {
    const { v, w, calls } = voiceRig({ dist: 320 });
    await v.say('a', 'Murmur.', { faint: true });
    assert.equal(calls[0].o.volume, 0.575);
    assert.equal(v.log.at(-1).faint, true);
    w.bark = true;
    await v.say('a', 'Murmur two.', { faint: true });
    assert.equal(calls[1].o.volume, 0.575 * 0.25, 'quieter under a bark');
    await v.say('a', 'Full line.', { overheard: true });
    assert.equal(calls[2].o.volume, 0.575, 'a full line is not ducked');
});

test('a full line fades a faint one out over about 0.3 s and does not wait for it', async () => {
    const { v, w, calls, gains, stops } = voiceRig({ ms: 3000 });
    const faint = v.say('a', 'Long murmur.', { faint: true });
    await wait(60);
    w.ms = 40;
    const t0 = Date.now();
    const full = v.say('b', 'Full line.', { overheard: true });
    await full;
    assert.ok(Date.now() - t0 < 1200, 'did not wait out the 3 s clip');
    await faint;
    assert.equal(gains.includes(0), true, 'faded to 0');
    assert.ok(stops.length >= 1, 'then stopped');
    assert.equal(calls.length, 2);
    assert.ok(v.log.some(e => e.reason === 'preempted'));
});

// ── the conversation mute ─────────────────────────────────────────────────────────────────────

test('conversationOpen: a phone call that opens and closes (the stale phone-chat type does not count)', () => {
    class PhoneChatMinigame {}
    class PersonChatMinigame {}
    const w = { MinigameFramework: { currentMinigame: null }, currentConversationMinigameType: null };
    assert.equal(conversationOpen(w), false);
    w.MinigameFramework.currentMinigame = new PhoneChatMinigame(); w.currentConversationMinigameType = 'phone-chat';
    assert.equal(conversationOpen(w), true, 'call open');
    w.MinigameFramework.currentMinigame = null;   // the call closed; person-chat alone clears the type, so it stays 'phone-chat'
    assert.equal(conversationOpen(w), false, 'closed, though the type is stale');
    w.MinigameFramework.currentMinigame = new PersonChatMinigame();
    assert.equal(conversationOpen(w), true);
    w.MinigameFramework.currentMinigame = { constructor: { name: 'Lockpick' } }; w.currentConversationMinigameType = null;
    assert.equal(conversationOpen(w), false, 'another minigame is not a conversation');
});

test('R1 M1: after a phone call the sticky type does not make a lockpick minigame a conversation', () => {
    const w = { MinigameFramework: { currentMinigame: { constructor: { name: 'LockpickingMinigamePhaser' }, _sceneType: 'lockpicking' } }, currentConversationMinigameType: 'phone-chat' };
    assert.equal(conversationOpen(w), false);
    w.MinigameFramework.currentMinigame = { constructor: { name: 'X' }, _sceneType: 'phone-chat' };
    assert.equal(conversationOpen(w), true, 'the open minigame\'s own scene type counts');
    w.MinigameFramework.currentMinigame = { constructor: { name: 'X' }, _sceneType: 'person-chat' };
    assert.equal(conversationOpen(w), true);
});

test('R1 M2: a faint line leaves the full cooldown alone, so a heard turn straight after still voices a line', () => {
    const o = office();
    o.until(() => o.st.spoken.length > 0, 90000, 'a faint line');
    const id = o.st.spoken[0].id;
    assert.ok(!o.sys.states.get(id).chatterQuietUntil);
    // the player walks up: the next draw for the same speaker is a heard one and is not on cooldown
    o.st.ear = { overheard: true, distance: 40 };
    o.sys._speechUntil = 0; o.sys._faintLine = null;
    const sp = o.sys.states.get(id);
    sp.faintQuietUntil = o.sys.clockMs + 1000;
    const pick = o.sys._pickBark(sp, 'cooler', { waitForLock: true });
    assert.ok(pick.line, 'a real line, not a picture');
    // and a second faint draw inside the throttle is refused
    sp.faintQuietUntil = o.sys.clockMs + 20000; sp.chatterQuietUntil = 0;
    const again = o.sys._pickBark(sp, 'cooler', { faint: true });
    assert.equal(again.line, null, 'faint throttle holds a second faint line');
});

test('R1 M3: a mutter (login_aloud) takes the lock from a faint line in the same tick', () => {
    const o = office();
    o.until(() => o.st.spoken.length > 0, 90000, 'a faint line');
    assert.ok(o.sys._faintLine && !o.sys._speechFree());
    const n = o.st.spoken.length;
    o.sys.mutter('ann', 'login_aloud');
    assert.equal(o.sys._mutterWaits.length, 0, 'not queued behind the faint line');
    assert.ok(o.st.fades.length >= 1, 'the faint voice was faded');
    assert.ok(o.st.spoken.length >= n);
});

test('say is silent while a conversation is open, and voices again after a call closes', async () => {
    class PhoneChatMinigame {}
    const win = { MinigameFramework: { currentMinigame: null }, currentConversationMinigameType: null };
    const calls = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => 'office', playerRoom: () => 'office', distance: () => 50,
        conversation: () => conversationOpen(win),
        makeTts: () => ({ play: async (n, l) => { calls.push(l); return 20; }, setDistanceGain() {}, stop() {} })
    });
    await v.say('a', 'before the call');
    win.MinigameFramework.currentMinigame = new PhoneChatMinigame(); win.currentConversationMinigameType = 'phone-chat';
    await v.say('a', 'during the call');
    await v.say('a', 'an exchange line during the call', { knot: 'ex', overheard: true });
    win.MinigameFramework.currentMinigame = null;   // hung up: the type stays 'phone-chat'
    await v.say('a', 'after the call');
    assert.deepEqual(calls, ['before the call', 'after the call']);
    assert.deepEqual(v.log.filter(e => !e.spoken).map(e => e.reason), ['conversation', 'conversation']);
});

test('say checks again just before it plays: a conversation that opens while the line is queued', async () => {
    const st = { conv: false };
    const calls = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => 'office', playerRoom: () => 'office', distance: () => 50, conversation: () => st.conv,
        makeTts: () => ({ play: async (n, l) => { calls.push(l); return 60; }, setDistanceGain() {}, stop() {} })
    });
    const first = v.say('a', 'first');
    const second = v.say('a', 'second, queued');
    st.conv = true;
    await first; await second;
    assert.equal(calls.length, 0, 'neither played (the check ran in the queue step)');
    assert.deepEqual(v.log.map(e => e.reason), ['conversation', 'conversation']);
});

test('a line already playing is silenced when a conversation opens, and the clip is stopped', async () => {
    const st = { conv: false };
    const stops = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => 'office', playerRoom: () => 'office', distance: () => 50, conversation: () => st.conv,
        makeTts: () => ({ play: async () => 3000, setDistanceGain() {}, stop: () => stops.push(1) })
    });
    const t0 = Date.now();
    const p = v.say('a', 'A long exchange line.', { knot: 'ex', overheard: true });
    await wait(100);
    st.conv = true;
    await p;
    assert.ok(Date.now() - t0 < 1500, 'ended early');
    assert.equal(stops.length, 1);
    assert.equal(v.log.at(-1).reason, 'conversation');
    assert.equal(v.current, null);
});

// The live adapter: playerHears and speak read the voice's conversation state through window
function engine({ conv }) {
    const spoken = [], toasts = [];
    const win = {
        player: { x: 0, y: 0 }, currentPlayerRoom: 'office',
        npcChatterVoice: { conversationOpen: () => conv.open, say: (id, line) => spoken.push(line), faintVolume: () => 0.4, fadeFaint() {} },
        npcWorldBubbles: { mustShowChatter: (id, line) => toasts.push(line), deferChatterVoice: () => false },
        gameState: { globalVariables: {} }, gameScenario: {}, rooms: {}
    };
    return { win, spoken, toasts };
}
test('the real adapter: playerHears is false and speak voices and toasts nothing while a conversation is open', () => {
    const conv = { open: false };
    const { win, spoken, toasts } = engine({ conv });
    win.npcManager = { npcs: new Map([['ann', { id: 'ann', _sprite: { x: 10, y: 10 }, roomId: 'office' }]]), getNPC: id => win.npcManager.npcs.get(id) };
    const prev = globalThis.window; globalThis.window = win;
    try {
        const w = createEngineWorld();
        w.speak('ann', 'Open line.', { topic: 'cooler' });
        w.speak('ann', 'Exchange line.', { knot: 'ex' });
        assert.deepEqual(spoken, ['Open line.', 'Exchange line.'], 'voiced when no conversation is open');
        assert.deepEqual(toasts, ['Exchange line.']);
        conv.open = true;
        assert.deepEqual(w.playerHears('ann', 160), { overheard: false, distance: null }, 'nothing is overheard during a chat');
        w.speak('ann', 'During chat.', { topic: 'cooler' });
        w.speak('ann', 'Exchange during chat.', { knot: 'ex' });
        w.speak('ann', 'Call line.', { call: 'phone', overheard: true });
        assert.equal(spoken.length, 2, 'no voice');
        assert.equal(toasts.length, 1, 'no toast');
        conv.open = false;
        w.speak('ann', 'After.', { topic: 'cooler' });
        assert.equal(spoken.at(-1), 'After.', 'chatter is back');
        assert.equal(w.faintVolume('ann'), 0.4);
        win.gameScenario.faintChatter = false;
        assert.equal(w.faintVolume('ann'), 0, 'the scenario flag opts out');
    } finally { globalThis.window = prev; }
});

test('an exchange already playing when a chat opens goes on silently and does not count as heard', () => {
    const o = office({ ear: { overheard: true, distance: 50 }, exchange: true });
    o.until(() => o.emitted('npc_chatted:').filter(e => e.data.exchange).length >= 1, 60000, 'the first exchange line');
    assert.equal(o.emitted('npc_overheard:').length, 1, 'line one was heard');
    o.st.ear = { overheard: false, distance: null };   // a chat opens: playerHears turns false
    o.sys.step(60000);
    const lines = o.emitted('npc_chatted:').filter(e => e.data.exchange);
    assert.equal(lines.length, 2, 'the exchange ran on to its last line');
    assert.equal(lines[1].data.overheard, false, 'the second line was not heard');
    assert.equal(o.emitted('npc_overheard:').length, 1, 'only the first');
    assert.equal(o.st.globals.heard_ex_x, true, 'line one was heard in full, so it is heard');
});
