/**
 * lock-outcome.js - how playtest-session.js's `lock` command reports success.
 *
 * A lock that opens straight into a container (a keypad on a safe, a key lock on a
 * case) hands the screen to the container minigame. The last state read then belongs
 * to the container, not the lock, so "isComplete" is false and a minigame is still
 * active. That is a solved lock. It counts as solved when the lock's own state says
 * so, when no minigame remains, or when the active minigame is not the one the
 * command started on; `chainedInto` names the new one.
 *
 * Kept apart from the session script so node tests can load it without Playwright
 * (test/js/playtest-lock-outcome.test.mjs).
 *
 * @param {{startId: string|null, st: object|null, after: {activeMinigame: {id?: string}|string|null}}} a
 */
function lockOutcome({ startId, st, after }) {
  const active = after && after.activeMinigame;
  const activeId = active && typeof active === 'object' ? (active.id || active.type || null) : (active || null);
  const chainedInto = activeId && startId && activeId !== startId ? activeId : null;
  const ok = !!((st && (st.isComplete || st.result === 'success')) || !activeId || chainedInto);
  return chainedInto ? { ok, chainedInto } : { ok };
}

module.exports = { lockOutcome };
