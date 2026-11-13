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
copy('utils/escape-html.js');
copy('utils/author-html.js');
copy('utils/conditional-text.js');
copy('systems/global-writer.js');
copy('systems/network-links.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/network-view/network-view-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { NetworkViewMinigame, displayOrder, hostAction, resourceAction, shareLockable, REMOTE_OFF_TEXT, SHARE_LOCKED_TEXT, NOT_RESPONDING_TEXT, STALE_TEXT, linkOffText,
    downState, viewSubtitle, joinedStatus, DOWN_TAG, POWERED_DOWN_TAG, NO_ROUTE_TEXT, OWN_HEADING, MORE_BELOW_TEXT } =
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
    // As the real ones do, each starts its screen at once, replacing the view
    window.openRemoteSignIn = (row, footholdId) => { signIns.push([row.id, footholdId]); window.MinigameFramework.startMinigame('password', null, {}); };
    window.openRemoteDesktop = (pcId, footholdId) => { desktops.push([pcId, footholdId]); window.MinigameFramework.startMinigame('container', null, {}); };
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

// 9.3b plan 5.2: a host whose own service is off answers "not responding" in place of its control
test('hostAction: a host that is not responding wins over every other action', () => {
    assert.equal(hostAction({ responding: false }), 'not_responding');
    assert.equal(hostAction({ responding: false, remoteSignIn: false }), 'not_responding');
    assert.equal(hostAction({ responding: false, remoteSignIn: true, session: { via: 'password' } }), 'not_responding');
    assert.equal(hostAction({ responding: true, remoteSignIn: true }), 'sign-in', 'only false marks it');
});

test('a not-responding host row shows the text and no control, and its test state says so', async () => {
    const hosts = HOSTS.map(h => (h.id === 'lena_pc'
        ? { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false, responding: false }
        : h));
    setup({ hosts });
    links.open('jack_comms_port');
    await settle();
    const lena = row('data-host-id', 'lena_pc');
    assert.equal(lena.querySelector('[data-action]'), null, 'nothing to click');
    assert.match(lena.textContent, /\(powered down\)/);
    assert.doesNotMatch(lena.textContent, new RegExp(NOT_RESPONDING_TEXT), 'the tag alone says it (R1 n1)');
    const st = window.MinigameFramework.currentMinigame.getTestState();
    assert.equal(st.rows.find(r => r.id === 'lena_pc').action, 'not_responding');
});

test('a not-responding row names a session that is kept there (review R1 nit 6)', async () => {
    const hosts = HOSTS.map(h => (h.id === 'lena_pc'
        ? { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false,
            responding: false, heldAs: '<b>Lena</b>' }
        : h));
    setup({ hosts });
    links.open('jack_comms_port');
    await settle();
    const lena = row('data-host-id', 'lena_pc');
    assert.match(lena.textContent, /Session kept: <b>Lena<\/b>/, 'the name is shown as text');
    assert.equal(lena.querySelector('b'), null, 'and never as markup');
});

test('the view lists each row with its action and the row attributes, from GET /network only', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    assert.deepEqual(requests, [['network', 'jack_comms_port']]);
    const text = document.querySelector('.network-view-title').textContent;
    assert.equal(text, 'Drop box: comms room');
    // The subtitle names the network, so the own block is headed "Reachable" (code review R2 m1)
    assert.equal(document.querySelector('.network-block-own .network-block-title').textContent, OWN_HEADING);
    // The inventory line repeated the subtitle: no view shows it (code review R1 m1)
    assert.equal(document.querySelector('.network-view-observations'), null);
    assert.doesNotMatch(document.querySelector('.network-view').textContent, /Your Network drop box/);
    // Display order: computers by host name, then shares, then printers, under group headings
    assert.deepEqual([...document.querySelectorAll('[data-host-id], [data-resource-id]')].map(el => el.dataset.hostId || el.dataset.resourceId),
        ['sam_pc', 'door_box', 'lena_pc', 'kiosk_pc', 'ledger_archive', 'scanned_inbox', 'print_queue']);
    assert.deepEqual([...document.querySelectorAll('.network-row-group')].map(el => el.textContent),
        ['Computers', 'File shares', 'Printers and devices']);
    assert.match(row('data-resource-id', 'ledger_archive').querySelector('.network-row-locked').textContent, /Locked/);
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

// Slice 9.3b sub-slice K (5.1): the further-network blocks under the own-network rows.
const SERVER_ROW = { id: 'sv_fs02', kind: 'pc', name: 'Server host', host: 'SV-FS02', sprite: 'pc_desktop', headless: false, remoteSignIn: true };

function withBlocks(blocks) {
    setup();
    answer = { footholds: [{ ...foothold, hosts: HOSTS.map(h => ({ ...h })),
        networks: [{ id: 'office_lan', name: 'Harbour office LAN', via: null, route: 'up', hosts: HOSTS.map(h => ({ ...h })) }, ...blocks] }] };
}

test('a pivot-reached network renders an up block through its host, actionable and emitting its own network_viewed', async () => {
    withBlocks([{ id: 'server_net', name: 'Server network', via: { hostId: 'lena_pc', host: 'HB-FIN-02' }, route: 'up', hosts: [{ ...SERVER_ROW }] }]);
    links.open('jack_comms_port');
    await settle();
    const block = document.querySelector('.network-block-up');
    assert.ok(block, 'an up block is drawn');
    assert.match(block.querySelector('.network-block-title').textContent, /Server network, through HB-FIN-02/);
    assert.equal(row('data-host-id', 'sv_fs02').querySelector('[data-action]').dataset.action, 'sign-in');
    // The pivot network emits its own network_viewed, so a task on it completes
    assert.deepEqual(named('network_viewed:server_net'), [{ footholdId: 'jack_comms_port', networkId: 'server_net',
        hostIds: ['sv_fs02'], hostList: 'sv_fs02', via: 'lena_pc' }]);
    // Clicking the server host signs in through the same foothold
    row('data-host-id', 'sv_fs02').querySelector('[data-action]').click();
    assert.deepEqual(signIns, [['sv_fs02', 'jack_comms_port']]);
});

// Review R3 M1: an implant whose own PC is off is listed, says so, and offers nothing
test('a link whose PC is off says "This link is not responding" and offers no control', async () => {
    setup({ hosts: [] });
    answer.footholds[0].responding = false;
    answer.footholds[0].sourceHost = '<i>HB-FIN-02</i>';
    links.open('jack_comms_port');
    await settle();
    const text = document.querySelector('.network-view').textContent;
    assert.ok(text.includes(linkOffText('<i>HB-FIN-02</i>')), 'the line names the PC as text');
    assert.equal(document.querySelector('.network-view i'), null, 'never as markup');
    assert.doesNotMatch(text, /Nothing answers on this network/);
    assert.equal(document.querySelector('[data-action]'), null, 'nothing to click');
    assert.equal(view().getTestState().responding, false);
});

test('a down block is greyed with "No route" and offers no control', async () => {
    withBlocks([{ id: 'server_net', name: 'Server network', via: { hostId: 'lena_pc', host: 'HB-FIN-02' }, route: 'down', hosts: [{ ...SERVER_ROW }] }]);
    links.open('jack_comms_port');
    await settle();
    const block = document.querySelector('.network-block-down');
    assert.ok(block, 'a down block is drawn');
    assert.match(block.querySelector('.network-block-title').textContent, /Server network \(down\)/);
    assert.match(block.textContent, /SV-FS02 \(down\)/, 'the row carries the down tag');
    assert.match(block.querySelector('.network-row-off').textContent, /^No route$/);
    assert.equal(block.querySelector('[data-action]'), null, 'a down row has no control');
    assert.deepEqual(named('network_viewed:server_net'), [], 'a down block emits no network_viewed');
});

test('a down block draws each row as its own kind, under group headings (code review R1 n3)', async () => {
    const share = { id: 'sv_archive', kind: 'file_share', name: 'Archive share', host: 'SV-FS02' };
    withBlocks([{ id: 'server_net', name: 'Server network', via: { hostId: 'lena_pc', host: 'HB-FIN-02' }, route: 'down', hosts: [share, { ...SERVER_ROW }] }]);
    links.open('jack_comms_port');
    await settle();
    const block = document.querySelector('.network-block-down');
    const kinds = [...block.querySelectorAll('.network-row-down')].map(li => li.dataset.kind);
    assert.deepEqual(kinds, ['pc', 'file_share'], 'computers first, the share drawn as a share');
    assert.match(block.querySelector('[data-kind="file_share"] img').getAttribute('src'), /folder/);
    assert.equal(block.querySelectorAll('.network-row-group').length, 2, 'a heading for each group');
    assert.equal(block.querySelector('[data-action]'), null, 'still no control');
});

// Review R2 M1 (plan 5.2): the own network down, a session held there. The server sends no
// own rows and one down block for the own network holding only the held-session row; the view
// keeps that block, greyed, and does not also say nothing answers.
test('a session held on the own network shows greyed while the own network is down', async () => {
    setup({ hosts: [] });
    const lena = { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false };
    answer.footholds[0].networks = [{ id: 'office_lan', name: 'Harbour office LAN', via: null, route: 'down', hosts: [lena] }];
    links.open('jack_comms_port');
    await settle();
    const block = document.querySelector('.network-block-down');
    assert.ok(block, 'the own network down block is drawn');
    assert.match(block.querySelector('.network-block-title').textContent, /Harbour office LAN \(down\)/);
    assert.match(block.textContent, /HB-FIN-02 \(down\)/);
    assert.match(block.textContent, /No route/);
    assert.equal(document.querySelector('[data-action]'), null, 'nothing to click');
    assert.doesNotMatch(document.querySelector('.network-view').textContent, /Nothing answers on this network/);
    assert.deepEqual(view().getTestState().networks.map(b => [b.id, b.route]), [['office_lan', 'down']]);
});

test('with the own network up, its own block is not drawn twice', async () => {
    withBlocks([]);
    links.open('jack_comms_port');
    await settle();
    // UX access R2: the own rows sit in one own block with the network's heading, never a second
    assert.equal(document.querySelectorAll('.network-block').length, 1, 'the own up block is folded into the flat rows');
    assert.equal(document.querySelectorAll('.network-block-own').length, 1);
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
    assert.equal(view()._sceneType, 'password', 'the sign-in screen replaced the view at once');
    await settle();
    assert.equal(named('network_view_closed').length, 0, 'a handover never closes the trip');
    assert.ok(links.trip, 'the trip goes on');
});

test('Open on a held session opens its desktop through the foothold', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    const opener = view();
    row('data-host-id', 'lena_pc').querySelector('[data-action]').click();
    assert.deepEqual(desktops, [['lena_pc', 'jack_comms_port']]);
    assert.equal(opener.exitReason, 'handover');
    assert.equal(view()._sceneType, 'container', 'the desktop replaced the view at once');
});

test('a row whose screen does not start leaves the view open, and its Close then ends the trip (review R1 minor 1)', async () => {
    setup();
    window.openRemoteDesktop = (pcId, footholdId) => { desktops.push([pcId, footholdId]); };
    links.open('jack_comms_port');
    await settle();
    row('data-host-id', 'lena_pc').querySelector('[data-action]').click();
    assert.equal(view()._sceneType, 'network-view');
    assert.equal(view().exitReason, 'close');
    document.querySelector('#minigame-close').click();   // the X: no Cancel beside it (slice 7 R1)
    await settle();
    assert.deepEqual(named('network_view_closed'), [{ footholdId: 'jack_comms_port', reason: 'closed' }]);
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

// The server marks a share with no contents (missing or []) `listed`: it is looked at,
// never opened.
test('a share with no contents offers Look, shows its observations and opens nothing', async () => {
    const records = { id: 'records', kind: 'file_share', name: 'Client-Records', host: 'LW-FS01', open: true,
        listed: true, observations: 'Top folders: one per client.' };
    setup({ hosts: [...HOSTS, records] });
    links.open('jack_comms_port');
    await settle();
    const control = row('data-resource-id', 'records').querySelector('[data-action]');
    assert.equal(control.dataset.action, 'observe');
    assert.match(control.textContent, /Look/);
    assert.equal(view().getTestState().rows.find(r => r.id === 'records').action, 'observe');
    const before = started.length;
    control.click();
    await settle();
    assert.equal(document.querySelector('.network-view-notice').textContent, 'Top folders: one per client.');
    assert.equal(started.length, before, 'no container is started');
    assert.equal(view()._sceneType, 'network-view');
});

test('resourceAction: a share opens or is locked unless the server marks it listed; other kinds are looked at', () => {
    assert.equal(resourceAction({ kind: 'file_share', open: true }), 'open');
    assert.equal(resourceAction({ kind: 'file_share', open: false }), 'locked');
    assert.equal(resourceAction({ kind: 'file_share', open: false, listed: true }), 'observe');
    assert.equal(resourceAction({ kind: 'file_share', open: true, listed: true }), 'observe', 'listed with no observations');
    assert.equal(resourceAction({ kind: 'file_share', open: true, observations: 'x' }), 'open',
        'observations alone never turn a share into a Look row');
    assert.equal(resourceAction({ kind: 'printer', open: true }), 'observe');
});

test('the view\'s own Close ends the trip: network_view_closed once, reason closed', async () => {
    setup();
    let returned = null;
    links.open('jack_comms_port', { returnTo: (r) => { returned = r; } });
    await settle();
    document.querySelector('#minigame-close').click();   // the X: no Cancel beside it (slice 7 R1)
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

// Review R2 m3: a view fetched before the latest globals reached the server says so, and
// fetches once more when the late sync lands, if it is still open
test('a stale view shows the "may be out of date" line and refetches once when the sync lands', async () => {
    setup();
    let land;
    let syncs = 0;
    // A slow link: every sync takes longer than the limit
    window.stateSync = { sync: () => { syncs++; return new Promise(r => { land = r; }); } };
    links.viewSyncWaitMs = 10;
    links.open('jack_comms_port');
    await new Promise(r => setTimeout(r, 30));
    await settle();
    assert.equal(requests.filter(r => r[0] === 'network').length, 1);
    assert.ok(document.querySelector('.network-view-stale'), 'the line shows');
    assert.equal(document.querySelector('.network-view-stale').textContent, STALE_TEXT);

    land(true);
    await view().refetched;
    await settle();
    assert.equal(requests.filter(r => r[0] === 'network').length, 2, 'fetched once more');
    assert.equal(document.querySelector('.network-view-stale'), null, 'the fresh view drops the line');
    assert.equal(syncs, 1, 'the refetch sends no second sync: the globals have landed');
    delete links.viewSyncWaitMs;
    delete window.stateSync;
});

test('a stale view closed before the sync lands does not refetch', async () => {
    setup();
    let land;
    window.stateSync = { sync: () => new Promise(r => { land = r; }) };
    links.viewSyncWaitMs = 10;
    links.open('jack_comms_port');
    await new Promise(r => setTimeout(r, 30));
    await settle();
    const m = view();
    document.querySelector('#minigame-close').click();   // the X: no Cancel beside it (slice 7 R1)
    await settle();
    land(true);
    await m.refetched;
    await settle();
    assert.equal(requests.filter(r => r[0] === 'network').length, 1, 'no fetch for a closed view');
    delete links.viewSyncWaitMs;
    delete window.stateSync;
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

test('displayOrder: computers, shares, printers, other; each by name with numbers as numbers', () => {
    const rows = [
        { id: 'p', kind: 'printer', name: 'Queue' }, { id: 'x', kind: 'camera', name: 'Cam' },
        { id: 'b', kind: 'file_share', name: 'beta' }, { id: 'h10', kind: 'pc', host: 'HB-PC-10' },
        { id: 'a', kind: 'file_share', name: 'Alpha' }, { id: 'h2', kind: 'pc', host: 'HB-PC-2' }
    ];
    assert.deepEqual(displayOrder(rows).map(r => r.id), ['h2', 'h10', 'a', 'b', 'p', 'x']);
    assert.deepEqual(rows.map(r => r.id)[0], 'p', 'the input is not reordered');
    assert.deepEqual(displayOrder(null), []);
});



// ---- UX feedback round slice 1: down language, borders, headers, the joined Wi-Fi view ----

const cssText = readFileSync(join(here, '../../public/break_escape/css/network-view-minigame.css'), 'utf8');
// The body of the first rule whose selector list is exactly `sel`
const ruleBody = (sel) => {
    const re = new RegExp(`(^|})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm');
    return (cssText.match(re) || [])[2] ?? null;
};

test('downState: one tag and reason per state; remote sign-in off is not down', () => {
    assert.deepEqual(downState({ id: 'net', route: 'down' }), { down: true, tag: DOWN_TAG, reason: NO_ROUTE_TEXT, kept: null });
    assert.deepEqual(downState({ id: 'pc', kind: 'pc', heldAs: 'Ian Shaw' }, { inDownBlock: true }),
        { down: true, tag: '(down)', reason: 'No route', kept: 'Ian Shaw' });
    assert.deepEqual(downState({ id: 'pc', kind: 'pc', responding: false, heldAs: 'Lena Fox' }),
        { down: true, tag: POWERED_DOWN_TAG, reason: null, kept: 'Lena Fox' });
    assert.equal(POWERED_DOWN_TAG, '(powered down)');
    assert.deepEqual(downState({ id: 'pc', kind: 'pc', remoteSignIn: false }), { down: false, tag: null, reason: REMOTE_OFF_TEXT, kept: null });
    assert.equal(REMOTE_OFF_TEXT, 'Remote sign-in off');
    assert.deepEqual(downState({ id: 'implant_x', via: 'implant', responding: false, sourceHost: 'HB-X' }),
        { down: true, tag: '(down)', reason: linkOffText('HB-X'), kept: null });
    assert.equal(downState({ id: 'pc', kind: 'pc', remoteSignIn: true }).down, false);
    assert.equal(downState({ id: 'jack_x', via: 'jack' }).down, false);
    assert.equal(downState({ id: 'net', route: 'up', via: null }).down, false);
});

test('a powered-down row is tagged and greyed; a remote sign-in off row is readable, with no tag', async () => {
    const hosts = HOSTS.map(h => (h.id === 'lena_pc'
        ? { id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', sprite: 'pc_desktop', headless: false, responding: false, heldAs: 'Lena Fox' }
        : h));
    setup({ hosts });
    links.open('jack_comms_port');
    await settle();
    const lena = row('data-host-id', 'lena_pc');
    assert.ok(lena.classList.contains('network-row-down'));
    assert.equal(lena.querySelector('.network-row-tag').textContent, '(powered down)');
    assert.equal(lena.querySelector('.network-row-off'), null, 'no "Powered down" beside the tag (R1 n1)');
    assert.equal(lena.querySelector('.network-row-kept').textContent, 'Session kept: Lena Fox');
    const kiosk = row('data-host-id', 'kiosk_pc');
    assert.ok(!kiosk.classList.contains('network-row-down'), 'remote sign-in off stays readable');
    assert.equal(kiosk.querySelector('.network-row-tag'), null);
    assert.equal(kiosk.querySelector('.network-row-off').textContent, 'Remote sign-in off');
});

test('a down block row names the session kept there', async () => {
    withBlocks([{ id: 'server_net', name: 'Server network', via: { hostId: 'lena_pc', host: 'HB-FIN-02' }, route: 'down',
        hosts: [{ ...SERVER_ROW, heldAs: 'Ian Shaw' }] }]);
    links.open('jack_comms_port');
    await settle();
    assert.equal(document.querySelector('.network-block-down .network-row-kept').textContent, 'Session kept: Ian Shaw');
});

test('a link whose PC is off carries "(down)" on its title', async () => {
    setup({ hosts: [] });
    answer.footholds[0].responding = false;
    answer.footholds[0].sourceHost = 'HB-DESK-01';
    links.open('jack_comms_port');
    await settle();
    assert.match(document.querySelector('.network-view-title').textContent, /Drop box: comms room \(down\)/);
});

test('no reason or tag is in italics: no markup and no italic style', async () => {
    withBlocks([{ id: 'server_net', name: 'Server network', via: null, route: 'down', hosts: [{ ...SERVER_ROW }] }]);
    links.open('jack_comms_port');
    await settle();
    assert.equal(document.querySelector('.network-view i, .network-view em'), null);
    assert.doesNotMatch(cssText, /font-style:\s*italic|oblique/);
    assert.match(ruleBody('.network-view *') || '', /font-style:\s*normal/);
});

test('rows have no border, and the outer frame border is 2px', () => {
    const rowRule = ruleBody('.network-row');
    assert.ok(rowRule, 'the row rule exists');
    assert.doesNotMatch(rowRule, /border/, 'a row has no border');
    assert.match(rowRule, /background:/, 'a row has its own fill');
    assert.doesNotMatch(ruleBody('.network-row-down') || '', /border/);
    assert.match(ruleBody('.network-view-frame') || '', /border:\s*2px solid/);
    assert.doesNotMatch(ruleBody('.network-view-frame') || '', /min-height:\s*[1-9]/, 'the panel is as tall as its rows');
    assert.match(ruleBody('.network-view-rows') || '', /gap:\s*4px/);
    assert.match(ruleBody('.network-block') || '', /border:\s*2px solid/, 'the block keeps its 2px frame');
    assert.doesNotMatch(cssText.replace(/\/\*[\s\S]*?\*\//g, ''), /border[^;]*\b[134]px/, 'no border that is not 2px');
});

test('viewSubtitle adds what the title lacks, for every foothold kind', () => {
    const net = { id: 'office_lan', name: 'Harbour office LAN' };
    const kinds = [
        [{ via: 'jack', name: 'Drop box: Comms room', network: net, source: { name: 'Spare wall port', room: 'Comms room' } },
            'On Harbour office LAN, at Spare wall port'],
        [{ via: 'implant', name: 'Keystroke injector: Desks', network: net, source: { name: "Sam's PC", room: 'Desks' } },
            "On Harbour office LAN, at Sam's PC"],
        [{ via: 'implant', name: 'USB stick: Store', network: net, source: { name: 'Door controller', room: 'Store' } },
            'On Harbour office LAN, at Door controller'],
        [{ via: 'wifi', name: 'Wi-Fi: Guest Wi-Fi', network: { id: 'guest_wifi', name: 'Guest Wi-Fi' }, source: { name: 'Guest access point', room: 'Lobby' } },
            'Access point: Guest access point, Lobby']
    ];
    for (const [v, want] of kinds) {
        const sub = viewSubtitle(v);
        assert.equal(sub, want);
        assert.notEqual(sub, v.name, `${v.via}: the subtitle never repeats the title`);
    }
    assert.equal(viewSubtitle({ via: 'jack', name: 'On X', network: { name: 'X' } }), '', 'one equal to the title is dropped');
});

// Code review R3 m1: a name the server suffixed with its source says where already
test('title and subtitle never both name the source', () => {
    const net = { id: 'office_lan', name: 'Harbour office LAN' };
    const cases = [
        [{ via: 'jack', name: 'Drop box: Comms room, Spare wall port', network: net, source: { name: 'Spare wall port', room: 'Comms room' } },
            'On Harbour office LAN'],
        [{ via: 'implant', name: "Keystroke injector: Desks, Sam's PC", network: net, source: { name: "Sam's PC", room: 'Desks' } },
            'On Harbour office LAN'],
        [{ via: 'jack', name: 'Drop box: Workshop, Bench switch 2', network: net, source: { name: 'Bench switch', room: 'Workshop' } },
            'On Harbour office LAN'],
        [{ via: 'jack', name: 'Drop box: Comms room', network: net, source: { name: 'Spare wall port', room: 'Comms room' } },
            'On Harbour office LAN, at Spare wall port'],
        [{ via: 'jack', name: 'Drop box: Workshop, Bench switch extra', network: net, source: { name: 'Bench switch', room: 'Workshop' } },
            'On Harbour office LAN, at Bench switch']
    ];
    for (const [v, want] of cases) {
        const sub = viewSubtitle(v);
        assert.equal(sub, want, v.name);
        const inTitle = v.name.includes(`, ${v.source.name}`);
        const inSub = sub.includes(v.source.name);
        assert.ok(!(inTitle && inSub) || v.name.endsWith(' extra'), `${v.name}: the source is named once`);
    }
});

test('the header shows the subtitle under the title', async () => {
    setup();
    answer.footholds[0].source = { name: 'Spare wall port', room: 'Comms room' };
    links.open('jack_comms_port');
    await settle();
    assert.equal(document.querySelector('.network-view-subtitle').textContent, 'On Harbour office LAN, at Spare wall port');
    assert.equal(view().getTestState().subtitle, 'On Harbour office LAN, at Spare wall port');
    assert.equal(document.querySelector('.network-view-status'), null, 'a jack link has no joined line');
});

test('a joined Wi-Fi view: icon by the title, "Joined. Reaches <n> hosts." and not the stale line', async () => {
    const wifi = { id: 'wifi_guest_wifi', via: 'wifi', name: 'Wi-Fi: Guest Wi-Fi', itemId: 'netlink_wifi_guest_wifi',
        sourceId: 'guest_ap', network: { id: 'guest_wifi', name: 'Guest Wi-Fi' } };
    setup();
    links.load([wifi], ['guest_ap']);
    window.inventory.items = [{ scenarioData: { id: 'netlink_wifi_guest_wifi', type: 'network_link',
        observations: 'Your Wi-Fi link to Guest Wi-Fi. Open it to see what it reaches.' } }];
    answer = { footholds: [{ ...wifi, source: { name: 'Guest access point', room: 'Lobby' },
        hosts: [{ id: 'guest_notice', kind: 'file_share', name: 'Guest-Notice', host: 'HB-GUEST-01', open: true }] }] };
    links.open('wifi_guest_wifi');
    await settle();
    assert.ok(document.querySelector('.network-view-title .network-view-title-icon'), 'the Wi-Fi icon is by the title');
    assert.equal(document.querySelector('.network-view-status').textContent, 'Joined. Reaches 1 host.');
    assert.equal(document.querySelector('.network-view-observations'), null, 'the observations line is replaced');
    assert.doesNotMatch(document.querySelector('.network-view').textContent, /Open it to see what it reaches/);
    assert.equal(document.querySelector('.network-view-subtitle').textContent, 'Access point: Guest access point, Lobby');
    assert.deepEqual([...document.querySelectorAll('.network-row-group')].map(el => el.textContent), ['File shares'],
        'the same group headings as the jack view, even for one kind');
    // The title names the network, so the own block does not again (R1 n2)
    assert.equal(document.querySelector('.network-block-own .network-block-title').textContent, OWN_HEADING);
    assert.equal(OWN_HEADING, 'Reachable');
    // The load state and the status line are two fields (R1 m3)
    assert.equal(view().getTestState().status, 'ready');
    assert.equal(view().getTestState().statusLine, 'Joined. Reaches 1 host.');
    assert.equal(joinedStatus(3), 'Joined. Reaches 3 hosts.');
});


// ---- Code review R1 fixes ----

const headerLines = () => [...document.querySelectorAll('.network-view-header-body > *')].map(el => el.textContent.trim()).filter(Boolean);

test('no header line repeats another, for the jack and both implant views (R1 m1)', async () => {
    for (const [via, name, sourceName] of [['jack', 'Drop box: comms room', 'Spare wall port'],
        ['implant', 'Keystroke injector: Desks', "Sam's PC"], ['implant', 'USB stick: Store', 'Door controller']]) {
        setup();
        Object.assign(answer.footholds[0], { via, name, source: { name: sourceName, room: 'Desks' } });
        window.inventory.items[0].scenarioData.observations = `Your implant on HB-DESK-01. Open it to see what it reaches.`;
        links.open('jack_comms_port');
        await settle();
        const lines = headerLines();
        assert.equal(lines[0], name);
        assert.equal(new Set(lines).size, lines.length, `${name}: ${lines.join(' | ')}`);
        for (const a of lines) for (const b of lines) if (a !== b) assert.ok(!b.includes(a), `${name}: "${a}" is inside "${b}"`);
        // Nor does the heading under the header (code review R2 m1): it never names the network again
        const heading = document.querySelector('.network-block-title').textContent.trim();
        assert.equal(heading, OWN_HEADING);
        for (const line of lines) {
            assert.ok(!line.includes(heading) && !heading.includes(line), `${name}: heading "${heading}" repeats "${line}"`);
        }
        assert.ok(!heading.includes(officeNet.name), `${name}: the heading does not name the network`);
        assert.equal(document.querySelector('.network-view-observations'), null);
        assert.equal(view().getTestState().status, 'ready', 'the load state, not the status line (R1 m3)');
        assert.equal(view().getTestState().statusLine, '');
    }
});

test('the view closes with the X or Esc only: no Close button, the X inside the frame (R1 m4)', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    assert.equal(document.querySelector('#minigame-cancel'), null, 'no framework Close button');
    assert.equal(document.querySelector('.minigame-controls'), null);
    const frame = document.querySelector('.network-view-frame');
    assert.ok(frame, 'the frame exists');
    const x = document.querySelector('#minigame-close');
    // The X is in the header, and the header is outside the scroll area, so the list's
    // scrollbar never runs under the X (code review R2 m2)
    const header = document.querySelector('.network-view-header');
    assert.equal(x.parentNode, header, 'the X is in the header');
    assert.equal(header.parentNode, frame, 'the header is inside the frame');
    const list = view().gameContainer;
    assert.equal(list.parentNode, frame);
    assert.ok(!list.contains(header) && !list.contains(x), 'neither the header nor the X is in the scroll area');
    assert.deepEqual([...frame.children].map(el => el.className.split(' ')[0]),
        ['network-view-header', list.className.split(' ')[0], 'network-view-more'], 'header, list, More below');
    assert.ok(list.classList.contains('pixel-scroll'), 'the list scrolls with the pixel-art scrollbar');
    assert.ok(header.querySelector('.network-view-title'), 'the title is in the header');
    assert.ok(frame.contains(document.querySelector('.network-view')), 'the frame wraps the list');
    assert.doesNotMatch(ruleBody('.network-view-header') || '', /sticky|margin:\s*-/, 'no sticky header, no negative margin');
    const xRule = ruleBody('.network-view-minigame .network-view-frame .minigame-close-button') || '';
    assert.match(xRule, /position:\s*absolute/);
    assert.match(xRule, /top:\s*[2-9]px/, 'clear of the 2px border at the top');
    assert.match(xRule, /right:\s*[2-9]px/, 'and at the right');
    assert.match(ruleBody('.network-view-frame') || '', /position:\s*relative/, 'placed against the frame, at every size');
    assert.match(ruleBody('.network-view-frame') || '', /max-height:\s*calc\(100% - /, 'never taller than the screen');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    await settle();
    assert.deepEqual(named('network_view_closed'), [{ footholdId: 'jack_comms_port', reason: 'closed' }], 'Esc still closes');
});

test('"More below" shows while the list overflows the frame and hides at the end (R1 m2)', async () => {
    setup();
    links.open('jack_comms_port');
    await settle();
    const m = view();
    const game = m.gameContainer;
    const more = document.querySelector('.network-view-frame > .network-view-more');
    assert.ok(more, 'the cue is in the frame, outside the scrolling list');
    assert.equal(more.textContent.trim(), MORE_BELOW_TEXT);
    assert.ok(more.querySelector('.network-view-more-arrow'), 'with the stepped arrow');
    assert.equal(more.hidden, true, 'hidden when the list fits (jsdom lays out nothing)');
    let top = 0;
    Object.defineProperty(game, 'scrollHeight', { configurable: true, get: () => 900 });
    Object.defineProperty(game, 'clientHeight', { configurable: true, get: () => 400 });
    Object.defineProperty(game, 'scrollTop', { configurable: true, get: () => top, set: (v) => { top = v; } });
    game.dispatchEvent(new window.Event('scroll'));
    assert.equal(more.hidden, false, 'shown while more rows are below');
    assert.equal(m.getTestState().moreBelow, true);
    top = 250;
    game.dispatchEvent(new window.Event('scroll'));
    assert.equal(more.hidden, false, 'still shown part way down');
    top = 500;
    game.dispatchEvent(new window.Event('scroll'));
    assert.equal(more.hidden, true, 'hidden at the end');
    assert.equal(m.getTestState().moreBelow, false);
    // A re-render (a refetch) looks again
    top = 0;
    m.render();
    assert.equal(more.hidden, false);
});

test('rows lay out in two columns when there is room; headings and locked shares span (R1 m2)', async () => {
    assert.match(ruleBody('.network-view-rows') || '', /grid-template-columns:\s*repeat\(auto-fill, minmax\(\d+px, 1fr\)\)/);
    setup();
    links.open('jack_comms_port');
    await settle();
    assert.ok(row('data-resource-id', 'ledger_archive').classList.contains('network-row-wide'), 'a locked share and its note span');
    assert.ok(!row('data-resource-id', 'scanned_inbox').classList.contains('network-row-wide'));
    // A PC row's host label stays on one line too, and the button shrinks instead (code review R2 m3)
    assert.equal(row('data-host-id', 'lena_pc').querySelector('.network-row-title strong').className, 'network-row-hostname');
    assert.equal(row('data-host-id', 'lena_pc').querySelector('.network-row-title strong').textContent, 'HB-FIN-02');
    assert.match(ruleBody('.network-row-hostname') || '', /white-space:\s*nowrap/);
    assert.match(ruleBody('.network-row-host .network-row-label') || '', /min-width:\s*min-content/);
    assert.match(ruleBody('.network-row-control') || '', /flex:\s*0 1 auto/);
    // The open button breaks before the bracket, never inside the name (code review R3 n1)
    const open = row('data-host-id', 'lena_pc').querySelector('[data-action="open"]');
    assert.equal(open.textContent, 'Open (Lena Fox)');
    assert.equal(open.querySelector('.network-row-who').textContent, '(Lena Fox)');
    assert.match(ruleBody('.network-row-who') || '', /white-space:\s*nowrap/);
});

// Code review R3 m2: in a narrow column a down row keeps "Session kept: Ian Shaw" whole and
// its host and "(down)" on one line
test('a down row keeps the kept name and the host with its tag on one line', async () => {
    assert.match(ruleBody('.network-row-kept') || '', /white-space:\s*nowrap/);
    assert.match(ruleBody('.network-row-title') || '', /white-space:\s*nowrap/);
    // When the two do not fit side by side, the control drops under the label, never over it
    assert.match(ruleBody('.network-row-down') || '', /flex-wrap:\s*wrap/);
    assert.match(ruleBody('.network-row-down .network-row-control') || '', /margin-left:\s*auto/);
    withBlocks([{ id: 'server_net', name: 'Server network', via: { hostId: 'lena_pc', host: 'HB-FIN-02' }, route: 'down',
        hosts: [{ ...SERVER_ROW, heldAs: 'Ian Shaw' }] }]);
    links.open('jack_comms_port');
    await settle();
    const kept = document.querySelector('.network-block-down .network-row-kept');
    assert.equal(kept.textContent, 'Session kept: Ian Shaw', 'the whole note is one nowrap span');
    const title = kept.closest('.network-row').querySelector('.network-row-title');
    assert.ok(title.querySelector('.network-row-hostname'), 'the host sits in the nowrap title');
    assert.equal(title.querySelector('.network-row-tag').textContent, '(down)', 'and its tag beside it');
});

// The shared pixel-art scrollbar (code review R2 m2): square thumb, 2px border, no radius, and
// the Firefox properties behind a feature check, so Chrome keeps the ::-webkit-scrollbar art
test('the shared .pixel-scroll rule draws a pixel-art scrollbar', () => {
    const util = readFileSync(join(here, '../../public/break_escape/css/utilities.css'), 'utf8');
    const utilRule = (sel) => {
        const re = new RegExp(`(^|})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm');
        return (util.match(re) || [])[2] ?? null;
    };
    const thumb = utilRule('.pixel-scroll::-webkit-scrollbar-thumb') || '';
    assert.match(thumb, /border:\s*2px solid/);
    assert.match(thumb, /border-radius:\s*0;/);
    assert.match(utilRule('.pixel-scroll::-webkit-scrollbar-track') || '', /border-radius:\s*0;/);
    assert.match(utilRule('.pixel-scroll::-webkit-scrollbar-button') || '', /display:\s*none/);
    const ff = util.slice(util.indexOf('@supports not selector(::-webkit-scrollbar)'));
    assert.match(ff, /\.pixel-scroll\s*\{[^}]*scrollbar-color:[^}]*scrollbar-width:|\.pixel-scroll\s*\{[^}]*scrollbar-width:[^}]*scrollbar-color:/);
    const block = util.slice(util.indexOf('.pixel-scroll {'));
    assert.doesNotMatch(block, /border-radius:\s*[1-9]/, 'no radius');
    assert.doesNotMatch(block.replace(/\/\*[\s\S]*?\*\//g, ''), /gradient|box-shadow/);
    // The class resets the inherited Firefox properties, so Chrome keeps the art under a parent
    // that sets them (code review R3 n2); the guarded block after it still wins in Firefox
    const base = utilRule('.pixel-scroll') || '';
    assert.match(base, /scrollbar-color:\s*auto;/);
    assert.match(base, /scrollbar-width:\s*auto;/);
    assert.ok(util.indexOf('.pixel-scroll {') < util.indexOf('@supports not selector(::-webkit-scrollbar)'));
    // The game layout loads utilities.css
    const layout = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(layout, /css\/utilities\.css/);
});

test('the joined count leaves out a powered-down host (R1 n3)', async () => {
    const wifi = { id: 'wifi_guest_wifi', via: 'wifi', name: 'Wi-Fi: Guest Wi-Fi', itemId: 'netlink_wifi_guest_wifi',
        sourceId: 'guest_ap', network: { id: 'guest_wifi', name: 'Guest Wi-Fi' } };
    setup();
    links.load([wifi], ['guest_ap']);
    answer = { footholds: [{ ...wifi, hosts: [
        { id: 'guest_notice', kind: 'file_share', name: 'Guest-Notice', host: 'HB-GUEST-01', open: true },
        { id: 'guest_pc', kind: 'pc', name: 'Guest PC', host: 'HB-GUEST-02', remoteSignIn: true, responding: false }] }] };
    links.open('wifi_guest_wifi');
    await settle();
    assert.equal(document.querySelector('.network-view-status').textContent, 'Joined. Reaches 1 host.');
});
