// A6: the real adapter and NPCManager for callbacks and voicemail: the "Call back" button and what it
// dials, the saved callback across a reload (plan 2.6, 2.7), onMissed after a reload with no toast,
// the A4 R2 m1 sync, and the voicemail dispatch. The harness is the A2b one (jsdom, fake clock,
// fake framework). The voicemail runner itself is phone-voicemail-run.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One' };
const cfg = (extra = {}) => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, callLabel: 'Caller', ...extra });
const rows = (w, id = 'caller') => (w.nm.conversationHistory.get(id) || []).filter((m) => m.type === 'call').map((m) => m.text);
const events = (w, prefix) => w.dispatcher.emitted.filter(([n]) => n.startsWith(prefix)).map(([n]) => n);
const saveOf = (w) => JSON.parse(JSON.stringify(w.nm.exportPhoneState()));

function openPhone(w, { thread = 'caller', params = {} } = {}) {
    const mg = {
        _sceneType: 'phone-chat', _ending: false, phoneId: 'player_phone', gameState: { isActive: true },
        params: { phoneId: 'player_phone', title: 'Phone', npcId: thread, ...params },
        currentNPCId: thread, refreshed: 0,
        showIncomingCall() {}, hideIncomingCall() {},
        _refreshCallButton() { this.refreshed += 1; },
        callReopenState() { const p = { ...this.params }; delete p._closingForCall; return { params: p, thread: this.currentNPCId || null }; },
    };
    w.fw.currentMinigame = mg;
    w.win.phoneRinger.registerPhone(mg);
    return mg;
}

async function ringAndDecline(w, extra, id = 'caller') {
    w.nm._handleEventMapping(id, 'room_entered', cfg(extra), {});
    await w.advance(300);
    w.click('.incoming-call-decline');
    await w.advance(100);
}
const loaded = async (w, ms = 50) => { w.dispatcher.emit('game_loaded', {}); await w.advance(ms); };

test('Decline leaves a "Missed call" row, a pending callback and the saved slot; a contact with no call block gets a "Call back" button', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ringAndDecline(w);
        assert.deepEqual(rows(w), ['Missed call']);
        assert.deepEqual(w.ringer.callbackFor('caller'), { knot: 'ring_call', callLabel: 'Caller' });
        assert.equal(w.nm.getNPC('caller').pendingCall.live.state, 'missed');
        const phone = openPhone(w);
        assert.deepEqual(w.ringer.callButtonFor('caller', phone), { label: 'Call back', ariaLabel: 'Call Caller One back', kind: 'callback' });
        assert.deepEqual(events(w, 'phone_call_'), ['phone_call_declined:caller']);
    } finally { w.restore(); }
});

test('the open thread is told when a callback is set (its buttons refresh) and when it is cleared', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg(), {});
        await w.advance(300);
        // a phone on the contact list is no obstacle: the call rings inside it, Decline from there
        const phone = openPhone(w);
        phone.currentNPCId = 'caller';
        w.click('.incoming-call-decline');
        await w.advance(100);
        assert.ok(phone.refreshed >= 1, 'set: the open thread refreshes its buttons');
        const before = phone.refreshed;
        assert.equal(w.ringer.placeCall('caller', {}), true);
        w.ringer.outgoingConnected('caller', w.fw.currentMinigame.params.ringerCall.id);
        assert.equal(w.ringer.callbackFor('caller'), null);
        assert.ok(phone.refreshed >= before, 'clear: told too (no throw once the thread is gone)');
    } finally { w.restore(); }
});

test('the button dials the callback: a callback outgoing call on its knot with call_is_callback, connecting at once; it clears on connect and emits answered', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ringAndDecline(w);
        const phone = openPhone(w);
        assert.equal(w.ringer.placeCall('caller', {}), true);
        assert.equal(phone.params._closingForCall, true);
        const p = w.calls.started.at(-1).params;
        assert.deepEqual([p.npcId, p.startKnot, p.callLabel, p.voiced], ['caller', 'ring_call', 'Caller', true]);
        assert.equal(p.ringerCall.direction, 'outgoing');
        assert.equal(p.ringerCall.callback, true);
        assert.deepEqual(p.dial, { when: null, callback: true });
        assert.ok(w.ringer.callbackFor('caller'), 'kept until the connect');
        w.ringer.outgoingConnected('caller', p.ringerCall.id);
        assert.equal(w.ringer.callbackFor('caller'), null);
        assert.equal(w.nm.getNPC('caller').pendingCall, null);
        const answered = w.dispatcher.emitted.find(([n]) => n === 'phone_call_answered:caller');
        assert.equal(answered[1].callback, true);
        assert.equal(answered[1].knot, 'ring_call');
        // after the call the contact has no call button (no call block) and no callback
        w.fw.currentMinigame._endedByCall = true;
        w.fw.endMinigame(true);
        await w.advance(100);
        assert.equal(w.ringer.callButtonFor('caller', openPhone(w)), null);
    } finally { w.restore(); }
});

test('#place_call with no knot and with the callback\'s knot both dial the callback; another knot with no call entry does not', async () => {
    for (const knot of [null, 'ring_call']) {
        const w = makeWorld({ npcs: [npc] });
        try {
            await ringAndDecline(w);
            openPhone(w);
            assert.equal(w.ringer.placeCall('caller', { knot }), true, String(knot));
            assert.equal(w.calls.started.at(-1).params.ringerCall.callback, true, String(knot));
        } finally { w.restore(); }
    }
    const w = makeWorld({ npcs: [npc] });
    try {
        await ringAndDecline(w);
        openPhone(w);
        assert.equal(w.ringer.placeCall('caller', { knot: 'elsewhere' }), false);
    } finally { w.restore(); }
});

test('a callback wins over the call block: the button reads "Call back" and dials the callback knot, `when` skipped', async () => {
    const w = makeWorld({ npcs: [{ ...npc, call: { knot: 'desk_call', when: 'globalVars.never' } }] });
    try {
        await ringAndDecline(w);
        const phone = openPhone(w);
        assert.equal(w.ringer.callButtonFor('caller', phone).kind, 'callback');
        w.ringer.placeCall('caller', {});
        const p = w.calls.started.at(-1).params;
        assert.equal(p.startKnot, 'ring_call');
        assert.equal(p.dial.when, null);
    } finally { w.restore(); }
});

test('a new offer ringing clears the callback and the button (row 7)', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ringAndDecline(w);
        assert.ok(w.ringer.callbackFor('caller'));
        w.nm._handleEventMapping('caller', 'room_entered', cfg({ knot: 'ring_again', handlerIndex: 1 }), {});
        await w.advance(300);
        assert.equal(w.ringer.callbackFor('caller'), null);
        assert.equal(w.ringer.callButtonFor('caller', openPhone(w)), null);
        assert.equal(w.nm.getNPC('caller').pendingCall.live.state, 'ringing');
    } finally { w.restore(); }
});

test('a callback survives a reload: the button and call_is_callback come back, and no second missed event fires', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ringAndDecline(w);
        const saved = saveOf(w);
        assert.equal(saved.caller.pendingCall.live.state, 'missed');
        w2 = makeWorld({ npcs: [npc] });
        w2.nm.restorePhoneState(saved);
        await loaded(w2);
        assert.deepEqual(w2.ringer.callbackFor('caller'), { knot: 'ring_call', callLabel: 'Caller' });
        assert.equal(w2.ringer.callButtonFor('caller', openPhone(w2)).label, 'Call back');
        assert.deepEqual(events(w2, 'phone_call_'), []);
        assert.equal(rows(w2).length, 1, 'the saved row, no new one');
        w2.ringer.placeCall('caller', {});
        assert.equal(w2.calls.started.at(-1).params.ringerCall.callback, true, 'calling back after the reload still sets the flag');
        assert.equal(saveOf(w2).caller.pendingCall.live.state, 'missed', 'and the save still holds the callback');
    } finally { w.restore(); w2?.restore(); }
});

test('a ringing call lost to a reload (row 27) leaves a callback and one missed event; the slot is saved at once, so a second reload does not miss it again (A4 R2 m1)', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2; let w3;
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg(), {});
        await w.advance(300);
        const saved = saveOf(w);
        assert.equal(saved.caller.pendingCall.live.state, 'ringing');

        w2 = makeWorld({ npcs: [npc] });
        let syncs = 0;
        w2.win.stateSync = { sync: () => { syncs += 1; return Promise.resolve(); } };
        w2.nm.restorePhoneState(saved);
        await loaded(w2);
        assert.deepEqual(rows(w2), ['Missed call']);
        assert.deepEqual(events(w2, 'phone_call_'), ['phone_call_missed:caller']);
        assert.equal(w2.dispatcher.emitted.find(([n]) => n === 'phone_call_missed:caller')[1].reload, true);
        assert.equal(w2.ringer.callbackFor('caller').knot, 'ring_call', 'onMissed callback after a reload');
        await w2.advance(1000);
        assert.equal(syncs, 1, 'the resume scheduled the debounced sync');

        // the server now holds the second save; a second reload must not turn it into a miss again
        const second = saveOf(w2);
        assert.equal(second.caller.pendingCall.live.state, 'missed');
        w3 = makeWorld({ npcs: [npc] });
        w3.nm.restorePhoneState(second);
        await loaded(w3);
        assert.deepEqual(events(w3, 'phone_call_'), [], 'no second phone_call_missed');
        assert.equal(rows(w3).length, 1, 'one row');
        assert.equal(w3.ringer.callbackFor('caller').knot, 'ring_call', 'still one callback');
    } finally { w.restore(); w2?.restore(); w3?.restore(); }
});

test('the resume that leaves nothing (no onMissed result) still schedules a sync that clears the server slot', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg({ ring: { withheld: true, onMissed: 'voicemail', voicemailKnot: 'ring_vm' } }), {});
        await w.advance(300);
        const saved = saveOf(w);
        w2 = makeWorld({ npcs: [npc] });
        const ran = [];
        w2.nm.runVoicemail = (id, knot, opts) => { ran.push([id, knot, opts]); return Promise.resolve(true); };
        let syncs = 0;
        w2.win.stateSync = { sync: () => { syncs += 1; return Promise.resolve(); } };
        w2.nm.restorePhoneState(saved);
        await loaded(w2);
        await w2.advance(1000);
        assert.equal(syncs, 1);
        assert.equal(w2.nm.getNPC('caller').pendingCall, null, 'a voicemail leaves no callback, so the slot is empty');
        assert.deepEqual(ran, [['caller', 'ring_vm', { withheld: true, quiet: true }]], 'run silently after a reload');
        assert.deepEqual(rows(w2), ['Missed call: No caller ID']);
    } finally { w.restore(); w2?.restore(); }
});

test('onMissed voicemail: Decline runs the voicemail (withheld flag passed, a toast owed to the runner), no callback, no callback button', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const ran = [];
        w.nm.runVoicemail = (id, knot, opts) => { ran.push([id, knot, opts]); return Promise.resolve(true); };
        await ringAndDecline(w, { ring: { onMissed: 'voicemail', voicemailKnot: 'ring_vm', withheld: true } });
        assert.deepEqual(ran, [['caller', 'ring_vm', { withheld: true, quiet: false }]]);
        assert.equal(w.ringer.callbackFor('caller'), null);
        assert.equal(w.ringer.callButtonFor('caller', openPhone(w)), null);
        assert.deepEqual(rows(w), ['Missed call: No caller ID']);
        assert.deepEqual(events(w, 'phone_call_'), ['phone_call_declined:caller']);
    } finally { w.restore(); }
});

test('onMissed voicemail: ringing out (row 21) runs it too, and no "Call back" toast is shown', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const ran = [];
        const toasts = [];
        w.win.showNotification = (t) => toasts.push(t);
        w.nm.runVoicemail = (id, knot) => { ran.push(knot); return Promise.resolve(true); };
        w.nm._handleEventMapping('caller', 'room_entered', cfg({ ring: { onMissed: 'voicemail', voicemailKnot: 'ring_vm' } }), {});
        await w.advance(20800);
        assert.deepEqual(ran, ['ring_vm']);
        assert.deepEqual(events(w, 'phone_call_'), ['phone_call_missed:caller']);
        assert.equal(w.ringer.callbackFor('caller'), null);
    } finally { w.restore(); }
});

test('a call closed by something else (row 32) leaves a callback and the "Call back" button for a contact with no call block', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(800);
        w.fw.endMinigame(true);     // no _endedByCall: a knockout or another minigame
        await w.advance(100);
        assert.deepEqual(rows(w), ['Missed call']);
        assert.equal(w.ringer.callbackFor('caller').knot, 'ring_call');
        assert.equal(w.ringer.callButtonFor('caller', openPhone(w)).kind, 'callback');
    } finally { w.restore(); }
});
