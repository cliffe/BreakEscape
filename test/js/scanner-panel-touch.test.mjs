// Scanner panels: the 24px toggle gets a 44px hit area, chips are 32px tall with an 8px gap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...strip(readFileSync(join(cssDir, 'scanner-panel.css'), 'utf8')).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), body: m[2] }));
const body = (sel) => rules.filter((r) => r.sel === sel).map((r) => r.body).join(';');

test('toggle has a pseudo-element hit pad of at least 10px each side (24 + 20 = 44)', () => {
    const b = body('.scanner-panel .scan-toggle::after');
    assert.ok(/position:\s*absolute/.test(b), 'pad is absolutely positioned');
    assert.ok(/content:\s*(''|"")/.test(b), 'pseudo-element has content so it is drawn');
    const m = /inset:\s*([^;]+)/.exec(b);
    assert.ok(m !== null, 'inset present');
    const v = m[1].trim().split(/\s+/).map((x) => parseFloat(x));
    assert.ok(v.length >= 1 && v.length <= 4, 'inset has 1 to 4 values');
    assert.ok(v.every((n) => n <= -12), 'every side extends at least 12px from the padding box (live: -10px gave 40x40; 20 + 24 = 44)');
});
test('chips are at least 32px tall', () => {
    const m = /min-height:\s*(\d+)px/.exec(body('.scanner-panel .scan-chips > *'));
    assert.ok(m !== null && Number(m[1]) >= 32, 'min-height >= 32px');
});
test('chip gap is 8px and chips still wrap', () => {
    const b = body('.scanner-panel .scan-chips');
    assert.ok(/gap:\s*8px/.test(b), 'gap 8px');
    assert.ok(/flex-wrap:\s*wrap/.test(b), 'wrap kept');
});
test('chips carry no margin, so the gap alone spaces them', () => {
    assert.ok(/(^|[;\s])margin:\s*0\b/.test(body('.scanner-panel .scan-chips > *')), 'margin: 0');
});
test('objectives HUD is hidden while a scanner is open', () => {
    const b = body('body:has(.minigame-container.scanner-panel) .objectives-panel');
    assert.ok(/visibility:\s*hidden\s*!important/.test(b), 'visibility hidden !important');
});
