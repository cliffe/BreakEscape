// CA engine review E1 R1 fixes (planning_notes/.../CA_ENGINE_REVIEW_E1_R1.md):
//  B1  a gate whose secured room loads first is not destroyed by an ordinary click
//  M1  an inert click from outside loads the room before the gate opens, and a refusal leaves it shut
//  m1  the side walk target lies clear of the far room's door tile
//  m4  guard events carry the doorway's centre
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
stub('./unlock-system.js', 'export const handleUnlock = (...a) => globalThis.__hu.push(a), notifyServerUnlock = async (...a) => { globalThis.__nsu.push(a); return { success: true }; }, playerHoldsRfidCredentialFor = () => false;');
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
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {}, markSideDoorCorridor() {} };
    window.doorGates = new DoorGates();
    window.DISABLE_LOCKS = false;
    window.game = { scene: { isActive: () => true } };
    window.roomDataCache = new Map();
    return { events, alerts, loads, gates: window.doorGates };
}

// B1 -------------------------------------------------------------------------------------

test('B1: a click on the secured room\'s own door, before the outer room has loaded, reaches the gate and destroys nothing', async () => {
    const { gates, loads } = world();
    const studio = sprite('studio', 'lobby', 'west', BX + 16);
    gates.register(studio, null);                                  // the secured room loaded first: pending
    let lobby;
    window.rooms.studio = { doorSprites: [studio] };
    window.loadRoom = async (id) => {
        loads.push(id);
        lobby = sprite('lobby', 'studio', 'east', BX - 16);        // the outer room's entry carries the gate
        gates.register(lobby, GATE);
        window.rooms[id] = { doorSprites: [lobby] };
    };
    window.currentPlayerRoom = 'studio';
    window.player = { x: BX + 30, y: Y };
    await handleDoorInteraction(studio);
    await tick();
    assert.deepEqual(loads, ['lobby'], 'the outer room is loaded before the click is routed');
    assert.equal(globalThis.__hu.length, 0, 'it did not take the ordinary-door path (handleUnlock -> openDoor)');
    assert.equal(studio.destroyed + lobby.destroyed, 0, 'no gate sprite destroyed');
    assert.equal(gates.groups.size, 1);
    assert.equal(gates.isGate(studio) && gates.isGate(lobby), true);
    const g = [...gates.groups.values()][0];
    assert.equal(g.open, true, 'the player is inside the secured room: his click opens it to leave');
});

test('B1: if the outer room adopts the sprite while openDoor is already loading it, nothing is destroyed and the gate is shut again', async () => {
    const { gates } = world();
    // locked: true skips the click\'s own pre-load, so openDoor (DISABLE_LOCKS) is what loads the room
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
    window.currentPlayerRoom = 'lobby';
    window.player = { x: BX + 30, y: Y };
    await handleDoorInteraction(studio);
    await tick();
    assert.equal(studio.destroyed + lobby.destroyed, 0, 'neither sprite destroyed');
    assert.equal(studio.body.enable && lobby.body.enable, true, 'the gate is shut again: both bodies on');
    assert.equal(studio.doorProperties.open || lobby.doorProperties.open, false);
});

test('B1: openDoor never removes a gate\'s sprite from the room on the other side', async () => {
    const { gates } = world();
    // The gate is lobby (east) -> annex; the clicked annex sprite is 20px off, so it is no part of the gate's group
    const gateSprite = sprite('lobby', 'annex', 'east', BX - 16);
    gates.register(gateSprite, GATE);
    window.rooms.lobby = { doorSprites: [gateSprite] };
    const annex = sprite('annex', 'lobby', 'west', BX + 16, Y + 20);
    assert.equal(gates.isGate(annex), false);
    window.DISABLE_LOCKS = true;
    window.player = { x: BX + 30, y: Y + 20 };
    window.currentPlayerRoom = 'annex';
    await handleDoorInteraction(annex);
    await tick();
    assert.equal(gateSprite.destroyed, 0, 'the gate\'s sprite survives the ordinary door opening beside it');
    assert.equal(window.rooms.lobby.doorSprites.length, 1);
});

// M1 -------------------------------------------------------------------------------------

function inertWorld() {
    const w = world({ globals: { vest: false, win: false } });
    const lobby = sprite('lobby', 'studio', 'east', BX - 16);
    w.gates.register(lobby, { ...GATE, activeIf: 'globalVars.win' });
    window.rooms.lobby = { doorSprites: [lobby] };
    window.currentPlayerRoom = 'lobby';
    window.player = { x: BX - 40, y: Y };
    return { ...w, lobby, g: [...w.gates.groups.values()][0] };
}

test('M1: an inert click from outside, when the server refuses the room, leaves the gate shut and refuses', async () => {
    const { lobby, g, alerts, events } = inertWorld();
    window.loadRoom = async () => { /* a 403: loadRoom logs it and resolves with no room */ };
    await handleDoorInteraction(lobby);
    await tick();
    assert.equal(g.open, false, 'not opened onto a room that does not exist');
    assert.equal(lobby.body.enable, true);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], 'Access denied');
    assert.equal(events.some(e => e[0] === 'door_gate_exit_opened'), false);
    assert.equal(globalThis.__nsu.length, 1, 'an unlocked room goes through the ordinary unlocked handshake first');
    assert.equal(globalThis.__nsu[0][2], 'unlocked');
});

test('M1: an inert click from outside opens the gate once the room has loaded', async () => {
    const { lobby, g, alerts, events } = inertWorld();
    let order = [];
    window.loadRoom = async (id) => { order.push('load'); window.rooms[id] = { doorSprites: [] }; };
    window.doorGates.exitOpen = ((orig) => (...a) => { order.push('open'); return orig.apply(window.doorGates, a); })(window.doorGates.exitOpen);
    await handleDoorInteraction(lobby);
    await tick();
    assert.deepEqual(order, ['load', 'open'], 'loaded first, opened second');
    assert.equal(g.open, true);
    assert.equal(alerts.length, 0);
    assert.equal(events.some(e => e[0] === 'door_gate_exit_opened'), true);
});

test('M1: an inert click on a gate that is already open still loads the room behind it', async () => {
    const { lobby, g, gates } = inertWorld();
    gates.open(g, Date.now(), 'door_gate_opened');             // held open by an NPC on the outer side
    const loads = [];
    window.loadRoom = async (id) => { loads.push(id); window.rooms[id] = { doorSprites: [] }; };
    await handleDoorInteraction(lobby);
    await tick();
    assert.deepEqual(loads, ['studio']);
});

test('M1: clickOutcome from outside an inert gate opens nothing itself', () => {
    const { gates, g } = inertWorld();
    assert.equal(gates.clickOutcome(g, { playerRoom: 'lobby', now: 1000 }), 'inert_enter');
    assert.equal(g.open, false);
    assert.equal(gates.clickOutcome(g, { playerRoom: 'studio', now: 1000 }), 'exit', 'from inside it still opens at once');
    assert.equal(g.open, true);
});

// m1, m4 ---------------------------------------------------------------------------------

test('m1: the side walk target is clear of both door tiles (the door body footprint)', () => {
    const { gates } = world();
    const hall = sprite('hall', 'store', 'east', BX - 16);
    const store = sprite('store', 'hall', 'west', BX + 16);
    gates.register(hall, GATE); gates.register(store, null);
    const g = [...gates.groups.values()][0];
    gates.open(g, 0);
    window.gameState.globalVariables.vest = true;
    const east = gates.walkThroughTarget(hall, { x: BX - 100, y: Y }, { playerRoom: 'hall', now: 10 });
    assert.ok(east.x > store.x + 16, `east target ${east.x} is past the store's door tile (${store.x - 16}..${store.x + 16})`);
    const west = gates.walkThroughTarget(store, { x: BX + 100, y: Y }, { playerRoom: 'store', now: 10 });
    assert.ok(west.x < hall.x - 16, `west target ${west.x} is past the hall's door tile`);
});

test('m4: guard events carry the doorway centre as well as the registering sprite', () => {
    const { gates } = world();
    const hall = sprite('hall', 'store', 'east', BX - 16);
    gates.register(hall, GATE);
    const g = [...gates.groups.values()][0];
    const info = gates._gateInfo(g);
    assert.equal(info.cx, BX);
    assert.equal(info.cy, Y);
    assert.equal(info.x, BX - 16);
});
