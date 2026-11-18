/**
 * lock-outcome.js - how playtest-session.js's `lock` command reports success.
 *
 * The verdict comes from the lock's own result and nothing else. `ownSt` is the last
 * state read while the lock itself was still the active minigame (state.id equal to the
 * starting minigame id); it is solved only when its result says `success === true`.
 * A lock that opens a container hands the screen on after that verdict is set, so a
 * success followed by a container is still ok. A failure can hand the screen on too (a
 * network-screen container reopens after a lockout, a scripted conversation can open
 * after a refusal), so what opened next never decides ok: `chainedInto` only names it.
 *
 * Kept apart from the session script so node tests can load it without Playwright
 * (test/js/playtest-lock-outcome.test.mjs).
 *
 * @param {{startId: string|null, ownSt: object|null, after: {activeMinigame: {id?: string}|string|null}}} a
 */
function lockOutcome({ startId, ownSt, after }) {
  const active = after && after.activeMinigame;
  const activeId = active && typeof active === 'object' ? (active.id || active.type || null) : (active || null);
  const chainedInto = activeId && startId && activeId !== startId ? activeId : null;
  const verdict = ownSt && ownSt.result ? ownSt.result.success : undefined;
  const ok = verdict === true;
  const out = { ok };
  if (!ok) out.reason = verdict === false ? 'lock-failed' : (activeId === startId ? 'unsolved' : 'no-verdict');
  if (chainedInto) out.chainedInto = chainedInto;
  return out;
}

/** The bridge answers {available:false} (truthy) when no minigame is open. */
function padGone(st) {
  return !st || st.available === false;
}

/**
 * After a code was submitted: is the pad still open with no verdict, i.e. a plain wrong
 * code? Then the command stops (one wrong attempt, no retry). Returns the reply, or null
 * when the pad closed, completed or has a result (lockOutcome decides those).
 */
function wrongCodeReply(st, steps = []) {
  if (padGone(st) || st.isComplete || st.result) return null;
  return {
    ok: false, reason: 'wrong-code', steps,
    attemptsUsed: st.attemptsUsed ?? null, maxAttempts: st.maxAttempts ?? null,
    lastFeedback: st.lastFeedback ?? null,
    finalState: { isComplete: st.isComplete, result: st.result, text: st.text }
  };
}

module.exports = { lockOutcome, padGone, wrongCodeReply };
