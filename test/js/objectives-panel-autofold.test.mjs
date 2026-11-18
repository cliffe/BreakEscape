// Objectives panel on desktop: open at mission start for a while, then folded to a one-line
// summary (m08/m09 blind runs: the open list covered a third of the view). jsdom, real module.
// Run with: node test/js/objectives-panel-autofold.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true, writable: true });
const { ObjectivesPanel } = await import(pathToFileURL(join(root, 'js/ui/objectives-panel.js')).href);

const aims = [{ aimId: 'a', title: 'Work the suspects', status: 'active',
  tasks: [{ taskId: 't1', title: 'One', status: 'completed' }, { taskId: 't2', title: 'Two', status: 'active' }] }];
const make = () => {
  document.body.innerHTML = '';
  window.getTutorialManager = undefined;
  return new ObjectivesPanel({ addListener() {}, removeListener() {}, getActiveAims: () => aims });
};

test('shouldAutoCollapse: only when nothing says the player is using the panel', () => {
  const base = { compact: false, collapsed: false, userTouched: false, hovering: false, focusInside: false, done: false };
  assert.equal(ObjectivesPanel.shouldAutoCollapse(base), true);
  for (const k of ['compact', 'collapsed', 'userTouched', 'hovering', 'focusInside', 'done']) {
    assert.equal(ObjectivesPanel.shouldAutoCollapse({ ...base, [k]: true }), false, k);
  }
});

test('opens expanded, folds once after AUTO_COLLAPSE_MS, and shows the summary text', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const p = make();
  assert.equal(p.isCollapsed, false);
  const toggle = p.container.querySelector('.objectives-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS - 1);
  assert.equal(p.isCollapsed, false);
  mock.timers.tick(1);
  assert.equal(p.isCollapsed, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(p.container.querySelector('.objectives-pill-count').textContent, '1/2');
  assert.equal(p.container.querySelector('.objectives-pill-text').textContent, 'Work the suspects');
  // reopened by the player: it does not fold again
  p.toggleCollapse();
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS * 3);
  assert.equal(p.isCollapsed, false);
  p.destroy();
  mock.timers.reset();
});

test('a player toggle before the fold cancels it; hover postpones it', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let p = make();
  p.toggleCollapse(); p.toggleCollapse();   // closed then open again
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
  assert.equal(p.isCollapsed, false, 'touched: never auto-folds');
  p.destroy();

  p = make();
  p.container.dispatchEvent(new window.MouseEvent('mouseenter'));
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, false, 'hovered: held open');
  p.container.dispatchEvent(new window.MouseEvent('mouseleave'));
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_RETRY_MS);
  assert.equal(p.isCollapsed, true, 'hover ended: folds at the next look');
  p.destroy();
  mock.timers.reset();
});

test('a new aim re-arms the fold for an untouched, open panel', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let listener;
  document.body.innerHTML = '';
  const p = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => aims });
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true);
  p.setCollapsed(false);   // opened by code, not by a click: still untouched
  listener([...aims, { aimId: 'b', title: 'Second', status: 'active', tasks: [{ taskId: 'b1', title: 'B', status: 'active' }] }]);
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true, 'folded again after the new aim');
  p.destroy();
  mock.timers.reset();
});

test('phones keep the pill behaviour: no timer-driven change', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  window.innerWidth = 400;
  const p = make();
  assert.equal(p.isCollapsed, true, 'starts as a pill');
  p.setCollapsed(false);
  mock.timers.tick(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
  assert.equal(p.isCollapsed, false, 'an opened sheet is not folded under the player');
  window.innerWidth = 1280;
  p.destroy();
  mock.timers.reset();
});

test('folded desktop panel pulses for news and lets the toast show; open one does not', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const p = make();
  assert.equal(p.foldToast('New aim', 'x'), false);
  assert.equal(p.container.classList.contains('pill-pulse'), false, 'open: no pulse');
  p.setCollapsed(true);
  assert.equal(p.foldToast('New aim', 'x'), false, 'toast still shows on desktop');
  assert.equal(p.container.classList.contains('pill-pulse'), true);
  p.destroy();
  mock.timers.reset();
});

test('CSS: pixel rules, desktop height cap, folded summary shown', () => {
  const css = readFileSync(join(root, 'css/objectives.css'), 'utf8');
  assert.match(css, /\.objectives-panel \{[^}]*max-height: 46vh/s);
  assert.match(css, /\.objectives-panel\.collapsed \.objectives-pill-summary \{\s*display: flex/);
  assert.equal(/border-radius/.test(css), false, 'no radius');
});
