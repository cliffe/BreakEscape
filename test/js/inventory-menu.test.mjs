// The inventory click menu (feedback plan, section 5): a menu only for an item with
// more than one action, its entries in order, the greyed "Drop here" between rooms or
// in a doorway, the entries mapped onto the existing functions, and the overlay itself
// (keys 1 to 3, Esc, a greyed entry that does nothing).
// Run with: node test/js/inventory-menu.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
    inventoryMenuFor, openInventoryItemMenu, dropBlockedReason, hasTriggerOnInteract
} = await import(pathToFileURL(join(js, 'systems/inventory-menu.js')).href);
const { showInteractionMenu, isInteractionMenuOpen, closeInteractionMenu } = await import(pathToFileURL(join(js, 'ui/interaction-menu.js')).href);

// A tray element: the item's data on an <img>, held in window.inventory.items.
const items = [];
const held = (data) => { const el = { scenarioData: { ...data, takeable: false }, alt: data.name }; items.push(el); return el; };
const menu = (el, dropBlocked = null) => inventoryMenuFor(el, { inventoryItems: items, dropBlocked });
const labels = (entries) => entries && entries.map(e => e.label);

// The eight droppable items in today's scenarios, as authored (lab_physical_pentest,
// test_needs_sims, test_npc_needs). None has triggerOnInteract.
const SCENARIO_DROPPABLES = [
    { id: 'kit_deviceB', type: 'usb', name: 'BadUSB', sprite: 'icon_deviceB', droppable: true, needsTag: 'usb_device' },
    { id: 'kit_usb', type: 'usb', name: 'USB storage stick', sprite: 'usb_bowl1', droppable: true, needsTag: 'usb_device' },
    { id: 'kit_qr', type: 'notes', name: 'QR code card', sprite: 'qr_card', droppable: true, needsTag: 'qr_code' },
    { id: 'kit_cable', type: 'usb', name: 'Charging cable', sprite: 'charging_cable', droppable: true, needsTag: 'charging_cable' },
    { id: 'parcel', type: 'm09_box_taped1', name: 'Parcel for Amara', droppable: true, needsTag: 'post' },
    { id: 'player_mugs', type: 'dirty_mugs1', name: 'Dirty Mugs', droppable: true, needsTag: 'dirty_mugs' },
    { id: 'cake', type: 'cake', name: 'Cake', droppable: true, affordance: { magnet: { tempt: 30 } } },
    { id: 'sample_binder', type: 'book1', name: 'Sample Binder', droppable: true, needsTag: 'found_item' }
];

test('every droppable item in the scenarios shows "Drop here" and "Examine"', () => {
    for (const data of SCENARIO_DROPPABLES) {
        assert.deepEqual(labels(menu(held(data))), ['Drop here', 'Examine'], data.id);
    }
});

test('the scenario files still mark exactly those droppables, none with triggerOnInteract', () => {
    const root = join(js, '../../../scenarios');
    const found = [];
    for (const s of ['lab_physical_pentest', 'test_needs_sims', 'test_npc_needs']) {
        const text = readFileSync(join(root, s, 'scenario.json.erb'), 'utf8');
        // each "droppable": true belongs to the nearest "id" before it
        const re = /"droppable":\s*true/g;
        let m;
        while ((m = re.exec(text))) {
            const before = text.slice(0, m.index);
            const id = [...before.matchAll(/"id":\s*"([^"]+)"/g)].pop()?.[1];
            const block = text.slice(before.lastIndexOf('{'), text.indexOf('}', m.index));
            assert.ok(!/triggerOnInteract/.test(block), `${s} ${id} has triggerOnInteract`);
            found.push(id);
        }
    }
    assert.deepEqual(found.sort(), SCENARIO_DROPPABLES.map(d => d.id).sort());
});

test('a droppable item with triggerOnInteract: "Use" (or its useLabel), "Drop here", "Examine"', () => {
    assert.deepEqual(labels(menu(held({ id: 'b', name: 'Beacon', droppable: true, triggerOnInteract: [] }))),
        ['Use', 'Drop here', 'Examine']);
    assert.deepEqual(labels(menu(held({ id: 'b2', name: 'Beacon', droppable: true, useLabel: 'Switch on', triggerOnInteract: [{}] }))),
        ['Switch on', 'Drop here', 'Examine']);
    assert.deepEqual(menu(held({ id: 'b3', droppable: true, triggerOnInteract: [] })).map(e => e.id), ['use', 'drop', 'examine']);
});

test('every other item has no menu: its click does what it did before', () => {
    const others = [
        { type: 'phone', id: 'phone', name: 'Your Phone', phoneId: 'player_phone' },
        { type: 'lockpick', id: 'lockpick', name: 'Lock Pick Kit' },
        { type: 'key_ring', name: 'Key Ring', allKeys: [] },
        { type: 'briefcase', id: 'case', name: 'Briefcase', contents: [] },
        { type: 'notes', id: 'memo', name: 'Memo', readable: true, text: 'Hi' },
        { type: 'coffee', id: 'coffee', name: 'Coffee', consumable: true },
        { type: 'network_link', id: 'link_1', name: 'Network link' },
        { type: 'usb', id: 'plain_usb', name: 'USB', droppable: false },
        { type: 'mug', id: 'mug', name: 'Mug', droppable: 'true' },        // only a real boolean
        { type: 'notepad', id: 'notepad', name: 'Notepad' }
    ];
    for (const data of others) assert.equal(menu(held(data)), null, data.type);
});

test('an item no longer in the inventory, or with no data, has no menu', () => {
    assert.equal(menu({ scenarioData: { id: 'gone', droppable: true } }), null);
    assert.equal(menu({}), null);
    assert.equal(menu(null), null);
});

test('the carried vest keeps its one click (its trigger puts the disguise on or off)', () => {
    // As the lab gives it (give_item): triggerOnInteract, not droppable
    const vest = held({ id: 'kit_hivis_vest', type: 'aes_hivis_hook1', name: 'Hi-vis courier vest',
        sprite: 'aes_hivis_hook1', triggerOnInteract: [{ type: 'confirm_action' }] });
    assert.equal(menu(vest), null);
    assert.equal(openInventoryItemMenu(vest, 0, 0, { ctx: { inventoryItems: items }, showInteractionMenu: () => assert.fail('no menu') }), false);
    // and the lab still authors it so
    const text = readFileSync(join(js, '../../../scenarios/lab_physical_pentest/scenario.json.erb'), 'utf8');
    const block = text.slice(text.indexOf('"id": "kit_hivis_vest"'), text.indexOf('"triggerOnInteract"', text.indexOf('"id": "kit_hivis_vest"')));
    assert.ok(block.length > 0 && !/"droppable"/.test(block), 'the carried vest is not droppable');
});

test('hasTriggerOnInteract is the chain\'s own first test', () => {
    assert.equal(hasTriggerOnInteract({ triggerOnInteract: [] }), true);
    assert.equal(hasTriggerOnInteract({ triggerOnInteract: {} }), false);
    assert.equal(hasTriggerOnInteract(null), false);
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const trig = inter.indexOf('if (hasTriggerOnInteract(sprite.scenarioData)) {');
    const drop = inter.indexOf('if (isDroppableInventoryItem(sprite, window.inventory?.items)) {');
    assert.ok(trig > 0 && drop > trig, 'the trigger branch comes before the drop branch');
});

test('"Drop here" is greyed with a reason between rooms or in a doorway', () => {
    const rooms = {
        office: { doorSprites: [{ x: 100, y: 100, displayWidth: 32, displayHeight: 64 }] },
        hall: { doorSprites: [{ x: 300, y: 100, displayWidth: 32, displayHeight: 32, active: false }] }
    };
    const player = (x, feetY) => ({ x, y: feetY - 5, body: { center: { x }, y: feetY - 10, height: 10 } });
    assert.match(dropBlockedReason({ currentPlayerRoom: null, rooms }), /between rooms/);
    assert.match(dropBlockedReason({ currentPlayerRoom: 'nowhere', rooms }), /between rooms/);
    assert.match(dropBlockedReason({ currentPlayerRoom: 'office', rooms, player: player(100, 120) }), /doorway/);
    assert.equal(dropBlockedReason({ currentPlayerRoom: 'office', rooms, player: player(200, 200) }), null);
    // an opened (inactive) door is no doorway
    assert.equal(dropBlockedReason({ currentPlayerRoom: 'office', rooms, player: player(300, 100) }), null);

    const entries = menu(held(SCENARIO_DROPPABLES[0]), 'You are in a doorway. Step into the room first.');
    assert.deepEqual(entries[0], { id: 'drop', label: 'Drop here', disabled: true, reason: 'You are in a doorway. Step into the room first.' });
    assert.equal(entries[1].disabled, undefined);
});

test('the tray click maps the entries onto drop, examine and use', () => {
    const calls = [];
    const el = held({ id: 'b9', name: 'Beacon', droppable: true, triggerOnInteract: [] });
    let shown;
    const opened = openInventoryItemMenu(el, 10, 20, {
        ctx: { inventoryItems: items, dropBlocked: null },
        window: { handleObjectInteraction: (s) => calls.push(['use', s]), examineHeldItem: (s) => calls.push(['examine', s]) },
        dropInventoryItem: (s) => calls.push(['drop', s]),
        showInteractionMenu: (entries, x, y, title, opts) => { shown = { title, entries, x, y, opts }; }
    });
    assert.equal(opened, true);
    assert.equal(shown.title, 'Beacon');
    assert.deepEqual([shown.x, shown.y], [10, 20]);
    assert.deepEqual(shown.opts, { numberKeys: true });
    assert.deepEqual(shown.entries.map(e => e.label), ['Use', 'Drop here', 'Examine']);
    shown.entries.forEach(e => e.onSelect());
    assert.deepEqual(calls, [['use', el], ['drop', el], ['examine', el]]);

    // no menu: the caller runs the click as before
    const phone = held({ type: 'phone', id: 'p', name: 'Phone' });
    assert.equal(openInventoryItemMenu(phone, 0, 0, { ctx: { inventoryItems: items }, showInteractionMenu: () => assert.fail('no menu') }), false);
});

test('the tray click asks the menu first, then runs the click as before', () => {
    const inv = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
    assert.match(inv, /if \(window\.openInventoryItemMenu\?\.\(this, e\?\.clientX, e\?\.clientY\)\) return;\s*\n\s*if \(window\.handleObjectInteraction\)/);
});

test('the overlay: heading, entries, keys 1 to 3, Esc, a greyed entry does nothing', () => {
    const picked = [];
    const open = () => showInteractionMenu([
        { label: 'Drop here', detail: 'You are in a doorway. Step into the room first.', disabled: true, onSelect: () => picked.push('drop') },
        { label: 'Examine', onSelect: () => picked.push('examine') }
    ], 50, 50, 'BadUSB', { numberKeys: true });
    const key = (k) => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));

    open();
    assert.equal(isInteractionMenuOpen(), true);
    assert.equal(document.querySelector('#be-interaction-menu .be-im-title').textContent, 'BadUSB');
    const buttons = [...document.querySelectorAll('.be-im-item')];
    assert.deepEqual(buttons.map(b => b.querySelector('.be-im-label').textContent), ['Drop here', 'Examine']);
    assert.equal(buttons[0].getAttribute('aria-disabled'), 'true');
    assert.match(buttons[0].querySelector('.be-im-detail').textContent, /doorway/);

    buttons[0].click();               // greyed: nothing happens, the menu stays
    key('1');
    assert.deepEqual(picked, []);
    assert.equal(isInteractionMenuOpen(), true);

    key('2');                          // Examine
    assert.deepEqual(picked, ['examine']);
    assert.equal(isInteractionMenuOpen(), false);

    open();
    key('Escape');
    assert.equal(isInteractionMenuOpen(), false);
    key('2');                          // closed: number keys do nothing
    assert.deepEqual(picked, ['examine']);

    open();
    document.querySelectorAll('.be-im-item')[1].click();
    assert.deepEqual(picked, ['examine', 'examine']);
    closeInteractionMenu();
});

test('the disambiguation menu keeps its heading and takes no number keys', async () => {
    const picked = [];
    showInteractionMenu([{ label: 'Memo', onSelect: () => picked.push(1) }, { label: 'Guard', onSelect: () => picked.push(2) }], 0, 0);
    assert.equal(document.querySelector('#be-interaction-menu .be-im-title').textContent, 'Interact with…');
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '1', bubbles: true }));
    assert.deepEqual(picked, []);
    closeInteractionMenu();
});
