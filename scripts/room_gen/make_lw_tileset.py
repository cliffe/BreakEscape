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

Those two stay as they are (room_lw_office, room_lw_reception, room_lw_records and
room_lw_ceo, shared with test_seating and test_gate_tailgate, use them). The Ledgerwell
identity (scenarios/lab_physical_pentest/ROOM_IDENTITY_PLAN.md section 2) is a second set
of sheets on a new wall: buttermilk plaster over a bottle-green panelled dado with a
brass rail and walnut skirting.

  room_lw_boards    oak strip boards with a bottle-green runner on rows 2-3 (front of house)
  room_lw_tiles     oatmeal carpet tiles, quarter-turned (offices)
  room_lw_vinyl     grey-green sheet vinyl with a darker border strip (records)
  room_lw_concrete  painted concrete (back of house)
  room_lw_oxblood   oxblood carpet with a paler mark where the board table stood (briefing)

Usage: python3 scripts/room_gen/make_lw_tileset.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, sheet_floor_top  # noqa: E402
from make_uni_tileset import (paint_floor, carpet_pixel_fn, hashxy, shade,  # noqa: E402
                              grey_vinyl_pixel, concrete_pixel)
from make_zds_tileset import FRONT_WALLS, base_walls, paint_rug  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

LEDGERWELL_BRASS = (176, 138, 60)
CARPET_BOTTLE_GREEN = carpet_pixel_fn((42, 102, 76), (35, 88, 65), (58, 122, 92), (28, 74, 54))


BUTTERMILK = (230, 222, 200)
BUTTERMILK_SIDE = (214, 205, 182)
WALNUT = (70, 48, 34)
WALNUT_DARK = (46, 32, 24)
DADO = (44, 84, 64)
DADO_LIGHT = (66, 112, 86)
DADO_DARK = (30, 62, 46)
RAIL = LEDGERWELL_BRASS
RAIL_HI = (206, 168, 84)
RAIL_LO = (128, 98, 40)
LW_WALLS = dict(back=BUTTERMILK, side=BUTTERMILK_SIDE, brand=LEDGERWELL_BRASS,
                skirting=WALNUT, skirting_dark=WALNUT_DARK)
DADO_TOP, DADO_BOTTOM = 40, 58  # rows of the panelled dado (rail on the first two)


def lw_walls():
    """The Ledgerwell shell: buttermilk back wall, a bottle-green panelled dado under a
    brass rail, walnut skirting. Panels are 32px wide, outlined lighter at the top and
    left and darker at the bottom and right (a raised moulding)."""
    img = base_walls(LW_WALLS)
    px = img.load()
    for y in range(DADO_TOP, DADO_BOTTOM):
        for x in range(img.width):
            if px[x, y][:3] != BUTTERMILK:
                continue
            a = px[x, y][3]
            if y == DADO_TOP:
                c = RAIL_HI
            elif y == DADO_TOP + 1:
                c = RAIL
            elif y == DADO_TOP + 2:
                c = RAIL_LO
            else:
                c = DADO
                lx = x % 32
                if DADO_TOP + 5 <= y <= DADO_BOTTOM - 3 and 3 <= lx <= 28:
                    top, bot = y == DADO_TOP + 5, y == DADO_BOTTOM - 3
                    if top or lx == 3:
                        c = DADO_LIGHT
                    elif bot or lx == 28:
                        c = DADO_DARK
                if hashxy(x, y) % 31 == 0:
                    c = shade(c, 1.08)
            px[x, y] = (*c, a)
    return img


def boards_pixel(x, y):
    """Oak strip boards: 8px boards running east-west, staggered end joints every 96px."""
    row, ly = y // 8, y % 8
    if ly == 0:
        return (92, 62, 36)
    off = (hashxy(row, 7) % 96)
    if (x + off) % 96 == 0:
        return (92, 62, 36)
    tone = hashxy(row, (x + off) // 96) % 4
    base = [(176, 128, 78), (168, 120, 72), (182, 134, 84), (160, 114, 68)][tone]
    h = hashxy(x, y)
    if h % 19 == 0:
        return shade(base, 0.9)
    if h % 31 == 0:
        return shade(base, 1.07)
    return base


def paint_green_runner(px, y0, y1, x0=32, x1=288):
    """Bottle-green runner with a brass line and dark edge, laid wall to wall."""
    edge, field, field2 = (22, 52, 38), (44, 92, 68), (40, 84, 62)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(y - y0, y1 - 1 - y)
            if d == 0:
                c = edge
            elif d == 3:
                c = LEDGERWELL_BRASS
            elif d == 4:
                c = (30, 66, 48)
            else:
                c = field2 if hashxy(x, y) % 7 == 0 else field
                if (x // 16) % 2 == 0 and d > 6 and (y - y0) % 8 == 4 and x % 4 == 0:
                    c = (58, 110, 82)  # a faint woven diamond
            px[x, y] = (*c, 255)


OATMEAL = carpet_pixel_fn((196, 184, 158), (184, 171, 145), (208, 197, 172), (160, 148, 124))
OXBLOOD = carpet_pixel_fn((100, 28, 38), (90, 24, 34), (118, 40, 50), (72, 18, 26))
OXBLOOD_PALE = carpet_pixel_fn((132, 52, 56), (120, 46, 52), (148, 64, 68), (96, 36, 42))


def vinyl_green_pixel(x, y):
    """Grey-green sheet vinyl with fine flecks and a welded seam every 2 tiles."""
    base, light, fleck, seam = (140, 156, 146), (150, 166, 156), (112, 128, 118), (122, 138, 128)
    if x % 64 == 0:
        return seam
    h = hashxy(x, y)
    if h % 27 == 0:
        return fleck
    if h % 11 == 0:
        return light
    return base


def concrete_warm(x, y):
    """Painted concrete: the catalog concrete a shade warmer, so it isn't a grey slab."""
    c = concrete_pixel(x, y)
    return (min(255, c[0] + 8), min(255, c[1] + 4), c[2])


def paint_border(px, fn, inset=8, width=6, box=(32, 64, 288, 320)):
    """A darker border strip inset from the floor edge (the vinyl's welded surround)."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, x1 - 1 - x, y - y0)
            if inset <= d < inset + width:
                px[x, y] = (*shade(fn(x, y), 0.82), 255)


def paint_table_mark(px, box, fn):
    """The paler rectangle where the board table stood (drawn under every sprite)."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            px[x, y] = (*(shade(fn(x, y), 0.7) if d == 0 else fn(x, y)), 255)


def main():
    walls = base_walls(dict(FRONT_WALLS, brand=LEDGERWELL_BRASS))
    sheets = {"room_lw_carpet": paint_floor(walls, CARPET_BOTTLE_GREEN)}
    exec_ = paint_floor(walls, CARPET_BOTTLE_GREEN)
    paint_rug(exec_.load(), (92, 92, 228, 206))  # same box as room_zds_exec (room_zds_ceo)
    sheets["room_lw_exec"] = exec_

    shell = lw_walls()
    boards = paint_floor(shell, boards_pixel)
    paint_green_runner(boards.load(), 76, 116)
    sheets["room_lw_boards"] = boards
    sheets["room_lw_tiles"] = paint_floor(shell, OATMEAL)
    vinyl = paint_floor(shell, vinyl_green_pixel)
    paint_border(vinyl.load(), vinyl_green_pixel)
    sheets["room_lw_vinyl"] = vinyl
    sheets["room_lw_concrete"] = paint_floor(shell, concrete_warm)
    oxblood = paint_floor(shell, OXBLOOD)
    paint_table_mark(oxblood.load(), (72, 184, 232, 268), OXBLOOD_PALE)
    sheets["room_lw_oxblood"] = oxblood
    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
