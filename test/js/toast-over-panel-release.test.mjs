// Toasts over panels, step 5 (toast plan section 5): the real showNotification with the real
// hud-lanes over a PIN pad, and the placing details that need both: a released toast slides in
// only after the relayout that places it, zoom, one measure per relayout, the pointer-cursor
// cache, phone texts, resize and a class toggle. jsdom has no layout: boxes are given by hand,
// a toast's height is its data-h attribute (scaled by the zoom of the host it is cloned into).
// Run with: node test/js/toast-over-panel-release.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { applyLanes, startHudLanes, PANEL_THROTTLE_MS } from '../../public/break_escape/js/ui/hud-lanes.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = new JSDOM('<!doctype html><body></body>').window;
globalThis.document = window.document;
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => globalThis.__panelOpen === true;')}'`)));

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const px = (v) => parseInt(v, 10);

function rig(vw = 915, vh = 412) {
  const dom = new JSDOM('<!doctype html><html><head><style>.gone { display: none; }</style></head><body></body></html>', { pretendToBeVisual: true });
  const win = dom.window;
  Object.defineProperty(win, 'innerWidth', { value: vw, configurable: true, writable: true });
  Object.defineProperty(win, 'innerHeight', { value: vh, configurable: true });
  const zoomOfHost = (el) => parseFloat(el.parentElement?.style?.zoom) || 1;
  win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) {
      const r = this._r;
      return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[3] - r[1] };
    }
    if (this.dataset?.h && (this.classList.contains('notification') || this.id === 'npc-bark-container')) {
      const z = zoomOfHost(this);
      const w = (parseFloat(this.style.width) || 300) * z;
      const h = Number(this.dataset.h) * z;
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
  const mg = add('<div class="minigame-container"></div>', [78, 20, 838, 390]);
  add('<div class="minigame-game-container"></div>', [78, 20, 838, 390], mg);
  add('<div class="minigame-header">Enter PIN</div>', [98, 30, 506, 60], mg);
  add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  const keys = [];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 3; i++) keys.push(add('<button class="pin-key">1</button>', [545 + i * 82, 70 + row * 48, 625 + i * 82, 110 + row * 48], mg));
  }
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.__panelOpen = true;
  return { win, doc, add, container, mg, keys };
}

// Remove the toasts (their timers) and stop the lanes
function done(r, h) {
  h?.stop();
  r.doc.querySelectorAll('.notification').forEach((el) => N.removeNotification(el));
  r.win.close();
}

// A real toast over the panel; its height is data-h
function raise(r, type = 'warning', msg = 'careful', h = 100) {
  const el = N.showNotification(msg, type, '', 5000);
  el.dataset.h = String(h);
  return el;
}

test('a released toast slides in only after a relayout has placed it, also with a throttled call pending', async () => {
  const r = rig();
  const log = [];
  const raf = r.win.requestAnimationFrame.bind(r.win);
  r.win.requestAnimationFrame = (fn) => raf((t) => {
    const src = String(fn);
    if (src.includes('applyLanes')) log.push('run');
    fn(t);
  });
  const h = startHudLanes(r.doc, r.win);
  const first = raise(r, 'warning', 'first');
  await wait(150);
  assert.ok(first.classList.contains('show'));
  assert.equal(r.win.__hudLanes.notifyAway, true);
  // A panel mutation starts the throttle; the next toast arrives while its trailing call is pending
  r.keys[0].classList.add('lit');
  const second = raise(r, 'error', 'second', 80);
  let seenAt = null;
  const watch = new r.win.MutationObserver(() => {
    if (!second.classList.contains('toast-pending') && seenAt == null) log.push('released');
    if (second.classList.contains('show') && seenAt == null) seenAt = log.length;
  });
  watch.observe(second, { attributes: true, attributeFilter: ['class'] });
  log.length = 0;
  await wait(PANEL_THROTTLE_MS + 200);
  assert.ok(second.classList.contains('show'), 'the error slid in');
  const before = log.slice(0, seenAt);
  const rel = before.indexOf('released');
  assert.ok(rel >= 0, `released seen: ${before}`);
  assert.ok(before.slice(rel).includes('run'), `a relayout ran between the release and the slide-in: ${before}`);
  done(r, h);
  r.win.close();
});

test('zoom 1.5 and 2.5: widths scaled, the clone is z times the unzoomed height, setPx divides by the zoom', () => {
  for (const z of [1.5, 2.5]) {
    const r = rig(1920, 1080);
    const gcs = r.win.getComputedStyle.bind(r.win);
    r.win.getComputedStyle = (el, ...a) => {
      const cs = gcs(el, ...a);
      if (el.id !== 'notification-container' && el.id !== 'npc-bark-container') return cs;
      return new Proxy(cs, { get: (t, k) => (k === 'zoom' ? String(z) : (typeof t[k] === 'function' ? t[k].bind(t) : t[k])) });
    };
    // The PIN pad scaled up with the page (boxes in screen px)
    r.doc.querySelector('.minigame-container')._r = [100, 60, 1820, 1000];
    r.doc.querySelector('.minigame-header')._r = [140, 80, 1300, 160];
    r.doc.querySelector('.minigame-close-button')._r = [1700, 80, 1780, 160];
    r.keys.forEach((k, i) => { k._r = [1000 + (i % 3) * 200, 200 + Math.floor(i / 3) * 120, 1180 + (i % 3) * 200, 300 + Math.floor(i / 3) * 120]; });
    const t = r.container.appendChild(Object.assign(r.doc.createElement('div'), { className: 'notification warning show' }));
    t.dataset.h = '100';
    t._toast = { type: 'warning', shownAt: Date.now(), duration: 5000 };
    applyLanes(r.doc, r.win);
    const hl = r.win.__hudLanes;
    assert.ok(hl.notifySpot, `a spot at zoom ${z}`);
    const heights = [...t._hudLaneH.values()];
    assert.ok(heights.length >= 1);
    for (const hh of heights) assert.equal(hh, Math.ceil(100 * z), `clone height at zoom ${z}`);
    for (const key of t._hudLaneH.keys()) assert.ok(key.endsWith(`@${z}`), key);
    if (hl.notifyAway) {
      assert.ok(Math.abs(px(r.container.style.width) * z - hl.notifySpot.width) <= z, `width ${r.container.style.width} at zoom ${z}`);
      assert.ok(Math.abs(px(r.container.style.left) * z - hl.notifySpot.left) <= z, 'left');
      assert.ok(Math.abs(px(r.container.style.top) * z - hl.notifySpot.top) <= z, 'top');
    }
    r.win.close();
  }
});

test('one measure per relayout with the banner up, a toast to place and a pending toast to answer', () => {
  const r = rig(390, 844);
  r.doc.querySelector('.minigame-container')._r = [10, 10, 380, 830];
  r.doc.querySelector('.minigame-header')._r = [20, 20, 370, 75];
  r.doc.querySelector('.minigame-close-button')._r = [330, 30, 360, 60];
  r.keys.forEach((k) => { k._r = [20, 650, 370, 840]; });
  const layer = r.add('<div id="phone-ring-layer"></div>', [16, 84, 374, 178]);
  r.add('<div class="incoming-call"></div>', [16, 84, 374, 178], layer);
  r.win.hudLanesRelayout = () => {};
  const shown = raise(r, 'warning', 'one');
  shown.classList.remove('toast-pending');
  shown._toast.pending = false;
  shown._toast.shownAt = Date.now();
  const pending = raise(r, 'error', 'two', 80);
  assert.ok(pending.classList.contains('toast-pending'));
  let measures = 0;
  const qsa = r.doc.querySelectorAll.bind(r.doc);
  r.doc.querySelectorAll = (sel, ...a) => { if (sel === '.minigame-container') measures++; return qsa(sel, ...a); };
  applyLanes(r.doc, r.win);
  assert.equal(measures, 1, 'measureMinigame ran once');
  done(r);
});

test('a pointer-cursor result outside the mutated subtree is not read again', () => {
  const r = rig();
  const gcs = r.win.getComputedStyle.bind(r.win);
  const reads = new Map();
  r.win.getComputedStyle = (el, ...a) => {
    const cs = gcs(el, ...a);
    return new Proxy(cs, { get: (t, k) => { if (k === 'cursor') reads.set(el, (reads.get(el) || 0) + 1); return typeof t[k] === 'function' ? t[k].bind(t) : t[k]; } });
  };
  const inside = r.add('<div class="panel-row">row</div>', [100, 300, 300, 340], r.mg);
  const other = r.add('<div class="other-row">other</div>', [100, 350, 300, 380], r.mg);
  const t = raise(r, 'warning', 'careful');
  t.classList.remove('toast-pending');
  const cursor = { map: new WeakMap(), dirty: null };
  applyLanes(r.doc, r.win, { cursor });
  assert.ok(reads.get(inside) >= 1 && reads.get(other) >= 1, 'read on the first pass');
  const [a, b] = [reads.get(inside), reads.get(other)];
  cursor.dirty = [inside];
  applyLanes(r.doc, r.win, { cursor });
  assert.ok(reads.get(inside) > a, 'inside the mutated subtree: read again');
  assert.equal(reads.get(other), b, 'outside it: the cached result is used');
  r.win.close();
});

test('phone texts move with the toasts over the phone', () => {
  const r = rig(1280, 800);
  r.doc.querySelector('.minigame-container')._r = [100, 20, 1180, 780];
  r.doc.querySelector('.minigame-header')._r = [120, 30, 900, 70];
  r.doc.querySelector('.minigame-close-button')._r = [1130, 30, 1160, 60];
  r.keys.forEach((k, i) => { k._r = [840 + (i % 3) * 100, 100 + Math.floor(i / 3) * 60, 930 + (i % 3) * 100, 150 + Math.floor(i / 3) * 60]; });
  r.add('<div data-minigame="phone-chat"></div>', [100, 20, 700, 780]);
  const phone = r.add('<div id="npc-bark-container" data-h="60"></div>');
  r.add('<div class="npc-bark">hello</div>', null, phone);
  const t = raise(r, 'warning', 'careful', 100);
  t.classList.remove('toast-pending');
  applyLanes(r.doc, r.win);
  const hl = r.win.__hudLanes;
  assert.equal(hl.notifyAway, true, 'the toast left the lane');
  assert.equal(phone.style.left, r.container.style.left);
  assert.equal(phone.style.width, r.container.style.width);
  assert.ok(px(phone.style.top) >= px(r.container.style.top) + 100, `texts under the toasts: ${phone.style.top} vs ${r.container.style.top}`);
  r.win.close();
});

test('a resize places the block again', async () => {
  const r = rig();
  const h = startHudLanes(r.doc, r.win);
  const t = raise(r, 'warning', 'careful');
  await wait(150);
  assert.equal(r.win.__hudLanes.notifyAway, true);
  const before = r.win.__hudLanes.notifySpot;
  r.win.innerWidth = 700;
  r.win.dispatchEvent(new r.win.Event('resize'));
  await wait(150);
  const after = r.win.__hudLanes.notifySpot;
  assert.ok(after && (after.left !== before.left || after.top !== before.top || after.width !== before.width), `${JSON.stringify(before)} then ${JSON.stringify(after)}`);
  assert.ok(t.isConnected);
  done(r, h);
});

test('a class toggle that reveals a button under the toast moves it', async () => {
  const r = rig();
  r.doc.querySelectorAll('.pin-key').forEach((k) => k.remove());
  r.doc.querySelector('.minigame-header')._r = [98, 300, 300, 330];
  r.doc.querySelector('.minigame-close-button')._r = [40, 300, 66, 326];
  const reveal = r.add('<button class="reveal gone">go</button>', [545, 60, 820, 130], r.mg);
  const h = startHudLanes(r.doc, r.win);
  const t = raise(r, 'warning', 'careful');
  await wait(150);
  assert.equal(r.win.__hudLanes.notifyAway, false, 'nothing under the lane yet');
  reveal.classList.remove('gone');
  await wait(PANEL_THROTTLE_MS + 80);
  assert.equal(r.win.__hudLanes.notifyAway, true, 'the revealed button is now in the way');
  assert.ok(t.classList.contains('placed-over-panel'));
  done(r, h);
});
