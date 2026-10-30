// The inbox triage starter, systems/triage-starter.js (05 "Bridging", N6; 00 S3 and
// section 11 "Sync, then emit", "Reopen re-emits"; packet P3-C):
//  - the four result globals are written with deferEmit, and nothing is emitted until
//    stateSync.syncConfirmed() resolves true;
//  - then only the changed names are emitted (done last), then the done event;
//  - on false nothing is emitted, and the held names go out with the next confirmed save;
//  - <prefix>pass is never cleared by a lower round;
//  - a reopen with <prefix>done set and the conclusion task incomplete re-emits once;
//  - with the real StateSync: a blocked sync shows the notice and emits after it clears;
//    a 403 stops at once and emits nothing.
// Run with: bundle exec node --test test/js/social-triage-starter.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in social-global-writer.test.mjs.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-triage-starter-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('systems/global-writer.js', 'global-writer.mjs');
copy('minigames/inbox-triage/triage-scoring.js', 'triage-scoring.mjs');
copy('systems/triage-starter.js', 'triage-starter.mjs', s => s
    .replace("'./global-writer.js'", "'./global-writer.mjs'")
    .replace("'../minigames/inbox-triage/triage-scoring.js'", "'./triage-scoring.mjs'"));
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const starter = await import(pathToFileURL(join(dir, 'triage-starter.mjs')).href);
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const { writeGlobal: starterWriter } = await import(pathToFileURL(join(dir, 'global-writer.mjs')).href);
const {
    startInboxTriageMinigame, persistTriageResult, reemitTriageDone, resolvePrefix,
    TRIAGE_DONE_EVENT, _resetTriageStarterForTests
} = starter;

const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const realConsole = globalThis.console;

// ---- fixtures ---------------------------------------------------------------

const labSet = {
    id: 'lab_triage', stage: 'mission', scoringProfile: 'analyst', title: 'Blue Team inbox',
    outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
    messages: []
};
const preSet = {
    id: 'pre_a', stage: 'pre', scoringProfile: 'awareness',
    outcome: { setGlobalPrefix: 'triage_{stage}_', passPercent: 0 },
    bands: [{ min: 85, headline: 'Sharp' }, { min: 60, headline: 'Getting there' }, { min: 0, headline: 'Worth practising' }],
    messages: []
};

/** A deferred stand-in for stateSync: each syncConfirmed call waits for settle(). */
function stubSync() {
    const calls = [];
    return {
        calls,
        syncConfirmed(opts = {}) {
            let settle;
            const p = new Promise(r => { settle = r; });
            calls.push({ opts, settle });
            return p;
        },
        settleAll(value) { while (calls.length) calls.shift().settle(value); }
    };
}

/** Fresh window state: globals, an event log, objectives, a framework stub. */
function setup({ globals = {}, tasks = {}, sets = [labSet, preSet] } = {}) {
    _resetTriageStarterForTests();
    const events = [];
    const writes = [];
    const started = [];
    Object.assign(globalThis.window, {
        gameState: { globalVariables: { ...globals } },
        gameScenario: { social: { triageSets: sets } },
        eventDispatcher: { emit: (event, data) => events.push({ event, data }) },
        objectivesManager: { taskIndex: Object.fromEntries(Object.entries(tasks).map(([id, status]) => [id, { taskId: id, status }])) },
        MinigameFramework: {
            mainGameScene: {},
            currentMinigame: null,
            startMinigame(type, _x, params) {
                started.push({ type, params });
                this.currentMinigame = { params, saving: [], setSavingState(s) { this.saving.push(s); } };
            }
        },
        gameAlert: () => {}
    });
    delete globalThis.window.stateSync;
    return { events, writes, started, globals: globalThis.window.gameState.globalVariables };
}

const ctxFor = (set, extra = {}) => ({ set, stage: set.stage, prefix: resolvePrefix(set, set.stage), ...extra });
const names = (events) => events.map(e => e.event);
const tick = () => new Promise(r => setImmediate(r));

// ---- sync, then emit --------------------------------------------------------

test('writes with deferEmit, and emits nothing until syncConfirmed resolves true', async () => {
    const env = setup();
    const sync = stubSync();
    const seenOpts = [];
    const write = (name, value, opts) => {
        seenOpts.push({ name, deferEmit: opts?.deferEmit === true });
        return starterWriter(name, value, opts);
    };
    const pending = persistTriageResult({ percent: 72, reportRate: 0.5 }, ctxFor(labSet), { stateSync: sync, write });
    await tick();

    assert.deepEqual(seenOpts.map(o => o.name), ['triage_percent', 'triage_reportRate', 'triage_pass', 'triage_done']);
    assert.ok(seenOpts.every(o => o.deferEmit), 'every result write uses deferEmit');
    assert.equal(env.globals.triage_percent, 72, 'gameState holds the value before the sync');
    assert.equal(env.globals.triage_done, true);
    assert.equal(env.events.length, 0, 'nothing emitted while the sync is unconfirmed');
    assert.equal(sync.calls.length, 1);

    sync.settleAll(true);
    const out = await pending;
    assert.equal(out.confirmed, true);
    assert.deepEqual(names(env.events), [
        'global_variable_changed:triage_percent',
        'global_variable_changed:triage_reportRate',
        'global_variable_changed:triage_pass',
        'global_variable_changed:triage_done',
        TRIAGE_DONE_EVENT
    ]);
    assert.deepEqual(env.events[3].data, { name: 'triage_done', value: true });
    assert.equal(env.events[4].data.pass, true);
    assert.equal(env.events[4].data.reemit, false);
});

test('emits only the names whose value changed, then the done event last', async () => {
    const env = setup({ globals: { triage_percent: 68, triage_reportRate: 0, triage_pass: false, triage_done: false } });
    const sync = stubSync();
    const pending = persistTriageResult({ percent: 68, reportRate: 0.5 }, ctxFor(labSet), { stateSync: sync });
    await tick();
    sync.settleAll(true);
    await pending;
    assert.deepEqual(names(env.events), [
        'global_variable_changed:triage_reportRate',
        'global_variable_changed:triage_pass',
        'global_variable_changed:triage_done',
        TRIAGE_DONE_EVENT
    ], 'percent did not change, so it is not emitted');
});

test('on false nothing is emitted; the held names go out with the next confirmed round', async () => {
    const env = setup();
    const sync = stubSync();
    const states = [];
    const first = persistTriageResult({ percent: 72, reportRate: 1 }, ctxFor(labSet), { stateSync: sync, onSaving: s => states.push(s) });
    await tick();
    sync.calls[0].opts.onRetry?.(0);
    sync.settleAll(false);
    const out = await first;
    assert.equal(out.confirmed, false);
    assert.deepEqual(out.emitted, []);
    assert.equal(env.events.length, 0, 'a failed save emits nothing');
    assert.deepEqual(states, ['saving', 'failed']);
    assert.equal(env.globals.triage_pass, true, 'the values stay in gameState for the next sync');

    // "Try again": the same values again are not a change, but the held events go out now
    const second = persistTriageResult({ percent: 72, reportRate: 1 }, ctxFor(labSet), { stateSync: sync });
    await tick();
    sync.settleAll(true);
    await second;
    assert.deepEqual(names(env.events), [
        'global_variable_changed:triage_percent',
        'global_variable_changed:triage_reportRate',
        'global_variable_changed:triage_pass',
        'global_variable_changed:triage_done',
        TRIAGE_DONE_EVENT
    ]);
});

test('_pass is never cleared by a lower round', async () => {
    const env = setup();
    const sync = stubSync();
    const ctx = ctxFor(labSet);
    const a = persistTriageResult({ percent: 72, reportRate: 1 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await a;
    env.events.length = 0;

    const b = persistTriageResult({ percent: 40, reportRate: 0 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await b;
    assert.equal(env.globals.triage_pass, true, 'pass stays true');
    assert.equal(env.globals.triage_percent, 72, 'percent keeps the best round');
    assert.equal(env.globals.triage_reportRate, 1, 'reportRate keeps the best round');
    assert.deepEqual(names(env.events), [TRIAGE_DONE_EVENT],
        'nothing changed, so no global is re-emitted');

    const c = persistTriageResult({ percent: 90, reportRate: 0.5 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await c;
    assert.equal(env.globals.triage_percent, 90, 'a better round replaces it');
    assert.equal(env.globals.triage_reportRate, 0.5);
});

test('a failed first round is replaced by a better later round, and a worse one is kept out', async () => {
    const env = setup();
    const sync = stubSync();
    const ctx = ctxFor(labSet);
    const a = persistTriageResult({ percent: 30, reportRate: 0.2 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await a;
    const b = persistTriageResult({ percent: 20, reportRate: 0.9 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await b;
    assert.equal(env.globals.triage_percent, 30);
    assert.equal(env.globals.triage_reportRate, 0.2, 'reportRate comes from the best round');
    const c = persistTriageResult({ percent: 50, reportRate: 0.4 }, ctx, { stateSync: sync });
    await tick(); sync.settleAll(true); await c;
    assert.equal(env.globals.triage_percent, 50);
    assert.equal(env.globals.triage_reportRate, 0.4);
    assert.equal(env.globals.triage_pass, false);
});

test('a round below passPercent writes pass false and done true', async () => {
    const env = setup();
    const sync = stubSync();
    const p = persistTriageResult({ percent: 59, reportRate: 0 }, ctxFor(labSet), { stateSync: sync });
    await tick(); sync.settleAll(true); await p;
    assert.equal(env.globals.triage_pass, false);
    assert.equal(env.globals.triage_done, true);
});

test('the same result object saves once (persistResult, then onComplete)', async () => {
    const env = setup();
    const sync = stubSync();
    window.stateSync = sync;
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'lab_triage' } } });
    const result = { percent: 80, reportRate: 1 };
    const p = params.persistResult(result);
    params.onComplete(true, result);
    await tick();
    assert.equal(sync.calls.length, 1, 'one save for one round');
    sync.settleAll(true);
    await p;
    assert.equal(names(env.events).filter(n => n === TRIAGE_DONE_EVENT).length, 1);
});

test('an aborted round writes no global and emits nothing', async () => {
    const env = setup();
    window.stateSync = stubSync();
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'lab_triage' } } });
    params.onComplete(false, { aborted: true });
    await tick();
    assert.deepEqual(env.globals, {});
    assert.equal(env.events.length, 0);
    assert.equal(window.stateSync.calls.length, 0);
});

test('the notice goes to the open overlay through setSavingState', async () => {
    setup();
    const sync = stubSync();
    window.stateSync = sync;
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'lab_triage' } } });
    const p = params.persistResult({ percent: 80, reportRate: 1 });
    await tick();
    sync.calls[0].opts.onRetry(0);
    sync.calls[0].opts.onRetry(1);
    sync.settleAll(true);
    await p;
    assert.deepEqual(window.MinigameFramework.currentMinigame.saving, ['saving', 'saved'], 'shown once, then hidden');
});

test('skin: a workstation can ask for awareness through minigameData.skin; the launcher option wins; default unchanged', () => {
    setup();
    const ws = (md) => ({ scenarioData: { minigameData: { triageSetId: 'lab_triage', ...md } } });
    assert.equal(startInboxTriageMinigame(ws({})).skin, null, 'no skin anywhere: none, as before');
    assert.equal(startInboxTriageMinigame(ws({ skin: 'awareness' })).skin, 'awareness');
    assert.equal(startInboxTriageMinigame(ws({ skin: 'neon' })).skin, null, 'an unknown skin is ignored');
    assert.equal(startInboxTriageMinigame(ws({}), { skin: 'awareness' }).skin, 'awareness', 'the launcher option still works');
    assert.equal(startInboxTriageMinigame(ws({ skin: 'awareness' }), { skin: null }).skin, null, 'an explicit launcher null wins');
});

test('the {stage} prefix takes the launch stage', async () => {
    const env = setup();
    window.stateSync = stubSync();
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'pre_a' } } }, { stage: 'post' });
    assert.equal(params.prefix, 'triage_post_');
    assert.equal(params.stage, 'post');
    const p = params.persistResult({ percent: 86, reportRate: 1 });
    await tick(); window.stateSync.settleAll(true); await p;
    assert.equal(env.globals.triage_post_done, true);
    assert.equal(env.globals.triage_post_pass, true, 'passPercent 0: a check set always passes');
});

test('a round of the paired set saves under that set\'s prefix', async () => {
    const trainA = { id: 'train_a', stage: 'training', pairedWith: 'train_b', outcome: { setGlobalPrefix: 'train_a_', passPercent: 60 }, messages: [] };
    const trainB = { id: 'train_b', stage: 'training', pairedWith: 'train_a', outcome: { setGlobalPrefix: 'train_b_', passPercent: 60 }, messages: [] };
    const env = setup({ sets: [trainA, trainB] });
    window.stateSync = stubSync();
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'train_a' } } });
    const p = params.persistResult({ setId: 'train_b', percent: 90, reportRate: 1 });
    await tick(); window.stateSync.settleAll(true); await p;
    assert.equal(env.globals.train_b_done, true);
    assert.equal(env.globals.train_a_done, undefined);
});

// ---- reopen -----------------------------------------------------------------

const doneGlobals = { triage_pre_percent: 86, triage_pre_reportRate: 1, triage_pre_pass: true, triage_pre_done: true };

test('a pre reopen with _done set opens read-only from the stored globals', async () => {
    const env = setup({ globals: doneGlobals });
    window.stateSync = stubSync();
    const params = startInboxTriageMinigame({ scenarioData: { minigameData: { triageSetId: 'pre_a' } } });
    assert.equal(env.started[0].type, 'inbox-triage');
    assert.equal(params.readOnly, true);
    assert.deepEqual(params.storedResult, { percent: 86, reportRate: 1, pass: true, headline: 'Sharp', readOnly: true });
    params.onComplete(true, { percent: 10, reportRate: 0 });
    await tick();
    assert.equal(env.globals.triage_pre_percent, 86, 'a read-only reopen overwrites nothing');
    assert.equal(window.stateSync.calls.length, 0, 'no conclusionTaskId: no re-emit, no save');
});

test('a reopen with _done set and the conclusion task incomplete re-emits once', async () => {
    const env = setup({ globals: doneGlobals, tasks: { pre_check: 'active' } });
    const sync = stubSync();
    window.stateSync = sync;
    const sprite = { scenarioData: { minigameData: { triageSetId: 'pre_a', conclusionTaskId: 'pre_check' } } };
    startInboxTriageMinigame(sprite);
    startInboxTriageMinigame(sprite); // a second open while the first re-emit waits
    await tick();
    assert.equal(sync.calls.length, 1, 'one re-emit in flight');
    assert.equal(env.events.length, 0, 'held until the sync is confirmed');
    sync.settleAll(true);
    await tick(); await tick();
    assert.deepEqual(names(env.events), [
        'global_variable_changed:triage_pre_pass',
        'global_variable_changed:triage_pre_done',
        TRIAGE_DONE_EVENT
    ]);
    assert.equal(env.events[2].data.reemit, true);

    // The mapping completed the task: the next reopen emits nothing
    window.objectivesManager.taskIndex.pre_check.status = 'completed';
    env.events.length = 0;
    startInboxTriageMinigame(sprite);
    await tick();
    assert.equal(sync.calls.length, 0);
    assert.equal(env.events.length, 0);
});

test('a reopen whose sync fails emits nothing; one that finds the task completed emits nothing', async () => {
    const env = setup({ globals: doneGlobals, tasks: { pre_check: 'active' } });
    const sync = stubSync();
    const ctx = ctxFor(preSet, { conclusionTaskId: 'pre_check' });
    const a = reemitTriageDone(ctx, { stateSync: sync });
    await tick(); sync.settleAll(false);
    assert.equal((await a).confirmed, false);
    assert.equal(env.events.length, 0);

    const b = reemitTriageDone(ctx, { stateSync: sync });
    await tick();
    window.objectivesManager.taskIndex.pre_check.status = 'completed'; // completed while retrying
    sync.settleAll(true);
    assert.equal((await b).skipped, 'task-completed');
    assert.equal(env.events.length, 0);
});

test('a mission round with the conclusion task still open re-emits unchanged pass and done', async () => {
    // Round 1 confirmed on the server earlier (pagehide), nothing emitted; this round is lower
    const env = setup({ globals: { triage_percent: 72, triage_reportRate: 1, triage_pass: true, triage_done: true }, tasks: { triage_passed: 'active' } });
    const sync = stubSync();
    const p = persistTriageResult({ percent: 50, reportRate: 1 }, ctxFor(labSet, { conclusionTaskId: 'triage_passed' }), { stateSync: sync });
    await tick(); sync.settleAll(true); await p;
    assert.deepEqual(names(env.events), [
        'global_variable_changed:triage_pass',
        'global_variable_changed:triage_done',
        TRIAGE_DONE_EVENT
    ], 'percent keeps the best round, so it does not change');
    assert.equal(env.globals.triage_percent, 72);
});

// ---- with the real StateSync ------------------------------------------------

function realSync(replies) {
    const requests = [];
    globalThis.fetch = async (url, init) => {
        requests.push(JSON.parse(init.body));
        const r = replies.length > 1 ? replies.shift() : replies[0];
        return { ok: r.status === 200, status: r.status, statusText: '', json: async () => r.json || { success: true } };
    };
    window.currentRoom = { name: 'lobby' };
    const s = new StateSync();
    s.buildChanges = () => ({ body: { globalVariables: { ...window.gameState.globalVariables } } });
    s.confirm = () => {};
    return { s, requests };
}
const realSetTimeout = globalThis.setTimeout;
const fastTimers = () => { globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, 0, ...a); };
const realTimers = () => { globalThis.setTimeout = realSetTimeout; };

test('blocked sync: the notice shows, nothing is emitted until the server confirms', async () => {
    globalThis.console = quiet; fastTimers();
    try {
        const env = setup();
        const { s, requests } = realSync([{ status: 503 }, { status: 503 }, { status: 200 }]);
        const states = [];
        const out = await persistTriageResult({ percent: 72, reportRate: 1 }, ctxFor(labSet), {
            stateSync: s,
            onSaving: (st) => { states.push({ st, emittedSoFar: env.events.length }); }
        });
        assert.equal(out.confirmed, true);
        assert.equal(requests.length, 3);
        assert.equal(requests[2].globalVariables.triage_done, true, 'the confirmed PUT carried done');
        assert.deepEqual(states, [{ st: 'saving', emittedSoFar: 0 }, { st: 'saved', emittedSoFar: 5 }]);
        assert.equal(names(env.events).at(-1), TRIAGE_DONE_EVENT);
    } finally { globalThis.console = realConsole; realTimers(); }
});

test('a 403 stops the retries at once and emits nothing', async () => {
    globalThis.console = quiet; fastTimers();
    try {
        const env = setup();
        const { s, requests } = realSync([{ status: 403, json: { success: false } }]);
        const states = [];
        const out = await persistTriageResult({ percent: 72, reportRate: 1 }, ctxFor(labSet), { stateSync: s, onSaving: st => states.push(st) });
        assert.equal(out.confirmed, false);
        assert.equal(requests.length, 1, 'no retry after a refusal');
        assert.equal(env.events.length, 0);
        assert.deepEqual(states, ['failed']);
    } finally { globalThis.console = realConsole; realTimers(); }
});

test('a section the server refused counts as unconfirmed: retried, then nothing emitted', async () => {
    globalThis.console = quiet; fastTimers();
    try {
        const env = setup();
        const { s, requests } = realSync([{ status: 200, json: { success: true, notSaved: ['mailState'] } }]);
        const orig = s.syncConfirmed.bind(s);
        s.syncConfirmed = (opts) => orig({ ...opts, attempts: 3 });
        const out = await persistTriageResult({ percent: 72, reportRate: 1 }, ctxFor(labSet), { stateSync: s });
        assert.equal(out.confirmed, false);
        assert.equal(requests.length, 3);
        assert.equal(env.events.length, 0);
    } finally { globalThis.console = realConsole; realTimers(); }
});
