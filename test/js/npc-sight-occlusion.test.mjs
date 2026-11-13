// Walls, closed doors and tall props block NPC sight (npc-sight-occlusion.js),
// and npc-los.js isInLineOfSight asks it before saying an NPC sees the player.
// Run with: node --test test/js/npc-sight-occlusion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.Phaser = {
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
        RadToDeg: (r) => r * 180 / Math.PI,
        DegToRad: (d) => d * Math.PI / 180
    },
    Geom: { Point: class { constructor(x, y) { this.x = x; this.y = y; } } }
};
globalThis.window = {};

const occ = await import(dataUrl(readFileSync(join(sys, 'npc-sight-occlusion.js'), 'utf8')));
const los = await import(dataUrl(readFileSync(join(sys, 'npc-los.js'), 'utf8')));
const {
    createGrid, markRect, segmentClear, rayDistance, propBlocksSight, propFootprint,
    buildRoomSightGrid, SightOcclusion, SIGHT_CELL
} = occ;

// A 10x6-tile room at (0,0): wall ring (rows 0-1 north, row 5 south, cols 0 and 9).
function wallLayer(cols = 10, rows = 6, holes = []) {
    const data = [];
    for (let y = 0; y < rows; y++) {
        data.push([]);
        for (let x = 0; x < cols; x++) {
            const wall = y < 2 || y === rows - 1 || x === 0 || x === cols - 1;
            const hole = holes.some(([hx, hy]) => hx === x && hy === y);
            data[y].push({ index: wall && !hole ? 1 : -1 });
        }
    }
    return { layer: { data } };
}
const sprite = (key, x, y, w, h, extra = {}) => ({
    texture: { key }, x, y, width: w, height: h, displayWidth: w, displayHeight: h,
    originX: 0, originY: 0, active: true, ...extra
});
function makeRoom({ x = 0, y = 0, cols = 10, rows = 6, objects = {}, doors = [], holes = [], collisionBodies = [] } = {}) {
    return {
        position: { x, y },
        map: { width: cols, height: rows, tileWidth: 32, tileHeight: 32 },
        wallsLayers: [wallLayer(cols, rows, holes)],
        objects, doorSprites: doors, collisionBodies
    };
}

test('grid walk: an open floor is clear, a marked rect blocks', () => {
    const g = createGrid(0, 0, 320, 192);
    assert.equal(segmentClear([g], 40, 100, 280, 100), true);
    markRect(g, { x: 150, y: 80, w: 20, h: 40 });
    assert.equal(segmentClear([g], 40, 100, 280, 100), false);
    assert.equal(segmentClear([g], 40, 150, 280, 150), true, 'passes below the prop');
    assert.equal(segmentClear([g], 40, 60, 280, 140), false, 'diagonal through it');
});

test('cells holding the two end points are ignored', () => {
    const g = createGrid(0, 0, 320, 192);
    markRect(g, { x: 96, y: 96, w: 8, h: 8 });        // exactly one cell
    assert.equal(segmentClear([g], 100, 100, 200, 100), true, 'start inside the cell');
    assert.equal(segmentClear([g], 20, 100, 100, 100), true, 'end inside the cell');
    assert.equal(segmentClear([g], 20, 100, 200, 100), false, 'passes through it');
});

test('someone standing inside a prop footprint is not hidden by it', () => {
    const g = createGrid(0, 0, 320, 192);
    markRect(g, { x: 96, y: 96, w: 48, h: 16 });     // a vending machine's strip
    assert.equal(segmentClear([g], 100, 104, 100, 180), true, 'guard inside the strip looks south');
    assert.equal(segmentClear([g], 100, 180, 100, 104), true, 'and is seen from the south');
    assert.equal(segmentClear([g], 100, 60, 100, 180), false, 'a line across it is still blocked');
    markRect(g, { x: 96, y: 150, w: 48, h: 8 });     // a second prop beyond a gap
    assert.equal(segmentClear([g], 100, 104, 100, 180), false, 'the next prop still blocks');
});

test('markRect marks only cells whose centre is inside', () => {
    const g = createGrid(0, 0, 64, 64);
    assert.equal(markRect(g, { x: 0, y: 0, w: 3, h: 3 }), 0, 'a sliver marks nothing');
    assert.equal(markRect(g, { x: 0, y: 0, w: 16, h: 8 }), 2);
});

test('rayDistance stops at the first blocked cell', () => {
    const g = createGrid(0, 0, 320, 192);
    markRect(g, { x: 160, y: 80, w: 16, h: 40 });
    const d = rayDistance([g], 40, 100, 0, 200);
    assert.ok(Math.abs(d - 120) <= SIGHT_CELL, `got ${d}`);
    assert.equal(rayDistance([g], 40, 150, 0, 200), 200, 'nothing in the way');
});

test('walls of a room block; a doorway gap does not', () => {
    const room = makeRoom({ holes: [[9, 3]] });
    const g = buildRoomSightGrid(room);
    // From inside, straight east through the east wall at row 2 (y 64-96): blocked
    assert.equal(segmentClear([g], 100, 80, 360, 80), false);
    // Through the gap at row 3 (y 96-128)
    assert.equal(segmentClear([g], 100, 112, 360, 112), true);
});

test('the south wall row is floor except its bottom edge (3/4 view)', () => {
    const g = buildRoomSightGrid(makeRoom());
    // Row 5 is y 160-192: feet can stand at y 176, only y 184-192 blocks
    assert.equal(segmentClear([g], 60, 176, 260, 176), true);
    assert.equal(segmentClear([g], 60, 188, 260, 188), false);
    assert.equal(segmentClear([g], 100, 176, 100, 230), false, 'out through the south edge');
});

test('a closed door blocks until its body is disabled', () => {
    const door = sprite('door_side', 288, 96, 32, 32, { body: { enable: true, x: 288, y: 96, width: 32, height: 32 } });
    const room = makeRoom({ holes: [[9, 3]], doors: [door] });
    assert.equal(segmentClear([buildRoomSightGrid(room)], 100, 112, 360, 112), false);
    door.body.enable = false;
    assert.equal(segmentClear([buildRoomSightGrid(room)], 100, 112, 360, 112), true);
});

test('which props block sight', () => {
    assert.equal(propBlocksSight(sprite('batrack', 0, 0, 32, 72)), true);
    assert.equal(propBlocksSight(sprite('server_rack2', 0, 0, 30, 55)), true);
    assert.equal(propBlocksSight(sprite('filing_cabinet_steel1', 0, 0, 29, 61)), true);
    assert.equal(propBlocksSight(sprite('drinks_vending1', 0, 0, 42, 61)), true);
    assert.equal(propBlocksSight(sprite('aes_ppe_rack1', 0, 0, 26, 25)), false, 'short rack');
    assert.equal(propBlocksSight(sprite('key_cabinet1', 0, 0, 20, 24)), false, 'wall box');
    assert.equal(propBlocksSight(sprite('desk1', 0, 0, 78, 39)), false);
    assert.equal(propBlocksSight(sprite('desk1', 0, 0, 78, 39, { blocksSight: true })), true, 'opt in');
    assert.equal(propBlocksSight(sprite('batrack', 0, 0, 32, 72, { blocksSight: false })), false, 'opt out');
    assert.equal(propBlocksSight(sprite('batrack', 0, 0, 32, 72, { elevation: 4 })), false, 'on the back wall');
    assert.equal(propBlocksSight(sprite('batrack', 0, 0, 32, 72, { active: false })), false, 'gone');
});

test('a prop footprint runs from its collision top to the sprite bottom, full width', () => {
    const rack = sprite('batrack', 100, 94, 32, 72);     // bottom at 166
    assert.deepEqual(propFootprint(rack, [{ x: 110, y: 150, w: 188, h: 88 }]), { x: 100, y: 150, w: 32, h: 16 });
    const fp = propFootprint(rack, []);
    assert.equal(fp.y + fp.h, 166);
    assert.equal(fp.h, 18, 'no collision: bottom quarter');
});

test('a rack between guard and player hides the player; on the same side he is seen', () => {
    // Rack footprint x 140-172, y 120-160
    const rack = sprite('batrack', 140, 88, 32, 72);
    const room = makeRoom({ rows: 8, objects: { r: rack }, collisionBodies: [{ x: 156, y: 140, width: 32, height: 40 }] });
    window.rooms = { hall: room };
    const o = new SightOcclusion();
    assert.equal(o.isClearBetween({ x: 100, y: 140 }, { x: 220, y: 140 }), false, 'across the rack');
    assert.equal(o.isClearBetween({ x: 100, y: 140 }, { x: 130, y: 100 }), true, 'same side');
    assert.equal(o.isClearBetween({ x: 100, y: 170 }, { x: 220, y: 170 }), true, 'in front of it');
});

test('the cache rebuilds when a prop moves (pushable) and not otherwise', () => {
    const rack = sprite('batrack', 140, 88, 32, 72);
    window.rooms = { hall: makeRoom({ objects: { r: rack } }) };
    const o = new SightOcclusion();
    let t = 1000;
    o.gridFor('hall', t);
    o.gridFor('hall', t += 300);
    assert.equal(o.builds, 1, 'unchanged room: one build');
    const before = o.gridFor('hall', t);
    rack.y += 64;   // pushed south out of the line
    const after = o.gridFor('hall', t += 300);
    assert.equal(o.builds, 2);
    assert.notEqual(before, after);
});

test('a ray fan is clipped by the room walls', () => {
    window.rooms = { r: makeRoom() };
    const o = new SightOcclusion();
    const [north, east] = o.clipFan({ x: 160, y: 120 }, [-Math.PI / 2, 0], 300);
    assert.ok(north <= 120 - 64 + SIGHT_CELL && north >= 120 - 64 - SIGHT_CELL, `north ${north}`);
    assert.ok(east <= 288 - 160 + SIGHT_CELL, `east ${east}`);
});

test('isInLineOfSight: a wall between NPC and player hides the player', () => {
    window.npcSightOcclusion = new SightOcclusion();
    // Two rooms side by side, no door: guard in A faces east at the player in B
    window.rooms = { a: makeRoom({ x: 0 }), b: makeRoom({ x: 320 }) };
    window.player = null;
    const guard = { id: 'g', x: 250, y: 120, facingDirection: 0 };
    const cfg = { enabled: true, range: 300, angle: 90 };
    assert.equal(los.isInLineOfSight(guard, { x: 380, y: 120 }, cfg), false, 'through the wall');
    assert.equal(los.isInLineOfSight(guard, { x: 200, y: 120 }, { ...cfg, angle: 360 }), true, 'same room');
    assert.equal(los.isInLineOfSight(guard, { x: 380, y: 120 }, { ...cfg, occlusion: false }), true, 'occlusion off');
    delete window.npcSightOcclusion;
    assert.equal(los.isInLineOfSight(guard, { x: 380, y: 120 }, cfg), true, 'no occlusion module: range and angle only');
});

test('a bare target point is moved to the player\'s feet', () => {
    window.player = {
        getCenter: () => ({ x: 100, y: 100 }),
        body: { center: { x: 100, y: 131 } }
    };
    assert.deepEqual(occ.targetGroundPoint({ x: 50, y: 60 }), { x: 50, y: 91 });
    assert.deepEqual(occ.npcGroundPoint({ _sprite: { body: { center: { x: 5, y: 6 } } } }), { x: 5, y: 6 });
    window.player = null;
});

test('drawLOSCone clips its rays with the occlusion module', () => {
    window.rooms = { r: makeRoom() };
    window.npcSightOcclusion = new SightOcclusion();
    const fills = [];
    const g = {
        lineStyle() {}, strokeCircle() { throw new Error('should draw a clipped outline'); },
        strokePoints() {}, fillStyle() {}, fillPoints(p) { fills.push(p); },
        lineBetween() {}, setDepth() { return this; }, setAlpha() { return this; }
    };
    const scene = { add: { graphics: () => g } };
    const npc = { id: 'n', x: 160, y: 120, facingDirection: 270, _sprite: { body: { center: { x: 160, y: 120 } }, getCenter: () => ({ x: 160, y: 120 }) } };
    los.drawLOSCone(scene, npc, { enabled: true, range: 300, angle: 60 });
    const ys = fills.flat().map(p => p.y);
    assert.ok(Math.min(...ys) >= 64 - SIGHT_CELL, `cone stops at the north wall (min y ${Math.min(...ys)})`);
    delete window.npcSightOcclusion;
});
