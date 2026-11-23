// Ops S5a unit 12: network-links.js answers needs_console (a remote-only session at the PC)
// with a toast and a refusal event, never the quiet not_ready path and never a retry.
// Run with: node test/js/network-links-needs-console.test.mjs
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
copy('utils/remote-host-text.js', 'utils/remote-host-text.js');
const inventoryUrl = copy('systems/inventory.js', 'systems/inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]);
copy('utils/sync-before-fetch.js', 'utils/sync-before-fetch.js');
const linksUrl = copy('systems/network-links.js', 'systems/network-links.js');

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const inventory = await import(inventoryUrl);
const { NetworkLinks, NO_DEVICE_HINT, LINK_GONE_MESSAGE, UNPLUG_LABEL } = await import(linksUrl);

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
    window.applyInventoryDelta = inventory.applyInventoryDelta;
    window.ApiClient = {
        async networkPlant(jackId, deviceId) {
            calls.push(['plant', jackId, deviceId]);
            const first = !links.wasGained(jackId);
            // Sync deltas P2: the server names the touched items (the link added, the device removed).
            return { success: true, foothold, added: [linkItem], removed: deviceId ? [deviceId] : [], first };
        },
        async networkUnplug(jackId) {
            calls.push(['unplug', jackId]);
            return { success: true, added: [box], removed: [linkItem.id], endedPcIds: ['door_box'] };
        },
        async network(footholdId) {
            calls.push(['network', footholdId]);
            return { footholds: [viewEntry] };
        },
        async networkImplant(pcId, shape, path) {
            calls.push(['implant', pcId, shape, path]);
            if (implantThrowsLeft > 0) { implantThrowsLeft--; const e = new Error('network down'); e.status = 500; throw e; }
            if (implantAnswer instanceof Error) throw implantAnswer;
            const consumed = implantAnswer && implantAnswer.consumedId;
            return { success: true, foothold: implantFoothold, first: true,
                     added: [implantLink], removed: consumed ? [consumed] : [], ...implantAnswer };
        },
        async networkJoin(apId, key) {
            calls.push(['join', apId, key]);
            if (typeof joinAnswer === 'function') return joinAnswer(apId, key);
            return { success: true, foothold: wifiFoothold, added: [wifiLinkItem], removed: [], first: false };
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

const refusal = (reason, error) => {
    implantAnswer = new Error('refused');
    implantAnswer.status = 422;
    implantAnswer.body = error ? { reason, error } : { reason };
};

test('needs_console toasts the server line, emits the refusal and never retries', async () => {
    await reset({ items: [box] });
    refusal('needs_console', 'Nobody is signed in at this keyboard.');
    const out = await links.implant('lena_pc', 'session', null);
    assert.deepEqual(out, { action: 'refused', reason: 'needs_console' });
    assert.deepEqual(toasts, ['Nobody is signed in at this keyboard.']);
    assert.equal(calls.filter(c => c[0] === 'implant').length, 1);
    assert.equal(links.get('implant_lena_pc'), null);
    assert.deepEqual(named('network_device_refused').map(e => e.data), [{ pcId: 'lena_pc', reason: 'needs_console' }]);
});

test('needs_console on the dropped shape does not take the not_ready retry', async () => {
    await reset({ items: [box] });
    links.notReadyDelayMs = 0;
    refusal('needs_console', 'Nobody is signed in at this keyboard.');
    const out = await links.implant('lena_pc', 'dropped', null);
    assert.equal(out.reason, 'needs_console');
    assert.equal(calls.filter(c => c[0] === 'implant').length, 1);
    delete links.notReadyDelayMs;
});

test('not_ready stays quiet', async () => {
    await reset({ items: [box] });
    refusal('not_ready');
    const out = await links.implant('lena_pc', 'session', null);
    assert.equal(out.action, 'not_ready');
    assert.deepEqual(toasts, []);
    assert.deepEqual(named('network_device_refused'), []);
});

test('usb_refused is unchanged', async () => {
    await reset({ items: [box] });
    refusal('usb_refused', 'USB devices are disabled on this PC.');
    const out = await links.implant('lena_pc', 'session', null);
    assert.deepEqual(out, { action: 'refused', reason: 'usb_refused' });
    assert.deepEqual(toasts, ['USB devices are disabled on this PC.']);
    assert.deepEqual(named('network_device_refused').map(e => e.data), [{ pcId: 'lena_pc', reason: 'usb_refused' }]);
});

test('needs_console with no error line toasts the fallback line', async () => {
    await reset({ items: [box] });
    refusal('needs_console');
    const out = await links.implant('lena_pc', 'session', null);
    assert.equal(out.reason, 'needs_console');
    assert.deepEqual(toasts, ['Nobody is signed in at this keyboard.']);
});
