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
    const log = { feedback: [], panels: [], retries: [], timers: [], holds: [] };
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
        // Same signature as framework/base-minigame.js: mark the success, complete after ms
        // (an early close commits it); the mock records the hold instead of starting a timer
        holdSuccess(ms, afterComplete) { log.holds.push({ ms, afterComplete }); },
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

test('m3/n2: once a correct key is turning, "Switch to Lockpicking" does nothing and the row stays, disabled', () => {
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
        const rows = strip.children.filter(c => c.className === 'lockpicking-mode-row');
        assert.equal(rows.length, 1, 'row kept so the strip does not jump');
        assert.equal(rowButton(rows[0]).disabled, true, 'its button is disabled');
        assert.equal(rowButton(rows[0]).title, 'The lock is opening', 'and says why');
        assert.deepEqual(log.holds.map(h => h.ms), [3000], 'the success is held, then the minigame closes itself');
        // a row rebuilt while the key turns (the guard path) is disabled with the same title
        const rebuilt = rowButton(parent.toolMgr.buildKeyButtonRow());
        assert.equal(rebuilt.disabled, true);
        assert.equal(rebuilt.title, 'The lock is opening');
        parent.toolMgr.switchToPickMode();
        assert.equal(parent.keyMode, true, 'still key mode, so the unlock reports key');
        parent.toolMgr.switchToKeyMode();
        assert.equal(log.panels.length, 0);
    } finally { t.restore(); }
});

test('n3: selectKey nulls the destroyed panel reference', () => {
    installDom();
    const t = captureTimers();
    try {
        const { parent } = pickFirstParent();
        let destroyed = 0;
        parent.keySelectionContainer = { destroy: () => destroyed++ };
        parent.keyOps.selectKey(0, 0, { id: 'a', cuts: [40, 30, 50, 20], pinCount: 4 });
        assert.equal(destroyed, 1);
        assert.equal(parent.keySelectionContainer, null);
    } finally { t.restore(); }
});

test('n1: a key with an empty cuts array never gives a pin count of 0', () => {
    installDom();
    const t = captureTimers();
    try {
        const { parent, log } = pickFirstParent();
        parent.availableKeys = [{ id: 'e', name: 'E', cuts: [] }];
        parent.toolMgr.switchToKeyMode();
        assert.equal(log.panels[0].k[0].pinCount, 4, 'falls back to the lock pin count');
        parent.keyOps.selectKey(0, 0, { id: 'e', cuts: [] });
        assert.equal(log.pinCountAtCreate, 4);
        assert.equal(parent.pinCount, 4);
    } finally { t.restore(); }
});

test('m2: mode buttons are disabled while a key goes in and re-enabled after a wrong key', () => {
    const strip = installDom();
    const t = captureTimers();
    try {
        const { parent } = pickFirstParent();
        parent.keyMode = true; parent.keySelectionMode = true;
        parent.keyGroup = {}; parent.keyConfig = { keywayStartX: 100, shoulderWidth: 20, circleRadius: 70 };
        let onComplete;
        parent.scene = { time: { delayedCall() {} }, tweens: { add: (cfg) => { onComplete = cfg.onComplete; }, killTweensOf() {} } };
        parent.keyInsertion.updatePinsWithKeyInsertion = () => {};
        parent.keyAnim.snapPinsToExactPositions = () => {};
        parent.keyOps.startKeyInsertion = KeyOperations.prototype.startKeyInsertion;
        strip.appendChild(parent.toolMgr.buildPickButtonRow());
        const btn = rowButton(rowOf(strip));
        assert.equal(btn.disabled, false);
        parent.keyOps.startKeyInsertion();
        assert.equal(btn.disabled, true, 'disabled during insertion');
        // a row rebuilt mid-insertion is also disabled
        assert.equal(rowButton(parent.toolMgr.buildKeyButtonRow()).disabled, true);
        parent.selectedKeyData = { cuts: [1, 1, 1, 1] };
        parent.keyData = { cuts: [40, 30, 50, 20] };
        onComplete();
        assert.equal(parent.keyInserting, false);
        assert.equal(btn.disabled, false, 're-enabled after a wrong key');
    } finally { t.restore(); }
});

test('m2: a correct key keeps its mode button disabled after the check', () => {
    const strip = installDom();
    const t = captureTimers();
    try {
        const { parent } = pickFirstParent();
        parent.keyMode = true;
        parent.keyGroup = {}; parent.keyConfig = { keywayStartX: 100, shoulderWidth: 20, circleRadius: 70 };
        let onComplete;
        parent.scene = { time: { delayedCall() {} }, tweens: { add: (cfg) => { onComplete = cfg.onComplete; }, killTweensOf() {} } };
        parent.keyInsertion.updatePinsWithKeyInsertion = () => {};
        parent.keyAnim.snapPinsToExactPositions = () => {};
        parent.keyOps.startKeyInsertion = KeyOperations.prototype.startKeyInsertion;
        strip.appendChild(parent.toolMgr.buildPickButtonRow());
        parent.selectedKeyData = { cuts: [40, 30, 50, 20] };
        parent.keyData = { cuts: [40, 30, 50, 20] };
        parent.keyOps.startKeyInsertion();
        onComplete();
        assert.equal(rowButton(rowOf(strip)).disabled, true);
    } finally { t.restore(); }
});

test('m2: switchToPickMode during insertion kills the tween and clears keyInserting', () => {
    installDom();
    const { mg } = minigame({ keyGroup: { id: 'kg', destroy() {} }, keyInserting: true });
    const killed = [];
    mg.scene = { tweens: { killTweensOf: (t) => killed.push(t) } };
    const group = mg.keyGroup;
    mg.toolMgr.switchToPickMode();
    assert.deepEqual(killed, [group]);
    assert.equal(mg.keyInserting, false);
    assert.equal(mg.keyMode, false);
});

// ── m3: real KeyDataGenerator + KeyCutCalculator ─────────────────────────────────────
mkdirSync(join(dir, 'utils'), { recursive: true });
writeFileSync(join(dir, 'utils/key-cut-calculator.js'), readFileSync(join(js, 'utils/key-cut-calculator.js'), 'utf8'));
writeFileSync(join(dir, 'minigames/lockpicking/key-data-generator.js'), readFileSync(join(js, 'minigames/lockpicking/key-data-generator.js'), 'utf8'));
const { KeyDataGenerator } = await import(pathToFileURL(join(dir, 'minigames/lockpicking/key-data-generator.js')).href);
const KeyCutCalculator = (await import(pathToFileURL(join(dir, 'utils/key-cut-calculator.js')).href)).default;

test('m3: real generator and calculator, pick-first Derek lock [35,55,45,25]: the matching key fits, a longer key leaves pinCount alone', () => {
    installDom();
    const t = captureTimers();
    try {
        const { parent, log } = pickFirstParent();
        parent.pins = [35, 55, 45, 25].map(keyPinLength => ({ keyPinLength }));
        parent.keyDataGen = new KeyDataGenerator(parent);
        // availableKeys built as minigame-starters builds them: cuts from keyPins, no pinCount
        const derek = { id: 'derek_key', name: "Derek's Office Key", cuts: KeyCutCalculator.calculateCutDepthsRounded([35, 55, 45, 25]) };
        const odd = { id: 'odd_key', name: 'Odd Key', cuts: KeyCutCalculator.calculateCutDepthsRounded([35, 55, 45, 25, 30]) };
        parent.availableKeys = [derek, odd];
        parent.toolMgr.switchToKeyMode();
        const [k1, k2] = log.panels[0].k;
        assert.equal(k1.pinCount, 4);
        assert.equal(k2.pinCount, 5, 'length differs, no pinCount: taken from cuts');
        parent.keyOps.selectKey(0, 0, k1);
        parent.keyOps.checkKeyCorrectness();
        assert.ok(log.feedback.includes('Key fits perfectly! Lock unlocked.'));
        assert.equal(parent.keyUnlocked, true);
        // second key: pinCount restored unchanged after selectKey
        const p2 = pickFirstParent().parent;
        p2.pins = parent.pins;
        p2.keyDataGen = new KeyDataGenerator(p2);
        p2.keyDataGen.generateKeyDataFromPins();
        p2.keyOps.selectKey(1, 0, { id: 'odd_key', cuts: odd.cuts });
        assert.equal(p2.pinCount, 4, 'lock pinCount restored unchanged');
    } finally { t.restore(); }
});

// ── m1: the deferred block in startKeySelectionMinigame ───────────────────────────────
function deferredBlock() {
    const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
    const at = src.indexOf('export function startKeySelectionMinigame');
    const from = src.indexOf('setTimeout(() => {', src.indexOf('Wait for the minigame to be fully initialized', at));
    const to = src.indexOf('}, 500);', from);
    assert.ok(from > 0 && to > from, 'deferred block found');
    return src.slice(from + 'setTimeout('.length, to + 1);
}
const LOCK = { id: 'derek_door' };
function runDeferred(mg, lockable = LOCK) {
    const fn = new Function('window', 'playerKeys', 'lockable', 'requiredKeyId', 'KeyCutCalculator', 'generateKeyCutsForLock',
        `return (${deferredBlock()});`);
    const w = { MinigameFramework: { currentMinigame: mg }, lockRef: (d) => d.name };
    const keys = [{ scenarioData: { name: 'Derek', keyPins: [35, 55, 45, 25] } }];
    fn(w, keys, lockable, 'derek_key', KeyCutCalculator, () => [1, 1, 1, 1])();
}
test('m1: a quick switch to picking inside 500 ms still stores the key list; no panel opens', () => {
    const opened = [];
    const mg = { params: { lockable: LOCK }, keyMode: false, startWithKeySelection: (k, id) => opened.push([k, id]) };
    runDeferred(mg);
    assert.equal(opened.length, 0, 'panel not opened in pick mode');
    assert.equal(mg.originalInventoryKeys.length, 1);
    assert.equal(mg.originalInventoryKeys[0].pinCount, 4);
    assert.equal(mg.originalCorrectKeyId, 'derek_key');
    // and switching back to keys now finds them
    installDom();
    const calls = [];
    Object.assign(mg, { pinCount: 4, keyData: { cuts: [1] }, canSwitchToPickMode: true, canSwitchToKeyMode: true,
        lockConfig: { resetPinsToOriginalPositions() {} }, keyDataGen: { generateKeyDataFromPins() {} },
        keyInsertion: { updateFeedback() {} }, keySelection: { createKeySelectionUI: (k) => calls.push(k) } });
    mg.toolMgr = new ToolManager(mg);
    mg.toolMgr.switchToKeyMode();
    assert.equal(calls.length, 1, 'no "No keys available"');
});
test('m1: still in key mode, the deferred block opens the panel as before', () => {
    const opened = [];
    const mg = { params: { lockable: LOCK }, keyMode: true, startWithKeySelection: (k, id) => opened.push([k, id]) };
    runDeferred(mg);
    assert.equal(opened.length, 1);
    assert.equal(opened[0][1], 'derek_key');
    assert.equal(mg.originalInventoryKeys, opened[0][0]);
});

test('m3: the deferred block leaves a different lock\'s minigame alone', () => {
    const opened = [];
    const mg = { params: { lockable: { id: 'other_door' } }, keyMode: true, startWithKeySelection: (k) => opened.push(k) };
    runDeferred(mg);
    assert.equal(opened.length, 0);
    assert.equal(mg.originalInventoryKeys, undefined);
});

// ── R3 m1: insertion tracked by the tween, not the flag the pointerup handler clears ──
function insertionRig() {
    const strip = installDom();
    const { parent } = pickFirstParent();
    parent.keyMode = true; parent.keySelectionMode = true;
    parent.keyGroup = { destroy() {} }; parent.keyConfig = { keywayStartX: 100, shoulderWidth: 20, circleRadius: 70 };
    const tweens = [];
    parent.scene = { time: { delayedCall() {} }, tweens: {
        add: (cfg) => { const tw = { cfg, playing: true, isPlaying() { return this.playing; } }; tweens.push(tw); return tw; },
        killTweensOf: () => tweens.forEach(t => { t.playing = false; }) } };
    parent.keyInsertion.updatePinsWithKeyInsertion = () => {};
    parent.keyAnim.snapPinsToExactPositions = () => {};
    parent.keyOps.startKeyInsertion = KeyOperations.prototype.startKeyInsertion;
    parent.selectedKeyData = { cuts: [1, 1, 1, 1] };
    parent.keyData = { cuts: [40, 30, 50, 20] };
    strip.appendChild(parent.toolMgr.buildPickButtonRow());
    return { strip, parent, tweens, btn: rowButton(rowOf(strip)) };
}
test('R3 m1: pointerup clearing the flag mid-insertion, then a second keyway click, starts no second tween', () => {
    const t = captureTimers();
    try {
        const { parent, tweens, btn } = insertionRig();
        parent.keyOps.startKeyInsertion();
        parent.keyInserting = false; // what the pointerup handler does
        parent.keyOps.startKeyInsertion(); // second click
        assert.equal(tweens.length, 1);
        assert.equal(btn.disabled, true);
        assert.equal(btn.title, 'Not while a key is going in');
        // the real pointerup handler skips the reset while the tween field is set
        const h = realHandlers(parent);
        h.pointerup();
        assert.equal(parent.keyInserting, false, 'flag untouched value: handler ran');
        parent.keyInserting = true;
        h.pointerup();
        assert.equal(parent.keyInserting, true, 'handler leaves the flag while the tween runs');
        parent.keyInserting = false;
        // switch is still refused-by-guard: it kills the live tween even with the flag cleared
        parent.toolMgr.switchToPickMode();
        assert.equal(tweens[0].playing, false);
        assert.equal(parent.keyInsertTween, null);
    } finally { t.restore(); }
});
test('R3 m1: a stale onComplete does nothing; the current one re-enables and clears the why-title', () => {
    const t = captureTimers();
    try {
        const { parent, tweens, btn } = insertionRig();
        parent.keyOps.startKeyInsertion();
        tweens[0].playing = false; parent.keyInserting = false; // killed, e.g. by a switch
        parent.keyInsertTween = null;
        parent.keyOps.startKeyInsertion();
        assert.equal(tweens.length, 2);
        tweens[0].cfg.onComplete(); // stale
        assert.equal(parent.keyInserting, true);
        assert.equal(btn.disabled, true, 'still disabled');
        tweens[1].playing = false;
        tweens[1].cfg.onComplete();
        assert.equal(parent.keyInserting, false);
        assert.equal(btn.disabled, false);
        // the "why" tooltip is gone; the button's own name comes back (icon-only in short landscape)
        assert.equal(btn.title, 'Switch to Lockpicking', 'why-title cleared, own name restored');
    } finally { t.restore(); }
});
test('R3 m2: the disabled CSS beats the themed button and avoids opacity', () => {
    const css = readFileSync(join(js, '../css/lockpicking.css'), 'utf8');
    for (const sel of ['.lockpicking-mode-row .minigame-button:disabled:hover', '[data-ui-theme] .lockpicking-mode-row .minigame-button:disabled:hover']) {
        const block = cssRule(css, sel);
        for (const want of ['border-image: none', 'outline: 2px dashed #bdc3c7', 'background: #34495e', 'opacity: 1', 'filter: none', 'transform: none', 'cursor: not-allowed', 'box-shadow: none']) assert.ok(block.includes(want), `${sel}: ${want}`);
    }
});

// The body of the rule whose selector list contains `selector` (the last such rule wins)
function cssRule(css, selector) {
    let found = null;
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (m[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',').map(x => x.trim()).includes(selector)) found = m[2];
    }
    assert.ok(found !== null, `rule not found: ${selector}`);
    return found;
}

// ── R5: the guard is the field, not tween.isPlaying() ─────────────────────────────────
// Real PinManagement.setupInputHandlers: the handlers it registers are captured and driven
mkdirSync(join(dir, 'minigames/lockpicking'), { recursive: true });
writeFileSync(join(dir, 'minigames/lockpicking/pin-management.js'), readFileSync(join(js, 'minigames/lockpicking/pin-management.js'), 'utf8'));
const { PinManagement } = await import(pathToFileURL(join(dir, 'minigames/lockpicking/pin-management.js')).href);
function realHandlers(parent) {
    const handlers = {};
    const zoneHandlers = {};
    parent.scene.input = { on: (ev, fn) => { handlers[ev] = fn; }, keyboard: { on() {} } };
    parent.lockState = { currentPin: null };
    parent.gameState = { mouseDown: false };
    parent.keyClickZone = { on: (ev, fn) => { zoneHandlers[ev] = fn; }, destroy() {} };
    new PinManagement(parent).setupInputHandlers();
    return { pointerup: handlers.pointerup, zoneDown: () => zoneHandlers.pointerdown({ event: { stopPropagation() {} } }) };
}
// Phaser 3.60 can report isPlaying() false before the manager's first update, and while paused
function idleReportingRig() {
    const rig = insertionRig();
    rig.parent.scene.tweens.add = (cfg) => { const tw = { cfg, isPlaying: () => false }; rig.tweens.push(tw); return tw; };
    return rig;
}
test('R5: a tween that reports isPlaying() false still holds the guard (field set right after add)', () => {
    const t = captureTimers();
    try {
        const { parent, tweens, btn } = idleReportingRig();
        parent.keyOps.startKeyInsertion();
        assert.equal(tweens.length, 1);
        assert.equal(tweens[0].isPlaying(), false);
        assert.equal(parent.keyInsertTween, tweens[0]);
        parent.keyInserting = false; // what an unguarded pointerup would do
        parent.keyOps.startKeyInsertion(); // second keyway click
        assert.equal(tweens.length, 1, 'no second tween');
        assert.equal(btn.disabled, true);
        // rows rebuilt mid-insertion are disabled too
        assert.equal(rowButton(parent.toolMgr.buildKeyButtonRow()).disabled, true);
        assert.equal(rowButton(parent.toolMgr.buildPickButtonRow()).disabled, true);
        // the real handlers: pointerup leaves the flag, the keyway zone ignores the click
        const h = realHandlers(parent);
        parent.keyInserting = true;
        h.pointerup();
        assert.equal(parent.keyInserting, true);
        h.zoneDown();
        assert.equal(tweens.length, 1);
        // the defensive switch still stops it
        parent.keyInserting = false;
        parent.toolMgr.switchToPickMode();
        assert.equal(parent.keyInsertTween, null);
        assert.equal(parent.keyMode, false);
    } finally { t.restore(); }
});
test('R5: once the tween completes the field is null and the guard opens (pointerup resets the flag)', () => {
    const t = captureTimers();
    try {
        const { parent, tweens, btn } = idleReportingRig();
        parent.keyOps.startKeyInsertion();
        tweens[0].cfg.onComplete();
        assert.equal(parent.keyInsertTween, null);
        assert.equal(btn.disabled, false);
        parent.keyInserting = true;
        realHandlers(parent).pointerup();
        assert.equal(parent.keyInserting, false);
    } finally { t.restore(); }
});

// The real querySelectorAll branch of setModeButtonsDisabled: an array-like, no children walk
test('R5: setModeButtonsDisabled uses querySelectorAll when the strip has it (array-like result)', () => {
    const mkBtn = () => ({ disabled: false, title: '', removeAttribute(n) { if (n === 'title') this.title = ''; } });
    const b1 = mkBtn(), b2 = mkBtn();
    const asked = [];
    const strip = {
        children: [], // a children walk would find nothing
        querySelectorAll: (sel) => { asked.push(sel); return { length: 2, 0: b1, 1: b2 }; },
    };
    globalThis.document = { querySelector: (sel) => (sel === '.lockpicking-item-section' ? strip : null) };
    const mg = { keyInserting: true };
    const tm = new ToolManager(mg);
    tm.setModeButtonsDisabled(true);
    assert.deepEqual(asked, ['.lockpicking-mode-row button']);
    for (const b of [b1, b2]) { assert.equal(b.disabled, true); assert.equal(b.title, 'Not while a key is going in'); }
    mg.keyUnlocked = true;
    tm.setModeButtonsDisabled(true);
    assert.equal(b1.title, 'The lock is opening');
    tm.setModeButtonsDisabled(false);
    for (const b of [b1, b2]) { assert.equal(b.disabled, false); assert.equal(b.title, ''); }
    // a result with no length falls back to the children walk
    const b3 = Object.assign(mkBtn(), { tagName: 'BUTTON' });
    const row = { className: 'lockpicking-mode-row', children: [b3] };
    const strip2 = { children: [row], querySelectorAll: () => null };
    globalThis.document = { querySelector: () => strip2 };
    new ToolManager({}).setModeButtonsDisabled(true);
    assert.equal(b3.disabled, true);
});

// ── R5: the pick success toast shows once, however many switches came first ─────────────
function sliceArrow(src, marker, anchor) {
    const start = src.indexOf(marker, src.indexOf(anchor));
    assert.ok(start >= 0, marker);
    const open = src.indexOf('{', src.indexOf('=>', start));
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    throw new Error('unbalanced');
}
test('R5: N mode switches, then a pick success: one "Successfully picked the lock!" toast', async () => {
    const unlockSrc = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
    const pickOnComplete = sliceArrow(src, 'onComplete: (success, result) =>', 'export function startLockpickingMinigame').replace(/^onComplete: /, '');
    const pickCb = sliceArrow(unlockSrc, 'async (success, outcome) =>', "startLockpickingMinigame(lockable, window.game, difficulty");
    for (const switches of [0, 1, 3, 6]) {
        const strip = installDom();
        const { mg } = minigame({ originalInventoryKeys: KEYS, originalCorrectKeyId: 'office_key', keyMode: false, keySelectionMode: false });
        strip.appendChild(mg.toolMgr.buildKeyButtonRow());
        for (let i = 0; i < switches; i++) { mg.toolMgr.switchToKeyMode(); mg.toolMgr.switchToPickMode(); }
        assert.equal(mg.keyMode, false);
        const toasts = [];
        const win = { gameAlert: (m) => toasts.push(m), expectContainerAfterUnlock() {}, minigameClosedByDamage: () => false };
        const quiet = { log() {}, warn() {}, error() {} };
        const timers = [];
        const cb = new Function('window', 'console', 'notifyServerUnlock', 'unlockTarget', 'lockable', 'type', 'setTimeout',
            `return (${pickCb});`)(win, quiet, async () => ({}), () => {}, {}, 'door', (f) => { timers.push(f); });
        const onComplete = new Function('window', 'console', 'callback', 'lockable', `return (${pickOnComplete});`)(win, quiet, cb, {});
        // what LockpickingMinigame.complete(true) reports for a pick in pick mode
        onComplete(true, { method: mg.keyMode ? 'key' : 'lockpick' });
        await new Promise(r => setImmediate(r));
        timers.forEach(f => f());
        assert.deepEqual(toasts.filter(m => /picked the lock/.test(m)), ['Successfully picked the lock!'], `after ${switches} switches`);
    }
});

// ── R5: the disabled button keeps the enabled button's outer box ─────────────────────────
test('R5: disabled mode button: border width and padding match the enabled button (themed and unthemed)', () => {
    const lock = readFileSync(join(js, '../css/lockpicking.css'), 'utf8');
    const themes = readFileSync(join(js, '../css/ui-themes.css'), 'utf8');
    const framework = readFileSync(join(js, '../css/minigames-framework.css'), 'utf8');
    const decl = (css, selector, prop) => {
        const body = cssRule(css, selector);
        const m = body.match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+);`));
        return m ? m[1].trim() : null;
    };
    const px = (v) => Number(String(v).replace('px', ''));
    // enabled, unthemed: .minigame-button { border: 4px solid ...; padding: 10px 20px }
    const baseBorder = px(decl(framework, '.minigame-button', 'border').split(' ')[0]);
    const basePadding = decl(framework, '.minigame-button', 'padding');
    const disabledBorder = px(decl(lock, '.lockpicking-mode-row .minigame-button:disabled:hover', 'border').split(' ')[0]);
    assert.equal(disabledBorder, baseBorder, 'unthemed border width');
    assert.equal(decl(lock, '.lockpicking-mode-row .minigame-button:disabled:hover', 'padding'), null, 'padding not overridden');
    assert.ok(baseBorder + px(basePadding.split(' ')[0]) === disabledBorder + px(basePadding.split(' ')[0]));
    // enabled, themed: border-width and border-image-width are var(--ui-button-px), padding from the base
    const themedBorder = decl(themes, '[data-ui-theme] .minigame-button', 'border-width');
    assert.equal(themedBorder, 'var(--ui-button-px)');
    for (const sel of ['[data-ui-theme] .lockpicking-mode-row .minigame-button:disabled', '[data-ui-theme] .lockpicking-mode-row .minigame-button:disabled:hover']) {
        assert.equal(decl(lock, sel, 'border').split(' ')[0], 'var(--ui-button-px)', `${sel} border width`);
        assert.equal(decl(lock, sel, 'padding'), null);
    }
    // the dashed look is an outline inside the band, never a border style, and no hover ring
    const block = lock.slice(lock.indexOf('.lockpicking-mode-row .minigame-button:disabled,'));
    assert.ok(!/border:[^;]*dashed/.test(block), 'no dashed border (it would change the box)');
    assert.equal((block.match(/outline: 2px dashed/g) || []).length, 2, 'one rule each, themed and unthemed');
    assert.equal((block.match(/box-shadow: none/g) || []).length, 2, 'the hover ring is off for :disabled');
});

// ── R5: nits: the feedback box grows, the row clears the X ─────────────────────────────────
test('R5: the feedback box cannot shrink below its text; the short-landscape row clears the X', () => {
    const lock = readFileSync(join(js, '../css/lockpicking.css'), 'utf8');
    const fb = lock.slice(lock.indexOf('.lockpick-feedback {'), lock.indexOf('}', lock.indexOf('.lockpick-feedback {')));
    assert.match(fb, /flex: 0 0 auto/);
    assert.match(fb, /height: auto/);
    assert.doesNotMatch(fb, /(^|\s)height: \d/m);
    const mq = lock.slice(lock.indexOf('@media (max-height: 560px) and (min-width: 769px) {\n    .lockpicking-item-section {\n        flex-wrap: nowrap'));
    assert.match(mq.slice(0, mq.indexOf('.lockpicking-or-caption')), /margin-right: calc\(44px \+ var\(--minigame-shell-bar, 0px\)\)/);
});
