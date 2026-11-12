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
    assert.match(minigameSrc, /cleanup\(\) \{[\s\S]*?this\._callVoice = null;\s*window\.phoneRinger\?\.unregisterPhone\?\.\(this\);/);
});

test('cleanup skips conversation_closed for a phone closed for a call (row 10)', () => {
    assert.match(minigameSrc, /_emitConversationClosed\(npcId\) \{[\s\S]*?if \(this\.params\?\._closingForCall\) return;[\s\S]*?emit\(`conversation_closed:/);
});

test('the call panel blocks number keys and has a UI show/hide pair', () => {
    assert.match(minigameSrc, /this\.ui\?\.incomingCallShowing\?\.\(\) && \/\^\[0-9\]\$\/\.test\(event\.key\)/);
    assert.match(uiSrc, /showIncomingCall\(view\) \{/);
    assert.match(uiSrc, /hideIncomingCall\(\) \{/);
    assert.match(uiSrc, /cleanup\(\) \{\s*this\.hideIncomingCall\(\);/);
});

// ---- A3 review round 1, M1: a phone closed for a call and never reopened still owes its thread's
// conversation_closed (the closed-for-call phone emitted nothing, row 10).
const closedEvents = (w, id) => w.dispatcher.emitted.filter(([n]) => n === `conversation_closed:${id}`);
const startedPhones = (w) => w.calls.started.filter((s) => s.type === 'phone-chat' && !s.params.ringerCall);

/** Ring, answer from the panel, open the call. Returns { phone, call }. */
async function answerOver(w, phone, { forced = false } = {}) {
    w.nm._handleEventMapping('caller', 'room_entered', { ...ringConfig(), ...(forced ? { disableClose: true } : {}) }, {});
    await w.advance(300);
    if (forced) await w.advance(6200); else phone.panel.onAnswer();
    await w.advance(700);
    return w.fw.currentMinigame;
}

test('M1: a normal End reopens the phone and the ringer emits nothing for the thread (the real close will)', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await answerOver(w, phone);
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(startedPhones(w).length, 1, 'reopened');
        assert.equal(closedEvents(w, 'other').length, 0);
    } finally { w.restore(); }
});

test('M1: a hit within HIT_QUIET_MS before End leaves the phone closed and emits conversation_closed for its thread once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await answerOver(w, phone);
        const hitAt = w.win.performance.now();
        w.win.lastPlayerHitAt = () => hitAt;
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(startedPhones(w).length, 0, 'not reopened');
        assert.equal(closedEvents(w, 'other').length, 1);
        await w.advance(8000);
        assert.equal(closedEvents(w, 'other').length, 1, 'once');
    } finally { w.restore(); }
});

test('M1: a phone on its contact list (no thread) owes no event when it is not reopened', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const phone = openPhone(w, { thread: null, params: { npcId: undefined } });
        await answerOver(w, phone);
        const hitAt = w.win.performance.now();
        w.win.lastPlayerHitAt = () => hitAt;
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(w.dispatcher.emitted.filter(([n]) => n.startsWith('conversation_closed:')).length, 0);
    } finally { w.restore(); }
});

test('M1 (row 32): another minigame closing the call leaves the phone closed and emits its thread event once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await answerOver(w, phone);
        w.fw.startMinigame('lockpicking', null, {});      // the call ends without its own flags
        await w.advance(300);
        assert.equal(startedPhones(w).length, 0);
        assert.equal(closedEvents(w, 'other').length, 1);
    } finally { w.restore(); }
});

test('M1 (row 25 drop): a scripted beat queued at the call\'s end drops the reopen and emits the thread event once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await answerOver(w, phone);
        w.nm._scriptedCallQueue = [{ npcId: 'other' }];
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(startedPhones(w).length, 0);
        assert.equal(closedEvents(w, 'other').length, 1);
    } finally { w.restore(); }
});

test('M1 (row 28): the ringer closed while the call is connected: the call ends, the reopen is dropped, the thread event fires once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        await answerOver(w, phone);
        w.ringer.close();
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        assert.equal(startedPhones(w).length, 0);
        assert.equal(closedEvents(w, 'other').length, 1);
    } finally { w.restore(); }
});

test('M1 (row 28): the ringer closing while an offer is held with the phone already put aside emits the thread event once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        const realStart = w.fw.startMinigame.bind(w.fw);
        w.fw.startMinigame = (type, c, params) => (params?.ringerCall ? null : realStart(type, c, params));   // the call keeps refusing to open
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        phone.panel.onAnswer();
        await w.advance(900);
        assert.ok(w.calls.ended.includes(phone), 'the phone was put aside');
        assert.ok(['held', 'connected'].includes(w.ringer.stateOf('caller')));
        assert.equal(closedEvents(w, 'other').length, 0);
        w.ringer.close();
        await w.advance(300);
        assert.equal(closedEvents(w, 'other').length, 1);
        await w.advance(8000);
        assert.equal(closedEvents(w, 'other').length, 1, 'once');
    } finally { w.restore(); }
});

test('M1 (giveUp): an open refused until the ringer gives up, with a beat queued, drops the reopen and emits once', async () => {
    const w = makeWorld({ npcs: [npc, other] });
    try {
        const phone = openPhone(w, { thread: 'other' });
        const realStart = w.fw.startMinigame.bind(w.fw);
        w.fw.startMinigame = (type, c, params) => (params?.ringerCall ? null : realStart(type, c, params));
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        phone.panel.onAnswer();
        // refuse four times; with the fifth open waiting on its 500 ms timer, queue a beat: the second
        // check ignores it, the reopen after giving up does not
        for (let i = 0; i < 200; i++) {
            await w.advance(100);
            const cur = w.ringer.current();
            if (cur && cur.refusals === 4 && cur.state === 'connected') break;
        }
        assert.equal(w.ringer.current().refusals, 4);
        w.nm._scriptedCallQueue = [{ npcId: 'other' }];
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), null, 'gave up');
        assert.equal(startedPhones(w).length, 0, 'not reopened');
        assert.equal(closedEvents(w, 'other').length, 1);
    } finally { w.restore(); }
});

test('M1 (row 26): a second phone opened during a forced re-ring replaces the first descriptor; the first thread owes its event, the call ends back on the newer screen', async () => {
    const w = makeWorld({ npcs: [npc, other, { id: 'third', displayName: 'Third' }] });
    try {
        const first = openPhone(w, { thread: 'other' });
        await answerOver(w, first, { forced: true });
        assert.ok(w.fw.currentMinigame.params.ringerCall, 'the forced call is open');
        // a hit closes the call (not its own path): it rings again after HIT_QUIET_MS
        const hitAt = w.win.performance.now();
        w.win.lastPlayerHitAt = () => hitAt;
        w.fw.endMinigame(false);
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'queued');
        // the player opens the phone again, on another thread, before the re-ring
        const second = openPhone(w, { thread: 'third' });
        w.win.phoneRinger.onMinigameStarted('phone-chat', second.params);
        await w.advance(4500);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        assert.ok(second.panel, 'rings inside the second phone');
        await w.advance(6500);                            // forced: it answers itself
        await w.advance(700);
        assert.equal(closedEvents(w, 'other').length, 1, 'the older descriptor was dropped through the helper');
        w.win.lastPlayerHitAt = () => null;
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(300);
        const reopened = startedPhones(w).pop();
        assert.equal(reopened.params.npcId, 'third', 'back on the newer screen');
        assert.equal(closedEvents(w, 'third').length, 0);
        assert.equal(closedEvents(w, 'other').length, 1);
    } finally { w.restore(); }
});
