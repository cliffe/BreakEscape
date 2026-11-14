// interact() click target (test-bridge/aim.js) and the no-click moveToNear.
// Run with: bin/test-js test/js/test-bridge-aim.test.mjs
//
// The geometry is sis02's SCADA control room as measured live (2026-11-14):
// HMI-OPS-01's top-left corner, where interact() used to click, lies inside
// the Facility Status Board above it, and the engine walked the player off to
// the board instead of opening the workstation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const bridgeDir = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/test-bridge');
const { chooseAimPoint, rivalsAt, TAP_SLOP } = await import(pathToFileURL(join(bridgeDir, 'aim.js')));

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

// The wiring in index.js, which only runs in a browser. Source checks, so a
// later edit that goes back to clicking the origin or clicking to walk fails here.
const src = readFileSync(join(bridgeDir, 'index.js'), 'utf8');
const body = (name) => {
    const a = src.indexOf(`    async ${name}(`);
    assert.ok(a > 0, `${name} found`);
    const b = src.indexOf('\n    async ', a + 10);
    return src.slice(a, b);
};

test('interact() clicks the aim point, never the entity origin', () => {
    const fn = body('interact');
    assert.doesNotMatch(fn, /clickWorld\((entity|after)\.x/);
    assert.equal((fn.match(/aim = aimPointFor\(/g) || []).length, 2);
    assert.match(fn, /result\.picked = pickedTarget\(entity\)/);
});

test('moveToNear walks without a click and reports anything the walk triggered', () => {
    const fn = body('moveToNear');
    assert.match(fn, /bridge\.moveTo\([^)]*pointer: false/);
    assert.match(fn, /flagTriggeredMove\(result, moveStartT\)/);
    const mv = body('moveTo');
    assert.match(mv, /if \(!pointer\)[\s\S]*movePlayerToPoint\(x, y\)/);
    assert.equal((mv.match(/checked\((res|result)\)/g) || []).length, 2);
});
