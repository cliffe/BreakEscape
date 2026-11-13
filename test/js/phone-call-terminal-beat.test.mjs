// Sweep item 10 (M6 R1 M2): a terminal-look call has no call screen and no "Call ended" beat, so
// #exit_conversation closed the phone at once and the last line of every Architect call showed for
// under 50 ms. _completeRingerCallWithBeat now holds a read beat before closing in the terminal look,
// and where the last clip is still playing it waits for it to finish first. The handset "Call ended"
// beat is unchanged.
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
const { TERMINAL_CALL_END_READ_MS, FORCED_CALL_END_CLOSE_MS } = lock;
const CALL_ENDED_BEAT_MS = 900;   // the module-local handset beat
const POLL = 200;

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

/** A fake clock on globalThis.setTimeout / clearTimeout. */
function clock() {
    let now = 0; let seq = 0; let timers = [];
    globalThis.setTimeout = (fn, ms) => { const id = ++seq; timers.push({ id, at: now + (ms || 0), fn }); return id; };
    globalThis.clearTimeout = (id) => { timers = timers.filter((t) => t.id !== id); };
    return (ms) => {
        now += ms;
        for (;;) {
            const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at)[0];
            if (!due) break;
            timers = timers.filter((t) => t !== due);
            due.fn();
        }
    };
}

function minigame({ terminal, playing = false }) {
    const state = { playing, completed: [] };
    const i = Object.create(PhoneChatMinigame.prototype);
    i.params = { ringerCall: { id: 'c1' }, theme: terminal ? 'terminal' : undefined };
    i.gameState = { isActive: true };
    i.complete = (v) => { state.completed.push(v); i.gameState.isActive = false; };
    i.ui = { showCallEnded: () => !terminal };   // the handset draws a call screen; the terminal does not
    i._callVoice = { stop() { state.playing = false; }, tts: { isPlaying: () => state.playing } };
    return { i, state };
}

test('the handset "Call ended" beat is unchanged: closes after the beat, not at once', () => {
    const tick = clock();
    const { i, state } = minigame({ terminal: false });
    i._completeRingerCallWithBeat();
    tick(CALL_ENDED_BEAT_MS - 100);
    assert.deepEqual(state.completed, [], 'not closed before the beat');
    tick(200);
    assert.deepEqual(state.completed, [true], 'closed after the beat');
});

test('a terminal call that closes itself holds a read beat before closing, not an instant close', () => {
    const tick = clock();
    const { i, state } = minigame({ terminal: true, playing: false });
    i._completeRingerCallWithBeat(true);   // #exit_conversation or the story's end
    tick(0);
    assert.deepEqual(state.completed, [], 'the phone does not close the instant the call ends');
    tick(TERMINAL_CALL_END_READ_MS - 200);
    assert.deepEqual(state.completed, [], 'still readable through the read beat');
    tick(300);
    assert.deepEqual(state.completed, [true], 'closes once the read beat is up');
});

test('a terminal call the player hangs up closes at once, no read beat (R1 m3)', () => {
    const tick = clock();
    const { i, state } = minigame({ terminal: true, playing: false });
    i._completeRingerCallWithBeat(false);   // the back arrow / Esc: a player hang-up
    tick(0);
    assert.deepEqual(state.completed, [true], 'the back arrow closes the terminal call at once');
});

test('a terminal call with its last clip still playing waits for the clip, then the read beat', () => {
    const tick = clock();
    const { i, state } = minigame({ terminal: true, playing: true });
    i._completeRingerCallWithBeat(true);
    tick(2000);
    assert.deepEqual(state.completed, [], 'does not close while the clip is playing');
    state.playing = false;               // the clip finished
    tick(POLL + 10);                     // the poll notices
    tick(TERMINAL_CALL_END_READ_MS - 100);
    assert.deepEqual(state.completed, [], 'then the read beat runs');
    tick(200);
    assert.deepEqual(state.completed, [true], 'closes after the clip and the read beat');
});

test('the terminal read beat is idempotent: a second call schedules nothing new', () => {
    const tick = clock();
    const { i, state } = minigame({ terminal: true, playing: false });
    i._completeRingerCallWithBeat(true);
    i._completeRingerCallWithBeat(true);      // e.g. two story-end paths both reach it
    tick(TERMINAL_CALL_END_READ_MS + 100);
    assert.deepEqual(state.completed, [true], 'closed exactly once');
});

// ---- R2 n5: the read beat's call sites pass the right selfClose -------------------------------
// _completeRingerCallWithBeat is correct per the tests above; what was untested is that each entry
// point hands it the right selfClose: a player hang-up (closeConversation) is false, the call closing
// itself (#exit_conversation, a forced call's story end) is true. A recorder stands in for the beat.
function callerInstance() {
    const calls = [];
    const i = Object.create(PhoneChatMinigame.prototype);
    i.params = { ringerCall: { id: 'c1' } };
    i.gameState = { isActive: true };
    i.currentNPCId = 'hax';
    i._callVoice = { stop() {} };
    i._completeRingerCallWithBeat = (selfClose = false) => { calls.push(selfClose); };
    i._flushPendingMessages = () => {};
    i._resetAfterRingerCall = () => {};
    i._endSocialRun = () => {};
    i._emitConversationClosed = () => {};
    i.saveStoryState = () => {};
    i.ui = { showContactList() {} };
    return { i, calls };
}

test('closeConversation (End / the back arrow) completes the ringer call as a player hang-up (selfClose false)', () => {
    const { i, calls } = callerInstance();
    i.closeConversation();
    assert.deepEqual(calls, [false], 'the player hung up: no terminal read beat');
});

test('_exitRingerCall (#exit_conversation) completes the ringer call as a self-close (selfClose true)', () => {
    const { i, calls } = callerInstance();
    i._exitRingerCall();
    assert.deepEqual(calls, [true], 'the call closed itself: a read beat');
});

test('_releaseForcedCall (a forced call whose story ended) self-closes after the close delay (selfClose true)', async () => {
    const tick = clock();
    const { i, calls } = callerInstance();
    i._releaseForcedCall();
    await Promise.resolve();                   // whenSessionOverlayClosed() resolves, scheduling the timer
    assert.deepEqual(calls, [], 'nothing before the close delay');
    tick(FORCED_CALL_END_CLOSE_MS);
    assert.deepEqual(calls, [true], 'self-close once the forced-call timer fires');
});
