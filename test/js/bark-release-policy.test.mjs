// Release policy for barks held behind a minigame (bark-release-policy.js).
// Run with: node --test test/js/bark-release-policy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/bark-release-policy.js');
const dir = mkdtempSync(join(tmpdir(), 'bark-release-'));
writeFileSync(join(dir, 'policy.mjs'), readFileSync(src, 'utf8'));
const { releaseHeldBarks, HELD_BARK_GAP_MS, HELD_BARK_CAP, HELD_BARK_VOICE_CAP_MS, HELD_BARK_VOICE_PAUSE_MS } =
  await import(pathToFileURL(join(dir, 'policy.mjs')).href);

// npc-barks.js with its imports stubbed, except the real policy (gap and voice cap shortened
// through globals so the tests run on real timers in milliseconds).
writeFileSync(join(dir, 'npc-barks.mjs'), `
import { releaseHeldBarks as realRelease } from './policy.mjs';
const releaseHeldBarks = (q, o) => realRelease(q, { ...o, gapMs: globalThis.__gapMs, voiceCapMs: globalThis.__capMs, pauseMs: globalThis.__pauseMs });
const ASSETS_PATH = '', overlayDepth = () => 0, displayDashes = (s) => s;
const workstationPopupOpen = () => false, phoneThreadOpenFor = () => false, openPhoneThread = () => null, threadTextKey = () => '';
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, inventoryBlockedByForcedMinigame = () => false;
const phoneBarkText = (s) => s;
class TTSManager {}
` + readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8')
  .replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));
globalThis.window = globalThis.window || {};
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const bark = (text, extra = {}) => ({ npcId: 'n', text, ...extra });
function harness({ hold = () => false, persistent = () => false } = {}) {
  const shown = [], sleeps = [], logs = [];
  return {
    shown, sleeps, logs,
    opts: {
      shouldHold: hold,
      render: async (p) => { shown.push(p.text); },
      sleep: async (ms) => { sleeps.push(ms); },
      hasPersistentCopy: persistent,
      log: (...a) => logs.push(a.join(' '))
    }
  };
}

test('FIFO: barks show in the order they were held', async () => {
  const h = harness();
  await releaseHeldBarks([bark('a'), bark('b'), bark('c')], h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('a stale bark is dropped at release and logged; a still-valid one shows', async () => {
  let restored = false;
  const h = harness();
  const q = [bark('next is the restore', { stillValid: () => !restored }), bark('warning', { stillValid: () => true })];
  restored = true;
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['warning']);
  assert.ok(h.logs.some(l => l.includes('stale') && l.includes('next is the restore')));
});

test('a bark that goes stale mid-release is dropped just before it would show', async () => {
  let flag = true;
  const h = harness();
  h.opts.render = async (p) => { h.shown.push(p.text); flag = false; };
  await releaseHeldBarks([bark('a'), bark('b', { stillValid: () => flag })], h.opts);
  assert.deepEqual(h.shown, ['a']);
  assert.ok(h.logs.some(l => l.includes('stale')));
});

test('an unconditioned bark is kept', async () => {
  const h = harness();
  await releaseHeldBarks([bark('plain')], h.opts);
  assert.deepEqual(h.shown, ['plain']);
  assert.equal(h.logs.length, 0);
});

test('spacing: one at a time, a gap between barks and none after the last', async () => {
  const h = harness();
  const order = [];
  h.opts.render = async (p) => { order.push(`show ${p.text}`); };
  h.opts.sleep = async (ms) => { order.push(`wait ${ms}`); };
  await releaseHeldBarks([bark('a'), bark('b'), bark('c')], h.opts);
  assert.deepEqual(order, ['show a', `wait ${HELD_BARK_GAP_MS}`, 'show b', `wait ${HELD_BARK_GAP_MS}`, 'show c']);
  assert.equal(HELD_BARK_GAP_MS, 2500);
});

test('re-hold: a minigame opening mid-release leaves the rest queued; they release later', async () => {
  let open = false;
  const h = harness({ hold: () => open });
  h.opts.sleep = async () => { open = true; };      // opens during the first gap
  const q = [bark('a'), bark('b'), bark('c')];
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a']);
  assert.deepEqual(q.map(p => p.text), ['b', 'c']);
  open = false; h.opts.sleep = async () => {};
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('nothing is released while a minigame is still open', async () => {
  const h = harness({ hold: () => true });
  const q = [bark('a')];
  assert.equal(await releaseHeldBarks(q, h.opts), 0);
  assert.equal(q.length, 1);
});

test('cap: over 3 waiting, only the oldest ones with a persistent copy are dropped', async () => {
  const keep = new Set(['no-copy-1', 'no-copy-2']);
  const h = harness({ persistent: p => !keep.has(p.text) });
  const q = ['no-copy-1', 'p2', 'no-copy-2', 'p4', 'p5', 'p6'].map(t => bark(t));
  await releaseHeldBarks(q, h.opts);
  // 6 waiting, cap 3: drop the 3 oldest-first persistent ones (p2, p4, p5); p6 is newest-but-fine
  assert.deepEqual(h.shown, ['no-copy-1', 'no-copy-2', 'p6']);
  assert.equal(h.logs.filter(l => l.includes('capped')).length, 3);
});

test('cap: barks with no persistent copy are never dropped, however many', async () => {
  const h = harness();
  const q = Array.from({ length: 8 }, (_, i) => bark(`b${i}`));
  await releaseHeldBarks(q, h.opts);
  assert.equal(h.shown.length, 8);
  assert.equal(HELD_BARK_CAP, 3);
});

test('stale barks do not count towards the cap', async () => {
  const h = harness({ persistent: () => true });
  const q = [bark('a'), bark('b'), bark('s1', { stillValid: () => false }), bark('s2', { stillValid: () => false }), bark('c')];
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('wiring: npc-barks.js uses the policy and the manager passes stillValid', () => {
  const barks = readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8');
  const mgr = readFileSync(join(here, '../../public/break_escape/js/systems/npc-manager.js'), 'utf8');
  assert.match(barks, /releaseHeldBarks\(this\.deferredBarkQueue/);
  assert.equal((mgr.match(/stillValid/g) || []).length >= 3, true);
});

test('wiring: the persistent-copy check finds the NPC manager although main.js never links it', () => {
  // main.js does `new NPCBarkSystem()` with no manager; without a fallback the cap never fired
  const barks = readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8');
  const body = barks.slice(barks.indexOf('_hasPersistentCopy(payload) {'));
  assert.match(body.slice(0, 600), /this\.npcManager \|\| \(typeof window !== 'undefined' \? window\.npcManager : null\)/);
});

// ---- the last held bark's voice (train 31: Ravi's held bark ran 1.2 s into Helen's) ----

function deferred() { let resolve; const p = new Promise(r => { resolve = r; }); return { p, resolve }; }

test('a voiced last bark keeps the release going: a bark that joins during its voice waits for it', async () => {
  const order = [];
  const voice = deferred();
  const q = [bark('ravi')];
  const opts = {
    shouldHold: () => false,
    render: (p) => { order.push(`show ${p.text}`); return p.text === 'ravi' ? { voiceEnd: voice.p } : undefined; },
    sleep: (ms) => wait(ms === 1000 ? 1000 : ms), gapMs: 5, voiceCapMs: 1000, pauseMs: 5, log: () => {}
  };
  const run = releaseHeldBarks(q, opts);
  await wait(10);
  q.push(bark('helen'));                       // her barkDelay fires while his voice plays
  order.push('helen due');
  await wait(10);
  assert.deepEqual(order, ['show ravi', 'helen due'], 'not shown over his voice');
  order.push('ravi voice ends'); voice.resolve(true);
  assert.equal(await run, 2);
  assert.deepEqual(order, ['show ravi', 'helen due', 'ravi voice ends', 'show helen']);
});

test('the next bark waits for max(voice end + pause, shown + gap): the gap wins after a short voice', async () => {
  const t = {};
  const t0 = Date.now();
  await releaseHeldBarks([bark('a'), bark('b')], {
    shouldHold: () => false,
    render: (p) => { t[`show ${p.text}`] = Date.now() - t0; return { voiceEnd: wait(5).then(() => { t[`end ${p.text}`] = Date.now() - t0; return true; }) }; },
    sleep: (ms) => wait(ms), gapMs: 120, voiceCapMs: 1000, pauseMs: 20, log: () => {}
  });
  assert.ok(t['show b'] - t['show a'] >= 115, `gap kept: ${JSON.stringify(t)}`);
  assert.ok(t['show b'] > t['end a']);
});

test('after a long voice the next bark waits HELD_BARK_VOICE_PAUSE_MS (300 ms) past its end', async () => {
  assert.equal(HELD_BARK_VOICE_PAUSE_MS, 300);
  const t = {};
  const t0 = Date.now();
  await releaseHeldBarks([bark('a'), bark('b')], {
    shouldHold: () => false,
    // a voice longer than the gap; pauseMs left at its default
    render: (p) => { t[`show ${p.text}`] = Date.now() - t0; return p.text === 'a' ? { voiceEnd: wait(60).then(() => { t['end a'] = Date.now() - t0; return true; }) } : undefined; },
    sleep: (ms) => wait(ms), gapMs: 20, voiceCapMs: 5000, log: () => {}
  });
  const pause = t['show b'] - t['end a'];
  assert.ok(pause >= 295 && pause < 600, `pause after the voice: ${pause} ms`);
});

test('the pause also follows the last spoken bark before the release ends', async () => {
  let endAt = 0;
  const t0 = Date.now();
  await releaseHeldBarks([bark('a')], {
    shouldHold: () => false,
    render: () => ({ voiceEnd: wait(30).then(() => { endAt = Date.now() - t0; return true; }) }),
    sleep: (ms) => wait(ms), gapMs: 5, voiceCapMs: 5000, pauseMs: 80, log: () => {}
  });
  assert.ok(Date.now() - t0 - endAt >= 75, 'still busy for the pause');
});

test('no voice (TTS 503, no audio): the last bark ends the release at once, as before', async () => {
  const sleeps = [];
  const t0 = Date.now();
  const shown = await releaseHeldBarks([bark('a')], {
    shouldHold: () => false,
    render: () => ({ voiceEnd: Promise.resolve(false) }),
    sleep: (ms) => { sleeps.push(ms); return new Promise(() => {}); },   // a gap that never ends
    gapMs: 5000, voiceCapMs: 60000, log: () => {}
  });
  assert.equal(shown, 1);
  assert.ok(Date.now() - t0 < 500, 'did not wait the gap');
});

test('cap: a voice that never settles is waited for at most voiceCapMs, then the line goes on', async () => {
  const logs = [];
  const q = [bark('hung'), bark('next')];
  const shown = [];
  const t0 = Date.now();
  const n = await releaseHeldBarks(q, {
    shouldHold: () => false,
    render: (p) => { shown.push(p.text); return { voiceEnd: new Promise(() => {}) }; },
    sleep: (ms) => wait(ms), gapMs: 5, voiceCapMs: 40, log: (...a) => logs.push(a.join(' '))
  });
  assert.equal(n, 2);
  assert.deepEqual(shown, ['hung', 'next']);
  assert.ok(Date.now() - t0 < 1000);
  assert.ok(logs.some(l => l.includes('capped') && l.includes('hung')));
  assert.equal(HELD_BARK_VOICE_CAP_MS, 30000);
});

test('cap: no "capped" log when the voice ended first', async () => {
  const logs = [];
  await releaseHeldBarks([bark('a')], {
    shouldHold: () => false,
    render: () => ({ voiceEnd: Promise.resolve(true) }),
    sleep: (ms) => wait(ms), gapMs: 5, voiceCapMs: 30, log: (...a) => logs.push(a.join(' '))
  });
  await wait(50);
  assert.equal(logs.length, 0);
});

test('a minigame opening during the last voice holds the bark that joined; it shows on the next release', async () => {
  let open = false;
  const voice = deferred();
  const shown = [];
  const q = [bark('ravi')];
  const opts = {
    shouldHold: () => open,
    render: (p) => { shown.push(p.text); return p.text === 'ravi' ? { voiceEnd: voice.p } : undefined; },
    sleep: (ms) => wait(ms), gapMs: 5, voiceCapMs: 1000, log: () => {}
  };
  const run = releaseHeldBarks(q, opts);
  await wait(10);
  q.push(bark('helen'));
  open = true;
  voice.resolve(true);
  assert.equal(await run, 1);
  assert.deepEqual(q.map(p => p.text), ['helen'], 'still held');
  open = false;
  await releaseHeldBarks(q, opts);
  assert.deepEqual(shown, ['ravi', 'helen']);
});

test('stale and capped rules still apply to barks released after a voice', async () => {
  let valid = true;
  const voice = deferred();
  const shown = [];
  const q = [bark('a')];
  const run = releaseHeldBarks(q, {
    shouldHold: () => false,
    render: (p) => { shown.push(p.text); return p.text === 'a' ? { voiceEnd: voice.p } : undefined; },
    sleep: (ms) => wait(ms), gapMs: 5, voiceCapMs: 1000, log: () => {}
  });
  await wait(5);
  q.push(bark('gone', { stillValid: () => valid }), bark('kept'));
  valid = false;
  voice.resolve(true);
  await run;
  assert.deepEqual(shown, ['a', 'kept']);
});

// ---- the same through NPCBarkSystem.showBark / drainDeferredBarks ----

function barkSystem() {
  globalThis.__gapMs = 5; globalThis.__capMs = 2000; globalThis.__pauseMs = 10;
  const sys = new NPCBarkSystem(null);
  sys.container = { querySelectorAll: () => [] };
  sys.events = [];
  const t0 = Date.now();
  sys._renderBark = (p) => {
    sys.events.push({ at: Date.now() - t0, what: `start ${p.text}` });
    if (!p.voiceMs) return Promise.resolve(null);
    // A fake audio element: playing, ends after voiceMs
    const audio = new EventTarget();
    audio.paused = false; audio.ended = false;
    sys.ttsManagers.set(p.npcId, { audio });
    setTimeout(() => {
      audio.ended = true; audio.paused = true;
      sys.events.push({ at: Date.now() - t0, what: `end ${p.text}` });
      audio.dispatchEvent(new Event('ended'));
    }, p.voiceMs);
    return Promise.resolve(p.voiceMs);
  };
  return sys;
}
const whats = (sys) => sys.events.map(e => e.what);

test('NPCBarkSystem: a bark due while the last held voice plays is held behind it (train 31)', async () => {
  const sys = barkSystem();
  try {
    window.currentConversationMinigameType = 'person-chat';     // the network map panel
    sys.showBark({ npcId: 'ravi', text: 'ravi', voiceMs: 80 });
    assert.equal(sys.deferredBarkQueue.length, 1);
    window.currentConversationMinigameType = null;
    const drained = sys.drainDeferredBarks();
    await wait(20);
    assert.equal(sys.isDrainingDeferred, true, 'still busy while his voice plays');
    sys.showBark({ npcId: 'helen', text: 'helen', voiceMs: 30 });   // her barkDelay fires
    assert.deepEqual(whats(sys), ['start ravi'], 'held, not rendered over him');
    await drained;
    await wait(80);
    assert.deepEqual(whats(sys), ['start ravi', 'end ravi', 'start helen', 'end helen']);
    assert.equal(sys.isDrainingDeferred, false);
    assert.equal(sys.deferredBarkQueue.length, 0);
  } finally { window.currentConversationMinigameType = null; }
});

test('NPCBarkSystem: a bark that was never held renders at once, with no added delay', async () => {
  const sys = barkSystem();
  sys.showBark({ npcId: 'ravi', text: 'plain', voiceMs: 50 });
  assert.deepEqual(whats(sys), ['start plain'], 'rendered in the same tick');
  assert.equal(sys.deferredBarkQueue.length, 0);
  sys.showBark({ npcId: 'helen', text: 'second' });
  await wait(0);
  assert.deepEqual(whats(sys), ['start plain', 'start second'], 'not held behind the first voice');
  await wait(70);
});

test('NPCBarkSystem: no audio event (element gone) falls back to the clip length plus a second', async () => {
  const sys = barkSystem();
  const t0 = Date.now();
  const ended = await sys._voiceEnd('nobody', Promise.resolve(20));
  assert.equal(ended, true);
  assert.ok(Date.now() - t0 >= 1000 && Date.now() - t0 < 1600);
  assert.equal(await sys._voiceEnd('nobody', Promise.resolve(null)), false, 'no voice');
  assert.equal(await sys._voiceEnd('nobody', Promise.reject(new Error('fetch failed'))), false);
});

test('NPCBarkSystem: a minigame opening during the last held voice keeps the next bark held', async () => {
  const sys = barkSystem();
  try {
    window.currentConversationMinigameType = 'person-chat';
    sys.showBark({ npcId: 'ravi', text: 'ravi', voiceMs: 50 });
    window.currentConversationMinigameType = null;
    const drained = sys.drainDeferredBarks();
    await wait(10);
    sys.showBark({ npcId: 'helen', text: 'helen' });
    window.currentConversationMinigameType = 'person-chat';     // the player opens a chat
    await drained;
    assert.deepEqual(whats(sys), ['start ravi', 'end ravi']);
    assert.equal(sys.deferredBarkQueue.length, 1);
    window.currentConversationMinigameType = null;
    await sys.drainDeferredBarks();
    assert.deepEqual(whats(sys), ['start ravi', 'end ravi', 'start helen']);
  } finally { window.currentConversationMinigameType = null; }
});

// ---- review round 1 minors (m1, m4, m5) ----

function fakeAudio() {
  const a = new EventTarget();
  a.paused = false; a.ended = false;
  return a;
}

test('NPCBarkSystem: _voiceEnd removes its listeners from a reused audio element once the wait ends', async () => {
  const sys = barkSystem();
  const audio = fakeAudio();
  const live = new Set();
  const add = audio.addEventListener.bind(audio), rem = audio.removeEventListener.bind(audio);
  audio.addEventListener = (ev, fn) => { live.add(`${ev}`); add(ev, fn); };
  audio.removeEventListener = (ev, fn) => { live.delete(`${ev}`); rem(ev, fn); };
  sys.ttsManagers.set('ravi', { audio });
  const p = sys._voiceEnd('ravi', Promise.resolve(5000));
  await wait(5);
  assert.deepEqual([...live].sort(), ['emptied', 'ended', 'error', 'pause'], 'listening while the voice plays');
  audio.ended = true; audio.dispatchEvent(new Event('ended'));
  assert.equal(await p, true);
  assert.equal(live.size, 0, 'every listener removed after the wait');
});

test('NPCBarkSystem: a pause (as from muting) ends the wait', async () => {
  const sys = barkSystem();
  const audio = fakeAudio();
  sys.ttsManagers.set('ravi', { audio });
  let settled = false;
  const p = sys._voiceEnd('ravi', Promise.resolve(5000)).then(v => { settled = true; return v; });
  await wait(10);
  assert.equal(settled, false, 'still waiting while it plays');
  audio.paused = true; audio.dispatchEvent(new Event('pause'));
  assert.equal(await p, true);
});

test('NPCBarkSystem: an unknown or infinite clip length does not end the wait at once (m1)', async () => {
  const sys = barkSystem();
  for (const len of [Infinity, NaN, -5]) {
    const audio = fakeAudio();
    sys.ttsManagers.set('ravi', { audio });
    let settled = false;
    const p = sys._voiceEnd('ravi', Promise.resolve(len)).then(v => { settled = true; return v; });
    await wait(1300);
    if (len === Infinity) {
      assert.equal(settled, false, 'Infinity: no timer, waits for the audio event');
      audio.ended = true; audio.dispatchEvent(new Event('ended'));
      assert.equal(await p, true);
    } else if (Number.isNaN(len)) {
      assert.equal(await p, false, 'NaN is no voice');
    } else {
      assert.equal(settled, false, 'negative length: no timer either');
      audio.ended = true; audio.dispatchEvent(new Event('ended'));
      await p;
    }
  }
});

test('NPCBarkSystem: a bark that joins the queue just before the drain ends is released, not stranded (m4)', async () => {
  const sys = barkSystem();
  const real = sys.deferredBarkQueue;
  let armed = false, injected = false;
  const orig = sys._renderBark;
  sys._renderBark = (p) => { armed = true; return orig(p); };
  sys.deferredBarkQueue = new Proxy(real, {
    get(t, k) {
      if (k === 'length' && armed && !injected && t.length === 0) {
        injected = true;                                   // arrives as the policy's loop exits
        t.push({ npcId: 'helen', text: 'late', voiceMs: 0 });
        return 0;                                          // the policy saw it empty
      }
      const v = t[k];
      return typeof v === 'function' ? v.bind(t) : v;
    }
  });
  try {
    window.currentConversationMinigameType = 'person-chat';
    sys.showBark({ npcId: 'ravi', text: 'first', voiceMs: 10 });
    window.currentConversationMinigameType = null;
    await sys.drainDeferredBarks();
    assert.equal(injected, true);
    assert.deepEqual(whats(sys).filter(w => w.startsWith('start')), ['start first', 'start late']);
    assert.equal(real.length, 0);
    assert.equal(sys.isDrainingDeferred, false);
  } finally { window.currentConversationMinigameType = null; }
});

test('the voice cap timer is cleared once the wait settles (m3)', async () => {
  const q = [{ npcId: 'a', text: 'a' }];
  const t0 = Date.now();
  await releaseHeldBarks(q, { shouldHold: () => false, render: () => ({ voiceEnd: Promise.resolve(true) }), gapMs: 1, voiceCapMs: 60000, pauseMs: 1, log: () => {} });
  assert.ok(Date.now() - t0 < 500);
  // a 60 s timer left behind would keep node from exiting; the suite finishing is the proof
});
