// The closing card box overlapped the header band and the controls bar at 844x390 and
// 390x844 (30px card font, label centred on the window with no vertical cap). The
// overlay now gets a symmetric inset (--bv-cr-inset) from the two bands, the label is
// capped to what is left and scrolls inside itself, and short or narrow windows use the
// 16px pixel size for card rows.
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

const block = (head) => {
    const i = css.indexOf(head);
    assert.ok(i >= 0, `${head} exists`);
    let depth = 0;
    for (let j = css.indexOf('{', i); j < css.length; j++) {
        if (css[j] === '{') depth++;
        if (css[j] === '}' && --depth === 0) return css.slice(i, j + 1);
    }
    assert.fail('unbalanced block');
};

test('the label is capped between the bands and scrolls inside itself', () => {
    const r = block('#bv-credits-overlay #bv-cr-label.bv-cr-label {');
    assert.match(r, /max-height: calc\(100% - 2 \* var\(--bv-cr-inset, 0px\)\)/);
    assert.match(r, /overflow-y: auto/);
});

test('short and narrow windows use the 16px card row size', () => {
    const m = block('@media (max-height: 500px), (max-width: 600px)');
    assert.match(m, /\.bv-cr-card-line/);
    assert.match(m, /font-size: 16px/);
    // 844x390 is short, 390x844 is narrow; 1280x720 and 1000x700 are neither
    for (const [w, h, on] of [[844, 390, true], [390, 844, true], [1280, 720, false], [1000, 700, false]]) {
        assert.equal(h <= 500 || w <= 600, on, `${w}x${h}`);
    }
});

test('pixel-art rules: no radius, gradient or blur added to the card rules', () => {
    const m = block('@media (max-height: 500px), (max-width: 600px)');
    assert.doesNotMatch(m, /border-radius|gradient|blur/);
});

test('the inset is set from the header and controls bands on every label write', () => {
    assert.match(js, /function _fitCreditsBand\(overlay\)/);
    assert.match(js, /\.bv-header/);
    assert.match(js, /\.bv-controls/);
    assert.match(js, /setProperty\('--bv-cr-inset'/);
    const uses = js.match(/_fitCreditsBand\(overlay\)/g) || [];
    assert.ok(uses.length >= 4, 'defined once and called from _startCredits (twice) and the hold line');
});

test('card rows are still written with textContent', () => {
    assert.match(js, /row\.textContent = displayDashes\(line\)/);
});
