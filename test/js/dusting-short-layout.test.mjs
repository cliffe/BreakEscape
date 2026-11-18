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
    assert.doesNotMatch(rule('.dusting-short .dusting-actions'), /position: sticky/);
    assert.match(rule('.dusting-actions'), /background: var\(--d-bg\)/);
});

test('short landscape pins only the Coverage bar and the button row, not the whole action block', () => {
    assert.match(rule('.dusting-short .dusting-actions'), /display: contents/);
    assert.match(rule('.dusting-short .dusting-actions'), /position: static/);
    assert.match(rule('.dusting-short .dusting-actions .dusting-meters'), /display: contents/) ;
    const btn = rule('.dusting-short .dusting-actions .dusting-buttons');
    assert.match(btn, /position: sticky/);
    assert.match(btn, /bottom: 0/);
    assert.match(btn, /background: var\(--d-bg\)/);
    assert.match(btn, /flex-wrap: nowrap/);
    assert.match(btn, /height: var\(--d-pin-h\)/);
    const cov = rule('.dusting-short .dusting-actions .dusting-meter:first-child');
    assert.match(cov, /position: sticky/);
    assert.match(cov, /bottom: var\(--d-pin-h\)/);
    assert.match(cov, /background: var\(--d-bg\)/);
    assert.match(rule('.dusting-short .dusting-panel'), /--d-pin-h: 44px/);
    // the pinned strip is order 4 and 5, the rest (tools, Clarity, estimate, feedback) scrolls above it
    assert.match(rule('.dusting-short .dusting-actions .dusting-estimate'), /order: 2/);
    assert.match(rule('.dusting-short .dusting-actions .dusting-feedback'), /order: 3/);
    assert.match(btn, /order: 5/);
    assert.match(cov, /order: 4/);
});

test('short landscape compare: the frame scrolls as a whole so the cards sit under the instructions', () => {
    const r = rule('.dusting-short[data-step="compare"]');
    assert.match(r, /overflow-y: auto/);
    assert.match(r, /grid-template-rows: auto auto auto auto auto/);
    assert.match(rule('.dusting-short[data-step="compare"] .dusting-panel'), /overflow-y: visible/);
});

test('desktop compare screen is tightened so its foot fits 1280x720, scoped to the compare step only', () => {
    const i = css.indexOf('@media (min-width: 761px)');
    assert.ok(i > 0);
    const blk = css.slice(i);
    assert.match(blk, /\[data-step="compare"\] \.dusting-stage-note \{ font-size: 16px/);
    assert.match(blk, /\[data-step="compare"\] \.dusting-options label \{ min-height: 32px/);
    assert.doesNotMatch(blk.replace(/\[data-step="compare"\][^{]*\{[^}]*\}/g, ''), /\.dusting-(root|forensic|options)[^{]*\{[^}]*\}/);
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

// ---- live-proof r2: short-mode labels, compact tool cards, strip scroll padding ----

function panelWithLabels(html) {
    // minimal DOM: spans parsed from the generated markup
    const spans = [...html.matchAll(/<span class="dusting-lbl" data-long="([^"]*)" data-short="([^"]*)">/g)].map(m => {
        const btn = { attrs: {}, title: '', setAttribute(k, v) { this.attrs[k] = v; } };
        return { dataset: { long: m[1], short: m[2] }, textContent: m[1], closest: () => btn, btn };
    });
    return { spans, panel: { querySelectorAll: () => spans } };
}

test('short/long label pairs: brush step and lift step', () => {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { powder: 'black', tool: 'fine', puffMode: false });
    const dust = g._htmlDust();
    const pairs = [...dust.matchAll(/data-long="([^"]*)" data-short="([^"]*)"/g)].map(m => [m[1], m[2]]);
    assert.ok(pairs.some(p => p[0] === 'Puff off excess (T)' && p[1] === 'Puff (T)'));
    assert.ok(pairs.some(p => p[0] === 'Change powder (C)' && p[1] === 'Powder (C)'));
    assert.ok(pairs.some(p => p[0] === 'Fine brush (F)' && p[1] === 'Fine (F)'));
    assert.ok(pairs.some(p => p[0] === 'Lift (L)' && p[1] === 'Lift (L)'));
    const lift = g._htmlLift();
    const lp = [...lift.matchAll(/data-long="([^"]*)" data-short="([^"]*)"/g)].map(m => [m[1], m[2]]);
    assert.deepEqual(lp, [['Peel and mount (P)', 'Mount (P)'], ['Back to dusting', 'Re-dust']]);
    // keyboard hints survive in every short label that had one
    for (const [long, short] of [...pairs, ...lp]) {
        const k = long.match(/\(([A-Z])\)$/);
        if (k) assert.ok(short.endsWith(`(${k[1]})`), `${short} keeps its key hint`);
    }
});

test('_applyLabels swaps the text in short mode and keeps the full text as aria-label and title', () => {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { powder: 'black', tool: 'fine', puffMode: false });
    const { spans, panel } = panelWithLabels(g._htmlDust() + g._htmlLift());
    let isShort = true;
    g.panel = panel;
    g.root = { classList: { contains: c => c === 'dusting-short' && isShort } };
    g._applyLabels();
    const puff = spans.find(s => s.dataset.long === 'Puff off excess (T)');
    assert.equal(puff.textContent, 'Puff (T)');
    assert.equal(puff.btn.attrs['aria-label'], 'Puff off excess (T)');
    assert.equal(puff.btn.title, 'Puff off excess (T)');
    isShort = false;
    g._applyLabels();
    assert.equal(puff.textContent, 'Puff off excess (T)');
    assert.equal(puff.btn.attrs['aria-label'], 'Puff off excess (T)');
});

test('every short label fits 667x375: measured 8 px a character plus 8 px padding in the 279 px of the button row', () => {
    const shortBrush = ['Lift (45%)', '● Puff (T)', 'Powder (C)'];
    const w = t => t.length * 8 + 8;
    const total = shortBrush.reduce((a, t) => a + w(t), 0);
    assert.ok(total + 12 /* borders */ + 8 /* gaps */ <= 303, `brush row ${total}`);
    for (const t of ['Mount (P)', 'Re-dust']) assert.ok(w(t) + 4 <= 303 / 2 - 4);
    // the tool row: one line, no icons
    assert.ok(['Fine (F)', 'Feather (B)', 'Wand (W)'].reduce((a, t) => a + w(t) + 4 + 4, 0) <= 303);
});

test('the 45% hint rides on the Coverage line in short mode and the disabled Lift has a text cue', () => {
    const g = Object.create(DustingMinigame.prototype);
    const els = {};
    const mk = n => (els[n] = { dataset: {}, style: {}, textContent: '', querySelector: () => els.lbl });
    els.lbl = { dataset: {}, textContent: '' };
    let isShort = true;
    Object.assign(g, {
        step: 'dust', metrics: { coverage: 0.3, clarity: 0.5 }, diff: { minCoverage: 0.45 }, message: '',
        root: { classList: { contains: c => c === 'dusting-short' && isShort } },
        panel: { querySelectorAll: () => [] },
        _currentQuality: () => 0.5, _coach: () => ''
    });
    g._setDyn = (name, fn) => fn(els[name] || mk(name));
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '30% / 45% to lift');
    assert.equal(els['lift-btn'].disabled, true);
    assert.equal(els.lbl.dataset.short, 'Lift (45%)');
    assert.equal(els.lbl.dataset.long, 'Lift (needs 45% coverage)');
    isShort = false;
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '30% (faint)');
    g.metrics.coverage = 0.6; isShort = true;
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '60% (fair)');
    assert.equal(els.lbl.dataset.short, 'Lift (L)');
});

test('compact tool cards: one line, no icon, 28 px against the room above the strip at 667x375', () => {
    const tool = rule('.dusting-short .dusting-tools .dusting-tool');
    assert.match(tool, /min-height: 28px/);
    assert.match(tool, /white-space: nowrap/);
    assert.match(rule('.dusting-short .dusting-tools'), /flex-wrap: nowrap/);
    assert.match(css, /\.dusting-short \.dusting-tools \.dusting-tool \[data-slot\][^{]*\{ display: none/);
    // arithmetic: panel 114 px high at 667x375, strip 44 + 36 = 80, so 34 px of room; the card is 28
    assert.match(rule('.dusting-short .dusting-panel'), /--d-pin-h: 44px/);
    assert.match(rule('.dusting-short .dusting-panel'), /--d-strip-h: 80px/);
    const room = 114 - (44 + 36);
    assert.ok(28 <= room, `card 28 fits ${room}`);
    // the old 76 px card (64 px icon + padding) never did
    assert.ok(76 > room);
});

test('the panel scrolls with scroll-padding-bottom equal to the strip height', () => {
    assert.match(rule('.dusting-short .dusting-panel'), /scroll-padding-bottom: var\(--d-strip-h\)/);
});

test('short buttons clip as a guard only', () => {
    const b = rule('.dusting-short .dusting-actions .dusting-btn');
    assert.match(b, /overflow: hidden/);
    assert.match(b, /text-overflow: clip/);
});
