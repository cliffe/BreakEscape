// window.__test.dismissBlockingUi (test-bridge/index.js). Hardening item 6: a click that
// lands on a real button but leaves the page still blocked (the overlay did not close, or it
// revealed a second one) used to answer ok:true with stillBlocked:true, so a caller that trusts
// `ok` carried on against a blocked UI. It now returns ok:false reason 'still-blocked-after-dismiss'.
// This regresses that branch: state.js (detectBlockingUi) and the DOM are stubbed so the second
// detect reports a lingering blocker, and the real index.js bridge is imported and driven.
// Run with: bin/test-js test/js/test-bridge-dismiss.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const bridgeSrc = join(here, '../../public/break_escape/js/systems/test-bridge');
const dir = mkdtempSync(join(tmpdir(), 'bridge-dismiss-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const sysBridge = join(dir, 'systems/test-bridge');
mkdirSync(sysBridge, { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
mkdirSync(join(dir, 'core'), { recursive: true });

// The one real module under test.
writeFileSync(join(sysBridge, 'index.js'), readFileSync(join(bridgeSrc, 'index.js'), 'utf8'));

// detectBlockingUi is driven per test off a global; the rest are inert named exports so
// index.js's imports resolve. sessionOverlayShowing stays false so the single button is clicked.
writeFileSync(join(sysBridge, 'state.js'),
    'export const detectBlockingUi = () => globalThis.__detect();\n' +
    'export const sessionOverlayShowing = () => false;\n' +
    'export const sessionOverlayButtons = () => [];\n' +
    ['getState', 'scanNearby', 'activeMinigameSummary', 'interactionMenuState', 'solveStandingPoint',
     'engineInteractDistance', 'plainNearestEntity', 'roomContents', 'doorways']
        .map(n => `export const ${n} = () => null;`).join('\n') + '\n');

writeFileSync(join(sysBridge, 'input.js'),
    'export const sleepFrames = async () => {};\n' +
    'export const sleep = async () => {};\n' +
    'export const clickElement = () => { globalThis.__clicked = true; };\n' +
    ['clickWorld', 'pressKey', 'keyDown', 'keyUp', 'worldToClient', 'isWorldPointOnScreen']
        .map(n => `export const ${n} = () => {};`).join('\n') + '\n');

writeFileSync(join(sysBridge, 'wait.js'),
    ['waitUntil', 'waitForGlobal', 'waitForEvent', 'waitForMovementEnd', 'waitFrames',
     'waitForMinigame', 'waitForMinigameClosed'].map(n => `export const ${n} = () => {};`).join('\n') + '\n');

writeFileSync(join(sysBridge, 'log.js'),
    'export const logAction = () => {};\nexport const logNote = () => {};\n' +
    'export const installEventCapture = () => true;\n' +
    ['drain', 'peek', 'clear', 'currentSeq', 'eventsSince'].map(n => `export const ${n} = () => null;`).join('\n') + '\n');

writeFileSync(join(sysBridge, 'minigames.js'), 'export const minigameBridge = {};\n');
writeFileSync(join(sysBridge, 'access.js'), 'export const accessBridge = {};\n');
writeFileSync(join(dir, 'utils/constants.js'), 'export const INTERACTION_RANGE = 1;\nexport const DOOR_INTERACTION_RANGE = 1;\n');
writeFileSync(join(dir, 'utils/overlay-open.js'), 'export const workstationPopupOpen = () => false;\n');
writeFileSync(join(dir, 'systems/interaction-reach.js'), 'export const reachX = () => 0;\n');
writeFileSync(join(dir, 'systems/interaction-walls.js'), 'export const wallClearFrom = () => true;\nexport const sameRoomFrom = () => true;\n');
writeFileSync(join(dir, 'core/player.js'), 'export const movePlayerToPoint = () => {};\n');

// A minimal DOM: one overlay panel holding one button, over a sized canvas.
const button = { innerText: 'OK', getBoundingClientRect: () => ({ left: 0, top: 0, width: 50, height: 20 }) };
const panel = { closest: () => panel, querySelectorAll: () => [button] };
const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
globalThis.document = {
    querySelector: (sel) => (sel.includes('canvas') ? canvas : null),
    elementsFromPoint: () => [panel],
    body: {}
};
globalThis.window = { game: { sys: { game: { canvas } } } };

const bridge = (await import(pathToFileURL(join(sysBridge, 'index.js')))).default;

// A sequence of detectBlockingUi() answers: first the guard (truthy to enter), then the post-click read.
function detectSequence(answers) {
    let i = 0;
    globalThis.__detect = () => (i < answers.length ? answers[i++] : null);
}

test('a click that leaves a second blocker returns ok:false, not ok:true (item 6 regression)', async () => {
    // guard sees a blocker; after the click a second blocker remains
    detectSequence([{ kind: 'overlay' }, { kind: 'overlay-2' }]);
    globalThis.__clicked = false;
    const r = await bridge.dismissBlockingUi();
    assert.equal(globalThis.__clicked, true, 'the real button was clicked');
    assert.equal(r.ok, false, 'a lingering blocker is reported as a failure, so a caller stops');
    assert.equal(r.reason, 'still-blocked-after-dismiss');
    assert.equal(r.stillBlocked, true);
    assert.deepEqual(r.blocker, { kind: 'overlay-2' }, 'the new blocker is handed back');
});

test('a click that clears the page returns ok:true with stillBlocked:false', async () => {
    detectSequence([{ kind: 'overlay' }]); // nothing left after the click
    const r = await bridge.dismissBlockingUi();
    assert.equal(r.ok, true);
    assert.equal(r.stillBlocked, false);
    assert.equal(r.clicked, 'OK');
});

test('nothing to dismiss answers ok:true nothingToDismiss', async () => {
    detectSequence([]); // no blocker at all
    const r = await bridge.dismissBlockingUi();
    assert.deepEqual(r, { ok: true, nothingToDismiss: true });
});
