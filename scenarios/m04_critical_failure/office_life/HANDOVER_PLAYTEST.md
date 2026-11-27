# m04 office life: playtest regression handover (partial)

Status: run 1 (clone route) started and stopped at the Vance phone call. Run 2 (KO Joanne, then KO Vance route) not started. PLAYTEST_REGRESSION.md not written. No screenshots taken. verify-run.rb not run.

## Game and session

- Server: keyless, http://127.0.0.1:3097, puma PID 2162290 (not started or stopped by this run).
- Game 1 (run 1 clone route): game id 7985, made with new-game.rb (MISSION=m04_critical_failure, id 109, PLAYTEST_PORT=3097). FLAGS_XML: tools/playtest/m04_critical_failure-flags-game7985.xml.
- Session log: tools/playtest/m04_critical_failure-session-g7985.jsonl. Session tag 7985, started headless (`--headless true`), `--speed fast`, Node 24 from ~/.cache/ms-playwright-go/1.57.0 on PATH.
- The session was stopped with session-stop.sh 7985 at the end of this note (check `tools/playtest/7985.pid` is gone).
- Game 7985 is a fresh row. Do not reuse it for run 2; make a new game with new-game.rb.

## What ran (run 1, game 7985)

1. Bootstrap (tutorial decline, resume new): stopped at the briefing, as designed.
2. Briefing: converse with the six route picks, all matched. Closed clean.
3. Guard: route picks matched ("Grid-safety regulator", "Where do I find"). Guard admitted, `guard_admitted` set.
4. `enter operations_office` through the door, OK.
5. Robert Vance (`robert_vance`): moveToNear then converse with the route picks. Matched, but the conversation stopped at the RFID cloner (`openedMinigame: rfid`). Cloned card saved (`Save`), then `mg close`. Globals set: `vance_card_cloned`, `vance_provided_keycard`, `vance_is_ally`, `vance_spoken`. A final `converse` pick "Right. Going." closed it.
6. Work orders on Vance's desk (`operations_office_notes_1`): read, `evidence_maintenance_logs_found` set.
7. SCADA control room (`enter scada_control_room`), then Battery Hall 1 (`enter battery_hall_1`).
8. Dial (`analog_thermometer`, moveToNear then interact): `anomaly_detected` set, `crew_hint_texted` set, objective `confirm_the_lie` completed. HaX call is due about six seconds after this.
9. Phone: `openInventoryItem phone` showed an incoming call from Agent HaX. `mg clickControl Answer`. The on-screen options differed from the route's picks. Only "Then where do I start?" was offered. The call ended after that choice (`still-open-after-close` from converse, and the thread went back to the contact list).
10. Opened Robert Vance (ops desk) thread with `mg clickText "Robert Vance"`. Thread has a Call button. `mg clickText "Call"` placed the call. The call played Vance's cost speech ("Half an hour, maybe..."). Only "(Close.)" was offered after it.
11. STUCK at step 10. The call showed "Outgoing call, 0:19" and the countdown did not move over an 8 s wait. `waitFor dialogue` returned at once. `waitFor minigameClosed` timed out. No "Not yet" or "Sound it" option ever appeared, so the route's decision 1 (`crew_warned`) has not been reached. Last state: room `battery_hall_1`, player at (686,301), HP 100, phone-chat open on the Vance call, `crew_warned` false.
   - Last `brief` and `mg getState` text are in the session log, the tail of tools/playtest/m04_critical_failure-session-g7985.jsonl.
   - Not yet checked: whether the call timer is paused by the game (needs a look at phone-call code), or whether the choices appear only after the call's own timer runs out. A screenshot was not taken.

## Loop setting: deviation from the brief

- The brief says `game.loop.setFPS(20)`, fixed steps on. That method does not exist here. `window.game` is the scene. The Phaser game is `window.game.game`, and its `loop` is Phaser's TimeStep (`targetFps`, `actualFps`, `smoothStep`, `fpsLimit`). `setFPS` is not a function (eval-failed).
- Before the call failed, the loop ran at about 59 fps (`actualFps`). `fixedStep` was not checked (TimeStep has `smoothStep`, which was true).
- Nothing was set. The next run needs a decision: set `fpsLimit` to 20 (check it exists first), or record the 60 fps default. Do not set `fixedStep` to false.
- Brief-listed route and objective sources: there is no TESTING_WALKTHROUGH.md or SOLUTION_GUIDE.md in scenarios/m04_critical_failure/ (only stale_* copies, not used). The routes are the source: scripts/ink_runtime_check/m04_routes/r1_quiet_warned_callin.json and r6_vance_ko.json, plus the objectives in scenario.json.erb.

## Gotchas for the next run

- The route JSON picks are ink picks, not what the browser offers. Converse choices are regexes for on-screen options. The HaX call and the Vance call offered different text. Read `mg getState` before choosing and record each mismatch.
- Route `set` steps are not allowed. Each global (`anomaly_detected`, `evidence_maintenance_logs_found`, `crew_warned`, and so on) must come from play. The flag stations need `<flag:N>` under session policy, after the prerequisite is earned.
- Route `advance` steps are game-clock minutes. These come from real play and waits. The Vance call timer must move before any `advance` expectation can be checked.
- Load on the host was 26 to 48 at the start of this run. Headless was used.
- The `ops_kettle_off` global was already true after the briefing. Look at it in the run 1 log before treating it as a finding.
- Joanne and Ibrahim were not checked for their reception posts in this run (not reached).

## Left to do

1. Decide the FPS setting (see above) and note it in PLAYTEST_REGRESSION.md.
2. Diagnose the stuck Vance call (step 10). If it is an engine timing issue, record it as a finding with the session log lines. Do not classify it as a game bug (the skill's rule). Use a fresh game for a retry.
3. Run 1 end to end, then `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game id>` (per the skill) and paste the output in full.
4. Run 2: new game, knock out Joanne Pell early (about 10 punches, `window.playerCombat.attack` is not needed: use `interact`/combat path the harness has), then route r6 to the end. Record the credits text and debrief lines.
5. Write office_life/PLAYTEST_REGRESSION.md per run, commit with explicit paths only.

## Files touched

- None committed by this run except this note.
- Untracked, left in place: tools/playtest/m04_critical_failure-flags-game7985.xml, tools/playtest/m04_critical_failure-session-g7985.jsonl, tools/playtest/pipes-7985/ (gitignored).
