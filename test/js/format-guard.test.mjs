// Step 7 phase 2: the format-guard fetch wrapper, its reload-once rule, the banner and
// the bootstrap refusal. Each case loads a fresh copy of the module (a unique data-URL
// suffix) so held/banner state resets, after a fresh window is installed.
// Run with: node test/js/format-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const src = readFileSync(join(js, 'format-guard.js'), 'utf8');
let seq = 0;
const freshGuard = () =>
  import('data:text/javascript;base64,' + Buffer.from(src + `\n//${seq++}`).toString('base64'));

const delay = (ms = 10) => new Promise((r) => setTimeout(r, ms));

// A minimal Response-like. headers.get is case-insensitive on the one header we read.
function makeResponse({ status = 200, format, json = undefined, contentType } = {}) {
  const h = new Map();
  if (format !== undefined) h.set('x-break-escape-format', String(format));
  if (contentType) h.set('content-type', contentType);
  return {
    status,
    headers: { get: (k) => (h.has(String(k).toLowerCase()) ? h.get(String(k).toLowerCase()) : null) },
    _bodyRead: false,
    clone() {
      return {
        json: async () => {
          if (json === 'throw') throw new Error('bad json');
          return json;
        }
      };
    }
  };
}

function fakeSessionStorage({ throws = false } = {}) {
  const map = new Map();
  return {
    getItem: (k) => {
      if (throws) throw new Error('storage blocked');
      return map.has(k) ? map.get(k) : null;
    },
    setItem: (k, v) => {
      if (throws) throw new Error('storage blocked');
      map.set(k, v);
    }
  };
}

function fakeDocument() {
  const els = {};
  return {
    body: { appendChild: (el) => { els[el.id] = el; } },
    createElement: () => {
      const el = { style: {}, setAttribute() {}, _id: null, _text: null };
      Object.defineProperty(el, 'id', { get() { return el._id; }, set(v) { el._id = v; } });
      Object.defineProperty(el, 'textContent', { get() { return el._text; }, set(v) { el._text = v; } });
      return el;
    },
    getElementById: (id) => els[id] || null
  };
}

// Build a fresh window + document, install a fresh guard over the given real fetch, and
// return the module plus counters.
async function setup({ sessionThrows = false } = {}) {
  const counters = { reloads: 0, syncs: 0, realCalls: [] };
  let realResponse = makeResponse({ format: 0 });
  const realFetch = (input, init) => {
    counters.realCalls.push({ input, init });
    return Promise.resolve(realResponse);
  };
  globalThis.window = {
    fetch: realFetch,
    sessionStorage: fakeSessionStorage({ throws: sessionThrows }),
    stateSync: { syncConfirmed: async () => { counters.syncs += 1; return true; } },
    location: { reload: () => { counters.reloads += 1; } },
    breakEscapeConfig: { gameId: 7 }
  };
  globalThis.document = fakeDocument();
  const mod = await freshGuard();
  return {
    mod,
    counters,
    // window.fetch is now the wrapper; set what the next real fetch returns
    setResponse: (r) => { realResponse = r; },
    call: async (init) => { const p = window.fetch('/break_escape/games/7/room/finance', init); await p; await delay(); return p; }
  };
}

test('held 0, header 0: nothing happens', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(undefined); // absent formatVersion -> 0
  assert.equal(s.mod.heldFormatVersion(), 0);
  s.setResponse(makeResponse({ format: 0 }));
  await s.call();
  assert.equal(s.counters.reloads, 0);
  assert.equal(document.getElementById('be-format-banner'), null);
});

test('header absent: nothing happens', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(0);
  s.setResponse(makeResponse({})); // no header
  await s.call();
  assert.equal(s.counters.reloads, 0);
  assert.equal(document.getElementById('be-format-banner'), null);
});

test('held null (bootstrap not read): nothing is compared', async () => {
  const s = await setup();
  assert.equal(s.mod.heldFormatVersion(), null);
  s.setResponse(makeResponse({ format: 5 }));
  await s.call();
  assert.equal(s.counters.reloads, 0);
});

test('header 1 against 0 flushes the pending sync and reloads once; a repeat shows the banner, not a reload, and saving carries on; a new pair reloads again', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(0);
  s.setResponse(makeResponse({ format: 1 }));
  await s.call();
  assert.equal(s.counters.reloads, 1, 'first mismatch reloads once');
  assert.equal(s.counters.syncs, 1, 'pending sync flushed before reload');
  assert.equal(document.getElementById('be-format-banner'), null, 'no banner on the reload path');

  // After the (mocked) reload the session key for 0:1 is present, so a repeat shows the banner.
  await s.call();
  assert.equal(s.counters.reloads, 1, 'second mismatch on the same pair does not reload');
  const banner = document.getElementById('be-format-banner');
  assert.ok(banner, 'banner shown on the second mismatch');
  assert.match(banner.textContent, /This game has been updated/);

  // Saving still happens: the next request still reaches the real fetch.
  const before = s.counters.realCalls.length;
  await s.call();
  assert.ok(s.counters.realCalls.length > before, 'the next sync is still sent');

  // A new version pair reloads again.
  s.setResponse(makeResponse({ format: 2 }));
  await s.call();
  assert.equal(s.counters.reloads, 2, 'a new pair reloads again');
});

test('sessionStorage throwing shows the banner and never reloads', async () => {
  const s = await setup({ sessionThrows: true });
  s.mod.setHeldFormatVersion(0);
  s.setResponse(makeResponse({ format: 1 }));
  await s.call();
  assert.equal(s.counters.reloads, 0);
  assert.ok(document.getElementById('be-format-banner'));
});

test('a mismatch on the keepalive flush does nothing', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(0);
  s.setResponse(makeResponse({ format: 1 }));
  await s.call({ keepalive: true, method: 'PUT' });
  assert.equal(s.counters.reloads, 0);
  assert.equal(document.getElementById('be-format-banner'), null);
});

test('a 409 format refusal (no header) reloads once, then the banner carries the message and the not-saved line', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(0);
  const refusal = { status: 409, contentType: 'application/json', json: { error: 'format', message: 'Server reads an older format.', current: 3 } };
  s.setResponse(makeResponse(refusal));
  await s.call(); // room fetch
  assert.equal(s.counters.reloads, 1, 'refusal reloads once by the body current key');
  // a sync-shaped request on the same refusal, after the reload: banner, no second reload
  await s.call({ method: 'PUT' });
  assert.equal(s.counters.reloads, 1);
  const banner = document.getElementById('be-format-banner');
  assert.ok(banner);
  assert.match(banner.textContent, /Server reads an older format\./);
  assert.match(banner.textContent, /Progress cannot be saved on this server\./);
});

test('a 409 with another error does nothing; a non-JSON 409 does nothing; an unparseable body does nothing and the response is left unread', async () => {
  const s = await setup();
  s.mod.setHeldFormatVersion(0);

  s.setResponse(makeResponse({ status: 409, contentType: 'application/json', json: { error: 'stale' } }));
  await s.call();
  assert.equal(s.counters.reloads, 0, 'another 409 error');

  s.setResponse(makeResponse({ status: 409, contentType: 'text/html' }));
  await s.call();
  assert.equal(s.counters.reloads, 0, 'non-JSON 409');

  const unparseable = makeResponse({ status: 409, contentType: 'application/json', json: 'throw' });
  s.setResponse(unparseable);
  const resp = await s.call();
  assert.equal(s.counters.reloads, 0, 'unparseable body');
  assert.equal(resp.status, 409, 'the caller still gets the original response');
});

test('showBootstrapRefusal shows the message in #loading on a 409 format, and starts nothing otherwise', async () => {
  const s = await setup();
  const doc = fakeDocument();
  // seed a #loading element
  const loading = doc.createElement();
  loading.id = 'loading';
  doc.body.appendChild(loading);

  const ok = await s.mod.showBootstrapRefusal('/break_escape/games/7/scenario', {
    fetch: async () => makeResponse({ status: 409, contentType: 'application/json', json: { error: 'format', message: 'Saved by a newer version.' } }),
    document: doc
  });
  assert.equal(ok, true);
  assert.equal(doc.getElementById('loading').textContent, 'Saved by a newer version.');

  const no = await s.mod.showBootstrapRefusal('/x', {
    fetch: async () => makeResponse({ status: 200, format: 0 }),
    document: doc
  });
  assert.equal(no, false);
});
