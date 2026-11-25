// S8c unit 25: unlock-system.js part two. On a lock with a second step the starters and readers
// hold their success wording back; the callers here raise it once the final /unlock answer says
// success. A cancelled second step shows nothing but the cancel rule. Ungated locks are unchanged.
// Server answers come from test/fixtures/files/lock_step/answers.json.
// Run with: bin/test-js test/js/lock-step-late-success.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.__cb = {};
globalThis.__bleEffects = [];
const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor(door) { if (door.doorProperties) door.doorProperties.locked = false; }'),
    // The starters keep the callback they are given, so a test can complete the minigame by hand
    './minigame-starters.js': dataUrl(`
        export function startLockpickingMinigame(l, g, d, cb) { globalThis.__cb.lockpick = cb; }
        export function startKeySelectionMinigame(l, t, k, r, cb) { globalThis.__cb.key = cb; }
        export function startPinMinigame() {} export function startPasswordMinigame() {}
        export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {}
        export function startInfusionPumpMinigame() {}`),
    './ui-sounds.js': dataUrl('export function playUISound(n) { (globalThis.__sounds = globalThis.__sounds || []).push(n); }'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../utils/remote-host-text.js': dataUrl(readFileSync(join(js, 'utils/remote-host-text.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader(l, t, r, onAccepted) { globalThis.__cb.biometric = onAccepted; }'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects(sd) { globalThis.__bleEffects.push(sd); }'),
    '../utils/lock-scope-refusal.js': dataUrl(readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async () => {};'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) {
    assert.ok(src.includes(`'${spec}'`), `unlock-system imports ${spec}`);
    src = src.split(`'${spec}'`).join(`'${url}'`);
}

globalThis.window = {};
const { handleUnlock } = await import(dataUrl(src));

let alerts, events, unlockCalls, nextAnswer, expected, rfidParams;
function reset({ answer, items = [], gameScenario } = {}) {
    alerts = []; events = []; unlockCalls = []; expected = []; rfidParams = null;
    globalThis.__cb = {}; globalThis.__sounds = []; globalThis.__bleEffects.length = 0;
    nextAnswer = answer;
    for (const k of Object.keys(window)) delete window[k];
    Object.assign(window, {
        inventory: { items },
        gameAlert: (...a) => alerts.push(a),
        expectContainerAfterUnlock: (...a) => expected.push(a),
        eventDispatcher: { emit: (name, data) => events.push([name, data]) },
        breakEscapeConfig: { gameId: 1 },
        lockRef: (d) => d.id || d.name,
        gameScenario,
        startRFIDMinigame: (l, t, p) => { rfidParams = p; },
        startBleScannerMinigame: (l, p) => { globalThis.__cb.ble = p.onComplete; },
        lockStep: {
            isCancel: (e) => !!e && e.status === 403 && e.body?.reason === 'second_step_cancelled',
            cancelFeedback: () => true
        },
        ApiClient: {
            unlock: async (...a) => {
                unlockCalls.push(a);
                if (nextAnswer instanceof Error) throw nextAnswer;
                return nextAnswer;
            }
        }
    });
}
const settle = () => new Promise(r => setTimeout(r, 150));
const cancelError = () => Object.assign(new Error('API Error: 403'),
    { status: 403, body: { success: false, reason: 'second_step_cancelled', closedByPlayer: false } });
const STEP = { kind: 'push', owner: 'priya_safe' };
const object = (data) => ({ layer: 'L', scenarioData: { id: 'moira_locker', name: 'Locker', locked: true, ...data } });
const success = () => loadAnswer('open_object').body;
const successTexts = () => alerts.filter(a => a[1] === 'success').map(a => a[0]);
const errorAlerts = () => alerts.filter(a => a[1] === 'error');
const opened = (o) => o.scenarioData.locked === false;

const key = { scenarioData: { type: 'key', id: 'k1', name: 'Locker key' } };
const pick = { scenarioData: { type: 'lockpick', name: 'Picks' } };
const scanner = { scenarioData: { type: 'ble_scanner', name: 'Scanner' } };
const keycard = { scenarioData: { type: 'keycard', card_id: 'card_a', name: 'Card A' } };

// ---- key and lockpick ------------------------------------------------------------------
test('key (gated): the toast and the container expectation come after a success, before the unlock', async () => {
    reset({ answer: success(), items: [key] });
    const o = object({ lockType: 'key', requires: 'k1', secondStep: STEP });
    handleUnlock(o, 'object');
    assert.ok(globalThis.__cb.key, 'key selection started');
    globalThis.__cb.key(o, 'object', 'L', 'key');
    await settle();
    assert.deepEqual(successTexts(), ['Successfully unlocked with the correct key!']);
    assert.equal(expected.length, 1);
    assert.equal(unlockCalls[0][3], 'key');
    assert.ok(opened(o));
});

test('key (gated): a cancelled second step shows nothing and opens nothing', async () => {
    reset({ answer: cancelError(), items: [key] });
    const o = object({ lockType: 'key', requires: 'k1', secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.key(o, 'object', 'L', 'key');
    await settle();
    assert.deepEqual(alerts, []);
    assert.deepEqual(expected, []);
    assert.ok(!opened(o));
});

test('key (ungated): the callback raises no toast of its own', async () => {
    reset({ answer: success(), items: [key] });
    const o = object({ lockType: 'key', requires: 'k1' });
    handleUnlock(o, 'object');
    globalThis.__cb.key(o, 'object', 'L', 'key');
    await settle();
    assert.deepEqual(alerts, []);
    assert.deepEqual(expected, []);
    assert.ok(opened(o));
});

test('lockpick (gated): a pick success raises its toast after the answer; a cancel shows nothing', async () => {
    reset({ answer: success(), items: [pick] });
    let o = object({ lockType: 'key', requires: 'k1', secondStep: STEP });
    handleUnlock(o, 'object');
    await globalThis.__cb.lockpick(true, { method: 'lockpick' });
    await settle();
    assert.deepEqual(successTexts(), ['Successfully picked the lock!']);
    assert.equal(expected.length, 1);
    assert.ok(opened(o));

    reset({ answer: success(), items: [pick] });
    o = object({ lockType: 'key', requires: 'k1', secondStep: STEP });
    handleUnlock(o, 'object');
    await globalThis.__cb.lockpick(true, { method: 'key' });
    await settle();
    assert.deepEqual(successTexts(), ['Successfully unlocked with the correct key!']);

    reset({ answer: cancelError(), items: [pick] });
    o = object({ lockType: 'key', requires: 'k1', secondStep: STEP });
    handleUnlock(o, 'object');
    await globalThis.__cb.lockpick(true, { method: 'lockpick' });
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(!opened(o));
});

test('lockpick (ungated): no toast of ours', async () => {
    reset({ answer: success(), items: [pick] });
    const o = object({ lockType: 'key', requires: 'k1' });
    handleUnlock(o, 'object');
    await globalThis.__cb.lockpick(true, { method: 'lockpick' });
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(opened(o));
});

// ---- biometric -------------------------------------------------------------------------
test('biometric: the unlocked toast only on a gated success; none on a cancel; ungated unchanged', async () => {
    reset({ answer: success() });
    let o = object({ lockType: 'biometric', requires: 'priya', secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.biometric();
    await settle();
    assert.deepEqual(successTexts(), ['You unlocked the object.']);
    assert.ok(opened(o));

    reset({ answer: cancelError() });
    o = object({ lockType: 'biometric', requires: 'priya', secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.biometric();
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(!opened(o));

    reset({ answer: success() });
    o = object({ lockType: 'biometric', requires: 'priya' });
    handleUnlock(o, 'object');
    globalThis.__cb.biometric();
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(opened(o));
});

// ---- bluetooth -------------------------------------------------------------------------
const btWorld = (extra = {}) => ({
    items: [{ scenarioData: { type: 'bluetooth_scanner', name: 'BT' } }], ...extra
});
function bluetoothObject(extra) {
    return object({ lockType: 'bluetooth', requires: 'AA:BB', ...extra });
}
test('bluetooth (gated): the alert waits for success; a cancel shows none', async () => {
    reset({ answer: success(), ...btWorld() });
    window.gameState = { bluetoothDevices: [{ mac: 'AA:BB', name: 'Tag', signalStrength: -40 }] };
    let o = bluetoothObject({ secondStep: STEP });
    handleUnlock(o, 'object');
    assert.deepEqual(alerts, [], 'nothing before the answer');
    await settle();
    assert.equal(successTexts().length, 1);
    assert.ok(opened(o));

    reset({ answer: cancelError(), ...btWorld() });
    window.gameState = { bluetoothDevices: [{ mac: 'AA:BB', name: 'Tag', signalStrength: -40 }] };
    o = bluetoothObject({ secondStep: STEP });
    handleUnlock(o, 'object');
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(!opened(o));
});

test('bluetooth (ungated): the alert is raised at once, as before', async () => {
    reset({ answer: success(), ...btWorld() });
    window.gameState = { bluetoothDevices: [{ mac: 'AA:BB', name: 'Tag', signalStrength: -40 }] };
    const o = bluetoothObject();
    handleUnlock(o, 'object');
    assert.equal(successTexts().length, 1, 'before the answer');
    await settle();
    assert.ok(opened(o));
});

// ---- ble -------------------------------------------------------------------------------
test('ble (gated): applyBlePairEffects runs once on the final success, with the object data', async () => {
    reset({ answer: success(), items: [scanner] });
    const o = object({ lockType: 'ble', requires: 'dev', completesTask: 't1', onPairSetGlobal: { g: true }, secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.ble(true);
    await settle();
    assert.equal(globalThis.__bleEffects.length, 1);
    assert.equal(globalThis.__bleEffects[0], o.scenarioData);
    assert.ok(opened(o));
});

test('ble (gated): a cancel runs no effects and opens nothing; a failed pair runs none', async () => {
    reset({ answer: cancelError(), items: [scanner] });
    const o = object({ lockType: 'ble', requires: 'dev', completesTask: 't1', secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.ble(true);
    await settle();
    assert.deepEqual(globalThis.__bleEffects, []);
    assert.deepEqual(alerts, []);
    assert.ok(!opened(o));
    globalThis.__cb.ble(false);
    await settle();
    assert.deepEqual(globalThis.__bleEffects, []);
});

test('ble (gated): a refusal that is not a cancel runs no effects', async () => {
    reset({ answer: Object.assign(new Error('x'), { status: 422, body: loadAnswer('first_factor_wrong').body }), items: [scanner] });
    const o = object({ lockType: 'ble', requires: 'dev', completesTask: 't1', secondStep: STEP });
    handleUnlock(o, 'object');
    globalThis.__cb.ble(true);
    await settle();
    assert.deepEqual(globalThis.__bleEffects, []);
});

test('ble (ungated): unchanged, the minigame ran the effects when it paired, so none here', async () => {
    reset({ answer: success(), items: [scanner] });
    const o = object({ lockType: 'ble', requires: 'dev', completesTask: 't1' });
    handleUnlock(o, 'object');
    globalThis.__cb.ble(true);
    await settle();
    assert.deepEqual(globalThis.__bleEffects, []);
    assert.ok(opened(o));
});

// ---- rfid ------------------------------------------------------------------------------
test('rfid direct card (gated): sound and "Access Granted" only on success; a cancel is silent', async () => {
    reset({ answer: success(), items: [keycard] });
    let o = object({ lockType: 'rfid', requires: 'card_a', secondStep: STEP });
    handleUnlock(o, 'object');
    await settle();
    assert.deepEqual(successTexts(), ['Door opened with Card A']);
    assert.ok(globalThis.__sounds.includes('door_release'));
    assert.ok(opened(o));

    reset({ answer: cancelError(), items: [keycard] });
    o = object({ lockType: 'rfid', requires: 'card_a', secondStep: STEP });
    handleUnlock(o, 'object');
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(!globalThis.__sounds.includes('door_release'));
    assert.ok(!opened(o));
});

test('rfid direct card (ungated): sound and alert as before', async () => {
    reset({ answer: success(), items: [keycard] });
    const o = object({ lockType: 'rfid', requires: 'card_a' });
    handleUnlock(o, 'object');
    await settle();
    assert.deepEqual(successTexts(), ['Door opened with Card A']);
    assert.ok(globalThis.__sounds.includes('door_release'));
});

const cloner = { scenarioData: { type: 'rfid_cloner', name: 'Cloner', saved_cards: [{ card_id: 'card_a', name: 'Copy A' }] } };
test('rfid clone (gated): the copier result with no server answer notifies, then raises sound and alert on success only', async () => {
    reset({ answer: success(), items: [cloner] });
    let o = object({ lockType: 'rfid', requires: 'card_a', secondStep: STEP });
    handleUnlock(o, 'object');
    assert.ok(rfidParams, 'the copier opened');
    await rfidParams.onComplete(true, { cardName: 'Copy A', emulated: true });
    await settle();
    assert.equal(successTexts().length, 1);
    assert.ok(globalThis.__sounds.includes('door_release'));
    assert.ok(opened(o));

    reset({ answer: cancelError(), items: [cloner] });
    o = object({ lockType: 'rfid', requires: 'card_a', secondStep: STEP });
    handleUnlock(o, 'object');
    await rfidParams.onComplete(true, { cardName: 'Copy A', emulated: true });
    await settle();
    assert.deepEqual(alerts, []);
    assert.ok(!globalThis.__sounds.includes('door_release'));
    assert.ok(!opened(o));
});

test('rfid clone (ungated): unchanged', async () => {
    reset({ answer: success(), items: [cloner] });
    const o = object({ lockType: 'rfid', requires: 'card_a' });
    handleUnlock(o, 'object');
    await rfidParams.onComplete(true, { cardName: 'Copy A', emulated: true });
    await settle();
    assert.equal(successTexts().length, 1);
    assert.ok(globalThis.__sounds.includes('door_release'));
});

// ---- "unlocked" callers (item c) -------------------------------------------------------
test('the "unlocked" callers: a cancel is silent, any other refusal still shows Access denied', async () => {
    // Client sees the lock open: verified with the server
    reset({ answer: cancelError() });
    let o = object({ lockType: 'password', locked: false });
    handleUnlock(o, 'object');
    await settle();
    assert.deepEqual(alerts, []);

    reset({ answer: Object.assign(new Error('x'), { status: 422, body: loadAnswer('first_factor_wrong').body }) });
    o = object({ lockType: 'password', locked: false });
    handleUnlock(o, 'object');
    await settle();
    assert.equal(errorAlerts().length, 1);
    assert.equal(errorAlerts()[0][0], 'Access denied');
});
