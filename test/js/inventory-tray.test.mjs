// Engine plan 5c: the tray refresh. The tray is never rebuilt from state;
// refreshInventoryTray() decorates the slots that exist (a hidden class and a
// badge) from rules registered with registerTrayRule, and says "Added to
// <holder>: <item>" for an item that arrives and is filed. Hiding never removes
// an element from window.inventory.items, so "does the player hold X" holds.
// Run with: node test/js/inventory-tray.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-tray-'));
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
const inv = await import(inventoryUrl);
const { addToInventory, removeFromInventory, processInitialInventoryItems,
    initializeInventory, refreshInventoryTray, registerTrayRule, trayStateOf, TRAY_HIDDEN_CLASS } = inv;

let toasts, events, unregisters;
function reset({ playerInventory, startItemsInInventory } = {}) {
    for (const off of unregisters || []) off();
    unregisters = [];
    toasts = [];
    events = [];
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = item => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.addNote = () => null;
    window.gameAlert = (...a) => toasts.push(a);
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    window.gameScenario = { playerInventory, startItemsInInventory };
    initializeInventory();
}
const rule = fn => { const off = registerTrayRule(fn); unregisters.push(off); return off; };
const settle = () => new Promise(r => setTimeout(r, 0));
const held = id => window.inventory.items.find(it => it.scenarioData?.id === id);
const hidden = el => el.parentElement.classList.contains(TRAY_HIDDEN_CLASS);
const badgeOf = el => el.parentElement.querySelector('.tray-badge')?.textContent ?? null;
const add = data => addToInventory({ name: data.type, objectId: `obj_${data.id}`, scenarioData: { ...data } });
const changed = () => events.filter(e => e.name === 'inventory_changed').length;

// The section 6 rule: an item is filed in the held holder whose id equals its storeIn
const storeInRule = (item, items) => {
    const sid = item.scenarioData?.storeIn;
    if (!sid) return null;
    return items.some(it => it.scenarioData?.id === sid && it.scenarioData?.holds) ? { hidden: true, holderId: sid } : null;
};

const holder = { type: 'capture_log', id: 'capture_log', name: 'Capture log', holds: { items: true } };
const finding = { type: 'text_file', id: 'cable_capture', name: 'Juice-jack capture', storeIn: 'capture_log' };
const lockpick = { type: 'lockpick', id: 'lockpick', name: 'Lockpick set' };

test('the refresh runs after an add and files a new item, which keeps its element', async () => {
    reset();
    rule(storeInRule);
    await add(holder);
    const before = changed();
    await add(finding);
    assert.ok(changed() > before, 'inventory_changed on the add');
    const el = held('cable_capture');
    assert.ok(el, 'the filed item is still in window.inventory.items');
    assert.ok(el.isConnected, 'and its element is still in the page');
    assert.equal(hidden(el), true);
    assert.deepEqual(trayStateOf(el), { hidden: true, holderId: 'capture_log' });
    assert.equal(hidden(held('capture_log')), false);
});

test('"Added to" toast on a filed arrival, in place of the pulse', async () => {
    reset();
    rule(storeInRule);
    await add(holder);
    toasts.length = 0;
    await add(finding);
    assert.deepEqual(toasts, [['Added to Capture log: Juice-jack capture', 'info', '', 3000]]);
    assert.equal(held('cable_capture').parentElement.classList.contains('pulse'), false);
    await add(lockpick);
    assert.equal(toasts.length, 1, 'an unfiled item gets no toast');
    assert.equal(held('lockpick').parentElement.classList.contains('pulse'), true);
});

test('the refresh runs after a remove: the holder leaving shows its items again', async () => {
    reset();
    rule(storeInRule);
    await add(holder);
    await add(finding);
    assert.equal(hidden(held('cable_capture')), true);
    const n = changed();
    assert.equal(removeFromInventory(held('capture_log')), true);
    assert.ok(changed() > n);
    assert.equal(hidden(held('cable_capture')), false);
    assert.deepEqual(trayStateOf(held('cable_capture')), {});
});

test('restore: start items with storeIn delivered as playerInventory (a new game) are filed with no toast', async () => {
    reset({ playerInventory: [holder, finding, lockpick] });
    rule(storeInRule);
    toasts.length = 0;
    processInitialInventoryItems();
    await settle();
    assert.equal(hidden(held('cable_capture')), true);
    assert.equal(hidden(held('lockpick')), false);
    assert.deepEqual(toasts, [], 'a restored item is not an arrival');
    assert.equal(held('cable_capture').parentElement.classList.contains('pulse'), false);
});

test('a rule registered after the restore files what is already held, with no toast', async () => {
    reset({ playerInventory: [finding, holder] });
    processInitialInventoryItems();
    await settle();
    assert.equal(hidden(held('cable_capture')), false, 'no rule yet');
    toasts.length = 0;
    const n = changed();
    rule(storeInRule);
    assert.equal(changed(), n + 1, 'registering runs one refresh');
    assert.equal(hidden(held('cable_capture')), true);
    assert.deepEqual(toasts, []);
});

test('an item that arrives before its holder is filed when the holder arrives, with no toast', async () => {
    reset();
    rule(storeInRule);
    await add(finding);
    assert.equal(hidden(held('cable_capture')), false);
    toasts.length = 0;
    await add(holder);
    assert.equal(hidden(held('cable_capture')), true);
    assert.deepEqual(toasts, [], 'the finding did not arrive at this refresh');
});

test('a replaced inventory: what left is gone, what arrived is filed and announced', async () => {
    reset({ playerInventory: [holder, finding] });
    rule(storeInRule);
    processInitialInventoryItems();
    await settle();
    toasts.length = 0;
    // The server's answer replaces the list (9.3's syncInventoryFromServer): one
    // item goes, another comes, and the refresh runs at the end.
    const gone = held('cable_capture');
    window.inventory.items.splice(window.inventory.items.indexOf(gone), 1);
    gone.parentElement.remove();
    const link = { type: 'network_link', id: 'dropbox_link', name: 'Drop box link', storeIn: 'capture_log' };
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    const el = document.createElement('img');
    el.scenarioData = link;
    slot.appendChild(el);
    document.getElementById('inventory-container').appendChild(slot);
    window.inventory.items.push(el);
    refreshInventoryTray();
    assert.equal(held('cable_capture'), undefined);
    assert.equal(hidden(el), true);
    assert.deepEqual(toasts, [['Added to Capture log: Drop box link', 'info', '', 3000]]);
    refreshInventoryTray();
    assert.equal(toasts.length, 1, 'a second refresh is not a second arrival');
});

test('hiding never removes an element: a requiresItem-style check still finds the item', async () => {
    reset();
    rule(() => ({ hidden: true }));
    await add(lockpick);
    const el = held('lockpick');
    assert.equal(hidden(el), true);
    assert.ok(window.inventory.items.includes(el));
    assert.ok(window.inventory.items.some(it => it.scenarioData?.type === 'lockpick'));
    assert.ok(el.isConnected);
});

test('two rules setting the same field: the first registered wins, per field', async () => {
    reset();
    rule(item => item.scenarioData?.id === 'capture_log' ? { badge: 3 } : { hidden: false });
    rule(item => item.scenarioData?.id === 'capture_log' ? { badge: 9, hidden: true } : { hidden: true, holderId: 'x' });
    await add(holder);
    await add(lockpick);
    assert.equal(badgeOf(held('capture_log')), '3');
    assert.equal(hidden(held('capture_log')), true, 'hidden came only from the second rule');
    assert.equal(hidden(held('lockpick')), false, 'the first rule set hidden: false');
    assert.equal(trayStateOf(held('lockpick')).holderId, 'x');
});

test('the badge: drawn, updated, and removed at 0', async () => {
    reset();
    let count = 2;
    rule(item => item.scenarioData?.id === 'capture_log' ? { badge: count } : null);
    await add(holder);
    const el = held('capture_log');
    assert.equal(badgeOf(el), '2');
    count = 5;
    refreshInventoryTray();
    assert.equal(badgeOf(el), '5');
    assert.equal(el.parentElement.querySelectorAll('.tray-badge').length, 1);
    count = 0;
    refreshInventoryTray();
    assert.equal(badgeOf(el), null);
});

test('one inventory_changed per refresh, and a rule that throws does not break the tray', async () => {
    reset();
    rule(() => { throw new Error('bad rule'); });
    rule(storeInRule);
    await add(holder);
    await add(finding);
    assert.equal(hidden(held('cable_capture')), true);
    const n = changed();
    refreshInventoryTray();
    assert.equal(changed(), n + 1);
});

test('a refresh called from inside a rule walks again instead of nesting', async () => {
    reset();
    let calls = 0;
    rule(() => { if (calls++ === 0) refreshInventoryTray(); return null; });
    await add(lockpick);
    const n = changed();
    calls = 0;
    refreshInventoryTray();
    assert.equal(changed(), n + 1, 'one refresh, one event');
});

test('unregistering a rule refreshes: its items show again', async () => {
    reset();
    const off = rule(storeInRule);
    await add(holder);
    await add(finding);
    assert.equal(hidden(held('cable_capture')), true);
    off();
    assert.equal(hidden(held('cable_capture')), false);
});

// Sync deltas P2 (SYNC_DELTAS_PLAN 4.6): applyInventoryDelta reconciles the tray from a
// network route's added/removed answer, in one deferred batch.
test('applyInventoryDelta adds and removes by id, ignores a repeat, and runs one refresh', async () => {
    reset();
    await add(lockpick);
    const before = changed();
    const link = { id: 'netlink_a', type: 'network_link', name: 'Link' };
    const out = inv.applyInventoryDelta({ added: [link], removed: ['lockpick'] });
    assert.deepEqual(out, { added: ['netlink_a'], removed: ['lockpick'] });
    assert.ok(held('netlink_a'), 'the added item is in the tray');
    assert.ok(!held('lockpick'), 'the removed item is gone');
    assert.equal(changed(), before + 1, 'one tray refresh for the whole batch');

    // The same delta again changes nothing: the link is held, the lockpick is already gone.
    const again = inv.applyInventoryDelta({ added: [link], removed: ['lockpick'] });
    assert.deepEqual(again, { added: [], removed: [] });
});

test('applyInventoryDelta adds an id-less item only once (by identifier)', async () => {
    reset();
    const cup = { type: 'office-misc-cup', name: 'Cup of coffee', decor: true, takeable: true };
    inv.applyInventoryDelta({ added: [cup] });
    const first = window.inventory.items.length;
    assert.ok(first >= 1, 'the id-less item was added');
    inv.applyInventoryDelta({ added: [cup] });
    assert.equal(window.inventory.items.length, first, 'a second apply does not add it again');
});

test('applyInventoryDelta never removes an id the tray lacks and tolerates empty input', async () => {
    reset();
    await add(lockpick);
    const out = inv.applyInventoryDelta({ removed: ['not_here'] });
    assert.deepEqual(out, { added: [], removed: [] });
    assert.ok(held('lockpick'), 'an unrelated held item is untouched');
    assert.doesNotThrow(() => inv.applyInventoryDelta());
    assert.doesNotThrow(() => inv.applyInventoryDelta({}));
});
