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

/** A thread open on `npcId`; `avail` is the live answer of callButtonFor, `placed` collects placeCall calls. */
function openThread({ avail }) {
    const dispatcher = new NPCEventDispatcher();
    window.eventDispatcher = dispatcher;
    const shown = [];
    const placed = [];
    window.phoneRinger = {
        callButtonFor: () => (avail.on ? { label: 'Call', ariaLabel: 'Call X' } : null),
        placeCall: (id) => { placed.push(id); return avail.on; },
        unregisterPhone() {},
    };
    const inst = Object.create(PhoneChatMinigame.prototype);
    inst.params = { phoneId: 'player_phone', npcId: 'hax' };
    inst.currentNPCId = 'hax';
    inst.gameState = { isActive: true };
    inst.conversation = { cleanup() {} };
    inst.ui = { setCallButton: (state) => shown.push(state ? state.label : null), cleanup() {} };
    inst._flushPendingMessages = () => {};
    inst.saveStoryState = () => {};
    inst._emitConversationClosed = () => {};
    inst._resetRingerCallOnTeardown = () => {};
    return { inst, dispatcher, shown, placed };
}

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
    inst.cleanup();
    dispatcher.emit('global_variable_changed:x', {});
    assert.equal(shown.length, 3, 'after cleanup nothing listens');
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
