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

test('R1 m3: a pagehide while a large hidden flush is in flight sends only what fits beside it', async () => {
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
  assert.equal(requests.length, 3, 'the pagehide sent a body');
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
  // 20 KB in flight; the pagehide's delta (both globals, 65 KB) and even what changed
  // since the hidden flush (45 KB) do not fit beside it, and the globals are kept by
  // both reduced lists.
  window.gameState.globalVariables.big = 'x'.repeat(20000);
  hide();
  window.gameState.globalVariables.later = 'z'.repeat(45000);
  window.fire('pagehide');
  assert.equal(requests.length, 2, 'nothing sent over the quota');
  for (const r of held) r();
  await settle(); await settle();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  assert.equal(requests.length, 3, 'the next sync sends the kept delta');
  assert.equal(requests[2].body.globalVariables.later.length, 45000);
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

// Review R2 / chunk 4. A model of sync_state's ordering rule with the stale-but-recent
// ring (games_controller.rb stale_sync_request? and the ring pre-filter): a request whose
// clientTs is above the newest accepted is fresh and applies every key, recording the
// keys it changed in the ring at its ts. A request at or below the newest is stale-but-
// recent: it merges only the keys no newer recorded request already wrote (the skip set,
// the union of ring entries with ts >= its own), never moving the stamp, and still answers
// { stale: true } (so the client does not confirm it and resends its sections once, a
// harmless no-op since the server already holds them). This models globals (keyed) and
// notes (keyed by id), the two last-write-wins sections these tests exercise. It models the
// completeness guard (stale_recent_guard_holds?): a stale request merges key by key only
// when the ring holds every newer write (its ts is at or above the oldest retained entry and
// the ring is non-empty); against an absent, empty or incomplete ring it falls back to the
// whole-skip (merges nothing), exactly as the server does (chunk 4 review R1 minor 1). A
// real session always has a recent recorded write below a hidden flush, so the recovery
// tests seed a qualifying ring entry explicitly (seedQualifyingRing). Requests wait until the
// test delivers them, in the order it chooses.
function modelServer() {
  const server = { lastTs: 0, globals: {}, notes: {}, ring: [] };
  const pending = [];
  reply = body => new Promise(resolve => pending.push({ body, resolve }));
  const skipSet = ts => {
    const skip = { globalVariables: new Set(), notes: new Set() };
    for (const e of server.ring) {
      if (e.ts < ts) continue;
      for (const k of e.w.globalVariables || []) skip.globalVariables.add(k);
      for (const id of e.w.notes || []) skip.notes.add(id);
    }
    return skip;
  };
  const mergeBody = (body, skip) => {
    const w = { globalVariables: [], notes: [] };
    for (const [k, v] of Object.entries(body.globalVariables || {})) {
      if (skip && skip.globalVariables.has(k)) continue;
      if (v === null) { if (k in server.globals) { delete server.globals[k]; w.globalVariables.push(k); } }
      else if (server.globals[k] !== v) { server.globals[k] = v; w.globalVariables.push(k); }
    }
    for (const n of body.notes || []) {
      if (skip && skip.notes.has(n.id)) continue;
      if (JSON.stringify(server.notes[n.id]) !== JSON.stringify(n)) { server.notes[n.id] = n; w.notes.push(n.id); }
    }
    return w;
  };
  const record = (ts, w) => {
    if (typeof ts !== 'number' || (!w.globalVariables.length && !w.notes.length)) return;
    server.ring.push({ ts, w });
    const newest = Math.max(...server.ring.map(e => e.ts));
    server.ring = server.ring.filter(e => newest - e.ts <= 60000).sort((a, b) => b.ts - a.ts).slice(0, 8);
  };
  // The completeness guard: a stale request merges key by key only when the ring is non-empty
  // and the request's ts is at or above the oldest retained entry (so every newer write is
  // still recorded to skip against). Otherwise it whole-skips.
  const guardHolds = ts => server.ring.length > 0 && ts >= Math.min(...server.ring.map(e => e.ts));
  const deliver = (i, { fail = false } = {}) => {
    const { body, resolve } = pending[i];
    if (fail) return resolve({ ok: false, json: {} });
    const ts = typeof body.clientTs === 'number' ? body.clientTs : null;
    const stale = ts !== null && ts <= server.lastTs;
    if (!stale) {
      if (ts !== null) server.lastTs = ts;
      record(ts, mergeBody(body, null));
    } else if (guardHolds(ts)) {
      record(ts, mergeBody(body, skipSet(ts)));
    }
    // else: stale against an empty or incomplete ring, whole-skip (merge nothing, record
    // nothing), exactly as the server falls back (plan section 5, R1 minor 1).
    resolve({ ok: true, json: stale ? { success: true, stale: true } : { success: true } });
  };
  return { server, pending, deliver };
}
const settled = async () => { for (let i = 0; i < 5; i++) await settle(); };

// Seed the model ring with a prior accepted write stamped just below the hidden flush
// (pending[0]), so the completeness guard holds when that flush lands stale-but-recent. A
// real session always has a recent recorded last-write-wins write below a hidden flush; the
// model server starts empty, so the recovery tests establish that precondition explicitly
// (chunk 4 review R1 minor 1). The seeded key is below every H/D stamp, so it is never in a
// skip set and never merges into server.globals.
function seedQualifyingRing(server, pending) {
  const hiddenTs = pending[0].body.clientTs;
  server.ring.push({ ts: hiddenTs - 1, w: { globalVariables: ['seed'], notes: [] } });
  server.lastTs = hiddenTs - 1;
}

// m1: a 45 KB hidden flush is still uploading, a global changes while hidden, then the
// pagehide. The whole delta (90 KB with the unconfirmed flush) does not fit beside it.
async function bigHiddenThenLateChange() {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const model = modelServer();
  window.gameState.globalVariables.big = 'x'.repeat(45000);
  hide();
  window.gameState.globalVariables.late = 1;
  window.fire('pagehide');
  return { sync, ...model };
}

test('R2 m1: a large hidden flush in flight, a change while hidden, then pagehide: the change is sent', async () => {
  const { pending } = await bigHiddenThenLateChange();
  assert.equal(pending.length, 2, 'the pagehide sent a body');
  const [hidden, pagehide] = pending.map(p => p.body);
  assert.deepEqual(pagehide.globalVariables, { late: 1 }, 'only what changed since the hidden flush');
  assert.ok(pagehide.clientTs > hidden.clientTs, 'a clientTs above the hidden flush (the re-stamp), so it carries the newest content');
  assert.ok(pagehide.clientTs > requests[0].body.clientTs, 'and above the sync before it');
  assert.ok(inflightBytes(requests.slice(1)) <= 60000, 'both flushes together fit the quota');
});

test('R2 m1: the hidden flush lands after the pagehide: the ring keeps both, the client resends the stale flush once', async () => {
  const { sync, server, pending, deliver } = await bigHiddenThenLateChange();
  assert.equal(pending.length, 2);
  seedQualifyingRing(server, pending);      // a prior write below the hidden flush: the guard holds
  deliver(1);                               // the re-stamped pagehide body lands first, fresh
  await settled();
  deliver(0);                               // the hidden flush lands second, stale-but-recent
  await settled();
  assert.equal(server.globals.big.length, 45000, 'the ring merged the stale-but-recent flush');
  assert.equal(server.globals.late, 1, 'the later change is saved');
  // The hidden flush answered { stale: true }, so the client did not confirm it and resends
  // its section once on the next sync; the server already holds it, so the resend is a no-op.
  show();
  reply = () => ({ ok: true, json: { success: true } });
  const before = requests.length;
  await sync.sync();
  assert.equal(requests.length, before + 1, 'the stale-but-recent flush is resent once');
  assert.equal(requests.at(-1).body.globalVariables.big.length, 45000, 'it resends big (already held by the ring)');
  assert.equal(requests.at(-1).body.globalVariables.late, undefined, 'late was confirmed');
});

test('R2 m1: the hidden flush fails after the pagehide: the later change is saved and the guard clears', async () => {
  const { sync, server, pending, deliver } = await bigHiddenThenLateChange();
  assert.equal(pending.length, 2);
  deliver(1);
  await settled();
  deliver(0, { fail: true });
  await settled();
  assert.equal(server.globals.late, 1, 'the later change is saved');
  assert.equal(server.globals.big, undefined, 'the failed flush is not');
  assert.equal(sync._hiddenFlushKey, null, 'the guard cleared (R1 M1)');
  assert.equal(sync._flushesInFlight.size, 0);
  // Restored from the back-forward cache: the next sync resends what the failed flush held.
  show();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  const last = requests[requests.length - 1].body;
  assert.equal(last.globalVariables.big.length, 45000, 'the failed flush\'s delta is resent');
  assert.equal(last.globalVariables.late, undefined, 'the pagehide\'s change was confirmed');
});

test('R2 m1: the hidden flush landing first, then the re-stamped pagehide body lands fresh above it (the residual loss is closed)', async () => {
  const { server, pending, deliver } = await bigHiddenThenLateChange();
  assert.equal(pending.length, 2);
  seedQualifyingRing(server, pending);      // a prior write below the hidden flush: the guard holds
  deliver(0);
  await settled();
  deliver(1);
  await settled();
  assert.equal(server.globals.big.length, 45000);
  assert.equal(server.globals.late, 1, 'the re-stamp carries the later change above the flush, so it is saved (no residual loss)');
});

// R1 minor 2 (the loss direction), the JS counterpart of the Ruby controller test for R1 m2: when
// the re-stamped pagehide body D lands first and the hidden flush H then arrives stale with
// NO qualifying ring entry at or below it, the completeness guard fails and H whole-skips, so
// H's unique section is dropped. This is the documented, intended R2 cost. Without seeding, the
// only ring entry is D's, above H.
test('R1 m2: D first, then H stale with no qualifying ring entry: H whole-skipped, its unique key dropped (the R2 cost)', async () => {
  const { server, pending, deliver } = await bigHiddenThenLateChange();
  assert.equal(pending.length, 2);
  deliver(1);                               // D (late, re-stamped above) lands first, fresh
  await settled();
  deliver(0);                               // H (big) lands second, stale; ring holds only D above it
  await settled();
  assert.equal(server.globals.late, 1, 'D applied');
  assert.equal(server.globals.big, undefined, 'H whole-skipped: its unique section is dropped (guard fails)');
});

test('R2: a pagehide reduced beside a hidden flush in flight never makes that flush stale', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const { server, pending, deliver } = modelServer();
  // A 40 KB note goes up on the hide. The pagehide's whole delta would carry it again
  // and has to shrink; a reduced body leaves notes out.
  window.gameState.notes.push({ id: 'n1', text: 'y'.repeat(40000) });
  hide();
  window.gameState.globalVariables.late = 1;
  window.fire('pagehide');
  assert.equal(pending.length, 2);
  seedQualifyingRing(server, pending);      // a prior write below the hidden flush: the guard holds
  // The small pagehide body reaches the server first.
  deliver(1);
  await settled();
  deliver(0);
  await settled();
  assert.equal(server.notes.n1?.text.length, 40000, 'the hidden flush\'s note is saved');
  assert.equal(server.globals.late, 1);
  sync.stop();
});

test('R2: what changed since the hidden flush is itself reduced when it does not fit beside it', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const { pending } = modelServer();
  window.gameState.globalVariables.big = 'x'.repeat(20000);
  hide();
  window.gameState.notes.push({ id: 'n2', text: 'y'.repeat(45000) });
  window.gameState.globalVariables.late = 1;
  window.fire('pagehide');
  assert.equal(pending.length, 2);
  const pagehide = pending[1].body;
  assert.equal(pagehide.notes, undefined, 'notes left out to fit');
  assert.deepEqual(pagehide.globalVariables, { late: 1 });
  assert.ok(pagehide.clientTs > pending[0].body.clientTs, 'the re-stamp puts it above the hidden flush');
  assert.ok(inflightBytes(requests.slice(1)) <= 60000);
  sync.stop();
});

test('R2 n2: a stale answer to the hidden flush clears its guard, so the pagehide sends the delta', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  reply = () => ({ ok: true, json: { success: true, stale: true } });
  window.gameState.globalVariables.k = 2;
  hide();
  await settled();
  assert.equal(sync._hiddenFlushKey, null, 'a stale answer saved nothing: no guard');
  reply = () => ({ ok: true, json: { success: true } });
  window.fire('pagehide');
  await settled();
  assert.equal(requests.length, 3, 'the pagehide sent the delta again');
  assert.equal(requests[2].body.globalVariables.k, 2);
  sync.stop();
});

test('R2 n2: a stale answer to a reduced hidden flush clears its guard too', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  reply = () => ({ ok: true, json: { success: true, stale: true } });
  window.gameState.notes.push({ id: 'n3', text: 'y'.repeat(70000) });
  window.gameState.globalVariables.k = 3;
  hide();
  await settled();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].body.notes, undefined, 'the hidden flush was reduced');
  assert.equal(sync._hiddenFlushKey, null);
  sync.stop();
});

// R3 m1: hide with a 45 KB flush in flight, show, change, hide again (a difference body
// with its own guard), then the first flush fails. The pagehide must still send the big
// delta: any failed hidden flush clears the guard, not only the newest one.
test('R3 m1: a failed earlier hidden flush clears the guard set by a later difference flush', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const m = modelServer();
  window.gameState.globalVariables.big = 'x'.repeat(45000);
  hide();
  show();
  window.gameState.globalVariables.late = 1;
  hide();
  assert.ok(m.pending[0].body.globalVariables?.big, 'the first hidden flush carried the big global');
  m.deliver(0, { fail: true });
  await settled();
  const before = m.pending.length;
  window.fire('pagehide');
  await settled();
  assert.ok(m.pending.length > before, 'the pagehide sent something');
  for (let i = 1; i < m.pending.length; i++) { m.deliver(i); await settled(); }
  assert.equal(m.server.globals.big, 'x'.repeat(45000), 'the big delta reached the server');
  assert.equal(m.server.globals.late, 1, 'the later change reached the server');
  sync.stop();
});

// Chunk 4 (SYNC_STALE_RING_PLAN section 8 and 11.4): the reduced flush body that chases
// the flushes in flight (_changesSinceInFlight) is now stamped with a fresh clientTs ABOVE
// them, not one below the oldest, and the "leave one free below" reservation is gone. The
// stale-but-recent ring (chunks 1 to 3) recovers an older flush that then lands second.

test('C4: the since-body is stamped one above the in-flight flush (not below), and the old below-stamp suppression is gone', async (t) => {
  // Freeze Date so every stamp is last+1: the flush and the since-body end up adjacent, the
  // exact case the old below-stamp rule (a since-body stamped one below the oldest flush, then
  // suppressed when that left no free slot) would have dropped once the reservation was
  // removed. It must now be sent, stamped above.
  t.mock.timers.enable({ apis: ['Date'] });
  const sync = resetGame();
  sync.start();
  reply = () => new Promise(() => {});                 // the hidden flush stays in flight
  window.gameState.notes.push({ id: 'n1', text: 'y'.repeat(40000) });
  hide();
  assert.equal(sync._flushesInFlight.size, 1, 'the hidden flush is in flight');
  const flush = [...sync._flushesInFlight][0];
  window.gameState.globalVariables.late = 1;
  window.fire('pagehide');
  assert.equal(sync._flushesInFlight.size, 2, 'the since-body was sent, not suppressed');
  const since = [...sync._flushesInFlight].find(f => f !== flush);
  assert.equal(requests.at(-1).body.globalVariables.late, 1, 'it carries only what changed since the flush');
  assert.equal(requests.at(-1).body.notes, undefined, 'the flush already carried the note');
  // With Date frozen the old below-stamp rule would have set clientTs = flush.clientTs - 1 and,
  // having no free slot below the flush, returned null (suppressed). The re-stamp instead draws
  // a fresh clientTs strictly above the flush and sends the body.
  assert.ok(since.clientTs > flush.clientTs, 'stamped above the flush, not suppressed below it');
  sync.stop();
});

test('C4: the whole-delta-if-it-fits branch is unchanged (a small delta beside a flush still goes whole, above it)', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  reply = () => new Promise(() => {});                 // the hidden flush stays in flight
  window.gameState.notes.push({ id: 'n1', text: 'small' });
  hide();
  const flush = [...sync._flushesInFlight][0];
  window.gameState.globalVariables.late = 1;
  window.fire('pagehide');
  const body = requests.at(-1).body;
  // The whole delta fits beside the flush, so it carries both the flush's note and the new
  // global (not a reduced body), stamped above the flush.
  assert.ok(Array.isArray(body.notes) && body.notes.some(n => n.id === 'n1'), 'the note rides the whole delta');
  assert.equal(body.globalVariables.late, 1, 'and the new global');
  assert.ok(body.clientTs > flush.clientTs, 'stamped above the flush');
  sync.stop();
});

// Integrator race (a): a hidden flush, a show, then a second hide whose re-stamped since-body
// is stamped above the first flush. Both land in each order; the ring keeps both.
async function hideShowHide() {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  const model = modelServer();
  window.gameState.globalVariables.big = 'x'.repeat(45000);
  hide();                                               // flush H1 (big), held by the model
  show();
  window.gameState.globalVariables.late = 1;
  hide();                                               // flush H2 (since-body: late), re-stamped above H1
  return { sync, ...model };
}

test('C4 race (a): hide, show, hide, then H1 before H2: both are saved', async () => {
  const { sync, server, pending, deliver } = await hideShowHide();
  assert.equal(pending.length, 2, 'two hidden flushes in flight');
  const [h1, h2] = pending.map(p => p.body);
  assert.deepEqual(h2.globalVariables, { late: 1 }, 'the second hide sent only what changed since the first');
  assert.ok(h2.clientTs > h1.clientTs, 're-stamped above the first flush');
  deliver(0); await settled();                          // H1 (big) lands first, fresh
  deliver(1); await settled();                          // H2 (late) lands second, fresh (above)
  assert.equal(server.globals.big.length, 45000, 'exact big saved');
  assert.equal(server.globals.late, 1, 'exact late saved');
  sync.stop();
});

test('C4 race (a): hide, show, hide, then H2 before H1: the ring recovers H1 and both are saved', async () => {
  const { sync, server, pending, deliver } = await hideShowHide();
  assert.equal(pending.length, 2);
  seedQualifyingRing(server, pending);                  // a prior write below H1: the guard holds
  deliver(1); await settled();                          // H2 (late) lands first, fresh
  deliver(0); await settled();                          // H1 (big) lands second, stale-but-recent
  assert.equal(server.globals.late, 1, 'exact late saved (landed first)');
  assert.equal(server.globals.big.length, 45000, 'exact big recovered by the ring, not lost');
  // H1 answered stale, so the client resends big once; the server already holds it.
  show();
  reply = () => ({ ok: true, json: { success: true } });
  const before = requests.length;
  await sync.sync();
  assert.equal(requests.length, before + 1, 'the stale-but-recent flush is resent once');
  assert.equal(requests.at(-1).body.globalVariables.big.length, 45000);
  sync.stop();
});

// Integrator race (b): a refused currentRoom carried by a re-stamped since-body. The since-
// body is a full body (currentRoom is never put in a reduced list), so _applyAnswer runs and
// the refusal is confirmed: currentRoom is not resent, but a genuinely new room still is.
test('C4 race (b): a refused currentRoom inside a re-stamped since-body is confirmed, not resent', async () => {
  const sync = resetGame();
  sync.start();
  await sync.sync();
  let releaseBig;
  reply = body => body.currentRoom
    ? Promise.resolve({ ok: true, json: { success: true, notSaved: ['currentRoom'] } })
    : new Promise(r => { releaseBig = () => r({ ok: true, json: { success: true } }); });
  window.gameState.globalVariables.big = 'x'.repeat(45000);
  hide();                                               // flush H1 (big), held
  const flush = [...sync._flushesInFlight][0];
  window.currentPlayerRoom = 'server_room';
  window.fire('pagehide');                              // since-body carries currentRoom, above H1
  await settle();
  const sent = requests.at(-1).body;
  assert.equal(sent.currentRoom, 'server_room', 'the since-body carried the room');
  assert.ok(sent.clientTs > flush.clientTs, 're-stamped above the flush');
  assert.equal(sent.globalVariables, undefined, 'big stayed with the flush, not the since-body');
  // The refusal was confirmed, so the next sync does not resend the refused room.
  releaseBig?.();
  await settle();
  reply = () => ({ ok: true, json: { success: true } });
  window.gameState.globalVariables.x = 1;
  await sync.sync();
  assert.equal(requests.at(-1).body.currentRoom, undefined, 'the refused room is not resent');
  // A genuinely new room still goes up.
  window.currentPlayerRoom = 'lobby2';
  await sync.sync();
  assert.equal(requests.at(-1).body.currentRoom, 'lobby2', 'a new room is still sent');
  sync.stop();
});
