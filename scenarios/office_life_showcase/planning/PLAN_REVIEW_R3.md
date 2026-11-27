# office_life_showcase: plan review, round 3

Review of `PLAN.md` and `CAKE_ITEM.md` at 08646ad8b, checked against the engine, server and validator. Counts: 0 B, 0 M, 2 m, 4 n. Engine paths are under `public/break_escape/js/`.

## Findings

### m1. Chidi's coffee trip is too short to lock his screen (section 3 cast table, Chidi; 7b C2)

Evidence: `decideLocked` returns false when the leave's estimate is at or under `lockIfAwayOverSeconds` (`systems/workstation-state.js:153-155`). The estimate is the routed walk out and back plus the target's dwell (`_expectedAwayMs`, `systems/npc-needs.js:3332-3360`), at `needsSpeed` (sims' Amara, the source of Chidi, has 90, `scenarios/test_needs_sims/scenario.json.erb:567-568`; the default is 80, `systems/npc-needs.js:5707-5711`). From his post (224, 96) to the approach tile (7, 8), round the east desks, is about 200 to 250 px each way: roughly 5 s of walking plus the coffee's 12 s use, about 17 s, under 20.

Failure: section 3 says "every trip he makes here, coffee or lunch, is longer, so in practice he always locks". On the coffee runs his screen stays open while he is away. Nothing in the task flow breaks (B4 is gated on `act_midday`), and C2 ("If I'll be gone more than twenty seconds, yes.") is true to the habit. But a viewer who tries Chidi's PC during a coffee run finds it open, against what section 3 and Ama's later A9 framing lead them to expect; S3 would also see an unexpected `workstation_screen_changed` pattern if it logs the morning.

Fix: change the section 3 note to "locks for the kitchen trip at lunch; a coffee run (about 17 s) is under his 20 s, so he leaves it open for coffee", which also makes C2 and C3 a small demonstration. Or set `lockIfAwayOverSeconds 10` if the plan wants him always locking (then reword C2 to "ten seconds"). S2 to log `chidi_pc_screen_locked` on the first coffee leave either way.

### m2. BC1 cases 2 and 3 expect a tempted NPC straight after a reload, but nobody is tempted then (section 10 BC1; section 9)

Evidence: a reload resets needs to `initial` (section 9, R6). The midday hunger levels (20 and 62) come from the `act_midday` mapping, which does not run again on reload. Initial hunger is 90 for all four office NPCs; the tempt band is at or below 70 (`systems/npc-needs.js:947-954`), and hunger decays at 5 a minute (Chidi, Jun) or 4 (Graham, Agnieszka), so the first NPC is tempted about 4 minutes after the reload.

Failure: case 2 ("a tempted NPC still walks to it after the reload") and case 3 ("one more NPC eats") wait 4 to 5 minutes, or fail if S3 runs them with a short timeout. The same gap hits a viewer who reloads during midday before dropping the cake: the cake sits for about 4 minutes with nobody walking to it, and A11 gives no hint why.

Fix: in cases 2 and 3, after the reload set one NPC's hunger to 60 with `__test.needs.set` (a test step, not tour content), or wait out the decay with a stated timeout of 6 minutes. Add one line to section 9: "after a reload in midday nobody is hungry enough for the cake for about 4 minutes". The case definitions are otherwise well formed: the server stores the held item's own copy, affordance included, with only `x`, `y` and `position` from the client (`app/models/break_escape/game.rb:1126-1140`); `_addMagnet` reads `cake_servings` (`systems/npc-needs.js:884-893`); `removeMagnet` removes the room object on the server, so case 4 should hold (`:6084-6092`).

### n1. NPC `position` is the feet, not the sprite centre (section 2, "How positions read"; Ama's lanes)

Evidence: `systems/npc-sprites.js:118-126` shifts the sprite so the body centre lands on the position; an atlas body is 20 x 10 px at the feet (`:108-111`).

Effect: Ama's body is x 142 to 162, y 139 to 149 px; the lanes at that height are 34 px west (desk edge x 108) and 48 px east (desk edge x 210), slightly wider than the plan's 30 and 45. Her drawn sprite runs up to about y 64, just under the bookcase's bottom edge (y 66), so it overlaps the door band visually but not physically. Nothing she blocks: no chair, desk or bin footprint sits in her body (map `public/break_escape/assets/rooms/room_office.json`: chairs at x 101 to 133, y 82 to 114 and x 181 to 213, y 60 to 92 in the band; x 218 to 250, y 141 to 173 on the east). Fix: correct the sentence ("the feet, the body centre") and the lane widths; R1 stands.

### n2. The switch-off moment can make a short queue at the kitchen (section 3, "One coffee at a time", third bullet)

Evidence: an `off` turn-back falls back through `_select` with the old target excluded (`TURN_BACK.off`, `systems/npc-needs.js:170-178`; `_turnBack`, `:2062-2104`); the queue fallback takes the excluded id out too (`:4952`). Two or three NPCs turned back together all pick `kitchen_coffee` (capacity 1), so the second and third queue there and emit `npc_queued:kitchen_coffee`.

Effect: "no queue forms" holds only for the following runs (the Jun coupling matches `office_coffee` only). No mapping reads `npc_queued:kitchen_coffee`, B2 is spent already, and queue chat at the kitchen is a bonus. Fix: "no queue forms on later runs; the people turned back at the switch-off may queue once at the kitchen machine".

### n3. `npcInkVariables` holds none of Ama's mirrored VARs (section 8, last table)

Evidence: `exportNpcInkVariables` and `recordInkVariables` skip every declared global (`systems/npc-conversation-state.js:258`, `:331`); the six mirrored VARs travel only in `globalVariables`.

Fix: row count 0 (or only Ama's ink-local VARs, of which the plan declares none). No budget change.

### n4. The sandwich pool line is 38 characters (section 7e)

"Have you tried the new sandwich place?" is 38 characters, 7 words; round 2 gave 36. Under the 40 cap. Fix: none needed beyond the count if section 7e lists one.

## Checked and confirmed

- One coffee at a time. `requiredGlobalsHold` compares with `===` (`systems/npc-needs.js:312-318`); `_isOff` uses it and records the state (`:832-840`); off sources are no candidates (`:1739`) and no queue targets (`:4952`). With `office_coffee_off: false` declared, `kitchen_coffee` is off at load, so Jun and Zainab queue at the office whether the kitchen is loaded or not. A walker or queuer turns back with `off` when its target's `offWhen` holds (`:3486-3491`); one already using finishes. `onGlobalChanged` is wired to `global_variable_changed:*` (`:6137-6141`) and wakes parked needs when a seen source turns on (`:807-830`), so switching the office coffee off brings the kitchen machine on in the same event; the turned-back NPCs go there through the fallback, or park and wake when the kitchen loads (`_wakeParked`, `:2016`, called on room load at `:1272`). Switching it back on turns walkers and queuers at the kitchen back to the office the same way. The evening `setGlobal` writes the global and emits (R10), switching the kitchen machine off; nobody but Zainab is visible then. The object form passes the schema and `check_off_when` (R12).
- Jun's coupling: `npc_left_post` carries `targetId` (`:3274-3278`), so `data.targetId === 'office_coffee'` misses kitchen runs.
- Lunch gate bridge. Only declared globals (or `global_` names) reach ink (`isGlobalVariable`, `systems/npc-conversation-state.js:461-472`; recorded from the scenario's `globalVariables` before the save merges, `core/game.js:1729-1735`). Workstation globals are written by the live env's `setGlobal`, which writes `gameState` and emits but does not push into loaded stories (`systems/workstation-state.js:690-696`); stories take them at conversation start (`syncGlobalVariablesToStory`, `npc-conversation-state.js:498-515`, called from `minigames/person-chat/person-chat-minigame.js:560`, `:591`). So R13 is real and the plan's handling (A29, close and reopen) is right. They are booleans, published as a pair on every leave and return (`_publish`, `:531-535`) and reset to false on load (`resetGlobals`, `:493-513`); the validator already counts them as workstation globals (`scripts/validate_office_life.rb:545`, `:786`), and declaring them silences the ink "read but never set" check (`scripts/validate_scenario.rb:5231-5243`).
- Return unlocks: `onReturned` sets `screenLocked = false` and publishes (`systems/workstation-state.js:569-588`), so the lunch leave re-rolls from an open screen and a lock is a change, which emits `workstation_screen_changed` with `how: 'leave'` (`:537-555`). The kitchen lunch trip is well over 20 s, so Chidi locks and B4 fires.
- Ama at (4.75, 4.5) blocks no desk, chair or the west door; see n1 for the corrected footprint.
- BC1: well formed apart from m2 (server copy at `app/models/break_escape/game.rb:1126-1140`; `position` permitted with x and y only, `app/controllers/break_escape/games_controller.rb:3756-3763`, so the table re-raise in `_addMagnet` is what puts it back on a table).
- Sync budget: onceOnly is counted for `onceOnly: true` mappings on an office-life event or with a needs action (`scripts/validate_office_life.rb:797-799`, prefix list `:50-56`), warning only above the cap (`:813-818`): B2, B3, B4, B5, B6, B7, B9, B11 make 8 of 10. A builder who adds `onceOnly` to Zainab's evening caffeine mapping (it carries `needs`) would make 9; still under.
- New and changed lines: A29 63/13, A30 52/9, A8 82/15, A16 54/10, A20 65/13, C2 46/9, C3 46/9, N1 41/8 (ink, all under 30 words); B10 38 characters, 8 words (bark, under 50/12); sandwich line 38 (under 40). Room consistency: B10 is said in the office where she goes for the coffee; A29 fits either absent NPC; N1 no longer assumes mugs.

## Round 2 findings

- B1 (nobody queues once the kitchen opens): resolved. The `offWhen` object form is in section 2 with the global declared; section 3, "Late viewers" and T6b follow it. See n2 for the one wording gap.
- m1 (Ama on Chidi's door line): resolved. New spot off the band, fallback named, door cell recorded.
- m2 (R10 settled from code): resolved.
- m3 (condition grammar sentence): resolved (section 4 intro).
- m4 (credits path cannot conclude): resolved (section 6).
- m5 (mug run timing and A8 order): resolved (row 1.6, A8 before A7, R9).
- m6 (lines about vanished mugs): resolved for N1; A8 is still in the morning list after the mugs have gone, which the reorder accepts.
- n1 (C2 against the habit): resolved in C2's wording; the section 3 claim that grew from it is now m1 above.
- n2 (B4 needs a fresh leave): resolved by the lunch gate.
- n3 (R2 settled): resolved.
- n4 (stale validator warning): resolved in CAKE_ITEM.
- n5 (A20): resolved.
- n6 (printer line, B10): resolved.

## Not yet checked

- Whether the pathfinder treats Ama's body as a held cell for NPC routes (S1's walk check covers it).
- Jun's walk back from the west door to his desk at (3, 6) passes down the west lane beside Ama; not traced on the nav grid.
- dialoguelint and V7 were not re-run on the changed lines this round; counts were checked by hand.
