import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

// CA-1 (UI sweep, Major): ca10 is a downloads-and-fake-checks episode whose triage items are all
// kind `page`. With no authored set.nudges and no resultCopy.weakest, the folded debrief's
// weakest-skill pointer fell through to the generic kind line, which for an all-`page` set is the
// sign-in wording ("Read the address bar before you sign in to any page..."). Nobody was signing in:
// the learner was closing fake checks, fake updates, fake alarms and dangerous downloads. This test
// pins that the set now authors a nudge for every tell it can name as weakest, and that the debrief
// shows the authored browser-habit line, not the sign-in fallback.
//
// Run with: node test/js/social-ca10-nudges.test.mjs

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-ca10-nudges-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/triage-scoring.js', 'minigames/inbox-triage/triage-messages.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/inbox-triage/triage-comparison.js', 'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'systems/phish-rules.js',
    'utils/global-condition.js', 'minigames/episode-runner/debrief-view.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { awarenessWeakestLineFor } = await mod('minigames/inbox-triage/triage-kinds.js');

const PAGE_FRAGMENT = 'before you sign in to any page';

// The tells this set can name as weakest: the five scenario-local tells carried in truth.flags. The
// two shared-library tells (lookalike_domain, padlock_myth) appear only in whyFine, never in any
// item's flags, so the debrief can never name them as weakest.
const WEAKABLE = ['fake_check_paste', 'fake_update_prompt', 'dangerous_download', 'fake_alarm_callback',
    'browser_permission_grab'];

const readSet = (p) => {
    const data = JSON.parse(readFileSync(join(root, p), 'utf8'));
    const social = data.social || data;
    return (social.triageSets || []).find((t) => t.id === 'e10_browser_morning');
};

const SOURCES = {
    'fragment': 'planning_notes/phishing_and_social_engineering/awareness/e10/defend.json',
    'full erb': 'scenarios/ca10_downloads_and_fake_checks/scenario.json.erb',
    'defend twin': 'scenarios/ca10_downloads_and_fake_checks_defend/scenario.json.erb'
};

for (const [label, path] of Object.entries(SOURCES)) {
    test(`ca10 ${label}: the browser set authors a nudge for every weakable tell, none sign-in-flavoured`, () => {
        const set = readSet(path);
        assert.ok(set, `${label}: no e10_browser_morning set`);
        assert.ok(set.nudges && typeof set.nudges === 'object', `${label}: set has no nudges`);
        for (const id of WEAKABLE) {
            assert.ok(typeof set.nudges[id] === 'string' && set.nudges[id].length > 0,
                `${label}: no nudge for ${id}`);
            assert.ok(!set.nudges[id].includes(PAGE_FRAGMENT),
                `${label}: the ${id} nudge carries the sign-in wording`);
        }
    });
}

test('ca10: the nudge text is identical in the fragment, the full erb and the defend twin', () => {
    const [a, b, c] = Object.values(SOURCES).map((p) => readSet(p).nudges);
    assert.deepEqual(b, a, 'full erb nudges equal the fragment');
    assert.deepEqual(c, a, 'defend twin nudges equal the fragment');
});

test('ca10 debrief: the folded weakest line uses the authored nudge, not the sign-in fallback', () => {
    const set = readSet(SOURCES.fragment);
    // The set is all-`page`, so the generic fallback for this set IS the sign-in line (this is the bug
    // the nudges fix). The debrief-view wiring mirrors foldedWeakestNudge for a set with no
    // resultCopy.weakest: kinds come from the set's messages.
    const kinds = (set.messages || []).map((m) => m.kind || 'email');
    const fallback = awarenessWeakestLineFor(kinds, 'it');
    assert.ok(fallback.includes(PAGE_FRAGMENT), 'the all-page fallback is the sign-in line (guards the premise)');

    // fake_check_paste is the weakest tell here (missed, nothing caught); the debrief names it as weakest.
    const result = {
        percent: 50,
        flagRecall: { caught: 1 },
        perFactor: { fake_check_paste: { caught: 0, missed: 1 } }
    };
    const container = document.createElement('div');
    renderDebrief(container, {
        result, set, folded: true, bandHeadline: 'Worth practising',
        // exactly how episode-runner-minigame.js wires weakestNudge for a folded debrief.
        weakestNudge: () => fallback
    });
    const weak = container.querySelector('.aw-weakest')?.textContent || '';
    assert.ok(weak.length, 'the weakest line rendered');
    assert.ok(!weak.includes(PAGE_FRAGMENT), `the sign-in fallback should not show: "${weak}"`);
    assert.ok(weak.includes(set.nudges.fake_check_paste), 'the authored fake_check_paste nudge shows');
});
