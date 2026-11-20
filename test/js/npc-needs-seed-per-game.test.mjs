// Only the chatter bag is seeded per game when a scenario sets no npcNeedsSeed: two games of one
// scenario draw chatter in different orders, one game draws the same order after a reload, and an
// explicit seed (opts.seed or scenario.npcNeedsSeed) fixes the bag too. Every other roll
// (lockChance, prints, left items, exchange order, chattiness, call gaps) keeps the scenario seed.
// Run with: bin/test-js test/js/npc-needs-seed-per-game.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNeedsSeed, resolveBagSeed, bagOrder, createSeededRng, NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const SCEN = { scenario_name: 'quayholt' };
const LINES = ['a', 'b', 'c', 'd', 'e'];
// The system's own first draw for a pool, through its bag.
const mk = (seed, bagSeed) => new NPCNeedsSystem(makeWorld({ npcs: {}, objects: [] }), { seed, bagSeed });
const firstDraw = (bagSeed) => mk('quayholt', bagSeed)._bagNext('darren', 'kettle', LINES);
const order = (bagSeed) => { const s = mk('quayholt', bagSeed); return LINES.map(() => s._bagNext('darren', 'kettle', LINES)); };

test('two game ids give different first draws for a 5-line pool', () => {
    const a = firstDraw(resolveBagSeed(undefined, SCEN, 101));
    const b = firstDraw(resolveBagSeed(undefined, SCEN, 103));
    assert.notEqual(a, b);
});

test('the same game id gives the same order on reload', () => {
    const s1 = resolveBagSeed(undefined, SCEN, 101);
    const s2 = resolveBagSeed(undefined, SCEN, 101);
    assert.deepEqual(order(s1), order(s2));
});

test('an explicit seed overrides the game id (opts.seed and npcNeedsSeed)', () => {
    assert.equal(resolveBagSeed(7, SCEN, 101), 7);
    assert.equal(resolveBagSeed(7, SCEN, 102), 7);
    assert.equal(resolveBagSeed(undefined, { ...SCEN, npcNeedsSeed: 'fixed' }, 101), 'fixed');
    assert.equal(resolveBagSeed(undefined, { ...SCEN, npcNeedsSeed: 0 }, 102), 0);
});

test('an explicit seed fixes the chatter bag across game ids', () => {
    const o = (gid) => order(resolveBagSeed(5, SCEN, gid));
    assert.deepEqual(o(101), o(202));
});

test('no game id falls back to the scenario name, as before', () => {
    assert.equal(resolveBagSeed(undefined, SCEN, undefined), 'quayholt');
    assert.equal(resolveBagSeed(undefined, SCEN, null), 'quayholt');
    assert.equal(resolveBagSeed(undefined, null, undefined), 'scenario');
    assert.equal(resolveBagSeed(undefined, { name: 'n' }, ''), 'n');
});

test('the main seed never includes the game id', () => {
    assert.equal(resolveNeedsSeed(undefined, SCEN), 'quayholt');
    assert.equal(resolveNeedsSeed(undefined, { ...SCEN, npcNeedsSeed: 3 }), 3);
    assert.equal(resolveNeedsSeed(9, SCEN), 9);
});

test('non-chatter rolls (lockChance-style roll, seedFor) are identical for two game ids', () => {
    const sys = (gid) => mk(resolveNeedsSeed(undefined, SCEN), resolveBagSeed(undefined, SCEN, gid));
    const a = sys(101), b = sys(103);
    assert.notEqual(resolveBagSeed(undefined, SCEN, 101), resolveBagSeed(undefined, SCEN, 103));
    for (const salt of ['print:1', 'left:0:x', 'chat:o:1:first', 'lock:pc1']) {
        assert.equal(a.roll('darren', salt), b.roll('darren', salt));
    }
    assert.equal(a.seedFor('darren'), b.seedFor('darren'));
    assert.equal(a.roll('darren', 'print:1'), new NPCNeedsSystem(makeWorld({ npcs: {}, objects: [] }), { seed: 'quayholt' }).roll('darren', 'print:1'));
});
