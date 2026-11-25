// NPC walk-in/out (docs/agents/NPC_WALK_IN_OUT_PLAN.md section 3): the in-view rule and the
// spawn search, pure helpers in systems/npc-walk.js. Its only import is constants.js, so it
// is imported straight from the repo.
import test from 'node:test';
import assert from 'node:assert/strict';

const {
    rectInView, npcRectAt, bfsOutOfView, viewGap, doorsOfRoom, doorUsable, inRoomBounds, roomAt, placeBody
} = await import('../../public/break_escape/js/systems/npc-walk.js');

const view = { x: 0, y: 0, width: 300, height: 320 };

test('in view: the sprite rectangle (feet up the frame height) against the view grown by one tile', () => {
    assert.equal(rectInView(npcRectAt(150, 150), view), true, 'centre of the view');
    // 32 px wide: x 340 gives a rect from 324, inside the 332 margin edge
    assert.equal(rectInView(npcRectAt(340, 150), view), true, 'inside the margin');
    assert.equal(rectInView(npcRectAt(350, 150), view), false, 'past the margin');
    // Feet below the view, but the head (64 px up) still overlaps the margin
    assert.equal(rectInView(npcRectAt(150, 400), view), true, 'head shows above the bottom edge');
    assert.equal(rectInView(npcRectAt(150, 420), view), false, 'all of it below');
    assert.equal(rectInView(npcRectAt(150, 150), view, 0), true);
    assert.equal(rectInView(npcRectAt(320, 150), view, 0), false, 'no margin: just off the right edge');
});

test('in view: no camera means out of view', () => {
    assert.equal(rectInView(npcRectAt(150, 150), null), false);
});

test('room bounds helpers', () => {
    const b = { worldX: 320, worldY: 0, mapWidth: 10, mapHeight: 10 };
    assert.equal(inRoomBounds(b, 400, 100), true);
    assert.equal(inRoomBounds(b, 300, 100), false);
    const rb = new Map([['hall', { worldX: 0, worldY: 0, mapWidth: 10, mapHeight: 10 }], ['dock', b]]);
    assert.equal(roomAt(rb, 100, 100), 'hall');
    assert.equal(roomAt(rb, 500, 100), 'dock');
    assert.equal(roomAt(rb, 900, 100), null);
});

function grid(cols, rows, blocked = () => false) {
    return Array.from({ length: rows }, (_, cy) => Array.from({ length: cols }, (_, cx) => (blocked(cx, cy) ? 1 : 0)));
}
const gridBounds = { minX: 0, minY: 0, cols: 80, rows: 40, step: 8 };
const dock = { worldX: 320, worldY: 0, mapWidth: 10, mapHeight: 10 };
const outOf = (v) => (x, y) => !rectInView(npcRectAt(x, y), v);

test('spawn search: the nearest out-of-view walkable cell in the far room', () => {
    const cell = bfsOutOfView({ grid: grid(80, 40), gridBounds, start: { x: 320, y: 160 }, roomBounds: dock, isOutOfView: outOf(view) });
    assert.ok(cell, 'a cell is found');
    assert.ok(inRoomBounds(dock, cell.x, cell.y), 'inside the far room');
    assert.ok(!rectInView(npcRectAt(cell.x, cell.y), view), 'out of view');
    assert.equal(cell.x, 348, 'the first column clear of the view margin');
    assert.equal(cell.y, 164, 'level with the door');
});

test('spawn search: walls are not crossed, and cells must connect to the door', () => {
    // A wall at x 344-367 the full height of the dock: the only cells beyond it are not connected
    const g = grid(80, 40, (cx) => cx >= 43 && cx <= 45);
    const cell = bfsOutOfView({ grid: g, gridBounds, start: { x: 320, y: 160 }, roomBounds: dock, isOutOfView: outOf(view) });
    assert.equal(cell, null, 'no connected out-of-view cell');
});

test('spawn search: whole far room in view gives null; no camera gives the door cell itself', () => {
    const wide = { x: 0, y: 0, width: 700, height: 400 };
    assert.equal(bfsOutOfView({ grid: grid(80, 40), gridBounds, start: { x: 320, y: 160 }, roomBounds: dock, isOutOfView: outOf(wide) }), null);
    const cell = bfsOutOfView({ grid: grid(80, 40), gridBounds, start: { x: 324, y: 160 }, roomBounds: dock, isOutOfView: outOf(null) });
    assert.deepEqual(cell, { x: 324, y: 164 });
});

test('"offscreen": seeded inside the own room, no room limit beyond it', () => {
    const hall = { worldX: 0, worldY: 0, mapWidth: 20, mapHeight: 10 };
    const v = { x: 0, y: 0, width: 200, height: 320 };
    const cell = bfsOutOfView({ grid: grid(80, 40), gridBounds, start: { x: 100, y: 160 }, roomBounds: hall, isOutOfView: outOf(v) });
    assert.ok(cell && cell.x > 232 && inRoomBounds(hall, cell.x, cell.y));
});

function door(roomId, connectedRoom, extra = {}) {
    return { doorProperties: { roomId, connectedRoom, worldX: 320, worldY: 160, locked: false, ...extra } };
}

test('doors of a room: own doors and far-side doors, one per far room', () => {
    const rooms = {
        hall: { doorSprites: [door('hall', 'dock'), door('hall', 'office')] },
        dock: { doorSprites: [door('dock', 'hall')] },
        yard: { doorSprites: [door('yard', 'hall')] }
    };
    const ds = doorsOfRoom(rooms, 'hall');
    assert.deepEqual(ds.map(d => d.far).sort(), ['dock', 'office', 'yard']);
});

test('door usable: locked plain door no, gate only when openFor names the NPC', () => {
    const plain = { sprite: door('hall', 'dock'), props: door('hall', 'dock').doorProperties };
    assert.equal(doorUsable(plain, 'guard', null), true);
    const locked = door('hall', 'dock', { locked: true });
    assert.equal(doorUsable({ sprite: locked, props: locked.doorProperties }, 'guard', null), false);
    const g = door('hall', 'dock', { locked: true, gateKey: 'k1' });
    const gates = {
        isGate: (s) => s === g,
        groups: new Map([['k1', { cfg: { openFor: ['guard'] } }]])
    };
    assert.equal(doorUsable({ sprite: g, props: g.doorProperties }, 'guard', gates), true);
    assert.equal(doorUsable({ sprite: g, props: g.doorProperties }, 'visitor', gates), false);
});

test('placeBody puts the body centre (feet) on the point', () => {
    const sprite = { x: 0, y: 0 };
    sprite.body = {
        enable: false, center: { x: 0, y: 16 },
        reset(x, y) { sprite.x = x; sprite.y = y; this.center = { x, y: y + 16 }; }
    };
    placeBody(sprite, 200, 300);
    assert.equal(sprite.body.enable, true);
    assert.deepEqual(sprite.body.center, { x: 200, y: 300 });
    assert.equal(sprite.y, 284);
});

test('viewGap: px clear of the grown view, 0 or less in view', () => {
    // 32 px wide rect at x 350: left edge 334, the grown view ends at 332
    assert.equal(viewGap(npcRectAt(350, 150), view), 2);
    assert.ok(viewGap(npcRectAt(150, 150), view) <= 0);
    assert.equal(viewGap(npcRectAt(450, 150), view), 102);
    assert.equal(viewGap(npcRectAt(150, 150), null), Infinity);
});

test('bfsOutOfView with a depth preference: the nearest cell that clear, else the deepest out of view', () => {
    const gb = { minX: 0, minY: 0, cols: 80, rows: 40, step: 8 };
    const g = grid(80, 40);
    const isOutOfView = (x, y) => !rectInView(npcRectAt(x, y), view);
    const depthOf = (x, y) => viewGap(npcRectAt(x, y), view);
    const edge = bfsOutOfView({ grid: g, gridBounds: gb, start: { x: 300, y: 160 }, isOutOfView });
    const deep = bfsOutOfView({ grid: g, gridBounds: gb, start: { x: 300, y: 160 }, isOutOfView, depthOf, preferDepth: 64 });
    assert.ok(depthOf(edge.x, edge.y) < 16, 'without a preference: on the view edge');
    assert.ok(depthOf(deep.x, deep.y) >= 64, 'with one: at least 64 px clear');
    assert.ok(depthOf(deep.x, deep.y) < 72, 'and no further than it needs');
    // A room only 40 px past the view: no cell 64 px clear, so the deepest one (never null)
    const room = { worldX: 0, worldY: 0, mapWidth: 12, mapHeight: 10 };   // to x 384
    const capped = bfsOutOfView({ grid: g, gridBounds: gb, start: { x: 300, y: 160 }, roomBounds: room, isOutOfView, depthOf, preferDepth: 64 });
    assert.ok(capped, 'still a cell');
    assert.ok(capped.x >= 370, `the deepest cell in the room (${capped.x})`);
});
