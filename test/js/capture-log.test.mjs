// The capture log device (engine plan section 6): an inventory holder that files items by
// storeIn (a tray rule over the real inventory.js), lists Captures, Sessions and Findings, marks
// new rows, and returns to itself after a row's screen closes (one return listener at a time).
// Run with: node test/js/capture-log.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'capture-log-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, code) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), code); };
const copy = (rel, rewrites = []) => {
    let code = readFileSync(join(js, rel), 'utf8');
    for (const [a, b] of rewrites) code = code.split(a).join(b);
    put(rel, code);
};

// inventory.js with its heavy imports stubbed (as inventory-tray.test.mjs does)
put('stubs/rooms.js', 'export const rooms = {};');
put('stubs/ink.js', 'export default class InkEngine {}');
put('stubs/config.js', "export const CSRF_TOKEN = 'x';");
put('stubs/info-label.js', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js');
copy('systems/consumables.js');
copy('systems/inventory.js', [
    ["'../core/rooms.js'", "'../stubs/rooms.js'"],
    ["'./ink/ink-engine.js'", "'../stubs/ink.js'"],
    ["'../config.js'", "'../stubs/config.js'"],
    ["'../ui/info-label.js'", "'../stubs/info-label.js'"]
]);
copy('systems/captures.js');
copy('systems/global-writer.js');
copy('utils/display-dashes.js');
copy('utils/escape-html.js');
copy('utils/author-html.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/capture-log/capture-log-model.js');
copy('minigames/capture-log/capture-rows.js');
copy('minigames/capture-log/signin-rows.js');
copy('utils/remote-host-text.js');
copy('systems/keyring.js');
copy('minigames/capture-log/capture-log-minigame.js');
copy('systems/pc-sessions.js');
copy('utils/sync-before-fetch.js');
put('api-client.js', 'export const ApiClient = { get: (...a) => window.__api.get(...a) };');
put('systems/minigame-registry.js', `
export const starters = {};
export function registerMinigameStarter(type, entry) { starters[type] = entry; return true; }`);
// A minimal framework: one minigame at a time; starting one ends the running one through
// endMinigame (cleanup and onComplete, never complete(), so no event), as minigame-manager.js does.
put('minigames/framework/minigame-manager.js', `
export const MinigameFramework = {
    mainGameScene: {}, currentMinigame: null, registeredScenes: {}, started: [],
    init() {},
    registerScene(type, Cls) { this.registeredScenes[type] = Cls; },
    startMinigame(type, _c, params = {}) {
        if (this.currentMinigame) this.endMinigame(false, null);
        const container = document.createElement('div');
        container.className = 'minigame-container';
        document.body.appendChild(container);
        const scene = new this.registeredScenes[type](container, params);
        scene._sceneType = type;
        this.currentMinigame = scene;
        this.started.push(type);
        scene.init();
        scene.start();
        return scene;
    },
    endMinigame(success, result) {
        const ending = this.currentMinigame;
        if (!ending) return;
        ending.cleanup();
        ending.container.remove();
        this.currentMinigame = null;
        ending.params?.onComplete?.(success, result);
    }
};`);

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const url = (rel) => pathToFileURL(join(dir, rel)).href;
const inv = await import(url('systems/inventory.js'));
const { MinigameFramework: MF } = await import(url('minigames/framework/minigame-manager.js'));
const { MinigameScene } = await import(url('minigames/framework/base-minigame.js'));
const registry = await import(url('systems/minigame-registry.js'));
const log = await import(url('minigames/capture-log/capture-log-minigame.js'));
const rows = await import(url('minigames/capture-log/capture-rows.js'));
const model = await import(url('minigames/capture-log/capture-log-model.js'));
// The real PcSessions class (M2); the module also sets window.pcSessions, which reset() clears.
const { PcSessions } = await import(url('systems/pc-sessions.js'));
// The real keyring (no static imports); the device imports the same module copy dynamically.
const { Keyring } = await import(url('systems/keyring.js'));
const { addToInventory, removeFromInventory, initializeInventory, processInitialInventoryItems, trayStateOf, refreshInventoryTray } = inv;

// A reader: any minigame the device's rows open (a text file, a desktop).
class Reader extends MinigameScene {}
MF.registerScene('reader', Reader);

function dispatcher() {
    const handlers = new Map();
    return {
        log: [],
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        off(name, fn) { const l = handlers.get(name) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
        emit(name, data) { this.log.push(name); for (const fn of [...(handlers.get(name) || [])]) fn(data); },
        count(name) { return (handlers.get(name) || []).length; }
    };
}

let api;
function reset({ globals = {}, social = { captures: { revealSecret: true } }, playerInventory } = {}) {
    while (MF.currentMinigame) MF.endMinigame(false, null);
    log.disarmReturn();
    MF.started.length = 0;
    document.body.innerHTML = '<div id="inventory-container"></div>';
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = () => null;
    window.gameState = { notes: [], globalVariables: globals };
    window.gameScenario = { social, playerInventory };
    window.addNote = () => null;
    window.gameAlert = () => {};
    window.eventDispatcher = dispatcher();
    window.stateSync = { syncConfirmed: async () => {} };
    api = { calls: 0, secrets: {}, get: async () => { api.calls++; return { secrets: api.secrets }; } };
    window.__api = api;
    delete window.pcSessions;
    delete window.networkLinks;
    delete window.pendingContainerReturn;
    // A fresh page keyring each test (getKeyring returns window.keyring when it is a Keyring)
    window.keyring = new Keyring();
    delete window.ApiClient;
    window.handleObjectInteraction = () => {};
    window.MinigameFramework = MF;
    initializeInventory();
}
const settle = (ms = 0) => new Promise(r => setTimeout(r, ms));
const add = data => addToInventory({ name: data.type, objectId: `obj_${data.id}`, scenarioData: { ...data } });
const held = id => window.inventory.items.find(it => it.scenarioData?.id === id);
const hidden = el => el.parentElement.classList.contains(inv.TRAY_HIDDEN_CLASS);
const badge = () => held('capture_log').parentElement.querySelector('.tray-badge')?.textContent ?? null;
const device = () => (MF.currentMinigame instanceof log.CaptureLogMinigame ? MF.currentMinigame : null);
const keysIn = (section) => [...(device()?.root.querySelectorAll(`[data-section="${section}"] [data-key]`) || [])].map(n => n.dataset.key);
const openDevice = async () => { log.startCaptureLog(held('capture_log')); await settle(); return device(); };
const click = (key) => device().root.querySelector(`[data-key="${key}"] button`).click();
const closeDevice = () => device().container.querySelector('#minigame-close').click();   // the X: no Cancel beside it (slice 7 R1)

const HOLDER = { type: 'capture_log', id: 'capture_log', name: 'Capture log', takeable: true, holds: { captures: true, items: true } };
const FINDING = { type: 'text_file', id: 'cable_capture', name: 'Juice-jack capture', storeIn: 'capture_log', readable: true, text: 'x' };
const SESSION_ITEM = { type: 'pc', id: 'records_remote_session', name: 'Remote session', storeIn: 'capture_log',
    observations: 'A desktop on LW-OPEN-07\nmore', hasContents: true };
const LINK = { type: 'network_link', id: 'netlink_fh1', name: 'Drop box link', footholdId: 'fh1', storeIn: 'capture_log',
    observations: 'Comms cupboard port\nsecond' };
const LINK_UNFILED = { type: 'network_link', id: 'netlink_fh2', name: 'Other link', footholdId: 'fh2' };
const CAPTURES = {
    hampshire: { targetId: 'hampshire', kind: 'credential', roleLabel: 'Recruitment', address: 'c.hampshire', host: 'LW-RECEP-01', note: 'Keylogger', at: 2 },
    network_drop: { targetId: 'network_drop', kind: 'foothold', roleLabel: 'Comms', host: 'Comms cupboard', note: 'Planted', at: 1 }
};

await settle();
assert.equal(typeof registry.starters.capture_log?.start, 'function', 'the capture_log type is registered');

test('the three sections from a fixture inventory and se_captures', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    await add(HOLDER); await add(FINDING); await add(SESSION_ITEM);
    assert.equal(hidden(held('cable_capture')), true);
    assert.deepEqual(trayStateOf(held('records_remote_session')), { hidden: true, holderId: 'capture_log' });
    assert.ok(held('cable_capture').isConnected, 'a filed item keeps its element');
    await openDevice();
    assert.deepEqual(keysIn('signins'), ['capture:hampshire'], 'a credential capture is a sign-in');
    assert.deepEqual(keysIn('captures'), ['capture:network_drop'], 'a foothold is a capture row');
    assert.deepEqual(keysIn('sessions'), ['item:records_remote_session']);
    assert.deepEqual(keysIn('findings'), ['item:cable_capture']);
    assert.match(device().root.textContent, /Remote session/);
    assert.match(device().root.textContent, /A desktop on LW-OPEN-07/);
    assert.doesNotMatch(device().root.textContent, /more/, 'only the first line of observations');
});

test('the secret is masked until /capture_secrets answers, after the sync', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    const order = [];
    window.stateSync = { syncConfirmed: async () => { order.push('sync'); } };
    api.get = async (path) => { order.push(path); return { secrets: { hampshire: 'Recruit-2026' } }; };
    await add(HOLDER);
    await openDevice();
    await settle();
    // The keyring's own background ask awaits the sync too (K3d), so 'sync' may show twice
    assert.equal(order[0], 'sync', 'the sync first');
    assert.deepEqual(order.filter(p => p !== 'sync'), ['/capture_secrets'], 'one secrets request');
    assert.deepEqual(device().getTestState().captureLog.secrets, ['Recruit-2026']);
});

test('a network_link with storeIn is filed; its row opens networkLinks with a returnTo that reopens the device', async () => {
    reset();
    const opened = [];
    window.networkLinks = { open: (id, opts) => { opened.push({ id, opts }); MF.startMinigame('reader', null, {}); },
        openSession: () => {} };
    await add(HOLDER); await add(LINK); await add(LINK_UNFILED);
    assert.equal(hidden(held('netlink_fh1')), true);
    assert.equal(hidden(held('netlink_fh2')), false, 'a link with no storeIn stays in the tray');
    await openDevice();
    click('item:netlink_fh1');
    assert.equal(opened.length, 1);
    assert.equal(opened[0].id, 'fh1');
    assert.ok(!device(), 'the network screen displaced the device');
    MF.endMinigame(false, null); // the trip ends with no minigame open
    opened[0].opts.returnTo({ reason: 'closed' });
    assert.ok(device(), 'returnTo reopened the device');
});

test('remote sessions are listed under their link; a click opens the session; a sign-out drops the row', async () => {
    reset();
    let list = [
        { pcId: 'lena_pc', displayName: 'Lena Fox', remote: true, footholdId: 'fh1', host: 'HB-FIN-02' },
        { pcId: 'kiosk_pc', displayName: 'Kiosk', remote: true, footholdId: 'fh9', host: 'HB-KIOSK-01' },
        { pcId: 'sam_pc', displayName: 'Sam', remote: false }
    ];
    const sessions = [];
    window.pcSessions = { list: () => list };
    window.networkLinks = { open: () => {}, openSession: (pcId, opts) => sessions.push({ pcId, opts }) };
    await add(HOLDER); await add(LINK);
    await openDevice();
    assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1', 'session:lena_pc:fh1', 'session:kiosk_pc:fh9']);
    assert.match(device().root.textContent, /Remote session through Drop box link/);
    assert.match(device().root.textContent, /HB-FIN-02/);
    click('session:lena_pc:fh1');
    assert.equal(sessions[0].pcId, 'lena_pc');
    assert.equal(typeof sessions[0].opts.returnTo, 'function');

    reset();
    window.pcSessions = { list: () => list };
    window.networkLinks = { open: () => {}, openSession: () => {} };
    await add(HOLDER); await add(LINK);
    await openDevice();
    list = list.filter(s => s.pcId !== 'lena_pc');
    window.eventDispatcher.emit('pc_signed_out', { pcId: 'lena_pc' });
    assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1', 'session:kiosk_pc:fh9']);
});

test('with no networkLinks the section has no session rows, and the link row runs the item click', async () => {
    reset();
    window.pcSessions = { list: () => [{ pcId: 'lena_pc', remote: true, footholdId: 'fh1' }] };
    const clicks = [];
    window.handleObjectInteraction = (el) => clicks.push(el.scenarioData.id);
    await add(HOLDER); await add(LINK);
    await openDevice();
    assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1']);
    click('item:netlink_fh1');
    assert.deepEqual(clicks, ['netlink_fh1']);
});

test('a finding opened from the device and closed lands on the device', async () => {
    reset();
    window.handleObjectInteraction = () => MF.startMinigame('reader', null, {});
    await add(HOLDER); await add(FINDING);
    await openDevice();
    click('item:cable_capture');
    assert.ok(MF.currentMinigame instanceof Reader);
    assert.ok(log.returnArmed());
    MF.currentMinigame.complete(true);
    await settle();
    assert.ok(device(), 'back on the device');
    assert.equal(log.returnArmed(), false, 'the listener is spent');
});

test('a server check answering a tick later: the device stays open until displaced, no event on that, closing the desktop reopens it', async () => {
    reset();
    window.handleObjectInteraction = () => { setTimeout(() => MF.startMinigame('reader', null, {}), 5); };
    await add(HOLDER); await add(SESSION_ITEM);
    await openDevice();
    const events = window.eventDispatcher.log;
    click('item:records_remote_session');
    assert.ok(device(), 'still open while the check runs');
    await settle(10);
    assert.ok(MF.currentMinigame instanceof Reader, 'the desktop displaced the device');
    assert.equal(events.filter(e => e.startsWith('minigame_')).length, 0, 'displacing emits nothing');
    assert.equal(MF.started.filter(t => t === 'capture-log').length, 1, 'not reopened under the desktop');
    MF.currentMinigame.complete(false);
    await settle();
    assert.ok(device(), 'closing the desktop reopens the device');
});

test('a note opened from the desktop returns to the desktop and then to the device; never reopens under a reader', async () => {
    reset();
    window.handleObjectInteraction = () => MF.startMinigame('reader', null, {});
    await add(HOLDER); await add(SESSION_ITEM);
    await openDevice();
    click('item:records_remote_session');
    // The desktop hands a file to a reader: pendingContainerReturn is set until it returns.
    window.pendingContainerReturn = { id: 'desktop' };
    MF.startMinigame('reader', null, {});
    MF.currentMinigame.complete(true); // the note closes...
    MF.startMinigame('reader', null, {}); // ...and the notes reader reopens the desktop
    window.pendingContainerReturn = null;
    await settle();
    assert.ok(MF.currentMinigame instanceof Reader, 'on the desktop, not the device');
    assert.ok(log.returnArmed(), 'still armed');
    MF.currentMinigame.complete(false);
    await settle();
    assert.ok(device(), 'then the device');
});

test('m1: a refused unlock leaves the device open; closing it spends the listener; a later minigame does not reopen it', async () => {
    reset();
    window.handleObjectInteraction = () => {}; // refused: opens nothing
    await add(HOLDER); await add(SESSION_ITEM);
    await openDevice();
    click('item:records_remote_session');
    click('item:records_remote_session');
    assert.ok(device(), 'the device stays open');
    assert.equal(window.eventDispatcher.count('minigame_completed'), 1, 'one listener at a time');
    closeDevice();
    assert.equal(log.returnArmed(), false, "the device's own close spends it");
    MF.startMinigame('reader', null, {});
    MF.currentMinigame.complete(true);
    await settle();
    assert.equal(device(), null, 'an unrelated minigame does not reopen the device');
});

test('starting the device drops an armed listener', async () => {
    reset();
    await add(HOLDER); await add(SESSION_ITEM);
    await openDevice();
    click('item:records_remote_session');
    assert.ok(log.returnArmed());
    log.startCaptureLog(held('capture_log'));
    assert.equal(log.returnArmed(), false);
});

test('filing follows the inventory: removed items leave, the holder arriving late files, the holder leaving unfiles', async () => {
    reset();
    await add(FINDING);
    assert.equal(hidden(held('cable_capture')), false, 'no holder yet: in the tray');
    await add(HOLDER);
    assert.equal(hidden(held('cable_capture')), true, 'filed when the holder arrives');
    await openDevice();
    assert.deepEqual(keysIn('findings'), ['item:cable_capture']);
    removeFromInventory(held('cable_capture'));
    assert.ok(device().root.querySelector('[data-section="findings"]') === null, 'a removed item leaves the device');
    await add(FINDING);
    removeFromInventory(held('capture_log'));
    assert.equal(hidden(held('cable_capture')), false, 'the holder leaving shows its items again');
});

test('new marks for each key kind and the badge; a session key is the same after a reload', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    window.pcSessions = { list: () => [{ pcId: 'lena_pc', remote: true, footholdId: 'fh1' }] };
    window.networkLinks = { open: () => {}, openSession: () => {} };
    await add(HOLDER); await add(FINDING); await add(LINK);
    assert.equal(badge(), '5', 'two captures, a link, a session and a finding are new');
    await openDevice();
    assert.deepEqual(device().getTestState().captureLog.newMarks.sort(),
        ['capture:hampshire', 'capture:network_drop', 'item:cable_capture', 'item:netlink_fh1', 'session:lena_pc:fh1']);
    // R3: each new row is written as its own global (__capture_log_seen:<key> = true), not a list.
    const seenGlobals = () => Object.fromEntries(
        Object.entries(window.gameState.globalVariables).filter(([k]) => k.startsWith('__capture_log_seen:')));
    const seen = seenGlobals();
    assert.equal(seen['__capture_log_seen:session:lena_pc:fh1'], true);
    assert.equal(window.gameState.globalVariables.__capture_log_seen, undefined, 'the legacy list is never written');
    assert.equal(badge(), null, 'opened: nothing new');

    // A reload: the same per-row seen globals and inventory give the same keys, so nothing is new.
    reset({ globals: { se_captures: structuredClone(CAPTURES), ...seen },
        playerInventory: [HOLDER, FINDING, LINK] });
    window.pcSessions = { list: () => [{ pcId: 'lena_pc', remote: true, footholdId: 'fh1' }] };
    window.networkLinks = { open: () => {}, openSession: () => {} };
    processInitialInventoryItems();
    await settle();
    refreshInventoryTray();
    assert.equal(badge(), null, 'the keys survive a reload');
});

test('readSeen merges the legacy list and the per-row keys (R3)', () => {
    assert.deepEqual(model.readSeen(null), []);
    assert.deepEqual(model.readSeen({}), []);
    assert.deepEqual(model.readSeen({ __capture_log_seen: ['capture:a', 'capture:a', 7] }).sort(), ['capture:a']);
    const merged = model.readSeen({
        __capture_log_seen: ['capture:a'],
        '__capture_log_seen:item:b': true,
        '__capture_log_seen:session:c:d': true,
        '__capture_log_seen:item:off': false,
    }).sort();
    assert.deepEqual(merged, ['capture:a', 'item:b', 'session:c:d'], 'a false key is not seen');
});

test('an old save with only the legacy list shows no new badge for its rows', async () => {
    // readSeen still reads the legacy whole-list; R1's seed keeps it from being resent.
    reset({ globals: { se_captures: structuredClone(CAPTURES),
        __capture_log_seen: ['capture:hampshire', 'capture:network_drop'] } });
    await add(HOLDER);
    assert.equal(badge(), null, 'the legacy list covers both capture rows');
    await openDevice();
    assert.deepEqual(device().getTestState().captureLog.newMarks.sort(), [], 'nothing new');
    assert.equal(window.gameState.globalVariables.__capture_log_seen.length, 2, 'the legacy list is untouched');
});

test('a capture with the device closed refreshes the tray once; with it open, one write of the seen set', async () => {
    reset({ globals: { se_captures: {} } });
    await add(HOLDER);
    const d = window.eventDispatcher;
    // Closed device: the module's listener refreshes the tray once.
    const before = d.log.filter(e => e === 'inventory_changed').length;
    window.gameState.globalVariables.se_captures = { a: { targetId: 'a', kind: 'credential', at: 1 } };
    d.emit('global_variable_changed:se_captures', {});
    assert.equal(d.log.filter(e => e === 'inventory_changed').length - before, 1);
    assert.equal(badge(), '1');

    // Open device: one new row writes its own seen key once (R3), and the refresh and redraw stop.
    await openDevice();
    const writes = () => d.log.filter(e => e.startsWith('global_variable_changed:__capture_log_seen')).length;
    const w0 = writes();
    window.gameState.globalVariables.se_captures = { ...window.gameState.globalVariables.se_captures,
        b: { targetId: 'b', kind: 'credential', at: 2 } };
    d.emit('global_variable_changed:se_captures', {});
    await settle();
    assert.equal(writes() - w0, 1);
    assert.equal(window.gameState.globalVariables['__capture_log_seen:capture:b'], true, 'one key per new row');
    assert.equal(badge(), null);
});

test('capture-rows: loadCaptureSecrets awaits the sync before the request, and resolves null on a failure', async () => {
    const order = [];
    let release;
    const stateSync = { syncConfirmed: () => new Promise(r => { release = () => { order.push('synced'); r(); }; }) };
    const ApiClient = { get: async (p) => { order.push(p); return { secrets: { x: 'y' } }; } };
    const pending = rows.loadCaptureSecrets({ stateSync, ApiClient });
    await settle();
    assert.deepEqual(order, [], 'no request before the sync');
    release();
    assert.deepEqual(await pending, { x: 'y' });
    assert.deepEqual(order, ['synced', '/capture_secrets']);
    const failed = await rows.loadCaptureSecrets({ stateSync: null, ApiClient: { get: async () => { throw new Error('500'); } } });
    assert.equal(failed, null);
});

// Code review R1 M2: the remote session rows from the real pcSessions, fed the server's own
// answer shapes (login_session_answer: remote, footholdId, host only on a remote session).
test('M2: a remote sign-in and a reload through the real PcSessions list the session under its link', async () => {
    const serverAnswer = { success: true, npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'password',
        remote: true, footholdId: 'fh1', host: 'HB-FIN-02' };
    try {
        reset();
        window.ApiClient = { login: async (_pcId, body) => (body.foothold ? serverAnswer : { ...serverAnswer, remote: undefined }) };
        window.pcSessions = new PcSessions();
        window.networkLinks = { open: () => {}, openSession: () => {} };
        await add(HOLDER); await add(LINK);
        await openDevice();
        assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1']);
        const signedIn = await window.pcSessions.signIn('lena_pc', 'lfox', 'pw', { foothold: 'fh1' });
        assert.equal(signedIn.ok, true);
        await settle();
        assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1', 'session:lena_pc:fh1'], 'pc_signed_in redraws the device');
        assert.match(device().root.textContent, /HB-FIN-02/);
        assert.match(device().root.textContent, /Remote session through Drop box link/);

        // A reload: the scenario response's sessions (session_for_client), one remote, one local.
        reset();
        window.pcSessions = new PcSessions();
        window.pcSessions.load({
            lena_pc: { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'password', remote: true, footholdId: 'fh1', host: 'HB-FIN-02' },
            sam_pc: { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password' }
        }, ['lena_pc', 'sam_pc']);
        window.networkLinks = { open: () => {}, openSession: () => {} };
        await add(HOLDER); await add(LINK);
        await openDevice();
        assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1', 'session:lena_pc:fh1'], 'the local session is not listed');

        // A keyboard fetch settles the session local (the server cleared its foothold): the row goes.
        window.pcSessions.settle('lena_pc', { npcId: 'lena', via: 'password' });
        device().redraw();
        assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1']);
    } finally {
        delete window.ApiClient;
    }
});

// Code review R1 m10: a listener armed by a refused click is dropped by the next row click.
test('m10: a link row clicked after a refused unlock does not leave the return listener armed', async () => {
    reset();
    window.handleObjectInteraction = () => {}; // refused: opens nothing
    window.networkLinks = { open: () => { MF.startMinigame('reader', null, {}); }, openSession: () => {} };
    await add(HOLDER); await add(SESSION_ITEM); await add(LINK);
    await openDevice();
    click('item:records_remote_session');
    assert.ok(log.returnArmed(), 'the refused click armed it');
    click('item:netlink_fh1');
    assert.equal(log.returnArmed(), false, 'the link click dropped it');
    assert.ok(!device(), 'the network screen displaced the device');
    MF.currentMinigame.complete(true);
    await settle();
    assert.equal(device(), null, 'an ending minigame does not reopen the device through the stale listener');
});

test('a session reached from another desktop is listed last as "Remote session from {host}" (K4)', async () => {
    reset();
    window.pcSessions = { list: () => [
        { pcId: 'ops_pc', displayName: 'Ops Admin', remote: true, footholdId: null, host: 'OPS-PC', fromPcId: 'lena_pc', fromHost: 'LENA-PC' },
        { pcId: 'lena_pc', displayName: 'Lena Fox', remote: true, footholdId: 'fh1', host: 'HB-FIN-02' }
    ] };
    window.networkLinks = { open: () => {}, openSession: () => {} };
    await add(HOLDER); await add(LINK);
    await openDevice();
    assert.deepEqual(keysIn('sessions'), ['item:netlink_fh1', 'session:lena_pc:fh1', 'session:ops_pc:']);
    assert.match(device().root.textContent, /Remote session from LENA-PC/);
});

// ---- K3d (credential keyring plan 8.7): Sign-ins and Captures from the keyring answer ----------

const K3D_CAPTURES = {
    lord_qr: { targetId: 'lord_qr', kind: 'credential', roleLabel: 'Facilities', address: 's.lord', host: 'LW-FAC-01', note: 'QR look-alike', at: 1 },
    lord_keys: { targetId: 'lord_keys', kind: 'credential', roleLabel: 'Facilities', address: 's.lord', host: 'LW-FAC-01', note: 'Keylogger', at: 3 },
    stationery_pin: { targetId: 'stationery_pin', kind: 'credential', roleLabel: 'Lobby card', host: 'Stationery cupboard keypad', at: 2 }
};
const K3D_ANSWER = {
    rev: 'r1',
    entries: [
        { id: 'pw_lord', kind: 'password', source: 'registry', label: 'facilities_notes.txt', foundIn: 'facilities_notes', how: 'found',
            account: { npcId: 'lord', displayName: 'Sam Lord', username: 's.lord' } },
        { id: 'rdp_fin', kind: 'saved_connection', source: 'registry', label: 'FIN-02.rdp', heldItem: 'rdp_fin_item', how: 'given',
            host: 'HB-FIN-02', account: { npcId: 'lena', displayName: 'Lena Fox', username: 'lfox' } },
        { id: 'cap_lord_qr', kind: 'password', source: 'capture', account: { npcId: 'lord' } }
    ],
    captures: {
        lord_qr: { tag: 'password', source: 'phished', account: 'lord' },
        lord_keys: { tag: 'password', source: 'recorded', account: 'lord' },
        stationery_pin: { tag: 'pin', source: 'recorded' }
    }
};

/** The real Keyring (systems/keyring.js) over a stub GET /keyring. */
function stubKeyring(answer) {
    const calls = [];
    const box = { answer };
    window.ApiClient = { keyring: async (pcId, opts) => { calls.push({ pcId, rev: opts?.rev ?? null }); return structuredClone(box.answer); } };
    return { calls, box };
}
const headings = () => [...device().root.querySelectorAll('.capture-log-heading')].map(n => n.textContent);
const banner = (section) => device().root.querySelector(`[data-section="${section}"] .capture-log-banner`)?.textContent ?? null;
const rowText = (key) => device().root.querySelector(`[data-key="${key}"]`)?.textContent ?? '';
const tagsOf = (key) => [...device().root.querySelectorAll(`[data-key="${key}"] .signin-row-tag`)].map(n => n.textContent);

test('K3d: the device asks GET /keyring on open (no credentials declared) and builds Sign-ins and Captures from it', async () => {
    reset({ globals: { se_captures: structuredClone(K3D_CAPTURES) } });
    const { calls } = stubKeyring(K3D_ANSWER);
    api.get = async () => ({ secrets: { lord_qr: 'Facilities!7', stationery_pin: '4471' } });
    await add(HOLDER);
    await openDevice();
    await settle(5);
    assert.equal(calls.length, 1, 'one background GET /keyring on open');
    assert.equal(calls[0].pcId, null, 'the no-screen ask');
    assert.deepEqual(headings(), ['Sign-ins', 'Captures']);
    assert.match(banner('signins'), /^Sign-ins captured or found\./);
    assert.equal(banner('captures'), 'PINs, footholds and findings this engagement has recorded.');
    // One row per account (two captures), one per connecting entry; the file waits until opened
    assert.deepEqual(keysIn('signins'), ['account:lord', 'cred:rdp_fin']);
    assert.deepEqual(keysIn('captures'), ['capture:stationery_pin'], 'a PIN is a capture row, never a sign-in');
    assert.deepEqual(tagsOf('account:lord'), ['Captured password', 'Phished', 'Recorded']);
    assert.deepEqual(tagsOf('cred:rdp_fin'), ['Saved connection', 'Given']);
    assert.match(rowText('account:lord'), /Facilities!7/, 'the oldest capture with a served value');
    assert.match(rowText('account:lord'), /QR look-alike.*Keylogger/, 'both notes, oldest first');
    assert.match(rowText('cred:rdp_fin'), /Connect FIN-02\.rdp from your inventory\./);
    assert.match(rowText('capture:stationery_pin'), /Stationery cupboard keypad: 4471/);
    assert.deepEqual(tagsOf('capture:stationery_pin'), ['Captured PIN'], 'no source tag on a capture row');
    const state = device().getTestState().captureLog;
    assert.deepEqual(state.signins.map(r => r.key), ['account:lord', 'cred:rdp_fin']);
    assert.deepEqual(state.captures.map(r => r.key), ['capture:stationery_pin']);

    // The registry password's file is opened in this page: the account row gains its tag and line
    window.keyring.noteOpened('facilities_notes');
    device().redraw();
    assert.deepEqual(tagsOf('account:lord'), ['Captured password', 'Password in a file', 'Phished', 'Recorded', 'Found']);
    assert.match(rowText('account:lord'), /Also in facilities_notes\.txt\./);
    assert.deepEqual(keysIn('signins'), ['account:lord', 'cred:rdp_fin'], 'still one row and one key for the account');
});

test('K3d: the Captures section is hidden when it has no row; without revealSecret the Sign-ins banner is the awareness line', async () => {
    reset({ globals: { se_captures: { lord_qr: structuredClone(K3D_CAPTURES.lord_qr) } }, social: { captures: { revealSecret: false } } });
    stubKeyring({ rev: 'r2', entries: [], captures: { lord_qr: { tag: 'password', source: 'phished', account: 'lord' } } });
    await add(HOLDER);
    await openDevice();
    await settle(5);
    assert.deepEqual(headings(), ['Sign-ins']);
    assert.ok(device().root.querySelector('[data-section="captures"]') === null);
    assert.equal(banner('signins'), rows.captureBannerText(false));
    assert.doesNotMatch(device().root.textContent, /Facilities!7/);
});

test('K3d: before the first answer the rows come from the globals, keyed by capture; the account row then reads as seen', async () => {
    reset({ globals: { se_captures: structuredClone(K3D_CAPTURES) } });
    await add(HOLDER);
    // No window.ApiClient: the keyring cannot answer, so the tags are guessed from the kind
    assert.equal(badge(), '3', 'three capture rows before any answer');
    await openDevice();
    await settle(5);
    assert.deepEqual(keysIn('signins'), ['capture:lord_qr', 'capture:stationery_pin', 'capture:lord_keys']);
    const seenWrites = () => Object.keys(window.gameState.globalVariables).filter(k => k.startsWith('__capture_log_seen:')).sort();
    assert.deepEqual(seenWrites(), ['__capture_log_seen:capture:lord_keys', '__capture_log_seen:capture:lord_qr',
        '__capture_log_seen:capture:stationery_pin']);
    closeDevice();

    // The answer arrives: the two Lord captures are one account row, seen under their old keys
    stubKeyring(K3D_ANSWER);
    await window.keyring.fetch(null);
    await settle();
    assert.equal(badge(), '1', 'only the new saved connection is new');
    await openDevice();
    await settle(5);
    assert.deepEqual(device().getTestState().captureLog.newMarks, ['cred:rdp_fin']);
    assert.ok(!seenWrites().includes('__capture_log_seen:account:lord'), 'an account seen under an old key writes nothing');
    assert.ok(seenWrites().includes('__capture_log_seen:cred:rdp_fin'));
});

test('K3d: keyring_changed re-badges the tray and redraws the open device; New marks stay while it is open', async () => {
    reset({ globals: { se_captures: { lord_qr: structuredClone(K3D_CAPTURES.lord_qr) } } });
    const { box } = stubKeyring({ rev: 'r3', entries: [], captures: { lord_qr: { tag: 'password', source: 'phished', account: 'lord' } } });
    await add(HOLDER);
    await openDevice();
    await settle(5);
    assert.deepEqual(keysIn('signins'), ['account:lord']);
    assert.deepEqual(device().getTestState().captureLog.newMarks, ['account:lord']);
    const emitted = () => window.eventDispatcher.log.filter(e => e === 'keyring_changed').length;
    const before = emitted();
    box.answer = { ...K3D_ANSWER, rev: 'r4', entries: [K3D_ANSWER.entries[1]] };
    await window.keyring.fetch(null);
    await settle();
    assert.equal(emitted() - before, 1, 'a new rev emits keyring_changed');
    assert.deepEqual(keysIn('signins'), ['account:lord', 'cred:rdp_fin'], 'the open device redrew in place');
    assert.deepEqual(device().getTestState().captureLog.newMarks.sort(), ['account:lord', 'cred:rdp_fin'],
        'the first row keeps its New mark through the redraw');
    closeDevice();
    box.answer = { ...K3D_ANSWER, rev: 'r5', entries: K3D_ANSWER.entries.slice(1) };
    window.eventDispatcher.log.length = 0;
    await window.keyring.fetch(null);
    assert.equal(badge(), null, 'nothing new to count: the device saw both');
    box.answer = { rev: 'r6', entries: [...K3D_ANSWER.entries, { id: 'rdp_two', kind: 'saved_connection', label: 'TWO.rdp', heldItem: 'x', how: 'found' }],
        captures: K3D_ANSWER.captures };
    await window.keyring.fetch(null);
    assert.equal(badge(), '1', 'a closed device re-badges on keyring_changed');
});

test('K3d: a new capture with a capture log held asks GET /keyring again', async () => {
    reset({ globals: { se_captures: {} } });
    const { calls } = stubKeyring({ rev: 'r7', entries: [], captures: {} });
    await add(HOLDER);
    window.gameState.globalVariables.se_captures = { lord_qr: structuredClone(K3D_CAPTURES.lord_qr) };
    window.eventDispatcher.emit('global_variable_changed:se_captures', {});
    await settle(5);
    assert.equal(calls.length, 1);
});

test('K3d R2: a failed ask after a new capture is retried once after a short wait', async () => {
    reset({ globals: { se_captures: {} } });
    const calls = [];
    let fail = true;
    window.ApiClient = { keyring: async (pcId, opts) => {
        calls.push(pcId);
        if (fail) { fail = false; throw new Error('network down'); }
        return { rev: 'r8', entries: [], captures: {} };
    } };
    await add(HOLDER);
    window.gameState.globalVariables.se_captures = { lord_qr: structuredClone(K3D_CAPTURES.lord_qr) };
    window.eventDispatcher.emit('global_variable_changed:se_captures', {});
    await settle(5);
    assert.equal(calls.length, 1, 'the first ask failed');
    await new Promise((r) => setTimeout(r, 2200));
    assert.equal(calls.length, 2, 'one retry follows, and a good answer needs no more');
    await new Promise((r) => setTimeout(r, 2200));
    assert.equal(calls.length, 2);
});

test('K5: a live token row names its link and minutes, and the open log steps them each minute with no request', async () => {
    reset({ globals: { se_captures: {} } });
    const TOKEN = { id: 'lena_tok', kind: 'token', source: 'registry', label: 'HB-FIN-02 sign-in token', host: 'HB-FIN-02', connectsTo: 'lena_pc',
        routes: [{ foothold: 'fh1' }], expiresInS: 245, account: { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox' } };
    const { calls } = stubKeyring({ rev: 'r9', entries: [TOKEN], captures: {} });
    const made = [];
    const cleared = [];
    const realSet = globalThis.setInterval;
    const realClear = globalThis.clearInterval;
    globalThis.setInterval = (fn, ms) => { const h = { fn, ms }; made.push(h); return h; };
    globalThis.clearInterval = (h) => { cleared.push(h); };
    try {
        await add(HOLDER);
        await add(LINK);
        await window.keyring.fetch(null);
        await openDevice();
        await settle(5);
        assert.match(rowText('cred:lena_tok'), /Use it on HB-FIN-02's sign-in screen, through Drop box link\. About 5 min left\./);
        const timer = made.find(h => h.ms === log.TOKEN_ROW_REFRESH_MS);
        assert.ok(timer, 'a minute timer runs while the log is open');
        assert.equal(log.TOKEN_ROW_REFRESH_MS, 10000);
        const asked = calls.length;
        // A minute later by the page's clock
        window.keyring.tokenEndsAt.set('lena_tok', Date.now() + 185_000);
        timer.fn();
        assert.match(rowText('cred:lena_tok'), /About 4 min left\./, 'redrawn from the client timer');
        window.keyring.tokenEndsAt.set('lena_tok', Date.now() + 30_000);
        timer.fn();
        assert.match(rowText('cred:lena_tok'), /Under a minute left\./);
        assert.equal(calls.length, asked, 'no GET for the step');
        closeDevice();
        assert.ok(cleared.includes(timer), 'the timer stops when the log closes');
    } finally {
        globalThis.setInterval = realSet;
        globalThis.clearInterval = realClear;
    }
});

test('K5 R1 m1/m2: the row steps on the token\'s own minute boundary, redraws only on a change, and greys at 0 s', async () => {
    reset({ globals: { se_captures: {} } });
    const TOKEN = { id: 'lena_tok', kind: 'token', source: 'registry', label: 'HB-FIN-02 sign-in token', host: 'HB-FIN-02', connectsTo: 'lena_pc',
        routes: [{ foothold: 'fh1' }], expiresInS: 125, account: { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox' } };
    const { calls } = stubKeyring({ rev: 'r9', entries: [TOKEN], captures: {} });
    const made = [];
    const realSet = globalThis.setInterval;
    const realClear = globalThis.clearInterval;
    globalThis.setInterval = (fn, ms) => { const h = { fn, ms }; made.push(h); return h; };
    globalThis.clearInterval = () => {};
    try {
        await add(HOLDER);
        await add(LINK);
        await window.keyring.fetch(null);
        await openDevice();
        await settle(5);
        assert.match(rowText('cred:lena_tok'), /About 3 min left\./);
        const timer = made.find(h => h.ms === log.TOKEN_ROW_REFRESH_MS);
        const redraws = [];
        const scene = device();
        const realRedraw = scene.redraw.bind(scene);
        scene.redraw = () => { redraws.push(1); return realRedraw(); };
        const asked = calls.length;
        // 65 s left: still "about 2 min"; a tick changes nothing and redraws nothing
        window.keyring.tokenEndsAt.set('lena_tok', Date.now() + 65_000);
        timer.fn();
        assert.equal(redraws.length, 1, 'the 3 to 2 step redraws once');
        assert.match(rowText('cred:lena_tok'), /About 2 min left\./);
        timer.fn();
        assert.equal(redraws.length, 1, 'no change, no redraw');
        // 59 s left (the mount was at 125 s): the next tick already says under a minute
        window.keyring.tokenEndsAt.set('lena_tok', Date.now() + 59_000);
        timer.fn();
        assert.match(rowText('cred:lena_tok'), /Under a minute left\./);
        // 0 s: greyed locally, no GET
        window.keyring.tokenEndsAt.set('lena_tok', Date.now());
        timer.fn();
        assert.match(rowText('cred:lena_tok'), /HB-FIN-02 sign-in token has expired\./);
        assert.equal(calls.length, asked, 'no request for the step or the grey');
        closeDevice();
    } finally {
        globalThis.setInterval = realSet;
        globalThis.clearInterval = realClear;
    }
});

test('a capture made just before the tablet opens reads Loading... then the value, never bullets', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    let release;
    api.get = () => new Promise((res) => { release = () => res({ secrets: { hampshire: 'Recruit-2026' } }); });
    await add(HOLDER);
    await openDevice();
    await settle();
    const text = () => device().root.querySelector('.lpb-captures-secret')?.textContent;
    assert.equal(text(), 'Loading...', 'while the fetch is outstanding');
    release();
    await settle(5);
    assert.equal(text(), 'Recruit-2026');
    closeDevice();
});

test('a capture the first answer lacks is asked for again and shows once served', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    log.CaptureLogMinigame.secretRetryMs = 5;
    let n = 0;
    api.get = async () => (++n < 3 ? { secrets: {} } : { secrets: { hampshire: 'Recruit-2026' } });
    await add(HOLDER);
    await openDevice();
    await settle(2);
    assert.equal(device().root.querySelector('.lpb-captures-secret').textContent, 'Loading...');
    await settle(40);
    assert.equal(device().root.querySelector('.lpb-captures-secret').textContent, 'Recruit-2026');
    log.CaptureLogMinigame.secretRetryMs = 1500;
    closeDevice();
});

test('when /capture_secrets keeps failing the row says Could not load, not bullets', async () => {
    reset({ globals: { se_captures: structuredClone(CAPTURES) } });
    log.CaptureLogMinigame.secretRetryMs = 3;
    api.get = async () => { throw new Error('boom'); };
    const warn = console.warn; console.warn = () => {};
    await add(HOLDER);
    await openDevice();
    await settle(60);
    console.warn = warn;
    assert.equal(device().root.querySelector('.lpb-captures-secret').textContent, 'Could not load');
    log.CaptureLogMinigame.secretRetryMs = 1500;
    closeDevice();
});

// ---- S7 review R1-C5: the answer the device hands the row builder carries the keyring's crack clock ----
test('R1-C5: keyringAnswer() passes the real keyring crackSecondsLeft through', () => {
    window.keyring = new Keyring();
    const hash = { id: 'h1', kind: 'hash', source: 'registry', token: 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q', status: 'running', readyInSeconds: 60,
        account: { npcId: 'dana', username: 'dana.k' } };
    window.keyring.remember(Keyring.cacheKey(null), { rev: 'r1', entries: [hash], captures: {} });
    const a = log.keyringAnswer();
    assert.equal(typeof a.crackSecondsLeft, 'function');
    assert.equal(a.crackSecondsLeft('h1'), window.keyring.crackSecondsLeft('h1'));
    assert.ok(a.crackSecondsLeft('h1') <= 60 && a.crackSecondsLeft('h1') > 55);
});

test('R1-C15: a hash record has its own Hashes section, not the Sign-ins one', async () => {
    reset({ globals: { se_captures: structuredClone(K3D_CAPTURES) } });
    const hash = { id: 'h1', kind: 'hash', source: 'registry', token: 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q', status: 'ready',
        account: { npcId: 'dana', username: 'dana.k', displayName: 'Dana K' } };
    stubKeyring({ ...K3D_ANSWER, entries: [...K3D_ANSWER.entries, hash] });
    api.get = async () => ({ secrets: {} });
    await add(HOLDER);
    await openDevice();
    await settle(5);
    assert.ok(headings().includes('Hashes'));
    const root = device().root;
    assert.ok(root.querySelector('[data-section="hashes"] [data-key="hash:h1"]'));
    assert.equal(root.querySelector('[data-section="signins"] [data-key="hash:h1"]'), null);
    assert.ok(headings().indexOf('Hashes') > headings().indexOf('Sign-ins'));
    while (MF.currentMinigame) MF.endMinigame(false, null);
});
