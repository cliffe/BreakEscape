// Keyboard fixes from the AC1 focus run:
//  D1  the PIN pad's document-level Enter handler swallowed Enter on any focused button
//      (the ring banner's Answer and Hang up, the minigame X); a text field lost its keys too.
//  D2  phone contact rows were bare divs: Tab skipped them and nothing opened a thread.
// Run with: node --max-old-space-size=2048 test/js/keyboard-enter-contacts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

console.log = () => {};
console.warn = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { KeyboardEvent } = dom.window;

// ---- PIN pad ---------------------------------------------------------------------------
const root = mkdtempSync(join(tmpdir(), 'kbd-enter-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'pin'), { recursive: true });
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8'));
mkdirSync(join(dir, 'framework'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'pin', 'pin-minigame.mjs'), readFileSync(join(js, 'minigames/pin/pin-minigame.js'), 'utf8'));
const mod = await import(pathToFileURL(join(dir, 'pin', 'pin-minigame.mjs')).href);
const PinMinigame = mod.PinMinigame || Object.values(mod).find((v) => typeof v === 'function' && v.prototype?.handleEnter);

function padRig() {
    document.body.innerHTML = `
      <div id="ring"><button id="answer">Answer</button><button id="hangup">Hang up</button></div>
      <div id="minigame-container"><button id="minigame-close">X</button>
        <div class="pin-minigame-interface">
          <div class="pin-minigame-display" id="display" tabindex="0">----</div>
          <input id="note" type="text">
          <div class="pin-minigame-keypad"><button class="pin-minigame-key" id="k5">5</button></div>
        </div></div>`;
    const pin = Object.create(PinMinigame.prototype);
    Object.assign(pin, { isLocked: false, allowBackspace: true, gameState: { isActive: true } });
    pin.enters = 0; pin.digits = []; pin.backs = 0;
    pin.handleEnter = () => { pin.enters++; };
    pin.handleNumberInput = (d) => { pin.digits.push(d); };
    pin.handleBackspace = () => { pin.backs++; };
    pin.addEventListener = (el, type, handler) => el.addEventListener(type, handler);
    pin.setupKeyboardSupport();
    return pin;
}
// true when nothing called preventDefault, i.e. the control keeps its own key
const press = (el, key) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const $ = (id) => document.getElementById(id);

test('D1: Enter on the ring banner Answer and Hang up buttons is not prevented and does not submit', () => {
    const pin = padRig();
    assert.equal(press($('answer'), 'Enter'), true);
    assert.equal(press($('hangup'), 'Enter'), true);
    assert.equal(pin.enters, 0);
});

test('D1: Enter on the minigame X is not prevented and does not submit', () => {
    const pin = padRig();
    assert.equal(press($('minigame-close'), 'Enter'), true);
    assert.equal(pin.enters, 0);
});

test('D1: Enter on the body, the pad, a pad key and the display still submits', () => {
    const pin = padRig();
    for (const el of [document.body, document.querySelector('.pin-minigame-interface'), $('k5'), $('display')]) {
        assert.equal(press(el, 'Enter'), false);
    }
    assert.equal(pin.enters, 4);
});

test('D1: digits and Backspace still enter from the body, a pad key and a ring button', () => {
    const pin = padRig();
    assert.equal(press(document.body, '7'), false);
    assert.equal(press($('k5'), '2'), false);
    assert.equal(press($('answer'), '9'), false);
    assert.deepEqual(pin.digits, ['7', '2', '9']);
    assert.equal(press(document.body, 'Backspace'), false);
    assert.equal(pin.backs, 1);
});

test('D1: typing in a text field is left alone', () => {
    const pin = padRig();
    assert.equal(press($('note'), '4'), true);
    assert.equal(press($('note'), 'Backspace'), true);
    assert.equal(press($('note'), 'Enter'), true);
    assert.deepEqual(pin.digits, []);
    assert.equal(pin.backs, 0);
    assert.equal(pin.enters, 0);
});

// ---- Phone contact rows -----------------------------------------------------------------
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const uiStubs = `
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '';
const noop = () => {};
const portraitFor = (n) => n, npcDmFields = (n) => ({ handle: n.handle }), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({ destroy: noop, pin: noop }),
  isPhoneCallMode = () => false, callLabelFor = noop, formatCallDuration = noop, callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;
const uiSrc = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const uiMod = await import(dataUrl(uiStubs + uiSrc));
const UI = uiMod.PhoneChatUI || uiMod.default;

const mgHeader = `
const noop = () => {};
class MinigameScene {
  constructor(c, p) { this.container = c; this.params = p; }
  addEventListener(el, type, handler, options) { el.addEventListener(type, handler, options); }
}
const openModalCount = () => 0;
class PhoneChatUI {} class PhoneChatHistory {} class InkEngine {} class PhoneCallVoice {} class TTSManager {}
class PhoneChatConversation { static stepKnot() { return null; } static async waitForPreload() {} static isPreloadedOpening() { return false; } }
const phoneCloseLocked = () => false, phoneEscapeAction = noop, FORCED_CALL_END_CLOSE_MS = 0, TERMINAL_CALL_END_READ_MS = 0,
  attachPretext = async () => null, processGameActionTags = noop, choiceAsksEnding = () => false,
  confirmEndingBeforeChoice = async () => true, partitionSlowTags = () => ({}),
  classifyPhoneLine = (t, raw) => ({ type: 'npc', text: raw }),
  displayPhoneLine = () => ({}), phoneStepLines = (t) => String(t || '').split('|').filter(Boolean), choiceIndexFromKey = () => -1,
  whenSessionOverlayClosed = () => Promise.resolve(), isVoicedCall = () => false,
  phoneLineVoice = noop, outcomeLineVoice = noop, stepDeliveries = () => [], voicedCallKnots = () => new Set(),
  callStartKnots = () => new Set(), callHomeKnot = () => 'start', deliveryFromTags = () => null, resolvePhoneApp = () => ({}),
  npcDmFields = () => ({}), profileLaunch = () => ({});
`;
const mgSrc = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const { PhoneChatMinigame } = await import(dataUrl(mgHeader + mgSrc));

function listRig() {
    document.body.innerHTML = '<div id="list"></div><div id="header"></div><button id="back"></button><div id="choices"></div>';
    const ui = Object.create(UI.prototype);
    ui.npcManager = { getConversationHistory: () => [{ type: 'npc', text: 'Meet me at the dock', read: false, timestamp: 1 }] };
    const row = ui.createContactItem({ id: 'ana', displayName: 'Ana Reyes', handle: '@ana', avatar: '/a.png' });
    ui.unreadCountFor = () => 2;
    const rowWithBadge = ui.createContactItem({ id: 'ana', displayName: 'Ana Reyes', handle: '@ana', avatar: '/a.png' });
    $('list').append(rowWithBadge);
    ui.elements = { contactList: $('list'), conversationHeader: $('header'), backButton: $('back'), choicesContainer: $('choices') };
    const mg = Object.create(PhoneChatMinigame.prototype);
    mg.ui = ui; mg.params = {}; mg.container = document.body; mg.gameState = { isActive: true };
    mg.opened = [];
    mg.openJudgedContact = () => false;
    mg.openConversation = (id) => { mg.opened.push(id); };
    mg.setupEventListeners();
    return { row: rowWithBadge, mg };
}

test('D2: a contact row is focusable, a button by role, and named from the contact', () => {
    const { row } = listRig();
    assert.equal(row.getAttribute('role'), 'button');
    assert.equal(row.tabIndex, 0);
    assert.match(row.textContent.replace(/\s+/g, ' ').trim(), /^Ana Reyes/);
    assert.equal(row.querySelector('img').getAttribute('alt'), '', 'the avatar adds no second name');
    assert.equal(row.querySelector('.unread-badge').textContent, '2');
    assert.match(row.querySelector('.contact-last-message').textContent, /Meet me at the dock/);
});

test('D2: Enter and Space on a focused row open the thread; other keys do not', () => {
    const { row, mg } = listRig();
    row.focus();
    assert.equal(document.activeElement, row);
    assert.equal(press(row, 'Enter'), false);
    assert.equal(press(row, ' '), false);
    assert.deepEqual(mg.opened, ['ana', 'ana']);
    assert.equal(press(row, 'a'), true);
    assert.equal(mg.opened.length, 2);
});

test('D2: a click still opens the thread', () => {
    const { row, mg } = listRig();
    row.querySelector('.contact-name').click();
    assert.deepEqual(mg.opened, ['ana']);
});

test('D2: the row has a 2px square focus ring in the stylesheet', () => {
    const css = readFileSync(join(js, '../css/phone-chat-minigame.css'), 'utf8');
    const m = css.match(/\.contact-item:focus-visible\s*\{([^}]*)\}/);
    assert.ok(m, 'rule exists');
    assert.match(m[1], /outline:\s*2px solid/);
    assert.match(m[1], /border-radius:\s*0/);
});
