# demo_ops_recon: implementation review R1

Reviewer: implementation review, round 1 (no code changed). Branch `ops-follow1`, reviewed at fc968e4d9.

**Verdict: not clean.** 0 blockers, 3 majors, 7 minors.

## What was run

- `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb`: 0 errors, 23 warnings (as BUILD_REPORT says). The regenerated `dungeon_graph.*` is byte-identical to the committed one.
- `./scripts/compile-ink.sh demo_ops_recon`: 6 of 6 compiled, the usual END notes; the compiled `.json` files are unchanged.
- `dialoguelint.mjs` (node 22): no rule hits.
- `flock ... bin/rails test test/controllers/break_escape/demo_ops_recon_scenario_test.rb`: 19 runs, 267 assertions, 0 failures.
- Commit scope (40c4be1aa, 66cab41b0, a20316b77, 7b3e30bfe, fc968e4d9): only `scenarios/demo_ops_recon/**` and the one test file. No shipped scenario touched.
- Realism grep over the scenario, ink, PLAYTEST and test: no real advisory ids, tools or module paths. Product names (Inkvale, Tarnwick) are invented.
- No browser run of this scenario exists yet (wave 2b). Every client-side claim below is from reading code.

## Majors

### M1. Evening: Ama and the notice board send the player to the kitchen, but Zainab is still in the server room

- Evidence:
  - `scenario.json.erb:751-752`: Zainab's `act_evening` mappings are `fireOnlyWhenLoaded`.
  - `scenario.json.erb:753`: her relay fires only on `room_entered:server_room`.
  - Rooms load only when the player opens their door (`public/break_escape/js/systems/doors.js:714-720`; `scripts/validate_scenario.rb:4820-4825`).
  - Nothing in the morning or midday path takes the player into the server room. The file server is reached over the network, and the tool roll is an evening step. So when Ama's "Call it a day" fires, Zainab is not loaded and does not move.
  - Ama then says "Zainab's in the kitchen on her own" (`ink/ama_owusu.ink:127`). Her "What's next?" says "Talk to her in the kitchen" (`:89`), and the notice board says the same (`scenario.json.erb:447`).
  - The kitchen coffee is also in a room that may never have been loaded (validator warning 53).
  - BUILD_REPORT item 4 and PLAYTEST "Evening" record the relay, but the player-facing text was not changed to match.
- Effect:
  - A teacher or player who follows Ama finds an empty kitchen. The R7 opening ("alone at the kitchen coffee and will talk") does not happen as the plan says.
  - This is a likely stuck point for anyone not reading PLAYTEST.md. The card itself still works, because `card_offer` is gated only on `act_evening`.
- Fix (smallest): change the three texts so they send the player to the server room first. For example:
  - `lever_day_end`: "Zainab's in the server room. She'll want a coffee in peace once it's quiet."
  - `whats_next`: "Find Zainab in the server room, then work up to the shared drive."
  - The notice board: "talk to Zainab (server room, then the kitchen coffee)".
- Also confirm in the browser run that she reaches `kitchen_coffee` when the kitchen has not been opened before. If she does not, accept the hand-over in the server room and drop "kitchen" from the texts.

### M2. The realism feature is missing, but mission.json and the plan still promise it

- Evidence:
  - The plan's feature list for recon names "N16 Terminal and Panels with realism links" (SHOWCASE_PLAN section 1 table; rule 6; beat R6).
  - `scripts/validate_realism_skin.rb:509-512` needs every finding in the scenario, decoys included, to link a catalog entry, or none to. The catalog has three entries; the scenario has six findings.
  - The builder therefore removed every `realism` link (BUILD_REPORT "Where the plan was wrong" item 1), and the R6 beat shows banners only.
  - `mission.json:9` still says "the Terminal and Panels views with realism text". Ama's recap (`ink/ama_owusu.ink:176`) is fine.
- Effect: one of the ops-layer features this showcase exists to show is not shown anywhere, and the catalogue text claims it is.
- Fix: this needs an owner decision. Pick one:
  - (a) Accept the gap. Change `mission.json` `test_objective` to drop "with realism text", and note the gap in the plan's section 1 table.
  - (b) Write three new catalog entries for the printer's two findings and the camera decoy. Each needs human review (rule 6).
  - (c) Change the validator so that all-or-none applies per host or service, not per scenario. Then link the three `filehold_*` entries on the file server's three findings, as the plan intended (`test_ops_skin:246-262`).
  - Whichever is picked, (a)'s `mission.json` edit is needed now.

### M3. The R1 opening (hot desk window and Jun's catch) depends on a placement nobody has checked

- Evidence:
  - `jun_pc` has no `position` (`scenario.json.erb:281-294`), so the hot desk is wherever the room's desk placement puts it.
  - The jack is pinned at (3.5, 6.4) (`:315`).
  - The catch fires only when the player is within 1.5 tiles of the approach cell of Jun's home object (`public/break_escape/js/systems/npc-needs.js:3446-3463`; plan 5.1 states the requirement).
  - BUILD_REPORT item 6 and PLAYTEST R1a both say this was never render-checked.
- Effect:
  - If `jun_pc` lands at another desk, the "plug in while Jun is away" window teaches nothing, because the socket is not at his desk, and the catch never fires.
  - The notice board and Ama both say the socket is at the hot desk.
- Fix: before the browser run, render the office or dump object positions. Then either give `jun_pc` a `position` beside the jack, or move the jack to within 1.5 tiles of `jun_pc`'s approach cell. Record the measured distance in BUILD_REPORT.
- Also check the cupboard (8, 5.2) and the tool roll (7, 4.2, elevation 24): R5 and R7 depend on them, and they were never rendered either.

## Minors

### m1. Plugging in at the kitchen jack leaves "What's next?" stuck on step one

- Evidence: `plug_in` ticks only on `network_foothold_gained:hotdesk_jack` (`scenario.json.erb:468`). `whats_next` checks `not plug_in_done` first (`ink/ama_owusu.ink:58`), and "What did that show?" needs `plug_in_done` (`:46`).
- Effect: a player who plugs in at the empty kitchen (a sensible choice, and fully working, as the test at `:181-188` shows) does every later beat. But Ama keeps saying "Find the hot desk" and never offers the recap.
- Fix (either):
  - Add a kitchen mapping on Ama: `network_foothold_gained:kitchen_jack`, onceOnly, with a bark ("That works too. The log will show the kitchen port, like the visitor this morning.") and `setGlobal plug_in_done`, but no task tick.
  - Or have `whats_next` skip to the next step when `sweep_done` is true.

### m2. "I looked at the file server in the Terminal." is offered from the first conversation

- Evidence: `ink/ama_owusu.ink:44` gates the claim only on `not terminal_view_done`.
- Effect: a player can tick `terminal_view` before plugging in.
- Fix: gate it on `{ scan_printer_done and not terminal_view_done }`.

### m3. Weak or conditional assertions in the test

- Evidence and fixes:
  - `demo_ops_recon_scenario_test.rb:174`: the `where.kind` check runs only `if ... is_a?(Hash)`, so it can be skipped silently. Make it unconditional.
  - `:236` and `:370`: `refute_equal 200` accepts any failure. Assert the exact status and reason: a 404 for the invented finding, and the off-host refusal (`not_responding` or the scan's own code).
  - `:362`: the test name says the switched-off printer is not listed. The body asserts it is listed with `responding: false`. Fix the name.

### m4. The leak-scan run skips the refusal answers

- Evidence: `play_whole_run` (`test:432-488`) records:
  - only one refusal (the decoy, `false_positive`);
  - none of `not_confirmed`, `wrong_class` or `need_unmet`;
  - none of the three `shared_drive` 404s;
  - neither the kitchen jack nor the printer-off sweep and scan.
- Effect: the run shows no filter (honest), but not every answer shape that the other tests reach goes through the scanner. Refusal bodies are the likeliest place for a finding's grant or need to slip out.
- Fix: add those calls to the recorded run, each followed by `rec`.

### m5. Two refusals from the plan are not tested

- Evidence:
  - Plan 5.3 says card 3 ("Left-open settings") on the camera decoy or on `release_line` is refused. No test uses it on a decoy.
  - The Zainab hand-over test (`:292-299`) does not show that `source_npc_id: zainab_hussain` is refused for a card she does not hold, for example `card_open_settings`.
- Fix: add both as assertions to the existing R7 tests.

### m6. Agnieszka's trips to the printer (R3 opening) may not happen

- Evidence: BUILD_REPORT item 5 says her trips are "not authored beyond her work need on `printer_res`". PLAYTEST R3 still asks the tester to note trips.
- Fix: the browser run records whether she walks to `office_printer`. If she does not, either give her a print habit, or drop the R3 opening from PLAYTEST and the plan (R3's opening is not needed to reach the beat).

### m7. Small text items

- `ink/graham_whitfield.ink:27`: "My screen locks itself, mind. IT set it to twenty seconds." Graham is IT, and the PCs here are sign-in PCs with no screen habit. This is for the dialogue review.
- The validator lists missing `observations` on `printer_socket` and `office_coffee_socket` (recommended-field list). BUILD_REPORT does not list them. Add a line each, or list them.

## Checks asked for that do not apply to recon

- **The two weakened password checks** (the strong password must not fall even with its clues earned; repeated failed sign-ins counted from the row's `n`) belong to `demo_ops_passwords`. Recon has no cracker and no sign-in failures. Nothing equivalent is weakened here.
- **The `heldItem` filter** (passwords test, pending scanner fix Track A): recon has no hash keyring rows, and its leak scan filters nothing (`test:490-498`, `AccessLeakScanner.new(scenario).scan(lines)` asserted `[]`). When Track A lands, no change is needed here.

## What is right

- **Server side of every beat:** the test proves each step through the real routes and re-reads the game each time. The steps are:
  - plug and unplug, with both link rows;
  - the same 404 for a real and an invented host before the sweep;
  - the sweep's eight rows and authored addresses;
  - the printer scan;
  - check and confirm in either order, one row each;
  - the saved connection only after confirmation and never on the decoy, then the remote sign-in to Agnieszka's PC through the foothold;
  - the file server's banner and false reason;
  - `need_unmet` before the user session, then a user session as Agnieszka and an admin session as Graham;
  - the share refused after the foothold alone, after the printer credential and after the user session, and served only after the admin session, with one share row;
  - unplug ending the session while the keyring entry stays;
  - the log reader's seed rows, the run's own rows and the anomaly config;
  - no flag route.
- **Task mappings:** the R4 mappings tick on the second confirm in either order. They read `status` from the confirm answer (`network-view-minigame.js:1070-1071`; `network_ops.rb:192-194`). `use_card` reads `grant` from the use answer (`:1073`). No finding id ships in NPC data (the test at `:158-162` guards this).
- **Levers:** the coffee lever is a counter with `cooldown: 0` and no condition (Chidi `:506`, Jun `:536`). The act levers are booleans. Every window has a lever except the evening walk (M1).
- **Credentials:** passwords appear only in `creds` and the test constants. PLAYTEST names none.
- **UK English:** the writing is plain.
- **Plan 8.6 re-checks:** they are in PLAYTEST (B7 Terminal lasts, B8 Panels by default). The unopenable-container check is clean (`printer_cupboard`, `zainab_tool_roll` both `"locked": false`).
