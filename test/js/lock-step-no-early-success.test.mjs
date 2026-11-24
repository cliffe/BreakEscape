// S8c unit 21: on a lock that carries `secondStep`, nothing says "opened", plays a release sound or
// completes a task before the final server answer. An ungated lock behaves as it always did.
// Server answers come from the shared fixture (test/js/helpers/lock-step-answers.mjs).
// Run with: bin/test-js test/js/lock-step-no-early-success.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

// A stub browser: enough for the minigame modules to import.
const el = () => ({ style: {}, classList: { add() {}, remove() {}, contains: () => false }, appendChild() {}, append() {},
    setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelector: () => null,
    querySelectorAll: () => [], getContext: () => null });
globalThis.window = globalThis;
globalThis.document = { createElement: el, createElementNS: el, querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null, addEventListener() {}, removeEventListener() {}, head: el(), body: el(),
    createTextNode: (t) => ({ textContent: t }), documentElement: el() };

const imp = (rel) => import(pathToFileURL(join(js, rel)).href);
const { RFIDMinigame, startRFIDMinigame } = await imp('minigames/rfid/rfid-minigame.js');
const { FingerprintReaderMinigame } = await imp('minigames/biometrics/fingerprint-reader-minigame.js');
const { BleScannerMinigame, applyBlePairEffects } = await imp('minigames/ble-scanner/ble-scanner-minigame.js');

// The owner on a gated lock is the one the gate answer names.
const gate = loadAnswer('gate_push').body;
const STEP = { kind: gate.kind, owner: gate.npcId };

function reset() {
    const log = { alerts: [], sounds: [], panels: 0, containers: 0, events: [] };
    window.gameAlert = (...a) => log.alerts.push(a);
    window.playUISound = (n) => log.sounds.push(n);
    window.expectPanelWithin = () => { log.panels++; };
    window.expectContainerAfterUnlock = () => { log.containers++; };
    window.eventDispatcher = { emit: (n, d) => log.events.push([n, d]) };
    window.gameState = { globalVariables: {} };
    window.gameScenario = { rooms: {} };
    window.npcConversationStateManager = null;
    return log;
}

// Lift a callback out of the source, as lockpick-close-toast.test.mjs does (the starters need Phaser).
const startersSrc = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
function arrowAt(src, marker, anchor) {
    const start = src.indexOf(marker, src.indexOf(anchor));
    assert.ok(start >= 0, `marker not found: ${marker}`);
    const open = src.indexOf('{', src.indexOf('=>', start));
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1).replace(/^onComplete: /, '');
    }
    throw new Error('unbalanced');
}
const lockpickSrc = arrowAt(startersSrc, 'onComplete: (success, result) =>', "startMinigame('lockpicking'");
const keySrc = arrowAt(startersSrc, 'onComplete: (success, result) =>', 'export function startKeySelectionMinigame');
function lift(src, lockable, type, callback, unlockTarget) {
    return new Function('lockable', 'type', 'callback', 'unlockTargetCallback', 'window',
        `return (${src});`)(lockable, type, callback, unlockTarget, window);
}

const objLock = (gated) => ({ scenarioData: { id: 'safe_1', name: 'Safe', ...(gated ? { secondStep: STEP } : {}) } });

test('lockpick onComplete: gated skips the toast and the container wait, ungated is as before', () => {
    for (const gated of [true, false]) {
        const log = reset();
        const calls = [];
        lift(lockpickSrc, objLock(gated), 'item', (...a) => calls.push(a))(true, { method: 'lockpick' });
        assert.equal(log.alerts.length, gated ? 0 : 1, `alerts gated=${gated}`);
        assert.equal(log.containers, gated ? 0 : 1, `container wait gated=${gated}`);
        assert.deepEqual(calls, [[true, { method: 'lockpick' }]], 'the result still reaches the caller');
    }
});

test('key selection onComplete: gated skips the toast and the container wait, ungated is as before', async () => {
    for (const gated of [true, false]) {
        const log = reset();
        const calls = [];
        const fn = lift(keySrc, objLock(gated), 'item', null, (...a) => calls.push(a));
        window.MinigameFramework = { currentMinigame: { keyMode: true } };
        fn(true, {});
        await new Promise(r => setTimeout(r, 150));
        assert.equal(log.alerts.length, gated ? 0 : 1, `alerts gated=${gated}`);
        assert.equal(log.containers, gated ? 0 : 1, `container wait gated=${gated}`);
        assert.equal(calls.length, 1, 'the unlock still goes to the caller');
        assert.equal(calls[0][3], 'key');
    }
});

test('a door is gated by the room it leads to', () => {
    const log = reset();
    window.gameScenario = { rooms: { vault: { secondStep: STEP } } };
    const door = { doorProperties: { connectedRoom: 'vault' } };
    lift(lockpickSrc, door, 'door', () => {})(true, { method: 'key' });
    assert.equal(log.alerts.length, 0);
    const open = { doorProperties: { connectedRoom: 'lobby' } };
    lift(lockpickSrc, open, 'door', () => {})(true, { method: 'key' });
    assert.equal(log.alerts.length, 1);
});

// Fingerprint reader
function reader(gated, lockType = 'item') {
    const r = Object.create(FingerprintReaderMinigame.prototype);
    const sample = { id: 's1', owner: 'dana', ownerName: 'Dana', quality: 0.99, type: 'fingerprint' };
    Object.assign(r, {
        lockable: lockType === 'door'
            ? { doorProperties: { connectedRoom: 'vault' } }
            : objLock(gated),
        lockType, requires: 'dana', threshold: 0.5, samples: [sample], signText: 'Safe', cards: [],
        results: [], completed: [],
    });
    r.setResult = (m, res) => r.results.push([m, res]);
    r.setLed = () => {};
    r.after = (ms, fn) => fn();
    r.complete = (ok) => r.completed.push(ok);
    return { r, sample };
}

test('fingerprint reader: gated plays confirm, says "Print accepted." and waits for nothing', () => {
    const log = reset();
    const { r, sample } = reader(true);
    r.finishScan(sample);
    assert.deepEqual(log.sounds, ['confirm']);
    assert.equal(r.results.at(-1)[0], 'Print accepted.');
    assert.equal(log.alerts.length, 0);
    assert.equal(log.panels, 0, 'neither expectPanelWithin call');
    assert.deepEqual(r.completed, [true]);
});

test('fingerprint reader: ungated is as before (toast, wording, both panel waits)', () => {
    const log = reset();
    const { r, sample } = reader(false);
    r.finishScan(sample);
    assert.deepEqual(log.sounds, ['confirm']);
    assert.match(r.results.at(-1)[0], /Door unlocking/);
    assert.equal(log.alerts.length, 1);
    assert.match(log.alerts[0][0], /You unlocked the item with Dana's fingerprint/);
    assert.equal(log.panels, 1, 'the reader waits for the panel once before complete');
});

test('fingerprint reader: gated complete() skips the second panel wait too', () => {
    const log = reset();
    const { r } = reader(true);
    r._successPending = true;
    r.accepted = true;
    // super.complete is the framework's; stand in for it on the prototype chain's parent
    const parent = Object.getPrototypeOf(FingerprintReaderMinigame.prototype);
    const orig = parent.complete;
    parent.complete = function () {};
    try {
        FingerprintReaderMinigame.prototype.complete.call(r, true);
    } finally {
        parent.complete = orig;
    }
    assert.equal(log.panels, 0);
    const u = reader(false);
    u.r._successPending = true;
    u.r.accepted = true;
    parent.complete = function () {};
    try {
        FingerprintReaderMinigame.prototype.complete.call(u.r, true);
    } finally {
        parent.complete = orig;
    }
    assert.equal(log.panels, 1);
});

// BLE scanner
function pair(sd) {
    const b = Object.create(BleScannerMinigame.prototype);
    const device = { _scenarioData: sd };
    Object.assign(b, { bleDevices: [device] });
    b.syncBleDevices = () => {};
    b.disablePinButtons = () => {};
    b.updatePanel = () => {};
    b.showActionFeedback = () => {};
    b.complete = () => {};
    const real = globalThis.setTimeout;
    globalThis.setTimeout = () => 0;
    try { b.handlePairingSuccess(device, 'pin'); } finally { globalThis.setTimeout = real; }
}
const bleData = (gated) => ({ id: 'beacon', completesTask: 'pair_beacon', onPairSetGlobal: { beacon_paired: true },
    ...(gated ? { secondStep: STEP } : {}) });

test('BLE: a gated pairing sets no global and completes no task', () => {
    const log = reset();
    pair(bleData(true));
    assert.deepEqual(log.events, []);
    assert.deepEqual(window.gameState.globalVariables, {});
});

test('BLE: an ungated pairing does both, as before', () => {
    const log = reset();
    pair(bleData(false));
    assert.deepEqual(log.events.map(e => e[0]), ['task_completed_by_npc', 'global_variable_changed:beacon_paired']);
    assert.equal(window.gameState.globalVariables.beacon_paired, true);
});

test('applyBlePairEffects does both on a gated object, and copes with no data', () => {
    const log = reset();
    applyBlePairEffects(bleData(true));
    assert.deepEqual(log.events.map(e => e[0]), ['task_completed_by_npc', 'global_variable_changed:beacon_paired']);
    assert.equal(window.gameState.globalVariables.beacon_paired, true);
    applyBlePairEffects(undefined);
});

// Card copier
function copier({ gated, outcome = 'unlocked', response = null }) {
    const m = Object.create(RFIDMinigame.prototype);
    const shown = { success: [], denial: [], back: 0, anim: [] };
    Object.assign(m, {
        secondStep: gated, isLockingAttempt: true, requiredCardIds: ['CARD-1'], acceptsUIDOnly: false,
        params: { requestAccess: async () => ({ outcome, response }) }, accessList: true, _accessPending: false,
        gameResult: null, held: [],
    });
    m.ui = { showSuccess: (t) => shown.success.push(t), showSavedCards() { shown.back++; }, showTapInterface() { shown.back++; },
        showAccessChecking() {}, isLive: () => true };
    m.animations = { showTapSuccess: () => shown.anim.push('ok'), showEmulationSuccess: () => shown.anim.push('ok'),
        showTapFailure: () => shown.anim.push('fail'), showEmulationFailure: () => shown.anim.push('fail') };
    m._showDenial = (...a) => shown.denial.push(a);
    m.holdSuccess = (ms) => m.held.push(ms);
    return { m, shown };
}
const tick = () => new Promise(r => setTimeout(r, 0));

test('card copier: a cancelled second step goes back to the card list with no tone, event or denial', async () => {
    const log = reset();
    const cancelBody = { success: false, reason: 'second_step_cancelled', closedByPlayer: false };
    for (const [outcome, response] of [['denied', cancelBody], ['second_step_cancelled', null]]) {
        const { m, shown } = copier({ gated: true, outcome, response });
        m.handleEmulate({ name: 'Copy', card_id: 'CARD-1', rfid_protocol: 'EM4100' });
        await tick();
        assert.equal(shown.back, 1, `${outcome}: back to the list`);
        assert.deepEqual(shown.denial, []);
        assert.deepEqual(shown.anim, []);
        assert.deepEqual(m.held, []);
    }
    assert.deepEqual(log.sounds, []);
    assert.deepEqual(log.events, [], 'no card_emulated');
});

test('card copier: an ordinary refusal still shows its denial and plays the tone', async () => {
    const log = reset();
    const { m, shown } = copier({ gated: true, outcome: 'denied', response: loadAnswer('first_factor_wrong').body });
    m.handleEmulate({ name: 'Copy', card_id: 'CARD-1', rfid_protocol: 'EM4100' });
    await tick();
    assert.equal(shown.denial.length, 1);
    assert.deepEqual(log.sounds, ['reject']);
    assert.equal(log.events.length, 1);
    assert.equal(log.events[0][0], 'card_emulated');
});

test('card copier: a final pass at an access list shows the usual success', async () => {
    reset();
    const { m, shown } = copier({ gated: true, outcome: 'unlocked', response: loadAnswer('open_object').body });
    m.handleEmulate({ name: 'Copy', card_id: 'CARD-1', rfid_protocol: 'EM4100' });
    await tick();
    assert.deepEqual(shown.success, ['Access Granted']);
});

test('card copier: a physical read or played-back copy says "Card read." on a gated lock only', () => {
    for (const gated of [true, false]) {
        reset();
        const { m, shown } = copier({ gated });
        m.accessList = false;
        m.handleCardTap({ scenarioData: { name: 'Badge', card_id: 'CARD-1' } });
        m.handleEmulate({ name: 'Copy', card_id: 'CARD-1', rfid_protocol: 'EM4100' });
        assert.deepEqual(shown.success, gated ? ['Card Read', 'Card read.'] : ['Access Granted', 'Access Granted']);
    }
});

test('startRFIDMinigame marks a gated lock and leaves an ungated lock\'s params alone', () => {
    reset();
    const seen = [];
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (n, c, p) => seen.push(p) };
    const params = { mode: 'unlock' };
    startRFIDMinigame(objLock(false), 'item', params);
    assert.equal(seen[0], params, 'the very same object');
    assert.equal('secondStep' in seen[0], false);
    startRFIDMinigame(objLock(true), 'item', params);
    assert.equal(seen[1].secondStep, true);
    assert.equal('secondStep' in params, false, 'the caller\'s object is not changed');
    window.gameScenario = { rooms: { vault: { secondStep: STEP } } };
    startRFIDMinigame({ doorProperties: { connectedRoom: 'vault' } }, 'door', params);
    assert.equal(seen[2].secondStep, true);
});
