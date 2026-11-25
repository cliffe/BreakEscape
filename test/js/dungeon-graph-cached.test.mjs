// scripts/generate_dungeon_graph.rb draws cached accounts (S5b): an edge from `admin@<pcId>` to each cached
// account's hash record labelled "collect", and a second input from the account's borrow_session workaround
// for `after: "borrow"`, labelled "borrow". No password text in a label.
// Run with: node test/js/dungeon-graph-cached.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PASSWORDS = ['Alex-Pass-1', 'Priya-Pass-2', 'Sam-Pass-3', 'Kemi-Pass-4'];

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-cached-'));
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
const fixture = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/privilege_cached_clean.json'), 'utf8'));

test('each cached account gets a collect edge from the admin session node to its hash record', () => {
    const g = graph(fixture());
    assert.ok(g.nodes['admin@hot_desk']);
    assert.ok(g.nodes['admin@alex_pc']);
    assert.ok(edge(g, 'admin@hot_desk', 'cred_hot_priya', 'collect'));
    assert.ok(edge(g, 'admin@hot_desk', 'cred_hot_sam', 'collect'));
    assert.ok(edge(g, 'admin@alex_pc', 'cred_alex_alex', 'collect'));
    assert.ok(edge(g, 'admin@alex_pc', 'cred_alex_kemi', 'collect'));
});

test('an after-borrow account also has an edge from its borrow workaround', () => {
    const g = graph(fixture());
    assert.ok(edge(g, 'workaround_sam_0', 'cred_hot_sam', 'borrow'));
    assert.ok(!edge(g, 'workaround_sam_0', 'cred_hot_priya'));
    assert.equal(g.edges.filter(e => e.label === 'borrow').length, 1);
});

test('no label or node text carries a password', () => {
    const g = graph(fixture());
    for (const p of PASSWORDS) assert.ok(!g.text.includes(p), p);
});

test('an account with no hash record draws no collect edge, and no cachedAccounts draws none at all', () => {
    const s = fixture();
    delete s.credentials.hot_priya;
    const g = graph(s);
    assert.equal(g.edges.filter(e => e.label === 'collect' && e.from === 'admin@hot_desk').length, 1);
    delete s.rooms.office.objects[0].cachedAccounts;
    delete s.rooms.office.objects[1].cachedAccounts;
    const none = graph(s);
    assert.equal(none.edges.filter(e => e.label === 'collect' || e.label === 'borrow').length, 0);
});
