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
