#!/usr/bin/env python3
"""
Build the Ledgerwell Ltd room sheet (tiles/rooms/room_lw_carpet.png) for the
physical-pentest lab (scenarios/lab_physical_pentest): the client's own floor,
clearly unlike Tarnside's slate-blue at the briefing-room door.

Same wall treatment and 10x10 tile layout as make_se_tileset.py's room_se_carpet
(so a map keeps its firstgid), with a bottle-green carpet and a brass brand line
in place of Tarnside's teal.

  room_lw_carpet  plain bottle-green carpet (reception, hall, open office, store)
  room_lw_exec    the same carpet with make_zds_tileset's navy rug under the desk
                  and visitor chairs (room_lw_ceo, cloned from room_zds_ceo)

Usage: python3 scripts/room_gen/make_lw_tileset.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, sheet_floor_top  # noqa: E402
from make_uni_tileset import paint_floor, carpet_pixel_fn  # noqa: E402
from make_zds_tileset import FRONT_WALLS, base_walls, paint_rug  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

LEDGERWELL_BRASS = (176, 138, 60)
CARPET_BOTTLE_GREEN = carpet_pixel_fn((42, 102, 76), (35, 88, 65), (58, 122, 92), (28, 74, 54))


def main():
    walls = base_walls(dict(FRONT_WALLS, brand=LEDGERWELL_BRASS))
    sheets = {"room_lw_carpet": paint_floor(walls, CARPET_BOTTLE_GREEN)}
    exec_ = paint_floor(walls, CARPET_BOTTLE_GREEN)
    paint_rug(exec_.load(), (92, 92, 228, 206))  # same box as room_zds_exec (room_zds_ceo)
    sheets["room_lw_exec"] = exec_
    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
