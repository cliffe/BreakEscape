# m01 office-life build report

Measured values only. Steps 0 to 4 so far; step 5 (Maya) and the remaining section 8 tests are added by the next agent.

| Step | Commit | Result | Measured |
|---|---|---|---|
| 0 Fatima, one-knot ink | 72afb4795 | pass | person NPC registers, talk, exit, re-talk, reload then talk; only 503s in console |
| 1 room tone | 377605400 | pass | validator 0 errors, lock diff empty |
| 2 desk PCs, seated extras | 85a96483e | pass | seated 0 px from chair centre; typing log count 2 at level 0.6; one pc sprite per Tiled pc |
| 3 leave after reveal, attacked texts, credits | 2b0cbe079 | pass (live, see Checks agent) | validator 0 errors, 21 warnings; lock diff empty |
| 4 cooler, thirst, breaks, exchanges | 33038138a | pass (live, see Checks agent) | validator 0 errors, 22 warnings; V1 9 NPCs, Fatima and Graham chatter 4, exchanges 2 |

## Step 4 live (game 7080, port 3094, real-time walking)
- Cooler: one object, id office_cooler, top-left (5.41, 8.19), 24x47.
- Fatima used it from body centre (5.65, 7.82), pose_drink facing up; Graham stood on the beside cell (6.87, 7.64). Both walked from desks in about 8 s (Fatima arrival t=25 from job start t=12 in needs ticks, Graham 9 s).
- ex_interns heard once (heard_ex_interns true) 54 needs-seconds after the first break; value kept after reload; heard_ex_biscuits still false in that run (second round pending, tools/playtest/m01-ol-exchanges.mjs).
- Sync during the run: 4 flushes, largest 1241 bytes, keys triggeredEvents, phoneState, scenarioClock, timedMessages, clientTs, globalVariables, notes (no growth).
- Step 0 503s: every "Completed 503" in tmp/server-3094.log pairs with a /break_escape/games/N/tts request (17 of 17 by path count); one stray pairing of a button.png line was an interleaved-log artefact (that request completed 200).
- Screenshots: screenshots/main-office-seated.png, screenshots/cooler-in-use.png.
- Spoken-line change: validator caps exchange bubbles at 40 characters, so SPOKEN_LINES 16, 21, 22 were shortened (38, 32, 39 characters) before voicing; all 22 clips voiced in a0c4535b6 (D97a).

## Checks agent (live checks for steps 3 and 4, port 3094 keyless, headless, setFPS 20 with fixed steps)
Probes: tools/playtest/m01-ol-evening-reload.mjs, m01-ol-attack.mjs, m01-ol-approach.mjs, m01-ol-reloads.mjs; raw output in tmp/handover/m01live/. No scenario or ink edits.

| Check | Game | Result |
|---|---|---|
| 9 evening hide by the real path | 7089 | PASS |
| 9 reload after the reveal | 7089 | PASS |
| 10 attack and KO, Fatima | 7094 | PASS |
| 10 attack and KO, Graham | 7095 | PASS |
| 3 credits lines | 7094, 7095 | PASS |
| 7 bin and filing cabinet approach | 7104 | PASS |
| 5 biscuits exchange, once and after reload | 7080 (earlier run) | PASS |
| 6 reloads, day and during a break | 7109 | PASS |
| 6 reload after the reveal | 7089 | PASS (see 9) |
| V6 keyless | n/a | 18 clips, 18 uncached (before voicing), 621 characters |

### Test 9 (game 7089)
- Route: new-game.rb with --start-room main_office_area and --unlock hallway_east, it_room, server_room, FLAGS_XML seeded through `session-start.sh --flags`. In game: walked main office, IT room, server room (door route via `enter`), opened the archive, typed the flag token `<flag:1>` at the flag station (UNLOCK), got "Access granted", took "ENTROPY Network Architecture" from the container. No global written from the page and no game row edited. The earlier stall was the missing flag step: the harness substitutes the real value.
- Hide fired while the player stood in server_room: both extras `visible` false, `needs` mode idle, `_seat` null, `_seatMove` and `_fetch` null, `officeTypists` size 0, no reserved chair among the main office objects. The player was never in the main office when it fired, so nobody was seen leaving.
- Back in the main office (via IT room): both still hidden. Screenshot screenshots/evening-empty-office.png.
- Reload (page load of the same game): at load, before entering any room, both hidden, unseated, mode idle (restored visibility). Then it_room, server_room, it_room, main_office_area: still hidden at every step, no console errors (tmp/handover/m01live/evening-reload.txt). Screenshot screenshots/evening-after-reload.png.

### Test 10 and credits (games 7094 Fatima, 7095 Graham; real playerCombat.attack punches)
- First punch made the target hostile; `m01_staff_alarmed` true within 3 s; cooler `_isOff` false before, true after; HaX text delivered once (Fatima: "Stand down, Agent. She runs recruitment...", Graham: "That's an accountant, Agent...").
- KO took 13 punches each (target cowers, so no retaliation was seen). `fatima_ko` / `graham_ko` set only for the KO'd extra. The other extra stopped working (mode idle) after the alarm and stayed visible.
- chaseRange: both extras are `fightStyle: cower`. Hostile and alive, the target did not move from its post (Fatima 44,133; Graham 236,133) at all across five 2 s samples while the player stood in hallway_east, and it stayed there when the player came back. So there is no chase to leash: nothing followed the player out of the main office. The chaseRange 160 value itself was not exercised (a leash can only be seen with a chasing style).
- Credits: engine evaluator `endingReplayOptions(scenario, globals + ending flags)`: Fatima run lists the FATIMA line only; Graham run lists the GRAHAM line only; both others show Maya "Identity protected" and Kevin "Status unknown" as before. The overlay itself was not played to the end (needs the whole mission).
- Screenshots: attack-*.png, ko-*.png.

### Test 7 (game 7104)
- Graham using his PC (need work, phase using) while the bin was opened: ok, container "Office Recycling Bin" with Maintenance Checklist, player stopped at (7.72, 4.42).
- Fatima walking to the cooler and Graham using it: filing cabinet PIN prompt opened (player at 5.66, 1.61), bin opened again (player 7.98, 4.16). No blocked approach. Cooler users stayed at (5.65, 7.82) and (6.87, 7.72). Screenshots approach-*.png.

### Exchanges (test 11)
tmp/exchanges-run1.txt on game 7080 is complete: ex_biscuits started and heard once in round 1 (ex_interns already heard in the earlier cooler run), nothing again in rounds 2 and 3, both globals kept after reload and no exchange in round 4 after the reload. No errors besides 503s.

### Reloads (game 7109)
Day: both seated at their chairs before and after reload. During a break (Graham using the cooler, Fatima walking to it): after reload both are back seated and working, no stuck state, `m01_staff_alarmed` false. After the reveal: see test 9.

### V6
`env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m01_first_contact]"`: Graham 9 clips (312 characters), Fatima 9 clips (309), total 18, all uncached (before voicing; 621 characters). SPOKEN_LINES.md expects 22; the difference of 4 is its four "talk" lines, which live in the ink and are not counted by this task (assumed, not checked in the rake source).

### Observations, not fixed
- During the break, Graham's `_seat` was truthy while he was `using` the cooler (game 7109 sample, before reload). Fatima's was false at the cooler. Not checked whether this is a leftover desk seat or the cooler's use pose.
- The unrelated `dungeon_graph.html/.md` modifications in the worktree are the validator's output and were left alone.

## Step 5 routes and clip count

Probe: tools/playtest/m01-ol-maya.mjs (routes topicchoices, getstarted, inout, attack). Headless, setFPS(20), fixed steps on, keyless server on :3094, games started with new-game.rb --start-room main_office_area --unlock hallway_east --unlock maya_office (7142, 7144, 7180, 7183 carry the passing runs; 7143, 7145, 7165, 7167, 7171, 7176 were earlier or harness-debug runs). No game rows edited, no /tts requests.

### Route a: Esc at a topic's choices, reopen at her desk (game 7142): PASS
- After "SAFETYNET sent me" and "Tell me everything" the first operation line showed, then the choices ("And they're okay with that?" / "When does it launch?") with `maya_away` false, `maya_settled` false, `discussed_operation` true.
- Esc closed the chat. Five seconds later she was still at post, mode idle, no job, globals unchanged (settled false), so no trip.
- Reopened at her desk: the chat resumed at the topic's remaining lines and choices, then went on to the hub choices with `maya_settled` true. "I need to keep investigating" closed it and the trip started 1.2 s later (job goto_target, `thirst` level 20). No stuck state, no console errors.

### Route b: "I'll get started" with discussed_operation true (games 7143, 7144): PASS
- Hub, "What should I do first?", "I'll get started": her reply "Good luck. And... thank you. For coming." played and the chat closed. Five seconds later she was at post, idle, `maya_settled` false, `discussed_operation` true.
- Next desk talk opened on "I was starting to think no one cared about stopping this.", then the hub choices, and `maya_settled` became true.
- Closing at the hub armed the trip (`thirst` set to 20, urgent). In 7144 she then parked at her desk with reason "avoid" because Graham was using the cooler (`needsCompany.avoids` working as designed); in 7142 she walked. Not a defect.

### Route c: quick in and out of her office (game 7180): PASS
Arrow-key movement through the real door (see harness note). `maya_away` after each move:
- hall: true; office: false; desk talk, baseline: first-meeting opener, no Not here choice.
- A, out and back (1.7 s): true, then false. Desk talk afterwards: normal opener choices, no Not here, no not_here line.
- B, hall, office, hall (2.3 s): true, false, true. Back into the office: false. Desk talk: normal choices, no Not here.
- C, hall, main office, hall, office (enterRoom): true, true, true, false. Desk talk: normal choices.
- Console errors: none.
- Harness note: `window.__test.enterRoom` fails with "did-not-cross" from inside her office (pointer pathing stalls near the spawn, feet at x 208, y -142), though arrow keys leave the room at once. The player is not boxed in. The probe uses keys for the office door and enterRoom elsewhere.

### Route d: attack at the cooler routine (game 7183): PASS, with a note on timing
- Trip armed by the real talk; extras' thirst set to 100 so they stayed at their desks. Maya was punched in the main office on her way back (mode returning, 8.2, 2.6), not at the cooler itself.
- First punch made her hostile (`isNPCHostile` true); `m01_staff_alarmed` stayed false (only the extras' attacks and Derek's fight raise it, as planned). KO followed with further punches: `maya_ko` true, `maya_away` true (she lies in the main office), `maya_settled` true, `discussed_operation` true, her needs mode idle.
- Talking to her afterwards correctly refuses ("different-room" while the player is in the main office). Navigation to hallway_east and main_office_area still works, no blocking UI, no console errors.
- Critical path: Maya's talk is optional (`talk_to_maya`), and `discussed_operation` was already set before the attack, so the HaX phone choice that reads it is unaffected. Not tested here: KO before the first talk (the base behaviour for her, unchanged by this step), and a full critical-path regression.
- Not seen: an attack exactly while she is using the cooler. She finished her use before the player reached her. The same hostile and KO handling applies in any room, so this is low risk.

### V6 clip count: 18 is right, the earlier 22 counted something else
`app:break_escape:tts:office_lines` (lib/tasks/break_escape_tasks.rake, app/services/break_escape/tts_office_lines.rb) lists office-life clips only: event barks (kind bark), chatter pool lines, and the lines of exchange and phone-call knots. Line by line against SPOKEN_LINES.md:
- Barks #1, #2: counted (2).
- Talk #3 to #6 (the start-knot brush-off lines in the Fatima and Graham ink): not counted. They are ordinary person-chat lines, not in an `exchanges` or `phoneCalls` knot, and the service excludes the person-chat batch by design. They are voiced by the normal mission batch.
- Pool #7 to #14: counted (8).
- Exchanges #15 to #22: counted (8).
Total 2 + 8 + 8 = 18 (Graham 9, Fatima 9, 621 characters, all uncached keyless before voicing). The 22 is the whole mission's new clip count (18 plus the 4 talk lines). SPOKEN_LINES.md now says so, with a V6 column. The rake does not miss any line that would be voiced: the 4 talk lines get voiced by the per-mission batch. PLAN.md section 8 still says V6 should read 22 and should read 18 (6 clips total at tier 1, of which 2 are in V6).

## Critical-path regression (game 7140, HEAD 44961bb1a)

Scripted run from the briefing to the debrief on a keyless server, compared with tools/playtest/m01-baseline-report.md. Steps 1 to 29 pass; verify-run.rb shows progress (13 rooms, 10 objects, 4 flags, 29 of 29 tasks). Office life (Fatima Begum, Graham Whitfield, Maya Chen's routine) blocked no step. Maya was at her desk when the run reached her.

Minors, none caused by office life:
- SOLUTION_GUIDE.md numbering differs from the baseline and has no entry for the personal safe PIN 0319, which the player infers from "my birthday (19th March)" in Derek's personal notes.
- Derek was found in the break room, not his office.
- The launch code comes only from the VM (expected under the VM flag rules).

## R1 and dialogue fixes

Fixes from BUILD_REVIEW_R1.md and DIALOGUE_REVIEW.md. Commits: c1ca339de (ink, scenario data), ee9a3723f (spoken-line docs, plan note, handover count), then the facing fix, probes and this report.

### Build review R1
- m1 (Graham sat in a desk chair at the cooler): `"seat": "stand"` added to the office_cooler affordance. Live, game 7220: Graham `_seat` false at the cooler, standing, chair 155 empty. Screenshot screenshots/cooler-in-use.png replaced (Graham and Fatima both standing).
- m2 (Fatima faced north while drinking): cause found. After the 3 s `use` lead pose (turned south to the cooler) the drink pose plays at the NPC's current direction, and `face_player` (facePlayerDistance 96, three tiles) turned her to the player standing north of the cooler. Data fix: Fatima's `facePlayerDistance` 96 to 48, so only a player within 1.5 tiles turns her; talks still turn her through `faceForChat`. Live, game 7220, three runs: Fatima plays `pose_use_south`, then `pose_drink_south`, and later `pose_drink_east` when she turns to Graham for the cooler chat (social turn, expected). Before the change (game 7215) she played `pose_drink_north`. `useFrom` was not the cause (dy -1 gives a south face point).
- n1: one sentence added to PLAN.md section 11 (Maya's `no_source` park cannot happen in normal play).
- n3: handover clip counts changed to "18 office-life clips, 22 with the 4 talk lines" (tmp/handover/M01_BUILD_HANDOVER.md, still tracked).
- n4 (KO of Maya before her first talk): game 7225, real punches, probe tools/playtest/m01-ol-maya-ko-first.mjs. Nine punches to KO in her own office. `maya_ko` true, `maya_away` false, `maya_settled` false, `discussed_operation` false, `m01_staff_alarmed` false. Her needs mode stayed idle with no job 18 s later, so no trip. Navigation hallway_east, main_office_area, hallway_east, maya_office all ok; no blocking UI; no console errors. `talk_to_maya` is optional, so the mission stays completable as in the base game.
- n5: the three V4 warnings (Fatima, Graham, Maya) remain because `E1_PROBE_PASSED` is a constant (`false`) at scripts/validate_office_life.rb:42, shared by every mission. The attack probe passed (routes above and in the Checks agent section); the validator cannot see that.
- m3 (the not_here close without a Maya reply): accepted. The plan reuses a cached line on purpose and adds no new clip, so the lint `exit-no-reply` warning stays.
- n2, n6: no change (as ruled in the review).

### Dialogue review
Applied: M1, M2, m2, m3 (and R1 n7), m4, n1, n3. Not applied: m1 (new Maya reply), n2, n4. Changed lines are listed in the final report and in SPOKEN_LINES.md and DIALOGUE_SAMPLE.md. Brush-off lines gained `#delivery` cues (Graham's two: dry, deadpan; Fatima's opener: brisk, apologetic). Ink recompiled (9 compiled, 0 failed).

### Checks after the fixes
- Validator: 0 errors, 26 warnings (unchanged). Lock and key diff against baseline_locks.json: empty.
- V6 keyless: 18 office-life clips, 18 uncached (before voicing), 589 characters (was 621).
- scripts/ink_runtime_check/maya_routes.js: all route checks passed.
- bin/test-js: 748 files passed, 0 failed before the main merge; 751 passed, 0 failed after it (R2 run, read to the last line).

## R2 fixes

Review: BUILD_REVIEW_R2.md. Keyless server on :3094 (puma 2279413, left running), headless, setFPS(20) with fixed steps on, no /tts requests, no game row edited. Games made by new-game.rb in this run: 7238 (cooler faces), 7239 and 7240 (talk facing), 7244, 7251 to 7254 (Maya reopen; 7254 carries the passing run; earlier ones were harness corrections).

- **m1 Graham facePlayerDistance 96 to 48** (`scenario.json.erb:1354`). Proof: `tools/playtest/m01-ol-cooler-face.mjs` on game 7238, now printing the distance to the player. Graham used the cooler from the beside cell with the player 2.5 tiles away and held `pose_drink_west` (towards the cooler) for the whole use, no turn to the player. Fatima used `pose_use_south` at the cooler, 1.96 tiles from the player. One thing noted, not changed: Fatima's last sampled frames showed `pose_drink_south` then `pose_drink_east` while the player did not move, which looks like her side-swap with Graham, not a turn to the player.
- **n1 talk turns them** (`tools/playtest/m01-ol-talk-face.mjs`, games 7239 and 7240). Seated Fatima (chair faces east): player placed south, chat open, frame `breathing-idle_south`. Seated Graham (chair faces north): player south-west, `idle-down-left`; player south, `idle-down`. At the cooler, mid-use: Fatima `pose_use_south` to `idle-up-left` with the player north-west; Graham `pose_use_south` to `idle-up-right` with the player north-east (and `pose_drink_south-west` to `idle-up-left` in the first run). Walking up from the east, Fatima already faced east, so that case proves nothing and the placed-south case is the proof. After the chat closes, the drink pose keeps the direction of the player (`pose_drink_north-east`), so for a moment the person drinks facing where the player stood; it clears when the use ends.
- **n2 PLAN.md**: :20 choice text now `[Don't let me keep you.]` with the old text noted as reworded; :54 says the key landed with the main merge; :151 says no render is needed because the plain hide fires first.
- **n3 baselines**: `v1_summary_base.txt` is now the summary block only (9 lines, 7 NPCs) and `positions_base.txt` has 75 rows, both rendered from base commit 9baab9c32 by the skill recipe.
- **n4**: `m01-ol-step0.mjs:16` picks `Don't let me keep you`.
- **n5 Maya reopen at the hub exit line** (`tools/playtest/m01-ol-maya-reopen.mjs`, game 7254). Chat run to the hub, "I need to keep investigating" picked, closed while the "Be careful" line was showing. Maya left her desk (`goto_target`); the player then went to the main office (maya_away true) while she was at the cooler route (5.9, 7.6). Reopen: first box "Is it safe to talk?" with one choice, "Not here. I'll come to your office.", no "Be careful" line above it, console shows the saved state restored, maya_away synced true and the hub re-entered. Harness note: `__test.interact` walks the player to the NPC, so talking while she is still in her office puts the player in her room and clears maya_away; the earlier runs (7251, 7252, 7253) did that and showed the hub, which was the probe's fault, not the ink's. The probe now waits until she is well outside her office and the player is in another room.
- **n6**: line 136 above updated.

### Checks, R2 fixes
- Validator: 0 errors, 26 warnings. Dungeon graph files unchanged.
- Lock and key diff against baseline_locks.json: empty.
- V6 keyless: 18 office-life clips (589 characters); the rake printed all 18 as cached this time, the R2 review saw them uncached.
- bin/test-js (output in `tmp/testjs-r2.txt` in the worktree, read to the last line): 751 passed, 0 failed.

## R3 and voicing

- Voicing (D97a): 22 clips in a0c4535b6, 44 files under tts_cache/m01_first_contact only. Graham 11 (Umbriel), Fatima 11 (Vindemiatrix); 8 pool, 8 exchange, 4 talk, 2 bark. Delivery tags match the ink. Maya's not_here line stays a cache hit.
- V6 on the merged tip (d82f010cb): 18 office-life clips, 0 uncached.
- Build review R3 (ea513dbc2): 0B/0M/2m/3n. Minors were documentation (this section, SPOKEN_LINES voicing status and delivery column). Notes accepted: the drink pose keeps facing where the player stood until the use ends (shared pose behaviour, cosmetic); Fatima's side swap at the cooler is the intended pair swap.
- bin/test-js on d82f010cb: 751 passed, 0 failed.

## R4 tests (m2 items; keyless server :3094, headless, setFPS 20 fixed steps; no scenario or ink edits)
Probes: tools/playtest/m01-ol-barks.mjs, m01-ol-aisle.mjs, m01-ol-tone.mjs. Games from new-game.rb in this run: 7270 to 7312. R4 doc minors m1, n1, n2, n3 are fixed in SPOKEN_LINES.md, BUILD_REPORT.md and PLAN.md.

| m2 item | Result | Evidence |
|---|---|---|
| 3 / Test 8 order and once-only | PASS | game 7272: reception to main office gives Fatima "Morning. Busy week." only (Graham none, previousRoom reception_area); hallway_east then main office gives Graham "Lost? This floor took me a month." once; five further entries (hallway, reception) give nothing |
| 3 / Test 8 KO suppression | PASS (Graham real KO, Fatima seeded) | game 7273: 9 real punches KO Graham (graham_ko true), later arrivals from elsewhere give no Graham bark; game 7274 seeded with fatima_ko and graham_ko true at creation: no bark in any entry |
| 3 / Test 8 after entropy_reveal_read | PASS (seeded) | game 7279 created with entropy_reveal_read true: no barks on entry from reception or from elsewhere. Seeded at creation, not reached by the real path (that path is test 9, PASS) |
| 5 / Test 11 aisle | PASS | game 7283: both users at the cooler (Fatima 5.62,7.87; Graham 6.88,7.68), BFS on the nav grid with their footprints blocked: south door (1.5,9) to north doors (1.5,1) 38 cells and (8.5,1) 50 cells. Player walked through both and back. Side doors (it_room, break_room) not part of the claim. Screenshot screenshots/cooler-aisle.png |
| 5 / Test 11 third user | PARTIAL | Maya as third (set thirsty with both extras using): claims never above 2 and she did not share, but she also never went for her drink in 80 s after they left (idle at post, game 7312). Capacity and the avoids list cannot be told apart, because Maya avoids both. Later diagnosed (R4_TESTS_PART3.md section 1): not dropped, parked by avoidance for the defer time (default 4 minutes). Fixed in data with `needsDeferMin: 1` on maya_chen, proved in game 7342 (retry at 60 s). Engine-side proposal recorded there, not applied. Maya alone at the cooler (game 7310): claims 1, the extras began their own trip only after she had left (t=77 s)  Superseded: this row now reads PASS; see "R5 fixes", M1 (game 7342 proof). |
| 7 / Test 14 Maya never shares the cooler | PASS | games 7282, 7310, 7312: never more than one extra beside her; extras waited while she used it |
| 1 / Test 5 room tone per room | NOT RUN | handover: probe m01-ol-tone.mjs written (mode tour), never executed; rooms and graph in the file header  Superseded: run in R4 part 2 (tone); see also R5 fixes, M2. |
| 2 / Test 6 60 s dwell | NOT RUN | same probe, mode dwell (needs-clock based, positive control lastSlot)  Superseded: run in R4 parts 3 and 4; PASS in R5 fixes, M2. |
| 4 / Test 10 music threat to noir on all_hostiles_ko | PASS | game 7345, probe m01-ol-music.mjs: threat, threat, noir (one noir, last). Evidence: R4_TESTS_PART3.md section 2 |
| 7 / Test 14 Maya away three ways, after reload; hallway_east motion light | PASS (waiting at the cooler cannot occur) | games 7349, 7357 (fresh and reload found-at-post, away at cooler, after reload) and 7356 (hallway_east light follows Maya). "Waiting at the cooler" is not reachable: with both users avoided she parks at her post. Evidence: R4_TESTS_PART3.md section 3 |
| 6 / Test 12 sis01 and sis02 gates | DEFERRED | PLAN.md:411 puts them before release |

## Handover (fresh agent)
Done: Test 8, Test 11 aisle, Maya sharing, doc minors (uncommitted until the commit below). Open: tests 5, 6, 10, the Test 14 remainder. Server: puma PID 141485 on :3094, log tmp/server-3094-r5.log, killed by `kill 141485` only. Gotchas: enterRoom sometimes fails with did-not-cross, so retry on a fresh game; a "using" phase can be a PC, match on office_cooler; create games with --unlock for each room visited. Generated tools/playtest/*-flags-game*.xml files are untracked noise.

## R4 tests, part 2 (tone)

Keyless server on :3094, PID 757041, boot log tmp/server-3094-r6.log (line 1 of the boot output: "GEMINI_API_KEY environment variable is not set"). Headless, setFPS(20) with fixed steps on, no /tts requests, no game row edited, games from new-game.rb only. Probe: tools/playtest/m01-ol-tone.mjs. Raw probe output: screenshots/tone-logs-r4p2/.

| PLAN item | Result | Game | Evidence |
|---|---|---|---|
| 1 / Test 5 room tone per room (tour), run 1 | PASS | 7319 | tone-logs-r4p2/tour-7319.txt. All 21 rooms reached. Started entries: main office office_ambient 0.8; IT room office_ambient 0.8; server room server_room_ventilation 0.4; break room office_ambient 0.35; reception office_ambient 0.35. Conference room null (no bed, as 4.1). Maya's office, the halls, storage closet, Derek's and Kevin's offices, manager office: no tone. Spot entries []. Errors []. |
| 1 / Test 5 room tone, second fresh run | NOT RUN | | No second clean tour finished in this run (see failed runs below).  Superseded: see "R4 tests, part 3 (tone)" for the later runs. |
| 2 / Test 6 60 s dwell, main office | PASS | 7323 | tone-logs-r4p2/dwell-7323.txt: needs clock advanced 60 s, lastSlot advanced 3, typing entries counts 1, 2 and 0 in the main office, spot entries []. |
| 2 / Test 6 dwell, reception and break room | NOT FINISHED | 7323 | Probe stopped by PID at the context limit; no reception or break room result. |
| 2 / Test 6 dwell, second fresh run | NOT RUN | |  Superseded: see "R4 tests, part 4 (typing)" and R5 fixes, M2 (PASS). |

Failed or invalid runs (all probe-side, see fixes):
- Game 7313 (tour, original probe): stopped at the second visit to IT room with enterRoom reason blocking-ui. Full payload not logged by the original probe, so the blocker is unidentified.
- Game 7317 (tour, after the retry patch): blocker identified as the game's PAUSED menu, element #game-menu-overlay (tone-logs-r4p2/tour-7317-failed-pause-menu.txt). The probe then threw an uncaught error and exited. Probe killed by its own PID 811542 after it stalled.

Probe fixes made in this run (tools/playtest/m01-ol-tone.mjs only; the shared m01-ol-lib.mjs is unchanged):
1. `go()` retries enterRoom once after 2.5 s and logs the full blocker id and button labels on failure.
2. The lib's dismiss() presses Escape. When a transient blocker has gone, that Escape opens the PAUSED menu, which then blocks every enterRoom. The tone probe now closes the menu with `dismissBlockingUi('Resume')` and sends no Escape. Suspected cause, not proved: the menu still appeared on its own after the server room in game 7319 and was cleared on retry, so the trigger is not yet known.
3. enterRoom calls are wrapped in try/catch so a page exception is logged, not fatal.

Open points for the reviewer:
- Assumption: the pause menu appearing after the server room is a probe effect (an Escape from dismiss()) and not an engine bug. Not checked.
- The tour and dwell each need a second clean run on a fresh game before Test 5 and Test 6 can be marked PASS.

Games in this part (new-game.rb, port 3094): 7313, 7317, 7319, 7323. Untracked flags XML files for these games were moved to tmp/delete/.

Handover (fresh agent, part 2): Done: probe fixes; tour PASS once (7319); dwell main office PASS once (7323); logs saved. Open: dwell reception and break room in game 7323 (output in tone-logs-r4p2/dwell-7323.txt, if it finished; otherwise rerun on a fresh game); second tour and second dwell on fresh games; find the trigger of the PAUSED menu after the server room (check whether the menu opens without the probe pressing Escape). Server: PID 757041 on :3094, stop with `kill 757041` only. Gotchas: monitors and sleeps return early in this environment, so poll the PID; new-game.rb needs --unlock for every visited room.

## R4 tests, part 3 (tone)

Server: keyless, :3094, PID 1121378, started by hand from this worktree with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3094`. Boot log tmp/server-3094-r7.log has the warning "GEMINI_API_KEY environment variable is not set" (one match). Headless, setFPS(20), fixed steps on. Probe: tools/playtest/m01-ol-tone.mjs. Logs: scenarios/m01_first_contact/office_life/tone-logs-r4p2/ (part 2 logs stay where part 2 put them, under screenshots/tone-logs-r4p2/).

| Item | Result | Game | Evidence |
|---|---|---|---|
| 1. Test 6 dwell, reception and break room | PASS | 7341 | tone-logs-r4p2/dwell-7341.txt. The run also dwelt the main office. Clock advanced 60, 61 and 61 s; lastSlot advanced 3 in each room. Tones: main office office_ambient 0.8, reception 0.35, break room 0.35. Spot entries none. Main office typing counts 2 and 0. Pause menu opens none. Errors none. |
| 1a. Same dwell, first attempt | VOID | 7334 | tone-logs-r4p2/dwell-7334.txt. The probe tried to walk reception to break room, which has no door (enterRoom reason no-doorway, twice), then logged a break-room dwell while still in reception. That block is not a break-room result. Probe fixed (break room is now routed through the main office). Main office and reception figures match 7341. |
| 2. Test 5 tour, second fresh run | PASS | 7333 | tone-logs-r4p2/tour-7333.txt. All 22 tour entries reached (13 rooms). Started entries match 7319: main office office_ambient 0.8, IT room 0.8, server room server_room_ventilation 0.4, break room 0.35, reception 0.35. Conference room no tone, as in 7319. Spot entries none. Errors none. Two enterRoom retries were blocked by the pause menu (see item 4). |
| 3. Test 6 dwell, all three rooms, second fresh run | FAIL (main office typing) | 7344 | tone-logs-r4p2/dwell-7344.txt. Clock advanced 61 s in each room, lastSlot advanced 3 in each, tones correct in each. The main office logged no typing change in 60 s (count stayed at 0), so the typing part of the main office check is not met. The cause is not logged: the probe did not record seated typists in this run. Pause menu opens none. Errors none.  Superseded: reruns 7361 and 7365 carry typistsNow, and R5 fixes, M2 explains the gap; Test 6 is PASS. |

Item 4. Pause menu evidence. The probe now records each time #game-menu-overlay opens (in-page poll every 200 ms, observe only). Each entry gives the room, the probe step and the time since the last Escape keydown that reached the page. "Probe Escape" below means an Escape keydown within 3 s before the open.

| Run | Opens | Opens with no probe Escape in the prior 3 s | Where the opens happened |
|---|---|---|---|
| 7333 (tour) | 12 | 0 | Six in step "go it_room" in server_room (31 to 152 ms after an Escape). Six in step "go hallway_east" in derek_office (17 to 196 ms after an Escape). |
| 7334 (dwell, void) | 0 | 0 | none |
| 7341 (dwell) | 0 | 0 | none |
| 7344 (dwell) | 0 | 0 | none |

Reading: the 12 opens came in two bursts of six, and each open followed a probe Escape within 200 ms of it. Six is the cap on the loop in the lib's dismiss() (Enter, Escape, up to six passes). My inference, not logged: clearMenu saw an active minigame with no blocking UI and called dismiss(), and each Escape reopened the menu. The branch clearMenu took was not logged, so treat this as the likely cause, not a proof. The part 2 note that the menu "appeared on its own" after the server room is not reproduced here as an unprompted open. Not covered: opens during open()'s load-time dismiss, which ran before the monitor was installed. The 200 ms poll means msSinceEsc can be up to 200 ms late.

Probe changes in this part (tools/playtest/m01-ol-tone.mjs only):
1. In-page pause-menu monitor with step labels, and a "pause menu opens" log line. Used by 7333, 7334, 7341 and 7344.
2. Dwell routes through the main office before the break room. Used by 7341 and 7344 (7334 ran before this change).
3. Dwell log adds typistsNow (window.officeTypists), to show whether a typist was seated. Added after 7344, so no run has it yet. (Superseded: games 7361 and 7365 in "R4 tests, part 4 (typing)" have typistsNow.)

Games in this part: 7333 (tour), 7334 (dwell, void), 7341 (dwell), 7344 (dwell). All from new-game.rb with --unlock for every room visited, one game per run, no game rows edited. Their flags XML files were moved to tmp/delete/.

TTS note: the probe never calls /tts, but the game client did. The server log has 25 POST /break_escape/games/<id>/tts calls (7333: 4, 7334: 7, 7341: 7, 7344: 7). Each returned 200 OK in under 40 ms with no provider call (keyless). The game sends these while NPCs speak, so the rule "never request /tts" cannot be met by the probe alone. Flagged for the user; not changed here.

Open points:
- Main office typing (item 3): rerun on a fresh game with typistsNow in the log, to tell "no typist seated" from a missing signal.
- Spot entries are empty in every run here and in part 2. The dwell PASS check used by part 2 did not include them. Reviewer to decide whether they should.
- The pause menu trigger is unproved (see item 4). Verifying it needs a probe log of clearMenu's branch. (Superseded: closed by inference in "R5 fixes", m3.)

Handover: all four runs are finished. Server PID 1121378 is stopped by PID once this section is committed.

## R4 tests, part 4 (typing)

Server: keyless, :3094, puma PID 1334858, started from this worktree with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3094`. Boot log tmp/server-3094-r8.log line 4: "[BreakEscape] Warning: GEMINI_API_KEY environment variable is not set. TTS (text-to-speech) features will be disabled." Stopped by PID 1334858 after the runs. Port 3094 is free.

Probe: the part 3 dwell logic from tools/playtest/m01-ol-tone.mjs (same routing, same 60 s needs-clock wait per room), run from a scratch copy outside the repo. It adds a sample every 10 s in each room (typistsNow, and in the main office each NPC's needs mode, atPost, job and sprite position). The repo probe was not changed. Headless, setFPS(20), fixed steps on.

Games: 7361 and 7365, one fresh game per run from `new-game.rb m01_first_contact --start-room main_office_area --unlock main_office_area --unlock reception_area --unlock break_room`. No game rows edited. Flags XML files moved to tmp/delete/. The probe never requested /tts. The server log is tmp/server-3094-r8.log (not committed).

| Game | Main office typing (60 s) | Typists seated | Grade |
|---|---|---|---|
| 7361 | Counts 1 (level 0.4), then 2 (0.6), then 0. Changes logged in the first 22 s | Fatima and Graham, both at desk cells, from 0 to 22 s (typistsNow lists both) | PASS |
| 7365 | No change. Count stayed 0 for all 60 s | None. typistsNow empty at every sample | No typist seated |

Positions in the main office (tiles, from the 10 s samples):

Game 7361:
- 0 to 22 s: Fatima at her desk cell (1.37, 5.10), mode job, job use, seated. Graham at his desk cell (7.37, 5.04), same state.
- 32 s: Fatima walking (2.72, 5.87), Graham idle at his desk cell (7.44, 5.07).
- 42 to 52 s: both at the cooler, Fatima (5.65, 7.82) and Graham (6.87, 7.71), mode job, job use, not at post.
- Maya: not in the needs snapshot. She was not registered in this run because her room was not entered.

Game 7365:
- 0 to 12 s: both at the cooler, Fatima (5.65, 7.82), Graham (6.87, 7.69), job use, not at post. Neither at a desk.
- 22 s: both returning, Fatima (5.23, 7.47), Graham (6.81, 7.16), mode returning.
- 32 to 52 s: both at their desk cells, mode idle, atPost true, job null. Standing, not seated. Fatima (1.37, 5.10), Graham (7.37, 5.04).
- Maya: not in the needs snapshot, as in 7361. Her position is not recorded.

Other rooms (not graded):
- Clock advanced 60 or 61 s and lastSlot advanced 3 in every room in both games. Tone levels: main office 0.8, reception 0.35, break room 0.35. Spot entries none. Errors none.
- 7361 reception: no typing. typistsNow listed Fatima and Graham from 32 s. 7361 break room: one typing entry, count 0.
- 7365 reception: no typing and typistsNow empty. 7365 break room: no typing, typistsNow lists both from 42 s.

Reading:
- The 7361 pass is a real typing change with two typists seated for the first 22 s. The 7365 result is "no typist seated" for the whole window, as the brief asks. It is not a FAIL.
- In 7365 both NPCs were at the cooler at the start and returned to their desk cells in idle mode from 32 s. The cause of the missing seat claim is not diagnosed here.
- typistsNow is not scoped to a room. Its entries carry room null, and the map keeps Fatima and Graham after they stop typing (7361 reception, from 32 s). A room check on typistsNow alone cannot say "seated in this room". The seated test needs the job and atPost fields with it.
- Maya's position is missing from both samples. The dwell does not enter maya_office, so her needs state is never registered. A fix needs a visit to her room or a sample from another source.

Logs: scenarios/m01_first_contact/office_life/tone-logs-r4p2/dwell-typing-7361.txt and dwell-typing-7365.txt.

## R5 fixes (docs, Test 6 verdict, Maya walk_stuck)

Server: keyless, :3095, puma PID 1507912, started with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3095`. Boot log tmp/server-3095-r5fix.log line 4 has "GEMINI_API_KEY environment variable is not set". Stopped with `kill 1507912` only; port 3095 is free. Headless, setFPS(20), fixed steps on, no engine edits, no game rows edited. Games from new-game.rb in this run: 7375, 7379 (void, the Mission Brief was still open), 7384, 7386, 7391. Their flags XML files are in tmp/delete/. Scratch probes lived outside the repo; the logs are in tone-logs-r4p2/ (idle-7375.txt, idle-7384.txt, maya-stay-7386.txt, maya-stay-7391.txt).

### M1 (docs)
BUILD_REPORT.md rows for Test 11 third user, Test 10 and Test 14 are corrected above (Maya's need parked by avoidance, `needsDeferMin: 1`, Tests 10 and 14 PASS). PLAN.md: the hallway_east light is checked, section 4.9 carries the `needsDeferMin: 1` line with the reason and the all-parks side effect (n1), and the example block shows the key. Evidence stays in R4_TESTS_PART3.md.

### M2 (Test 6 typing): PASS, with the 7365 idle gap explained
Question: after returning from the cooler, why did Fatima and Graham stand idle at their desk cells for 20 s or more (7365), when in 7361 they sat and typed at the same cells?

Two causes, neither a re-seat fault. Both are in public/break_escape/js/systems/npc-needs.js.

1. Expected cadence (normal entry). Game 7384, entered from reception with `enterRoom`, as a player would. At registration (tick 35 of the log) work is urgent (initial 60, urgentAt 70, scenario.json.erb:1320) and both start a work job at once and sit (using, 40 s: `useSeconds` 40). `used` restores 40, so the level goes to 100 (:3663-3665). Work then decays 30 per minute (`_decay`, :1548-1558) and `_select` runs on every idle tick (:1523-1530), so the next work job starts when the level crosses 70: 60 s later. Observed in 7384: returning at clock 49 s, idle at post from 50 s, level 99 falling to 71, next job_start at 109 s (60 s idle), using at 110 s. Cycle: about 40 s typing, 60 s standing at the desk cell, mode idle, atPost true, job null. Standing between jobs is the designed cadence, and the wait after a cooler trip is shorter, because work keeps decaying during the trip and a trip does not top it up: up to 60 s, not a fresh 60 s. A 60 s dwell can therefore land entirely in the idle part: that is the 7344 and 7365 pattern. Typing is audible only during the 40 s use.
2. Start-room artefact (consistent with 7344 and 7365; no levels were logged there, so this is inference). Game 7375, started with `--start-room main_office_area` as the dwell games were: the needs log shows work `urgent` at tick 2 and `parked reason=no_source` the same tick, six ticks before `home_resolved` (tick 6) for fatima_pc and graham_pc. The park is held at 71 for the default `NEEDS_DEFER_MIN` of 4 minutes (:101, `_park` :1988-2005, `_giveUpReason` no_source return :1983), unparking only on a timer at tick 962 (`unparked reason=timer`, then job_start and using for both). Nothing wakes it, because `_onRoomsLoaded` (:1270-1272) and `onDoorOpened` (:798) fire before registration or not at all when the player starts in the room. They went to the cooler at the start (the room-entry thirst mapping) and then stood at their desks with work parked at 71 and not decaying (snapshot: work 71 from 33 s to 221 s). Same positions and modes as 7365. The head-start park looks like a race: 7323, 7341 and 7361 were also start-room games and typed at once (7361 at 0 s, before any room change; the probe dwells in the main office first, m01-ol-tone.mjs:69), so the park happens only when registration runs before the PCs register. Real players start in reception and enter through a door (7384), so this does not occur in a normal run; it only affects tests that start in the main office. Evidence note: idle-7375.txt is truncated, so the quoted home_resolved and unparked events come from the live console, not the committed file; the file carries only the snapshot (71 held to clk 240, using at 241).

Verdict: Test 6 PASS (7323, 7341, 7361 typing with seated extras; 7344 and 7365 explained by the idle part of the cadence and the head-start park; 7384 shows the normal path). Not a re-seat fault. No scenario change needed.

Engine-side proposal, not applied (AC0 is editing npc-needs.js): a `no_source` park taken before the NPC's home is resolved should not last the default 4 minutes. Either wake parked needs when `home_resolved` is logged (the same call as `_wakeParked`, :2016-2031), or skip parking a need whose target is the NPC's own unresolved home object. A scenario-side workaround would be `needsDeferMin` on the extras, but that changes every park for them, so it is not applied. Tests that start in the main office should enter another room and come back first.

Seated or not while idle: the samples show mode idle and no job; the sprites were standing at the desk cells. They seat only for the 40 s `work` use.

### m1 (Maya walk_stuck with the player left in her office): does not recur
Two fresh games, 7386 and 7391, created with `--start-room main_office_area` and `--unlock` for main_office_area, hallway_east and maya_office. Real path: enterRoom to hallway_east and maya_office, first talk, "What message?" and "Tell me more", the topic to the hub, "I need to keep investigating", close. The trip started 1.2 s later (the 2 s mapping delay). The player stayed in maya_office for the whole trip (no enterRoom call). In 7391 both extras were using their PCs when she set off, the 7322 condition.

| Game | Walk to cooler | Using | Return | walk_stuck |
|---|---|---|---|---|
| 7386 | smooth path (224,-159) to (188,215) in 8 s, no stall at (212,-84) | 14 s at the cooler | back at post after 10 s | none (note: 7386 probe exited after the return, so walk_stuck is judged from the position trail; 7391 has the count, 0) |
| 7391 | log: job_start, windup, arrival at tick 186, using 187, used 247 | yes | return_resumed 278, returned_post 284 | none (count 0) |

So the 7322 `walk_stuck` at (212,-84) did not recur in two runs, and it was seen once in a run that had two failed `enterRoom` calls before it. Treat it as a harness artefact from those did-not-cross calls (as R4_TESTS_PART3.md section 1 said); no fault found.

### m2 (waiting at the cooler)
PLAN.md section 8 item 14 now says "waiting at the cooler" is not reachable, with the reason (both possible users are avoided, so she parks at her post, npc-needs.js:1975-1982).

### m3 (pause menu)
No run showed an unprompted pause-menu open. The 12 opens in game 7333 each followed a probe Escape within 200 ms, and 7341 and 7344 had none, so the probe is the cause. That is inferred from the timing; the branch `clearMenu` took was never logged.

### n4 (passed on)
Pre-existing ink typo on main, not changed on this branch: "overhead" for "overheard" at m01_npc_maya.ink:124 (a voiced line). Passed to the integrator separately.

### n2, n3
n2: the dead `if (false)` line is removed from tools/playtest/m01-ol-aisle.mjs. n3: the client's own POST /break_escape/games/<id>/tts calls to the keyless server returned 200 with no provider call (36 in this run's log, none requested by me or by the probes, which never call /tts). The game sends them while NPCs speak. No action needed.

### n1
No change needed beyond the 4.9 line above.

### needsDeferMin dropped from maya_chen
With the engine fixes for avoid parks (an avoid-parked NPC wakes when the avoided NPC leaves) and start-room no_source parks (wake when the home resolves) on main, `"needsDeferMin": 1` on Maya is no longer needed and has been removed. Probe: tools/playtest/m01-ol-maya-defer.mjs (both extras thirsty, Maya set thirsty while one uses the cooler, then timed from the cooler clearing). Three fresh games without the line (7463 to 7465) and three with it (7466 to 7468): in every game Maya parked with reason avoid (avoided fatima_begum), woke with avoid_cleared, set off 1 to 2 s after the cooler cleared, used it, and returned to her post. No difference between the two versions. Pass mark was within about 60 s.
