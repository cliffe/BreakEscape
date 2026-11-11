// systems/wearables.js: the wearable spec, who counts as watching (unseenOnly), put on and take
// off against a stub server, one at a time, an item leaving the inventory, the tray frame and
// label, the menu label, and the wear / take_off actions in apply-actions.js.
// Run with: bin/test-js test/js/wearables.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { createElement: () => ({ remove() { this.removed = true; } }) };
const W = await import(pathToFileURL(join(js, 'systems/wearables.js')).href);
const { inventoryMenuFor } = await import(pathToFileURL(join(js, 'systems/inventory-menu.js')).href);

const VEST = {
    id: 'vest', type: 'hivis', name: 'Hi-vis vest', droppable: true,
    wearable: { costume: 'courier', global: 'vest_on', unseenOnly: true, seenBy: { ignore: ['ruth'] },
        confirmOn: 'Put it on?', confirmOff: 'Take it off?',
        onWear: [{ type: 'hint', message: 'on' }], onRemove: [{ type: 'hint', message: 'off' }] }
};
const COAT = { id: 'coat', type: 'coat', name: 'Lab coat', wearable: { costume: 'doctor', global: 'coat_on' } };

// A classList and parentElement good enough for decorateSlot
function slotFor(item) {
    const classes = new Set();
    const children = [];
    const slot = {
        classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), contains: c => classes.has(c) },
        querySelector: () => children.find(c => !c.removed) || null,
        appendChild: (c) => children.push(c),
        classes, children
    };
    item.parentElement = slot;
    return slot;
}

function rig({ npcs = [], room = 'office', items = [VEST, COAT], refuse = false } = {}) {
    const w = {
        gameState: { globalVariables: {}, wornItem: null },
        currentPlayerRoom: room,
        npcManager: { npcs: new Map(npcs.map(n => [n.id, n])) },
        inventory: { items: items.map(d => ({ scenarioData: d })) },
        npcHostileSystem: { isNPCKO: (id) => id === 'knocked' },
        eventDispatcher: { events: [], emit(name, data) { this.events.push([name, data]); } }
    };
    const log = { posts: [], costume: [], actions: [], alerts: [], confirms: [] };
    let worn = null;
    const deps = {
        window: w,
        post: async (body) => {
            log.posts.push(body);
            if (refuse) { const e = new Error('no'); e.body = { message: 'Refused by server' }; throw e; }
            const spec = { vest: VEST, coat: COAT }[body.item_id]?.wearable;
            const globals = {};
            if (body.worn) {
                if (worn && worn.itemId !== body.item_id) globals[worn.global] = false;
                globals[spec.global] = true;
                globals.pp_disguise = spec.costume;
                worn = { itemId: body.item_id, global: spec.global, costume: spec.costume };
            } else {
                if (worn) globals[worn.global] = false;
                globals.pp_disguise = '';
                worn = null;
            }
            return { success: true, worn, globals };
        },
        costume: async () => ({
            setCostume: async (id) => { log.costume.push(['set', id]); w.gameState.globalVariables.pp_disguise = id; return true; },
            clearCostume: async () => { log.costume.push(['clear']); w.gameState.globalVariables.pp_disguise = ''; return true; }
        }),
        write: async (k, v) => { w.gameState.globalVariables[k] = v; },
        confirm: async (text) => { log.confirms.push(text); return true; },
        alert: (msg) => log.alerts.push(msg),
        applyActions: (acts) => log.actions.push(...(acts || []).map(a => a.message)),
        refresh: () => w.inventory.items.forEach(it => W.decorateSlot(it, w))
    };
    w.inventory.items.forEach(slotFor);
    return { w, deps, log };
}

const person = (id, extra = {}) => ({ id, displayName: id.toUpperCase(), npcType: 'person', roomId: 'office', ...extra });

test('wearableSpec normalises and rejects incomplete specs', () => {
    const s = W.wearableSpec(VEST);
    assert.equal(s.costume, 'courier');
    assert.equal(s.global, 'vest_on');
    assert.equal(s.unseenOnly, true);
    assert.deepEqual(s.ignore, ['ruth']);
    assert.equal(W.wearableSpec({ wearable: { costume: 'x' } }), null);
    assert.equal(W.wearableSpec({ wearable: { global: 'g' } }), null);
    assert.equal(W.wearableSpec({}), null);
    assert.equal(W.wearableSpec(COAT).unseenOnly, false);
});

test('watchers: person NPCs in the room, visible, not KO, not ignored', () => {
    const { w } = rig({ npcs: [
        person('tom'), person('ruth'), person('away', { roomId: 'hall' }), person('hidden', { isVisible: false }),
        person('knocked'), { id: 'phone', npcType: 'phone', roomId: 'office' }
    ] });
    assert.deepEqual(W.watchersInRoom(W.wearableSpec(VEST), w).map(n => n.id), ['tom']);
    // Without unseenOnly nobody counts
    assert.deepEqual(W.watchersInRoom(W.wearableSpec(COAT), w), []);
    // Between rooms nobody counts
    w.currentPlayerRoom = null;
    assert.deepEqual(W.watchersInRoom(W.wearableSpec(VEST), w), []);
});

test('refusal text names the watchers', () => {
    assert.match(W.refusalText([{ name: 'Tom' }]), /Tom is watching/);
    assert.match(W.refusalText([{ name: 'Tom' }, { name: 'Ann' }]), /Tom and Ann are watching/);
    assert.match(W.refusalText([{ name: 'Tom' }, { name: 'Ann' }, { name: 'Bo' }]), /Tom and 2 others are watching/);
    assert.match(W.refusalText([{ name: 'Tom' }], 'drop'), /Drop it somewhere out of sight/);
});

test('put on: confirm, server, costume, global, onWear, worn frame and label', async () => {
    const { w, deps, log } = rig();
    assert.equal(await W.toggle(w.inventory.items[0], deps), true);
    assert.deepEqual(log.confirms, ['Put it on?']);
    assert.deepEqual(log.posts, [{ item_id: 'vest', worn: true }]);
    assert.deepEqual(log.costume, [['set', 'courier']]);
    assert.equal(w.gameState.globalVariables.vest_on, true);
    assert.equal(w.gameState.wornItem.itemId, 'vest');
    assert.deepEqual(log.actions, ['on']);
    const slot = w.inventory.items[0].parentElement;
    assert.ok(slot.classes.has(W.WORN_CLASS));
    assert.equal(slot.children[0].textContent, '(worn)');
    assert.ok(!w.inventory.items[1].parentElement.classes.has(W.WORN_CLASS));
    assert.equal(W.menuLabel(VEST, w), 'Take off');
    assert.equal(W.menuLabel(COAT, w), 'Put on');
    assert.equal(W.menuLabel({ id: 'x' }, w), null);
});

test('take off: confirm, server, costume cleared, global false, onRemove, frame gone', async () => {
    const { w, deps, log } = rig();
    await W.putOn('vest', {}, deps);
    assert.equal(await W.toggle(w.inventory.items[0], deps), true);
    assert.deepEqual(log.confirms, ['Take it off?']);
    assert.deepEqual(log.costume.at(-1), ['clear']);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.equal(w.gameState.wornItem, null);
    assert.deepEqual(log.actions, ['on', 'off']);
    const slot = w.inventory.items[0].parentElement;
    assert.ok(!slot.classes.has(W.WORN_CLASS));
    assert.equal(slot.children[0].removed, true, 'the label is removed');
});

test('unseenOnly refuses a change with someone watching, and allows it alone', async () => {
    const { w, deps, log } = rig({ npcs: [person('tom')] });
    assert.equal(await W.putOn('vest', { confirm: true }, deps), false);
    assert.equal(log.posts.length, 0);
    assert.equal(log.confirms.length, 0, 'refused before the confirm');
    assert.match(log.alerts[0], /TOM is watching/);
    assert.equal(w.eventDispatcher.events.at(-1)[0], 'wearable_refused');
    // Tom leaves
    w.npcManager.npcs.get('tom').roomId = 'hall';
    assert.equal(await W.putOn('vest', {}, deps), true);
    // He comes back: taking it off is refused too
    w.npcManager.npcs.get('tom').roomId = 'office';
    assert.equal(await W.takeOff('vest', {}, deps), false);
    assert.equal(w.gameState.globalVariables.vest_on, true);
});

test('an ignored NPC does not count', async () => {
    const { deps } = rig({ npcs: [person('ruth')] });
    assert.equal(await W.putOn('vest', {}, deps), true);
});

test('one at a time: the coat replaces the vest and the vest onRemove runs', async () => {
    const { w, deps, log } = rig();
    await W.putOn('vest', {}, deps);
    await W.putOn('coat', {}, deps);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.equal(w.gameState.globalVariables.coat_on, true);
    assert.equal(w.gameState.wornItem.itemId, 'coat');
    assert.deepEqual(log.actions, ['on', 'off']);
    assert.ok(!w.inventory.items[0].parentElement.classes.has(W.WORN_CLASS));
    assert.ok(w.inventory.items[1].parentElement.classes.has(W.WORN_CLASS));
});

test('an item that leaves the inventory comes off, even with someone watching', async () => {
    const { w, deps, log } = rig({ npcs: [person('ruth')] });
    await W.putOn('vest', {}, deps);
    w.npcManager.npcs.set('tom', person('tom'));
    const item = w.inventory.items.shift();
    await W.onItemLeft(item, deps);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.equal(w.gameState.wornItem, null);
    assert.deepEqual(log.costume.at(-1), ['clear']);
    // An item that is not worn leaving does nothing
    assert.equal(W.onItemLeft(w.inventory.items[0], deps), null);
});

test('a server refusal leaves everything as it was', async () => {
    const { w, deps, log } = rig({ refuse: true });
    assert.equal(await W.putOn('vest', {}, deps), false);
    assert.equal(w.gameState.wornItem, null);
    assert.equal(log.costume.length, 0);
    assert.equal(w.gameState.globalVariables.vest_on, undefined);
    assert.match(log.alerts[0], /Refused by server/);
});

test('a declined confirm changes nothing', async () => {
    const { w, deps, log } = rig();
    deps.confirm = async () => false;
    assert.equal(await W.toggle(w.inventory.items[0], deps), false);
    assert.equal(log.posts.length, 0);
});

test('restore reads the bootstrap record', () => {
    const w = {};
    W.restore({ wornItem: { itemId: 'vest', global: 'vest_on', costume: 'courier' } }, w);
    assert.equal(W.wornItemId(w), 'vest');
    W.restore({}, w);
    assert.equal(W.wornItemId(w), null);
});

test('the tray menu: a droppable wearable offers Put on / Take off first', () => {
    const w = { wearables: { menuLabel: (d) => W.menuLabel(d, w) }, gameState: { wornItem: null } };
    const el = { scenarioData: VEST };
    const entries = inventoryMenuFor(el, { inventoryItems: [el], dropBlocked: null, window: w });
    assert.deepEqual(entries.map(e => e.label), ['Put on', 'Drop here', 'Examine']);
    w.gameState.wornItem = { itemId: 'vest' };
    assert.equal(inventoryMenuFor(el, { inventoryItems: [el], dropBlocked: null, window: w })[0].label, 'Take off');
});

test('apply-actions routes wear and take_off to window.wearables, wear after the give', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wear-act-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    mkdirSync(join(dir, 'systems'), { recursive: true });
    const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src);
    const src = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
        .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
        .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(){}')}'`)
        .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
    writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), src);
    const log = [];
    const saved = globalThis.window;
    let given = false;
    globalThis.window = {
        gameState: { globalVariables: {} },
        lockRef: () => null,
        addToInventory: () => new Promise(r => setTimeout(() => { given = true; log.push('given'); r(true); }, 20)),
        wearables: {
            putOn: async (id, opts) => { log.push(['wear', id, given, opts.waitMs > 0]); return true; },
            takeOff: async (id) => { log.push(['take_off', id]); return true; }
        }
    };
    const { applyActions } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);
    applyActions([{ type: 'give_item', item: { id: 'vest', type: 'hivis', name: 'Vest' } }, { type: 'wear', itemId: 'vest' }]);
    applyActions([{ type: 'take_off' }]);
    await new Promise(r => setTimeout(r, 80));
    assert.deepEqual(log, [['take_off', null], 'given', ['wear', 'vest', true, true]]);
    globalThis.window = saved;
});
