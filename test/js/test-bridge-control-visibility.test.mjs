// getState().controls and clickControl / close() must agree on which controls exist. The
// minigame X (#minigame-close) is position:fixed, so its offsetParent is null in headless
// Chromium: an offsetParent filter dropped it, shifted every clickControl index by one
// against getState(), and made close() fall back to Esc. They now share MinigameScene's
// isTestVisible / getTestControlElements. jsdom has no layout, so the rects and the null
// offsetParent of the fixed X are mocked.
// Run with: node test/js/test-bridge-control-visibility.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
// Copy list: minigames.js and its static imports (keep in step with its import lines)
const dir = mkdtempSync(join(tmpdir(), 'bridge-ctl-vis-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems/test-bridge'), { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
for (const f of ['systems/test-bridge/minigames.js', 'systems/test-bridge/input.js', 'utils/display-dashes.js', 'utils/overlay-open.js']) {
    writeFileSync(join(dir, f), readFileSync(join(js, f), 'utf8'));
}
writeFileSync(join(dir, 'systems/test-bridge/state.js'), 'export const activeMinigameSummary = () => null;\n');
writeFileSync(join(dir, 'systems/test-bridge/log.js'), 'export const logAction = () => {};\n');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;

const { minigameBridge } = await import(pathToFileURL(join(dir, 'systems/test-bridge/minigames.js')));
const { MinigameScene } = await import(pathToFileURL(join(js, 'minigames/framework/base-minigame.js')));

// Layout stand-in: everything not display:none has a size; the fixed X has no offsetParent.
const proto = window.HTMLElement.prototype;
Object.defineProperty(proto, 'offsetParent', {
    get() { return (this.id === 'minigame-close' || this.id.startsWith('fx')) ? null : this.parentNode; }, configurable: true
});
proto.getBoundingClientRect = function () {
    const shown = this.style.display !== 'none' && this.style.visibility !== 'hidden';
    return { width: shown ? 20 : 0, height: shown ? 20 : 0, left: 0, top: 0, right: 20, bottom: 20, x: 0, y: 0 };
};

function open() {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new MinigameScene(document.getElementById('mg'), { title: 'Chat' });
    mg.init();
    const body = document.createElement('div');
    body.innerHTML = '<button id="a">Alpha</button><button id="hid" style="display:none">Hidden</button><button id="b">Beta</button>';
    mg.container.appendChild(body);
    window.MinigameFramework = { currentMinigame: mg, closed: 0 };
    mg.closeCalls = 0;
    mg.container.querySelector('#minigame-close').addEventListener('click', () => {
        mg.closeCalls++;
        window.MinigameFramework.currentMinigame = null;
    });
    return mg;
}

test('getState controls list the fixed X first, and clickControl uses the same indices', async () => {
    const mg = open();
    const ids = mg.getTestState().controls.map((c) => c.id);
    assert.equal(ids[0], 'minigame-close', 'X is control 0');
    assert.deepEqual(ids.slice(1), ['a', 'b'], 'hidden button not listed');
    const els = mg.getTestControlElements();
    assert.deepEqual(els.map((e) => e.id), ids, 'same elements, same order');
    const clicked = [];
    document.getElementById('b').addEventListener('click', () => clicked.push('b'));
    const idxB = ids.indexOf('b');
    const res = await minigameBridge.clickControl(idxB);
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.deepEqual(clicked, ['b'], 'index from getState hits the control it named');
});

test('clickControl(0) clicks the X and closes the minigame', async () => {
    const mg = open();
    const res = await minigameBridge.clickControl(0);
    assert.equal(res.ok, true);
    assert.equal(mg.closeCalls, 1);
});

test('close() clicks the X when it exists, rather than falling back to Esc', async () => {
    const mg = open();
    let esc = 0;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') esc++; });
    const res = await minigameBridge.close();
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(mg.closeCalls, 1, 'X clicked');
    assert.equal(esc, 0, 'no Esc fallback');
});

test('close() falls back to Esc when the X is hidden', async () => {
    const mg = open();
    mg.container.querySelector('#minigame-close').style.display = 'none';
    let esc = 0;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') esc++; });
    await minigameBridge.close();
    assert.equal(mg.closeCalls, 0);
    assert.ok(esc >= 1, 'Esc sent');
});

// Fields: type / select take their list from getTestFieldElements, the source of getState().fields.
function openFields(html) {
    const mg = open();
    const body = document.createElement('div');
    body.innerHTML = html;
    mg.container.appendChild(body);
    return mg;
}

test('type(index) writes to the field getState().fields names, for a position:fixed field', async () => {
    // fx1 stands for an input in a fixed modal: null offsetParent, plainly on screen
    const mg = openFields('<input id="f0"><input id="fx1"><input id="f2">');
    const fields = mg.getTestState().fields;
    assert.deepEqual(fields.map((f) => f.id), ['f0', 'fx1', 'f2']);
    const res = await minigameBridge.type(1, 'hello');
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(document.getElementById('fx1').value, 'hello');
    assert.equal(document.getElementById('f2').value, '');
});

test('a visibility:hidden field is in neither list, so later type indices stay aligned', async () => {
    const mg = openFields('<input id="f0"><input id="hid" style="visibility:hidden"><input id="f2">');
    assert.deepEqual(mg.getTestState().fields.map((f) => f.id), ['f0', 'f2']);
    await minigameBridge.type(1, 'x');
    assert.equal(document.getElementById('f2').value, 'x');
    assert.equal(document.getElementById('hid').value, '');
});

test('select(index) uses the same field list, and the 30-field cap applies to type', async () => {
    const mg = openFields('<input id="fx0"><select id="s1"><option value="a">A</option><option value="b">B</option></select>');
    const idx = mg.getTestState().fields.findIndex((f) => f.id === 's1');
    const res = await minigameBridge.select(idx, 'B');
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(document.getElementById('s1').value, 'b');

    const many = openFields(Array.from({ length: 35 }, (_, i) => `<input id="m${i}">`).join(''));
    assert.equal(many.getTestFieldElements().length, 30);
    assert.equal(many.getTestState().fields.length, 30);
    const over = await minigameBridge.type(31, 'z');
    assert.equal(over.ok, false, 'index past the 30 cap is not a field');
});
