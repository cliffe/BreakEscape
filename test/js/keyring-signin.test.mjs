// Credential keyring slice K3a (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 8.1): the sign-in
// screen's client. In a scenario that declares credentials, the remote screen and the keyboard
// screen merge GET /keyring entries into one tile per account with kind tags; the chosen line
// shows a "ways in" box (a button per usable credential, a refused one greyed, found-password
// lines) above an always-present Password field; a credential sign-in posts the credential id
// with the screen's route and shows 8.5's text for each refusal; the teaching line goes out as a
// toast once per page per kind; the remote screen's third list sits under the same cap; the
// keyboard screen's picker rules (false / accounts / known) hold; the start panel names the saved
// connection; a sign-in answer's endedPcIds reach linkDropped.
// The real password-minigame.js, unlock-system.js, keyring.js, pc-sessions.js, pc-taskbar.js and
// remote-host-text.js run against jsdom.
// Run with: node test/js/keyring-signin.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'keyring-signin-'));
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
    'minigames/container/container-minigame.js', 'minigames/password/password-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const {
    PasswordMinigame, mergeRemoteTiles, mergeKeyboardTiles, keyringTagKind
} = await imp('minigames/password/password-minigame.js');
const { Keyring, entryTagKind, credentialsDeclared, SCREEN_FOOTHOLD, SCREEN_KEYBOARD } = await imp('systems/keyring.js');
const { PcSessions, credentialRefusalReason, routeEndedMessage } = await imp('systems/pc-sessions.js');
const { openLoginSignIn, openRemoteSignIn, keyringForScreen, REMOTE_CAPTURES_WAIT_MS } = await imp('systems/unlock-system.js');
const { NetworkLinks } = await imp('systems/network-links.js');
const { ApiClient: RealApiClient } = await imp('api-client.js');
const text = await imp('utils/remote-host-text.js');
const { credentialSessionLine, titleCredentialLabels, pcTaskbarModel, pcStartPanelHtml } = await imp('utils/pc-taskbar.js');

const OPS_CRACK = JSON.parse(readFileSync(join(here, 'fixtures/ops_crack/answers.json'), 'utf8'));
const q = (sel) => document.querySelector(sel);
const visible = (el) => !!el && el.style.display !== 'none' && !el.hidden;
const messageText = () => q('#signin-message').textContent;
const dataUsernames = () => [...document.querySelectorAll('.signin-tile[data-username]')].map(t => t.dataset.username);
const tagsOf = (el) => [...el.querySelectorAll('.signin-tag')].map(t => t.textContent);
const tileFor = (u) => q(`.signin-tile[data-username="${u}"]`);
const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
const drain = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const refusal = (status, body) => Object.assign(new Error('refused'), { status, body });

// ── Fixtures: keyring entries as GET /keyring serves them (plan 6.2) ─────────────────────────
const LENA = { username: 'lfox', displayName: 'Lena Fox', npcId: 'lena' };
const JAKE = { username: 'jjones', displayName: 'Jake Jones', npcId: 'jake' };
const RDP = { id: 'k_rdp', kind: 'saved_connection', label: 'HB-FIN-02.rdp', account: LENA, host: 'HB-FIN-02', accepted: true, forThisPc: true, connectsTo: 'lena_pc' };
const RDP_REFUSED = { id: 'k_rdp3', kind: 'saved_connection', label: 'HB-FIN-03.rdp', account: LENA, host: 'HB-FIN-03', accepted: false, forThisPc: true, connectsTo: 'lena_pc' };
const LENA_CAPTURED = { id: 'k_cap', kind: 'password', source: 'capture', label: 'Finance (Lena)', account: LENA, password: 'Ledger-Lena-9' };
const JAKE_FOUND = { id: 'k_pw', kind: 'password', source: 'registry', label: 'passwords.txt', account: JAKE, foundIn: 'pw_file' };
const JAKE_CRACKED = { id: 'dana.cracked', kind: 'password', source: 'cracked', label: 'Cracked password', account: JAKE, accepted: true };
const INVITE = { id: 'k_inv', kind: 'assist_invite', label: 'Assist code', account: LENA, host: 'HB-FIN-02', accepted: true, forThisPc: true, connectsTo: 'lena_pc' };
const TILES = [LENA, JAKE].map(a => ({ username: a.username, displayName: a.displayName }));

let calls, alerts, ended, credAnswer, pcSessions, stateEvents;

function setup({ declared = true } = {}) {
    calls = []; alerts = []; ended = []; stateEvents = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameScenario = declared ? { credentialsDeclared: true } : {};
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: (name, data) => stateEvents.push([name, data]), on: () => {} };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.keyring = new Keyring();
    credAnswer = (pcId, id) => ({
        success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential',
        kind: 'saved_connection', label: 'HB-FIN-02.rdp', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02'
    });
    window.ApiClient = {
        loginAccounts: async () => ({ loginAccounts: [], loginPicker: 'accounts', headless: false, host: 'HB-FIN-02' }),
        loginWithCredential: async (pcId, id, opts = {}) => {
            calls.push(['loginWithCredential', pcId, id, opts]);
            return typeof credAnswer === 'function' ? credAnswer(pcId, id, opts) : credAnswer;
        },
        login: async (pcId, fields) => { calls.push(['login', pcId, fields]); return { success: true, npcId: 'jake', username: fields.username, displayName: 'Jake Jones', via: 'password', endedPcIds: [] }; },
        keyring: async (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.foothold ?? null, opts.rev ?? null]); return { entries: [], rev: 'r1' }; },
        get: async (path) => { calls.push(['get', path]); return { secrets: {}, accounts: {} }; },
        network: async () => ({ footholds: [] })
    };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
    pcSessions = new PcSessions();
    window.pcSessions = pcSessions;
    window.networkLinks = new NetworkLinks();
    window.networkLinks.load([], []);
}

// The remote sign-in screen: opens in "Checking...", lays out on the server's answers
function openRemote({ current = null } = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: "Lena's PC", type: 'item',
        signIn: { pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current,
            remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' },
            host: 'HB-FIN-02', captured: [], capturedLoading: true },
        postitNote: '', showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}
const answerRemote = (mg, info = {}) => mg.setRemoteAccounts({ picker: 'accounts', host: 'HB-FIN-02', tiles: TILES, captured: [], keyring: [], ...info });

// The keyboard sign-in screen at a PC in a scenario with credentials
function openKeyboard({ picker = 'accounts', tiles = TILES, keyring = [], keyringFailed = false, accountsFailed = false } = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker, tiles, current: null, keyring, keyringFailed, accountsFailed },
        postitNote: '', showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}

// ── The keyring module ───────────────────────────────────────────────────────────────────────

test('keyring.js: tag kinds, and credentialsDeclared reads only the bootstrap flag', () => {
    assert.equal(entryTagKind(LENA_CAPTURED), 'captured');
    assert.equal(entryTagKind(JAKE_FOUND), 'in_file');
    assert.equal(entryTagKind(RDP), 'saved_connection');
    assert.equal(keyringTagKind(LENA_CAPTURED), 'captured');
    assert.equal(keyringTagKind(JAKE_FOUND), 'in_file');
    assert.equal(keyringTagKind(null), null);
    window.gameScenario = {};
    assert.equal(credentialsDeclared(), false);
    window.gameScenario = { credentialsDeclared: 'yes' };
    assert.equal(credentialsDeclared(), false, 'only a literal true');
    window.gameScenario = { credentialsDeclared: true };
    assert.equal(credentialsDeclared(), true);
});

test('8.1 usable kinds: the keyboard shows passwords only; a foothold screen adds a saved connection for this PC; an invite never shows', () => {
    const kr = new Keyring();
    kr.firstAnswerIds = new Set(['k_pw']);
    const all = [LENA_CAPTURED, JAKE_FOUND, RDP, RDP_REFUSED, INVITE];
    assert.deepEqual(kr.screenEntries(all, { pcId: 'lena_pc', screen: SCREEN_KEYBOARD }).map(e => e.id), ['k_cap', 'k_pw']);
    assert.deepEqual(kr.screenEntries(all, { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }).map(e => e.id), ['k_cap', 'k_pw', 'k_rdp', 'k_rdp3'],
        'the refused saved connection stays, greyed by the screen; the assist invite is never listed');
    assert.deepEqual(kr.screenEntries([{ ...RDP, forThisPc: false, connectsTo: 'other_pc' }], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }), [], 'a connection for another PC is not for this screen');
    assert.deepEqual(kr.screenEntries([{ ...RDP, ended: true }], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }), [], 'an ended connection is dropped');
    assert.deepEqual(kr.screenEntries([{ ...RDP, account: null }], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }), [], 'no account username, no tile');
    assert.deepEqual(kr.screenEntries(null), []);
});

test('8.1 an In file entry waits until its file is opened in this page; the page-start answer shows at once (the reload case)', () => {
    const kr = new Keyring();
    assert.equal(kr.foundVisible(JAKE_FOUND), false, 'not opened yet');
    assert.deepEqual(kr.screenEntries([JAKE_FOUND]), []);
    kr.noteOpened('some_other_file');
    assert.equal(kr.foundVisible(JAKE_FOUND), false, 'another file does not count');
    kr.noteOpened('pw_file');
    assert.equal(kr.foundVisible(JAKE_FOUND), true, 'opened here');
    assert.equal(kr.foundVisible(LENA_CAPTURED), true, 'a captured password needs no file');
    // After a reload the first answer already holds it
    const reloaded = new Keyring();
    reloaded.remember('|keyboard', { entries: [JAKE_FOUND], rev: 'a' }, { primed: true });
    assert.equal(reloaded.foundVisible(JAKE_FOUND), true, 'in the first answer: shown at once, accepted gap');
    const later = { ...JAKE_FOUND, id: 'k_pw2', foundIn: 'pw_file2' };
    reloaded.remember('|keyboard', { entries: [JAKE_FOUND, later], rev: 'b' });
    assert.equal(reloaded.foundVisible(later), false, 'one earned after the first answer still waits for its file');
});

test('R1 m1: a failed prime leaves nothing earned before this page; a screen answer never fixes the reload set', async () => {
    setup();
    const kr = new Keyring();
    window.ApiClient.keyring = async (pcId) => {
        if (pcId === null || pcId === undefined) throw refusal(500, {});
        return { entries: [RDP, JAKE_FOUND], rev: 'r1' };
    };
    assert.equal(await kr.prime(), null, 'the prime swallows the failure');
    const entries = await kr.fetch('lena_pc', { foothold: 'jack_comms_port' });
    assert.deepEqual(entries.map(e => e.id), ['k_rdp', 'k_pw']);
    assert.equal(kr.foundVisible(JAKE_FOUND), false, 'a screen answer does not make the found password visible');
    assert.deepEqual(kr.screenEntries(entries, { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }).map(e => e.id), ['k_rdp']);
    kr.noteOpened('pw_file');
    assert.equal(kr.foundVisible(JAKE_FOUND), true, 'once its file is opened');
    // A screen answer that beats a slow prime does not fix the set either
    const kr2 = new Keyring();
    await kr2.fetch('lena_pc', { foothold: 'jack_comms_port' });
    assert.equal(kr2.foundVisible(JAKE_FOUND), false);
});

test('R1 5: the In file teaching toast is held while the panel is open and shows once when it closes', async () => {
    setup();
    const notif = await imp('systems/notifications.js');
    const realAlert = notif.gameAlert;
    document.body.insertAdjacentHTML('beforeend', '<div id="notification-container"></div>');
    window.gameAlert = realAlert;
    window.MinigameFramework = { currentMinigame: { _ending: false } };
    const lead = 'People save passwords in files.';
    const toasts = () => [...document.querySelectorAll('#notification-container .notification')].filter(el => el.textContent.includes(lead));
    // The sign-in screen (a minigame) is open when the sign-in succeeds
    PasswordMinigame.prototype.teachAfter.call({}, 'in_file', { displayName: 'Jake Jones' });
    PasswordMinigame.prototype.teachAfter.call({}, 'in_file', { displayName: 'Jake Jones' });
    assert.equal(toasts().length, 0, 'held while the panel is open');
    // The panel closes
    window.MinigameFramework.currentMinigame = null;
    await new Promise(r => setTimeout(r, 900));
    assert.equal(toasts().length, 1, 'shown once after the panel closes (the second call was the same page, so no second teach)');
    window.MinigameFramework = undefined;
});

test('R1 m3: a saved connection with no forThisPc is not listed, and a missing accepted is not accepted', () => {
    const kr = new Keyring();
    const unscoped = { ...RDP }; delete unscoped.forThisPc;
    assert.deepEqual(kr.screenEntries([unscoped], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }), [], 'connectsTo alone is not enough');
    assert.deepEqual(kr.screenEntries([{ ...RDP, forThisPc: false }], { pcId: 'lena_pc', screen: SCREEN_FOOTHOLD }), []);
    const noAccepted = { ...RDP }; delete noAccepted.accepted;
    const tiles = mergeRemoteTiles({ accounts: [], captures: [], keyring: [noAccepted], picker: 'known' });
    assert.equal(tiles[0].credentials[0].accepted, false, 'the client never invents an accept');
});

test('R1 live: a connection with no label shows the generic kind wording, never a PC id', () => {
    const noLabel = { ...RDP, label: '' };
    const idLabel = { ...RDP, label: 'ops_pc', connectsTo: 'ops_pc' };
    for (const e of [noLabel, idLabel, { ...RDP, label: undefined }]) {
        const tiles = mergeRemoteTiles({ accounts: [], captures: [], keyring: [e], picker: 'known' });
        assert.equal(tiles[0].credentials[0].label, 'Saved connection');
    }
    const ok = mergeRemoteTiles({ accounts: [], captures: [], keyring: [RDP], picker: 'known' });
    assert.equal(ok[0].credentials[0].label, 'HB-FIN-02.rdp');
});

test('keyring.js: fetch asks with rev and reuses the cached entries on unchanged; a lost rev asks again without it', async () => {
    setup();
    const kr = new Keyring();
    const seen = [];
    let step = 0;
    window.ApiClient.keyring = async (pcId, opts = {}) => {
        seen.push([pcId, opts.foothold ?? null, opts.rev ?? null]);
        step++;
        if (step === 1) return { entries: [RDP], rev: 'r1' };
        if (step === 2) return { unchanged: true, rev: 'r1' };
        if (step === 3) return { unchanged: true, rev: 'stale' };
        return { entries: [RDP, JAKE_FOUND], rev: 'r2' };
    };
    assert.deepEqual((await kr.fetch('lena_pc', { foothold: 'jack_comms_port' })).map(e => e.id), ['k_rdp']);
    assert.deepEqual((await kr.fetch('lena_pc', { foothold: 'jack_comms_port' })).map(e => e.id), ['k_rdp'], 'unchanged gives the cached entries');
    assert.deepEqual(seen[1], ['lena_pc', 'jack_comms_port', 'r1'], 'the second ask carries rev');
    assert.deepEqual((await kr.fetch('lena_pc', { foothold: 'jack_comms_port' })).map(e => e.id), ['k_rdp', 'k_pw'], 'an unchanged for another rev asks again without rev');
    assert.deepEqual(seen[3], ['lena_pc', 'jack_comms_port', null]);
    window.ApiClient.keyring = async () => ({ weird: true });
    await assert.rejects(new Keyring().fetch('x'), /unusable/);
    window.ApiClient.keyring = async () => { throw new Error('down'); };
    await assert.rejects(new Keyring().fetch('x'), /down/);
});

test('keyring.js: the teaching toast is due once per kind per page', () => {
    const kr = new Keyring();
    assert.equal(kr.teachOnce('saved_connection'), true);
    assert.equal(kr.teachOnce('saved_connection'), false);
    assert.equal(kr.teachOnce('in_file'), true);
    assert.equal(kr.teachOnce(''), false);
});

test('api-client.js: keyring and loginWithCredential build the 8.1 requests, and never send relay: false', async () => {
    const sent = [];
    const get = RealApiClient.get, post = RealApiClient.post;
    RealApiClient.get = async (path) => { sent.push(['get', path]); return {}; };
    RealApiClient.post = async (path, body) => { sent.push(['post', path, body]); return {}; };
    try {
        await RealApiClient.keyring('lena_pc', { foothold: 'jack_comms_port', rev: 'r1' });
        await RealApiClient.keyring();
        await RealApiClient.loginWithCredential('lena_pc', 'k_rdp', { foothold: 'jack_comms_port' });
        await RealApiClient.loginWithCredential('hot_desk', 'k_pw');
    } finally { RealApiClient.get = get; RealApiClient.post = post; }
    assert.deepEqual(sent, [
        ['get', '/keyring?pc_id=lena_pc&foothold=jack_comms_port&rev=r1'],
        ['get', '/keyring'],
        ['post', '/login', { pc_id: 'lena_pc', credential: 'k_rdp', foothold: 'jack_comms_port' }],
        ['post', '/login', { pc_id: 'hot_desk', credential: 'k_pw' }]
    ]);
    assert.equal(JSON.stringify(sent).includes('relay'), false);
});

// ── The merge: one tile per account ──────────────────────────────────────────────────────────

test('8.1 the merge gives one tile per account, never per entry, with tags by kind and the entries kept on the tile', () => {
    const merged = mergeRemoteTiles({ picker: 'accounts', tiles: [LENA, JAKE], captured: [],
        keyring: [RDP, RDP_REFUSED, LENA_CAPTURED, JAKE_FOUND] });
    assert.deepEqual(merged.map(t => t.username), ['lfox', 'jjones'], 'two accounts, four entries');
    const lena = merged[0], jake = merged[1];
    assert.deepEqual(lena.kinds, ['saved_connection', 'captured']);
    assert.deepEqual(lena.credentials.map(c => [c.id, c.accepted]), [['k_rdp', true], ['k_rdp3', false]]);
    assert.equal(lena.keyPassword, 'Ledger-Lena-9', 'a captured password the server served fills the field');
    assert.deepEqual(jake.kinds, ['in_file']);
    assert.deepEqual(jake.found.map(f => f.label), ['passwords.txt']);
    assert.deepEqual(jake.credentials, []);
    // The same account from the captured list and the keyring is still one tile
    const both = mergeRemoteTiles({ picker: 'accounts', tiles: [LENA], captured: [{ username: 'lfox', targetId: 'lena', password: 'x' }], keyring: [RDP] });
    assert.equal(both.length, 1);
    assert.deepEqual(both[0].kinds, ['captured', 'saved_connection']);
});

test('8.1 the merge follows the picker rule: accounts drops an unlisted keyring account, known adds it, a typed screen keeps it', () => {
    assert.deepEqual(mergeRemoteTiles({ picker: 'accounts', tiles: [LENA], keyring: [JAKE_FOUND] }).map(t => t.username), ['lfox']);
    assert.deepEqual(mergeRemoteTiles({ picker: 'known', tiles: [LENA], keyring: [JAKE_FOUND] }).map(t => [t.username, t.kinds]), [['lfox', []], ['jjones', ['in_file']]]);
    assert.deepEqual(mergeRemoteTiles({ picker: 'accounts', remoteScreen: 'typed', tiles: [LENA], keyring: [JAKE_FOUND] }).map(t => t.username), ['jjones']);
    assert.deepEqual(mergeRemoteTiles({ picker: 'accounts', tiles: [LENA], keyring: [{ id: 'x', kind: 'password' }, { id: 'y', account: {}, kind: 'password' }] }).map(t => t.username), ['lfox'], 'an entry with no account is ignored');
});

test('8.1 keyboard merge: picker false shows no tiles; accounts tags only the PC\'s own; known adds the unlisted account', () => {
    assert.deepEqual(mergeKeyboardTiles({ picker: false, tiles: TILES, keyring: [JAKE_FOUND] }), [], 'false: the typed form stays');
    assert.deepEqual(mergeKeyboardTiles({ picker: 'accounts', tiles: [TILES[0]], keyring: [JAKE_FOUND, { ...LENA_CAPTURED }] }).map(t => [t.username, t.kinds]),
        [['lfox', ['captured']]], 'accounts: the unlisted Jake is dropped');
    assert.deepEqual(mergeKeyboardTiles({ picker: 'known', tiles: [TILES[0]], keyring: [JAKE_FOUND] }).map(t => [t.username, t.kinds]),
        [['lfox', []], ['jjones', ['in_file']]], 'known: the unlisted account is added, tagged');
});

// ── The remote screen ────────────────────────────────────────────────────────────────────────

test('8.1 remote screen: one tile per account, tags by kind in the 8.5 words, the two-tag limit with +N', () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP, JAKE_FOUND] });
    assert.deepEqual(dataUsernames(), ['lfox', 'jjones']);
    assert.deepEqual(tagsOf(tileFor('lfox')), ['Saved']);
    assert.deepEqual(tagsOf(tileFor('jjones')), ['In file']);
    assert.equal(document.querySelectorAll('.signin-other').length, 1);
    assert.match(tileFor('lfox').title, /Saved connection/, 'the full kind name is in the title');
    assert.match(tileFor('jjones').title, /Password in a file/);
    // Three kinds on one account: the first and "+2"
    const mg2 = openRemote();
    answerRemote(mg2, { keyring: [LENA_CAPTURED, RDP, { ...JAKE_FOUND, account: LENA }] });
    assert.deepEqual(tagsOf(tileFor('lfox')), ['Captured', '+2']);
    // Short window: one badge per glyph group
    const badges = tileFor('lfox').querySelectorAll('.signin-badge');
    assert.equal(badges.length, 2, 'key and plug groups');
    assert.ok([...badges].every(b => /\/icons\/badge-(key|plug)\.png$/.test(b.getAttribute('src'))));
    assert.equal(tileFor('lfox').querySelector('.signin-badges').getAttribute('aria-label'), 'Captured password, Saved connection, Password in a file');
});

test('8.1 choosing an account shows its ways in: a button per credential with "Connect with" kept whole, found lines, and the Password field always', () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP, RDP_REFUSED, LENA_CAPTURED, JAKE_FOUND] });
    assert.equal(q('#signin-ways').hidden, true, 'no ways box before an account is chosen');
    tileFor('lfox').click();
    const ways = q('#signin-ways');
    assert.equal(ways.hidden, false);
    const buttons = [...ways.querySelectorAll('button.signin-cred')];
    assert.deepEqual(buttons.map(b => [b.querySelector('.signin-cred-fixed').textContent, b.querySelector('.signin-cred-label').textContent]),
        [['Connect with', 'HB-FIN-02.rdp'], ['Connect with', 'HB-FIN-03.rdp']]);
    assert.match(buttons[0].title, /^Saved connection: HB-FIN-02\.rdp\. /, 'the title carries the full kind and the teaching line');
    assert.match(buttons[0].title, /opening it signs you in as Lena Fox/);
    assert.equal(buttons[0].getAttribute('aria-disabled'), null);
    assert.equal(visible(q('#password-field')), true, 'Password is always shown');
    // R1 m4: the ways in sit on the chosen line, after the chosen account's name and before the fields
    const order = (a, b) => !!(q(a).compareDocumentPosition(q(b)) & 4);
    assert.equal(order('.signin-selected-row', '#signin-ways'), true, 'ways come after the chosen account row');
    assert.equal(order('#signin-ways', '#signin-username-row'), true, 'and before the fields');
    assert.equal(order('#signin-ways-more', '#signin-username-row'), true);
    assert.equal(q('#password-field').value, 'Ledger-Lena-9', 'a captured password the server served fills it');
    assert.equal(ways.querySelectorAll('.signin-found').length, 0);
    // Jake: no buttons, the found-password lines
    q('#signin-change').click();
    tileFor('jjones').click();
    assert.equal(q('#signin-ways').querySelectorAll('button.signin-cred').length, 0);
    assert.equal(q('#signin-ways .signin-found-lead').textContent, 'Type the password from');
    assert.equal(q('#signin-ways .signin-found-label').textContent, 'passwords.txt', 'the file name alone on its own line');
    assert.equal(q('#password-field').value, '');
    assert.equal(visible(q('#password-field')), true);
    // An account with no ways in has no box
    q('#signin-change').click();
    const mg2 = openRemote();
    answerRemote(mg2, { keyring: [RDP] });
    tileFor('jjones').click();
    assert.equal(q('#signin-ways').hidden, true);
});

test('8.1 a refused credential is greyed with aria-disabled (not disabled), its short reason under it; clicking it signs nothing in and shows the full reason', async () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP, RDP_REFUSED] });
    tileFor('lfox').click();
    const ways = [...document.querySelectorAll('#signin-ways .signin-cred-way')];
    assert.equal(ways.length, 2);
    const grey = ways[1].querySelector('button');
    assert.equal(grey.getAttribute('aria-disabled'), 'true');
    assert.equal(grey.disabled, false, 'aria-disabled, so the click still explains');
    assert.equal(ways[1].querySelector('.signin-cred-refused').textContent, 'HB-FIN-03: type the password.');
    assert.ok(ways[0].querySelector('.signin-cred-refused') === null);
    assert.equal(messageText(), '', 'the error line stays empty under a policy refusal shown by the button');
    grey.click();
    await settle();
    assert.equal(calls.filter(c => c[0] === 'loginWithCredential').length, 0, 'no sign-in request');
    assert.equal(messageText(), 'HB-FIN-03 always asks for the password, so a saved one is ignored.');
    assert.equal(q('#signin-message').dataset.kind, 'error');
});

test('8.1 credential sign-in posts the credential id with the screen\'s route, and keeps kind and label on the session', async () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP] });
    tileFor('lfox').click();
    q('.signin-cred').click();
    await settle();
    assert.deepEqual(calls.find(c => c[0] === 'loginWithCredential'), ['loginWithCredential', 'lena_pc', 'k_rdp', { foothold: 'jack_comms_port' }]);
    const s = pcSessions.get('lena_pc');
    assert.equal(s.via, 'credential');
    assert.equal(s.kind, 'saved_connection');
    assert.equal(s.label, 'HB-FIN-02.rdp');
    assert.equal(mg.gameResult?.success, true);
    assert.equal(mg.gameResult.signIn.via, 'credential');
    assert.equal(JSON.stringify(mg.getTestState()).includes('Ledger'), false);
});

test('8.1 the teaching line is a toast, once per page per kind, after the first success; a typed in-file sign-in teaches in_file', async () => {
    setup();
    const teachSaved = text.teachLine('saved_connection', { displayName: 'Lena Fox' });
    assert.match(teachSaved, /^The password is saved inside this file/);
    let mg = openRemote();
    answerRemote(mg, { keyring: [RDP] });
    assert.equal(alerts.length, 0, 'never drawn on the screen or toasted before use');
    tileFor('lfox').click();
    q('.signin-cred').click();
    await settle();
    assert.deepEqual(alerts.map(a => a[0]), [teachSaved]);
    assert.equal(alerts[0][1], 'info');
    assert.equal(alerts[0][4].plainText, true);
    assert.equal(alerts[0][4].whole, true, 'R2 t3: the teaching toast wraps whole');
    // A second success in the same page: no second toast
    mg = openRemote();
    answerRemote(mg, { keyring: [RDP] });
    tileFor('lfox').click();
    q('.signin-cred').click();
    await settle();
    assert.equal(alerts.length, 1, 'once per page for the kind');
    // Typed sign-in to Jake, whose password was found in a file, teaches in_file
    mg = openRemote();
    answerRemote(mg, { keyring: [JAKE_FOUND] });
    tileFor('jjones').click();
    q('#password-field').value = 'Cedar-Jake-4';
    q('#submit-password').click();
    await settle();
    assert.equal(alerts.length, 2);
    assert.match(alerts[1][0], /^People save passwords in files/);
});

for (const [name, err, line] of [
    ['wrongPc', refusal(422, { wrongPc: true, message: 'x' }), 'This connection is for another PC.'],
    ['kindRefused', refusal(422, { kindRefused: 'saved_connection', message: 'x' }), 'HB-FIN-02 always asks for the password, so a saved one is ignored.'],
    ['kindRefused for an invite', refusal(422, { kindRefused: 'assist_invite' }), 'HB-FIN-02 does not allow remote assistance.'],
    ['notPermitted', refusal(422, { notPermitted: true }), "That account can't sign in on HB-FIN-02."],
    ['lockedOut', refusal(422, { lockedOut: true }), 'HB-FIN-02 has locked this account.'],
    ['ended', refusal(422, { ended: true }), 'Lena Fox ended the remote assist.'],
    ['remoteBlocked', refusal(422, { remoteBlocked: true }), 'Remote sign-in is off on HB-FIN-02.'],
    ['the generic 422', refusal(422, { message: 'Incorrect username or password' }), 'HB-FIN-02.rdp no longer works.'],
    ['a 403 not_responding', refusal(403, { reason: 'not_responding' }), 'HB-FIN-02 is not responding.'],
    ['a plain 403', refusal(403, {}), "HB-FIN-02 can't be reached over this link."]
]) {
    test(`8.5 credential refusal text: ${name}`, async () => {
        setup();
        credAnswer = () => { throw err; };
        const mg = openRemote();
        answerRemote(mg, { keyring: [RDP] });
        tileFor('lfox').click();
        q('.signin-cred').click();
        await settle();
        assert.equal(messageText(), line);
        assert.equal(pcSessions.get('lena_pc'), null, 'no session on a refusal');
        assert.equal(alerts.length, 0, 'no teaching toast on a refusal');
        assert.notEqual(mg.gameResult?.success, true);
    });
}

test('8.5 reasons: each server flag maps to its reason; the generic body means the credential no longer signs in', () => {
    assert.equal(credentialRefusalReason({}), 'no_longer_works');
    assert.equal(credentialRefusalReason({ wrongPc: true }), 'wrong_pc');
    assert.equal(credentialRefusalReason({ kindRefused: 'saved_connection' }), 'kind_refused');
    assert.equal(credentialRefusalReason({ notPermitted: true }), 'not_permitted');
    assert.equal(credentialRefusalReason({ lockedOut: true }), 'locked_out');
    assert.equal(credentialRefusalReason({ ended: true }), 'ended');
    assert.equal(credentialRefusalReason({ remoteBlocked: true }), 'remote_blocked');
    assert.equal(text.credentialRefusalLine('mystery', {}), null);
});

test('8.1 a server kindRefused greys the button from then on and shows the full line', async () => {
    setup();
    credAnswer = () => { throw refusal(422, { kindRefused: 'saved_connection' }); };
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP] });
    tileFor('lfox').click();
    assert.equal(q('.signin-cred').getAttribute('aria-disabled'), null);
    q('.signin-cred').click();
    await settle();
    assert.equal(q('.signin-cred').getAttribute('aria-disabled'), 'true');
    assert.equal(q('.signin-cred-refused').textContent, 'HB-FIN-02: type the password.');
    assert.equal(messageText(), 'HB-FIN-02 always asks for the password, so a saved one is ignored.');
});

test('8.1 loading: a failed /keyring shows the screen without keyring entries and its own line; two failed lists give the one combined line', () => {
    setup();
    let mg = openRemote();
    answerRemote(mg, { keyring: [], keyringFailed: true });
    assert.equal(messageText(), 'Your found sign-ins could not be loaded.');
    assert.deepEqual(dataUsernames(), ['lfox', 'jjones'], 'the PC tiles still show');
    mg = openRemote();
    answerRemote(mg, { keyringFailed: true, capturedFailed: true });
    assert.equal(messageText(), text.remoteBothFailedLine('HB-FIN-02'));
    mg = openRemote();
    answerRemote(mg, { keyringFailed: true, accountsFailed: true });
    assert.equal(messageText(), text.remoteBothFailedLine('HB-FIN-02'));
    mg = openRemote();
    answerRemote(mg, { capturedFailed: true });
    assert.equal(messageText(), text.REMOTE_CAPTURES_FAILED_TEXT, 'one failure keeps its own K0 line');
});

test('8.1 the test state carries the tiles\' ways in and the keyring counts, never a password', () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [RDP, RDP_REFUSED, LENA_CAPTURED, JAKE_FOUND] });
    const st = mg.getTestState().signIn;
    assert.deepEqual(st.tiles[0].credentials.map(c => [c.id, c.accepted]), [['k_rdp', true], ['k_rdp3', false]]);
    assert.deepEqual(st.tiles[1].found, ['passwords.txt']);
    assert.deepEqual(st.keyring, { entries: 4, failed: false });
});

test('author text goes in as text: a label with markup is never parsed', () => {
    setup();
    const mg = openRemote();
    answerRemote(mg, { keyring: [{ ...RDP, label: '<img src=x onerror=1>.rdp' }, { ...JAKE_FOUND, label: '<b>x</b>.txt' }] });
    tileFor('lfox').click();
    assert.equal(q('#signin-ways img'), null);
    assert.equal(q('.signin-cred-label').textContent, '<img src=x onerror=1>.rdp');
    q('#signin-change').click();
    tileFor('jjones').click();
    assert.equal(q('#signin-ways b'), null);
    assert.equal(q('.signin-found-label').textContent, '<b>x</b>.txt');
});

// ── The keyboard screen ──────────────────────────────────────────────────────────────────────

test('8.1 keyboard screen, picker accounts: the PC\'s own tiles are tagged; an unlisted keyring account is dropped', () => {
    setup();
    openKeyboard({ picker: 'accounts', tiles: [TILES[0]], keyring: [LENA_CAPTURED, JAKE_FOUND] });
    assert.deepEqual(dataUsernames(), ['lfox']);
    assert.deepEqual(tagsOf(tileFor('lfox')), ['Captured']);
    tileFor('lfox').click();
    assert.equal(q('#password-field').value, 'Ledger-Lena-9');
    assert.equal(q('#signin-ways').hidden, true, 'a captured password has no button');
});

test('8.1 keyboard screen, picker known: the unlisted keyring account is added, tagged, with its found line', () => {
    setup();
    openKeyboard({ picker: 'known', tiles: [TILES[0]], keyring: [JAKE_FOUND] });
    const names = [...document.querySelectorAll('.signin-tile:not(.signin-other) .signin-username')].map(e => e.textContent);
    assert.deepEqual(names, ['lfox', 'jjones']);
    assert.deepEqual(tagsOf(tileFor('jjones')), ['In file']);
    tileFor('jjones').click();
    assert.equal(q('.signin-found-label').textContent, 'passwords.txt');
});

test('D50: the chosen-account line names the kinds of knowledge, in the same words at the keyboard and remotely', () => {
    setup();
    openKeyboard({ picker: 'known', tiles: [TILES[0]], keyring: [LENA_CAPTURED, JAKE_FOUND] });
    tileFor('lfox').click();
    const atKeyboard = q('#signin-selected').textContent;
    assert.equal(atKeyboard, 'Lena Fox (lfox), Captured password');
    tileFor('jjones').click();
    assert.match(q('#signin-selected').textContent, /\(jjones\), Password in a file$/);
    const mg = openRemote();
    answerRemote(mg, { keyring: [LENA_CAPTURED] });
    tileFor('lfox').click();
    assert.equal(q('#signin-selected').textContent, atKeyboard, 'the remote screen uses the same wording');
    // The shared helper: no kinds leaves the plain name line, several are joined in order
    assert.equal(text.chosenAccountLine({ username: 'sokafor', displayName: 'Sam Okafor', kinds: [] }), 'Sam Okafor (sokafor)');
    assert.equal(text.chosenAccountLine({ username: 'lfox', displayName: 'Lena Fox', kinds: ['captured', 'saved_connection'] }),
        'Lena Fox (lfox), Captured password, Saved connection');
    assert.equal(text.chosenAccountLine(null), '');
});

test('8.1 keyboard screen, picker false: the typed form stays and no keyring tile shows', () => {
    setup();
    openKeyboard({ picker: false, tiles: [], keyring: [LENA_CAPTURED, JAKE_FOUND] });
    assert.equal(document.querySelectorAll('.signin-tile').length, 0);
    assert.equal(visible(q('#signin-username-row')), true);
    assert.equal(visible(q('#signin-form')), true);
});

test('8.1 keyboard screen without credentials: no tags, no ways box content, unchanged tiles', () => {
    setup({ declared: false });
    openKeyboard({ picker: 'accounts', tiles: TILES, keyring: [] });
    assert.deepEqual(dataUsernames(), [], 'plain keyboard tiles carry no data-username');
    assert.ok(document.querySelector('.signin-tag') === null);
    assert.equal(document.querySelectorAll('.signin-tile:not(.signin-other)').length, 2);
    document.querySelector('.signin-tile').click();
    assert.equal(q('#signin-ways').hidden, true);
    assert.equal(messageText(), '');
});

test('8.1 keyboard failure lines: /keyring alone, and /keyring with /login_accounts', () => {
    setup();
    openKeyboard({ keyringFailed: true });
    assert.equal(messageText(), 'Your found sign-ins could not be loaded.');
    openKeyboard({ keyringFailed: true, accountsFailed: true });
    assert.equal(messageText(), "This PC's sign-in details could not be loaded.");
});

test('8.1 a late keyring answer redraws the keyboard row in place, keeping the chosen account', () => {
    setup();
    const mg = openKeyboard({ picker: 'accounts', tiles: TILES, keyring: [] });
    document.querySelector('.signin-tile').click();
    assert.equal(mg.signInState.selected, 'lfox');
    mg.setKeyringEntries({ keyring: [LENA_CAPTURED, RDP], keyringFailed: false });
    assert.equal(mg.signInState.selected, 'lfox', 'the choice survives');
    assert.deepEqual(tagsOf(tileFor('lfox')), ['Captured'], 'a password-only keyboard: the saved connection is dropped');
    assert.equal(q('#password-field').value, '', 'a late answer never writes into the field the player is on');
});

// ── The remote screen's loading: the third list under the cap ────────────────────────────────

const LENA_ROW = { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', remoteSignIn: true };
const FOOTHOLD = { id: 'jack_comms_port', via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port',
    sourceId: 'comms_port', network: { id: 'office_lan', name: 'Harbour office LAN' } };

function sceneStub() {
    const scene = { _sceneType: 'password', cleanup() {}, layouts: [], params: null, keyringSet: [],
        setRemoteAccounts(info) { this.layouts.push(info); return true; },
        setKeyringEntries(info) { this.keyringSet.push(info); return true; },
        closeByPlayer() {} };
    window.MinigameFramework = {
        mainGameScene: {}, currentMinigame: null,
        startMinigame(type, c, params) { Object.assign(scene, { params }); this.currentMinigame = scene; return scene; },
        endMinigame() {}
    };
    return scene;
}
function openLinks() {
    const links = new NetworkLinks();
    links.load([FOOTHOLD], ['comms_port']);
    window.networkLinks = links;
    links.open('jack_comms_port');
    window.startNetworkViewMinigame = () => {};
    window.capturedSignIns = () => [];
}

test('8.1 loading: the remote screen asks for the keyring with its route and lays out once, with the third list', async () => {
    setup();
    openLinks();
    const scene = sceneStub();
    window.ApiClient.keyring = async (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.foothold ?? null]); return { entries: [RDP, JAKE_FOUND], rev: 'r1' }; };
    window.keyring.noteOpened('pw_file');
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    assert.deepEqual(calls.filter(c => c[0] === 'keyring'), [['keyring', 'lena_pc', 'jack_comms_port']]);
    assert.equal(scene.layouts.length, 1, 'one layout once all three lists answered');
    assert.deepEqual(scene.layouts[0].keyring.map(e => e.id), ['k_rdp', 'k_pw']);
    assert.equal(scene.layouts[0].keyringFailed, false);
    assert.equal(scene.layouts[0].pending, false);
});

test('8.1 loading: an In file entry not yet opened is filtered out of the remote list', async () => {
    setup();
    openLinks();
    const scene = sceneStub();
    window.ApiClient.keyring = async () => ({ entries: [RDP, JAKE_FOUND], rev: 'r1' });
    await window.keyring.prime();
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    // The page-start answer (the prime) is the reload set, so the file need not be opened; a later one waits
    assert.deepEqual(scene.layouts[0].keyring.map(e => e.id), ['k_rdp', 'k_pw']);
    scene.layouts.length = 0;
    window.ApiClient.keyring = async () => ({ entries: [RDP, JAKE_FOUND, { ...JAKE_FOUND, id: 'k_pw2', foundIn: 'later_file' }], rev: 'r2' });
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    assert.deepEqual(scene.layouts[0].keyring.map(e => e.id), ['k_rdp', 'k_pw'], 'k_pw2 waits for later_file');
});

test('8.1 loading: a slow /keyring holds "Checking..." to the cap, then the late answer lays out again', async () => {
    setup();
    openLinks();
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const scene = sceneStub();
        let answer;
        window.ApiClient.keyring = () => new Promise((ok) => { answer = ok; });
        const opening = openRemoteSignIn(LENA_ROW, 'jack_comms_port');
        await drain();
        assert.deepEqual(scene.layouts, [], 'the other two answered; still waiting for the third');
        mock.timers.tick(REMOTE_CAPTURES_WAIT_MS);
        assert.equal(scene.layouts.length, 1);
        assert.equal(scene.layouts[0].pending, true);
        assert.deepEqual(scene.layouts[0].keyring, []);
        answer({ entries: [RDP], rev: 'r1' });
        await opening;
        assert.equal(scene.layouts.length, 2);
        assert.equal(scene.layouts[1].pending, false);
        assert.deepEqual(scene.layouts[1].keyring.map(e => e.id), ['k_rdp']);
    } finally { mock.timers.reset(); }
});

test('8.1 loading: a failed /keyring reaches the screen as keyringFailed with no entries', async () => {
    setup();
    openLinks();
    const scene = sceneStub();
    window.ApiClient.keyring = async () => { throw refusal(500, {}); };
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    assert.equal(scene.layouts.length, 1);
    assert.equal(scene.layouts[0].keyringFailed, true);
    assert.deepEqual(scene.layouts[0].keyring, []);
});

test('8.1 loading: in a scenario without credentials the remote screen never asks for the keyring and its layout has no keyring field', async () => {
    setup({ declared: false });
    openLinks();
    const scene = sceneStub();
    await openRemoteSignIn(LENA_ROW, 'jack_comms_port');
    assert.equal(calls.some(c => c[0] === 'keyring'), false);
    assert.equal('keyring' in scene.layouts[0], false);
    assert.equal('keyringFailed' in scene.layouts[0], false);
    assert.deepEqual(await keyringForScreen('lena_pc'), { declared: false, list: [], failed: false });
});

test('8.1 loading: the keyboard screen fetches /keyring beside /login_accounts, passes password entries only, and a late answer redraws', async () => {
    setup();
    const scene = sceneStub();
    window.ApiClient.loginAccounts = async (pcId) => { calls.push(['loginAccounts', pcId]); return { loginAccounts: TILES, loginPicker: 'accounts', headless: false, host: 'HB-DESK-01' }; };
    window.ApiClient.keyring = async (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.foothold ?? null]); return { entries: [LENA_CAPTURED, JAKE_FOUND, RDP], rev: 'r1' }; };
    const lockable = { scenarioData: { id: 'hot_desk', name: 'Hot desk PC', type: 'pc', lockType: 'login', loginPicker: 'accounts', loginAccounts: [] } };
    await window.keyring.prime();
    calls.length = 0;
    await openLoginSignIn(lockable);
    assert.deepEqual(calls.filter(c => c[0] === 'keyring'), [['keyring', 'hot_desk', null]], 'the keyboard route has no foothold');
    assert.deepEqual(scene.params.signIn.keyring.map(e => e.id), ['k_cap', 'k_pw'], 'passwords only; the saved connection never reaches the keyboard');
    assert.equal(scene.params.signIn.keyringFailed, false);
    // Slow: the screen opens without it and a late answer redraws
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const slow = sceneStub();
        let answer;
        window.keyring = new Keyring();
        window.ApiClient.keyring = () => new Promise((ok) => { answer = ok; });
        const opening = openLoginSignIn(lockable);
        await drain();
        mock.timers.tick(REMOTE_CAPTURES_WAIT_MS);
        await drain();
        assert.equal('keyring' in slow.params.signIn, false, 'opened without the keyring at the cap');
        answer({ entries: [LENA_CAPTURED], rev: 'r1' });
        await opening;
        assert.equal(slow.keyringSet.length, 1);
        assert.deepEqual(slow.keyringSet[0].keyring.map(e => e.id), ['k_cap']);
    } finally { mock.timers.reset(); }
});

test('8.1 loading: a failed keyboard /keyring opens the screen with keyringFailed, and no keyring call without credentials', async () => {
    setup();
    const scene = sceneStub();
    window.ApiClient.keyring = async () => { throw refusal(500, {}); };
    const lockable = { scenarioData: { id: 'hot_desk', name: 'Hot desk PC', type: 'pc', lockType: 'login', loginPicker: 'accounts', loginAccounts: [] } };
    await openLoginSignIn(lockable);
    assert.equal(scene.params.signIn.keyringFailed, true);
    assert.deepEqual(scene.params.signIn.keyring, []);
    setup({ declared: false });
    const plain = sceneStub();
    await openLoginSignIn(lockable);
    assert.equal(calls.some(c => c[0] === 'keyring'), false);
    assert.equal('keyring' in plain.params.signIn, false);
});

// ── Sessions: the desktop line, a reload, and endedPcIds ─────────────────────────────────────

test('8.1 the start panel names a credential session\'s saved connection under the account, escaped; other sessions get no line', () => {
    const session = { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', label: 'HB-FIN-02.rdp' };
    assert.equal(credentialSessionLine(session), 'with the saved connection HB-FIN-02.rdp');
    assert.equal(credentialSessionLine({ ...session, via: 'password' }), null);
    assert.equal(credentialSessionLine({ ...session, kind: 'assist_invite' }), null);
    // R2 t3: an empty label uses the generic wording the sign-in screen shows
    assert.equal(credentialSessionLine({ ...session, label: '' }), 'with the saved connection Saved connection');
    assert.equal(credentialSessionLine({ ...session, label: '  ' }), 'with the saved connection Saved connection');
    const model = pcTaskbarModel({ pcData: { lockType: 'login', host: 'HB-FIN-02' }, session });
    assert.equal(model.account.credentialLine, 'with the saved connection HB-FIN-02.rdp');
    const html = pcStartPanelHtml(model);
    assert.match(html, /<span class="pc-start-credential">with the saved connection <span class="credential-label-nowrap">HB-FIN-02\.rdp<\/span><\/span>/);
    assert.ok(html.indexOf('pc-start-name') < html.indexOf('pc-start-credential'), 'under the name');
    const evil = pcStartPanelHtml(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { ...session, label: '<img src=x>' } }));
    assert.equal(evil.includes('<img src=x>'), false);
    assert.match(evil, /&lt;img src=x&gt;/);
    const plain = pcTaskbarModel({ pcData: { lockType: 'login' }, session: { ...session, via: 'password' } });
    assert.equal('credentialLine' in plain.account, false);
    assert.equal(pcStartPanelHtml(plain).includes('pc-start-credential'), false);
});

test('8.1 a reload keeps a credential session\'s kind and label', () => {
    setup();
    pcSessions.load({ lena_pc: { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', label: 'HB-FIN-02.rdp', remote: true, footholdId: 'jack_comms_port' } }, ['lena_pc']);
    const s = pcSessions.get('lena_pc');
    assert.equal(s.via, 'credential');
    assert.equal(s.kind, 'saved_connection');
    assert.equal(s.label, 'HB-FIN-02.rdp');
    assert.equal(credentialSessionLine(s), 'with the saved connection HB-FIN-02.rdp');
});

test('K2 3.8 a sign-in answer\'s endedPcIds go to linkDropped, in the credential and the password path, and never drop the new session', async () => {
    setup();
    const dropped = [];
    const orig = pcSessions.linkDropped.bind(pcSessions);
    pcSessions.linkDropped = (ids) => { dropped.push(ids); return orig(ids); };
    pcSessions.sessions.set('old_pc', { npcId: 'x', username: 'x', via: 'password', host: 'HB-OLD-01' });
    credAnswer = () => ({ success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', label: 'a.rdp', endedPcIds: ['old_pc', 'lena_pc'] });
    const r = await pcSessions.signInWithCredential('lena_pc', 'k_rdp', { foothold: 'jack_comms_port' });
    assert.equal(r.ok, true);
    assert.deepEqual(dropped, [['old_pc']], 'the new session\'s own pc is filtered out');
    assert.equal(pcSessions.get('old_pc'), null);
    assert.equal(pcSessions.get('lena_pc').via, 'credential');
    assert.equal(alerts.length, 1, 'the usual link-dropped toast for a session whose desktop was not open');
    // The password path
    pcSessions.sessions.set('old2', { npcId: 'y', username: 'y', via: 'password', host: 'HB-OLD-02' });
    window.ApiClient.login = async () => ({ success: true, npcId: 'jake', username: 'jjones', displayName: 'Jake Jones', via: 'password', endedPcIds: ['old2'] });
    await pcSessions.signIn('hot_desk', 'jjones', 'x');
    assert.deepEqual(dropped[1], ['old2']);
    assert.equal(pcSessions.get('old2'), null);
    // No endedPcIds, no call
    window.ApiClient.login = async () => ({ success: true, npcId: 'jake', username: 'jjones', displayName: 'Jake Jones', via: 'password' });
    await pcSessions.signIn('hot_desk2', 'jjones', 'x');
    assert.equal(dropped.length, 2);
});

test('M1 plan 8.3: a sign-in prunes with the route_ended line; an unplug keeps the unplug line', async () => {
    setup();
    // A sign-in's endedPcIds: the 8.5 route-ended text, never "Unplugged."
    pcSessions.sessions.set('old_pc', { npcId: 'x', username: 'x', via: 'password', host: 'HB-FIN-03' });
    credAnswer = () => ({ success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', label: 'a.rdp', endedPcIds: ['old_pc'] });
    alerts.length = 0;
    await pcSessions.signInWithCredential('lena_pc', 'k_rdp', { foothold: 'jack_comms_port' });
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], 'Your session on HB-FIN-03 ended: the session it went through was closed.');
    assert.doesNotMatch(alerts[0][0], /Unplugged/);
    // The password path says the same
    pcSessions.sessions.set('old2', { npcId: 'y', username: 'y', via: 'password', host: 'HB-OLD-02' });
    window.ApiClient.login = async () => ({ success: true, npcId: 'jake', username: 'jjones', displayName: 'Jake Jones', via: 'password', endedPcIds: ['old2'] });
    alerts.length = 0;
    await pcSessions.signIn('hot_desk', 'jjones', 'x');
    assert.equal(alerts[0][0], 'Your session on HB-OLD-02 ended: the session it went through was closed.');
    // Several hosts
    assert.equal(routeEndedMessage(['A', 'B']), 'Your sessions on A and B ended: the sessions they went through were closed.');
    assert.equal(routeEndedMessage([]), null);
    // The default reason is the unplug, and keeps its text
    pcSessions.sessions.set('u_pc', { npcId: 'z', username: 'z', via: 'password', host: 'LW-DOOR01' });
    alerts.length = 0;
    pcSessions.linkDropped(['u_pc']);
    assert.equal(alerts[0][0], 'Unplugged. Your session on LW-DOOR01 ended.');
    // An open desktop of a pruned session closes naming its host
    const closed = [];
    pcSessions.sessions.set('o_pc', { npcId: 'z', username: 'z', via: 'password', host: 'HB-OPEN-01' });
    pcSessions.desktops.set('o_pc', (msg, why) => closed.push([msg, why]));
    pcSessions.linkDropped(['o_pc'], 'route_ended');
    assert.deepEqual(closed, [['Your session on HB-OPEN-01 ended: the session it went through was closed.', 'link_dropped']]);
});

test('pc-sessions: a credential 403 or no answer is an error carrying the server reason; a bad answer fails closed', async () => {
    setup();
    credAnswer = () => { throw refusal(403, { reason: 'unreachable' }); };
    let r = await pcSessions.signInWithCredential('lena_pc', 'k_rdp', { foothold: 'f' });
    assert.deepEqual([r.ok, r.error, r.status, r.serverReason], [false, true, 403, 'unreachable']);
    credAnswer = () => ({ success: false });
    r = await pcSessions.signInWithCredential('lena_pc', 'k_rdp');
    assert.equal(r.ok, false);
    assert.equal(pcSessions.get('lena_pc'), null);
});

test('R2 m1: the cut-off label span carries the whole label as a DOM title, and the CSS ellipsis rule is present', () => {
    const els = [{ textContent: '<b>A-very-long-label-that-will-be-cut.rdp</b>', title: '' }];
    titleCredentialLabels({ querySelectorAll: (sel) => (sel === '.credential-label-nowrap' ? els : []) });
    assert.equal(els[0].title, '<b>A-very-long-label-that-will-be-cut.rdp</b>');
    titleCredentialLabels(null);
    const css = readFileSync(join(here, '../../public/break_escape/css/pc-monitor.css'), 'utf8');
    const rule = css.match(/\.credential-label-nowrap\s*\{([^}]*)\}/)[1];
    for (const decl of ['white-space: nowrap', 'max-width: 100%', 'overflow: hidden', 'text-overflow: ellipsis']) {
        assert.ok(rule.includes(decl), `missing ${decl}`);
    }
    const html = pcStartPanelHtml(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', label: 'x'.repeat(50) } }));
    assert.equal(html.includes('title='), false, 'the title is set through the DOM, not markup');
});

test('R2 t2: TextFileMinigame.init records the file as opened', () => {
    const src = readFileSync(join(here, '../../public/break_escape/js/minigames/text-file/text-file-minigame.js'), 'utf8');
    assert.match(src, /init\(\)\s*\{[\s\S]*?window\.keyring\?\.noteOpened\?\.\(this\.textFileData\?\.itemId\)/);
});

test('R5a a Connect refusal fills the password the keyring already shows, as the tile click does', () => {
    for (const reason of ['kind_refused', 'locked_out']) {
        setup();
        document.body.innerHTML = '<div id="mg"></div>';
        window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
        const mg = new PasswordMinigame(document.getElementById('mg'), {
            title: "Lena's PC", type: 'item',
            signIn: { pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current: null,
                remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' },
                preselect: 'lfox', connectRefusal: { credentialId: 'k_rdp', reason, kind: 'saved_connection', attemptsLeft: 0, message: 'x' },
                host: 'HB-FIN-02', captured: [], capturedLoading: true },
            postitNote: '', showPostit: false
        });
        window.MinigameFramework.currentMinigame = mg;
        mg.init();
        mg.start();
        answerRemote(mg, { keyring: [RDP, LENA_CAPTURED], captured: [{ username: 'lfox', displayName: 'Lena Fox', password: 'Ledger-Lena-9' }] });
        assert.equal(mg.signInState.selected, 'lfox', `${reason}: the account is chosen`);
        assert.equal(q('#password-field').value, 'Ledger-Lena-9', `${reason}: the shown password fills the field`);
        assert.equal(mg.gameData.password, 'Ledger-Lena-9', `${reason}: and the game data`);
    }
});

test('S7 R2-2: a cracked password has its own tag, no file line, and its own teaching toast after a typed sign-in', async () => {
    setup();
    assert.equal(keyringTagKind(JAKE_CRACKED), 'cracked');
    assert.equal(entryTagKind(JAKE_CRACKED), 'cracked');
    const merged = mergeRemoteTiles({ picker: 'accounts', tiles: [LENA, JAKE], captured: [], keyring: [JAKE_CRACKED] });
    const jake = merged.find(t => t.username === 'jjones');
    assert.deepEqual(jake.kinds, ['cracked']);
    assert.deepEqual(jake.found, [], 'never the "Type the password from" file line');
    assert.equal(jake.keyPassword, null, 'an entry with no password fills nothing');
    const teach = text.teachLine('cracked', { displayName: 'Jake Jones' });
    assert.match(teach, /^A password can be worked out from a hash/);
    const mg = openRemote();
    answerRemote(mg, { keyring: [JAKE_CRACKED] });
    tileFor('jjones').click();
    q('#password-field').value = 'Cedar-Jake-4';
    q('#submit-password').click();
    await settle();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], teach);
    assert.doesNotMatch(alerts[0][0], /files/);
});

// A3 (S7-1): a cracked password fills like any held password. The row comes from the shared fixture.
const CRACKED_ROW = OPS_CRACK.keyringCracked.entries.find(e => e.source === 'cracked');
const CRACKED_USER = CRACKED_ROW.account.username;
test('A3: a cracked password with a value fills the tile on both screens, kinds stay cracked', () => {
    assert.ok(CRACKED_ROW.password);
    const remote = mergeRemoteTiles({ picker: 'accounts', tiles: [{ username: CRACKED_USER }], captured: [], keyring: [CRACKED_ROW] });
    assert.deepEqual(remote[0].kinds, ['cracked']);
    assert.equal(remote[0].keyPassword, CRACKED_ROW.password);
    assert.deepEqual(remote[0].found, []);
    assert.deepEqual(remote[0].credentials, []);
    const kb = mergeKeyboardTiles({ picker: 'accounts', tiles: [{ username: CRACKED_USER }], keyring: [CRACKED_ROW] });
    assert.deepEqual(kb[0].kinds, ['cracked']);
    assert.equal(kb[0].keyPassword, CRACKED_ROW.password);
});

test('A3: a captured value wins over a cracked one in either order', () => {
    const cap = { id: 'c1', kind: 'password', source: 'capture', label: 'Seen', account: CRACKED_ROW.account, password: 'Seen-Value-1', accepted: true };
    for (const keyring of [[CRACKED_ROW, cap], [cap, CRACKED_ROW]]) {
        const t = mergeRemoteTiles({ picker: 'accounts', tiles: [{ username: CRACKED_USER }], captured: [], keyring });
        assert.equal(t[0].keyPassword, 'Seen-Value-1');
        assert.deepEqual([...t[0].kinds].sort(), ['captured', 'cracked']);
        const k = mergeKeyboardTiles({ picker: 'accounts', tiles: [{ username: CRACKED_USER }], keyring });
        assert.equal(k[0].keyPassword, 'Seen-Value-1');
    }
});

test('A3: no password fills nothing, and an unlisted account is still dropped', () => {
    const { password, ...bare } = CRACKED_ROW;
    const t = mergeRemoteTiles({ picker: 'accounts', tiles: [{ username: CRACKED_USER }], captured: [], keyring: [bare, { ...CRACKED_ROW, password: '' }] });
    assert.equal(t[0].keyPassword, null);
    const dropped = mergeRemoteTiles({ picker: 'accounts', tiles: [{ username: 'someone_else' }], captured: [], keyring: [CRACKED_ROW] });
    assert.deepEqual(dropped.map(x => x.username), ['someone_else']);
    const dropKb = mergeKeyboardTiles({ picker: 'accounts', tiles: [{ username: 'someone_else' }], keyring: [CRACKED_ROW] });
    assert.deepEqual(dropKb.map(x => x.username), ['someone_else']);
});

test('R3-CORE3: signing in with the reset password of a cracked account teaches no "cracked" lesson', async () => {
    setup();
    const JAKE_RESET = { id: 'dana.reset', kind: 'password', source: 'helpdesk', label: 'Reset', account: JAKE, how: 'issued', password: 'Tern-Harbour-41', accepted: true };
    const mg = openRemote();
    answerRemote(mg, { keyring: [JAKE_CRACKED, JAKE_RESET] });
    const chosen = mg.signInTileFor('jjones');
    assert.ok(chosen.kinds.includes('cracked') && chosen.kinds.includes('reset'), 'the tile carries both kinds');
    tileFor('jjones').click();
    q('#password-field').value = 'Tern-Harbour-41';
    q('#submit-password').click();
    await settle();
    assert.equal(alerts.length, 0, 'the desk password is not a cracked one: no lesson');
});
