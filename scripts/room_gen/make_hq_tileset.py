#!/usr/bin/env python3
"""
Build the SAFETYNET headquarters room sheets (tiles/rooms/room_hq_*.png) for m08
"The Mole": repaints of room6.png for the room_hq_* maps (builders in
room_gen/hq_rooms.py), made the same way as make_qdc_tileset.py (whose helpers
it imports; no other mission's sheet is touched).

The Citadel at night on a Level Red posture: a government building that takes
itself seriously. Dark slate and walnut front of house, one brand colour (a
SAFETYNET signal blue line along every wall), institutional blockwork in the
back rooms. Walls:

  lobby     dark slate, walnut slat panelling behind reception
  director  warm umber, walnut slats along the whole back wall
  front     slate blue-grey (operations floor, intelligence analysis)
  lab       pale lab grey (cryptography lab)
  tech      graphite (server room)
  archive   olive-grey painted blockwork (security archives)
  interview pale grey painted blockwork, a dark red line (interrogation suite)
  break     warm putty (break room)

Floors:

  room_hq_lobby      dark granite tiles, the SAFETYNET seal inlaid at the spawn,
                     a walk-off mat at the west and east doors
  room_hq_director   walnut parquet, a navy rug under the desk
  room_hq_ops        charcoal carpet tiles, lighter walkways joining the four doors
  room_hq_intel      dark navy carpet (10x6: decals in rows 2-4)
  room_hq_servers    raised access floor, perforated cold aisles
  room_hq_archives   sealed concrete, yellow aisle lines (10x6)
  room_hq_crypto     grey anti-static tiles, a hatched keep-clear box at the
                     key-material safe
  room_hq_interview  worn grey vinyl, a darker square under the table
  room_hq_break      wood-effect vinyl, kitchen safety vinyl along the back

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID). Decal boxes must match the
furniture in hq_rooms.py. Each sheet needs a this.load.image line in game.js.

Usage: python3 scripts/room_gen/make_hq_tileset.py
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402
from make_aes_tileset import base_walls, paint_floor, paint_hatch_border, antistatic_pixel  # noqa: E402
from make_hce_tileset import raised_fn, paint_rug, paint_carpet_box  # noqa: E402
from make_zds_tileset import parquet_pixel, paint_slat_wall  # noqa: E402
from make_qdc_tileset import woodvinyl_pixel, kitchen_pixel  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

SN_BLUE = (52, 132, 200)
SN_BLUE_LIGHT = (112, 182, 236)
SN_BLUE_DARK = (30, 72, 124)
SILVER = (184, 192, 204)
RED_DARK = (128, 36, 42)
YELLOW = (214, 178, 44)

LOBBY_WALLS = dict(back=(62, 72, 106), side=(76, 86, 120), mortar=None,
                   brand=SN_BLUE, skirting=(40, 44, 58), skirting_dark=(28, 30, 44))
DIRECTOR_WALLS = dict(back=(108, 82, 60), side=(120, 94, 72), mortar=None,
                      brand=SN_BLUE, skirting=(52, 38, 28), skirting_dark=(40, 28, 20))
FRONT_WALLS = dict(back=(98, 108, 128), side=(112, 122, 142), mortar=None,
                   brand=SN_BLUE, skirting=(46, 52, 68), skirting_dark=(32, 36, 52))
LAB_WALLS = dict(back=(198, 204, 212), side=(180, 188, 198), mortar=None,
                 brand=SN_BLUE, skirting=(96, 104, 118), skirting_dark=(70, 78, 92))
TECH_WALLS = dict(back=(42, 52, 86), side=(54, 64, 100), mortar=None,
                  brand=SN_BLUE_LIGHT, skirting=(36, 42, 66), skirting_dark=(26, 30, 54))
ARCHIVE_WALLS = dict(back=(128, 134, 116), side=(140, 146, 128), mortar=(112, 118, 100),
                     brand=SN_BLUE, skirting=(70, 74, 60), skirting_dark=(52, 56, 44))
INTERVIEW_WALLS = dict(back=(160, 162, 158), side=(146, 148, 144), mortar=(140, 142, 138),
                       brand=RED_DARK, skirting=(84, 84, 82), skirting_dark=(62, 62, 60))
BREAK_WALLS = dict(back=(194, 182, 160), side=(178, 166, 144), mortar=None,
                   brand=SN_BLUE, skirting=(92, 84, 70), skirting_dark=(68, 62, 50))


# --- floor textures -----------------------------------------------------------

def granite_pixel(x, y):
    """Dark polished granite in 32px tiles: blue-black with a silver fleck and a soft
    highlight streak across each tile, so it reads as glossy (the hq backgrounds)."""
    lx, ly = x % 32, y % 32
    if lx == 0 or ly == 0:
        return (34, 40, 74)
    tile = hashxy(x // 32, y // 32)
    base = [(46, 54, 88), (42, 50, 84), (50, 58, 92)][tile % 3]
    if (lx + ly + tile % 9) % 23 == 0 and lx > 4 and ly > 4:
        base = shade(base, 1.22)
    h = hashxy(x, y)
    if h % 41 == 0:
        return (120, 126, 142)
    if h % 17 == 0:
        return shade(base, 0.9)
    return base


CARPET_OPS = carpet_pixel_fn((60, 68, 100), (54, 62, 92), (70, 78, 110), (50, 58, 88))
CARPET_OPS_AISLE = carpet_pixel_fn((100, 110, 140), (92, 102, 132), (112, 122, 152), (96, 106, 136))
CARPET_INTEL = carpet_pixel_fn((44, 56, 92), (38, 50, 84), (54, 66, 104), (40, 52, 86))


def concrete_pixel(x, y):
    """Sealed grey concrete, a fine aggregate, saw cuts every 64 px."""
    if x % 64 == 0 or y % 64 == 0:
        return (118, 120, 120)
    h = hashxy(x, y)
    base = (150, 152, 150)
    if h % 11 == 0:
        return (138, 140, 138)
    if h % 29 == 0:
        return (168, 170, 166)
    return base


def interview_vinyl_pixel(x, y):
    """Worn institutional grey vinyl sheet, flecked, scuffed."""
    h = hashxy(x, y)
    base = (134, 136, 138)
    if h % 9 == 0:
        return (122, 124, 126)
    if h % 37 == 0:
        return (156, 158, 160)
    if (x * 7 + y * 3) % 97 == 0:
        return (112, 112, 114)
    return base


def lab_tile_pixel(x, y):
    """Cool grey anti-static tiles: antistatic_pixel lifted a little."""
    r, g, b = antistatic_pixel(x, y)
    return (min(255, r + 18), min(255, g + 20), min(255, b + 26))


# --- decals -------------------------------------------------------------------

def paint_seal(op, cx, cy, r):
    """The SAFETYNET seal in the granite: a silver ring, a blue field, a net of
    crossing lines (the 'net') with a shield outline over it."""
    for y in range(cy - r - 3, cy + r + 4):
        for x in range(cx - r - 3, cx + r + 4):
            d = math.hypot(x - cx, (y - cy) * 1.2)
            if r - 3 <= d < r:
                op[x, y] = (*SILVER, 255)
            elif r <= d < r + 2:
                op[x, y] = (*(28, 30, 40), 255)
            elif d < r - 3:
                c = SN_BLUE_DARK
                # the net: diagonal lines every 6 px
                if (x - cx + y - cy) % 6 == 0 or (x - cx - (y - cy)) % 6 == 0:
                    c = SN_BLUE
                op[x, y] = (*c, 255)
    # the shield: a silver outline, flat top, pointed foot
    sw, sh = int(r * 0.55), int(r * 0.62)
    for y in range(cy - sh, cy + sh + 1):
        t = (y - (cy - sh)) / (2 * sh)
        half = sw if t < 0.55 else int(sw * (1 - (t - 0.55) / 0.45))
        for x in (cx - half, cx + half):
            op[x, y] = (*SILVER, 255)
        if y == cy - sh:
            for x in range(cx - sw, cx + sw + 1):
                op[x, y] = (*SILVER, 255)
        if abs(y - cy) <= sh - 2:
            for x in range(cx - max(0, half - 1), cx + max(0, half - 1) + 1):
                if (x + y) % 2 == 0:
                    op[x, y] = (*SN_BLUE_LIGHT, 255)


def paint_mat(op, box):
    """A flat walk-off mat: charcoal-blue with a lighter rubber border and faint
    horizontal ribs, low contrast so it reads as matting, not a cabinet (c2 C2-10)."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not is_floor(x, y):
                continue
            edge = x in (x0, x1 - 1) or y in (y0, y1 - 1)
            c = (86, 92, 118) if edge else ((58, 64, 92) if (y - y0) % 4 else (52, 58, 86))
            op[x, y] = (*c, 255)


def paint_lines(op, xs, y0, y1, colour=YELLOW):
    """Painted aisle lines (2 px) at each x, from y0 to y1."""
    for x in xs:
        for y in range(y0, y1):
            for dx in (0, 1):
                if is_floor(x + dx, y):
                    op[x + dx, y] = (*colour, 255)


def paint_hlines(op, ys, x0, x1, colour=YELLOW):
    for y in ys:
        for x in range(x0, x1):
            for dy in (0, 1):
                if is_floor(x, y + dy):
                    op[x, y + dy] = (*colour, 255)


def paint_square(op, box, fn):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if is_floor(x, y):
                op[x, y] = (*fn(x, y), 255)


def main():
    sheets = {}

    # dark walls keep some chroma: check_room_walls reads a dark, near-neutral row as the floor line
    # lobby: walnut slats behind the reception counter, granite, the seal at the spawn
    lobby = base_walls(LOBBY_WALLS)
    paint_slat_wall(lobby.load(), 92, 236)
    lobby = paint_floor(lobby, granite_pixel, shadow=0.95)
    op = lobby.load()
    paint_seal(op, 160, 206, 22)
    paint_mat(op, (32, 74, 56, 114))      # at the west door
    paint_mat(op, (264, 74, 288, 114))    # at the east door
    sheets["room_hq_lobby"] = lobby

    director = base_walls(DIRECTOR_WALLS)
    paint_slat_wall(director.load(), 76, 288)
    director = paint_floor(director, parquet_pixel)
    paint_rug(director.load(), (110, 132, 238, 226), (36, 48, 84), (22, 28, 52), (176, 150, 96))
    sheets["room_hq_director"] = director

    ops = paint_floor(base_walls(FRONT_WALLS), CARPET_OPS, shadow=0.97)
    op = ops.load()
    paint_carpet_box(op, (32, 72, 288, 124), CARPET_OPS_AISLE)    # west door to east door
    paint_carpet_box(op, (32, 64, 76, 320), CARPET_OPS_AISLE)     # north door to south door
    sheets["room_hq_ops"] = ops

    sheets["room_hq_intel"] = paint_floor(base_walls(FRONT_WALLS), CARPET_INTEL)

    sheets["room_hq_servers"] = paint_floor(base_walls(TECH_WALLS), raised_fn((150, 156, 170), perf={4, 7}))

    arch = paint_floor(base_walls(ARCHIVE_WALLS), concrete_pixel)
    op = arch.load()
    paint_hlines(op, (126,), 32, 288)                     # the aisle in front of the stacks
    paint_lines(op, (80,), 64, 160)                       # the door lane's edge
    sheets["room_hq_archives"] = arch

    crypto = paint_floor(base_walls(LAB_WALLS), lab_tile_pixel)
    paint_hatch_border(crypto.load(), (96, 66, 140, 104), width_px=3,
                       colours=(YELLOW, (40, 36, 44)))   # keep clear round the key-material safe
    sheets["room_hq_crypto"] = crypto

    interview = paint_floor(base_walls(INTERVIEW_WALLS), interview_vinyl_pixel)
    paint_square(interview.load(), (112, 130, 208, 214), lambda x, y: shade(interview_vinyl_pixel(x, y), 0.88))
    sheets["room_hq_interview"] = interview

    brk = paint_floor(base_walls(BREAK_WALLS), woodvinyl_pixel)
    paint_carpet_box(brk.load(), (32, 64, 150, 106), kitchen_pixel)   # under the kitchenette
    sheets["room_hq_break"] = brk

    for name, img in sheets.items():
        img.save(OUT_DIR / f"{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
