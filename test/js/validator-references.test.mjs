// Step 4 of the scenario format hardening: reference and id checks driven by schema annotations.
// scripts/validate_scenario.rb check_references walks the scenario with the shared schema walker
// (lib/break_escape/schema_walk.rb), reads "x-ref": "<kind>" off each string leaf's schema node,
// and resolves it against an index of every id of that kind. An unresolved reference is a warning;
// id reuse at any depth is a warning. This drives the check through the real ruby function.
// Run with: node --test test/js/validator-references.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function refs(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_references(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' },
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// A minimal, schema-valid-ish scenario; the checks read only the parts each test exercises.
const base = (over = {}) => ({
    scenario_brief: 'x', startRoom: 'a', globalVariables: { known_flag: false },
    objectives: [{
        aimId: 'aim1', title: 't', status: 'active', order: 1,
        tasks: [{ taskId: 'task1', title: 't', type: 'custom', status: 'active' }],
    }],
    rooms: { a: { type: 'room_office', connections: {}, objects: [], npcs: [] } },
    ...over,
});

const only = (list, re) => list.filter((l) => re.test(l));

test('a completeTask naming a missing task warns; a valid one is silent', { skip }, () => {
    const s = base();
    s.rooms.a.npcs = [{
        id: 'bob', type: 'person', name: 'B',
        eventMappings: [{ eventPattern: 'x', completeTask: 'nope' }, { eventPattern: 'y', completeTask: 'task1' }],
    }];
    const out = only(refs(s), /references task/);
    assert.equal(out.length, 1);
    assert.match(out[0], /references task 'nope'/);
});

test('a missing aim in unlockCondition.aimCompleted warns', { skip }, () => {
    const s = base();
    s.objectives[0].unlockCondition = { aimCompleted: 'ghost_aim' };
    const out = only(refs(s), /references aim/);
    assert.equal(out.length, 1);
    assert.match(out[0], /references aim 'ghost_aim'/);
});

test('a missing global in concludeRequires.globals warns; a declared one is silent', { skip }, () => {
    const s = base();
    s.objectives[0].concludeRequires = { globals: ['known_flag', 'undeclared_flag'] };
    const out = only(refs(s), /references global/);
    assert.equal(out.length, 1);
    assert.match(out[0], /references global 'undeclared_flag'/);
});

test('a missing network on an object warns', { skip }, () => {
    const s = base({ networks: { office_lan: {} } });
    s.rooms.a.objects = [{ id: 'pc1', type: 'pc', name: 'PC', network: 'ghost_net' }];
    const out = only(refs(s), /references network/);
    assert.equal(out.length, 1);
    assert.match(out[0], /references network 'ghost_net'/);
    // a valid network is silent
    s.rooms.a.objects[0].network = 'office_lan';
    assert.equal(only(refs(s), /references network/).length, 0);
});

test('an engine-written global (<objId>_screen_locked, <npcId>_frustration) is accepted', { skip }, () => {
    const s = base();
    s.rooms.a.objects = [{ id: 'pc1', type: 'pc', name: 'PC' }];
    s.rooms.a.npcs = [{ id: 'bob', type: 'person', name: 'B' }];
    s.objectives[0].concludeRequires = { globals: ['pc1_screen_locked', 'bob_frustration', 'pc1_accessed'] };
    assert.deepEqual(only(refs(s), /references global/), []);
});

test('a reused object id at any depth (contents and itemsHeld) warns', { skip }, () => {
    const s = base();
    s.rooms.a.objects = [
        { id: 'safe1', type: 'safe', name: 'S', contents: [{ id: 'dup', type: 'notes', name: 'N' }] },
        { id: 'box1', type: 'safe', name: 'B', itemsHeld: [{ id: 'dup', type: 'notes', name: 'N2' }] },
    ];
    const out = only(refs(s), /object id 'dup' is used by more than one object/);
    assert.equal(out.length, 1);
    assert.match(out[0], /contents\[0\]/);
    assert.match(out[0], /itemsHeld\[0\]/);
});

test('duplicate top-level room-object ids are left to the social lint (not double-reported here)', { skip }, () => {
    const s = base();
    s.rooms.a.objects = [
        { id: 'same', type: 'safe', name: 'A' },
        { id: 'same', type: 'safe', name: 'B' },
    ];
    assert.deepEqual(only(refs(s), /is used by more than one object/), []);
});

test('a reused NPC id warns', { skip }, () => {
    const s = base();
    s.rooms.a.npcs = [{ id: 'twin', type: 'person', name: 'A' }];
    s.npcs = [{ id: 'twin', type: 'person', name: 'B' }];
    const out = only(refs(s), /NPC id 'twin' is used by more than one NPC/);
    assert.equal(out.length, 1);
});

test('a clean scenario produces no reference findings', { skip }, () => {
    const s = base();
    s.rooms.a.npcs = [{ id: 'bob', type: 'person', name: 'B', eventMappings: [{ eventPattern: 'x', completeTask: 'task1', unlockAim: 'aim1' }] }];
    assert.deepEqual(refs(s), []);
});
