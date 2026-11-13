// A confirm holds the game's keys (UX slice 16 R1 M1, m10). While a gameConfirm is open,
// player.js's keydown handler drops every game key (E, F, Space, the arrows), so a second E
// press can't open a second copy of the same confirm and answering yes runs onConfirm once.
// confirm_action and the interaction warning also refuse to open while a confirm is open.
// The confirm focuses its cancel (safe) button, Enter presses the focused button and focus
// goes back where it was afterwards.
//
// The real notifications.js and modal-stack.js run against jsdom; the real apply-actions.js
// (its static imports stubbed) runs the confirm_action; player.js's real setupKeyboardInput
// is lifted from its source with its module state around it.
// Run with: bin/test-js test/js/confirm-holds-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src).replace(/'/g, '%27');

const dom = new JSDOM('<!doctype html><body><canvas tabindex="0" id="game"></canvas></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.gameState = { globalVariables: {} };

const { gameConfirm } = await import(pathToFileURL(join(js, 'systems/notifications.js')).href);
const { openModalCount } = await import(pathToFileURL(join(js, 'ui/modal-stack.js')).href);

// apply-actions.js, static imports stubbed; writeGlobal counts the onConfirm runs.
const dir = mkdtempSync(join(tmpdir(), 'confirm-keys-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });
const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(k){ globalThis.__writes.push(k); }')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), actionsSrc);
globalThis.__writes = [];
const { applyActions } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);

// player.js's real keydown handler, with the module state it closes over.
const playerSrc = readFileSync(join(js, 'core/player.js'), 'utf8');
const setupSrc = playerSrc.match(/function setupKeyboardInput\(\) \{[\s\S]*?\n\}/)[0];
const clearSrc = playerSrc.match(/function clearKeyboardMovement\(\) \{[\s\S]*?\n\}/)[0];
assert.match(playerSrc, /import \{ openModalCount \} from '\.\.\/ui\/modal-stack\.js';/);
const playerKeys = new Function('openModalCount', 'window', 'document', `
    let keyboardPaused = false; let isKeyboardMoving = false;
    const keyboardInput = { up: false, down: false, left: false, right: false, space: false, shift: false };
    const console = { log() {} };
    ${clearSrc}
    ${setupSrc}
    setupKeyboardInput();
    return { state: () => ({ ...keyboardInput, isKeyboardMoving }) };`)(openModalCount, window, document);

// What E does in the game: the nearest object is a switch whose interaction is a confirm_action.
const log = [];
window.tryInteractWithNearest = () => {
    log.push('interact');
    applyActions([{ type: 'confirm_action', text: 'Switch the breaker off?',
        confirmLabel: 'Switch off', cancelLabel: 'Leave it',
        onConfirm: [{ type: 'set_global', key: 'breaker_off', value: true }] }]);
};
window.createPlayerJump = () => log.push('jump');
window.playerCombat = { attack: () => log.push('punch'), startBlock: () => log.push('block'), endBlock() {} };

function press(key, target = document.body) {
    const ev = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(ev);
    return ev;
}
const overlays = () => document.querySelectorAll('.game-confirm-overlay');
const tick = () => new Promise((r) => setTimeout(r, 0));

function reset() {
    for (const o of overlays()) o.querySelector('.game-confirm-cancel')?.click();
    log.length = 0;
    globalThis.__writes = [];
}

test('a second E press opens no second confirm, and yes runs onConfirm once', async () => {
    reset();
    press('e');
    assert.equal(overlays().length, 1, 'the first E opens the confirm');
    press('e');
    press('e', document.querySelector('.game-confirm-cancel'));
    assert.equal(overlays().length, 1, 'more E presses open no second copy');
    assert.deepEqual(log, ['interact'], 'the game saw only the first E');
    assert.equal(openModalCount(), 1);
    document.querySelector('.game-confirm-ok').click();
    await tick();
    assert.deepEqual(globalThis.__writes, ['breaker_off'], 'onConfirm ran once');
    assert.equal(overlays().length, 0);
    press('e');
    assert.equal(overlays().length, 1, 'with the confirm answered, E works again');
});

test('confirm_action asked again while a confirm is open is dropped', async () => {
    reset();
    window.tryInteractWithNearest();
    window.tryInteractWithNearest();
    assert.equal(overlays().length, 1);
    document.querySelector('.game-confirm-ok').click();
    await tick();
    assert.deepEqual(globalThis.__writes, ['breaker_off']);
});

test('F, Space, Q and the arrows do nothing behind an open confirm, and a held arrow stops', () => {
    reset();
    press('ArrowLeft');
    assert.equal(playerKeys.state().isKeyboardMoving, true, 'walking before the confirm');
    gameConfirm('Sure?', 'Yes', 'No');
    for (const k of ['f', 'q', 'ArrowUp', 'd']) press(k);
    assert.deepEqual(log, [], 'no punch, block or jump');
    const s = playerKeys.state();
    assert.equal(s.isKeyboardMoving, false, 'the held arrow no longer walks');
    assert.equal(s.left || s.up || s.right, false);
    reset();
});

test('the confirm focuses its cancel button and Enter presses the focused one', async () => {
    reset();
    const canvas = document.getElementById('game');
    canvas.focus();
    const p = gameConfirm('Switch it off?', 'Switch off', 'Leave it');
    const cancel = document.querySelector('.game-confirm-cancel');
    assert.equal(document.activeElement, cancel, 'the safe choice has focus');
    const ev = press('Enter', cancel);
    assert.equal(ev.defaultPrevented, true);
    assert.equal(await p, false, 'Enter on the focused cancel answers no');
    assert.equal(document.activeElement, canvas, 'focus goes back to the game');

    const p2 = gameConfirm('Switch it off?', 'Switch off', 'Leave it');
    press('Tab', document.activeElement);
    assert.equal(document.activeElement, document.querySelector('.game-confirm-ok'), 'Tab moves to the other button');
    press(' ', document.activeElement);
    assert.equal(await p2, true, 'Space presses the focused button');
    assert.deepEqual(log, [], 'Space never reached the game as a jump');
});

test('the interaction warning opens no second confirm over an open one', async () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const fn = src.match(/export function maybeInteractionWarning\(sprite\) \{[\s\S]*?\n\}/)[0];
    assert.match(fn, /if \(window\.gameConfirmOpen\?\.\(\)\) return true;/);
    assert.ok(fn.indexOf('gameConfirmOpen') < fn.indexOf('window.gameConfirm(text'), 'checked before it opens');
    reset();
    gameConfirm('Sure?', 'Yes', 'No');
    assert.equal(window.gameConfirmOpen(), true);
    reset();
    assert.equal(window.gameConfirmOpen(), false);
});
