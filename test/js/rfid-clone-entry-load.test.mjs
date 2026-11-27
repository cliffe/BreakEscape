// Clone-as-entry at a gate door must behave like an ordinary RFID door: the unlock
// request goes to the server, the server validates and unlocks the room, the client
// loads the room, and only then does the gate open and hold. This drives doors.js
// handleDoorInteraction over a gate door with its imports stubbed, asserting that
// sequence (notifyServerUnlock -> roomDataCache/loadRoom -> doorGates.playerOpen) and
// that a server refusal or a missing credential opens nothing.
// Run with: node test/js/rfid-clone-entry-load.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'warn', 'debug', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
// Controllable stub state, read/written by the stubbed unlock-system module below.
globalThis.__calls = { notify: [], holds: [], handleUnlock: [] };
globalThis.__serverResponse = { success: true, roomData: { id: 'secure_area' } };
globalThis.__hasCredential = true;

const stubs = {
    '../utils/constants.js': dataUrl(
        'export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 320, GRID_UNIT_HEIGHT_PX = 288, DOOR_INTERACTION_RANGE = 64;'),
    './unlock-system.js': dataUrl(`
        export async function notifyServerUnlock(lockable, type, method) {
            globalThis.__calls.notify.push({ type, method, target: lockable?.doorProperties?.connectedRoom });
            return globalThis.__serverResponse;
        }
        export function playerHoldsRfidCredentialFor(requires) {
            globalThis.__calls.holds.push(requires);
            return globalThis.__hasCredential;
        }
        export function handleUnlock(...a) { globalThis.__calls.handleUnlock.push(a); }
    `),
    // The real module (no imports of its own): the refusal titles come from it
    '../utils/locked-hint.js': pathToFileURL(join(js, 'utils/locked-hint.js')).href,
    './interaction-repeat.js': dataUrl('export function isRepeatInteraction() { return false; }'),
    './room-ready.js': dataUrl('export async function waitForRoomReady() { return { ready: true }; }')
};

let src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);
const { handleDoorInteraction } = await import(dataUrl(src));

// Phaser.Math.Distance.Between, used by handleDoorInteraction before the gate branch.
globalThis.Phaser = { Math: { Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) } } };

function setup({ roomLoaded = false } = {}) {
    globalThis.__calls = { notify: [], holds: [], handleUnlock: [] };
    const playerOpen = [];
    const alerts = [];
    window.player = { x: 100, y: 100 };
    window.rooms = roomLoaded ? { secure_area: { loaded: true } } : {};
    window.roomDataCache = new Map();
    window.loadRoom = async (roomId) => { window.__loaded = roomId; window.rooms[roomId] = { loaded: true }; };
    window.__loaded = null;
    window.doorGates = {
        groups: new Map(),
        groupAtPosition: () => null,
        playerOpen: (roomId) => { playerOpen.push(roomId); return true; }
    };
    window.game = { sound: { get: () => null, add: () => ({ play() {} }) } };
    window.gameAlert = (msg, type, title, ms) => alerts.push({ msg, type, title, ms });
    window.eventDispatcher = { emit() {} };
    const doorSprite = {
        x: 100, y: 100,
        doorProperties: {
            roomId: 'open_plan', connectedRoom: 'secure_area', direction: 'north',
            worldX: 100, worldY: 100, requires: 'cm_records_badge',
            gate: { openFor: ['len'], holdMs: 2500 }
        }
    };
    return { doorSprite, playerOpen, alerts };
}

test('valid clone: server unlock, room load, then gate playerOpen (in order)', async () => {
    globalThis.__hasCredential = true;
    globalThis.__serverResponse = { success: true, roomData: { id: 'secure_area' } };
    const { doorSprite, playerOpen, alerts } = setup({ roomLoaded: false });

    await handleDoorInteraction(doorSprite);

    assert.deepEqual(globalThis.__calls.notify, [{ type: 'door', method: 'rfid', target: 'secure_area' }],
        'the existing rfid unlock request goes to the server');
    assert.equal(window.roomDataCache.get('secure_area')?.id, 'secure_area',
        'the server roomData is cached for loadRoom');
    assert.equal(window.__loaded, 'secure_area', 'the client loads the room');
    assert.deepEqual(playerOpen, ['secure_area'], 'the gate opens for the player after the room loads');
    assert.ok(alerts.some(a => a.type === 'success'), 'access granted toast shown');
    assert.equal(globalThis.__calls.handleUnlock.length, 0, 'the plain unlock path is not used for a gate');
});

test('valid clone, room already loaded: no second load, gate still opens', async () => {
    globalThis.__hasCredential = true;
    globalThis.__serverResponse = { success: true, roomData: { id: 'secure_area' } };
    const { doorSprite, playerOpen } = setup({ roomLoaded: true });

    await handleDoorInteraction(doorSprite);

    assert.equal(window.__loaded, null, 'an already-loaded room is not reloaded');
    assert.equal(globalThis.__calls.notify.length, 1, 'the server is still told');
    assert.deepEqual(playerOpen, ['secure_area'], 'the gate still opens');
});

test('server refuses: nothing loads and the gate stays shut', async () => {
    globalThis.__hasCredential = true;
    globalThis.__serverResponse = { success: false };
    const { doorSprite, playerOpen, alerts } = setup({ roomLoaded: false });

    await handleDoorInteraction(doorSprite);

    assert.equal(globalThis.__calls.notify.length, 1, 'the server was asked');
    assert.equal(window.__loaded, null, 'no room loads on a refusal');
    assert.deepEqual(playerOpen, [], 'the gate does not open on a refusal');
    assert.ok(alerts.some(a => a.type === 'error'), 'access denied toast shown');
});

test('server refuses: the toast is titled with the door sign (the riser refusal)', async () => {
    globalThis.__hasCredential = true;
    globalThis.__serverResponse = { success: false };
    const { doorSprite, alerts } = setup({ roomLoaded: false });
    doorSprite.doorProperties.door_sign = 'Server Riser: Authorised Staff Only';

    await handleDoorInteraction(doorSprite);

    const err = alerts.find(a => a.type === 'error');
    assert.equal(err?.msg, 'Access denied');
    assert.equal(err?.title, 'Server Riser', 'the sign titles the refusal, not "Door"');
    assert.ok(err?.ms >= 5000, 'the refusal stays at least 5 s');
});

test('no credential: the gate is denied, server untouched', async () => {
    globalThis.__hasCredential = false;
    globalThis.__serverResponse = { success: true, roomData: { id: 'secure_area' } };
    const { doorSprite, playerOpen, alerts } = setup({ roomLoaded: false });

    await handleDoorInteraction(doorSprite);

    assert.equal(globalThis.__calls.notify.length, 0, 'no clone means no server unlock request');
    assert.equal(window.__loaded, null, 'no room loads without a credential');
    assert.deepEqual(playerOpen, [], 'the gate does not open without a credential');
    assert.ok(alerts.some(a => a.type === 'error'), 'access denied toast shown');
});
