# office_life_showcase: plan review, round 2

Review of `PLAN.md` and `CAKE_ITEM.md` at d7bc4cf95, checked against the engine, server and validator. Counts: 1 B, 0 M, 4 m, 3 n. The review stopped at its context limit; the last section lists what was not checked.

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

## Not yet checked

- CAKE_ITEM.md: the magnet registration claim (`npc-needs.js:866-881`) and the minimal access-tour variant's numbers.
- The `npc_caught_at_post` window (`npc-needs.js:3371-3383`) and the delayed-mapping wait on an open minigame (`npc-manager.js:921-925`).
- Whether `npc_turned_back:*` wildcard patterns match in NPC `eventMappings`.
- Agnieszka's mug interest timing against the kitchen load (likely fires as soon as the tray's room loads, about 1:30).
- dialoguelint caps file lines, and V5/V7/V10 behaviour on this cast.
- Whether any line contradicts the room beyond n1.
