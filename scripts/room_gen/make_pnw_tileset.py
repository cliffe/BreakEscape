#!/usr/bin/env python3
"""
Build the Pacific Northwest Regional Grid Control room sheets
(tiles/rooms/room_pnw*.png) for m07 "The Architect's Gambit": repaints of room6.png
for the room_pnw_* maps in generate_rooms.py, made the same way as
make_aes_tileset.py, make_hce_tileset.py and make_qdc_tileset.py (whose helpers it
imports; their sheets are not touched).

A public utility's grid control facility outside Portland, at night, mid-evacuation.
One brand colour, an evergreen line along every wall, over six wall treatments:

  front    pale institutional grey (the security checkpoint)
  ops      dark slate blue, so the video wall reads (the operations floor)
  tech     dark teal-graphite (the server hall)
  scada    plum-slate with a red line (SCADA control, restricted)
  plant    painted sage blockwork (the backup generation hall)
  vault    bare board-marked concrete with a yellow line (the cable vault)

Dark walls keep some chroma: check_room_walls reads a dark, near-neutral row as the
floor line.

Floors:

  room_pnw_checkpoint   grey terrazzo, the PNW fir-and-bolt inlay at the spawn, a
                        walk-off mat at the east door
  room_pnw_ops          dark blue carpet tiles, a lighter aisle door to door along
                        the top, and a raised supervisor's dais at the back
  room_pnw_servers      raised access floor, a perforated cold aisle
  room_pnw_scada        dark anti-static tiles
  room_pnw_genhall      blue-grey epoxy (a 640 px sheet cut in two halves), a yellow
                        walkway, hatched keep-clear boxes round the gensets and in
                        front of the transfer switch, fuel-line trunking, drains
  room_pnw_vault        wet concrete with damp patches, a cable trench and a sump

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID); a 10x6 map uses rows 0-4
and row 9, so its floor decals live in rows 2-4 (y 64-159). Decal boxes here must
match the furniture in the room_pnw_* builders. Each sheet needs a this.load.image
line in game.js (tileset name = texture key).

Usage: python3 scripts/room_gen/make_pnw_tileset.py
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_uni_tileset import carpet_pixel_fn, hashxy, shade  # noqa: E402
from make_aes_tileset import base_walls, paint_floor, paint_hatch_border, paint_hatch_box, \
    paint_trunking, paint_line, paint_grate, paint_wear, split_wide, \
    antistatic_pixel, floor_at  # noqa: E402
from make_hce_tileset import raised_fn, paint_carpet_box  # noqa: E402
from room_geometry import FLOOR_TOP, sheet_floor_top  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"
TILE = 32

EVERGREEN = (36, 112, 84)
EVERGREEN_LIGHT = (84, 172, 128)
EVERGREEN_DARK = (22, 70, 52)
AMBER = (230, 150, 40)
YELLOW = (222, 186, 40)
BLACK = (48, 44, 40)
RED = (186, 44, 48)
WHITE = (232, 232, 226)

FRONT_WALLS = dict(back=(206, 208, 202), side=(186, 189, 183), mortar=None,
                   brand=EVERGREEN, skirting=(84, 90, 88), skirting_dark=(62, 68, 66))
OPS_WALLS = dict(back=(58, 70, 96), side=(72, 84, 110), mortar=None,
                 brand=EVERGREEN_LIGHT, skirting=(42, 52, 78), skirting_dark=(32, 40, 66))
TECH_WALLS = dict(back=(44, 74, 80), side=(56, 88, 94), mortar=None,
                  brand=EVERGREEN_LIGHT, skirting=(32, 56, 62), skirting_dark=(24, 44, 50))
SCADA_WALLS = dict(back=(84, 56, 98), side=(98, 70, 112), mortar=None,
                   brand=RED, skirting=(62, 40, 66), skirting_dark=(52, 30, 56))
PLANT_WALLS = dict(back=(178, 188, 170), side=(160, 170, 152), mortar=(158, 168, 150),
                   brand=EVERGREEN, skirting=(96, 104, 90), skirting_dark=(72, 80, 68))
VAULT_WALLS = dict(back=(146, 144, 136), side=(128, 126, 120), mortar=None,
                   brand=YELLOW, skirting=(92, 90, 84), skirting_dark=(70, 68, 64))


# --- walls ---------------------------------------------------------------------

def board_marked(img, wall_rgb, side_rgb):
    """Bare concrete: mottle the flat wall colours and add faint shutter-board lines
    every 10 px on the back wall (the vault). Only pixels still exactly the wall colour
    change, so the brand line and skirting stay."""
    op = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = op[x, y]
            if (r, g, b) not in (wall_rgb, side_rgb):
                continue
            m = hashxy(x // 5, y // 4) % 4
            c = shade((r, g, b), (0.95, 1.0, 1.03, 0.98)[m])
            if (r, g, b) == wall_rgb and 12 <= y < FLOOR_TOP - 8 and (y - 12) % 10 == 9:
                c = shade((r, g, b), 0.9)
            if hashxy(x, y) % 53 == 0:
                c = shade(c, 0.86)
            op[x, y] = (*c, a)
    return img


# --- floor textures -------------------------------------------------------------

def terrazzo_pixel(x, y):
    """Grey terrazzo in 64 px bays, with green and white aggregate."""
    if x % 64 == 0 or y % 64 == 0:
        return (150, 154, 150)
    h = hashxy(x, y)
    base = (184, 188, 184)
    if h % 17 == 0:
        return (140, 146, 142)
    if h % 23 == 0:
        return (220, 222, 216)
    if h % 37 == 0:
        return (92, 140, 112)
    return base


CARPET_OPS = carpet_pixel_fn((66, 80, 112), (58, 71, 100), (80, 94, 126), (54, 66, 94))
CARPET_AISLE = carpet_pixel_fn((92, 106, 136), (84, 97, 126), (106, 120, 150), (80, 92, 120))


def dais_pixel(x, y):
    """The supervisor's raised dais: grey-blue vinyl."""
    h = hashxy(x, y)
    base = (118, 126, 146)
    if h % 19 == 0:
        return (102, 110, 130)
    if h % 43 == 0:
        return (138, 146, 164)
    return base


def scada_tile_pixel(x, y):
    """Dark anti-static tiles: antistatic_pixel pushed down and towards blue-violet."""
    r, g, b = antistatic_pixel(x, y)
    return (max(0, r - 58), max(0, g - 62), max(0, b - 30))


def epoxy_pixel(x, y):
    """Blue-grey plant-room epoxy, lightly flecked."""
    base = (126, 136, 148)
    h = hashxy(x, y)
    if h % 29 == 0:
        return shade(base, 0.9)
    if h % 47 == 0:
        return shade(base, 1.08)
    return base


def wet_concrete_pixel(x, y):
    """Vault concrete: mottled, a saw cut every 3 tiles, damp darkening in soft blobs."""
    if x % 96 == 0 or y % 96 == 0:
        return (110, 110, 104)
    m = hashxy(x // 6, y // 6) % 5
    base = [(146, 144, 136), (140, 138, 131), (150, 148, 140), (136, 134, 128), (144, 142, 134)][m]
    damp = math.sin(x / 23.0) + math.cos(y / 17.0) + math.sin((x + y) / 31.0)
    if damp > 1.6:
        base = shade(base, 0.86)
    h = hashxy(x, y)
    if h % 13 == 0:
        return shade(base, 0.92)
    return base


# --- decals ---------------------------------------------------------------------

def paint_pnw_inlay(op, cx, cy, r):
    """The PNW Grid mark set in the terrazzo: an evergreen ring, a fir tree and an
    amber bolt across it."""
    for y in range(cy - r - 2, cy + r + 3):
        for x in range(cx - r - 2, cx + r + 3):
            d = math.hypot(x - cx, (y - cy) * 1.2)
            if r - 3 <= d < r:
                op[x, y] = (*EVERGREEN, 255)
            elif r <= d < r + 1:
                op[x, y] = (*EVERGREEN_DARK, 255)
    # fir: three stacked triangles and a trunk
    for tier, (top, half) in enumerate(((cy - 11, 4), (cy - 6, 7), (cy - 1, 10))):
        for j in range(6):
            w = int(half * (j + 1) / 6)
            for x in range(cx - w, cx + w + 1):
                op[x, top + j] = (*EVERGREEN_DARK, 255)
    for y in range(cy + 5, cy + 9):
        op[cx, y] = (*(92, 64, 40), 255)
        op[cx - 1, y] = (*(92, 64, 40), 255)
    # amber bolt, upper right to lower left
    pts = [(cx + 8, cy - 12), (cx + 1, cy - 1), (cx + 5, cy - 1), (cx - 4, cy + 11)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(abs(x1 - x0), abs(y1 - y0))
        for k in range(n + 1):
            x = round(x0 + (x1 - x0) * k / n)
            y = round(y0 + (y1 - y0) * k / n)
            op[x, y] = (*AMBER, 255)
            op[x + 1, y] = (*AMBER, 255)


def paint_box_fn(op, box, fn, width=320, edge=None):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            c = fn(x, y)
            if edge and (x in (x0, x1 - 1) or y in (y0, y1 - 1)):
                c = edge
            op[x, y] = (*c, 255)


def paint_trench(op, box):
    """A cable trench with a chequer-plate lid: steel, a dark rim, raised diamonds."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y):
                continue
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d == 0:
                c = (70, 72, 74)
            elif (x - x0) % 32 == 0:
                c = (88, 90, 92)
            elif ((x - x0) + 2 * (y - y0)) % 6 in (0,) and ((x - x0) - 2 * (y - y0)) % 6 in (0,):
                c = (168, 172, 174)
            else:
                c = (122, 126, 128)
            op[x, y] = (*c, 255)


def paint_walkoff_mat(op, box):
    """A ribbed walk-off mat: mid grey-green with a darker rim (a near-black mat read
    as a hole in the floor in cycle 1)."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            if d < 1:
                c = (128, 136, 130)
            else:   # cycle 2: flat and close to the terrazzo, so it doesn't read as a shutter
                c = (156, 164, 158) if (x + y) % 4 else (148, 156, 150)
            op[x, y] = (*c, 255)


def paint_open_trench(op, box):
    """A trench with its lid off: a dark pit, a shadow under the north edge, a lit
    lip on the south, and three trunk cables that sag and stop short of the ends,
    the middle one a thicker orange HV run cut through with copper on both faces
    (lighting stage, dressing c5 m-3: even, straight cables read as a vent grille)."""
    x0, y0, x1, y1 = box
    w = x1 - x0
    cut0, cut1 = x0 + 21, x0 + 24                       # a 4 px gap in the HV run

    def sag(x):                                          # 0 at the ends, 1 px in the middle
        return 1 if w // 4 <= x - x0 <= w - 1 - w // 4 else 0

    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y):
                continue
            d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)
            ly = y - y0
            c = (40, 40, 42)                                   # the pit
            if y >= y1 - 2:
                c = (182, 178, 164) if y == y1 - 2 else (150, 146, 136)   # lit concrete lip, 2 px
            elif d == 0:
                c = (90, 90, 88)
            elif ly in (1, 2):
                c = (22, 22, 24)                               # shadow under the north edge
            else:
                s = sag(x)
                # thin grey cable, stops 3 px short of the west end
                if ly == 3 + s and x >= x0 + 4:
                    c = (84, 86, 94)
                # the HV run: 3 px, orange sheath, cut through
                elif 5 + s <= ly <= 7 + s and x0 + 2 <= x <= x1 - 3:
                    if cut0 < x < cut1:
                        c = (30, 30, 32)                       # the gap
                    elif x in (cut0, cut1):
                        c = (226, 146, 70) if ly == 6 + s else (184, 104, 44)   # copper faces
                    else:
                        c = (232, 112, 40) if ly == 5 + s else ((196, 84, 30) if ly == 6 + s else (140, 58, 22))
                # thin black cable, stops 5 px short of the east end
                elif ly in (9 + s, 10 + s) and x <= x1 - 6:
                    c = (70, 70, 76) if ly == 9 + s else (46, 46, 52)
            op[x, y] = (*c, 255)


def paint_lid(op, box):
    """A chequer-plate trench lid lying on the floor, with a dark shadow edge."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if not floor_at(x, y):
                continue
            if y == y1 or x == x1:
                c = (84, 84, 80)
            elif x in (x0, x1 - 1) or y in (y0, y1 - 1):
                c = (70, 72, 74)
            elif ((x - x0) + 2 * (y - y0)) % 6 == 0 and ((x - x0) - 2 * (y - y0)) % 6 == 0:
                c = (176, 180, 182)
            else:
                c = (128, 132, 134)
            op[x, y] = (*c, 255)


def paint_puddle(op, cx, cy, rx, ry):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if k <= 1 and floor_at(x, y):
                r, g, b, a = op[x, y]
                c = shade((r, g, b), 0.78)
                if k < 0.25 and hashxy(x, y) % 9 == 0:
                    c = (178, 186, 190)   # a glint
                op[x, y] = (*c, a)


# --- sheets ---------------------------------------------------------------------

def genhall_sheet(walls):
    """Backup generation hall, 640 px wide (generate_rooms.room_pnw_genhall).
    West: the N-door and S-door lane x 32-84 (a yellow walkway line beside it). Back
    wall kit x 92-232 (transfer switch, plant log, genset control panel) with a hatched
    keep-clear box in front of it, y 66-118. Three gensets x 248-312, 352-416, 456-520,
    feet 206, each in a hatched box; fuel trunking from the day tank (x 552, feet 132)
    along y 216 to each set. The vault covers rows 8-9 on the west half."""
    img = paint_floor(walls, epoxy_pixel, width=640)
    op = img.load()
    W = 640
    paint_wear(op, (32, 64, 100, 124), width=W)            # N door
    paint_wear(op, (32, 200, 96, 256), width=W)            # S door lane
    paint_line(op, 86, 64, 88, 256, width=W)               # walkway edge, N door to S door
    paint_line(op, 86, 128, 600, 130, width=W)             # the hall's main walkway, north edge
    paint_line(op, 86, 238, 600, 240, width=W)             # south edge
    paint_hatch_border(op, (92, 66, 236, 118), width_px=3, width=W)   # in front of the ATS and panels
    for x0 in (240, 344, 448):
        paint_hatch_border(op, (x0, 140, x0 + 80, 214), width_px=3, width=W)
    paint_hatch_box(op, (536, 66, 604, 140), colours=(YELLOW, BLACK), width=W)  # the fuel day tank bund
    paint_trunking(op, 280, 216, 560, 222, width=W, dark=True)        # fuel line under the sets
    paint_trunking(op, 554, 140, 560, 222, width=W, dark=True)
    for x, y in ((150, 200), (330, 280), (520, 280), (600, 240)):
        paint_grate(op, x, y, width=W)
    paint_wear(op, (240, 214, 540, 238), width=W, strength=0.94)
    return img


def main():
    front = base_walls(FRONT_WALLS)
    ops_w = base_walls(OPS_WALLS)
    tech = base_walls(TECH_WALLS)
    scada_w = base_walls(SCADA_WALLS)
    plant_wide = base_walls(PLANT_WALLS, width=640)
    vault_w = board_marked(base_walls(VAULT_WALLS), VAULT_WALLS["back"], VAULT_WALLS["side"])
    sheets = {}

    cp = paint_floor(front, terrazzo_pixel)
    op = cp.load()
    paint_pnw_inlay(op, 160, 170, 20)
    paint_walkoff_mat(op, (250, 70, 286, 106))          # walk-off mat in the east door mouth
    paint_line(op, 32, 252, 186, 254, c=YELLOW)          # the screening lane's queue line
    sheets["room_pnw_checkpoint"] = cp

    ops = paint_floor(ops_w, CARPET_OPS)
    op = ops.load()
    paint_carpet_box(op, (32, 64, 288, 112), CARPET_AISLE)   # the aisle, W door to E door
    paint_box_fn(op, (96, 248, 224, 306), dais_pixel, edge=(88, 96, 116))   # the supervisor's dais
    paint_line(op, 96, 248, 224, 250, c=AMBER)               # its nosing
    sheets["room_pnw_ops"] = ops

    sv = paint_floor(tech, raised_fn((168, 182, 180), perf={3}))   # the cold aisle between the rack rows (cycle 2, m9)
    sheets["room_pnw_servers"] = sv

    sheets["room_pnw_scada"] = paint_floor(scada_w, scada_tile_pixel)

    w, e = split_wide(genhall_sheet(plant_wide))
    sheets["room_pnw_genhall_w"] = w
    sheets["room_pnw_genhall_e"] = e

    vt = paint_floor(vault_w, wet_concrete_pixel)
    op = vt.load()
    paint_trench(op, (64, 66, 288, 80))                 # the trunk runs come up out of this
    paint_open_trench(op, (122, 66, 162, 80))           # one plate lifted where Park works (cycle 2, m18)
    paint_lid(op, (166, 84, 198, 97))                   # the lifted plate, laid on the floor
    paint_puddle(op, 270, 150, 14, 6)
    paint_puddle(op, 96, 168, 10, 4)
    paint_grate(op, 262, 160)
    sheets["room_pnw_vault"] = vt

    for name, img in sheets.items():
        path = OUT_DIR / f"{name}.png"
        img.save(path)
        top = sheet_floor_top(path)
        print(f"wrote {path.relative_to(ROOT)} (floor top {top})")
        if not name.endswith("_e") and top != FLOOR_TOP:
            sys.exit(f"{name}: floor starts at {top}, want {FLOOR_TOP}")


if __name__ == "__main__":
    main()
