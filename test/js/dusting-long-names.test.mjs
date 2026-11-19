// A long candidate name ("Bartholomew Featherstonehaugh-Smythe") must not push the compare screen out of its frame:
// the card caption wraps whole (no clamp), the pair caption is clamped to one line (CSS), the full name stays in the title and accessible name, a rejected
// card keeps its "(not a match)" tag as text, and the panel keeps 480 px beside the pair.
// Run with: node --test test/js/dusting-long-names.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/dusting');
const read = rel => readFileSync(join(dir, rel), 'utf8');
const load = rel => import('data:text/javascript;base64,' + Buffer.from(read(rel)).toString('base64'));
const css = readFileSync(join(here, '../../public/break_escape/css/dusting.css'), 'utf8');
const game = read('dusting-game.js');
const M = await load('dusting-model.js');

const rule = sel => {
    const i = css.indexOf(sel + ' {');
    assert.ok(i >= 0, `rule ${sel} exists`);
    return css.slice(i, css.indexOf('}', i));
};

test('the card name is shown whole as text (no clamp, no ellipsis); the tag is its own line', () => {
    const r = rule('.dusting-ref-name');
    assert.match(r, /display: block/);
    assert.match(r, /overflow-wrap: anywhere/);
    assert.doesNotMatch(r, /line-clamp|nowrap|ellipsis|overflow: hidden/);
    assert.doesNotMatch(css, /\.dusting-ref-name:not\(:last-child\)/);
    const tag = rule('.dusting-ref-tag');
    assert.match(tag, /display: block/);
    assert.doesNotMatch(tag, /ellipsis|nowrap/);
});

test('the pair caption is one line, clipped to its pane, and carries the full name as its title', () => {
    const r = rule('.dusting-zoom-cap');
    assert.match(r, /white-space: nowrap/);
    assert.match(r, /text-overflow: ellipsis/);
    assert.match(r, /overflow: hidden/);
    assert.match(r, /width: 0; min-width: 100%/, 'a long caption cannot widen the pane or the stage column');
    assert.match(game, /capEl\.title = cap;/);
});

test('the panel keeps at least 480 px beside the pair, for two and three cards, and 600 for four', () => {
    assert.equal(M.PANEL_MIN_W, 480);
    assert.equal(M.comparePanelMin(2), 480);
    assert.equal(M.comparePanelMin(3), 3 * M.REF_CARD_W + 2 * M.REF_GAP + M.PANEL_SLACK);
    assert.ok(M.comparePanelMin(3) >= 480);
    assert.equal(M.comparePanelMin(4), 4 * M.REF_CARD_W + 3 * M.REF_GAP_GRID);
});

test('with two cards on a 1280 frame (rootW 924) a 100 px crop is stacked so the panel keeps 480', () => {
    const p = M.zoomPlanBeside({ side: 100, rootW: 924, cards: 2, budgetH: 480 });
    const pairW = p.stacked ? p.W + 4 : 2 * (p.W + 4) + 8;
    assert.ok(924 - 32 - 16 - pairW >= 480, `panel ${924 - 32 - 16 - pairW}`);
});

test('desktop compare: heading and quality share a row, rows sit 4 px apart', () => {
    assert.match(css, /\[data-step="compare"\] \.dusting-panel > h3 \{ float: left;/);
    assert.match(css, /\[data-step="compare"\] \.dusting-panel > p:not\(\.dusting-result\) \{ clear: both; \}/);
    assert.match(css, /\[data-step="compare"\] \.dusting-panel p \{ margin-bottom: 4px; \}/);
});

test('a side-by-side pair that would leave the panel under 640 px is stacked at the same scale when the height allows', () => {
    const sbs = M.zoomPlan({ side: 82, availW: 924 - 52 - 480, budgetH: 480 });
    assert.equal(sbs.stacked, false, 'plain zoomPlan still picks side by side on a tie');
    const p = M.zoomPlanBeside({ side: 82, rootW: 924, cards: 3, budgetH: 480 });
    assert.equal(p.stacked, true);
    assert.equal(p.S, sbs.S);
    assert.ok(924 - 32 - 16 - (p.W + 4) >= M.PANEL_ROOMY_W);
    // no height for a stacked pair: stay side by side
    const flat = M.zoomPlanBeside({ side: 82, rootW: 924, cards: 3, budgetH: 240 });
    assert.equal(flat.stacked, false);
    assert.equal(flat.S, 2);
    assert.equal(M.PANEL_ROOMY_W, 640);
});
