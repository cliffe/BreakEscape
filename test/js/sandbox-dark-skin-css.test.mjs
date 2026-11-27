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

// Round 1 (review M1, m2, m3, m4): pin the tick box, the checked fill, the title and the frames.
const plain = block.replace(/\/\*[\s\S]*?\*\//g, '');
function rule(sel) {
    const i = plain.indexOf(sel + ' {');
    return i < 0 ? '' : plain.slice(i, plain.indexOf('}', i));
}

test('sandbox surface token is used outside comments', () => {
    assert.ok(plain.includes('--ui-surface-opaque'), 'dark surface token in real rules');
    assert.ok(!/#f{3}(?:f{3})?\b|\bwhite\b/i.test(plain), 'no white left');
});

test('tick box drops the native radio and stays square', () => {
    const r = rule('.epr-sbx-radio');
    assert.ok(/(^|[\s;{])appearance:\s*none/.test(r), 'appearance none');
    assert.ok(/-webkit-appearance:\s*none/.test(r), 'webkit appearance none');
    assert.ok(/border-radius:\s*0\s*;/.test(r), 'radius 0');
});

test('checked tick box has a real fill', () => {
    const r = rule('.epr-sbx-radio:checked');
    const m = r.match(/background(?:-color)?:\s*([^;]+);/);
    assert.ok(m !== null, 'checked rule sets a background');
    assert.ok(m !== null && !/^(transparent|none)$/i.test(m[1].trim()), 'checked background is a fill');
});

test('no font shorthand or sub-16px sizes, only pixel faces', () => {
    for (const m of plain.matchAll(/font:\s*([^;]+);/g)) {
        const px = m[1].match(/(\d+)px/);
        assert.ok(px !== null && Number(px[1]) >= 16, 'font shorthand size 16 or more: ' + m[1]);
    }
    for (const m of plain.matchAll(/font-family:\s*([^;]+);/g)) {
        assert.ok(/GNF|VT323|Press Start 2P|--ui-heading-font/.test(m[1]), 'pixel face: ' + m[1]);
    }
});

test('title matches the shared SE window title, unpicked option frames use the faint text colour', () => {
    const t = rule('.epr-sbx-title');
    assert.ok(/font-size:\s*16px/.test(t) && /line-height:\s*24px/.test(t), 'title 16px on 24px');
    assert.ok(/font-weight:\s*normal/.test(t), 'no faux bold');
    const o = rule('.epr-sbx-option');
    assert.ok(/border:\s*2px solid var\(--ui-text-faint/.test(o), 'option frame uses --ui-text-faint (3:1 or better against the option fill in every theme)');
});

test('confirm button label is 24px on the font grid', () => {
    const r = rule('.epr-sbx-root .epr-sbx-confirm');
    assert.ok(/font-size:\s*24px/.test(r), 'confirm 24px');
});

test('picked frame differs from the unpicked frame', () => {
    const o = rule('.epr-sbx-option').match(/border(?:-color)?:\s*(?:2px solid\s+)?var\((--[\w-]+)/);
    const p = rule('.epr-sbx-picked').match(/border(?:-color)?:\s*(?:2px solid\s+)?var\((--[\w-]+)/);
    assert.ok(o !== null && p !== null, 'both rules set a token border colour');
    assert.ok(o !== null && p !== null && o[1] !== p[1], 'picked frame token differs from unpicked');
});

test('picked frame has a hard 2px inset accent ring so it reads by shape, not hue alone', () => {
    const p = rule('.epr-sbx-picked');
    assert.ok(/box-shadow:\s*inset 0 0 0 2px var\(--ui-accent/.test(p), 'picked rule has a 2px inset accent box-shadow, no blur');
    assert.ok(!/border-radius/.test(p), 'picked rule adds no radius');
});
