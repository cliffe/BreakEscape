// Reload with a need already urgent (CA0 wave 2 gate D): a reload registers the needs NPCs and
// evaluates their needs before the room's objects register. A need whose initial is at or below
// urgentAt then finds no source on the first ticks and parks `no_source` for the full defer
// (needsDeferMin, 4 minutes), and a coordinate needsHome is never provisional, so the
// home_resolved wake does not cover it. A no_source park now re-checks for sources that
// registered after it parked and retries soon.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, NEEDS_DEFER_MIN } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

// Yusuf's shape: coordinate home, thirst initial 45 under urgentAt 50, a water cooler source
function cfg() {
    return {
        npcs: {
            yusuf: {
                pos: { x: 96, y: 224 },
                rec: {
                    id: 'yusuf', needsHome: { room: 'office', x: 3, y: 7 },
                    needs: { thirst: { decayPerMin: 1, urgentAt: 50, initial: 45, jitterPct: 0 } }
                }
            }
        },
        objects: [
            // roomId null: listed by nothing yet (the reload order: needs first, room objects after)
            { id: 'water_cooler', roomId: null, x: 300, y: 180, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 20 } },
            { id: 'plant', roomId: null, x: 200, y: 180, affordance: { satisfies: 'calm', restores: 10, useSeconds: 5 } }
        ]
    };
}

function boot(c = cfg()) {
    const w = makeWorld(c);
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    return { w, sys };
}

const ev = (sys, name) => sys.getLog().filter(e => e.npc === 'yusuf' && e.ev === name);
const register = (w, id) => { w.objs.find(o => o.id === id).roomId = 'office'; };

test('reload with an urgent need: a source that registers after the park wakes it within seconds', () => {
    const { w, sys } = boot();
    sys.step(4 * NEEDS_TICK_MS);
    const parked = ev(sys, 'parked');
    assert.equal(parked.length, 1, 'parks on the first ticks, as on a reload');
    assert.equal(parked[0].reason, 'no_source');
    const remaining = sys.getState('yusuf').parked.find(p => p.need === 'thirst').remainingMs;
    assert.ok(remaining > (NEEDS_DEFER_MIN - 0.5) * 60000, `the full defer: ${remaining}`);

    register(w, 'water_cooler');
    sys.step(3000);
    const woke = ev(sys, 'source_appeared');
    assert.equal(woke.length, 1);
    assert.deepEqual([woke[0].need, woke[0].target], ['thirst', 'water_cooler']);
    assert.equal(ev(sys, 'unparked').length, 1);
    const job = ev(sys, 'job_start');
    assert.equal(job.length, 1, 'goes for a drink at once, not after 4 minutes');
    assert.equal(job[0].target, 'water_cooler');
    sys.step(60000);
    assert.ok(ev(sys, 'used').some(e => e.target === 'water_cooler'), JSON.stringify(sys.getLog().filter(e => e.npc === 'yusuf').map(e => e.ev)));
});

test('an object that satisfies some other need does not wake the park', () => {
    const { w, sys } = boot();
    sys.step(4 * NEEDS_TICK_MS);
    register(w, 'plant');
    sys.step(10000);
    assert.equal(ev(sys, 'source_appeared').length, 0);
    assert.equal(ev(sys, 'unparked').length, 0);
    assert.equal(ev(sys, 'parked').length, 1);
});

test('a genuine no_source stays parked for the full defer and is not woken twice', () => {
    const c = cfg();
    c.objects = c.objects.filter(o => o.id !== 'water_cooler');
    const { sys } = boot(c);
    sys.step(NEEDS_DEFER_MIN * 60000 - 2000);
    assert.equal(ev(sys, 'parked').length, 1);
    assert.equal(ev(sys, 'unparked').length, 0, 'no early wake without a new source');
    sys.step(4000);
    const un = ev(sys, 'unparked');
    assert.equal(un.length, 1);
    assert.equal(un[0].reason, 'timer');
});

test('no extra object scans while nothing is parked no_source', () => {
    const c = cfg();
    for (const o of c.objects) o.roomId = 'office';
    c.npcs.yusuf.rec.needs.thirst.initial = 100;
    const { w, sys } = boot(c);
    let scans = 0;
    const list = w.world.listObjects;
    w.world.listObjects = () => { scans++; return list(); };
    sys.step(20 * NEEDS_TICK_MS);
    assert.equal(scans, 0, 'thirst is not urgent and nothing is parked: no scan');
});

test('two NPCs woken by one new source go one after another, as a room load wakes them', () => {
    const c = cfg();
    c.npcs.zara = { pos: { x: 160, y: 224 }, rec: { id: 'zara', needsHome: { room: 'office', x: 5, y: 7 }, needs: { thirst: { decayPerMin: 1, urgentAt: 50, initial: 40, jitterPct: 0 } } } };
    const { w, sys } = boot(c);
    sys.step(4 * NEEDS_TICK_MS);
    register(w, 'water_cooler');
    sys.step(4000);
    const un = sys.getLog().filter(e => e.ev === 'unparked');
    assert.deepEqual(un.map(e => e.npc), ['yusuf', 'zara']);
    assert.equal(new Set(un.map(e => e.t)).size, 2, 'two different ticks');
});
