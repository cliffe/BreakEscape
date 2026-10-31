// Inbox triage, Phase 7: 05 N11, the pre/post comparison panel and its no-baseline gate.
// Runs the real triage-comparison module and the real overlay (with the real MailReader and
// scorer) in a jsdom document.
// Run with: bundle exec node --test test/js/social-triage-comparison.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-triage-comparison-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
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

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { comparisonFor, comparisonText, prePrefixFor } = await mod('minigames/inbox-triage/triage-comparison.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');

const phish = { id: 'p1', from: { name: 'Payroll', address: 'pay@ledgerwell-hr.example' }, to: 'you@ledgerwell.example',
    subject: 'Bank details', time: '09:00', body: 'Confirm today.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'Look-alike domain' } } };
const real = { id: 'r1', from: { name: 'IT', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example',
    subject: 'Laptop', time: '08:00', body: 'Ready.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'Matches IT.' } } };
const checkSet = (over = {}) => ({
    id: 'check_a', stage: 'pre', scoringProfile: 'awareness', feedbackMode: 'end',
    outcome: { setGlobalPrefix: 'triage_{stage}_', passPercent: 0 }, messages: [phish, real], ...over
});
const preDone = { triage_pre_done: true, triage_pre_percent: 52, triage_pre_reportRate: 0.4 };

// ── pure ─────────────────────────────────────────────────────────────────────

test('the pre prefix: an explicit prePrefix, else the {stage} prefix at pre, else none', () => {
    assert.equal(prePrefixFor(checkSet()), 'triage_pre_');
    assert.equal(prePrefixFor(checkSet({ comparison: { prePrefix: 'aw_pre_' } })), 'aw_pre_');
    assert.equal(prePrefixFor(checkSet({ outcome: { setGlobalPrefix: 'triage_', passPercent: 0 } })), null);
});

test('only a post round compares; comparison:false or an unknowable pre prefix shows nothing', () => {
    assert.equal(comparisonFor(checkSet(), 'pre', preDone, { percent: 80, reportRate: 1 }), null);
    assert.equal(comparisonFor(checkSet(), 'mission', preDone, { percent: 80, reportRate: 1 }), null);
    assert.equal(comparisonFor(checkSet(), 'training', preDone, { percent: 80, reportRate: 1 }), null);
    assert.equal(comparisonFor(checkSet({ comparison: false }), 'post', preDone, { percent: 80, reportRate: 1 }), null);
    assert.equal(comparisonFor(checkSet({ outcome: { setGlobalPrefix: 'triage_', passPercent: 0 } }), 'post', preDone, {}), null);
});

test('the no-baseline gate: pre not done, or the required flag not set', () => {
    assert.deepEqual(comparisonFor(checkSet(), 'post', {}, { percent: 81, reportRate: 0.9 }),
        { baseline: false, reason: 'pre-not-done', prePrefix: 'triage_pre_' });
    assert.deepEqual(comparisonFor(checkSet(), 'post', { ...preDone, triage_pre_done: false }, {}).reason, 'pre-not-done');
    const gated = checkSet({ comparison: { requireGlobal: 'pre_check_completed' } });
    assert.equal(comparisonFor(gated, 'post', preDone, {}).reason, 'flag-not-set');
    assert.equal(comparisonFor(gated, 'post', { ...preDone, pre_check_completed: true }, { percent: 81, reportRate: 0.9 }).baseline, true);
    assert.deepEqual(comparisonText({ baseline: false }).heading, 'No baseline');
});

test('the comparison: 52% to 81%, report rate 40% to 90% (05 "Score 52% to 81%; report rate 40% to 90%")', () => {
    const c = comparisonFor(checkSet(), 'post', preDone, { percent: 81, reportRate: 0.9 });
    assert.deepEqual(c, {
        baseline: true, prePrefix: 'triage_pre_',
        pre: { percent: 52, reportRate: 0.4 }, post: { percent: 81, reportRate: 0.9 },
        change: { percent: 29, reportRate: 50 }
    });
    assert.deepEqual(comparisonText(c).lines, [
        'Score: 52% before, 81% now (+29 points).',
        'Report rate: 40% before, 90% now (+50 points).'
    ]);
    const worse = comparisonFor(checkSet(), 'post', preDone, { percent: 40, reportRate: 0.4 });
    assert.match(comparisonText(worse).lines[0], /\(-12 points\)/);
    assert.match(comparisonText(worse).lines[1], /\(0 points\)/);
    // a missing pre number reads as 0 rather than NaN
    assert.deepEqual(comparisonFor(checkSet(), 'post', { triage_pre_done: true }, { percent: 10 }).pre, { percent: 0, reportRate: 0 });
});

// ── the overlay ─────────────────────────────────────────────────────────────

let current = null;
function open(set, params = {}) {
    current?.cleanup();
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
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
function play(s) {
    click($(s, '.tri-start'));
    for (const [id, v, chip] of [['p1', 'report', 'senderTrust'], ['r1', 'trust', null]]) {
        click($(s, `.mail-row[data-id="${id}"]`));
        click($(s, `.tri-verdict[data-verdict="${v}"]`));
        if (chip) { const i = $(s, `input[data-chip="${chip}"]`); i.checked = true; }
        click($(s, '.tri-confirm'));
    }
    click($(s, '.tri-next')); // end mode: review list, then the result
}

test('a post round with the pre done shows the comparison on the result step', () => {
    const s = open(checkSet(), { stage: 'post', globals: { ...preDone } });
    play(s);
    const st = s.getTestState().triage;
    assert.equal(st.step, 'result');
    assert.equal(st.result.percent, 100);
    assert.deepEqual(st.comparison.change, { percent: 48, reportRate: 60 });
    const box = $(s, '.tri-compare');
    assert.equal(box.dataset.baseline, 'true');
    assert.equal(box.querySelector('.tri-compare-title').textContent, 'Before and after');
    assert.match(box.textContent, /Score: 52% before, 100% now \(\+48 points\)\./);
    assert.match(box.textContent, /Report rate: 40% before, 100% now \(\+60 points\)\./);
});

test('show_result false hides the before/after panel and leaves no percentage on the result step', () => {
    const s = open(checkSet(), { stage: 'post', globals: { ...preDone }, showResult: false });
    play(s);
    assert.equal(s.getTestState().triage.step, 'result');
    assert.equal($(s, '.tri-compare'), null, 'the before/after panel is hidden');
    assert.equal($(s, '.tri-score'), null, 'the score percent is hidden');
    assert.ok($(s, '.tri-result-title'), 'the qualitative headline still shows');
    assert.ok(!/\d+%/.test(s.container.textContent), 'no "N%" is left anywhere on the result step');
});

test('show_result true (the default) still shows the panel and the score', () => {
    const s = open(checkSet(), { stage: 'post', globals: { ...preDone } });
    play(s);
    assert.ok($(s, '.tri-compare'), 'the before/after panel shows by default');
    assert.ok($(s, '.tri-score'), 'the score shows by default');
});

test('a read-only reopen with show_result false hides the comparison and the report-rate figure', () => {
    const s = open(checkSet(), {
        stage: 'post', globals: { ...preDone }, showResult: false,
        storedResult: { percent: 81, reportRate: 0.9, pass: true, readOnly: true }
    });
    assert.equal(s.getTestState().triage.step, 'result');
    assert.equal($(s, '.tri-compare'), null, 'the reopened comparison is hidden');
    assert.equal($(s, '.tri-score'), null, 'the reopened score is hidden');
    assert.ok(!/\d+%/.test(s.container.textContent), 'no "N%" on the reopened card');
});

test('a post round with no pre shows "No baseline" and its own result; a pre round shows no panel', () => {
    const s = open(checkSet(), { stage: 'post', globals: {} });
    play(s);
    const box = $(s, '.tri-compare');
    assert.equal(box.dataset.baseline, 'false');
    assert.match(box.textContent, /^No baseline/);
    assert.ok($(s, '.tri-score'), 'the round still shows its own score');
    assert.equal(s.getTestState().triage.comparison.reason, 'pre-not-done');

    const p = open(checkSet(), { globals: {} }); // stage pre
    play(p);
    assert.equal($(p, '.tri-compare'), null);
    assert.equal(p.getTestState().triage.comparison, null);
    assert.ok($(p, '.tri-come-back'));
});

test('the read-only reopen of a done post round shows the comparison from the stored result', () => {
    const s = open(checkSet(), {
        stage: 'post', globals: { ...preDone },
        storedResult: { percent: 81, reportRate: 0.9, pass: true, readOnly: true }
    });
    assert.equal(s.getTestState().triage.step, 'result');
    assert.match($(s, '.tri-compare').textContent, /52% before, 81% now \(\+29 points\)/);
    assert.match($(s, '.tri-compare').textContent, /40% before, 90% now \(\+50 points\)/);
});

test('requireGlobal holds the comparison back until the mission flag is set', () => {
    const set = checkSet({ comparison: { requireGlobal: 'pre_check_completed' } });
    const s = open(set, { stage: 'post', globals: { ...preDone } });
    play(s);
    assert.equal($(s, '.tri-compare').dataset.baseline, 'false');
    const t = open(set, { stage: 'post', globals: { ...preDone, pre_check_completed: true } });
    play(t);
    assert.equal($(t, '.tri-compare').dataset.baseline, 'true');
});
