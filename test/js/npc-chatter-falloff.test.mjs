// D34: faint chatter with distance. The curve (full to 160 px, a straight line to 0.15 at 480 px, the
// floor beyond), the next room through an OPEN door at x0.4 (a closed door or a wall blocks it), and
// the volume actually reaching the TTS manager's play call, then following the player mid-line.
// Run with: bin/test-js test/js/npc-chatter-falloff.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { chatterVolume, openDoorHearing, THROUGH_DOOR } from '../../public/break_escape/js/systems/room-hearing.js';
import { NpcChatterVoice } from '../../public/break_escape/js/systems/npc-needs-chatter.js';

const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`);

test('chatterVolume: full inside earshot, a straight line down, the floor beyond far', () => {
    assert.equal(chatterVolume(0), 1);
    assert.equal(chatterVolume(160), 1);
    near(chatterVolume(320), 1 - 0.85 * 0.5, 'halfway');
    near(chatterVolume(480), 0.15, 'at far');
    assert.equal(chatterVolume(5000), 0.15, 'never below the floor, never silent');
    assert.ok(chatterVolume(200) > chatterVolume(300) && chatterVolume(300) > chatterVolume(400), 'falls with distance');
    assert.equal(chatterVolume(null), 1, 'unknown distance: full');
    near(chatterVolume(100, { near: 50, far: 150, floor: 0.2 }), 0.6, 'custom radii');
});

const rooms = (open) => ({
    office: { doorSprites: open ? [] : [{ active: true, doorProperties: { connectedRoom: 'kitchen', open: false } }] },
    kitchen: { doorSprites: open ? [] : [{ active: true, doorProperties: { connectedRoom: 'office', open: false } }] }
});
const conn = { north: 'kitchen' };

/** A voice with a recording TTS manager. `world` is mutable: { room, dist, doors } */
function rig(world) {
    const calls = [], gains = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => world.npcRoom, playerRoom: () => 'office',
        doorHearing: (nr, pr) => openDoorHearing(nr, pr, rooms(world.open), conn),
        distance: () => world.dist,
        makeTts: () => ({
            play: async (npcId, line, opts) => { calls.push({ npcId, line, opts }); return 40; },
            setDistanceGain: g => gains.push(g), stop() {}
        })
    });
    return { v, calls, gains };
}

test('the volume is passed to play, and falls with distance down to the floor', async () => {
    const world = { npcRoom: 'office', dist: 50, open: true };
    const { v, calls } = rig(world);
    for (const d of [50, 320, 900]) { world.dist = d; await v.say('amara', `line ${d}`); }
    assert.equal(calls.length, 3);
    assert.ok(calls.every(c => c.opts && typeof c.opts.volume === 'number'), 'play got a volume option');
    assert.equal(calls[0].opts.volume, 1);
    near(calls[1].opts.volume, 0.575, 'mid distance');
    assert.equal(calls[2].opts.volume, 0.15, 'floor');
    assert.deepEqual(v.log.filter(e => e.spoken).map(e => e.volume), [1, 0.57, 0.15]);
});

test('out of the room through an open door the line is heard faintly (x0.4)', async () => {
    const world = { npcRoom: 'kitchen', dist: 100, open: true };
    const { v, calls } = rig(world);
    await v.say('amara', 'Through the door.');
    assert.equal(calls.length, 1, 'voiced');
    near(calls[0].opts.volume, THROUGH_DOOR, 'full curve x 0.4');
    world.dist = 320;
    await v.say('amara', 'Further off.');
    near(calls[1].opts.volume, 0.575 * THROUGH_DOOR, 'distance and door multiply');
});

test('a closed door, a wall (a room that is not adjacent) and an unknown room are not heard', async () => {
    const world = { npcRoom: 'kitchen', dist: 100, open: false };
    const { v, calls } = rig(world);
    await v.say('amara', 'Behind a shut door.');
    world.open = true; world.npcRoom = 'vault';
    await v.say('amara', 'Behind a wall.');
    assert.equal(calls.length, 0, 'no clip played');
    assert.deepEqual(v.log.map(e => [e.spoken, e.reason]), [[false, 'other_room'], [false, 'other_room']]);
});

test('the volume follows the player while the line plays, and drops to 0 when the door shuts', async () => {
    const world = { npcRoom: 'office', dist: 50, open: true };
    const gains = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), allNpcs: () => [], muted: () => false,
        npcRoom: () => world.npcRoom, playerRoom: () => 'office',
        doorHearing: (nr, pr) => openDoorHearing(nr, pr, rooms(world.open), conn), distance: () => world.dist,
        makeTts: () => ({ play: async () => 900, setDistanceGain: g => gains.push(g), stop() {} })
    });
    const done = v.say('amara', 'A long line.');
    await new Promise(r => setTimeout(r, 300));
    world.dist = 480;
    await new Promise(r => setTimeout(r, 300));
    world.npcRoom = 'kitchen'; world.open = false;
    await done;
    assert.ok(gains.length >= 2, 'the gain was updated during the line');
    assert.equal(gains[0], 1);
    assert.ok(gains.includes(0.15), 'faded as the player walked off');
    assert.equal(gains[gains.length - 1], 0, 'silent once the door is shut');
});
