// A2b: how a ringer call (params.ringerCall) ends in phone-chat (plan 2.5, "Ending", "Story
// position after a call", A2a_NOTES button rules). The A5 cases (dialling, `when`, #place_call)
// are added to this file in A5. The real PhoneChatMinigame class is loaded with its imports
// stubbed, so no harness copy list is involved.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

console.log = () => {};
console.warn = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const chat = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const lock = await import(dataUrl(readFileSync(join(chat, 'phone-call-lock.js'), 'utf8')));
const ringConfig = await import(dataUrl(readFileSync(join(chat, 'phone-ring-config.js'), 'utf8')));
const dialMod = await import(dataUrl(readFileSync(join(chat, 'phone-dial.js'), 'utf8')));

globalThis.window = { eventDispatcher: null, dismissPhoneHitNotice() {} };
globalThis.document = { listeners: [], addEventListener(t, f) { this.listeners.push(f); }, removeEventListener(t, f) { this.listeners = this.listeners.filter((x) => x !== f); } };
globalThis.__stubs = {
    history: {},
    lock,
    ringConfig,
    dialMod,
    startRingback: () => ({ stop() { (globalThis.__stubs.ringbackStops = (globalThis.__stubs.ringbackStops || 0) + 1); } }),
    callHomeKnot: (npc) => String(npc?.homeKnot || npc?.currentKnot || 'start').split('.')[0],
};
const noop = () => {};
const header = `
const S = globalThis.__stubs;
const { phoneCloseLocked, phoneEscapeAction, FORCED_CALL_END_CLOSE_MS } = S.lock;
const callHomeKnot = S.callHomeKnot;
const { placeCallFromTags } = S.ringConfig;
const { DIAL_MS, RING_OUT_MS, NO_ANSWER_BEAT_MS } = S.dialMod;
const startRingback = (...a) => S.startRingback(...a);
class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } addEventListener() {} start() { if (S.baseStart) S.baseStart.call(this); } }
class PhoneChatUI {} class PhoneChatHistory { constructor() { Object.assign(this, S.history); } } class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { constructor() {} static stepKnot(story) { return story && story.__knot || null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const attachPretext = async () => null, processGameActionTags = (tags) => { (S.processed = S.processed || []).push(tags); }, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}), classifyPhoneLine = () => ({}),
  displayPhoneLine = () => ({}), phoneStepLines = () => [], choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = (p) => p && p.voiced === true,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({});
function noop() {}
`;
const src = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8')
    .replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(header + src));

// ---- fixtures ----------------------------------------------------------------------

function timers() {
    const list = [];
    const real = { set: globalThis.setTimeout, clear: globalThis.clearTimeout };
    globalThis.setTimeout = (fn, ms) => { const t = { fn, ms, live: true }; list.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    return {
        list,
        run() { list.filter((t) => t.live).forEach((t) => { t.live = false; t.fn(); }); },
        restore() { globalThis.setTimeout = real.set; globalThis.clearTimeout = real.clear; },
    };
}

function make({ ringer = true, forced = false, knot = 'ring_call', ended = false, choices = true, callKnots = ['ring_call', 'ring_more'] } = {}) {
    const log = { went: [], saved: [], completed: [], closedEvents: [], shown: 0, order: [] };
    const npc = { id: 'caller', homeKnot: 'start', currentKnot: 'ring_call' };
    const story = {
        __knot: knot,
        canContinue: false,
        currentChoices: ended ? [] : (choices ? [{ sourcePath: `${knot}.0` }] : []),
    };
    const inst = Object.create(PhoneChatMinigame.prototype);
    inst.params = { npcId: 'caller', ...(ringer ? { ringerCall: { id: 'call-1' } } : {}), ...(forced ? { disableClose: true } : {}) };
    inst.currentNPCId = 'caller';
    inst.npcManager = { getNPC: () => npc, addMessage() {} };
    inst.conversation = {
        engine: { story },
        callKnots: new Set(callKnots),
        goToKnot(k) { log.order.push('goToKnot'); log.went.push(k); return true; },
        saveState() { return { at: log.went.at(-1) || 'unchanged' }; },
    };
    inst.gameState = { isActive: true };
    inst.complete = (ok) => { log.order.push('complete'); log.completed.push(ok); inst.gameState.isActive = false; };
    inst.ui = { showContactList() { log.shown++; }, getCurrentView: () => 'conversation', cleanup() {} };
    inst.isConversationActive = true;
    inst._endSocialRun = noop;
    inst._pendingNpcMessages = [];
    window.eventDispatcher = { emit(name) { log.order.push('closed'); log.closedEvents.push(name); } };
    inst._saveStoryStateFor = (id, conv) => { log.saved.push(conv.saveState().at); npc.storyState = conv.saveState(); };
    return { inst, log, npc };
}

// ---- End, back arrow, Esc ---------------------------------------------------------------

test('End call mid-choice: the story is reset to the home knot before the conversation is cleared, then it completes once', () => {
    const { inst, log, npc } = make();
    inst.closeConversation();
    assert.deepEqual(log.went, ['start']);
    assert.equal(npc.storyState.at, 'start', 'storyState is on the home knot');
    assert.deepEqual(log.completed, [true], 'complete(true), once, never complete(false)');
    assert.equal(inst._endedByCall, true);
    assert.equal(log.shown, 0, 'the contact list is not shown');
    assert.deepEqual(log.closedEvents, ['conversation_closed:caller'], 'one conversation_closed');
    assert.ok(log.order.indexOf('goToKnot') < log.order.indexOf('closed'), 'reset before the close event');
    assert.ok(log.order.indexOf('closed') < log.order.indexOf('complete'), 'close event before complete');
    assert.equal(inst.conversation, null);
});

test('the back arrow is End call too (same path); Esc is End call and never reaches complete(false)', () => {
    const { inst, log } = make();
    let prevented = 0;
    inst.handleKeyPress({ key: 'Escape', preventDefault() { prevented++; } });
    assert.deepEqual(log.completed, [true]);
    assert.equal(prevented, 1);
    assert.equal(inst._endedByCall, true);
});

test('Esc on a forced ringer call does nothing', () => {
    const { inst, log } = make({ forced: true });
    inst.handleKeyPress({ key: 'Escape', preventDefault() {} });
    assert.deepEqual(log.completed, []);
});

test('Esc on a text thread and on a legacy voiced call keeps its old behaviour', () => {
    const plain = make({ ringer: false });
    plain.inst.handleKeyPress({ key: 'Escape', preventDefault() {} });
    assert.equal(plain.log.shown, 1, 'back to the contact list');
    assert.deepEqual(plain.log.completed, []);
});

test('a legacy voiced call (no ringerCall): End shows the contact list, the minigame stays open, the story is not reset', () => {
    const { inst, log, npc } = make({ ringer: false });
    inst.closeConversation();
    assert.equal(log.shown, 1);
    assert.deepEqual(log.completed, []);
    assert.deepEqual(log.went, []);
    assert.equal(npc.storyState, undefined);
    inst._resetAfterRingerCall();
    assert.deepEqual(log.went, [], 'the helper does nothing without ringerCall');
});

// ---- #exit_conversation ------------------------------------------------------------------

test('#exit_conversation on a ringer call: saves, resets, marks the own-path end, completes', () => {
    const { inst, log, npc } = make();
    inst.saveStoryState = () => { log.order.push('save'); };
    inst._exitRingerCall();
    assert.deepEqual(log.completed, [true]);
    assert.equal(inst._endedByCall, true);
    assert.equal(npc.storyState.at, 'start');
    assert.ok(log.order.indexOf('save') < log.order.indexOf('goToKnot'));
    assert.ok(log.order.indexOf('goToKnot') < log.order.indexOf('complete'));
});

test('#exit_conversation on the continue path (_presentOutput) closes a ringer call, also with no choices; after "Keep going" it does not', async () => {
    const a = make();
    a.inst.saveStoryState = () => {};
    a.inst._pendingNpcMessages = [];
    await a.inst._presentOutput([], ['exit_conversation'], { choices: [], canContinue: false, hasEnded: false });
    assert.deepEqual(a.log.completed, [true], 'closed through the ringer exit');
    assert.equal(a.inst._endedByCall, true);
    // A2b R1 m2: "Keep going" at #ending_check drops the batch's tags, #exit_conversation with them
    const b = make();
    b.inst.saveStoryState = () => {};
    b.inst._endingKeptGoing = async () => true;
    b.inst.ui.addChoices = noop;
    await b.inst._presentOutput([], ['ending_check', 'exit_conversation'], { choices: [{ text: 'x' }], canContinue: false });
    assert.deepEqual(b.log.completed, [], 'the call the player chose to stay on is not ended');
    // a text thread (no ringerCall) is untouched by the new check
    const c = make({ ringer: false });
    c.inst.saveStoryState = () => {};
    c.inst.ui.addChoices = noop;
    await c.inst._presentOutput([], ['exit_conversation'], { choices: [{ text: 'x' }], canContinue: false });
    assert.deepEqual(c.log.completed, []);
});

// ---- the story's end, and the close gap --------------------------------------------------

test('story end on a non-forced ringer call: _callFinished at once, the reset and complete(true) after 2 s', async () => {
    const t = timers();
    try {
        const { inst, log } = make({ ended: true });
        inst._releaseForcedCall();
        assert.equal(inst._callFinished, true, 'set when the close is scheduled');
        await Promise.resolve(); await Promise.resolve();
        assert.equal(t.list.at(-1).ms, 2000);
        assert.deepEqual(log.completed, []);
        t.run();
        assert.deepEqual(log.went, ['start']);
        assert.equal(inst._endedByCall, true);
        assert.deepEqual(log.completed, [true]);
    } finally { t.restore(); }
});

test('story end on a forced call with no ringerCall: closes after 2 s as before, no reset; a plain text call schedules nothing', async () => {
    const t = timers();
    try {
        const forced = make({ ringer: false, forced: true, ended: true });
        forced.inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        t.run();
        assert.deepEqual(forced.log.completed, [true]);
        assert.deepEqual(forced.log.went, []);
        const before = t.list.length;
        make({ ringer: false, ended: true }).inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        assert.equal(t.list.length, before, 'no close scheduled for a plain thread');
    } finally { t.restore(); }
});

test('close gap: a hit after the story ended but before the timer resets the story (non-forced) and no miss is made of it', () => {
    const t = timers();
    try {
        const { inst, log } = make({ ended: true });
        inst._releaseForcedCall();                // _callFinished set
        inst._resetRingerCallOnTeardown();         // cleanup() from a hit's complete(false)
        assert.deepEqual(log.went, ['start']);
        assert.equal(inst._callFinished, true);
        assert.notEqual(inst._endedByCall, true, 'the adapter reads callFinished, so row 25 not row 32');
    } finally { t.restore(); }
});

// ---- row 32 teardown ----------------------------------------------------------------------

test('knockout or another minigame closing a non-forced ringer call: the story is reset from cleanup (row 32)', () => {
    const { inst, log } = make();
    inst._resetRingerCallOnTeardown();
    assert.deepEqual(log.went, ['start']);
});

test('a forced ringer call closed mid-way keeps its position; with its story ended it takes the reset', () => {
    const mid = make({ forced: true });
    mid.inst._resetRingerCallOnTeardown();
    assert.deepEqual(mid.log.went, []);
    const done = make({ forced: true, ended: true });
    done.inst._callFinished = true;
    done.inst._resetRingerCallOnTeardown();
    assert.deepEqual(done.log.went, ['start']);
});

test('after End, cleanup does not reset again', () => {
    const { inst, log } = make();
    inst.closeConversation();
    inst._resetRingerCallOnTeardown();
    assert.deepEqual(log.went, ['start']);
});

test('a call that diverted out of its knots is left where it is', () => {
    const { inst, log } = make({ knot: 'elsewhere' });
    inst.closeConversation();
    assert.deepEqual(log.went, []);
    assert.deepEqual(log.completed, [true]);
});

test('the reset runs once and only for a ringer call', () => {
    const { inst, log } = make();
    inst._resetAfterRingerCall();
    inst._resetAfterRingerCall();
    assert.deepEqual(log.went, ['start']);
});

test('A3 R1 m1: after the move to the home knot the reset reads it ahead against the thread\'s history, before it saves', () => {
    const { inst, log } = make();
    const history = [{ type: 'npc', text: 'Hub line.' }];
    inst.npcManager.getConversationHistory = (id) => { log.historyFor = id; return history; };
    inst.conversation.settleOnSeenLines = (h) => { log.order.push('settle'); log.settledWith = h; return true; };
    inst.closeConversation();
    assert.equal(log.historyFor, 'caller');
    assert.equal(log.settledWith, history);
    assert.ok(log.order.indexOf('goToKnot') < log.order.indexOf('settle'), 'after the move home');
    assert.deepEqual(log.saved, ['start'], 'saved once, after the settle');
});

test('A3 R1 m1: a call that diverted out of its knots is not settled either', () => {
    const { inst, log } = make({ knot: 'elsewhere' });
    inst.conversation.settleOnSeenLines = () => { log.settled = true; };
    inst.closeConversation();
    assert.equal(log.settled, undefined);
});

// ---- buttons ------------------------------------------------------------------------------

test('wiring: a ringer call has no Cancel and no Add to Notepad; the x is End call', () => {
    const s = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    assert.match(s, /if \(this\.params\.ringerCall\) this\.params\.showCancel = false;/);
    assert.match(s, /if \(this\.controlsElement && !this\.params\.ringerCall\) \{/);
    assert.match(s, /endBtn\.setAttribute\('aria-label', 'End call'\)/);
    assert.match(s, /closeBtn\.cloneNode\(true\);\s*\/\/ drops the base complete\(false\) listener/);
    assert.match(readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ringer-dom.js'), 'utf8'), /showCancel: false/);
});

// ---- A2b live proof findings ----------------------------------------------------------------

test('"Conversation ended" toast: skipped on a ringer call, shown on a plain thread', () => {
    for (const [ringer, expected] of [[true, 0], [false, 1]]) {
        const { inst } = make({ ringer });
        const shown = [];
        inst.ui.showNotification = (m) => shown.push(m);
        inst._notifyConversationEnded();
        assert.equal(shown.length, expected, `ringer=${ringer}`);
    }
    const s = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    assert.equal((s.match(/showNotification\('Conversation ended'/g) || []).length, 1, 'only the helper raises it');
});

test('a ringer call screen does not draw the thread history; a text thread and a terminal-look call do', async () => {
    for (const [ringer, theme, expected] of [[true, undefined, 0], [false, undefined, 1], [true, 'terminal', 1]]) {
        const { inst } = make({ ringer });
        if (theme) inst.params.theme = theme;
        const drawn = [];
        inst.ui.showConversation = () => {};
        inst.ui.addMessages = (h) => drawn.push(h);
        inst.npcManager = { getNPC: () => ({ id: 'caller', currentKnot: 'start' }), addMessage() {} };
        __stubs.history.loadHistory = () => [{ type: 'npc', text: 'Queue One here.' }];
        __stubs.history.markAllRead = () => {};
        window.barkSystem = { dismissBarksForOpenThread() { throw new Error('STOP'); } };
        await assert.rejects(inst.openConversation('caller'), /STOP/);
        window.barkSystem = null;
        assert.equal(drawn.length, expected, `ringer=${ringer} theme=${theme}`);
    }
});

// ---- Esc: the base handler, "Call ended m:ss" ---------------------------------------------

test('m1: with the real base minigame, the base Esc handler is dropped on a ringer call, so Esc is End call whatever the listener order', async () => {
    const baseSrc = readFileSync(join(here, '../../public/break_escape/js/minigames/framework/base-minigame.js'), 'utf8')
        .replace(/^import [\s\S]*?;\s*$/gm, 'const displayDashes = (s) => s;');
    const { MinigameScene: RealBase } = await import(dataUrl(baseSrc));
    for (const [first, ringer] of [['phone', true], ['base', true], ['phone', false]]) {
        const { inst, log } = make({ ringer });
        // the real PhoneChatMinigame.start(), over the real base start (it registers the base Esc
        // handler); only the preload and the conversation open are stubbed
        const probe = Object.assign(Object.create(PhoneChatMinigame.prototype), inst);
        probe.params = { ...inst.params };
        probe.complete = (ok) => { log.completed.push(ok); };
        probe.preloadIntroMessages = async () => {};
        probe.openConversation = noop;
        probe.currentNPCId = 'caller';
        probe.gameState = { isActive: true };
        globalThis.__stubs.baseStart = RealBase.prototype.start;
        document.listeners = [];
        const phoneListener = (e) => probe.handleKeyPress(e);
        if (first === 'phone') document.addEventListener('keydown', phoneListener);
        await PhoneChatMinigame.prototype.start.call(probe);
        if (first === 'base') document.addEventListener('keydown', phoneListener);
        const ev = { key: 'Escape', preventDefault() {} };
        for (const f of [...document.listeners]) f(ev);
        if (ringer) assert.ok(!log.completed.includes(false), `order=${first}: never complete(false)`);
        assert.equal(log.completed.filter((x) => x === true).length, ringer ? 1 : 0, `order=${first} ringer=${ringer}`);
        if (!ringer) assert.deepEqual(log.completed, [false], 'a text thread keeps the base Esc handler');
    }
});

test('m5: End call holds "Call ended m:ss" for a beat, then completes once; a second End in the beat is ignored; no beat without a call screen', () => {
    const t = timers();
    try {
        const { inst, log } = make();
        let ended = 0;
        inst.ui.showCallEnded = () => { ended++; return true; };
        inst.closeConversation();
        assert.equal(ended, 1);
        assert.deepEqual(log.completed, [], 'not yet');
        inst.closeConversation();
        t.run();
        assert.deepEqual(log.completed, [true]);
        assert.deepEqual(log.closedEvents, ['conversation_closed:caller'], 'one close event');
        const plain = make();
        plain.inst.ui.showCallEnded = () => false;
        plain.inst.closeConversation();
        assert.deepEqual(plain.log.completed, [true], 'terminal look: at once');
    } finally { t.restore(); }
});

test('A2b R4 m3: End pressed in the two-second story-end gap leaves one beat and one complete timer', async () => {
    const t = timers();
    try {
        const { inst, log } = make({ ended: true });
        let ended = 0;
        inst.ui.showCallEnded = () => { ended++; return true; };
        inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        inst.closeConversation();                  // End, before the 2 s timer fires
        assert.equal(ended, 1);
        t.run();                                   // the 2 s timer and the beat timer
        t.run();                                   // a second beat timer, if one was set
        assert.equal(ended, 1, 'the beat is shown once');
        assert.deepEqual(log.completed, [true], 'complete once');
    } finally { t.restore(); }
});

test('A2b R2 m2: after "Keep going" a text thread still runs the batch tags; a ringer call drops them', async () => {
    for (const ringer of [true, false]) {
        const t = make({ ringer });
        t.inst.saveStoryState = () => {};
        t.inst._endingKeptGoing = async () => true;
        t.inst.ui.addChoices = noop;
        globalThis.__stubs.processed = [];
        await t.inst._presentOutput([], ['complete_task:x', 'ending_check'], { choices: [{ text: 'x' }], canContinue: false });
        assert.equal(globalThis.__stubs.processed.length, ringer ? 0 : 1, `ringer=${ringer}`);
    }
});

test('A2b R2 m4: the Call ended bar is upper case like ON CALL and the call-ended class has a rule', () => {
    const ui = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8');
    assert.match(ui, /label\.textContent = 'CALL ENDED'/);
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    assert.match(css, /\.call-status-bar\.call-ended \{/);
});

// ---- A2b R3 M1: the "Call ended" beat on a story end and #exit_conversation -----------------

test('A2b R3 M1: story end on a ringer call shows the beat, then completes once; terminal look at once; no ringerCall, no beat', async () => {
    const t = timers();
    try {
        const { inst, log } = make({ ended: true });
        let ended = 0;
        inst.ui.showCallEnded = () => { ended++; return true; };
        inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        t.run();                                   // the 2 s timer
        assert.equal(ended, 1, 'the beat is shown');
        assert.equal(inst._callEndedPending, true);
        assert.equal(inst._endedByCall, true);
        assert.deepEqual(log.completed, [], 'not yet');
        t.run();                                   // the beat timer
        assert.deepEqual(log.completed, [true], 'once');
        const term = make({ ended: true });
        term.inst.ui.showCallEnded = () => false;
        term.inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        t.run();
        assert.deepEqual(term.log.completed, [true], 'terminal look: at once');
        const legacy = make({ ringer: false, forced: true, ended: true });
        let l = 0;
        legacy.inst.ui.showCallEnded = () => { l++; return true; };
        legacy.inst._releaseForcedCall();
        await Promise.resolve(); await Promise.resolve();
        t.run();
        assert.equal(l, 0, 'no beat without ringerCall');
        assert.deepEqual(legacy.log.completed, [true]);
    } finally { t.restore(); }
});

test('A2b R3 M1: #exit_conversation (_exitRingerCall) shows the beat then completes once; both callers; terminal look at once', async () => {
    const t = timers();
    try {
        const a = make();
        let ended = 0;
        a.inst.saveStoryState = () => {};
        a.inst.ui.showCallEnded = () => { ended++; return true; };
        a.inst._exitRingerCall();
        assert.equal(ended, 1);
        assert.deepEqual(a.log.completed, []);
        assert.equal(a.inst._endedByCall, true);
        t.run();
        assert.deepEqual(a.log.completed, [true]);
        // the continue path
        const b = make();
        let e2 = 0;
        b.inst.saveStoryState = () => {};
        b.inst._pendingNpcMessages = [];
        b.inst.ui.showCallEnded = () => { e2++; return true; };
        await b.inst._presentOutput([], ['exit_conversation'], { choices: [], canContinue: false, hasEnded: false });
        assert.equal(e2, 1);
        assert.deepEqual(b.log.completed, []);
        t.run();
        assert.deepEqual(b.log.completed, [true]);
        const c = make();
        c.inst.saveStoryState = () => {};
        c.inst.ui.showCallEnded = () => false;
        c.inst._exitRingerCall();
        assert.deepEqual(c.log.completed, [true]);
    } finally { t.restore(); }
});
