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

// N14 (S2, plan 9.3): weakness nodes. A decoy is not drawn.
function withFindings() {
    const sc = scenario({ discovery: 'scan', hosts: {
        printer01: {
            name: 'Second floor printer', network: 'office_lan',
            services: [{ name: 'admin_page', label: 'Admin page', port: 80, product: 'Inkwell WebPanel', version: '2.0',
                weaknesses: [
                    { id: 'factory_login', class: 'default_creds', severity: 'high', fixedIf: 'printer_reset_done' },
                    { id: 'open_share', class: 'misconfig', severity: 'low', grants: { credential: 'c1' } }
                ],
                decoys: [{ id: 'old_banner', class: 'unpatched', severity: 'medium', falseBecause: 'Cosmetic.' }] }]
        }
    } });
    const files = sc.rooms.comms_room.objects.find(o => o.id === 'files01');
    files.services = [{ name: 'smb', port: 445, product: 'Sharepoint', version: '1',
        weaknesses: [{ id: 'weak_pw', class: 'weak_auth', severity: 'medium', fixedIf: { a: true, b: false } }] }];
    return sc;
}

test('a weakness on a device hangs from host_<id>; its label has host, service, port, class, severity, fixed-if', { skip }, () => {
    const g = graph(withFindings());
    const n = g.nodes['weak_printer01_admin_page_factory_login'];
    assert.equal(n.kind, 'lock');
    for (const part of ['Second floor printer', 'Admin page', '80', 'default_creds', 'high', 'fixed if printer_reset_done', '(report only)'])
        assert.ok(n.label.includes(part), `${part} in ${n.label}`);
    assert.deepEqual(g.edges.filter(e => e.to === 'weak_printer01_admin_page_factory_login').map(e => e.from), ['host_printer01']);
    assert.doesNotMatch(g.nodes['weak_printer01_admin_page_open_share'].label, /report only|fixed if/);
});

test('a weakness on a sign-in host hangs from the network, labelled with the service, not from lock_<pcId>', { skip }, () => {
    const g = graph(withFindings());
    const id = 'weak_files01_smb_weak_pw';
    assert.match(g.nodes[id].label, /fixed if a=true &amp; b=false/);
    const into = g.edges.filter(e => e.to === id);
    assert.deepEqual(into.map(e => [e.from, e.label]), [['net_office_lan', 'smb']]);
    assert.equal(g.edges.some(e => e.from === id), false, 'no outgoing edge in S2');
});

test('decoys are not drawn, and a scenario without findings has no weakness node', { skip }, () => {
    const g = graph(withFindings());
    assert.equal(Object.keys(g.nodes).some(id => id.includes('old_banner')), false);
    assert.equal(Object.keys(graph(scenario({ discovery: 'scan', hosts: DEVICES })).nodes).some(id => id.startsWith('weak_')), false);
});

// Review R1 m9: a weakness's `needs` are edges into it (plan 9.3, Need row); m16: node ids never collide.
function withNeeds(needs, credProof = { held: 'panel_sheet' }) {
    const sc = withFindings();
    sc.rooms.comms_room.npcs = [{ id: 'lena', displayName: 'Lena', npcType: 'person', creds: { username: 'lfox', password: 'x1y2z3' } }];
    sc.rooms.comms_room.objects.push({ id: 'panel_sheet', type: 'notes', name: 'Panel sheet', takeable: true, text: 'Sheet.' });
    sc.credentials = { lena_login: { kind: 'password', account: 'lena', label: 'Lena login', foundIn: 'panel_sheet', proof: credProof } };
    sc.hosts.printer01.services[0].weaknesses[1].needs = needs;
    return sc;
}

test('needs.credential and needs.item draw an edge into the weakness from cred_<id> and the item node', { skip }, () => {
    const g = graph(withNeeds({ credential: 'lena_login', item: 'panel_sheet' }));
    const into = g.edges.filter(e => e.to === 'weak_printer01_admin_page_open_share').map(e => e.from).sort();
    assert.deepEqual(into, ['cred_src_panel_sheet', 'cred_lena_login', 'host_printer01'].sort());
    assert.equal(g.edges.filter(e => e.from === 'cred_lena_login' && e.to === 'weak_printer01_admin_page_open_share').length, 1);
});

test('needs of other kinds, an item with no node and an unknown credential draw no edge and no node', { skip }, () => {
    const plain = graph(withFindings());
    const g = graph(withNeeds({ itemType: 'notes', label: 'Some notes', global: 'door_open', credential: 'no_such_cred', item: 'lonely_item' }));
    const into = g.edges.filter(e => e.to === 'weak_printer01_admin_page_open_share').map(e => e.from);
    assert.deepEqual(into, ['host_printer01']);
    assert.equal(Object.keys(g.nodes).some(id => id.includes('lonely') || id.includes('door_open')), false);
    assert.ok(Object.keys(plain.nodes).length > 0);
});

test('a scenario without needs draws the weakness edges as before', { skip }, () => {
    const g = graph(withFindings());
    assert.deepEqual(g.edges.filter(e => e.to === 'weak_printer01_admin_page_factory_login').map(e => e.from), ['host_printer01']);
});

test('two finding ids that fold to one node id each get a node, and the second is warned about', { skip }, () => {
    const sc = scenario({ discovery: 'scan', hosts: {
        a_b: { name: 'Host one', network: 'office_lan', services: [{ name: 'c', port: 1, product: 'P', version: '1',
            weaknesses: [{ id: 'w', class: 'misconfig', severity: 'low' }] }] },
        a: { name: 'Host two', network: 'office_lan', services: [{ name: 'b_c', port: 2, product: 'P', version: '1',
            weaknesses: [{ id: 'w', class: 'misconfig', severity: 'high' }] }] }
    } });
    const dir = mkdtempSync(join(tmpdir(), 'graph-ops-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(sc));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
        const weak = g.nodes.filter(n => n.id.startsWith('weak_'));
        assert.equal(weak.length, 2, 'two nodes, none merged');
        assert.deepEqual(weak.map(n => /low|high/.exec(n.label)[0]).sort(), ['high', 'low']);
        assert.match(r.stderr, /finding ids collide/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

// N15 (S3, plan 9.3): technique cards, session needs, grants.
function withCards() {
    const sc = withFindings();
    sc.techniques = {
        factory_accounts: { name: 'Factory accounts', worksOn: { class: 'default_creds' } },
        smb_flaw: { name: 'Share flaw', worksOn: { class: 'weak_auth', product: 'Sharepoint', versions: ['1'] } },
        wrong_ver: { name: 'Wrong version', worksOn: { class: 'weak_auth', product: 'Sharepoint', versions: ['9'] } }
    };
    sc.rooms.lobby.objects.push({ id: 'card_factory', type: 'technique_card', name: 'Field note: factory accounts', technique_card: 'factory_accounts', takeable: true });
    sc.startItemsInInventory = [{ id: 'card_smb', type: 'technique_card', name: 'Share note', technique_card: 'smb_flaw' }];
    sc.rooms.comms_room.npcs = [{ id: 'lena', displayName: 'Lena', npcType: 'person', creds: { username: 'lfox', password: 'x1y2z3' } }];
    sc.credentials = { print_admin: { kind: 'saved_connection', account: 'lena', connectsTo: 'files01', proof: { technique_card: 'printer01.admin_page.open_share' } } };
    sc.hosts.printer01.services[0].weaknesses[1].grants = { credential: 'print_admin' };
    sc.rooms.comms_room.objects.find(o => o.id === 'files01').services[0].weaknesses[0].grants = { session: { account: 'lena', access: 'user' } };
    return sc;
}

test('a technique card is a key node with a source node per carrying item and an edge to each weakness it matches', { skip }, () => {
    const g = graph(withCards());
    assert.equal(g.nodes.tech_factory_accounts.kind, 'key');
    assert.match(g.nodes.tech_factory_accounts.label, /Factory accounts/);
    assert.equal(g.nodes.cred_src_card_factory.kind, 'item');
    assert.ok(g.edges.some(e => e.from === 'cred_src_card_factory' && e.to === 'tech_factory_accounts'));
    assert.ok(g.edges.some(e => e.from === 'cred_src_card_smb' && e.to === 'tech_smb_flaw'), 'a start item carries a card too');
    const out = id => g.edges.filter(e => e.from === id).map(e => e.to).sort();
    assert.deepEqual(out('tech_factory_accounts'), ['weak_printer01_admin_page_factory_login']);
    assert.deepEqual(out('tech_smb_flaw'), ['weak_files01_smb_weak_pw']);
    assert.deepEqual(out('tech_wrong_ver'), [], 'a version the service lacks matches nothing');
});

test('a session grant ends at the host lock and a credential grant at cred_<id>, each once', { skip }, () => {
    const g = graph(withCards());
    const sess = g.edges.filter(e => e.from === 'weak_files01_smb_weak_pw');
    assert.deepEqual(sess.map(e => [e.to, e.label]), [['lock_files01', 'grants session']]);
    const cred = g.edges.filter(e => e.from === 'weak_printer01_admin_page_open_share');
    assert.deepEqual(cred.map(e => e.to), ['cred_print_admin']);
    assert.equal(g.nodes.cred_print_admin.kind, 'key');
    assert.equal(Object.keys(g.nodes).some(id => id.startsWith('cred_src_') && id.includes('print')), false, 'a technique_card proof draws no source of its own');
    assert.equal(g.nodes.weak_printer01_admin_page_open_share.label.includes('report only'), false);
});

test('a session need is an edge from the same host sign-in lock; a device has none', { skip }, () => {
    const sc = withCards();
    sc.rooms.comms_room.objects.find(o => o.id === 'files01').services[0].weaknesses.push(
        { id: 'step_up', class: 'misconfig', severity: 'low', needs: { session: 'user' } });
    sc.hosts.printer01.services[0].weaknesses[0].needs = { session: 'user' };
    const g = graph(sc);
    assert.deepEqual(g.edges.filter(e => e.to === 'weak_files01_smb_step_up').map(e => e.from).sort(), ['lock_files01', 'net_office_lan']);
    assert.deepEqual(g.edges.filter(e => e.to === 'weak_printer01_admin_page_factory_login').map(e => e.from).sort(), ['host_printer01', 'tech_factory_accounts']);
});

test('an item need on a card item draws from its source node; the legend names the card, and plain graphs have no tech node', { skip }, () => {
    const sc = withCards();
    sc.hosts.printer01.services[0].weaknesses[0].needs = { item: 'card_factory' };
    const g = graph(sc);
    assert.ok(g.edges.some(e => e.from === 'cred_src_card_factory' && e.to === 'weak_printer01_admin_page_factory_login'));
    assert.equal(Object.keys(graph(withFindings()).nodes).some(id => id.startsWith('tech_')), false);
    assert.equal(Object.keys(graph(withNeeds({ item: 'panel_sheet' })).nodes).some(id => id.startsWith('tech_')), false);
});
