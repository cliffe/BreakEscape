// Keyring K3c (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 8.3): the relay desktop. A relay
// session (an accepted assist invite) opens its desktop by openRelayDesktop with relay=1 on
// every fetch; the desktop reads "Remote assist session" and "Using {name}'s session
// ({username})", has one Disconnect (POST /logout) and the no-shares line; a folder under it
// names relay=1 and closing it reopens the relay desktop; a 403 closes to the world with the
// ended line, never the sign-in screen; endedRelayPcIds closes it with the same line. At the
// holder's keyboard (interactLoginPc and openLoginPc) the relay counts as no session.
// The real unlock-system.js (its browser-only imports stubbed), container-minigame.js and
// pc-sessions.js run against jsdom (harness as access-remote-signin.test.mjs).
// Run with: node test/js/access-relay-desktop.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'relay-desktop-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/constants.js', 'export const DOOR_ALIGN_OVERLAP = 64;\n');
put('core/rooms.js', 'export const rooms = {};\n');
put('systems/doors.js', 'export function unlockDoor() {}\n');
put('systems/minigame-starters.js', ['startLockpickingMinigame', 'startKeySelectionMinigame', 'startPinMinigame', 'startPasswordMinigame',
    'startRansomwareDisplayMinigame', 'startBackupRecoveryMinigame', 'startInfusionPumpMinigame'].map(n => `export function ${n}() {}`).join('\n'));
put('systems/ui-sounds.js', 'export function playUISound() {}\n');
put('minigames/biometrics/fingerprint-reader-minigame.js', 'export function startFingerprintReader() {}\n');
put('minigames/ble-scanner/ble-scanner-minigame.js', 'export function applyBlePairEffects() {}\n');
put('systems/lockpick-catch.js', 'export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/lock-scope-refusal.js'); // unlock-system.js now imports unlockWithRouteRoomRetry from here (GATED_DOOR §3.6)
copy('utils/dispense-on-unlock.js'); // unlock-system.js imports it (dispenses containers)
copy('utils/more-below.js');
copy('utils/computer-keywords.js');
copy('utils/pc-monitor.js');
copy('utils/npc-headshot.js');
copy('utils/pc-taskbar.js');
copy('utils/author-html.js');
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/locked-hint.js', 'utils/conditional-text.js', 'systems/global-writer.js', 'systems/captures.js',
    'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js', 'utils/sync-before-fetch.js', 'systems/keyring.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { openLoginSignIn, interactLoginPc, openLoginPc, openRelayDesktop, relayLockable, heldAtKeyboard } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { Keyring } = await imp('systems/keyring.js');
const { ContainerMinigame, folderRouteQuery } = await imp('minigames/container/container-minigame.js');
const { endedAssistMessage, RELAY_FOLDER_UNAVAILABLE_TEXT } = await imp('utils/remote-host-text.js');

const startAction = (id) => { document.querySelector('.pc-start-btn').click(); document.getElementById(`pc-start-${id}`).click(); };
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const JAKE_PC = { id: 'jake_pc', type: 'pc', name: "Jake's PC", host: 'HB-FIN-03', lockType: 'login', locked: true, loginPicker: 'accounts' };
const RELAY_ANSWER = { success: true, npcId: 'jake', username: 'jbrooks', displayName: 'Jake Brooks', via: 'credential',
    kind: 'assist_invite', label: 'Remote assist code', relay: true, host: 'HB-FIN-03' };

let calls, started, alerts, sessions, fetches, fetchAnswer, signInScreens, fetchFor;
globalThis.__fetchAnswer = () => fetchAnswer;

function setup() {
    fetchFor = null;
    calls = []; started = []; alerts = []; fetches = []; signInScreens = [];
    fetchAnswer = { status: 200, body: { contents: [{ id: 'jake_docs', type: 'folder', name: 'Documents', contents: [] }],
        session: { ...RELAY_ANSWER } } };
    document.body.innerHTML = '';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameId = 5;
    window.gameState = { globalVariables: {} };
    window.gameScenario = { rooms: { jake_office: { objects: [JAKE_PC] } } };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.ApiClient = {
        loginAccounts: async (pcId) => { calls.push(['loginAccounts', pcId]); return { loginAccounts: [{ username: 'jbrooks', displayName: 'Jake Brooks' }], loginPicker: 'accounts' }; },
        loginWithCredential: async (pcId, id, route) => { calls.push(['loginWithCredential', pcId, id, route]); return { ...RELAY_ANSWER }; },
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; },
        get: async (path) => { calls.push(['get', path]); return { secrets: {}, accounts: {} }; }
    };
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(url);
        const fetchAnswer = fetchFor ? fetchFor(url) : globalThis.__fetchAnswer();
        return { ok: fetchAnswer.status === 200, status: fetchAnswer.status, statusText: String(fetchAnswer.status), json: async () => fetchAnswer.body };
    };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.networkLinks = null;
    window.openLoginSignIn = (...a) => { signInScreens.push(a); };
    window.openRelayDesktop = openRelayDesktop;
    window.MinigameFramework = {
        mainGameScene: {},
        currentMinigame: null,
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            started.push([type, params]);
            let m;
            if (type === 'container') {
                const el = document.createElement('div');
                document.body.appendChild(el);
                m = new ContainerMinigame(el, params);
                this.currentMinigame = m;
                m._sceneType = type;
                m.init();
                m.start();
            } else {
                m = { _sceneType: type, params, cleanup() {} };
                this.currentMinigame = m;
            }
            return m;
        },
        endMinigame(success, result) {
            const m = this.currentMinigame;
            if (!m || m._ending) return;
            m._ending = true;
            m.cleanup();
            m.params?.onComplete?.(success, result);
            if (this.currentMinigame === m) this.currentMinigame = null;
            m.container?.remove?.();
        }
    };
    window.startContainerMinigame = (item, contents, takeable, desktop, extra = {}) =>
        window.MinigameFramework.startMinigame('container', null, { title: item.scenarioData.name, containerItem: item, contents, isTakeable: takeable, desktopMode: desktop, cancelText: 'Close', showCancel: true, ...extra });
}

const current = () => window.MinigameFramework.currentMinigame;

async function relayDesktopOpen() {
    const r = await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    assert.equal(r.ok, true);
    assert.equal(openRelayDesktop('jake_pc'), true);
    await settle();
}

test('relayLockable is the PC with remote: { relay: true } and no foothold', () => {
    setup();
    const l = relayLockable('jake_pc');
    assert.equal(l.scenarioData.id, 'jake_pc');
    assert.deepEqual(l.scenarioData.remote, { relay: true });
    assert.equal(l.scenarioData.lockType, 'login');
    assert.equal(l.scenarioData.name, "Jake's PC");
});

test('openRelayDesktop opens nothing with no relay held', () => {
    setup();
    assert.equal(openRelayDesktop('jake_pc'), false);
    sessions.sessions.set('jake_pc', { npcId: 'jake', username: 'jbrooks', via: 'password' });
    assert.equal(openRelayDesktop('jake_pc'), false, 'a keyboard session is not a relay');
    assert.equal(started.length, 0);
});

test('the relay sign-in posts relay: true, and the desktop fetch says relay=1', async () => {
    setup();
    await relayDesktopOpen();
    assert.deepEqual(calls.find(c => c[0] === 'loginWithCredential'), ['loginWithCredential', 'jake_pc', 'jake_assist', { relay: true }]);
    assert.equal(fetches.length, 1);
    assert.match(fetches[0], /\/container\/jake_pc\?relay=1$/);
    assert.ok(current() instanceof ContainerMinigame);
    assert.ok(current().relay, 'the container knows it is a relay desktop');
    assert.equal(current().remote, null, 'a relay desktop is no network screen');
});

test('the relay desktop reads "Remote assist session" and "Using Jake Brooks\'s session (jbrooks)", with no link line', async () => {
    setup();
    await relayDesktopOpen();
    const text = document.body.textContent;
    assert.match(text, /Remote assist session/);
    assert.match(text, /Using Jake Brooks's session \(jbrooks\)/);
    assert.doesNotMatch(text, /Remote session through/);
    assert.doesNotMatch(text, /Remote through/);
});

test('the start panel has one Disconnect (no Switch user, Sign out or Lock) and the no-shares line', async () => {
    setup();
    await relayDesktopOpen();
    assert.ok(document.getElementById('pc-start-disconnect'), 'Disconnect is offered');
    for (const id of ['switch', 'signout', 'lock']) assert.ok(document.getElementById(`pc-start-${id}`) === null, `${id} is not offered`);
    assert.match(document.body.textContent, /Shared drives are not mapped over remote assist\./);
    assert.equal(document.querySelectorAll('.pc-start-share').length, 0, 'no share is listed');
});

test('Disconnect is POST /logout and closes to the world, never the sign-in screen', async () => {
    setup();
    await relayDesktopOpen();
    startAction('disconnect');
    await settle(6);
    assert.ok(calls.some(c => c[0] === 'logout' && c[1] === 'jake_pc'));
    assert.equal(sessions.has('jake_pc'), false);
    assert.equal(current(), null);
    assert.equal(signInScreens.length, 0);
    assert.ok(alerts.some(a => a[0] === 'Disconnected'));
});

test('endedRelayPcIds closes the open relay desktop with "Jake Brooks ended the remote assist."', async () => {
    setup();
    await relayDesktopOpen();
    sessions.relayAnswer({ endedRelayPcIds: ['jake_pc'] });
    await settle();
    assert.equal(current(), null);
    assert.ok(alerts.some(a => a[0] === endedAssistMessage('Jake Brooks')));
    assert.equal(alerts.find(a => a[0] === endedAssistMessage('Jake Brooks'))[0], 'Jake Brooks ended the remote assist.');
    assert.equal(signInScreens.length, 0);
    assert.ok(!calls.some(c => c[0] === 'logout'), 'the server already ended it: no request');
});

test('a 403 on the relay desktop drops the session and closes to the world with the ended line', async () => {
    setup();
    await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    fetchAnswer = { status: 403, body: { error: 'Not signed in: jake_pc', reason: 'no_session' } };
    openRelayDesktop('jake_pc');
    await settle(6);
    assert.equal(sessions.has('jake_pc'), false);
    assert.equal(current(), null);
    assert.equal(signInScreens.length, 0, 'never the sign-in screen');
    assert.ok(alerts.some(a => a[0] === 'Jake Brooks ended the remote assist.'));
    assert.ok(!alerts.some(a => a[0] === RELAY_FOLDER_UNAVAILABLE_TEXT), 'no folder toast when the assist ended');
});

test('a folder under the relay desktop names relay=1, and its Close reopens the relay desktop', async () => {
    setup();
    await relayDesktopOpen();
    const folder = { scenarioData: { id: 'jake_docs', type: 'folder', name: 'Documents', locked: false }, sourcePcId: 'jake_pc' };
    fetchAnswer = { status: 200, body: { contents: [] } };
    window.startContainerMinigame(folder, null, false, false, { sourcePcId: 'jake_pc' });
    await settle(6);
    assert.ok(fetches.some(u => /\/container\/jake_docs\?relay=1$/.test(u)), `fetched ${fetches.join(', ')}`);
    fetches.length = 0;
    fetchAnswer = { status: 200, body: { contents: [], session: { ...RELAY_ANSWER } } };
    current().complete(false);
    await settle(6);
    assert.ok(current() instanceof ContainerMinigame);
    assert.ok(current().relay, 'the relay desktop again');
    assert.ok(fetches.some(u => /\/container\/jake_pc\?relay=1$/.test(u)));
});

// R2 m1: the server sends no reason for a locked or powered-off folder (games_controller.rb:634, :3664),
// so a relay folder 403 only closes the folder and the reopened desktop decides
const FOLDER_403 = { status: 403, body: { error: 'Container not unlocked: jake_docs' } };
const folderOf = () => ({ scenarioData: { id: 'jake_docs', type: 'folder', name: 'Documents', locked: false }, sourcePcId: 'jake_pc' });

test('a reason-less folder 403 under a live relay closes the folder only; the relay desktop reopens', async () => {
    setup();
    await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    fetchFor = (url) => (/jake_docs/.test(url) ? FOLDER_403 : { status: 200, body: { contents: [], session: { ...RELAY_ANSWER } } });
    window.startContainerMinigame(folderOf(), null, false, false, { sourcePcId: 'jake_pc' });
    await settle(8);
    assert.equal(sessions.isRelay('jake_pc'), true, 'the relay is kept');
    assert.ok(current() instanceof ContainerMinigame && current().relay, 'the relay desktop is open again');
    assert.ok(!alerts.some(a => /ended the remote assist/.test(a[0])), 'no ended line');
    // R3 t2: exactly one folder fetch and one desktop fetch (no double fetch)
    assert.equal(fetches.filter(u => /jake_docs/.test(u)).length, 1, 'one folder fetch');
    assert.equal(fetches.filter(u => /jake_pc\?relay=1/.test(u)).length, 1, 'one desktop fetch');
    // R3 t3: a really locked folder says so once the desktop is back
    assert.deepEqual(alerts.filter(a => a[0] === RELAY_FOLDER_UNAVAILABLE_TEXT).length, 1, 'the folder toast');
});

test('a reason-less folder 403 after the assist ended: the reopened desktop says so', async () => {
    setup();
    await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    fetchFor = (url) => (/jake_docs/.test(url) ? FOLDER_403
        : { status: 403, body: { error: 'Not signed in: jake_pc', reason: 'no_session' } });
    window.startContainerMinigame(folderOf(), null, false, false, { sourcePcId: 'jake_pc' });
    await settle(8);
    assert.equal(sessions.has('jake_pc'), false);
    assert.equal(current(), null);
    assert.ok(alerts.some(a => a[0] === 'Jake Brooks ended the remote assist.'));
});

test('folderRouteQuery: relay=1 for a relay, foothold= for a remote session, nothing at the keyboard or with none', () => {
    const fake = (s) => ({ get: () => s });
    assert.equal(folderRouteQuery('jake_pc', fake({ relay: true })), '?relay=1');
    assert.equal(folderRouteQuery('lena_pc', fake({ remote: true, footholdId: 'jack a' })), '?foothold=jack%20a');
    assert.equal(folderRouteQuery('lena_pc', fake({ remote: false, via: 'password' })), '', 'a keyboard session names no route');
    assert.equal(folderRouteQuery('lena_pc', fake(null)), '');
    assert.equal(folderRouteQuery(null, fake({ relay: true })), '');
});

test('a folder under a foothold session names foothold=; one at the keyboard names no route (K2 m4)', async () => {
    setup();
    sessions.sessions.set('lena_pc', { npcId: 'lena', username: 'lfox', via: 'password', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02' });
    fetchAnswer = { status: 200, body: { contents: [] } };
    window.startContainerMinigame({ scenarioData: { id: 'lena_docs', type: 'folder', name: 'Docs', locked: false }, sourcePcId: 'lena_pc' }, null, false, false, { sourcePcId: 'lena_pc' });
    await settle(6);
    assert.ok(fetches.some(u => /\/container\/lena_docs\?foothold=jack_comms_port$/.test(u)), `fetched ${fetches.join(', ')}`);
    window.MinigameFramework.endMinigame(false, null);
    fetches.length = 0;
    sessions.sessions.set('lena_pc', { npcId: 'lena', username: 'lfox', via: 'password', remote: false, footholdId: null, host: null });
    window.startContainerMinigame({ scenarioData: { id: 'lena_docs', type: 'folder', name: 'Docs', locked: false }, sourcePcId: 'lena_pc' }, null, false, false, { sourcePcId: 'lena_pc' });
    await settle(6);
    assert.ok(fetches.some(u => /\/container\/lena_docs$/.test(u)), `fetched ${fetches.join(', ')}`);
});

test('at the holder\'s keyboard the relay is no session: interactLoginPc and openLoginPc open the sign-in screen', async () => {
    setup();
    await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
    assert.equal(heldAtKeyboard('jake_pc'), false);
    const sprite = { scenarioData: { ...JAKE_PC } };
    window.openLoginSignIn = openLoginSignIn;
    const result = await interactLoginPc(sprite);
    assert.notEqual(result, 'desktop', 'the world click never opens the relay desktop');
    await settle();
    assert.ok(started.some(([type]) => type === 'password'), 'the sign-in screen opened');
    const screen = started.find(([type]) => type === 'password')[1];
    assert.equal(screen.signIn.current, null, 'the relay is not the current session there');
    assert.ok(!fetches.some(u => /jake_pc/.test(u)), 'no desktop fetch');
    started.length = 0;
    openLoginPc(sprite);
    await settle();
    assert.equal(started[0]?.[0], 'password');
    assert.equal(sessions.isRelay('jake_pc'), true, 'the relay is still held');
});

test('re-entry is by Connect: openRelayDesktop reaches the held relay again after a close', async () => {
    setup();
    await relayDesktopOpen();
    current().complete(false);
    await settle();
    assert.equal(current(), null, 'the relay desktop closes to the world');
    assert.equal(openRelayDesktop('jake_pc'), true);
    await settle();
    assert.ok(current()?.relay);
});

test('loop guard: closing the relay desktop itself reopens nothing (its sourcePcId is its own PC)', async () => {
    setup();
    await relayDesktopOpen();
    const opened = started.length;
    current().complete(false);
    await settle(8);
    assert.equal(current(), null, 'closed to the world');
    assert.equal(started.length, opened, 'no desktop reopened');
    assert.equal(fetches.filter(u => /jake_pc/.test(u)).length, 1, 'one desktop fetch only');
});

// R1 M1: after a reload the server still holds the relay but the mirror is empty. Connect must
// sign in again with { relay: true } and open the real relay desktop (real pc-sessions, real
// openRelayDesktop), not call openRelayDesktop on nothing.
test('Connect on a server-held relay with an empty mirror signs in again by the relay and opens the desktop', async () => {
    setup();
    const posts = [];
    window.ApiClient.keyring = async () => ({ rev: 'r1', entries: [{
        id: 'jake_assist', kind: 'assist_invite', source: 'registry', label: 'Remote assist code', account: { username: 'jbrooks', displayName: 'Jake Brooks' },
        host: 'HB-FIN-03', connectsTo: 'jake_pc', heldItem: 'jake_assist_code', routes: [{ relay: true }],
        sessionHeld: true, targetOff: false, remoteBlocked: false, ended: false }] });
    const real = window.ApiClient.loginWithCredential;
    window.ApiClient.loginWithCredential = async (...a) => { posts.push(a); return real(...a); };
    window.stateSync = { syncConfirmed: async () => {}, sync: () => Promise.resolve(true) };
    window.eventDispatcher = { emit: () => {}, on: () => {}, off: () => {} };
    assert.equal(sessions.isRelay('jake_pc'), false, 'nothing mirrored');
    const kr = new Keyring();
    const r0 = await kr.connect({ scenarioData: { id: 'jake_assist_code', name: 'Remote assist code' } });
    await settle(8);
    assert.equal(posts.length, 1, JSON.stringify([r0, alerts]));
    assert.equal(posts[0][1], 'jake_assist');
    assert.equal(posts[0][2].relay, true);
    assert.equal(sessions.isRelay('jake_pc'), true);
    assert.ok(current() instanceof ContainerMinigame && current().relay, 'the relay desktop is open');
});

// R1 m1: a powered-off PC refuses with reason off or not_responding, which is not an end
for (const reason of ['off', 'not_responding']) {
    test(`a ${reason} 403 on the relay desktop keeps the relay and says the PC is off, not ended`, async () => {
        setup();
        await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
        fetchAnswer = { status: 403, body: { error: 'PC is off: jake_pc', reason } };
        openRelayDesktop('jake_pc');
        await settle(6);
        assert.equal(sessions.isRelay('jake_pc'), true, 'the relay is kept');
        assert.equal(current(), null);
        assert.equal(signInScreens.length, 0);
        assert.ok(!alerts.some(a => /ended the remote assist/.test(a[0])), 'no ended line');
        assert.equal(alerts.length, 1, JSON.stringify(alerts));
    });
    test(`a ${reason} 403 on a relay folder keeps the relay and says the PC is off, not ended`, async () => {
        setup();
        await sessions.signInWithCredential('jake_pc', 'jake_assist', { relay: true });
        const folder = { scenarioData: { id: 'jake_docs', type: 'folder', name: 'Documents', locked: false }, sourcePcId: 'jake_pc' };
        // The server's real folder body has no reason; the reopened desktop gets the PC-off reason
        fetchFor = (url) => (/jake_docs/.test(url) ? FOLDER_403 : { status: 403, body: { error: 'PC is off: jake_pc', reason } });
        window.startContainerMinigame(folder, null, false, false, { sourcePcId: 'jake_pc' });
        await settle(6);
        assert.equal(sessions.isRelay('jake_pc'), true, 'the relay is kept');
        assert.equal(current(), null);
        assert.ok(!alerts.some(a => /ended the remote assist/.test(a[0])), 'no ended line');
        assert.equal(alerts.length, 1, JSON.stringify(alerts));
    });
}
