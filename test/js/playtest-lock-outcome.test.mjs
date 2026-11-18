// playtest harness `lock`: the verdict is the lock's own result, never what opened next.
// Run with: node --test test/js/playtest-lock-outcome.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lockOutcome } = require('../../.claude/skills/playtest-scenario/scripts/lock-outcome.js');

// The shape the bridge produces: getState() spreads the minigame's gameResult into `result`.
const won = { id: 'pin', isComplete: false, result: { success: true, pin: '0000', attempts: 1 } };
const lockedOut = { id: 'pin', isComplete: false, result: { success: false, attempts: 5, maxAttemptsReached: true } };

test('success then the container opens is ok and names the container', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', ownSt: won, after: { activeMinigame: { id: 'container' } } }),
    { ok: true, chainedInto: 'container' });
});

test('success that closes with nothing after is ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', ownSt: won, after: { activeMinigame: null } }), { ok: true });
});

test('success while the lock is still shown is ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', ownSt: won, after: { activeMinigame: { id: 'pin' } } }), { ok: true });
});

test('lockout then the network-screen container reopens is not ok', () => {
  const r = lockOutcome({ startId: 'pin', ownSt: lockedOut, after: { activeMinigame: { id: 'container' } } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'lock-failed');
  assert.equal(r.chainedInto, 'container');
});

test('lockout then a person-chat opens is not ok', () => {
  const r = lockOutcome({ startId: 'pin', ownSt: lockedOut, after: { activeMinigame: { id: 'person-chat' } } });
  assert.equal(r.ok, false);
  assert.equal(r.chainedInto, 'person-chat');
});

test('a cancelled pad with no verdict, then the container reopens, is not ok', () => {
  const r = lockOutcome({ startId: 'pin', ownSt: { id: 'pin', isComplete: false, result: null }, after: { activeMinigame: { id: 'container' } } });
  assert.deepEqual(r, { ok: false, reason: 'no-verdict', chainedInto: 'container' });
});

test('a pad that closes without success and nothing after is not ok', () => {
  assert.equal(lockOutcome({ startId: 'pin', ownSt: lockedOut, after: { activeMinigame: null } }).ok, false);
  assert.equal(lockOutcome({ startId: 'pin', ownSt: null, after: { activeMinigame: null } }).ok, false);
});

test('a lock still open and unsolved is not ok', () => {
  assert.deepEqual(lockOutcome({ startId: 'pin', ownSt: { id: 'pin', isComplete: false, result: null }, after: { activeMinigame: { id: 'pin' } } }),
    { ok: false, reason: 'unsolved' });
});

test('the result is read as the gameResult object, not a string', () => {
  assert.equal(lockOutcome({ startId: 'pin', ownSt: { id: 'pin', result: 'success' }, after: { activeMinigame: { id: 'pin' } } }).ok, false);
});

const { padGone, wrongCodeReply } = require('../../.claude/skills/playtest-scenario/scripts/lock-outcome.js');

test('the bridge no-minigame answer counts as no pad, not as a state', () => {
  assert.equal(padGone({ available: false, reason: 'no-active-minigame' }), true);
  assert.equal(padGone(null), true);
  assert.equal(padGone({ available: true, id: 'pin' }), false);
});

test('a plain wrong code stops with wrong-code and one attempt counted', () => {
  const r = wrongCodeReply({ available: true, id: 'pin', isComplete: false, result: null, attemptsUsed: 1, maxAttempts: 5, lastFeedback: 'wrong', text: 'Incorrect PIN' }, ['tap 1111 on the keypad']);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'wrong-code');
  assert.equal(r.attemptsUsed, 1);
  assert.equal(r.maxAttempts, 5);
});

test('no wrong-code reply once the pad has a result, completed or closed', () => {
  assert.equal(wrongCodeReply({ available: true, isComplete: false, result: { success: true } }), null);
  assert.equal(wrongCodeReply({ available: true, isComplete: true, result: null }), null);
  assert.equal(wrongCodeReply({ available: false, reason: 'no-active-minigame' }), null);
  assert.equal(wrongCodeReply(null), null);
});
