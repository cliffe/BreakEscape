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
put('systems/lockpick-catch.js', 'export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js', 'minigames/container/container-item-image.js', 'utils/more-below.js', 'utils/computer-keywords.js',
    'utils/pc-monitor.js', 'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js',
    'utils/locked-hint.js', 'utils/conditional-text.js', 'systems/global-writer.js', 'systems/captures.js',
    'utils/remote-host-text.js', 'utils/compromise-bolt.js', 'systems/keyring.js', 'systems/notifications.js', 'ui/modal-stack.js', 'utils/overlay-open.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'utils/sync-before-fetch.js', 'systems/network-links.js', 'api-client.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'minigames/password/password-minigame.js']) copy(rel);


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

test('a cancelled keycard (revoked_card_ids) is refused with the reader wording and never reaches GET or POST', async () => {
    setup();
    window.isCardRevoked = (id) => (window.gameState.globalVariables.revoked_card_ids || []).includes(id);
    window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const card = { scenarioData: { id: 'lena_rdp_file', name: 'Clerk badge', type: 'keycard', card_id: 'clerk_card', credential: 'x' } };
    const r = await window.keyring.connect(card);
    assert.equal(r.outcome, 'revoked');
    assert.equal(r.message, 'Card cancelled');
    assert.deepEqual(toasts(), ['Clerk badge has been deactivated. The reader rejects it.']);
    assert.equal(alerts[0][2], 'Card cancelled');
    assert.equal(posts().length, 0, 'no POST');
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 0, 'no GET');
    assert.equal(opened.length, 0, 'no desktop');
});

test('a non-keycard item whose card_id is revoked is not treated as a card and still connects', async () => {
    setup();
    window.isCardRevoked = (id) => (window.gameState.globalVariables.revoked_card_ids || []).includes(id);
    window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const file = { scenarioData: { ...ITEM.scenarioData, card_id: 'clerk_card' } };
    const r = await window.keyring.connect(file);
    assert.notEqual(r.outcome, 'revoked');
    assert.equal(posts().length, 1, 'signed in by POST');
});

test('an unrevoked keycard, and a revoked id for another card, still connect', async () => {
    setup();
    window.isCardRevoked = (id) => (window.gameState.globalVariables.revoked_card_ids || []).includes(id);
    window.gameState.globalVariables.revoked_card_ids = ['other_card'];
    const card = { scenarioData: { ...ITEM.scenarioData, type: 'keycard', card_id: 'clerk_card' } };
    const r = await window.keyring.connect(card);
    assert.notEqual(r.outcome, 'revoked');
    assert.equal(posts().length, 1, 'signed in by POST');
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

test('step 2: an assist invite answers Connect from K3c (CONNECT_KINDS has both kinds); a token still does not', async () => {
    setup();
    assert.deepEqual(CONNECT_KINDS, ['saved_connection', 'assist_invite']);
    keyringAnswer = () => ({ entries: [{ ...INVITE, kind: 'token' }], rev: 'r1' });
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
    assert.deepEqual(alerts[0][4], { plainText: true, whole: true }, 'the long teaching line is read whole on a phone');
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
        [refusal(403, { message: 'PC not reachable' }), 'no_route', "HB-FIN-02 can't be reached from here. You need a way onto its network."],
        [refusal(403, { reason: 'off' }), 'target_off', 'HB-FIN-02 is not responding.'],
        // The Pundit body has no reason and is not a network problem (R2 t2)
        [refusal(403, { error: 'Not authorized' }), 'login_failed', 'Connect could not reach the game server. Try again.'],
        // Any other 403 reason is not a network problem (R1 m4)
        [refusal(403, { reason: 'no_session' }), 'login_failed', 'Connect could not reach the game server. Try again.'],
        [refusal(403, { reason: 'future_token_check' }), 'login_failed', 'Connect could not reach the game server. Try again.'],
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

test('R2 n1: a 403 after a sync that ran out of time adds the note to the Connect toast', async () => {
    const { mock } = await import('node:test');
    setup();
    window.stateSync = { syncConfirmed: async () => {}, sync: () => new Promise(() => {}) };
    loginAnswer = () => { throw refusal(403, { reason: 'not_responding' }); };
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const pending = window.keyring.connect(ITEM);
        for (let i = 0; i < 6; i++) { await settle(2); mock.timers.tick(3000); }
        const r = await pending;
        assert.equal(r.outcome, 'target_off');
        assert.deepEqual(toasts(), ['HB-FIN-02 is not responding. The link may be behind; try again in a moment.']);
    } finally { mock.timers.reset(); }
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

// A dispatcher that keeps its listeners, so a test can send minigame_ended (K4 carry-in t1)
function liveDispatcher() {
    const listeners = new Map();
    return {
        listeners,
        emit(name, data) { for (const fn of [...(listeners.get(name) || [])]) fn(data); },
        on(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
        off(name, fn) { const l = listeners.get(name) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
    };
}

test('returnTo runs once after the screens Connect opened have closed, never before (minigame_ended)', async () => {
    setup();
    const d = liveDispatcher();
    window.eventDispatcher = d;
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const seen = [];
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        window.MinigameFramework.currentMinigame = { open: true };
        mock.timers.tick(5000);
        assert.deepEqual(seen, [], 'a screen is open, so the open wait does not finish it');
        // A folder closes and its desktop reopens on a 0 ms timer: not finished
        window.MinigameFramework.currentMinigame = null;
        d.emit('minigame_ended', {});
        setTimeout(() => { window.MinigameFramework.currentMinigame = { open: true }; }, 0);
        mock.timers.tick(150);
        assert.deepEqual(seen, [], 'the desktop came back within the settle');
        window.MinigameFramework.currentMinigame = null;
        d.emit('minigame_ended', {});
        mock.timers.tick(50);
        assert.deepEqual(seen, [], 'not before the settle');
        mock.timers.tick(60);
        assert.deepEqual(seen, [{ reason: 'closed' }]);
        d.emit('minigame_ended', {});
        mock.timers.tick(2000);
        assert.equal(seen.length, 1, 'once');
        assert.equal((d.listeners.get('minigame_ended') || []).length, 0, 'the listener is removed');
    } finally { mock.timers.reset(); }
});

test('returnTo: when no screen ever opens it still runs, after the open wait', async () => {
    setup();
    window.eventDispatcher = liveDispatcher();
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
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
    const d = liveDispatcher();
    window.eventDispatcher = d;
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
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
        d.emit('minigame_ended', {});
        mock.timers.tick(150);
        assert.equal(seen.length, 1);
    } finally { mock.timers.reset(); }
});

test('returnTo with no dispatcher falls back to polling the minigame layer', async () => {
    setup();
    window.eventDispatcher = null;
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const seen = [];
        await window.keyring.connect(ITEM, { returnTo: (info) => seen.push(info) });
        window.MinigameFramework.currentMinigame = { open: true };
        mock.timers.tick(1000);
        window.MinigameFramework.currentMinigame = null;
        mock.timers.tick(250);
        assert.deepEqual(seen, [{ reason: 'closed' }]);
    } finally { mock.timers.reset(); }
});

// ── K4: the from route (plan 3.7, 9) ────────────────────────────────────────────────────────

const FROM_RDP = { ...RDP, routes: [{ foothold: 'jack_comms_port' }, { from: 'a_pc' }, { from: 'b_pc' }] };

test('K4 connectRoute: the starting desktop when listed, else the most recently opened source, before any foothold', () => {
    const order = { a_pc: 3, b_pc: 7 };
    const sessions = { openedOrder: (id) => order[id] || 0 };
    assert.deepEqual(connectRoute(FROM_RDP, { from: 'a_pc', sessions }), { from: 'a_pc' }, 'the desktop Connect started on');
    assert.deepEqual(connectRoute(FROM_RDP, { sessions }), { from: 'b_pc' }, 'the most recent open');
    assert.deepEqual(connectRoute(FROM_RDP, { from: 'elsewhere_pc', sessions }), { from: 'b_pc' }, 'an unlisted start falls back to the tray order');
    assert.deepEqual(connectRoute(FROM_RDP, { sessions: { openedOrder: () => 0 } }), { from: 'a_pc' }, 'a tie keeps the server order');
    assert.deepEqual(connectRoute(RDP, { from: 'a_pc', sessions }), { foothold: 'jack_comms_port' }, 'no from rows: the foothold');
    assert.deepEqual(connectRoute({ kind: 'assist_invite', routes: [{ relay: true }] }, { from: 'a_pc' }), { relay: true });
});

test('K4 pcSessions.openedOrder rises with each desktop open and sign-in', () => {
    const ps = new PcSessions();
    assert.equal(ps.openedOrder('a_pc'), 0);
    ps._replace('a_pc', { npcId: 'lena', via: 'password' });
    ps._replace('b_pc', { npcId: 'sam', via: 'password' });
    assert.ok(ps.openedOrder('b_pc') > ps.openedOrder('a_pc'));
    ps.desktopOpened('a_pc');
    assert.ok(ps.openedOrder('a_pc') > ps.openedOrder('b_pc'));
});

test('K4 step 8: a from route posts from and opens the desktop from its source', async () => {
    setup();
    const fromOpened = [];
    window.openFromDesktop = (pcId, fromPcId) => fromOpened.push([pcId, fromPcId]);
    keyringAnswer = () => ({ entries: [FROM_RDP], rev: 'r1' });
    loginAnswer = () => ({
        success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection',
        label: 'HB-FIN-02.rdp', remote: true, fromPcId: 'a_pc', fromHost: 'HB-DESK-01', host: 'HB-FIN-02', route: { from: 'a_pc' }
    });
    const r = await window.keyring.connect(ITEM, { from: 'a_pc' });
    assert.equal(r.outcome, 'signed_in');
    assert.deepEqual(posts()[0][3], { from: 'a_pc' });
    assert.deepEqual(fromOpened, [['lena_pc', 'a_pc']]);
    assert.equal(opened.length, 0, 'no foothold desktop');
    const held = pcSessions.get('lena_pc');
    assert.equal(held.fromPcId, 'a_pc');
    assert.equal(held.fromHost, 'HB-DESK-01');
});

test('K4 step 5: a session held by a from route reopens from its source', async () => {
    setup();
    const fromOpened = [];
    window.openFromDesktop = (pcId, fromPcId) => fromOpened.push([pcId, fromPcId]);
    pcSessions._replace('lena_pc', { npcId: 'lena', via: 'credential', remote: true, footholdId: null, fromPcId: 'b_pc', host: 'HB-FIN-02' });
    keyringAnswer = () => ({ entries: [{ ...FROM_RDP, sessionHeld: true }], rev: 'r1' });
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'session_held');
    assert.deepEqual(fromOpened, [['lena_pc', 'b_pc']]);
    assert.equal(posts().length, 0);
});

test('K4 step 8 refusal: a lockout by a from route opens the sign-in screen with fromPcId', async () => {
    setup();
    keyringAnswer = () => ({ entries: [FROM_RDP], rev: 'r1' });
    loginAnswer = () => { throw refusal(422, { lockedOut: true, attemptsLeft: 0 }); };
    const r = await window.keyring.connect(ITEM, { from: 'a_pc' });
    assert.equal(r.outcome, 'signin_screen');
    assert.equal(signIns[0].fromPcId, 'a_pc');
    assert.equal(signIns[0].footholdId, undefined);
});

test('K4 Keyring.fetch with from asks from= and keeps its own cache key', async () => {
    setup();
    const asked = [];
    window.ApiClient.keyring = async (pcId, opts = {}) => { asked.push([pcId, opts]); return { entries: [RDP], rev: 'rf' }; };
    await window.keyring.fetch('lena_pc', { from: 'a_pc' });
    assert.equal(asked[0][1].from, 'a_pc');
    assert.equal(asked[0][1].foothold, undefined);
    assert.ok(window.keyring.cache.has('lena_pc|from:a_pc'));
    assert.equal(Keyring.cacheKey('lena_pc', { foothold: 'fh', from: 'a_pc' }), 'lena_pc|foothold:fh', 'a foothold wins');
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

test('trayChanged asks on an add or a heldItem removal, once per changed set of tray ids, and a screen-free refresh flushes first', async () => {
    setup();
    const kr = window.keyring;
    const items = (...ids) => ids.map(id => ({ scenarioData: { id } }));
    await kr.trayChanged(items('a', 'b'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 1);
    assert.deepEqual(calls.map(c => c[0]), ['sync', 'keyring']);
    assert.equal(kr.trayChanged(items('b', 'a')), null, 'the same set in another order: no ask');
    assert.equal(kr.trayChanged(items('a', 'b')), null);
    await kr.trayChanged(items('a', 'b', 'c', 'lena_rdp_file'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 2, 'an add asks');
    assert.equal(kr.trayChanged(items('a', 'b', 'lena_rdp_file')), null, 'removing an item no entry holds asks nothing');
    await kr.trayChanged(items('a', 'b'));
    assert.equal(calls.filter(c => c[0] === 'keyring').length, 3, 'removing a heldItem asks');
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
    assert.deepEqual(handlers.map(h => h[0]),
        ['inventory_changed', 'pc_signed_in', 'pc_signed_out', 'pc_desktop_opened', 'network_foothold_gained', 'conversation_closed:*']);
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

// ── Part B: the find toasts (plan 8.2 second bullet, 8.5 "find toasts") ───────────────────────
const JAKE = { username: 'jbrooks', displayName: 'Jake Brooks', npcId: 'jake' };
const PW = { id: 'k_pw', kind: 'password', source: 'registry', label: 'passwords.txt', account: JAKE, host: 'HB-FIN-03', connectsTo: 'jake_pc', foundIn: 'passwords_txt' };
const CAPTURED = { id: 'k_cap', kind: 'password', source: 'capture', label: 'Captured', account: JAKE, host: 'HB-FIN-03', connectsTo: 'jake_pc' };
const RDP_FOUND = 'Saved connection found: HB-FIN-02.rdp for Lena Fox on HB-FIN-02.';
const RDP2_FOUND = 'Saved connection found: HB-FIN-03.rdp for Lena Fox on HB-FIN-03.';
const PW_FOUND = "Jake Brooks's password is in passwords.txt.";
const keyringGets = () => calls.filter(c => c[0] === 'keyring');
const answers = (...list) => { let i = 0; keyringAnswer = () => list[Math.min(i++, list.length - 1)]; };
const finds = () => alerts.filter(a => a[1] === 'info' && a[4]?.whole === true);

test('8.5 find strings are exactly the plan text', () => {
    assert.equal(text.savedConnectionFoundMessage({ label: 'HB-FIN-02.rdp', displayName: 'Lena Fox', host: 'HB-FIN-02' }), RDP_FOUND);
    assert.equal(text.passwordInFileFoundMessage({ label: 'passwords.txt', displayName: 'Jake Brooks' }), PW_FOUND);
    assert.equal(text.findMoreLine(3), 'and 3 more');
    assert.equal(text.findLine(RDP), RDP_FOUND);
    assert.equal(text.findLine(PW), PW_FOUND);
    assert.equal(text.findLine(CAPTURED), null, 'a capture has no find line');
    assert.equal(text.findLine(INVITE), "Assist code: Connect it from your inventory to join Lena Fox's session.", 'K3c: the invite line');
});

test('find toasts: the page-start prime is the baseline and toasts nothing', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP], rev: 'r1' }, { entries: [RDP, OTHER_RDP], rev: 'r2' });
    await kr.prime();
    await settle();
    assert.deepEqual(keyringGets(), [['keyring', null, null]], 'one GET at load, no rev yet');
    assert.equal(alerts.length, 0, 'what was held at load toasts nothing');
    await kr.refresh();
    await settle();
    assert.deepEqual(toasts(), [RDP2_FOUND], 'only the new entry');
    assert.deepEqual(alerts[0].slice(1), ['info', '', 7000, { plainText: true, whole: true }], 'plain text, no title, clamp lifted only (no brief)');
});

test('find toasts: the next ask sends the rev, and an unchanged answer toasts nothing', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP], rev: 'r1' }, { unchanged: true, rev: 'r1' });
    await kr.prime();
    await kr.refresh();
    await settle();
    assert.deepEqual(keyringGets(), [['keyring', null, null], ['keyring', null, 'r1']], 'one GET per trigger, rev reused');
    assert.equal(alerts.length, 0);
});

test('find toasts: a failed prime leaves the next answer as the baseline', async () => {
    setup();
    const kr = window.keyring;
    let n = 0;
    keyringAnswer = () => { if (n++ === 0) throw new Error('offline'); return n === 2 ? { entries: [RDP], rev: 'r1' } : { entries: [RDP, OTHER_RDP], rev: 'r2' }; };
    await kr.prime();
    await kr.refresh();
    await settle();
    assert.equal(alerts.length, 0, 'the first good answer is the baseline');
    await kr.refresh();
    await settle();
    assert.deepEqual(toasts(), [RDP2_FOUND]);
});

test('find toasts: one per kind, two in one toast, more than two names two then "and N more"', async () => {
    setup();
    const kr = window.keyring;
    kr.opened.add('passwords_txt');
    const PW2 = { ...PW, id: 'k_pw2', label: 'notes.txt', account: { username: 'aa', displayName: 'Ana Abara' }, foundIn: 'passwords_txt' };
    const PW3 = { ...PW, id: 'k_pw3', label: 'old.txt', foundIn: 'passwords_txt' };
    answers({ entries: [], rev: 'r0' }, { entries: [PW], rev: 'r1' }, { entries: [PW, RDP, OTHER_RDP], rev: 'r2' },
        { entries: [PW, RDP, OTHER_RDP, PW2, PW3, INVITE, CAPTURED, { ...RDP, id: 'k_rdp9', label: 'X.rdp' }], rev: 'r3' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), [PW_FOUND], 'password in a file');
    await kr.refresh(); await settle();
    assert.equal(toasts()[1], `${RDP_FOUND}\n${RDP2_FOUND}`, 'two at once: both, one toast');
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 3, 'one toast per answer');
    assert.equal(toasts()[2],
        "Ana Abara's password is in notes.txt.\nJake Brooks's password is in old.txt.\nand 2 more",
        'four toastable finds: two named, then "and 2 more" (the invite counts from K3c; the capture is not counted)');
});

test('find toasts: a capture stays silent; an assist invite toasts its K3c line', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP], rev: 'r1' }, { entries: [RDP, CAPTURED, { ...INVITE, id: 'k_invc', source: 'capture' }, { ...RDP, id: 'k_rdpc', source: 'capture' }], rev: 'r2' },
        { entries: [RDP, CAPTURED, INVITE], rev: 'r3' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 0, 'captures, an invite capture among them, are silent');
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), ["Assist code: Connect it from your inventory to join Lena Fox's session."]);
});

test('find toasts: a password in a file waits until its file is opened, then asks once with rev', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP], rev: 'r1' }, { entries: [RDP, PW], rev: 'r2' }, { unchanged: true, rev: 'r2' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 0, 'not opened yet: no toast');
    assert.equal(kr.noteOpened('some_other_file'), null, 'another file asks nothing');
    assert.equal(keyringGets().length, 2);
    await kr.noteOpened('passwords_txt');
    await settle();
    assert.deepEqual(keyringGets()[2], ['keyring', null, 'r2'], 'one GET, with rev');
    assert.deepEqual(toasts(), [PW_FOUND], 'the unchanged answer shows it now');
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 1, 'shown once');
});

test('find toasts: an entry waiting at load still waits for its file (no prime reveal for a failed prime)', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP, PW], rev: 'r1' });
    await kr.prime(); await settle();
    assert.equal(alerts.length, 0, 'the prime reveals and never toasts');
    assert.equal(kr.noteOpened('passwords_txt'), null, 'earned before the page: not waiting, no ask');
});

test('find toasts: a find during a conversation is held until it closes, then one toast', async () => {
    setup();
    const handlers = new Map();
    window.eventDispatcher = { emit: () => {}, on: (n, f) => handlers.set(n, f) };
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [RDP, OTHER_RDP], rev: 'r2' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    // The ink gift lands in the tray: the tray change asks
    handlers.get('inventory_changed')({ items: [{ scenarioData: { id: 'lena_rdp_file' } }] });
    await settle();
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 0, 'nothing beside the gift\'s own toast');
    handlers.get('conversation_closed:*')({ npcId: 'lena' });
    await settle();
    assert.deepEqual(toasts(), [`${RDP_FOUND}\n${RDP2_FOUND}`], 'both held finds in one toast after the close');
    assert.equal(kr._holdTimer, null, 'the hold timer is cleared');
    window.currentConversationNPCId = null;
});

test('find toasts: a held find is released when the conversation flag clears with no close event', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 0);
    window.currentConversationNPCId = null;
    await new Promise(r => setTimeout(r, 600));
    await settle();
    assert.deepEqual(toasts(), [RDP_FOUND]);
    assert.equal(kr._holdTimer, null);
});

test('find toasts: the triggers ask once each (sign-in once its desktop opens, a foothold gained)', async () => {
    setup();
    const handlers = new Map();
    window.eventDispatcher = { emit: () => {}, on: (n, f) => handlers.set(n, f) };
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { unchanged: true, rev: 'r0' });
    await kr.prime(); await settle();
    handlers.get('pc_desktop_opened')({ pcId: 'lena_pc' });
    await settle();
    assert.equal(keyringGets().length, 1, 'a desktop reopened with no sign-in asks nothing');
    handlers.get('pc_signed_in')({ pcId: 'lena_pc' });
    await settle();
    assert.equal(keyringGets().length, 1, 'the sign-in waits for its desktop');
    handlers.get('pc_desktop_opened')({ pcId: 'lena_pc' });
    await settle();
    assert.equal(keyringGets().length, 2, 'one ask once the desktop is open');
    handlers.get('pc_desktop_opened')({ pcId: 'lena_pc' });
    await settle();
    assert.equal(keyringGets().length, 2, 'only once per sign-in');
    handlers.get('network_foothold_gained')({ footholdId: 'jack_comms_port' });
    await settle();
    assert.equal(keyringGets().length, 3, 'a plant, implant or join asks once');
    assert.equal(keyringGets()[2][2], 'r0', 'with rev');
});

test('find toasts: nothing is written to globals or player state', async () => {
    setup();
    const kr = window.keyring;
    kr.opened.add('passwords_txt');
    window.gameState = { globalVariables: { a: 1 }, inventory: [] };
    const before = JSON.stringify(window.gameState);
    const writes = [];
    window.stateSync = { syncConfirmed: async () => {}, sync: () => writes.push('sync'), queue: () => writes.push('queue') };
    window.ApiClient.post = async () => writes.push('post');
    window.ApiClient.put = async () => writes.push('put');
    answers({ entries: [], rev: 'r0' }, { entries: [RDP, PW, OTHER_RDP], rev: 'r1' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 1);
    assert.equal(JSON.stringify(window.gameState), before);
    assert.deepEqual(writes, []);
    assert.equal(posts().length, 0);
});

test('find toasts reach the DOM as text: a label with markup is not parsed', async () => {
    setup();
    const { gameAlert } = await imp('systems/notifications.js');
    window.gameAlert = gameAlert;
    document.body.innerHTML = '<div id="notification-container"></div>';
    const kr = window.keyring;
    const evil = { ...RDP, id: 'k_evil', label: '<img src=x onerror="window.pwned=1">.rdp', account: { username: 'x', displayName: '<b>Bob</b>' } };
    answers({ entries: [], rev: 'r0' }, { entries: [evil], rev: 'r1' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.ok(document.querySelector('.notification img, .notification b') === null, 'no element from author text');
    assert.match(document.body.textContent, /Saved connection found: <img src=x onerror="window.pwned=1">.rdp for <b>Bob<\/b> on HB-FIN-02\./);
});

// ── K3b round 1 fixes ────────────────────────────────────────────────────────────────────────
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('m1: an older background answer applied after a newer one is dropped (one toast, latest keeps the newer)', async () => {
    setup();
    const kr = window.keyring;
    const pending = [];
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    window.ApiClient.keyring = (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.rev ?? null]); const d = deferred(); pending.push(d); return d.promise; };
    const a = kr.fetch(null);   // the older ask
    const b = kr.fetch(null);   // the newer ask
    await settle();
    pending[1].resolve({ entries: [RDP], rev: 'r2' });   // newer answered first
    await b; await settle();
    pending[0].resolve({ entries: [], rev: 'r1' });      // the older answer arrives late
    await a; await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'one toast');
    assert.deepEqual(kr.latest.map(e => e.id), ['k_rdp'], 'latest keeps the newer entries');
    assert.ok(kr.connectEntryFor('lena_rdp_file'), 'the tray still finds its Connect entry');
    window.ApiClient.keyring = async () => ({ entries: [RDP], rev: 'r2' });
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 1, 'and the next ask does not find the .rdp "new" again');
});

test('m1: triggers in the same tick share one request, and a later trigger waits its turn', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    const before = keyringGets().length;
    const p1 = kr.refresh(); const p2 = kr.refresh();
    assert.equal(p1, p2, 'the same promise');
    await p1;
    assert.equal(keyringGets().length - before, 1, 'one GET for both');
    // a trigger that arrives while a request is on the wire asks again after it, never beside it
    const gates = [];
    let inFlight = 0, maxInFlight = 0;
    window.ApiClient.keyring = async (pcId, opts = {}) => {
        calls.push(['keyring', pcId, opts.rev ?? null]);
        inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
        const d = deferred(); gates.push(d); await d.promise; inFlight--;
        return { entries: [], rev: 'r0' };
    };
    const c1 = kr.refresh();
    await settle();
    const c2 = kr.refresh();
    await settle();
    assert.equal(gates.length, 1, 'the second waits for the first');
    gates[0].resolve();
    await c1; await settle();
    gates[1].resolve();
    await c2;
    assert.equal(maxInFlight, 1);
    assert.equal(gates.length, 2);
});

test('m2: the find toast and the teaching toast lift the clamp only, no brief', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' });
    await kr.prime();
    await kr.refresh(); await settle();
    assert.equal(alerts[0][4].whole, true);
    assert.equal(alerts[0][4].brief, undefined);
    // notifications.js: `whole` adds the class and nothing of brief's priority
    const { showNotification } = await imp('systems/notifications.js');
    document.body.innerHTML = '<div id="notification-container"></div>';
    const el = showNotification(RDP_FOUND, 'info', '', 0, { plainText: true, whole: true });
    assert.ok(el.classList.contains('whole'));
    assert.ok(!el.classList.contains('brief'));
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css/notifications.css'), 'utf8');
    assert.match(css, /\.notification\.whole \.notification-message[\s\S]*?line-clamp: none/);
});

test('m3: a failed prime is tried again on a timer, so the first real find still toasts', async () => {
    setup();
    const kr = window.keyring;
    kr.primeRetryMs = 5;
    let n = 0;
    keyringAnswer = () => { n++; if (n === 1) throw new Error('offline'); return { entries: [], rev: 'r0' }; };
    await kr.prime();
    assert.equal(kr._findIds, null, 'the prime failed');
    await new Promise(r => setTimeout(r, 40));
    assert.ok(kr._findIds instanceof Set, 'the retry set the baseline');
    assert.equal(alerts.length, 0);
    keyringAnswer = () => ({ entries: [RDP], rev: 'r1' });
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'the first find toasts');
});

test('m3: retries stop after the set number when the server stays down', async () => {
    setup();
    const kr = window.keyring;
    kr.primeRetryMs = 3; kr.primeRetries = 2;
    keyringAnswer = () => { throw new Error('offline'); };
    await kr.prime();
    await new Promise(r => setTimeout(r, 60));
    assert.equal(keyringGets().length, 3, 'the prime and two retries');
    assert.equal(kr._findIds, null, 'today\'s rule is the last resort');
});

test('t2: no pcSessions gives the failure toast, not a rejection', async () => {
    setup();
    window.pcSessions = undefined;
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'login_failed');
    assert.deepEqual(toasts(), ['Connect could not reach the game server. Try again.']);
});

test('t4: findLine itself keeps a capture silent (the second of the two guards)', () => {
    assert.equal(text.findLine({ ...RDP, source: 'capture' }), null);
});

// ── K3b round 2 fixes ────────────────────────────────────────────────────────────────────────
test('R2 m1a: a trigger that arrives during the sync PUT builds a later ask, not a joined one', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    const gates = [];
    window.stateSync = { syncConfirmed: () => { calls.push(['sync']); const d = deferred(); gates.push(d); return d.promise; } };
    const before = keyringGets().length;
    const p1 = kr.refresh();
    await settle();                       // the ask has started and waits on the sync
    assert.equal(gates.length, 1);
    const p2 = kr.refresh();              // a change lands during the PUT
    assert.notEqual(p1, p2, 'a different ask');
    await settle();
    gates[0].resolve();
    await p1; await settle();
    assert.equal(gates.length, 2, 'the second ask flushes its own change');
    gates[1].resolve();
    await p2;
    assert.equal(keyringGets().length - before, 2, 'two GETs');
});

test('R2 m1b: a prime answered after a newer ask still sets the reload set', async () => {
    setup();
    const kr = window.keyring;
    const pending = [];
    window.ApiClient.keyring = (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.rev ?? null]); const d = deferred(); pending.push(d); return d.promise; };
    const prime = kr.prime();
    const later = kr.fetch(null);
    await settle();
    pending[1].resolve({ entries: [PW, RDP], rev: 'r2' });
    await later; await settle();
    pending[0].resolve({ entries: [PW], rev: 'r1' });
    await prime; await settle();
    assert.ok(kr.firstAnswerIds instanceof Set, 'the dropped prime still fixed the reload set');
    assert.deepEqual([...kr.firstAnswerIds], ['k_pw']);
    assert.deepEqual(kr.latest.map(e => e.id), ['k_pw', 'k_rdp'], 'latest keeps the newer entries');
    assert.equal(kr.foundVisible(PW), true, 'a password found before the reload is not hidden');
});

test('R2 t1: a background ask that never answers times out, so the chain moves on', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    kr.askTimeoutMs = 15;
    let signal = null, n = 0;
    window.ApiClient.keyring = (pcId, opts = {}) => {
        calls.push(['keyring', pcId, opts.rev ?? null]);
        if (++n === 1) { signal = opts.signal; return new Promise(() => {}); }
        return Promise.resolve({ entries: [RDP], rev: 'r1' });
    };
    const hung = kr.refresh();
    const next = kr.refresh();   // joins the same ask
    assert.equal(await hung, null, 'the hung ask gives up');
    assert.ok(signal?.aborted, 'and the request is aborted');
    await next;
    const after = await kr.refresh(); await settle();
    assert.deepEqual(after.map(e => e.id), ['k_rdp'], 'a later ask is answered');
    assert.deepEqual(toasts(), [RDP_FOUND]);
});

test('R3 t1: a sync PUT that never answers is inside the same cap, so the chain moves on', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    kr.askTimeoutMs = 30;
    let hang = true;
    window.stateSync = { syncConfirmed: () => (hang ? new Promise(() => {}) : Promise.resolve()) };
    const realNow = Date.now, frozen = realNow();
    const t0 = realNow();
    const getsBefore = keyringGets().length;
    // R3 t1: freeze the clock for the hung refresh, so a reverted fix always has the whole cap
    // left for a GET (setTimeout still fires on real time after 30 ms)
    Date.now = () => frozen;
    try {
        assert.equal(await kr.refresh(), null, 'the hung PUT spends the cap and the refresh gives up');
    } finally { Date.now = realNow; }
    assert.ok(realNow() - t0 < 1000, 'well inside a second');
    // K3c R2 t1: no GET at all once the PUT has spent the cap (a GET sent with a sliver left
    // could beat its own timeout and return [] instead of null)
    assert.equal(keyringGets().length, getsBefore, 'no GET while the PUT hangs');
    hang = false;
    answers({ entries: [RDP], rev: 'r1' });
    const after = await kr.refresh(); await settle();
    assert.deepEqual(after.map(e => e.id), ['k_rdp'], 'a later refresh is answered');
});

test('R3 t2: the no-rev retry shares the first ask\'s deadline, not a fresh one', async () => {
    setup();
    const kr = window.keyring;
    let n = 0, retrySignal = null;
    window.ApiClient.keyring = (pcId, opts = {}) => {
        calls.push(['keyring', pcId, opts.rev ?? null]);
        // The first answer is unusable after most of the budget; the retry never answers
        if (++n === 1) return new Promise(r => setTimeout(() => r({ unusable: true }), 320));
        retrySignal = opts.signal;
        return new Promise(() => {});
    };
    const t0 = Date.now();
    await assert.rejects(kr.fetch(null, { timeoutMs: 400 }), /timed out/);
    const spent = Date.now() - t0;
    assert.equal(keyringGets().length, 2, 'the retry went out');
    assert.ok(spent < 560, `one 400 ms deadline in all (took ${spent} ms; a fresh one would be about 720)`);
    assert.ok(retrySignal?.aborted, 'the retry is aborted at the deadline');
});

test('K3c R1 t1: the GET gets only the time the sync PUT left of the cap', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' });
    await kr.prime();
    kr.askTimeoutMs = 400;
    window.stateSync = { syncConfirmed: () => new Promise(r => setTimeout(r, 320)) };   // spends most of the cap
    let signal = null;
    window.ApiClient.keyring = (pcId, opts = {}) => { signal = opts.signal; return new Promise(() => {}); };
    const t0 = Date.now();
    assert.equal(await kr.refresh(), null, 'the hung GET gives up');
    const spent = Date.now() - t0;
    assert.ok(signal?.aborted, 'and its request is aborted');
    assert.ok(spent < 560, `one 400 ms cap for PUT and GET together (took ${spent} ms; a fresh cap for the GET would be about 720)`);
});

test('part A R2 m1: with no tray change seen, a held find shows at the close even if the latest answer lacks it', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [], rev: 'r2' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    await kr.refresh(); await settle();             // r1: the find is held (no trayChanged, so _trayIds is null)
    assert.equal(kr._trayIds, null, 'no tray change seen');
    assert.equal(alerts.length, 0, 'held while talking');
    await kr.refresh(); await settle();             // r2: lacks it
    window.currentConversationNPCId = null;
    await kr.releaseHeld(); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'no client drop can have happened, so it shows');
});

test('K3c R1 M1: a held find is still toasted once when the latest answer briefly lacks it', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [], rev: 'r2' }, { entries: [RDP], rev: 'r3' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    await kr.trayChanged([ITEM]); await settle();   // r1: the find is held
    assert.equal(alerts.length, 0, 'held while talking');
    await kr.refresh(); await settle();             // r2: lacks it, the file is still in the tray
    window.currentConversationNPCId = null;
    await kr.releaseHeld(); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'exactly one toast');
    await kr.refresh(); await settle();             // r3: back
    assert.deepEqual(toasts(), [RDP_FOUND], 'and none when it returns');
});

test('K3c R1 M1: a held find whose file left the tray is dropped at the close', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [], rev: 'r2' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    await kr.trayChanged([ITEM]); await settle();
    await kr.trayChanged([]); await settle();
    window.currentConversationNPCId = null;
    await kr.releaseHeld(); await settle();
    assert.deepEqual(toasts(), [], 'dropped meanwhile: no toast');
});

test('K3c R1 m1: a drop and a retake before the answer returns still toasts the retake', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' });
    await kr.prime();
    await kr.trayChanged([ITEM]); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND]);
    const pending = [];
    window.ApiClient.keyring = (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.rev ?? null]); const d = deferred(); pending.push(d); return d.promise; };
    kr.trayChanged([]); await settle();        // ask A goes out
    kr.trayChanged([ITEM]); await settle();    // retaken before A returns: ask B queued
    assert.equal(pending.length, 1, 'only A is out');
    pending[0].resolve({ entries: [], rev: 'r2' }); await settle();
    assert.equal(pending.length, 2, 'B goes out after A');
    pending[1].resolve({ entries: [RDP], rev: 'r3' }); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND, RDP_FOUND], 'the retake toasts again');
});

test('K3c R1 m2: a later answer without heldItem keeps the known item, so the find is still forgotten with it', async () => {
    setup();
    const kr = window.keyring;
    const { heldItem, ...bare } = RDP;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [bare], rev: 'r2' }, { entries: [RDP], rev: 'r3' });
    await kr.prime();
    await kr.trayChanged([ITEM]); await settle();   // r1: toast
    await kr.refresh(); await settle();             // r2: same id, no heldItem
    await kr.trayChanged([]); await settle();       // the file leaves (latest names no heldItem: no ask)
    await kr.trayChanged([ITEM]); await settle();   // r3: back
    assert.deepEqual(toasts(), [RDP_FOUND, RDP_FOUND], 'a retaken file toasts again');
});

test('reconnect: an answer that briefly lacks a held find does not toast it again; drop and retake does', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r0' }, { entries: [RDP], rev: 'r1' }, { entries: [], rev: 'r2' }, { entries: [RDP], rev: 'r3' },
        { entries: [], rev: 'r4' }, { entries: [RDP], rev: 'r5' });
    await kr.prime();
    await kr.trayChanged([ITEM]); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'the first find toasts');
    // A reconnect: one answer without the entry while the file is still in the tray, then it is back
    await kr.refresh(); await settle();
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'no second toast for the same file');
    // The file leaves the tray (its entry goes with it), then is taken again
    await kr.trayChanged([]); await settle();
    await kr.trayChanged([ITEM]); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND, RDP_FOUND], 'retaking a dropped file toasts again');
});

test('reconnect: a find held during a conversation is one line however often it is held, and a dropped one is not toasted', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [RDP, OTHER_RDP], rev: 'r0' }, { entries: [RDP], rev: 'r1' });
    await kr.prime();
    window.currentConversationNPCId = 'lena';
    kr.announceFinds([RDP, OTHER_RDP]);
    kr.announceFinds([RDP]);
    assert.deepEqual(kr._held.map(e => e.id), ['k_rdp', 'k_rdp2'], 'held once each');
    // OTHER_RDP's file leaves the tray meanwhile (a real drop: with no tray change seen, a held
    // find always shows, part A R2 m1), and the answer the drop asks for lacks it
    await kr.trayChanged([ITEM]); await settle();
    await kr.refresh(); await settle();
    window.currentConversationNPCId = null;
    await kr.releaseHeld(); await settle();
    assert.deepEqual(toasts(), [RDP_FOUND], 'one line, the dropped find left out');
});

test('D49: the plug group draws its own badge; an unknown group falls back to the key badge', () => {
    assert.equal(text.BADGE_FILE.plug, 'badge-plug.png');
    assert.equal(text.badgeSrc('plug'), '/break_escape/assets/icons/badge-plug.png');
    assert.equal(text.badgeSrc('key'), '/break_escape/assets/icons/badge-key.png');
    assert.equal(text.badgeSrc('nope'), '/break_escape/assets/icons/badge-key.png');
});

test('K4 step 8 refusal: the sign-in screen is given the host of the desktop it came from, not its id', async () => {
    setup();
    // a local session carries no host, so the name comes from the scenario PC the desktop shows
    pcSessions._replace('a_pc', { npcId: 'lena', via: 'password' });
    window.gameScenario = { credentialsDeclared: true, rooms: { r: { objects: [{ id: 'a_pc', name: "Lena's PC", host: 'HB-FIN-02' }] } } };
    keyringAnswer = () => ({ entries: [FROM_RDP], rev: 'r1' });
    loginAnswer = () => { throw refusal(422, { lockedOut: true, attemptsLeft: 0 }); };
    await window.keyring.connect(ITEM, { from: 'a_pc' });
    assert.equal(signIns[0].fromHost, 'HB-FIN-02');
    // and the lockable it builds reads that host in its header
    const { fromLockable } = await imp('systems/unlock-system.js');
    assert.equal(fromLockable('lena_pc', 'a_pc', { fromHost: 'HB-FIN-02' }).scenarioData.remote.fromHost, 'HB-FIN-02');
    assert.equal(fromLockable('lena_pc', 'zz_pc').scenarioData.remote.fromHost, 'zz_pc', 'the raw id is only the last fallback');
});

test('K4 desktop file Connect: the source desktop passes its own host, so the header never shows the raw PC id', async () => {
    setup();
    // nothing in the session or the scenario names the source PC: only the desktop itself knows
    pcSessions._replace('a_pc', { npcId: 'lena', via: 'password' });
    window.gameScenario = { credentialsDeclared: true, rooms: { r: { objects: [] } } };
    keyringAnswer = () => ({ entries: [FROM_RDP], rev: 'r1' });
    loginAnswer = () => { throw refusal(422, { lockedOut: true, attemptsLeft: 0 }); };
    await window.keyring.connect(ITEM, { from: 'a_pc', fromHost: 'HB-FIN-02' });
    assert.equal(signIns[0].fromHost, 'HB-FIN-02');
});

// ── K-lock (plan 8.6) ───────────────────────────────────────────────────────────────────────

test('K-lock: a locked credential session (sessionHeld false) signs in again by the route and the new copy is unlocked', async () => {
    setup();
    pcSessions._replace('lena_pc', { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02', locked: true });
    keyringAnswer = () => ({ entries: [{ ...RDP, sessionHeld: false }], rev: 'r1' });
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'signed_in');
    assert.deepEqual(posts(), [['post', 'lena_pc', 'k_rdp', { foothold: 'jack_comms_port' }]]);
    assert.deepEqual(opened, [['lena_pc', 'jack_comms_port']]);
    assert.equal(pcSessions.isLocked('lena_pc'), false, 'the fresh sign-in replaces the locked copy');
});

// ── S7: hash rows and cracked passwords ──────────────────────────────────────────────────────

const HASH = { id: 'dana_hash', kind: 'hash', source: 'registry', label: 'dana.hash', token: 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q', salted: true, status: 'ready', account: { username: 'dana', displayName: 'Dana Roe', npcId: 'dana' } };
const HASH_RUNNING = { ...HASH, status: 'running', readyInSeconds: 40 };
const CRACKED_PW = { id: 'dana.cracked', kind: 'password', source: 'cracked', label: 'Cracked', account: HASH.account, password: 'pw' };

test('S7: a cracked password is tagged "cracked", is visible at once and is never a find waiting on a file', async () => {
    setup();
    const { entryTagKind } = await imp('systems/keyring.js');
    const kr = window.keyring;
    assert.equal(entryTagKind(CRACKED_PW), 'cracked');
    assert.equal(entryTagKind({ ...CRACKED_PW, source: 'registry' }), 'in_file');
    assert.equal(kr.foundVisible({ ...CRACKED_PW, foundIn: 'never_opened' }), true);
    assert.equal(kr.findWaiting({ ...CRACKED_PW, foundIn: 'never_opened' }), false);
    assert.equal(kr.screenEntries([CRACKED_PW]).length, 1, 'the sign-in screen lists it');
    assert.equal(text.findLine(CRACKED_PW), null, 'no find line for a cracked password');
});

test('S7: a new hash entry gives the find toast "Hash collected", once', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [], rev: 'r1' }, { entries: [HASH], rev: 'r2' }, { entries: [HASH, CRACKED_PW], rev: 'r3' });
    await kr.prime(); await settle();
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), ['Hash collected']);
    await kr.refresh(); await settle();
    assert.deepEqual(toasts(), ['Hash collected'], 'the cracked password adds no toast');
    assert.equal(text.hashFoundMessage(), 'Hash collected');
});

test('S7: the store keeps crackFacts from a full answer', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [HASH], rev: 'r1', crackFacts: ['petName', 'streetName'] });
    await kr.prime(); await settle();
    assert.deepEqual(kr.crackFacts, ['petName', 'streetName']);
    answers({ entries: [HASH], rev: 'r2' });
    await kr.refresh(); await settle();
    assert.deepEqual(kr.crackFacts, [], 'a full answer without the field clears it');
});

test('S7: an unchanged answer with readyInSeconds resets the running countdown; without it rows stay as they were', async () => {
    setup();
    const kr = window.keyring;
    answers({ entries: [HASH_RUNNING], rev: 'r1' });
    await kr.prime(); await settle();
    const t0 = Date.now();
    mock.timers.enable({ apis: ['Date'], now: t0 + 30000 });
    try {
        assert.equal(kr.crackSecondsLeft('dana_hash'), 10, '40 s served, 30 s gone on this clock');
        answers({ unchanged: true, rev: 'r1' });
        await kr.refresh(); await settle();
        assert.equal(kr.crackSecondsLeft('dana_hash'), 10, 'no readyInSeconds: left as it was');
        answers({ unchanged: true, rev: 'r1', readyInSeconds: { dana_hash: 25 } });
        await kr.refresh(); await settle();
        assert.equal(kr.crackSecondsLeft('dana_hash'), 25, 'reset to the served value');
    } finally { mock.timers.reset(); }
});
