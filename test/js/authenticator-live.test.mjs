// Live authenticator (S8a unit 19): cards from a stubbed MfaClient.phone, approve, deny, a wrong
// number, and hostile text. Run with: bin/test-js test/js/authenticator-live.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'auth-live-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/authenticator/authenticator-live-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js',
    'systems/global-writer.js'
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
const { AuthenticatorLiveMinigame } = await load('minigames/authenticator/authenticator-live-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('authenticator-live', AuthenticatorLiveMinigame);

const noopSched = { schedule: () => 0, clearScheduled: () => {}, stepMs: 1, pollMs: 0 };
const tick = () => new Promise((r) => setTimeout(r, 0));

function stub(requests, approveResult = { ok: true, passed: false }) {
    const calls = { phone: [], approve: [] };
    const state = { requests };
    return {
        calls, state,
        mfa: {
            phone: async (a) => { calls.phone.push(a); return { ok: true, requests: state.requests }; },
            approve: async (k, o) => { calls.approve.push([k, o]); return typeof approveResult === 'function' ? approveResult(k, o) : approveResult; }
        }
    };
}

async function open(s, params = {}) {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('authenticator-live', null, {
        requiresKeyboardInput: true, disableClose: true, npcId: 'npc_a', ...params, deps: { ...noopSched, mfa: s.mfa }
    });
    await tick(); await tick();
    return FW.currentMinigame || scene;
}
const cards = () => [...document.querySelectorAll('.auth-card')];

test('cards come from the stubbed phone, with real Approve and Deny buttons', async () => {
    const s = stub([{ pcId: 'desk', host: 'Desk PC', username: 'sam', n: 1 }, { pcId: 'lab', host: 'Lab PC', username: 'sam', n: 2 }]);
    await open(s);
    assert.deepEqual(s.calls.phone, [{ npcId: 'npc_a' }]);
    assert.equal(cards().length, 2);
    assert.equal(document.querySelectorAll('button.auth-card-approve').length, 2);
    assert.equal(document.querySelectorAll('button.auth-card-deny').length, 2);
    assert.equal(document.querySelector('.auth-intro'), null);
    assert.equal(document.querySelector('.auth-send'), null);
});

test('approve and deny call approve with the request key', async () => {
    const s = stub([{ pcId: 'desk', host: 'Desk PC', username: 'sam', n: 1 }, { pcId: 'lab', host: 'Lab PC', username: 'sam', n: 2 }]);
    const scene = await open(s);
    s.state.requests = [{ pcId: 'lab', host: 'Lab PC', username: 'sam', n: 2 }];
    document.querySelector('.auth-card-approve').click();
    await tick(); await tick();
    assert.deepEqual(s.calls.approve[0], ['pc:desk', {}]);
    assert.equal(cards().length, 1);
    s.state.requests = [];
    document.querySelector('.auth-card-deny').click();
    await tick(); await tick();
    assert.deepEqual(s.calls.approve[1], ['pc:lab', { deny: true }]);
    assert.equal(cards().length, 0);
    assert.deepEqual(scene.closeResult(), { approved: 1, denied: 1, mode: 'live' });
});

test('number matching shows three number buttons; a wrong number cancels the request, as the server does', async () => {
    const s = stub([{ pcId: 'desk', host: 'Desk PC', username: 'sam', n: 1, numbers: [11, 42, 73] }],
        (k, o) => (o.number === 42 ? { ok: true, passed: true } : { ok: false, reason: 'cancelled' }));
    await open(s);
    const nums = [...document.querySelectorAll('.auth-card-number')];
    assert.deepEqual(nums.map((b) => b.textContent), ['11', '42', '73']);
    assert.equal(document.querySelector('.auth-card-approve'), null);
    nums[0].click();
    await tick(); await tick();
    assert.deepEqual(s.calls.approve[0], ['pc:desk', { number: 11 }]);
    assert.match(document.querySelector('.auth-live-status').textContent, /did not match.*cancelled/);
    assert.equal(FW.currentMinigame.deniedCount, 1);
});

test('hostile host and username are text, never markup', async () => {
    const evil = '<img src=x onerror=alert(1)>';
    const s = stub([{ pcId: 'desk', n: 1, username: evil, host: `<b>${evil}</b>`, app: evil }]);
    await open(s);
    const card = cards()[0];
    assert.equal(card.querySelector('img'), null);
    assert.equal(card.querySelector('b'), null);
    assert.ok(card.textContent.includes(evil));
});

test('a phone the player does not hold shows a message and no cards', async () => {
    const s = { calls: {}, mfa: { phone: async () => ({ ok: false, reason: 'no_phone' }), approve: async () => ({ ok: false }) } };
    await open(s);
    assert.equal(cards().length, 0);
    assert.match(document.querySelector('.auth-live-status').textContent, /not holding/);
});
