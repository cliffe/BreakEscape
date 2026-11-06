#!/usr/bin/env python3
"""
Build the university room sheets (tiles/rooms/room_uni*.png): repaints of
room6.png for the campus maps (room_uni_* in generate_rooms.py), written the way
make_hospital_tileset.py makes the hospital sheets.

Every sheet keeps room6's tile layout, so a map points its room6 tileset at one
of these images and keeps ROOM6_FIRSTGID (701). The north wall is raised to the
2-tile standard first (room_geometry.raise_back_wall), so every sheet has the
floor from y=64 by construction.

One wall treatment for the whole building (warm off-white walls with a deep
teal skirting), so the rooms read as one place; the floors tell them apart:

  room_uni           blue-grey sheet vinyl with flecks (corridor)
  room_uni_carpet    charcoal-blue carpet tiles, quarter-turned (lab, offices, seminar room)
  room_uni_foyer     cream terrazzo, a brass ring with an "M" under the spawn point
  room_uni_lecture   blue carpet, a grey vinyl strip at the front, tier nosings
  room_uni_common    warm carpet, a safety-vinyl patch under the kitchenette
  room_uni_library   deep green carpet
  room_uni_special   oxblood carpet with a rug under the reading table
  room_uni_workshop  sealed grey concrete, a hazard line round the bench zone

A 10x10 room lays the 320px sheet out cell for cell, so a decal painted here
lands at the same room pixels and draws under every sprite. Each sheet also
needs a this.load.image line in game.js (the tileset name is the texture key).

The carpet painter is copied from make_hospital_tileset.py with the palette as a
parameter (that script's painters use module-level hospital colours).

Usage: python3 scripts/room_gen/make_uni_tileset.py
"""

import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, raise_back_wall, sheet_floor_top  # noqa: E402
from make_hospital_tileset import FLOOR_BOX, is_floor  # noqa: E402,F401

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/break_escape/assets/tiles/rooms/room6.png"
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32

# Walls (ROOMS_PLAN.md Q5: warm off-white with a "Miskatonic teal" skirting)
BACK_WALL = (232, 226, 212)
SIDE_WALL = (214, 207, 192)
SKIRTING = (38, 98, 108)
SKIRTING_DARK = (24, 66, 74)


def hashxy(x, y):
    return (x * 73856093) ^ (y * 19349663)


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


# --- floors -----------------------------------------------------------------

def vinyl_pixel(x, y):
    """Blue-grey sheet vinyl: no grout, dark and light flecks, a welded seam every 2 tiles."""
    base, light, fleck, fleck2, seam = (150, 160, 172), (160, 170, 181), (112, 121, 134), (196, 202, 208), (134, 144, 156)
    if x % (2 * TILE) == 0:
        return seam
    h = hashxy(x, y)
    if h % 29 == 0:
        return fleck
    if h % 43 == 0:
        return fleck2
    if h % 9 == 0:
        return light
    return base


def carpet_pixel_fn(base, dark, light, seam):
    """Carpet tiles with a woven grain, laid quarter-turned (as make_hospital_tileset)."""
    def fn(x, y):
        tx, ty = x // TILE, y // TILE
        lx, ly = x % TILE, y % TILE
        if lx == 0 or ly == 0:
            return seam
        h = hashxy(x, y)
        along = ly if (tx + ty) % 2 == 0 else lx
        across = lx if (tx + ty) % 2 == 0 else ly
        c = dark if (along % 3 == 0 and (across + along) % 4 != 0) else base
        if h % 23 == 0:
            c = light
        elif h % 29 == 0:
            c = dark
        return c
    return fn


# Dark floors keep some colour: check_room_walls reads a dark, near-neutral row as
# the floor line, so a grey charcoal would hide where the floor starts.
CARPET_CHARCOAL = carpet_pixel_fn((70, 86, 118), (62, 77, 106), (84, 100, 132), (56, 70, 98))
CARPET_BLUE = carpet_pixel_fn((58, 82, 128), (50, 71, 113), (72, 96, 142), (44, 62, 100))
CARPET_WARM = carpet_pixel_fn((150, 104, 82), (135, 92, 72), (165, 118, 95), (122, 84, 66))
CARPET_GREEN = carpet_pixel_fn((44, 96, 68), (38, 84, 59), (58, 110, 82), (30, 74, 50))
CARPET_OXBLOOD = carpet_pixel_fn((112, 44, 50), (98, 37, 43), (128, 56, 62), (86, 32, 38))


def terrazzo_pixel(x, y):
    """Cream terrazzo: sparse, low-contrast chips (so floor items and the inlay
    read at game scale), brass strips every 2 tiles."""
    if x % (2 * TILE) == 0 or y % (2 * TILE) == 0:
        return (190, 168, 116)  # brass divider strip
    h = hashxy(x, y)
    if h % 23 == 0:
        return (198, 190, 172)   # grey chip
    if h % 61 == 0:
        return (176, 190, 182)   # teal chip
    if h % 67 == 0:
        return (210, 184, 164)   # rust chip
    if h % 97 == 0:
        return (176, 168, 152)   # dark chip
    if h % 9 == 0:
        return (220, 213, 195)
    return (214, 206, 186)


def concrete_pixel(x, y):
    """Sealed grey concrete: soft mottling, a saw-cut joint every 2 tiles."""
    if x % (2 * TILE) == 0 or y % (2 * TILE) == 0:
        return (118, 120, 122)
    h = hashxy(x, y)
    # low-frequency mottle from the 8px block the pixel sits in
    m = hashxy(x // 8, y // 8) % 3
    base = [(150, 152, 153), (156, 158, 158), (145, 147, 149)][m]
    if h % 19 == 0:
        return shade(base, 0.9)
    if h % 41 == 0:
        return shade(base, 1.08)
    return base


def kitchen_vinyl_pixel(x, y):
    """Oatmeal safety vinyl (as the hospital kitchen sheet)."""
    if x % (2 * TILE) == 0:
        return (184, 172, 151)
    h = hashxy(x, y)
    if h % 31 == 0:
        return (163, 147, 126)
    if h % 53 == 0:
        return (126, 150, 158)
    if h % 11 == 0:
        return (218, 208, 189)
    return (208, 197, 176)


def grey_vinyl_pixel(x, y):
    """Plain grey vinyl for the front of the lecture theatre."""
    h = hashxy(x, y)
    if h % 27 == 0:
        return (128, 132, 138)
    if h % 11 == 0:
        return (168, 172, 176)
    return (156, 160, 165)


# --- decals -------------------------------------------------------------------

BRASS = (196, 160, 80)
BRASS_DARK = (138, 106, 46)

# "M" glyph, 15 rows x 15 columns, drawn in brass inside the ring
M_GLYPH = [
    "##...........##",
    "###.........###",
    "####.......####",
    "##.##.....##.##",
    "##..##...##..##",
    "##...##.##...##",
    "##....###....##",
    "##.....#.....##",
    "##...........##",
    "##...........##",
    "##...........##",
    "##...........##",
    "##...........##",
    "##...........##",
    "##...........##",
]


def paint_inlay(op, cx, cy, r):
    """A brass ring (2px, with a dark outer line) and an "M", centred on (cx, cy)."""
    for y in range(cy - r - 2, cy + r + 3):
        for x in range(cx - r - 2, cx + r + 3):
            d = math.hypot(x - cx + 0.5, y - cy + 0.5)
            if r - 1.0 <= d < r + 1.0:
                op[x, y] = (*BRASS, 255)
            elif r + 1.0 <= d < r + 2.0 or r - 2.0 <= d < r - 1.0:
                op[x, y] = (*BRASS_DARK, 255)
    gh, gw = len(M_GLYPH), len(M_GLYPH[0])
    x0, y0 = cx - gw // 2, cy - gh // 2
    for j, row in enumerate(M_GLYPH):
        for i, ch in enumerate(row):
            if ch == "#":
                op[x0 + i, y0 + j] = (*BRASS, 255)
                # 1px shadow below-right where the next pixel is floor
                if j + 1 < gh and M_GLYPH[j + 1][i] != "#":
                    op[x0 + i, y0 + j + 1] = (*BRASS_DARK, 255)


def paint_rug(op, box):
    """Rug as make_hospital_tileset's make_exec: navy field, burgundy border, lattice."""
    x0, y0, x1, y1 = box
    edge, cream, red, red_dark = (40, 30, 38), (214, 200, 168), (122, 38, 46), (100, 30, 38)
    navy, navy_light = (40, 52, 84), (58, 72, 108)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d == 0:
                c = edge
            elif d in (1, 10):
                c = cream
            elif 2 <= d <= 9:
                horiz = min(y - y0, y1 - 1 - y) == d
                along = (x - x0) if horiz else (y - y0)
                c = cream if (d == 5 and along % 6 < 2) else (red_dark if d in (2, 9) else red)
            elif d == 11:
                c = red
            else:
                lx, ly = x - x0 - 12, y - y0 - 12
                if (lx + ly) % 12 == 0 or (lx - ly) % 12 == 0:
                    c = navy_light
                else:
                    c = navy_light if hashxy(x, y) % 47 == 0 else navy
            op[x, y] = (*c, 255)


def paint_hazard_border(op, box, width=2):
    """Yellow and black diagonal hazard line round a box (x0, y0, x1, y1 exclusive)."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d < width:
                op[x, y] = (*((232, 196, 40) if ((x + y) // 4) % 2 == 0 else (36, 34, 30)), 255)


def paint_nosings(op, ys):
    """Lecture tiers: a 2px light line with a 1px shadow under it, full floor width."""
    x0, _, x1, _ = FLOOR_BOX
    for y in ys:
        for x in range(x0, x1):
            op[x, y] = (*(170, 180, 196), 255)
            op[x, y + 1] = (*(150, 160, 178), 255)
            op[x, y + 2] = (*(36, 50, 80), 255)


# --- sheets -------------------------------------------------------------------

def base_walls():
    """room6 raised to the 2-tile standard, with the university wall colours."""
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
                c = BACK_WALL
                if y in (FLOOR_TOP - 5, FLOOR_TOP - 4):
                    c = SKIRTING
                elif y == FLOOR_TOP - 3:
                    c = SKIRTING_DARK
                op[x, y] = (*c, a)
            elif (r, g, b) == side_wall_grey:
                op[x, y] = (*SIDE_WALL, a)
    return out


def paint_floor(img, fn, shadow=0.9):
    out = img.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if is_floor(x, y):
                c = fn(x, y)
                if y < FLOOR_TOP + 3:  # soft shadow along the foot of the back wall
                    c = shade(c, shadow)
                op[x, y] = (*c, op[x, y][3])
    return out


def paint_region(img, fn, box):
    op = img.load()
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if is_floor(x, y):
                c = fn(x, y)
                if y < FLOOR_TOP + 3:
                    c = shade(c, 0.9)
                op[x, y] = (*c, op[x, y][3])


def lecture_pixel(x, y):
    return grey_vinyl_pixel(x, y) if y < 128 else CARPET_BLUE(x, y)


def main():
    walls = base_walls()
    sheets = {}
    sheets["room_uni"] = paint_floor(walls, vinyl_pixel)
    sheets["room_uni_carpet"] = paint_floor(walls, CARPET_CHARCOAL)

    foyer = paint_floor(walls, terrazzo_pixel)
    paint_inlay(foyer.load(), 160, 176, 26)
    sheets["room_uni_foyer"] = foyer

    lecture = paint_floor(walls, lecture_pixel)
    paint_nosings(lecture.load(), [128, 160, 192, 224, 256, 288])
    sheets["room_uni_lecture"] = lecture

    common = paint_floor(walls, CARPET_WARM)
    paint_region(common, kitchen_vinyl_pixel, (224, 64, 288, 128))
    sheets["room_uni_common"] = common

    sheets["room_uni_library"] = paint_floor(walls, CARPET_GREEN)

    special = paint_floor(walls, CARPET_OXBLOOD)
    # under the reading table (room_uni_special: table x 96-222), clear of the west-wall cabinet
    paint_rug(special.load(), (88, 140, 230, 214))
    sheets["room_uni_special"] = special

    workshop = paint_floor(walls, concrete_pixel)
    paint_hazard_border(workshop.load(), (116, 132, 192, 206))
    sheets["room_uni_workshop"] = workshop

    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
