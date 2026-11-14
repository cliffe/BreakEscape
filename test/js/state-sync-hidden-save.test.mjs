// The hidden-page save: a phone can kill a background tab without firing pagehide, so
// StateSync sends the same delta flush() sends on pagehide when the page turns hidden.
// A pagehide that follows does not send it again, stop() removes the listener, hidden
// then visible leaves the periodic sync working, and a refused currentRoom on that path
// is confirmed (not resent), as on the sync path. Also requestSoon(), the debounced sync
// a KO asks for.
// Run with: node --test test/js/state-sync-hidden-save.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'state-sync-hidden-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);

// window and document with real listener lists, so the tests fire the events
function listenerHost(extra = {}) {
  const listeners = {};
  return Object.assign({
    listeners,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter(f => f !== fn); },
    fire(type) { for (const fn of [...(listeners[type] || [])]) fn({ type }); }
  }, extra);
}
globalThis.window = listenerHost({ breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } });
globalThis.document = listenerHost({ querySelector: () => null, visibilityState: 'visible' });
const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const mod = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const { StateSync } = mod;

let requests = [];
let reply = () => ({ ok: true, json: { success: true } });
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  requests.push({ url, init, body });
  const r = await reply(body);
  return { ok: r.ok, status: r.ok ? 200 : 500, statusText: '', json: async () => r.json };
};
const settle = () => new Promise(r => setTimeout(r, 0));

function resetGame() {
  requests = [];
  reply = () => ({ ok: true, json: { success: true } });
  for (const k of Object.keys(window.listeners)) delete window.listeners[k];
  for (const k of Object.keys(document.listeners)) delete document.listeners[k];
  document.visibilityState = 'visible';
  Object.assign(window, {
    gameState: { globalVariables: { a: 1 }, notes: [] },
    currentPlayerRoom: 'lobby',
    gameClock: { exportState: () => ({ elapsedMs: 1000 }) },
    scenarioTimerDispatcher: null,
    npcManager: null,
    npcHostileSystem: null
  });
  Object.assign(console, quiet);
  return new StateSync(60 * 60 * 1000);
}
const hide = () => { document.visibilityState = 'hidden'; document.fire('visibilitychange'); };
const show = () => { document.visibilityState = 'visible'; document.fire('visibilitychange'); };

test('a hidden page sends the delta since the last confirmed sync, by keepalive with the CSRF header', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.gameState.globalVariables.probe = 42;
  hide();
  await settle();
  assert.equal(requests.length, 2, 'one request on hidden');
  const req = requests[1];
  assert.equal(req.init.keepalive, true);
  assert.equal(req.init.method, 'PUT');
  assert.equal(req.init.headers['X-CSRF-Token'], 't');
  assert.deepEqual(req.body.globalVariables, { probe: 42 }, 'only the changed global');
  assert.ok(req.body.scenarioClock, 'the clock rides along, as on pagehide');
  assert.equal(req.body.currentRoom, undefined, 'the room was already confirmed');
  sync.stop();
});

test('hidden then pagehide sends the delta once (answer confirmed)', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  assert.equal(requests.length, 2, 'the hidden event sent the delta');
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 2, 'the pagehide sent nothing more');
  sync.stop();
});

test('hidden then pagehide sends the delta once (answer not back yet: page frozen)', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let release;
  reply = () => new Promise(r => { release = () => r({ ok: true, json: { success: true } }); });
  window.gameState.globalVariables.probe = 1;
  hide();
  assert.equal(requests.length, 2, 'the hidden event sent the delta');
  assert.deepEqual(requests[1].body.globalVariables, { probe: 1 });
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 2, 'one keepalive for the delta, none from pagehide');
  release();
  await settle();
  sync.stop();
});

test('a change made after the hidden flush still goes up on pagehide', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  window.gameState.globalVariables.later = 2;
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[2].body.globalVariables, { later: 2 });
  sync.stop();
});

test('stop() removes the visibilitychange and pagehide listeners', async () => {
  const sync = resetGame();
  sync.start();
  assert.equal(document.listeners.visibilitychange.length, 1);
  sync.stop();
  assert.equal(document.listeners.visibilitychange.length, 0);
  assert.equal(window.listeners.pagehide.length, 0);
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  assert.equal(requests.length, 0, 'nothing sent after stop()');
});

test('hidden then visible leaves the periodic sync working: the next sync sends only new changes', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  show();
  assert.ok(sync.timer, 'the interval is still set');
  window.gameState.globalVariables.after = 2;
  await sync.sync();
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[2].body.globalVariables, { after: 2 }, 'the hidden delta was confirmed, not repeated');
  // Hidden again after visible flushes again (the guard was cleared)
  window.gameState.globalVariables.again = 3;
  hide();
  await settle();
  assert.equal(requests.length, 4);
  assert.deepEqual(requests[3].body.globalVariables, { again: 3 });
  sync.stop();
});

test('an unanswered hidden flush is sent again by the next periodic sync', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  reply = () => ({ ok: false, json: {} });
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  show();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  assert.deepEqual(requests[2].body.globalVariables, { probe: 1 });
  sync.stop();
});

test('a refused currentRoom on the hidden path is confirmed and not resent (tailgating guard)', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.currentPlayerRoom = 'server_room';
  reply = () => ({ ok: true, json: { success: true, notSaved: ['currentRoom'] } });
  hide();
  await settle();
  assert.equal(requests[1].body.currentRoom, 'server_room');
  show();
  reply = () => ({ ok: true, json: { success: true } });
  window.gameState.globalVariables.x = 1;
  await sync.sync();
  assert.equal(requests[2].body.currentRoom, undefined, 'the refused room is not sent again');
  // A new room is still sent
  window.currentPlayerRoom = 'lobby2';
  await sync.sync();
  assert.equal(requests[3].body.currentRoom, 'lobby2');
  sync.stop();
});

test('a stale answer to the hidden flush confirms nothing', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  reply = () => ({ ok: true, json: { stale: true } });
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle();
  show();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  assert.deepEqual(requests[2].body.globalVariables, { probe: 1 });
  sync.stop();
});

test('requestSoon debounces: three KOs in one fight send one delta sync', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.ko1 = true;
  sync.requestSoon();
  t.mock.timers.tick(300);
  window.gameState.globalVariables.ko2 = true;
  sync.requestSoon();
  t.mock.timers.tick(300);
  window.gameState.globalVariables.ko3 = true;
  sync.requestSoon();
  assert.equal(requests.length, 1, 'nothing sent yet');
  t.mock.timers.tick(mod.REQUEST_SOON_DEBOUNCE_MS);
  t.mock.timers.reset();
  await settle();
  assert.equal(requests.length, 2, 'one sync for the three');
  assert.deepEqual(requests[1].body.globalVariables, { ko1: true, ko2: true, ko3: true });
});

test('requestSoon waits no longer than the cap after the first request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.ko1 = true;
  for (let i = 0; i < 10; i++) { sync.requestSoon(); t.mock.timers.tick(200); }
  t.mock.timers.reset();
  await settle();
  assert.equal(requests.length, 2, 'sent within REQUEST_SOON_MAX_MS despite constant requests');
  assert.ok(mod.REQUEST_SOON_MAX_MS <= 2000, 'a crash 3 s after a KO keeps it');
});

test('stop() cancels a pending requestSoon', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.ko1 = true;
  sync.requestSoon();
  sync.stop();
  t.mock.timers.tick(5000);
  t.mock.timers.reset();
  await settle();
  assert.equal(requests.length, 1);
});
