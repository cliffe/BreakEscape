// Ops core step 12 (OPS_CORE_PLAN.md 5.4, "The remote-view marker"): a desktop opened for a
// technique session, however it was opened (the network view's foothold route or the keyboard
// fallback), has the red frame class, the "Remote view: <account> through <link>" line with the
// bolt (all set as text), the stepped wipe (skipped under reduced motion), and no Switch user on a
// host whose row says remote sign-in is off. A password foothold desktop keeps today's look.
// Harness as access-from-desktop.test.mjs.
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
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'utils/sync-before-fetch.js', 'systems/keyring.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/text-file/text-file-minigame.js']) copy(rel);


const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { openRemoteDesktop, openLoginDesktop, remoteLockable } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { ContainerMinigame, folderRouteQuery, transferChoices } = await imp('minigames/container/container-minigame.js');
const { remoteViewLine } = await imp('utils/remote-host-text.js');
const { TextFileMinigame } = await imp('minigames/text-file/text-file-minigame.js');

const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

let heldLinks, hostRows;
const links = { get: (id) => heldLinks[id] || null, lastView: () => ({ hosts: hostRows }), landed: () => {} };
let calls, started, alerts, sessions, fetches, fetchAnswer, signInScreens, fetchFor;
globalThis.__fetchAnswer = () => fetchAnswer;

function setup() {
    fetchFor = null;
    calls = []; started = []; alerts = []; fetches = []; signInScreens = [];
    fetchAnswer = { status: 200, body: { contents: [], session: {} } };
    document.body.innerHTML = '';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameId = 5;
    window.gameState = { globalVariables: {} };
    window.gameScenario = { rooms: { jake_office: { objects: [OPS_PC] } } };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.ApiClient = {
        loginAccounts: async (pcId) => { calls.push(['loginAccounts', pcId]); return { loginAccounts: [{ username: 'jbrooks', displayName: 'Jake Brooks' }], loginPicker: 'accounts' }; },
        loginWithCredential: async (pcId, id, route) => { calls.push(['loginWithCredential', pcId, id, route]); return {}; },
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; },
        get: async (path) => { calls.push(['get', path]); return { secrets: {}, accounts: {} }; }
    };
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(url);
        const fetchAnswer = fetchFor ? fetchFor(url) : globalThis.__fetchAnswer();
        return { ok: fetchAnswer.status === 200, status: fetchAnswer.status, statusText: String(fetchAnswer.status), json: async () => fetchAnswer.body };
    };
    heldLinks = { jack_a: { id: 'jack_a', name: 'Jack A' } }; hostRows = [{ id: 'ops_pc', remoteSignIn: true }];
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.networkLinks = links;
    window.openLoginSignIn = (...a) => { signInScreens.push(a); };
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


// jsdom has no canvas: a recording 2d context stands in so the bolt can be drawn
window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, fillStyle: '' });
const current = () => window.MinigameFramework.currentMinigame;

const OPS_PC = { id: 'ops_pc', type: 'pc', name: 'Ops PC', host: 'OPS-PC', lockType: 'login', locked: true, loginPicker: 'accounts' };
const TECH = { npcId: 'ops_admin', username: 'ops', displayName: 'Ops Admin', via: 'technique', remote: true, footholdId: 'jack_a', host: 'OPS-PC', access: 'admin' };
const PW = { npcId: 'ops_admin', username: 'ops', displayName: 'Ops Admin', via: 'password', remote: true, footholdId: 'jack_a', host: 'OPS-PC' };

const answerFor = (session) => ({ status: 200, body: { contents: [], session: { success: true, ...session } } });
const lineOf = () => document.querySelector('.desktop-remote-line');
const screenOf = () => document.querySelector('.pc-monitor-screen');
const switchOffered = () => current().taskbarModel.actions.includes('switch');

async function openThroughFoothold(session) {
    setup();
    sessions._replace('ops_pc', { ...session });
    window.gameScenario = { rooms: { r: { objects: [OPS_PC] } } };
    fetchAnswer = answerFor(session);
    openRemoteDesktop('ops_pc', 'jack_a');
    await settle();
}

test('opened from the network view: red frame, bolt and the Remote view line, the foothold on the fetch', async () => {
    await openThroughFoothold(TECH);
    assert.ok(current(), 'the desktop is open');
    assert.ok(screenOf().classList.contains('desktop-frame--remote-view'));
    assert.equal(lineOf().textContent, remoteViewLine('Ops Admin', 'Jack A'));
    assert.equal(lineOf().textContent, 'Remote view: Ops Admin through Jack A');
    assert.equal(lineOf().querySelectorAll('.desktop-remote-bolt canvas').length, 1, 'the bolt is drawn in code');
    assert.match(fetches[0], /\/container\/ops_pc\?foothold=jack_a$/);
    // a folder opened from this desktop sends its foothold too
    assert.equal(folderRouteQuery('ops_pc'), '?foothold=jack_a');
});

test('hostile account and link names are shown literally, as text', async () => {
    setup();
    heldLinks.jack_a.name = '<img src=x onerror=alert(1)>Link';
    const hostile = { ...TECH, displayName: '<b>Ops</b> & "co"' };
    sessions._replace('ops_pc', hostile);
    window.gameScenario = { rooms: { r: { objects: [OPS_PC] } } };
    fetchAnswer = answerFor(hostile);
    openRemoteDesktop('ops_pc', 'jack_a');
    await settle();
    assert.equal(lineOf().textContent, 'Remote view: <b>Ops</b> & "co" through <img src=x onerror=alert(1)>Link');
    assert.equal(document.querySelectorAll('.pc-desktop-topbar img, .pc-desktop-topbar b').length, 0, 'no element made from the strings');
});

test('the wipe class is set on opening and removed when its animation ends; reduced motion skips it', async () => {
    await openThroughFoothold(TECH);
    const area = document.querySelector('.pc-desktop');
    assert.ok(area.classList.contains('desktop-wipe'));
    area.dispatchEvent(new window.Event('animationend'));
    assert.equal(area.classList.contains('desktop-wipe'), false);
    window.matchMedia = () => ({ matches: true });
    try {
        await openThroughFoothold(TECH);
        assert.equal(document.querySelector('.pc-desktop').classList.contains('desktop-wipe'), false);
        assert.ok(screenOf().classList.contains('desktop-frame--remote-view'), 'the frame stays');
    } finally { delete window.matchMedia; }
    const css = readFileSync(join(js, '../css/ui-themes.css'), 'utf8');
    assert.match(css, /animation: desktop-remote-wipe 0\.3s steps\(4, end\)/);
    assert.match(css, /\.pc-monitor-screen\.desktop-frame--remote-view \{\s*border: 2px solid var\(--ui-remote-view\)/);
});

test('the keyboard fallback (no route) has the same class and line, the link read from the copy; a dropped foothold leaves no link part', async () => {
    setup();
    sessions._replace('ops_pc', { ...TECH });
    fetchAnswer = answerFor(TECH);
    openLoginDesktop({ scenarioData: { ...OPS_PC }, layer: null });
    await settle();
    assert.ok(current().remote === null || !current().remote);
    assert.ok(screenOf().classList.contains('desktop-frame--remote-view'));
    assert.equal(lineOf().textContent, 'Remote view: Ops Admin through Jack A');
    window.MinigameFramework.endMinigame(false);
    heldLinks = {};
    openLoginDesktop({ scenarioData: { ...OPS_PC }, layer: null });
    await settle();
    assert.equal(lineOf().textContent, 'Remote view: Ops Admin');
    assert.equal(remoteViewLine('Ops Admin', null), 'Remote view: Ops Admin');
});

test('a password foothold desktop keeps today\'s line, no class and no wipe', async () => {
    await openThroughFoothold(PW);
    assert.equal(lineOf().textContent, 'Remote session through Jack A');
    assert.equal(screenOf().classList.contains('desktop-frame--remote-view'), false);
    assert.equal(document.querySelector('.pc-desktop').classList.contains('desktop-wipe'), false);
    assert.equal(document.querySelectorAll('.desktop-remote-bolt').length, 0);
});

test('taskbar: Switch user is offered on a technique copy unless the host row says remoteSignIn false; a password copy keeps it', async () => {
    await openThroughFoothold(TECH);
    assert.equal(switchOffered(), true);
    assert.ok(current().taskbarModel.actions.includes('signout'));
    assert.equal(current().taskbarModel.actions.includes('lock'), false, 'Lock is absent for the copy');
    setup();
    hostRows = [{ id: 'ops_pc', remoteSignIn: false }];
    sessions._replace('ops_pc', { ...TECH });
    window.gameScenario = { rooms: { r: { objects: [OPS_PC] } } };
    fetchAnswer = answerFor(TECH);
    openRemoteDesktop('ops_pc', 'jack_a');
    await settle();
    assert.equal(switchOffered(), false);
    assert.ok(current().taskbarModel.actions.includes('signout'));
    // a password copy on the same blocked host keeps Switch user as today
    setup();
    hostRows = [{ id: 'ops_pc', remoteSignIn: false }];
    sessions._replace('ops_pc', { ...PW });
    window.gameScenario = { rooms: { r: { objects: [OPS_PC] } } };
    fetchAnswer = answerFor(PW);
    openRemoteDesktop('ops_pc', 'jack_a');
    await settle();
    assert.equal(switchOffered(), true);
});

test('the text-file reader builds its taskbar with the same canSwitch rule, and a folder under the desktop names the foothold', () => {
    const text = readFileSync(join(js, 'minigames/text-file/text-file-minigame.js'), 'utf8');
    assert.match(text, /canSwitch: !!desktop && window\.pcSessions\?\.canSwitchUser\?\.\(pcId\) !== false/);
    const sessions2 = new PcSessions();
    window.networkLinks = links;
    heldLinks = { jack_a: { id: 'jack_a', name: 'Jack A' } };
    hostRows = [{ id: 'ops_pc', remoteSignIn: false }];
    sessions2._replace('ops_pc', { ...TECH });
    assert.equal(sessions2.canSwitchUser('ops_pc'), false);
    // a folder under the desktop names the technique copy's foothold
    assert.equal(folderRouteQuery('ops_pc', sessions2), '?foothold=jack_a');
    hostRows = [{ id: 'ops_pc', remoteSignIn: true }];
    assert.equal(sessions2.canSwitchUser('ops_pc'), true);
    sessions2._replace('ops_pc', { ...PW });
    hostRows = [{ id: 'ops_pc', remoteSignIn: false }];
    assert.equal(sessions2.canSwitchUser('ops_pc'), true);
    assert.equal(sessions2.canSwitchUser('nobody'), true);
});

// S3 client R1 M2: the host's row is found in a further network's hosts, and before any view is held
test('canSwitchUser finds the host row in networks[].hosts, and a host row blocked there hides Switch user', () => {
    setup();
    const s = new PcSessions();
    s._replace('ops_pc', { ...TECH });
    let view = { hosts: [{ id: 'other', remoteSignIn: true }], networks: [{ id: 'far', hosts: [{ id: 'ops_pc', remoteSignIn: false }] }] };
    window.networkLinks = { get: () => ({ id: 'jack_a' }), lastView: () => view };
    assert.equal(s.canSwitchUser('ops_pc'), false);
    view = { hosts: [], networks: [{ id: 'far', hosts: [{ id: 'ops_pc', remoteSignIn: true }] }] };
    assert.equal(s.canSwitchUser('ops_pc'), true);
});

test('with no view fetched, a click-opened remote view fetches it first, so Switch user is hidden on a blocked host', async () => {
    setup();
    let viewHeld = null;
    const order = [];
    window.networkLinks = {
        get: (id) => heldLinks[id] || null,
        lastView: () => viewHeld,
        view: async (id) => { order.push(['view', id]); viewHeld = { hosts: [], networks: [{ id: 'far', hosts: [{ id: 'ops_pc', remoteSignIn: false }] }] }; return { ok: true, view: viewHeld }; },
        openSession: (pcId) => { order.push(['open', pcId]); return {}; },
        landed: () => {}
    };
    sessions._replace('ops_pc', { ...TECH });
    const { openLoginPc } = await imp('systems/unlock-system.js');
    openLoginPc({ scenarioData: { ...OPS_PC } });
    await settle();
    assert.deepEqual(order, [['view', 'jack_a'], ['open', 'ops_pc']]);
    assert.equal(sessions.canSwitchUser('ops_pc'), false);
});

// S3 client R1 T7: the text-file reader, run over a technique copy, builds its taskbar with the same rule
test('the running text-file reader offers no Switch user over a technique copy on a blocked host, and offers it otherwise', () => {
    setup();
    const reader = (session) => {
        const m = {
            rememberedDesktop: () => ({ containerItem: { scenarioData: { ...OPS_PC } }, places: [] }),
            findPcData: () => OPS_PC, lockSupported: () => false, pcTaskbarModel: (a) => a, mountPcTaskbar: () => ({})
        };
        sessions._replace('ops_pc', { ...session });
        const r = Object.create(TextFileMinigame.prototype);
        r.gameContainer = { querySelector: () => ({ isConnected: true }) };
        r.pcScreen = { pcId: 'ops_pc' };
        r.textFileData = { fileName: 'a.txt' };
        r.mountTaskbar(m);
        return r.taskbarModel;
    };
    hostRows = [{ id: 'ops_pc', remoteSignIn: false }];
    assert.equal(reader(TECH).canSwitch, false);
    assert.equal(reader(PW).canSwitch, true, 'a password copy keeps it');
    hostRows = [{ id: 'ops_pc', remoteSignIn: true }];
    assert.equal(reader(TECH).canSwitch, true);
});

// S3 R2 N-C1: the landings of a share close and a sign-in close, by where the remote view was opened
test('N-C1: a world-opened trip goes back to its desktop on a share close and to the world on a sign-in close; a network-view-opened trip keeps its landings', async () => {
    setup();
    const { NetworkLinks } = await imp('systems/network-links.js');
    const nl = new NetworkLinks();
    const opened = [], views = [];
    window.startNetworkViewMinigame = (...a) => views.push(a);
    window.openRemoteDesktop = (...a) => opened.push(a);
    let held = true;
    window.pcSessions = { has: () => held, get: () => (held ? { footholdId: 'jack_a' } : null) };
    // world-opened: the share closes back to the same PC's desktop through the same foothold
    nl.openSession('ops_pc', { returnTo: () => {}, toWorld: true });
    opened.length = 0;
    assert.equal(nl.landed('share', 'close', {}).landing, 'desktop');
    await settle();
    assert.deepEqual(opened, [['ops_pc', 'jack_a']]);
    assert.deepEqual(views, [], 'the network view was not resumed');
    // world-opened: the sign-in closed with no session leaves to the world
    nl.openSession('ops_pc', { returnTo: () => {}, toWorld: true });
    held = false;
    assert.deepEqual(nl.landed('signin', 'close', { pcId: 'ops_pc' }), { landing: 'world', reason: 'closed' });
    assert.equal(nl.trip, null);
    assert.deepEqual(views, []);
    // opened from the network view's own path (no toWorld): both landings are as before, the view
    for (const screen of ['share', 'signin']) {
        held = true;
        nl.openSession('ops_pc', { returnTo: () => {} });
        held = screen === 'share';
        opened.length = 0;
        assert.equal(nl.landed(screen, 'close', { pcId: 'ops_pc' }).landing, 'view', screen);
        assert.deepEqual(opened, [], screen);
    }
    delete window.startNetworkViewMinigame; delete window.openRemoteDesktop;
});

// Ops core tidy (client), R3-2: three rarer desktop endings, by where the remote view was opened
test('R3-2: displaced, token_expired and expired leave to the world for a world-opened trip and resume the view for a network-view trip', async () => {
    setup();
    const { NetworkLinks } = await imp('systems/network-links.js');
    const nl = new NetworkLinks();
    const views = [];
    window.startNetworkViewMinigame = (...a) => views.push(a);
    window.openRemoteDesktop = () => {};
    window.pcSessions = { has: () => true, get: () => ({ footholdId: 'jack_a' }) };
    for (const reason of ['displaced', 'token_expired', 'expired']) {
        views.length = 0;
        nl.openSession('ops_pc', { returnTo: () => {}, toWorld: true });
        assert.deepEqual(nl.landed('desktop', reason, { pcId: 'ops_pc' }), { landing: 'world', reason: 'closed' }, `${reason} (world)`);
        assert.equal(nl.trip, null, reason);
        assert.deepEqual(views, [], `${reason}: the network view is not opened`);
        nl.openSession('ops_pc', { returnTo: () => {} });
        assert.equal(nl.landed('desktop', reason, { pcId: 'ops_pc' }).landing, 'view', `${reason} (network view)`);
    }
    delete window.startNetworkViewMinigame; delete window.openRemoteDesktop;
});
