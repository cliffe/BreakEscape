// scripts/generate_dungeon_graph.rb, S8c unit 07: a lock with `secondStep` gets a second edge into its lock
// node from the owner's NPC node, labelled with the kind; dashed and labelled "never passes" when the step
// can never pass. No code, number, password or PIN appears in a label.
// Run with: node test/js/dungeon-graph-lock-step.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-lockstep-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const text = readFileSync(join(dir, 'dungeon_graph.json'), 'utf8');
        const g = JSON.parse(text);
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, text };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const SECRET = 'Safe-Secret-4471';

function scenario({ step, phone = true, habit, door = false, noStep = false } = {}) {
    const objects = [{ id: 'safe', type: 'safe', name: 'Wall safe', lockType: 'pin', requires: SECRET, locked: true,
        ...(noStep ? {} : { secondStep: step }) }];
    if (phone) objects.push({ id: 'kemi_phone', type: 'phone_friendface', name: 'Kemi phone', owner: 'kemi' });
    const kemi = { id: 'kemi', displayName: 'Kemi', npcType: 'person' };
    if (habit) kemi.habits = { approvesPrompts: habit };
    const rooms = {
        office: { type: 'room_office', connections: door ? { north: 'vault' } : {}, objects, npcs: [kemi] }
    };
    if (door) {
        rooms.vault = { type: 'room_office', locked: true, lockType: 'pin', requires: SECRET, connections: { south: 'office' },
            objects: [], ...(noStep ? {} : { secondStep: step }) };
    }
    return { scenario_brief: 'lock step graph fixture', startRoom: 'office', rooms };
}

const into = (g, node) => g.edges.filter(e => e.to === node && e.from === 'npc_kemi');

test('a gated object lock gets an edge from the owner, labelled with the kind', { skip }, () => {
    const g = graph(scenario({ step: { kind: 'push_number_match', owner: 'kemi' } }));
    const es = into(g, 'lock_safe');
    assert.equal(es.length, 1);
    assert.match(es[0].label, /push_number_match/);
    assert.equal(es[0].soft, false);
    assert.ok(g.nodes.npc_kemi);
});

test('a step that can never pass is dashed and labelled never passes', { skip }, () => {
    const g = graph(scenario({ step: { kind: 'push', owner: 'kemi' }, phone: false, habit: 'never' }));
    const es = into(g, 'lock_safe');
    assert.equal(es.length, 1);
    assert.equal(es[0].label, 'never passes');
    assert.equal(es[0].soft, true);
});

test('a door lock is gated the same way', { skip }, () => {
    const g = graph(scenario({ step: { kind: 'push_number_match', owner: 'kemi' }, door: true }));
    assert.equal(into(g, 'door_vault').length, 1);
});

test('no code, number, password or PIN in the graph text', { skip }, () => {
    const g = graph(scenario({ step: { kind: 'code', owner: 'kemi' } }));
    assert.ok(!g.text.includes(SECRET));
    assert.ok(!g.edges.some(e => /\d{4,}/.test(e.label || '')));
});

test('a lock with no owner draws no step edge, and no field draws as before', { skip }, () => {
    const g = graph(scenario({ step: { kind: 'push' } , phone: false }));
    assert.equal(g.edges.filter(e => /second step|never passes/.test(e.label || '')).length, 0);
    const plain = graph(scenario({ noStep: true }));
    assert.equal(plain.edges.filter(e => /second step|never passes/.test(e.label || '')).length, 0);
    assert.ok(!plain.nodes.npc_kemi);
});
