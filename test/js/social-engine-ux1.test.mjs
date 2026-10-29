// Engine UX fixes from the E8 persona playtest (F1 to F5, readability): the tick-sheet order and
// the always-visible "Nothing looks wrong", the verdict line overrides (truth.kindLine /
// truth.missLabel) and the right-call sentence, the scroll to the feedback after Confirm, the
// sticky verdict row, the result body, and the composer footer (meter beside Send).
// Run with: node --test test/js/social-engine-ux1.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-engine-ux1-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/episode-runner/debrief-view.js',
    'minigames/concern-form/concern-form-minigame.js', 'minigames/concern-form/concern-form-model.js',
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
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
window.gameState = { globalVariables: {} };

const load = (rel) => import(pathToFileURL(join(dir, rel)));
const { InboxTriageMinigame } = await load('minigames/inbox-triage/inbox-triage-minigame.js');
const F = await load('minigames/inbox-triage/triage-flags.js');
const S = await load('minigames/inbox-triage/triage-scoring.js');
const { renderDebrief } = await load('minigames/episode-runner/debrief-view.js');

// ── fixtures ──────────────────────────────────────────────────────────────────
const real = () => ({
    id: 'm_reset', from: { name: 'Quayholt IT', address: 'noreply@quayholt.example' }, to: 'you@quayholt.example',
    subject: 'Your password was changed', time: '11:52', body: 'Your password was changed.',
    truth: { isPhish: true, flags: ['unrequested_reset'], perFlagNote: { unrequested_reset: 'You did not ask for it' },
        kindLine: 'This one was a real notice, but you did not ask for it.', missLabel: 'acting on a reset notice you did not ask for',
        reportReply: 'Thanks.', ifTrusted: 'Nothing would have been done about it.' }
});
const phish = () => ({
    id: 'm_phish', from: { name: 'IT', address: 'it@fakeco.example' }, to: 'you@quayholt.example', subject: 'Reset now',
    time: '09:00', body: 'Reset your password today.',
    truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'odd domain' }, reportReply: 'Thanks.', ifTrusted: 'They would have it.' }
});
const makeSet = (messages, over = {}) => ({
    id: 'ux1', title: 'UX', stage: 'mission', scoringProfile: 'awareness', feedbackMode: 'immediate', verifyVerdict: true,
    headerPanel: 'off', glossary: 'closed', chipStyle: 'plain',
    channelTells: ['unexpected_sent_item', 'unrequested_reset', 'secrecy_or_bypass'],
    flagChips: { unexpected_sent_item: "Sent item you didn't send", unrequested_reset: "Reset you didn't ask for" },
    outcome: { setGlobalPrefix: 'ux1_', passPercent: 0 }, messages, ...over
});

let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, skin: 'awareness', ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (n) => n.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function answer(s, id, verdict) {
    pick(s, id);
    click($(s, `.tri-verdict[data-verdict="${verdict}"]`));
    click($(s, '.tri-confirm'));
}

// ── F4: tick-sheet order and the always-visible "Nothing looks wrong" ───────────

test('chipIdsFor relevantFirst: the set\'s own tells, then channel tells, then the generic factors; default order unchanged', () => {
    const set = makeSet([]);
    const old = F.chipIdsFor(set, 'email');
    assert.deepEqual(old.slice(0, 7), F.FACTOR_ORDER, 'default: factors first, as before');
    const next = F.chipIdsFor(set, 'email', null, { relevantFirst: true });
    assert.deepEqual(next.slice(0, 3), ['unexpected_sent_item', 'unrequested_reset', 'secrecy_or_bypass']);
    assert.deepEqual(next.slice(3), F.FACTOR_ORDER);
    assert.deepEqual([...next].sort(), [...old].sort(), 'the same ids, only reordered');
});

test('the sheet lists the set\'s own tells first under the awareness skin and keeps "Nothing looks wrong" outside the scrolling list', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    pick(s, 'm_reset');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    const ids = $$(s, '.tri-chips input').map((i) => i.dataset.chip);
    assert.deepEqual(ids.slice(0, 2), ['unexpected_sent_item', 'unrequested_reset']);
    assert.ok(ids.indexOf('senderTrust') > ids.indexOf('unrequested_reset'));
    assert.equal($(s, '.tri-chips .tri-chip-none'), null, 'not inside the scrolling list');
    assert.ok($(s, '.tri-sheet > .tri-chip-none'), 'directly in the sheet, above the Confirm bar');
    // ticking it still clears the others and is not scored as a flag
    const none = $(s, '.tri-chip-none input');
    $(s, 'input[data-chip="unrequested_reset"]').checked = true;
    none.checked = true;
    none.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal($(s, 'input[data-chip="unrequested_reset"]').checked, false);
    click($(s, '.tri-confirm'));
    assert.deepEqual(s.answers.get('m_reset').flags, []);
});

test('set.chipOrder "default" keeps the old order under the skin; without the skin nothing changes', () => {
    let s = open(makeSet([real()], { chipOrder: 'default' }));
    click($(s, '.tri-start'));
    pick(s, 'm_reset');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    assert.equal($$(s, '.tri-chips input')[0].dataset.chip, 'senderTrust');
    s = open(makeSet([real()]), { skin: undefined });
    click($(s, '.tri-start'));
    pick(s, 'm_reset');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    assert.equal($$(s, '.tri-chips input')[0].dataset.chip, 'senderTrust');
});

// ── F1: verdict line override, right call, miss label ──────────────────────────

test('truth.kindLine replaces "This one was a phish" and the card names the right call', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_reset', 'trust');
    const text = $(s, '.tri-card-verdict').textContent;
    assert.match(text, /Not this time\. This one was a real notice, but you did not ask for it\./);
    assert.doesNotMatch(text, /was a phish/);
    assert.match(text, /The right call was Report or Verify\./);
    answer(s, 'm_phish', 'trust');
    const t2 = $(s, '.tri-card-verdict').textContent;
    assert.match(t2, /This one was a phish\./, 'default wording stays for an ordinary phish');
    assert.match(t2, /The right call was Report or Verify\./);
});

test('a right answer carries no right-call sentence', () => {
    const s = open(makeSet([phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_phish', 'report');
    assert.doesNotMatch($(s, '.tri-card-verdict').textContent, /The right call was/);
});

test('truth.missLabel fills the critical-miss line and drops "let an attacker straight in" when every miss has one', () => {
    const s = open(makeSet([real()]));
    click($(s, '.tri-start'));
    answer(s, 'm_reset', 'trust');
    click($(s, '.tri-next'));
    const line = $(s, '.tri-critical')?.textContent || '';
    assert.match(line, /missed something that needed reporting \(acting on a reset notice you did not ask for\)/);
    assert.doesNotMatch(line, /attacker/);
    // a plain phish keeps the old wording
    const t = open(makeSet([phish()]));
    click($(t, '.tri-start'));
    answer(t, 'm_phish', 'trust');
    click($(t, '.tri-next'));
    assert.match($(t, '.tri-critical').textContent, /let an attacker straight in \(trusting a phish email\)/);
});

test('the critical-miss line names the item that cost the points (F-E15-1)', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_reset', 'trust'); // one critical miss (labelled)
    answer(s, 'm_phish', 'report'); // a right call on the other, so only m_reset is critical
    click($(s, '.tri-next'));
    const line = $(s, '.tri-critical').textContent;
    assert.match(line, /The item was 'Your password was changed'\./, 'names the critical-miss item');
});

test('truth.reportLine overrides the Report feedback line; without it the default stands (F-E16-1)', () => {
    const colleague = { ...phish(), id: 'm_colleague', subject: 'Can I use your login?',
        truth: { ...phish().truth, reportLine: 'Right to flag it. The service desk can reset his own login.' } };
    const s = open(makeSet([colleague, phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_colleague', 'report');
    const text = $(s, '.tri-card-verdict').textContent;
    assert.match(text, /Right to flag it\. The service desk can reset his own login\./);
    assert.doesNotMatch(text, /A report warns everyone else/);
    answer(s, 'm_phish', 'report');
    assert.match($(s, '.tri-card-verdict').textContent, /A report warns everyone else\./, 'default unchanged');
});

test('the list badge shows a cross on a wrong verdict, never a success tick (F-E19-7)', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_phish', 'trust'); // wrong: trusting a phish
    const badge = $(s, '.mail-row[data-id="m_phish"] .mail-row-badge');
    assert.ok(badge, 'the answered row has a badge');
    assert.ok(badge.classList.contains('mail-row-badge-wrong'));
    assert.match(badge.querySelector('img.mail-icon').getAttribute('src'), /mark-cross/);
    // a right call keeps the success tick
    answer(s, 'm_reset', 'report');
    const ok = $(s, '.mail-row[data-id="m_reset"] .mail-row-badge');
    assert.match(ok.querySelector('img.mail-icon').getAttribute('src'), /mark-tick/);
    assert.ok(!ok.classList.contains('mail-row-badge-wrong'));
});

test('scoreTriage exposes criticalLabels aligned with criticalKinds', () => {
    const r = S.scoreTriage({ messages: [real(), phish()], profile: 'awareness',
        answers: [{ id: 'm_reset', verdict: 'trust', flags: [] }, { id: 'm_phish', verdict: 'trust', flags: [] }] });
    assert.deepEqual(r.criticalKinds, ['email', 'email']);
    assert.deepEqual(r.criticalLabels, ['acting on a reset notice you did not ask for', null]);
    assert.equal(S.criticalWhat(r.criticalKinds, r.criticalLabels), 'acting on a reset notice you did not ask for, or trusting a phish email');
    assert.equal(S.criticalWhat(['email']), 'trusting a phish email');
});

test('the debrief card uses kindLine for a trusted genuine-but-report item', () => {
    const set = makeSet([real()]);
    const view = renderDebrief(document.body.appendChild(document.createElement('div')), {
        set, result: { percent: 40, answers: [{ id: 'm_reset', verdict: 'trust', flags: [], isPhish: true, score: 0 }] }, strings: {}, onContinue() {}
    });
    const text = document.body.textContent;
    assert.match(text, /This one was a real notice, but you did not ask for it\. Here is what to look for next time\./);
    assert.doesNotMatch(text, /built to look right\. Here is what/);
    view?.destroy?.();
});

// ── F3: sticky verdict row and the scroll to the feedback ───────────────────────

test('the verdict row is marked sticky until answered; Confirm scrolls the feedback into view, instant under reduced motion', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    pick(s, 'm_reset');
    assert.ok($(s, '.tri-actions.tri-actions-open .tri-verdicts'));
    const calls = [];
    const proto = window.HTMLElement.prototype;
    const old = proto.scrollIntoView;
    proto.scrollIntoView = function (opts) { calls.push({ cls: this.className, opts }); };
    try {
        window.matchMedia = () => ({ matches: false });
        click($(s, '.tri-verdict[data-verdict="report"]'));
        click($(s, '.tri-confirm'));
        assert.equal($(s, '.tri-actions-open'), null, 'no sticky row once locked in');
        assert.equal(calls.length, 1);
        assert.match(calls[0].cls, /tri-locked/);
        assert.deepEqual(calls[0].opts, { block: 'start', behavior: 'smooth' });
        window.matchMedia = (q) => ({ matches: /reduce/.test(q) });
        pick(s, 'm_phish');
        click($(s, '.tri-verdict[data-verdict="report"]'));
        click($(s, '.tri-confirm'));
        assert.equal(calls[1].opts.behavior, 'auto');
    } finally {
        proto.scrollIntoView = old;
        delete window.matchMedia;
    }
});

test('selecting another message opens its pane at the top', () => {
    const s = open(makeSet([real(), phish()]));
    click($(s, '.tri-start'));
    pick(s, 'm_reset');
    s.reader.readPane.scrollTop = 300;
    pick(s, 'm_phish');
    assert.equal(s.reader.readPane.scrollTop, 0);
});

// ── F5: the result panel body ──────────────────────────────────────────────────

test('the result text sits in .tri-result-body and the action bar is a sibling after it', () => {
    const s = open(makeSet([phish()]));
    click($(s, '.tri-start'));
    answer(s, 'm_phish', 'report');
    click($(s, '.tri-next'));
    const kids = [...$(s, '.tri-result').children].map((n) => n.className.split(' ')[0]);
    assert.deepEqual(kids, ['tri-result-body', 'tri-result-bar']);
    assert.ok($(s, '.tri-result-body .tri-score'));
    assert.ok($(s, '.tri-result-bar .tri-finish'));
});

// ── readability: CSS floors ────────────────────────────────────────────────────

test('verdict hints and the brief paragraph are light and at least 13px; the frame uses tall viewports', () => {
    const tri = readFileSync(join(root, 'public/break_escape/css/inbox-triage-minigame.css'), 'utf8');
    const hint = /\.tri-verdict-hint \{([^}]*)\}/.exec(tri)[1];
    assert.match(hint, /color: #ffffff/);
    assert.ok(Number(/font-size: (\d+)px/.exec(hint)[1]) >= 13);
    const kind = /\.tri-brief-kind \{([^}]*)\}/.exec(tri)[1];
    assert.ok(Number(/font-size: (\d+)px/.exec(kind)[1]) >= 13);
    assert.match(kind, /color: #e6ebf6/);
    const mail = readFileSync(join(root, 'public/break_escape/css/mail-client-minigame.css'), 'utf8');
    assert.match(mail, /height: min\(900px, calc\(100vh - 80px\)\)/);
    assert.match(mail, /\.mail-compose-foot \{[^}]*position: sticky/);
});

// ── concern form: guidance once ────────────────────────────────────────────────

test('the concern form shows its guidance under the feedback once, and not again', async () => {
    const { ConcernFormMinigame } = await load('minigames/concern-form/concern-form-minigame.js');
    const proto = ConcernFormMinigame.prototype;
    const fake = { config: { guidance: 'Tell the manager.' }, stageEl: document.createElement('div'), text() { return ''; } };
    fake.stageEl.className = 'stage';
    const first = proto._feedback.call(fake, 'good');
    assert.ok(first.querySelector('.cf-guidance'));
    const second = proto._feedback.call(fake, 'good');
    assert.equal(second.querySelector('.cf-guidance'), null);
    // on screen already (the intro): not repeated
    const fresh = { config: { guidance: 'Tell the manager.' }, stageEl: document.createElement('div') };
    fresh.stageEl.innerHTML = '<p class="cf-guidance">Tell the manager.</p>';
    assert.equal(proto._feedback.call(fresh, 'good').querySelector('.cf-guidance'), null);
});
