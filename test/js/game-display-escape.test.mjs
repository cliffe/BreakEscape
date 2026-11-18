// Escape closes the read-in-place overlay (gameDisplay: notes, signs, plaques, the m04 HMI).
// The engine already closes it through ui/modal-stack.js; what failed was the test bridge:
// pressKey("Escape") answered blocking-ui (the overlay sits over the canvas) and never sent
// the key, so a harness had to click the X. It now delivers Escape to a gameDisplay or
// gameConfirm dialog and still refuses every other key and every other blocker.
// Also checks the engine side with the real notifications.js + modal-stack.js: Esc closes it,
// focus goes back, the event is stopped (the game menu never sees it), a second open stacks and
// Esc closes the newest first.
// Run with: node --max-old-space-size=2048 test/js/game-display-escape.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// ---- Part 1: the bridge's pressKey (copy of test-bridge-dismiss.test.mjs rig) ----
const dir = mkdtempSync(join(tmpdir(), 'gd-escape-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const sysBridge = join(dir, 'systems/test-bridge');
mkdirSync(sysBridge, { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
mkdirSync(join(dir, 'core'), { recursive: true });
writeFileSync(join(sysBridge, 'index.js'), readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8'));
writeFileSync(join(sysBridge, 'state.js'),
    'export const detectBlockingUi = () => globalThis.__detect();\n' +
    'export const sessionOverlayShowing = () => false;\n' +
    'export const sessionOverlayButtons = () => [];\n' +
    'export const interactionMenuState = () => null;\n' +
    'export const activeMinigameSummary = () => globalThis.__minigame || null;\n' +
    ['getState', 'scanNearby', 'solveStandingPoint', 'engineInteractDistance', 'plainNearestEntity', 'roomContents', 'doorways']
        .map(n => `export const ${n} = () => null;`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'input.js'),
    'export const sleepFrames = async () => {};\nexport const sleep = async () => {};\n' +
    'export const pressKey = async (k) => { (globalThis.__keys ||= []).push(k); if (k === "Escape" && globalThis.__escCloses) globalThis.__overlay = false; };\n' +
    'export const clickElement = () => {};\n' +
    ['clickWorld', 'keyDown', 'keyUp', 'worldToClient', 'isWorldPointOnScreen', 'getScene']
        .map(n => `export const ${n} = () => {};`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'wait.js'),
    ['waitUntil', 'waitForGlobal', 'waitForEvent', 'waitForMovementEnd', 'waitFrames', 'waitForMinigame', 'waitForMinigameClosed']
        .map(n => `export const ${n} = () => {};`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'log.js'),
    'export const logAction = () => {};\nexport const logNote = () => {};\nexport const installEventCapture = () => true;\n' +
    ['drain', 'peek', 'clear', 'currentSeq', 'eventsSince'].map(n => `export const ${n} = () => null;`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'minigames.js'), 'export const minigameBridge = {};\n');
writeFileSync(join(sysBridge, 'access.js'), 'export const accessBridge = {};\n');
writeFileSync(join(sysBridge, 'throttle.js'), 'export const throttleFps = async () => ({}); export const unthrottleFps = async () => ({});\n');
writeFileSync(join(sysBridge, 'aim.js'), 'export const chooseAimPoint = () => null;\nexport const rivalsAt = () => [];\n');
writeFileSync(join(dir, 'systems/tap-pick.js'), 'export const opaqueAt = () => true;\n');
writeFileSync(join(dir, 'utils/constants.js'), 'export const INTERACTION_RANGE = 1;\nexport const DOOR_INTERACTION_RANGE = 1;\n');
writeFileSync(join(dir, 'utils/overlay-open.js'), 'export const workstationPopupOpen = () => false;\n');
writeFileSync(join(dir, 'systems/interaction-reach.js'), 'export const reachX = () => 0;\nexport const reachY = () => 0;\n');
writeFileSync(join(dir, 'systems/interaction-walls.js'), 'export const wallClearFrom = () => true;\nexport const sameRoomFrom = () => true;\n');
writeFileSync(join(dir, 'core/player.js'), 'export const movePlayerToPoint = () => {};\n');

globalThis.__overlay = true;
const stubDoc = {
    querySelector: (sel) => (globalThis.__overlay && /game-display-dialog/.test(sel) ? { className: 'game-display-dialog' } : null),
    elementsFromPoint: () => [],
    body: {}
};
const stubWin = { game: {} };
globalThis.document = stubDoc;
globalThis.window = stubWin;
const bridge = (await import(pathToFileURL(join(sysBridge, 'index.js')))).default;

function reset({ overlay = true, closes = true } = {}) {
    globalThis.document = stubDoc;
    globalThis.window = stubWin;
    globalThis.__keys = [];
    globalThis.__overlay = overlay;
    globalThis.__escCloses = closes;
    globalThis.__minigame = null;
    globalThis.__detect = () => (globalThis.__overlay ? { kind: 'overlay', classes: 'game-confirm-overlay' } : null);
}

test('pressKey Escape reaches an open gameDisplay and reports it closed', async () => {
    reset();
    const r = await bridge.pressKey('Escape');
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual(globalThis.__keys, ['Escape']);
    assert.equal(r.toOverlay, true);
    assert.equal(r.stillOpen, false);
});

test('pressKey Escape reports stillOpen when a second note is stacked behind the first', async () => {
    reset({ closes: false });
    const r = await bridge.pressKey('Escape');
    assert.equal(r.ok, true);
    assert.equal(r.stillOpen, true);
});

test('other keys stay refused while the note is open (the dialog holds the game keys)', async () => {
    reset();
    const r = await bridge.pressKey('e');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'blocking-ui');
    assert.deepEqual(globalThis.__keys, []);
});

test('Escape over a different blocker is still refused', async () => {
    reset({ overlay: false });
    globalThis.__detect = () => ({ kind: 'other' });
    const r = await bridge.pressKey('Escape');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'blocking-ui');
});

test('an active minigame keeps its refusal even with a note up', async () => {
    reset();
    globalThis.__minigame = { id: 'lockpick' };
    const r = await bridge.pressKey('Escape');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'minigame-active');
});

// ---- Part 2: the engine overlay, real notifications.js + modal-stack.js ----
const dom = new JSDOM('<!doctype html><html><body><button id="prev">prev</button></body></html>', { pretendToBeVisual: true });
const eng = mkdtempSync(join(tmpdir(), 'gd-escape-eng-'));
writeFileSync(join(eng, 'package.json'), '{"type":"module"}\n');
for (const f of ['systems/notifications.js', 'ui/modal-stack.js', 'utils/display-dashes.js', 'utils/overlay-open.js']) {
    mkdirSync(dirname(join(eng, f)), { recursive: true });
    writeFileSync(join(eng, f), readFileSync(join(js, f), 'utf8'));
}
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { gameDisplay } = await import(pathToFileURL(join(eng, 'systems/notifications.js')));
const useEngineDom = () => { globalThis.window = dom.window; globalThis.document = dom.window.document; };

function esc(extra = {}) {
    const ev = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...extra });
    let reachedBubble = false;
    dom.window.addEventListener('keydown', () => { reachedBubble = true; }, { once: true });
    document.activeElement.dispatchEvent(ev);
    return { ev, reachedBubble };
}

test('Escape closes the note, returns focus and never reaches a window-level (game menu) handler', async () => {
    useEngineDom();
    const prev = document.getElementById('prev');
    prev.focus();
    const done = gameDisplay('Hello', 'Note');
    assert.ok(document.querySelector('.game-display-dialog'));
    assert.equal(document.activeElement.className, 'game-modal-close', 'focus starts on the X');
    const { ev, reachedBubble } = esc();
    await done;
    assert.equal(document.querySelector('.game-display-dialog'), null);
    assert.equal(document.activeElement, prev, 'focus returns');
    assert.equal(ev.defaultPrevented, true);
    assert.equal(reachedBubble, false, 'the Escape does not leak to the game menu');
});

test('a second note opened over the first stacks; Escape closes the newest first', async () => {
    useEngineDom();
    let order = [];
    const a = gameDisplay('first', 'A').then(() => order.push('A'));
    const b = gameDisplay('second', 'B').then(() => order.push('B'));
    assert.equal(document.querySelectorAll('.game-display-dialog').length, 2);
    esc();
    await b;
    assert.deepEqual(order, ['B']);
    assert.equal(document.querySelectorAll('.game-display-dialog').length, 1);
    esc();
    await a;
    assert.deepEqual(order, ['B', 'A']);
});
