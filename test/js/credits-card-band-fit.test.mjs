// The closing card box overlapped the header band and the controls bar at 844x390 and
// 390x844 (30px card font, label centred on the window with no vertical cap). The
// overlay is now padded to the real gap (--bv-cr-top, --bv-cr-bottom), the label is
// capped to it and scrolls inside itself (visible pixel scrollbar and pointer only when
// it overflows), and short or narrow windows use the 16px pixel size for card rows.
// Run with: node --max-old-space-size=2048 test/js/credits-card-band-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/bond-visualiser.css'), 'utf8');
const js = readFileSync(join(root, 'js/music/bond-visualiser.js'), 'utf8');

const blockOf = (head) => {
    const i = css.indexOf(head);
    assert.ok(i >= 0, `${head} exists`);
    let depth = 0;
    for (let j = css.indexOf('{', i); j < css.length; j++) {
        if (css[j] === '{') depth++;
        if (css[j] === '}' && --depth === 0) return css.slice(i, j + 1);
    }
    assert.fail('unbalanced block');
};

const block = blockOf;

test('the overlay is padded to the gap and the label is capped to it', () => {
    const o = block('#bv-credits-overlay {');
    assert.match(o, /padding-top: var\(--bv-cr-top, 0px\)/);
    assert.match(o, /padding-bottom: var\(--bv-cr-bottom, 0px\)/);
    const r = block('#bv-credits-overlay #bv-cr-label.bv-cr-label {');
    assert.match(r, /max-height: 100%/);
    assert.match(r, /overflow-y: auto/);
    assert.match(r, /pointer-events: none/);
    assert.match(r, /scrollbar-width: none/);
});

test('the scrollbar and the pointer appear only with .bv-cr-scrolls, pixel style', () => {
    const r = block('#bv-credits-overlay #bv-cr-label.bv-cr-label.bv-cr-scrolls {');
    assert.match(r, /pointer-events: auto/);
    assert.match(r, /scrollbar-width: auto/);
    const track = block('.bv-cr-scrolls::-webkit-scrollbar-track {');
    const thumb = block('.bv-cr-scrolls::-webkit-scrollbar-thumb {');
    assert.match(track, /border: 2px solid/);
    assert.match(thumb, /border: 2px solid/);
    assert.doesNotMatch(track + thumb + r, /border-radius|gradient|blur/);
});

test('the card row size rule is parsed from the CSS and selects the phone sizes only', () => {
    const m = css.match(/@media \(max-height: (\d+)px\), \(max-width: (\d+)px\) \{/);
    assert.ok(m, 'short-or-narrow media query exists');
    const maxH = Number(m[1]); const maxW = Number(m[2]);
    const rule = block(m[0]);
    assert.match(rule, /\.bv-cr-card-line/);
    assert.match(rule, /font-size: 16px/);
    assert.doesNotMatch(rule, /border-radius|gradient|blur/);
    for (const [w, h, on] of [[844, 390, true], [390, 844, true], [1280, 720, false], [1000, 700, false]]) {
        assert.equal(h <= maxH || w <= maxW, on, `${w}x${h}`);
    }
});

test('card rows are still written with textContent', () => {
    assert.match(js, /row\.textContent = displayDashes\(line\)/);
});

// ---- _fitCreditsBand with stubbed rects ----
const grab = (name) => {
    const i = js.indexOf(`function ${name}(`);
    assert.ok(i >= 0, `${name} exists`);
    let depth = 0;
    for (let j = js.indexOf('{', i); j < js.length; j++) {
        if (js[j] === '{') depth++;
        if (js[j] === '}' && --depth === 0) return js.slice(i, j + 1);
    }
    assert.fail('unbalanced');
};
const src = `${grab('_fitCreditsBand')}\n${grab('_syncCreditsScroll')}\nreturn _fitCreditsBand;`;
const rect = (top, height) => ({ top, bottom: top + height, height });
function setup({ header, controls, innerHeight = 844, label }) {
    const vars = {};
    const overlay = {
        style: { setProperty: (k, v) => { vars[k] = v; } },
        querySelector: (q) => (q === '#bv-cr-label' ? label : null),
    };
    const bands = {
        '.bv-header': header && { getBoundingClientRect: () => header },
        '.bv-controls': controls && { getBoundingClientRect: () => controls },
    };
    const doc = { getElementById: (id) => (id === 'bond-vis-overlay' ? { querySelector: (q) => bands[q] || null } : null) };
    const win = { innerHeight };
    const fit = new Function('document', 'window', src)(doc, win);
    return { fit, overlay, vars, win };
}
const mkLabel = (scrollHeight, clientHeight) => {
    const set = new Set();
    return { scrollHeight, clientHeight, classList: { toggle: (c, on) => (on ? set.add(c) : set.delete(c)), has: (c) => set.has(c) }, set };
};

test('both bands laid out: top and bottom are measured gap edges plus 8px', () => {
    const { fit, overlay, vars } = setup({ header: rect(16, 100), controls: rect(780, 48), label: null });
    fit(overlay);
    assert.equal(vars['--bv-cr-top'], '124px');       // 116 + 8
    assert.equal(vars['--bv-cr-bottom'], '72px');     // 844 - 780 + 8
});

test('a zero-height (hidden) controls bar counts as 0 plus the 8px margin, not a collapsed label', () => {
    const { fit, overlay, vars } = setup({ header: rect(16, 60), controls: rect(0, 0), label: null });
    fit(overlay);
    assert.equal(vars['--bv-cr-bottom'], '8px');
    assert.equal(vars['--bv-cr-top'], '84px');
    const missing = setup({ header: rect(16, 60), controls: null, label: null });
    missing.fit(missing.overlay);
    assert.equal(missing.vars['--bv-cr-bottom'], '8px');
});

test('a tall wrapped header pushes only the top edge down', () => {
    const { fit, overlay, vars } = setup({ header: rect(16, 156), controls: rect(790, 38), label: null });
    fit(overlay);
    assert.equal(vars['--bv-cr-top'], '180px');
    assert.equal(vars['--bv-cr-bottom'], '62px');
});

test('a resize re-measures from the new window height and rects', () => {
    const s = setup({ header: rect(16, 60), controls: rect(780, 48), label: null });
    s.fit(s.overlay);
    assert.equal(s.vars['--bv-cr-bottom'], '72px');
    s.win.innerHeight = 390;
    // landscape: controls now sit at 330
    const s2 = setup({ header: rect(8, 50), controls: rect(330, 52), innerHeight: 390, label: null });
    s2.fit(s2.overlay);
    assert.equal(s2.vars['--bv-cr-top'], '66px');
    assert.equal(s2.vars['--bv-cr-bottom'], '68px');
});

test('.bv-cr-scrolls follows overflow on each fit', () => {
    const label = mkLabel(400, 200);
    const s = setup({ header: rect(16, 60), controls: rect(780, 48), label });
    s.fit(s.overlay);
    assert.ok(label.set.has('bv-cr-scrolls'));
    label.scrollHeight = 200; // fits after a resize
    s.fit(s.overlay);
    assert.ok(!label.set.has('bv-cr-scrolls'));
});

test('a resize listener is added while credits run, rAF throttled, and removed on stop', () => {
    assert.match(js, /function _onCreditsResize\(\)[\s\S]*requestAnimationFrame/);
    assert.match(js, /addEventListener\('resize', _onCreditsResize\)/);
    assert.match(js, /addEventListener\('orientationchange', _onCreditsResize\)/);
    const stop = grab('_stopCredits');
    assert.match(stop, /_unwatchCreditsBand\(\)/);
    assert.match(grab('_unwatchCreditsBand'), /removeEventListener\('resize', _onCreditsResize\)/);
    assert.match(grab('_showCreditsHold'), /_watchCreditsBand\(\)/);
    assert.match(grab('_startCredits'), /_watchCreditsBand\(\)/);
});

test('the scroll cue stays pixel style: scrollbar-color only where ::-webkit-scrollbar is missing', () => {
    // Chrome 121+ ignores the ::-webkit-scrollbar rules once scrollbar-color is set on the element
    const outside = css.replace(/@supports not selector\(::-webkit-scrollbar\)\s*\{[\s\S]*?\n\}\n/, '');
    // only the credits label rules matter here (the side panel has its own CRT scrollbar)
    const labelRules = outside.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]*bv-cr-label[^{}]*\{[^}]*\}/g) || [];
    assert.ok(labelRules.length > 0);
    assert.ok(!labelRules.some(r => /scrollbar-color/.test(r)), 'scrollbar-color only inside @supports not selector(::-webkit-scrollbar)');
    assert.match(css, /@supports not selector\(::-webkit-scrollbar\)/);
    assert.match(css, /\.bv-cr-scrolls::-webkit-scrollbar-thumb\s*\{[^}]*border:\s*2px solid/);
});

test('closing the visualiser mid-credits removes the resize watch', () => {
    const i = js.indexOf('// Stop any credits immediately');
    assert.ok(i > 0);
    const closeBlock = js.slice(i, i + 400);
    assert.match(closeBlock, /_unwatchCreditsBand\(\);/);
});
