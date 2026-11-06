// Blind A 2026-10-16: the credits visualiser's right-hand panel was cut off at
// 1400 px (m06, m07 M1), and a forced (disableClose) credits screen kept its close
// control hidden until the music track ended, which a muted or headless browser
// may never report (m07 M1: 12 minutes with no exit).
// Run with: node --test test/js/credits-visualiser-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/bond-visualiser.css'), 'utf8');
const js = readFileSync(join(root, 'js/music/bond-visualiser.js'), 'utf8');

const rule = (sel) => {
    const i = css.indexOf(`${sel} {`);
    return css.slice(i, css.indexOf('}', i));
};

test('the layout columns cannot grow past the window', () => {
    assert.match(rule('#bond-vis-overlay .bv-app'), /grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(rule('#bond-vis-overlay .bv-stage'), /grid-template-columns: 180px minmax\(0, 1fr\) 180px/);
});

test('the close control comes back once the last credits line has shown', () => {
    const fn = js.slice(js.indexOf('function showNext()'), js.indexOf('function _stopCredits()'));
    assert.match(fn, /finished && _disableClose/);
    assert.match(fn, /_disableClose = false/);
    assert.match(fn, /closeBtn\.style\.display = ''/);
});

// m10's closing-card lines run to 80-102 characters and spilled past the central
// map panel, with a lone last word ("out.") on its own row.
test('closing-card lines are capped to the centre panel and balance-wrapped', () => {
    const r = rule('.bv-cr-card-line');
    // window - 2*16 padding - 2*180 side panels - 2*12 gaps = 100vw - 416px; 440 leaves air
    assert.match(r, /max-width: calc\(100vw - 440px\)/);
    assert.match(r, /margin-left: auto/);
    assert.match(r, /margin-right: auto/);
    // pretty first, balance second: a browser without balance keeps pretty
    assert.ok(r.indexOf('text-wrap: pretty') >= 0 && r.indexOf('text-wrap: pretty') < r.indexOf('text-wrap: balance'));
    // with the side panels hidden the cap is lifted
    const narrow = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
    assert.match(narrow, /\.bv-cr-card-line \{ max-width: none; \}/);
});

test('card rows centre with auto side margins and are still capped by MAX_CARD_LINES', async () => {
    const fn = js.slice(js.indexOf('function showNext()'), js.indexOf('function _stopCredits()'));
    assert.match(fn, /row\.style\.margin = '0\.25em auto'/);
    const seq = readFileSync(join(root, 'js/music/closing-sequence.js'), 'utf8');
    assert.match(seq, /export const MAX_CARD_LINES = 5;/);
});

// Lab R15 T4 (900x700): the credits header's heading, badges, status lines and close
// button drew over each other, and at phone widths the status block and the close
// button ran off the screen.
test('the credits header shrinks and wraps its blocks instead of overflowing', () => {
    assert.match(rule('#bond-vis-overlay .bv-status-block'), /line-height: 1\.2/);
    assert.match(rule('#bond-vis-overlay .bv-status-block'), /min-width: 0/);
    assert.match(rule('#bond-vis-overlay .bv-status-block'), /overflow-wrap: anywhere/);
    assert.match(rule('#bond-vis-overlay .bv-title-block'), /min-width: 0/);
    const phone = css.slice(css.indexOf('@media (max-width: 700px)'));
    assert.match(phone, /\.bv-header \{ flex-wrap: wrap/);
    assert.match(phone, /\.bv-status-block \{[^}]*flex: 1 1 100%/);
});
