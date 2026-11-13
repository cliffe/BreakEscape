// Office life slice 18a (OFFICE_LIFE_PLAN 12.4): coffee off. affordance.offWhen takes a source out
// of the candidates; walkers and queuers turn back with reason `off` (outside _recheck, so with no
// avoidance radius too); one using it finishes; the fallback takes the next source or parks; an off
// turn-back leaves a later avoidance turn-back possible; switching it back on (a real change)
// wakes parked needs; the grumble topic is chosen by lines (grumble_off, else grumble, else the
// grumble_off picture with the need's icon); the turn-back table's answered and rang_out go
// straight home; the validator's offWhen and hint-title checks.
// Run with: bin/test-js test/js/npc-coffee-off.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, PICTURE_CHATTER, TURN_BACK, WAKE_BASE_MS, offWhenNames
} from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { runSimsDay } from './fixtures/needs-sims-world.mjs';

const T = 32;
const coffee = (initial = 90) => ({ caffeine: { decayPerMin: 1, urgentAt: 50, initial } });
// Approach cell of a stub object is one tile below it. The office machine can be switched off
const officeMachine = (extra = {}) => ({ id: 'office_coffee', x: 300, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, offWhen: 'coffee_off', ...extra } });
const kitchenMachine = () => ({ id: 'kitchen_coffee', x: 900, y: 100, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10 } });
const nearQueue = { cells: [{ dx: -1, dy: 0 }, { dx: -2, dy: 0 }] };

function office(npcs, { objects = [officeMachine(), kitchenMachine()], arrive = false, seed = 5, chatter, globals = {}, hears = null } = {}) {
    const cfg = { npcs: {}, objects };
    for (const [id, n] of Object.entries(npcs)) {
        const pos = n.pos || { x: 100, y: 500 };
        cfg.npcs[id] = { pos, rec: { id, needsHome: { room: 'office', x: pos.x / T, y: pos.y / T }, ...n.rec } };
    }
    const w = makeWorld({ ...cfg, arrive });
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = hears || (() => ({ overheard: false, distance: null }));
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const want = (id, level = 10) => sys.control(id, { set: { caffeine: level } });
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    const arriveNow = (id) => { const d = sys.states.get(id).job.dest; w.pos[id].x = d.x; w.pos[id].y = d.y; sys.onArrived(id, 'needs'); };
    // The player clicks the socket: set_global, then global_variable_changed (emitted on every set)
    const set = (v) => { globals.coffee_off = v; sys.onGlobalChanged('coffee_off'); };
    return { w, sys, evs, emitted, want, ticks, arriveNow, set, globals };
}

// ── the source ─────────────────────────────────────────────────────────────

test('offWhen holds: the machine is no candidate; the kitchen is taken, and with no other source the need parks no_source', () => {
    const o = office({ tom: { rec: { needs: coffee() } } }, { globals: { coffee_off: true } });
    o.want('tom');
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'kitchen_coffee');
    const p = office({ tom: { rec: { needs: coffee() } } }, { objects: [officeMachine()], globals: { coffee_off: true } });
    p.want('tom');
    p.ticks(1);
    assert.equal(p.sys.getState('tom').job, null);
    assert.deepEqual(p.evs('parked').map(e => [e.npc, e.need, e.reason]), [['tom', 'caffeine', 'no_source']]);
    // offWhen false (the global unset): a source as before
    const q = office({ tom: { rec: { needs: coffee() } } });
    q.want('tom');
    q.ticks(1);
    assert.equal(q.sys.getState('tom').job.targetId, 'office_coffee');
});

test('the { name: value } form: off only while every named global matches', () => {
    const globals = { power: 'off' };
    const o = office({ tom: { rec: { needs: coffee() } } }, { objects: [officeMachine({ offWhen: { power: 'off' } }), kitchenMachine()], globals });
    o.want('tom');
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'kitchen_coffee');
    assert.deepEqual(offWhenNames({ power: 'off', fuse: true }), ['power', 'fuse']);
    assert.deepEqual(offWhenNames('coffee_off'), ['coffee_off']);
    assert.deepEqual(offWhenNames(null), []);
});

// ── walkers and queuers ────────────────────────────────────────────────────

test('a walker turns back with off (no needsCompany, no avoidance radius), grumbles, and takes the kitchen', () => {
    const o = office({ tom: { rec: { needs: coffee() } } });
    o.want('tom');
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'office_coffee');
    o.ticks(3);
    o.set(true);
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.need, e.target, e.reason, e.grumble]), [['tom', 'caffeine', 'office_coffee', 'off', 'grumble_off']]);
    const ev = o.emitted('npc_turned_back:tom');
    assert.deepEqual([ev.length, ev[0].data.reason, ev[0].data.targetId, 'avoidedId' in ev[0].data], [1, 'off', 'office_coffee', false]);
    const st = o.sys.getState('tom');
    assert.equal(st.job.targetId, 'kitchen_coffee', 'the fallback');
    assert.equal(st.avoiding, null, 'no face bubble: nobody was avoided');
    assert.equal(st.talking.topic, 'grumble_off');
    assert.equal(st.talking.picture, 'caffeine', "no lines anywhere: the need's own icon");
    o.arriveNow('tom');
    o.ticks(10 * 1000 / NEEDS_TICK_MS + 2);
    assert.ok(o.evs('used').some(e => e.npc === 'tom' && e.target === 'kitchen_coffee'));
});

test('a queuer turns back with off; the one using the machine finishes its use', () => {
    const o = office({ ann: { rec: { needs: coffee() } }, bob: { rec: { needs: coffee() } } },
        { objects: [officeMachine({ queue: nearQueue })], arrive: true });
    o.want('ann');
    o.ticks(2);
    assert.equal(o.sys.getState('ann').job.phase, 'using');
    o.want('bob', 12);
    o.ticks(2);
    assert.equal(o.sys.getState('bob').job.phase, 'queued');
    o.set(true);
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.reason]), [['bob', 'off']]);
    assert.equal(o.sys.getState('bob').job, null);
    assert.deepEqual(o.evs('parked').map(e => [e.npc, e.reason]), [['bob', 'no_source']], 'nothing else: parked');
    assert.equal(o.sys.getState('ann').job.phase, 'using', 'ann keeps pouring');
    o.ticks(10 * 1000 / NEEDS_TICK_MS + 2);
    assert.ok(o.evs('used').some(e => e.npc === 'ann' && e.target === 'office_coffee'), 'and finishes');
});

test('an off turn-back does not set mindChanged: a later avoidance turn-back still happens', () => {
    const o = office({ marek: { pos: { x: 600, y: 500 }, rec: {} }, sanjay: { rec: { needs: coffee(), needsCompany: { avoids: ['marek'] } } } });
    o.want('sanjay');
    o.ticks(1);
    o.set(true);
    o.ticks(1);
    assert.equal(o.sys.getState('sanjay').job.targetId, 'kitchen_coffee');
    assert.deepEqual(o.sys.states.get('sanjay').mindChanged, {});
    o.w.pos.marek = { x: 910, y: 140, roomId: 'office' };   // marek turns up at the kitchen machine
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => [e.reason, e.target]), [['off', 'office_coffee'], ['avoid', 'kitchen_coffee']]);
    assert.equal(o.sys.states.get('sanjay').mindChanged.caffeine, true);
});

// ── switching it back on ───────────────────────────────────────────────────

test('switching back on wakes parked needs; setting the same value again does not', () => {
    const o = office({ tom: { rec: { needs: coffee() } } }, { objects: [officeMachine()], globals: { coffee_off: true } });
    o.want('tom');
    o.ticks(1);
    assert.equal(o.evs('parked').length, 1);
    o.set(true);   // the socket clicked again: same value, the event still fires
    o.ticks(WAKE_BASE_MS / NEEDS_TICK_MS + 2);
    assert.equal(o.evs('unparked').length, 0, 'no real change: no wake');
    assert.equal(o.evs('switched_on').length, 0);
    o.set(false);
    assert.deepEqual(o.evs('switched_on').map(e => [e.npc, e.global]), [[null, 'coffee_off']]);
    o.ticks(WAKE_BASE_MS / NEEDS_TICK_MS + 1);
    assert.deepEqual(o.evs('unparked').map(e => [e.npc, e.reason]), [['tom', 'woken']]);
    assert.equal(o.sys.getState('tom').job?.targetId, 'office_coffee');
    o.set(false);
    assert.equal(o.evs('switched_on').length, 1, 'on again, same value: nothing');
    // A global no offWhen reads is ignored
    o.sys.onGlobalChanged('last_activity');
    assert.equal(o.evs('switched_on').length, 1);
});

// ── grumbles ───────────────────────────────────────────────────────────────

const turnOff = (opts) => {
    const o = office({ tom: { rec: { needs: coffee(), ...(opts.rec || {}) } } }, opts);
    o.want('tom');
    o.ticks(1);
    o.set(true);
    o.ticks(1);
    return o;
};

test('grumble_off is used when it has lines; a scenario with only a grumble pool still says a grumble line (the lab)', () => {
    const own = turnOff({ chatter: { grumble: ['Not with him there.'], grumble_off: ["Machine's dead."] } });
    assert.deepEqual([own.sys.getState('tom').talking.topic, own.sys.getState('tom').talking.line], ['grumble_off', "Machine's dead."]);
    assert.equal(own.evs('turned_back')[0].grumble, 'grumble_off');
    const lab = turnOff({ chatter: { grumble: ['Not with him there.'] } });
    assert.deepEqual([lab.sys.getState('tom').talking.topic, lab.sys.getState('tom').talking.line], ['grumble', 'Not with him there.']);
    assert.equal(lab.evs('turned_back')[0].grumble, 'grumble');
    // An NPC's own grumble_off lines count too
    const npc = turnOff({ rec: { chatter: { grumble_off: ['Kitchen, then.'] } } });
    assert.equal(npc.sys.getState('tom').talking.line, 'Kitchen, then.');
    // chatter false: no grumble at all
    const off = turnOff({ chatter: false });
    assert.equal(off.sys.getState('tom').talking, null);
});

test('the off picture is the need\'s icon (avoid for a need with none); overheard with the chosen topic', () => {
    const o = turnOff({ hears: () => ({ overheard: true, distance: 50 }) });
    const ov = o.emitted('npc_overheard:tom');
    assert.deepEqual([ov.length, ov[0].data.topic, ov[0].data.picture, ov[0].data.lineId], [1, 'grumble_off', 'caffeine', 'picture:caffeine']);
    const odd = office({ tom: { rec: { needs: { rounds: { decayPerMin: 1, urgentAt: 50, initial: 90 } } } } },
        { objects: [{ ...officeMachine(), affordance: { ...officeMachine().affordance, satisfies: 'rounds' } }] });
    odd.sys.control('tom', { set: { rounds: 10 } });
    odd.ticks(1);
    odd.set(true);
    odd.ticks(1);
    assert.equal(odd.sys.getState('tom').talking.picture, PICTURE_CHATTER.grumble_off[0]);
    assert.deepEqual(PICTURE_CHATTER.grumble_gone, ['avoid']);
    // The avoidance grumble is as before: topic grumble, the avoid picture
    assert.deepEqual(PICTURE_CHATTER.grumble, ['avoid']);
});

// ── the turn-back table ────────────────────────────────────────────────────

test('the turn-back table: answered and rang_out go straight home with no grumble, no fallback and no park', () => {
    assert.deepEqual(Object.keys(TURN_BACK), ['avoid', 'off', 'gone', 'answered', 'rang_out', 'failed']);   // failed: access slice 9.2
    assert.deepEqual(Object.entries(TURN_BACK).filter(([, r]) => r.mindChanged).map(([k]) => k), ['avoid']);
    for (const reason of ['answered', 'rang_out']) {
        const o = office({ tom: { rec: { needs: coffee() } } }, { objects: [officeMachine(), kitchenMachine()] });
        o.want('tom');
        o.ticks(1);
        const s = o.sys.states.get('tom');
        s.job.need = null;   // a phone job (slice 19) has no need
        o.sys._turnBack(s, reason);
        assert.deepEqual(o.evs('turned_back').map(e => [e.reason, e.grumble]), [[reason, undefined]]);
        const st = o.sys.getState('tom');
        assert.equal(st.talking, null, `${reason}: no grumble`);
        assert.equal(st.job, null, `${reason}: no fallback`);
        assert.equal(st.mode, 'returning');
        assert.equal(o.evs('parked').length, 0);
    }
});

// ── determinism and the sims day ───────────────────────────────────────────

test('deterministic for a seed, with Math.random throwing', () => {
    const run = () => {
        const real = Math.random;
        Math.random = () => { throw new Error('Math.random used'); };
        try {
            const o = office({ tom: { rec: { needs: coffee(60) } }, ann: { rec: { needs: coffee(55) } } },
                { objects: [officeMachine({ queue: nearQueue }), kitchenMachine()], arrive: true });
            for (let i = 0; i < 600; i++) {
                if (i === 40) o.set(true);
                if (i === 300) o.set(false);
                o.sys.tick();
            }
            return JSON.stringify(o.sys.getLog());
        } finally { Math.random = real; }
    };
    assert.equal(run(), run());
});

const GOLDEN_SIMS_DAY = 'a87a652c0b54abe9d8c237f6ba4b8cc097f193097a546267bbcf6b5b86b86948';
test('the sims day (no offWhen anywhere) is byte-identical', () => {
    const { sys } = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    assert.equal(createHash('sha256').update(JSON.stringify(sys.getLog())).digest('hex'), GOLDEN_SIMS_DAY);
});

// ── validator ──────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
test('validator: offWhen names a declared global that some object sets; a hint with no title in a needs scenario', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
    const check = scenario => {
        const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
          puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop());
    };
    const npc = { id: 'tom', needsHome: { room: 'office', x: 2, y: 2 }, needs: { caffeine: { decayPerMin: 1, urgentAt: 40 } } };
    const socket = (hint) => ({ id: 'socket', type: 'wall_socket1', name: 'Wall socket', triggerOnInteract: [{ type: 'set_global', key: 'coffee_off', value: true }, hint] });
    const scen = (offWhen, objs = [], globals = { coffee_off: false }) => ({
        globalVariables: globals,
        rooms: { office: { type: 'room_office', objects: [{ id: 'm', type: 'coffee_station1', affordance: { satisfies: 'caffeine', restores: 50, offWhen } }, ...objs], npcs: [npc] } }
    });
    const mine = list => list.filter(s => /offWhen|hint/.test(s));
    assert.deepEqual(mine(check(scen('coffee_off', [socket({ type: 'hint', title: 'Wall socket', message: 'The coffee machine is switched off at the wall.' })]))), []);
    const undeclared = check(scen('power_cut', [socket({ type: 'hint', title: 'Wall socket', message: 'x' })]));
    assert.ok(undeclared.some(s => s.startsWith('❌') && s.includes("offWhen 'power_cut'") && s.includes('globalVariables')));
    const unset = check(scen('coffee_off'));
    assert.ok(unset.some(s => s.startsWith('⚠️') && s.includes("offWhen 'coffee_off'") && s.includes('nothing in the scenario sets it')));
    const bad = check(scen(42));
    assert.ok(bad.some(s => s.startsWith('❌') && s.includes('offWhen must be')));
    const untitled = check(scen('coffee_off', [socket({ type: 'hint', message: 'The coffee machine is switched off at the wall.' })]));
    assert.ok(untitled.some(s => s.startsWith('⚠️') && s.includes("object 'socket'") && s.includes('Intelligence Received')));
    // No needs NPCs and no officePresets: the spy title is the scenario's business
    const spy = { rooms: { office: { type: 'room_office', objects: [socket({ type: 'hint', message: 'x' })] } } };
    assert.deepEqual(mine(check(spy)), []);
});
