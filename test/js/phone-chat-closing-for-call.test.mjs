// A3 review round 1 (n1): the phone-chat half of row 10, driven on the real PhoneChatMinigame class
// (imports stubbed, as phone-outgoing-call.test.mjs does): a phone closed for a call emits no
// conversation_closed for its thread, a phone closed any other way emits exactly one, and the state
// the ringer reopens from does not carry the flag.
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

globalThis.window = { eventDispatcher: null, dismissPhoneHitNotice() {}, phoneRinger: null };
globalThis.document = { addEventListener() {}, removeEventListener() {} };
globalThis.__stubs = { lock };
const header = `
const S = globalThis.__stubs;
const { phoneCloseLocked, phoneEscapeAction, FORCED_CALL_END_CLOSE_MS, TERMINAL_CALL_END_READ_MS } = S.lock;
class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } addEventListener() {} cleanup() {} }
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot() { return null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const attachPretext = async () => null, processGameActionTags = noop, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}), classifyPhoneLine = () => ({}),
  displayPhoneLine = () => ({}), phoneStepLines = () => [], choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = (p) => p && p.voiced === true,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), callHomeKnot = () => 'start', deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({});
function noop() {}
`;
const src = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(header + src));

function phone(params = {}, thread = 'other') {
    const events = [];
    const registered = [];
    window.eventDispatcher = { emit: (name, data) => events.push([name, data]) };
    window.phoneRinger = { unregisterPhone: (m) => registered.push(m) };
    const inst = Object.create(PhoneChatMinigame.prototype);
    inst.params = { phoneId: 'player_phone', npcId: thread, startKnot: 'opening', ...params };
    inst.currentNPCId = thread;
    inst.conversation = { cleanup() {} };
    inst.gameState = { isActive: true };
    inst.ui = { cleanup() {} };
    inst._flushPendingMessages = () => {};
    inst._endSocialRun = () => {};
    inst._resetRingerCallOnTeardown = () => {};
    return { inst, events, registered };
}

test('a phone closed for a call (_closingForCall) emits no conversation_closed for its thread on cleanup', () => {
    const { inst, events, registered } = phone({ _closingForCall: true });
    inst.cleanup();
    assert.deepEqual(events, []);
    assert.deepEqual(registered, [inst], 'it still unregisters from the ringer');
});

test('the same phone closed any other way emits conversation_closed once', () => {
    const { inst, events } = phone();
    inst.cleanup();
    assert.deepEqual(events.map(([n]) => n), ['conversation_closed:other']);
});

test('a phone on its contact list emits nothing either way (no thread)', () => {
    const { inst, events } = phone({}, null);
    inst.cleanup();
    assert.deepEqual(events, []);
});

test('callReopenState carries the thread and the params without the flag, and never mutates the live params', () => {
    const { inst } = phone({ _closingForCall: true });
    const state = inst.callReopenState();
    assert.equal(state.thread, 'other');
    assert.equal('_closingForCall' in state.params, false);
    assert.equal(inst.params._closingForCall, true, 'the live phone keeps the flag until it closes');
    assert.equal(state.params.startKnot, 'opening', 'startKnot is dropped by the ringer on reopen, not here');
});
