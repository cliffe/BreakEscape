# office_life_showcase: plan review, round 2

Review of `PLAN.md` and `CAKE_ITEM.md` at d7bc4cf95, checked against the engine, server and validator. Counts: 1 B, 0 M, 6 m, 6 n. Written in two sittings; the second covered the first sitting's "Not yet checked" list (m5, m6, n4 to n6 and the second Confirmed list).

## Findings

### B1. Once the kitchen is open, nobody queues at the office coffee again (sections 3, 4 rows 1.3, 1.8, 1.9, "Late viewers"; T5, T6)

Evidence: `_useCandidate` (`public/break_escape/js/systems/npc-needs.js:1733-1794`) takes a free, reachable source first and only falls back to a queue when there is none (`:1778-1785`); `_free` counts Chidi's walking claim as taking the machine (`:1580-1587`, `:1596-1599`). Sims says the same in its brief and object comment (`scenarios/test_needs_sims/scenario.json.erb:2`, `:310`): whoever misses the office station walks to the kitchen; only with the kitchen shut do they wait in line.

Failure: the coupling sets Jun's caffeine on Chidi's `npc_left_post`; once the kitchen has loaded (row 1.5, about 1:30), Jun finds `kitchen_coffee` free and walks there. No `npc_queued:office_coffee`, so Zainab's coupling never fires either. The second run at 3:35 (row 1.8) is Chidi alone; T6 fails; "the coffee run repeats... so 1.3, 1.4 and 1.9 can happen on any run" is false after the kitchen opens. A viewer who opens the kitchen before 0:50 (A7 invites it; nothing locks) can never tick `see_queue` or `hear_queue_chat`. `see_coffee_off` still ticks, on Chidi alone.

Fix: give `kitchen_coffee` `"offWhen": { "office_coffee_off": false }`. The object form is supported (`requiredGlobalsHold`, `npc-needs.js:312-318`, used by `_isOff`): the kitchen machine is "off" exactly while the office one is on. Then Jun and Zainab always queue at the office; when the viewer switches the office coffee off, the kitchen machine comes on and the turned-back NPCs go there as row 1.9 and T7 say; the evening switch-on keeps Zainab out of the kitchen as before. Declare `office_coffee_off: false` in `globalVariables` (section 8 already lists it; the object form compares with `===`, so an undeclared key would leave the kitchen machine on). Optionally add a `spriteVariants` "off" look to the kitchen machine. Re-word "Late viewers" and add a T6 variant with the kitchen opened before 0:50.

### m1. The west door's position is known; Ama sits on Chidi's line to it (section 2 positions, handover, R1)

Evidence: a single west connection puts the door at 0.5 tiles in and 2.5 tiles down from the room's corner, local px (16, 80) (`public/break_escape/js/systems/doors.js`, `placeWestDoorSingle`). Ama at px (152, 104) stands in the band between the bookcase (bottom y 66) and the desk tops (y 117), on the straight line from Chidi's post (224, 96) to the door.

Failure: Chidi's lunch walk (row 2.2) and the morning trips of anyone east of the aisle must route round her, by the aisle top or the 30 px gap under the bookcase. Probably passable, not proven.

Fix: record the door cell in section 2 and drop it from the handover. Keep R1's S1 check, and name a fallback spot in the plan now (for example lower in the aisle, nearer y 4.5, clear of the desk tops) so S1 does not have to design one.

### m2. R10 is settled from code (section 10 R10, handover)

Evidence: the socket's two `confirm_action`s read the condition at click time against `window.gameState.globalVariables` (`public/break_escape/js/systems/apply-actions.js:142-145`). A mapping's `setGlobal` writes that same object and emits `global_variable_changed:<name>` (`systems/npc-manager.js:1500-1512`), and sprite variants re-render on that event (`core/rooms.js:712-737`). After the evening mapping sets `office_coffee_off` false, the next click offers "Switch off" and the plug shows on.

Fix: mark R10 as settled by code; keep one S4 click as a check, and drop it from the handover.

### m3. Conditions use the mapping grammar; say `value === true` is the event's value (sections 4 row 3.1, 7d B10)

Evidence: `safeEvaluateCondition` (`systems/npc-manager.js:25-130`) supports `value`, `data.x`, `globalVars.x`, `!==`/`===` and `&&` joins; `global_variable_changed` carries `{ name, value }` (`systems/global-writer.js` emit, step 4). Every condition in the plan fits this grammar, so nothing is broken. A builder who writes `data.value === true` also works; one who writes `||` or parentheses does not (unsupported term, logged and false).

Fix: one sentence in section 3 or 6: "Mapping conditions are `&&` joins of single terms only (no `||`, no parentheses)."

### m4. The credits path cannot conclude this mission either (section 6)

Evidence: the client's credits post goes to `conclude_mission!`, which returns `concluded: false` at once when no aim has `missionConclusion` (`app/models/break_escape/game.rb:7626-7628`); `check_mission_conclusion` returns at once for any other aim (`:6791-6793`). These are the only two writers of `mission_concluded_at`, `status = 'completed'` and `completed_at` in `app/` (`:6805-6807`, `:7648-7650`).

Failure: none; section 6 says a `music` credits event "posts the conclusion", which overstates it. With no `missionConclusion` aim the server can never conclude, whatever the client does; only the credits screen would still show.

Fix: reword section 6: the server concludes only through a `missionConclusion` aim; leaving out `music` keeps the credits screen away. T23 stands as written.

### n1. Chidi's C2 does not match his habit (section 7b, section 3)

Evidence: `habits.screen.lockIfAwayOverSeconds 20` with no `lockChance` locks only when the expected trip is over 20 s (`systems/workstation-state.js:148-152`).

Fix: C2 "Every time I get up" overstates it; for example "Every time I'm gone more than a minute." Or keep C2 and say in section 3 that every trip of his here is long enough to lock.

### n2. B4 needs Chidi to leave from his post on the lunch trip (section 4 row 2.2)

Evidence: `workstation_screen_changed` fires only from `onLeft` on `npc_left_post`, and only when the lock state changes (`systems/workstation-state.js:537-555`). If "Let's do lunch." lands while Chidi is out on his 3:35 coffee run, his hunger job may start without a fresh leave from the desk, and B4 does not show for that lunch. Not traced whether the needs system sends him home between the two jobs.

Fix: S3 to note whether B4 shows when lunch is called during a coffee run; A9 still says the same thing without it.

### n3. R2 is likely settled (section 10 R2)

Evidence: `_wakeParked` (`npc-needs.js:2016`) retries every parked need when a room loads or a door opens.

Fix: keep the S2 check; cite the function.

## Confirmed

- Coffee arithmetic (R3): Chidi 61 at 25/min reaches 40 at about 0:50; decay pauses only for the need in use (`npc-needs.js:1548-1552`); restore at use end (`:3663-3665`) caps at 100; 100 to 40 at 25/min is 2:24, so the second run lands about 3:33 to 3:35. His work need (urgent 2:12, a desk use) and hunger do not collide with it.
- Jun's queue entry: Chidi's claim counts from job start (`_claims`, `:1580-1587`), so Jun's select (after `npc_left_post`, emitted with `targetId` at `:3274-3278`) finds the machine taken and, with no free source, queues; `npc_queued` is emitted at `:3187-3190`. Queue cells are offsets from the approach cell (`:4905-4916`).
- Queue chat pairs the user with the front queuer only while the user is using and the front stands within the chat radius (`:5025-5058`); Zainab as front with Jun is silent (`_compatible`). Earshot is the object's `overhearRadius` (`:3005-3010`).
- Exchange: starts only with the first speaker in earshot and holds both uses to its end (`:3012-3043`, `:4440-4448`); heard sets `heard_<knot>` and emits `npc_exchange_heard` (`:3053-3072`).
- Workstations: `workstation: true` plus `owner` makes a station (`workstation-state.js:109-119`); Graham's `lockChance 0` habit returns false (`:155-160`), so his `autoLockSeconds 20` does the locking.
- Open ending: see m4; nothing else in `app/` sets `mission_concluded_at` or `status = 'completed'`.
- Evening hide: `setVisible` records visibility, unseats a sitter and saves it for reload (`systems/npc-behavior.js:384-430`, `systems/npc-manager.js:2204-2226`); each hide mapping must sit on the NPC it hides (the action applies to the mapping's own NPC, `npc-manager.js:1656-1659`). Lighting variants re-resolve and switch mode without a strike (`systems/lighting.js:788-805`); motion sees only visible NPCs and only the player's exit arms the off timer (`:1031-1044`, `:1159-1168`).
- Sync budget: onceOnly row counts `onceOnly` mappings on office-life events or needs actions (`scripts/validate_office_life.rb:797-799`), warning only above the cap (`:813-818`); B2, B3, B4, B5, B6, B7, B9, B11 make 8 of 10. Workstation globals count 3 per owned station (`:786`).
- Spoken lines: every character and word count in section 7 recounted and matches; longest ink line 16 words, pool and exchange lines all at most 37 characters, barks at most 49.

### m5. Agnieszka's mug run starts the moment the kitchen first loads, from her desk (section 4 row 1.6, A8, R9)

Evidence: an NPC with `interests` selects every tick it is idle (`npc-needs.js:1659`, `:1524-1526`); the interest candidate needs the tagged item in her home room and a free object that `accepts` the tag among the loaded objects (`_carryCandidate`, `:3105-3121`), and scores the flat interest weight, ahead of any need that is not urgent (`:1717-1723`). Agnieszka has no work need, so she sits idle at her post. The tray is in the kitchen, which loads only when its door opens (`systems/doors.js:875-886`); the load clears every back-off (`_onRoomsLoaded`, `:1270-1274`).

Failure: no trip is involved and the timing is controlled: she sets off within a tick or two of the viewer opening the west door (about 1:30), and walks into the kitchen behind the viewer with the mugs. "On a trip out of the office, any time" (row 1.6) and R9's "timing is not controlled" are wrong. A8 sits after A7 in "try next, morning", so a viewer who follows the order opens the kitchen first and never sees the mugs on the desks being collected.

Fix: row 1.6 "about 1:30, as the kitchen first loads: Agnieszka carries the mugs in behind the viewer and puts them on the tray"; move A8 before A7 and reword it to say so ("Before you open the kitchen, note the mugs by the desks. Someone can't stand them."); settle R9 from code and keep S2's timing log as the check.

### m6. Two lines talk about mugs that have gone (sections 7a A8, 7b N1)

Evidence: from m5, the mugs leave the office at about 1:30 and never come back. N1 is Agnieszka's start line, heard whenever the viewer first talks to her; A8 stays in the morning hint list all act.

Failure: "Mind the mugs, they've been there since Monday." and "keep an eye on those mugs by the desks" are both said to a room with no mugs in it for most of the tour.

Fix: reword N1 so it does not assume the mugs are there (for example "Hi. Somebody has to keep this place tidy."), keeping N2 and N3 as the explanation. For A8, either the reorder in m5 (the hint comes before the kitchen opens) or a gate on an ink-synced `mugs_cleared` global set by the B11 mapping; the reorder costs no global.

### n4. CAKE_ITEM's "start it in a room" drift trips a stale validator warning (CAKE_ITEM "Two ways to drift", point 1)

Evidence: the engine registers a magnet lying in a room when the room loads (`scanMagnets`, `npc-needs.js:872-881`, called from `_onRoomsLoaded`, `:1274`), and every NPC in that room learns of it by sight on its next tick (`_sight`, `:958-970`, called each tick at `:1416`). So CAKE_ITEM's claim holds. `validate_npc_needs.rb:275-277` still warns "only a dropped magnet is built ... so it draws nobody" for any magnet not in the start inventory, which is no longer true; V10's `fixed_magnet?` (`validate_office_life.rb:996-998`) already treats a room magnet as live.

Fix: add one line to CAKE_ITEM point (1): "the validator still warns that such a cake draws nobody; the warning is stale." Neither scenario takes that route, so no build change. A one-line validator fix can go to the engine backlog.

### n5. A20 says machines take one at a time; the viewer has just seen two at the cooler (section 7a A20)

Evidence: row 1.7 has Graham and Agnieszka using the water cooler together for the exchange; the cake takes three (`capacity 3`).

Fix: "The coffee machine takes one at a time, so people queue and chat." (10 words).

### n6. Two lines name things the tour does not have (section 7e `cooler` pool, 7d B10)

Evidence: copiers and printers are dropped from the office (section 2); Ama stays visible in the evening (section 4, all task mappings sit on her).

Failure: the copied cooler line "That printer jammed again." points at a printer nobody can find; B10 "Quiet now. Just me and the coffee." is said with Ama standing in the same room. Both are small, and pool lines are heard at random.

Fix: replace the printer line with another sims-style one (for example "Have you tried the new sandwich place?", 36 characters) and make B10 "Quiet now. Just the coffee and me." or name Ama ("Quiet now. Just me and Ama."). Count V7 again after the change.

## Confirmed (second sitting)

- CAKE_ITEM, engine: the cited lines match the code (`onItemDropped` `:850-863`, `_addMagnet` servings from the `<id>_servings` global `:884-893`, `_takeServing` `:1047-1057`, `_finishMagnet` `:1090-1097`). A tempted need is one above `urgentAt` and at or below `urgentAt + tempt` capped at 95 (`:947-954`, `:1666-1677`), so the access-tour numbers hold: hunger 0.5/30/50 sits in the 30 to 60 band at load and reaches 30 after 40 minutes; `normaliseNeed` keeps 0.5 (floor 0.01, `:359-373`). Sight needs only the NPC in the magnet's room (`:958-970`); idle NPCs at their post sit (`systems/seating.js:2016`). The guard bark's `cooldown` is a mapping field (`npc-manager.js:1279-1283`) and `data.roomId !==` fits the condition grammar.
- CAKE_ITEM, snippet: every affordance and magnet key is in the schema (`scripts/scenario-schema.json:3962-3992`, `additionalProperties: false`); `droppable` is an item field (`:5644`). `check_magnets` (`validate_npc_needs.rb:262-300`) passes it: droppable and held (no room), a fixed id, no `needsTag`, numbers in range, `cake_servings` declared at 2, both satisfied needs present once a scenario gives NPCs hunger; `announce "news_cake"` needs the scenario-level pool, which CAKE_ITEM lists.
- Caught window: `_checkCaught` runs on every tick of a return in the home room, as `returning` or as a job for the own post (`npc-needs.js:1473`, `:1478`); radius 48 px (`:74`); `playerAtPost` treats a minigame whose params name `jun_pc` as at the post (`:5689-5701`). With `needs.set.work 5`, Jun's walk back is a job for his own PC, so the `:1478` branch covers it. The window is the whole walk from the west door to his desk, about 3 to 4 tiles.
- Minigame wait: a delayed mapping that falls due with a minigame open re-arms itself until it closes (`npc-manager.js:915-934`); B8 (no delay) is held by the bark queue. Row 2.5 and A10 are right.
- Wildcards: `NPCEventDispatcher.emit` calls every listener whose key ends in `*` and whose prefix starts the event name (`systems/npc-events.js:45-58`); eventMappings register through it (`npc-manager.js:842`). Sims already uses `npc_turned_back:*` twice (`scenarios/test_needs_sims/scenario.json.erb:619`, `:621`), and the validator's own matcher does the same (`validate_scenario.rb:1088`). The off turn-back emits with `reason` (`npc-needs.js:2075`, `:3490`).
- B1's fix: `_isOff` reads object-level `offWhen` through `requiredGlobalsHold` (`npc-needs.js:312-318`, `:832-840`, adapter `:5603`), which accepts `{ name: value }` with `===`; `onGlobalChanged` re-reads every seen `offWhen` naming the global and wakes parked needs when one comes on (`:807-830`), so switching the office coffee off brings the kitchen machine on in the same step. The schema allows the object form (`scenario-schema.json:5481`); `check_off_when` (`validate_npc_needs.rb:442-466`) wants the key declared and set somewhere (the socket's `set_global` does), and V10 counts any truthy `offWhen` for `grumble_off` (`validate_office_life.rb:1448-1452`).
- dialoguelint: all 49 ink lines of section 7a to 7c run through `scripts/ink_runtime_check/dialoguelint.mjs` as a test file: no cap, tell, spelling or style finding; longest 16 words. The 11 barks, 8 pool extras, 18 copied pool lines and 8 cake lines, run the same way: no finding. (The only output, a crowded-hub check, came from the test file putting all 13 choices in one knot.)
- V5 runs only for the ten campaign missions (`validate_office_life.rb:33-38`, `:104-106`); it does not run here, and no task is required anyway.
- V7 (`:681-744`): no pool line repeats another, a bark or an ink opener word for word.
- V10 (`:877-1000`): every pool has a speaker. `coffee` and `cooler` pair through the queue and the cooler; `cake` pairs at capacity 3; `news_cake` passes for any held magnet (`news_tellers`, every running NPC); `grumble_off` needs an `offWhen` source, which both machines have after B1; `grumble_gone` needs a magnet some NPC can eat. The same pools give no V7 or V10 finding on sims today.

## Not yet checked

- Whether Jun leaves at about 4:05 if "Let's do lunch." lands part way through a desk use (`npc-needs.js:1509-1513` suggests he finishes the use first); row 2.3's time may slip by up to one work use.
- R7 (a dropped cake's position after reload) stays an S3 measurement; not traced in code.
