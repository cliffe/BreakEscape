// Code device scene (ops layer S8a, unit 12): the real scene runs in jsdom through the real
// minigame framework, with an injected multi-factor client, clock and scheduler.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'code-device-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/code-device/code-device-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js',
    'utils/author-html.js', 'utils/npc-headshot.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
console.log = () => {};
console.warn = () => {};
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { CodeDeviceMinigame } = await load('minigames/code-device/code-device-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('code-device', CodeDeviceMinigame);

const settle = () => new Promise((r) => setTimeout(r, 0));

function rig(answers) {
    const clock = { ms: 1_000_000 };
    const calls = [];
    const noted = [];
    const queue = Array.isArray(answers) ? answers.slice() : [answers];
    const mfa = {
        async readDevice(args) {
            calls.push(args);
            const res = queue.length > 1 ? queue.shift() : queue[0];
            // The real client notes a shown, unused code; the fake does the same.
            if (res.ok && res.enrolled !== false && !res.used && res.code) noted.push(res.code);
            return res;
        }
    };
    return { clock, calls, noted, mfa };
}

async function open(r, extra = {}) {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('code-device', null, {
        requiresKeyboardInput: true, disableClose: true, itemId: 'dev1',
        deps: { mfa: r.mfa, now: () => r.clock.ms, schedule: () => 1, clearScheduled: () => {}, ...(extra.deps || {}) },
        ...extra.params
    });
    await settle();
    return scene;
}

const LIVE = { ok: true, deviceId: 'dev1', displayName: 'Ms Okafor', npcId: 'okafor', code: '123456', secondsLeft: 40 };

test('a live code shows its six digits and notes them', async () => {
    const r = rig(LIVE);
    const s = await open(r);
    assert.equal(s.getTestState().codeDevice.digits, '123456');
    assert.deepEqual(r.noted, ['123456']);
    assert.deepEqual(r.calls, [{ itemId: 'dev1' }]);
    assert.equal(s.getTestState().codeDevice.secondsLeft, 40);
});

test('a used code is greyed, says wait, and is not noted', async () => {
    const r = rig({ ...LIVE, used: true });
    await open(r);
    const digits = document.querySelector('.code-device-digits');
    assert.ok(digits.classList.contains('code-device-used'));
    assert.equal(document.querySelector('.code-device-note').textContent, 'Wait for the next code');
    assert.deepEqual(r.noted, []);
});

test('enrolled false shows no digits', async () => {
    const r = rig({ ok: true, deviceId: 'dev1', displayName: 'Ms Okafor', enrolled: false });
    const s = await open(r);
    assert.equal(document.querySelector('.code-device-digits').textContent, '');
    assert.equal(document.querySelector('.code-device-note').textContent, 'No longer in use');
    assert.equal(s.getTestState().codeDevice.state, 'retired');
    assert.deepEqual(r.noted, []);
});

test('a refused read says the device shows nothing', async () => {
    const r = rig({ ok: false, reason: 'no_device', status: 403, body: {} });
    await open(r);
    assert.equal(document.querySelector('.code-device-note').textContent, 'This device shows nothing.');
    assert.equal(document.querySelector('.code-device-digits').textContent, '');
});

test('a hostile display name renders as text', async () => {
    const r = rig({ ...LIVE, displayName: '<img src=x onerror=alert(1)><b>x</b>' });
    await open(r);
    const name = document.querySelector('.code-device-name');
    assert.equal(name.textContent, '<img src=x onerror=alert(1)><b>x</b>');
    assert.equal(name.children.length, 0);
    assert.equal(document.querySelector('.code-device img'), null);
});

test('the read repeats when the injected clock passes the window', async () => {
    const r = rig([LIVE, { ...LIVE, code: '654321', secondsLeft: 60 }]);
    const s = await open(r);
    assert.equal(r.calls.length, 1);
    s.tick(); // still inside the window
    await settle();
    assert.equal(r.calls.length, 1);
    r.clock.ms += 41_000;
    s.tick();
    await settle();
    assert.equal(r.calls.length, 2);
    assert.equal(s.getTestState().codeDevice.digits, '654321');
    assert.deepEqual(r.noted, ['123456', '654321']);
});

test('the steel X closes it', async () => {
    const r = rig(LIVE);
    const s = await open(r);
    let done = null;
    s.params.onComplete = (ok) => { done = ok; };
    document.querySelector('.code-device .minigame-close-button').click();
    assert.equal(done, true);
});
