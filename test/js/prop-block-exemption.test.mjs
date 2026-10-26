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
    return {
        timers, colliders,
        time: { delayedCall: (_ms, fn) => timers.push(fn) },
        physics: { add: { collider: (a, b, hit, process) => { const c = { a, b, hit, process }; colliders.push(c); return c; } } }
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
    assert.equal(process(), false, 'pending: ignored while the body settles');
    g.timers.forEach((fn) => fn());
    assert.equal(process(), false, 'overlapping at setup: exempt');
    prop.body = box(100, 10, 120, 30); // slid clear of the block
    assert.equal(process(), true, 'left the block: collides from now on');
    prop.body = box(10, 10, 30, 30); // back over it
    assert.equal(process(), true, 'no longer exempt once it has left');
});

test('a block the prop did not start in collides from the start of play', () => {
    const g = makeGame();
    const prop = { body: box(200, 10, 220, 30) };
    addPropWallCollider(g, prop, { isBackWallBlock: true, body: box(0, 0, 64, 64) });
    g.timers.forEach((fn) => fn());
    assert.equal(g.colliders[0].process(), true);
});
