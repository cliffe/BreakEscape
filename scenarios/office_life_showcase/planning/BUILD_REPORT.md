# Office Life Tour: build report

## S1 (skeleton)

### Built

- `mission.json` (display name "Office Life Tour", no scoring) and `scenario.json.erb`: office and kitchen rooms, objects, the cast with needs, the two globals S1 uses (`office_coffee_off`, `jun_badge_left`), the three aims and eight tasks as structure (nothing ticks them yet), no mission conclusion and no music block.
- Six inks, compiled with no warnings: Ama (start, hub, reopen, exit) and five-line staff inks (start, reopen, one topic with a two-line answer, exit).
- Desk machines in sims order (`chidi_pc`, `jun_pc`, `graham_pc`, `agnieszka_laptop`) so each owner claims the right desk. The office coffee machine has `offWhen "office_coffee_off"`; the kitchen machine is off while the office one is on. The socket lever is in place.
- Validator: 0 errors, 17 warnings, all expected (cross-room need targets, a built-in `cooler` picture-chat note, three recommended-field notes). `test_needs_sims` is untouched, and the engine is unchanged.
- Setup note: a `missions` row for `office_life_showcase` was created in the dev DB, from `mission.json` via rails runner, so that `new-game.rb` could make games. It is a mission row, not a game record, and it resolves once the scenario lands on main.

### Proof

Keyless server on port 3094 (boot log shows the missing-key warning), headless with `setFPS(20)` and fixed steps on, `/tts` aborted. Every game came from `new-game.rb` in its run.

| Check | Result | Figures | Game |
|---|---|---|---|
| Validator | PASS | 0 errors, 17 expected warnings | n/a |
| `atPost` for all five staff | PASS | all at their own post by about 7 s of game clock (Zainab finishes pushing her chair at about 7 s) | 7474, 7485 |
| W0 free cells west of Ama | PASS | 5 free cells (x 112 to 151), or 4 excluding the desk-edge cell; at least 2 required | 7474 |
| First coffee walk | PASS | Chidi: leaves at 50.8 s, uses the machine 53.8 to 65.8 s, back at post 77 s; no overlap, no stall | 7475 |
| W1 | PASS | zero overlap samples for all five NPCs (figures below) | 7475, 7482 |
| W2 | PASS | Jun back at post in 6 s, no wait (figures below) | 7482 |
| Whole-room renders | PASS | both rooms framed in full | 7490 |

Positions (sprite, feet about sprite y + 31): Chidi (228, 98), Jun (89, 137), Graham (92, 99), Agnieszka (44, 143), Zainab (76, 184). Jun's post is `jun_pc`, feet about (92, 164); (3, 6) is only his start tile (96, 192).

### W0, W1, W2

- W0 (game 7474, before any walk): grid cell 8 px. Row y 144, local x: 96 and 104 blocked (desk), 112 to 144 free, 152 to 192 blocked (Ama's body plus padding), 200 free, 208 and 216 blocked (east desk). So 5 free cells west of Ama, and 1 free cell east of her (x 200 to 207).
- W1, east lane (game 7475, office coffee on): Chidi's walk goes down x 204 (body x 193 to 213), 7.3 px from Ama's body on the way out (52.0 s) and 9 px on the way back (70.5 s). About 85 px/s, direct, no overlap, no stall.
- W1, west door (game 7482, kitchen opened first, coffee off at the socket): Chidi's trips at 0:50 and 3:34 run along y 93 above Ama, 10 to 17 px clear. Jun's trip at 3:00: (89, 137), (104, 133), (114, 110), (84, 93), door, minimum gap to Ama 42 px. Graham's cooler trip at 160 s, minimum gap 60 px. Agnieszka's mug run at 20 s and cooler trip at 160 s, minimum gap 39 px. Zero overlap samples for all five.
- W2 (game 7482): Jun's return from the kitchen starts at 200.0 s, (-212, 208), (-4, 53), (66, 75), (103, 109), (92, 133), post (89, 137). `atPost` true at 206.0 s (6 s). Speed 50 to 80 px/s throughout, no wait, minimum gap to Ama 53 px (he arrives from the north-west, never beside her).

Other games: 7476 (lever before the kitchen was opened), 7486, 7487, 7489 (renders, earlier framing).

### Observations

- The kitchen must be loaded before the coffee lever sends anyone west. With the kitchen unloaded (game 7476), Chidi's caffeine job parks `no_source` for the whole 8 minutes and nobody walks to the west door. With the kitchen opened first (entered and left), the same lever sends Chidi and then Jun west. Lever recipe: `moveToNear('office_coffee_socket')`, `interact('office_coffee_socket')`, click `.game-confirm-ok`.
- Chidi pauses about 3.5 s after using the machine before his return starts moving.
- The east lane is open, not closed (see W1). PLAN section 2 and section 11 now say so.
- Only Chidi walks to the office coffee in S1; the queue arrives in S2.

### Screens

`scenarios/office_life_showcase/planning/screens/`: `s1-office-start`, `s1-first-coffee-walk`, `s1-kitchen`, `s1-west-door-walk`, `s1-office-after-kitchen`, `s1-office-posts` (Zainab still pushing her chair), `s1-office-room` and `s1-kitchen-room` (whole-room renders, camera zoom 1, game 7490).

### Scripts

`tools/playtest/showcase-s1-probe.mjs` (phases state, w0, post, homes, watch, lever, render), `showcase-s1-analyse.mjs`, `showcase-s1-path.mjs`.

## S2 (morning)

### Built

Line numbers are in `scenarios/office_life_showcase/scenario.json.erb` unless stated.

- Scenario pools (`:14`): `coffee`, `cooler` (the new sandwich-place line replaces the sims printer line), `grumble_off`, `grumble_gone`. `cake` and `news_cake` wait for S3.
- Per-NPC pool extras P1 to P8: Chidi and Jun `coffee` (`:221`, `:244`), Graham and Agnieszka `cooler` (`:270`, `:298`). Zainab has none.
- `office_coffee` (`:151`): `chatter: "coffee"` and `overhearRadius 200`. Queue capacity is the two queue cells already in S1 (`dx -1` and `dx -2`), so Chidi uses it, Jun is second and Zainab third. The preset capacity is left alone, as in sims.
- Couplings: Jun on `npc_left_post:chidi_okeke` (`data.targetId === 'office_coffee'`, cooldown 30000, caffeine 10); Zainab on `npc_queued:office_coffee` (`data.npcId !== 'zainab_hussain'`, same cooldown and set); Graham on `npc_left_post:agnieszka_duda` (`data.targetId === 'water_cooler'`, social 10).
- Kitchen coffee `offWhen {office_coffee_off: false}`, the socket lever and `office_mugs` (`:188`) were already in S1 and are unchanged.
- Exchange: Graham's `exchanges` entry (`:292`) and the `exchange_cooler_chat` knot (X1 to X5) at the foot of `ink/graham_whitfield.ink`. Speaker prefixes are the display names ("Graham Whitfield:", "Agnieszka Duda:"), because the validator resolves speakers by id or display name only.
- Ama's `eventMappings` (`:198`-`:218`): B1 (`room_entered:office`), B2 with `see_queue`, `hear_queue_chat` (condition `data.overheard === true`), B3 with `see_coffee_off` (condition `data.reason === 'off'`), `hear_cooler_exchange` on `npc_exchange_heard:exchange_cooler_chat`, B11 on `npc_picked_up:office_mugs`, and `kitchen_seen` on `room_entered:kitchen`.
- Globals declared: `kitchen_seen`, `heard_exchange_cooler_chat` (`:28`).
- Ama's ink (`ink/ama_owusu.ink`, recompiled): hub choices "What am I looking at?" (once, A3 A4), "What should I try next?" (morning only: A5, A6, A8, A7 in that order) and "What was that at the cooler?" (gated on `heard_exchange_cooler_chat`, A13 A14). `kitchen_seen` is not read by any ink yet; the lunch gate that reads it is S3.

### Plan wording changes

- Each bark and its task share one mapping (B2 with `see_queue`, B3 with `see_coffee_off`), marked `onceOnly`. Two mappings on the same event, one `onceOnly`, trip a validator warning; a task completes once anyway, so the plan's "no task mapping uses onceOnly" is not needed for these two. `hear_queue_chat` and `hear_cooler_exchange` have no `onceOnly`.
- The plan did not say that exchange knots must name speakers by display name or id.

### Validator

`ruby scripts/validate_scenario.rb scenarios/office_life_showcase/scenario.json.erb`: 0 errors, 17 warnings (S1 baseline 17).
- Gone: the built-in `cooler` picture-chat note on `water_cooler` (the pool now has lines).
- New: `grumble_gone` has one line that nobody can speak yet. It is spoken when someone turns back because a magnet (the cake) ran out, which arrives in S3. Left in as the plan lists it under S2.
- One suggestion (not counted): `kitchen_seen` is set but nothing reads it until the S3 lunch gate.
- V8 sync budget: heard_ globals 1/8, onceOnly office-life mappings 3/10, small keys 14/64.
- Ink compiles with no warnings; no em or en dashes in the new ink.

Not proved live: this is the build and validator only.

## S2 proof (live, keyless server on :3094)

Method: headless, `setFPS(20)`, fixed steps on, `/tts` aborted. Times are the needs clock in seconds (m:ss). No `__test.needs.set` was used in any run. The only `__test` calls were player moves, `enterRoom` for the kitchen (the player opening the west door) and the socket interaction. A recorder in the page logs world emits, bubbles, barks, globals, task status and job changes; dumps are in `tmp/s2/` (gitignored).

Games (all printed by `new-game.rb` in this run): 7507 (run A, timed), 7508 (run B, kitchen at 0:30), 7509 (run C, kitchen shut to 3:30), 7510 (run D, socket lever), 7513 (machine states), 7515 (viewer in the kitchen, T5). First timed run 7502 was a dry run (the lever was pulled too late to catch a queue) and is not counted.

### Proof table

| Check | Result | Figures |
|---|---|---|
| Timed run, four morning tasks, no nudge (A, 7507) | PASS | `see_queue` 0:53, `hear_queue_chat` 0:56, `hear_cooler_exchange` 3:19, `see_coffee_off` 3:35; all four `completed` at 4:03 |
| First coffee queue (T4) | PASS | Chidi leaves 0:52 and is `using` at 0:55; Jun (place 1) and Zainab (place 2) queue at 0:53; same in B (0:51), C (0:53), D (0:52). Order Chidi, Jun, Zainab |
| Queue chat (T5) | PASS | Chidi's line "Who keeps taking the mugs?" 0:56, Jun's "Third one today. Don't judge." 1:00; never Zainab. With the viewer in the kitchen (F, 7515) the lines play with `overheard:false` and `hear_queue_chat` stays `active` to 2:05, while `see_queue` still ticks |
| Second coffee run (T6) | PASS | A: queue at 3:32 (Jun place 1, Zainab place 2) with the kitchen open since 1:48; C: 3:30. Two `npc_queued:office_coffee`, no `kitchen_coffee` target |
| Door opening to mug pickup | PASS | A: door opened 1:48 (player), Agnieszka leaves for the tray 1:49, pickup 1:51 (B11 fires, toast because the viewer is in the kitchen); B: door 0:32, pickup 0:35; D: door 0:05, pickup 0:08; C: door 3:32, pickup 3:35. About 3 s after the door in every run. Agnieszka heads back at 2:02 (A) |
| Cooler exchange (A) | PASS | Graham and Agnieszka leave 2:42; lines at 2:55 (Graham), 3:00 (Agnieszka), 3:05 (Graham), 3:10 (Agnieszka), 3:15 (Graham); `npc_exchange_heard` 3:19, `heard_exchange_cooler_chat` true, task ticks. Speaker bubbles checked on screen: X1 on Graham, X2 on Agnieszka (`s2-A-exchange-*.png`); the "Graham Whitfield:" and "Agnieszka Duda:" prefixes are stripped and pick the right head. A later cooler visit plays pool lines only ("Have you tried the new sandwich place?") |
| Graham's lock after the exchange | PASS | `workstation_auto_locked:graham_pc` 20 s after he left (3:02), unlock on return 3:34 |
| `chidi_pc_screen_locked` on Chidi's first leave | PASS | true at 0:53 (A), 0:51 (B), 0:52 (D) with `workstation_lock_heard:chidi_pc` (volume 0.068, the chime plays); false on return at 1:10 to 1:12. The second leave (3:32 in A) locks and chimes again |
| T6b, kitchen opened at 0:30 (B, 7508) | PASS | First queue still forms at `office_coffee` at 0:51, `see_queue` and `hear_queue_chat` tick; `kitchen_coffee` reports off (`_isOff`, game 7513) |
| T9, kitchen shut to 3:30 (C, 7509) | PASS | Graham and Agnieszka park `no_source` at 2:40; the kitchen opens 3:32; Graham leaves 3:34, Agnieszka does the mug run first then the cooler 3:47; exchange lines 3:55 to 4:14, `npc_exchange_heard` and the task tick at 4:19 |
| Socket lever (D, 7510) | PASS | Kitchen opened once (0:05), lever pulled at 0:55 with Chidi using and Jun and Zainab queued. `npc_turned_back` reason `off` for Jun and Zainab at 0:55, B3 bark, `see_coffee_off` ticks; Zainab queues at `kitchen_coffee` the same tick, Jun walks to it; both use it (1:03, 1:19) and return. Chidi, mid-use, finishes at the office machine |
| One machine on at a time (7513) | PASS | start: office on; kitchen opened: office on, kitchen off; lever off: office off, kitchen on; lever on: office on, kitchen off; the next run queued in the office at 0:52. Switching back in D set `office_coffee_off` false at 2:00 |
| `kitchen_seen`, B1, B11 | PASS | `kitchen_seen` true on the first `room_entered:kitchen` in every run; B11 once per run; B2 and B3 once |

No FAIL, and no nudge was needed.

### Observations
- Bark text appears in the `showBark` log twice for B2 and B3 (same time stamp). The player sees one bubble; the second call looks like the bark queue re-offering the same text. Not a scenario issue and not touched.
- With the viewer in the kitchen, queue chat is silent for the task but still logged `overheard:false`, as the plan says.
- Run A needed a lever pulled right after the second queue forms (3:32 to 3:35) because that is the only window with someone walking or queued at the office machine in the morning.

### Scenario and plan changes made in this pass
- No scenario or ink change was needed.
- PLAN.md: 7c now says the exchange speaker prefixes are the full display names "Graham Whitfield:" and "Agnieszka Duda:"; section 6 now allows B2 (`see_queue`) and B3 (`see_coffee_off`) to share one `onceOnly` mapping with their task.

### Screens (`scenarios/office_life_showcase/planning/screens/`)
`s2-A-queue.png` (Jun and Zainab waiting, hourglasses, Chidi at the machine), `s2-A-exchange-graham.png` and `s2-A-exchange-agnieszka.png` (cooler bubbles), `s2-C-exchange-*.png` (same, late kitchen), `s2-D-coffee-off.png` (socket off, B3 bark, task complete), `s2-A-coffee-off.png`, `s2-B-queue.png`, `s2-C-queue.png`, `s2-F-queue.png`.

### Scripts
`tools/playtest/showcase-s2-lib.mjs` (recorder and helpers), `showcase-s2-run.mjs <gid> <A|B|C|D|F>`, `showcase-s2-lever.mjs <gid>` (machine states), `showcase-s2-analyse.mjs <dump>`, `showcase-s2-info.mjs`.

## S3 (midday and cake)

### Built (commit 60391659a, verified against PLAN this pass, no change needed)
- `globalVariables`: `act_midday`, `chidi_pc_owner_away`, `jun_pc_owner_away` (the lunch gate's two declared engine globals), `cake_servings` 2.
- `startItemsInInventory`: `cake` (type `cake1`), affordance satisfies hunger and social, restores 40, useSeconds 12, capacity 3, chatter `cake`, useSound `eat_snack`; magnet tempt 30, servings 2, perPerson 1, announce `news_cake`, newsRadius 5. Matches CAKE_ITEM.md.
- Chatter pools added: `cake` ("Who's the cake from?", "Go on, just a small slice.", "Whose birthday is it?", "This is really good.") and `news_cake`.
- Midday aim tasks: `use_open_screen`, `see_caught`, `see_cake_eaten`.
- Ama `eventMappings`: B4 `workstation_screen_changed:chidi_pc` (`data.how === 'leave' && data.locked === true && globalVars.act_midday === true`), B5 `npc_left_post:jun_watanabe` (`act_midday`), `workstation_accessed:jun_pc` completeTask `use_open_screen`, B6 `npc_caught_at_post:jun_watanabe` delayMs 2500, B7 `magnet_finished:cake` completeTask `see_cake_eaten`, B9 `npc_left_item_gone:jun_watanabe`.
- Lunch needs sets on `global_variable_changed:act_midday` (`data.value === true`): Chidi and Jun hunger 20, Graham and Agnieszka hunger 62.
- Jun `eventMappings`: work coupling `workstation_accessed:jun_pc` (`act_midday`, cooldown 60000, work 5), B8 `npc_caught_at_post:jun_watanabe` completeTask `see_caught`.
- Ama ink: VARs `act_midday`, `kitchen_seen`, `chidi_pc_owner_away`, `jun_pc_owner_away`; midday branch of "What should I try next?" (A9 to A11); "Let's do lunch." gate (A26 kitchen unseen, A29 owner away, A16 then A30 then `#set_global:act_midday:true` on success).
- `jun_badge` object (id_badge, owner jun_watanabe, leftBehindChance 0.7, revealOnGlobal `jun_badge_left`); the badge is a bonus beat with no task, B9 the only line.
- All voiced lines match PLAN 7a and 7d word for word; the recompiled ama_owusu.json matches the committed one.

### Note on the brief's cake figures
The brief's "hunger 0.5/30/50" is the demo_access_tour minimal variant (CAKE_ITEM.md), not office_life_showcase. The showcase keeps each office NPC's own hunger needs and tempts the cake through tempt 30 / servings 2 (PLAN section 4 row 2.7, band at or below 70). No change needed.

### Validator
`ruby scripts/validate_scenario.rb scenarios/office_life_showcase/scenario.json.erb`: 0 errors, 17 warnings.
- S2 baseline (commit 8608d3151, both scenario and ink): 0 errors, 17 warnings = 16 cross-room "need target in room kitchen, not home room office; it may be unloaded when needed" (R2 wake-on-load, accepted) plus 1 "chatter pool grumble_gone ... no NPC will ever speak it".
- S3: the same 16 cross-room warnings, and one NEW warning beyond S2's set:
  - #64 "habits: the mapping on workstation_screen_changed:chidi_pc fires on some leaves only: it needs a locked screen, and whether workstation chidi_pc locks on a leave depends on the owner chidi_okeke habits.screen." Expected and intended: B4 requires `data.locked === true`; Chidi's `habits.screen.lockIfAwayOverSeconds 10` locks on every trip over 10 s, and the `act_midday` condition further gates B4 to the lunch trip. Not a fault.
- The S2 grumble_gone warning is RESOLVED by S3: the cake magnet satisfies hunger and runs out, so an NPC can now speak `grumble_gone` ("Missed it.").
- No cake-lying-in-a-room stale warning (validate_npc_needs.rb:275-277): the cake starts in the inventory, not a room.
- V8 sync budget: workstation globals 9/24; heard_ 1/8; magnet servings 1/2; reveal and left-behind 1/6; dropped magnet items 1/2; office-life onceOnly 8/10; office-life items 2/4; small keys 20/64. All within budget.

## BC1 (cake after reload) -- PASS, all four cases proven live

Probe: `tools/playtest/showcase-bc1-cake-reload.mjs`.
Usage: `node tools/playtest/showcase-bc1-cake-reload.mjs --scenario office_life_showcase --room office --cake cake --port 3094 [--cases 1,2,3,4] [--eaters chidi_okeke,jun_watanabe] [--rooms office,kitchen] [--task see_cake_eaten] [--at x,y] [--near objectId] [--wait 22] [--staff a,b,c] [--calm 0] [--games 1=ID,...]`. Scenario, room and cake are arguments so another session can reuse it.

| Case | Game | Result |
|---|---|---|
| 1 cake held | 7570 | PASS: still in the inventory, in no room, servings 2 |
| 2 cake down, untouched | 7567 | PASS: same place after reload, 2 servings, still a magnet, Chidi then walks to it and eats |
| 3 cake down, one slice | 7569 | PASS: one slice kept across the reload, Jun eats the last, cake gone, `magnet_finished:cake` fires, `see_cake_eaten` completed |
| 4 cake finished | 7571 | PASS: no cake in any room or the inventory, servings 0, task still completed |

### Root cause of the earlier BLOCKED result (probe bug, not engine, not scenario)
The probe aborted requests with `page.route('**/tts**', ...)`. That glob also matches `/break_escape/js/systems/tts-manager.js`. It was installed after the first load, so the first load was fine; on `page.reload()` the module request was aborted (`REQFAIL .../tts-manager.js`), the ES module graph never ran and no Phaser game was created (`window.game` absent, no page error, only a console `net::ERR_FAILED`). The resume overlay is plain DOM, so it still showed; clicking Resume only hides it and does not gate the scene build. The "parallel session on :3094" theory was wrong. Fix: abort only `POST /tts` (`route(u => /\/tts$/.test(u.pathname), ...)`). The cause is general to any scenario run through this probe, not specific to office_life_showcase. Engine reload/resume path needed no change.

### Probe corrections made while getting to a real result (also probe-only)
- A dropped cake tempts all five staff, and Graham's social need walks to it too, so servings dropped during the 22 s wait. The probe now sets hunger and social to 100 for the five staff before the drop and before each settle (`--staff`, `--calm 0` to disable), and compares servings against a reading taken just before the reload instead of a fixed 2.
- Live drop sprites report their centre (origin 0.5) while a reloaded drop is placed by its top-left (origin 0, `table-drop.js` `savedPosition`), so raw x/y differed by half the 25x27 sprite. `where()` now reports top-left (`x - displayOriginX`). Same place on screen; not an engine bug.

### Scripts (this pass)
`tools/playtest/showcase-bc1-cake-reload.mjs` (resume-overlay-aware reload, tts route fix, staff calming, top-left compare). Diagnostics were scratch-only (`/tmp/.../bc1-diag*.mjs`), not committed.

## S3 live proof

Keyless server on :3092 (boot log shows the GEMINI_API_KEY warning), PID 52864, killed at the end. Games from new-game.rb this run: 7541 (run A), 7542 (run B, game sound off), 7543 (run C, cake only), 7545 (run E, Jun's PC cooldown). 7544 (run D) and 7546 (run F) are repeats and an inconclusive probe. Headless, setFPS(20), fixed steps on, `/tts` route aborted. Times are the needs clock (seconds). No scenario or ink edits.

Scripts: `tools/playtest/showcase-s3-lib.mjs`, `showcase-s3-run.mjs` (gate plus midday plus cake), `showcase-s3-midday.mjs`, `showcase-s3-cake.mjs`, `showcase-s3-news.mjs`. Screens: `screens/s3-*.png`.

### Proof table

| # | Check | Games | Result | Evidence |
|---|---|---|---|---|
| 1 | Lunch gate | 7541, 7542, 7544 | PASS | Before the kitchen: "Have a look in the kitchen first." and no global change. Chidi away (chidi_pc_owner_away true at 51.8): A29 "Hang on, Chidi or Jun is still out. Give it a minute.", act_midday stays false. Both back (84): A16/A30 "Good idea. Watch who goes..." and act_midday true at 94, Chidi and Jun hunger 19.85, Graham and Agnieszka 61.88. Jun-only away case not run separately (same OR branch). |
| 2 | B4 on locked leave in act_midday, sound off | 7541 (sound on), 7542 (sound off) | PASS | `workstation_screen_changed:chidi_pc` locked true how leave at 51.5 (before act_midday: no bark) and 93.3 (after: "Chidi's locked his screen before lunch." from Ama). With `barkSystem.soundEnabled=false` and game sound muted the bark fired (bubble on ama_owusu, `s3-B-b4-soundoff.png`). onceOnly: the second lunch trip at 128 locked again, no repeat. |
| 3 | Jun's PC coupling and catch | 7545 (cooldown), 7541, 7542 (catch) | PASS | While Jun ate in the kitchen: `workstation_accessed:jun_pc` at 101.5, use_open_screen completed, Jun's work 66.8 to 4.8. Reopened 2.5 s later (second emit at 104): work stayed 59.7 after being set to 60, so the 60 s cooldown held. Catch: `npc_caught_at_post:jun_watanabe` at 118.0 to 118.3, B8 "Er, that's my desk. Can I help you?" then Ama's B6 2.5 s later, see_caught completed. |
| 4 | Badge | 7541, 7542, 7544, 7545 | PASS | jun_badge_left true on the first Jun leave in all four games (0.7 roll never missed, no seeding needed). Badge visible at (56,168), picked up (`item_picked_up:id_badge`). `npc_left_item_gone:jun_watanabe` on return at 122.5 and B9 "Jun's just found his badge gone. That was you." The 30% no-leave branch was not seen. |
| 5 | Cake drop | 7541, 7542, 7543 | PASS (see M1) | Drop `item_dropped:cake`, `magnet_placed:cake` servings 2, reachable all four. Tempted (hunger 50 in run C): Chidi, Jun, Graham left their posts. Two servings taken (`magnet_serving` left 1 then 0), one each; Jun turned back with `npc_turned_back` reason gone and said "Missed it." (grumble_gone). `cake` pool lines spoken ("Whose birthday is it?", "Go on, just a small slice."). `magnet_finished:cake` ~12 s after the last serving, cake gone from the room objects and inventory, cake_servings 0. |
| 6 | Midday tasks | 7541, 7542 | PASS | use_open_screen completed on Jun's PC access (7542/7545), see_caught completed on the catch, see_cake_eaten completed on `magnet_finished:cake` with B7 "Two slices, then it's gone. Late ones miss out." In 7541 use_open_screen stayed active only because the first PC attempt did not open (probe issue, fixed). |

### Findings
- M1 (major): the `exchange_cooler_chat` exchange fires at the cake. Graham and Agnieszka, both using the cake, played all five cooler lines at the cake (topic cake, objectId cake), and `npc_exchange_heard:exchange_cooler_chat` fired. Evidence: runs 7541 (133.3 to 157.3) and 7542 (137.5 to 157). The same pair's cake chatter then replaces the `cake` pool lines for them, and a viewer who has not yet seen the morning cooler exchange can complete `hear_cooler_exchange` at lunch. Proposed fix: add the exchange's own object restriction (cooler only) or `onceOnly` ordering in scenario.json.erb, or give the cake affordance a pair-chat exclusion; to confirm, read where exchange objects are matched in `npc-needs-chatter.js` (not edited).
- m1: the `news_cake` pool never speaks for an office drop. By `npc-needs.js:992-994` (`o.roomId === pos.roomId` skips) a teller only announces a magnet in a different room, and everyone in the office sees the cake at once. A kitchen drop attempt (run F, 7546) was inconclusive: with the viewer in the kitchen the office staff stayed in the office and the drop failed. Proposed fix: either accept it (pool is for a kitchen drop) or drop the pool; plan wording "news_cake" implies a line a player can hear.
- m2: Jun's work coupling does not bring him back early when he is mid-meal. Work fell to 5 at 101.5, but he stayed "using" the fridge and returned at 114.5, the same time as a run with no PC access (7541). Consistent with "anyone in the middle of something finishes it first"; the S3 handover says "brings him back early", which only holds when he is walking. Wording fix in the handover or PLAN T13.
- m3: with natural hunger only Graham and Agnieszka (hunger 59.7) were tempted by the cake; Chidi (77.9) and Jun (98.3) were not, so "Missed it." does not occur in a natural lunch-then-cake run. It showed only with hunger 50 for all four (run C, nudged through `__test.needs.set`). Setting hunger 20 first (run B) sends them to the fridge instead (urgent beats tempt). Not a defect; the cake beat is lighter than the plan implies.
- m4 (probe note): barks are logged twice at the same clock for Jun's B8 and `magnet_placed`, `npc_left_post` (world emit plus dispatcher both seen by the recorder). Jun's B8 appears twice in `showBark` at 118.0/118.3; Ama's B7 and B9 repeat 4 to 5 s later (162.5 after 158, 127.3 after 122.8). Likely the bark queue replaying; not investigated further, cooldown 30000 and onceOnly should stop a second firing.
- Not proven: BC1 (reload), the 30% badge-not-left branch, Jun-only-away gate in isolation, news_cake line.

## S3 fixes

The S3 live-proof findings M1, m1, m2, m3 above are addressed. Code, scenario, schema, docs and unit
tests are in; live proof on :3094 is run as a follow-up (see `tmp/handover/showcase-s3-fix.md` for the
exact commands and expected evidence, and the final report for the results).

- M1 (cooler exchange fired at the cake). New optional `exchanges[].topic` field. `_findExchange`
  takes the chat's topic and skips an entry whose `topic` does not match; an entry with no `topic` is
  unchanged (m01/m02/m03/m05 untouched). The showcase entry (`scenario.json.erb:325`) sets
  `topic: "cooler"`, so the exchange plays at the water cooler (chat topic "cooler", from the cooler
  preset) and never at the cake (chat topic "cake"). Schema `scripts/scenario-schema.json` and
  `docs/achitechture/NPC_NEEDS_SYSTEM.md` document the field; three unit tests added to
  `test/js/npc-exchange-heard.test.mjs` (topic matches / mismatch / absent).
- m3 (only two tempted by the cake naturally). Cake magnet `tempt` 30 -> 45. The tempt band is
  `urgentAt < level <= urgentAt + tempt` (hunger urgentAt 40), so the band is now 40..85: at the
  natural lunch-then-cake drop Graham and Agnieszka (~59.7) and Chidi (~77.9, after his fridge meal)
  are tempted, Jun (~98.3) is not. Three tempted, two servings, one "Missed it." No engine change.
- m1 (news_cake can never speak for an office drop). Removed the `news_cake` chatter pool and the
  magnet's `announce`/`newsRadius`. A one-room tour drop is seen by sight, so nobody is ever told;
  the smaller, honest change (CAKE_ITEM.md already noted dropping it is allowed). PLAN.md and
  DEMO_AUDIT.md word-of-mouth references updated to match.
- m2 ("brings Jun back early"). Ama's ink only says "wait by the desk for its owner", so no spoken
  line changed and nothing needs re-voicing. PLAN.md (rows under section 7 and the 2.4 row) reworded:
  the jun_pc work coupling pulls his work need down but shortens his return only while he is walking,
  not mid-meal.

Harness: `tools/playtest/showcase-s3-lib.mjs` now aborts only POST /tts via a URL predicate
(`u => /\/tts$/.test(u.pathname)`), never the `**/tts**` glob (which also blocked tts-manager.js).

## S3 fixes: live proof

Server: keyless on :3094 (boot log shows the GEMINI_API_KEY warning), killed by recorded PID. Every game came from `new-game.rb` in the same run. Browser headless, setFPS(20) with fixed steps on, POST /tts aborted by pathname only. The server log has no errors or 500s.

| Check | Result | Game | Evidence |
|---|---|---|---|
| Cooler exchange does not play at the cake | PASS | 7584 | Graham and Agnieszka both `hunger:cake:using` at 46.3 s; they say cake pool lines ("Whose birthday is it?", "Go on, just a small slice."); no `npc_exchange_heard` event; `heard_exchange_cooler_chat` false. Probe `showcase-s3-cake2.mjs` (Chidi and Jun set to hunger 5 so the pair shares the cake; this check uses a needs nudge by design) |
| Cooler exchange plays at the cooler | PASS | 7586 | Natural run, no nudges. Chat record `graham_whitfield+agnieszka_duda`, topic `cooler`, object `water_cooler`, from 170.3 s. Five exchange lines (174.3 to 193.8 s), then `npc_exchange_heard:exchange_cooler_chat` complete and `heard_exchange_cooler_chat` true at 198.3 s. Probe `showcase-s3-cooler.mjs` |
| Natural cake drop, three tempted, one "Missed it." | PASS | 7579 | Mode A, no nudges, drop at 127.5 s. Hunger at the drop: Chidi 77.92, Jun 98.33, Graham 59.67, Agnieszka 59.67. Left post for the cake: Agnieszka (hunger), Chidi (hunger), Graham (social need, `social:cake`). Jun saw it but was not tempted (98.33 is above the 85 band edge). Servings: Chidi at 131.8 s, Graham at 132.0 s. Agnieszka `npc_turned_back` reason `gone` at 132.3 s, bubble shown on her; `cake_servings` 2, 1, 0; `see_cake_eaten` completed. Band 40 < level <= 85 holds: no tempt change needed |
| news_cake removed | PASS with a note | 7579, 7580 | No `news_cake` in the scenario. Natural office drop (7579): no `npc_announced` or `npc_told` events, no announce or news lines, console errors only the expected aborted /tts. Kitchen drop (7580, `showcase-s3-news.mjs`): the engine's default topic still fires `npc_announced` (topic `news`, `line: null`, picture only) and `npc_told` for Graham, Jun and Chidi at 130.3 s, with no spoken or barked line; Chidi then says "Missed it." at 134 s. So no news lines, but picture-only word of mouth remains for a drop in the other room. The 7580 probe does not capture browser console errors; the server log is clean |

Notes: Graham went to the cake on his social need, not hunger, in the natural run. "Missed it." on Agnieszka in 7579 showed as a speech bubble at the turn-back with no `speak` record; the same line was recorded as a speak for Chidi in 7580 and 7583. Games used: 7578 (cake probe, no pair chat), 7583 and 7584 (cake pair runs; 7583 pair did not overlap), 7579, 7580, 7586.

## S4 build and proof (evening and lighting)

Build commit 5b4f4caf8 (data only: `act_evening` global, office and kitchen lighting variants, four `setVisible:false` mappings, Zainab's B10 bark and delayed caffeine, Ama's evening branch and "Call it a day" hub choice). Validator 0 errors, 17 warnings (baseline). No scenario or ink edits in the proof pass.

Keyless server on :3092 (boot log shows the GEMINI_API_KEY warning), PID 415023, killed at the end. Nothing was missing from the fresh worktree: the engine needs no ignored config, the Rails dummy app is tracked, `BUNDLE_PATH` pointed at the main checkout's `vendor/bundle` and the probe lib already requires Playwright from the main checkout's `node_modules`. Games from new-game.rb: 7590 (R10 run), 7595 (T17, T18, T19), 7599 and 7602 (T20, R5), 7605 (reload per act), 7608 (reload, lamp, kitchen), 7609 (before shots); 7591 to 7594, 7596 and 7604 were earlier probe iterations. Headless, setFPS(20), fixed steps on, only POST `/tts` aborted. Times are the needs clock (seconds).

Scripts: `tools/playtest/showcase-s4-lib.mjs`, `showcase-s4-evening.mjs` (T17, T18, T19, R10; `noR10` argument skips the socket clicks), `showcase-s4-during-use.mjs` (T20, R5; `coffee` argument), `showcase-s4-reload.mjs` (reload in each act), `showcase-s4-lamp.mjs` (evening reload, lamp, kitchen), `showcase-s4-before.mjs` (clean before shots). Screens: `screens/s4-*.png` (`E` before, `T` and `R` after, `D` reload).

### Proof table

| # | Check | Games | Result | Evidence |
|---|---|---|---|---|
| T17 | Evening hides four staff, dims office | 7595, 7608 | PASS | `act_evening` true at 35.3. Chidi, Jun, Graham, Agnieszka: `isVisible` false, sprite `visible` false, alpha 0, no other display-list object with their texture key (`drawnOthers` 0). Office `variantIdx` -1 to 0, ambient #c4cad8 to #8f96b0, lights 0 to 1. Screens `s4-E-office-before.png`, `s4-T-office-after.png`, `s4-D-office-evening-after-reload.png`, `s4-E-kitchen-before.png`, `s4-T-kitchen-entered-evening.png`. |
| T18 | B10, Zainab to office coffee, task ticks | 7591 (also 7599, 7602) | PASS | Bark "Quiet now. Time for a coffee in peace." at 35.0 (turn at 35.3 in the logged clock, bark queue delay 1.5 s), job `caffeine:office_coffee:goto_target` at 41.8, `npc_left_post:zainab_hussain` target `office_coffee` at 42.5, `see_who_stays` completed at 42.8, using 45, back at post 62.5. |
| T19 | Kitchen dark until entered, lit on entry, dark 12 s after leaving | 7595, 7608 | PASS | Kitchen after the turn: mode motion, `on` false (viewer in office). On entry `on` true. 4 s after leaving `offTimer` armed and `on` true; 12.7 s after leaving `on` false. After reload (7608): on entry `on` true, 12.5 s after leaving `on` false. Needs Zainab back at her post first: while she is in the kitchen the sensor re-arms (see m1). |
| T20 | Turn during a use | 7599 (food), 7602 (coffee plus food) | PASS | 7602 at 38.5: Chidi at microwave, Jun at fridge, Graham `caffeine:office_coffee:using`; claims office_coffee 1, microwave 1, fridge 1. At the turn all four hidden, jobs `idle` at 38.8, claims all 0, `drawnOthers` 0, still 0 25 s later. 7599 at 35.5 the same with Chidi using and Jun and Graham walking. No unseated-sitter error in the page log. |
| R5 | No held capacity, no stuck NPC | 7599, 7602 | PASS | Zainab (visible) queued for and used the office coffee after the turn (46.8 to 62 in 7602), so the released machine was free. Hidden NPCs stay `idle`, not stuck at a machine. |
| R10 | Coffee switched off, turn, one socket click | 7590 | PASS | Lever pulled before the turn: `office_coffee_off` true. Turn: Ama's `setGlobal` makes it false. One click: the confirm button reads "Switch off" (not "Switch on"); confirming sets it true again. Screen `s4-R-office-socket-click.png`. |
| T21 | Reload in each act | 7605, 7608 | PASS | `page.reload()` only, 21 s after the key global each time. Morning: `kitchen_seen` true, all four visible, variantIdx -1. Midday: `act_midday` true, `act_evening` false, all visible. Evening: both true, `see_who_stays` still completed, four hidden with no drawn image, office variantIdx 0 and #8f96b0, kitchen motion mode. |
| R6 | Needs reset after reload (accepted) | 7605 | PASS (as accepted) | Chidi (midday) hunger 79 to 90, caffeine 40 to 58; Zainab (evening) caffeine 80 to 95; all back near initial values. |
| Lamp | Warm lamp at (2.3, 5.5) over Zainab's tool roll | 7608 | PASS, see m2 | `zainab_tool_roll` at world (64,173), lamp at (73.6,176), 10 px apart. The roll's desk is lit more than the surrounding floor in `s4-D-lamp-clip.png`. |

### Findings
- m1 (T19, timing): while an NPC is in the kitchen when the player leaves, `onRoomExited` re-arms the 10 s timer (`systems/lighting.js:1038`, `npcInRoom`), so the lights stay on past 10 s. In the first run (7590) Zainab used the kitchen coffee because the player's click had switched the office machine off, and the kitchen was still lit 12.5 s later. This is intended behaviour ("the sensor still sees someone"), not a defect; it only matters for a tester who leaves the kitchen while Zainab is there.
- m2 (lamp): the lamp reads as a soft cream pool on the left of Zainab's desk, not a distinct warm colour. The other desks already carry similar white object glows, so against them it is easy to miss. The roll sprite shows as a pen pot. Proposed (scenario.json.erb:97, not edited): raise intensity from 0.8 or lower the office ambient further if a clearer warm cue is wanted.
- m3 (probe note): Zainab's B10 shows twice in the `showBark` log in 7590 (38.5 and 41), once in 7595. Same recorder double-logging noted under S3 m4. Not an engine defect.
- m4 (probe note): the Ama hub choice "Let's do lunch" failed once (7604) after a morning reload because Chidi or Jun was away at the time, the expected A29 gate; the next run passed. The mission brief popup reappears about 3 s after a reload and covers the view until dismissed (intended, per the reload convention).
- No B or M findings. Dimming from #c4cad8 to #8f96b0 is modest but visible against `s4-E-office-before.png`.
- Not proven: cake use at the turn (coffee and food uses cover R5); the kitchen seen dark from the office side (only the `on` flag, the viewer cannot see into the closed room).

## S5 checks and full run

Scripts: `tools/playtest/showcase-lines-check.mjs` (plan section 7 against data), `tools/playtest/showcase-s5-run.mjs` (timed full run). Screens: `screens/s5-01-spawn.png` to `s5-16-recap.png`. Server keyless on :3092 (GEMINI_API_KEY warning in the boot log), PID 536727, killed after the run. No scenario or ink edits.

### Validator (T1)
`ruby scripts/validate_scenario.rb scenarios/office_life_showcase/scenario.json.erb`: 0 errors, 17 warnings, the same as the S4 baseline (16 "target is in room kitchen, not the home room" load warnings plus the one `workstation_screen_changed:chidi_pc` leave-only habits warning). No V7 (repeated line) or V10 (unreachable pool, exchange or call) warning. V8: workstation globals 9/24; heard_ globals 1/8; magnet servings 1/2; reveal and left-behind globals 1/6; dropped magnet items 1/2; office-life onceOnly mappings 8/10; office-life items 2/4; small keys 20/64 (all within caps). V6 (`app:break_escape:tts:office_lines[office_life_showcase]`): 156 clips, all uncached (3689 characters; nothing voiced yet, as planned): Ama 31, Chidi 24, Jun 25, Graham 27, Agnieszka 26, Zainab 23. The count is per voice and includes shared pool lines for each speaker, so it is higher than the plan's 105 distinct lines.

### Lines check (T22)
`node tools/playtest/showcase-lines-check.mjs`: 80 plan table rows (31 Ama, 25 staff, 5 exchange, 11 barks, 8 extras) and 22 scenario pool lines. Every line is in the source ink and the compiled json (or the NPC `bark` or `chatter` field) word for word; the table's Chars and Words columns match; caps hold (ink 30 words, choices 15, chatter and exchange 40 characters, barks 50 characters and 12 words). PASS. Dialoguelint over the showcase: 0 findings by rule. Note that dialoguelint measures only `Name:`-prefixed ink lines; the staff and Ama lines here are unprefixed, so it counts lines=0 for four inks. The check script covers those caps.

### Full run (T23)
Game 7613, no needs nudges. Needs clock and wall clock agree (fixed steps at 20 fps): play time 389 s (6.5 minutes), target 5 to 10.

| Task | Needs s | Wall s |
|---|---|---|
| see_queue | 51.5 | 61.9 |
| hear_queue_chat | 54.8 | 65.1 |
| see_coffee_off | 57.0 | 67.2 |
| hear_cooler_exchange | 198.3 | 208.6 |
| use_open_screen | 215.3 | 225.7 |
| see_caught | 235.8 | 246.0 |
| see_cake_eaten | 345.5 | 355.9 |
| see_who_stays | 363.0 | 373.3 |

Recap ("Give me the short version") finished at 390 s. `verify-run.rb --tasks 7613`: 8 tasks in objectivesState, 8 completed, score 100, VERDICT progress recorded. Server: status `in_progress`, `mission_concluded_at` nil; client `missionConcludedAt` unset, no credits. `git diff main -- scenarios/test_needs_sims` empty (T24).

### Findings
- m1 (`scenarios/office_life_showcase/ink/ama_owusu.ink:14-18`, `start`): after any conversation that ends with `-> END` (lunch, "Call it a day", "I'll have a look round."), the next talk to Ama restarts at `start` and replays A1 and A2 ("Today you watch an office instead of breaking into one...") before the hub. Closing mid-hub with Esc reopens at the hub line A0 as planned. Seen on the "Call it a day" and recap conversations. Proposed fix: guard `start` with a global or VAR that the first run sets, diverting to `hub.choices` when set.
- m2 (probe note): bark recorders log some barks twice (B2, B3, B5, B6, B7); same double-logging noted in S3 m4, a recorder artefact.

## R1 fixes (build review R1 + dialogue review BUILD)

Finding to fix or reason. Spoken lines added or changed are listed in PLAN section 7a/7c and need the user's yes before voicing.

| Finding | Fix |
|---|---|
| B1 (R1) evening task stalls if Zainab is away from post at the turn | Added on Ama `npc_used:office_coffee` with `data.npcId === 'zainab_hussain' && globalVars.act_evening === true`, completeTask see_who_stays. Kept the npc_left_post:zainab_hussain mapping. |
| M1 (both) Ama replays A1/A2 after every ended story | Guarded `start` with ink-local VAR `met_ama`; divert to `hub` on the repeat so A0 plays. Same guard on all five staff (`met_<staff>`), dialogue m7. Guard survives END (restoreNPCState) and reload (exportNpcInkVariables; npcInkVariables 0 to 6). |
| M2 (R1) "Call it a day." loses unticked tasks, no warning | New Ama confirm line A31 ("Once they go home, they're gone for the day. Ready?") with Yes/Not yet sub-choices; Yes runs A17/A18 and the turn. |
| M2 (dialogue) try-next goes quiet | A32 (morning, once kitchen_seen: "You've seen the kitchen. Ask me about lunch when you're ready.") and A33 (midday: "Once the cake is gone, tell me to call it a day."). |
| M3 (R1) meal values differ from plan; cake re-tuned | Kept the built values (tempt 45, fridge/microwave on presets). Updated PLAN section 2, row 2.7 and CAKE_ITEM.md to the built values with the reason; confirmed a morning cake drop still completes see_cake_eaten with no soft-lock. |
| M4 (R1) notice board missing | Added `tour_notice` (notice_board1, wallMounted, readable) at (8.1875, 0.6875) with the three-act "Things to try" text (not voiced, no secrets). |
| m1 (R1) short lever window, no hint on early switch-off | Reworded the two socket hint messages (UI text, not voiced). Left B2 reword (spoken, optional). |
| m2 (R1) double bark logs | Left: probe/recorder artefact, no scenario effect; the player sees one bubble. |
| m3 (R1) "Missed it." not recorded as a speak on Agnieszka | Left: voicing-step live check. |
| m4 (R1) picture-only word of mouth on a kitchen cake drop | Noted in PLAN row 2.7 (picture bubble, no line). |
| m5 (R1) evening lamp reads cream | Left: a lighting value change needs a re-render to confirm it does not wash out; defer to a lighting pass. |
| m6 (R1) V6 clip count | Left: voicing-step concern (give the reachable per-speaker count then). |
| m7 (R1) validator does not check topic | Added a type-check in check_exchanges (ERROR if topic is set and not a non-empty string). Full reachability check left as a backlog note. |
| m8 (R1) PLAN does not record the engine change / topic | Noted in PLAN section 1. |
| m9 (R1) reload in the 8 s after the turn loses Zainab's coffee | Added on Zainab `room_entered:office` with `globalVars.act_evening === true`, cooldown 60000, caffeine 10. Noted in PLAN section 9. |
| m1 (dialogue) A6 "it" has no antecedent | A6 now "Switch the machine off at the wall socket while they queue." |
| m2 (dialogue) A13 "This is" | A13 now "That was an exchange..." |
| m3 (dialogue) A17 "most of them" | A17 now "nearly all of them." |
| m4 (dialogue) X4 "Five minutes, tops" (American) | X4 now "Five minutes at most." |
| m5 (dialogue) name pronunciation | Left: note for the voicing step. |
| m6 (dialogue) "Not bad, you?" opener | Left: line-selection pairing unconfirmed; swapping is a spoken-line change the review flagged as conditional. |
| m8 (dialogue) voice style strings | Left per brief. |

## R1 fixes: live proof

Server: keyless on :3094, boot log shows the GEMINI_API_KEY warning, puma PID 1696831 (recorded in `tmp/r1fix/server.pid`), killed by that PID at the end. Games came from `new-game.rb` in this run: 7641 (check 1), 7642 (checks 2 to 5). Headless, setFPS(20) with fixed steps on, POST /tts aborted by pathname only. Probe: `tools/playtest/showcase-r1fix-proof.mjs` (`b1` and `talk` modes). Raw evidence is in `tmp/r1fix/` (not committed).

| Check | Result | Game | Evidence |
|---|---|---|---|
| B1: evening turn during office-coffee use | PASS | 7641 | Lunch set `act_midday`. Zainab sent to the office coffee machine, `caffeine:office_coffee:using` from 3.6 s. The "Yes, call it a day" press (which sets `act_evening`) came while her job was still `using`. `see_who_stays` went from active to completed 0.3 s later. Queued and walking at the turn were not tested |
| M1: met_* guard on re-talk and after reload | PASS | 7642 | Ama, first talk: "Today you watch an office..." and "Everyone here is driven..." Exit with "I'll have a look round", re-talk: "What can I help with?" only, no opening lines. After `page.reload()` (22 s after the last talk), re-talk: the same hub line. Staff spot-check, Chidi: first talk "Hiya. Can't stop long...", re-talk "Still here, still busy.", and the same reopen line after the reload |
| M2: "Call it a day." confirm (A31) | PASS | 7642 | Hub choice opened "Once they go home, they're gone for the day. Ready?" with "1. Yes, call it a day." and "2. Not yet." Not yet: back at the hub, `act_evening` false. Yes: "Right. Home time for nearly all of them.", "Have a wander if you like.", `act_evening` true, chat closed |
| Try-next, morning after kitchen_seen (A32) | PASS | 7642 | `kitchen_seen` true. "What should I try next?" showed "You've seen the kitchen. Ask me about lunch when you're ready." |
| Try-next, midday (A33) | PASS | 7642 | `act_midday` true after lunch. The same choice showed "Once the cake is gone, tell me to call it a day." |
| tour_notice board readable | PASS | 7642 | Interact opened the "Things to try" modal; the text starts "THINGS TO TRY / Morning:" and runs on to the midday and evening lists. Closed with Escape |

Notes:
- The two M2 confirm screenshots (`r1fix-m2-confirm.png`, `r1fix-m2-confirm-yes-offered.png`) show the same frame and are the same file size. The second was taken before the Yes press in the second conversation.
- The board modal is shorter than its text. The midday and evening lists sit below the fold and need scrolling. The text is readable, but a reader may miss the evening list. Not changed here (the brief said not to edit the scenario or engine).
- No scenario, ink or engine file was changed. No game row was edited. Only POST /tts was aborted.

### Screens (`scenarios/office_life_showcase/planning/screens/`)

`r1fix-b1-zainab-before-turn.png`, `r1fix-b1-evening-turn.png`, `r1fix-b1-see-who-stays.png`, `r1fix-m1-ama-reopen-hub.png`, `r1fix-m1-chidi-reopen-hub.png`, `r1fix-m1-ama-after-reload.png`, `r1fix-m2-confirm.png`, `r1fix-m2-confirm-yes-offered.png`, `r1fix-m2-after-yes.png`, `r1fix-trynext-morning.png`, `r1fix-trynext-midday.png`, `r1fix-board.png`.

## R2 fixes

Reviewed in `planning/BUILD_REVIEW_R2.md` (9 minors, no blockers or majors), plus one from the R1 live proof: the `tour_notice` "Things to try" modal clipped its text, so the midday and evening lists sat below the fold.

| Finding | Fix | Files |
|---|---|---|
| m1: Zainab's kitchen-coffee fallback in the evening does not tick `see_who_stays` | Widened the mapping from `npc_used:office_coffee` to `npc_used:*` with `data.npcId === 'zainab_hussain' && data.need === 'caffeine' && globalVars.act_evening === true`, so any caffeine source counts (`need` is carried on `npc_used`, `npc-needs.js:3701-3707`). The `npc_left_post:zainab_hussain` path is kept | `scenario.json.erb` |
| m2: Evening aim said "most of them" with no warning | Rewrote the description: "Home time for nearly all of them, and they don't come back. Calling it a day closes the earlier aims, so finish those first. Each task ticks when you have seen that behaviour happen." (UI text) | `scenario.json.erb` |
| m3: PLAN sections 4, 6, 9, 10 stale | Updated section 6 (start diverts to hub on later talks; try-next gated by act and progress globals, with A32/A33/A34; "Call it a day." offers the A31 confirm), row 3.1, section 9 (cake band `urgentAt 40 < level <= 85`, caffeine not thirst, the widened `npc_used` tick), and added R14 for the deferred lamp note (R1 m5) | `planning/PLAN.md` |
| m4: notice board repeated its title and clipped | Dropped `THINGS TO TRY\n\n`; shortened every bullet to one short line and removed the blank separators so the 12-line modal fits without scrolling | `scenario.json.erb` |
| m5: validator topic type-check had no test or backlog entry | Added a topic type-check test (number, empty, blank, valid string, no key) to `validator-exchange-line-length.test.mjs` (calls `ValidateNpcNeeds.check`); added the reachability-check backlog line | `test/js/validator-exchange-line-length.test.mjs`, `docs/IDEAS_BACKLOG.md` |
| m6: Ama's midday hint stale after an early cake | Mirrored the engine-owned `cake_servings` global as a VAR in Ama's ink; when it is 0, A11 and A33 are replaced by A34 "The cake's gone already. Tell me when to call it a day." | `ink/ama_owusu.ink`, `.json` |
| m7: A32 dropped the cooler pointer before the cooler beat | Gated A32 on `kitchen_seen and heard_exchange_cooler_chat`; `kitchen_seen` alone now gives A7 (back to the cooler); else A8, A7 (no new line) | `ink/ama_owusu.ink`, `.json` |
| m8: "Not bad, you?" could open a cooler chat | Replaced with "Quiet one today, isn't it?" in the `cooler` pool (lines are drawn one at a time, so a reply opener could land first) | `scenario.json.erb` |
| m9: A31 did not name the stake and echoed A33's "Once" | Rewrote A31 to "They won't be back once they've gone home. Any tasks still unticked first?" | `ink/ama_owusu.ink`, `.json` |

### Lines changed (need the user's yes before voicing)

- A31 (Ama): "They won't be back once they've gone home. Any tasks still unticked first?" (was "Once they go home, they're gone for the day. Ready?")
- A34 (Ama, new): "The cake's gone already. Tell me when to call it a day."
- `cooler` pool (chatter): "Quiet one today, isn't it?" (was "Not bad, you?")

A32 (m7) changed only its gate, not its text, so it needs no re-voicing.

### Checks

- Inks recompiled (`ama_owusu.ink` -> `.json`); the END warnings are the expected hub-exit convention.
- Validator (`validate_scenario.rb --no-graph`): 0 errors, 17 warnings (baseline).
- `node tools/playtest/showcase-lines-check.mjs`: PASS (84 table rows + 24 pool lines).
- `bin/test-js`: see the live-proof handover for the full run.

### Live check (port 3094)

Run on 2026-11-17. Results and evidence are in `## R2 fixes: live check` below.

## R2 fixes: live check

Probe: `tools/playtest/showcase-r2fix-proof.mjs` (modes `g1` and `g2`). Headless, setFPS(20) with fixed steps on, keyless server on :3094 (`env -u GEMINI_API_KEY`, PID 2105230 in `tmp/r2fix/server.pid`, boot log shows the GEMINI_API_KEY warning). Raw evidence: `tmp/r2fix/proof-g1-7675.json`, `tmp/r2fix/proof-g2-7665.json`. Games were created with `tools/playtest/new-game.rb` in this run.

| # | Check | Game | Result | Evidence |
|---|---|---|---|---|
| 1 | Evening: office coffee switched off while Zainab walks to it; she falls back to the kitchen coffee; `see_who_stays` ticks | 7675 | PASS | At the switch her job was `caffeine:office_coffee:goto_target` and the task was active. Afterwards `office_coffee_off` was true and her job became `caffeine:kitchen_coffee:goto_target`. She reached `kitchen_coffee:using` 7.7 s later. The task went to completed. Note (R4): the tick came from `npc_left_post` when she left her post, before the kitchen use, so the task PASS does not depend on the fallback; the fallback is shown by the job change alone. |
| 2a | Morning, kitchen seen, cooler not heard: "What should I try next?" gives A7, not A32 | 7675 | PASS | `kitchen_seen` true, `heard_exchange_cooler_chat` false. Reply: "Then open the kitchen door and hang about by the water cooler." No "You've seen the kitchen." line. Screenshot `r2fix-trynext-morning-heard-false.png`. |
| 2b | Same morning with the cooler exchange heard: gives A32 | 7665 | PASS | Game made with `--set heard_exchange_cooler_chat=true`, so the exchange was not heard in play. `kitchen_seen` and the flag both true. Reply: "You've seen the kitchen. Ask me about lunch when you're ready." Screenshot `r2fix-trynext-morning-heard-true.png`. |
| 3 | `tour_notice` board fits the modal without scrolling | 7675 | FAIL | `.game-display-body` scrollHeight 511, clientHeight 444. The dialog itself (532 and 532) sits inside the 800 px viewport. The screenshot `r2fix-board-modal.png` shows the Evening lines cut off at the bottom. The observation sentence "A notice board with a short list of things to try on the tour." sits above the list and probably takes the extra height. That is not verified. |
| 4 | A31 confirm text; "Not yet." returns to the hub with no blank bubble | 7675 | PASS | Confirm text exact: "They won't be back once they've gone home. Any tasks still unticked first?" Choices "1. Yes, call it a day." and "2. Not yet.". After "Not yet." the hub shows its choice list, with no blank step and `act_evening` still false. "Yes" then sets `act_evening` true. |

Findings for the user:
- Check 1 ticks on `npc_left_post`, not on the kitchen use. The existing `npc_left_post` mapping (kept in R1) fires when Zainab leaves her post for the machine. Here that happened after the switch, and it completed the task. Her kitchen use came 7.7 s later. The task therefore ticks on the walk, so the tick does not depend on the fallback. Decide whether that is wanted.
- Check 3 fails. Fix is in the board text or its modal, which this probe does not change (no engine or scenario edits here).
- After "Not yet." the ink returns to the choice point, so the hub shows its choice list without the "What can I help with?" greeting. That is the existing behaviour, not a blank bubble.

Probe history: the first run on game 7656 had two probe faults (the hub criterion wanted the greeting line, and the tick was not attributed to an event). Both were fixed. Games 7673 (first rerun) and 7675 (final) show the same results for checks 2a, 3 and 4. Check 1 needed the kitchen-use wait added before the final run on 7675.

## R3 fixes

Review: `planning/BUILD_REVIEW_R3.md` (0 blockers, 0 majors, 4 minors), plus the failed board fit from the R2 live check.

| Item | Change | Files |
|---|---|---|
| m1 | A31 now reads "They won't be back once they've gone home. Seen everything you wanted?" (70 characters, 12 words). Spoken line, needs voicing approval. | `ink/ama_owusu.ink`, `.json`, `planning/PLAN.md` (7a row A31, section 6 note) |
| m2 | Evening aim text no longer says earlier aims are closed: "Home time for nearly all of them, and they don't come back, so finish the earlier tasks first. Each task ticks when you have seen that behaviour happen." | `scenario.json.erb` |
| m3 | Board lines "Watch the coffee run: one at a time." and "Switch the coffee off at the socket." | `scenario.json.erb` |
| m4 | PLAN row 3.3 now lists `npc_used:*` with `need === 'caffeine'`; ink header comment says the first talk diverts to `hub.choices` and later talks to `hub`. | `planning/PLAN.md`, `ink/ama_owusu.ink` |
| Board fit | The board was cut off by 67 px. The two-line observation sentence is removed (the modal title already says "Things to try") and the mugs and cooler lines are merged ("Note the mugs; hang about by the cooler."). Text only. | `scenario.json.erb` |

Live check (probe `tools/playtest/showcase-r3fix-board.mjs`, keyless server :3094, game 7685, PID file `tmp/r3fix/server.pid`, killed by PID afterwards): `.game-display-body` scrollHeight 379, clientHeight 379; dialog 467 and 467, inside the 800 px viewport. PASS. Screenshot `planning/screens/r3fix-board.png`. Evidence `tmp/r3fix/board-7685.json`. An earlier run with the observation kept as one line (game 7683) gave 445 against 444, so the sentence was dropped for margin.

Checks: validator 0 errors, 17 warnings (known baseline); `showcase-lines-check.mjs` PASS; ink recompiled with no warnings.

## R4 fixes

From BUILD_REVIEW_R4.md: m1 board mugs line is now "- Note the mugs, then go to the cooler." (restores the order); m2 the R2 probe asserts the new A31 text; m3 the R2 check 1 title and report row say the tick comes from `npc_left_post`, not the kitchen use. The new board line is shorter than the one it replaces, so the R3 fit holds.

## Voicing dialogue review fixes

From DIALOGUE_REVIEW_VOICING.md: A31 now names its subject ("The staff won't be back once they've gone home. Seen everything you wanted?"); "Not yet." gets a reply, new line A36 "Take your time.", before returning to the hub; the kitchen_seen, cooler-not-heard hint is new line A35 "Hang about by the water cooler." (the door is already open by then; A7 stays for the kitchen-unseen path). X4 kept: in context "You never do" agrees with "I'll not keep you long", and "Five minutes at most" supports it. Ink recompiled; validator 0 errors, 17 warnings; lines check PASS; dialoguelint no hits. The R2 probe asserts the new A31 text and A35.

## BC1 after train 168 (magnet perPerson fix on the branch)

Re-run of the probe on the keyless server on :3094 from this worktree. HEAD fc9b3d5c8 includes main 69d8bf05a. Command: `showcase-bc1-cake-reload.mjs --scenario office_life_showcase --room office --cake cake --port 3094 --cases 1,2,3`. Case 3 was retried once on its own after the browser closed mid-case in the first run (game 7705, no JSON written). Raw results: `bc1-168.json` in this folder.

| Case | Game | Result | What happened |
|---|---|---|---|
| 1 cake held | 7695 | PASS | Cake still in the inventory, in no room, servings 2 before and after reload. player_state 3266 to 3339 bytes (+73). |
| 2 cake down, untouched | 7701 | FAIL | Before reload: cake in the office, servings 2, magnet true. After reload: same spot, servings 1, magnet true. One magnet_serving by chidi_okeke was logged after the reload with left 0, which does not match the reading of 1, and I have not worked out why. The probe's own eat step then showed Chidi walking to the cake and eating. player_state 3231 to 3450 bytes (+219). |
| 3 cake down, one slice, reload | 7721 (retry) | FAIL | Chidi took the first slice before the reload: servings 2 to 1, reading 1 before the reload. After reload: cake gone, servings 0, magnet false, no magnet_finished recorded. Jun did not walk to the cake (his walk never started). player_state 3285 to 3305 bytes (+20). |

Answers to the questions for case 3:
- Who took slices before the reload: Chidi (one slice). The probe does not save the reading taken just before the reload, and the second slice is not logged by the probe, so I cannot name who took it.
- Who took slices after the reload: none recorded. The recorder restarts at the reload and logged no magnet_serving after it. The likely explanation is that the last serving went during the 22 s settle, before the reload. That is inference, not measured.
- Did any one NPC take two: not shown. Chidi is the only named eater in the run.
- Servings left: 1 before the reload, 0 after it.
- player_state growth: +20 bytes for case 3, +219 for case 2, +73 for case 1.

Reading: with the perPerson fix in, case 3 still fails the reload check, but the cake was finished before or during the reload, not lost across it. Case 2 shows a serving between the two readings that the probe treats as "untouched". Servings still went during the 22 s settle, even with the five staff calmed. The probe does not record a slice count taken just before the reload, so it cannot say which side of the reload each serving fell.

Not changed: no engine, scenario or probe edits in this pass.

## Voicing review fixes: live check

Checks the three text changes in commit 222be1abe (A31 subject, A35 cooler hint, A36 "Take your time." after "Not yet.") with the probe in g1 mode. Headless, setFPS(20) with fixed steps on, keyless server on :3092 (`env -u GEMINI_API_KEY`). The server ran from the worktree and was stopped by its recorded PID (2297120, `tmp/notyet/server.pid`) after the run. Game 7741 was made with `tools/playtest/new-game.rb` in this run. Raw evidence: `tmp/r2fix/proof-g1-7741.json`. Screenshots: `planning/screens/notyet-*.png`.

Probe change: the m2 check now also requires exactly one "Take your time." bubble after "Not yet." (`takeYourTimeCount === 1`). It counts plain dialogue steps only, because the choice list is appended to the same bubble.

| # | Check | Game | Result | Exact lines seen |
|---|---|---|---|---|
| 2a | Morning, kitchen seen, cooler not heard: "What should I try next?" gives A35 | 7741 | PASS | "Hang about by the water cooler." Not the old "Then open the kitchen door and hang about by the water cooler." Screenshot `notyet-trynext-morning-heard-false.png`. |
| m2 | Call it a day confirm text (A31) | 7741 | PASS | "The staff won't be back once they've gone home. Seen everything you wanted?" with choices "1. Yes, call it a day." and "2. Not yet." Screenshot `notyet-m2-confirm.png`. |
| m2 | After "Not yet.": one "Take your time.", then hub choices, no blank bubble, act_evening false | 7741 | PASS | Bubbles in order: "Take your time." then the hub list "1. What am I looking at? 2. What should I try next? 3. ...". Blank bubbles 0, `takeYourTimeCount` 1, act_evening false. Screenshot `notyet-m2-after-not-yet.png`. |
| m2 | "Yes, call it a day." still sets act_evening | 7741 | PASS | act_evening true after the Yes pick. |
| board | `tour_notice` board fits the modal (carried over from R2) | 7741 | PASS | Screenshot `notyet-board-modal.png`. |

Probe history: the first run on game 7736 returned m2 FAIL. The cause was the new assertion, which matched the bubble text with its speaker name line still attached, so it counted zero. It was fixed to count plain dialogue steps. Game 7736 had moved past the midday state, so the final run used a fresh game (7741). The other checks on 7736 gave the same results.

Probe usage: the header still says `PORT=3094`. The shared lib defaults to 3092, and this run used `PORT=3092`. The header was not changed.

Not changed: no engine or scenario edits in this pass.

## BC1 diagnosis (after train 168)

Verdict: both failures were probe faults. No engine bug, and the accepted limit (the per-NPC `ate` count resets on reload) did not show in either. The servings global, the logged `left` and `magnet_finished` agree in every run.

Cause. After `page.reload()` the needs system exists before any NPC needs state registers (states come with their room). The probe's first post-reload `calm()` ran at that moment, found no states (`__test.needs.ids()` was `[]`) and held nobody. Needs reset to their initial levels on reload, and Graham's social starts at 72 with `urgentAt` 40, inside the cake's tempt band (40 to 85). So on the second or fifth needs tick he walked to the cake and took a serving. The probe's next `calm()` came about 6 s later, when he was already eating. The old recorder was reinstalled only after the 22 s post-reload wait, so it never saw that serving. The case 2 pass before 168 was timing luck.

| Case | Game | What the instrumented old probe saw |
|---|---|---|
| 2 | 7738 | 2 servings just before the reload. Staff ids `[]` at the first calm. Tick 2: Graham `job_start` social on the cake; tick 16: `magnet_serving` Graham, left 1, matching the reading of 1. The `left 0` by Chidi (tick 151) is the probe's own eat step, logged after that reading: the event list was read at the end of the case. |
| 3 | 7742 | 1 serving just before the reload (Chidi took slice 1 at tick 46). Same empty-ids calm. Tick 5: Graham `job_start` social; tick 19: `magnet_serving` Graham, left 0; tick 68: `magnet_finished` when his 12 s use ended. So the last slice went after the reload, to an NPC who had not eaten, and was finished correctly. 168's game 7721 matches this pattern. |

"left 0 next to a reading of 1" (7701, 7738): both are right. They are two servings at different times. The reading of 1 came after Graham's post-reload slice; the `left 0` is Chidi's slice in the probe's later eat step. `_takeServing` (`npc-needs.js` 1054) decrements once, then writes the global and logs `left` from the same value, and it is the only place servings drop.

Probe fixes (`tools/playtest/showcase-bc1-cake-reload.mjs`, commits 4954d5bcd and b1db1c1eb):
- After the reload, one in-page poll every 5 ms waits until every staff member that had a needs state before the reload has one again and sets hunger and social to 100 in that same poll (held at tick 0 or 1 in every run).
- The emit recorder is an init script that hooks the needs system the moment it exists, so the first ticks after a reload are logged.
- A reading, the staff states, the event list and the needs decision log are saved just before `page.reload()`; staff are snapshot at reload and after the wait. All in each result's `diag`.
- `eatBy` names the real eaters from `magnet_serving` events (`eaters`), not only the NPC it nudged (demo_access_tour game 7730 named the wrong one).
- `whereAll` checks each `enterRoom` result, retries after `dismiss()` and reports `unloaded` rooms and `enterFails`, so an unloaded room no longer reads as "cake gone".

Fixed probe, keyless :3094, cases 1 to 3, two runs:

| Run | Case 1 | Case 2 | Case 3 |
|---|---|---|---|
| 1 | 7756 PASS | 7759 PASS: 2/2, Chidi eats (left 1) | 7762 PASS: 1/1, Jun eats (left 0), `magnet_finished`, task completed |
| 2 | 7766 PASS | 7771 PASS: 2/2, Chidi eats (left 1) | 7776 PASS: 1/1, Jun eats (left 0), `magnet_finished`, task completed |

No serving was taken in any post-reload settle. player_state growth: +73, +73, +169 bytes per run.

demo_access_tour (commit ee909e396, read from its raw JSON, not rerun here):
- 7719 and 7643 (case 2): after the reload only reception was loaded, so the read never looked in open_plan. 7643 dropped at the usual (40,23) and failed the same way, so the (40,-33) drop is not what lost the cake. The drop is clamped into `currentPlayerRoom`'s rect (`item-drop.js` about line 297) and was recorded in open_plan; a different stand point after `enterRoom` explains the different spot. Probe fault: the old `whereAll` ignored `enterRoom` failures. The new one reports them. Why `enterRoom` failed there was not measured.
- 7706 (case 3): a staff member took the last slice in the post-reload settle: the same calm fault as here.
- 7730: the accepted limit, with `second.npc` misnamed (fixed: `eaters`).

## BC1 continuous hold

Checks the probe change in 7ebdae49e: after a reload, the staff are held by an in-page interval (every 5 ms) until the eat step releases it. Run from this worktree on a keyless server on :3094, command `node tools/playtest/showcase-bc1-cake-reload.mjs --scenario office_life_showcase --room office --cake cake --port 3094 --cases 1,2,3`, run twice on fresh games. All six cases passed on the first attempt, so no retry was needed.

| Run | Case | Game | Result | Eaters (from `magnet_serving`) | Servings before reload, after reload | `calmedAt` |
|---|---|---|---|---|---|---|
| 1 | 1 | 7851 | PASS | none (cake held, no eat step) | 2, 2 | `{tick: 2}` |
| 1 | 2 | 7858 | PASS | Chidi Okeke (left 1) | 2, 2 | `{tick: 1}` |
| 1 | 3 | 7866 | PASS | Chidi Okeke (left 1), then Jun Watanabe (left 0); `magnet_finished`, task completed | 1, 1 | `{tick: 2}` |
| 2 | 1 | 7875 | PASS | none | 2, 2 | `{tick: 0}` |
| 2 | 2 | 7881 | PASS | Chidi Okeke (left 1) | 2, 2 | `{tick: 2}` |
| 2 | 3 | 7884 | PASS | Chidi Okeke (left 1), then Jun Watanabe (left 0); `magnet_finished`, task completed | 1, 1 | `{tick: 2}` |

Every `calmedAt` was a tick number, so all staff had a needs state before the hold was checked. None came back as `{partial, missing}`. Servings were the same before and after each reload, and each case's own checks (placement, the kept cake, the eat, the finish) passed. `player_state` moved by -248, +73 and -158 bytes in cases 1 to 3, the same in both runs, which is within the 2048-byte limit. The console errors recorded in each result were `net::ERR_FAILED`, which is consistent with the probe aborting `POST /tts` on purpose; no page errors were recorded.

Results are in `tmp/bc1/office_life_showcase-case<n>-game<id>.json` in the worktree. Server: keyless puma on :3094, PID file `tmp/bc1-hold/server.pid`. Logs: `tmp/bc1-hold/run1.log`, `tmp/bc1-hold/run2.log`.
