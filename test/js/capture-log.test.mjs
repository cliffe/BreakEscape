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
copy('minigames/framework/base-minigame.js');
copy('minigames/capture-log/capture-log-model.js');
copy('minigames/capture-log/capture-rows.js');
copy('minigames/capture-log/capture-log-minigame.js');
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
const closeDevice = () => device().container.querySelector('#minigame-cancel').click();

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
    assert.deepEqual(keysIn('captures'), ['capture:network_drop', 'capture:hampshire'], 'oldest first');
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
    assert.deepEqual(order, ['sync', '/capture_secrets']);
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
    assert.equal(device().root.querySelector('[data-section="findings"]'), null, 'a removed item leaves the device');
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
    const seen = window.gameState.globalVariables.__capture_log_seen;
    assert.ok(seen.includes('session:lena_pc:fh1'));
    assert.equal(badge(), null, 'opened: nothing new');

    // A reload: the same saved globals and inventory give the same keys, so nothing is new.
    reset({ globals: { se_captures: structuredClone(CAPTURES), __capture_log_seen: seen },
        playerInventory: [HOLDER, FINDING, LINK] });
    window.pcSessions = { list: () => [{ pcId: 'lena_pc', remote: true, footholdId: 'fh1' }] };
    window.networkLinks = { open: () => {}, openSession: () => {} };
    processInitialInventoryItems();
    await settle();
    refreshInventoryTray();
    assert.equal(badge(), null, 'the keys survive a reload');
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

    // Open device: one capture writes __capture_log_seen once, and the refresh and redraw stop.
    await openDevice();
    const writes = () => d.log.filter(e => e === 'global_variable_changed:__capture_log_seen').length;
    const w0 = writes();
    window.gameState.globalVariables.se_captures = { ...window.gameState.globalVariables.se_captures,
        b: { targetId: 'b', kind: 'credential', at: 2 } };
    d.emit('global_variable_changed:se_captures', {});
    await settle();
    assert.equal(writes() - w0, 1);
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
