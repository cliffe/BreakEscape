// Lock second step, the push part of the pane (ops layer S8c unit 19). The real multi-factor client
// runs over a request function that answers from the shared fixture.
// Run with: bin/test-js test/js/lock-step-push.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const M = await import(pathToFileURL(join(js, 'systems/mfa-client.js')).href);
const { mountPush } = await import(pathToFileURL(join(js, 'ui/lock-step-push.js')).href);

const tick = () => new Promise((r) => setImmediate(r));
function answer(name) {
    const a = loadAnswer(name);
    if (a.status >= 200 && a.status < 300) return a.body;
    const e = new Error('refused');
    e.status = a.status;
    e.body = a.body;
    throw e;
}

// routes: { 'mfa/prompt': [names], 'mfa/approve': [names], 'mfa/phone': [names] } consumed in order, the last repeats
function setup(routes, { phone = true, ctx = {} } = {}) {
    const calls = [];
    const timers = [];
    M.reset();
    M.configure({
        request: async (method, path, payload) => {
            calls.push({ method, path, payload });
            const list = routes[path];
            const name = list.length > 1 ? list.shift() : list[0];
            return answer(name);
        },
        emit: () => {}, now: () => 1000
    });
    window.inventory = { items: phone ? [{ scenarioData: { id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Moira phone' } }] : [] };
    document.body.textContent = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const settled = [];
    const handle = mountPush(host, {
        subject: 'object:moira_locker', npcId: 'moira', kind: 'push', ownerName: 'Moira', mfa: M,
        setTimer: (fn, ms) => timers.push({ fn, ms }), ...ctx
    }, (o) => settled.push(o));
    return { calls, timers, host, settled, handle };
}
const buttons = (host) => [...host.querySelectorAll('button')];
const byText = (host, t) => buttons(host).find((b) => b.textContent === t);

test('the first request goes out on mount; the count and the wait come from the answer', async () => {
    const { calls, handle, timers } = setup({ 'mfa/prompt': ['prompt_waiting'] }, { phone: false });
    await tick();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { method: 'POST', path: 'mfa/prompt', payload: { target_type: 'object', target_id: 'moira_locker' } });
    const s = handle.getTestState();
    assert.equal(s.status, "A request was sent to Moira's phone.");
    assert.equal(s.count, loadAnswer('prompt_waiting').body.promptsSent);
    assert.equal(s.sendAgainDisabled, true);
    assert.equal(timers[0].ms, 2000);
    assert.equal(s.checkPhone, null);
});

test('send again is disabled for the wait, then sends another request', async () => {
    const { calls, handle, timers, host } = setup({ 'mfa/prompt': ['prompt_waiting'] }, { phone: false });
    await tick();
    timers[0].fn();
    assert.equal(handle.getTestState().sendAgainDisabled, false);
    byText(host, 'Send again').click();
    await tick();
    assert.equal(calls.length, 2);
});

test('too soon holds Send again for the server wait', async () => {
    const { handle, timers } = setup({ 'mfa/prompt': ['prompt_too_soon'] }, { phone: false });
    await tick();
    assert.equal(timers[0].ms, loadAnswer('prompt_too_soon').body.retryAfterS * 1000);
    assert.equal(handle.getTestState().sendAgainDisabled, true);
    assert.match(handle.getTestState().message, /Wait a moment/);
});

test('prompt_passed settles passed; prompt_expired settles expired; once only', async () => {
    const a = setup({ 'mfa/prompt': ['prompt_passed'] });
    await tick();
    assert.deepEqual(a.settled, ['passed']);
    const b = setup({ 'mfa/prompt': ['prompt_expired'] });
    await tick();
    assert.deepEqual(b.settled, ['expired']);
    byText(b.host, 'Send again').click();
    await tick();
    assert.deepEqual(b.settled, ['expired']);
});

test('a number-match gate shows its number', async () => {
    const n = loadAnswer('gate_number').body.number;
    const { handle } = setup({ 'mfa/prompt': ['prompt_waiting'] }, { ctx: { kind: 'push_number_match', number: n } });
    await tick();
    assert.equal(handle.getTestState().number, `Number: ${n}`);
});

test('the phone button only with the owner\'s phone', async () => {
    const without = setup({ 'mfa/prompt': ['prompt_waiting'] }, { phone: false });
    assert.equal(byText(without.host, "Check Moira's phone"), undefined);
    const right = setup({ 'mfa/prompt': ['prompt_waiting'] });
    assert.ok(byText(right.host, "Check Moira's phone"));
    // another owner's phone is not this owner's
    window.inventory = { items: [{ scenarioData: { type: 'phone_friendface', owner: 'priya' } }] };
    const h = mountPush(document.createElement('div'), { subject: 'object:x', npcId: 'moira', mfa: M, ownerName: 'Moira', setTimer() {} }, () => {});
    assert.equal(h.getTestState().checkPhone, null);
});

test('check phone draws one card; approve passes', async () => {
    const { calls, host, settled, handle } = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['phone_one_request'], 'mfa/approve': ['approve_passed'] });
    await tick();
    byText(host, "Check Moira's phone").click();
    await tick();
    const phone = calls.find((c) => c.path === 'mfa/phone');
    assert.deepEqual(phone.payload, { npc_id: 'moira', target_type: 'object', target_id: 'moira_locker' });
    const st = handle.getTestState();
    assert.equal(st.card.name, loadAnswer('phone_one_request').body.requests[0].name);
    assert.deepEqual(st.card.buttons, ['Approve', 'Deny']);
    byText(host, 'Approve').click();
    await tick();
    assert.deepEqual(settled, ['passed']);
    assert.deepEqual(calls.at(-1).payload, { target_type: 'object', target_id: 'moira_locker' });
});

test('deny settles denied', async () => {
    const { calls, host, settled } = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['phone_one_request'], 'mfa/approve': ['approve_cancelled'] });
    await tick();
    byText(host, "Check Moira's phone").click();
    await tick();
    byText(host, 'Deny').click();
    await tick();
    assert.equal(calls.at(-1).payload.deny, true);
    assert.deepEqual(settled, ['denied']);
});

test('number matching: three numbers unmarked, in the order given, and Deny', async () => {
    const req = loadAnswer('phone_number_request').body.requests[0];
    const { host, calls, settled, handle } = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['phone_number_request'], 'mfa/approve': ['approve_cancelled'] },
        { ctx: { kind: 'push_number_match', number: 47, subject: 'object:priya_safe' } });
    await tick();
    byText(host, "Check Moira's phone").click();
    await tick();
    assert.deepEqual(handle.getTestState().card.buttons, [...req.numbers.map(String), 'Deny']);
    const nums = host.querySelectorAll('.lock-step-push-num');
    for (const b of nums) assert.equal(b.className, 'lock-step-push-btn lock-step-push-num');
    // a wrong number is refused by the server and settles denied
    const wrong = req.numbers.find((n) => n !== 47);
    byText(host, String(wrong)).click();
    await tick();
    assert.equal(calls.at(-1).payload.number, wrong);
    assert.deepEqual(settled, ['denied']);
});

test('no request on the phone, and a lost phone', async () => {
    const a = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['phone_one_request'] }, { ctx: { subject: 'object:other_lock' } });
    await tick();
    byText(a.host, "Check Moira's phone").click();
    await tick();
    assert.equal(a.handle.getTestState().card, null);
    assert.match(a.handle.getTestState().message, /no request/i);
    const b = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['no_phone'] });
    await tick();
    byText(b.host, "Check Moira's phone").click();
    await tick();
    assert.match(b.handle.getTestState().message, /no longer have/);
    assert.equal(b.handle.getTestState().checkPhone.disabled, true);
});

test('hostile owner and lock names render as text', async () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { host, handle } = setup({ 'mfa/prompt': ['prompt_waiting'], 'mfa/phone': ['phone_one_request'] }, { ctx: { ownerName: evil } });
    window.inventory.items[0].scenarioData.name = evil;
    await tick();
    assert.equal(host.querySelector('img'), null);
    assert.ok(host.textContent.includes(evil));
    assert.equal(handle.getTestState().status.includes(evil), true);
});

test('destroy ends the part: a late answer settles nothing', async () => {
    const { handle, settled } = setup({ 'mfa/prompt': ['prompt_passed'] });
    handle.destroy();
    await tick();
    assert.deepEqual(settled, []);
});
