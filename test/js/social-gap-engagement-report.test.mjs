// Gap tests for the engagement report overlay: repeated and out-of-order presses, stale or odd saved
// state, unknown ids, missing mail state, step globals that were already set, reopen after filing.
// Same harness as social-engagement-report.test.mjs (real overlay in jsdom).
// Run with: bin/test-js test/js/social-gap-engagement-report.test.mjs
//
// Harness notes from the original:
// The engagement report builder (SE design 10 stage 6, N1, N2; implementation plan Phase 6, P6-B):
// results read from mailState.metrics, the landing-page records and the pretext globals; the
// results Confirm and the findings pairings set the step and block globals; a wrong (blame)
// option shows its `why`; se_report_state holds ids only. Uses the real overlay base classes in
// a jsdom document.
// Run with: bundle exec node --test test/js/social-engagement-report.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/engagement-report-social.json'), 'utf8'));

// The real files, copied with their relative layout into an ESM folder.
const dir = mkdtempSync(join(tmpdir(), 'social-gap-engagement-report-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/engagement-report/engagement-report-minigame.js',
    'minigames/engagement-report/report-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
let syncs = 0;
window.stateSync = { sync: () => { syncs++; } };
const ended = [];
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); }
};

const { EngagementReportMinigame, pageOutcomeLine } =
    await import(pathToFileURL(join(dir, 'minigames/engagement-report/engagement-report-minigame.js')));
const { buildReportModel, readReportState } =
    await import(pathToFileURL(join(dir, 'minigames/engagement-report/report-model.js')));

function setWorld({ globals = {}, mailState = {} } = {}) {
    window.gameState = { globalVariables: { ...globals } };
    window.gameScenario = { social: fixture };
    window.mailState = mailState;
}

let current = null;
function open(params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new EngagementReportMinigame(container, params);
    scene._sceneType = 'engagement-report';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const stateOf = () => window.gameState.globalVariables;
const text = (scene) => scene.container.textContent.replace(/\s+/g, ' ');


const rs = (s) => s.getTestState().report;
const fin = (s, id) => rs(s).findings.find((f) => f.id === id);
const SPOOF = { cause: 'no_banner_dmarc_none', control: 'banner_dmarc_enforce' };
const DESK = { cause: 'no_verification_script', control: 'callback_on_file' };
const solve = (s) => {
    s.pick('spoofed_colleague', 'cause', SPOOF.cause); s.pick('spoofed_colleague', 'control', SPOOF.control);
    s.pick('desk_leak', 'cause', DESK.cause); s.pick('desk_leak', 'control', DESK.control);
};

// ── repeated and out-of-order presses ────────────────────────────────────────

test('Confirm pressed twice records one press and the second call is refused', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    assert.equal(s.confirmResults('results'), true);
    assert.equal(s.confirmResults('results'), false);
    assert.deepEqual(readReportState(stateOf()).confirmed, ['results']);
});

test('confirmResults with no id, an unknown id, or a finding id is refused and writes nothing', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    for (const id of [undefined, null, '', 'nope', 'spoofed_colleague']) assert.equal(s.confirmResults(id), false, String(id));
    assert.equal(stateOf().se_report_state, undefined);
    assert.equal(stateOf().report_results_done, undefined);
});

test('findings can be done in either order and either half first; report_filed arrives only when the last piece lands', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('desk_leak', 'control', DESK.control);
    s.pick('spoofed_colleague', 'control', SPOOF.control);
    s.pick('desk_leak', 'cause', DESK.cause);
    assert.equal(stateOf().report_findings_done, undefined);
    s.pick('spoofed_colleague', 'cause', SPOOF.cause);
    assert.equal(stateOf().report_findings_done, true);
    assert.equal(stateOf().report_filed, undefined);
    s.confirmResults('results');
    assert.equal(stateOf().report_filed, true);
});

test('confirm first, then findings: the same end state', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.confirmResults('results');
    assert.equal(stateOf().report_results_done, true);
    assert.equal(stateOf().report_filed, undefined);
    solve(s);
    assert.equal(stateOf().report_filed, true);
    assert.equal(rs(s).complete, true);
});

test('a wrong pick can be replaced by the right one; a right half stays right while the other half is changed', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('spoofed_colleague', 'cause', 'staff_carelessness');
    s.pick('spoofed_colleague', 'cause', SPOOF.cause);
    assert.equal(fin(s, 'spoofed_colleague').causeDone, true);
    s.pick('spoofed_colleague', 'control', 'more_training');
    s.pick('spoofed_colleague', 'cause', 'staff_carelessness'); // changing the right cause is allowed until the finding locks
    assert.equal(fin(s, 'spoofed_colleague').causeDone, false);
    assert.equal(fin(s, 'spoofed_colleague').done, false);
});

test('pick with bad arguments is refused: unknown finding, unknown option, option from the other half, wrong part name', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    assert.equal(s.pick('nope', 'cause', SPOOF.cause), false);
    assert.equal(s.pick('spoofed_colleague', 'cause', 'nope'), false);
    assert.equal(s.pick('spoofed_colleague', 'cause', SPOOF.control), false, 'a control id offered as a cause');
    assert.equal(s.pick('spoofed_colleague', 'control', SPOOF.cause), false);
    assert.equal(s.pick('spoofed_colleague', 'Cause', SPOOF.cause), false);
    assert.equal(s.pick('spoofed_colleague', undefined, SPOOF.cause), false);
    assert.equal(s.pick(undefined, 'cause', SPOOF.cause), false);
    assert.equal(stateOf().se_report_state, undefined);
});

test('answerResults on a confirm item, an unknown item or an unknown option is refused', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    assert.equal(s.answerResults('results', 'x'), false);
    assert.equal(s.answerResults('nope', 'x'), false);
    assert.equal(s.answerResults(undefined, undefined), false);
});

// ── reopen and stale state ───────────────────────────────────────────────────

test('reopening a filed report sets nothing new and keeps every global as it was', () => {
    setWorld({ mailState: { metrics: {} } });
    let s = open();
    s.confirmResults('results');
    solve(s);
    const snapshot = JSON.stringify(stateOf());
    s = open();
    assert.equal(JSON.stringify(stateOf()), snapshot);
    assert.equal(rs(s).complete, true);
});

test('saved picks for findings that no longer exist, and options that no longer exist, are ignored', () => {
    setWorld({ globals: { se_report_state: { v: 1, confirmed: ['gone_item'], findings: { removed: { cause: 'x', control: 'y' }, desk_leak: { cause: 'removed_opt', control: DESK.control } } } }, mailState: { metrics: {} } });
    const s = open();
    assert.equal(fin(s, 'desk_leak').cause, null);
    assert.equal(fin(s, 'desk_leak').controlDone, true);
    assert.equal(fin(s, 'desk_leak').done, false);
    assert.equal(rs(s).complete, false);
});

test('a report_filed flag that is already true with no saved pairings does not mark the report complete', () => {
    setWorld({ globals: { report_filed: true, report_results_done: true, report_findings_done: true }, mailState: { metrics: {} } });
    const s = open();
    assert.equal(rs(s).complete, false);
    assert.equal(stateOf().report_filed, true, 'an existing flag is never cleared');
});

test('a corrupt se_report_state (string, array, number) opens as a blank report', () => {
    for (const bad of ['{bad', [], 7, null]) {
        setWorld({ globals: { se_report_state: bad }, mailState: { metrics: {} } });
        const s = open();
        assert.equal(rs(s).complete, false);
        assert.equal(rs(s).findings.every((f) => !f.cause && !f.control), true);
        assert.doesNotThrow(() => s.confirmResults('results'));
    }
});

test('reopen with half the steps already flagged true re-applies only the missing ones', () => {
    setWorld({
        globals: { report_results_done: true, se_report_state: { v: 1, confirmed: ['results'], findings: { spoofed_colleague: SPOOF, desk_leak: DESK } } },
        mailState: { metrics: {} },
    });
    const s = open();
    assert.equal(stateOf().report_findings_done, true);
    assert.equal(stateOf().report_filed, true);
    assert.equal(rs(s).complete, true);
});

// ── results panel on thin data ───────────────────────────────────────────────

test('no window.mailState at all opens with an empty mail table and does not throw', () => {
    setWorld({});
    delete window.mailState;
    const s = open();
    assert.deepEqual(rs(s).results.mail, []);
    assert.match(text(s), /No mail|nothing|not sent/i);
});

test('metrics for a target not in phishTargets still appear, named by id', () => {
    setWorld({ mailState: { metrics: { stranger: { sent: 1, failed: 1, landed: 0 } } } });
    const s = open();
    const row = rs(s).results.mail.find((r) => r.targetId === 'stranger');
    assert.ok(row);
    assert.equal(row.name, 'stranger');
});

test('rebuild() after the mail state changes shows the new numbers', () => {
    setWorld({ mailState: { metrics: { pierce: { sent: 1, landed: 0, failed: 1 } } } });
    const s = open();
    assert.equal(rs(s).results.mail[0].sent, 1);
    window.mailState.metrics.pierce.sent = 4;
    s.rebuild();
    assert.equal(rs(s).results.mail[0].sent, 4);
});

test('Close with nothing done reports completed false; Close after filing reports true; Close twice ends once', () => {
    setWorld({ mailState: { metrics: {} } });
    let s = open();
    ended.length = 0;
    s.container.querySelector('.er-close').click();
    assert.equal(ended[0].result.completed, false);
    s = open();
    s.confirmResults('results');
    solve(s);
    ended.length = 0;
    s.container.querySelector('.er-close').click();
    assert.equal(ended[0].result.completed, true);
    s.container.querySelector('.er-close')?.click();
    assert.ok(ended.length <= 2);
});

test('every write the report makes is ids and booleans: no option text or why strings in se_report_state', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('spoofed_colleague', 'cause', 'staff_carelessness');
    solve(s);
    const json = JSON.stringify(stateOf().se_report_state);
    for (const leak of ['Blames people', 'External banner', 'Call back on a number']) assert.equal(json.includes(leak), false, leak);
});

test('question items: the same wrong answer picked twice stays unlocked; the right answer after a wrong one locks; the answers map holds ids only', () => {
    const social = JSON.parse(JSON.stringify(fixture));
    social.engagement.report.items = [{ kind: 'question', id: 'q', step: 'results', text: 'Q?', options: [
        { id: 'a', text: 'A', correct: false, why: 'no' }, { id: 'b', text: 'B', correct: true, why: 'yes' }] }];
    setWorld({ mailState: { metrics: {} } });
    const s = open({ social });
    assert.equal(s.answerResults('q', 'a'), true);
    assert.equal(s.answerResults('q', 'a'), true);
    assert.equal(rs(s).items[0].done, false);
    assert.equal(s.answerResults('q', 'b'), true);
    assert.equal(rs(s).items[0].done, true);
    assert.equal(s.answerResults('q', 'a'), false, 'locked');
    assert.deepEqual(readReportState(stateOf()).answers, { q: 'b' });
    assert.equal(stateOf().report_results_done, true);
});
