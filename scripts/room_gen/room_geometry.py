#!/usr/bin/env python3
"""
The standard room geometry every room tileset and map follows, and helpers to
check or correct it.

A north wall is always 2 tiles high. In a 32px room sheet that means:
  - rows 0-63 are the back wall (the white frame at the top, then the wall face)
  - rows 62-63 are the dark floor line, where the wall meets the floor
  - the floor starts at row 64, level with the bottom of a north door
    (door sprites are 32x64 and drawn over rows 0-63 of their tile column)

m01's office sheet (tiles/rooms/room1.png) is the reference. Older sheets such
as room6 drew the wall foot lower (line at rows 68-69); raise_back_wall() moves
a sheet's wall foot up to the standard without rescaling anything.

Used by make_hospital_tileset.py and check_room_walls.py.
"""
from PIL import Image

TILE = 32
BACK_WALL_TILES = 2
FLOOR_TOP = TILE * BACK_WALL_TILES      # 64: first floor row
FLOOR_LINE = (FLOOR_TOP - 2, FLOOR_TOP - 1)  # rows 62-63: the dark line
DARK_LUMA = 100   # the floor line is a near-black, near-neutral grey
LINE_CHROMA = 36  # ...unlike a dark coloured floor (room1's purple) or a dark skirting


def luma(rgb):
    r, g, b = rgb[:3]
    return (299 * r + 587 * g + 114 * b) // 1000


def is_line(rgb):
    r, g, b = rgb[:3]
    return luma(rgb) < DARK_LUMA and max(r, g, b) - min(r, g, b) < LINE_CHROMA


def floor_top(column):
    """First floor row in a list of (r, g, b[, a]) pixels running down from the top of a
    room, searched between rows 40 and 74 (the wall foot is always near the 2-tile line).

    The floor starts after the floor line, unless the wall itself carries on below that
    line (the colour just under it matches the wall just above it): that is a sheet with
    a low wall foot drawn under a standard one, so the real edge is the next line down.
    Returns None if no line is found."""
    end = min(len(column), FLOOR_TOP + 10)  # a low wall foot is a few px down; a door frame at 80 is not one
    y = 40
    result = None
    while y < end:
        if not is_line(column[y]):
            y += 1
            continue
        wall = column[y - 1][:3]
        while y < end and is_line(column[y]):
            y += 1
        if y >= end:
            break  # still dark at the window edge: a frame or furniture, not a floor line
        result = y
        below = column[y][:3] if y < end else None
        if below is None or sum(abs(a - b) for a, b in zip(below, wall)) > 24:
            break  # floor, not more wall
    return result


def raise_back_wall(img, current_top, band=10):
    """Move the foot of the back wall (skirting and floor line: the `band` rows above
    current_top) up so the floor starts at FLOOR_TOP, across the full sheet width. The
    rows this frees are filled from the rows just below, so the floor continues; the
    side walls are vertical strips there, so they are unaffected. Returns a new image."""
    shift = current_top - FLOOR_TOP
    if shift <= 0:
        return img.copy()
    src = img.copy()
    out = img.copy()
    sp, op = src.load(), out.load()
    for x in range(img.width):
        for y in range(FLOOR_TOP - band, current_top):
            op[x, y] = sp[x, y + shift]
    return out


def sheet_floor_top(path, x=160):
    """Floor top of a room sheet (a 320x320 room picture) at column x."""
    im = Image.open(path).convert("RGB")
    return floor_top([im.getpixel((x, y)) for y in range(min(im.height, 3 * TILE))])
