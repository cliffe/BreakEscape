import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

// CA-1 (UI sweep, Major): ca12 is a visitor / tailgating episode whose triage items are all kind
// `call`. With no authored set.nudges and no resultCopy.weakest, the folded debrief's weakest-skill
// pointer fell through to the generic kind line, which for an all-`call` set is the phone-call
// wording ("If a caller, prompt or voicemail pushes you to act..."). Nobody phoned: the learner was
// on reception. This test pins that the set now authors a nudge for every tell it can name as
// weakest, and that the debrief shows the authored reception-desk line, not the phone fallback.
//
// Run with: node test/js/social-ca12-nudges.test.mjs

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-ca12-nudges-'));
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

const PHONE_FRAGMENT = 'caller, prompt or voicemail';

// The tells this set can name as weakest: the five scenario-local tells plus the two shared-library
// tells that appear on items 3 and 4.
const WEAKABLE = ['tailgating', 'no_escort', 'uniform_pretext', 'not_expected', 'unlocked_screen',
    'borrowed_authority', 'secrecy_or_bypass'];

const readSet = (p) => {
    const data = JSON.parse(readFileSync(join(root, p), 'utf8'));
    const social = data.social || data;
    return (social.triageSets || []).find((t) => t.id === 'e12_reception_desk');
};

const SOURCES = {
    'fragment': 'planning_notes/phishing_and_social_engineering/awareness/e12/defend.json',
    'full erb': 'scenarios/ca12_visitor_tailgater/scenario.json.erb',
    'defend twin': 'scenarios/ca12_visitor_tailgater_defend/scenario.json.erb',
    'test fixture': 'scenarios/test_ca12_fallback/scenario.json.erb'
};

for (const [label, path] of Object.entries(SOURCES)) {
    test(`ca12 ${label}: the reception set authors a nudge for every weakable tell, none phone-flavoured`, () => {
        const set = readSet(path);
        assert.ok(set, `${label}: no e12_reception_desk set`);
        assert.ok(set.nudges && typeof set.nudges === 'object', `${label}: set has no nudges`);
        for (const id of WEAKABLE) {
            assert.ok(typeof set.nudges[id] === 'string' && set.nudges[id].length > 0,
                `${label}: no nudge for ${id}`);
            assert.ok(!set.nudges[id].includes(PHONE_FRAGMENT),
                `${label}: the ${id} nudge carries the phone wording`);
        }
    });
}

test('ca12 debrief: the folded weakest line uses the authored nudge, not the phone fallback', () => {
    const set = readSet(SOURCES.fragment);
    // The set is all-`call`, so the generic fallback for this set IS the phone line (this is the bug
    // the nudges fix). The debrief-view wiring mirrors foldedWeakestNudge for a set with no
    // resultCopy.weakest: kinds come from the set's messages.
    const kinds = (set.messages || []).map((m) => m.kind || 'email');
    const fallback = awarenessWeakestLineFor(kinds, 'it');
    assert.ok(fallback.includes(PHONE_FRAGMENT), 'the all-call fallback is the phone line (guards the premise)');

    // no_escort is missed on three items; the debrief names it as weakest.
    const result = {
        percent: 50,
        flagRecall: { caught: 1 },
        perFactor: { no_escort: { caught: 0, missed: 3 } }
    };
    const container = document.createElement('div');
    renderDebrief(container, {
        result, set, folded: true, bandHeadline: 'Worth practising',
        // exactly how episode-runner-minigame.js wires weakestNudge for a folded debrief.
        weakestNudge: () => fallback
    });
    const weak = container.querySelector('.aw-weakest')?.textContent || '';
    assert.ok(weak.length, 'the weakest line rendered');
    assert.ok(!weak.includes(PHONE_FRAGMENT), `the phone fallback should not show: "${weak}"`);
    assert.ok(weak.includes(set.nudges.no_escort), 'the authored no_escort nudge shows');
});
