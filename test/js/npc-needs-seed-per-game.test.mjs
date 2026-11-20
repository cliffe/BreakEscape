// The chatter bag is seeded per game when a scenario sets no npcNeedsSeed: two games of one
// scenario draw in different orders, one game draws the same order after a reload, and an explicit
// seed (opts.seed or scenario.npcNeedsSeed) keeps its exact behaviour.
// Run with: bin/test-js test/js/npc-needs-seed-per-game.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNeedsSeed, bagOrder, createSeededRng, NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const SCEN = { scenario_name: 'quayholt' };
const LINES = ['a', 'b', 'c', 'd', 'e'];
// The system's own first draw for a pool, through its bag.
const firstDraw = (seed) => new NPCNeedsSystem(makeWorld({ npcs: {}, objects: [] }), { seed })._bagNext('darren', 'kettle', LINES);
const order = (seed) => { const s = new NPCNeedsSystem(makeWorld({ npcs: {}, objects: [] }), { seed }); return LINES.map(() => s._bagNext('darren', 'kettle', LINES)); };

test('two game ids give different first draws for a 5-line pool', () => {
    const a = firstDraw(resolveNeedsSeed(undefined, SCEN, 101));
    const b = firstDraw(resolveNeedsSeed(undefined, SCEN, 103));
    assert.notEqual(a, b);
});

test('the same game id gives the same order on reload', () => {
    const s1 = resolveNeedsSeed(undefined, SCEN, 101);
    const s2 = resolveNeedsSeed(undefined, SCEN, 101);
    assert.deepEqual(order(s1), order(s2));
});

test('an explicit seed overrides the game id (opts.seed and npcNeedsSeed)', () => {
    assert.equal(resolveNeedsSeed(7, SCEN, 101), 7);
    assert.equal(resolveNeedsSeed(7, SCEN, 102), 7);
    assert.equal(resolveNeedsSeed(undefined, { ...SCEN, npcNeedsSeed: 'fixed' }, 101), 'fixed');
    assert.equal(resolveNeedsSeed(undefined, { ...SCEN, npcNeedsSeed: 0 }, 102), 0);
});

test('no game id falls back to the scenario name, as before', () => {
    assert.equal(resolveNeedsSeed(undefined, SCEN, undefined), 'quayholt');
    assert.equal(resolveNeedsSeed(undefined, SCEN, null), 'quayholt');
    assert.equal(resolveNeedsSeed(undefined, null, undefined), 'scenario');
    assert.equal(resolveNeedsSeed(undefined, { name: 'n' }, ''), 'n');
});
