// Player game keys leave the interface's keys alone (UI consoles 2 merge, coordinator fix).
// Space (and the arrows) must not jump or have preventDefault called while a minigame is open
// or the focus is on a button, input, textarea, select or contenteditable; in the world Space
// still jumps. player.js's real setupKeyboardInput is lifted from its source.
// Run with: bin/test-js test/js/player-keys-ui-owned.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const playerSrc = readFileSync(join(here, '../../public/break_escape/js/core/player.js'), 'utf8');
const grab = (re) => playerSrc.match(re)[0];
const setupSrc = grab(/function setupKeyboardInput\(\) \{[\s\S]*?\n\}/);
const clearSrc = grab(/function clearKeyboardMovement\(\) \{[\s\S]*?\n\}/);
const uiSrc = grab(/const FOCUSABLE_CONTROL = [^\n]*\n[\s\S]*?\nfunction keysBelongToUi\(event\) \{[\s\S]*?\n\}/);

const dom = new JSDOM('<!doctype html><body><canvas id="game"></canvas><button id="b">b</button>' +
    '<input id="i"><textarea id="t"></textarea><select id="s"></select>' +
    '<div id="ce" contenteditable="true"><span id="ce-in">x</span></div></body>', { pretendToBeVisual: true });
const { window, document } = dom.window;
window.__jumps = 0;
window.createPlayerJump = () => { window.__jumps++; };
window.playerCombat = { attack() {}, startBlock() {}, endBlock() {} };

const keys = new Function('openModalCount', 'window', 'document', `
    let keyboardPaused = false; let isKeyboardMoving = false;
    const keyboardInput = { up: false, down: false, left: false, right: false, space: false, shift: false };
    const console = { log() {} };
    ${clearSrc}
    ${uiSrc}
    ${setupSrc}
    setupKeyboardInput();
    return { state: () => ({ ...keyboardInput }) };`)(() => 0, window, document);

function press(type, key, target) {
    const ev = new window.KeyboardEvent(type, { key, bubbles: true, cancelable: true });
    target.dispatchEvent(ev);
    return ev;
}

test('in the world, Space still jumps and is consumed', () => {
    window.MinigameFramework = undefined;
    window.__jumps = 0;
    const down = press('keydown', ' ', document.getElementById('game'));
    assert.equal(window.__jumps, 1);
    assert.equal(down.defaultPrevented, true);
    assert.equal(keys.state().space, true);
    const up = press('keyup', ' ', document.getElementById('game'));
    assert.equal(up.defaultPrevented, true);
    assert.equal(keys.state().space, false);
});

test('with a minigame open, Space and the arrows are left to the minigame', () => {
    window.MinigameFramework = { currentMinigame: {} };
    window.__jumps = 0;
    for (const key of [' ', 'ArrowLeft']) {
        const down = press('keydown', key, document.body);
        const up = press('keyup', key, document.body);
        assert.equal(down.defaultPrevented, false, `${key} keydown not cancelled`);
        assert.equal(up.defaultPrevented, false, `${key} keyup not cancelled`);
    }
    assert.equal(window.__jumps, 0, 'no jump behind the scene');
    assert.deepEqual(keys.state(), { up: false, down: false, left: false, right: false, space: false, shift: false });
});

test('a focused button, input, textarea, select or contenteditable keeps Space', () => {
    window.MinigameFramework = undefined;
    window.__jumps = 0;
    for (const id of ['b', 'i', 't', 's', 'ce', 'ce-in']) {
        const el = document.getElementById(id);
        const down = press('keydown', ' ', el);
        const up = press('keyup', ' ', el);
        assert.equal(down.defaultPrevented, false, `${id} keydown not cancelled`);
        assert.equal(up.defaultPrevented, false, `${id} keyup not cancelled`);
    }
    assert.equal(window.__jumps, 0, 'no jump from a control');
});
