#!/usr/bin/env python3
"""
Build the Tarnside Assurance room sheets (tiles/rooms/room_se_*.png) for the
social-engineering lab (scenarios/lab_social_engineering): repaints of room6.png
for the four lab maps (room_se_engagement, _recon, _ops, _blueteam), made the
same way as make_zds_tileset.py.

All four rooms are on Tarnside's floor, so they share one wall treatment: the
zds cool white walls and graphite skirting, with a thin brand line in the teal
of the room plates and the TARNSIDE ASSURANCE logo (46, 168, 160). The floors
tell the rooms apart:

  room_se_boardroom  slate-blue carpet with the charcoal rug under the meeting
                     table (Engagement Office; the rug is make_zds_tileset's)
  room_se_carpet     plain slate-blue carpet tiles (Recon Room and Operations
                     Room; no kilim, no aisle)
  room_se_charcoal   the warm charcoal carpet tiles of make_aes_tileset's
                     security office (Blue Team Room)

Every sheet keeps room6's tile layout, so a map points its room6-layout tileset
at one of these images and keeps its firstgid. The north wall is raised to the
2-tile standard first, so every sheet has its floor from y=64. Each sheet needs
a this.load.image line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_se_tileset.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, sheet_floor_top  # noqa: E402
from make_uni_tileset import paint_floor  # noqa: E402
from make_zds_tileset import CARPET_SLATE, FRONT_WALLS, base_walls, paint_rug_modern  # noqa: E402
from make_aes_tileset import CARPET_CHARCOAL  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

TARNSIDE_TEAL = (46, 168, 160)  # the plates' and logo's teal rim
SE_WALLS = dict(FRONT_WALLS, brand=TARNSIDE_TEAL)


def main():
    walls = base_walls(SE_WALLS)
    sheets = {}

    board = paint_floor(walls, CARPET_SLATE)
    paint_rug_modern(board.load(), (52, 200, 214, 300))  # under the meeting table (room_se_engagement)
    sheets["room_se_boardroom"] = board
    sheets["room_se_carpet"] = paint_floor(walls, CARPET_SLATE)
    sheets["room_se_charcoal"] = paint_floor(walls, CARPET_CHARCOAL)

    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
