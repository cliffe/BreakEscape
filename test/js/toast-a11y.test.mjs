// Toasts, step 5 (toast plan 2.7, section 5): screen-reader regions, the X as a real button, and
// source checks on the stylesheet rules the look depends on. The real notifications.js (imports
// stubbed) in jsdom. Enter and Space on a button click it natively in a browser; jsdom does not,
// so those tests check the handlers stop the keys and that click closes.
// Run with: node test/js/toast-a11y.test.mjs
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

function page({ panel = false, patch } = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>');
  if (patch) patch(dom.window);
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.__panelOpen = panel;
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 3_000_000 });
  return dom.window;
}
const tick = (ms) => mock.timers.tick(ms);
const region = (id) => document.getElementById(id);
const text = (id) => region(id)?.textContent ?? null;
const done = (win) => { mock.timers.reset(); win.close(); };

test('each type is announced once in the right region: errors in the alert region, the rest polite', () => {
  const win = page();
  N.showNotification('Door is locked', 'error', 'Locked', 0);
  tick(1);
  assert.equal(text('toast-live-alert'), 'Locked: Door is locked');
  assert.equal(region('toast-live-alert').getAttribute('role'), 'alert');
  assert.equal(text('toast-live-polite'), null, 'nothing in the polite region yet');
  for (const [type, msg] of [['warning', 'Careful'], ['info', 'Noted'], ['success', 'Done']]) {
    N.showNotification(msg, type, '', 0);
    tick(1);
    assert.equal(text('toast-live-polite'), msg, type);
    assert.equal(text('toast-live-alert'), 'Locked: Door is locked', `${type} leaves the alert region alone`);
  }
  const polite = region('toast-live-polite');
  assert.equal(polite.getAttribute('aria-live'), 'polite');
  assert.equal(polite.getAttribute('aria-atomic'), 'true');
  done(win);
});

test('R3 m1: announcements from separate tasks within a frame or two join instead of overwriting', () => {
  const frames = [];
  const win = page({ patch: (w) => { w.requestAnimationFrame = (cb) => frames.push(cb); } });
  N.announceToast('info', 'X1 first task line');
  tick(2);   // a second task, 2 ms later, in the same frame
  N.announceToast('info', 'X2 second task line');
  tick(1);
  assert.equal(text('toast-live-polite'), '', 'nothing is written until the frames have passed, so X1 is not there to be overwritten');
  frames.splice(0).forEach((cb) => cb());   // first frame
  tick(1);
  N.announceToast('info', 'X3 a frame later');
  frames.splice(0).forEach((cb) => cb());   // second frame
  tick(1);
  assert.equal(text('toast-live-polite'), 'X1 first task line. X2 second task line. X3 a frame later.', 'one write holds all three, in order');
  done(win);
});

test('R3 m1: a tab that never runs a frame still announces, by the fallback timer', () => {
  const win = page({ patch: (w) => { w.requestAnimationFrame = () => {}; } });
  N.announceToast('info', 'Hidden tab line');
  tick(N.ANNOUNCE_FALLBACK_MS + 1);
  assert.equal(text('toast-live-polite'), 'Hidden tab line');
  done(win);
});

test('the same message twice is announced twice: the region is emptied first and filled a tick later', () => {
  const win = page();
  const a = N.showNotification('Saved', 'info', '', 0);
  tick(1);
  assert.equal(text('toast-live-polite'), 'Saved');
  N.removeNotification(a);
  tick(400);
  N.showNotification('Saved', 'info', '', 0);
  assert.equal(text('toast-live-polite'), '', 'emptied at once');
  tick(1);
  assert.equal(text('toast-live-polite'), 'Saved', 'set again next tick');
  done(win);
});

test('a held info toast is announced when released, not before', () => {
  const win = page({ panel: true });
  assert.equal(N.showNotification('Password accepted', 'info', '', 5000), null, 'held behind the panel');
  tick(1000);
  assert.equal(text('toast-live-polite'), null, 'silent while held');
  globalThis.__panelOpen = false;
  tick(400);
  tick(1);
  assert.equal(text('toast-live-polite'), 'Password accepted');
  assert.ok(document.querySelector('#notification-container .notification'));
  done(win);
});

test('the regions are children of body, not of the toast container', () => {
  const win = page();
  N.showNotification('x', 'error', '', 0);
  N.showNotification('y', 'info', '', 0);
  tick(1);
  for (const id of ['toast-live-alert', 'toast-live-polite']) {
    assert.equal(region(id).parentNode, document.body, id);
    assert.ok(region(id).classList.contains('toast-live-region'));
  }
  assert.equal(document.querySelectorAll('#notification-container .toast-live-region').length, 0);
  assert.equal(document.querySelectorAll('.toast-live-region').length, 2, 'one of each, reused');
  done(win);
});

test('a document with no body does not break a toast', () => {
  const win = page({ patch: (w) => Object.defineProperty(w.document, 'body', { get: () => null, configurable: true }) });
  let el;
  assert.doesNotThrow(() => { el = N.showNotification('careful', 'warning', '', 0); tick(20); });
  assert.ok(el && el.classList.contains('show'));
  done(win);
});

test('the X is a button labelled Close, not focused on show; Enter and Space stop at it', () => {
  const win = page();
  const heard = [];
  for (const t of ['keydown', 'keyup', 'click']) document.addEventListener(t, (e) => heard.push(`${t}:${e.key ?? ''}`));
  const el = N.showNotification('Door is locked', 'error', 'Locked', 0);
  tick(20);
  const x = el.querySelector('.notification-close');
  assert.equal(x.tagName, 'BUTTON');
  assert.equal(x.getAttribute('type'), 'button');
  assert.equal(x.getAttribute('aria-label'), 'Close');
  assert.ok(document.activeElement !== x);
  const key = (type, k) => x.dispatchEvent(new win.KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }));
  key('keydown', 'Enter');
  key('keyup', 'Enter');
  key('keydown', ' ');
  key('keyup', ' ');
  assert.ok(!heard.some((h) => h.startsWith('keydown:Enter') || h.startsWith('keydown: ') || h.startsWith('keyup: ')), `document heard ${heard}`);
  key('keydown', 'Escape');
  assert.ok(heard.includes('keydown:Escape'), 'other keys still reach the document');
  assert.ok(!el._toast.closing, 'keys alone do not close it here (the browser clicks a button on Enter and Space)');
  x.click();
  assert.ok(el._toast.closing, 'click closes');
  done(win);
});

test('with a stub that keeps only the last listener, click with no argument closes; key handlers with no event do nothing', () => {
  const kept = [];
  const win = page({ patch: (w) => {
    w.Element.prototype.addEventListener = function (type, fn) { if (this.classList?.contains('notification-close')) kept.push([type, fn]); this.__last = fn; };
  } });
  const el = N.showNotification('careful', 'warning', '', 0);
  const x = el.querySelector('.notification-close');
  assert.equal(x.__last, kept[kept.length - 1][1], 'click is added last');
  assert.deepEqual(kept.map(([t]) => t), ['keydown', 'keyup', 'click']);
  assert.doesNotThrow(() => { kept[0][1](); kept[1][1](); });
  assert.ok(!el._toast.closing);
  x.__last();
  assert.ok(el._toast.closing);
  done(win);
});

// Source checks on the stylesheets
const css = readFileSync(join(root, 'css/notifications.css'), 'utf8');
const themes = readFileSync(join(root, 'css/ui-themes.css'), 'utf8');
const block = (src, sel) => {
  const i = src.indexOf(`\n${sel} {`);
  assert.ok(i >= 0, `rule ${sel}`);
  return src.slice(i, src.indexOf('}', i));
};
const specificity = (sel) => (sel.match(/\.[\w-]+/g) || []).length;

test('the coarse-pointer X target reaches 44 px unthemed and themed', () => {
  assert.match(css, /@media \(max-width: 600px\), \(pointer: coarse\) \{\s*\.notification-close::after \{[^}]*inset: -14px/);
  const rule = block(css, '.notification-close');
  const size = Number(/\n\s*width: (\d+)px/.exec(rule)[1]);
  const border = Number(/border: (\d+)px solid/.exec(rule)[1]);
  assert.ok(size - 2 * border + 28 >= 44, `unthemed ${size - 2 * border + 28}`);
  const themed = Number(/--ui-small-button-px: (\d+)px/.exec(themes)[1]);
  assert.equal(border, 4);
  assert.equal(themed, 6);
  assert.ok(size - 2 * themed + 28 >= 44, `themed ${size - 2 * themed + 28}`);
});

test('the compact lift rules come after the clamp rules and are at least as specific', () => {
  const clamp = [
    ['body.hud-compact .notification-title', 'body.hud-compact .notification.placed-over-panel .notification-title'],
    ['body.hud-compact .notification:not(.verbatim) .notification-message', 'body.hud-compact .notification.placed-over-panel:not(.verbatim) .notification-message'],
    ['body.hud-compact .notification.warning:not(.verbatim) .notification-message', 'body.hud-compact .notification.warning.placed-over-panel:not(.verbatim) .notification-message'],
    ['body.hud-compact .notification.error:not(.verbatim) .notification-message', 'body.hud-compact .notification.error.placed-over-panel:not(.verbatim) .notification-message'],
  ];
  for (const [old, lift] of clamp) {
    const a = css.indexOf(`\n${old}`);
    const b = css.indexOf(lift);
    assert.ok(a >= 0 && b > a, `${lift} after ${old}`);
    assert.ok(specificity(lift) >= specificity(old), lift);
  }
});

test('both padding rules keep 48 px on the right for the X', () => {
  assert.match(block(css, '.notification'), /padding: \d+px 48px \d+px \d+px;/);
  assert.match(block(css, 'body.hud-compact .notification'), /padding: \d+px 48px \d+px \d+px;/);
});

test('the announcement is cleared after it has been read, so a gone toast leaves no text behind', () => {
  const win = page();
  N.showNotification("This reader needs a fingerprint. You haven't lifted any prints yet.", 'error', 'Fingerprint Reader', 5000);
  tick(1);
  assert.match(text('toast-live-alert'), /^Fingerprint Reader: /);
  tick(N.ANNOUNCE_CLEAR_MS - 10);
  assert.match(text('toast-live-alert'), /^Fingerprint Reader: /, 'still there while it is being read');
  tick(20);
  assert.equal(text('toast-live-alert'), '', 'gone once read');
  tick(10000);
  assert.equal(document.querySelectorAll('.notification').length, 0, 'toast gone');
  assert.ok(!document.body.textContent.includes('Fingerprint Reader'), 'nothing left in the page text');
  done(win);
});

test('a newer announcement in the same region is not cleared by the older timer', () => {
  const win = page();
  N.showNotification('First', 'info', '', 0);
  tick(1);
  tick(N.ANNOUNCE_CLEAR_MS - 2000);
  N.showNotification('Second', 'info', '', 0);
  tick(1);
  tick(2500);   // the first one's timer is past
  assert.equal(text('toast-live-polite'), 'Second', 'the second is still being read');
  tick(N.ANNOUNCE_CLEAR_MS);
  assert.equal(text('toast-live-polite'), '');
  done(win);
});

test('every exit of the fingerprint reader leaves no reader text in the live regions', () => {
  for (const [type, title, msg, ms] of [
    ['success', 'Biometric Unlock Successful', 'You unlocked the door with X Person\'s fingerprint.', 5000],
    ['error', 'Locked', 'The reader is cold to the touch.', 4000],
    ['error', 'Fingerprint Reader', 'This reader needs a fingerprint.', 5000]
  ]) {
    const win = page();
    const el = N.gameAlert(msg, type, title, ms);
    tick(1);
    N.removeNotification(el);
    tick(400);
    tick(N.ANNOUNCE_CLEAR_MS);
    assert.equal(document.querySelectorAll('.notification').length, 0, `${title}: toast gone`);
    for (const r of document.querySelectorAll('.toast-live-region')) assert.equal(r.textContent, '', `${title}: ${r.id} empty`);
    done(win);
  }
});
