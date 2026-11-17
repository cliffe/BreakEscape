// Item 7 follow-up: the save never carried `ring.callbackWhen` (its format is unchanged), so a callback
// restored after a reload lost its stale-clear condition and a stale "Call back" could never clear.
// npc-manager now recovers callbackWhen from the live ring config by knot on restore.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const ringMappingArray = [{
    conversationMode: 'phone-chat',
    targetKnot: 'ring_knot',
    ring: { onMissed: 'callback', callbackWhen: 'globalVars.esd_authorized !== true' },
}];
const savedCallbackSlot = { live: { knot: 'ring_knot', state: 'missed', onMissed: 'callback', callLabel: 'Ops desk' } };

test('item 7 follow-up: a restored callback recovers callbackWhen from the ring mapping (array form)', () => {
    const w = makeWorld({ npcs: [{ id: 'hax', displayName: 'HaX', eventMappings: ringMappingArray, pendingCall: structuredClone(savedCallbackSlot) }] });
    try {
        w.nm.resumePendingCalls();
        const cb = w.ringer.callbackFor('hax');
        assert.ok(cb, 'the callback is held again');
        assert.equal(cb.callbackWhen, 'globalVars.esd_authorized !== true', 'callbackWhen is recovered from the config');
    } finally { w.restore(); }
});

test('item 7 follow-up: the recovered condition is honoured (object-form eventMappings), and a stale one clears', () => {
    const mappingObj = { 'room_entered:area': { conversationMode: 'phone-chat', targetKnot: 'ring_knot', ring: { onMissed: 'callback', callbackWhen: 'globalVars.esd_authorized !== true' } } };
    const w = makeWorld({ npcs: [{ id: 'hax', displayName: 'HaX', eventMappings: mappingObj, pendingCall: structuredClone(savedCallbackSlot) }] });
    try {
        w.nm.resumePendingCalls();
        const cb = w.ringer.callbackFor('hax');
        assert.equal(cb.callbackWhen, 'globalVars.esd_authorized !== true', 'recovered from the object form too');
        // The condition is usable by the same evaluator the adapter uses to clear a stale callback.
        w.win.gameState.globalVariables.esd_authorized = true;   // the state the ring is now out of date for
        assert.equal(w.nm.callConditionHolds(cb.callbackWhen), false, 'the recovered condition now fails, so the callback is stale');
    } finally { w.restore(); }
});

test('item 7 follow-up: no ring config for the knot leaves callbackWhen unset (save behaviour unchanged)', () => {
    const w = makeWorld({ npcs: [{ id: 'hax', displayName: 'HaX', eventMappings: [], pendingCall: structuredClone(savedCallbackSlot) }] });
    try {
        w.nm.resumePendingCalls();
        const cb = w.ringer.callbackFor('hax');
        assert.ok(cb, 'the callback is still restored');
        assert.equal(cb.callbackWhen, undefined, 'no condition recovered when the config has none');
    } finally { w.restore(); }
});
