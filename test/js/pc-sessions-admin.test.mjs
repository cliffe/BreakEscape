// Privilege S5a unit 09 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md P674-718): systems/pc-sessions.js and the
// admin level on the mirror. `access` survives publicSession and the bootstrap adopt, is dropped at
// a lock, is cleared by a later answer without it and by a desktop 403 'off' / 'not_responding';
// sessionAdmin, keyboardAdmin and plantAdmin read only the server's `access`.
// Run with: node test/js/pc-sessions-admin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const { PcSessions, sessionAdmin, keyboardAdmin, plantAdmin } =
    await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8').split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(readFileSync(join(js, 'utils/sync-before-fetch.js'), 'utf8'))}'`).split("'./mfa-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/mfa-client.js'), 'utf8'))}'`)));
await import(dataUrl(readFileSync(join(js, 'systems/pc-policy.js'), 'utf8')));

let events, held, next;
function setup() {
    events = []; held = new Set(['f1']); next = {};
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.networkLinks = { get: (id) => (held.has(id) ? { id } : null) };
    window.ApiClient = {
        logout: async () => ({ success: true }),
        lockSession: async () => ({ success: true }),
        login: async () => next,
        loginWithCredential: async () => next
    };
    return new PcSessions();
}
const KB = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password', access: 'admin' };
const REMOTE = { npcId: 'lena', username: 'lena', displayName: 'Lena', via: 'credential', kind: 'saved_connection', remote: true, footholdId: 'f1', host: 'PC', access: 'admin' };
const TECH = { npcId: 'adm', username: 'adm', displayName: 'Admin', via: 'technique', remote: true, footholdId: 'f1', host: 'PC', access: 'admin' };

test('access survives publicSession and the bootstrap adopt; a locked entry carries none', () => {
    const s = setup();
    s.load({ a: { ...KB }, b: { ...KB, locked: true }, c: { ...KB, access: undefined } }, ['a', 'b', 'c']);
    assert.equal(s.get('a').access, 'admin');
    assert.equal('access' in s.get('b'), false);
    assert.equal(s.get('b').locked, true);
    assert.equal('access' in s.get('c'), false);
});

test('sessionAdmin: keyboard, remote and relay-free admin entries true; locked, absent, user false', () => {
    const s = setup();
    s.load({ a: { ...KB }, r: { ...REMOTE }, u: { ...KB, access: undefined }, l: { ...KB, locked: true } }, ['a', 'r', 'u', 'l']);
    assert.equal(s.sessionAdmin('a'), true);
    assert.equal(s.sessionAdmin('r'), true, 'a remote admin entry');
    assert.equal(s.sessionAdmin('u'), false);
    assert.equal(s.sessionAdmin('l'), false, 'a locked entry that had access');
    assert.equal(s.sessionAdmin('nobody'), false);
});

test('a relay entry is admin only if the server sent access; never keyboard admin', () => {
    const s = setup();
    s.sessions.set('rl', { npcId: 'x', relay: true, host: 'H', access: 'admin' });
    assert.equal(s.sessionAdmin('rl'), true, 'the server decides which entries carry access');
    assert.equal(s.keyboardAdmin('rl'), false);
    s.sessions.set('rl2', { npcId: 'x', relay: true, host: 'H' });
    assert.equal(s.sessionAdmin('rl2'), false, 'a relay entry as the server sends it has no access');
});

test('locking a session deletes access in the same step', async () => {
    const s = setup();
    s.load({ a: { ...KB } }, ['a'], true);
    assert.equal(s.sessionAdmin('a'), true);
    const out = await s.lockSession('a');
    assert.equal(out.ok, true);
    assert.equal(s.sessionAdmin('a'), false);
    assert.equal('access' in s.sessions.get('a'), false, 'the stored entry has none either');
    assert.equal('access' in s.get('a'), false);
});

test('a later sign-in answer without access clears it; with access sets it', async () => {
    const s = setup();
    next = { success: true, npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password', access: 'admin' };
    await s.signIn('pc1', 'sam', 'pw');
    assert.equal(s.sessionAdmin('pc1'), true);
    next = { success: true, npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password' };
    await s.signIn('pc1', 'sam', 'pw');
    assert.equal(s.sessionAdmin('pc1'), false);
    assert.equal('access' in s.get('pc1'), false);
});

test('a desktop 403 off or not_responding drops access from that entry; other reasons do not', () => {
    const s = setup();
    s.load({ a: { ...KB }, b: { ...KB }, c: { ...KB } }, ['a', 'b', 'c']);
    assert.equal(s.noteDesktopRefused('a', 'off'), true);
    assert.equal(s.sessionAdmin('a'), false);
    assert.equal(s.has('a'), true, 'the session itself stays');
    assert.equal(s.noteDesktopRefused('b', 'not_responding'), true);
    assert.equal(s.sessionAdmin('b'), false);
    assert.equal(s.noteDesktopRefused('c', 'no_session'), false);
    assert.equal(s.sessionAdmin('c'), true);
    assert.equal(s.noteDesktopRefused('nobody', 'off'), false);
});

test('keyboardAdmin: true only for a keyboard admin entry', () => {
    const s = setup();
    s.load({ kb: { ...KB }, remote: { ...REMOTE }, tech: { ...TECH }, user: { ...KB, access: undefined } }, ['kb', 'remote', 'tech', 'user']);
    assert.equal(s.keyboardAdmin('kb'), true);
    assert.equal(s.keyboardAdmin('remote'), false);
    assert.equal(s.keyboardAdmin('tech'), false, 'a technique copy carries remote and a foothold');
    assert.equal(s.keyboardAdmin('user'), false);
    assert.equal(s.keyboardAdmin('nobody'), false);
    // each field alone
    s.sessions.set('f', { ...KB, footholdId: 'f1' });
    s.sessions.set('fr', { ...KB, fromPcId: 'other' });
    s.sessions.set('rm', { ...KB, remote: true });
    s.sessions.set('rl', { ...KB, relay: true });
    for (const id of ['f', 'fr', 'rm', 'rl']) assert.equal(s.keyboardAdmin(id), false, id);
});

test('plantAdmin follows the grant PC for a sam_dock-shaped object, the object id for one with no grant', () => {
    const s = setup();
    s.load({ sam_pc: { ...KB }, dock: { ...KB, access: undefined }, plain_pc: { ...KB } }, ['sam_pc', 'dock', 'plain_pc']);
    const samDock = { id: 'dock', triggerOnInteract: [{ type: 'confirm_action', onConfirm: [{ type: 'grant_foothold', needsSession: true, pc: 'sam_pc' }] }] };
    assert.equal(s.plantAdmin(samDock), true, 'the grant PC, not the socket id (which holds no admin entry)');
    s.sessions.set('sam_pc', { ...KB, remote: true, footholdId: 'f1' });
    assert.equal(s.plantAdmin(samDock), false, 'a remote admin entry at the grant PC is not keyboard admin');
    assert.equal(s.plantAdmin({ id: 'plain_pc' }), true, 'no grant: the object id');
    assert.equal(s.plantAdmin({ id: 'dock' }), false);
    assert.equal(s.plantAdmin(null), false);
});

test('the plain-function exports read the shared mirror', () => {
    assert.equal(sessionAdmin('nobody'), false);
    assert.equal(keyboardAdmin('nobody'), false);
    assert.equal(plantAdmin({ id: 'nobody' }), false);
});

test('settle: off then on brings the level back from the answer, and only from the answer', () => {
    const s = setup();
    s.load({ a: { ...KB } }, ['a']);
    s.noteDesktopRefused('a', 'off');
    assert.equal(s.sessionAdmin('a'), false);
    s.settle('a', { npcId: 'sam', access: 'admin' });
    assert.equal(s.sessionAdmin('a'), true);
    assert.equal(s.keyboardAdmin('a'), true);
    s.settle('a', { npcId: 'sam' });
    assert.equal(s.sessionAdmin('a'), false, 'an answer without access clears it');
    assert.equal('access' in s.sessions.get('a'), false);
    s.settle('a', { npcId: 'sam', access: 'user' });
    assert.equal(s.sessionAdmin('a'), false, 'only the word admin counts');
});

test('settle: a reload while the PC is off (no access in the bootstrap), then on', () => {
    const s = setup();
    s.load({ a: { ...KB, access: undefined } }, ['a']);
    assert.equal(s.sessionAdmin('a'), false);
    s.settle('a', { npcId: 'sam', access: 'admin' });
    assert.equal(s.sessionAdmin('a'), true);
});

test('settle: a locked entry never gains the level; a technique entry gets it back after not_responding', () => {
    const s = setup();
    s.load({ a: { ...KB, locked: true }, t: { ...TECH } }, ['a', 't']);
    s.settle('a', { npcId: 'sam', access: 'admin' });
    assert.equal(s.sessionAdmin('a'), false);
    assert.equal('access' in s.sessions.get('a'), false);
    s.noteDesktopRefused('t', 'not_responding');
    assert.equal(s.sessionAdmin('t'), false);
    s.settle('t', { npcId: 'adm', remote: true, footholdId: 'f1', host: 'PC', access: 'admin' });
    assert.equal(s.sessionAdmin('t'), true);
});

test('a repeat technique grant (the answer has already: true) after access was dropped restores it with no sign-in events', () => {
    const s = setup();
    s.load({ t: { ...TECH } }, ['t']);
    s.noteDesktopRefused('t', 'not_responding');
    events.length = 0;
    const out = s.noteTechniqueSession('t', { ...TECH }, null, null, true);
    assert.equal(s.sessionAdmin('t'), true);
    assert.deepEqual(events, [], 'no pc_signed_out or pc_signed_in for the same copy');
    assert.equal(out.access, 'admin');
    // and a repeat without access clears it in place, again with no events
    s.noteTechniqueSession('t', { ...TECH, access: undefined }, null, null, true);
    assert.equal(s.sessionAdmin('t'), false);
    assert.deepEqual(events, []);
});
