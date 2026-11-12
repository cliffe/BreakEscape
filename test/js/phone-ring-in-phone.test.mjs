import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeWorld, jsRoot } from './phone-ring-harness.mjs';
import { join } from 'node:path';

// Slice A3, row 10: a call rings inside the player's own phone.
const npc = { id: 'caller', displayName: 'Caller One' };
const other = { id: 'other', displayName: 'Other' };
const ringConfig = () => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 });

/** A stand-in for the open text phone-chat: what the ringer reads and calls on it. */
function openPhone(w, { phoneId = 'player_phone', thread = null, register = true, params = {} } = {}) {
    const shown = [];
    const mg = {
        _sceneType: 'phone-chat', _ending: false, phoneId,
        gameState: { isActive: true },
        params: { phoneId, title: 'Phone', startKnot: 'opening', npcId: thread || undefined, ...params },
        currentNPCId: thread,
        panel: null,
        shown,
        showIncomingCall(view) { this.panel = view; shown.push(view); },
        hideIncomingCall() { this.panel = null; },
        callReopenState() { const p = { ...this.params }; delete p._closingForCall; return { params: p, thread: this.currentNPCId || null }; },
    };
    w.fw.currentMinigame = mg;
    if (register) w.win.phoneRinger.registerPhone(mg);
    return mg;
}

async function ring(w) {
    w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
    await w.advance(300);
}

test('row 10: the player\'s phone on its contact list shows the panel, not the banner, and does not hold', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w);
        await ring(w);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        assert.ok(phone.panel, 'panel shown in the phone');
        assert.equal(phone.panel.npcId, 'caller');
        assert.equal(phone.panel.name, 'Caller One');
        assert.equal(w.banner(), null, 'no banner in the layer');
    } finally { w.restore(); }
});

test('row 10: Answer closes the phone with _closingForCall, opens the call, and the phone reopens on its thread afterwards', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await ring(w);
        phone.panel.onAnswer();
        await w.advance(700);
        assert.equal(phone.params._closingForCall, true, 'closed for the call');
        assert.equal(w.calls.ended[0], phone);
        const call = w.fw.currentMinigame;
        assert.equal(call.params.npcId, 'caller');
        assert.ok(call.params.ringerCall, 'the call is open');
        assert.equal(w.calls.started.filter((s) => s.type === 'phone-chat').length, 1, 'the phone itself was not reopened yet');
        // the call ends by its own path
        call._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        const reopened = w.calls.started[w.calls.started.length - 1];
        assert.equal(reopened.type, 'phone-chat');
        assert.equal(reopened.params.npcId, 'other', 'on the thread it was on');
        assert.equal(reopened.params.startKnot, undefined, 'a reopen is not a first open');
        assert.equal(reopened.params._closingForCall, undefined);
        assert.equal(reopened.params.ringerCall, undefined);
    } finally { w.restore(); }
});

test('row 10: the phone opened on its contact list reopens on the list', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w, { thread: null, params: { npcId: undefined } });
        await ring(w);
        phone.panel.onAnswer();
        await w.advance(700);
        const call = w.fw.currentMinigame;
        call._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        const reopened = w.calls.started[w.calls.started.length - 1];
        assert.equal(reopened.type, 'phone-chat');
        assert.equal('npcId' in reopened.params, false, 'no thread: the contact list');
        assert.equal(reopened.params.phoneId, 'player_phone');
    } finally { w.restore(); }
});

test('row 10: the caller\'s own thread open: the phone reopens on that thread', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w, { thread: 'caller' });
        await ring(w);
        phone.panel.onAnswer();
        await w.advance(700);
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(w.calls.started[w.calls.started.length - 1].params.npcId, 'caller');
    } finally { w.restore(); }
});

test('row 10: a forced call has no Decline in the panel', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w);
        w.nm._handleEventMapping('caller', 'room_entered', { ...ringConfig(), disableClose: true }, {});
        await w.advance(300);
        assert.equal(phone.panel.forced, true);
    } finally { w.restore(); }
});

test('row 10: Decline in the panel declines; the panel goes', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w);
        await ring(w);
        phone.panel.onDecline();
        await w.advance(100);
        assert.equal(phone.panel, null);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.ok(w.dispatcher.emitted.some(([n]) => n === 'phone_call_declined:caller'));
        assert.equal(w.fw.currentMinigame, phone, 'the phone stays open');
    } finally { w.restore(); }
});

test('row 10: closing the phone while it rings moves the ring to the banner', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w);
        await ring(w);
        assert.equal(w.banner(), null);
        w.fw.endMinigame(false);
        await w.advance(300);
        assert.ok(w.banner(), 'banner in the layer');
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
    } finally { w.restore(); }
});

test('row 10: a phone opened while the banner rings takes the ring into the panel', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        assert.ok(w.banner());
        const phone = openPhone(w);
        w.win.phoneRinger.onMinigameStarted('phone-chat', phone.params);
        await w.advance(300);
        assert.ok(phone.panel, 'panel');
        assert.equal(w.banner(), null, 'banner gone');
    } finally { w.restore(); }
});

test('row 12 still holds for a phone that is not the caller\'s (a desk phone, a DM app)', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w, { phoneId: 'ward_desk_phone' });
        await ring(w);
        assert.ok(w.banner(), 'banner, not the in-phone panel');
        assert.equal(phone.panel, null);
        assert.match(w.banner().textContent, /Answer puts them on hold/);
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.equal(w.fw.currentMinigame, phone, 'the desk phone is untouched');
        assert.notEqual(phone.params._closingForCall, true);
    } finally { w.restore(); }
});

test('row 10: a phone that never registered (a call, a forced chat) is not a host', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w, { register: false });
        await ring(w);
        assert.equal(phone.panel, null);
        assert.ok(w.banner());
    } finally { w.restore(); }
});

test('row 10: unregisterPhone ignores a phone that is not the registered one', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w);
        w.win.phoneRinger.unregisterPhone({});
        await ring(w);
        assert.ok(phone.panel);
        w.win.phoneRinger.unregisterPhone(phone);
        await w.advance(300);
        assert.ok(w.banner(), 'unregistered: no longer a host');
    } finally { w.restore(); }
});

// The minigame's half (phone-chat-minigame.js, phone-chat-ui.js) is checked on the source here and
// proved live in docs/agents/phone_calls/proofs/A3/.
const chat = join(jsRoot, 'minigames/phone-chat');
const minigameSrc = readFileSync(join(chat, 'phone-chat-minigame.js'), 'utf8');
const uiSrc = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8');

test('phone-chat registers a text phone in init and unregisters in cleanup', () => {
    assert.match(minigameSrc, /this\._registerWithRinger\(\);/);
    assert.match(minigameSrc, /if \(p\.ringerCall \|\| p\.voiced === true \|\| p\.disableClose === true \|\| p\.pretextCallId \|\| p\.cutscene === true\) return;\s*window\.phoneRinger\?\.registerPhone\?\.\(this\);/);
    assert.match(minigameSrc, /cleanup\(\) \{[\s\S]*?window\.phoneRinger\?\.unregisterPhone\?\.\(this\);/);
});

test('cleanup skips conversation_closed for a phone closed for a call (row 10)', () => {
    assert.match(minigameSrc, /if \(!this\.params\?\._closingForCall\) this\._emitConversationClosed\(this\.currentNPCId\);/);
});

test('the call panel blocks number keys and has a UI show/hide pair', () => {
    assert.match(minigameSrc, /this\.ui\?\.incomingCallShowing\?\.\(\) && \/\^\[0-9\]\$\/\.test\(event\.key\)/);
    assert.match(uiSrc, /showIncomingCall\(view\) \{/);
    assert.match(uiSrc, /hideIncomingCall\(\) \{/);
    assert.match(uiSrc, /cleanup\(\) \{\s*this\.hideIncomingCall\(\);/);
});
