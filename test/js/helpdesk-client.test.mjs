// Helpdesk client (ops layer S8b unit 08). The real helpdesk-client.js, no DOM. Every server
// answer comes from the shared fixture. Run with: node test/js/helpdesk-client.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const H = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/helpdesk-client.js')).href);

function setup(name, patch) {
    const a = patch ? answerWith(name, patch) : answer(name);
    const calls = [];
    const events = [];
    const globals = [];
    const granted = [];
    H.reset();
    H.configure({
        request: async (path, payload) => {
            calls.push({ path, payload });
            if (a.status >= 200 && a.status < 300) return a.body;
            throw Object.assign(new Error('x'), { status: a.status, body: a.body });
        },
        emit: (n, d) => events.push({ n, d }),
        setGlobal: (n, v) => globals.push({ n, v }),
        onGranted: (b) => granted.push(b)
    });
    return { calls, events, globals, granted };
}
const ask = { deskId: 'it_desk', username: 'v.dunne', what: 'password', answers: { staff_no: '1' } };

for (const [name, want] of [
    ['helpdesk.granted_password', 'granted'], ['helpdesk.granted_mfa', 'granted'],
    ['helpdesk.refused', 'refused'], ['helpdesk.refused_last', 'refused'],
    ['helpdesk.blocked', 'blocked'], ['helpdesk.unavailable', 'unavailable'],
    ['helpdesk.not_found', 'error'], ['helpdesk.bad_request', 'error']
]) {
    test(`${name} gives ${want}, the global and both events`, async () => {
        const s = setup(name);
        const out = await H.send(ask);
        assert.equal(out.result, want);
        assert.deepEqual(out.body, answer(name).body);
        assert.deepEqual(s.globals, [{ n: 'helpdesk_it_desk_result', v: want }]);
        const detail = { deskId: 'it_desk', result: want };
        if (want === 'granted') detail.what = answer(name).body.what; // which reset it was
        assert.deepEqual(s.events, [
            { n: 'helpdesk_answered', d: detail },
            { n: 'helpdesk_answered:it_desk', d: detail }
        ]);
        assert.equal(s.granted.length, want === 'granted' ? 1 : 0);
    });
}

test('a network failure and an unreadable answer are errors', async () => {
    H.reset();
    H.configure({ request: async () => { throw new Error('down'); }, emit() {}, setGlobal() {} });
    assert.equal((await H.send(ask)).result, 'error');
    H.configure({ request: async () => 'not an object', emit() {}, setGlobal() {} });
    assert.equal((await H.send(ask)).result, 'error');
});

test('the password is in no global, event or module state', async () => {
    const s = setup('helpdesk.granted_password');
    const pw = answer('helpdesk.granted_password').body.password;
    await H.send(ask);
    assert.ok(!JSON.stringify(s.globals).includes(pw));
    assert.ok(!JSON.stringify(s.events).includes(pw));
    assert.equal(s.granted[0].password, pw); // only the grant hook sees it
    const mod = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/helpdesk-client.js')).href);
    assert.ok(!JSON.stringify(Object.entries(mod).map(([k, v]) => (typeof v === 'function' ? k : v))).includes(pw));
});

test('pcId is sent when given and omitted when not', async () => {
    let s = setup('helpdesk.refused');
    await H.send({ ...ask, pcId: 'front_pc' });
    assert.equal(s.calls[0].path, 'helpdesk/request');
    assert.deepEqual(s.calls[0].payload, { desk_id: 'it_desk', username: 'v.dunne', what: 'password', answers: { staff_no: '1' }, pc_id: 'front_pc' });
    s = setup('helpdesk.refused');
    await H.send(ask);
    assert.ok(!('pc_id' in s.calls[0].payload));
});

test('the default onGranted refreshes the keyring and reseeds lockouts, only on a grant', async () => {
    const a = answerWith('helpdesk.granted_password', { 'body.lockoutPcIds': ['vault_pc', 'ops_pc'] });
    const refused = answer('helpdesk.refused');
    let mode = a;
    const seeded = [];
    let refreshed = 0;
    globalThis.window = { keyring: { refresh() { refreshed++; } }, npcReports: { seedLockouts(l) { seeded.push(l); } } };
    try {
        H.reset();
        H.configure({
            request: async () => { if (mode.status === 200) return mode.body; throw Object.assign(new Error('x'), { status: mode.status, body: mode.body }); },
            emit() {}, setGlobal() {}
        });
        await H.send(ask);
        assert.equal(refreshed, 1);
        assert.deepEqual(seeded, [['vault_pc', 'ops_pc']]);
        mode = refused;
        await H.send(ask);
        assert.equal(refreshed, 1);
        assert.equal(seeded.length, 1);
    } finally { delete globalThis.window; }
});

test('formFor reads the bootstrap forms, from configure or window', async () => {
    const forms = answer('bootstrap.helpdesk_forms').body;
    H.reset();
    H.configure({ forms });
    const f = H.formFor('it_desk');
    assert.deepEqual(f, forms.it_desk);
    assert.equal(H.formFor('nope'), null);
    assert.equal(H.formFor('__proto__'), null);
    H.reset();
    assert.equal(H.formFor('it_desk'), null);
    globalThis.window = { gameScenario: { helpdeskForms: forms } };
    try { assert.deepEqual(H.formFor('it_desk'), forms.it_desk); } finally { delete globalThis.window; }
});
