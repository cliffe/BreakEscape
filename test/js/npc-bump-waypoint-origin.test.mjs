// The avoidance waypoint inserted after a bump is built from the sprite's WORLD position, so it
// must not have the room origin added again (m05 break room, origin -320,-128: the walker headed
// 100+ px west, off route). Run with: node test/js/npc-bump-waypoint-origin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
window.gameState = window.gameState || { globalVariables: {} };
const { handleNPCCollision, handleNPCPlayerCollision } = await import('../../public/break_escape/js/systems/npc-sprites.js');

function setup(origin, dir) {
    let chosen = null;
    const b = {
        npcId: 'walker', roomId: 'break', direction: dir, currentState: 'patrol',
        patrolTarget: { x: 0, y: 0 }, waypointIndex: 0,
        config: { patrol: { waypoints: [{ x: 1, y: 1 }, { x: 9, y: 9 }] } },
        triggerSettling: () => false, settleDuration: 300,
        chooseWaypointTarget() { chosen = this.config.patrol.waypoints.find(w => w.isTemporary); },
    };
    const sprite = { npcId: 'walker', x: 20 * 32, y: 5 * 32, body: { setVelocity() {}, center: { x: 640, y: 160 } },
        scene: { time: { now: 1000 } } };
    window.rooms = { break: { position: origin } };
    window.player = { currentRoom: 'break' };
    window.npcBehaviorManager = { getBehavior: id => (id === 'walker' ? b : null) };
    return { b, sprite, get chosen() { return chosen; } };
}
const quiet = fn => { const l = console.log, w = console.warn; console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; } };

for (const origin of [{ x: 0, y: 0 }, { x: -320, y: -128 }, { x: 480, y: 96 }]) {
    for (const [name, hit] of [
        ['npc', (s) => handleNPCCollision(s, { npcId: 'other', x: 0, y: 0, body: { immovable: true } })],
        ['player', (s) => handleNPCPlayerCollision(s, { x: 0, y: 0, body: { center: { x: 0, y: 0 } } })],
    ]) {
        test(`avoidance waypoint stays within a tile of the sprite (${name}, origin ${origin.x},${origin.y})`, () => {
            const t = setup(origin, 'left');
            quiet(() => hit(t.sprite));
            const wp = t.chosen;
            assert.ok(wp, 'a temporary waypoint was inserted');
            assert.ok(Math.abs(wp.worldX - t.sprite.x) <= 32 + 1, `worldX ${wp.worldX} near ${t.sprite.x}`);
            assert.ok(Math.abs(wp.worldY - t.sprite.y) <= 32 + 1, `worldY ${wp.worldY} near ${t.sprite.y}`);
        });
    }
}
