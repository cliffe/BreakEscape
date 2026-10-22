#!/usr/bin/env python3
"""
Build the m10 "Full Disclosure" room sheets (tiles/rooms/room_m10_*.png): repaints
of room6.png for the room_m10_* maps (builders in room_gen/m10_rooms.py), made the
same way as make_m09_tileset.py (whose helpers it imports; no other mission's
sheet is touched).

Tomb Gamma: a 1962 civil-defence bunker under a Montana ridge, refitted by ENTROPY.
The old fabric is painted concrete (institutional green below, cream above, a
civil-defence yellow line); the refit is grey: raised floor, cable trays, new
lino. Outside, the forward post is a gravel apron under a rock face, fenced, at
night.

  room_m10_forward_w/_e  rock face behind chain-link (640 px, two halves); night
                         gravel, a vehicle track from the road (W), tyre marks,
                         a hatched apron at the blast door (E)
  room_m10_tunnel        painted concrete, yellow band; wet concrete with a drain
                         channel down the middle
  room_m10_security      1960s green-and-cream paint; refit grey lino, worn at
                         the doors
  room_m10_workshop      blockwork, painted; grey epoxy, hatched bench zones
  room_m10_power         old green paint; red-oxide floor, keep-clear lines in
                         front of the switchgear, the battery room's mesh down the
                         east wall
  room_m10_hall_w/_e     the old command room (640 px): dark slate paint, a
                         yellow line; the refit's raised floor, the plotting
                         dais's outline still on it
  room_m10_gallery       dark concrete; steel tread plate walkway with a rail
                         line at the slit windows
  room_m10_core          bare concrete, nothing else

Every sheet keeps room6's tile layout (ROOM6_FIRSTGID). Each needs a
this.load.image line in game.js.

Usage: python3 scripts/room_gen/make_m10_tileset.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_uni_tileset import hashxy, shade  # noqa: E402
from make_aes_tileset import (base_walls, paint_floor, paint_hatch_border, paint_line,  # noqa: E402
                              paint_wear, paint_grate, concrete_pixel, antistatic_pixel,
                              split_wide, floor_at)
from make_m09_tileset import paint_box_fn, paint_stain, paint_chainlink  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/break_escape/assets/tiles/rooms"

CD_YELLOW = (214, 178, 40)     # civil-defence yellow, the 1962 line
BLACK = (40, 36, 30)
WHITE = (220, 218, 206)

ROCK_WALLS = dict(back=(84, 80, 76), side=(74, 72, 70), mortar=None,
                  brand=(64, 62, 60), skirting=(56, 54, 52), skirting_dark=(44, 42, 40))
TUNNEL_WALLS = dict(back=(150, 152, 138), side=(136, 140, 126), mortar=None,
                    brand=CD_YELLOW, skirting=(84, 98, 82), skirting_dark=(62, 74, 60))
GREEN_CREAM_WALLS = dict(back=(196, 192, 166), side=(176, 174, 150), mortar=None,
                         brand=CD_YELLOW, skirting=(86, 110, 88), skirting_dark=(62, 82, 64))
BLOCK_WALLS = dict(back=(160, 160, 150), side=(146, 146, 138), mortar=(136, 136, 128),
                   brand=CD_YELLOW, skirting=(86, 88, 84), skirting_dark=(64, 66, 62))
POWER_WALLS = dict(back=(118, 140, 116), side=(108, 130, 106), mortar=(100, 122, 98),
                   brand=CD_YELLOW, skirting=(70, 84, 68), skirting_dark=(52, 62, 50))
HALL_WALLS = dict(back=(96, 108, 128), side=(88, 100, 120), mortar=None,
                  brand=CD_YELLOW, skirting=(52, 58, 66), skirting_dark=(40, 44, 50))
GALLERY_WALLS = dict(back=(110, 112, 118), side=(100, 102, 108), mortar=None,
                     brand=(70, 72, 74), skirting=(60, 62, 64), skirting_dark=(46, 48, 50))
CORE_WALLS = dict(back=(150, 148, 142), side=(140, 138, 132), mortar=None,
                  brand=(128, 126, 120), skirting=(110, 108, 102), skirting_dark=(92, 90, 86))


# --- floor textures -----------------------------------------------------------

def gravel_pixel(x, y):
    """Night gravel: warm grey-brown chips (kept off near-black so check_room_walls
    never reads a floor row as the floor line)."""
    h = hashxy(x, y)
    base = (118, 112, 100)
    if h % 5 == 0:
        return (118, 102, 80)
    if h % 7 == 0:
        return (134, 128, 116)
    if h % 29 == 0:
        return (150, 144, 130)
    if h % 37 == 0:
        return (116, 96, 72)
    return base


def track_pixel(x, y):
    """The vehicle track: packed, darker, fewer chips."""
    return shade(gravel_pixel(x, y), 0.9)


def wet_concrete_pixel(x, y):
    c = concrete_pixel(x, y)
    h = hashxy(x * 7 + 3, y * 3 + 1)
    c = shade(c, 0.86)
    if h % 17 == 0:
        c = shade(c, 0.9)
    return c


def lino_grey_pixel(x, y):
    """Refit lino: flat grey, faint 32 px seams, a few scuffs."""
    if x % 64 == 0 or y % 64 == 0:
        return (142, 146, 146)
    h = hashxy(x, y)
    base = (160, 164, 162)
    if h % 13 == 0:
        return (150, 154, 152)
    if h % 47 == 0:
        return (172, 176, 174)
    return base


def epoxy_grey_pixel(x, y):
    h = hashxy(x, y)
    base = (136, 140, 140)
    if h % 9 == 0:
        return (128, 132, 132)
    if h % 41 == 0:
        return (150, 154, 152)
    return base


def red_oxide_pixel(x, y):
    """The plant room's old red-oxide floor paint, worn to concrete in places."""
    h = hashxy(x, y)
    base = (138, 76, 62)
    if h % 6 == 0:
        return (126, 70, 58)
    if h % 23 == 0:
        return (150, 132, 118)   # worn through
    if h % 31 == 0:
        return (150, 86, 70)
    return base


def raised_floor_pixel(x, y):
    """The refit's raised floor: 32 px grey panels, dark seams, a vent panel now and then."""
    lx, ly = x % 32, y % 32
    if lx == 0 or ly == 0:
        return (100, 110, 128)
    if lx == 31 or ly == 31:
        return (112, 118, 124)
    tx, ty = x // 32, y // 32
    if hashxy(tx, ty) % 7 == 0 and 6 <= lx <= 25 and 6 <= ly <= 25 and (lx + ly) % 3 == 0:
        return (104, 110, 116)
    return (134, 140, 146)


def tread_plate_pixel(x, y):
    """Steel tread plate: grey with raised diagonal bars in a herringbone."""
    base = (126, 130, 134)
    lx, ly = x % 8, y % 8
    bump = (lx == ly or lx == ly + 1) if (x // 8 + y // 8) % 2 == 0 else (lx == 7 - ly or lx == 6 - ly)
    if bump:
        return (156, 160, 164)
    if hashxy(x, y) % 23 == 0:
        return (116, 120, 124)
    return base


def bare_concrete_pixel(x, y):
    return shade(concrete_pixel(x, y), 0.96)


# --- decals -------------------------------------------------------------------

def paint_band(img, y0, y1, colour, width=320):
    """A painted band across the back wall and down the side strips (y0..y1 on the back
    wall; the side strips get the same colour at the same offset from the floor)."""
    op = img.load()
    for y in range(y0, y1):
        for x in range(12, width - 12):
            if not floor_at(x, y, width):
                op[x, y] = (*colour, 255)


def paint_two_tone(img, split_y, lower, width=320):
    """1960s two-tone paint: the lower back wall (split_y..skirting) in `lower`."""
    op = img.load()
    for y in range(split_y, 57):
        for x in range(12, width - 12):
            r, g, b, a = op[x, y]
            if not floor_at(x, y, width) and (r, g, b) not in ((40, 36, 30),):
                op[x, y] = (*lower, a)


def paint_rock(img, width=320):
    """A rough rock face over the back wall (y 12..56): mottled, cracked."""
    op = img.load()
    for y in range(12, 57):
        for x in range(12, width - 12):
            h = hashxy(x // 3, y // 3)
            # warm, light enough that check_room_walls never reads the face as the floor line
            c = (132, 118, 98)
            if h % 3 == 0:
                c = (146, 132, 110)
            if h % 7 == 0:
                c = (116, 104, 88)
            if hashxy(x, y) % 53 == 0:
                c = (112, 92, 68)
            op[x, y] = (*c, 255)


def paint_channel(op, x0, y0, x1, y1, width=320):
    """A drainage channel: a dark slot with a lighter lip."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            if y in (y0, y1 - 1):
                op[x, y] = (150, 152, 146, 255)
            elif (x // 4) % 2 == 0:
                op[x, y] = (54, 58, 58, 255)
            else:
                op[x, y] = (70, 74, 74, 255)


def paint_outline(op, box, c=CD_YELLOW, width=320):
    x0, y0, x1, y1 = box
    paint_line(op, x0, y0, x1, y0 + 2, c=c, width=width)
    paint_line(op, x0, y1 - 2, x1, y1, c=c, width=width)
    paint_line(op, x0, y0, x0 + 2, y1, c=c, width=width)
    paint_line(op, x1 - 2, y0, x1, y1, c=c, width=width)


def paint_dais(op, box, width=320):
    """A raised slab: a lighter top, a 2 px lit lip along its back, a 3 px shadowed front
    edge, and a short step at its east end."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not floor_at(x, y, width):
                continue
            r, g, b, a = op[x, y]
            if y >= y1 - 3:
                op[x, y] = (*shade((r, g, b), 0.7), a)
            elif x >= x1 - 3:
                op[x, y] = (*shade((r, g, b), 0.8), a)
            else:
                op[x, y] = (min(255, r + 18), min(255, g + 16), min(255, b + 12), a)
    for y in range(y1 - 14, y1):                       # the step
        for x in range(x1, x1 + 12):
            if floor_at(x, y, width):
                r, g, b, a = op[x, y]
                op[x, y] = (*shade((r, g, b), 0.85 if y >= y1 - 3 else 1.06), a)


# --- sheets ---------------------------------------------------------------------

def forward_sheet():
    img = paint_floor(base_walls(ROCK_WALLS, width=640), gravel_pixel, width=640, shadow=0.97)
    paint_rock(img, width=640)
    op = img.load()
    paint_box_fn(op, (32, 132, 330, 172), track_pixel, width=640)        # the track in from the road
    for x0 in (40, 90):
        paint_box_fn(op, (x0, 100, x0 + 6, 300), track_pixel, width=640)
    paint_hatch_border(op, (548, 64, 610, 124), width_px=4, colours=(CD_YELLOW, BLACK), width=640)  # blast door apron
    paint_box_fn(op, (586, 68, 606, 120), tread_plate_pixel, width=640)   # R3 F1: the door's steel threshold
    paint_grate(op, 560, 88, width=640)                                    # and a drain in the apron
    paint_stain(op, 80, 120, 14, 6, width=640)
    paint_stain(op, 92, 246, 14, 6, width=640)
    paint_wear(op, (450, 64, 610, 180), width=640, strength=0.93)        # feet at the gate
    img = paint_chainlink(img, width=640, y0=30, y1=56, post_every=64)  # the fence in front of the rock
    return img


def tunnel_sheet():
    img = paint_floor(base_walls(TUNNEL_WALLS), wet_concrete_pixel, shadow=0.85)
    paint_two_tone(img, 36, (100, 122, 100))
    paint_band(img, 34, 36, CD_YELLOW)
    op = img.load()
    paint_channel(op, 32, 150, 288, 156)
    paint_wear(op, (32, 64, 96, 120))
    paint_wear(op, (224, 64, 288, 120))
    paint_stain(op, 150, 120, 20, 7, f=0.88)
    return img


def security_sheet():
    img = paint_floor(base_walls(GREEN_CREAM_WALLS), lino_grey_pixel, shadow=0.9)
    paint_two_tone(img, 38, (110, 140, 112))
    paint_band(img, 36, 38, CD_YELLOW)
    op = img.load()
    paint_wear(op, (32, 64, 96, 120))
    paint_wear(op, (32, 196, 80, 256))
    return img


def workshop_sheet():
    img = paint_floor(base_walls(BLOCK_WALLS), epoxy_grey_pixel, shadow=0.9)
    op = img.load()
    paint_hatch_border(op, (240, 236, 288, 290), width_px=3, colours=(CD_YELLOW, BLACK))   # the cracker rack's bay
    paint_wear(op, (32, 64, 96, 120))
    paint_wear(op, (232, 64, 288, 120))
    paint_grate(op, 270, 270)
    return img


def power_sheet():
    img = paint_floor(base_walls(POWER_WALLS), red_oxide_pixel, shadow=0.88)
    op = img.load()
    paint_hatch_border(op, (110, 76, 276, 104), width_px=3, colours=(CD_YELLOW, BLACK))   # R3 P4: keep clear of the panels
    paint_hatch_border(op, (96, 244, 220, 290), width_px=3, colours=(CD_YELLOW, BLACK))   # the battery bay
    paint_wear(op, (32, 64, 96, 120))
    paint_wear(op, (224, 64, 288, 120))
    return img


def hall_sheet():
    walls = base_walls(HALL_WALLS, width=640)
    paint_band(walls, 36, 38, CD_YELLOW, width=640)
    img = paint_floor(walls, raised_floor_pixel, width=640, shadow=0.95)
    op = img.load()
    paint_dais(op, (92, 64, 216, 108), width=640)                          # R3 H1: the old plotting dais, a raised step
    paint_wear(op, (32, 64, 96, 120), width=640)
    paint_wear(op, (548, 64, 608, 120), width=640)
    return img


def gallery_sheet():
    img = paint_floor(base_walls(GALLERY_WALLS), tread_plate_pixel, shadow=0.85)
    op = img.load()
    paint_line(op, 32, 66, 288, 68, c=(70, 74, 78))      # the rail's shadow along the windows
    paint_line(op, 32, 158, 288, 160, c=CD_YELLOW)       # walkway edge
    return img


def core_sheet():
    img = paint_floor(base_walls(CORE_WALLS), bare_concrete_pixel, shadow=0.92)
    op = img.load()
    # R3 C1: one cable run on the floor, the key console to the host terminal's desk
    for x in range(88, 180):
        op[x, 168] = (40, 40, 44, 255)
        op[x, 169] = (70, 70, 74, 255)
    return img


def main():
    sheets = {
        "room_m10_tunnel": tunnel_sheet(),
        "room_m10_security": security_sheet(),
        "room_m10_workshop": workshop_sheet(),
        "room_m10_power": power_sheet(),
        "room_m10_gallery": gallery_sheet(),
        "room_m10_core": core_sheet(),
    }
    for stem, img in (("room_m10_forward", forward_sheet()), ("room_m10_hall", hall_sheet())):
        west, east = split_wide(img)
        sheets[f"{stem}_w"] = west
        sheets[f"{stem}_e"] = east
    for name, img in sheets.items():
        img.save(OUT_DIR / f"{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
