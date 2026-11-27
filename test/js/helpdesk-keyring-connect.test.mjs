// S8b R1 client fix (R1-CLIENT2, R1-CLIENT3): the real keyring.js, pc-sessions.js and
// helpdesk-client.js against jsdom. Connect from the inventory with a saved connection whose
// password has been changed shows the notice and no error; a granted reset reaches the keyring
// and the sign-in list at once. Server answers come from the shared fixture only.
// Run with: node test/js/helpdesk-keyring-connect.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer, answerWith } from './helpers/helpdesk-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'helpdesk-keyring-connect-'));
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
    'minigames/container/container-minigame.js', 'minigames/password/password-minigame.js', 'minigames/capture-log/signin-rows.js']) copy(rel);


const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { PasswordMinigame, mergeKeyboardTiles, keyringTagKind } = await imp('minigames/password/password-minigame.js');
const { buildSignInRows } = await imp('minigames/capture-log/signin-rows.js');
const helpdesk = await imp('systems/helpdesk-client.js');
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

const NOTICE = 'This password has been changed. Type the new one to sign in.';
const SECOND = 'This PC asks for a second step. Type the password to sign in.';
const fromFront = () => ({ entries: [{ ...RDP, routes: [{ from: 'front_pc' }] }], rev: 'r1' });
const refuseWith = (name, patch) => () => { const a = patch ? answerWith(name, patch) : answer(name); throw refusal(a.status, a.body); };

test('Connect on a saved connection whose password has changed shows the notice, not an error (R1-CLIENT2)', async () => {
    setup();
    keyringAnswer = fromFront;
    loginAnswer = refuseWith('keyring.password_changed');
    const r = await window.keyring.connect(ITEM); 
    assert.equal(r.outcome, 'type_to_sign_in');
    assert.deepEqual(toasts(), [NOTICE]);
    assert.equal(alerts[0][1], 'info', 'a notice, not an error');
    assert.equal(alerts[0][2], 'HB-FIN-02.rdp');
    assert.equal(posts().length, 1);
    assert.equal(opened.length, 0, 'no desktop');
    assert.equal(signIns.length, 0, 'no sign-in screen');
});

test('the second step refusal is a notice too', async () => {
    setup();
    keyringAnswer = fromFront;
    loginAnswer = () => { const a = answer('keyring.password_changed'); a.body.typeToSignIn = 'second_step'; throw refusal(a.status, a.body); };
    const r = await window.keyring.connect(ITEM);
    assert.equal(r.outcome, 'type_to_sign_in');
    assert.deepEqual(toasts(), [SECOND]);
    assert.equal(alerts[0][1], 'info');
    assert.equal(posts().length, 1);
});

// ---- R1-CLIENT3: a granted reset is in the sign-ins at once ----------------------------------
const reset = (patch) => answerWith('keyring.reset_entry', patch || {}).body;
const rowsOf = (kr) => buildSignInRows({ captures: {}, keyring: { entries: kr.listAnswer().entries, captures: kr.listAnswer().captures || {}, foundVisible: (e) => kr.foundVisible(e) } });

test('a desk reset entry is visible with no file opened, and draws no find toast', async () => {
    setup();
    const entry = reset();
    assert.equal(window.keyring.foundVisible(entry), true);
    assert.equal(window.keyring.findWaiting(entry), false);
    const { findLine } = text;
    assert.equal(findLine(entry), null);
    assert.equal(findLine(entry, { captureLog: true }), null);
    keyringAnswer = () => ({ entries: [], rev: 'r1' });
    await window.keyring.fetch(null);
    keyringAnswer = () => ({ entries: [entry], rev: 'r2' });
    await window.keyring.fetch(null);
    assert.deepEqual(toasts(), [], 'no "found" toast for a reset');
});

test('the sign-ins list shows the Reset row with the new password (R1-CLIENT3)', async () => {
    setup();
    const entry = reset();
    keyringAnswer = () => ({ entries: [entry], rev: 'r1' });
    await window.keyring.fetch(null);
    const { signins } = rowsOf(window.keyring);
    assert.equal(signins.length, 1);
    assert.deepEqual(signins[0].kinds, ['reset']);
    assert.deepEqual(signins[0].sources, ['Issued']);
    assert.equal(signins[0].value, entry.password);
    assert.equal(signins[0].use, entry.password);
    assert.equal(text.rowKindName('reset'), 'Reset password');
});

test('an account captured and then reset shows the reset password, not the dead captured one (R2-CLIENT1)', async () => {
    setup();
    const entry = reset();
    const captured = { id: 'old.password', kind: 'password', source: 'capture', account: entry.account, label: 'Captured', how: 'recorded', password: 'DeadOldPass-1' };
    const capRow = { targetId: entry.account.npcId, kind: 'credential', at: 1, username: entry.account.username };
    const { signins } = buildSignInRows({
        captures: [capRow], secrets: { [capRow.targetId]: 'DeadOldPass-1' }, social: { captures: { revealSecret: true } },
        keyring: { entries: [captured, entry], captures: { [capRow.targetId]: { tag: 'password', source: 'phished', account: entry.account.npcId } }, foundVisible: () => true }
    });
    assert.equal(signins.length, 1);
    assert.equal(signins[0].value, entry.password);
    assert.equal(signins[0].use, entry.password);
    assert.ok(signins[0].kinds.includes('reset'));
    const tiles = mergeKeyboardTiles({ picker: 'accounts', tiles: [{ username: entry.account.username, displayName: 'Vera' }], keyring: [captured, entry] });
    assert.equal(tiles[0].keyPassword, entry.password, 'the later reset wins on the tile');
});

test('the sign-in tile carries the Reset tag and fills the new password', () => {
    const entry = reset();
    assert.equal(keyringTagKind(entry), 'reset');
    const tiles = mergeKeyboardTiles({ picker: 'accounts', tiles: [{ username: entry.account.username, displayName: 'Vera' }], keyring: [entry] });
    assert.equal(tiles.length, 1);
    assert.deepEqual(tiles[0].kinds, ['reset']);
    assert.equal(tiles[0].keyPassword, entry.password);
    assert.deepEqual(tiles[0].found, []);
    assert.deepEqual(text.tileFullNames(tiles[0].kinds), ['Reset password']);
    assert.deepEqual(text.tileTagLabels(tiles[0].kinds), ['Reset']);
});

test('a grant refreshes the keyring at once; the password is only in the answer and the keyring', async () => {
    setup();
    const entry = reset();
    const granted = answer('helpdesk.granted_password');
    granted.body.password = entry.password;
    let held = false;
    keyringAnswer = () => ({ entries: held ? [entry] : [], rev: held ? 'r2' : 'r1' });
    await window.keyring.fetch(null);
    assert.deepEqual(rowsOf(window.keyring).signins, []);
    // the page's real client, its defaults reading the page: the keyring refresh on a grant
    const events = [];
    const logs = [];
    const saved = {};
    for (const k of ['log', 'info', 'debug', 'warn', 'error']) { saved[k] = console[k]; console[k] = (...a) => logs.push(a); }
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]), on: () => {} };
    window.stateSync.writeGlobal = (n, v) => { window.gameState.globalVariables[n] = v; };
    window.ApiClient.post = async (path, payload) => { calls.push(['helpdesk', path, payload]); held = true; return granted.body; };
    helpdesk.reset();
    let out;
    try {
        out = await helpdesk.send({ deskId: 'it_desk', username: entry.account.username, what: 'password', answers: {} });
        await window.keyring._running;
        await settle();
    } finally { for (const k of Object.keys(saved)) console[k] = saved[k]; }
    assert.equal(out.result, 'granted');
    assert.equal(out.body.password, entry.password, 'the form gets it');
    const { signins } = rowsOf(window.keyring);
    assert.equal(signins.length, 1, 'the keyring was refetched on the grant');
    assert.equal(signins[0].value, entry.password);
    assert.ok(calls.filter(c => c[0] === 'keyring').length >= 2);
    // nowhere else
    const everywhere = JSON.stringify([events, logs, window.gameState.globalVariables, alerts]);
    assert.equal(everywhere.includes(entry.password), false, 'not in events, logs, globals or toasts');
    for (const store of ['localStorage', 'sessionStorage']) {
        let dump = '';
        try { const st = window[store]; for (let i = 0; i < st.length; i++) dump += st.key(i) + st.getItem(st.key(i)); } catch (e) { /* no storage here */ }
        assert.equal(dump.includes(entry.password), false, store);
    }
});
