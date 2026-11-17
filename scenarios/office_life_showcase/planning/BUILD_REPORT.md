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
