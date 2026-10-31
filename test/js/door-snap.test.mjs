// N/S doors sit on tile centres, and a multi-door wall's doors pair with the
// single south door of each room above them. Run with:
//   node --test test/js/door-snap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
let src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
const stub = (spec, body) => { src = src.replace(`from '${spec}'`, `from '${dataUrl(body)}'`); };
stub('../utils/constants.js', 'export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 160, GRID_UNIT_HEIGHT_PX = 128, DOOR_INTERACTION_RANGE = 64;');
stub('./unlock-system.js', 'export const handleUnlock = () => {}, notifyServerUnlock = () => {};');
stub('./interaction-repeat.js', 'export const isRepeatInteraction = () => false;');
stub('./room-ready.js', 'export const waitForRoomReady = () => Promise.resolve();');
globalThis.window = {};
const { snapToTileCentre, calculateDoorPositionsForRoom } = await import(dataUrl(src));

test('snapToTileCentre returns the centre of the tile holding x', () => {
    assert.equal(snapToTileCentre(0, 48), 48);
    assert.equal(snapToTileCentre(0, 50), 48);
    assert.equal(snapToTileCentre(0, 33), 48);
    assert.equal(snapToTileCentre(320, 320 + 100), 320 + 112);
    assert.equal(snapToTileCentre(-160, -160 + 10), -160 + 16);
});

test('an x on a tile boundary goes to the right-hand tile', () => {
    assert.equal(snapToTileCentre(0, 160), 176);
});

// hub (10 tiles wide) with three rooms to the north, each 10 wide, side by side.
const dim = { widthPx: 320, heightPx: 288, stackingHeightPx: 224 };
const positions = { hub: { x: 0, y: 0 }, s1: { x: -320, y: -288 }, s2: { x: 0, y: -288 }, s3: { x: 320, y: -288 } };
const dims = { hub: dim, s1: dim, s2: dim, s3: dim };
const scenario = { rooms: {
    hub: { connections: { north: ['s1', 's2', 's3'] } },
    s1: { connections: { south: 'hub' } }, s2: { connections: { south: 'hub' } }, s3: { connections: { south: 'hub' } }
} };
const doorsOf = (id) => calculateDoorPositionsForRoom(id, positions[id], dims[id], scenario.rooms[id].connections, positions, dims, scenario);

test('three north doors sit mid-tile at 48 / 176 / 272', () => {
    const xs = doorsOf('hub').filter((d) => d.direction === 'north').map((d) => d.x);
    assert.deepEqual(xs, [48, 176, 272]);
    for (const x of xs) assert.equal(((x % 32) + 32) % 32, 16);
});

test('each room above the hub puts its south door on the matching hub door', () => {
    const hub = Object.fromEntries(doorsOf('hub').filter((d) => d.direction === 'north').map((d) => [d.connectedRoom, d.x]));
    for (const id of ['s1', 's2', 's3']) {
        const south = doorsOf(id).find((d) => d.direction === 'south');
        assert.equal(south.x, hub[id], `${id} south door pairs with hub north door`);
        assert.equal(((south.x - positions[id].x) % 32 + 32) % 32, 16);
    }
});
