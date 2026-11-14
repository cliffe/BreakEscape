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
    // press() sends no keyup: let every key come up, or the confirm's held-key guard sees it held.
    for (const key of ['e', 'f', 'q', 'd', ' ', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
        document.body.dispatchEvent(new window.KeyboardEvent('keyup', { key, bubbles: true }));
    }
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

function release(key, target = document.body) {
    target.dispatchEvent(new window.KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
}

test('repeated arrows on the focused button leave focus on the safe choice (R2 M1)', async () => {
    reset();
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) release(k);
    const p = gameConfirm('Disconnect the cable?', 'Disconnect', 'Leave it');
    const cancel = document.querySelector('.game-confirm-cancel');
    for (let i = 0; i < 3; i++) {
        const ev = new window.KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, cancelable: true });
        document.activeElement.dispatchEvent(ev);
        assert.equal(ev.defaultPrevented, true, 'a repeat never reaches the game or scrolls');
    }
    assert.equal(document.activeElement, cancel, 'focus is still on the cancel button');
    press('Enter', document.activeElement);
    assert.equal(await p, false);
});

test('an arrow held since before the confirm opened moves nothing until it comes up (R2 M1)', async () => {
    reset();
    press('ArrowRight');
    const p = gameConfirm('Disconnect the cable?', 'Disconnect', 'Leave it');
    const cancel = document.querySelector('.game-confirm-cancel');
    press('ArrowRight', cancel);
    press('ArrowRight', document.activeElement);
    assert.equal(document.activeElement, cancel, 'the held arrow (no repeat flag) does not move focus');
    release('ArrowRight', document.activeElement);
    press('ArrowRight', document.activeElement);
    assert.equal(document.activeElement, document.querySelector('.game-confirm-ok'), 'a fresh press after the keyup moves focus');
    press('Tab', document.activeElement);
    press('Enter', document.activeElement);
    assert.equal(await p, false);
});

test('a click on the dimmed backdrop keeps focus on the buttons (R2 m2)', async () => {
    reset();
    const p = gameConfirm('Sure?', 'Yes', 'No');
    const overlay = document.querySelector('.game-confirm-overlay');
    const onBack = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    overlay.dispatchEvent(onBack);
    assert.equal(onBack.defaultPrevented, true, 'the backdrop does not take focus');
    const onBtn = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.querySelector('.game-confirm-ok').dispatchEvent(onBtn);
    assert.equal(onBtn.defaultPrevented, false, 'a button still takes its click');
    document.querySelector('.game-confirm-cancel').click();
    assert.equal(await p, false);
});

test('a different confirm_action still opens over an open one; the same one is dropped (R2 m3)', async () => {
    reset();
    window.tryInteractWithNearest();
    applyActions([{ type: 'confirm_action', text: 'The timer asks something else?',
        confirmLabel: 'Do it', cancelLabel: 'Not now', onConfirm: [{ type: 'set_global', key: 'timer_yes', value: true }] }]);
    assert.equal(overlays().length, 2, 'a different confirm is not dropped');
    assert.equal(window.gameConfirmOpen('Switch the breaker off?'), true);
    assert.equal(window.gameConfirmOpen('Something not open'), false);
    window.tryInteractWithNearest();
    assert.equal(overlays().length, 2, 'the same confirm again is dropped');
    reset();
    await tick();
    assert.equal(window.gameConfirmOpen(), false);
    assert.equal(window.gameConfirmOpen('Switch the breaker off?'), false, 'the text count went back to zero');
});

test('the open count is taken only after the dialog is wired (R2 m3)', () => {
    const src = readFileSync(join(js, 'systems/notifications.js'), 'utf8');
    const fn = src.match(/export function gameConfirm\([\s\S]*?\n\}/)[0];
    const inc = fn.indexOf('openConfirms++');
    assert.ok(inc > fn.indexOf("cancelBtn.addEventListener('click'"), 'after the button listeners');
    assert.ok(inc > fn.indexOf("overlay.addEventListener('keydown'"), 'after the key listener');
    assert.ok(inc < fn.indexOf('document.body.appendChild(overlay)'), 'before the append');
    assert.ok(fn.indexOf('unregister = registerModal') > fn.indexOf("cancelBtn.addEventListener('click'"));
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
