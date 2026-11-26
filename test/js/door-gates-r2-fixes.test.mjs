// CA engine review E1 R2 fixes (planning_notes/.../CA_ENGINE_REVIEW_E1_R2.md):
//  m1  reassert() unmarks the side corridor at every sprite of the gate, and the click ends as an exit
//  m2  an inert click into a loaded room still sends the unlock handshake; a live window refuses properly
//  m3  an ordinary unlocked door to an unloaded room sends exactly one unlock request

// doors.js is loaded by data URL with its imports stubbed (as door-snap.test.mjs does).
// Run with: node test/js/door-gates-r1-fixes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
globalThis.Phaser = { Math: { Distance: { Between: (a, b, c, d) => Math.hypot(c - a, d - b) } } };
globalThis.__hu = [];      // handleUnlock calls
globalThis.__nsu = [];     // notifyServerUnlock calls
const { DoorGates } = await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));
await import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8')));

let src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
const stub = (spec, body) => { src = src.replace(`from '${spec}'`, `from '${dataUrl(body)}'`); };
stub('../utils/constants.js', 'export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 160, GRID_UNIT_HEIGHT_PX = 128, DOOR_INTERACTION_RANGE = 64;');
stub('./unlock-system.js', 'export const handleUnlock = (...a) => { globalThis.__hu.push(a); if (!a[2]?.handshake) globalThis.__nsu.push([0, 0, "unlocked"]); }, notifyServerUnlock = async (...a) => { globalThis.__nsu.push(a); return { success: true }; }, playerHoldsRfidCredentialFor = () => false;');
stub('../utils/locked-hint.js', 'export const appendLockedHint = (b) => b, lockedHintDuration = (l, ms) => ms, doorRefusalTitle = (l, t) => t;');
stub('./interaction-repeat.js', 'export const isRepeatInteraction = () => false;');
stub('./room-ready.js', 'export const waitForRoomReady = (get, p) => Promise.resolve(p).then(() => ({ ready: true, room: get() }));');
const { handleDoorInteraction } = await import(dataUrl(src));

const BX = 532, Y = 100;
const GATE = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'vest' };
const tick = () => new Promise((r) => setTimeout(r, 5));

function sprite(roomId, connectedRoom, direction, x, y = Y, extra = {}) {
    const s = {
        x, y, active: true, body: { enable: true }, destroyed: 0,
        doorProperties: { roomId, connectedRoom, direction, worldX: x, worldY: y, isSideDoor: true, open: false, locked: false, ...extra },
        interactionZone: { destroy() {} },
        setActive(v) { this.active = v; },
        destroy() { this.destroyed++; }
    };
    return s;
}

function world({ globals = { vest: false, win: true } } = {}) {
    globalThis.__hu = []; globalThis.__nsu = [];
    const events = [], alerts = [], loads = [];
    window.rooms = {};
    window.roomPositions = {};
    window.gameScenario = { rooms: {} };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = (...a) => alerts.push(a);
    window.gameState = { globalVariables: { ...globals } };
    window.npcManager = { npcs: new Map() };
    window.npcBehaviorManager = { getBehavior: () => null };
    const corridors = [];
    window.pathfindingManager = {
        markDoorWalkable() {},
        markSideDoorCorridor(x, y, d) { corridors.push({ worldX: x, worldY: y, direction: d }); },
        unmarkDoor(x, y) { for (let i = corridors.length - 1; i >= 0; i--) if (Math.abs(corridors[i].worldX - x) < 2 && Math.abs(corridors[i].worldY - y) < 2) corridors.splice(i, 1); },
        rebuildWorldGrid() {},
        corridors
    };
    window.doorGates = new DoorGates();
    window.DISABLE_LOCKS = false;
    window.game = { scene: { isActive: () => true } };
    window.roomDataCache = new Map();
    return { events, alerts, loads, gates: window.doorGates };
}


test('m3: an ordinary unlocked door to an unloaded room sends exactly one unlock request and opens once', async () => {
    const { gates } = world();
    const a = sprite('hall', 'office', 'north', 200, 100, { isSideDoor: false });
    window.rooms.hall = { doorSprites: [a] };
    window.loadRoom = async (id) => { window.rooms[id] = { doorSprites: [] }; };
    window.player = { x: 200, y: 110 };
    window.currentPlayerRoom = 'hall';
    await handleDoorInteraction(a);
    await tick();
    assert.equal(globalThis.__nsu.length, 1, 'one request: the pre-load handshake only');
    assert.equal(globalThis.__nsu[0][2], 'unlocked');
    assert.equal(globalThis.__hu.length, 1, 'the click ends in handleUnlock once');
    assert.equal(globalThis.__hu[0][2]?.handshake?.response?.success, true, 'handed the handshake response');
});

test('m3: a refused pre-load (no room) still ends in one request and an access-denied path', async () => {
    const { gates } = world();
    const a = sprite('hall', 'office', 'north', 200, 100, { isSideDoor: false });
    window.rooms.hall = { doorSprites: [a] };
    window.loadRoom = async () => {};
    window.player = { x: 200, y: 110 };
    await handleDoorInteraction(a);
    await tick();
    assert.equal(globalThis.__nsu.length, 1);
});

test('m2: an inert click into a room that is loaded but not unlocked for him still sends the handshake', async () => {
    const w = world({ globals: { vest: false, win: false } });
    const lobby = sprite('lobby', 'studio', 'east', BX - 16);
    w.gates.register(lobby, { ...GATE, activeIf: 'globalVars.win' });
    window.rooms.lobby = { doorSprites: [lobby] };
    window.rooms.studio = { doorSprites: [] };            // a route NPC loaded it
    window.currentPlayerRoom = 'lobby';
    window.player = { x: BX - 40, y: Y };
    const loads = [];
    window.loadRoom = async (id) => loads.push(id);
    await handleDoorInteraction(lobby);
    await tick();
    assert.equal(globalThis.__nsu.length, 1, 'handshake sent');
    assert.equal(globalThis.__nsu[0][2], 'unlocked');
    assert.deepEqual(loads, [], 'the loaded room is not loaded again');
    assert.equal([...w.gates.groups.values()][0].open, true);
});

test('m2: the window going live during the inert load is refused like any live click', async () => {
    const w = world({ globals: { vest: false, win: false } });
    const lobby = sprite('lobby', 'studio', 'east', BX - 16);
    w.gates.register(lobby, { ...GATE, activeIf: 'globalVars.win' });
    window.rooms.lobby = { doorSprites: [lobby] };
    window.currentPlayerRoom = 'lobby';
    window.player = { x: BX - 40, y: Y };
    window.loadRoom = async (id) => { window.rooms[id] = { doorSprites: [] }; window.gameState.globalVariables.win = true; };
    await handleDoorInteraction(lobby);
    await tick();
    assert.equal([...w.gates.groups.values()][0].open, false);
    assert.equal(w.events.some(e => e[0] === 'door_gate_denied'), true, 'door_gate_denied fires');
});

test('m1: reassert leaves no corridor carved through a shut gate, and the click ends as an exit', async () => {
    const { gates } = world();
    const studio = sprite('studio', 'lobby', 'west', BX + 16, Y, { locked: true });
    gates.register(studio, null);
    window.rooms.studio = { doorSprites: [studio] };
    let lobby;
    window.loadRoom = async (id) => {
        lobby = sprite('lobby', 'studio', 'east', BX - 16);
        gates.register(lobby, GATE);
        window.rooms[id] = { doorSprites: [lobby] };
    };
    window.DISABLE_LOCKS = true;
    window.currentPlayerRoom = 'studio';
    window.player = { x: BX + 30, y: Y };
    await handleDoorInteraction(studio);
    await tick();
    const g = [...gates.groups.values()][0];
    assert.equal(g.open, true, 'the player who unlocked it from inside leaves through the gate');
    gates.close(g, Date.now());
    assert.equal(window.pathfindingManager.corridors.length, 0, 'a shut gate has no corridor carved through it');
});

test('m1: reassert on a shut gate (player outside) drops a corridor stored at the other sprite', () => {
    const { gates } = world();
    const studio = sprite('studio', 'lobby', 'west', BX + 16);
    gates.register(studio, null);
    const lobby = sprite('lobby', 'studio', 'east', BX - 16);
    gates.register(lobby, GATE);
    window.pathfindingManager.markSideDoorCorridor(studio.doorProperties.worldX, studio.doorProperties.worldY, 'west');
    assert.equal(window.pathfindingManager.corridors.length, 1);
    assert.equal(gates.reassert(studio), true);
    assert.equal(window.pathfindingManager.corridors.length, 0);
});
