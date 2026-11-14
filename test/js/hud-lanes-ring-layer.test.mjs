// UI backlog 5d: the incoming-call banner keeps clear of an open minigame's title bar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { JSDOM } from 'jsdom';
import { ringLayerSpot, measureMinigame, applyLanes, startHudLanes } from '../../public/break_escape/js/ui/hud-lanes.js';

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

test('the below spot is clamped to the viewport (review R2 n3: the clamp is reached)', () => {
  // Bottom row y 190..284 is blocked across the width, so both bottom spots fail. Under the frame
  // is y 288 (control bottom 284 + 4 margin is clear), which would run off a 300px screen: the
  // clamp pulls it to 190, blocked again, so the banner falls back to the top centre.
  const base = { vw: 390, vh: 300, size: { width: 358, height: 94 }, titles: [B(0, 0, 390, 50)],
    controls: [B(0, 190, 390, 284)], frame: B(0, 0, 390, 280) };
  const s = ringLayerSpot(base);
  assert.equal(s.name, 'default');
  // With room under the frame the same row yields the below spot, unclamped
  const roomy = ringLayerSpot({ ...base, frame: B(0, 0, 390, 60) });
  assert.deepEqual(roomy, { name: 'below', top: 68, left: 16 });
});

test('R2 m3: with a toast in the lane the banner goes just under the lowest toast, not over the X', () => {
  // EHR console at 390x844: bottom blocked by a button row, lane spot covered by a warning toast
  const ehr = { vw: 390, vh: 844, size: { width: 358, height: 94 }, lane: { top: 84, left: 16, width: 358 },
    titles: [B(20, 20, 370, 75)], controls: [B(320, 30, 360, 70), B(20, 90, 370, 150), B(127, 705, 263, 757)],
    frame: B(10, 10, 380, 830) };
  const toast = B(16, 84, 374, 227);
  const noToast = ringLayerSpot({ ...ehr, controls: [B(320, 30, 360, 70), B(127, 705, 263, 757), B(20, 650, 370, 840)], toasts: [] });
  assert.equal(noToast.name, 'lane');
  const blocked = { ...ehr, controls: [B(320, 30, 360, 70), B(20, 650, 370, 840), B(20, 90, 370, 100)], toasts: [toast] };
  const s = ringLayerSpot(blocked);
  assert.equal(s.name, 'lane-below');
  assert.equal(s.top, 235);
  assert.ok(!overlaps(s, ehr.size, B(320, 30, 360, 70)), 'the X stays clear');
  assert.ok(!overlaps(s, ehr.size, toast));
  // too low for the screen: falls back
  const squeezed = ringLayerSpot({ ...blocked, vh: 300 });
  assert.notEqual(squeezed.name, 'lane-below');
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

// ---- the real measuring path in jsdom (review R2 m1): no layout engine, so each element's box is
// given by hand. Fails if the control collectors in measureMinigame are removed.
function rig(vw = 915, vh = 412) {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const win = dom.window;
  Object.defineProperty(win, 'innerWidth', { value: vw, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: vh, configurable: true });
  win.Element.prototype.getBoundingClientRect = function () {
    const r = this._r || [0, 0, 0, 0];
    return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[3] - r[1] };
  };
  const doc = win.document;
  const add = (html, rect, parent = doc.body) => {
    const t = doc.createElement('template');
    t.innerHTML = html;
    const el = t.content.firstElementChild;
    el._r = rect;
    parent.appendChild(el);
    return el;
  };
  return { win, doc, add };
}

function pinScene({ win, doc, add }) {
  const mg = add('<div class="minigame-container"></div>', [78, 20, 838, 390]);
  add('<div class="minigame-game-container"></div>', [78, 20, 838, 390], mg);
  add('<div class="minigame-header">Enter PIN</div>', [98, 67, 506, 115], mg);
  add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  add('<div class="pin-minigame-display">----</div>', [545, 70, 789, 110], mg);
  for (let i = 0; i < 3; i++) add('<button class="pin-key">1</button>', [545 + i * 82, 114, 625 + i * 82, 154], mg);
  add('<div class="clicky" style="cursor: pointer">row</div>', [545, 258, 789, 298], mg);   // pointer cursor only
  add('<div class="backdrop" style="cursor: pointer"></div>', [0, 0, 915, 300], mg);       // over half the screen
  add('<button class="hidden-key" style="display: none">z</button>', [545, 300, 625, 340], mg);
  return mg;
}

test('measureMinigame collects titles, buttons, the PIN display and pointer-cursor rows, and skips the backdrop and hidden controls', () => {
  const r = rig();
  pinScene(r);
  const m = measureMinigame(r.doc, r.win);
  assert.equal(m.titles.length, 2, 'header and X');
  const has = (box) => m.controls.some(c => c.left === box[0] && c.top === box[1] && c.right === box[2] && c.bottom === box[3]);
  assert.ok(has([545, 114, 625, 154]), 'a key');
  assert.ok(has([709, 114, 789, 154]), 'the third key');
  assert.ok(has([545, 70, 789, 110]), 'the PIN display');
  assert.ok(has([805, 28, 831, 54]), 'the X is also a control');
  assert.ok(has([545, 258, 789, 298]), 'a pointer-cursor row');
  assert.ok(!has([0, 0, 915, 300]), 'a backdrop over half the screen is no control');
  assert.ok(!has([545, 300, 625, 340]), 'a hidden control is skipped');
  assert.equal(m.controls.length, 6);
  assert.deepEqual(m.frame, { left: 78, top: 20, right: 838, bottom: 390 });
});

test('applyLanes places a ringing banner clear of every measured control and records the spot', () => {
  const r = rig();
  pinScene(r);
  const layer = r.add('<div id="phone-ring-layer"></div>', [278, 12, 638, 104]);
  r.add('<div class="incoming-call"></div>', [278, 12, 638, 104], layer);
  r.win.Element.prototype.getBoundingClientRect = ((orig) => function () {
    if (this.id === 'phone-ring-layer') return { left: 278, top: 12, right: 638, bottom: 104, width: 360, height: 92 };
    return orig.call(this);
  })(r.win.Element.prototype.getBoundingClientRect);
  applyLanes(r.doc, r.win);
  const spot = r.win.__hudLanes.ringSpot;
  assert.notEqual(spot.name, 'default');
  assert.equal(parseInt(layer.style.top, 10), spot.top);
  assert.equal(parseInt(layer.style.left, 10), spot.left);
  const m = measureMinigame(r.doc, r.win);
  for (const c of [...m.titles, ...m.controls]) assert.ok(!overlaps(spot, { width: 360, height: 92 }, c), JSON.stringify(c));
  // Mutation target: without the control collectors the banner would sit on the keys at the top
  assert.ok(m.controls.length >= 5);
});

test('R2 m2: a control added inside the open minigame while the banner rings moves the banner', async () => {
  const r = rig();
  pinScene(r);
  const layer = r.add('<div id="phone-ring-layer"></div>', [278, 12, 638, 104]);
  r.add('<div class="incoming-call"></div>', [278, 12, 638, 104], layer);
  const orig = r.win.Element.prototype.getBoundingClientRect;
  r.win.Element.prototype.getBoundingClientRect = function () {
    if (this.id === 'phone-ring-layer') return { left: 278, top: 12, right: 638, bottom: 104, width: 360, height: 92 };
    return orig.call(this);
  };
  const handle = startHudLanes(r.doc, r.win);
  const tick = () => new Promise(res => setTimeout(res, 80));
  await tick();
  const first = { ...r.win.__hudLanes.ringSpot };
  assert.equal(first.name, 'bottom');
  // A late button where the banner now sits
  r.add('<button class="late">LATE</button>', [first.left + 20, first.top + 10, first.left + 200, first.top + 50], r.doc.querySelector('.minigame-container'));
  await tick();
  const second = r.win.__hudLanes.ringSpot;
  assert.ok(second.left !== first.left || second.top !== first.top, 'banner moved off the late button');
  assert.ok(!overlaps(second, { width: 360, height: 92 }, B(first.left + 20, first.top + 10, first.left + 200, first.top + 50)));
  // The banner goes: the minigame observer is dropped, so a change inside no longer re-places anything
  layer.querySelector('.incoming-call').remove();
  await tick();
  assert.equal(layer.style.top, '', 'inline placing cleared');
  handle.stop();
  r.win.close();
});

test('R2 m3 follow-up: a toast mid-slide (translateY -20px) is measured where it settles', () => {
  const r = rig();
  pinScene(r);
  const layer = r.add('<div id="phone-ring-layer"></div>', [278, 12, 638, 104]);
  r.add('<div class="incoming-call"></div>', [278, 12, 638, 104], layer);
  const container = r.add('<div id="notification-container"></div>', [0, 0, 0, 0]);
  // Mid-slide box 200..284; settled it is 220..304, which the bottom spot (304) would touch
  r.add('<div class="notification show" style="transform: matrix(1, 0, 0, 1, 0, -20)"></div>', [278, 200, 638, 284], container);
  const orig = r.win.Element.prototype.getBoundingClientRect;
  r.win.Element.prototype.getBoundingClientRect = function () {
    if (this.id === 'phone-ring-layer') return { left: 278, top: 12, right: 638, bottom: 104, width: 360, height: 92 };
    return orig.call(this);
  };
  applyLanes(r.doc, r.win);
  const spot = r.win.__hudLanes.ringSpot;
  assert.ok(!overlaps(spot, { width: 360, height: 92 }, B(278, 216, 638, 308)), JSON.stringify(spot));   // settled box plus the 4px margin
  r.win.close();
});
