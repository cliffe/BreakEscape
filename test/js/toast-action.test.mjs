// Toast action button (follow-up A2): options.action = { label, onPress }. The real notifications.js
// (imports stubbed) in jsdom, loaded as toast-a11y.test.mjs does.
// Run with: node test/js/toast-action.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = new JSDOM('<!doctype html><body></body>').window;
globalThis.document = window.document;
const N = await import(dataUrl(readFileSync(join(root, 'js/systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => globalThis.__panelOpen === true;')}'`)));

function page({ panel = false } = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.__panelOpen = panel;
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 3_000_000 });
  return dom.window;
}
const tick = (ms) => mock.timers.tick(ms);
const done = (win) => { mock.timers.reset(); globalThis.__panelOpen = false; win.close(); };
const toasts = () => [...document.querySelectorAll('.notification')];

test('no action: no button, markup as before', () => {
  const win = page();
  const el = N.showNotification('Plain', 'info', '', 0);
  assert.equal(el.querySelector('.notification-action'), null);
  assert.deepEqual([...el.children].map((c) => c.className), ['notification-message', 'notification-close']);
  const bad = [{ label: '', onPress() {} }, { label: 'Go' }, { label: 5, onPress() {} }, { label: 'Go', onPress: 'x' }, null];
  for (const [i, action] of bad.entries()) {
    const e = N.showNotification(`Bad ${i}`, 'info', '', 0, { action });
    assert.equal(e.querySelector('.notification-action'), null, `invalid action ${i}`);
  }
  done(win);
});

test('the label is text, the button follows the message and sits outside it', () => {
  const win = page();
  const el = N.showNotification('Hash collected', 'info', '', 0, { action: { label: '<b>Crack</b>', onPress() {} } });
  const btn = el.querySelector('button.notification-action');
  assert.equal(btn.type, 'button');
  assert.equal(btn.textContent, '<b>Crack</b>');
  assert.equal(btn.querySelector('b'), null);
  const msg = el.querySelector('.notification-message');
  assert.equal(msg.nextElementSibling, btn);
  assert.equal(msg.contains(btn), false);
  assert.equal(msg.textContent, 'Hash collected');
  done(win);
});

test('a press calls onPress once and the toast goes; a throw is caught', () => {
  const win = page();
  let calls = 0;
  const el = N.showNotification('Go?', 'info', '', 0, { action: { label: 'Go', onPress() { calls++; throw new Error('boom'); } } });
  const err = mock.method(console, 'error', () => {});
  const btn = el.querySelector('.notification-action');
  btn.click();
  btn.click();
  err.mock.restore();
  assert.equal(calls, 1);
  tick(400);
  assert.equal(toasts().length, 0);
  done(win);
});

test('Enter and Space on the button do not bubble', () => {
  const win = page();
  const el = N.showNotification('Keys', 'info', '', 0, { action: { label: 'Go', onPress() {} } });
  const seen = [];
  document.addEventListener('keydown', (e) => seen.push(`d${e.key}`));
  document.addEventListener('keyup', (e) => seen.push(`u${e.key}`));
  const btn = el.querySelector('.notification-action');
  // As the close X: keydown of Enter and Space, and keyup of Space, stop at the button
  for (const key of ['Enter', ' ']) btn.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true }));
  btn.dispatchEvent(new win.KeyboardEvent('keyup', { key: ' ', bubbles: true }));
  btn.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
  assert.deepEqual(seen, ['da']);
  done(win);
});

test('a toast held behind a panel keeps a working button when released', () => {
  const win = page({ panel: true });
  let calls = 0;
  assert.equal(N.showNotification('Held', 'info', '', 0, { action: { label: 'Open', onPress() { calls++; } } }), null);
  assert.equal(toasts().length, 0);
  globalThis.__panelOpen = false;
  tick(2000);
  assert.equal(toasts().length, 1);
  const btn = document.querySelector('.notification-action');
  assert.equal(btn.textContent, 'Open');
  btn.click();
  assert.equal(calls, 1);
  done(win);
});

test('an action toast is never low priority', () => {
  assert.equal(N.isLowPriorityToast('info', '', { low: true }), true);
  assert.equal(N.isLowPriorityToast('info', '', { low: true, action: { label: 'Go', onPress() {} } }), false);
  assert.equal(N.isLowPriorityToast('info', '', { low: true, action: { label: '' , onPress() {} } }), true);
});

test('the stylesheet gives the button pointer events and a focus style', () => {
  const css = readFileSync(join(root, 'css/notifications.css'), 'utf8');
  const rule = css.match(/\.notification-action \{[^}]*\}/)[0];
  assert.match(rule, /pointer-events: auto/);
  assert.match(css, /\.notification-action:focus-visible/);
});
