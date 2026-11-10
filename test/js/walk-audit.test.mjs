// Walk audit (SEAT_BOX_PLAN.md slice 0): the diff checks (a)-(h) against fixture records, and the
// in-page walk record on a fake world (NPCs and swivel chairs left out).
// Run with: node test/js/walk-audit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { diffRoom, diffRecords, gapBetween, flood, gridOf } from '../../tools/playtest/walk-audit-diff.mjs';

const W = 20, H = 12, STEP = 8;
// A room grid record from a cell predicate (true = blocked)
function grid(blocked = () => false) {
  const rows = [];
  for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) r += blocked(x, y) ? '1' : '0'; rows.push(r); }
  return { cx0: 0, cy0: 0, minX: 0, minY: 0, step: STEP, rows };
}
const door = { id: 'door:r->hall', kind: 'door', x: 4, y: 44 };
function room({ g = grid(), bodies = [], keys = [], swivels = [], mapProps = null } = {}) {
  return { rect: [0, 0, W * STEP, H * STEP], mapProps, grid: g, bodies, keys: [door, ...keys], swivels };
}
const checks = r => r.fails.map(f => f.check).sort();

test('identical records: nothing fails or is listed', () => {
  const r = room({ keys: [{ id: 'npc:a', kind: 'npc', x: 100, y: 50 }] });
  const d = diffRoom('r', r, structuredClone(r));
  assert.deepEqual(d.fails, []);
  assert.deepEqual(d.lists, []);
  assert.equal(d.info.blocked, 0);
});

test('(a) a key point that loses its path from the doors fails, and (e) counts the cells', () => {
  const key = { id: 'npc:a', kind: 'npc', x: 140, y: 50 };
  const before = room({ keys: [key] });
  const after = room({ g: grid((x) => x === 12), keys: [key] }); // a wall across the room
  const d = diffRoom('r', before, after);
  assert.ok(d.fails.some(f => f.check === 'a' && f.id === 'npc:a'), JSON.stringify(d.fails));
  assert.equal(d.info.blocked, H);
});

test('(b) an interactable whose nearest walkable cell moves past 32 px fails', () => {
  const k = (dist) => ({ id: 'obj:pc', kind: 'interactable', x: 60, y: 30, cell: [60, 30], dist });
  const d = diffRoom('r', room({ keys: [k(12)] }), room({ keys: [k(40)] }));
  assert.deepEqual(checks(d), ['b']);
  assert.equal(diffRoom('r', room({ keys: [k(12)] }), room({ keys: [k(30)] })).fails.length, 0);
});

test('(c) a waypoint now inside a body fails; one already inside is listed', () => {
  const wp = { id: 'wp:guard:0', kind: 'waypoint', x: 70, y: 52 };
  const desk = (h) => ({ id: 'desk_1', kind: 'static', desk: true, key: 'desk1', rect: [50, 56 - h, 110, 56] });
  const d = diffRoom('r', room({ keys: [wp], bodies: [desk(2)] }), room({ keys: [wp], bodies: [desk(16)] }));
  assert.ok(d.fails.some(f => f.check === 'c' && f.id === 'wp:guard:0'));
  const d2 = diffRoom('r', room({ keys: [wp], bodies: [desk(16)] }), room({ keys: [wp], bodies: [desk(16)] }));
  assert.equal(d2.fails.length, 0);
  assert.ok(d2.lists.some(l => l.check === 'c'));
});

test('(d) a swivel chair sunk in a desk body at load fails when new, is listed when old', () => {
  const sw = { id: 'r_chair-grey-1_7', texture: 'chair-grey-1', rect: [60, 52, 78, 60] };
  const desk = (h) => ({ id: 'desk_1', kind: 'static', desk: true, key: 'desk1', rect: [50, 56 - h, 110, 56 - 0] });
  const legacy = { id: 'desk_1', kind: 'static', desk: true, key: 'desk1', rect: [60, 44, 100, 50] }; // bottom quarter, clear
  const d = diffRoom('r', room({ bodies: [legacy], swivels: [sw] }), room({ bodies: [desk(16)], swivels: [sw] }));
  assert.ok(d.fails.some(f => f.check === 'd' && f.id === sw.id), JSON.stringify(d.fails));
  const d2 = diffRoom('r', room({ bodies: [desk(16)], swivels: [sw] }), room({ bodies: [desk(16)], swivels: [sw] }));
  assert.ok(!d2.fails.some(f => f.check === 'd'));
  assert.ok(d2.lists.some(l => l.check === 'd'));
});

test('(g) a pocket with no key point: 4 cells or more fails, smaller ones are listed', () => {
  // Ring round a 2x2 block of cells (x 4-5, y 4-5) and round a single cell (x 14, y 4)
  const ring = (x, y) => ((x === 3 || x === 6) && y >= 3 && y <= 6) || ((y === 3 || y === 6) && x >= 3 && x <= 6)
    || ((x === 13 || x === 15) && y >= 3 && y <= 5) || ((y === 3 || y === 5) && x >= 13 && x <= 15);
  const d = diffRoom('r', room(), room({ g: grid(ring) }));
  const g = d.fails.filter(f => f.check === 'g');
  assert.equal(g.length, 1, JSON.stringify(d.fails));
  assert.match(g[0].msg, /pocket of 4 cells/);
  assert.ok(d.lists.some(l => l.check === 'g' && /pocket of 1 cells/.test(l.msg)));
  assert.ok(!d.fails.some(f => f.check === 'a'), 'no key point is involved');
});

test('(h) geometry on an opted-in map: 20 -> 14 px side gap and 12 -> 6 px corridor fail, 22 -> 19 is listed', () => {
  const b = (id, rect, kind = 'static') => ({ id, kind, desk: kind === 'static', key: 'desk1', rect });
  const before = room({ bodies: [b('d1', [20, 40, 60, 50]), b('d2', [80, 40, 120, 50]), // side gap 20
    b('d3', [20, 70, 60, 76]), b('d4', [20, 88, 60, 94]),                                // corridor 12
    b('d5', [130, 10, 140, 20]), b('d6', [162, 10, 172, 20])] });                         // side gap 22
  const after = room({ mapProps: 'footprint', bodies: [b('d1', [20, 40, 63, 50]), b('d2', [77, 40, 120, 50]),
    b('d3', [20, 70, 60, 79]), b('d4', [20, 85, 60, 94]),
    b('d5', [130, 10, 141, 20]), b('d6', [160, 10, 172, 20])] });
  const d = diffRoom('r', before, after);
  const h = d.fails.filter(f => f.check === 'h').map(f => f.id).sort();
  assert.deepEqual(h, ['d1|d2', 'd3|d4']);
  assert.ok(d.lists.some(l => l.check === 'h' && l.id === 'd5|d6'), JSON.stringify(d.lists));
  // A legacy map is not checked (no opt-in), unless asked
  const legacy = { ...after, mapProps: null };
  assert.equal(diffRoom('r', before, legacy).fails.filter(f => f.check === 'h').length, 0);
  assert.equal(diffRoom('r', before, legacy, { allGeometry: true }).fails.filter(f => f.check === 'h').length, 2);
});

test('(h) walls pair across records by room and rectangle', () => {
  const wall = { id: 'wall:r:0,0,10,96', kind: 'wall', desk: false, key: null, rect: [0, 0, 10, 96] };
  const desk = (x0) => ({ id: 'desk_9', kind: 'static', desk: true, key: 'desk1', rect: [x0, 40, 70, 56] });
  const d = diffRoom('r', room({ bodies: [wall, desk(30)] }), room({ mapProps: 'footprint', bodies: [wall, desk(24)] }));
  assert.deepEqual(d.fails.filter(f => f.check === 'h').map(f => f.id), ['wall:r:0,0,10,96|desk_9']);
});

test('(f) a seated-only corridor (8-10 px high) bordering a pocket fails', () => {
  // Desks d3/d4 one above the other: corridor 14 px before, 9 px after (passable seated only).
  // The after grid closes a pocket round the strip between them (cells x 5-12, y 7-8).
  const b = (id, rect) => ({ id, kind: 'static', desk: true, key: 'desk1', rect });
  const ring = (x, y) => ((y === 6 || y === 9) && x >= 4 && x <= 13) || ((x === 4 || x === 13) && y >= 6 && y <= 9);
  const before = room({ bodies: [b('d3', [40, 40, 100, 56]), b('d4', [40, 70, 100, 80])] });
  const after = room({ mapProps: 'footprint', g: grid(ring), bodies: [b('d3', [40, 40, 100, 56]), b('d4', [40, 65, 100, 80])] });
  const d = diffRoom('r', before, after);
  assert.ok(d.fails.some(f => f.check === 'f' && f.id === 'd3|d4'), JSON.stringify(d.fails));
  assert.ok(d.fails.some(f => f.check === 'h' && f.id === 'd3|d4'), 'the 14 -> 9 corridor also fails (h)');
  assert.ok(d.fails.some(f => f.check === 'g'));
});

test('diffRecords: allow keys, open gates and missing rooms', () => {
  const key = { id: 'npc:a', kind: 'npc', x: 140, y: 50 };
  const before = { scenarios: { s: { gates: [], rooms: { r: room({ keys: [key] }), q: room() } } } };
  const after = { scenarios: { s: { gates: [{ key: 'g1', open: true }], rooms: { r: room({ g: grid(x => x === 12), keys: [key] }) } } } };
  const res = diffRecords(before, after, { allow: ['a:r:npc:a'] });
  assert.ok(res.allowed.some(f => f.key === 'a:r:npc:a'));
  assert.ok(!res.fails.some(f => f.key === 'a:r:npc:a'));
  assert.ok(res.coverage.some(c => /gate g1 open/.test(c)));
  assert.ok(res.coverage.some(c => /s\/q: room missing/.test(c)));
});

test('gapBetween and flood basics', () => {
  assert.deepEqual(gapBetween([0, 0, 10, 10], [30, 5, 40, 20]), { kind: 'side', gap: 20 });
  assert.deepEqual(gapBetween([0, 0, 10, 10], [5, 22, 40, 30]), { kind: 'corridor', gap: 12 });
  assert.equal(gapBetween([0, 0, 10, 10], [20, 20, 30, 30]), null);
  // no corner cutting: a diagonal between two blocked orthogonals is not taken
  const g = gridOf({ cx0: 0, cy0: 0, minX: 0, minY: 0, step: 8, rows: ['01', '10'] });
  assert.equal(flood(g, [[0, 0]]).size, 1);
});

// ---- the in-page record, on a fake world ----
globalThis.window = globalThis.window || {};
const { installEasyStar } = await import('./fixtures/world-grid-fixture.mjs');
installEasyStar();
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
const { collectWalkRecord } = await import('../../tools/playtest/lib/walk-record.mjs');

test('the walk record leaves out a seated NPC and its swivel chair, and keeps the desk', () => {
  const body = (go, l, t, w, h, extra) => Object.assign({ gameObject: go, left: l, top: t, right: l + w, bottom: t + h, enable: true,
    immovable: false, physicsType: 0, offset: { x: 0, y: 0 }, width: w, height: h }, extra);
  const sprite = (props) => ({ x: 0, y: 0, displayOriginX: 0, displayOriginY: 0, scaleX: 1, scaleY: 1, originX: 0, originY: 0, displayWidth: 32, displayHeight: 32, ...props });
  const desk = sprite({ objectId: 'r_desk1_1', texture: { key: 'desk1' }, x: 64, y: 84 });
  desk.body = body(desk, 64, 100, 64, 16, { physicsType: 1, immovable: true });
  const chair = sprite({ objectId: 'r_chair-grey-1_2', isSwivelChair: true, texture: { key: 'chair-grey-1' }, x: 160, y: 120 });
  chair.body = body(chair, 171, 151, 18, 8, { immovable: true, offset: { x: 11, y: 31 } });   // immovable while sat
  const npc = sprite({ npcId: 'tomasz', roomId: 'r', texture: { key: 'tomasz' }, x: 165, y: 130 });
  npc.body = body(npc, 171, 141, 18, 10, { immovable: true, offset: { x: 6, y: 11 } });
  const player = sprite({ texture: { key: 'hacker' }, x: 30, y: 200 });
  player.body = body(player, 30, 200, 18, 10, { offset: { x: 0, y: 0 } });
  const wall = body(null, 0, 0, 320, 32, { immovable: true });
  const statics = [desk.body], dyn = [chair.body, npc.body, player.body, wall];
  const scene = { time: { delayedCall() {} }, children: { list: [desk, chair, npc, player] },
    physics: { world: { bounds: { x: 0, y: 0, width: 320, height: 256 },
      staticBodies: { iterate: f => statics.forEach(f) }, bodies: { iterate: f => dyn.forEach(f) } } } };
  const pm = new NPCPathfindingManager(scene);
  const env = { pathfindingManager: pm, player, gameScenario: { startRoom: 'r' },
    rooms: { r: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 256 }, objects: { d: desk, c: chair }, npcSprites: { tomasz: npc } } },
    npcManager: { npcs: new Map([['tomasz', { _sprite: npc }]]) },
    __swivelHomes: { r_chair_home: { roomId: 'r', texture: 'chair-grey-1', x: 160, y: 120, rect: [171, 151, 189, 159] } } };
  const rec = collectWalkRecord(env);
  const r = rec.rooms.r;
  const ids = r.bodies.map(b => b.id);
  assert.ok(ids.includes('r_desk1_1'), 'the desk is recorded');
  assert.ok(r.bodies.find(b => b.id === 'r_desk1_1').desk, 'and flagged as a desk');
  assert.ok(!ids.includes('r_chair-grey-1_2'), 'the swivel chair is left out');
  assert.ok(!r.bodies.some(b => b.key === 'tomasz'), 'the NPC body is left out');
  assert.ok(ids.some(id => id.startsWith('wall:r:0,0,320,32')), 'the wall is keyed by room and rectangle');
  // Grid: the chair and NPC cells are walkable, the desk's are blocked
  const cell = (x, y) => r.grid.rows[Math.floor(y / 8)][Math.floor(x / 8)];
  assert.equal(cell(180, 155), '0');
  assert.equal(cell(180, 146), '0');
  assert.equal(cell(96, 108), '1');
  assert.equal(rec.excluded, 3, 'chair, NPC and player excluded from the grid');
  assert.ok(r.keys.some(k => k.id === 'npc:tomasz'), 'the NPC is still a key point');
  assert.ok(r.keys.some(k => k.id === 'player_start'));
  assert.deepEqual(r.swivels.map(s => s.id), ['r_chair_home']);
  assert.equal(pm.worldGrid, null, 'the live grid is untouched');
});
