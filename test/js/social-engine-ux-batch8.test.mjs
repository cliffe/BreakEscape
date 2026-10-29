// Engine batch 8 (awareness): the last of the fixed phishing wording made overridable.
//   - the reopened result card's report line shares the debrief's reportedPct override
//     (set.resultCopy.reportedPct, {pct}); default unchanged.
//   - the result card's critical-miss lead "let an attacker straight in" is overridable
//     (set.resultCopy.criticalLead); default unchanged.
//   - the report reply has a set-wide default (set.reportReply) under the per-item truth.reportReply;
//     default unchanged.
//   - the debrief's reportedPct reads the set's resultCopy.reportedPct (shared with the card), then
//     strings.reportedPct, then the default.
//   - the debrief's weakest-skill line "The tell(s) most often missed" is overridable
//     (strings.weakestTell / weakestTells, {names} {counts}); default unchanged.
// Real inbox-triage-minigame and debrief-view in a jsdom document. Fixtures only.
// Run with: node --test test/js/social-engine-ux-batch8.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-batch8-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js', 'minigames/episode-runner/debrief-view.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js'
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
const ended = [];
window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');

// ── a small awareness set: one phish email, one real email ──────────────────────
const msgs = () => [
    { id: 'm_p', from: { name: 'Payroll', address: 'payroll@ledgerwell-hr.example' }, to: 'you@ledgerwell.example',
      subject: 'Verify your bank details today', time: '09:12', body: 'Confirm your bank details today.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
      truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'ledgerwell-hr is not ledgerwell' },
        ifTrusted: 'They would have your bank details.' } },
    { id: 'm_r', from: { name: 'IT Helpdesk', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example',
      subject: 'Your new laptop', time: '08:05', body: 'Your laptop is ready.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
      truth: { isPhish: false, flags: [], whyFine: { default: 'Address matches IT and all checks pass.' } } }
];
const makeSet = (over = {}) => ({
    id: 'b8', title: 'Demo', stage: 'mission', scoringProfile: 'awareness', feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', chipStyle: 'plain', outcome: { setGlobalPrefix: 'b8_', passPercent: 60 },
    messages: msgs(), ...over
});

let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    ended.length = 0;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
function pick(s, id) { click($(s, `.mail-row[data-id="${id}"]`)); }
function verdict(s, id, v, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}

// ── the reopened result card (set.resultCopy.reportedPct shared with the debrief) ──

test('reopened card: default shows "Reported rather than just deleted" / "N% of the phish"', () => {
    const s = open(makeSet(), { storedResult: { percent: 72, reportRate: 0.5 } });
    assert.ok($(s, '.tri-numbers'), 'the label/value pair is drawn by default');
    const text = $(s, '.tri-result').textContent;
    assert.match(text, /Reported rather than just deleted/);
    assert.match(text, /50% of the phish/);
    assert.equal($(s, '.tri-reported'), null, 'no override sentence by default');
});

test('reopened card: resultCopy.reportedPct replaces the pair with one sentence, {pct} filled', () => {
    const set = makeSet({ resultCopy: { reportedPct: 'Escalated {pct}% of the risky requests.' } });
    const s = open(set, { storedResult: { percent: 72, reportRate: 0.5 } });
    assert.ok($(s, '.tri-reported'), 'the override sentence is drawn');
    assert.equal($(s, '.tri-reported').textContent, 'Escalated 50% of the risky requests.');
    assert.equal($(s, '.tri-numbers'), null, 'the default label/value pair is gone');
    assert.doesNotMatch($(s, '.tri-result').textContent, /of the phish/);
});

// ── the critical-miss lead (set.resultCopy.criticalLead) ────────────────────────

test('critical lead: default "let an attacker straight in"', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm_p', 'trust');          // trusting a phish email is a critical miss
    verdict(s, 'm_r', 'trust');
    click($(s, '.tri-next'));            // "See result"
    const crit = $(s, '.tri-critical');
    assert.ok(crit, 'the critical line is shown');
    assert.match(crit.textContent, /let an attacker straight in/);
});

test('critical lead: resultCopy.criticalLead overrides it, default unchanged elsewhere', () => {
    const s = open(makeSet({ resultCopy: { criticalLead: 'broke the clean-desk rule' } }));
    click($(s, '.tri-start'));
    verdict(s, 'm_p', 'trust');
    verdict(s, 'm_r', 'trust');
    click($(s, '.tri-next'));
    const crit = $(s, '.tri-critical');
    assert.match(crit.textContent, /broke the clean-desk rule/);
    assert.doesNotMatch(crit.textContent, /let an attacker straight in/);
});

// ── the report reply default (set.reportReply) ──────────────────────────────────

test('report reply: default phish wording when no set/item override', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm_p', 'report', ['senderTrust']);
    assert.match($(s, '.tri-review-card').textContent, /Confirmed as a phish/);
});

test('report reply: set.reportReply gives a set-wide default under truth.reportReply', () => {
    const s = open(makeSet({ reportReply: 'Thanks. Logged and passed to the team.' }));
    click($(s, '.tri-start'));
    verdict(s, 'm_p', 'report', ['senderTrust']);
    const text = $(s, '.tri-review-card').textContent;
    assert.match(text, /Logged and passed to the team/);
    assert.doesNotMatch(text, /Confirmed as a phish/);
});

// ── the debrief: reportedPct source order and the weakest-skill line ────────────

function debriefText(opts) {
    const host = document.createElement('div');
    renderDebrief(host, opts);
    return host.textContent;
}

test('debrief reportedPct: set.resultCopy wins, then strings, then the default', () => {
    const base = { messages: [{ id: 'e1', kind: 'email', truth: { isPhish: false, whyFine: { default: 'fine' } } }] };
    const result = { percent: 80, reportRate: 0.5, answers: [{ id: 'e1', verdict: 'trust', flags: [], isPhish: false, score: 100 }] };
    // default
    assert.match(debriefText({ result, set: base, strings: {}, variant: 'full', onFinish() {} }), /Reported 50% of the phish/);
    // strings override
    assert.match(debriefText({ result, set: base, strings: { reportedPct: 'Checked {pct}% by another route' }, variant: 'full', onFinish() {} }),
        /Checked 50% by another route/);
    // set.resultCopy wins over strings and the default, and is the one the reopened card also reads
    const setRc = { ...base, resultCopy: { reportedPct: 'Escalated {pct}% of requests' } };
    const text = debriefText({ result, set: setRc, strings: { reportedPct: 'Checked {pct}% by another route' }, variant: 'full', onFinish() {} });
    assert.match(text, /Escalated 50% of requests/);
    assert.doesNotMatch(text, /by another route/);
    assert.doesNotMatch(text, /of the phish/);
});

test('debrief weakest line: default "tell(s) most often missed", overridable per set', () => {
    const set = { messages: [{ id: 'e1', kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } }] };
    const result = { percent: 0, phishTotal: 1, phishCaught: 0, reportCount: 0, phishVerified: 0,
        perFactor: { senderTrust: { caught: 0, missed: 1 } },
        answers: [{ id: 'e1', verdict: 'trust', flags: [], isPhish: true, score: 0 }] };
    // default (one skill → singular)
    assert.match(debriefText({ result, set, strings: {}, variant: 'full', onFinish() {} }), /The tell most often missed:/);
    // override
    const text = debriefText({ result, set, strings: { weakestTell: 'The habit to build: {names} ({counts})' }, variant: 'full', onFinish() {} });
    assert.match(text, /The habit to build: .+ \(caught 0 of 1\)/);
    assert.doesNotMatch(text, /tell most often missed/);
});

test('debrief weakest line (tie): the plural weakestTells frame is used', () => {
    const set = { messages: [
        { id: 'e1', kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } },
        { id: 'e2', kind: 'email', truth: { isPhish: true, flags: ['linkCredible'] } }
    ] };
    const result = { percent: 0, phishTotal: 2, phishCaught: 0, reportCount: 0, phishVerified: 0,
        perFactor: { senderTrust: { caught: 0, missed: 1 }, linkCredible: { caught: 0, missed: 1 } },
        answers: [
            { id: 'e1', verdict: 'trust', flags: [], isPhish: true, score: 0 },
            { id: 'e2', verdict: 'trust', flags: [], isPhish: true, score: 0 }
        ] };
    assert.match(debriefText({ result, set, strings: {}, variant: 'full', onFinish() {} }), /The tells most often missed:.*each\)/);
    const text = debriefText({ result, set, strings: { weakestTells: 'Both to watch: {names} ({counts} apiece)' }, variant: 'full', onFinish() {} });
    assert.match(text, /Both to watch: .+ and .+ \(caught 0 of 1 apiece\)/);
    assert.doesNotMatch(text, /tells most often missed/);
});
