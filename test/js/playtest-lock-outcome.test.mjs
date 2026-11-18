// playtest harness `lock`: a lock that chains into a container still counts as solved.
// Run with: node --test test/js/playtest-lock-outcome.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lockOutcome } = require('../../.claude/skills/playtest-scenario/scripts/lock-outcome.js');

test('keypad that opens a container is ok and names the container', () => {
  const r = lockOutcome({ startId: 'pin', st: { isComplete: false, text: 'Fund' }, after: { activeMinigame: { id: 'container' } } });
  assert.deepEqual(r, { ok: true, chainedInto: 'container' });
});

test('a lock that completes and closes is ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', st: null, after: { activeMinigame: null } }), { ok: true });
});

test('a lock still open and unsolved is not ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', st: { isComplete: false }, after: { activeMinigame: { id: 'pin' } } }), { ok: false });
});

test('a lock that reports success while still shown is ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', st: { result: 'success' }, after: { activeMinigame: { id: 'pin' } } }), { ok: true });
});
