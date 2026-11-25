// Opt-in lockoutSeconds on a password DOOR: a room definition's value is copied into
// doorProperties by the real doors.js, and the real unlock-system.js hands it to the
// password pad (m01 blind R2 m1). Both modules are imported for real with browser-only
// imports stubbed.
// Run with: node --test test/js/door-lockout-seconds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'error', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (p) => readFileSync(join(js, p), 'utf8');
const stubAll = (src, stubs) => {
    for (const [spec, url] of Object.entries(stubs)) {
        assert.ok(src.includes(`'${spec}'`), `imports ${spec}`);
        src = src.split(`'${spec}'`).join(`'${url}'`);
    }
    return src;
};

globalThis.window = {};
globalThis.__pwStarts = [];

// Real unlock-system.js
const unlockSrc = stubAll(read('systems/unlock-system.js'), {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor() {}'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame(...a) { globalThis.__pwStarts.push(a); } export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(read('utils/locked-hint.js')),
    '../utils/remote-host-text.js': dataUrl(read('utils/remote-host-text.js')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(read('utils/lock-scope-refusal.js')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async (d, o = {}) => { if (o.autoOpen !== false && o.openScreen) o.openScreen(); };'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
});
const { handleUnlock } = await import(dataUrl(unlockSrc));

// Real doors.js (its unlock-system import points at the real one above)
const doorsSrc = stubAll(read('systems/doors.js'), {
    '../utils/constants.js': dataUrl('export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 160, GRID_UNIT_HEIGHT_PX = 128, DOOR_INTERACTION_RANGE = 64;'),
    './unlock-system.js': dataUrl(unlockSrc),
    '../utils/locked-hint.js': dataUrl('export const appendLockedHint = (b) => b, lockedHintDuration = (l, ms) => ms, doorRefusalTitle = (l, t) => t;'),
    './interaction-repeat.js': dataUrl('export const isRepeatInteraction = () => false;'),
    './room-ready.js': dataUrl('export const waitForRoomReady = () => Promise.resolve();')
});
const { initializeDoors, createDoorSpritesForRoom } = await import(dataUrl(doorsSrc));

// A minimal Phaser stand-in: every sprite is a plain object with the setters doors.js calls.
const fake = () => {
    const o = { body: null };
    for (const m of ['setFrame', 'setFlipX', 'setOrigin', 'setDepth', 'setAlpha', 'setVisible', 'setPosition', 'setInteractive']) o[m] = () => o;
    return o;
};
const body = () => ({ setSize() {}, setOffset() {}, setImmovable() {} });
initializeDoors({
    add: { sprite: () => fake(), zone: () => fake(), graphics: () => fake() },
    physics: { add: { existing: (s) => { s.body = body(); }, collider() {} } }
}, {});

const dim = { widthPx: 320, heightPx: 288, stackingHeightPx: 224, widthTiles: 10, heightTiles: 9 };
function buildDoor(vault, extraDoorDef) {
    window.gameScenario = { rooms: {
        lobby: { connections: { north: 'vault' }, ...(extraDoorDef ? { doors: [extraDoorDef] } : {}) },
        vault: { connections: { south: 'lobby' }, locked: true, lockType: 'password', ...vault }
    } };
    window.roomDimensions = { lobby: dim, vault: dim };
    window.roomPositions = { lobby: { x: 0, y: 0 }, vault: { x: 0, y: -288 } };
    window.eventDispatcher = { emit() {} };
    window.gameAlert = () => {};
    const sprites = createDoorSpritesForRoom('lobby', window.roomPositions.lobby);
    assert.equal(sprites.length, 1);
    return sprites[0];
}

test('a room lockoutSeconds reaches doorProperties and the password pad options', () => {
    const doorSprite = buildDoor({ maxAttempts: 3, lockoutSeconds: 45 });
    assert.equal(doorSprite.doorProperties.lockoutSeconds, 45);
    globalThis.__pwStarts.length = 0;
    handleUnlock(doorSprite, 'door');
    assert.equal(globalThis.__pwStarts.length, 1, 'the password pad opened');
    const options = globalThis.__pwStarts[0][4];
    assert.equal(options.lockoutSeconds, 45);
    assert.equal(options.maxAttempts, 3);
});

test('no lockoutSeconds on the room means no lockout reaches the pad', () => {
    const plain = buildDoor({ maxAttempts: 3 });
    assert.equal(plain.doorProperties.lockoutSeconds, null);
    globalThis.__pwStarts.length = 0;
    handleUnlock(plain, 'door');
    assert.equal(globalThis.__pwStarts[0][4].lockoutSeconds, 0);
});
