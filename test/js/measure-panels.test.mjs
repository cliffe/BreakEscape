// Toasts over panels, step 3: measureMinigame finds the workstation popups, the close X on its
// own, rows in a scrolling list (listRow) and play canvases. jsdom has no layout, so every box,
// scrollHeight and clientHeight is given by hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { measureMinigame, LIST_FRAME_SHARE } from '../../public/break_escape/js/ui/hud-lanes.js';

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
  // A scroller: overflow-y auto with content taller than its box
  const scroller = (el, clientHeight, scrollHeight = clientHeight + 200) => {
    el.style.overflowY = 'auto';
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
    return el;
  };
  return { win, doc, add, scroller };
}

const sameBox = (a, b) => a.left === b[0] && a.top === b[1] && a.right === b[2] && a.bottom === b[3];
const find = (list, box) => list.find(c => sameBox(c, box));

// A minigame with a 360 px high frame and a list of rows in a scroller of the given height
function listScene(r, { rows = 3, scrollH = 200, frameBody = false } = {}) {
  const mg = r.add('<div class="minigame-container"></div>', [78, 20, 838, 380]);
  const frame = r.add('<div class="minigame-game-container"></div>', [78, 20, 838, 380], mg);
  r.add('<div class="minigame-header">Alerts</div>', [98, 30, 506, 60], mg);
  r.add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], frame);
  r.add('<button class="act">Escalate</button>', [600, 340, 700, 370], frame);
  const body = r.add('<div class="body"></div>', [78, 70, 838, 380], frame);
  if (frameBody) r.scroller(frame, 360);
  const list = r.add('<div class="alert-list"></div>', [98, 80, 818, 80 + scrollH], body);
  r.scroller(list, scrollH);
  for (let i = 0; i < rows; i++) r.add('<div class="alert-row" role="button">row</div>', [98, 80 + i * 40, 818, 116 + i * 40], list);
  return { mg, frame, list };
}

test('a row among 3 like siblings in a scroller under 0.6 of the frame is a list row; other controls are not', () => {
  const r = rig();
  listScene(r, { rows: 3, scrollH: 200 });
  const m = measureMinigame(r.doc, r.win);
  assert.equal(LIST_FRAME_SHARE, 0.6);
  assert.equal(find(m.controls, [98, 80, 818, 116]).listRow, true);
  assert.equal(find(m.controls, [98, 160, 818, 196]).listRow, true);
  assert.equal(find(m.controls, [600, 340, 700, 370]).listRow, false, 'a button outside the list');
  assert.equal(find(m.controls, [805, 28, 831, 54]).listRow, false, 'the X');
  r.win.close();
});

test('the same row with only 2 like siblings is not a list row', () => {
  const r = rig();
  listScene(r, { rows: 2, scrollH: 200 });
  const m = measureMinigame(r.doc, r.win);
  assert.equal(find(m.controls, [98, 80, 818, 116]).listRow, false);
  r.win.close();
});

test('a row in a scroller at 0.6 of the frame or more is not a list row', () => {
  const r = rig();
  listScene(r, { rows: 4, scrollH: 216 });   // 0.6 * 360
  const m = measureMinigame(r.doc, r.win);
  assert.equal(find(m.controls, [98, 80, 818, 116]).listRow, false);
  r.win.close();
});

test('a row whose nearest scroller is the frame itself (a scrolling panel body) is not a list row', () => {
  const r = rig();
  const { list } = listScene(r, { rows: 4, scrollH: 200, frameBody: true });
  list.style.overflowY = 'visible';          // the list no longer scrolls; the frame does
  const m = measureMinigame(r.doc, r.win);
  assert.equal(find(m.controls, [98, 80, 818, 116]).listRow, false);
  r.win.close();
});

test('a row whose nearest scroller holds the frame is not a list row', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 20, 838, 380]);
  const outer = r.add('<div class="outer"></div>', [78, 20, 838, 380], mg);
  r.scroller(outer, 100);                    // small, but an ancestor of the frame
  const frame = r.add('<div class="minigame-game-container"></div>', [78, 20, 838, 380], outer);
  for (let i = 0; i < 4; i++) r.add('<button class="row">r</button>', [98, 80 + i * 40, 818, 116 + i * 40], frame);
  const m = measureMinigame(r.doc, r.win);
  assert.equal(find(m.controls, [98, 80, 818, 116]).listRow, false);
  r.win.close();
});

test('the X is collected in titles and xs; play canvases are collected, the conversation portrait is not', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 20, 838, 380]);
  r.add('<div class="minigame-game-container"></div>', [78, 20, 838, 380], mg);
  r.add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  r.add('<canvas class="dusting-canvas"></canvas>', [120, 80, 520, 360], mg);
  r.add('<canvas class="person-chat-portrait"></canvas>', [100, 40, 400, 300], mg);
  r.add('<canvas class="hidden" style="display: none"></canvas>', [600, 80, 700, 180], mg);
  const m = measureMinigame(r.doc, r.win);
  assert.equal(m.xs.length, 1);
  assert.ok(sameBox(m.xs[0], [805, 28, 831, 54]));
  assert.ok(find(m.titles, [805, 28, 831, 54]));
  assert.equal(m.canvases.length, 1);
  assert.ok(sameBox(m.canvases[0], [120, 80, 520, 360]));
  r.win.close();
});

test('a focusable play canvas is a canvas only, not also a control', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 20, 838, 380]);
  r.add('<div class="minigame-game-container"></div>', [78, 20, 838, 380], mg);
  r.add('<canvas class="dusting-canvas" tabindex="0" role="img"></canvas>', [120, 80, 520, 360], mg);
  r.add('<button class="act">Done</button>', [600, 340, 700, 370], mg);
  const m = measureMinigame(r.doc, r.win);
  assert.equal(m.canvases.length, 1);
  assert.equal(find(m.controls, [120, 80, 520, 360]), undefined);
  assert.ok(find(m.controls, [600, 340, 700, 370]), 'a button is still a control');
  r.win.close();
});

function popup(r, id = 'laptop-popup') {
  const pop = r.add(`<div id="${id}" style="display: block"></div>`, [40, 20, 1240, 780]);
  const frame = r.add('<div class="laptop-frame"></div>', [40, 20, 1240, 780], pop);
  const screen = r.add('<div class="laptop-screen"></div>', [60, 40, 1220, 760], frame);
  const bar = r.add('<div class="title-bar"><span>Crypto Workstation</span></div>', [60, 40, 1220, 80], screen);
  r.add('<button class="minigame-open-new-tab-button">^</button>', [1150, 46, 1176, 72], bar);
  r.add('<button class="minigame-close-button">x</button>', [1184, 46, 1210, 72], bar);
  return pop;
}

test('a shown workstation popup gives its title bar, X and screen frame', () => {
  for (const id of ['laptop-popup', 'lab-popup']) {
    const r = rig(1280, 800);
    popup(r, id);
    const m = measureMinigame(r.doc, r.win);
    assert.ok(find(m.titles, [60, 40, 1220, 80]), `${id}: title bar`);
    assert.ok(find(m.titles, [1184, 46, 1210, 72]), `${id}: X in titles`);
    assert.equal(m.xs.length, 1);
    assert.ok(sameBox(m.xs[0], [1184, 46, 1210, 72]));
    assert.deepEqual(m.frame, { left: 60, top: 40, right: 1220, bottom: 760 });
    r.win.close();
  }
});

test('a hidden workstation popup gives nothing', () => {
  const r = rig(1280, 800);
  const pop = popup(r);
  pop.style.display = 'none';
  const m = measureMinigame(r.doc, r.win);
  assert.deepEqual([m.titles.length, m.xs.length, m.controls.length, m.canvases.length, m.frame], [0, 0, 0, 0, null]);
  r.win.close();
});

test('existing counts are unchanged: the PIN scene still gives 2 titles and 6 controls', () => {
  const r = rig();
  const mg = r.add('<div class="minigame-container"></div>', [78, 20, 838, 390]);
  r.add('<div class="minigame-game-container"></div>', [78, 20, 838, 390], mg);
  r.add('<div class="minigame-header">Enter PIN</div>', [98, 67, 506, 115], mg);
  r.add('<button class="minigame-close-button">x</button>', [805, 28, 831, 54], mg);
  r.add('<div class="pin-minigame-display">----</div>', [545, 70, 789, 110], mg);
  for (let i = 0; i < 3; i++) r.add('<button class="pin-key">1</button>', [545 + i * 82, 114, 625 + i * 82, 154], mg);
  r.add('<div class="clicky" style="cursor: pointer">row</div>', [545, 258, 789, 298], mg);
  const m = measureMinigame(r.doc, r.win);
  assert.equal(m.titles.length, 2);
  assert.equal(m.controls.length, 6);
  assert.ok(m.controls.every(c => c.listRow === false), 'nothing scrolls, so no list rows');
  assert.deepEqual(m.frame, { left: 78, top: 20, right: 838, bottom: 390 });
  r.win.close();
});
