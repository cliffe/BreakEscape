// A key lock opened by a player who holds keys AND a lockpick (m01 blind playtest item 4,
// R1 m4/m1): handleUnlock goes to the key screen when a held key might fit, to the pick
// minigame when every held key is provably wrong, and is unchanged without a lockpick.
// startLockpickingMinigame's own wiring for the "Switch to Key Mode" case (method, switch
// back, key rings) and the key screen's "Or pick the lock:" caption are checked too.
// Run with: node --max-old-space-size=2048 test/js/lock-key-pick-routing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'error', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const stubAll = (src, stubs) => {
    for (const [spec, url] of Object.entries(stubs)) {
        assert.ok(src.includes(`'${spec}'`), `imports ${spec}`);
        src = src.split(`'${spec}'`).join(`'${url}'`);
    }
    return src;
};
const dir = mkdtempSync(join(tmpdir(), 'lock-key-pick-routing-'));
writeFileSync(join(dir, 'key-cut-calculator.mjs'), read('utils/key-cut-calculator.js'));
const catchSrc = read('systems/lockpick-catch.js').split("'../utils/key-cut-calculator.js'").join("'./key-cut-calculator.mjs'");
writeFileSync(join(dir, 'lockpick-catch.mjs'), catchSrc);
writeFileSync(join(dir, 'tool-manager.mjs'), read('minigames/lockpicking/tool-manager.js'));
const catchUrl = pathToFileURL(join(dir, 'lockpick-catch.mjs')).href;

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.__calls = [];
globalThis.__unlocks = [];
const unlockSrc = stubAll(read('systems/unlock-system.js'), {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor() {}'),
    './minigame-starters.js': dataUrl(`export function startLockpickingMinigame(...a) { globalThis.__calls.push(['pick', ...a]); }
        export function startKeySelectionMinigame(...a) { globalThis.__calls.push(['keys', ...a]); }
        export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {}
        export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}`),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(read('utils/locked-hint.js')),
    '../utils/remote-host-text.js': dataUrl(read('utils/remote-host-text.js')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(`export async function unlockWithRouteRoomRetry(...a) { globalThis.__unlocks.push(a); return { ok: true }; }`),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async (d, o = {}) => { if (o.autoOpen !== false && o.openScreen) o.openScreen(); };'),
    './lockpick-catch.js': catchUrl
});
const { handleUnlock } = await import(dataUrl(unlockSrc));

const lock = [35, 55, 45, 25];
const keyItem = (keyPins, extra = {}) => ({ scenarioData: { type: 'key', name: 'k', keyPins, ...extra } });
const pickItem = { scenarioData: { type: 'lockpick' } };
const door = () => ({
    layer: null,
    doorProperties: { locked: true, lockType: 'key', requires: 'derek_key', keyPins: lock, roomId: 'a', connectedRoom: 'b' }
});
function run(items) {
    globalThis.__calls.length = 0;
    const alerts = [];
    window.inventory = { items };
    window.gameAlert = (...a) => alerts.push(a);
    window.eventDispatcher = { emit() {} };
    window.npcManager = null;
    window.lockRef = (d) => d?.name || null;
    handleUnlock(door(), 'door');
    return { calls: globalThis.__calls.map(c => c[0]), alerts };
}

test('wrong keys + lockpick: the pick minigame opens', () => {
    assert.deepEqual(run([keyItem([45, 25, 55, 35]), pickItem]).calls, ['pick']);
});
test('a fitting key + lockpick: key selection opens', () => {
    assert.deepEqual(run([keyItem([45, 25, 55, 35]), keyItem(lock), pickItem]).calls, ['keys']);
});
test('a key ring holding the fitting key counts too', () => {
    const ring = { scenarioData: { type: 'key_ring', allKeys: [{ name: 'r', keyPins: lock }] } };
    assert.deepEqual(run([keyItem([45, 25, 55, 35]), ring, pickItem]).calls, ['keys']);
});
test('wrong keys, no lockpick: key selection, as before', () => {
    assert.deepEqual(run([keyItem([45, 25, 55, 35])]).calls, ['keys']);
});
test('no keys, lockpick only: the pick minigame, as before', () => {
    assert.deepEqual(run([pickItem]).calls, ['pick']);
});
test('neither: "Requires key"', () => {
    const r = run([]);
    assert.deepEqual(r.calls, []);
    assert.equal(r.alerts[0][0], 'Requires key');
});

// ── fit helper parity with the key minigame ────────────────────────────────────────
const { anyKeyMightFitLock, lockKeyPinsOf } = await import(catchUrl);
test('lockKeyPinsOf follows key mode: door, then item scenarioData, then lockable', () => {
    assert.deepEqual(lockKeyPinsOf({ doorProperties: { keyPins: [1] }, scenarioData: { keyPins: [2] } }), [1]);
    assert.deepEqual(lockKeyPinsOf({ scenarioData: { keyPins: [2] }, keyPins: [3] }), [2]);
    assert.deepEqual(lockKeyPinsOf({ keyPins: [3] }), [3]);
    assert.equal(lockKeyPinsOf({ doorProperties: { key_pins: [4] } }), undefined, 'key_pins is not read by key mode');
    assert.equal(lockKeyPinsOf(null), undefined);
});
test('cuts win over keyPins when both are present', () => {
    const k = { scenarioData: { cuts: [0, 0, 0, 0], keyPins: lock } };
    assert.equal(anyKeyMightFitLock([k], lock), false);
});
test('key.keyPins (on the item) is read when scenarioData has none', () => {
    assert.equal(anyKeyMightFitLock([{ scenarioData: {}, keyPins: lock }], lock), true);
    assert.equal(anyKeyMightFitLock([{ scenarioData: {}, keyPins: [45, 25, 55, 35] }], lock), false);
});
test('key_pins is ignored: such a key counts as unknown, so it might fit', () => {
    assert.equal(anyKeyMightFitLock([{ scenarioData: { key_pins: [1, 1, 1, 1] } }], lock), true);
});
test('pins under 20 clamp to a 0 cut on both sides', () => {
    // lock pins [10, 15, 45, 25] -> cuts [0, 0, 25, 5]; a key built for [20, 20, 45, 25] cuts the same
    assert.equal(anyKeyMightFitLock([keyItem([20, 20, 45, 25])], [10, 15, 45, 25]), true);
    assert.equal(anyKeyMightFitLock([keyItem([30, 30, 45, 25])], [10, 15, 45, 25]), false);
    // explicit cuts of 0 against pins under 20
    assert.equal(anyKeyMightFitLock([{ scenarioData: { cuts: [0, 0, 25, 5] } }], [10, 15, 45, 25]), true);
});
test('different pin counts never fit', () => {
    assert.equal(anyKeyMightFitLock([keyItem([35, 55, 45])], lock), false);
});

// ── startLockpickingMinigame wiring (reached with keys held) ───────────────────────
const startersSrc = read('systems/minigame-starters.js');
function pickParams(items, { caught = false } = {}) {
    // The params object passed to startMinigame('lockpicking', ...) in startLockpickingMinigame
    const at = startersSrc.indexOf('export function startLockpickingMinigame');
    const body = startersSrc.slice(at, startersSrc.indexOf('export function startKeySelectionMinigame'));
    const sm = body.indexOf("window.MinigameFramework.startMinigame('lockpicking', null, {");
    return { body, sm };
}
test('startLockpickingMinigame: switch both ways and key-ring keys', () => {
    const { body, sm } = pickParams();
    const opts = body.slice(sm);
    assert.match(opts, /canSwitchToPickMode:/, 'the way back to picking is enabled');
    assert.match(opts, /beforeSwitchToPickMode:\s*\(\) => !!catchLockpickInView\(lockable/, 'same watcher gate');
    assert.match(opts, /canSwitchToKeyMode:[\s\S]{0,300}key_ring/, 'key rings count for Switch to Key Mode');
});
test('startLockpickingMinigame: the method the minigame reports reaches the callback', () => {
    const { body, sm } = pickParams();
    const cbStart = body.indexOf('onComplete: (success, result) =>', sm);
    const cb = body.slice(cbStart + 'onComplete: '.length, body.indexOf('\n    });', cbStart));
    const make = (result) => {
        const toasts = []; const got = [];
        const w = { gameAlert: (m, k) => toasts.push([m, k]) };
        new Function('window', 'lockable', 'callback', `return (${cb});`)(w, {}, (...a) => got.push(a))(true, result);
        return { toasts, got };
    };
    const key = make({ method: 'key' });
    assert.deepEqual(key.got[0], [true, { method: 'key' }]);
    assert.match(key.toasts[0][0], /correct key/);
    const pick = make({ method: 'lockpick' });
    assert.deepEqual(pick.got[0], [true, { method: 'lockpick' }]);
    assert.match(pick.toasts[0][0], /picked the lock/);
    assert.deepEqual(make(undefined).got[0], [true, { method: 'lockpick' }], 'no result: a pick');
});
test('the minigame puts the method in its result on success only', () => {
    const src = read('minigames/lockpicking/lockpicking-game-phaser.js');
    assert.match(src, /if \(success\) \{[\s\S]{0,200}method: this\.keyMode \? 'key' : 'lockpick'/);
});
test('the pick callback sends the reported method to the server', async () => {
    const pickCall = (km) => {
        globalThis.__calls.length = 0; globalThis.__unlocks.length = 0;
        window.inventory = { items: [pickItem] };
        window.gameAlert = () => {}; window.eventDispatcher = { emit() {} };
        window.npcManager = null; window.lockRef = (d) => d?.name || null;
        window.ApiClient = {}; window.breakEscapeConfig = { gameId: 7 };
        handleUnlock(door(), 'door');
        const call = globalThis.__calls.find((c) => c[0] === 'pick');
        assert.ok(call, 'pick minigame started');
        return call.find((a) => typeof a === 'function');
    };
    const realTimeout = globalThis.setTimeout;
    globalThis.setTimeout = () => 0; // skip the unlock animation after the notify
    try {
        for (const [method, expected] of [['key', 'key'], ['lockpick', 'lockpick']]) {
            const cb = pickCall();
            await cb(true, { method });
            assert.equal(globalThis.__unlocks.length, 1);
            assert.equal(globalThis.__unlocks[0][3], expected, `${method} reaches unlockWithRouteRoomRetry`);
        }
    } finally {
        globalThis.setTimeout = realTimeout;
    }
});

// ── the caption beside "Switch to Lockpicking" ──────────────────────────────────────
test('key mode with a lockpick shows "Or pick the lock:" with the button, via textContent', async () => {
    const mk = (tag) => ({ tag, children: [], style: {}, appendChild(c) { this.children.push(c); return c; } });
    const doc = { createElement: mk };
    const { createPickCaption } = await import(pathToFileURL(join(dir, 'tool-manager.mjs')).href);
    const c = createPickCaption(doc);
    assert.equal(c.textContent, 'Or pick the lock:');
    assert.equal(c.className, 'lockpicking-or-caption');
    assert.equal(c.innerHTML, undefined, 'no innerHTML for text');
});
test('the game builds the mode rows through the tool manager; CSS stays pixel-art', () => {
    const game = read('minigames/lockpicking/lockpicking-game-phaser.js');
    const keyBranch = game.slice(game.indexOf('if (this.canSwitchToPickMode && this.keyMode)'), game.indexOf('// Insert before the game container'));
    assert.match(keyBranch, /buildPickButtonRow\(\)[\s\S]*buildKeyButtonRow\(\)/);
    const tm = read('minigames/lockpicking/tool-manager.js');
    assert.match(tm, /row\.appendChild\(createPickCaption\(\)\);\s*row\.appendChild\(btn\)/, 'caption beside the pick button');
    const css = readFileSync(join(js, '../css/lockpicking.css'), 'utf8');
    const rule = css.slice(css.indexOf('.lockpicking-or-caption {'), css.indexOf('}', css.indexOf('.lockpicking-or-caption {')));
    assert.match(rule, /font-family: 'GNF'/);
    assert.match(rule, /font-size: 16px/);
    assert.doesNotMatch(rule, /radius|shadow|gradient/);
    assert.match(css, /\.lockpicking-mode-row \{\s*flex: 0 0 auto;\s*width: 100%/, 'own full-width line');
    assert.match(css, /\.lockpicking-item-section \{\s*flex-wrap: wrap/);
    assert.match(css, /@media \(max-width: 768px\) \{\s*\.lockpicking-or-caption \{\s*flex: 0 0 100%/, 'caption on its own line on a phone');
});

// ── pick -> key -> pick -> key round trip on the item strip ─────────────────────────
function fakeDom() {
    const el = (tag) => ({
        tag, className: '', id: '', children: [], parent: null, innerHTML: '', textContent: '',
        appendChild(c) { c.parent = this; this.children.push(c); return c; },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this); },
        querySelectorAll(sel) { return this.children.filter((c) => c.className === sel.slice(1)); },
    });
    const strip = el('div'); strip.className = 'lockpicking-item-section';
    return { strip, createElement: el, querySelector: (sel) => (sel === '.lockpicking-item-section' ? strip : null) };
}
test('mode rows round trip pick -> key -> pick -> key without losing a way back', async () => {
    const { ToolManager } = await import(pathToFileURL(join(dir, 'tool-manager.mjs')).href);
    const doc = fakeDom();
    globalThis.document = doc;
    try {
        const selections = [];
        const parent = {
            params: {}, keyMode: true, keySelectionMode: true, pinCount: 3, keyData: { cuts: [1] }, keyDataGen: { generateKeyDataFromPins() {} },
            canSwitchToPickMode: true, canSwitchToKeyMode: true, availableKeys: [{ id: 'k' }],
            lockConfig: { resetPinsToOriginalPositions() {} },
            keyInsertion: { updateFeedback() {} },
            // createKeySelectionUI lives on the KeySelection helper, not on the minigame
            keySelection: { createKeySelectionUI: () => selections.push('ui') },
        };
        const tm = new ToolManager(parent);
        doc.strip.appendChild(tm.buildPickButtonRow());
        const ids = () => doc.strip.children.map((r) => r.children.map((c) => c.id).filter(Boolean));
        assert.deepEqual(ids(), [['lockpicking-or-caption', 'lockpicking-switch-mode-btn']]);
        const press = (id) => doc.strip.children[0].children.find((c) => c.id === id).onclick();
        press('lockpicking-switch-mode-btn');                 // key -> pick
        assert.equal(parent.keyMode, false);
        assert.deepEqual(ids(), [['lockpicking-switch-to-keys-btn']], 'one row: the way back to keys');
        press('lockpicking-switch-to-keys-btn');              // pick -> key
        assert.equal(parent.keyMode, true);
        assert.deepEqual(ids(), [['lockpicking-or-caption', 'lockpicking-switch-mode-btn']]);
        press('lockpicking-switch-mode-btn');                 // key -> pick again
        assert.deepEqual(ids(), [['lockpicking-switch-to-keys-btn']]);
        press('lockpicking-switch-to-keys-btn');              // and back to keys
        assert.equal(parent.keyMode, true);
        assert.equal(selections.length, 2);
        assert.equal(doc.strip.children.length, 1, 'never an empty or duplicate row');
        // No key held: picking leaves no key row
        parent.canSwitchToKeyMode = false;
        press('lockpicking-switch-mode-btn');
        assert.equal(doc.strip.children.length, 0);
    } finally {
        delete globalThis.document;
    }
});
