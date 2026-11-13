// The engine world's cellBeside (slice 9.2 H): the cell a visiting NPC stands on beside a
// colleague. A walkable side the visitor cannot reach (the gap behind Ruth's desk in
// test_access_work's open_office, browser run H, game 1222) is passed over; Sam's share_login
// visit stood still there until it timed out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

// A grid where every probed cell is walkable unless listed in walls; findWorldPath finds a path
// unless the end cell is listed in cutOff (walkable, but not connected to the visitor).
function fakeWindow({ walls = [], cutOff = [], visitor = { x: 780, y: 110 } } = {}) {
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
            findNearestWalkableWorldCell: (x, y) => (has(walls, x, y) ? null : { x, y }),
            findWorldPath: (sx, sy, ex, ey, cb, avoid, opts) => {
                searches.push({ to: { x: ex, y: ey }, opts: opts || null });
                cb(has(cutOff, ex, ey) ? null : [{ x: ex, y: ey }]);
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
