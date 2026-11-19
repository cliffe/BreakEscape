// m03 end screen: the single centred credits line "ZERO DAY CATALOGUE: IN SAFETYNET
// HANDS ..." was wider than the central map panel and ran over the COMMS INTEL panel.
// The label had no width cap (only closing-card rows did). Every label write now
// carries the .bv-cr-label class, which caps it to the centre panel and wraps.
// Run with: node --max-old-space-size=2048 test/js/credits-long-line-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/bond-visualiser.css'), 'utf8');
const js = readFileSync(join(root, 'js/music/bond-visualiser.js'), 'utf8');

const ruleFor = (sel) => {
    const i = css.indexOf(`${sel} {`);
    assert.ok(i >= 0, `rule ${sel} exists`);
    return css.slice(i, css.indexOf('}', i));
};

test('the credits label is capped to the centre panel and wraps', () => {
    const r = ruleFor('#bv-credits-overlay #bv-cr-label.bv-cr-label');
    const m = r.match(/max-width: calc\(100% - (\d+)px\)/);
    assert.ok(m, 'label max-width is calc(100% - Npx) of the fixed overlay');
    const reserve = Number(m[1]);
    const stage = ruleFor('#bond-vis-overlay .bv-stage');
    const cols = stage.match(/grid-template-columns:\s*(\d+)px\s+minmax\(0,\s*1fr\)\s+(\d+)px/);
    assert.ok(cols, 'stage is side panel, centre, side panel');
    const gap = Number(stage.match(/gap:\s*(\d+)px/)[1]);
    const pad = Number(ruleFor('#bond-vis-overlay .bv-app').match(/padding:\s*(\d+)px/)[1]);
    const need = 2 * (pad + Number(cols[1]) + gap);
    assert.ok(Number(cols[1]) === Number(cols[2]), 'side panels equal width');
    assert.ok(reserve >= need, `reserve ${reserve}px covers padding, panels and gaps (${need}px)`);
    assert.match(r, /line-height: 1\.2/);
    assert.match(r, /box-sizing: border-box/);
    assert.match(r, /overflow-wrap: anywhere/);
    assert.ok(r.indexOf('text-wrap: pretty') >= 0 && r.indexOf('text-wrap: pretty') < r.indexOf('text-wrap: balance'));
});

test('with the side panels hidden the label takes the window and keeps its side padding', () => {
    const narrow = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
    assert.match(narrow, /#bv-cr-label\.bv-cr-label \{ max-width: calc\(100% - 20px\); padding: 8px 10%; \}/);
});

test('every place that styles the label gives it the class and no inline padding', () => {
    const creators = js.split("label.style.cssText").length - 1;
    const classed = js.split("label.className = 'bv-cr-label'").length - 1;
    assert.equal(creators, 3, 'label styled in start, per line, hold');
    assert.equal(classed, 3, 'class set in _startCredits (twice) and the hold line');
    assert.ok(!/label\.style\.cssText[^\n]*padding:0 10%/.test(js), 'inline padding would defeat the cap');
});

test('the single-line label is not left unconstrained (old code had no class)', () => {
    const fn = js.slice(js.indexOf('function _startCredits'), js.indexOf('function _stopCredits'));
    assert.match(fn, /label\.className = 'bv-cr-label'/);
});
