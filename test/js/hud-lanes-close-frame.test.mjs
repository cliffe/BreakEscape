// Review R3 m1 (toast over controls build): the first pass after a panel closes with the toast
// block away read the old answer, so one frame painted the phone texts over the toasts. The
// pass now settles in the same call when the away answer flips.
// Run with: node test/js/hud-lanes-close-frame.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyLanes } from '../../public/break_escape/js/ui/hud-lanes.js';

function rig() {
  const win = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true }).window;
  Object.defineProperty(win, 'innerWidth', { value: 1280, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: 800, configurable: true });
  const R = (l, t, r, b) => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t });
  win.Element.prototype.getBoundingClientRect = function () {
    if (this.dataset?.h) return R(0, 0, 300, +this.dataset.h);
    if (this.id === 'npc-bark-container' || this.classList.contains('npc-bark')) return R(0, 0, 300, 40);
    return R(0, 0, 0, 0);
  };
  const doc = win.document;
  const c = doc.createElement('div'); c.id = 'notification-container'; doc.body.appendChild(c);
  Object.defineProperty(c, 'scrollHeight', { get: () => 80 });
  const t = doc.createElement('div'); t.className = 'notification info show'; t.dataset.h = '80';
  t._toast = { type: 'info', shownAt: Date.now(), duration: 5000 }; c.appendChild(t);
  const p = doc.createElement('div'); p.id = 'npc-bark-container'; doc.body.appendChild(p);
  const b = doc.createElement('div'); b.className = 'npc-bark npc-bark--phone'; b.textContent = 'Sam: hi'; p.appendChild(b);
  let queued = 0;
  win.__hudLanesStarted = { relayout: () => { queued++; } };
  return { win, doc, c, p, queued: () => queued };
}
const px = (s) => parseFloat(s);

test('m1: the pass after a panel closes puts the phone texts below the toasts at once', () => {
  const r = rig();
  r.win.__hudLanes = { notifyAway: true, notifySpot: { name: 'below-title', top: 300, left: 600, width: 300 } };
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, false, 'setup: the block is back at the lane');
  assert.ok(px(r.p.style.top) >= px(r.c.style.top) + 80, `phone top ${r.p.style.top} below toasts top ${r.c.style.top} + 80`);
  assert.notEqual(r.c.style.maxHeight, 'none', 'the toasts are clamped to the lane again');
  assert.equal(r.queued(), 0, 'no further frame is needed');
  r.win.close();
});

// Counts finished passes: each applyLanesPass ends by assigning win.__hudLanes once
function countPasses(win) {
  let value = win.__hudLanes, passes = 0;
  Object.defineProperty(win, '__hudLanes', { configurable: true, get: () => value, set: (v) => { value = v; passes++; } });
  return () => passes;
}

test('m1: a pass whose answer does not change runs once', () => {
  const r = rig();
  r.win.__hudLanes = { notifyAway: false, notifySpot: null };
  const passes = countPasses(r.win);
  applyLanes(r.doc, r.win);
  assert.equal(passes(), 1);
  r.win.close();
});

test('R4 m3: a flip runs the pass twice (the counter sees both)', () => {
  const r = rig();
  r.win.__hudLanes = { notifyAway: true, notifySpot: { name: 'below-title', top: 300, left: 600, width: 300 } };
  const passes = countPasses(r.win);
  applyLanes(r.doc, r.win);
  assert.equal(passes(), 2);
  r.win.close();
});

// A PIN pad whose keys sit under the lane at 915x412, so the toast block moves away from the lane
function panelRig() {
  const r = rig();
  Object.defineProperty(r.win, 'innerWidth', { value: 915, configurable: true });
  Object.defineProperty(r.win, 'innerHeight', { value: 412, configurable: true });
  const base = r.win.Element.prototype.getBoundingClientRect;
  r.win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) { const q = this._r; return { left: q[0], top: q[1], right: q[2], bottom: q[3], width: q[2] - q[0], height: q[3] - q[1] }; }
    return base.call(this);
  };
  const add = (html, rect, parent = r.doc.body) => {
    const t = r.doc.createElement('template'); t.innerHTML = html;
    const el = t.content.firstElementChild; if (rect) el._r = rect; parent.appendChild(el); return el;
  };
  const mg = add('<div class="minigame-container"></div>', [78, 20, 838, 390]);
  add('<div class="minigame-game-container"></div>', [78, 20, 838, 390], mg);
  add('<div class="minigame-header">Enter PIN</div>', [98, 30, 506, 60], mg);
  add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) add('<button class="pin-key">1</button>', [545 + i * 82, 70 + row * 48, 625 + i * 82, 110 + row * 48], mg);
  r.win.MinigameFramework = { currentMinigame: {} };
  r.p.remove();
  return r;
}

test('R4 m1: a flipping pass with the panel open measures the panel once, not once per pass', () => {
  const r = panelRig();
  r.win.__hudLanes = { notifyAway: false, notifySpot: null };
  const passes = countPasses(r.win);
  let measures = 0;
  const q = r.doc.querySelectorAll.bind(r.doc);
  r.doc.querySelectorAll = (sel) => { if (sel === '.minigame-container') measures++; return q(sel); };
  applyLanes(r.doc, r.win);
  assert.equal(passes(), 2, 'setup: the block moved away from the lane, so there were two passes');
  assert.equal(r.win.__hudLanes.notifyAway, true, 'setup: it is over the panel');
  assert.equal(measures, 1, 'the panel boxes are shared by both passes');
  r.win.close();
});

test('R4 m1: an answer that flips again in the second pass queues one more frame', () => {
  const r = panelRig();
  r.win.__hudLanes = { notifyAway: false, notifySpot: null };
  // The panel is open for the first pass (away becomes true) and closed for the second (away goes back)
  Object.defineProperty(r.win.MinigameFramework, 'currentMinigame', { get: () => (r.win.__hudLanes?.notifyAway ? null : {}) });
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, false, 'setup: the second pass put the block back');
  assert.equal(r.queued(), 1, 'a relayout is queued for the next frame');
  r.win.close();
});
