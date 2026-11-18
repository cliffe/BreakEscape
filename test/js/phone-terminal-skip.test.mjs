// Terminal phone chat: click / Space / Enter skips the typeout. One press finishes the line being
// typed; a press in the "receiving_" indicator or the pause between lines skips all the waits and
// types the rest whole, so the choices come at once. Nobody pressing sees the old timings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

console.log = () => {};
console.warn = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const chat = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;

const uiStubs = `
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '';
const noop = () => {};
const portraitFor = () => ({}), npcDmFields = () => ({}), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({}),
  isPhoneCallMode = () => false, callLabelFor = noop, formatCallDuration = noop, callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;
const uiSrc = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const uiMod = await import(dataUrl(uiStubs + uiSrc));
const UI = uiMod.PhoneChatUI || uiMod.default;

const mgHeader = `
const noop = () => {};
class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } addEventListener() {} cleanup() {} }
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot() { return null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const phoneCloseLocked = noop, phoneEscapeAction = noop, FORCED_CALL_END_CLOSE_MS = 0, TERMINAL_CALL_END_READ_MS = 0,
  attachPretext = async () => null, processGameActionTags = noop, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}),
  classifyPhoneLine = (t, raw) => ({ type: 'npc', text: raw }),
  displayPhoneLine = () => ({}), phoneStepLines = () => [], choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = () => false,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), callHomeKnot = () => 'start', deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({});
`;
const mgSrc = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(mgHeader + mgSrc));

function clock() {
    let now = 0, seq = 0, timers = [];
    globalThis.setTimeout = (fn, ms) => { const id = ++seq; timers.push({ id, at: now + (ms || 0), fn }); return id; };
    globalThis.clearTimeout = (id) => { timers = timers.filter((t) => t.id !== id); };
    const settle = () => new Promise((r) => setImmediate(r));
    return {
        get now() { return now; },
        async advance(ms) {
            const end = now + ms;
            await settle();
            for (;;) {
                const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
                if (!due) break;
                now = due.at; timers = timers.filter((t) => t !== due); due.fn();
                await settle();
            }
            now = end;
            await settle();
        },
        restore() { globalThis.setTimeout = realSetTimeout; globalThis.clearTimeout = realClearTimeout; },
    };
}

function rig() {
    document.body.innerHTML = '<div id="host"><div id="messages-container"></div><div id="choices-container"><button class="choice-button">1. Go</button></div><div id="typing-indicator" style="display:none"></div></div>';
    const ui = Object.create(UI.prototype);
    ui.isTerminalTheme = true;
    ui.isCallMode = false;
    ui.elements = {
        messagesContainer: document.getElementById('messages-container'),
        choicesContainer: document.getElementById('choices-container'),
        typingIndicator: document.getElementById('typing-indicator'),
    };
    ui.scrollToBottom = () => {};
    ui.addChoices = () => { ui._choicesShown = true; };
    const shown = [];
    const mg = Object.create(PhoneChatMinigame.prototype);
    mg.ui = ui;
    mg.params = { theme: 'terminal' };
    mg.isConversationActive = true;
    mg._typeoutRun = 1;
    mg.history = { addMessage() {} };
    mg.saveStoryState = () => {};
    mg._placeCallFromTags = () => false;
    mg._releaseForcedCall = () => {};
    mg._finishPretextCall = () => false;
    mg._notifyConversationEnded = () => {};
    mg._endingKeptGoing = async () => false;
    const origAdd = ui.addMessage;
    ui.addMessage = async function (type, text) { await origAdd.call(this, type, text, true); shown.push(text); };
    return { ui, mg, shown, text: () => [...document.querySelectorAll('.message-bubble .message-text')].map((e) => e.textContent) };
}
const RESULT = { choices: [{ text: 'a' }], canContinue: false, hasEnded: false };
const LINES = ['First line of the reply.', 'Second line here.', 'Third line now.'];
// 3 lines: 3 x (1000 indicator + 28/char + 700 blink) + 2 x 400 pause
const FULL_MS = LINES.reduce((a, l) => a + 1000 + l.length * 28 + 700, 0) + 800;

async function startRun(r, c) {
    const done = r.mg._presentOutput([...LINES], [], RESULT, { tagsApplied: true });
    await c.advance(0);
    return done;
}

test('no press: the original timings, choices only after the full wait', async () => {
    const c = clock(); const r = rig();
    try {
        const done = startRun(r, c);
        await c.advance(FULL_MS - 200);
        assert.equal(r.ui._choicesShown, undefined);
        await c.advance(400);
        await done;
        assert.equal(r.ui._choicesShown, true);
        assert.deepEqual(r.text(), LINES);
    } finally { c.restore(); }
});

test('one click while typing finishes that line at once; the waits stay', async () => {
    const c = clock(); const r = rig();
    try {
        startRun(r, c);
        await c.advance(1000 + 5 * 28);   // indicator over, five characters typed
        assert.ok(r.mg.ui.isTypewriting());
        assert.ok(r.text()[0].length < LINES[0].length);
        assert.equal(r.mg._onSkipPress(), true);
        await c.advance(0);
        assert.equal(r.text()[0], LINES[0]);
        assert.equal(r.ui.isTypewriting(), false);
        assert.equal(document.querySelector('.terminal-cursor'), null);
        assert.equal(r.ui._choicesShown, undefined);
        assert.equal(r.mg._skipAll, false);
        await c.advance(300);   // still in the pause
        assert.equal(r.text().length, 1);
    } finally { c.restore(); }
});

test('a second press in the indicator or pause skips every remaining wait', async () => {
    const c = clock(); const r = rig();
    try {
        const done = startRun(r, c);
        await c.advance(1000 + 5 * 28);
        r.mg._onSkipPress();                 // finish line 1
        await c.advance(100);                // in the 400 ms pause
        assert.ok(r.mg._paceWake, 'waiting in the pause');
        assert.equal(r.mg._onSkipPress(), true);
        await c.advance(0);
        await done;
        assert.equal(r.ui._choicesShown, true);
        assert.deepEqual(r.text(), LINES);
        assert.ok(c.now < 1000 + 5 * 28 + 100 + 50, 'choices came at once, not after the full wait');
        assert.equal(r.ui.isTypewriting(), false);
    } finally { c.restore(); }
});

test('a press during the receiving indicator skips it and the rest', async () => {
    const c = clock(); const r = rig();
    try {
        const done = startRun(r, c);
        await c.advance(300);
        assert.equal(r.ui.elements.typingIndicator.style.display, 'flex');
        assert.equal(r.mg._onSkipPress(), true);
        await c.advance(0);
        await done;
        assert.deepEqual(r.text(), LINES);
        assert.equal(c.now, 300);
        assert.equal(r.ui.elements.typingIndicator.style.display, 'none');
    } finally { c.restore(); }
});

test('skip state resets for the next reply', async () => {
    const c = clock(); const r = rig();
    try {
        const done = startRun(r, c);
        await c.advance(200); r.mg._onSkipPress(); await c.advance(0); await done;
        assert.equal(r.mg._skipAll, false);
        assert.equal(r.ui._instantType, false);
        const t0 = c.now;
        const done2 = r.mg._presentOutput(['Again.'], [], RESULT, { tagsApplied: true });
        await c.advance(900);
        assert.equal(r.text().length, 3, 'indicator still waiting for the second reply');
        await c.advance(1000);
        await done2;
        assert.ok(c.now - t0 >= 1000);
    } finally { c.restore(); }
});

test('nothing in flight: a press does nothing (so a click elsewhere is left alone)', () => {
    const r = rig();
    assert.equal(r.mg._onSkipPress(), false);
});

test('a non-terminal chat ignores skip presses', async () => {
    const c = clock(); const r = rig();
    try {
        r.ui.isTerminalTheme = false;
        r.mg._paceWake = () => {};
        assert.equal(r.mg._onSkipPress(), false);
    } finally { c.restore(); }
});

function key(init, target) {
    const e = new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    if (target) Object.defineProperty(e, 'target', { value: target });
    return e;
}

test('Space and Enter skip; typing in an input, modifiers and repeats do not', async () => {
    const c = clock(); const r = rig();
    try {
        startRun(r, c);
        await c.advance(1000 + 5 * 28);
        const input = document.createElement('input'); document.body.appendChild(input);
        const ta = document.createElement('textarea');
        for (const el of [input, ta]) {
            const e = key({ key: ' ' }, el);
            r.mg._onSkipKey(e);
            assert.equal(e.defaultPrevented, false);
            assert.ok(r.ui.isTypewriting(), 'a focused text field blocks the skip');
        }
        input.focus();   // focus in a field while the event targets the body
        const e0 = key({ key: 'Enter' }, document.body);
        r.mg._onSkipKey(e0);
        assert.ok(r.ui.isTypewriting());
        input.blur();
        r.mg._onSkipKey(key({ key: ' ', ctrlKey: true }, document.body));
        r.mg._onSkipKey(key({ key: ' ', repeat: true }, document.body));
        r.mg._onSkipKey(key({ key: 'a' }, document.body));
        assert.ok(r.ui.isTypewriting());
        const e = key({ key: 'Enter' }, document.body);
        r.mg._onSkipKey(e);
        assert.equal(e.defaultPrevented, true);
        assert.equal(r.ui.isTypewriting(), false);
        await c.advance(50);
        const e2 = key({ key: ' ' }, document.body);
        r.mg._onSkipKey(e2);   // in the pause: skip-all
        assert.equal(e2.defaultPrevented, true);
        assert.equal(r.mg._skipAll, true);
    } finally { c.restore(); }
});

test('a skip never touches voice audio: it only finishes text and wakes waits', async () => {
    const c = clock(); const r = rig();
    try {
        let stops = 0;
        r.mg._callVoice = { skip() { stops++; }, stop() { stops++; } };
        startRun(r, c);
        await c.advance(1000 + 3 * 28);
        r.mg._onSkipPress(); r.mg._onSkipPress();
        assert.equal(stops, 0);
    } finally { c.restore(); }
});

test('_typewriterCancel (phone closed) still ends the line and clears the skip hook', async () => {
    const c = clock(); const r = rig();
    try {
        const p = r.ui._typewriterMessage('hello', false);
        await c.advance(50);
        r.ui._typewriterCancel();
        await p;
        assert.equal(r.ui.isTypewriting(), false);
    } finally { c.restore(); }
});
