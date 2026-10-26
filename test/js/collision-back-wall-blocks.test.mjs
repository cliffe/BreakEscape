// createWallCollisionBoxes fills each wall column of the back-wall strip (the
// top two rows) with a solid block, so a north neighbour's floor can't be walked
// onto the strip, and leaves doorway columns (no wall tile there) open.
// Run with: node --test test/js/collision-back-wall-blocks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
let src = readFileSync(join(js, 'systems/collision.js'), 'utf8');
src = src.replace("from '../utils/constants.js'", `from '${dataUrl('export const TILE_SIZE = 32;')}'`)
    .replace("from './doors.js'", `from '${dataUrl('export const getOppositeDirection = () => null; export const calculateDoorPositionsForRoom = () => [];')}'`);
globalThis.window = {}; // collision.js publishes its functions on window at load
const { createWallCollisionBoxes } = await import(dataUrl(src));

const WIDTH = 10, HEIGHT = 10;
// Wall tiles on row 1 of cols 1..8 except col 4 (the doorway), and the south wall.
const walls = new Set();
for (let c = 1; c <= 8; c++) if (c !== 4) walls.add(`${c},1`);
for (let c = 0; c < WIDTH; c++) walls.add(`${c},${HEIGHT - 1}`);

const made = [];
const game = {
    add: {
        rectangle: (x, y, w, h) => {
            const r = { x, y, width: w, height: h, setVisible() {}, body: null };
            made.push(r);
            return r;
        }
    },
    physics: { add: { existing: (o) => { o.body = { immovable: false }; }, collider: () => {} } },
    time: { delayedCall: (_ms, fn) => fn() }
};
const wallLayer = {
    getTilesWithin: () => [...walls].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y, index: 1 }; }),
    getTileAt: (x, y) => (walls.has(`${x},${y}`) ? { x, y, index: 1 } : null)
};
globalThis.window = {
    game,
    rooms: { r: { map: { widthInPixels: WIDTH * 32, heightInPixels: HEIGHT * 32, width: WIDTH, height: HEIGHT } } }
};

test('every wall column and both corners get a strip-high block, the doorway does not', () => {
    createWallCollisionBoxes(wallLayer, 'r', { x: 320, y: -64 });
    const blocks = made.filter((r) => r.height === 64);
    const cols = blocks.map((b) => (b.x - 320 - 16) / 32).sort((a, b) => a - b);
    assert.deepEqual(cols, [0, 1, 2, 3, 5, 6, 7, 8, 9]);
    for (const b of blocks) {
        assert.equal(b.width, 32);
        assert.equal(b.y, -64 + 32, 'centred on the 2-row strip');
        assert.equal(b.isBackWallBlock, true);
        assert.ok(b.body, 'is a physics body');
    }
});

test('blocks are registered with the room so the pathfinding grid and sight lines see them', () => {
    const room = window.rooms.r;
    assert.equal(room.wallCollisionBoxes.filter((b) => b.isBackWallBlock).length, 9);
});
