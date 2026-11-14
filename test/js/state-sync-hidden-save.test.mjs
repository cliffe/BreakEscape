// The hidden-page save: a phone can kill a background tab without firing pagehide, so
// StateSync sends the same delta flush() sends on pagehide when the page turns hidden.
// A pagehide that follows does not send it again, stop() removes the listener, hidden
// then visible leaves the periodic sync working, and a refused currentRoom on that path
// is confirmed (not resent), as on the sync path. Also requestSoon(), the debounced sync
// a KO asks for. Review R1: a hidden flush that fails no longer blocks the pagehide, an
// older answer never overwrites a newer confirm, a hide with no change sends nothing,
// and two flushes in flight stay under the keepalive quota together.
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
  current = new StateSync(60 * 60 * 1000);
  return current;
}
// A failed assertion skips a test's own stop(); stop every game here so the interval
// cannot keep the run alive.
let current = null;
test.afterEach(() => { current?.stop(); current = null; });
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
  // Requests every 200 ms from 0 to 1400 ms: the debounce alone would never fire
  for (let i = 0; i < 8; i++) { sync.requestSoon(); if (i < 7) t.mock.timers.tick(200); }
  t.mock.timers.tick(mod.REQUEST_SOON_MAX_MS - 1400 - 1);
  assert.equal(requests.length, 1, 'nothing sent 1 ms before the cap');
  t.mock.timers.tick(1);
  assert.equal(requests.length, 2, 'sent at REQUEST_SOON_MAX_MS despite constant requests');
  t.mock.timers.reset();
  await settle();
  assert.equal(mod.REQUEST_SOON_MAX_MS, 1500, 'a crash 2 s after a KO keeps it');
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

// Review R1, M1: a hidden flush that did not land must not block the pagehide.
async function hiddenFailsThenPagehide(failWith) {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const real = globalThis.fetch;
  failWith(real);
  window.gameState.globalVariables.probe = 1;
  hide();
  await settle(); await settle();
  globalThis.fetch = real;
  reply = () => ({ ok: true, json: { success: true } });
  assert.equal(requests.length, 2, 'the hidden flush was attempted');
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 3, 'the pagehide sent the delta again');
  assert.deepEqual(requests[2].body.globalVariables, { probe: 1 });
  assert.ok(requests[2].body.scenarioClock, 'and forced the clock, as a plain pagehide does');
  sync.stop();
}

test('R1 M1: a hidden flush answered 500, then pagehide: the pagehide sends the delta', async () => {
  await hiddenFailsThenPagehide(() => { reply = () => ({ ok: false, json: {} }); });
});

test('R1 M1: a hidden flush rejected by fetch (network error or keepalive quota), then pagehide', async () => {
  await hiddenFailsThenPagehide(() => {
    globalThis.fetch = async (u, i) => { requests.push({ init: i, body: JSON.parse(i.body) }); throw new TypeError('Failed to fetch'); };
  });
});

test('R1 M1: a hidden flush whose fetch throws at once, then pagehide', async () => {
  await hiddenFailsThenPagehide(() => {
    globalThis.fetch = (u, i) => { requests.push({ init: i, body: JSON.parse(i.body) }); throw new TypeError('keepalive quota'); };
  });
});

test('R1 M1: a hidden flush whose 2xx answer cannot be read, then pagehide', async () => {
  await hiddenFailsThenPagehide(real => {
    globalThis.fetch = async (u, i) => {
      requests.push({ init: i, body: JSON.parse(i.body) });
      return { ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); } };
    };
  });
});

test('R1 M1: a hidden flush with no answer yet (frozen page) still blocks the same delta on pagehide', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let release;
  reply = () => new Promise(r => { release = () => r({ ok: false, json: {} }); });
  window.gameState.globalVariables.probe = 1;
  hide();
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 2, 'no double send while the answer is pending');
  release(); await settle(); await settle();
  sync.stop();
});

// Review R1, m1: an older answer that lands after a newer one confirms nothing.
test('R1 m1: a hidden flush answered after a later sync does not overwrite the sync\'s confirm', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let releaseFlush;
  reply = (b) => b.globalVariables?.hp === 80 && requests.length === 2
    ? new Promise(r => { releaseFlush = () => r({ ok: true, json: { success: true } }); })
    : ({ ok: true, json: { success: true } });
  window.gameState.globalVariables.hp = 80;
  hide();                                   // flush hp=80, answer held
  show();
  window.gameState.globalVariables.hp = 60;
  await sync.sync();                        // server holds 60
  window.gameState.globalVariables.hp = 80; // healed back to the flushed value
  releaseFlush(); await settle(); await settle();
  const before = requests.length;
  await sync.sync();
  assert.equal(requests.length - before, 1, 'the next sync sends the heal');
  assert.deepEqual(requests.at(-1).body.globalVariables, { hp: 80 });
  sync.stop();
});

test('R1 m1: a sync answered after a later hidden flush does not overwrite the flush\'s confirm', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let releaseSync;
  reply = () => (requests.length === 2
    ? new Promise(r => { releaseSync = () => r({ ok: true, json: { success: true } }); })
    : ({ ok: true, json: { success: true } }));
  window.gameState.globalVariables.hp = 60;
  const pending = sync.sync();              // sync hp=60, answer held
  await settle();
  window.gameState.globalVariables.hp = 80;
  hide();                                   // flush hp=80, answered at once
  await settle(); await settle();
  show();
  releaseSync();
  assert.equal(await pending, true);
  window.gameState.globalVariables.hp = 60; // the server holds 80 now
  const before = requests.length;
  await sync.sync();
  assert.equal(requests.length - before, 1, 'the next sync sends 60');
  assert.deepEqual(requests.at(-1).body.globalVariables, { hp: 60 });
  sync.stop();
});

// Review R1, m2: a tab switch with no change sends nothing.
test('R1 m2: a hide with no change sends nothing; the pagehide after it still forces the clock', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let elapsed = 1000;
  window.gameClock = { exportState: () => ({ elapsedMs: elapsed }) };
  elapsed = 5000;                           // time moved, nothing else did
  hide();
  await settle();
  assert.equal(requests.length, 1, 'no request on a hide with no change');
  assert.equal(sync._hiddenFlushKey, null, 'no guard set');
  show(); hide();
  await settle();
  assert.equal(requests.length, 1, 'still none after a second tab switch');
  window.fire('pagehide');
  await settle();
  assert.equal(requests.length, 2, 'the pagehide sends');
  assert.deepEqual(Object.keys(requests[1].body).sort(), ['clientTs', 'scenarioClock']);
  assert.equal(requests[1].body.scenarioClock.elapsedMs, 5000);
  sync.stop();
});

test('R1 m2: on a hide the clock follows the 5-minute rule', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let elapsed = 2000;
  window.gameClock = { exportState: () => ({ elapsedMs: elapsed }) };
  hide();
  await settle();
  assert.equal(requests.length, 1, 'a clock under 5 minutes old is not sent');
  show();
  sync.clockConfirmedAt -= 5 * 60 * 1000;   // the last clock save is 5 minutes old
  elapsed = 3000;
  hide();
  await settle();
  assert.equal(requests.length, 2, 'a due clock goes up on the hide');
  assert.equal(requests[1].body.scenarioClock.elapsedMs, 3000);
  sync.stop();
});

// Review R1, m3: the keepalive quota is shared by every keepalive in flight.
const bytes = s => new TextEncoder().encode(s).length;
const inflightBytes = reqs => reqs.reduce((n, r) => n + bytes(r.init.body), 0);

test('R1 m3: a pagehide while a large hidden flush is in flight is reduced to fit what is left', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const held = [];
  reply = () => new Promise(r => held.push(() => r({ ok: true, json: { success: true } })));
  // A long note (not reload-critical) goes up on the hide: ~40 KB in flight, answer
  // pending, so the pagehide's delta still holds it too.
  window.gameState.notes.push({ id: 'n1', text: 'y'.repeat(40000) });
  hide();
  assert.equal(requests.length, 2);
  window.gameState.globalVariables.later = 1;
  window.fire('pagehide');
  assert.equal(requests.length, 3, 'the pagehide sent a reduced body');
  assert.equal(requests[2].body.notes, undefined, 'notes left out to fit');
  assert.equal(requests[2].body.globalVariables.later, 1, 'the reload-critical globals kept');
  assert.ok(inflightBytes(requests.slice(1)) <= 60000, 'both flushes together fit the quota');
  for (const r of held) r();
  await settle(); await settle();
  sync.stop();
});

test('R1 m3: when even the reduced body does not fit, the pagehide sends nothing and keeps the delta', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const held = [];
  reply = () => new Promise(r => held.push(() => r({ ok: true, json: { success: true } })));
  // 20 KB in flight; the pagehide's delta (both globals, 50 KB) fits the limit alone
  // but not beside it, and the globals are kept by both reduced lists.
  window.gameState.globalVariables.big = 'x'.repeat(20000);
  hide();
  window.gameState.globalVariables.later = 'z'.repeat(30000);
  window.fire('pagehide');
  assert.equal(requests.length, 2, 'nothing sent over the quota');
  for (const r of held) r();
  await settle(); await settle();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  assert.equal(requests.length, 3, 'the next sync sends the kept delta');
  assert.equal(requests[2].body.globalVariables.later.length, 30000);
  assert.equal(requests[2].body.globalVariables.big, undefined, 'the hidden flush was confirmed');
  sync.stop();
});

test('R1 m3: a hidden flush that cannot fit sets no guard, and the quota frees once a flush settles', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  window.gameState.globalVariables.huge = 'x'.repeat(70000);
  hide();
  await settle();
  assert.equal(requests.length, 1, 'nothing sent');
  assert.equal(sync._hiddenFlushKey, null, 'no guard: the pagehide is not blocked by an unsent flush');
  assert.equal(sync._keepaliveInflight, 0);
  delete window.gameState.globalVariables.huge;
  show();
  window.gameState.globalVariables.small = 1;
  hide();
  await settle(); await settle();
  assert.equal(requests.length, 2);
  assert.equal(sync._keepaliveInflight, 0, 'freed after the answer');
  sync.stop();
});

// Review R1, n1: stop() is final.
test('R1 n1: requestSoon after stop() starts nothing', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const sync = resetGame();
  sync.start();
  await sync.sync();
  sync.stop();
  window.gameState.globalVariables.ko1 = true;
  sync.requestSoon();
  t.mock.timers.tick(5000);
  t.mock.timers.reset();
  await settle();
  assert.equal(requests.length, 1);
});
