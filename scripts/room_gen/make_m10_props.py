#!/usr/bin/env python3
"""
Hand-drawn props for m10 "Full Disclosure" (room_m10_* in room_gen/m10_rooms.py):
Tomb Gamma, a 1962 civil-defence bunker refitted by ENTROPY.

The 1962 fabric: FALLOUT SHELTER and stencilled room plates in civil-defence yellow,
caged bulbs, Bakelite readouts and panels, the load board, the plotting board, the
slit windows over the core, a wall ladder up the guard post's shaft. The refit and
the night: the field screen and breaching case on the folding table, the gate hut
(lit and dark), a kit crate, the sealed hatch with the field kit's link clipped on,
the outer lock's keypad face plate, the core's service door and its dummy camera,
his key console, a rack of half-built crackers.

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (extended by make_aes_props.py and make_hce_props.py). Nothing
is rescaled. Text the story reads out is drawn as rules; observations carry it.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_m10_props.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

CLEAR = (0, 0, 0, 0)
OUTLINE = (24, 26, 30)
CD_YELLOW = (226, 188, 44)
CD_YELLOW_DARK = (168, 136, 30)
BLACK = (30, 30, 32)
WHITE = (228, 226, 214)
PAPER = (236, 232, 214)
GREY = (150, 150, 146)
STEEL = (140, 146, 152)
STEEL_LIGHT = (190, 196, 202)
STEEL_DARK = (84, 90, 98)
BAKELITE = (78, 50, 34)
BAKELITE_LIGHT = (112, 74, 50)
AMBER = (240, 168, 48)
AMBER_DIM = (150, 96, 30)
GREEN_LED = (90, 220, 120)
RED = (200, 44, 40)
RED_DARK = (120, 26, 24)
OLIVE = (92, 100, 64)
OLIVE_DARK = (62, 68, 44)
OLIVE_LIGHT = (122, 130, 86)
WARM = (255, 214, 140)
GLASS_DARK = (30, 38, 46)


def stencil_plate(text, name, face=CD_YELLOW, ink=BLACK):
    """A stencilled civil-defence plate: black on yellow, a dark rim."""
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, OUTLINE)
    c.rect(1, 1, w - 2, 9, face)
    c.hline(1, w - 2, 9, CD_YELLOW_DARK)
    c.text(4, 3, text, ink)
    c.save(OBJ, name)


def fallout_sign():
    """FALLOUT SHELTER, the 1962 sign: the three yellow triangles in a black disc on
    the left, the words in black on yellow."""
    w, h = 62, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, CD_YELLOW)
    # disc
    cx, cy, r = 9, 9, 7
    for y in range(h):
        for x in range(18):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                c.px(x, y, BLACK)
    # three yellow wedges pointing in to the centre (the 1962 shelter mark)
    import math
    for y in range(h):
        for x in range(18):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if 4 <= d2 <= (r - 1) ** 2:
                a = (math.degrees(math.atan2(y - cy, x - cx)) + 360) % 360
                if any(abs(((a - c0 + 180) % 360) - 180) <= 40 * math.sqrt(d2) / (r - 1) for c0 in (270, 30, 150)):
                    c.px(x, y, CD_YELLOW)
    c.text(20, 3, "FALLOUT", BLACK)
    c.text(20, 10, "SHELTER", BLACK)
    c.save(OBJ, "m10_sign_fallout1")


def caged_lamp(name="m10_caged_lamp1", lit=True):
    """A caged bulkhead bulb on a short bracket: a steel cage over a warm bulb."""
    w, h = 10, 12
    c = Canvas(w, h)
    c.rect(3, 0, 6, 2, STEEL_DARK)                 # bracket plate
    c.rect(4, 3, 5, 3, STEEL_DARK)
    bulb = WARM if lit else (150, 146, 130)
    c.rect(2, 4, 7, 10, bulb)
    c.rect(3, 5, 4, 7, (255, 244, 210) if lit else (170, 166, 150))
    for x in (1, 4, 8):
        c.rect(x, 4, x, 11, STEEL_DARK)
    c.hline(1, 8, 4, STEEL_DARK)
    c.hline(1, 8, 8, STEEL_DARK)
    c.hline(2, 7, 11, STEEL_DARK)
    c.save(OBJ, name)


def readout(name="m10_readout1", w=26, h=18):
    """A Bakelite-framed readout: a brown moulded frame, a dark glass face with one amber
    line of figures and a dimmer line under it (the clock objects' text says what)."""
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, BAKELITE)
    c.hline(1, w - 2, 1, BAKELITE_LIGHT)
    c.rect(3, 3, w - 4, h - 6, GLASS_DARK)
    for x in range(5, w - 5):
        if x % 4 != 3:
            c.px(x, 5, AMBER)
            c.px(x, 6, AMBER)
    c.hline(5, w - 9, 9 if h > 14 else 8, AMBER_DIM)
    for i, x in enumerate((4, 8, 12)):
        if x < w - 3:
            c.px(x, h - 3, (200, 190, 170) if i else RED)
    c.save(OBJ, name)


def readout_side(name="m10_readout_side1"):
    """The duty screen on a side wall: the readout seen edge-on from the room, narrow
    (16 px) so it fits the side-wall strip."""
    w, h = 16, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, BAKELITE)
    c.rect(3, 3, w - 4, h - 7, GLASS_DARK)
    for y in range(5, h - 9, 3):
        c.hline(4, w - 5, y, AMBER)
    c.px(4, h - 3, RED)
    c.px(8, h - 3, (200, 190, 170))
    c.save(OBJ, name)


def door_panel():
    """The blast door's panel (and the outer lock's): a grey steel box on the wall, a
    card reader, a small amber display, a status lamp."""
    w, h = 18, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, STEEL)
    c.hline(1, w - 2, 1, STEEL_LIGHT)
    c.rect(3, 3, w - 4, 8, GLASS_DARK)
    c.hline(4, w - 5, 5, AMBER)
    c.rect(4, 11, w - 5, 19, (52, 56, 62))         # reader face
    c.rect(6, 13, w - 7, 17, (36, 40, 46))
    c.px(w // 2, 21, GREEN_LED)
    c.hline(1, w - 2, h - 2, STEEL_DARK)
    c.save(OBJ, "m10_door_panel1")


def load_board():
    """The power room's load board: a Bakelite panel with four round needle dials over
    a row of lamps and the new feed's strip of tape across the bottom."""
    w, h = 66, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, BAKELITE)
    c.hline(1, w - 2, 1, BAKELITE_LIGHT)
    for i in range(4):
        cx, cy, r = 9 + i * 16, 11, 6
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                d = (x - cx) ** 2 + (y - cy) ** 2
                if d <= r * r:
                    c.px(x, y, (230, 224, 200) if d < (r - 1) ** 2 else OUTLINE)
        # needle
        for k in range(5):
            c.px(cx - 3 + k + (i % 2), cy + 2 - k // 2 - (1 if i == 2 else 0), BLACK)
        c.px(cx, cy + 1, RED)
    for i in range(8):
        c.rect(5 + i * 7, 21, 7 + i * 7, 23, (GREEN_LED, AMBER, GREEN_LED, GREEN_LED, RED, GREEN_LED, AMBER, GREEN_LED)[i])
    c.rect(3, 25, w - 4, 27, (220, 220, 210))      # the refit's label tape
    c.hline(5, w - 20, 26, (120, 120, 120))
    c.save(OBJ, "m10_load_board1")


def bakelite_panel():
    """A 1960s switch panel: Bakelite, two rows of toggle switches, one dial."""
    w, h = 34, 28
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, BAKELITE)
    c.hline(1, w - 2, 1, BAKELITE_LIGHT)
    for row, y in enumerate((6, 15)):
        for i in range(5):
            x = 4 + i * 6
            c.rect(x, y, x + 2, y + 4, (40, 30, 24))
            c.px(x + 1, y + (0 if (i + row) % 2 else 3), (210, 206, 196))
            c.hline(x, x + 2, y + 6, (210, 200, 170))
    c.rect(26, 21, 31, 25, (230, 224, 200))
    c.px(28, 23, BLACK)
    c.save(OBJ, "m10_bakelite_panel1")


def slit_window():
    """Slit windows down into the core: three narrow slots in a steel frame, dark glass
    with a dim lit floor far below and a grey smudge in the middle one."""
    w, h = 74, 14
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, STEEL_DARK)
    for i in range(3):
        x0 = 4 + i * 23
        c.rect(x0, 3, x0 + 19, 10, GLASS_DARK)
        c.hline(x0, x0 + 19, 9, (70, 72, 70))
        c.hline(x0, x0 + 19, 10, (96, 96, 90))
        c.px(x0 + 3, 4, (120, 140, 160))
        c.px(x0 + 4, 4, (120, 140, 160))
    c.rect(37, 7, 39, 8, (170, 170, 168))          # the grey head below
    c.hline(1, w - 2, h - 2, (60, 64, 70))
    c.save(OBJ, "m10_slit_window1")


def plotting_board():
    """The 1960s plotting board: a framed perspex board over a grid, the coastline and the
    border drawn in white, and a strip of red tape run across it west to east (the
    scenario's text names the cities)."""
    w, h = 112, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (60, 54, 44))         # wooden frame
    c.rect(3, 3, w - 4, h - 4, (28, 46, 58))         # board
    for x in range(3, w - 3, 8):
        c.rect(x, 3, x, h - 4, (40, 62, 76))
    for y in range(3, h - 3, 6):
        c.hline(3, w - 4, y, (40, 62, 76))
    # a rough coastline: west coast down the left, Gulf at the bottom, east coast right
    west = [(8, 5), (7, 8), (7, 11), (8, 14), (9, 17), (10, 19), (12, 21), (15, 23)]
    for x, y in west:
        c.px(x, y, (200, 210, 214))
    for x in range(15, 60):
        c.px(x, 23 + (1 if 30 < x < 44 else 0), (200, 210, 214))
    for x, y in ((60, 23), (64, 22), (66, 22), (68, 21), (72, 20), (78, 19), (84, 17), (90, 14),
                 (94, 11), (98, 8), (101, 6), (104, 5)):
        c.px(x, y, (200, 210, 214))
    for x in range(8, 104, 2):
        c.px(x, 5, (150, 160, 166))               # the northern border, dotted
    # city pins and the red tape, west to east
    pins = [(10, 7), (11, 18), (30, 15), (48, 12), (62, 16), (78, 11), (92, 13), (102, 8)]
    for (x0, y0), (x1, y1) in zip(pins, pins[1:]):
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for k in range(steps + 1):
            x = x0 + (x1 - x0) * k // steps
            y = y0 + (y1 - y0) * k // steps
            c.px(x, y, RED)
            c.px(x, y + 1, RED_DARK)
    for x, y in pins:
        c.rect(x - 1, y - 1, x + 1, y + 1, (240, 236, 220))
        c.px(x, y, RED)
    c.rect(4, 25, 30, 26, (210, 200, 170))           # the 1962 legend strip
    c.save(OBJ, "m10_plotting_board1")


def wall_ladder():
    """The guard post's ladder: steel rungs up the back wall to a hatch in the roof of
    the tunnel."""
    w, h = 20, 30
    c = Canvas(w, h)
    c.rect(2, 0, w - 3, 5, OUTLINE)                  # the hatch rim
    c.rect(3, 1, w - 4, 4, (54, 58, 62))
    c.rect(4, 6, 5, h - 1, STEEL_DARK)
    c.rect(w - 6, 6, w - 5, h - 1, STEEL_DARK)
    c.px(4, 6, STEEL_LIGHT)
    c.px(w - 6, 6, STEEL_LIGHT)
    for y in range(9, h - 1, 5):
        c.hline(6, w - 7, y, STEEL)
        c.hline(6, w - 7, y + 1, STEEL_DARK)
    c.save(OBJ, "m10_wall_ladder1")


def sealed_hatch():
    """The sealed section's maintenance hatch in the server hall's back wall: a riveted
    steel door painted over in the sixties, the paint now cracked along its edge where
    it was opened, and the field kit's link clipped to the frame (a small box, green
    lamp, a lead)."""
    w, h = 34, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (110, 120, 130))
    c.rect(4, 3, w - 5, h - 3, (124, 134, 142))      # the door, painted over
    c.frame(4, 3, w - 5, h - 3, (70, 74, 80))
    for x in (6, w - 7):
        for y in range(5, h - 4, 5):
            c.px(x, y, (80, 84, 90))
    for y in range(4, h - 3):                        # the cracked paint line
        if y % 3:
            c.px(5, y, (210, 210, 200))
    c.rect(w - 10, 12, w - 8, 18, (60, 60, 60))      # the wheel handle
    # the link box clipped on
    c.rect(18, 15, 27, 23, OUTLINE)
    c.rect(19, 16, 26, 22, (40, 44, 50))
    c.px(21, 18, GREEN_LED)
    c.px(24, 18, AMBER)
    for y in range(24, h - 1):
        c.px(22, y, (30, 30, 30))
    c.save(OBJ, "m10_hatch1")


def keypad_plate():
    """The outer lock's keypad face plate, on the east wall beside the door: brushed
    steel, a 3x4 grid, four of the keys worn shiny."""
    w, h = 12, 18
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, STEEL)
    c.hline(1, w - 2, 1, STEEL_LIGHT)
    c.rect(2, 2, w - 3, 4, GLASS_DARK)
    worn = {(0, 0), (2, 1), (1, 2), (2, 2)}
    for j in range(4):
        for i in range(3):
            col = (230, 232, 236) if (i, j) in worn else (96, 100, 108)
            c.rect(2 + i * 3, 6 + j * 3, 3 + i * 3, 7 + j * 3, col)
    c.save(OBJ, "m10_keypad_plate1")


def service_door():
    """The core's service door on the east wall, seen edge-on from inside: a steel
    slab in a deep frame, a card reader beside it, and above it on a bracket the
    dummy camera that never moves."""
    w, h = 18, 70
    c = Canvas(w, h)
    # the camera on its bracket
    c.rect(8, 0, 9, 5, STEEL_DARK)
    c.rect(2, 4, 12, 9, OUTLINE)
    c.rect(3, 5, 11, 8, (200, 200, 196))
    c.rect(1, 6, 2, 7, (40, 40, 44))
    # the door
    c.rect(0, 16, w - 1, h - 1, OUTLINE)
    c.rect(1, 17, w - 2, h - 2, (96, 102, 110))
    c.rect(3, 19, w - 4, h - 3, (122, 128, 136))
    c.rect(3, 19, 4, h - 3, (150, 156, 162))
    c.rect(w - 7, 40, w - 5, 46, (50, 54, 60))       # handle
    c.rect(w - 7, 26, w - 4, 31, (40, 44, 50))       # reader
    c.px(w - 6, 27, RED)
    for y in range(h - 9, h - 3):
        if y % 2:
            c.hline(3, w - 4, y, CD_YELLOW)
    c.save(OBJ, "m10_service_door1")


def field_screen():
    """The table screen: a rugged field monitor on a short stand, dark face, a countdown
    bar in amber."""
    w, h = 24, 18
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 13, OUTLINE)
    c.rect(1, 1, w - 2, 12, (54, 58, 52))
    c.rect(3, 3, w - 4, 10, GLASS_DARK)
    c.hline(4, w - 5, 5, AMBER)
    c.hline(4, 12, 8, (120, 180, 200))
    c.rect(10, 14, 13, 15, (54, 58, 52))
    c.rect(6, 16, 17, 17, OUTLINE)
    c.save(OBJ, "m10_field_screen1")


def breaching_case():
    """The breaching case on the table: a black hard case, two latches, a stencilled
    white number."""
    w, h = 26, 14
    c = Canvas(w, h)
    c.rect(8, 0, 17, 2, OUTLINE)                     # handle
    c.rect(10, 1, 15, 1, (60, 60, 60))
    c.rect(0, 2, w - 1, h - 1, OUTLINE)
    c.rect(1, 3, w - 2, h - 2, (46, 48, 52))
    c.hline(1, w - 2, 3, (78, 80, 86))
    c.hline(1, w - 2, 7, (30, 30, 34))
    for x in (4, w - 6):
        c.rect(x, 6, x + 1, 8, (170, 170, 166))
    c.text(10, 8, "07", (200, 200, 196))
    c.save(OBJ, "m10_breaching_case1")


def kit_crate():
    """A SAFETYNET kit crate at the road end: olive drab, ribbed, a white stencil block."""
    w, h = 32, 20
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, OLIVE)
    c.hline(1, w - 2, 1, OLIVE_LIGHT)
    c.rect(1, 1, w - 2, 5, OLIVE_DARK)
    c.hline(1, w - 2, 2, OLIVE_LIGHT)
    for x in (1, w - 3):
        c.rect(x, 6, x + 1, h - 2, OLIVE_DARK)
    c.rect(8, 9, 23, 14, (210, 210, 196))
    c.hline(10, 21, 11, (90, 90, 86))
    c.hline(1, w - 2, h - 2, OLIVE_DARK)
    c.save(OBJ, "m10_kit_crate1")


def map_board():
    """Quintero's map board, hung on the fence: a sheet map of the ridge, grid squares,
    the bunker ringed in red, the vans' track in pencil."""
    w, h = 40, 28
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (226, 220, 196))
    for x in range(4, w - 2, 6):
        c.rect(x, 2, x, h - 3, (196, 200, 180))
    for y in range(4, h - 2, 6):
        c.hline(2, w - 3, y, (196, 200, 180))
    for k, (x, y) in enumerate(((4, 20), (10, 17), (16, 15), (22, 12), (28, 11), (34, 8))):
        c.px(x, y, (130, 110, 80))                   # contour of the ridge
        c.px(x + 1, y, (130, 110, 80))
    for x in range(4, 30):
        c.px(x, 22 - x // 6, (110, 110, 110))         # the track in pencil
    for (dx, dy) in ((0, -3), (2, -2), (3, 0), (2, 2), (0, 3), (-2, 2), (-3, 0), (-2, -2)):
        c.px(31 + dx, 14 + dy, RED)
    c.rect(1, 1, 4, 4, (200, 60, 50))                 # pin
    c.save(OBJ, "m10_map_board1")


def gate_hut(lit=True):
    """The gate's guard hut, front on: a white-painted steel booth with a flat roof, a
    wide window (lit warm with a figure's shape, or dark), the door to the right."""
    w, h = 48, 62
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 6, OUTLINE)                  # roof
    c.rect(1, 1, w - 2, 5, (120, 126, 130))
    c.hline(1, w - 2, 1, (160, 166, 170))
    c.rect(2, 6, w - 3, h - 1, OUTLINE)
    c.rect(3, 7, w - 4, h - 2, (196, 198, 190) if lit else (150, 152, 146))
    # window
    c.rect(5, 12, 30, 30, OUTLINE)
    glass = (250, 204, 120) if lit else (40, 46, 52)
    c.rect(6, 13, 29, 29, glass)
    if lit:
        c.rect(14, 18, 19, 29, (120, 90, 60))       # a man in a parka with a paperback
        c.rect(15, 15, 18, 18, (150, 110, 80))
        c.rect(19, 22, 23, 24, (240, 240, 230))
    else:
        c.px(8, 15, (90, 100, 110))
        c.px(9, 15, (90, 100, 110))
    c.hline(5, 30, 31, (100, 100, 96))               # sill
    # door
    c.rect(33, 12, 42, h - 2, OUTLINE)
    c.rect(34, 13, 41, h - 3, (150, 156, 150) if lit else (120, 124, 120))
    c.px(40, 36, (60, 60, 60))
    c.hline(3, w - 4, h - 4, (90, 92, 88))
    c.rect(3, h - 3, w - 4, h - 2, CD_YELLOW)       # kick strip
    c.save(OBJ, "m10_gate_hut1" if lit else "m10_gate_hut_dark1")


def key_console():
    """His key console: a grey steel desk console, one screen dark, a single key
    switch under a hinged red cover, the readout's slot above it."""
    w, h = 52, 36
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 15, OUTLINE)                 # raised back panel
    c.rect(1, 1, w - 2, 14, (110, 116, 120))
    c.rect(4, 3, 24, 12, GLASS_DARK)
    c.hline(6, 18, 6, (90, 110, 130))
    c.rect(30, 4, 46, 10, (64, 68, 72))
    c.rect(0, 15, w - 1, 24, OUTLINE)                # sloped desk face
    c.rect(1, 16, w - 2, 23, (140, 146, 150))
    c.hline(1, w - 2, 16, (170, 176, 180))
    c.rect(22, 17, 29, 22, (150, 30, 30))            # the hinged cover
    c.hline(22, 29, 17, (220, 80, 70))
    c.px(25, 20, (230, 210, 120))                    # the key under it
    c.px(26, 20, (230, 210, 120))
    c.rect(4, 19, 12, 20, (60, 60, 64))
    c.rect(38, 19, 46, 20, (60, 60, 64))
    c.rect(2, 24, w - 3, h - 1, OUTLINE)             # body to the floor
    c.rect(3, 25, w - 4, h - 2, (96, 102, 108))
    c.rect(6, 27, w - 7, h - 4, (86, 92, 98))
    c.save(OBJ, "m10_key_console1")


def cracker_rack():
    """A rack of half-built crackers: a steel shelving unit, matte black casings in
    rows, some open with boards showing, cables hanging."""
    w, h = 34, 50
    c = Canvas(w, h)
    c.rect(0, 0, 1, h - 1, STEEL_DARK)
    c.rect(w - 2, 0, w - 1, h - 1, STEEL_DARK)
    for y in (0, 12, 24, 36, h - 3):
        c.rect(0, y, w - 1, y + 1, STEEL)
    for row, y in enumerate((4, 16, 28, 40)):
        if y + 7 >= h - 3:
            continue
        for i in range(3):
            x = 3 + i * 10
            open_ = (row + i) % 3 == 1
            c.rect(x, y, x + 8, y + 7, OUTLINE)
            c.rect(x + 1, y + 1, x + 7, y + 6, (34, 36, 40) if not open_ else (40, 110, 70))
            if open_:
                c.px(x + 2, y + 2, AMBER)
                c.hline(x + 3, x + 6, y + 4, (180, 180, 120))
            else:
                c.px(x + 6, y + 2, GREEN_LED if i % 2 else RED)
        c.px(12 + row * 3, y + 9, (200, 60, 40))
        c.px(12 + row * 3, y + 10, (200, 60, 40))
    c.save(OBJ, "m10_cracker_rack1")


def main():
    fallout_sign()
    for text, name in (("SECURITY", "m10_sign_security1"), ("WORKSHOP", "m10_sign_workshop1"),
                       ("PLANT ROOM", "m10_sign_plant1"), ("OPS ROOM 1", "m10_sign_ops1"),
                       ("GALLERY", "m10_sign_gallery1"), ("LEVEL 1", "m10_sign_level1"),
                       ("LEVEL 2", "m10_sign_level2"), ("KEEP CLEAR", "m10_sign_keepclear1"),
                       ("GUARD POST", "m10_sign_post1"), ("BATTERIES", "m10_sign_batteries1")):
        stencil_plate(text, name)
    caged_lamp()
    readout()
    readout_side()
    door_panel()
    load_board()
    bakelite_panel()
    slit_window()
    plotting_board()
    wall_ladder()
    sealed_hatch()
    keypad_plate()
    service_door()
    field_screen()
    breaching_case()
    kit_crate()
    map_board()
    gate_hut(True)
    gate_hut(False)
    key_console()
    cracker_rack()
    extras()
    round2()
    round3()
    round4()


def plans_roll():
    """Helena's plans: a roll of 1962 drawings half open on the table, blue lines, a red
    SUPERSEDED stamp across the open sheet."""
    w, h = 28, 14
    c = Canvas(w, h)
    c.rect(0, 0, 5, h - 1, OUTLINE)                  # the roll
    c.rect(1, 1, 4, h - 2, (214, 208, 186))
    c.px(2, h // 2, (150, 146, 130))
    c.rect(5, 1, w - 1, h - 2, OUTLINE)              # the open sheet
    c.rect(6, 2, w - 2, h - 3, (206, 214, 222))
    for x in range(8, w - 3, 5):
        c.rect(x, 3, x, h - 4, (80, 110, 170))
    c.hline(7, w - 3, 6, (80, 110, 170))
    c.rect(12, 4, 22, 8, RED)
    c.rect(13, 5, 21, 7, (206, 214, 222))
    c.hline(14, 20, 6, RED)
    c.save(OBJ, "m10_plans1")


def field_screen_dark():
    """The projection desk's field screen, dark: the same rugged monitor, switched off."""
    w, h = 24, 18
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 13, OUTLINE)
    c.rect(1, 1, w - 2, 12, (54, 58, 52))
    c.rect(3, 3, w - 4, 10, (22, 26, 30))
    c.px(4, 4, (60, 70, 80))
    c.px(5, 4, (60, 70, 80))
    c.px(w - 5, 11, RED)
    c.rect(10, 14, 13, 15, (54, 58, 52))
    c.rect(6, 16, 17, 17, OUTLINE)
    c.save(OBJ, "m10_field_screen_dark1")


def bypass_panel():
    """The refit's bypass: a grey steel box bolted over a strip of the old Bakelite
    switchgear, conduit running out of it, a fresh label."""
    w, h = 30, 30
    c = Canvas(w, h)
    c.rect(0, 6, w - 1, h - 1, OUTLINE)              # the old Bakelite behind
    c.rect(1, 7, w - 2, h - 2, BAKELITE)
    for x in range(3, w - 3, 5):
        c.rect(x, h - 7, x + 1, h - 4, (40, 30, 24))
    c.rect(5, 0, w - 6, 20, OUTLINE)                 # the refit box over it
    c.rect(6, 1, w - 7, 19, (150, 156, 160))
    c.hline(6, w - 7, 1, STEEL_LIGHT)
    for (x, y) in ((7, 3), (w - 8, 3), (7, 17), (w - 8, 17)):
        c.px(x, y, STEEL_DARK)                       # bolts
    c.rect(9, 6, w - 10, 9, (240, 240, 232))         # label
    c.hline(10, w - 12, 7, (110, 110, 110))
    c.rect(10, 12, 13, 15, (40, 44, 50))
    c.px(17, 13, GREEN_LED)
    c.rect(w - 7, 10, w - 4, 11, (70, 74, 80))        # conduit out
    c.save(OBJ, "m10_bypass_panel1")


def console_controls():
    """The release console's controls: a grey desk panel with two rows of keys, a lit
    amber row and a red guarded switch."""
    w, h = 30, 14
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (110, 116, 122))
    c.hline(1, w - 2, 1, (150, 156, 162))
    for i in range(6):
        c.rect(3 + i * 4, 3, 4 + i * 4, 4, AMBER if i % 3 == 0 else (60, 64, 70))
        c.rect(3 + i * 4, 7, 4 + i * 4, 8, (60, 64, 70))
    c.rect(w - 6, 6, w - 3, 10, RED)
    c.save(OBJ, "m10_console_controls1")


def wall_screen():
    """The core host's file index: a plain flat screen on the back wall, dark, rows of
    white text when lit (the object's text carries the words)."""
    w, h = 36, 24
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (30, 34, 38))
    c.rect(3, 3, w - 4, h - 4, (16, 22, 30))
    c.hline(4, 18, 5, (200, 204, 210))
    for i, ln in enumerate((24, 20, 26, 16, 22)):
        c.hline(4, 4 + ln, 8 + i * 2, (110, 120, 130))
    c.save(OBJ, "m10_wall_screen1")


def cupboard():
    """The old records cupboard: a 1960s olive steel cupboard, two doors, a newer grey
    keypad bolted on beside the handle."""
    w, h = 30, 40
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (104, 112, 96))
    c.hline(1, w - 2, 1, (134, 142, 124))
    c.rect(14, 2, 15, h - 3, (70, 76, 64))           # the doors' join
    c.rect(11, 16, 12, 22, (60, 60, 60))             # handles
    c.rect(17, 16, 18, 22, (60, 60, 60))
    c.rect(20, 8, 27, 18, OUTLINE)                   # the keypad, newer
    c.rect(21, 9, 26, 17, (140, 146, 152))
    for j in range(3):
        for i in range(2):
            c.px(22 + i * 3, 11 + j * 2, (60, 64, 70))
    c.px(23, 9, RED)
    c.rect(3, 4, 11, 7, (220, 214, 190))             # an old card label
    c.hline(1, w - 2, h - 2, (70, 76, 64))
    c.save(OBJ, "m10_cupboard1")


def locker():
    """The shift fitter's locker: one dented grey locker, vents at the top, MAINT. SPARES
    stencilled, a small padlock hasp."""
    w, h = 22, 42
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (120, 128, 136))
    c.hline(1, w - 2, 1, (160, 166, 172))
    for y in (4, 6, 8):
        c.hline(5, w - 6, y, (70, 76, 84))
    c.rect(3, 13, w - 4, 16, (230, 196, 60))          # stencil strip
    c.hline(4, w - 6, 14, (40, 40, 40))
    c.rect(w - 6, 20, w - 4, 25, (60, 60, 62))        # hasp
    c.px(w - 5, 26, (200, 170, 60))
    c.px(7, 28, (100, 108, 116))                      # dents
    c.px(8, 29, (100, 108, 116))
    c.px(11, 33, (100, 108, 116))
    c.hline(1, w - 2, h - 2, (80, 86, 94))
    c.save(OBJ, "m10_locker1")


def extras():
    plans_roll()
    field_screen_dark()
    bypass_panel()
    console_controls()
    wall_screen()
    cupboard()
    locker()


# --- round 2 ------------------------------------------------------------------

def gate_post(lit=True):
    """The gate hut with the refit fence running west from it along the yard's south
    edge (80x62: fence x 0-31, the hut from x 32). Lit: the fence is whole. Dark (the
    m06_assets_seized variant): the fence stops a few metres short, a last post and a
    loose end of wire, then nothing (RL 2.1, milestone A30: visual only)."""
    from PIL import Image
    hut = Image.open(OBJ / ("m10_gate_hut1.png" if lit else "m10_gate_hut_dark1.png")).convert("RGBA")
    c = Canvas(80, 62)
    steel, post = (176, 182, 188), (110, 116, 124)
    x_end = 32 if lit else 14
    for y in range(30, 60):
        for x in range(0, x_end):
            if (x + y) % 6 == 0 or (x - y) % 6 == 0:
                c.px(x, y, steel)
    for x in range(0, x_end):
        c.px(x, 30, post)
        c.px(x, 59, post)
    for px_ in ([0, 16] if lit else [0, 13]):
        c.rect(px_, 28, px_ + 1, 61, post)
    if not lit:
        for k, (x, y) in enumerate(((15, 34), (16, 37), (16, 40), (17, 43), (17, 47))):
            c.px(x, y, steel)                      # a loose end of wire
    name = "m10_gate_post1" if lit else "m10_gate_post_dark1"
    c.save(OBJ, name)
    im = Image.open(OBJ / f"{name}.png").convert("RGBA")
    im.alpha_composite(hut, (32, 0))
    im.save(OBJ / f"{name}.png")


def van_step(name, kind):
    """A small slot at a van's open side door: the step plate, and on it van one's
    headset and SAFETYNET badge, or van two's steel rail end with a cuff on it."""
    w, h = 20, 8
    c = Canvas(w, h)
    c.rect(0, 3, w - 1, h - 1, OUTLINE)
    c.rect(1, 4, w - 2, h - 2, (120, 126, 132))
    for x in range(2, w - 2, 3):
        c.px(x, 5, (150, 156, 162))
    if kind == "headset":
        c.rect(3, 0, 8, 1, (40, 40, 44))           # headset band
        c.rect(3, 1, 4, 3, (40, 40, 44))
        c.rect(8, 1, 9, 3, (40, 40, 44))
        c.rect(12, 1, 16, 3, (40, 70, 140))        # the badge on its lanyard
        c.px(14, 2, (230, 230, 230))
    else:
        c.rect(2, 1, 17, 2, (170, 176, 182))       # the rail's end
        c.rect(12, 0, 15, 3, (90, 94, 100))        # a cuff on it
        c.px(13, 1, (20, 20, 20))
    c.save(OBJ, name)


def work_lamp():
    """A tripod work lamp: three splayed legs, a pole, a halogen head angled down at the
    table, its lens warm."""
    w, h = 18, 50
    c = Canvas(w, h)
    c.rect(2, 0, 15, 7, OUTLINE)                   # head
    c.rect(3, 1, 14, 6, (230, 190, 40))
    c.rect(4, 5, 13, 6, (255, 240, 190))           # lens, facing down and forward
    c.rect(8, 8, 9, 38, (60, 62, 66))              # pole
    for k in range(10):
        c.px(8 - k // 1 if k < 8 else 0, 38 + k, (60, 62, 66))
        c.px(9 + (k if k < 8 else 8), 38 + k, (60, 62, 66))
        c.px(8 + (1 if k % 2 else 0), 38 + k, (60, 62, 66))
    c.save(OBJ, "m10_work_lamp1")


def generator():
    """A portable generator in its tube frame: yellow and black, a fuel cap, an outlet
    panel, a lead running off it."""
    w, h = 34, 26
    c = Canvas(w, h)
    c.rect(0, 2, w - 1, h - 3, OUTLINE)            # frame
    c.rect(2, 4, w - 3, h - 5, (220, 176, 40))
    c.rect(2, 4, w - 3, 6, (240, 200, 70))
    c.rect(4, 9, 14, 17, (40, 40, 44))             # engine side
    for y in range(10, 17, 2):
        c.hline(5, 13, y, (80, 80, 84))
    c.rect(18, 9, 28, 15, (60, 62, 66))            # outlet panel
    c.px(20, 11, (220, 220, 220))
    c.px(24, 11, (220, 220, 220))
    c.px(26, 13, (90, 220, 120))
    c.rect(24, 0, 27, 2, (40, 40, 44))             # fuel cap
    c.rect(1, h - 3, 3, h - 1, OUTLINE)            # feet
    c.rect(w - 4, h - 3, w - 2, h - 1, OUTLINE)
    c.hline(29, 33, 16, (30, 30, 30))              # the lead
    c.save(OBJ, "m10_generator1")


def round2():
    gate_post(True)
    gate_post(False)
    van_step("m10_van_step1", "headset")
    van_step("m10_van_step2", "rail")
    work_lamp()
    generator()


# --- round 3 ------------------------------------------------------------------

CONCRETE = (150, 146, 136)
CONCRETE_DARK = (112, 108, 100)
CONCRETE_LIGHT = (176, 172, 162)


def portal_head():
    """The bunker's portal at the forward post's NE corner: a cast-concrete headwall
    over the rock, a heavy lintel beam, TG-1 stencilled on it, a strip of yellow-black
    on the beam's underside (the blast door itself is the E door below it)."""
    w, h = 64, 46
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            k = (x * 7 + y * 13) % 17
            c.px(x, y, CONCRETE if k else CONCRETE_DARK)
    for x in range(8, w, 16):                         # formwork joints
        c.rect(x, 1, x, 24, CONCRETE_DARK)
    c.rect(1, 25, w - 2, 38, CONCRETE_LIGHT)          # the lintel beam
    c.hline(1, w - 2, 25, (200, 196, 186))
    c.rect(18, 28, 45, 35, CD_YELLOW)
    c.text(22, 29, "TG-1", BLACK)
    for x in range(1, w - 1):                         # hazard strip under the beam
        c.px(x, 39, CD_YELLOW if (x // 3) % 2 else BLACK)
        c.px(x, 40, CD_YELLOW if (x // 3) % 2 else BLACK)
    c.rect(1, 41, w - 2, h - 2, CONCRETE_DARK)
    c.save(OBJ, "m10_portal_head1")


def blast_leaf():
    """The blast door's leaf, swung open flat against the east wall below the doorway,
    seen edge-on from the yard: a thick steel slab, its locking wheel, two hinge
    knuckles, chipped grey paint."""
    w, h = 18, 64
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (104, 110, 116))
    c.rect(2, 1, 4, h - 2, (140, 146, 152))           # the leaf's edge, lit
    for y in range(6, h - 4, 9):
        c.px(w - 4, y, (80, 84, 90))
    cx, cy = 10, 30                                   # the wheel
    for (dx, dy) in ((0, -5), (4, -3), (5, 0), (4, 3), (0, 5), (-4, 3), (-5, 0), (-4, -3)):
        c.px(cx + dx, cy + dy, (200, 200, 196))
    c.rect(cx - 1, cy - 1, cx + 1, cy + 1, (60, 60, 64))
    for y0 in (4, h - 10):                            # hinge knuckles
        c.rect(0, y0, 2, y0 + 5, (70, 74, 80))
    c.px(12, 50, (170, 150, 120))                     # chipped paint
    c.px(13, 51, (170, 150, 120))
    c.save(OBJ, "m10_blast_leaf1")


def key_isolator():
    """The gallery shutter's isolator: a grey steel box with a row of four breakers, a
    key switch with the key in it, and a white label strip (GALLERY SHUTTER in the
    object's text)."""
    w, h = 24, 28
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (150, 156, 160))
    c.hline(1, w - 2, 1, (186, 192, 196))
    c.rect(3, 3, w - 4, 6, (236, 236, 228))           # label
    c.hline(4, w - 6, 4, (60, 60, 60))
    c.hline(4, 12, 5, (60, 60, 60))
    for i in range(4):                                # breakers
        x = 3 + i * 5
        c.rect(x, 9, x + 3, 15, (50, 52, 58))
        c.rect(x + 1, 10 + (0 if i != 2 else 3), x + 2, 11 + (0 if i != 2 else 3), (220, 220, 214))
    cx, cy = 11, 21                                   # key switch
    c.rect(cx - 3, cy - 3, cx + 3, cy + 3, (60, 62, 66))
    c.rect(cx - 2, cy - 2, cx + 2, cy + 2, (200, 168, 60))
    c.rect(cx - 2, cy, cx + 2, cy, (90, 70, 30))      # the key, across
    c.rect(cx + 3, cy - 1, cx + 6, cy + 1, (220, 190, 80))
    c.px(w - 4, h - 4, (90, 220, 120))
    c.save(OBJ, "m10_key_isolator1")


def wall_phone():
    """The duty handset: a black Bakelite wall phone on the east wall, its handset in the
    cradle, coiled cord, a small dial (16 px wide, for the side-wall strip)."""
    w, h = 14, 24
    c = Canvas(w, h)
    c.rect(1, 2, w - 2, h - 1, OUTLINE)
    c.rect(2, 3, w - 3, h - 2, (36, 32, 30))
    c.hline(2, w - 3, 3, (70, 64, 60))
    c.rect(0, 0, 3, 12, OUTLINE)                      # handset, upright in the cradle
    c.rect(1, 1, 2, 11, (52, 46, 42))
    cx, cy = 8, 14                                    # dial
    for (dx, dy) in ((0, -2), (2, -1), (2, 1), (0, 2), (-2, 1), (-2, -1)):
        c.px(cx + dx, cy + dy, (210, 206, 196))
    for y in range(13, 22, 2):                        # coiled cord
        c.px(1, y, (60, 56, 52))
        c.px(2, y + 1, (60, 56, 52))
    c.save(OBJ, "m10_wall_phone1")


def coat_hooks():
    """A row of hooks on the west wall strip: a hi-vis vest and a 1960s civil-defence tin
    hat, side-on (16 px wide)."""
    w, h = 16, 36
    c = Canvas(w, h)
    c.rect(6, 0, 9, 34, (96, 70, 46))                 # the board
    c.rect(4, 2, 11, 9, (120, 124, 112))              # tin hat, brim
    c.rect(5, 0, 10, 4, (106, 112, 98))
    c.hline(5, 10, 4, CD_YELLOW)
    c.rect(3, 12, 12, 30, (220, 230, 40))             # hi-vis
    c.rect(3, 18, 12, 19, (200, 200, 196))
    c.rect(3, 25, 12, 26, (200, 200, 196))
    c.rect(7, 12, 8, 30, (180, 190, 30))
    c.save(OBJ, "m10_coat_hooks1")


def fire_buckets():
    """Two red fire buckets of sand on a wall stand, FIRE stencilled."""
    w, h = 24, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 3, OUTLINE)                   # the stand's rail
    c.rect(1, 1, w - 2, 2, (90, 94, 100))
    for x0 in (1, 13):
        c.rect(x0, 5, x0 + 9, h - 1, OUTLINE)
        c.rect(x0 + 1, 6, x0 + 8, h - 2, RED)
        c.rect(x0 + 1, 6, x0 + 8, 7, (230, 200, 140))  # sand
        c.hline(x0 + 2, x0 + 7, 13, (240, 220, 210))
    c.save(OBJ, "m10_fire_buckets1")


def tool_roll():
    """Static's tool roll: a canvas roll tied with a strap, the handles of a few tools
    out of one end, an S stencilled on the flap."""
    w, h = 26, 12
    c = Canvas(w, h)
    c.rect(0, 2, w - 1, h - 1, OUTLINE)
    c.rect(1, 3, w - 2, h - 2, (124, 116, 80))
    c.hline(1, w - 2, 3, (150, 142, 100))
    c.rect(9, 2, 10, h - 1, (70, 50, 30))             # strap
    c.rect(16, 4, 19, 9, (222, 214, 190))             # stencil block
    c.px(17, 5, BLACK); c.px(18, 5, BLACK); c.px(17, 6, BLACK)
    c.px(18, 7, BLACK); c.px(17, 8, BLACK); c.px(18, 8, BLACK)
    for i, col in enumerate(((200, 40, 40), (230, 190, 40), (60, 60, 64))):
        c.rect(22 + i, 0, 22 + i, 2, col)             # handles out of the end
    c.save(OBJ, "m10_tool_roll1")


def steel_stand():
    """A small steel equipment stand: a grey top, a shelf, four square legs (30 wide)."""
    w, h = 30, 36
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 6, OUTLINE)
    c.rect(1, 1, w - 2, 5, (150, 156, 162))
    c.hline(1, w - 2, 1, (190, 196, 202))
    for x in (1, w - 4):
        c.rect(x, 7, x + 2, h - 1, (90, 96, 104))
    c.rect(1, 22, w - 2, 24, (110, 116, 124))
    c.save(OBJ, "m10_steel_stand1")


def round3():
    portal_head()
    blast_leaf()
    key_isolator()
    wall_phone()
    coat_hooks()
    fire_buckets()
    tool_roll()
    steel_stand()
    stencil_plate("CORE", "m10_sign_core1")


# --- round 4 ------------------------------------------------------------------

def steel_bench():
    """A plain steel workbench at zds_desk3's size (51x39) without its PC tower: a pale
    galvanised top, a dark apron, four square legs and a low shelf between them."""
    w, h = 51, 39
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 17, OUTLINE)
    c.rect(1, 1, w - 2, 16, (176, 184, 194))
    c.hline(1, w - 2, 1, (206, 212, 220))
    for x in range(6, w - 4, 11):
        c.px(x, 8, (160, 168, 178))
    c.rect(0, 18, w - 1, 21, (62, 68, 80))
    for x0 in (1, w - 4):
        c.rect(x0, 22, x0 + 2, h - 1, (62, 68, 80))
    c.rect(3, 30, w - 4, 32, (96, 104, 116))
    c.hline(3, w - 4, 30, (130, 138, 148))
    c.save(OBJ, "m10_steel_bench1")


def steel_chair():
    """A grey steel canteen chair seen from behind (north-facing, 16x26): a curved
    backrest, the seat's edge, four tube legs."""
    w, h = 16, 26
    c = Canvas(w, h)
    c.rect(1, 0, w - 2, 9, OUTLINE)
    c.rect(2, 1, w - 3, 8, (150, 156, 162))
    c.hline(2, w - 3, 1, (186, 192, 198))
    c.rect(3, 10, 4, 13, (90, 96, 104))
    c.rect(w - 5, 10, w - 4, 13, (90, 96, 104))
    c.rect(0, 13, w - 1, 16, OUTLINE)
    c.rect(1, 14, w - 2, 15, (120, 126, 134))
    for x in (1, 4, w - 5, w - 2):
        c.rect(x, 17, x, h - 1, (80, 86, 94))
    c.save(OBJ, "m10_steel_chair1")


def field_screen_curve():
    """The projection desk's screen lit (the hardened branch): the same rugged monitor
    showing the Council's casualty curve, a red line climbing and never flattening."""
    w, h = 24, 18
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 13, OUTLINE)
    c.rect(1, 1, w - 2, 12, (54, 58, 52))
    c.rect(3, 3, w - 4, 10, GLASS_DARK)
    c.hline(4, w - 5, 10, (90, 110, 130))           # axis
    c.rect(4, 3, 4, 10, (90, 110, 130))
    for x, y in ((5, 9), (7, 9), (9, 8), (11, 8), (13, 7), (15, 6), (17, 5), (19, 4)):
        c.px(x, y, (240, 80, 70))
        c.px(x + 1, y, (240, 80, 70))
    c.rect(10, 14, 13, 15, (54, 58, 52))
    c.rect(6, 16, 17, 17, OUTLINE)
    c.save(OBJ, "m10_field_screen_curve1")


def round4():
    steel_bench()
    steel_chair()
    field_screen_curve()


if __name__ == "__main__":
    main()
