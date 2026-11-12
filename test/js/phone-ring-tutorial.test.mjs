// M8 R1 M2: an active tutorial step (or its prompt) blocks ringing like an open conversation, so the
// banner never covers SKIP TUTORIAL or the step counter. The call waits and rings once it ends.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});
const tutorial = (w, state) => { w.win.getTutorialManager = () => state; };

for (const [label, state, extra] of [
    ['an active tutorial', { active: true, promptOpen: false }, {}],
    ['the tutorial prompt', { active: false, promptOpen: true }, {}],
    ['an active tutorial and a forced call', { active: true, promptOpen: false }, { disableClose: true }],
]) {
    test(`M8 R1 M2: ${label} holds the ring until it ends`, async () => {
        const w = makeWorld({ npcs: [npc] });
        try {
            const state0 = { ...state };
            tutorial(w, state0);
            w.nm._handleEventMapping('caller', 'room_entered:main_office_area', ringConfig(extra), {});
            await w.advance(3000);
            assert.equal(w.banner(), null, 'no banner over the tutorial');
            assert.notEqual(w.ringer.stateOf('caller'), 'ringing');
            if (extra.disableClose) {
                await w.advance(30000);
                assert.equal(w.calls.started.length, 0, 'a forced call does not answer itself behind the tutorial');
            }
            state0.active = false; state0.promptOpen = false;   // ended or skipped
            await w.advance(1500);
            assert.equal(w.ringer.stateOf('caller'), 'ringing', 'rings once the tutorial is over');
            assert.ok(w.banner(), 'banner shows');
        } finally { w.restore(); }
    });
}

test('M8 R1 M2: a tutorial starting while a call rings requeues it; it rings again afterwards', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const state = { active: false, promptOpen: false };
        tutorial(w, state);
        w.nm._handleEventMapping('caller', 'room_entered:main_office_area', ringConfig(), {});
        await w.advance(500);
        assert.ok(w.banner());
        state.active = true;
        await w.advance(1500);
        assert.equal(w.banner(), null, 'banner withdrawn while the tutorial shows');
        state.active = false;
        await w.advance(1500);
        assert.ok(w.banner(), 'rings again');
    } finally { w.restore(); }
});

test('M8 R1 M2: no tutorial manager on the window, or an inactive one, does not block', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        delete w.win.getTutorialManager;
        w.nm._handleEventMapping('caller', 'room_entered:main_office_area', ringConfig(), {});
        await w.advance(500);
        assert.ok(w.banner());
    } finally { w.restore(); }
});
