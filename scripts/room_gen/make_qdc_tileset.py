#!/usr/bin/env python3
"""
Build the Quantum Dynamics Corporation room sheets (tiles/rooms/room_qdc*.png) for
m05 "Insider Trading": repaints of room6.png for the room_qdc_* maps in
generate_rooms.py, made the same way as make_aes_tileset.py and
make_hce_tileset.py (whose helpers it imports; their sheets are not touched).

QDC is a quantum-cryptography research firm in a working day: clean, corporate,
security-conscious. One brand colour, a quantum violet line along every wall,
over five wall treatments:

  front    cool lilac-grey (lobby, corridor, open-plan, Patricia, Torres)
  lab      clean-room white with a pale blue-grey skirting (Halloran's lab)
  break    soft sage (the break room)
  tech     graphite with the violet line (server hallway, server room)
  vault    darker graphite with a red security line (the key vault)

The tech and vault walls are dark, so they keep some chroma: check_room_walls
reads a dark, near-neutral row as the floor line.

Floors tell the rooms apart:

  room_qdc_lobby        pale polished stone, a violet Bloch-sphere inlay at the spawn
  room_qdc_hall         slate carpet tiles (main corridor)
  room_qdc_server_hall  grey vinyl with floor trunking (server hallway)
  room_qdc_break        warm wood-effect vinyl, kitchen safety vinyl along the back
  room_qdc_open         blue-grey carpet tiles, a lighter aisle (open-plan office)
  room_qdc_security     charcoal-plum carpet (Patricia's office)
  room_qdc_torres       oak boards, a worn blue rug under the desk (Torres' office)
  room_qdc_lab          white anti-static tiles, hatched keep-clear boxes round the
                        cryostat and the laser bench (Halloran's lab)
  room_qdc_servers      raised access floor, perforated cold aisles
  room_qdc_vault        dark raised floor, a red hatched two-person line in front
                        of the key safes (the key vault)

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID); a 10x6 hall map uses rows
0-4 and row 9, so a hall's floor decals live in rows 2-4 (y 64-159). Decal boxes
here must match the furniture in the room_qdc_* builders. Each sheet needs a
this.load.image line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_qdc_tileset.py
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402
from make_aes_tileset import base_walls, paint_floor, paint_hatch_border, \
    paint_trunking, antistatic_pixel  # noqa: E402
from make_hce_tileset import raised_fn, paint_rug, paint_carpet_box  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32

VIOLET = (112, 70, 196)
VIOLET_LIGHT = (150, 108, 232)
VIOLET_DARK = (70, 44, 128)
RED = (186, 42, 50)
YELLOW = (222, 186, 40)
BLACK = (40, 36, 44)

FRONT_WALLS = dict(back=(214, 213, 226), side=(194, 193, 210), mortar=None,
                   brand=VIOLET, skirting=(88, 86, 102), skirting_dark=(64, 62, 76))
LAB_WALLS = dict(back=(234, 238, 241), side=(212, 219, 224), mortar=None,
                 brand=VIOLET, skirting=(146, 158, 170), skirting_dark=(108, 120, 132))
BREAK_WALLS = dict(back=(200, 214, 194), side=(182, 197, 176), mortar=None,
                   brand=VIOLET, skirting=(92, 98, 88), skirting_dark=(66, 72, 64))
TECH_WALLS = dict(back=(44, 50, 88), side=(58, 64, 102), mortar=None,
                  brand=VIOLET_LIGHT, skirting=(40, 44, 82), skirting_dark=(28, 30, 68))
VAULT_WALLS = dict(back=(58, 40, 80), side=(70, 52, 94), mortar=None,
                   brand=RED, skirting=(70, 30, 50), skirting_dark=(60, 20, 46))


# --- floor textures -----------------------------------------------------------

def stone_pixel(x, y):
    """Pale polished stone in 64x32 slabs (running bond), a cool fleck."""
    row = y // 32
    off = 32 if row % 2 else 0
    lx, ly = (x + off) % 64, y % 32
    if lx == 0 or ly == 0:
        return (188, 188, 198)
    slab = hashxy((x + off) // 64, row)
    base = [(230, 230, 236), (224, 224, 232), (234, 233, 238)][slab % 3]
    h = hashxy(x, y)
    if h % 29 == 0:
        return shade(base, 0.94)
    if h % 97 == 0:
        return (176, 160, 214)
    return base


CARPET_HALL = carpet_pixel_fn((104, 102, 152), (96, 92, 142), (120, 118, 166), (110, 106, 156))
CARPET_OPEN = carpet_pixel_fn((112, 124, 146), (102, 114, 136), (128, 140, 160), (120, 132, 152))
CARPET_AISLE = carpet_pixel_fn((140, 150, 170), (130, 140, 160), (154, 164, 182), (146, 156, 174))
CARPET_SECURITY = carpet_pixel_fn((114, 76, 120), (104, 66, 110), (128, 90, 134), (108, 72, 114))


def vinyl_pixel(x, y):
    """Grey corridor vinyl, flecked, a welded seam every 2 tiles."""
    if x % 64 == 0:
        return (140, 144, 152)
    h = hashxy(x, y)
    base = (168, 172, 180)
    if h % 23 == 0:
        return (136, 140, 150)
    if h % 41 == 0:
        return (196, 198, 206)
    return base


def woodvinyl_pixel(x, y):
    """Warm wood-effect vinyl planks, 8 px wide, north-south, staggered joints."""
    col = x // 8
    if x % 8 == 0:
        return (150, 112, 78)
    off = (col * 41) % 80
    if (y + off) % 80 == 0:
        return (150, 112, 78)
    tone = hashxy(col, (y + off) // 80) % 3
    base = [(190, 148, 104), (182, 140, 98), (196, 154, 110)][tone]
    if (y * 3 + x * 5 + hashxy(col, 2) % 7) % 19 == 0:
        return shade(base, 0.93)
    return base


def kitchen_pixel(x, y):
    """Grey-green safety vinyl with a fine fleck (the kitchenette strip)."""
    h = hashxy(x, y)
    base = (160, 170, 162)
    if h % 7 == 0:
        return (140, 150, 144)
    if h % 31 == 0:
        return (200, 206, 200)
    return base


def oak_pixel(x, y):
    """Mid oak boards running east-west, 8 px wide, staggered butt joints."""
    row = y // 8
    if y % 8 == 3:
        return (120, 86, 54)
    off = (row * 37) % 96
    if (x + off) % 96 == 0:
        return (122, 88, 56)
    tone = hashxy(row, (x + off) // 96) % 3
    base = [(168, 126, 84), (160, 120, 80), (174, 132, 88)][tone]
    if (x * 3 + y * 7 + hashxy(row, 1) % 11) % 23 == 0:
        return shade(base, 0.92)
    return base


def lab_pixel(x, y):
    """White anti-static tiles: antistatic_pixel lifted towards white."""
    r, g, b = antistatic_pixel(x, y)
    return (min(255, r + 52), min(255, g + 50), min(255, b + 46))


# --- decals -------------------------------------------------------------------

def paint_bloch_inlay(op, cx, cy, r):
    """The QDC mark set in the stone: a violet ring (a Bloch sphere seen flat, an
    ellipse for its equator), a vertical axis and the state vector, a dot at its tip."""
    for y in range(cy - r - 3, cy + r + 4):
        for x in range(cx - r - 3, cx + r + 4):
            d = math.hypot(x - cx, (y - cy) * 1.25)
            if r - 2 <= d < r:
                op[x, y] = (*VIOLET, 255)
            elif r <= d < r + 2:
                op[x, y] = (*VIOLET_DARK, 255)
            elif d < r - 2:
                e = math.hypot((x - cx) / 1.0, (y - cy) * 3.6)
                if r - 2 <= e < r:
                    op[x, y] = (*VIOLET_LIGHT, 255)
    for y in range(cy - int(r / 1.25) + 1, cy + int(r / 1.25)):
        op[cx, y] = (*VIOLET, 255)
    # the state vector, up and to the right, with a gold tip
    for k in range(int(r * 0.72)):
        x, y = cx + int(k * 0.6), cy - int(k * 0.62)
        op[x, y] = (*VIOLET_DARK, 255)
    tx, ty = cx + int(r * 0.72 * 0.6), cy - int(r * 0.72 * 0.62)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            op[tx + dx, ty + dy] = (*(214, 176, 80), 255)


def paint_hatch(op, box, colours=(YELLOW, BLACK), width_px=3):
    paint_hatch_border(op, box, width_px=width_px, colours=colours)


def main():
    front = base_walls(FRONT_WALLS)
    lab_w = base_walls(LAB_WALLS)
    brk = base_walls(BREAK_WALLS)
    tech = base_walls(TECH_WALLS)
    vault_w = base_walls(VAULT_WALLS)
    sheets = {}

    lobby = paint_floor(front, stone_pixel)
    paint_bloch_inlay(lobby.load(), 160, 196, 20)
    paint_rug(lobby.load(), (196, 234, 290, 300), (70, 64, 96), (44, 40, 64), VIOLET_LIGHT)   # under the waiting area
    sheets["room_qdc_lobby"] = lobby

    sheets["room_qdc_hall"] = paint_floor(front, CARPET_HALL)

    shall = paint_floor(tech, vinyl_pixel)
    paint_trunking(shall.load(), 32, 116, 288, 122)
    sheets["room_qdc_server_hall"] = shall

    brk_floor = paint_floor(brk, woodvinyl_pixel)
    paint_carpet_box(brk_floor.load(), (32, 64, 200, 108), kitchen_pixel)   # under the kitchenette
    sheets["room_qdc_break"] = brk_floor

    open_floor = paint_floor(front, CARPET_OPEN)
    paint_carpet_box(open_floor.load(), (226, 64, 288, 320), CARPET_AISLE)   # the walkway, S door to N door
    sheets["room_qdc_open"] = open_floor

    sheets["room_qdc_security"] = paint_floor(front, CARPET_SECURITY)

    torres = paint_floor(front, oak_pixel)
    paint_rug(torres.load(), (92, 120, 220, 214), (58, 76, 110), (36, 46, 72), (196, 170, 120))
    sheets["room_qdc_torres"] = torres

    lab = paint_floor(lab_w, lab_pixel)
    op = lab.load()
    paint_hatch(op, (34, 68, 100, 116))      # round the cryostat (room_qdc_lab: frame x 36-92, feet 104)
    paint_hatch(op, (34, 140, 124, 188))     # the laser bench's keep-clear (feet 176)
    sheets["room_qdc_lab"] = lab

    sheets["room_qdc_servers"] = paint_floor(tech, raised_fn((176, 180, 192), perf={4, 6}))

    vault = paint_floor(vault_w, raised_fn((132, 130, 148), perf={5}))
    paint_hatch(vault.load(), (32, 64, 166, 124), colours=(RED, (232, 230, 226)))   # the two-person line at the key safes
    sheets["room_qdc_vault"] = vault

    for name, img in sheets.items():
        img.save(OUT_DIR / f"{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
