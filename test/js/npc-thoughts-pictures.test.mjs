// D77, review R1 M1: with "npcThoughts": false picture chat (icon-only chatter bubbles) is off too,
// because a bubble holding a need or intent icon is a thought. Spoken chatter lines still play.
// Run with: bin/test-js test/js/npc-thoughts-pictures.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, chatterPool } from '../../public/break_escape/js/systems/npc-needs.js';
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
