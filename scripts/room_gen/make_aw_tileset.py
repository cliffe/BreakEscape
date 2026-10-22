#!/usr/bin/env python3
"""
Build the awareness training-room sheets (tiles/rooms/room_aw_*.png), one per
company in the awareness product (planning_notes/phishing_and_social_engineering/
awareness/TRAINING_ROOM_PLAN.md §3.1).

Each sheet is room6's layout raised to the 2-tile wall standard, as
make_uni_tileset.py builds the campus sheets, with the company's own wall colour,
its brand accent (BRAND_SET.md) as the skirting line, and one floor:

  room_aw_brightwell     warm off-white, green skirting,      charcoal-blue carpet tiles
  room_aw_tarrowby       pale grey,      steel-blue skirting, blue-grey sheet vinyl (depot office)
  room_aw_quayholt       cool white,     purple skirting,     blue carpet tiles
  room_aw_merrin_sallow  warm stone,     bronze skirting,     sealed concrete (architects' studio)

The floor painters come from make_uni_tileset.py. Each sheet needs a
this.load.image line in game.js (the tileset name is the texture key).

Usage: python3 scripts/room_gen/make_aw_tileset.py
"""

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, raise_back_wall, sheet_floor_top  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402
from make_uni_tileset import (  # noqa: E402
    CARPET_BLUE, CARPET_CHARCOAL, ROOT, SRC, OUT_DIR, concrete_pixel, paint_floor, shade, vinyl_pixel,
)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# name: (back wall, side wall, skirting accent, floor painter)
SHEETS = {
    "room_aw_brightwell": ((232, 226, 212), (214, 207, 192), hexrgb("#2f6f5e"), CARPET_CHARCOAL),
    "room_aw_tarrowby": ((218, 220, 222), (198, 201, 205), hexrgb("#3b5b8c"), vinyl_pixel),
    "room_aw_quayholt": ((234, 238, 242), (212, 218, 226), hexrgb("#6b4c9a"), CARPET_BLUE),
    "room_aw_merrin_sallow": ((216, 206, 190), (196, 185, 168), hexrgb("#8a5a2b"), concrete_pixel),
}


def walls(back, side, skirting):
    """room6 raised to the standard, repainted with this company's wall colours and
    skirting (rows FLOOR_TOP-5..-4 the accent, FLOOR_TOP-3 a darker shade of it)."""
    src = Image.open(SRC).convert("RGBA")
    src = raise_back_wall(src, sheet_floor_top(SRC))
    out = src.copy()
    sp, op = src.load(), out.load()
    back_grey = sp[160, 40][:3]
    side_grey = sp[20, 200][:3]
    dark = shade(skirting, 0.65)
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if is_floor(x, y):
                continue
            if (r, g, b) == back_grey:
                c = back
                if y in (FLOOR_TOP - 5, FLOOR_TOP - 4):
                    c = skirting
                elif y == FLOOR_TOP - 3:
                    c = dark
                op[x, y] = (*c, a)
            elif (r, g, b) == side_grey:
                op[x, y] = (*side, a)
    return out


def main():
    for name, (back, side, skirting, floor) in SHEETS.items():
        img = paint_floor(walls(back, side, skirting), floor)
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
