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
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
        const raw = readFileSync(join(dir, 'dungeon_graph.json'), 'utf8');
        const g = JSON.parse(raw);
        const md = readFileSync(join(dir, 'dungeon_graph.md'), 'utf8');
        const html = readFileSync(join(dir, 'dungeon_graph.html'), 'utf8');
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, raw, md, html };
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
// points, implants and outages, read through BreakEscape::NetworkModel. The pivot follows the
// server's reach walk (NetworkAccess#reach_walk): one link per session host.
const edgeOf = (g, from, to) => g.edges.find(e => e.from === from && e.to === to);
const PSK = 'seabreeze-2025';

function linked() {
    const sc = scenario();
    sc.networks.server_net = { name: 'Server network' };
    sc.networkLinks = [['office_lan', 'server_net']];
    sc.rooms.store.objects.push({ id: 'file_server', type: 'pc', name: 'File server', network: 'server_net',
                                  locked: true, lockType: 'login', access: { roles: ['it'] } });
    return sc;
}

test('a link is one dashed, undirected line between the network nodes', { skip }, () => {
    const g = graph(linked());
    const link = edgeOf(g, 'net_office_lan', 'net_server_net');
    assert.equal(link?.label, 'link');
    assert.equal(link.undirected, true);
    assert.equal(link.soft, true, 'a link is structure, not a hard route');
    assert.ok(!edgeOf(g, 'net_server_net', 'net_office_lan'), 'drawn once');
    assert.ok(g.edges.filter(e => e.label !== 'link').every(e => e.undirected === undefined), 'no other edge has the key');
    assert.match(g.md, /net_office_lan -\.-\|link\| net_server_net/);
    assert.match(g.md, /Network edges: `-\.-` link/);
    assert.match(g.html, /edge-row"><code>-\.-<\/code> link/);
});

test('a link naming an undefined network draws nothing', { skip }, () => {
    const sc = linked();
    sc.networkLinks = [['office_lan', 'nowhere']];
    const g = graph(sc);
    assert.ok(g.nodes.net_office_lan, 'positive control: the network is still drawn');
    assert.ok(!g.edges.some(e => e.label === 'link' || e.label === 'pivot'));
    assert.doesNotMatch(g.md, /Network edges/);
});

test('a pivot is an AND gate: the host network reached and a session at the host', { skip }, () => {
    const g = graph(linked());
    assert.equal(g.nodes.pivot_hot_desk?.kind, 'gate');
    assert.deepEqual(into(g, 'pivot_hot_desk'), ['lock_hot_desk', 'net_office_lan']);
    assert.equal(edgeOf(g, 'pivot_hot_desk', 'net_server_net')?.label, 'pivot');
    assert.ok(!edgeOf(g, 'lock_hot_desk', 'net_server_net'), 'the sign-in lock alone does not reach it');
});

test('a pivot crosses one link; a further network needs a host on the next one', { skip }, () => {
    const sc = linked();
    sc.networks.archive_net = { name: 'Archive network' };
    sc.networkLinks.push(['server_net', 'archive_net']);
    let g = graph(sc);
    assert.ok(edgeOf(g, 'pivot_hot_desk', 'net_server_net'));
    assert.ok(!edgeOf(g, 'pivot_hot_desk', 'net_archive_net'), 'two links away is not one pivot');
    assert.equal(edgeOf(g, 'pivot_file_server', 'net_archive_net')?.label, 'pivot', 'the server-network host carries it on');
    sc.rooms.store.objects = sc.rooms.store.objects.filter(o => o.id !== 'file_server');
    g = graph(sc);
    assert.ok(!g.edges.some(e => e.to === 'net_archive_net' && e.label === 'pivot'), 'no host on server_net: no route');
});

test('without links, or without a foothold on the host network, there are no pivots', { skip }, () => {
    let sc = linked();
    delete sc.networkLinks;
    let g = graph(sc);
    assert.ok(g.nodes.lock_hot_desk, 'positive control');
    assert.ok(!g.edges.some(e => e.label === 'pivot'));
    sc = linked();
    sc.rooms.comms_room.objects = [];
    g = graph(sc);
    assert.ok(g.nodes.net_server_net || g.nodes.net_office_lan, 'positive control');
    assert.ok(!g.edges.some(e => e.label === 'pivot'), 'a walk-up session reaches no network');
});

test('a foothold on the far network pivots back across the link, as the server walks it', { skip }, () => {
    const sc = linked();
    sc.rooms.comms_room.objects[0].network = 'server_net';
    const g = graph(sc);
    assert.ok(edge(g, 'jack_comms_port', 'net_server_net'), 'positive control: the jack lands on server_net');
    assert.deepEqual(into(g, 'pivot_file_server'), ['lock_file_server', 'net_server_net']);
    assert.equal(edgeOf(g, 'pivot_file_server', 'net_office_lan')?.label, 'pivot', 'the reverse pivot');
});

test('a jack with no rogue device to plant seeds no pivot', { skip }, () => {
    const sc = linked();
    let g = graph(sc);
    assert.ok(edgeOf(g, 'pivot_hot_desk', 'net_server_net'), 'positive control');
    sc.rooms.lobby.objects = sc.rooms.lobby.objects.filter(o => o.id !== 'kit_dropbox');
    g = graph(sc);
    assert.ok(!g.edges.some(e => e.label === 'pivot'));
});

test('an access-listed share across a link is mapped from an admitted sign-in, with no pivot', { skip }, () => {
    const sc = linked();
    sc.rooms.store.objects = sc.rooms.store.objects.filter(o => o.id !== 'file_server');
    sc.rooms.comms_room.objects = [];
    sc.resources.vault = { kind: 'file_share', name: 'Vault', host: 'SV-FS02', network: 'server_net',
                           access: { roles: ['finance'] }, contents: [{ id: 'vault_doc', type: 'text_file', name: 'Doc', readable: true, text: 'x' }] };
    sc.resources.open_drop = { kind: 'file_share', name: 'Open drop', host: 'SV-FS02', network: 'server_net',
                               contents: [{ id: 'drop_doc', type: 'text_file', name: 'Drop', readable: true, text: 'y' }] };
    let g = graph(sc);
    assert.deepEqual(into(g, 'resource_vault'), ['signin_lena'], 'a walk-up sign-in on office_lan maps it');
    assert.deepEqual(into(g, 'resource_open_drop'), ['net_server_net'], 'an open share maps only on its own network');
    assert.ok(!g.edges.some(e => e.label === 'pivot'), 'no pivot is involved');
    assert.match(g.html, /crossed by a pivot, or by a signed-in desktop mapping an access-listed share/);
    delete sc.networkLinks;
    g = graph(sc);
    assert.ok(g.nodes.resource_vault, 'positive control');
    assert.deepEqual(into(g, 'resource_vault'), [], 'no link: no host admits Lena on the vault network');
});

function wifi() {
    const sc = scenario();
    sc.networks.guest_wifi = { name: 'Guest Wi-Fi', wifi: { ssid: 'Harbour-Guest', psk: PSK } };
    sc.rooms.lobby.objects.push(
        { id: 'guest_ap', type: 'pc', name: 'Guest access point', wifiAp: true, network: 'guest_wifi' },
        { id: 'wifi_card', type: 'notes1', name: 'Wi-Fi card', readable: true, text: `Key: ${PSK}` });
    return sc;
}

test('a Wi-Fi access point is a lock the key opens, with an edge to its network', { skip }, () => {
    const g = graph(wifi());
    assert.equal(g.nodes.wifiap_guest_ap?.kind, 'lock');
    assert.match(g.nodes.wifiap_guest_ap.label, /Wi-Fi access point/);
    assert.equal(g.nodes.wifikey_guest_wifi?.kind, 'key');
    assert.match(g.nodes.wifikey_guest_wifi.label, /Harbour-Guest/);
    assert.ok(edge(g, 'lobby', 'wifiap_guest_ap'));
    assert.ok(edge(g, 'wifikey_guest_wifi', 'wifiap_guest_ap'));
    assert.ok(edge(g, 'wifiap_guest_ap', 'net_guest_wifi'));
    assert.ok(edge(g, 'lobby', 'clue_wifi_card') && edge(g, 'clue_wifi_card', 'wifikey_guest_wifi'));
    for (const out of [g.raw, g.md, g.html]) assert.ok(!out.includes(PSK), 'the key is in no output');
});

test('the key never reaches an output through the SSID or a note name', { skip }, () => {
    const sc = wifi();
    sc.networks.guest_wifi.wifi.ssid = PSK;
    sc.rooms.lobby.objects.find(o => o.id === 'wifi_card').name = `Card: ${PSK}`;
    const g = graph(sc);
    assert.ok(g.nodes.wifikey_guest_wifi && g.nodes.clue_wifi_card, 'positive control');
    assert.match(g.nodes.wifikey_guest_wifi.label, /Guest Wi-Fi/, 'the network name stands in for the SSID');
    for (const out of [g.raw, g.md, g.html]) assert.ok(!out.includes(PSK), 'the key is in no output');
});

test('a key note in a locked safe hangs from the safe', { skip }, () => {
    const sc = wifi();
    const card = sc.rooms.lobby.objects.pop();
    sc.rooms.lobby.objects.push({ id: 'desk_safe', type: 'safe', name: 'Desk safe', locked: true, lockType: 'pin',
                                  requires: '1234', contents: [card] });
    const g = graph(sc);
    assert.ok(edge(g, 'lobby', 'lock_desk_safe'));
    assert.deepEqual(into(g, 'clue_wifi_card'), ['lock_desk_safe']);
    assert.ok(edge(g, 'clue_wifi_card', 'wifikey_guest_wifi'));
});

test('a key note an NPC holds hangs from the NPC, one in the start items from the start room', { skip }, () => {
    let sc = wifi();
    const card = sc.rooms.lobby.objects.pop();
    sc.rooms.comms_room.npcs = [{ id: 'kim', displayName: 'Kim Lo', itemsHeld: [card] }];
    let g = graph(sc);
    assert.deepEqual(into(g, 'clue_wifi_card'), ['npc_kim_lo']);
    assert.ok(edge(g, 'comms_room', 'npc_kim_lo'));
    sc = wifi();
    sc.startItemsInInventory = [sc.rooms.lobby.objects.pop()];
    g = graph(sc);
    assert.ok(g.edges.some(e => e.from === 'lobby' && e.to.startsWith('clue_')), 'from the start room');
    assert.ok(g.edges.some(e => e.from.startsWith('clue_') && e.to === 'wifikey_guest_wifi'));
});

test('a key note nested in an item an NPC holds hangs from that NPC', { skip }, () => {
    const sc = wifi();
    const card = sc.rooms.lobby.objects.pop();
    sc.rooms.comms_room.npcs = [{ id: 'kim', displayName: 'Kim Lo',
                                  itemsHeld: [{ id: 'kim_folder', type: 'notes1', name: 'Folder', contents: [card] }] }];
    const g = graph(sc);
    assert.deepEqual(into(g, 'clue_wifi_card'), ['npc_kim_lo']);
    assert.ok(edge(g, 'clue_wifi_card', 'wifikey_guest_wifi'));
});

test('a key kept in a file share hangs from the share', { skip }, () => {
    const sc = wifi();
    sc.rooms.lobby.objects.pop();
    sc.resources.scanned_inbox.contents = [{ id: 'inbox_note', type: 'text_file', name: 'Wi-Fi.txt', readable: true,
                                             text: `Guest key: ${PSK}` }];
    const g = graph(sc);
    assert.deepEqual(into(g, 'clue_inbox_note'), ['resource_scanned_inbox']);
    assert.ok(edge(g, 'clue_inbox_note', 'wifikey_guest_wifi'));
    assert.ok(!g.edges.some(e => e.to === 'wifikey_guest_wifi' && e.label === 'heard or read elsewhere'));
    for (const out of [g.raw, g.md, g.html]) assert.ok(!out.includes(PSK));
});

test('an access point inside a locked container hangs from its lock', { skip }, () => {
    const sc = wifi();
    const ap = sc.rooms.lobby.objects.find(o => o.id === 'guest_ap');
    sc.rooms.lobby.objects = sc.rooms.lobby.objects.filter(o => o !== ap);
    sc.rooms.lobby.objects.push({ id: 'ap_cabinet', type: 'safe', name: 'Cabinet', locked: true, lockType: 'pin',
                                  requires: '4321', contents: [ap] });
    const g = graph(sc);
    assert.ok(edge(g, 'lock_ap_cabinet', 'wifiap_guest_ap'));
    assert.ok(!edge(g, 'lobby', 'wifiap_guest_ap'));
});

test('the key is scrubbed from every output whatever name carries it', { skip }, () => {
    const holders = {
        'an NPC name': sc => { sc.rooms.lobby.npcs[0].displayName = `Lena ${PSK}`; },
        'a container name': sc => {
            sc.rooms.store.objects.push({ id: 'key_box', type: 'safe', name: `Box ${PSK}`, locked: true, lockType: 'pin',
                                          requires: '1111', contents: [{ id: 'pen', type: 'notes1', name: 'Pen' }] });
        },
        'an objective and a task title': sc => {
            sc.objectives = [{ aimId: 'aim_one', title: `Aim ${PSK}`, status: 'active', order: 0,
                               tasks: [{ taskId: 'task_one', title: `Task ${PSK}`, type: 'custom', status: 'active' }] }];
        }
    };
    for (const [what, put] of Object.entries(holders)) {
        const sc = wifi();
        put(sc);
        const g = graph(sc);
        assert.ok(g.nodes.wifikey_guest_wifi, `${what}: positive control`);
        assert.ok([g.raw, g.md, g.html].some(out => out.includes('WIFI_KEY_HIDDEN')), `${what}: the name was drawn, scrubbed`);
        for (const out of [g.raw, g.md, g.html]) assert.ok(!out.includes(PSK), `${what}: the key is in no output`);
    }
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
    assert.ok(g.nodes.jack_comms_port, 'positive control');
    assert.ok(!g.nodes.wifiap_guest_ap);
});

test('access points without an id get a node each', { skip }, () => {
    const sc = wifi();
    sc.rooms.lobby.objects.push({ type: 'pc', wifiAp: true, network: 'guest_wifi' }, { type: 'pc', wifiAp: true, network: 'guest_wifi' });
    const g = graph(sc);
    assert.equal(Object.keys(g.nodes).filter(id => id.startsWith('wifiap_')).length, 3);
    const keys = g.edges.map(e => `${e.from}|${e.to}`);
    assert.equal(new Set(keys).size, keys.length, 'no duplicate edges');
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

test('an implant is a node the device opens, from its host, with an edge to the PC network', { skip }, () => {
    const g = graph(implants());
    assert.equal(g.nodes.implant_hot_desk?.kind, 'lock');
    assert.match(g.nodes.implant_hot_desk.label, /BadUSB: hot desk/);
    assert.equal(g.nodes.device_kit_badusb?.kind, 'key');
    assert.ok(edge(g, 'lobby', 'device_kit_badusb'));
    assert.equal(edgeOf(g, 'device_kit_badusb', 'implant_hot_desk')?.label, 'held');
    assert.equal(edgeOf(g, 'lock_hot_desk', 'implant_hot_desk')?.label, 'session at PC');
    assert.equal(edgeOf(g, 'lobby', 'implant_hot_desk')?.label, 'at Desk USB socket');
    assert.ok(edge(g, 'implant_hot_desk', 'net_office_lan'));
    assert.equal(edgeOf(g, 'device_kit_stick', 'implant_door_box')?.label, 'dropped');
    assert.equal(edgeOf(g, 'store', 'implant_door_box')?.label, 'at Controller USB port');
    assert.ok(!edge(g, 'lock_door_box', 'implant_door_box'), 'the dropped shape needs no session');
    assert.ok(edge(g, 'implant_door_box', 'net_office_lan'));
});

test('an implant whose prop is in a locked room hangs from that room, behind its door', { skip }, () => {
    const sc = implants();
    sc.rooms.store.locked = true;
    sc.rooms.store.lockType = 'key';
    const g = graph(sc);
    assert.ok(edgeOf(g, 'store', 'implant_door_box'));
    assert.ok(into(g, 'store').length > 0, 'the room has its own way in');
});

test('an implant fired by a timer hangs from the start room, dashed and labelled', { skip }, () => {
    const sc = implants();
    const port = sc.rooms.store.objects.find(o => o.id === 'box_port');
    sc.timers = [{ id: 'staff_uses_stick', startOnGlobal: 'stick_left', actions: port.triggerOnInteract }];
    delete port.triggerOnInteract;
    const g = graph(sc);
    const e = edgeOf(g, 'lobby', 'implant_door_box');
    assert.equal(e?.label, 'timer: stick_left');
    assert.equal(e.soft, true);
});

test('an implant on a path the server does not run is not drawn', { skip }, () => {
    const sc = implants();
    const port = sc.rooms.store.objects.find(o => o.id === 'box_port');
    port.flagRewards = port.triggerOnInteract;
    delete port.triggerOnInteract;
    const g = graph(sc);
    assert.ok(g.nodes.implant_hot_desk, 'positive control');
    assert.ok(!g.nodes.implant_door_box);
});

test('a device named by type in the start items is found where the server finds it', { skip }, () => {
    const sc = implants();
    sc.rooms.lobby.objects = sc.rooms.lobby.objects.filter(o => o.id !== 'kit_badusb');
    sc.startItemsInInventory = [{ id: 'my_injector', type: 'keystroke_injector', name: 'Injector' }];
    sc.rooms.lobby.objects.find(o => o.id === 'desk_socket').triggerOnInteract[0].needsHeld = 'keystroke_injector';
    const g = graph(sc);
    assert.ok(edge(g, 'lobby', 'device_my_injector'));
    assert.equal(edgeOf(g, 'device_my_injector', 'implant_hot_desk')?.label, 'held');
    assert.ok(!g.nodes.device_keystroke_injector, 'no orphan node named by the type');
});

test('a PC with both implant shapes has one node, joined names and one network edge', { skip }, () => {
    const sc = implants();
    sc.rooms.lobby.objects.push({ id: 'desk_port2', type: 'pc', name: 'Rear port',
        triggerOnInteract: [{ type: 'grant_foothold', pc: 'hot_desk', needsDropped: 'kit_stick', name: 'Stick: hot desk' }] });
    const g = graph(sc);
    assert.match(g.nodes.implant_hot_desk.label, /BadUSB: hot desk \/ Stick: hot desk/);
    assert.equal(g.edges.filter(e => e.from === 'implant_hot_desk' && e.to === 'net_office_lan').length, 1);
});

test('a session implant on a headless PC is marked unusable and has no session edge', { skip }, () => {
    const sc = implants();
    sc.rooms.lobby.objects.find(o => o.id === 'desk_socket').triggerOnInteract[0].pc = 'door_box';
    sc.rooms.store.objects = sc.rooms.store.objects.filter(o => o.id !== 'box_port');
    const g = graph(sc);
    assert.match(g.nodes.implant_door_box?.label, /unusable: headless/);
    assert.ok(!edge(g, 'lock_door_box', 'implant_door_box'));
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

test('a jack with port security (any truthy value) has no edge to its network', { skip }, () => {
    const sc = scenario();
    sc.rooms.comms_room.objects[0].portSecurity = 1;
    const g = graph(sc);
    assert.match(g.nodes.jack_comms_port.label, /port security/);
    assert.ok(edge(g, 'device_kit_dropbox', 'jack_comms_port'), 'positive control');
    assert.ok(!edge(g, 'jack_comms_port', 'net_office_lan'));
});

test('malformed 9.3b fields draw nothing and do not crash the generator', { skip }, () => {
    const sc = scenario();
    sc.networks.bad_wifi = { name: { not: 'a string' }, wifi: 'open', downIf: 7 };
    sc.networks.odd = { name: 'Odd', wifi: { ssid: 42, psk: ['x'] } };
    sc.networkLinks = ['office_lan', ['office_lan'], ['office_lan', 'office_lan'], [1, 2], null, ['office_lan', 'bad_wifi', 'odd']];
    sc.globalVariables = 'nonsense';
    sc.rooms.lobby.objects.push(
        { type: 'pc', wifiAp: true, network: 'bad_wifi' },
        { id: 'junk', type: 'pc', triggerOnInteract: [
            { type: 'grant_foothold' }, { type: 'grant_foothold', pc: 42 }, { type: 'grant_foothold', pc: 'nowhere', needsDropped: 'x' },
            { type: 'grant_foothold', pc: 'hot_desk', needsHeld: { id: 1 }, needsSession: true }] });
    const g = graph(sc);
    assert.ok(g.nodes.jack_comms_port, 'positive control: the 9.3a drawing is intact');
    assert.ok(!g.edges.some(e => ['link', 'pivot'].includes(e.label)));
    assert.ok(!Object.keys(g.nodes).some(id => /^(wifiap_|wifikey_|device_(?!kit_dropbox)|pivot_)/.test(id)));
    assert.doesNotMatch(g.raw, /=>/, 'no Ruby hash printed into a label');
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
    for (const id of ['wifiap_guest_ap', 'wifikey_guest_wifi', 'implant_hot_desk', 'implant_door_box', 'jack_locked_port', 'pivot_hot_desk']) {
        assert.ok(g.nodes[id], `${id} drawn`);
    }
    assert.match(g.nodes.net_server_net.label, /down while servers_offline/);
    const keys = g.edges.map(e => `${e.from}|${e.to}`);
    assert.equal(new Set(keys).size, keys.length, 'no duplicate edges');
    for (const out of [g.raw, g.md, g.html]) assert.ok(!out.includes(PSK));
});

// Review R3: the key scrub acts on authored text and ids, never on the page around them.
function run(scenario, env = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-networks-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8', ...env } });
        const written = ['html', 'md', 'json'].filter(ext => existsSync(join(dir, `dungeon_graph.${ext}`)));
        return { status: r.status, stdout: r.stdout, stderr: r.stderr, written };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
const inlineScript = html => html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const pageShell = html => inlineScript(html).replace(/const diagrams = \{[\s\S]*?\n    \};/, '') +
    html.match(/<style>[\s\S]*?<\/style>/)[0];
function scriptParses(html) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-script-'));
    try {
        writeFileSync(join(dir, 'page.js'), inlineScript(html));
        return spawnSync(process.execPath, ['--check', join(dir, 'page.js')], { encoding: 'utf8' });
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
function keyed(psk) {
    const sc = wifi();
    sc.networks.guest_wifi.wifi.psk = psk;
    sc.rooms.lobby.objects.find(o => o.id === 'wifi_card').text = `Key: ${psk}`;
    sc.rooms.lobby.connections.south = 'office';
    sc.rooms.office = { type: 'room_office', door_sign: 'back office', connections: { north: 'lobby' },
                        objects: [{ id: 'office_memo', type: 'notes1', name: 'Memo', readable: true, text: 'nothing' }] };
    return sc;
}

test('a key that is also page text or an id leaves the page, its script and its other ids intact', { skip }, () => {
    const base = graph(keyed(PSK));
    for (const key of ['function', 'fullscreen', 'office']) {
        const g = graph(keyed(key));
        const re = new RegExp(key, 'i');
        assert.ok(g.nodes.wifikey_guest_wifi, `${key}: positive control`);
        const check = scriptParses(g.html);
        assert.equal(check.status, 0, `${key}: the inline script parses (${check.stderr})`);
        assert.equal(pageShell(g.html), pageShell(base.html), `${key}: script and style match the page for another key`);
        for (const id of Object.keys(base.nodes)) {
            if (re.test(id)) assert.ok(!g.nodes[id], `${key}: ${id} holds the key, so is hidden`);
            else assert.ok(g.nodes[id], `${key}: ${id} keeps its id`);
        }
        for (const id of Object.keys(g.nodes).filter(id => !base.nodes[id])) assert.match(id, /^hidden_\d+$/);
        assert.equal(Object.keys(g.nodes).length, Object.keys(base.nodes).length);
        for (const n of Object.values(g.nodes)) assert.doesNotMatch(n.label, re, `${key}: no label holds it`);
        for (const e of g.edges) assert.ok(![e.from, e.to, e.label ?? ''].some(s => re.test(s)), `${key}: no edge holds it`);
        assert.equal(JSON.parse(g.raw).start_room, 'lobby');
        const again = graph(keyed(key));
        assert.deepEqual([again.nodes, again.edges], [g.nodes, g.edges], `${key}: hidden ids are stable from run to run`);
    }
    const office = graph(keyed('office'));
    assert.ok(!office.md.includes('net_office_lan') && !/back office/i.test(office.md), 'the room and network named after it are hidden');
    assert.match(office.md, /\("back WIFI_KEY_HIDDEN"\)/, 'a label in any letter case is scrubbed, the rest kept');
});

test('a key with a quote, a short key, and a key in another letter case are hidden in every output', { skip }, () => {
    const cases = { 'sea"breeze1': ['sea"breeze1', "sea'breeze1"], abc: ['Lena abc'], SeaBreeze2025: [/seabreeze2025/i] };
    for (const [psk, forms] of Object.entries(cases)) {
        const sc = keyed(psk);
        sc.rooms.lobby.npcs[0].displayName = psk === 'SeaBreeze2025' ? 'Lena SEABREEZE2025' : `Lena ${psk}`;
        const g = graph(sc);
        assert.ok(g.nodes.wifikey_guest_wifi, `${psk}: positive control`);
        assert.ok(g.md.includes('Lena WIFI_KEY_HIDDEN') && g.html.includes('Lena WIFI_KEY_HIDDEN'), `${psk}: the name was drawn, scrubbed`);
        for (const out of [g.raw, g.md, g.html]) {
            for (const f of forms) assert.ok(typeof f === 'string' ? !out.includes(f) : !f.test(out), `${psk}: ${f} in no output`);
        }
    }
});

test('the subtitle cut never leaves part of a passphrase', { skip }, () => {
    const psk = 'sea breeze two zero two five';
    const sc = keyed(psk);
    sc.scenario_brief = `${'x'.repeat(140)} key: ${psk} and then more`;
    const g = graph(sc);
    const sub = g.html.match(/<p class="sub">([^<]*)<\/p>/)[1];
    assert.doesNotMatch(sub, /sea|breeze/, 'no word of the key before the cut');
    assert.match(g.md, /key: WIFI_KEY_HIDDEN and then more/, 'the full brief is scrubbed');
});

test('the critical path printed to the terminal is scrubbed', { skip }, () => {
    const sc = keyed(PSK);
    sc.objectives = [{ aimId: 'aim_one', title: `Aim ${PSK}`, status: 'active', order: 0,
                       tasks: [{ taskId: 'task_one', title: 'Task', type: 'custom', status: 'active' }] },
                     { aimId: 'aim_two', title: 'Aim two', status: 'locked', order: 1, unlockCondition: { aimsCompleted: ['aim_one'] },
                       tasks: [{ taskId: 'task_two', title: 'Task two', type: 'custom', status: 'active' }] }];
    const r = run(sc);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Critical path \(\d+ hops\): .*WIFI_KEY_HIDDEN/, 'positive control: the aim is printed');
    assert.ok(!r.stdout.includes(PSK) && !r.stderr.includes(PSK));
});

test('the final check stops the run, writing nothing, when a key gets past the scrub', { skip }, () => {
    const sc = keyed(PSK);
    sc.rooms.lobby.npcs[0].displayName = `Lena ${PSK}`;
    assert.equal(run(sc).status, 0, 'positive control');
    const r = run(sc, { DUNGEON_GRAPH_TEST_NO_SCRUB: '1' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /still holds a Wi-Fi key/);
    assert.ok(!r.stderr.includes(PSK) && !r.stdout.includes(PSK), 'the message never prints the key');
    assert.deepEqual(r.written, []);
});

test('a key note in a locked folder on a share or a desktop hangs behind the folder lock', { skip }, () => {
    const note = () => ({ id: 'key_note', type: 'text_file', name: 'Wi-Fi.txt', readable: true, text: `Guest key: ${PSK}` });
    const folder = id => ({ id, type: 'folder', name: 'Private', locked: true, lockType: 'pin', requires: '2468', contents: [note()] });
    let sc = wifi();
    sc.rooms.lobby.objects.pop();
    sc.resources.scanned_inbox.contents = [folder('share_folder')];
    let g = graph(sc);
    assert.ok(edge(g, 'net_office_lan', 'resource_scanned_inbox'), 'positive control');
    assert.deepEqual(into(g, 'lock_share_folder'), ['resource_scanned_inbox']);
    assert.deepEqual(into(g, 'clue_key_note'), ['lock_share_folder']);
    assert.ok(edge(g, 'clue_key_note', 'wifikey_guest_wifi'));
    sc = wifi();
    sc.rooms.lobby.objects.pop();
    sc.rooms.lobby.objects.find(o => o.id === 'hot_desk').contents = [folder('desk_folder')];
    g = graph(sc);
    assert.ok(edge(g, 'lock_hot_desk', 'lock_desk_folder'), 'the folder sits on the desktop');
    assert.deepEqual(into(g, 'clue_key_note'), ['lock_desk_folder']);
    assert.ok(edge(g, 'clue_key_note', 'wifikey_guest_wifi'));
    sc.rooms.lobby.objects.find(o => o.id === 'hot_desk').contents = [note()];
    g = graph(sc);
    assert.deepEqual(into(g, 'clue_key_note'), ['lock_hot_desk'], 'no folder: from the sign-in, as before');
});

test('a headless host opens no access-listed share without a foothold, on its network or across a link', { skip }, () => {
    const it = sc => {
        sc.rooms.lobby.objects.find(o => o.id === 'hot_desk').access = { roles: ['finance'] };
        return sc;
    };
    const share = { kind: 'file_share', name: 'IT share', host: 'HB-FS01', access: { roles: ['it'] },
                    contents: [{ id: 'it_doc', type: 'text_file', name: 'Doc', readable: true, text: 'x' }] };
    for (const where of ['office_lan', 'server_net']) {
        let sc = it(linked());
        sc.rooms.store.objects = sc.rooms.store.objects.filter(o => o.id !== 'file_server');
        sc.resources.it_share = { ...share, network: where };
        let g = graph(sc);
        assert.deepEqual(into(g, 'resource_it_share'), ['signin_ian'], `${where}: a foothold on office_lan, so a remote session`);
        sc.rooms.comms_room.objects = [];
        g = graph(sc);
        assert.ok(g.nodes.resource_it_share && g.nodes.signin_ian, `${where}: positive control`);
        assert.deepEqual(into(g, 'resource_it_share'), [], `${where}: no foothold, no session at the headless host`);
    }
});

test('an access point in an open box inside a locked safe hangs from the safe', { skip }, () => {
    const sc = wifi();
    const ap = sc.rooms.lobby.objects.find(o => o.id === 'guest_ap');
    sc.rooms.lobby.objects = sc.rooms.lobby.objects.filter(o => o !== ap);
    sc.rooms.lobby.objects.push({ id: 'ap_safe', type: 'safe', name: 'Safe', locked: true, lockType: 'pin', requires: '4321',
                                  contents: [{ id: 'ap_box', type: 'box', name: 'Box', contents: [ap] }] });
    const g = graph(sc);
    assert.ok(edge(g, 'lock_ap_safe', 'wifiap_guest_ap'));
    assert.ok(!edge(g, 'lobby', 'wifiap_guest_ap'));
});
