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
