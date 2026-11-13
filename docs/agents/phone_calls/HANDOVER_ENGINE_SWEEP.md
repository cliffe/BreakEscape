# Handover: engine follow-up sweep

Branch `build/phone-calls`, worktree `.claude/worktrees/p-phone-calls`. Stopped at the handover
threshold after items 1-8 were implemented, tested and committed. `ENGINE_SWEEP.md` has the full
record. This note is the open work.

## Done and committed
Items 1-8 (see `ENGINE_SWEEP.md` and the log). Full JS suite 563/0 at the committed state. No new
static import, so no test-harness copy list changed. `lab_social_engineering` source not touched.

## Open work

### Item 9 — tutorial-hold limit (NOT implemented)
From M8 R2 M1. The tutorial-panel ring hold added in `916104732` (`ringBlocked()` in
`phone-ringer-dom.js`, the `getTutorialManager()?.active`/`promptOpen` clause) has no limit: a player
who stops pressing Continue holds every ring for good (m01: 150 s seen live).

Decided rule (orchestrator):
- Hold fully while the tutorial's opening accept/skip modal is open (`promptOpen`).
- While the step panel shows (`active`, not `promptOpen`), hold at most **20 s of unpaused time from
  when the ring was offered**, or until the current step completes, or the tutorial ends — whichever
  first. Then ring, with the banner placed so it never covers the panel's buttons (SKIP TUTORIAL) or
  the step counter.
- Forced calls follow the same rule.

Design notes for whoever picks it up:
- The hold needs per-offer timing, so this is not a pure `ringBlocked()` boolean any more. `ringBlocked()`
  currently returns true whenever the tutorial is `active`/`promptOpen`. Suggest: keep the full block only
  for `promptOpen`; for the step panel, let the ring be `queued` and record the offer time, then release
  it after 20 s of unpaused time (the ringer already tracks unpaused time via `advance()`; a
  `tutorialHoldSince` on the offer, checked in `runOnce`, mirrors `HOLD_MAX_MS`). Or add a
  `tutorialHoldExpired()` term that `ringBlocked()` consults.
- Banner placement clear of SKIP TUTORIAL / step counter is a CSS/z-order job on the ring layer vs the
  tutorial panel; check `phone-ringtone`/banner CSS and the tutorial panel's selector.
- Tests: a tutorial-active offer rings after 20 s idle; a step completing or the tutorial ending releases
  it sooner; the opening modal holds fully; a forced call follows the same rule. See
  `test/js/phone-ring-tutorial.test.mjs` (M8 R1 added it) for the existing harness.
- Doc: README "Voiced phone calls", the "Nothing rings yet" table — add the tutorial row with the 20 s rule.
- Live check: m01, tutorial accepted then left idle — the ring comes at ~20 s and the banner does not cover
  SKIP TUTORIAL.

### Item 10 — terminal-look calls close too fast (NOT implemented)
From M6 R1, live on m07 (game 2164). In the terminal look there is no call screen and no "Call ended"
beat, so `#exit_conversation` (and the story's end) closes the phone at once: the last line of every
Architect call ("The line drops…", "Static. Then nothing.", the sign-off ending) is on screen for
under 50 ms.

Rule: add a short read beat before closing **in the terminal look**. Match the "Call ended" beat, or
scale it by the last line's length, through a named constant (e.g. extend/parallel
`FORCED_CALL_END_CLOSE_MS` in `phone-call-lock.js`). When cached audio exists for the last clip, the
close must also wait for that clip to finish (the non-terminal "Call ended" beat already relies on the
session overlay / clip timing — reuse that). Where: the terminal-look branches in `phone-chat-minigame.js`
"Ending" (`closeConversation`, `_releaseForcedCall`, `#exit_conversation`, the story-end branches) that
today skip the "Call ended m:ss" beat for the terminal theme (`safeParams.theme === 'terminal'`). Add a
test. **`lab_social_engineering` does not use the terminal look — confirm its `sha256_noseed` is
unchanged after this.**

### Item 11 — a withheld terminal caller's thread opens in the green look (NOT implemented)
From M6 R1. The Architect's own thread (his voicemail thread, opened by hand) shows in the green handset
look, though C6 says his calls use the terminal look.

**A contact-level theme field already exists: `phoneTheme` on the NPC record.** `resolvePhoneApp`
(`phone-app.js:83-88`) resolves the look as `app.theme || params.theme || npc.phoneTheme`, and the
thread open reads it (`phone-chat-minigame.js:144-154`). So the m07 fixer can set
`"phoneTheme": "terminal"` on the Architect contact and his thread should open terminal. **Second engine
agent to verify:** (a) setting it actually turns the hand-opened thread terminal for a withheld caller,
(b) it does not change the device/contact-list look when his is the first/only contact (the look
"belongs to the device", `phone-app.js:7`), and (c) voicemail `voice:` bubbles render in the terminal
look (they already do, `phone-chat-ui.js:929`). If the thread does not honour `phoneTheme` for this
case, that is the engine fix; otherwise it is config only (m07 fixer) and needs documenting in README
"Voiced phone calls" (the `phoneTheme` field is not yet documented there).

### Live proof still owed (brief requirement, items 1, 2, 4)
Not run (stopped at the handover threshold). Required: keyless server on **port 3027 only**
(`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=.../vendor/bundle bundle exec rails
server -b 127.0.0.1 -p 3027`), headless, `guard_off` for `test_phone_calls`. On `test_phone_calls` and
one real mission (m04 or m09): **count `conversation_closed` emissions after an answered call and after a
displaced thread** (item 1 — expect exactly one per contact now), prove the `(Close.)` tap posts no
bubble (item 2), and prove a refused dial shows the toast (item 4). Routes exist under
`tools/phone_calls/routes/` (`m04_live.sh`, `m09_m1_live.sh`); the M6 route uses :3028.

### Verification still owed
- **Rails suite** under `flock /tmp/be-test-suite.lock` (the validator Ruby changes and anything server-side).
  JS suite is green (563/0); Rails not yet run this session.
- **lab_social_engineering unchanged**: run its tests plus the `sha256_noseed` check (Dev `ffe4c083…`,
  Ruth `52c50b7a…`) before and after. The engine changes are all gated on `ring`/`ringerCall`/`call`
  and the lab's pretext `callLaunch` path is untouched, so it should be byte-identical, but it must be
  proven per the hard constraint.

## Gotchas
- The m04 fixer wires `ring.callbackWhen` (item 7); do not edit m04 from the sweep.
- `ring.callbackWhen` is in-memory only by design (save unchanged); a reload restores the callback
  without the condition, so the stale-clear applies within the session the miss happened in. Acceptable
  for the m04 case (the ESD goes live and the button is rebuilt before any reload).
- Item 8 re-checks only `globalVars.*`-only conditions (safe-false); a condition that reads event data
  is left ringing. m04's dial-ring condition is globals-based, so it is covered.
- `phoneRinger.dropDisplaced` is now exposed on the adapter object (for the item-1 test); harmless.
