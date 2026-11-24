// window.__test.lockStep (systems/test-bridge/lock-step.js) over the REAL wiring, pane, push part,
// ApiClient.unlock and mfa-client; only the network is stubbed, from the shared answer fixture.
// state(), click(label), type(text, { enter }) and close() read and drive the pane by real events.
// Run with: bin/test-js test/js/test-bridge-lock-step.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'bridge-lock-step-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const f of ['systems/lock-step-wiring.js', 'systems/lock-step.js', 'systems/npc-game-bridge.js', 'systems/mfa-client.js',
    'ui/lock-step-pane.js', 'ui/lock-step-push.js', 'api-client.js', 'config.js', 'state-sync.js', 'utils/lock-scope-refusal.js',
    'systems/test-bridge/lock-step.js', 'systems/test-bridge/input.js']) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), readFileSync(join(js, f), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
for (const k of ['KeyboardEvent', 'MouseEvent', 'Event']) globalThis[k] = dom.window[k];
// the bridge's click sends pointer events; jsdom has none, so a MouseEvent subclass stands in for the type name only
globalThis.PointerEvent = dom.window.PointerEvent || class PointerEvent extends dom.window.MouseEvent {};
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.breakEscapeConfig = { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { ApiClient } = await load('api-client.js');
const { StateSync } = await load('state-sync.js');
const wiring = await load('systems/lock-step-wiring.js');
const mfa = await load('systems/mfa-client.js');
const lockStepModule = await load('systems/lock-step.js');
const { lockStepBridge: bridge } = await load('systems/test-bridge/lock-step.js');

const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async (n = 6) => { for (let i = 0; i < n; i++) await tick(); };

let routes; let sent;
globalThis.fetch = async (url, init = {}) => {
    const path = String(url).replace('/games/1', '').split('?')[0];
    sent.push({ path, body: init.body ? JSON.parse(init.body) : null });
    const queue = routes[path];
    if (!queue || !queue.length) throw new Error(`unexpected request ${path}`);
    const a = loadAnswer(queue.length > 1 ? queue.shift() : queue[0]);
    return { ok: a.status < 400, status: a.status, json: async () => a.body };
};

function boot(inventory = { items: [] }) {
    document.body.innerHTML = '';
    sent = [];
    lockStepModule.reset();
    window.MinigameFramework = { currentMinigame: null };
    window.inventory = inventory;
    window.gameScenario = { rooms: {} };
    window.rooms = {};
    window.playUISound = () => {};
    window.gameAlert = () => {};
    window.stateSync = new StateSync(30000);
    window.ApiClient = ApiClient;
    window.mfaClient = mfa;
    mfa.reset();
    mfa.configure({
        request: (method, path, payload) => (method === 'GET'
            ? ApiClient.get(`/${path}?${new URLSearchParams(payload || {})}`)
            : ApiClient.post(`/${path}`, payload || {})),
        emit: () => {},
        now: () => Date.now()
    });
    wiring.wireLockStep(window, { setTimer: () => 1, clearTimer: () => {} });
}

test('state() is { open: false } with no pane, and the pane\'s own state with one', async () => {
    boot();
    assert.deepEqual(bridge.state(), { open: false });
    routes = { '/unlock': ['gate_code'] };
    const p = ApiClient.unlock('object', 'moira_locker', 'a', 'password');
    await settle();
    const st = bridge.state();
    assert.equal(st.open, true);
    assert.equal(st.kind, 'code');
    assert.deepEqual(st.controls.map((c) => c.label), ['X', 'Verify']);
    assert.equal(typeof st.text, 'string');
    assert.doesNotThrow(() => JSON.stringify(st));
    bridge.close();
    await p.catch(() => {});
    assert.deepEqual(bridge.state(), { open: false });
});

test('type(text, { enter }) fills the field and presses Enter; click("Verify") works too', async () => {
    boot();
    routes = { '/unlock': ['gate_code', 'open_object'], '/mfa/verify': ['verify_passed'] };
    const p = ApiClient.unlock('object', 'moira_locker', 'a', 'password');
    await settle();
    await bridge.type('654321', { enter: true });
    const answer = await p;
    assert.equal(answer.success, true);
    assert.equal(sent.find((s) => s.path === '/mfa/verify').body.code, '654321');

    routes = { '/unlock': ['gate_code', 'open_object'], '/mfa/verify': ['verify_passed'] };
    const q = ApiClient.unlock('object', 'moira_locker', 'a', 'password');
    await settle();
    await bridge.type('111111');
    assert.equal(bridge.state().fields[0].value, '111111');
    bridge.click('Verify');
    assert.equal((await q).success, true);
});

test('click(label) drives a push pane: Check phone, then Approve', async () => {
    boot({ items: [{ scenarioData: { id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Phone' } }] });
    routes = { '/unlock': ['gate_push', 'open_object'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_passed'] };
    const p = ApiClient.unlock('object', 'moira_locker', 'a', 'password');
    await settle();
    bridge.click('check moira\'s phone');
    await settle();
    assert.match(bridge.state().text, /Approve/);
    bridge.click('Approve');
    assert.equal((await p).success, true);
});

test('click and type refuse clearly: no pane, no such button, a disabled button, no field', async () => {
    boot();
    assert.throws(() => bridge.click('Verify'), /no second-step pane/);
    await assert.rejects(bridge.type('1'), /no second-step pane/);
    routes = { '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] };
    const p = ApiClient.unlock('object', 'moira_locker', 'a', 'password');
    await settle();
    assert.throws(() => bridge.click('Nope'), /no button "Nope" \(have: /);
    assert.throws(() => bridge.click('Send again'), /disabled/);
    await assert.rejects(bridge.type('1'), /no field/);
    bridge.close();
    const err = await p.then(() => null, (e) => e);
    assert.equal(err.body.closedByPlayer, true);
});

test('the bridge is registered on __test as lockStep, with one import', () => {
    const idx = readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8');
    assert.match(idx, /import \{ lockStepBridge \} from '\.\/lock-step\.js';/);
    assert.match(idx, /\blockStep: lockStepBridge,/);
});
