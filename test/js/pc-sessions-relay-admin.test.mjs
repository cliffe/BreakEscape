// S5 ruling B (unit 06): a relay entry keeps the server's `access`. The relay answer shape is
// taken from test/fixtures/files/ops_unchanged/harvest_relay_test_access_keyring.json
// (step relay_signin_jake_pc; the later answers fixture of this stage is not recorded yet),
// plus the `access: 'admin'` the relay level fix adds. The literal-entry cases test predicates.
// Run with: node test/js/pc-sessions-relay-admin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const { PcSessions } =
    await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8').split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(readFileSync(join(js, 'utils/sync-before-fetch.js'), 'utf8'))}'`).split("'./mfa-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/mfa-client.js'), 'utf8'))}'`).split("'./helpdesk-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/helpdesk-client.js'), 'utf8'))}'`)));

const golden = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_unchanged/harvest_relay_test_access_keyring.json'), 'utf8'));
const relayBody = golden.expected.answers.find(a => a.id === 'relay_signin_jake_pc').body;

let next;
function setup() {
    window.eventDispatcher = { emit: () => {} };
    window.networkLinks = { get: () => null };
    window.ApiClient = { loginWithCredential: async () => next, logout: async () => ({ success: true }), lockSession: async () => ({ success: true }) };
    return new PcSessions();
}

test('the relay sign-in answer as pinned today has no access: the entry is a user', async () => {
    const s = setup();
    next = { ...relayBody };
    assert.equal('access' in next, false);
    const r = await s.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    assert.equal(r.ok, true);
    assert.equal(s.isRelay('jake_pc'), true);
    assert.equal(s.sessionAdmin('jake_pc'), false);
});

test('a relay sign-in answer with access admin keeps it: sessionAdmin true, keyboardAdmin false', async () => {
    const s = setup();
    next = { ...relayBody, access: 'admin' };
    const r = await s.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    assert.equal(r.ok, true);
    assert.equal(r.session.access, 'admin');
    assert.equal(s.sessionAdmin('jake_pc'), true);
    assert.equal(s.keyboardAdmin('jake_pc'), false);
});

test('only a strict access admin counts on a relay answer', async () => {
    for (const access of ['user', 'Admin', true, 1, null]) {
        const s = setup();
        next = { ...relayBody, access };
        await s.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
        assert.equal(s.sessionAdmin('jake_pc'), false, String(access));
    }
});

test('literal entries: a relay entry with access admin is sessionAdmin and never keyboardAdmin; locked is neither', () => {
    const s = setup();
    s.sessions.set('rl', { npcId: 'jake', relay: true, host: 'H', access: 'admin' });
    assert.equal(s.sessionAdmin('rl'), true);
    assert.equal(s.keyboardAdmin('rl'), false);
    s.sessions.set('rl', { npcId: 'jake', relay: true, host: 'H', access: 'admin', locked: true });
    assert.equal(s.sessionAdmin('rl'), false);
});
