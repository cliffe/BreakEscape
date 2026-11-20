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
        assert.ok(document.querySelector('.terminal-cursor') === null);
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
        // covered or hidden: Space/Enter leave the hidden line alone (m3)
        for (const cover of [() => { r.ui.incomingCallShowing = () => true; }, () => { globalThis.__modalCount = 1; },
                             () => { r.ui.getCurrentView = () => 'contact-list'; }, () => { r.mg.gameState.isActive = false; },
                             () => { r.ui.elements.messagesContainer.getClientRects = () => []; }]) {
            const keep = [r.ui.incomingCallShowing, r.ui.getCurrentView, r.ui.elements.messagesContainer.getClientRects];
            cover();
            const ec = key({ key: ' ' }, document.body);
            r.mg._onSkipKey(ec);
            assert.equal(ec.defaultPrevented, false);
            assert.ok(r.ui.isTypewriting(), 'a covered or hidden thread ignores the key');
            [r.ui.incomingCallShowing, r.ui.getCurrentView, r.ui.elements.messagesContainer.getClientRects] = keep;
            globalThis.__modalCount = 0; r.mg.gameState.isActive = true;
        }
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

test('m1: closing mid-reply resets skip state, so the next thread types normally', async () => {
    const c = clock(); const r = rig();
    try {
        r.mg._resetSkip = PhoneChatMinigame.prototype._resetSkip;
        const done = startRun(r, c);
        await c.advance(1000 + 5 * 28);
        r.mg._onSkipPress();
        await c.advance(0);
        r.mg._onSkipPress();   // skip-all, in the pause
        assert.equal(r.mg._skipAll, true);
        // the early return after a closed thread resets
        r.mg._showStoryLine = async () => false;
        await r.mg._presentOutput(['x'], [], RESULT, { tagsApplied: true });
        assert.equal(r.mg._skipAll, false);
        assert.equal(r.ui._instantType, false);
        // closeConversation resets (the rest of it is stubbed away: it throws after the reset on a bare rig)
        r.mg._skipAll = true; r.ui.setInstantType(true);
        try { r.mg.closeConversation(); } catch (e) { /* bare rig */ }
        assert.equal(r.mg._skipAll, false);
        assert.equal(r.ui._instantType, false);
        // openConversation resets before anything else can type
        r.mg._skipAll = true; r.ui.setInstantType(true);
        r.mg.gameState.isActive = true; r.mg.npcManager = { getNPC: () => null }; r.ui.showNotification = () => {}; r.ui.showContactList = () => {};
        const waiting = r.mg.openConversation('nobody');
        await c.advance(0);
        await waiting;
        assert.equal(r.ui._instantType, false);
        await c.advance(5000);
        await done;
    } finally { c.restore(); }
});

test('m2: a finished older line never clears a newer line\'s skip hook', async () => {
    const c = clock(); const r = rig();
    try {
        const a = r.ui._typewriterMessage('old', false);
        await c.advance(130);                 // old is in its blink
        const b = r.ui._typewriterMessage('a much longer newer line '.repeat(8), false);
        await c.advance(700);                 // old's blink ends
        await a;
        assert.equal(r.ui.isTypewriting(), true, 'the newer line is still skippable');
        assert.equal(r.mg._onSkipPress(), true);
        await b;
        assert.equal(r.ui.isTypewriting(), false);
    } finally { c.restore(); }
});

test('m5: reduced motion shows terminal lines whole', async () => {
    const c = clock(); const r = rig();
    try {
        dom.window.matchMedia = (q) => ({ matches: /reduce/.test(q) });
        await r.ui._typewriterMessage('whole at once', false);
        assert.equal(document.querySelector('.message-text').textContent, 'whole at once');
        assert.equal(r.ui.isTypewriting(), false);
    } finally { delete dom.window.matchMedia; c.restore(); }
});

// ---- the real wiring (m6) ----

// the framework's cleanup() is what removes every addEventListener'd handler (PhoneChatMinigame.cleanup calls super.cleanup())
const baseCleanup = (mg) => Object.getPrototypeOf(PhoneChatMinigame.prototype).cleanup.call(mg);

function wiredRig(theme) {
    const r = rig();
    r.ui.isTerminalTheme = theme === 'terminal';
    const els = r.ui.elements;
    for (const k of ['contactList', 'conversationHeader', 'backButton']) els[k] = document.createElement('div');
    els.choicesContainer = document.getElementById('choices-container');
    r.mg.params = { theme };
    r.mg._eventListeners = [];
    r.mg.handleKeyPress = () => {};
    return r;
}

test('listeners: skip is registered for the terminal theme only', () => {
    const t = wiredRig('terminal'); t.mg.setupEventListeners();
    const n = wiredRig('terminal'); n.ui.isTerminalTheme = false; n.mg.setupEventListeners();
    const skipClicks = (r) => r.mg._eventListeners.filter((l) => l.element === r.ui.elements.messagesContainer && l.eventType === 'click').length;
    const docKeys = (r) => r.mg._eventListeners.filter((l) => l.element === document && l.eventType === 'keydown').length;
    assert.equal(skipClicks(t), 1);
    assert.equal(docKeys(t), 2, 'skip key + the existing shortcuts');
    assert.equal(skipClicks(n), 0);
    assert.equal(docKeys(n), 1, 'only the existing shortcuts');
    baseCleanup(t.mg); baseCleanup(n.mg);
});

test('listeners: real click and keydown events skip; removed at cleanup', async () => {
    const c = clock(); const r = wiredRig('terminal');
    try {
        r.mg.setupEventListeners();
        startRun(r, c);
        await c.advance(1000 + 5 * 28);
        assert.ok(r.ui.isTypewriting());
        r.ui.elements.messagesContainer.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        assert.equal(r.ui.isTypewriting(), false, 'a real click skipped the line');
        await c.advance(400 + 1000 + 5 * 28);   // pause, indicator, then line 2 is typing
        assert.ok(r.ui.isTypewriting());
        document.body.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        assert.equal(r.ui.isTypewriting(), false, 'a real Enter skipped the next one');
        await c.advance(300);
        document.body.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
        assert.equal(r.mg._skipAll, true, 'a real Space in the pause skips the waits');
        r.mg._skipAll = false; r.ui.setInstantType(false);
        baseCleanup(r.mg);
        const before = r.mg._skipAll;
        r.mg._paceWake = () => {};
        const ev = new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        document.body.dispatchEvent(ev);
        r.ui.elements.messagesContainer.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        assert.equal(ev.defaultPrevented, false, 'no listener after cleanup');
        assert.equal(r.mg._skipAll, before);
    } finally { c.restore(); }
});

test('a key press also skips a playing clip, as the click does', async () => {
    const c = clock(); const r = rig();
    try {
        let skips = 0, playing = true;
        r.mg._callVoice = { get active() { return playing; }, skip() { skips++; playing = false; } };
        const e = key({ key: ' ' }, document.body);
        r.mg._onSkipKey(e);
        assert.equal(skips, 1);
        assert.equal(e.defaultPrevented, true);
        r.mg._onSkipKey(key({ key: ' ' }, document.body));
        assert.equal(skips, 1, 'nothing playing, nothing to skip');
    } finally { c.restore(); }
});

// Code review R1 M2: Space/Enter skip a voiced call's clip on the call screen (non-terminal theme)
// exactly as a click does, with the same guards.
function callRig() {
    const r = rig();
    r.ui.isTerminalTheme = false;
    r.ui.isCallMode = true;
    r.mg.params = { theme: 'phone', voiced: true };
    let skips = 0, playing = true;
    r.mg._callVoice = { get active() { return playing; }, skip() { skips++; playing = false; } };
    r.again = () => { playing = true; };
    r.skips = () => skips;
    return r;
}

test('call screen: the key listener is registered for call mode as well as the terminal theme', () => {
    const src = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    assert.match(src, /if \(this\.ui\.isTerminalTheme \|\| this\.ui\.isCallMode\) \{\s*this\.addEventListener\(document, 'keydown'/);
});

test('call screen: Space and Enter skip the playing clip and are swallowed', () => {
    const r = callRig();
    for (const k of [' ', 'Enter']) {
        r.again();
        const before = r.skips();
        const e = key({ key: k }, document.body);
        r.mg._onSkipKey(e);
        assert.equal(r.skips(), before + 1, `${JSON.stringify(k)} skipped the clip`);
        assert.equal(e.defaultPrevented, true);
    }
    const e = key({ key: ' ' }, document.body);
    r.mg._onSkipKey(e);
    assert.equal(e.defaultPrevented, false, 'nothing playing: the key is left alone');
});

test('call screen: modifiers, repeat, other keys, fields, buttons and a covered call leave the clip alone', () => {
    const r = callRig();
    const input = document.createElement('input'); document.body.appendChild(input);
    const btn = document.createElement('button'); document.body.appendChild(btn);
    const press = (init, target) => { const e = key(init, target); r.mg._onSkipKey(e); return e; };
    const none = (what) => { assert.equal(r.skips(), 0, what); assert.equal(r.mg._callVoice.active, true, what); };
    press({ key: ' ', ctrlKey: true }, document.body); none('ctrl');
    press({ key: ' ', shiftKey: true }, document.body); none('shift');
    press({ key: ' ', repeat: true }, document.body); none('repeat');
    press({ key: 'a' }, document.body); none('other key');
    press({ key: ' ' }, input); none('target is a field');
    press({ key: 'Enter' }, btn); none('target is a button');
    input.focus(); press({ key: ' ' }, document.body); none('focus in a field'); input.blur();
    r.ui.incomingCallShowing = () => true; press({ key: ' ' }, document.body); none('incoming-call panel');
    r.ui.incomingCallShowing = () => false;
    globalThis.__modalCount = 1; press({ key: ' ' }, document.body); none('a dialog on top'); globalThis.__modalCount = 0;
    r.ui.getCurrentView = () => 'contact-list'; press({ key: ' ' }, document.body); none('thread not showing');
    r.ui.getCurrentView = () => 'conversation';
    r.mg.gameState.isActive = false; press({ key: ' ' }, document.body); none('game inactive'); r.mg.gameState.isActive = true;
    press({ key: ' ' }, document.body);
    assert.equal(r.skips(), 1, 'with every guard clear, it skips');
});

test('handleChoice: the reply types out, a click skips it, and the skip state resets on entry', async () => {
    const c = clock(); const r = rig();
    try {
        r.mg._resetSkip = PhoneChatMinigame.prototype._resetSkip;
        r.mg.currentNPCId = 'npc';
        r.mg.conversation = { makeChoice: () => ({ text: 'Reply one.|Reply two.', tags: [], choices: [{ text: 'c' }], canContinue: false, hasEnded: false }) };
        r.mg._saveStoryStateFor = () => {}; r.mg._applyLineTags = () => {};
        r.ui.clearChoices = () => {};
        r.ui.addMessage = async function (type, text) { if (type === 'player') return; await UI.prototype.addMessage.call(this, type, text, true); };
        r.mg._skipAll = true; r.ui.setInstantType(true);   // left over from earlier
        const done = r.mg.handleChoice(0);
        await c.advance(1000 + 4 * 28);
        assert.equal(r.mg._skipAll, false, 'stale skip state was cleared on entry');
        assert.ok(r.ui.isTypewriting(), 'typing normally');
        r.mg._onSkipPress(); await c.advance(0); r.mg._onSkipPress();
        await c.advance(0);
        await done;
        assert.deepEqual(r.text(), ['Reply one.', 'Reply two.']);
        assert.equal(r.mg._skipAll, false, 'reset at the end');
    } finally { c.restore(); }
});

test('call screen: a real Space and Enter keydown on the document, through setupEventListeners, skip the clip', () => {
    const r = callRig();
    for (const el of ['contactList', 'conversationHeader', 'backButton']) r.ui.elements[el] = document.createElement('div');
    r.mg._eventListeners = [];
    r.mg.handleKeyPress = () => {};
    r.mg.setupEventListeners();
    try {
        for (const k of [' ', 'Enter']) {
            r.again();
            const before = r.skips();
            document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
            assert.equal(r.skips(), before + 1, `${JSON.stringify(k)} on the document skipped the clip`);
        }
    } finally { baseCleanup(r.mg); }
});
