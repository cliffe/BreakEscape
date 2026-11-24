// S8b unit 16: the own-phone scenes. code-device started with { own: true, npcId } draws "My phone"
// and reads through the real MfaClient.readDevice({ npcId }); authenticator-live started with
// { own: true } lists MfaClient.phone({ own: true }). Every server answer comes from the shared
// fixture through helpdesk-answers.mjs; the client is the real mfa-client.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'own-phone-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/code-device/code-device-minigame.js',
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/authenticator/authenticator-live-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js',
    'utils/author-html.js', 'utils/npc-headshot.js', 'ui/modal-stack.js', 'systems/global-writer.js',
    'systems/mfa-client.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.Event = dom.window.Event;
console.log = () => {};
console.warn = () => {};
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { CodeDeviceMinigame } = await load('minigames/code-device/code-device-minigame.js');
const { AuthenticatorLiveMinigame } = await load('minigames/authenticator/authenticator-live-minigame.js');
const M = await load('systems/mfa-client.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('code-device', CodeDeviceMinigame);
FW.registerScene('authenticator-live', AuthenticatorLiveMinigame);

const tick = () => new Promise((r) => setTimeout(r, 0));
const noSched = { schedule: () => 1, clearScheduled: () => {}, pollMs: 0 };

// The real client, served by shared answers (2xx resolves the body, anything else rejects).
function serve(name, patch) {
    const a = patch ? answerWith(name, patch) : answer(name);
    if (a.status >= 200 && a.status < 300) return a.body;
    const e = new Error('x'); e.status = a.status; e.body = a.body; throw e;
}
function client(handler) {
    const calls = [];
    const events = [];
    M.reset();
    M.configure({
        request: async (method, path, payload) => { calls.push({ method, path, payload }); return handler(method, path, payload); },
        onSession: () => {},
        emit: (name, detail) => events.push({ name, detail }),
        now: () => 1000
    });
    return { calls, events };
}

async function openDevice(params = {}) {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('code-device', null, {
        requiresKeyboardInput: true, disableClose: true,
        deps: { mfa: M, now: () => 1000, schedule: () => 1, clearScheduled: () => {} }, ...params
    });
    await tick(); await tick();
    return scene;
}
async function openPhone(params = {}) {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('authenticator-live', null, {
        requiresKeyboardInput: true, disableClose: true, own: true, deps: { ...noSched, mfa: M }, ...params
    });
    await tick(); await tick();
    return FW.currentMinigame || scene;
}
const text = (sel) => document.querySelector(sel)?.textContent;

test('own code device: titled "My phone", reads by npc id, shows six digits and notes the read as own', async () => {
    const { calls } = client(() => serve('device.own'));
    const s = await openDevice({ own: true, npcId: 'vera' });
    assert.deepEqual(calls[0], { method: 'GET', path: 'mfa/device', payload: { npc_id: 'vera' } });
    const st = s.getTestState().codeDevice;
    assert.equal(st.state, 'code');
    assert.equal(st.own, true);
    assert.equal(st.digits, answer('device.own').body.code);
    assert.match(st.digits, /^\d{6}$/);
    assert.equal(text('.code-device-title-text'), 'My phone');
    assert.ok(document.querySelector('.code-device-phone'));
    assert.equal(document.querySelector('.device-frame'), null);
    // noted as an own read: it fills an ownPhone pane and no item pane
    M.noteRequired('pc:vault_pc', answer('login.mfa_required_own_code').body);
    assert.equal(M.codeFor(M.pendingFor('pc:vault_pc')), answer('device.own').body.code);
});

test('own code device: a used code is greyed and never noted', async () => {
    client(() => serve('device.own_used'));
    const s = await openDevice({ own: true, npcId: 'vera' });
    const st = s.getTestState().codeDevice;
    assert.equal(st.state, 'used');
    assert.equal(st.used, true);
    assert.equal(text('.code-device-note'), 'Wait for the next code');
    M.noteRequired('pc:vault_pc', answer('login.mfa_required_own_code').body);
    assert.equal(M.codeFor(M.pendingFor('pc:vault_pc')), null);
});

test('the item device keeps its small frame and reads by item id', async () => {
    const { calls } = client(() => serve('device.own'));
    const s = await openDevice({ itemId: 'vera_fob' });
    assert.deepEqual(calls[0].payload, { item_id: 'vera_fob' });
    assert.equal(s.getTestState().codeDevice.own, false);
    assert.equal(text('.code-device-title-text'), 'Code device');
    assert.ok(document.querySelector('.device-frame'));
});

test('an unenrolled item shows "No longer in use" and no digits', async () => {
    client(() => serve('device.unenrolled'));
    const s = await openDevice({ itemId: 'vera_fob' });
    const st = s.getTestState().codeDevice;
    assert.equal(st.state, 'retired');
    assert.equal(st.digits, '');
    assert.equal(text('.code-device-note'), 'No longer in use');
    assert.equal(M.codeFor({ npcId: 'vera' }), null);
});

test('own code device: a refusal shows nothing', async () => {
    client(() => serve('device.no_device'));
    const s = await openDevice({ own: true, npcId: 'vera' });
    assert.equal(s.getTestState().codeDevice.state, 'nothing');
    assert.equal(text('.code-device-note'), 'This device shows nothing.');
});

test('own authenticator lists the own-phone push and number-match cards', async () => {
    const { calls } = client(() => serve('phone.own'));
    let s = await openPhone();
    assert.deepEqual(calls[0], { method: 'GET', path: 'mfa/phone', payload: { own: 1 } });
    assert.equal(s.getTestState().authenticator.live.own, true);
    assert.equal(s.getTestState().authenticator.live.cards, 1);
    assert.ok(document.querySelector('.auth-card-approve'));
    assert.ok(document.querySelector('.auth-card-deny'));
    assert.equal(document.querySelector('.auth-card-number'), null);
    client(() => serve('phone.own_number_match'));
    s = await openPhone();
    const nums = [...document.querySelectorAll('.auth-card-number')].map((b) => b.textContent);
    assert.deepEqual(nums, answer('phone.own_number_match').body.requests[0].numbers.map(String));
    assert.equal(document.querySelector('.auth-card-approve'), null);
});

test('own authenticator: Approve passes and is named own_phone', async () => {
    const { calls, events } = client((method, path) => (path === 'mfa/approve' ? serve('approve.own_passed') : serve('phone.own')));
    M.noteRequired('pc:ops_pc', answer('login.mfa_required_own_push').body);
    const s = await openPhone();
    const key = `pc:${answer('phone.own').body.requests[0].pcId}`;
    const res = await s.tapApprove(key);
    assert.equal(res.ok, true);
    assert.equal(res.passed, true);
    assert.equal(calls.find((c) => c.path === 'mfa/approve').method, 'POST');
    assert.equal(events.find((e) => e.name === 'mfa_approved').detail.by, 'own_phone');
    assert.equal(s.getTestState().authenticator.live.approved, 1);
});

test('own authenticator: the approve and deny requests carry own=1 for an own-phone note, no own key for a held phone', async () => {
    const reqs = answer('phone.own').body.requests;
    const key = `pc:${reqs[0].pcId}`;
    const post = (calls) => calls.filter((c) => c.path === 'mfa/approve').map((c) => c.payload);
    // own-phone note: Approve, then Deny
    let { calls } = client((method, path) => (path === 'mfa/approve' ? serve('approve.own_passed') : serve('phone.own')));
    M.noteRequired(key, answer('login.mfa_required_own_push').body);
    let s = await openPhone();
    await s.tapApprove(key);
    M.noteRequired(key, answer('login.mfa_required_own_push').body);
    await s.tapDeny(key);
    const own = post(calls);
    assert.equal(own.length, 2);
    assert.equal(own[0].own, 1);
    assert.equal(own[1].own, 1);
    assert.equal(own[1].deny, true);
    // held phone: the same note without ownPhone sends no own key at all
    ({ calls } = client((method, path) => (path === 'mfa/approve' ? serve('approve.own_passed') : serve('phone.own'))));
    const held = { ...answer('login.mfa_required_own_push').body }; delete held.ownPhone;
    M.noteRequired(key, held);
    s = await openPhone();
    await s.tapApprove(key);
    M.noteRequired(key, held);
    await s.tapDeny(key);
    const sent = post(calls);
    assert.equal(sent.length, 2);
    for (const p of sent) assert.equal('own' in p, false);
});

test('own authenticator: a wrong number cancels the request', async () => {
    client((method, path) => (path === 'mfa/approve' ? serve('approve.cancelled') : serve('phone.own_number_match')));
    const s = await openPhone();
    const req = answer('phone.own_number_match').body.requests[0];
    const wrong = req.numbers[0];
    const res = await s.tapNumber(`pc:${req.pcId}`, wrong);
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'cancelled');
    assert.equal(s.getTestState().authenticator.live.denied, 1);
    assert.equal(text('.auth-live-status'), 'That number did not match. The request was cancelled.');
});

test('own authenticator: a phone that is not held says so', async () => {
    client(() => serve('phone.no_phone'));
    await openPhone();
    assert.equal(text('.auth-live-status'), 'You are not holding this phone.');
});
