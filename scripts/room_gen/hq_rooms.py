"""
SAFETYNET headquarters, the Citadel (m08 "The Mole"): the room_hq_* builders.

Kept in their own module so m08's rooms don't add to the shared generate_rooms.py
beyond one hook: generate_rooms.main() calls register(module) and merges the
builders it returns. Each builder uses generate_rooms' own _Uni, make_obj and
build_room, then points the map's room6 tileset at its HQ sheet
(room_gen/make_hq_tileset.py). Hand-drawn props: room_gen/make_hq_props.py
(hq_*); a few PixelLab props (hq_interview_table1, hq_xray1, hq_enigma1,
hq_archive_shelf1, hq_mobile_stack1, hq_security_container1, hq_green_safe1,
hq_camera_tripod1, hq_detector_arch1, hq_console1, hq_rack1). These maps are
m08's own: room_reception, room_ceo, room_office, room_control_1x2gu,
room_servers, room_archive_1x2gu, room_lab, room_security and room_break stay as
they are.

Coordinates: x = left edge, y = feet (room pixels). Door rules for m08's layout
(scripts/predict_door_sides.py): every N/S door is in the left corner (x 32-64),
every E/W door on row 2 (mouth y 64-118). A room with a room to its south loses its
bottom two rows (feet at y 256 or above).

  python3 scripts/generate_rooms.py room_hq_lobby      # one room
"""

G = None   # the generate_rooms module, set by register()

HQ_FLOOR_SHEETS = {
    "room_hq_lobby": "room_hq_lobby",
    "room_hq_director": "room_hq_director",
    "room_hq_ops": "room_hq_ops",
    "room_hq_intel": "room_hq_intel",
    "room_hq_servers": "room_hq_servers",
    "room_hq_archives": "room_hq_archives",
    "room_hq_crypto": "room_hq_crypto",
    "room_hq_interview": "room_hq_interview",
    "room_hq_break": "room_hq_break",
}


def _build(r, name, template="10x10"):
    room = r.build(name, template)
    sheet = HQ_FLOOR_SHEETS[name]
    for ts in room["tilesets"]:
        if ts.get("name") == "room6":
            ts["name"] = sheet
            ts["image"] = ts["image"].replace("room6.png", f"{sheet}.png")
    return room


def room_hq_lobby():
    """
    2x2 GU the Citadel's lobby (main_lobby, the start room): dark granite with the
    SAFETYNET seal inlaid at the spawn, slate walls, walnut slats behind reception.
    Back wall: the SAFETYNET wordmark over the reception counter (ATHENA's desk: the
    visitor badge printer, a monitor, a phone), the Level Red alert screen on the
    slats beside it, the memorial wall in the NE corner with white lilies under it.
    The security line west of the spawn: the X-ray scanner and the walk-through arch.
    A waiting area SE (a black leather sofa, a glass table, a club chair), a fig and
    a plant along the south. Badge readers by every door, each LED red.
    Doors: N (x 32-64; lane x 32-72 clear to y 140), W and E on row 2 (mouths
    x 32-92 and 230-288, y 64-118 clear). Nothing to the south.
    NPC: ATHENA at (4.5,3.8), sprite x 128-160, feet ~138, in front of the counter.
    Slots: hq_badge_printer1 on the counter (as-type, Visitor Badge Printer),
    hq_alert_screen1 on the slats (as-type, Security Alert Board).
    """
    r = G._Uni()
    r.item("hq_logo_sign1", 96.0, 36.0)               # over the counter
    r.item("hq_alert_screen1", 184.0, 54.0)           # LEVEL RED, on the slats
    r.item("hq_memorial1", 238.0, 52.0)               # the memorial wall
    r.item("hq_flowers1", 262.0, 72.0)                # lilies at its foot
    r.item("hq_badge_reader1", 68.0, 50.0)            # by the N door
    desk = r.table("reception_counter1", 100.0, 104.0, kind="objects")   # x 100-210
    r.on(desk, "hq_badge_printer1", 0.14, 0.30)
    r.on(desk, "pc11", 0.50, 0.24)
    r.on(desk, "phone1", 0.74, 0.30)
    r.on(desk, "office-misc-smallplant4", 0.92, 0.28)
    # the security line, SW of the spawn
    r.solid("hq_xray1", 36.0, 200.0, depth=12)        # x 36-96
    r.item("hq_detector_arch1", 104.0, 206.0)         # x 104-136, walk through it
    r.collision(104.0, 196.0, 5.0, 10.0)
    r.collision(131.0, 196.0, 5.0, 10.0)
    # waiting area SE
    r.solid("leather_sofa1", 210.0, 254.0)
    r.table("glass_coffee_table1", 214.0, 290.0, kind="objects")
    r.solid("club_chair_w1", 172.0, 296.0)
    r.solid("planter_fig1", 252.0, 300.0)
    r.solid("plant-large12", 40.0, 300.0)
    r.solid("brochure_rack1", 84.0, 300.0)
    # side walls
    r.item("hq_badge_reader1", 16.0, 140.0)           # W door
    r.item("hq_badge_reader1", 296.0, 140.0)          # E door
    r.item("fire_alarm_point1", 14.0, 240.0)
    r.item("fire_extinguisher1", 14.0, 290.0)
    r.item("hq_poster_red1", 292.0, 200.0)
    return _build(r, "room_hq_lobby")


def room_hq_director():
    """
    2x2 GU Director Netherton's office: walnut parquet, a navy rug under the desk,
    umber walls with walnut slats along the back. A bookcase NW, a credenza with a
    decanter, a window, the wall clock; the big desk on the rug (the dossiers on
    it), his biometric safe on the floor at the desk's left end, two visitor chairs
    facing the desk; a globe and a plant east.
    Doors: S (bottom-left, x 32-64; the walk-in from y 256 up kept clear). The lobby
    covers the bottom two rows, so feet stay at y 256 or above.
    NPC: Netherton at (6.8,6.2), sprite x 202-234, feet ~214, clear floor east of
    the desk.
    Slots: notes4 on the desk (Suspect Dossiers), safe2 at its left end (Director's Safe).
    """
    r = G._Uni()
    r.solid("bookcase", 36.0, 100.0)
    r.item("window_blinds1", 90.0, 52.0)
    r.solid("credenza1", 138.0, 98.0)
    r.item("wall_clock1", 214.0, 40.0)
    r.item("hq_logo_small1", 250.0, 36.0)
    r.solid("floor_globe1", 238.0, 124.0)
    desk = r.table("desk-ceo1", 120.0, 182.0)         # x 120-198, chair and lamp drawn in
    r.on(desk, "notes4", 0.30, 0.62)
    r.on(desk, "exec_laptop1", 0.72, 0.62)
    r.item("safe2", 92.0, 182.0)                      # biometric safe, under the desk's end
    r.item("exec_chair_back1", 116.0, 240.0)          # visitor chairs facing the desk
    r.item("exec_chair_back1", 160.0, 240.0)
    r.solid("planter_fig1", 252.0, 254.0)
    r.solid("club_chair_e1", 36.0, 168.0)
    r.item("picture11", 292.0, 130.0)
    return _build(r, "room_hq_director")


def room_hq_ops():
    """
    2x2 GU the operations floor: charcoal carpet tiles with lighter walkways joining
    the four doors (W to E along y 72-124, N to S along x 32-76), slate walls.
    Back wall: OPERATIONS plate, world clocks, the operations status wall (every
    team STAND DOWN, INVESTIGATION). The floor: Cipher barricaded behind his three
    monitors; the junior analyst at her desk of threat feeds east; the print tray
    on the photocopier west of Cipher.
    Doors: W and E on row 2, N (top-left), S (bottom-left): the walkways stay clear.
    The archives cover the bottom two rows (feet at 256 or above).
    NPCs: Cipher at (5.2,4.8), sprite x 150-182, feet ~170, his desk below him;
    the analyst at (8.2,6.6), sprite x 246-278, feet ~227, her desk above her.
    Slots: hq_ops_board1 (as-type, Operations Status Board), notes3 on the
    photocopier (Personnel Print Job).
    """
    r = G._Uni()
    r.item("hq_ops_sign1", 84.0, 24.0)
    r.item("hce_world_clocks1", 86.0, 54.0)
    r.item("hq_ops_board1", 140.0, 54.0)
    r.item("hq_poster_ears1", 256.0, 50.0)
    r.item("hq_badge_reader1", 68.0, 54.0)
    # the print tray, west of Cipher
    cop = r.table("photocopier1", 84.0, 170.0, kind="objects")   # x 84-119
    r.on(cop, "notes3", 0.45, 0.12, layer="conditional_table_items")
    # Cipher's barricade of three monitors
    cd = r.table("zds_desk1", 127.0, 210.0, kind="objects")      # x 127-205
    for f in (0.18, 0.50, 0.82):
        r.on(cd, "pc8", f, 0.40)
    r.on(cd, "office-misc-cup3", 0.04, 0.30)
    # the analyst's desk
    ad = r.table("zds_desk3", 236.0, 184.0, kind="objects")      # x 236-287
    r.on(ad, "pc12", 0.36, 0.40)
    r.on(ad, "phone2", 0.82, 0.32)
    # south: hot desks along the foot
    r.solid("qdc_filing_steel1", 90.0, 256.0)
    r.solid("qdc_filing_steel1", 120.0, 256.0)
    r.solid("water_cooler1", 214.0, 256.0)
    r.item("bin1", 192.0, 256.0)
    r.item("hq_badge_reader1", 16.0, 140.0)
    r.item("hq_badge_reader1", 296.0, 140.0)
    r.item("fire_extinguisher1", 292.0, 230.0)
    return _build(r, "room_hq_ops")


def room_hq_intel():
    """
    2x1 GU (10x6) intelligence analysis: dark navy carpet, slate walls. The ops floor
    covers the bottom two rows, so the floor is y 64-128 and everything stands
    against the back wall: INTELLIGENCE plate, an analysis console under a SIEM
    screen, the four-site tactical board still up with clear floor under it,
    Phantom's desk (his notebook, a laptop) under the threat map, a steel cabinet.
    Doors: S (bottom-left, x 32-64): the lane x 32-76 stays clear.
    NPC: Phantom at (5.0,3.0), sprite x 144-176, feet ~112, in front of the board.
    Slots: hq_tactical_board1 (as-type, Four-Site Night Tactical Board), notes3 on
    his desk (Phantom's Off-Book Notes).
    """
    r = G._Uni()
    r.item("hq_intel_sign1", 80.0, 24.0)
    r.item("siem_dashboard", 84.0, 56.0)
    r.solid("hq_console1", 80.0, 98.0)                # x 80-132
    r.item("hq_tactical_board1", 138.0, 56.0)         # x 138-200
    r.item("threat_map1", 206.0, 54.0)
    d = r.table("smalldesk1", 204.0, 100.0)           # x 204-254
    r.on(d, "notes3", 0.25, 0.30, layer="conditional_table_items")
    r.on(d, "laptop3", 0.70, 0.30)
    r.solid("qdc_filing_steel1", 258.0, 94.0)
    return _build(r, "room_hq_intel", "10x6_hall")


def room_hq_servers():
    """
    2x2 GU the server room behind the badge reader: graphite walls with the blue
    line, raised floor, perforated cold aisles in front of each rack row. A back
    row of racks (a UPS, storage, a tape library), SERVER ROOM plate; a middle row;
    the GitList terminal on a steel desk by the corner rack SW, the evidence relay
    on its own desk SE, the printed access log on a tool trolley at the end of the
    back row; precision air-con on the west wall below the door.
    Doors: W on row 2 (mouth x 32-92, y 64-118 clear). Nothing to the south.
    Slots: vm-launcher (GitList), flag-station (Evidence Relay), text_file on the
    trolley (Server Access Log), each 57 px or more from the others.
    """
    r = G._Uni()
    r.item("hq_server_sign1", 100.0, 24.0)
    r.item("suppression_panel1", 160.0, 40.0)
    x = 98.0
    for name in ("ups_cabinet1", "hq_rack1", "server_rack1", "hq_rack1", "storage_array1", "tape_library1"):
        r.solid(name, x, 98.0)
        x += G.lookup("objects", name)["w"] + 2
    tr = r.table("aes_tool_trolley1", 258.0, 150.0, kind="objects")
    r.on(tr, "text_file", 0.45, 0.20)
    x = 64.0
    for name in ("hq_rack1", "server_rack1", "hq_rack1", "server_rack2", "hq_rack1", "server_rack1"):
        r.solid(name, x, 222.0)
        x += G.lookup("objects", name)["w"] + 2
    r.solid("aircon_unit1", 34.0, 210.0)
    vd = r.table("zds_desk3", 40.0, 298.0, kind="objects")
    r.on(vd, "vm-launcher", 0.40, 0.40)
    fd = r.table("zds_desk3", 200.0, 298.0, kind="objects")
    r.on(fd, "flag-station", 0.45, 0.40)
    r.item("hq_badge_reader1", 16.0, 140.0)
    r.item("fire_extinguisher1", 292.0, 200.0)
    return _build(r, "room_hq_servers")


def room_hq_archives():
    """
    2x1 GU (10x6) security archives: sealed concrete, yellow aisle lines, olive
    blockwork. Nothing to the south: the floor is y 64-160. The archivist's desk
    against the back wall west (a terminal, the database catalogue), the badge audit
    slid off it onto the floor; archive shelves and a mobile stack along the back
    wall east; a reading table SE with the leak-investigations index on it.
    Doors: N (top-left, x 32-64): the lane x 32-80 stays clear to the floor's foot.
    Slots: text_file on the desk (Global Threat Database Catalogue), notes1 on the
    floor below it (Badge Audit Printout), notes5 on the reading table (Past Leak
    Investigations); 35 px or more apart.
    """
    r = G._Uni()
    r.item("hq_archive_sign1", 84.0, 30.0)
    d = r.table("smalldesk1", 84.0, 100.0)            # x 84-134
    r.on(d, "text_file", 0.22, 0.30)
    r.on(d, "pc3", 0.68, 0.24)
    r.conditional_items.append(G.make_obj("objects", "notes1", 122.0, 130.0, r._next()))   # the printout, on the floor
    for x in (150.0, 194.0):
        r.solid("hq_archive_shelf1", x, 96.0)
    r.solid("hq_mobile_stack1", 238.0, 96.0)
    rt = r.table("smalldesk1", 226.0, 158.0)
    r.on(rt, "notes5", 0.30, 0.20, layer="conditional_table_items")
    return _build(r, "room_hq_archives", "10x6_hall")


def room_hq_crypto():
    """
    2x2 GU the cryptography lab: grey anti-static tiles, pale lab-grey walls with
    the blue line. Back wall: the key-material cabinet in a hatched keep-clear box,
    CRYPTOGRAPHY plate over the cipher whiteboard, an Enigma machine under glass.
    Nightshade's bare desk (one locked workstation, nothing else) west of where he
    stands; the CyberChef station SE; a security container and the confidential
    waste console east.
    Doors: W and E on row 2 (mouths x 32-92 and 230-288, y 64-118 clear), S
    (bottom-left): the west strip x 32-76 stays clear from the W door to the S door.
    The interrogation suite covers the bottom two rows (feet at 256 or above).
    NPC: Nightshade at (5.3,5.8), sprite x 154-186, feet ~202.
    Slots: pc5 on his desk (Nightshade's Workstation), workstation on the CyberChef
    desk.
    """
    r = G._Uni()
    r.solid("qdc_key_cabinet1", 100.0, 98.0)          # in the hatched box x 96-140, y 66-104
    r.item("hq_crypto_sign1", 146.0, 24.0)
    r.item("hq_cipher_board1", 150.0, 58.0)
    r.solid("hq_enigma1", 196.0, 98.0)
    nd = r.table("zds_desk3", 92.0, 214.0, kind="objects")       # x 92-143
    r.on(nd, "pc5", 0.50, 0.42)
    cc = r.table("zds_desk1", 200.0, 252.0, kind="objects")      # x 200-278
    r.on(cc, "workstation", 0.30, 0.40)
    r.on(cc, "office-misc-headphones", 0.70, 0.30)
    r.solid("hq_security_container1", 250.0, 196.0)
    r.solid("hq_confidential_bin1", 226.0, 168.0)
    r.item("hq_badge_reader1", 16.0, 140.0)
    r.item("hq_badge_reader1", 296.0, 140.0)
    r.item("hq_poster_ears1", 292.0, 230.0)
    return _build(r, "room_hq_crypto")


def room_hq_interview():
    """
    2x2 GU Interview 1, the interrogation suite: worn grey vinyl, pale painted
    blockwork with a dark red line. Back wall: RECORDING lamp over the door end, the
    evidence wall screen, the one-way mirror, the disposition screen. The steel
    table bolted mid-room on its darker square, a fixed chair either side; a camera
    on a tripod watching it; a bin.
    Doors: N (top-left, x 32-64; lane x 32-72 clear). Nothing to the south.
    NPC: Nightshade at (5.0,4.2), sprite x 144-176, feet ~150, across the table.
    Slots: hq_evidence_wall1 (as-type, Evidence Display), hq_disposition1 (as-type,
    Detention Disposition Screen), clear floor under both.
    """
    r = G._Uni()
    r.item("hq_recording1", 70.0, 24.0)
    r.item("hq_evidence_wall1", 72.0, 58.0)           # x 72-136
    r.item("hq_one_way_mirror1", 142.0, 56.0)         # x 142-238
    r.item("hq_disposition1", 246.0, 54.0)            # x 246-280
    r.table("hq_interview_table1", 132.0, 200.0, kind="objects")   # x 132-188, on the dark square
    r.item("hospital_chair_north", 152.0, 228.0)      # the interviewer's side, facing the table
    r.solid("hq_camera_tripod1", 236.0, 170.0, depth=6)
    r.item("bin1", 270.0, 300.0)
    return _build(r, "room_hq_interview")


def room_hq_break():
    """
    2x2 GU the staff room: wood-effect vinyl, kitchen vinyl along the back, warm
    putty walls. Back wall: a dark kitchenette (kettle, mugs), the coffee machine
    with the facilities post-it stuck on it, a security poster beside it telling
    staff never to do exactly that, then the three suspects' lockers in a row (0x23,
    0x47, 0x88). The off-duty agent at a cafe table with a view of the lockers; a
    middle table with someone's legal pad; HaX at a table in the SW corner; a sofa
    and the drinks machine along the south, a plant on the west wall.
    Doors: E on row 2 (mouth x 230-288, y 64-118 clear). Nothing to the south.
    NPCs: HaX at (3.0,7.6), sprite x 80-112, feet ~259; the off-duty agent at
    (6.5,4.8), sprite x 192-224, feet ~170, all three lockers within 100 px of him
    (his sight circle is 160).
    Slots: notes_postit1 on the coffee machine (Post-It), notes_legalpad1 on the
    middle table (Leak Timeline), hq_locker_a1/b1/c1 (as-type, the lockers).
    """
    r = G._Uni()
    k = r.table("qdc_kitchenette2", 34.0, 100.0, kind="objects")   # x 34-90
    r.on(k, "kettle1", 0.70, 0.30)
    r.on(k, "mugs_tray1", 0.25, 0.30)
    r.solid("qdc_espresso1", 92.0, 100.0)            # x 92-136
    r.conditional_items.append(G.make_obj("objects", "notes_postit1", 118.0, 72.0, r._next()))   # on the machine
    r.item("hq_poster_postit1", 140.0, 52.0)
    for x, name in ((156.0, "hq_locker_a1"), (182.0, "hq_locker_b1"), (208.0, "hq_locker_c1")):
        r.solid(name, x, 98.0)
    # the middle table: someone's legal pad
    mt = r.table("smalldesk1", 110.0, 186.0)          # x 110-160
    r.on(mt, "notes_legalpad1", 0.30, 0.30, layer="conditional_table_items")
    r.on(mt, "office-misc-cup2", 0.75, 0.30)
    r.item("hospital_chair_south", 118.0, 152.0)
    r.item("hospital_chair_north", 140.0, 210.0)
    # the off-duty agent's table, east of him
    at = r.table("smalldesk1", 232.0, 198.0)          # x 232-282
    r.on(at, "magazine_cover1", 0.35, 0.30)
    r.on(at, "office-misc-cup", 0.75, 0.30)
    r.item("hospital_chair_north", 250.0, 222.0)
    # HaX's corner table, SW
    ht = r.table("smalldesk1", 116.0, 268.0)          # x 116-166
    r.on(ht, "office-misc-cup2", 0.25, 0.30)
    r.item("hospital_chair1", 168.0, 262.0)
    r.solid("plant-large11", 34.0, 196.0)
    r.solid("leather_sofa1", 190.0, 298.0)
    r.item("fire_extinguisher1", 292.0, 160.0)
    return _build(r, "room_hq_break")


BUILDERS = {
    "room_hq_lobby": room_hq_lobby,
    "room_hq_director": room_hq_director,
    "room_hq_ops": room_hq_ops,
    "room_hq_intel": room_hq_intel,
    "room_hq_servers": room_hq_servers,
    "room_hq_archives": room_hq_archives,
    "room_hq_crypto": room_hq_crypto,
    "room_hq_interview": room_hq_interview,
    "room_hq_break": room_hq_break,
}


def register(module):
    """Called from generate_rooms.main() with the generate_rooms module itself."""
    global G
    G = module
    return dict(BUILDERS)
