// A2b: the busy rule (plan 2.2, 2.9): a connected or opening ringer call is not torn down by a
// scripted conversation, which waits behind it; a stale `_scriptedCall` never blocks a call.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall } from './phone-ring-harness.mjs';

const npcs = [
    { id: 'caller', displayName: 'Caller One' },
    { id: 'victoria', displayName: 'Victoria', npcType: 'person', phoneId: undefined },
    { id: 'hax', displayName: 'HaX' },
];
const ring = { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 };
const person = (knot = 'confront', extra = {}) => ({ handlerIndex: knot, knot, conversationMode: 'person-chat', once: true, cooldown: 0, ...extra });

async function connect(w) {
    w.nm._handleEventMapping('caller', 'room_entered', ring, {});
    await w.advance(300);
    w.click('.incoming-call-answer');
    await w.advance(700);
    assert.equal(w.ringer.callActive(), true);
}

test('with a ringer call connected, a person-chat mapping waits in the queue and does not end the call', async () => {
    const w = makeWorld({ npcs });
    try {
        await connect(w);
        w.nm._handleEventMapping('victoria', 'x', person(), {});
        await w.advance(1500);
        assert.equal(w.calls.ended.length, 0, 'the call was not closed');
        assert.equal(w.fw.currentMinigame.params.ringerCall.direction, 'incoming');
        assert.equal(w.nm._scriptedCallQueue.length, 1);
        // the call ends by its own path: the pump opens the queued scene
        endCall(w);
        await w.advance(1500);
        assert.equal(w.nm._scriptedCallQueue.length, 0);
        assert.equal(w.fw.currentMinigame._sceneType, 'person-chat');
    } finally { w.restore(); }
});

test('a phone-chat mapping and a timed conversation also queue behind a connected ringer call', async () => {
    const w = makeWorld({ npcs });
    try {
        await connect(w);
        w.nm._handleEventMapping('hax', 'x', { handlerIndex: 'a', knot: 'k', conversationMode: 'phone-chat', once: true, cooldown: 0 }, {});
        w.nm.scheduleTimedConversation({ npcId: 'victoria', targetKnot: 'k2', delay: 0 });
        const conv = w.nm.timedConversations[0];
        conv.delivered = true;
        w.nm._deliverTimedConversation(conv);
        await w.advance(1500);
        assert.equal(w.calls.ended.length, 0);
        assert.equal(w.nm._scriptedCallQueue.length, 2);
    } finally { w.restore(); }
});

test('with no ringer call, a scripted mapping still closes what is open and opens 500 ms later', async () => {
    const w = makeWorld({ npcs });
    try {
        w.fw.currentMinigame = { _sceneType: 'lockpicking', params: {}, _ending: false };
        w.nm._handleEventMapping('victoria', 'x', person(), {});
        assert.equal(w.fw.currentMinigame, null, 'ended at once');
        await w.advance(600);
        assert.equal(w.fw.currentMinigame._sceneType, 'person-chat');
    } finally { w.restore(); }
});

test('scriptedConversationActive clears a record whose minigame has ended; _scriptedCallBusy is today\'s answer when no call is active', async () => {
    const w = makeWorld({ npcs });
    try {
        w.nm._handleEventMapping('victoria', 'x', person(), {});
        await w.advance(600);
        assert.equal(w.nm.scriptedConversationActive(), true);
        assert.equal(w.nm._scriptedCallBusy(), true);
        w.fw.endMinigame(true);
        assert.ok(w.nm._scriptedCall, 'the record is left pointing at the closed minigame');
        assert.equal(w.nm.scriptedConversationActive(), false);
        assert.equal(w.nm._scriptedCall, null, 'and cleared');
        assert.equal(w.nm._scriptedCallBusy(), false);
    } finally { w.restore(); }
});

test('a scripted scene that opened and closed before a ring does not hold the call (m01 first ring)', async () => {
    const w = makeWorld({ npcs });
    try {
        w.nm.scheduleTimedConversation({ npcId: 'victoria', targetKnot: 'briefing', delay: 0 });
        const conv = w.nm.timedConversations[0];
        conv.delivered = true;
        w.nm._deliverTimedConversation(conv);
        assert.equal(w.fw.currentMinigame._sceneType, 'person-chat');
        w.fw.endMinigame(true);                              // the player closes the briefing
        w.nm._handleEventMapping('caller', 'room_entered', ring, {});
        await w.advance(100);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'rings at once');
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.equal(w.calls.started.at(-1).type, 'phone-chat', 'an answered call opens at once');
        assert.equal(w.nm._scriptedCall, null);
    } finally { w.restore(); }
});

test('a scripted scene due while a call is ringing sends it back to the queue; it rings again afterwards', async () => {
    const w = makeWorld({ npcs });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ring, {});
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        w.nm._handleEventMapping('victoria', 'x', person(), {});
        await w.advance(700);
        assert.equal(w.fw.currentMinigame._sceneType, 'person-chat');
        assert.equal(w.ringer.stateOf('caller'), 'queued');
        assert.equal(w.banner(), null);
        w.fw.endMinigame(true);
        await w.advance(400);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
    } finally { w.restore(); }
});

test('auto-challenge: a player_in_view mapping during a connected ringer call is dropped; fired again after the call it opens', async () => {
    const w = makeWorld({ npcs });
    try {
        await connect(w);
        const challenge = { handlerIndex: 'iv', knot: 'stop', conversationMode: 'person-chat', once: false, cooldown: 0 };
        w.nm._handleEventMapping('victoria', 'player_in_view_near:victoria', challenge, {});
        await w.advance(1500);
        assert.equal(w.nm._scriptedCallQueue.length, 0, 'no queue entry');
        assert.equal(w.calls.ended.length, 0, 'no endMinigame');
        assert.equal(w.fw.currentMinigame.params.ringerCall.direction, 'incoming', 'the call carries on');
        endCall(w);
        await w.advance(200);
        w.nm._handleEventMapping('victoria', 'player_in_view_near:victoria', challenge, {});
        await w.advance(700);
        assert.equal(w.fw.currentMinigame._sceneType, 'person-chat');
    } finally { w.restore(); }
});
