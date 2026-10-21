#!/usr/bin/env python3
"""
Build the m09 "Digital Archaeology" room sheets (tiles/rooms/room_m09_*.png):
repaints of room6.png for the room_m09_* maps (builders in room_gen/m09_rooms.py),
made the same way as make_hq_tileset.py (whose helpers it imports; no other
mission's sheet is touched).

Mountain States Records & Retention: a grain warehouse on the edge of Helena,
converted to a records store forty years ago, at night. Old red brick in the
warehouse rooms, cream plaster in the front office, library green in the reading
room, walnut panelling in the director's office. One house colour, a faded
records-green line, along every wall.

  room_m09_dock        brick; asphalt yard, yellow bay lines, a hatched apron at
                       the shutter (NW), oil stains
  room_m09_front       cream plaster; worn two-tone lino tiles
  room_m09_stacks      brick (640 px, two halves); sealed concrete, yellow aisle
                       lines between the shelving rows, door wear
  room_m09_closet      grey painted blockwork; anti-static tiles
  room_m09_passage     cream plaster; lino with a worn runner
  room_m09_reading     library green, a brass line; oak parquet, a red rug
  room_m09_restricted  brick; concrete, the sealed strip behind the hatch darker,
                       a hatched line along the counter
  room_m09_cage        painted blockwork; concrete, a hatched box at the shredder
  room_m09_office      walnut panelling along the back; brown carpet, a worn rug
  room_m09_tape        blue-grey blockwork; cold vinyl tiles
  room_m09_salvage     dark brick; stained concrete

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID). Decal boxes must match the
furniture in m09_rooms.py. Each sheet needs a this.load.image line in game.js.

Usage: python3 scripts/room_gen/make_m09_tileset.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402
from make_aes_tileset import (base_walls, paint_floor, paint_hatch_border, paint_line,  # noqa: E402
                              paint_wear, paint_grate, antistatic_pixel, concrete_pixel,
                              split_wide, floor_at)
from make_hce_tileset import paint_rug  # noqa: E402
from make_zds_tileset import paint_slat_wall  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

MS_GREEN = (70, 124, 88)          # the house line
MS_GREEN_LIGHT = (110, 160, 122)
BRASS = (176, 150, 80)
YELLOW = (222, 186, 40)
BLACK = (40, 36, 30)

BRICK_WALLS = dict(back=(134, 72, 54), side=(118, 64, 50), mortar=(162, 136, 116),
                   brand=MS_GREEN, skirting=(70, 44, 36), skirting_dark=(52, 34, 28))
BRICK_DARK_WALLS = dict(back=(106, 58, 46), side=(94, 52, 42), mortar=(128, 106, 92),
                        brand=MS_GREEN, skirting=(58, 38, 32), skirting_dark=(44, 30, 26))
PLASTER_WALLS = dict(back=(208, 198, 170), side=(192, 182, 154), mortar=None,
                     brand=MS_GREEN, skirting=(104, 88, 66), skirting_dark=(80, 66, 48))
READING_WALLS = dict(back=(98, 132, 104), side=(104, 138, 110), mortar=None,
                     brand=BRASS, skirting=(70, 48, 32), skirting_dark=(52, 36, 24))
OFFICE_WALLS = dict(back=(150, 126, 100), side=(138, 116, 92), mortar=None,
                    brand=MS_GREEN, skirting=(70, 50, 34), skirting_dark=(52, 36, 24))
BLOCK_GREY_WALLS = dict(back=(150, 154, 148), side=(138, 142, 136), mortar=(128, 132, 126),
                        brand=MS_GREEN, skirting=(80, 84, 78), skirting_dark=(60, 64, 58))
BLOCK_GREEN_WALLS = dict(back=(132, 146, 128), side=(120, 134, 116), mortar=(112, 126, 108),
                         brand=MS_GREEN, skirting=(72, 82, 68), skirting_dark=(54, 62, 50))
TAPE_WALLS = dict(back=(80, 94, 116), side=(90, 104, 126), mortar=(68, 80, 100),
                  brand=MS_GREEN_LIGHT, skirting=(46, 54, 70), skirting_dark=(34, 40, 54))


# --- floor textures -----------------------------------------------------------

def asphalt_pixel(x, y):
    """Night-yard asphalt: warm dark grey aggregate (kept off near-black and with some
    chroma, so check_room_walls never reads a floor row as the floor line)."""
    h = hashxy(x, y)
    base = (122, 110, 96)
    if h % 7 == 0:
        return (108, 98, 86)
    if h % 13 == 0:
        return (138, 126, 112)
    if h % 61 == 0:
        return (156, 146, 130)
    return base


def lino_pixel(x, y):
    """Old two-tone lino tiles, 32 px, beige and tan in a checker, flecked, scuffed."""
    lx, ly = x % 32, y % 32
    if lx == 0 or ly == 0:
        return (138, 122, 96)
    light = ((x // 32) + (y // 32)) % 2 == 0
    base = (190, 174, 140) if light else (168, 148, 112)
    h = hashxy(x, y)
    if h % 11 == 0:
        return shade(base, 0.92)
    if h % 43 == 0:
        return shade(base, 1.06)
    return base


def runner_pixel(x, y):
    """A worn green-grey corridor runner."""
    h = hashxy(x, y)
    base = (98, 112, 96)
    if h % 5 == 0:
        return (88, 102, 86)
    if h % 17 == 0:
        return (112, 126, 108)
    return base


def oak_pixel(x, y):
    """Honey oak strip parquet, 8 px boards, staggered joints."""
    row = y // 8
    if y % 8 == 0:
        return (110, 74, 40)
    off = (row * 23) % 48
    if (x + off) % 48 == 0:
        return (116, 78, 44)
    tone = hashxy((x + off) // 48, row) % 3
    base = [(170, 120, 70), (160, 112, 64), (178, 128, 76)][tone]
    h = hashxy(x, y)
    if h % 19 == 0:
        return shade(base, 0.92)
    return base


def stained_concrete_pixel(x, y):
    c = concrete_pixel(x, y)
    return shade(c, 0.9)


def dark_concrete_pixel(x, y):
    return shade(concrete_pixel(x, y), 0.78)


def tape_tile_pixel(x, y):
    r, g, b = antistatic_pixel(x, y)
    return (max(0, r - 34), max(0, g - 28), max(0, b - 14))


CARPET_BROWN = carpet_pixel_fn((126, 96, 72), (114, 86, 64), (138, 106, 80), (120, 92, 70))


# --- decals -------------------------------------------------------------------

def paint_box_fn(op, box, fn, width=320):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if floor_at(x, y, width):
                op[x, y] = (*fn(x, y), 255)


def paint_stain(op, cx, cy, rx, ry, f=0.8, width=320):
    """An oil stain: a soft dark blot."""
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if not floor_at(x, y, width):
                continue
            k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if k < 1 and hashxy(x * 3 + 1, y * 5 + 2) % (2 if k < 0.4 else 4) == 0:
                r, g, b, a = op[x, y]
                op[x, y] = (*shade((r, g, b), f), a)


# --- sheets ---------------------------------------------------------------------

def dock_sheet():
    img = paint_floor(base_walls(BRICK_WALLS), asphalt_pixel, shadow=0.97)
    op = img.load()
    paint_hatch_border(op, (32, 70, 100, 108), width_px=4, colours=(YELLOW, BLACK))   # the shutter apron, NW
    paint_line(op, 140, 64, 142, 220)                 # bay lines off the wall
    paint_line(op, 220, 64, 222, 220)
    paint_line(op, 32, 236, 288, 238, c=(196, 196, 186))   # the yard's white kerb line
    paint_stain(op, 180, 150, 16, 9)
    paint_stain(op, 112, 260, 12, 7)
    paint_wear(op, (32, 64, 96, 120))                 # the office door, W
    paint_grate(op, 250, 280)
    return img


def front_sheet():
    img = paint_floor(base_walls(PLASTER_WALLS), lino_pixel, shadow=0.93)
    op = img.load()
    paint_wear(op, (232, 64, 288, 120))               # from the dock door, E
    paint_wear(op, (32, 64, 80, 110))                 # to the staff door, N
    return img


def stacks_sheet():
    walls = base_walls(BRICK_WALLS, width=640)
    img = paint_floor(walls, concrete_pixel, width=640, shadow=0.92)
    op = img.load()
    # aisle lines along the front of each shelving row (m09_rooms.room_m09_stacks)
    for y in (102, 212):
        paint_line(op, 96, y, 600, y + 2, width=640)
    paint_line(op, 92, 64, 94, 236, width=640)         # the crossing's edge, west end
    paint_wear(op, (32, 64, 92, 120), width=640)      # W door (reading room)
    paint_wear(op, (548, 64, 608, 120), width=640)    # E door (closet)
    paint_wear(op, (32, 200, 92, 256), width=640)     # S door (the shutter)
    paint_wear(op, (96, 236, 600, 300), width=640, strength=0.94)   # the guard's round
    for x, y in ((300, 284), (520, 284)):
        paint_grate(op, x, y, width=640)
    return img


def closet_sheet():
    img = paint_floor(base_walls(BLOCK_GREY_WALLS), antistatic_pixel)
    return img


def passage_sheet():
    img = paint_floor(base_walls(PLASTER_WALLS), lino_pixel, shadow=0.93)
    paint_box_fn(img.load(), (32, 74, 288, 116), runner_pixel)
    return img


def reading_sheet():
    img = paint_floor(base_walls(READING_WALLS), oak_pixel, shadow=0.9)
    paint_rug(img.load(), (88, 98, 160, 128), (128, 40, 40), (70, 26, 26), (196, 160, 80))
    return img


def restricted_sheet():
    img = paint_floor(base_walls(BRICK_WALLS), concrete_pixel, shadow=0.9)
    op = img.load()
    paint_box_fn(op, (240, 124, 288, 228), dark_concrete_pixel)    # her strip behind the counter
    paint_hatch_border(op, (212, 124, 226, 230), width_px=3, colours=(YELLOW, BLACK))  # stand-back line at the hatch
    paint_wear(op, (32, 64, 96, 120))                 # W door (office)
    paint_wear(op, (150, 64, 224, 118))               # in front of the gate
    return img


def cage_sheet():
    img = paint_floor(base_walls(BLOCK_GREEN_WALLS), concrete_pixel, shadow=0.92)
    op = img.load()
    paint_hatch_border(op, (158, 128, 236, 166), width_px=3, colours=(YELLOW, BLACK))  # round the shredder line
    paint_wear(op, (32, 64, 100, 120))
    return img


def office_sheet():
    walls = base_walls(OFFICE_WALLS)
    paint_slat_wall(walls.load(), 12, 308)
    img = paint_floor(walls, CARPET_BROWN, shadow=0.93)
    paint_rug(img.load(), (100, 150, 230, 236), (110, 44, 40), (60, 30, 26), (190, 150, 90))
    return img


def tape_sheet():
    return paint_floor(base_walls(TAPE_WALLS), tape_tile_pixel, shadow=0.9)


def salvage_sheet():
    img = paint_floor(base_walls(BRICK_DARK_WALLS), stained_concrete_pixel, shadow=0.9)
    op = img.load()
    paint_stain(op, 200, 110, 18, 8)
    paint_stain(op, 120, 120, 10, 5)
    return img


def main():
    sheets = {
        "room_m09_dock": dock_sheet(),
        "room_m09_front": front_sheet(),
        "room_m09_closet": closet_sheet(),
        "room_m09_passage": passage_sheet(),
        "room_m09_reading": reading_sheet(),
        "room_m09_restricted": restricted_sheet(),
        "room_m09_cage": cage_sheet(),
        "room_m09_office": office_sheet(),
        "room_m09_tape": tape_sheet(),
        "room_m09_salvage": salvage_sheet(),
    }
    west, east = split_wide(stacks_sheet())
    sheets["room_m09_stacks_w"] = west
    sheets["room_m09_stacks_e"] = east
    for name, img in sheets.items():
        img.save(OUT_DIR / f"{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
