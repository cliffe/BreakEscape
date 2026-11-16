// Toasts over panels, step 4: the real applyLanes places the toast block over an open panel
// (placeNotifyBlock). jsdom has no layout: every box is given by hand, and a toast's height is
// its data-h attribute (clones keep it), so the block-height clone path runs for real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyLanes, startHudLanes, failOpenToasts, measureMinigame, PANEL_THROTTLE_MS } from '../../public/break_escape/js/ui/hud-lanes.js';

function rig(vw = 915, vh = 412) {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const win = dom.window;
  Object.defineProperty(win, 'innerWidth', { value: vw, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: vh, configurable: true });
  win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) {
      const r = this._r;
      return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[3] - r[1] };
    }
    // A toast, or a clone of one: placed by its inline style, as high as data-h says
    if (this.classList?.contains('notification') && this.dataset.h) {
      const w = parseFloat(this.style.width) || 300;
      const h = Number(this.dataset.h);
      if (this.parentElement?.id === 'notification-container' && this.style.display === 'none') return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
      return { left: 0, top: 0, right: w, bottom: h, width: w, height: h };
    }
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  };
  const doc = win.document;
  const add = (html, rect, parent = doc.body) => {
    const t = doc.createElement('template');
    t.innerHTML = html;
    const el = t.content.firstElementChild;
    if (rect) el._r = rect;
    parent.appendChild(el);
    return el;
  };
  win.MinigameFramework = { currentMinigame: {} };
  const container = add('<div id="notification-container"></div>');
  const toast = (type, h = 100, extra = '') => {
    const el = add(`<div class="notification ${type} show ${extra}" data-h="${h}"></div>`, null, container);
    el._toast = { type, shownAt: Date.now(), duration: 5000 };
    return el;
  };
  return { win, doc, add, container, toast };
}

// The PIN pad at 915x412 with its keys under the right-hand end of the lane
function pinScene({ add }) {
  const mg = add('<div class="minigame-container"></div>', [78, 20, 838, 390]);
  add('<div class="minigame-game-container"></div>', [78, 20, 838, 390], mg);
  add('<div class="minigame-header">Enter PIN</div>', [98, 30, 506, 60], mg);
  add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  const keys = [];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 3; i++) keys.push(add('<button class="pin-key">1</button>', [545 + i * 82, 70 + row * 48, 625 + i * 82, 110 + row * 48], mg));
  }
  return { mg, keys };
}

const px = (v) => parseInt(v, 10);
const boxOfBlock = (c, h) => ({ left: px(c.style.left), top: px(c.style.top), right: px(c.style.left) + px(c.style.width), bottom: px(c.style.top) + h });
const touches = (a, b, m = 4) => a.left < b.right + m && b.left < a.right + m && a.top < b.bottom + m && b.top < a.bottom + m;

test('a warning over the PIN pad moves clear of the title, the X and the keys, and the lane sums count it as 0', () => {
  const r = rig();
  pinScene(r);
  r.toast('warning', 100);
  applyLanes(r.doc, r.win);
  const hl = r.win.__hudLanes;
  assert.equal(hl.notifyAway, true);
  assert.equal(typeof hl.toastSpot, 'function');
  assert.equal(typeof hl.pendingAnswers, 'function');
  const box = boxOfBlock(r.container, 100);
  const m = measureMinigame(r.doc, r.win);
  for (const b of [...m.titles, ...m.controls]) assert.ok(!touches(box, b), `${JSON.stringify(box)} over ${JSON.stringify(b)}`);
  assert.ok(r.container.querySelector('.notification').classList.contains('placed-over-panel'));
  // The second pass reads notifyAway and counts the block as 0; a third changes nothing
  applyLanes(r.doc, r.win);
  const second = { top: r.container.style.top, left: r.container.style.left, width: r.container.style.width };
  assert.equal(r.win.__hudLanes.measured.notifyContent, 0);
  applyLanes(r.doc, r.win);
  assert.deepEqual({ top: r.container.style.top, left: r.container.style.left, width: r.container.style.width }, second);
  r.win.close();
});

test('with nothing in the way the block stays in the lane and no class is set', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 200, 400, 390]);
  r.add('<button class="far">ok</button>', [100, 300, 200, 340], mg);
  r.toast('warning', 60);
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, false);
  assert.ok(!r.container.querySelector('.placed-over-panel'));
  r.win.close();
});

test('freeing the lane brings the block back: lane place, maxHeight none, class cleared', () => {
  const r = rig();
  const { keys } = pinScene(r);
  r.toast('warning', 100);
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, true);
  for (const k of keys) k.style.display = 'none';
  r.doc.querySelector('.minigame-header')._r = [98, 300, 506, 330];
  r.doc.querySelector('.minigame-close-button')._r = [40, 300, 66, 326];
  applyLanes(r.doc, r.win);
  const n = r.win.__hudLanes.lanes.notify;
  assert.equal(r.win.__hudLanes.notifyAway, false);
  assert.equal(px(r.container.style.top), Math.round(n.top));
  assert.equal(px(r.container.style.left), Math.round(n.left));
  assert.equal(r.container.style.maxHeight, 'none');
  assert.ok(!r.container.querySelector('.placed-over-panel'));
  r.win.close();
});

test('closing the panel puts the block back in the lane with the class cleared', () => {
  const r = rig(1280, 800);
  const pop = r.add('<div id="laptop-popup" style="display: block"></div>', [0, 0, 1280, 800]);
  const screen = r.add('<div class="laptop-screen"></div>', [20, 20, 1260, 780], pop);
  r.add('<div class="title-bar"></div>', [20, 20, 1260, 300], screen);
  r.add('<button class="minigame-close-button">x</button>', [1220, 30, 1250, 60], screen);
  r.win.MinigameFramework = {};
  r.toast('warning', 100);
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, true, 'the title bar covers the lane');
  const box = boxOfBlock(r.container, 100);
  assert.ok(!touches(box, { left: 20, top: 20, right: 1260, bottom: 300 }));
  pop.style.display = 'none';
  applyLanes(r.doc, r.win);
  assert.equal(r.win.__hudLanes.notifyAway, false);
  assert.ok(!r.container.querySelector('.placed-over-panel'));
  r.win.close();
});

test('the block keeps clear of a ringing banner', () => {
  const r = rig(390, 844);
  const mg = r.add('<div class="minigame-container"></div>', [10, 10, 380, 830]);
  r.add('<div class="minigame-header">EHR</div>', [20, 20, 370, 75], mg);
  r.add('<button class="minigame-close-button">x</button>', [330, 30, 360, 60], mg);
  r.add('<button class="row">r</button>', [20, 650, 370, 840], mg);
  const layer = r.add('<div id="phone-ring-layer"></div>', [16, 84, 374, 178]);
  r.add('<div class="incoming-call"></div>', [16, 84, 374, 178], layer);
  r.toast('warning', 100);
  applyLanes(r.doc, r.win);
  const ring = r.win.__hudLanes.ringSpot;
  assert.ok(ring.box, 'the banner box is recorded');
  const box = boxOfBlock(r.container, 100);
  assert.ok(!touches(box, ring.box), `${JSON.stringify(box)} vs banner ${JSON.stringify(ring.box)}`);
  r.win.close();
});

test('a pending toast: answered stack when it fits, left out of the lane sums and of the yield logic', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 200, 400, 390]);
  r.add('<button class="far">ok</button>', [100, 300, 200, 340], mg);
  const p = r.toast('error', 80, 'toast-pending');
  p.classList.remove('show');
  p._toast.arrivedAt = Date.now();
  const answers = [];
  p._onReplace = (a) => answers.push(a);
  applyLanes(r.doc, r.win);
  assert.deepEqual(answers, ['stack']);
  assert.ok(!p.classList.contains('hud-lane-yield'));
  r.win.close();
});

test('with no panel open every pending toast is answered stack', () => {
  const r = rig();
  r.win.MinigameFramework = {};
  const p = r.toast('warning', 80, 'toast-pending');
  const answers = [];
  p._onReplace = (a) => answers.push(a);
  applyLanes(r.doc, r.win);
  assert.deepEqual(answers, ['stack']);
  assert.equal(r.win.__hudLanes.notifyAway, false);
  r.win.close();
});

test('fail open: the stylesheet spot and every waiting toast answered stack', () => {
  const r = rig();
  pinScene(r);
  r.toast('warning', 100);
  applyLanes(r.doc, r.win);
  const p = r.toast('error', 80, 'toast-pending');
  const answers = [];
  p._onReplace = (a) => answers.push(a);
  failOpenToasts(r.doc, r.win);
  for (const k of ['top', 'left', 'width', 'maxHeight']) assert.equal(r.container.style[k], '', k);
  assert.ok(!r.container.querySelector('.placed-over-panel'));
  assert.deepEqual(answers, ['stack']);
  assert.equal(r.win.__hudLanes.notifyAway, false);
  r.win.close();
});

test('an applyLanes that throws inside the relayout frame fails open', async () => {
  const r = rig();
  pinScene(r);
  const p = r.toast('warning', 100, 'toast-pending');
  const answers = [];
  p._onReplace = (a) => answers.push(a);
  Object.defineProperty(r.win, 'innerWidth', { get() { throw new Error('boom'); }, configurable: true });
  const h = startHudLanes(r.doc, r.win);
  await new Promise(res => setTimeout(res, 60));
  assert.ok(answers.includes('stack'));
  h.stop();
  r.win.close();
});

test('mutations inside the panel 10 ms apart give one relayout plus a trailing one; timing marks only when asked', async () => {
  const r = rig();
  const { keys } = pinScene(r);
  r.toast('warning', 100);
  let runs = 0;
  r.win.__hudLanesTiming = true;
  // jsdom has no user timing: a small stand-in records marks and measures
  const marks = new Set();
  Object.assign(r.win.performance, { mark: (n) => marks.add(n), measure: () => { runs++; }, clearMarks: (n) => marks.delete(n) });
  const h = startHudLanes(r.doc, r.win);
  await new Promise(res => setTimeout(res, 60));
  const before = runs;
  assert.ok(before >= 1, 'the first relayout recorded a measure');
  assert.equal(marks.size, 0, 'no marks left behind');
  for (let i = 0; i < 5; i++) { keys[0].classList.toggle('lit'); await new Promise(res => setTimeout(res, 10)); }
  await new Promise(res => setTimeout(res, PANEL_THROTTLE_MS + 60));
  const extra = runs - before;
  assert.ok(extra >= 1 && extra <= 3, `relayouts from 5 mutations: ${extra}`);
  r.win.__hudLanesTiming = false;
  const atOff = runs;
  keys[1].classList.toggle('lit');
  await new Promise(res => setTimeout(res, PANEL_THROTTLE_MS + 60));
  assert.equal(runs, atOff, 'no measure with the flag off');
  h.stop();
  r.win.close();
});
