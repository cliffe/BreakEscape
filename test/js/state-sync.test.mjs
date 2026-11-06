// StateSync sends only what changed since the last save the server confirmed
// (plan B): change detection per section, null for a deleted global, the
// clock-only rule, nothing confirmed on failure or a stale answer, one sync in
// flight per page, and clientTs that only increases.
// Run with: node --test test/js/state-sync.test.mjs
//
// The browser modules are copied to a temp dir as .mjs (the repo has no
// "type": "module"), as in phone-reopen-and-persistence.test.mjs.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'state-sync-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

// A fetch that records each request; reply() decides the answer
let requests = [];
let reply = () => ({ ok: true, json: { success: true } });
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  requests.push({ url, init, body });
  const r = await reply(body);
  return { ok: r.ok, status: r.ok ? 200 : 500, statusText: '', json: async () => r.json };
};

let clockMs = 600000;
let timers = { elapsedMs: 600000, fired: [], cancelled: [], started: {} };

// A minimal game: globals, notes, a room, the clock, and an npcManager whose
// phone tracking behaves like the real one (exportPhoneState onlyChanged).
function resetGame() {
  requests = [];
  reply = () => ({ ok: true, json: { success: true } });
  clockMs = 600000;
  timers = { elapsedMs: 600000, fired: [], cancelled: [], started: {} };
  const phone = { hax: { history: [{ type: 'npc', text: 'hi', read: true }] } };
  const sent = new Map();
  Object.assign(globalThis.window, {
    gameState: { globalVariables: { a: 1, b: true }, notes: [{ id: 'n1', title: 'T', text: 'x', sprite: {} }] },
    currentRoom: { name: 'lobby' },
    gameClock: { exportState: () => ({ elapsedMs: clockMs }) },
    scenarioTimerDispatcher: { exportState: () => JSON.parse(JSON.stringify(timers)) },
    npcManager: {
      phone,
      exportPhoneState({ onlyChanged }) {
        const out = {};
        for (const [id, e] of Object.entries(phone)) {
          if (onlyChanged && sent.get(id) === JSON.stringify(e)) continue;
          out[id] = JSON.parse(JSON.stringify(e));
        }
        return out;
      },
      markPhoneStateSynced(exported) {
        for (const [id, e] of Object.entries(exported || {})) sent.set(id, JSON.stringify(e));
      },
      exportTriggeredEvents: () => ({ 'hax:start:0': 1 }),
      exportNpcVisibility: () => ({}),
      exportTimedMessages: () => ({ pending: [], delivered: [] })
    }
  });
  const sync = new StateSync();
  Object.assign(console, quiet);
  return sync;
}

test('the first sync sends a full snapshot; the next, with nothing changed, sends nothing', async () => {
  const sync = resetGame();
  await sync.sync();
  assert.equal(requests.length, 1);
  const first = requests[0].body;
  assert.deepEqual(first.globalVariables, { a: 1, b: true });
  assert.equal(first.currentRoom, 'lobby');
  assert.deepEqual(first.notes.map(n => n.id), ['n1']);
  assert.equal(first.notes[0].sprite, undefined, 'plain note fields only');
  assert.ok(first.phoneState.hax);
  assert.deepEqual(first.triggeredEvents, { 'hax:start:0': 1 });
  assert.ok(first.scenarioClock);

  clockMs += 30000; // time passes, nothing else
  await sync.sync();
  assert.equal(requests.length, 1, 'an idle player makes no request');
});

test('one changed global sends only that key, with the clock', async () => {
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.a = 2;
  clockMs += 30000;
  await sync.sync();
  const body = requests[1].body;
  assert.deepEqual(body.globalVariables, { a: 2 });
  assert.equal(body.currentRoom, undefined, 'unchanged room not sent');
  assert.equal(body.notes, undefined);
  assert.equal(body.phoneState, undefined);
  assert.equal(body.triggeredEvents, undefined);
  assert.equal(body.scenarioClock.elapsedMs, clockMs, 'the clock rides along');
});

test('a deleted global is sent as null, once', async () => {
  const sync = resetGame();
  await sync.sync();
  delete window.gameState.globalVariables.b;
  await sync.sync();
  assert.deepEqual(requests[1].body.globalVariables, { b: null });
  await sync.sync();
  assert.equal(requests.length, 2, 'the deletion is confirmed and not resent');
});

test('notes, the room, phone threads and ink variables are sent only when they change', async () => {
  const sync = resetGame();
  window.npcConversationStateManager = { vars: { hax: { met: false }, eve: { met: false } }, exportNpcInkVariables() { return JSON.parse(JSON.stringify(this.vars)); } };
  await sync.sync();

  window.gameState.notes.push({ id: 'n2', title: 'U', text: 'y' });
  window.currentRoom = { name: 'office' };
  window.npcManager.phone.hax.history.push({ type: 'player', text: 'ok', read: true });
  window.npcConversationStateManager.vars.eve.met = true;
  await sync.sync();
  const body = requests[1].body;
  assert.deepEqual(body.notes.map(n => n.id), ['n2'], 'only the new note');
  assert.equal(body.currentRoom, 'office');
  assert.deepEqual(Object.keys(body.phoneState), ['hax']);
  assert.deepEqual(body.npcInkVariables, { eve: { met: true } }, 'only the changed NPC, whole entry');

  window.gameState.notes[0].read = true;
  await sync.sync();
  assert.deepEqual(requests[2].body.notes.map(n => n.id), ['n1'], 'a changed note is resent by id');
  delete window.npcConversationStateManager;
});

test('elapsed time alone is sent at most every 5 minutes; a timer change is sent at once', async () => {
  const sync = resetGame();
  await sync.sync();
  clockMs += 4 * 60 * 1000;
  await sync.sync();
  assert.equal(requests.length, 1, 'under 5 minutes of clock alone: nothing');

  sync.clockConfirmedAt -= 5 * 60 * 1000; // as if 5 minutes have passed since it was confirmed
  await sync.sync();
  assert.equal(requests.length, 2);
  assert.deepEqual(Object.keys(requests[1].body).sort(), ['clientTs', 'scenarioClock', 'timedMessages']);

  timers.fired.push('deadline');
  await sync.sync();
  assert.equal(requests.length, 3, 'a fired timer is a real change');
  assert.deepEqual(requests[2].body.scenarioClock.timers.fired, ['deadline']);

  timers.started.countdown = 1000;
  await sync.sync();
  assert.equal(requests.length, 4, 'a started timer is a real change');
  timers.started.countdown = 31000;
  await sync.sync();
  assert.equal(requests.length, 4, 'a started timer running on is not');
});

test('a failed sync confirms nothing, so the next one resends the change with its current value', async () => {
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.a = 2;
  window.npcManager.phone.hax.history.push({ type: 'npc', text: 'new', read: false });
  reply = () => ({ ok: false, json: { error: 'boom' } });
  await sync.sync();
  window.gameState.globalVariables.a = 3;
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  const body = requests[2].body;
  assert.deepEqual(body.globalVariables, { a: 3 });
  assert.ok(body.phoneState.hax, 'the phone thread is resent too');
  await sync.sync();
  assert.equal(requests.length, 3);
});

test('a stale answer confirms nothing', async () => {
  const sync = resetGame();
  reply = () => ({ ok: true, json: { success: true, stale: true } });
  await sync.sync();
  reply = () => ({ ok: true, json: { success: true } });
  await sync.sync();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].body.globalVariables, { a: 1, b: true }, 'everything is sent again');
  assert.equal(requests[1].body.currentRoom, 'lobby');
  assert.ok(requests[1].body.phoneState.hax);
});

test('one sync in flight: calls meanwhile share one run straight after it', async () => {
  const sync = resetGame();
  let release;
  let inFlight = 0;
  let maxInFlight = 0;
  reply = () => {
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    return new Promise(resolve => { release = () => { inFlight--; resolve({ ok: true, json: { success: true } }); }; });
  };
  const first = sync.sync();
  await new Promise(r => setImmediate(r));
  window.gameState.globalVariables.a = 5;
  const second = sync.sync();
  const third = sync.sync();
  assert.equal(second, third, 'queued callers share the follow-up run');
  assert.equal(requests.length, 1, 'nothing runs in parallel');
  release();
  await first;
  await new Promise(r => setImmediate(r));
  assert.equal(requests.length, 2, 'the queued sync runs straight after');
  release();
  await second;
  assert.equal(maxInFlight, 1);
  assert.deepEqual(requests[1].body.globalVariables, { a: 5 });
});

test('clientTs always increases, even within one millisecond or with the clock set back', async () => {
  const sync = resetGame();
  const realNow = Date.now;
  try {
    Date.now = () => 1000;
    const a = sync.nextClientTs();
    const b = sync.nextClientTs();
    Date.now = () => 500;
    const c = sync.nextClientTs();
    assert.ok(a < b && b < c, `${a} < ${b} < ${c}`);
  } finally {
    Date.now = realNow;
  }
  await sync.sync();
  window.gameState.globalVariables.a = 9;
  await sync.sync();
  assert.ok(requests[1].body.clientTs > requests[0].body.clientTs);
});

test('flush sends the changes since the last confirmed sync, with the clock, by keepalive', async () => {
  const sync = resetGame();
  await sync.sync();
  window.gameState.globalVariables.a = 7;
  sync.flush();
  await new Promise(r => setImmediate(r));
  const req = requests[1];
  assert.equal(req.init.keepalive, true);
  assert.deepEqual(req.body.globalVariables, { a: 7 });
  assert.equal(req.body.notes, undefined);
  assert.ok(req.body.scenarioClock, 'the clock is always on a flush');
  assert.ok(req.body.clientTs > requests[0].body.clientTs);

  // Nothing changed at all: the flush still saves the clock
  const idle = resetGame();
  await idle.sync();
  idle.flush();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(Object.keys(requests[1].body).sort(), ['clientTs', 'scenarioClock', 'timedMessages']);
});

test('an oversized flush falls back to the reload-critical sections and keeps clientTs', async () => {
  const sync = resetGame();
  window.gameState.notes = [{ id: 'big', title: 'B', text: 'x'.repeat(70000) }];
  sync.flush();
  await new Promise(r => setImmediate(r));
  const body = requests[0].body;
  assert.equal(body.notes, undefined);
  assert.ok(body.globalVariables);
  assert.ok(body.phoneState);
  assert.equal(typeof body.clientTs, 'number');
});

test('scenarioBriefShown is sent once, then not again once confirmed', async () => {
  const sync = resetGame();
  await sync.sync();
  assert.equal(requests[0].body.scenarioBriefShown, undefined, 'not shown yet');
  window.gameState.scenarioBriefShown = true;
  await sync.sync();
  assert.equal(requests[1].body.scenarioBriefShown, true);
  window.gameState.globalVariables.a = 2;
  await sync.sync();
  assert.equal(requests[2].body.scenarioBriefShown, undefined);
});
