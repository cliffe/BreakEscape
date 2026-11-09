// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.3): systems/pc-sessions.js
// is the only place the client signs in to or out of a sign-in PC, and the only source of
// the sign-in events. A password sign-in emits one pc_signed_in; Sign out and a container
// 403 each emit one pc_signed_out, and the 403 sends no request; a switch keeps the first
// session through a wrong password, then emits pc_signed_out for the first account and
// pc_signed_in for the second (with previousNpcId; firstAtPc marks the first sign-in at a PC);
// on load, password sessions are kept (and a claimed one ends). pc_signed_out says why (reason).
// Run with: node test/js/pc-sessions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const { PcSessions, pcSessions: singleton, SIGNED_OUT_MESSAGE } =
    await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8')));

const ACCOUNTS = {
    sokafor: { password: 'right-sam', npcId: 'sam', displayName: 'Sam Okafor' },
    ishaw: { password: 'right-ian', npcId: 'ian', displayName: 'Ian Shaw' }
};

let events, calls;
function setup({ answer } = {}) {
    events = [];
    calls = [];
    window.eventDispatcher = { emit: (name, data) => events.push([name, data]) };
    window.ApiClient = {
        login: async (pcId, fields) => {
            calls.push(['login', pcId, fields]);
            if (answer) return answer(pcId, fields);
            const acct = ACCOUNTS[fields.username];
            if (!acct || acct.password !== fields.password) {
                throw Object.assign(new Error('Incorrect username or password'), {
                    status: 422, body: { success: false, message: 'Incorrect username or password', attemptsLeft: 4 }
                });
            }
            return { success: true, npcId: acct.npcId, username: fields.username, displayName: acct.displayName, via: 'password' };
        },
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; }
    };
    return new PcSessions();
}
const named = (name) => events.filter(([n]) => n === name).map(([, d]) => d);
const settle = () => new Promise(r => setTimeout(r, 0));

test('the module is window.pcSessions, with list() for the test bridge', () => {
    assert.equal(window.pcSessions, singleton);
    assert.equal(typeof singleton.list, 'function');
});

test('a password sign-in emits one pc_signed_in with the npcId and via password', async () => {
    const s = setup();
    const result = await s.signIn('hot_desk', 'sokafor', 'right-sam');
    assert.equal(result.ok, true);
    assert.deepEqual(result.session, { pcId: 'hot_desk', npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', via: 'password' });
    assert.deepEqual(named('pc_signed_in'), [{ pcId: 'hot_desk', npcId: 'sam', username: 'sokafor', via: 'password', previousNpcId: null, firstAtPc: true }]);
    assert.equal(named('pc_signed_in:hot_desk').length, 1);
    assert.equal(named('pc_signed_out').length, 0);
    assert.deepEqual(calls, [['login', 'hot_desk', { username: 'sokafor', password: 'right-sam' }]]);
    assert.equal(s.has('hot_desk'), true);
    assert.equal(s.wasSignedIn('hot_desk'), true);
    assert.deepEqual(s.list(), [result.session]);
});

test('a refusal keeps no session and reports the reason: wrong, not permitted, locked out', async () => {
    const s = setup();
    const wrong = await s.signIn('hot_desk', 'sokafor', 'nope');
    assert.equal(wrong.ok, false);
    assert.equal(wrong.reason, 'wrong');
    assert.equal(wrong.attemptsLeft, 4);
    assert.equal(s.has('hot_desk'), false);

    const s2 = setup({ answer: () => { throw Object.assign(new Error('x'), { status: 422, body: { message: "This account can't sign in on this PC", notPermitted: true } }); } });
    const refused = await s2.signIn('ian_pc', 'sokafor', 'right-sam');
    assert.equal(refused.reason, 'not_permitted');
    assert.equal(refused.message, "This account can't sign in on this PC");

    const s3 = setup({ answer: () => { throw Object.assign(new Error('x'), { status: 422, body: { message: 'This account is locked on this PC', lockedOut: true, attemptsLeft: 0 } }); } });
    const locked = await s3.signIn('lockout_pc', 'sokafor', 'right-sam');
    assert.equal(locked.reason, 'locked_out');
    assert.equal(locked.lockedOut, true);
    assert.deepEqual(named('pc_signin_failed'), [{ pcId: 'lockout_pc', reason: 'locked_out', attemptsLeft: 0 }]);
    assert.equal(named('pc_signed_in').length + named('pc_signed_out').length, 0);
});

test('no answer from the server is an error, not a refusal, and emits nothing', async () => {
    const s = setup({ answer: () => { throw Object.assign(new Error('Failed to fetch')); } });
    const result = await s.signIn('hot_desk', 'sokafor', 'right-sam');
    assert.equal(result.ok, false);
    assert.equal(result.error, true);
    assert.equal(events.length, 0);
});

test('Sign out emits one pc_signed_out with the npcId, sends POST /logout and closes the open desktop', async () => {
    const s = setup();
    await s.signIn('hot_desk', 'sokafor', 'right-sam');
    const closed = [];
    s.registerDesktop('hot_desk', (message) => closed.push(message));
    events.length = 0; calls.length = 0;
    assert.equal(await s.signOut('hot_desk'), true);
    assert.deepEqual(named('pc_signed_out'), [{ pcId: 'hot_desk', npcId: 'sam', reason: 'sign_out' }]);
    assert.equal(named('pc_signed_out:hot_desk').length, 1);
    assert.deepEqual(calls, [['logout', 'hot_desk']]);
    assert.deepEqual(closed, [SIGNED_OUT_MESSAGE]);
    assert.equal(SIGNED_OUT_MESSAGE, 'Signed out');
    assert.equal(s.has('hot_desk'), false);
    assert.equal(s.wasSignedIn('hot_desk'), true, 'signed-in PCs are remembered for tasks');
    // A second sign-out has nothing to end
    assert.equal(await s.signOut('hot_desk'), false);
    assert.equal(named('pc_signed_out').length, 1);
});

test('a container 403 drops the session locally: one pc_signed_out, no request', async () => {
    const s = setup();
    await s.signIn('hot_desk', 'sokafor', 'right-sam');
    events.length = 0; calls.length = 0;
    assert.equal(s.dropLocal('hot_desk'), true);
    assert.deepEqual(named('pc_signed_out'), [{ pcId: 'hot_desk', npcId: 'sam', reason: 'no_session' }]);
    assert.deepEqual(calls, []);
    assert.equal(s.has('hot_desk'), false);
    assert.equal(s.dropLocal('hot_desk'), false);
    assert.equal(named('pc_signed_out').length, 1);
});

test('a switch keeps the first session through a wrong password, then signs the first out and the second in', async () => {
    const s = setup();
    await s.signIn('hot_desk', 'sokafor', 'right-sam');
    events.length = 0;
    const wrong = await s.signIn('hot_desk', 'ishaw', 'nope');
    assert.equal(wrong.ok, false);
    assert.equal(s.get('hot_desk').npcId, 'sam', 'Sam is still signed in');
    assert.equal(named('pc_signed_out').length, 0);

    events.length = 0;
    await s.signIn('hot_desk', 'ishaw', 'right-ian');
    const order = events.filter(([n]) => n === 'pc_signed_out' || n === 'pc_signed_in');
    assert.deepEqual(order, [
        ['pc_signed_out', { pcId: 'hot_desk', npcId: 'sam', reason: 'switch' }],
        ['pc_signed_in', { pcId: 'hot_desk', npcId: 'ian', username: 'ishaw', via: 'password', previousNpcId: 'sam', firstAtPc: false }]
    ]);
    assert.equal(s.get('hot_desk').npcId, 'ian');
});

test('on load, password sessions are kept and marked restored; a claimed session ends with POST /logout', async () => {
    const s = setup();
    s.load({
        ian_pc: { npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' },
        jake_pc: { npcId: 'jake', username: 'jbrooks', displayName: 'Jake Brooks', via: 'claim' }
    }, ['ian_pc', 'jake_pc', 'hot_desk']);
    await settle();
    assert.deepEqual(s.list(), [{ pcId: 'ian_pc', npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' }]);
    assert.deepEqual(calls, [['logout', 'jake_pc']]);
    assert.deepEqual(named('pc_signed_out'), [{ pcId: 'jake_pc', npcId: 'jake', reason: 'claim_ended' }]);
    assert.equal(named('pc_signed_in').length, 0, 'a kept session is not a new sign-in');
    assert.deepEqual(s.signedInPcs().sort(), ['hot_desk', 'ian_pc', 'jake_pc']);

    events.length = 0;
    s.desktopOpened('ian_pc');
    assert.deepEqual(named('pc_desktop_opened'), [{ pcId: 'ian_pc', npcId: 'ian', via: 'password', restored: true }]);
    await s.signIn('hot_desk', 'sokafor', 'right-sam');
    events.length = 0;
    s.desktopOpened('hot_desk');
    assert.equal(named('pc_desktop_opened')[0].restored, false);
});

test('the sign-in screen reports its tiles as usernames and a list for mapping conditions', () => {
    const s = setup();
    s.screenShown('known_pc', [{ username: 'sokafor' }, { username: 'lfox' }]);
    assert.deepEqual(named('pc_signin_shown'), [{ pcId: 'known_pc', usernames: ['sokafor', 'lfox'], usernameList: 'sokafor,lfox' }]);
    assert.equal(named('pc_signin_shown:known_pc').length, 1);
});

test('pc_signed_in tells a switch from a plain sign-in: previousNpcId and firstAtPc', async () => {
    // Task mappings tell "switched from Sam to Ian here" (previousNpcId) from "Ian signed in
    // here with no one signed in", and "the first sign-in at this PC" (firstAtPc) from a later one.
    const s = setup();
    await s.signIn('hot_desk', 'ishaw', 'right-ian');
    await s.signOut('hot_desk');
    await s.signIn('hot_desk', 'sokafor', 'right-sam');
    await s.signIn('hot_desk', 'ishaw', 'right-ian');
    assert.deepEqual(named('pc_signed_in').map(d => [d.npcId, d.previousNpcId, d.firstAtPc]), [
        ['ian', null, true],
        ['sam', null, false],
        ['ian', 'sam', false]
    ]);
    assert.deepEqual(named('pc_signed_out').map(d => [d.npcId, d.reason]), [['ian', 'sign_out'], ['sam', 'switch']]);

    // After a reload signedInPcs counts too, and a restored session is the previous account.
    const r = setup();
    r.load({ ian_pc: { npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' } }, ['ian_pc', 'hot_desk']);
    await r.signIn('hot_desk', 'sokafor', 'right-sam');
    await r.signIn('ian_pc', 'sokafor', 'right-sam');
    await r.signIn('lockout_pc', 'sokafor', 'right-sam');
    assert.deepEqual(named('pc_signed_in').map(d => [d.pcId, d.previousNpcId, d.firstAtPc]), [
        ['hot_desk', null, false],
        ['ian_pc', 'ian', false],
        ['lockout_pc', null, true]
    ]);
});

// ── Access model step 9 (5.4): the claim and when it ends ──────────────────────────────

const CLAIM_ANSWER = (pcId, fields) => {
    if (fields.claim === 'owner' && pcId === 'dana_pc') {
        return { success: true, npcId: 'dana', username: 'dreyes', displayName: 'Dana Reyes', via: 'claim' };
    }
    if (fields.claim === 'owner') {
        throw Object.assign(new Error('Sign in required'), { status: 422, body: { success: false, message: 'Sign in required' } });
    }
    const acct = ACCOUNTS[fields.username];
    if (!acct || acct.password !== fields.password) {
        throw Object.assign(new Error('x'), { status: 422, body: { success: false, message: 'Incorrect username or password', attemptsLeft: null } });
    }
    return { success: true, npcId: acct.npcId, username: fields.username, displayName: acct.displayName, via: 'password' };
};

test('step 9: a claim sends claim owner with the workstation globals and emits one pc_signed_in with via claim', async () => {
    const s = setup({ answer: CLAIM_ANSWER });
    window.gameState = { globalVariables: { dana_pc_screen_locked: false, dana_pc_owner_away: true } };
    const r = await s.claim('dana_pc');
    assert.equal(r.ok, true);
    assert.deepEqual(calls, [['login', 'dana_pc', { claim: 'owner', globals: { dana_pc_screen_locked: false, dana_pc_owner_away: true } }]]);
    assert.deepEqual(named('pc_signed_in'), [{ pcId: 'dana_pc', npcId: 'dana', username: 'dreyes', via: 'claim', previousNpcId: null, firstAtPc: true }]);
    assert.equal(named('pc_signed_in:dana_pc').length, 1);
    assert.deepEqual(s.get('dana_pc'), { pcId: 'dana_pc', npcId: 'dana', username: 'dreyes', displayName: 'Dana Reyes', via: 'claim' });
    // A refused claim keeps no session and emits nothing (the sign-in screen opens instead)
    events.length = 0;
    const refused = await s.claim('ian_pc');
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, 'refused');
    assert.equal(s.has('ian_pc'), false);
    assert.deepEqual(events, []);
    delete window.gameState;
});

test('step 9: a claim ends on the owner\'s return and on the auto lock; a password session on neither', async () => {
    const s = setup({ answer: CLAIM_ANSWER });
    const closed = [];
    await s.claim('dana_pc');
    s.registerDesktop('dana_pc', (msg) => closed.push(msg));
    await s.signIn('ian_pc', 'ishaw', 'right-ian');
    events.length = 0; calls.length = 0;
    await s.ownerReturned('ian_pc');
    await s.screenAutoLocked('ian_pc');
    assert.equal(s.has('ian_pc'), true, 'a password session is kept');
    assert.deepEqual(calls, []);
    await s.ownerReturned('dana_pc');
    assert.equal(s.has('dana_pc'), false);
    assert.deepEqual(calls, [['logout', 'dana_pc']]);
    assert.deepEqual(named('pc_signed_out'), [{ pcId: 'dana_pc', npcId: 'dana', reason: 'owner_returned', firstAtPc: true }]);
    assert.deepEqual(closed, ['Dana Reyes is back at the desk']);
    // The next claim there is not the first; the auto lock ends it with "The screen locked"
    events.length = 0; closed.length = 0;
    await s.claim('dana_pc');
    assert.equal(named('pc_signed_in')[0].firstAtPc, false);
    s.registerDesktop('dana_pc', (msg) => closed.push(msg));
    await s.screenAutoLocked('dana_pc');
    assert.deepEqual(named('pc_signed_out'), [{ pcId: 'dana_pc', npcId: 'dana', reason: 'auto_locked', firstAtPc: false }]);
    assert.deepEqual(closed, ['The screen locked']);
});

test('step 9: the workstation events reach the claim through the dispatcher', async () => {
    const s = setup({ answer: CLAIM_ANSWER });
    const handlers = {};
    window.eventDispatcher.on = (pattern, cb) => { handlers[pattern] = cb; };
    s.listen();
    s.listen();   // idempotent
    assert.deepEqual(Object.keys(handlers).sort(), ['workstation_auto_locked:*', 'workstation_owner_returned:*']);
    await s.claim('dana_pc');
    events.length = 0;
    handlers['workstation_owner_returned:*']({ objectId: 'dana_pc', ownerId: 'dana' });
    await settle();
    assert.deepEqual(named('pc_signed_out').map(d => d.reason), ['owner_returned']);
    delete window.eventDispatcher.on;
});

test('step 9: on load, every claimed session restored from sessions is signed out, each with one pc_signed_out', async () => {
    const s = setup();
    s.load({
        dana_pc: { npcId: 'dana', username: 'dreyes', displayName: 'Dana Reyes', via: 'claim' },
        kai_pc: { npcId: 'kai', username: 'kbrennan', displayName: 'Kai Brennan', via: 'claim' },
        ian_pc: { npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' }
    }, ['dana_pc', 'kai_pc', 'ian_pc']);
    await settle();
    assert.deepEqual(calls.sort(), [['logout', 'dana_pc'], ['logout', 'kai_pc']]);
    assert.deepEqual(named('pc_signed_out').map(d => [d.pcId, d.npcId, d.reason]).sort(),
        [['dana_pc', 'dana', 'claim_ended'], ['kai_pc', 'kai', 'claim_ended']]);
    assert.deepEqual(s.list().map(x => x.pcId), ['ian_pc']);
    assert.deepEqual(s.signedInPcs().sort(), ['dana_pc', 'ian_pc', 'kai_pc']);
});

test('step 9: the owner-present message names the owner and reports pc_in_use with whether the PC was signed in before', () => {
    const s = setup();
    s.inUseShown('dana_pc', 'dana');
    s.signedIn.add('dana_pc');
    s.inUseShown('dana_pc', 'dana');
    assert.deepEqual(named('pc_in_use'), [
        { pcId: 'dana_pc', ownerId: 'dana', signedInBefore: false },
        { pcId: 'dana_pc', ownerId: 'dana', signedInBefore: true }
    ]);
});
