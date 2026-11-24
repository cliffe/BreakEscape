// Ops core step 12 (OPS_CORE_PLAN.md 5.4, "At the PC's own keyboard"): a click on a PC the player
// holds a technique session on opens its desktop through the session's foothold, with no sign-in
// screen and no sign-in request. Any other copy, a technique copy whose foothold is gone, and no
// copy take today's path; the in-use and switched-off answers still come first; a guest record
// beside a remote copy is never offered.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'remote-view-click-'));
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
for (const rel of ['utils/locked-hint.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js', 'utils/remote-host-text.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js', 'utils/display-dashes.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { interactLoginPc, openLoginPc, handleUnlock } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');

const PC = { id: 'ops_pc', type: 'pc', name: 'Ops PC', host: 'OPS-PC', lockType: 'login', locked: true };
const lockable = (data = PC) => ({ scenarioData: { ...data } });
const TECH = { npcId: 'ops_admin', username: 'ops', displayName: 'Ops Admin', via: 'technique', remote: true, footholdId: 'jack_a', host: 'OPS-PC', access: 'admin' };

let sessions, trips, signIns, requests, desktops, held;
function setup({ foothold = true } = {}) {
    trips = []; signIns = []; requests = []; desktops = []; held = new Set(foothold ? ['jack_a'] : []);
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = () => {};
    window.ApiClient = new Proxy({}, { get: (_, name) => (...a) => { requests.push([name, ...a]); return Promise.resolve({}); } });
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.networkLinks = {
        get: (id) => (held.has(id) ? { id, name: 'Jack A' } : null),
        openSession: (pcId, opts) => { trips.push([pcId, opts]); return {}; }
    };
    window.openLoginSignIn = (...a) => { signIns.push(a); };
    window.openLoginDesktop = (...a) => { desktops.push(a); };
    window.workstationState = undefined;
    window.stateSync = undefined;
}

test('a click on a PC with a technique copy opens the remote view once: no sign-in screen, no sign-in request', async () => {
    setup();
    sessions._replace('ops_pc', { ...TECH });
    requests.length = 0;
    const r = await interactLoginPc(lockable());
    assert.equal(r, 'remote_view');
    assert.equal(trips.length, 1);
    assert.equal(trips[0][0], 'ops_pc');
    assert.equal(typeof trips[0][1].returnTo, 'function');
    assert.equal(signIns.length, 0);
    assert.deepEqual(requests, []);
});

test('openLoginPc and handleUnlock take the same path for a world PC', () => {
    setup();
    sessions._replace('ops_pc', { ...TECH });
    openLoginPc(lockable());
    handleUnlock(lockable(), 'item');
    assert.equal(trips.length, 2);
    assert.equal(signIns.length, 0);
});

test('a network-view row (scenarioData.remote) keeps today\'s path: no second trip starts', () => {
    setup();
    sessions._replace('ops_pc', { ...TECH });
    openLoginPc(lockable({ ...PC, remote: { footholdId: 'jack_a' } }));
    assert.equal(trips.length, 0);
});

test('no copy, a password copy, a claim and a technique copy whose foothold is gone take today\'s path', async () => {
    setup();
    assert.equal(await interactLoginPc(lockable()), 'signin');
    assert.equal(trips.length, 0);
    for (const via of ['password', 'claim']) {
        setup();
        sessions._replace('ops_pc', { npcId: 'a', username: 'a', displayName: 'A', via, ...(via === 'password' ? { remote: true, footholdId: 'jack_a', host: 'OPS-PC' } : {}) });
        const r = await interactLoginPc(lockable());
        assert.equal(r, 'desktop', via);
        assert.equal(trips.length, 0, via);
    }
    // the foothold is gone: remoteViewFoothold answers null, the keyboard fallback serves the desktop
    setup({ foothold: false });
    sessions._replace('ops_pc', { ...TECH });
    assert.equal(sessions.remoteViewFoothold('ops_pc'), null);
    assert.equal(await interactLoginPc(lockable()), 'desktop');
    assert.equal(trips.length, 0);
});

test('a switched-off PC and a PC an NPC is using keep their answers ahead of the remote view', async () => {
    setup();
    sessions._replace('ops_pc', { ...TECH });
    window.gameState = { globalVariables: { power_cut: true } };
    const toasts = [];
    window.gameAlert = (...a) => toasts.push(a);
    assert.equal(await interactLoginPc(lockable({ ...PC, offWhen: 'power_cut' })), 'off');
    assert.equal(toasts.length, 1);
    assert.equal(trips.length, 0);
    window.gameState = { globalVariables: {} };
    setup();
    sessions._replace('ops_pc', { ...TECH });
    window.workstationState = { presence: () => ({ ownerId: 'sam', present: true }), onInteract: () => null };
    window.npcManager = { getNPC: () => ({ displayName: 'Sam' }) };
    const r = await interactLoginPc(lockable());
    assert.equal(r, 'in_use');
    assert.equal(trips.length, 0);
    delete window.npcManager;
});

test('a guest record beside a remote copy: the click reaches the player\'s copy and offers no guest session', async () => {
    setup();
    let claims = 0;
    window.workstationState = { presence: () => ({ ownerId: null, present: null }), onInteract: () => 'accessed', guestOf: () => 'ian' };
    sessions.claim = async () => { claims++; return { ok: true }; };
    sessions._replace('ops_pc', { ...TECH });
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    assert.equal(claims, 0);
    // a remote password copy: the keyboard desktop, still no guest session
    setup();
    window.workstationState = { presence: () => ({ ownerId: null, present: null }), onInteract: () => 'accessed', guestOf: () => 'ian' };
    sessions.claim = async () => { claims++; return { ok: true }; };
    sessions._replace('ops_pc', { npcId: 'a', username: 'a', displayName: 'A', via: 'password', remote: true, footholdId: 'jack_a', host: 'OPS-PC' });
    assert.equal(await interactLoginPc(lockable()), 'desktop');
    assert.equal(claims, 0);
});

test('a remote password copy is not displaced by npc_sat_at; a keyboard password copy is', async () => {
    setup();
    sessions._replace('ops_pc', { npcId: 'a', username: 'a', displayName: 'A', via: 'password', remote: true, footholdId: 'jack_a', host: 'OPS-PC' });
    assert.equal(await sessions.displaced('ops_pc', 'Ian'), false);
    assert.equal(sessions.has('ops_pc'), true);
    sessions._replace('ops_pc', { npcId: 'a', username: 'a', displayName: 'A', via: 'password' });
    assert.equal(await sessions.displaced('ops_pc', 'Ian'), true);
    assert.equal(sessions.has('ops_pc'), false);
});

// S3 client R1 M2/m6: a click with no view fetched fetches it first; the trip is one the world started
test('a click with no view held fetches the foothold view first, then opens the trip back to the world; a foothold the server dropped takes the keyboard path', async () => {
    setup();
    const order = [];
    let viewHeld = null;
    let viewAnswer = { ok: true };
    window.networkLinks = {
        get: (id) => (held.has(id) ? { id, name: 'Jack A' } : null),
        lastView: () => viewHeld,
        view: async (id) => { order.push(['view', id]); if (viewAnswer.ok) viewHeld = {}; else held.delete(id); return viewAnswer; },
        openSession: (pcId, opts) => { order.push(['open', pcId, opts.toWorld]); return {}; }
    };
    sessions._replace('ops_pc', { ...TECH });
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(order, [['view', 'jack_a'], ['open', 'ops_pc', true]]);
    // a view already held: no fetch
    order.length = 0;
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    assert.deepEqual(order, [['open', 'ops_pc', true]]);
    // the server no longer holds the foothold: the click ends on today's path, no trip
    viewHeld = null; viewAnswer = { ok: false, reason: 'gone' }; order.length = 0;
    const starts = [];
    window.startContainerMinigame = (...a) => starts.push(a);
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(order, [['view', 'jack_a']]);
    assert.equal(starts.length, 1, 'the keyboard desktop');
    delete window.startContainerMinigame;
});

// N-C2: a second click while the first click's view fetch is pending starts no second fetch or trip
test('two clicks before the view fetch resolves send one view request and open one trip; a failed fetch clears the guard', async () => {
    setup();
    const order = [];
    let viewHeld = null;
    let release;
    let fail = false;
    window.networkLinks = {
        get: (id) => (held.has(id) ? { id, name: 'Jack A' } : null),
        lastView: () => viewHeld,
        view: (id) => { order.push(['view', id]); return new Promise((res, rej) => { release = () => { if (fail) rej(new Error('net')); else { viewHeld = {}; res({ ok: true }); } }; }); },
        openSession: (pcId, opts) => { order.push(['open', pcId, opts.toWorld]); return {}; }
    };
    sessions._replace('ops_pc', { ...TECH });
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    await new Promise(r => setTimeout(r, 0));
    release();
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(order, [['view', 'jack_a'], ['open', 'ops_pc', true]]);
    // a fetch that fails still opens once and frees the PC for the next click
    viewHeld = null; fail = true; order.length = 0;
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    await new Promise(r => setTimeout(r, 0));
    release();
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(order, [['view', 'jack_a'], ['open', 'ops_pc', true]]);
    fail = false; order.length = 0;
    assert.equal(await interactLoginPc(lockable()), 'remote_view');
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(order, [['view', 'jack_a']], 'the guard was cleared: a new click fetches again');
});
