// S8b unit 09: the own-phone forms of the MFA client. Every server answer comes from the shared
// fixture through helpdesk-answers.mjs. Run with: node test/js/mfa-client-own.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/mfa-client.js')).href);

// A request function that serves a shared answer: 2xx resolves the body, anything else rejects.
function serve(name, patch) {
    const a = patch ? answerWith(name, patch) : answer(name);
    if (a.status >= 200 && a.status < 300) return a.body;
    const e = new Error('x'); e.status = a.status; e.body = a.body; throw e;
}
function setup(handler) {
    const events = [];
    const calls = [];
    let t = 1000;
    M.reset();
    M.configure({
        request: async (method, path, payload) => { calls.push({ method, path, payload }); return handler(method, path, payload); },
        onSession: () => {},
        emit: (name, detail) => events.push({ name, detail }),
        now: () => t
    });
    return { events, calls, tick: (ms) => { t += ms; } };
}
const OWN_PENDING = () => answer('login.mfa_required_own_code').body;

test('readDevice({ npcId }) asks for the own phone and keeps the code as an own read', async () => {
    const { calls } = setup(() => serve('device.own'));
    const res = await M.readDevice({ npcId: 'vera' });
    assert.deepEqual(calls[0], { method: 'GET', path: 'mfa/device', payload: { npc_id: 'vera' } });
    assert.equal(res.ok, true);
    assert.equal(res.deviceId, 'own:vera');
    M.noteRequired('pc:vault_pc', OWN_PENDING());
    assert.equal(M.codeFor(M.pendingFor('pc:vault_pc')), answer('device.own').body.code);
});

test('an item read is unchanged: item_id on the wire, and it never fills an ownPhone pane', async () => {
    const { calls } = setup(() => answerWith('device.own', { 'body.deviceId': 'vera_fob' }).body);
    await M.readDevice({ itemId: 'vera_fob' });
    assert.deepEqual(calls[0].payload, { item_id: 'vera_fob' });
    M.noteRequired('pc:vault_pc', OWN_PENDING());
    assert.equal(M.codeFor(M.pendingFor('pc:vault_pc')), null);
    const plain = { ...OWN_PENDING() }; delete plain.ownPhone;
    M.noteRequired('pc:other', plain);
    assert.equal(M.codeFor(M.pendingFor('pc:other')), answer('device.own').body.code);
});

test('an own read never fills an item pane', async () => {
    setup(() => serve('device.own'));
    await M.readDevice({ npcId: 'vera' });
    const plain = { ...OWN_PENDING() }; delete plain.ownPhone;
    M.noteRequired('pc:other', plain);
    assert.equal(M.codeFor(M.pendingFor('pc:other')), null);
});

test('the own code is for the same npcId only, and goes stale after a step', async () => {
    const { tick } = setup(() => serve('device.own'));
    await M.readDevice({ npcId: 'vera' });
    M.noteRequired('pc:p', { ...OWN_PENDING(), npcId: 'wim' });
    assert.equal(M.codeFor(M.pendingFor('pc:p')), null);
    M.noteRequired('pc:p', OWN_PENDING());
    assert.ok(M.codeFor(M.pendingFor('pc:p')));
    tick(61000);
    assert.equal(M.codeFor(M.pendingFor('pc:p')), null);
});

test('a used own code is not kept', async () => {
    setup(() => serve('device.own_used'));
    const res = await M.readDevice({ npcId: 'vera' });
    assert.equal(res.ok, true);
    M.noteRequired('pc:vault_pc', OWN_PENDING());
    assert.equal(M.codeFor(M.pendingFor('pc:vault_pc')), null);
});

test('device.unenrolled clears an item read of that device', async () => {
    let name = 'device.own';
    setup(() => (name === 'device.own' ? answerWith('device.own', { 'body.deviceId': 'vera_fob' }).body : serve(name)));
    await M.readDevice({ itemId: 'vera_fob' });
    const plain = { ...OWN_PENDING() }; delete plain.ownPhone;
    M.noteRequired('pc:p', plain);
    assert.ok(M.codeFor(M.pendingFor('pc:p')));
    name = 'device.unenrolled';
    const res = await M.readDevice({ itemId: 'vera_fob' });
    assert.equal(res.enrolled, false);
    assert.equal(M.codeFor(M.pendingFor('pc:p')), null);
});

test('no such device is no_device', async () => {
    setup(() => serve('device.no_device'));
    const res = await M.readDevice({ npcId: 'vera' });
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'no_device');
});

test('phone({ own: true }) asks for the own list', async () => {
    const { calls } = setup(() => serve('phone.own'));
    const res = await M.phone({ own: true });
    assert.deepEqual(calls[0], { method: 'GET', path: 'mfa/phone', payload: { own: 1 } });
    assert.deepEqual(res.requests, answer('phone.own').body.requests);
    setup(() => serve('phone.own_number_match'));
    const nm = await M.phone({ own: true });
    assert.deepEqual(nm.requests[0].numbers, answer('phone.own_number_match').body.requests[0].numbers);
});

test('phone({ own: true }) with no re-enrolled account is no_phone; the held phone call is unchanged', async () => {
    setup(() => serve('phone.no_phone'));
    assert.equal((await M.phone({ own: true })).reason, 'no_phone');
    const { calls } = setup(() => serve('phone.own'));
    await M.phone({ npcId: 'wim' });
    assert.deepEqual(calls[0].payload, { npc_id: 'wim' });
});

test('an approval on an ownPhone note emits mfa_approved by own_phone', async () => {
    const { events, calls } = setup(() => serve('approve.own_passed'));
    M.noteRequired('pc:ops_pc', answer('login.mfa_required_own_push').body);
    const res = await M.approve('pc:ops_pc', {});
    assert.equal(res.passed, true);
    assert.deepEqual(calls[0].payload, { pc_id: 'ops_pc', own: 1 });
    const ev = events.filter(e => e.name.startsWith('mfa_approved'));
    assert.equal(ev.length, 2);
    assert.ok(ev.every(e => e.detail.by === 'own_phone'));
});

test('an approval on a note without ownPhone keeps the server by', async () => {
    const held = serve('approve.own_passed'); held.approvedBy = 'player';
    const { events, calls } = setup(() => held);
    const plain = answer('login.mfa_required_own_push').body; delete plain.ownPhone;
    M.noteRequired('pc:ops_pc', plain);
    await M.approve('pc:ops_pc', {});
    assert.deepEqual(calls[0].payload, { pc_id: 'ops_pc' });
    assert.equal(events.find(e => e.name === 'mfa_approved').detail.by, 'player');
});

test('a code sign-in on an ownPhone note is still by code', async () => {
    const { events } = setup(() => serve('verify.own_passed'));
    M.noteRequired('pc:vault_pc', OWN_PENDING());
    await M.verify('pc:vault_pc', '123456');
    assert.notEqual(events.find(e => e.name === 'mfa_approved').detail.by, 'own_phone');
});
