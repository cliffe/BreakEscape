// Keyring K4 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md section 9): a desktop reached from
// another desktop (from=). Its fetch names from=, a 403 follows the foothold desktop's reasons
// (unreachable and not_responding keep the session and say the route line; any other 403 drops
// the copy and says the session ended; never the keyboard sign-in screen), closing it does not
// reopen it, a folder under it reopens it, and desktop Connect copies or moves the file first.
// Same harness as access-relay-desktop.test.mjs; run it the same way:
// (ulimit -v 2000000; node --max-old-space-size=300 test/js/access-from-desktop.test.mjs)
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
const dir = mkdtempSync(join(tmpdir(), 'from-desktop-'));
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
put('systems/lockpick-catch.js', 'export function catchLockpickInView() { return false; }\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/lock-scope-refusal.js'); // unlock-system.js now imports unlockWithRouteRoomRetry from here (GATED_DOOR §3.6)
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
    'utils/remote-host-text.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/keyring.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { openFromDesktop, fromLockable, openRemoteDesktop } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { Keyring } = await imp('systems/keyring.js');
const { ContainerMinigame, folderRouteQuery, transferChoices } = await imp('minigames/container/container-minigame.js');
const { unreachableMessage, notRespondingMessage } = await imp('utils/remote-host-text.js');

const startAction = (id) => { document.querySelector('.pc-start-btn').click(); document.getElementById(`pc-start-${id}`).click(); };
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const OPS_PC = { id: 'ops_pc', type: 'pc', name: 'Ops PC', host: 'OPS-PC', lockType: 'login', locked: true, loginPicker: 'accounts' };
const JAKE_PC = { id: 'jake_pc', type: 'pc', name: "Jake's PC", host: 'HB-FIN-03', lockType: 'login', locked: true, loginPicker: 'accounts' };
const FROM_ANSWER = { success: true, npcId: 'ops_admin', username: 'ops', displayName: 'Ops Admin', via: 'credential', kind: 'saved_connection',
    label: 'Ops RDP', remote: true, footholdId: null, host: 'OPS-PC', fromPcId: 'lena_pc', fromHost: 'LENA-PC' };
const RELAY_ANSWER = { success: true, npcId: 'jake', username: 'jbrooks', displayName: 'Jake Brooks', via: 'credential',
    kind: 'assist_invite', label: 'Remote assist code', relay: true, host: 'HB-FIN-03' };

let calls, started, alerts, sessions, fetches, fetchAnswer, signInScreens, fetchFor;
globalThis.__fetchAnswer = () => fetchAnswer;

function setup() {
    fetchFor = null;
    calls = []; started = []; alerts = []; fetches = []; signInScreens = [];
    fetchAnswer = { status: 200, body: { contents: [{ id: 'jake_docs', type: 'folder', name: 'Documents', contents: [] }],
        session: { ...FROM_ANSWER } } };
    document.body.innerHTML = '';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameId = 5;
    window.gameState = { globalVariables: {} };
    window.gameScenario = { rooms: { jake_office: { objects: [JAKE_PC, OPS_PC] } } };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.ApiClient = {
        loginAccounts: async (pcId) => { calls.push(['loginAccounts', pcId]); return { loginAccounts: [{ username: 'jbrooks', displayName: 'Jake Brooks' }], loginPicker: 'accounts' }; },
        loginWithCredential: async (pcId, id, route) => { calls.push(['loginWithCredential', pcId, id, route]); return { ...FROM_ANSWER }; },
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
    window.openFromDesktop = openFromDesktop;
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

async function fromDesktopOpen() {
    const r = await sessions.signInWithCredential('ops_pc', 'ops_rdp', { from: 'lena_pc' });
    assert.equal(r.ok, true);
    assert.equal(openFromDesktop('ops_pc', 'lena_pc'), true);
    await settle();
}

test('the sign-in posts from, the session names its source, and the desktop fetch says from=', async () => {
    setup();
    await fromDesktopOpen();
    assert.deepEqual(calls.find(c => c[0] === 'loginWithCredential'), ['loginWithCredential', 'ops_pc', 'ops_rdp', { from: 'lena_pc' }]);
    const s = sessions.get('ops_pc');
    assert.equal(s.fromPcId, 'lena_pc');
    assert.equal(s.fromHost, 'LENA-PC');
    assert.match(fetches[0], /\/container\/ops_pc\?from=lena_pc$/);
    assert.ok(current().fromRoute, 'the container knows it is a from desktop');
    assert.ok(!current().relay);
});

test('fromLockable carries the source and openFromDesktop opens nothing without one', () => {
    setup();
    assert.equal(fromLockable('ops_pc', 'lena_pc').scenarioData.remote.fromPcId, 'lena_pc');
    assert.equal(openFromDesktop('ops_pc', null), false);
    assert.equal(openFromDesktop(null, 'lena_pc'), false);
});

for (const [reason, line] of [['unreachable', unreachableMessage('OPS-PC')], ['not_responding', notRespondingMessage('OPS-PC')]]) {
    test(`a ${reason} 403 on a from desktop keeps the session and says the route line, never the keyboard screen`, async () => {
        setup();
        await sessions.signInWithCredential('ops_pc', 'ops_rdp', { from: 'lena_pc' });
        fetchAnswer = { status: 403, body: { error: 'x', reason } };
        openFromDesktop('ops_pc', 'lena_pc');
        await settle(6);
        assert.equal(sessions.has('ops_pc'), true, 'the session is kept');
        assert.equal(current(), null);
        assert.equal(signInScreens.length, 0);
        assert.deepEqual(alerts.map(a => a[0]), [line]);
    });
}

test('any other 403 on a from desktop drops the copy and says the session ended, never the keyboard screen', async () => {
    setup();
    await sessions.signInWithCredential('ops_pc', 'ops_rdp', { from: 'lena_pc' });
    fetchAnswer = { status: 403, body: { error: 'Not signed in: ops_pc', reason: 'no_session' } };
    openFromDesktop('ops_pc', 'lena_pc');
    await settle(6);
    assert.equal(sessions.has('ops_pc'), false);
    assert.equal(current(), null);
    assert.equal(signInScreens.length, 0);
    assert.deepEqual(alerts.map(a => a[0]), ['Your session on OPS-PC has ended.']);
    // a body with no reason takes the same path
    setup();
    await sessions.signInWithCredential('ops_pc', 'ops_rdp', { from: 'lena_pc' });
    fetchAnswer = { status: 403, body: {} };
    openFromDesktop('ops_pc', 'lena_pc');
    await settle(6);
    assert.equal(sessions.has('ops_pc'), false);
    assert.equal(signInScreens.length, 0);
});

test('with a trip running the 403 line is the trip\'s (landed), not said twice', async () => {
    setup();
    const landed = [];
    window.networkLinks = { trip: { start: 'session' }, landed: (...a) => landed.push(a) };
    await sessions.signInWithCredential('ops_pc', 'ops_rdp', { from: 'lena_pc' });
    fetchAnswer = { status: 403, body: { reason: 'unreachable' } };
    openFromDesktop('ops_pc', 'lena_pc');
    await settle(6);
    assert.equal(alerts.length, 0);
    assert.equal(landed.length, 1);
    assert.deepEqual(landed[0].slice(0, 2), ['desktop', 'unreachable']);
});

test('closing a from desktop does not reopen it', async () => {
    setup();
    await fromDesktopOpen();
    fetches.length = 0;
    current().complete(false);
    await settle(8);
    assert.equal(current(), null);
    assert.equal(fetches.length, 0, 'no second fetch');
});

test('a folder under a from desktop names from=, and its Close reopens the from desktop', async () => {
    setup();
    await fromDesktopOpen();
    const folder = { scenarioData: { id: 'ops_docs', type: 'folder', name: 'Documents', locked: false }, sourcePcId: 'ops_pc' };
    fetchAnswer = { status: 200, body: { contents: [] } };
    window.startContainerMinigame(folder, null, false, false, { sourcePcId: 'ops_pc' });
    await settle(6);
    assert.ok(fetches.some(u => /\/container\/ops_docs\?from=lena_pc$/.test(u)), `fetched ${fetches.join(', ')}`);
    fetches.length = 0;
    fetchAnswer = { status: 200, body: { contents: [], session: { ...FROM_ANSWER } } };
    current().complete(false);
    await settle(8);
    assert.ok(current() instanceof ContainerMinigame && current().fromRoute, 'the from desktop again');
    assert.ok(fetches.some(u => /\/container\/ops_pc\?from=lena_pc$/.test(u)));
});

test('transferChoices offers Connect after Open for a saved connection, held or not', () => {
    assert.deepEqual(transferChoices({}, false, { connect: true }), ['open', 'connect', 'copy', 'move', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'move' }, false, { connect: true }), ['open', 'connect', 'move', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'copy' }, false, { connect: true }), ['open', 'connect', 'copy', 'cancel']);
    assert.deepEqual(transferChoices({}, true, { connect: true }), ['open', 'connect', 'cancel']);
    assert.deepEqual(transferChoices({}, true), ['open', 'cancel'], 'no Connect unless offered');
});

test('Connect is offered for a display-marked connection and for any held keyring entry (assist invites too), never on a relay', async () => {
    setup();
    await fromDesktopOpen();
    const d = current();
    window.keyring = { connect: async () => ({}), connectEntryFor: (id) => (id === 'jake_assist' ? { id } : null) };
    assert.equal(d.offersConnect({ id: 'ops_rdp', connect: true }), true);
    assert.equal(d.offersConnect({ id: 'jake_assist' }), true, 'a held assist invite is a Connect entry too');
    assert.equal(d.offersConnect({ id: 'plain_file' }), false);
    d.relay = true;
    assert.equal(d.offersConnect({ id: 'ops_rdp', connect: true }), false, 'never on a relay desktop');
});

async function connectSetup(item, held) {
    setup();
    await fromDesktopOpen();
    const d = current();
    const connects = [];
    const takes = [];
    window.keyring = { connect: async (...a) => { connects.push(a); return { outcome: 'ok' }; }, connectEntryFor: () => null };
    d.isHeld = () => held;
    d.takeItem = async (it, el, how) => { takes.push(how); return true; };
    d.desktopLockable = () => d.containerItem;
    await d.connectFromDesktop(item, null);
    return { d, connects, takes };
}

test('Connect on an untaken file copies it first, then connects from this desktop', async () => {
    const { connects, takes } = await connectSetup({ id: 'ops_rdp', name: 'Ops RDP', connect: true }, false);
    assert.deepEqual(takes, ['copy']);
    assert.equal(connects.length, 1);
    assert.equal(connects[0][1].from, 'ops_pc');
    assert.equal(connects[0][0].scenarioData.id, 'ops_rdp');
});

test('Connect on a move-only file moves it first', async () => {
    const { takes } = await connectSetup({ id: 'ops_rdp', name: 'Ops RDP', connect: true, transfer: 'move' }, false);
    assert.deepEqual(takes, ['move']);
});

test('Connect on a held file takes nothing; returnTo reopens this desktop only when nothing is open', async () => {
    const { connects, takes } = await connectSetup({ id: 'ops_rdp', name: 'Ops RDP', connect: true }, true);
    assert.deepEqual(takes, []);
    const returnTo = connects[0][1].returnTo;
    const before = started.length;
    window.MinigameFramework.currentMinigame = { open: true };
    returnTo();
    assert.equal(started.length, before, 'something is open: nothing reopened');
    window.MinigameFramework.currentMinigame = null;
    returnTo();
    assert.equal(started.length, before + 1, 'this desktop reopens');
});

test('Connect from a foothold desktop on a trip marks the trip to come back here; a toast-only Connect clears it', async () => {
    const { d } = await connectSetup({ id: 'ops_rdp', name: 'Ops RDP', connect: true }, true);
    const marks = [];
    window.networkLinks = { trip: {}, setConnectBack: (id) => { marks.push(id); return true; } };
    d.remote = { footholdId: 'f1' };
    window.MinigameFramework.currentMinigame = d;
    await d.connectFromDesktop({ id: 'ops_rdp', connect: true }, null);
    assert.deepEqual(marks, ['ops_pc', null], 'marked, then cleared because this desktop is still up');
    marks.length = 0;
    window.MinigameFramework.currentMinigame = null;
    await d.connectFromDesktop({ id: 'ops_rdp', connect: true }, null);
    assert.deepEqual(marks, ['ops_pc'], 'closed for the screens Connect opened: the mark stays');
    marks.length = 0;
    d.remote = null;
    await d.connectFromDesktop({ id: 'ops_rdp', connect: true }, null);
    assert.deepEqual(marks, [], 'a from desktop marks nothing');
});

test('a failed take stops Connect', async () => {
    setup();
    await fromDesktopOpen();
    const d = current();
    const connects = [];
    window.keyring = { connect: async (...a) => { connects.push(a); }, connectEntryFor: () => null };
    d.isHeld = () => false;
    d.takeItem = async () => false;
    const r = await d.connectFromDesktop({ id: 'ops_rdp', connect: true }, null);
    assert.equal(r.outcome, 'not_taken');
    assert.equal(connects.length, 0);
});
