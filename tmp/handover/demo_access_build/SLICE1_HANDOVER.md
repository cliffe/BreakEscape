# Slice 1 handover (demo_access_tour)

## Done
- scenarios/demo_access_tour/: mission.json (collection test_scenarios), scenario.json.erb, ink/*.ink + compiled .json (stubs, one line each, plan 2.13 text), dungeon_graph.* (validator output).
- Seven rooms, doors per plan 2.2, keypad (server_room, @random_pin via server_room_pin), RFID: partner_office (people julian, lockedHint), meeting_room (requires VISITOR-07; visitor_card object added in reception), comms_cupboard (roles facilities/it).
- Objects: reception_pc, 2 plants, visitor_card, S1 sign (reception); desks, chairs, laptop, yasmin_pc, rota_board (open_plan); coffee_station claims map qdc_espresso slot, S2 sign (kitchen); julian_pc (partner_office).
- Cast static (behavior.immovable) with spriteSheet/spriteTalk/spriteVisemes; ama_phone in reception npcs; player_phone in inventory.
- Validator: 0 errors, 4 warnings: desk/laptop and desk/PC pinned 17-20 px apart (open_plan; move laptop/PC >= 1 tile from desks or make them tableItems), facilities/it roles held by no NPC (slice 2 adds Lorna creds).

## Not done
- C1, C2, C3 checks: not run (positions were chosen from map object lists, not verified by render).
- predict_door_sides.py (it failed on the file with "substring not found": probably needs ERB render; check how validate_scenario renders).
- Corpus tests (PAYLOAD_SCAN_ONLY=demo_access_tour; rails test files in plan 4.3; RBENV_VERSION=2.7.8 bin/rails test <file>) not run.
- In-game room renders/screenshots for all 7 rooms (start own keyless server on :3002; tools/playtest/lighting-tour.sh <mission> <out> <room>); render_room_preview only shows the maps (tmp/demo_access/r0/*.png, untracked).
- slot_audit.py --notes, check ink compile matches scripts/compile-ink.sh (used bin/inklecate -o).
- Add to hand lists in plan 4.5 only in later slices.

## Gotchas
- Object positions are tile coords (top-left of sprite for explicit position); y in map lists is FEET. Open plan: plan chest sits at NW under the north door (door LEFT); check approach in a screenshot.
- Kitchen espresso slot: coffee_station useFrom dy +1 (approach in front of machine); Julian at (1.9,5.3), west of coffee queue and clear of the east door.
- Meeting room: conference table is the kit table; kit items arrive in slice 2/3 (table spans tiles x 2.6-7.4, y 3.6-4.7).
- Art gaps so far: none; all sprites from catalogue (hq_break_sign1 and uni_doorcard1 content unverified for C1).

## Update: slice 1 finish (commit cd07179e5)
- Validator warnings fixed: laptop and PC are now `tableItems` of their desks (table-relative x/y), so the 17 to 20 px pins are gone. Validator now 0 errors, 2 warnings (facilities/it roles held by no NPC: expected until slice 2).
- Render loop (own keyless server on :3002, game made with new-game.rb demo_access_tour; a Mission row for demo_access_tour was created by hand in the shared dev DB, no seed run). Screens: tmp/handover/demo_access_build/screens/<room>-a.png (all 7 rooms, no lighting in this scenario so no -b shots).
- Fixes from the render: plan chest (shared map room_aw_merrin_sallow, id 30) sat in front of the north door, moved from (36,72) to (36,152); it is also used by the awareness missions' open-plan maps, so they get the same move (a fig planter now stands in front of its left half). NPCs: Thandiwe and Yasmin to y 5.0 (south of their chairs, off the desks), Lorna to (8.2,5.8) (south of the kiosk, 3 tiles below the comms door approach), Ama to (6.9,6.0), Julian to (1.7,6.5) (clear of the fridge and the coffee queue, which runs east from the espresso on the north counter), east reception plant to x 7.8.
- C1 pass: hq_break_sign1 reads "STAFF ROOM", uni_doorcard1 is a generic card holder with a yellow slip, qdc_* props and uni_tv1 carry no text or firm name; the only names on screen are Merrin & Sallow's own logos.
- C2 pass: open plan has clear floor for both desks (3.1,2.0 and 5.3,2.0, against the north wall, 51x39 px each) away from the four doors; chairs south of them.
- C3 pass with a note: the two plants and the sign and card use free positions and sit clear of the map's planters. reception_pc claims the map's own pc8 slot (pc type) and moves to the counter's left end, so the west table's pc8 is gone (the table is empty). Nothing doubles up.
- predict_door_sides.py (works on the .json.erb directly): matches plan 2.2 exactly.
- slot_audit.py --notes: 8 lines, all NO SLOT/SIZE for objects with explicit positions (expected, as in the devices build log); 0 notes prompts.
- Ink: compile-ink.sh demo_access_tour leaves the compiled JSON byte-identical (not stale).
- Unverified: NPC walk-around and door approach clearance by physics (judged from screenshots only); no lighting; setFPS(20) not applied to the screenshot run.
- Art gaps: none listed. The open-plan chairs are partly hidden behind the NPCs by design.

## Still open (context limit reached)
- Corpus tests NOT yet confirmed: the shared tests.lock was held by another session's train check for more than 15 minutes, so the first attempt timed out without running. A second run is queued in the background writing to the previous agent's scratchpad (corpus.out; may be gone). Re-run: `flock -w 3000 <main checkout>/tmp/tests.lock env PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1 bin/rails test` on the 7 files in plan 4.3 (BUNDLE_PATH=<main>/vendor/bundle RBENV_VERSION=2.7.8).
- The :3002 server is stopped. Validator already run: 0 errors, 2 expected warnings.

## Correction: shared map restored (commits e36a9f304, e9d1de543)
- public/break_escape/assets/rooms/room_aw_merrin_sallow.json and .tmj restored to their pre-cd07179e5 state; `git diff main` on both is empty (identical to main). The "awareness missions get the same move" note above is withdrawn.
- No awareness scenario puts a door on that room's north wall (ca12 has an east door to the lobby; the rest have none), so the chest over the door is a clash only for the tour, not a map bug. Option (a) did not apply.
- Option used: (c) variant. The map's chest is an `items`-layer slot with sprite plan_chest2; a scenario object with `"sprite": "plan_chest2"` claims that slot and takes its own position (the same way reception_pc claims pc8; rooms.js findMatchFor by sprite then applyScenarioObjectPosition). Added object `plan_chest` (type plan_chest, position 7.8, 6.5, east wall below the kiosk) to open_plan. Option (b) was rejected: parity gives the north door the LEFT corner and the layout has no way to flip it without changing the grid. A first try at (1.125, 5.2) overlapped the table chairs, so it went to the east wall.
- The fig planter stays where the map has it (west wall); the chest no longer sits behind it.
- Render: own keyless server on :3002 (stopped), game from new-game.rb, setFPS(20) applied; screens overwritten in tmp/handover/demo_access_build/screens/ (all 7; open_plan-a.png is the checked one, north door clear).
- Validator after change: 0 errors, 2 warnings (facilities/it roles, expected).
- Corpus tests (7 files, PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1, under the shared lock, run on e9d1de543): 54 runs, 14336 assertions, 1 failure, 0 errors. The demo scans report "scenarios scanned: 1, findings before exceptions: 0" in all three payload scans. The one failure is the opened-state test reporting three "stale opened-state exception" lines for m09_digital_archaeology: an artefact of PAYLOAD_SCAN_ONLY (m09 is not scanned, so its exceptions look stale), not a demo finding. Output: scratchpad corpus2.out.
