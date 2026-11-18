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
    '../utils/lock-scope-refusal.js': dataUrl(read('utils/lock-scope-refusal.js')),
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
test('startLockpickingMinigame: a key opening it reports method key', () => {
    const { body, sm } = pickParams();
    const cbStart = body.indexOf('onComplete: (success, result) =>', sm);
    const cb = body.slice(cbStart + 'onComplete: '.length, body.indexOf('\n    });', cbStart));
    const make = (km) => {
        const toasts = []; const got = [];
        const w = { MinigameFramework: { currentMinigame: { keyMode: km } }, gameAlert: (m, k) => toasts.push([m, k]) };
        new Function('window', 'lockable', 'callback', `return (${cb});`)(w, {}, (...a) => got.push(a))(true, {});
        return { toasts, got };
    };
    const key = make(true);
    assert.deepEqual(key.got[0], [true, { method: 'key' }]);
    assert.match(key.toasts[0][0], /correct key/);
    const pick = make(false);
    assert.deepEqual(pick.got[0], [true, { method: 'lockpick' }]);
    assert.match(pick.toasts[0][0], /picked the lock/);
});
test('the caller tells the server the method the minigame reports', () => {
    const src = read('systems/unlock-system.js');
    assert.match(src, /outcome\?\.method === 'key' \? 'key' : 'lockpick'/);
    assert.match(src, /notifyServerUnlock\(lockable, type, method\)/);
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
test('the game builds the caption only in key mode, next to the pick button; CSS stays pixel-art', () => {
    const game = read('minigames/lockpicking/lockpicking-game-phaser.js');
    const keyBranch = game.slice(game.indexOf('if (this.canSwitchToPickMode && this.keyMode)'), game.indexOf('else if (this.canSwitchToKeyMode'));
    assert.match(keyBranch, /appendChild\(createPickCaption\(\)\);\s*buttonContainer\.appendChild\(switchModeBtn\)/);
    const tm = read('minigames/lockpicking/tool-manager.js');
    assert.match(tm, /buttonContainer\.appendChild\(createPickCaption\(\)\);\s*buttonContainer\.appendChild\(switchModeBtn\)/, 'also after switching back from pick mode');
    assert.match(tm, /getElementById\('lockpicking-or-caption'\)/, 'hidden with the button when picking starts');
    const css = readFileSync(join(js, '../css/lockpicking.css'), 'utf8');
    const rule = css.slice(css.indexOf('.lockpicking-or-caption {'), css.indexOf('}', css.indexOf('.lockpicking-or-caption {')));
    assert.match(rule, /font-family: 'GNF'/);
    assert.match(rule, /font-size: 16px/);
    assert.doesNotMatch(rule, /radius|shadow|gradient/);
    assert.match(css, /@media \(max-width: 768px\) \{\s*\.lockpicking-or-caption \{\s*flex: 0 0 100%/, 'own line on a phone');
});
