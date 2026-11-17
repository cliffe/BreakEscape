// An 'avoid' park ends soon after the avoided NPC leaves (re-checked about once a needs-clock
// second), keeps the timer as its ceiling, and leaves other parks alone.
// Run with: bin/test-js test/js/npc-avoid-park-wake.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, AVOID_RECHECK_MS, NEEDS_DEFER_MIN } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const T = 32;
const coffee = (initial = 90) => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial } });
const machineA = { id: 'a_coffee', x: 300, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10 } };

function office(sanjayExtra = {}) {
    const mk = (id, pos, rec) => [id, { pos, rec: { id, needsHome: { room: 'office', x: pos.x / T, y: pos.y / T }, ...rec } }];
    const cfg = { npcs: Object.fromEntries([
        mk('marek', { x: 300, y: 150 }, {}),
        mk('sanjay', { x: 100, y: 500 }, { needs: coffee(), needsCompany: { avoids: ['marek'] }, ...sanjayExtra })
    ]), objects: [machineA], arrive: true };
    const w = makeWorld(cfg);
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    return { w, sys, evs, ticks };
}
const perSec = 1000 / NEEDS_TICK_MS;

test('the avoided NPC leaves: the avoid park ends within a second, reason avoid_cleared', () => {
    const o = office();
    o.sys.control('sanjay', { set: { caffeine: 10 } });
    o.ticks(1);
    assert.deepEqual(o.sys.getState('sanjay').parked.map(p => p.reason), ['avoid']);
    o.ticks(8 * perSec);
    assert.equal(o.sys.getState('sanjay').parked.length, 1, 'still parked while marek stands by the machine');
    o.w.pos.marek.x = 900; o.w.pos.marek.y = 500;
    o.ticks(Math.ceil(AVOID_RECHECK_MS / NEEDS_TICK_MS) + 1);
    assert.equal(o.sys.getState('sanjay').parked.length, 0);
    assert.deepEqual(o.evs('unparked').map(e => [e.npc, e.need, e.reason]), [['sanjay', 'caffeine', 'avoid_cleared']]);
    o.ticks(2);
    assert.ok(o.sys.getState('sanjay').job, 'it goes for the coffee');
});

test('the avoided NPC stays: the park holds until its timer', () => {
    const o = office();
    o.sys.control('sanjay', { set: { caffeine: 10 } });
    o.ticks(1);
    const ms = o.sys.getState('sanjay').parked[0].remainingMs;
    o.ticks(Math.floor(ms / NEEDS_TICK_MS) - 4);
    assert.equal(o.sys.getState('sanjay').parked.length, 1, 'held to just before the timer');
    assert.equal(o.evs('unparked').length, 0);
    o.ticks(8);
    assert.deepEqual(o.evs('unparked').map(e => e.reason), ['timer']);
    assert.ok(ms <= NEEDS_DEFER_MIN * 60000 && ms > NEEDS_DEFER_MIN * 60000 - 2 * NEEDS_TICK_MS, 'default ceiling');
});

test('the re-check is throttled to once per second, not every tick', () => {
    const o = office();
    o.sys.control('sanjay', { set: { caffeine: 10 } });
    o.ticks(1);
    let calls = 0;
    const orig = o.sys._avoidedAt.bind(o.sys);
    o.sys._avoidedAt = (...a) => { calls++; return orig(...a); };
    o.ticks(10 * perSec);
    assert.ok(calls >= 9 && calls <= 11, `calls in 10 s: ${calls}`);
});

test('a non-avoid park (no_source) is not woken by the re-check', () => {
    const o = office({ needsCompany: {} });
    o.w.world.getObject = id => (id === 'a_coffee' ? null : null);
    const s = o.sys.states.get('sanjay');
    o.sys._park(s, 'caffeine', { reason: 'no_source', targetId: 'a_coffee' });
    o.ticks(30 * perSec);
    assert.deepEqual(o.sys.getState('sanjay').parked.map(p => p.reason), ['no_source']);
    assert.equal(o.evs('unparked').length, 0);
});
