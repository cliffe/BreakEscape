// S8c unit 20: unlock-system.js part one. A cancelled second step opens nothing and says nothing
// of its own; the requirement getters carry secondStep and npcStepOpener; a gated door is retried
// with the npc method. Server answers come from test/fixtures/files/lock_step/answers.json.
// unlock-system.js is imported for real, with its browser-only imports stubbed.
// Run with: bin/test-js test/js/lock-step-unlock-system.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.__unlockedDoors = [];
const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    // As the real unlockDoor, the door's own state is unlocked at once (doors.js props.locked = false)
    './doors.js': dataUrl('export function unlockDoor(door, roomData) { if (door.doorProperties) door.doorProperties.locked = false; globalThis.__unlockedDoors.push([door, roomData]); }'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../utils/remote-host-text.js': dataUrl(readFileSync(join(js, 'utils/remote-host-text.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async (d, o = {}) => { if (o.autoOpen !== false && o.openScreen) o.openScreen(); };'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) {
    assert.ok(src.includes(`'${spec}'`), `unlock-system imports ${spec}`);
    src = src.split(`'${spec}'`).join(`'${url}'`);
}


globalThis.window = {};
const {
    handleUnlock, getLockRequirementsForDoor, getLockRequirementsForItem,
    notifyServerUnlock, requestRfidAccessUnlock, unlockTarget
} = await import(dataUrl(src));

let alerts, events, unlockCalls, nextAnswer, feedback;
function reset({ answer } = {}) {
    alerts = []; events = []; unlockCalls = []; feedback = [];
    globalThis.__unlockedDoors.length = 0;
    nextAnswer = answer;
    for (const k of Object.keys(window)) delete window[k];
    Object.assign(window, {
        inventory: { items: [] },
        gameAlert: (...a) => alerts.push(a),
        eventDispatcher: { emit: (name, data) => events.push([name, data]) },
        breakEscapeConfig: { gameId: 1 },
        lockStep: {
            isCancel: (e) => !!e && e.status === 403 && e.body?.reason === 'second_step_cancelled',
            cancelFeedback: (e) => { feedback.push(e); return true; }
        },
        ApiClient: {
            unlock: async (...a) => {
                unlockCalls.push(a);
                const ans = typeof nextAnswer === 'function' ? nextAnswer(...a) : nextAnswer;
                if (ans instanceof Error) throw ans;
                return ans;
            }
        }
    });
}
const settle = () => new Promise(r => setTimeout(r, 0));
const cancelError = (closedByPlayer = false) => Object.assign(new Error('API Error: 403'),
    { status: 403, body: { success: false, reason: 'second_step_cancelled', closedByPlayer } });
const door = (props) => ({
    layer: 'L',
    doorProperties: { roomId: 'lobby', connectedRoom: 'records_room', direction: 'north', locked: true, lockType: 'password', requires: null, ...props }
});
const object = (data) => ({ scenarioData: { id: 'moira_locker', name: 'Locker', locked: true, lockType: 'password', ...data } });

test('notifyServerUnlock: a cancelled second step answers secondStepCancelled; other refusals are unchanged', async () => {
    reset({ answer: cancelError() });
    const r = await notifyServerUnlock(object({}), 'object', 'key');
    assert.deepEqual(r, { success: false, secondStepCancelled: true });
    const refused = Object.assign(new Error('x'), { status: 422, body: loadAnswer('first_factor_wrong').body });
    reset({ answer: refused });
    assert.equal(await notifyServerUnlock(object({}), 'object', 'key'), undefined);
    const open = loadAnswer('open_object').body;
    reset({ answer: open });
    assert.deepEqual(await notifyServerUnlock(object({}), 'object', 'key'), open);
});

test('notifyServerUnlock: the plain cancel shape counts without window.lockStep', async () => {
    reset({ answer: cancelError(true) });
    delete window.lockStep;
    assert.deepEqual(await notifyServerUnlock(object({}), 'object', 'key'), { success: false, secondStepCancelled: true });
});

test('unlockTarget returns at once on a cancelled answer: nothing opened, no event', () => {
    reset();
    const d = door({});
    unlockTarget(d, 'door', 'L', { success: false, secondStepCancelled: true });
    assert.equal(globalThis.__unlockedDoors.length, 0);
    const o = object({});
    unlockTarget(o, 'object', 'L', { success: false, secondStepCancelled: true });
    assert.equal(o.scenarioData.locked, true);
    assert.deepEqual(events, []);
});

test('requestRfidAccessUnlock: a cancel is second_step_cancelled, never uid_only or denied', async () => {
    reset({ answer: cancelError() });
    const r = await requestRfidAccessUnlock(object({}), 'object', ['A']);
    assert.equal(r.outcome, 'second_step_cancelled');
    const open = loadAnswer('open_object').body;
    reset({ answer: open });
    assert.equal((await requestRfidAccessUnlock(object({}), 'object', ['A'])).outcome, 'unlocked');
    reset({ answer: Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'uid_only' } }) });
    assert.equal((await requestRfidAccessUnlock(object({}), 'object', ['A'])).outcome, 'uid_only');
});

test('the requirement getters copy secondStep and npcStepOpener', () => {
    const gate = loadAnswer('gate_door_npc').body;
    const step = { kind: 'push', owner: gate.npcId };
    const req = getLockRequirementsForDoor(door({ secondStep: step, npcStepOpener: gate.opener }));
    assert.deepEqual(req.secondStep, step);
    assert.equal(req.npcStepOpener, gate.opener);
    const plain = getLockRequirementsForDoor(door({}));
    assert.equal(plain.secondStep, null);
    assert.equal(plain.npcStepOpener, null);
    assert.deepEqual(getLockRequirementsForItem(object({ secondStep: step })).secondStep, step);
    assert.equal(getLockRequirementsForItem(object({})).secondStep, null);
});

test('a gated door with an opener is retried with the npc method, and opens on success', async () => {
    const gate = loadAnswer('gate_door_npc').body;
    reset({ answer: loadAnswer('open_door').body });
    const d = door({ secondStep: { kind: 'push', owner: gate.npcId }, npcStepOpener: gate.opener });
    handleUnlock(d, 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0], ['door', gate.targetId, gate.opener, 'npc', {}, { fromDoor: true }]);
    assert.equal(globalThis.__unlockedDoors.length, 1);
    assert.deepEqual(events.find(e => e[0] === 'door_unlocked_by_npc'),
        ['door_unlocked_by_npc', { roomId: gate.targetId, npcId: gate.opener, source: 'npc', retry: true }]);
    assert.deepEqual(alerts, []);
});

test('the door retry: a cancel gives lockStep feedback only', async () => {
    reset({ answer: cancelError() });
    handleUnlock(door({ secondStep: { kind: 'push', owner: 'moira' }, npcStepOpener: 'moira' }), 'door');
    await settle();
    assert.equal(feedback.length, 1);
    assert.deepEqual(alerts, []);
    assert.equal(globalThis.__unlockedDoors.length, 0);
    assert.deepEqual(events.filter(e => e[0] === 'door_unlocked_by_npc' || e[0] === 'door_unlocked'), []);
});

test('the door retry: any other error shows the access alert', async () => {
    reset({ answer: Object.assign(new Error('x'), { status: 500, body: {} }) });
    handleUnlock(door({ secondStep: { kind: 'push', owner: 'moira' }, npcStepOpener: 'moira' }), 'door');
    await settle();
    assert.equal(alerts.length, 1);
    assert.equal(feedback.length, 0);
    assert.equal(globalThis.__unlockedDoors.length, 0);
});

test('a gated door with no opener, or an ungated door, takes the lock-type branch (no npc post)', async () => {
    reset({ answer: loadAnswer('open_door').body });
    handleUnlock(door({ secondStep: { kind: 'push', owner: 'moira' }, lockType: 'nothing_known' }), 'door');
    handleUnlock(door({ npcStepOpener: 'moira', lockType: 'nothing_known' }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
});

test('E1 R2 m3: handleUnlock with a handshake answers from it, sends no request, and plays no second sound', async () => {
    reset({ answer: loadAnswer('open_door').body });
    const d = door({ locked: false, lockType: undefined });
    handleUnlock(d, 'door', { handshake: { response: { success: true, roomData: { id: 'records_room' } } } });
    await settle();
    assert.equal(unlockCalls.length, 0, 'no unlock request: the pre-load already sent it');
    assert.equal(globalThis.__unlockedDoors.length, 1, 'the door opens from the handshake response');
    // a refused handshake says so, and opens nothing
    reset();
    handleUnlock(door({ locked: false }), 'door', { handshake: { response: null } });
    await settle();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], 'Access denied');
    assert.equal(globalThis.__unlockedDoors.length, 0);
});
