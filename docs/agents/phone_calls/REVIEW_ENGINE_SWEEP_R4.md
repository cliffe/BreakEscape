# Engine sweep review, round 4 (light)

Reviewer: Opus 5.5, 2026-11-12. Commit reviewed: `450ea7c24` (R3 nits in `687ce06a6`, docs only). `public/` was clean
in the worktree throughout, so the suites and live runs used committed engine code. Keyless server on :3027 (pid file
under `test/dummy/tmp/pids/`), headless browsers only; the server was stopped afterwards and every session quit.
Proofs are in `proofs/ENGINE_SWEEP_R4/`.

**Verdict: accept. No blocker, major, minor or nit.** The README now matches the code. A fresh pass over the engine
code found no timer or listener that outlives the minigame, no call left locked and no change to the save format.
Both suites are green, and the three live checks pass.

## 1. The R3 nit commit against the code

`README_scenario_design.md:1983` (the restore paragraph) checked line by line:

| README says | Code | Match |
| --- | --- | --- |
| The mapping's `setGlobal` runs when the event fires, before the ring | `npc-manager.js:1267-1281`: the snapshot and the write happen in the mapping handler, before the offer | yes |
| Only the mapping's own keys are put back, to their pre-offer values | `npc-manager.js:1272` records `{ wrote, prev }` per `setGlobal` key, for ring mappings only | yes |
| A key is put back only while it still holds the value the mapping wrote, so a write of a different value stands | `phone-ringer-dom.js:447`: `if (globals[name] !== rec.wrote) continue;` | yes (R3 n3 wording) |
| The restore does not emit `global_variable_changed` | `phone-ringer-dom.js:442-451` writes the global and calls `broadcastGlobalVariableChange` (ink sync) only | yes |
| Value-mirroring listeners keep the offer-time value | follows from the line above: no emit, so `rooms.js` sprite variants, `revealOnGlobal` and an open thread's `call.when` watcher (`phone-chat-minigame.js:1384-1391`) are not woken | yes (R3 n1 wording) |
| Answered, held or forced calls are never dropped | `phone-ringer.js:408-410` (`ringStale` skips `disableClose`); it is only consulted for queued or ringing offers | yes |
| In memory only, the save is unchanged | `phone-ringer.js:882-886` keeps `ringSetGlobalRestore` on the offer; `record()` (`phone-ringer.js:229-245`) does not save it | yes |

`ringConditionHolds` (`npc-manager.js:566-581`) re-checks only the all-global `&&` terms, and a `||` keeps the ring.
That matches the README's "`call.when` grammar" and the validator, which rejects `||` in `ringWhile`. The
`REVIEW_ENGINE_SWEEP_R2_OUTCOMES.md` correction (R3 n2) reads correctly against `callConditionHolds`
(`npc-manager.js:550-553`).

## 2. Fresh pass over the engine diff

Paths: the ringer files live in `public/break_escape/js/minigames/phone-chat/`, not `systems/`. I read
`git diff 39eedbb9a..HEAD` over `phone-ringer.js`, `phone-ringer-dom.js`, `phone-ring-config.js`, the rest of
`minigames/phone-chat/` and `systems/npc-manager.js`. That range starts before A3, so it includes A3 to A6, which had
their own rounds. I looked only for the bug classes in the brief.

- **Timers on close.** `_stopDial` clears the dial timer and ring-back from `cleanup()`
  (`phone-chat-minigame.js:2057`). The no-answer beat, the "Call ended" beat, the terminal read beat and the clip poll
  (`:1462`, `:1592`, `:1602`, `:1622`) are not cleared at cleanup. Each one checks `this.gameState?.isActive` before it
  acts, and `cleanup()` sets it to false (`:2078`), so a late timer does nothing. Each phone open builds a new instance,
  so a stale flag cannot carry over. The ringer's open timer is cleared in `finishOffer` (`phone-ringer.js:443`).
- **Timers on reload.** The ringer's state is per page, and a reload rebuilds it. The vibrate fallback interval is
  cleared in `stopRingtone` (`phone-ringer-dom.js:228-233`).
- **Listeners.** The `global_variable_changed:*` watcher for the Call button is added once per phone instance
  (`phone-chat-minigame.js:1385`) and removed at cleanup (`:2058`). The `game_loaded` listener and the writer retry in
  `phone-ringer-dom.js:625-637` are installed once per page.
- **A call left locked.** The sweep adds no new lock path. `phone-call-lock.js` only gains the
  `TERMINAL_CALL_END_READ_MS` constant. `dropQuietly` (`phone-ringer.js:416-428`) goes through `finishOffer`, which frees
  the slot, and it reopens a displaced popup.
- **Save format.** Since the sweep's first commit (`752d9d612^..HEAD`) neither `record()` nor `syncSave`
  (`phone-ringer.js:229-286`) has changed. `ringCondition`, `callbackWhen` and `ringSetGlobalRestore` stay in memory.

No defect found.

## 3. Suites (at `450ea7c24`, under `flock /tmp/be-test-suite.lock`)

- `bin/test-js`: **567 passed, 0 failed** (567 files).
- `bin/rails test` (`RBENV_VERSION=2.7.0`, main tree `Gemfile` and `vendor/bundle`): **2137 runs, 28000 assertions,
  0 failures, 0 errors, 1 skip**.

Both match the last known counts.

## 4. Live checks (:3027, committed code)

**(a) `lab_social_engineering` unchanged** (`tools/phone_calls/routes/se_dev.sh`, game 2381, `lab_se/`):
- `sha256_noseed` after the call and after the reload: Dev `ffe4c083298313e1…`, Ruth `52c50b7abf11dcb8…`. Both are
  identical to R3 and earlier rounds.
- There are four Dev `/tts` lines with the same text as R3, all returning 200. Dev's thread has 0 call rows
  (`history_after_reload.json`).

**(b) m01, first HaX ring during the tutorial** (`ENGINE_SWEEP_R1/r1_live.sh m01_tut_idle`, game 2382,
`m01_tut_idle_out.txt`):
- The tutorial is accepted and left idle on STEP 1 OF 8, and the player enters `main_office_area` at t=0.
- The ring queues at about t=6.7 s and stays held while the step panel shows.
- The banner appears at t=26.3 s, so the hold was about 20 s. The poll runs every 1.6 s, so these times are
  approximate.
- The ring layer carries `under-tutorial`. The banner (520,892 360x92) does not overlap SKIP TUTORIAL, the step
  counter, the panel or CONTINUE, and SKIP stays topmost at its corner.
- Screenshot: `m01_tut_idle_ring_over_tutorial.png`.

**(c) Ring-out, then Call back** (new route `r4_live.sh m04_ringout`, game 2383, `m04_ringout_out.txt`):
- The dial in Hall 1 is read for real. HaX's dial ring (`onMissed: callback`) is left alone and rings out after about
  20 s (`RING_TIMEOUT_MS`).
- One `phone_call_missed:agent_0x99` fires, and the thread gets a "Missed call" row. The callback is kept with its
  `callbackWhen`.
- The thread header shows "Call back", and so does the row's inline button (`m04_ringout_thread_callback.png`).
- Pressing the header button shows CALLING and then connects. `phone_call_answered` has `callback`, and HaX's
  `on_anomaly_confirmed` lines play (`m04_ringout_callback_call.png`).
- After "Then where do I start?" the call ends. The rows are `["Missed call","Outgoing call, 0:13"]`, the Call back
  button is gone and the thread is back.
- The run shows five `/tts` requests for HaX.

## Files
`proofs/ENGINE_SWEEP_R4/`:
- `lab_se/`
- `m01_tut_idle_*`
- `r4_live.sh`, with its `m04_ringout_*` output
