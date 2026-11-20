// Toasts over panels, step 5 (toast plan 2.6, section 5): every way hud-lanes can be absent,
// silent or broken still shows the toast. The real notifications.js (imports stubbed) with the
// real hud-lanes where it matters. jsdom has no layout: boxes are given by hand, a toast's
// height is its data-h attribute.
// Run with: node test/js/toast-fallback-paths.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { startHudLanes } from '../../public/break_escape/js/ui/hud-lanes.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = new JSDOM('<!doctype html><body></body>').window;
globalThis.document = window.document;
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => globalThis.__panelOpen === true;')}'`)));

const T0 = 2_000_000;

// A fresh page with a panel scene (title, X and keys under the lane) and the toast container
function page() {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const win = dom.window;
  Object.defineProperty(win, 'innerWidth', { value: 915, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: 412, configurable: true });
  win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) {
      const r = this._r;
      return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[3] - r[1] };
    }
    if (this.classList?.contains('notification') && this.dataset.h) {
      if (this.dataset.throw) throw new Error('layout boom');
      const w = parseFloat(this.style.width) || 300;
      return { left: 0, top: 0, right: w, bottom: Number(this.dataset.h), width: w, height: Number(this.dataset.h) };
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
  add('<div class="minigame-header">Enter PIN</div>', [98, 30, 506, 60], mg);
  add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.__panelOpen = true;
  return { win, doc, container };
}

const flush = () => new Promise((res) => setTimeout(res, 80));
const pending = (el) => el.classList.contains('toast-pending');

function timers() {
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: T0 });
}
const tick = async (ms) => {
  for (let i = 0; i < ms; i += 10) { mock.timers.tick(10); await Promise.resolve(); }
};

test('no hud-lanes at all (hudLanesRelayout missing): a warning over a panel shows at once, not pending', () => {
  const p = page();
  assert.equal(typeof p.win.hudLanesRelayout, 'undefined');
  const el = N.showNotification('careful', 'warning', '', 5000);
  assert.ok(!pending(el));
  assert.ok(!el._toast.pending);
  assert.equal(el._watchdogTimer, undefined);
  p.win.close();
});

test('__hudLanesDisabled: a warning and an error over a panel show at once', () => {
  const p = page();
  p.win.hudLanesRelayout = () => { throw new Error('must not be called'); };
  p.win.__hudLanesDisabled = true;
  const w = N.showNotification('careful', 'warning', '', 5000);
  const e = N.showNotification('denied', 'error', '', 5000);
  assert.ok(!pending(w) && !pending(e));
  p.win.close();
});

test('hud-lanes present but silent: the watchdog shows the toast at 500 ms and starts its countdown', async () => {
  const p = page();
  timers();
  p.win.hudLanesRelayout = () => {};
  const w = N.showNotification('careful', 'warning', '', 3000);
  assert.ok(pending(w));
  await tick(490);
  assert.ok(pending(w), 'still waiting at 490 ms');
  await tick(20);
  assert.ok(!pending(w) && !w._toast.pending);
  assert.equal(w._countdownAt, T0 + 500);
  await tick(3400);
  assert.ok(w._toast.closing, 'the countdown ran from the release');
  mock.timers.reset();
  p.win.close();
});

test('hud-lanes whose relayout always throws: a waiting warning and error are shown by the watchdog', async () => {
  const p = page();
  timers();
  p.win.hudLanesRelayout = () => { throw new Error('boom'); };
  const w = N.showNotification('careful', 'warning', '', 5000);
  const e = N.showNotification('denied', 'error', '', 5000);
  assert.ok(pending(w) && pending(e));
  // the watchdog (500 ms) is the first release
  await tick(520);
  assert.ok(!pending(w) && !pending(e), 'shown by the watchdog');
  mock.timers.reset();
  p.win.close();
});

test('the watchdog gone, the hard release still shows a waiting warning at 5.5 s', async () => {
  const p = page();
  timers();
  p.win.hudLanesRelayout = () => {};
  const w = N.showNotification('careful', 'warning', '', 5000);
  clearTimeout(w._watchdogTimer);
  w._watchdogTimer = null;
  await tick(5490);
  assert.ok(pending(w));
  await tick(30);
  assert.ok(!pending(w), 'hard release at arrival + 5.5 s');
  mock.timers.reset();
  p.win.close();
});

test('a throwing placeNotifyBlock answers stack: the waiting warning shows and the block goes back to the lane', async () => {
  const p = page();
  const h = startHudLanes(p.doc, p.win);
  const w = N.showNotification('careful', 'warning', '', 5000);
  w.dataset.h = '100';
  w.dataset.throw = '1';
  assert.ok(pending(w));
  await flush();
  assert.ok(!pending(w), 'answered stack by the fail-open');
  assert.ok(!p.container.querySelector('.placed-over-panel'));
  assert.notEqual(p.win.__hudLanes?.notifyAway, true, 'the block is not left away from the lane');
  h.stop();
  p.win.close();
});

test('an applyLanes that throws shows a waiting error at the stylesheet spot', async () => {
  const p = page();
  p.container.style.top = '40px';
  p.container.style.left = '10px';
  p.container.style.width = '200px';
  p.container.style.maxHeight = '90px';
  Object.defineProperty(p.win, 'innerWidth', { get() { throw new Error('boom'); }, configurable: true });
  const h = startHudLanes(p.doc, p.win);
  const e = N.showNotification('denied', 'error', '', 5000);
  e.dataset.h = '80';
  assert.ok(pending(e));
  await flush();
  assert.ok(!pending(e), 'shown well before the 500 ms watchdog');
  assert.ok(e._toast.shownAt - Date.now() > -400, 'released by the fail-open, not the watchdog');
  for (const k of ['top', 'left', 'width', 'maxHeight']) assert.equal(p.container.style[k], '', `${k} back to the stylesheet`);
  h.stop();
  p.win.close();
});
