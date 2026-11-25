// The pane of a lock's second step, frame and code (ops layer S8c unit 18). The real pane runs in
// jsdom with the real multi-factor client over a stubbed request function, and over a real PIN pad
// (the real PinMinigame on the real base scene). Server answers come from the shared fixture.
// The push part (unit 19) is a recording stand-in: it is not a server answer.
// Run with: bin/test-js test/js/lock-step-pane.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'lock-step-pane-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
for (const f of ['ui/lock-step-pane.js', 'systems/mfa-client.js', 'minigames/pin/pin-minigame.js',
    'minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/lock-scope-refusal.js']) copy(f);
// unit 19's part is a recording stand-in here
put('ui/lock-step-push.js', `export const mounts = [];
export function mountPush(host, ctx, settle) {
    const b = document.createElement('button'); b.textContent = 'push part'; host.appendChild(b);
    mounts.push({ host, ctx, settle });
    return { destroy() { mounts.destroyed = (mounts.destroyed || 0) + 1; }, getTestState() { return {}; } };
}\n`);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const pane = await load('ui/lock-step-pane.js');
const push = await load('ui/lock-step-push.js');
const mfa = await load('systems/mfa-client.js');
const { PinMinigame } = await load('minigames/pin/pin-minigame.js');

const settle = () => new Promise((r) => setTimeout(r, 0));
function refuse(name) {
    const a = loadAnswer(name);
    return Object.assign(new Error('refused'), { status: a.status, body: a.body });
}
const answerOf = (name) => { const a = loadAnswer(name); if (a.status >= 400) throw refuse(name); return a.body; };

// One rig per test: a fake server for the client, a manual timer, world-key spies
function rig({ verify = ['verify_passed'], device = null, held = null, knockedOut = null } = {}) {
    document.body.innerHTML = '';
    window.MinigameFramework = { currentMinigame: null };
    const log = { requests: [], sounds: [], paused: 0, resumed: 0, timers: [] };
    window.playUISound = (n) => log.sounds.push(n);
    window.pauseKeyboardInput = () => { log.paused++; };
    window.resumeKeyboardInput = () => { log.resumed++; };
    window.playerIsKnockedOut = knockedOut ? () => knockedOut.value : undefined;
    const queue = verify.slice();
    mfa.reset();
    mfa.configure({
        request: async (method, path, payload) => {
            log.requests.push({ method, path, payload });
            if (path === 'mfa/verify') return answerOf(queue.length > 1 ? queue.shift() : queue[0]);
            if (path === 'mfa/device') return device ? { ...device } : answerOf('no_device');
            throw new Error(`unexpected ${path}`);
        },
        now: () => clock.t
    });
    clock.t = 1000;
    pane.reset();
    pane.configure({
        mfa,
        now: () => clock.t,
        setTimer: (fn, ms) => { log.timers.push({ fn, ms }); return log.timers.length; },
        clearTimer: () => {},
        lockName: (ctx) => ctx.targetId === 'evil' ? '<img src=x onerror=1>' : 'Moira\'s locker',
        ownerName: (ctx) => ctx.npcId === 'evil' ? '<b>Moira</b>' : 'Moira',
        heldDevice: () => held,
        playSound: (n) => log.sounds.push(n)
    });
    push.mounts.length = 0; push.mounts.destroyed = 0;
    return log;
}
const clock = { t: 1000 };
const ctxFor = (name, extra = {}) => { const b = loadAnswer(name).body; return { subject: `${b.targetType}:${b.targetId}`, targetType: b.targetType, targetId: b.targetId, kind: b.kind, npcId: b.npcId, number: b.number, opener: b.opener, fromDoor: false, ...extra }; };
const key = (target, type, k, extra = {}) => { const e = new window.KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, ...extra }); target.dispatchEvent(e); return e; };
const layer = () => document.querySelector('.lock-step-layer');
const typeCode = (value) => { const f = document.getElementById('lock-step-code'); f.value = value; f.dispatchEvent(new window.Event('input', { bubbles: true })); };
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const button = (label) => [...layer().querySelectorAll('button')].find((b) => b.textContent === label);
const tick = async (log) => { const t = log.timers.pop(); t.fn(); await settle(); };

test('right code settles passed, posts the lock subject and removes the layer', async () => {
    const log = rig();
    const h = pane.openPane(ctxFor('gate_code'));
    assert.equal(document.body.lastElementChild, layer());
    typeCode('123456');
    click(button('Verify'));
    assert.equal(await h.done, 'passed');
    assert.deepEqual(log.requests, [{ method: 'POST', path: 'mfa/verify', payload: { target_type: 'object', target_id: 'moira_locker', code: '123456' } }]);
    assert.equal(layer(), null);
});

test('state: title, the owner line, one six-digit field and the controls', () => {
    rig();
    const h = pane.openPane(ctxFor('gate_code'));
    const s = h.getTestState();
    assert.equal(s.open, true);
    assert.equal(s.kind, 'code');
    assert.equal(s.title, "Moira's locker");
    assert.ok(s.lines.includes("Enter the code from Moira's device."));
    assert.equal(s.fields.length, 1);
    assert.equal(s.fields[0].maxLength, 6);
    assert.deepEqual(s.controls.map((c) => c.label), ['X', 'Verify']);
    h.close();
});

test('wrong, used, expired and closed codes keep the pane open with the sign-in lines', async () => {
    const lines = { verify_wrong: 'Incorrect code', verify_stale_used: 'That code has been used. Wait for the next one.',
        verify_stale_expired: 'That code has expired.', verify_closed: 'Too many wrong codes. Try again in 4 minutes.' };
    for (const [name, text] of Object.entries(lines)) {
        const log = rig({ verify: [name] });
        const h = pane.openPane(ctxFor('gate_code'));
        typeCode('654321');
        click(button('Verify'));
        await settle();
        assert.equal(h.getTestState().open, true, name);
        assert.ok(h.getTestState().lines.includes(text), `${name}: ${h.getTestState().lines}`);
        assert.equal(document.getElementById('lock-step-code').value, '');
        assert.deepEqual(log.sounds, ['reject']);
        h.close();
    }
});

test('a dropped record (five wrong codes) settles expired', async () => {
    rig({ verify: ['verify_dropped'] });
    const h = pane.openPane(ctxFor('gate_code'));
    typeCode('111111');
    click(button('Verify'));
    assert.equal(await h.done, 'expired');
});

test('a short code sends nothing', async () => {
    const log = rig();
    const h = pane.openPane(ctxFor('gate_code'));
    typeCode('12');
    click(button('Verify'));
    await settle();
    assert.equal(log.requests.length, 0);
    assert.ok(h.getTestState().lines.includes('Enter the six-digit code.'));
    h.close();
});

test('X settles closed and sends nothing; so does Escape', async () => {
    let log = rig();
    let h = pane.openPane(ctxFor('gate_code'));
    click(button('X'));
    assert.equal(await h.done, 'closed');
    assert.equal(log.requests.length, 0);
    log = rig();
    h = pane.openPane(ctxFor('gate_code'));
    key(document.body, 'keydown', 'Escape');
    assert.equal(await h.done, 'closed');
    assert.equal(layer(), null);
    assert.equal(log.requests.length, 0);
});

test('a hostile lock or owner name renders as text', () => {
    rig();
    const h = pane.openPane(ctxFor('gate_code', { targetId: 'evil', npcId: 'evil', subject: 'object:evil' }));
    assert.equal(layer().querySelector('img'), null);
    assert.equal(layer().querySelector('b'), null);
    const s = h.getTestState();
    assert.equal(s.title, '<img src=x onerror=1>');
    assert.ok(s.lines.includes("Enter the code from <b>Moira</b>'s device."));
    h.close();
});

test('the device strip shows only for a held device; Read code, then Use this code fills but never sends', async () => {
    let log = rig();
    let h = pane.openPane(ctxFor('gate_code'));
    assert.equal(layer().querySelector('.lock-step-device'), null);
    h.close();

    log = rig({ held: { id: 'moira_fob', name: 'Moira\'s fob' }, device: { deviceId: 'moira_fob', npcId: 'moira', code: '482913', secondsLeft: 40 } });
    h = pane.openPane(ctxFor('gate_code'));
    assert.equal(layer().querySelector('.lock-step-device-name').textContent, "Moira's fob");
    click(button('Read code'));
    await settle();
    assert.deepEqual(log.requests, [{ method: 'GET', path: 'mfa/device', payload: { item_id: 'moira_fob' } }]);
    assert.ok(h.getTestState().lines.some((l) => l.includes('482913') && l.includes('40s left')));
    assert.equal(document.getElementById('lock-step-code').value, '');
    click(button('Use this code'));
    assert.equal(document.getElementById('lock-step-code').value, '482913');
    assert.equal(log.requests.length, 1, 'filling the field sends nothing');
    clock.t += 41000;
    await tick(log);
    assert.ok(h.getTestState().lines.some((l) => l.includes('rolled over')));
    assert.ok(button('Read code'));
    h.close();
});

test('a device that shows nothing says so', async () => {
    rig({ held: { id: 'moira_fob', name: 'fob' }, device: null });
    const h = pane.openPane(ctxFor('gate_code'));
    click(button('Read code'));
    await settle();
    assert.ok(h.getTestState().lines.includes('This device shows nothing.'));
    h.close();
});

test('push kinds mount the push part with the context, and its outcome settles the pane', async () => {
    for (const [name, outcome] of [['gate_push', 'passed'], ['gate_number', 'denied'], ['gate_door_npc', 'expired']]) {
        rig();
        const h = pane.openPane(ctxFor(name));
        assert.equal(push.mounts.length, 1);
        const m = push.mounts[0];
        assert.equal(m.ctx.kind, loadAnswer(name).body.kind);
        assert.equal(m.ctx.subject, `${loadAnswer(name).body.targetType}:${loadAnswer(name).body.targetId}`);
        assert.equal(m.ctx.number, loadAnswer(name).body.number);
        assert.equal(layer().querySelector('.lock-step-push-host'), m.host);
        assert.equal(document.getElementById('lock-step-code'), null);
        m.settle(outcome);
        assert.equal(await h.done, outcome);
        assert.equal(layer(), null);
        assert.equal(push.mounts.destroyed, 1);
        assert.equal(typeof m.ctx.setTimer, 'function');
        assert.equal(m.ctx.mfa, mfa);
        assert.equal(m.ctx.ownerName, 'Moira');
    }
});

test('the world keys pause only when nothing was beneath', async () => {
    let log = rig();
    let h = pane.openPane(ctxFor('gate_code'));
    assert.equal(log.paused, 1);
    h.close();
    await h.done;
    assert.equal(log.resumed, 1);

    log = rig();
    window.MinigameFramework.currentMinigame = { _ending: false };
    h = pane.openPane(ctxFor('gate_code'));
    h.close();
    await h.done;
    assert.equal(log.paused, 0);
    assert.equal(log.resumed, 0);
});

test('every 400 ms it closes when the player is knocked out or the pad beneath has gone', async () => {
    const ko = { value: false };
    let log = rig({ knockedOut: ko });
    let h = pane.openPane(ctxFor('gate_code'));
    assert.equal(log.timers.at(-1).ms, 400);
    await tick(log);
    assert.equal(h.getTestState().open, true);
    ko.value = true;
    await tick(log);
    assert.equal(await h.done, 'closed');

    log = rig();
    const pad = { _ending: false };
    window.MinigameFramework.currentMinigame = pad;
    h = pane.openPane(ctxFor('gate_code'));
    await tick(log);
    assert.equal(h.getTestState().open, true);
    window.MinigameFramework.currentMinigame = null;
    await tick(log);
    assert.equal(await h.done, 'closed');
});

test('a second settle is ignored and close() after a pass changes nothing', async () => {
    rig();
    const h = pane.openPane(ctxFor('gate_push'));
    push.mounts[0].settle('passed');
    push.mounts[0].settle('denied');
    h.close();
    assert.equal(await h.done, 'passed');
});

// ---- over a real pad ------------------------------------------------------------------------
function openRealPad() {
    const container = document.createElement('div');
    container.className = 'minigame-container';
    document.body.appendChild(container);
    const pad = new PinMinigame(container, { pinLength: 4, correctPin: null, title: 'PIN' });
    window.ApiClient = { unlock: async () => ({ success: false }) };
    pad.init();
    pad.start();
    window.MinigameFramework.currentMinigame = pad;
    pad._ended = 0;
    return pad;
}

test('real pad beneath: digits typed in the pane never reach the pad, from the field or from the body', async () => {
    rig();
    const pad = openRealPad();
    pad.handleNumberInput = () => { throw new Error('digit reached the pad'); };
    pad.handleEnter = () => { throw new Error('Enter reached the pad'); };
    const h = pane.openPane(ctxFor('gate_code'));
    const field = document.getElementById('lock-step-code');
    for (const target of [field, document.body, layer()]) {
        for (const k of ['1', '7', 'Enter', 'Backspace']) {
            for (const type of ['keydown', 'keypress', 'keyup']) key(target, type, k);
        }
    }
    h.close();
});

test('real pad beneath: a digit typed in the field lands in the field, Enter verifies', async () => {
    const log = rig();
    const pad = openRealPad();
    const h = pane.openPane(ctxFor('gate_code'));
    const field = document.getElementById('lock-step-code');
    assert.equal(document.activeElement, field);
    typeCode('123456');
    key(field, 'keydown', 'Enter');
    assert.equal(await h.done, 'passed');
    assert.equal(log.requests.length, 1);
    assert.equal(pad.currentInput, '');
});

test('real pad beneath: Escape closes the pane, not the pad', async () => {
    rig();
    const pad = openRealPad();
    let padClosed = 0;
    pad.closeByPlayer = () => { padClosed++; };
    pad.complete = () => { padClosed++; };
    const h = pane.openPane(ctxFor('gate_code'));
    for (const target of [document.getElementById('lock-step-code'), document.body]) {
        const h2 = target === document.body ? pane.openPane(ctxFor('gate_code')) : h;
        key(target, 'keydown', 'Escape');
        assert.equal(await h2.done, 'closed');
    }
    assert.equal(padClosed, 0, 'the pad stayed open');
    // With the pane gone Escape reaches the pad again
    key(document.body, 'keydown', 'Escape');
    assert.equal(padClosed, 1);
});

test('real pad beneath: after the pane closes the pad takes digits again, and the listeners are gone', async () => {
    rig();
    const pad = openRealPad();
    const h = pane.openPane(ctxFor('gate_code'));
    h.close();
    await h.done;
    window.playUISound = () => {};
    key(document.body, 'keydown', '5');
    assert.equal(pad.currentInput, '5');
});

// S8c R1-CLIENT6: a browser key (reload, developer tools) is never blocked, whichever element holds focus
test('browser keys are left alone with focus on the body: F5, Ctrl+R, F12, Alt+Left, Cmd+R', () => {
    rig();
    const h = pane.openPane(ctxFor('gate_code'));
    for (const [k, extra] of [['F5', {}], ['r', { ctrlKey: true }], ['F12', {}], ['ArrowLeft', { altKey: true }], ['r', { metaKey: true }]]) {
        const e = key(document.body, 'keydown', k, extra);
        assert.equal(e.defaultPrevented, false, `${k} ${JSON.stringify(extra)} keeps its default`);
    }
    h.close();
});

test('browser keys still do not reach a pad beneath (propagation stopped), and a plain key outside is still held back', () => {
    rig();
    const pad = openRealPad();
    let reached = 0;
    pad.handleNumberInput = () => { reached++; };
    const h = pane.openPane(ctxFor('gate_code'));
    key(document.body, 'keydown', 'F5');
    key(document.body, 'keydown', '5');
    assert.equal(reached, 0);
    assert.equal(key(document.body, 'keydown', 'a').defaultPrevented, true);
    h.close();
});
