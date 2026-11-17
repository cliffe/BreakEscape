// A need that parks `no_source` before a start-room NPC's home resolves (the room's objects are not
// registered yet) retries when the home resolves; a genuine no_source park still holds its timer.
// Run with: bin/test-js test/js/npc-start-room-park-wake.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, NEEDS_DEFER_MIN } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const machine = { id: 'a_coffee', x: 300, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10 } };
const perSec = 1000 / NEEDS_TICK_MS;

function startRoom() {
    const cfg = { npcs: { sanjay: { pos: { x: 100, y: 500 }, rec: {
        id: 'sanjay', needsHome: 'sanjay_desk', needs: { caffeine: { decayPerMin: 1, urgentAt: 50, initial: 90 } } } } },
        objects: [], arrive: true };
    const w = makeWorld(cfg);
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const objs = [];
    w.world.getObject = id => objs.find(o => o.id === id) || null;
    w.world.listObjects = () => objs;
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const register = (withMachine = true) => {
        objs.push({ roomId: 'office', id: 'sanjay_desk', x: 100, y: 500 });
        if (withMachine) objs.push({ roomId: 'office', pickable: true, ...machine });
    };
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    return { sys, evs, ticks, register };
}

test('a no_source park made before home resolves ends when home resolves', () => {
    const o = startRoom();
    o.sys.control('sanjay', { set: { caffeine: 10 } });
    o.ticks(2);
    assert.deepEqual(o.sys.getState('sanjay').parked.map(p => p.reason), ['no_source']);
    assert.equal(o.evs('home_resolved').length, 0);
    o.register();
    o.ticks(8 * perSec);
    assert.equal(o.evs('home_resolved').length, 1);
    assert.deepEqual(o.evs('unparked').map(e => [e.need, e.reason]), [['caffeine', 'woken']]);
    assert.ok(o.sys.getState('sanjay').job, 'it goes for the coffee');
});

test('a genuine no_source park still holds its timer after home resolves', () => {
    const o = startRoom();
    o.sys.control('sanjay', { set: { caffeine: 10 } });
    o.ticks(2);
    o.register(false);   // home resolves, but no machine exists
    o.ticks(40 * perSec);
    assert.equal(o.evs('home_resolved').length, 1);
    const parked = o.sys.getState('sanjay').parked;
    assert.deepEqual(parked.map(p => p.reason), ['no_source']);
    assert.ok(parked[0].remainingMs > (NEEDS_DEFER_MIN - 1) * 60000, `holds: ${parked[0].remainingMs}`);
});
