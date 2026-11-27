// outcome.messageGlobals (triage-starter.js): one boolean global per listed message, true when the
// learner's verdict counts as caught by the scorer (Report, Delete or Verify), else false.
//  - each verdict type: report, delete, verify -> true; trust and no answer -> false;
//  - the writes go before <prefix>complete in the same deferEmit batch, and the events too;
//  - best round: a later, lower round never flips a true to false (as pass is never cleared);
//  - a set without the option writes exactly what it wrote before;
//  - reopen and the Gate B D2 re-emit send the true globals before complete;
//  - the real runner on the EC1 defend path (real starter) sets the global on the first save.
// Run with: node --test test/js/triage-message-globals.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'triage-message-globals-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('minigames/inbox-triage/triage-scoring.js', 'triage-scoring.mjs');
copy('systems/triage-starter.js', 'triage-starter.mjs', s => s
    .replace("'./global-writer.js'", "'./global-writer.mjs'")
    .replace("'../minigames/inbox-triage/triage-scoring.js'", "'./triage-scoring.mjs'"));

globalThis.window = {};
const starter = await import(pathToFileURL(join(dir, 'triage-starter.mjs')).href);
const scoring = await import(pathToFileURL(join(dir, 'triage-scoring.mjs')).href);
const { writeGlobal } = await import(pathToFileURL(join(dir, 'global-writer.mjs')).href);
const { persistTriageResult, reemitTriageDone, reemitTriageComplete, messageGlobalPairs, resolvePrefix, _resetTriageStarterForTests } = starter;

const P = 'ep_defend_';
const mkSet = (outcomeExtra = {}) => ({
    id: 's', stage: 'mission', scoringProfile: 'awareness',
    outcome: { setGlobalPrefix: P, passPercent: 0, ...outcomeExtra },
    messages: []
});
const withMg = () => mkSet({ messageGlobals: { fraud: 'kit_key_caught', other: 'kit_other_caught' } });
const ctxFor = (set, extra = {}) => ({ set, stage: 'mission', prefix: resolvePrefix(set, 'mission'), ...extra });
const ans = (id, verdict) => ({ id, verdict, isPhish: true });
const result = (answers, percent = 50) => ({ percent, reportRate: 0.5, answers });

function env(globals = {}) {
    _resetTriageStarterForTests();
    const g = { kit_key_caught: false, kit_other_caught: false, ...globals };
    const events = [];
    const log = [];
    const emitGlobals = (evs) => { for (const e of evs) events.push(e.data.name); };
    const write = (name, value, opts) => { log.push([name, value, opts?.deferEmit === true]); return writeGlobal(name, value, opts); };
    Object.assign(globalThis.window, { gameState: { globalVariables: g }, objectivesManager: { taskIndex: {} } });
    const deps = { globals: g, stateSync: { syncConfirmed: async () => true }, write, emitGlobals, emit: () => {} };
    return { g, events, log, deps };
}
const save = (e, set, res, extra) => persistTriageResult(res, ctxFor(set, extra), e.deps);

test('isCaughtVerdict is the scorer\'s own test: report, delete, verify', () => {
    assert.ok(scoring.isCaughtVerdict('report') === true);
    assert.ok(scoring.isCaughtVerdict('delete') === true);
    assert.ok(scoring.isCaughtVerdict('verify') === true);
    assert.ok(scoring.isCaughtVerdict('trust') === false);
    assert.ok(scoring.isCaughtVerdict(null) === false);
    // and scoreTriage agrees: the same verdicts are phishCaught
    for (const v of ['report', 'delete', 'verify', 'trust']) {
        const s = scoring.scoreTriage({ messages: [{ id: 'm', truth: { isPhish: true, flags: [] } }], answers: [{ id: 'm', verdict: v, flags: [] }] });
        assert.ok((s.phishCaught === 1) === scoring.isCaughtVerdict(v), v);
    }
});

for (const [verdict, expected] of [['report', true], ['delete', true], ['verify', true], ['trust', false]]) {
    test(`messageGlobals: a ${verdict} on the listed phish writes ${expected}`, async () => {
        const e = env();
        await save(e, withMg(), result([ans('fraud', verdict), ans('other', 'trust')]));
        assert.ok(e.g.kit_key_caught === expected);
        assert.ok(e.g.kit_other_caught === false);
    });
}

test('messageGlobals: a listed message with no answer writes false', async () => {
    const e = env();
    await save(e, withMg(), result([ans('fraud', 'report')]));
    assert.ok(e.g.kit_key_caught === true);
    assert.ok(e.g.kit_other_caught === false);
    const e2 = env();
    await save(e2, withMg(), { percent: 10, reportRate: 0 });
    assert.ok(e2.g.kit_key_caught === false);
});

test('messageGlobals: written with deferEmit before complete, and emitted before complete', async () => {
    const e = env();
    await save(e, withMg(), result([ans('fraud', 'report'), ans('other', 'trust')]));
    const names = e.log.map(l => l[0]);
    assert.ok(JSON.stringify(names) === JSON.stringify([`${P}percent`, `${P}reportRate`, 'kit_key_caught', 'kit_other_caught', `${P}complete`]));
    assert.ok(e.log.every(l => l[2] === true));
    // only the changed one has an event (other stays false), and it comes before complete
    assert.ok(JSON.stringify(e.events) === JSON.stringify([`${P}percent`, `${P}reportRate`, 'kit_key_caught', `${P}complete`]));
});

test('messageGlobals: a later, lower round never flips true to false; a later catch flips false to true', async () => {
    const e = env();
    const set = withMg();
    await save(e, set, result([ans('fraud', 'report'), ans('other', 'trust')], 80));
    assert.ok(e.g.kit_key_caught === true);
    await save(e, set, result([ans('fraud', 'trust'), ans('other', 'trust')], 20));
    assert.ok(e.g.kit_key_caught === true, 'kept');
    assert.ok(e.g[`${P}percent`] === 80);
    await save(e, set, result([ans('fraud', 'trust'), ans('other', 'delete')], 30));
    assert.ok(e.g.kit_other_caught === true, 'a later round can set a false to true');
    assert.ok(e.g.kit_key_caught === true);
});

test('messageGlobals: one boolean per listed message, no growth on a re-save of the same result', async () => {
    const e = env();
    const set = withMg();
    const res = result([ans('fraud', 'report')]);
    await save(e, set, res);
    const n = e.log.length;
    await save(e, set, res);
    assert.ok(e.log.length === n, 'the same result object saves once');
    await save(e, set, result([ans('fraud', 'report')]));
    const keys = Object.keys(e.g).filter(k => k.startsWith('kit_'));
    assert.ok(JSON.stringify(keys.sort()) === JSON.stringify(['kit_key_caught', 'kit_other_caught']));
});

test('no option: identical writes and events to a set without messageGlobals', async () => {
    const e = env();
    await save(e, mkSet(), result([ans('fraud', 'report')]));
    assert.ok(JSON.stringify(e.log.map(l => l[0])) === JSON.stringify([`${P}percent`, `${P}reportRate`, `${P}complete`]));
    assert.ok(JSON.stringify(e.events) === JSON.stringify([`${P}percent`, `${P}reportRate`, `${P}complete`]));
    assert.ok(e.g.kit_key_caught === false, 'untouched');
    for (const bad of [null, [], 'x', { a: 1 }, { '': 'x' }]) {
        assert.ok(messageGlobalPairs(mkSet({ messageGlobals: bad })).length === 0, JSON.stringify(bad));
    }
});

test('reopen: a conclusion task still open re-emits the true globals before complete', async () => {
    const e = env({ [`${P}complete`]: true, [`${P}percent`]: 80, kit_key_caught: true });
    const set = withMg();
    const out = await reemitTriageDone(ctxFor(set, { conclusionTaskId: 't' }), e.deps);
    assert.ok(out.confirmed === true);
    assert.ok(JSON.stringify(e.events) === JSON.stringify(['kit_key_caught', `${P}complete`]));
    assert.ok(e.g.kit_key_caught === true, 'the value survives the reopen');
});

test('Gate B D2 re-emit: reemitTriageComplete sends true message globals first when given the set', async () => {
    const e = env({ [`${P}complete`]: true, kit_key_caught: true });
    const out = await reemitTriageComplete({ prefix: P, set: withMg() }, e.deps);
    assert.ok(out.confirmed === true);
    assert.ok(JSON.stringify(e.events) === JSON.stringify(['kit_key_caught', `${P}complete`]));
    // without the set (or without the option) only complete goes, as before
    const e2 = env({ [`${P}complete`]: true, kit_key_caught: true });
    await reemitTriageComplete({ prefix: P }, e2.deps);
    assert.ok(JSON.stringify(e2.events) === JSON.stringify([`${P}complete`]));
});

test('an unconfirmed save holds the message events for the next confirmed save', async () => {
    const e = env();
    e.deps.stateSync = { syncConfirmed: async () => false };
    const set = withMg();
    await save(e, set, result([ans('fraud', 'report')]));
    assert.ok(e.events.length === 0);
    assert.ok(e.g.kit_key_caught === true, 'in gameState for the next sync');
    e.deps.stateSync = { syncConfirmed: async () => true };
    await save(e, set, result([ans('fraud', 'report')]));
    assert.ok(e.events.includes('kit_key_caught'));
    assert.ok(e.events.indexOf('kit_key_caught') < e.events.indexOf(`${P}complete`));
});
