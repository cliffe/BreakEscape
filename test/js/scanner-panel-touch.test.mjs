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
    const m = /inset:\s*-(\d+)px/.exec(b);
    assert.ok(m !== null && 24 + 2 * Number(m[1]) >= 44, 'pad makes at least 44px');
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
