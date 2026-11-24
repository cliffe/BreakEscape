// Multi-factor sign-in over the REAL scenes (ops layer S8a, client review R1-C1 and R1-C4).
// The real password screen, the real live phone scene, the real minigame manager, the real
// starters (minigame-starters.js, its other imports cut away), the real pc-sessions.js and the
// real mfa-client.js run in jsdom over a fake ApiClient. Every answer body is copied from what
// the controller sends (test/controllers/break_escape/mfa_phone_test.rb, mfa_push_test.rb and
// the models behind them): the phone rows are { pcId, host, username, n, numbers? }; a pass is
// { success: true, ..., approvedBy: 'player' }; a deny and a wrong number are both 422
// { success: false, cancelled: true }. No stand-in scene, no own starter, no invented rows.
// Run with: bin/test-js test/js/mfa-real-phone-flow.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'mfa-real-'));
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
    'minigames/authenticator/authenticator-model.js', 'minigames/authenticator/authenticator-minigame.js',
    'minigames/authenticator/authenticator-live-minigame.js', 'systems/global-writer.js',
    'utils/sync-before-fetch.js', 'systems/pc-sessions.js']) copy(f);
// The real starters file with every import but social-overlay cut: only its two phone and
// device functions are called here, and they use only socialOverlayParams
{
    // Each cut import becomes a constant of the same names set to undefined (never called here)
    const names = (clause) => [...clause.matchAll(/(?:^|[{,\s])(?:[A-Za-z_$][\w$]*\s+as\s+)?([A-Za-z_$][\w$]*)(?=\s*[,}]|\s*$)/g)]
        .map((m) => m[1]).filter((n) => n !== 'as' && n !== 'import');
    const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8')
        .replace(/^import\s+([^;]*?)\s+from\s+'(?!\.\.\/minigames\/framework\/social-overlay\.js')[^']+';\n/gm,
            (_all, clause) => `const ${names(clause).map((n) => `${n} = undefined`).join(', ')};\n`)
        .replace(/^import\s+'[^']+';\n/gm, '');
    put('systems/minigame-starters.js', src);
}

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
const { AuthenticatorLiveMinigame } = await load('minigames/authenticator/authenticator-live-minigame.js');
const { PcSessions } = await load('systems/pc-sessions.js');
const mfa = await load('systems/mfa-client.js');
await load('systems/minigame-starters.js'); // sets window.startAuthenticatorLive
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('password', PasswordMinigame);
FW.registerScene('authenticator-live', AuthenticatorLiveMinigame);

const settle = () => new Promise((r) => setTimeout(r, 0));
const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', targetId: 'sam', portrait: null, avatar: null, kinds: [] }];
const RIGHT = 47;
const ROW = (numbers) => ({ pcId: 'sam_pc', host: 'Sam PC', username: 'sokafor', n: 1, ...(numbers ? { numbers } : {}) });
const SESSION_BODY = { success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', via: 'password', approvedBy: 'player' };

const server = { kind: 'push', open: true, calls: [], refuse: null };
const refuse = (status, body) => Object.assign(new Error('refused'), { status, body });
window.ApiClient = {
    login: async (pcId, payload) => {
        server.calls.push(['login', pcId, payload]);
        server.open = true;
        return { success: false, mfaRequired: true, mfa: server.kind, pcId, npcId: 'sam',
            ...(server.kind === 'push_number_match' ? { number: RIGHT } : {}) };
    },
    get: async (path) => {
        server.calls.push(['get', path]);
        if (path.startsWith('/mfa/phone')) {
            return { requests: server.open ? [ROW(server.kind === 'push_number_match' ? [11, RIGHT, 73] : null)] : [] };
        }
        throw refuse(404, {});
    },
    post: async (path, body) => {
        server.calls.push(['post', path, body]);
        if (server.refuse && (path === '/mfa/verify' || path === '/mfa/prompt')) throw refuse(422, server.refuse);
        if (path === '/mfa/prompt') return { success: false, approved: false, promptsSent: 1 };
        if (path === '/mfa/approve') {
            const rightNumber = server.kind !== 'push_number_match' || body.number === RIGHT;
            if (body.deny === true || !rightNumber) {
                server.open = false;
                throw refuse(422, { success: false, cancelled: true });
            }
            server.open = false;
            return { ...SESSION_BODY };
        }
        throw refuse(404, {});
    }
};
window.eventDispatcher = { emit() {}, on() {} };
window.playUISound = () => {};
window.keyring = { teachOnce: () => false };
window.inventory = { items: [{ scenarioData: { type: 'phone_friendface', id: 'phoneSam', name: 'Sam\'s phone', owner: 'sam' } }] };
const sessions = new PcSessions();
window.pcSessions = sessions;
sessions.listen();

const $ = (sel) => document.querySelector(sel);
const completes = [];

async function toPhone(kind) {
    server.kind = kind;
    server.open = true;
    server.refuse = null;
    server.calls.length = 0;
    mfa.reset();
    sessions.sessions.clear?.();
    for (let i = 0; i < 4 && FW.currentMinigame && !FW.currentMinigame._ending; i += 1) FW.endMinigame(false, null);
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    completes.length = 0;
    const scene = FW.startMinigame('password', null, {
        title: 'Desk', lockable: { scenarioData: { id: 'sam_pc' } }, type: 'item', requiresKeyboardInput: true,
        signIn: { pcId: 'sam_pc', pcName: 'Sam PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false,
        onComplete: (success, result) => completes.push({ success, result })
    });
    await settle();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    assert.equal(scene.signInPane, 'push');
    $('#signin-check-phone').click();
    await settle();
    await settle();
    assert.ok(FW.currentMinigame instanceof AuthenticatorLiveMinigame, 'the real phone scene is open');
    return scene;
}

test('push: the card from the server row has Approve; a tap signs the PC in and the screen returns signed in', async () => {
    await toPhone('push');
    assert.equal(document.querySelectorAll('.auth-card-live').length, 1);
    assert.equal($('.auth-card-number'), null, 'a plain push has no number buttons');
    $('.auth-card-approve').click();
    await settle(); await settle();
    const post = server.calls.find((c) => c[1] === '/mfa/approve');
    assert.deepEqual(post[2], { pc_id: 'sam_pc' });
    assert.equal(sessions.get('sam_pc')?.npcId, 'sam', 'the session is recorded');
    assert.match($('.auth-live-status').textContent, /Approved\. Close the phone/);
    FW.endMinigame(true, FW.currentMinigame.closeResult());
    await settle(); await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame);
    assert.equal(back.gameResult?.success, true);
});

test('number matching: three number buttons; the right one signs in', async () => {
    await toPhone('push_number_match');
    const labels = [...document.querySelectorAll('.auth-card-number')].map((b) => b.textContent);
    assert.deepEqual(labels, ['11', String(RIGHT), '73']);
    assert.equal($('.auth-card-approve'), null);
    [...document.querySelectorAll('.auth-card-number')].find((b) => b.textContent === String(RIGHT)).click();
    await settle(); await settle();
    const post = server.calls.find((c) => c[1] === '/mfa/approve');
    assert.deepEqual(post[2], { pc_id: 'sam_pc', number: RIGHT });
    assert.equal(sessions.get('sam_pc')?.npcId, 'sam');
    FW.endMinigame(true, FW.currentMinigame.closeResult());
    await settle(); await settle();
    assert.equal(FW.currentMinigame.gameResult?.success, true);
});

test('deny: the phone counts a refusal and the screen says Request cancelled.', async () => {
    await toPhone('push');
    $('.auth-card-deny').click();
    await settle(); await settle();
    assert.equal(sessions.get('sam_pc'), null);
    assert.equal(FW.currentMinigame.deniedCount, 1);
    assert.match($('.auth-live-status').textContent, /^Refused\./);
    FW.endMinigame(true, FW.currentMinigame.closeResult());
    await settle(); await settle();
    const back = FW.currentMinigame;
    assert.ok(back instanceof PasswordMinigame);
    assert.equal(back.signInPane, 'password');
    assert.equal(back.signInMessageEl.textContent, 'Request cancelled.');
});

test('a wrong number cancels the request and the screen says so', async () => {
    await toPhone('push_number_match');
    [...document.querySelectorAll('.auth-card-number')].find((b) => b.textContent === '11').click();
    await settle(); await settle();
    assert.equal(sessions.get('sam_pc'), null);
    assert.equal(FW.currentMinigame.deniedCount, 1);
    assert.match($('.auth-live-status').textContent, /number did not match/);
    FW.endMinigame(true, FW.currentMinigame.closeResult());
    await settle(); await settle();
    assert.equal(FW.currentMinigame.signInPane, 'password');
    assert.equal(FW.currentMinigame.signInMessageEl.textContent, 'Request cancelled.');
});

// R1-C3: answers with no flag the client knew, as the server sends them when the step is over
async function toCodePane() {
    server.kind = 'code';
    server.refuse = null;
    mfa.reset();
    for (let i = 0; i < 4 && FW.currentMinigame && !FW.currentMinigame._ending; i += 1) FW.endMinigame(false, null);
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('password', null, {
        title: 'Desk', lockable: { scenarioData: { id: 'sam_pc' } }, type: 'item', requiresKeyboardInput: true,
        signIn: { pcId: 'sam_pc', pcName: 'Sam PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false, onComplete: () => {}
    });
    await settle();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    assert.equal(scene.signInPane, 'code');
    return scene;
}
async function typeCode(scene) {
    scene.codeField.value = '123456';
    await scene.submitCode();
    await settle();
}

test('a record that has gone (bare 422) returns to the password pane and forgets the step', async () => {
    const scene = await toCodePane();
    server.refuse = { success: false, message: 'Incorrect username or password' };
    await typeCode(scene);
    assert.equal(scene.signInPane, 'password');
    assert.equal(scene.signInMessageEl.textContent, 'That sign-in timed out. Sign in again.');
    assert.equal(mfa.pendingFor('pc:sam_pc'), null);
});

test('the login lockout during the second step shows the lockout, not Try again', async () => {
    const scene = await toCodePane();
    server.refuse = { success: false, message: 'This account is locked on this PC', lockedOut: true, attemptsLeft: 0 };
    await typeCode(scene);
    assert.match(scene.signInMessageEl.textContent, /locked/i);
    assert.equal(scene.gameResult?.reason, 'locked_out');
    assert.equal(mfa.pendingFor('pc:sam_pc'), null);
});

test('the fifth wrong code (mfaIncorrect with expired) says too many wrong codes', async () => {
    const scene = await toCodePane();
    server.refuse = { success: false, message: 'Incorrect username or password', mfaIncorrect: true, expired: true };
    await typeCode(scene);
    assert.equal(scene.signInPane, 'password');
    assert.equal(scene.signInMessageEl.textContent, 'Too many wrong codes. Sign in again.');
});

test('a bare 422 on the push pane (first step no longer allowed) returns to the password pane', async () => {
    server.kind = 'push';
    server.refuse = null;
    mfa.reset();
    for (let i = 0; i < 4 && FW.currentMinigame && !FW.currentMinigame._ending; i += 1) FW.endMinigame(false, null);
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    const scene = FW.startMinigame('password', null, {
        title: 'Desk', lockable: { scenarioData: { id: 'sam_pc' } }, type: 'item', requiresKeyboardInput: true,
        signIn: { pcId: 'sam_pc', pcName: 'Sam PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false, onComplete: () => {}
    });
    await settle();
    scene.selectSignInTile(0);
    scene.passwordField.value = 'pw';
    await scene._submitSignInOnce();
    await settle();
    assert.equal(scene.signInPane, 'push');
    server.refuse = { success: false, message: 'Incorrect username or password' };
    await scene.sendPush();
    await settle();
    assert.equal(scene.signInPane, 'password');
    assert.equal(scene.signInMessageEl.textContent, 'That sign-in timed out. Sign in again.');
});
