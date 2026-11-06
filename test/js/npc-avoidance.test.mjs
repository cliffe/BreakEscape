// Office life slice 14 (OFFICE_LIFE_PLAN 10): avoidance at a distance, balking and parked needs.
// Unacceptable targets (an avoided NPC using the object, queued for it or within avoidRadius, both
// ways; maxQueue), the once-per-episode re-check while committed, the fallback chain, parking
// (level held, decay and the unmet clock paused, retried on the timer and, staggered, on a room
// load or a door opening), no_source parking, deferrable: false, grumbles, and the sims day.
// Run with: bin/test-js test/js/npc-avoidance.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, PICTURE_CHATTER, AVOID_BUBBLE_MS, NEEDS_DEFER_MIN, WAKE_BASE_MS, WAKE_STEP_MS
} from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { runSimsDay } from './fixtures/needs-sims-world.mjs';

const T = 32;
const coffee = (initial = 90, extra = {}) => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial, ...extra } });
// Approach cell of a stub object is one tile below it: machine A at (300,100) -> (300,132)
const machineA = (extra = {}) => ({ id: 'a_coffee', x: 300, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, ...extra } });
const machineB = (extra = {}) => ({ id: 'b_coffee', x: 900, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, ...extra } });
const farQueue = { cells: [{ dx: -6, dy: 0 }, { dx: -7, dy: 0 }] };   // queue cells 192+ px from the approach cell

/** NPCs by id: { pos, rec } (rec without id). Homes far down the room, so going home moves. */
function office(npcs, { objects = [machineA()], arrive = true, seed = 3, hears = null, chatter, roomIds = null } = {}) {
    const cfg = { npcs: {}, objects };
    for (const [id, n] of Object.entries(npcs)) {
        const pos = n.pos || { x: 100, y: 500 };
        cfg.npcs[id] = { pos, rec: { id, needsHome: { room: 'office', x: pos.x / T, y: pos.y / T }, ...n.rec } };
    }
    const w = makeWorld({ ...cfg, arrive });
    w.world.globalHolds = cond => requiredGlobalsHold(cond, {});
    w.world.playerHears = hears || (() => ({ overheard: false, distance: null }));
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    if (roomIds) w.world.roomIds = () => roomIds();
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const want = (id, level = 10) => sys.control(id, { set: { caffeine: level } });
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    const arriveNow = (id) => { const d = sys.states.get(id).job.dest; w.pos[id].x = d.x; w.pos[id].y = d.y; sys.onArrived(id, 'needs'); };
    return { w, sys, evs, emitted, want, ticks, arriveNow };
}

const avoider = (extra = {}) => ({ needs: coffee(), needsCompany: { avoids: ['marek'], ...extra } });

// ── unacceptable targets ─────────────────────────────────────────────────

test('an avoided NPC using the object makes it unacceptable: the need parks with reason avoid', () => {
    const o = office({ marek: { rec: { needs: coffee(10) } }, sanjay: { rec: avoider() } });
    o.ticks(2);
    assert.equal(o.sys.getState('marek').job.phase, 'using');
    o.want('sanjay');
    o.ticks(1);
    const st = o.sys.getState('sanjay');
    assert.equal(st.job, null);
    assert.deepEqual(st.parked.map(p => [p.need, p.reason]), [['caffeine', 'avoid']]);
    const ev = o.emitted('npc_need_parked:sanjay');
    assert.equal(ev.length, 1);
    assert.deepEqual([ev[0].data.need, ev[0].data.reason, ev[0].data.avoidedId, ev[0].data.targetId], ['caffeine', 'avoid', 'marek', 'a_coffee']);
    assert.equal(ev[0].data.untilMs, NEEDS_DEFER_MIN * 60000);
    assert.deepEqual(o.evs('parked').map(e => [e.npc, e.need, e.reason, e.avoided, e.target]), [['sanjay', 'caffeine', 'avoid', 'marek', 'a_coffee']]);
});

test('both ways: the one at the object avoids the newcomer (the newcomer opts in with avoidRadius)', () => {
    const o = office({ marek: { rec: { needs: coffee(10), needsCompany: { avoids: ['sanjay'], avoidRadius: 0 } } }, sanjay: { rec: { needs: coffee(), needsCompany: { avoidRadius: 2 } } } });
    o.ticks(2);
    o.want('sanjay');
    o.ticks(1);
    assert.deepEqual(o.sys.getState('sanjay').parked.map(p => p.reason), ['avoid']);
    // Without opting in (no avoids, no avoidRadius) the newcomer keeps slice 8's rule: it waits
    const p = office({ marek: { rec: { needs: coffee(10), needsCompany: { avoids: ['sanjay'], avoidRadius: 0 } } }, sanjay: { rec: { needs: coffee() } } });
    p.ticks(2);
    p.want('sanjay');
    p.ticks(4);
    assert.deepEqual(p.sys.getState('sanjay').parked, []);
    assert.equal(p.evs('parked').length, 0);
});

test('an avoided NPC holding a place in the queue makes it unacceptable, even standing far off', () => {
    const o = office({
        ann: { rec: { needs: coffee(10) } }, marek: { rec: { needs: coffee(12) } }, sanjay: { rec: avoider() }
    }, { objects: [machineA({ queue: farQueue })] });
    o.ticks(2);
    assert.equal(o.sys.getState('ann').job.phase, 'using');
    assert.equal(o.sys.getState('marek').job.phase, 'queued');
    o.want('sanjay');
    o.ticks(1);
    assert.equal(o.sys.getState('sanjay').job, null, 'no place in the line behind marek');
    assert.deepEqual(o.evs('parked').map(e => [e.npc, e.reason, e.avoided]), [['sanjay', 'avoid', 'marek']]);
});

test('an avoided NPC standing within avoidRadius tiles of the approach cell (any NPC, needs or not), and not beyond', () => {
    for (const [y, parked] of [[132 + 2 * T, true], [132 + 2 * T + 8, false]]) {
        const o = office({ marek: { pos: { x: 300, y }, rec: {} }, sanjay: { rec: avoider() } });
        o.want('sanjay');
        o.ticks(1);
        assert.equal(o.evs('parked').length, parked ? 1 : 0, `marek at y ${y}`);
        assert.equal(!!o.sys.getState('sanjay').job, !parked);
    }
    // In another room: does not count
    const o = office({ marek: { pos: { x: 300, y: 150 }, rec: {} }, sanjay: { rec: avoider() } });
    o.w.pos.marek.roomId = 'kitchen';
    o.want('sanjay');
    o.ticks(1);
    assert.equal(o.evs('parked').length, 0);
});

test('avoidRadius 0 restores slice 8: nobody turns back for a neighbour, and the newcomer waits at a busy machine', () => {
    const o = office({ marek: { pos: { x: 300, y: 150 }, rec: { needs: coffee(10) } }, sanjay: { rec: avoider({ avoidRadius: 0 }) } });
    o.ticks(2);
    o.want('sanjay');
    o.ticks(8);
    assert.equal(o.evs('parked').length, 0);
    assert.equal(o.evs('turned_back').length, 0);
    assert.equal(o.sys.getState('sanjay').job, null, 'waits for the machine, as in slice 8');
    o.ticks(100);
    assert.ok(o.evs('used').some(e => e.npc === 'sanjay'), 'and uses it once marek is done');
});

test('the NPC\'s own post object is exempt: a colleague beside the desk does not stop the work', () => {
    const pc = { id: 'sanjay_pc', x: 100, y: 400, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } };
    const o = office({
        marek: { pos: { x: 110, y: 440 }, rec: {} },
        sanjay: { pos: { x: 100, y: 432 }, rec: { needs: { work: { decayPerMin: 1, urgentAt: 50, initial: 20 } }, needsHome: 'sanjay_pc', needsCompany: { avoids: ['marek'] } } }
    }, { objects: [pc] });
    o.ticks(3);
    assert.equal(o.evs('parked').length, 0);
    assert.equal(o.sys.getState('sanjay').job?.targetId, 'sanjay_pc');
});

// ── fallback chain and give up ───────────────────────────────────────────

test('fallback: the next acceptable source is taken when the nearest is unacceptable', () => {
    const o = office({ marek: { rec: { needs: coffee(10) } }, sanjay: { rec: avoider() } }, { objects: [machineA(), machineB()] });
    o.ticks(2);
    o.want('sanjay');
    o.ticks(1);
    assert.equal(o.sys.getState('sanjay').job.targetId, 'b_coffee');
    assert.equal(o.evs('parked').length, 0);
});

test('turning back on the way: turned_back, npc_turned_back, the grumble, then the next source', () => {
    const o = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: avoider() } },
        { objects: [machineA(), machineB()], arrive: false });
    o.want('sanjay');
    o.ticks(1);
    assert.equal(o.sys.getState('sanjay').job.targetId, 'a_coffee');
    o.ticks(3);
    assert.equal(o.evs('turned_back').length, 0, 'nothing changed: no turn-back');
    o.w.pos.marek = { x: 310, y: 150, roomId: 'office' };   // marek wanders over to machine A
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.need, e.target, e.reason, e.avoided]), [['sanjay', 'caffeine', 'a_coffee', 'avoid', 'marek']]);
    const ev = o.emitted('npc_turned_back:sanjay');
    assert.deepEqual([ev.length, ev[0].data.need, ev[0].data.targetId, ev[0].data.reason, ev[0].data.avoidedId], [1, 'caffeine', 'a_coffee', 'avoid', 'marek']);
    const st = o.sys.getState('sanjay');
    assert.equal(st.job.targetId, 'b_coffee', 'fallback to the far machine');
    assert.equal(st.avoiding, 'marek', 'face bubble after turning back');
    // No grumble pool in this office: slice 15's picture chat (the engine has no spoken lines)
    assert.equal(st.talking.line, null);
    assert.ok(PICTURE_CHATTER.grumble.includes(st.talking.picture));
    assert.equal(st.talking.topic, 'grumble');
    assert.equal(st.talking.partnerId, null);
    o.ticks(Math.ceil(st.talking.remainingMs / NEEDS_TICK_MS) + 1);
    assert.equal(o.sys.getState('sanjay').talking, null, 'the grumble is over');
    assert.equal(o.sys.getState('sanjay').avoiding, 'marek', 'the face shows after the line');
    o.ticks(AVOID_BUBBLE_MS / NEEDS_TICK_MS);
    assert.equal(o.sys.getState('sanjay').avoiding, null, 'and goes AVOID_BUBBLE_MS later');
    assert.equal(o.evs('parked').length, 0);
});

test('turning back with no other source parks the need: no_source (the one turned from is not retried at once)', () => {
    const o = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: avoider() } }, { arrive: false });
    o.want('sanjay');
    o.ticks(1);
    o.w.pos.marek = { x: 300, y: 140, roomId: 'office' };
    o.ticks(1);
    assert.equal(o.evs('turned_back').length, 1);
    assert.deepEqual(o.evs('parked').map(e => [e.need, e.reason]), [['caffeine', 'no_source']]);
    assert.equal(o.sys.getState('sanjay').mode, 'returning');
});

test('no source at all parks the need for every needs NPC (no needsCompany needed)', () => {
    const o = office({ tom: { rec: { needs: { hunger: { decayPerMin: 1, urgentAt: 50, initial: 20 } } } } });
    o.ticks(1);
    assert.deepEqual(o.sys.getState('tom').parked.map(p => [p.need, p.reason]), [['hunger', 'no_source']]);
    assert.equal(o.emitted('npc_need_parked:tom').length, 1);
    // A busy machine is not "no source": the NPC waits as before
    const b = office({ ann: { rec: { needs: coffee(10) } }, bob: { rec: { needs: coffee(12) } } });
    b.ticks(4);
    assert.equal(b.evs('parked').length, 0);
});

// ── parked: held, paused, no starvation, retried ─────────────────────────

test('a parked need holds at urgentAt + 1, decay and the unmet clock paused; retried when the timer runs out', () => {
    const o = office({ tom: { rec: { needs: { hunger: { decayPerMin: 10, urgentAt: 40, initial: 20, maxUnmetMin: 2 } }, needsDeferMin: 3 } } });
    o.ticks(1);
    assert.equal(o.sys.getState('tom').levels.hunger, 41);
    o.ticks(2 * 240 + 200);   // past maxUnmetMin while parked
    assert.equal(o.sys.getState('tom').levels.hunger, 41, 'held');
    assert.equal(o.evs('job_start').length, 0, 'never starved, so never rushed');
    assert.equal(o.evs('unparked').length, 0);
    o.ticks(3 * 240 - 2 * 240 - 200 + 1);
    assert.deepEqual(o.evs('unparked').map(e => [e.need, e.reason]), [['hunger', 'timer']]);
    assert.equal(o.evs('parked').length, 2, 'still nothing: parked again');
    // The unmet clock was paused: 3 min parked does not count towards maxUnmetMin
    assert.ok(o.sys.states.get('tom').lastSatisfiedAt.hunger >= 3 * 60000 - NEEDS_TICK_MS);
});

test('a room load retries parked needs at once, staggered one NPC at a time (not all on one tick)', () => {
    let rooms = ['office'];
    const o = office({ ann: { rec: { needs: coffee(10) } }, bob: { rec: { needs: coffee(10) } }, cat: { rec: { needs: coffee(10) } } },
        { objects: [{ ...machineA(), id: 'k_coffee', roomId: null }], roomIds: () => rooms });
    o.ticks(2);
    assert.equal(o.evs('parked').length, 3);
    const at = o.sys.tickCount;
    o.w.objs.find(x => x.id === 'k_coffee').roomId = 'kitchen';   // the world's copy
    rooms = ['office', 'kitchen'];
    o.ticks(20);
    const un = o.evs('unparked');
    assert.deepEqual(un.map(e => [e.npc, e.reason]), [['ann', 'woken'], ['bob', 'woken'], ['cat', 'woken']]);
    const base = WAKE_BASE_MS / NEEDS_TICK_MS, step = WAKE_STEP_MS / NEEDS_TICK_MS;
    assert.deepEqual(un.map(e => e.t - at), [base + 1, base + step + 1, base + 2 * step + 1]);
    assert.equal(new Set(un.map(e => e.t)).size, 3, 'three different ticks');
    assert.equal(o.evs('job_start')[0].npc, 'ann');
});

test('a door opening retries parked needs the same way', () => {
    const o = office({ tom: { rec: { needs: { hunger: { decayPerMin: 1, urgentAt: 40, initial: 20 } } } } });
    o.ticks(1);
    o.sys.onDoorOpened({ roomId: 'office', connectedRoom: 'kitchen' });
    o.ticks(WAKE_BASE_MS / NEEDS_TICK_MS);
    assert.deepEqual(o.evs('unparked').map(e => e.reason), ['woken']);
});

test('a mapping that sets a parked need unparks it first (found live, game 689)', () => {
    const o = office({ tom: { rec: { needs: { hunger: { decayPerMin: 1, urgentAt: 40, initial: 20 } } } } });
    o.ticks(1);
    o.sys.control('tom', { set: { hunger: 10 } });
    assert.deepEqual(o.sys.getState('tom').parked, []);
    assert.deepEqual(o.evs('unparked').map(e => e.reason), ['set']);
    assert.equal(o.sys.getState('tom').levels.hunger, 10);
    o.ticks(1);
    assert.equal(o.evs('parked').length, 2, 'still no source: parked again on the next select');
});

// ── hysteresis ────────────────────────────────────────────────────────────

test('once per episode: an avoided NPC arriving, leaving and arriving again turns the NPC back once', () => {
    const run = () => {
        const o = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: avoider() } }, { arrive: false });
        o.want('sanjay');
        o.ticks(1);
        o.w.pos.marek = { x: 300, y: 140, roomId: 'office' };   // arrives
        o.ticks(1);
        o.w.pos.marek = { x: 600, y: 500, roomId: 'office' };   // leaves
        o.sys.onDoorOpened();
        o.ticks(WAKE_BASE_MS / NEEDS_TICK_MS + 1);
        assert.equal(o.sys.getState('sanjay').job?.targetId, 'a_coffee', 'retried, marek gone');
        o.w.pos.marek = { x: 300, y: 140, roomId: 'office' };   // arrives again
        o.ticks(2);
        return o;
    };
    const o = run();
    assert.equal(o.evs('turned_back').length, 1);
    assert.equal(o.sys.getState('sanjay').job?.targetId, 'a_coffee', 'goes anyway the second time');
    assert.equal(o.sys.getState('sanjay').avoiding, 'marek', 'with the face bubble');
    o.arriveNow('sanjay');
    o.ticks(1 + 10 * 4 + 1);
    assert.ok(o.evs('used').some(e => e.npc === 'sanjay'));
    assert.equal(o.sys.states.get('sanjay').mindChanged.caffeine, false, 'reset once the need is met');
});

// ── deferrable: false ─────────────────────────────────────────────────────

test('deferrable: false goes anyway (queues behind someone avoided) and shows the bubble; never parks for avoid', () => {
    const o = office({
        marek: { rec: { needs: coffee(10) } },
        sanjay: { rec: { needs: coffee(90, { deferrable: false }), needsCompany: { avoids: ['marek'] } } }
    }, { objects: [machineA({ queue: farQueue })] });
    o.ticks(2);
    o.want('sanjay');
    o.ticks(1);
    const st = o.sys.getState('sanjay');
    assert.equal(st.job.phase, 'queued');
    assert.equal(st.avoiding, 'marek');
    assert.equal(o.evs('parked').length, 0);
    // On the way: an avoided arrival does not turn it back
    const p = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: { needs: coffee(90, { deferrable: false }), needsCompany: { avoids: ['marek'] } } } }, { arrive: false });
    p.want('sanjay');
    p.ticks(1);
    p.w.pos.marek = { x: 300, y: 140, roomId: 'office' };
    p.ticks(2);
    assert.equal(p.evs('turned_back').length, 0);
    assert.equal(p.sys.getState('sanjay').avoiding, 'marek');
    // ...but with no source it still parks
    const q = office({ sanjay: { rec: { needs: { rounds: { decayPerMin: 1, urgentAt: 40, initial: 10, deferrable: false } } } } });
    q.ticks(1);
    assert.deepEqual(q.evs('parked').map(e => e.reason), ['no_source']);
});

// ── balking ───────────────────────────────────────────────────────────────

test('maxQueue: refuses a line already that long (parks with reason queue); unset joins any line', () => {
    const cast = (maxQueue) => ({ ann: { rec: { needs: coffee(10) } }, bob: { rec: { needs: coffee(12) } }, sanjay: { rec: { needs: coffee(), ...(maxQueue === undefined ? {} : { maxQueue }) } } });
    for (const [m, queued] of [[1, false], [2, true], [undefined, true], [0, false]]) {
        const o = office(cast(m), { objects: [machineA({ queue: { cells: [{ dx: -1, dy: 1 }, { dx: -2, dy: 1 }] } })] });
        o.ticks(2);
        assert.equal(o.sys.getState('bob').job.phase, 'queued');
        o.want('sanjay');
        o.ticks(1);
        assert.equal(o.sys.getState('sanjay').job?.phase === 'queued', queued, `maxQueue ${m}`);
        assert.deepEqual(o.evs('parked').map(e => e.reason), queued ? [] : ['queue'], `maxQueue ${m}`);
    }
});

// ── grumble ───────────────────────────────────────────────────────────────

test('the grumble is overheard like a chat line (npc_overheard, no npc_chatted); a scenario pool replaces the built-in one', () => {
    const turn = (opts) => {
        const o = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: avoider() } }, { arrive: false, ...opts });
        o.want('sanjay');
        o.ticks(1);
        o.w.pos.marek = { x: 300, y: 140, roomId: 'office' };
        o.ticks(1);
        return o;
    };
    const heard = turn({ hears: () => ({ overheard: true, distance: 70 }) });
    const ov = heard.emitted('npc_overheard:sanjay');
    assert.equal(ov.length, 1);
    assert.equal(ov[0].data.topic, 'grumble');
    assert.equal(ov[0].data.partnerId, null);
    assert.equal(ov[0].data.playerDistance, 70);
    assert.equal(ov[0].data.line, null);
    assert.ok(PICTURE_CHATTER.grumble.includes(ov[0].data.picture));
    assert.equal(heard.emitted('npc_chatted').length, 0);
    const own = turn({ chatter: { grumble: ['Not with him there.'] } });
    assert.equal(own.sys.getState('sanjay').talking.line, 'Not with him there.');
    assert.equal(own.emitted('npc_overheard').length, 0, 'not heard: no event');
    const off = turn({ chatter: false });
    assert.equal(off.sys.getState('sanjay').talking, null, 'chatter false: no built-in grumble');
});

// ── determinism and the sims day ─────────────────────────────────────────

test('deterministic for a seed, with Math.random throwing', () => {
    const run = () => {
        const real = Math.random;
        Math.random = () => { throw new Error('Math.random used'); };
        try {
            const o = office({
                marek: { pos: { x: 600, y: 500 }, rec: { needs: coffee(30) } },
                sanjay: { rec: avoider() }, tom: { rec: { needs: { hunger: { decayPerMin: 5, urgentAt: 40, initial: 45 } }, maxQueue: 0 } }
            }, { objects: [machineA({ queue: farQueue }), machineB()], arrive: false, hears: () => ({ overheard: true, distance: 40 }) });
            o.want('sanjay');
            for (let i = 0; i < 400; i++) {
                o.sys.tick();
                for (const id of ['marek', 'sanjay']) if (o.sys.states.get(id).job?.dest && i % 7 === 0) o.arriveNow(id);
                if (i === 150) o.sys.onDoorOpened();
            }
            return { log: JSON.stringify(o.sys.getLog()), emits: JSON.stringify(o.w.calls.emits) };
        } finally { Math.random = real; }
    };
    const a = run(), b = run();
    assert.equal(a.log, b.log);
    assert.equal(a.emits, b.emits);
    assert.ok(a.log.includes('"turned_back"') || a.log.includes('"parked"'));
});

// sha256 of the 15-minute sims-day log, as in npc-needs-slots.test.mjs and npc-left-behind.test.mjs
const GOLDEN_SIMS_DAY = '6a5f41a62178d8e4ca1e11d53c27a6d9d3cbc08c25ae110f01b88d289aae98f2';

test('the sims day (nobody avoids anyone, nothing parks) is byte-identical to before slice 14', () => {
    const { sys } = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    const log = sys.getLog();
    assert.equal(log.filter(e => ['parked', 'unparked', 'turned_back'].includes(e.ev)).length, 0);
    assert.equal(createHash('sha256').update(JSON.stringify(log)).digest('hex'), GOLDEN_SIMS_DAY);
});

// ── validator ─────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
test('validator: deferrable, maxQueue, needsDeferMin, avoidRadius and the grumble pool', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
    const check = scenario => {
        const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
          puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop());
    };
    const npc = (extra) => ({ id: 'sam', needsHome: { room: 'office', x: 2, y: 2 }, needs: { caffeine: { decayPerMin: 1, urgentAt: 40 } }, ...extra });
    const scen = (n, more = {}) => ({ ...more, rooms: { office: { type: 'room_office', objects: [{ id: 'm', type: 'coffee_station1', affordance: { satisfies: 'caffeine', restores: 50 } }], npcs: [n, { id: 'marek', needsHome: { room: 'office', x: 5, y: 5 } }] } } });
    const ok = check(scen(npc({ maxQueue: 1, needsDeferMin: 4, needsCompany: { avoids: ['marek'], avoidRadius: 2 }, needs: { caffeine: { decayPerMin: 1, urgentAt: 40 }, rounds: { decayPerMin: 1, urgentAt: 40, deferrable: false } } })));
    assert.deepEqual(ok.filter(s => /maxQueue|needsDeferMin|avoidRadius|deferrable/.test(s)), []);
    const bad = check(scen(npc({ maxQueue: 1.5, needsDeferMin: 0, needsCompany: { avoids: ['marek'], avoidRadius: -1 }, needs: { caffeine: { decayPerMin: 1, urgentAt: 40, deferrable: 'no' } } })));
    for (const f of ['maxQueue must be a whole number', 'needsDeferMin must be minutes', 'avoidRadius must be a number of tiles', 'deferrable must be true or false']) {
        assert.ok(bad.some(s => s.includes(f)), f);
    }
    const env = check(scen(npc({ needs: { caffeine: { decayPerMin: 1, urgentAt: 40, deferrable: false } } })));
    assert.ok(env.some(s => s.startsWith('⚠️') && s.includes("need 'caffeine' is deferrable: false")));
    const pool = check(scen(npc({}), { chatter: { grumble: ['Not with him there.', 'This line is far, far too long for a bubble.'] } }));
    assert.ok(pool.some(s => s.includes("chatter 'grumble' line") && s.includes('at most 40')));
});
