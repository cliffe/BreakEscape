// scripts/generate_dungeon_graph.rb draws hash records (S7, offline cracking): an edge from the
// source (the file item) to the hash node, and "crack" edges from the hash node and each recipe
// fact's source to the account's password node, with the grade in the label. No password text.
// Run with: node test/js/dungeon-graph-crack.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PASSWORD = 'Pw-One-1';

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-crack-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const text = readFileSync(join(dir, 'dungeon_graph.json'), 'utf8');
        const g = JSON.parse(text);
        return { text, nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
const edge = (g, from, to, label) => g.edges.some(e => e.from === from && e.to === to && (label === undefined || e.label === label));

function scenario(crack, extra = {}) {
    return {
        scenario_brief: 'crack graph fixture',
        startRoom: 'office',
        social: { intelFacts: { pet: { label: 'Pet' }, town: { label: 'Town' } } },
        startItemsInInventory: [{ type: 'notes', id: 'diary', name: 'Diary', takeable: true, revealsFacts: ['pet'] }],
        credentials: {
            dana_hash: { kind: 'hash', account: 'dana', proof: { held: 'share_file' }, crack }
        },
        rooms: {
            office: {
                type: 'room_office', connections: {},
                objects: [{ id: 'share_file', type: 'notes', name: 'Share file', takeable: true, readable: true, text: 'Hash record' }],
                npcs: [{ id: 'dana', displayName: 'Dana', npcType: 'person', creds: { username: 'dana', password: PASSWORD },
                          feed: { posts: [{ id: 'p1', text: 'Hello', fact: 'se_intel_town' }] } }]
            }
        },
        ...extra
    };
}

test('a hash record is drawn with its source edge and a crack edge to the password node', () => {
    const g = graph(scenario({ password: 'guessable', facts: ['pet', 'town'] }));
    assert.ok(g.nodes.cred_dana_hash);
    assert.ok(edge(g, 'cred_src_share_file', 'cred_dana_hash'));
    assert.ok(g.nodes.crackpw_dana);
    assert.ok(edge(g, 'cred_dana_hash', 'crackpw_dana', 'crack'));
    assert.ok(edge(g, 'cred_src_diary', 'crackpw_dana', 'crack'));
    assert.ok(edge(g, 'crack_feed_dana_p1', 'crackpw_dana', 'crack'));
});

test('the grade is in the label, from the record or from the account habit', () => {
    let g = graph(scenario({ password: 'guessable', facts: ['pet', 'town'], difficulty: 'hard' }));
    assert.ok(edge(g, 'cred_dana_hash', 'crackpw_dana', 'crack (hard)'));
    assert.ok(edge(g, 'cred_src_diary', 'crackpw_dana', 'crack (hard)'));
    const s = scenario({ password: 'guessable', facts: ['pet'] });
    s.rooms.office.npcs[0].habits = { passwordDifficulty: 'medium' };
    g = graph(s);
    assert.ok(edge(g, 'cred_dana_hash', 'crackpw_dana', 'crack (medium)'));
});

test('a technique-granted hash has the weakness edge into the hash node', () => {
    const s = scenario({ password: 'common' });
    s.credentials.dana_hash.proof = { technique_card: 'print01.admin_page.factory_login' };
    s.networks = { office_lan: { name: 'Office LAN', discovery: 'scan' } };
    s.hosts = { print01: { name: 'Printer', network: 'office_lan', sprite: 'pnw_portable_printer1',
        services: [{ name: 'admin_page', port: 80, product: 'Inkwell WebPanel', version: '2.0',
            weaknesses: [{ id: 'factory_login', class: 'default_creds', severity: 'low', grants: { credential: 'dana_hash' } }] }] } };
    s.techniques = { factory_accounts: { name: 'Factory accounts', worksOn: { class: 'default_creds' } } };
    s.startItemsInInventory.push({ id: 'card_factory', type: 'technique_card', name: 'Field note', technique_card: 'factory_accounts', takeable: true });
    const g = graph(s);
    assert.ok(g.edges.some(e => e.to === 'cred_dana_hash' && e.from.startsWith('weak_')), 'weakness to hash edge');
    assert.ok(edge(g, 'cred_dana_hash', 'crackpw_dana', 'crack'));
});

test('no password text appears in the graph', () => {
    const g = graph(scenario({ password: 'guessable', facts: ['pet', 'town'], difficulty: 'medium' }));
    assert.ok(!g.text.includes(PASSWORD));
});

test('a scenario with no hash record draws no password node', () => {
    const s = scenario({ password: 'common' });
    delete s.credentials;
    const g = graph(s);
    assert.ok(!Object.keys(g.nodes).some(id => id.startsWith('crackpw_')));
});
