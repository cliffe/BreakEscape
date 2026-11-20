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
const { DustingMinigame, SHORT_LANDSCAPE_MAX_H, FEATHER_SUGGESTION, foggyCoach } = mod;

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
        panel: { querySelectorAll: () => [] },
        root: { classList: { contains: c => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } }
    });
    g._layout();
    return { scale: g.scale, px: parseInt(g.canvas.style.width, 10), short: classes.has('dusting-short') };
}

test('the action row (meters and buttons) is in normal flow at phone portrait width, so no control sits under a strip at scroll 0', () => {
    // live r3: the pinned strip was 130 to 280 px of an 844 px frame and covered the tool buttons
    const media = css.match(/@media \(max-width: 760px\) \{\s*\.dusting-actions \{[^}]*\}/);
    assert.ok(media, 'phone-width .dusting-actions rule exists');
    assert.match(media[0], /position: static/);
    assert.doesNotMatch(media[0], /position: sticky/);
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

// ---- live-proof r2: short-mode labels, compact tools, strip scroll padding ----

const textOf = html => html.replace(/<[^>]+>/g, '');
// What a browser draws and what the accessibility tree names, from generated label markup. Short mode: .dusting-lx is
// display:none, .dusting-ls is visually hidden but named. Long mode: .dusting-ls is display:none. {v} spans swap to data-short.
const names = (html, short) => {
    const swap = html.replace(/<span class="dusting-lv" data-long="([^"]*)" data-short="([^"]*)">[^<]*<\/span>/g, (_, l, s) => (short ? s : l));
    const gone = swap.replace(short ? /<span class="dusting-lx">[^<]*<\/span>/g : /<span class="dusting-ls">[^<]*<\/span>/g, '');
    const visible = textOf(gone.replace(/<span class="dusting-ls">[^<]*<\/span>/g, '')).replace(/\s+/g, ' ').trim();
    return { visible, accessible: textOf(gone).replace(/\s+/g, ' ').trim() };
};

function fakeSpans(html) {
    // the swapped (.dusting-lv) spans in generated markup, as minimal DOM nodes with a write counter
    return [...html.matchAll(/<span class="dusting-lv" data-long="([^"]*)" data-short="([^"]*)">/g)].map(m => {
        const o = { dataset: { long: m[1], short: m[2] }, writes: 0, _t: m[1] };
        Object.defineProperty(o, 'textContent', { get() { return this._t; }, set(v) { this._t = v; this.writes++; } });
        return o;
    });
}

test('short/long labels: visible short text sits inside the accessible name (hidden words, no aria-label)', () => {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { powder: 'black', tool: 'fine', puffMode: false });
    const dust = g._htmlDust();
    const lift = g._htmlLift();
    assert.doesNotMatch(dust + lift, /dusting-btn[^>]*aria-label/);
    // long words (.dusting-lx) show in long mode only; short mode appends the detail (.dusting-ls) after the visible text
    assert.match(dust, /Puff<span class="dusting-lx"> off excess<\/span> \(T\)<span class="dusting-ls">, puff off excess<\/span>/);
    assert.match(dust, /Fine<span class="dusting-lx"> brush<\/span> \(F\)<span class="dusting-ls">, fine brush<\/span>/);
    assert.match(dust, /<span class="dusting-lx">Change <\/span><span class="dusting-lv" data-long="powder" data-short="Powder">powder<\/span> \(C\)/);
    assert.match(lift, /<span class="dusting-lx">Peel and <\/span><span class="dusting-lv" data-long="mount" data-short="Mount">mount<\/span> \(P\)/);
    assert.match(lift, /Back<span class="dusting-lx"> to dusting<\/span><span class="dusting-ls">, back to dusting<\/span>/);
    // full text as the title
    assert.match(dust, /title="Puff off excess \(T\)"/);
    assert.match(dust, /title="Change powder \(C\)"/);
    assert.match(lift, /title="Back to dusting"/);
    assert.match(css, /\.dusting-short \.dusting-lx \{ display: none; \}/);
    assert.match(css, /\.dusting-short \.dusting-ls \{[^}]*overflow: hidden[^}]*clip: rect/);
    assert.match(css, /\.dusting-root:not\(\.dusting-short\) \.dusting-ls \{ display: none; \}/);
    // long mode shows the whole text: every rule that touches these spans is scoped to short mode, bar the one that hides the detail
    const sels = [...css.matchAll(/(^|\n)([^\n{}*/]*\.dusting-l[xs][^\n{]*)\{/g)].map(m => m[2].trim());
    assert.ok(sels.length >= 3);
    for (const s of sels) assert.match(s, /^\.dusting-short |^\.dusting-root:not\(\.dusting-short\) /, s);
});

test('_applyLabels swaps the {v} parts by mode and writes only what changed', () => {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { powder: 'black', tool: 'fine', puffMode: false });
    const spans = fakeSpans(g._htmlDust() + g._htmlLift());
    assert.ok(spans.length >= 2);
    let isShort = true;
    g.panel = { querySelectorAll: () => spans };
    g.root = { classList: { contains: c => c === 'dusting-short' && isShort } };
    g._applyLabels();
    assert.deepEqual(spans.map(s => s.textContent), spans.map(s => s.dataset.short));
    const w = spans.map(s => s.writes);
    g._applyLabels(); g._applyLabels();
    assert.deepEqual(spans.map(s => s.writes), w, 'no rewrite when nothing changed');
    isShort = false;
    g._applyLabels();
    assert.deepEqual(spans.map(s => s.textContent), spans.map(s => s.dataset.long));
});

test('the visible short labels fit 667x375: 8 px a character plus 8 px padding in the 303 px button row', () => {
    const w = t => t.length * 8 + 8;
    const brush = ['Lift (45%)', '\u25CF Puff (T)', 'Powder (C)'];
    const total = brush.reduce((a, t) => a + w(t), 0);
    assert.ok(total + 12 + 8 <= 303, `brush row ${total}`);
    assert.ok(['Mount (P)', 'Back'].reduce((a, t) => a + w(t), 0) + 12 + 4 <= 303);
    assert.ok(['Fine (F)', 'Feather (B)', 'Wand (W)'].reduce((a, t) => a + w(t) + 4 + 4, 0) <= 303);
});

test('the locked Lift label reads "Lift (45%)" visibly and "Lift (needs 45% coverage)" in full', () => {
    const g = Object.create(DustingMinigame.prototype);
    const els = {};
    els.lbl = { innerHTML: '' };
    const mk = n => (els[n] = { dataset: {}, style: {}, textContent: '', title: '', querySelector: () => els.lbl });
    let isShort = true;
    Object.assign(g, {
        step: 'dust', metrics: { coverage: 0.44, clarity: 0.5 }, diff: { minCoverage: 0.45 }, message: '',
        root: { classList: { contains: c => c === 'dusting-short' && isShort } },
        panel: { querySelectorAll: () => [] },
        _currentQuality: () => 0.5, _coach: () => ''
    });
    g._setDyn = (name, fn) => fn(els[name] || mk(name));
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '44% (faint) / 45% to lift');
    assert.equal(els['lift-btn'].disabled, true);
    assert.equal(names(els.lbl.innerHTML, true).visible, 'Lift (45%)');
    assert.equal(names(els.lbl.innerHTML, true).accessible, 'Lift (45%), needs 45% coverage');
    assert.equal(names(els.lbl.innerHTML, false).accessible, 'Lift (needs 45% coverage)');
    assert.match(els.lbl.innerHTML, /Lift \(<span class="dusting-lx">needs <\/span>45%<span class="dusting-lx"> coverage<\/span>\)<span class="dusting-ls">, needs 45% coverage<\/span>/);
    assert.equal(els['lift-btn'].title, 'Lift (needs 45% coverage)');
    isShort = false;
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '44% (faint)');
    g.metrics.coverage = 0.6; isShort = true;
    g._refreshDynamic();
    assert.equal(els['cov-text'].textContent, '60% (fair)');
    assert.equal(els['lift-btn'].disabled, false);
    assert.equal(names(els.lbl.innerHTML, true).accessible, 'Lift (L)');
});

test('compact tool cards: one line, no icon, 28 px against the room above the strip at 667x375', () => {
    const tool = rule('.dusting-short .dusting-tools .dusting-tool');
    assert.match(tool, /min-height: 28px/);
    assert.match(tool, /white-space: nowrap/);
    assert.match(rule('.dusting-short .dusting-tools'), /flex-wrap: nowrap/);
    assert.match(css, /\.dusting-short \.dusting-tools \.dusting-tool \[data-slot\][^{]*\{ display: none/);
    assert.match(rule('.dusting-short .dusting-panel'), /--d-pin-h: 44px/);
    assert.match(rule('.dusting-short .dusting-panel'), /--d-strip-h: calc\(var\(--d-pin-h\) \+ 36px\)/);
    const strip = 44 + 36;
    assert.ok(28 <= 114 - strip, 'card fits the 34 px of room at 667x375');
    assert.ok(76 > 114 - strip);
});

test('844x390: tools end above the strip for a two-line instruction (20 + 16n + 4 + 28 <= 174 - 80)', () => {
    const P = 174, strip = 80;
    const bottom = n => 20 + 16 * n + 4 + 28;
    assert.ok(bottom(2) <= P - strip, `two lines ${bottom(2)}`);
    assert.ok(bottom(3) > P - strip, 'three lines would still overlap, hence the shorter short-mode text');
    const r = css.slice(css.indexOf('.dusting-short[data-step="dust"] .dusting-panel > p'));
    assert.match(r.slice(0, r.indexOf('}')), /font-size: 16px; line-height: 16px/);
    assert.match(css, /\.dusting-short \.dusting-lo, \.dusting-root:not\(\.dusting-short\) \.dusting-so \{ display: none/);
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { powder: 'black', tool: 'fine', puffMode: false });
    const d = g._htmlDust();
    const so = d.match(/<span class="dusting-so">([^<]*)<\/span>/)[1];
    assert.ok(so.length * 8 <= 2 * 473, `short text ${so.length} chars wraps to two lines at 473 px`);
});

test('the panel scrolls with scroll-padding-bottom equal to the strip height', () => {
    assert.match(rule('.dusting-short .dusting-panel'), /scroll-padding-bottom: var\(--d-strip-h\)/);
});

test('short buttons clip as a guard only', () => {
    const b = rule('.dusting-short .dusting-actions .dusting-btn');
    assert.match(b, /overflow: hidden/);
    assert.match(b, /text-overflow: clip/);
});

test('every short-mode button name begins with its exact visible text, and long mode names equal visible text', () => {
    const g = Object.create(DustingMinigame.prototype);
    for (const [powder, tool] of [['black', 'fine'], ['black', 'broad'], ['magnetic', 'wand']]) {
        Object.assign(g, { powder, tool, puffMode: false });
        const html = g._htmlDust() + g._htmlLift();
        const btns = [...html.matchAll(/<button class="dusting-btn[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1].replace(/<span data-slot[^>]*><\/span>/g, ''));
        assert.ok(btns.length >= 6, 'found the dust and lift buttons');
        for (const b of btns) {
            const s = names(b, true), l = names(b, false);
            assert.ok(s.accessible.startsWith(s.visible), `short: "${s.accessible}" starts with "${s.visible}"`);
            assert.equal(l.accessible, l.visible, 'long: name equals visible text');
        }
    }
    Object.assign(g, { powder: 'black', tool: 'fine' });
    const fine = names(g._htmlDust().match(/data-tool="fine"[^>]*>([\s\S]*?)<\/button>/)[1].replace(/<span data-slot[^>]*><\/span>/g, ''), true);
    assert.deepEqual(fine, { visible: 'Fine (F)', accessible: 'Fine (F), fine brush' });
});

test('short dust and lift: the panel keeps room above the 80 px strip (no heading, forensic note or Keys line drawn)', () => {
    for (const step of ['dust', 'lift']) {
        assert.match(css, new RegExp(`\\.dusting-short\\[data-step="${step}"\\] \\.dusting-panel > h3`));
        assert.match(css, new RegExp(`\\.dusting-short\\[data-step="${step}"\\] \\.dusting-forensic`));
        assert.match(css, new RegExp(`\\.dusting-short\\[data-step="${step}"\\] \\.dusting-keys`));
    }
    const hide = css.match(/\.dusting-short\[data-step="dust"\] \.dusting-panel > h3[^{]*\{[^}]*\}/)[0];
    assert.match(hide, /clip: rect\(0 0 0 0\)/);   // still in the accessibility tree
    assert.doesNotMatch(hide, /display: none/);
    assert.match(css, /\.dusting-keys \{ display: none; \}/);
    for (const step of ['dust', 'lift']) assert.match(css, new RegExp(`\\.dusting-short\\[data-step="${step}"\\] \\.dusting-status`));
    // m2: the status line is visually hidden (still announced) on dust and lift in short mode, and no longer capped
    const sHide = css.match(/\.dusting-short\[data-step="dust"\] \.dusting-status[^{]*\{[^}]*\}/)[0];
    assert.match(sHide, /\.dusting-short\[data-step="lift"\] \.dusting-status/);
    assert.match(sHide, /clip: rect\(0 0 0 0\)/);
    assert.match(sHide, /width: 1px; height: 1px/);
    assert.doesNotMatch(sHide, /display: none|visibility: hidden/);
    assert.doesNotMatch(css, /max-height: 32px/);
    assert.match(src, /class="dusting-status" role="status" aria-live="polite"/);
    // the other steps keep their heading and note
    assert.doesNotMatch(css, /dusting-short\[data-step="compare"\] \.dusting-forensic/);
});

test('M1: long advice reaches the unclipped feedback line in short mode and is announced once', () => {
    assert.match(src, /advise\(msg\) \{/);
    assert.match(src, /this\.advise\(short \? why : `\$\{why\} You can change powder\.`\)/);
    assert.match(src, /this\.announce\(FEATHER_SUGGESTION\)/);
    assert.doesNotMatch(src, /advise\(FEATHER_SUGGESTION\)/);
    assert.match(src, /this\.message \|\| this\.advice \|\| this\._coach\(\)/);
    // the status line stays the only live region; the feedback line is not
    assert.match(src, /class="dusting-status" role="status" aria-live="polite"/);
    assert.doesNotMatch(src, /dusting-feedback"[^>]*aria-live/);
    assert.doesNotMatch(css, /\.dusting-status[^}]*overflow-y: auto/);
    const calls = [];
    const g = Object.create(DustingMinigame.prototype);
    const fb = { textContent: '' };
    Object.assign(g, {
        statusEl: { textContent: '' }, panel: { querySelector: () => fb },
        root: { classList: { contains: c => c === 'dusting-short' } }
    });
    const spy = g.announce.bind(g); g.announce = m => { calls.push(m); spy(m); };
    g.advise('Black powder would show these. You can change powder.');
    assert.equal(fb.textContent, 'Black powder would show these. You can change powder.');
    assert.equal(g.statusEl.textContent, fb.textContent);
    assert.equal(calls.length, 1, 'announced once');
    g.root = { classList: { contains: () => false } };
    fb.textContent = 'keep';
    g.advise('Long mode advice');
    assert.equal(fb.textContent, 'keep', 'long mode leaves the feedback line to the coach');
    assert.equal(g.advice, '');
});

test('M2: phone portrait pins only the primary button; short landscape and desktop are untouched', () => {
    const i = css.indexOf('/* Phone portrait (not short): one 44 px bar');
    assert.ok(i >= 0, 'portrait pin block exists');
    const m = [css.slice(i, css.indexOf('/* Short landscape (a phone on its side;', i))];
    assert.match(m[0], /\.dusting-buttons \{ display: contents; \}/);
    assert.match(m[0], /\.dusting-primary \{[^}]*position: sticky;[^}]*bottom: -6px;[^}]*z-index: 3;[^}]*width: 100%;[^}]*background: var\(--d-bg\)/);
    assert.match(m[0], /min-height: 44px/);
    assert.match(m[0], /\.dusting-primary:disabled \{ opacity: 1/);
    assert.doesNotMatch(m[0], /\.dusting-btn:not\(\.dusting-primary\) \{[^}]*sticky/);
    // the whole block is scoped to not-short and phone width
    assert.doesNotMatch(m[0], /^\s+\.dusting-(actions|buttons|primary|meters)/m);   // every selector is scoped not-short
    // the original phone-width rule (static, in flow) still holds
    assert.match(css, /@media \(max-width: 760px\) \{\s*\.dusting-actions \{\s*position: static/);
});

test('m1: portrait scroll-padding clears the pinned bar and the pinned primary has an inset focus ring', () => {
    const i = css.indexOf('/* Phone portrait (not short): one 44 px bar');
    const blk = css.slice(i, css.indexOf('/* Short landscape (a phone on its side;', i));
    assert.match(blk, /\.dusting-root:not\(\.dusting-short\) \.dusting-body \{ scroll-padding-bottom: 52px; \}/);
    assert.match(blk, /\.dusting-primary:focus-visible \{ outline-offset: -5px; \}/);
    assert.doesNotMatch(blk, /:focus-visible \{[^}]*outline:/, 'colour and width stay with the shared focus rule');
});

function feedbackGame({ short = true, foggy = 0.2, coverage = 0.2 } = {}) {
    const fb = { textContent: '' };
    const dyn = {};
    const any = () => ({ textContent: '', style: {}, dataset: {}, querySelector: () => ({}) });
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, {
        canvas: { focus() {}, style: {} }, tape: { coverage: () => 0 }, _currentQuality: () => 0.5,
        step: 'dust', tool: 'fine', toolStrokes: 0, powder: 'black', surfaceId: 'glass', advice: '', message: '',
        metrics: { coverage, foggy, clarity: 0.5 }, diff: { minCoverage: 0.45 }, puffMode: false,
        statusEl: { textContent: '' }, panel: { querySelector: sel => (sel.includes('"feedback"') ? fb : (dyn[sel] = dyn[sel] || any())) },
        root: { classList: { contains: c => short && c === 'dusting-short' }, querySelectorAll: () => [] },
        forensicEl: { textContent: '' }
    });
    return { g, fb };
}

test('r6 M1: with fog the coach line beats the feather tip on the feedback line, and the tip is still announced', () => {
    const { g, fb } = feedbackGame();
    for (let i = 0; i < 6; i++) g._countStroke();
    assert.equal(g.toolStrokes, 6);
    assert.equal(g.advice, '', 'the feather tip is not stored as advice');
    assert.match(g.statusEl.textContent, /feather brush/i, 'still announced once');
    g._refreshDynamic();
    assert.equal(fb.textContent, foggyCoach(0.2, 0.45));
    assert.doesNotMatch(fb.textContent, /feather/i);
});

test('r6 M1: without fog the feather tip shows through the coach, and drops once coverage passes the minimum', () => {
    const { g, fb } = feedbackGame({ foggy: 0 });
    for (let i = 0; i < 6; i++) g._countStroke();
    g._refreshDynamic();
    assert.equal(fb.textContent, FEATHER_SUGGESTION);
    g.metrics.coverage = 0.5;
    g._refreshDynamic();
    assert.notEqual(fb.textContent, FEATHER_SUGGESTION);
});

test('r6 M1: advice clears on a tool change and on a step change', () => {
    const a = feedbackGame();
    a.g.advice = 'Black powder would show these. You can change powder.';
    a.g._renderPanel = () => {}; a.g.announce = () => {};
    a.g.powder = 'black';
    a.g._chooseTool('fine');
    assert.equal(a.g.advice, '');
    const b = feedbackGame();
    b.g.advice = 'stale';
    Object.assign(b.g, { _layout() {}, _renderPanel() {}, _updateAria() {}, root: { dataset: {}, querySelectorAll: () => [], classList: { contains: () => true } } });
    b.g._setStep('lift');
    assert.equal(b.g.advice, '');
});

test('r6 m1: sticky keyboard brushing shows on the short-mode feedback line (status and Keys lines are hidden there)', () => {
    const s = feedbackGame({ foggy: 0 });
    s.g.stickyBrush = true;
    s.g._refreshDynamic();
    assert.match(s.fb.textContent, /^Brushing on\. [A-Z]/);
    assert.doesNotMatch(s.fb.textContent, /Enter stops/);
    assert.equal(s.fb.title, 'Enter stops brushing', 'the Enter help stays reachable as the feedback tooltip');
    s.g.stickyBrush = false;
    s.g._refreshDynamic();
    assert.doesNotMatch(s.fb.textContent, /Brushing on/);
    const l = feedbackGame({ foggy: 0, short: false });
    l.g.stickyBrush = true;
    l.g._refreshDynamic();
    assert.doesNotMatch(l.fb.textContent, /Brushing on/, 'long mode keeps its visible Keys line instead');
});

const VISHIDE = /position: absolute; width: 1px; height: 1px;(?: min-height: 0;)? margin: -1px; padding: 0; border: 0; overflow: hidden; clip: rect\(0 0 0 0\); white-space: nowrap;/;

test('r7: the short dust and lift status line uses the standard visually-hidden pattern, 1px by 1px (min-height 0)', () => {
    const r = css.match(/\.dusting-short\[data-step="dust"\] \.dusting-status[^{]*\{[^}]*\}/)[0];
    assert.match(r, VISHIDE);
    assert.match(r, /min-height: 0/);
    assert.match(css, /\.dusting-short \.dusting-ls \{[^}]*width: 1px; height: 1px; margin: -1px;/);
});

test('r7 (a): after the first stroke the dust instruction paragraph is visually hidden in short mode, kept for screen readers', () => {
    const r = css.match(/\.dusting-short\[data-step="dust"\]\[data-brushed\] \.dusting-panel > \.dusting-instr[^{]*\{[^}]*\}/)[0];
    assert.match(r, VISHIDE);
    assert.doesNotMatch(r, /display: none/);
    assert.match(src, /<p class="dusting-instr">/);
    const attrs = new Map();
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { step: 'dust', puffMode: false, toolStrokes: 0, root: { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) },
        _suggestFeather: () => false, announce() {} });
    assert.equal(attrs.has('data-brushed'), false, 'shows before the first stroke');
    g._countStroke();
    assert.equal(attrs.has('data-brushed'), false, 'a stroke start alone (a stray click) does not hide the instruction');
    g._setBrushed(true);
    assert.equal(attrs.get('data-brushed'), '1');
    g._setBrushed(false);
    assert.equal(attrs.has('data-brushed'), false, 'a new powder shows the instruction again');
    g.puffMode = true; g._countStroke();
    assert.equal(attrs.has('data-brushed'), false, 'puffing is not brushing');
});

test('r7 (b): short mode hides the Lift estimate on the dust step only, visually (not display: none), and it is not a live region', () => {
    const m = css.match(/\.dusting-short\[data-step="dust"\] \.dusting-actions \.dusting-estimate[^{]*\{[^}]*\}/)[0];
    assert.match(m, VISHIDE);
    assert.doesNotMatch(css, /\.dusting-short\[data-step="lift"\][^{]*\.dusting-estimate/);
    assert.doesNotMatch(src, /dusting-estimate"[^>]*aria-live/);
});

test('r7 (c): the dust step tightens the options rows, tools margin and powder line so the feedback line clears the strip at 667x375', () => {
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-options'), /row-gap: 0/);
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-options label'), /min-height: 24px/);
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-tools'), /margin-bottom: 2px/);
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-panel > .dusting-powder-line'), /margin-bottom: 0/);
    assert.doesNotMatch(css, /\.dusting-short[^{]*\{[^}]*font-size: (1[0-5]|[0-9])px/);
});

test('m2: _choosePowder resets the brushed flag, so a new powder shows the instruction again', () => {
    const body = src.match(/_choosePowder\(id\) \{[\s\S]*?\n    \}/)[0];
    assert.match(body, /this\._setBrushed\(false\)/);
    // R8 m: _setStep and _refreshMetrics both run _refreshDynamic with the old powder's coverage,
    // which would set brushed again; the reset must come after both
    const reset = body.indexOf('this._setBrushed(false)');
    assert.ok(reset > body.indexOf("this._setStep('dust')"), 'reset after the step render');
    assert.ok(reset > body.indexOf('this._refreshMetrics(true)'), 'reset after the metric refresh');
});

function brushedGame(coverage, { short = true, sticky = false } = {}) {
    const attrs = new Map();
    const { g, fb } = feedbackGame({ short, foggy: 0, coverage });
    g.root.setAttribute = (k, v) => attrs.set(k, v);
    g.root.removeAttribute = k => attrs.delete(k);
    g.stickyBrush = sticky;
    return { g, fb, attrs };
}

test('m1: data-brushed is set once coverage is above 0, never at coverage 0, also for sticky keyboard brushing', () => {
    const a = brushedGame(0);
    a.g._countStroke(); a.g._refreshDynamic();
    assert.equal(a.attrs.has('data-brushed'), false, 'stray click on bare card');
    const b = brushedGame(0, { sticky: true });
    b.g._countStroke(); b.g._refreshDynamic();
    assert.equal(b.attrs.has('data-brushed'), false, 'sticky brush over bare card');
    b.g.metrics.coverage = 0.04;
    b.g._refreshDynamic();
    assert.equal(b.attrs.get('data-brushed'), '1', 'sticky strokes that lay ridges get there');
    const c = brushedGame(0.2);
    c.g._refreshDynamic();
    assert.equal(c.attrs.get('data-brushed'), '1');
});

test('M1 (a): in short dust the feedback line scrolls into view only when its text changed', () => {
    assert.match(css, /\.dusting-short \.dusting-panel \{[^}]*scroll-padding-bottom: var\(--d-strip-h\)/);
    const { g, fb } = feedbackGame({ foggy: 0 });
    const calls = [];
    fb.scrollIntoView = o => calls.push(o);
    g.metrics.coverage = 0.5;
    g._refreshDynamic();
    assert.deepEqual(calls, [{ block: 'nearest' }]);
    g._refreshDynamic(); g._refreshDynamic();
    assert.equal(calls.length, 1, 'same text: no scroll, no jitter on every stroke');
    g.stickyBrush = true;
    g._refreshDynamic();
    assert.equal(calls.length, 2, 'changed text scrolls again');
    const l = feedbackGame({ foggy: 0, short: false, coverage: 0.5 });
    const lc = [];
    l.fb.scrollIntoView = () => lc.push(1);
    l.g._refreshDynamic();
    assert.equal(lc.length, 0, 'full mode never scrolls the feedback');
});

test('M1 (b): the short prefix is "Brushing on. " and the full prefix is gone from the source', () => {
    assert.match(src, /'Brushing on\. '/);
    assert.doesNotMatch(src, /Brushing on \(Enter stops\)/);
    assert.match(src, /Enter keeps brushing/, 'the instruction carries the Enter key help until the first real ridge');
});

test('M1 (c): short mode drops the trailing change-powder sentences, full mode keeps them', () => {
    for (const short of [true, false]) {
        const { g, fb } = feedbackGame({ short, foggy: 0, coverage: 0.2 });
        Object.assign(g, { powder: 'magnetic', surfaceId: 'glossy_light', announce() {} });
        g._refreshDynamic();
        if (short) {
            assert.doesNotMatch(fb.textContent, /Change powder|You can change/);
            assert.match(fb.textContent, /Black powder would show these ridges better\.$/);
        } else {
            assert.match(fb.textContent, /Change powder to see the difference\.$/);
        }
        const adv = feedbackGame({ short, foggy: 0, coverage: 0 });
        Object.assign(adv.g, { powder: 'magnetic', surfaceId: 'glossy_light', field: { clear() {} }, lastBand: 0, _setStep() {}, _refreshMetrics() {}, announce() {} });
        adv.g._choosePowder('magnetic');
        if (short) assert.doesNotMatch(adv.g.advice, /You can change/);
        else assert.equal(adv.g.advice, '', 'full mode leaves the advice to the coach, which keeps the trailing sentence');
    }
});

test('m2 budget: the longest short-mode feedback (wrong powder, every powder and surface, with the prefix) is at most 164 characters', async () => {
    const model = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
    let worst = 0, n = 0;
    for (const s of Object.keys(model.SURFACES)) for (const p of Object.keys(model.POWDERS)) {
        const why = model.wrongPowderReason(p, s, true);
        if (!why) continue;
        n++;
        worst = Math.max(worst, ('Brushing on. ' + why).length);
        assert.ok(('Brushing on. ' + why).length <= 164, `${p} on ${s}: ${('Brushing on. ' + why).length}`);
    }
    assert.ok(n >= 4, 'wrong-powder combinations were found');
    assert.ok(model.wrongPowderReason('magnetic', 'glossy_light', true).length < model.wrongPowderReason('magnetic', 'glossy_light').length);
    assert.ok(worst > 0);
});

test('m2 budget: short dust feedback has 16 px lines and the Clarity gap is 0, so four lines fit above the strip at 667x375', () => {
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-actions .dusting-feedback'), /font-size: 16px; line-height: 16px/);
    assert.match(rule('.dusting-short[data-step="dust"] .dusting-actions .dusting-meter:nth-child(2)'), /margin-bottom: 0/);
});

// Phone actions (390x844 and 844x390): the next-step buttons stay in view and the panel opens at its title.
test('examine and compare button rows carry the footer class, and the footer CSS sticks them on phones only', () => {
    const foot = (src.match(/class="dusting-buttons dusting-foot"/g) || []).length;
    assert.ok(foot === 6, `six footer rows (3 examine, 3 compare), got ${foot}`);
    assert.ok(/<div class="dusting-buttons dusting-foot">\s*<button class="dusting-btn" data-action="start">Dust again/.test(src), 'Dust again row is a footer');
    assert.ok(/<div class="dusting-buttons dusting-foot">\s*<button class="dusting-btn dusting-primary" data-action="start">Dust for prints/.test(src), 'Dust for prints row is a footer');
    assert.ok(/<div class="dusting-buttons dusting-foot">\s*<button class="dusting-btn dusting-primary" data-action="resume">/.test(src), 'Resume row is a footer');
    const phone = css.match(/@media \(max-width: 760px\) \{\s*\.dusting-root:not\(\.dusting-short\) \.dusting-buttons\.dusting-foot \{[^}]*\}/);
    assert.ok(!!phone, 'phone portrait footer rule exists');
    assert.ok(/position: sticky/.test(phone[0]) && /bottom: -6px/.test(phone[0]) && /display: flex/.test(phone[0]), 'portrait footer is a sticky flex row at the body foot');
    assert.ok(/background: var\(--d-bg\)/.test(phone[0]) && /border-top: 2px solid/.test(phone[0]), 'portrait footer is opaque with a 2px rule');
    const short = rule('.dusting-short[data-step="examine"] .dusting-buttons.dusting-foot');
    assert.ok(/position: sticky/.test(short) && /bottom: 0/.test(short), 'short landscape examine footer sticks to the panel foot');
    assert.ok(!/radius|blur|gradient/.test(phone[0] + short), 'footer rules use no radius, blur or gradient');
    assert.ok(css.indexOf('.dusting-buttons.dusting-foot') > css.indexOf('.dusting-root:not(.dusting-short) .dusting-buttons { display: contents'), 'footer rule comes after the display: contents rule it overrides');
});

test('390x844 and 844x390 pick the layouts the footer rules target (portrait long, landscape short)', () => {
    const p = layoutAt(390, 844, 'examine');
    assert.ok(p.short === false, 'portrait is not short, so the max-width: 760px footer rule applies');
    const l = layoutAt(844, 390, 'examine');
    assert.ok(l.short === true, 'landscape is short, so the examine footer rule applies');
    const d = layoutAt(1280, 720, 'examine');
    assert.ok(d.short === false, 'desktop is not short');
});
