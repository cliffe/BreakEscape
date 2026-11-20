# Review: A2c round 2 (hold, popups, damage and the ending)

**Verdict: R1 fixed; accept after a short fix round for minors.** 0 blocker, 0 major, 4 minor, 3 nits. M1 and M2 are fixed and their tests fail when the fix is removed. The new findings are latent: no mission outside `test_phone_calls` uses `ring` yet. They should be closed before the mission migrations add rings.

Reviewed at `c3e6c2940` (fixes `e29461e69`, `e41dfdc64`; proofs and docs `c3e6c2940`). One commit has landed since then, `e2aaf3ecf` (A7a R3 fixes, another slice), which I did not review. The other agent's uncommitted `proofs/A2c/reg/` was not reviewed. Node runs were in a detached temp worktree at `c3e6c2940`, now removed: `phone-ring-hold` 21/0, `phone-ring-layer` 23/0, `ending-check` 20/0, `player-damage-interrupt` 13/0, `phone-ringer` 122/0. No server was needed.

## What checks out

- **M1, both hooks.** `scenario-music-events.js:249-251` defines `closeRinger`, and it is called only at `:319` (offline concluded) and `:326` (concluded), each just before `openCredits`. The refusal branch (`:332` onwards) leaves it alone. `ending-check.js:268-273` returns for `reason === 'credits'`, at confirmation (`:208`) and from the held ending (`:284`). So a refused conclude leaves rings working, whether the credits came straight from the trigger, from "End the mission now" or from the panel button. `window.phoneRinger.close` has no other caller (grep of `public/break_escape/js`). Plan row 28 (`PHONE_CALLS_PLAN.md:274`) now says all this.
- **M1 mutations.** Restoring the close at the top of `playEntry` fails `ending-check` (19/1). Dropping the `credits` return in `closePhoneRinger` also fails it (19/1). The behaviour test is a source slice, not a refused-conclude run, which is what R1 allowed.
- **M2 mutations, rerun.** Removing the `voiced`/`disableClose` term from `isConversation` (`phone-ringer-dom.js:49-50`) fails `phone-ring-hold` (20/1, "what blocks ringing"). Blanking `window.lastPlayerHitAt = lastPlayerHitAt;` (`player-damage-interrupt.js:201`) fails it too (20/1). Removing the `settingAside` guard fails nothing (21/0), but see m3.
- **n2.** The `'video-call'` term is gone and the table test covers a person-chat in `video-call` mode.
- **Scenario moves.** No route in `tools/phone_calls/routes/` addresses objects by position. All use `moveToNear`/`interact` by id, and none uses `Instructions`. Levers, `keypad_safe` and `pick_case` did not move. The `a2b_*` routes are unaffected.
- **Proofs** (timelines and screenshots opened):
  - Banners: over the lockpick, container and terminal PC. Each has Answer and Decline and the "Answer puts them on hold until you close this" status. The pill over the lockpick has Hang up.
  - Popups: the lab sheet rings over the popup, and after End the same render is back, with identical "1:04:21 PM" timestamps and so no reload. `labstate` shows `scrollY` 288 before and after, `srcProp` absolute, `srcAttr` relative, `loads` 0. CyberChef is the same.
  - Row 26 forced, second run in `forced_session.jsonl`: the hit closes the call at 27.8 s (hp 97). Hits continue to 35.6 s (hp 85). It rings again at 40.7 s, about 5 s after the last hit, auto-answers and is connected at 46.7 s. In the first run the brute stayed hostile and the call never came back, which is also correct.
  - Hold variants:
    - v14: a note from the container, then the container returns with the pill, then the call opens after the container closes.
    - v15: `legacy_voiced` opens on `minigame_completed` while `caller_hold` stays held. Its `conversation_closed` is at 43.4 s, then `caller_hold` connects at 44.7 s.
    - v16: the hold waits for the quiet time.
    - v17: Hang up gives declined.
    - v18: held from about 28 s, `phone_call_missed` at 118.2 s.
  - Mission Brief: the banner shows over the brief, `ringMs` is frozen at 10.1 s for 25 s, resumes at 12.4 s, and the call is missed later.
  - Recruiter hit: `a2c_timeline.txt` is identical to `A2b_r1/cur/cur_timeline.txt` once the `t` stamps are removed (empty diff).
  - Lab SE: Dev's `sha256_noseed` `ffe4c083…` and Ruth's `52c50b7a…` match the A0, A1 and A2b_r1 baselines after the call and after reload.
- **`lab_social_engineering`.** No commit in `e27c30d6c..c3e6c2940` touches it.
- **Banner over minigame titles: acceptable.** Plan 2.4 (`PHONE_CALLS_PLAN.md` 2.4, "if it covers a control … the fix goes in `phone-ring.css`") asks for a move only when a control is covered. In the three shots it covers the object title (all but "ick)" of the lockpick's title) and none of the controls: Close, the pins, the container items and the desktop icon are clear. Top right is the notification column and the bottom is Close or Continue, so top centre is still the best spot. The banner lasts at most `RING_TIMEOUT_MS`. The pill is one line. No change needed.

## Findings

### m1. Aim and mapping endings still close the ringer before any conclude, so the M1 failure remains on a mapping ending

`ending-check.js:268-273` closes the ringer at "End the mission now" for `aim` and `mapping`. A mapping ending (`npc-manager.js:1044`) opens a debrief. The credits and the conclude come after it, and the conclude can still be refused (`scenario-music-events.js:332`).

**Failure:** a mission whose `endingCheck` debrief mapping is not gated on its `concludeRequires` flags: the player agrees to end, sits through the debrief, then is told "Not finished yet". They go back to the VM with the ringer closed for the rest of the session, and every later `ring` is refused. That later ring includes the plan's M5 HaX ring after the root flag (8 M5). m05 and m07 gate their debriefs on the flags (their `_comment`s at `m05 …erb:1577` and `m07 …erb:1649`). For m10, the `tesseract` mappings (`m10 …erb:2472-2473`) are gated on `globalVars.ending`, and I did not check whether that can be set before the four flags. The plan now records this choice in row 28, so this is about how far that choice holds up, not a slip in the fix.

**Fix:** either treat `mapping` like `credits` (a debrief is a person-chat, so it blocks ringing anyway), or add `phoneRinger.reopen()` (clear `closed`, `ensureTick()`) and call it from the refusal branch. The second also covers an aim ending whose `complete_task` fails. Test: a refused conclude after a mapping "End now" leaves `isClosed()` false.

### m2. The aim conclusion screen opens the credits without closing the ringer, live and on reload

`objectives-manager.js:1159-1192` (`handleMissionConcluded`) opens `BondVisualiser` when the server answers `missionConcluded` (`:736`, `:637`), and again on every load of a concluded game (`main.js:186`, `replay: true`). It never calls `phoneRinger.close()`. The adapter does not treat the visualiser as blocking or pausing (`phone-ringer-dom.js` `ringBlocked`, `isPaused`: neither reads it). Every m01–m10 conclusion aim has `conclusionScreen: { type: "bond_visualiser" }` (for example `m01 …erb:483`).

**Failure:** once migrations add rings, a delayed or `game_loaded` ring rings over the credits. An example is m03's planned 120 s HaX ring and its `game_loaded` re-arm (plan 8, m03 row). It does this on the live aim-concluded path, and on the replay after reload where nothing else closes the ringer. Row 28 says the ringer closes when "the credits start".

**Fix:** call `window.phoneRinger?.close?.()` at the top of `handleMissionConcluded` (the server has already agreed there, so the M1 concern does not apply), and add the hook to the plan's list at `PHONE_CALLS_PLAN.md:767`. Test: `handleMissionConcluded` with and without `replay` closes a stub ringer.

### m3. The `settingAside` guard does have an effect: a refused open after a put-aside skips the 2 s retry wait

The comment at `phone-ringer-dom.js:331-332` says nothing observable depends on the guard. Without it, `putAside` (`phone-ringer.js:469`) fires `onPopupClosed`, which defers a `nudge` (`:808-811`). If `openCall` then refuses (row 19), `finishOpen` sets `o.retryAt = now() + RETRY_OPEN_MS` (`:489`) and goes back to held. The deferred nudge then runs, sets `retryAt = 0` (`:811`) and opens again after only `SCRIPTED_CALL_START_MS`. Checked: a scratch test against the real adapter has the CyberChef popup open, Answer, and the first `startMinigame('phone-chat')` returning null. It then advances 1000 ms. With the guard there is 1 attempt, without it there are 2 (the test fails). The test is saved at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2dd9046d-5103-4a95-9363-70f3aa5c1f4a/scratchpad/zz-r2-aside.test.mjs`. The other sequences asked about cannot reach it. JS runs `putAside` in one turn, so no click lands during it. A second Answer needs `state === 'ringing'` (`answer`), and the call is `connected` by then. A close during the put-aside would be the same synchronous call.

**Failure:** only the row 19 refused open (knocked out, or the scene refused) after a popup was put aside, and then only the timing of one retry. It is minor, but the comment is wrong and the guard has no failing test, which is what R1 n1 asked for.

**Fix:** add that test to `phone-ring-hold.test.mjs` (it is about 25 lines and uses the existing `makeWorld`), and change the comment to say that the guard keeps a refused open's retry wait.

### m4. The Instructions note is now outside the room

`scenarios/test_phone_calls/scenario.json.erb:519-523` moves `Instructions` to (10, 3). `room_office` is 10 tiles wide (x 0–9). In `proofs/A2c/brief_after_brief.png` the note is drawn beyond the right wall, at about (1155, 480), outside the room's edge.

**Failure:** a human tester can't reach or read the scenario's instruction note. No route uses it.

**Fix:** put it on a free tile inside the room at least two tiles from every prop and NPC. For example (9, 1) if that is floor, or check `brief_after_brief.png` for a clear spot.

### n1. `open_obj` can't tell `open_case` from `terminal_pc`

`a2c_live.sh:14-19` checks only the minigame class, and both objects open a `ContainerMinigame` (`:92`). In `v14_session.jsonl` one earlier attempt clicked into a `TextFileMinigame` (the PC's file) and ended its call as missed. The committed jsonl files also keep the failed attempts before the final run, so a reader has to know that the last run is the proof. Check `currentMinigame.params` (the object id or name) as well as the class, and start a fresh log per run or mark the attempts.

### n2. The R1 outcomes have a stale line

`REVIEW_A2c_R1_OUTCOMES.md:14` says the plan row 28 note is "still to add". `c3e6c2940` added it (`PHONE_CALLS_PLAN.md:274`).

### n3. The guard proof shows the drop only in the opening gap

In `guard_run.txt` the one sighting during the call is at 17.4 s. That is between Answer (17.3 s, ringing) and the call on screen (18.3 s), so it fell in the 500 ms connected-but-opening window. It was dropped, which meets the accept line ("fired during a connected call is dropped"). No sighting fired in the 48 s the call was on screen, and the route's guard probe returned `guardX: null` throughout. The on-screen case is covered only by `phone-call-busy.test.mjs`. If the proof is rerun, read the guard's position from the NPC's sprite field the engine uses, and force a sighting while the call is on screen.

## Not findings, for the orchestrator

- Row 28 live (a refusing `concludeRequires`) is still open; the other agent is on it.
- The lab SE stored choice text reads "I'm helping , your new starter in ." in `storyState` (`proofs/A2c/se_dev/storystate_after_call.json`). It is the same in the A0 baseline and probably filled in by the pretext card at render time. It is not an A2c change.
