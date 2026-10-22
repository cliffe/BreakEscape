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
const dir = mkdtempSync(join(tmpdir(), 'social-engagement-report-'));
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

// ── results: mail ───────────────────────────────────────────────────────────
test('mail results read from mailState.metrics, with target names and first-send flag', () => {
    setWorld({
        mailState: { metrics: {
            pierce: { sent: 3, failed: 2, landed: 1, firstTryLanded: false },
            lord: { sent: 1, failed: 0, landed: 1, firstTryLanded: true }
        } }
    });
    const s = open();
    const rows = s.getTestState().report.results.mail;
    assert.equal(rows.length, 2);
    const pierce = rows.find((r) => r.targetId === 'pierce');
    assert.deepEqual(
        { name: pierce.name, sent: pierce.sent, failed: pierce.failed, landed: pierce.landed, first: pierce.firstTryLanded },
        { name: 'Chris Pierce', sent: 3, failed: 2, landed: 1, first: false });
    const lord = rows.find((r) => r.targetId === 'lord');
    assert.equal(lord.firstTryLanded, true);
    // The table shows the resolved name and the counts.
    assert.match(text(s), /Chris Pierce/);
    assert.match(s.container.querySelector('[data-target="pierce"]').textContent, /3/);
    // Failed-send note appears because a failed count is non-zero.
    assert.match(text(s), /chance for a member of staff to report you/);
});

test('no mail sent: the results panel says so', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    assert.equal(s.getTestState().report.results.mail.length, 0);
    assert.match(text(s), /No mail has been sent yet/);
});

// ── results: page ─────────────────────────────────────────────────────────────
test('page line reads the victim record; submitted shows the simulated outcome', () => {
    setWorld({
        globals: { se_landing_pages: { payroll_login: { victim: { visited: true, submitted: true, noticed: false } } } },
        mailState: { metrics: {} }
    });
    const s = open();
    const page = s.getTestState().report.results.pages[0];
    assert.deepEqual({ sent: page.sent, visited: page.visited, submitted: page.submitted }, { sent: true, visited: true, submitted: true });
    assert.equal(page.line, 'Visited: yes · Submitted: yes (simulated)');
    assert.match(s.container.querySelector('[data-page="payroll_login"]').textContent, /Submitted: yes \(simulated\)/);
});

test('below-threshold page reads visited, noticed, not submitted', () => {
    setWorld({
        globals: { se_landing_pages: { payroll_login: { victim: { visited: true, submitted: false, noticed: true } } } },
        mailState: { metrics: {} }
    });
    const s = open();
    assert.equal(pageOutcomeLine(s.model.results.pages[0]), 'Visited: yes · Submitted: no (noticed)');
});

test('"no page sent" when the record has no victim', () => {
    setWorld({ globals: { se_landing_pages: { payroll_login: {} } }, mailState: { metrics: {} } });
    const s = open();
    assert.equal(s.getTestState().report.results.pages[0].sent, false);
    assert.match(s.container.querySelector('[data-page="payroll_login"]').textContent, /No page sent/);

    // And when there is no record at all.
    setWorld({ globals: {}, mailState: { metrics: {} } });
    const s2 = open();
    assert.equal(s2.getTestState().report.results.pages[0].sent, false);
});

// ── results: call ─────────────────────────────────────────────────────────────
test('call line reads the pretext globals: granted, reported, outcome and lowest', () => {
    setWorld({
        globals: { pretext_call_done: true, dev_reported: true,
            pretext_service_desk_call_outcome: 'reported', pretext_service_desk_call_lowest: -72 },
        mailState: { metrics: {} }
    });
    const s = open();
    const call = s.getTestState().report.results.calls[0];
    assert.deepEqual({ done: call.done, reported: call.reported, outcome: call.outcome, lowest: call.lowest },
        { done: true, reported: true, outcome: 'reported', lowest: -72 });
    const line = s.container.querySelector('[data-call="service_desk_call"]').textContent;
    assert.match(line, /An ask was granted/);
    assert.match(line, /reported the attempt/);
    assert.match(line, /Lowest influence: -72/);
});

test('call line reads as two calls when a later call succeeded after an earlier reported one (R3 F7)', () => {
    setWorld({
        globals: { pretext_call_done: true, dev_reported: true,
            pretext_service_desk_call_outcome: 'got_it', pretext_service_desk_call_lowest: -60,
            pretext_service_desk_call_reports: 1 },
        mailState: { metrics: {} }
    });
    const s = open();
    const call = s.getTestState().report.results.calls[0];
    assert.equal(call.failedAttempts, 1);
    const line = s.container.querySelector('[data-call="service_desk_call"]').textContent;
    assert.match(line, /earlier call was reported to the manager; a later call got what it asked for/);
    assert.doesNotMatch(line, /An ask was granted\./);
    assert.match(line, /Lowest influence: -60/);
});

test('the report states once that it cannot see staff reports', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    assert.match(text(s), /cannot see whether staff reported/);
});

// ── results step: Confirm ─────────────────────────────────────────────────────
test('pressing Confirm sets report_results_done and records the press in se_report_state', () => {
    setWorld({ mailState: { metrics: { pierce: { sent: 1, landed: 1 } } } });
    const s = open();
    assert.equal(stateOf().report_results_done, undefined);
    const btn = s.container.querySelector('[data-confirm-btn]');
    assert.ok(btn, 'a Confirm button is shown');
    btn.click();
    assert.equal(stateOf().report_results_done, true);
    // ids only: confirmed holds the item's id (its step, as the item carries no id).
    assert.deepEqual(readReportState(stateOf()).confirmed, ['results']);
    // The press now reads as done, not a button.
    assert.equal(s.container.querySelector('[data-confirm-btn]'), null);
    assert.equal(s.getTestState().report.items[0].confirmed, true);
});

// ── findings step: pairing, blame, completion ──────────────────────────────────
test('a wrong root cause shows its why and does not lock the finding', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('spoofed_colleague', 'cause', 'more_training'); // not a root-cause option id → ignored
    assert.equal(s.getTestState().report.findings.find((f) => f.id === 'spoofed_colleague').cause, null);

    assert.equal(s.pick('spoofed_colleague', 'cause', 'staff_carelessness'), true);
    const f = s.getTestState().report.findings.find((x) => x.id === 'spoofed_colleague');
    assert.equal(f.cause, 'staff_carelessness');
    assert.equal(f.causeDone, false);
    assert.equal(f.done, false);
    assert.equal(f.causeBlame, true);
    assert.equal(f.causeWhy, 'Blames people; the control gap is the cause.');
    // The blame option's why is on the page, worded as a blame flag.
    assert.match(text(s), /Blaming staff/);
    assert.match(text(s), /Blames people; the control gap is the cause/);
    // report_findings_done is not set by a wrong pick.
    assert.equal(stateOf().report_findings_done, undefined);
});

test('a finding locks only when both cause and control are correct', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('spoofed_colleague', 'cause', 'no_banner_dmarc_none');
    let f = s.getTestState().report.findings.find((x) => x.id === 'spoofed_colleague');
    assert.equal(f.causeDone, true);
    assert.equal(f.done, false); // control still unset
    s.pick('spoofed_colleague', 'control', 'banner_dmarc_enforce');
    f = s.getTestState().report.findings.find((x) => x.id === 'spoofed_colleague');
    assert.equal(f.done, true);
    // Once locked, re-picking is refused.
    assert.equal(s.pick('spoofed_colleague', 'cause', 'staff_carelessness'), false);
});

test('all findings correct plus Confirm files the report (report_filed), steps first', () => {
    setWorld({ mailState: { metrics: { pierce: { sent: 1, landed: 1 } } } });
    const s = open();

    // findings step
    s.pick('spoofed_colleague', 'cause', 'no_banner_dmarc_none');
    s.pick('spoofed_colleague', 'control', 'banner_dmarc_enforce');
    s.pick('desk_leak', 'cause', 'no_verification_script');
    s.pick('desk_leak', 'control', 'callback_on_file');
    assert.equal(stateOf().report_findings_done, true);
    assert.equal(stateOf().report_filed, undefined, 'the block waits for the results step too');

    // results step
    s.container.querySelector('[data-confirm-btn]').click();
    assert.equal(stateOf().report_results_done, true);
    assert.equal(stateOf().report_filed, true);
    assert.equal(s.getTestState().report.complete, true);
});

test('se_report_state carries ids only: option ids per finding, not the option objects', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    s.pick('spoofed_colleague', 'cause', 'no_banner_dmarc_none');
    s.pick('spoofed_colleague', 'control', 'banner_dmarc_enforce');
    const stored = stateOf()[ 'se_report_state' ];
    assert.deepEqual(stored.findings.spoofed_colleague, { cause: 'no_banner_dmarc_none', control: 'banner_dmarc_enforce' });
    // Every stored value is a string id or a string in an array — no nested option objects.
    for (const pair of Object.values(stored.findings)) {
        for (const v of Object.values(pair)) assert.equal(typeof v, 'string');
    }
    for (const c of stored.confirmed) assert.equal(typeof c, 'string');
});

// ── reload / reopen ────────────────────────────────────────────────────────────
test('a reopen rebuilds from se_report_state and re-applies a global that never landed', () => {
    // Saved pairings complete, but the step globals never landed (a save that did not reach the server).
    setWorld({
        globals: { se_report_state: { v: 1, confirmed: ['results'], findings: {
            spoofed_colleague: { cause: 'no_banner_dmarc_none', control: 'banner_dmarc_enforce' },
            desk_leak: { cause: 'no_verification_script', control: 'callback_on_file' }
        } } },
        mailState: { metrics: {} }
    });
    const s = open();
    // On open the report re-applies the due globals.
    assert.equal(stateOf().report_results_done, true);
    assert.equal(stateOf().report_findings_done, true);
    assert.equal(stateOf().report_filed, true);
    assert.equal(s.getTestState().report.complete, true);
    // The findings show as written up.
    assert.equal(s.getTestState().report.findings.every((f) => f.done), true);
});

// ── pure model ───────────────────────────────────────────────────────────────
test('buildReportModel is pure: it reads records and writes nothing', () => {
    const globals = { se_landing_pages: { payroll_login: { victim: { visited: true, submitted: true } } } };
    const before = JSON.stringify(globals);
    const m = buildReportModel(fixture, globals, { metrics: { pierce: { sent: 2, landed: 1 } } });
    assert.equal(JSON.stringify(globals), before);
    assert.equal(m.results.mail[0].sent, 2);
    assert.equal(m.results.pages[0].submitted, true);
    assert.equal(m.complete, false);
    assert.equal(m.onCompleteGlobal, 'report_filed');
});

// ── exit ──────────────────────────────────────────────────────────────────────
test('Close is a normal exit and reports completion', () => {
    setWorld({ mailState: { metrics: {} } });
    const s = open();
    ended.length = 0;
    s.container.querySelector('.er-close').click();
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
    assert.equal(ended[0].result.completed, false);
});
