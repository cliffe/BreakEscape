// Same-room rule: the strip behind a south room's back wall belongs to the north room.
// Run with: node --test test/js/interaction-room-rule.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { roomIdAtFeet, roomIdOfTarget, sameRoomFrom, wallClearFrom } from '../../public/break_escape/js/systems/interaction-walls.js';

// north: y 0..320 ; south starts 64px above north's bottom edge (its wall rows overlap north's floor)
const rooms = {
    north: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 320 } },
    south: { position: { x: 0, y: 256 }, map: { widthInPixels: 320, heightInPixels: 288 } }
};
const panel = { x: 100, y: 270, roomId: 'south', displayWidth: 32, displayHeight: 32, originX: 0, originY: 0, scenarioData: {} };
const noWalls = { isWallClearBetween: () => true };

test('feet behind the south back wall are in the north room; on its floor, the south', () => {
    assert.equal(roomIdAtFeet(110, 285, rooms), 'north'); // feet y 290 < 256+64
    assert.equal(roomIdAtFeet(110, 330, rooms), 'south');
});

test('a south-room object is refused from the strip, allowed from its floor', () => {
    globalThis.window = { rooms };
    assert.equal(wallClearFrom({ x: 110, y: 285 }, panel, { occ: noWalls }), false);
    assert.equal(wallClearFrom({ x: 110, y: 330 }, panel, { occ: noWalls }), true);
    delete globalThis.window;
});

test('doors are exempt; targets with no room, or feet in no room, are not blocked', () => {
    globalThis.window = { rooms };
    assert.equal(sameRoomFrom({ x: 110, y: 285 }, { doorProperties: {}, x: 1, y: 1 }, rooms), true);
    assert.equal(sameRoomFrom({ x: 110, y: 285 }, { x: 1, y: 1 }, rooms), true);
    assert.equal(sameRoomFrom({ x: 9999, y: 9999 }, panel, rooms), true);
    delete globalThis.window;
});

test('an NPC belongs to the room it stands in, a wall fixture to its own room', () => {
    const npc = { _isNPC: true, roomId: 'north', body: { center: { x: 50, y: 330 } } };
    assert.equal(roomIdOfTarget(npc, rooms), 'south');
    assert.equal(roomIdOfTarget(panel, rooms), 'south');
});
