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
const dashesUrl = dataUrl('export const displayDashes = (s) => s;');
const stackUrl = dataUrl(readFileSync(join(js, 'ui/modal-stack.js'), 'utf8'));   // one instance, shared below
const { openModalCount } = await import(stackUrl);
const E = await import(dataUrl(readFileSync(join(js, 'systems/ending-check.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dashesUrl}'`)));
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${dashesUrl}'`)
  .split("'../ui/modal-stack.js'").join(`'${stackUrl}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export const fullScreenPanelOpen = () => false;')}'`)));

const container = document.getElementById('notification-container');
const T0 = 2_000_000;
const DUR = 5000;
const HOLD_POLL = 300;

function start() {
  mock.timers.reset();
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: T0 });
  container.innerHTML = '';
  document.querySelectorAll('.game-confirm-overlay').forEach((el) => el.remove());
}
// After every test, pass or fail: no overlay, no modal-stack entry, no held or waiting toast and
// no poll left for the next one (a failing test would otherwise leak a stale Esc entry).
test.afterEach(() => {
  try { mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: T0 }); } catch (e) { /* already on */ }
  document.querySelectorAll('.game-confirm-overlay').forEach((el) => el.remove());
  for (let i = 0; i < 10 && openModalCount() > 0; i++) esc();
  N.modalDialogClosed();
  N.clearWaitingToasts();
  mock.timers.tick(2000);   // the release poll runs and renders what was held
  container.innerHTML = '';
  mock.timers.reset();
});
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

test('gameConfirm alone pauses an on-screen toast and resumes it on close', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  const answer = N.gameConfirm('Sure?', 'Yes', 'No');
  mock.timers.tick(DUR * 2);
  assert.ok(has('Older toast'), 'paused while the confirm is open');
  document.querySelector('.game-confirm-ok').click();
  mock.timers.tick(2000);
  assert.ok(has('Older toast'), 'still up 2 s after resume (3 s were left)');
  mock.timers.tick(1600);
  assert.ok(!has('Older toast'), 'gone once the remaining time ran out');
  void answer;
  end();
});

test('a toast raised just before gameConfirm is pulled back and replayed after', () => {
  start();
  N.gameAlert('Just before', 'success', 'Before', DUR);
  N.gameConfirm('Sure?', 'Yes', 'No');
  assert.ok(!has('Just before'), 'pulled back when the confirm opened');
  document.querySelector('.game-confirm-ok').click();
  mock.timers.tick(400);
  assert.ok(has('Just before'), 'replayed after the confirm closed');
  end();
});

test('closing the lower of two stacked modals leaves a paused toast paused', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  N.gameDisplay('A note', 'Note');
  N.gameConfirm('Sure?', 'Yes', 'No');
  document.querySelector('.game-modal-close').click();   // the display underneath
  mock.timers.tick(DUR * 2);
  assert.ok(has('Older toast'), 'still paused under the confirm');
  esc();
  mock.timers.tick(2000);
  assert.ok(has('Older toast'), 'resumed with its 3 s once the last one closed');
  mock.timers.tick(1600);
  assert.ok(!has('Older toast'), 'gone after the remaining time');
  end();
});

test('warnings are not held by a modal', () => {
  start();
  N.gameDisplay('A note', 'Note');
  N.gameAlert('Careful', 'warning', 'Warning', DUR);
  assert.ok(has('Careful'), 'warning shows at once');
  document.querySelector('.game-modal-close').click();
  end();
});

test('a toast raised again under the modal restarts the paused copy and never runs it down', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  N.gameDisplay('A note', 'Note');
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(DUR * 3);
  assert.ok(has('Older toast'), 'the paused copy is still up after the modal outlasts its time');
  assert.ok(shown().filter((t) => t.textContent.includes('Older toast')).length === 1, 'one copy only');
  document.querySelector('.game-modal-close').click();
  mock.timers.tick(DUR - 500);
  assert.ok(has('Older toast'), 'full time after close');
  end();
});

test('a toast waiting for a place under a foreign overlay stays held, then shows after it goes', () => {
  start();
  N.gameAlert('First', 'info', 'A', DUR);
  N.gameAlert('Second', 'info', 'B', DUR);
  N.gameAlert('Third', 'info', 'C', DUR);
  assert.ok(N.waitingToastCount() === 1, 'one toast waits for a place');
  const other = document.createElement('div');
  other.className = 'game-confirm-overlay';   // an overlay raised without the open hook
  document.body.appendChild(other);
  mock.timers.tick(DUR * 3);
  assert.ok(!has('Third'), 'the waiting toast did not show under the overlay');
  other.remove();
  mock.timers.tick(DUR * 3);
  const seenAfter = has('Third');
  mock.timers.tick(1);
  assert.ok(seenAfter || N.waitingToastCount() === 0, 'the waiting toast came out after the overlay went');
  end();
});

test('a hold that outlives its overlay is released when the last overlay goes without the close hook', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  N.gameDisplay('A note', 'Note');
  const other = document.createElement('div');
  other.className = 'game-confirm-overlay';
  document.body.appendChild(other);
  document.querySelector('.game-modal-close').click();   // the display goes, the other stays
  mock.timers.tick(DUR * 2);
  assert.ok(has('Older toast'), 'still paused while the other overlay is up');
  other.remove();   // gone with no hook, as a bare overlay.remove() does
  mock.timers.tick(HOLD_POLL * 2);
  mock.timers.tick(3200);
  assert.ok(!has('Older toast'), 'resumed by the poll and ran out its remaining time');
  end();
});

const OPEN_OBJECTIVE = { aims: [{ status: 'active', optional: true, tasks: [{ taskId: 'spare', title: 'Spare key', status: 'active' }] }] };

test('the ending check holds toasts like the other modals and releases them on every close path', async () => {
  for (const how of ['keep', 'x', 'esc', 'end']) {
    start();
    window.player = { disableMovement: false };
    N.gameAlert('Older toast', 'info', 'Older', DUR);
    mock.timers.tick(2000);
    E._resetEndingCheck();
    const answer = E.confirmEnding({ reason: 'credits' }, { manager: OPEN_OBJECTIVE, config: {} });
    assert.ok(document.querySelector('.game-confirm-overlay') !== null, how + ': ending check is up');
    N.gameAlert('Held hint', 'info', 'Hint', DUR);
    mock.timers.tick(DUR * 2);
    assert.ok(has('Older toast'), how + ': on-screen toast paused, not expired');
    assert.ok(!has('Held hint'), how + ': new toast held');
    if (how === 'keep') document.getElementById('ending-check-keep').click();
    if (how === 'x') document.getElementById('ending-check-close').click();
    if (how === 'end') document.getElementById('ending-check-end').click();
    if (how === 'esc') window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await answer;
    assert.ok(document.querySelector('.game-confirm-overlay') === null, how + ': overlay gone');
    mock.timers.tick(400);
    assert.ok(has('Held hint'), how + ': held toast shown after close');
    mock.timers.tick(2650);
    // 3 s were left at the open: gone 3.05 s after the close. The close hook resumes it at once;
    // the poll alone would be up to 300 ms late.
    assert.ok(!has('Older toast'), how + ': paused toast resumed on the close and ran out');
    end();
  }
});

test('with no querySelectorAll on the document a confirm still opens and resolves', async () => {
  start();
  const had = Object.getOwnPropertyDescriptor(document, 'querySelectorAll');
  Object.defineProperty(document, 'querySelectorAll', { value: undefined, configurable: true });
  let answer;
  try {
    answer = N.gameConfirm('Sure?', 'Yes', 'No');
    assert.ok(document.querySelector('.game-confirm-overlay') !== null, 'dialog is up');
    document.querySelector('.game-confirm-ok').click();
  } finally {
    if (had) Object.defineProperty(document, 'querySelectorAll', had); else delete document.querySelectorAll;
  }
  assert.ok((await answer) === true, 'resolved true');
  end();
});

test('a fault in the hold hooks never breaks the dialog or leaves it open', async () => {
  start();
  const real = document.getElementById;
  document.getElementById = () => { throw new Error('hold fault'); };
  let answer;
  let closed;
  try {
    answer = N.gameConfirm('Sure?', 'Yes', 'No');
    closed = N.gameDisplay('A note', 'Note');
    assert.ok(document.querySelectorAll('.game-confirm-overlay').length === 2, 'both dialogs opened despite the fault');
    document.querySelector('.game-modal-close').click();
    document.querySelector('.game-confirm-ok').click();
  } finally {
    document.getElementById = real;
  }
  assert.ok((await answer) === true, 'confirm resolved');
  await closed;
  assert.ok(document.querySelector('.game-confirm-overlay') === null, 'nothing left open');
  end();
});

test('a toast whose focus is released under a modal stays paused until the modal closes', () => {
  start();
  N.gameAlert('Older toast', 'info', 'Older', DUR);
  mock.timers.tick(2000);
  const el = shown()[0];
  el.dispatchEvent(new dom.window.Event('focusin', { bubbles: true }));
  N.gameDisplay('A note', 'Note');
  el.dispatchEvent(new dom.window.Event('focusout', { bubbles: true }));
  mock.timers.tick(DUR * 2);
  assert.ok(has('Older toast'), 'still up: the modal holds it though focus has gone');
  document.querySelector('.game-modal-close').click();
  mock.timers.tick(3200);
  assert.ok(!has('Older toast'), 'runs out its remaining time after the modal');
  end();
});

test('modalDialogOpened and modalDialogClosed tolerate a document without querySelectorAll', () => {
  start();
  const had = Object.getOwnPropertyDescriptor(document, 'querySelectorAll');
  Object.defineProperty(document, 'querySelectorAll', { value: undefined, configurable: true });
  try {
    N.modalDialogOpened();
    N.modalDialogClosed();
  } finally {
    if (had) Object.defineProperty(document, 'querySelectorAll', had); else delete document.querySelectorAll;
  }
  end();
});

test('a warning and an error already on screen are not paused when a gameDisplay opens', () => {
  start();
  N.gameAlert('Warn on screen', 'warning', 'Warn', DUR);
  N.gameAlert('Error on screen', 'error', 'Error', DUR);
  mock.timers.tick(1000);
  assert.ok(has('Warn on screen') && has('Error on screen'), 'both on screen before the modal');
  N.gameDisplay('A note', 'Note');
  assert.ok(N.modalDialogOpen() === true, 'modal open');
  assert.ok(has('Warn on screen') && has('Error on screen'), 'both still on screen as the modal opens');
  mock.timers.tick(DUR * 3);   // well past any normal expiry, modal still open
  assert.ok(N.modalDialogOpen() === true, 'modal still open');
  assert.ok(!has('Warn on screen'), 'warning expired on its normal schedule under the modal');
  assert.ok(!has('Error on screen'), 'error expired on its normal schedule under the modal');
  document.querySelector('.game-modal-close').click();
  end();
});

test('opening and closing modals leaves exactly one poll while open and none after', () => {
  start();
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  const live = new Set();
  let created = 0;
  globalThis.setInterval = (...args) => {
    const id = realSet(...args);
    live.add(id);
    created++;
    return id;
  };
  globalThis.clearInterval = (id) => {
    live.delete(id);
    return realClear(id);
  };
  try {
    N.clearWaitingToasts();
    mock.timers.tick(2000);   // let any release poll from earlier tests finish
    live.clear();
    created = 0;
    for (let round = 0; round < 3; round++) {
      N.gameDisplay('Note ' + round, 'Note');
      assert.ok(live.size === 1, 'one poll after open, round ' + round + ' (live ' + live.size + ')');
      N.gameConfirm('Sure?', 'Yes', 'No');   // stacked open
      N.gameDisplay('Another ' + round, 'Note');   // and a third
      assert.ok(live.size === 1, 'still one poll with three stacked, round ' + round + ' (live ' + live.size + ')');
      esc();
      esc();
      assert.ok(live.size === 1, 'poll stays while one modal remains, round ' + round + ' (live ' + live.size + ')');
      esc();
      assert.ok(N.modalDialogOpen() === false, 'all closed, round ' + round);
      assert.ok(live.size === 0, 'no poll left after the last close, round ' + round + ' (live ' + live.size + ')');
    }
    assert.ok(created === 3, 'one interval created per open-close cycle, not per open (created ' + created + ')');
    // Nothing left polling the page once the toasts have settled.
    const probe = document.querySelector;
    let queries = 0;
    document.querySelector = function (...a) { queries++; return probe.apply(this, a); };
    try {
      mock.timers.tick(1000);
      queries = 0;
      mock.timers.tick(HOLD_POLL * 10);
    } finally {
      document.querySelector = probe;
    }
    assert.ok(live.size === 0, 'still no poll after further ticks');
    assert.ok(queries === 0, 'no polling queries after the last close (' + queries + ')');
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
  end();
});
