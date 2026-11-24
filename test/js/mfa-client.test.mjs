// Multi-factor sign-in client (ops layer S8a unit 06): notes per subject key, codeFor, passes for a
// pc and a test-only kind, events in both forms, refusals. The real mfa-client.js, no DOM.
// Run with: node test/js/mfa-client.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/mfa-client.js')).href);

function setup(handler) {
    const events = [];
    const sessions = [];
    const calls = [];
    let t = 1000;
    M.reset();
    M.configure({
        request: async (method, path, payload) => {
            calls.push({ method, path, payload });
            return handler(method, path, payload);
        },
        onSession: (pcId, body) => sessions.push({ pcId, body }),
        emit: (name, detail) => events.push({ name, detail }),
        now: () => t
    });
    return { events, sessions, calls, tick: (ms) => { t += ms; } };
}
const fail = (status, body) => { const e = new Error('x'); e.status = status; e.body = body; throw e; };
const names = (events) => events.map(e => e.name);

test('notes are kept per subject key and emit mfa_required in both forms', () => {
    const { events } = setup(() => ({}));
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    M.noteRequired('pc:b', { mfa: 'push_number_match', npcId: 'bob', number: 42 });
    M.noteRequired('door:d1', { mfa: 'push', npcId: 'cy', ownPhone: true });
    assert.deepEqual(M.pendingFor('pc:a'), { kind: 'code', npcId: 'ann', n: 0 });
    assert.equal(M.pendingFor('pc:b').number, 42);
    assert.equal(M.pendingFor({ kind: 'door', id: 'd1' }).ownPhone, true);
    assert.equal(M.pendingFor('pc:zzz'), null);
    assert.deepEqual(names(events).slice(0, 2), ['mfa_required', 'mfa_required:ann']);
    assert.deepEqual(events[4].detail, { npcId: 'cy', kind: 'push', targetType: 'door', targetId: 'd1' });
    assert.deepEqual(events[0].detail, { npcId: 'ann', kind: 'code', pcId: 'a' });
    M.clear('pc:a');
    assert.equal(M.pendingFor('pc:a'), null);
});

test('readDevice notes a live code; used and enrolled false are handled', async () => {
    setup((m, p, q) => ({ deviceId: 'dev1', npcId: 'ann', code: '123456', secondsLeft: 30 }));
    await M.readDevice({ itemId: 'dev1' });
    assert.equal(M.codeFor({ npcId: 'ann' }), '123456');
    setup(() => ({ deviceId: 'dev2', npcId: 'ann', code: '111111', used: true }));
    await M.readDevice({ itemId: 'dev2' });
    assert.equal(M.codeFor({ npcId: 'ann' }), null); // reset by setup, used not noted
    setup((m, p, q) => (q.item_id === 'dev1'
        ? { deviceId: 'dev1', npcId: 'ann', code: '123456' }
        : { deviceId: 'dev1', npcId: 'ann', enrolled: false }));
    await M.readDevice({ itemId: 'dev1' });
    assert.equal(M.codeFor({ npcId: 'ann' }), '123456');
    const r = await M.readDevice({ itemId: 'dev1b' });
    assert.equal(r.enrolled, false);
    assert.equal(M.codeFor({ npcId: 'ann' }), null);
});

test('readDevice 403 is no_device and notes nothing', async () => {
    setup(() => fail(403, { success: false, error: 'no such device' }));
    const r = await M.readDevice({ itemId: 'x' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'no_device');
    assert.equal(M.codeFor({ npcId: 'ann' }), null);
});

test('codeFor refuses each mismatch', async () => {
    setup(() => ({ deviceId: 'd', npcId: 'ann', code: '654321' }));
    await M.readDevice({ itemId: 'd' });
    assert.equal(M.codeFor({ npcId: 'ann' }), '654321');
    assert.equal(M.codeFor({ npcId: 'bob' }), null);
    assert.equal(M.codeFor({ npcId: 'ann', ownPhone: true }), null); // source is item, not own
    assert.equal(M.codeFor(null), null);
    assert.equal(M.codeFor({}), null);
});

test('a pc pass reaches onSession; a test-only kind is kept once and never reaches it', async () => {
    const ctx = setup(() => ({ success: true, npcId: 'ann', username: 'ann' }));
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    const r = await M.verify('pc:a', '123456');
    assert.equal(r.passed, true);
    assert.deepEqual(ctx.calls[0], { method: 'POST', path: 'mfa/verify', payload: { pc_id: 'a', code: '123456' } });
    assert.equal(ctx.sessions.length, 1);
    assert.equal(ctx.sessions[0].pcId, 'a');
    assert.equal(M.pendingFor('pc:a'), null);
    assert.equal(M.takeCompleted('pc:a'), null); // a direct verify leaves no note

    M.noteRequired('door:d1', { mfa: 'code', npcId: 'ann' });
    const r2 = await M.verify('door:d1', '123456');
    assert.equal(r2.passed, true);
    assert.deepEqual(ctx.calls[1].payload, { target_type: 'door', target_id: 'd1', code: '123456' });
    assert.equal(ctx.sessions.length, 1);
    assert.equal(M.takeCompleted('door:d1').npcId, 'ann');
    assert.equal(M.takeCompleted('door:d1'), null);
    assert.ok(!names(ctx.events).includes('pc_signin_failed'));
});

test('a child approval for a pc reaches onSession and is handed out once', async () => {
    const ctx = setup(() => ({ success: true, npcId: 'bob', approvedBy: 'player' }));
    M.noteRequired('pc:b', { mfa: 'push_number_match', npcId: 'bob', number: 42 });
    const r = await M.approve('pc:b', { number: 42 });
    assert.equal(r.passed, true);
    assert.deepEqual(ctx.calls[0].payload, { pc_id: 'b', number: 42 });
    assert.equal(ctx.sessions.length, 1);
    assert.equal(M.takeCompleted('pc:b').approvedBy, 'player');
    assert.equal(M.takeCompleted('pc:b'), null);
    M.noteRequired('pc:b', { mfa: 'push', npcId: 'bob' });
    assert.equal(M.takeCompleted('pc:b'), null);
});

test('clear drops a kept completion', async () => {
    setup(() => ({ success: true, npcId: 'bob' }));
    M.noteRequired('pc:b', { mfa: 'push', npcId: 'bob' });
    await M.approve('pc:b', { number: 1 });
    M.clear('pc:b');
    assert.equal(M.takeCompleted('pc:b'), null);
});

test('refusals map to results and events', async () => {
    let answer;
    const ctx = setup(() => fail(422, answer));
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    answer = { success: false, mfaIncorrect: true, attemptsLeft: 2 };
    let r = await M.verify('pc:a', '000000');
    assert.deepEqual([r.reason, r.attemptsLeft], ['wrong', 2]);
    assert.equal(M.failureReason(r), 'mfa_wrong_code');
    assert.ok(M.pendingFor('pc:a'));
    answer = { success: false, stale: 'used' };
    r = await M.verify('pc:a', '000000');
    assert.deepEqual([r.reason, r.stale, M.failureReason(r)], ['stale', 'used', null]);
    answer = { success: false, stale: 'expired' };
    assert.equal((await M.verify('pc:a', '1')).stale, 'expired');
    const before = names(ctx.events).filter(n => n.startsWith('mfa_failed')).length;
    answer = { success: false, codeLocked: true, retryIn: 120 };
    r = await M.verify('pc:a', '000000');
    assert.deepEqual([r.reason, r.retryIn, M.failureReason(r)], ['locked', 120, 'mfa_code_locked']);
    assert.equal(names(ctx.events).filter(n => n.startsWith('mfa_failed')).length, before + 2);
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann' });
    answer = { success: false, expired: true };
    r = await M.prompt('pc:a');
    assert.equal(M.failureReason(r), 'mfa_expired');
    assert.equal(M.pendingFor('pc:a'), null);
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann' });
    answer = { success: false, cancelled: true };
    r = await M.approve('pc:a', { deny: true });
    assert.equal(M.failureReason(r), 'mfa_cancelled');
    answer = { success: false, tooSoon: true, retryAfterS: 2 };
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann' });
    r = await M.prompt('pc:a');
    assert.deepEqual([r.reason, r.retryAfterS, M.failureReason(r)], ['too_soon', 2, null]);
    assert.ok(!names(ctx.events).includes('pc_signin_failed'));
    assert.equal(ctx.sessions.length, 0);
});

test('prompt waiting emits mfa_prompt_sent with the count; approval emits mfa_approved', async () => {
    let n = 0;
    const ctx = setup((m, p) => {
        n += 1;
        return n < 3 ? { success: false, approved: false, promptsSent: n } : { success: true, npcId: 'ann', approvedBy: 'owner', promptsSent: n };
    });
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann' });
    let r = await M.prompt('pc:a');
    assert.equal(r.waiting, true);
    assert.equal(M.pendingFor('pc:a').n, 1);
    await M.prompt('pc:a');
    r = await M.prompt('pc:a');
    assert.equal(r.passed, true);
    const sent = ctx.events.filter(e => e.name === 'mfa_prompt_sent');
    assert.deepEqual(sent.map(e => e.detail.n), [1, 2, 3]);
    assert.deepEqual(sent[0].detail, { npcId: 'ann', pcId: 'a', n: 1 });
    assert.ok(names(ctx.events).includes('mfa_prompt_sent:ann'));
    const ok = ctx.events.find(e => e.name === 'mfa_approved');
    assert.deepEqual(ok.detail, { npcId: 'ann', pcId: 'a', by: 'owner' });
    assert.ok(names(ctx.events).includes('mfa_approved:ann'));
    assert.equal(ctx.sessions.length, 1);
});

test('phone lists requests and refuses without the phone', async () => {
    const ctx = setup(() => ({ requests: [{ pcId: 'a', host: 'h', username: 'u', n: 2 }] }));
    const r = await M.phone({ npcId: 'ann' });
    assert.deepEqual(ctx.calls[0], { method: 'GET', path: 'mfa/phone', payload: { npc_id: 'ann' } });
    assert.equal(r.requests.length, 1);
    setup(() => fail(403, { success: false, error: 'no such phone' }));
    const r2 = await M.phone({ npcId: 'ann' });
    assert.deepEqual([r2.ok, r2.reason], [false, 'no_phone']);
});

test('transport errors are results, not throws, and emit nothing', async () => {
    const ctx = setup(() => fail(500, { error: 'boom' }));
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    const r = await M.verify('pc:a', '123456');
    assert.deepEqual([r.ok, r.reason, r.status], [false, 'error', 500]);
    assert.equal(M.failureReason(r), null);
    assert.deepEqual(names(ctx.events), ['mfa_required', 'mfa_required:ann']);
});

test('R1-C5: a code read over a minute ago, or one just used, is not offered', async () => {
    const h = setup((m, p) => (p === 'mfa/device'
        ? { deviceId: 'dev1', npcId: 'ann', code: '123456', secondsLeft: 30 }
        : { success: true, npcId: 'ann', username: 'a', via: 'password' }));
    await M.readDevice({ itemId: 'dev1' });
    h.tick(61000);
    assert.equal(M.codeFor({ npcId: 'ann' }), null, 'rolled over');
    await M.readDevice({ itemId: 'dev1' });
    assert.equal(M.codeFor({ npcId: 'ann' }), '123456');
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    await M.verify('pc:a', '123456');
    assert.equal(M.codeFor({ npcId: 'ann' }), null, 'used');
});

test('R1-C8: a new first-step answer starts the count at zero', () => {
    setup(() => ({}));
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann', promptsSent: 2 });
    assert.equal(M.pendingFor('pc:a').n, 2);
    M.noteRequired('pc:a', { mfa: 'push', npcId: 'ann' });
    assert.equal(M.pendingFor('pc:a').n, 0);
});

test('R1-C3: a locked-out answer and a bare 422 end the step and drop the record', async () => {
    const h = setup((m, p, q) => fail(422, q.code === '111111'
        ? { success: false, message: 'This account is locked on this PC', lockedOut: true, attemptsLeft: 0 }
        : { success: false, message: 'Incorrect username or password' }));
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    const locked = await M.verify('pc:a', '111111');
    assert.equal(locked.reason, 'locked_out');
    assert.equal(M.pendingFor('pc:a'), null);
    assert.equal(M.failureReason(locked), 'locked_out');
    M.noteRequired('pc:a', { mfa: 'code', npcId: 'ann' });
    const gone = await M.verify('pc:a', '222222');
    assert.equal(gone.reason, 'gone');
    assert.equal(M.pendingFor('pc:a'), null);
    assert.equal(M.failureReason(gone), null);
    assert.ok(h.events.some(e => e.name === 'mfa_failed' && e.detail.reason === 'locked_out'));
});
