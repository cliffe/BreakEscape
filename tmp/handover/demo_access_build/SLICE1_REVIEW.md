# Slice 1 review (demo_access_tour, skeleton and rooms)

Reviewed commit e9d1de543 (read via git show, not the live tree). Reviewer: Sonnet 5.5.

Counts: B 0 / M 0 / m 2 / n 4

Verdict: slice 1 meets plan section 5 item 1. No blocker or major finding. The two minors are cosmetic or plan-wording issues and can be handled in slice 2 or left.

## Checks run

- Validator: scripts/validate_scenario.rb on the e9d1de543 files (temp copy): 0 errors, 2 warnings (facilities/it roles held by no NPC, expected until slice 2 adds Lorna's creds). Matches the handover.
- Door sides: scripts/predict_door_sides.py on the e9d1de543 scenario matches plan 2.2 exactly (reception north LEFT, east/west TOP y2.5; open plan north LEFT, south LEFT, east/west TOP; each leaf room one TOP or LEFT door on its shared side).
- Rooms, maps, grid and connections (scenario.json.erb:38-374): all seven rooms use the plan 2.2 maps and connections. Reception north/west/east, open plan south/north/west/east, server room south, kitchen east, partner office east, meeting room west, comms cupboard west. The kitchen and partner office have no door between them.
- Locks: server_room `lockType: pin` with `requires "<%= server_room_pin %>"` where `server_room_pin = @random_pin` (lines 6, 279-281); partner_office rfid `access.people ["julian"]` with `lockedHint` (337-340); meeting_room rfid `requires ["VISITOR-07"]` matched by the `visitor_card` `card_id` (60-61, 360-362); comms_cupboard rfid `access.roles ["facilities","it"]` (370-372). Three RFID plus one keypad, as planned.
- Secrets: no player-needed secret literal in the client copy. The PIN is an ERB render per game, and game.rb:2372 strips `requires` (and `lockedHint` is the only door text kept on purpose) before the room reaches the client. VISITOR-07 sits on a pickup card the player is meant to take. Ink stubs hold one line each, no secrets.
- Cast: all six NPCs have `behavior.immovable`, `spriteSheet`, `spriteTalk`, `spriteVisemes` with the plan 2.4 keys (ama_owusu, delphine_arvanitis, thandiwe_moyo, yasmin_chaudhry, julian_sallow, lorna_easton); all art files exist (54 matching files). `ama_phone` is in reception `npcs` with `phoneId player_phone`, no position, no spriteSheet, and `player_phone` is in `startItemsInInventory`, as plan 1 and 2.5 require.
- Shared map: `git diff main -- public/break_escape/assets/rooms/room_aw_merrin_sallow.*` is empty; the 7e6c18ecc..e9d1de543 diff touches no file under public/. Identical to main.
- Plan chest override (scenario.json.erb:148-156): object `plan_chest`, `sprite "plan_chest2"`, explicit position (7.8, 6.5). rooms.js:2450-2453 tries `findMatchFor(obj, sprite)` then by type, so it claims the map's `plan_chest2` items-layer slot (map json:4180) and `applyScenarioObjectPosition` (rooms.js:588, 2495) moves it. Same mechanism as reception_pc and pc8. Sound. open_plan-a.png shows the chest on the east wall, nothing left at the north door, the left door cell clear.
- Props square to walls: desks (desk3) at y 2.0 against the north wall, chairs south of them, rota board and signs on wall strips, plan chest against the east wall. No angled props. Seen in open_plan-a.png, reception-a.png, kitchen-a.png.
- NPC clearance (screenshots): Delphine behind the counter, Ama at the counter's east end, both well off the north (LEFT) and east/west (TOP y2.5) door cells. Thandiwe and Yasmin south of their chairs, clear of the desks and of all four open-plan doors. Lorna (8.2, 5.8) is about 3 tiles below the comms door and beside the kiosk, clear of the approach cell. Julian (1.7, 6.5) is west of the coffee queue (which runs east from the espresso on the north counter) and far from its `useFrom` cell.
- C1: kitchen-a.png shows the sign reading "STAFF ROOM" and no other firm's name; only Merrin & Sallow logos appear in the offices. C2: open_plan-a.png shows two desks with clear floor, away from the doors. C3: reception objects sit away from the map's planters (see m1 for pc8).
- Later slices: nothing found that would break them. Slice 1 leaves server_room, meeting_room and comms_cupboard `objects` empty (the kit table is the conference table, per the handover); the stub aim `aim_office` and `t_kit` are replaced in slice 5.

## Findings

### m1 (minor) reception_pc consumes the lobby map's pc8, contrary to plan wording
- Evidence: scenario.json.erb:46-56 (`type pc`, `sprite pc10`); handover C3 note; reception-a.png, the west table at about (530, 600) is bare. rooms.js:2452-2453 falls back to type `pc`, which matches pc8.
- Plan 2.2 and "Declined" say the tour places its objects on other spots and the course map's pc8 is not removed, and C3 asks for spots "clear of the map's own pc8". Technically the map file is untouched, but the west table loses its PC in the tour.
- Fix: accept it (the pc8 claim is intended and matches the chest approach) and add one line to plan 2.2 / C3 saying reception_pc claims pc8 and the west table stays bare. No code change needed. If a bare table is unwanted, add a small non-pc prop to that table in slice 4 dressing.

### m2 (minor) S1 sign is a small paper beside the map's fire call point
- Evidence: scenario.json.erb:84-96 (`uni_doorcard1` at 9.0, 3.1); reception-a.png at about (975, 395): a small paper stack directly above the red fire call point, just below the east door frame. It reads as a notice but is hard to spot, and the player will want to find S1 at the meeting-room door.
- Fix: optional. Nudge to y 2.9 or accept; check in slice 6 live proof that the sign is easy to find. The `observations` text already says what it is.

### n1 (note) Validator warnings are expected
- 2 warnings, both facilities/it roles held by no NPC. They clear when slice 2 gives Lorna `role: facilities`.

### n2 (note) Delphine is 1.4 tiles east of her PC
- Delphine (4.9, 3.1) stands behind the counter, while `reception_pc` sits at 3.5, 3.95 on the left end. Cosmetic. When slice 2 gives her `needsHome` or ownership, a seat position near the PC would read better. Not needed for slice 1.

### n3 (note) Julian stands in a one-tile lane
- Kitchen (1.7, 6.5): between the fridge and the west table (kitchen-a.png). He blocks nothing (the room is open to the south and east), and he is static by plan. Fine unless a later slice adds a walking NPC through the kitchen.

### n4 (note) Not verified
- Corpus tests were not re-run by me. The handover reports 54 runs, 1 failure, put down to PAYLOAD_SCAN_ONLY making m09's opened-state exceptions look stale. Plausible, but I did not reproduce it; slice 2's builder should confirm the same single failure on a full run, or run the opened-state test without PAYLOAD_SCAN_ONLY.
- The Rails door test cited by the plan (test_access_doors:233) was not found by name in the worktree, so the `requires ["VISITOR-07"]` array form was checked only by the validator passing and the card_id match. Slice 2's Rails test should open the meeting room with the card.
- NPC door clearance by physics (not just screenshot) is unverified, as the handover says.
