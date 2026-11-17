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
