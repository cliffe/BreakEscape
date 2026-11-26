#!/usr/bin/env python3
"""
Build the awareness training-room maps (room_aw_*.json and .tmj) from
room_uni_seminar, so every dressing change is a reviewable diff to this script
rather than a hand edit (planning_notes/phishing_and_social_engineering/awareness/
TRAINING_ROOM_PLAN.md §3, ROOMS_REVIEW_C1.md m6).

Each map is a fresh copy of room_uni_seminar with:
  1. its company floor/wall sheet (make_aw_tileset.py),
  2. the shared skeleton (SKELETON): campus props out, the kiosk slot, the logo
     plate over the host, the report poster, the training table lower left,
  3. the company's own ops (COMPANY_OPS).

The skeleton keeps the positions training_room.py relies on (host 5.5,3.8; kiosk
slot 238,140; spawn 6,6.2) and their keep-clear boxes:
  host x 136-216, y 64-150; kiosk and approach x 230-272, y 76-175;
  spawn x 175-210, y 170-230; nothing on the floor within 32px of (238,80).

Coordinates are room pixels: x the left edge, y the feet. Ids are the seminar's
(room_edit.py room_uni_seminar list); added objects take the next free id in
the order they are listed.

Usage:
  python3 scripts/room_gen/build_aw_rooms.py              # write all four into assets/rooms
  python3 scripts/room_gen/build_aw_rooms.py brightwell   # just one
  python3 scripts/room_gen/build_aw_rooms.py --out DIR    # build into DIR instead
  python3 scripts/room_gen/build_aw_rooms.py --check      # build to a temp dir, diff with assets/rooms
  python3 scripts/room_gen/build_aw_rooms.py open_plan    # the ca15 Tarrowby open plan (see OPEN_PLAN below)

The open plan is not a seminar clone: room_tarrowby_open_plan is the lab's 20x10
room_lw_accounts with its Ledgerwell shell and signs swapped for Tarrowby ones, so ca15's
open_plan keeps every desk, PC, door and stand point. It is deliberately not named
room_aw_*: those maps are pinned by test/js/social-awareness-office-kit.test.mjs.
"""

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import room_edit  # noqa: E402

ROOMS = room_edit.ROOMS
SOURCE = "room_uni_seminar"

# id 1 table; 5/7/9 north-side chairs (face S); 6/8/10 south side (face N); 12 east end (faces W);
# 23 pens, 24 tray, 25 journals (table_items)
SKELETON_PRE = [
    ("delete", 15, 16, 21, 11),          # beanbags, campus timetable; west-end chair would sit in the wall
]
SKELETON_ADD = [
    ("add", "items", "kiosk", 238, 140),
    ("add", "items", "aw_logo_{co}1", 146, 40),
    ("add", "items", "aw_poster_report_{co}1", 14, 120),
    ("add", "items", "fire_extinguisher1", 292, 176),   # under the call point (#20, kept)
]
SKELETON_MOVE = [
    ("move", 1, 36, 270),
    ("move", 5, 52, 214), ("move", 7, 92, 214), ("move", 9, 132, 214),
    ("move", 6, 52, 296), ("move", 8, 92, 296), ("move", 10, 132, 296),
    ("move", 12, 166, 262),
    ("move", 23, 69, 234), ("move", 24, 114, 234), ("move", 25, 86, 232),
]

# Cycle-1 fixes (ROOMS_REVIEW_C1.md) are marked with the finding they answer.
# M1: the tray of coffee (#24, mugs_tray1) is a heal consumable (consumables.js
# DRINKABLE_CUPS), so every room swaps it for a company prop. m2: the journal
# stack (#25) moved off the table's north edge or swapped for something flatter.
COMPANY_OPS = {
    # East Midlands food manufacturer, finance team (§3.2)
    "brightwell": [
        ("move", 2, 36, 50), ("move", 17, 43, 59),
        ("delete", 3),                       # t3: no year planner; the range poster takes its place
        ("sprite", 4, "whiteboard2"), ("move", 4, 226, 50),
        ("delete", 18, 19, 22),
        ("move", 14, 262, 296),
        ("add", "items", "coffee_station1", 232, 296),
        # m1: the company's own product range on the back wall, right of the bar chart
        ("add", "items", "aw_brightwell_range1", 96, 48),
        # M1/m1/M3: a box of the oat bars instead of the tray; payment-run folder
        # instead of the journal stack (m2)
        ("sprite", 24, "aw_brightwell_oatbox1"), ("move", 24, 114, 238),
        ("sprite", 25, "m09_folder1"), ("move", 25, 82, 246),
        ("move", 23, 62, 236),
    ],
    # West Yorkshire haulier and warehouse (§3.3)
    "tarrowby": [
        # M3: H&S notice board where the window was (an inside depot room); t4: the
        # rota board closer to the logo, the map and hi-vis hooks spread out
        ("sprite", 2, "notice_board1"), ("move", 2, 34, 52), ("delete", 17),
        ("sprite", 3, "rota_board1"), ("move", 3, 100, 46),
        ("sprite", 4, "m09_county_map1"), ("move", 4, 222, 48),
        ("add", "items", "aes_hivis_hook1", 258, 52),
        ("delete", 18, 19, 14),
        ("add", "items", "drinks_vending1", 222, 300),
        ("sprite", 22, "aw_chairs_stacked_slate1"), ("move", 22, 268, 300),  # t4: off the east wall strip
        # M3: no flip chart; a pair of cones from the yard in the corner
        ("delete", 13),
        ("add", "items", "aes_cones1", 40, 128),
        # M3: slate-blue stacking chairs, not the teal seminar set
        ("sprite", 5, "aw_chair_south_slate1"), ("sprite", 7, "aw_chair_south_slate1"),
        ("sprite", 9, "aw_chair_south_slate1"),
        ("sprite", 6, "aw_chair_north_slate1"), ("sprite", 8, "aw_chair_north_slate1"),
        ("sprite", 10, "aw_chair_north_slate1"),
        ("sprite", 12, "aw_chair_w_slate1"),
        # M1/M3: a hard hat and a clipboard on the table
        ("sprite", 24, "aw_hard_hat1"), ("move", 24, 114, 238),
        ("sprite", 25, "aes_clipboard1"), ("move", 25, 84, 248),
        ("move", 23, 62, 236),
    ],
    # Bristol insurer with its own IT service desk (§3.4)
    "quayholt": [
        ("move", 2, 36, 50), ("move", 17, 43, 59),
        ("sprite", 3, "info_screen1"), ("move", 3, 90, 48),
        # m3/t5: the service-desk queue, not a sign-in page with a button to press
        ("sprite", 4, "aw_quayholt_queue1"), ("move", 4, 218, 50),
        ("delete", 18, 19, 14, 22),
        ("add", "tables", "zds_desk1", 206, 296),
        # m3: the spare position's PC is switched off and its phone is a headset,
        # so neither reads as something to use
        ("add", "table_items", "aw_pc_off1", 228, 280),
        ("add", "table_items", "office-misc-headphones", 262, 276),
        ("add", "items", "aw_chair_south_charcoal1", 237, 262),
        ("add", "items", "qdc_poster_secure1", 14, 170),
        # M3: no flip chart; a floor plant in the corner
        ("delete", 13),
        ("add", "items", "plant-large11", 38, 150),
        # M1: binders instead of the tray; m2: journal stack onto the table top
        ("sprite", 24, "binders1"), ("move", 24, 114, 242),
        ("move", 25, 82, 246),
        ("move", 23, 62, 236),
        # m3: charcoal chairs, not the teal seminar set Brightwell keeps
        ("sprite", 5, "aw_chair_south_charcoal1"), ("sprite", 7, "aw_chair_south_charcoal1"),
        ("sprite", 9, "aw_chair_south_charcoal1"),
        ("sprite", 6, "aw_chair_north_charcoal1"), ("sprite", 8, "aw_chair_north_charcoal1"),
        ("sprite", 10, "aw_chair_north_charcoal1"),
        ("sprite", 12, "aw_chair_w_charcoal1"),
    ],
    # London architecture practice (§3.5)
    "merrin_sallow": [
        ("delete", 2, 17, 19, 13, 14, 22, 12),
        ("add", "items", "plan_chest2", 36, 72),
        ("sprite", 3, "hce_art_canvas1"), ("move", 3, 96, 46),
        ("move", 4, 220, 50), ("move", 18, 227, 59),
        ("add", "items", "planter_fig1", 34, 166),   # m2: planted against the west wall, below the report poster
        ("add", "table_items", "m10_plans1", 133, 236),
        ("add", "table_items", "bankers_lamp1", 44, 236),
        ("add", "items", "leather_sofa1", 216, 300),
        # t3: static copies of the white task chairs (every chair-* sprite rolls)
        ("sprite", 5, "aw_studio_chair_s1"), ("sprite", 7, "aw_studio_chair_s1"),
        ("sprite", 9, "aw_studio_chair_s1"),
        ("sprite", 6, "aw_studio_chair_n1"), ("sprite", 8, "aw_studio_chair_n1"),
        ("sprite", 10, "aw_studio_chair_n1"),
        ("move", 5, 46, 216), ("move", 7, 85, 216), ("move", 9, 124, 216),
        ("move", 6, 46, 300), ("move", 8, 85, 300), ("move", 10, 124, 300),
        # M1: no tray (the lamp, drawings and journals already dress the table);
        # m2: the journals onto the table top
        ("delete", 24),
        ("move", 25, 86, 246),
    ],
    # Support-services firm, Care Laundry line (E11, 01_PIPELINE P5b): the Quayholt list
    # minus its company props (queue screen, spare desk, charcoal chairs stay shared).
    "carrholme": [
        ("move", 2, 36, 50), ("move", 17, 43, 59),
        ("sprite", 3, "info_screen1"), ("move", 3, 90, 48),
        ("sprite", 4, "whiteboard2"), ("move", 4, 218, 50),
        ("delete", 18, 19, 14, 22),
        # the Care Laundry line: a linen cart of name-taped bundles by the south wall
        ("add", "items", "linen_cart1", 232, 296),
        # no flip chart; a floor plant in the corner
        ("delete", 13),
        ("add", "items", "plant-large11", 38, 150),
        ("sprite", 24, "binders1"), ("move", 24, 114, 242),
        ("move", 25, 82, 246),
        ("move", 23, 62, 236),
        ("sprite", 5, "aw_chair_south_charcoal1"), ("sprite", 7, "aw_chair_south_charcoal1"),
        ("sprite", 9, "aw_chair_south_charcoal1"),
        ("sprite", 6, "aw_chair_north_charcoal1"), ("sprite", 8, "aw_chair_north_charcoal1"),
        ("sprite", 10, "aw_chair_north_charcoal1"),
        ("sprite", 12, "aw_chair_w_charcoal1"),
    ],
    # Merrin & Sallow reception (E12, 01_PIPELINE P5c). Not a kiosk room: no skeleton, no
    # kiosk or host slot. Built on the Merrin & Sallow sheet (LOBBY_SHEET). The badge door
    # to training_room is the engine's west door (rooms.js, x 16, y 80 on the west wall),
    # so the west wall rows y 64-130 and the floor 30-70 px in stay clear; the front desk
    # is north-centre for the NPC to stand behind it.
    "merrin_lobby": [
        # everything from the seminar except the fire alarm point (#20) and the wall clock (#19)
        ("delete", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25),
        ("move", 19, 252, 46), ("move", 20, 292, 132),
        ("add", "items", "aw_logo_merrin_sallow1", 128, 40),
        ("add", "items", "reception_counter1", 105, 172),
        ("add", "items", "exit_sign1", 36, 36),
        ("add", "items", "directory_sign1", 70, 52),
        ("add", "items", "hce_art_canvas1", 200, 50),
        ("add", "items", "hq_badge_reader1", 20, 118),
        ("add", "items", "aw_poster_report_merrin_sallow1", 14, 170),
        ("add", "items", "fire_extinguisher1", 292, 176),
        # waiting area, south-east, and the front-door stanchions
        ("add", "items", "leather_sofa1", 216, 300),
        ("add", "items", "glass_coffee_table1", 222, 266),
        ("add", "items", "magazine_rack1", 250, 232),
        ("add", "items", "planter_fig1", 246, 112),
        ("add", "items", "coat_stand1", 80, 300),
        ("add", "items", "stanchions1", 130, 300),
        ("add", "items", "planter_fig1", 40, 300),
        # the optional logged-in hot desk (E12 section 9: passive, observations only)
        ("add", "tables", "zds_desk1", 36, 234),
        ("add", "table_items", "pc8", 52, 224),
    ],
}

# Maps that reuse another company's tile sheet instead of having their own.
LOBBY_SHEET = {"merrin_lobby": "room_aw_merrin_sallow"}
# Maps with no shared training-room skeleton (no kiosk, host or report poster).
NO_SKELETON = {"merrin_lobby"}

COMPANIES = list(COMPANY_OPS)

# ---- the ca15 Tarrowby open plan (docs/video/scripts/ca15_trailer_script_r3.md S1) --------
OPEN_PLAN = "open_plan"
OPEN_PLAN_SOURCE = "room_lw_accounts"
OPEN_PLAN_STEM = "room_tarrowby_open_plan"
OPEN_PLAN_SHEET = "room_tarrowby_open_plan_20"      # room_aw_tarrowby's shell widened to 20 tiles
# Source ids (room_edit.py room_lw_accounts list): 49/50 ledger shelves, 51 portrait, 52 ACCOUNTS
# sign, 54/55 sash windows, 56 card index, 57 pigeonholes. Desks, chairs, PCs, lamps, clock,
# camera, copier and the two confidential-waste bins stay where they are, so no scenario
# coordinate moves. Heights: a wall item's y is its bottom edge, and the shell's back wall
# runs to y 64.
OPEN_PLAN_OPS = [
    ("delete", 49, 50, 51, 52, 54, 55, 56, 57),
    ("add", "items", "binder_shelves1", 140, 74),        # ops folders behind Joanne's desk
    ("add", "items", "aes_shelving1", 196, 74),          # depot parts and boxes behind desk 2
    ("add", "items", "m09_county_map1", 104, 44),        # delivery territory map, where the portrait hung
    ("add", "items", "aw_logo_tarrowby1", 250, 38),      # the Tarrowby plate, where the ACCOUNTS sign was
    ("add", "items", "window_blinds1", 356, 56),
    ("add", "items", "window_blinds1", 400, 56),
    ("add", "items", "aes_hivis_hook1", 446, 60),        # hi-vis and hard hat by the yard door side
    ("add", "items", "notice_board1", 484, 62),
    ("add", "items", "rota_board1", 534, 58),
    ("add", "items", "first_aid_cabinet1", 566, 62),
]


def apply(room, op, co):
    kind, *args = op
    if kind == "delete":
        for oid in args:
            room.delete(oid)
    elif kind == "move":
        oid, x, y = args
        room.move(oid, x=x, y=y)
    elif kind == "sprite":
        oid, name = args
        room.sprite(oid, name.format(co=co))
    elif kind == "add":
        layer, name, x, y = args
        room.add(layer, name.format(co=co), x, y)
    else:
        raise ValueError(op)


def build(co, out_dir):
    stem = f"room_aw_{co}"
    for ext in ("json", "tmj"):
        shutil.copyfile(ROOMS / f"{SOURCE}.{ext}", out_dir / f"{stem}.{ext}")
    room_edit.ROOMS = out_dir          # Room() reads and writes ROOMS/<stem>.*
    try:
        room = room_edit.Room(stem)
        room.floor(LOBBY_SHEET.get(co, stem))
        skeleton = [] if co in NO_SKELETON else SKELETON_PRE + SKELETON_ADD + SKELETON_MOVE
        for op in skeleton + COMPANY_OPS[co]:
            apply(room, op, co)
        room.save()
    finally:
        room_edit.ROOMS = ROOMS
    return stem


def build_open_plan(out_dir, tiles_dir):
    """room_tarrowby_open_plan.json in out_dir and its 20-wide sheet in tiles_dir."""
    from PIL import Image
    from make_lw_tileset import widen_sheet
    sheet = widen_sheet(Image.open(ROOMS.parent / "tiles/rooms/room_aw_tarrowby.png").convert("RGBA"))
    tiles_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(tiles_dir / f"{OPEN_PLAN_SHEET}.png")
    shutil.copyfile(ROOMS / f"{OPEN_PLAN_SOURCE}.json", out_dir / f"{OPEN_PLAN_STEM}.json")
    room_edit.ROOMS = out_dir
    try:
        room = room_edit.Room(OPEN_PLAN_STEM)
        for d in room.docs:
            ts = next(t for t in d.data["tilesets"] if t.get("name") == "room_lw_tiles_20")
            d.put_tileset(dict(ts, name=OPEN_PLAN_SHEET, image=f"../tiles/rooms/{OPEN_PLAN_SHEET}.png"))
        for op in OPEN_PLAN_OPS:
            apply(room, op, "tarrowby")
        room.save()
    finally:
        room_edit.ROOMS = ROOMS
    return OPEN_PLAN_STEM


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("companies", nargs="*", help=f"any of {', '.join(COMPANIES)} (default: all)")
    ap.add_argument("--out", type=Path, help="build into this directory instead of assets/rooms")
    ap.add_argument("--check", action="store_true", help="build to a temp dir and diff with assets/rooms")
    a = ap.parse_args(argv)
    want_plan = OPEN_PLAN in a.companies
    cos = [c for c in a.companies if c != OPEN_PLAN] if a.companies else COMPANIES
    want_plan = want_plan or not a.companies
    for co in cos:
        if co not in COMPANY_OPS:
            ap.error(f"unknown company {co!r}")
    if a.check:
        with tempfile.TemporaryDirectory() as tmp:
            bad = 0
            for co in cos:
                stem = build(co, Path(tmp))
                for ext in ("json", "tmj"):
                    same = (Path(tmp) / f"{stem}.{ext}").read_bytes() == (ROOMS / f"{stem}.{ext}").read_bytes()
                    print(f"{stem}.{ext}: {'same' if same else 'DIFFERS'}")
                    bad += not same
            if want_plan:
                tiles = Path(tmp) / "tiles"
                build_open_plan(Path(tmp), tiles)
                for label, a_, b_ in ((f"{OPEN_PLAN_STEM}.json", Path(tmp) / f"{OPEN_PLAN_STEM}.json", ROOMS / f"{OPEN_PLAN_STEM}.json"),
                                      (f"{OPEN_PLAN_SHEET}.png", tiles / f"{OPEN_PLAN_SHEET}.png", ROOMS.parent / "tiles/rooms" / f"{OPEN_PLAN_SHEET}.png")):
                    same = a_.read_bytes() == b_.read_bytes()
                    print(f"{label}: {'same' if same else 'DIFFERS'}")
                    bad += not same
            sys.exit(1 if bad else 0)
    out = a.out or ROOMS
    out.mkdir(parents=True, exist_ok=True)
    for co in cos:
        stem = build(co, out)
        print(f"wrote {out / stem}.json and .tmj")
    if want_plan:
        tiles = a.out / "tiles" if a.out else ROOMS.parent / "tiles/rooms"
        print(f"wrote {out / build_open_plan(out, tiles)}.json and {tiles / OPEN_PLAN_SHEET}.png")


if __name__ == "__main__":
    main(sys.argv[1:])
