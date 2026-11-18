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

function office(chatter, globals = {}) {
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
