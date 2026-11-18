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
// Mock timers fire a timer scheduled inside a tick only on a later tick, so advance in 1 s steps
const adv = (ms) => { for (let t = 0; t < ms; t += 1000) mock.timers.tick(Math.min(1000, ms - t)); };
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
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS - 1);
  assert.equal(p.isCollapsed, false);
  adv(1);
  assert.equal(p.isCollapsed, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(p.container.querySelector('.objectives-pill-count').textContent, '1/2');
  assert.equal(p.container.querySelector('.objectives-pill-text').textContent, 'Two', 'desktop: names the next task');
  assert.match(p.container.querySelector('.objectives-header').title, /Work the suspects \(1\/2\): Two/);
  assert.equal(p.container.querySelector('.objectives-pill-summary').getAttribute('aria-live'), 'off');
  // reopened by the player: it does not fold again
  p.toggleCollapse();
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 3);
  assert.equal(p.isCollapsed, false);
  p.destroy();
  mock.timers.reset();
});

test('a player toggle before the fold cancels it; hover postpones it', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let p = make();
  p.toggleCollapse(); p.toggleCollapse();   // closed then open again
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
  assert.equal(p.isCollapsed, false, 'touched: never auto-folds');
  p.destroy();

  p = make();
  p.container.dispatchEvent(new window.MouseEvent('mouseenter'));
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, false, 'hovered: held open');
  p.container.dispatchEvent(new window.MouseEvent('mouseleave'));
  adv(ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
  assert.equal(p.isCollapsed, false, 'hover ended: a grace before it folds (R2 n3)');
  adv(ObjectivesPanel.AUTO_COLLAPSE_STEP_MS * ObjectivesPanel.HOVER_GRACE_STEPS);
  assert.equal(p.isCollapsed, true, 'folds once the grace has passed');
  p.destroy();
  mock.timers.reset();
});

test('a new aim re-arms the fold for an untouched, open panel', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let listener;
  document.body.innerHTML = '';
  const p = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => aims });
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true);
  p.setCollapsed(false);   // opened by code, not by a click: still untouched
  listener([...aims, { aimId: 'b', title: 'Second', status: 'active', tasks: [{ taskId: 'b1', title: 'B', status: 'active' }] }]);
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true, 'folded again after the new aim');
  p.destroy();
  mock.timers.reset();
});

test('the fold counts only time the panel is on screen (minigame, hidden, hidden tab)', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const p = make();
  window.MinigameFramework = { currentMinigame: { id: 'person-chat' } };   // the opening briefing
  p._hovering = true;
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS + 5000);
  assert.equal(p.isCollapsed, false, 'a hidden panel is not folded');
  assert.equal(p._hovering, false, 'a hover cannot outlive the hiding');
  delete window.MinigameFramework;
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS - ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
  assert.equal(p.isCollapsed, false, 'still open before its own visible time is up');
  adv(ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
  assert.equal(p.isCollapsed, true, 'folds after the full visible time');
  p.destroy();

  const q = make();
  q.hide();
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
  assert.equal(q.isCollapsed, false, 'hide() pauses the clock');
  q.show();
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(q.isCollapsed, true);
  q.destroy();
  mock.timers.reset();
});

test('keyboard focus inside the panel postpones the fold', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const p = make();
  p.container.querySelector('.objectives-toggle').focus();
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
  assert.equal(p.isCollapsed, false, 'focus inside: held open');
  document.activeElement.blur();
  adv(ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
  assert.equal(p.isCollapsed, true);
  p.destroy();
  mock.timers.reset();
});

test('a new aim reopens a panel the timer folded and re-arms; a player-folded one stays shut', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let listener;
  document.body.innerHTML = '';
  const more = [...aims, { aimId: 'b', title: 'Second', status: 'active', tasks: [{ taskId: 'b1', title: 'B', status: 'active' }] }];
  const p = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => aims });
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true);
  listener(more);
  assert.equal(p.isCollapsed, false, 'reopened for the new aim');
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true, 'folded again');
  p.toggleCollapse();   // the player opens it, then folds it
  p.toggleCollapse();
  assert.equal(p.isCollapsed, true);
  listener([...more, { aimId: 'c', title: 'Third', status: 'active', tasks: [{ taskId: 'c1', title: 'C', status: 'active' }] }]);
  assert.equal(p.isCollapsed, true, 'the player folded it: not reopened');
  p.destroy();
  mock.timers.reset();
});

test('a held ending opens the panel and keeps it open; a player-folded panel pulses and says so', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let listener, held = false;
  window.endingCheck = { hasHeld: () => held, endHeld: () => { held = false; } };
  document.body.innerHTML = '';
  const p = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => aims });
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true);
  held = true;
  listener(aims);
  assert.equal(p.isCollapsed, false, 'opened for the End button');
  assert.ok(p.container.querySelector('.objectives-end-button'), 'button rendered');
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 3);
  assert.equal(p.isCollapsed, false, 'stays open while the button is there');
  assert.equal(p.container.querySelector('.objectives-pill-text').textContent, 'Open to end the mission');
  p.destroy();

  // The player folded it themselves: not reopened, but it blinks and the line says so
  held = false;
  document.body.innerHTML = '';
  const q = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => aims });
  q.toggleCollapse();
  assert.equal(q.isCollapsed, true);
  held = true;
  listener(aims);
  assert.equal(q.isCollapsed, true);
  assert.equal(q.container.classList.contains('pill-pulse'), true);
  assert.equal(q.container.querySelector('.objectives-pill-text').textContent, 'Open to end the mission');
  q.destroy();
  delete window.endingCheck;
  mock.timers.reset();
});

test('a held ending: the button is in a footer outside the scrolling list, even with a long list (R2 m1); the clock stops (R2 n2)', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  let listener, held = false;
  window.endingCheck = { hasHeld: () => held, endHeld: () => { held = false; window.__ended = true; } };
  const many = Array.from({ length: 14 }, (_, i) => ({ aimId: 'x' + i, title: 'Aim ' + i, status: 'active',
    tasks: [{ taskId: 'x' + i + 'a', title: 'Task A' + i, status: 'active' }, { taskId: 'x' + i + 'b', title: 'Task B' + i, status: 'active' }] }));
  document.body.innerHTML = '';
  const p = new ObjectivesPanel({ addListener(f) { listener = f; }, removeListener() {}, getActiveAims: () => many });
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS);
  assert.equal(p.isCollapsed, true);
  held = true;
  listener(many);
  const btn = p.container.querySelector('.objectives-end-button');
  assert.ok(btn, 'button rendered');
  assert.equal(p.content.contains(btn), false, 'not inside the scrolling list');
  assert.equal(p.footer.contains(btn), true, 'in the footer');
  assert.equal(p.footer.hidden, false);
  assert.equal(p.container.lastElementChild, p.footer, 'footer is the panel\'s last child, under the list');
  assert.ok(p.content.querySelectorAll('.objective-aim').length > 10, 'a list taller than any cap');
  assert.equal(p._autoCollapseDone, true, 'fold clock stopped when the hold opened the panel');
  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(window.__ended, true, 'the footer button ends the mission');
  delete window.__ended;
  listener(many);   // hold released: footer goes
  assert.equal(p.footer.hidden, true);
  assert.equal(p.footer.children.length, 0);
  p.destroy();
  delete window.endingCheck;
  mock.timers.reset();
});

test('the folded line names the first open required task, an optional one only as a fallback (R2 m3)', () => {
  const mk = (tasks) => [{ aimId: 'a', title: 'Aim', status: 'active', tasks }];
  const t = (id, status, optional) => ({ taskId: id, title: id, status, optional });
  assert.equal(ObjectivesPanel.nextTaskTitle(mk([t('opt', 'active', true), t('req', 'active')])), 'req');
  assert.equal(ObjectivesPanel.nextTaskTitle(mk([t('opt', 'active', true), t('req', 'completed')])), 'opt');
  assert.equal(ObjectivesPanel.nextTaskTitle(mk([t('a', 'active'), t('b', 'active')])), 'a');
});

test('destroy removes the very listener it added', () => {
  const added = [], removed = [];
  document.body.innerHTML = '';
  const p = new ObjectivesPanel({ addListener(f) { added.push(f); }, removeListener(f) { removed.push(f); }, getActiveAims: () => aims });
  p.destroy();
  assert.equal(added.length, 1);
  assert.equal(removed[0], added[0]);
});

test('phones keep the pill behaviour: no timer-driven change', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  window.innerWidth = 400;
  const p = make();
  assert.equal(p.isCollapsed, true, 'starts as a pill');
  p.setCollapsed(false);
  adv(ObjectivesPanel.AUTO_COLLAPSE_MS * 2);
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
  assert.match(css, /max-width: 1100px[^{]*\{\s*\.objectives-panel \{[^}]*max-height: 38vh/s, 'the mid-size cap is the one that applies at 1280x720');
  assert.match(css, /@media \(min-width: 900px\) and \(min-height: 501px\) \{\s*\.objectives-panel\.collapsed \.objectives-title-text/, 'folded summary scoped to desktop');
  assert.equal(/pill-summary \{[^}]*color: #ddd/.test(css), false, 'summary inherits the theme colour');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /objectives-pill-pulse 0\.5s steps\(1, end\)/);
  assert.match(css, /50%, 100% \{ outline: 2px solid transparent/, 'the pulse turns the outline off');
  assert.equal(/ease/.test(css.match(/\.objectives-panel \{[^}]*\}/s)[0].match(/transition[^;]*/)[0]), false, 'no smooth ease');
  assert.match(css, /\.objectives-panel\.collapsed \.objectives-pill-summary \{\s*display: flex/);
  assert.equal(/border-radius/.test(css), false, 'no radius');
});
