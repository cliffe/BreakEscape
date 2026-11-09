// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.3): the login case of
// handleUnlock. A sign-in PC opens its desktop when pc-sessions.js holds a session for it,
// else the sign-in screen (the password minigame in sign-in mode, with the account tiles
// refreshed from GET /login_accounts and no attempt limit); it never calls unlockTarget or
// /unlock, not even with locks disabled. interactions.js routes a sign-in PC there before
// the workstation call and the generic flow.
// unlock-system.js is imported for real, with its browser-only imports stubbed.
// Run with: node test/js/access-signin-routing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor() {}'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() { globalThis.__passwordStarts++; } export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);

globalThis.window = {};
globalThis.__passwordStarts = 0;
const { handleUnlock, openLoginSignIn } = await import(dataUrl(src));

const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', portrait: null, avatar: null }];
let calls, started, desktops, shown, sessionHeld;
function reset({ held = false, tiles = TILES, tilesError = null } = {}) {
    calls = []; started = []; desktops = []; shown = []; sessionHeld = held;
    globalThis.__passwordStarts = 0;
    window.DISABLE_LOCKS = false;
    window.breakEscapeConfig = { gameId: 3 };
    window.gameAlert = (...a) => calls.push(['alert', ...a]);
    window.ApiClient = {
        unlock: async (...a) => { calls.push(['unlock', ...a]); return { success: true }; },
        loginAccounts: async (pcId) => {
            calls.push(['loginAccounts', pcId]);
            if (tilesError) throw tilesError;
            return { pc_id: pcId, loginAccounts: tiles };
        }
    };
    window.pcSessions = {
        has: () => sessionHeld,
        get: () => (sessionHeld ? { pcId: 'hot_desk', npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', via: 'password' } : null),
        screenShown: (pcId, t) => shown.push([pcId, t])
    };
    window.startContainerMinigame = (...a) => desktops.push(a);
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (type, c, params) => started.push([type, params]) };
}
const pc = (extra = {}) => ({ scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', loginPicker: 'accounts', postitNote: 'Sam: sokafor', ...extra } });
const settle = () => new Promise(r => setTimeout(r, 0));

test('with a session, a sign-in PC opens its desktop: no /unlock, no sign-in screen', async () => {
    reset({ held: true });
    const lockable = pc();
    handleUnlock(lockable, 'item');
    await settle();
    assert.deepEqual(desktops, [[lockable, null, false, true]]);
    assert.equal(started.length, 0);
    assert.equal(calls.filter(c => c[0] === 'unlock').length, 0);
    assert.equal(lockable.scenarioData.locked, true, 'the PC stays locked');
});

test('without a session it opens the sign-in screen with refreshed tiles and no attempt limit', async () => {
    reset({ tiles: [...TILES, { username: 'lfox', displayName: 'Lena Fox' }] });
    const lockable = pc({ loginAccounts: TILES });
    handleUnlock(lockable, 'item');
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'loginAccounts'), [['loginAccounts', 'hot_desk']]);
    assert.equal(started.length, 1);
    const [type, params] = started[0];
    assert.equal(type, 'password');
    assert.equal(params.signIn.pcId, 'hot_desk');
    assert.equal(params.signIn.picker, 'accounts');
    assert.deepEqual(params.signIn.tiles.map(t => t.username), ['sokafor', 'lfox'], 'the refresh wins over room data');
    assert.equal(params.maxAttempts, undefined, 'no attempt limit of its own');
    assert.equal(params.postitNote, 'Sam: sokafor');
    assert.equal(params.showPostit, true);
    assert.deepEqual(shown.map(s => s[0]), ['hot_desk']);
    assert.equal(globalThis.__passwordStarts, 0, 'not the plain password lock');
    assert.equal(calls.filter(c => c[0] === 'unlock').length, 0);
});

test('loginPicker false shows no tiles', async () => {
    reset();
    handleUnlock(pc({ loginPicker: false }), 'item');
    await settle();
    assert.equal(started[0][1].signIn.picker, false);
    assert.deepEqual(started[0][1].signIn.tiles, []);
});

test('locks disabled for testing still never unlock a sign-in PC', async () => {
    reset();
    window.DISABLE_LOCKS = true;
    const lockable = pc();
    handleUnlock(lockable, 'item');
    await settle();
    assert.equal(lockable.scenarioData.locked, true);
    assert.equal(started.length, 1);
});

test('a signed-in screen opens the desktop; a cancelled switch returns to the desktop; a plain cancel does nothing', async () => {
    reset();
    const lockable = pc();
    await openLoginSignIn(lockable);
    sessionHeld = true;
    started[0][1].onComplete(true);
    assert.equal(desktops.length, 1);

    reset({ held: true });
    await openLoginSignIn(lockable, { switching: true });
    started[0][1].onComplete(false);
    assert.equal(desktops.length, 1, 'the session is still there, so back to its desktop');

    reset({ held: false });
    await openLoginSignIn(lockable);
    started[0][1].onComplete(false);
    assert.equal(desktops.length, 0);
});

test('an unreachable PC says so and opens nothing', async () => {
    reset({ tilesError: Object.assign(new Error('API Error: 403'), { status: 403 }) });
    await openLoginSignIn(pc());
    assert.equal(started.length, 0);
    assert.ok(calls.some(c => c[0] === 'alert' && c[1] === "This PC can't be reached"));
});

test('interactions.js sends a sign-in PC to handleUnlock before the workstation call and the generic flow', () => {
    const s = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const branch = s.indexOf("if (sprite.scenarioData.lockType === 'login') {");
    const workstation = s.indexOf('window.workstationState.onInteract(sprite.scenarioData.id)');
    const trigger = s.indexOf('if (Array.isArray(sprite.scenarioData.triggerOnInteract))');
    assert.ok(branch > 0 && branch < workstation && workstation < trigger);
    assert.match(s.slice(branch, branch + 200), /handleUnlock\(sprite, 'item'\);\s*return;/);
});

test('api-client.js has login, logout and loginAccounts, and GET errors carry a status', () => {
    const s = readFileSync(join(js, 'api-client.js'), 'utf8');
    assert.match(s, /static async login\(pcId, fields = \{\}\) \{\s*return this\.post\('\/login', \{ \.\.\.fields, pc_id: pcId \}\);/);
    assert.match(s, /static async logout\(pcId\) \{\s*return this\.post\('\/logout', \{ pc_id: pcId \}\);/);
    assert.match(s, /static async loginAccounts\(pcId\) \{\s*return this\.get\(`\/login_accounts\?pc_id=\$\{encodeURIComponent\(pcId\)\}`\);/);
    assert.match(s, /err\.status = response\.status;\s*throw err;/);
});
