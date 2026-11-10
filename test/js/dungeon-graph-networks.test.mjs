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
