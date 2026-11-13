// Slice 9.3a step 7 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.1, 13.4): items the
// server has already added or removed. showServerItem shows one with no inventory request;
// syncInventoryFromServer adds and removes only what differs, for the ids passed. Each ends
// with one tray refresh (engine plan 5c), so a link item whose storeIn names a held holder
// is filed by the storeIn rule. An add from a share opened in the network view sends
// source_resource_id.
// Run with: node test/js/inventory-server-items.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-server-items-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
const stub = (out, code) => { writeFileSync(join(dir, out), code); };

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const inventoryUrl = copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]);

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { addToInventory, initializeInventory, registerTrayRule, showServerItem, syncInventoryFromServer,
    TRAY_HIDDEN_CLASS } = await import(inventoryUrl);

let requests, toasts, events, offs;
async function reset() {
    for (const off of offs || []) off();
    offs = [];
    requests = [];
    toasts = [];
    events = [];
    globalThis.fetch = async (url, opts) => {
        const body = JSON.parse(opts?.body || '{}');
        // initializeInventory's notepad is the one add every test starts with
        if (body?.item?.type !== 'notepad') requests.push({ url, body });
        return { json: async () => ({ success: true }) };
    };
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = item => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = (...a) => toasts.push(a);
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    window.gameScenario = {};
    initializeInventory();
    // let the notepad's own add finish before a test counts refreshes
    for (let i = 0; i < 3; i++) await new Promise(r => setTimeout(r, 0));
}
const settle = () => new Promise(r => setTimeout(r, 0));
const held = id => window.inventory.items.find(it => it.scenarioData?.id === id);
const hidden = el => el.parentElement.classList.contains(TRAY_HIDDEN_CLASS);
const refreshes = () => events.filter(e => e.name === 'inventory_changed').length;

// The capture log's rule (engine plan section 6): filed in the held holder whose id is the storeIn
const storeInRule = (item, items) => {
    const sid = item.scenarioData?.storeIn;
    if (!sid) return null;
    return items.some(it => it.scenarioData?.id === sid && it.scenarioData?.holds) ? { hidden: true, holderId: sid } : null;
};

const box = { type: 'pc', id: 'kit_dropbox', name: 'Network drop box', sprite: 'drop_box1', takeable: true, rogueDevice: true };
const link = { id: 'netlink_jack_comms_port', type: 'network_link', name: 'Drop box: comms room', sprite: 'drop_box1',
    takeable: false, footholdId: 'jack_comms_port', sourceId: 'comms_port',
    observations: 'Your Network drop box on Spare wall port. Open it to see what it reaches.' };
const lockpick = { type: 'lockpick', id: 'lockpick', name: 'Lockpick set' };
const holder = { type: 'capture_log', id: 'capture_log', name: 'Capture log', holds: { items: true } };

test('showServerItem adds the item with no inventory request and one tray refresh', async () => {
    await reset();
    const before = refreshes();
    assert.equal(showServerItem(link), true);
    await settle();
    assert.ok(held(link.id), 'the link item is in the tray');
    assert.deepEqual(requests, [], 'no POST /inventory');
    assert.equal(refreshes(), before + 1, 'exactly one refresh');
    assert.equal(held(link.id).scenarioData.type, 'network_link');
    assert.ok(held(link.id).src.endsWith('/drop_box1.png'), 'the planted device\'s own sprite');
    assert.equal(events.filter(e => e.name.startsWith('item_picked_up') && e.name !== 'item_picked_up:notepad').length, 0, 'not a pickup');
});

test('a device given back by the server runs no onPickup and emits no item_picked_up', async () => {
    await reset();
    window.gameState.globalVariables.box_taken = false;
    showServerItem({ ...box, onPickup: { setVariable: { box_taken: true } } });
    assert.ok(held('kit_dropbox'));
    assert.equal(window.gameState.globalVariables.box_taken, false);
    assert.equal(events.filter(e => e.name.startsWith('item_picked_up') && e.name !== 'item_picked_up:notepad').length, 0);
});

test('showServerItem leaves an item the tray already holds alone', async () => {
    await reset();
    showServerItem(link);
    const n = window.inventory.items.length;
    assert.equal(showServerItem(link), false);
    assert.equal(window.inventory.items.length, n);
    assert.equal(toasts.filter(t => /Already/.test(t[0])).length, 0, 'no "Already in inventory" toast');
});

test('syncInventoryFromServer adds and removes only what differs, for the ids passed', async () => {
    await reset();
    await addToInventory({ name: 'pc', objectId: 'obj_box', scenarioData: { ...box } });
    await addToInventory({ name: 'lockpick', objectId: 'obj_pick', scenarioData: { ...lockpick } });
    requests.length = 0;
    const before = refreshes();
    // The plant's answer: the box gone, the link item in, the lockpick (not named) untouched
    const out = syncInventoryFromServer([lockpick, link], ['kit_dropbox', link.id]);
    assert.deepEqual(out, { added: [link.id], removed: ['kit_dropbox'] });
    assert.equal(held('kit_dropbox'), undefined);
    assert.ok(held(link.id));
    assert.ok(held('lockpick'));
    assert.equal(requests.length, 0, 'no request for either change');
    assert.equal(refreshes(), before + 1, 'one refresh for the whole batch');
    // An item the list lacks but whose id was not passed stays
    syncInventoryFromServer([link], [link.id]);
    assert.ok(held('lockpick'));
    // Nothing differs: nothing changes
    const again = syncInventoryFromServer([lockpick, link], ['kit_dropbox', link.id]);
    assert.deepEqual(again, { added: [], removed: [] });
});

test('the unplug answer: the link item leaves and the device comes back', async () => {
    await reset();
    showServerItem(link);
    const out = syncInventoryFromServer([box], [link.id, 'kit_dropbox']);
    assert.deepEqual(out, { added: ['kit_dropbox'], removed: [link.id] });
    assert.equal(window.inventory.items.filter(it => it.scenarioData?.id === 'kit_dropbox').length, 1);
    assert.equal(requests.length, 0);
});

test('a link item whose storeIn names a held holder is filed, and announced as an arrival', async () => {
    await reset();
    offs.push(registerTrayRule(storeInRule));
    await addToInventory({ name: 'capture_log', objectId: 'obj_log', scenarioData: { ...holder } });
    toasts.length = 0;
    showServerItem({ ...link, storeIn: 'capture_log' });
    assert.equal(hidden(held(link.id)), true, 'filed in the capture log');
    assert.deepEqual(toasts, [['Added to Capture log: Drop box: comms room', 'info', '', 3000]]);
});

test('a link item with storeIn and no holder held stays in the tray', async () => {
    await reset();
    offs.push(registerTrayRule(storeInRule));
    showServerItem({ ...link, storeIn: 'capture_log' });
    assert.equal(hidden(held(link.id)), false);
});

test('a restored handle (restored: true) is filed with no toast', async () => {
    await reset();
    offs.push(registerTrayRule(storeInRule));
    await addToInventory({ name: 'capture_log', objectId: 'obj_log', scenarioData: { ...holder } });
    toasts.length = 0;
    showServerItem({ ...link, storeIn: 'capture_log' }, { restored: true });
    assert.equal(hidden(held(link.id)), true);
    assert.deepEqual(toasts, []);
});

test('an add from a share opened in the view sends source_resource_id; one from a desktop still sends source_pc_id', async () => {
    await reset();
    const letter = { type: 'text_file', id: 'starter_letter', name: 'Welcome letter', takeable: true };
    await addToInventory({ name: 'text_file', objectId: 'obj_letter', scenarioData: { ...letter },
        sourceResourceId: 'scanned_inbox', transfer: 'copy' });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.source_resource_id, 'scanned_inbox');
    assert.equal(requests[0].body.transfer, 'copy');
    assert.equal(requests[0].body.source_pc_id, undefined);
    const picked = events.find(e => e.name === 'item_picked_up:text_file');
    assert.equal(picked.data.sourceResourceId, 'scanned_inbox');

    const note = { type: 'text_file', id: 'handover_note', name: 'IT handover', takeable: true };
    await addToInventory({ name: 'text_file', objectId: 'obj_note', scenarioData: { ...note }, sourcePcId: 'lena_pc' });
    assert.equal(requests[1].body.source_pc_id, 'lena_pc');
    assert.equal(requests[1].body.source_resource_id, undefined);
});
