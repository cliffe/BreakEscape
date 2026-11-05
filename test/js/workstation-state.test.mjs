// systems/workstation-state.js: screen lock on leave, occupied on return, seeded lockChance,
// workstation_accessed vs locked, and the npc-needs seededRoll helper.
// Run with: bin/test-js test/js/workstation-state.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkstationState, decideLocked, ownerOf, isWorkstation } from '../../public/break_escape/js/systems/workstation-state.js';
import { seededRoll, NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';

function rig(objects, seed = 's1') {
    const globals = {}; const emitted = []; const handlers = {};
    const sys = new NPCNeedsSystem({}, { seed });
    const env = {
        objects: () => objects,
        npcs: () => [{ id: 'ann', needsHome: 'pc_a' }, { id: 'bob', needsHome: 'pc_b' }],
        on: (p, cb) => { handlers[p] = cb; },
        emit: (n, d) => emitted.push([n, d]),
        setGlobal: (k, v) => { globals[k] = v; },
        roll: (id, salt) => sys.roll(id, salt)
    };
    const ws = new WorkstationState(env).install();
    return { ws, globals, emitted, handlers };
}
const names = (e) => e.map(x => x[0]);

test('seededRoll is deterministic, in [0,1), and varies with seed/npc/salt', () => {
    assert.equal(seededRoll('x', 'ann', 1), seededRoll('x', 'ann', 1));
    const v = seededRoll('x', 'ann', 1);
    assert.ok(v >= 0 && v < 1);
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('x', 'ann', 2));
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('x', 'bob', 1));
    assert.notEqual(seededRoll('x', 'ann', 1), seededRoll('y', 'ann', 1));
});

test('roll does not disturb the per-NPC RNG stream', () => {
    const sys = new NPCNeedsSystem({}, { seed: 'k' });
    sys.roll('ann', 'a'); sys.roll('ann', 'b');
    assert.equal(sys.roll('ann', 'a'), seededRoll('k', 'ann', 'a'));
});

test('workstation detection and owner resolution', () => {
    assert.equal(isWorkstation({ id: 'p' }), false);
    assert.equal(isWorkstation({ id: 'p', workstation: true }), true);
    assert.equal(isWorkstation({ id: 'p', lockChance: 0.5 }), true);
    assert.equal(ownerOf({ id: 'pc_a' }, [{ id: 'ann', needsHome: 'pc_a' }]), 'ann');
    assert.equal(ownerOf({ id: 'pc_a', screenOwner: 'zed' }, [{ id: 'ann', needsHome: 'pc_a' }]), 'zed');
});

test('default: leaves locked; locksScreenOnLeave:false leaves open; return occupies', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const r = rig([a, b]);
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    assert.equal(a.screenLocked, true);
    assert.equal(b.screenLocked, false);
    assert.equal(r.globals.pc_a_screen_locked, true);
    assert.equal(r.globals.pc_b_screen_locked, false);
    assert.equal(r.globals.pc_b_owner_away, true);
    r.ws.onReturned('bob');
    assert.equal(r.globals.pc_b_owner_away, false);
    assert.equal(r.ws.onInteract('pc_b'), 'attended');
});

test('interaction: open+away fires workstation_accessed, locked fires only the attempt, attended nothing', () => {
    const a = { id: 'pc_a', workstation: true };
    const b = { id: 'pc_b', workstation: true, locksScreenOnLeave: false };
    const r = rig([a, b]);
    assert.equal(r.ws.onInteract('pc_b'), 'attended');
    assert.deepEqual(names(r.emitted), []);
    r.ws.onLeft('ann'); r.ws.onLeft('bob');
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_a'), 'locked');
    assert.deepEqual(names(r.emitted), ['workstation_locked_attempt:pc_a']);
    assert.equal(r.globals.pc_a_accessed, undefined);
    r.emitted.length = 0;
    assert.equal(r.ws.onInteract('pc_b'), 'accessed');
    assert.deepEqual(r.emitted, [['workstation_accessed:pc_b', { objectId: 'pc_b', ownerId: 'bob' }]]);
    assert.equal(r.globals.pc_b_accessed, true);
});

test('lockChance: 0 never, 1 always, fractional is deterministic under a seed', () => {
    assert.equal(decideLocked({ id: 'p', lockChance: 0 }, 'ann', 1), false);
    assert.equal(decideLocked({ id: 'p', lockChance: 1 }, 'ann', 1), true);
    const seq = (seed) => {
        const d = { id: 'pc_a', lockChance: 0.5 };
        const r = rig([d], seed);
        const out = [];
        for (let i = 0; i < 12; i++) { r.ws.onLeft('ann'); out.push(d.screenLocked); r.ws.onReturned('ann'); }
        return out;
    };
    assert.deepEqual(seq('fixed'), seq('fixed'));
    const s = seq('fixed');
    assert.ok(s.includes(true) && s.includes(false), 'a 0.5 chance over 12 leaves yields both outcomes');
});

test('an NPC with no workstation, and a non-workstation object, are ignored', () => {
    const plain = { id: 'pc_a' };
    const r = rig([plain]);
    r.ws.onLeft('ann');
    assert.equal(plain.screenLocked, undefined);
    assert.equal(r.ws.onInteract('pc_a'), null);
    assert.equal(r.ws.onInteract('missing'), null);
});

test('the real dispatcher handlers are wired to left/returned events', () => {
    const a = { id: 'pc_a', workstation: true };
    const r = rig([a]);
    r.handlers['npc_left_post:*']({ npcId: 'ann' });
    assert.equal(a.screenLocked, true);
    r.handlers['npc_returned_post:*']({ npcId: 'ann' });
    assert.equal(a.screenLocked, false);
});
