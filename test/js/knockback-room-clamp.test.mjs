// m03 F2, m06 R4 (2026-10-16 engine regression): a hostile NPC's hits pushed the
// player through a doorway into the next room (room_entered fired with no input),
// and after a fight the feet stuck in a door frame. Knockback is now capped to the
// room's floor, less the wall rows/columns and a margin, and skipped in a doorway.
// Run with: node --test test/js/knockback-room-clamp.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/utils/knockback.js'), 'utf8');
globalThis.window = {};
const { knockbackSafeRect, clampKnockbackDistance } =
    await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

// A 10x8-tile room at (0, 0): floor x 32..288, y 64..224 before the margin
const room = { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 256 } };
const rect = knockbackSafeRect(room);

test('the safe rectangle is the floor less walls and an 8 px margin', () => {
    assert.deepEqual(rect, { left: 40, right: 280, top: 72, bottom: 216 });
    assert.equal(knockbackSafeRect(null), null);
});

test('a push in the middle of the room keeps its full distance', () => {
    assert.equal(clampKnockbackDistance(160, 150, 1, 0, 40, rect), 40);
});

test('a push towards the west wall stops at the margin', () => {
    assert.equal(clampKnockbackDistance(60, 150, -1, 0, 40, rect), 20);
});

test('a diagonal push is cut by the nearer edge', () => {
    const d = Math.SQRT1_2;
    const t = clampKnockbackDistance(270, 150, d, d, 40, rect);
    assert.ok(Math.abs(t - 10 / d) < 1e-9);
});

test('a body already in a doorway (outside the rectangle) is not pushed', () => {
    assert.equal(clampKnockbackDistance(20, 150, 1, 0, 40, rect), 0);
    assert.equal(clampKnockbackDistance(160, 60, 0, 1, 40, rect), 0);
});

test('with no room known the push is unchanged', () => {
    assert.equal(clampKnockbackDistance(5, 5, -1, 0, 40, null), 40);
});
