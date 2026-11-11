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
    // Review R2, client 5: unnamed watchers are counted, and a named one goes first
    assert.match(W.refusalText([{ name: 'someone' }, { name: 'someone' }]), /Not here: 2 people are watching/);
    assert.match(W.refusalText([{ name: 'someone' }, { name: 'Tom' }, { name: 'someone' }]), /Tom and 2 others are watching/);
    assert.match(W.refusalText([{ name: 'someone' }]), /someone is watching/);
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
    assert.equal(w.inventory.items[0].alt, 'Hi-vis vest (worn)', 'the image alt says worn too');
    assert.equal(w.inventory.items[1].alt, 'Lab coat');
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
    assert.equal(w.inventory.items[0].alt, 'Hi-vis vest');
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

// Review R1, M1: the defaults show every text as plain text (names and confirm texts are
// author text, the message can be the server's)
test('the default alert and confirm pass plainText, so a hostile name stays text', async () => {
    const { w, deps } = rig({ npcs: [person('tom', { displayName: '<img src=x onerror=alert(1)>' })] });
    delete deps.alert;
    delete deps.confirm;
    const alerts = [], confirms = [];
    w.gameAlert = (...a) => alerts.push(a);
    w.gameConfirm = (...a) => { confirms.push(a); return Promise.resolve(true); };
    assert.equal(await W.putOn('vest', { confirm: true }, deps), false);
    assert.equal(alerts.length, 1);
    assert.match(alerts[0][0], /<img src=x onerror=alert\(1\)> is watching/);
    assert.equal(alerts[0][2], 'Hi-vis vest');
    assert.deepEqual(alerts[0][4], { plainText: true });
    w.npcManager.npcs.get('tom').roomId = 'hall';
    assert.equal(await W.putOn('vest', { confirm: true }, deps), true);
    assert.deepEqual(confirms[0], ['Put it on?', 'Confirm', 'Cancel', { plainText: true }]);
});

test('the server refusal message is shown as plain text', async () => {
    const { w, deps } = rig({ refuse: true });
    delete deps.alert;
    const alerts = [];
    w.gameAlert = (...a) => alerts.push(a);
    assert.equal(await W.putOn('vest', {}, deps), false);
    assert.deepEqual(alerts[0], ['Refused by server', 'warning', 'Hi-vis vest', 4000, { plainText: true }]);
});

test('an NPC with no displayName is "someone", never its id', () => {
    const { w } = rig({ npcs: [person('guard_02', { displayName: undefined })] });
    assert.deepEqual(W.watchersInRoom(W.wearableSpec(VEST), w).map(n => n.name), ['someone']);
});

// Review R1, M2: putting on another wearable takes the worn one off, so the worn one's own
// unseenOnly refuses it in front of a watcher
test('a swap away from an unseenOnly item is refused while someone watches', async () => {
    const { w, deps, log } = rig();
    await W.putOn('vest', {}, deps);
    w.npcManager.npcs.set('tom', person('tom'));
    log.posts.length = 0;
    assert.equal(await W.putOn('coat', { confirm: true }, deps), false);
    assert.equal(log.posts.length, 0, 'no post');
    assert.equal(log.confirms.length, 0);
    assert.match(log.alerts.at(-1), /TOM is watching/);
    assert.equal(w.gameState.wornItem.itemId, 'vest');
    // Alone, the swap goes ahead
    w.npcManager.npcs.delete('tom');
    assert.equal(await W.putOn('coat', {}, deps), true);
    assert.equal(w.gameState.globalVariables.vest_on, false);
});

test('watchers are checked again after the confirm', async () => {
    const { w, deps, log } = rig();
    deps.confirm = async () => { w.npcManager.npcs.set('tom', person('tom')); return true; };
    assert.equal(await W.putOn('vest', { confirm: true }, deps), false);
    assert.equal(log.posts.length, 0, 'Tom walked in during the confirm: no post');
    w.npcManager.npcs.delete('tom');
    await W.putOn('vest', {}, deps);
    deps.confirm = async () => { w.npcManager.npcs.set('tom', person('tom')); return true; };
    log.posts.length = 0;
    assert.equal(await W.takeOff('vest', { confirm: true }, deps), false);
    assert.equal(log.posts.length, 0);
    assert.equal(w.gameState.globalVariables.vest_on, true);
});

test('a double click posts once and runs onWear once', async () => {
    const { w, deps, log } = rig({ items: [COAT] });
    const coat = { ...COAT, wearable: { ...COAT.wearable, onWear: [{ type: 'hint', message: 'coat on' }] } };
    w.inventory.items[0].scenarioData = coat;
    const cap = captureWarn();
    let a, b;
    try {
        [a, b] = await Promise.all([W.toggle(w.inventory.items[0], deps), W.toggle(w.inventory.items[0], deps)]);
    } finally { cap.restore(); }
    assert.deepEqual([a, b], [true, null]);
    assert.equal(log.posts.length, 1);
    assert.deepEqual(log.actions, ['coat on']);
});

test('a forced take-off waits for a change in flight instead of being dropped', async () => {
    const { w, deps, log } = rig();
    const putting = W.putOn('vest', {}, deps);
    const item = w.inventory.items[0];
    // The put-on is still in flight; the item leaves as soon as it settles
    const leaving = putting.then(() => { w.inventory.items.shift(); return W.onItemLeft(item, deps); });
    assert.equal(await putting, true);
    assert.equal(await leaving, true);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.deepEqual(log.posts.map(p => p.worn), [true, false]);
});

test('a costume that fails to apply leaves the item not worn', async () => {
    const { w, deps, log } = rig();
    const real = deps.costume;
    deps.costume = async () => ({ ...(await real()), setCostume: async () => false });
    assert.equal(await W.putOn('vest', {}, deps), false);
    assert.equal(w.gameState.wornItem, null);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.deepEqual(log.posts, [{ item_id: 'vest', worn: true }, { item_id: 'vest', worn: false }], 'the server is told to take it off');
    assert.deepEqual(log.actions, [], 'no onWear');
    assert.ok(!w.inventory.items[0].parentElement.classes.has(W.WORN_CLASS));
});

// Review R1, finding 7: a drop or remove_item racing the server's own removal gets a 422; the
// forced take-off still settles locally
test('a forced take-off settles locally after the server refuses it', async () => {
    const { w, deps, log } = rig();
    await W.putOn('vest', {}, deps);
    deps.post = async () => { const e = new Error('422'); e.body = { message: 'That item is not being worn.' }; throw e; };
    const item = w.inventory.items.shift();
    assert.equal(await W.onItemLeft(item, deps), true);
    assert.equal(w.gameState.globalVariables.vest_on, false);
    assert.equal(w.gameState.wornItem, null);
    assert.deepEqual(log.costume.at(-1), ['clear']);
    assert.deepEqual(log.actions, ['on', 'off']);
});

test('an unforced take-off the server refuses changes nothing and says why', async () => {
    const { w, deps, log } = rig();
    await W.putOn('vest', {}, deps);
    deps.post = async () => { const e = new Error('422'); e.body = { message: 'Nope.' }; throw e; };
    assert.equal(await W.takeOff('vest', {}, deps), false);
    assert.equal(w.gameState.globalVariables.vest_on, true);
    assert.equal(log.alerts.at(-1), 'Nope.');
});

// Review R2, client 1: a change started while another is in progress is dropped with a
// warning and returns null (a refusal returns false)
function captureWarn() {
    const warned = [];
    const saved = console.warn;
    console.warn = (...args) => warned.push(args.join(' '));
    return { warned, restore: () => { console.warn = saved; } };
}

test('a wear from the worn item\'s own onRemove is dropped with a warning', async () => {
    const { w, deps, log } = rig();
    const coat = { ...COAT, wearable: { ...COAT.wearable, onRemove: [{ type: 'wear', itemId: 'vest' }] } };
    w.inventory.items[1].scenarioData = coat;
    const nested = [];
    deps.applyActions = (acts) => (acts || []).forEach(a => { if (a.type === 'wear') nested.push(W.putOn(a.itemId, {}, deps)); });
    await W.putOn('coat', {}, deps);
    const cap = captureWarn();
    try {
        assert.equal(await W.takeOff('coat', {}, deps), true);
        assert.equal(await nested[0], null, 'dropped, not refused');
        assert.match(cap.warned.join('\n'), /another change is in progress, dropped: put on vest/);
    } finally { cap.restore(); }
    assert.equal(w.gameState.wornItem, null);
    assert.equal(log.posts.filter(p => p.item_id === 'vest').length, 0);
});

test('a take_off while a tray confirm is open is dropped with a warning', async () => {
    const { w, deps } = rig();
    await W.putOn('vest', {}, deps);
    let answer;
    deps.confirm = () => new Promise(r => { answer = r; });
    const tray = W.takeOff('vest', { confirm: true }, deps);
    await new Promise(r => setTimeout(r, 0));
    const cap = captureWarn();
    try {
        assert.equal(await W.takeOff(null, {}, deps), null);
        assert.match(cap.warned.join('\n'), /dropped: take off \(worn item\)/);
    } finally { cap.restore(); }
    answer(false);
    assert.equal(await tray, false, 'the declined confirm is a refusal, not a drop');
    assert.equal(w.gameState.wornItem.itemId, 'vest');
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
