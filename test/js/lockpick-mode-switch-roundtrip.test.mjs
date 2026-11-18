// Key mode <-> pick mode round trip in the lockpicking minigame.
// Defect 1: switching back to key mode called this.parent.createKeySelectionUI, which lives
// on the KeySelection helper (parent.keySelection), so the key panel never came back.
// Defect 2: a lock opened key-first passed canSwitchToPickMode but not canSwitchToKeyMode,
// so after "Switch to Lockpicking" there was no way back to the keys.
// Run with: node --max-old-space-size=2048 test/js/lockpick-mode-switch-roundtrip.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
// tool-manager.js has no imports, so a plain copy is enough (no harness copy list to update)
const dir = mkdtempSync(join(tmpdir(), 'mode-switch-test-'));
writeFileSync(join(dir, 'tool-manager.mjs'), readFileSync(join(js, 'minigames/lockpicking/tool-manager.js'), 'utf8'));
const { ToolManager } = await import(pathToFileURL(join(dir, 'tool-manager.mjs')).href);
// Real helpers (key-selection.js imports display-dashes.js; key-operations.js has no imports)
mkdirSync(join(dir, 'utils'), { recursive: true });
writeFileSync(join(dir, 'utils/display-dashes.js'), readFileSync(join(js, 'utils/display-dashes.js'), 'utf8'));
mkdirSync(join(dir, 'minigames/lockpicking'), { recursive: true });
for (const f of ['key-selection.js', 'key-operations.js']) writeFileSync(join(dir, 'minigames/lockpicking', f), readFileSync(join(js, 'minigames/lockpicking', f), 'utf8'));
const { KeySelection } = await import(pathToFileURL(join(dir, 'minigames/lockpicking/key-selection.js')).href);
const { KeyOperations } = await import(pathToFileURL(join(dir, 'minigames/lockpicking/key-operations.js')).href);

// ── minimal DOM: one strip that holds mode rows ──────────────────────────────
function el(tag) {
    return {
        tag, className: '', id: '', textContent: '', innerHTML: '', children: [], onclick: null,
        appendChild(c) { this.children.push(c); return c; },
        remove() { this.removed = true; },
    };
}
function installDom() {
    const strip = el('div');
    strip.className = 'lockpicking-item-section';
    strip.querySelectorAll = () => {
        const rows = strip.children.filter(c => c.className === 'lockpicking-mode-row');
        return { forEach: (fn) => rows.forEach((r) => { strip.children.splice(strip.children.indexOf(r), 1); fn(r); }) };
    };
    globalThis.document = {
        createElement: el,
        querySelector: (sel) => (sel === '.lockpicking-item-section' ? strip : null),
    };
    globalThis.Phaser = { Geom: { Rectangle: class {}, } };
    globalThis.Phaser.Geom.Rectangle.Contains = () => true;
    return strip;
}
const rowOf = (strip) => strip.children.find(c => c.className === 'lockpicking-mode-row');
const rowButton = (row) => row.children.find(c => c.tag === 'button');
const rowCaption = (row) => row.children.find(c => c.className === 'lockpicking-or-caption');

const KEYS = [
    { id: 'office_key', name: 'Office Key', cuts: [40, 30, 50] },
    { id: 'shed_key', name: 'Shed Key', cuts: [20, 30, 60] },
];

function minigame(extra = {}) {
    const calls = [];
    const feedback = [];
    const mg = {
        keyMode: true, keySelectionMode: true, params: {}, pinCount: 3, keyData: { cuts: [1, 2, 3] },
        keyDataGen: { generateKeyDataFromPins() {} },
        canSwitchToPickMode: true, canSwitchToKeyMode: true,
        lockConfig: { resetPinsToOriginalPositions() {} },
        keyInsertion: { updateFeedback: (t) => feedback.push(t) },
        keySelection: { createKeySelectionUI: (keys, id) => calls.push({ keys, id }) },
        // A pick-mode minigame would never see a method on the parent itself
        ...extra,
    };
    mg.toolMgr = new ToolManager(mg);
    return { mg, calls, feedback };
}

test('defect 1: switching to key mode rebuilds the panel through parent.keySelection', () => {
    installDom();
    const { mg, calls, feedback } = minigame({ availableKeys: KEYS, requiredKeyId: 'office_key', keyMode: false, keySelectionMode: false });
    assert.equal(typeof mg.createKeySelectionUI, 'undefined', 'the minigame itself has no createKeySelectionUI');
    mg.toolMgr.switchToKeyMode();
    assert.equal(mg.keyMode, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].keys.map(k => [k.id, k.cuts]), KEYS.map(k => [k.id, k.cuts]));
    assert.ok(calls[0].keys.every(k => k.pinCount === 3), 'pinCount filled in');
    assert.equal(calls[0].id, 'office_key');
    assert.deepEqual(feedback, ['Select a key to use']);
});

test('key-first locks (inventoryKeys, converted list) also get the panel back', () => {
    installDom();
    const converted = KEYS.map(k => ({ ...k, pinCount: 3 }));
    const { mg, calls } = minigame({ keyMode: false, inventoryKeys: [{ raw: 'item' }], originalInventoryKeys: converted, originalCorrectKeyId: 'shed_key' });
    mg.toolMgr.switchToKeyMode();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].keys, converted, 'the converted keys, not the raw inventory items');
    assert.equal(calls[0].id, 'shed_key');
});

test('no keys held: says so and does not throw', () => {
    installDom();
    const { mg, calls, feedback } = minigame({ keyMode: false });
    mg.toolMgr.switchToKeyMode();
    assert.equal(calls.length, 0);
    assert.deepEqual(feedback, ['No keys available']);
});

test('key -> pick -> key -> pick: panel and mode rows return every time, caption with the pick row', () => {
    const strip = installDom();
    const { mg, calls } = minigame({ originalInventoryKeys: KEYS, originalCorrectKeyId: 'office_key' });
    strip.appendChild(mg.toolMgr.buildPickButtonRow()); // key-first start: pick row
    for (let round = 1; round <= 3; round++) {
        // key mode: pick row with the caption
        assert.equal(mg.keyMode, true);
        assert.equal(rowButton(rowOf(strip)).id, 'lockpicking-switch-mode-btn');
        assert.equal(rowCaption(rowOf(strip)).textContent, 'Or pick the lock:');
        rowButton(rowOf(strip)).onclick();
        // pick mode: key row, no caption
        assert.equal(mg.keyMode, false);
        assert.equal(strip.children.filter(c => c.className === 'lockpicking-mode-row').length, 1);
        assert.equal(rowButton(rowOf(strip)).id, 'lockpicking-switch-to-keys-btn');
        assert.equal(rowCaption(rowOf(strip)), undefined);
        rowButton(rowOf(strip)).onclick();
        assert.equal(calls.length, round, 'key panel rebuilt on each return to key mode');
    }
});

// ── what the key-first starter hands the minigame ────────────────────────────
const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
const from = src.indexOf('export function startKeySelectionMinigame');
const fnSrc = src.slice(from, src.indexOf('export function startPinMinigame')).replace('export function', 'function');

function runStarter(items, { keyMode } = {}) {
    const posted = [];
    let params = null;
    const win = {
        inventory: { items },
        lockRef: (d) => d.id,
        gameAlert() {}, expectContainerAfterUnlock() {},
        gameScenario: { rooms: {} },
        keyLockMappings: {},
        MinigameFramework: {
            mainGameScene: {}, init() {},
            startMinigame: (_n, _c, p) => { params = p; },
            currentMinigame: null,
        },
    };
    const names = ['window', 'doesKeyMatchLock', 'generateKeyCutsForLock', 'PREDEFINED_LOCK_CONFIGS', 'KeyCutCalculator',
        'catchLockpickInView', 'resolveObjectField', 'resolveObjectImageUrl', 'withLockedHint', 'lockedHintDuration',
        'setTimeout', 'console'];
    const quiet = { log() {}, warn() {}, error() {} };
    const fn = new Function(...names, `${fnSrc}; return startKeySelectionMinigame;`)(
        win, () => false, () => [1, 2, 3], {}, { calculateCutDepthsRounded: (p) => p },
        () => null, (o, f, d) => d, () => '', (m) => m, () => 4000, (f, ms) => { if (ms < 500) f(); }, quiet);
    const keys = items.filter(i => i.scenarioData.type === 'key');
    const lockable = { scenarioData: { requires: 'office_key' }, id: 'door1' };
    fn(lockable, 'door', keys, null, (l, t, layer, method) => posted.push(method));
    if (keyMode !== undefined) {
        win.MinigameFramework.currentMinigame = { keyMode };
        params.onComplete(true, {});
    }
    return { ...params, posted };
}
const keyItem = (id) => ({ scenarioData: { type: 'key', id, name: id, cuts: [40, 30, 50] } });
const pickItem = { scenarioData: { type: 'lockpick', id: 'kit', name: 'Lockpick' } };
const ringItem = { scenarioData: { type: 'key_ring', id: 'ring', allKeys: [{ id: 'k', name: 'k' }] } };

test('defect 2: key-first with key and lockpick offers both switches', () => {
    const p = runStarter([keyItem('office_key'), pickItem]);
    assert.equal(p.keyMode, true);
    assert.equal(p.canSwitchToPickMode, true);
    assert.equal(p.canSwitchToKeyMode, true);
    assert.equal(typeof p.beforeSwitchToPickMode, 'function', 'same watcher gate');
});

test('key-first without a lockpick hides the pick button (the server\'s lockpick check is the real gate)', () => {
    const p = runStarter([keyItem('office_key')]);
    assert.equal(p.canSwitchToPickMode, false);
});

test('key-ring keys count for the way back, same predicate as the pick-first path', () => {
    const p = runStarter([ringItem, pickItem]);
    assert.equal(p.canSwitchToKeyMode, true);
});

test('unlock method follows the mode the lock was opened in (key stays "key", pick stays "lockpick")', () => {
    for (const [keyMode, expected] of [[true, 'key'], [false, 'lockpick']]) {
        const p = runStarter([keyItem('office_key'), pickItem], { keyMode });
        assert.deepEqual(p.posted, [expected]);
    }
});

// ── the real helpers behind the round trip ───────────────────────────────────
test('the helper the tool manager calls really exists on KeySelection', () => {
    assert.equal(typeof KeySelection.prototype.createKeySelectionUI, 'function');
});

// A pick-first parent: no keyData, keys with no pinCount, real ToolManager + KeyOperations
function pickFirstParent() {
    const log = { feedback: [], panels: [], retries: [], timers: [] };
    const parent = {
        keyMode: false, keySelectionMode: false, pinCount: 4, params: {},
        canSwitchToPickMode: true, canSwitchToKeyMode: true,
        keyData: null, selectedKeyData: null, sounds: {},
        availableKeys: [
            { id: 'a', name: 'A', cuts: [40, 30, 50, 20] },
            { id: 'b', name: 'B', cuts: [10, 60, 20, 45] },
        ],
        lockConfig: { resetPinsToOriginalPositions() {} },
        keyInsertion: { updateFeedback: (t) => log.feedback.push(t), updateKeyPosition() {} },
        keyDataGen: { generateKeyDataFromPins() { parent.keyData = { cuts: [40, 30, 50, 20] }; } },
        keySelection: { createKeySelectionUI: (k, id) => log.panels.push({ k, id }) },
        startWithKeySelection: (k, id) => log.retries.push({ k, id }),
        scene: { time: { delayedCall() {} } },
        keyAnim: { startKeyRotationAnimationWithChamberHoles() {} },
        complete() {},
    };
    parent.toolMgr = new ToolManager(parent);
    parent.keyOps = new KeyOperations(parent);
    parent.keyOps.createKey = () => { log.pinCountAtCreate = parent.pinCount; };
    parent.keyOps.startKeyInsertion = () => {};
    parent.keyOps.flashLockRed = () => {};
    return { parent, log };
}
function captureTimers() {
    const real = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    const timers = [];
    globalThis.setTimeout = (fn, ms) => { timers.push({ fn, ms, cleared: false }); return timers.length - 1; };
    globalThis.clearTimeout = (id) => { if (timers[id]) timers[id].cleared = true; };
    return { timers, restore: () => { globalThis.setTimeout = real; globalThis.clearTimeout = realClear; } };
}

test('pick-first lock: a wrong key gives the wrong-key path, pinCount survives, only real keys come back', () => {
    installDom();
    const t = captureTimers();
    try {
        const { parent, log } = pickFirstParent();
        parent.toolMgr.switchToKeyMode();
        const offered = log.panels[0].k;
        assert.ok(offered.every(k => k.pinCount === 4), 'pinCount filled in');
        assert.deepEqual(offered.map(k => k.id), ['a', 'b']);
        assert.ok(parent.keyData, 'correct-key data generated');
        parent.keyOps.selectKey(1, 0, offered[1]);
        assert.equal(parent.pinCount, 4, 'lock pin count unchanged');
        assert.equal(log.pinCountAtCreate, 4);
        parent.keyOps.checkKeyCorrectness();
        assert.ok(log.feedback.includes("Wrong key! The lock won't turn."));
        const retry = t.timers.find(x => x.ms === 2000);
        retry.fn();
        assert.equal(log.retries.length, 1);
        assert.deepEqual(log.retries[0].k.map(k => k.id), ['a', 'b'], 'the real list, not made-up keys');
    } finally { t.restore(); }
});

test('m2: leaving key mode cancels the pending wrong-key retry; the retry also bails out in pick mode', () => {
    installDom();
    const t = captureTimers();
    try {
        const { parent, log } = pickFirstParent();
        parent.toolMgr.switchToKeyMode();
        parent.keyOps.selectKey(1, 0, log.panels[0].k[1]);
        parent.keyOps.checkKeyCorrectness();
        const retry = t.timers.find(x => x.ms === 2000);
        parent.toolMgr.switchToPickMode();
        assert.equal(retry.cleared, true);
        retry.fn(); // even if it fired
        assert.equal(log.retries.length, 0);
    } finally { t.restore(); }
});

test('m2: createKeySelectionUI destroys an earlier panel first', () => {
    const t = captureTimers();
    try {
        let destroyed = 0;
        const parent = { keySelectionContainer: { destroy: () => destroyed++ }, scene: null, game: null };
        new KeySelection(parent).createKeySelectionUI([{ id: 'a', cuts: [1] }], 'a');
        assert.equal(destroyed, 1);
        assert.equal(parent.keySelectionContainer, null);
    } finally { t.restore(); }
});

test('m3: once a correct key is turning, "Switch to Lockpicking" does nothing and the row is gone', () => {
    const strip = installDom();
    const t = captureTimers();
    try {
        const { parent, log } = pickFirstParent();
        parent.keyMode = true; parent.keySelectionMode = true;
        strip.appendChild(parent.toolMgr.buildPickButtonRow());
        parent.selectedKeyData = { cuts: [40, 30, 50, 20] };
        parent.keyData = { cuts: [40, 30, 50, 20] };
        parent.keyOps.checkKeyCorrectness();
        assert.equal(parent.keyUnlocked, true);
        assert.equal(strip.children.filter(c => c.className === 'lockpicking-mode-row').length, 0);
        parent.toolMgr.switchToPickMode();
        assert.equal(parent.keyMode, true, 'still key mode, so the unlock reports key');
        parent.toolMgr.switchToKeyMode();
        assert.equal(log.panels.length, 0);
    } finally { t.restore(); }
});
