#!/usr/bin/env python3
"""
Build tiles/rooms/room_hospital.png: a clinical variant of room6.png.

The look (mint walls, green skirting, pale grey-blue vinyl floor) comes from a
PixelLab edit of room6 (scripts/room_gen/pixellab/room6_hospital_edit.png). That
edit drifted a few pixels (narrower side walls, a ~29px floor grid), so rather
than use it directly this script repaints room6's exact geometry with the edit's
palette and lays the floor on the 32px tile grid. Tile indices stay identical to
room6, so a room can switch by pointing its room6 tileset at the new image.

It also writes the floor variants: _carpet (offices, conference room), _exec
(carpet plus a rug, Dr Kim's office), _raised (server room) and _kitchen (staff
room). Builder rooms pick one in HOSPITAL_FLOOR_VARIANTS (generate_rooms.py);
hand rooms with `room_edit.py ROOM floor NAME`. A new variant also needs its
this.load.image line in game.js.

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
# Same walls, warm flecked safety-vinyl sheet with welded seams: staff room / kitchen
OUT_KITCHEN = ROOT / "public/break_escape/assets/tiles/rooms/room_hospital_kitchen.png"
# The carpet with a rug under the desk: executive office (room_hospital_office_cto).
# Room maps lay this 320px sheet out 1:1 (cell x,y of a 10x10 room uses sheet
# cell x,y), so the rug lands at the same pixels in the room and draws under
# every sprite.
OUT_EXEC = ROOT / "public/break_escape/assets/tiles/rooms/room_hospital_exec.png"

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


# Kitchen safety vinyl: an oatmeal sheet floor with dark and quartz flecks and a
# thin heat-welded seam every two tiles (sheet vinyl, so no per-tile grout).
KITCHEN = (208, 197, 176)
KITCHEN_LIGHT = (218, 208, 189)
KITCHEN_FLECK = (163, 147, 126)
KITCHEN_QUARTZ = (126, 150, 158)
KITCHEN_SEAM = (184, 172, 151)


def kitchen_pixel(x, y):
    if x % (2 * TILE) == 0:
        return KITCHEN_SEAM
    h = (x * 73856093) ^ (y * 19349663)
    if h % 31 == 0:
        return KITCHEN_FLECK
    if h % 53 == 0:
        return KITCHEN_QUARTZ
    if h % 11 == 0:
        return KITCHEN_LIGHT
    return KITCHEN


def make_kitchen(hospital):
    out = hospital.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if is_floor(x, y):
                c = kitchen_pixel(x, y)
                if y < FLOOR_TOP + 3:
                    c = tuple(int(v * 0.9) for v in c)
                op[x, y] = (*c, op[x, y][3])
    out.save(OUT_KITCHEN)
    print(f"wrote {OUT_KITCHEN}")


# Rug: navy field, burgundy border between cream lines, a small diamond lattice.
RUG_BOX = (100, 98, 220, 198)  # x0, y0, x1, y1 (exclusive), room pixels; under Dr Kim's desk and visitor chairs
RUG_EDGE = (40, 30, 38)
RUG_CREAM = (214, 200, 168)
RUG_RED = (122, 38, 46)
RUG_RED_DARK = (100, 30, 38)
RUG_NAVY = (40, 52, 84)
RUG_NAVY_LIGHT = (58, 72, 108)


def rug_pixel(x, y):
    x0, y0, x1, y1 = RUG_BOX
    d = min(x - x0, y - y0, x1 - 1 - x, y1 - 1 - y)  # distance in from the rug edge
    if d == 0:
        return RUG_EDGE
    if d in (1, 10):
        return RUG_CREAM
    if 2 <= d <= 9:
        # border band: burgundy with a row of cream dots down its middle
        horiz = min(y - y0, y1 - 1 - y) == d  # on the top or bottom run
        along = (x - x0) if horiz else (y - y0)
        if d == 5 and along % 6 < 2:
            return RUG_CREAM
        return RUG_RED_DARK if d in (2, 9) else RUG_RED
    if d == 11:
        return RUG_RED
    # field: navy with a diamond lattice
    lx, ly = x - x0 - 12, y - y0 - 12
    if (lx + ly) % 12 == 0 or (lx - ly) % 12 == 0:
        return RUG_NAVY_LIGHT
    h = (x * 73856093) ^ (y * 19349663)
    return RUG_NAVY_LIGHT if h % 47 == 0 else RUG_NAVY


def make_exec(carpet):
    out = carpet.copy()
    op = out.load()
    x0, y0, x1, y1 = RUG_BOX
    for y in range(y0, y1):
        for x in range(x0, x1):
            op[x, y] = (*rug_pixel(x, y), op[x, y][3])
    out.save(OUT_EXEC)
    print(f"wrote {OUT_EXEC}")


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
    make_exec(Image.open(OUT_CARPET).convert("RGBA"))
    make_raised(out)
    make_kitchen(out)


if __name__ == "__main__":
    main()
