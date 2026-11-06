// Engine batch 11 (awareness build): inbox-triage count levers and the opt-in confirm prompt,
// "Next" going to the first unsorted item, per-verdict save/restore, and the debrief recaps for
// the sandbox and assistant stages.
// Run with: node --test test/js/social-engine-batch11.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'social-engine-batch11-'));
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
const { sandboxRecap, cleanAnswerList } = await mod('minigames/episode-runner/episode-model.js');

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
const nums = (s) => Object.fromEntries($$(s, '.tri-numbers dd').map((d) => [d.dataset.number, d.textContent]));
function act(s, id, action, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); if (!i) throw new Error(`no chip ${c}`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
const toResult = (s) => { const n = $(s, '.tri-next'); if (n) click(n); };

const phish = (id, over = {}) => ({ id, from: { name: 'IT Desk', address: 'it@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Sign in now', time: '09:10', body: 'Sign in.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain'] }, ...over });
const real = (id, over = {}) => ({ id, from: { name: 'Marsh End', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order', time: '09:00', body: 'Thanks.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'A real supplier.' } }, ...over });
const awareSet = (messages, over = {}) => ({
    id: 'b11', title: 'B11', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', outcome: { setGlobalPrefix: 'b11_', passPercent: 0 }, messages, ...over
});

// ── item 6: Next goes to the first unsorted item, not forward-and-wrap ───────────
test('item 6: answering out of order still lands Next on the earlier unsorted item', () => {
    const s = open(awareSet([real('a'), phish('b_call'), real('c'), real('d')]));
    click($(s, '.tri-start'));
    // answer 'a', then jump to 'c' (skipping 'b_call'); Next must return to the stranded 'b_call'.
    act(s, 'a', 'trust');
    act(s, 'c', 'trust');
    click($(s, '.tri-next'));
    assert.equal($(s, '.mail-row.selected')?.dataset.id, 'b_call', 'Next returns to the earliest unsorted item');
});

// ── items 7 / 9: the confirm prompt and the retrospective nudge ─────────────────
test('item 7: set.confirmPrompt holds the first no-ticks Confirm, a second one locks', () => {
    const s = open(awareSet([phish('p1'), real('r1')], { confirmPrompt: true }));
    click($(s, '.tri-start'));
    pick(s, 'p1');
    click($(s, '.tri-verdict[data-action="report"]'));
    click($(s, '.tri-confirm')); // nothing ticked: prompt, not lock
    assert.ok($(s, '.tri-sheet-prompt'), 'the gentle prompt shows');
    assert.ok($(s, '.tri-sheet'), 'the sheet is still open (not locked)');
    click($(s, '.tri-confirm')); // confirm again: locks
    assert.ok(!$(s, '.tri-sheet'), 'the second Confirm locks the verdict');
});

test('item 7: confirmPrompt false locks on the first Confirm (batch 13: the default is now on)', () => {
    const s = open(awareSet([phish('p1'), real('r1')], { confirmPrompt: false }));
    click($(s, '.tri-start'));
    pick(s, 'p1');
    click($(s, '.tri-verdict[data-action="report"]'));
    click($(s, '.tri-confirm'));
    assert.ok(!$(s, '.tri-sheet'), 'locked on the first Confirm');
});

test('item 9: the post-lock nudge never asks to Confirm again', () => {
    const s = open(awareSet([phish('p1', { truth: { isPhish: true, flags: ['lookalike_domain'] } }), real('r1')]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'report'); // right verdict, nothing ticked
    const nudge = $(s, '.tri-card-nudge');
    assert.ok(nudge, 'a phish with a tell nudges when nothing is ticked');
    assert.doesNotMatch(nudge.textContent, /Confirm again/);
});

// ── item 1: the count-line levers, defaults byte-identical ───────────────────────
test('item 1: default result grid is unchanged (no breakdown, default handled-right label)', () => {
    const s = open(awareSet([phish('p1'), real('r1')]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'delete'); // caught, not reported
    act(s, 'r1', 'trust');
    toResult(s);
    assert.equal(nums(s).phishCaught, '1 of 1', 'no breakdown by default');
    assert.ok($$(s, '.tri-numbers dt').some((d) => /Real mail handled right/.test(d.textContent)), 'default handled-right label');
});

test('item 1: caughtBreakdown names a deleted catch; handledRightLabel overrides the line', () => {
    const s = open(awareSet([phish('p1'), real('r1')], { resultCopy: { caughtBreakdown: true, handledRightLabel: 'Genuine ones you kept' } }));
    click($(s, '.tri-start'));
    act(s, 'p1', 'delete');
    act(s, 'r1', 'trust');
    toResult(s);
    assert.match(nums(s).phishCaught, /1 of 1 \(1 deleted\)/);
    assert.ok($$(s, '.tri-numbers dt').some((d) => d.textContent === 'Genuine ones you kept'));
});

// ── item 8: per-verdict save and restore ─────────────────────────────────────────
test('item 8: onProgress fires on each lock; restoreAnswers resumes mid-round', () => {
    const saved = [];
    const set = awareSet([phish('p1'), real('r1'), real('r2')]);
    const s = open(set, { onProgress: (a) => saved.push(a.map((x) => x.id)) });
    click($(s, '.tri-start'));
    act(s, 'p1', 'report');
    assert.deepEqual(saved.at(-1), ['p1'], 'the first verdict was handed back');
    act(s, 'r1', 'trust');
    assert.deepEqual(saved.at(-1), ['p1', 'r1']);
    // Reopen with the saved answers: it resumes at the sort step on the first unsorted item.
    const resume = open(set, { restoreAnswers: [{ id: 'p1', verdict: 'report', flags: [] }, { id: 'r1', verdict: 'trust', flags: [] }] });
    assert.ok(!$(resume, '.tri-brief') || $(resume, '.tri-brief').hidden, 'brief is skipped on resume');
    assert.equal(resume.answers.size, 2, 'the two saved verdicts are restored');
    assert.equal($(resume, '.mail-row.selected')?.dataset.id, 'r2', 'resumes on the first unsorted item');
});

test('item 8: no restoreAnswers means the round starts fresh at the brief', () => {
    const s = open(awareSet([phish('p1'), real('r1')]));
    assert.ok(!$(s, '.tri-brief').hidden, 'brief shows when nothing to restore');
    assert.equal(s.answers.size, 0);
});

// ── item 11 + ext(b): the debrief recaps ─────────────────────────────────────────
function debrief(extra = {}) {
    document.body.innerHTML = '';
    const c = document.createElement('div');
    document.body.appendChild(c);
    const view = renderDebrief(c, { result: { percent: 80, answers: [] }, set: { scoringProfile: 'awareness' },
        strings: {}, variant: 'full', onFinish() {}, ...extra });
    return { c, view };
}
test('item 11: sandboxRecap and assistantRecap render their sections; absent renders nothing', () => {
    const { c } = debrief({
        sandboxRecap: [{ situation: 'The overtime sheet', chosen: 'Send it as it is', right: 'Check first', reason: 'It sat in a stranger’s inbox.' }],
        assistantRecap: [{ situation: 'Pasting into the assistant', reason: 'A password slipped through.' }]
    });
    assert.ok(c.querySelector('.aw-sandbox-recap'), 'sandbox recap section');
    assert.match(c.querySelector('.aw-sandbox-recap-move').textContent, /Send it as it is.*Check first/);
    assert.ok(c.querySelector('.aw-assistant-recap'), 'assistant recap section');
    assert.ok(!c.querySelector('.aw-assistant-recap-move'), 'no move line without chosen/right');
});
test('item 11: no recap sections when the lists are empty (defend-only unaffected)', () => {
    const { c } = debrief();
    assert.equal(c.querySelector('.aw-sandbox-recap'), null);
    assert.equal(c.querySelector('.aw-assistant-recap'), null);
});

// ── model helpers ────────────────────────────────────────────────────────────────
test('sandboxRecap: only the beats whose chosen option is not safe, with the montage reason', () => {
    const episode = {
        mistake: { beats: [
            { id: 'b1', situation: 'A call for Carol', options: [{ id: 'safe', label: 'Take a message', safe: true }, { id: 'bad', label: 'Tell them where she is' }] },
            { id: 'b2', situation: 'The export', options: [{ id: 'safe', label: 'Check first', safe: true }, { id: 'bad', label: 'Send it now' }] }
        ] },
        strings: { flipMontageByChoice: { b1: { bad: 'A stranger was waiting for her.' } } }
    };
    const recap = sandboxRecap(episode, { b1: 'bad', b2: 'safe' });
    assert.equal(recap.length, 1, 'only the wrong, non-safe choice');
    assert.deepEqual(recap[0], { situation: 'A call for Carol', chosen: 'Tell them where she is', right: 'Take a message', reason: 'A stranger was waiting for her.' });
});

test('cleanAnswerList: keeps valid answers, drops junk, returns null when empty', () => {
    assert.equal(cleanAnswerList(null), null);
    assert.equal(cleanAnswerList([{ no: 'id' }, { id: 'x' }]), null, 'no verdict is dropped');
    const out = cleanAnswerList([{ id: 'a', verdict: 'report', flags: ['x', 2], ms: 5, action: 'report', unflagged: true, none: false, junk: 1 }]);
    assert.deepEqual(out, [{ id: 'a', verdict: 'report', flags: ['x'], ms: 5, action: 'report', unflagged: true }]);
});
