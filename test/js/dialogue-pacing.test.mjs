// Person-chat auto-advance pacing (dialogue-pacing.js).
// Run with: node --test test/js/dialogue-pacing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/person-chat/dialogue-pacing.js');
const dir = mkdtempSync(join(tmpdir(), 'dialogue-pacing-'));
writeFileSync(join(dir, 'pacing.mjs'), readFileSync(src, 'utf8'));
const P = await import(pathToFileURL(join(dir, 'pacing.mjs')).href);
const words = (n) => Array.from({ length: n }, () => 'word').join(' ');

test('short lines get the floor, long lines the cap', () => {
  assert.equal(P.readingTimeMs('Fine.'), P.READ_MIN_MS);
  assert.equal(P.readingTimeMs(''), P.READ_MIN_MS);
  assert.equal(P.readingTimeMs(null), P.READ_MIN_MS);
  assert.equal(P.readingTimeMs(words(500)), P.READ_MAX_MS);
});

test('hold grows with word count', () => {
  assert.equal(P.readingTimeMs(words(20)), P.READ_BASE_MS + 20 * P.READ_MS_PER_WORD);
  assert.ok(P.readingTimeMs(words(30)) > P.readingTimeMs(words(15)));
  assert.ok(P.readingTimeMs(words(4)) < 5000, 'a short reply no longer holds 5 s');
});

test('audio length wins when there is audio', () => {
  assert.equal(P.advanceDelayMs(words(40), 3000), 3000 + P.AUDIO_BUFFER_MS);
});

test('missing or broken audio falls back to the estimate, never a stuck line', () => {
  for (const bad of [null, undefined, 0, -5, NaN, Infinity]) {
    assert.equal(P.advanceDelayMs(words(10), bad), P.readingTimeMs(words(10)));
  }
});
