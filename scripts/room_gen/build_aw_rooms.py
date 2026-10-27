#!/usr/bin/env python3
"""
Build the four awareness training-room maps (room_aw_*.json and .tmj) from
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
}

COMPANIES = list(COMPANY_OPS)


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
        room.floor(stem)
        for op in SKELETON_PRE + SKELETON_ADD + SKELETON_MOVE + COMPANY_OPS[co]:
            apply(room, op, co)
        room.save()
    finally:
        room_edit.ROOMS = ROOMS
    return stem


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("companies", nargs="*", help=f"any of {', '.join(COMPANIES)} (default: all four)")
    ap.add_argument("--out", type=Path, help="build into this directory instead of assets/rooms")
    ap.add_argument("--check", action="store_true", help="build to a temp dir and diff with assets/rooms")
    a = ap.parse_args(argv)
    cos = a.companies or COMPANIES
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
            sys.exit(1 if bad else 0)
    out = a.out or ROOMS
    out.mkdir(parents=True, exist_ok=True)
    for co in cos:
        stem = build(co, out)
        print(f"wrote {out / stem}.json and .tmj")


if __name__ == "__main__":
    main(sys.argv[1:])
