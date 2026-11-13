// A5: the header call button and the call bar's dialling states in PhoneChatUI, and the
// minigame's wiring of the button (plan 2.5, "Button", "Dialling"). The UI is loaded with its
// imports stubbed (no harness copy list).
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
  isPhoneCallMode = (p) => !!p && p.voiced === true && p.theme !== 'terminal', callLabelFor = (params, c) => (params && typeof params.callLabel === 'string' && params.callLabel.trim()) || (c && c.callLabel) || 'Voice call',
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

function makeUi({ voiced = false } = {}) {
    document.body.innerHTML = '<div id="host"></div>';
    const ui = Object.create(UI.prototype);
    ui.container = document.getElementById('host');
    ui.params = { voiced };
    ui.isCallMode = voiced;
    ui.isTerminalTheme = false;
    ui.container.innerHTML = `<div class="phone-messages-container"><div class="conversation-view" id="conversation-view">
        <div class="conversation-header" id="conversation-header"><button class="back-button" id="back-button">x</button>
        <div class="conversation-info"></div></div></div></div>`;
    if (voiced) {
        ui.container.querySelector('#conversation-view').insertAdjacentHTML('afterbegin', mod.CALL_STATUS_HTML || '');
    }
    ui.elements = { conversationHeader: document.getElementById('conversation-header'), callTimer: null };
    return ui;
}
function makeCallUi() {
    const ui = makeUi({ voiced: true });
    const view = ui.container.querySelector('#conversation-view');
    view.insertAdjacentHTML('afterbegin', `<div class="call-status-bar" id="call-status-bar"><span class="call-status-label"><span class="call-status-dot"></span>ON CALL</span><span class="call-timer" id="call-timer">0:07</span></div>`);
    ui.container.querySelector('#conversation-header').insertAdjacentHTML('beforeend', '<div class="call-caption" id="call-caption">Voice call</div>');
    ui.elements.callTimer = document.getElementById('call-timer');
    ui.stopCallTimer = () => { ui.stopped = (ui.stopped || 0) + 1; };
    return ui;
}

test('setCallButton: a green button in the header with the label, an aria label and a click handler; replacing and removing it', () => {
    const ui = makeUi();
    let presses = 0;
    ui.setCallButton({ label: 'Call', ariaLabel: 'Call Desk Sergeant' }, () => { presses++; });
    const btn = ui.elements.conversationHeader.querySelector('.call-button');
    assert.ok(btn);
    assert.equal(btn.getAttribute('aria-label'), 'Call Desk Sergeant');
    assert.equal(btn.querySelector('.call-button-text').textContent, 'Call');
    assert.equal(btn.type, 'button');
    btn.click();
    assert.equal(presses, 1);
    ui.setCallButton({ label: 'Call back', ariaLabel: 'Call Desk Sergeant back' }, () => {});
    assert.equal(ui.elements.conversationHeader.querySelectorAll('.call-button').length, 1, 'replaced, not stacked');
    assert.equal(ui.elements.conversationHeader.querySelector('.call-button-text').textContent, 'Call back');
    ui.setCallButton(null);
    assert.equal(ui.elements.conversationHeader.querySelector('.call-button'), null);
});

test('setCallButton: the press does not reach the header\'s own handlers (the profile link, the back arrow)', () => {
    const ui = makeUi();
    let reached = 0;
    ui.elements.conversationHeader.addEventListener('click', () => { reached++; });
    ui.setCallButton({ label: 'Call', ariaLabel: 'Call X' }, () => {});
    ui.elements.conversationHeader.querySelector('.call-button').click();
    assert.equal(reached, 0);
});

test('setCallStatus: calling shows CALLING with no timer and keeps the caption (who is being rung, A5 R1 m3); noanswer says NO ANSWER; oncall restores the bar', () => {
    const ui = makeCallUi();
    const bar = document.getElementById('call-status-bar');
    document.getElementById('call-caption').textContent = 'Albion ops desk';
    ui.setCallStatus('calling');
    assert.equal(bar.querySelector('.call-status-label').textContent, 'CALLING');
    assert.equal(document.getElementById('call-timer').textContent, '');
    assert.equal(document.getElementById('call-caption').textContent, 'Albion ops desk');
    assert.ok(bar.classList.contains('call-dialling'));
    ui.setCallStatus('noanswer');
    assert.equal(bar.querySelector('.call-status-label').textContent, 'NO ANSWER');
    assert.equal(document.getElementById('call-caption').textContent, 'No answer');
    assert.ok(bar.classList.contains('call-ended') && !bar.classList.contains('call-dialling'));
    ui.setCallStatus('oncall');
    assert.match(bar.querySelector('.call-status-label').innerHTML, /call-status-dot[\s\S]*ON CALL/);
    assert.ok(!bar.classList.contains('call-ended') && !bar.classList.contains('call-dialling'));
});

test('setCallStatus: nothing to do without a call screen (a thread, the terminal look)', () => {
    const ui = makeUi();
    ui.isCallMode = false;
    assert.doesNotThrow(() => ui.setCallStatus('calling'));
});

test('wiring: the minigame draws the button after showConversation and a press saves the story and places the call; a call screen has none', async () => {
    const src = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    assert.match(src, /this\.ui\.showConversation\(npcId\);\s*this\._refreshCallButton\?\.\(npcId\);/);
    assert.match(src, /const state = this\.params\?\.ringerCall \? null : window\.phoneRinger\?\.callButtonFor\?\.\(npcId, this\)/);
    assert.match(src, /_pressCall\(npcId\) \{[\s\S]*saveStoryState\(\);[\s\S]*placeCall\?\.\(npcId, \{\}\)/);
});

test('css: the call button and the dialling bar have rules, and the dialling pulse respects reduced motion', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    assert.match(css, /\.conversation-header \.call-button \{/);
    assert.match(css, /\.call-status-bar\.call-dialling/);
    assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.phone-call-mode \.call-status-bar\.call-dialling/);
});

test('m3: the dial screen is captioned with the call\'s callLabel, else the contact\'s, else "Voice call"; the dial keeps it', () => {
    const dial = (params, npc) => {
        const ui = makeCallUi();
        ui.container.querySelector('#conversation-header #call-caption').remove();
        ui.container.querySelector('#conversation-view').insertAdjacentHTML('beforeend', '<div class="call-caption" id="call-caption">Voice call</div>');
        ui.params = params;
        ui.npcManager = { getNPC: () => npc };
        ui.elements = { ...ui.elements, contactListView: { style: {} }, conversationView: document.getElementById('conversation-view'),
            messagesContainer: document.createElement('div'), choicesContainer: document.createElement('div') };
        ui.updateHeader = () => {};
        ui.startCallTimer = () => {};
        ui.showConversation('vance');
        ui.setCallStatus('calling');
        return document.getElementById('call-caption').textContent;
    };
    assert.equal(dial({ voiced: true, callLabel: 'Albion ops desk' }, { id: 'vance' }), 'Albion ops desk');
    assert.equal(dial({ voiced: true }, { id: 'vance', callLabel: 'Desk line' }), 'Desk line');
    assert.equal(dial({ voiced: true }, { id: 'vance' }), 'Voice call');
    assert.equal(document.getElementById('call-status-bar').querySelector('.call-status-label').textContent, 'CALLING');
});

test('_renderCallChrome: the caption resolves at render, no "Voice call" flash (M1 R4/R5 n1)', () => {
    const render = (params, npc) => {
        const ui = makeUi({ voiced: true });
        ui.params = params;
        ui.npcManager = { getNPC: (id) => (id === params.npcId ? npc : null) };
        ui._renderCallChrome();
        return ui.container.querySelector('#call-caption')?.textContent;
    };
    // The contact-level callLabel (what used to flash in after "Voice call") is resolved up front.
    assert.equal(render({ voiced: true, npcId: 'hax' }, { id: 'hax', callLabel: 'SAFETYNET secure line' }), 'SAFETYNET secure line');
    // The offer/mapping callLabel still wins over the contact's.
    assert.equal(render({ voiced: true, npcId: 'hax', callLabel: 'ENTROPY' }, { id: 'hax', callLabel: 'SAFETYNET secure line' }), 'ENTROPY');
    // Nothing authored: the plain fallback.
    assert.equal(render({ voiced: true, npcId: 'hax' }, { id: 'hax' }), 'Voice call');
});
