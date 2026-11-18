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

const { padGone, attemptSnapshot, attemptStep, awaitAttempt } = require('../../.claude/skills/playtest-scenario/scripts/lock-outcome.js');

test('the bridge no-minigame answer counts as no pad, not as a state', () => {
  assert.equal(padGone({ available: false, reason: 'no-active-minigame' }), true);
  assert.equal(padGone(null), true);
  assert.equal(padGone({ available: true, id: 'pin' }), false);
});

// Real lockpicking state shapes: a correct key completes with gameResult null, so the
// bridge never shows a success; the pick path sets {lockable} with no success field.
const keyState = { id: 'lockpicking', keyMode: true, result: null, isComplete: false };
const pickState = { id: 'lockpicking', keyMode: false, result: { lockable: {} }, isComplete: false };

test('key lock solved: no own verdict, lockable went from locked to unlocked -> ok', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false }, keyInserted: true });
  assert.deepEqual(r, { ok: true, via: 'lockable-state' });
});

test('pick success with {lockable} and no success field falls back to the lockable', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: pickState, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false } });
  assert.equal(r.ok, true);
  assert.equal(r.via, 'lockable-state');
});

test('wrong key: pad still open, lockable still locked -> not ok', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: { id: 'lockpicking' } }, lockState: { startLocked: true, nowLocked: true } });
  assert.deepEqual(r, { ok: false, reason: 'unsolved' });
});

test('closed with no verdict and the lockable still locked -> no-verdict', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: true } });
  assert.deepEqual(r, { ok: false, reason: 'no-verdict' });
});

test('a lockable that was already unlocked, or unknown, never gives an ok by itself', () => {
  for (const lockState of [{ startLocked: false, nowLocked: false }, { startLocked: null, nowLocked: null }, { startLocked: true, nowLocked: null }]) {
    assert.equal(lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: null }, lockState }).ok, false);
  }
});

test('an explicit failure is not overridden by the lockable state', () => {
  const r = lockOutcome({ startId: 'pin', ownSt: lockedOut, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false } });
  assert.equal(r.ok, false);
});

test('lockout and refusal replies keep the attempt count; a refusal is labelled refused', () => {
  const out = lockOutcome({ startId: 'pin', ownSt: { id: 'pin', attemptsUsed: 5, maxAttempts: 5, result: { success: false, attempts: 5 } }, after: { activeMinigame: null } });
  assert.deepEqual(out, { ok: false, reason: 'lock-failed', attemptsUsed: 5, maxAttempts: 5 });
  const ref = lockOutcome({ startId: 'password', ownSt: { id: 'password', result: { success: false, cancelled: true, refused: 'pc-off', attempts: 1 } }, after: { activeMinigame: null } });
  assert.equal(ref.reason, 'refused');
  assert.equal(ref.attemptsUsed, 1);
});

// PIN pad: attemptsUsed rises before the server answers, historyLength after.
const pin = (o) => ({ available: true, id: 'pin', isComplete: false, result: null, attemptsUsed: 0, historyLength: 0, maxAttempts: 5, lastFeedback: null, text: 'Enter PIN', ...o });
// Password lock: only attemptsText and the text lines.
const pw = (o) => ({ available: true, id: 'password', isComplete: false, result: null, attemptsText: '0', text: 'Attempts: 0/3', ...o });

test('in-flight PIN (attemptsUsed up, history unchanged) is pending, not wrong-code', () => {
  const base = attemptSnapshot(pin());
  assert.equal(attemptStep(base, pin({ attemptsUsed: 1 }), 900).state, 'pending');
  assert.equal(attemptStep(base, pin({ attemptsUsed: 1 }), 7900).state, 'pending');
});

test('an answered wrong PIN is wrong-code with the counts and its own feedback', () => {
  const base = attemptSnapshot(pin());
  const r = attemptStep(base, pin({ attemptsUsed: 1, historyLength: 1, lastFeedback: 'Incorrect' }), 600, ['tap 0000 on the keypad']);
  assert.equal(r.state, 'wrong');
  assert.equal(r.reply.reason, 'wrong-code');
  assert.equal(r.reply.attemptsUsed, 1);
  assert.equal(r.reply.maxAttempts, 5);
  assert.equal(r.reply.lastFeedback, 'Incorrect');
});

test('password shape: counts come from attemptsText / the Attempts line', () => {
  assert.deepEqual(attemptSnapshot(pw({ attemptsText: '1', text: 'Attempts: 1/3' })).used, 1);
  assert.equal(attemptSnapshot(pw()).max, 3);
  const base = attemptSnapshot(pw());
  assert.equal(attemptStep(base, pw({ attemptsText: '1', text: 'Attempts: 1/3' }), 900).state, 'pending');
  const r = attemptStep(base, pw({ attemptsText: '1', text: 'Attempts: 1/3\nIncorrect password. 2 attempts remaining.' }), 1200);
  assert.equal(r.state, 'wrong');
  assert.equal(r.reply.attemptsUsed, 1);
  assert.equal(r.reply.maxAttempts, 3);
  assert.match(r.reply.lastFeedback, /Incorrect password/);
});

test('a second wrong password is judged against the baseline, not the old message', () => {
  const was = pw({ attemptsText: '1', text: 'Attempts: 1/3\nIncorrect password. 2 attempts remaining.' });
  const base = attemptSnapshot(was);
  // the field clears the message on submit: counter up, no wrong line yet
  assert.equal(attemptStep(base, pw({ attemptsText: '2', text: 'Attempts: 2/3' }), 500).state, 'pending');
});

test('nothing sent (missed tap) is not-submitted after the grace, pending before it', () => {
  const base = attemptSnapshot(pin());
  assert.equal(attemptStep(base, pin({ enteredLength: 3 }), 500).state, 'pending');
  const r = attemptStep(base, pin(), 1600);
  assert.equal(r.state, 'not-submitted');
  assert.equal(r.reply.reason, 'not-submitted');
});

test('sent but never answered is no-answer at the timeout', () => {
  const base = attemptSnapshot(pin());
  const r = attemptStep(base, pin({ attemptsUsed: 1 }), 8100);
  assert.equal(r.state, 'no-answer');
  assert.equal(r.reply.reason, 'no-answer');
});

test('closed, completed or resulted pads are left to lockOutcome', () => {
  const base = attemptSnapshot(pin());
  assert.equal(attemptStep(base, { available: false }, 100).state, 'closed');
  assert.equal(attemptStep(base, pin({ isComplete: true }), 100).state, 'closed');
  assert.equal(attemptStep(base, pin({ result: { success: true } }), 100).state, 'closed');
});

// A fake clock and server drive the real polling loop.
function fakeLoop(timeline) {
  let t = 0;
  const reads = [];
  return {
    now: () => t,
    wait: async (ms) => { t += ms; },
    read: async () => { const s = timeline(t); reads.push(t); return s; },
    reads
  };
}

test('slow server: a correct PIN answered after 3 s comes back as no reply (ok decided by lockOutcome)', async () => {
  const f = fakeLoop(t => t < 3000 ? pin({ attemptsUsed: 1 }) : { available: false, reason: 'no-active-minigame' });
  const reply = await awaitAttempt({ base: attemptSnapshot(pin()), ...f });
  assert.equal(reply, null);
  // the verdict then comes from the tracked own state, a success result seen while closing
  assert.equal(lockOutcome({ startId: 'pin', ownSt: pin({ result: { success: true } }), after: { activeMinigame: null } }).ok, true);
});

test('slow server: a wrong PIN answered after 5 s is wrong-code, once', async () => {
  const f = fakeLoop(t => t < 5000 ? pin({ attemptsUsed: 1 }) : pin({ attemptsUsed: 1, historyLength: 1, lastFeedback: 'Incorrect' }));
  const reply = await awaitAttempt({ base: attemptSnapshot(pin()), ...f });
  assert.equal(reply.reason, 'wrong-code');
});

test('missed tap: the loop returns not-submitted after the grace and stops reading', async () => {
  const f = fakeLoop(() => pin({ enteredLength: 3 }));
  const reply = await awaitAttempt({ base: attemptSnapshot(pin()), ...f });
  assert.equal(reply.reason, 'not-submitted');
  assert.ok(f.reads.at(-1) <= 2000);
});

test('stuck server: no-answer at the timeout', async () => {
  const f = fakeLoop(() => pin({ attemptsUsed: 1 }));
  const reply = await awaitAttempt({ base: attemptSnapshot(pin()), ...f });
  assert.equal(reply.reason, 'no-answer');
});

// R3 m1: the lockable fallback needs the pad closed and evidence the pad did it.
test('R3 m1: pad still open while a script unlocks the door is not ok', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: { id: 'lockpicking' } }, lockState: { startLocked: true, nowLocked: false }, keyInserted: true });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unsolved');
});

test('R3 m1: pad closed, no key inserted, not key mode, no pick result: a scripted unlock is not ok', () => {
  const plain = { id: 'lockpicking', keyMode: false, result: null, isComplete: false };
  const r = lockOutcome({ startId: 'lockpicking', ownSt: plain, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false } });
  assert.equal(r.ok, false);
});

test('R3 m1: a key inserted and the pad closed is ok even if the state was not read in key mode', () => {
  const plain = { id: 'lockpicking', keyMode: false, result: null, isComplete: false };
  const r = lockOutcome({ startId: 'lockpicking', ownSt: plain, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false }, keyInserted: true });
  assert.equal(r.ok, true);
  assert.equal(r.via, 'lockable-state');
});

// R3 m2: screens with no attempt counter (sign-in, Wi-Fi join) are judged by the message line.
const signin = (message, o) => ({ available: true, id: 'password', isComplete: false, result: null, text: 'Sign in', signIn: { message }, ...o });
const join = (message) => ({ available: true, id: 'password', isComplete: false, result: null, text: 'Join', join: { apId: 'x', message } });

test('R3 m2: sign-in answered wrong at 1.6 s is wrong-code, not not-submitted', () => {
  const base = attemptSnapshot(signin(null));
  assert.equal(base.blind, true);
  assert.equal(attemptStep(base, signin(null), 1600).state, 'pending');
  const r = attemptStep(base, signin('Incorrect username or password. 2 attempts left.'), 1600);
  assert.equal(r.state, 'wrong');
  assert.equal(r.reply.reason, 'wrong-code');
});

test('R3 m2: a slow correct sign-in is pending until the pad closes, then left to lockOutcome', () => {
  const base = attemptSnapshot(signin(null));
  assert.equal(attemptStep(base, signin(null), 5000).state, 'pending');
  assert.equal(attemptStep(base, { available: false }, 5200).state, 'closed');
  assert.equal(attemptStep(base, signin(null), 8100).reply.reason, 'no-answer');
});

test('R3 m2: Wi-Fi join wrong key is read from join.message', () => {
  const base = attemptSnapshot(join(null));
  assert.equal(attemptStep(base, join('That key was not accepted.'), 700).reply.reason, 'wrong-code');
});

// R3 n2: a refunded or time-locked attempt names itself.
test('R3 n2: network error and time lock are named after the grace', () => {
  const base = attemptSnapshot(pw());
  assert.equal(attemptStep(base, pw({ text: 'Attempts: 0/3\nNetwork error. Please try again.' }), 1600).reply.reason, 'network-error');
  assert.equal(attemptStep(base, pw({ text: 'Too many wrong passwords. Locked for 20 more seconds.' }), 1600).reply.reason, 'time-locked');
  assert.equal(attemptStep(base, pw(), 1600).reply.reason, 'not-submitted');
});

// R4 m1: a cancelled key pad (key mode, no insert step) plus a scripted unlock is not ok.
test('R4 m1: key pad cancelled with no insert, door unlocked by a script, is not ok', () => {
  const r = lockOutcome({ startId: 'lockpicking', ownSt: keyState, after: { activeMinigame: null }, lockState: { startLocked: true, nowLocked: false } });
  assert.equal(r.ok, false);
});

// R4 M1: "Signing in..." is progress, not an answer.
test('R4 M1: Signing in... stays pending, then the pad closes (success)', async () => {
  const seq = [signin(null), signin('Signing in...'), signin('Signing in...'), { available: false }];
  let i = 0, t = 0;
  const reply = await awaitAttempt({ base: attemptSnapshot(signin(null)), read: async () => seq[Math.min(i++, seq.length - 1)], wait: async (ms) => { t += ms; }, now: () => t });
  assert.equal(reply, null);
  assert.equal(attemptStep(attemptSnapshot(signin(null)), signin('Signing in...'), 300).state, 'pending');
});

test('R4 M1: Signing in... then a refusal settles as wrong-code', async () => {
  const seq = [signin('Signing in...'), signin('Signing in...'), signin('Incorrect username or password.')];
  let i = 0, t = 0;
  const reply = await awaitAttempt({ base: attemptSnapshot(signin(null)), read: async () => seq[Math.min(i++, seq.length - 1)], wait: async (ms) => { t += ms; }, now: () => t });
  assert.equal(reply.reason, 'wrong-code');
});

// R4 m2: the same refusal text twice still counts once it has been cleared in between.
test('R4 m2: a repeated identical refusal is wrong-code after the line was replaced', async () => {
  const refusal = 'Incorrect username or password.';
  const seq = [signin(refusal), signin('Signing in...'), signin(refusal)];
  let i = 0, t = 0;
  const reply = await awaitAttempt({ base: attemptSnapshot(signin(refusal)), read: async () => seq[Math.min(i++, seq.length - 1)], wait: async (ms) => { t += ms; }, now: () => t });
  assert.equal(reply.reason, 'wrong-code');
});
