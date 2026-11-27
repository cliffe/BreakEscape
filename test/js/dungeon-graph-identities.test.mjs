// scripts/generate_dungeon_graph.rb draws access model identities (ACCESS_MODEL_PLAN.md,
// section 8 step 5): an NPC's card and an NPC's sign-in are key nodes with edges to the
// locks and sign-in PCs they open; a card several NPCs carry is one node naming every holder.
// Run with: node --test test/js/dungeon-graph-identities.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-identities-'));
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

// Jake (finance) and Dana (it) have accounts and cards; Imran and Gary share one card.
function scenario() {
    return {
        scenario_brief: 'identities fixture',
        startRoom: 'lobby',
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'finance_office', east: 'server_room' },
                objects: [
                    { id: 'jake_pc', type: 'pc', name: "Jake's PC", locked: true, lockType: 'login', access: { roles: ['finance'] } },
                    { id: 'hot_desk', type: 'pc', name: 'Hot desk', locked: true, lockType: 'login' }
                ],
                npcs: [
                    { id: 'jake', displayName: 'Jake Brooks', role: 'finance',
                      creds: { username: 'jbrooks', password: 'Biscuit2019', card: { name: "Jake's badge", card_id: 'JAKE-1' } } },
                    { id: 'dana', displayName: 'Dana Smith', role: 'it',
                      creds: { username: 'dsmith', password: 'Tulip!88', card: { name: "Dana's badge", card_id: 'DANA-1' } } },
                    { id: 'imran', displayName: 'Imran Siddiqui', role: 'facilities', rfidCard: { name: 'Power room card', card_id: 'PWR-1' } },
                    { id: 'gary', displayName: 'Gary Whitlock', role: 'security', rfidCard: { name: 'Power room card', card_id: 'PWR-1' } }
                ]
            },
            finance_office: {
                type: 'room_office', connections: { south: 'lobby' },
                locked: true, lockType: 'rfid', access: { roles: ['finance', 'it'] }
            },
            server_room: {
                type: 'room_office', connections: { west: 'lobby' },
                locked: true, lockType: 'rfid', access: { roles: ['security'] }
            }
        }
    };
}

test('a role-list door gets an edge from each admitted identity\'s card node', { skip }, () => {
    const g = graph(scenario());
    assert.equal(g.nodes.card_jake_1?.kind, 'key');
    assert.match(g.nodes.card_jake_1.label, /Jake's badge<br\/>\(Jake Brooks\)/);
    assert.ok(edge(g, 'card_jake_1', 'door_finance_office'));
    assert.ok(edge(g, 'card_dana_1', 'door_finance_office'));
    assert.ok(edge(g, 'lobby', 'card_jake_1'), 'the card is reached from its holder\'s room');
    assert.ok(!edge(g, 'card_jake_1', 'door_server_room'), 'finance is not admitted to the server room');
});

test('a shared card is one node with both holders in its label', { skip }, () => {
    const g = graph(scenario());
    const shared = Object.values(g.nodes).filter(n => n.id.startsWith('card_pwr'));
    assert.equal(shared.length, 1);
    assert.match(shared[0].label, /Imran Siddiqui, Gary Whitlock/);
    // Gary's security role admits the shared card to the server room
    assert.ok(edge(g, 'card_pwr_1', 'door_server_room'));
});

test('a sign-in PC gets an edge from each admitted account\'s sign-in node', { skip }, () => {
    const g = graph(scenario());
    assert.match(g.nodes.lock_jake_pc?.label || '', /Jake's PC<br\/>Sign-in/);
    assert.match(g.nodes.signin_jake?.label || '', /Jake Brooks sign-in<br\/>\(jbrooks\)/);
    assert.ok(edge(g, 'signin_jake', 'lock_jake_pc'));
    assert.ok(!edge(g, 'signin_dana', 'lock_jake_pc'), 'the access list admits finance only');
    // no access list: every account may sign in
    assert.ok(edge(g, 'signin_jake', 'lock_hot_desk'));
    assert.ok(edge(g, 'signin_dana', 'lock_hot_desk'));
    assert.ok(!Object.values(g.nodes).some(n => n.label.includes('Biscuit2019')), 'no password in any label');
});

test('a card matching requires opens the lock too', { skip }, () => {
    const sc = scenario();
    sc.rooms.server_room.requires = ['JAKE-1'];
    const g = graph(sc);
    assert.ok(edge(g, 'card_jake_1', 'door_server_room'));
});

test('a scenario without access model fields gets no identity nodes', { skip }, () => {
    const g = graph({
        scenario_brief: 'legacy', startRoom: 'hall',
        rooms: {
            hall: { type: 'room_office', connections: { north: 'vault' }, npcs: [{ id: 'g', displayName: 'Guard', rfidCard: { card_id: 'G1' } }] },
            vault: { type: 'room_office', connections: { south: 'hall' }, locked: true, lockType: 'rfid', requires: 'G1' }
        }
    });
    assert.ok(!Object.keys(g.nodes).some(id => id.startsWith('card_') || id.startsWith('signin_')));
});
