// A credits entry can set the visualiser's header (headerText), so a failure ending
// (m10's Join ENTROPY, m01's launch) no longer prints MISSION COMPLETE // AUDIO INTEL.
// The header must survive the conclusionScreen's BondVisualiser.open({}) that can
// follow the credits (objectives-manager.js), as the theme already does.
// Run with: node --test test/js/credits-header-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const music = join(here, '../../public/break_escape/js/music');
const T = await import('data:text/javascript;base64,' + readFileSync(join(music, 'credits-theme.js')).toString('base64'));
const vis = readFileSync(join(music, 'bond-visualiser.js'), 'utf8');
const events = readFileSync(join(music, 'scenario-music-events.js'), 'utf8');

const FAILED = 'MISSION FAILED // AUDIO INTEL';

test('no headerText keeps the old header', () => {
    assert.equal(T.DEFAULT_CREDITS_HEADER, 'MISSION COMPLETE // AUDIO INTEL');
    const h = T.nextCreditsHeader(null, { credits: [{ text: 'MISSION COMPLETE' }] });
    assert.equal(h, null);
    assert.equal(T.creditsHeader(h, undefined), T.DEFAULT_CREDITS_HEADER);
    assert.equal(T.creditsHeader(h, 'INCIDENT REVIEW'), 'INCIDENT REVIEW', 'a theme heading still wins over the default');
});

test('headerText on the credits open sets the header, over a theme heading too', () => {
    const h = T.nextCreditsHeader(null, { credits: [{ text: 'MISSION FAILED' }], headerText: `  ${FAILED} ` });
    assert.equal(h, FAILED);
    assert.equal(T.creditsHeader(h, undefined), FAILED);
    assert.equal(T.creditsHeader(h, 'INCIDENT REVIEW'), FAILED);
});

test('a later open({}) or open() keeps the header the credits chose', () => {
    let h = T.nextCreditsHeader(null, { credits: [{ text: 'MISSION FAILED' }], headerText: FAILED });
    h = T.nextCreditsHeader(h, {});          // objectives-manager conclusionScreen
    h = T.nextCreditsHeader(h, undefined);   // toggle / victory auto-open
    assert.equal(h, FAILED);
});

test('a new credits roll without headerText goes back to the default; blank text is ignored', () => {
    assert.equal(T.nextCreditsHeader(FAILED, { credits: [{ text: 'x' }] }), null);
    assert.equal(T.nextCreditsHeader(FAILED, { headerText: '   ' }), FAILED);
    assert.equal(T.nextCreditsHeader(null, { headerText: 42 }), null);
});

test('the visualiser applies the header on every open, after the theme text', () => {
    const fn = vis.slice(vis.indexOf('function _applyTheme(opts)'), vis.indexOf('function _applyScenarioOverlay'));
    assert.match(fn, /_headerText = nextCreditsHeader\(_headerText, opts\)/);
    const overlay = fn.indexOf('_applyOverlayText(t)');
    const header = fn.indexOf('creditsHeader(_headerText, t?.heading)');
    assert.ok(overlay > 0 && header > overlay, 'header set after the theme overlay text');
    // The theme is re-resolved from the scenario, not from opts, so open({}) cannot change it.
    assert.match(fn, /_theme {4}= resolveCreditsTheme\(window\.gameScenario\)/);
    const open = vis.slice(vis.indexOf('function _open_overlay('), vis.indexOf('function _close_overlay('));
    assert.match(open, /_applyTheme\(opts\)/);
});

test('a music-event credits entry passes its headerText to the visualiser', () => {
    const fn = events.slice(events.indexOf('const openCredits = '), events.indexOf('concludeMission().then'));
    assert.match(fn, /headerText: {3}entry\.headerText/);
});
