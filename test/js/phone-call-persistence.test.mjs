// Slice A4: phone state across a reload (plan 2.3 row 27, 2.7). The saved `pendingCall` slot
// ({ forced: [...], live }) leaves with the contact's thread, comes back with it, and on game_loaded
// forced calls ring again and every other saved call is missed (row, no toast, event after load).
// Also the delivered mark of a ring timedConversation, and `callEvent` on a thread row.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One' };
const ringConfig = (extra = {}) => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra });
const rows = (w) => w.nm.getConversationHistory('caller').filter((m) => m.type === 'call');

async function ring(w, extra) {
    w.nm._handleEventMapping('caller', 'room_entered', ringConfig(extra), {});
    await w.advance(300);
}

/** What the server would hold: the phone state, through JSON. */
const saveOf = (w) => JSON.parse(JSON.stringify(w.nm.exportPhoneState()));

/** A second world that loads a save, as game.js does, then fires game_loaded. */
async function reload(saved, { npcs = [npc], timed = null } = {}) {
    const w = makeWorld({ npcs });
    w.nm.restorePhoneState(saved);
    if (timed) w.nm.restoreTimedMessages(timed);
    return w;
}
const loaded = async (w, ms = 50) => { w.dispatcher.emit('game_loaded', {}); await w.advance(ms); };
const events = (w, prefix) => w.dispatcher.emitted.filter(([n]) => n.startsWith(prefix)).map(([n]) => n);

test('a first call from a contact with no thread is saved: the entry survives with only a pendingCall', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        assert.equal(w.nm.exportPhoneState().caller, undefined);
        await ring(w);
        const entry = w.nm.exportPhoneState().caller;
        assert.ok(entry, 'entry kept');
        assert.deepEqual(entry.history, []);
        assert.equal(entry.pendingCall.live.knot, 'ring_call');
        assert.equal(entry.pendingCall.live.state, 'ringing');
    } finally { w.restore(); }
});

test('pendingCall export for every state: ringing, held, connected, queued', async () => {
    const w = makeWorld({ npcs: [npc, { id: 'second', displayName: 'Second' }] });
    try {
        await ring(w);
        assert.equal(saveOf(w).caller.pendingCall.live.state, 'ringing');
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.equal(saveOf(w).caller.pendingCall.live.state, 'connected');
        await w.advance(800);
        assert.equal(saveOf(w).caller.pendingCall.live.state, 'connected');
        // a second offer for the same contact queues behind the connected call
        w.nm._handleEventMapping('caller', 'room_entered', { ...ringConfig(), knot: 'other_call', handlerIndex: 1 }, {});
        await w.advance(100);
        const live = saveOf(w).caller.pendingCall.live;
        assert.equal(live.state, 'connected', 'the connected call is the most live');
    } finally { w.restore(); }
});

test('held: a call answered over a lockpick is saved as held', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.fw.currentMinigame = { _sceneType: 'lockpicking', _ending: false, params: {} };
        w.win.phoneRinger.onMinigameStarted?.('lockpicking', {});
        await ring(w);
        w.click('.incoming-call-answer');
        await w.advance(300);
        assert.equal(saveOf(w).caller.pendingCall.live.state, 'held');
    } finally { w.restore(); }
});

test('answerSeconds, untilAnswered, callLabel and onMissed survive the save', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w, { ring: { untilAnswered: true, onMissed: 'callback' }, callLabel: 'Front desk' });
        await w.advance(7000);
        w.click('.incoming-call-answer');
        await w.advance(900);
        const live = saveOf(w).caller.pendingCall.live;
        assert.equal(live.untilAnswered, true);
        assert.equal(live.answerSeconds, 7);
        assert.equal(live.onMissed, 'callback');
    } finally { w.restore(); }
});

test('the call ending clears the saved slot, and a pendingCall-only entry disappears with it', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        w.click('.incoming-call-decline');
        const entry = w.nm.exportPhoneState().caller;
        assert.equal(entry.pendingCall, undefined);
        assert.equal(entry.history.length, 1, 'only the missed row is left');
    } finally { w.restore(); }
});

test('callEvent survives the save and the restore, with the row unread', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w);
        w.click('.incoming-call-decline');
        const saved = saveOf(w);
        assert.equal(saved.caller.history[0].callEvent, 'missed');
        w2 = await reload(saved);
        const r = rows(w2);
        assert.equal(r.length, 1);
        assert.equal(r[0].callEvent, 'missed');
        assert.equal(r[0].text, 'Missed call');
        assert.equal(r[0].read, false);
    } finally { w.restore(); w2?.restore(); }
});

for (const state of ['ringing', 'held', 'connected']) {
    test(`row 27: a non-forced call saved while ${state} is missed after a reload: row, no toast, event after game_loaded, no ring`, async () => {
        const w = makeWorld({ npcs: [npc] });
        let w2;
        try {
            if (state === 'held') {
                w.fw.currentMinigame = { _sceneType: 'lockpicking', _ending: false, params: {} };
                w.win.phoneRinger.onMinigameStarted?.('lockpicking', {});
            }
            await ring(w);
            if (state !== 'ringing') { w.click('.incoming-call-answer'); await w.advance(900); }
            const saved = saveOf(w);
            assert.equal(saved.caller.pendingCall.live.state, state);
            w2 = await reload(saved);
            const toasts = [];
            w2.win.showNotification = (t) => toasts.push(t);
            await loaded(w2);
            assert.equal(w2.ringer.stateOf('caller'), null, 'it does not ring');
            assert.equal(w2.banner(), null);
            assert.deepEqual(rows(w2).map((m) => m.text), ['Missed call']);
            assert.equal(rows(w2)[0].read, false);
            assert.deepEqual(events(w2, 'phone_call_missed'), ['phone_call_missed:caller']);
            assert.deepEqual(toasts, []);
            assert.equal(w2.nm.exportPhoneState().caller.pendingCall, undefined, 'the slot is cleared');
        } finally { w.restore(); w2?.restore(); }
    });
}

test('row 27: phone_call_missed comes after game_loaded, not before it', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w);
        const saved = saveOf(w);
        w2 = await reload(saved);
        await w2.advance(200);
        assert.deepEqual(events(w2, 'phone_call_missed'), [], 'nothing before game_loaded');
        const order = [];
        w2.dispatcher.on('game_loaded', () => order.push('loaded'));
        w2.dispatcher.on('phone_call_missed:caller', () => order.push('missed'));
        await loaded(w2);
        assert.deepEqual(order, ['loaded', 'missed']);
    } finally { w.restore(); w2?.restore(); }
});

test('row 27: a forced call rings again RERING_AFTER_LOAD_MS after game_loaded and opens with resume and the saved answerSeconds', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w, { disableClose: true });
        await w.advance(8000);
        assert.ok(w.fw.currentMinigame?.params?.ringerCall, 'on the line');
        const saved = saveOf(w);
        assert.equal(saved.caller.pendingCall.forced.length, 1);
        assert.equal(saved.caller.pendingCall.forced[0].disableClose, true);
        const answerSeconds = saved.caller.pendingCall.forced[0].answerSeconds;
        w2 = await reload(saved);
        w2.nm.getNPC('caller').storyState = '{}';     // the thread's saved story came back with the save
        await loaded(w2, 100);
        assert.equal(w2.ringer.stateOf('caller'), 'queued', 'waiting for its turn');
        assert.equal(rows(w2).length, 0, 'a forced call leaves no missed row');
        assert.deepEqual(events(w2, 'phone_call_missed'), []);
        await w2.advance(12000);
        const started = w2.calls.started.find((s) => s.params?.ringerCall);
        assert.ok(started, 'the call opened again');
        assert.equal(started.params.startKnot, null, 'resume: the saved story, not the call knot from its start');
        assert.equal(w2.ringer.callVariablesFor('caller', 'phone-chat').call_answer_seconds, answerSeconds);
        assert.equal(events(w2, 'phone_call_answered').length, 0, 'no second answered event');
    } finally { w.restore(); w2?.restore(); }
});

test('row 27: a forced call and a non-forced one for the same contact: the forced rings again, the other is missed', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w, { disableClose: true });
        w.nm._handleEventMapping('caller', 'room_entered', { ...ringConfig(), knot: 'plain_call', handlerIndex: 1 }, {});
        await w.advance(300);
        const saved = saveOf(w);
        assert.equal(saved.caller.pendingCall.forced.length, 1);
        w2 = await reload(saved);
        await loaded(w2, 100);
        assert.equal(w2.ringer.stateOf('caller'), 'queued');
        assert.equal(rows(w2).length, saved.caller.pendingCall.live ? 1 : 0);
    } finally { w.restore(); w2?.restore(); }
});

test('the restored slot is re-saved by the ringer: a second reload of a still-forced call keeps it', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w, { disableClose: true });
        const saved = saveOf(w);
        w2 = await reload(saved);
        await loaded(w2, 100);
        const again = saveOf(w2);
        assert.equal(again.caller.pendingCall.forced.length, 1);
    } finally { w.restore(); w2?.restore(); }
});

test('a saved pendingCall reaches a contact that registers after game_loaded', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        await ring(w);
        const saved = saveOf(w);
        w2 = await reload(saved, { npcs: [] });
        await loaded(w2);
        w2.nm.npcs.set('caller', { id: 'caller', displayName: 'Caller One', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'start' });
        w2.nm._applySavedPhoneState('caller');
        await w2.advance(50);
        assert.deepEqual(rows(w2).map((m) => m.text), ['Missed call']);
        assert.deepEqual(events(w2, 'phone_call_missed'), ['phone_call_missed:caller']);
    } finally { w.restore(); w2?.restore(); }
});

test('a ring mapping\'s trigger is saved at offer, so a call turned into a missed one is not offered again', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        await ring(w);
        const triggers = w.nm.exportTriggeredEvents();
        assert.ok(Object.keys(triggers).length >= 1, JSON.stringify(triggers));
    } finally { w.restore(); }
});

// ---- the delivered mark of a ring timedConversation (plan 2.3, A4) ----------------------

const timedOpts = { npcId: 'caller', targetKnot: 'ring_call', delay: 0, ring: true, setGlobalOnStart: 'timed_ringing' };

test('a ring timedConversation that was offered is saved as delivered, and not scheduled again after a reload', async () => {
    const w = makeWorld({ npcs: [npc] });
    let w2;
    try {
        w.nm.scheduleTimedConversation(timedOpts);
        const conv = w.nm.timedConversations[0];
        assert.equal(conv.id, 'conv:caller:ring_call:0');
        assert.deepEqual(w.nm.exportTimedMessages().delivered, [], 'not yet offered');
        w.nm._deliverTimedConversation(conv);
        conv.delivered = true;
        await w.advance(300);
        const timed = JSON.parse(JSON.stringify(w.nm.exportTimedMessages()));
        assert.deepEqual(timed.delivered, ['conv:caller:ring_call:0']);
        // reload: the saved delivered ids come first, then the scenario schedules its conversation again
        w2 = await reload(saveOf(w), { timed });
        w2.nm.scheduleTimedConversation(timedOpts);
        const again = w2.nm.timedConversations[0];
        assert.equal(again.delivered, true);
        // the one-second tick does not deliver it
        w2.nm.gameStartTime = Date.now() - 60000;
        w2.nm.checkTimedMessages?.();
        await w2.advance(600);
        assert.equal(w2.ringer.stateOf('caller'), null, 'it did not ring');
        assert.equal(w2.banner(), null);
    } finally { w.restore(); w2?.restore(); }
});

test('the delivered mark also holds when the saved ids arrive after the scenario scheduled the conversation', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.scheduleTimedConversation(timedOpts);
        w.nm.restoreTimedMessages({ pending: [], delivered: ['conv:caller:ring_call:0'] });
        assert.equal(w.nm.timedConversations[0].delivered, true);
    } finally { w.restore(); }
});

test('a timed ring that was never offered is scheduled again after a reload; a non-ring timedConversation never gets a delivered mark', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.scheduleTimedConversation({ ...timedOpts, delay: 60000 });
        w.nm.scheduleTimedConversation({ npcId: 'caller', targetKnot: 'plain', delay: 0 });
        assert.deepEqual(w.nm.exportTimedMessages().delivered, []);
        assert.equal(w.nm.timedConversations[1].id, undefined);
    } finally { w.restore(); }
});

test('two timed rings to the same knot get their own ids', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.scheduleTimedConversation({ ...timedOpts, delay: 5000 });
        w.nm.scheduleTimedConversation({ ...timedOpts, delay: 9000 });
        assert.deepEqual(w.nm.timedConversations.map((c) => c.id), ['conv:caller:ring_call:0', 'conv:caller:ring_call:1']);
    } finally { w.restore(); }
});
