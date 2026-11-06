// F18: a flag reward's unlock_door (applyActions) opens the door sprites to that
// room straight away, as NPCGameBridge.unlockDoor does, instead of leaving the door
// asking for its lock until a reload. Run with: node test/js/flag-reward-door-sprites.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const emitted = [];
const door = (connectedRoom) => ({ doorProperties: { connectedRoom, locked: true } });
const toArchive = door('archive');
const toVault = door('vault');
globalThis.window = {
    eventDispatcher: { emit: (type, data) => emitted.push({ type, data }) },
    gameState: { globalVariables: {}, unlockedRooms: ['lobby'] },
    gameScenario: { rooms: { archive: { locked: true }, vault: { locked: true } } },
    rooms: { lobby: { doorSprites: [toArchive, toVault] }, archive: { locked: true } }
};

const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`);
const { applyActions } = await import(dataUrl(actionsSrc));

const quiet = (fn) => { const log = console.log; console.log = () => {}; try { fn(); } finally { console.log = log; } };

test('a client-only unlock_door (not a flag reward) leaves the door sprites alone', () => {
    quiet(() => applyActions([{ type: 'unlock_door', room_id: 'archive' }], { source: 'object_interact' }));
    assert.equal(toArchive.doorProperties.locked, true);
    assert.equal(window.gameScenario.rooms.archive.locked, true);
});

test('unlock_door opens only the doors to the named room, and still emits door_unlocked', () => {
    quiet(() => applyActions([{ type: 'unlock_door', room_id: 'archive' }], { source: 'flag_reward' }));
    assert.equal(toArchive.doorProperties.locked, false);
    assert.equal(toVault.doorProperties.locked, true);
    assert.equal(window.gameScenario.rooms.archive.locked, false);
    assert.equal(window.gameScenario.rooms.vault.locked, true);
    assert.equal(window.rooms.archive.locked, false);
    assert.ok(window.gameState.unlockedRooms.includes('archive'));
    assert.equal(emitted.find(e => e.type === 'door_unlocked')?.data.connectedRoom, 'archive');
});
