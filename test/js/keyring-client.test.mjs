// Credential keyring slice K3b part A (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 8.2, the Connect
// half): Connect from the inventory tray. Keyring.connect flushes the pending sync, asks GET
// /keyring, and reads the item's entry in order: GET fails, entry missing (named from the tray
// item), ended, target off, session held, remote blocked, no route, then POST /login by the
// route. The 403 and 422 race answers, the refusal-to-screen mapping, the in-flight guard,
// endedPcIds reaching linkDropped, the teaching toast once per kind and returnTo are covered;
// every toast is checked against section 8.5 word for word.
// The real keyring.js, pc-sessions.js, unlock-system.js, password-minigame.js and
// remote-host-text.js run against jsdom.
// Run with: node test/js/keyring-client.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'keyring-client-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\nexport const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
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
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/more-below.js', 'utils/computer-keywords.js',
    'utils/pc-monitor.js', 'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js',
    'utils/locked-hint.js', 'utils/conditional-text.js', 'systems/global-writer.js', 'systems/captures.js',
    'utils/remote-host-text.js', 'systems/keyring.js', 'systems/notifications.js', 'ui/modal-stack.js', 'utils/overlay-open.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/network-links.js', 'api-client.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/password/password-minigame.js']) copy(rel);


const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { PasswordMinigame } = await imp('minigames/password/password-minigame.js');
const { Keyring, CONNECT_KINDS, connectRoute } = await imp('systems/keyring.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { openCredentialSignIn } = await imp('systems/unlock-system.js');
const { NetworkLinks } = await imp('systems/network-links.js');
const text = await imp('utils/remote-host-text.js');

const refusal = (status, body) => Object.assign(new Error('refused'), { status, body });
const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────
const LENA = { username: 'lfox', displayName: 'Lena Fox', npcId: 'lena' };
const ITEM = { scenarioData: { id: 'lena_rdp_file', name: 'HB-FIN-02.rdp', type: 'text_file', credential: 'x' } };
const RDP = {
    id: 'k_rdp', kind: 'saved_connection', source: 'registry', label: 'HB-FIN-02.rdp', account: LENA, host: 'HB-FIN-02',
    connectsTo: 'lena_pc', heldItem: 'lena_rdp_file', routes: [{ foothold: 'jack_comms_port' }],
    sessionHeld: false, targetOff: false, remoteBlocked: false
};
const OTHER_RDP = { ...RDP, id: 'k_rdp2', label: 'HB-FIN-03.rdp', host: 'HB-FIN-03', connectsTo: 'other_pc', heldItem: 'other_rdp_file' };
const INVITE = { id: 'k_inv', kind: 'assist_invite', label: 'Assist code', account: LENA, host: 'HB-FIN-02', connectsTo: 'lena_pc', heldItem: 'lena_rdp_file', routes: [{ relay: true }] };

let calls, alerts, keyringAnswer, loginAnswer, opened, signIns, dropped, pcSessions, syncGate;

function setup() {
    calls = []; alerts = []; opened = []; signIns = []; dropped = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameScenario = { credentialsDeclared: true };
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.stateSync = { syncConfirmed: async () => { calls.push(['sync']); if (syncGate) await syncGate; } };
    syncGate = null;
    window.keyring = new Keyring();
    keyringAnswer = () => ({ entries: [RDP], rev: 'r1' });
    loginAnswer = () => ({
        success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection',
        label: 'HB-FIN-02.rdp', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02', endedPcIds: []
    });
    window.ApiClient = {
        keyring: async (pcId, opts = {}) => {
            calls.push(['keyring', pcId, opts.rev ?? null]);
            return typeof keyringAnswer === 'function' ? keyringAnswer() : keyringAnswer;
        },
        loginWithCredential: async (pcId, id, opts = {}) => {
            calls.push(['post', pcId, id, opts]);
            return loginAnswer();
        },
        login: async () => ({ success: true }),
        loginAccounts: async () => ({ loginAccounts: [], loginPicker: 'accounts', headless: false, host: 'HB-FIN-02' }),
        get: async () => ({ secrets: {}, accounts: {} }),
        network: async () => ({ footholds: [] })
    };
    pcSessions = new PcSessions();
    pcSessions.linkDropped = (ids, reason) => dropped.push([ids, reason]);
    window.pcSessions = pcSessions;
    window.networkLinks = new NetworkLinks();
    window.networkLinks.load([], []);
    window.openRemoteDesktop = (pcId, foothold) => { calls.push(['desktop', pcId, foothold]); opened.push([pcId, foothold]); };
    window.openCredentialSignIn = (args) => { calls.push(['screen']); signIns.push(args); };
    window.MinigameFramework = { currentMinigame: null };
}

const posts = () => calls.filter(c => c[0] === 'post');
const toasts = () => alerts.map(a => a[0]);
// Every outcome of a refused path: exactly one toast, no POST, no desktop, no screen
function assertOnlyToast(r, outcome, message, { posted = 0 } = {}) {
    assert.equal(r.outcome, outcome);
    assert.deepEqual(toasts(), [message]);
    assert.equal(alerts[0][1], 'error');
    assert.equal(alerts[0][2], 'HB-FIN-02.rdp', 'the toast is titled by the tray item');
    assert.equal(posts().length, posted, posted ? 'one POST' : 'no POST');
    assert.equal(opened.length, 0, 'no desktop');
    assert.equal(signIns.length, 0, 'no sign-in screen');
}

// ── 8.5 text, word for word ─────────────────────────────────────────────────────────────────

test('8.5 Connect strings are exactly the plan text', () => {
    assert.equal(text.CONNECT_FAILED_TEXT, 'Connect could not reach the game server. Try again.');
    assert.equal(text.noLongerWorksMessage('HB-FIN-02.rdp'), 'HB-FIN-02.rdp no longer works.');
    assert.equal(text.endedAssistMessage('Lena Fox'), 'Lena Fox ended the remote assist.');
    assert.equal(text.notRespondingMessage('HB-FIN-02'), 'HB-FIN-02 is not responding.');
    assert.equal(text.remoteOffMessage('HB-FIN-02'), 'Remote sign-in is off on HB-FIN-02.');
    assert.equal(text.trayUnreachableMessage('HB-FIN-02'), "HB-FIN-02 can't be reached from here. You need a way onto its network.");
    assert.equal(text.remoteNotPermittedMessage('HB-FIN-02'), "That account can't sign in on HB-FIN-02.");
    assert.equal(text.remoteLockedOutMessage('HB-FIN-02'), 'HB-FIN-02 has locked this account.');
    assert.equal(text.teachLine('saved_connection', { displayName: 'Lena Fox' }),
        'The password is saved inside this file, so opening it signs you in as Lena Fox. A policy that always asks for the password stops it.');
});

// ── Steps 1 to 7: a toast each, no POST ─────────────────────────────────────────────────────

test('step 1: GET /keyring fails, so the toast is the Connect failure line and nothing else happens', async () => {
    setup();
    keyringAnswer = () => { throw new Error('offline'); };
    const r = await window.keyring.connect(ITEM);
    assertOnlyToast(r, 'fetch_failed', 'Connect could not reach the game server. Try again.');
});

test('step 1: an unusable answer counts as a failed GET', async () => {
    setup();
    keyringAnswer = () => ({ nothing: true });
    const r = await window.keyring.connect(ITEM);
    assertOnlyToast(r, 'fetch_failed', 'Connect could not reach the game server. Try again.');
});

test('step 2: no entry for the tray item gives "{label} no longer works." named from the item', async () => {
    setup();
    keyringAnswer = () => ({ entries: [], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'missing', 'HB-FIN-02.rdp no longer works.');
});

test('step 2: another item\'s entry does not stand in, and the label is the tray item\'s name, not the entry\'s', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...OTHER_RDP, label: 'Wrong label' }], rev: 'r1' });
    const r = await window.keyring.connect(ITEM);
    assertOnlyToast(r, 'missing', 'HB-FIN-02.rdp no longer works.');
});

test('step 2: an item with no name falls back to "That sign-in"', async () => {
    setup();
    keyringAnswer = () => ({ entries: [], rev: 'r1' });
    await window.keyring.connect({ scenarioData: { id: 'lena_rdp_file' } });
    assert.deepEqual(toasts(), ['That sign-in no longer works.']);
});

test('step 2: an assist invite never answers Connect before K3c (CONNECT_KINDS is saved_connection only)', async () => {
    setup();
    assert.deepEqual(CONNECT_KINDS, ['saved_connection']);
    keyringAnswer = () => ({ entries: [INVITE], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'missing', 'HB-FIN-02.rdp no longer works.');
});

test('step 3: ended gives "{displayName} ended the remote assist."', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...RDP, ended: true, routes: [] }], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'ended', 'Lena Fox ended the remote assist.');
});

test('step 4: targetOff gives "{host} is not responding."', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...RDP, targetOff: true }], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'target_off', 'HB-FIN-02 is not responding.');
});

test('step 5: sessionHeld opens the desktop by the held session\'s foothold, with no POST and no toast', async () => {
    setup();
    pcSessions._replace('lena_pc', { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', remote: true, footholdId: 'held_fh', host: 'HB-FIN-02' });
    keyringAnswer = () => ({ entries: [{ ...RDP, sessionHeld: true }], rev: 'r1' });
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'session_held');
    assert.deepEqual(opened, [['lena_pc', 'held_fh']]);
    assert.equal(posts().length, 0);
    assert.deepEqual(toasts(), []);
});

test('step 5: with no mirrored session the entry\'s own foothold route is used', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...RDP, sessionHeld: true }], rev: 'r1' });
    await window.keyring.connect(ITEM);
    assert.deepEqual(opened, [['lena_pc', 'jack_comms_port']]);
});

test('step 6: remoteBlocked gives "Remote sign-in is off on {host}."', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...RDP, remoteBlocked: true }], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'remote_blocked', 'Remote sign-in is off on HB-FIN-02.');
});

test('step 7: no route gives the tray no-route text', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...RDP, routes: [] }], rev: 'r1' });
    assertOnlyToast(await window.keyring.connect(ITEM), 'no_route', "HB-FIN-02 can't be reached from here. You need a way onto its network.");
    assert.equal(connectRoute({ routes: [{ relay: true }] }), null, 'a relay route is K3c: no route today');
    assert.deepEqual(connectRoute(RDP), { foothold: 'jack_comms_port' });
});

test('steps 1 to 8 are tried in the plan\'s order: each earlier state beats every later one', async () => {
    const all = { ...RDP, ended: true, targetOff: true, sessionHeld: true, remoteBlocked: true, routes: [] };
    const order = [
        ['ended', 'Lena Fox ended the remote assist.', { ended: false }],
        ['target_off', 'HB-FIN-02 is not responding.', { targetOff: false }],
        ['session_held', null, { sessionHeld: false }],
        ['remote_blocked', 'Remote sign-in is off on HB-FIN-02.', { remoteBlocked: false }],
        ['no_route', "HB-FIN-02 can't be reached from here. You need a way onto its network.", { routes: [{ foothold: 'jack_comms_port' }] }]
    ];
    let entry = all;
    for (const [outcome, message, fix] of order) {
        setup();
        keyringAnswer = () => ({ entries: [entry], rev: 'r1' });
        const r = await window.keyring.connect(ITEM);
        assert.equal(r.outcome, outcome);
        if (message) assert.deepEqual(toasts(), [message]);
        assert.equal(posts().length, 0, `${outcome}: no POST`);
        entry = { ...entry, ...fix };
    }
    setup();
    keyringAnswer = () => ({ entries: [entry], rev: 'r1' });
    assert.equal((await window.keyring.connect(ITEM)).outcome, 'signed_in', 'with every earlier state clear, step 8 signs in');
});

// ── Step 8: sign in ─────────────────────────────────────────────────────────────────────────

test('step 8: success posts the credential with the foothold, opens the desktop, and shows no sign-in screen', async () => {
    setup();
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'signed_in');
    assert.deepEqual(posts(), [['post', 'lena_pc', 'k_rdp', { foothold: 'jack_comms_port' }]]);
    assert.deepEqual(opened, [['lena_pc', 'jack_comms_port']]);
    assert.equal(signIns.length, 0, 'direct sign-in: the screen is not opened on success');
    assert.equal(pcSessions.get('lena_pc').via, 'credential');
});

test('step 8: the teaching toast shows once per kind in this page, word for word, after the desktop opens', async () => {
    setup();
    await window.keyring.connect(ITEM);
    assert.deepEqual(toasts(), ['The password is saved inside this file, so opening it signs you in as Lena Fox. A policy that always asks for the password stops it.']);
    assert.equal(alerts[0][1], 'info');
    assert.ok(calls.findIndex(c => c[0] === 'desktop') >= 0);
    await window.keyring.connect(ITEM);
    assert.equal(alerts.length, 1, 'a second Connect of the same kind does not teach again');
    assert.equal(posts().length, 2, 'but it still signs in');
    window.keyring = new Keyring();
    await window.keyring.connect(ITEM);
    assert.equal(alerts.length, 2, 'a reload (new page) may show it once more');
});

test('step 8: endedPcIds in the answer reach linkDropped as route_ended', async () => {
    setup();
    loginAnswer = () => ({ success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', remote: true,
        footholdId: 'jack_comms_port', host: 'HB-FIN-02', endedPcIds: ['old_pc', 'lena_pc'] });
    await window.keyring.connect(ITEM);
    assert.deepEqual(dropped, [[['old_pc'], 'route_ended']], 'the new session itself is never dropped');
});

test('step 8: a network failure on the POST gives step 1\'s toast', async () => {
    setup();
    loginAnswer = () => { throw new Error('offline'); };
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'login_failed');
    assert.deepEqual(toasts(), ['Connect could not reach the game server. Try again.']);
    assert.equal(posts().length, 1);
    assert.equal(opened.length, 0);
    assert.equal(signIns.length, 0);
});

test('step 8 races: 403 not_responding, 403 unreachable and 422 remoteBlocked answer as steps 4, 7 and 6', async () => {
    const cases = [
        [refusal(403, { reason: 'not_responding' }), 'target_off', 'HB-FIN-02 is not responding.'],
        [refusal(403, { reason: 'unreachable' }), 'no_route', "HB-FIN-02 can't be reached from here. You need a way onto its network."],
        [refusal(403, {}), 'no_route', "HB-FIN-02 can't be reached from here. You need a way onto its network."],
        [refusal(422, { remoteBlocked: true }), 'remote_blocked', 'Remote sign-in is off on HB-FIN-02.']
    ];
    for (const [err, outcome, message] of cases) {
        setup();
        loginAnswer = () => { throw err; };
        const r = await window.keyring.connect(ITEM);
        assert.equal(r.outcome, outcome);
        assert.deepEqual(toasts(), [message]);
        assert.equal(opened.length, 0);
        assert.equal(signIns.length, 0);
    }
});

test('step 8 refusals: LOGIN_NOT_PERMITTED is a toast, no screen', async () => {
    setup();
    loginAnswer = () => { throw refusal(422, { notPermitted: true, message: 'x' }); };
    const r = await window.keyring.connect(ITEM);
    assertOnlyToast(r, 'not_permitted', "That account can't sign in on HB-FIN-02.", { posted: 1 });
});

test('step 8 refusals: a saved connection\'s policy refusal opens the sign-in screen with the account and refusal, and no toast', async () => {
    setup();
    loginAnswer = () => { throw refusal(422, { kindRefused: 'saved_connection', message: 'policy' }); };
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'signin_screen');
    assert.deepEqual(toasts(), []);
    assert.equal(opened.length, 0);
    assert.deepEqual(signIns, [{
        pcId: 'lena_pc', host: 'HB-FIN-02', footholdId: 'jack_comms_port', username: 'lfox',
        refusal: { credentialId: 'k_rdp', reason: 'kind_refused', kind: 'saved_connection', attemptsLeft: null, message: 'policy' }
    }]);
});

test('step 8 refusals: a lockout opens the screen too, with the attempts and message', async () => {
    setup();
    loginAnswer = () => { throw refusal(422, { lockedOut: true, attemptsLeft: 0, message: 'Locked' }); };
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'signin_screen');
    assert.deepEqual(toasts(), []);
    assert.equal(signIns[0].refusal.reason, 'locked_out');
    assert.equal(signIns[0].refusal.attemptsLeft, 0);
    assert.equal(signIns[0].refusal.message, 'Locked');
    assert.equal(signIns[0].username, 'lfox');
});

test('step 8 refusals: any other refusal is a toast, never the screen', async () => {
    setup();
    loginAnswer = () => { throw refusal(422, {}); };
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'no_longer_works');
    assert.equal(signIns.length, 0);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][1], 'error');
    assert.equal(opened.length, 0);
});

// The refusal reaches the real screen: Lena's tile chosen, the button greyed, the line shown
test('a policy refusal through the real screen chooses Lena\'s tile, greys the saved connection and shows 8.5\'s line', async () => {
    setup();
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: "Lena's PC", type: 'item',
        signIn: {
            pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current: null,
            remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' },
            host: 'HB-FIN-02', captured: [], capturedLoading: true,
            preselect: 'lfox',
            connectRefusal: { credentialId: 'k_rdp', reason: 'kind_refused', kind: 'saved_connection', attemptsLeft: null, message: 'policy' }
        },
        postitNote: '', showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    mg.setRemoteAccounts({
        picker: 'accounts', host: 'HB-FIN-02', captured: [],
        tiles: [{ username: 'lfox', displayName: 'Lena Fox' }, { username: 'jjones', displayName: 'Jake Jones' }],
        keyring: [{ ...RDP, accepted: true, forThisPc: true }]
    });
    const tile = document.querySelector('.signin-tile[data-username="lfox"]');
    assert.ok(tile, 'Lena\'s tile is drawn');
    assert.ok(tile.className.includes('selected') || tile.getAttribute('aria-pressed') === 'true' || tile.getAttribute('aria-selected') === 'true',
        'Lena\'s tile is chosen');
    assert.equal(document.querySelector('#signin-message').textContent, "HB-FIN-02 always asks for the password, so a saved one is ignored.");
});

// ── The guards ──────────────────────────────────────────────────────────────────────────────

test('in-flight guard: a second click while one runs does nothing (one GET, one POST), and the next works after', async () => {
    setup();
    let release;
    syncGate = new Promise(r => { release = r; });
    const first = window.keyring.connect(ITEM);
    await settle();
    assert.equal(window.keyring.connecting, 'lena_rdp_file');
    const second = await window.keyring.connect(ITEM);
    assert.equal(second.outcome, 'busy');
    const other = await window.keyring.connect({ scenarioData: { id: 'other_rdp_file', name: 'x' } });
    assert.equal(other.outcome, 'busy', 'a different item waits too: one Connect at a time');
    release();
    const r = await first;
    assert.equal(r.outcome, 'signed_in');
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 1);
    assert.equal(posts().length, 1);
    assert.equal(window.keyring.connecting, null, 'the guard clears');
    assert.equal((await window.keyring.connect(ITEM)).outcome, 'signed_in');
});

test('in-flight guard: it clears after a failure too', async () => {
    setup();
    keyringAnswer = () => { throw new Error('offline'); };
    await window.keyring.connect(ITEM);
    assert.equal(window.keyring.connecting, null);
    keyringAnswer = () => ({ entries: [RDP], rev: 'r2' });
    assert.equal((await window.keyring.connect(ITEM)).outcome, 'signed_in');
});

test('the pending sync is flushed before the GET, and the POST comes last', async () => {
    setup();
    await window.keyring.connect(ITEM);
    assert.deepEqual(calls.map(c => c[0]).slice(0, 4), ['sync', 'keyring', 'post', 'desktop']);
});

test('a flush that throws still lets Connect ask', async () => {
    setup();
    window.stateSync = { syncConfirmed: async () => { throw new Error('x'); } };
    assert.equal((await window.keyring.connect(ITEM)).outcome, 'signed_in');
});

test('an item with no id does nothing', async () => {
    setup();
    assert.equal((await window.keyring.connect({ scenarioData: {} })).outcome, 'none');
    assert.deepEqual(calls, []);
});

// ── returnTo ────────────────────────────────────────────────────────────────────────────────

test('returnTo runs once after the screens Connect opened have closed, never before', async () => {
    setup();
    mock.timers.enable({ apis: ['setInterval', 'Date'] });
    try {
        const seen = [];
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        window.MinigameFramework.currentMinigame = { open: true };
        mock.timers.tick(1000);
        assert.deepEqual(seen, [], 'a screen is open');
        window.MinigameFramework.currentMinigame = null;
        mock.timers.tick(250);
        assert.deepEqual(seen, [{ reason: 'closed' }]);
        mock.timers.tick(2000);
        assert.equal(seen.length, 1, 'once');
    } finally { mock.timers.reset(); }
});

test('returnTo: when no screen ever opens it still runs, after the open wait', async () => {
    setup();
    mock.timers.enable({ apis: ['setInterval', 'Date'] });
    try {
        const seen = [];
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        mock.timers.tick(2500);
        assert.deepEqual(seen, []);
        mock.timers.tick(1000);
        assert.deepEqual(seen, [{ reason: 'closed' }]);
    } finally { mock.timers.reset(); }
});

test('returnTo is not watched when Connect only toasted, and a sign-in screen counts as opened', async () => {
    setup();
    mock.timers.enable({ apis: ['setInterval', 'Date'] });
    try {
        const seen = [];
        keyringAnswer = () => ({ entries: [], rev: 'r1' });
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        mock.timers.tick(10000);
        assert.deepEqual(seen, [], 'a toast opens no screen to wait for');
        keyringAnswer = () => ({ entries: [RDP], rev: 'r2' });
        loginAnswer = () => { throw refusal(422, { kindRefused: 'saved_connection' }); };
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        window.MinigameFramework.currentMinigame = { open: true };
        mock.timers.tick(500);
        window.MinigameFramework.currentMinigame = null;
        mock.timers.tick(250);
        assert.equal(seen.length, 1);
    } finally { mock.timers.reset(); }
});

// ── The entry lookup and the tray refresh ───────────────────────────────────────────────────

test('connectEntryFor reads the latest answer by heldItem, saved connections only', () => {
    setup();
    const kr = new Keyring();
    kr.remember('|keyboard', { entries: [OTHER_RDP, RDP, INVITE, { ...RDP, id: 'k_x', heldItem: undefined }], rev: 'a' });
    assert.equal(kr.connectEntryFor('lena_rdp_file').id, 'k_rdp', 'the invite sharing the item id is skipped');
    assert.equal(kr.connectEntryFor('other_rdp_file').id, 'k_rdp2');
    assert.equal(kr.connectEntryFor('nothing'), null);
    assert.equal(kr.connectEntryFor(''), null);
    assert.equal(kr.connectEntryFor(undefined), null);
});

test('connect picks the entry for its own item when several saved connections are listed', async () => {
    setup();
    keyringAnswer = () => ({ entries: [OTHER_RDP, RDP], rev: 'r1' });
    await window.keyring.connect(ITEM);
    assert.deepEqual(posts().map(p => p[1]), ['lena_pc']);
    assert.equal(posts()[0][2], 'k_rdp');
});

test('trayChanged asks once per changed set of tray ids, and a screen-free refresh flushes first', async () => {
    setup();
    const kr = window.keyring;
    const items = (...ids) => ids.map(id => ({ scenarioData: { id } }));
    await kr.trayChanged(items('a', 'b'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 1);
    assert.deepEqual(calls.map(c => c[0]), ['sync', 'keyring']);
    assert.equal(kr.trayChanged(items('b', 'a')), null, 'the same set in another order: no ask');
    assert.equal(kr.trayChanged(items('a', 'b')), null);
    await kr.trayChanged(items('a', 'b', 'c'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 2);
    await kr.trayChanged(items('a'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 3);
    window.gameScenario = {};
    assert.equal(kr.trayChanged(items('z')), null, 'a scenario without credentials never asks');
});

test('listen hooks inventory_changed once per dispatcher and asks through trayChanged', async () => {
    setup();
    const handlers = [];
    window.eventDispatcher = { emit: () => {}, on: (n, f) => handlers.push([n, f]) };
    const kr = window.keyring;
    assert.equal(kr.listen(), true);
    assert.equal(kr.listen(), false);
    assert.deepEqual(handlers.map(h => h[0]), ['inventory_changed']);
    handlers[0][1]({ items: [{ scenarioData: { id: 'lena_rdp_file' } }] });
    await settle();
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 1);
    assert.equal(kr.connectEntryFor('lena_rdp_file').id, 'k_rdp', 'the menu can find it after the ask');
});

test('a failed refresh never throws', async () => {
    setup();
    keyringAnswer = () => { throw new Error('offline'); };
    assert.equal(await window.keyring.refresh(), null);
});

test('openCredentialSignIn ignores a call with no pc or foothold', () => {
    setup();
    assert.equal(openCredentialSignIn({ pcId: 'lena_pc' }), undefined);
});
