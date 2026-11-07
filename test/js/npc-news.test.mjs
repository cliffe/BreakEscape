// Office life slice 18b-ii (OFFICE_LIFE_PLAN 12.4 point 3, OQ33, OQ35): word of mouth about a
// magnet. A knower back in its own room, away from the magnet's room, tells once per magnet: every
// NPC in the same room within newsRadius tiles that does not know yet and is not avoided either way
// (groups do not matter) learns of it (npc_told:<id>), whatever is shown. The line comes from the
// magnet's announce pool, ignores the bark cooldown and waits for the speech lock up to 30 s, then a
// `news` picture (the magnet's first satisfies); with nobody to tell there is no announce at all.
// Learning of a magnet, by sight or word, wakes that NPC's parked needs it satisfies.
// Run with: bin/test-js test/js/npc-news.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem, NEEDS_TICK_MS, NEWS_WAIT_MS, PICTURE_CHATTER, requiredGlobalsHold } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const T = 32;
const hunger = (initial = 65) => ({ hunger: { decayPerMin: 1, urgentAt: 40, initial } });
const calm = () => ({ thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 95 } });
const cake = (extra = {}, magnet = {}) => ({
    id: 'cake', roomId: 'kitchen', x: 900, y: 300,
    affordance: { satisfies: ['hunger', 'social'], restores: 40, useSeconds: 12, capacity: 3, magnet: { tempt: 30, servings: 2, perPerson: 1, announce: 'news_cake', newsRadius: 5, ...magnet } },
    ...extra
});
const POOL = { news_cake: ['Someone brought cake in!'] };

// grace (the knower) sits at (300, 300) in the office; others by tile offset from her
const at = (dx, dy = 0) => ({ x: 300 + dx * T, y: 300 + dy * T });

function office(npcs, { objects = [cake()], chatter = POOL, globals = {}, tickCache = true, arrive = false } = {}) {
    const cfg = { npcs: {}, objects };
    for (const [id, n] of Object.entries(npcs)) {
        const pos = n.pos || at(0);
        const home = n.home || { room: 'office', x: pos.x / T, y: pos.y / T };
        cfg.npcs[id] = { pos, room: n.room || 'office', rec: { id, needsHome: home, ...n.rec } };
    }
    const w = makeWorld({ ...cfg, arrive });
    const spoken = [];
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.getGlobal = name => globals[name];
    w.world.setGlobal = (name, v) => { globals[name] = v; };
    w.world.playerHears = () => ({ overheard: false, distance: null });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.removeMagnet = id => { const o = w.objs.find(x => x.id === id); if (o) o.roomId = null; return true; };
    w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed: 7, manualClock: true, tickCache });
    w.world.speak = (id, line, info) => spoken.push({ id, line, topic: info.topic, at: sys.clockMs });
    w.attach(sys);
    sys.registerAll();
    sys.scanMagnets();
    const evs = ev => sys.getLog().filter(e => e.ev === ev);
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    const know = (...ids) => { for (const id of ids) sys.states.get(id).knows.add('cake'); };
    const knows = id => sys.states.get(id).knows.has('cake');
    const told = () => evs('told').map(e => [e.npc, e.from]);
    return { w, sys, evs, emitted, ticks, know, knows, told, spoken };
}

test('a knower back in its own room tells those within newsRadius in that room, with a line from the announce pool', () => {
    const o = office({
        grace: { rec: { needs: calm() } },
        tom: { pos: at(3), rec: { needs: calm() } },
        rosa: { pos: at(8), rec: { needs: calm() } },        // 8 tiles: out of range
        amara: { pos: at(2), room: 'lounge', rec: { needs: calm() } }   // 2 tiles, another room
    });
    o.ticks(1);
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    assert.deepEqual(o.emitted('npc_told:').map(e => [e.name, e.data]), [['npc_told:tom', { npcId: 'tom', magnetId: 'cake', fromId: 'grace' }]]);
    assert.deepEqual(o.spoken.map(s => [s.id, s.line, s.topic]), [['grace', 'Someone brought cake in!', 'news_cake']]);
    const ann = o.evs('announced');
    assert.deepEqual(ann.map(e => [e.npc, e.target, e.heard, e.line]), [['grace', 'cake', ['tom'], 'news_cake:0']]);
    assert.equal(o.emitted('npc_announced:grace')[0].data.line, 'Someone brought cake in!');
    assert.equal(o.sys.getState('grace').talking.line, 'Someone brought cake in!');
    assert.equal(o.knows('rosa'), false, 'out of range');
    assert.equal(o.knows('amara'), false, 'not across rooms');
});

test('within the radius exactly (5 tiles) is heard; just beyond is not; newsRadius is per magnet', () => {
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(5), rec: { needs: calm() } }, rosa: { pos: at(5.2), rec: { needs: calm() } } });
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    const p = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(5), rec: { needs: calm() } } }, { objects: [cake({}, { newsRadius: 2 })] });
    p.know('grace');
    p.ticks(5);
    assert.deepEqual(p.told(), []);
    assert.equal(p.spoken.length, 0);
});

test('avoidance blocks telling both ways; with nobody else to tell there is no announce at all (no line, no picture, no TTS)', () => {
    for (const [graceRec, tomRec] of [[{ needsCompany: { avoids: ['tom'] } }, {}], [{}, { needsCompany: { avoids: ['grace'] } }]]) {
        const o = office({ grace: { rec: { needs: calm(), ...graceRec } }, tom: { pos: at(2), rec: { needs: calm(), ...tomRec } } });
        o.know('grace');
        o.ticks(20);
        assert.deepEqual(o.told(), []);
        assert.equal(o.evs('announced').length, 0);
        assert.equal(o.spoken.length, 0);
        assert.equal(o.sys.getState('grace').talking, null);
        assert.equal(o.knows('tom'), false);
    }
    // marek avoids everyone ("*"): never told, and tells nobody, while the others still pass it on
    const o = office({
        grace: { rec: { needs: calm() } },
        marek: { pos: at(1), rec: { needs: calm(), needsCompany: { avoids: ['*'], avoidRadius: 0 } } },
        tom: { pos: at(2), rec: { needs: calm() } }
    });
    o.know('grace');
    o.ticks(10);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    assert.equal(o.knows('marek'), false);
});

test('groups do not block telling', () => {
    const o = office({
        grace: { rec: { needs: calm(), needsCompany: { groups: ['finance'] } } },
        tom: { pos: at(2), rec: { needs: calm(), needsCompany: { groups: ['it'] } } }
    });
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
});

test('telling happens without a spoken line: "chatter": false shows nothing and still tells', () => {
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } } }, { chatter: false });
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    assert.equal(o.spoken.length, 0);
    assert.equal(o.sys.getState('grace').talking, null);
    assert.deepEqual(o.evs('announced').map(e => [e.line, e.picture]), [[undefined, undefined]]);
});

test('no announce pool: a news picture of the magnet\'s first satisfies; the topic falls back to social', () => {
    assert.deepEqual([...PICTURE_CHATTER.news], ['social']);
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } } }, { objects: [cake({}, { announce: undefined })] });
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    assert.equal(o.sys.getState('grace').talking.picture, 'hunger');
    assert.equal(o.spoken.length, 0);
    const p = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } } },
        { objects: [cake({ affordance: { satisfies: ['fun'], magnet: { servings: 1 } } })] });
    p.know('grace');
    p.ticks(1);
    assert.equal(p.sys.getState('grace').talking.picture, 'social');
});

test('the announce ignores the bark cooldown, waits for the speech lock, and after 30 s shows the news picture; hearers are those in range when it shows', () => {
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } }, rosa: { pos: at(9), rec: { needs: calm() } } });
    o.ticks(1);
    o.sys.states.get('grace').chatterQuietUntil = o.sys.clockMs + 10 * 60000;   // just barked
    o.sys._speechUntil = o.sys.clockMs + 60000;                                  // someone else is talking
    o.know('grace');
    o.ticks(4);
    assert.deepEqual(o.told(), [], 'waiting for the lock: nobody learns yet');
    o.w.pos.rosa = { ...at(3), roomId: 'office' };   // rosa walks up while grace waits
    o.ticks(NEWS_WAIT_MS / NEEDS_TICK_MS);
    assert.deepEqual(o.told(), [['rosa', 'grace'], ['tom', 'grace']]);
    assert.equal(o.spoken.length, 0, 'the lock never came free: a picture, not a line');
    assert.equal(o.evs('announced')[0].picture, 'hunger');
    const t0 = o.evs('announced')[0].t * NEEDS_TICK_MS;
    assert.ok(t0 >= 30000, `after the 30 s wait (${t0} ms)`);

    // the lock frees within the wait: the line is spoken despite the cooldown
    const p = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } } });
    p.ticks(1);
    p.sys.states.get('grace').chatterQuietUntil = p.sys.clockMs + 10 * 60000;
    p.sys._speechUntil = p.sys.clockMs + 5000;
    p.know('grace');
    p.ticks(5000 / NEEDS_TICK_MS + 2);
    assert.deepEqual(p.spoken.map(s => s.line), ['Someone brought cake in!']);
    assert.deepEqual(p.told(), [['tom', 'grace']]);
});

test('once per magnet per knower: a newcomer later is not told by the same knower; nobody tells in the magnet\'s own room', () => {
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), rec: { needs: calm() } }, rosa: { pos: at(12), rec: { needs: calm() } } });
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    // tom (told) is a knower too and tells rosa when she comes within his range, not grace's
    o.w.pos.rosa = { ...at(6), roomId: 'office' };
    o.ticks(30);
    assert.deepEqual(o.told(), [['tom', 'grace'], ['rosa', 'tom']]);
    assert.equal(o.evs('announced').filter(e => e.npc === 'grace').length, 1);
    o.ticks(200);
    assert.equal(o.evs('announced').length, 2);

    // the magnet in the knower's own room: everyone there can see it, so nobody announces
    const p = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), room: 'kitchen', rec: { needs: calm() } } },
        { objects: [cake({ roomId: 'office' })] });
    p.know('grace');
    p.w.pos.tom.roomId = 'office';
    p.ticks(1);
    assert.equal(p.evs('announced').length, 0);
    assert.deepEqual(p.evs('magnet_seen').map(e => e.npc).sort(), ['tom'], 'tom learns by sight');
});

test('an empty office: no announce; the knower tells whoever comes within range later (the empty-room skip keeps the news)', () => {
    const o = office({ grace: { rec: { needs: calm() } }, tom: { pos: at(2), room: 'lounge', rec: { needs: calm() } } });
    o.know('grace');
    o.ticks(40);
    assert.equal(o.evs('announced').length, 0);
    assert.equal(o.spoken.length, 0);
    o.w.pos.tom.roomId = 'office';
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
});

test('a knower away from its own room, or busy on a job, does not tell until it is back', () => {
    const o = office({ grace: { room: 'lounge', rec: { needs: calm() } }, tom: { pos: at(2), room: 'lounge', rec: { needs: calm() } } });
    o.know('grace');
    o.ticks(10);
    assert.deepEqual(o.told(), [], 'grace is in the lounge, not her own room');
    o.w.pos.grace.roomId = 'office';
    o.w.pos.tom.roomId = 'office';
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
});

test('a knower working at its own desk tells; one using anything else does not', () => {
    const desk = { id: 'grace_pc', roomId: 'office', x: 300, y: 268, affordance: { satisfies: 'work', restores: 50, useSeconds: 60 } };
    const o = office({
        grace: { home: 'grace_pc', rec: { needs: { work: { decayPerMin: 1, urgentAt: 50, initial: 30 } } } },
        tom: { pos: at(2), rec: { needs: calm() } }
    }, { objects: [cake(), desk], arrive: true });
    o.ticks(3);
    assert.equal(o.sys.states.get('grace').job?.phase, 'using');
    assert.equal(o.sys.states.get('grace').job?.targetId, 'grace_pc');
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    const p = office({
        grace: { rec: { needs: { thirst: { decayPerMin: 1, urgentAt: 40, initial: 30 } } } },
        tom: { pos: at(2), rec: { needs: calm() } }
    }, { objects: [cake(), { id: 'cooler', roomId: 'office', x: 300, y: 268, affordance: { satisfies: 'thirst', restores: 50, useSeconds: 60 } }], arrive: true });
    p.ticks(3);
    assert.equal(p.sys.states.get('grace').job?.phase, 'using');
    p.know('grace');
    p.ticks(4);
    assert.deepEqual(p.told(), [], 'at the cooler, not her post');
});

test('learning by word wakes the hearer\'s parked needs the magnet satisfies, and no others; a told, tempted NPC gets up', () => {
    const o = office({
        grace: { rec: { needs: calm() } },
        tom: { pos: at(2), rec: { needs: { ...hunger(30), thirst: { decayPerMin: 1, urgentAt: 40, initial: 30 } } } },
        maya: { pos: at(12), rec: { needs: hunger(30) } }
    });
    o.ticks(1);
    const parked = () => o.evs('parked').map(e => [e.npc, e.need]).sort();
    assert.deepEqual(parked(), [['maya', 'hunger'], ['tom', 'hunger'], ['tom', 'thirst']]);
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    o.ticks(1000 / NEEDS_TICK_MS + 1);
    assert.deepEqual(o.evs('unparked').map(e => [e.npc, e.need, e.reason]), [['tom', 'hunger', 'woken']]);
    assert.equal(o.sys.getState('tom').job?.targetId, 'cake', 'urgent again at urgentAt and a known magnet');
    assert.ok(o.sys.states.get('tom').parked.thirst, 'thirst stays parked');
    assert.ok(o.sys.states.get('maya').parked.hunger, 'maya was not told');
});

test('learning by sight wakes parked needs too', () => {
    const o = office({ tom: { pos: at(2), rec: { needs: hunger(30) } } });
    o.ticks(1);
    assert.equal(o.evs('parked').length, 1);
    o.w.pos.tom = { x: 880, y: 400, roomId: 'kitchen' };
    o.ticks(1);
    assert.deepEqual(o.evs('magnet_seen').map(e => e.npc), ['tom']);
    o.ticks(1000 / NEEDS_TICK_MS + 1);
    assert.deepEqual(o.evs('unparked').map(e => [e.npc, e.reason]), [['tom', 'woken']]);
    assert.equal(o.sys.getState('tom').job?.targetId, 'cake');
});

test('an NPC told mid-job does not retarget; a picked-up magnet is told again after a re-drop', () => {
    const o = office({
        grace: { rec: { needs: calm() } },
        tom: { pos: at(2), rec: { needs: { thirst: { decayPerMin: 1, urgentAt: 40, initial: 30 } } } }
    }, { objects: [cake(), { id: 'cooler', roomId: 'office', x: 700, y: 300, affordance: { satisfies: 'thirst', restores: 50, useSeconds: 10 } }] });
    o.ticks(1);
    assert.equal(o.sys.getState('tom').job?.targetId, 'cooler');
    o.know('grace');
    o.ticks(1);
    assert.deepEqual(o.told(), [['tom', 'grace']]);
    assert.equal(o.sys.getState('tom').job?.targetId, 'cooler', 'no retarget');
    // pickup: everyone forgets, and grace may tell again once it is back down
    const item = o.w.objs.find(x => x.id === 'cake');
    item.roomId = null;
    o.ticks(1);
    assert.equal(o.sys.states.get('grace').announced.size, 0);
    item.roomId = 'kitchen';
    o.sys.onItemDropped('cake');
    o.know('grace');
    o.ticks(1);
    assert.equal(o.evs('announced').length, 1, 'her first line is still showing');
    o.ticks(20);
    assert.equal(o.evs('announced').length, 2);
    assert.deepEqual(o.told(), [['tom', 'grace'], ['tom', 'grace']]);
});

test('end to end: the knower sees the cake in the kitchen, walks home and tells the office; the hungry get up, deterministically', () => {
    const run = () => {
        const o = office({
            grace: { pos: { x: 880, y: 400 }, room: 'kitchen', home: { room: 'office', x: 300 / T, y: 300 / T }, rec: { needs: calm() } },
            amara: { pos: at(1, 1), rec: { needs: hunger(65) } },
            tom: { pos: at(-2), rec: { needs: hunger(64) } }
        }, { arrive: true });
        o.ticks(1);
        assert.deepEqual(o.evs('magnet_seen').map(e => e.npc), ['grace']);
        o.w.pos.grace = { ...at(0), roomId: 'office' };   // she walks back to her desk
        o.ticks(2);
        assert.deepEqual(o.told(), [['amara', 'grace'], ['tom', 'grace']]);
        assert.ok(o.evs('job_start').some(e => e.npc === 'tom' && e.target === 'cake'));
        assert.ok(o.evs('job_start').some(e => e.npc === 'amara' && e.target === 'cake'));
        o.ticks(200);
        return JSON.stringify(o.sys.getLog());
    };
    assert.equal(run(), run());
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
const scen = (magnet, extra = {}) => ({
    globalVariables: { cake_servings: 2 },
    chatter: { news_cake: ['Someone brought cake in!'], empty: [] },
    startItemsInInventory: [{ id: 'cake', type: 'cake1', name: 'Cake', droppable: true, affordance: { satisfies: ['hunger'], restores: 40, capacity: 3, magnet: { servings: 2, ...magnet } } }],
    rooms: { office: { objects: [], npcs: [{ id: 'tom', needs: { hunger: { decayPerMin: 1, urgentAt: 40, initial: 65 } }, needsHome: { room: 'office', x: 2, y: 2 } }] } },
    ...extra
});

test('validator: announce names a scenario chatter pool with lines; newsRadius is a number in range', { skip: ruby.status !== 0 }, () => {
    assert.deepEqual(validate(scen({ announce: 'news_cake', newsRadius: 5 })).filter(l => /announce|newsRadius/.test(l)), []);
    assert.ok(validate(scen({ announce: 'news_pie' })).some(l => l.includes('ERROR') && l.includes("'news_pie'")));
    assert.ok(validate(scen({ announce: 'empty' })).some(l => l.includes('ERROR') && l.includes("'empty'")));
    assert.ok(validate(scen({ announce: 5 })).some(l => l.includes('ERROR') && l.includes('announce')));
    assert.ok(validate(scen({ newsRadius: 80 })).some(l => l.includes('ERROR') && l.includes('newsRadius')));
    const rooms = { ...scen({}).rooms, kitchen: { type: 'room_kitchen', objects: [], npcs: [] } };
    assert.deepEqual(validate(scen({ announce: 'news_cake' }, { rooms })).filter(l => /announce/.test(l)), []);
    assert.ok(validate(scen({ announce: 'news_cake' }, { rooms, chatter: { news_cake: ['Cake in the kitchen, come on!'] } }))
        .some(l => l.includes('WARNING') && l.includes('kitchen')), 'a line naming a room is flagged: a dropped magnet can be anywhere');
});
