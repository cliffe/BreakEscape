// _expectedAwayMs (systems/npc-needs.js) follows the route the NPC will actually walk via
// world.routeLength (slice 22 follow-up, 2026-11-07): a trip through a door is measured round the
// wall, not straight through it, so an NPC on a long errand is estimated away for long enough that a
// screen-lock habit (workstation-state lockIfAwayOverSeconds) fires. A world without routeLength (the
// plain stubs, hence GOLDEN_SIMS_DAY) keeps the straight-line lower bound unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';

const TILE = 32;

// Minimal world exposing just what _expectedAwayMs touches. routeLength is optional so a case can
// drop it (straight-line) or make a leg longer / unanswerable.
function world({ routeLength } = {}) {
    const w = {
        npcPos: () => ({ x: 100, y: 100, roomId: 'office' }),
        getObject: id => id === 'copier'
            ? { id, x: 500, y: 100, roomId: 'kitchen', affordance: { useSeconds: 20 } }
            : null,
        approachCell: o => ({ x: o.x, y: o.y + TILE }),
        speedFor: () => 80
    };
    if (routeLength) w.routeLength = routeLength;
    return w;
}

function away(w) {
    const sys = new NPCNeedsSystem(w, { seed: 1 });
    const s = {
        npcId: 'tom',
        home: { x: 100, y: 100, roomId: 'office' },
        job: { kind: 'use', targetId: 'copier', phase: 'goto_target' }
    };
    return sys._expectedAwayMs(s);
}

test('no routeLength: straight-line lower bound (stub worlds, GOLDEN_SIMS_DAY path)', () => {
    const ms = away(world());
    // out ~400 px + back ~400 px at 80 px/s = ~10 s travel, plus 20 s dwell
    assert.ok(ms > 0, 'returns a positive estimate');
    assert.ok(ms >= 29000 && ms <= 31000, `straight-line estimate ${ms} ms`);
});

test('routeLength that returns the straight line: same estimate (same-room trip unchanged-ish)', () => {
    const base = away(world());
    const same = away(world({ routeLength: (a, b) => Math.hypot(b.x - a.x, b.y - a.y) }));
    assert.equal(same, base, `${same} vs ${base}`);
});

test('routeLength through a door is clearly longer than the straight line', () => {
    const base = away(world());
    // A door route that doubles each leg's walked distance (round a wall).
    const routed = away(world({ routeLength: (a, b) => 2 * Math.hypot(b.x - a.x, b.y - a.y) }));
    assert.ok(routed > base, `routed ${routed} ms should exceed straight-line ${base} ms`);
    // Travel roughly doubles (~10 s -> ~20 s); the 20 s dwell is unchanged, so the whole estimate
    // grows by about the travel time, not by 2x.
    const travel = base - 20000;
    assert.ok(routed >= base + travel * 0.8, `routed ${routed} should add ~the extra travel to ${base}`);
});

test('routeLength returning null falls back to the straight-line value', () => {
    const base = away(world());
    const fell = away(world({ routeLength: () => null }));
    assert.equal(fell, base, `fallback ${fell} should equal straight-line ${base}`);
});

test('a single unanswerable leg falls back only for that leg', () => {
    const base = away(world());
    let n = 0;
    // First leg (out) routes long; second leg (back) cannot be computed -> straight line.
    const mixed = away(world({ routeLength: (a, b) => (++n === 1 ? 3 * Math.hypot(b.x - a.x, b.y - a.y) : null) }));
    assert.ok(mixed > base, `mixed ${mixed} ms should exceed straight-line ${base} ms`);
});
