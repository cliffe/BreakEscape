#!/usr/bin/env python3
"""
Build tiles/rooms/room_hospital.png: a clinical variant of room6.png.

The look (mint walls, green skirting, pale grey-blue vinyl floor) comes from a
PixelLab edit of room6 (scripts/room_gen/pixellab/room6_hospital_edit.png). That
edit drifted a few pixels (narrower side walls, a ~29px floor grid), so rather
than use it directly this script repaints room6's exact geometry with the edit's
palette and lays the floor on the 32px tile grid. Tile indices stay identical to
room6, so a room can switch by pointing its room6 tileset at the new image.

Usage: python3 scripts/room_gen/make_hospital_tileset.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/break_escape/assets/tiles/rooms/room6.png"
OUT = ROOT / "public/break_escape/assets/tiles/rooms/room_hospital.png"
# Same walls, blue-grey carpet tiles: offices and the conference room (non-clinical areas)
OUT_CARPET = ROOT / "public/break_escape/assets/tiles/rooms/room_hospital_carpet.png"
# Same walls, raised access floor with a row of perforated vent tiles: server room
OUT_RAISED = ROOT / "public/break_escape/assets/tiles/rooms/room_hospital_raised.png"

# Palette sampled from the PixelLab edit
BACK_WALL = (180, 218, 206)
SIDE_WALL = (163, 203, 190)   # darker than the back wall, as room6 does
SKIRTING = (115, 165, 143)
SKIRTING_DARK = (77, 117, 98)
FLOOR = (202, 215, 221)
FLOOR_LIGHT = (221, 232, 236)
FLOOR_SPECK = (189, 203, 211)
GROUT = (170, 186, 196)

# room6 geometry (px)
FLOOR_TOP = 70          # first floor row under the back wall
TILE = 32


FLOOR_BOX = (32, FLOOR_TOP, 288, 308)  # x0, y0, x1, y1 (exclusive); inside room6's outline


def is_floor(x, y):
    x0, y0, x1, y1 = FLOOR_BOX
    return x0 <= x < x1 and y0 <= y < y1


def floor_pixel(x, y):
    if x % TILE == 0 or y % TILE == 0:
        return GROUT
    if x % TILE == 1 or y % TILE == 1:
        return FLOOR_LIGHT
    # sparse, deterministic speckle so repeated tiles don't look stamped
    h = (x * 73856093) ^ (y * 19349663)
    if h % 37 == 0:
        return FLOOR_SPECK
    return FLOOR


# Carpet tiles: each 32px tile has a woven grain, laid quarter-turned like real
# office carpet tiles (grain alternates horizontal/vertical in a checkerboard).
CARPET = (133, 143, 158)
CARPET_DARK = (121, 131, 146)
CARPET_LIGHT = (146, 155, 169)
CARPET_SEAM = (113, 122, 137)


def carpet_pixel(x, y):
    tx, ty = x // TILE, y // TILE
    lx, ly = x % TILE, y % TILE
    if lx == 0 or ly == 0:
        return CARPET_SEAM
    h = (x * 73856093) ^ (y * 19349663)
    # grain: every third row (or column) is a shade darker
    along = ly if (tx + ty) % 2 == 0 else lx
    across = lx if (tx + ty) % 2 == 0 else ly
    if along % 3 == 0 and (across + along) % 4 != 0:
        c = CARPET_DARK
    else:
        c = CARPET
    if h % 23 == 0:
        c = CARPET_LIGHT
    elif h % 29 == 0:
        c = CARPET_DARK
    return c


def make_carpet(hospital):
    out = hospital.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if is_floor(x, y):
                c = carpet_pixel(x, y)
                if y < FLOOR_TOP + 3:
                    c = tuple(int(v * 0.88) for v in c)
                op[x, y] = (*c, op[x, y][3])
    out.save(OUT_CARPET)
    print(f"wrote {OUT_CARPET}")


# Raised access floor: bevelled grey 32px panels; the tile row y 128-160 (row 4,
# the cold aisle in front of room_hospital_servers' second rack row) is perforated.
RAISED = (196, 200, 204)
RAISED_HI = (222, 225, 228)
RAISED_SH = (168, 173, 178)
RAISED_SEAM = (126, 132, 139)
RAISED_HOLE = (138, 145, 153)
PERFORATED_ROWS = {4}


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
    h = (x * 73856093) ^ (y * 19349663)
    if h % 41 == 0:
        return RAISED_SH
    return RAISED


def make_raised(hospital):
    out = hospital.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if is_floor(x, y):
                c = raised_pixel(x, y)
                if y < FLOOR_TOP + 3:
                    c = tuple(int(v * 0.9) for v in c)
                op[x, y] = (*c, op[x, y][3])
    out.save(OUT_RAISED)
    print(f"wrote {OUT_RAISED}")


def main():
    src = Image.open(SRC).convert("RGBA")
    out = src.copy()
    sp, op = src.load(), out.load()
    back_wall_grey = sp[160, 40][:3]
    side_wall_grey = sp[20, 200][:3]

    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            rgb = (r, g, b)
            if is_floor(x, y):
                c = floor_pixel(x, y)
                # soft shadow along the foot of the back wall
                if y < FLOOR_TOP + 3:
                    c = tuple(int(v * 0.92) for v in c)
                op[x, y] = (*c, a)
            elif rgb == back_wall_grey:
                c = BACK_WALL
                if y in (FLOOR_TOP - 5, FLOOR_TOP - 4):
                    c = SKIRTING
                elif y == FLOOR_TOP - 3:
                    c = SKIRTING_DARK
                op[x, y] = (*c, a)
            elif rgb == side_wall_grey:
                op[x, y] = (*SIDE_WALL, a)
    out.save(OUT)
    print(f"wrote {OUT}")
    make_carpet(out)
    make_raised(out)


if __name__ == "__main__":
    main()
