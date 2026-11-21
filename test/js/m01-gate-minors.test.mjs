// m01 gate playtest minors: m1 (CyberChef update banner) and m12 (configuration prompt style).
// CyberChef 10.19.4 writes "Last build: ... ago - Version 10 is here!" into #notice with no
// option to turn it off, so the vendored page hides #notice itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const chefPath = process.env.CYBERCHEF_COPY || join(root, 'public/break_escape/assets/cyberchef/CyberChef_v10.19.4.html');
const chef = readFileSync(chefPath, 'utf8');
const css = readFileSync(join(root, 'public/break_escape/css/player_preferences.css'), 'utf8');

test('CyberChef update banner (#notice) is hidden in the vendored page', () => {
    const tag = chef.match(/<span id="notice"[^>]*>/);
    assert.ok(tag !== null, '#notice span present');
    assert.ok(/style="[^"]*display:\s*none/.test(tag[0]), '#notice carries display:none: ' + tag[0]);
});

test('CyberChef notice wrapper is kept so the header layout is stock', () => {
    assert.ok(chef.includes('id="notice-wrapper"'), 'notice wrapper kept');
});

test('CyberChef page explains the #notice edit in a comment beside it', () => {
    const i = chef.indexOf('<span id="notice"');
    assert.ok(i > 0, '#notice present');
    const before = chef.slice(Math.max(0, i - 400), i);
    assert.ok(before.includes('<!-- Break Escape:') && /upgrad/.test(before), 'comment before span mentions upgrading');
});

function rule(sel) {
    const i = css.indexOf(sel + ' {');
    assert.ok(i >= 0, sel + ' rule exists');
    return css.slice(i, css.indexOf('}', i));
}

test('.selection-required is GNF 16px on a whole-pixel line box (not inherited 19.2px)', () => {
    const r = rule('.selection-required');
    assert.ok(/font-family:\s*'GNF'/.test(r), 'GNF font');
    assert.ok(/font-size:\s*16px/.test(r), '16px');
    assert.ok(/line-height:\s*24px/.test(r), 'whole-pixel line box');
});

test('.config-prompt is pixel styled: 2px border, no radius, GNF 16px, dark', () => {
    const r = rule('.config-prompt');
    assert.ok(/border:\s*2px solid/.test(r), '2px border');
    assert.ok(!/border-radius/.test(r), 'no radius');
    assert.ok(/font-family:\s*'GNF'/.test(r), 'GNF font');
    assert.ok(/font-size:\s*16px/.test(r), '16px');
    assert.ok(/line-height:\s*24px/.test(r), 'whole-pixel line box');
    assert.ok(!/background:\s*#fff3cd/i.test(r), 'no light box');
});
