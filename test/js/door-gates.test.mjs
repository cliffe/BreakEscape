// Gate doors (systems/door-gates.js): open for listed NPCs as they near, hold for
// holdMs, shut again; never on the player; undisguised player shuts it; closeNow.
// Also PathfindingManager.unmarkDoor. Run with: node test/js/door-gates.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const { DoorGates, normaliseGate, GUARD_PRIORITY_MS, GUARD_PASS_MS } = await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

// A N/S doorway at (100, 100) between lobby (south) and vault (north)
function setup(gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'disguised' }) {
    const events = [];
    const pmCalls = [];
    const mkSprite = (roomId, connectedRoom, direction) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false }
    });
    const guard = { x: 300, y: 300, visible: true, active: true };
    const behaviour = { currentPath: [], pathIndex: 0 };
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', _sprite: guard }]]) };
    window.npcBehaviorManager = { getBehavior: (id) => (id === 'guard' ? behaviour : null) };
    window.player = { x: 400, y: 400 };
    window.gameState = { globalVariables: { disguised: false } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.pathfindingManager = {
        markDoorWalkable: (...a) => pmCalls.push(['mark', ...a]),
        unmarkDoor: (...a) => pmCalls.push(['unmark', ...a]),
        rebuildWorldGrid: () => pmCalls.push(['rebuild'])
    };
    const gates = new DoorGates();
    const a = mkSprite('lobby', 'vault', 'north');
    const b = mkSprite('vault', 'lobby', 'south');
    assert.equal(gates.register(a, gate), true);
    assert.equal(gates.register(b, null), true);   // joins by position
    return { gates, a, b, guard, behaviour, events, pmCalls };
}

test('normaliseGate defaults and opt-out', () => {
    assert.equal(normaliseGate(null), null);
    assert.equal(normaliseGate({ enabled: false }), null);
    const g = normaliseGate({ openFor: 'len' });
    assert.deepEqual(g.openFor, ['len']);
    assert.equal(g.openRadius, 56);
    assert.equal(g.holdMs, 2500);
});

test('a plain door is not a gate', () => {
    const gates = new DoorGates();
    const s = { x: 0, y: 0, doorProperties: { worldX: 0, worldY: 0 } };
    assert.equal(gates.register(s, null), false);
    assert.equal(gates.isGate(s), false);
});

test('opens when the guard nears, holds holdMs after he leaves, then shuts', () => {
    const { gates, a, b, guard, events, pmCalls } = setup();
    gates.update(0);
    assert.equal(a.body.enable, true);
    guard.x = 110; guard.y = 130;                     // 31px away
    gates.update(1000);
    assert.equal(a.body.enable, false);
    assert.equal(b.body.enable, false);
    assert.equal(a.doorProperties.open, true);
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened']);
    assert.ok(pmCalls.some(c => c[0] === 'mark' && c[1] === 'lobby' && c[4] === 'north'));
    assert.ok(pmCalls.some(c => c[0] === 'mark' && c[1] === 'vault' && c[4] === 'south'));
    assert.equal(pmCalls.at(-1)[0], 'rebuild');
    guard.y = 20;                                     // through, 80px away
    gates.update(1500);
    gates.update(3400);                               // 2400ms after he was last near
    assert.equal(a.body.enable, false);
    gates.update(3600);
    assert.equal(a.body.enable, true);
    assert.equal(b.doorProperties.open, false);
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened', 'door_gate_closed']);
    assert.ok(pmCalls.some(c => c[0] === 'unmark' && c[1] === 100 && c[2] === 100));
});

test('never shuts while the guard\'s remaining path crosses the doorway', () => {
    const { gates, a, guard, behaviour } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);
    guard.y = 300;                                    // far, but his path still goes through
    behaviour.currentPath = [{ x: 100, y: 200 }, { x: 100, y: 100 }, { x: 100, y: 20 }];
    gates.update(10000);
    assert.equal(a.body.enable, false);
    behaviour.currentPath = [];
    gates.update(10100);
    assert.equal(a.body.enable, true);
});

test('never shuts on a player in the doorway', () => {
    const { gates, a, guard } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);
    guard.y = 400;
    window.gameState.globalVariables.disguised = true;
    window.player = { x: 100, y: 110, body: { left: 91, right: 109, top: 120, bottom: 130 } };
    gates.update(10000);
    assert.equal(a.body.enable, false);
    window.player = { x: 400, y: 400 };
    gates.update(10100);
    assert.equal(a.body.enable, true);
});

test('undisguised player near the open gate shuts it at once and keeps it shut', () => {
    const { gates, a, guard } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);
    assert.equal(a.body.enable, false);
    window.player = { x: 100, y: 170 };               // 70px: outside 56
    gates.update(100);
    assert.equal(a.body.enable, false);
    window.player = { x: 100, y: 150 };               // 50px, not in the doorway
    gates.update(200);
    assert.equal(a.body.enable, true);
    gates.update(300);                                // guard still near: stays shut
    assert.equal(a.body.enable, true);
    // In the doorway band (the closed door's body is only its bottom strip): still shut
    window.player = { x: 100, y: 80, body: { left: 91, right: 109, top: 75, bottom: 85 } };
    gates.update(350);
    assert.equal(a.body.enable, true);
    window.player = { x: 100, y: 150 };
    // Disguised: the guard reopens it with the player beside him
    window.gameState.globalVariables.disguised = true;
    gates.update(400);
    assert.equal(a.body.enable, false);
});

test('a barred (undisguised) player never traps the openFor guard: the gate opens for him after the grace', () => {
    // Regression: lab_physical_pentest, Len parked in secure_area because an
    // undisguised player at the door barred the gate he needed to cross back
    // through, so his route stalled for good and len_at_door never re-fired.
    const { gates, a, guard, events } = setup();
    guard.x = 100; guard.y = 140;                     // near the door, wants through
    window.player = { x: 100, y: 150 };               // 50px: barred (undisguised)
    gates.update(1000);
    assert.equal(a.body.enable, true, 'barred: shut at first');
    assert.deepEqual(events.map(e => e[0]), [], 'did not open yet');
    gates.update(1000 + GUARD_PRIORITY_MS - 1);
    assert.equal(a.body.enable, true, 'still within the grace: still shut');
    gates.update(1000 + GUARD_PRIORITY_MS);
    assert.equal(a.body.enable, false, 'grace elapsed: opens for the guard despite the barred player');
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened']);
});

test('a priority open is held long enough for the guard to ask for his path, and tells him at once', () => {
    // Regression: lab_physical_pentest game 60. The priority open was shut again on
    // the next tick by the same barred player, the guard's 2 s retry missed the
    // pulse, and he stood at the reader for as long as the player stood there.
    const { gates, a, guard, behaviour, events } = setup();
    let told = 0;
    behaviour.gateOpened = () => { told++; };
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };               // barred, and stays
    gates.update(1000);
    const openedAt = 1000 + GUARD_PRIORITY_MS;
    gates.update(openedAt);
    assert.equal(a.body.enable, false, 'opened by priority');
    assert.equal(told, 1, 'the openFor guard is told the gate opened');
    gates.update(openedAt + 16);
    assert.equal(a.body.enable, false, 'not shut on the very next tick');
    gates.update(openedAt + GUARD_PASS_MS - 1);
    assert.equal(a.body.enable, false, 'held through the pass window');
    // He asked for his path and is crossing: stays open as before
    behaviour.currentPath = [{ x: 100, y: 100 }];
    gates.update(openedAt + GUARD_PASS_MS + 500);
    assert.equal(a.body.enable, false, 'a guard mid-crossing keeps it open');
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened']);
});

test('after the pass window a barred player shuts the gate again if the guard is not crossing', () => {
    const { gates, a, guard } = setup();
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };
    gates.update(1000);
    gates.update(1000 + GUARD_PRIORITY_MS);
    assert.equal(a.body.enable, false);
    gates.update(1000 + GUARD_PRIORITY_MS + GUARD_PASS_MS);
    assert.equal(a.body.enable, true, 'the anti-tailgate rule is back once the window ends');
});

test('a forced close ends the pass window', () => {
    const { gates, a, guard } = setup();
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };
    gates.update(1000);
    gates.update(1000 + GUARD_PRIORITY_MS);
    assert.equal(gates.closeNow('vault', { force: true, now: 1000 + GUARD_PRIORITY_MS + 10 }), true);
    assert.equal(a.body.enable, true);
    assert.equal(gates.state('vault')[0].open, false);
});

test('approachPoint: the spot in front of a shut gate on the guard\'s side, only when he is out of reach', () => {
    const { gates, guard } = setup();
    // South of the door, pushed well away along the wall
    assert.deepEqual(gates.approachPoint('guard', { x: 280, y: 148 }),
        { x: 100, y: 148, roomId: 'lobby', connectedRoom: 'vault' });
    // North of it (he ended a leg inside the far room, out of reach)
    assert.deepEqual(gates.approachPoint('guard', { x: 60, y: -20 }),
        { x: 100, y: 52, roomId: 'lobby', connectedRoom: 'vault' });
    // Already in front of it: the gate opens without his moving
    assert.equal(gates.approachPoint('guard', { x: 100, y: 150 }), null);
    // Not his gate, or a gate that joins neither named room
    assert.equal(gates.approachPoint('stranger', { x: 280, y: 148 }), null);
    assert.equal(gates.approachPoint('guard', { x: 280, y: 148 }, ['cellar']), null);
    assert.ok(gates.approachPoint('guard', { x: 280, y: 148 }, ['vault']));
    // An open gate needs no approach
    guard.x = 100; guard.y = 140;
    gates.update(0);
    assert.equal(gates.approachPoint('guard', { x: 280, y: 148 }), null);
    // No position, no answer
    assert.equal(new DoorGates().approachPoint('guard', null), null);
});

test('approachPoint stays inside a small radius, and works for a side door', () => {
    const small = setup({ openFor: ['guard'], openRadius: 40, holdMs: 0 });
    const p = small.gates.approachPoint('guard', { x: 100, y: 300 });
    assert.equal(p.y, 132, 'radius 40: stands 32 px out, inside the radius');
    const gates = new DoorGates();
    const side = { x: 500, y: 500, active: true, body: { enable: true },
        doorProperties: { roomId: 'east', connectedRoom: 'west', direction: 'west', worldX: 500, worldY: 500, isSideDoor: true } };
    gates.register(side, { openFor: ['guard'] });
    assert.deepEqual(gates.approachPoint('guard', { x: 700, y: 520 }),
        { x: 548, y: 500, roomId: 'east', connectedRoom: 'west' });
});

test('the grace timer resets when the guard leaves, so it is per-visit not cumulative', () => {
    const { gates, a, guard } = setup();
    window.player = { x: 100, y: 150 };               // barred
    guard.x = 100; guard.y = 140;                     // near
    gates.update(1000);
    assert.equal(a.body.enable, true);
    guard.x = 400; guard.y = 400;                     // guard wanders off
    gates.update(2000);
    guard.x = 100; guard.y = 140;                     // comes back: grace restarts
    gates.update(3000);
    gates.update(3000 + GUARD_PRIORITY_MS - 1);
    assert.equal(a.body.enable, true, 'grace restarted on his return, not carried over');
    gates.update(3000 + GUARD_PRIORITY_MS);
    assert.equal(a.body.enable, false);
});

test('a guard mid-crossing is not shut out by a barred player', () => {
    const { gates, a, guard, behaviour } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);                                  // opens (player far)
    assert.equal(a.body.enable, false);
    behaviour.currentPath = [{ x: 100, y: 100 }];     // his path crosses the doorway
    window.player = { x: 100, y: 150 };               // now a barred player arrives
    gates.update(100);
    assert.equal(a.body.enable, false, 'stays open while he crosses, barred player notwithstanding');
});

test('closeNow: forced close skips the crossing hold, keeps the doorway hold, stays shut a while', () => {
    const { gates, a, guard, behaviour } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);
    behaviour.currentPath = [{ x: 100, y: 100 }];
    assert.equal(gates.closeNow('vault', { now: 100 }), false);   // not forced: he is crossing
    assert.equal(a.body.enable, false);
    window.player = { x: 100, y: 110, body: { left: 91, right: 109, top: 120, bottom: 130 } };
    assert.equal(gates.closeNow('vault', { force: true, now: 100 }), false);  // player in doorway
    window.player = { x: 400, y: 400 };
    assert.equal(gates.closeNow('vault', { force: true, now: 100 }), true);
    assert.equal(a.body.enable, true);
    gates.update(500);                                // guard near, but forced shut
    assert.equal(a.body.enable, true);
    gates.update(3200);                               // after max(holdMs, 3000)
    assert.equal(a.body.enable, false);
    assert.equal(gates.closeNow('nowhere'), false);
});

test('a sprite registered while the doorway is open is opened too', () => {
    const { gates, guard } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);
    const late = { x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId: 'vault', connectedRoom: 'lobby', direction: 'south', worldX: 100, worldY: 100 } };
    gates.register(late, null);
    assert.equal(late.body.enable, false);
    assert.equal(late.doorProperties.open, true);
});

// ---- PathfindingManager.unmarkDoor ----
const pfSrc = readFileSync(join(js, 'systems/npc-pathfinding.js'), 'utf8')
    .replace("'../utils/constants.js'", `'${dataUrl('export const TILE_SIZE = 32, PATHFINDING_STEP = 8;')}'`)
    .replace("'./path-doorways.js'", `'${dataUrl(readFileSync(join(js, 'systems/path-doorways.js'), 'utf8'))}'`)
    .replace("'./path-avoid.js'", `'${dataUrl('export const AVOID_CELL_COST = 5; export const collectAvoidRects = () => []; export const avoidCells = () => []; export const crossesAvoidRect = () => false; export const roomFloorRect = () => null; export const onFloor = () => false; export const floorRingCells = () => [];')}'`);
const { NPCPathfindingManager } = await import(dataUrl(pfSrc));

test('unmarkDoor forgets an N/S doorway in both rooms, and an E/W corridor', () => {
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.roomBounds.set('lobby', { worldX: 0, worldY: 96 });
    pm.roomBounds.set('vault', { worldX: 0, worldY: -192 });
    pm.markDoorWalkable('lobby', 112, 112, 'north');
    pm.markDoorWalkable('vault', 112, 112, 'south');
    pm.markDoorWalkable('lobby', 400, 112, 'north');  // another door stays
    assert.equal(pm.openDoorways.length, 2);
    assert.ok(pm.openNSDoors.length >= 2);
    pm.unmarkDoor(112, 112, 'north');
    assert.equal(pm.openDoorways.length, 1);
    assert.equal(pm.openDoorways[0].cx, 400);
    assert.deepEqual(pm.openNSDoors.map(d => d.worldX), [384]);
    pm.markSideDoorCorridor(500, 50, 'east');
    assert.equal(pm.openSideDoorCorridors.length, 1);
    pm.unmarkDoor(500, 50, 'east');
    assert.equal(pm.openSideDoorCorridors.length, 0);
    assert.equal(pm.openDoorways.length, 1);
});
