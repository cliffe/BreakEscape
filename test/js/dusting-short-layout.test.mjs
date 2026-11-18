// Sweep B7: at phone sizes the Dusting kit keeps Coverage, Lift and Change powder / Back in view
// (sticky action row) and, on a short landscape screen, uses two columns with a whole-number canvas scale.
// Static CSS checks plus the _layout scale arithmetic. Run with: node --test test/js/dusting-short-layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
const root = mkdtempSync(join(tmpdir(), 'dusting-short-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} }, innerWidth: 1280, innerHeight: 720 };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const mod = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { DustingMinigame, SHORT_LANDSCAPE_MAX_H } = mod;

const rule = sel => {
    const i = css.indexOf(sel + ' {');
    assert.ok(i >= 0, `rule ${sel} exists`);
    return css.slice(i, css.indexOf('}', i));
};

function layoutAt(w, h, step = 'dust') {
    window.innerWidth = w; window.innerHeight = h;
    const classes = new Set();
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, {
        step, canvas: { style: {} }, stageNote: null,
        root: { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } }
    });
    g._layout();
    return { scale: g.scale, px: parseInt(g.canvas.style.width, 10), short: classes.has('dusting-short') };
}

test('the action row (meters and buttons) is sticky to the bottom at phone width', () => {
    assert.match(css, /@media \(max-width: 760px\) \{[^@]*\.dusting-actions \{[^}]*position: sticky;[^}]*bottom: 0/);
    assert.match(rule('.dusting-short .dusting-actions'), /position: sticky/);
    assert.match(rule('.dusting-actions'), /background: var\(--d-bg\)/);
});

test('the dust and lift panels wrap their meters and buttons in .dusting-actions', () => {
    const dust = src.slice(src.indexOf('_htmlDust() {'), src.indexOf('_htmlLift() {'));
    assert.match(dust, /dusting-actions[\s\S]*cov-text[\s\S]*to-lift[\s\S]*change-powder/);
    const lift = src.slice(src.indexOf('_htmlLift() {'), src.indexOf('_htmlCompare() {'));
    assert.match(lift, /dusting-actions[\s\S]*tape-text[\s\S]*peel[\s\S]*back-dust/);
});

test('short landscape is a two-column grid, canvas left and controls right', () => {
    const r = rule('.dusting-short');
    assert.match(r, /display: grid/);
    assert.match(r, /grid-template-columns: auto minmax\(0, 1fr\)/);
    assert.match(rule('.dusting-short .dusting-main'), /display: contents/);
    assert.match(rule('.dusting-short .dusting-stage'), /grid-column: 1/);
    assert.match(rule('.dusting-short .dusting-panel'), /grid-column: 2/);
    assert.match(rule('.dusting-short .dusting-panel'), /overflow-y: auto/);
});

test('the added CSS keeps to the pixel-art rules: no radius, blur or gradient', () => {
    const added = css.slice(css.indexOf('Phone portrait and narrow screens'));
    assert.doesNotMatch(added, /border-radius|blur\(|gradient|text-shadow/);
    assert.doesNotMatch(added, /box-shadow:\s*[^n;]*\d+px\s+\d+px\s+\d+px/);
});

test('canvas scale is a whole number of at least 1x at every phone size, 2x on a 390 high landscape', () => {
    assert.equal(SHORT_LANDSCAPE_MAX_H, 500);
    for (const [w, h] of [[844, 390], [667, 375], [568, 320], [932, 430], [390, 844], [360, 640], [1280, 720]]) {
        const l = layoutAt(w, h);
        assert.ok(Number.isInteger(l.scale) && l.scale >= 1, `${w}x${h} scale ${l.scale}`);
        assert.equal(l.px, 128 * l.scale);
    }
    const land = layoutAt(844, 390);
    assert.equal(land.short, true);
    assert.equal(land.scale, 2, '256 px canvas, not the 130 px of the single-column layout');
    assert.ok(land.px + 100 <= 390, 'canvas plus chrome fits the height');
});

test('1280x720 desktop and 390x844 portrait keep the single-column layout and their scales', () => {
    const d = layoutAt(1280, 720);
    assert.equal(d.short, false);
    assert.equal(d.scale, 2);   // min(374, 1100, 512) / 128 floors to 2, as before
    const p = layoutAt(390, 844);
    assert.equal(p.short, false);
    assert.equal(p.scale, 2);
});
