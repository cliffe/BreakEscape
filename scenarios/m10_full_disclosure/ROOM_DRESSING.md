# m10 room dressing

Skill: `.claude/skills/mission-room-dressing/`. Brief: `docs/agents/FINALE_BRIEF.md`. Inputs: stage 5 `room_layout.md` §1–§2.9; `ASSET_LIST.md` §2 and §4; the user's rule that props sit square to the walls; m09's dressing (`scenarios/m09_digital_archaeology/ROOM_DRESSING.md`, rounds 1–3) as the model. Several rounds of dressing are planned, then lighting, then backgrounds.

## Round 1 (2026-10-22): survey, plan, eight maps built

### Survey

Every room ran on a shipped draft map of its final size (ASSET_LIST §2). `slot_audit.py` gave 49 problems: all but one scenario object was pinned to a tile position with no slot, so each was drawn as a stand-in sprite (supply boxes for the vans, a security desk for the gate hut, a landscape-photo `smartscreen` for four of the countdowns, a battery-hall mimic board reading ALBION 132KV for the power room's load board) over whatever the draft map had there. Before renders: `dressing_r1/before/<map>.png`.

| Room | Draft map | Size | Notes |
|---|---|---|---|
| forward_post | `room_pnw_genhall` | 20×10 | m07's generator hall: gensets, a fuel tank, indoors |
| blast_tunnel | `room_pnw_vault` | 10×6 | m07's cable vault: cones, a trestle |
| security_office | `room_aes_security` | 10×10 | m04's office: carpet, a monitor wall, a copier |
| workshop_floor | `room_aes_workshop` | 10×10 | m04's workshop: lockers, benches |
| power_room | `room_aes_plant` | 10×10 | m04's plant room: green floor, ESD button, transformer |
| server_hall | `room_aes_hall2` | 20×10 | m04's battery hall: two battery banks, inverters, RACK BANK A/B |
| gallery | `room_qdc_server_hall` | 10×6 | m05's purple server hall |
| core | `room_pnw_ops` | 10×10 | m07's ops room: six consoles, a video wall, a water cooler |

### Critique

| # | Room | Sev | Finding |
|---|---|---|---|
| A1 | All | blocker | Every map belonged to another mission; nothing could be redressed without changing m04, m05 or m07. |
| A2 | All | major | Nothing said 1962 civil-defence bunker: no FALLOUT SHELTER, no caged bulbs, no Bakelite, no civil-defence yellow; the forward post was indoors. |
| A3 | All | major | 48 objects pinned to tiles over unrelated furniture, one in a random spot. |
| F1 | forward_post | major | No vans, no gate hut, no folding table: the scene the briefing describes wasn't there. |
| H1 | server_hall | major | No plotting board on the wall (it stood on open floor as a notice board), the console row was loose sprites, the sealed hatch was a junction box. |
| C1 | core | major | A busy ops room with six consoles, where the story wants one console, one terminal, two chairs and nothing on the walls. |
| G1 | gallery | minor | No walkway, no slit windows (window blinds stood in). |
| P1 | power_room | minor | The load board read "ALBION 132KV BESS" (m04's board). |

### Plan

1. Give m10 its own rooms, as m09 did: eight `room_m10_*` maps from builders in `scripts/room_gen/m10_rooms.py`, hooked into `generate_rooms.main()` after m09's module. Same sizes, so room positions and door positions do not move (`check_door_alignment.py`: 7 of 7 before and after). The draft maps are untouched.
2. Sheets from `scripts/room_gen/make_m10_tileset.py` (repaints of room6, all reading 64 on `check_room_walls`): the 1962 fabric is painted concrete with a civil-defence yellow line; the refit is grey. Forward post: a rock face behind chain-link, night gravel, a vehicle track from the road, a hatched apron at the blast door (640 px, two halves). Tunnel: green below cream, wet concrete, a drain channel. Security: green and cream over grey lino. Workshop: blockwork, grey epoxy, a hatched bay for the cracker rack. Power: old green paint, red-oxide floor, a keep-clear line, the battery bay hatched. Server hall: slate paint, the refit's raised floor, the old plotting dais outlined under the board (640 px). Gallery: steel tread plate. Core: bare concrete.
3. Every scenario object onto a slot (`as-type`, or its own type), explicit positions removed. Ids, locks, codes and puzzle wiring unchanged.
4. Art: hand-drawn props (`scripts/room_gen/make_m10_props.py`); one PixelLab call for the vans (ASSET_LIST §4). The gate hut, plotting board, key console, service door and keypad plate are hand-drawn.
5. Props square to the walls. The angled items are the vans (side-on, as vehicles read), the hall's office chair and the cones.
6. Slot rules from m09: every slot's top-left and centre outside every NPC frame and 32 px or more from the others; no decor of a slot's base type in the regular layers; door mouths clear; patrol waypoints unchanged.

### Per room: what changed

Map renders (32 px grid, 2×): `dressing_r1/maps/room_m10_<room>.png`, contact sheet `dressing_r1/maps/contact_sheet.png`. In game (game 3145, every room unlocked server-side by `lighting-tour.sh`, no lighting yet): `dressing_r1/ingame/<room>-a.png`.

- **forward_post → `room_m10_forward`.** Outdoors at night: a rock face behind chain-link along the north, chain-link down both sides, gravel with the track in from the road. The road end: van one parked along the fence (side door open, lit), van two below it; spare kit crates by the fence; the incident file on a kit crate south of the table. The folding table (three trestles, x 200–356): the table screen, Helena's plans, the sign-out sheet, the breaching case at the east end. Quintero's map board hung on the fence behind her. The projection desk (dark field screen), then the gate: the field console on a trestle, the gate terminal on its own stand, the one sodium lamp, KEEP CLEAR and FALLOUT SHELTER over the hatched apron at the blast door; a barrier below it; the gate hut (lit) in the SE corner, cones.
- **blast_tunnel → `room_m10_tunnel`.** Green-and-cream paint, the yellow line, caged bulbs, wet floor and a drain. Back wall: the blast door's panel by the W door, FALLOUT SHELTER, the rota (x 168.5, outside the patrol's frame at both waypoints and the kettle copy's frame), GUARD POST over the desk with the kettle and a mug, the ladder up the shaft by the E door. A drum, an extinguisher.
- **security_office → `room_m10_security`.** LEVEL 1, the alarm board, the shift notes (the photo), the duty board, SECURITY, a clock. The monitoring desk against the back wall with the door log on its monitors and a filing cabinet at its east end; duty_guard_b stands at its east end (unmoved), out of the monitors' tap area. The duty handset on a stand in open floor; the records cupboard (olive steel, newer keypad) on the west wall below the W door; the fitter's locker in the SE corner; the duty screen on the east wall below guard B's frame. The S door lane (x 32–72) is clear.
- **workshop_floor → `room_m10_workshop`.** WORKSHOP, the casualty sheet and the margin strip pinned over open floor, a pegboard over the tool chest, the shift clock by the E door. Imran's bench mid-room with Gary's next to it (both stand north of them); the west bench with the bench terminal and the bench log (feet 200, so both slots stay out of the guard's frame at his west waypoint); a cable drum; the cracker rack in its hatched bay SE.
- **power_room → `room_m10_power`.** Old green paint, red-oxide floor. Back wall: a Bakelite switch panel, PLANT ROOM over the new Bakelite load board (four needle dials, lamps, the refit's label tape), the refit's bypass box bolted over the old switchgear, the gallery shutter's key switch by the E door; caged bulbs. The 1960s switchgear down the west wall; the battery bay along the south behind a low mesh run with BATTERIES on it; a cable drum; the tool roll by the switchgear.
- **server_hall → `room_m10_hall`.** The old command room: slate paint, raised floor. The 1962 plotting board (a perspex map, the red tape run west to east) over the old dais outline; OPS ROOM 1, LEVEL 2. The release console as one desk against the back wall: the field console, the release console's readout, the flag station, the controls, an office chair. Two racks, then the sealed hatch (painted over, cracked at the edge, the field kit's link clipped on) with a hatched stand-off in front. Racks along the south wall where the map tables were, the schedule terminal standing in front of them; the uplink printer on a table near the W door; a camera by the E door. Both patrol lines are clear.
- **gallery → `room_m10_gallery`.** Steel tread plate; LEVEL 2, the slit windows (three slots, a grey head in the middle one), the lock panel three tiles west of the outer lock, GALLERY, two caged bulbs. The keypad face plate on the east wall below the lock (four keys worn). A mesh rail along the south edge of the walkway, with a gap behind Farah's chair.
- **core → `room_m10_core`.** Bare concrete. The file index screen and the key console's readout are the only things on the walls. His key console mid-room (the red hinged cover, the key) with his chair behind it and one empty chair facing it; the core host terminal on a small desk and the field console on a trestle down the west wall below the W door; the service door on the east wall with the dummy camera on its bracket above it.

### Scenario edits

Layout fields only, re-read before each edit (character agents were editing NPC art fields at the same time). Pre-edit copy: the session scratchpad (`m10dress/scenario_before_dressing.erb`).

- Eight room `type`s → `room_m10_*`.
- 45 explicit positions became `as-type` slots: clock_forward_post `m10_field_screen`, kit_table `m10_breaching_case`, case_signout_sheet `notes_clip`, incident_file `m09_folder`, helena_plans `m10_plans`, projection_desk `m10_field_screen_dark`, gate_terminal, release_console and core_host_terminal `safetynet_flag_terminal`, gate_hut `m10_gate_hut`, van_one and van_two `m10_van`, clock_blast_door and clock_gallery `m10_door_panel`, tunnel_rota and duty_board `rota_board`, post_ladder `m10_wall_ladder`, alarm_panel `alarm_panel`, wanted_photo `notice_board`, door_log `cctv_monitors`, duty_handset `phone`, records_cupboard `m10_cupboard`, fitter_locker `m10_locker`, clock_security `m10_readout_side`, casualty_sheet `notes`, casualty_margin_note `notes_tucked`, model_terminal `pc`, bench_log `aes_clipboard`, clock_workshop `wall_clock`, cracker_rack `m10_cracker_rack`, clock_power `m10_load_board`, bypass_panel `m10_bypass_panel`, static_kit `aes_toolbox`, plotting_board `m10_plotting_board`, clock_server_hall and clock_core `m10_readout`, release_console_controls `m10_console_controls`, schedule_terminal `aes_round_terminal`, sealed_hatch `m10_hatch`, uplink_printer `pnw_portable_printer`, lock_keypad_plate `m10_keypad_plate`, slit_window `m10_slit_window`, key_console `m10_key_console`, core_files `m10_wall_screen`, service_door `m10_service_door`. farah_chair is `as-type:hospital_chair_north` (its `chair-grey-1` type is a swivel prop and never a map slot).
- Three VM launchers (gate_console, hall_console, core_console_vm) claim their own `vm-launcher` slot with no position.
- sealed_hatch's `aes_junction_box1` sprite stand-in dropped so the hatch art shows.
- NPC moves, each with an ERB comment saying why: voltage_van (3, 3) → (3.1, 3.6), in front of van one's open door (he stood behind the van); nightshade_van (2, 6) → (3.6, 7.9), at van two's open door (he stood behind its roof); minder_post (4, 7) → (5, 7), clear of van two; arakawa_post (11, 7) → (12.4, 7.2), just past the table's case end, out of the case's tap area; arakawa_blast and minder_blast (17, 8) → (16, 8), out of the gate hut's tap area; kowalczyk_ws (8, 3) → (6.6, 3), out of the E door's mouth and off the shift clock (the raid roster's positions are drafts, RL §2.9).
- Unchanged: every id, lock, lock code, `requires`, flag wiring, patrol waypoint and every other NPC position.

### New assets

- **Hand-drawn** (`make_m10_props.py`, native size, free): `m10_sign_fallout1` (the three-triangle shelter mark), stencilled plates `m10_sign_security1`, `_workshop1`, `_plant1`, `_ops1`, `_gallery1`, `_level1`, `_level2`, `_keepclear1`, `_post1`, `_batteries1`; `m10_caged_lamp1`; `m10_readout1` and `m10_readout_side1` (Bakelite-framed countdown readouts); `m10_door_panel1`; `m10_load_board1`; `m10_bakelite_panel1`; `m10_bypass_panel1`; `m10_slit_window1`; `m10_plotting_board1`; `m10_wall_ladder1`; `m10_hatch1`; `m10_keypad_plate1`; `m10_service_door1`; `m10_map_board1`; `m10_wall_screen1`; `m10_field_screen1` and `m10_field_screen_dark1`; `m10_breaching_case1`; `m10_kit_crate1`; `m10_plans1`; `m10_console_controls1`; `m10_cupboard1`; `m10_locker1`; `m10_cracker_rack1`; `m10_key_console1`; `m10_gate_hut1` and `m10_gate_hut_dark1` (the dark one is the gate hut's `spriteVariants` entry on `m06_assets_seized`, matching its observation variant).
- **PixelLab**, one `create-1-direction-object` call at a 128 px canvas, four phrasings of an unmarked dark panel van, side-on (ASSET_LIST §4). It returned one frame per phrasing. Installed, trim only: `m10_van1` (side door open, lit equipment interior), `m10_van2` (side door open, lit), `m10_van3` (doors shut, spare). Contact sheet: `dressing_r1/pixellab_vans.png`. Balance 3722 before the call and 3620 after it; other agents were spending from the same account at the time (it was 3168 an hour later), so this call's own cost is 102 or less.
- All registered with `register_object.py` (wall items with `--wall`). Eight maps and ten sheets registered in `game.js`, the schema's room-type enum and the README room table.

### Checks

- Validator: exit 0, schema passes. 8 errors, all `halina_kowalczyk` spriteSheet missing on the Kowalczyk copies: a character agent's art change in progress, not a layout field. No dressing errors.
- `slot_audit.py --notes`: 0 problems (49 before), 0 notes prompts.
- `check_room_walls.py`: all eight maps read 64. `check_door_alignment.py`: 7 of 7 OK. `predict_door_sides.py`: unchanged (every E/W door on row 2; security S and workshop N in the left corner).
- Door clearance (scratch `doorclear.py`): no furniture in any door mouth.
- Slot spacing and NPC frames (scratch `slotdist.py`): every slot 32 px or more from the others. Left on purpose: the vans sit inside the frames of the NPCs placed at them (Voltage, Kowalczyk and Vector at van one; Nightshade and Malhotra at van two), so tapping a van while one of them is there gives a two-item menu; the slit windows are inside the two reinforcements' frames (they only appear as hostiles); Farah's chair is inside her frame (it is her chair).
- Decor stealing a slot (scratch `steal.py`): none.
- `generate_rooms.py --check`: the remaining hints are the generic N-door-corner and bottom-row ones (none of these rooms has a N door in that corner), the side-wall extinguishers, and three floor items flagged "off the walls" by design (the BATTERIES plate on the mesh, a floor cable tray, the schedule terminal).
- `game.js` passes `node --check`.
- In game (game 3145, every room unlocked): every map, sheet and prop loads; objects land on their furniture.
- Browser walk (doors both ways, reach to all 49 objects, patrols): a Sonnet playtest helper was started; its result was not in when this round closed (log and shots will be in the session scratchpad, `m10dress/pt1/`). It is owed.

### Open for round 2

1. Read the browser walk: doors both ways, reach to the wall items whose top-left is up the wall (plotting board, hatch, ladder, rota, panels, load board, bypass, isolator, sheets, clocks, file index, readout), the east-wall items (keypad plate, duty screen, service door) and the tall cupboard and locker; patrols round the new furniture.
2. Gallery: the static NPCs placed at y 5 (monitor guard, Farah, the lock party) have their feet on the bottom wall row. Moving them to about y 4.5 is a story-position change; decide with the ink owner.
3. The fence gap beside the dark gate hut (RL §2.1, milestone A30) is not drawn; add it to `m10_gate_hut_dark1` or as a variant on the sheet.
4. Forward post: the vans and their NPCs share tap areas (above). A shorter "van door" slot at the open door, with the van as decor, would split them.
5. The forward post and core are the emptiest rooms; the core is meant to be bare. The forward post could take a generator and cable to the work lamp, and a lit work lamp over the table (ASSET_LIST §4: "folding table, work lamp").
6. Lighting is next once dressing is signed off: no room has lighting configured yet (the sodium lamp, caged bulbs and van interiors are the obvious sources).

## Round 2 (2026-10-22): forward post fixes, the gallery's feet, critique pass

Renders: maps `dressing_r2/maps/` (contact sheet included); in game (game 3165, every room unlocked, no lighting) `dressing_r2/ingame/<room>-a.png`.

### Browser walk

Round 1's helper stopped before it reported. A second Sonnet helper is running on the round 2 maps (log and shots: session scratchpad `m10dress/pt2/`). Partial results when this round closed:

- Doors: tunnel ↔ security, security ↔ workshop, workshop ↔ power, power ↔ hall, hall ↔ gallery, gallery ↔ core all walked both ways. Two first tries failed only because a conversation opened mid-walk (person-chat active); both passed on the retry. forward_post ↔ tunnel is not in its log yet.
- Reach (server hall, gallery, core so far): the plotting board opened its read modal at 22 px; the desk-top hall console opened at 27 px, the release console screen at 26 px; the gallery's lock panel at 25 px; the keypad plate's dusting minigame at 22 px; the core's key console, readout and host terminal all opened directly. Farah's chair opened through a menu shared with Farah (16 px), as expected.
- Not yet reported: the forward post, tunnel, security office, workshop and power room objects, the patrols, console errors.

### Changes

- **forward_post.**
  - The vans are decor now. Each scenario van is a small slot at its open side door: `m10_van_step1`, the step with the headset and SAFETYNET badge (van_one's text), and `m10_van_step2`, the step with the cuff rail's end (van_two). A tap on an NPC standing in front of a van no longer also hits a 117×60 van; the 20×8 step is still inside the frames of the NPCs placed at the door (van one: Voltage, Vector, HaX; van two: Nightshade in the van), which is where the story puts them. I tried mirroring van one to move its door west; the door then sat under Kowalczyk's frame instead, so I dropped the mirror and unregistered it.
  - The gate hut now has the refit fence running west from it (`m10_gate_post1`, 80×62, slot at x 524). Its dark variant (`m10_gate_post_dark1`, the `spriteVariants` entry on `m06_assets_seized`) has the fence stop a few metres short with a loose end of wire (RL §2.1, milestone A30). Visual only; a low collision covers the fence.
  - A tripod work lamp at the table's case end, a portable generator by the fence between the kit crates and the map board.
  - arakawa_blast and minder_blast (16, 8) → (15, 8), west of the hut's new fence (ERB comment updated).
- **gallery.** monitor_guard (3, 5), farah_guard (5, 5), quintero_lock and minder_lock (7, 5), nightshade_lock (6, 5) → y 4.5, so their feet are on the walkway, not the bottom wall row (user-approved; an ERB comment on each). In game they now stand above the rail; Farah stands at her chair.
- **security_office.** A mug on the monitoring desk.
- **workshop_floor.** Parts drawers under the WORKSHOP plate, east of the stair's lane.

### Critique pass (all eight, against the skill and m09's finished rooms)

| Room | Reads as its place? | Square to walls | Doors, slots, NPCs | Action |
|---|---|---|---|---|
| forward_post | yes: fence, rock, vans, table under a lamp, gate | vans side-on (vehicles), cones | the van steps share NPC frames by design (above) | R2 changes above |
| blast_tunnel | yes: caged bulbs, FALLOUT SHELTER, post desk and kettle, ladder | yes | rota clear of both guard copies | none |
| security_office | yes, but sparser than m09's offices | yes | S lane clear; door log out of guard B's frame | mug; a second desk would crowd the raid team's spots (y 7) and the S lane, so I left the floor open |
| workshop_floor | yes; the centre-north is open floor | yes | sheets over open floor; slots out of the guard's frame | parts drawers |
| power_room | yes: Bakelite wall, battery bay | yes | clear | none |
| server_hall | the back wall reads as the command room; the middle is open floor | one office chair angled | both patrol lines clear | none: the open middle is the guards' beat and Asante's and the raid team's spots; more racks there would sit in their paths |
| gallery | yes: walkway, rail, slit windows | yes | NPCs off the wall row | R2 move above |
| core | yes: bare by design | yes | console out of Tesseract's and Quintero's frames | none |

Compared with m09: m09's rooms carry more floor furniture (shelving runs, trolleys, rugs). m10's two big rooms keep their middles open because two patrols, Asante or Mercer and three raid copies stand or walk there.

### New assets (round 2)

Hand-drawn in `make_m10_props.py` (`round2()`), registered: `m10_gate_post1`, `m10_gate_post_dark1`, `m10_van_step1`, `m10_van_step2`, `m10_work_lamp1`, `m10_generator1`. No PixelLab or Gemini spend this round.

### Checks after round 2

- Validator: exit 0, schema passes; the only errors are the `halina_kowalczyk` sheet errors from the character work in progress.
- `slot_audit.py --notes`: 0 problems. `check_room_walls.py`: all 64. `check_door_alignment.py`: 7 of 7. Door clearance: no hits. No decor takes a scenario slot.
- Slot spacing: all 32 px or more. NPC frames: only the accepted overlaps (van steps, slit windows with the reinforcements, Farah's chair).
- `game.js` passes `node --check` (the mirrored van's preload line removed with it).

### Open for round 3

1. Read the round 2 browser walk; fix any door, reach or patrol failure it finds (desk-top slots against the back wall, the high wall items and the east-wall items are the ones at risk).
2. A red health-bar overlay draws over the gallery's LEVEL 2 sign in the tour shots (an engine combat overlay, not the map); check it in the walk.
3. The hall and security office could take more detail only where no NPC stands or walks.
4. Lighting next: the sodium lamp, the work lamp, caged bulbs and the vans' interiors are the sources.

## Round 3 (2026-10-22): the R3 review's findings

Review: `DRESSING_REVIEW_R3.md` (0 blockers, 3 majors, 20 minors), with the coordinator's rulings. Renders: maps `dressing_r3/maps/` (contact sheet included); in game (game 3187, rooms unlocked, the moved NPCs shown) `dressing_r3/ingame/<room>-a.png`. Browser check of the changes: game 3188, a Sonnet helper, log in the session scratchpad `m10dress/pt3/`.

### Per finding

| # | Sev | Fix | Checked in game |
|---|---|---|---|
| G1 | major | lock_guard's beat is the east half, behind the lock party: (7.9, 3.4) ↔ (6.2, 3.4), the 20 s dwell at the west end (his back to the keypad); his start moved to match. First set to (8.4, 3.4) as ruled, but x 8.4 is outside the gallery's pathfinding bounds (tiles x 2–8), so the engine dropped that waypoint and he stood at the west end logging "No path found" every 2 s (game 3188); 7.9 is inside. Farah's chair moved 8 px south, off her feet. ERB comments on both | first setting failed as above. Re-check at 7.9 (game 3194): both waypoints survive validation; he shuttles between world x 2442 and 2486 with a 20 s west dwell and a 3 s east one; one early "No path found" (32 before); none for Farah, the monitor guard, duty_guard_b or the kettle copy; no "outside patrol bounds" anywhere |
| G2 | major (engine) | The live bars are `public/break_escape/js/ui/npc-health-bars.js` (imported by game.js); `systems/npc-health-bar.js` is never imported, so I left it alone. The bar now follows the NPC sprite's visibility when it is made and on every update. Test: `test/js/npc-health-bar-visibility.test.mjs` (2 tests; with the existing `npc-health-bar-missing` test, 3 pass) | yes: with both reinforcements hidden no bar draws; revealing reinforcement_a shows its bar |
| F1 | major | A cast-concrete portal in the NE corner over the E door (`m10_portal_head1`: formwork, a lintel stencilled TG-1, a hazard strip); the blast door's steel leaf swung open flat against the east wall below the doorway (`m10_blast_leaf1`). The apron now holds a steel threshold plate at the door and a drain (sheet). KEEP CLEAR came off; FALLOUT SHELTER stays | yes: forward post ↔ tunnel walked both ways |
| F2 | minor | Accepted: van two's step stays at its door; it is reached from the east side through a menu with Nightshade (game 3188) | yes |
| F3 | minor | Van one's step moved under its open door (x 80) | yes: opens at 25–28 px, menu with HaX |
| F4 | minor | Generator moved south of the road end (x 132, feet 300). phantom_post (7, 4) → (7, 4.6), kowalczyk_van (2, 4) → (2.2, 4.6), nightshade_blast (18, 6) → (18, 7); ERB comments | shots |
| F5 | minor | The three mugs (forward table, tunnel desk, security desk) removed | — |
| T1 | minor | The tunnel desk's collision now runs to the wall; tunnel_guard_kettle (7, 2.5) → (7, 2.9), in front of the kettle | yes: the floor behind the desk is blocked |
| S1 | minor | duty_guard_b (8, 4) → (7.3, 4.5) | yes: no "stuck in wall" after load |
| S2 | minor | The duty handset is a black Bakelite wall phone on the east wall above the duty screen (`m10_wall_phone1`, `as-type:m10_wall_phone`); the side table is gone | yes: opens Ghost's call at 23 px; the duty screen at 23 px |
| S3 | minor | Wall-side only: hooks with a hi-vis and a civil-defence tin hat on the west strip under the cupboard; two fire buckets by the S door, east of its lane | render |
| W1 | minor | Steel workbenches (`zds_desk3`) for the west bench (two) and for Imran's and Gary's; slots kept | yes: the bench terminal's password prompt and the bench log open |
| W2 | minor | kowalczyk_ws (6.6, 3) → (6.6, 3.4) (raid copy) | — |
| P1 | minor | BATTERIES on one mesh panel and drawn over it | render |
| P2 | minor | `m10_key_isolator1` (key switch with the key in, four breakers, a label strip) in place of the e-stop box; `readDisplay: "gameDisplay"` | yes: opens as an in-place read modal. It still copies to notes once (no `addToNotes: false`; its `textVariants` change after the cut, so the skill would add it: left for the puzzle owner) |
| P3 | minor | Static's tool roll (`m10_tool_roll1`, canvas, stencilled S) on a steel bench by the switchgear, so "on the bench" is true | yes: opens at 27 px |
| P4 | minor | The stray line is now a hatched keep-clear box in front of the load board and panels | render |
| P5 | minor | kowalczyk_pr (2, 7) → (2.6, 6.4) (raid copy) | — |
| H1 | minor | The dais is a raised slab on the floor (lighter top, shadowed front edge, a step at its east end); the hatched stand-off in front of the hatch is gone | render |
| H2 | minor | The low cable tray removed | — |
| H3 | minor | The schedule terminal stands in the gap in the south rack run | yes: opens at 26.5 px |
| C1 | minor | Two caged bulbs, a CORE plate, one cable run on the floor from the key console to the host terminal's desk; the host terminal on a steel desk | yes: host terminal and field console open |
| R1 | minor | Gate terminal on a small steel stand (`m10_steel_stand1`), core host and hall printer on steel desks, the security table gone, the workshop benches steel. The tunnel's wooden post desk stays | yes |

### Scenario edits (layout fields only, re-read before each edit)

- shutter_isolator `as-type:m10_key_isolator` plus `readDisplay: "gameDisplay"`; static_kit `as-type:m10_tool_roll`; duty_handset `as-type:m10_wall_phone`.
- NPC positions and lock_guard's waypoints as above, each with an ERB comment.

### New assets

Hand-drawn (`make_m10_props.py`, `round3()`), registered: `m10_portal_head1`, `m10_blast_leaf1`, `m10_key_isolator1`, `m10_wall_phone1`, `m10_coat_hooks1`, `m10_fire_buckets1`, `m10_tool_roll1`, `m10_steel_stand1`, `m10_sign_core1`. No PixelLab or Gemini.

### Checks after round 3

- Validator: exit 0, 0 errors (the `halina_kowalczyk` errors are gone now that its sheet exists). Schema passes.
- `slot_audit.py --notes`: 0 problems. `check_room_walls.py`: all 64 (the power room's new hatch box first read 72 and was moved down to y 76). `check_door_alignment.py`: 7 of 7. `predict_door_sides.py`: unchanged. Door clearance: no hits. No decor takes a slot.
- `game.js` and `npc-health-bars.js` pass `node --check`; `node --test test/js/npc-health-bar-visibility.test.mjs test/js/npc-health-bar-missing.test.mjs`: 3 pass.
- Game 3188: all six doors checked both ways; every changed object opens; no page exceptions; only TTS 503s and 3 × 403 (probably viseme PNGs on the keyless server).

### Open for round 4 or lighting

1. The isolator still copies a snapshot to notes; `addToNotes: false` is the puzzle owner's call.
2. A revealed reinforcement_a's health bar sits over the LEVEL 2 plate (it stands at (3, 3)); that is correct behaviour for a visible hostile.
3. The tunnel rota shares a menu with the patrolling tunnel guard when he is at his first waypoint (the round 1 trade-off).
4. vos logs "stuck in wall" once at his spawn (5, 3) in the gallery (game 3194; also seen before); he is static, so it is cosmetic, but worth a look when the gallery is next touched.
5. Lighting next.

## Round 4 (2026-10-22): the R4 review's minors

Review: `DRESSING_REVIEW_R4.md` (0 blockers, 0 majors, 8 minors; "ready for lighting"). Renders: `dressing_r4/maps/`.

| # | Fix |
|---|---|
| R2 | A towerless steel bench at zds_desk3's size (`m10_steel_bench1`, hand-drawn: galvanised top, apron, four legs, a low shelf). It replaces zds_desk3 at the workshop's second west bench, Imran's and Gary's benches, the power room's tool-roll bench and the hall's printer table. The bench terminal's bench (workshop x 34) and the core host desk keep zds_desk3, whose tower serves the PC |
| P6 | BATTERIES at feet 236, above the rack tops (237); the mesh run lowered to feet 234 (collision with it) so the plate draws over the mesh, not under it |
| W3 | kowalczyk_ws (6.6, 3.4) → (6.6, 4.0), in front of the tool chest (ERB comment) |
| F6 | The forward post's east strip from y 40 to 144 is painted as the portal's concrete reveal (a lit arris, the same formwork texture as the headwall), so the blast door sits in the concrete mass |
| H4 | hall_guard_b's start and west turn (13, 8) → (13.6, 8), out of the east rack's corner (a Ruby comment in the patrol array; the line sits inside an ERB block, where `<%#` would close it) |
| R3 | A grey steel canteen chair seen from behind (`m10_steel_chair1`, 16×26) in place of the teal hospital chair: Farah's floor-post chair (`farah_chair` now `as-type:m10_steel_chair`), the empty chair facing the key console, the workshop bench chair |
| N1, N2 | Left for the character owner and the user, as ruled |

Checks: validator exit 0, 0 errors; slot audit 0; walls all 64; door alignment 7 of 7; door clearance clean; no decor takes a slot. Slot spacing unchanged except one new overlap: the gallery's lock panel (`clock_gallery`, top-left (204, 33)) now sits inside the lock guard's frame at his west turn (6.2, 3.4), so tapping it while he dwells there may raise a two-item menu. It is a countdown readout; accepted.

Browser check (game 3268, rooms unlocked server-side; log in the session scratchpad `m10dress/pt3/`): hall_guard_b keeps both waypoints and walks x 2041–2144 with no "No path found", "outside patrol bounds" or "stuck in wall" (none either for hall_guard_a, lock_guard, duty_guard_b or the kettle copy); her west stop is about 30 px clear of the rack edge. The lock panel, Farah's chair (a menu with her, as accepted), bench log, bench terminal, tool roll and printer all open within 28 px.
