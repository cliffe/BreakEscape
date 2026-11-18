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

test('C2: a click or hover on the slot beside the img reaches the img handlers', () => {
    const src = read('js/systems/inventory.js');
    assert.match(src, /forwardSlotPointer\(slot, itemImg\)/, 'both tray builders wire it');
    assert.equal(src.split('forwardSlotPointer(slot, itemImg)').length - 1, 2);
    assert.match(rule(read('css/inventory.css'), '.inventory-slot'), /cursor: pointer/);
    const fn = src.slice(src.indexOf('export function forwardSlotPointer'), src.indexOf('// Helper function to create'));
    const dom = new JSDOM('<div id="s"><img id="i"><span id="b"></span></div>');
    const { window } = dom;
    const make = new Function('MouseEvent', fn.replace('export function', 'function') + '; return forwardSlotPointer;');
    const forward = make(window.MouseEvent);
    const slot = window.document.getElementById('s');
    const img = window.document.getElementById('i');
    forward(slot, img);
    const got = [];
    img.addEventListener('click', (e) => got.push(['click', e.clientX, e.clientY]));
    img.addEventListener('mouseenter', () => got.push(['enter']));
    slot.dispatchEvent(new window.MouseEvent('click', { clientX: 5, clientY: 9 }));
    assert.deepEqual(got, [['click', 5, 9]]);
    slot.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.equal(got.length, 2);
    // a click on the img itself is not forwarded a second time
    img.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(got.length, 3);
});
