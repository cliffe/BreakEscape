// Slice 9.3a step 7 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.1 and 4.3):
// systems/network-links.js. The jack click (hint, confirm, plant, unplug), the tray through
// inventory.js's server-item functions with no inventory request, <jackId>_planted, the
// events, the view opening on a first plant, the load (list, missing handle, globals before
// any room), the jack's look, and the trip's landing table ("Getting back").
// Run with: node test/js/network-links.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'network-links-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
mkdirSync(join(dir, 'systems'));
mkdirSync(join(dir, 'utils'));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
const stub = (out, code) => { writeFileSync(join(dir, out), code); };

stub('systems/rooms-stub.mjs', 'export const rooms = {};');
stub('systems/ink-stub.mjs', 'export default class InkEngine {}');
stub('systems/config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('systems/info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'systems/forced-minigame-guard.mjs');
copy('systems/consumables.js', 'systems/consumables.mjs');
copy('utils/conditional-text.js', 'utils/conditional-text.js');
copy('systems/global-writer.js', 'systems/global-writer.js');
const inventoryUrl = copy('systems/inventory.js', 'systems/inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]);
const linksUrl = copy('systems/network-links.js', 'systems/network-links.js');

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const inventory = await import(inventoryUrl);
const { NetworkLinks, NO_DEVICE_HINT, LINK_GONE_MESSAGE, UNPLUG_LABEL, LEAVE_LABEL } = await import(linksUrl);

const settle = async (n = 3) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

// ---------------------------------------------------------------- fixture

const box = { type: 'pc', id: 'kit_dropbox', name: 'Network drop box', sprite: 'drop_box1', takeable: true, rogueDevice: true };
const lockpick = { type: 'lockpick', id: 'lockpick', name: 'Lockpick set' };
const officeNet = { id: 'office_lan', name: 'Harbour office LAN' };
const foothold = { id: 'jack_comms_port', via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port',
    sourceId: 'comms_port', network: officeNet };
const linkItem = { id: 'netlink_jack_comms_port', type: 'network_link', name: 'Drop box: comms room', sprite: 'drop_box1',
    takeable: false, footholdId: 'jack_comms_port', sourceId: 'comms_port',
    observations: 'Your Network drop box on Spare wall port. Open it to see what it reaches.' };
const viewEntry = { ...foothold, hosts: [
    { id: 'door_box', kind: 'pc', name: 'Door controller', host: 'HB-DOOR-01', sprite: 'network_rack1', headless: true, remoteSignIn: true },
    { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false, remoteSignIn: true }
] };

// An implant foothold (slice 9.3b I): its source is a PC, not a jack.
const implantFoothold = { id: 'implant_lena_pc', via: 'implant', name: 'BadUSB: Lena desk',
    itemId: 'netlink_implant_lena_pc', sourceId: 'lena_pc', network: officeNet };
const implantLink = { id: 'netlink_implant_lena_pc', type: 'network_link', name: 'BadUSB: Lena desk', sprite: 'drop_box1',
    takeable: false, footholdId: 'implant_lena_pc', sourceId: 'lena_pc',
    observations: 'Your implant on HB-FIN-02. Open it to see what it reaches.' };

let calls, requests, toasts, toastCalls, events, confirms, confirmAnswer, views, desktops, links, implantAnswer, implantThrowsLeft;
let joinAnswer = null; // override the networkJoin mock per test

// Wi-Fi fixtures (slice 9.3b sub-slice W)
const guestNet = { id: 'guest_wifi', name: 'Guest Wi-Fi' };
const wifiFoothold = { id: 'wifi_guest_wifi', via: 'wifi', name: 'Wi-Fi: Guest Wi-Fi', itemId: 'netlink_wifi_guest_wifi',
    sourceId: 'guest_ap', network: guestNet, sprite: 'wifi_ap1' };
const wifiLinkItem = { id: 'netlink_wifi_guest_wifi', type: 'network_link', name: 'Wi-Fi: Guest Wi-Fi', sprite: 'wifi_ap1',
    takeable: false, footholdId: 'wifi_guest_wifi', sourceId: 'guest_ap',
    observations: 'Your Wi-Fi link to Guest Wi-Fi. Open it to see what it reaches.' };
const wifiApSprite = (id = 'guest_ap', name = 'Guest access point') => ({
    scenarioData: { id, name, type: 'pc', sprite: 'wifi_ap1', wifiAp: true }
});

function jackSprite(extra = {}) {
    const sprite = {
        texture: { key: 'network_rack1' },
        scenarioData: { id: 'comms_port', type: 'pc', name: 'Spare wall port', networkJack: true,
            jackConfirm: 'Plug the drop box into this port?', plantedSprite: 'pi_cluster1', ...extra },
        setTexture(key) { this.texture = { key }; }
    };
    return sprite;
}

async function reset({ items = [], planted = false } = {}) {
    calls = [];
    requests = [];
    toasts = [];
    toastCalls = [];
    events = [];
    confirms = [];
    views = [];
    desktops = [];
    confirmAnswer = true;
    implantAnswer = {};
    implantThrowsLeft = 0;
    joinAnswer = null;
    globalThis.fetch = async (url, opts) => {
        const body = JSON.parse(opts?.body || '{}');
        if (body?.item?.type !== 'notepad') requests.push({ url, body });
        return { json: async () => ({ success: true }) };
    };
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = item => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = (msg, type, title, ms, opts) => { toasts.push(msg); toastCalls.push({ msg, type, ms, opts }); };
    window.gameConfirm = async (message, ok, cancel, opts) => {
        confirms.push({ message, ok, cancel, opts });
        return typeof confirmAnswer === 'function' ? confirmAnswer(message) : confirmAnswer;
    };
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    window.gameScenario = {};
    window.MinigameFramework = { currentMinigame: null };
    window.pcSessions = { has: () => false, get: () => null };
    delete window.startNetworkViewMinigame;
    delete window.openRemoteDesktop;
    window.rooms = {};
    window.showServerItem = inventory.showServerItem;
    window.syncInventoryFromServer = inventory.syncInventoryFromServer;
    window.ApiClient = {
        async networkPlant(jackId, deviceId) {
            calls.push(['plant', jackId, deviceId]);
            const first = !links.wasGained(jackId);
            const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.id !== deviceId && d.type !== 'notepad');
            return { success: true, foothold, inventory: [...inv, linkItem], first };
        },
        async networkUnplug(jackId) {
            calls.push(['unplug', jackId]);
            const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.id !== linkItem.id && d.type !== 'notepad');
            return { success: true, inventory: [...inv, box], endedPcIds: ['door_box'] };
        },
        async network(footholdId) {
            calls.push(['network', footholdId]);
            return { footholds: [viewEntry] };
        },
        async networkImplant(pcId, shape, path) {
            calls.push(['implant', pcId, shape, path]);
            if (implantThrowsLeft > 0) { implantThrowsLeft--; const e = new Error('network down'); e.status = 500; throw e; }
            if (implantAnswer instanceof Error) throw implantAnswer;
            const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.type !== 'notepad');
            return { success: true, foothold: implantFoothold, inventory: [...inv, implantLink], first: true, ...implantAnswer };
        },
        async networkJoin(apId, key) {
            calls.push(['join', apId, key]);
            if (typeof joinAnswer === 'function') return joinAnswer(apId, key);
            const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.type !== 'notepad');
            return { success: true, foothold: wifiFoothold, inventory: [...inv, wifiLinkItem], first: false };
        }
    };
    inventory.initializeInventory();
    await settle();
    for (const data of items) {
        await inventory.addToInventory({ name: data.type, objectId: `obj_${data.id}`, scenarioData: { ...data }, _restoredFromSave: true });
    }
    requests.length = 0;
    links = new NetworkLinks();
    window.networkLinks = links;
    if (planted) {
        links.load([foothold], ['comms_port']);
        inventory.showServerItem(linkItem, { restored: true });
    }
}

const held = id => window.inventory.items.filter(it => it.scenarioData?.id === id);
const named = (name) => events.filter(e => e.name === name);
const withStarters = () => {
    window.startNetworkViewMinigame = (footholdId, opts) => views.push({ footholdId, ...opts });
    window.openRemoteDesktop = (pcId, footholdId) => desktops.push({ pcId, footholdId });
};

// ---------------------------------------------------------------- the jack

test('a jack click with no device shows the default hint, sends nothing and emits the refusal', async () => {
    await reset({ items: [lockpick] });
    const out = await links.interactJack(jackSprite());
    assert.equal(out.action, 'refused');
    assert.deepEqual(toasts, [NO_DEVICE_HINT]);
    assert.deepEqual(calls, []);
    assert.deepEqual(confirms, [], 'no confirm without a device');
    assert.deepEqual(named('network_device_refused').map(e => e.data), [{ jackId: 'comms_port', reason: 'no_device' }]);
    assert.equal(named('network_device_refused:comms_port').length, 1);
});

test('the refusal reads the jack\'s requiresItemHint through its variants', async () => {
    await reset();
    window.gameState.globalVariables.met_ian = true;
    await links.interactJack(jackSprite({ requiresItemHint: 'Something small would fit this port.',
        requiresItemHintVariants: [{ condition: 'globalVars.met_ian', value: 'Ian mentioned a drop box.' }] }));
    assert.deepEqual(toasts, ['Ian mentioned a drop box.']);
});

test('with a device the jack confirms first, and a cancelled confirm sends nothing', async () => {
    await reset({ items: [box] });
    confirmAnswer = false;
    const out = await links.interactJack(jackSprite());
    assert.equal(out.action, 'cancelled');
    assert.equal(confirms.length, 1);
    assert.equal(confirms[0].message, 'Plug the drop box into this port?');
    assert.equal(confirms[0].opts.plainText, true, 'author text is shown as plain text');
    assert.deepEqual(calls, []);
    assert.equal(held('kit_dropbox').length, 1, 'the box is still held');
});

test('the default confirm names the device and the jack', async () => {
    await reset({ items: [box] });
    confirmAnswer = false;
    await links.interactJack(jackSprite({ jackConfirm: undefined }));
    assert.equal(confirms[0].message, 'Plug Network drop box into Spare wall port?');
});

test('a plant: link item in with no request, box out, global, events once each, view opens on the first', async () => {
    await reset({ items: [box, lockpick] });
    withStarters();
    const sprite = jackSprite();
    window.rooms = { comms_room: { objects: { comms_port: sprite } } };
    const out = await links.interactJack(sprite);
    assert.equal(out.action, 'planted');
    assert.deepEqual(calls, [['plant', 'comms_port', 'kit_dropbox']]);
    assert.equal(requests.length, 0, 'no inventory request');
    assert.equal(held('kit_dropbox').length, 0, 'the box left the tray');
    assert.equal(held(linkItem.id).length, 1, 'the link item arrived');
    assert.equal(held('lockpick').length, 1);
    assert.equal(window.gameState.globalVariables.comms_port_planted, true);
    assert.deepEqual(named('network_device_planted').map(e => e.data),
        [{ jackId: 'comms_port', footholdId: 'jack_comms_port', networkId: 'office_lan', deviceId: 'kit_dropbox' }]);
    assert.deepEqual(named('network_foothold_gained').map(e => e.data),
        [{ footholdId: 'jack_comms_port', via: 'jack', networkId: 'office_lan', sourceId: 'comms_port' }]);
    assert.equal(named('network_foothold_gained:comms_port').length, 1);
    assert.equal(sprite.texture.key, 'pi_cluster1', 'the jack shows its plantedSprite');
    assert.equal(sprite.scenarioData.jackPlanted, true);
    assert.deepEqual(views, [{ footholdId: 'jack_comms_port', message: null }], 'the view opened by itself');
    assert.deepEqual(links.list(), [foothold]);
    assert.equal(links.wasGained('comms_port'), true);
});

test('a plant that is not the first at that jack does not open the view', async () => {
    await reset({ items: [box] });
    withStarters();
    links.gained.add('comms_port');
    const out = await links.interactJack(jackSprite());
    assert.equal(out.first, false);
    assert.deepEqual(views, []);
    assert.equal(named('network_foothold_gained').length, 1, 'a foothold is still gained');
});

test('a server refusal (no_device) shows the hint and emits the refusal', async () => {
    await reset({ items: [box] });
    window.ApiClient.networkPlant = async () => { const e = new Error('x'); e.status = 422; e.body = { reason: 'no_device' }; throw e; };
    const out = await links.interactJack(jackSprite());
    assert.equal(out.action, 'refused');
    assert.equal(named('network_device_refused').length, 1);
    assert.equal(held('kit_dropbox').length, 1, 'nothing changed in the tray');
    assert.deepEqual(links.list(), []);
});

test('a port-security refusal shows the authored message, keeps the device and emits the refusal', async () => {
    await reset({ items: [box] });
    const message = 'This port only takes known machines. Disable unused ports.';
    window.ApiClient.networkPlant = async () => {
        const e = new Error('x'); e.status = 422; e.body = { reason: 'port_security', error: message }; throw e;
    };
    const out = await links.interactJack(jackSprite());
    assert.equal(out.action, 'refused');
    assert.equal(out.reason, 'port_security');
    assert.deepEqual(named('network_device_refused').map(e => e.data), [{ jackId: 'comms_port', reason: 'port_security' }]);
    assert.ok(toasts.includes(message), 'the authored message is shown');
    assert.equal(held('kit_dropbox').length, 1, 'the device stays in the tray');
    assert.deepEqual(links.list(), []);
});

test('the port-security refusal toast carries author text as plain text (review R1 minor 1)', async () => {
    await reset({ items: [box] });
    const message = 'Known machines only. <disable> unused ports.';
    window.ApiClient.networkPlant = async () => {
        const e = new Error('x'); e.status = 422; e.body = { reason: 'port_security', error: message }; throw e;
    };
    await links.interactJack(jackSprite());
    const call = toastCalls.find(c => c.msg === message);
    assert.ok(call, 'the authored message was shown');
    assert.equal(call.opts?.plainText, true, 'author text is shown as plain text, not HTML');
});

test('the no-device hint toast is shown as plain text too (review R1 minor 1)', async () => {
    await reset({ items: [lockpick] });
    await links.interactJack(jackSprite());
    const call = toastCalls.find(c => c.msg === NO_DEVICE_HINT);
    assert.ok(call, 'the hint was shown');
    assert.equal(call.opts?.plainText, true, 'the hint is shown as plain text');
});

test('a port-security refusal with no server message shows the fallback line (review R1 nit 2)', async () => {
    await reset({ items: [box] });
    window.ApiClient.networkPlant = async () => {
        const e = new Error('x'); e.status = 422; e.body = { reason: 'port_security' }; throw e;
    };
    const out = await links.interactJack(jackSprite());
    assert.equal(out.reason, 'port_security');
    assert.ok(toasts.includes('That port only takes known machines.'), 'the generic fallback is shown when b.error is absent');
});

test('a planted jack asks "Unplug it" / "Leave it"; "Leave it" and Esc send nothing', async () => {
    await reset({ planted: true });
    confirmAnswer = false; // "Leave it", Esc and the close cross all resolve false
    const out = await links.interactJack(jackSprite());
    assert.equal(out.action, 'left');
    assert.equal(confirms[0].message, 'Your Network drop box is plugged in here. Open it from your inventory.');
    assert.equal(confirms[0].ok, UNPLUG_LABEL);
    assert.equal(confirms[0].cancel, LEAVE_LABEL);
    assert.deepEqual(calls, []);
    assert.equal(held(linkItem.id).length, 1);
});

test('"Unplug it" restores the tray, ends the foothold and emits network_device_unplugged with endedPcIds', async () => {
    await reset({ planted: true });
    const sprite = jackSprite();
    window.rooms = { comms_room: { objects: { comms_port: sprite } } };
    links.syncRoom('comms_room');
    assert.equal(sprite.texture.key, 'pi_cluster1');
    const out = await links.interactJack(sprite);
    assert.equal(out.action, 'unplugged');
    assert.deepEqual(calls, [['unplug', 'comms_port']]);
    assert.equal(requests.length, 0, 'no inventory request');
    assert.equal(held('kit_dropbox').length, 1, 'one box in the tray');
    assert.equal(held(linkItem.id).length, 0, 'the link item left');
    assert.deepEqual(named('network_device_unplugged').map(e => e.data),
        [{ jackId: 'comms_port', footholdId: 'jack_comms_port', endedPcIds: ['door_box'] }]);
    assert.equal(window.gameState.globalVariables.comms_port_planted, false);
    assert.equal(sprite.texture.key, 'network_rack1', 'the jack is back to its own look');
    assert.deepEqual(links.list(), []);
    assert.equal(links.wasGained('comms_port'), true, 'gained stays');
});

// ---------------------------------------------------------------- load

test('on load: the list is restored, the globals are set before any room, no request', async () => {
    await reset();
    window.gameState.globalVariables = {};
    links.load([foothold], ['comms_port', 'bench_port']);
    assert.deepEqual(links.list(), [foothold]);
    assert.equal(window.gameState.globalVariables.comms_port_planted, true);
    assert.equal(window.gameState.globalVariables.bench_port_planted, false, 'gained once, not held now');
    assert.equal(links.wasGained('bench_port'), true);
    assert.deepEqual(calls, []);
    assert.equal(requests.length, 0);
});

test('on load: a missing link item is shown again with no request; one already held is left alone', async () => {
    await reset();
    links.load([foothold], ['comms_port']);
    assert.equal(links.restoreHandles(), 1);
    assert.equal(held(linkItem.id).length, 1);
    assert.equal(held(linkItem.id)[0].scenarioData.footholdId, 'jack_comms_port');
    assert.equal(links.restoreHandles(), 0);
    assert.equal(held(linkItem.id).length, 1);
    assert.equal(requests.length, 0);
    assert.deepEqual(calls, []);
});

test('on load: the rebuilt link item takes the sprite, observations and storeIn the bootstrap carries (review R1 minor 2)', async () => {
    await reset();
    const observations = 'Your Network drop box on Spare wall port. Open it to see what it reaches.';
    links.load([{ ...foothold, sprite: 'drop_box', observations, storeIn: 'capture_log' }], ['comms_port']);
    assert.equal(links.restoreHandles(), 1);
    const data = held(linkItem.id)[0].scenarioData;
    assert.equal(data.sprite, 'drop_box');
    assert.equal(data.observations, observations);
    assert.equal(data.storeIn, 'capture_log');
    assert.equal(links._deviceName(links.get('jack_comms_port')), 'Network drop box', 'the jack names the device again');
});

test('a room\'s jacks take their look when the room is made', async () => {
    await reset();
    links.load([foothold], ['comms_port', 'bench_port']);
    const planted = jackSprite();
    const bare = jackSprite({ id: 'bench_port', plantedSprite: 'pi_cluster1' });
    window.rooms = { a: { objects: { x: planted, y: bare } } };
    links.syncRoom('a');
    assert.equal(planted.texture.key, 'pi_cluster1');
    assert.equal(bare.texture.key, 'network_rack1');
});

test('view() keeps the last GET /network entry; a 404 drops the foothold and its handle', async () => {
    await reset({ planted: true });
    const out = await links.view('jack_comms_port');
    assert.equal(out.ok, true);
    assert.deepEqual(links.lastView('jack_comms_port'), viewEntry);
    window.ApiClient.network = async () => { const e = new Error('x'); e.status = 404; throw e; };
    const gone = await links.view('jack_comms_port');
    assert.deepEqual(gone, { ok: false, reason: 'gone' });
    assert.deepEqual(links.list(), []);
    assert.equal(held(linkItem.id).length, 0);
    assert.equal(window.gameState.globalVariables.comms_port_planted, false);
});

// ---------------------------------------------------------------- the trip (4.3)

test('before step 8: open shows a toast naming the network and ends the trip, running returnTo', async () => {
    await reset({ planted: true });
    const back = [];
    links.open('jack_comms_port', { returnTo: (d) => back.push(d) });
    await settle();
    assert.deepEqual(toasts, ['Drop box: comms room, on Harbour office LAN']);
    assert.deepEqual(named('network_view_closed').map(e => e.data), [{ footholdId: 'jack_comms_port', reason: 'closed' }]);
    assert.deepEqual(back, [{ reason: 'closed' }]);
    assert.equal(links.trip, null);
    assert.ok(calls.some(c => c[0] === 'network'), 'the view is fetched so a run can read it');
});

test('a link item click opens the view for its foothold through window.networkLinks', async () => {
    await reset({ planted: true });
    withStarters();
    links.open(held(linkItem.id)[0].scenarioData.footholdId);
    assert.deepEqual(views, [{ footholdId: 'jack_comms_port', message: null }]);
    assert.equal(links.trip.start, 'view');
});

// One case per row of the landing table
async function tripFromView() {
    await reset({ planted: true });
    withStarters();
    const back = [];
    links.open('jack_comms_port', { returnTo: (d) => back.push(d) });
    views.length = 0;
    return back;
}
const closed = () => named('network_view_closed').map(e => e.data);

test('landing: the view closed by Close, the cross or Esc goes to the world', async () => {
    const back = await tripFromView();
    assert.equal(links.landed('view', 'close').landing, 'world');
    await settle();
    assert.deepEqual(closed(), [{ footholdId: 'jack_comms_port', reason: 'closed' }]);
    assert.deepEqual(back, [{ reason: 'closed' }]);
});

test('landing: the view handing over to a host or a share leaves the trip running, with no event', async () => {
    const back = await tripFromView();
    window.MinigameFramework.currentMinigame = { name: 'password' };
    assert.equal(links.landed('view', 'handover').landing, 'handover');
    await settle();
    assert.deepEqual(closed(), []);
    assert.deepEqual(back, []);
    assert.ok(links.trip, 'the trip goes on');
});

test('landing: the remote sign-in screen closed with no session at that PC reopens the view', async () => {
    await tripFromView();
    assert.equal(links.landed('signin', 'close', { pcId: 'lena_pc' }).landing, 'view');
    await settle();
    assert.deepEqual(views, [{ footholdId: 'jack_comms_port', message: null }]);
    assert.deepEqual(closed(), []);
});

test('landing: the remote sign-in screen, signed in, hands over to the desktop', async () => {
    await tripFromView();
    assert.equal(links.landed('signin', 'handover', { pcId: 'lena_pc' }).landing, 'handover');
    await settle();
    assert.deepEqual(views, []);
});

test('landing: Switch user left with no new sign-in returns to the desktop of the session still held', async () => {
    await tripFromView();
    window.pcSessions = { has: (id) => id === 'lena_pc', get: (id) => (id === 'lena_pc' ? { pcId: id, via: 'password' } : null) };
    assert.equal(links.landed('signin', 'close', { pcId: 'lena_pc' }).landing, 'desktop');
    await settle();
    assert.deepEqual(desktops, [{ pcId: 'lena_pc', footholdId: 'jack_comms_port' }]);
    assert.deepEqual(views, []);
});

test('landing: the remote sign-in screen closed at a PC with only a claimed session returns to the view', async () => {
    await tripFromView();
    window.pcSessions = { has: () => true, get: (id) => ({ pcId: id, via: 'claim' }) };
    assert.equal(links.landed('signin', 'close', { pcId: 'lena_pc' }).landing, 'view');
    await settle();
    assert.deepEqual(desktops, []);
    assert.equal(views.length, 1);
});

test('landing: a remote desktop closed returns to the view when the trip began at the view', async () => {
    await tripFromView();
    assert.equal(links.landed('desktop', 'close', { pcId: 'lena_pc' }).landing, 'view');
    await settle();
    assert.equal(views.length, 1);
});

test('landing: a remote desktop closed goes to the world when the trip began at openSession', async () => {
    await reset({ planted: true });
    withStarters();
    window.pcSessions = { has: () => true, get: (id) => ({ pcId: id, footholdId: 'jack_comms_port', host: 'HB-FIN-02' }) };
    const back = [];
    links.openSession('lena_pc', { returnTo: (d) => back.push(d) });
    assert.deepEqual(desktops, [{ pcId: 'lena_pc', footholdId: 'jack_comms_port' }]);
    assert.equal(links.landed('desktop', 'close', { pcId: 'lena_pc' }).landing, 'world');
    await settle();
    assert.deepEqual(back, [{ reason: 'closed' }]);
    assert.deepEqual(views, []);
});

test('landing: a file opened from a remote desktop hands over to the reader', async () => {
    await tripFromView();
    assert.equal(links.landed('desktop', 'item').landing, 'handover');
    assert.equal(links.landed('desktop', 'switch').landing, 'handover');
    assert.equal(links.landed('desktop', 'share').landing, 'handover');
    await settle();
    assert.deepEqual(views, []);
    assert.deepEqual(closed(), []);
});

test('landing: Sign out and a displaced session on a remote desktop return to the view', async () => {
    await tripFromView();
    assert.equal(links.landed('desktop', 'sign_out').landing, 'view');
    await settle();
    assert.equal(links.landed('desktop', 'displaced').landing, 'view');
    await settle();
    assert.equal(views.length, 2);
});

test('landing: a 403 no_session or unreachable returns to the view with its message', async () => {
    await tripFromView();
    links.views.set('jack_comms_port', viewEntry);
    links.landed('desktop', 'no_session', { pcId: 'lena_pc' });
    await settle();
    links.landed('desktop', 'unreachable', { pcId: 'lena_pc' });
    await settle();
    assert.deepEqual(views.map(v => v.message), [
        'Your session on HB-FIN-02 has ended.',
        "HB-FIN-02 can't be reached over this link."
    ]);
});

test('landing: "The link dropped" goes to the world with reason link_dropped', async () => {
    const back = await tripFromView();
    assert.equal(links.landed('desktop', 'link_dropped').landing, 'world');
    await settle();
    assert.deepEqual(closed(), [{ footholdId: 'jack_comms_port', reason: 'link_dropped' }]);
    assert.deepEqual(back, [{ reason: 'link_dropped' }]);
});

test('landing: a share opened from the view returns to the view; a file from it hands over', async () => {
    await tripFromView();
    assert.equal(links.landed('share', 'item').landing, 'handover');
    assert.equal(links.landed('share', 'close').landing, 'view');
    await settle();
    assert.equal(views.length, 1);
});

test('landing: the view finding its foothold gone goes to the world with "The link is gone."', async () => {
    const back = await tripFromView();
    assert.equal(links.landed('view', 'foothold_gone').landing, 'world');
    await settle();
    assert.ok(toasts.includes(LINK_GONE_MESSAGE));
    assert.deepEqual(closed(), [{ footholdId: 'jack_comms_port', reason: 'foothold_gone' }]);
    assert.deepEqual(back, [{ reason: 'foothold_gone' }]);
});

test('resume does nothing when a minigame has opened in the meantime', async () => {
    await tripFromView();
    const p = links.resume('hello');
    window.MinigameFramework.currentMinigame = { name: 'text-file' };
    assert.equal(await p, false);
    assert.deepEqual(views, []);
    assert.ok(links.trip, 'the trip is still running');
});

test('leave always ends the trip but skips returnTo when a minigame is open by then', async () => {
    const back = await tripFromView();
    const p = links.leave('closed');
    window.MinigameFramework.currentMinigame = { name: 'notes' };
    await p;
    assert.equal(links.trip, null);
    assert.deepEqual(closed(), [{ footholdId: 'jack_comms_port', reason: 'closed' }]);
    assert.deepEqual(back, []);
});

test('network_view_closed fires once per trip, and returnTo runs once', async () => {
    const back = await tripFromView();
    links.landed('view', 'handover');
    links.landed('signin', 'close', { pcId: 'lena_pc' });
    await settle();
    links.landed('view', 'close');
    links.landed('view', 'close');
    await settle();
    assert.equal(closed().length, 1);
    assert.equal(back.length, 1);
    assert.equal(links.landed('desktop', 'close').landing, 'none', 'no trip, nothing to land');
});

test('a new trip replaces the one running', async () => {
    const back = await tripFromView();
    const other = [];
    links.open('jack_comms_port', { returnTo: (d) => other.push(d) });
    links.landed('view', 'close');
    await settle();
    assert.deepEqual(back, []);
    assert.deepEqual(other, [{ reason: 'closed' }]);
});

// ---------------------------------------------------------------- implants (slice 9.3b I)

test('an implant adds the foothold, syncs the link item and emits foothold_gained', async () => {
    await reset({ items: [box] });
    withStarters();
    const out = await links.implant('lena_pc', 'session', null);
    await settle();
    assert.equal(out.action, 'implanted');
    assert.deepEqual(calls.at(-1), ['implant', 'lena_pc', 'session', null]);
    assert.ok(links.get('implant_lena_pc'), 'the foothold is held');
    assert.equal(links.get('implant_lena_pc').via, 'implant');
    assert.equal(held('netlink_implant_lena_pc').length, 1, 'the link item arrived');
    const gained = named('network_foothold_gained').map(e => e.data);
    assert.deepEqual(gained, [{ footholdId: 'implant_lena_pc', via: 'implant', networkId: 'office_lan', sourceId: 'lena_pc' }]);
    assert.equal(views.length, 1, 'the first foothold opens the view');
});

test('an implant removes the consumed device the server names in consumedId', async () => {
    await reset({ items: [box] });
    withStarters();
    // The server consumed the box: its answer names it in consumedId and omits it from inventory.
    implantAnswer = { inventory: [implantLink], consumedId: 'kit_dropbox' };
    await links.implant('lena_pc', 'session', null);
    await settle();
    assert.equal(held('kit_dropbox').length, 0, 'the consumed device is gone from the tray');
    assert.equal(held('netlink_implant_lena_pc').length, 1, 'the link item is there');
});

test('an implant keeps an unrelated tray item the server has not synced yet (M1)', async () => {
    await reset({ items: [box, lockpick] });
    withStarters();
    // The server consumed the box; the lockpick was picked up a tick earlier and its own
    // POST /inventory persist is still in flight, so the server snapshot omits it. The
    // reconcile must touch only the link item and the consumed device, never the lockpick.
    implantAnswer = { inventory: [implantLink], consumedId: 'kit_dropbox' };
    await links.implant('lena_pc', 'session', null);
    await settle();
    assert.equal(held('lockpick').length, 1, 'the unrelated, not-yet-synced item survives');
    assert.equal(held('kit_dropbox').length, 0, 'the consumed device is gone');
    assert.equal(held('netlink_implant_lena_pc').length, 1, 'the link item arrived');
});

test('a dropped-shape implant (N11) consumes nothing from the tray', async () => {
    await reset({ items: [lockpick] });
    withStarters();
    // The dropped shape: an NPC used a dropped device, so nothing leaves the player's tray.
    // The server names no consumedId; the reconcile adds only the link item.
    implantAnswer = { inventory: [implantLink] };
    const out = await links.implant('door_box', 'dropped', null);
    await settle();
    assert.equal(out.action, 'implanted');
    assert.deepEqual(calls.at(-1), ['implant', 'door_box', 'dropped', null]);
    assert.equal(held('lockpick').length, 1, 'the unrelated item is kept');
    assert.equal(held('netlink_implant_lena_pc').length, 1, 'the link item arrived');
});

test('an implant retries once after a network error and then succeeds', async () => {
    await reset({ items: [box] });
    withStarters();
    implantThrowsLeft = 1; // first call throws a 500, the retry succeeds
    implantAnswer = { inventory: [implantLink], consumedId: 'kit_dropbox' };
    const out = await links.implant('lena_pc', 'session', null);
    await settle();
    assert.equal(out.action, 'implanted');
    assert.equal(calls.filter(c => c[0] === 'implant').length, 2, 'it retried exactly once');
    assert.deepEqual(toasts, [], 'a recovered retry shows nothing');
    assert.equal(held('netlink_implant_lena_pc').length, 1);
});

test('an implant lost to both retries shows a message and grants nothing (n2)', async () => {
    await reset({ items: [box] });
    withStarters();
    const err = new Error('still down'); err.status = 500;
    implantAnswer = err; // every call throws
    const out = await links.implant('lena_pc', 'session', null);
    await settle();
    assert.equal(out.action, 'error');
    assert.equal(calls.filter(c => c[0] === 'implant').length, 2, 'it retried once then gave up');
    assert.equal(toasts.length, 1, 'a plain-text message is shown');
    assert.equal(links.get('implant_lena_pc'), null, 'no foothold');
});

test('an implant that answers already does not re-emit or reopen', async () => {
    await reset({ items: [box] });
    withStarters();
    implantAnswer = { already: true, first: false };
    const out = await links.implant('lena_pc', 'session', null);
    assert.equal(out.action, 'already');
    assert.equal(named('network_foothold_gained').length, 0);
    assert.equal(views.length, 0);
    // n1: the planted global is published before the already return, as plant() does
    assert.equal(window.gameState.globalVariables.lena_pc_planted, true);
});

test('a usb_refused answer toasts the authored line and emits the refusal, no foothold', async () => {
    await reset({ items: [box] });
    implantAnswer = new Error('refused');
    implantAnswer.status = 422;
    implantAnswer.body = { reason: 'usb_refused', error: 'USB devices are disabled on this PC.' };
    const out = await links.implant('lena_pc', 'session', null);
    assert.equal(out.action, 'refused');
    assert.equal(out.reason, 'usb_refused');
    assert.deepEqual(toasts, ['USB devices are disabled on this PC.']);
    assert.equal(links.get('implant_lena_pc'), null);
    assert.deepEqual(named('network_device_refused').map(e => e.data), [{ pcId: 'lena_pc', reason: 'usb_refused' }]);
});

test('a not_ready answer is quiet and grants nothing', async () => {
    await reset({ items: [box] });
    implantAnswer = new Error('not ready');
    implantAnswer.status = 422;
    implantAnswer.body = { reason: 'not_ready' };
    const out = await links.implant('lena_pc', 'session', null);
    assert.equal(out.action, 'not_ready');
    assert.deepEqual(toasts, []);
    assert.equal(links.get('implant_lena_pc'), null);
});

// ---------------------------------------------------------------- Wi-Fi (slice 9.3b W)

test('an access point click joins an open network (no prompt), adds the link item and emits events once', async () => {
    await reset();
    const r = await links.interactWifiAp(wifiApSprite());
    assert.equal(r.action, 'joined');
    assert.equal(r.footholdId, 'wifi_guest_wifi');
    // Only the keyless probe was sent (an open network joins at once)
    assert.deepEqual(calls.filter(c => c[0] === 'join'), [['join', 'guest_ap', null]]);
    assert.equal(held('netlink_wifi_guest_wifi').length, 1, 'the link item is in the tray');
    assert.ok(links.get('wifi_guest_wifi'), 'the foothold is held');
    assert.equal(named('network_joined').length, 1);
    assert.equal(named('network_foothold_gained').length, 1);
    assert.equal(named('network_joined')[0].data.apId, 'guest_ap');
});

test('the first join opens the view', async () => {
    await reset();
    withStarters();
    joinAnswer = () => {
        const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.type !== 'notepad');
        return { success: true, foothold: wifiFoothold, inventory: [...inv, wifiLinkItem], first: true };
    };
    await links.interactWifiAp(wifiApSprite());
    await settle();
    assert.equal(views.length, 1);
    assert.equal(views[0].footholdId, 'wifi_guest_wifi');
});

test('a keyed network: the probe gets wrong_key, the key minigame opens, and a right key joins', async () => {
    await reset();
    // The server refuses the keyless probe, then accepts the real key
    let joined = false;
    joinAnswer = (apId, key) => {
        if (joined || (key && key === 'seabreeze-2025')) {
            joined = true;
            const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.type !== 'notepad');
            return { success: true, foothold: wifiFoothold, inventory: [...inv, wifiLinkItem], first: false };
        }
        const e = new Error('x'); e.status = 422; e.body = { reason: 'wrong_key' }; throw e;
    };
    const started = [];
    window.MinigameFramework = { currentMinigame: null, mainGameScene: {}, startMinigame: (name, _b, opts) => started.push({ name, opts }) };
    const r = await links.interactWifiAp(wifiApSprite());
    assert.equal(r.action, 'prompt');
    assert.equal(started.length, 1);
    assert.equal(started[0].opts.join.apId, 'guest_ap');
    assert.ok(!links.get('wifi_guest_wifi'), 'no foothold yet');
    // The minigame submits the right key through links.join
    const r2 = await links.join('guest_ap', 'seabreeze-2025');
    assert.equal(r2.action, 'joined');
    assert.ok(links.get('wifi_guest_wifi'));
});

test('an access-point name containing HTML never reaches the base minigame title', async () => {
    await reset();
    // The server refuses the keyless probe, so the first click opens the key minigame
    joinAnswer = () => { const e = new Error('x'); e.status = 422; e.body = { reason: 'wrong_key' }; throw e; };
    const started = [];
    window.MinigameFramework = { currentMinigame: null, mainGameScene: {}, startMinigame: (name, _b, opts) => started.push({ name, opts }) };
    const hostileName = 'Guest <img src=x onerror=alert(1)>';
    const r = await links.interactWifiAp(wifiApSprite('guest_ap', hostileName));
    assert.equal(r.action, 'prompt');
    assert.equal(started.length, 1);
    // params.title feeds the unescaped base-minigame HTML header, so the author access-point
    // name must never be passed as the title. The join branch builds its own escaped header
    // from join.apName instead.
    assert.equal(started[0].opts.title, 'Join Wi-Fi');
    assert.ok(!started[0].opts.title.includes('<'), 'no author HTML reaches params.title');
    assert.equal(started[0].opts.join.apName, hostileName, 'the join header still receives the real name to escape');
});

test('a rapid second click on a keyed access point does not stack a second key minigame', async () => {
    await reset();
    // The server refuses the keyless probe, so the first click opens the key minigame
    joinAnswer = () => { const e = new Error('x'); e.status = 422; e.body = { reason: 'wrong_key' }; throw e; };
    const started = [];
    const mg = { currentMinigame: null, mainGameScene: {},
        startMinigame: (name, _b, opts) => { started.push({ name, opts }); mg.currentMinigame = { name, _ending: false }; } };
    window.MinigameFramework = mg;
    const r1 = await links.interactWifiAp(wifiApSprite());
    assert.equal(r1.action, 'prompt');
    assert.equal(started.length, 1);
    // A second click while the key minigame is open is refused before any probe, so no stack
    const r2 = await links.interactWifiAp(wifiApSprite());
    assert.equal(r2.action, 'busy');
    assert.equal(started.length, 1, 'no second key minigame is opened');
    // Once the minigame has ended, a click probes again
    mg.currentMinigame._ending = true;
    const r3 = await links.interactWifiAp(wifiApSprite());
    assert.equal(r3.action, 'prompt');
    assert.equal(started.length, 2);
});

test('a wrong key from join resolves wrong_key with no toast and no foothold', async () => {
    await reset();
    joinAnswer = () => { const e = new Error('x'); e.status = 422; e.body = { reason: 'wrong_key' }; throw e; };
    const r = await links.join('guest_ap', 'nope');
    assert.equal(r.action, 'wrong_key');
    assert.equal(toasts.length, 0);
    assert.ok(!links.get('wifi_guest_wifi'));
});

test('a second access point of a joined network answers already, emits network_joined, does not reopen the view', async () => {
    await reset();
    withStarters();
    await links.interactWifiAp(wifiApSprite());
    await settle();
    views.length = 0;
    joinAnswer = (apId) => {
        const inv = window.inventory.items.map(it => it.scenarioData).filter(d => d.type !== 'notepad');
        return { success: true, already: true, first: false, foothold: wifiFoothold, inventory: inv };
    };
    const r = await links.interactWifiAp(wifiApSprite('guest_ap2', 'Guest AP (lift)'));
    await settle();
    assert.equal(r.action, 'already');
    assert.equal(named('network_joined').length, 2, 'network_joined fires for the second AP too');
    // The N9 mapping gates on this payload field; a first join must carry a falsey already
    // and the second-AP already-join must carry already === true (see scenario N8/N9 gate).
    assert.ok(!named('network_joined')[0].data.already, 'first join carries a falsey already');
    assert.equal(named('network_joined')[1].data.already, true, 'second-AP already-join carries already === true');
    assert.equal(views.length, 0, 'an already-joined network does not reopen the view');
});

test('a Wi-Fi foothold and its handle come back on load; a missing handle is rebuilt', async () => {
    await reset();
    links.load([wifiFoothold], ['guest_ap']);
    assert.ok(links.get('wifi_guest_wifi'));
    const shown = links.restoreHandles();
    assert.equal(shown, 1);
    const item = held('netlink_wifi_guest_wifi')[0];
    assert.ok(item, 'the link item is rebuilt');
    assert.equal(item.scenarioData.sprite, 'wifi_ap1');
});
