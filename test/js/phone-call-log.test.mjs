// Slice A4: the thread rows of rows 20, 21, 25, 17, 18 and 32 (plan 2.6): `type: 'call'` messages with
// fixed plain text, written by the ringer's outcomes through the real adapter and NPCManager; their
// preview and unread count; and the places that must not treat a row as a conversation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { makeWorld, endCall, jsRoot } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One' };
const ringConfig = (extra = {}) => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra });

async function ring(w, extra) {
    w.nm._handleEventMapping('caller', 'room_entered', ringConfig(extra), {});
    await w.advance(300);
}
const rows = (w) => w.nm.getConversationHistory('caller').filter((m) => m.type === 'call');

test('row 20: Decline adds a "Missed call" row, unread', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        w.click('.incoming-call-decline');
        const r = rows(w);
        assert.equal(r.length, 1);
        assert.equal(r[0].text, 'Missed call');
        assert.equal(r[0].callEvent, 'missed');
        assert.equal(r[0].read, false);
        assert.equal(typeof r[0].timestamp, 'number');
    } finally { w.restore(); }
});

test('row 21: a ring that times out adds one "Missed call" row', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        await w.advance(30000);
        assert.deepEqual(rows(w).map((m) => m.text), ['Missed call']);
    } finally { w.restore(); }
});

test('row 17: Hang up from hold, and row 18 the hold limit, each add a missed row', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.fw.currentMinigame = { _sceneType: 'lockpicking', _ending: false, params: {} };
        w.win.phoneRinger.onMinigameStarted?.('lockpicking', {});
        await ring(w);
        w.click('.incoming-call-answer');
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        await w.advance(100000);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.deepEqual(rows(w).map((m) => m.text), ['Missed call']);
    } finally { w.restore(); }
});

test('row 25: a call ended by its own path adds "Incoming call, m:ss" with the time on the line, read', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        w.click('.incoming-call-answer');
        await w.advance(800);
        assert.ok(w.fw.currentMinigame?.params?.ringerCall, 'the call is open');
        await w.advance(84000);
        endCall(w);
        await w.advance(300);
        const r = rows(w);
        assert.equal(r.length, 1);
        assert.equal(r[0].text, 'Incoming call, 1:24');
        assert.equal(r[0].callEvent, 'incoming');
        assert.equal(r[0].read, true);
    } finally { w.restore(); }
});

test('row 25: a call under ten seconds reads 0:07; the time starts when the call opens, not at the ring', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        await w.advance(9000);
        w.click('.incoming-call-answer');
        await w.advance(800);
        await w.advance(7000);
        endCall(w);
        await w.advance(300);
        assert.equal(rows(w)[0].text, 'Incoming call, 0:07');
    } finally { w.restore(); }
});

test('row 32: a non-forced call closed by something else adds a missed row, not an "Incoming call" row', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        w.click('.incoming-call-answer');
        await w.advance(800);
        endCall(w, {});          // no _endedByCall: another minigame took over
        await w.advance(300);
        assert.deepEqual(rows(w).map((m) => m.text), ['Missed call']);
    } finally { w.restore(); }
});

test('withheld callers: "Missed call: No caller ID" and "Call: No caller ID"', async () => {
    for (const how of ['decline', 'answer']) {
        const w = makeWorld({ npcs: [npc] });
        try {
            await ring(w, { ring: { withheld: true, onMissed: 'voicemail', voicemailKnot: 'vm' } });
            if (how === 'decline') {
                w.click('.incoming-call-decline');
                assert.deepEqual(rows(w).map((m) => m.text), ['Missed call: No caller ID']);
            } else {
                w.click('.incoming-call-answer');
                await w.advance(800);
                endCall(w);
                await w.advance(300);
                assert.deepEqual(rows(w).map((m) => m.text), ['Call: No caller ID']);
            }
        } finally { w.restore(); }
    }
});

test('a forced call that is dropped after the ending began leaves no row', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w, { disableClose: true });
        await w.advance(8000);
        assert.ok(w.fw.currentMinigame?.params?.ringerCall);
        w.win.phoneRinger.close();
        endCall(w, {});
        await w.advance(300);
        assert.equal(rows(w).length, 0);
    } finally { w.restore(); }
});

test('a text mapping and a plain thread get no rows; an unknown event or a missing contact adds nothing', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.addMessage('caller', 'npc', 'hello');
        assert.equal(w.nm.addCallRow('caller', 'bogus'), null);
        assert.equal(w.nm.addCallRow('nobody', 'missed'), null);
        assert.equal(rows(w).length, 0);
        assert.equal(w.nm.addCallRow('caller', 'incoming', { seconds: 65 }).text, 'Incoming call, 1:05');
        assert.equal(w.nm.addCallRow('caller', 'outgoing', { seconds: 48 }).text, 'Outgoing call, 0:48');
        assert.equal(w.nm.addCallRow('caller', 'no_answer').text, 'No answer');
        assert.equal(w.nm.addCallRow('caller', 'voicemail').text, 'Voicemail');
    } finally { w.restore(); }
});

test('rows count as unread for the badge and the contact total; Missed only', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.addCallRow('caller', 'missed');
        w.nm.addCallRow('caller', 'incoming', { seconds: 5 });
        assert.equal(w.nm.getTotalUnreadCount('player_phone'), 1);
    } finally { w.restore(); }
});

test('a row is never barked: the ringer outcome shows no bark and the thread has no isBark entry', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        w.click('.incoming-call-decline');
        assert.ok(rows(w).every((m) => !m.isBark && !m.timed));
    } finally { w.restore(); }
});

// ---- the phone UI -----------------------------------------------------------------

const chat = join(jsRoot, 'minigames/phone-chat');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const stubs = `
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '';
const escHtml = (s) => String(s ?? '');
const noop = () => {};
const portraitFor = () => ({}), npcDmFields = () => ({}), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({}),
  isPhoneCallMode = () => false, callLabelFor = noop, formatCallDuration = noop, callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;
const uiSrc = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const dom = new JSDOM('<!doctype html><body></body>');

async function loadUi() {
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const mod = await import(dataUrl(stubs + uiSrc));
    return mod.PhoneChatUI || mod.default;
}

test('UI: a call row draws as a centred row with a phone glyph, text set as plain text, no bubble', async () => {
    const UI = await loadUi();
    const ui = Object.create(UI.prototype);
    ui.elements = { messagesContainer: dom.window.document.createElement('div') };
    ui.isTerminalTheme = false;
    ui.isCallMode = false;
    ui.currentNPCId = 'caller';
    ui.npcManager = { getNPC: () => ({ id: 'caller', displayName: 'Caller One' }) };
    ui.scrollToBottom = () => {};
    await ui.addMessage('call', 'Missed call <b>x</b>', true, { type: 'call', callEvent: 'missed', text: 'Missed call <b>x</b>' });
    const row = ui.elements.messagesContainer.querySelector('.message-call-row');
    assert.ok(row, 'row drawn');
    assert.equal(row.dataset.callEvent, 'missed');
    assert.ok(row.classList.contains('missed'));
    assert.equal(row.querySelector('b'), null, 'no markup');
    assert.match(row.textContent, /Missed call <b>x<\/b>/);
    assert.equal(ui.elements.messagesContainer.querySelector('.message-bubble'), null);
});

test('UI: the contact preview shows the last row, red for a missed call, and a missed row counts as unread', async () => {
    const UI = await loadUi();
    const mk = (history) => {
        const ui = Object.create(UI.prototype);
        ui.npcManager = { getConversationHistory: () => history };
        return ui.createContactItem({ id: 'caller', displayName: 'Caller One' });
    };
    const missed = mk([{ type: 'npc', text: 'hi', read: true, timestamp: 1 }, { type: 'call', callEvent: 'missed', text: 'Missed call', read: false, timestamp: 2 }]);
    const preview = missed.querySelector('.contact-last-message');
    assert.equal(preview.textContent, 'Missed call');
    assert.ok(preview.classList.contains('missed'));
    assert.equal(missed.querySelector('.unread-badge').textContent, '1');
    const ended = mk([{ type: 'call', callEvent: 'incoming', text: 'Incoming call, 0:30', read: true, timestamp: 2 }]);
    assert.equal(ended.querySelector('.contact-last-message').textContent, 'Incoming call, 0:30');
    assert.ok(!ended.querySelector('.contact-last-message').classList.contains('missed'));
    assert.equal(ended.querySelector('.unread-badge'), null);
});

test('rows are not a conversation: preload, first open and history checks skip them', () => {
    const minigame = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
    const conversation = readFileSync(join(chat, 'phone-chat-conversation.js'), 'utf8');
    assert.match(minigame, /!msg\.isBark && !msg\.timed && msg\.type !== 'call'/);
    assert.equal((conversation.match(/\.filter\(\(?m\)? => m\.type !== 'call'\)\.length > 0/g) || []).length, 2);
});

test('m3: a legacy voiced call screen skips a call row, and still draws the contact\'s lines as subtitles', async () => {
    const UI = await loadUi();
    const ui = Object.create(UI.prototype);
    const box = dom.window.document.createElement('div');
    ui.elements = { messagesContainer: box };
    ui.isTerminalTheme = false;
    ui.isCallMode = true;
    ui.currentNPCId = 'caller';
    ui.npcManager = { getNPC: () => ({ id: 'caller', displayName: 'Caller One' }) };
    ui.scrollToBottom = () => {};
    let subtitles = [];
    ui._addCallSubtitle = (type, text) => { subtitles.push([type, text]); return Promise.resolve(); };
    await ui.addMessage('call', 'Missed call', false, { type: 'call', callEvent: 'missed', text: 'Missed call' });
    ui.addMessages([{ type: 'call', callEvent: 'missed', text: 'Missed call' }, { type: 'npc', text: 'Hello there' }]);
    await Promise.resolve();
    assert.deepEqual(subtitles, [['npc', 'Hello there']]);
    assert.equal(box.querySelector('.message-call-row'), null);
});

// ---- A4 review round 1 m5: wiring the handover claims ----

// loadUi (above) points globalThis.window at its own DOM; the world needs its own back
const makeM5World = (opts) => { const w = makeWorld(opts); globalThis.window = w.win; globalThis.document = w.win.document; return w; };

const openThread = (w, npcId, drawn) => {
    w.fw.currentMinigame = { _sceneType: 'phone-chat', currentNPCId: npcId, _ending: false, params: {},
        ui: { addMessage: (type, text, scroll, row) => { drawn.push({ type, text, row }); return Promise.resolve(); } } };
};

test('m5: a row for the contact whose thread is open is drawn at once and counts as read', () => {
    const w = makeM5World({ npcs: [npc, { id: 'other', displayName: 'Other' }] });
    try {
        const drawn = [];
        openThread(w, 'caller', drawn);
        const row = w.nm.addCallRow('caller', 'missed');
        assert.equal(drawn.length, 1, 'drawn into the open thread');
        assert.equal(drawn[0].type, 'call');
        assert.equal(drawn[0].text, 'Missed call');
        assert.equal(row.read, true, 'seen, so not unread');
        assert.equal(w.nm.getTotalUnreadCount('player_phone'), 0);
    } finally { w.restore(); }
});

test('m5: a row for a contact whose thread is not the open one is not drawn there and stays unread', () => {
    const w = makeM5World({ npcs: [npc, { id: 'other', displayName: 'Other' }] });
    try {
        const drawn = [];
        openThread(w, 'other', drawn);
        const row = w.nm.addCallRow('caller', 'missed');
        assert.equal(drawn.length, 0, "caller's row is not drawn in other's thread");
        assert.equal(row.read, false);
        // and with the contact list (no thread) or no phone open at all
        w.fw.currentMinigame = { _sceneType: 'phone-chat', currentNPCId: null, _ending: false, params: {}, ui: { addMessage: () => drawn.push(1) } };
        w.nm.addCallRow('caller', 'missed');
        w.fw.currentMinigame = null;
        w.nm.addCallRow('caller', 'missed');
        assert.equal(drawn.length, 0);
    } finally { w.restore(); }
});

test('m5: a call that cannot be opened for good is given up as a missed row (giveUp passes missed)', async () => {
    const w = makeM5World({ npcs: [npc] });
    try {
        const start = w.fw.startMinigame.bind(w.fw);
        w.fw.startMinigame = function (type, container, params) {
            if (params?.ringerCall) return null;       // the open is refused every time
            return start(type, container, params);
        };
        await ring(w);
        w.click('.incoming-call-answer');
        await w.advance(120000);
        assert.equal(w.ringer.stateOf('caller'), null, 'given up');
        assert.deepEqual(rows(w).map((m) => m.text), ['Missed call']);
        assert.equal(rows(w)[0].read, false);
    } finally { w.restore(); }
});

test('m5: PhoneChatHistory.markAllRead marks an unread row read and counts it', async () => {
    const { default: PhoneChatHistory } = await import(pathToFileURL(join(chat, 'phone-chat-history.js')).href);
    const w = makeM5World({ npcs: [npc] });
    try {
        w.nm.addCallRow('caller', 'missed');
        w.nm.addMessage('caller', 'npc', 'hello');
        assert.equal(w.nm.getTotalUnreadCount('player_phone'), 2);
        const h = new PhoneChatHistory('caller', w.nm);
        assert.equal(h.getUnreadCount(), 2);
        assert.equal(h.markAllRead(), 2);
        assert.ok(rows(w).every((m) => m.read), 'row read');
        assert.equal(h.getUnreadCount(), 0);
        assert.equal(w.nm.getTotalUnreadCount('player_phone'), 0);
    } finally { w.restore(); }
});
