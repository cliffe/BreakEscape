// Gate doors (systems/door-gates.js): open for listed NPCs as they near, hold for
// holdMs, shut again; never on the player or a guard in the doorway; undisguised
// player shuts it and keeps it shut, the held guard turns back; closeNow.
// Also PathfindingManager.unmarkDoor. Run with: node test/js/door-gates.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const { DoorGates, normaliseGate, GUARD_TURN_BACK_MS } = await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

// A N/S doorway at (100, 100) between lobby (south) and vault (north)
function setup(gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'disguised' }) {
    const events = [];
    const pmCalls = [];
    const mkSprite = (roomId, connectedRoom, direction) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false }
    });
    const guard = { x: 300, y: 300, visible: true, active: true };
    // wantsCross: his route leg takes him across this gate; turnBacks: calls to turnBackFromGate
    const behaviour = {
        currentPath: [], pathIndex: 0, wantsCross: true, turnBacks: [],
        wantsToCrossGate() { return this.wantsCross; },
        turnBackFromGate(info) { if (!this.wantsCross) return false; this.turnBacks.push(info); this.wantsCross = false; return true; }
    };
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

test('an undisguised player at the gate means it never opens for the guard, however long he waits', () => {
    // lab_physical_pentest: the old guard override (1e6e6dbba) opened it after 5 s, so a
    // camping undisguised player followed Len through and skipped the hi-vis lesson.
    const { gates, a, guard, behaviour, events } = setup();
    behaviour.turnBackFromGate = () => false;       // keeps wanting through: worst case
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };               // 50px: barred (undisguised)
    for (let t = 0; t <= 60000; t += 250) gates.update(t);
    assert.equal(a.body.enable, true, 'still shut after a minute');
    assert.ok(!events.some(e => e[0] === 'door_gate_opened'));
});

test('approachPoint: a guard inside his gate\'s radius waits where he stands', () => {
    // lab_physical_pentest: radius 72, and Len's badge reader is about 62 px from the door.
    // Kept out by a barred player, he waits at the reader; he used to walk to the door front.
    const { gates } = setup({ openFor: ['guard'], openRadius: 72, holdMs: 2500, playerMayPassIf: 'disguised' });
    assert.equal(gates.approachPoint('guard', { x: 100, y: 162 }), null, '62 px out, inside the radius');
    assert.equal(gates.approachPoint('guard', { x: 100, y: 172 }), null, 'on the radius');
    assert.deepEqual(gates.approachPoint('guard', { x: 100, y: 180 }),
        { x: 100, y: 148, roomId: 'lobby', connectedRoom: 'vault' }, '80 px out: walks to 48 px, inside it');
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

test('a guard held at a barred gate turns back after GUARD_TURN_BACK_MS, once', () => {
    const { gates, a, guard, behaviour, events } = setup();
    guard.x = 100; guard.y = 140;                     // near, his leg crosses
    window.player = { x: 100, y: 150 };               // barred
    gates.update(1000);
    gates.update(1000 + GUARD_TURN_BACK_MS - 1);
    assert.equal(behaviour.turnBacks.length, 0, 'not yet');
    gates.update(1000 + GUARD_TURN_BACK_MS);
    assert.equal(behaviour.turnBacks.length, 1, 'turned back');
    assert.deepEqual(behaviour.turnBacks[0], { roomId: 'lobby', connectedRoom: 'vault', direction: 'north', x: 100, y: 100 });
    assert.deepEqual(events.map(e => e[0]), ['door_gate_guard_turned_back']);
    assert.equal(events[0][1].npcId, 'guard');
    assert.equal(a.body.enable, true, 'and the gate stayed shut');
    gates.update(1000 + 3 * GUARD_TURN_BACK_MS);      // no longer wants through: no repeat
    assert.equal(behaviour.turnBacks.length, 1);
});

test('a guard dwelling beside a barred gate (not crossing) is never turned back', () => {
    const { gates, guard, behaviour } = setup();
    behaviour.wantsCross = false;
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };
    gates.update(0);
    gates.update(3000);                               // wants through only from now
    behaviour.wantsCross = true;
    gates.update(4000);
    gates.update(4000 + GUARD_TURN_BACK_MS - 1);
    assert.equal(behaviour.turnBacks.length, 0, 'the timer runs from when he wants to cross');
    gates.update(4000 + GUARD_TURN_BACK_MS);
    assert.equal(behaviour.turnBacks.length, 1);
});

test('the guard retries on his next cycle and crosses once the player has gone, or is disguised', () => {
    const { gates, a, guard, behaviour, events } = setup();
    guard.x = 100; guard.y = 140;
    window.player = { x: 100, y: 150 };               // barred
    gates.update(0);
    gates.update(GUARD_TURN_BACK_MS);
    assert.equal(behaviour.turnBacks.length, 1);
    guard.x = 400; guard.y = 400;                     // walks his loop
    gates.update(8000);
    // Next cycle, player still camped: turned back again, still shut
    guard.x = 100; guard.y = 140; behaviour.wantsCross = true;
    gates.update(20000);
    gates.update(20000 + GUARD_TURN_BACK_MS);
    assert.equal(behaviour.turnBacks.length, 2);
    assert.equal(a.body.enable, true);
    // Next cycle, the player has gone: opens at once
    guard.x = 400; guard.y = 400; gates.update(30000);
    window.player = { x: 400, y: 400 };
    guard.x = 100; guard.y = 140; behaviour.wantsCross = true;
    gates.update(40000);
    assert.equal(a.body.enable, false, 'opens for him');
    assert.equal(behaviour.turnBacks.length, 2);
    // Later cycle: the player is back but disguised: opens beside him
    guard.y = 20; gates.update(41000); gates.update(45000);
    assert.equal(a.body.enable, true);
    window.player = { x: 100, y: 150 };
    window.gameState.globalVariables.disguised = true;
    guard.x = 100; guard.y = 140;
    gates.update(50000);
    assert.equal(a.body.enable, false, 'disguised: opens at once');
    assert.equal(behaviour.turnBacks.length, 2);
    assert.equal(events.filter(e => e[0] === 'door_gate_opened').length, 2);
});

test('a guard mid-crossing (in the doorway) is not shut in when a barred player arrives', () => {
    const { gates, a, guard } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);                                  // opens (player far)
    guard.y = 100;                                    // in the doorway
    window.player = { x: 100, y: 150 };               // barred player arrives
    gates.update(100);
    assert.equal(a.body.enable, false, 'stays open while he is in the doorway');
    assert.equal(gates.closeNow('vault', { force: true, now: 150 }), false, 'even a forced close waits for him');
    assert.equal(a.body.enable, false);
    guard.y = 40;                                     // through, out of the doorway
    gates.update(200);
    assert.equal(a.body.enable, true, 'then the barred player shuts it');
});

test('a guard only walking towards the gate does not hold it open for a barred player', () => {
    // His planned path crosses the doorway, but he is not in it: shut, or the
    // undisguised player could follow him through.
    const { gates, a, guard, behaviour } = setup();
    guard.x = 100; guard.y = 150;
    gates.update(0);
    assert.equal(a.body.enable, false);
    behaviour.currentPath = [{ x: 100, y: 140 }, { x: 100, y: 100 }, { x: 100, y: 20 }];
    window.player = { x: 120, y: 145 };
    gates.update(100);
    assert.equal(a.body.enable, true);
});

test('disguised play is unchanged: the gate opens beside him at once and nobody turns back', () => {
    const { gates, a, guard, behaviour } = setup();
    window.gameState.globalVariables.disguised = true;
    window.player = { x: 100, y: 150 };
    guard.x = 100; guard.y = 140;
    gates.update(0);
    assert.equal(a.body.enable, false);
    gates.update(GUARD_TURN_BACK_MS * 2);
    assert.equal(behaviour.turnBacks.length, 0);
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
