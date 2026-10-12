#!/usr/bin/env python3
"""
Build the Zero Day Syndicate room sheets (tiles/rooms/room_zds*.png) for m03
"Ghost in the Machine": repaints of room6.png for the room_zds_* maps in
generate_rooms.py, made the same way as make_uni_tileset.py.

Zero Day trades as "WhiteHat Security Services", a polished consultancy front.
The front-of-house rooms share one wall treatment (cool white walls, a graphite
skirting with a thin cyan brand line); the server room, which is the real
business, has dark slate walls. The floors tell the rooms apart:

  room_zds_lobby    pale polished stone in 2x2-tile slabs, a cyan and graphite
                    ring with the firm's hat mark at the spawn point, and a walnut
                    slat feature wall behind the front desk
  room_zds_carpet   slate-blue carpet tiles (consultants' office)
  room_zds_boardroom  the same carpet with a charcoal rug, cyan inner line, under the
                    boardroom table (conference room)
  room_zds_hall     the lobby's stone floor for the corridors (no inlay in the rows a hall uses)
  room_zds_exec     walnut parquet (chevron) with a navy and gold rug under the
                    CEO's desk and visitor chairs
  room_zds_raised   dark raised access floor, perforated cold-aisle row, slate walls

Every sheet keeps room6's tile layout, so a map points its room6 tileset at one
of these images and keeps ROOM6_FIRSTGID. The north wall is raised to the
2-tile standard first, so every sheet has its floor from y=64. A 10x10 room
lays the 320px sheet out cell for cell, so decals land at the same room pixels.
Each sheet needs a this.load.image line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_zds_tileset.py
"""

import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, raise_back_wall, sheet_floor_top  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402
from make_uni_tileset import carpet_pixel_fn, hashxy, shade, paint_floor  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/break_escape/assets/tiles/rooms/room6.png"
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32

FRONT_WALLS = dict(back=(222, 226, 231), side=(201, 206, 213),
                   brand=(38, 168, 190), skirting=(56, 62, 72), skirting_dark=(36, 40, 48))
SERVER_WALLS = dict(back=(86, 102, 132), side=(72, 86, 112),
                    brand=(38, 168, 190), skirting=(40, 52, 76), skirting_dark=(26, 34, 52))


def base_walls(w):
    """room6 raised to the 2-tile standard, with the given wall colours."""
    src = Image.open(SRC).convert("RGBA")
    src = raise_back_wall(src, sheet_floor_top(SRC))
    out = src.copy()
    sp, op = src.load(), out.load()
    back_wall_grey = sp[160, 40][:3]
    side_wall_grey = sp[20, 200][:3]
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if is_floor(x, y):
                continue
            if (r, g, b) == back_wall_grey:
                c = w["back"]
                if y == FLOOR_TOP - 6:
                    c = w["brand"]
                elif y in (FLOOR_TOP - 5, FLOOR_TOP - 4):
                    c = w["skirting"]
                elif y == FLOOR_TOP - 3:
                    c = w["skirting_dark"]
                op[x, y] = (*c, a)
            elif (r, g, b) == side_wall_grey:
                op[x, y] = (*w["side"], a)
    return out


# --- floors -------------------------------------------------------------------

def stone_pixel(x, y):
    """Pale polished stone: 64px slabs with a fine grout line, soft diagonal veins."""
    if x % (2 * TILE) == 0 or y % (2 * TILE) == 0:
        return (178, 183, 190)
    slab = hashxy(x // 64, y // 64) % 3
    base = [(214, 217, 222), (209, 212, 218), (218, 220, 224)][slab]
    # a faint vein running diagonally across each slab
    v = (x * 3 + y * 2 + hashxy(x // 64, y // 64) % 50) % 61
    if v == 0:
        return shade(base, 0.9)
    h = hashxy(x, y)
    if h % 37 == 0:
        return shade(base, 0.95)
    if h % 13 == 0:
        return shade(base, 1.03)
    return base


CARPET_SLATE = carpet_pixel_fn((66, 86, 124), (58, 77, 112), (80, 100, 138), (52, 70, 104))


def parquet_pixel(x, y):
    """Walnut chevron parquet: 8px bands, planks cut on the diagonal, dark joints."""
    band = x // 8
    lx = x % 8
    if lx == 0:
        return (80, 46, 22)
    s = lx if band % 2 == 0 else 7 - lx
    k = (y + s) // 12
    if (y + s) % 12 == 0:
        return (88, 52, 26)
    tone = hashxy(band, k) % 4
    base = [(122, 80, 52), (112, 72, 46), (130, 86, 56), (104, 67, 43)][tone]
    h = hashxy(x, y)
    if h % 17 == 0:
        return shade(base, 0.9)
    if h % 23 == 0:
        return shade(base, 1.08)
    return base


RAISED = (118, 126, 138)
RAISED_HI = (140, 148, 160)
RAISED_SH = (100, 107, 118)
RAISED_SEAM = (60, 74, 102)
RAISED_HOLE = (78, 86, 98)
PERFORATED_ROWS = {3, 6}  # cold aisles in front of each rack row


def raised_pixel(x, y):
    tx, ty = x // TILE, y // TILE
    lx, ly = x % TILE, y % TILE
    if lx == 0 or ly == 0:
        return RAISED_SEAM
    if lx == 1 or ly == 1:
        return RAISED_HI
    if lx == TILE - 1 or ly == TILE - 1:
        return RAISED_SH
    if ty in PERFORATED_ROWS and 1 <= tx <= 8 and 5 <= lx <= 27 and 5 <= ly <= 27:
        if (lx - 5) % 3 == 0 and (ly - 5) % 3 == 0:
            return RAISED_HOLE
    if hashxy(x, y) % 41 == 0:
        return RAISED_SH
    return RAISED


# --- decals -------------------------------------------------------------------

CYAN = (38, 168, 190)
CYAN_DARK = (22, 110, 126)
GRAPHITE = (52, 58, 68)

# the firm's mark: a fedora seen side-on, 17 x 9
HAT_GLYPH = [
    ".......#####.....",
    "......#######....",
    ".....#########...",
    ".....#########...",
    ".....#########...",
    "....###########..",
    "#################",
    ".###############.",
    "...###########...",
]


def paint_inlay(op, cx, cy, r):
    """A graphite ring with a cyan inner line, the hat mark in the middle."""
    for y in range(cy - r - 3, cy + r + 4):
        for x in range(cx - r - 3, cx + r + 4):
            d = math.hypot(x - cx + 0.5, y - cy + 0.5)
            if r - 1.0 <= d < r + 1.5:
                op[x, y] = (*GRAPHITE, 255)
            elif r - 2.5 <= d < r - 1.0:
                op[x, y] = (*CYAN, 255)
    gh, gw = len(HAT_GLYPH), len(HAT_GLYPH[0])
    x0, y0 = cx - gw // 2, cy - gh // 2
    for j, row in enumerate(HAT_GLYPH):
        for i, ch in enumerate(row):
            if ch == "#":
                op[x0 + i, y0 + j] = (*GRAPHITE, 255)
    # a cyan hat band
    for i in range(5, 14):
        op[x0 + i, y0 + 4] = (*CYAN, 255)


def paint_rug(op, box):
    """Navy rug with a gold border and a thin inner line, a faint diamond lattice."""
    x0, y0, x1, y1 = box
    edge, gold, gold_dark = (24, 26, 40), (196, 160, 80), (150, 116, 52)
    navy, navy_light = (34, 44, 74), (46, 58, 92)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d == 0:
                c = edge
            elif d in (1, 2):
                c = gold if d == 1 else gold_dark
            elif d in (7,):
                c = gold
            else:
                lx, ly = x - x0, y - y0
                c = navy_light if ((lx + ly) % 14 == 0 or (lx - ly) % 14 == 0) else navy
                if hashxy(x, y) % 53 == 0:
                    c = navy_light
            op[x, y] = (*c, 255)


def paint_slat_wall(op, x0, x1, y0=12, y1=FLOOR_TOP - 6):
    """Walnut slats on the back wall: 4px boards, a darker groove between them.
    Every colour keeps some chroma, so check_room_walls never reads a groove as
    the floor line."""
    boards = [(110, 70, 44), (98, 62, 38), (118, 76, 48)]
    groove = (62, 38, 22)
    for y in range(y0, y1):
        for x in range(x0, x1):
            if x in (x0, x1 - 1):
                c = (52, 32, 18)
            elif (x - x0) % 5 == 0:
                c = groove
            else:
                c = boards[((x - x0) // 5) % 3]
                if y == y0:
                    c = shade(c, 1.15)
            op[x, y] = (*c, 255)


def paint_rug_modern(op, box):
    """Charcoal-blue rug, a thin cyan line inset from a dark edge."""
    x0, y0, x1, y1 = box
    edge, field, field2 = (30, 36, 48), (52, 60, 78), (56, 65, 84)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d <= 1:
                c = edge
            elif d == 5:
                c = CYAN_DARK
            else:
                c = field2 if hashxy(x, y) % 7 == 0 else field
            op[x, y] = (*c, 255)


def main():
    front = base_walls(FRONT_WALLS)
    server = base_walls(SERVER_WALLS)
    sheets = {}

    lobby = paint_floor(front, stone_pixel)
    sheets["room_zds_hall"] = lobby.copy()  # before the decals: halls use rows 0-4 and 9
    paint_inlay(lobby.load(), 160, 200, 22)
    paint_slat_wall(lobby.load(), 98, 222)   # behind the front desk (room_zds_reception)
    sheets["room_zds_lobby"] = lobby

    sheets["room_zds_carpet"] = paint_floor(front, CARPET_SLATE)
    board = paint_floor(front, CARPET_SLATE)
    paint_rug_modern(board.load(), (52, 200, 214, 300))  # under the table and chairs (room_zds_conference)
    sheets["room_zds_boardroom"] = board

    exec_ = paint_floor(front, parquet_pixel)
    # under the CEO's desk and the visitor chairs (room_zds_ceo)
    paint_rug(exec_.load(), (92, 100, 228, 214))
    sheets["room_zds_exec"] = exec_

    sheets["room_zds_raised"] = paint_floor(server, raised_pixel)

    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
