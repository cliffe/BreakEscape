// D217 (K2): the consequence sandbox is a dark ui-themes dialog, not the light paper skin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/episode-runner.css'), 'utf8');
const start = css.indexOf('The consequence sandbox (ENG-04');
const end = css.indexOf('C-X4 (n2)');
const block = css.slice(start, end);

test('sandbox block is found', () => {
    assert.ok(start > 0 && end > start, 'sandbox CSS block present');
});

test('sandbox uses the dark themed surface and no paper colours', () => {
    assert.ok(block.includes('--ui-surface-opaque'), 'dark surface token used');
    assert.ok(!/#fff\b|#f6f8f7|#eef6f3|#cfd8d4|#2f6f5e/i.test(block), 'no paper colours left');
});

test('sandbox uses GNF and no sub-16px or smooth type', () => {
    assert.ok(block.includes("'GNF'"), 'GNF font');
    assert.ok(!/Source Sans|Segoe/.test(block), 'no smooth font');
    const sizes = [...block.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length > 0 && Math.min(...sizes) >= 16, 'every font-size is 16px or more');
});

test('sandbox has no border-radius other than 0', () => {
    const radii = [...block.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
    assert.ok(radii.every((r) => r === '0'), 'square corners only');
});
