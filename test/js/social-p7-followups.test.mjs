// Phase 7 follow-up runtime packet (PHASE7_PACKETS.md "Follow-up runtime packet"), the two
// items that live in scenario data and are checked here on the real modules:
//  - the defend-only shells' training kiosk stops saying "N messages are waiting" once the
//    round is done: observationVariants on episode_<id>_defend_complete, resolved by
//    utils/conditional-text.js (the same call the hover menu and the interaction use);
//  - E7's debrief does not say the same thing three times: the voice panel, rendered by the
//    real debrief view, no longer repeats the defendOnly line and the Monday card.
// The other follow-ups are tested beside their modules: social-triage-weakest (wording and
// Verify counted as caught), social-triage-scoring (Verify) and social-episode-runner (the
// defend button for phone and voice sets).
// Run with: bundle exec node --test test/js/social-p7-followups.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-p7-followups-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'utils/conditional-text.js', 'minigames/episode-runner/debrief-view.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/inbox-triage/triage-scoring.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'utils/display-dashes.js', 'ui/influence-bar.js', 'systems/social-influence.js',
    'systems/phish-rules.js', 'systems/global-writer.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { resolveObjectField } = await mod('utils/conditional-text.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');

const DEFEND_SHELLS = [
    'awareness_e1_invoice_fraud_defend', 'awareness_e2_cv_lures_defend', 'awareness_e3_helpdesk_reset_defend',
    'awareness_e4_exec_whaling_defend', 'awareness_e5_signin_pages_defend', 'awareness_e6_texts_and_qr_defend',
    'awareness_e7_voice_ceo_defend'
];
const loadShell = (name) => {
    const text = readFileSync(join(root, 'scenarios', name, 'scenario.json.erb'), 'utf8');
    assert.ok(!text.includes('<%'), `${name} is plain JSON`);
    return JSON.parse(text);
};
const kioskOf = (scn) => Object.values(scn.rooms).flatMap((r) => r.objects || []).find((o) => o.type === 'kiosk');

test('kiosk fixture: observationVariants on the done global swap the text without engine help', () => {
    const kiosk = {
        type: 'kiosk', observations: 'A kiosk. Five messages are waiting.',
        observationVariants: [{ condition: 'globalVars.episode_fx_defend_done', value: 'A kiosk. All five messages are sorted.' }],
        minigameData: { episodeId: 'fx' }
    };
    assert.equal(resolveObjectField(kiosk, 'observations', null, { episode_fx_defend_done: false }), 'A kiosk. Five messages are waiting.');
    assert.equal(resolveObjectField(kiosk, 'observations', null, { episode_fx_defend_done: true }), 'A kiosk. All five messages are sorted.');
    // the default reads window.gameState, which the shared writer updates when the round ends
    window.gameState.globalVariables = { episode_fx_defend_done: true };
    assert.equal(resolveObjectField(kiosk, 'observations'), 'A kiosk. All five messages are sorted.');
    window.gameState.globalVariables = {};
});

test('defend-only shells: the kiosk text changes once episode_<id>_defend_complete is true', () => {
    for (const name of DEFEND_SHELLS) {
        const scn = loadShell(name);
        const kiosk = kioskOf(scn);
        assert.ok(kiosk, `${name} has a kiosk`);
        const doneKey = `episode_${kiosk.minigameData.episodeId}_defend_complete`;
        assert.equal(scn.globalVariables[doneKey], false, `${name} declares ${doneKey}`);
        assert.equal(kiosk.observationVariants?.[0]?.condition, `globalVars.${doneKey}`, name);
        const before = resolveObjectField(kiosk, 'observations', null, { [doneKey]: false });
        const after = resolveObjectField(kiosk, 'observations', null, { [doneKey]: true });
        assert.equal(before, kiosk.observations, name);
        assert.notEqual(after, before, name);
        assert.doesNotMatch(after, /waiting/i, `${name}: nothing is waiting after the round`);
    }
});

test('E7 debrief: the voice panel adds the how, not a third copy of "ring back, a voice is not proof"', () => {
    const scn = loadShell('awareness_e7_voice_ceo_defend');
    const strings = scn.social.awarenessEpisode.strings;
    const h = document.createElement('div');
    document.body.appendChild(h);
    const d = renderDebrief(h, { result: { percent: 80, answers: [] }, set: { messages: [] }, variant: 'defendOnly', strings, onFinish() {} });
    assert.equal(d.getState().voicePanel, true);
    const panel = h.querySelector('.aw-voice-panel').textContent;
    const lead = h.querySelector('.aw-defend-only').textContent;
    const monday = h.querySelector('.aw-monday').textContent;
    // the points the lead and the Monday card already make
    for (const phrase of ['not proof', 'number you already hold', 'backs it up']) {
        assert.ok(lead.includes(phrase) || monday.includes(phrase), `"${phrase}" is said elsewhere`);
        assert.ok(!panel.includes(phrase), `the voice panel does not repeat "${phrase}"`);
    }
    assert.match(panel, /recordings/i, 'the panel keeps how a voice gets copied');
    h.remove();
});
