"""
Mountain States Records & Retention (m09 "Digital Archaeology"): the room_m09_* builders.

Kept in their own module, like room_gen/hq_rooms.py: generate_rooms.main() calls
register(module) and merges the builders it returns. Each builder uses
generate_rooms' own _Uni, make_obj and build_room, then points the map's room6
tileset (room6 and room18 for the 20-wide stacks) at its m09 sheet
(room_gen/make_m09_tileset.py). Hand-drawn props: room_gen/make_m09_props.py (m09_*).
These maps are m09's own; the shipped maps it used as placeholders (room_aes_dock,
room_reception, room_aes_hall1, small_room_1x1gu, room_qdc_hall, room_uni_office,
room_hq_ops, room_qdc_security, room_hce_office, room_servers, room_hq_intel) stay
as they are.

A converted grain warehouse on the edge of Helena, at night. Brick in the warehouse
rooms, cream plaster at the front desk, library green in the reading room, walnut in
the director's office; a records-green line on every wall.

Coordinates: x = left edge, y = feet (room pixels). Door rules for m09's layout
(scripts/predict_door_sides.py): N/S doors in the left corner (x 32-64) except the
staff passage's N door and the reading room's S door (right corner, x 256-288);
E/W doors on row 2 (mouth y 64-118). A room with a room to its south loses its bottom
two rows (feet at y 256 or above; y 128 in a 10x6 room).

NPCs: an NPC's body centre is position*32; its sprite and tap area are the 80x80
frame x -40..+40, y -71..+9 round that point. Scenario slots keep their top-left and
centre outside that frame, and 32 px or more from each other (dressing skill).

  python3 scripts/generate_rooms.py room_m09_dock      # one room
"""

G = None   # the generate_rooms module, set by register()

M09_SHEETS = {
    "room_m09_dock": "room_m09_dock",
    "room_m09_front": "room_m09_front",
    "room_m09_stacks": ("room_m09_stacks_w", "room_m09_stacks_e"),
    "room_m09_closet": "room_m09_closet",
    "room_m09_passage": "room_m09_passage",
    "room_m09_reading": "room_m09_reading",
    "room_m09_restricted": "room_m09_restricted",
    "room_m09_cage": "room_m09_cage",
    "room_m09_office": "room_m09_office",
    "room_m09_tape": "room_m09_tape",
    "room_m09_salvage": "room_m09_salvage",
}


def _build(r, name, template="10x10"):
    room = r.build(name, template)
    if template == "5x6":
        # R3 K1: the 5x6 room layer comes from the template's cell map (east wall and
        # south frame included), as room_hospital_storage_1x1gu does; r.build fills the
        # sheet's top-left 5x6 block, which has neither.
        cells = G.TEMPLATES["5x6"]["room"]
        for layer in room["layers"]:
            if layer.get("name") == "room":
                layer["data"] = [G.ROOM6_FIRSTGID + g - 1 if 1 <= g <= 100 else g for g in cells]
    sheet = M09_SHEETS[name]
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


def room_m09_dock():
    """
    2x2 GU the loading dock yard (loading_dock, the start room): night asphalt with
    yellow bay lines and a hatched apron at the open shutter (the N door, NW corner),
    the warehouse's brick wall. Back wall: BAY 1 by the open shutter, BAY 2's shutter
    down, its control box, a camera. The guard hut desk NE against the wall (his
    incident log, a radio, a flask, the hi-vis on its hook over it); pallets of
    records boxes and the pallet truck west; wheelie bins east; a chain-link fence
    along the south.
    Doors: N (x 32-64; lane x 32-72 clear to y 140), W on row 2 (mouth x 32-92,
    y 64-118 clear). Nothing to the south. Spawn (scenario startPosition) bottom right.
    Slot: notes_ledger1 on the hut desk (as-type, Incident Log).
    """
    r = G._Uni()
    r.item("m09_sign_bay1", 70.0, 30.0)
    r.solid("aes_bollard1", 104.0, 112.0)
    r.item("aes_shutter_ctrl1", 92.0, 56.0)
    r.item("aes_roller_shutter1", 116.0, 64.0)          # BAY 2, down
    r.item("m09_sign_bay2", 150.0, 27.0)               # on the shutter head
    r.item("cctv_camera1", 222.0, 34.0)
    r.item("aes_hivis_hook1", 246.0, 52.0)
    # the guard hut desk, NE
    hut = r.table("smalldesk1", 232.0, 102.0)           # x 232-282
    r.on(hut, "notes_ledger1", 0.30, 0.40, layer="conditional_table_items")
    r.on(hut, "radio_charger1", 0.78, 0.36)
    r.on(hut, "office-misc-cup3", 0.62, 0.46)
    r.item("hospital_chair_north", 248.0, 128.0)
    # records in, west: pallets of boxes, the pallet truck
    r.solid("aes_pallet1", 40.0, 200.0)
    r.item("supply_boxes1", 40.0, 188.0)
    r.solid("aes_pallet1", 40.0, 236.0)
    r.item("m09_box_taped1", 44.0, 224.0)
    r.item("m09_box_taped1", 58.0, 224.0)
    r.solid("aes_pallet1", 72.0, 236.0)
    r.solid("aes_pallet_truck1", 104.0, 236.0)
    r.solid("aes_cones1", 164.0, 214.0)
    # bins, east
    r.solid("yellow_bin1", 264.0, 176.0)
    r.solid("bin8", 266.0, 206.0)
    r.item("fire_extinguisher1", 292.0, 150.0)
    # the yard fence along the south
    for x in (32.0, 85.0, 138.0, 191.0, 235.0):
        r.item("hce_cage_panel1", x, 304.0)
    r.collision(32.0, 280.0, 256.0, 24.0)               # R4 D4: nobody walks into the fence
    return _build(r, "room_m09_dock")


def room_m09_front():
    """
    2x2 GU the front desk (front_desk): worn two-tone lino, cream plaster. Back wall:
    STAFF ONLY and a card reader by the staff door (N, NW corner), the MOUNTAIN STATES
    RECORDS & RETENTION wordmark over Noor's desk (a terminal, a lamp, a phone, her
    chair), RETURNS AND ENQUIRIES. The public counter across the west half; two
    trolleys of boxes for the destruction run east, the run sheet clipped to the
    first; filing cabinets and a water cooler along the south.
    Doors: N (x 32-64; lane x 32-72 clear to y 140), E on row 2 (mouth x 230-288,
    y 64-118 clear). Nothing to the south.
    NPC: Noor at (6.5,5.5): frame x 168-248, y 105-185, on clear floor west of the
    trolleys.
    Slots: m09_box_taped1 under her desk (as-type, Box Under the Desk), notes_clip1 on
    the first trolley (as-type, Destruction Run).
    """
    r = G._Uni()
    r.item("m09_sign_staff1", 68.0, 28.0)
    r.item("hq_badge_reader1", 70.0, 50.0)
    r.item("m09_logo_sign1", 118.0, 34.0)
    r.item("m09_sign_returns1", 220.0, 36.0)
    d = r.table("desk1", 122.0, 100.0)                  # x 122-200
    r.on(d, "pc3", 0.30, 0.40)
    r.on(d, "office-misc-lamp4", 0.62, 0.36)
    r.on(d, "phone2", 0.84, 0.44)
    r.item("hospital_chair_north", 144.0, 124.0)
    _cond(r, "m09_box_taped1", 182.0, 106.0)            # in front of the desk's right end, out of Noor's frame
    # the public counter, west
    c = r.table("desk1", 56.0, 250.0)                   # the counter: two old desks end to end, x 56-212
    r.on(c, "office-misc-pens", 0.30, 0.30)
    r.on(c, "notes_legalpad1", 0.62, 0.30)
    c2 = r.table("desk1", 134.0, 250.0)
    r.on(c2, "phone4", 0.30, 0.36)
    r.on(c2, "office-misc-box1", 0.70, 0.40)          # not m09_box_taped1: that would take the desk box's slot
    # the two trolleys for the run, east of Noor
    t1 = r.table("m09_box_trolley1", 252.0, 200.0, kind="objects")   # x 252-294
    r.on(t1, "notes_clip1", 0.30, 0.86, layer="conditional_table_items")
    r.table("m09_box_trolley1", 252.0, 254.0, kind="objects")
    r.item("hospital_chair_north", 92.0, 290.0)         # R3 F1: the public side of the counter
    r.item("hospital_chair_north", 170.0, 290.0)
    r.solid("filing_cabinet_steel1", 34.0, 210.0)
    r.solid("filing_cabinet_steel1", 64.0, 210.0)
    r.solid("water_cooler1", 224.0, 300.0)
    r.item("fire_alarm_point1", 14.0, 220.0)
    r.item("fire_extinguisher1", 292.0, 160.0)
    return _build(r, "room_m09_front")


def room_m09_stacks():
    """
    4x2 GU (20x10) the open stacks (open_stacks): the old grain floor, sealed concrete
    with yellow aisle lines, brick walls. Client-deposit shelving in two long runs:
    one against the back wall (bays 10 and 11 west, bay 12 east, a gap of wall for
    CLIENT DEPOSITS / BAYS 1-12 over the cross aisle), and a free-standing run in
    front of it, with a cross aisle at x 380-430 and a clear column at the east end.
    The Harwick & Lowe label on bay 12's shelf front, their boxes pulled out on the
    floor in front of it.
    Doors: W and E on row 2 (mouths x 32-92 and 548-608, y 64-118), S (x 32-64; the
    dock covers the bottom two rows of the west half). The crossing at the west end
    (x 32-92) runs clear from the W door to the S door.
    NPC: Old Coyote's round runs along y 272 (x 96-544) and up x 400 to y 144: the
    band y 236-304 and the cross aisle x 380-430 stay clear.
    Slots: m09_bay_label1 (as-type, Bay Label), supply_boxes1 in front of bay 12
    (Harwick & Lowe, Dead Files).
    """
    r = G._Uni()
    # back-wall run, west: bays 10 and 11
    # R3 S1: shelf variants, and an end-of-bay gap between bays 10 and 11 at x 250-264
    for x, name in ((100.0, "supply_shelves1"), (150.0, "m09_shelves_white1"), (200.0, "m09_shelves_flip1"),
                    (264.0, "m09_shelves_half1"), (314.0, "supply_shelves1")):
        r.solid(name, x, 100.0, depth=36)
    r.item("m09_bay_plate10", 160.0, 30.0)
    r.item("m09_bay_plate11", 290.0, 30.0)
    r.item("m09_sign_stacks1", 358.0, 36.0)
    # back-wall run, east: bay 12
    for x, name in ((432.0, "m09_shelves_white1"), (482.0, "m09_shelves_flip1")):
        r.solid(name, x, 100.0, depth=36)
    r.item("m09_bay_plate12", 466.0, 30.0)
    r.item("cctv_camera1", 560.0, 30.0)
    _cond(r, "m09_bay_label1", 440.0, 101.0)            # on bay 12's bottom rail, drawn in front of it (R3 S3)
    # Harwick & Lowe's boxes, pulled out in front of their bay
    _cond(r, "supply_boxes1", 494.0, 142.0)
    # the free-standing run
    for x, name in ((100.0, "m09_shelves_flip1"), (150.0, "supply_shelves1"), (200.0, "m09_shelves_white1"),
                    (264.0, "supply_shelves1"), (314.0, "m09_shelves_half1")):
        r.solid(name, x, 210.0, depth=60)
    for x, name in ((432.0, "supply_shelves1"), (482.0, "m09_shelves_white1")):
        r.solid(name, x, 210.0, depth=60)
    # R3 S2: the returns bay along the south of the east half, outside Old Coyote's
    # round (his body reaches y ~249): pallets of boxes and a trolley, feet y 300
    for x in (400.0, 432.0, 520.0):
        r.solid("aes_pallet1", x, 300.0)
    # (no supply_boxes1 here: decor of that type would take Harwick & Lowe's slot)
    r.item("m09_box_taped1", 404.0, 288.0)
    r.item("m09_box_taped1", 418.0, 288.0)
    r.item("m09_box_taped1", 436.0, 288.0)
    r.item("m09_box_taped1", 450.0, 288.0)
    r.item("m09_box_taped1", 443.0, 278.0)
    r.item("m09_box_taped1", 524.0, 288.0)
    r.item("m09_box_taped1", 531.0, 278.0)
    r.solid("m09_box_trolley1", 470.0, 300.0)
    r.solid("aes_pallet_truck1", 560.0, 300.0)
    r.item("step_stool1", 352.0, 140.0)
    r.item("m09_box_trolley1", 236.0, 148.0)            # a trolley being loaded in the first aisle
    r.solid("aes_pallet1", 566.0, 206.0)                 # returns in, east end, clear of the E door
    r.item("m09_box_taped1", 568.0, 194.0)
    r.item("m09_box_taped1", 582.0, 194.0)
    r.item("m09_box_taped1", 575.0, 184.0)
    r.item("no_smoking_sign1", 48.0, 56.0)
    r.item("fire_alarm_point1", 14.0, 180.0)
    r.item("fire_extinguisher1", 612.0, 170.0)
    return _build(r, "room_m09_stacks", "20x10_wide")


def room_m09_closet():
    """
    1x1 GU (5x6) the server closet (server_closet): grey blockwork, anti-static
    tiles. A rack in the NE corner, the wipe schedule on a clipboard over the door
    end of the back wall, the degausser (the tape side's wipe console) SW, a small
    desk with a terminal SE, a box of tapes waiting.
    Door: W on row 2 (mouth x 32-92, y 64-118 clear). Nothing to the south.
    NPC: Tran at (3.3,3.5) (R2; was (2.5,4)): frame x 66-146, y 41-121, between the rack
    and the terminal and clear of the W door's mouth; the console is SW, out of his tap area.
    Slot: m09_degausser1 (as-type, Wipe Console).
    """
    r = G._Uni()
    r.item("aes_clipboard1", 40.0, 46.0)
    r.item("comms_cabinet1", 62.0, 54.0)               # a wall-hung patch cabinet west of the rack (R3 K2)
    r.solid("server_rack2", 96.0, 98.0, depth=30)
    _cond(r, "m09_degausser1", 34.0, 174.0)             # SW, out of Tran's tap area (R2)
    d = r.table("smalldesk2", 94.0, 174.0)              # x 94-126, a terminal SE
    r.on(d, "pc6", 0.50, 0.42)
    r.item("m09_box_open1", 70.0, 174.0)
    return _build(r, "room_m09_closet", "5x6")


def room_m09_passage():
    """
    2x1 GU (10x6) the staff passage (staff_passage): cream plaster, lino with a worn
    green runner. The front desk covers the bottom two rows, so everything is on the
    back wall: the staff noticeboard, hi-vis and lanyards on hooks, the rota, a water
    cooler by the reading-room door; the card reader on the west wall by the S door.
    Doors: S (x 32-64, lane x 32-72), N (x 256-288, lane x 248-288). No NPCs, no
    objects.
    """
    r = G._Uni()
    r.item("notice_board1", 84.0, 54.0)
    r.item("aes_hivis_hook1", 136.0, 52.0)
    r.item("qdc_badge_hook1", 170.0, 50.0)
    r.item("rota_board1", 190.0, 50.0)
    r.solid("water_cooler1", 224.0, 78.0)
    r.item("hq_badge_reader1", 16.0, 112.0)
    return _build(r, "room_m09_passage", "10x6_hall")


def room_m09_reading():
    """
    2x1 GU (10x6) the reading room (reading_room): oak parquet, library-green walls
    with a brass line, the only warm room. The staff passage covers the bottom two
    rows, so the floor is y 64-128. Back wall: READING ROOM. A small desk west (the
    notebook scan); the reading desk (the field laptop, a green-shaded lamp, the
    SAFETYNET drop terminal); the microfiche reader cart; the drop terminal's wall
    screen east of it over open floor; a reading table on a red rug (HaX's case file).
    Doors: N (x 32-64; lane x 32-72), E on row 2 (mouth x 230-288), S (x 256-288).
    Usable floor x 76-226.
    Slots: notes_notebook1 (as-type, Training Notebook), vm-launcher (Field Laptop),
    safetynet_flag_terminal1 (as-type, Drop Terminal), m09_drop_screen1 (as-type,
    Drop Terminal Screen), case-file on the reading table (as-type, Case File).
    """
    r = G._Uni()
    r.item("m09_sign_reading1", 80.0, 28.0)
    r.item("m09_county_map1", 146.0, 46.0)             # R3 R2
    r.item("m09_sign_silence1", 196.0, 27.0)            # over the microfiche (moved for the second lamp)
    # the terminal's wall screen east of the desk, over open floor (the E door's mouth),
    # so a player can stand right under it (R2: over the desk it was only reachable at 52 px)
    _cond(r, "m09_drop_screen1", 236.0, 58.0)
    w = r.table("smalldesk2", 78.0, 90.0)               # x 78-110
    r.on(w, "notes_notebook1", 0.30, 0.30, layer="conditional_table_items")
    r.on(w, "bankers_lamp1", 0.86, 0.26)                # a second green lamp (lighting R2 m9)
    d = r.table("desk1", 120.0, 90.0)                   # x 120-198
    r.on(d, "vm-launcher", 0.30, 0.45, layer="conditional_table_items")
    r.on(d, "bankers_lamp1", 0.62, 0.32)
    r.on(d, "safetynet_flag_terminal1", 0.90, 0.45, layer="conditional_table_items")
    r.solid("m09_microfiche1", 200.0, 90.0)             # the microfiche reader cart, x 200-234
    t = r.table("smalldesk1", 92.0, 128.0)              # x 92-142, on the rug
    r.on(t, "case-file", 0.46, 0.70, layer="conditional_table_items")
    r.item("hospital_chair1", 144.0, 126.0)                # R3 R1: faces the table (W)
    return _build(r, "room_m09_reading", "10x6_hall")


def room_m09_restricted():
    """
    2x2 GU the restricted stacks (restricted_stacks, the hub): concrete, brick. Back
    wall: RESTRICTED STACKS over two shelves of binders and a filing cabinet, a card
    reader by the tape-room door (N). The cage front down the east wall below the gate:
    the hatch counter (an oak ledge with mesh along its east edge; collision x 224-240,
    y 124-228), the sealed strip behind it (x 240-288, darker floor) where Sorensen
    works, sealed at both ends (a mesh run at the south end), her bin behind her. Her
    rubber stamp on the counter's south end, on the player's side. A sorting table
    with open boxes SW of centre; the middle stays clear so all four doors show.
    Doors: N (x 32-64), S (x 32-64; lane x 32-72 from y 180), W and E on row 2
    (mouths x 32-92 and 230-288, y 64-118). The reading room covers the bottom two rows.
    NPC: sorensen_hatch, static, at (8.25,5.5): frame x 224-304, y 105-185, body edge
    at the counter.
    Slot: m09_rubber_stamp1 on the counter (as-type, Rubber Stamp), top-left below her
    frame.
    """
    r = G._Uni()
    r.item("m09_sign_restricted1", 100.0, 28.0)
    r.item("hq_badge_reader1", 68.0, 52.0)
    r.solid("binder_shelves1", 96.0, 96.0, depth=30)
    r.solid("binder_shelves1", 146.0, 96.0, depth=30)
    r.solid("filing_cabinet_steel1", 196.0, 96.0, depth=30)
    r.item("hq_badge_reader1", 296.0, 146.0)            # by the gate, E wall
    r.item("wall_clock1", 182.0, 40.0)
    # the cage front
    counter = r.table("m09_hatch_counter2", 224.0, 228.0, kind="objects")   # R3 H1: the ledge, x 224-240
    r.item("m09_hatch_screen1", 238.0, 230.0)          # the mesh screen standing on its east edge
    r.collision(224.0, 124.0, 16.0, 104.0)
    r.collision(240.0, 120.0, 48.0, 8.0)                # sealed at the north end
    r.collision(240.0, 228.0, 48.0, 10.0)               # and the south
    r.item("m09_mesh_rail1", 240.0, 128.0)             # low rails close the strip (R3 H1)
    r.item("m09_mesh_rail1", 240.0, 238.0)
    r.item("bin1", 266.0, 236.0)                        # R4 H4: a small bin against the south rail, clear of her legs
    r.conditional_table_items.append(G.make_obj("objects", "m09_rubber_stamp2", 222.0, 216.0, r._next()))   # R3 H2
    # the sorting table
    st = r.table("zds_desk3", 96.0, 224.0, kind="objects")   # R4 H5: a steel workbench, x 96-147
    r.on(st, "m09_box_open1", 0.20, 0.40)
    r.on(st, "m09_box_open1", 0.48, 0.40)
    r.on(st, "notes4", 0.80, 0.36)
    r.solid("m09_box_trolley1", 34.0, 172.0)             # returns waiting, between the W door and the S door
    r.item("fire_alarm_point1", 14.0, 230.0)
    r.item("m09_keypad1", 17.0, 142.0)                 # R3 H3: the office's keypad, hub side
    return _build(r, "room_m09_restricted")


def room_m09_cage():
    """
    2x2 GU the restricted cage (restricted_cage): concrete, sage blockwork. Back
    wall: SERIES R, the clock. The shredder line in a hatched keep-clear box: the
    cross-cut shredder at her feed, confidential-waste consoles and a bin east of it;
    the feed table SE of her (the last box on it); the plan cabinet in the NE corner,
    so the walk from the gate passes her and the table; the ledger on a low shelf
    east; the degausser and boxes still to go south.
    Door: W on row 2 (mouth x 32-92, y 64-118 clear). The open stacks cover the
    bottom two rows.
    NPC: Sorensen at (3.6,4.6): frame x 75-155, y 76-156.
    Slots: shredder1 (as-type, Cross-Cut Shredder), m09_box_open1 on the feed table
    (as-type, The Last Box), plan_chest2 (as-type, Plan Cabinet), binders1 on the
    shelf (as-type, Initiative Ledger).
    """
    r = G._Uni()
    r.item("m09_sign_series_r1", 104.0, 26.0)
    r.item("wall_clock1", 202.0, 52.0)
    r.solid("m09_shelves_red1", 96.0, 96.0, depth=30)      # R3 C4: Series R, red tape
    r.solid("m09_shelves_red1", 146.0, 96.0, depth=30)
    _cond(r, "plan_chest2", 232.0, 100.0)
    r.collision(234.0, 88.0, 48.0, 12.0)
    r.item("m09_strip_sack1", 140.0, 158.0)            # R3 C2: her sack of strips, at the feed
    r.item("m09_box_taped1", 124.0, 162.0)             # not an open box: that is the feed table's slot
    _cond(r, "shredder1", 164.0, 160.0)
    r.collision(166.0, 150.0, 14.0, 10.0)
    r.solid("hq_confidential_bin1", 188.0, 160.0)
    r.solid("bin8", 212.0, 160.0)
    ft = r.table("smalldesk1", 132.0, 216.0)            # x 132-182, SE of her
    r.on(ft, "m09_box_open1", 0.30, 0.40, layer="conditional_table_items")
    sh = r.table("sideboard1", 240.0, 204.0, kind="objects")   # x 240-284
    r.on(sh, "binders1", 0.40, 0.30, layer="conditional_table_items")
    db = r.table("smalldesk2", 200.0, 250.0)            # R3 C3: on a bench
    r.on(db, "m09_degausser1", 0.50, 0.40)
    r.item("m09_box_taped1", 40.0, 250.0)
    r.item("m09_box_taped1", 56.0, 250.0)
    r.item("m09_box_taped1", 48.0, 238.0)
    r.item("fire_extinguisher1", 292.0, 150.0)
    return _build(r, "room_m09_cage")


def room_m09_office():
    """
    2x2 GU Sorensen's office (sorensen_office): brown carpet, a worn red rug under
    the desk, walnut panelling. Back wall: two shelves of binders (the wall of
    binders), her county certificate, the credenza with the kettle and the deck's
    controller. Her desk on the rug (the lease file, a lamp, a phone), her chair
    behind it; a side table west (the rent ledger) and east (the broker's note); the
    build-out ledger on a sideboard south; the floor safe in the SE corner; the
    keypad on the east wall by the door; a coat stand, a club chair, a bin.
    Door: E on row 2 (mouth x 230-288, y 64-118 clear). Nothing to the south.
    Slots: hce_phd_frame1 (as-type, Framed Certificate), m09_deck_controller1 on the
    credenza (as-type, Tape Deck Controller), case-file on the desk (as-type, Lease File),
    book1 (as-type, Rent Ledger), notes2 (as-type, Broker's Note), notes4 (as-type,
    Build-Out Ledger), safe1 (as-type, Floor Safe).
    """
    r = G._Uni()
    r.solid("binder_shelves1", 34.0, 98.0, depth=30)
    r.solid("binder_shelves1", 82.0, 98.0, depth=30)
    _cond(r, "hce_phd_frame1", 140.0, 46.0)
    cr = r.table("credenza1", 166.0, 100.0, kind="objects")   # x 166-228
    r.on(cr, "kettle1", 0.14, 0.30)
    r.on(cr, "mugs_tray1", 0.36, 0.34)
    r.on(cr, "m09_deck_controller1", 0.76, 0.34, layer="conditional_table_items")
    r.item("exec_chair_black1", 148.0, 170.0)
    d = r.table("exec_desk1", 126.0, 208.0, kind="objects")   # R3 O2: dark wood, x 126-206, on the rug
    r.on(d, "bankers_lamp1", 0.14, 0.30)
    r.on(d, "phone2", 0.36, 0.36)
    r.on(d, "m09_folder1", 0.74, 0.40, layer="conditional_table_items")   # R3 O1: a manila folder
    wt = r.table("sideboard1", 40.0, 196.0, kind="objects")   # R3 O3: x 40-84
    r.on(wt, "book1", 0.40, 0.30, layer="conditional_table_items")
    et = r.table("smalldesk1", 232.0, 196.0)            # x 232-282
    r.on(et, "notes2", 0.40, 0.40, layer="conditional_table_items")
    sb = r.table("sideboard1", 120.0, 300.0, kind="objects")   # x 120-164
    r.on(sb, "notes4", 0.50, 0.30, layer="conditional_table_items")
    _cond(r, "safe1", 246.0, 296.0)
    r.collision(248.0, 284.0, 28.0, 12.0)
    r.item("m09_keypad1", 297.0, 148.0)
    r.solid("club_chair_e1", 34.0, 280.0)
    r.solid("coat_stand1", 258.0, 150.0)
    r.item("bin1", 210.0, 296.0)
    return _build(r, "room_m09_office")


def room_m09_tape():
    """
    2x2 GU the tape room (tape_room): cold blue-grey blockwork, dark vinyl tiles. Back
    wall: the salvage cage's keypad by the N door, the shelf-mark legend framed beside
    it, TAPE STORE, a row of tape racks to the ceiling. A second row of racks across
    the middle; the reel deck on its bench SE, the annotation sheets on a table
    beside it.
    Doors: N (x 32-64), S (x 32-64): the west strip x 32-76 stays clear between them.
    The restricted stacks cover the bottom two rows.
    Slots: m09_shelf_legend1 (as-type, Shelf Marks), the deck (as-type, Reel Deck),
    notes3 on the side table (as-type, Annotation Sheets).
    """
    r = G._Uni()
    r.item("m09_keypad1", 68.0, 48.0)
    _cond(r, "m09_shelf_legend1", 82.0, 52.0)
    r.item("m09_sign_tape1", 170.0, 26.0)
    x = 122.0
    for name in ("m09_reel_shelf1", "m09_tape_cabinet1", "m09_reel_shelf1"):
        r.solid(name, x, 98.0, depth=30)
        x += G.lookup("objects", name)["w"] + 2
    x = 100.0
    for name in ("m09_reel_shelf1", "m09_reel_shelf1", "m09_tape_cabinet1", "m09_reel_shelf1"):
        r.solid(name, x, 166.0, depth=40)
        x += G.lookup("objects", name)["w"] + 2
    # the reel deck on its bench, open floor west of it (reach is from its top-left)
    _cond(r, "m09_reel_deck1", 84.0, 244.0)
    r.collision(86.0, 232.0, 50.0, 12.0)
    t = r.table("smalldesk1", 200.0, 240.0)             # x 200-250
    r.on(t, "notes3", 0.40, 0.40, layer="conditional_table_items")
    r.on(t, "office-misc-lamp4", 0.84, 0.30)
    r.item("m09_box_open1", 262.0, 240.0)
    return _build(r, "room_m09_tape")


def room_m09_salvage():
    """
    2x1 GU (10x6) the salvage cage (salvage_cage): stained concrete, dark brick. The
    tape room covers the bottom two rows, so the floor is y 64-128. Back wall: the
    cut door controller over the S door's corner, SALVAGE. Back row: Tomb Beta's
    rack (the property label on its front), the field kit on a steel desk, the drop
    link on a second, the ALPHA crates stacked against the wall. Front row: the BETA
    crate (enrolment binders), the printer stand with the mirror job in its tray, the
    printed folder on a low table.
    Door: S (x 32-64; lane x 32-72). Usable floor x 76-288.
    Slots: server_rack1 (as-type, Rack Server), notes_tucked1 on its front (as-type,
    Property Label), vm-launcher on the kit desk (Field Kit Link),
    safetynet_flag_terminal1 (as-type, Tomb Beta Drop Link), notes1 on the printer
    stand (as-type, Mirror Job Printout), m09_crate_beta1 (as-type, Crate BETA),
    notes5 on the low table (as-type, Printed Folder).
    """
    r = G._Uni()
    r.item("m09_door_controller1", 40.0, 54.0)
    r.item("m09_sign_salvage1", 228.0, 28.0)
    _cond(r, "server_rack1", 80.0, 96.0)
    r.collision(82.0, 84.0, 26.0, 12.0)
    _cond(r, "notes_tucked1", 89.0, 84.0)
    kd = r.table("zds_desk3", 116.0, 96.0, kind="objects")          # x 116-167, the field kit
    r.on(kd, "vm-launcher", 0.46, 0.40, layer="conditional_table_items")
    sd = r.table("zds_desk3", 174.0, 96.0, kind="objects")          # x 174-225, the drop link
    r.on(sd, "safetynet_flag_terminal1", 0.50, 0.40, layer="conditional_table_items")
    r.solid("m09_crate_alpha1", 254.0, 96.0)                        # ALPHA, against the back wall (R3 V2: one)
    _cond(r, "m09_crate_beta1", 118.0, 128.0)
    r.collision(120.0, 116.0, 28.0, 12.0)
    ps = r.table("smalldesk2", 160.0, 128.0)                        # x 160-192, the printer stand
    r.on(ps, "pnw_portable_printer1", 0.50, 0.40)
    r.on(ps, "notes1", 0.50, 0.66, layer="conditional_table_items")
    lt = r.table("smalldesk1", 204.0, 128.0)                        # x 204-254
    r.on(lt, "m09_folder1", 0.50, 0.66, layer="conditional_table_items")
    return _build(r, "room_m09_salvage", "10x6_hall")


BUILDERS = {
    "room_m09_dock": room_m09_dock,
    "room_m09_front": room_m09_front,
    "room_m09_stacks": room_m09_stacks,
    "room_m09_closet": room_m09_closet,
    "room_m09_passage": room_m09_passage,
    "room_m09_reading": room_m09_reading,
    "room_m09_restricted": room_m09_restricted,
    "room_m09_cage": room_m09_cage,
    "room_m09_office": room_m09_office,
    "room_m09_tape": room_m09_tape,
    "room_m09_salvage": room_m09_salvage,
}


def register(module):
    """Called from generate_rooms.main() with the generate_rooms module itself."""
    global G
    G = module
    return dict(BUILDERS)
