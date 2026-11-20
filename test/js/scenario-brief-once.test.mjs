// show_scenario_brief "once" (2026-10-04, sis01 tidy round F3): the Mission
// Brief pops up on the first start only. sis01 used "on_start", which reopened
// it after every reload. "once" records the showing in the saved game
// (player_state scenarioBriefShown, returned by GET /scenario), so later loads
// leave it in the Notepad. The other modes are unchanged.
// Run with: node --test test/js/scenario-brief-once.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/utils/scenario-brief.js'), 'utf8');
const { shouldShowBriefPopup, recordScenarioBriefShown } =
    await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

test('"once": shown on a first start, not once the save says it was shown', () => {
    assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'once' }, { hasProgress: false }), true);
    assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'once' }, { hasProgress: true }), true,
                 'a reload before the popup ever appeared still shows it');
    assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'once', scenarioBriefShown: true }, { hasProgress: true }), false);
    assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'once' }, {}, { scenarioBriefShown: true }), false,
                 'shown earlier in this page session');
});

test('other modes are unchanged', () => {
    for (const shown of [false, true]) {
        assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'on_start', scenarioBriefShown: shown }, { hasProgress: true }), true);
        assert.equal(shouldShowBriefPopup({ scenarioBriefShown: shown }, { hasProgress: false }), true, 'omitted = every load');
        assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'on_resume', scenarioBriefShown: shown }, { hasProgress: false }), false);
        assert.equal(shouldShowBriefPopup({ show_scenario_brief: 'on_resume', scenarioBriefShown: shown }, { hasProgress: true }), true);
    }
    assert.equal(shouldShowBriefPopup(null), false);
});

test('recording sends one sync_state with the flag, and only once', async () => {
    const calls = [];
    const win = {
        gameState: {},
        breakEscapeConfig: { apiBasePath: '/break_escape/games/7', csrfToken: 't' },
        fetch: async (url, opts) => { calls.push([url, opts.method, JSON.parse(opts.body)]); return { ok: true }; }
    };
    await recordScenarioBriefShown(win);
    await recordScenarioBriefShown(win);

    assert.equal(win.gameState.scenarioBriefShown, true);
    assert.deepEqual(calls, [['/break_escape/games/7/sync_state', 'PUT', { scenarioBriefShown: true }]]);
});

test('recording offline only marks the page state', () => {
    const win = { gameState: {} };
    assert.equal(recordScenarioBriefShown(win), null);
    assert.equal(win.gameState.scenarioBriefShown, true);
});
