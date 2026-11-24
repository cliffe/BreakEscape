// S8b unit 19: "My phone" on the sign-in second-step panes. The real password screen opens the real
// code-device or authenticator-live scene in its own mode over the real mfa-client; every server
// answer is read from the shared fixture through helpdesk-answers.mjs.
// Run with: bin/test-js test/js/mfa-signin-my-phone.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'my-phone-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js',
    'minigames/container/container-item-image.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/author-html.js', 'minigames/framework/base-minigame.js',
    'utils/remote-host-text.js', 'minigames/password/password-minigame.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/social-overlay.js', 'ui/modal-stack.js',
    'minigames/code-device/code-device-minigame.js', 'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js', 'minigames/authenticator/authenticator-live-minigame.js',
    'systems/global-writer.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.Event = dom.window.Event;
window.requestAnimationFrame = () => 1;
window.visualViewport = null;
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { PasswordMinigame } = await load('minigames/password/password-minigame.js');
const { CodeDeviceMinigame } = await load('minigames/code-device/code-device-minigame.js');
const { AuthenticatorLiveMinigame } = await load('minigames/authenticator/authenticator-live-minigame.js');
const mfa = await load('systems/mfa-client.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('password', PasswordMinigame);
FW.registerScene('code-device', CodeDeviceMinigame);
FW.registerScene('authenticator-live', AuthenticatorLiveMinigame);

const settle = async () => { for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0)); };
const TILES = [{ username: 'v.holt', displayName: 'Vera Holt', targetId: 'vera', portrait: null, avatar: null, kinds: [] }];
const PC = 'desk';
const world = { sounds: [], events: [], requests: [], completes: [], first: null, reads: {} };

window.playUISound = (n) => world.sounds.push(n);
window.eventDispatcher = { emit: (name, data) => world.events.push({ name, data }) };
window.keyring = { teachOnce: () => false };
// A held item for the same account: "My phone" must replace it, never sit beside it
window.inventory = { items: [
    { scenarioData: { type: 'code_device', id: 'vera_fob', name: 'Code device', owner: 'vera' } },
    { scenarioData: { type: 'phone_friendface', id: 'vera_phone', name: 'Vera\'s phone', owner: 'vera' } }
] };
window.pcSessions = {
    signIn: async () => ({ ok: false, reason: 'mfa_required', mfa: { ...mfa.noteRequired(`pc:${PC}`, world.first.body) } }),
    get: () => null
};
window.startCodeDevice = (p) => FW.startMinigame('code-device', null, { requiresKeyboardInput: true, disableClose: true, ...p });
window.startAuthenticatorLive = (p) => FW.startMinigame('authenticator-live', null, { requiresKeyboardInput: true, disableClose: true, ...p });

function serve(a) {
    if (a.status >= 200 && a.status < 300) return a.body;
    throw Object.assign(new Error('refused'), { status: a.status, body: a.body });
}
mfa.configure({
    request: async (method, path, payload) => {
        world.requests.push({ method, path, payload });
        if (path === 'mfa/device') return serve(world.reads.device);
        if (path === 'mfa/phone') return serve(world.reads.phone);
        if (path.startsWith('mfa/approve')) return serve(world.reads.approve);
        if (path === 'mfa/prompt') return serve(answer('prompt.waiting_own'));
        return {};
    },
    onSession: () => {}, emit: (n, d) => world.events.push({ name: n, data: d }), now: () => 1000
});
window.mfaClient = mfa;

async function openScreen() {
    while (FW.currentMinigame && !FW.currentMinigame._ending) FW.endMinigame(false, null);
    world.completes.length = 0;
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('password', null, {
        title: 'Desk', lockable: { scenarioData: { id: PC } }, type: 'item', requiresKeyboardInput: true,
        signIn: { pcId: PC, pcName: 'Desk PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false,
        onComplete: (success, result) => world.completes.push({ success, result })
    });
    await settle();
    return scene;
}
async function toPane(kind) {
    mfa.reset();
    world.requests.length = 0; world.sounds.length = 0; world.events.length = 0;
    world.first = kind === 'code'
        ? answerWith('login.mfa_required_own_code', { 'body.pcId': PC, 'body.npcId': 'vera' })
        : answerWith('login.mfa_required_own_push', { 'body.pcId': PC, 'body.npcId': 'vera' });
    world.reads.device = answerWith('device.own', { 'body.npcId': 'vera' });
    world.reads.phone = answerWith('phone.own', { 'body.requests[0].pcId': PC });
    world.reads.approve = answerWith('approve.own_passed', { 'body.npcId': 'vera' });
    const scene = await openScreen();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    return scene;
}
const $ = (sel) => document.querySelector(sel);
const labels = () => [...document.querySelectorAll('#signin-second button')].map((b) => b.textContent);

test('the code pane shows "My phone" and no "Use" button', async () => {
    const scene = await toPane('code');
    assert.equal(scene.signInPane, 'code');
    assert.deepEqual(labels(), ['Verify', 'My phone', 'Use a different account']);
    assert.equal($('#signin-use-device'), null);
    assert.equal($('#signin-my-phone').textContent, 'My phone');
});

test('the push pane shows "My phone" and no "Check ... phone" button', async () => {
    const scene = await toPane('push');
    assert.equal(scene.signInPane, 'push');
    assert.deepEqual(labels(), ['Send again', 'My phone', 'Use a different account']);
    assert.equal($('#signin-check-phone'), null);
});

test('without ownPhone the old buttons are unchanged and "My phone" is absent', async () => {
    mfa.reset();
    world.first = answerWith('login.mfa_required_own_code', { 'body.pcId': PC, 'body.npcId': 'vera' });
    delete world.first.body.ownPhone;
    const scene = await openScreen();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    assert.equal($('#signin-my-phone'), null);
    assert.equal($('#signin-use-device').textContent, 'Use Code device');
});

test('code: My phone opens the own code scene; closing it fills the field from the own read and never submits', async () => {
    const scene = await toPane('code');
    $('#signin-my-phone').click();
    await settle();
    assert.ok(FW.currentMinigame instanceof CodeDeviceMinigame);
    assert.equal(scene.params.suspended, true);
    assert.equal(FW.currentMinigame.getTestState().codeDevice.own, true);
    assert.deepEqual(world.requests.find((r) => r.path === 'mfa/device'), { method: 'GET', path: 'mfa/device', payload: { npc_id: 'vera' } });
    $('.code-device .minigame-close-button').click();
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene);
    assert.equal(back.signInPane, 'code');
    assert.equal(back.codeField.value, answer('device.own').body.code);
    assert.equal(world.requests.filter((r) => r.path === 'mfa/verify').length, 0, 'nothing sent for the player');
    assert.deepEqual(world.completes, []);
});

test('code: a used own code is not filled in', async () => {
    const scene = await toPane('code');
    world.reads.device = answerWith('device.own_used', { 'body.npcId': 'vera' });
    $('#signin-my-phone').click();
    await settle();
    $('.code-device .minigame-close-button').click();
    await settle();
    assert.equal(FW.currentMinigame.signInPane, 'code');
    assert.equal(FW.currentMinigame.codeField.value, '');
    assert.notEqual(FW.currentMinigame, scene);
});

test('code: a code read from the held item is not filled into an own-phone pane', async () => {
    const scene = await toPane('code');
    // an item-form read of the same account is noted as an item read, not an own read
    world.reads.device = answerWith('device.own', { 'body.npcId': 'vera' });
    await mfa.readDevice({ itemId: 'vera_fob' });
    scene.showCodePane(mfa.pendingFor(`pc:${PC}`), { fill: true });
    assert.equal(scene.codeField.value, '', 'only an own read fills this pane');
});

test('code: a child forced shut releases the screen once, quietly', async () => {
    await toPane('code');
    $('#signin-my-phone').click();
    await settle();
    world.sounds.length = 0; world.events.length = 0;
    FW.endMinigame(false, null);
    await settle();
    assert.equal(world.completes.length, 1);
    assert.equal(world.completes[0].success, false);
    assert.equal(world.completes[0].result.aborted, true);
    assert.equal(world.completes[0].result.viaChild, true);
    assert.deepEqual(world.sounds, []);
    assert.equal(world.events.filter((e) => e.name === 'pc_signin_failed' || e.name === 'mfa_failed').length, 0);
});

test('push: My phone opens the own phone; Approve then closing returns signed in', async () => {
    const scene = await toPane('push');
    $('#signin-my-phone').click();
    await settle();
    assert.ok(FW.currentMinigame instanceof AuthenticatorLiveMinigame);
    assert.equal(scene.params.suspended, true);
    assert.equal(FW.currentMinigame.getTestState().authenticator.live.own, true);
    assert.deepEqual(world.requests.find((r) => r.path === 'mfa/phone').payload, { own: 1 });
    const res = await FW.currentMinigame.tapApprove(`pc:${PC}`);
    assert.equal(res.passed, true);
    assert.ok(world.events.some((e) => e.name === 'mfa_approved' && e.data.by === 'own_phone'));
    $('.auth-bar button').click();
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene, 'the sign-in screen is back');
    assert.deepEqual(back.gameResult, { success: true, signIn: { username: world.reads.approve.body.username, displayName: world.reads.approve.body.displayName } });
    assert.ok(world.sounds.includes('confirm'));
    assert.equal(world.requests.filter((r) => r.path === 'mfa/verify').length, 0);
});

test('push: X on the own phone without approving returns to the push pane', async () => {
    const scene = await toPane('push');
    $('#signin-my-phone').click();
    await settle();
    $('.auth-bar button').click();
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene);
    assert.equal(back.signInPane, 'push');
    assert.deepEqual(world.completes, []);
});

test('push: a child forced shut releases the screen once, quietly', async () => {
    await toPane('push');
    $('#signin-my-phone').click();
    await settle();
    world.sounds.length = 0; world.events.length = 0;
    FW.endMinigame(false, null);
    await settle();
    assert.equal(world.completes.length, 1);
    assert.equal(world.completes[0].result.aborted, true);
    assert.equal(world.completes[0].result.viaChild, true);
    assert.deepEqual(world.sounds, []);
    assert.equal(world.events.filter((e) => e.name === 'pc_signin_failed' || e.name === 'mfa_failed').length, 0);
});

test('R5-3: the push pane\'s "Use a different account" returns to the password pane', async () => {
    const scene = await toPane('push');
    $('#signin-second-back').click();
    await settle();
    assert.equal(scene.signInPane, 'password');
    assert.equal($('#signin-second').hidden, true);
    assert.equal(mfa.pendingFor(`pc:${PC}`), null, 'the pending step is cleared');
});
