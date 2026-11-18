// The readable-in-place modal (gameDisplay: the m04 SCADA HMI, signs, plaques) must leave room to read
// on a phone in landscape. At 844x390 the 232px reserve left a 34px body: one line of text behind a scroll.
// A short-viewport rule in hud.css shrinks the reserve, uses GNF at its 16px crisp size and tightens padding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/hud.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const m = /@media\s*\(max-height:\s*(\d+)px\)\s*\{([\s\S]*?\n\})/.exec(
    css.slice(css.indexOf('html .game-display-dialog {')));
const block = m ? m[2] : '';

test('a short-viewport media block exists for the display dialog', () => {
    assert.ok(m, 'no @media (max-height) block after the html .game-display-dialog rule');
    assert.ok(Number(m[1]) >= 450 && Number(m[1]) <= 600, 'threshold must cover 390px tall phones and not desktop');
});

test('the reserve is smaller than the tall-screen 232px', () => {
    const r = /max-height:\s*calc\(100vh \/ var\(--hud-zoom, 1\) - (\d+)px\)/.exec(block);
    assert.ok(r, 'max-height rule missing');
    assert.ok(Number(r[1]) < 232 && Number(r[1]) >= 150, `reserve ${r[1]}px`);
});

test('body text is GNF at a crisp 16px and no radius or blur is added', () => {
    assert.match(block, /\.game-display-body\s*\{[^}]*font-size:\s*16px/);
    assert.doesNotMatch(block, /border-radius|box-shadow:\s*[^;]*\d+px\s+\d+px\s+\d+px|gradient/);
});
