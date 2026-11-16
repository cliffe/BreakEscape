// Toasts over an open panel (toast plan 2.3 to 2.5): where the toast block goes (toastSpot) and
// what each waiting warning or error is told (pendingAnswers). The boxes in
// fixtures/toast-boxes.json were measured in the browser with the shipped toast CSS.
// Run with: node test/js/toast-spot.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { toastSpot, pendingAnswers, outermostBoxes, TOAST_SPOT_MARGIN, ringLayerSpot } from '../../public/break_escape/js/ui/hud-lanes.js';

const here = dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(readFileSync(join(here, 'fixtures/toast-boxes.json'), 'utf8'));
const get = (size, name) => {
  const c = cases.find(x => x.size === size && x.name === name);
  assert.ok(c, `fixture case ${size} ${name}`);
  return c;
};
const heightOf = (c, pair) => (w) => (pair
  ? (c.heights.warning[w] && c.heights.error[w] ? c.heights.warning[w] + c.gap + c.heights.error[w] : 0)
  : c.heights.warning[w]);
const spotFor = (c, { pair = false, ...more } = {}) => toastSpot({ vw: c.vw, vh: c.vh, lane: c.lane, z: c.z,
  heightAt: heightOf(c, pair), titles: c.titles, xs: c.xs, controls: c.controls, canvases: c.canvases, ...more });
const M = TOAST_SPOT_MARGIN;
const hits = (s, list) => list.filter(r => s.left < r.right + M && r.left < s.left + s.width + M
  && s.top < r.bottom + M && r.top < s.top + (s.maxHeight ?? s.height) + M);
const inViewport = (c, s) => s.left >= 0 && s.left + s.width <= c.vw && s.top >= 0 && s.top + (s.maxHeight ?? s.height) <= c.vh;

const FALLBACK = {
  '915x412 lockpicking': { rung: 2, side: 'lane-side', width: 240, top: 80, left: 659 },
  '915x412 sis-config-threshold': { rung: 3, side: 'lane', controls: 1, titles: 0 },
  '915x412 log-filter': { rung: 3, side: 'left', width: 240, top: 176, controls: 1 },
  '915x412 cryptex': { rung: 3, side: 'lane-side', width: 240, top: 176, left: 659, controls: 1 },
  '390x844 siem-dashboard': { rung: 3, side: 'lane', controls: 2 },
  '390x844 log-filter': { rung: 3, side: 'lane-side', width: 358, top: 112, controls: 1 },
  '800x600 backup-recovery': { rung: 3, side: 'lane-side', width: 768, top: 88, left: 16, controls: 1, titles: 0 },   // Batch 4: tiles fill the panel, see the test below
  '360x740 dusting': { rung: 2, side: 'left', width: 240, top: 8, left: 16 }   // R3: the canvas is no control; the error alone is in the test below
};

test('every case without a fallback lands clear of titles, the X, non-list controls and canvases', () => {
  for (const c of cases) {
    if (FALLBACK[`${c.size} ${c.name}`]) continue;
    if (c.size === '3840x2160' && c.name === 'lockpicking') continue;   // rung 2, below
    const s = spotFor(c);
    assert.equal(s.rung, 0, `${c.size} ${c.name} found a clear place`);
    assert.deepEqual(hits(s, [...c.titles, ...c.xs, ...c.controls.filter(k => !k.listRow), ...c.canvases]), [], `${c.size} ${c.name}`);
    assert.ok(inViewport(c, s), `${c.size} ${c.name} inside the viewport`);
  }
});

test('the no-place cases take the rungs of plan 2.4', () => {
  for (const [key, want] of Object.entries(FALLBACK)) {
    const [size, name] = key.split(' ');
    const s = spotFor(get(size, name));
    assert.equal(s.name, 'fallback', key);
    assert.equal(s.rung, want.rung, key);
    assert.equal(s.side, want.side, key);
    for (const k of ['width', 'top', 'left']) if (want[k] !== undefined) assert.equal(s[k], want[k], `${key} ${k}`);
    if (want.controls !== undefined) assert.equal(s.covers.controls, want.controls, `${key} controls covered`);
    if (want.titles !== undefined) assert.equal(s.covers.titles, want.titles, `${key} title covered`);
  }
  // lockpicking at 915x412: 39 % of the toast over the canvas
  const lp = spotFor(get('915x412', 'lockpicking'));
  assert.equal(Math.round(100 * lp.covers.canvasPx / (lp.width * lp.height)), 39);
});

test('the X and the banner are never covered, pair included, and every place is in the viewport', () => {
  for (const c of cases) {
    for (const pair of [false, true]) {
      const s = spotFor(c, { pair });
      assert.deepEqual(hits(s, c.xs), [], `${c.size} ${c.name} pair=${pair}: X`);
      assert.ok(inViewport(c, s), `${c.size} ${c.name} pair=${pair}: viewport`);
    }
  }
  // A banner over the lane: the toast avoids it, in a clear place and in a fallback
  const ehr = get('1280x800', 'sis01-ehr');
  const banner = { left: ehr.lane.left, top: 170, right: ehr.lane.left + 400, bottom: 260 };
  const s1 = spotFor(ehr, { banner });
  assert.deepEqual(hits(s1, [banner]), []);
  const cx = get('915x412', 'cryptex');
  const b2 = { left: 600, top: 150, right: 915, bottom: 200 };
  const s2 = spotFor(cx, { banner: b2 });
  assert.equal(s2.name, 'fallback');
  assert.deepEqual(hits(s2, [b2, ...cx.xs]), []);
});

test('list rows: siem-dashboard at 915x412 keeps the lane over its alert rows; backup-recovery buttons still block', () => {
  const siem = get('915x412', 'siem-dashboard');
  const s = spotFor(siem);
  assert.equal(s.name, 'lane');
  assert.ok(hits(s, siem.controls.filter(k => k.listRow)).length > 0, 'the lane covers list rows');
  assert.deepEqual(hits(s, siem.controls.filter(k => !k.listRow)), []);
  const br = get('915x412', 'backup-recovery');
  assert.ok(br.controls.every(k => !k.listRow), 'a scrolling panel body is no list');
  assert.notEqual(spotFor(br).name, 'lane');
});

test('the conversation keeps the lane at 1280x800 and 390x844 and goes left 360 at top 112 at 915x412', () => {
  assert.equal(spotFor(get('1280x800', 'sis01-chat')).name, 'lane');
  assert.equal(spotFor(get('390x844', 'sis01-chat')).name, 'lane');
  const s = spotFor(get('915x412', 'sis01-chat'));
  assert.deepEqual([s.side, s.width, s.top, s.left], ['left', 360, 112, 16]);
});

test('CyberChef keeps the lane column', () => {
  for (const size of ['1280x800', '390x844']) {
    const c = get(size, 'popup:cyberchef');
    const s = spotFor(c);
    assert.ok(['lane', 'lane-side'].includes(s.side), size);
    assert.equal(s.left, c.lane.left, size);
    assert.equal(s.width, c.lane.width, size);
  }
});

test('zoomed screens: widths scale with the HUD zoom', () => {
  const l2 = spotFor(get('2560x1440', 'lockpicking'));
  assert.deepEqual([l2.side, l2.width, l2.top], ['left', 360, 128]);   // 240 * 1.5
  const l3 = spotFor(get('3840x2160', 'lockpicking'));
  assert.deepEqual([l3.rung, l3.side, l3.width, l3.top], [2, 'left', 600, 1552]);   // 240 * 2.5
  assert.equal(Math.round(100 * l3.covers.canvasPx / (l3.width * l3.height)), 26);
  const ib = spotFor(get('1920x1080', 'intel-board'));
  assert.deepEqual([ib.side, ib.width, ib.top], ['lane-side', 360, 88]);
  // only widths not wider than the lane: 480 * 2.5 = 1200 is tried at 3840 (lane 1500), 480 is not at 390
  const tried = [];
  toastSpot({ vw: 390, vh: 844, lane: { top: 84, left: 16, width: 358 }, z: 1, heightAt: (w) => { tried.push(w); return 100; },
    titles: [{ left: 0, top: 0, right: 390, bottom: 844 }] });
  assert.ok(!tried.includes(480) && !tried.includes(360), `widths tried: ${tried}`);
});

test('a current place still clear is kept; the lane wins back when clear', () => {
  const c = get('1280x800', 'sis01-ehr');
  const first = spotFor(c);
  assert.equal(first.name, 'moved');
  // a place further down that is also clear is kept rather than jumping to the nearest
  const current = { left: first.left, top: first.top + 40, width: first.width };
  const kept = spotFor(c, { current });
  assert.equal(kept.name, 'current');
  assert.equal(kept.top, first.top + 40);
  // with the panel's boxes gone, the lane comes back even though the current place is clear
  const back = toastSpot({ vw: c.vw, vh: c.vh, lane: c.lane, z: 1, heightAt: heightOf(c, false), current });
  assert.equal(back.name, 'lane');
});

test('sis-config-threshold 1280x800 pair takes rung 1 (centred, 600, top 40, over the title)', () => {
  const s = spotFor(get('1280x800', 'sis-config-threshold'), { pair: true });
  assert.deepEqual([s.rung, s.side, s.width, s.top], [1, 'centre', 600, 40]);
  assert.equal(s.covers.titles, 1);
});

test('rung 3: a place over the title and fewer controls beats a title-free place over more', () => {
  const s = spotFor(get('390x844', 'm01-pin'), { pair: true });
  assert.equal(s.rung, 3);
  assert.equal(s.covers.titles, 1);
  assert.equal(s.covers.controls, 1);
  // and on a tie the title-free place wins
  const tie = toastSpot({ vw: 400, vh: 300, lane: { top: 20, left: 16, width: 368 }, heightAt: () => 260,
    titles: [{ left: 16, top: 8, right: 200, bottom: 18 }], controls: [{ left: 20, top: 100, right: 380, bottom: 120 }] });
  assert.equal(tie.rung, 3);
  assert.equal(tie.covers.controls, 1);
  assert.equal(tie.covers.titles, 0);
});

test('rung 3 counts outermost controls only', () => {
  const row = { left: 0, top: 0, right: 100, bottom: 20 };
  const cell = { left: 10, top: 2, right: 50, bottom: 18 };
  assert.deepEqual(outermostBoxes([row, cell]), [row]);
  assert.deepEqual(outermostBoxes([row, { ...row }]), [row]);
});

test('a block too tall for every place takes rung 4, under the X, cut at the viewport bottom', () => {
  const xs = [{ left: 360, top: 20, right: 390, bottom: 50 }];
  const s = toastSpot({ vw: 400, vh: 300, lane: { top: 30, left: 16, width: 368 }, heightAt: () => 500, xs, titles: xs });
  assert.equal(s.rung, 4);
  assert.equal(s.width, 368);
  assert.equal(s.top, 54);
  assert.equal(s.maxHeight, 300 - 8 - 54);
  assert.deepEqual(hits(s, xs), []);
});

test('clearOnly gives null when there is no clear place', () => {
  const c = get('915x412', 'cryptex');
  assert.equal(spotFor(c, { clearOnly: true }), null);
  assert.ok(spotFor(get('915x412', 'biometrics'), { clearOnly: true }));
});

// ------------------------------------------------------------------ pendingAnswers (plan 2.5)

const el = (name) => ({ name });
const T0 = 1_000_000;
const never = () => false;
const answersOf = (a) => Object.fromEntries(pendingAnswers(a).map(x => [x.el.name, typeof x.answer === 'string' ? x.answer : x.answer.name]));

test('stack when the block with it has a clear place', () => {
  const e1 = el('e1');
  assert.deepEqual(answersOf({ block: [], pending: [{ el: e1, type: 'error', arrivedAt: T0 }], now: T0, spotFor: () => true }), { e1: 'stack' });
});

test('the block grows by each toast answered stack in the same pass', () => {
  const seen = [];
  pendingAnswers({ block: [], pending: [{ el: el('a'), type: 'error', arrivedAt: T0 }, { el: el('b'), type: 'error', arrivedAt: T0 }],
    now: T0, spotFor: (list) => { seen.push(list.length); return true; } });
  assert.deepEqual(seen, [1, 2]);
});

test('an error with no error shown replaces a shown warning; with nothing shown it stacks', () => {
  const w = el('w');
  assert.deepEqual(answersOf({ block: [{ el: w, type: 'warning', shownAt: T0, duration: 5000 }],
    pending: [{ el: el('e'), type: 'error', arrivedAt: T0 + 100 }], now: T0 + 100, spotFor: never }), { e: 'w' });
  assert.deepEqual(answersOf({ block: [], pending: [{ el: el('e'), type: 'error', arrivedAt: T0 }], now: T0, spotFor: never }), { e: 'stack' });
  // two waiting errors with only a warning shown are both given that warning
  assert.deepEqual(answersOf({ block: [{ el: w, type: 'warning', shownAt: T0, duration: 5000 }],
    pending: [{ el: el('e1'), type: 'error', arrivedAt: T0 }, { el: el('e2'), type: 'error', arrivedAt: T0 }], now: T0, spotFor: never }),
  { e1: 'w', e2: 'w' });
});

test('an error with one error shown stacks beside it; a shown warning stays', () => {
  const block = [{ el: el('e1'), type: 'error', shownAt: T0, duration: 5000 }, { el: el('w'), type: 'warning', shownAt: T0, duration: 5000 }];
  assert.deepEqual(answersOf({ block, pending: [{ el: el('e2'), type: 'error', arrivedAt: T0 + 200 }], now: T0 + 200, spotFor: never }), { e2: 'stack' });
});

test('an error with two errors shown targets the oldest timed one; two waiting errors get different targets', () => {
  const block = [{ el: el('e1'), type: 'error', shownAt: T0, duration: 5000 }, { el: el('e2'), type: 'error', shownAt: T0 + 200, duration: 5000 }];
  assert.deepEqual(answersOf({ block, pending: [{ el: el('e3'), type: 'error', arrivedAt: T0 + 400 }, { el: el('e4'), type: 'error', arrivedAt: T0 + 500 }],
    now: T0 + 500, spotFor: never }), { e3: 'e1', e4: 'e2' });
  // a third waiting error has no target left: wait
  assert.equal(answersOf({ block, pending: ['a', 'b', 'c'].map(n => ({ el: el(n), type: 'error', arrivedAt: T0 })), now: T0, spotFor: never }).c, 'wait');
});

test('sticky errors are never targeted: wait when both shown errors are sticky; the timed one beside a sticky is', () => {
  const sticky = [{ el: el('s1'), type: 'error', shownAt: T0, duration: 0 }, { el: el('s2'), type: 'error', shownAt: T0 + 100, duration: 0 }];
  assert.deepEqual(answersOf({ block: sticky, pending: [{ el: el('e'), type: 'error', arrivedAt: T0 + 200 }], now: T0 + 200, spotFor: never }), { e: 'wait' });
  const mixed = [{ el: el('s1'), type: 'error', shownAt: T0, duration: 0 }, { el: el('t'), type: 'error', shownAt: T0 + 100, duration: 5000 }];
  assert.deepEqual(answersOf({ block: mixed, pending: [{ el: el('e'), type: 'error', arrivedAt: T0 + 200 }], now: T0 + 200, spotFor: never }), { e: 't' });
});

test('a warning with a warning shown replaces it', () => {
  assert.deepEqual(answersOf({ block: [{ el: el('w1'), type: 'warning', shownAt: T0, duration: 5000 }],
    pending: [{ el: el('w2'), type: 'warning', arrivedAt: T0 + 100 }], now: T0 + 100, spotFor: never }), { w2: 'w1' });
});

test('a warning with only errors shown waits for the oldest error\'s 5 s or its own 5 s', () => {
  const block = [{ el: el('e1'), type: 'error', shownAt: T0, duration: 5000 }];
  const pending = [{ el: el('w'), type: 'warning', arrivedAt: T0 + 500 }];
  assert.equal(answersOf({ block, pending, now: T0 + 4999, spotFor: never }).w, 'wait');
  assert.equal(answersOf({ block, pending, now: T0 + 5000, spotFor: never }).w, 'stack');
  // its own wait: errors that showed later still let it go 5 s after it arrived
  const late = [{ el: el('e2'), type: 'error', shownAt: T0 + 400, duration: 0 }];
  assert.equal(answersOf({ block: late, pending: [{ el: el('w'), type: 'warning', arrivedAt: T0 }], now: T0 + 4999, spotFor: never }).w, 'wait');
  assert.equal(answersOf({ block: late, pending: [{ el: el('w'), type: 'warning', arrivedAt: T0 }], now: T0 + 5000, spotFor: never }).w, 'stack');
});

test('errors are answered before warnings whatever the arrival order; no panel: every answer is stack', () => {
  const order = pendingAnswers({ block: [], pending: [{ el: el('w'), type: 'warning', arrivedAt: T0 }, { el: el('e'), type: 'error', arrivedAt: T0 + 1 }],
    now: T0, spotFor: () => true }).map(x => x.el.name);
  assert.deepEqual(order, ['e', 'w']);
  const block = [{ el: el('e1'), type: 'error', shownAt: T0, duration: 0 }, { el: el('e2'), type: 'error', shownAt: T0, duration: 0 }];
  assert.deepEqual(answersOf({ block, pending: [{ el: el('e'), type: 'error', arrivedAt: T0 }], now: T0, spotFor: never, panelOpen: false }), { e: 'stack' });
});

// ---- the banner (ringLayerSpot) no longer treats toasts as obstacles; the toast avoids the banner
const RB = (left, top, right, bottom) => ({ left, top, right, bottom });
const EHR390 = { vw: 390, vh: 844, size: { width: 358, height: 94 }, lane: { top: 84, left: 16, width: 358 },
  titles: [RB(20, 20, 370, 75)], frame: RB(10, 10, 380, 830) };

test('banner: a toast in the lane is ignored and there is no lane-below spot', () => {
  const controls = [RB(320, 30, 360, 70), RB(20, 650, 370, 840), RB(20, 90, 370, 100)];
  const toast = RB(16, 84, 374, 227);
  const s = ringLayerSpot({ ...EHR390, controls, toasts: [toast] });
  assert.notEqual(s.name, 'lane-below');
  assert.deepEqual(s, ringLayerSpot({ ...EHR390, controls }), 'the same answer with or without toasts');
  const free = ringLayerSpot({ ...EHR390, controls: [RB(320, 30, 360, 70), RB(20, 650, 370, 840)], toasts: [toast] });
  assert.equal(free.name, 'lane', 'the lane spot is taken even under a toast');
  assert.equal(free.top, 84);
});

test('banner: with every spot blocked it falls back to the top centre last', () => {
  const controls = [RB(0, 60, 390, 844)];
  const s = ringLayerSpot({ ...EHR390, controls, toasts: [] });
  assert.deepEqual(s, { name: 'default', top: 12, left: 16 });
});

test('banner source: no lane-below and no toasts in ringLayerSpot', () => {
  const src = readFileSync(join(here, '../../public/break_escape/js/ui/hud-lanes.js'), 'utf8');
  const body = src.slice(src.indexOf('export function ringLayerSpot'), src.indexOf('// ------------------------------------------------------------ toasts over an open panel'));
  assert.ok(body.length > 100);
  assert.doesNotMatch(body, /lane-below|toasts/);
});

// ------------------------------------------------------------------ R3: sweep A classification

const errorSpot = (c, { pair = false, ...more } = {}) => toastSpot({ vw: c.vw, vh: c.vh, lane: c.lane, z: c.z,
  heightAt: pair ? heightOf(c, true) : (w) => c.heights.error[w], titles: c.titles, xs: c.xs, controls: c.controls, canvases: c.canvases, ...more });
const nonList = (c) => [...c.titles, ...c.xs, ...c.controls.filter(k => !k.listRow), ...c.canvases];

test('backup-recovery 1280x800: the warning or the error alone keeps clear of every control (only the text bar is covered); the pair has no place and takes rung 3', () => {
  const c = get('1280x800', 'backup-recovery');
  for (const [what, s] of [['warning', spotFor(c)], ['error', errorSpot(c)]]) {
    assert.equal(s.rung, 0, what);
    assert.deepEqual(hits(s, nonList(c)), [], what);
    assert.deepEqual([s.left, s.top, s.width], [660, 368, 600], `${what}: the place measured live`);
  }
  const pair = errorSpot(c, { pair: true });
  assert.equal(pair.rung, 3);
  assert.equal(pair.covers.controls, 1);
  assert.equal(pair.covers.titles, 0);
});

test('dusting 360x740: no clear place and no rung-1 place (the canvas fills the gap), so the toast takes rung 2 over the canvas, never rung 3 over it as a control', () => {
  const c = get('360x740', 'dusting');
  assert.equal(c.canvases.length, 1);
  assert.ok(!c.controls.some(k => k.left === c.canvases[0].left && k.top === c.canvases[0].top), 'the canvas is not also a control');
  const s = errorSpot(c);
  assert.equal(s.rung, 2);
  assert.deepEqual([s.side, s.top, s.width], ['lane-side', 72, 328]);
  assert.equal(s.covers.titles, 0);
  assert.deepEqual(hits(s, c.xs), []);
});

test('combination 390x844 and episode-runner 360x740: the error alone is clear; the pair never covers the X', () => {
  for (const [size, name] of [['390x844', 'combination'], ['360x740', 'episode-runner']]) {
    const c = get(size, name);
    const one = errorSpot(c);
    assert.equal(one.rung, 0, `${size} ${name}`);
    assert.deepEqual(hits(one, nonList(c)), [], `${size} ${name}`);
    const pair = errorSpot(c, { pair: true });
    assert.equal(pair.rung, 3, `${size} ${name} pair`);
    assert.deepEqual(hits(pair, c.xs), [], `${size} ${name} pair: X`);
  }
});

// ------------------------------------------------------------------ Batch 4: 800x600

test('backup-recovery 800x600: the tiles fill the panel, so one tile is covered at rung 3 (the least possible); the X and the heading stay clear and the tile is still clickable below the toast', () => {
  const c = get('800x600', 'backup-recovery');
  for (const [what, s] of [['warning', spotFor(c)], ['error', errorSpot(c)]]) {
    assert.equal(s.name, 'fallback', what);
    assert.equal(s.rung, 3, what);
    assert.equal(s.covers.controls, 1, `${what}: the first tile only`);
    assert.deepEqual(hits(s, c.xs), [], `${what}: X`);
    assert.deepEqual(hits(s, c.titles), [], `${what}: heading`);
    // The tile is one button: the toast ends above its bottom edge, so part of it can be clicked
    const tile = c.controls.find(k => k.listRow === false && k.left === 38 && k.top === 96);
    assert.ok(tile && s.top + s.height < tile.bottom - 20, `${what}: tile bottom stays clear`);
  }
  // No place is clear for any toast (there is no band as tall as one), so rung 3 is the floor
  const none = (w) => toastSpot({ vw: c.vw, vh: c.vh, lane: c.lane, z: c.z, heightAt: () => w, titles: c.titles, xs: c.xs,
    controls: c.controls, canvases: c.canvases, clearOnly: true });
  assert.equal(none(115), null);
  assert.equal(none(60), null, 'even a 60 px block has no band: the panel is wall to wall');
});

test('cryptex 800x600: the warning or the error alone has a clear place; only the pair has none and takes rung 3', () => {
  const c = get('800x600', 'cryptex');
  for (const [what, s] of [['warning', spotFor(c)], ['error', errorSpot(c)]]) {
    assert.equal(s.rung, 0, what);
    assert.deepEqual(hits(s, nonList(c)), [], what);
    assert.deepEqual([s.side, s.left, s.top, s.width], ['centre', 160, 56, 480], what);
  }
  const pair = errorSpot(c, { pair: true });
  assert.equal(pair.rung, 3);
  assert.deepEqual(hits(pair, c.xs), []);
});
