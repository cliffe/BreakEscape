// scripts/generate_dungeon_graph.rb, ops core S1 (OPS_CORE_PLAN.md 9.3): a discovery network's label gains
// "(sweep to list)", a `hosts` device is a `host_<id>` container with an `exposes` edge from its network,
// and discovery adds no lock or edge in front of a sign-in host. A scenario with none of these draws as before.
// Run with: node test/js/dungeon-graph-ops-hosts.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-ops-'));
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

function scenario({ discovery, hosts } = {}) {
    const sc = {
        scenario_brief: 'ops hosts fixture',
        startRoom: 'lobby',
        networks: { office_lan: { name: 'Office network', ...(discovery ? { discovery } : {}) } },
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'comms_room' },
                objects: [{ id: 'kit_dropbox', type: 'pc', name: 'Network drop box', takeable: true, rogueDevice: true }]
            },
            comms_room: {
                type: 'room_office', network: 'office_lan', connections: { south: 'lobby' },
                objects: [
                    { id: 'comms_port', type: 'pc', name: 'Spare wall port', networkJack: true },
                    { id: 'files01', type: 'pc', name: 'File server', host: 'FILES01', locked: true, lockType: 'login', headless: true, access: { roles: ['it'] } }
                ]
            }
        }
    };
    if (hosts) sc.hosts = hosts;
    return sc;
}

const DEVICES = { printer01: { name: 'Second floor printer', network: 'office_lan' } };

test('a discovery network is labelled "(sweep to list)"; an open one is not', { skip }, () => {
    assert.match(graph(scenario({ discovery: 'scan' })).nodes.net_office_lan.label, /\(sweep to list\)/);
    assert.doesNotMatch(graph(scenario()).nodes.net_office_lan.label, /sweep/);
    assert.doesNotMatch(graph(scenario({ discovery: 'open' })).nodes.net_office_lan.label, /sweep/);
});

test('a hosts device is a container node exposed by its network, and the sign-in host keeps its edge', { skip }, () => {
    const g = graph(scenario({ discovery: 'scan', hosts: DEVICES }));
    assert.equal(g.nodes.host_printer01.kind, 'container');
    assert.match(g.nodes.host_printer01.label, /Second floor printer/);
    assert.match(g.nodes.host_printer01.label, /device/);
    assert.ok(g.edges.some(e => e.from === 'net_office_lan' && e.to === 'host_printer01' && e.label === 'exposes'));
    assert.ok(g.edges.some(e => e.from === 'net_office_lan' && e.to === 'lock_files01' && e.label === 'exposes'),
        'discovery changes no edge in front of a sign-in host');
    assert.equal(g.edges.filter(e => e.to === 'host_printer01').length, 1, 'nothing else leads to a device');
    assert.equal(g.edges.filter(e => e.from === 'host_printer01').length, 0, 'nothing opens from a device');
});

test('a device alone makes a network worth drawing, and the same scenario without `hosts` draws no device node', { skip }, () => {
    const sc = scenario({ discovery: 'scan', hosts: DEVICES });
    sc.rooms.comms_room.objects = sc.rooms.comms_room.objects.filter(o => o.id !== 'files01');
    assert.ok(graph(sc).nodes.host_printer01);
    assert.equal(Object.keys(graph(scenario({ discovery: 'scan' })).nodes).some(id => id.startsWith('host_')), false);
});
