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
    inventoryMenuFor, openInventoryItemMenu, dropBlockedReason, hasTriggerOnInteract, slotPoint, inventoryMenuIcon
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

test('a carried vest with nothing to read keeps its one click (not droppable, no observations: no menu)', () => {
    // As the lab gives it (give_item): wearable, not droppable
    const vest = held({ id: 'kit_hivis_vest', type: 'aes_hivis_hook1', name: 'Hi-vis courier vest',
        sprite: 'aes_hivis_hook1', wearable: { costume: 'courier', global: 'courier_ready' } });
    assert.equal(menu(vest), null);
    assert.equal(openInventoryItemMenu(vest, 0, 0, { ctx: { inventoryItems: items }, showInteractionMenu: () => assert.fail('no menu') }), false);
    // and the lab still authors it so
    const text = readFileSync(join(js, '../../../scenarios/lab_physical_pentest/scenario.json.erb'), 'utf8');
    const start = text.indexOf('"id": "kit_hivis_vest"');
    const block = text.slice(start, text.indexOf('"observations"', start));
    assert.ok(block.length > 0 && !/"droppable"/.test(block), 'the carried vest is not droppable');
    assert.ok(/"wearable"/.test(block), 'the carried vest is wearable');
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


// UX slice 4 R1 m1: menu entries carry icons, at whole-number scale
test('every tray menu entry has a pixel icon: the item picture for Use, shared icons for Drop and Examine', () => {
    const el = held({ id: 'b10', name: 'Beacon', droppable: true, triggerOnInteract: [] });
    Object.assign(el, { src: '/x/beacon.png', naturalWidth: 20, naturalHeight: 16 });
    let shown;
    openInventoryItemMenu(el, 10, 20, {
        ctx: { inventoryItems: items, dropBlocked: null },
        window: {},
        dropBlockedReason: () => null,
        showInteractionMenu: (entries) => { shown = entries; }
    });
    assert.deepEqual(shown.map(e => e.icon), [
        { src: '/x/beacon.png', width: 60, height: 48 },
        { src: '/break_escape/assets/icons/menu-drop.png', width: 64, height: 64 },
        { src: '/break_escape/assets/icons/menu-examine.png', width: 64, height: 64 }
    ]);
    // The two shared icons are 32x32 PNGs, drawn at 2x like the hand icon
    for (const f of ['menu-drop.png', 'menu-examine.png']) {
        const b = readFileSync(join(js, '../assets/icons', f));
        assert.equal(b.toString('ascii', 1, 4), 'PNG', f);
        assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [32, 32], f);
    }
    // A picture larger than the 64px box is never shrunk (R2 m6): it gets the shared open hand,
    // drawn at a whole-number scale; one that fits is scaled up by a whole number
    const hand = inventoryMenuIcon('use', { src: 'a.png', naturalWidth: 100, naturalHeight: 50 });
    assert.deepEqual(hand, { src: '/break_escape/assets/icons/hand_frames.png', frame: 0, cols: 4, cell: 32 });
    assert.equal(Number.isInteger(64 / hand.cell), true);
    assert.equal(inventoryMenuIcon('use', { src: 'a.png', naturalWidth: 65, naturalHeight: 10 }).src, hand.src);
    assert.deepEqual(inventoryMenuIcon('use', { src: 'a.png', naturalWidth: 64, naturalHeight: 30 }), { src: 'a.png', width: 64, height: 30 });
    assert.deepEqual(inventoryMenuIcon('use', { src: 'a.png', naturalWidth: 30, naturalHeight: 25 }), { src: 'a.png', width: 60, height: 50 });
    assert.equal(inventoryMenuIcon('use', {}), undefined);
    // The rendered menu draws them
    showInteractionMenu(shown, 10, 20, 'Beacon', { numberKeys: true });
    assert.equal(document.querySelectorAll('#be-interaction-menu .be-im-icon').length, 3);
    closeInteractionMenu();
});
test('the tray click maps the entries onto drop, examine and use', () => {
    const calls = [];
    const el = held({ id: 'b9', name: 'Beacon', droppable: true, triggerOnInteract: [] });
    let shown;
    const opened = openInventoryItemMenu(el, 10, 20, {
        ctx: { inventoryItems: items, dropBlocked: null },
        window: { handleObjectInteraction: (s) => calls.push(['use', s]), examineHeldItem: (s) => calls.push(['examine', s]) },
        dropInventoryItem: (s) => calls.push(['drop', s]),
        dropBlockedReason: () => null,
        showInteractionMenu: (entries, x, y, title, opts) => { shown = { title, entries, x, y, opts }; }
    });
    assert.equal(opened, true);
    assert.equal(shown.title, 'Beacon');
    assert.deepEqual([shown.x, shown.y], [10, 20]);
    assert.deepEqual(shown.opts, { numberKeys: true, holdKeys: true }, 'no fight: holds the game keys');
    assert.deepEqual(shown.entries.map(e => e.label), ['Use', 'Drop here', 'Examine']);
    shown.entries.forEach(e => e.onSelect());
    assert.deepEqual(calls, [['use', el], ['drop', el], ['examine', el]]);

    // a fight in the room: the menu leaves the game keys alone
    let fightShown;
    openInventoryItemMenu(el, 10, 20, {
        ctx: { inventoryItems: items, dropBlocked: null },
        window: { roomHasActiveHostile: () => true },
        dropBlockedReason: () => null,
        showInteractionMenu: (entries, x, y, title, opts) => { fightShown = opts; }
    });
    assert.deepEqual(fightShown, { numberKeys: true, holdKeys: false });

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

// ---- Code review R1 (engine feedback changes) ----

// m1: the tray menu has the busy guard of action-menu.js maybeShowObjectActionMenu
test('no menu over a minigame or an open menu: the click is taken and nothing opens', () => {
    const el = held({ id: 'busy1', name: 'Box', droppable: true });
    const calls = [];
    const deps = (w) => ({
        ctx: { inventoryItems: items, dropBlocked: null },
        window: { ...w, handleObjectInteraction: () => calls.push('click') },
        showInteractionMenu: () => calls.push('menu')
    });
    assert.equal(openInventoryItemMenu(el, 5, 5, deps({ MinigameFramework: { currentMinigame: {} } })), true);
    assert.equal(openInventoryItemMenu(el, 5, 5, deps({ isInteractionMenuOpen: () => true })), true);
    assert.deepEqual(calls, [], 'no menu, and the click does not fall through to the item');
    assert.equal(openInventoryItemMenu(el, 5, 5, deps({ MinigameFramework: { currentMinigame: null }, isInteractionMenuOpen: () => false })), true);
    assert.deepEqual(calls, ['menu']);
    // the same guard as action-menu.js
    const am = readFileSync(join(js, 'systems/action-menu.js'), 'utf8');
    assert.match(am, /window\.MinigameFramework && window\.MinigameFramework\.currentMinigame/);
    assert.match(am, /window\.isInteractionMenuOpen && window\.isInteractionMenuOpen\(\)/);
});

// m8: "Drop here" is checked again when it is chosen
test('"Drop here" checks the doorway again when chosen, and shows the reason instead of dropping', () => {
    const el = held({ id: 'walker', name: 'Parcel', droppable: true });
    const dropped = [];
    const alerts = [];
    let reason = null;
    let shown;
    openInventoryItemMenu(el, 5, 5, {
        ctx: { inventoryItems: items, dropBlocked: null },
        window: { gameAlert: (...a) => alerts.push(a) },
        dropBlockedReason: () => reason,
        dropInventoryItem: (s) => dropped.push(s),
        showInteractionMenu: (entries) => { shown = entries; }
    });
    const drop = shown.find(e => e.label === 'Drop here');
    assert.equal(drop.disabled, false, 'usable when the menu opened');
    reason = 'You are in a doorway. Step into the room first.';   // walked into a doorway
    drop.onSelect();
    assert.deepEqual(dropped, []);
    assert.deepEqual(alerts, [['You are in a doorway. Step into the room first.', 'warning', 'Drop here', 3000, { plainText: true }]]);
    reason = null;                                                 // stepped back in
    drop.onSelect();
    assert.deepEqual(dropped, [el]);
});

test('by default the re-check reads the live window: between rooms at click time blocks the drop', () => {
    const el = held({ id: 'walker2', name: 'Parcel', droppable: true });
    const dropped = [];
    const w = { currentPlayerRoom: 'office', rooms: { office: { doorSprites: [] } }, player: { x: 10, y: 10 }, gameAlert() {} };
    let shown;
    openInventoryItemMenu(el, 5, 5, {
        ctx: { inventoryItems: items, dropBlocked: null }, window: w,
        dropInventoryItem: (s) => dropped.push(s),
        showInteractionMenu: (entries) => { shown = entries; }
    });
    w.currentPlayerRoom = null;
    shown[0].onSelect();
    assert.deepEqual(dropped, []);
    w.currentPlayerRoom = 'office';
    shown[0].onSelect();
    assert.deepEqual(dropped, [el]);
});

// m9: placement with no pointer, number hints and focus
test('a click with no pointer position places the menu over the item\'s slot', () => {
    const el = held({ id: 'nopointer', name: 'Parcel', droppable: true });
    el.getBoundingClientRect = () => ({ left: 300, top: 500, width: 40, height: 40 });
    let at;
    const deps = { ctx: { inventoryItems: items, dropBlocked: null }, window: {},
        showInteractionMenu: (entries, x, y) => { at = [x, y]; } };
    openInventoryItemMenu(el, 0, 0, deps);
    assert.deepEqual(at, [320, 500]);
    openInventoryItemMenu(el, undefined, undefined, deps);
    assert.deepEqual(at, [320, 500]);
    openInventoryItemMenu(el, 12, 34, deps);
    assert.deepEqual(at, [12, 34], 'a real pointer position is kept');
    assert.deepEqual(slotPoint({}), { x: undefined, y: undefined });
    assert.deepEqual(slotPoint({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }), { x: undefined, y: undefined });
});

test('a number-key menu shows each entry\'s key and focuses its first usable entry', () => {
    showInteractionMenu([
        { label: 'Drop here', detail: 'You are in a doorway.', disabled: true, onSelect() {} },
        { label: 'Examine', onSelect() {} }
    ], 50, 50, 'BadUSB', { numberKeys: true });
    const buttons = [...document.querySelectorAll('.be-im-item')];
    assert.deepEqual(buttons.map(b => b.querySelector('.be-im-key')?.textContent), ['1.', '2.']);
    assert.deepEqual(buttons.map(b => b.querySelector('.be-im-label').textContent), ['Drop here', 'Examine'], 'the label itself is unchanged');
    assert.equal(document.activeElement, buttons[1], 'focus on Examine, the first usable entry');
    closeInteractionMenu();

    // no number keys: no key hints, focus left alone
    showInteractionMenu([{ label: 'Memo', onSelect() {} }, { label: 'Guard', onSelect() {} }], 0, 0);
    assert.equal(document.querySelector('.be-im-key'), null);
    assert.notEqual(document.activeElement?.className, 'be-im-item');
    closeInteractionMenu();
});

test('a 0,0 position is no position: the menu is not pinned to the top-left corner', () => {
    const src = readFileSync(join(js, 'ui/interaction-menu.js'), 'utf8');
    const at = src.indexOf('if (clientX === 0 && clientY === 0) { clientX = undefined; clientY = undefined; }');
    assert.ok(at > 0 && at < src.indexOf('let x = (clientX ?? window.innerWidth / 2)'), 'cleared before the fallback is read');
});

// UX feedback slice 3a (main2-16): a small image icon drawn at the exact size asked for,
// centred, never scaled by a fraction; a sheet frame scales to the 64px box.
test('menu icons: an exact-size image is centred at that size, a sheet frame fills the box', () => {
    showInteractionMenu([
        { label: 'Copy it', icon: { src: '/a/rfid_cloner.png', width: 22, height: 44 }, onSelect() {} },
        { label: 'Take it', icon: { src: '/a/hand_frames.png', frame: 0, cols: 4, cell: 32 }, onSelect() {} },
        { label: 'Talk', icon: { src: '/a/talk.png' }, onSelect() {} }
    ], 50, 50, 'Card');
    const icons = [...document.querySelectorAll('.be-im-item .be-im-icon')];
    assert.equal(icons.length, 3);
    assert.equal(icons[0].style.backgroundSize, '22px 44px');
    assert.equal(icons[0].style.backgroundPosition, 'center');
    assert.equal(icons[1].style.backgroundSize, '256px auto', 'the 128px sheet at x2');
    assert.equal(icons[2].style.backgroundSize, 'contain', 'an image with no size keeps the old rule');
    closeInteractionMenu();
});

// UX slice 3a R1 M1: a menu entry's detail shows in full. With a 64px icon in the row the
// old two-line clamp cut the Copy entry's last sentence (the one that tells Copy from Take).
test('no menu detail is clamped or cut with an ellipsis', () => {
    showInteractionMenu([
        { label: 'Copy it', detail: 'Read the card and save a copy on the card copier. The card stays where it is.',
            icon: { src: '/a/rfid_cloner.png', width: 22, height: 44 }, onSelect() {} }
    ], 50, 50, 'Card');
    const css = document.getElementById('be-interaction-menu-styles').textContent;
    const rule = css.match(/#be-interaction-menu \.be-im-detail \{([^}]*)\}/);
    assert.ok(rule, 'the detail has a rule');
    assert.doesNotMatch(rule[1], /line-clamp|text-overflow|overflow\s*:\s*hidden|white-space\s*:\s*nowrap|max-height|-webkit-box/,
        'the detail wraps to as many lines as it needs');
    assert.doesNotMatch(css, /ellipsis|line-clamp/, 'nothing in the menu is cut with an ellipsis');
    const detail = document.querySelector('.be-im-detail');
    assert.match(detail.textContent, /The card stays where it is\.$/, 'the whole detail is in the entry');
    closeInteractionMenu();
});

// ── Keyring K3b (CREDENTIAL_KEYRING_PLAN.md 8.2): Connect from the tray ───────────────────────
// The item's own `credential` never reaches the client, so the menu matches the tray item's id
// against a GET /keyring row's heldItem through window.keyring (the real Keyring class).
const { Keyring } = await import(pathToFileURL(join(js, 'systems/keyring.js')).href);
const { trayClickIsConnect, connectMenuEntry, CONNECTING_TEXT } = await import(pathToFileURL(join(js, 'systems/inventory-menu.js')).href);
const RDP = { id: 'lena_rdp_file', type: 'text_file', name: 'HB-FIN-02.rdp', text: 'Saved connection.', observations: 'A saved connection file.' };
const keyringWith = (entries) => { const kr = new Keyring(); kr.latest = entries; return kr; };
const rdpEntry = { id: 'lena_rdp', kind: 'saved_connection', heldItem: 'lena_rdp_file', host: 'HB-FIN-02', connectsTo: 'lena_pc' };
const assistEntry = { id: 'jake_assist', kind: 'assist_invite', heldItem: 'jake_assist_code', host: 'HB-FIN-03', connectsTo: 'jake_pc' };

test('K3b: a held saved connection gets [Connect, Examine]', () => {
    const w = { keyring: keyringWith([rdpEntry]) };
    const el = held(RDP);
    const entries = inventoryMenuFor(el, { inventoryItems: items, dropBlocked: null, window: w });
    assert.deepEqual(labels(entries), ['Connect', 'Examine']);
    assert.equal(entries[0].id, 'connect');
    assert.equal(trayClickIsConnect(el, { inventoryItems: items, window: w }), false, 'it has a menu');
});

test('K3b: a droppable saved connection adds Drop here between Connect and Examine', () => {
    const w = { keyring: keyringWith([rdpEntry]) };
    const el = held({ ...RDP, droppable: true });
    el.scenarioData.takeable = true;
    assert.deepEqual(labels(inventoryMenuFor(el, { inventoryItems: items, dropBlocked: null, window: w })), ['Connect', 'Drop here', 'Examine']);
});

test('K3b: with nothing to read, the click is Connect itself, no menu', () => {
    const connects = [];
    const kr = keyringWith([rdpEntry]);
    kr.connect = (s) => { connects.push(s); return Promise.resolve({ outcome: 'stub' }); };
    const w = { keyring: kr };
    const el = held({ id: 'lena_rdp_file', type: 'text_file', name: 'HB-FIN-02.rdp' });
    assert.equal(inventoryMenuFor(el, { inventoryItems: items, dropBlocked: null, window: w }), null);
    assert.equal(trayClickIsConnect(el, { inventoryItems: items, window: w }), true);
    let shown = false;
    const opened = openInventoryItemMenu(el, 1, 1, {
        ctx: { inventoryItems: items, dropBlocked: null, window: w }, window: w,
        showInteractionMenu: () => { shown = true; }
    });
    assert.equal(opened, true, 'the click is taken');
    assert.equal(shown, false, 'no menu');
    assert.deepEqual(connects, [el], 'Connect ran once');
    // Over a minigame the click does nothing
    openInventoryItemMenu(el, 1, 1, { ctx: { inventoryItems: items, window: w }, window: { ...w, MinigameFramework: { currentMinigame: {} } } });
    assert.equal(connects.length, 1);
});

test('K3b: the Connect entry runs keyring.connect, with the tray picture as its icon', () => {
    const connects = [];
    const kr = keyringWith([rdpEntry]);
    kr.connect = (s) => { connects.push(s); };
    const w = { keyring: kr };
    const el = held(RDP);
    el.src = '/assets/objects/text_file.png'; el.naturalWidth = 16; el.naturalHeight = 16;
    let shown;
    openInventoryItemMenu(el, 1, 1, {
        ctx: { inventoryItems: items, dropBlocked: null, window: w }, window: w,
        showInteractionMenu: (entries) => { shown = entries; }
    });
    assert.deepEqual(shown.map(e => e.label), ['Connect', 'Examine']);
    assert.deepEqual(shown[0].icon, { src: el.src, width: 64, height: 64 }, 'the item picture, whole-number scale');
    shown[0].onSelect();
    assert.deepEqual(connects, [el]);
});

test('K3b: while a Connect runs the entry is greyed', () => {
    const kr = keyringWith([rdpEntry]);
    kr.connecting = 'lena_rdp_file';
    const entries = inventoryMenuFor(held(RDP), { inventoryItems: items, dropBlocked: null, window: { keyring: kr } });
    assert.equal(entries[0].disabled, true);
    assert.equal(entries[0].reason, CONNECTING_TEXT);
});

test('K3c: the assist code gets Connect from its keyring row and keeps its tray slot', () => {
    const w = { keyring: keyringWith([rdpEntry, assistEntry]) };
    const code = held({ id: 'jake_assist_code', type: 'text_file', name: 'Remote assist code (Jake)', text: 'Code 4471' });
    assert.deepEqual(connectMenuEntry(code, w), { id: 'connect', label: 'Connect' });
    assert.equal(labels(inventoryMenuFor(code, { inventoryItems: items, dropBlocked: null, window: w }))[0], 'Connect');
    assert.ok(items.includes(code), 'still in the tray');
});

test('K3b: an item with no keyring row, or no keyring at all, has no Connect', () => {
    const el = held({ id: 'notes1', type: 'notes', name: 'Notes', text: 'x' });
    assert.equal(connectMenuEntry(el, { keyring: keyringWith([rdpEntry]) }), null);
    assert.equal(connectMenuEntry(held(RDP), {}), null, 'no keyring (a scenario without credentials)');
    assert.equal(connectMenuEntry(held(RDP), { keyring: keyringWith([{ ...rdpEntry, kind: 'password' }]) }), null);
});
