// The engine world's cellBeside (slice 9.2 H): the cell a visiting NPC stands on beside a
// colleague. A cell the player stands on is passed over, so a share_login visit is not
// blocked by a player waiting beside the colleague to hear it (browser run H, game 1222).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

function fakeWindow({ player, walls = [] } = {}) {
    const ruth = { x: 912, y: 128, body: { center: { x: 912, y: 128 } } };
    const blocked = (x, y) => walls.some(w => w.x === x && w.y === y);
    return {
        npcManager: { npcs: new Map([['ruth', { _sprite: ruth }]]) },
        pathfindingManager: {
            findNearestWalkableWorldCell: (x, y) => (blocked(x, y) ? null : { x, y }),
        },
        player: player || null,
    };
}

function withWindow(win, fn) {
    globalThis.window = win;
    try { return fn(); } finally { delete globalThis.window; }
}

test('cellBeside: the first walkable side when the player is elsewhere', () => {
    withWindow(fakeWindow({ player: { x: 600, y: 300 } }), () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth'), { x: 944, y: 128 });
    });
});

test('cellBeside: a side the player stands on is passed over', () => {
    const win = fakeWindow({ player: { body: { center: { x: 940, y: 132 } } } });
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth'), { x: 880, y: 128 });
    });
    const left = fakeWindow({ player: { x: 870, y: 136 }, walls: [{ x: 944, y: 128 }] });
    withWindow(left, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth'), { x: 912, y: 160 }, 'right is a wall, left is the player: below');
    });
});

test('cellBeside: with every free side taken by the player, the first walkable cell is kept', () => {
    const win = fakeWindow({ player: { x: 880, y: 128 }, walls: [{ x: 944, y: 128 }, { x: 912, y: 160 }, { x: 912, y: 96 }] });
    withWindow(win, () => {
        assert.deepEqual(createEngineWorld().cellBeside('ruth'), { x: 880, y: 128 });
    });
});

test('cellBeside: no sprite, no cell', () => {
    withWindow(fakeWindow(), () => {
        assert.equal(createEngineWorld().cellBeside('nobody'), null);
    });
});
