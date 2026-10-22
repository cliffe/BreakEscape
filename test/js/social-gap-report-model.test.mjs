// Gap tests for minigames/engagement-report/report-model.js: empty and malformed inputs,
// restore of saved report state, completion boundaries, label resolution and the toSet list.
// Run with: bin/test-js test/js/social-gap-report-model.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-report-model-'));
writeFileSync(join(dir, 'report-model.mjs'), readFileSync(join(js, 'minigames/engagement-report/report-model.js'), 'utf8'));
const { buildReportModel, readReportState, confirmId, STATE_KEY } = await import(pathToFileURL(join(dir, 'report-model.mjs')).href);

const opt = (id, correct = false) => ({ id, text: id, correct });

test('buildReportModel with nothing at all returns a safe empty model that is not complete', () => {
    for (const args of [[], [null, null, null], [{}, {}, {}], [undefined, undefined, undefined]]) {
        const m = buildReportModel(...args);
        assert.deepEqual(m.results.mail, []);
        assert.deepEqual(m.results.pages, []);
        assert.deepEqual(m.results.calls, []);
        assert.equal(m.complete, false); // no steps declared is never "complete"
        assert.deepEqual(m.toSet, []);
        assert.equal(m.title, 'Engagement report');
    }
});

test('readReportState tolerates garbage in every slot', () => {
    for (const raw of [null, undefined, 5, 'str', true, [], { confirmed: 'x', findings: 3, answers: 'y' }]) {
        const s = readReportState({ [STATE_KEY]: raw });
        assert.deepEqual(s, { v: 1, confirmed: [], findings: {}, answers: {} });
    }
    assert.deepEqual(readReportState(null), { v: 1, confirmed: [], findings: {}, answers: {} });
    assert.deepEqual(readReportState(undefined), { v: 1, confirmed: [], findings: {}, answers: {} });
});

test('readReportState keeps only strings: non-string confirmed ids, non-string option ids and non-object findings drop out', () => {
    const s = readReportState({
        [STATE_KEY]: {
            confirmed: ['a', 1, null, 'b'],
            findings: { f1: { cause: 'c1', control: 7, extra: 'x' }, f2: null, f3: 'str' },
            answers: { q1: 'o1', q2: 5, q3: null },
            freeText: 'my private notes',
        },
    });
    assert.deepEqual(s.confirmed, ['a', 'b']);
    assert.deepEqual(s.findings, { f1: { cause: 'c1' } });
    assert.deepEqual(s.answers, { q1: 'o1' });
    assert.equal(JSON.stringify(s).includes('private'), false);
});

test('confirmId: own id, then step, then null', () => {
    assert.equal(confirmId({ id: 'i', step: 's' }), 'i');
    assert.equal(confirmId({ step: 's' }), 's');
    assert.equal(confirmId({ id: '', step: 's' }), 's');
    assert.equal(confirmId({}), null);
    assert.equal(confirmId(null), null);
    assert.equal(confirmId({ id: 5, step: 6 }), null);
});

test('mail: null / non-object mailState and a null metrics entry give zeroed rows, not a throw', () => {
    assert.deepEqual(buildReportModel({}, {}, null).results.mail, []);
    assert.deepEqual(buildReportModel({}, {}, { metrics: null }).results.mail, []);
    const m = buildReportModel({}, {}, { metrics: { t1: null, t2: 'x' } });
    assert.deepEqual(m.results.mail.map((r) => [r.targetId, r.sent, r.failed, r.landed, r.firstTryLanded]), [['t1', 0, 0, 0, false], ['t2', 0, 0, 0, false]]);
});

test('mail: numeric strings, NaN, Infinity and negatives in metrics are normalised', () => {
    const m = buildReportModel({}, {}, { metrics: { t: { sent: '3', failed: NaN, landed: Infinity, firstTryLanded: 'true' } } });
    const row = m.results.mail[0];
    assert.equal(row.sent, 0); // strings are not numbers here
    assert.equal(row.failed, 0);
    // Infinity is not finite, so it must not leak into the table
    assert.equal(row.landed, 0);
    assert.equal(row.firstTryLanded, false); // only boolean true counts
});

test('mail: order follows phishTargets (deduplicated), then remaining ids sorted; targets with no metrics get no row', () => {
    const social = { phishTargets: [{ id: 'b' }, { id: 'a' }, { id: 'b' }, { id: 'never' }] };
    const m = buildReportModel(social, {}, { metrics: { z: {}, a: {}, y: {}, b: {} } });
    assert.deepEqual(m.results.mail.map((r) => r.targetId), ['b', 'a', 'y', 'z']);
});

test('mail names: target name, displayName, contact name, contact person, person forms, then the raw id', () => {
    const social = {
        people: [{ id: 'p1', forms: { full: 'Pat One', first: 'Pat' } }, { id: 'p2', forms: { first: 'Quinn' } }, { id: 'p3', name: 'Rae' }, { id: 'p4' }],
        phishTargets: [{ id: 't1', name: 'T One' }, { id: 't2', displayName: 'T Two' }],
        mailClient: { contacts: [{ targetId: 't3', name: 'Contact Three' }, { targetId: 't4', person: 'p1' }, { targetId: 't5', person: 'missing' }] },
    };
    const metrics = Object.fromEntries(['t1', 't2', 't3', 't4', 't5', 'p2', 'p3', 'p4'].map((k) => [k, {}]));
    const names = Object.fromEntries(buildReportModel(social, {}, { metrics }).results.mail.map((r) => [r.targetId, r.name]));
    assert.deepEqual(names, { t1: 'T One', t2: 'T Two', t3: 'Contact Three', t4: 'Pat One', t5: 't5', p2: 'Quinn', p3: 'Rae', p4: 'p4' });
});

test('labelBy "role" uses roles where present and falls back to names where a target has none', () => {
    const social = {
        people: [],
        phishTargets: [{ id: 't1', name: 'Alice', role: 'Finance clerk' }, { id: 't2', name: 'Bob' }],
        mailClient: { contacts: [{ targetId: 't3', name: 'Carol', role: 'Receptionist' }] },
        engagement: { report: { labelBy: 'role' } },
    };
    const m = buildReportModel(social, {}, { metrics: { t1: {}, t2: {}, t3: {} } });
    assert.deepEqual(m.results.mail.map((r) => r.name), ['Finance clerk', 'Bob', 'Receptionist']);
    social.engagement.report.labelBy = 'name';
    assert.equal(buildReportModel(social, {}, { metrics: { t1: {} } }).results.mail[0].name, 'Alice');
});

test('pages: no se_landing_pages, a record without victim, and a victim with only some flags', () => {
    const social = { landingPages: [{ id: 'p1', linkText: 'Portal' }, { id: 'p2' }, { id: 'p3', linkText: 'Three' }, null, { linkText: 'no id' }] };
    const none = buildReportModel(social, {}, {}).results.pages;
    assert.deepEqual(none.map((p) => [p.pageId, p.sent, p.label]), [['p1', false, 'Portal'], ['p2', false, 'p2'], ['p3', false, 'Three']]);
    const globals = { se_landing_pages: { p1: { victim: { visited: true } }, p2: { victim: null }, p3: { victim: { visited: 'yes', submitted: 1, noticed: true } } } };
    const pages = buildReportModel(social, globals, {}).results.pages;
    assert.deepEqual(pages.map((p) => [p.sent, p.visited, p.submitted, p.noticed]), [[true, true, false, false], [false, false, false, false], [true, false, false, true]]);
});

test('pages: se_landing_pages as a non-object (string, array) does not throw', () => {
    const social = { landingPages: [{ id: 'p1' }] };
    for (const v of ['junk', 5, null]) assert.equal(buildReportModel(social, { se_landing_pages: v }, {}).results.pages[0].sent, false);
});

test('pages: label prefers the landed domain, then the chosen domain, then link text; an off-menu id falls through', () => {
    const def = { id: 'p', linkText: 'Link', brands: [{ domains: [{ id: 'd1', domain: 'paypa1.example' }, { id: 'd2', domain: 'other.example' }, { id: 'd3' }] }, null, {}] };
    const label = (rec) => buildReportModel({ landingPages: [def] }, { se_landing_pages: { p: rec } }, {}).results.pages[0].label;
    assert.equal(label({ victim: { domainId: 'd1' }, choices: { domainId: 'd2' } }), 'paypa1.example');
    assert.equal(label({ victim: { domainId: 'gone' }, choices: { domainId: 'd2' } }), 'other.example');
    assert.equal(label({ victim: {}, choices: { domainId: 'd3' } }), 'Link'); // d3 has no domain string
    assert.equal(label({ victim: {}, choices: { domainId: 'nope' } }), 'Link');
    assert.equal(label(undefined), 'Link');
    assert.equal(label('junk'), 'Link');
});

test('calls: callId wins over id; entries with neither are skipped; failedAttempts handles NaN and strings', () => {
    const social = { pretextNpcs: [{ callId: 'c1', id: 'old', character: 'amy' }, { id: 'c2' }, { character: 'x' }, null, { callId: 7 }] };
    const g = { pretext_c1_outcome: 'got_it', pretext_c1_lowest: 12, pretext_c1_reports: '2', pretext_c2_reports: 'abc', amy_reported: true, pretext_call_done: true };
    const calls = buildReportModel(social, g, {}).results.calls;
    assert.deepEqual(calls.map((c) => c.callId), ['c1', 'c2']);
    assert.deepEqual(calls[0], { callId: 'c1', character: 'amy', done: true, reported: true, outcome: 'got_it', lowest: 12, failedAttempts: 2 });
    assert.equal(calls[1].failedAttempts, 0);
    assert.equal(calls[1].reported, false);
    assert.equal(calls[1].character, null);
});

test('calls: outcome and lowest of the wrong type read as null; "true" strings do not count as done', () => {
    const g = { pretext_c_outcome: 5, pretext_c_lowest: '10', pretext_call_done: 'true' };
    const [c] = buildReportModel({ pretextNpcs: [{ callId: 'c', character: 'k' }] }, g, {}).results.calls;
    assert.equal(c.outcome, null);
    assert.equal(c.lowest, null);
    assert.equal(c.done, false);
});

test('a null globals object works everywhere', () => {
    const m = buildReportModel({ pretextNpcs: [{ callId: 'c' }], landingPages: [{ id: 'p' }] }, null, null);
    assert.equal(m.results.calls[0].done, false);
    assert.equal(m.results.pages[0].sent, false);
});

// ── completion ────────────────────────────────────────────────────────────────

const block = (over = {}) => ({
    engagement: {
        report: {
            onCompleteGlobal: 'report_filed',
            steps: [{ id: 'results', onCompleteGlobal: 'report_results_done' }, { id: 'findings', onCompleteGlobal: 'report_findings_done' }],
            items: [{ kind: 'confirm', id: 'ack', step: 'results' }],
            findings: [{ id: 'f1', step: 'findings', rootCauses: [opt('rc1', true), opt('rc2')], controls: [opt('c1', true), opt('c2')] }],
            ...over,
        },
    },
});

test('a step with no bound items is never done, so a block with such a step never completes', () => {
    const m = buildReportModel(block({ steps: [{ id: 'results' }, { id: 'orphan' }] }), { [STATE_KEY]: { confirmed: ['ack'], findings: { f1: { cause: 'rc1', control: 'c1' } } } }, {});
    assert.equal(m.steps.find((s) => s.id === 'results').done, true);
    assert.equal(m.steps.find((s) => s.id === 'orphan').done, false);
    assert.equal(m.complete, false);
    assert.equal(m.toSet.includes('report_filed'), false);
});

test('nothing done: toSet is empty and complete is false', () => {
    const m = buildReportModel(block(), {}, {});
    assert.deepEqual(m.toSet, []);
    assert.equal(m.complete, false);
});

test('only the results step done: its global is queued, the block global is not', () => {
    const m = buildReportModel(block(), { [STATE_KEY]: { confirmed: ['ack'] } }, {});
    assert.deepEqual(m.toSet, ['report_results_done']);
    assert.equal(m.complete, false);
});

test('everything done: step globals first, then the block global', () => {
    const m = buildReportModel(block(), { [STATE_KEY]: { confirmed: ['ack'], findings: { f1: { cause: 'rc1', control: 'c1' } } } }, {});
    assert.deepEqual(m.toSet, ['report_results_done', 'report_findings_done', 'report_filed']);
    assert.equal(m.complete, true);
});

test('a global already true is not queued again (repeated open is idempotent)', () => {
    const g = { report_results_done: true, report_findings_done: true, report_filed: true, [STATE_KEY]: { confirmed: ['ack'], findings: { f1: { cause: 'rc1', control: 'c1' } } } };
    const m = buildReportModel(block(), g, {});
    assert.deepEqual(m.toSet, []);
    assert.equal(m.complete, true);
});

test('a global set to the string "true" is not treated as set and is queued again', () => {
    const g = { report_results_done: 'true', [STATE_KEY]: { confirmed: ['ack'] } };
    assert.deepEqual(buildReportModel(block(), g, {}).toSet, ['report_results_done']);
});

test('restore: a saved global flag with no saved state does not complete steps (state is the truth)', () => {
    const m = buildReportModel(block(), { report_filed: true, report_results_done: true }, {});
    assert.equal(m.complete, false);
    assert.equal(m.steps[0].done, false);
});

test('finding needs both halves correct; a wrong cause or a cause only is not done', () => {
    const f = (saved) => buildReportModel(block(), { [STATE_KEY]: { findings: { f1: saved } } }, {}).findings[0];
    assert.equal(f({ cause: 'rc1', control: 'c1' }).done, true);
    assert.equal(f({ cause: 'rc1' }).done, false);
    assert.equal(f({ cause: 'rc1' }).causeDone, true);
    assert.equal(f({ cause: 'rc2', control: 'c1' }).done, false);
    assert.equal(f({ cause: 'rc2', control: 'c1' }).controlDone, true);
    assert.equal(f({}).pickedCauseId, null);
});

test('saved picks for option ids that no longer exist are ignored (scenario edited between sessions)', () => {
    const f = buildReportModel(block(), { [STATE_KEY]: { findings: { f1: { cause: 'removed', control: 'gone' } } } }, {}).findings[0];
    assert.equal(f.pickedCause, null);
    assert.equal(f.pickedControl, null);
    assert.equal(f.done, false);
});

test('findings with no string id are dropped; options without a string id are dropped; flags coerce to booleans', () => {
    const m = buildReportModel(block({ findings: [{ id: 5 }, null, { id: 'ok', step: 'findings', rootCauses: [{ id: 'a', correct: 'yes', blame: 1 }, { text: 'no id' }, null], controls: undefined }] }), {}, {});
    assert.equal(m.findings.length, 1);
    assert.deepEqual(m.findings[0].rootCauses, [{ id: 'a', text: '', correct: false, blame: false, why: '' }]);
    assert.deepEqual(m.findings[0].controls, []);
    assert.equal(m.findings[0].done, false); // nothing can ever be correct
});

test('a finding with zero options can never be done, so its step never completes', () => {
    const m = buildReportModel(block({ findings: [{ id: 'f', step: 'findings' }] }), {}, {});
    assert.equal(m.steps.find((s) => s.id === 'findings').done, false);
});

test('a confirm item with neither id nor step has no id and can never be confirmed', () => {
    const m = buildReportModel(block({ items: [{ kind: 'confirm', step: undefined }] }), { [STATE_KEY]: { confirmed: [null, undefined, ''] } }, {});
    assert.equal(m.items[0].id, null);
    assert.equal(m.items[0].confirmed, false);
});

test('two confirm items on one step: both must be pressed', () => {
    const b = block({ items: [{ kind: 'confirm', id: 'a', step: 'results' }, { kind: 'confirm', id: 'b', step: 'results' }] });
    const one = buildReportModel(b, { [STATE_KEY]: { confirmed: ['a'] } }, {});
    assert.equal(one.steps[0].done, false);
    const both = buildReportModel(b, { [STATE_KEY]: { confirmed: ['b', 'a'] } }, {});
    assert.equal(both.steps[0].done, true);
});

test('a confirm item with no explicit id is confirmed under its step id', () => {
    const m = buildReportModel(block({ items: [{ kind: 'confirm', step: 'results' }] }), { [STATE_KEY]: { confirmed: ['results'] } }, {});
    assert.equal(m.items[0].id, 'results');
    assert.equal(m.items[0].done, true);
});

test('question items: right pick locks, wrong pick does not, no pick does not, and picks are by id only', () => {
    const b = block({ items: [{ kind: 'question', id: 'q', step: 'results', text: 'Q', options: [opt('a', true), opt('b')] }] });
    const get = (answers) => buildReportModel(b, { [STATE_KEY]: { answers } }, {}).items[0];
    assert.equal(get({ q: 'a' }).done, true);
    assert.equal(get({ q: 'b' }).done, false);
    assert.equal(get({ q: 'b' }).pickedId, 'b');
    assert.equal(get({}).pickedId, null);
    assert.equal(get({ q: 'zzz' }).done, false);
    assert.equal(get({ other: 'a' }).done, false);
});

test('question with no correct option can never be answered; step stays open', () => {
    const b = block({ items: [{ kind: 'question', id: 'q', step: 'results', options: [opt('a'), opt('b')] }] });
    const m = buildReportModel(b, { [STATE_KEY]: { answers: { q: 'a' } } }, {});
    assert.equal(m.steps[0].done, false);
});

test('question and confirm bound to the same step must both be satisfied', () => {
    const b = block({ items: [{ kind: 'confirm', id: 'c', step: 'results' }, { kind: 'question', id: 'q', step: 'results', options: [opt('a', true)] }] });
    assert.equal(buildReportModel(b, { [STATE_KEY]: { confirmed: ['c'] } }, {}).steps[0].done, false);
    assert.equal(buildReportModel(b, { [STATE_KEY]: { confirmed: ['c'], answers: { q: 'a' } } }, {}).steps[0].done, true);
});

test('items of an unknown kind or bound to an undeclared step are kept or dropped without breaking completion', () => {
    const b = block({ items: [{ kind: 'confirm', id: 'ack', step: 'results' }, { kind: 'banner', step: 'results' }, { kind: 'confirm', id: 'x', step: 'ghost' }, null] });
    const m = buildReportModel(b, { [STATE_KEY]: { confirmed: ['ack'] } }, {});
    assert.equal(m.items.length, 2); // banner and null dropped, ghost-step confirm kept
    assert.equal(m.steps[0].done, true);
});

test('steps with no id are ignored; a step missing onCompleteGlobal never queues null', () => {
    const b = block({ steps: [{ id: 'results' }, {}, null], onCompleteGlobal: undefined });
    const m = buildReportModel(b, { [STATE_KEY]: { confirmed: ['ack'] } }, {});
    assert.equal(m.steps.length, 1);
    assert.deepEqual(m.toSet, []);
    assert.equal(m.complete, true);
});

test('unseenNote has a default and an authored override', () => {
    assert.match(buildReportModel({}, {}, {}).results.unseenNote, /cannot see whether staff reported/);
    assert.equal(buildReportModel(block({ unseenNote: 'custom' }), {}, {}).results.unseenNote, 'custom');
});

test('buildReportModel does not mutate the globals or the scenario block', () => {
    const social = block();
    const g = { [STATE_KEY]: { confirmed: ['ack'], findings: { f1: { cause: 'rc1', control: 'c1' } } } };
    const a = JSON.stringify([social, g]);
    buildReportModel(social, g, { metrics: { t: { sent: 1 } } });
    assert.equal(JSON.stringify([social, g]), a);
});
