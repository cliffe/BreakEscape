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
 * Key locks never record a success in their result (the correct key completes the
 * minigame with a null gameResult, the pick path sets {lockable} only), so when the own
 * verdict is undefined the target lockable's real locked state decides: locked when the
 * command began and unlocked once the pad closed -> ok (via:'lockable-state'). The fallback
 * also needs evidence that this pad did it: the pad is closed (activeId differs from
 * startId) and a key was inserted (an actual insert step) or the pick path left {lockable};
 * a scripted unlock while the pad is still open, after only wrong keys, or after a cancelled
 * key pad, is not ok.
 *
 * Kept apart from the session script so node tests can load it without Playwright
 * (test/js/playtest-lock-outcome.test.mjs).
 *
 * @param {{startId: string|null, ownSt: object|null, after: {activeMinigame: {id?: string}|string|null},
 *          lockState?: {startLocked: boolean|null, nowLocked: boolean|null},
 *          keyInserted?: boolean}} a
 */
function lockOutcome({ startId, ownSt, after, lockState, keyInserted = false }) {
  const active = after && after.activeMinigame;
  const activeId = active && typeof active === 'object' ? (active.id || active.type || null) : (active || null);
  const chainedInto = activeId && startId && activeId !== startId ? activeId : null;
  const result = ownSt && ownSt.result ? ownSt.result : null;
  const verdict = result ? result.success : undefined;
  const padClosed = !activeId || activeId !== startId;
  const padDidIt = keyInserted || !!(result && result.lockable);
  const viaLockable = verdict === undefined && !!lockState && padClosed && padDidIt
    && lockState.startLocked === true && lockState.nowLocked === false;
  const ok = verdict === true || viaLockable;
  const out = { ok };
  if (viaLockable) out.via = 'lockable-state';
  if (!ok) {
    out.reason = verdict === false ? (result.refused ? 'refused' : 'lock-failed')
      : (activeId === startId ? 'unsolved' : 'no-verdict');
    const used = ownSt && (ownSt.attemptsUsed ?? (result && result.attempts));
    const max = ownSt && (ownSt.maxAttempts ?? (result && result.maxAttempts));
    if (typeof used === 'number') out.attemptsUsed = used;
    if (typeof max === 'number') out.maxAttempts = max;
  }
  if (chainedInto) out.chainedInto = chainedInto;
  return out;
}

/** The bridge answers {available:false} (truthy) when no minigame is open. */
function padGone(st) {
  return !st || st.available === false;
}

/**
 * The attempt counters of a lock state. PIN pads give attemptsUsed, maxAttempts and
 * historyLength. Password locks give attemptsText (the counter span, a bare number) and an
 * "Attempts: n/m" line in `text`; that counter rises when a code is sent, before the
 * server answers, so only the "Incorrect ..." line marks an answered wrong attempt.
 */
function attemptSnapshot(st) {
  if (padGone(st)) return { used: null, max: null, history: null, wrongLine: null, message: null, blind: false };
  const text = typeof st.text === 'string' ? st.text : '';
  const m = /Attempts:\s*(\d+)\s*\/\s*(\d+)/i.exec(text);
  const fromAttemptsText = typeof st.attemptsText === 'string' && /^\d+$/.test(st.attemptsText.trim())
    ? Number(st.attemptsText.trim()) : null;
  const wrong = /Incorrect[^\n]*/i.exec(text);
  const used = typeof st.attemptsUsed === 'number' ? st.attemptsUsed : (m ? Number(m[1]) : fromAttemptsText);
  const history = typeof st.historyLength === 'number' ? st.historyLength : null;
  // Sign-in and Wi-Fi join screens keep no attempt counter; their only sign of an answer
  // is the message line (signIn.message / join.message).
  const hasScreen = !!(st.signIn || st.join);
  const msg = (st.join && st.join.message) || (st.signIn && st.signIn.message) || null;
  return {
    used,
    max: typeof st.maxAttempts === 'number' ? st.maxAttempts : (m ? Number(m[2]) : null),
    history,
    wrongLine: wrong ? wrong[0].trim() : null,
    message: typeof msg === 'string' ? msg : null,
    blind: hasScreen && used === null && history === null
  };
}

/** Progress text a sign-in or join screen shows while the server is still thinking. */
function isTransientMessage(msg) {
  return typeof msg === 'string'
    && /^\s*(signing in|joining|connecting|checking|please wait)|(\.\.\.|\u2026)\s*$/i.test(msg);
}

const SUBMIT_GRACE_MS = 1500;   // nothing sent after this long: the tap or typing missed
const ANSWER_TIMEOUT_MS = 8000; // sent but unanswered after this long: a very slow or stuck server

/**
 * One poll of the wait that follows a submitted code. `base` is attemptSnapshot() taken
 * before the code was sent. Returns {state}: 'closed' (pad gone, completed or has a result:
 * lockOutcome decides), 'wrong' (an answered wrong attempt, with `reply`), 'pending' (sent,
 * not answered yet), or once the time is up 'not-submitted' / 'no-answer' with `reply`.
 */
function attemptStep(base, st, elapsedMs, steps = [], track = {}) {
  if (padGone(st) || st.isComplete || st.result) return { state: 'closed' };
  const now = attemptSnapshot(st);
  const grew = now.history !== null && base.history !== null && now.history > base.history;
  const sent = grew || (now.used !== null && base.used !== null && now.used > base.used);
  const answered = grew || (now.history === null && sent && now.wrongLine !== null);
  if (base.blind) {
    // No counters to compare: a settled message line is the answer, otherwise wait out the
    // timeout. Never 'not-submitted': a correct sign-in can take longer than the grace.
    // Progress text ("Signing in...") is not an answer; the pad closing is the success.
    // `track` (kept by awaitAttempt across polls) remembers that the line left its baseline
    // value (cleared or transient), so a repeated identical refusal still counts as new.
    const transient = isTransientMessage(now.message);
    if (now.message !== base.message) track.left = true;
    const settled = now.message !== null && !transient;
    const changed = settled && (now.message !== base.message || track.left === true);
    const out = (reason) => ({
      ok: false, reason, steps, attemptsUsed: null, maxAttempts: null, lastFeedback: now.message,
      finalState: { isComplete: st.isComplete, result: st.result, text: st.text }
    });
    if (changed) return { state: 'wrong', reply: out('wrong-code') };
    if (elapsedMs >= ANSWER_TIMEOUT_MS) return { state: 'no-answer', reply: out('no-answer') };
    return { state: 'pending' };
  }
  const reply = (reason) => ({
    ok: false, reason, steps,
    attemptsUsed: now.used, maxAttempts: now.max,
    lastFeedback: st.lastFeedback ?? (answered ? now.wrongLine : null),
    finalState: { isComplete: st.isComplete, result: st.result, text: st.text }
  });
  if (answered) return { state: 'wrong', reply: reply('wrong-code') };
  if (!sent && elapsedMs >= SUBMIT_GRACE_MS) {
    // A refunded counter (network error) or a time lock also leaves the counter unchanged;
    // name them instead of calling the code never sent.
    const txt = typeof st.text === 'string' ? st.text : '';
    const why = /network error/i.test(txt) ? 'network-error'
      : /locked for \d+ more second|too many wrong passwords/i.test(txt) ? 'time-locked'
      : 'not-submitted';
    return { state: 'not-submitted', reply: reply(why) };
  }
  if (elapsedMs >= ANSWER_TIMEOUT_MS) return { state: 'no-answer', reply: reply('no-answer') };
  return { state: 'pending' };
}

/**
 * The polling loop around attemptStep. `read` returns a fresh bridge state (the session
 * passes one that also tracks the lock's own state), `wait(ms)` sleeps and `now()` is the
 * clock; all three are injected so tests drive it with a fake server. Resolves to a reply
 * object, or null when the pad closed, completed or got a result.
 */
async function awaitAttempt({ base, read, wait, now = Date.now, steps = [], pollMs = 250 }) {
  const t0 = now();
  const track = {};
  for (;;) {
    const stp = attemptStep(base, await read(), now() - t0, steps, track);
    if (stp.state === 'closed') return null;
    if (stp.reply) return stp.reply;
    await wait(pollMs);
  }
}

module.exports = { isTransientMessage, lockOutcome, padGone, attemptSnapshot, attemptStep, awaitAttempt, SUBMIT_GRACE_MS, ANSWER_TIMEOUT_MS };
