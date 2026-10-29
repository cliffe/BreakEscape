// Authored-choice triage kind `choice` (ENG-09a): a short situation with two to four authored
// options, each scored as the built verdict it names, through the shared scorer. The real
// overlay, reader and scorer in a jsdom document, with inline fixtures only.
// Run with: bundle exec node --test test/js/social-triage-choice.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-choice-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/episode-runner/debrief-view.js',
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
const S = await load('minigames/inbox-triage/triage-scoring.js');
const K = await load('minigames/inbox-triage/triage-kinds.js');
const { renderDebrief } = await load('minigames/episode-runner/debrief-view.js');

// ── fixtures ──────────────────────────────────────────────────────────────────
const words = () => ({
    id: 'c_words', kind: 'choice', subject: 'Which is stronger?',
    choice: {
        prompt: 'Which is stronger?',
        options: [
            { id: 'words', label: 'otter-ladder-crimson (three random words)', verdict: 'report' },
            { id: 'complex', label: 'Fakeco2026! (company name, year, symbol)', verdict: 'trust' }
        ],
        note: 'These are made up; no real password is typed.'
    },
    truth: { isPhish: true, flags: [], correct: 'report',
        reportReply: 'Length and unpredictability beat complexity rules.',
        ifTrusted: 'A company name plus a year is near the top of every guess list.' }
});
const ladder = () => ({
    id: 'c_ladder', kind: 'choice', subject: 'Pick the strongest sign-in',
    choice: { prompt: 'Pick the strongest sign-in this service offers.', options: [
        { id: 'passkey', label: 'A passkey', verdict: 'report' },
        { id: 'app', label: 'The authenticator app', verdict: 'trust' },
        { id: 'sms', label: 'A text code', verdict: 'delete' }
    ] },
    truth: { isPhish: true, flags: [], correct: 'report', ifTrusted: 'A text code can be relayed.' }
});
const realOne = () => ({
    id: 'c_real', kind: 'choice', subject: 'Use the manager',
    choice: { prompt: 'The manager offers a generated password.', options: [
        { id: 'use', label: 'Use it', verdict: 'trust' },
        { id: 'own', label: 'Type your usual one', verdict: 'delete' }
    ] },
    truth: { isPhish: false, flags: [], correct: 'trust', whyFine: { default: 'A generated password is unique to the site.' } }
});
const email = () => ({
    id: 'm_phish', from: { name: 'IT', address: 'it@fakeco.example' }, to: 'you@fakeco.example', subject: 'Reset now',
    time: '09:00', body: 'Reset your password today.',
    truth: { isPhish: true, flags: ['senderTrust', 'urgencyCalibrated'], perFlagNote: { senderTrust: 'odd domain', urgencyCalibrated: 'today' },
        reportReply: 'Thanks.', ifTrusted: 'They would have your password.' }
});
const makeSet = (messages, over = {}) => ({
    id: 'choice_set', title: 'Choices', stage: 'mission', scoringProfile: 'awareness', feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', chipStyle: 'plain', verifyVerdict: true,
    outcome: { setGlobalPrefix: 'choice_', passPercent: 0 }, messages, ...over
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
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function choose(s, id, optionId) {
    pick(s, id);
    click($(s, `.tri-choice-option[data-action="${optionId}"]`));
}
const per = (s, id) => s._score().perMessage.find((p) => p.id === id);

test('the card renders the prompt, the note and one button per option', () => {
    const s = open(makeSet([words(), ladder()]));
    click($(s, '.tri-start'));
    pick(s, 'c_ladder');
    assert.equal($(s, '[data-kind-surface]').dataset.kindSurface, 'choice');
    assert.match($(s, '.tri-kind-choice').textContent, /Pick the strongest sign-in this service offers/);
    assert.deepEqual($$(s, '.tri-choice-option').map((b) => b.dataset.action), ['passkey', 'app', 'sms']);
    assert.deepEqual($$(s, '.tri-choice-option').map((b) => b.textContent), ['A passkey', 'The authenticator app', 'A text code']);
    pick(s, 'c_words');
    assert.match($(s, '.tri-choice-note').textContent, /no real password is typed/);
});

test('no text input, no Verify button and no verdict row on a choice card', () => {
    const s = open(makeSet([words()]));
    click($(s, '.tri-start'));
    pick(s, 'c_words');
    assert.equal($$(s, 'input, textarea').length, 0);
    assert.equal($$(s, '.tri-verdict').length, 0);
    assert.equal($(s, '.tri-verdict[data-verdict="verify"]'), null);
    assert.deepEqual(s.getTestState().triage.actionButtons, ['words', 'complex']);
});

test('the option buttons do not give the right one away', () => {
    const s = open(makeSet([words()]));
    click($(s, '.tri-start'));
    pick(s, 'c_words');
    for (const b of $$(s, '.tri-choice-option')) {
        assert.doesNotMatch(b.className, /verdict-/);
        assert.equal(b.querySelector('img'), null);
    }
});

test('the right option scores full verdict marks through the shared scorer and records handledRight', () => {
    const s = open(makeSet([words()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'words');
    const r = per(s, 'c_words');
    assert.equal(r.verdict, 'report');
    assert.equal(r.verdictPoints, S.FULL_VERDICT_POINTS);
    assert.equal(r.verdictPoints, S.verdictPoints('awareness', true, 'report', 'choice'));
    assert.equal(r.handledRight, true);
    assert.equal(r.flagPoints, 0);
    assert.equal(r.score, 100);
    assert.equal(r.answered, true);
    assert.equal(r.isPhish, true);
    assert.deepEqual([r.caught, r.missed, r.falseClaims, r.units], [[], [], [], []]);
    assert.equal(r.critical, false);
});

test('a wrong option scores fewer points and records handledRight false', () => {
    const s = open(makeSet([words()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'complex');
    const r = per(s, 'c_words');
    assert.equal(r.verdict, 'trust');
    assert.equal(r.verdictPoints, S.verdictPoints('awareness', true, 'trust', 'choice'));
    assert.ok(r.verdictPoints < S.FULL_VERDICT_POINTS);
    assert.equal(r.handledRight, false);
    assert.equal(r.flagPoints, 0);
    assert.equal(r.score, 0);
    assert.equal(r.critical, false, 'a wrong password pick is not a critical miss');
});

test('a middling option (delete on a phish-vehicle card) scores the delete row', () => {
    const s = open(makeSet([ladder()]));
    click($(s, '.tri-start'));
    choose(s, 'c_ladder', 'sms');
    const r = per(s, 'c_ladder');
    assert.equal(r.verdict, 'delete');
    assert.equal(r.verdictPoints, S.verdictPoints('awareness', true, 'delete', 'choice'));
    assert.equal(r.handledRight, false);
});

test('a real-item card scores its trust option as full marks', () => {
    const s = open(makeSet([realOne()]));
    click($(s, '.tri-start'));
    choose(s, 'c_real', 'use');
    const r = per(s, 'c_real');
    assert.equal(r.verdictPoints, S.FULL_VERDICT_POINTS);
    assert.equal(r.handledRight, true);
    assert.equal(r.score, 100);
});

test('picking records no flags, opens no "What made you say that?" sheet and locks the answer', () => {
    const s = open(makeSet([words(), ladder()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'words');
    const t = s.getTestState().triage;
    assert.equal(t.sheet.open, false);
    assert.equal(s.answers.get('c_words').flags.length, 0);
    assert.equal(s.answers.get('c_words').action, 'words');
    assert.match($(s, '.tri-locked').textContent, /three random words/);
    assert.equal($$(s, '.tri-choice-option').length, 0, 'the options are gone once locked');
    assert.equal(t.messages.find((m) => m.id === 'c_words').kind, 'choice');
});

test('immediate feedback: the right pick shows why, a wrong one the better option and what could go wrong', () => {
    const s = open(makeSet([words(), ladder()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'words');
    assert.match($(s, '.tri-card-verdict').textContent, /Right choice/);
    assert.match($(s, '.tri-choice-why').textContent, /Length and unpredictability/);
    assert.equal($(s, '.tri-flags'), null, 'no tells list on a choice card');
    assert.equal($(s, '.aw-report-thanks'), null, 'no report thank-you under a password choice');
    choose(s, 'c_ladder', 'app');
    assert.match($(s, '.tri-card-verdict').textContent, /The authenticator app\. Not the best choice here/);
    assert.match($(s, '.tri-choice-better').textContent, /The better choice: A passkey/);
    assert.match($(s, '.tri-if-trusted').textContent, /What could go wrong: A text code can be relayed/);
    assert.match($(s, '.tri-card-score').textContent, /0 of 100/);
});

test('the team tally and the report counts leave choice cards out', () => {
    const s = open(makeSet([words(), email()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'words');
    assert.equal(s.teamProtectedCount(), 0);
    assert.match($(s, '.aw-team-tally').textContent, /: 0/);
    pick(s, 'm_phish');
    click($(s, '.tri-verdict[data-verdict="delete"]'));
    click($(s, '.tri-confirm'));
    const result = s._buildResult();
    assert.equal(result.phishTotal, 1, 'only the email counts as a phish to catch');
    assert.equal(result.reportCount, 0);
    assert.equal(result.reportRate, 0);
    assert.equal(s.teamProtectedCount(), 0);
    assert.equal(result.total, 2);
    // still in the answers (the measurement store reads them) and in the percent
    assert.equal(result.answers.find((a) => a.id === 'c_words').score, 100);
});

test('wording is data: labels.choice replaces each default line', () => {
    const labels = { choice: { group: 'Choisir', answered: 'Fait', right: 'Oui.', wrong: 'Non.', better: 'Mieux', whyRight: 'Pourquoi', ifWrong: 'Risque', brief: 'Choisissez.' } };
    const s = open(makeSet([words()], { labels }));
    assert.match($(s, '.tri-brief').textContent, /Choisissez\./);
    click($(s, '.tri-start'));
    pick(s, 'c_words');
    assert.equal($(s, '.tri-choice-options').getAttribute('aria-label'), 'Choisir');
    click($(s, '.tri-choice-option[data-action="complex"]'));
    assert.match($(s, '.tri-card-verdict').textContent, /Non\./);
    assert.match($(s, '.tri-choice-better').textContent, /^Mieux:/);
    assert.match($(s, '.tri-if-trusted').textContent, /^Risque:/);
    assert.equal($(s, '.mail-row-badge').textContent.includes('Fait'), true);
    // and the defaults when no labels are given
    assert.equal(K.choiceText('right', null), 'Right choice.');
    assert.equal(K.choiceText('group', { choice: { group: '' } }), 'Pick one');
});

test('a choice-only queue is worded as decisions and drops the email verdict legend', () => {
    const s = open(makeSet([words(), ladder()]));
    assert.match($(s, '.tri-brief').textContent, /Decisions: 2 decisions/);
    assert.equal($(s, '.tri-brief-buttons'), null);
    assert.match($(s, '.tri-brief-choice').textContent, /pick the option you think is best/);
    const over = open(makeSet([words()], { labels: { queue: { choice: { label: 'Password checks', item: ['check', 'checks'] } } } }));
    assert.match($(over, '.tri-brief').textContent, /Password checks: 1 check/);
});

test('Esc closes one layer: the close check, then the round', () => {
    const s = open(makeSet([words(), ladder()]));
    click($(s, '.tri-start'));
    choose(s, 'c_words', 'words');
    esc();
    assert.ok($(s, '.tri-close-ask'), 'the first Esc asks');
    assert.equal(s.getTestState().overlay.layers.length, 1);
    esc();
    assert.equal($(s, '.tri-close-ask'), null, 'the second Esc closes only that layer');
    assert.equal(s.gameState.isActive, true);
});

test('the debrief card names the option, not an email verdict, and shows why or the better option', () => {
    const msgs = [words(), ladder()];
    const set = makeSet(msgs);
    const result = { percent: 50, answers: [
        { id: 'c_words', verdict: 'report', action: 'words', flags: [], score: 100, isPhish: true },
        { id: 'c_ladder', verdict: 'trust', action: 'app', flags: [], score: 0, isPhish: true }
    ] };
    const box = document.createElement('div');
    document.body.appendChild(box);
    renderDebrief(box, { result, set, strings: {}, variant: 'full', onFinish() {} });
    const cards = [...box.querySelectorAll('.aw-card')];
    assert.equal(cards.length, 1, 'the right pick needs no review card');
    assert.match(cards[0].querySelector('.aw-card-verdict').textContent, /You chose The authenticator app\. Not the best choice here/);
    assert.match(cards[0].querySelector('.aw-choice-better').textContent, /The better choice: A passkey/);
    assert.match(cards[0].querySelector('.aw-if-trusted').textContent, /What could go wrong: A text code can be relayed/);
});

// ── opt-in: without a choice message nothing changes ──────────────────────────────
test('a set with no choice message scores and reads as before', () => {
    const only = scoreOnly(email());
    const mixed = S.scoreTriage({ messages: [normal(email()), normal(words())],
        answers: [{ id: 'm_phish', verdict: 'report', flags: ['senderTrust'] }, { id: 'c_words', verdict: 'report', flags: [] }], profile: 'awareness' });
    // the email's own record is the same with or without a choice card beside it
    assert.deepEqual(mixed.perMessage[0], only.perMessage[0]);
    // golden: one flag of two caught = 20 flag points, report = 60
    assert.deepEqual(only.perMessage[0], { id: 'm_phish', isPhish: true, verdict: 'report', verdictPoints: 60, flagPoints: 20, score: 80,
        caught: ['senderTrust'], missed: ['urgencyCalibrated'], falseClaims: [],
        answered: true, units: [{ note: 'senderTrust', caught: true, shown: 'senderTrust' }, { note: 'urgencyCalibrated', caught: false, shown: 'urgencyCalibrated' }],
        handledRight: true, critical: false });
    assert.equal(only.phishTotal, 1);
    assert.equal(only.reportCount, 1);
});

test('a set with no choice message shows the usual verdict row and sheet', () => {
    const s = open(makeSet([email()]));
    click($(s, '.tri-start'));
    pick(s, 'm_phish');
    assert.deepEqual($$(s, '.tri-verdict').map((b) => b.dataset.verdict), ['trust', 'report', 'delete', 'verify']);
    assert.equal($$(s, '.tri-choice-option').length, 0);
    click($(s, '.tri-verdict[data-verdict="report"]'));
    assert.ok($(s, '.tri-confirm'), 'the usual flag sheet opens');
});

test('no choice wording leaks into a plain set\'s brief', () => {
    const s = open(makeSet([email()]));
    assert.equal($(s, '.tri-brief-choice'), null);
    assert.match($(s, '.tri-brief').textContent, /Inbox check: 1 message/);
});

function normal(m) { return { ...m, kind: m.kind || 'email' }; }
function scoreOnly(m) {
    return S.scoreTriage({ messages: [normal(m)], answers: [{ id: m.id, verdict: 'report', flags: ['senderTrust'] }], profile: 'awareness' });
}
