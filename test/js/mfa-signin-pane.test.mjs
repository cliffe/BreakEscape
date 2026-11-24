// Multi-factor sign-in, the code pane of the sign-in screen (ops layer S8a, unit 15). The real
// password screen runs in jsdom with the real multi-factor client; the sign-in mirror and the
// server are fakes. Run with: bin/test-js test/js/mfa-signin-pane.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'mfa-signin-pane-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js',
    'minigames/container/container-item-image.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/author-html.js', 'minigames/framework/base-minigame.js',
    'utils/remote-host-text.js', 'minigames/password/password-minigame.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { PasswordMinigame } = await load('minigames/password/password-minigame.js');
const mfa = await load('systems/mfa-client.js');

const settle = () => new Promise((r) => setTimeout(r, 0));
const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', targetId: 'sam', portrait: null, avatar: null, kinds: [] },
    { username: 'admin', displayName: 'Admin', targetId: 'admin', portrait: null, avatar: null, kinds: ['in_file'] }];

// One rig per test: a fake server for the client, a fake mirror, spies for sounds and the lesson
function rig({ verify = [], device = {}, tiles = TILES } = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.requestAnimationFrame = (cb) => 1;
    window.visualViewport = null;
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    const log = { sounds: [], taught: [], requests: [], held: null };
    window.playUISound = (n) => log.sounds.push(n);
    window.keyring = { teachOnce: (k) => { log.taught.push(k); return false; } };
    const answers = verify.slice();
    mfa.reset();
    mfa.configure({
        request: async (method, path, payload) => {
            log.requests.push({ method, path, payload });
            if (path === 'mfa/verify') {
                const a = answers.length > 1 ? answers.shift() : answers[0];
                if (a.status) throw Object.assign(new Error('refused'), { status: a.status, body: a.body });
                return a.body;
            }
            if (path === 'mfa/device') return device[payload.item_id] || { deviceId: payload.item_id, enrolled: false };
            return {};
        },
        onSession: (pcId, body) => { log.held = { pcId, npcId: body.npcId, username: body.username, displayName: body.displayName, via: 'password' }; },
        emit: () => {},
        now: () => 1000
    });
    window.mfaClient = mfa;
    window.pcSessions = {
        signIn: async (pcId, username) => {
            const pending = mfa.noteRequired(`pc:${pcId}`, { mfa: 'code', npcId: username === 'admin' ? 'admin' : 'sam' });
            return { ok: false, reason: 'mfa_required', mfa: { ...pending } };
        },
        get: () => log.held
    };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles, current: null },
        showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return { mg, log };
}
const $ = (sel) => document.querySelector(sel);
async function firstStep(mg, username = 'sokafor') {
    mg.selectSignInTile(mg.signInState.tiles.findIndex((t) => t.username === username));
    mg.passwordField.value = 'pw';
    await mg._submitSignInOnce();
}
const typeCode = (mg, code) => { mg.codeField.value = code; };

test('a right password swaps to the code pane: no error line, no reject sound', async () => {
    const { mg, log } = rig();
    await firstStep(mg);
    const pane = $('#signin-second');
    assert.equal(pane.hidden, false);
    assert.equal(pane.dataset.pane, 'code');
    assert.ok($('.signin-mode').classList.contains('signin-second-step'));
    assert.equal(mg.signInMessageEl.textContent, '');
    assert.notEqual(mg.signInMessageEl.dataset.kind, 'error');
    assert.deepEqual(log.sounds, []);
    assert.equal(mg.codeField.maxLength, 6);
    assert.equal($('#signin-verify').textContent, 'Verify');
    assert.equal($('#signin-second .signin-second-title').textContent, 'Second step for Sam Okafor');
    assert.equal(mg.passwordField.value, '');
    assert.equal(mg.gameResult, null);
});

test('CSS: the pane hides the tiles and the password form, and its rules are pinned', () => {
    assert.ok(/\.signin-mode\.signin-second-step #signin-form[\s\S]*?display:\s*none !important/.test(css));
    assert.ok(/\.signin-second\[hidden\]\s*\{\s*display:\s*none/.test(css));
});

test('the field takes digits only and Verify wants six', async () => {
    const { mg, log } = rig();
    await firstStep(mg);
    mg.codeField.value = '12a4-56789';
    mg.codeField.dispatchEvent(new window.Event('input'));
    assert.equal(mg.codeField.value, '124567');
    typeCode(mg, '123');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'Enter the six-digit code.');
    assert.equal(log.requests.filter((r) => r.path === 'mfa/verify').length, 0);
});

test('teachAfter runs only after the second step passes, with the lesson noted at the first step', async () => {
    const { mg, log } = rig({ verify: [{ body: { success: true, npcId: 'admin', username: 'admin', displayName: 'Admin' } }] });
    await firstStep(mg, 'admin');
    assert.deepEqual(log.taught, [], 'not at the first step');
    typeCode(mg, '123456');
    await mg.submitCode();
    assert.deepEqual(log.taught, ['in_file']);
    assert.equal(mg.gameResult.success, true);
    assert.equal(mg.gameResult.signIn.username, 'admin');
    assert.ok(log.sounds.includes('confirm'));
    const posted = log.requests.find((r) => r.path === 'mfa/verify');
    assert.deepEqual(posted.payload, { pc_id: 'hot_desk', code: '123456' });
});

test('a first step with no lesson teaches nothing after the second', async () => {
    const { mg, log } = rig({ verify: [{ body: { success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor' } }] });
    await firstStep(mg);
    typeCode(mg, '123456');
    await mg.submitCode();
    assert.deepEqual(log.taught, []);
    assert.equal(mg.gameResult.success, true);
});

test('a wrong code shows attemptsLeft as the password pane does, with the reject sound', async () => {
    const { mg, log } = rig({ verify: [{ status: 422, body: { success: false, mfaIncorrect: true, attemptsLeft: 3 } }] });
    await firstStep(mg);
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'Incorrect code. 3 attempts left.');
    assert.equal(mg.signInMessageEl.dataset.kind, 'error');
    assert.deepEqual(log.sounds, ['reject']);
    assert.equal(mg.codeField.value, '');
    assert.equal(mg.signInPane, 'code');
});

test('a stale code says used or expired, and the pane stays', async () => {
    const { mg } = rig({ verify: [{ status: 422, body: { success: false, stale: 'used' } }, { status: 422, body: { success: false, stale: 'expired' } }] });
    await firstStep(mg);
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'That code has been used. Wait for the next one.');
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'That code has expired.');
    assert.equal(mg.signInPane, 'code');
});

test('codeLocked shows the wait and ends the screen\'s form', async () => {
    const { mg } = rig({ verify: [{ status: 422, body: { success: false, codeLocked: true, retryIn: 300 } }] });
    await firstStep(mg);
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'Too many wrong codes. Try again in 5 minutes.');
    assert.equal(mg.gameResult.reason, 'locked_out');
    assert.equal(mg.codeField.disabled, true);
});

test('a lockout from wrong codes leaves one live "Use a different account" that returns to the tiles', async () => {
    // the answer is capture row 63 of game 129, byte for byte
    const { mg } = rig({ verify: [{ status: 422, body: { success: false, message: 'This account is locked on this PC', lockedOut: true, attemptsLeft: 0 } }] });
    await firstStep(mg);
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInMessageEl.textContent, 'This account is locked on this PC.');
    assert.equal(mg.gameResult.reason, 'locked_out');
    const backs = [...document.querySelectorAll('.signin-mode button')].filter((b) => b.textContent === 'Use a different account');
    assert.equal(backs.length, 1);
    assert.equal(backs[0].disabled, false);
    backs[0].click();
    assert.equal(mg.signInPane, 'password');
    assert.equal($('#signin-second').hidden, true);
    assert.equal(mg.gameResult, null);
    assert.ok(document.querySelectorAll('.signin-tile').length >= TILES.length);
    mg.selectSignInTile(1);
    assert.equal(mg.passwordField.disabled, false);
});

test('an ended second step falls back to the password pane with a line', async () => {
    const { mg, log } = rig({ verify: [{ status: 422, body: { success: false, expired: true } }] });
    await firstStep(mg);
    typeCode(mg, '111111');
    await mg.submitCode();
    assert.equal(mg.signInPane, 'password');
    assert.equal($('#signin-second').hidden, true);
    assert.ok(!$('.signin-mode').classList.contains('signin-second-step'));
    assert.equal(mg.signInMessageEl.textContent, 'That sign-in timed out. Sign in again.');
    assert.equal(mfa.pendingFor('pc:hot_desk'), null);
    assert.ok(log.sounds.includes('reject'));
});

test('a different account button returns to the password pane and clears the pending step', async () => {
    const { mg } = rig();
    await firstStep(mg);
    $('#signin-second-back').click();
    assert.equal(mg.signInPane, 'password');
    assert.equal(mfa.pendingFor('pc:hot_desk'), null);
    assert.equal(mg.signInMessageEl.textContent === '' || mg.signInMessageEl.dataset.kind !== 'error', true);
});

test('each typeToSignIn reason shows its own line as a notice, with no reject sound', async () => {
    for (const [why, line] of [
        ['mfa', 'This PC asks for a second step. Type the password to sign in.'],
        ['password_changed', 'This password has been changed. Type the new one to sign in.']
    ]) {
        const { mg, log } = rig();
        window.pcSessions.signInWithCredential = async () => ({ ok: false, reason: 'type_to_sign_in', message: line, why, notice: true });
        await mg.useCredential({ id: 'c1', kind: 'in_file', label: 'Note', accepted: true }, mg.signInState.tiles[0]);
        assert.equal(mg.signInMessageEl.textContent, line);
        assert.equal(mg.signInMessageEl.dataset.kind, 'info');
        assert.deepEqual(log.sounds, []);
        assert.equal(mg.signInPane === undefined || mg.signInPane === 'password', true);
    }
});

// ── a new instance resumes from the client ─────────────────────────────────

function reopen(log, tiles = TILES, extra = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles, current: null },
        showPostit: false, ...extra
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}

test('a reopened screen with a pending step opens on the code pane, field empty with no read', async () => {
    const { mg, log } = rig();
    await firstStep(mg);
    mg.cleanup();
    const again = reopen(log);
    assert.equal(again.signInPane, 'code');
    assert.equal(again.codeField.value, '');
    assert.equal(log.requests.filter((r) => r.path === 'mfa/verify').length, 0, 'never submitted for the player');
});

test('the field is filled after a read of the pending account\'s device, never submitted', async () => {
    const { mg, log } = rig({ device: { devSam: { deviceId: 'devSam', npcId: 'sam', code: '482913', secondsLeft: 40 } } });
    await firstStep(mg);
    await mfa.readDevice({ itemId: 'devSam' });
    const again = reopen(log);
    assert.equal(again.signInPane, 'code');
    assert.equal(again.codeField.value, '482913');
    assert.equal(log.requests.filter((r) => r.path === 'mfa/verify').length, 0);
});

test('the field is empty after a read of another account\'s device, or one that answered enrolled false', async () => {
    const { mg, log } = rig({ device: {
        devAdmin: { deviceId: 'devAdmin', npcId: 'admin', code: '111222', secondsLeft: 40 },
        devOld: { deviceId: 'devOld', npcId: 'sam', enrolled: false }
    } });
    await firstStep(mg);
    await mfa.readDevice({ itemId: 'devAdmin' });
    assert.equal(reopen(log).codeField.value, '');
    await mfa.readDevice({ itemId: 'devSam' }); // unknown: answers enrolled false
    assert.equal(reopen(log).codeField.value, '');
    await mfa.readDevice({ itemId: 'devOld' });
    assert.equal(reopen(log).codeField.value, '');
});

test('a reopened screen with a completed answer accepts the session', async () => {
    const { mg, log } = rig();
    await firstStep(mg);
    // A push the owner approved while this screen was away: the client keeps the answer for one take
    mfa.configure({
        request: async () => ({ success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', approvedBy: 'owner' }),
        onSession: (pcId, body) => { log.held = { pcId, npcId: body.npcId, username: body.username, displayName: body.displayName }; },
        emit: () => {}, now: () => 1000
    });
    await mfa.approve('pc:hot_desk', {});
    mg.cleanup();
    const again = reopen(log);
    assert.equal(again.gameResult.success, true);
    assert.equal(again.gameResult.signIn.displayName, 'Sam Okafor');
    assert.equal(mfa.takeCompleted('pc:hot_desk'), null, 'taken once');
});

test('R3-9 a completed step begun over a foothold is not taken by the keyboard screen', async () => {
    const { log } = rig();
    mfa.noteRequired('pc:hot_desk', { mfa: 'push', npcId: 'sam' }, 'foothold:jack');
    mfa.configure({
        request: async () => ({ success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', approvedBy: 'owner' }),
        onSession: (pcId, body) => { log.held = { pcId, npcId: body.npcId }; },
        emit: () => {}, now: () => 1000
    });
    await mfa.approve('pc:hot_desk', {});
    const again = reopen(log);
    assert.equal(again.gameResult, null, 'the keyboard screen signs nobody in');
    assert.equal(mfa.peekCompleted('pc:hot_desk').route, 'foothold:jack', 'the answer waits for its own screen');
    // the keyboard route takes its own
    mfa.takeCompleted('pc:hot_desk');
    mfa.noteRequired('pc:hot_desk', { mfa: 'push', npcId: 'sam' });
    await mfa.approve('pc:hot_desk', {});
    assert.equal(reopen(log).gameResult.success, true);
});

test('R3-10 back from the phone after a lockout the screen says the account is locked, not that the sign-in timed out', () => {
    const { log } = rig();
    const lockedOut = reopen(log, TILES, { mfaPhoneOpened: true, mfaPhoneLocked: true });
    assert.equal(lockedOut.signInMessageEl.textContent, 'This account is locked on this PC.');
    assert.equal(lockedOut.gameResult.reason, 'locked_out');
    const gone = reopen(log, TILES, { mfaPhoneOpened: true });
    assert.equal(gone.signInMessageEl.textContent, 'That sign-in timed out. Sign in again.');
});

test('with nothing pending a new screen opens on the password pane', () => {
    const { log } = rig();
    const again = reopen(log);
    assert.equal(again.signInPane === undefined || again.signInPane === 'password', true);
    assert.equal($('#signin-second').hidden, true);
});

test('server and author text reaches the pane through textContent', async () => {
    const hostile = [{ username: 'sokafor', displayName: '<img src=x onerror=alert(1)>', targetId: 'sam', portrait: null, avatar: null, kinds: [] }];
    const { mg } = rig({ tiles: hostile });
    await firstStep(mg);
    assert.equal($('#signin-second img'), null);
    assert.equal($('#signin-second .signin-second-title').textContent, 'Second step for <img src=x onerror=alert(1)>');
});

test('R2-2: a step begun over a foothold is not resumed at the keyboard, nor the other way round', async () => {
    const { mg } = rig();
    mfa.noteRequired('pc:hot_desk', { mfa: 'code', npcId: 'sam' }, 'foothold:fh1');
    assert.equal(mfa.pendingFor('pc:hot_desk').route, 'foothold:fh1');
    assert.equal(mg.resumeSecondStep(), false, 'keyboard screen ignores a foothold step');
    assert.equal($('#signin-second').hidden !== false, true);
    mg.signIn.remote = { footholdId: 'fh1' };
    assert.equal(mg.resumeSecondStep(), true, 'the same foothold resumes it');
    assert.equal($('#signin-second').dataset.pane, 'code');
    mg.signIn.remote = { footholdId: 'fh2' };
    assert.equal(mg.resumeSecondStep(), false, 'another foothold does not');
    mfa.noteRequired('pc:hot_desk', { mfa: 'code', npcId: 'sam' });
    assert.equal(mfa.pendingFor('pc:hot_desk').route, undefined);
    mg.signIn.remote = null;
    assert.equal(mg.resumeSecondStep(), true, 'a keyboard step resumes at the keyboard');
});

test('F4: a pane that opens again keeps the account name from the first step', async () => {
    const { mg } = rig();
    await firstStep(mg);
    assert.equal($('#signin-second .signin-second-title').textContent, 'Second step for Sam Okafor');
    // A new screen instance has no params of its own: the name comes from the held step
    mg.params.mfaAccount = null;
    mg.signInState.tiles = [];
    assert.equal(mg.resumeSecondStep(), true);
    assert.equal($('#signin-second .signin-second-title').textContent, 'Second step for Sam Okafor');
});
