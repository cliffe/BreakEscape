// Toasts over panels, step 5 (toast plan 2.5, 2.6): warnings and errors over an open panel wait
// as toast-pending until hud-lanes answers; notifications.js owns every timer. Fake timers and
// clock; a jsdom container; a stand-in for hud-lanes that runs the real pendingAnswers with a
// block that has room for `room` toasts, relayouts one frame (16 ms) after a call, and relayouts
// when a toast is added or removed (hud-lanes' container childList observer).
// Run with: node test/js/toast-panel-queue.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { pendingAnswers } from '../../public/break_escape/js/ui/hud-lanes.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => globalThis.__panelOpen === true;')}'`)));

const container = document.getElementById('notification-container');
const T0 = 1_000_000;

// mode 'rules': the real pendingAnswers; 'wait': always 'wait'; 'silent': never answers
function start({ room = 1, mode = 'rules', panel = true } = {}) {
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: T0 });
  container.innerHTML = '';
  document.querySelectorAll('.toast-live-region').forEach((el) => el.remove());
  globalThis.__panelOpen = panel;
  const lanes = { calls: 0, runs: 0, room };
  let queued = false;
  const run = () => {
    queued = false;
    lanes.runs++;
    if (mode === 'silent') return;
    const all = [...container.querySelectorAll('.notification')];
    const shown = all.filter((t) => !t.classList.contains('toast-pending') && !t._toast.closing);
    const pending = all.filter((t) => t.classList.contains('toast-pending') && !t._toast.closing);
    const info = (t) => ({ el: t, type: t._toast.type, shownAt: t._toast.shownAt, arrivedAt: t._toast.arrivedAt, duration: t._toast.duration });
    const answers = mode === 'wait' ? pending.map((el) => ({ el, answer: 'wait' }))
      : pendingAnswers({ block: shown.map(info), pending: pending.map(info), now: Date.now(), panelOpen: globalThis.__panelOpen === true,
        spotFor: (list) => list.length <= lanes.room });
    if (globalThis.__panelOpen && shown.length > lanes.room) {
      const warns = shown.filter((t) => t._toast.type === 'warning');
      warns.slice(0, -1).forEach((t) => t._onSupersede?.());
    }
    for (const { el, answer } of answers) el._onReplace?.(answer);
  };
  window.hudLanesRelayout = () => {
    lanes.calls++;
    if (queued) return;
    queued = true;
    setTimeout(run, 16);
  };
  window.requestAnimationFrame = (fn) => setTimeout(fn, 16);
  window.__hudLanesDisabled = false;
  const mo = new window.MutationObserver(() => window.hudLanesRelayout());
  mo.observe(container, { childList: true });
  lanes.stop = () => { mo.disconnect(); };
  return lanes;
}

function end(lanes) {
  lanes.stop();
  // Everything left goes now, so the module's timers do not leak into the next test
  [...container.querySelectorAll('.notification')].forEach((el) => N.removeNotification(el));
  mock.timers.tick(400);
  mock.timers.reset();
  delete window.hudLanesRelayout;
}

// Advance in 10 ms steps, letting the MutationObserver's microtasks run between steps
async function tickTo(ms, each) {
  while (Date.now() - T0 < ms) {
    mock.timers.tick(10);
    await Promise.resolve();
    each?.();
  }
}
const at = () => Date.now() - T0;
const isShown = (el) => !!el && el.isConnected && !el.classList.contains('toast-pending') && !el._toast.closing;
const isPending = (el) => !!el && el.isConnected && el.classList.contains('toast-pending');
const shownErrors = () => [...container.querySelectorAll('.notification.error')].filter(isShown);
const order = () => [...container.querySelectorAll('.notification')].filter((el) => !el._toast.closing).map((el) => el._toast.message);
const raise = async (t, msg, type, duration = 5000) => { await tickTo(t); return N.showNotification(msg, type, '', duration); };

test('a stand-in hud-lanes that always answers wait: a warning and an error still show by 5.5 s', async () => {
  const lanes = start({ mode: 'wait' });
  const w = N.showNotification('careful', 'warning', '', 5000);
  const e = N.showNotification('denied', 'error', '', 5000);
  assert.ok(isPending(w) && isPending(e));
  assert.ok(!w.classList.contains('show'));
  await tickTo(5490);
  assert.ok(isPending(w) && isPending(e), 'still waiting at 5.49 s');
  await tickTo(5540);
  assert.ok(isShown(w) && isShown(e), 'released by the hard release');
  assert.ok(w.classList.contains('show') && e.classList.contains('show'), 'slid in a frame after the release');
  assert.equal(w._toast.shownAt, T0 + 5500, 'the countdown starts at release, not arrival');
  assert.ok(lanes.calls >= 2);
  end(lanes);
});

test('hud-lanes silent: the watchdog shows the toast at 500 ms and starts its countdown then', async () => {
  const lanes = start({ mode: 'silent' });
  const w = N.showNotification('careful', 'warning', '', 3000);
  await tickTo(490);
  assert.ok(isPending(w));
  assert.equal(w._countdownAt, undefined, 'no countdown while waiting');
  await tickTo(510);
  assert.ok(isShown(w));
  assert.equal(w._countdownAt, T0 + 500);
  end(lanes);
});

test('errors first: a warning shown, then two errors, gives error, error, warning in the container', async () => {
  const lanes = start({ room: 3 });
  const w = N.showNotification('careful', 'warning', '', 8000);
  await tickTo(100);
  assert.ok(isShown(w));
  await raise(200, 'e1', 'error');
  await raise(300, 'e2', 'error');
  await tickTo(400);
  assert.deepEqual(order(), ['e1', 'e2', 'careful']);
  assert.equal(shownErrors().length, 2);
  end(lanes);
});

test('a warning released from waiting ends up after the errors', async () => {
  const lanes = start({ room: 1 });
  await raise(0, 'e1', 'error');
  const w = await raise(300, 'careful', 'warning');
  await tickTo(400);
  assert.ok(isPending(w));
  await raise(600, 'e2', 'error');
  await tickTo(700);
  assert.deepEqual(order(), ['e1', 'e2', 'careful']);
  await tickTo(5200);
  assert.ok(isShown(w));
  assert.deepEqual(order().slice(-1), ['careful']);
  end(lanes);
});

test('error then error 200 ms apart, no room: the second shows at once beside the first', async () => {
  const lanes = start({ room: 1 });
  const a = await raise(0, 'e1', 'error');
  const b = await raise(200, 'e2', 'error');
  await tickTo(260);
  assert.ok(isShown(a) && isShown(b));
  end(lanes);
});

test('three errors 200 ms apart, no room: never more than two shown, the third replaces the first at its 5 s floor, none dropped', async () => {
  const lanes = start({ room: 1 });
  let most = 0;
  const watch = () => { most = Math.max(most, shownErrors().length); };
  const a = await raise(0, 'e1', 'error', 20000);
  const b = await raise(200, 'e2', 'error', 20000);
  const c = await raise(400, 'e3', 'error', 20000);
  await tickTo(4990, watch);
  assert.ok(isShown(a) && isShown(b) && isPending(c));
  await tickTo(5100, watch);
  assert.ok(a._toast.closing, 'the first went at its floor');
  assert.ok(isShown(b) && isShown(c));
  assert.ok(most <= 2, `at most two errors shown, saw ${most}`);
  end(lanes);
});

test('a sticky error is never replaced by a later error: B shows beside it, A still there at 10 s and 60 s', async () => {
  const lanes = start({ room: 1 });
  const a = await raise(0, 'A', 'error', 0);
  const b = await raise(200, 'B', 'error', 5000);
  await tickTo(260);
  assert.ok(isShown(a) && isShown(b));
  await tickTo(10000);
  assert.ok(isShown(a));
  await tickTo(60000);
  assert.ok(isShown(a));
  end(lanes);
});

test('two sticky errors then C: C waits and shows beside both at 5.5 s; closing A first releases it at once', async () => {
  let lanes = start({ room: 1 });
  const a = await raise(0, 'A', 'error', 0);
  const b = await raise(100, 'B', 'error', 0);
  const c = await raise(200, 'C', 'error', 5000);
  await tickTo(5690);
  assert.ok(isPending(c), 'waits behind two sticky errors');
  await tickTo(5740);
  assert.ok(isShown(a) && isShown(b) && isShown(c), 'hard release at 5.5 s from its arrival');
  end(lanes);

  lanes = start({ room: 1 });
  const a2 = await raise(0, 'A', 'error', 0);
  await raise(100, 'B', 'error', 0);
  const c2 = await raise(200, 'C', 'error', 5000);
  await tickTo(1000);
  a2.querySelector('.notification-close').click();
  await tickTo(1400);
  assert.ok(isShown(c2), 'the removal relayout answers it');
  end(lanes);
});

test('a timed error beside a sticky one is the one a third error replaces', async () => {
  const lanes = start({ room: 1 });
  const a = await raise(0, 'A', 'error', 0);
  const b = await raise(100, 'B', 'error', 20000);
  const c = await raise(200, 'C', 'error', 5000);
  await tickTo(5200);
  assert.ok(isShown(a) && b._toast.closing && isShown(c));
  end(lanes);
});

test('warning behind one error, no room: shows at the error floor from its floor timer alone', async () => {
  const lanes = start({ room: 1 });
  const e = await raise(0, 'e1', 'error', 20000);
  const w = await raise(500, 'careful', 'warning');
  await tickTo(4990);
  assert.ok(isPending(w));
  const calls = lanes.calls;
  await tickTo(5050);
  assert.ok(isShown(w), 'shown at the floor');
  assert.ok(isShown(e), 'the error stays');
  assert.equal(lanes.calls - calls, 2, 'woken by the floor timer, then the release relayout');
  end(lanes);
});

test('warning behind three errors: shows by 5.6 s and before any error has gone short of its floor', async () => {
  const lanes = start({ room: 1 });
  const errs = [];
  const early = [];
  const watch = () => errs.forEach((e) => { if (e._toast.closing && !e._seenGone) { e._seenGone = true; if (Date.now() < e._toast.shownAt + 5000) early.push(e._toast.message); } });
  errs.push(await raise(0, 'e1', 'error'));
  errs.push(await raise(200, 'e2', 'error'));
  errs.push(await raise(400, 'e3', 'error'));
  const w = await raise(600, 'careful', 'warning');
  let shownAtMs = null;
  await tickTo(5700, () => { watch(); if (shownAtMs == null && isShown(w)) shownAtMs = at(); });
  assert.ok(shownAtMs != null && shownAtMs <= 5600, `warning shown at ${shownAtMs}`);
  assert.deepEqual(early, []);
  end(lanes);
});

test('warning then error, no room: the error replaces the warning at 1.5 s', async () => {
  const lanes = start({ room: 1 });
  const w = await raise(0, 'careful', 'warning');
  const e = await raise(100, 'denied', 'error');
  await tickTo(1490);
  assert.ok(isShown(w) && isPending(e));
  await tickTo(1560);
  assert.ok(w._toast.closing && isShown(e));
  end(lanes);
});

test('warning then warning: the newer replaces it at 1.5 s; two waiting warnings keep only the newer', async () => {
  let lanes = start({ room: 1 });
  const w1 = await raise(0, 'one', 'warning');
  const w2 = await raise(100, 'two', 'warning');
  await tickTo(1560);
  assert.ok(w1._toast.closing && isShown(w2));
  end(lanes);

  lanes = start({ room: 1 });
  await raise(0, 'e1', 'error', 20000);
  const a = await raise(100, 'one', 'warning');
  const b = await raise(200, 'two', 'warning');
  assert.ok(!a.isConnected, 'the older waiting warning is dropped');
  assert.ok(isPending(b));
  end(lanes);
});

test('two errors waiting on one warning both show, and the warning is removed once', async () => {
  const lanes = start({ room: 1 });
  const w = await raise(0, 'careful', 'warning');
  let removals = 0;
  const orig = w.classList.remove.bind(w.classList);
  w.classList.remove = (...c) => { if (c.includes('show')) removals++; return orig(...c); };
  const e1 = await raise(100, 'e1', 'error');
  const e2 = await raise(150, 'e2', 'error');
  await tickTo(1600);
  assert.ok(isShown(e1) && isShown(e2));
  assert.equal(removals, 1);
  end(lanes);
});

test('a duplicate restart of a targeted error: it is not replaced less than 5 s after the restart', async () => {
  const lanes = start({ room: 1 });
  const a = await raise(0, 'e1', 'error', 20000);
  const b = await raise(200, 'e2', 'error', 20000);
  const c = await raise(400, 'e3', 'error', 20000);
  await raise(3000, 'e1', 'error', 20000);   // the player sees e1 again
  assert.equal(a._toast.shownAt, T0 + 3000);
  let goneAt = null;
  await tickTo(9000, () => { if (goneAt == null && a._toast.closing) goneAt = at(); });
  assert.ok(goneAt == null || goneAt >= 8000, `e1 went at ${goneAt}`);
  assert.ok(isShown(c), 'the third error still shows');
  assert.ok(b._toast.closing, 'the other timed error was replaced instead');
  end(lanes);
});

test('a duplicate of a waiting toast refreshes its time only: no countdown, not counted, same element', async () => {
  const lanes = start({ mode: 'wait' });
  const e = N.showNotification('denied', 'error', '', 5000);
  const again = N.showNotification('denied', 'error', '', 9000);
  assert.equal(again, e);
  assert.equal(e._toast.duration, 9000);
  assert.equal(e._countdownAt, undefined);
  assert.equal(N.shownToasts(container).length, 0);
  assert.equal(N.findShownDuplicate(container, 'denied', 'error', ''), null);
  end(lanes);
});

test('an error shown before a panel opens has a floor timer that wakes the lanes', async () => {
  const lanes = start({ room: 1, panel: false });
  N.showNotification('denied', 'error', '', 20000);
  globalThis.__panelOpen = true;
  await tickTo(4990);
  const calls = lanes.calls;
  await tickTo(5010);
  assert.equal(lanes.calls - calls, 1);
  end(lanes);
});

test('with room both show at once; the panel closing shows everything waiting at once', async () => {
  let lanes = start({ room: 3 });
  const w = await raise(0, 'careful', 'warning');
  const e = await raise(10, 'denied', 'error');
  await tickTo(60);
  assert.ok(isShown(w) && isShown(e));
  end(lanes);

  lanes = start({ room: 1 });
  await raise(0, 'e1', 'error', 20000);
  await raise(100, 'e2', 'error', 20000);
  const c = await raise(200, 'e3', 'error');
  const w2 = await raise(300, 'careful', 'warning');
  await tickTo(1000);
  assert.ok(isPending(c) && isPending(w2));
  globalThis.__panelOpen = false;
  window.hudLanesRelayout();
  await tickTo(1060);
  assert.ok(isShown(c) && isShown(w2));
  end(lanes);
});

test('two warnings shown when a panel opens with no room for both: the older goes at 1.5 s, the rest stay', async () => {
  const lanes = start({ room: 1, panel: false });
  const w1 = await raise(0, 'one', 'warning', 20000);
  const w2 = await raise(100, 'two', 'warning', 20000);
  globalThis.__panelOpen = true;
  await tickTo(300);
  window.hudLanesRelayout();
  await tickTo(1490);
  assert.ok(isShown(w1) && isShown(w2));
  await tickTo(1530);
  assert.ok(w1._toast.closing && isShown(w2));
  end(lanes);
});

test('a stack or wait answer after a scheduled swap cancels it; the same element twice keeps one timer', async () => {
  const lanes = start({ mode: 'silent' });
  const w = N.showNotification('careful', 'warning', '', 20000);
  await tickTo(600);   // watchdog shows it
  const e = N.showNotification('denied', 'error', '', 5000);
  e._onReplace(w);
  const first = e._swapTimer;
  e._onReplace(w);
  assert.equal(e._swapTimer, first, 'same element, same floor: the timer is kept');
  e._onReplace('wait');
  assert.equal(e._swapTimer, null);
  await tickTo(2200);
  assert.ok(isShown(w), 'the cancelled swap removed nothing');
  end(lanes);
});

test('with no panel open nothing waits', async () => {
  const lanes = start({ panel: false });
  const w = N.showNotification('careful', 'warning', '', 5000);
  const e = N.showNotification('denied', 'error', '', 5000);
  assert.ok(!w.classList.contains('toast-pending') && !e.classList.contains('toast-pending'));
  await tickTo(20);
  assert.ok(w.classList.contains('show') && e.classList.contains('show'));
  end(lanes);
});
