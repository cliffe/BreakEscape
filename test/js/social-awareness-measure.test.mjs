// Awareness measurement store, systems/awareness-measure.js (11 N4; packet P7-C).
// Run with: bundle exec node --test test/js/social-awareness-measure.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-awareness-measure-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/awareness-measure.js', 'awareness-measure.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
const M = await import(pathToFileURL(join(dir, 'awareness-measure.mjs')).href);

// The 05 worked example (analyst round, 4 messages, 68%).
const worked = () => ({
    setId: 'demo_4', stage: 'mission', scoringProfile: 'analyst', percent: 68, reportRate: 0.5,
    answers: [
        { id: 'm1_it', verdict: 'trust', flags: [], score: 100, ms: 9000 },
        { id: 'm2_payroll', verdict: 'report', flags: ['senderTrust', 'linkCredible', 'attachmentPlausible'], score: 73, ms: 14200 },
        { id: 'm3_parcel', verdict: 'delete', flags: ['senderTrust', 'addressedTo'], score: 57, ms: 8000 },
        { id: 'm4_jed', verdict: 'report', flags: ['header'], score: 40, ms: 6000 }
    ]
});
const ctx = (over = {}) => ({ setId: 'demo_4', form: 'a', stage: 'pre', episodeId: '', variant: 'full', now: 1700000000000, ...over });
const fresh = () => {
    const globals = {};
    const writes = [];
    const deps = { getGlobals: () => globals, writeGlobal: (n, v) => { writes.push(n); globals[n] = v; } };
    return { globals, writes, deps };
};

test('a block from the 05 worked example', () => {
    const b = M.buildBlock(worked(), ctx());
    assert.equal(b.v, 1);
    assert.equal(b.key, 'pre:demo_4');
    assert.equal(b.percent, 68);
    assert.equal(b.reportRate, 0.5);
    assert.equal(b.items.length, 4);
    assert.deepEqual(b.items[1], { itemId: 'm2_payroll', verdict: 'report', action: '', chips: ['senderTrust', 'linkCredible', 'attachmentPlausible'], score: 73, ms: 14200 });
    assert.equal(b.at, '2023-11-14T22:13:20.000Z');
});

test('the stage, form and variant are carried', () => {
    const b = M.buildBlock(worked(), ctx({ stage: 'episode', variant: 'defendOnly', episodeId: 'e1', form: '' }));
    assert.equal(b.stage, 'episode');
    assert.equal(b.variant, 'defendOnly');
    assert.equal(b.episodeId, 'e1');
    assert.equal(b.key, 'episode:demo_4');
    assert.equal(M.buildBlock(worked(), ctx({ stage: 'post', form: 'b' })).form, 'b');
});

test('a call item keeps its action', () => {
    const r = { setId: 's', percent: 100, reportRate: 0, answers: [{ id: 'c1', verdict: 'verify', action: 'verify_callback', flags: [], score: 100, ms: 1 }] };
    assert.equal(M.buildBlock(r, ctx()).items[0].action, 'verify_callback');
});

test('a first round writes one block under the global', () => {
    const { globals, writes, deps } = fresh();
    const out = M.recordTriageResult(worked(), ctx(), deps);
    assert.deepEqual(out, { written: true });
    assert.deepEqual(writes, [M.RECORDS_GLOBAL]);
    assert.equal(M.readBlocks(globals).length, 1);
});

test('a second round on the same key writes nothing', () => {
    const { globals, writes, deps } = fresh();
    M.recordTriageResult(worked(), ctx(), deps);
    const again = worked(); again.percent = 100;
    const out = M.recordTriageResult(again, ctx(), deps);
    assert.deepEqual(out, { written: false, reason: 'already-recorded' });
    assert.equal(writes.length, 1);
    assert.equal(M.readBlocks(globals)[0].percent, 68);
});

test('a different stage on the same set is a new key and appends', () => {
    const { globals, deps } = fresh();
    M.recordTriageResult(worked(), ctx(), deps);
    M.recordTriageResult(worked(), ctx({ stage: 'post' }), deps);
    assert.deepEqual(M.readBlocks(globals).map(b => b.key), ['pre:demo_4', 'post:demo_4']);
});

test('a read-only result writes nothing', () => {
    const { writes, deps } = fresh();
    const out = M.recordTriageResult({ setId: 'demo_4', stage: 'pre', reopened: true, percent: 68, reportRate: 0.5 }, ctx(), deps);
    assert.deepEqual(out, { written: false, reason: 'read-only' });
    assert.equal(writes.length, 0);
});

test('an aborted round writes nothing', () => {
    const { writes, deps } = fresh();
    assert.deepEqual(M.recordTriageResult({ aborted: true }, ctx(), deps), { written: false, reason: 'aborted' });
    assert.deepEqual(M.recordTriageResult(null, ctx(), deps), { written: false, reason: 'aborted' });
    assert.equal(writes.length, 0);
});

test('no field holds free text: only ids, enums, numbers and the timestamp', () => {
    const r = worked();
    r.answers[0].note = 'my own words';
    r.answers[0].flags = ['senderTrust', { text: 'typed' }, 42];
    r.headline = 'Getting there: free text';
    const b = M.buildBlock(r, ctx());
    const text = JSON.stringify(b);
    assert.ok(!text.includes('my own words'));
    assert.ok(!text.includes('Getting there'));
    assert.ok(!text.includes('typed'));
    assert.deepEqual(Object.keys(b.items[0]).sort(), ['action', 'chips', 'itemId', 'ms', 'score', 'verdict']);
    assert.deepEqual(b.items[0].chips, ['senderTrust']);
});

test('a 10-item block serialises under 4 KB', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
        id: `triage_pre_item_${i}_with_a_long_authored_id`, verdict: 'report',
        flags: ['senderTrust', 'linkCredible', 'urgencyCalibrated', 'pretextRelevant', 'attachmentPlausible'],
        score: 87, ms: 123456
    }));
    const b = M.buildBlock({ setId: 'finance_form_a', percent: 87, reportRate: 1, answers }, ctx({ setId: 'finance_form_a' }));
    assert.ok(JSON.stringify(b).length < 4096, `${JSON.stringify(b).length} bytes`);
});

test('readBlocks is pure and tolerant', () => {
    assert.deepEqual(M.readBlocks({}), []);
    assert.deepEqual(M.readBlocks(null), []);
    assert.deepEqual(M.readBlocks({ [M.RECORDS_GLOBAL]: 'not json' }), []);
    const b = M.buildBlock(worked(), ctx());
    assert.deepEqual(M.readBlocks({ [M.RECORDS_GLOBAL]: JSON.stringify([b, { junk: 1 }]) }), [b]);
});

test('toXapi gives one statement per item plus one for the round', () => {
    const b = M.buildBlock(worked(), ctx());
    const actor = { objectType: 'Agent', account: { homePage: 'https://example.test', name: 'learner-1' } };
    const s = M.toXapi(b, actor);
    assert.equal(s.length, 5);
    assert.ok(s.every(x => x.actor === actor && x.timestamp === b.at));
    assert.equal(s.filter(x => x.verb.id.endsWith('/answered')).length, 4);
    assert.equal(s.filter(x => x.verb.id.endsWith('/completed')).length, 1);
    assert.equal(s[4].result.score.scaled, 0.68);
    assert.equal(s[1].result.duration, 'PT14.200S');
});

test('the real writer path stores the array in gameState', () => {
    window.gameState.globalVariables = {};
    assert.deepEqual(M.recordTriageResult(worked(), ctx()), { written: true });
    assert.equal(M.readBlocks(window.gameState.globalVariables).length, 1);
    assert.deepEqual(M.recordTriageResult(worked(), ctx()), { written: false, reason: 'already-recorded' });
});
