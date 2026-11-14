// Launch device (launch-abort mode): ABORT or EXECUTE LAUNCH saves the choice straight away
// (stateSync.sync), after its globals are set, instead of waiting for the 30 s timer or
// pagehide. A crash or hard close straight after the choice used to lose it.
// Run with: node --test test/js/flag-station-choice-sync.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/flag-station/flag-station-minigame.js');
// Mirror js/minigames/flag-station, js/systems, js/utils with stubs.
const root = mkdtempSync(join(tmpdir(), 'flag-station-sync-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'flag-station'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'systems'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor(c, p) { this.params = p; } }\n');
writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(new URL('../../public/break_escape/js/utils/escape-html.js', import.meta.url), 'utf8'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'flag-wording.js'), readFileSync(join(here, '../../public/break_escape/js/utils/flag-wording.js'), 'utf8'));
writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), readFileSync(src, 'utf8'));
globalThis.window = {};
globalThis.document = { querySelector: () => null };
const { FlagStationMinigame } = await import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href);
// The real StateSync, its two imports stubbed, for its syncConfirmed back-off.
writeFileSync(join(root, 'api-client.js'), 'export const ApiClient = {};\n');
writeFileSync(join(root, 'config.js'), 'export function getApiBase() { return ""; } export function getCsrfToken() { return ""; }\n');
writeFileSync(join(root, 'state-sync.js'), readFileSync(join(here, '../../public/break_escape/js/state-sync.js'), 'utf8'));
const { StateSync } = await import(pathToFileURL(join(root, 'state-sync.js')).href);

const ABORT = { setGlobal: { player_aborted_attack: true, ready_for_debrief: true }, emitEvent: 'attack_aborted' };
const LAUNCH = { setGlobal: { player_launched_attack: true, ready_for_debrief: true }, emitEvent: 'attack_launched' };

function setup({ confirmAnswer = true, syncImpl } = {}) {
    const calls = [];
    window.gameState = { globalVariables: { launch_code_submitted: true } };
    window.eventDispatcher = { emit: (name) => calls.push('emit:' + name) };
    window.stateSync = {
        sync: syncImpl || (() => {
            // What the server would be sent: the globals as they are when sync runs
            calls.push('sync:' + JSON.stringify(window.gameState.globalVariables));
            return Promise.resolve(true);
        })
    };
    globalThis.confirm = () => confirmAnswer;
    const s = new FlagStationMinigame({}, {
        stationId: 'dev', mode: 'launch-abort', flagCount: 1, onAbort: ABORT, onLaunch: LAUNCH,
    });
    s.showFinalState = (outcome) => calls.push('final:' + outcome);
    return { s, calls };
}

test('ABORT syncs once, after its globals are set', () => {
    const { s, calls } = setup();
    s.handleAbort();
    const syncs = calls.filter(c => c.startsWith('sync:'));
    assert.equal(syncs.length, 1);
    const sent = JSON.parse(syncs[0].slice(5));
    assert.equal(sent.player_aborted_attack, true);
    assert.equal(sent.ready_for_debrief, true);
    assert.ok(calls.indexOf('emit:attack_aborted') < calls.indexOf(syncs[0]), 'event before the sync');
});

test('EXECUTE LAUNCH syncs once, after its globals are set', () => {
    const { s, calls } = setup();
    s.handleLaunch();
    const syncs = calls.filter(c => c.startsWith('sync:'));
    assert.equal(syncs.length, 1);
    assert.equal(JSON.parse(syncs[0].slice(5)).player_launched_attack, true);
});

test('a second click after the choice does not sync again', () => {
    const { s, calls } = setup();
    s.handleAbort();
    s.handleLaunch();
    s.handleAbort();
    assert.equal(calls.filter(c => c.startsWith('sync:')).length, 1);
});

test('a cancelled confirm changes nothing and does not sync', () => {
    const { s, calls } = setup({ confirmAnswer: false });
    s.handleAbort();
    s.handleLaunch();
    assert.equal(calls.length, 0);
});

test('a config with only an event syncs once, after the event; an empty one does not sync', () => {
    const { s, calls } = setup();
    s.applyChoiceConfig({ emitEvent: 'x' });
    assert.equal(calls[0], 'emit:x');
    assert.equal(calls.filter(c => c.startsWith('sync:')).length, 1);
    assert.ok(calls[1].startsWith('sync:'), 'sync after the event');
    calls.length = 0;
    s.applyChoiceConfig(null);
    s.applyChoiceConfig({});
    assert.deepEqual(calls, []);
});

test('an event-only choice through the real button syncs once, and a second click does not', () => {
    const { s, calls } = setup();
    s.onAbortConfig = { emitEvent: 'attack_aborted' };
    s.handleAbort();
    s.handleAbort();
    assert.equal(calls.filter(c => c.startsWith('sync:')).length, 1);
});

test('a failed sync neither throws nor stops the final state', async () => {
    const { s, calls } = setup({ syncImpl: () => Promise.reject(new Error('offline')) });
    assert.doesNotThrow(() => s.handleAbort());
    assert.ok(calls.includes('final:aborted'));
    await new Promise(r => setTimeout(r, 0)); // no unhandled rejection
});

test('a sync that throws synchronously, or no stateSync at all, is harmless', () => {
    let r = setup({ syncImpl: () => { throw new Error('boom'); } });
    assert.doesNotThrow(() => r.s.handleLaunch());
    assert.ok(r.calls.includes('final:launched'));
    r = setup();
    delete window.stateSync;
    assert.doesNotThrow(() => r.s.handleAbort());
    assert.equal(window.gameState.globalVariables.player_aborted_attack, true);
});

test('with syncConfirmed available, the choice uses it with a small bound, not sync()', () => {
    const { s, calls } = setup();
    window.stateSync.syncConfirmed = (opts) => { calls.push('confirmed:' + JSON.stringify(opts)); return Promise.resolve(true); };
    s.handleAbort();
    assert.deepEqual(calls.filter(c => c.startsWith('sync:') || c.startsWith('confirmed:')), ['confirmed:{"attempts":4}']);
});

test('a failed choice sync is tried again within about a second, then stops', async () => {
    const { s } = setup();
    const runs = [];
    // The real syncConfirmed over a fake run: the first request fails, the second lands.
    const answers = [{ ok: false, error: new Error('offline') }, { ok: true, error: null }];
    const fake = { _tracked: new Set(), _syncRun: () => { runs.push(Date.now()); return Promise.resolve(answers.shift() || { ok: true, error: null }); } };
    window.stateSync = { syncConfirmed: (o) => StateSync.prototype.syncConfirmed.call(fake, o), sync: () => { throw new Error('not used'); } };
    s.handleLaunch();
    await new Promise(r => setTimeout(r, 400));
    assert.equal(runs.length, 2, 'one retry after the failure');
    assert.ok(runs[1] - runs[0] < 1000, 'retried well before the 30 s timer');
});

test('a choice sync that keeps failing stops after four tries; a 403 stops at once', async () => {
    let { s } = setup();
    let runs = 0;
    const fail = { _tracked: new Set(), _syncRun: () => { runs++; return Promise.resolve({ ok: false, error: new Error('offline') }); } };
    window.stateSync = { syncConfirmed: (o) => StateSync.prototype.syncConfirmed.call(fail, o) };
    s.handleAbort();
    await new Promise(r => setTimeout(r, 1900));
    assert.equal(runs, 4);
    ({ s } = setup());
    runs = 0;
    const refused = { _tracked: new Set(), _syncRun: () => { runs++; return Promise.resolve({ ok: false, error: Object.assign(new Error('no'), { status: 403 }) }); } };
    window.stateSync = { syncConfirmed: (o) => StateSync.prototype.syncConfirmed.call(refused, o) };
    s.handleAbort();
    await new Promise(r => setTimeout(r, 400));
    assert.equal(runs, 1);
});

test('a reopen after the choice shows the outcome and sends no sync', () => {
    for (const [globals, outcome] of [[ABORT.setGlobal, 'aborted'], [LAUNCH.setGlobal, 'launched']]) {
        const { s, calls } = setup();
        window.stateSync.syncConfirmed = () => { calls.push('confirmed:'); return Promise.resolve(true); };
        Object.assign(window.gameState.globalVariables, globals);
        s.restoreLaunchState();
        assert.deepEqual(calls, ['final:' + outcome], 'the outcome, with no sync and no event');
    }
});
