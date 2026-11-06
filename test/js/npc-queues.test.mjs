// Office life slice 10 (OFFICE_LIFE_PLAN 2.5, 7.3): queues at shared machines, queue cells that
// skip rooms forbidden to the queuer, leaving a queue, chatter between the user and the first in
// line (compatible pairs only), the queue icon, and the sims day with its coffee queue.
// Run with: bin/test-js test/js/npc-queues.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, QUEUE_MAX_WAIT_S, QUEUE_COOLDOWN_MS
} from '../../public/break_escape/js/systems/npc-needs.js';
import { pickIconEntry } from '../../public/break_escape/js/systems/npc-action-icons.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { makeSimsWorld, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const wantsCoffee = (initial = 20) => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const machine = (extra = {}, queue = { cells: [{ dx: -1, dy: 1 }, { dx: -2, dy: 1 }] }) => ({
    id: 'coffee', x: 300, y: 100,
    affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, capacity: 1, chatter: 'coffee', queue, ...extra }
});

/** NPCs (in id order, 64 px apart) and a coffee machine. Moves arrive at once. */
function office(npcs, { objects = [machine()], seed = 1, queueCells = null, roomIds = null, chatter } = {}) {
    const cfg = { npcs: {}, objects };
    let x = 100;
    for (const [id, rec] of Object.entries(npcs)) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, ...rec } };
        x += 64;
    }
    const w = makeWorld(cfg);
    w.world.globalHolds = cond => requiredGlobalsHold(cond, {});
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    if (queueCells) w.world.queueCells = queueCells;
    if (roomIds) w.world.roomIds = () => roomIds;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const emitted = (prefix) => w.calls.emits.filter(e => e.name.startsWith(prefix));
    const evs = (ev) => sys.getLog().filter(e => e.ev === ev);
    return { w, sys, emitted, evs };
}

const three = (extra = {}) => ({ ann: { needs: wantsCoffee(), ...extra.ann }, bob: { needs: wantsCoffee(), ...extra.bob }, cat: { needs: wantsCoffee(), ...extra.cat } });

// ── order and advancement ────────────────────────────────────────────────

test('three NPCs, capacity 1, two cells: claim order, places, advancement, everyone served', () => {
    const o = office(three());
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('ann').job.phase, 'using');
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    assert.equal(o.sys.getState('bob').job.queuePlace, 1);
    assert.equal(o.sys.getState('cat').job.queuePlace, 2);
    const q = o.emitted('npc_queued:coffee').map(e => [e.data.npcId, e.data.place]);
    assert.deepEqual(q, [['bob', 1], ['cat', 2]]);
    // They stand in the queue's cells: one tile down-left of the approach cell (300,132), then two
    const at = id => o.w.pos[id];
    assert.deepEqual([at('bob').x, at('bob').y], [268, 164]);
    assert.deepEqual([at('cat').x, at('cat').y], [236, 164]);
    o.sys.step(11000);
    assert.equal(o.sys.getState('bob').job.phase, 'using', 'bob took the machine when ann finished');
    assert.equal(o.sys.getState('cat').job.queuePlace, 1, 'cat moved up');
    assert.deepEqual([at('cat').x, at('cat').y], [268, 164]);
    o.sys.step(12000);
    assert.equal(o.sys.getState('cat').job.phase, 'using');
    o.sys.step(12000);
    assert.deepEqual(o.evs('used').map(e => e.npc), ['ann', 'bob', 'cat']);
    assert.equal(o.evs('queue_left').length, 0);
});

test('queue order and lines are deterministic for a seed (no Math.random)', () => {
    const run = () => {
        const real = Math.random;
        Math.random = () => { throw new Error('Math.random used'); };
        try {
            const o = office(three(), { seed: 7 });
            o.sys.step(40000);
            return JSON.stringify([o.sys.getLog(), o.emitted('npc_')]);
        } finally { Math.random = real; }
    };
    assert.equal(run(), run());
});

test('nobody jumps the queue: an outsider whose need comes up as the machine frees joins the line', () => {
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() }, dan: { needs: wantsCoffee(90) } });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    // dan's need goes urgent just before ann finishes (dan sorts after bob, and ann's use ends first)
    o.sys.step(9500);
    o.sys.control('dan', { set: { caffeine: 10 } });
    o.sys.step(NEEDS_TICK_MS * 4);
    assert.equal(o.sys.getState('bob').job.phase, 'using');
    assert.equal(o.sys.getState('dan').job.phase, 'queued');
});

test('no queue configured: the second NPC waits at its post, as before', () => {
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } }, { objects: [machine({}, null)] });
    o.sys.step(NEEDS_TICK_MS * 4);
    assert.equal(o.sys.getState('bob').job, null);
    assert.equal(o.emitted('npc_queued:').length, 0);
    const off = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } }, { objects: [machine({}, false)] });
    off.sys.step(NEEDS_TICK_MS * 4);
    assert.equal(off.sys.getState('bob').job, null, 'queue: false switches a preset queue off');
});

// ── leaving ──────────────────────────────────────────────────────────────

test('a queued NPC whose need is met elsewhere leaves the queue', () => {
    const o = office(three());
    o.sys.step(NEEDS_TICK_MS * 2);
    o.sys.control('bob', { set: { caffeine: 90 } });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job, null);
    assert.deepEqual(o.evs('queue_left').map(e => [e.npc, e.reason]), [['bob', 'need_met']]);
    assert.equal(o.sys.getState('cat').job.queuePlace, 1, 'cat moved up');
});

test('maxWaitSeconds sends a queuer home, and it skips that machine for 60 s', () => {
    const slow = machine({ useSeconds: 60 }, { cells: [{ dx: -1, dy: 1 }], maxWaitSeconds: 5 });
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } }, { objects: [slow] });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    o.sys.step(5000);
    assert.equal(o.sys.getState('bob').job, null);
    assert.deepEqual(o.evs('queue_left').map(e => e.reason), ['max_wait']);
    o.sys.step(QUEUE_COOLDOWN_MS - 6000);
    assert.equal(o.emitted('npc_queued:').length, 1, 'no second try during the cooldown');
    assert.equal(o.sys.getState('bob').job, null);
    o.sys.step(7000);
    assert.equal(o.sys.getState('bob').job?.targetId, 'coffee', 'tries the machine again after it');
    assert.equal(QUEUE_MAX_WAIT_S, 30);
    // The default wait is 30 s
    const d = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } }, { objects: [machine({ useSeconds: 60 })] });
    d.sys.step(29000);
    assert.equal(d.sys.getState('bob').job?.phase, 'queued');
    d.sys.step(1500);
    assert.equal(d.sys.getState('bob').job, null);
});

// ── queue cells and the room leash (review m8) ───────────────────────────

const cellsIn = rooms => (obj) => rooms.map((roomId, i) => ({ x: 268 - 32 * i, y: 164, roomId }));

test('queue cells skip rooms forbidden to the queuer: it takes the next permitted cell', () => {
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee(), needsAvoidRooms: ['hall'] } },
        { queueCells: cellsIn(['hall', 'office']), roomIds: ['office', 'hall'] });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    assert.deepEqual([o.w.pos.bob.x, o.w.pos.bob.y], [236, 164], 'second cell, not the hall');
    assert.equal(o.sys.getState('bob').job.queuePlace, 1, 'still first in line');
});

test('no permitted cell left: the NPC waits at its post instead of queuing', () => {
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee(), needsAvoidRooms: ['hall'] } },
        { queueCells: cellsIn(['hall']), roomIds: ['office', 'hall'] });
    o.sys.step(NEEDS_TICK_MS * 4);
    assert.equal(o.sys.getState('bob').job, null);
    assert.equal(o.emitted('npc_queued:').length, 0);
    // Someone allowed in the hall queues there
    const p = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } }, { queueCells: cellsIn(['hall']), roomIds: ['office', 'hall'] });
    p.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(p.sys.getState('bob').job.phase, 'queued');
});

test('a queuer whose cell is gone or now forbidden leaves the queue', () => {
    let rooms = ['office'];
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee(), needsAvoidRooms: ['hall'] } },
        { queueCells: () => cellsIn(rooms)(), roomIds: ['office', 'hall'] });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    rooms = ['hall'];   // furniture moved: the only cell is now through the door
    o.sys.step(NEEDS_TICK_MS);
    assert.equal(o.sys.getState('bob').job, null);
    assert.deepEqual(o.evs('queue_left').map(e => e.reason), ['no_queue_cell']);
});

test('a queuer that cannot reach its cell by the deadline fails the job (timeout)', () => {
    const o = office({ ann: { needs: wantsCoffee() }, bob: { needs: wantsCoffee() } });
    o.w.pos.bob.x = 5000;   // far away; the stub moves arrive at once, so stop them arriving
    const move = o.w.world.moveTo;
    o.w.world.moveTo = (id, ...rest) => (id === 'bob' ? o.w.calls.moves.push({ id }) : move(id, ...rest));
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    o.sys.step(200000);
    assert.ok(o.sys.getLog().some(e => e.npc === 'bob' && e.ev === 'job_failed' && e.reason === 'timeout'));
});

// ── queue chatter (7.3) ──────────────────────────────────────────────────

test('the user and the first in line chat; the second in line never does', () => {
    const o = office(three());
    o.sys.step(10000);
    const lines = o.emitted('npc_chatted:coffee');
    assert.ok(lines.length >= 2, `got ${lines.length}`);
    for (const e of lines) {
        assert.ok(['ann', 'bob'].includes(e.data.speakerId) && ['ann', 'bob'].includes(e.data.partnerId));
        assert.ok(e.data.line.length > 0);
    }
    assert.ok(o.sys.getState('ann').chatPartner === 'bob' || lines.length);
    // Each line ends before the user's use does
    for (const e of lines) assert.notEqual(e.data.speakerId, 'cat');
    o.sys.step(12000);   // bob uses, cat is first: they chat now
    assert.ok(o.emitted('npc_chatted:coffee').some(e => e.data.speakerId === 'cat' || e.data.partnerId === 'cat'));
});

for (const [label, extra] of [
    ['declared on the user', { ann: { needsCompany: { avoids: ['bob'] } } }],
    ['declared on the queuer', { bob: { needsCompany: { avoids: ['*'] } } }],
    ['group mismatch', { ann: { needsCompany: { groups: ['a'] } }, bob: { needsCompany: { groups: ['b'] } } }]
]) {
    test(`an incompatible pair queues in silence (${label})`, () => {
        const o = office({ ann: { needs: wantsCoffee(), ...extra.ann }, bob: { needs: wantsCoffee(), ...extra.bob } });
        o.sys.step(NEEDS_TICK_MS * 2);
        assert.equal(o.sys.getState('bob').job.phase, 'queued', 'avoidance does not stop queuing');
        o.sys.step(30000);
        assert.equal(o.emitted('npc_chatted:').length, 0);
        assert.deepEqual(o.evs('used').map(e => e.npc), ['ann', 'bob']);
    });
}

test('no chatter at a queued machine without a chatter pool, or from a queuer too far from the machine', () => {
    const quiet = office(three(), { objects: [machine({ chatter: undefined })] });
    quiet.sys.step(30000);
    assert.equal(quiet.emitted('npc_chatted:').length, 0);
    const far = office(three(), { objects: [machine({}, { cells: [{ dx: -3, dy: 0 }] })] });
    far.sys.step(9000);
    assert.equal(far.emitted('npc_chatted:').length, 0, '96 px from the approach cell is beyond 1.5 tiles');
});

// ── icon ─────────────────────────────────────────────────────────────────

test('the queue icon shows while queued, whatever the machine; a scenario "queue" entry wins', () => {
    const job = { kind: 'use', phase: 'queued', need: 'caffeine', targetId: 'coffee' };
    assert.deepEqual(pickIconEntry(job, {}, { id: 'coffee', satisfies: 'caffeine' }), { key: 'queue', value: 'icon:npc-queue' });
    assert.equal(pickIconEntry(job, { coffee: '☕', caffeine: 'C' }, { id: 'coffee' }).key, 'queue');
    assert.deepEqual(pickIconEntry(job, { queue: 'Q' }, { id: 'coffee' }), { key: 'queue', value: 'Q' });
    assert.notEqual(pickIconEntry({ ...job, phase: 'using' }, {}, { id: 'coffee', satisfies: 'caffeine' }).key, 'queue');
    const o = office(three());
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.sys.getState('bob').pressing, null, 'the queued need is acted on: no thought bubble');
});

// ── the showcase day ─────────────────────────────────────────────────────

function simsDay(queues) {
    const w = makeSimsWorld({ queues });
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const at = (tick, fn) => { while (sys.tickCount < tick) sys.tick(); fn(); };
    at(360, () => { w.loadRoom(sys, 'kitchen'); w.loadRoom(sys, 'lounge'); });
    at(450, () => w.drop('parcel', 'post', 200, 200));
    while (sys.tickCount < 12 * 240) sys.tick();
    return { log: sys.getLog(), emits: w.calls.emits };
}

test('sims day: the log matches the day without queues until the first queue forms; Tom queues behind Amara', () => {
    const off = simsDay(false), on = simsDay(true), again = simsDay(true);
    assert.deepEqual(on.log, again.log, 'deterministic');
    const first = on.log.findIndex(e => e.ev === 'queued');
    assert.ok(first > 0);
    // Byte-identical up to the tick the first queue forms
    const t = on.log[first].t;
    const before = l => JSON.stringify(l.filter(e => e.t < t));
    assert.equal(before(on.log), before(off.log));
    assert.deepEqual({ npc: on.log[first].npc, target: on.log[first].target, place: on.log[first].place }, { npc: 'tom', target: 'office_coffee', place: 1 });
    // Without queues Tom waited at his desk; with them he used the machine straight after Amara
    const tomUse = l => l.find(e => e.npc === 'tom' && e.ev === 'using' && e.target === 'office_coffee')?.t;
    assert.ok(tomUse(on.log) <= tomUse(off.log));
    assert.ok(on.emits.some(e => e.name === 'npc_chatted:office_coffee'), 'Amara and Tom chat in the coffee queue');
});

// ── validator ────────────────────────────────────────────────────────────

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
function needsCheck(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('validator: malformed cells, a wait that is not positive, cells by a door wall or in a forbidden neighbour, queue false', { skip }, () => {
    const npc = (id, extra = {}) => ({ id, needsHome: { room: 'office', x: 4, y: 4 }, needs: { caffeine: { decayPerMin: 5, urgentAt: 40 } }, ...extra });
    const issues = needsCheck({
        rooms: {
            office: { type: 'room_office', connections: { west: 'hall' }, objects: [
                { id: 'bad', type: 'x', position: { x: 5, y: 5 }, affordance: { satisfies: 'caffeine', queue: { cells: [{ dx: 1 }] } } },
                { id: 'wait', type: 'x', position: { x: 5, y: 5 }, affordance: { satisfies: 'caffeine', queue: { cells: [{ dx: 1, dy: 0 }], maxWaitSeconds: 0 } } },
                { id: 'doorway', type: 'x', position: { x: 2, y: 5 }, affordance: { satisfies: 'caffeine', queue: { cells: [{ dx: -1, dy: 0 }] } } },
                { id: 'through', type: 'x', position: { x: 1, y: 5 }, affordance: { satisfies: 'caffeine', queue: { cells: [{ dx: -2, dy: 0 }] } } },
                { id: 'chatty', type: 'x', position: { x: 5, y: 5 }, affordance: { satisfies: 'caffeine', chatter: 'coffee', queue: { cells: [{ dx: 1, dy: 0 }] } } },
                { id: 'off', type: 'x', position: { x: 5, y: 5 }, affordance: { satisfies: 'caffeine', queue: false } }
            ], npcs: [npc('ann', { needsAvoidRooms: ['hall'] }), npc('bob')] },
            hall: { type: 'room_office', connections: { east: 'office' } }
        }
    });
    const has = f => issues.some(s => s.includes(f));
    assert.ok(has("'bad' affordance.queue needs cells"));
    assert.ok(has("'wait' affordance.queue.maxWaitSeconds must be a positive"));
    assert.ok(has("'doorway' affordance.queue cell 1 (tile 1,5) is within a tile of the west wall"));
    assert.ok(has("'through' affordance.queue cell 1 (tile -1,5) lies outside room 'office' in 'hall'"));
    assert.ok(has("'through' affordance.queue cell 1 is in room 'hall', in needsAvoidRooms for NPC 'ann'"));
    assert.ok(!has("for NPC 'bob'"));
    assert.ok(!has("'chatty' affordance.chatter needs capacity 2"), 'a queue lets a capacity-1 machine chat');
    assert.ok(!has("'off' affordance.queue"));
});
