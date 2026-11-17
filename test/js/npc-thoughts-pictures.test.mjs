// D77, review R1 M1: with "npcThoughts": false picture chat (icon-only chatter bubbles) is off too,
// because a bubble holding a need or intent icon is a thought. Spoken chatter lines still play.
// Run with: bin/test-js test/js/npc-thoughts-pictures.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, chatterPool, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const POOL = { cooler: ['Busy day?', 'Not bad, you?'] };

function rig({ thoughts, chatter = POOL }) {
    const w = makeWorld({ npcs: { ann: { pos: { x: 100, y: 300 }, rec: { id: 'ann', needsHome: { room: 'office', x: 3, y: 10 }, needs: { thirst: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } } } } }, objects: [] });
    w.world.chatterConfig = () => chatter;
    if (thoughts !== undefined) w.world.npcThoughtsOn = () => thoughts;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    return sys;
}

test('chatterPool: pictures follow the thoughts switch, lines do not', () => {
    assert.equal(chatterPool('cooler', POOL, null).pictures, true, 'default on');
    assert.equal(chatterPool('cooler', POOL, null, true).pictures, true);
    const off = chatterPool('cooler', POOL, null, false);
    assert.equal(off.pictures, false);
    assert.deepEqual(off.lines, POOL.cooler, 'spoken lines kept');
    assert.equal(chatterPool('cooler', false, null, true).pictures, false, '"chatter": false still turns pictures off');
});

test('npcThoughts false: a topic with no lines draws no picture bubble', () => {
    const pick = (sys) => sys._pickBark(sys.states.get('ann'), 'grumble');
    assert.ok(pick(rig({ thoughts: true })).picture, 'control: flag on gives a picture');
    assert.ok(pick(rig({ thoughts: undefined })).picture, 'no hook: on');
    assert.equal(pick(rig({ thoughts: false })), null, 'flag off: nothing');
});

test('npcThoughts false: an unheard turn on a voiced topic shows no picture, a heard one still speaks', () => {
    const off = rig({ thoughts: false });
    assert.equal(off._pickBark(off.states.get('ann'), 'cooler', { unheard: true }), null, 'unheard: no picture');
    const b = off._pickBark(off.states.get('ann'), 'cooler');
    assert.ok(b && POOL.cooler.includes(b.line) && b.picture === null, 'heard: a spoken line');
    const on = rig({ thoughts: true });
    assert.ok(on._pickBark(on.states.get('ann'), 'cooler', { unheard: true }).picture, 'control: flag on, unheard gives a picture');
});

// Review R2 m5: the real world hook reads gameScenario.npcThoughts (a typo there would pass the tests above)
test('createEngineWorld().npcThoughtsOn reads window.gameScenario.npcThoughts', () => {
    const had = Object.getOwnPropertyDescriptor(globalThis, 'window');
    try {
        const read = (scenario) => { globalThis.window = { gameScenario: scenario }; return createEngineWorld().npcThoughtsOn(); };
        assert.equal(read({}), true, 'absent: on');
        assert.equal(read({ npcThoughts: null }), true, 'null: on');
        assert.equal(read({ npcThoughts: true }), true);
        assert.equal(read({ npcThoughts: false }), false);
        globalThis.window = {};
        assert.equal(createEngineWorld().npcThoughtsOn(), true, 'no scenario: on');
    } finally {
        if (had) Object.defineProperty(globalThis, 'window', had); else delete globalThis.window;
    }
});

// Review R2 m1: an unheard desk-phone item with picture chat off is not "talking"
test('npcThoughts false: an unheard call item reports no talking state', () => {
    const sys = rig({ thoughts: false });
    sys._calls.set('ph', { phoneId: 'ph', speakerId: 'ann', current: { line: null, picture: null, until: 1000 }, items: [], i: 0, pictures: false });
    assert.equal(sys._talking('ann'), null, 'no line, no picture: not talking');
    sys._calls.get('ph').current = { line: null, picture: 'phone', until: 1000 };
    assert.equal(sys._talking('ann')?.picture, 'phone', 'control: the picture shows when allowed');
});

// Review R2 m2: a dropped mutter says so when picture chat is off, so a share_login visit ends at once
test('npcThoughts false: a mutter with nothing to show still emits npc_mutter with no line', () => {
    const w = makeWorld({ npcs: { ann: { pos: { x: 100, y: 300 }, rec: { id: 'ann', needsHome: { room: 'office', x: 3, y: 10 }, needs: { thirst: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } } } } }, objects: [] });
    w.world.chatterConfig = () => ({});
    w.world.npcThoughtsOn = () => false;
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const got = [];
    sys._emit = (k, d) => got.push([k, d]);
    sys._sayMutter(sys.states.get('ann'), 'login_aloud');
    const m = got.find(([k]) => k === 'npc_mutter:ann');
    assert.ok(m, 'npc_mutter emitted');
    assert.equal(m[1].line, null);
    assert.equal(m[1].picture, null);
});
