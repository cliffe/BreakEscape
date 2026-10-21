# m09 Digital Archaeology: Stage 5, room layout

## 0. Status and inputs

Stage 5. Author: stages 4–5 author (Opus), 2026-10-21. Status: **stages 4–5 complete** (round 1–3 fixes folded in, §14–§16; reviews `REVIEW_R1_PUZZLES.md`, `REVIEW_R1_DESIGN.md`, `REVIEW_R2.md`, `REVIEW_R3.md` in this folder). Designed to user decisions F17 and F20 (voiced forced calls, `voiced: true`; F20 is committed: a voiced call voices its start knots and every knot they reach, never entering the contact's home knot, `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8), F18 (the flag-reward door fix), F19 (`unlockDoor`, a persistent door unlock from a mapping) and F10 (the `silence` playlist), committed in 57d3d237. Companion to `../stage_4/objectives_tasks.md` ("S4"), which holds the tasks, globals, mappings and forced scenes; this document holds the space.

Inputs: as S4 §0, plus `story_dev_prompts/05_room_layout_design.md`, the `mission-puzzle-chains` skill (lock order, cumulative kit, the silent-failure bug sweep), the `mission-room-dressing` skill (layout constraints only: north wall two tiles, square props, NPCs clear of furniture, interactables 32 px apart), `README_scenario_design.md` (grid units, room types, door rules, authoring rules), `tools/pass2/PASS2_LESSONS.md`, and the engine (`core/rooms.js`, `systems/doors.js` via the README's rules, `systems/interactions.js`, `systems/npc-manager.js`, `systems/npc-hostile.js`, `systems/unlock-system.js`, `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/game.rb`).

**Units.** The 05 prompt's "4×4 to 15×15 GU, 1 GU = 1.5 m" is the old system. The engine's grid unit is 5 tiles wide by 4 tiles stackable height; a 2×2 GU room is 10×10 tiles (320×320 px) with the top two rows as wall; valid heights are 6, 10, 14… tiles (README "Room Layout System"). All sizes below are in those units, and positions are in tiles within the room (floor starts at tile row 2).

**What this stage decides.** Ten rooms on one map (stage 0's nine, with the cage split from its outer aisle), in four sizes: a 4×2 warehouse floor, seven 2×2 rooms, a 2×1 mesh pen and the 1×1 server closet. Four rooms around a ring at the front of the building so the player can choose a route past the guard or past the clerk; a tree behind it, with the restricted stacks as the inner hub that the cage, Sorensen's office and the tape room all open off. Every lock on the critical path is one the engine enforces, in the order stage 1 §11 needs, with the kit the player carries.

## 1. The building

Mountain States Records & Retention: a grain warehouse on the edge of Helena, converted forty years ago (SE §6.1). Night, after hours, a small staff: a guard on his round, a clerk loading trolleys, an IT contractor in the server closet, the director behind the cage mesh. Security is a records company's: card readers on the inner doors, a keypad on the director's office, a fingerprint reader on one cabinet she installed herself, a night guard. Nothing is built to stop a trained agent; everything is built to keep a records clerk out of the restricted series.

**Shape of the night in space.** The front of the building (dock, front desk, open stacks, reading room) is Act 1, and its ring gives two ways to the reading room. Act 2 and Act 3 happen off the restricted stacks, one door north of the reading room: the cage to the east, Sorensen's office to the west, the tape room to the north and the salvage cage behind it. The shredder is loudest in the middle of the map and audible everywhere, which is the night's clock (SE §6.1).

**Room count and size against the shipped missions.** m08 has ten rooms, m02 fifteen (six of them corridors, which the puzzle-chains skill counts against it). m09 has ten and no corridor: every room holds a person, a lock or a find.

## 2. Map, grid and doors

Grid origin is the start room's top-left; `gx` grows east, `gy` grows south, in grid units. Sizes vary with what each room is (review D-08): the open stacks is a 4×2 warehouse floor (20×10 tiles), the salvage cage a 2×1 mesh pen (10×6), the server closet 1×1 (5×6), the rest 2×2 (10×10).

```
gy -7                     +-------------------+
                          |  SALVAGE CAGE 2x1 |  password (decoded code)
gy -6                     +-------------------+  station + launcher (flags 3-4)
                          |  TAPE ROOM        |  rfid (card from the safe)
                          |  legend, deck     |
gy -4   +-----------------+-------------------+-------------------+
        | SORENSEN'S      =  RESTRICTED       =  RESTRICTED CAGE  |
        | OFFICE          |  STACKS (hub)     |  rfid (her card)  |
        | password (HaX)  |  hatch counter E  |                   |
gy -2   +-----------------+-------------------+-------------------+---------------------+---+
                          |  READING ROOM     =  OPEN STACKS (4x2 warehouse floor)       =SC |
                          |  drop terminal    |  Old Coyote's round, H&L boxes          |   |
gy  0                     +---- rfid ---------+-------------------+---------------------+---+
                          |  FRONT DESK       =  LOADING DOCK     |  start
                          |  Noor             |  key door W, shutter N
gy  2                     +-------------------+-------------------+
                        gx -2               gx 0                gx 2                  gx 4
       gx -4
```

(Not to scale; the table is the layout. `=` marks an east/west door.)

| Room | gx, gy | Size | Connections (lock on the door into the room) |
|---|---|---|---|
| `loading_dock` (start) | 0, 0 | 2×2 | N `open_stacks` (shutter, open); W `front_desk` (office door, key: picks) |
| `front_desk` | −2, 0 | 2×2 | E `loading_dock`; N `reading_room` (staff door, RFID: Noor's card, cloned or given) |
| `open_stacks` | 0, −2 | 4×2 | S `loading_dock`; W `reading_room` (open); E `server_closet` (open) |
| `reading_room` | −2, −2 | 2×2 | S `front_desk`; E `open_stacks`; N `restricted_stacks` |
| `server_closet` | 4, −2 | 1×1 | W `open_stacks` |
| `restricted_stacks` | −2, −4 | 2×2 | S `reading_room` (RFID `stacks_release`: HaX's `unlockDoor` on flag 1); E `restricted_cage`; W `sorensen_office`; N `tape_room` |
| `restricted_cage` | 0, −4 | 2×2 | W `restricted_stacks` (RFID `stacks_card`: Sorensen's card) |
| `sorensen_office` | −4, −4 | 2×2 | E `restricted_stacks` (password: HaX's `unlockDoor` on the deck) |
| `tape_room` | −2, −6 | 2×2 | S `restricted_stacks` (RFID `tape_room_reader`: the card in the safe); N `salvage_cage` |
| `salvage_cage` | −2, −7 | 2×1 | S `tape_room` (password: the decoded catalogue code) |

**How the engine places them** (BFS from the start room). The dock places the open stacks north. The two rooms differ in width, so the engine aligns them on the edge that keeps the door corner the same (`positionNorthSingle`, `rooms.js:1239-1263`): at an even grid sum that is the left edge, so the open stacks runs gx 0..3. The dock places the front desk west (−2, 0). The open stacks place the reading room west (−2, −2, top-aligned) and the closet east (4, −2). The front desk's north door finds the reading room already at (−2, −2), exactly above it, so the ring of four closes. Everything past the reading room is a tree. No connection uses an array.

**Checked on a stub** (review D-14). A stub scenario with these rooms and connections, using shipped maps of the same sizes (`room_office` 10×10, `room_aes_hall1` 20×10, `room_hq_intel` 10×6, `small_room_1x1gu`), passes `scripts/check_door_alignment.py`: all ten connections OK (stub at the scratch path given in the stage 4–5 report). Every north/south door lands on the **west** corner (every room origin and shared wall here has an even grid sum, as round 1's reviewer traced in `doors.js`), and every east/west door 2.5 tiles down. So:

- the restricted stacks' north (tape room) and south (reading room) doors are in its north-west and south-west corners, and its east wall is free for the gate at the top and the hatch counter below it;
- the hub's tape-room door (north wall) and office door (west wall, 2.5 tiles down) sit in the same corner, within one standing tile's 64 px door reach (review m9). They are two separate door sprites, so a tap picks the one under it; stage 9 confirms in the browser, and if a tap is ambiguous the office branch moves to the hub's south-west by hanging it off the reading room instead.

`predict_door_sides.py` couldn't render the plain-JSON stub (it expects an ERB); stage 9 runs it on the real file.

**World-space overlaps.** None: the cage (0..1, −4..−3) sits above the open stacks' west half with no door between them; the closet (4, −2) is east of the open stacks; the office is west of the reading room's column; the tape room and the 2×1 salvage cage (gy −7) stack above the hub. The validator's geometry check confirms at stage 9.

## 3. Rooms

Room types are placeholders. No shipped room type is a records warehouse; the nearest are `room_archive_1x2gu`, `room_library_1x2gu` and m08's `room_hq_archives`, which the dressing pass should start from for the stacks rooms rather than drawing from scratch (review D-08). Stage 9 builds m09's own types (`room_m09_*`) and registers them (README "Available Room Types"); the contents below say what each map must hold. Positions are tiles in the room (x across from 0, floor from y 2). Every interactable is at least a tile from the next (32 px reach, dressing skill), and no NPC stands on or in front of one. Reach to an NPC is 32 px centre to centre for walking NPCs, and to the body's nearest edge for static-sprite NPCs (`constants.js:65`, `interactions.js:384-389`, `npc-reach.js`); nothing is reachable across a counter unless the NPC is static.

### 3.1 `loading_dock` (start)

- **Size and doors.** 2×2. W door: the office door into the front desk, `lockType: "key"` (`requires: "dock_office_door"`, `keyPins`, `difficulty: "easy"`), opened with the start-kit picks; Old Coyote's key ring holds the only key (his `itemsHeld`), so it also drops if he is knocked out, which keeps the validator from flagging a key lock nothing can open. N door: the roller shutter into the open stacks, open (his round's way in).
- **Lighting.** Night exterior; sodium light, cold.
- **NPCs.** Every phone contact (`agent_0x99`, `recruiter`, `nightshade_phone`, `torres_phone`, `gary_phone`) and every hidden person NPC, so their mappings are loaded from the first frame (S4 §5): `briefing_cutscene` (`timedConversation` with `waitForEvent: "game_loaded"` and `skipIfGlobal: "briefing_played"`, background Task Force Null's room); the briefing's registered speakers (`director_netherton`, `quintero`, `kowalczyk`, `malhotra`, `arakawa`; Netherton's id matches m08 and m10, renamed from `netherton` at the stages 4–5 milestone); `hax_voice` (a person-type HaX with her voice, so she can speak inside person-chats such as the Alpha clip and the debrief; review m10). `hax_voice` is kept for now with the same `voice` and `fx` as `agent_0x99`, since both show "Agent HaX" and a prefix resolves to the first match; stage 9 tests in the browser whether the phone contact alone resolves in a person-chat (the character registry holds every registered NPC) and, if so, drops `hax_voice` (milestone M9-24, F-12); and `closing_debrief` (the hangar). All at 500,500. The Recruiter is not in the phone's `npcIds` (lesson 36, m05's pattern).
- **Objects.** The guard hut desk with `incident_book` (notes: a week of "shredder running, night" entries); a fence, bins and a pallet (dressing).
- **Spawn.** Bottom-right of the yard, facing the two doors, so HaX's first line can name both: "Shutter's his round. The office door's quieter." Both routes now work on every branch (§3.2).
- **Start inventory.** Phone; lockpick set; RFID cloner; fingerprint kit; CyberChef workstation; **Kowalczyk's PIN cracker**, which the briefing narrates her handing over (S4 §14 P15, review M4: a `#give_item` in the briefing would give from the briefing's host, not from her).
- **Tasks here.** `get_inside` (on leaving).

### 3.2 `front_desk`

- **Size and doors.** 2×2. E: the dock. N: the staff door into the reading room, `lockType: "rfid"`, `requires: "reading_staff_door"`.
- **Lighting.** Fluorescent over the counter, the rest dim; Noor's desk lamp.
- **NPC.** `noor_haddad` (person, walking) **on the floor by the trolleys**, about (6.5, 5.5), not behind the counter, so the player can reach her (review m5). `rfidCard: { card_id: "reading_staff_door", rfid_protocol: "EM4100" }` (an easy card) and `#clone_keycard:reading_staff_door` in her hub on **every** branch, as a choice that reads as standing close while she checks her list: the cloner's first use of the night, before Sorensen's harder card (review D-01). Warned in time, she hands over `noor_staff_card` (`keycard`, `opens_lock: "reading_staff_door"`) with `#give_item`; a knock-out drops it. Leaves on `noor_told` (`setVisible: false` on her own mapping; her desk and its objects stay). `globalVarOnKO: "noor_ko"`; `taskOnKO: "meet_the_clerk"`. No `los` block.
- **Objects.** `trolley_list` (notes: the destruction schedule's copy, series numbers, "Series R" on every line) and the two trolleys, both with variants that empty in three steps on `flag1_submitted`, `flag2_submitted` and `cage_opened` (review D-04); `noor_desk_box` under her desk, a readable object whose `textVariants` show the legacy placement files on `m05_found_pipeline_list && !m05_recruiter_deal_accepted` and "Returns for re-shelving. County deeds." otherwise.
- **Tier 1 here.** `m05_found_pipeline_list` / `m05_recruiter_deal_accepted` / `m05_recruiter_deal_confessed`: which Noor, the handed card, the held box.
- **Tasks here.** `meet_the_clerk` (optional).

### 3.3 `open_stacks`

- **Size and doors.** 4×2 (20×10 tiles), the warehouse floor. S: the dock (shutter, at the room's west end, where the dock meets it). W: the reading room (open). E: the server closet (open). No lock: here the guard is the obstacle.
- **Lighting.** Motion-sensor strips that come on one bay at a time as the player walks; the shredder louder here.
- **NPCs.**
  - `old_coyote` (person) on a patrol that crosses the room's west end (between the shutter and the reading-room door, route B's seven-tile crossing) on every lap and returns down the long aisles past the H&L boxes (review m-R2-7): `patrol.waypoints`, `waypointMode: "sequential"`, `loop`, `los` with `angle` about 120 and `range` about 150 px, `challengeOnSight` (`rooms: ["open_stacks"]`, `skipIfGlobal: "old_coyote_told"`) mapped to a person-chat challenge: talk past (any cover), "[Tell him the truth.]" (`old_coyote_told`, then `setVisible: false`: "I'll be in the truck."), or a fight. `globalVarOnKO: "old_coyote_ko"`. On `m01_maya_ko` after flag 1: `patrolOverride` to a tile **beside** the reading-room door, never on it, so his body can't block route B (review m5), and HaX's text "Tran's just sent the guard to your door."
  - `archive_guard` (person, hidden, the guard Tran calls in on `m01_maya_ko`): not hostile while hidden. His own mapping on `global_variable_changed:tran_alerted` (and a catch-up on `room_entered:open_stacks` with `globalVars.tran_alerted`) shows him by the shutter and opens a one-line person-chat ("Hey! Stay where you are.") that ends `#hostile:archive_guard`, so no hidden NPC is ever hostile (review m10). Needs a name and sprite (S4 P14).
- **Objects.** Shelving bays of client deposits (dressing); `hl_box` (Harwick & Lowe's dead files), a container with `lockType: "password"`, `requires` the file number from flag 2 (on the drop terminal's screen and in HaX's ledger read); `contents`: `hl_placing_sheet` (notes; `onRead` `setVariable: { "sleeper_shortlist": true }`). A bay label beside it ("HARWICK & LOWE, EXEC SEARCH (CLOSED). RETENTION 25 YRS.") makes the boxes findable before the number.
- **Tier 1 here.** `m01_maya_ko` (the reroute, the called guard); `m05_torres_turned` (Torres rings as the boxes are opened after flag 2).
- **Tasks here.** `cross_reference_wren` (optional).

### 3.4 `server_closet`

- **Size and doors.** 1×1. W: the open stacks (open).
- **Lighting.** Rack LEDs, a monitor's glow; the degausser's whine while the tape side is wiped.
- **NPC.** `jesse_tran` (person) at the console, about (2.5, 3.5). `los` with `challengeOnSight` (`requireGlobal: "m01_maya_ko"`, `rooms: ["server_closet"]`; the cone works only with him in the player's room, so "sees the player first" means at the closet door): `player_spotted:jesse_tran` sets `tran_alerted`. His ink: talk him off it with the letters (`tran_outcome = talked`, his price first), or a fight. `globalVarOnKO: "tran_ko"`, and HaX's `npc_ko:jesse_tran` mapping sets `tran_outcome: "ko"` unless `talked`.
- **Objects.** `tape_side_console` (readable; "WIPE IN PROGRESS", or "WIPE HALTED" on `tran_outcome !== 'left'`).
- **Tasks here.** `stop_the_tape_wipe` (optional, brief-gated, S4 §3.2).

### 3.5 `reading_room`

- **Size and doors.** 2×2. S: the staff door from the front desk. E: the open stacks. N: the restricted stacks' outer door (`rfid`, `requires: "stacks_release"`; no card in the world; HaX's `unlockDoor` on flag 1, S4 §4 row 1; refusal text before it, S4 §6.6).
- **Lighting.** The only warm room: green-shaded lamps, a radiator that knocks.
- **Objects** (the drop terminal is a reading desk with the field kit on it; review D-13 thinned this room):
  - `field_laptop`: `vm-launcher` (the attack VM).
  - `drop_terminal`: `flag-station`, `acceptsVms: ["catalogue_server"]`, `flagRewards`: `[set_global flag1_submitted, set_global flag2_submitted]`.
  - `drop_terminal_screen`: one readable with stacked `textVariants`, most advanced first: the sale line on `invoice_booked`; the ledger after `flag2_submitted` (WREN's entry, the H&L source code and file number, Torres' line by `m05_final_choice`); the catalogue after `flag1_submitted` (the Series R shelf marks); "Public catalogue only." before. **Every variant from flag 1 on ends with the coded salvage line** ("salvage cage: access ****"), so no later variant hides it. The line also reaches the notepad on every route as a notes item HaX's `flag1_read` gives (`#give_item:notes:catalogue_salvage_line` from her `itemsHeld`; not `#add_note`, review N-R3-1), and her keypad topic quotes it (review B-R2-1). The coded string avoids `|`, `#`, `//`, `{`, `}` (review m-R3-4).
  - `case_file`: readable; HaX's case file (the order's photograph, the wall's cards, the raid team), with the tagged-payments page as a `textVariants` section on `m06_monitoring_enabled`.
  - `notebook_scan`: readable, a course code on the label; `onRead` sets `notebook_read`. Two tiles from the case file. It stays its own object because `notebook_read` has to come from reading this scan, not the case file.
  - microfiche reader, public catalogue terminal (dressing; "Series R: no records").
- **Tier 1 here.** `m06_monitoring_enabled` (the payments page); `m08_nightshade_triple_agent` (his call on flag 1); `m05_final_choice` (the ledger line).
- **Tasks here.** `set_up_drop_terminal`, `submit_catalogue_flag`, `submit_ledger_flag`.

### 3.6 `restricted_stacks` (the hub)

- **Size and doors.** 2×2. S (south-west corner): the reading room. E (2.5 tiles down): the cage gate, `rfid`, `requires: "stacks_card"`. W (2.5 tiles down): Sorensen's office, `password`, a code nobody has (HaX's `unlockDoor` on the deck). N (north-west corner): the tape room, `rfid`, `requires: "tape_room_reader"`. All four in view from the middle of the room.
- **The cage front.** The east wall below the gate is a mesh line with a **hatch counter**: a counter half a tile deep with collision from about x 7.0 to 7.5, y 4 to 7, and a sealed strip behind it (x 7.5–9, y 4–7) where Sorensen works. The gate is above the strip at the top of the east wall, reached from the player's side. Strip and counter are collision rectangles in the new room map (as `room_uni_lecture`'s seat rows).
- **Lighting.** The cage front lit hard white like a shop counter; the aisle dark until the strips catch it.
- **NPC.** `sorensen_hatch` (person) in the strip, behind the counter. A static sprite shows its first idle frame, which faces south (`npc-sprites.js:66-70, 143-151`), so she is set `facePlayer: false` (m02's Mr Pryce, `m02 scenario.json.erb:1732-1736`) and reads as bent over her work at the counter; a west-facing static sheet is the dressing pass's option (review m-R2-4).
  - **Reach (review B1).** `behavior.staticSprite: true`, `behavior.immovable: true`, with the default full-sprite collision body (`npc-sprites.js:91-107`), placed so the body's west edge meets the counter's player-side edge (centre about x 8.25 for an 80 px sprite). The engine then measures reach from the player's body centre to the nearest point of her body (`npc-reach.js`), which is under 32 px from a tile at the counter. A static sprite shows one frame; her talk portrait (`spriteTalk`) works as usual. **Fallback** if the browser check fails: a `hatch_bell` object on the counter whose `triggerOnInteract` sets `hatch_bell_rung`, and her own mapping on that global opens her person-chat (a mapping-opened conversation needs no reach, and she stays the host, so `#clone_keycard` still reads her `rfidCard`).
  - `koImmune: true` ("behind the mesh"). `rfidCard: { card_id: "stacks_card", rfid_protocol: "MIFARE_Classic_Custom_Keys" }` (m08's harder clone, the night's second). `#clone_keycard:stacks_card` is offered on **every** branch of her hatch knot and as a repeatable hub choice ("[Lean on the counter while she stamps.]"), because nothing else can clone that card.
  - Her hatch knot sets `hatch_talked` at the top, plays the bluff and the recognition, HaX's two bin lines, the bin buttons (`#give_item` of the pulled file by id from her `itemsHeld`, `bin_chosen`, `cage_bin`), and "Take the print if you like."
  - `itemsHeld`: three notes items, `derek_file` (Derek Lawson's file), `letters` (the Social Fabric letters) and `nightshade_copy` (what Nightshade cleared from his locker). The buttons offer Derek's file and the letters, or Derek's file and Nightshade's copy on `m08_nightshade_tidied`; the unoffered item is never given. Stage 6 writes their text.
  - Hidden on `global_variable_changed:cage_opened`, **and** by a relay on `room_entered:restricted_stacks` with `globalVars.cage_opened`, for Victoria's route where the gate can open before this room has loaded (review M6). NPC visibility persists across reloads (`state-sync.js:13, 82`).
- **Objects.**
  - `sorensen_stamp`: on the hatch shelf on the player's side at the counter's south end, about (6.5, 6.5), a tile clear of her body (review m-R2-4); `hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`, `fingerprintDifficulty: "medium"`, a candidates list of the archive's staff. Its `observationVariants` carry the purge line on `flag2_submitted && !cage_opened`: "Her stamp's warm. She's three boxes from the bins." (moved from the bins, which sit out of reach behind her).
  - `hatch_bin_near`, `hatch_bin_far`: the two bins at the shredder's mouth in the strip, behind her (seen, not examined: her body fills the strip and the bins are beyond the 32 px object reach); `spriteVariants` on `cage_bin` show which one went in. HaX's two bin lines in the hatch conversation name them, so nothing depends on examining them.
  - Binders and shelving along the west wall, either side of the office door (dressing; "past the binders").
- **Tier 1 here.** `m08_nightshade_tidied` (the far bin and its button); `m03_victoria_fate` (the hatch can be skipped).
- **Tasks here.** `enter_restricted_stacks`, `talk_at_the_hatch`.

### 3.7 `restricted_cage`

- **Size and doors.** 2×2. W (2.5 tiles down): the gate (`rfid`, Sorensen's card; on Victoria's route HaX's `unlockDoor`). One door, so leaving the cage is a `room_exited` the engine sees.
- **Lighting.** Hard white over the shredder line; the cabinet's corner darker.
- **NPCs.**
  - `sorensen` (person) at the shredder's feed, about (6.5, 4.5), the feed table behind her to the south-east; non-hostile; shown on `room_entered:restricted_cage` unless `sorensen_ko`. `itemsHeld`: her stacks card **only** (review M5). `globalVarOnKO: "sorensen_ko"`; her fate on a knock-out is set by HaX's `npc_ko:sorensen` mapping only when not `talked`. Her ink: "When I've finished, dear."; the talk-down choice "[He kept his own papers off your list. Only yours burn.]" shown only on `nightshade_file_held`. No `los` block.
  - `sorensen_door` (person, hidden, `koImmune: true`, 500,500, Sorensen's display name and voice): hosts Victoria's door scene (the recognition and "[Take Derek's file.]" / "[Take the letters.]", or "[Take Nightshade's copy.]" in place of the letters on `m08_nightshade_tidied`) on `room_entered:restricted_cage` with `globalVars.cage_opened && !globalVars.hatch_talked && !globalVars.bin_chosen`, and holds the same three items as `sorensen_hatch` (`derek_file`, `letters`, `nightshade_copy`) in its `itemsHeld`, each given by id, so knocking down `sorensen` can't drop the file that went in the shredder (review M5).
- **Objects.**
  - `feed_table_box`: the legacy placement files on the feed table behind her; readable; `textVariants` and `spriteVariants`, most specific first: Noor held it ("Empty feed tray. The last box never came up."), saved (`legacy_files_saved`: the files), gone (`legacy_clock_run`: "Strips."), at risk ("She's working through it sheet by sheet.").
  - `plan_cabinet`: in the north-east corner, so the walk from the gate runs past her and the feed table; `lockType: "biometric"`, `requires: "Margaret Sorensen"`, `biometricMatchThreshold: 0.5` (review m3); `contents`: `nightshade_file` (notes; `onPickup` `setVariable: { "nightshade_file_held": true }`).
  - `printed_ledger`: on the ledger shelf; readable; `textVariants`: locked binder before flag 2; the codename pages after (Reeves' handler's sheet on that branch; Noor's codename); shredded once read if Sorensen is free.
  - The shredder and the degausser (dressing; ambient sound on this room and the hub).
- **Tier 1 here.** `m02_insider_asset_arrested` / `m02_reeves_fate` (the contact sheet); `m03_victoria_fate` (the door scene); `m05_found_pipeline_list` (the empty feed tray).
- **Tasks here.** `open_the_cage` (on the gate's unlock), `open_plan_cabinet`, `stop_the_shredding` (optional).

### 3.8 `sorensen_office`

- **Size and doors.** 2×2. E: the hub (`password`, HaX's `unlockDoor` on the deck). A keypad by the door, "not on the card system".
- **Lighting.** A desk lamp and the kettle's light; warm, small.
- **NPCs.** None.
- **Objects.**
  - `director_safe`: floor safe, `lockType: "pin"`; `contents`: `the_reading` (notes; `onPickup` sets `reading_found`), `the_reading_last_page` (notes; `onRead` sets `reading_finished`; two objects because `onRead` shadows `onPickup`, review m1), `master_schedule` (notes; `onRead` sets `schedule_read`), `tape_room_keycard` (`keycard`, `opens_lock: "tape_room_reader"`).
  - `rent_book` (notes): every page headed with the lease's start date, which is the safe's PIN; the long way, found by reading rather than picking (review m7). Its Irina line on `m06_irina_recruited`.
  - `lease_file` (notes, takeable, `id: "lease_file"`: Tomb Gamma's deed and construction file; variants on the no-coordinate branch and on `m03_victoria_fate` arrested or ko); `danny_sheet`, `refit_ledger` (notes, each with its Tier 2 variant).
  - `deck_controller`: the deck's controller the Recruiter fired the wipe from; readable; variants by `deck_pulled`.
  - Wall of binders, the certificate for twenty years' service to Lewis and Clark County, the kettle (dressing).
- **Tier 1 here.** `m08_tomb_gamma_location_known` (the lease file's line); `m03_victoria_fate` (the lease line).
- **Tasks here.** `enter_office`, `open_the_safe`, `take_the_reading`, `take_tape_room_card`, `find_the_deed`.

### 3.9 `tape_room`

- **Size and doors.** 2×2. S (south-west corner): the hub (`rfid`, the card from the safe). N (north-west corner): the salvage cage (`password`).
- **Lighting.** Blue standby LEDs; cold. Tape racks to the roof.
- **NPC.** `alpha_recording` (person, hidden): the "Dr Adrian Tesseract (recording)" speaker for the clip, with his m07 voice and a recording style. HaX's line in the clip is spoken through `hax_voice` (§3.1).
- **Objects** (something on every deck route; review D-03):
  - `shelf_code_legend`: the archive's shelf-code chart, framed on the north wall beside the salvage keypad. It is the key the coded line needs: with the line from the notepad and the chart, the player runs the CyberChef operation stage 6 chooses (S4 §4 row 7, P20). Gary's call names the operation.
  - `alpha_tape_deck`: a reel deck on a bench; `triggerOnInteract: [{ "type": "set_global", "key": "alpha_deck_used", "value": true }]` (review m2; it emits each time, so the clip can be replayed). `alpha_recording`'s mapping on that global opens its person-chat (`targetKnot: "deck"`), whose ink routes: no tapes (`deck_pulled != "alpha_tapes"`: "Empty spools. Degaussed."), held (before `identity_scene_done`: HaX, "I know whose voice that is. After."), or the clip (two lines, then HaX: "Tape two. He gave that lecture every year."; `alpha_clip_played`).
  - `alpha_annotations`: readable on the Alpha-tapes route (elsewhere "Blank label stock"), the optional decode, done on the CyberChef workstation from the start kit; stage 6 picks its encoding (the legend's operation or a different one) and the coded text. No field guide covers it (`m09_archive_code_guide` is for the salvage code).
- **Tasks here.** `enter_tape_room`.

### 3.10 `salvage_cage`

- **Size and doors.** 2×1 (10×6 tiles): a mesh pen smaller than the tape room in front of it (review D-08). S: the tape room (`password`; Gary rings at the first attempt on `m02_gary_protected`).
- **Lighting.** Tomb Beta's server fans and status lights, the only warm thing in the building; crates in the dark.
- **NPCs.** None. The identity scene, the read and Tesseract's call are phone scenes heard here.
- **Objects**, spaced along the four floor rows at about x 1.5, 3, 4.5, 6, 7.5 (a tile and a half apart, clear of the side walls); stage 9's `slot_audit.py` decides the final spots (review m-R2-8):
  - `tomb_beta_rack`: the server itself (dressing, with an `observations` line).
  - `field_kit_link`: `vm-launcher` (the same attack VM as `field_laptop`), on a crate beside the rack.
  - `tomb_beta_station`: `flag-station`, `acceptsVms: ["tomb_beta_server"]`, `flagRewards: [set_global flag3_submitted, set_global flag4_submitted]`.
  - `albion_folder`: the catalogue entry, his memo and the unsent notice in one folder, printed off the box; `textVariants` on `flag3_submitted` (before it, "Printer tray, empty.") (review D-07).
  - `mirror_job_printout`: a readable in the printer tray beside the station; "Printer tray, empty." before `flag4_submitted`, then the casualty sheet and the release-key line (SE §5) as `textVariants`. Flag 4's content is then something the player can read, not only HaX's text read (milestone M9-23).
  - `enrolment_binders`: in a crate with `lockType: "key"` (picks), Tomb Beta's enrolment binders in the same hand (optional).
  - The door controller with its wires cut, crates stencilled ALPHA and BETA (dressing, against the back wall).
- **Tier 1 here.** `m02_gary_protected` (the keypad call); the identity scene's forms play here.
- **Tasks here.** `open_salvage_cage`, `submit_owner_flag`, `hear_the_name`, `submit_control_flag`, `hear_the_mirror_job`, `send_the_notice` (optional; the send is in HaX's hub).

## 4. Lock graph and boss-key audit

### 4.1 The dungeon graph in text

Critical path in capitals; optional in lower case. `→` is "opens".

```
start kit (picks, cloner, print kit, CyberChef, PIN CRACKER from Kowalczyk)
   |
DOCK --picks--> front desk --(Noor's card: cloned, handed over, or dropped)--> READING ROOM   [route A]
DOCK --shutter (Old Coyote's floor)--> open stacks --> READING ROOM                            [route B]
   |
READING ROOM: field laptop -> VM FLAG 1 -> HaX unlockDoor -> RESTRICTED STACKS
   |                         \-> drop terminal screen: coded salvage line (into the notepad)
RESTRICTED STACKS: Sorensen at the hatch --talk--> CLONE HER CARD; lift PRINT off the stamp; BIN CHOICE
   |    (Victoria recruited: HaX's maintenance code opens the gate instead of the card)
CAGE GATE (rfid: her card) -> CAGE: cage_opened (the other bin goes; legacy clock starts)
   |
PLAN CABINET (biometric: her print) -> NIGHTSHADE'S FILE (+ HaX's notebook scan -> the hand)
   |
VM FLAG 2 (reading room) -> ledger; H&L file number -> hl_box (password) -> placing sheet (optional)
   |
LEDGER READ + CAGE OPENED + OUTSIDE THE CAGE -> THE RECRUITER'S CALL (voiced) -> DECK CHOICE
   |
DECK CHOICE -> HaX unlockDoor -> SORENSEN'S OFFICE (password door)
   |
SAFE (pin: PIN CRACKER | the rent book's date) -> THE READING + MASTER SCHEDULE + TAPE ROOM CARD
   |
TAPE ROOM (rfid: the card) + legend on the wall + coded line in the notepad -> CyberChef -> SALVAGE CAGE KEYPAD (password)
   |
VM FLAG 3 (salvage station) + NIGHTSHADE'S FILE -> IDENTITY SCENE (voiced) -> answer
   |
VM FLAG 4 + identity_scene_done -> THE READ -> TESSERACT'S CALL (voiced) -> "[Bring me in.]" -> DEBRIEF
```

Mandatory flag nodes: all four (`concludeRequires`, S4 §9).

### 4.2 Boss-key audit

Depth is doors from the start room on the shortest route (dock 0; front desk and open stacks 1; reading room and closet 2; restricted stacks 3; cage, office and tape room 4; salvage cage 5).

| Lock | Type | Seen | Key | Verdict |
|---|---|---|---|---|
| Dock office door | key | 0 | 0 (picks, start kit) | ✅ by design: a capability from m01 being spent |
| Staff door, front desk → reading room | RFID | 1 | 1 (Noor's card, cloned in conversation on every branch, or handed over) | ❌ same room, accepted: the cloner's easy first use, a social beat; route B always works |
| Restricted stacks outer door | RFID (release) | 2 | 2 (flag 1, VM) | ✅ boss-key: the VM work is the hunt; HaX's refusal line says so |
| Cage gate | RFID | 3 | 3 (Sorensen's card, cloned across the counter) | ❌ same room, accepted: the hunt is social (bluff, recognition, standing close), m08's beat made harder by the mesh and a harder card |
| Plan cabinet | biometric | 4 | 3 (the stamp on the hatch shelf) | ✅ boss-key for a player who meets the reader first; ⚠️ key-before-lock for one who lifts the stamp on sight, which HaX's "the gate takes her card, the cabinet takes a print" gives a reason for |
| H&L box | password (file number) | 1 | 2 (flag 2) | ✅ boss-key, optional |
| Sorensen's office | password (HaX) | 3 | the deck choice | ✅ boss-key: in view from the hub all through Act 2 |
| Director's safe | PIN | 4 | the start kit (the cracker), or 4 (the rent book's date, a read) | ✅ by design: the cracker is this mission's grant; the long way costs a careful read, not a 30-second pick (review m7) |
| Tape room | RFID | 3 | 4 (the card in the safe) | ✅ boss-key: in view from the hub since Act 2 |
| Salvage cage keypad | password | 5 | the coded line at 2 (in the notepad) + the legend at 4 (beside the keypad) | ✅ boss-key: the keypad is the encounter, the legend on the same wall and the coded line already carried are the hunt, CyberChef the tool, Gary the help (review M7, D-03) |
| Salvage crate | key | 5 | 0 (picks) | ✅ by design, optional |

Two ❌ verdicts, both social locks where the person is the lock. Nothing on the critical path is opened by something in the same room without a conversation, a decode or a VM flag between.

### 4.3 What could break (SOFTLOCK_PATTERNS S1, S2)

- **S1, a burnt first call.** No gate keys on "was a call answered": every forced scene sets its own done-flag on its last choice and re-rings, and every first ring has a room-entry backstop (it fires on load too) (S4 §4, §5; review B3).
- **S2, order dependence.** Checked for each lock against what the player may already hold:
  - Flag 2 before the cage: the call waits for the opened cage and for the player to be outside it (S4 §4 row 3).
  - The card cloned and the gate opened before the bin choice: the default bin applies (`cage_bin = derek_file`).
  - The cabinet left shut and the office reached: flag 3 waits on the file (HaX's hold line), a short walk back through the hub.
  - Sorensen knocked down in the cage before the cabinet: her card drops (irrelevant, the gate is open), the print stays on the stamp, the legacy files are saved; the talk-down is gone, which is the knock-out's cost. She holds no file, so the bin stays lost (review M5).
  - Victoria's code used before the stacks are entered: not offered (S4 §7.1 topic 14 needs `stacks_entered`), and the hatch record hides on entry anyway (review M6).
  - Old Coyote or Noor knocked down: nothing on the critical path is theirs (Noor's card is a helper with a clone beside it; Old Coyote's key duplicates the picks).
  - Tran knocked down before flag 1: `stop_the_tape_wipe` waits for flag 1 before completing, so aim 2 stays hidden (S4 §3.2).
  - A reload inside the cage with the call due: `in_cage` is cleared on load (review M2).
  - A reload mid-debrief: it reopens (review B2).
  - A line of sight interrupting a pick: only a person NPC with a `lockpick_used_in_view` person-chat mapping can interrupt, and hidden or knocked-out NPCs are skipped (`npc-manager.js:353-400`; PASS2 lesson 12 is stale). m09 plans no lockpick catch.

## 5. Cumulative kit

Every tool the player has used in m01–m08 is in the kit, and each gets at least one real use. The PIN cracker is the grant (puzzle-chains §3b: the player has gone without it since m02, and m08's ATHENA made a point of it).

| Tool | From | Used on (critical in bold) | Notes |
|---|---|---|---|
| Lockpicks | m01, start kit | **the dock office door** (route A); the salvage crate (the binders) | route B needs none |
| RFID cloner | m03/m08, start kit | Noor's card (easy, every branch, route A); **Sorensen's stacks card at the hatch** (MIFARE with custom keys); the tape room reads the physical card from the safe | an easy clone in Act 1, then the hard one through a mesh (review D-01) |
| Fingerprint kit | m04/m08, start kit | **the plan cabinet**, with the print off her stamp | |
| PIN cracker | m02 (optional pick-up), Kowalczyk's, in the start kit | **Sorensen's safe** | the only PIN lock; the office and both keypads are `password` locks so the cracker can't skip anything; the long way is a careful read of the rent book |
| CyberChef workstation | m01, start kit | **the salvage cage code**: the coded line from the notepad, keyed by the tape room's legend; the Alpha annotations (optional) | stage 6 picks an encoding CyberChef performs with a key the legend supplies (S4 P20); the code's author, Sorensen, had a motive to keep it out of the public catalogue |
| Social engineering | m01 on | Noor (the clone, or her help), Old Coyote (past him), **Sorensen at the hatch**, Tran (talked off), Gary (hint) | |
| Combat | m01 on | Tran, the called guard, Sorensen if pushed, anyone the player chooses | every knock-out leaves the mission finishable |
| VM | every mission | **four flags**, two stations, two launchers onto the same attack VM | §9 |

Lock types on the map: key (2), RFID (4: the staff door, the outer door, the gate, the tape room), biometric (1), PIN (1), password (3: the office, the salvage keypad, the H&L box), plus the VM flags.

## 6. Progressive unlocking and backtracking

| Point | Open to the player | Still shut, and visibly so |
|---|---|---|
| Start | dock; front desk (picks) and open stacks (shutter); reading room by either route (Noor's card cloned, or past Old Coyote); server closet | the restricted stacks door (HaX: the reader is on the catalogue server) |
| Flag 1 | + restricted stacks (HaX's `unlockDoor`) | the cage gate (her card), the office (keypad), the tape room (card), all in view from the hub |
| The hatch | + her card cloned, her print lifted | – |
| The gate | + the cage; the plan cabinet (her print) | – |
| Flag 2 | the H&L box (file number) | – |
| The deck choice | + Sorensen's office (HaX's `unlockDoor`) | the safe |
| The safe | + the tape room (card) | the salvage keypad |
| The code (the notepad line, the tape room's legend, CyberChef) | + the salvage cage | – |

**Backtracking, by design** (the prompt asks for two or three moments):

1. **The cage to the reading room for flag 2** (one door, through the hub). The ledger read and the call happen on the way out, so the walk is where the story lands.
2. **The reading room to the open stacks for the H&L box** (one door, optional), once flag 2 gives the number the box has been refusing since Act 1.
3. **The salvage cage back to the cage for Nightshade's file**, only for a player who skipped the cabinet: the identity scene holds the name until the file is in hand (S4 §4 row 9). Three doors, a real walk, and HaX says why.

Act 3 has no long walk-backs on the critical path: the office and the tape room are each one door off the hub, the salvage cage is one door past the tape room, and the code's key hangs beside its keypad (stage 1 §6's S-01 requirement; review M7, D-03).

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
| `m05_found_pipeline_list` | H | front desk (Noor hands over her card; `noor_desk_box`); the cage (`feed_table_box` empty) | warned in time | a wary Noor, whose card can still be cloned; the box on the feed table |
| `m05_torres_turned` | H | open stacks (the H&L boxes) | Torres rings | no call |
| `m05_final_choice` | prop | reading room (`drop_terminal_screen`); the cage (`printed_ledger`) | Torres' entry: blown, live, closed placement, lost | "lost" |
| `m03_victoria_fate` | R | restricted stacks / cage (the maintenance code via HaX's hub, once the player has seen the gate); Sorensen's office (`lease_file` line) | the gate opens without the card; the door scene in the cage (`sorensen_door`) | the card |
| `m02_gary_protected` | H | salvage cage keypad | Gary rings and names the CyberChef operation | the legend on the tape room wall |
| `m01_maya_ko` | O | server closet (Tran sees first); open stacks (the called guard; Old Coyote to the reading-room door) | obstacles, each avoidable | HaX's warning and no surprise |
| `m06_monitoring_enabled` | H | reading room (`case_file` payments page) | HaX's line; the bunker pointer on the no-coordinate branch | the page absent from the file |
| `m02_insider_asset_arrested` | prop | the cage (`printed_ledger`) | Reeves' handler's sheet (read rule) | no sheet |
| `m02_reeves_fate` | prop | the cage (`printed_ledger`) | the same, finer | as above |
| `m08_nightshade_tidied` | P | restricted stacks (the far bin) | Nightshade's copy instead of the letters | the letters |

**Tier 2 (lines only)** land in the rooms where their line is said: the Reading's entries in Sorensen's office (`m01_final_choice`, the innocents line from `m01_kevin_ko` / `m01_sarah_ko` / `m02_patient_assaulted`, `m04_disclosure_choice`, `m07_debrief_stance`); the office files (`m02_paid_ransom`, `m03_danny_fate`, `m03_danny_ko`, `m06_irina_recruited`); the salvage cage (`m04_*` and `m04_crew_lost` on the notice, `m06_minder_walked` at the casualty sheet, `m03_directive_decoded`); the ledger (`m07_found_tomb_gamma`); the briefing and the debrief (the wall cards, `m04_lore_safehouse_address_found`, `m07_team_*`, `m08_debrief_stance`, `m08_netherton_*`, `m08_hax_ko`).

## 8. NPC placement

Positions are tiles in the room (the sprite's centre; the feet sit about a tile lower), roughly two-thirds across and a third to half down on clear floor, unless the story places them. Hidden and phone NPCs use 500,500.

| NPC | Room | Kind | Spawn | KO | Notes |
|---|---|---|---|---|---|
| `agent_0x99` (HaX) | `loading_dock` | phone | – | – | hosts the hub, the bridges, the `unlockDoor` mappings and three forced scenes; `itemsHeld`: four field guides and the `catalogue_salvage_line` notes item; home knot (`currentKnot`) `start`, which diverts to `support_hub` (F20, S4 §6) |
| `recruiter` | `loading_dock` | phone | – | – | not in `npcIds`; her call is voiced |
| `nightshade_phone`, `torres_phone`, `gary_phone` | `loading_dock` | phone | – | – | branch calls only |
| `briefing_cutscene` + `director_netherton`, `quintero`, `kowalczyk`, `malhotra`, `arakawa` | `loading_dock` | person, hidden | 500,500 | n/a | registered speakers for the briefing and the hangar |
| `hax_voice` | `loading_dock` | person, hidden | 500,500 | n/a | HaX as a person-chat speaker (the clip, the debrief); same `voice` and `fx` as the phone contact; kept until stage 9's registry check (§3.1) |
| `closing_debrief` | `loading_dock` | person, hidden | 500,500 | n/a | the hangar cutscene |
| `noor_haddad` | `front_desk` | person | (6.5, 5.5), on the floor by the trolleys | `noor_ko`; `taskOnKO: meet_the_clerk`; drops her card | `rfidCard` (EM4100), clone on every branch; leaves on `noor_told` |
| `old_coyote` | `open_stacks` | person, patrol | two long aisles | `old_coyote_ko`; drops the dock key | `los` + `challengeOnSight`; leaves on `old_coyote_told`; override tile beside the reading-room door |
| `archive_guard` | `open_stacks` | person, hidden, non-hostile until his own conversation turns him | by the shutter | – | only on `m01_maya_ko` after Tran sees the player; needs a name and sprite |
| `jesse_tran` | `server_closet` | person | (2.5, 3.5) at the console | `tran_ko` + HaX mapping for `tran_outcome` | `los` + `challengeOnSight` on `m01_maya_ko` |
| `sorensen_hatch` | `restricted_stacks` | person, **static sprite**, immovable, `facePlayer: false` | about (8.25, 5.5), body edge at the counter | `koImmune: true` | `rfidCard` (MIFARE custom keys), clone on every branch; `itemsHeld`: `derek_file`, `letters`, `nightshade_copy`; hides on `cage_opened` (and on entry if already open) |
| `sorensen` | `restricted_cage` | person | (6.5, 4.5), at the feed | `sorensen_ko`; HaX sets `sorensen_fate` unless `talked`; drops her card only | shown on entry unless `sorensen_ko` |
| `sorensen_door` | `restricted_cage` | person, hidden | 500,500 | `koImmune: true` | hosts Victoria's door scene; `itemsHeld`: `derek_file`, `letters`, `nightshade_copy` |
| `alpha_recording` | `tape_room` | person, hidden | 500,500 | n/a | the clip's speaker (person-chat, TTS) |

**One non-HaX voice per scene** (stage 1 §11): the call rings outside the cage (Sorensen never shares it; the room-entry backstop can't ring it in the cage, review M1), Torres' call at the boxes, Gary's at a keypad two doors from anyone. The clip is its own scene.

**Cast diversity** (FA rule): the called guard is the only new face this stage adds; stage 6 or 7 casts him with a different look and age from Old Coyote and Tran.

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
- **Flag rewards set globals only.** One reward per flag. The `unlock_door` reward's wrong-room bug is being fixed (F18), but a flag still carries one reward, so doors that open on a flag open on HaX's F19 `unlockDoor` mapping keyed on the flag's global (S4 §4).
- **System names** are placeholders until the VM plan (S4 §1).
- **Field guides** are offered on exposure to each launcher and the salvage cage (S4 §7.2).

## 10. Engine item verdicts

Stage 1 §11's engine list: items 1–15, then stage 3's items 16–29 (MC §11 changes 30–42; 16 and 23 withdrawn there). Verdicts: **works** (as is), **pattern** (works with the scenario pattern named), **engine** (needs engine work; listed for the user). Code read for each; nothing was changed.

| # | Item | Verdict | Evidence and pattern |
|---|---|---|---|
| 1 | Locks opened by a flag reward and by an ink global | **works** with F19 | A flag carries one reward (`games_controller.rb:2160-2167`); its `unlock_door` opened the station's own room (fixed as F18). A HaX mapping keyed on the flag's or the deck's global unlocks the door persistently with `unlockDoor` (S4 §4 rows 1, 2b, 5), with an in-session retry and a load backstop. |
| 2 | Flag 2 on its own station | not used | One station per machine (§9). Stage 1's option is declined: a second station accepting the same VM would split one flag's submission point. |
| 3 | A call that survives being closed | **works** | F14: `disableClose` honoured for Esc and the back arrow; `resume: true` (`npc-manager.js:1148-1160`); README "Forced phone calls". `resume` restores the host's last saved story, so HaX's scenes re-ring to their own guarded knots instead, also on `conversation_closed:agent_0x99` (S4 §6). |
| 4 | A second speaker in a phone thread, shown and voiced | shown: **works**; voiced: **works** (F17, F20) | `otherSpeaker()` draws a registered name over the bubble (`phone-chat-ui.js:665-676`). F17's `voiced: true` voices each line in its speaker's voice, if the speaker is registered (`director_netherton` in the start room; carried in playtest segments). Under F20 (committed) only the call knots are voiced: the start knots each voiced mapping names as `targetKnot`, and every knot they reach, never entering the host's home knot; narration in a phone thread stays silent, so the scenes use HaX's asides instead (S4 §6). |
| 5 | Two calls due on one walk | **works** | A `delayMs` mapping waits while any minigame or conversation is open, retrying every 500 ms (`npc-manager.js:612-620`), so HaX's Beat 2.7 call and Torres' follow each other. Pending delays aren't saved: room-entry backstops (S4 §5). |
| 6 | The cage counter | **pattern** | An NPC talks only in its own room and within 32 px (`constants.js:65`): `sorensen_hatch` is a static-sprite NPC behind the counter whose body edge reaches it, so the body-edge reach applies (`npc-sprites.js:91-107`, `npc-reach.js`); `koImmune` (F14); swapped for `sorensen` in the cage on `cage_opened`. Fallback: a hatch bell whose global opens her conversation by mapping (review B1). Browser check at stage 9. |
| 7 | Sorensen non-combat | **works** | NPCs are non-hostile by default; she fights back only if attacked (as any friendly NPC). The hatch record can't be attacked (`koImmune`). |
| 8 | Item removal and spawn on a global | **pattern** | No show or hide for objects on a global (no such field in `rooms.js`, `apply-actions.js`). `spriteVariants`, `textVariants` and `observationVariants` on a standing object (`rooms.js:679-690`, `utils/conditional-text.js`) do the job: the bins, the legacy box, the printed ledger, Noor's box, the payments page. Items reach the inventory by `#give_item` or containers. |
| 9 | Calls held while in a conversation | **works** | As item 5. A conversation mapping without `delayMs` closes whatever is open (`npc-manager.js:1033-1036`, `:1145-1148`), so every story call uses `delayMs`. |
| 10 | Object text that changes on a global | **works** | `resolveObjectField` (examine, read, hover label), first match wins; `&&` only in conditions (README). |
| 11 | Tran's sight trigger; Old Coyote's re-routed round | Tran **works**; Old Coyote **pattern** | `los.challengeOnSight` with `requireGlobal`, `player_spotted:<id>` (README). Old Coyote: `patrolOverride` within his own room (to the reading-room door) rather than a pass through the reading room (S4 §14 P6). |
| 12 | Drop-terminal actions reachable from the tape room | **pattern** | Moved to HaX's hub, reachable from every room (S4 §7.1 topics 2 and 11; P8). |
| 13 | The multi-speaker briefing and hangar | **works** | Person-chat voices each registered speaker with their own TTS voice (`person-chat-minigame.js:1420-1431`); the speakers are hidden NPCs in the start room. |
| 14 | Ambient sound and near-silence | silence: **works** (F10 `silence` playlist); ambient: **engine** (optional) | A room's `ambientSound` is fixed (`rooms.js:3041-3068`), so the shredder can't stop on a global. Music events have no volume key. |
| 15 | Reload mid-call | **pattern**, browser test at stage 9 | Phone stories are saved after each choice; nothing re-rings on load by itself, so every forced scene has a `game_loaded` re-ring with the same condition, and HaX's scenes also re-ring on `conversation_closed:agent_0x99` (trial report "Limits"; S4 §6). |
| 16 | (withdrawn at stage 3) | – | – |
| 17 | The Recruiter's call: two resume points after a "yes", crossing speakers, and after a reload | **pattern**, browser test | Three re-ring mappings with disjoint conditions: the Recruiter `resume: true` before an answer; the Recruiter at `resume_name` between "yes" and the name; HaX at `deck_resume` (a guarded knot, also on `conversation_closed:agent_0x99`) after she has gone (S4 §6.1), each also on `game_loaded`. |
| 18 | The ledger line after the deck | **works** | HaX's mapping on `office_entered` (on `taken`/`double_crossed`) with `delayMs`, setting `invoice_booked`; the drop terminal screen's `textVariants`; a room-entry backstop. Moved from a minute after the deck to inside the office so the Act 2 to 3 seam stays quiet (review D-18). |
| 19–20 | The legacy box: removed at the first of the file or the exit, unless Sorensen is down; under Noor's desk on warned in time; across a reload | **pattern** | The cage as its own room gives `room_exited` (`rooms.js:3009-3014`); the file's `onPickup` `setVariable` (never an item id); `npc_ko:sorensen`; the box is a variant object, so nothing needs removing; every state is a global, so it survives a reload. |
| 21 | A knock-out on Sorensen that doesn't overwrite `talked` | **pattern** | No `globalVarOnKO` on the fate; HaX's `npc_ko:sorensen` mapping sets `sorensen_fate: "ko"` only with `globalVars.sorensen_fate !== 'talked'`. `sorensen_ko` is a separate global. |
| 22 | A conditional choice in Sorensen's conversation on holding the file | **works** | Ink reads `nightshade_file_held` (a synced global `VAR`). |
| 23 | (withdrawn at stage 3) | – | – |
| 24 | Noor and Old Coyote leaving, their desks left in place | **works** | `setVisible: false` on their own mappings (their rooms are loaded when the player tells them); objects are separate. |
| 25 | The Alpha-tapes clip as an ink conversation from the station, voiced | **pattern** | The deck's `triggerOnInteract` sets a global (`interactions.js:715-719`; `onInteract` is deprecated, review m2); the hidden `alpha_recording` in the tape room opens its person-chat on it, voiced per speaker; HaX speaks through the hidden person-type `hax_voice`. |
| 26 | The double-cross text on first entry to the tape room | **works** | Recruiter mapping on `room_entered:tape_room` with `sendTimedMessage`, `onceOnly`. |
| 27 | A choice in the debrief between the stance and the hub, after a reload | **works**, browser test | A mapping-opened person-chat restarts at its knot after a reload (`npc-manager.js:1072-1081`), so the debrief replays safely: it reads `debrief_notice_before` and skips answered beats (S4 §6.5); `disableClose`; m05's room-entry backstop. |
| 28 | The drop terminal's send actions from the tape room | **pattern** | As item 12. |
| 29 | The cage bins: one removed on `cage_opened` | **pattern** | `spriteVariants` on `cage_bin`, whose default is written on `cage_opened` (S4 §4). |

**Also found while checking** (none blocks m09):

- `object_interacted` carries `objectType`, `objectName` and `roomId`, not an object id (`interactions.js:627-631`); mappings match on type and room, or name.
- PASS2 lesson 12 is stale: hidden and knocked-out NPCs no longer interrupt picks (`npc-manager.js:364-368`).
- Reach to a walking NPC is centre to centre, so nobody behind a counter can be talked to unless they are a static-sprite NPC (round 1's review; `npc-reach.js` header). Noor stands on the floor for that reason.
- `vm-launcher` and `flag-station` ignore an object lock (handled before the lock check, `interactions.js:918, 1051` vs `:1340`), which is why Tomb Beta's server is behind a door rather than a lock on the station (S4 §14 P1).

**Engine work.** Decided on 2026-10-21 and committed: F17 (voiced forced calls), F18 (the flag-reward door bug), F19 (a persistent door unlock from a mapping) and F10 (the `silence` playlist) in 57d3d237; F20 (only the call is voiced) in 24fcb06c. Still open, none needed for m09: a room ambient sound that follows a global (item 14); a state sync straight after flag rewards, since `set_global` rewards land client-side only until the next sync (`apply-actions.js:34-44`, `state-sync.js:59-64`; review m6).

## 11. Checks for stage 9

The 05 prompt's technical checklist, restated for the current engine. Stage 9 runs each tool and records the result.

- [ ] Every room type is a registered map of the size in §2 (4×2, 2×2, 2×1, 1×1) with a two-tile north wall (`scripts/room_gen/check_room_walls.py --scenario …` reads 64 for every map).
- [ ] `ruby scripts/validate_scenario.rb` clean of ❌; the geometry check prints "Room layout geometry OK".
- [ ] `scripts/check_door_alignment.py` (passed on round 1's stub) and `scripts/predict_door_sides.py` on the real file: every N/S door on the west corner, the hub's east wall free for the gate and the counter.
- [ ] The hub's two north-west doors (tape room, office): a tap opens the door tapped (review m9).
- [ ] `restricted_stacks`' map: the counter is half a tile deep with collision, the strip sealed; `sorensen_hatch` (static sprite) can be talked to and cloned from a tile at the counter; if not, switch to the hatch bell (review B1). The stamp sits within 32 px of a standing tile.
- [ ] Noor reachable on the floor by the trolleys; Old Coyote's override tile beside, not on, the reading-room door.
- [ ] Every interactable a tile from the next (`slot_audit.py`), the 2×1 salvage cage especially.
- [ ] Every visible NPC's position and patrol waypoint inside its room's real tilemap; Old Coyote's two aisles in the 4×2 floor leave room to circle round him.
- [ ] Every pinned object has a position.
- [ ] The validator's KO-resilience check: no critical-path task completed only by a KO-able NPC's ink.
- [ ] The relay rule: every lasting mapping is on a start-room NPC, on a person NPC's own room, or relayed (the hatch hide, the called guard).
- [ ] Browser: the forced-scene reloads and first-ring reloads (S4 §12.3); the two clones and the print; two launchers onto one VM; F19's door unlocks after a reload; the three voiced scenes (F17), with only their call knots requesting audio (F20).
- [ ] Browser: a hit closes each of HaX's forced scenes, the player opens her thread, and closing it re-rings the scene at its guarded knot, with the choice unanswerable outside the call (S4 §6, milestone M9-04).
- [ ] Browser: HaX's line in the Alpha clip with and without `hax_voice` registered; drop it if the phone contact resolves (§3.1).

## 12. Proposed changes

S4 §14 holds the full list (P1–P20). The ones that come from the layout:

- **P1** Tomb Beta's server, its station and the three phone scenes heard there (the identity scene, flag 4's read, Tesseract's call) move into the salvage cage, off the tape room; the shelf-code legend is in the tape room.
- **P2** The card opens the cage gate; the print opens the plan cabinet.
- **P3** Sorensen is three records: the hatch one a static sprite and `koImmune`, the cage one holding only her card, a hidden `koImmune` one for Victoria's door scene.
- **P4** The cage is its own room: HaX's line is "…or walk out of this cage".
- **P5** Noor's card opens the front desk's staff door into the reading room and can be cloned on every branch; she stands on the floor.
- **P6** Tran's radio sends Old Coyote to a tile beside the reading-room door.
- **P15 (layout part)** The PIN cracker is in the start kit.
- **P16** The safe's long way is the rent book's date; Sorensen's desk drawer is gone.
- **P21 (new here)** Stage 0 §6's nine-room list and stage 1 §11's beat table add `restricted_stacks` as a room distinct from `restricted_cage`: ten rooms.
- **P22 (new here)** SE §6.1's sentence on the tape room's warm server splits: the tape room keeps the LEDs and the cold; the salvage cage gets the fans.
- **P23 (new here)** Room sizes: the open stacks is a 4×2 warehouse floor, the salvage cage a 2×1 mesh pen (review D-08). SE §6.1 and stage 0 §6 can describe them that way.

## 13. For the user

1. **Two changes to the story's staging, forced by the engine** (one lock per door; a terminal can't be locked): Tomb Beta's server stands in the salvage cage behind the decoded keypad, and the cage's print opens the plan cabinet rather than the gate. Neither changes a choice, a cost or a line the player must hear.
2. **A new face**: the guard Tran calls in on the `m01_maya_ko` branch needs a name and a sprite.
3. **Ten new room maps** for an archive, in four sizes. The stacks rooms can start from `room_archive_1x2gu`, `room_library_1x2gu` or m08's `room_hq_archives`.
4. Engine items still open: S4 §15 item 2.

## 14. Review round 1 outcomes

Reviews: `REVIEW_R1_PUZZLES.md` (4 blockers, 7 majors, 10 minors) and `REVIEW_R1_DESIGN.md` (8 majors, 10 minors), with the orchestrator's rulings and user decisions F10, F17–F19. The full per-finding table is S4 §16; this one records where each layout finding landed here.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B1 | blocker | Fixed: `sorensen_hatch` a static-sprite, immovable NPC with its body at the counter edge; clone on every branch and in a repeatable choice; hatch bell fallback | §3.6, §8, §10 item 6, §11 |
| B2, B3 | blocker | Fixed in S4 (debrief on `!report_done`; first-ring backstops) | S4 §4–§6; §4.3 here |
| B4 | blocker | Fixed in S4 §12 (extended bootstrap; dock fallback) | S4 §12 |
| M1, M2 | major | Fixed in S4 (backstop excludes the cage; `in_cage` cleared on load) | S4 §4 row 3; §4.3, §8 here |
| M3 | major | Fixed with F19: HaX's `unlockDoor` mappings; door backstop topics gone | §2 table, §3.5–3.8, §9, §10 item 1 |
| M4 | major | Fixed: the PIN cracker in the start kit | §3.1, §5 |
| M5 | major | Fixed: `sorensen_door` (hidden, `koImmune`) holds the files; `sorensen` holds only her card | §3.7, §8 |
| M6 | major | Fixed: relay hide on entering the stacks; Victoria's topic needs `stacks_entered` | §3.6; S4 §7.1 |
| M7 | major | Fixed: the legend in the tape room beside the keypad; the coded line in the notepad; CyberChef's real use (stage 6 requirement) | §3.5, §3.9, §4, §5 |
| m1 | minor | Fixed: the Reading and its last page are two objects | §3.8 |
| m2 | minor | Fixed: `triggerOnInteract` on the deck | §3.9, §10 item 25 |
| m3 | minor | Fixed: `biometricMatchThreshold: 0.5` | §3.7 |
| m4 | minor | Fixed in S4 §5 | S4 §5 |
| m5 | minor | Fixed: Noor on the floor; Old Coyote's override tile beside the door | §3.2, §3.3 |
| m6 | minor | Recorded for the user | §10 last paragraph |
| m7 | minor | Fixed: desk drawer removed; the rent book's date is the long way | §3.8, §4.2, §5 |
| m8 | minor | Fixed in S4 (`delayMs` on rings) | S4 §4, §6.6 |
| m9 | minor | Accepted with a stage 9 tap check; alternative named | §2, §11 |
| m10 | minor | Fixed: `hax_voice`; the called guard turned hostile by his own conversation; the Recruiter's texts have m05's precedent | §3.1, §3.3, §8 |
| D-01 | major | Fixed (ruling): Noor's easy card cloneable on every branch | §3.2, §4.2, §5 |
| D-03 | major | Fixed with M7; the tape room now has the legend on every route | §3.9 |
| D-04 | major | Fixed: trolleys and list empty in steps; the bins' line | §3.2, §3.6 |
| D-08 | major | Fixed (ruling): open stacks 4×2, salvage cage 2×1; checked with `check_door_alignment.py` on a stub, all ten connections OK | §2, §3.3, §3.10 |
| D-13 | minor | Partly fixed: one drop terminal screen; legend moved; the notebook stays a separate object (its own `onRead`) | §3.5 |
| D-14 | minor | Fixed: stub run done; every N/S door west, east wall free | §2 |
| Other design findings (D-02, D-05–D-07, D-09–D-12, D-15–D-18) | | Fixed in S4 | S4 §16 |

**Counts:** across both reviews, 39 findings: 36 fixed, 1 superseded by F17 (D-07), 1 accepted with a check (m9), 1 recorded for the user (m6). None withdrawn.

## 15. Review round 2 outcomes

Review: `REVIEW_R2.md` (B-R2-1; M-R2-1 to M-R2-4; m-R2-1 to m-R2-8), with the orchestrator's rulings and user decision F20. All 39 round 1 findings were confirmed as landed. S4 §17 records the same outcomes from the objectives side.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B-R2-1 | blocker | Fixed (ruling): HaX's `flag1_read` logs the coded line with `#add_note` (superseded by N-R3-1: `#give_item`); every screen variant from flag 1 on repeats it; her keypad topic quotes it | §3.5; S4 §4 row 7, §7.1 topic 5, §8 |
| M-R2-1 | major | Fixed (ruling): `cage_opened` follows `door_unlocked_by_npc` on Victoria's route; an in-session retry and a `game_loaded` backstop re-issue the unlock | S4 §4 row 2b, §5 |
| M-R2-2 | major | Fixed (ruling): `cooldown: 0` on both `in_cage` setters; `!in_cage` dropped from ring (a) | S4 §4 row 3, §5 |
| M-R2-3 | major | Resolved by F20 (in progress then; committed since): the scenes stay on their hosts; only the calls' knots are voiced; narrator lines become HaX's asides; recounted at about 66 | §10 item 4; S4 §6, §6.7 |
| M-R2-4 | major | Fixed (ruling): S6 and S7 start in `tape_room`; `--carry-npc netherton` (now `director_netherton`), and for S7 also `closing_debrief`, `kowalczyk`, `hax_voice`; a note on 1-GU start rooms flipping door parity | S4 §12 |
| m-R2-1 | minor | Fixed: scene-opening backstops on `room_entered` only; unlock backstops on `game_loaded` | S4 §4, §5 |
| m-R2-2 | minor | Fixed: the debrief restarts at its knot after a reload, so it reads `debrief_notice_before` (copied before it opens) and skips answered beats | S4 §5, §6.5 |
| m-R2-3 | minor | Fixed: the Recruiter's re-rings exclude `nextRoom === 'restricted_cage'` | S4 §6.1 |
| m-R2-4 | minor | Fixed: `facePlayer: false` (south-facing frame accepted); the purge line moved to the stamp; the stamp at the counter's south end; the bins seen, not examined | §3.6, §8 |
| m-R2-5 | minor | Fixed: "Two samples. One pen." only on `bin_chosen and cage_bin == "derek_file"` | S4 §7.1 topic 11 |
| m-R2-6 | minor | Fixed: row 1's wording corrected; in-session retries on `door_unlock_attempt` for the stacks, the gate and the office | S4 §4 rows 1, 2b, 5 |
| m-R2-7 | minor | Fixed: Old Coyote's round crosses the west end every lap; S4's walking note corrected | §3.3; S4 §11 |
| m-R2-8 | minor | Fixed: final key names, no fallback wording; P1's "three phone scenes"; the salvage cage's spacing left to `slot_audit.py` | S4 §0, §1; §0, §3.10, §12 |

**Counts:** 13 findings (1 blocker, 4 majors, 8 minors). 12 fixed, 1 resolved by a user decision (M-R2-3, F20). None withdrawn.

## 16. Review round 3 outcomes

Review: `REVIEW_R3.md` (2 majors, 4 minors); S4 §18 has the full table.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| N-R3-1 | major | Fixed: the coded line reaches the notepad as a notes item HaX gives, not `#add_note` | §3.5; S4 §4 row 7 |
| N-R3-2 | major | Fixed: `!in_cage` back on ring (a); the setters on `recruiter`, ahead of (a) | S4 §4 row 3 |
| m-R3-1 | minor | Fixed: F20 marked in progress (since the stages 4–5 milestone: committed) | §0, §10 item 4 |
| m-R3-2 | minor | Fixed: §4.3 S1 wording; §10 items 1 and 27 | §4.3, §10 |
| m-R3-3 | minor | Fixed in S4 §5 (`cage_opened` on entering the cage) | S4 §5 |
| m-R3-4 | minor | Fixed: the coded string's banned characters | §3.5; S4 P20 |

**Counts:** 6 findings, all fixed. Stages 4–5 complete.

