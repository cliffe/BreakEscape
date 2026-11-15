// Slice 9.3a step 8 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3 and 4.4): remote
// sign-in and the remote desktop. A remote lockable opens the sign-in screen with no
// /login_accounts request and no tiles, whatever picker the PC has; Switch user on a remote
// desktop opens the remote screen, and a refused switch leaves the first session's desktop; a
// 403 no_session on a remote desktop returns to the view, drops the client's session and never
// opens the physical screen; a 403 unreachable returns to the view with its reason and keeps
// the session; closing the remote sign-in screen with no session returns to the view; a
// headless object's click shows its observations and opens nothing.
// The real unlock-system.js (its browser-only imports stubbed), container-minigame.js,
// pc-sessions.js and network-links.js run against jsdom.
// Run with: node test/js/access-remote-signin.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'remote-signin-'));
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
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { openLoginSignIn, interactLoginPc, openLoginPc, remoteLockable, openRemoteSignIn, openRemoteDesktop, REMOTE_CAPTURES_WAIT_MS } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { NetworkLinks } = await imp('systems/network-links.js');
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');

// UX slice 6: Switch user and Sign out are in the start panel
const startAction = (id) => { document.querySelector('.pc-start-btn').click(); document.getElementById(`pc-start-${id}`).click(); };
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const foothold = { id: 'jack_comms_port', via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port',
    sourceId: 'comms_port', network: { id: 'office_lan', name: 'Harbour office LAN' } };
const LENA_ROW = { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', remoteSignIn: true };

let calls, started, views, alerts, sessions, links, fetches, fetchAnswer;

function setup() {
    calls = []; started = []; views = []; alerts = []; fetches = [];
    fetchAnswer = { status: 200, body: { contents: [], session: { npcId: 'lena', username: 'lfox', via: 'password', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02' } } };
    document.body.innerHTML = '';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.ApiClient = {
        loginAccounts: async (pcId, opts = {}) => { calls.push(['loginAccounts', pcId, opts.foothold ?? null]); return { loginAccounts: [{ username: 'lfox', displayName: 'Lena Fox' }], loginPicker: 'accounts', headless: false, host: 'HB-FIN-02' }; },
        login: async (pcId, fields) => {
            calls.push(['login', pcId, fields]);
            if (fields.password !== 'right') throw Object.assign(new Error('no'), { status: 422, body: { message: "This account can't sign in on this PC", notPermitted: true } });
            return { success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'password', remote: true, footholdId: fields.foothold, host: 'HB-FIN-02' };
        },
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; },
        network: async (id) => { calls.push(['network', id]); return { footholds: [{ ...foothold, hosts: [LENA_ROW] }] }; },
        get: async (path) => { calls.push(['get', path]); return { secrets: {}, accounts: {} }; }
    };
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(url);
        return { ok: fetchAnswer.status === 200, status: fetchAnswer.status, statusText: String(fetchAnswer.status), json: async () => fetchAnswer.body };
    };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    links = new NetworkLinks();
    window.networkLinks = links;
    links.load([foothold], ['comms_port']);
    window.startNetworkViewMinigame = (footholdId, opts) => views.push([footholdId, opts?.message ?? null]);
    window.openLoginSignIn = openLoginSignIn;
    window.openRemoteDesktop = openRemoteDesktop;
    // A framework that ends the running minigame before the next one, as minigame-manager.js does
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
    window.startContainerMinigame = (item, contents, takeable, desktop) =>
        window.MinigameFramework.startMinigame('container', null, { title: item.scenarioData.name, containerItem: item, contents, isTakeable: takeable, desktopMode: desktop, cancelText: 'Close', showCancel: true });
}

const current = () => window.MinigameFramework.currentMinigame;

async function remoteDesktopOpen() {
    links.open('jack_comms_port');
    await sessions.signIn('lena_pc', 'lfox', 'right', { foothold: 'jack_comms_port' });
    await links.view('jack_comms_port');
    openRemoteDesktop('lena_pc', 'jack_comms_port');
    await settle();
}

test('remoteLockable builds the lockable of 4.4 from a host row', () => {
    const l = remoteLockable(LENA_ROW, 'jack_comms_port');
    assert.deepEqual(l.scenarioData, { id: 'lena_pc', name: "Lena's PC", host: 'HB-FIN-02', type: 'pc', sprite: 'pc_desktop',
        lockType: 'login', locked: true, loginPicker: false, remote: { footholdId: 'jack_comms_port' } });
});

test('a remote lockable opens the sign-in screen with one /login_accounts request carrying the foothold, and never a post-it', async () => {
    setup();
    const lockable = remoteLockable(LENA_ROW, 'jack_comms_port');
    // Even a lockable that carries tiles and a picker reads them from the server, not itself
    lockable.scenarioData.loginPicker = 'accounts';
    lockable.scenarioData.loginAccounts = [{ username: 'lfox' }];
    lockable.scenarioData.postitNote = 'lfox / secret';
    await openLoginSignIn(lockable);
    // The remote screen fetches GET /login_accounts with the foothold (credential keyring K0), once
    const la = calls.filter(c => c[0] === 'loginAccounts');
    assert.equal(la.length, 1);
    assert.deepEqual(la[0], ['loginAccounts', 'lena_pc', 'jack_comms_port'], 'the foothold is on the request');
    const [type, params] = started[0];
    assert.equal(type, 'password');
    assert.equal(params.signIn.picker, false, 'the lockable picker stays false; the server answer decides');
    assert.deepEqual(params.signIn.tiles, [], 'no tiles until the server answers');
    assert.deepEqual(params.signIn.remote, { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' });
    assert.equal(params.showPostit, false, 'a sticky note is never shown remotely');
    assert.equal(params.signIn.pcName, "Lena's PC (HB-FIN-02)");
});

test('the remote screen starts before the answers, fetches /login_accounts with the foothold and /capture_secrets, and lays out once', async () => {
    setup();
    window.gameState.globalVariables.se_captures = { lena: { targetId: 'lena', kind: 'password', roleLabel: 'Lena Fox', at: 1 } };
    window.capturedSignIns = (captures, accounts) => Object.values(captures)
        .filter(e => accounts[e.targetId]).map(e => ({ targetId: e.targetId, label: e.roleLabel, username: accounts[e.targetId], password: null }));
    let answerSecrets;
    window.ApiClient.get = (path) => { calls.push(['get', path]); return new Promise(r => { answerSecrets = r; }); };
    const scene = { _sceneType: 'password', cleanup() {}, laidOut: null, setRemoteAccounts(info) { this.laidOut = info; } };
    const start = window.MinigameFramework.startMinigame.bind(window.MinigameFramework);
    window.MinigameFramework.startMinigame = (type, c, params) => {
        const m = start(type, c, params);
        if (type !== 'password') return m;
        Object.assign(scene, { params });
        window.MinigameFramework.currentMinigame = scene;
        return scene;
    };
    const opening = openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    assert.equal(current(), scene, 'the screen is open before any answer');
    assert.deepEqual(scene.params.signIn.captured, []);
    assert.equal(scene.params.signIn.capturedLoading, true);
    await settle();
    assert.equal(scene.laidOut, null, 'nothing laid out before /capture_secrets answers');
    assert.deepEqual(calls.find(c => c[0] === 'loginAccounts'), ['loginAccounts', 'lena_pc', 'jack_comms_port']);
    assert.deepEqual(calls.filter(c => c[0] === 'get'), [['get', '/capture_secrets']]);
    answerSecrets({ accounts: { lena: 'lfox' }, secrets: {} });
    await opening;
    assert.deepEqual(scene.laidOut.tiles, [{ username: 'lfox', displayName: 'Lena Fox' }], 'the server PC tiles');
    assert.deepEqual(scene.laidOut.captured, [{ targetId: 'lena', label: 'Lena Fox', username: 'lfox', password: null }]);
    assert.equal(scene.laidOut.picker, 'accounts');
    assert.equal(scene.laidOut.host, 'HB-FIN-02');
    assert.equal(scene.laidOut.pending, false);
    delete window.capturedSignIns;
});

// The screen's wait for the pair is capped (plan 5.2): the sync retries and a fetch can take 8 s
// or more on a struggling server. Fake timers drive the cap; setImmediate drains.
function slowCapturesScene() {
    window.gameState.globalVariables.se_captures = { lena: { targetId: 'lena', kind: 'password', roleLabel: 'Lena Fox', at: 1 } };
    window.capturedSignIns = (captures, accounts) => Object.values(captures)
        .filter(e => accounts[e.targetId]).map(e => ({ targetId: e.targetId, label: e.roleLabel, username: accounts[e.targetId], password: null }));
    const answer = {};
    window.ApiClient.get = (path) => { calls.push(['get', path]); return new Promise((ok, fail) => { answer.ok = ok; answer.fail = fail; }); };
    const scene = { _sceneType: 'password', cleanup() {}, layouts: [], setRemoteAccounts(info) { this.layouts.push(info); } };
    const start = window.MinigameFramework.startMinigame.bind(window.MinigameFramework);
    window.MinigameFramework.startMinigame = (type, c, params) => {
        const m = start(type, c, params);
        if (type !== 'password') return m;
        Object.assign(scene, { params });
        window.MinigameFramework.currentMinigame = scene;
        return scene;
    };
    return { scene, answer };
}
const drain = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

test('plan 5.2: a slow /capture_secrets shows the Other user form at the cap, and the late answer still lays out', async () => {
    setup();
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const { scene, answer } = slowCapturesScene();
        const opening = openRemoteSignIn(LENA_ROW, 'jack_comms_port');
        await drain();
        assert.equal(REMOTE_CAPTURES_WAIT_MS, 3000);
        mock.timers.tick(REMOTE_CAPTURES_WAIT_MS - 1);
        assert.deepEqual(scene.layouts, [], 'still "Checking..." just before the cap');
        mock.timers.tick(1);
        assert.equal(scene.layouts.length, 1, 'at the cap: one layout, marked still on its way');
        assert.equal(scene.layouts[0].pending, true);
        assert.equal(scene.layouts[0].capturedPending, true);
        answer.ok({ accounts: { lena: 'lfox' }, secrets: {} });
        await opening;
        assert.equal(scene.layouts.length, 2);
        assert.equal(scene.layouts[1].pending, false);
        assert.deepEqual(scene.layouts[1].captured, [{ targetId: 'lena', label: 'Lena Fox', username: 'lfox', password: null }]);
    } finally {
        mock.timers.reset();
        delete window.capturedSignIns;
    }
});

test('plan 5.2: an answer inside the cap lays out once; a failed /capture_secrets is marked', async () => {
    setup();
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        let { scene, answer } = slowCapturesScene();
        let opening = openRemoteSignIn(LENA_ROW, 'jack_comms_port');
        await drain();
        mock.timers.tick(1000);
        answer.ok({ accounts: { lena: 'lfox' }, secrets: {} });
        await opening;
        mock.timers.tick(REMOTE_CAPTURES_WAIT_MS);
        assert.equal(scene.layouts.length, 1, 'the cap is cleared once both are in');
        assert.equal(scene.layouts[0].capturedFailed, false);

        setup();
        ({ scene, answer } = slowCapturesScene());
        opening = openRemoteSignIn(LENA_ROW, 'jack_comms_port');
        await drain();
        answer.fail(new Error('500'));
        await opening;
        mock.timers.tick(REMOTE_CAPTURES_WAIT_MS);
        assert.equal(scene.layouts.length, 1);
        assert.equal(scene.layouts[0].capturedFailed, true);
    } finally {
        mock.timers.reset();
        delete window.capturedSignIns;
    }
});

test('the remote option asks /login_accounts with the foothold and never serves the sticky note (9.1 m5, K0)', async () => {
    setup();
    window.ApiClient.loginAccounts = async (pcId, opts = {}) => { calls.push(['loginAccounts', pcId, opts.foothold ?? null]); return { loginAccounts: [{ username: 'lfox' }], loginPicker: 'accounts', host: 'HB-FIN-02', postitNote: 'lfox / Ledger-Lena-9' }; };
    const sprite = { scenarioData: { id: 'lena_pc', type: 'pc', name: "Lena's PC", lockType: 'login', locked: true, loginPicker: 'accounts', hasPostit: true } };
    await openLoginSignIn(sprite, { switching: true, remote: { footholdId: 'jack_comms_port' } });
    // The foothold request goes through remote_login_accounts, which never serves the post-it
    assert.deepEqual(calls.filter(c => c[0] === 'loginAccounts'), [['loginAccounts', 'lena_pc', 'jack_comms_port']]);
    const [, params] = started[0];
    assert.equal(params.showPostit, false);
    assert.equal(params.postitNote, '');
    assert.deepEqual(params.signIn.tiles, [], 'the start params carry no tiles; the server answer decides');
    assert.equal(params.signIn.remote.footholdId, 'jack_comms_port');
    assert.equal(sprite.scenarioData.remote, undefined, 'the world sprite is not changed');
});

test('signed in remotely, the screen hands over to the remote desktop, whose fetch carries the foothold', async () => {
    setup();
    links.open('jack_comms_port');
    views.length = 0;
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    await sessions.signIn('lena_pc', 'lfox', 'right', { foothold: 'jack_comms_port' });
    assert.deepEqual(calls.find(c => c[0] === 'login'), ['login', 'lena_pc', { username: 'lfox', password: 'right', foothold: 'jack_comms_port' }]);
    window.MinigameFramework.endMinigame(true, null);
    await settle();
    assert.equal(current()?._sceneType, 'container');
    assert.equal(fetches.at(-1), '/break_escape/games/5/container/lena_pc?foothold=jack_comms_port');
    assert.match(document.body.textContent, /Remote session through Drop box: comms room/);
    assert.deepEqual(views, [], 'no view: the desktop took over');
});

test('closing the remote sign-in screen with no session returns to the view', async () => {
    setup();
    links.open('jack_comms_port');
    views.length = 0;
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    assert.deepEqual(views, [['jack_comms_port', null]]);
});

test('Switch user on a remote desktop opens the remote screen; a refused switch returns to the first desktop', async () => {
    setup();
    await remoteDesktopOpen();
    views.length = 0;
    calls.length = 0;
    startAction('switch');
    await settle();
    const [type, params] = started.at(-1);
    assert.equal(type, 'password');
    assert.equal(params.signIn.picker, false);
    assert.equal(params.signIn.current.username, 'lfox');
    // Switch user on a remote desktop takes the same dual fetch: /login_accounts with the foothold
    assert.deepEqual(calls.filter(c => c[0] === 'loginAccounts'), [['loginAccounts', 'lena_pc', 'jack_comms_port']]);
    // Sam's details are refused; the screen is left with no new sign-in
    const refused = await sessions.signIn('lena_pc', 'sokafor', 'wrong', { foothold: 'jack_comms_port' });
    assert.equal(refused.reason, 'not_permitted');
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    assert.equal(current()?._sceneType, 'container', "Lena's desktop is back");
    assert.equal(current().loginPcId, 'lena_pc');
    assert.deepEqual(views, []);
    assert.equal(sessions.get('lena_pc').username, 'lfox');
});

test('a 403 no_session on a remote desktop returns to the view, drops the session, never opens the physical screen', async () => {
    setup();
    await remoteDesktopOpen();
    views.length = 0;
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    views.length = 0;
    let physical = 0;
    window.openLoginSignIn = (...a) => { physical++; return openLoginSignIn(...a); };
    fetchAnswer = { status: 403, body: { error: 'Not signed in', reason: 'no_session' } };
    openRemoteDesktop('lena_pc', 'jack_comms_port');
    await settle(6);
    assert.equal(sessions.has('lena_pc'), false, 'the client drops its copy');
    assert.equal(physical, 0);
    assert.equal(started.filter(([t]) => t === 'password').length, 0);
    assert.deepEqual(views, [['jack_comms_port', 'Your session on HB-FIN-02 has ended.']]);
});

test('a 403 unreachable on a remote desktop returns to the view with its reason and keeps the session', async () => {
    setup();
    await remoteDesktopOpen();
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    views.length = 0;
    fetchAnswer = { status: 403, body: { error: 'PC not reachable', reason: 'unreachable' } };
    openRemoteDesktop('lena_pc', 'jack_comms_port');
    await settle(6);
    assert.equal(sessions.has('lena_pc'), true, 'the server still holds it');
    assert.deepEqual(views, [['jack_comms_port', "HB-FIN-02 can't be reached over this link."]]);
});

// 9.3b plan 5.2, review R2 nit 1: a host whose own service is off says "not responding", as its row
test('a 403 not_responding on a remote desktop returns to the view saying so and keeps the session', async () => {
    setup();
    await remoteDesktopOpen();
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    views.length = 0;
    fetchAnswer = { status: 403, body: { error: 'PC not responding', reason: 'not_responding' } };
    openRemoteDesktop('lena_pc', 'jack_comms_port');
    await settle(6);
    assert.equal(sessions.has('lena_pc'), true, 'the session is kept for when it comes back on');
    assert.deepEqual(views, [['jack_comms_port', 'HB-FIN-02 is not responding.']]);
});

// q72: the desktop at the keyboard of a switched-off PC is refused and the session is kept
test('a 403 off at the keyboard says "This PC is off.", keeps the session and opens no sign-in screen', async () => {
    setup();
    await sessions.signIn('lena_pc', 'lfox', 'right');
    let physical = 0;
    window.openLoginSignIn = () => { physical++; };
    fetchAnswer = { status: 403, body: { error: 'This PC is off.', reason: 'off' } };
    const sprite = { scenarioData: { id: 'lena_pc', type: 'pc', name: "Lena's PC", lockType: 'login', locked: true } };
    window.startContainerMinigame(sprite, null, false, true);
    await settle(6);
    assert.equal(sessions.has('lena_pc'), true, 'the client keeps its copy');
    assert.equal(physical, 0, 'no sign-in screen');
    assert.ok(alerts.some(a => a[0] === 'This PC is off.'));
    assert.equal(current(), null, 'the desktop closed');
});

test('the remote desktop closed by its Close returns to the view; Sign out too', async () => {
    setup();
    await remoteDesktopOpen();
    views.length = 0;
    document.querySelector('#minigame-close').click();   // the X: no Cancel beside it (slice 7 R1)
    await settle();
    assert.deepEqual(views, [['jack_comms_port', null]]);
    openRemoteDesktop('lena_pc', 'jack_comms_port');
    await settle();
    views.length = 0;
    startAction('signout');
    await settle(6);
    assert.equal(sessions.has('lena_pc'), false);
    assert.deepEqual(views, [['jack_comms_port', null]]);
});

test('an unplug that ends the session closes the open desktop with "The link dropped" and leaves to the world', async () => {
    setup();
    let closed = null;
    window.eventDispatcher = { emit: (n, d) => { if (n === 'network_view_closed') closed = d; }, on: () => {} };
    await remoteDesktopOpen();
    sessions.linkDropped(['lena_pc']);
    await settle();
    assert.equal(current(), null);
    assert.ok(alerts.some(a => a[0] === 'The link dropped'));
    assert.deepEqual(closed, { footholdId: 'jack_comms_port', reason: 'link_dropped' });
});

test('a keyboard fetch settles a remote session (the answer has no remote)', async () => {
    setup();
    await sessions.signIn('lena_pc', 'lfox', 'right', { foothold: 'jack_comms_port' });
    fetchAnswer = { status: 200, body: { contents: [], session: { npcId: 'lena', username: 'lfox', via: 'password' } } };
    const sprite = { scenarioData: { id: 'lena_pc', type: 'pc', name: "Lena's PC", lockType: 'login', locked: true } };
    window.startContainerMinigame(sprite, null, false, true);
    await settle();
    assert.equal(fetches.at(-1), '/break_escape/games/5/container/lena_pc', 'no foothold at the keyboard');
    assert.equal(sessions.get('lena_pc').remote, undefined);
});

test('a headless object\'s click shows its observations and opens nothing', async () => {
    setup();
    const box = { scenarioData: { id: 'door_box', type: 'pc', name: 'Door controller', lockType: 'login', locked: true, headless: true,
        observations: 'A door controller with no screen or keyboard.' } };
    window.workstationState = { presence: () => ({ ownerId: null, present: null }), onInteract: () => 'signin' };
    assert.equal(await interactLoginPc(box), 'headless');
    openLoginPc(box);
    await settle();
    assert.equal(started.length, 0);
    assert.equal(calls.length, 0);
    assert.equal(alerts.length, 2);
    assert.equal(alerts[0][0], 'A door controller with no screen or keyboard.');
    delete window.workstationState;
});
