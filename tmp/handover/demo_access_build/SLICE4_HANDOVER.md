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
