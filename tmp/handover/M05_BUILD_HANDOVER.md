# m05 office-life build handover

## Done (commit f1f2ad4b8 on plan/ol-m05)
- scenario.json.erb: officePresets; globals qdc_staff_upset, qdc_cooler_off, thandiwe_ko, niamh_ko, lisa_met; Lisa tea need + 3 mappings (lisa_met gate, 2 trip mappings); Thandiwe (6,6) and Niamh (6,4), seated, leash, needs, mappings (day breaks, couplings, goodbye seed, Thandiwe's hide x3); objects break_espresso, kettle1 (break room), corridor_cooler (corridor); credits conditions + new "A MEMBER OF STAFF" line; 6 trouble/cooler-switch mappings appended last on agent_0x99_handler; debrief ink VARs, friendly_kos and trust penalties (thandiwe_ko, niamh_ko), recompiled.
- Validator 0 errors; lock/key diff empty; V1 saved in office_life/v1_summary_build.txt.
- Left out deliberately (slice 5): storyPath for Thandiwe/Niamh, chatter pools, exchanges (ex_whispering, ex_collection, ex_heading_home) and heard_ globals. Slice 6: all Bernadette parts (NPC, bins, her mappings, bernadette_ko global, credits/debrief/trouble for her, Niamh's espresso coupling to her, ex_late_again).
- Used needsHome form { room, x, y } (schema requires room).

## Live finding so far (game 6975, break room start)
- Thandiwe sat on hospital_chair_south (north side of table 2, x 188, y 132), NOT the planned south-side chair (hospital_chair_north, y 192). Niamh then found no free chair (seatTried true) and stands at post (192,128), sprite looks like she is by the espresso. Seating needs fixing: try moving needsHome so the feet are within 36 px of the right chair foot (chair_south foot ~y162, chair_north foot ~y222; the plan's post tiles are probably wrong; try Niamh (6,5)-ish near y 160 and Thandiwe (6,7)-ish near y 222, measure with b._seat in probe3.mjs).
- No page errors. NPCs without storyPath load (lazy loader warns only); clicking them not yet tested.

## In progress / next
1. Fix seats, re-measure, then run plan checks L1-L5, E1-E3, E4 (route skip), E-L1-E-L5, reload (10.3), attack/KO probes (10.4, fresh game each), sync budget, walking pace x5, screenshots day and evening (after server_room_entered).
2. Write office_life/BUILD_REPORT.md (figures measured, pass/fail, deviations, slice 5 and 6 additions listed above) and commit.
3. Kill server: puma PID 1233537 (also in tmp/m05_puma.pid), port 3092. Unlink node_modules symlink in the worktree (it is a symlink to main's).

## Harness (scratchpad, may be cleared)
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/lib.mjs (boot, pos, st), probe1-3.mjs. Boot: do not press Escape after Enter (opens pause). Games: only 6975 made (new-game.rb m05_insider_trading --start-room break_room; needs RBENV_VERSION=2.7.8 BUNDLE_PATH=<main>/vendor/bundle PLAYTEST_PORT=3092 BREAK_ESCAPE_STANDALONE=true).

## Session 2 (commit 4106d5928 + this note)
DONE
- Seat fix (4106d5928): needsHome/position is the TILE CORNER (x*32,y*32), not its centre. Old Thandiwe (6,6)=(192,192) was 25 px from the north-side chair foot (196,167) vs 30 px from her own (196,222), so she took Niamh's chair; Niamh (6,4)=(192,128) was 39 px from the nearest foot, over NEAR_CHAIR 36, so no seat. Now Thandiwe (6,7)=(192,224), 4.5 px from foot (196,222); Niamh (6,5)=(192,160), 8 px from foot (196,167). Live (game 6989): Niamh on hospital_chair_south (188,132), Thandiwe on hospital_chair_north (188,192). Chair x,y are top-left; foot = (x+w/2, y+h).
- Validator 0 errors (34 warnings); lock/key diff empty; V1 identical to v1_summary_build.txt (after fix).
- L3 pass: Thandiwe leaves 2.8 s after Lisa's conversation closes, uses espresso 5.5 s; Niamh leaves at 8.5 s, uses 12.8 s. Away about 30 s each, 5 breaks.
- L1a FAIL (measured): Thandiwe (south side) routes up the aisle x~148, y 190 to 119; closest approach to Lisa (144,144) 21 px; Niamh 22 px. Plan wants 48. First user cell (148,106) (~(4,3)).
- L1c FAIL: second user takes the WEST beside cell (3,3), the kettle cell (116-120,104-107), 4 of 4 pair breaks, never (5,3). Plan accepts only if Lisa's trip completes with the cell taken: not yet proven (E-L run below).
- L1b pass: Lisa interact ok with pair at (4,3)+(3,3) in breaks 3,4,5 (break 1 inconclusive: minigame open after pamphlet; break 2 pair did not form). L2: pamphlet picked up in break 1 with pair using.
- E1 pass: Thandiwe hidden on server_room entry, still hidden at next corridor and break room entry. E2 pass: her chair (y192) unseated, sprite not visible. Evening torres_identified: qdc_cooler_off true.
- Attack probe (1 try each so far): KO Niamh (game from atk2): upset true, cooler_off true, niamh_ko true, she stays in break room after KO, no corridor trips. Attack Thandiwe single punch did not land in first try (probe fixed to loop until hostile); atk3/4/5 logs in tmp/handover/m05live/ may exist.
OPEN
- E3 (ten needs-minutes) result: see ev.log tail (may be unfinished). E4 (skip route), E5/E6/E7 Bernadette skipped as out of scope. E-L1..E-L5: el.log partial (first trip: Lisa at kettle (110,110) using, interact returned no-effect-confirmed, needs retry). Reload (10.3), rest of attack/KO probes (attack Niamh, KO Thandiwe, attack Lisa, KO Lisa), debrief trust -10 check, walking-pace x5 timing table, sync budget (globals and triggeredEvents deltas), screenshots (break-day, corridor-cooler, break-after-turn, break-evening are in scratchpad m05live/out/; copy into scenarios/m05_insider_trading/office_life/screenshots/), BUILD_REPORT.md.
- L1a/L1c decision: either accept and document (Lisa stays talkable), or move Thandiwe/Niamh and espresso useFrom per PLAN 2.3; then re-run L1, L2 and E-L1.
- Server puma 1233537 on :3092 still running, node_modules symlink still in worktree: kill/unlink at the very end.
Harness copies and logs: tmp/handover/m05live/ (lib.mjs needs the scratchpad paths edited; ng.sh makes a fresh game).

## Session 3: L1a, L1c, E-L1, E-L2 (commit cf5dc09db; server puma 1233537 still on :3092)
Frame note: npc positions and path points are the tile corner frame, so Lisa's post is (128,128), not (144,144). The 21 px "closest approach" in session 2 was against that post.
Cause L1a/L1c: espresso useFrom (-1,1) put the first user at (148,100), in Lisa's column; every route from the seats ran up the aisle x 148 past her. Cell (180,100) is under the espresso's collision, so the second user's right side was unwalkable and besideCell (npc-needs.js:5631) fell to the left, (3,3), the kettle cell. Fix: useFrom (0,1) at scenario.json.erb:1859 (engine reads it in approachCell, npc-needs.js:5426). First user now (180,115), second (212,111).

### Results so far
| Check | Tries | Measured |
|---|---|---|
| L1a min distance to Lisa (all samples, 60 ms) | 5 | Niamh 50, 52, 52, 52, 52 px; Thandiwe 84 px each. Excluding the last tile: 55 to 58 and 86 to 88 |
| L1c second user cell | 5 | Thandiwe (212,111) 5 of 5, never (110,110) kettle cell; Niamh first at (180,110 to 115) |
| L1b (side effect) Lisa talkable with pair using | 4 of 4 tried | ok; pamphlet pickup ok in try 1 |
| E-L1 trip: leave, trip, return (player 2 rooms away) | 5 | left post 2.8 to 8.0 s after leaving, use started 0.2 s later, npc_returned_post 12 s after use start, 5 of 5 |
| E-L1 talk at kettle (phase using, player near) | 5 (+2 earlier) | interact ok and dialogue opened and closed, 5 of 5 (earlier "no-effect-confirmed" was a conversation still open from the prime step) |
| E-L2 reload mid-trip | 5 of 5 | after reload: 1 Lisa sprite, at (128,128), idle, tea 100 each time |
| Validator | | 0 errors, 34 warnings |
| Lock/key diff vs baseline_locks.json | | empty |
| Retarget (commit d9df89e84): Lisa's tea trip to `qdc_fridge_milk` (qdc_fridge1, 36x61 at (34,160)), data only | | Fridge preset not used (type is Tiled base `qdc_fridge`), own affordance satisfies tea, useFrom (0,1); kettle1 no longer declared |
| E-L1 walk out, dwell, walk back | 5 | farthest 82 to 86 px from post at (54..60,172); left post 4.8 to 7.9 s, use 0.8 to 1.3 s later, returned 12.7 to 13.9 s after use start. Return ends at 27 to 32 px from (128,128), idle: FAILS the 8 px mark 5 of 5. The 1-tile walk-end guard (npc-behavior.js:1402 to 1416) is engine, not data |
| Route clearance (60 ms samples, per trip) | 5 | to seated-chair feet 78 to 92 px (south) and 115 (north); espresso cells 54 to 82 (first user) and 86 to 113 (second); pamphlet 78 to 107. All at least 48 |
| Talk at the fridge (phase using) | 5 | interact ok, dialogue opened and closed, 5 of 5 |
| Talk mid-trip walking out / walking back | 5 + 5 | 10 of 10 opened (out at (100..132,148..164); back at (64..71,172)); 'near' returned false once, interact still ok |
| E-L2 reload mid-walk (Lisa 30+ px out) | 5 of 5 | 1 Lisa sprite, at (128,128), idle, tea 100 after each reload |
| L1a rerun (game 7093) | 5 | Niamh min 48 to 50 px all samples, 62 to 68 px excluding the last tile; Thandiwe 79 to 85 and 90 to 96. Pass |
| Validator / lock-key diff after retarget | | 0 errors, 34 warnings; diff empty |

OPEN FINDING (not fixed, needs a call): Lisa's kettle cell (110,110) is 25 px from her post (128,128). The behaviour layer ends any goToAndStay move once within 32 px (npc-behavior.js:1402 to 1416, no arriveWithin on the walk home, npc-needs.js:4139), so after her trip she logs npc_returned_post but never walks back; she stays at the kettle cell for good (position 107 to 110 after every trip). Every try ended there. Data cannot give her more than about 18 px of return walk: moving her post south hits table 1's chairs, and the kettle cell can only be on the counter's south side. Options: (a) accept, as PLAN 2A allows "post or kettle cell"; (b) an engine change (arriveWithin for the walk home); (c) move her post and position together, a story-placement change.

### Session 4 note
Retargeted Lisa's trip to the fridge (see rows above). The walk is now visible (about 55 px out and 55 px back at walking pace, 12 s dwell). The earlier open finding is half resolved: she no longer sits at a cell 25 px from her post, but the return still ends 27 to 32 px short of (128,128) because the walk-end guard stops within one tile; ending within 8 px needs an engine change (arriveWithin on the walk home, npc-needs.js:4139) or moving her post. Probe: tmp/handover/m05live/el3.mjs (trip, talk), el4.mjs (walktalk, reload). Server puma 1233537 left running on :3092.

## Checks run 3 (build ebc45a5a0, server :3092 puma 1233537, headless, setFPS 20, fixed steps on)
Games: 7099 (KO Thandiwe), 7100 (attack Niamh), 7101 (attack Lisa), 7102 (day and reload), 7121 (walk, sync, L3, screenshots), 7122 (E4). 7105 was an earlier E4 run (no screenshot). The census helper had a bug (args not passed) that crashed the first 7102 and 7121 runs; fixed before the reruns.

| Check | Game | Result | Measured |
|---|---|---|---|
| Attack/KO Thandiwe (atk3) | 7099 | KO pass, partial | hostile after 1 punch; KO after 10 punches; thandiwe_ko true, niamh_ko false, upset true, cooler_off true; 8 s out and 15 s back: still KO at (203,181), no espresso use, no walk home seen; Lisa at (128,97) |
| Attack Niamh (atk4) | 7100 | FAIL | hostile after 1 punch; still hostile 8 s after the player left the room (at 195,126) and at +15 s (270,58); plan 10.4 says she gives up the chase when the player leaves her room |
| Attack Lisa, no KO (atk5) | 7101 | partial | hostile after 1 punch; upset and cooler_off set; not KO; no fridge trip in 15 s; still hostile 8 s out (314,49) and +15 s (281,49); no walk home measured |
| KO Lisa in front of pair | not run | | not in this session |
| E4 skip route | 7122 | FAIL | Thandiwe visible=true in break_room for 60 of 60 samples over 6 s, position (-124,195), constant. Screenshot e4-break-entry-300ms.png shows a seated figure at the table; identity not confirmed. Fallback 2.10 applies if she is on screen |
| E5, E6 | | not run | Bernadette and ex_late_again are not built (census: none) |
| E7 | | excluded | per instruction |
| Debrief trust (static) | | pass (static only) | m05_closing_debrief.ink: thandiwe_ko and niamh_ko each add to friendly_kos() and cost handler_trust 10; diplomatic line for friendly_kos > 0. Live debrief not reached |
| L3 (walk) | 7121 (and 7103 earlier, 2.8 s / 4.6 s) | pass, 2 tries | Thandiwe leaves 2.9 s after conversation close; espresso use starts 4.9 s |
| Five-try table | | incomplete | only L3 and E-L2 (earlier) have more than one try; L2, L4, L5, E1 rerun, E2, E-L4, E-L5 not repeated |
| Day reload | 7102 | pass | Lisa (128,97) seated false, Niamh and Thandiwe seated at chairs, one behaviour each, errors none |
| Evening reload | 7102 | NOT REACHED | server_room_entered stayed false after my route (corridor, hallway, server room); cause not investigated; evening-reload.png is not an evening shot, not for the review |
| Night reload | 7102 | partial | torres_identified (set in memory) and qdc_cooler_off survived reload; Thandiwe seated, not hidden (evening never ran, so not a valid check) |
| Sync budget | 7121 | pass | 4 sync_state flushes in 5 min, 6,892 bytes total: 6,170 first (full seed: globalVariables, notes, phoneState, timedMessages), then 448 and 2 small deltas (triggeredEvents, currentRoom, clock) |
| Lisa back from trip | 7121 | FAIL vs 8 px mark | 22.5 px from (128,128) at return + 1.5 s, at (109,116); one reading |
| Espresso pair screenshot | 7121 | pair not at espresso | Niamh (218,80), Thandiwe (180,79) when shot; re-shoot needed |
| Cooler pair | 7121 | pass | two corridor_cooler use starts; Niamh (445,61), Thandiwe (418,61) |

Screenshots (scenarios/m05_insider_trading/office_life/screenshots/): day-break-both-seated.png, espresso-pair.png (caution: not at the espresso), corridor-cooler-pair.png, lisa-fridge.png, lisa-back-from-trip.png. Not copied: the evening break room with Thandiwe gone (no valid evening state yet).

## Session 5 (checks run 4)
Done: Haiku claims judged (see BUILD_REPORT.md); evening and night reloads pass; L3 five tries (try 5 output not read back); espresso pair re-shot; evening shot with Thandiwe gone; BUILD_REPORT.md written and committed. Harness copy: scratchpad h/ (lib.mjs, run/*.mjs; reach evening with ng.sh --start-room main_corridor --unlock server_hallway --unlock server_room --unlock break_room; night with extra --set found_door_log, torres_suspected, found_upload_schedule, found_torres_journal, door_log_reasoned, patricia_ko true, then phone Agent HaX naming route in rl.mjs).
Open: KO Lisa in front of pair; live debrief trust (needs mission_complete); E4 skip-route 1 s pop decision; server puma 1233537 on :3092 STILL RUNNING and node_modules symlink still in the worktree: kill PID 1233537, confirm port clear, unlink node_modules at the very end.

## Session 6 (KO Lisa and debrief checks)
Both checks PASS, written up in BUILD_REPORT.md. Probes: m05live/kolisa.mjs, kolisa2.mjs, deb.mjs. Debrief needs --carry-npc closing_debrief_trigger, --complete-task submit_flag1..4, writeGlobal import for mission_complete, and "End the mission now" on the ending-check overlay. Remaining: kill puma 1233537, unlink node_modules.

## Slice 5 session (commit 8bd7d2c93 on plan/ol-m05)
DONE
- Ink: ink/m05_npc_thandiwe_moyo.ink/.json (opener, two choices, goodbye; hub_quiet pattern so dialoguelint blank-reentry is clean) and ink/m05_npc_niamh_doherty.ink/.json (same shape, plus knots ex_whispering, ex_collection, ex_heading_home, VAR heard_* declared). Compiled with bin/inklecate. inkcheck and loopcheck clean.
- scenario.json.erb: storyPath and currentKnot on both, chatter pools (8 lines each, coffee and cooler, as SPOKEN_LINES.md), Niamh's exchanges in plan order, globals heard_ex_whispering, heard_ex_collection, heard_ex_heading_home = false.
- Validator 0 errors, 27 warnings (was 29; the two "chatter has no lines" warnings are gone; the only new dialogue items are the dialoguelint delivery-note false positive on the hub_quiet conditional, same as m02 Hodan). lock_key_diff empty.
- V6: 27 clips (Niamh 13, Thandiwe 14, all uncached). = 16 pool + 11 exchange lines. Plus 6 conversation lines (not counted by V6) = 33 = 42 minus Bernadette's 9 (4 pool, 3 exchange, 2 conversation), which wait for slice 6.
- Live (keyless :3092, game 7241 start-room break_room, headless): both newcomers seated (niamh hospital_chair_south, thandiwe hospital_chair_north): interact ok, no "Failed to load conversation", opener shown, choice, close, reopen shows the opener again, 0 page errors. Both seated chats show the same background image (espresso and kettle view, screenshots scratchpad m05live/out/seated_*.png), so n2 reads fine; which of the two split files it is was not read out of the DOM.
- Deviations from SPOKEN_LINES.md: none in the lines. Added two player choice labels per conversation ("Just looking around." / "I'll leave you to it." for Thandiwe; "Who should I talk to around here?" / "Go on, I'll let you work." for Niamh), and no narrator lines. The 3 conversation lines are split: opener, one optional middle line, goodbye.
NOT DONE
- bin/test-js: started in background, was cut short when node_modules symlink was unlinked mid-run (scratchpad testjs.txt had only PASS lines, no EXIT). Rerun with the symlink and read the output file to the end.
- Live: talk at each machine (while using espresso and cooler), each exchange plays once and never again (heard_ globals), pool line at espresso and at cooler, reload mid-day. The harness is in scratchpad m05live (lib.mjs, ng.sh, talk.mjs; copy of tmp/handover/m05live). Needs: __test.needs.log() shows exchange_started, exchange_heard, chatter entries; trigger with a Lisa conversation close then needs.set('thandiwe_moyo','caffeine',15); badge exchange needs server_badge_obtained via session-start.sh --unlock/--set.
- BUILD_REPORT.md "Slice 5" section (short one added in the commit after this note); DIALOGUE note in walkthrough.
- Server was killed (PID 3630615) and symlink unlinked. To restart: ss check :3092, the section 1 command in measurement-recipes.md, ln -s main node_modules.

## Slice 5 checks and dialogue fixes (commit fb917e748)
DONE: pool-bubble "fail" was a probe mistake (read `saying`, which is mutters only; pair chat is `_talking(id)` and `npc_chatted:<objectId>`). Both pools play at espresso and cooler, 2e passes, dialogue fixes M1 and m1 to m4 applied. Validator 0 errors, 27 warnings; lock diff empty; V6 27; bin/test-js 751/751 (scratchpad m05live/testjs2.txt). Server (PID 4024373) killed, symlink unlinked.
NOT DONE: m5, m6, n1 to n4 (not briefed). Bernadette lines wait for slice 6.

## Slice 6 session (commit 7c4adf286 plus one follow-up; server puma PID 468072 on :3092 STILL RUNNING; node_modules symlink still in the worktree)
DONE
- Build (7c4adf286): Bernadette NPC (hidden, three shows plus break mapping, voice Vindemiatrix provisional, spriteTalk = talk_init.png, visemes), break_bins object, Niamh's espresso coupling, trouble mapping npc_attacked:bernadette_lyons (in the middle of the trouble block, not last), globals bernadette_ko and heard_ex_late_again, credits conditions and the debrief ink (VAR, friendly_kos, -10 trust), ink/m05_npc_bernadette_lyons.ink/.json (opener, one choice, goodbye, ex_late_again). Debrief ink recompiled. Commit also swept in the already-staged tmp/handover note.
- Follow-up (uncommitted at time of writing, then committed): fourth show mapping on Bernadette, door_opened with connectedRoom break_room (E5 skip route showed her hidden then popping at room_entered; with this she is V from the door open, 0 hidden frames).
- Static: validator 0 errors, 29 warnings (new: the onceOnly/plain room_entered:break_room pair on Bernadette, intended); lock_key_diff empty; V1 diff: only Bernadette added; V6 = 34 clips (Bernadette 6, Niamh 14 incl. her ex_late_again reply, Thandiwe 14), all uncached = 27 + 4 pool + 3 exchange; with 8 conversation lines (6+2) = 42. bin/test-js: output in scratchpad testjs6.txt (check it ends with EXIT=0 and no FAIL; at time of writing it showed PASS lines only, tail not confirmed).
- Live (:3092): E5 skip route pass after the door_opened show (game 7287). Day game 7288 (ev.mjs): Bernadette hidden 6 of 6 samples by day; after server_room_entered she is visible; on return she is at (176,195) with _seat TRUE (she sat in a chair, plan says standing: CHECK which chair, maybe Thandiwe's vacated hospital_chair_north, post (5,7) is next to it), then went to break_espresso (goto 1 s after entry, using at 3 s), and heard_ex_late_again became true within 30 s. Bins trip not yet seen. No page errors. Visemes request check and talk checks not run yet. ev.mjs crashed at its final log line (e.d is an object; use JSON.stringify), harmless.
NOT DONE (all of it needs a fresh agent)
1. Seat finding: confirm and, if she sits, move needsHome or add seat avoidance so she stands (plan 2.13), or accept and say so. Measure bins use cell (7,6) vs vending machine, and the bins trip (E7).
2. Talk at post, at bins, at espresso: no "Failed to load conversation", bernadette_lyons_visemes.png and .json both 200 (page.on response in ev.mjs), 0 /tts requests.
3. Exchange once only (second meeting after reload, needs.log), reload evening and night, KO with a real punch (trouble reaction, credits line), diplomatic debrief run (R1 n3), E3 ten-minute rerun on the final build, screenshots into scenarios/m05_insider_trading/office_life/screenshots/ (existing shots in scratchpad m05live/out/s6-*.png: s6-skip-entry-300ms, s6-skip-evening-break, s6-day-break-room, s6-evening-break-room), BUILD_REPORT.md "Slice 6" section, SPOKEN_LINES unchanged.
4. Kill PID 468072 only, confirm :3092 clear, unlink node_modules.
Harness: scratchpad s6/ (skip.mjs, ev.mjs, ng.sh), lib at tmp/handover/m05live/lib.mjs. Games: 7284 to 7288.

## Slice 6 session 2 (handover at ~150k tokens; server puma PID 468072 on :3092 STILL RUNNING; node_modules symlink still in worktree)
Scripts and logs: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/s6b/ (seat.mjs, bins.mjs, talk.mjs, ex.mjs, ex2.mjs, deb3.mjs, lib2.mjs [NOCLEAR=1 keeps the opening briefing open], ngd.sh = day game in break_room with route unlocks). Screenshots in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m05live/out/s6-*.png (new: s6-bernadette-bins, s6-day-bpost, s6-talk-espresso/post/bins, s6-bernadette-ko).
DONE
1 Seat: she took break_room_hospital_chair_north_21 (x168 chair, chair top-left (168,192)), NOT Thandiwe's x188 chair. Fix: "seated": false on bernadette_lyons (seatPreference returns stand). Committed (scenario.json.erb, one line). Proof game 7298: stands at sprite (170,194) = feet (170,225), home is (160,224); _seat false. Parking after a trip is within a tile of home (sprite about (156,166-170) = feet about 200, ~25 px short), same engine tolerance as other standing NPCs; accepted, say so in the report.
1b Bins (game 7300, 330 s): first coffee trip at once (mapping), returns about +40 s, bins trip goto at clock +150 s (plan: about 2.5 needs-minutes), uses at sprite (246,181) = feet (246,212) = cell (7,6), south of vending collision (ends y 196, 16 px clear), 10 s use, tidy 29.7 to 99.97, walks back. Screenshot s6-bernadette-bins.png. Lisa's tile not crossed (her route is west of x 190).
2 Talk (game 7307): at espresso, at post, at bins all open, no "Failed to load conversation", ui.portraitRenderer.visemeSheet true (7 columns), spriteVisemes = bernadette_lyons_visemes.png, png and json both 200. NOTE: the client itself requests /tts when a line shows and the keyless server answers 503 (several); the "never request /tts" rule cannot be met by the engine, later scripts abort /tts with page.route (ex.mjs, deb3.mjs). Report it.
3 ex_late_again (game 7308 id in s6b/gid_ex.txt): heard first meeting (exchange_started and exchange_heard, once); second meeting same session no log entries (pair not verified); after reload heard=true persisted, both used the espresso together, pool chatter npc_chatted played, no exchange (ex2.log). PASS.
5 KO real punch (game 7316, ten punches): qdc_staff_upset true after first punch, bernadette_ko true, others calm, credits show "A MEMBER OF STAFF: HURT, ON YOUR ACCOUNT", debrief ran, end trust gv 30 from 50 (this run had approach unset; need a no-KO comparison: see d4no.log).
IN PROGRESS when stopped (background node runs, will finish on their own, read the logs): d4ko.log (game 7324, diplomatic briefing played via "I'll read the room when I get there.", trust 65 after briefing, then KO Bernadette, then debrief) and d4no.log (game 7325, same without KO). Expect: KO run prints "You said you'd read the room. Then you put people in it on the floor."; no-KO prints "You did." (or the halloran line); trust differs by 10. The route to server_room hit a blocking-ui phone bark ("npc-bark--phone", HaX "You're in...") at first try; deb3.mjs retries after clear(). If either log crashed, rerun: ngd-style game with --carry-npc closing_debrief_trigger --complete-task submit_flag1..4 --unlock main_corridor server_hallway server_room break_room, then NOCLEAR=1 node s6b/deb3.mjs <gid> <1|0>.
NOT DONE
4 Reload evening and night (never pops in front of the player): sample visibility in the first frames after reload with the player in the break room; night: writeGlobal torres_identified true after server_room_entered, then reload. (Note: break room world coordinates differ when the game starts elsewhere, Bernadette read (-160,65) at 2.5 s after entry in the reception-start game while visible true: check that she is placed at her post, not a pop at the origin; seat.mjs games starting in break_room were fine.)
6 read d4ko.log/d4no.log result for item 6.
7 E3 ten-minute rerun (600 s, sample rooms of Niamh/Bernadette, corridor empty, cooler off, frame time, request body sizes), console errors.
8 bin/test-js (output to file, read to the last line); validator 0 errors and lock/key diff empty (commands in BUILD_REPORT.md of earlier slices; not run this session after the one-line data change).
Housekeeping: copy screenshots to scenarios/m05_insider_trading/office_life/screenshots/, write BUILD_REPORT.md "Slice 6" section, kill PID 468072 only, unlink node_modules.
Reminder: a pkill attempt was blocked by the permission system; never pkill.
