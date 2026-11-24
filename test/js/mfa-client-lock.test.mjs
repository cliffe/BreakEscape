// Lock second step on the client (ops layer S8c unit 10): lockPhone, and the lock subjects through
// verify, prompt and approve. Server answers come from the shared fixture.
// Run with: bin/test-js test/js/mfa-client-lock.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/mfa-client.js')).href);

function setup(handler) {
    const events = [];
    const sessions = [];
    const calls = [];
    M.reset();
    M.configure({
        request: async (method, path, payload) => {
            calls.push({ method, path, payload });
            return handler(method, path, payload);
        },
        onSession: (pcId, body) => sessions.push({ pcId, body }),
        emit: (name, detail) => events.push({ name, detail }),
        now: () => 1000
    });
    return { events, sessions, calls };
}
// A fixture answer as the request function gives it: the body on 2xx, a thrown { status, body } otherwise
function answer(name) {
    const a = loadAnswer(name);
    if (a.status >= 200 && a.status < 300) return a.body;
    const e = new Error('refused');
    e.status = a.status;
    e.body = a.body;
    throw e;
}

test('lockPhone sends npc_id, target_type and target_id and returns the requests', async () => {
    const { calls } = setup(() => answer('phone_one_request'));
    const r = await M.lockPhone('object:moira_locker', { npcId: 'moira' });
    assert.deepEqual(calls, [{ method: 'GET', path: 'mfa/phone', payload: { npc_id: 'moira', target_type: 'object', target_id: 'moira_locker' } }]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.requests, loadAnswer('phone_one_request').body.requests);
});

test('lockPhone carries the numbers of a number-match request, and takes a door subject', async () => {
    const { calls } = setup(() => answer('phone_number_request'));
    const r = await M.lockPhone({ kind: 'door', id: 'records_room' }, { npcId: 'priya' });
    assert.equal(calls[0].payload.target_type, 'door');
    assert.equal(calls[0].payload.target_id, 'records_room');
    assert.deepEqual(r.requests[0].numbers, loadAnswer('phone_number_request').body.requests[0].numbers);
});

test('lockPhone refusals: 403 is no_phone, 404 is an error, a missing requests list is empty', async () => {
    setup(() => answer('no_phone'));
    const a = await M.lockPhone('object:x', { npcId: 'n' });
    assert.deepEqual([a.ok, a.reason, a.status], [false, 'no_phone', 403]);
    setup(() => answer('not_found'));
    const b = await M.lockPhone('object:x', { npcId: 'n' });
    assert.deepEqual([b.ok, b.reason, b.status], [false, 'error', 404]);
    setup(() => ({}));
    const c = await M.lockPhone('object:x', { npcId: 'n' });
    assert.deepEqual(c.requests, []);
});

test('verify with a lock subject posts target fields, skips onSession, emits target detail', async () => {
    const { calls, sessions, events } = setup(() => answer('verify_passed'));
    M.noteRequired('object:locker', { kind: 'code', npcId: 'moira' });
    const r = await M.verify('object:locker', '123456');
    assert.deepEqual(calls[0], { method: 'POST', path: 'mfa/verify', payload: { target_type: 'object', target_id: 'locker', code: '123456' } });
    assert.equal(r.passed, true);
    assert.equal(sessions.length, 0);
    assert.equal('pc_id' in calls[0].payload, false);
    const ap = events.find(e => e.name === 'mfa_approved');
    // the pass body names no owner: the owner is the one the gate answer named
    assert.deepEqual(ap.detail, { npcId: 'moira', targetType: 'object', targetId: 'locker', by: 'code' });
    assert.ok(M.takeCompleted('object:locker'));
    assert.equal(events.some(e => /pc_signin_failed/.test(e.name)), false);
});

test('an mfa_approved:<owner> listener fires for a lock, by code and by phone approval', async () => {
    const { events } = setup(() => answer('verify_passed'));
    M.noteRequired('object:locker', { kind: 'code', npcId: 'moira' });
    await M.verify('object:locker', '123456');
    const named = events.filter(e => e.name === 'mfa_approved:moira');
    assert.equal(named.length, 1);
    assert.deepEqual(named[0].detail, { npcId: 'moira', targetType: 'object', targetId: 'locker', by: 'code' });

    const second = setup(() => answer('approve_passed'));
    M.noteRequired('door:records', { kind: 'push', npcId: 'priya' });
    await M.approve('door:records', {});
    const byPhone = second.events.filter(e => e.name === 'mfa_approved:priya');
    assert.equal(byPhone.length, 1);
    assert.equal(byPhone[0].detail.targetType, 'door');

    // with no gate answer noted there is no owner to name, so only the plain event fires
    const third = setup(() => answer('verify_passed'));
    await M.verify('object:never_noted', '1');
    assert.deepEqual(third.events.map(e => e.name), ['mfa_approved']);
});

test('a closed code lock keeps its pending record, so a later pass still names the owner', async () => {
    const answers = ['verify_closed', 'verify_passed'];
    const { events } = setup(() => answer(answers.shift()));
    M.noteRequired('object:locker', { kind: 'code', npcId: 'moira' });
    assert.equal((await M.verify('object:locker', '000000')).reason, 'locked');
    assert.equal(M.pendingFor('object:locker').npcId, 'moira');
    assert.equal((await M.verify('object:locker', '123456')).passed, true);
    assert.equal(events.filter(e => e.name === 'mfa_approved:moira').length, 1);
});

test('a wrong code on a lock is reason wrong with no attemptsLeft, and emits mfa_failed with target detail', async () => {
    const { events } = setup(() => answer('verify_wrong'));
    M.noteRequired('door:d1', { kind: 'code', npcId: 'cy' });
    const r = await M.verify('door:d1', '000000');
    assert.equal(r.reason, 'wrong');
    assert.equal(r.attemptsLeft, null);
    const f = events.find(e => e.name === 'mfa_failed');
    assert.deepEqual(f.detail, { npcId: 'cy', reason: 'wrong', targetType: 'door', targetId: 'd1' });
    assert.ok(events.some(e => e.name === 'mfa_failed:cy'));
    assert.equal(M.failureReason(r), 'mfa_wrong_code'); // a caller decides whether to emit; the client never does
});

for (const name of ['verify_stale_used', 'verify_stale_expired', 'verify_dropped', 'verify_closed']) {
    test(`verify answer ${name} is a refusal result, not a throw`, async () => {
        setup(() => answer(name));
        M.noteRequired('object:o', { kind: 'code', npcId: 'n' });
        const r = await M.verify('object:o', '1');
        assert.equal(r.ok, false);
        assert.equal(r.passed, undefined);
    });
}

test('prompt with a lock subject posts target fields and emits mfa_prompt_sent with target detail', async () => {
    const { calls, events } = setup(() => answer('prompt_waiting'));
    M.noteRequired('object:locker', { kind: 'push', npcId: 'moira' });
    const r = await M.prompt('object:locker');
    assert.deepEqual(calls[0].payload, { target_type: 'object', target_id: 'locker' });
    assert.equal(r.waiting, true);
    const e = events.find(x => x.name === 'mfa_prompt_sent');
    assert.equal(e.detail.targetType, 'object');
    assert.equal(e.detail.targetId, 'locker');
    assert.equal('pcId' in e.detail, false);
});

test('prompt passed by the owner passes a lock with no session', async () => {
    const { sessions } = setup(() => answer('prompt_passed'));
    M.noteRequired('object:locker', { kind: 'push', npcId: 'moira' });
    const r = await M.prompt('object:locker');
    assert.equal(r.passed, true);
    assert.equal(sessions.length, 0);
});

test('prompt too soon and expired are refusals', async () => {
    setup(() => answer('prompt_too_soon'));
    assert.equal((await M.prompt('door:d')).reason, 'too_soon');
    setup(() => answer('prompt_expired'));
    M.noteRequired('door:d', { kind: 'push', npcId: 'n' });
    assert.equal((await M.prompt('door:d')).reason, 'expired');
    assert.equal(M.pendingFor('door:d'), null);
});

test('approve with a lock subject posts number and deny, never reaches onSession', async () => {
    const { calls, sessions, events } = setup(() => answer('approve_passed'));
    M.noteRequired('object:safe', { kind: 'push_number_match', npcId: 'priya' });
    const r = await M.approve('object:safe', { number: 47 });
    assert.deepEqual(calls[0].payload, { target_type: 'object', target_id: 'safe', number: 47 });
    assert.equal(r.passed, true);
    assert.equal(sessions.length, 0);
    assert.equal(events.find(e => e.name === 'mfa_approved').detail.by, 'player');
    setup(() => answer('approve_cancelled'));
    M.noteRequired('object:safe', { kind: 'push', npcId: 'priya' });
    const d = await M.approve('object:safe', { deny: true });
    assert.equal(d.reason, 'cancelled');
    assert.equal(M.pendingFor('object:safe'), null);
});

test('approve 403 no such phone is no_phone for a lock', async () => {
    setup(() => answer('no_phone'));
    assert.equal((await M.approve('object:safe', { number: 1 })).reason, 'no_phone');
});

test('a bare refusal on a lock (no flag, no message) is gone and never pc_signin_failed', async () => {
    const { events } = setup(() => { try { answer('generic_refusal'); } catch (e) { delete e.body.message; throw e; } });
    M.noteRequired('door:d', { kind: 'code', npcId: 'n' });
    const r = await M.verify('door:d', '1');
    assert.equal(r.reason, 'gone');
    assert.equal(events.some(e => e.name === 'pc_signin_failed'), false);
});

// S8c R1-CLIENT8: the server's generic 422 carries a message (the PC form's). On a lock it is an approve
// with no number, which the server keeps: the pending record stays and the result is an error, not "gone"
test('a lock refusal with a message and no flag is an error and keeps the pending record', async () => {
    const { events } = setup(() => answer('generic_refusal'));
    M.noteRequired('object:safe', { kind: 'push_number_match', npcId: 'priya' });
    const r = await M.approve('object:safe', {});
    assert.equal(r.reason, 'error');
    assert.equal(r.ok, false);
    assert.equal(M.pendingFor('object:safe').npcId, 'priya');
    assert.equal(events.some(e => e.name === 'pc_signin_failed'), false);
});

test('a PC refusal with a message and no flag is still gone, as before', async () => {
    setup(() => answer('generic_refusal'));
    M.noteRequired('pc:p1', { kind: 'code', npcId: 'n' });
    const r = await M.verify('pc:p1', '1');
    assert.equal(r.reason, 'gone');
});
