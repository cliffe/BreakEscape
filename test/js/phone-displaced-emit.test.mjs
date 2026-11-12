// Sweep item 1: a call placed from, or answered over, the same contact's own thread must not emit
// conversation_closed twice. The call's own phone-chat emits it; dropDisplaced owes it only for a
// DIFFERENT thread (row 10: a call to Y answered over X's thread). The real phone-ringer-dom adapter
// on the shared harness.
// Copy list (shared with phone-ring-harness.mjs): npc-manager.js (npc-los.js, phone-chat-speaker.js),
// phone-ringer-dom.js (phone-ringer.js, phone-ring-config.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const closedEmits = (w) => w.dispatcher.emitted.filter(([n]) => n.startsWith('conversation_closed:')).map(([n]) => n);

test('dropDisplaced owes conversation_closed only for a thread other than the call contact', () => {
    const w = makeWorld({ npcs: [{ id: 'hax', displayName: 'HaX' }, { id: 'vance', displayName: 'Vance' }] });
    try {
        // Same contact (a call placed from hax's thread, or hax answered over hax's thread): the
        // call's own close already emitted conversation_closed:hax, so dropDisplaced must stay quiet.
        w.ringer.dropDisplaced({ kind: 'phone', thread: 'hax', callNpcId: 'hax' });
        assert.deepEqual(closedEmits(w), [], 'no second emit for the call contact');

        // Different contact (row 10, a call to vance answered over hax's thread): hax is still owed it.
        w.ringer.dropDisplaced({ kind: 'phone', thread: 'hax', callNpcId: 'vance' });
        assert.deepEqual(closedEmits(w), ['conversation_closed:hax']);

        // A legacy descriptor with no callNpcId still emits (keeps A3 R1 M1).
        w.ringer.dropDisplaced({ kind: 'phone', thread: 'vance' });
        assert.deepEqual(closedEmits(w), ['conversation_closed:hax', 'conversation_closed:vance']);

        // Not a phone descriptor, or the contact list (no thread): nothing.
        w.ringer.dropDisplaced({ kind: 'laptop' });
        w.ringer.dropDisplaced({ kind: 'phone', thread: null, callNpcId: null });
        assert.equal(closedEmits(w).length, 2, 'unchanged');
    } finally { w.restore(); }
});
