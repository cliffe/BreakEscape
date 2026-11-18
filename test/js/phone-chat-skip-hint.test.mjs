// Terminal phone chat skip hint: visible while a line types or a pause runs, hidden at choices.
// (Harness copied from phone-terminal-skip.test.mjs. One press finishes the line being
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
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({ destroy: noop, pin: noop }),
  isPhoneCallMode = () => false, callLabelFor = noop, formatCallDuration = noop, callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;
const uiSrc = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const uiMod = await import(dataUrl(uiStubs + uiSrc));
const UI = uiMod.PhoneChatUI || uiMod.default;

const mgHeader = `
const noop = () => {};
class MinigameScene {
  constructor(c, p) { this.container = c; this.params = p; this._eventListeners = []; }
  addEventListener(element, eventType, handler, options) {   // as base-minigame.js: add, remember, remove at cleanup
    element.addEventListener(eventType, handler, options);
    this._eventListeners.push({ element, eventType, handler, options });
  }
  cleanup() {
    this._eventListeners.forEach(({ element, eventType, handler, options }) => element.removeEventListener(eventType, handler, options));
    this._eventListeners = [];
  }
}
const openModalCount = () => globalThis.__modalCount || 0;
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot() { return null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const phoneCloseLocked = noop, phoneEscapeAction = noop, FORCED_CALL_END_CLOSE_MS = 0, TERMINAL_CALL_END_READ_MS = 0,
  attachPretext = async () => null, processGameActionTags = noop, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}),
  classifyPhoneLine = (t, raw) => ({ type: 'npc', text: raw }),
  displayPhoneLine = () => ({}), phoneStepLines = (t) => String(t || '').split('|').filter(Boolean), choiceIndexFromKey = () => -1,
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
    document.body.innerHTML = '<div id="host"><div id="messages-container"></div><div id="choices-container"></div><div id="typing-indicator" style="display:none"></div><div id="phone-skip-hint" class="phone-skip-hint" hidden>Space or click to skip</div></div>';
    const ui = Object.create(UI.prototype);
    ui.isTerminalTheme = true;
    ui.isCallMode = false;
    ui.currentView = 'conversation';
    ui.container = document.getElementById('host');
    ui.elements = {
        messagesContainer: document.getElementById('messages-container'),
        choicesContainer: document.getElementById('choices-container'),
        typingIndicator: document.getElementById('typing-indicator'),
    };
    ui.scrollToBottom = () => {};
    ui.addChoices = () => {
        ui._choicesShown = true;
        ui.elements.choicesContainer.innerHTML = '<button class="choice-button">1. Go</button>';
        ui.syncSkipHint();
    };
    const shown = [];
    const mg = Object.create(PhoneChatMinigame.prototype);
    mg.ui = ui;
    mg.params = { theme: 'terminal' };
    mg.isConversationActive = true;
    mg._typeoutRun = 1;
    mg.history = { addMessage() {} };
    mg.playMessageSent = () => {};
    mg.saveStoryState = () => {};
    mg.gameState = { isActive: true };
    ui.getCurrentView = () => 'conversation';
    ui.incomingCallShowing = () => false;
    ui.elements.messagesContainer.getClientRects = () => [{}];   // jsdom has no layout: say it is shown
    globalThis.__modalCount = 0;
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
const hint = () => document.getElementById('phone-skip-hint');

test('hint is hidden when idle, shown while a pause runs and while a line types, hidden at choices', async () => {
    const c = clock(); const r = rig();
    try {
        r.ui.syncSkipHint();
        assert.equal(hint().hidden, true);
        const done = r.mg._presentOutput(['One line.'], [], RESULT, { tagsApplied: true });
        await c.advance(10);
        assert.equal(hint().hidden, false, 'shown during the receiving indicator wait');
        await c.advance(1000);
        assert.equal(r.ui.isTypewriting(), true);
        assert.equal(hint().hidden, false, 'shown while the line types');
        await c.advance(2000);
        await done;
        assert.equal(r.ui._choicesShown, true);
        assert.equal(hint().hidden, true, 'hidden once the choices are up');
    } finally { c.restore(); }
});

test('a skip press hides the hint once nothing is left to skip', async () => {
    const c = clock(); const r = rig();
    try {
        const done = r.mg._presentOutput(['One line.'], [], RESULT, { tagsApplied: true });
        await c.advance(10);
        assert.equal(hint().hidden, false, 'showing before the presses');
        r.mg._onSkipPress();
        r.mg._onSkipPress();
        await c.advance(2000);
        await done;
        assert.equal(hint().hidden, true);
    } finally { c.restore(); }
});

test('hint stays hidden outside the terminal theme', () => {
    const r = rig();
    r.ui.isTerminalTheme = false;
    r.ui.setPaceActive(true);
    assert.equal(hint().hidden, true);
});

test('markup and style: pixel font, no radius, hidden attribute respected', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    const rule = css.slice(css.indexOf('.phone-terminal-theme .phone-skip-hint {'));
    const block = rule.slice(0, rule.indexOf('}'));
    assert.match(block, /font-family: 'GNF'/);
    assert.doesNotMatch(block, /border-radius/);
    assert.match(css, /\.phone-skip-hint\[hidden\]\s*\{\s*display: none/);
    assert.match(css, /\.phone-terminal-theme \.conversation-view \.choices-container:empty \{ min-height: 36px; \}/);
});

test('M1: choices up while a preloaded opening still types keeps the hint hidden', async () => {
    const c = clock(); const r = rig();
    try {
        const typing = r.ui.addMessage('npc', 'A long preloaded opening line.', true);
        assert.equal(r.ui.isTypewriting(), true);
        assert.equal(hint().hidden, false, 'shown while typing');
        r.ui.addChoices([{ text: 'a' }]);
        assert.equal(r.ui.isTypewriting(), true, 'still typing');
        assert.equal(hint().hidden, true, 'hidden with choices up');
        r.ui.clearChoices();
        assert.equal(hint().hidden, false, 'back once the choices go and the line still types');
        r.ui.skipTypewriter();
        await typing;
        assert.equal(hint().hidden, true);
    } finally { c.restore(); }
});

test('m1: going back to the contact list mid-line hides the hint; reopening shows it again', async () => {
    const c = clock(); const r = rig();
    try {
        const typing = r.ui.addMessage('npc', 'Mid line text here.', true);
        assert.equal(hint().hidden, false);
        r.ui.currentView = 'contact-list';
        r.ui.syncSkipHint();
        assert.equal(hint().hidden, true, 'hidden on the contact list');
        await c.advance(10);
        r.ui.currentView = 'conversation';
        r.ui.syncSkipHint();
        assert.equal(hint().hidden, false, 'shown again in the thread while the line still types');
        r.ui.skipTypewriter();
        await typing;
    } finally { c.restore(); }
});

test('m1: showContactList and showConversation call syncSkipHint', () => {
    const body = (name) => uiSrc.slice(uiSrc.indexOf(`    ${name}(`)).split('\n    }\n')[0];
    assert.match(body('showContactList'), /syncSkipHint\(\)/);
    assert.match(body('showConversation'), /syncSkipHint\(\)/);
});

test('n4: the hint stays up while a voiced clip plays and goes when it ends', () => {
    const r = rig();
    r.ui.setCallSpeaking(true);
    assert.equal(hint().hidden, false);
    r.ui.setCallSpeaking(false);
    assert.equal(hint().hidden, true);
});

test('n3: one wording, same keys as the thread tooltip; touch says Tap', () => {
    const { skipHintText } = uiMod;
    assert.equal(skipHintText(), 'Space, Enter or click to skip');
    const saved = globalThis.window;
    globalThis.window = { matchMedia: (q) => ({ matches: /pointer: coarse|hover: none/.test(q) }) };
    try { assert.equal(skipHintText(), 'Tap to skip'); } finally { globalThis.window = saved; }
    assert.doesNotMatch(uiSrc, /Click, Space or Enter to skip/);
});

test('n2: render() creates the hint only in the terminal theme, once, inside .phone-screen', () => {
    const build = (theme) => {
        document.body.innerHTML = '<div id="host"></div>';
        const ui = Object.create(UI.prototype);
        ui.container = document.getElementById('host');
        ui.params = { theme };
        ui.isTerminalTheme = theme === 'terminal';
        ui.isSocialTheme = theme === 'social';
        ui.isCallMode = false;
        ui.appChrome = false;
        ui.app = null;
        ui.render();
        ui.render();
        return document.querySelectorAll('#phone-skip-hint');
    };
    const term = build('terminal');
    assert.equal(term.length, 1);
    assert.ok(term[0].closest('.phone-screen'));
    assert.equal(term[0].hidden, true);
    assert.equal(build('default').length, 0);
});
