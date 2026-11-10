// Slice 9.3a step 8 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3): the network view.
// The rows and their actions for each kind of host and resource; a host row's order (remote
// sign-in off wins over a held session; a claimed session shows Sign in; Open for a password
// session, remote or not); the row attributes; network_viewed and network_host_opened; a
// refetch each time it opens (a return from a desktop); a handover emits no
// network_view_closed and the view's own Close does; it never reads scenario data.
// The real network-view-minigame.js, base-minigame.js and network-links.js run against jsdom.
// Run with: node test/js/network-view.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'network-view-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/conditional-text.js');
copy('systems/global-writer.js');
copy('systems/network-links.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/network-view/network-view-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { NetworkViewMinigame, hostAction, shareLockable, REMOTE_OFF_TEXT, SHARE_LOCKED_TEXT } =
    await imp('minigames/network-view/network-view-minigame.js');
const { NetworkLinks } = await imp('systems/network-links.js');

const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const officeNet = { id: 'office_lan', name: 'Harbour office LAN' };
const foothold = { id: 'jack_comms_port', via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port',
    sourceId: 'comms_port', network: officeNet };
const HOSTS = [
    { id: 'door_box', kind: 'pc', name: 'Door controller', host: 'HB-DOOR-01', sprite: 'network_rack1', headless: true, remoteSignIn: true },
    { id: 'kiosk_pc', kind: 'pc', name: 'Reception kiosk', host: 'HB-KIOSK-01', sprite: 'pc_desktop', headless: false, remoteSignIn: false },
    { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false, remoteSignIn: true,
        session: { username: 'lfox', displayName: 'Lena Fox', via: 'password', remote: true } },
    { id: 'sam_pc', kind: 'pc', name: "Sam's PC", host: 'HB-DESK-01', sprite: 'pc_desktop', headless: false, remoteSignIn: true,
        session: { username: 'sokafor', displayName: 'Sam Okafor', via: 'password', remote: false } },
    { id: 'ledger_archive', kind: 'file_share', name: 'Ledger-Archive', host: 'HB-FS01', open: false },
    { id: 'print_queue', kind: 'printer', name: 'Office print queue', host: 'HB-PRN-01', open: true, observations: 'Three payslips wait.' },
    { id: 'scanned_inbox', kind: 'file_share', name: 'Scanned-Inbox', host: 'HB-FS01', open: true }
];

let events, requests, started, signIns, desktops, scenarioReads, links, answer;

// A small stand-in for MinigameFramework: one minigame at a time, the running one ended
// (cleanup, then onComplete) before the next starts, as minigame-manager.js does.
function framework() {
    return {
        currentMinigame: null,
        mainGameScene: {},
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            started.push([type, params]);
            let m;
            if (type === 'network-view') {
                const el = document.createElement('div');
                document.body.appendChild(el);
                m = new NetworkViewMinigame(el, params);
                m._sceneType = type;
                this.currentMinigame = m;
                m.init();
                m.start();
            } else {
                m = { _sceneType: type, params, cleanup() {} };
                this.currentMinigame = m;
            }
            return m;
        },
        endMinigame(success, result) {
            const m = this.currentMinigame;
            if (!m || m._ending) return;
            m._ending = true;
            m.cleanup();
            m.params?.onComplete?.(success, result);
            if (this.currentMinigame === m) this.currentMinigame = null;
            m.container?.remove?.();
        }
    };
}

function setup({ hosts = HOSTS, gone = false } = {}) {
    events = []; requests = []; started = []; signIns = []; desktops = []; scenarioReads = 0;
    answer = { footholds: [{ ...foothold, hosts: hosts.map(h => ({ ...h })) }] };
    document.body.innerHTML = '';
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = () => {};
    window.inventory = { items: [{ scenarioData: { id: 'netlink_jack_comms_port', type: 'network_link',
        observations: 'Your Network drop box on Spare wall port. Open it to see what it reaches.' } }] };
    window.ApiClient = {
        network: async (id) => {
            requests.push(['network', id]);
            if (gone) throw Object.assign(new Error('gone'), { status: 404 });
            return answer;
        }
    };
    Object.defineProperty(window, 'gameScenario', { configurable: true, get() { scenarioReads++; return {}; } });
    window.MinigameFramework = framework();
    window.openRemoteSignIn = (row, footholdId) => signIns.push([row.id, footholdId]);
    window.openRemoteDesktop = (pcId, footholdId) => desktops.push([pcId, footholdId]);
    window.startContainerMinigame = (item, contents, takeable, desktop) => window.MinigameFramework.startMinigame('container', null, { containerItem: item, desktop });
    links = new NetworkLinks();
    window.networkLinks = links;
    links.load([foothold], ['comms_port']);
    window.startNetworkViewMinigame = (footholdId, { message = null } = {}) =>
        window.MinigameFramework.startMinigame('network-view', null, { title: 'Link', footholdId, message });
}

const view = () => window.MinigameFramework.currentMinigame;
const row = (attr, id) => document.querySelector(`[${attr}="${id}"]`);
const named = (n) => events.filter(([e]) => e === n).map(([, d]) => d);

test('hostAction follows 4.3: remote sign-in off, then Open for a password session, then Sign in', () => {
    assert.equal(hostAction({ remoteSignIn: false, session: { via: 'password' } }), 'off', 'off wins over a held session');
    assert.equal(hostAction({ remoteSignIn: true, session: { via: 'password', remote: true } }), 'open');
    assert.equal(hostAction({ remoteSignIn: true, session: { via: 'password', remote: false } }), 'open', 'a local session opens too');
    assert.equal(hostAction({ remoteSignIn: true, session: { via: 'claim' } }), 'sign-in', 'a claimed session is not offered');
    assert.equal(hostAction({ remoteSignIn: true }), 'sign-in');
});

test('the view lists each row with its action and the row attributes, from GET /network only', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    assert.deepEqual(requests, [['network', 'jack_comms_port']]);
    const text = document.querySelector('.network-view-title').textContent;
    assert.equal(text, 'Drop box: comms room, on Harbour office LAN');
    assert.match(document.querySelector('.network-view-observations').textContent, /Open it to see what it reaches/);
    // Server order is kept: hosts, then resources
    assert.deepEqual([...document.querySelectorAll('[data-host-id], [data-resource-id]')].map(el => el.dataset.hostId || el.dataset.resourceId),
        ['door_box', 'kiosk_pc', 'lena_pc', 'sam_pc', 'ledger_archive', 'print_queue', 'scanned_inbox']);
    assert.equal(row('data-host-id', 'door_box').querySelector('[data-action]').dataset.action, 'sign-in');
    assert.equal(row('data-host-id', 'kiosk_pc').querySelector('[data-action]'), null);
    assert.match(row('data-host-id', 'kiosk_pc').textContent, new RegExp(REMOTE_OFF_TEXT));
    assert.equal(row('data-host-id', 'lena_pc').querySelector('[data-action]').dataset.action, 'open');
    assert.match(row('data-host-id', 'lena_pc').textContent, /Open \(Lena Fox\)/);
    assert.match(row('data-host-id', 'sam_pc').textContent, /Open \(Sam Okafor\)/);
    assert.equal(row('data-resource-id', 'ledger_archive').querySelector('[data-action]'), null);
    assert.ok(row('data-resource-id', 'ledger_archive').textContent.includes(SHARE_LOCKED_TEXT));
    assert.equal(row('data-resource-id', 'scanned_inbox').querySelector('[data-action]').dataset.action, 'open');
    assert.equal(row('data-resource-id', 'print_queue').querySelector('[data-action]').dataset.action, 'observe');
    assert.equal(scenarioReads, 0, 'the view never reads scenario data');
});

test('network_viewed carries the network, the host ids and hostList; it fires on every open', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    const expected = { footholdId: 'jack_comms_port', networkId: 'office_lan',
        hostIds: ['door_box', 'kiosk_pc', 'lena_pc', 'sam_pc'], hostList: 'door_box,kiosk_pc,lena_pc,sam_pc' };
    assert.deepEqual(named('network_viewed'), [expected]);
    assert.deepEqual(named('network_viewed:office_lan'), [expected]);
});

test('Sign in hands over to the remote sign-in screen: network_host_opened, no network_view_closed', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-host-id', 'door_box').querySelector('[data-action]').click();
    await settle();
    assert.deepEqual(signIns, [['door_box', 'jack_comms_port']]);
    assert.deepEqual(named('network_host_opened'), [{ footholdId: 'jack_comms_port', hostId: 'door_box', kind: 'pc' }]);
    assert.equal(named('network_host_opened:door_box').length, 1);
    // The sign-in screen replaces the view
    window.MinigameFramework.startMinigame('password', null, {});
    await settle();
    assert.equal(named('network_view_closed').length, 0, 'a handover never closes the trip');
    assert.ok(links.trip, 'the trip goes on');
});

test('Open on a held session opens its desktop through the foothold', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-host-id', 'lena_pc').querySelector('[data-action]').click();
    assert.deepEqual(desktops, [['lena_pc', 'jack_comms_port']]);
    assert.equal(view().exitReason, 'handover');
});

test('an open share opens in the container minigame directly, carrying sourceResourceId', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-resource-id', 'scanned_inbox').querySelector('[data-action]').click();
    await settle();
    const [type, params] = started.at(-1);
    assert.equal(type, 'container');
    assert.equal(params.containerItem.sourceResourceId, 'scanned_inbox');
    assert.equal(params.containerItem.scenarioData.type, 'network_share');
    assert.equal(params.containerItem.scenarioData.networkShare.footholdId, 'jack_comms_port');
    assert.equal(params.containerItem.scenarioData.name, 'Scanned-Inbox (\\\\HB-FS01\\Scanned-Inbox)');
    assert.equal(named('network_view_closed').length, 0);
    assert.deepEqual(shareLockable({ id: 'x', name: 'X' }, 'f').scenarioData.locked, false);
});

test('Look shows a resource\'s observations in the view and keeps it open', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-resource-id', 'print_queue').querySelector('[data-action]').click();
    assert.equal(document.querySelector('.network-view-notice').textContent, 'Three payslips wait.');
    assert.equal(view()._sceneType, 'network-view');
});

test('the view\'s own Close ends the trip: network_view_closed once, reason closed', async () => {
    setup();
    let returned = null;
    links.open('jack_comms_port', { returnTo: (r) => { returned = r; } });
    await settle();
    document.querySelector('#minigame-cancel').click();
    await settle();
    assert.deepEqual(named('network_view_closed'), [{ footholdId: 'jack_comms_port', reason: 'closed' }]);
    assert.deepEqual(returned, { reason: 'closed' });
    assert.equal(links.trip, null);
});

test('a return from a desktop refetches the view', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-host-id', 'lena_pc').querySelector('[data-action]').click();
    window.MinigameFramework.startMinigame('container', null, {});
    // The remote desktop closes by its Close: the table resumes the view
    window.MinigameFramework.endMinigame(false, null);
    links.landed('desktop', 'close', { pcId: 'lena_pc' });
    await settle();
    assert.equal(view()._sceneType, 'network-view');
    assert.deepEqual(requests, [['network', 'jack_comms_port'], ['network', 'jack_comms_port']]);
    assert.equal(named('network_viewed').length, 2);
});

test('a refetch that finds the foothold gone goes back to the world with foothold_gone', async () => {
    setup({ gone: true });
    links.open('jack_comms_port');
    await settle();
    assert.deepEqual(named('network_view_closed'), [{ footholdId: 'jack_comms_port', reason: 'foothold_gone' }]);
    assert.equal(window.MinigameFramework.currentMinigame, null);
    assert.equal(links.get('jack_comms_port'), null);
});

test('a resume message shows in the header', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    row('data-host-id', 'lena_pc').querySelector('[data-action]').click();
    window.MinigameFramework.startMinigame('container', null, {});
    window.MinigameFramework.endMinigame(false, null);
    links.landed('desktop', 'no_session', { pcId: 'lena_pc', host: 'HB-FIN-02' });
    await settle();
    assert.equal(document.querySelector('.network-view-message').textContent, 'Your session on HB-FIN-02 has ended.');
});
