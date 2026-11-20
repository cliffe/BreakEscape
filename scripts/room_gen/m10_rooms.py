"""
Tomb Gamma (m10 "Full Disclosure"): the room_m10_* builders.

Kept in their own module, like room_gen/m09_rooms.py: generate_rooms.main() calls
register(module) and merges the builders it returns. Each builder uses
generate_rooms' own _Uni, make_obj and build_room, then points the map's room6
tileset (room6 and room18 for the 20-wide rooms) at its m10 sheet
(room_gen/make_m10_tileset.py). Hand-drawn props: room_gen/make_m10_props.py (m10_*);
the vans (m10_van1-3) are PixelLab. These maps are m10's own; the shipped maps it used
as placeholders (room_pnw_genhall, room_pnw_vault, room_aes_security,
room_aes_workshop, room_aes_plant, room_aes_hall2, room_qdc_server_hall,
room_pnw_ops) stay as they are.

A 1962 civil-defence bunker under a Montana ridge, refitted by ENTROPY, at night.
The old fabric: painted concrete, civil-defence yellow, FALLOUT SHELTER, caged
bulbs, Bakelite. The refit: grey lino, raised floor, racks, cable.

Coordinates: x = left edge, y = feet (room pixels). Door rules for m10's layout
(scripts/predict_door_sides.py): every E/W door on row 2 (mouth y 64-118, x 32-92 on
the west and width-92..width-32 on the east); the security office's S door and the
workshop's N door in the left corner (x 32-64). The security office loses its bottom
two rows to the workshop (feet at y 256 or above).

NPCs: an NPC's body centre is position*32; its sprite and tap area are the 80x80
frame x -40..+40, y -71..+9 round that point. Scenario slots keep their top-left and
centre outside every frame, and 32 px or more from each other (dressing skill).
Interaction reach is 32 px from the player to a sprite's top-left, so wall
interactables keep their top-left at y 28 or lower down the wall, over open floor.

Decor never uses the base type of a scenario slot in the same room (the engine
searches items and table_items before the conditional layers, so decor of that base
type would take the scenario object).

  python3 scripts/generate_rooms.py room_m10_forward      # one room
"""

G = None   # the generate_rooms module, set by register()

M10_SHEETS = {
    "room_m10_forward": ("room_m10_forward_w", "room_m10_forward_e"),
    "room_m10_tunnel": "room_m10_tunnel",
    "room_m10_security": "room_m10_security",
    "room_m10_workshop": "room_m10_workshop",
    "room_m10_power": "room_m10_power",
    "room_m10_hall": ("room_m10_hall_w", "room_m10_hall_e"),
    "room_m10_gallery": "room_m10_gallery",
    "room_m10_core": "room_m10_core",
}


def _build(r, name, template="10x10"):
    room = r.build(name, template)
    sheet = M10_SHEETS[name]
    west, east = sheet if isinstance(sheet, tuple) else (sheet, None)
    for ts in room["tilesets"]:
        if ts.get("name") == "room6":
            ts["name"] = west
            ts["image"] = ts["image"].replace("room6.png", f"{west}.png")
        elif east and ts.get("name") == "room18":
            ts["name"] = east
            ts["image"] = ts["image"].replace("room18.png", f"{east}.png")
    return room


def _cond(r, name, x, y, layer="conditional_items"):
    """A scenario slot: drawn only when a scenario object claims it."""
    getattr(r, layer).append(G.make_obj("objects", name, x, y, r._next()))


def _top(r, name, x, y, cond=False, frac=0.42):
    """Something on a table at an exact x (left edge): table_items, or the conditional
    table layer for a scenario slot. Its feet go on the table top (frac of the table's
    height from its top edge) of the table under it within 60 px of y; with no table
    there (a crate), y is used as given."""
    layer = "conditional_table_items" if cond else "table_items"
    w = G.lookup("objects", name)["w"]
    cx = x + w / 2
    under = [t for t in r.tables if t["x"] <= cx <= t["x"] + t["width"] and abs(t["y"] - y) < 60]
    if under:
        t = min(under, key=lambda t: abs(t["y"] - y))
        y = (t["y"] - t["height"]) + frac * t["height"]
    getattr(r, layer).append(G.make_obj("objects", name, x, y, r._next()))


def room_m10_forward():
    """
    4x2 GU (20x10) the forward post (forward_post, the start room): night gravel under
    the ridge's rock face, chain-link along it, the vehicle track in from the road (W).
    The road end: van one parked along the fence, side door open, lit; van two below
    it (the rail for cuffs); a kit crate (the incident file). The middle: the folding
    table (the table screen, Helena's plans, the sign-out sheet, the breaching case);
    Quintero's map board on the fence; the projection desk. The gate end: the field
    console and the gate terminal on a trestle under the sodium lamp, the hatched
    apron at the blast door (E), the gate hut in the SE corner.
    Door: E on row 2 (mouth x 548-608, y 64-118 clear). Nothing to the south.
    NPCs (centres): HaX (96,160), Netherton (192,160), Vector (128,128), Phantom
    (224,128), Nightshade at the table (256,128), Kowalczyk (320,160), Quintero
    (384,160), Arakawa at the case end (397,230), at the gate (512,160); the van group
    at the vans' open doors: Voltage (99,115), Kowalczyk (64,128), Nightshade (77,256),
    Malhotra (125,266); the minder (160,224); at the blast door Nightshade (576,192),
    Arakawa or a minder (480,256).
    Slots: m10_van_step1, m10_van_step2 at the vans' open doors (as-type m10_van_step:
    The Van, The Second Van; the vans themselves are decor, R2);
    m10_field_screen1 (Table Screen), m10_plans1 (Helena's Plans), notes_clip1
    (Sign-Out Sheet), m10_breaching_case1 (Folding Table) on the table; m09_folder1 on
    the crate (Incident File); m10_field_screen_dark1 (Projection Desk); vm-launcher and
    safetynet_flag_terminal1 on the gate trestle; m10_gate_post1 (Gate Hut, with the fence).
    """
    r = G._Uni()
    # the fence line: rock face and chain-link are on the sheet; lamps and boards on it
    r.item("m10_map_board1", 352.0, 58.0)                 # Quintero's map board, behind her
    r.item("outdoor-lamp4", 537.0, 70.0)                  # the one sodium lamp, at the gate
    # R3 F1: the bunker's portal: a concrete headwall and lintel (TG-1) in the NE corner over
    # the E door, the blast door's leaf swung open against the east wall below the doorway;
    # the apron carries a steel threshold and a drain on the sheet
    r.item("m10_portal_head1", 544.0, 58.0)
    r.item("m10_blast_leaf1", 610.0, 192.0)
    r.item("m10_sign_fallout1", 470.0, 32.0)
    # the road end: the vans, nose to the fence's east, side doors to the south
    # R2: the vans are decor; each scenario van is a small slot at its open side door
    # (the step), so a tap on an NPC standing in front of a van no longer also hits the van
    r.item("m10_van1", 34.0, 112.0)
    r.collision(38.0, 92.0, 108.0, 20.0)
    _cond(r, "m10_van_step1", 80.0, 114.0)                 # R3 F3: under the open door
    r.item("m10_van2", 32.0, 240.0)
    r.collision(36.0, 222.0, 102.0, 18.0)
    _cond(r, "m10_van_step2", 106.0, 242.0)
    r.solid("m10_generator1", 132.0, 300.0)               # R3 F4: off nightshade_table's spot; south of the road end
    r.solid("m10_kit_crate1", 172.0, 100.0)               # spare kit stacked by the fence
    r.item("m10_kit_crate1", 176.0, 86.0)
    # the incident file's crate, south of the table's west end
    r.table("m10_kit_crate1", 176.0, 292.0, kind="objects")
    _top(r, "m09_folder1", 179.0, 290.0, cond=True, frac=0.7)
    # the folding table: three trestles, x 196-352
    for x in (200.0, 252.0, 304.0):                        # x 200-356
        r.table("aes_trestle1", x, 236.0, kind="objects")
    # slots 32 px or more apart, top-left to centre, and east of the minder's frame (x 200)
    _top(r, "m10_field_screen1", 204.0, 212.0, cond=True)
    _top(r, "m10_plans1", 248.0, 214.0, cond=True)
    _top(r, "notes_clip1", 294.0, 218.0, cond=True)
    _top(r, "m10_breaching_case1", 332.0, 212.0, cond=True)
    r.item("m10_work_lamp1", 358.0, 206.0)                # R2: the work lamp, at the case end
    # the projection desk against the fence
    # (slot centres kept above y 89: Quintero's and Arakawa's frames start there)
    r.table("aes_trestle1", 400.0, 104.0, kind="objects")  # x 400-452
    _top(r, "m10_field_screen_dark1", 414.0, 96.0, cond=True)
    # the gate: the field console on a trestle, the gate terminal on its own stand
    r.table("aes_trestle2", 458.0, 104.0, kind="objects")  # x 458-510
    _top(r, "vm-launcher", 462.0, 99.0, cond=True)
    _top(r, "radio_charger1", 494.0, 96.0)
    r.table("m10_steel_stand1", 514.0, 104.0, kind="objects")   # R3 R1: steel, x 514-544, clear of the door's mouth
    _top(r, "safetynet_flag_terminal1", 518.0, 100.0, cond=True)
    # the gate hut, SE corner
    # R2: the hut with the refit fence running west from it (x 524-556); its dark variant
    # (m10_gate_post_dark1, m06_assets_seized) has the fence stop short (RL 2.1, A30)
    _cond(r, "m10_gate_post1", 524.0, 300.0)
    r.collision(560.0, 280.0, 44.0, 20.0)
    r.collision(524.0, 292.0, 32.0, 8.0)
    r.solid("aes_cones1", 458.0, 300.0)
    r.solid("aes_barrier1", 573.0, 160.0)
    return _build(r, "room_m10_forward", "20x10_wide")


def room_m10_tunnel():
    """
    2x1 GU (10x6) the blast tunnel (blast_tunnel): painted concrete, green below and
    cream above a yellow civil-defence line; wet concrete with a drain channel along
    the south. Back wall: the blast door's panel by the W door, FALLOUT SHELTER, the
    post's rota, GUARD POST over the desk and kettle, the ladder up the shaft by the E
    door, caged bulbs. A drum and an extinguisher.
    Doors: W and E on row 2 (mouths x 32-92 and 230-288, y 64-118). Floor y 64-160.
    NPCs: tunnel_guard patrols (128,96) to (192,128); the kettle copy stands at
    (224,80), frame x 184-264, y 9-89.
    Slots: m10_door_panel1 (Blast Door Panel), rota_board1 (Tunnel Post Rota; x 168.5,
    outside the patrol's frame at (128,96) and the kettle copy's at (224,80)),
    m10_wall_ladder1 (Guard Post Ladder).
    """
    r = G._Uni()
    for x in (60.0, 164.0, 254.0):
        r.item("m10_caged_lamp1", x, 24.0)
    _cond(r, "m10_door_panel1", 72.0, 58.0)
    r.item("m10_sign_fallout1", 96.0, 32.0)
    # the rota west of the desk: outside the patrolling guard's frame at both waypoints
    _cond(r, "rota_board1", 168.5, 58.0)
    r.item("m10_sign_post1", 202.0, 30.0)
    d = r.table("smalldesk1", 196.0, 84.0)               # the post's desk, x 196-246
    r.collision(196.0, 62.0, 50.0, 22.0)                 # R3 T1: the whole desk to the wall
    _top(r, "kettle1", 222.0, 70.0)
    _cond(r, "m10_wall_ladder1", 266.0, 59.0)
    r.solid("aes_drum1", 270.0, 156.0)
    r.item("fire_extinguisher1", 14.0, 150.0)
    del d
    return _build(r, "room_m10_tunnel", "10x6_hall")


def room_m10_security():
    """
    2x2 GU the security office (security_office): 1960s green-and-cream paint over the
    refit's grey lino. Back wall: LEVEL 1, the alarm board, the shift notes with the
    player's photo, the duty board, SECURITY. The monitoring desk against the back
    wall (the door log on its monitors), a filing cabinet at its east end; the duty
    handset on a stand in open floor; the old records cupboard on the west wall below
    the W door; the fitter's locker in the SE corner; the duty screen on the east wall.
    Doors: W on row 2 (mouth x 32-92, y 64-118), S (x 32-64; lane x 32-72 from y 180).
    The workshop covers the bottom two rows.
    NPCs: duty_guard_b at the monitors' east end (269,128): frame x 229-309, y 57-137.
    The duty guard patrols (128,128) to (192,256); Vector by the cupboard (96,176).
    Slots: alarm_panel, notice_board1 (Shift Notes: Photo), rota_board1 (Duty Board),
    cctv_monitors1 (as-type, Door Log), m10_wall_phone1 (Duty Handset, east wall),
    m10_cupboard1 (Records Cupboard), m10_locker1 (Fitter's Locker),
    m10_readout_side1 (Duty Screen).
    """
    r = G._Uni()
    r.item("m10_sign_level1", 96.0, 24.0)
    _cond(r, "alarm_panel", 40.0, 58.0)
    _cond(r, "notice_board1", 84.0, 59.0)
    _cond(r, "rota_board1", 138.0, 56.0)
    r.item("m10_sign_security1", 186.0, 26.0)
    r.item("wall_clock1", 236.0, 52.0)
    # the monitoring desk, against the back wall
    r.table("desk1", 176.0, 104.0)                       # x 176-254
    _top(r, "cctv_monitors1", 186.0, 92.0, cond=True)
    _top(r, "keyboard1", 232.0, 96.0)
    r.solid("filing_cabinet_steel1", 258.0, 100.0, depth=30)
    # R3 S2: the duty handset is a Bakelite wall phone on the east wall, above the duty screen
    _cond(r, "m10_wall_phone1", 292.0, 124.0)
    # R3 S3: wall-side detail only (the middle is the raid team's and the duty guard's)
    r.item("m10_coat_hooks1", 13.0, 214.0)
    r.item("m10_fire_buckets1", 78.0, 252.0)             # by the S door, east of its lane
    # the records cupboard, west wall below the W door
    _cond(r, "m10_cupboard1", 34.0, 170.0)
    r.collision(36.0, 158.0, 26.0, 12.0)
    # the fitter's locker, SE corner
    _cond(r, "m10_locker1", 264.0, 250.0)
    r.collision(266.0, 238.0, 18.0, 12.0)
    _cond(r, "m10_readout_side1", 292.0, 172.0)
    r.item("fire_alarm_point1", 14.0, 150.0)
    r.solid("bin8", 230.0, 250.0)
    return _build(r, "room_m10_security")


def room_m10_workshop():
    """
    2x2 GU the workshop floor (workshop_floor): painted blockwork, grey epoxy. Back
    wall: WORKSHOP, the casualty sheet and the margin strip pinned over open floor, a
    pegboard of tools over the tool chest, the shift clock by the E door. Imran's bench
    mid-room with Gary's next to it (both stand north of them); the west bench with
    the bench terminal and the bench log; the cracker rack in a hatched bay SE.
    Doors: N (x 32-64; lane x 32-72 to y 140), E on row 2 (mouth x 230-288, y 64-118).
    Nothing to the south.
    NPCs: Imran (192,160) frame x 152-232, y 89-169, behind his bench; Gary (unprotected)
    (256,160); Gary (protected) (96,128); the guard patrols y 256 from x 64 to 224.
    Slots: notes2 (as-type notes, Casualty Sheet), notes_tucked1 (Margin Strip),
    wall_clock1 (Shift Clock), pc10 and aes_clipboard1 on the west bench,
    m10_cracker_rack1 (Cracker Rack).
    """
    r = G._Uni()
    r.item("m10_sign_workshop1", 76.0, 28.0)
    _cond(r, "notes2", 124.0, 52.0)
    _cond(r, "notes_tucked1", 164.0, 52.0)
    r.item("pegboard_tools1", 182.0, 59.0)
    r.solid("component_drawers1", 80.0, 100.0, depth=16)  # R2: parts drawers under the plate, east of the stair lane
    r.solid("aes_tool_chest1", 182.0, 100.0, depth=20)
    _cond(r, "wall_clock1", 252.0, 59.0)
    r.item("m10_caged_lamp1", 136.0, 24.0)
    # Imran's bench and Gary's, mid-room
    # R3 W1: steel workbenches, not office desks (R4 R2: towerless m10_steel_bench1; the
    # bench terminal's bench at x 34 keeps zds_desk3, whose tower serves the PC)
    b = r.table("m10_steel_bench1", 158.0, 196.0, kind="objects")   # Imran's, x 158-209
    _top(r, "aes_bypass_module1", 162.0, 176.0)
    _top(r, "cable_tangle1", 184.0, 178.0)
    g = r.table("m10_steel_bench1", 213.0, 196.0, kind="objects")   # Gary's, x 213-264
    _top(r, "office-misc-lamp4", 216.0, 172.0)
    _top(r, "aes_battery_module1", 236.0, 178.0)
    # the west bench: terminal and log
    # feet 200: slot centres stay above the guard's frame at his west waypoint (y 185)
    w = r.table("zds_desk3", 34.0, 200.0, kind="objects")    # x 34-85, R3 W1
    r.table("m10_steel_bench1", 85.0, 200.0, kind="objects")        # x 85-136
    _top(r, "pc10", 38.0, 198.0, cond=True)
    _top(r, "aes_clipboard1", 92.0, 194.0, cond=True)
    r.item("m10_steel_chair1", 52.0, 222.0)
    # the cracker rack, SE
    _cond(r, "m10_cracker_rack1", 250.0, 286.0)
    r.collision(252.0, 274.0, 30.0, 12.0)
    r.solid("aes_cable_drum1", 250.0, 230.0)
    r.item("fire_extinguisher1", 14.0, 200.0)
    del b, g, w
    return _build(r, "room_m10_workshop")


def room_m10_power():
    """
    2x2 GU the power room (power_room): old green paint, red-oxide floor. Back wall:
    the Bakelite switch panel over the W door's corner, PLANT ROOM over the load board,
    the refit's bypass panel bolted onto the old switchgear, the gallery shutter's key
    switch by the E door; caged bulbs. The 1960s switchgear cabinets down the west wall;
    a cable drum; the battery bay along the south behind a low mesh rail.
    Doors: W and E on row 2 (mouths x 32-92 and 230-288, y 64-118). Nothing south.
    NPCs: Wendell at the panel (192,160); Voltage at the switchgear (160,128) or cuffed
    (128,160); Static (224,192); Wendell at the far panel (256,256).
    Slots: m10_load_board1 (Load Board), m10_bypass_panel1 (Bypass Panel),
    m10_key_isolator1 (Shutter Isolator), m10_tool_roll1 on a bench (Tool Roll).
    """
    r = G._Uni()
    r.item("m10_bakelite_panel1", 40.0, 58.0)
    r.item("m10_sign_plant1", 128.0, 25.0)
    _cond(r, "m10_load_board1", 120.0, 59.0)
    _cond(r, "m10_bypass_panel1", 200.0, 59.0)
    _cond(r, "m10_key_isolator1", 248.0, 59.0)              # R3 P2: key switch and breakers, not an e-stop
    for x in (104.0, 186.0):
        r.item("m10_caged_lamp1", x, 24.0)
    # the 1960s switchgear down the west wall, below the W door
    r.solid("aes_switchgear2", 34.0, 196.0, depth=14)
    r.solid("pnw_switch_cabinet1", 34.0, 258.0, depth=14)
    r.solid("aes_cable_drum1", 252.0, 150.0)
    # the battery bay, south
    for x in (100.0, 152.0):
        r.solid("pnw_batteries1", x, 290.0, depth=30)
    r.solid("aes_battery_rack1", 206.0, 290.0, depth=30)
    for x in (96.0, 144.0, 192.0):
        r.item("m09_mesh_low1", x, 234.0)                  # R4 P6: feet 234, so the plate (feet 236) draws over it
    r.collision(96.0, 224.0, 144.0, 10.0)
    r.item("m10_sign_batteries1", 98.0, 236.0)           # R3 P1 / R4 P6: on one mesh panel, above the rack tops (237)
    # R3 P3: Static's tool roll on a bench by the switchgear
    r.table("m10_steel_bench1", 34.0, 296.0, kind="objects")    # x 34-85 (R4 R2: no PC tower)
    _top(r, "m10_tool_roll1", 46.0, 296.0, cond=True)
    r.item("fire_extinguisher1", 292.0, 200.0)
    return _build(r, "room_m10_power")


def room_m10_hall():
    """
    4x2 GU (20x10) the server hall (server_hall), the old command room: dark slate
    paint, the refit's raised floor. Back wall: the 1962 plotting board over the old
    dais (outlined on the floor), OPS ROOM 1, the release console (a long desk: the
    field console, the release console's readout, the flag station, the controls),
    two racks, the sealed section's hatch with the field kit's link, the E door's
    corner clear. Racks along the south wall where the map tables were, the schedule
    terminal standing in front of them; the uplink printer on a table near the W door.
    Doors: W and E on row 2 (mouths x 32-92 and 548-608, y 64-118).
    NPCs: Asante or Mercer (352,192), frame x 312-392, y 121-201; guard A patrols y 192
    from x 64 to 256; guard B y 256 from x 416 to 544; Quintero (128,256); Kowalczyk
    (480,192), Arakawa (448,192).
    Slots: m10_plotting_board1, vm-launcher, m10_readout1 (Release Console Screen),
    safetynet_flag_terminal1 (Release Console), m10_console_controls1, m10_hatch1
    (Sealed Section Hatch), aes_round_terminal1 (Schedule), pnw_portable_printer1.
    """
    r = G._Uni()
    _cond(r, "m10_plotting_board1", 100.0, 59.0)
    r.item("m10_sign_ops1", 296.0, 26.0)
    for x in (64.0, 240.0, 400.0, 520.0):
        r.item("m10_caged_lamp1", x, 24.0)
    r.item("m10_sign_level2", 236.0, 44.0)
    # the release console: one long desk against the back wall, x 232-420
    r.table("desk1", 232.0, 118.0)
    r.table("desk1", 310.0, 118.0)
    r.table("desk2", 388.0, 118.0)                        # x 388-432
    _top(r, "vm-launcher", 240.0, 98.0, cond=True)
    _top(r, "m10_readout1", 288.0, 96.0, cond=True)
    _top(r, "safetynet_flag_terminal1", 334.0, 98.0, cond=True)
    _top(r, "m10_console_controls1", 382.0, 96.0, cond=True)
    r.item("aes_office_chair1", 300.0, 150.0)
    # two racks against the back wall, then the hatch
    r.solid("hq_rack1", 436.0, 100.0, depth=30)
    r.solid("hq_rack1", 468.0, 100.0, depth=30)
    _cond(r, "m10_hatch1", 504.0, 59.0)
    # racks where the map tables were, along the south wall
    for x in (176.0, 210.0, 244.0, 278.0, 346.0, 380.0):
        r.solid("hq_rack1", x, 290.0, depth=30)
    _cond(r, "aes_round_terminal1", 319.0, 290.0)          # R3 H3: in the gap in the rack run
    r.collision(320.0, 280.0, 16.0, 10.0)
    # the uplink printer, near the W door
    r.table("m10_steel_bench1", 40.0, 262.0, kind="objects")    # x 40-91, R3 R1 / R4 R2
    _top(r, "pnw_portable_printer1", 54.0, 242.0, cond=True)
    r.item("fire_extinguisher1", 612.0, 200.0)
    r.item("cctv_camera1", 590.0, 34.0)
    return _build(r, "room_m10_hall", "20x10_wide")


def room_m10_gallery():
    """
    2x1 GU (10x6) the gallery (gallery): dark concrete, a steel tread-plate walkway.
    Back wall: LEVEL 2 by the stair, the slit windows down into the core, the lock
    panel three tiles west of the outer lock, GALLERY. The keypad face plate on the east
    wall beside the lock, below the door. Farah's chair at the floor post.
    Doors: W and E on row 2 (mouths x 32-92 and 230-288, y 64-118). Floor y 64-160.
    NPCs: Victoria or Vos (160,96); the lock guard patrols y 128 from x 224 to 64; the
    monitor guard (96,160), Farah (160,160), the lock party (192-224,160).
    Slots: m10_slit_window1 (Slit Windows), m10_door_panel1 (Lock Panel),
    m10_keypad_plate1 (Keypad Face Plate), m10_steel_chair1 (as-type, Floor Post
    Chair; chair-grey-1 is a swivel prop and never a slot).
    """
    r = G._Uni()
    r.item("m10_sign_level2", 40.0, 26.0)
    _cond(r, "m10_slit_window1", 80.0, 50.0)
    _cond(r, "m10_door_panel1", 204.0, 59.0)
    r.item("m10_sign_gallery1", 236.0, 26.0)
    for x in (110.0, 172.0):
        r.item("m10_caged_lamp1", x, 24.0)
    for x in (34.0, 82.0, 178.0, 226.0):                  # the walkway's rail along the south
        r.item("m09_mesh_rail1", x, 160.0)                 # (a gap behind Farah's chair)
    _cond(r, "m10_keypad_plate1", 292.0, 140.0)
    _cond(r, "m10_steel_chair1", 140.0, 160.0)          # R3 G1: 8 px south, off Farah's feet
    return _build(r, "room_m10_gallery", "10x6_hall")


def room_m10_core():
    """
    2x2 GU the core (core): bare concrete, nothing on the walls but the file index and
    the key console's readout. His key console mid-room with his chair behind it; one
    empty chair facing it. The core host terminal on a small desk and the field console
    on a stand down the west wall, below the W door. The service door on the east wall,
    the dummy camera on its bracket above it.
    Door: W on row 2 (mouth x 32-92, y 64-118). Nothing to the south.
    NPCs: Tesseract seated (192,128), frame x 152-232, y 57-137; Kowalczyk waiting by
    the service door (256,160) or through it (256,192); Quintero (160,224).
    Slots: m10_wall_screen1 (File Index), m10_readout1 (Key Console Readout),
    m10_key_console1 (His Console), safetynet_flag_terminal1 (Core Host Terminal),
    vm-launcher (Field Console), m10_service_door1 (Service Door).
    """
    r = G._Uni()
    _cond(r, "m10_wall_screen1", 128.0, 58.0)
    r.item("m10_sign_core1", 134.0, 26.0)                # R3 C1
    for x in (70.0, 214.0):
        r.item("m10_caged_lamp1", x, 24.0)
    _cond(r, "m10_readout1", 256.0, 56.0)
    r.item("exec_chair_black1", 178.0, 132.0)
    _cond(r, "m10_key_console1", 176.0, 176.0)
    r.collision(178.0, 160.0, 48.0, 16.0)
    r.item("m10_steel_chair1", 196.0, 214.0)            # R4 R3: steel, not a hospital chair
    r.table("zds_desk3", 36.0, 170.0, kind="objects")    # x 36-87, steel (R3 R1)
    _top(r, "safetynet_flag_terminal1", 40.0, 156.0, cond=True)
    r.table("aes_trestle1", 36.0, 240.0, kind="objects")
    _top(r, "vm-launcher", 48.0, 222.0, cond=True)
    _cond(r, "m10_service_door1", 290.0, 280.0)
    return _build(r, "room_m10_core")


BUILDERS = {
    "room_m10_forward": room_m10_forward,
    "room_m10_tunnel": room_m10_tunnel,
    "room_m10_security": room_m10_security,
    "room_m10_workshop": room_m10_workshop,
    "room_m10_power": room_m10_power,
    "room_m10_hall": room_m10_hall,
    "room_m10_gallery": room_m10_gallery,
    "room_m10_core": room_m10_core,
}


def register(module):
    """Called from generate_rooms.main() with the generate_rooms module itself."""
    global G
    G = module
    return dict(BUILDERS)
