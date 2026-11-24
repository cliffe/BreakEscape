// Multi-factor sign-in, the push pane of the sign-in screen (ops layer S8a, unit 21). The real
// password screen and the real minigame manager run in jsdom with the real multi-factor client
// over a fake server; the live phone scene is a small stand-in.
// Run with: bin/test-js test/js/mfa-signin-push-pane.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'mfa-push-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js',
    'minigames/container/container-item-image.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/author-html.js', 'minigames/framework/base-minigame.js',
    'utils/remote-host-text.js', 'minigames/password/password-minigame.js', 'systems/mfa-client.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/social-overlay.js', 'ui/modal-stack.js']) copy(f);

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
const { MinigameScene } = await load('minigames/framework/base-minigame.js');
const mfa = await load('systems/mfa-client.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// A stand-in for the live phone scene: it ends when told to, with the result the real one gives
class PhoneStub extends MinigameScene {
    init() { super.init(); this.gameContainer.id = 'phone-stub'; }
}
FW.registerScene('password', PasswordMinigame);
FW.registerScene('authenticator-live', PhoneStub);

const settle = () => new Promise((r) => setTimeout(r, 0));
const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', targetId: 'sam', portrait: null, avatar: null, kinds: [] }];
const world = { sounds: [], events: [], requests: [], completes: [], kind: 'push', prompts: [], phoneOpens: [] };

window.playUISound = (n) => world.sounds.push(n);
window.eventDispatcher = { emit: (name, data) => world.events.push({ name, data }) };
window.keyring = { teachOnce: () => false };
window.inventory = { items: [] };
window.pcSessions = {
    signIn: async () => ({ ok: false, reason: 'mfa_required', mfa: { ...mfa.noteRequired('pc:desk', { mfa: world.kind, npcId: 'sam', number: world.kind === 'push_number_match' ? 47 : undefined }) } }),
    get: () => null
};
window.startAuthenticatorLive = (p) => { world.phoneOpens.push(p); return FW.startMinigame('authenticator-live', null, { disableClose: true, ...p }); };
mfa.configure({
    request: async (method, path, payload) => {
        world.requests.push({ path, payload });
        if (path === 'mfa/prompt') {
            const a = world.prompts.length > 1 ? world.prompts.shift() : world.prompts[0];
            if (a.status) throw Object.assign(new Error('refused'), { status: a.status, body: a.body });
            return a.body;
        }
        return {};
    },
    onSession: () => {}, emit: (n, d) => world.events.push({ name: n, data: d }), now: () => 1000
});
window.mfaClient = mfa;

const waiting = (n) => ({ body: { success: false, approved: false, promptsSent: n } });
const SAM_PHONE = { scenarioData: { type: 'phone_friendface', id: 'phoneSam', name: 'Sam\'s phone', owner: 'sam' } };

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
async function toPushPane({ kind = 'push', prompts = [waiting(1)], items = [] } = {}) {
    mfa.reset();
    world.kind = kind;
    world.prompts = prompts.slice();
    world.requests.length = 0;
    world.sounds.length = 0;
    world.events.length = 0;
    world.phoneOpens.length = 0;
    window.inventory.items = items;
    const scene = await openScreen();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    return scene;
}
const $ = (sel) => document.querySelector(sel);
const sent = () => world.requests.filter((r) => r.path === 'mfa/prompt').length;

test('a push kind shows the push pane, sends the first request, and shows the count; no reject sound', async () => {
    const scene = await toPushPane();
    assert.equal(scene.signInPane, 'push');
    assert.equal($('#signin-second').dataset.pane, 'push');
    assert.equal($('.signin-push-status').textContent, 'A request was sent to Sam Okafor\'s phone.');
    assert.equal(sent(), 1);
    assert.equal($('.signin-push-count').textContent, 'Requests sent: 1');
    assert.equal($('.signin-push-number').hidden, true);
    assert.deepEqual(world.sounds, []);
    assert.equal($('#signin-check-phone'), null);
});

test('number matching shows the one right number the answer carried', async () => {
    await toPushPane({ kind: 'push_number_match' });
    const n = $('.signin-push-number');
    assert.equal(n.hidden, false);
    assert.equal(n.textContent, 'Number: 47');
});

test('Send again is disabled for the server wait and sends another when it opens', async () => {
    await toPushPane({ prompts: [waiting(1), { status: 422, body: { success: false, tooSoon: true, retryAfterS: 0.05 } }, waiting(2)] });
    const again = $('#signin-send-again');
    assert.equal(again.disabled, true, 'held after a send');
    await new Promise((r) => setTimeout(r, 2100));
    assert.equal(again.disabled, false);
    again.click();
    await settle();
    assert.equal(sent(), 2);
    assert.equal(again.disabled, true, 'held after the refusal');
    assert.ok($('.signin-push-status'));
    await new Promise((r) => setTimeout(r, 120));
    assert.equal(again.disabled, false, 'opens after retryAfterS');
});

test('the owner approving the request signs the screen in', async () => {
    const scene = await toPushPane({ prompts: [{ body: { success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', approvedBy: 'owner' } }] });
    assert.equal(scene.gameResult.success, true);
    assert.equal(scene.gameResult.signIn.username, 'sokafor');
});

test('the phone button shows only with the owner\'s held phone', async () => {
    await toPushPane({ items: [{ scenarioData: { type: 'phone_friendface', id: 'mine', name: 'My phone' } },
        { scenarioData: { type: 'phone_friendface', id: 'other', owner: 'admin' } }] });
    assert.equal($('#signin-check-phone'), null, 'own phone and another owner\'s phone do not count');
    await toPushPane({ items: [SAM_PHONE] });
    assert.equal($('#signin-check-phone').textContent, 'Check Sam Okafor\'s phone');
});

test('the phone opens as a child; X returns to the push pane without another request', async () => {
    const scene = await toPushPane({ items: [SAM_PHONE] });
    $('#signin-check-phone').click();
    await settle();
    assert.equal(world.phoneOpens.length, 1);
    assert.equal(world.phoneOpens[0].npcId, 'sam');
    assert.equal(world.phoneOpens[0].returnTo.sceneType, 'password');
    assert.equal(scene.params.suspended, true);
    assert.deepEqual(world.completes, []);
    FW.endMinigame(true, null);
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene);
    assert.equal(back.signInPane, 'push');
    assert.equal(sent(), 1, 'no second request');
    assert.equal(back.params.onComplete._mfaOriginal, undefined);
});

test('an approval on the phone returns the screen signed in', async () => {
    const scene = await toPushPane({ items: [SAM_PHONE] });
    $('#signin-check-phone').click();
    await settle();
    await mfa.approve('pc:desk', {}); // the phone scene's tap: the server passes it
    world.requests.length = 0;
    // the stand-in's own success leaves nothing for the parent to read but the client's note
    window.pcSessions.get = () => null;
    FW.endMinigame(true, { approved: 1, denied: 0, mode: 'live' });
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene);
    assert.equal(back.gameResult?.success, true);
    assert.deepEqual(world.sounds.filter((s) => s === 'reject'), []);
});

test('a denial on the phone returns to the password pane with Request cancelled.', async () => {
    const scene = await toPushPane({ items: [SAM_PHONE] });
    $('#signin-check-phone').click();
    await settle();
    mfa.clear('pc:desk'); // the client drops the pending step on a cancelled answer
    FW.endMinigame(true, { approved: 0, denied: 1, mode: 'live' });
    await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame && back !== scene);
    assert.equal(back.signInPane, 'password');
    assert.equal(back.signInMessageEl.textContent, 'Request cancelled.');
});

test('an expired step returns to the password pane', async () => {
    await toPushPane({ items: [SAM_PHONE] });
    $('#signin-check-phone').click();
    await settle();
    mfa.clear('pc:desk');
    FW.endMinigame(true, null);
    await settle();
    const back = FW.currentMinigame;
    assert.equal(back.signInPane, 'password');
    assert.equal(back.signInMessageEl.textContent, 'That sign-in timed out. Sign in again.');
});

test('a refused request (cancelled or expired) on Send again returns to the password pane', async () => {
    await toPushPane({ prompts: [waiting(1), { status: 422, body: { success: false, cancelled: true } }] });
    await new Promise((r) => setTimeout(r, 2100));
    $('#signin-send-again').click();
    await settle();
    const scene = FW.currentMinigame;
    assert.equal(scene.signInPane, 'password');
    assert.equal(scene.signInMessageEl.textContent, 'Request cancelled.');
});

test('a phone child forced shut releases the screen once, quietly', async () => {
    await toPushPane({ items: [SAM_PHONE] });
    $('#signin-check-phone').click();
    await settle();
    world.sounds.length = 0;
    world.events.length = 0;
    FW.endMinigame(false, null);
    await settle();
    assert.equal(world.completes.length, 1);
    assert.equal(world.completes[0].success, false);
    assert.equal(world.completes[0].result.aborted, true);
    assert.equal(world.completes[0].result.viaChild, true);
    assert.deepEqual(world.sounds, []);
    assert.equal(world.events.filter((e) => e.name === 'pc_signin_failed' || e.name === 'mfa_failed').length, 0);
});
