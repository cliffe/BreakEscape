// scripts/generate_dungeon_graph.rb, privilege plan S5a (section 9, dungeon graph): `admin@<pcId>` is
// drawn for each sign-in PC with an admin path: an edge from each creds.admin account the PC admits and
// from each weakness whose session grant has `access: "admin"`. A user grant, or a scenario with no admin
// path, draws no such node; no label holds a password.
// Run with: node test/js/dungeon-graph-admin.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-admin-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const text = readFileSync(join(dir, 'dungeon_graph.json'), 'utf8');
        const g = JSON.parse(text);
        const md = readFileSync(join(dir, 'dungeon_graph.md'), 'utf8');
        const html = readFileSync(join(dir, 'dungeon_graph.html'), 'utf8');
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, text, md, html };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const PASS = 'Kemi-Secret-Pass-7';

// Kemi (admin) may sign in at desk_pc but is refused by vault_pc's access list; Omar is an ordinary account.
function scenario({ admin = true } = {}) {
    return {
        scenario_brief: 'admin graph fixture',
        startRoom: 'office',
        networks: { office_lan: { name: 'Office network' } },
        rooms: {
            office: {
                type: 'room_office', network: 'office_lan', connections: {},
                objects: [
                    { id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, host: 'DESK01' },
                    { id: 'vault_pc', type: 'pc', name: 'Vault PC', lockType: 'login', locked: true, host: 'VAULT01', access: { people: ['omar'] } }
                ],
                npcs: [
                    { id: 'omar', npcType: 'person', creds: { username: 'omar.k', password: 'Omar-Pass-1' } },
                    { id: 'kemi', npcType: 'person', creds: { username: 'kemi.a', password: PASS, ...(admin ? { admin: true } : {}) } }
                ]
            }
        }
    };
}

function withGrant(sc, access) {
    sc.rooms.office.objects[0].services = [{ name: 'files', port: 445, weaknesses: [
        { id: 'old_release', class: 'unpatched', severity: 'high', summary: 'Behind its fixes.', grants: { session: { account: 'kemi', access } } }] }];
    return sc;
}

const adminIds = g => Object.keys(g.nodes).filter(id => id.startsWith('admin@'));

test('an admin account gets an admin@ node only at a PC that admits it', { skip }, () => {
    const g = graph(scenario());
    assert.deepEqual(adminIds(g), ['admin@desk_pc']);
    assert.ok(g.edges.some(e => e.from === 'signin_kemi' && e.to === 'admin@desk_pc'));
    assert.ok(!g.edges.some(e => e.from === 'signin_omar' && e.to.startsWith('admin@')), 'an ordinary account draws none');
});

test('an admin grant draws the admin edge and keeps the grants-session edge', { skip }, () => {
    const g = graph(withGrant(scenario({ admin: false }), 'admin'));
    assert.deepEqual(adminIds(g), ['admin@desk_pc']);
    const weak = g.edges.find(e => e.to === 'admin@desk_pc').from;
    assert.match(g.nodes[weak].label, /Desk PC|DESK01|files/i);
    assert.ok(g.edges.some(e => e.from === weak && e.to === 'lock_desk_pc' && e.label === 'grants session'));
});

test('a user grant draws no admin@ node', { skip }, () => {
    const g = graph(withGrant(scenario({ admin: false }), 'user'));
    assert.deepEqual(adminIds(g), []);
    assert.ok(g.edges.some(e => e.to === 'lock_desk_pc' && e.label === 'grants session'));
});

test('a scenario with no admin path draws no admin@ node', { skip }, () => {
    assert.deepEqual(adminIds(graph(scenario({ admin: false }))), []);
});

test('no label or output holds a password', { skip }, () => {
    const g = graph(withGrant(scenario(), 'admin'));
    assert.ok(adminIds(g).length > 0);
    assert.ok(!g.text.includes(PASS), 'the admin password is not in the graph');
    assert.ok(!g.text.includes('Omar-Pass-1'));
});

test('the Mermaid text (md and html) uses a safe id for admin@<pcId>: only [A-Za-z0-9_]', { skip }, () => {
    const g = graph(withGrant(scenario(), 'admin'));
    assert.ok(adminIds(g).length > 0, 'the JSON id keeps the @');
    for (const [name, text] of [['md', g.md], ['html', g.html]]) {
        assert.ok(text.includes('admin_at_desk_pc'), `${name} draws the safe id`);
        assert.ok(!text.includes('admin@'), `${name} has no admin@ id`);
    }
    const defs = [...g.md.matchAll(/^ {2}([^\s]+?)(?:\(|\[|\{|>")/gm)].map(m => m[1])
        .filter(id => !['classDef', 'class'].includes(id));
    assert.ok(defs.length > 5);
    defs.forEach(id => assert.match(id, /^[A-Za-z0-9_]+$/, `node id ${id}`));
});

test('a room called admin_at_<pc> does not merge with the admin node in the Mermaid text', { skip }, () => {
    const sc = scenario();
    sc.rooms.office.connections = { north: 'admin_at_desk_pc' };
    sc.rooms.admin_at_desk_pc = { type: 'room_office', network: 'office_lan', connections: { south: 'office' }, locked: true, lockType: 'key', requires: 'k1', objects: [] };
    sc.rooms.office.objects.push({ id: 'k1', type: 'key', name: 'Key', takeable: true, key_id: 'k1' });
    const g = graph(sc);
    assert.ok(adminIds(g).length > 0);
    for (const [name, text] of [['md', g.md], ['html', g.html]]) {
        const diagrams = text.split('flowchart TD').slice(1).map(d => [...d.matchAll(/^ {2}([A-Za-z0-9_]+)(?:\(|\[|\{|>")/gm)].map(m => m[1]));
        assert.ok(diagrams.some(ids => ids.includes('admin_at_desk_pc') && ids.includes('admin_at_desk_pc_')), `${name}: the room keeps its id and the admin node moves to a free one`);
        diagrams.forEach(ids => assert.equal(new Set(ids).size, ids.length, `${name}: every node id is defined once per diagram`));
    }
});
