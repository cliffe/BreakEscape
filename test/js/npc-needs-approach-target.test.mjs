// Where an NPC stands to use an item (approachTarget / approachProbes and the engine world's
// approachCell): feet at the item's floor base, not a tile from its centre. Owner report: NPCs at
// the coffee machine and water cooler "stand a bit far away".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approachTarget, approachProbes, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

// A water cooler 24 x 47, drawn with its top-left at (100, 200): base y 247
const cooler = { left: 100, right: 124, top: 200, bottom: 247 };
const feetBottom = (aim) => aim.y + 5;

test('no useFrom: centred in front of the base, body bottom 2 px past the base line', () => {
    const a = approachTarget({ affordance: {} }, cooler, 0);
    assert.equal(a.side, 'south');
    assert.equal(a.x, 112);
    assert.equal(feetBottom(a), 249);   // base 247 + 2
});

test('floor item and elevation: the floor base is bottom + elevation', () => {
    const flat = approachTarget({ affordance: {} }, cooler, 0);
    const lifted = approachTarget({ affordance: {} }, cooler, 24);
    assert.equal(lifted.y - flat.y, 24);
    assert.equal(feetBottom(lifted), 247 + 24 + 2);
    // a negative elevation is no lift
    assert.equal(approachTarget({ affordance: {} }, cooler, -5).y, flat.y);
});

test('useFrom names a side, not a tile distance', () => {
    const south = approachTarget({ affordance: { useFrom: { dx: 0, dy: 1 } } }, cooler, 0);
    const far = approachTarget({ affordance: { useFrom: { dx: 0, dy: 3 } } }, cooler, 0);
    assert.deepEqual([south.x, south.y, south.side], [far.x, far.y, far.side]);
    const west = approachTarget({ affordance: { useFrom: { dx: -1, dy: 0 } } }, cooler, 0);
    assert.equal(west.side, 'west');
    assert.equal(west.x, 100 - 10 - 1);        // body right edge 1 px off the item
    assert.equal(feetBottom(west), 249);       // feet level with the base
    const east = approachTarget({ affordance: { useFrom: { dx: 1, dy: 0.5 } } }, cooler, 0);
    assert.equal(east.side, 'east');
    assert.equal(east.x, 124 + 10 + 1);
    const north = approachTarget({ affordance: { useFrom: { dx: 0, dy: -1 } } }, cooler, 0);
    assert.equal(north.side, 'north');
    assert.equal(feetBottom(north), 200 + 2);  // feet at the item's top edge
});

test('elevated item with a useFrom, or useFrom 0,0, keeps the old tile aim', () => {
    assert.equal(approachTarget({ affordance: { useFrom: { dx: 1, dy: 0.5 } } }, cooler, 24), null);
    assert.equal(approachTarget({ affordance: { useFrom: { dx: 0, dy: 0 } } }, cooler, 0), null);
});

test('no geometry gives null', () => {
    assert.equal(approachTarget({ affordance: {} }, null, 0), null);
    assert.equal(approachTarget({ affordance: {} }, { left: NaN, right: 1, top: 0, bottom: 1 }, 0), null);
    assert.equal(approachTarget(null, cooler, 0), null);
});

test('probes run nearest first, never back towards the item, within reach', () => {
    const a = approachTarget({ affordance: {} }, cooler, 0);
    const ps = approachProbes(a);
    assert.deepEqual([ps[0].x, ps[0].y], [a.x, a.y]);
    assert.ok(ps.every(p => p.y >= a.y), 'south probes never go north of the target');
    assert.ok(ps.every(p => p.d <= a.reach + 0.5));
    assert.ok(ps.every(p => Math.abs(p.x - a.x) <= 8), 'a front stand point stays in front');
    for (let i = 1; i < ps.length; i++) assert.ok(ps[i].d >= ps[i - 1].d);
    const w = approachProbes(approachTarget({ affordance: { useFrom: { dx: -1, dy: 0 } } }, cooler, 0));
    assert.ok(w.every(p => p.x <= 100 - 11), 'west probes stay on the west side');
});

// ── the engine world ─────────────────────────────────────────────────────────
// An 8 px grid (cell centres at 4 + 8k) where every cell is open except the listed boxes
function worldWith({ blocked = [], sprite, affordance, desk = false, legacy = false }) {
    const open = (x, y) => !blocked.some(b => x >= b.l && x < b.r && y >= b.t && y < b.b);
    const cell = (x, y) => ({ x: Math.floor(x / 8) * 8 + 4, y: Math.floor(y / 8) * 8 + 4 });
    const calls = [];
    const win = {
        __needsLegacyApproach: legacy,
        pathfindingManager: {
            findNearestWalkableWorldCell: (x, y, r) => {
                calls.push([x, y, r]);
                const c = cell(x, y);
                if (open(c.x, c.y)) return c;
                if (!r) return null;
                for (let rr = 1; rr <= r; rr++) for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
                    const q = { x: c.x + dx * 8, y: c.y + dy * 8 };
                    if (Math.max(Math.abs(dx), Math.abs(dy)) === rr && open(q.x, q.y)) return q;
                }
                return null;
            }
        }
    };
    const world = createEngineWorld.call(null);
    return { world, win, calls, obj: { id: 'x', roomId: 'r', x: sprite.x, y: sprite.y, affordance, desk, _sprite: sprite } };
}
function withWindow(win, fn) {
    const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const old = globalThis.window;
    globalThis.window = win;
    try { return fn(); } finally { if (had) globalThis.window = old; else delete globalThis.window; }
}
// A cooler sprite centred at (112, 223.5): 24 x 47, origin centre, collider blocks x 100..124, y 225..247 plus 8 px padding
const mkSprite = (extra = {}) => ({ x: 112, y: 223.5, displayWidth: 24, displayHeight: 47, originX: 0.5, originY: 0.5, elevation: 0, ...extra });
const colliderPad = [{ l: 92, r: 132, t: 217, b: 249 }];

test('approachCell: a cooler is used from just below its base, not from behind it', () => {
    const t = worldWith({ blocked: colliderPad, sprite: mkSprite(), affordance: {} });
    const c = withWindow(t.win, () => t.world.approachCell(t.obj));
    assert.equal(c.y, 252);                    // first open row below the padded collider (base 247)
    assert.ok(Math.abs(c.x - 112) <= 8);
    // the old aim at the centre took the nearest open cell, which was above the collider
    const old = worldWith({ blocked: colliderPad, sprite: mkSprite(), affordance: {}, legacy: true });
    const oc = withWindow(old.win, () => old.world.approachCell(old.obj));
    assert.ok(oc.y < 217 || oc.x < 92 || oc.x >= 132, `legacy cell ${oc.x},${oc.y}`);
    assert.ok(Math.abs(oc.y + 5 - 247) > Math.abs(c.y + 5 - 247));
});

test('approachCell: useFrom west puts the feet beside the item, level with its base', () => {
    const blocked = [{ l: 84, r: 132, t: 217, b: 249 }];   // 8 px padding left, right and below
    const t = worldWith({ blocked, sprite: mkSprite(), affordance: { useFrom: { dx: -1, dy: 0 } } });
    const c = withWindow(t.win, () => t.world.approachCell(t.obj));
    assert.equal(c.x, 76);
    assert.ok(Math.abs(c.y + 5 - 249) <= 8);
});

test('approachCell: a blocked ideal cell slides further from the item, never into the collider', () => {
    const blocked = [{ l: 92, r: 132, t: 217, b: 260 }];   // the floor in front is closed to y 260
    const t = worldWith({ blocked, sprite: mkSprite(), affordance: {} });
    const c = withWindow(t.win, () => t.world.approachCell(t.obj));
    assert.ok(c.y >= 260, `cell ${c.x},${c.y}`);
    const seen = t.calls.filter(([, , r]) => r === 0);
    assert.ok(seen.length > 0);
});

test('approachCell: a desk keeps the old aim (its user sits behind it)', () => {
    const t = worldWith({ blocked: colliderPad, sprite: mkSprite(), affordance: {}, desk: true });
    withWindow(t.win, () => t.world.approachCell(t.obj));
    assert.deepEqual(t.calls[0], [112, 223.5, 3]);
});

test('approachCell: no walkable cell near the new aim falls back to the old one', () => {
    // everything walkable only far above: the probes find nothing, the old search takes over
    const blocked = [{ l: -999, r: 999, t: 215, b: 999 }];
    const t = worldWith({ blocked, sprite: mkSprite(), affordance: {} });
    const c = withWindow(t.win, () => t.world.approachCell(t.obj));
    assert.ok(c && c.y < 215);
});

test('approachCell: elevated item without useFrom stands at bottom + elevation', () => {
    const sp = mkSprite({ elevation: 24 });
    const t = worldWith({ blocked: [], sprite: sp, affordance: {} });
    const c = withWindow(t.win, () => t.world.approachCell(t.obj));
    // base 247 + 24 = 271; feet bottom lands 2 past it, so the cell centre is near 268
    assert.ok(Math.abs(c.y - 268) <= 4, `cell y ${c.y}`);
});
