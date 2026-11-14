// UI backlog 5d: the incoming-call banner keeps clear of an open minigame's title bar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { ringLayerSpot } from '../../public/break_escape/js/ui/hud-lanes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const B = (left, top, right, bottom) => ({ left, top, right, bottom });
const overlaps = (s, size, r) => s.left < r.right && r.left < s.left + size.width && s.top < r.bottom && r.top < s.top + size.height;

// Boxes measured live from the PIN pad ("Enter PIN: Director's Safe", m01) with R1's code.
// 915x412: title 98..506 x 67..115, X, 4 rows of keys (1..3 at y 114..154, bottom row ends y 298).
const PIN_915 = {
  vw: 915, vh: 412, size: { width: 360, height: 92 }, lane: { top: 84, left: 16, width: 883 },
  titles: [B(98, 67, 506, 115), B(805, 28, 831, 54)],
  controls: [B(805, 28, 831, 54), B(545, 114, 625, 154), B(627, 114, 707, 154), B(709, 114, 789, 154),
    B(545, 162, 625, 202), B(627, 162, 707, 202), B(709, 162, 789, 202), B(545, 210, 625, 250), B(627, 210, 707, 250),
    B(709, 210, 789, 250), B(545, 258, 625, 298), B(627, 258, 707, 298), B(709, 258, 789, 298)],
  frame: B(78, 20, 838, 390)
};
// 390x844: title 22..368 x 151..199, display 22..368 x 215..265, keys below.
const PIN_390 = {
  vw: 390, vh: 844, size: { width: 358, height: 94 }, lane: { top: 84, left: 16, width: 358 },
  titles: [B(22, 151, 368, 199), B(355, 28, 381, 54)],
  controls: [B(355, 28, 381, 54), B(22, 215, 368, 265), B(40, 290, 130, 340), B(150, 290, 240, 340), B(260, 290, 350, 340),
    B(40, 350, 130, 400), B(150, 350, 240, 400), B(260, 350, 350, 400), B(40, 410, 130, 460), B(150, 410, 240, 460),
    B(260, 410, 350, 460), B(40, 470, 130, 520), B(150, 470, 240, 520), B(260, 470, 350, 520)],
  frame: B(14, 120, 376, 640)
};

test('PIN pad at 915x412: the banner goes to the bottom and covers no key, display, title or X', () => {
  const s = ringLayerSpot(PIN_915);
  assert.equal(s.name, 'bottom');
  for (const r of [...PIN_915.titles, ...PIN_915.controls]) assert.ok(!overlaps(s, PIN_915.size, r), JSON.stringify(r));
  assert.ok(s.top + PIN_915.size.height <= PIN_915.vh);
});

test('PIN pad at 390x844: the banner covers no key, display, title or X, and stays on screen', () => {
  const s = ringLayerSpot(PIN_390);
  assert.notEqual(s.name, 'default');
  for (const r of [...PIN_390.titles, ...PIN_390.controls]) assert.ok(!overlaps(s, PIN_390.size, r), JSON.stringify(r));
  assert.ok(s.top >= 0 && s.top + PIN_390.size.height <= PIN_390.vh);
});

test('the R1 lane spot at 915x412 (539,84) is rejected: it covers keys 1 to 3', () => {
  const keys = PIN_915.controls.slice(1, 4);
  assert.ok(keys.every(k => overlaps({ left: 539, top: 84 }, PIN_915.size, k)));
  const s = ringLayerSpot(PIN_915);
  assert.ok(!(s.left === 539 && s.top === 84));
});

test('no spot clear of controls: the original top centre', () => {
  const full = { vw: 400, vh: 300, size: { width: 360, height: 92 }, titles: [B(0, 0, 400, 300)], controls: [] };
  assert.deepEqual(ringLayerSpot(full), { name: 'default', top: 12, left: 20 });
});

test('a toast in the notify lane is avoided', () => {
  const s0 = ringLayerSpot(PIN_915);
  const toast = B(s0.left, s0.top, s0.left + 360, s0.top + 92);
  const s = ringLayerSpot({ ...PIN_915, toasts: [toast] });
  assert.ok(!overlaps(s, PIN_915.size, toast));
});

test('the below spot is clamped to the viewport', () => {
  const s = ringLayerSpot({ vw: 390, vh: 300, size: { width: 358, height: 94 }, titles: [B(0, 0, 390, 50)], frame: B(0, 0, 390, 280) });
  assert.ok(s.top + 94 <= 300);
});

test('no minigame boxes: the banner stays top centre', () => {
  assert.deepEqual(ringLayerSpot({ vw: 915, vh: 412, size: { width: 360, height: 92 } }), { name: 'default', top: 12, left: 278 });
});

test('the lanes module places #phone-ring-layer after the other lanes and watches it', () => {
  const src = readFileSync(join(root, 'ui/hud-lanes.js'), 'utf8');
  assert.match(src, /const ringSpot = placeRingLayer\(doc, win, lanes\);\s*win\.__hudLanes/);
  assert.match(src, /getElementById\('phone-ring-layer'\)/);
  assert.match(src, /mo\.observe\(ring, \{ childList: true/);
  assert.match(src, /MINIGAME_TITLES = \[[^\n]*console-titlebar[^\n]*minigame-close-button/);
});
