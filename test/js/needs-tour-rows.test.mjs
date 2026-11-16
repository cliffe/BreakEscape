// Tour row 3 (tools/playtest/needs-tour-rows.mjs): the recorded event names carry the NPC id after a
// colon, as the emit hook sees them. The first version compared the whole name to 'npc_turned_back',
// so a genuine switch-off turn-back (16 Nov tour, game 6036) read as none and row 3 failed.
//
// Run with: node test/js/needs-tour-rows.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { turnedBackOff, parksAfterOff } from '../../tools/playtest/needs-tour-rows.mjs';

const afterOff = [
    { c: 109500, ev: 'npc_turned_back:marek', npcId: 'marek', reason: 'off' },
    { c: 109500, ev: 'npc_need_parked:marek', npcId: 'marek', reason: 'no_source' },
    { c: 109500, ev: 'npc_turned_back:tom', npcId: 'tom', reason: 'off' },
    { c: 109500, ev: 'npc_turned_back:tom', npcId: 'tom', reason: 'off' },
    { c: 110000, ev: 'npc_turned_back:sanjay', npcId: 'sanjay', reason: 'blocked' },
    { c: 111750, ev: 'npc_sat', npcId: 'marek' },
];

test('turn-backs with reason off are listed once each, by suffixed name', () => {
    assert.deepEqual(turnedBackOff(afterOff), ['marek', 'tom']);
});

test('a park is listed apart and never counted as a turn-back', () => {
    assert.deepEqual(parksAfterOff(afterOff), [{ npc: 'marek', reason: 'no_source', at: 110 }]);
    assert.deepEqual(turnedBackOff([{ ev: 'npc_need_parked:tom', npcId: 'tom', reason: 'off' }]), []);
});

test('an unsuffixed name still matches', () => {
    assert.deepEqual(turnedBackOff([{ ev: 'npc_turned_back', npcId: 'amara', reason: 'off' }]), ['amara']);
});
