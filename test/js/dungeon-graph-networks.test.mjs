// scripts/generate_dungeon_graph.rb draws networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, section 7.3):
// the rogue device opens the jack, the jack reaches its network, the network exposes its hosts
// and resources; a headless host is reached only through the network and an admitted account;
// a protected share has an edge from each admitted account and none from the network alone.
// Run with: node --test test/js/dungeon-graph-networks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-networks-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
const edge = (g, from, to) => g.edges.some(e => e.from === from && e.to === to);
const into = (g, to) => g.edges.filter(e => e.to === to).map(e => e.from).sort();

function scenario() {
    return {
        scenario_brief: 'networks fixture',
        startRoom: 'lobby',
        networks: { office_lan: { name: 'Harbour office LAN' } },
        resources: {
            ledger_archive: { kind: 'file_share', name: 'Ledger-Archive', host: 'HB-FS01', network: 'office_lan',
                              access: { roles: ['finance'] }, contents: [] },
            scanned_inbox: { kind: 'file_share', name: 'Scanned-Inbox', host: 'HB-FS01', network: 'office_lan', contents: [] }
        },
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'comms_room', west: 'store' },
                objects: [{ id: 'kit_dropbox', type: 'pc', name: 'Network drop box', takeable: true, rogueDevice: true },
                          { id: 'hot_desk', type: 'pc', name: 'Hot desk', network: 'office_lan', locked: true, lockType: 'login' }],
                npcs: [
                    { id: 'lena', displayName: 'Lena Hart', role: 'finance', creds: { username: 'lhart', password: 'Biscuit2019' } },
                    { id: 'ian', displayName: 'Ian Cole', role: 'it', creds: { username: 'icole', password: 'Tulip!88' } }
                ]
            },
            comms_room: {
                type: 'room_office', network: 'office_lan', connections: { south: 'lobby' },
                objects: [{ id: 'comms_port', type: 'pc', name: 'Spare wall port', networkJack: true }]
            },
            store: {
                type: 'room_office', connections: { east: 'lobby' },
                objects: [{ id: 'door_box', type: 'pc', name: 'Door controller', network: 'office_lan',
                            locked: true, lockType: 'login', headless: true, access: { roles: ['it'] } }]
            }
        }
    };
}

test('the rogue device opens the jack, and the jack reaches its network', { skip }, () => {
    const g = graph(scenario());
    assert.equal(g.nodes.jack_comms_port?.kind, 'lock');
    assert.equal(g.nodes.device_kit_dropbox?.kind, 'key');
    assert.ok(edge(g, 'lobby', 'device_kit_dropbox'), 'the device is reached from its room');
    assert.ok(edge(g, 'device_kit_dropbox', 'jack_comms_port'));
    assert.ok(edge(g, 'comms_room', 'jack_comms_port'));
    assert.ok(edge(g, 'jack_comms_port', 'net_office_lan'));
    assert.match(g.nodes.net_office_lan.label, /Harbour office LAN/);
});

test('the network exposes each sign-in host and an open share', { skip }, () => {
    const g = graph(scenario());
    assert.ok(edge(g, 'net_office_lan', 'lock_hot_desk'));
    assert.ok(edge(g, 'net_office_lan', 'lock_door_box'));
    assert.ok(edge(g, 'net_office_lan', 'resource_scanned_inbox'));
    assert.ok(edge(g, 'lobby', 'lock_hot_desk'), 'a host with a keyboard keeps its room edge');
});

test('a headless host is reached only through the network and an admitted account', { skip }, () => {
    const g = graph(scenario());
    assert.deepEqual(into(g, 'lock_door_box'), ['net_office_lan', 'signin_ian']);
});

test('a protected share has an edge from each admitted account and none from the network alone', { skip }, () => {
    const g = graph(scenario());
    assert.deepEqual(into(g, 'resource_ledger_archive'), ['signin_lena']);
});

test('a scenario without networks gets no network nodes', { skip }, () => {
    const sc = scenario();
    delete sc.networks;
    const g = graph(sc);
    assert.ok(!Object.keys(g.nodes).some(id => /^(net_|jack_|device_|resource_)/.test(id)));
});

// Slice 9.3b (ACCESS_MODEL_SLICE_9_3B_PLAN.md, section 9.3): links, pivots, Wi-Fi access
// points, implants and outages, read through BreakEscape::NetworkModel.
const edgeOf = (g, from, to) => g.edges.find(e => e.from === from && e.to === to);

function linked() {
    const sc = scenario();
    sc.networks.server_net = { name: 'Server network' };
    sc.networkLinks = [['office_lan', 'server_net']];
    sc.rooms.store.objects.push({ id: 'file_server', type: 'pc', name: 'File server', network: 'server_net',
                                  locked: true, lockType: 'login', access: { roles: ['it'] } });
    return sc;
}

test('a link is one two-way edge between the network nodes', { skip }, () => {
    const g = graph(linked());
    const link = edgeOf(g, 'net_office_lan', 'net_server_net');
    assert.equal(link?.label, 'link');
    assert.equal(link.both, true);
    assert.ok(!edgeOf(g, 'net_server_net', 'net_office_lan'), 'drawn once, not once each way');
    assert.ok(g.edges.filter(e => e.label !== 'link').every(e => e.both === undefined), 'other edges carry no both key');
});

test('a link naming an undefined network draws nothing', { skip }, () => {
    const sc = linked();
    sc.networkLinks = [['office_lan', 'nowhere']];
    const g = graph(sc);
    assert.ok(!g.edges.some(e => e.label === 'link' || e.label === 'pivot'));
});

test('a sign-in host has a pivot edge to each network its links reach', { skip }, () => {
    const sc = linked();
    sc.networks.archive_net = { name: 'Archive network' };
    sc.networkLinks.push(['server_net', 'archive_net']);
    const g = graph(sc);
    assert.equal(edgeOf(g, 'lock_hot_desk', 'net_server_net')?.label, 'pivot');
    assert.equal(edgeOf(g, 'lock_hot_desk', 'net_archive_net')?.label, 'pivot', 'two links away is still bridged');
    assert.equal(edgeOf(g, 'lock_file_server', 'net_office_lan')?.label, 'pivot');
    assert.ok(!edgeOf(g, 'lock_hot_desk', 'net_office_lan'), 'no pivot to its own network');
});

test('without links there are no pivot edges', { skip }, () => {
    const sc = linked();
    delete sc.networkLinks;
    const g = graph(sc);
    assert.ok(!g.edges.some(e => e.label === 'pivot'));
});

function wifi() {
    const sc = scenario();
    sc.networks.guest_wifi = { name: 'Guest Wi-Fi', wifi: { ssid: 'Harbour-Guest', psk: 'seabreeze-2025' } };
    sc.rooms.lobby.objects.push(
        { id: 'guest_ap', type: 'pc', name: 'Guest access point', wifiAp: true, network: 'guest_wifi' },
        { id: 'wifi_card', type: 'notes1', name: 'Wi-Fi card', readable: true, text: 'Key: seabreeze-2025' });
    return sc;
}

test('a Wi-Fi access point is a lock the key opens, with an edge to its network', { skip }, () => {
    const g = graph(wifi());
    assert.equal(g.nodes.wifiap_guest_ap?.kind, 'lock');
    assert.match(g.nodes.wifiap_guest_ap.label, /Wi-Fi access point/);
    assert.equal(g.nodes.wifikey_guest_wifi?.kind, 'key');
    assert.match(g.nodes.wifikey_guest_wifi.label, /Harbour-Guest/);
    assert.ok(!g.nodes.wifikey_guest_wifi.label.includes('seabreeze'), 'the key itself is not printed');
    assert.ok(edge(g, 'lobby', 'wifiap_guest_ap'));
    assert.ok(edge(g, 'wifikey_guest_wifi', 'wifiap_guest_ap'));
    assert.ok(edge(g, 'wifiap_guest_ap', 'net_guest_wifi'));
    assert.ok(edge(g, 'lobby', 'clue_wifi_card') && edge(g, 'clue_wifi_card', 'wifikey_guest_wifi'),
        'the key is found on the card in the lobby');
});

test('an open Wi-Fi network needs no key', { skip }, () => {
    const sc = wifi();
    delete sc.networks.guest_wifi.wifi.psk;
    const g = graph(sc);
    assert.ok(edge(g, 'wifiap_guest_ap', 'net_guest_wifi'));
    assert.ok(!Object.keys(g.nodes).some(id => id.startsWith('wifikey_')));
});

test('an access point on a network with no wifi block is not drawn', { skip }, () => {
    const sc = wifi();
    delete sc.networks.guest_wifi.wifi;
    const g = graph(sc);
    assert.ok(!g.nodes.wifiap_guest_ap);
});

function implants() {
    const sc = scenario();
    sc.rooms.lobby.objects.push(
        { id: 'kit_badusb', type: 'pc', name: 'Keystroke injector', takeable: true },
        { id: 'kit_stick', type: 'pc', name: 'Spare USB stick', takeable: true },
        { id: 'desk_socket', type: 'pc', name: 'Desk USB socket', requiresItem: 'kit_badusb',
          triggerOnInteract: [{ type: 'grant_foothold', pc: 'hot_desk', needsSession: true, needsHeld: 'kit_badusb', name: 'BadUSB: hot desk' }] });
    sc.rooms.store.objects.push(
        { id: 'box_port', type: 'pc', name: 'Controller USB port',
          triggerOnInteract: [{ type: 'grant_foothold', pc: 'door_box', needsDropped: 'kit_stick', name: 'USB foothold: door box' }] });
    return sc;
}

test('an implant is a node the device opens, with an edge to the PC network', { skip }, () => {
    const g = graph(implants());
    assert.equal(g.nodes.implant_hot_desk?.kind, 'lock');
    assert.match(g.nodes.implant_hot_desk.label, /BadUSB: hot desk/);
    assert.equal(g.nodes.device_kit_badusb?.kind, 'key');
    assert.ok(edge(g, 'lobby', 'device_kit_badusb'));
    assert.equal(edgeOf(g, 'device_kit_badusb', 'implant_hot_desk')?.label, 'held');
    assert.equal(edgeOf(g, 'lock_hot_desk', 'implant_hot_desk')?.label, 'session at PC');
    assert.ok(edge(g, 'implant_hot_desk', 'net_office_lan'));
    assert.equal(edgeOf(g, 'device_kit_stick', 'implant_door_box')?.label, 'dropped');
    assert.ok(!edge(g, 'lock_door_box', 'implant_door_box'), 'the dropped shape needs no session');
    assert.ok(edge(g, 'implant_door_box', 'net_office_lan'));
});

test('an implant on a path the server does not run is not drawn', { skip }, () => {
    const sc = implants();
    const port = sc.rooms.store.objects.find(o => o.id === 'box_port');
    port.flagRewards = port.triggerOnInteract;
    delete port.triggerOnInteract;
    const g = graph(sc);
    assert.ok(!g.nodes.implant_door_box);
});

test('an outage is a condition on the network node, not a gate', { skip }, () => {
    const sc = linked();
    sc.networks.server_net.downIf = 'servers_offline';
    sc.globalVariables = { servers_offline: true };
    let g = graph(sc);
    assert.match(g.nodes.net_server_net.label, /down while servers_offline \(down at start\)/);
    assert.ok(!Object.keys(g.nodes).some(id => /servers_offline/.test(id)), 'no node for the outage');
    assert.ok(edge(g, 'net_office_lan', 'net_server_net'), 'the link is still drawn');
    sc.globalVariables.servers_offline = false;
    g = graph(sc);
    assert.match(g.nodes.net_server_net.label, /down while servers_offline$/);
    assert.doesNotMatch(g.nodes.net_office_lan.label, /down/);
});

test('a jack with port security has no edge to its network', { skip }, () => {
    const sc = scenario();
    sc.rooms.comms_room.objects[0].portSecurity = true;
    const g = graph(sc);
    assert.match(g.nodes.jack_comms_port.label, /port security/);
    assert.ok(edge(g, 'device_kit_dropbox', 'jack_comms_port'));
    assert.ok(!edge(g, 'jack_comms_port', 'net_office_lan'));
});

test('a clean scenario using every 9.3b field draws each feature once', { skip }, () => {
    const sc = linked();
    const w = wifi();
    const i = implants();
    sc.networks.server_net.downIf = 'servers_offline';
    sc.networks.guest_wifi = w.networks.guest_wifi;
    sc.globalVariables = { servers_offline: false };
    sc.rooms.lobby.objects.push(...w.rooms.lobby.objects.slice(2), ...i.rooms.lobby.objects.slice(2));
    sc.rooms.store.objects.push(i.rooms.store.objects.at(-1));
    sc.rooms.comms_room.objects.push({ id: 'locked_port', type: 'pc', name: 'Locked switch port', networkJack: true,
                                       portSecurity: true, portSecurityMessage: 'The switch shuts the port.' });
    const g = graph(sc);
    assert.equal(g.edges.filter(e => e.label === 'link').length, 1);
    assert.ok(g.edges.some(e => e.label === 'pivot'));
    for (const id of ['wifiap_guest_ap', 'wifikey_guest_wifi', 'implant_hot_desk', 'implant_door_box', 'jack_locked_port']) {
        assert.ok(g.nodes[id], `${id} drawn`);
    }
    assert.match(g.nodes.net_server_net.label, /down while servers_offline/);
    const keys = g.edges.map(e => `${e.from}|${e.to}`);
    assert.equal(new Set(keys).size, keys.length, 'no duplicate edges');
});
