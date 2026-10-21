# m09 Digital Archaeology: Stage 5, room layout

## 0. Status and inputs

Stage 5. Author: stages 4–5 author (Opus), 2026-10-21. Status: first draft, for review round 1. Companion to `../stage_4/objectives_tasks.md` ("S4"), which holds the tasks, globals, mappings and forced scenes; this document holds the space.

Inputs: as S4 §0, plus `story_dev_prompts/05_room_layout_design.md`, the `mission-puzzle-chains` skill (lock order, cumulative kit, the silent-failure bug sweep), the `mission-room-dressing` skill (layout constraints only: north wall two tiles, square props, NPCs clear of furniture, interactables 32 px apart), `README_scenario_design.md` (grid units, room types, door rules, authoring rules), `tools/pass2/PASS2_LESSONS.md`, and the engine (`core/rooms.js`, `systems/doors.js` via the README's rules, `systems/interactions.js`, `systems/npc-manager.js`, `systems/npc-hostile.js`, `systems/unlock-system.js`, `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/game.rb`).

**Units.** The 05 prompt's "4×4 to 15×15 GU, 1 GU = 1.5 m" is the old system. The engine's grid unit is 5 tiles wide by 4 tiles stackable height; a 2×2 GU room is 10×10 tiles (320×320 px) with the top two rows as wall; valid heights are 6, 10, 14… tiles (README "Room Layout System"). All sizes below are in those units, and positions are in tiles within the room (floor starts at tile row 2).

**What this stage decides.** Ten rooms on one map (stage 0's nine, with the cage split from its outer aisle). Four rooms around a ring at the front of the building so the player can choose a route past the guard or past the clerk; a tree behind it, with the restricted stacks as the inner hub that the cage, Sorensen's office and the tape room all open off. Every lock on the critical path is one the engine enforces, in the order stage 1 §11 needs, with the kit the player carries.

## 1. The building

Mountain States Records & Retention: a grain warehouse on the edge of Helena, converted forty years ago (SE §6.1). Night, after hours, a small staff: a guard on his round, a clerk loading trolleys, an IT contractor in the server closet, the director behind the cage mesh. Security is a records company's: card readers on the inner doors, a keypad on the director's office, a fingerprint reader on one cabinet she installed herself, a night guard. Nothing is built to stop a trained agent; everything is built to keep a records clerk out of the restricted series.

**Shape of the night in space.** The front of the building (dock, front desk, open stacks, reading room) is Act 1, and its ring gives two ways to the reading room. Act 2 and Act 3 happen off the restricted stacks, one door north of the reading room: the cage to the east, Sorensen's office to the west, the tape room to the north and the salvage cage behind it. The shredder is loudest in the middle of the map and audible everywhere, which is the night's clock (SE §6.1).

**Room count and size against the shipped missions.** m08 has ten rooms, m02 fifteen (six of them corridors, which the puzzle-chains skill counts against it). m09 has ten and no corridor: every room holds a person, a lock or a find.

## 2. Map, grid and doors

Grid origin is the start room's top-left; `gx` grows east, `gy` grows south, in grid units. All rooms are 2×2 GU (10×10 tiles) except the server closet (1×1, 5×6).

```
gy -8           +-------------------+
                |  SALVAGE CAGE     |   password (decoded code)
                |  Tomb Beta server |   station + launcher (flags 3-4)
gy -6           +---------+---------+
                |  TAPE ROOM        |   rfid (card from the safe)
                |  Alpha-tapes deck |
gy -4 +---------+---------+---------+---------+
      | SORENSEN'S|  RESTRICTED       |  RESTRICTED |
      | OFFICE    |= STACKS (hub)    =|  CAGE       |
      | password  |  hatch, Sorensen  |  rfid (her  |
      | (HaX)     |  behind counter   |  card)      |
gy -2 +-----------+--------+----------+---------+---+---+
                  |  READING ROOM     |  OPEN STACKS  |SC |  server closet
                  |  drop terminal    =  Old Coyote   =   |  (Tran)
                  |  flags 1-2        |  H&L boxes    +---+
gy  0             +---- rfid ---------+---------------+
                  |  FRONT DESK       =  LOADING DOCK |  start
                  |  Noor             |  key door W,  |
                  |                   |  shutter N    |
gy  2             +-------------------+---------------+
                 gx -2               gx 0            gx 2
     gx -4
```

(Not to scale. The table below is the layout; `=` marks an east/west door.)

| Room | gx, gy | Size | Connections (lock on the door into the room) |
|---|---|---|---|
| `loading_dock` (start) | 0, 0 | 2×2 | N `open_stacks` (shutter, open); W `front_desk` (office door, key: picks) |
| `front_desk` | −2, 0 | 2×2 | E `loading_dock`; N `reading_room` (staff door, RFID: Noor's card) |
| `open_stacks` | 0, −2 | 2×2 | S `loading_dock`; W `reading_room` (open); E `server_closet` (open) |
| `reading_room` | −2, −2 | 2×2 | S `front_desk`; E `open_stacks`; N `restricted_stacks` |
| `server_closet` | 2, −2 | 1×1 | W `open_stacks` |
| `restricted_stacks` | −2, −4 | 2×2 | S `reading_room` (RFID `stacks_release`: HaX after flag 1); E `restricted_cage`; W `sorensen_office`; N `tape_room` |
| `restricted_cage` | 0, −4 | 2×2 | W `restricted_stacks` (RFID `stacks_card`: Sorensen's card) |
| `sorensen_office` | −4, −4 | 2×2 | E `restricted_stacks` (password: HaX on the deck) |
| `tape_room` | −2, −6 | 2×2 | S `restricted_stacks` (RFID `tape_room_reader`: the card in the safe); N `salvage_cage` |
| `salvage_cage` | −2, −8 | 2×2 | S `tape_room` (password: the decoded catalogue code) |

**How the engine places them** (BFS from the start room, `rooms.js:1545-1640`). The dock places the open stacks north (0, −2) and the front desk west (−2, 0). The open stacks place the reading room west (−2, −2, top-aligned) and the server closet east. The front desk's north door then finds the reading room already at (−2, −2), exactly above it, so the ring of four closes on the grid. Everything past the reading room is a tree. No connection uses an array, so the "multi-room sides only position correctly for dead ends" rule never applies, and every north/south pair is between two rooms of equal width.

**Door alignment.**

- East/west doors always sit 2.5 tiles below the room top (README "Which corner a door lands on"), and every east/west pair here is two 2×2 rooms with the same top (or the closet, whose top matches the open stacks'), so all of them align.
- The ring's two north/south pairs (dock–open stacks, front desk–reading room) are between equal-width rooms. Each pair's two doors take their corner from the same grid sum (the north door from the lower room's origin, the south door from the shared wall), so they agree. Stage 9 confirms every corner with `scripts/predict_door_sides.py` and `tools/pass2/door_align.py`.
- Every 2×2 room gets its north and south doors on the same side (README consequence 1). The restricted stacks and the reading room each have a north and a south door, so the walk through them is a straight line up one side of the room; the hatch counter (§3.6) sits on the east wall clear of both.

**World-space overlaps.** None by construction: the cage (0..1, −4..−3) sits directly above the open stacks with no door between them, and above the closet's column only at gx 0..1; the office (−4..−3) is west of the reading room's column; the tape room and salvage cage stack above the hub. The validator's geometry check confirms at stage 9.

## 3. Rooms

Room types are placeholders. No shipped room type is a records warehouse; the nearest are `room_archive_1x2gu` and `room_library_1x2gu`. Stage 9 and the room-dressing pass build m09's own 2×2 types (`room_m09_*`) and register them (README "Available Room Types"); the contents below say what each map must hold, not how it looks. Positions are tiles in the room (x 0–9 across, y 2–9 the floor). Every interactable is at least a tile from the next (32 px reach, dressing skill), and no NPC stands on or in front of one.

### 3.1 `loading_dock` (start)

- **Size and doors.** 2×2. W door: the office door into the front desk, `lockType: "key"` (`requires: "dock_office_door"`, `keyPins`, `difficulty: "easy"`), opened with the start-kit picks; Old Coyote's key ring holds the only key (his `itemsHeld`), so it also drops if he is knocked out; that keeps the validator from flagging a key lock nothing can open. N door: the roller shutter into the open stacks, open (it is his round's way in).
- **Lighting.** Night exterior; sodium light, cold. SE §6.1: "Sodium light outside."
- **NPCs.** Every phone contact (`agent_0x99`, `recruiter`, `nightshade_phone`, `torres_phone`, `gary_phone`) and every hidden cutscene NPC, so their mappings are loaded from the first frame (S4 §5): `briefing_cutscene` (person, hidden, `timedConversation` with `waitForEvent: "game_loaded"` and `skipIfGlobal: "briefing_played"`, background Task Force Null's room), the briefing's registered speakers (`netherton`, `quintero`, `kowalczyk`, `malhotra`, `arakawa`; hidden person NPCs at 500,500 with voices; `kowalczyk.itemsHeld` holds the `pin-cracker`), and `closing_debrief` (hidden, the hangar). The Recruiter is not in the phone's `npcIds` (lesson 36, m05's pattern).
- **Objects.** The guard hut desk with `incident_book` (notes: a week of "shredder running, night" entries); a fence, bins and a pallet (dressing).
- **Spawn.** Bottom-right of the yard, facing the two doors, so HaX's first line can name both: "Shutter's his round. The office door's quieter."
- **Start inventory.** Phone; lockpick set; RFID cloner; fingerprint kit; CyberChef workstation (the field kit). The PIN cracker arrives from Kowalczyk in the briefing (`#give_item:pin-cracker:<id>`, near the top of her beat so a skipped briefing still delivers it; a `game_loaded` backstop gives it if `briefing_played` and not held).
- **Tasks here.** `get_inside` (on leaving).

### 3.2 `front_desk`

- **Size and doors.** 2×2. E: the dock. N: the staff door into the reading room, `lockType: "rfid"`, `requires: "reading_staff_door"`; the only card is `noor_staff_card` (`keycard`, `opens_lock: "reading_staff_door"`) in Noor's `itemsHeld`.
- **Lighting.** Fluorescent over the counter, the rest dim; Noor's desk lamp.
- **NPC.** `noor_haddad` (person) behind the front counter, at about (6.5, 4.5), clear of the trolleys. Gives the card with `#give_item` on the warned-in-time branch; drops it on a knock-out (`npc-hostile.js:139`, `:258-261`). Leaves on `noor_told` (`setVisible: false` on her own mapping; her desk and its objects stay). `globalVarOnKO: "noor_ko"`; `taskOnKO: "meet_the_clerk"`.
- **Objects.** `trolley_list` (notes: the destruction schedule's copy, series numbers, "Series R" on every line); two trolleys of archive boxes (dressing); `noor_desk_box` under her desk, a readable object whose `textVariants` show the legacy placement files on `m05_found_pipeline_list && !m05_recruiter_deal_accepted` and "Returns for re-shelving. County deeds." otherwise (objects can't appear on a global, §10 item 8).
- **Tier 1 here.** `m05_found_pipeline_list` / `m05_recruiter_deal_accepted` / `m05_recruiter_deal_confessed`: which Noor, the card, the held box.
- **Tasks here.** `meet_the_clerk` (optional).

### 3.3 `open_stacks`

- **Size and doors.** 2×2. S: the dock (shutter). W: the reading room (open). E: the server closet (open). No lock: this is the floor where the guard is the obstacle.
- **Lighting.** Motion-sensor strips that come on one bay at a time as the player walks (SE §6.1); the shredder louder here.
- **NPCs.** `old_coyote` (person) on a patrol: `patrol.waypoints` round the shelving bays, `waypointMode: "sequential"`, `loop`, `los` with `angle` about 120 and `range` about 150 px, `challengeOnSight` (`rooms: ["open_stacks"]`, `skipIfGlobal: "old_coyote_told"`) mapped to a person-chat challenge: talk past (any cover), "[Tell him the truth.]" (`old_coyote_told`, then `setVisible: false`: "I'll be in the truck."), or a fight. `globalVarOnKO: "old_coyote_ko"`. On `m01_maya_ko` after flag 1: `patrolOverride` to the reading-room door tile (S4 §14 P6), and HaX's text. `archive_guard` (person, hidden, the guard Tran calls in on `m01_maya_ko`; a hostile patrol once shown; revealed on `global_variable_changed:tran_alerted` and on `room_entered:open_stacks` with `globalVars.tran_alerted`, lesson 43).
- **Objects.** Shelving bays of client deposits (dressing); `hl_box` (Harwick & Lowe's dead files), a container with `lockType: "password"`, `requires` the file number from flag 2 (shown on `ledger_view` and in HaX's ledger read); `contents`: `hl_placing_sheet` (notes; `onRead` `setVariable: { "sleeper_shortlist": true }`). A plain bay label beside it ("HARWICK & LOWE, EXEC SEARCH (CLOSED). RETENTION 25 YRS.") so the boxes are findable before the number. Before flag 2 the keypad simply refuses, and HaX's hub has nothing on it.
- **Tier 1 here.** `m01_maya_ko` (the reroute, the called guard); `m05_torres_turned` (Torres rings as the boxes are opened after flag 2).
- **Tasks here.** `cross_reference_wren` (optional).

### 3.4 `server_closet`

- **Size and doors.** 1×1. W: the open stacks (open).
- **Lighting.** Rack LEDs, a monitor's glow; the degausser's whine while the tape side is being wiped.
- **NPC.** `jesse_tran` (person) at the console, about (2.5, 3.5) in the 5×6 room (inside the four floor rows, clear of the rack). `los` with `challengeOnSight` (`requireGlobal: "m01_maya_ko"`, `rooms: ["server_closet"]`; the cone only works with him in the player's room, so "sees the player first" means at the closet door): on `player_spotted:jesse_tran` a mapping sets `tran_alerted`, which reveals `archive_guard` in the open stacks. His ink: talk him off it with the letters (`tran_outcome = talked`, his price stated first), or a fight (`ko`). `globalVarOnKO: "tran_ko"` and a HaX `npc_ko:jesse_tran` mapping setting `tran_outcome: "ko"` unless `talked`.
- **Objects.** `tape_side_console` (readable; `textVariants`: "WIPE IN PROGRESS" by default, "WIPE HALTED" on `tran_outcome !== 'left'`).
- **Tasks here.** `stop_the_tape_wipe` (optional, brief-gated, S4 §3.2).

### 3.5 `reading_room`

- **Size and doors.** 2×2. S: the staff door from the front desk. E: the open stacks. N: the restricted stacks' outer door (`rfid`, `requires: "stacks_release"`; no card in the world; opened by HaX's `#unlock_door` after flag 1, S4 §4 row 1). A `door_unlock_failed` mapping on HaX gives the boss-key line on the first refusal: "That reader's on the catalogue server. Get me in there and I'll open it."
- **Lighting.** The only warm room: green-shaded lamps, a radiator that knocks (SE §6.1).
- **Objects** (the drop terminal is a reading desk with the field kit on it):
  - `field_laptop`: `vm-launcher` (the attack VM), at a reading desk.
  - `drop_terminal`: `flag-station`, `acceptsVms: ["catalogue_server"]`, `flags: flags_for_vm('catalogue_server', …)`, `flagRewards`: `[set_global flag1_submitted, set_global flag2_submitted]` (one per flag).
  - `case_file`: readable; HaX's case file (the order's photograph, the wall's cards, the raid team), with the tagged-payments page as a `textVariants` section on `m06_monitoring_enabled` (S4 §14 P9).
  - `notebook_scan`: readable, a course code on the label; `onRead` sets `notebook_read`. A tile from the case file so a tap doesn't raise a pick-one menu.
  - `catalogue_view`: readable; `textVariants` on `flag1_submitted`: the Series R shelf marks and the one tape-store entry in the archive's own encoding ("salvage cage: access ****").
  - `ledger_view`: readable; `textVariants` on `flag2_submitted` (WREN's entry, the H&L source code and file number; Torres' line by `m05_final_choice`) and, first in the list, on `invoice_booked` (the sale line in Sorensen's columns).
  - `catalogue_legend`: a framed plaque of the archive's old shelf-code scheme on the back wall, the long way to decode the salvage cage code without Gary.
  - microfiche reader, public catalogue terminal (dressing; the public terminal reads "Series R: no records").
- **Tier 1 here.** `m06_monitoring_enabled` (the payments page); `m08_nightshade_triple_agent` (his call on flag 1); `m05_final_choice` (the ledger entry).
- **Tasks here.** `set_up_drop_terminal`, `submit_catalogue_flag`, `submit_ledger_flag`; the hand is compared from `notebook_scan` (`match_the_hand` completes in HaX's hub, from anywhere).

### 3.6 `restricted_stacks` (the hub)

- **Size and doors.** 2×2. S: the reading room (above). E: the cage gate, `rfid`, `requires: "stacks_card"`. W: Sorensen's office, `password` with a code nobody has (HaX opens it on the deck, S4 §4 row 5). N: the tape room, `rfid`, `requires: "tape_room_reader"`. Four doors, each a different promise, all in view from the middle of the room.
- **The cage front.** The east wall below the gate is a mesh line with a **hatch counter**: a counter with collision from about x 7.5, y 4 to y 7, and a sealed strip behind it (x 8–9, y 4–7) where Sorensen works. The gate sits at the top of the east wall (east/west doors are always 2.5 tiles down), above the strip, so the player reaches the gate from their own side. The strip is a map feature of the new room type (collision rectangles, as `room_uni_lecture`'s seat rows).
- **Lighting.** The cage front lit hard white like a shop counter; the aisle behind the player dark until the strips catch it.
- **NPC.** `sorensen_hatch` (person) in the strip at about (8.5, 5.5), facing west across the counter; `koImmune: true` ("behind the mesh"); `rfidCard: { card_id: "stacks_card", rfid_protocol: … }` (MIFARE with custom keys, m08's harder clone, so the cloner's second use of the night is the harder one); `#clone_keycard:stacks_card` in her hatch knot; `setVisible: false` on `global_variable_changed:cage_opened` (her own room is loaded by then). Her hatch knot sets `hatch_talked` at the top, plays the bluff and the recognition, HaX's two bin lines, the bin buttons (`#give_item` of the pulled file from her `itemsHeld`, `bin_chosen`, `cage_bin`), and "Take the print if you like."
- **Objects.**
  - `sorensen_stamp`: on the hatch shelf on the player's side at about (7, 4.5); `hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`, `fingerprintDifficulty: "medium"`, a candidates list of the archive's staff.
  - `hatch_bin_near`, `hatch_bin_far`: the two bins at the shredder's mouth, in the strip (out of reach, so they are seen, not used); `spriteVariants` on `cage_bin` (the one not saved shows empty) and `observationVariants` naming each (Derek's file; the letters, or on `m08_nightshade_tidied` Nightshade's copy).
  - Binders and shelving along the west wall (dressing; "past the binders").
- **Tier 1 here.** `m08_nightshade_tidied` (the far bin's contents and button); `m03_victoria_fate` (the hatch can be skipped).
- **Tasks here.** `enter_restricted_stacks`, `talk_at_the_hatch`.

### 3.7 `restricted_cage`

- **Size and doors.** 2×2. W: the gate (`rfid`, Sorensen's card; on Victoria's route HaX opens it with the maintenance code). One door, so leaving the cage is a `room_exited` the engine sees (S4 §4 purge table; P4).
- **Lighting.** Hard white over the shredder line; the plan cabinet's corner darker.
- **NPC.** `sorensen` (person) at the shredder's feed, about (6.5, 4.5) with the feed table behind her to the east; non-hostile; shown on `room_entered:restricted_cage` unless `sorensen_ko`. `globalVarOnKO: "sorensen_ko"`; her fate on a knock-out is set by HaX's `npc_ko:sorensen` mapping only when not `talked` (S4 §5). Her ink: on first entry with `!hatch_talked` (Victoria's route) the recognition and "[Take Derek's file.]" / "[Take the letters.]"; otherwise "When I've finished, dear."; the talk-down choice "[He kept his own papers off your list. Only yours burn.]" shown only on `nightshade_file_held` (ink reads the synced global). No `los` block: she doesn't watch the player.
- **Objects.**
  - `feed_table_box`: the legacy placement files, on the feed table behind her; readable; `textVariants`, most specific first: Noor held it ("Empty feed tray. The last box never came up."), saved (`legacy_files_saved`: the files, and HaX's line on reading), gone (`legacy_clock_run`: "Strips."), at risk (default: "She's working through it sheet by sheet."). `spriteVariants` the same.
  - `plan_cabinet`: a locked plan cabinet at the back, in the north-east corner: the gate is at the top of the west wall, so the walk to the cabinet runs past her and the feed table (MC §4.3: "the moment you go past her to the chest"); `lockType: "biometric"`, `requires: "Margaret Sorensen"`, `biometricMatchThreshold` medium; `contents`: `nightshade_file` (notes; `onPickup` `setVariable: { "nightshade_file_held": true }`; the Architect's hand in every margin).
  - `printed_ledger`: on the ledger shelf; readable; `textVariants`: locked binder before flag 2; the codename pages after (with Reeves' handler's contact sheet on `m02_reeves_fate` in custody, or the read rule on `m02_insider_asset_arrested`; Noor's codename); shredded once read if Sorensen is free (S4 §4).
  - The shredder and the degausser (dressing; ambient sound on this room and the hub).
- **Tier 1 here.** `m02_insider_asset_arrested` / `m02_reeves_fate` (the contact sheet); `m03_victoria_fate` (the door scene); `m05_found_pipeline_list` (the empty feed tray).
- **Tasks here.** `open_the_cage` (on entry), `open_plan_cabinet`, `stop_the_shredding` (optional).

### 3.8 `sorensen_office`

- **Size and doors.** 2×2. E: the hub (`password`, opened by HaX on the deck). A keypad by the door, "not on the card system".
- **Lighting.** A desk lamp and the kettle's light; warm, small.
- **NPCs.** None.
- **Objects.**
  - `director_safe`: floor safe, `lockType: "pin"` (the four-digit PIN); `contents`: `the_reading` (notes; `onPickup` sets `reading_found`; its last page sets `reading_finished`), `master_schedule` (notes; `onRead` sets `schedule_read`), `tape_room_keycard` (`keycard`, `opens_lock: "tape_room_reader"`).
  - `sorensen_desk_drawer`: `lockType: "key"` (picks; no NPC in the room, so no catch), holding the PIN on a county-clerk's index card (the long way).
  - `lease_file` (notes, takeable, `id: "lease_file"`: Tomb Gamma's deed and construction file; `textVariants` on the no-coordinate branch and on `m03_victoria_fate` arrested or ko); `rent_book`, `danny_sheet`, `refit_ledger` (notes, each with its Tier 2 variant).
  - `deck_controller`: the tape deck's controller the Recruiter fired the wipe from; readable; `textVariants` by `deck_pulled` (counter at zero; one channel pulled).
  - Wall of binders, the framed certificate for twenty years' service to Lewis and Clark County, the kettle (dressing).
- **Tier 1 here.** `m08_tomb_gamma_location_known` (the lease file's line); `m03_victoria_fate` (the lease line).
- **Tasks here.** `enter_office`, `open_the_safe`, `take_the_reading`, `take_tape_room_card`, `find_the_deed`.

### 3.9 `tape_room`

- **Size and doors.** 2×2. S: the hub (`rfid`, the card from the safe). N: the salvage cage (`password`, the decoded code).
- **Lighting.** Blue standby LEDs; cold. Tape racks to the roof.
- **NPC.** `alpha_recording` (person, hidden, never shown): the "Dr Adrian Tesseract (recording)" speaker for the clip, with his m07 voice and a recording style. Exists so a person-chat can be opened from an object (§10 item 25).
- **Objects.**
  - `alpha_tape_deck`: a reel deck on a bench; `onInteract.actions: [{ "type": "set_global", "key": "alpha_deck_used", "value": true }]`; `alpha_recording`'s mapping on `global_variable_changed:alpha_deck_used` opens its person-chat (`targetKnot: "deck"`), whose ink routes: no tapes (`deck_pulled != "alpha_tapes"`: "Empty spools. Degaussed."), held (before `identity_scene_done`: HaX, "I know whose voice that is. After."), or the clip (two lines, then HaX: "Tape two. He gave that lecture every year."; `alpha_clip_played`). `observationVariants` on `deck_pulled`.
  - `alpha_annotations`: readable on the Alpha-tapes route (`textVariants`; elsewhere "Blank label stock"), in the archive's encoding; the optional decode.
- **Tier 1 here.** None directly; the deck reads the m09 global `deck_pulled`.
- **Tasks here.** `enter_tape_room`.

### 3.10 `salvage_cage`

- **Size and doors.** 2×2. S: the tape room (`password`; Gary on `m02_gary_protected` rings at the first attempt).
- **Lighting.** Tomb Beta's server fans and its status lights are the only warm thing in the building (SE §6.1); everything else is crates in the dark.
- **NPCs.** None. The identity scene, the read and Tesseract's call are phone scenes heard here.
- **Objects.**
  - `tomb_beta_rack`: the server itself, still racked, still running (dressing, with an `observations` line).
  - `field_kit_link`: `vm-launcher` (the same attack VM as `field_laptop`), on a crate beside the rack.
  - `tomb_beta_station`: `flag-station`, `acceptsVms: ["tomb_beta_server"]`, `flagRewards: [set_global flag3_submitted, set_global flag4_submitted]`. A tile from the launcher.
  - `albion_entry`, `albion_memo`, `vendor_notice`: readable sheets "off the box" (printed by the field kit), `textVariants` on `flag3_submitted`; before it they read "Printer tray, empty."
  - `enrolment_binders`: in a locked crate (`lockType: "key"`, picks), Tomb Beta's enrolment binders in the same hand (optional confirmation).
  - The door controller with its wires cut, crates stencilled ALPHA and BETA (dressing).
- **Tier 1 here.** `m02_gary_protected` (the keypad call); the identity scene's forms (`m06_architect_identity_found`, `m07_teacher_discussed`, `m07_architect_echo_heard`) play here.
- **Tasks here.** `open_salvage_cage`, `submit_owner_flag`, `hear_the_name`, `submit_control_flag`, `hear_the_mirror_job`, `send_the_notice` (optional; the send itself is in HaX's hub).

## 4. Lock graph and boss-key audit

### 4.1 The dungeon graph in text

Critical path in capitals; optional in lower case. `→` is "opens", `+` is "needs both".

```
start kit (picks, cloner, print kit, CyberChef)      briefing: PIN CRACKER (Kowalczyk)
   |
DOCK --picks--> front desk --(Noor's card | KO drop)--> reading room          [route A]
DOCK --shutter (Old Coyote's floor)--> open stacks --> READING ROOM           [route B]
   |
READING ROOM: field laptop -> VM FLAG 1 -> HaX #unlock_door -> RESTRICTED STACKS
   |                         \-> catalogue_view: encoded salvage-cage code (for later)
RESTRICTED STACKS: Sorensen at the hatch --talk--> CLONE HER CARD; lift PRINT off the stamp; BIN CHOICE
   |    (Victoria recruited: HaX's maintenance code replaces the card)
CAGE GATE (rfid: her card) -> CAGE: cage_opened (the other bin goes; legacy clock starts)
   |
PLAN CABINET (biometric: her print) -> NIGHTSHADE'S FILE (+ HaX's notebook scan -> the hand)
   |
VM FLAG 2 (reading room) -> ledger; H&L file number -> hl_box (password) -> placing sheet (optional)
   |
FLAG 2 + CAGE OPENED + OUTSIDE THE CAGE -> THE RECRUITER'S CALL -> DECK CHOICE
   |
DECK CHOICE -> #unlock_door -> SORENSEN'S OFFICE (password door)
   |
SAFE (pin: PIN CRACKER | desk drawer by picks) -> THE READING + MASTER SCHEDULE + TAPE ROOM CARD
   |
TAPE ROOM (rfid: the card) -> SALVAGE CAGE KEYPAD (password: decoded code; Gary's hint | the legend)
   |
VM FLAG 3 (salvage station) + NIGHTSHADE'S FILE -> IDENTITY SCENE -> answer
   |
VM FLAG 4 + identity_scene_done -> THE READ -> TESSERACT'S CALL -> "[Bring me in.]" -> DEBRIEF
```

Mandatory flag nodes: all four (`concludeRequires`, S4 §9).

### 4.2 Boss-key audit

Depth is doors from the start room on the shortest route (dock 0; front desk and open stacks 1; reading room and closet 2; restricted stacks 3; cage, office and tape room 4; salvage cage 5). "Seen" is where the player first meets the lock; "key" is where its key, code or event first becomes available.

| Lock | Type | Seen | Key | Verdict |
|---|---|---|---|---|
| Dock office door | key | 0 | 0 (picks, start kit) | ✅ by design: a capability from m01 being spent |
| Staff door, front desk → reading room | RFID | 1 | 1 (Noor, same room) | ❌ same room, accepted: it is a helper route for a won m05 branch, not a puzzle; route B always works |
| Restricted stacks outer door | RFID (release) | 2 (from the reading room) | 2 (flag 1, VM) | ✅ boss-key: the VM work is the hunt; HaX's refusal line says so |
| Cage gate | RFID | 3 | 3 (Sorensen's card, cloned in conversation) | ❌ same room, accepted: the hunt is social (bluff, recognition, standing close), which is m08's beat made harder by the mesh; the lock and the person are meant to be in one place |
| Plan cabinet | biometric | 4 | 3 (the stamp on the hatch shelf) | ✅ boss-key for a player who meets the reader first and goes back for the print; ⚠️ key-before-lock for one who lifts the stamp on sight. HaX's restricted-series topic names both readers ("the gate takes her card, the cabinet takes a print") so the early lift has a reason |
| H&L box | password (file number) | 1 (open stacks) | 2 (flag 2) | ✅ boss-key, optional |
| Sorensen's office | password (HaX) | 3 | the deck choice | ✅ boss-key: seen from the hub all through Act 2 |
| Director's safe | PIN | 4 | the briefing (cracker), or 4 (desk drawer, picks) | ✅ by design: the cracker is this mission's grant, felt as an absence since m02 (m08 left it out of the kit) |
| Desk drawer | key | 4 | 0 (picks) | ✅ by design (the long way) |
| Tape room | RFID | 3 | 4 (the card in the safe) | ✅ boss-key: in view from the hub since Act 2 |
| Salvage cage keypad | password | 5 | 2 (flag 1's encoded entry) | ⚠️ key-before-lock, by design: the player carries a code they can't yet read or place; the keypad is the encounter, the decode the hunt, Gary or the legend the help |
| Salvage crate | key | 5 | 0 (picks) | ✅ by design, optional |

Two ❌ verdicts, both social locks where the person is the lock. Nothing on the critical path is opened by something in the same room without a conversation or a VM flag between.

### 4.3 What could break (SOFTLOCK_PATTERNS S1, S2)

- **S1, a burnt first call.** No gate keys on "was a call answered": every forced scene sets its own done-flag on its last choice and re-rings (S4 §6).
- **S2, order dependence.** Checked for each lock against what the player may already hold:
  - Flag 2 before the cage: the call waits (S4 §4 row 3). Flag 2 before flag 1 (if the VM allows it): aim 3 reveals itself early, which is harmless, and the call still needs the cage, which needs flag 1.
  - The card cloned and the gate opened before the bin choice: the default bin applies (`cage_bin = derek_file`).
  - The cabinet left shut and the office reached: flag 3 waits on the file (HaX's hold line), a one-room walk back from the hub.
  - Sorensen knocked down in the cage before the cabinet: her card drops (irrelevant, the gate is open), the print stays on the stamp, the legacy files are saved; the talk-down choice is gone, which is the knock-out's cost.
  - Old Coyote or Noor knocked down: nothing on the critical path is theirs (Noor's card is a helper; Old Coyote's key duplicates the picks).
  - Tran knocked down before flag 1: `stop_the_tape_wipe` waits for flag 1 before it completes, so aim 2 stays hidden (S4 §3.2).
  - The PIN cracker never received (briefing skipped by a reload before Kowalczyk's line): the `game_loaded` give backstop, and the desk-drawer PIN.
  - A line of sight interrupting a pick: a pick is only interrupted by a person NPC in the lock's room (or the player's) that has a `lockpick_used_in_view` person-chat mapping that would fire, and hidden or knocked-out NPCs are now skipped (`npc-manager.js:353-400`; PASS2 lesson 12 is stale on this). m09 plans no lockpick catch, so no pick can be interrupted. If stage 7 wants one, Noor catching the player at the dock's office door is the natural place (the door opens into her room).

## 5. Cumulative kit

Every tool the player has used in m01–m08 is in the kit, and each gets at least one real use. The PIN cracker is the grant (puzzle-chains §3b: the player has gone without it since m02, and m08's ATHENA made a point of it).

| Tool | From | Used on (critical in bold) | Notes |
|---|---|---|---|
| Lockpicks | m01, start kit | **the dock office door** (route A); Sorensen's desk drawer (the long way to the PIN); the salvage crate (the binders) | three locks, one required on one route; route B needs none |
| RFID cloner | m03/m08, start kit | **Sorensen's stacks card at the hatch** (MIFARE with custom keys, m08's harder clone); the tape room reads the physical card from the safe | the m08 technique, through a mesh this time |
| Fingerprint kit | m04/m08, start kit | **the plan cabinet**, with the print off her stamp | moved from the gate to the cabinet (S4 §14 P2) |
| PIN cracker | m02 (optional pick-up), issued at the briefing | **Sorensen's safe** | only PIN lock in the mission, so the cracker can't skip anything else; the office and both keypads are `password` locks for that reason |
| CyberChef workstation | m01, start kit | **the salvage cage code** (archive encoding, from flag 1); the Alpha annotations (optional) | the code's author has a motive: Sorensen kept the salvage cage's code out of the public catalogue in the archive's own shelf-code scheme (puzzle-chains §3d) |
| Social engineering | m01 on | Noor (help), Old Coyote (past him), **Sorensen at the hatch**, Tran (talked off), Gary (hint) | |
| Combat | m01 on | Tran, the called guard, Sorensen if pushed, anyone the player chooses | every knock-out leaves the mission finishable (§4.3, S4 §5) |
| VM | every mission | **four flags**, two stations, two launchers onto the same attack VM | §9 |

Lock types on the map: key (3), RFID (4: the staff door, the outer door, the gate, the tape room), biometric (1), PIN (1), password (3: the office, the salvage keypad, the H&L box), plus the VM flags. Each of the five puzzle-chains lock classes appears.

## 6. Progressive unlocking and backtracking

| Point | Open to the player | Still shut, and visibly so |
|---|---|---|
| Start | dock; front desk (picks) and open stacks (shutter); reading room by either route; server closet | the restricted stacks door (HaX: the reader is on the catalogue server) |
| Flag 1 | + restricted stacks (HaX opens it) | the cage gate (her card), the office (keypad), the tape room (card), all in view from the hub |
| The hatch | + her card cloned, her print lifted | – |
| The gate | + the cage; the plan cabinet (her print) | – |
| Flag 2 | the H&L box (file number) | – |
| The deck choice | + Sorensen's office (HaX) | the safe |
| The safe | + the tape room (card) | the salvage keypad |
| The code | + the salvage cage | – |

**Backtracking, by design** (the prompt asks for two or three moments):

1. **The cage to the reading room for flag 2** (one door, through the hub). The ledger read and the call happen on the way out, so the walk is where the story lands.
2. **The reading room to the open stacks for the H&L box** (one door, optional), once flag 2 gives the number the box has been refusing since Act 1.
3. **The salvage cage back to the cage for Nightshade's file**, only for a player who skipped the cabinet: the identity scene holds the name until the file is in hand (S4 §4 row 9). Three doors, a real walk, and HaX says why.

Act 3 has no long walk-backs on the critical path: the office and the tape room are each one door off the hub, and the salvage cage is one door past the tape room (stage 1 §6's S-01 requirement).

## 7. Where each Tier 1 import changes a room

FA §3.1's nineteen Tier 1 imports. Imports aren't available to the ERB, so each one acts through a mapping condition, an object variant or an ink branch, never a room definition (FA §3 "How R and P imports are built"). Every room works with every import at its default.

| Import | Use | Room | How it shows | Default |
|---|---|---|---|---|
| `m06_architect_identity_found` | L+ | salvage cage (by phone); the briefing | which confession form; HaX's aside at the "-- A." | the "neither" form |
| `m07_teacher_discussed` | L+ | salvage cage (by phone) | where the confession starts | as above |
| `m07_architect_echo_heard` | L+ | salvage cage (by phone) | HaX's recognition line first | `m03_directive_decoded`'s line, else none |
| `m08_nightshade_triple_agent` | P + H | reading room (his call on flag 1); HaX's hub anywhere (the file) | `nightshade_phone` rings; the send-his-file topic | no call |
| `m08_nightshade_arrested` | L+ | briefing (the wall) | the m08 card's visit line | the never-played card |
| `m08_nightshade_ko_before_fate` | L+ | briefing | HaX's opening; "Not the bunker. Not yet." | "Same classroom" pick-up |
| `m08_tomb_gamma_location_known` | L+ | Sorensen's office (`lease_file` variant); reading room (the payments page, with `m06_monitoring_enabled`) | "There it is. Tomb Gamma has an address." vs "Same coordinate Nightshade gave us." | the neutral framing |
| `m05_recruiter_deal_accepted` | L+ | the call (anywhere outside the cage) | the sold-and-lied opening and its first choice | the stranger, or "the next one" |
| `m05_recruiter_deal_confessed` | L+ | the call; front desk | HaX cuts in; Noor's late warning | – |
| `m05_found_pipeline_list` | H | front desk (Noor's card, `noor_desk_box`); the cage (`feed_table_box` empty) | warned in time | a wary Noor; the box on the feed table |
| `m05_torres_turned` | H | open stacks (the H&L boxes) | Torres rings | no call |
| `m05_final_choice` | prop | reading room (`ledger_view`); the cage (`printed_ledger`) | Torres' entry: blown, live, closed placement, lost | "lost" |
| `m03_victoria_fate` | R | restricted stacks / cage (the maintenance code via HaX's hub); Sorensen's office (`lease_file` line) | the gate opens without the card; the door scene in the cage | the card |
| `m02_gary_protected` | H | salvage cage keypad | Gary rings with the hint | the legend on the reading room wall |
| `m01_maya_ko` | O | server closet (Tran sees first); open stacks (the called guard; Old Coyote to the reading-room door) | obstacles, each avoidable | HaX's warning and no surprise |
| `m06_monitoring_enabled` | H | reading room (`case_file` payments page) | HaX's line; the bunker pointer on the no-coordinate branch | the page absent from the file |
| `m02_insider_asset_arrested` | prop | the cage (`printed_ledger`) | Reeves' handler's sheet (read rule) | no sheet |
| `m02_reeves_fate` | prop | the cage (`printed_ledger`) | the same, finer | as above |
| `m08_nightshade_tidied` | P | restricted stacks (the far bin) | Nightshade's copy instead of the letters | the letters |

**Tier 2 (lines only)** land in the rooms where their line is said: the Reading's entries in Sorensen's office (`m01_final_choice`, the innocents line from `m01_kevin_ko` / `m01_sarah_ko` / `m02_patient_assaulted`, `m04_disclosure_choice`, `m07_debrief_stance`); the office files (`m02_paid_ransom`, `m03_danny_fate`, `m03_danny_ko`, `m06_irina_recruited`); the salvage cage (`m04_*` and `m04_crew_lost` on the notice, `m06_minder_walked` at the casualty sheet, `m03_directive_decoded`); the ledger (`m07_found_tomb_gamma`); the briefing and the debrief (the wall cards, `m04_lore_safehouse_address_found`, `m07_team_*`, `m08_debrief_stance`, `m08_netherton_*`, `m08_hax_ko`).

## 8. NPC placement

Positions are tiles in the room (the sprite's centre; the feet sit about a tile lower), roughly two-thirds across and a third to half down on clear floor (dressing skill), unless the story places them. Hidden and phone NPCs use 500,500 by convention.

| NPC | Room | Kind | Spawn | KO | Notes |
|---|---|---|---|---|---|
| `agent_0x99` (HaX) | `loading_dock` | phone | – | – | hosts the hub, the bridges and three forced scenes; `unlockable: ["restricted_stacks", "restricted_cage", "sorensen_office"]`; `itemsHeld`: four field guides |
| `recruiter` | `loading_dock` | phone | – | – | not in `npcIds`; `unlockable: ["sorensen_office"]` |
| `nightshade_phone`, `torres_phone`, `gary_phone` | `loading_dock` | phone | – | – | branch calls only |
| `briefing_cutscene` + `netherton`, `quintero`, `kowalczyk`, `malhotra`, `arakawa` | `loading_dock` | person, hidden | 500,500 | n/a | registered speakers for the briefing and the hangar; `kowalczyk.itemsHeld`: the PIN cracker |
| `closing_debrief` | `loading_dock` | person, hidden | 500,500 | n/a | the hangar cutscene |
| `noor_haddad` | `front_desk` | person | (6.5, 4.5), behind the counter | `noor_ko`; `taskOnKO: meet_the_clerk`; drops her card | leaves on `noor_told` |
| `old_coyote` | `open_stacks` | person, patrol | waypoints round the bays | `old_coyote_ko`; drops the dock key | `los` + `challengeOnSight`; leaves on `old_coyote_told` |
| `archive_guard` | `open_stacks` | person, hidden, hostile once shown | (2, 6) by the shutter | – | only on `m01_maya_ko` after Tran sees the player; needs a name and sprite (S4 §14 P14) |
| `jesse_tran` | `server_closet` | person | (2.5, 3.5) at the console | `tran_ko` + HaX mapping for `tran_outcome` | `los` + `challengeOnSight` on `m01_maya_ko` |
| `sorensen_hatch` | `restricted_stacks` | person | (8.5, 5.5), in the sealed strip | `koImmune: true` | `rfidCard` (MIFARE custom keys); hides on `cage_opened` |
| `sorensen` | `restricted_cage` | person | (6.5, 4.5), at the feed | `sorensen_ko`; HaX sets `sorensen_fate` unless `talked`; drops her card | shown on entry unless `sorensen_ko` |
| `alpha_recording` | `tape_room` | person, hidden | 500,500 | n/a | the clip's speaker (person-chat, TTS) |

**One non-HaX voice per scene** (stage 1 §11): the layout keeps the call outside the cage (Sorensen never shares it), Torres' call at the boxes (Old Coyote may be on the floor but isn't in the call), and Gary's at a keypad two doors from anyone. The clip is its own scene.

**Cast diversity** (FA rule): the called guard is the only new face this stage adds; SE §3 gives the rest. Stage 6 or 7 casts him with a different look and age from Old Coyote and Tran.

## 9. VM launchers and flag stations

The m01–m08 pattern: a `vm-launcher` that opens the attack box (the console key is the attack VM, not the target, README "How SecGen and Break Escape scenarios relate"), and a `flag-station` beside it whose `acceptsVms` names the target system and whose `flagRewards` set one global per flag.

| Object | Room | Kind | VM | Flags | Rewards (index-parallel) | Story |
|---|---|---|---|---|---|---|
| `field_laptop` | `reading_room` | `vm-launcher` | `vm_object('attack_vm', …)` | – | – | the field laptop the player sets up on a reading desk |
| `drop_terminal` | `reading_room` | `flag-station` | `acceptsVms: ["catalogue_server"]` | `flags_for_vm('catalogue_server', …)` | `set_global flag1_submitted`, `set_global flag2_submitted` | the SAFETYNET drop terminal; HaX is live on it |
| `field_kit_link` | `salvage_cage` | `vm-launcher` | the same attack VM | – | – | the field kit plugged into Tomb Beta's rack, linked to the drop terminal |
| `tomb_beta_station` | `salvage_cage` | `flag-station` | `acceptsVms: ["tomb_beta_server"]` | `flags_for_vm('tomb_beta_server', …)` | `set_global flag3_submitted`, `set_global flag4_submitted` | the only station that takes Tomb Beta's flags |

- **Why two launchers.** The player can work flags 3–4 from the reading room's laptop too (it is one attack box), but the second launcher means nobody walks back four doors to type. Two launchers onto one VM is the same console twice; stage 9 checks the launcher has no per-object session state.
- **Why the stations differ.** One station per machine keeps each flag's `submit_flags` target unique (`drop_terminal:catalogue_server-flagN`, `tomb_beta_station:tomb_beta_server-flagN`) and holds the order: Tomb Beta's flags can't be submitted until the salvage cage is open (lesson 6: one submission point per flag).
- **Flag rewards set globals only.** One reward per flag, and the `unlock_door` reward currently opens the station's own room (§10, S4 §4); doors are opened by HaX's ink.
- **System names** are placeholders until the VM plan (S4 §1).
- **Field guides** are offered on exposure to each launcher and the salvage cage (S4 §7.2).

## 10. Engine item verdicts

Stage 1 §11's engine list: items 1–15, then stage 3's items 16–29 (MC §11 changes 30–42; 16 and 23 withdrawn there). Verdicts: **works** (as is), **pattern** (works with the scenario pattern named), **engine** (needs engine work; listed for the user). Code read for each; nothing was changed.

| # | Item | Verdict | Evidence and pattern |
|---|---|---|---|
| 1 | Locks opened by a flag reward and by an ink global | **pattern** + engine bug | Ink `#unlock_door:<room>` works from person and phone chats (`chat-helpers.js:71-97`) for an NPC with `unlockable` the player has met (`game.rb:1247-1270`; room NPCs count as met when their room loads, `games_controller.rb:1519-1557`). A flag reward can't do it: one reward per flag (`games_controller.rb` ~2163), and its `unlock_door` opens the station's own room because the station's `room_id` is merged over the reward (~2166, ~2233). Pattern: HaX's `#unlock_door` (S4 §4 rows 1, 2b, 5). Bug for the user. |
| 2 | Flag 2 on its own station | not used | One station per machine (§9). Stage 1's option is declined: a second station accepting the same VM would split one flag's submission point. |
| 3 | A call that survives being closed | **works** | F14: `disableClose` honoured for Esc and the back arrow; `resume: true` (`npc-manager.js:1148-1160`); README "Forced phone calls". |
| 4 | A second speaker in a phone thread, shown and voiced | shown: **works**; voiced: **engine** | `otherSpeaker()` draws a registered name over the bubble (`phone-chat-ui.js:665-676`). Phone text isn't TTS-voiced at all (only `voice:` bubbles, `phone-chat-ui.js:232-260`), so neither speaker is heard. User question (S4 §15). |
| 5 | Two calls due on one walk | **works** | A `delayMs` mapping waits while any minigame or conversation is open, retrying every 500 ms (`npc-manager.js:612-620`), so HaX's Beat 2.7 call and Torres' follow each other. Pending delays aren't saved: room-entry backstops (S4 §5). |
| 6 | The cage counter | **pattern** | An NPC talks only in its own room: a sealed strip behind a counter in `restricted_stacks`, `sorensen_hatch` in it with `koImmune` (F14, `npc-hostile.js:262-275`), swapped for `sorensen` in the cage on `cage_opened` (`setVisible`). The strip is collision in the new room map. |
| 7 | Sorensen non-combat | **works** | NPCs are non-hostile by default; she fights back only if attacked (as any friendly NPC). The hatch record can't be attacked (`koImmune`). |
| 8 | Item removal and spawn on a global | **pattern** | No show or hide for objects on a global (no such field in `rooms.js`, `apply-actions.js`). `spriteVariants`, `textVariants` and `observationVariants` on a standing object (`rooms.js:679-690`, `utils/conditional-text.js`) do the job: the bins, the legacy box, the printed ledger, Noor's box, the payments page. Items reach the inventory by `#give_item` or containers. |
| 9 | Calls held while in a conversation | **works** | As item 5. A conversation mapping without `delayMs` closes whatever is open (`npc-manager.js:1033-1036`, `:1145-1148`), so every story call uses `delayMs`. |
| 10 | Object text that changes on a global | **works** | `resolveObjectField` (examine, read, hover label), first match wins; `&&` only in conditions (README). |
| 11 | Tran's sight trigger; Old Coyote's re-routed round | Tran **works**; Old Coyote **pattern** | `los.challengeOnSight` with `requireGlobal`, `player_spotted:<id>` (README). Old Coyote: `patrolOverride` within his own room (to the reading-room door) rather than a pass through the reading room (S4 §14 P6). |
| 12 | Drop-terminal actions reachable from the tape room | **pattern** | Moved to HaX's hub, reachable from every room (S4 §7.1 topics 2 and 11; P8). |
| 13 | The multi-speaker briefing and hangar | **works** | Person-chat voices each registered speaker with their own TTS voice (`person-chat-minigame.js:1420-1431`); the speakers are hidden NPCs in the start room. |
| 14 | Ambient sound and near-silence | ambient: **engine** (optional); silence: asset | A room's `ambientSound` is fixed (`rooms.js:3041-3068`), so the shredder can't stop on a global. Near-silence is a silent track asset (milestone M-06); music events have no volume key. |
| 15 | Reload mid-call | **pattern**, browser test at stage 9 | Phone stories are saved after each choice; nothing re-rings on load by itself, so every forced scene has a `game_loaded` re-ring with the same condition (trial report "Limits"; S4 §6). |
| 16 | (withdrawn at stage 3) | – | – |
| 17 | The Recruiter's call: two resume points after a "yes", crossing speakers, and after a reload | **pattern**, browser test | Three re-ring mappings with disjoint conditions: the Recruiter `resume: true` before an answer; the Recruiter at `resume_name` between "yes" and the name; HaX at `deck_resume` after she has gone (S4 §6.1), each also on `game_loaded`. |
| 18 | The ledger line a minute after the deck | **works** | `delayMs: 60000` on HaX, setting `invoice_booked`; `ledger_view`'s `textVariants`; a room-entry backstop for a reload. |
| 19–20 | The legacy box: removed at the first of the file or the exit, unless Sorensen is down; under Noor's desk on warned in time; across a reload | **pattern** | The cage as its own room gives `room_exited` (`rooms.js:3009-3014`); the file's `onPickup` `setVariable` (never an item id); `npc_ko:sorensen`; the box is a variant object, so nothing needs removing; every state is a global, so it survives a reload. |
| 21 | A knock-out on Sorensen that doesn't overwrite `talked` | **pattern** | No `globalVarOnKO` on the fate; HaX's `npc_ko:sorensen` mapping sets `sorensen_fate: "ko"` only with `globalVars.sorensen_fate !== 'talked'`. `sorensen_ko` is a separate global. |
| 22 | A conditional choice in Sorensen's conversation on holding the file | **works** | Ink reads `nightshade_file_held` (a synced global `VAR`). |
| 23 | (withdrawn at stage 3) | – | – |
| 24 | Noor and Old Coyote leaving, their desks left in place | **works** | `setVisible: false` on their own mappings (their rooms are loaded when the player tells them); objects are separate. |
| 25 | The Alpha-tapes clip as an ink conversation from the station, voiced | **pattern** | The deck's `onInteract.actions` sets a global (`interactions.js:1591`); a hidden person NPC in the tape room opens its person-chat on it, voiced by TTS per speaker. No object audio path needed. |
| 26 | The double-cross text on first entry to the tape room | **works** | Recruiter mapping on `room_entered:tape_room` with `sendTimedMessage`, `onceOnly`. |
| 27 | A choice in the debrief between the stance and the hub, resumed if closed | **works**, browser test | Ink order; `disableClose`; person-chat saves after each choice; m05's room-entry backstop for a reload. |
| 28 | The drop terminal's send actions from the tape room | **pattern** | As item 12. |
| 29 | The cage bins: one removed on `cage_opened` | **pattern** | `spriteVariants` on `cage_bin`, whose default is written on `cage_opened` (S4 §4). |

**Also found while checking** (none blocks m09):

- `object_interacted` carries `objectType`, `objectName` and `roomId`, not an object id (`interactions.js:627-631`); mappings match on type and room, or name.
- PASS2 lesson 12 is stale: hidden and knocked-out NPCs no longer interrupt picks (`npc-manager.js:364-368`).
- `vm-launcher` and `flag-station` ignore an object lock (handled before the lock check, `interactions.js:918, 1051` vs `:1340`), which is why Tomb Beta's server is behind a door rather than a lock on the station (S4 §14 P1).

**Engine work for the user** (none needed for m09 to work): the flag-reward `unlock_door` bug (item 1, one line); TTS for phone-chat lines (item 4, if the scenes should be heard); a room ambient sound that follows a global (item 14, optional).

## 11. Checks for stage 9

The 05 prompt's technical checklist, restated for the current engine. Stage 9 runs each tool and records the result.

- [ ] Every room type is a registered 2×2 (or the closet's 1×1) map with a two-tile north wall (`scripts/room_gen/check_room_walls.py --scenario …` reads 64 for every map).
- [ ] `ruby scripts/validate_scenario.rb` clean of ❌; the geometry check prints "Room layout geometry OK" (the ring of four closes on the grid, §2).
- [ ] `python3 scripts/predict_door_sides.py` and `tools/pass2/door_align.py`: every N/S pair aligned; the hub's north and south doors on the side clear of the hatch strip. If parity puts them on the east, move the strip's south end up a row or move the office/tape-room branch one column (README consequence 2).
- [ ] `restricted_stacks`' map: the counter and the strip are collision; the stamp sits on the player's side within 32 px of a standing tile; `sorensen_hatch` is reachable for conversation and the clone across the counter (the NPC's tap area is its 80×80 frame).
- [ ] Every interactable a tile from the next (`slot_audit.py`); the case file and the notebook scan especially; the two salvage-cage terminals.
- [ ] Every visible NPC's position and patrol waypoint inside its room's real tilemap; Old Coyote's cone (`range` in pixels, about 150) leaves room to circle the bays.
- [ ] Every pinned object has a position (objects with no template slot land at random, lesson 28).
- [ ] The validator's KO-resilience check: no critical-path task completed only by a KO-able NPC's ink (`meet_the_clerk` is optional; the hatch task also completes on `cage_opened`).
- [ ] The relay rule: every lasting mapping is on a start-room NPC or on a person NPC's own room (README "An NPC outside the start room only hears events once its room has loaded").
- [ ] Browser: the forced-scene reloads (S4 §12.3); the hatch clone and print; two launchers onto one VM; HaX's `#unlock_door` on all three doors after a reload.

## 12. Proposed changes

S4 §14 holds the full list (P1–P14). The ones that come from the layout:

- **P1** Tomb Beta's server, its station and the four phone scenes move into the salvage cage, off the tape room (stage 1 Beats 3.2–3.6 and §11; stage 0 §2.1, §2.3; FA §1.3, §1.4, §6.1).
- **P2** The card opens the cage gate; the print opens the plan cabinet (stage 1 Beats 2.1–2.2; stage 0 §2.2; FA §6.1 item 1, row 32).
- **P3** Sorensen is two records, the hatch one `koImmune` (stage 1 Beat 2.1 staging; FA §13 item 31 can be marked settled).
- **P4** The cage is its own room: HaX's line is "…or walk out of this cage" (MC §4.3).
- **P5** Noor's card opens the front desk's staff door into the reading room (stage 1 Beat 1.2; FA row 62 if it says "side door").
- **P6** Tran's radio sends Old Coyote to the reading-room door (stage 1 Beat 1.1; FA §3.1 `m01_maya_ko`).
- **New here, P15:** stage 0 §6's nine-room list and stage 1 §11's beat table add `restricted_stacks` (the cage's outer aisle and the inner hub) as a room distinct from `restricted_cage`: ten rooms.
- **New here, P16:** SE §6.1's "The tape room is blue standby LEDs and the hiss of a server's fans, the only machine in the building that is warm" splits: the tape room keeps the LEDs and the cold; the salvage cage gets the fans.

## 13. For the user

1. **Two changes to the story's staging, both forced by the engine** (one lock per door; a terminal can't be locked): Tomb Beta's server stands in the salvage cage behind the decoded keypad rather than in the tape room, and the cage's print opens the plan cabinet rather than the gate. Neither changes a choice, a cost or a line the player must hear. Say if either reads wrong.
2. **A new face**: the guard Tran calls in on the `m01_maya_ko` branch needs a name and a sprite (cast diversity).
3. **Ten new room maps** for an archive (no shipped room type fits). That is room-dressing and asset work at stage 9 onwards, at the same scale as m08's set.
4. The engine items in §10's last paragraph, repeated in S4 §15.
