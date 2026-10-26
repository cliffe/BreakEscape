// A prop that overlaps a back-wall block once it has settled ignores that block
// until it leaves; every other block still stops it. Run with:
//   node --test test/js/prop-block-exemption.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const src = readFileSync(join(js, 'systems/object-physics.js'), 'utf8')
    .replace("from '../utils/constants.js'", `from '${dataUrl('export const TILE_SIZE = 32;')}'`);
globalThis.window = {};
const { addPropWallCollider } = await import(dataUrl(src));

const box = (left, top, right, bottom) => ({ left, top, right, bottom });
const makeGame = () => {
    const timers = [], colliders = [];
    const world = { listeners: [], on(e, f) { if (e === 'worldstep') this.listeners.push(f); }, off(e, f) { const i = this.listeners.indexOf(f); if (i >= 0) this.listeners.splice(i, 1); }, step() { [...this.listeners].forEach((f) => f()); } };
    return {
        timers, colliders, world,
        time: { delayedCall: (_ms, fn) => timers.push(fn) },
        physics: { world, add: { collider: (a, b, hit, process) => { const c = { a, b, hit, process }; colliders.push(c); return c; } } }
    };
};

test('an ordinary wall box always collides (no process callback)', () => {
    const g = makeGame();
    addPropWallCollider(g, { body: box(0, 0, 10, 10) }, { body: box(0, 0, 5, 5) });
    assert.equal(g.colliders[0].process, undefined);
});

test('a block the prop starts inside is ignored until it leaves, then collides', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    const block = { isBackWallBlock: true, body: box(0, 0, 64, 64) };
    addPropWallCollider(g, prop, block);
    const { process } = g.colliders[0];
    // Phaser calls process() only while the bodies overlap.
    assert.equal(process(), false, 'pending: ignored while the body settles');
    g.timers.forEach((fn) => fn());
    assert.equal(process(), false, 'overlapping at setup: exempt');
    assert.equal(g.world.listeners.length, 1, 'one world-step watcher while exempt');
    g.world.step();
    assert.equal(process(), false, 'still inside after a step: still exempt');
    prop.body = box(100, 10, 120, 30); // slid clear of the block
    g.world.step();
    assert.equal(g.world.listeners.length, 0, 'watcher unhooked once nothing is exempt');
    prop.body = box(10, 10, 30, 30); // pushed back over it
    assert.equal(process(), true, 'left the block earlier: collides now');
});

test('two blocks: leaving one keeps the other exemption and the watcher', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    const a = { isBackWallBlock: true, body: box(0, 0, 64, 64) };
    const b = { isBackWallBlock: true, body: box(0, 0, 20, 64) };
    addPropWallCollider(g, prop, a);
    addPropWallCollider(g, prop, b);
    g.timers.forEach((fn) => fn());
    prop.body = box(40, 10, 60, 30); // clear of b, still inside a
    g.world.step();
    assert.equal(g.colliders[0].process(), false);
    assert.equal(g.colliders[1].process(), true);
    assert.equal(g.world.listeners.length, 1);
});

test('a block the prop did not start in collides from the start of play', () => {
    const g = makeGame();
    const prop = { body: box(200, 10, 220, 30) };
    addPropWallCollider(g, prop, { isBackWallBlock: true, body: box(0, 0, 64, 64) });
    g.timers.forEach((fn) => fn());
    assert.equal(g.colliders[0].process(), true);
});

const fire = (g) => { g.timers.splice(0).forEach((f) => f()); };

test('same pair registered twice: one collider, one listener, collides after leaving', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    const b = { isBackWallBlock: true, body: box(0, 0, 64, 64) };
    const c1 = addPropWallCollider(g, prop, b);
    const c2 = addPropWallCollider(g, prop, b);
    assert.equal(g.colliders.length, 1);
    assert.equal(c1, c2);
    fire(g);
    assert.equal(g.world.listeners.length, 1);
    prop.body = box(100, 10, 120, 30);
    g.world.step();
    assert.equal(g.world.listeners.length, 0);
    prop.body = box(10, 10, 30, 30);
    assert.equal(g.colliders[0].process(), true);
});

test('an ordinary wall box registered twice gets one collider', () => {
    const g = makeGame();
    const prop = { body: box(0, 0, 10, 10) };
    const w = { body: box(0, 0, 5, 5) };
    addPropWallCollider(g, prop, w);
    addPropWallCollider(g, prop, w);
    assert.equal(g.colliders.length, 1);
});

test('re-window: a stale timer does not settle the newer window early', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    const b = { isBackWallBlock: true, body: box(0, 0, 64, 64) };
    addPropWallCollider(g, prop, b);
    const first = g.timers.shift();
    addPropWallCollider(g, prop, b);
    first();
    assert.equal(prop._blockState.get(b), 'pending', 'second window still pending');
    fire(g);
    assert.equal(prop._blockState.get(b), 'exempt');
});

test('re-window while exempt: pending does not count, then re-hooks once', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    const b = { isBackWallBlock: true, body: box(0, 0, 64, 64) };
    addPropWallCollider(g, prop, b); fire(g);
    assert.equal(g.world.listeners.length, 1);
    addPropWallCollider(g, prop, b);
    g.world.step();
    assert.equal(g.world.listeners.length, 0);
    fire(g);
    assert.equal(g.world.listeners.length, 1);
});

test('a second block while the first is exempt: no double hook', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    addPropWallCollider(g, prop, { isBackWallBlock: true, body: box(0, 0, 64, 64) }); fire(g);
    addPropWallCollider(g, prop, { isBackWallBlock: true, body: box(0, 0, 20, 64) }); fire(g);
    assert.equal(g.world.listeners.length, 1);
});

test('destroyed prop (body gone) clears its exemptions and unhooks', () => {
    const g = makeGame();
    const prop = { body: box(10, 10, 30, 30) };
    addPropWallCollider(g, prop, { isBackWallBlock: true, body: box(0, 0, 64, 64) }); fire(g);
    prop.body = undefined;
    g.world.step();
    assert.equal(g.world.listeners.length, 0);
    assert.equal(prop._blockState.size, 0);
});
