// scripts/validate_scenario.rb check_npc_walk and check_npc_pop
// (docs/agents/NPC_WALK_IN_OUT_PLAN.md section 8): the shape of walkIn/walkOut, the rooms and
// tiles they name, the clash with setVisible/patrolOverride, and the "pop" check for a visible
// NPC shown or hidden in place by setVisible.
// Run with: node test/js/npc-walk-validator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

if (spawnSync('ruby', ['--version']).status !== 0 && process.env.CI) {
    test('ruby is available (required under CI)', () => {
        assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
    });
}

function run(fn, scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const walk = (sc) => run('check_npc_walk', sc);
const pop = (sc) => run('check_npc_pop', sc);
const has = (list, frag) => list.some((s) => s.includes(frag));
const errors = (list) => list.filter((s) => s.startsWith('❌'));

// hall (the NPC's room) with a free room north, a gate room east that names sam, a gate room
// south that does not, a locked room west and an unconnected room
function scenario(mapping, npcExtra = {}) {
    return {
        startRoom: 'hall',
        rooms: {
            hall: {
                type: 'room_office', connections: { north: 'north_room', east: 'gate_room', south: 'closed_gate', west: 'locked_room' },
                doors: [
                    { connectedRoom: 'gate_room', direction: 'east', gate: { openFor: ['sam'] } },
                    { connectedRoom: 'closed_gate', direction: 'south', gate: { openFor: ['other'] } }
                ],
                npcs: [{ id: 'sam', npcType: 'person', position: { x: 4, y: 4 }, eventMappings: [{ eventPattern: 'go', ...mapping }], ...npcExtra }]
            },
            north_room: { type: 'room_office', connections: { south: 'hall' } },
            gate_room: { type: 'room_office', connections: { west: 'hall' } },
            closed_gate: { type: 'room_office', connections: { north: 'hall' } },
            locked_room: { type: 'room_office', connections: { east: 'hall' }, locked: true, lockType: 'key', requires: 'k' },
            far_room: { type: 'room_office', connections: {} }
        }
    };
}

test('walkIn true and walkOut true raise nothing', { skip }, () => {
    assert.deepEqual(walk(scenario({ walkIn: true })), []);
    assert.deepEqual(walk(scenario({ walkOut: true })), []);
});

test('a full walkIn and walkOut object through a connected room raise nothing', { skip }, () => {
    assert.deepEqual(walk(scenario({ walkIn: { from: 'north_room', to: { x: 4, y: 4 }, speed: 90, timeoutMs: 20000 } })), []);
    assert.deepEqual(walk(scenario({ walkOut: { to: 'north_room', speed: 90 } })), []);
    assert.deepEqual(walk(scenario({ walkIn: { from: 'offscreen' } })), []);
    assert.deepEqual(walk(scenario({ walkOut: { to: { room: 'north_room', x: 3, y: 3 } } })), []);
});

test('walkIn or walkOut with setVisible or patrolOverride is an error', { skip }, () => {
    for (const other of [{ setVisible: true }, { patrolOverride: { targetTile: { x: 1, y: 1 } } }]) {
        const out = walk(scenario({ walkIn: true, ...other }));
        assert.ok(has(errors(out), 'walkIn/walkOut and'), out.join('\n'));
    }
    assert.ok(has(errors(walk(scenario({ walkOut: true, setVisible: false }))), 'setVisible'));
});

test('both walkIn and walkOut in one mapping is an error', { skip }, () => {
    assert.ok(has(errors(walk(scenario({ walkIn: true, walkOut: true }))), 'both walkIn and walkOut'));
});

test('a phone NPC cannot walk', { skip }, () => {
    const out = walk(scenario({ walkIn: true }, { npcType: 'phone' }));
    assert.ok(has(errors(out), 'phone NPC'), out.join('\n'));
});

test('bad shapes are errors', { skip }, () => {
    assert.ok(has(errors(walk(scenario({ walkIn: 'yes' }))), 'must be true or an object'));
    assert.ok(has(errors(walk(scenario({ walkIn: { fro: 'north_room' } }))), "unknown key 'fro'"));
    assert.ok(has(errors(walk(scenario({ walkOut: { from: 'north_room' } }))), "unknown key 'from'"));
    assert.ok(has(errors(walk(scenario({ walkIn: { speed: 0 } }))), 'speed'));
    assert.ok(has(errors(walk(scenario({ walkIn: { timeoutMs: -5 } }))), 'timeoutMs'));
    assert.ok(has(errors(walk(scenario({ walkIn: { to: { x: 'a', y: 1 } } }))), '/to'));
    assert.ok(has(errors(walk(scenario({ walkOut: { to: 7 } }))), 'must be a room id'));
    assert.ok(has(errors(walk(scenario({ walkOut: { to: { room: 'north_room' } } }))), '{room: roomId, x: number, y: number}'));
});

test('a room that does not exist or is not connected is an error', { skip }, () => {
    assert.ok(has(errors(walk(scenario({ walkIn: { from: 'nowhere' } }))), 'does not exist'));
    assert.ok(has(errors(walk(scenario({ walkOut: { to: 'far_room' } }))), 'not connected'));
});

test('a gate that does not name the NPC is an error; one that does is fine', { skip }, () => {
    assert.ok(has(errors(walk(scenario({ walkIn: { from: 'closed_gate' } }))), 'openFor does not list'));
    assert.deepEqual(walk(scenario({ walkIn: { from: 'gate_room' } })), []);
});

test('a locked, non-gate room is a warning (fades at the doorway)', { skip }, () => {
    const out = walk(scenario({ walkOut: { to: 'locked_room' } }));
    assert.deepEqual(errors(out), []);
    assert.ok(out.some((s) => s.startsWith('⚠️') && s.includes('fade at the doorway')), out.join('\n'));
});

test('a tile outside the room is an error', { skip }, () => {
    const out = walk(scenario({ walkIn: { to: { x: 999, y: 1 } } }));
    assert.ok(has(errors(out), 'outside room'), out.join('\n'));
    assert.ok(has(errors(walk(scenario({ walkOut: { to: { room: 'north_room', x: 2, y: -1 } } }))), 'outside room'));
});

test('walkIn.to away from the NPC position is a warning', { skip }, () => {
    const out = walk(scenario({ walkIn: { to: { x: 5, y: 5 } } }));
    assert.deepEqual(errors(out), []);
    assert.ok(has(out, 'differs from the NPC\'s position'), out.join('\n'));
});

test('mappings given as a hash are checked too', { skip }, () => {
    const sc = scenario({});
    sc.rooms.hall.npcs[0].eventMappings = { go: { eventPattern: 'go', walkIn: { bogus: 1 } } };
    assert.ok(has(errors(walk(sc)), "unknown key 'bogus'"));
});

// ---- the pop check ----

test('pop: setVisible on room_entered of the NPC\'s own room is flagged, never as an error', { skip }, () => {
    const sc = scenario({ eventPattern: 'room_entered:hall', setVisible: false });
    const out = pop(sc);
    assert.equal(out.length, 1, out.join('\n'));
    assert.deepEqual(errors(out), []);
    assert.match(out[0], /pop check/);
});

test('pop: setVisible with a bark or conversation, or hiding on own arrival, is flagged', { skip }, () => {
    assert.equal(pop(scenario({ setVisible: true, bark: 'hi' })).length, 1);
    assert.equal(pop(scenario({ setVisible: true, conversationMode: 'person-chat', targetKnot: 'x' })).length, 1);
    assert.equal(pop(scenario({ eventPattern: 'npc_arrived:sam', setVisible: false })).length, 1);
});

test('pop: an identity swap, a walk, a phone NPC or a retired slot is not flagged', { skip }, () => {
    assert.deepEqual(pop(scenario({ setVisible: false })), []);
    assert.deepEqual(pop(scenario({ walkIn: true })), []);
    assert.deepEqual(pop(scenario({ eventPattern: 'room_entered:hall', setVisible: false }, { npcType: 'phone' })), []);
    assert.deepEqual(pop(scenario({ eventPattern: 'room_entered:hall', setVisible: false, _comment: 'Retired 2026: x', condition: 'data.retired_x' })), []);
});

test('pop level is WARN only when the known cases are the only hits; it is never an error', { skip }, () => {
    const src = readFileSync(join(root, 'scripts/validate_scenario.rb'), 'utf8');
    const level = src.match(/^POP_CHECK_LEVEL = :(\w+)/m)[1];
    assert.ok(['warn', 'info'].includes(level));
    const out = pop(scenario({ eventPattern: 'room_entered:hall', setVisible: false }));
    assert.ok(out[0].startsWith(level === 'warn' ? '⚠️' : 'ℹ️'), out[0]);
});
