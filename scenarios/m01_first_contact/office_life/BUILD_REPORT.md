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
- Spoken-line change: validator caps exchange bubbles at 40 characters, so SPOKEN_LINES 16, 21, 22 were shortened (38, 32, 39 characters); not voiced yet.

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
| V6 keyless | n/a | 18 clips, 18 uncached, 621 characters |

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
`env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m01_first_contact]"`: Graham 9 clips (312 characters), Fatima 9 clips (309), total 18, all uncached (621 characters). SPOKEN_LINES.md expects 22; the difference of 4 is its four "talk" lines, which live in the ink and are not counted by this task (assumed, not checked in the rake source).

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
Total 2 + 8 + 8 = 18 (Graham 9, Fatima 9, 621 characters, all uncached keyless). The 22 is the whole mission's new clip count (18 plus the 4 talk lines). SPOKEN_LINES.md now says so, with a V6 column. The rake does not miss any line that would be voiced: the 4 talk lines get voiced by the per-mission batch. PLAN.md section 8 still says V6 should read 22 and should read 18 (6 clips total at tier 1, of which 2 are in V6).

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
- V6 keyless: 18 office-life clips, 18 uncached, 589 characters (was 621).
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
