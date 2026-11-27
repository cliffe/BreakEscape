// The scanner panels' header (title, sample count, status) must wrap instead of overlapping on
// phone widths. Biometrics put "N samples" and "Ready" on top of each other at 320-600 px when the
// count was pushed right with margin-left:auto inside a nowrap flex row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rulesOf = (file) => [...strip(readFileSync(join(cssDir, file), 'utf8')).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), body: m[2] }));
const body = (rules, sel) => rules.filter((r) => r.sel === sel).map((r) => r.body).join(';');

const panel = rulesOf('scanner-panel.css');
const bio = rulesOf('biometrics-minigame.css');

test('scan header row wraps', () => {
    assert.match(body(panel, '.scanner-panel .scan-header'), /flex-wrap:\s*wrap/);
});
test('scan title wraps its count onto a new line rather than overflowing', () => {
    assert.match(body(panel, '.scanner-panel .scan-title'), /flex-wrap:\s*wrap/);
});
test('status never shrinks or breaks', () => {
    const b = body(panel, '.scanner-panel .scan-status');
    assert.match(b, /flex:\s*0 0 auto/);
    assert.match(b, /white-space:\s*nowrap/);
});
test('sample count is a single unbreakable chip and is not pushed right', () => {
    const b = body(bio, '.samples-count-header');
    assert.match(b, /white-space:\s*nowrap/);
    assert.doesNotMatch(b, /margin-left:\s*auto/);
});
test('no font downscaling and no radius on the count chip', () => {
    const b = body(bio, '.samples-count-header');
    assert.doesNotMatch(b, /border-radius/);
    assert.match(b, /font-size:\s*20px/);
});
test('the label beside the icon grows so only the count chip wraps', () => {
    const b = body(panel, '.scanner-panel .scan-title > img + span');
    assert.match(b, /flex:\s*1 1 0/);
    assert.match(b, /min-width:\s*6em/);
});
test('count chip has a steady width', () => {
    const b = body(bio, '.samples-count-header');
    assert.match(b, /min-width:\s*10ch/);
    assert.match(b, /text-align:\s*center/);
});
test('the count chip does not wrap inside itself or shrink', () => {
    const b = body(panel, '.scanner-panel .scan-count');
    assert.match(b, /white-space:\s*nowrap/);
    assert.match(b, /flex:\s*0 0 auto/);
});
