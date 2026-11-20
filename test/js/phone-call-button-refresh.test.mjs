// A5 R1 m2: the header Call button follows the contact's `call` entries while the thread is open
// (a `global_variable_changed` refreshes it), and a press that dials nothing hides it. Driven on the
// real PhoneChatMinigame class with imports stubbed (as phone-chat-closing-for-call.test.mjs does).
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
const NPCEventDispatcher = (await import(dataUrl(readFileSync(join(here, '../../public/break_escape/js/systems/npc-events.js'), 'utf8')))).default;

globalThis.window = { eventDispatcher: null, dismissPhoneHitNotice() {}, phoneRinger: null };
globalThis.document = { addEventListener() {}, removeEventListener() {} };
globalThis.__stubs = { lock };
const header = `
const S = globalThis.__stubs;
const { phoneCloseLocked, phoneEscapeAction, FORCED_CALL_END_CLOSE_MS } = S.lock;
class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } addEventListener() {} cleanup() {} }
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot() { return null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const attachPretext = async () => null, processGameActionTags = noop, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}), classifyPhoneLine = () => ({}),
  displayPhoneLine = () => ({}), phoneStepLines = () => [], choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = (p) => p && p.voiced === true,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), callHomeKnot = () => 'start', deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({}), startRingback = () => ({ stop() {} }),
  placeCallFromTags = () => ({ found: false }), DIAL_MS = 1, RING_OUT_MS = 1, NO_ANSWER_BEAT_MS = 1;
function noop() {}
`;
const src = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(header + src));

/** A thread open on `npcId`; `avail` is the live answer of callButtonFor, `placed` collects placeCall
 *  calls, `dialOk` (default follows `avail`) is what placeCall returns, `notes` collects toasts. */
function openThread({ avail, dialOk }) {
    const dispatcher = new NPCEventDispatcher();
    window.eventDispatcher = dispatcher;
    const shown = [];
    const placed = [];
    const notes = [];
    window.phoneRinger = {
        callButtonFor: () => (avail.on ? { label: 'Call', ariaLabel: 'Call X' } : null),
        placeCall: (id) => { placed.push(id); return dialOk ? dialOk.on : avail.on; },
        unregisterPhone() {},
    };
    const inst = Object.create(PhoneChatMinigame.prototype);
    inst.params = { phoneId: 'player_phone', npcId: 'hax' };
    inst.currentNPCId = 'hax';
    inst.gameState = { isActive: true };
    inst.conversation = { cleanup() {} };
    inst.ui = {
        setCallButton: (state) => shown.push(state ? state.label : null),
        showNotification: (text, kind) => notes.push([text, kind]),
        cleanup() {},
    };
    inst._flushPendingMessages = () => {};
    inst.saveStoryState = () => {};
    inst._emitConversationClosed = () => {};
    inst._resetRingerCallOnTeardown = () => {};
    return { inst, dispatcher, shown, placed, notes };
}

const watchCount = (d) => (d.listeners.get('global_variable_changed:*') || []).length;

test('m2: a button that becomes available while the thread is open appears, and one that becomes unavailable goes', () => {
    const avail = { on: false };
    const { inst, dispatcher, shown } = openThread({ avail });
    inst._refreshCallButton('hax');
    assert.deepEqual(shown, [null]);
    avail.on = true;
    dispatcher.emit('global_variable_changed:flag_distcc_submitted', { value: true });
    assert.deepEqual(shown, [null, 'Call'], 'drawn when the flag turns the entry on');
    avail.on = false;
    dispatcher.emit('global_variable_changed:flag_distcc_submitted', { value: false });
    assert.deepEqual(shown, [null, 'Call', null], 'removed when the entry goes');
});

test('m2: the watch is set once, ignores the contact list and a closing thread, and is removed at cleanup', () => {
    const avail = { on: true };
    const { inst, dispatcher, shown } = openThread({ avail });
    inst._refreshCallButton('hax');
    inst._refreshCallButton('hax');
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 3, 'two opens, one refresh: one listener');
    inst.currentNPCId = null;
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 3, 'on the contact list there is no button to draw');
    inst.currentNPCId = 'hax';
    inst._ending = true;
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 3, 'a thread that is closing is left alone');
    inst._ending = false;
    assert.equal(watchCount(dispatcher), 1, 'one watcher while the thread is open');
    inst.cleanup();
    // A5 n-1 (K8): the watcher is actually removed from the dispatcher, not just left inert because
    // cleanup() nulled this.conversation. Asserting the listener count pins the `off` call.
    assert.equal(watchCount(dispatcher), 0, 'cleanup removes the watcher');
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 3, 'after cleanup nothing listens');
});

test('A5 n-1 (K7): the watch does nothing while a dial is in progress (conversation null), without being removed', () => {
    const avail = { on: true };
    const { inst, dispatcher, shown } = openThread({ avail });
    inst._refreshCallButton('hax');
    assert.equal(shown.length, 1);
    // During a dial the thread is still "open" (id set, not ending, active) but conversation is null.
    inst.conversation = null;
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 1, 'no refresh while dialling');
    assert.equal(watchCount(dispatcher), 1, 'but the watcher is still attached for when the thread returns');
});

test('A5 n-2 (finding 4): a press refused while the entry still applies gives feedback and keeps the button', () => {
    const avail = { on: true };     // the entry still applies (callButtonFor non-null)
    const dialOk = { on: false };   // but the dial is refused (a held call, a paused scene...)
    const { inst, shown, placed, notes } = openThread({ avail, dialOk });
    inst._refreshCallButton('hax');
    inst._pressCall('hax');
    assert.deepEqual(placed, ['hax'], 'the dial was attempted');
    assert.equal(notes.length, 1, 'the player is told');
    assert.match(notes[0][0], /call/i);
    assert.deepEqual(shown, ['Call', 'Call'], 'the button is refreshed, not hidden (the entry still applies)');
});

test('A5 n-2 (finding 4): a press that dials nothing (the entry went away) hides the button with no toast', () => {
    const avail = { on: false };    // callButtonFor now null
    const { inst, shown, placed, notes } = openThread({ avail });
    avail.on = true;                // draw it once
    inst._refreshCallButton('hax');
    avail.on = false;               // the entry goes away
    inst._pressCall('hax');
    assert.deepEqual(placed, ['hax']);
    assert.equal(notes.length, 0, 'no "can\'t call" toast when there was nothing to call');
    assert.deepEqual(shown, ['Call', null], 'the button is hidden');
});

test('m2: a press that dials nothing hides the button', () => {
    const avail = { on: true };
    const { inst, shown, placed } = openThread({ avail });
    inst._refreshCallButton('hax');
    avail.on = false;
    inst._pressCall('hax');
    assert.deepEqual(placed, ['hax']);
    assert.deepEqual(shown, ['Call', null]);
});
