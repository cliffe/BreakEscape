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
const { handleUnlock, openLoginSignIn, interactLoginPc } = await import(dataUrl(src));
const { PcSessions } = await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8')));

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

// interactions.js routing and the api-client.js requests are run for real in
// access-signin-requests.test.mjs (code review R1, m9).

// ── Step 9 (5.4): the interaction at a sign-in PC ─────────────────────────────────────

function wsStub({ ownerId = 'dana', present = false, answer = 'signin' } = {}) {
    const asked = [];
    window.workstationState = {
        presence: () => ({ ownerId, present }),
        onInteract: (id) => { asked.push(id); return answer; }
    };
    return asked;
}

test('step 9: owner present shows "<owner> is using this PC" with the observations, and stops (even with a session)', async () => {
    reset({ held: true });
    const asked = wsStub({ present: true });
    const inUse = [];
    window.pcSessions.inUseShown = (pcId, ownerId) => inUse.push([pcId, ownerId]);
    window.npcManager = { getNPC: () => ({ displayName: 'Dana Reyes' }) };
    const r = await interactLoginPc(pc({ observations: 'Dana\'s desk.' }));
    assert.equal(r, 'in_use');
    const alert = calls.find(c => c[0] === 'alert');
    assert.match(alert[1], /^Dana Reyes is using this PC\.\nDana's desk\.$/);
    assert.deepEqual(asked, [], 'no workstation call, so no workstation event');
    assert.deepEqual(inUse, [['hot_desk', 'dana']]);
    assert.equal(desktops.length, 0);
    assert.equal(started.length, 0);
    delete window.npcManager;
});

test('step 9: with a session and the owner away, the desktop opens with no workstation call', async () => {
    reset({ held: true });
    const asked = wsStub({ present: false, answer: 'accessed' });
    assert.equal(await interactLoginPc(pc()), 'desktop');
    assert.equal(desktops.length, 1);
    assert.deepEqual(asked, []);
});

test('step 9: accessed claims the session; a success opens the desktop, a refusal the sign-in screen', async () => {
    reset();
    wsStub({ answer: 'accessed' });
    const claims = [];
    window.pcSessions.claim = async (pcId) => { claims.push(pcId); return { ok: true }; };
    assert.equal(await interactLoginPc(pc()), 'claimed');
    assert.deepEqual(claims, ['hot_desk']);
    assert.equal(desktops.length, 1);
    assert.equal(started.length, 0);

    reset();
    wsStub({ answer: 'accessed' });
    window.pcSessions.claim = async () => ({ ok: false, reason: 'refused' });
    assert.equal(await interactLoginPc(pc()), 'claim_refused');
    await settle();
    assert.equal(desktops.length, 0);
    assert.equal(started.length, 1);
    assert.equal(started[0][0], 'password');
    assert.equal(shown[0][0], 'hot_desk');
});

// Code review R1 m4 and R2 m3/m5: these run the real pc-sessions.js claim (not a stub), so
// each fails if its guard in PcSessions.claim is removed. The ApiClient answer is where the
// race happens: the owner sits down, or the screen auto locks, while POST /login is answered.
function realSessions(duringLogin) {
    const s = new PcSessions();
    const api = [];
    window.ApiClient = {
        ...window.ApiClient,
        login: async (pcId, fields) => {
            api.push(['login', pcId, fields.claim]);
            duringLogin();
            return { success: true, npcId: 'dana', username: 'dreyes', displayName: 'Dana Reyes', via: 'claim' };
        },
        logout: async (pcId) => { api.push(['logout', pcId]); return { success: true }; }
    };
    window.pcSessions = s;
    return { s, api };
}

test('a claim granted after the owner returned shows the message and opens no screen (code review R1, m4)', async () => {
    reset();
    let ownerBack = false;
    window.workstationState = {
        presence: () => ({ ownerId: 'dana', present: ownerBack }),
        onInteract: () => 'accessed'
    };
    const { s, api } = realSessions(() => { ownerBack = true; });
    assert.equal(await interactLoginPc(pc()), 'in_use');
    await settle();
    assert.deepEqual(api, [['login', 'hot_desk', 'owner'], ['logout', 'hot_desk']]);
    assert.equal(s.has('hot_desk'), false);
    assert.equal(desktops.length, 0);
    assert.equal(started.length, 0);
    assert.ok(calls.some(c => c[0] === 'alert' && c[1] === 'Dana Reyes is back at the desk'));
});

test('a claim granted after the screen auto locked shows the message and the sign-in screen, not the desktop (code review R2, m3)', async () => {
    reset();
    window.gameState = { globalVariables: { hot_desk_screen_locked: false, hot_desk_owner_away: true } };
    window.workstationState = {
        presence: () => ({ ownerId: 'dana', present: false }),
        onInteract: () => 'accessed'
    };
    const { s, api } = realSessions(() => { window.gameState.globalVariables.hot_desk_screen_locked = true; });
    assert.equal(await interactLoginPc(pc()), 'signin');
    await settle();
    assert.deepEqual(api.map(c => c[0]), ['login', 'logout']);
    assert.equal(s.has('hot_desk'), false);
    assert.equal(desktops.length, 0);
    assert.equal(started.length, 1);
    assert.equal(started[0][0], 'password');
    assert.ok(calls.some(c => c[0] === 'alert' && c[1] === 'The screen locked'));
    delete window.gameState;
});

test('step 9: locked, signin, attended (a race) and null all open the sign-in screen with no claim', async () => {
    for (const answer of ['locked', 'signin', 'attended', null]) {
        reset();
        wsStub({ answer, ownerId: answer === 'signin' ? null : 'dana' });
        let claimed = 0;
        window.pcSessions.claim = async () => { claimed++; return { ok: true }; };
        assert.equal(await interactLoginPc(pc()), 'signin', String(answer));
        await settle();
        assert.equal(claimed, 0, String(answer));
        assert.equal(started.length, 1, String(answer));
        assert.equal(desktops.length, 0, String(answer));
    }
});

// ── Access 9.2 H review R1 m6, m8 and m4: the hot desk's user and guest branches ──

test('R1 m6: a borrower using an unowned PC gives "<name> is using this PC" and in_use, the name raw (the toast is plain text)', async () => {
    reset();
    const asked = [];
    window.workstationState = {
        presence: () => ({ ownerId: null, present: null, userId: 'rosa', guestId: null }),
        onInteract: (id) => { asked.push(id); return 'accessed'; }
    };
    const inUse = [];
    window.pcSessions.inUseShown = (pcId, id) => inUse.push([pcId, id]);
    window.npcManager = { getNPC: () => ({ displayName: 'Rosa <b>Lane</b>' }) };
    try {
        assert.equal(await interactLoginPc(pc()), 'in_use');
        const alert = calls.find(c => c[0] === 'alert');
        // Not pre-escaped: gameAlert renders plain text, so escaping here would show "&lt;"
        assert.equal(alert[1], 'Rosa <b>Lane</b> is using this PC.');
        assert.deepEqual(asked, []);
        assert.deepEqual(inUse, [['hot_desk', 'rosa']]);
        assert.equal(desktops.length, 0);
    } finally {
        delete window.npcManager;
    }
});

test('R1 m6: accessed with a guest sends a guest claim; without one, an owner claim', async () => {
    for (const [guestId, expected] of [['ian', { as: 'guest' }], [null, undefined]]) {
        reset();
        window.workstationState = {
            presence: () => ({ ownerId: guestId ? null : 'dana', present: false, userId: null, guestId }),
            onInteract: () => 'accessed',
            guestOf: () => guestId
        };
        const claims = [];
        window.pcSessions.claim = async (pcId, opts) => { claims.push([pcId, opts]); return { ok: true }; };
        assert.equal(await interactLoginPc(pc()), 'claimed', String(guestId));
        assert.deepEqual(claims, [['hot_desk', expected]], String(guestId));
    }
});

test('R2 server m1: a refused guest claim locks the client\'s guest record; a refused owner claim does not', async () => {
    for (const [guestId, expected] of [['ian', ['hot_desk']], [null, []]]) {
        reset();
        const locked = [];
        window.workstationState = {
            presence: () => ({ ownerId: guestId ? null : 'dana', present: false, userId: null, guestId }),
            onInteract: () => 'accessed',
            guestOf: () => guestId,
            guestClaimRefused: (pcId) => locked.push(pcId)
        };
        window.pcSessions.claim = async () => ({ ok: false, reason: 'refused' });
        assert.equal(await interactLoginPc(pc()), 'claim_refused', String(guestId));
        await settle();
        assert.deepEqual(locked, expected, String(guestId));
        assert.equal(started.length, 1, 'the sign-in screen');
    }
});

test('R3 m1: a guest claim that fails on the transport (5xx, 403, no network) keeps the guest record', async () => {
    reset();
    const locked = [];
    window.workstationState = {
        presence: () => ({ ownerId: null, present: false, userId: null, guestId: 'ian' }),
        onInteract: () => 'accessed',
        guestOf: () => 'ian',
        guestClaimRefused: (pcId) => locked.push(pcId)
    };
    window.pcSessions.claim = async () => ({ ok: false, reason: 'error', error: true, status: 502, message: 'Could not reach the sign-in service' });
    assert.equal(await interactLoginPc(pc()), 'claim_refused');
    await settle();
    assert.deepEqual(locked, [], 'no lock on a transport error');
    const alert = calls.find(c => c[0] === 'alert');
    assert.equal(alert[1], 'Could not reach the sign-in service');
    assert.deepEqual(alert[5], { plainText: true });
});

test('R3 n1: a refused guest claim names the guest that was claimed', async () => {
    reset();
    const locked = [];
    window.workstationState = {
        presence: () => ({ ownerId: null, present: false, userId: null, guestId: 'ian' }),
        onInteract: () => 'accessed',
        guestOf: () => 'ian',
        guestClaimRefused: (pcId, npcId) => locked.push([pcId, npcId])
    };
    window.pcSessions.claim = async () => ({ ok: false, reason: 'refused' });
    await interactLoginPc(pc());
    await settle();
    assert.deepEqual(locked, [['hot_desk', 'ian']]);
});

test('R2 n4: the owner_returned and auto_locked alerts go in as plain text', async () => {
    for (const reason of ['owner_returned', 'auto_locked']) {
        reset();
        window.workstationState = { presence: () => ({ ownerId: 'dana', present: false }), onInteract: () => 'accessed' };
        window.pcSessions.claim = async () => ({ ok: false, reason, message: 'Dana <b>Reyes</b> is back at the desk' });
        await interactLoginPc(pc());
        await settle();
        const alert = calls.find(c => c[0] === 'alert');
        assert.deepEqual(alert[5], { plainText: true }, reason);
    }
});

test('R1 m4: a claim answered "displaced" shows the plain text message and opens no screen', async () => {
    reset();
    window.workstationState = { presence: () => ({ ownerId: null, present: null }), onInteract: () => 'accessed', guestOf: () => 'ian' };
    window.pcSessions.claim = async () => ({ ok: false, reason: 'displaced', message: 'Rosa Lane has signed in at this PC' });
    assert.equal(await interactLoginPc(pc()), 'in_use');
    await settle();
    const alert = calls.find(c => c[0] === 'alert');
    assert.equal(alert[1], 'Rosa Lane has signed in at this PC');
    assert.deepEqual(alert[5], { plainText: true });
    assert.equal(desktops.length, 0);
    assert.equal(started.length, 0);
});

// User decision q72: a switched-off PC refuses at its own keyboard too, "This PC is off."
test('a click on a switched-off PC says "This PC is off." and opens nothing, with or without a session', async () => {
    for (const held of [false, true]) {
        reset({ held });
        window.gameState = { globalVariables: { hot_desk_off: true } };
        const out = await interactLoginPc(pc({ affordance: { offWhen: 'hot_desk_off' } }));
        assert.equal(out, 'off');
        assert.equal(started.length, 0, 'no sign-in screen');
        assert.equal(desktops.length, 0, 'no desktop');
        assert.equal(calls.filter(c => c[0] === 'loginAccounts').length, 0, 'nothing is asked');
        assert.ok(calls.some(c => c[0] === 'alert' && c[1] === 'This PC is off.'));
    }
    delete window.gameState;
});

test('the { name: value } form of offWhen, and a PC switched back on, which syncs first then opens', async () => {
    reset();
    window.gameState = { globalVariables: { power: 'off' } };
    assert.equal(await interactLoginPc(pc({ affordance: { offWhen: { power: 'off' } } })), 'off');

    reset();
    const order = [];
    window.gameState = { globalVariables: { power: 'on' } };
    window.stateSync = { sync: async () => { order.push('sync'); return true; } };
    window.ApiClient.loginAccounts = async (pcId) => { order.push('loginAccounts'); return { pc_id: pcId, loginAccounts: TILES }; };
    assert.equal(await interactLoginPc(pc({ affordance: { offWhen: { power: 'off' } } })), 'signin');
    await settle();
    assert.deepEqual(order, ['sync', 'loginAccounts'], 'the server hears the switch before it is asked');
    assert.equal(started.length, 1);
    delete window.stateSync;
    delete window.gameState;
});

test('the server holding the PC off answers the sign-in screen with "This PC is off."', async () => {
    reset({ tilesError: Object.assign(new Error('API Error: 403'), { status: 403, body: { reason: 'off', error: 'This PC is off.' } }) });
    await openLoginSignIn(pc());
    assert.equal(started.length, 0);
    assert.ok(calls.some(c => c[0] === 'alert' && c[1] === 'This PC is off.'));
});

// Review R3 nit 4: client thinks on, server says off. A guest (or owner) claim refused 403 off
// shows "This PC is off." once, and no sign-in screen follows to say it again.
test('a claim refused 403 off says "This PC is off." once and opens no sign-in screen', async () => {
    for (const guestId of ['ian', null]) {
        reset();
        const locked = [];
        window.workstationState = {
            presence: () => ({ ownerId: guestId ? null : 'dana', present: false, userId: null, guestId }),
            onInteract: () => 'accessed',
            guestOf: () => guestId,
            guestClaimRefused: (pcId) => locked.push(pcId)
        };
        window.pcSessions.claim = async () => ({ ok: false, reason: 'error', error: true, status: 403, message: 'This PC is off.', serverReason: 'off' });
        assert.equal(await interactLoginPc(pc()), 'off', String(guestId));
        await settle();
        const alerts = calls.filter(c => c[0] === 'alert').map(c => c[1]);
        assert.deepEqual(alerts, ['This PC is off.'], `one toast (${guestId})`);
        assert.equal(started.length, 0, 'no sign-in screen');
        assert.deepEqual(locked, [], 'the guest record is kept');
    }
});
