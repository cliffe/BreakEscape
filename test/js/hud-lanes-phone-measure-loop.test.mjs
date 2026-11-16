// Review R1 M1: with the phone open and a phone text showing, the lanes measure the phone
// container through a clone in a host on body. That host used to set off the lanes' own body
// observer, so a relayout queued another for as long as the text showed (~45 per second).
// Real startHudLanes; jsdom has no layout so boxes are given by hand.
// Run with: node test/js/hud-lanes-phone-measure-loop.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { startHudLanes, applyLanes } from '../../public/break_escape/js/ui/hud-lanes.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function rig({ text = true, toast = false } = {}) {
  const win = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true }).window;
  Object.defineProperty(win, 'innerWidth', { value: 1280, configurable: true });
  Object.defineProperty(win, 'innerHeight', { value: 800, configurable: true });
  win.Element.prototype.getBoundingClientRect = function () {
    if (this._r) { const r = this._r; return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[3] - r[1] }; }
    if (this.dataset?.h) { const h = +this.dataset.h; return { left: 0, top: 0, right: 300, bottom: h, width: 300, height: h }; }
    if (this.classList.contains('npc-bark')) return { left: 0, top: 0, right: 300, bottom: 40, width: 300, height: 40 };
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
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
  add('<button class="minigame-close-button">x</button>', [1130, 30, 1160, 60], mg);
  const phone = add('<div id="npc-bark-container" data-h="60"></div>');
  if (text) add('<div class="npc-bark npc-bark--phone">hello</div>', null, phone);
  if (toast) {
    const t = add('<div class="notification warning show" data-h="100">w</div>', null, container);
    t._toast = { type: 'warning', shownAt: Date.now(), duration: 60000 };
  }
  let runs = 0;
  const raf = win.requestAnimationFrame.bind(win);
  win.requestAnimationFrame = (fn) => raf((t) => { runs++; fn(t); });
  return { win, doc, phone, runs: () => runs };
}

for (const [name, opts] of [['a phone text', { text: true }], ['a phone text and a warning', { text: true, toast: true }]]) {
  test(`relayouts per second with ${name} open are ~0 at rest`, async () => {
    const r = rig(opts);
    const h = startHudLanes(r.doc, r.win);
    await wait(300);
    const before = r.runs();
    await wait(1000);
    const perSecond = r.runs() - before;
    h.stop(); r.win.close();
    assert.ok(perSecond <= 2, `${perSecond} relayouts in the second after start (was ~45)`);
  });
}

test('the body observer alone ignores the measuring host (phone height cache defeated)', async () => {
  const r = rig({ text: true });
  const h = startHudLanes(r.doc, r.win);
  await wait(300);
  // Change the text every pass so the cache cannot hide a loop: only the marker can
  let n = 0;
  const before = r.runs();
  for (let i = 0; i < 5; i++) {
    r.phone.querySelector('.npc-bark').textContent = `text ${++n}`;
    applyLanes(r.doc, r.win);
    await wait(80);
  }
  const after = r.runs() - before;
  h.stop(); r.win.close();
  assert.ok(after <= 2, `${after} queued passes from 5 hand-called passes that each cloned the phone`);
});

test('the phone height is kept between passes and re-measured when the text changes', () => {
  const r = rig({ text: true });
  let clones = 0;
  const append = r.doc.body.appendChild.bind(r.doc.body);
  r.doc.body.appendChild = (n) => { if (n.hasAttribute?.('data-hud-measure')) clones++; return append(n); };
  applyLanes(r.doc, r.win);
  const first = clones;
  applyLanes(r.doc, r.win); applyLanes(r.doc, r.win);
  assert.equal(clones, first, 'no clone for an unchanged text');
  r.phone.querySelector('.npc-bark').textContent = 'a different, longer text';
  applyLanes(r.doc, r.win);
  assert.ok(clones > first, 'a changed text is measured again');
  r.win.close();
});

test('a toast height cached for the wide layout is measured again in the compact one (review R1 m1)', () => {
  const r = rig({ text: false, toast: true });
  const toast = r.doc.querySelector('.notification');
  applyLanes(r.doc, r.win);
  const keys = () => [...(toast._hudLaneH?.keys() || [])];
  const k0 = keys();
  // applyLanes recomputes the flag from the viewport: a narrow one turns it on
  Object.defineProperty(r.win, 'innerWidth', { value: 800, configurable: true });
  applyLanes(r.doc, r.win);
  const k1 = keys();
  r.win.close();
  assert.ok(k0.every(k => k.endsWith('@w')), `wide keys ${k0}`);
  assert.ok(k1.some(k => k.endsWith('@c')), `compact keys ${k1}`);
});
