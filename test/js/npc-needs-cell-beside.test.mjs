// The engine world's cellBeside (slice 9.2 H): the cell a visiting NPC stands on beside a
// colleague. A walkable side the visitor cannot reach (the gap behind Ruth's desk in
// test_access_work's open_office, browser run H, game 1222) is passed over; Sam's share_login
// visit stood still there until it timed out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

// A grid where every probed cell is walkable unless listed in walls; findWorldPath finds a path
// unless the end cell is listed in cutOff (walkable, but not connected to the visitor).
function fakeWindow({ walls = [], cutOff = [], visitor = { x: 780, y: 110 }, noCallback = false, throws = false, emptyPath = false } = {}) {
    const has = (list, x, y) => list.some(w => w.x === x && w.y === y);
    const ruth = { x: 912, y: 128, body: { center: { x: 912, y: 128 } } };
    const searches = [];
    const win = {
        npcManager: { npcs: new Map([['ruth', { _sprite: ruth }]]) },
        npcBehaviorManager: {
            getBehavior: id => (id === 'sam' && visitor ? { roomId: 'open_office', sprite: { body: { center: visitor } } } : null),
        },
        pathfindingManager: {
            worldPathfinder: { enableSync() {}, disableSync() {} },
            worldGridBounds: { minX: 0, minY: 0, cols: 64, rows: 32, step: 32 },
            findNearestWalkableWorldCell: (x, y) => (has(walls, x, y) ? null : { x, y }),
            findWorldPath: (sx, sy, ex, ey, cb, avoid, opts) => {
                searches.push({ to: { x: ex, y: ey }, opts: opts || null });
                if (throws) throw new Error('grid not ready');
                if (noCallback) return;   // no synchronous support: the answer never arrives in time
                cb(has(cutOff, ex, ey) ? (emptyPath ? [] : null) : [{ x: ex, y: ey }]);
            },
        },
    };
    return { win, searches };
}

function withWindow(win, fn) {
    globalThis.window = win;
    try { return fn(); } finally { delete globalThis.window; }
}

test('cellBeside: the first side when the visitor can reach it', () => {
    const { win } = fakeWindow();
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth', 'sam'), { x: 944, y: 128 });
    });
});

test('cellBeside: a walkable side the visitor cannot reach is passed over', () => {
    const { win, searches } = fakeWindow({ cutOff: [{ x: 944, y: 128 }] });
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth', 'sam', { avoidRooms: ['vault_room'] }), { x: 880, y: 128 });
    });
    assert.deepEqual(searches[0].opts, { avoidRooms: ['vault_room'] }, 'the visitor\'s leash is kept');
});

test('cellBeside: with no side reachable, or no visitor, the first walkable side', () => {
    const cut = [{ x: 944, y: 128 }, { x: 880, y: 128 }, { x: 912, y: 160 }, { x: 912, y: 96 }];
    const { win } = fakeWindow({ cutOff: cut });
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth', 'sam'), { x: 944, y: 128 });
    });
    const { win: plain, searches } = fakeWindow({ cutOff: cut, walls: [{ x: 944, y: 128 }] });
    withWindow(plain, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth'), { x: 880, y: 128 });
    });
    assert.equal(searches.length, 0, 'no route is searched without a visitor');
});

test('cellBeside: no sprite, no cell', () => {
    const { win } = fakeWindow();
    withWindow(win, () => {
        assert.equal(createEngineWorld().cellBeside('nobody', 'sam'), null);
    });
});

// ── E8 (OFFICE_LIFE_MISSIONS_PLAN 9.1): besideCell, the second user's cell at a shared object ──
// Laid out like test_needs_sims's kitchen water_cooler with its right side taken by the first user:
// approach (-276, 276); right (-244, 276) taken; left (-308, 276) walkable with no path from the
// partner; below (-276, 308) not walkable; above (-276, 244) reachable.
const APPROACH = { x: -276, y: 276 };
const RIGHT = { x: -244, y: 276 }, LEFT = { x: -308, y: 276 }, BELOW = { x: -276, y: 308 }, ABOVE = { x: -276, y: 244 };
const PARTNER = { x: -600, y: 100 };

test('besideCell with from: a walkable side with a definite no path is passed over (the cooler layout)', () => {
    const { win, searches } = fakeWindow({ walls: [BELOW], cutOff: [LEFT] });
    withWindow(win, () => {
        const w = createEngineWorld();
        assert.deepEqual(w.besideCell(APPROACH, [RIGHT], { from: PARTNER, avoidRooms: ['vault_room'] }), ABOVE);
        assert.deepEqual(w.besideCell(APPROACH, [RIGHT]), LEFT, 'without from: the first free walkable side, today\'s choice');
    });
    assert.deepEqual(searches[0].opts, { avoidRooms: ['vault_room'] }, 'the partner\'s leash is kept');
    assert.equal(searches.length, 2, 'routes searched only with from: left, then above');
});

test('besideCell with from and no reachable side: null', () => {
    const { win } = fakeWindow({ walls: [BELOW], cutOff: [LEFT, ABOVE] });
    withWindow(win, () => {
        assert.equal(createEngineWorld().besideCell(APPROACH, [RIGHT], { from: PARTNER }), null);
    });
});

test('besideCell with from and a pathfinder that never calls back: the first free walkable side, as today', () => {
    const { win } = fakeWindow({ walls: [BELOW], cutOff: [LEFT], noCallback: true });
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().besideCell(APPROACH, [RIGHT], { from: PARTNER }), LEFT);
    });
});

test('besideCell without from: the first free walkable side; a taken side is still skipped', () => {
    const { win, searches } = fakeWindow({ cutOff: [LEFT, ABOVE, BELOW] });
    withWindow(win, () => {
        const w = createEngineWorld();
        assert.deepEqual(w.besideCell(APPROACH, []), RIGHT);
        assert.deepEqual(w.besideCell(APPROACH, [RIGHT]), LEFT);
        assert.deepEqual(w.besideCell(APPROACH, [RIGHT, LEFT]), BELOW);
        assert.deepEqual(w.besideCell(APPROACH, [RIGHT], { from: PARTNER, avoidRooms: [] }), null, 'with from, every free side cut off');
    });
    assert.ok(searches.every(x => x.to.x !== RIGHT.x || x.to.y !== RIGHT.y), 'a taken side is never route-searched');
});

test('routeLength detail: known false for a missing pathfinder, a throw and no callback; known true for a path, an empty one and the same tile', () => {
    withWindow({}, () => {
        assert.deepEqual(createEngineWorld().routeLength(PARTNER, LEFT, { detail: true }), { length: null, known: false });
        assert.equal(createEngineWorld().routeLength(PARTNER, LEFT), null, 'without detail: as before');
    });
    for (const [label, opts] of [['throw', { throws: true }], ['no callback', { noCallback: true }]]) {
        const { win } = fakeWindow(opts);
        withWindow(win, () => {
            assert.deepEqual(createEngineWorld().routeLength(PARTNER, LEFT, { detail: true }), { length: null, known: false }, label);
            assert.equal(createEngineWorld().routeLength(PARTNER, LEFT), null, `${label}, without detail`);
        });
    }
    for (const [label, opts] of [['null path', {}], ['empty path', { emptyPath: true }]]) {
        const { win } = fakeWindow({ cutOff: [LEFT], ...opts });
        withWindow(win, () => {
            assert.deepEqual(createEngineWorld().routeLength(PARTNER, LEFT, { detail: true }), { length: null, known: true }, label);
            assert.equal(createEngineWorld().routeLength(PARTNER, LEFT), null);
        });
    }
    const { win } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        const plain = w.routeLength(PARTNER, ABOVE);
        assert.ok(plain > 0);
        assert.deepEqual(w.routeLength(PARTNER, ABOVE, { detail: true }), { length: plain, known: true });
        assert.deepEqual(w.routeLength(ABOVE, { x: ABOVE.x + 4, y: ABOVE.y }, { detail: true }), { length: 4, known: true }, 'same tile');
    });
});

// R1 m3: findWorldPath calls back null at once while worldPathfinder or worldGridBounds is missing
// (npc-pathfinding.js, "world grid not ready"). That is no answer, so known is false, and
// besideCell keeps the first free walkable side rather than failing with no_beside_cell.
test('routeLength detail: the pathfinder\'s "grid not ready" null is unknown, not no path', () => {
    for (const missing of ['worldPathfinder', 'worldGridBounds']) {
        const { win, searches } = fakeWindow({ cutOff: [LEFT, ABOVE] });
        const pm = win.pathfindingManager;
        delete pm[missing];
        pm.findWorldPath = (sx, sy, ex, ey, cb) => { searches.push({ to: { x: ex, y: ey } }); cb(null); };   // as the real one does
        withWindow(win, () => {
            const w = createEngineWorld();
            assert.deepEqual(w.routeLength(PARTNER, LEFT, { detail: true }), { length: null, known: false }, `${missing} missing`);
            assert.equal(w.routeLength(PARTNER, LEFT), null, `${missing} missing, without detail: as before`);
            assert.deepEqual(w.besideCell(APPROACH, [RIGHT], { from: PARTNER }), LEFT, `${missing} missing: the first free walkable side, not null`);
        });
    }
});
