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

globalThis.window = { eventDispatcher: null, dismissPhoneHitNotice() {} };
globalThis.__stubs = {
    lock,
    callHomeKnot: (npc) => String(npc?.homeKnot || npc?.currentKnot || 'start').split('.')[0],
};
const noop = () => {};
const header = `
const S = globalThis.__stubs;
const { phoneCloseLocked, phoneEscapeAction, FORCED_CALL_END_CLOSE_MS } = S.lock;
const callHomeKnot = S.callHomeKnot;
class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } addEventListener() {} }
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot(story) { return story && story.__knot || null; } }
const attachPretext = async () => null, processGameActionTags = () => {}, choiceAsksEnding = () => false,
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

test('both #exit_conversation paths (after a choice, and the continue path) are wired for a ringer call', () => {
    const s = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    const present = s.slice(s.indexOf('async _presentOutput'));
    assert.match(present.slice(0, 6000), /this\.params\?\.ringerCall && accumulatedTags\.some\(tag => String\(tag\)\.includes\('exit_conversation'\)\)\) \{\s*\n\s*this\._exitRingerCall\(\);/);
    const afterChoice = s.slice(s.indexOf("const shouldExit = accumulatedTags.some"));
    assert.match(afterChoice.slice(0, 600), /if \(this\.params\?\.ringerCall\) \{\s*\n\s*this\._exitRingerCall\(\);/);
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

// ---- buttons ------------------------------------------------------------------------------

test('wiring: a ringer call has no Cancel and no Add to Notepad; the x is End call', () => {
    const s = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    assert.match(s, /if \(this\.params\.ringerCall\) this\.params\.showCancel = false;/);
    assert.match(s, /if \(this\.controlsElement && !this\.params\.ringerCall\) \{/);
    assert.match(s, /endBtn\.setAttribute\('aria-label', 'End call'\)/);
    assert.match(s, /closeBtn\.cloneNode\(true\);\s*\/\/ drops the base complete\(false\) listener/);
    assert.match(readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ringer-dom.js'), 'utf8'), /showCancel: false/);
});
