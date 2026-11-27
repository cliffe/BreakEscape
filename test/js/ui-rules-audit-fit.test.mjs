// The UI rules audit's fit checks (tools/playtest/ui-rules-audit.mjs, UI shell build): a child
// cut off by an ancestor that hides overflow, or sitting before the start of a scroll box, is
// "clipped"; a scene frame past the viewport is "frame-offscreen"; content past the end of a
// scroll box is reachable and passes. jsdom has no layout, so each element's box is stubbed,
// and it does not expand the overflow shorthand, so the tests give overflow-x and overflow-y.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const { audit } = await import(pathToFileURL(join(here, '../../tools/playtest/ui-rules-audit.mjs')).href);

const rect = (l, t, w, h) => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h, x: l, y: t });

// boxes: selector -> [l, t, w, h]; the element's client size is its box (no borders here)
function page(html, boxes, { vw = 400, vh = 800 } = {}) {
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { pretendToBeVisual: true });
    const w = dom.window;
    Object.defineProperty(w, 'innerWidth', { value: vw, configurable: true });
    Object.defineProperty(w, 'innerHeight', { value: vh, configurable: true });
    for (const el of w.document.querySelectorAll('*')) el.style.opacity = el.style.opacity || '1';
    for (const [sel, [l, t, wd, h]] of Object.entries(boxes)) {
        for (const el of w.document.querySelectorAll(sel)) {
            el.getBoundingClientRect = () => rect(l, t, wd, h);
            Object.defineProperty(el, 'clientWidth', { value: wd, configurable: true });
            Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
        }
    }
    // anything unstubbed sits inside the window, 10x10 at the origin of its parent
    for (const el of w.document.querySelectorAll('*')) {
        if (!Object.prototype.hasOwnProperty.call(el, 'getBoundingClientRect')) el.getBoundingClientRect = () => rect(1, 1, 10, 10);
    }
    globalThis.window = w; globalThis.document = w.document; globalThis.getComputedStyle = w.getComputedStyle.bind(w);
    globalThis.innerWidth = vw; globalThis.innerHeight = vh;
    globalThis.HTMLElement = w.HTMLElement;
    return audit({ rootSel: '.minigame-container' });
}
const kinds = (r, k) => r.breaches.filter(b => b.kind === k);

const SHELL = { '.minigame-container': [0, 0, 400, 800], 'body': [0, 0, 400, 800], 'html': [0, 0, 400, 800] };

test('a button cut off by an overflow:hidden row is clipped (the padlock at 390)', () => {
    const r = page(`<div class="minigame-container"><div class="minigame-game-container"><div class="row" style="overflow-x:hidden;overflow-y:hidden">
        <button class="b1">Dial 1</button><button class="b2">Dial 2</button></div></div></div>`,
    { ...SHELL, '.minigame-game-container': [0, 0, 400, 800], '.row': [0, 100, 400, 100], '.b1': [-120, 120, 100, 40], '.b2': [150, 120, 100, 40] });
    const c = kinds(r, 'clipped');
    assert.equal(c.length, 1);
    assert.match(c[0].where, /button\.b1/);
});

test('content past the end of a scroll box is reachable; before its start is not', () => {
    const r = page(`<div class="minigame-container"><div class="minigame-game-container"><div class="list" style="overflow-y:auto">
        <span class="below">Row 9</span><span class="above">Header</span></div></div></div>`,
    { ...SHELL, '.minigame-game-container': [0, 0, 400, 800], '.list': [0, 100, 400, 200], '.below': [0, 400, 100, 20], '.above': [0, 40, 100, 20] });
    const c = kinds(r, 'clipped');
    assert.equal(c.length, 1);
    assert.match(c[0].where, /span\.above/);
    assert.match(c[0].detail, /before-top/);
});

test('a frame past the viewport is frame-offscreen; one inside is not', () => {
    const off = page('<div class="minigame-container"><div class="minigame-game-container"><p>Hi</p></div></div>',
        { ...SHELL, '.minigame-game-container': [0, -60, 400, 900] });
    assert.equal(kinds(off, 'frame-offscreen').length, 1);
    const on = page('<div class="minigame-container"><div class="minigame-game-container"><p>Hi</p></div></div>',
        { ...SHELL, '.minigame-game-container': [8, 8, 384, 784] });
    assert.equal(kinds(on, 'frame-offscreen').length, 0);
});

test('a block collapsed to nothing by its toggle (max-height 0) is not a clipped hit (m3)', () => {
    const r = page(`<div class="minigame-container"><div class="minigame-game-container"><div class="ctl" style="overflow-x:hidden;overflow-y:hidden">
        <input class="search" type="text"></div></div></div>`,
    { ...SHELL, '.minigame-game-container': [0, 0, 400, 800], '.ctl': [0, 100, 400, 0], '.search': [10, 110, 200, 30] });
    assert.equal(kinds(r, 'clipped').length, 0);
});

test('a scroll box that an outer hidden box cuts is reported, not passed (m4)', () => {
    const r = page(`<div class="minigame-container"><div class="minigame-game-container"><div class="outer" style="overflow-x:hidden;overflow-y:hidden">
        <div class="list" style="overflow-y:auto"><span class="row">Row</span></div></div></div></div>`,
    { ...SHELL, '.minigame-game-container': [0, 0, 400, 800], '.outer': [0, 100, 400, 100], '.list': [0, 150, 400, 300], '.row': [0, 160, 100, 20] });
    const c = kinds(r, 'clipped');
    assert.equal(c.length, 1);
    assert.match(c[0].detail, /cut \(y\)/);
});
