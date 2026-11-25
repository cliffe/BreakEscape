// Ops S8a unit 07: systems/pc-sessions.js and the multi-factor second step. A first step that asks
// for a second one is not an error (mfaRequired is read before success === false); completeSecondStep
// does everything signIn does with a session answer; a 422 typeToSignIn is its own reason; a refused
// second step emits pc_signin_failed with its reason, a stale code nothing.
// Run with: node test/js/pc-sessions-mfa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = {};
const mfaUrl = dataUrl(read('systems/mfa-client.js'));
const { PcSessions, credentialRefusalReason, typeToSignInMessage } = await import(dataUrl(read('systems/pc-sessions.js')
    .split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(read('utils/sync-before-fetch.js'))}'`)
    .split("'./mfa-client.js'").join(`'${mfaUrl}'`)
    .split("'./helpdesk-client.js'").join(`'${dataUrl(read('systems/helpdesk-client.js'))}'`)));
const mfa = await import(mfaUrl);

let events, next, thrown, posts;
function setup() {
    events = []; next = {}; thrown = null; posts = [];
    mfa.reset();
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.ApiClient = {
        logout: async () => ({ success: true }),
        login: async () => { if (thrown) throw thrown; return next; },
        loginWithCredential: async () => { if (thrown) throw thrown; return next; },
        get: async (path) => { posts.push(['GET', path]); if (thrown) throw thrown; return next; },
        post: async (path, body) => { posts.push(['POST', path, body]); if (thrown) throw thrown; return next; }
    };
    return new PcSessions();
}
const names = () => events.map(e => e[0]);
const refused = (body) => Object.assign(new Error('refused'), { status: 422, body });
const SESSION = { success: true, npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password' };

test('mfaRequired is not an error: no pc_signin_failed, a pending record, the required answer', async () => {
    const s = setup();
    next = { success: false, mfaRequired: true, mfa: 'code', npcId: 'sam' };
    const r = await s.signIn('pc1', 'sam', 'pw');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'mfa_required');
    assert.equal(r.error, undefined);
    assert.equal(r.mfa.npcId, 'sam');
    assert.equal(names().includes('pc_signin_failed'), false);
    assert.equal(names().includes('pc_signed_in'), false);
    assert.equal(s.has('pc1'), false);
    assert.equal(mfa.pendingFor('pc:pc1').npcId, 'sam');
    assert.ok(names().includes('mfa_required'));
});

test('a plain refusal still answers as before', async () => {
    const s = setup();
    next = { success: false, message: 'No' };
    const r = await s.signIn('pc1', 'sam', 'pw');
    assert.equal(r.reason, 'error');
    assert.equal(r.message, 'No');
});

test('completeSecondStep writes the mirror, drops ended sessions and emits pc_signed_in', () => {
    const s = setup();
    s.load({ pc2: { ...SESSION, npcId: 'sam' } }, ['pc2']);
    events.length = 0;
    const r = s.completeSecondStep('pc1', { ...SESSION, endedPcIds: ['pc2'] });
    assert.equal(r.ok, true);
    assert.equal(r.session.npcId, 'sam');
    assert.equal(s.has('pc1'), true);
    assert.equal(s.has('pc2'), false, 'the ended session is dropped');
    assert.equal(s.signedIn.has('pc1'), true);
    const signedIn = events.find(e => e[0] === 'pc_signed_in');
    assert.equal(signedIn[1].pcId, 'pc1');
    assert.equal(signedIn[1].firstAtPc, true);
});

test('completeSecondStep with no session answer is an error and changes nothing', () => {
    const s = setup();
    assert.equal(s.completeSecondStep('pc1', { success: false }).reason, 'error');
    assert.equal(s.has('pc1'), false);
    assert.equal(names().length, 0);
});

test('a passing verify through mfa-client reaches completeSecondStep', async () => {
    const s = setup();
    next = { success: false, mfaRequired: true, mfa: 'code', npcId: 'sam' };
    await s.signIn('pc1', 'sam', 'pw');
    next = { ...SESSION };
    const r = await mfa.verify('pc:pc1', '123456');
    assert.equal(r.passed, true);
    assert.equal(s.get('pc1').npcId, 'sam');
    assert.ok(names().includes('pc_signed_in'));
    assert.equal(posts[0][1], '/mfa/verify');
    assert.equal(posts[0][2].pc_id, 'pc1');
});

test('a refused second step emits pc_signin_failed with its reason; a stale code emits nothing', async () => {
    const s = setup();
    next = { success: false, mfaRequired: true, mfa: 'code', npcId: 'sam' };
    await s.signIn('pc1', 'sam', 'pw');
    const cases = [
        [{ mfaIncorrect: true, attemptsLeft: 3 }, 'mfa_wrong_code'],
        [{ codeLocked: true, retryIn: 300 }, 'mfa_code_locked'],
        [{ cancelled: true }, 'mfa_cancelled'],
        [{ expired: true }, 'mfa_expired']
    ];
    for (const [body, reason] of cases) {
        next = {}; thrown = refused(body);
        events.length = 0;
        await mfa.verify('pc:pc1', '000000');
        const failed = events.filter(e => e[0] === 'pc_signin_failed');
        assert.equal(failed.length, 1, reason);
        assert.equal(failed[0][1].reason, reason);
        assert.equal(failed[0][1].pcId, 'pc1');
        // a locked, cancelled or expired step drops the pending record: start a new first step
        thrown = null; next = { success: false, mfaRequired: true, mfa: 'code', npcId: 'sam' };
        await s.signIn('pc1', 'sam', 'pw');
    }
    thrown = refused({ stale: 'used' }); events.length = 0;
    await mfa.verify('pc:pc1', '111111');
    assert.equal(names().includes('pc_signin_failed'), false);
});

test('a test-only kind never reaches the mirror or pc_signin_failed', async () => {
    const s = setup();
    s.listen();
    next = { ...SESSION };
    const r = await mfa.verify('door:d1', '123456');
    assert.equal(r.passed, true);
    assert.equal(s.has('d1'), false);
    assert.equal(names().includes('pc_signed_in'), false);
    assert.equal(names().includes('pc_signin_failed'), false);
});

test('a 422 typeToSignIn is type_to_sign_in with its why, never the wrong-password fallback', async () => {
    const s = setup();
    assert.equal(credentialRefusalReason({ typeToSignIn: 'second_step' }), 'type_to_sign_in');
    assert.equal(credentialRefusalReason({ typeToSignIn: 'password_changed' }), 'type_to_sign_in');
    assert.equal(credentialRefusalReason({}), 'no_longer_works');
    thrown = refused({ success: false, typeToSignIn: 'second_step' });
    let r = await s.signInWithCredential('pc1', 'cred1');
    assert.equal(r.reason, 'type_to_sign_in');
    assert.equal(r.why, 'second_step');
    assert.equal(r.notice, true);
    assert.equal(r.message, 'This PC asks for a second step. Type the password to sign in.');
    assert.notEqual(r.message, 'Incorrect username or password');
    const failed = events.find(e => e[0] === 'pc_signin_failed');
    assert.equal(failed[1].reason, 'type_to_sign_in');
    assert.equal(failed[1].why, 'second_step');
    thrown = refused({ success: false, typeToSignIn: 'password_changed' });
    r = await s.signInWithCredential('pc1', 'cred1');
    assert.equal(r.why, 'password_changed');
    assert.equal(r.message, 'This password has been changed. Type the new one to sign in.');
    assert.equal(typeToSignInMessage('password_changed'), r.message);
});

test('mfaClient is exposed beside pcSessions', () => {
    assert.equal(typeof window.mfaClient?.noteRequired, 'function');
    assert.equal(window.pcSessions instanceof PcSessions, true);
});
