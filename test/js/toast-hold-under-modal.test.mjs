// Toasts are held while a gameDisplay or gameConfirm modal is open, like under a minigame.
// Fake timers and clock; jsdom; the real notifications.js and modal-stack.js.
// Run with: node test/js/toast-hold-under-modal.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl(readFileSync(join(js, 'ui/modal-stack.js'), 'utf8'))}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => false;')}'`)));

const container = document.getElementById('notification-container');
const T0 = 2_000_000;
const DUR = 5000;

function start() {
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: T0 });
  container.innerHTML = '';
  document.querySelectorAll('.game-confirm-overlay').forEach((el) => el.remove());
}
const shown = () => [...container.querySelectorAll('.notification')].filter((t) => !t._toast.closing);
const texts = () => shown().map((t) => t.textContent).join('|');
const has = (word) => texts().includes(word);
function end() {
  [...container.querySelectorAll('.notification')].forEach((el) => N.removeNotification(el));
  mock.timers.tick(2000);
  mock.timers.reset();
}
function esc() {
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}

test('nothing is held when no modal is open', () => {
  start();
  assert.ok(N.modalDialogOpen() === false, 'no modal open');
  N.gameAlert('Plain toast', 'info', 'Plain', DUR);
  assert.ok(has('Plain toast'), 'toast shows at once');
  mock.timers.tick(DUR + 1500);
  assert.ok(!has('Plain toast'), 'toast expired after its time');
  end();
});

test('a toast raised while gameDisplay is open waits, then shows its full time after the X', () => {
  start();
  const closed = N.gameDisplay('A note', 'Note');
  assert.ok(N.modalDialogOpen() === true, 'modal counted as open');
  N.gameAlert('Note Added', 'success', 'Note Added', DUR);
  assert.ok(!has('Note Added'), 'not visible under the modal');
  mock.timers.tick(DUR + 3000);
  assert.ok(!has('Note Added'), 'still not visible, and did not expire, long after');
  document.querySelector('.game-modal-close').click();
  assert.ok(N.modalDialogOpen() === false, 'modal closed');
  mock.timers.tick(400);
  assert.ok(has('Note Added'), 'shown once the modal closed');
  mock.timers.tick(DUR - 500);
  assert.ok(has('Note Added'), 'still up near the end of its full duration');
  mock.timers.tick(1500);
  assert.ok(!has('Note Added'), 'gone after its full duration');
  void closed;
  end();
});

test('Escape also releases held toasts', () => {
  start();
  N.gameDisplay('A note', 'Note');
  N.gameAlert('Hint once', 'info', 'Hint', DUR);
  assert.ok(!has('Hint once'), 'held while open');
  esc();
  assert.ok(N.modalDialogOpen() === false, 'Escape closed the modal');
  assert.ok(document.querySelector('.game-confirm-overlay') === null, 'overlay removed');
  mock.timers.tick(400);
  assert.ok(has('Hint once'), 'shown after Escape');
  mock.timers.tick(DUR - 500);
  assert.ok(has('Hint once'), 'full duration after Escape');
  end();
});

test('a toast on screen pauses while the modal is open and resumes after', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  assert.ok(has('Older toast'), 'on screen before the modal');
  N.gameDisplay('A note', 'Note');
  assert.ok(has('Older toast'), 'older toast stays on screen (paused, not pulled)');
  mock.timers.tick(DUR * 3);
  assert.ok(has('Older toast'), 'did not expire while paused');
  document.querySelector('.game-modal-close').click();
  mock.timers.tick(2000);
  assert.ok(has('Older toast'), 'still up 2 s after resume (3 s were left)');
  mock.timers.tick(1600);
  assert.ok(!has('Older toast'), 'gone once the remaining time ran out');
  end();
});

test('a toast fired just before the modal is pulled back and replayed after', () => {
  start();
  N.gameAlert('Just before', 'success', 'Before', DUR);
  assert.ok(has('Just before'), 'shown for a moment');
  N.gameDisplay('A note', 'Note');
  assert.ok(!has('Just before'), 'pulled back when the modal opened');
  mock.timers.tick(DUR + 2000);
  document.querySelector('.game-modal-close').click();
  mock.timers.tick(400);
  assert.ok(has('Just before'), 'replayed after close');
  mock.timers.tick(DUR - 500);
  assert.ok(has('Just before'), 'full duration after close');
  end();
});

test('errors are not held by a modal', () => {
  start();
  N.gameDisplay('A note', 'Note');
  N.gameAlert('It broke', 'error', 'Error', DUR);
  assert.ok(has('It broke'), 'error shows at once, as under a minigame');
  document.querySelector('.game-modal-close').click();
  end();
});

test('gameConfirm holds toasts too, and stacked modals release only when the last closes', () => {
  start();
  N.gameDisplay('A note', 'Note');
  const answer = N.gameConfirm('Sure?', 'Yes', 'No');
  N.gameAlert('Behind both', 'info', 'Both', DUR);
  assert.ok(!has('Behind both'), 'held behind two modals');
  esc();
  mock.timers.tick(400);
  assert.ok(!has('Behind both'), 'still held while one modal remains');
  esc();
  mock.timers.tick(400);
  assert.ok(has('Behind both'), 'shown after the last modal closed');
  void answer;
  end();
});
