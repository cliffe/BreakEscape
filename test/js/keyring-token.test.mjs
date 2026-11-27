// Credential keyring slice K5 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md section 10): the
// session token's client half. The 8.5 token lines; the keyring's token times (a full answer's
// expiresInS on each entry, an unchanged answer's { credId: n } map) and proof footholds; a
// token shown only on the sign-in screen reached through its proof foothold, an expired one by
// the server's proofFoothold; a held token session's timer told the server's figure; the token
// find toast in both wordings.
// The real keyring.js, unlock-system.js, pc-sessions.js, password-minigame.js and
// remote-host-text.js run against jsdom.
// Run with: node test/js/keyring-token.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'keyring-token-'));
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
put('minigames/ble-scanner/ble-scanner-minigame.js', 'export function applyBlePairEffects() {}\n');
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
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js', 'utils/sync-before-fetch.js', 'systems/network-links.js', 'api-client.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'minigames/password/password-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { PasswordMinigame } = await imp('minigames/password/password-minigame.js');
const { Keyring, FIND_KINDS, SCREEN_FOOTHOLD, SCREEN_KEYBOARD } = await imp('systems/keyring.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { openRemoteSignIn, keyringForScreen } = await imp('systems/unlock-system.js');
const { NetworkLinks } = await imp('systems/network-links.js');
const text = await imp('utils/remote-host-text.js');

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

// ── Fixtures: a token entry as GET /keyring serves it (plan 10) ─────────────────────────────
const LENA = { username: 'lfox', displayName: 'Lena Fox', npcId: 'lena' };
const LABEL = 'HB-FIN-02 sign-in token';
const TOKEN = {
    id: 'k_tok', kind: 'token', source: 'registry', label: LABEL, account: LENA, host: 'HB-FIN-02', connectsTo: 'lena_pc',
    routes: [{ foothold: 'jack_comms_port' }], forThisPc: true, accepted: true, sessionHeld: false, targetOff: false,
    remoteBlocked: false, expiresInS: 600
};
const EXPIRED = { ...TOKEN, routes: [], expired: true, proofFoothold: 'jack_comms_port' };
delete EXPIRED.expiresInS;
const PW = { id: 'k_cap', kind: 'password', source: 'capture', label: 'Finance (Lena)', account: LENA, password: 'x' };

let calls, alerts, keyringAnswer, expiryNotes;

function setup() {
    calls = []; alerts = []; expiryNotes = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameScenario = { credentialsDeclared: true };
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: () => {}, on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.stateSync = { syncConfirmed: async () => {} };
    window.inventory = { items: [] };
    window.currentConversationNPCId = null;
    window.keyring = new Keyring();
    keyringAnswer = () => ({ entries: [TOKEN], rev: 'r1' });
    window.ApiClient = {
        keyring: async (pcId, opts = {}) => {
            calls.push(['keyring', pcId, opts.foothold ?? null, opts.from ?? null, opts.rev ?? null]);
            return keyringAnswer();
        },
        loginAccounts: async () => ({ loginAccounts: [], loginPicker: 'accounts', headless: false, host: 'HB-FIN-02' }),
        get: async () => ({ secrets: {}, accounts: {} }),
        network: async () => ({ footholds: [] })
    };
    window.pcSessions = new PcSessions();
    window.pcSessions.noteTokenExpiry = (pcId, s) => expiryNotes.push([pcId, s]);
    window.networkLinks = new NetworkLinks();
    window.networkLinks.load([], []);
}

// ── 8.5 token text ──────────────────────────────────────────────────────────────────────────

test('8.5 token lines are word for word', () => {
    assert.equal(text.tokenFoundMessage({ label: LABEL, displayName: 'Lena Fox', host: 'HB-FIN-02' }),
        'Session token captured: HB-FIN-02 sign-in token for Lena Fox on HB-FIN-02.');
    assert.equal(text.tokenFoundMessage(), 'Session token captured: a session token for an account on another PC.');
    assert.equal(text.tokenExpiredMessage(LABEL), 'HB-FIN-02 sign-in token has expired.');
    assert.equal(text.tokenExpiredMessage(), 'That session token has expired.');
    assert.equal(text.tokenExpiredEndedMessage(LABEL, 'HB-FIN-02'), 'HB-FIN-02 sign-in token expired. Your session on HB-FIN-02 ended.');
    assert.equal(text.tokenExpiredEndedMessage(), 'That session token expired. Your session on that host ended.');
    assert.equal(text.kindRefusedMessage('token', 'HB-FIN-02'), 'HB-FIN-02 does not accept session tokens.');
    assert.equal(text.kindRefusedShort('HB-FIN-02', 'token'), 'HB-FIN-02: no session tokens.');
    assert.equal(text.kindRefusedShort('HB-FIN-02'), 'HB-FIN-02: type the password.', 'the other kinds keep their line');
    assert.equal(text.kindRefusedShort('HB-FIN-02', 'saved_connection'), 'HB-FIN-02: type the password.');
    assert.equal(text.teachLine('token'), 'A stolen session token signs in without the password until it expires. Short session lifetimes limit it.');
    assert.equal(text.credentialRefusalLine('expired', { label: LABEL }), 'HB-FIN-02 sign-in token has expired.');
    assert.deepEqual(text.TAG_TEXT.token, { tag: 'Token', full: 'Session token', group: 'plug' });
});

test('8.5 the token find line: the plain toast, and the capture log wording when one is held', () => {
    assert.equal(text.findLine(TOKEN), 'Session token captured: HB-FIN-02 sign-in token for Lena Fox on HB-FIN-02.');
    assert.equal(text.findLine(TOKEN, { captureLog: true }),
        'New in your capture log: HB-FIN-02 sign-in token (session token for Lena Fox).', 'plan 10 word for word');
    assert.equal(text.findLine({ ...TOKEN, source: 'capture' }), null, 'a capture is silent, token or not');
    assert.equal(text.findLine({ ...TOKEN, host: null }), 'Session token captured: HB-FIN-02 sign-in token for Lena Fox on lena_pc.',
        'no host falls back to connectsTo, as the other kinds do');
    assert.ok(FIND_KINDS.includes('token'));
});

// ── Keyring token times ─────────────────────────────────────────────────────────────────────

test('token times: a full answer sets each token\'s end from its expiresInS, and an unchanged answer reads the map', () => {
    setup();
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
    try {
        const kr = window.keyring;
        assert.equal(kr.tokenSecondsLeft('k_tok'), null, 'unknown before any answer');
        kr.remember('k', { entries: [TOKEN, PW], rev: 'r1' });
        assert.equal(kr.tokenSecondsLeft('k_tok'), 600);
        assert.equal(kr.tokenSecondsLeft('k_cap'), null, 'a password has no time');
        mock.timers.tick(90_500);
        assert.equal(kr.tokenSecondsLeft('k_tok'), 510, 'whole seconds, rounded up');
        // An unchanged answer: the cached entries stand, the map gives the server's new figure
        assert.deepEqual(kr.remember('k', { unchanged: true, rev: 'r1', expiresInS: { k_tok: 480 } }).map(e => e.id), ['k_tok', 'k_cap']);
        assert.equal(kr.tokenSecondsLeft('k_tok'), 480, 'the server\'s figure wins over the page clock');
        // An unchanged answer that names no time for it keeps the last one
        kr.remember('k', { unchanged: true, rev: 'r1' });
        assert.equal(kr.tokenSecondsLeft('k_tok'), 480);
        mock.timers.tick(600_000);
        assert.equal(kr.tokenSecondsLeft('k_tok'), 0, 'never below zero');
    } finally { mock.timers.reset(); }
});

test('token times: an unchanged answer\'s map is read only with a matching rev', () => {
    setup();
    const kr = window.keyring;
    kr.remember('k', { entries: [TOKEN], rev: 'r1' });
    assert.equal(kr.remember('k', { unchanged: true, rev: 'r9', expiresInS: { k_tok: 5 } }), null, 'a stale rev is not usable');
    assert.ok(kr.tokenSecondsLeft('k_tok') > 500, 'and its time is not taken');
});

test('token times: only numbers from 0 to a day count', () => {
    setup();
    const kr = window.keyring;
    for (const bad of [-1, 86401, NaN, Infinity, '600', null, undefined, {}]) {
        kr.tokenEndsAt.clear();
        kr.remember('k' + String(bad), { entries: [{ ...TOKEN, expiresInS: bad }], rev: 'r1' });
        assert.equal(kr.tokenSecondsLeft('k_tok'), null, `expiresInS ${String(bad)} is ignored`);
    }
    kr.remember('k0', { entries: [{ ...TOKEN, expiresInS: 0 }], rev: 'r1' });
    assert.equal(kr.tokenSecondsLeft('k_tok'), 0);
    kr.remember('kd', { entries: [{ ...TOKEN, expiresInS: 86400 }], rev: 'r1' });
    assert.equal(kr.tokenSecondsLeft('k_tok'), 86400);
    kr.remember('kn', { entries: [{ ...TOKEN, id: 'k_t2' }, { ...TOKEN, kind: 'saved_connection', id: 'k_rdp' }], rev: 'r1' });
    assert.equal(kr.tokenSecondsLeft('k_rdp'), null, 'only token entries are timed');
});

test('token times: an expired token reads 0 and keeps the server\'s proof foothold; a live one keeps its route\'s', () => {
    setup();
    const kr = window.keyring;
    kr.remember('k', { entries: [TOKEN], rev: 'r1' });
    assert.equal(kr.tokenProofs.get('k_tok'), 'jack_comms_port', 'the live route names the proof');
    kr.remember('k2', { entries: [{ ...EXPIRED, proofFoothold: undefined }], rev: 'r2' });
    assert.equal(kr.tokenSecondsLeft('k_tok'), 0);
    assert.equal(kr.tokenProofs.get('k_tok'), 'jack_comms_port', 'an expired row with no proofFoothold keeps the earlier one');
    const fresh = new Keyring();
    fresh.remember('k', { entries: [{ ...EXPIRED, proofFoothold: 'ap_lobby' }], rev: 'r1' });
    assert.equal(fresh.tokenProofs.get('k_tok'), 'ap_lobby');
});

test('token times: a held token session\'s timer is told the server\'s figure, from a full and an unchanged answer', () => {
    setup();
    const kr = window.keyring;
    kr.remember('k', { entries: [{ ...TOKEN, sessionHeld: true }], rev: 'r1' });
    kr.remember('k', { unchanged: true, rev: 'r1', expiresInS: { k_tok: 300 } });
    assert.deepEqual(expiryNotes, [['lena_pc', 600], ['lena_pc', 300]]);
    kr.remember('k2', { entries: [TOKEN], rev: 'r2' });
    kr.remember('k3', { entries: [{ ...EXPIRED, sessionHeld: true }], rev: 'r3' });
    assert.equal(expiryNotes.length, 2, 'not held, or expired: no note');
    window.pcSessions.noteTokenExpiry = () => { throw new Error('boom'); };
    assert.doesNotThrow(() => kr.remember('k4', { entries: [{ ...TOKEN, sessionHeld: true }], rev: 'r4' }), 'a failing timer never breaks the answer');
    window.pcSessions = null;
    assert.doesNotThrow(() => kr.remember('k5', { entries: [{ ...TOKEN, sessionHeld: true }], rev: 'r5' }));
});

// ── Which screens show a token ──────────────────────────────────────────────────────────────

test('8.1 a live token shows only on the screen reached through its proof foothold', () => {
    const kr = new Keyring();
    const on = (opts) => kr.screenEntries([TOKEN, PW], { pcId: 'lena_pc', ...opts }).map(e => e.id);
    assert.deepEqual(on({ screen: SCREEN_FOOTHOLD, foothold: 'jack_comms_port' }), ['k_tok', 'k_cap']);
    assert.deepEqual(on({ screen: SCREEN_FOOTHOLD, foothold: 'ap_lobby' }), ['k_cap'], 'another foothold reaching the PC');
    assert.deepEqual(on({ screen: SCREEN_FOOTHOLD }), ['k_cap'], 'a from screen (no foothold)');
    assert.deepEqual(on({ screen: SCREEN_KEYBOARD }), ['k_cap'], 'the keyboard');
    assert.deepEqual(on({ screen: SCREEN_KEYBOARD, foothold: 'jack_comms_port' }), ['k_cap'], 'the keyboard never, even named a foothold');
    assert.deepEqual(kr.screenEntries([{ ...TOKEN, forThisPc: false }], { screen: SCREEN_FOOTHOLD, foothold: 'jack_comms_port' }), [],
        'a token for another PC');
    assert.deepEqual(kr.screenEntries([{ ...TOKEN, routes: [] }], { screen: SCREEN_FOOTHOLD, foothold: 'jack_comms_port' }), [],
        'a live token with no route (the foothold cannot reach the PC)');
    assert.deepEqual(kr.screenEntries([{ ...TOKEN, accepted: false }], { screen: SCREEN_FOOTHOLD, foothold: 'jack_comms_port' }).map(e => e.id),
        ['k_tok'], 'a refused token stays, greyed by the screen');
});

test('8.1 an expired token shows greyed only on its proof foothold\'s screen, by proofFoothold or an earlier answer', () => {
    const kr = new Keyring();
    const at = (entry, foothold) => kr.screenEntries([entry], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD, foothold }).map(e => e.id);
    assert.deepEqual(at(EXPIRED, 'jack_comms_port'), ['k_tok'], 'the server names the proof (survives a reload)');
    assert.deepEqual(at(EXPIRED, 'ap_lobby'), [], 'another foothold');
    const bare = { ...EXPIRED, proofFoothold: undefined };
    assert.deepEqual(at(bare, 'jack_comms_port'), [], 'no proofFoothold and no earlier answer: not shown');
    kr.remember('k', { entries: [TOKEN], rev: 'r1' });
    assert.deepEqual(at(bare, 'jack_comms_port'), ['k_tok'], 'an earlier answer this page listed its proof');
    assert.deepEqual(at(bare, 'ap_lobby'), []);
});

test('8.1 keyringForScreen passes the screen\'s foothold: the token reaches the remote screen through its proof only', async () => {
    setup();
    const keyboard = await keyringForScreen('lena_pc');
    assert.deepEqual(keyboard.list.map(e => e.id), [], 'the keyboard');
    const proof = await keyringForScreen('lena_pc', { foothold: 'jack_comms_port' });
    assert.deepEqual(proof.list.map(e => e.id), ['k_tok']);
    const other = await keyringForScreen('lena_pc', { foothold: 'ap_lobby' });
    assert.deepEqual(other.list.map(e => e.id), [], 'another foothold');
    const from = await keyringForScreen('lena_pc', { from: 'jack_comms_port' });
    assert.deepEqual(from.list.map(e => e.id), [], 'a from screen never shows a token, even one named like the proof');
    assert.deepEqual(calls.map(c => c.slice(1, 4)), [['lena_pc', null, null], ['lena_pc', 'jack_comms_port', null],
        ['lena_pc', 'ap_lobby', null], ['lena_pc', null, 'jack_comms_port']]);
});

test('8.1 the real remote screen through the drop box lays the token out on Lena\'s line', async () => {
    setup();
    const links = new NetworkLinks();
    links.load([{ id: 'jack_comms_port', via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port',
        sourceId: 'comms_port', network: { id: 'office_lan', name: 'Harbour office LAN' } }], ['comms_port']);
    window.networkLinks = links;
    links.open('jack_comms_port');
    window.startNetworkViewMinigame = () => {};
    window.capturedSignIns = () => [];
    const scene = { _sceneType: 'password', cleanup() {}, layouts: [], closeByPlayer() {},
        setRemoteAccounts(info) { this.layouts.push(info); return true; }, setKeyringEntries() { return true; } };
    window.MinigameFramework = { mainGameScene: {}, currentMinigame: null,
        startMinigame(type, c, params) { Object.assign(scene, { params }); this.currentMinigame = scene; return scene; }, endMinigame() {} };
    await openRemoteSignIn({ id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', remoteSignIn: true }, 'jack_comms_port');
    assert.deepEqual(scene.layouts[0].keyring.map(e => e.id), ['k_tok']);
});

// ── Find toasts ─────────────────────────────────────────────────────────────────────────────

test('find toasts: a new token toasts its line; with a capture log held, the capture log wording', async () => {
    setup();
    const kr = window.keyring;
    let list = [{ entries: [PW], rev: 'r0' }, { entries: [PW, TOKEN], rev: 'r1' }];
    keyringAnswer = () => list.shift();
    await kr.prime(); await settle();
    await kr.refresh(); await settle();
    assert.deepEqual(alerts.map(a => a[0]), ['Session token captured: HB-FIN-02 sign-in token for Lena Fox on HB-FIN-02.']);
    assert.equal(alerts[0][1], 'info');

    setup();
    window.inventory = { items: [{ scenarioData: { id: 'capture_log', type: 'capture_log', holds: { captures: true } } }] };
    const kr2 = window.keyring;
    list = [{ entries: [], rev: 'r0' }, { entries: [TOKEN], rev: 'r1' }];
    keyringAnswer = () => list.shift();
    await kr2.prime(); await settle();
    await kr2.refresh(); await settle();
    assert.deepEqual(alerts.map(a => a[0]), ['New in your capture log: HB-FIN-02 sign-in token (session token for Lena Fox).']);
});

test('find toasts: a token turning expired is not a new find', async () => {
    setup();
    const kr = window.keyring;
    const list = [{ entries: [TOKEN], rev: 'r0' }, { entries: [EXPIRED], rev: 'r1' }];
    keyringAnswer = () => list.shift();
    await kr.prime(); await settle();
    await kr.refresh(); await settle();
    assert.equal(alerts.length, 0);
});

// ── The sign-in screen's token button (8.1) ─────────────────────────────────────────────────

function tokenScreen(entry) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.playUISound = () => {};
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: "Lena's PC", type: 'item',
        signIn: {
            pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current: null,
            remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' },
            host: 'HB-FIN-02', captured: [], capturedLoading: true, preselect: 'lfox'
        },
        postitNote: '', showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    mg.setRemoteAccounts({ picker: 'accounts', host: 'HB-FIN-02', captured: [],
        tiles: [{ username: 'lfox', displayName: 'Lena Fox' }], keyring: [entry] });
    document.querySelector('.signin-tile[data-username="lfox"]')?.click();
    return mg;
}
const credButton = () => document.querySelector('#signin-ways .signin-cred[data-cred-id="k_tok"]');
const refusedLine = () => document.querySelector('#signin-ways .signin-cred-refused')?.textContent ?? null;
const screenMessage = () => document.querySelector('#signin-message').textContent;

test('8.1 a live token: Lena\'s line has "Connect with {label}", tagged Token, and it posts by the proof foothold', async () => {
    setup();
    const posts = [];
    window.ApiClient.loginWithCredential = async (pcId, id, route) => { posts.push([pcId, id, route]); return {
        success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'token', label: LABEL,
        remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02', expiresInS: 240, endedPcIds: [] }; };
    const mg = tokenScreen(TOKEN);
    const b = credButton();
    assert.ok(b, 'the token button is drawn');
    assert.equal(b.textContent, `Connect with ${LABEL}`);
    assert.equal(b.getAttribute('aria-disabled'), null);
    assert.equal(refusedLine(), null);
    assert.deepEqual([...document.querySelectorAll('.signin-tile[data-username="lfox"] .signin-tag')].map(t => t.textContent), ['Token']);
    assert.deepEqual(mg.getTestState().signIn.tiles[0].credentials, [{ id: 'k_tok', kind: 'token', label: LABEL, accepted: true, expired: false }]);
    b.click();
    await settle();
    assert.deepEqual(posts, [['lena_pc', 'k_tok', { foothold: 'jack_comms_port' }]]);
});

test('8.1 an expired token is greyed with "{label} has expired." and posts nothing', async () => {
    setup();
    let posted = 0;
    window.ApiClient.loginWithCredential = async () => { posted++; return {}; };
    const mg = tokenScreen(EXPIRED);
    const b = credButton();
    assert.equal(b.getAttribute('aria-disabled'), 'true');
    assert.equal(refusedLine(), 'HB-FIN-02 sign-in token has expired.');
    assert.equal(mg.getTestState().signIn.tiles[0].credentials[0].expired, true);
    b.click();
    await settle();
    assert.equal(posted, 0, 'no POST');
    assert.equal(screenMessage(), 'HB-FIN-02 sign-in token has expired.');
});

test('8.1 a token the policy refuses is greyed with the token short line and posts nothing', async () => {
    setup();
    let posted = 0;
    window.ApiClient.loginWithCredential = async () => { posted++; return {}; };
    tokenScreen({ ...TOKEN, accepted: false });
    assert.equal(credButton().getAttribute('aria-disabled'), 'true');
    assert.equal(refusedLine(), 'HB-FIN-02: no session tokens.');
    credButton().click();
    await settle();
    assert.equal(posted, 0);
    assert.equal(screenMessage(), 'HB-FIN-02 does not accept session tokens.');
});

test('8.1 a token that ran out between the answer and the click: 422 expired greys it with the line', async () => {
    setup();
    let posted = 0;
    window.ApiClient.loginWithCredential = async () => { posted++; throw Object.assign(new Error('x'), { status: 422, body: { expired: true, message: `${LABEL} has expired.` } }); };
    tokenScreen(TOKEN);
    credButton().click();
    await settle();
    assert.equal(posted, 1);
    assert.equal(screenMessage(), 'HB-FIN-02 sign-in token has expired.');
    assert.equal(credButton().getAttribute('aria-disabled'), 'true', 'greyed from now on');
    assert.equal(refusedLine(), 'HB-FIN-02 sign-in token has expired.');
    credButton().click();
    await settle();
    assert.equal(posted, 1, 'a second click posts nothing');
});
