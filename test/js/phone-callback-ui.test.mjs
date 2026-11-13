// A6: the missed row's own "Call back" button in PhoneChatUI (plan 2.6): on the latest missed row only,
// while a callback is pending, the same call as the header button. The UI is loaded with its imports
// stubbed (no harness copy list).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

console.log = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const chat = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const stubs = `
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '';
const noop = () => {};
const portraitFor = () => ({}), npcDmFields = () => ({}), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({}),
  isPhoneCallMode = (p) => !!p && p.voiced === true && p.theme !== 'terminal', callLabelFor = () => 'Voice call',
  formatCallDuration = (ms) => '0:00', callSubtitle = noop,
  CALL_STATUS_HTML = '<div class="call-status-bar" id="call-status-bar"><span class="call-status-label"><span class="call-status-dot"></span>ON CALL</span><span class="call-timer" id="call-timer">0:00</span></div>',
  CALL_SPEAKING_HTML = '<div class="call-caption" id="call-caption">Voice call</div>', CALL_CONTROLS_HTML = '';
`;
const uiSrc = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const mod = await import(dataUrl(stubs + uiSrc));
const UI = mod.PhoneChatUI || mod.default;


function makeUi() {
    document.body.innerHTML = '<div id="host"></div>';
    const ui = Object.create(UI.prototype);
    ui.container = document.getElementById('host');
    ui.params = { voiced: false };
    ui.isCallMode = false;
    ui.isTerminalTheme = false;
    ui.container.innerHTML = `<div class="phone-messages-container"><div class="conversation-view" id="conversation-view">
        <div class="conversation-header" id="conversation-header"><button class="back-button" id="back-button">x</button>
        <div class="conversation-info"></div></div><div class="messages-container" id="messages-container"></div></div></div>`;
    ui.elements = { conversationHeader: document.getElementById('conversation-header'),
        messagesContainer: document.getElementById('messages-container'), callTimer: null };
    ui.scrollToBottom = () => {};
    return ui;
}
const missed = (text = 'Missed call') => ({ type: 'call', callEvent: 'missed', text });
const callback = { label: 'Call back', ariaLabel: 'Call Caller One back', kind: 'callback' };
const buttons = (ui) => [...ui.elements.messagesContainer.querySelectorAll('.call-row-callback')];

test('the latest missed row gets a "Call back" button with the aria label, and it presses the same call as the header button', () => {
    const ui = makeUi();
    let presses = 0;
    ui._addCallRow(missed(), 'Missed call', false);
    assert.equal(buttons(ui).length, 0, 'no callback pending: no button');
    ui.setCallButton(callback, () => { presses++; });
    const [btn] = buttons(ui);
    assert.ok(btn);
    assert.equal(btn.getAttribute('aria-label'), 'Call Caller One back');
    assert.equal(btn.textContent, 'Call back');
    assert.equal(btn.type, 'button');
    assert.equal(btn.closest('.message-call-row').dataset.callEvent, 'missed');
    btn.click();
    ui.elements.conversationHeader.querySelector('.call-button').click();
    assert.equal(presses, 2);
});

test('only the latest missed row has it: a newer missed row takes it from the older one; other rows never have it', () => {
    const ui = makeUi();
    ui.setCallButton(callback, () => {});
    ui._addCallRow(missed(), 'Missed call', false);
    ui._addCallRow({ type: 'call', callEvent: 'incoming', text: 'Incoming call, 0:10' }, 'Incoming call, 0:10', false);
    assert.equal(buttons(ui).length, 1);
    ui._addCallRow(missed(), 'Missed call', false);
    const rows = [...ui.elements.messagesContainer.querySelectorAll('.message-call-row')];
    assert.equal(buttons(ui).length, 1);
    assert.equal(rows[0].querySelector('.call-row-callback'), null, 'the older missed row lost it');
    assert.ok(rows[2].querySelector('.call-row-callback'));
    assert.equal(rows[1].querySelector('.call-row-callback'), null);
});

test('clearing the callback (the header button goes back to nothing or "Call") removes the row button', () => {
    const ui = makeUi();
    ui._addCallRow(missed(), 'Missed call', false);
    ui.setCallButton(callback, () => {});
    assert.equal(buttons(ui).length, 1);
    ui.setCallButton({ label: 'Call', ariaLabel: 'Call Caller One', kind: 'connect' }, () => {});
    assert.equal(buttons(ui).length, 0, 'a plain "Call" is not a callback');
    ui.setCallButton(callback, () => {});
    ui.setCallButton(null, () => {});
    assert.equal(buttons(ui).length, 0);
});

test('a voicemail row has no button', () => {
    const ui = makeUi();
    ui.setCallButton(callback, () => {});
    ui._addCallRow({ type: 'call', callEvent: 'voicemail', text: 'Voicemail' }, 'Voicemail', false);
    assert.equal(buttons(ui).length, 0, 'only a missed row carries the button');
});
