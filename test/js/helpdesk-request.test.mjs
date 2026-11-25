// S8b unit 07: the IT request form scene. Every server answer comes from the shared fixture
// (test/js/helpers/helpdesk-answers.mjs); the scene is driven through a stand-in helpdesk client
// that turns a fixture answer into { result, body } the way unit 08's client does.
// Run with: bin/test-js test/js/helpdesk-request.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'helpdesk-request-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/helpdesk-request/helpdesk-request-minigame.js',
    'systems/minigame-registry.js', 'systems/exercise-station-starter.js', 'systems/global-writer.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { HelpdeskRequestMinigame, resultLine, TEXT } = await load('minigames/helpdesk-request/helpdesk-request-minigame.js');
const registry = await load('systems/minigame-registry.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('helpdesk-request', HelpdeskRequestMinigame);

// ── stand-ins built from the shared answers ───────────────────────────────────────────
const forms = () => answer('bootstrap.helpdesk_forms').body;
const resultOf = (name, patch) => {
    const a = patch ? answerWith(name, patch) : answer(name);
    const body = a.body;
    let result = 'error';
    if (name.startsWith('helpdesk.granted')) result = String(name.split('.')[1].split('_')[0]);
    else if (['refused', 'blocked', 'unavailable'].includes(body.reason)) result = body.reason;
    return { result, body };
};
function fakeClient({ formMap = forms(), reply } = {}) {
    const sent = [];
    return {
        sent,
        formFor: (id) => formMap[id] || null,
        send: async (req) => { sent.push(req); return typeof reply === 'function' ? reply(req) : reply; }
    };
}
function open(helpdesk, params = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    const container = document.getElementById('mg');
    const scene = new HelpdeskRequestMinigame(container, { deskId: 'it_desk', deps: { helpdesk }, ...params });
    scene.init();
    scene.start();
    return { scene, container };
}
const input = (c, sel) => c.querySelector(sel);
const type = (c, sel, v) => { const n = input(c, sel); n.value = v; return n; };
const settle = () => new Promise((r) => setTimeout(r, 0));
const settle2 = async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); };
const lineOf = (c) => c.querySelector('.hr-result-line')?.textContent;

test('a desk with both resets draws a username, a choice and a field per question label', () => {
    const { container: c } = open(fakeClient({}));
    assert.ok(input(c, '.hr-username input'));
    assert.deepEqual([...c.querySelectorAll('.hr-what input')].map((r) => r.value), ['password', 'mfa']);
    const rows = [...c.querySelectorAll('.hr-answer')];
    assert.deepEqual(rows.map((r) => r.dataset.question), Object.keys(forms().it_desk.questionLabels));
    assert.deepEqual(rows.map((r) => r.querySelector('label').textContent), Object.values(forms().it_desk.questionLabels));
    for (const i of c.querySelectorAll('.hr-input')) assert.equal(i.maxLength, 64);
});

test('a desk with one reset shows no choice and sends that reset', async () => {
    const one = forms();
    one.it_desk.resets = ['mfa'];
    const client = fakeClient({ formMap: one, reply: resultOf('helpdesk.granted_mfa') });
    const { container: c } = open(client);
    assert.equal(c.querySelector('.hr-what'), null);
    type(c, '.hr-username input', 'v.lind');
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(client.sent[0].what, 'mfa');
});

test('the choice is sent, and the answers are cut to 64 characters', async () => {
    const client = fakeClient({ reply: resultOf('helpdesk.refused') });
    const { container: c } = open(client);
    type(c, '.hr-username input', 'v.lind');
    const radios = c.querySelectorAll('.hr-what input');
    radios[1].checked = true;
    radios[1].dispatchEvent(new window.Event('change'));
    type(c, '.hr-answer input', 'x'.repeat(200));
    c.querySelector('.hr-send').click();
    await settle();
    const req = client.sent[0];
    assert.equal(req.what, 'mfa');
    assert.equal(req.username, 'v.lind');
    assert.equal(req.deskId, 'it_desk');
    assert.equal(req.answers.staff_no.length, 64);
    assert.equal(req.answers.manager, '');
});

test('nothing is sent with an empty username', async () => {
    const client = fakeClient({ reply: resultOf('helpdesk.refused') });
    const { container: c } = open(client);
    type(c, '.hr-username input', '   ');
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(client.sent.length, 0);
    assert.equal(c.querySelector('.hr-result-line'), null);
});

test('pcId is passed through when given and absent when not', async () => {
    for (const [params, has] of [[{ pcId: 'front_pc' }, true], [{}, false]]) {
        const client = fakeClient({ reply: resultOf('helpdesk.refused') });
        const { container: c } = open(client, params);
        type(c, '.hr-username input', 'v.lind');
        c.querySelector('.hr-send').click();
        await settle();
        assert.equal('pcId' in client.sent[0], has);
        if (has) assert.equal(client.sent[0].pcId, 'front_pc');
    }
});

const LINES = [
    ['helpdesk.granted_mfa', null, 'Sign-in approvals now come to your phone.'],
    ['helpdesk.refused', null, 'The desk could not verify you. Tries left: 2.'],
    ['helpdesk.refused_last', null, 'The desk could not verify you. Tries left: 0.'],
    ['helpdesk.blocked', null, 'The desk is not taking requests for that account. Try again in 4 minutes.'],
    ['helpdesk.blocked', { 'body.retryIn': 61 }, 'The desk is not taking requests for that account. Try again in 2 minutes.'],
    ['helpdesk.blocked', { 'body.retryIn': 30 }, 'The desk is not taking requests for that account. Try again in 1 minute.'],
    ['helpdesk.unavailable', null, 'The desk cannot take this request now.'],
    ['helpdesk.not_found', null, 'The request could not be sent.'],
    ['helpdesk.bad_request', null, 'The request could not be sent.']
];
for (const [name, patch, line] of LINES) {
    test(`result line for ${name}${patch ? ' ' + JSON.stringify(patch) : ''}`, async () => {
        const client = fakeClient({ reply: resultOf(name, patch) });
        const { scene, container: c } = open(client);
        type(c, '.hr-username input', 'v.lind');
        c.querySelector('.hr-send').click();
        await settle();
        assert.equal(lineOf(c), line);
        assert.equal(c.querySelector('.hr-password'), null, 'no password on a non-password answer');
        assert.equal(scene.getTestState().helpdeskRequest.passwordShown, false);
    });
}

test('the password is shown only for the granted password answer', async () => {
    const client = fakeClient({ reply: resultOf('helpdesk.granted_password') });
    const { scene, container: c } = open(client);
    type(c, '.hr-username input', 'v.lind');
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(lineOf(c), 'Password reset. New password:');
    assert.equal(c.querySelector('.hr-password').textContent, answer('helpdesk.granted_password').body.password);
    assert.equal(c.querySelector('.hr-note').textContent, 'It is saved on the sign-in screen for this account.', 'no capture log held: the log is not named (R2-CLIENT3)');
    window.inventory = { items: [{ scenarioData: { type: 'capture_log', holds: { captures: true } } }] };
    try {
        c.querySelector('.hr-send').click();
        await settle();
        assert.equal(c.querySelector('.hr-note').textContent, 'It is saved under Sign-ins in your capture log, and on the sign-in screen.');
    } finally { delete window.inventory; }
    const st = scene.getTestState();
    assert.equal(st.helpdeskRequest.passwordShown, true);
    assert.ok(!JSON.stringify(st).includes(answer('helpdesk.granted_password').body.password), 'not in the test state');
    assert.ok(!JSON.stringify(scene.closeResult()).includes(answer('helpdesk.granted_password').body.password), 'not in the close result');
    assert.deepEqual(scene.closeResult(), { deskId: 'it_desk', result: 'granted' });
});

test('a second answer replaces the password line', async () => {
    const replies = [resultOf('helpdesk.granted_password'), resultOf('helpdesk.refused')];
    const client = fakeClient({ reply: () => replies.shift() });
    const { scene, container: c } = open(client);
    type(c, '.hr-username input', 'v.lind');
    c.querySelector('.hr-send').click();
    await settle();
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(c.querySelector('.hr-password'), null);
    assert.equal(scene.getTestState().helpdeskRequest.passwordShown, false);
});

test('hostile labels and a hostile password render as text', async () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const formMap = forms();
    formMap.it_desk.questionLabels = { staff_no: hostile, manager: '<b>Line</b>' };
    const client = fakeClient({ formMap, reply: resultOf('helpdesk.granted_password', { 'body.password': hostile }) });
    const { container: c } = open(client);
    assert.equal(c.querySelectorAll('img').length, 0);
    assert.equal(c.querySelector('b'), null);
    assert.equal(c.querySelector('.hr-answer label').textContent, hostile);
    type(c, '.hr-username input', 'v.lind');
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(c.querySelectorAll('img').length, 0);
    assert.equal(c.querySelector('.hr-password').textContent, hostile);
});

test('a desk with no form, or a client that fails, shows the last line', async () => {
    const { container: c, scene } = open(fakeClient({ formMap: {} }));
    assert.equal(lineOf(c), 'The request could not be sent.');
    assert.equal(c.querySelector('.hr-send'), null);
    assert.equal(scene.getTestState().helpdeskRequest.hasForm, false);
    const none = open(null);
    assert.equal(lineOf(none.container), 'The request could not be sent.');
    const bad = fakeClient({});
    bad.send = async () => { throw new Error('network'); };
    const { container: c2 } = open(bad);
    type(c2, '.hr-username input', 'v.lind');
    c2.querySelector('.hr-send').click();
    await settle();
    assert.equal(lineOf(c2), 'The request could not be sent.');
});

test('resultLine tolerates a missing or odd body', () => {
    assert.equal(resultLine('refused', null), TEXT.refused.replace('{n}', '0'));
    assert.equal(resultLine('blocked', {}), 'The desk is not taking requests for that account. Try again in 1 minute.');
    assert.equal(resultLine('whatever', {}), TEXT.failed);
});

test('the scene is registered through the framework and closes normally', async () => {
    window.helpdeskClient = fakeClient({});
    document.body.innerHTML = '';
    const results = [];
    const scene = await FW.startMinigame('helpdesk-request', null, { deskId: 'it_desk', disableClose: true, requiresKeyboardInput: true, onComplete: (ok, r) => results.push([ok, r]) });
    assert.ok(scene || FW.currentMinigame);
    FW.currentMinigame.requestClose();
    assert.equal(results.length, 1);
    assert.equal(results[0][0], true, 'a normal close, not an abort');
    assert.deepEqual(results[0][1], { deskId: 'it_desk', result: null });
    delete window.helpdeskClient;
});

test('the starter registry knows helpdesk_form once the scene file has loaded', () => {
    assert.equal(registry.hasMinigameStarter('helpdesk_form'), true);
    const calls = [];
    window.startHelpdeskRequest = (obj, options) => calls.push([obj, options]);
    assert.equal(registry.startRegisteredMinigame('helpdesk_form', { minigameData: { deskId: 'it_desk', pcId: 'front_pc' } }, { returnTo: 'x' }), true);
    assert.equal(calls[0][0].scenarioData.minigameData.deskId, 'it_desk');
    assert.equal(calls[0][1].returnTo, 'x');
    delete window.startHelpdeskRequest;
});

test('startHelpdeskRequest builds the scene params from minigameData, a bare object or options', async () => {
    const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
    const body = src.slice(src.indexOf('export function startHelpdeskRequest'));
    const fn = new Function('window', 'socialOverlayParams', body.replace('export function', 'function') + '\nreturn startHelpdeskRequest;');
    const started = [];
    const w = { MinigameFramework: { mainGameScene: true, startMinigame: (...a) => started.push(a) }, gameAlert() {} };
    const start = fn(w, (p) => ({ requiresKeyboardInput: true, disableClose: true, ...p }));
    start({ scenarioData: { minigameData: { deskId: 'it_desk', pcId: 'front_pc' } } });
    start({ deskId: 'it_desk' });
    start({ minigameData: { deskId: 'a' } }, { deskId: 'b', returnTo: 'chat' });
    assert.equal(started[0][0], 'helpdesk-request');
    assert.deepEqual([started[0][2].deskId, started[0][2].pcId], ['it_desk', 'front_pc']);
    assert.deepEqual([started[1][2].deskId, 'pcId' in started[1][2]], ['it_desk', false]);
    assert.deepEqual([started[2][2].deskId, started[2][2].returnTo], ['b', 'chat']);
});

test('the scene is on the framework list, shows its own Close and has its css link', () => {
    const idx = readFileSync(join(js, 'minigames/index.js'), 'utf8');
    assert.match(idx, /registerScene\('helpdesk-request', HelpdeskRequestMinigame\)/);
    const view = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(view, /css\/helpdesk-request-minigame\.css/);
    const { container: c } = open(fakeClient({}));
    assert.ok(c.querySelector('.se-overlay-close'));
});

// R1-CLIENT4: Close and Escape while a send is in flight do nothing; the answer is then shown.
test('Close and Escape during an in-flight send are held, and the granted answer is shown (R1-CLIENT4)', async () => {
    let release;
    const late = new Promise((r) => { release = r; });
    const granted = answer('helpdesk.granted_password');
    const results = [];
    const client = fakeClient({ reply: async () => { await late; return { result: 'granted', body: granted.body }; } });
    window.helpdeskClient = client;
    document.body.innerHTML = '';
    await FW.startMinigame('helpdesk-request', null, { deskId: 'it_desk', disableClose: true, requiresKeyboardInput: true, onComplete: (ok, r) => results.push([ok, r]) });
    const scene = FW.currentMinigame;
    const c = scene.container;
    type(c, '.hr-username input, input[name="username"], input', 'sam');
    c.querySelector('form').dispatchEvent(new window.Event('submit', { cancelable: true }));
    assert.equal(client.sent.length, 1);
    const close = c.querySelector('[aria-label="Close"]');
    assert.ok(close);
    assert.equal(close.getAttribute('aria-disabled'), 'true', 'the close control says it is waiting');
    close.click();
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    scene.requestClose();
    assert.equal(results.length, 0, 'not closed while sending');
    assert.equal(FW.currentMinigame, scene);
    release();
    await settle(); await settle();
    assert.equal(c.querySelector('.hr-password')?.textContent, granted.body.password, 'the password is shown');
    assert.equal(close.hasAttribute('aria-disabled'), false);
    scene.requestClose();
    assert.equal(results.length, 1);
    assert.equal(results[0][0], true);
    delete window.helpdeskClient;
});

test('a send with no answer times out after 15 seconds, shows a line, frees Close and Send, and a late answer is ignored (R2-CLIENT2)', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const granted = answer('helpdesk.granted_password');
        const never = [];
        const client = fakeClient({ reply: (req) => new Promise((resolve) => never.push(() => resolve({ result: 'granted', body: granted.body }))) });
        const { scene, container: c } = open(client);
        type(c, '.hr-username input', 'v.lind');
        c.querySelector('.hr-send').click();
        await Promise.resolve();
        assert.equal(lineOf(c), 'Sending your request...');
        assert.equal(c.querySelector('.hr-send').disabled, true);
        assert.equal(c.querySelector('[aria-label="Close"]').getAttribute('aria-disabled'), 'true');
        assert.equal(scene.getTestState().helpdeskRequest.sending, true);
        mock.timers.tick(14999);
        await Promise.resolve();
        assert.equal(lineOf(c), 'Sending your request...', 'still waiting at 14.999 s');
        mock.timers.tick(1);
        await settle2();
        assert.equal(lineOf(c), 'The desk did not answer. Try again.');
        assert.equal(c.querySelector('.hr-send').disabled, false);
        assert.equal(c.querySelector('[aria-label="Close"]').hasAttribute('aria-disabled'), false);
        assert.equal(scene.getTestState().helpdeskRequest.sending, false);
        // the desk answers late: nothing is drawn for it
        never[0]();
        await settle2();
        assert.equal(lineOf(c), 'The desk did not answer. Try again.');
        assert.equal(c.querySelector('.hr-password'), null, 'a late grant is not shown');
        // Send works again
        c.querySelector('.hr-send').click();
        await Promise.resolve();
        assert.equal(client.sent.length, 2);
        assert.equal(lineOf(c), 'Sending your request...');
        scene.cleanup();
    } finally { mock.timers.reset(); }
});

test('a send that rejects shows the failed line and frees the form without waiting for the timer', async () => {
    const client = fakeClient({ reply: () => { throw new Error('down'); } });
    const { container: c } = open(client);
    type(c, '.hr-username input', 'v.lind');
    c.querySelector('.hr-send').click();
    await settle();
    assert.equal(lineOf(c), TEXT.failed);
    assert.equal(c.querySelector('.hr-send').disabled, false);
});
