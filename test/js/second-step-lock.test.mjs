// S8c unit 09: ApiClient.unlock hands a { secondStep: true } answer to window.lockStep.run, and a
// cancelled second step is a refusal a pad closes as cancelled. Server answers come from the shared
// fixture; window.lockStep is a client module and is stubbed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

globalThis.window = {};
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'second-step-lock-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
mkdirSync(join(dir, 'utils'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'config.js'), 'export const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
copyFileSync(join(src, 'api-client.js'), join(dir, 'api-client.js'));
copyFileSync(join(src, 'utils/lock-scope-refusal.js'), join(dir, 'utils/lock-scope-refusal.js'));
const { ApiClient } = await import(pathToFileURL(join(dir, 'api-client.js')));
const { lockScopeRefusal, lockScopeRefusalLine, unlockWithRouteRoomRetry, LOCK_SCOPE_REFUSAL_TEXT } =
    await import(pathToFileURL(join(dir, 'utils/lock-scope-refusal.js')));

let posts;
const serve = (...answers) => {
    posts = [];
    globalThis.fetch = async (url, opts) => {
        posts.push({ url, body: JSON.parse(opts.body) });
        const a = answers[Math.min(posts.length - 1, answers.length - 1)];
        return { ok: a.status < 400, status: a.status, json: async () => a.body };
    };
};
const cancelError = (closedByPlayer) => Object.assign(new Error('cancelled'), {
    status: 403, body: { success: false, reason: 'second_step_cancelled', closedByPlayer }
});

test('a gated answer is handed over with the body sent, and resolves with the final answer', async () => {
    serve(loadAnswer('gate_push'));
    const final = loadAnswer('open_object').body;
    const calls = [];
    window.lockStep = { run: async (answer, request, opts) => { calls.push({ answer, request, opts }); return final; } };
    const got = await ApiClient.unlock('object', 'moira_locker', 'pw', 'password', { card_ids: ['c1'] }, { fromDoor: true });
    assert.equal(got, final);
    assert.equal(posts.length, 1);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].answer, loadAnswer('gate_push').body);
    assert.deepEqual(calls[0].request, { card_ids: ['c1'], targetType: 'object', targetId: 'moira_locker', attempt: 'pw', method: 'password' });
    assert.deepEqual(calls[0].request, posts[0].body, 'the body handed over is the body posted');
    assert.deepEqual(calls[0].opts, { fromDoor: true });
    assert.ok(!('fromDoor' in posts[0].body) && !('opts' in posts[0].body), 'opts is never posted');
});

test('every gate shape is handed over, and opts defaults to an empty object', async () => {
    for (const name of ['gate_push', 'gate_number', 'gate_code', 'gate_door_npc']) {
        serve(loadAnswer(name));
        let seen;
        window.lockStep = { run: async (a, r, o) => { seen = { a, o }; return { success: true }; } };
        await ApiClient.unlock('object', 'x', '', 'key');
        assert.deepEqual(seen.a, loadAnswer(name).body, name);
        assert.deepEqual(seen.o, {}, name);
    }
});

test('a cancel from lockStep rejects with the error', async () => {
    serve(loadAnswer('gate_push'));
    const err = cancelError(false);
    window.lockStep = { run: async () => { throw err; } };
    await assert.rejects(ApiClient.unlock('object', 'moira_locker', 'pw', 'password'), (e) => e === err);
});

test('with no window.lockStep a gated answer rejects as a silent cancel', async () => {
    serve(loadAnswer('gate_push'));
    delete window.lockStep;
    await assert.rejects(ApiClient.unlock('object', 'moira_locker', 'pw', 'password'), (e) => {
        assert.equal(e.status, 403);
        assert.deepEqual(e.body, { success: false, reason: 'second_step_cancelled', closedByPlayer: true });
        assert.equal(lockScopeRefusal(e), 'second_step_cancelled');
        return true;
    });
});

test('an answer without the field never touches lockStep and returns as before', async () => {
    let touched = 0;
    window.lockStep = { get run() { touched++; return async () => ({}); }, get cancelFeedback() { touched++; return () => {}; } };
    for (const name of ['open_object', 'open_door']) {
        serve(loadAnswer(name));
        const got = await ApiClient.unlock('object', 'a', 'b', 'key');
        assert.deepEqual(got, loadAnswer(name).body);
    }
    // secondStep must be exactly true: a false or truthy string is not a gate
    for (const flag of [false, 'true', 1]) {
        serve({ status: 200, body: { success: false, secondStep: flag } });
        assert.deepEqual(await ApiClient.unlock('object', 'a', 'b', 'key'), { success: false, secondStep: flag });
    }
    assert.equal(touched, 0);
});

test('a first-factor refusal is thrown as today and never reaches lockStep', async () => {
    serve(loadAnswer('first_factor_wrong'));
    let touched = 0;
    window.lockStep = { run: async () => { touched++; } };
    await assert.rejects(ApiClient.unlock('object', 'a', 'wrong', 'password'), (e) => e.status === 422 && e.body.message === 'Invalid attempt');
    assert.equal(touched, 0);
});

test('second_step_cancelled is a pad refusal with no line of its own; feedback is lockStep\'s, once', () => {
    const calls = [];
    window.lockStep = { cancelFeedback: (e) => calls.push(e) };
    const err = cancelError(false);
    assert.equal(lockScopeRefusal(err), 'second_step_cancelled');
    assert.equal(calls.length, 0, 'asking whether it is a refusal says nothing');
    assert.equal(lockScopeRefusalLine(err), '', 'no line from here');
    assert.deepEqual(calls, [err], 'cancelFeedback called once, with the error');
    assert.equal(lockScopeRefusal({ status: 422, body: { reason: 'second_step_cancelled' } }), null, 'only a 403');
    assert.deepEqual(Object.keys(LOCK_SCOPE_REFUSAL_TEXT), ['off', 'not_responding', 'unreachable'], 'no table line added');
    delete window.lockStep;
    assert.equal(lockScopeRefusalLine(cancelError(true)), '', 'no lockStep: still no throw');
});

test('unlockWithRouteRoomRetry never retries a cancelled second step, and forwards opts only when given', async () => {
    let n = 0, lastArgs;
    let synced = 0;
    window.stateSync = { sync: async () => { synced++; } };
    window.ApiClient = { unlock: async (...a) => { n++; lastArgs = a; throw Object.assign(cancelError(false), { body: { success: false, reason: 'second_step_cancelled', retryable: true } }); } };
    await assert.rejects(unlockWithRouteRoomRetry('object', 'x', 'a', 'key'), (e) => e.status === 403);
    assert.equal(n, 1);
    assert.equal(synced, 0);
    assert.equal(lastArgs.length, 4, 'four args stay four');
    await assert.rejects(unlockWithRouteRoomRetry('door', 'r', 'a', 'key', undefined, { fromDoor: true }));
    assert.deepEqual(lastArgs, ['door', 'r', 'a', 'key', {}, { fromDoor: true }]);
    delete window.ApiClient; delete window.stateSync;
});
