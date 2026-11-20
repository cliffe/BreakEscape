// Owner item 6 (regression): the live needs-world adapter (createEngineWorld's describe) must copy
// an object's object-level `offWhen` onto the described object, or `_isOff` is always false live and
// the slice-18a switch-off never fires. Format hardening step 8a (commit 33b3ea3bc) moved offWhen
// off the affordance to the object and changed `_isOff` to read `o.offWhen`, but describe was never
// updated to carry it, so the stub-world node tests (which supply offWhen directly) stayed green
// while the live path was dead. This test exercises the REAL adapter over a stub window.
// Run with: bin/test-js test/js/npc-needs-offwhen-adapter.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineWorld, NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';

// A stub window with one coffee machine carrying object-level offWhen, as format-8a scenarios do.
function engineWorld({ off = false } = {}) {
    const sd = {
        id: 'office_coffee', type: 'coffee', name: 'Office coffee',
        offWhen: 'office_coffee_off',
        affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10 }
    };
    const win = {
        rooms: { office: { objects: { office_coffee: { scenarioData: sd, x: 300, y: 100 } } } },
        gameState: { globalVariables: { office_coffee_off: off } },
        gameScenario: {}
    };
    const prev = globalThis.window;
    globalThis.window = win;
    try {
        const w = createEngineWorld();
        const one = w.getObject('office_coffee');
        const listed = (w.listObjects() || []).find(o => o.id === 'office_coffee');
        const sys = new NPCNeedsSystem(w, { seed: 'offwhen', manualClock: true });
        const isOff = sys._isOff(one);
        return { one, listed, isOff };
    } finally { globalThis.window = prev; }
}

test('owner item 6: the real adapter copies object-level offWhen onto the described object (getObject and listObjects)', () => {
    const { one, listed } = engineWorld();
    assert.equal(one.offWhen, 'office_coffee_off', 'getObject carries offWhen (was dropped: always undefined)');
    assert.equal(listed.offWhen, 'office_coffee_off', 'listObjects carries offWhen too');
});

test('owner item 6: through the real adapter _isOff reflects the global (false off, true on)', () => {
    assert.equal(engineWorld({ off: false }).isOff, false, 'global false: the source is on');
    assert.equal(engineWorld({ off: true }).isOff, true, 'global true: the source is off (dead before the fix)');
});
