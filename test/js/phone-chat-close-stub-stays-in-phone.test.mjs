// A cosmetic "(Close.)" home stub (tagged #exit_conversation) closes the thread card and returns
// to the phone's contact list, instead of closing the whole phone (m05 Patricia after a missed ring).
// A ringer call and a forced call keep their own close paths.
// Run with: node --test test/js/phone-chat-close-stub-stays-in-phone.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
const m = src.match(/\n    _stubExitStaysInPhone\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, '_stubExitStaysInPhone found');
const stays = new Function('phoneCloseLocked', `return function (${m[1]}) {\n${m[2]}\n};`)(
    (params) => params?.disableClose === true);

test('the decision: silent stub stays, spoken, forced and #close_phone do not', () => {
    assert.equal(stays.call({ params: {} }, true, ['exit_conversation']), true);
    assert.equal(stays.call({ params: {} }, false, ['exit_conversation']), false);
    assert.equal(stays.call({ params: { disableClose: true } }, true, ['exit_conversation']), false);
    assert.equal(stays.call({ params: {} }, true, ['exit_conversation', 'close_phone']), false);
    assert.equal(stays.call({ params: {} }, true, ['speaker:x', ' close_phone ']), false);
});

// ---- behavioural: the real handleChoice on the real class, stubbed DOM and story ----
console.log = () => {};
console.warn = () => {};
const chat = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (t) => 'data:text/javascript;base64,' + Buffer.from(t).toString('base64');
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
  displayPhoneLine = () => ({}), phoneStepLines = (t) => (t && t.trim() ? [t] : []), choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = (p) => p && p.voiced === true,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), callHomeKnot = () => 'start', deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({});
function noop() {}
`;
const psrc = src.replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(header + psrc));

function openThread(params, choiceText, tags) {
    const events = [];
    const log = { contactList: 0, completed: 0, messages: [] };
    window.eventDispatcher = { emit: (name, data) => events.push([name, data]) };
    window.phoneRinger = { unregisterPhone() {} };
    const inst = Object.create(PhoneChatMinigame.prototype);
    inst.params = { phoneId: 'player_phone', npcId: 'patricia', ...params };
    inst.phoneId = 'player_phone';
    inst.currentNPCId = 'patricia';
    inst.isConversationActive = true;
    inst.conversation = {
        cleanup() {},
        makeChoice: () => ({ text: '', tags, canContinue: false, choices: [], hasEnded: false }),
        continue: () => ({ text: '', tags: [], canContinue: false, choices: [], hasEnded: true }),
    };
    inst.history = { addMessage() {} };
    inst.ui = {
        elements: { choicesContainer: { querySelectorAll: () => [{ dataset: { text: choiceText }, textContent: choiceText }] } },
        clearChoices() {},
        addMessage: (who, t) => log.messages.push([who, t]),
        showContactList: () => { log.contactList++; },
        cleanup() {},
    };
    inst._pace = () => Promise.resolve();
    inst._resetSkip = () => {};
    inst._saveStoryStateFor = () => {};
    inst._applyLineTags = () => {};
    inst.saveStoryState = () => {};
    inst._flushPendingMessages = () => {};
    inst._endSocialRun = () => {};
    inst._placeCallFromTags = () => false;
    inst.complete = () => { log.completed++; };
    return { inst, events, log };
}
const closed = (events) => events.filter(([n]) => n.startsWith('conversation_closed'));

test('behavioural: a silent (Close.) stub returns to the contact list, phone stays open, closed once', async () => {
    const { inst, events, log } = openThread({}, '(Close.)', ['exit_conversation']);
    await inst.handleChoice(0);
    assert.equal(log.contactList, 1, 'contact list shown');
    assert.equal(log.completed, 0, 'phone not closed');
    assert.equal(closed(events).length, 1, 'conversation_closed fired once');
    assert.equal(inst.conversation, null, 'thread torn down');
    assert.deepEqual(log.messages, [], 'a silent stub posts no sent bubble');
});

test('behavioural: a silent stub tagged #close_phone closes the phone', async () => {
    const { inst, events, log } = openThread({}, '(Put the phone away.)', ['exit_conversation', 'close_phone']);
    await inst.handleChoice(0);
    assert.equal(log.completed, 1, 'phone closed');
    assert.equal(log.contactList, 0, 'contact list not shown');
    assert.equal(closed(events).length, 0, 'closeConversation not run here (cleanup emits it)');
});

test('behavioural: a forced call (disableClose) closes the phone for a silent stub', async () => {
    const { inst, log } = openThread({ disableClose: true }, '(Close.)', ['exit_conversation']);
    await inst.handleChoice(0);
    assert.equal(log.completed, 1);
    assert.equal(log.contactList, 0);
});

test('behavioural: a spoken exit choice closes the phone', async () => {
    const { inst, log } = openThread({}, 'Right, bye.', ['exit_conversation']);
    await inst.handleChoice(0);
    assert.equal(log.completed, 1);
    assert.equal(log.contactList, 0);
});

test('the exit branch passes the batch tags to the decision, before complete(true)', () => {
    const i = src.indexOf('this._stubExitStaysInPhone(silentChoice, accumulatedTags)');
    const j = src.indexOf('this.complete(true);', i);
    assert.ok(i > 0 && j > i);
    assert.match(src.slice(i, j), /this\.closeConversation\(\);\s*return;/);
});
