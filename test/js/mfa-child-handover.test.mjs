// Multi-factor sign-in, the hand-over to the code device and back (ops layer S8a, unit 15). The
// real minigame manager runs the real password screen and the real code-device scene in jsdom,
// with the real multi-factor client over a fake server.
// Run with: bin/test-js test/js/mfa-child-handover.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'mfa-child-'));
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
    'minigames/code-device/code-device-minigame.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
window.requestAnimationFrame = () => 1;
window.visualViewport = null;
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { PasswordMinigame } = await load('minigames/password/password-minigame.js');
const { CodeDeviceMinigame } = await load('minigames/code-device/code-device-minigame.js');
const mfa = await load('systems/mfa-client.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('password', PasswordMinigame);
FW.registerScene('code-device', CodeDeviceMinigame);

const settle = () => new Promise((r) => setTimeout(r, 0));
const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', targetId: 'sam', portrait: null, avatar: null, kinds: [] }];

const world = { sounds: [], events: [], requests: [], completes: [] };
window.playUISound = (n) => world.sounds.push(n);
window.eventDispatcher = { emit: (name, data) => world.events.push({ name, data }) };
window.keyring = { teachOnce: () => false };
window.inventory = { items: [
    { scenarioData: { type: 'code_device', id: 'devSam', name: 'Sam\'s token', owner: 'sam' } },
    { scenarioData: { type: 'code_device', id: 'devOther', name: 'Other token', owner: 'admin' } }
] };
window.pcSessions = {
    signIn: async () => ({ ok: false, reason: 'mfa_required', mfa: { ...mfa.noteRequired('pc:desk', { mfa: 'code', npcId: 'sam' }) } }),
    get: () => null
};
window.startCodeDevice = (p) => FW.startMinigame('code-device', null, { requiresKeyboardInput: true, disableClose: true, ...p });
mfa.configure({
    request: async (method, path, payload) => {
        world.requests.push({ path, payload });
        if (path === 'mfa/device') return { deviceId: payload.item_id, npcId: 'sam', displayName: 'Sam Okafor', code: '246810', secondsLeft: 50 };
        if (path === 'mfa/approve') return { success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor' };
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
        title: 'Desk', lockable: { scenarioData: { id: 'desk' } }, type: 'item', requiresKeyboardInput: true,
        signIn: { pcId: 'desk', pcName: 'Desk PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false,
        onComplete: (success, result) => world.completes.push({ success, result })
    });
    await settle();
    return scene;
}
async function toSecondPane() {
    mfa.reset();
    const scene = await openScreen();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    return scene;
}
const $ = (sel) => document.querySelector(sel);

test('the device button shows only for the pending account\'s own code device', async () => {
    const scene = await toSecondPane();
    const buttons = [...document.querySelectorAll('#signin-use-device')];
    assert.equal(buttons.length, 1);
    assert.equal(buttons[0].textContent, 'Use Sam\'s token');
    assert.equal(scene.signInPane, 'code');
    window.inventory.items.shift();
    const again = await openScreen();
    assert.equal(again.signInPane, 'code', 'the pending step comes back');
    assert.equal($('#signin-use-device'), null, 'no device held for this account');
    window.inventory.items.unshift({ scenarioData: { type: 'code_device', id: 'devSam', name: 'Sam\'s token', owner: 'sam' } });
});

test('Use the device suspends the screen; the child ending by X reopens the screen on its second pane', async () => {
    const scene = await toSecondPane();
    $('#signin-use-device').click();
    await settle();
    assert.ok(FW.currentMinigame instanceof CodeDeviceMinigame, 'the device scene is up');
    assert.equal(scene.params.suspended, true);
    assert.deepEqual(world.completes, [], 'a suspended screen is paused, not finished');
    assert.ok(world.requests.some((r) => r.path === 'mfa/device' && r.payload.item_id === 'devSam'));
    document.querySelector('.code-device .minigame-close-button').click();
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene, 'a new instance');
    assert.equal(back.signInPane, 'code');
    assert.equal(back.codeField.value, '246810', 'filled from the device read, not sent');
    assert.equal(back.params.suspended, false);
    assert.equal(typeof back.params.onComplete, 'function');
    assert.equal(back.params.onComplete._mfaOriginal, undefined, 'the wrapper is gone');
    assert.deepEqual(world.completes, []);
    assert.equal(world.requests.filter((r) => r.path === 'mfa/verify').length, 0);
});

test('a child forced shut releases the screen once, quietly, and clears the completed note', async () => {
    await toSecondPane();
    await mfa.approve('pc:desk', {}); // leaves a completed answer behind (the push path)
    $('#signin-use-device').click();
    await settle();
    assert.ok(FW.currentMinigame instanceof CodeDeviceMinigame);
    world.sounds.length = 0;
    world.events.length = 0;
    FW.endMinigame(false, null); // forced: not a normal exit, so the parent does not reopen
    await settle();
    assert.equal(world.completes.length, 1, 'released once');
    assert.equal(world.completes[0].success, false);
    assert.equal(world.completes[0].result.aborted, true);
    assert.equal(world.completes[0].result.viaChild, true);
    assert.equal(mfa.takeCompleted('pc:desk'), null, 'the note is cleared');
    assert.deepEqual(world.sounds, [], 'no reject sound');
    assert.equal(world.events.filter((e) => e.name === 'pc_signin_failed' || e.name === 'mfa_failed').length, 0);
});

test('closing with X does not cancel: reopening returns to the second pane', async () => {
    const scene = await toSecondPane();
    scene.closeByPlayer();
    await settle();
    assert.ok(mfa.pendingFor('pc:desk'), 'the pending step is kept');
    const again = await openScreen();
    assert.equal(again.signInPane, 'code');
});

test('a child that fails to start gives the screen back as it was', async () => {
    const scene = await toSecondPane();
    const real = window.startCodeDevice;
    window.startCodeDevice = () => null; // nothing opened
    const before = scene.params.onComplete;
    $('#signin-use-device').click();
    window.startCodeDevice = real;
    assert.equal(FW.currentMinigame, scene);
    assert.equal(scene.params.suspended, false);
    assert.equal(scene.params.onComplete, before);
});
