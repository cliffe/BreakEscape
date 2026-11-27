# m03 office life: slices 3 and 4 handover

Status: nothing built yet. This agent spent its budget reading; no scenario file was edited. A fresh agent starts slice 3 from here. Branch build/ol-m03, tip 1aa6c02a3 before this note.

## Facts gathered (so the next agent need not re-read)

- Assets live under `public/break_escape/assets/` (characters, rooms, objects), engine JS under `public/break_escape/js/`. Sprite keys `zainab_hussain` and `yusuf_demir` exist with walk atlas, headshot, talk and visemes. Zainab is already used by `scenarios/ca20_remote_and_mobile_working`.
- Reception Tiled map `rooms/room_zds_reception.json` (10x10 tiles of 32 px; Tiled object y is the bottom edge). Objects: coffee_station1 id 10 at (262,230) size 26x41; leather_sofa1 id 11 at (129,266) 62x38, so top-left (129,228), places (19,25) and (43,25) give west seat about (148,253), east (172,253); club_chair_e1 id 13 at (90,300) 36x46, seat offset (16,26), so foot about (106,280); glass_coffee_table1 id 12 at (134,302) 52x30, top y 272; club_chair_w1 id 14 at (194,300); counter id 1 at (112,116) 110x44; phone4 table item. laptop1.png is 24x18, water_cooler1 24x47 (hallway, Tiled (192,74)).
- Presets (`js/data/office-presets.json`): coffee useSeconds 12, restores 70, capacity 1, useFrom (0,1), queue cells (-1,1),(-2,1); cooler useSeconds 15, capacity 2, useFrom (0,1). `laptop` IS a desk_pc preset type, `laptop1` is not: use `"type": "laptop1"` for `zainab_laptop`. Undeclared sofa and chairs take no preset.
- Declare Tiled decor with no `position` (m02 `staff_boiler` pattern, `scenarios/m02_ransomed_trust/scenario.json.erb` about line 3640): `{type, id, name, takeable:false, offWhen, affordance:{capacity, chatter, queue, useSeconds, restores, overhearRadius, useFrom}}`. NPC `position` is in tiles; `needsHome` is an object id or `{room,x,y}` tile. Calibrate tile coordinates live (read sprite x,y through `window.npcNeedsSystem` / `__test`).
- Workstation globals derive from the object id: `zainab_laptop_owner_away`, `zainab_laptop_screen_locked`. Model on `scenarios/test_needs_sims` amara_pc (`workstation:true`, `owner`, `observationVariants`).
- `decideLocked` (`js/systems/workstation-state.js:157`): with no object lockChance, the habit decides; `expectedAwayMs <= lockIfAwayOverSeconds*1000` keeps it open, otherwise `lockChance` (1) locks. Habit written as `"habits":{"screen":{"lockChance":1,"lockIfAwayOverSeconds":N}}`.
- m03 scenario: reception NPCs array starts ~line 616 (`briefing_cutscene`) ... `ffion_rees` ~701 ... `agent_0x99` phone NPC ~765 whose `eventMappings` (append HaX texts and attack mappings at its end, m02 `scenario.json.erb:1376-1412` pattern, appended last so saved onceOnly indexes do not move). `night_transition` NPC ~line 1366; `clone_call_done` set on `conversation_closed:night_transition`. Credits list at lines ~193-232 (add `warning` lines near the Ffion KO line 228). `globalVars` block ends ~2093; add the new bounded keys there. `officePresets: true` goes at scenario top level (m02 line 623).
- Hide mappings (plan section 2): mappings 1 to 3 plain; mapping 4 `room_entered:reception_lobby` and `room_entered:main_hallway`, onceOnly, condition `globalVars.mission_phase === 'act2_infiltration'`. The first-frame check (STAGE1_CHECKS.md) says use `data.previousRoom === null`, not `== null`, if any condition tests it.
- Ink: placeholders only, not voiced, no new spoken text. Create `ink/m03_npc_zainab_hussain.ink` and `ink/m03_npc_yusuf_demir.ink` with one clearly marked placeholder line and `-> END`; compile with `scripts/compile-ink.sh m03_ghost_in_the_machine` (needs `bin/inklecate`), lint with `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m03_ghost_in_the_machine/`. Chatter pools, exchanges and barks are slice 5 (wait for D61); leave them out.
- Live tooling: `tools/playtest/new-game.rb`, `session-start.sh`, `verify-run.rb`; templates `tools/playtest/needs-sims-staff-room.mjs` (events capture, `__test.enterRoom`, `moveToNear`, setFPS(20)) and `hidden-hostiles-music-proof.mjs`. A keyless log exists at `tmp/keyless-3091.log`; no server on :3091 was running when last checked (unverified). Playwright path in the template points at another worktree's node_modules; use this worktree's.

## Decisions reasoned but not yet applied

- Lock threshold: coffee expectedAwayMs is 14.6 s and real 17.25-18.5 s; cooler expected 23.1 s. Raising `reception_coffee` `useSeconds` (preset 12) by about 4 to 5 s lifts real coffee away to 21-23 s and expected to about 19-20 s, so choose `lockIfAwayOverSeconds` after re-measuring, between the new coffee estimate and 23.1 (about 21 s). Coffee trip then leaves the laptop open for 20 s or more; the cooler trip (expected 23.1, real 28-54 s) locks. Apply the raise only on the `reception_coffee` object.
- Zainab 54 s cooler return (2 of 5): not investigated. Her cooler use starts 5 s after leaving; Yusuf waits behind her. Suspect the second-user cell or the doorway north (reception to hallway) jamming with the queue; check `npc_queued`, `npc_turned_back`, position samples every 400 ms, and the `queue.cells` and `useFrom` against the door gap.
- Doorway clearance of lanes still to do for reception to hallway.

## Not done

Slices 3 and 4 in full, all plan checks, live checks, suites, the commits per slice. Report this handover to the caller.

## Slice 3 results (built; commit 41100e95a plus a spawn tweak)

Built in scenario.json.erb: `officePresets`, `reception_coffee` (coffee_station1, useSeconds 17, offWhen wh_staff_upset), `hallway_cooler` (water_cooler1 in main_hallway, offWhen wh_staff_upset), `zainab_laptop` (laptop1, affordance false, no habit yet), NPCs `zainab_hussain` (needsHome zainab_laptop) and `yusuf_demir` (needsHome tile 3.47,8.38 in the club chair), needsRooms reception_lobby + main_hallway, group wh_day_staff, hostile leash, globalVarOnKO zainab_ko / yusuf_ko. Each has four hide mappings (clone_call_done change onceOnly, room_entered reception and hallway plain, first-frame `previousRoom === null` one). `wh_staff_upset` is set by appended agent_0x99 mappings (npc_attacked, both KO globals, receptionist_ko before the night turn). Credits warnings added. Placeholder ink files compile.
Checks: ink compiles (0 failed), validator 0 errors (12 warnings, all new ones from the two NPCs: cooler has no chatter lines, queue cells outside room because the sprite is Tiled-claimed, V4 attack probe not yet passed), `--office-summary` diff = the two new NPCs only, lock_key_diff empty, door alignment OK.

Measured (live, game 6482, keyless :3091, bridge `needs.set` to force each trip, player parked at reception door):
- Coffee, 5 trips: real away 22.5 to 24.2 s, expectedAwayMs 19263 to 20556 (with useSeconds 17).
- Cooler alone, 4 clean trips: real 34.2 to 37.5 s, expectedAwayMs 22134 to 22932.
- Cooler paired (both thirsty): real 38.5 to 53.2 s, expectedAwayMs 24054 to 24618.
- Recommended `lockIfAwayOverSeconds` 21.3 (coffee max 20.6 stays open, cooler min 22.1 locks).
- The cooler is in main_hallway, which is lazy-loaded: until the player has entered the hallway once, thirst parks as `no_source`. Cooler trips only happen after that.

The 54 s return: not a queue or cooler cell. The reception to hallway door gap is one body wide (feet 41 to 55), so a pair goes through single file; the second user waits about 8 s going out and about 9 s coming back. In one run Zainab stood 120 s at (53,43) just inside the door, "returning", while my probe parked the player at (48,77) in the door lane (probe artifact plus single-file gap). Not fixed. A check with the player parked by Ffion (`PARK=1 b.mjs`) did not finish; redo it. Options if it matters: stagger pair trips, or widen the lane in the room dressing.

Live results: both staff at posts, visible (done). Five coffee trips and cooler trips (done, above). `wh_staff_upset` off-switch: debugKO zainab_hussain, then Yusuf's caffeine and thirst both park as `no_source` (done; KO was the debug shortcut, not a fight). NOT done: night-turn hide, hide after reload, fight music with them hidden. The conference door is RFID locked, so reaching the night turn needs Ffion's badge or Victoria's card (KO Ffion, pick up the badge, open the door, KO Victoria via debugKO, then enter main_hallway). NOT done: bin/test-js and Rails suites. Main merged at 74f89371c (contains d1afb3be8) before the spawn tweak.

## Slice 4 handover

- Use `lockIfAwayOverSeconds` 21.3 on Zainab's habit (`habits.screen.lockChance 1`). `zainab_laptop` already exists, owner not yet set: add `workstation: true`, `owner`, `observationVariants` (amara_pc pattern).
- Her laptop sits on the glass table at tile 5.0, 8.7; her post is the sofa west seat (sprite settles at 172,241).
- Probe scripts: scratchpad `p/lib.mjs`, `b.mjs` (trips, args: gameId kind rounds both; env PARK=1), `e.mjs`, `d.mjs`. They are in the old agent's scratchpad and may be gone.

## Slice 4 results and handover (built, partly proven)

Commits on build/ol-m03: 647a20785 (laptop habit, readable variants, useFrom), d3c2f556d (coffee use 19 s, spawn at post), 5448871c8 (cooler use 18 s), 7b1759067 (threshold 23 s).

Built: `zainab_laptop` is readable (`readDisplay gameDisplay`, `addToNotes false`, `workstation`, `owner zainab_hussain`). `affordance.useFrom {dx -0.75, dy -1.06}` puts her post at (148,252), the south side of the sofa's west place (she settles near (148,264)). `textVariants` in plan order: night, trouble, locked, away and open (calendar, Victoria's client-data reminder, unsent team message), attended base text. Habit `screen {lockChance 1, lockIfAwayOverSeconds 23}`. Zainab spawns at tile 4.625,7.5, on her post. Not built: the `npc_caught_at_post` bark (slice 5, spoken lines).

Deviation from the 21.3 recommendation: expectedAwayMs depends on her start cell, the route and the use time, so slice 3's figures no longer hold. With her post moved: coffee (use 19) 20.5 to 21.8 s; cooler (use 18) 24.2 s; with the cooler at its old 15 s it fell to 21.0 s and left the laptop open. 23 s sits between 21.8 and 24.2. Real time away: coffee 20.7 to 22.3 s (open window over 20 s, as the plan wants), cooler 36 to 39 s.

Static: ink 10 compiled, 0 failed; validator 0 errors, 12 warnings (same as slice 3); `--office-summary` diff is the two NPCs only; lock_key_diff empty; door alignment OK.
Suites: bin/test-js 730 passed, 0 failed; `bin/rails test` 3109 runs, 0 failures, 0 errors, 4 skips. Both ran on 647a20785; later commits change scenario data only. Re-run both on the tip before merging.

Live (port 3091, own games 6507, 6513, 6521, 6531; needs set with `__test.needs.set('zainab_hussain', need, 5)`, which stuck for her every time). Game 6521 at threshold 22.5: cooler 5 of 5 locked (expected 24180 ms, real 36.0 to 39.0 s), coffee 5 of 5 open (expected 21825 ms, real 21.7 to 22.3 s). Zainab reached the cooler and came back every time; the scripted-run report of her idling 24 px short of her post does not reproduce with her spawn on the post. The final threshold 23 was not re-run.
NOT proven: the text of each variant (my DOM scrape in game 6531 hit a password modal; capture at `interactions.js:2132` by wrapping `window.gameDisplay`), no note added on a read, trouble and night variants, paired Yusuf trips, the player reaching the laptop from the south side. Probe scripts live in the old scratchpad (`p/lib.mjs`, `trip.mjs`, `read.mjs`).
Oddity, not touched: object `reception_coffee` reads at (91,152) while the Tiled coffee sprite is at (262,189); coffee trips use the former.
Server on 3091 stopped.

## R1 fix numbers (supersede the figures above)

Coffee use 16 s, cooler use 20 s, threshold 24 s, on the Tiled machines. Game 6583: coffee expectedAwayMs 18626, real away 22.0 to 22.4 s, 5 of 5 open; cooler expectedAwayMs 28724, real 32.2 to 33.0 s (50.9 to 58.5 s when Yusuf joined), 5 of 5 locked. See M03_SLICES3_4_REVIEW_R1.md for the fix log.
