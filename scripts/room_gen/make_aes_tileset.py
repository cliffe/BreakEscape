#!/usr/bin/env python3
"""
Build the Albion Energy Storage room sheets (tiles/rooms/room_aes*.png) for m04
"Critical Failure": repaints of room6.png for the room_aes_* maps in
generate_rooms.py, made the same way as make_zds_tileset.py.

Albion Energy Storage is a 200 MWh grid battery site on a night shift. Two wall
treatments:

  office walls      cream paint, a green Albion brand line over a grey skirting
                    (reception, operations office, security office, control room)
  industrial walls  grey painted blockwork with mortar courses and a yellow
                    safety band over a dark skirting (battery halls, workshop,
                    plant room, loading dock)

Floors tell the rooms apart:

  room_aes_lobby      pale terrazzo, an Albion bolt inlay at the spawn, a dark
                      entrance mat by the south door's lane
  room_aes_carpet     blue-grey carpet tiles (operations office)
  room_aes_security   charcoal carpet tiles (security office)
  room_aes_control    anti-static vinyl tiles (SCADA control room)
  room_aes_workshop   sealed concrete with a hazard line round the test bench
  room_aes_plant      green epoxy with yellow walkway lines, a red-hatched
                      keep-clear box in front of the ESD and the switchgear
  room_aes_dock       concrete, yellow bay lines, hazard stripes at the shutter
  room_aes_hall1_w/_e grey epoxy, a yellow walkway line along the door row,
                      hatched keep-clear borders round the rack rows and the
                      north-south aisle Cipher patrols (two halves of one 20x10
                      sheet: the map points its room6 tileset at _w and its
                      room18 tileset at _e)
  room_aes_hall2_w/_e the same for Hall 2: rack banks A and B and the inverter row

Every 10x10 sheet keeps room6's tile layout (ROOM6_FIRSTGID). The 20-wide hall
sheets are built from room6's COLS_20 column map, painted as one 640x320 image,
then cut into two 320x320 halves. The north wall is raised to the 2-tile
standard first, so every sheet has its floor from y=64. Each sheet needs a
this.load.image line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_aes_tileset.py
"""

import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, raise_back_wall, sheet_floor_top  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/break_escape/assets/tiles/rooms/room6.png"
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32
COLS_20 = list(range(9)) + [1, 2, 3] + list(range(2, 10))  # as generate_rooms.py

OFFICE_WALLS = dict(back=(226, 223, 210), side=(205, 202, 190), mortar=None,
                    brand=(46, 132, 90), skirting=(84, 88, 86), skirting_dark=(58, 62, 60))
INDUSTRIAL_WALLS = dict(back=(168, 175, 178), side=(148, 155, 158), mortar=(150, 156, 160),
                        brand=(214, 176, 44), skirting=(64, 68, 70), skirting_dark=(44, 48, 50))

YELLOW = (222, 186, 40)
YELLOW_DARK = (176, 146, 30)
BLACK = (40, 36, 30)
RED = (176, 52, 44)
WHITE = (232, 232, 226)
GREEN = (46, 132, 90)
GREEN_DARK = (30, 92, 62)


def base_walls(w, width=320):
    """room6 raised to the 2-tile standard, with the given wall colours. width 640
    builds the 20-column version from room6's COLS_20 map."""
    src = Image.open(SRC).convert("RGBA")
    src = raise_back_wall(src, sheet_floor_top(SRC))
    if width == 640:
        wide = Image.new("RGBA", (640, src.height))
        for col, sc in enumerate(COLS_20):
            wide.paste(src.crop((sc * TILE, 0, sc * TILE + TILE, src.height)), (col * TILE, 0))
        src = wide
    out = src.copy()
    sp, op = src.load(), out.load()
    back_wall_grey = sp[160, 40][:3]
    side_wall_grey = sp[20, 200][:3]
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if floor_at(x, y, width):
                continue
            if (r, g, b) == back_wall_grey:
                c = w["back"]
                if w["mortar"] and 12 <= y < FLOOR_TOP - 6:
                    # blockwork: 8px courses, 16px blocks, joints offset every other course
                    course = (y - 12) // 8
                    if (y - 12) % 8 == 7 or (x + (8 if course % 2 else 0)) % 16 == 0:
                        c = w["mortar"]
                if y == FLOOR_TOP - 7 or y == FLOOR_TOP - 6:
                    c = w["brand"] if (w["mortar"] is None or y == FLOOR_TOP - 6) else w["brand"]
                elif y in (FLOOR_TOP - 5, FLOOR_TOP - 4):
                    c = w["skirting"]
                elif y == FLOOR_TOP - 3:
                    c = w["skirting_dark"]
                op[x, y] = (*c, a)
            elif (r, g, b) == side_wall_grey:
                op[x, y] = (*w["side"], a)
    return out


def floor_at(x, y, width=320):
    if width == 320:
        return is_floor(x, y)
    return 32 <= x < width - 32 and FLOOR_TOP <= y < 308


def paint_floor(img, fn, width=320, shadow=0.9):
    out = img.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if floor_at(x, y, width):
                c = fn(x, y)
                if y < FLOOR_TOP + 3:  # soft shadow along the foot of the back wall
                    c = shade(c, shadow)
                op[x, y] = (*c, op[x, y][3])
    return out


# --- floor textures -----------------------------------------------------------

def terrazzo_pixel(x, y):
    base = (206, 206, 198)
    h = hashxy(x, y)
    if x % 64 == 0 or y % 64 == 0:
        return (176, 178, 172)
    if h % 19 == 0:
        return (150, 152, 146)
    if h % 23 == 0:
        return (232, 230, 222)
    if h % 31 == 0:
        return (120, 148, 128)  # green aggregate
    return base


CARPET_BLUE = carpet_pixel_fn((104, 118, 140), (94, 108, 129), (118, 132, 152), (110, 122, 142))
# dark floors keep some colour: check_room_walls reads a dark, near-neutral row as the floor line
CARPET_CHARCOAL = carpet_pixel_fn((96, 104, 130), (88, 96, 120), (110, 118, 142), (110, 118, 144))


def antistatic_pixel(x, y):
    """Anti-static vinyl tiles: pale blue-grey, one tile in four a shade darker, flecked."""
    lx, ly = x % TILE, y % TILE
    if lx == 0 or ly == 0:
        return (130, 140, 150)
    tone = hashxy(x // TILE, y // TILE) % 4
    base = [(176, 184, 192), (170, 178, 187), (180, 188, 195), (166, 174, 183)][tone]
    h = hashxy(x, y)
    if h % 17 == 0:
        return shade(base, 0.86)
    if h % 41 == 0:
        return (110, 130, 160)
    return base


def concrete_pixel(x, y):
    """Sealed concrete: warm mid grey, saw-cut joints every 3 tiles, soft mottling."""
    if x % 96 == 0 or y % 96 == 0:
        return (118, 118, 112)
    m = (hashxy(x // 6, y // 6) % 5)
    base = [(156, 154, 146), (150, 148, 141), (160, 158, 150), (146, 144, 137), (154, 152, 145)][m]
    h = hashxy(x, y)
    if h % 13 == 0:
        return shade(base, 0.92)
    if h % 37 == 0:
        return shade(base, 1.06)
    return base


def epoxy_fn(base):
    def fn(x, y):
        h = hashxy(x, y)
        if h % 29 == 0:
            return shade(base, 0.9)
        if h % 47 == 0:
            return shade(base, 1.08)
        return base
    return fn


EPOXY_GREY = epoxy_fn((128, 136, 136))
EPOXY_GREEN = epoxy_fn((108, 146, 118))  # light enough that the shaded wall foot never reads as the floor line


# --- decals -------------------------------------------------------------------

def paint_line(op, x0, y0, x1, y1, c=YELLOW, width=320):
    """A solid painted line, box inclusive of x0..x1-1, y0..y1-1."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            if floor_at(x, y, width):
                op[x, y] = (*c, 255)


def paint_hatch_border(op, box, width_px=4, colours=(YELLOW, BLACK), width=320):
    """A diagonal-striped keep-clear border round a box (exclusive)."""
    x0, y0, x1, y1 = box
    a, b = colours
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d < width_px and floor_at(x, y, width):
                op[x, y] = (*(a if ((x + y) // 4) % 2 == 0 else b), 255)


def paint_hatch_box(op, box, colours=(RED, WHITE), width=320):
    """A fully hatched keep-clear box with a solid outline."""
    x0, y0, x1, y1 = box
    a, b = colours
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d < 2:
                c = a
            else:
                c = a if ((x - y) // 4) % 3 == 0 else None
            if c:
                op[x, y] = (*c, 255)


BOLT = [
    "....####",
    "...####.",
    "..####..",
    ".#######",
    "...####.",
    "..####..",
    ".####...",
    ".##.....",
    "#.......",
]


def paint_bolt_inlay(op, cx, cy, r):
    """A green ring with a white lightning bolt: the Albion mark."""
    for y in range(cy - r - 2, cy + r + 3):
        for x in range(cx - r - 2, cx + r + 3):
            d = math.hypot(x - cx + 0.5, y - cy + 0.5)
            if d < r - 2:
                op[x, y] = (*GREEN, 255)
            elif d < r:
                op[x, y] = (*GREEN_DARK, 255)
    gh, gw = len(BOLT), len(BOLT[0])
    for sc in (2,):
        x0, y0 = cx - gw * sc // 2, cy - gh * sc // 2
        for j, row in enumerate(BOLT):
            for i, ch in enumerate(row):
                if ch == "#":
                    for dy in range(sc):
                        for dx in range(sc):
                            op[x0 + i * sc + dx, y0 + j * sc + dy] = (*WHITE, 255)


def paint_mat(op, box):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            c = (44, 46, 48) if d < 2 else ((58, 60, 62) if (y - y0) % 3 else (50, 52, 54))
            op[x, y] = (*c, 255)


def paint_kitchen_patch(op, box):
    """Grey safety vinyl under a kitchenette."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not is_floor(x, y):
                continue
            h = hashxy(x, y)
            c = (172, 174, 170)
            if h % 11 == 0:
                c = (140, 142, 138)
            elif h % 17 == 0:
                c = (200, 200, 196)
            if min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y) == 0:
                c = (120, 122, 118)
            op[x, y] = (*c, 255)


def paint_dock_plate(op, box):
    """Steel dock-leveller plate: a raised diamond tread inside a dark rim."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d == 0:
                c = (82, 86, 90)
            elif ((x - x0) + 2 * (y - y0)) % 8 in (0, 1) and ((x - x0) - 2 * (y - y0)) % 8 in (0, 1):
                c = (178, 184, 188)
            else:
                c = (136, 142, 146)
            op[x, y] = (*c, 255)


def paint_tyre_marks(op, boxes):
    """Rubber marks where vans reverse in: dark, broken, slightly wavy streaks."""
    for x0, y0, x1, y1 in boxes:
        for y in range(y0, y1):
            wob = int(2 * math.sin(y / 23.0))
            for x in range(x0 + wob, x1 + wob):
                if hashxy(x * 5, y // 2) % 4 == 0 and is_floor(x, y):
                    r, g, b, a = op[x, y]
                    op[x, y] = (*shade((r, g, b), 0.84), a)


def split_wide(img):
    return img.crop((0, 0, 320, img.height)), img.crop((320, 0, 640, img.height))


# --- sheets -------------------------------------------------------------------

def paint_trunking(op, x0, y0, x1, y1, width=320):
    """Steel floor trunking: a dark lid with a light edge and a joint every 24 px."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            if y in (y0, y1 - 1) or x in (x0, x1 - 1):
                c = (70, 74, 76)
            elif y == y0 + 1:
                c = (128, 134, 138)
            elif (x - x0) % 24 == 0 or (y - y0) % 24 == 0:
                c = (82, 86, 90)
            else:
                c = (100, 105, 108)
            op[x, y] = (*c, 255)


def paint_grate(op, x0, y0, w=14, h=8, width=320):
    """A floor drain: dark frame, slotted grille."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            edge = y in (y0, y0 + h - 1) or x in (x0, x0 + w - 1)
            c = (64, 68, 70) if edge else ((48, 52, 54) if (x - x0) % 2 else (96, 100, 102))
            op[x, y] = (*c, 255)


def paint_wear(op, box, width=320, strength=0.9):
    """Scuffed, darker epoxy where feet and trolleys turn: a soft ellipse of speckle."""
    x0, y0, x1, y1 = box
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if k < 1 and hashxy(x * 7 + 3, y * 13 + 5) % (3 if k < 0.35 else 6) == 0:
                r, g, b, a = op[x, y]
                op[x, y] = (*shade((r, g, b), strength), a)


def hall1_sheet(walls):
    """Battery Hall 1 (Rack Bank C), 640 px wide (generate_rooms.room_aes_hall1): batrack
    blocks x 108-300 (feet 166-238) and x 456-584 (feet 166-278); low kit along the back
    wall (feet 84-88), a yellow line along its front; Cipher's open floor x 300-456.
    Trunking along the blocks' feet and across the open floor, drains, wear at the doors."""
    img = paint_floor(walls, EPOXY_GREY, width=640)
    op = img.load()
    paint_wear(op, (32, 64, 110, 120), width=640)     # W door
    paint_wear(op, (540, 64, 608, 120), width=640)    # E door
    paint_wear(op, (32, 180, 80, 256), width=640)     # S door lane
    paint_wear(op, (300, 84, 456, 140), width=640, strength=0.94)  # where everyone crosses
    paint_line(op, 100, 90, 300, 92, width=640)       # in front of the back-wall kit
    paint_line(op, 456, 90, 586, 92, width=640)
    paint_hatch_border(op, (102, 150, 306, 246), width=640)
    paint_hatch_border(op, (450, 150, 590, 286), width=640)
    paint_trunking(op, 64, 247, 456, 253, width=640)
    paint_trunking(op, 450, 288, 608, 294, width=640)
    for x, y in ((372, 150), (36, 236), (390, 284), (520, 112)):
        paint_grate(op, x, y, width=640)
    return img


def hall2_sheet(walls):
    """Battery Hall 2 / inverter room, 640 px wide (generate_rooms.room_aes_hall2): banks A
    x 104-264 and B x 296-424 (feet 166, 202), inverters on the back wall x 440-608 (feet
    120) and in front x 452-580 (feet 202) with a red-hatched HV box between them. Relay's
    beat y 206-256 x 100-520 and the S-door lane x 32-96 stay plain."""
    img = paint_floor(walls, EPOXY_GREY, width=640)
    op = img.load()
    paint_wear(op, (32, 64, 110, 120), width=640)     # W door
    paint_wear(op, (32, 180, 96, 256), width=640)     # S door lane
    paint_wear(op, (120, 214, 500, 252), width=640, strength=0.94)  # Relay's beat
    paint_hatch_border(op, (98, 150, 270, 210), width=640)
    paint_hatch_border(op, (290, 150, 430, 210), width=640)
    # yellow/black, not red: red hatching is the plant room's ESD box only (cycle 4, review F13)
    paint_hatch_box(op, (438, 122, 608, 144), colours=(YELLOW, BLACK), width=640)
    paint_trunking(op, 96, 211, 600, 217, width=640)
    paint_line(op, 96, 90, 430, 92, width=640)
    for x, y in ((60, 236), (276, 236), (460, 236)):
        paint_grate(op, x, y, width=640)
    return img


def main():
    office = base_walls(OFFICE_WALLS)
    industrial = base_walls(INDUSTRIAL_WALLS)
    industrial_wide = base_walls(INDUSTRIAL_WALLS, width=640)
    sheets = {}

    lobby = paint_floor(office, terrazzo_pixel)
    paint_bolt_inlay(lobby.load(), 160, 176, 20)
    sheets["room_aes_lobby"] = lobby

    ops = paint_floor(office, CARPET_BLUE)
    paint_kitchen_patch(ops.load(), (190, 64, 270, 116))  # under the night-shift kitchenette (room_aes_ops)
    sheets["room_aes_carpet"] = ops
    sheets["room_aes_security"] = paint_floor(office, CARPET_CHARCOAL)
    sheets["room_aes_control"] = paint_floor(office, antistatic_pixel)

    workshop = paint_floor(industrial, concrete_pixel)
    paint_hatch_border(workshop.load(), (96, 182, 238, 262))  # round the module test bench (room_aes_workshop)
    sheets["room_aes_workshop"] = workshop

    plant = paint_floor(industrial, EPOXY_GREEN)
    op = plant.load()
    paint_hatch_box(op, (146, 66, 196, 100))   # in front of the ESD station (room_aes_plant)
    sheets["room_aes_plant"] = plant

    dock = paint_floor(industrial, concrete_pixel)
    op = dock.load()
    paint_hatch_border(op, (108, 64, 212, 76), width_px=6, colours=(YELLOW, (96, 82, 36)))  # the shutter threshold (no near-black: check_room_walls reads it as the floor line)
    paint_line(op, 104, 76, 106, 250)
    paint_line(op, 214, 76, 216, 250)
    paint_dock_plate(op, (112, 76, 208, 104))
    paint_tyre_marks(op, [(124, 108, 140, 250), (180, 108, 196, 250)])
    sheets["room_aes_dock"] = dock

    for name, fn in (("room_aes_hall1", hall1_sheet), ("room_aes_hall2", hall2_sheet)):
        w, e = split_wide(fn(industrial_wide))
        sheets[f"{name}_w"] = w
        sheets[f"{name}_e"] = e

    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if not name.endswith("_e") and top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
