// StateSync.syncConfirmed: true once the server confirms, retries with back-off
// on a stale answer or failure, stops at the attempt cap, and stops at once on
// a 403 refusal. Run with: node --test test/js/social-state-sync-confirmed.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'state-sync-confirmed-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const realConsole = globalThis.console;
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

let requests = [];
let replies = []; // consumed in order; the last one repeats
globalThis.fetch = async (url, init) => {
  requests.push(JSON.parse(init.body));
  const r = replies.length > 1 ? replies.shift() : replies[0];
  return { ok: r.status === 200, status: r.status, statusText: '', json: async () => r.json || { success: true } };
};

function setup(...rs) {
  requests = [];
  replies = rs;
  Object.assign(globalThis.window, {
    gameState: { globalVariables: { a: 1 } },
    currentRoom: { name: 'lobby' }
  });
  const s = new StateSync();
  // Make every run see a change to send, so a stale answer really re-sends
  s.buildChanges = () => ({ body: { globalVariables: { a: 1 } } });
  s.confirm = () => {};
  return s;
}
const ok = { status: 200 };
const stale = { status: 200, json: { success: true, stale: true } };
const fail500 = { status: 500 };
const fail403 = { status: 403 };

// Real timers, but the back-off is shortened by stubbing setTimeout delays
const realSetTimeout = globalThis.setTimeout;
const delays = [];
function fastTimers() {
  globalThis.setTimeout = (fn, ms, ...a) => { delays.push(ms); return realSetTimeout(fn, 0, ...a); };
}
function realTimers() { globalThis.setTimeout = realSetTimeout; delays.length = 0; }

test('success on the first run returns true with no retry', async () => {
  globalThis.console = quiet; fastTimers();
  try {
    const s = setup(ok);
    let retries = 0;
    assert.equal(await s.syncConfirmed({ onRetry: () => retries++ }), true);
    assert.equal(requests.length, 1);
    assert.equal(retries, 0);
  } finally { globalThis.console = realConsole; realTimers(); }
});

test('sync() still resolves for existing callers (boolean now, ignored)', async () => {
  globalThis.console = quiet;
  try {
    const s = setup(ok);
    assert.equal(await s.sync(), true);
    const t = setup(fail500);
    assert.equal(await t.sync(), false);
  } finally { globalThis.console = realConsole; }
});

test('retries after a failure then succeeds, calling onRetry with the attempt index', async () => {
  globalThis.console = quiet; fastTimers();
  try {
    const s = setup(fail500, stale, ok);
    const seen = [];
    assert.equal(await s.syncConfirmed({ onRetry: i => seen.push(i) }), true);
    assert.equal(requests.length, 3);
    assert.deepEqual(seen, [0, 1]);
    assert.deepEqual(delays, [250, 500]);
  } finally { globalThis.console = realConsole; realTimers(); }
});

test('stops at the attempt cap and returns false', async () => {
  globalThis.console = quiet; fastTimers();
  try {
    const s = setup(fail500);
    const seen = [];
    assert.equal(await s.syncConfirmed({ attempts: 3, onRetry: i => seen.push(i) }), false);
    assert.equal(requests.length, 3);
    assert.deepEqual(seen, [0, 1]);
  } finally { globalThis.console = realConsole; realTimers(); }
});

test('back-off is capped at 4 s', async () => {
  globalThis.console = quiet; fastTimers();
  try {
    const s = setup(stale);
    assert.equal(await s.syncConfirmed({ attempts: 8 }), false);
    assert.deepEqual(delays, [250, 500, 1000, 2000, 4000, 4000, 4000]);
  } finally { globalThis.console = realConsole; realTimers(); }
});

test('a 403 is final: false, one request, no retry', async () => {
  globalThis.console = quiet; fastTimers();
  try {
    const s = setup(fail403);
    let retries = 0;
    assert.equal(await s.syncConfirmed({ onRetry: () => retries++ }), false);
    assert.equal(requests.length, 1);
    assert.equal(retries, 0);
    assert.equal(s.lastError.status, 403);
  } finally { globalThis.console = realConsole; realTimers(); }
});
