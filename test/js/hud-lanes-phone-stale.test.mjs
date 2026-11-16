// Review R2 M1 and m1 (toast over controls build). Real applyLanes; jsdom has no layout, so boxes are given by hand.
// M1: the cached phone-text height followed only the texts' textContent, so a headshot unhidden on
// image load (no text change) or a dismissed text sliding out left a stale height.
// m1: a warning that stepped aside (hud-lane-yield) was never told to stand down.
// Run with: node test/js/hud-lanes-phone-stale.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyLanes } from '../../public/break_escape/js/ui/hud-lanes.js';

function rig() {
  const win = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true }).window;
  Object.defineProperty(win, 'innerWidth', { value: 1280, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: 800, configurable: true });
  const R = (l, t, r, b) => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t });
  const barkH = (b) => (b.querySelector('.npc-bark-head') && !b.querySelector('.npc-bark-head').hidden ? 40 : 20);
  win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) return R(...this._r);
    if (this.dataset?.h) return R(0, 0, 300, +this.dataset.h);
    if (this.id === 'npc-bark-container') return R(0, 0, 300, [...this.querySelectorAll('.npc-bark')].reduce((h, b) => h + barkH(b), 0));
    if (this.classList.contains('npc-bark')) return R(0, 0, 300, barkH(this));
    return R(0, 0, 0, 0);
  };
  const doc = win.document;
  const add = (html, rect, parent = doc.body) => {
    const t = doc.createElement('template'); t.innerHTML = html;
    const el = t.content.firstElementChild; if (rect) el._r = rect; parent.appendChild(el); return el;
  };
  win.MinigameFramework = { currentMinigame: {} };
  const container = add('<div id="notification-container"></div>');
  const mg = add('<div class="minigame-container" data-minigame="phone-chat"></div>', [100, 20, 1180, 780]);
  add('<div class="minigame-header">Phone</div>', [120, 30, 1170, 70], mg);
  const phone = add('<div id="npc-bark-container"></div>');
  let clones = 0;
  const append = doc.body.appendChild.bind(doc.body);
  doc.body.appendChild = (n) => { if (n.hasAttribute?.('data-hud-measure')) clones++; return append(n); };
  const bark = (txt, head = true) => add(`<div class="npc-bark npc-bark--phone">${head ? '<span class="npc-bark-head" hidden></span>' : ''}<span>${txt}</span></div>`, null, phone);
  return { win, doc, add, container, phone, bark, clones: () => clones };
}
const cached = (phone) => [...phone._hudLaneH.values()];

test('M1: a headshot that unhides on load is measured again', () => {
  const r = rig();
  const b = r.bark('Sam: hi');
  applyLanes(r.doc, r.win);
  assert.deepEqual(cached(r.phone), [20]);
  b.querySelector('.npc-bark-head').hidden = false;
  applyLanes(r.doc, r.win);
  assert.deepEqual(cached(r.phone), [40], 'the cache follows the head');
  r.win.close();
});

test('M1: at rest nothing is cloned again', () => {
  const r = rig();
  const b = r.bark('Sam: hi');
  applyLanes(r.doc, r.win);
  b.querySelector('.npc-bark-head').hidden = false;
  applyLanes(r.doc, r.win);
  const n = r.clones();
  applyLanes(r.doc, r.win); applyLanes(r.doc, r.win);
  assert.equal(r.clones(), n);
  r.win.close();
});

test('M1: a pass during a text\'s slide-out does not leave its height behind', () => {
  const r = rig();
  r.bark('one', false);
  const two = r.bark('two', false);
  applyLanes(r.doc, r.win);
  assert.deepEqual(cached(r.phone), [40]);
  two._removing = true;            // dismissed: still in the DOM for 300 ms
  applyLanes(r.doc, r.win);
  two.remove();                    // gone; the remaining text's signature is the one from before
  applyLanes(r.doc, r.win);
  assert.deepEqual(cached(r.phone), [20], 'measured with the leaving text gone');
  r.win.close();
});

test('M1: a text marked leaving, and a clear-all that changes display, each end the cached height', () => {
  const r = rig();
  r.bark('one', false);
  const two = r.bark('two', false);
  const clear = r.add('<button class="npc-bark-clear-all">Clear</button>', null, r.phone);
  applyLanes(r.doc, r.win);
  const sig0 = r.phone._hudLaneSig;
  const cache0 = r.phone._hudLaneH;
  two._removing = true;
  applyLanes(r.doc, r.win);
  assert.notEqual(r.phone._hudLaneSig, sig0, 'the leaving flag is in the signature');
  assert.notEqual(r.phone._hudLaneH, cache0, 'and drops the cached heights');
  two._removing = false;
  applyLanes(r.doc, r.win);
  const sig1 = r.phone._hudLaneSig, cache1 = r.phone._hudLaneH;
  clear.style.display = 'none';
  applyLanes(r.doc, r.win);
  assert.notEqual(r.phone._hudLaneSig, sig1, 'the clear-all display is in the signature');
  assert.notEqual(r.phone._hudLaneH, cache1);
  r.win.close();
});

test('m1: a warning that stepped aside still hears that it is not superseded', () => {
  const r = rig();
  const calls = [];
  const w = (cls, h, type) => {
    const t = r.add(`<div class="notification ${type} ${cls} show" data-h="${h}">w</div>`, null, r.container);
    t._toast = { type, shownAt: Date.now(), duration: 60000 };
    t._onSupersede = (on) => calls.push([type, on]);
    return t;
  };
  // A warning that stepped aside for a finished-task line (a brief toast keeps it aside)
  const old = w('hud-lane-yield', 100, 'warning'); w('brief', 60, 'info');
  applyLanes(r.doc, r.win);
  const aside = old.classList.contains('hud-lane-yield');
  r.win.close();
  assert.ok(aside, 'setup: the warning stepped aside');
  assert.ok(calls.some(([c, on]) => c === 'warning' && on === false), JSON.stringify(calls));
});

test('m1: the fail-open path cancels an armed supersede', () => {
  const r = rig();
  const calls = [];
  const t = r.add('<div class="notification warning show" data-h="100">w</div>', null, r.container);
  t._toast = { type: 'warning', shownAt: Date.now(), duration: 60000 };
  // An armed countdown, as notifications.js arms one: cancelled only by being told false
  let armed = setTimeout(() => {}, 60000);
  t._onSupersede = (on) => { calls.push(on); if (!on) { clearTimeout(armed); armed = null; } };
  Object.defineProperty(t._toast, 'shownAt', { get() { throw new Error('boom'); } });   // throws inside the block, before the supersede loop
  const dbg = console.debug; console.debug = () => {};
  try { applyLanes(r.doc, r.win); } finally { console.debug = dbg; }
  r.win.close();
  clearTimeout(armed);
  assert.ok(calls.includes(false), JSON.stringify(calls));
  assert.equal(armed, null, 'the armed timer was cleared');
});
