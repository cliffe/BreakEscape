// Plant hiding H2 (docs/achitechture/PLANT_HIDING_PLAN.md sections 4 to 6 and 11):
// systems/plant-hiding.js. The plant rule, spot eligibility from the static map, the anchor
// maths, interactable state (including a kit picked up after the room loaded), the tap
// (cancel, refusal, occupied, success, retry, already_hidden, hosting), the overlay, the bridge
// alias, and the wiring in interactions.js, rooms.js and core/game.js.
// Run with: node test/js/plant-hiding.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'plant-hiding-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'plant-hiding.mjs'), readFileSync(join(js, 'systems/plant-hiding.js'), 'utf8'));
globalThis.window = globalThis;
const mod = await import(pathToFileURL(join(dir, 'plant-hiding.mjs')).href);
const { PlantHiding, SMALL_PLANT, isPlantKey, anchorPercent, anchorPoint, topLeft, PLANT_PREFIXES, PLANT_NEVER, PLANT_ANCHORS } = mod;

const src = (p) => readFileSync(join(js, p), 'utf8');

// ---------------------------------------------------------------- fixtures

const KIT = 'kit_rogue_ap';
const hideables = {
    [KIT]: {
        rooms: ['reception'], spots: 'plants', exclude: ['reception_plant-large4_34'],
        device: 'planted_rogue_ap',
        deviceData: { id: 'planted_rogue_ap', type: 'rogue_ap', name: 'pocket rogue AP', wifiTwin: true },
        overlay: { sprite: 'rogue_ap_tucked', at: { x: 40, y: 50 } }, spotAt: {}, confirm: 'Hide the pocket rogue AP in this plant?'
    }
};

function fakeSprite(over = {}) {
    const s = {
        x: 0, y: 0, depth: 10, active: true, visible: true, interactable: false,
        displayWidth: 40, displayHeight: 50, originX: 0, originY: 0, flipX: false,
        setOrigin(x, y) { this.originX = x; this.originY = y; return this; },
        setDepth(d) { this.depth = d; return this; },
        setVisible(v) { this.visible = v; return this; },
        getTopLeft() { return { x: this.x - this.displayWidth * this.originX, y: this.y - this.displayHeight * this.originY }; },
        ...over
    };
    return s;
}

function fakeScene() {
    const made = [];
    return {
        made,
        textures: { exists: () => true },
        add: { sprite(x, y, key) { const s = fakeSprite({ x, y, key, originX: 0.5, originY: 0.5 }); made.push(s); return s; } }
    };
}

// A decor plant (origin 0,0, objectId room_image_tiledId, no roomId) and a scenario plant
function decor(scene, image, tiledId, room = 'reception', x = 100, y = 200) {
    return fakeSprite({ scene, name: image, objectId: `${room}_${image}_${tiledId}`, x, y });
}
function scenarioPlant(scene, id, over = {}, data = {}) {
    return fakeSprite({
        scene, roomId: 'reception', objectId: id, interactable: true, x: 300, y: 300, originX: 0.5, originY: 1,
        scenarioData: { id, type: 'plant', sprite: 'plant-large12', observations: 'A plant.', ...data }, ...over
    });
}

function world({ held = false, hiddenDevices = [] } = {}) {
    const scene = fakeScene();
    const p77 = decor(scene, 'plant-large12-top-ani1', 77);
    const p76 = decor(scene, 'plant-large11-top-ani1', 76, 'reception', 200, 200);
    const p34 = decor(scene, 'plant-large4', 34, 'reception', 300, 200)  // small: not a spot by rule;
    const log = decor(scene, 'notes_plantlog1', 9);
    const disp = decor(scene, 'plant-large-displacement1', 5);
    const away = decor(scene, 'plant-large6', 1, 'comms');
    const sp = scenarioPlant(scene, 'lobby_fern');
    const room = { objects: {} };
    for (const s of [p77, p76, p34, log, disp, sp]) room.objects[s.scenarioData?.id || s.objectId] = s;
    const comms = { objects: { [away.objectId]: away } };
    const items = held ? [{ scenarioData: { id: KIT, name: 'pocket rogue AP', hideable: { onHidden: [{ type: 'set_global', key: 'ap_planted', value: true }] } } }] : [];
    const ph = new PlantHiding();
    const listeners = {};
    const emitted = [];
    Object.assign(globalThis, {
        rooms: { reception: room, comms },
        inventory: { items },
        eventDispatcher: { on: (n, f) => { listeners[n] = f; }, emit: (n, d) => emitted.push([n, d]) }
    });
    const toasts = [];
    const actions = [];
    const removed = [];
    globalThis.gameAlert = (...a) => toasts.push(a);
    globalThis.applyActions = (list, ctx) => actions.push([list, ctx]);
    globalThis.removeFromInventory = (it) => { const i = inventory.items.indexOf(it); if (i >= 0) inventory.items.splice(i, 1); removed.push(it); };
    globalThis.breakEscapeConfig = { gameId: 7 };
    globalThis.gameConfirm = async () => true;
    ph.load(hideables, hiddenDevices);
    return { ph, scene, room, comms, p77, p76, p34, log, disp, away, sp, listeners, emitted, toasts, actions, removed };
}

const jsonResp = (status, body) => ({ status, ok: status < 400, json: async () => body });
function stubFetch(handler) {
    const calls = [];
    globalThis.fetch = async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return handler(calls.length, calls); };
    return calls;
}
const settle = async (n = 3) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

// ---------------------------------------------------------------- the plant rule

test('small plants are not default spots (flat pots, smallplant, plant-large1 to 10)', () => {
    for (const k of ['plant-flat-pot1', 'plant-flat-pot7', 'office-misc-smallplant', 'office-misc-smallplant5',
        'plant-large1', 'plant-large2', 'plant-large4', 'plant-large6', 'plant-large9', 'plant-large10']) {
        assert.equal(isPlantKey(k), false, k);
    }
    for (const k of ['plant-large11', 'plant-large12-top-ani1', 'plant-large13']) assert.equal(isPlantKey(k), true, k);
    assert.deepEqual(['plant-large4', 'plant-large6'].map(k => SMALL_PLANT.test(k)), [true, true]);
});

test('isPlantKey accepts each prefix and refuses the never list', () => {
    for (const p of PLANT_PREFIXES.filter(p => !SMALL_PLANT.test(p))) assert.equal(isPlantKey(`${p}x1`), true, p);
    assert.equal(isPlantKey('plant-large11'), true);
    assert.equal(isPlantKey('plant-large13'), true);
    assert.equal(isPlantKey('plant-large12-top-ani2'), true);
    for (const n of PLANT_NEVER) assert.equal(isPlantKey(`${n}1`), false, n);
    assert.equal(isPlantKey('plant-large-displacement3'), false);
    assert.equal(isPlantKey('notes_plantlog'), false);
    assert.equal(isPlantKey('desk_with_plant_sign'), false);
    assert.equal(isPlantKey(''), false);
    assert.equal(isPlantKey(undefined), false);
});

// ---------------------------------------------------------------- eligibility

test('spotsFor reads the static map: rooms, spots, exclude, hidingSpot', () => {
    const w = world({ held: false });
    assert.deepEqual(w.ph.spotsFor(w.p77), [KIT], 'no kit in the tray is irrelevant');
    assert.deepEqual(w.ph.spotsFor(w.p34), [], 'excluded');
    assert.deepEqual(w.ph.spotsFor(w.log), [], 'a plant log is not a plant');
    assert.deepEqual(w.ph.spotsFor(w.disp), [], 'a displacement map is not a plant');
    assert.deepEqual(w.ph.spotsFor(w.away), [], 'room not in rooms');
    assert.deepEqual(w.ph.spotsFor(w.sp), [KIT]);
    w.sp.scenarioData.hidingSpot = false;
    assert.deepEqual(w.ph.spotsFor(w.sp), [], 'hidingSpot false opts out');
    const bin = scenarioPlant(w.scene, 'bin1', {}, { sprite: 'bin', type: 'bin', hidingSpot: true });
    assert.deepEqual(w.ph.spotsFor(bin), [KIT], 'hidingSpot true opts in');
    w.ph.hideables.get(KIT).spots = ['reception_plant-large12-top-ani1_77'];
    assert.deepEqual(w.ph.spotsFor(w.p77), [KIT]);
    assert.deepEqual(w.ph.spotsFor(w.p76), [], 'not in the spots list');
});

test('a scenario plant is judged by its authored sprite, not its live texture', () => {
    const w = world();
    const swapped = scenarioPlant(w.scene, 'fern2', { texture: { key: 'chair' } }, { sprite: 'plant-large13' });
    assert.deepEqual(w.ph.spotsFor(swapped), [KIT]);
    const notPlant = scenarioPlant(w.scene, 'desk9', { texture: { key: 'plant-large13' } }, { sprite: 'desk', type: 'desk' });
    assert.deepEqual(w.ph.spotsFor(notPlant), []);
    const typeOnly = scenarioPlant(w.scene, 'p3', {}, { sprite: undefined, type: 'planter_fig1' });
    assert.deepEqual(w.ph.spotsFor(typeOnly), [KIT], 'type stands in when there is no sprite');
});

test('claims is true only when hosting or holding an eligible unhidden device', () => {
    const w = world({ held: false });
    assert.equal(w.ph.claims(w.p77), false);
    assert.equal(w.ph.claims(w.sp), false, 'a scenario plant keeps its own tap with no kit');
    inventory.items.push({ scenarioData: { id: KIT, name: 'pocket rogue AP' } });
    assert.equal(w.ph.claims(w.p77), true);
    assert.equal(w.ph.claims(w.p34), false);
    assert.equal(w.ph.claims(w.away), false);
    w.ph.hidden.set(KIT, { item: KIT, on: 'reception_plant-large12-top-ani1_77', room: 'reception' });
    inventory.items.length = 0;
    assert.equal(w.ph.claims(w.p77), true, 'the host');
    assert.equal(w.ph.claims(w.p76), false);
});

// ---------------------------------------------------------------- anchor

test('anchor precedence: hideAt, spotAt, family table, overlay.at, default', () => {
    const def = { overlay: { at: { x: 30, y: 40 } }, spotAt: { x1: { x: 11, y: 22 } } };
    const host = scenarioPlant(fakeScene(), 'x1', {}, { hideAt: { x: 5, y: 6 } });
    assert.deepEqual(anchorPercent(host, 'x1', def, {}), { x: 5, y: 6 });
    delete host.scenarioData.hideAt;
    assert.deepEqual(anchorPercent(host, 'x1', def, {}), { x: 11, y: 22 });
    assert.deepEqual(anchorPercent(host, 'x2', def, { 'plant-large': { x: 70, y: 80 }, 'plant': { x: 1, y: 1 } }), { x: 70, y: 80 });
    assert.deepEqual(anchorPercent(host, 'x2', def, {}), { x: 30, y: 40 });
    assert.deepEqual(anchorPercent(host, 'x2', {}, {}), { x: 50, y: 60 });
});

test('the family table takes the longest prefix first', () => {
    const d = decor(fakeScene(), 'plant-large12-top-ani2', 78);
    const table = { 'plant-large': { x: 1, y: 1 }, 'plant-large12-top-ani': { x: 2, y: 2 }, 'plant-flat': { x: 3, y: 3 } };
    assert.deepEqual(anchorPercent(d, 'whatever', {}, table), { x: 2, y: 2 });
});

test('flipX mirrors the x anchor', () => {
    const h = scenarioPlant(fakeScene(), 'f', { flipX: true }, { hideAt: { x: 30, y: 50 } });
    assert.deepEqual(anchorPercent(h, 'f', {}, {}), { x: 70, y: 50 });
});

test('origin (0,0) and origin (0.5,1) hosts give the same top-left and anchor', () => {
    const a = fakeSprite({ x: 100, y: 100, originX: 0, originY: 0, displayWidth: 40, displayHeight: 50 });
    const b = fakeSprite({ x: 120, y: 150, originX: 0.5, originY: 1, displayWidth: 40, displayHeight: 50 });
    assert.deepEqual(topLeft(a), topLeft(b));
    const def = { overlay: { at: { x: 50, y: 60 } } };
    assert.deepEqual(anchorPoint(a, 'z', def, {}), anchorPoint(b, 'z', def, {}));
    assert.deepEqual(anchorPoint(a, 'z', def, {}), { x: 120, y: 130 });
    // no getTopLeft: falls back to position minus the origin offset
    const c = { x: 120, y: 150, originX: 0.5, originY: 1, displayWidth: 40, displayHeight: 50 };
    assert.deepEqual(topLeft(c), { x: 100, y: 100 });
    // whole pixels
    const odd = fakeSprite({ x: 0, y: 0, displayWidth: 33, displayHeight: 47 });
    const p = anchorPoint(odd, 'z', { overlay: { at: { x: 50, y: 60 } } }, {});
    assert.equal(Number.isInteger(p.x) && Number.isInteger(p.y), true);
});

// ---------------------------------------------------------------- interactable state

test('no spot is interactable before the kit is held; held makes them so; hide leaves only the host', () => {
    const w = world({ held: false });
    w.ph.syncRoom('reception');
    assert.equal(w.p77.interactable, false);
    assert.equal(w.sp.interactable, true, 'a scenario plant keeps its authored interactable');
    assert.equal(w.p34.interactable, false);
});

test('a kit picked up after the room loaded makes the plants spots with no reload', () => {
    const w = world({ held: false });
    w.ph.syncRoom('reception');
    assert.equal(w.p77.interactable, false);
    inventory.items.push({ scenarioData: { id: KIT, name: 'pocket rogue AP' } });
    w.listeners.inventory_changed({ items: inventory.items });
    assert.equal(w.p77.interactable, true);
    assert.equal(w.p76.interactable, true);
    assert.equal(w.p34.interactable, false, 'excluded plant stays plain');
    assert.equal(w.log.interactable, false);
    assert.equal(w.p77._hidingSpot, true);
    assert.ok(w.p77.scenarioData, 'decor gets scenarioData so handleObjectInteraction reaches the branch');
    // put it away again: plants go back to plain decor
    inventory.items.length = 0;
    w.listeners.inventory_changed({ items: [] });
    assert.equal(w.p77.interactable, false);
    assert.equal(w.p77.scenarioData, undefined, 'the stub is removed');
    assert.equal(w.p77._hidingSpot, false);
});

test('a scenario plant restores its authored interactable value', () => {
    const w = world({ held: true });
    w.sp.interactable = false; // authored non-interactable
    w.ph.syncRoom('reception');
    assert.equal(w.sp.interactable, true);
    inventory.items.length = 0;
    w.listeners.inventory_changed({ items: [] });
    assert.equal(w.sp.interactable, false);
    w.sp.interactable = true;
    inventory.items.push({ scenarioData: { id: KIT } });
    w.listeners.inventory_changed({});
    inventory.items.length = 0;
    w.listeners.inventory_changed({});
    assert.equal(w.sp.interactable, true);
});

// ---------------------------------------------------------------- the tap

const SPOT = 'reception_plant-large12-top-ani1_77';

test('cancel sends nothing and keeps the kit', async () => {
    const w = world({ held: true });
    w.ph.syncRoom('reception');
    const calls = stubFetch(() => jsonResp(200, {}));
    globalThis.gameConfirm = async (text, yes, no, opts) => { w.asked = [text, yes, no, opts]; return false; };
    const r = await w.ph.interact(w.p77);
    assert.equal(r.action, 'cancelled');
    assert.equal(calls.length, 0);
    assert.equal(inventory.items.length, 1);
    assert.deepEqual(w.asked, ['Hide the pocket rogue AP in this plant?', 'Hide it', 'Leave it', { plainText: true }]);
});

test('a refusal keeps the tray item and toasts the server message', async () => {
    const w = world({ held: true });
    stubFetch(() => jsonResp(422, { success: false, reason: 'not_a_spot', message: 'That is not a place to hide it.' }));
    const r = await w.ph.interact(w.p77);
    assert.deepEqual(r, { action: 'refused', reason: 'not_a_spot' });
    assert.equal(inventory.items.length, 1);
    assert.equal(w.toasts[0][0], 'That is not a place to hide it.');
    assert.equal(w.ph.hidden.size, 0);
    assert.equal(w.actions.length, 0);
});

test('an occupied plant refuses with no request', async () => {
    const w = world({ held: true });
    w.ph.hideables.set('kit_other', { ...hideables[KIT], device: null, deviceData: {} });
    inventory.items.push({ scenarioData: { id: 'kit_other', name: 'other' } });
    w.ph.hidden.set(KIT, { item: KIT, on: SPOT, room: 'reception' });
    const calls = stubFetch(() => jsonResp(200, {}));
    const r = await w.ph.interact(w.p77);
    assert.deepEqual(r, { action: 'refused', reason: 'occupied' });
    assert.equal(calls.length, 0);
    assert.equal(w.toasts[0][0], 'Something is already hidden in this plant.');
});

test('success: one POST, tray item removed with no second request, onHidden once, one overlay', async () => {
    const w = world({ held: true });
    w.ph.syncRoom('reception');
    const calls = stubFetch(() => jsonResp(200, { success: true, hidden: { item: KIT, on: SPOT, room: 'reception' } }));
    const r = await w.ph.interact(w.p77);
    assert.deepEqual(r, { action: 'hidden', spotId: SPOT });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/games\/7\/inventory$/);
    assert.deepEqual(calls[0].body, { action_type: 'hide', item: { id: KIT }, hidden_in: SPOT });
    assert.equal(inventory.items.length, 0);
    assert.equal(w.removed.length, 1);
    assert.equal(w.actions.length, 1);
    assert.deepEqual(w.actions[0][1], { source: 'object_interact', objectId: SPOT });
    assert.equal(w.actions[0][0][0].key, 'ap_planted');
    assert.equal(w.scene.made.length, 1);
    const ov = w.scene.made[0];
    assert.equal(ov.interactable, false);
    assert.equal(w.room.objects.planted_rogue_ap, ov);
    assert.equal(ov.objectId, 'planted_rogue_ap');
    assert.equal(ov.scenarioData.id, 'planted_rogue_ap');
    assert.equal(ov.scenarioData.wifiTwin, true);
    assert.equal(ov.depth, w.p77.depth + 0.005);
    assert.equal(ov.originX, 0.5);
    assert.equal(ov.originY, 1);
    assert.ok(w.p77._fadeCompanions.has(ov));
    const at = PLANT_ANCHORS['plant-large12-top-ani'];
    assert.deepEqual([ov.x, ov.y], [100 + Math.round(at.x / 100 * 40), 200 + Math.round(at.y / 100 * 50)]);
    const names = w.emitted.map(e => e[0]);
    assert.deepEqual(names.filter(n => n.startsWith('device_hidden')), ['device_hidden', `device_hidden:${KIT}`]);
    assert.deepEqual(w.emitted.find(e => e[0] === 'device_hidden')[1], { itemId: KIT, spotId: SPOT, roomId: 'reception', deviceId: 'planted_rogue_ap' });
    // after the hide only the host stays interactable
    assert.equal(w.p77.interactable, true);
    assert.equal(w.p76.interactable, false);
    // a second tap does not hide again
    assert.equal(w.ph.claims(w.p76), false);
});

test('a first request that fails at the network and a retry answered 200 complete the hide once', async () => {
    const w = world({ held: true });
    const calls = stubFetch((n) => {
        if (n === 1) throw new Error('offline');
        return jsonResp(200, { success: true, hidden: { item: KIT, on: SPOT, room: 'reception' } });
    });
    const r = await w.ph.interact(w.p77);
    assert.equal(r.action, 'hidden');
    assert.equal(calls.length, 2);
    assert.equal(w.actions.length, 1);
    assert.equal(w.scene.made.length, 1);
});

test('a 5xx twice leaves the item and toasts to try again', async () => {
    const w = world({ held: true });
    const calls = stubFetch(() => jsonResp(503, {}));
    const r = await w.ph.interact(w.p77);
    assert.equal(r.action, 'error');
    assert.equal(calls.length, 2);
    assert.equal(w.toasts[0][0], 'Could not hide it. Try again.');
    assert.equal(inventory.items.length, 1);
});

test('already_hidden with an entry drops the tray item, draws on the named spot, no onHidden', async () => {
    const w = world({ held: true });
    const other = 'reception_plant-large11-top-ani1_76';
    stubFetch(() => jsonResp(422, { success: false, reason: 'already_hidden', message: 'x', hidden: { item: KIT, on: other, room: 'reception' } }));
    const r = await w.ph.interact(w.p77);
    assert.deepEqual(r, { action: 'refused', reason: 'already_hidden' });
    assert.equal(inventory.items.length, 0);
    assert.equal(w.actions.length, 0);
    assert.equal(w.toasts[0][0], 'It is already hidden.');
    assert.equal(w.scene.made.length, 1);
    assert.ok(w.p76._fadeCompanions.has(w.scene.made[0]));
    assert.equal(w.ph.hidden.get(KIT).on, other);
});

test('a second tap while the request is in flight is ignored', async () => {
    const w = world({ held: true });
    let release;
    globalThis.fetch = () => new Promise(res => { release = () => res(jsonResp(200, { success: true, hidden: { item: KIT, on: SPOT, room: 'reception' } })); });
    const first = w.ph.interact(w.p77);
    await settle();
    const second = await w.ph.interact(w.p77);
    assert.equal(second.action, 'busy');
    release();
    assert.equal((await first).action, 'hidden');
});

test('the hosting tap opens the console once through openWifiTwin and sends no request', async () => {
    const w = world({ held: false, hiddenDevices: [{ item: KIT, on: SPOT, room: 'reception' }] });
    w.ph.syncRoom('reception');
    assert.equal(w.scene.made.length, 1, 'drawn from hiddenDevices with the kit not held');
    assert.equal(w.p77.interactable, true, 'the host stays interactable');
    const opened = [];
    globalThis.openWifiTwin = (sp) => opened.push(sp);
    const calls = stubFetch(() => jsonResp(200, {}));
    const r = await w.ph.interact(w.p77);
    assert.equal(r.action, 'opened');
    assert.equal(opened.length, 1);
    assert.equal(opened[0], w.scene.made[0]);
    assert.equal(calls.length, 0);
});

// ---------------------------------------------------------------- overlay and sync

test('syncRoom draws the overlay once however often it runs', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: SPOT, room: 'reception' }] });
    w.ph.syncRoom('reception');
    w.ph.syncRoom('reception');
    assert.equal(w.scene.made.length, 1);
    w.ph.syncRoom('comms');
    assert.equal(w.scene.made.length, 1);
});

test('R1 m2: console fields come from the room answer when the bootstrap omits deviceData', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: SPOT, room: 'reception' }] });
    w.ph.hideables.get(KIT).deviceData = {};
    w.ph.noteHiddenWith('reception', {
        id: 'planted_rogue_ap', type: 'rogue_ap', name: 'pocket rogue AP', wifiTwin: true,
        apScan: [{ ssid: 'x' }], hiddenWith: 'kit_rogue_ap', x: 5, observations: 'n'
    });
    w.ph.syncRoom('reception');
    const dev = w.scene.made[0];
    assert.equal(dev.scenarioData.wifiTwin, true);
    assert.deepEqual(dev.scenarioData.apScan, [{ ssid: 'x' }]);
    assert.equal('hiddenWith' in dev.scenarioData, false, 'only the whitelisted console fields');
    assert.equal('x' in dev.scenarioData, false);
});

// Whether the server sends deviceData at all (it does when the hideable has more than the one
// authored room) is decided in Ruby; hide_device_test.rb and lab_plant_hiding_test.rb guard that.
// These two cases cover the client side of it: the overlay takes its console fields from the
// bootstrap deviceData when the definition carries it, and has none when it does not.
test('R2 M1: a two-room hideable hidden in the non-authored room opens with the bootstrap deviceData', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: 'comms_fern', room: 'comms' }] });
    const def = w.ph.hideables.get(KIT);
    def.rooms = ['reception', 'comms'];
    def.deviceData = { id: 'planted_rogue_ap', type: 'rogue_ap', name: 'bootstrap copy', wifiTwin: true, apScan: [{ ssid: 'from-bootstrap' }] };
    w.comms.objects.comms_fern = scenarioPlant(w.scene, 'comms_fern', { roomId: 'comms' });
    // The authored room (reception) never loads: no noteHiddenWith call. Comms loads first.
    w.ph.syncRoom('comms');
    assert.equal(w.scene.made.length, 1);
    const dev = w.scene.made[0];
    assert.equal(dev.roomId, 'comms');
    assert.equal(dev.scenarioData.id, 'planted_rogue_ap');
    assert.equal(dev.scenarioData.name, 'bootstrap copy', 'the fields came from the bootstrap definition');
    assert.deepEqual(dev.scenarioData.apScan, [{ ssid: 'from-bootstrap' }]);
});

test('R2 M1: with no bootstrap deviceData and the authored room never loaded, the overlay has no console fields', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: 'comms_fern', room: 'comms' }] });
    const def = w.ph.hideables.get(KIT);
    def.rooms = ['reception', 'comms'];
    delete def.deviceData;
    w.comms.objects.comms_fern = scenarioPlant(w.scene, 'comms_fern', { roomId: 'comms' });
    w.ph.syncRoom('comms');
    const dev = w.scene.made[0];
    assert.equal(dev.roomId, 'comms');
    assert.equal('wifiTwin' in dev.scenarioData, false, 'nothing to fall back on, which is why the server sends deviceData for several rooms');
});

test('a missing host logs one warning and the overlay goes on the first eligible plant', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: 'reception_plant-large12-top-ani1_999', room: 'reception' }] });
    const warns = [];
    console.warn = (...a) => warns.push(a);
    w.ph.syncRoom('reception');
    w.ph.drawOverlay(w.ph.hidden.get(KIT));
    console.warn = () => {};
    assert.equal(warns.length, 1);
    assert.equal(w.scene.made.length, 1);
    const host = [...Object.values(w.room.objects)].find(s => s._fadeCompanions?.size);
    assert.ok(host, 'drawn on an eligible plant');
    assert.equal(w.ph.hidden.get(KIT).on, 'reception_plant-large12-top-ani1_999', 'the record is not changed');
});

test('R2 M1: a device recorded on a spot that is no longer a plant is drawn on the fallback plant and a tap there opens the console', async () => {
    const w = world({ held: false, hiddenDevices: [{ item: KIT, on: 'rogue_ap_spot', room: 'reception' }] });
    w.ph.syncRoom('reception');
    assert.equal(w.scene.made.length, 1, 'drawn');
    const host = Object.values(w.room.objects).find(s => s._fadeCompanions?.size);
    assert.ok(host, 'drawn on a fallback plant');
    assert.equal(w.ph.claims(host), true, 'the fallback host is claimed');
    assert.equal(host.interactable, true, 'and interactable');
    assert.equal(w.ph.hidden.get(KIT).on, 'rogue_ap_spot', 'the record keeps its own spot');
    assert.equal(w.ph.spotForDevice('planted_rogue_ap'), w.ph._spotInfo(host).id, 'the bridge maps the device to the fallback host');
    const other = Object.values(w.room.objects).find(s => s !== host && w.ph.spotsFor(s).length);
    assert.equal(w.ph.hostedEntry(other), null, 'no second host');
    const opened = [];
    globalThis.openWifiTwin = (sp) => opened.push(sp);
    const calls = stubFetch(() => jsonResp(200, {}));
    const r = await w.ph.interact(host);
    assert.equal(r.action, 'opened');
    assert.equal(opened.length, 1);
    assert.equal(calls.length, 0);
    // a second sync keeps the same host
    w.ph.syncRoom('reception');
    assert.equal(w.ph.hostedEntry(host)?.item, KIT);
});

test('H5 hybrid: the migrated lab room with an old-save record on rogue_ap_spot shows the device on a reception plant, tappable, console opens', async () => {
    const w = world({ held: false, hiddenDevices: [{ item: KIT, on: 'rogue_ap_spot', room: 'reception' }] });
    // the migrated lab's two scenario plants (fig_plant1, planter_fig1), neither named rogue_ap_spot
    const fig = scenarioPlant(w.scene, 'reception_planter', {}, { sprite: 'fig_plant1' });
    const desk = scenarioPlant(w.scene, 'reception_plant_desk', { x: 500 }, { sprite: 'planter_fig1' });
    w.room.objects.reception_planter = fig;
    w.room.objects.reception_plant_desk = desk;
    assert.ok(!w.room.objects.rogue_ap_spot, 'the migrated room has no spot object');
    w.ph.syncRoom('reception');
    assert.equal(w.scene.made.length, 1, 'one overlay');
    const host = Object.values(w.room.objects).find(s => s._fadeCompanions?.size);
    assert.ok(host, 'drawn on a reception plant');
    assert.equal(w.ph.hostedEntry(host)?.item, KIT);
    assert.equal(host.interactable, true, 'tappable');
    const opened = [];
    globalThis.openWifiTwin = (sp) => opened.push(sp);
    const calls = stubFetch(() => jsonResp(200, {}));
    assert.equal((await w.ph.interact(host)).action, 'opened');
    assert.equal(opened.length, 1, 'console opens');
    assert.equal(calls.length, 0, 'no request');
    assert.equal(w.ph.hidden.get(KIT).on, 'rogue_ap_spot', 'the old record is kept as it is');
});

test('R3 t1: a recorded spot that still exists but is no longer a spot falls back to an eligible plant', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: 'lobby_fern', room: 'reception' }] });
    w.sp.scenarioData.hidingSpot = false;
    w.ph.syncRoom('reception');
    assert.equal(w.scene.made.length, 1, 'drawn once');
    assert.equal(w.sp._fadeCompanions, undefined, 'not drawn on the opted-out plant');
    const host = Object.values(w.room.objects).find(s => s._fadeCompanions?.size);
    assert.ok(host && host !== w.sp && w.ph.spotsFor(host).includes(KIT), 'drawn on an eligible plant');
    assert.equal(w.ph.claims(host), true);
    assert.equal(w.ph.spotForDevice('planted_rogue_ap'), w.ph._spotInfo(host).id);
    // an excluded decor plant is treated the same way
    const w2 = world({ hiddenDevices: [{ item: KIT, on: 'reception_plant-large12-top-ani1_77', room: 'reception' }] });
    w2.ph.hideables.get(KIT).exclude.push('reception_plant-large12-top-ani1_77');
    w2.ph.syncRoom('reception');
    assert.equal(w2.p77._fadeCompanions, undefined);
    assert.notEqual(w2.ph.spotForDevice('planted_rogue_ap'), 'reception_plant-large12-top-ani1_77');
    w2.ph.hideables.get(KIT).exclude.pop();
});

test('load keeps only well-formed definitions and entries', () => {
    const ph = new PlantHiding();
    window.eventDispatcher = undefined;
    ph.load({ a: { rooms: [] }, b: { rooms: ['r'] }, c: null }, [{ item: 'b', on: 'x', room: 'r' }, { item: 'zzz', on: 'x', room: 'r' }, null]);
    assert.deepEqual([...ph.hideables.keys()], ['b']);
    assert.deepEqual(ph.hiddenMap(), { b: { item: 'b', on: 'x', room: 'r' } });
    assert.equal(ph.spotForDevice('none'), null);
});

test('spotForDevice maps a device id to its host spot', () => {
    const w = world({ hiddenDevices: [{ item: KIT, on: SPOT, room: 'reception' }] });
    assert.equal(w.ph.spotForDevice('planted_rogue_ap'), SPOT);
    assert.equal(w.ph.spotForDevice('other'), null);
});

// ---------------------------------------------------------------- wiring

test('interactions.js has the branch after the login PC and before the jack, plus openWifiTwin', () => {
    const s = src('systems/interactions.js');
    const login = s.indexOf("lockType === 'login'");
    const claim = s.indexOf('window.plantHiding?.claims?.(sprite)');
    const jack = s.indexOf('sprite.scenarioData.networkJack === true) {');
    assert.ok(login > 0 && claim > login && jack > claim);
    assert.match(s, /export function openWifiTwin\(sprite\)/);
    assert.match(s, /window\.openWifiTwin = openWifiTwin/);
    assert.match(s, /if \(sprite\.scenarioData\.wifiTwin === true\) \{\s+openWifiTwin\(sprite\);/);
    assert.equal(s.includes("from './plant-hiding.js'"), false, 'reached through window, no static import');
});

test('rooms.js skips hiddenWith objects and calls syncRoom; game.js loads and syncs the start room', () => {
    const r = src('core/rooms.js');
    assert.match(r, /if \(scenarioObj\.hiddenWith\) return void window\.plantHiding\?\.noteHiddenWith\?\.\(roomId, scenarioObj\);/);
    assert.match(r, /window\.plantHiding\?\.syncRoom\?\.\(roomId\)/);
    assert.equal(r.includes("from '../systems/plant-hiding.js'"), false);
    const g = src('core/game.js');
    assert.match(g, /import \{ plantHiding \} from '\.\.\/systems\/plant-hiding\.js'/);
    assert.match(g, /plantHiding\.load\(gameScenario\.hideables \|\| \{\}, gameScenario\.hiddenDevices \|\| \[\]\)/);
    assert.match(g, /window\.plantHiding\?\.syncRoom\?\.\(startRoomId\)/);
});

test('the bridge reads hiddenDevices and maps a device id to its host before interact', () => {
    assert.match(src('systems/test-bridge/access.js'), /hiddenDevices\(\) \{\s+const mod = window\.plantHiding;/);
    assert.match(src('systems/test-bridge/index.js'), /id = window\.plantHiding\?\.spotForDevice\?\.\(id\) \|\| id;/);
});

test('the measured table anchors every animated large family and stays inside the plant box', () => {
    for (const k of ['plant-large11-top-ani', 'plant-large12-top-ani', 'plant-large13-top-ani', 'planter-fig1-top-ani', 'planter_fig1', 'fig_plant']) {
        const a = PLANT_ANCHORS[k];
        assert.ok(a, k);
        assert.ok(a.x > 0 && a.x < 100 && a.y > 50 && a.y < 100, k);
    }
    const h = decor(fakeScene(), 'plant-large12-top-ani3', 78);
    assert.deepEqual(anchorPercent(h, 'x', {}), PLANT_ANCHORS['plant-large12-top-ani']);
});

test('the tucked overlay art is on disk and preloaded', () => {
    assert.ok(readFileSync(join(js, '../assets/objects/rogue_ap_tucked.png')).length > 50);
    assert.match(src('core/game.js'), /this\.load\.image\('rogue_ap_tucked', 'objects\/rogue_ap_tucked\.png'\)/);
});
