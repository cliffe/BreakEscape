// Interacting with an NPC while another screen is open (systems/npc-chat-busy.js, called from
// interactions.js before person-chat starts). m09 blind playtest: a HaX phone chat was open,
// person-chat refused silently. Text phone: closed like its X, then person-chat. Call: toast,
// stays open. Locked phone and other screens: toast. Copy list: none (npc-chat-busy.js has no imports).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
globalThis.window = {};
const { handleBusyNpcChat, phoneKind } = await import(pathToFileURL(join(js, 'systems/npc-chat-busy.js')).href);

/** A framework whose phone closes after `closeDelay` poll ticks (0: at once, as endMinigame does). */
function world({ scene = 'phone-chat', params = {}, ui = {}, closeDelay = 0, title } = {}) {
  const log = [];
  const timers = [];
  const fw = { currentMinigame: null };
  const history = ['hello', 'how are you'];
  const mg = {
    _sceneType: scene, params: { ...params, ...(title ? { title } : {}) }, ui, history, unread: 2, _ending: false,
    closeByPlayer() {
      log.push('close-called');
      this.closedByPlayer = true;
      const done = () => { fw.currentMinigame = null; log.push('closed'); };
      if (closeDelay === 0) done(); else { this._ending = true; let n = closeDelay; const t = () => { if (--n <= 0) done(); else timers.push(t); }; timers.push(t); }
    },
  };
  fw.currentMinigame = mg;
  const toasts = [];
  let t = 0;
  const ctx = {
    framework: fw, npcId: 'jesse_tran', displayName: 'Jesse Tran',
    alert: (m) => toasts.push(m),
    startChat: () => log.push('person-chat-start'),
    setTimer: (fn) => timers.push(fn), now: () => (t += 10),
  };
  const run = () => { while (timers.length) timers.shift()(); };
  return { fw, mg, ctx, toasts, log, run };
}

test('a text chat open: closed the way X closes it, then person-chat starts, history and unread kept', () => {
  const w = world();
  assert.equal(handleBusyNpcChat(w.ctx), true);
  assert.deepEqual(w.log, ['close-called', 'closed', 'person-chat-start'], 'close finishes before person-chat');
  assert.equal(w.mg.closedByPlayer, true);
  assert.deepEqual(w.mg.history, ['hello', 'how are you']);
  assert.equal(w.mg.unread, 2);
  assert.deepEqual(w.toasts, []);
});

test('a phone that closes after a few ticks: person-chat waits for it, never starts over a half-closed phone', () => {
  const w = world({ closeDelay: 3 });
  assert.equal(handleBusyNpcChat(w.ctx), true);
  assert.deepEqual(w.log, ['close-called'], 'not started yet');
  w.run();
  assert.deepEqual(w.log, ['close-called', 'closed', 'person-chat-start']);
});

test('a phone that never closes ends in the finish-the-conversation toast and no person-chat', () => {
  const w = world();
  w.mg.closeByPlayer = () => { w.log.push('close-called'); };
  w.ctx.now = (() => { let t = 0; return () => (t += 400); })();
  assert.equal(handleBusyNpcChat(w.ctx), true);
  w.run();
  assert.equal(w.log.includes('person-chat-start'), false);
  assert.deepEqual(w.toasts, ['Finish the phone conversation first.']);
});

test('call mode (voiced, ringer, pretext or the call UI): toast, the phone stays open', () => {
  for (const [params, ui] of [[{ voiced: true }, {}], [{ ringerCall: { direction: 'incoming' } }, {}], [{ pretextCallId: 'c1' }, {}], [{}, { isCallMode: true }]]) {
    const w = world({ params, ui });
    assert.equal(handleBusyNpcChat(w.ctx), true);
    assert.deepEqual(w.toasts, ['Hang up to talk to Jesse Tran.']);
    assert.equal(w.fw.currentMinigame, w.mg, 'still open');
    assert.deepEqual(w.log, []);
  }
});

test('a close-locked phone (disableClose, even in a call): "Finish the phone conversation first."', () => {
  for (const params of [{ disableClose: true }, { disableClose: true, voiced: true }]) {
    const w = world({ params });
    assert.equal(handleBusyNpcChat(w.ctx), true);
    assert.deepEqual(w.toasts, ['Finish the phone conversation first.']);
    assert.equal(w.fw.currentMinigame, w.mg);
    assert.deepEqual(w.log, []);
  }
  assert.equal(phoneKind({ params: { disableClose: true, voiced: true } }), 'locked');
});

test('another minigame: toast with its title, or the generic line; it stays open', () => {
  const a = world({ scene: 'lockpicking', title: 'Lockpicking' });
  assert.equal(handleBusyNpcChat(a.ctx), true);
  assert.deepEqual(a.toasts, ['Close Lockpicking first.']);
  assert.equal(a.fw.currentMinigame, a.mg);
  const b = world({ scene: 'rfid' });
  handleBusyNpcChat(b.ctx);
  assert.deepEqual(b.toasts, ['Close the open screen first.']);
  assert.deepEqual(b.log, []);
});

test('nothing open (or one already mid-end): returns false so the caller starts person-chat itself', () => {
  const w = world();
  w.fw.currentMinigame = null;
  assert.equal(handleBusyNpcChat(w.ctx), false);
  const e = world();
  e.mg._ending = true;
  assert.equal(handleBusyNpcChat(e.ctx), false);
  assert.deepEqual(e.toasts, []);
});

test('toast text goes through the plain-text path: names reach it as text, and gameAlert uses textContent', () => {
  const w = world({ params: { voiced: true } });
  w.ctx.displayName = '<img src=x onerror=alert(1)>';
  handleBusyNpcChat(w.ctx);
  assert.equal(w.toasts[0], 'Hang up to talk to <img src=x onerror=alert(1)>.', 'passed unchanged, as a string');
  const notif = readFileSync(join(js, 'systems/notifications.js'), 'utf8');
  assert.match(notif, /\.notification-message'\)\.textContent|notification-message[^\n]*textContent|setPlainLines\(notification\.querySelector\('\.notification-message'\)/);
  const mod = readFileSync(join(js, 'systems/npc-chat-busy.js'), 'utf8');
  assert.doesNotMatch(mod, /innerHTML/);
});

test('interactions.js asks the helper before starting person-chat, and game.js installs it', () => {
  const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
  assert.ok(src.indexOf('window.handleBusyNpcChat?.(') > 0);
  assert.ok(src.indexOf('window.handleBusyNpcChat?.(') < src.indexOf('startChat();'), 'busy check comes first');
  assert.match(readFileSync(join(js, 'core/game.js'), 'utf8'), /import\('\.\.\/systems\/npc-chat-busy\.js'\)/);
});
