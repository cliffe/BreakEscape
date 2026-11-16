// Credential keyring slice K3c (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 8.2 and 8.3): the
// keyring.js relay hooks. Connect runs for an assist invite; its route is { relay: true }, which
// reaches POST /login as relay: true only (never relay: false, never beside a foothold); the
// relay desktop opens by openRelayDesktop, also on re-entry to a held relay session; invite
// refusals are toasts; an invite find gives its 8.2 line; and while a relay session is held a
// global change asks stateSync.sync() at once (the prompt end), with no ask after the relay ends.
// The real keyring.js, pc-sessions.js, remote-host-text.js, npc-events.js and api-client.js run
// against jsdom; only ApiClient's network calls are faked.
// Run with: node --max-old-space-size=2048 test/js/keyring-relay-hooks.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'keyring-relay-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
for (const rel of ['systems/keyring.js', 'systems/pc-sessions.js', 'systems/npc-events.js', 'utils/remote-host-text.js', 'api-client.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { Keyring, CONNECT_KINDS, FIND_KINDS, connectRoute } = await imp('systems/keyring.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { default: Dispatcher } = await imp('systems/npc-events.js');
const { ApiClient: RealApiClient } = await imp('api-client.js');
const text = await imp('utils/remote-host-text.js');

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const refusal = (status, body) => Object.assign(new Error('refused'), { status, body });

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────
const JAKE = { username: 'jbrooks', displayName: 'Jake Brooks', npcId: 'jake' };
const CODE = { scenarioData: { id: 'jake_assist_code', name: 'Remote assist code (Jake)', type: 'text_file' } };
const INVITE = {
    id: 'jake_assist', kind: 'assist_invite', source: 'registry', label: 'Remote assist code (Jake)', account: JAKE,
    host: 'HB-FIN-03', connectsTo: 'jake_pc', heldItem: 'jake_assist_code', routes: [{ relay: true }],
    sessionHeld: false, targetOff: false, remoteBlocked: false, ended: false
};
const RDP = {
    id: 'k_rdp', kind: 'saved_connection', source: 'registry', label: 'HB-FIN-02.rdp', account: { username: 'lfox', displayName: 'Lena Fox' },
    host: 'HB-FIN-02', connectsTo: 'lena_pc', heldItem: 'lena_rdp_file', routes: [{ foothold: 'jack_comms_port' }]
};
const RELAY_ANSWER = () => ({
    success: true, npcId: 'jake', username: 'jbrooks', displayName: 'Jake Brooks', via: 'credential', kind: 'assist_invite',
    label: 'Remote assist code (Jake)', relay: true, host: 'HB-FIN-03', endedPcIds: []
});

let calls, alerts, keyringAnswer, loginAnswer, syncs, dispatcher;

function setup() {
    calls = []; alerts = []; syncs = 0;
    document.body.innerHTML = '';
    window.breakEscapeConfig = { gameId: 5 };
    window.gameScenario = { credentialsDeclared: true };
    window.gameState = { globalVariables: {} };
    dispatcher = new Dispatcher();
    window.eventDispatcher = dispatcher;
    window.gameAlert = (...a) => alerts.push(a);
    window.stateSync = { syncConfirmed: async () => {}, sync: () => { syncs++; return Promise.resolve(true); } };
    keyringAnswer = () => ({ entries: [INVITE], rev: 'r1' });
    loginAnswer = RELAY_ANSWER;
    window.ApiClient = {
        keyring: async (pcId, opts = {}) => { calls.push(['keyring', pcId, opts.rev ?? null]); return keyringAnswer(); },
        loginWithCredential: async (pcId, id, opts = {}) => {
            calls.push(['post', pcId, id, opts]);
            const a = loginAnswer();
            if (a instanceof Error) throw a;
            return a;
        },
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; }
    };
    window.pcSessions = new PcSessions();
    window.keyring = new Keyring();
    window.keyring.listen();
    window.openRemoteDesktop = (pcId, foothold) => calls.push(['remote_desktop', pcId, foothold]);
    window.openRelayDesktop = (pcId) => calls.push(['relay_desktop', pcId]);
    window.openCredentialSignIn = () => calls.push(['screen']);
    window.MinigameFramework = { currentMinigame: null };
}

const posts = () => calls.filter(c => c[0] === 'post');
const desktops = () => calls.filter(c => c[0] === 'relay_desktop' || c[0] === 'remote_desktop');
const toasts = () => alerts.map(a => a[0]);
const changeGlobal = (name, value, oldValue) => dispatcher.emit(`global_variable_changed:${name}`, { name, value, oldValue });

// ── Connect for an invite ───────────────────────────────────────────────────────────────────

test('an assist invite is a Connect kind and a find kind, and the tray finds its entry', () => {
    setup();
    assert.ok(CONNECT_KINDS.includes('assist_invite'));
    assert.ok(FIND_KINDS.includes('assist_invite'));
    window.keyring.latest = [RDP, INVITE];
    assert.equal(window.keyring.connectEntryFor('jake_assist_code'), INVITE);
});

test('connectRoute: an invite\'s relay route is { relay: true }; footholds still come first; a saved connection never gets the relay', () => {
    assert.deepEqual(connectRoute(INVITE), { relay: true });
    assert.deepEqual(connectRoute({ ...INVITE, routes: [{ relay: true }, { foothold: 'f1' }] }), { foothold: 'f1' });
    assert.equal(connectRoute({ ...INVITE, routes: [] }), null);
    assert.equal(connectRoute({ ...INVITE, routes: [{ relay: 'yes' }] }), null, 'only relay === true counts');
    assert.equal(connectRoute({ ...RDP, routes: [{ relay: true }] }), null);
    assert.deepEqual(connectRoute(RDP), { foothold: 'jack_comms_port' });
});

test('Connect on an invite posts relay: true only, opens the relay desktop and teaches once', async () => {
    setup();
    const r = await window.keyring.connect(CODE);
    assert.equal(r.outcome, 'signed_in');
    assert.deepEqual(r.route, { relay: true });
    assert.deepEqual(posts(), [['post', 'jake_pc', 'jake_assist', { relay: true }]], 'relay: true, no foothold key');
    assert.deepEqual(desktops(), [['relay_desktop', 'jake_pc']], 'the relay desktop, never the remote one');
    assert.equal(window.pcSessions.isRelay('jake_pc'), true);
    assert.deepEqual(toasts(), ['Jake Brooks let you into the session. Check who is asking before you share access.']);
});

test('a saved connection still posts its foothold only and opens the remote desktop', async () => {
    setup();
    keyringAnswer = () => ({ entries: [RDP], rev: 'r1' });
    loginAnswer = () => ({ success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection',
        remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02', endedPcIds: [] });
    await window.keyring.connect({ scenarioData: { id: 'lena_rdp_file', name: 'HB-FIN-02.rdp' } });
    assert.deepEqual(posts(), [['post', 'lena_pc', 'k_rdp', { foothold: 'jack_comms_port' }]]);
    assert.deepEqual(desktops(), [['remote_desktop', 'lena_pc', 'jack_comms_port']]);
});

test('api-client loginWithCredential sends relay: true only for a relay, and never relay: false', async () => {
    const sent = [];
    const orig = RealApiClient.post;
    RealApiClient.post = async (endpoint, data) => { sent.push([endpoint, data]); return {}; };
    try {
        await RealApiClient.loginWithCredential('jake_pc', 'jake_assist', { relay: true });
        await RealApiClient.loginWithCredential('jake_pc', 'jake_assist', { relay: true, foothold: 'f1' });
        await RealApiClient.loginWithCredential('lena_pc', 'k_rdp', { foothold: 'f1' });
        await RealApiClient.loginWithCredential('lena_pc', 'k_rdp', { relay: false, foothold: 'f1' });
        await RealApiClient.loginWithCredential('lena_pc', 'k_rdp', { relay: 'true' });
    } finally {
        RealApiClient.post = orig;
    }
    assert.deepEqual(sent, [
        ['/login', { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }],
        ['/login', { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }],
        ['/login', { pc_id: 'lena_pc', credential: 'k_rdp', foothold: 'f1' }],
        ['/login', { pc_id: 'lena_pc', credential: 'k_rdp', foothold: 'f1' }],
        ['/login', { pc_id: 'lena_pc', credential: 'k_rdp' }]
    ]);
});

test('re-entry: a held relay session opens the relay desktop by Connect, with no POST', async () => {
    setup();
    await window.keyring.connect(CODE);
    calls = []; alerts = [];
    keyringAnswer = () => ({ entries: [{ ...INVITE, sessionHeld: true }], rev: 'r2' });
    const r = await window.keyring.connect(CODE);
    assert.equal(r.outcome, 'session_held');
    assert.equal(posts().length, 0);
    assert.deepEqual(desktops(), [['relay_desktop', 'jake_pc']]);
    assert.equal(alerts.length, 0);
});

test('re-entry with no mirrored session (after a reload) signs in again by the relay and arms the trigger', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...INVITE, sessionHeld: true }], rev: 'r2' });
    await window.keyring.connect(CODE);
    // The mirror is empty, so there is nothing for openRelayDesktop to open: one relay POST first (R1 M1)
    assert.deepEqual(posts().map(p => p[3]), [{ relay: true }]);
    assert.deepEqual(desktops(), [['relay_desktop', 'jake_pc']]);
    changeGlobal('jake_done', true, false);
    await settle();
    assert.equal(syncs, 1, 'the prompt-end trigger is armed');
});

test('invite refusals are toasts with 8.5\'s lines, never a sign-in screen', async () => {
    for (const [body, line] of [
        [{ kindRefused: 'assist_invite' }, 'HB-FIN-03 does not allow remote assistance.'],
        [{ ended: true }, 'Jake Brooks ended the remote assist.']
    ]) {
        setup();
        loginAnswer = () => refusal(422, body);
        const r = await window.keyring.connect(CODE);
        assert.deepEqual(toasts(), [line]);
        assert.equal(calls.filter(c => c[0] === 'screen').length, 0, 'no relay sign-in screen');
        assert.equal(desktops().length, 0);
        assert.notEqual(r.outcome, 'signin_screen');
    }
});

test('an ended invite in the GET answer is the ended toast, with no POST', async () => {
    setup();
    keyringAnswer = () => ({ entries: [{ ...INVITE, ended: true }], rev: 'r1' });
    const r = await window.keyring.connect(CODE);
    assert.equal(r.outcome, 'ended');
    assert.deepEqual(toasts(), ['Jake Brooks ended the remote assist.']);
    assert.equal(posts().length, 0);
});

// ── Find toast ──────────────────────────────────────────────────────────────────────────────

test('an invite found after the baseline toasts the 8.2 line', async () => {
    setup();
    assert.equal(text.findLine(INVITE), 'Remote assist code (Jake): Connect it from your inventory to join Jake Brooks\'s session.');
    assert.equal(text.findLine({ ...INVITE, source: 'capture' }), null, 'a capture stays silent');
    let n = 0;
    keyringAnswer = () => (n++ === 0 ? { entries: [], rev: 'r1' } : { entries: [INVITE], rev: 'r2' });
    await window.keyring.prime();
    await settle();
    await window.keyring.refresh();
    await settle();
    assert.deepEqual(toasts(), ['Remote assist code (Jake): Connect it from your inventory to join Jake Brooks\'s session.']);
});

// ── The prompt end (8.3) ────────────────────────────────────────────────────────────────────

test('prompt end: with no relay held, a global change asks no sync', async () => {
    setup();
    changeGlobal('jake_ended_assist', true, false);
    assert.equal(syncs, 0);
});

test('prompt end: while a relay session is held, a global change asks stateSync.sync() at once', async () => {
    setup();
    await window.keyring.connect(CODE);
    changeGlobal('jake_ended_assist', true, false);
    assert.equal(syncs, 1);
    changeGlobal('jake_contract_read', true, false);
    assert.equal(syncs, 2);
    changeGlobal('jake_contract_read', true, true);
    assert.equal(syncs, 2, 'a write of the same value is no change');
});

test('prompt end: the relay sign-in event alone arms it (a relay signed in by another path)', async () => {
    setup();
    window.pcSessions.hasRelay = () => true;
    dispatcher.emit('pc_signed_in', { pcId: 'jake_pc', relay: true, kind: 'assist_invite' });
    changeGlobal('x', 1, 0);
    assert.equal(syncs, 1);
});

test('prompt end: a foothold sign-in does not arm it', async () => {
    setup();
    dispatcher.emit('pc_signed_in', { pcId: 'lena_pc', remote: true, footholdId: 'f1' });
    changeGlobal('x', 1, 0);
    assert.equal(syncs, 0);
});

test('prompt end: once the relay ends (endedRelayPcIds), no later change asks a sync, and the listener is gone', async () => {
    setup();
    await window.keyring.connect(CODE);
    window.pcSessions.relayAnswer({ endedRelayPcIds: ['jake_pc'] });
    assert.equal(window.pcSessions.hasRelay(), false);
    changeGlobal('jake_ended_assist', true, false);
    assert.equal(syncs, 0);
    assert.equal((dispatcher.listeners.get('global_variable_changed:*') || []).length, 0, 'the trigger lives only as long as the relay');
});

test('prompt end: arming is idempotent (one listener for two relay sign-ins)', async () => {
    setup();
    await window.keyring.connect(CODE);
    dispatcher.emit('pc_signed_in', { pcId: 'jake_pc', relay: true, kind: 'assist_invite' });
    assert.equal(dispatcher.listeners.get('global_variable_changed:*').length, 1);
    changeGlobal('x', 1, 0);
    assert.equal(syncs, 1);
});
