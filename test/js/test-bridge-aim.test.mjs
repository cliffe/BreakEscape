// interact() click target (test-bridge/aim.js) and the no-click moveToNear.
// Run with: bin/test-js test/js/test-bridge-aim.test.mjs
//
// The geometry is sis02's SCADA control room as measured live (2026-11-14):
// HMI-OPS-01's top-left corner, where interact() used to click, lies inside
// the Facility Status Board above it, and the engine walked the player off to
// the board instead of opening the workstation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const bridgeDir = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/test-bridge');
const { chooseAimPoint, rivalsAt, TAP_SLOP, CLICK_MARGIN, MAX_SAMPLES } = await import(pathToFileURL(join(bridgeDir, 'aim.js')));

const box = (left, top, right, bottom) => ({ left, top, right, bottom });
const inside = (b, p) => p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom;

const hmi = { bounds: box(144, 47, 172, 70), x: 144, y: 47 };
const board = { id: 'scada_control_room_screens_7', kind: 'object', bounds: box(67, 12, 251, 49), x: 67, y: 12, inReach: false };
const cup = { id: 'cup', kind: 'object', bounds: box(162, 66, 173, 77), x: 162, y: 66, inReach: false };
const helen = { id: 'helen_marsh', kind: 'npc', bounds: box(152, 57, 232, 137), x: 192, y: 97, inReach: false };

test('the old click point (the sprite origin) is claimed by the status board', () => {
    assert.deepEqual(rivalsAt(hmi.x, hmi.y, [board]), [board.id]);
});

test('the aim point is inside the target and outside every far neighbour', () => {
    const aim = chooseAimPoint(hmi, [board, cup, helen]);
    assert.ok(aim.clean, JSON.stringify(aim));
    assert.ok(inside(hmi.bounds, aim), 'inside the target');
    for (const o of [board, cup, helen]) assert.ok(!inside(o.bounds, aim), `outside ${o.id}`);
});

test('an in-reach neighbour claims taps within the slop of its position, not only its bounds', () => {
    const near = { id: 'note', kind: 'object', bounds: box(136, 36, 140, 40), x: 136, y: 36, inReach: true };
    const aim = chooseAimPoint(hmi, [near]);
    assert.ok(aim.clean);
    assert.ok(Math.hypot(aim.x - near.x, aim.y - near.y) > TAP_SLOP);
    // The same neighbour out of reach only claims its bounds.
    assert.deepEqual(rivalsAt(138, 38, [{ ...near, inReach: false }]), [near.id]);
    assert.deepEqual(rivalsAt(150, 50, [{ ...near, inReach: false }]), []);
    assert.deepEqual(rivalsAt(150, 50, [near]), [near.id]);
});

test('swivel props claim by bounds only, even in reach', () => {
    const chair = { id: 'chair', kind: 'object', bounds: box(0, 0, 10, 10), x: 0, y: 0, inReach: true, swivel: true };
    assert.deepEqual(rivalsAt(20, 0, [chair]), []);
    assert.deepEqual(rivalsAt(5, 5, [chair]), ['chair']);
});

test('with no free point it takes the fewest claimants and says it is not clean', () => {
    const cover = { id: 'cover', kind: 'object', bounds: box(100, 0, 200, 100), x: 100, y: 0, inReach: false };
    const half = { id: 'half', kind: 'object', bounds: box(144, 47, 158, 70), x: 144, y: 47, inReach: false };
    const aim = chooseAimPoint(hmi, [cover, half]);
    assert.equal(aim.clean, false);
    assert.deepEqual(aim.rivals, ['cover']);
    assert.ok(aim.x > 158, 'avoids the second claimant');
});

test('prefers the target\'s own pixels and points the pointer can reach', () => {
    const left = (x) => x < 150;
    const aim = chooseAimPoint(hmi, [], { opaque: (x) => left(x) });
    assert.ok(aim.onPixels && aim.x < 150);
    const off = chooseAimPoint(hmi, [], { onScreen: (x, y) => y > 65 });
    assert.ok(off.y > 65);
    assert.equal(chooseAimPoint(hmi, [], { onScreen: () => false }), null);
});

test('no bounds gives null (caller falls back to the entity position)', () => {
    assert.equal(chooseAimPoint({ x: 1, y: 1 }, []), null);
});

test('every claim has a 2 px margin, and the aim keeps clear of it', () => {
    const slopRival = { id: 'mug', kind: 'object', bounds: box(100, 100, 101, 101), x: 140, y: 80, inReach: true };
    assert.deepEqual(rivalsAt(140 + TAP_SLOP + 1, 80, [slopRival]), ['mug'], 'just outside the slop still counts');
    assert.deepEqual(rivalsAt(103, 100, [{ ...slopRival, inReach: false }]), ['mug'], '2 px off its box still counts');
    assert.deepEqual(rivalsAt(104, 100, [{ ...slopRival, inReach: false }]), []);
    const aim = chooseAimPoint(hmi, [slopRival]);
    assert.ok(aim.clean);
    assert.ok(Math.hypot(aim.x - 140, aim.y - 80) > TAP_SLOP + CLICK_MARGIN);
});

test('a large target is sampled at most MAX_SAMPLES times', () => {
    const big = { bounds: box(0, 0, 600, 600), x: 0, y: 0 };
    const aim = chooseAimPoint(big, []);
    assert.ok(aim.sampled <= MAX_SAMPLES, String(aim.sampled));
    assert.ok(aim.clean);
});

// The wiring into interact() and moveTo/moveToNear is tested by behaviour in
// test-bridge-click-target.test.mjs.

test('the pixel test runs only at points that can still win on claimants, with the same pick', () => {
    const cover = { id: 'cover', kind: 'object', bounds: box(100, 0, 160, 100), x: 100, y: 0, inReach: false };
    let reads = 0;
    const opaque = (x, y) => { reads++; return x > 165; };
    const aim = chooseAimPoint(hmi, [cover], { opaque });
    // Every point left of x=162 (160 + margin) is claimed by the cover.
    assert.equal(aim.clean, true);
    assert.ok(aim.x > 165 && aim.onPixels, JSON.stringify(aim));
    assert.ok(reads < aim.sampled / 2, `pixel reads ${reads} of ${aim.sampled} samples`);
});
