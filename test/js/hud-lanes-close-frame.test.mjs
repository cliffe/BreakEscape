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

test('m1: a pass whose answer does not change runs once', () => {
  const r = rig();
  r.win.__hudLanes = { notifyAway: false, notifySpot: null };
  let passes = 0;
  const orig = r.doc.getElementById.bind(r.doc);
  r.doc.getElementById = (id) => { if (id === 'health-ui-container') passes++; return orig(id); };
  applyLanes(r.doc, r.win);
  assert.equal(passes, 1);
  r.win.close();
});
