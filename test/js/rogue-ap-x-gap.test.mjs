// Rogue AP: the X's 44px hit area must not reach the tab row, so the title row keeps a 12px gap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...strip(readFileSync(join(cssDir, 'rogue-ap.css'), 'utf8')).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), body: m[2] }));

test('title row has at least 12px below it, with a selector that beats the frame title rule', () => {
    const r = rules.find((x) => x.sel === '.rogue-ap.device-frame > .rogue-ap-title');
    assert.ok(r !== undefined, 'rule exists');
    const m = /margin-bottom:\s*(\d+)px/.exec(r.body);
    assert.ok(m !== null && Number(m[1]) >= 12, 'margin-bottom >= 12px');
});
