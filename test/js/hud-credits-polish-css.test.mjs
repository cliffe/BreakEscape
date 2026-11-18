// Sweep C (C2, C3, C9, C11): tray slots are whole-slot click targets, the objectives toggle has
// a 32px hit area, the HUD/inventory source carries no border-radius or gradient, and the
// credits VIS MODE grid is not clipped by its side panel.
// Run with: node --test test/js/hud-credits-polish-css.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const read = (f) => readFileSync(join(root, f), 'utf8');
const rule = (css, sel) => {
    const i = css.indexOf(`${sel} {`);
    assert.ok(i >= 0, `${sel} rule missing`);
    return css.slice(i, css.indexOf('}', i));
};

test('C9: inventory.css and hud.css have no rounded corners or gradients', () => {
    for (const f of ['css/inventory.css', 'css/hud.css']) {
        const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
        assert.doesNotMatch(css, /border-radius:(?!\s*0\s*;)/, `${f} rounds a corner`);
        assert.doesNotMatch(css, /gradient\(/, `${f} uses a gradient`);
    }
});

test('C3: the objectives toggle has a 32x32 hit area that does not move the layout', () => {
    const css = read('css/objectives.css');
    assert.match(rule(css, '.objectives-toggle'), /position: relative/);
    const r = rule(css, '.objectives-toggle::before');
    assert.match(r, /position: absolute/);
    assert.match(r, /width: 32px/);
    assert.match(r, /height: 32px/);
});

test('C11: the credits side panel scrolls instead of clipping, and the mode grid is compact', () => {
    const css = read('css/bond-visualiser.css');
    const panel = rule(css, '#bond-vis-overlay .bv-side-panel');
    assert.doesNotMatch(panel, /overflow:\s*hidden/);
    assert.match(panel, /overflow-y: auto/);
    assert.match(panel, /min-height: 0/);
    assert.match(rule(css, '#bond-vis-overlay .bv-mode-group-panel'), /grid-template-columns: repeat\(3/);
});

test('C11: the credits side panel scrollbar is the thin CRT green', () => {
    const css = read('css/bond-visualiser.css');
    const panel = rule(css, '#bond-vis-overlay .bv-side-panel');
    assert.match(panel, /scrollbar-width: thin/);
    assert.match(panel, /scrollbar-color: var\(--bv-green\) var\(--bv-green-dim\)/);
    assert.match(css, /\.bv-side-panel::-webkit-scrollbar-thumb \{[^}]*var\(--bv-green-dim\)/);
    assert.match(css, /\.bv-side-panel::-webkit-scrollbar-thumb \{[^}]*border-radius: 0/);
});

function load() {
    const src = read('js/systems/inventory.js');
    const fn = src.slice(src.indexOf('export function forwardSlotPointer'), src.indexOf('// Helper function to create'));
    const dom = new JSDOM('<div id="s"><img id="i"><span id="b"></span></div>');
    const { window } = dom;
    const labels = [];
    const make = new Function('MouseEvent', 'setHudLabel', 'clearHudLabel',
        fn.replace(/export function/g, 'function') + '; return { forwardSlotPointer, bindSlotHover };');
    const api = make(window.MouseEvent, (t) => labels.push(t), () => labels.push(null));
    const $ = (id) => window.document.getElementById(id);
    return { api, window, labels, slot: $('s'), img: $('i'), badge: $('b'), src };
}

test('C2: both tray builders wire the whole-slot click and hover; the slot is a pointer', () => {
    const src = read('js/systems/inventory.js');
    assert.equal(src.split('forwardSlotPointer(slot, itemImg)').length - 1, 2);
    assert.equal(src.split('bindSlotHover(slot, () =>').length - 1, 2);
    assert.doesNotMatch(src, /itemImg\.addEventListener\('mouse(enter|leave)'/, 'hover lives on the slot');
    // inventory.css is not loaded by the game; hud.css is
    assert.match(rule(read('css/hud.css'), '.inventory-slot'), /cursor: pointer/);
});

test('C2: a click on the slot margin or a non-img child reaches the img handler once', () => {
    const { api, window, slot, img, badge } = load();
    api.forwardSlotPointer(slot, img);
    const got = [];
    img.addEventListener('click', (e) => got.push([e.clientX, e.clientY]));
    slot.dispatchEvent(new window.MouseEvent('click', { clientX: 5, clientY: 9 }));
    assert.deepEqual(got, [[5, 9]]);
    badge.dispatchEvent(new window.MouseEvent('click', { bubbles: true, clientX: 1, clientY: 2 }));
    assert.deepEqual(got, [[5, 9], [1, 2]], 'a click on the badge opens the item');
    img.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(got.length, 3, 'a click on the img is not forwarded a second time');
});

test('C2: the hover label is set once and survives img to slot margin moves', () => {
    const { api, window, labels, slot, img } = load();
    api.bindSlotHover(slot, () => 'Phone');
    slot.dispatchEvent(new window.MouseEvent('mouseenter'));
    // the img's own mouseenter/mouseleave (pointer moving img to margin) do not reach the slot
    img.dispatchEvent(new window.MouseEvent('mouseleave'));
    img.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.deepEqual(labels, ['Phone'], 'not cleared while the pointer is still on the slot');
    slot.dispatchEvent(new window.MouseEvent('mouseleave'));
    assert.deepEqual(labels, ['Phone', null]);
});

test('C2: a key ring slot rebuilt or removed under the pointer clears the hover label first', () => {
    const src = read('js/systems/inventory.js');
    const re = /if \(keyRing\.slot\.matches\(':hover'\)\) clearHudLabel\(\);\s*keyRing\.slot\.remove\(\);/g;
    assert.equal((src.match(re) || []).length, 2, 'both key ring slot removals');
});
