#!/usr/bin/env python3
"""
Build the HashChain Exchange room sheets (tiles/rooms/room_hce*.png) for m06
"Follow the Money": repaints of room6.png for the room_hce_* maps in
generate_rooms.py, made the same way as make_aes_tileset.py (whose helpers it
imports; m04's sheets are not touched).

HashChain is a slick fintech front over the Crypto Anarchists' money operation,
seen at night. Three wall treatments:

  front of house  midnight navy with a bitcoin-amber brand line over a dark
                  skirting (lobby, checkpoint, trading floor, executive wing,
                  Satoshi's office)
  back office     warm pale grey with the amber line (Irina's office, the
                  blockchain lab)
  tech            dark petrol blue with a cold cyan line (server room, data
                  centre)

The walls are dark, so every wall and floor colour keeps some chroma:
check_room_walls reads a dark, near-neutral row as the floor line.

Floors tell the rooms apart:

  room_hce_lobby      pale marble with gold veins, a navy and gold hex-chain
                      inlay in front of the counter
  room_hce_hall       the lobby's marble, no inlay (checkpoint)
  room_hce_trading    blue-grey carpet tiles, a lighter aisle strip down the
                      middle, floor boxes under the desks
  room_hce_office     warm taupe carpet (Irina's office)
  room_hce_lab        grey vinyl with floor trunking (blockchain lab)
  room_hce_servers    raised access floor, perforated cold aisles
  room_hce_vault      darker raised floor, a hatched cage line round the
                      custody area (data centre)
  room_hce_exec_hall  smoked oak boards with a navy and amber runner
  room_hce_ceo        smoked oak with an amber and black rug under the desk

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID); a 10x6 hall map uses
rows 0-4 and row 9, so a hall's floor decals live in rows 2-4 (y 64-159).
Each sheet needs a this.load.image line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_hce_tileset.py
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP  # noqa: E402
from make_hospital_tileset import is_floor  # noqa: E402
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402
from make_aes_tileset import base_walls, paint_floor, paint_line, paint_hatch_border, \
    paint_trunking, paint_wear, paint_mat  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32

AMBER = (232, 146, 36)
AMBER_DARK = (176, 104, 24)
GOLD = (208, 168, 72)
NAVY = (30, 42, 80)
NAVY_LIGHT = (48, 62, 108)
CYAN = (60, 176, 206)
BLACK = (34, 32, 40)

FRONT_WALLS = dict(back=(36, 48, 88), side=(50, 64, 108), mortar=None,
                   brand=AMBER, skirting=(52, 54, 60), skirting_dark=(36, 38, 44))
OFFICE_WALLS = dict(back=(196, 192, 184), side=(176, 172, 164), mortar=None,
                    brand=AMBER, skirting=(84, 82, 80), skirting_dark=(60, 58, 58))
TECH_WALLS = dict(back=(30, 64, 78), side=(42, 80, 96), mortar=None,
                  brand=CYAN, skirting=(50, 56, 60), skirting_dark=(34, 38, 42))


# --- floor textures -----------------------------------------------------------

def marble_pixel(x, y):
    """Pale polished marble in 64 px slabs, soft grey veins and a few gold ones."""
    lx, ly = x % 64, y % 64
    if lx == 0 or ly == 0:
        return (184, 182, 176)
    slab = hashxy(x // 64, y // 64)
    base = [(226, 224, 218), (220, 218, 212), (230, 228, 222)][slab % 3]
    # veins: wavy diagonal lines, a different phase per slab
    v = (lx + ly * (1 if slab % 2 else -1) + int(5 * math.sin((lx + slab) / 9.0))) % 41
    if v == 0:
        return (196, 194, 190)
    if v == 20 and slab % 4 == 0:
        return GOLD
    h = hashxy(x, y)
    if h % 37 == 0:
        return shade(base, 0.95)
    return base


CARPET_TRADING = carpet_pixel_fn((92, 104, 132), (82, 94, 122), (106, 118, 146), (100, 112, 140))
CARPET_AISLE = carpet_pixel_fn((122, 132, 158), (112, 122, 148), (136, 146, 170), (128, 138, 162))
CARPET_TAUPE = carpet_pixel_fn((150, 132, 116), (138, 121, 106), (164, 146, 130), (158, 140, 124))


def vinyl_pixel(x, y):
    """Grey lab vinyl, flecked, a welded seam every 2 tiles."""
    if x % 64 == 0:
        return (150, 154, 160)
    h = hashxy(x, y)
    base = (176, 180, 186)
    if h % 23 == 0:
        return (140, 146, 156)
    if h % 41 == 0:
        return (206, 208, 212)
    return base


def raised_fn(base, perf):
    """Raised access floor: 32 px tiles with a dark rim; rows in `perf` are perforated."""
    def fn(x, y):
        lx, ly = x % TILE, y % TILE
        if lx == 0 or (ly == 0 and y != FLOOR_TOP):  # no rim on the first floor row (not a floor line)
            return shade(base, 0.72)
        if lx == 1 or ly == 1:
            return shade(base, 1.08)
        if (y // TILE) in perf and 4 <= lx <= 27 and 4 <= ly <= 27 and lx % 3 == 0 and ly % 3 == 0:
            return shade(base, 0.62)
        h = hashxy(x, y)
        if h % 31 == 0:
            return shade(base, 0.94)
        return base
    return fn


def oak_pixel(x, y):
    """Smoked oak boards running east-west, 8 px wide, staggered butt joints."""
    row = y // 8
    if y % 8 == 3:  # joints off the floor's first row, which must not read as the floor line
        return (86, 60, 38)
    off = (row * 37) % 96
    if (x + off) % 96 == 0:
        return (88, 62, 40)
    tone = hashxy(row, (x + off) // 96) % 3
    base = [(120, 90, 66), (112, 84, 62), (126, 96, 70)][tone]
    if (x * 3 + y * 7 + hashxy(row, 1) % 11) % 23 == 0:
        return shade(base, 0.9)
    return base


# --- decals -------------------------------------------------------------------

def paint_hex_inlay(op, cx, cy, r):
    """The HashChain mark: two linked hexagons, gold rims on navy."""
    def in_hex(x, y, hx, hy, rr):
        dx, dy = abs(x - hx), abs(y - hy)
        return dy <= rr * 0.866 and dx * 0.866 + dy * 0.5 <= rr * 0.866
    for y in range(cy - r - 4, cy + r + 4):
        for x in range(cx - 2 * r, cx + 2 * r):
            for hx in (cx - r * 0.55, cx + r * 0.55):
                if in_hex(x, y, hx, cy, r * 0.62):
                    inner = in_hex(x, y, hx, cy, r * 0.62 - 2)
                    op[x, y] = (*(NAVY if inner else GOLD), 255)
    # the link: a gold bar through both centres
    for x in range(int(cx - r * 0.55), int(cx + r * 0.55) + 1):
        for y in (cy - 1, cy):
            op[x, y] = (*GOLD, 255)
    # circle round it
    for y in range(cy - r - 4, cy + r + 5):
        for x in range(cx - r - 14, cx + r + 15):
            d = math.hypot((x - cx) / 1.5, y - cy)
            if r + 1 <= d < r + 3:
                op[x, y] = (*GOLD, 255)


def paint_rug(op, box, field, border, accent):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not is_floor(x, y):
                continue
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d < 2:
                c = border
            elif d == 3:
                c = accent
            elif d < 6:
                c = border
            else:
                c = field
                if ((x - x0) + (y - y0)) % 12 == 0 or ((x - x0) - (y - y0)) % 12 == 0:
                    c = shade(field, 1.12)
            op[x, y] = (*c, 255)


def paint_runner(op, x0, x1, y0, y1):
    """Navy runner with amber edge lines."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not is_floor(x, y):
                continue
            if y in (y0, y1 - 1):
                c = (24, 30, 58)
            elif y in (y0 + 2, y1 - 3):
                c = AMBER_DARK
            else:
                c = NAVY if (x // 2 + y) % 7 else NAVY_LIGHT
            op[x, y] = (*c, 255)


def paint_floor_box(op, x, y):
    """A brushed-steel floor power box (under the trading desks)."""
    for j in range(6):
        for i in range(10):
            edge = j in (0, 5) or i in (0, 9)
            op[x + i, y + j] = (*((70, 76, 86) if edge else (150, 156, 166)), 255)


def paint_carpet_box(op, box, fn):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if is_floor(x, y):
                op[x, y] = (*fn(x, y), 255)


def main():
    front = base_walls(FRONT_WALLS)
    office = base_walls(OFFICE_WALLS)
    tech = base_walls(TECH_WALLS)
    sheets = {}

    lobby = paint_floor(front, marble_pixel)
    paint_hex_inlay(lobby.load(), 160, 196, 16)
    sheets["room_hce_lobby"] = lobby
    sheets["room_hce_hall"] = paint_floor(front, marble_pixel)

    trading = paint_floor(front, CARPET_TRADING)
    op = trading.load()
    paint_carpet_box(op, (114, 104, 180, 308), CARPET_AISLE)   # the aisle between the desk banks
    for x, y in ((70, 134), (214, 134), (70, 196), (214, 196)):
        paint_floor_box(op, x, y)
    sheets["room_hce_trading"] = trading

    sheets["room_hce_office"] = paint_floor(office, CARPET_TAUPE)

    lab = paint_floor(office, vinyl_pixel)
    paint_trunking(lab.load(), 32, 150, 250, 156)
    sheets["room_hce_lab"] = lab

    sheets["room_hce_servers"] = paint_floor(tech, raised_fn((176, 182, 188), perf={4, 7}))

    vault = paint_floor(tech, raised_fn((140, 148, 156), perf={3}))
    paint_hatch_border(vault.load(), (32, 92, 160, 158), width_px=3)   # round the custody cage (room_hce_vault: panels at y 152)
    sheets["room_hce_vault"] = vault

    hall = paint_floor(front, oak_pixel)
    paint_runner(hall.load(), 32, 288, 112, 150)
    sheets["room_hce_exec_hall"] = hall

    ceo = paint_floor(front, oak_pixel)
    paint_rug(ceo.load(), (92, 96, 228, 200), (60, 44, 34), BLACK, AMBER)
    sheets["room_hce_ceo"] = ceo

    for name, img in sheets.items():
        img.save(OUT_DIR / f"{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
