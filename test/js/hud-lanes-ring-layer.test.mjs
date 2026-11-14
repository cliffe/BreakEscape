// UI backlog 5d: the incoming-call banner keeps clear of an open minigame's title bar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { ringLayerSpot } from '../../public/break_escape/js/ui/hud-lanes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const size = { width: 360, height: 92 };
const lane = { top: 84, left: 16, width: 883 };

test('no minigame title: the banner stays top centre', () => {
  assert.deepEqual(ringLayerSpot({ vw: 915, size, titles: [], lane }), { name: 'default', top: 12, left: 278 });
});

test('a title left of centre at 915 wide: the banner moves to the right end of the lane, below the close X', () => {
  const titles = [{ left: 98, top: 67, right: 506, bottom: 115 }, { left: 805, top: 28, right: 831, bottom: 54 }];
  const s = ringLayerSpot({ vw: 915, size, titles, lane });
  assert.equal(s.name, 'lane');
  assert.equal(s.top, 84);
  assert.equal(s.left, 899 - 360);
});

test('a title bar at the top of a phone: the lane (84) is below it, so the banner takes the lane', () => {
  const titles = [{ left: 26, top: 26, right: 364, bottom: 76 }];
  const s = ringLayerSpot({ vw: 390, size: { width: 358, height: 94 }, titles, lane: { top: 84, left: 16, width: 358 } });
  assert.deepEqual(s, { name: 'lane', top: 84, left: 16 });
});

test('a title the lane would also cross (390x844 PIN): the banner goes under the lowest title', () => {
  const titles = [{ left: 22, top: 151, right: 368, bottom: 199 }, { left: 355, top: 28, right: 381, bottom: 54 }];
  const s = ringLayerSpot({ vw: 390, size: { width: 358, height: 94 }, titles, lane: { top: 84, left: 16, width: 358 } });
  assert.equal(s.name, 'below');
  assert.equal(s.top, 199 + 8);
});

test('the result never overlaps a title, grown by the lane gap', () => {
  const titles = [{ left: 300, top: 10, right: 600, bottom: 60 }];
  const s = ringLayerSpot({ vw: 1000, size, titles, lane: { top: 84, left: 16, width: 960 } });
  assert.ok(s.top >= 60 + 8 || s.left + 360 + 8 <= 300 || s.left >= 600 + 8);
});

test('the lanes module places #phone-ring-layer after the other lanes and watches it', () => {
  const src = readFileSync(join(root, 'ui/hud-lanes.js'), 'utf8');
  assert.match(src, /placeRingLayer\(doc, win, lanes\);\s*win\.__hudLanes/);
  assert.match(src, /getElementById\('phone-ring-layer'\)/);
  assert.match(src, /mo\.observe\(ring, \{ childList: true/);
  assert.match(src, /MINIGAME_TITLES = \[[^\n]*console-titlebar[^\n]*minigame-close-button/);
});
