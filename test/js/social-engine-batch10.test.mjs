// Engine batch 10 (awareness build): the authorable critical-miss penalty and cap (E8/E15/E16),
// "Nothing looks wrong" counted as an answer on the result screen (E17 B2), and the debrief's
// sort-drill recap of cards placed in a wrong bin (E17 B2).
// Run with: node --test test/js/social-engine-batch10.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-batch10-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/episode-model.js'
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
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { scoreTriage, CRITICAL_PENALTY } = await mod('minigames/inbox-triage/triage-scoring.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { drillRecord } = await mod('minigames/episode-runner/episode-model.js');

let current = null;
function open(set, params = {}) {
    current?.cleanup?.();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function act(s, id, action, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); if (!i) throw new Error(`no chip ${c}`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
const toResult = (s) => { const n = $(s, '.tri-next'); if (n) click(n); };

const phishEmail = { id: 'phish_mail', from: { name: 'IT Desk', address: 'it@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Sign in to keep your account', time: '09:10', body: 'Sign in now.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain', 'urgencyCalibrated'] } };
const realEmail = { id: 'real_mail', from: { name: 'Marsh End', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order 4471', time: '09:00', body: 'Thanks.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'A real supplier.' } } };
const reals = (n) => Array.from({ length: n }, (_, i) => ({ ...realEmail, id: `r${i}` }));
const trustAll = (msgs) => msgs.map((m) => ({ id: m.id, verdict: 'trust', flags: [] }));
const awareSet = (messages, over = {}) => ({
    id: 'b10', title: 'B10', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', outcome: { setGlobalPrefix: 'b10_', passPercent: 0 }, messages, ...over
});

// ── item 1: the authorable critical-miss penalty and cap ──────────────────────

test('batch-10: the default critical penalty and cap are unchanged (15 per miss, no cap)', () => {
    const msgs = [phishEmail, ...reals(6)];
    const answers = [{ id: 'phish_mail', verdict: 'trust', flags: [] }, ...trustAll(msgs.slice(1))];
    const r = scoreTriage({ messages: msgs, answers });
    assert.equal(r.criticalPenaltyPer, CRITICAL_PENALTY);
    assert.equal(r.criticalPenalty, 15, 'one miss, 15 off');
    assert.equal(r.criticalPenaltyCapped, false);
    // mean of (0, 100, 100, 100, 100, 100, 100) = 86; 86 - 15 = 71
    assert.equal(r.percent, Math.round(600 / 7) - 15);
});

test('batch-10: set.scoring.criticalPenalty lowers the per-miss points', () => {
    const msgs = [phishEmail, ...reals(6)];
    const answers = [{ id: 'phish_mail', verdict: 'trust', flags: [] }, ...trustAll(msgs.slice(1))];
    const r = scoreTriage({ messages: msgs, answers, scoring: { criticalPenalty: 5 } });
    assert.equal(r.criticalPenaltyPer, 5);
    assert.equal(r.criticalPenalty, 5);
    assert.equal(r.percent, Math.round(600 / 7) - 5);
});

test('batch-10: set.scoring.criticalPenaltyCap caps the total points off', () => {
    // three trusted phish emails among genuine mail
    const phish = [phishEmail, { ...phishEmail, id: 'p2' }, { ...phishEmail, id: 'p3' }];
    const msgs = [...phish, ...reals(4)];
    const answers = trustAll(msgs);
    const uncapped = scoreTriage({ messages: msgs, answers });
    assert.equal(uncapped.criticalPenalty, 45, 'three misses at 15 each');
    const r = scoreTriage({ messages: msgs, answers, scoring: { criticalPenaltyCap: 20 } });
    assert.equal(r.criticalPenalty, 20, 'capped at 20');
    assert.equal(r.criticalPenaltyCapped, true);
    assert.equal(r.criticalPenaltyPer, 15);
});

test('batch-10: the result line names the real total when a cap bites, and is unchanged by default', () => {
    // default: the line keeps the "15 points off the round each" wording
    const s1 = open(awareSet([phishEmail, { ...phishEmail, id: 'p2' }]));
    click($(s1, '.tri-start'));
    act(s1, 'phish_mail', 'trust');
    act(s1, 'p2', 'trust');
    toResult(s1);
    assert.match($(s1, '.tri-critical').textContent, /That costs 15 points off the round each/);

    // capped: the line reads the real total off
    const s2 = open(awareSet([phishEmail, { ...phishEmail, id: 'p2' }], { scoring: { criticalPenaltyCap: 20 } }));
    click($(s2, '.tri-start'));
    act(s2, 'phish_mail', 'trust');
    act(s2, 'p2', 'trust');
    toResult(s2);
    assert.match($(s2, '.tri-critical').textContent, /That took 20 points off the round/);
});

// ── item 3: "Nothing looks wrong" counts as an answer ─────────────────────────

test('batch-10 (E17 B2): choosing "Nothing looks wrong" shows the skill breakdown, not "named no flags"', () => {
    const s = open(awareSet([phishEmail, realEmail]));
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'report', ['none']); // chose Nothing looks wrong on the phish
    act(s, 'real_mail', 'trust', ['none']);
    toResult(s);
    // the breakdown stands (skill lines), and the "you named no flags" lead is not shown
    assert.ok($$(s, '.tri-skill').length > 0, 'the skill breakdown is shown');
    assert.doesNotMatch(s.container.textContent, /didn't tick anything you noticed/);
    assert.doesNotMatch(s.container.textContent, /didn't name any flags/);
});

test('batch-10: answering with no flags and no "Nothing looks wrong" still shows the no-flags line', () => {
    const s = open(awareSet([phishEmail, realEmail]));
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'report'); // nothing ticked at all
    act(s, 'real_mail', 'trust');
    toResult(s);
    assert.equal($$(s, '.tri-skill').length, 0, 'no skill breakdown when nothing was named');
    assert.match(s.container.textContent, /nothing to grade/);
});

// ── item 2: the debrief's sort-drill recap ────────────────────────────────────

const recapResult = { percent: 80, phishTotal: 0, answers: [] };
const recapSet = { id: 'e17', messages: [], scoringProfile: 'awareness' };

test('batch-10 (E17 B2): the debrief recaps the wrong-bin sort-drill cards with the right bin and reason', () => {
    const h = document.createElement('div');
    const d = renderDebrief(h, {
        result: recapResult, set: recapSet, variant: 'defendOnly', onFinish() {},
        drillRecap: [{ situation: 'Stream football on the work laptop', chosen: 'Allowed', right: 'Not allowed',
            reason: 'Personal streaming is not for work kit.' }]
    });
    const box = h.querySelector('.aw-drill-recap');
    assert.ok(box, 'the recap section renders');
    assert.equal(box.querySelector('.aw-drill-recap-title').textContent, 'Cards to look at again');
    assert.equal(box.querySelector('.aw-drill-recap-situation').textContent, 'Stream football on the work laptop');
    assert.equal(box.querySelector('.aw-drill-recap-move').textContent, 'You put this in Allowed. It goes in Not allowed.');
    assert.equal(box.querySelector('.aw-drill-recap-reason').textContent, 'Personal streaming is not for work kit.');
    assert.equal(d.getState().drillRecap, 1);
});

test('batch-10: no drillRecap draws nothing and adds no getState key', () => {
    const h = document.createElement('div');
    const d = renderDebrief(h, { result: recapResult, set: recapSet, variant: 'defendOnly', onFinish() {} });
    assert.equal(h.querySelector('.aw-drill-recap'), null);
    assert.equal('drillRecap' in d.getState(), false);
});

test('batch-10: strings.drillRecapHeading overrides the recap heading', () => {
    const h = document.createElement('div');
    renderDebrief(h, {
        result: recapResult, set: recapSet, variant: 'defendOnly', onFinish() {},
        strings: { drillRecapHeading: 'Worth another look' },
        drillRecap: [{ situation: 'A card', chosen: 'Bin A', right: 'Bin B', reason: '' }]
    });
    assert.equal(h.querySelector('.aw-drill-recap-title').textContent, 'Worth another look');
});

// ── the drill record keeps the recap (scored only) ────────────────────────────

test('batch-10: drillRecord keeps the wrong-bin recap on a scored drill, and none on an unscored one', () => {
    const raw = { scored: true, total: 3, placed: 3, correct: 2, percent: 67,
        placements: [{ id: 'c1', bin: 'allowed', correct: true }, { id: 'c2', bin: 'allowed', correct: false }],
        recap: [{ id: 'c2', situation: 'Stream football', chosen: 'Allowed', right: 'Not allowed', reason: 'Not on work kit.' }] };
    const rec = drillRecord(raw);
    assert.equal(rec.scored, true);
    assert.deepEqual(rec.recap, [{ situation: 'Stream football', chosen: 'Allowed', right: 'Not allowed', reason: 'Not on work kit.' }]);
    const unscored = drillRecord({ scored: false, total: 3, placed: 3, recap: [{ id: 'c2', situation: 'x' }] });
    assert.equal('recap' in unscored, false, 'no recap kept on an unscored drill');
});
