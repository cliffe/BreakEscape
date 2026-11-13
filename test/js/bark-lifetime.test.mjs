// Toast lifetime and stack trimming (bark-lifetime.js, used by npc-barks.js).
// Run with: node --test test/js/bark-lifetime.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/bark-lifetime.js');
const dir = mkdtempSync(join(tmpdir(), 'bark-lifetime-'));
writeFileSync(join(dir, 'lifetime.mjs'), readFileSync(src, 'utf8'));
const L = await import(pathToFileURL(join(dir, 'lifetime.mjs')).href);
const barksSrc = readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8');

const words = (n) => Array.from({ length: n }, () => 'word').join(' ');

test('lifetime grows with length: notice time plus time per word', () => {
  assert.equal(L.barkLifetimeMs(words(10)), 3000 + 10 * 300);
  assert.equal(L.barkLifetimeMs(words(20)), 9000);
  assert.ok(L.barkLifetimeMs(words(30)) > L.barkLifetimeMs(words(20)));
});

test('short toasts get the floor, long ones the cap', () => {
  assert.equal(L.barkLifetimeMs('On my way.'), L.BARK_MIN_MS);
  assert.equal(L.barkLifetimeMs(''), L.BARK_MIN_MS);
  assert.equal(L.barkLifetimeMs(null), L.BARK_MIN_MS);
  assert.equal(L.barkLifetimeMs(words(200)), L.BARK_MAX_MS);
  assert.ok(L.BARK_MIN_MS >= 5000 && L.BARK_MAX_MS <= 20000);
});

test('a real m03 toast lasts long enough to read and far less than the old 60 s', () => {
  const text = "Agent HaX: You're in. Server room's at the north end of the main hallway: use Sterling's card at the reader. Mind the guard in the executive wing.";
  const ms = L.barkLifetimeMs(text);
  assert.ok(ms >= 10000 && ms <= 15000, `got ${ms}`);
});

test('words are split on any whitespace', () => {
  assert.equal(L.countWords('  a\tb\nc  d '), 4);
  assert.equal(L.countWords(undefined), 0);
});

test('trim: no more than MAX_VISIBLE_BARKS, oldest go first', () => {
  const b = (h) => ({ height: h });
  assert.equal(L.barksToTrim([b(50), b(50), b(50), b(50), b(50)], 10000), 5 - L.MAX_VISIBLE_BARKS);
  assert.equal(L.barksToTrim([b(50), b(50)], 10000), 0);
});

test('trim: the stack keeps out of the space it is given (the objectives panel)', () => {
  const b = (h) => ({ height: h });
  // three 180px toasts, 400px free below the panel: only the newest two fit (2 x 188)
  assert.equal(L.barksToTrim([b(180), b(180), b(180)], 400), 1);
  // even when nothing fits, the newest toast stays
  assert.equal(L.barksToTrim([b(180), b(180)], 50), 1);
  assert.equal(L.barksToTrim([b(180)], 0), 0);
});

test('npc-barks uses the reading-time lifetime, not a fixed 60 s, and keeps click-to-open', () => {
  assert.doesNotMatch(barksSrc, /barkAutoCloseMs\s*=\s*60000/);
  assert.match(barksSrc, /_startAutoClose\(el, barkLifetimeMs\(/);
  assert.match(barksSrc, /mouseenter[^\n]*_pauseAutoClose/);
  assert.match(barksSrc, /this\.openPhoneChat\(payload\);\s*\n\s*this\._removeBark\(el\);/);
  assert.match(barksSrc, /barksToTrim\(/);
  // a toast whose conditions lapsed while a conversation covered it closes when it ends
  assert.match(barksSrc, /drainDeferredBarks\(\) \{\s*\n\s*if \(!this\._shouldDefer\(\)\) this\._dropStaleVisibleBarks\(\);/);
});
