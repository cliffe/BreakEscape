// `mg close` (the bridge's minigame.close) closes the CyberChef and lab-sheet popups. They are
// plain DOM popups, not registered with the minigame framework, so close() answered
// "no-active-minigame" while one was open and agents had to click the X. It now calls the
// popup's own close function (window.closeLaptop / closeLabWorkstation), which re-enables
// input and drains deferred barks and calls.
// Run with: node test/js/test-bridge-close-workstation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
// Copy list: minigames.js and its static imports (keep in step with its import lines)
const dir = mkdtempSync(join(tmpdir(), 'bridge-close-ws-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems/test-bridge'), { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
for (const f of ['systems/test-bridge/minigames.js', 'systems/test-bridge/input.js', 'utils/display-dashes.js', 'utils/overlay-open.js']) {
    writeFileSync(join(dir, f), readFileSync(join(js, f), 'utf8'));
}
writeFileSync(join(dir, 'systems/test-bridge/state.js'), 'export const activeMinigameSummary = () => null;\n');
writeFileSync(join(dir, 'systems/test-bridge/log.js'), 'export const logAction = () => {};\n');

const dom = new JSDOM('<!doctype html><html><body><div id="laptop-popup" style="display: none"></div><div id="lab-popup" style="display: none"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;

const { minigameBridge } = await import(pathToFileURL(join(dir, 'systems/test-bridge/minigames.js')));
// jsdom has no layout: size every element not display:none, so the real MinigameScene
// visibility helper (isTestVisible) is what close() consults for the X.
window.HTMLElement.prototype.getBoundingClientRect = function () {
    const shown = this.style.display !== 'none';
    return { width: shown ? 20 : 0, height: shown ? 20 : 0, left: 0, top: 0, right: 20, bottom: 20, x: 0, y: 0 };
};
const { MinigameScene } = await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/minigames/framework/base-minigame.js')));

// The real close functions' effects, in miniature: hide, re-enable input, drain barks
function rig(which) {
    const calls = [];
    const input = { mouse: { enabled: false }, keyboard: { enabled: false } };
    const closer = (id) => () => {
        document.getElementById(id).style.display = 'none';
        input.mouse.enabled = input.keyboard.enabled = true;
        calls.push(id);
    };
    window.game = { input };
    window.closeLaptop = closer('laptop-popup');
    window.closeLabWorkstation = closer('lab-popup');
    window.MinigameFramework = { currentMinigame: null };
    for (const id of ['laptop-popup', 'lab-popup']) document.getElementById(id).style.display = 'none';
    if (which) document.getElementById(which).style.display = 'block';
    return { calls, input };
}

test('close() shuts the CyberChef popup through closeLaptop', async () => {
    const r = rig('laptop-popup');
    const res = await minigameBridge.close();
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(res.closed, 'laptop');
    assert.equal(res.stillOpen, false);
    assert.deepEqual(r.calls, ['laptop-popup']);
    assert.equal(r.input.mouse.enabled && r.input.keyboard.enabled, true, 'input re-enabled');
});

test('close() shuts the lab sheet popup through closeLabWorkstation', async () => {
    const r = rig('lab-popup');
    const res = await minigameBridge.close();
    assert.equal(res.ok, true);
    assert.equal(res.closed, 'lab');
    assert.deepEqual(r.calls, ['lab-popup']);
});

test('close() with nothing open still says no-active-minigame', async () => {
    const r = rig(null);
    const res = await minigameBridge.close();
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'no-active-minigame');
    assert.deepEqual(r.calls, []);
});

test('a real minigame open over nothing else still closes by its X button, not the popup path', async () => {
    const r = rig(null);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const scene = new MinigameScene(host, { title: 'Chat' });
    scene.init();
    const x = scene.container.querySelector('.minigame-close-button');
    assert.ok(x, 'the real scene builds its X');
    let clicked = 0;
    x.addEventListener('click', () => { clicked++; window.MinigameFramework.currentMinigame = null; });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    const res = await minigameBridge.close();
    assert.equal(res.ok, true);
    assert.equal(clicked, 1);
    assert.equal(res.closed, undefined);
    assert.deepEqual(r.calls, []);
});

// A gameDisplay modal (a read note such as the sis02 NIS form) is a plain DOM overlay with only
// an X (.game-modal-close). `mg close` answered no-active-minigame and the harness had to click
// the X by hand.
function openGameDisplay() {
    const overlay = document.createElement('div');
    overlay.className = 'game-confirm-overlay';
    overlay.innerHTML = '<div class="game-confirm-dialog game-display-dialog"><button class="game-modal-close">x</button></div>';
    let clicked = 0;
    overlay.querySelector('.game-modal-close').addEventListener('click', () => { clicked++; overlay.remove(); });
    document.body.appendChild(overlay);
    return { overlay, clicks: () => clicked };
}

test('close() closes an open game-display modal with a click on its X', async () => {
    rig(null);
    const d = openGameDisplay();
    const res = await minigameBridge.close();
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(res.closed, 'game-display');
    assert.equal(res.stillOpen, false);
    assert.equal(d.clicks(), 1);
    assert.ok(document.querySelector('.game-display-dialog') === null);
});

test('close() with a game-display modal open over a popup closes the modal first', async () => {
    const r = rig('laptop-popup');
    const d = openGameDisplay();
    const res = await minigameBridge.close();
    assert.equal(res.closed, 'game-display');
    assert.equal(d.clicks(), 1);
    assert.deepEqual(r.calls, [], 'the popup under it is left open');
});

test('close() reports ok:false when the game-display modal does not close', async () => {
    rig(null);
    const overlay = document.createElement('div');
    overlay.innerHTML = '<div class="game-confirm-dialog game-display-dialog"><button class="game-modal-close">x</button></div>';
    document.body.appendChild(overlay); // the X does nothing
    const res = await minigameBridge.close();
    assert.equal(res.ok, false);
    assert.equal(res.stillOpen, true);
    assert.equal(res.reason, 'game-display-did-not-close');
    overlay.remove();
});
