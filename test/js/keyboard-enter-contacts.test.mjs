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
          <label><input id="cracker" type="checkbox" checked></label>
          <div class="pin-minigame-keypad"><button class="pin-minigame-key" id="k5">5</button></div>
        </div></div>`;
    const pin = Object.create(PinMinigame.prototype);
    Object.assign(pin, { isLocked: false, allowBackspace: true, gameState: { isActive: true } });
    pin.enters = 0; pin.digits = []; pin.backs = 0;
    pin.handleEnter = () => { pin.enters++; };
    pin.handleNumberInput = (d) => { pin.digits.push(d); };
    pin.handleBackspace = () => { pin.backs++; };
    pin.addEventListener = (el, type, handler, options) => el.addEventListener(type, handler, options);
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

test('D1: Enter on the body, the pad and the display still submits', () => {
    const pin = padRig();
    for (const el of [document.body, document.querySelector('.pin-minigame-interface'), $('display')]) {
        assert.equal(press(el, 'Enter'), false);
    }
    assert.equal(pin.enters, 3);
});

const pointerDown = (el) => el.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true, cancelable: true }));

test('M1: pointerdown on a pad key then Enter submits (handleEnter once, no native click)', () => {
    const pin = padRig();
    pointerDown($('k5')); $('k5').focus();
    assert.equal(press($('k5'), 'Enter'), false, 'prevented: handleEnter runs, not the key');
    assert.equal(pin.enters, 1);
    assert.deepEqual(pin.digits, []);
});

test('M1: a pad key reached with no pointer (Tab) acts as that key: not prevented, no submit', () => {
    const pin = padRig();
    $('answer').focus();
    press($('answer'), 'Tab');
    $('k5').focus();
    assert.equal(press($('k5'), 'Enter'), true, 'the browser clicks the key once');
    assert.equal(pin.enters, 0);
});

test('M1: pointerdown, then an arrow key, then Enter acts as the key', () => {
    const pin = padRig();
    pointerDown($('k5')); $('k5').focus();
    press($('k5'), 'ArrowRight');
    assert.equal(press($('k5'), 'Enter'), true);
    assert.equal(pin.enters, 0);
});

test('M1: pointerdown, then Tab, then Enter acts as the key', () => {
    const pin = padRig();
    pointerDown($('k5')); $('k5').focus();
    press($('k5'), 'Tab');
    assert.equal(press($('k5'), 'Enter'), true);
    assert.equal(pin.enters, 0);
});

test('M1: focus arriving on a key without a pointerdown clears the pointer mode', () => {
    const pin = padRig();
    document.querySelector('.pin-minigame-keypad').insertAdjacentHTML('beforeend', '<button class="pin-minigame-key" id="k6">6</button>');
    pointerDown($('k5')); $('k5').focus();
    $('k6').focus();               // script or assistive focus, no pointerdown on k6
    $('k5').focus();
    assert.equal(press($('k5'), 'Enter'), true);
    assert.equal(pin.enters, 0);
});

test('M1: a pointerdown elsewhere clears the pointer mode; the pointer on the body then Enter submits', () => {
    const pin = padRig();
    pointerDown($('k5')); $('k5').focus();
    pointerDown(document.body);
    $('k5').focus();               // back by script: not pointer-reached
    assert.equal(press($('k5'), 'Enter'), true);
    pointerDown(document.body);
    assert.equal(press(document.body, 'Enter'), false);
    assert.equal(pin.enters, 1);
});

test('M1: each Enter is either one native click or one handleEnter, never both', () => {
    const pin = padRig();
    let clicks = 0;
    $('k5').addEventListener('click', () => clicks++);
    pointerDown($('k5')); $('k5').focus();
    const prevented = !press($('k5'), 'Enter');
    assert.ok(prevented && pin.enters === 1 && clicks === 0);
    press($('k5'), 'Tab');
    const prevented2 = !press($('k5'), 'Enter');
    assert.ok(!prevented2 && pin.enters === 1, 'native path: handleEnter not called again');
});

test('M1: digits and Backspace still enter from the PIN cracker checkbox, and Enter there does not submit', () => {
    const pin = padRig();
    $('cracker').focus();
    assert.equal(press($('cracker'), '3'), false);
    assert.equal(press($('cracker'), 'Backspace'), false);
    assert.deepEqual(pin.digits, ['3']);
    assert.equal(pin.backs, 1);
    assert.equal(press($('cracker'), 'Enter'), true, 'native behaviour left alone');
    assert.equal(pin.enters, 0);
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
    assert.equal(row.querySelector('.unread-badge').textContent, '2 unread');
    assert.match(row.querySelector('.contact-last-message').textContent, /Meet me at the dock/);
});

test('D2: Enter and Space on a focused row open the thread; other keys do not', () => {
    const { row, mg } = listRig();
    row.focus();
    assert.ok(document.activeElement === row);
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


function nameOf(row) {
    const ids = row.getAttribute('aria-labelledby');
    return ids.split(/\s+/).map((id) => document.getElementById(id).textContent).join(' ').replace(/\s+/g, ' ').trim();
}

test('m2: a row without an avatar is named by the contact name alone', () => {
    document.body.innerHTML = '';
    const ui = Object.create(UI.prototype);
    ui.npcManager = { getConversationHistory: () => [{ type: 'npc', text: 'Meet me at the dock', read: false, timestamp: 1 }] };
    ui.unreadCountFor = () => 3;
    const row = ui.createContactItem({ id: 'ana', displayName: 'Ana Reyes', handle: '@ana' });
    document.body.append(row);
    assert.equal(nameOf(row), 'Ana Reyes');
    assert.equal(row.querySelector('.contact-avatar span').getAttribute('aria-hidden'), 'true');
    const described = row.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent).join(' ');
    assert.match(described, /Meet me at the dock/);
    assert.match(described, /\d:\d\d/);
    assert.match(described, /3 unread/, 'the unread count is in the description');
    assert.match(described, /@ana/, 'the handle is in the description');
    assert.equal(row.querySelector('.unread-badge').textContent, '3 unread');
    assert.equal(row.querySelector('.unread-badge').firstChild.textContent, '3', 'the visible number is unchanged');
});

test('m2: the row ::before in the terminal theme is not on the name element', () => {
    const css = readFileSync(join(js, '../css/phone-chat-minigame.css'), 'utf8');
    assert.ok(!/\.contact-name::before/.test(css));
});

test('m3b: a list rebuild gives focus back to the same row', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    ui.listContacts = () => [{ id: 'bob', displayName: 'Bob' }, { id: 'ana', displayName: 'Ana Reyes', handle: '@ana' }];
    ui.refreshLivePreview = () => {};
    ui.populateContactList('p');
    const ana = document.querySelector('.contact-item[data-npc-id="ana"]');
    ana.focus();
    assert.ok(document.activeElement === ana);
    ui.populateContactList('p');
    const again = document.querySelector('.contact-item[data-npc-id="ana"]');
    assert.notEqual(again, ana, 'the list was rebuilt');
    assert.ok(document.activeElement === again);
});

test('m3a: Back to the list focuses the row of a thread opened with the keyboard, not a mouse one', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    ui.listContacts = () => [{ id: 'bob', displayName: 'Bob' }, { id: 'ana', displayName: 'Ana Reyes' }];
    ui.refreshLivePreview = () => {};
    ui.syncSkipHint = () => {}; ui.stopCallTimer = () => {}; ui.focusIntoPhone = () => {};
    const listView = document.createElement('div'), convView = document.createElement('div');
    ui.elements.contactListView = listView; ui.elements.conversationView = convView;
    ui.populateContactList('p');
    // keyboard
    let ana = document.querySelector('.contact-item[data-npc-id="ana"]');
    ana.focus(); press(ana, 'Enter');
    ui.currentView = 'conversation'; ui.currentNPCId = 'ana';
    ui.showContactList('p');
    assert.equal(document.activeElement.dataset.npcId, 'ana');
    // mouse
    ana = document.querySelector('.contact-item[data-npc-id="ana"]');
    ana.click();
    ui.currentView = 'conversation'; ui.currentNPCId = 'ana';
    document.activeElement.blur?.();
    ui.showContactList('p');
    assert.notEqual(document.activeElement?.dataset?.npcId, 'ana');
});

test('m1: repeat and modifier Enter on a row are ignored', () => {
    const { row, mg } = listRig();
    for (const init of [{ repeat: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
        row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init }));
    }
    assert.deepEqual(mg.opened, []);
});

test('M2/m1: aria-describedby resolves to existing elements: preview, time, handle and unread', () => {
    document.body.innerHTML = '';
    const ui = Object.create(UI.prototype);
    ui.npcManager = { getConversationHistory: () => [{ type: 'npc', text: 'Meet me at the dock', read: false, timestamp: 1 }] };
    ui.unreadCountFor = () => 2;
    const row = ui.createContactItem({ id: 'ana', displayName: 'Ana Reyes', handle: '@ana' });
    document.body.append(row);
    const ids = row.getAttribute('aria-describedby').split(' ');
    assert.equal(ids.length, 4);
    for (const id of ids) assert.ok(document.getElementById(id), `#${id} exists`);
    assert.match(ids.join(' '), /-unread/);
    assert.match(ids.join(' '), /-handle/);
    const text = ids.map((id) => document.getElementById(id).textContent).join(' ').replace(/\s+/g, ' ');
    assert.match(text, /2 unread/);
    assert.match(text, /@ana/);
    assert.equal(nameOf(row), 'Ana Reyes', 'the name is still the contact name alone');
});

test('M2: a row with no unread and no handle describes only preview and time', () => {
    document.body.innerHTML = '';
    const ui = Object.create(UI.prototype);
    ui.npcManager = { getConversationHistory: () => [] };
    ui.unreadCountFor = () => 0;
    const row = ui.createContactItem({ id: 'bob', displayName: 'Bob' });
    document.body.append(row);
    const ids = row.getAttribute('aria-describedby').split(' ');
    assert.equal(ids.length, 2);
    for (const id of ids) assert.ok(document.getElementById(id));
});

test('nit: a focused text input outside the list keeps focus through a rebuild', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    ui.listContacts = () => [{ id: 'ana', displayName: 'Ana Reyes' }];
    ui.refreshLivePreview = () => {};
    const input = document.createElement('input'); input.type = 'text'; document.body.append(input);
    input.focus();
    ui.populateContactList('p');
    assert.ok(document.activeElement === input);
});

test('nit: if the focused row\'s contact leaves the list, focus falls back into the phone view', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    const listView = document.createElement('div'); listView.tabIndex = -1;
    const convView = document.createElement('div');
    document.body.append(listView, convView);
    listView.append($('list'));
    ui.elements.contactListView = listView; ui.elements.conversationView = convView;
    ui.container = document.body;
    ui.currentView = 'contact-list';
    ui.listContacts = () => [{ id: 'bob', displayName: 'Bob' }, { id: 'ana', displayName: 'Ana Reyes' }];
    ui.refreshLivePreview = () => {};
    ui.populateContactList('p');
    document.querySelector('.contact-item[data-npc-id="ana"]').focus();
    ui.listContacts = () => [{ id: 'bob', displayName: 'Bob' }];
    ui.populateContactList('p');
    assert.ok(document.activeElement !== document.body, 'focus did not drop to body');
    assert.ok(document.activeElement === listView);
});

test('nit: showConversation for a thread not opened by a keyboard press clears _threadByKeyboard', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    const listView = document.createElement('div'), convView = document.createElement('div');
    ui.elements = { ...ui.elements, contactListView: listView, conversationView: convView,
        messagesContainer: document.createElement('div'), choicesContainer: document.createElement('div') };
    ui.npcManager.getNPC = (id) => ({ id, displayName: id });
    ui.syncSkipHint = () => {}; ui.updateHeader = () => {}; ui.refreshBackUnread = () => {};
    ui.focusIntoPhone = () => {}; ui._bottomPin = null; ui.isCallMode = false;
    ui._threadByKeyboard = true;      // left over from an earlier keyboard open
    ui.showConversation('ana');       // a bark or ring: no keyboard press on a row
    assert.equal(ui._threadByKeyboard, false);
    ui._kbOpen = true; ui._threadByKeyboard = true;
    ui.showConversation('ana');       // inside a keyboard open of the row
    assert.equal(ui._threadByKeyboard, true);
});

test('R3 M: an in-place refresh keeps aria-describedby in step with the unread badge (0 -> N -> 0)', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    ui.currentView = 'contact-list';
    ui.params = { phoneId: 'p' };
    ui.listContacts = () => [{ id: 'bob', displayName: 'Bob' }];
    ui.refreshLivePreview = () => {};
    let unread = 0;
    ui.unreadCountFor = () => unread;
    ui.populateContactList('p');
    const row = document.querySelector('.contact-item[data-npc-id="bob"]');
    const desc = () => (row.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    assert.ok(!desc().some((id) => /-unread$/.test(id)), 'no unread id at 0');
    unread = 1;
    assert.equal(ui.refreshContactList(), true);
    assert.ok(document.querySelector('.contact-item[data-npc-id="bob"]') === row, 'refreshed in place, not rebuilt');
    const unreadId = desc().find((id) => /-unread$/.test(id));
    assert.ok(unreadId, 'the new unread id is in the description');
    assert.match(document.getElementById(unreadId).textContent, /1 unread/);
    unread = 0;
    ui.refreshContactList();
    assert.ok(!desc().some((id) => /-unread$/.test(id)), 'no dangling unread id once read');
    for (const id of desc()) assert.ok(document.getElementById(id), `describedby id ${id} exists`);
});

test('R3 n: the last focused contact leaving keeps focus inside the phone', () => {
    const { mg } = listRig();
    const ui = mg.ui;
    const listView = document.createElement('div'); listView.tabIndex = -1;
    document.body.append(listView);
    listView.append($('list'));
    ui.elements.contactListView = listView; ui.elements.conversationView = document.createElement('div');
    ui.container = document.body;
    ui.currentView = 'contact-list';
    ui.listContacts = () => [{ id: 'ana', displayName: 'Ana Reyes' }];
    ui.refreshLivePreview = () => {};
    ui.populateContactList('p');
    document.querySelector('.contact-item[data-npc-id="ana"]').focus();
    ui.listContacts = () => [];
    ui.populateContactList('p');
    assert.ok(document.activeElement === listView);
});
