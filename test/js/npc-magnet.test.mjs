// Office life slice 18b-i (OFFICE_LIFE_PLAN 12.4): the magnet. Food the player drops (a droppable
// item carrying affordance.magnet) is a source where it lies: magnet_placed lists who could come,
// magnet_unreachable a dead drop; NPCs learn of it by sight; a need inside a known magnet's tempt
// band goes for it (a quiet look: no leash notes, never parks); servings are taken as eating starts
// and mirrored in <id>_servings; walkers left when it runs out, or when the player picks it up, turn
// back with `gone`; one eating when it is picked up finishes at once; a finished magnet is removed;
// perPerson stops a second helping by temptation; a hidden object is no candidate. Stub world: the
// drop is the item placed at fixed coordinates, then onItemDropped, as the live hook does.
// Run with: bin/test-js test/js/npc-magnet.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem, NEEDS_TICK_MS, requiredGlobalsHold, magnetOf, MAGNET_TEMPT } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const T = 32;
const hunger = (initial = 65) => ({ hunger: { decayPerMin: 1, urgentAt: 40, initial } });
const cake = (extra = {}, magnet = {}) => ({
    id: 'cake', roomId: 'kitchen', x: 900, y: 300,
    affordance: { satisfies: ['hunger', 'social'], restores: 40, useSeconds: 12, capacity: 3, magnet: { tempt: 30, servings: 2, perPerson: 1, ...magnet } },
    ...extra
});
const fridge = () => ({ id: 'fridge', roomId: 'office', x: 200, y: 300, affordance: { satisfies: 'hunger', restores: 50, useSeconds: 10 } });

function office(npcs, { objects = [fridge()], arrive = false, seed = 7, globals = {}, tickCache = true, chatter } = {}) {
    const cfg = { npcs: {}, objects };
    for (const [id, n] of Object.entries(npcs)) {
        const pos = n.pos || { x: 100, y: 500 };
        cfg.npcs[id] = { pos, room: n.room || 'office', rec: { id, needsHome: { room: 'office', x: pos.x / T, y: pos.y / T }, ...n.rec } };
    }
    const w = makeWorld({ ...cfg, arrive });
    const removed = [];
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.getGlobal = name => globals[name];
    w.world.setGlobal = (name, v) => { globals[name] = v; w.calls.globals[name] = v; };
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.removeMagnet = id => { removed.push(id); const o = w.objs.find(x => x.id === id); if (o) o.roomId = null; return true; };
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true, tickCache });
    w.attach(sys);
    sys.registerAll();
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    const arriveNow = (id) => { const d = sys.states.get(id).job.dest; w.pos[id].x = d.x; w.pos[id].y = d.y; sys.onArrived(id, 'needs'); };
    const know = (...ids) => { for (const id of ids) sys.states.get(id).knows.add('cake'); };
    const item = () => w.objs.find(o => o.id === 'cake');
    const pickUp = () => { item().roomId = null; };
    const drop = (roomId = 'kitchen', at = { x: 900, y: 300 }) => { Object.assign(item(), { roomId, ...at }); return sys.onItemDropped('cake'); };
    const level = (id, need = 'hunger') => sys.states.get(id).levels[need];
    return { w, sys, evs, emitted, ticks, arriveNow, know, item, pickUp, drop, level, globals, removed };
}

const useTicks = secs => Math.ceil(secs * 1000 / NEEDS_TICK_MS) + 2;

// ── placing it ─────────────────────────────────────────────────────────────

test('magnetOf normalises the block; no block is no magnet', () => {
    assert.equal(magnetOf({ satisfies: 'hunger' }), null);
    assert.deepEqual(magnetOf({ magnet: {} }), { tempt: MAGNET_TEMPT, servings: 1, perPerson: 1 });
    assert.deepEqual(magnetOf({ magnet: { tempt: 200, servings: 2.7, perPerson: 0 } }), { tempt: 95, servings: 2, perPerson: 1 });
});

for (const tickCache of [true, false]) {
    test(`a drop: magnet_placed lists who could come; nobody is tempted before knowing; sight in the room tempts (tickCache ${tickCache})`, () => {
        const o = office({
            tom: { rec: { needs: hunger(65) } },
            marek: { rec: { needs: { thirst: { decayPerMin: 1, urgentAt: 40, initial: 90 } } } },
            maya: { rec: { needs: hunger(65), needsAvoidRooms: ['kitchen'] } }
        }, { objects: [fridge(), cake({ roomId: null })], tickCache });
        o.ticks(2);
        assert.equal(o.drop(), true);
        const placed = o.emitted('magnet_placed:cake');
        assert.equal(placed.length, 1);
        assert.deepEqual(placed[0].data, { magnetId: 'cake', roomId: 'kitchen', x: 900, y: 300, how: 'drop', reachable: ['tom'], servings: 2 });
        assert.equal(o.evs('magnet_unreachable').length, 0);
        o.ticks(20);
        assert.equal(o.sys.getState('tom').job, null, 'hunger 65 is not urgent and tom does not know');
        assert.equal(o.evs('job_start').length, 0, 'an unknown magnet is no source');
        o.w.pos.tom = { x: 880, y: 400, roomId: 'kitchen' };   // tom walks into the kitchen
        o.ticks(1);
        assert.deepEqual(o.evs('magnet_seen').map(e => [e.npc, e.target]), [['tom', 'cake']]);
        assert.equal(o.emitted('npc_saw_magnet:tom').length, 1);
        assert.equal(o.sys.getState('tom').job?.targetId, 'cake', 'tempted: 65 <= 40 + 30');
        assert.equal(o.sys.states.get('tom').job.tempted, true);
        o.arriveNow('tom');
        o.ticks(1);
        assert.deepEqual(o.evs('serving_taken').map(e => [e.npc, e.left]), [['tom', 1]]);
        assert.equal(o.globals.cake_servings, 1, 'mirrored in the engine-owned global');
        o.ticks(useTicks(12));
        assert.ok(o.evs('used').some(e => e.npc === 'tom' && e.target === 'cake'));
        assert.ok(o.level('tom') > 90);
    });
}

test('a drop where nobody may go: magnet_unreachable; a told, leashed NPC keeps its level and logs no leashed, private_skipped or parked', () => {
    const o = office({ tom: { rec: { needs: hunger(60), needsAvoidRooms: ['store'] } } },
        { objects: [fridge(), cake({ roomId: null })] });
    o.drop('store', { x: 1500, y: 300 });
    assert.deepEqual(o.evs('magnet_unreachable').map(e => [e.target, e.room]), [['cake', 'store']]);
    assert.deepEqual(o.emitted('magnet_placed:cake')[0].data.reachable, []);
    assert.equal(o.emitted('magnet_unreachable:cake').length, 1);
    o.know('tom');   // as if told (18b-ii)
    const before = o.level('tom');
    o.ticks(2 * 60000 / NEEDS_TICK_MS);
    for (const ev of ['leashed', 'private_skipped', 'parked', 'job_start']) assert.equal(o.evs(ev).length, 0, ev);
    assert.equal(o.emitted('npc_needs_leashed').length, 0);
    assert.ok(Math.abs(o.level('tom') - (before - 2)) < 0.01, 'decay only: temptation never touches the level');
    assert.ok(o.sys.stats.backoffs > 0, 'the quiet look backs off');
});

// ── servings and gone ──────────────────────────────────────────────────────

test('capacity 3, two servings, three tempted walkers: two eat, the third turns back gone ("Missed it."), does not park; the magnet is finished and removed', () => {
    const chatter = { grumble_gone: ['Missed it.'] };
    const o = office({ amara: { rec: { needs: hunger(65) } }, sanjay: { rec: { needs: hunger(64) } }, tom: { rec: { needs: hunger(65) } } },
        { objects: [cake()], chatter });
    o.sys.scanMagnets();
    o.know('amara', 'sanjay', 'tom');
    o.ticks(1);
    assert.deepEqual(['amara', 'sanjay', 'tom'].map(id => o.sys.getState(id).job?.targetId), ['cake', 'cake', 'cake']);
    o.arriveNow('sanjay');
    o.arriveNow('tom');
    o.ticks(1);
    assert.deepEqual(o.evs('serving_taken').map(e => [e.npc, e.left]), [['sanjay', 1], ['tom', 0]]);
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.reason, e.grumble]), [['amara', 'gone', 'grumble_gone']]);
    assert.equal(o.sys.getState('amara').talking.line, 'Missed it.');
    assert.equal(o.evs('parked').length, 0, 'a tempted job never parks');
    assert.equal(o.sys.getState('amara').job, null);
    assert.equal(o.globals.cake_servings, 0);
    assert.equal(o.removed.length, 0, 'not while two are eating');
    o.ticks(useTicks(12));
    assert.deepEqual(o.removed, ['cake']);
    assert.deepEqual(o.evs('magnet_finished').map(e => e.target), ['cake']);
    assert.equal(o.emitted('magnet_finished:cake').length, 1);
    assert.equal(o.evs('used').filter(e => e.target === 'cake').length, 2);
});

test('one serving: an NPC arriving after the last is taken never starts eating', () => {
    const o = office({ ann: { rec: { needs: hunger(60) } }, bob: { rec: { needs: hunger(60) } } }, { objects: [cake({}, { servings: 1 })] });
    o.sys.scanMagnets();
    o.know('ann', 'bob');
    o.ticks(1);
    o.arriveNow('ann');
    o.arriveNow('bob');
    o.ticks(1);
    assert.deepEqual(o.evs('serving_taken').map(e => e.npc), ['ann']);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.reason]), [['bob', 'gone']]);
    assert.equal(o.evs('using').filter(e => e.npc === 'bob').length, 0);
});

test('perPerson 1 stops a second helping by temptation; a plain urgent need may still use it', () => {
    const o = office({ tom: { rec: { needs: { hunger: { decayPerMin: 1, urgentAt: 40, initial: 30 } } } } },
        { objects: [cake({ affordance: { satisfies: 'hunger', restores: 20, useSeconds: 5, capacity: 3, magnet: { tempt: 30, servings: 5, perPerson: 1 } } })], arrive: true });
    o.sys.scanMagnets();
    o.know('tom');
    o.ticks(1 + useTicks(5));
    assert.equal(o.evs('serving_taken').length, 1);
    assert.ok(o.level('tom') > 40 && o.level('tom') <= 70, `in the band at ${o.level('tom')}`);
    o.ticks(40);
    assert.equal(o.evs('serving_taken').length, 1, 'no second helping by temptation');
    o.sys.control('tom', { set: { hunger: 20 } });
    o.ticks(2);
    assert.equal(o.evs('serving_taken').length, 2, 'urgent: it is still food');
});

test('an urgent need prefers a known magnet over a nearer usual source; an unknown one is ignored', () => {
    const o = office({ tom: { rec: { needs: hunger(30) } } }, { objects: [fridge(), cake()] });
    o.sys.scanMagnets();
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'fridge', 'not known: the fridge');
    const p = office({ tom: { rec: { needs: hunger(30) } } }, { objects: [fridge(), cake()] });
    p.sys.scanMagnets();
    p.know('tom');
    p.ticks(1);
    assert.equal(p.sys.getState('tom').job.targetId, 'cake');
    assert.equal(p.sys.states.get('tom').job.tempted, undefined, 'urgent, not tempted');
});

test('a parked need is not tempted', () => {
    const o = office({ tom: { rec: { needs: hunger(30) } } }, { objects: [cake()] });
    o.sys.scanMagnets();
    o.ticks(1);
    assert.deepEqual(o.evs('parked').map(e => e.reason), ['no_source'], 'unknown magnet: nothing');
    o.know('tom');
    o.ticks(20);
    assert.equal(o.evs('job_start').length, 0, 'parked at urgentAt + 1, inside the band, yet not tempted');
});

test('a tempted walker turned back for avoidance does not park and goes anyway the second time (its own flag)', () => {
    const o = office({
        marek: { pos: { x: 100, y: 700 }, rec: {} },
        tom: { rec: { needs: hunger(60), needsCompany: { avoids: ['marek'] } } }
    }, { objects: [cake()] });
    o.sys.scanMagnets();
    o.know('tom');
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'cake');
    o.w.pos.marek = { x: 900, y: 330, roomId: 'kitchen' };
    o.ticks(1);
    assert.deepEqual(o.evs('turned_back').map(e => e.reason), ['avoid']);
    assert.equal(o.evs('parked').length, 0);
    o.ticks(10);
    assert.equal(o.sys.getState('tom').job, null, 'marek still there: the quiet look finds nothing');
    assert.equal(o.evs('parked').length, 0);
    o.w.pos.marek = { x: 100, y: 700, roomId: 'office' };   // marek leaves
    o.ticks(6);
    assert.equal(o.sys.getState('tom').job?.targetId, 'cake', 'tempted again');
    o.w.pos.marek = { x: 900, y: 330, roomId: 'kitchen' };   // and comes back while tom walks
    o.ticks(1);
    assert.equal(o.evs('turned_back').length, 1, 'no second turn-back');
    assert.equal(o.sys.states.get('tom').job.goingAnyway, 'marek');
});

// ── pickup, reload ─────────────────────────────────────────────────────────

test('a pickup: walkers turn back gone, the one eating finishes at once, knowledge is cleared; a re-drop is learnt again by sight; the servings survive', () => {
    const o = office({ ann: { rec: { needs: hunger(60) } }, bob: { rec: { needs: hunger(60) } } }, { objects: [cake({}, { servings: 3 })] });
    o.sys.scanMagnets();
    o.know('ann', 'bob');
    o.ticks(1);
    o.arriveNow('ann');
    o.ticks(1);
    assert.equal(o.sys.getState('ann').job.phase, 'using');
    o.pickUp();
    o.ticks(1);
    assert.deepEqual(o.evs('magnet_gone').map(e => [e.target, e.left]), [['cake', 2]]);
    assert.deepEqual(o.evs('turned_back').map(e => [e.npc, e.reason]), [['bob', 'gone']]);
    assert.ok(o.evs('used').some(e => e.npc === 'ann' && e.target === 'cake'), 'ann finished at once');
    assert.ok(o.level('ann') > 90, 'the serving she took is eaten (the kept affordance)');
    assert.equal(o.sys.states.get('bob').knows.size, 0);
    assert.equal(o.evs('parked').length, 0);
    o.drop('kitchen', { x: 950, y: 300 });
    o.ticks(10);
    assert.equal(o.sys.getState('bob').job, null, 'not known again');
    assert.equal(o.emitted('magnet_placed:cake').at(-1).data.servings, 2, 'servings kept across the pickup');
    o.w.pos.bob = { x: 900, y: 400, roomId: 'kitchen' };
    o.ticks(1);
    assert.equal(o.sys.getState('bob').job?.targetId, 'cake', 'seen again');
});

test('a reload: servings come from the global; 0 servings with the item still out finishes it at once', () => {
    const o = office({ tom: { rec: { needs: hunger(60) } } }, { objects: [cake()], globals: { cake_servings: 1 } });
    o.sys.scanMagnets();
    assert.equal(o.sys._servingsLeft('cake'), 1);
    const p = office({ tom: { rec: { needs: hunger(60) } } }, { objects: [cake()], globals: { cake_servings: 0 } });
    p.sys.scanMagnets();
    p.ticks(1);
    assert.deepEqual(p.removed, ['cake']);
    assert.deepEqual(p.evs('magnet_finished').map(e => e.target), ['cake']);
});

test('a hidden object (revealOnGlobal not true) is no candidate', () => {
    const globals = { pizza_out: false };
    const o = office({ tom: { rec: { needs: hunger(30) } } }, { objects: [fridge(), { id: 'pizza', roomId: 'office', x: 120, y: 500, revealOnGlobal: 'pizza_out', affordance: { satisfies: 'hunger', restores: 40 } }], globals });
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job.targetId, 'fridge');
    globals.pizza_out = true;
    const p = office({ tom: { rec: { needs: hunger(30) } } }, { objects: [fridge(), { id: 'pizza', roomId: 'office', x: 120, y: 500, revealOnGlobal: 'pizza_out', affordance: { satisfies: 'hunger', restores: 40 } }], globals });
    p.ticks(1);
    assert.equal(p.sys.getState('tom').job.targetId, 'pizza');
});

test('determinism: two runs with the same drop point give the same decision log', () => {
    const run = () => {
        const o = office({ amara: { rec: { needs: hunger(65) } }, tom: { pos: { x: 880, y: 400 }, room: 'kitchen', rec: { needs: hunger(64) } } },
            { objects: [fridge(), cake({ roomId: null })], arrive: true });
        o.ticks(4);
        o.drop();
        o.ticks(400);
        return JSON.stringify(o.sys.getLog());
    };
    const a = run();
    assert.equal(a, run());
    assert.ok(a.includes('serving_taken'));
});

// ── validator ──────────────────────────────────────────────────────────────

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const validate = (scenario) => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
require 'json'
puts ValidateNpcNeeds.check(JSON.parse($stdin.read)).join("\\n")`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    return r.stdout.split('\n').filter(Boolean);
};
const scen = (item, extra = {}) => ({
    globalVariables: { cake_servings: 2 },
    startItemsInInventory: [item],
    rooms: { office: { objects: [], npcs: [{ id: 'tom', needs: { hunger: { decayPerMin: 1, urgentAt: 40, initial: 65 } }, needsHome: { room: 'office', x: 2, y: 2 } }] } },
    ...extra
});
const cakeItem = (extra = {}) => ({ id: 'cake', type: 'cake1', name: 'Cake', droppable: true, affordance: { satisfies: ['hunger'], restores: 40, capacity: 3, magnet: { tempt: 30, servings: 2 } }, ...extra });

test('validator: a droppable magnet needs an id and no needsTag, a declared <id>_servings equal to servings; satisfies a need someone has', { skip: ruby.status !== 0 }, () => {
    const ok = validate(scen(cakeItem()));
    assert.deepEqual(ok.filter(l => /magnet/i.test(l)), []);
    assert.ok(validate(scen(cakeItem({ id: undefined }))).some(l => l.includes('ERROR') && l.includes('magnet') && l.includes('id')));
    assert.ok(validate(scen(cakeItem({ needsTag: 'food' }))).some(l => l.includes('ERROR') && l.includes('needsTag')));
    assert.ok(validate(scen(cakeItem(), { globalVariables: {} })).some(l => l.includes('ERROR') && l.includes('cake_servings')));
    assert.ok(validate(scen(cakeItem(), { globalVariables: { cake_servings: 3 } })).some(l => l.includes('ERROR') && l.includes('cake_servings')));
    assert.ok(validate(scen(cakeItem({ affordance: { satisfies: ['rest'], restores: 40, magnet: { servings: 2 } } }))).some(l => l.includes('WARNING') && l.includes("'rest'")));
    assert.ok(validate(scen(cakeItem({ affordance: { satisfies: ['hunger'], magnet: { servings: 2, tempt: -1 } } }))).some(l => l.includes('ERROR') && l.includes('tempt')));
    assert.ok(validate(scen(cakeItem({ droppable: false }))).some(l => l.includes('magnet') && l.includes('droppable')));
});
