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

function scenario({ pin = '4821', vaultGate = false, vaultObjs = [], storeObjs = [], storeNpcs = [], lobbyDoors = [], tasks = [] } = {}) {
    return {
        startRoom: 'office',
        objectives: [{ aimId: 'a', title: 'A', status: 'active', order: 0, tasks: [
            { taskId: 'reach_vault', title: 'Reach the vault', type: 'enter_room', targetRoom: 'vault', status: 'active' },
            { taskId: 'side', title: 'Side', type: 'enter_room', targetRoom: 'store', status: 'active', optional: true },
            ...tasks
        ] }],
        rooms: {
            office: { type: 'room_office', connections: { north: 'vault', east: 'store' }, objects: [], npcs: [] },
            vault: { type: 'room_office', connections: { south: 'office' }, locked: true, lockType: 'pin', requires: pin,
                     objects: [...(vaultGate ? [{ id: 'turnstile', type: 'pc', name: 'Turnstile', gate: { requireGlobal: 'ok' } }] : []), ...vaultObjs], npcs: [] },
            store: { type: 'room_office', connections: { west: 'office' }, objects: storeObjs, npcs: storeNpcs },
            lobby: { type: 'room_office', connections: {}, doors: lobbyDoors, objects: [], npcs: [] }
        }
    };
}
function graph({ extraLock = false } = {}) {
    const nodes = [
        { id: 'office', label: 'Office', kind: 'room', optional: false },
        { id: 'vault', label: 'Vault', kind: 'room', optional: false },
        { id: 'store', label: 'Store', kind: 'room', optional: true },
        { id: 'lobby', label: 'Lobby', kind: 'room', optional: true },
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
        const write = (s, g, erbText = null) => {
            writeFileSync(erb, erbText ?? JSON.stringify(s));
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
        assert.deepEqual(d.flagged, ["new lock 'door_new' guards room 'vault' (required content)"]);
    });
});

// M2: the gate's far side. A gate on an object that is no lock and no required target guards
// nothing, even in a required room; a door gate starts at its connectedRoom, not the near room.
const diffAfter = (fx, before, after) => {
    fx.write(before, graph());
    assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
    fx.write(after, graph());
    return fx.run(fx.base, '--graph-json', fx.gj);
};

test('V9: an access list on a non-lock object in a required room is a change, not a rule 2 flag', { skip }, () => {
    fixture(fx => {
        const r = diffAfter(fx, scenario({ vaultObjs: [{ id: 'coffee', type: 'coffee_machine', name: 'Coffee' }] }),
            scenario({ vaultObjs: [{ id: 'coffee', type: 'coffee_machine', name: 'Coffee', access: { people: ['pierce'] } }] }));
        assert.equal(r.status, 1, r.stdout + r.stderr);
        assert.doesNotMatch(r.stdout, /RULE 2/);
        const t = diffAfter(fx, scenario(), scenario({ vaultGate: true }));
        assert.equal(t.status, 1, t.stdout + t.stderr);
    });
});

test('V9: a gate on a door into a required room, from a room with nothing else, is flagged (exit 2)', { skip }, () => {
    fixture(fx => {
        const r = diffAfter(fx, scenario({ lobbyDoors: [{ connectedRoom: 'vault' }] }),
            scenario({ lobbyDoors: [{ connectedRoom: 'store' }, { connectedRoom: 'vault', gate: { requireGlobal: 'ok' } }] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new gate at \/rooms\/lobby\/doors\[vault\] guards room 'vault' \(required content\)/);
        // a door added before an existing one does not re-key it (doors are keyed by connectedRoom)
        assert.doesNotMatch(r.stdout, /doors\[store\]/);
    });
});

test('V9: a gate on the object a required task names is flagged; a gate on a lock follows its lock node', { skip }, () => {
    fixture(fx => {
        const tasks = [{ taskId: 'get_ledger', title: 'L', type: 'collect_items', targetItemIds: ['ledger'], status: 'active' }];
        const ledger = (extra = {}) => ({ id: 'ledger', type: 'notes', name: 'Ledger', takeable: true, ...extra });
        const r = diffAfter(fx, scenario({ tasks, storeObjs: [ledger()] }), scenario({ tasks, storeObjs: [ledger({ gate: { requireGlobal: 'ok' } })] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new gate at \/rooms\/store\/objects\[ledger\] guards object 'ledger' \(task get_ledger\)$/m);
        // an object gate on a lock starts at lock_<id> and reaches what that lock guards
        const g = graph();
        g.nodes.push({ id: 'lock_safe', label: 'Safe', kind: 'lock', optional: true });
        g.edges.push({ from: 'store', to: 'lock_safe', soft: false }, { from: 'lock_safe', to: 'vault', soft: false });
        const safe = (extra = {}) => ({ id: 'safe', type: 'safe', name: 'Safe', locked: true, lockType: 'key', ...extra });
        fx.write(scenario({ storeObjs: [safe()] }), g);
        fx.run('--write', fx.base, '--graph-json', fx.gj);
        fx.write(scenario({ storeObjs: [safe({ access: { people: ['pierce'] } })] }), g);
        const l = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(l.status, 2, l.stdout + l.stderr);
        assert.match(l.stdout, /RULE 2: new access at \/rooms\/store\/objects\[safe\] guards room 'vault' \(required content\)$/m);
    });
});

// M3: required content of tasks with no target of their own.
test('V9: a custom task set by an NPC ink, and a collect_items task, make their rooms required (m08 shape)', { skip }, () => {
    fixture(fx => {
        writeFileSync(join(dirname(fx.erb), 'mole.ink'), '=== start ===\nMole: Fine. #complete_task:confront_mole\n-> END\n');
        const tasks = [{ taskId: 'confront_mole', title: 'C', type: 'custom', status: 'active' }];
        const mole = { id: 'mole', displayName: 'Mole', npcType: 'person', storyPath: 'mole.json', position: { x: 1, y: 1 } };
        const r = diffAfter(fx, scenario({ tasks, storeNpcs: [mole], lobbyDoors: [{ connectedRoom: 'store' }] }),
            scenario({ tasks, storeNpcs: [mole], lobbyDoors: [{ connectedRoom: 'store', access: { people: ['pierce'] } }] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new access at \/rooms\/lobby\/doors\[store\] guards room 'store'/);
        const snap = JSON.parse(readFileSync(fx.base, 'utf8'));
        assert.deepEqual(snap.requiredContent.filter(([room]) => room === 'store'), [['store', "task confront_mole (ink of 'mole')", 'mole']]);
        // the same task completed by a mapping on the NPC's conversation
        const byMap = [{ id: 'mole', displayName: 'Mole', npcType: 'person', position: { x: 1, y: 1 } }];
        const top = { eventMappings: [{ eventPattern: 'conversation_closed:mole', completeTask: 'confront_mole' }] };
        const m = diffAfter(fx, { ...scenario({ tasks, storeNpcs: byMap, lobbyDoors: [{ connectedRoom: 'store' }] }), ...top },
            { ...scenario({ tasks, storeNpcs: byMap, lobbyDoors: [{ connectedRoom: 'store', gate: { requireGlobal: 'ok' } }] }), ...top });
        assert.equal(m.status, 2, m.stdout + m.stderr);
        // optional room with no required content: a change only
        const o = diffAfter(fx, scenario({ lobbyDoors: [{ connectedRoom: 'store' }] }),
            scenario({ lobbyDoors: [{ connectedRoom: 'store', gate: { requireGlobal: 'ok' } }] }));
        assert.equal(o.status, 1, o.stdout + o.stderr);
    });
});

test('V9: a submit_flags task makes the flag station room required', { skip }, () => {
    fixture(fx => {
        const tasks = [{ taskId: 'flags', title: 'F', type: 'submit_flags', targetFlags: ['ref1'], status: 'active' }];
        const station = { id: 'fs', type: 'flag-station', name: 'Drop site' };
        const r = diffAfter(fx, scenario({ tasks, storeObjs: [station], lobbyDoors: [{ connectedRoom: 'store' }] }),
            scenario({ tasks, storeObjs: [station], lobbyDoors: [{ connectedRoom: 'store', wearable: { requires: 'hivis' } }] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new wearable at \/rooms\/lobby\/doors\[store\] guards room 'store'/);
    });
});

// R2 M1: a new lock on the required object itself, which has nothing downstream in the graph.
test('V9: a new lock on a flag station or on a required task\'s targetObject is flagged (exit 2)', { skip }, () => {
    fixture(fx => {
        const tasks = [{ taskId: 'flags', title: 'F', type: 'submit_flags', targetFlags: ['fs:box-flag1'], status: 'active' },
                       { taskId: 'read_ws', title: 'W', type: 'custom', targetObject: 'ws', status: 'active' }];
        const objs = (fsx = {}, wsx = {}) => [{ id: 'fs', type: 'flag-station', name: 'Drop site', ...fsx },
                                              { id: 'ws', type: 'pc', name: 'Workstation', ...wsx }];
        // no lock node in the graph: the lock entry is checked against the object
        const r = diffAfter(fx, scenario({ tasks, storeObjs: objs() }),
            scenario({ tasks, storeObjs: objs({ locked: true, lockType: 'key', requires: 'k' }) }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new lock at \/rooms\/store\/objects\[fs\] guards object 'fs' \(task flags \(flag station\)\)$/m);
        // with the lock node the generator writes (lock_<id>, under its room, nothing downstream)
        fx.write(scenario({ tasks, storeObjs: objs() }), graph());
        fx.run('--write', fx.base, '--graph-json', fx.gj);
        const g = graph();
        g.nodes.push({ id: 'lock_ws', label: 'Workstation', kind: 'lock', optional: false });
        g.edges.push({ from: 'store', to: 'lock_ws', soft: false });
        fx.write(scenario({ tasks, storeObjs: objs({}, { locked: true, lockType: 'password', requires: 'pw' }) }), g);
        const l = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(l.status, 2, l.stdout + l.stderr);
        assert.match(l.stdout, /RULE 2: new lock 'lock_ws' guards object 'ws' \(task read_ws\)$/m);
        assert.doesNotMatch(l.stdout, /new lock at /);
        // a lock on an object nothing requires is a change only
        const o = diffAfter(fx, scenario({ tasks, storeObjs: [...objs(), { id: 'drawer', type: 'notes', name: 'Drawer' }] }),
            scenario({ tasks, storeObjs: [...objs(), { id: 'drawer', type: 'notes', name: 'Drawer', locked: true, lockType: 'key', requires: 'k' }] }));
        assert.equal(o.status, 1, o.stdout + o.stderr);
    });
});

// R2 M2: the other ways the engine completes a required task, and station attribution.
test('V9: required content from object complete_task actions, targetItemIds by name or lock ref, and targetGroup', { skip }, () => {
    fixture(fx => {
        const tasks = [
            { taskId: 'read_temp', title: 'T', type: 'custom', status: 'active' },
            { taskId: 'shut_down', title: 'S', type: 'custom', status: 'active' },
            { taskId: 'get_keys', title: 'K', type: 'collect_items', targetItemIds: ["Office Key", 'office_lock'], status: 'active' },
            { taskId: 'get_files', title: 'G', type: 'collect_items', targetGroup: 'pc_files', status: 'active' }];
        const objs = [
            { id: 'thermo', type: 'notes', name: 'Thermometer', triggerOnInteract: [{ type: 'complete_task', taskId: 'read_temp' }] },
            { id: 'button', type: 'pc', name: 'Button', completionActions: [{ type: 'complete_task', taskId: 'shut_down' }] },
            { id: 'drawer', type: 'notes', name: 'Drawer', contents: [{ type: 'key', name: 'Office Key' }, { type: 'key', name: 'Spare', opens_lock: 'office_lock' }] },
            { id: 'pc', type: 'pc', name: 'PC', contents: [{ type: 'text_file', name: 'Mail', collection_group: 'pc_files' }] }];
        fx.write(scenario({ tasks, storeObjs: objs }), graph());
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        const rc = JSON.parse(readFileSync(fx.base, 'utf8')).requiredContent.filter(([room]) => room === 'store');
        assert.deepEqual(rc, [
            ['store', "task get_files (group 'pc_files')", 'Mail'],
            ['store', 'task get_keys', 'Office Key'],
            ['store', 'task get_keys', 'Spare'],
            ['store', "task read_temp (action on 'thermo')", 'thermo'],
            ['store', "task shut_down (action on 'button')", 'button']]);
    });
});

test('V9: a flag task is tied to the station its targetFlags name, any type, else by the lock or VM it names', { skip }, () => {
    fixture(fx => {
        const tasks = [{ taskId: 'f1', title: 'F', type: 'submit_flags', targetFlags: ['fs_a:box-flag1'], status: 'active' },
                       { taskId: 'f2', title: 'F', type: 'submit_flags', targetFlags: ['box:flag_2'], status: 'active' },
                       { taskId: 'f3', title: 'F', type: 'submit_flags', targetFlags: ['box-flag3'], status: 'active' }];
        const storeObjs = [{ id: 'fs_a', type: 'flag-station', name: 'A', acceptsVms: ['other'] },
                           { id: 'fs_b', type: 'flag-station', name: 'B', acceptsVms: ['other'] },
                           { id: 'launch', type: 'launch-device', name: 'L', acceptsVms: ['box'] },
                           { id: 'kali', type: 'vm-launcher', name: 'Kali' },
                           { id: 'vault_box', type: 'safe', name: 'Box', locked: true, lockType: 'flag', requires: 'box:flag_2' }];
        fx.write(scenario({ tasks, storeObjs }), graph());
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        const rc = JSON.parse(readFileSync(fx.base, 'utf8')).requiredContent.filter(([room]) => room === 'store');
        // R3 minor 4: <vm>:flag_N is a reference, so f2 names the lock that requires it, not the
        // launch device that accepts the VM; the unqualified <vm>-flagN (f3) goes to every acceptor
        assert.deepEqual(rc, [
            ['store', 'VM launcher (flag tasks)', 'kali'],
            ['store', 'task f1 (flag station)', 'fs_a'],
            ['store', 'task f2 (flag station)', 'vault_box'],
            ['store', 'task f3 (flag station)', 'launch']]);
    });
});

// Minor 14: an ERB template that draws random values still diffs empty.
test('V9: random_pin and Kernel#rand in the template hash alike run to run; SecureRandom is refused', { skip }, () => {
    fixture(fx => {
        const text = JSON.stringify(scenario({ pin: '__PIN__', storeObjs: [{ id: 'safe', type: 'safe', name: 'Safe', locked: true, lockType: 'pin', requires: '__RAND__' }] }))
            .replace('"__PIN__"', '"<%= random_pin %>"').replace('"__RAND__"', '"<%= rand(1000..9999) %>"');
        fx.write(null, graph(), text);
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        for (let i = 0; i < 3; i++) {
            const r = fx.run(fx.base, '--graph-json', fx.gj);
            assert.equal(r.status, 0, r.stdout + r.stderr);
        }
        fx.write(null, graph(), text.replace('"<%= rand(1000..9999) %>"', '"<%= SecureRandom.hex(4) %>"'));
        const r = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(r.status, 64);
        assert.match(r.stderr, /renders differently each time/);
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

// ── R3 ─────────────────────────────────────────────────────────────────────────────────────
// Layout fixtures: rooms by name with connections, the scenario's task reaching `vault`.
function lay({ rooms, locked = [], start = 'office', objects = {} }) {
    const out = {};
    for (const [id, conns] of Object.entries(rooms)) {
        out[id] = { type: 'room_office', connections: conns, objects: objects[id] || [], npcs: [],
            ...(locked.includes(id) ? { locked: true, lockType: 'key', requires: `k_${id}` } : {}) };
    }
    return { startRoom: start, objectives: [{ aimId: 'a', title: 'A', status: 'active', order: 0, tasks: [
        { taskId: 'reach_vault', title: 'Reach the vault', type: 'enter_room', targetRoom: 'vault', status: 'active' }] }], rooms: out };
}
function layGraph(rooms, locked) {
    // as generate_dungeon_graph.rb draws it: no room edge into or out of a locked room
    const nodes = rooms.map(r => ({ id: r, label: r, kind: 'room', optional: r !== 'vault' }));
    locked.forEach(r => nodes.push({ id: `door_${r}`, label: r, kind: 'lock', optional: false }));
    return { scenario: 'fixture', start_room: 'office', nodes, edges: [] };
}
function layDiff(fx, before, after) {
    const rooms = s => Object.keys(s.rooms);
    const lk = s => rooms(s).filter(r => s.rooms[r].locked);
    fx.write(before, layGraph(rooms(before), lk(before)));
    assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
    fx.write(after, layGraph(rooms(after), lk(after)));
    return fx.run(fx.base, '--graph-json', fx.gj);
}
const chain = { office: { north: 'hall' }, hall: { south: 'office', north: 'vault' }, vault: { south: 'hall' } };

test('V9 R3 M1: a lock on a corridor in front of a locked required room exits 2, though the graph has no edge past it', { skip }, () => {
    fixture(fx => {
        const r = layDiff(fx, lay({ rooms: chain, locked: ['vault'] }), lay({ rooms: chain, locked: ['vault', 'hall'] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new lock 'door_hall' guards room 'vault' \(reachable only through 'hall'\)/);
    });
});

test('V9 R3 M1: a new locked room between the start room and the rest exits 2', { skip }, () => {
    fixture(fx => {
        const after = { office: { north: 'annex' }, annex: { south: 'office', north: 'hall' }, hall: { south: 'annex', north: 'vault' }, vault: { south: 'hall' } };
        const r = layDiff(fx, lay({ rooms: chain }), lay({ rooms: after, locked: ['annex'] }));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new lock 'door_annex' guards .*room 'vault' \(reachable only through 'annex'\)/);
    });
});

test('V9 R3 M1: a locked side room whose onward room has another way in exits 1; a locked dead-end room too', { skip }, () => {
    fixture(fx => {
        const loop = { office: { north: 'hall', east: 'side' }, hall: { south: 'office', north: 'vault', east: 'side' }, side: { west: 'office', north: 'hall' }, vault: { south: 'hall' } };
        const r = layDiff(fx, lay({ rooms: loop }), lay({ rooms: loop, locked: ['side'] }));
        assert.equal(r.status, 1, r.stdout + r.stderr);
        assert.doesNotMatch(r.stdout, /RULE 2/);
        const dead = { ...chain, office: { north: 'hall', east: 'closet' }, closet: { west: 'office' } };
        assert.equal(layDiff(fx, lay({ rooms: dead }), lay({ rooms: dead, locked: ['closet'] })).status, 1);
    });
});

test('V9 R3 M1: a gate on a door that is the only way to a required room exits 2; with a second way in it exits 1', { skip }, () => {
    fixture(fx => {
        const sc = (second) => { const s = lay({ rooms: second ? { ...chain, office: { north: 'hall', east: 'vault' }, vault: { south: 'hall', west: 'office' } } : chain });
            s.rooms.office.doors = [{ connectedRoom: 'hall' }]; return s; };
        const gated = (second) => { const s = sc(second); s.rooms.office.doors[0].gate = { requireGlobal: 'ok' }; return s; };
        const r = layDiff(fx, sc(false), gated(false));
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: new gate at \/rooms\/office\/doors\[hall\] guards .*room 'vault'/);
        assert.equal(layDiff(fx, sc(true), gated(true)).status, 1);
    });
});

test('V9 R3 minor 2: an id-less lock keeps its path when an object is inserted before it', { skip }, () => {
    fixture(fx => {
        const cab = { type: 'safe', name: 'Main Filing Cabinet', locked: true, lockType: 'key', requires: 'k1' };
        const plant = { type: 'plant', name: 'Plant' };
        const mk = objs => lay({ rooms: chain, objects: { hall: objs } });
        const r = layDiff(fx, mk([cab]), mk([plant, cab]));
        assert.equal(r.status, 0, r.stdout + r.stderr);
        assert.match(r.stdout, /lock and key diff: empty/);
        // two id-less objects of one type and name stay apart by position
        const a = { type: 'safe', name: 'Safe', position: { x: 1, y: 1 }, locked: true, lockType: 'key', requires: 'a' };
        const b = { type: 'safe', name: 'Safe', position: { x: 2, y: 1 } };
        assert.equal(layDiff(fx, mk([a, b]), mk([plant, a, b])).status, 0);
    });
});

test('V9 R3 minor 3: removing or switching off a critical-path lock is a RULE 2 bypass (exit 2)', { skip }, () => {
    fixture(fx => {
        const before = lay({ rooms: chain, locked: ['vault'] });
        fx.write(before, layGraph(Object.keys(before.rooms), ['vault']));
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        const after = lay({ rooms: chain });
        fx.write(after, layGraph(Object.keys(after.rooms), []));
        const r = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(r.status, 2, r.stdout + r.stderr);
        assert.match(r.stdout, /RULE 2: critical-path lock 'door_vault' removed or switched off/);
        // an object switched to locked: false keeps its graph node, but is still a bypass
        const obj = locked => { const x = lay({ rooms: chain, objects: { hall: [{ id: 'cab', type: 'safe', name: 'Cab', lockType: 'key', requires: 'k', locked }] } }); return x; };
        const og = () => { const gr = layGraph(['office', 'hall', 'vault'], []); gr.nodes.push({ id: 'lock_cab', label: 'Cab', kind: 'lock', optional: false }); return gr; };
        fx.write(obj(true), og());
        fx.run('--write', fx.base, '--graph-json', fx.gj);
        fx.write(obj(false), og());
        const sw = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(sw.status, 2, sw.stdout + sw.stderr);
        assert.match(sw.stdout, /RULE 2: critical-path lock 'lock_cab' removed or switched off/);
        // an optional lock removed is an ordinary change
        const opt = layGraph(Object.keys(before.rooms), ['vault']);
        opt.nodes.find(n => n.id === 'door_vault').optional = true;
        fx.write(before, opt);
        fx.run('--write', fx.base, '--graph-json', fx.gj);
        fx.write(after, layGraph(Object.keys(after.rooms), []));
        assert.equal(fx.run(fx.base, '--graph-json', fx.gj).status, 1);
    });
});

test('V9 R3 minor 4: completesTask and completesTaskOnOpen tie a task to the object', { skip }, () => {
    fixture(fx => {
        const s = lay({ rooms: chain, objects: { hall: [
            { id: 'archive', type: 'safe', name: 'Archive', locked: true, lockType: 'flag', requires: 'box:flag_1', completesTask: 'submit' },
            { id: 'monitor', type: 'pc', name: 'Monitor', completesTaskOnOpen: ['check'] }] } });
        s.objectives[0].tasks.push({ taskId: 'submit', title: 'S', type: 'submit_flags', targetFlags: ['box:flag_1'], status: 'active' },
            { taskId: 'check', title: 'C', type: 'custom', status: 'active' });
        s.rooms.office.objects.push({ id: 'launch', type: 'launch-device', name: 'L', acceptsVms: ['box'] });
        fx.write(s, layGraph(Object.keys(s.rooms), []));
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        const rc = JSON.parse(readFileSync(fx.base, 'utf8')).requiredContent;
        assert.ok(rc.some(([r, w, x]) => r === 'hall' && x === 'archive' && /completesTask on 'archive'/.test(w)), JSON.stringify(rc));
        assert.ok(rc.some(([r, w, x]) => r === 'hall' && x === 'monitor' && /completesTaskOnOpen/.test(w)), JSON.stringify(rc));
        assert.ok(!rc.some(([, , x]) => x === 'launch'), 'the launch device does not complete a <vm>:flag_N task');
    });
});

test('V9 R3 minor 5: a global-triggered mapping counts the rooms that set the global, not the holder NPC room', { skip }, () => {
    fixture(fx => {
        const mapping = g => ({ eventPattern: `global_variable_changed:${g}`, completeTask: 'decode' });
        const holder = { id: 'phone', npcType: 'phone', displayName: 'P', eventMappings: [mapping('seen'), { ...mapping('engine_only'), completeTask: 'other' }] };
        const s = lay({ rooms: { ...chain, den: { south: 'hall' } }, objects: { vault: [{ id: 'note', type: 'notes', name: 'N', onRead: { setVariable: { seen: true } } }] } });
        s.rooms.office.npcs.push(holder);
        s.objectives[0].tasks.push({ taskId: 'decode', title: 'D', type: 'manual', status: 'active' }, { taskId: 'other', title: 'O', type: 'manual', status: 'active' });
        fx.write(s, layGraph(Object.keys(s.rooms), []));
        assert.equal(fx.run('--write', fx.base, '--graph-json', fx.gj).status, 0);
        const rc = JSON.parse(readFileSync(fx.base, 'utf8')).requiredContent.filter(([, w]) => /mapping/.test(w));
        assert.deepEqual(rc.filter(([, w]) => /decode/.test(w)).map(r => r[0]), ['vault']);
        // nothing in the scenario sets it (a minigame result): the holder's room stands in
        assert.deepEqual(rc.filter(([, w]) => /task other/.test(w)).map(r => r[0]), ['office']);
    });
});

test('V9 R3 minor 7: a lockType without locked: true is no lock, as the engine reads it', { skip }, () => {
    fixture(fx => {
        const tasks = [{ taskId: 'get', title: 'G', type: 'unlock_object', targetObject: 'ledger', status: 'active' }];
        const mk = locked => { const s = lay({ rooms: chain }); s.objectives[0].tasks.push(...tasks);
            s.rooms.hall.objects = [{ id: 'ledger', type: 'safe', name: 'Ledger', lockType: 'pin', requires: '1', ...(locked ? { locked: true } : {}) }]; return s; };
        const base = lay({ rooms: chain }); base.objectives[0].tasks.push(...tasks);
        base.rooms.hall.objects = [{ id: 'ledger', type: 'safe', name: 'Ledger' }];
        fx.write(base, layGraph(Object.keys(base.rooms), []));
        fx.run('--write', fx.base, '--graph-json', fx.gj);
        fx.write(mk(false), layGraph(Object.keys(base.rooms), []));
        const r = fx.run(fx.base, '--graph-json', fx.gj);
        assert.equal(r.status, 1, r.stdout + r.stderr);
        fx.write(mk(true), layGraph(Object.keys(base.rooms), []));
        assert.equal(fx.run(fx.base, '--graph-json', fx.gj).status, 2);
    });
});

// R2 M2: every required task in m01 to m10 places at least one room in requiredContent. A task
// with no static room (none today) goes in EXCEPTIONS with the reason.
const EXCEPTIONS = {};
test('corpus: every required task of m01 to m10 has a requiredContent room', { skip }, () => {
    const script = `$stdout = File.open(File::NULL, 'w')
      load ${JSON.stringify(tool)}
      out = Dir[File.join(${JSON.stringify(root)}, 'scenarios', 'm{0,1}[0-9]_*', 'scenario.json.erb')].sort.to_h do |erb|
        sc = LockKeyDiff.render(erb)
        pl = {}
        sc['rooms'].each { |rid, room| LockKeyDiff.walk(room, '') { |o, _| pl[o['id'].to_s] ||= rid if o['id'].is_a?(String) } }
        placed = LockKeyDiff.required_content(sc, pl, erb).select(&:first).map { |r| r[1][/\\Atask (\\S+)/, 1] }.compact
        [File.basename(File.dirname(erb)), LockKeyDiff.required_task_ids(sc).map { |t| t['taskId'] } - placed]
      end
      STDOUT.puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(Object.keys(out).length, 10, Object.keys(out).join(', '));
    for (const [id, missing] of Object.entries(out)) assert.deepEqual(missing.filter(t => !EXCEPTIONS[`${id}:${t}`]), [], id);
});
