# Engine sweep review R1 — fix outcomes

Fixer: Opus 4.8, 2026-11-12. Worktree `.claude/worktrees/p-phone-calls`, branch `build/phone-calls`.
Review: `REVIEW_ENGINE_SWEEP_R1.md` (accept with one Major + 3 minors + 4 nits), plus the M1 R4 design
change (`REVIEW_M1_R4.md`) that replaced the whole implicit item-8 re-check with an opt-in
`ring.ringWhile`. This round implements `ringWhile`, keeps the m2 restore for it, and fixes m1, m3 and
the cheap nits.

## M1 R4 — the implicit re-check is replaced by `ring.ringWhile`
Re-checking a mapping's **trigger** `condition` surprised authors (m09 Torres's `!hl_box_opened` lid
guard silently dropped his call, even on hold). So:
- The implicit re-check is removed: the offer no longer carries a `ringCondition` from `config.condition`,
  and `_ringRecheckCondition` (the self-latch filter) is deleted.
- New opt-in `ring.ringWhile` (same grammar as `callbackWhen`), re-checked **while queued or ringing
  only**. A failing `ringWhile` drops the call quietly and restores the mapping's `setGlobal` (m2). A call
  answered or on hold is never dropped (the held-state re-check is removed); forced calls are exempt.
- Validator checks `ringWhile` like `callbackWhen`. m04's dial ring opts in with
  `"ringWhile": "globalVars.esd_authorized !== true && globalVars.mission_complete !== true"` (the only
  mission). README rewritten; `phone-ringwhile.test.mjs` replaces `phone-ring-self-latch.test.mjs`.
- Live: Torres's lid ring (no `ringWhile`) keeps ringing when the box is opened while it rings; m04's dial
  ring drops once the ESD is live; Nightshade still rings. See the log entry.

## What changed (each with a test that fails before, passes after)

### m1 — item 1 could leave zero `conversation_closed` emits when the call never opened
`dropDisplaced` skipped the emit whenever `d.thread === d.callNpcId`, on the grounds the call already
emitted. That only holds when the call's own phone-chat opened its conversation. On giveUp, the ending
closing over a held offer that had put the phone aside, and an outgoing dial that rang out, the call
opens no story, so the thread's close went unreported (before the sweep it fired once).

- `phone-ringer.js`: `finishOpen` (incoming) and `outgoingConnected` (outgoing) mark a displaced **phone**
  descriptor `callOpened = true` when the call's conversation opens.
- `phone-ringer-dom.js`: the skip is now `d.callNpcId && d.thread === d.callNpcId && d.callOpened`.
- Tests: `phone-displaced-emit.test.mjs` (a never-opened same-contact descriptor still owes its emit);
  `phone-outgoing-ringer.test.mjs` (the connected-call reopen descriptor now carries `callOpened`).

### m2 — a quiet drop kept the mapping's own latch, blocking its twin
A ring mapping's `setGlobal` runs at offer time, so a latch stays set even when a `ringWhile` drop
removes the ring. Its twin, guarded by `!latch`, would then be stuck.

- `npc-manager.js` `_handleEventMapping`: snapshot the pre-offer values of a ring mapping's own
  `setGlobal` keys, pass them as `ringSetGlobalRestore` on the offer.
- `phone-ringer.js`: carry `ringSetGlobalRestore` (in memory only, never in `record()`/the save);
  `dropQuietly` puts those globals back through the adapter's `setGlobal`.
- Rule (README "A ring whose reason goes away"): the dropped ring's own latch is restored; a dropped
  `onceOnly` ring does not re-fire itself, so give such a ring a **twin** on the later event rather than
  rely on the same `onceOnly` mapping firing twice.
- Test: `phone-ringwhile.test.mjs` (the cage-ring shape: A rings with a `ringWhile`, its condition fails,
  the ring drops, the latch is restored, the twin then rings).

### m3 — the terminal read beat also delayed the player's own hang-up
`_completeRingerCallWithBeat(selfClose = false)`: the terminal read beat (item 10) runs only when
`selfClose` is true (the call closed itself: `#exit_conversation`, the story's end). `_exitRingerCall`
and `_releaseForcedCall` pass `true`; `closeConversation` (the back arrow / Esc) passes `false` and
closes at once, as before the sweep. The handset "Call ended" beat is unchanged.
Test: `phone-call-terminal-beat.test.mjs` (a player hang-up on a terminal call closes at once).

### Nits
- **n1** moot under M1 R4: the implicit re-check (where a mixed `globalVars.x === data.y` term could be
  mis-evaluated) is gone; `ringWhile` is globalVars-only, enforced by the validator.
- **n2** README "The call look" now states the item-11 decision plainly: the look is set once per phone
  session; a thread tapped from the device's contact list keeps the device look; only the contact's
  calls and a phone opened directly on that contact use its `phoneTheme`; a device with no `app.theme`
  takes its fallback from the **first** contact's `phoneTheme`, so do not list a terminal contact first.
- **n3** `phone-ring-tutorial.test.mjs` gains a paused-clock case (the 20 s hold counts only unpaused
  time) and a case that `hideBanner` clears `under-tutorial`.
- **n4** is m07 ink content (the Architect's "Hang up." thread stub), for the M6 round — not an engine
  change, left as the review left it.

## Tests
- Full JS suite under the flock: **567 files, 0 failed**.
- Full Rails suite under the flock: **2137 runs, 0 failures, 0 errors, 1 skip**.
- No new static import, so no test harness copy list changed.

## Live proofs (committed `464c42064`, keyless :3027, own pidfile, headless; `proofs/ENGINE_SWEEP_R1_fix/`)
Driven by `es_r1_fix_live.sh` unless noted; the server was stopped afterwards.
- **m04** (game 2280, real config): the dial read sets `anomaly_detected`; HaX's dial ring (with the new
  `ringWhile`) rings, then `esd_authorized` set true while ringing → the ring drops within 2 s
  (`ringer=null`), no Missed/Call back row. M1 R4 proven on the real mission.
- **m09** (game 2288, real `torres_phone` NPC): the Torres lid-ring shape (trigger guard
  `!globalVars.hl_box_opened`, no `ringWhile`) rings; the box is opened while it rings → it keeps ringing
  at t+2/4/6 s (not dropped). M1 R4 rule 7: the trigger condition is not re-checked.
- **m2** (game 2284): mapping A rings with a `ringWhile` and sets its latch; `ringWhile` fails → A drops
  quietly and its latch is restored to its pre-offer value; twin B then rings. R1 m2.
- **m1** (game 2285): a ring answered over caller_thread's own thread goes to held with the phone put
  aside, the call never opens, counts stay 0; `phoneRinger.close()` (the ending) drops the held offer →
  `conversation_closed:caller_thread` fires exactly once. R1 m1.
- **m07** (game via `ENGINE_SWEEP_R1/r1_live.sh m07_back`): a terminal taunt, the back arrow at
  26 350 ms → the call completes at 26 353 ms and the phone is gone at 26 367 ms (17 ms, vs ~2.6 s before).
  R1 m3.
- **lab_social_engineering** (game via `se_dev.sh`, clean `public/`): Dev `ffe4c083…` and Ruth
  `52c50b7a…` after the call and after a reload, identical to the baseline; the four Dev `/tts` lines all
  200. Unchanged.
