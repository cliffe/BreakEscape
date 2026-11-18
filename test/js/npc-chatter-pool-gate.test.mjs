// Office life: an optional requireGlobal gate on a chatter pool (object form only).
// Pure logic (chatterPool) and the system's draws: pair chat at a cooler, the gate read live,
// plain arrays unchanged, a closed pool silent while the pair still chats and uses the object.
// Run with: bin/test-js test/js/npc-chatter-pool-gate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, requiredGlobalsHold, chatterPool, normalisePool } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const holdsOf = globals => cond => requiredGlobalsHold(cond, globals);

// ── pure ───────────────────────────────────────────────────────────────────

test('normalisePool keeps requireGlobal on the object form; arrays have none', () => {
    assert.equal(normalisePool({ lines: ['a'], requireGlobal: 'calm' }).requireGlobal, 'calm');
    assert.equal(normalisePool(['a']).requireGlobal, undefined);
});

test('chatterPool: gate open and closed (string form)', () => {
    const sc = { cooler: { lines: ['gated one'], requireGlobal: 'calm' } };
    assert.deepEqual(chatterPool('cooler', sc, null, true, holdsOf({ calm: true })).lines, ['gated one']);
    assert.deepEqual(chatterPool('cooler', sc, null, true, holdsOf({ calm: false })).lines, []);
    assert.deepEqual(chatterPool('cooler', sc, null, true, holdsOf({})).lines, []);
});

test('chatterPool: { name: value } needs every entry to match strictly', () => {
    const sc = { cooler: { lines: ['x'], requireGlobal: { mood: 'calm', day: 2 } } };
    assert.equal(chatterPool('cooler', sc, null, true, holdsOf({ mood: 'calm', day: 2 })).lines.length, 1);
    assert.equal(chatterPool('cooler', sc, null, true, holdsOf({ mood: 'calm', day: '2' })).lines.length, 0);
    assert.equal(chatterPool('cooler', sc, null, true, holdsOf({ mood: 'calm' })).lines.length, 0);
});

test('chatterPool: a closed pool is skipped, the other pool under the key still speaks; closed radius and hush do not leak', () => {
    const sc = { cooler: { lines: ['scenario gated'], requireGlobal: 'calm', hush: true, overhearRadius: 300 } };
    const own = { cooler: ['own plain'] };
    const closed = chatterPool('cooler', sc, own, true, holdsOf({}));
    assert.deepEqual(closed.lines, ['own plain']);
    assert.equal(closed.hush, false);
    assert.equal(closed.overhearRadius, null);
    const open = chatterPool('cooler', sc, own, true, holdsOf({ calm: true }));
    assert.deepEqual(open.lines, ['scenario gated', 'own plain']);
    assert.equal(open.hush, true);
    assert.equal(open.overhearRadius, 300);
    const ownGated = { cooler: { lines: ['own gated'], requireGlobal: 'calm' } };
    assert.deepEqual(chatterPool('cooler', { cooler: ['plain'] }, ownGated, true, holdsOf({})).lines, ['plain']);
});

test('chatterPool: plain arrays and ungated objects behave as before, with or without a holds function', () => {
    const sc = { cooler: ['a', 'b'], coffee: { lines: ['c'] } };
    for (const h of [undefined, null, holdsOf({})]) {
        assert.deepEqual(chatterPool('cooler', sc, null, true, h).lines, ['a', 'b']);
        assert.deepEqual(chatterPool('coffee', sc, null, true, h).lines, ['c']);
    }
});

// ── system ─────────────────────────────────────────────────────────────────

const thirsty = (initial = 20) => ({ thirst: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const cooler = { id: 'cooler', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 70, useSeconds: 15, capacity: 2, chatter: 'cooler' } };

function office(chatter, globals = {}, { thoughts = true } = {}) {
    const cfg = { npcs: {}, objects: [cooler] };
    let x = 100;
    for (const id of ['ann', 'bob']) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, needs: thirsty(), chatterCooldownMin: 0 } };
        x += 64;
    }
    const w = makeWorld(cfg);
    const spoken = [];
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = () => ({ overheard: true, distance: 50 });
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    w.world.chatterConfig = () => chatter;
    w.world.npcThoughtsOn = () => thoughts;
    w.world.speak = (id, line) => spoken.push({ id, line });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const turns = () => w.calls.emits.filter(e => e.name.startsWith('npc_chatted:'));
    return { sys, globals, spoken, turns, w };
}

test('system: gate open, the pair speaks gated and ungated lines', () => {
    const o = office({ cooler: { lines: ['Gated hello'], requireGlobal: 'calm' } }, { calm: true });
    o.sys.step(30000);
    assert.ok(o.spoken.some(s => s.line === 'Gated hello'));
});

test('system: gate closed, the pair still chats (pictures) but no gated line is drawn or spoken; ungated lines still are', () => {
    const o = office({ cooler: { lines: ['Gated hello'], requireGlobal: 'calm' } }, {});
    o.sys.step(30000);
    assert.equal(o.spoken.length, 0);
    assert.ok(o.turns().length >= 2, 'the pair still chats');
    assert.ok(o.turns().every(e => e.data.line === null && e.data.picture), 'turns are pictures only');
    const mixed = office({ cooler: { lines: ['Gated hello'], requireGlobal: 'calm' }, grumble: ['Ungated'] }, {});
    mixed.sys.step(30000);
    assert.ok(!mixed.spoken.some(s => s.line === 'Gated hello'));
    const both = office({ cooler: ['Plain line'] }, {});
    both.sys.step(30000);
    assert.ok(both.spoken.some(s => s.line === 'Plain line'));
});

test('system: the global changing mid-game closes the pool for the next draw', () => {
    const o = office({ cooler: { lines: ['Gated hello', 'Gated again', 'Gated third'], requireGlobal: 'calm' } }, { calm: true });
    const ann = o.sys.states.get('ann');
    const first = o.sys._pickBark(ann, 'cooler', { ignoreCooldown: true });
    assert.ok(first.line, 'open: a line');
    o.globals.calm = false;
    const second = o.sys._pickBark(ann, 'cooler', { ignoreCooldown: true });
    assert.equal(second.line, null, 'closed: no line');
    assert.equal(o.sys._hasLines(ann, 'cooler'), false);
    o.globals.calm = true;
    assert.ok(o.sys._pickBark(ann, 'cooler', { ignoreCooldown: true }).line, 'reopened: a line again');
});

// ── review R1 (m3, M1) ─────────────────────────────────────────────────────

test('system: mixed, the open pool\'s lines are spoken and the closed pool\'s are not (same topic, two sources)', () => {
    const o = office({ cooler: { lines: ['Gated hello'], requireGlobal: 'calm' } }, {});
    for (const id of ['ann', 'bob']) o.sys._rec(o.sys.states.get(id)).chatter = { cooler: ['Open line'] };
    o.sys.step(30000);
    assert.ok(o.spoken.some(s => s.line === 'Open line'), 'the open pool speaks');
    assert.ok(!o.spoken.some(s => s.line === 'Gated hello'), 'the closed pool does not');
});

test('system: npcThoughts off, gate closed: silent, the pair still uses the cooler for the same time as the ungated run', () => {
    const useTimes = o => {
        o.sys.step(30000);
        const log = o.sys.getLog();
        const out = {};
        for (const id of ['ann', 'bob']) out[id] = log.filter(e => e.npc === id && e.ev === 'using').map(e => e.t);
        return out;
    };
    const closed = office({ cooler: { lines: ['Gated hello'], requireGlobal: 'calm' } }, {}, { thoughts: false });
    const ungated = office({ cooler: ['Gated hello'] }, {}, { thoughts: false });
    const a = useTimes(closed);
    const b = useTimes(ungated);
    assert.equal(closed.spoken.length, 0, 'no speech');
    assert.ok(closed.turns().every(e => e.data.line === null && !e.data.picture), 'no pictures with thoughts off');
    assert.ok(a.ann.length >= 1 && a.bob.length >= 1, 'the pair still uses the cooler');
    assert.deepEqual(a, b, 'use timing matches the ungated run');
});

test('grumble fallback: a closed grumble_<reason> falls to an open grumble, and to the reason picture when both are closed', () => {
    const gate = lines => ({ lines, requireGlobal: 'calm' });
    const both = office({ grumble_blocked: gate(['A']), grumble: gate(['B']) }, {});
    const ann = both.sys.states.get('ann');
    // both closed: neither pool has lines, so the topic comes from the picture table or plain 'grumble'
    assert.ok(['grumble_blocked', 'grumble'].includes(both.sys._grumbleTopic(ann, 'blocked')));
    assert.equal(both.sys._hasLines(ann, 'grumble'), false);
    const fall = office({ grumble_blocked: gate(['A']), grumble: ['B'] }, {});
    assert.equal(fall.sys._grumbleTopic(fall.sys.states.get('ann'), 'blocked'), 'grumble');
    const open = office({ grumble_blocked: gate(['A']), grumble: ['B'] }, { calm: true });
    assert.equal(open.sys._grumbleTopic(open.sys.states.get('ann'), 'blocked'), 'grumble_blocked');
});

test('mutter: a closed pool has no line (picture or nothing), an open one speaks', () => {
    const closed = office({ wk_test: { lines: ['Mutter line'], requireGlobal: 'calm' } }, {});
    closed.sys.mutter('ann', 'wk_test');
    closed.sys.step(8000);
    assert.equal(closed.spoken.length, 0);
    assert.ok(!closed.w.calls.emits.some(e => e.name === 'npc_mutter:ann' && e.data.line));
    const open = office({ wk_test: { lines: ['Mutter line'], requireGlobal: 'calm' } }, { calm: true });
    open.sys.mutter('ann', 'wk_test');
    open.sys.step(8000);
    assert.ok(open.spoken.some(s => s.line === 'Mutter line'));
});

test('M1: npcThoughts on and chatter false, a mutter emits nothing (as on main); thoughts off emits one null event', () => {
    const on = office(false, {}, { thoughts: true });
    on.sys.mutter('ann', 'login_aloud');
    on.sys.step(8000);
    assert.deepEqual(on.w.calls.emits.filter(e => e.name.startsWith('npc_mutter:')), []);
    const off = office(false, {}, { thoughts: false });
    off.sys.mutter('ann', 'login_aloud');
    off.sys.step(8000);
    const ev = off.w.calls.emits.filter(e => e.name.startsWith('npc_mutter:'));
    assert.equal(ev.length, 1);
    assert.equal(ev[0].data.line, null);
});

test('phone pool: a closed phone gate draws pictures, an open one draws lines', () => {
    const rec = { cooler: [], phone: { lines: ['Hello, Ann speaking.'], requireGlobal: 'calm' } };
    const closed = office(rec, {});
    const c = closed.sys._chooseCall(closed.sys.states.get('ann'), 'owner');
    assert.ok(c.items.every(i => i.text === null), 'pictures only');
    const open = office(rec, { calm: true });
    const d = open.sys._chooseCall(open.sys.states.get('ann'), 'owner');
    assert.ok(d.items.some(i => i.text === 'Hello, Ann speaking.'));
});

test('_chatRadius: a closed pool\'s overhearRadius does not apply; an open one does', () => {
    const pool = { lines: ['x'], overhearRadius: 500, requireGlobal: 'calm' };
    const closed = office({ cooler: pool }, {});
    assert.equal(closed.sys._chatRadius({ topic: 'cooler' }, 'ann'), 160);
    const open = office({ cooler: pool }, { calm: true });
    assert.equal(open.sys._chatRadius({ topic: 'cooler' }, 'ann'), 500);
});
