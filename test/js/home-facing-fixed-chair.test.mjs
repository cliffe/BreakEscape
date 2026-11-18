// m08 office life: a coordinate needsHome may carry `facing`, and a Tiled chair may carry
// `fixed` = true. Run with: node test/js/home-facing-fixed-chair.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { isFixedChair, chairMotion } from '../../public/break_escape/js/systems/desk-footprints.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

globalThis.window = globalThis.window || {};
const { homeFacingPoint, compassToward } = await import('../../public/break_escape/js/systems/seating.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = p => readFileSync(join(root, 'public/break_escape/js', p), 'utf8');

// ---- feature A: needsHome.facing ----
test('homeFacingPoint turns each of the 8 facings back into the same compass name', () => {
    const feet = { x: 200, y: 200 };
    for (const f of ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']) {
        const p = homeFacingPoint(feet, f);
        assert.equal(compassToward(p.x - feet.x, p.y - feet.y), f, f);
    }
    assert.equal(homeFacingPoint(feet, 'upwards'), null);
    assert.equal(homeFacingPoint(feet, undefined), null);
});

function homeOffice(facing) {
    const home = { room: 'office', x: 3, y: 3 };
    if (facing !== undefined) home.facing = facing;
    return {
        npcs: { clerk: { pos: { x: 96, y: 96 }, rec: { id: 'clerk', needsHome: home,
            needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50, jitterPct: 10 } } } } },
        objects: [{ id: 'coffee_machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 40 } }]
    };
}
function runHome(facing) {
    const w = makeWorld(homeOffice(facing));
    const faced = [];
    w.world.faceTo = (id, x, y) => faced.push({ id, x, y });
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(40 * 60000);
    return { sys, faced, w };
}

test('a coordinate needsHome keeps its facing on the resolved home', () => {
    const { sys } = runHome('east');
    assert.equal(sys.states.get('clerk').home.facing, 'east');
});

test('an unknown facing is ignored', () => {
    const { sys } = runHome('sideways');
    assert.equal(sys.states.get('clerk').home.facing, undefined);
});

test('back from a trip, a standing NPC with a home facing turns that way; without one it does not', () => {
    const withFacing = runHome('east');
    assert.ok(withFacing.w.calls.moves.some(m => m.x === 96 && m.y === 96), 'it walked home');
    // faceTo also fires at the coffee machine (300, 300); the home turns are the ones off it
    const homeTurns = r => r.faced.filter(f => f.x !== 300);
    const returns = withFacing.w.calls.moves.filter(m => m.x === 96 && m.y === 96).length;
    // one turn per return, plus the one at spawn when the home first resolves
    assert.ok(returns > 0 && homeTurns(withFacing).length === returns + 1, 'one turn per return and one at spawn');
    for (const f of homeTurns(withFacing)) {
        assert.equal(f.id, 'clerk');
        assert.ok(f.x > 96 && Math.abs(f.y - 96) < 1, 'the point is due east of the home');
    }
    assert.equal(homeTurns(runHome(undefined)).length, 0);
});

test('seating.js turns a coordinate home\'s sitter toward its facing', () => {
    const s = src('systems/seating.js');
    assert.match(s, /facePointFor\(obj, feet\) \|\| \(stop\.post \? homeFacingPoint\(feet, ns\?\.home\?\.facing\) : null\)/);
});

// ---- feature B: fixed chairs ----
test('isFixedChair reads the Tiled property (array or object form); anything else is a loose chair', () => {
    assert.equal(isFixedChair({ properties: [{ name: 'fixed', type: 'bool', value: true }] }), true);
    assert.equal(isFixedChair({ properties: { fixed: true } }), true);
    assert.equal(isFixedChair({ properties: [{ name: 'fixed', type: 'bool', value: false }] }), false);
    assert.equal(isFixedChair({ properties: [{ name: 'other', value: true }] }), false);
    assert.equal(isFixedChair({}), false);
    assert.equal(isFixedChair(null), false);
});

test('chairMotion: loose chairs keep bounce 0.3 and drag 100; fixed ones are immovable', () => {
    assert.deepEqual(chairMotion(false), { immovable: false, bounce: 0.3, drag: 100 });
    assert.deepEqual(chairMotion(undefined), { immovable: false, bounce: 0.3, drag: 100 });
    assert.deepEqual(chairMotion(true), { immovable: true, bounce: 0, drag: 100 });
});

test('rooms.js feeds the Tiled object to isFixedChair and applies chairMotion to the wheeled chair body', () => {
    const r = src('core/rooms.js');
    assert.match(r, /sprite\.fixedChair = isFixedChair\(obj\)/);
    assert.match(r, /const motion = chairMotion\(sprite\.fixedChair\)/);
    assert.match(r, /setBounce\(motion\.bounce, motion\.bounce\)/);
    assert.match(r, /setDrag\(motion\.drag, motion\.drag\)/);
});

test('room_hq_ops marks exactly the two duty officers\' chairs fixed', () => {
    const map = JSON.parse(readFileSync(join(root, 'public/break_escape/assets/rooms/room_hq_ops.json'), 'utf8'));
    const chairs = map.layers.flatMap(l => l.objects || []).filter(o => o.gid && o.x === 86 && (o.y === 233 || o.y === 185));
    assert.equal(chairs.length, 2);
    assert.ok(chairs.every(c => isFixedChair(c)));
    const fixedCount = map.layers.flatMap(l => l.objects || []).filter(o => isFixedChair(o)).length;
    assert.equal(fixedCount, 2);
});
