// Gap tests for systems/awareness-measure.js: first-answer-wins under repeats, restore of saved
// state in odd shapes, clamping of numbers, truncation of ids, xAPI output on malformed blocks.
// Run with: bin/test-js test/js/social-gap-awareness-measure.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-awareness-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/awareness-measure.js', 'awareness-measure.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
const M = await import(pathToFileURL(join(dir, 'awareness-measure.mjs')).href);

const result = (over = {}) => ({ setId: 's1', percent: 50, reportRate: 0.5, answers: [{ id: 'm1', verdict: 'report', flags: ['a'], score: 50, ms: 1000 }], ...over });
const fresh = (start = {}) => {
    const globals = { ...start };
    const writes = [];
    return { globals, writes, deps: { getGlobals: () => globals, writeGlobal: (n, v) => { writes.push(n); globals[n] = v; } } };
};

test('buildBlock of null/undefined/array/string result gives an empty, well-formed block', () => {
    for (const r of [null, undefined, [], 'x', 5]) {
        const b = M.buildBlock(r, { setId: 'z' });
        assert.equal(b.key, 'episode:z');
        assert.deepEqual(b.items, []);
        assert.equal(b.percent, 0);
        assert.equal(b.reportRate, 0);
    }
});

test('setId comes from ctx first, then the result; both missing gives key "episode:"', () => {
    assert.equal(M.buildBlock(result(), { setId: 'ctx' }).setId, 'ctx');
    assert.equal(M.buildBlock(result(), {}).setId, 's1');
    assert.equal(M.buildBlock({}, {}).key, 'episode:');
    assert.equal(M.buildBlock(result(), { setId: '   ' }).setId, 's1');
});

test('unknown stage and variant fall back to episode and full', () => {
    const b = M.buildBlock(result(), { stage: 'mission', variant: 'weird' });
    assert.equal(b.stage, 'episode');
    assert.equal(b.variant, 'full');
});

test('percent and score clamp to 0..100, reportRate to 0..1, NaN to 0, ms never negative', () => {
    const b = M.buildBlock(result({
        percent: 250, reportRate: 9,
        answers: [{ id: 'a', verdict: 'trust', score: -30, ms: -9 }, { id: 'b', verdict: 'trust', score: 1e9, ms: NaN }, { id: 'c', verdict: 'trust', score: 'x', ms: Infinity }],
    }));
    assert.equal(b.percent, 100);
    assert.equal(b.reportRate, 1);
    assert.deepEqual(b.items.map((i) => i.score), [0, 100, 0]);
    assert.deepEqual(b.items.map((i) => i.ms), [0, 0, 0]);
    assert.equal(M.buildBlock(result({ percent: -1, reportRate: -1 })).percent, 0);
    assert.equal(M.buildBlock(result({ percent: NaN })).percent, 0);
});

test('a percent of 67.5 rounds to 68 (halves up through Math.round)', () => {
    assert.equal(M.buildBlock(result({ percent: 67.5 })).percent, 68);
});

test('chips are capped at 12, trimmed, de-blanked, and non-strings dropped', () => {
    const flags = Array.from({ length: 20 }, (_, i) => `f${i}`);
    const b = M.buildBlock(result({ answers: [{ id: 'm', verdict: 'report', flags }] }));
    assert.equal(b.items[0].chips.length, 12);
    const b2 = M.buildBlock(result({ answers: [{ id: 'm', verdict: 'report', flags: ['  a ', '', null, 7, {}, 'b'] }] }));
    assert.deepEqual(b2.items[0].chips, ['a', 'b']);
});

test('chips: duplicates are kept (no de-duplication in the store)', () => {
    const b = M.buildBlock(result({ answers: [{ id: 'm', verdict: 'report', flags: ['a', 'a'] }] }));
    assert.deepEqual(b.items[0].chips, ['a', 'a']);
});

test('ids longer than 64 characters are cut, so free text cannot leak through an id field', () => {
    const long = 'x'.repeat(500);
    const b = M.buildBlock(result({ answers: [{ id: long, verdict: long, action: long, flags: [long] }] }), { setId: long, form: long, episodeId: long });
    assert.equal(b.setId.length, 64);
    assert.equal(b.form.length, 64);
    assert.equal(b.episodeId.length, 64);
    assert.equal(b.items[0].itemId.length, 64);
    assert.equal(b.items[0].chips[0].length, 64);
});

test('answers that are not objects are filtered out; non-array answers give no items', () => {
    const b = M.buildBlock(result({ answers: [null, 'x', 4, [], { id: 'ok', verdict: 'trust' }] }));
    assert.equal(b.items.length, 1);
    assert.equal(b.items[0].itemId, 'ok');
    assert.deepEqual(M.buildBlock(result({ answers: 'nope' })).items, []);
});

test('extra fields on the answers (free text) are not copied into the block', () => {
    const b = M.buildBlock(result({ answers: [{ id: 'm', verdict: 'report', note: 'my secret reasoning', freeText: 'hi' }] }));
    assert.equal(JSON.stringify(b).includes('secret'), false);
    assert.deepEqual(Object.keys(b.items[0]).sort(), ['action', 'chips', 'itemId', 'ms', 'score', 'verdict']);
});

test('timestamp: Date, number and string are honoured; garbage gives the epoch, never throws', () => {
    assert.equal(M.buildBlock(result(), { now: new Date(0) }).at, '1970-01-01T00:00:00.000Z');
    assert.equal(M.buildBlock(result(), { now: '2024-01-02T03:04:05Z' }).at, '2024-01-02T03:04:05.000Z');
    assert.equal(M.buildBlock(result(), { now: 'not a date' }).at, '1970-01-01T00:00:00.000Z');
    assert.equal(M.buildBlock(result(), { now: NaN }).at, '1970-01-01T00:00:00.000Z');
    assert.match(M.buildBlock(result(), {}).at, /^\d{4}-\d\d-\d\dT/);
});

test('readBlocks: JSON string, wrapped global, bare array; corrupt JSON and wrong shapes give []', () => {
    const blk = M.buildBlock(result(), { setId: 's' });
    assert.equal(M.readBlocks({ [M.RECORDS_GLOBAL]: JSON.stringify([blk]) }).length, 1);
    assert.equal(M.readBlocks({ [M.RECORDS_GLOBAL]: [blk] }).length, 1);
    assert.equal(M.readBlocks([blk]).length, 1);
    assert.equal(M.readBlocks(JSON.stringify([blk])).length, 1);
    for (const bad of [null, undefined, 5, '{not json', '"str"', '{"a":1}', { [M.RECORDS_GLOBAL]: 'garbage' }, { [M.RECORDS_GLOBAL]: { 0: blk } }, {}]) {
        assert.deepEqual(M.readBlocks(bad), [], JSON.stringify(bad));
    }
});

test('readBlocks drops entries with wrong version or no key but keeps the good ones', () => {
    const good = M.buildBlock(result(), { setId: 'g' });
    const out = M.readBlocks({ [M.RECORDS_GLOBAL]: [good, { v: 2, key: 'x' }, { v: 1 }, { v: 1, key: 5 }, null, 'x', good] });
    assert.equal(out.length, 2);
});

test('restore: a saved JSON-string global still blocks a repeat and the append keeps the old block', () => {
    const old = M.buildBlock(result(), { setId: 's1', stage: 'pre' });
    const { deps, globals } = fresh({ [M.RECORDS_GLOBAL]: JSON.stringify([old]) });
    assert.deepEqual(M.recordTriageResult(result(), { setId: 's1', stage: 'pre' }, deps), { written: false, reason: 'already-recorded' });
    assert.deepEqual(M.recordTriageResult(result(), { setId: 's1', stage: 'post' }, deps), { written: true });
    assert.equal(globals[M.RECORDS_GLOBAL].length, 2);
    assert.equal(globals[M.RECORDS_GLOBAL][0].key, 'pre:s1');
});

test('a corrupt saved global is treated as empty, and the next record overwrites it with a clean array', () => {
    const { deps, globals } = fresh({ [M.RECORDS_GLOBAL]: '{{corrupt' });
    assert.deepEqual(M.recordTriageResult(result(), { setId: 's1' }, deps), { written: true });
    assert.ok(Array.isArray(globals[M.RECORDS_GLOBAL]));
    assert.equal(globals[M.RECORDS_GLOBAL].length, 1);
});

test('the same round recorded twice in a row writes exactly once', () => {
    const { deps, writes } = fresh();
    M.recordTriageResult(result(), { setId: 's1' }, deps);
    M.recordTriageResult(result(), { setId: 's1' }, deps);
    M.recordTriageResult(result({ percent: 99 }), { setId: 's1' }, deps);
    assert.equal(writes.length, 1);
});

test('first answer wins: a second, better attempt does not replace the percent', () => {
    const { deps, globals } = fresh();
    M.recordTriageResult(result({ percent: 40 }), { setId: 's1' }, deps);
    M.recordTriageResult(result({ percent: 100 }), { setId: 's1' }, deps);
    assert.equal(globals[M.RECORDS_GLOBAL][0].percent, 40);
});

test('result guards: aborted wins over reopened; null/array/string results are "aborted"', () => {
    const { deps, writes } = fresh();
    assert.equal(M.recordTriageResult({ aborted: true, reopened: true, answers: [] }, {}, deps).reason, 'aborted');
    for (const r of [null, undefined, [], 'x']) assert.equal(M.recordTriageResult(r, {}, deps).reason, 'aborted');
    assert.equal(M.recordTriageResult({ reopened: true, answers: [] }, {}, deps).reason, 'read-only');
    assert.equal(M.recordTriageResult({ percent: 1 }, {}, deps).reason, 'read-only'); // no answers array
    assert.equal(writes.length, 0);
});

test('aborted:false (not === true) is still recorded', () => {
    const { deps, writes } = fresh();
    assert.equal(M.recordTriageResult(result({ aborted: false }), { setId: 'q' }, deps).written, true);
    assert.equal(writes.length, 1);
});

test('an empty answers array is recorded as a round with no items', () => {
    const { deps, globals } = fresh();
    assert.equal(M.recordTriageResult(result({ answers: [] }), { setId: 'e' }, deps).written, true);
    assert.deepEqual(globals[M.RECORDS_GLOBAL][0].items, []);
});

test('two rounds with an empty setId collide on the key "episode:" (second is refused)', () => {
    const { deps } = fresh();
    const r1 = M.recordTriageResult({ percent: 1, answers: [] }, {}, deps);
    const r2 = M.recordTriageResult({ percent: 2, answers: [] }, {}, deps);
    assert.equal(r1.written, true);
    assert.equal(r2.reason, 'already-recorded');
});

test('with no deps and no window.gameState the default getGlobals does not throw', () => {
    const saved = globalThis.window;
    globalThis.window = {};
    try {
        // the default writer is the real one; give it a harmless stub through deps.writeGlobal only
        const writes = [];
        const r = M.recordTriageResult(result(), { setId: 'nodeps' }, { writeGlobal: (n, v) => writes.push([n, v]) });
        assert.equal(r.written, true);
        assert.equal(writes.length, 1);
    } finally { globalThis.window = saved; }
});

test('toXapi on non-objects returns []; on a block with no items returns just the round statement', () => {
    for (const b of [null, undefined, 'x', 5, []]) assert.deepEqual(M.toXapi(b, {}), []);
    const s = M.toXapi({ setId: 'x', percent: 0, reportRate: 0, at: 't', items: undefined }, { name: 'a' });
    assert.equal(s.length, 1);
    assert.equal(s[0].verb.display['en-GB'], 'completed');
});

test('toXapi encodes ids with URL-unsafe characters and formats the duration to three decimals', () => {
    const b = M.buildBlock(result({ answers: [{ id: 'a b/c', verdict: 'report', score: 80, ms: 1234 }] }), { setId: 'set/1 x' });
    const s = M.toXapi(b, { mbox: 'mailto:x@y' });
    assert.match(s[0].object.id, /set%2F1%20x\/items\/a%20b%2Fc$/);
    assert.equal(s[0].result.duration, 'PT1.234S');
    assert.equal(s[1].result.score.scaled, 0.5);
    assert.deepEqual(s[0].actor, { mbox: 'mailto:x@y' });
});

test('toXapi response prefers the action over the verdict, and carries the chips extension', () => {
    const b = M.buildBlock(result({ answers: [{ id: 'c', verdict: 'verify', action: 'ring_back', flags: ['k'], score: 100, ms: 0 }] }));
    const s = M.toXapi(b, {});
    assert.equal(s[0].result.response, 'ring_back');
    assert.deepEqual(Object.values(s[0].result.extensions).flat().includes('k'), true);
});

test('toXapi with a missing setId does not throw and all statements share the block timestamp', () => {
    const b = M.buildBlock(result(), { now: 1700000000000 });
    b.setId = undefined;
    const s = M.toXapi(b, {});
    assert.ok(s.every((st) => st.timestamp === b.at));
});
