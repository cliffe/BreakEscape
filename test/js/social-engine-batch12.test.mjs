// Engine batch 12 (awareness build): inbox-triage and debrief levers —
//   item 1  the "Verdict locked" live notice is screen-reader only under immediate feedback
//   item 2  a set can keep a Verify out of the team badge count
//   item 3  the debrief's weakest-skill line is suppressed when no flag was named
//   item 7  a per-verdict IT Security reply matches the action taken
//   item 8  a per-item deleteLine words the genuine-delete feedback
//   item 16 the caught-breakdown split uses the set's own verdict verbs
//   item 17 the no-ticks confirm prompt reads as optional
// Run with: node --test test/js/social-engine-batch12.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

// batch 13 item 6: the no-ticks confirm prompt is on by default now. These tests predate it and
// press Confirm once expecting a lock, so their sets pin it off unless they name it themselves.
const withOneConfirm = (set) => (set && typeof set === 'object' && !('confirmPrompt' in set) ? { ...set, confirmPrompt: false } : set);

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-engine-batch12-'));
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
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { caughtHow } = await mod('minigames/inbox-triage/triage-scoring.js');
const { verdictVerbOverride } = await mod('minigames/inbox-triage/triage-kinds.js');

let current = null;
function open(set, params = {}) {
    current?.cleanup?.();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    set = withOneConfirm(set);
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
function act(s, id, action) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    click($(s, '.tri-confirm'));
}

const phish = (id, over = {}) => ({ id, from: { name: 'IT Desk', address: 'it@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Sign in now', time: '09:10', body: 'Sign in.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain'] }, ...over });
const real = (id, over = {}) => ({ id, from: { name: 'Marsh End', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order', time: '09:00', body: 'Thanks.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'A real supplier.' } }, ...over });
const awareSet = (messages, over = {}) => ({
    id: 'b12', title: 'B12', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', outcome: { setGlobalPrefix: 'b12_', passPercent: 0 }, messages, ...over
});

// ── item 1: the "Verdict locked" live notice is screen-reader only in immediate mode ──
test('item 1: immediate feedback hides the "Verdict locked" notice from sight (sr-only)', () => {
    const s = open(awareSet([phish('p1'), real('r1')]));
    assert.ok($(s, '.tri-live').classList.contains('tri-live-sr'), 'the live notice is sr-only under immediate feedback');
});
test('item 1: end-of-round feedback keeps the notice visible (no card during the sort)', () => {
    const s = open(awareSet([phish('p1'), real('r1')], { feedbackMode: 'end' }));
    assert.ok(!$(s, '.tri-live').classList.contains('tri-live-sr'), 'end mode keeps the notice visible');
});

// ── item 2: a Verify can be kept out of the team badge count ────────────────────
test('item 2: default counts a Verify toward the team badge', () => {
    const s = open(awareSet([phish('p1'), phish('p2')]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'report');
    act(s, 'p2', 'verify');
    assert.equal(s.teamProtectedCount(), 2, 'report and verify both count by default');
});
test('item 2: teamBadgeCountsChecked:false keeps a Verify out of the count', () => {
    const s = open(awareSet([phish('p1'), phish('p2')], { labels: { teamBadgeCountsChecked: false } }));
    click($(s, '.tri-start'));
    act(s, 'p1', 'report');
    act(s, 'p2', 'verify');
    assert.equal(s.teamProtectedCount(), 1, 'only the report counts when checks are excluded');
});

// ── item 7: a per-verdict reply matches the action taken ────────────────────────
test('item 7: truth.reportReplyByVerdict shows the Verify reply after a Verify', () => {
    const s = open(awareSet([
        phish('p1', { truth: { isPhish: true, flags: ['lookalike_domain'],
            reportReplyByVerdict: { report: 'Thanks, reported.', verify: 'Good call ringing them back.' } } }),
        real('r1')
    ]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'verify');
    assert.match($(s, '.tri-it-reply').textContent, /Good call ringing them back\./);
});
test('item 7: with no entry for the verdict, the Report-only default is unchanged', () => {
    const s = open(awareSet([
        phish('p1', { truth: { isPhish: true, flags: ['lookalike_domain'],
            reportReplyByVerdict: { report: 'Thanks, reported.' } } }),
        real('r1')
    ]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'verify'); // no verify entry: no reply line (Report-only default)
    assert.equal($(s, '.tri-it-reply'), null, 'a Verify with no entry shows no reply');
});

// ── item 8: a per-item deleteLine words the genuine-delete feedback ─────────────
test('item 8: truth.deleteLine is used for a genuine item turned away / deleted', () => {
    const s = open(awareSet([
        real('r1', { truth: { isPhish: false, flags: [], deleteLine: 'That was a real colleague; nobody was left stuck.' } }),
        phish('p1')
    ]));
    click($(s, '.tri-start'));
    act(s, 'r1', 'delete');
    assert.match($(s, '.tri-card-verdict').textContent, /nobody was left stuck/);
});
test('item 8 (E12 C4): a call item\'s deleteLine beats the set-wide verdictFeedback.delete.real', () => {
    const call = { id: 'c1', kind: 'call', callerId: 'Visitor at the desk', time: '09:20',
        transcript: [{ who: 'Caller', text: 'Morning, I am here to see Yasmin.' }],
        truth: { isPhish: false, flags: [], whyFine: { default: 'On the list.' }, deleteLine: 'They were on today\'s list and were left in the lobby.' } };
    const s = open(awareSet([call, phish('p1')], { labels: { verdictFeedback: { delete: { real: 'Turning them away was not needed.' } } } }));
    click($(s, '.tri-start'));
    act(s, 'c1', 'refuse');
    const line = $(s, '.tri-card-verdict').textContent;
    assert.match(line, /left in the lobby/, 'the item line wins');
    assert.doesNotMatch(line, /was not needed/, 'the set line does not');
});

// ── item 17: the no-ticks confirm prompt reads as optional ─────────────────────
test('item 17: the default confirm prompt names the second Confirm as optional', () => {
    const s = open(awareSet([phish('p1'), real('r1')], { confirmPrompt: true }));
    click($(s, '.tri-start'));
    pick(s, 'p1');
    click($(s, '.tri-verdict[data-action="report"]'));
    click($(s, '.tri-confirm')); // nothing ticked: prompt
    const prompt = $(s, '.tri-sheet-prompt');
    assert.ok(prompt, 'the prompt shows');
    assert.match(prompt.textContent, /press Confirm again to lock your answer as it is/);
    assert.doesNotMatch(prompt.textContent, /to move on/);
});

// ── item 16: caughtHow relabels its verbs from the set's verdict names ──────────
test('item 16: a relabelled Delete reads in the breakdown as its own verb', () => {
    const result = { phishTotal: 3, phishCaught: 3, reportCount: 1, phishVerified: 0,
        answers: [
            { id: 'a', verdict: 'report', isPhish: true },
            { id: 'b', verdict: 'delete', isPhish: true },
            { id: 'c', verdict: 'delete', isPhish: true }
        ] };
    const labels = { verdict: { delete: { past: 'Went the trusted way' } } };
    const how = caughtHow(result, () => 'page', verdictVerbOverride(labels));
    assert.deepEqual(how, ['1 reported', '2 went the trusted way']);
});
test('item 16: without a relabel the default verbs are unchanged', () => {
    const result = { phishTotal: 2, phishCaught: 2, reportCount: 1, phishVerified: 0,
        answers: [{ id: 'a', verdict: 'report', isPhish: true }, { id: 'b', verdict: 'delete', isPhish: true }] };
    assert.deepEqual(caughtHow(result, () => 'email', verdictVerbOverride(null)), ['1 reported', '1 deleted']);
});

// ── item 3: the debrief weakest line is suppressed when no flag was named ────────
function host() { const h = document.createElement('div'); document.body.appendChild(h); return h; }
const dset = () => ({ id: 'd', messages: [{ id: 'm1', kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } }],
    skillNames: { senderTrust: 'Sender address' } });
test('item 3: no flag named → no weakest-skill line (matches the result\'s "nothing to grade")', () => {
    const h = host();
    const result = { percent: 0, phishTotal: 1, phishCaught: 0, reportCount: 0, phishVerified: 0,
        perFactor: { senderTrust: { caught: 0, missed: 1 } },
        answers: [{ id: 'm1', verdict: 'trust', flags: [], isPhish: true, score: 0 }] };
    renderDebrief(h, { result, set: dset(), strings: {}, variant: 'full', onFinish() {} });
    assert.equal(h.querySelector('.aw-weakest'), null, 'the weakest line is suppressed');
});
test('item 3: a named flag brings the weakest-skill line back', () => {
    const h = host();
    const result = { percent: 0, phishTotal: 1, phishCaught: 0, reportCount: 0, phishVerified: 0,
        perFactor: { senderTrust: { caught: 0, missed: 1 } }, flagRecall: { caught: 0, total: 1 },
        falseByFactor: { linkCredible: 1 },
        answers: [{ id: 'm1', verdict: 'trust', flags: ['linkCredible'], isPhish: true, score: 0 }] };
    renderDebrief(h, { result, set: dset(), strings: {}, variant: 'full', onFinish() {} });
    assert.ok(h.querySelector('.aw-weakest'), 'the weakest line returns once a flag was named');
});
