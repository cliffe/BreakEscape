// Reusability options for the report, the landing page and the episode flip: each new field
// leaves today's output unchanged when unset and applies when set.
// Run with: bundle exec node --test test/js/social-reusability-options.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-reuse-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/engagement-report/report-model.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/landing-page-builder/landing-page-render.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const R = await load('minigames/engagement-report/report-model.js');
const L = await load('minigames/landing-page-builder/landing-page-model.js');

// ── report: per-call globals ─────────────────────────────────────────────────
const call = (extra = {}) => ({ callId: 'c1', character: 'ruth', ...extra });
const withCall = (c, g) => R.buildReportModel({ pretextNpcs: [c], engagement: { report: {} } }, g, {}).results.calls[0];

test('report call row: the lab globals still decide when the engine outcome is absent', () => {
    const row = withCall(call(), { pretext_call_done: true, ruth_reported: true });
    assert.equal(row.done, true);
    assert.equal(row.reported, true);
    const none = withCall(call(), {});
    assert.equal(none.done, false);
    assert.equal(none.reported, false);
});

test('report call row: the per-call outcome global stands in when no lab global is set', () => {
    assert.equal(withCall(call(), { pretext_c1_outcome: 'got_it' }).done, true);
    assert.equal(withCall(call(), { pretext_c1_outcome: 'reported' }).reported, true);
    assert.equal(withCall(call(), { pretext_c1_outcome: 'walked_away' }).done, false);
});

test('report call row: doneGlobal and reportedGlobal win over everything', () => {
    const c = call({ doneGlobal: 'my_done', reportedGlobal: 'my_rep' });
    const row = withCall(c, { my_done: true, my_rep: true, pretext_call_done: false, pretext_c1_outcome: 'walked_away' });
    assert.equal(row.done, true);
    assert.equal(row.reported, true);
    const off = withCall(c, { pretext_call_done: true, ruth_reported: true, pretext_c1_outcome: 'got_it' });
    assert.equal(off.done, false);
    assert.equal(off.reported, false);
});

// ── report: strings, panels, results step ────────────────────────────────────
const model = (report) => R.buildReportModel({ engagement: { report } }, {}, {});

test('report strings default to the lab wording and override per key', () => {
    const d = model({}).strings;
    assert.equal(d.resultsHeading, 'Campaign results');
    assert.equal(d.pretextCall, 'Pretext call');
    assert.equal(d.blamingStaff, 'Blaming staff:');
    assert.equal(d.noLandingPage, 'No landing page in this engagement.');
    assert.ok(d.failedSendNote.includes('a member of staff to report you'));
    assert.ok(d.findingsHint.includes('processes, not people'));
    const o = model({ strings: { resultsHeading: 'Outcome', pretextCall: '', bogus: 'x' } }).strings;
    assert.equal(o.resultsHeading, 'Outcome');
    assert.equal(o.pretextCall, 'Pretext call', 'an empty override is ignored');
    assert.equal(o.bogus, undefined);
});

test('report.results picks the panels; default is all three', () => {
    assert.deepEqual(model({}).panels, ['mail', 'pages', 'calls']);
    assert.deepEqual(model({ results: ['calls', 'mail'] }).panels, ['mail', 'calls']);
    assert.deepEqual(model({ results: [] }).panels, []);
});

test('the results step is the one the confirm items are bound to, else "results"', () => {
    assert.equal(model({}).resultsStepId, 'results');
    const items = [{ kind: 'confirm', id: 'ok', text: 'Done', step: 'read_out' }];
    assert.equal(model({ items, steps: [{ id: 'read_out' }] }).resultsStepId, 'read_out');
});

test('logoSrc: the default path stays, brand.logo overrides it', async () => {
    globalThis.document ??= { createElement: () => ({}) };
    const { logoSrc } = await load('minigames/landing-page-builder/landing-page-render.js');
    assert.equal(logoSrc('quayholt'), '/break_escape/assets/social/landing/logo-quayholt.png');
    assert.equal(logoSrc('quayholt', undefined, {}), '/break_escape/assets/social/landing/logo-quayholt.png');
    assert.equal(logoSrc('quayholt', undefined, { logo: 'assets/x/q.png' }), '/break_escape/assets/x/q.png');
    assert.equal(logoSrc('quayholt', undefined, { logo: '/custom/q.png' }), '/custom/q.png');
});

// ── landing: field labels, strings ───────────────────────────────────────────
test('field labels: one map, pageDef.fieldLabels overrides, unknown ids fall through', () => {
    assert.equal(L.fieldLabel('email', {}), 'Email');
    assert.equal(L.fieldLabel('ni_number', null), 'National insurance number');
    assert.equal(L.fieldLabel('email', { fieldLabels: { email: 'Work email' } }), 'Work email');
    assert.equal(L.fieldLabel('password', { fieldLabels: { email: 'Work email' } }), 'Password');
    assert.equal(L.fieldLabel('custom', {}), 'custom');
});

test('the episode flip keeps its longer labels and honours fieldLabels', () => {
    assert.equal(L.fieldLabel('email', {}, { flip: true }), 'Email address');
    assert.equal(L.fieldLabel('ni_number', {}, { flip: true }), 'National Insurance number');
    assert.equal(L.fieldLabel('email', { fieldLabels: { email: 'Login' } }, { flip: true }), 'Login');
});

test('builder chrome strings default to today’s wording and override via pageDef.strings', () => {
    assert.equal(L.pageString({}, 'attachLabel'), 'Attach to email');
    assert.equal(L.pageString({}, 'attachAnywayLabel'), 'Attach anyway');
    assert.equal(L.pageString({}, 'lockedDomainNote'), 'You don’t own this. Only the company does.');
    assert.ok(L.pageString({}, 'blockBadSuffix').startsWith('This address is not allowed in the lab.'));
    assert.ok(L.pageString({}, 'padlockNote').startsWith('A padlock means the connection is private'));
    assert.ok(L.pageString({}, 'pretextNote').startsWith('The page has to match the story'));
    assert.equal(L.pageString({ strings: { attachLabel: 'Hook it up' } }, 'attachLabel'), 'Hook it up');
    assert.equal(L.pageString({ strings: { attachLabel: '' } }, 'attachLabel'), 'Attach to email');
});
