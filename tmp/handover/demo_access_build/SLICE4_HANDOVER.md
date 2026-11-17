# Slice 4 handover (demo_access_tour office life): built and committed, live check NOT done

## Done (commit 017da0655, scenarios/demo_access_tour only)
- scenario.json.erb: cake in startItemsInInventory (spec snippet; "social" dropped from satisfies because the validator warns nobody has it); scenario chatter pools coffee, cake ("Who's the cake from?" included), news_cake, grumble_gone; cake_servings 2; coffee_station gets chatter "coffee".
- Thandiwe: needsHome thandiwe_laptop, hunger/caffeine/work per plan 2.4; mappings: rota board (Coffee rota, caffeine 10, cooldown 30000), stop 15 work nudge (global_variable_changed:staff_twin_up, onceOnly, fireOnlyWhenLoaded) plus a room_entered:open_plan fallback (cooldown 600000) that reads staff_twin_up.
- Yasmin: needsHome yasmin_pc, hunger/caffeine, rota board mapping.
- Julian: needsHome is a kitchen coordinate {room kitchen, 1.7, 6.5} (his standing spot), hunger 95 / 0.1 per min / urgentAt 5 (never tempted, never urgent).
- ama_phone: P6 mapping (magnet_placed:cake, roomId !== open_plan, cooldown 30000, sendTimedMessage targetKnot hint_cake). ink/ama_phone.ink gained knot hint_cake (slice 5 owns the phone ink; keep or replace). Ink compiles (7 files, 0 failed).
- Validator: 0 errors, 10 warnings. V8: onceOnly 2/10, magnet servings 1/2.

## Open
1. Delphine NOT given needs, deliberately: a tracked owner at post makes reception_pc answer "Delphine is using this PC" (unlock-system.js pcUserAt, interactLoginPc step 1), which would block stops 5 and 14. Her "owner never leaves" warning therefore remains (plan 2.4 says no needs). Lead to decide; the three other owner warnings are gone. Julian's "placed in kitchen, PC in partner_office" warning also remains (plan keeps him in the kitchen; his PC is behind the card-locked door and is reached by Connect).
2. Remaining new validator warnings: thandiwe/yasmin caffeine target coffee_station is in the kitchen (lazy room load: nothing simulates unloaded rooms). THE LIVE CHECK MUST SHOW whether the rota board sends them to the kitchen when the kitchen has never been visited. If not, that is an engine matter: stop and report.
3. Live check not run: cake drops in open_plan empty both desks (and P6 text when dropped in reception); rota board; scoped corpus run (PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1 under flock); screenshots to tmp/handover/demo_access_build/screens4/ (git add -f).
4. validator-office-life.test.mjs:442: add the scenario to the list (plan slice 4); not done.

## Live setup (running now)
- Keyless server on :3099 from this worktree (script in scratchpad start3099.sh; needs RBENV_VERSION=2.7.8 and BUNDLE_PATH=<main checkout>/vendor/bundle). Stop it with its pid file tmp/pids/server-3099.pid when done.
- Game 7481 created, headless session 7481 open (tools/playtest/cmd.sh 7481 '...'), bootstrap done. Stop with tools/playtest/session-stop.sh 7481.
- Drive pattern: tools/playtest/lab-needs-smoke.mjs (Playwright, setFPS(20) with fixed steps, __test.enterRoom, __test.inventoryAct('cake','Drop here') as in npc-carry-reload-proof.mjs:179). Read npcNeedsSystem.getState(id) for atPost/mode; magnet via _servingsLeft('cake').

## Live check results (continuation agent, 2026-11-17)
Evidence in tmp/handover/demo_access_build/screens4/ (JSON dumps, session logs, screenshots). All sessions and the :3099 server are stopped.
- Cake in open_plan (game 7488/7491/7492 runs, cake_open_plan_run.json): Thandiwe and Yasmin both leave their desks within about 2 s of the drop (goto_target:cake, using at the conference-table end, about (50,36)), eat, return to post (returned_post). Desks empty about 20 s of needs clock. While Thandiwe is away her laptop opens straight to the desktop (cake_pc_while_away.png); with her seated at post it answers "Thandiwe Moyo is using this PC." (pc_while_seated.png).
- Chatter: pairing works (_chats cake). Heard only when the player is near and in line: dropped with the player about 14 px from the cake they said "Go on, just a small slice." and "Whose birthday is it?" (cake_chatter_heard.json). With the player 50-100 px away the turns were pictures only (unheard). One drop voices about 2 of the 4 pool lines, so "Who's the cake from?" is not guaranteed each time (minor, scenario/data).
- P6 (drop in reception, game 7500): magnet_placed reachable [] then Ama's phone message "Take the cake through to the open plan, ..." arrives (badge 2; p6_reception_drop.json, p6_ama_hint_phone.png).
- Coffee, kitchen never visited (game 7481): rota board fires (level_set caffeine 10) then both are parked no_source; they stay at desks for 100+ s. Entering the kitchen wakes them: both walk to coffee_station, drink, return (coffee_unvisited_kitchen_poll.txt, coffee_kitchen_entered_poll.txt). Cause: engine only sees loaded rooms; scenario fix options (not built): (a) a coffee source in open_plan (move or add a machine there), (b) make the route visit the kitchen.
- Stop 15 nudge: both paths fire. Loaded (player in open_plan when staff_twin_up set): level_set work 10, job_start/using thandiwe_laptop (nudge_direct_loaded.json). Fallback (set in reception, then enter open_plan): same (nudge_fallback_room_entered.json). Global set via window.stateSync.writeGlobal, not the real rogue AP route.
- Validator test: demo_access_tour added to the V2/V4/V5 corpus list (test/js/validator-office-life.test.mjs line 442); 33/33 pass.
- Corpus: scoped payload_scan fresh + opened run was started under flock in the background (output /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/tasks/bkk62kdfr.output); result not yet read when this note was written. Re-run if the file is gone.

## Review-fix pass (cd32aa2de, 623b8f10f and the commit after)
- M1: second coffee machine `coffee_station_open_plan` (coffee_station1, north wall x 7.0, y 1.4, queue running south) in open_plan; kitchen machine kept. Live, kitchen never visited (game 7521): rota board, both leave at once, drink, return to post; their desks are empty meanwhile. Yasmin's PC opens to its sign-in while she is away (PasswordMinigame). Thandiwe's laptop click returned "acted" but opened nothing in the last run (a confirm dialog from the rota board was in the way earlier); the slice 4 run showed it opening straight to the desktop. Evidence: screens4b/.
- m1: Julian has no needs or needsHome. m2: plan 2.5 notes the dropped "social". n5: plant wording.
- Chatter: pools are per-NPC shuffle bags with no order or first-line option, so "Who's the cake from?" cannot be guaranteed from data. Left as is.
- Validator 0 errors; validator-office-life.test.mjs 33/33; scoped corpus 23 runs, 1 failure (the known m09 stale exception only). Server on :3099 stopped.
