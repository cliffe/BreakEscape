// scripts/generate_dungeon_graph.rb draws NPC habits (ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.3): a
// "sticky note" edge from the room of a writesDown owner's sign-in PC to the account, an
// "unlocked screen" edge from a never or sometimes owner's PC room to the PC where the server
// would allow a claim, "same password" and "shared with" edges for a reused password, and
// "clue" edges for a backed guessable one.
// Run with: node test/js/dungeon-graph-habits.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-habits-'));
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
const labelled = (g, label) => g.edges.filter(e => (e.label || '').startsWith(label));
const edge = (g, from, to, label) => g.edges.some(e => e.from === from && e.to === to && (label === undefined || e.label === label));

const needs = { coffee: { decayPerMin: 30, urgentAt: 40 } };
const person = (id, extra = {}) => ({ id, displayName: id, npcType: 'person', needs, creds: { username: id, password: `${id}-Pw-9` }, ...extra });
const loginPc = (id, extra = {}) => ({ id, type: 'pc', name: id, locked: true, lockType: 'login', ...extra });
function scenario(rooms, extra = {}) {
    return { scenario_brief: 'habits graph fixture', startRoom: Object.keys(rooms)[0], rooms, ...extra };
}
const room = (objects, npcs, extra = {}) => ({ type: 'room_office', connections: {}, objects, npcs, ...extra });

test('writesDown: a sticky note edge from the PC room to the account, none from the PC itself', () => {
    const g = graph(scenario({ office: room([loginPc('omar_pc')], [person('omar', { needsHome: 'omar_pc', habits: { writesDown: true } })]) }));
    assert.ok(edge(g, 'office', 'signin_omar', 'sticky note at omar_pc'), JSON.stringify(g.edges));
    assert.ok(!g.edges.some(e => e.from === 'lock_omar_pc' && e.to === 'signin_omar'));
});

test('locksScreen: unlocked screen at never, (roll) at sometimes, none where the screen always locks or no claim', () => {
    const g = graph(scenario({
        office: room([
            loginPc('dana_pc'), loginPc('lena_pc'), loginPc('ian_pc'), loginPc('kai_pc', { policy: 'instant' }),
            loginPc('priya_pc', { locksScreenOnLeave: true }), loginPc('tom_pc')
        ], [
            person('dana', { needsHome: 'dana_pc', awareness: 'low' }),
            person('lena', { needsHome: 'lena_pc', awareness: 'medium' }),
            person('ian', { needsHome: 'ian_pc', awareness: 'high' }),
            person('kai', { needsHome: 'kai_pc', awareness: 'low' }),
            person('priya', { needsHome: 'priya_pc', awareness: 'low' }),
            { ...person('tom', { needsHome: 'tom_pc', awareness: 'low' }), needs: undefined }
        ])
    }, { policies: { instant: { autoLockMin: 0 } } }));
    assert.ok(edge(g, 'office', 'lock_dana_pc', 'unlocked screen'), JSON.stringify(labelled(g, 'unlocked')));
    assert.ok(edge(g, 'office', 'lock_lena_pc', 'unlocked screen (roll)'));
    for (const pc of ['ian_pc', 'kai_pc', 'priya_pc', 'tom_pc']) {
        assert.ok(!labelled(g, 'unlocked screen').some(e => e.to === `lock_${pc}`), pc);
    }
});

test('reused: same password from a lock, shared with from another account', () => {
    const tom = person('tom', { needsHome: 'tom_pc', habits: { password: 'reused' } });
    tom.creds.password = 'Locker-Pw-1';
    const sam = person('sam');
    sam.creds.password = 'Locker-Pw-1';
    const g = graph(scenario({ office: room([loginPc('tom_pc'),
        { id: 'tom_locker', type: 'safe', name: 'Locker', locked: true, lockType: 'password', requires: 'Locker-Pw-1' }], [tom, sam]) }));
    assert.ok(edge(g, 'lock_tom_locker', 'signin_tom', 'same password'), JSON.stringify(g.edges));
    assert.ok(edge(g, 'signin_sam', 'signin_tom', 'shared with sam'));
});

test('guessable: clue edges from each source and the pattern clue when backed, none when not', () => {
    const mei = (photoText) => {
        const npc = person('mei', { needsHome: 'mei_pc', habits: { password: 'guessable', passwordPattern: 'memo' } });
        npc.creds.password = 'Rex2019!';
        return graph(scenario({ office: room([loginPc('mei_pc'),
            { id: 'photo', type: 'notes', name: 'Photo', text: photoText },
            { id: 'calendar', type: 'notes', name: 'Calendar', text: 'May 2019' },
            { id: 'memo', type: 'notes', name: 'Memo', text: 'Pet name with a capital, then the year, end with !' }], [npc]) }));
    };
    let g = mei('Rex on the beach');
    for (const id of ['photo', 'calendar', 'memo']) assert.ok(edge(g, `clue_${id}`, 'signin_mei', 'clue'), id);
    assert.ok(edge(g, 'office', 'clue_photo'));
    g = mei('A dog on the beach');
    assert.equal(labelled(g, 'clue').length, 0);
});

test('a scenario with no habits draws none of these edges', () => {
    const g = graph(scenario({ office: room([loginPc('dana_pc')], [person('dana', { needsHome: 'dana_pc' })]) }));
    for (const label of ['sticky note', 'unlocked screen', 'same password', 'shared with', 'clue']) {
        assert.equal(labelled(g, label).length, 0, label);
    }
});

test('guessable: a clue behind a container lock the walk did not draw hangs from that lock, added from the room', () => {
    const npc = person('mei', { needsHome: 'mei_pc', habits: { password: 'guessable', passwordPattern: 'memo' } });
    npc.creds.password = 'Rex2019!';
    const keeper = { id: 'rowan', displayName: 'Rowan', npcType: 'person',
        itemsHeld: [{ id: 'tin', type: 'safe', name: 'Biscuit tin', locked: true, lockType: 'key', requires: 'tin_key',
            contents: [{ id: 'photo', type: 'notes', name: 'Photo', text: 'Rex on the beach' }] }] };
    const g = graph(scenario({ office: room([loginPc('mei_pc'),
        { id: 'calendar', type: 'notes', name: 'Calendar', text: 'May 2019' },
        { id: 'memo', type: 'notes', name: 'Memo', text: 'Pet name with a capital, then the year, end with !' }], [npc, keeper]) }));
    assert.ok(g.nodes.lock_tin, JSON.stringify(Object.keys(g.nodes)));
    assert.ok(edge(g, 'office', 'lock_tin'), JSON.stringify(g.edges));
    assert.ok(edge(g, 'lock_tin', 'clue_photo'));
    assert.ok(edge(g, 'clue_photo', 'signin_mei', 'clue'));
});
