// scripts/lock_key_diff.rb (V9, OFFICE_LIFE_MISSIONS_PLAN.md section 4): the lock and key diff
// for rule 2. Fixture scenarios with a hand-written dungeon graph JSON pin the fields V9 reads
// (nodes[].id/kind/optional, edges[].from/to/soft); one case runs generate_dungeon_graph.rb itself
// and checks its output still carries those fields, so a graph format change fails here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const tool = join(root, 'scripts/lock_key_diff.rb');
const env = { ...process.env, LANG: 'C.UTF-8' };

function scenario({ pin = '4821', vaultGate = false } = {}) {
    return {
        startRoom: 'office',
        objectives: [{ aimId: 'a', title: 'A', status: 'active', order: 0, tasks: [
            { taskId: 'reach_vault', title: 'Reach the vault', type: 'enter_room', targetRoom: 'vault', status: 'active' },
            { taskId: 'side', title: 'Side', type: 'enter_room', targetRoom: 'store', status: 'active', optional: true }
        ] }],
        rooms: {
            office: { type: 'room_office', connections: { north: 'vault', east: 'store' }, objects: [], npcs: [] },
            vault: { type: 'room_office', connections: { south: 'office' }, locked: true, lockType: 'pin', requires: pin,
                     objects: vaultGate ? [{ id: 'turnstile', type: 'pc', name: 'Turnstile', gate: { requireGlobal: 'ok' } }] : [], npcs: [] },
            store: { type: 'room_office', connections: { west: 'office' }, objects: [], npcs: [] }
        }
    };
}
function graph({ extraLock = false } = {}) {
    const nodes = [
        { id: 'office', label: 'Office', kind: 'room', optional: false },
        { id: 'vault', label: 'Vault', kind: 'room', optional: false },
        { id: 'store', label: 'Store', kind: 'room', optional: true },
        { id: 'door_vault', label: 'Vault PIN', kind: 'lock', optional: false }
    ];
    const edges = [{ from: 'office', to: 'door_vault', soft: false }, { from: 'door_vault', to: 'vault', soft: false }];
    if (extraLock) {
        nodes.push({ id: 'door_new', label: 'New door', kind: 'lock', optional: false });
        edges.push({ from: 'office', to: 'door_new', soft: false }, { from: 'door_new', to: 'vault', soft: false });
    }
    return { scenario: 'fixture', start_room: 'office', nodes, edges };
}

function fixture(fn) {
    const dir = mkdtempSync(join(tmpdir(), 'v9-'));
    try {
        mkdirSync(join(dir, 'v9_fixture'));
        const erb = join(dir, 'v9_fixture', 'scenario.json.erb');
        const gj = join(dir, 'v9_fixture', 'graph.json');
        const base = join(dir, 'baseline.json');
        const write = (s, g) => {
            writeFileSync(erb, JSON.stringify(s));
            writeFileSync(gj, JSON.stringify(g));
            const later = new Date(Date.now() + 2000);
            utimesSync(gj, later, later);
        };
        const run = (...args) => spawnSync('ruby', [tool, erb, ...args], { encoding: 'utf8', env });
        fn({ dir, erb, gj, base, write, run });
    } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('V9: a baseline of the same scenario diffs empty (stable hashes through ScenarioBinding)', { skip }, () => {
    fixture(({ gj, base, write, run }) => {
        write(scenario(), graph());
        assert.equal(run('--write', base, '--graph-json', gj).status, 0);
        const snap = JSON.parse(readFileSync(base, 'utf8'));
        assert.deepEqual(snap.graph.lockNodes, [{ id: 'door_vault', optional: false }]);
        assert.deepEqual(snap.graph.edges, [['door_vault', 'vault', false], ['office', 'door_vault', false]]);
        const r = run(base, '--graph-json', gj);
        assert.equal(r.status, 0, r.stdout + r.stderr);
        assert.match(r.stdout, /lock and key diff: empty/);
    });
});

test('V9: a changed requirement shows as a changed hash, never the secret', { skip }, () => {
    fixture(({ gj, base, write, run }) => {
        write(scenario(), graph());
        run('--write', base, '--graph-json', gj);
        write(scenario({ pin: '9999' }), graph());
        const r = run(base, '--graph-json', gj);
        assert.equal(r.status, 1, r.stdout + r.stderr);
        assert.match(r.stdout, /== locks: 1 removed, 1 added/);
        assert.doesNotMatch(r.stdout + readFileSync(base, 'utf8'), /9999|4821/);
    });
});

test('V9: a new lock whose far side holds a required task is flagged (exit 2)', { skip }, () => {
    fixture(({ gj, base, write, run }) => {
        write(scenario(), graph());
        run('--write', base, '--graph-json', gj);
        write(scenario(), graph({ extraLock: true }));
        const r = run(base, '--graph-json', gj, '--json');
        assert.equal(r.status, 2, r.stdout + r.stderr);
        const d = JSON.parse(r.stdout);
        assert.deepEqual(d.flagged, ["new lock 'door_new' guards room 'vault' (required task)"]);
    });
});

test('V9: a new gate in a room with a required task is flagged', { skip }, () => {
    fixture(({ gj, base, write, run }) => {
        write(scenario(), graph());
        run('--write', base, '--graph-json', gj);
        write(scenario({ vaultGate: true }), graph());
        const r = run(base, '--graph-json', gj);
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new gate at \/rooms\/vault\/objects\[turnstile\] guards room 'vault' \(required task\)/);
    });
});

test('V9: a graph JSON older than the scenario is refused', { skip }, () => {
    fixture(({ gj, base, write, run }) => {
        write(scenario(), graph());
        const old = new Date(Date.now() - 60000);
        utimesSync(gj, old, old);
        const r = run('--write', base, '--graph-json', gj);
        assert.equal(r.status, 64);
        assert.match(r.stderr, /is older than/);
    });
});

test('V9: run without --graph-json it generates the graph, whose JSON carries the pinned fields', { skip }, () => {
    fixture(({ dir, base, write, run }) => {
        write(scenario(), graph());
        const r = run('--write', base);
        assert.equal(r.status, 0, r.stdout + r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'v9_fixture', 'dungeon_graph.json'), 'utf8'));
        for (const n of g.nodes) for (const f of ['id', 'kind', 'optional']) assert.ok(f in n, `node field ${f}`);
        for (const e of g.edges) for (const f of ['from', 'to', 'soft']) assert.ok(f in e, `edge field ${f}`);
        assert.ok(g.nodes.some(n => n.kind === 'lock'), 'the fixture has a lock node');
        assert.equal(run(base).status, 0);
    });
});
