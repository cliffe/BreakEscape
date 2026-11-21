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
    const c = chef.lastIndexOf('<!-- Break Escape:', i);
    assert.ok(c >= 0, 'Break Escape comment precedes the span');
    const between = chef.slice(c, i);
    assert.ok(/upgrad/.test(between), 'comment mentions upgrading');
    assert.ok(between.indexOf('-->') >= 0 && between.indexOf('-->') === between.lastIndexOf('-->'), 'one comment closes before the span');
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

test('selected sprite card: hard ring, no blur, SELECTED tag in GNF 16/24; no blurred shadows on the sheet', () => {
    const r = rule('.sprite-card.selected');
    assert.ok(/box-shadow:\s*0 0 0 2px #00ff00/.test(r), 'hard 2px ring');
    const a = rule(".sprite-card.selected::after");
    assert.ok(/content:\s*'SELECTED'/.test(a), 'SELECTED tag');
    assert.ok(/font-family:\s*'GNF'/.test(a) && /font-size:\s*16px/.test(a) && /line-height:\s*24px/.test(a), 'GNF 16/24');
    assert.ok(/bottom:\s*4px/.test(a) && /left:\s*4px/.test(a), 'bottom-left, clear of the top-right badge');
    const blurred = css.split('\n').filter(l => /box-shadow:\s*(inset\s+)?-?\d+(px)?\s+-?\d+(px)?\s+[1-9]\d*px/.test(l));
    assert.ok(blurred.length === 0, 'blurred shadows: ' + blurred.join(' | '));
});
