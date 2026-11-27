# office_life_showcase: plan review, round 4 (delta)

Review of the round 3 fixes, `git diff 0b63de72d..733fb8200` on `PLAN.md` (only file changed), at 4fd3a68b9. Counts: 0 B, 0 M, 1 m, 3 n. Engine paths are under `public/break_escape/js/`.

## Findings

### m1. Ama is a movable body in the aisle; W1 and the lane widths assume otherwise (section 2, Ama's spot; S1 checks W1 and W2)

Evidence: an NPC body is pushable unless `behavior.immovable` is true (`systems/npc-sprites.js:138-141`), and every NPC gets a collider against every other NPC (`:1140-1153`, callback `handleNPCCollision` sidestep, `:1402-1509`). The plan gives Ama `facePlayer` only (section 3 table, Ama row) and says nothing about immovable. The NPC grid holds static bodies and immovable dynamic bodies only (`systems/npc-pathfinding.js:374-380`), so while she is movable the "pathfinder's route round Ama's body" in W1 does not exist: walkers path straight through her cells and meet her in physics. With no needs and no home she has nothing that walks her back to (152, 144) if a walker shoves her. The player's search does keep a berth round movable NPCs (2 cells either side, `:429-445`), which is a separate effect.

Failure: Chidi, Jun or Zainab brush her on the way to the kitchen; she drifts a few pixels each time (drag 0.01 stops her quickly, but nothing restores her), or a walker stalls against her. Conversely, if the builder fixes this by adding `"behavior": {"immovable": true}` (the pattern in `scenarios/lab_physical_pentest/scenario.json.erb:962`), she becomes a grid obstacle and `markBlocked` pads every body by one 8 px cell each side (`systems/npc-pathfinding.js:354-369`). The lane numbers in section 2 then shrink by about 16 px (more with cell rounding): the primary west lane of 34 px leaves roughly one open cell, the east lane of 48 px about 3, and the fallback east lane of 24 px closes. W2 (Jun walks the west lane beside her) and the fallback's "34 px clear" arithmetic then need re-doing.

Fix: add `"behavior": {"facePlayer": true, "immovable": true}` to Ama in section 3 and say why (she stands in an aisle on walkers' routes and has no home to return to). Reword W1 to "the NPC grid treats her as an obstacle, so every lunch walk, kitchen trip and mug run routes round her". Restate the lanes as pathable widths (lane minus 16 px) in section 2. W2 then confirms Jun gets through the west lane at the primary spot, and the fallback is judged on its west lane (about 58 px physical, 58 minus 16 pathable) with the east lane called closed.

### n1. S2 does not log Chidi's coffee-leave lock (section 3 Chidi row; S2)

Evidence: R3 m1 asked for S2 to log `chidi_pc_screen_locked` on the first coffee leave either way; the diff changed only the threshold and C2. With `lockIfAwayOverSeconds 10` the coffee's own `useSeconds 12` (`data/office-presets.json:5`) exceeds the threshold before any walking is counted (`_expectedAwayMs` adds the dwell, `systems/npc-needs.js:3350-3360`), and a null estimate counts as long (`systems/workstation-state.js:156-157` only bypasses on a number), so the lock cannot be missed. Fix: add "log `chidi_pc_screen_locked` on his first coffee leave" to S2's proof.

### n2. W1 and W2 are in S1 only (section 10 test table, T2)

T2 and R1 still name only the render and the two walks. Fix: add "W1, W2" to T2's S1 proof so the table and the slice agree. Also correct "about 56 px" in S1 to 58 px (body x 166 to 186, west desk edge 108).

### n3. Chidi's chime now plays on every coffee run (section 4, row 2.2)

Row 2.2 presents "a soft chime if sound is on" as the lunch novelty. `onLeft` emits the change with `how: 'leave'` on every lock (`systems/workstation-state.js:537-555`), so the chime also sounds at about 0:50 and at the second coffee run. No mapping reads it before `act_midday` (B4 is gated), so nothing breaks. Fix: none needed, or add a half sentence to row 1.3 so S2 expects the chime.

## Round 3 findings

- m1 (Chidi's coffee trip too short to lock): resolved by threshold 10. Checked: Chidi's PC sets no `lockChance` or `locksScreenOnLeave` (section 2, desk machines), so the habit is read (`systems/workstation-state.js:131-160`); the sims template habit is threshold only (`scenarios/test_needs_sims/scenario.json.erb:567`), so `habit.lockChance` is not a number and the code returns true at `:159`; the 12 s coffee dwell alone exceeds 10 s. The lock is rolled inside `onLeft` and `workstation_screen_changed:chidi_pc` is emitted in the same call with `locked` and `how: 'leave'` (`:537-555`, `_changed` at `:204-206`), before B4's condition is evaluated against `act_midday`. C2 ("ten seconds", 43 characters, 9 words) and C3 read true. No other "twenty seconds" about Chidi remains (G3 is Graham's, correct).
- m2 (cake after a reload, not hungry): resolved. `__test.needs.set(npcId, need, level)` matches (`systems/test-bridge/index.js:2220`, goes to `control` set, `systems/npc-needs.js:1133-1146`). 60 sits inside the band: hunger `urgentAt` 40 plus tempt 30 is 70, and 60 is above 40. Jitter defaults to 0 (`:371`), so the 90 start and the "about 4 minutes" (5 per minute to 70) hold; Graham and Agnieszka at 4 per minute take 5. Sight on room load is at `:963-966`.
- n1 (position is the feet): resolved in section 2; body and lane numbers (34 west, 48 east) match the map. See m1 above for the movable-body consequence.
- n2 (queue at the switch-off): resolved in the section 3 bullet.
- n3 (npcInkVariables): resolved, row 0 matches `systems/npc-conversation-state.js:258` and `:331`.
- n4 (sandwich line count): resolved, 38 shown.

## Checked and confirmed

- Fallback spot (176, 144): body x 166 to 186, y 139 to 149; east desk edge x 210 gives 24 px (the plan's new figure is right); the chair at x 181 to 213, y 60 to 92 is above the body. West lane about 58 px, not 56 (n2).
- Changed spoken lines: only C2 changed (43 characters, 9 words, under the 15-word choice and ink caps) and is listed in the table. No new lines in the diff.
- Sync table: boolean and bounded keys unchanged; `triggeredEvents` 9 against onceOnly row 8 is explained by B1.
