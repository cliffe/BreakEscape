// The E label (ui/info-label.js) must always name what E (interactions.js tryInteractWithNearest) acts on. Both call
// interaction-reach.js pickInteractable. Before it, two things differed: E adds a 30000 penalty to a seat other than the
// player's own and skips an occupied seat, which the label did not (seated beside a chair the label read "A chair." while
// E opened the next prop); and E measures an NPC by reach distance where the label used the plain centre distance.
// Each case presses E and reads the label from the same stance, and checks both against the expected target.
// Run with: node test/js/label-e-agree.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadHarness, obj, npc, door, seatingFor, seatNpc } from './fixtures/label-e-harness.mjs';

const h = await loadHarness();
const npcIds = () => new Set(Object.values(globalThis.__testRooms).flatMap(r => (r.npcSprites || []).map(n => n.npcId)));
const TEXT = (id) => id.startsWith('door:') ? 'door ' + id.slice(5) : (npcIds().has(id) ? 'npc ' + id : 'obs ' + id);

function check(label, fx, fy, dir, expectId) {
    const e = h.pressE(fx, fy, dir);
    assert.equal(e, expectId, `${label}: E acts on ${expectId}`);
    assert.equal(h.labelAt(fx, fy, dir), TEXT(expectId), `${label}: the label names what E acts on`);
}
function reset() {
    delete window.seating; delete window.npcBehaviorManager; delete window.workstationState; delete window.npcHostileSystem;
    window.npcManager = { getNPC: (id) => ({ observations: 'npc ' + id }) };
}

test('seated beside an empty chair: E and the label both skip past the chair to the mug', () => {
    reset();
    const mine = obj('mine', 130, 150, 24, 27, { seat: true });
    const next = obj('chair2', 156, 160, 24, 27, { seat: true });
    const mug = obj('mug', 176, 150, 12, 12);   // about 27 degrees off the way the player faces the chair: nearer than the chair's 30000 penalty
    seatingFor(mine);
    h.setRooms({ r: { objects: { mine, chair2: next, mug } } });
    check('facing the chair', 150, 172, 'right', 'mug');
});

test('seated beside an empty chair with nothing else in reach: both name the chair', () => {
    reset();
    const mine = obj('mine', 130, 150, 24, 27, { seat: true });
    const next = obj('chair2', 156, 160, 24, 27, { seat: true });
    seatingFor(mine);
    h.setRooms({ r: { objects: { mine, chair2: next } } });
    check('lone chair', 150, 172, 'right', 'chair2');
});

test('seated beside a chair someone sits on: E talks to the sitter and the label names her', () => {
    reset();
    const mine = obj('mine', 130, 150, 24, 27, { seat: true });
    const c2 = obj('chair2', 156, 150, 24, 27, { seat: true });
    const sitter = npc('sitter', 190, 190);                  // her centre is well off the chair edge E and the tap see
    seatNpc(sitter, c2);
    seatingFor(mine);
    h.setRooms({ r: { objects: { mine, chair2: c2 }, npcSprites: [sitter] } });
    for (const dir of ['right', 'down-right']) check('occupied chair, facing ' + dir, 150, 172, dir, 'sitter');
});

test('standing, an NPC at the same angle as a PC: both pick by the NPC reach distance', () => {
    reset();
    seatingFor(null);
    const pc = obj('pc', 140, 80, 24, 27, { scenarioData: { id: 'pc', type: 'pc' } });
    const bob = npc('bob', 152, 70, { __reachSq: 36 });      // centre 30 up, but a body edge 6 px away
    h.setRooms({ r: { objects: { pc }, npcSprites: [bob] } });
    check('npc reach beats the pc', 152, 131, 'up', 'bob');
    bob.__reachSq = 5000;                                      // out of reach by body: the PC
    check('npc out of reach', 152, 131, 'up', 'pc');
});

test('standing at a door with an NPC at the same angle: both pick by the NPC reach distance', () => {
    reset();
    seatingFor(null);
    const bob = npc('bob', 150, 62, { __reachSq: 16 });
    h.setRooms({ r: { objects: {}, doorSprites: { d: door('d1', 150, 75) }, npcSprites: [bob] } });
    check('npc nearer by reach', 150, 120, 'up', 'bob');
    bob.__reachSq = 400;
    check('door nearer', 150, 120, 'up', 'door:d1');
});

test('the label agrees with E over every fixture stance', async () => {
    const { handScenes, randomScenes } = await import('./fixtures/label-e-scenes.mjs');
    let n = 0;
    for (const s of [...handScenes, ...randomScenes()]) {
        h.setRooms(s.build());
        for (const [fx, fy, dir] of s.stances) {
            const e = h.pressE(fx, fy, dir);
            if (e === null || e === 'stand') {                           // E acts on nothing (or stands up): the label must be hidden too
                assert.equal(h.labelAt(fx, fy, dir), null, `${s.name} @${fx},${fy} ${dir}: E acts on nothing, so the label is hidden`);
                continue;
            }
            assert.equal(h.labelAt(fx, fy, dir), TEXT(e), `${s.name} @${fx},${fy} ${dir}: E acts on ${e}`);
            n++;
        }
    }
    assert.ok(n > 150);
});
