#!/usr/bin/env python3
"""
Hand-drawn props for m09 "Digital Archaeology" (room_m09_* in room_gen/m09_rooms.py):
Mountain States Records & Retention's wordmark and room plates, the bay plates
and the Harwick & Lowe bay label in the open stacks, the shelf-mark legend in the
tape room, Sorensen's rubber stamp, the hatch counter and mesh at the restricted
stacks, keypads, the salvage cage's cut door controller, the crates stencilled
ALPHA and BETA, archive boxes (taped, open) and a degausser.

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (extended by make_aes_props.py and make_hce_props.py). Nothing
is rescaled. Text that the story reads out (the legend's rows, the label's lines)
is drawn as illegible rules: the scenario's observations carry the words.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_m09_props.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

U.FONT.setdefault("&", [".#.", "#.#", ".#.", "#.#", ".##"])

OUTLINE = (24, 26, 30)
GREEN = (58, 108, 74)
GREEN_DARK = (36, 70, 48)
CREAM = (236, 228, 200)
PAPER = (244, 242, 232)
INK = (40, 40, 44)
GREY = (150, 150, 146)
STEEL = (150, 156, 162)
STEEL_LIGHT = (196, 202, 208)
STEEL_DARK = (88, 94, 102)
OAK = (196, 150, 96)
OAK_DARK = (140, 100, 60)
CARD = (200, 170, 120)
CARD_DARK = (160, 130, 86)
TAPE = (176, 132, 70)
RED = (196, 40, 40)
RED_DARK = (120, 24, 24)
YELLOW = (230, 196, 50)
BLACK = (30, 30, 32)
WOOD = (168, 122, 74)
WOOD_DARK = (116, 80, 46)
WOOD_LIGHT = (196, 152, 100)


def plate(text, name, face=GREEN, ink=CREAM, rim=GREEN_DARK):
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, OUTLINE)
    c.frame(1, 1, w - 2, 9, rim)
    c.rect(2, 2, w - 3, 8, face)
    c.text(4, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, name, face=CREAM, ink=GREEN, ink2=INK, rim=GREEN):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.rect(0, 0, w - 1, 16, OUTLINE)
    c.frame(1, 1, w - 2, 15, rim)
    c.rect(2, 2, w - 3, 14, face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink2)
    c.save(OBJ, name)


def logo_sign():
    """The company wordmark: MOUNTAIN STATES over RECORDS & RETENTION, green on cream,
    a green rule with three mountain peaks at the left."""
    w, h = 98, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.frame(1, 1, w - 2, h - 2, GREEN)
    c.rect(2, 2, w - 3, h - 3, CREAM)
    # three peaks
    for i, (px, ph) in enumerate(((5, 5), (9, 7), (13, 5))):
        for k in range(ph):
            c.hline(px - k, px + k, 5 + (7 - ph) + k, GREEN if i != 1 else GREEN_DARK)
    c.hline(3, 17, 13, GREEN)
    c.text(20, 3, "MOUNTAIN STATES", GREEN_DARK)
    c.text(20, 11, "RECORDS & RETENTION", INK)
    c.save(OBJ, "m09_logo_sign1")


def bay_plate(n, name):
    """A bay number plate hung from the end of a shelving run: black on yellow."""
    text = f"BAY {n}"
    w = len(text) * 4 - 1 + 6
    c = Canvas(w, 9)
    c.rect(0, 0, w - 1, 8, OUTLINE)
    c.rect(1, 1, w - 2, 7, YELLOW)
    c.text(3, 2, text, BLACK)
    c.save(OBJ, name)


def bay_label():
    """The Harwick & Lowe bay label: a white card in a steel holder on the shelf front,
    BAY 12 over H&L in red, two typed lines (the observation carries the words)."""
    w, h = 26, 18
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 3, PAPER)
    c.text(3, 3, "H&L", RED)
    c.text(15, 3, "12", INK)
    c.hline(3, 22, 10, GREY)
    c.hline(3, 18, 13, GREY)
    c.save(OBJ, "m09_bay_label1")


def shelf_legend():
    """The shelf-mark chart, framed on the tape room wall: a dark frame, a paper chart
    with a green title bar and five ruled rows, each with a bay number box."""
    w, h = 32, 28
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (52, 36, 24))
    c.frame(1, 1, w - 2, h - 2, (92, 66, 42))
    c.rect(2, 2, w - 3, h - 3, PAPER)
    c.rect(3, 3, w - 4, 6, GREEN)
    c.hline(5, 26, 4, CREAM)
    for i in range(5):
        y = 9 + i * 3
        c.rect(4, y, 6, y + 1, INK)
        c.hline(9, 27 - (i % 3) * 3, y, GREY)
    c.hline(4, 16, 25, RED)          # the house rule, in red, at the foot
    c.save(OBJ, "m09_shelf_legend1")


def rubber_stamp():
    """Sorensen's rubber stamp on its pad: a turned wooden handle on a red-inked base,
    the ink pad beside it."""
    w, h = 16, 11
    c = Canvas(w, h)
    # pad
    c.rect(8, 6, 15, 10, OUTLINE)
    c.rect(9, 7, 14, 9, RED_DARK)
    c.hline(9, 14, 7, RED)
    # stamp
    c.rect(2, 0, 4, 1, OAK_DARK)
    c.rect(1, 1, 5, 2, OAK)
    c.rect(2, 3, 4, 5, OAK_DARK)
    c.rect(0, 6, 6, 8, OUTLINE)
    c.rect(1, 7, 5, 7, (90, 60, 40))
    c.hline(0, 6, 9, RED)
    c.hline(1, 5, 10, RED_DARK)
    c.save(OBJ, "m09_rubber_stamp1")


def hatch_counter():
    """The hatch counter at the restricted stacks, seen from above and a little from the
    player's side (west): the counter's panelled front face, its oak top with the grain
    running along it and a brass edge strip, then a steel mesh screen along the east edge
    with posts. The hatch is a gap in the mesh mid-counter with a worn patch on the top
    where papers are passed through. 22 px wide so it reads as a counter, not a plank."""
    w, h = 22, 104
    c = Canvas(w, h)
    # front face (west), darker panelled boards
    c.rect(0, 0, 4, h - 1, OUTLINE)
    for y in range(1, h - 1):
        c.px(1, y, OAK_DARK)
        c.px(2, y, (122, 86, 50))
        c.px(3, y, OAK_DARK)
    for y in range(12, h - 4, 24):
        c.hline(1, 3, y, OUTLINE)
    # top
    c.rect(4, 0, 14, h - 1, OUTLINE)
    for y in range(1, h - 1):
        for x in range(5, 14):
            col = OAK
            if x in (7, 11):
                col = (180, 134, 84)
            c.px(x, y, col)
        c.px(5, y, (220, 184, 110))        # brass edge on the player's side
    c.hline(5, 13, 1, (214, 172, 118))
    # worn patch at the hatch
    mid = h // 2
    for y in range(mid - 8, mid + 8):
        for x in range(8, 14):
            if (x + y) % 3:
                c.px(x, y, (210, 168, 112))
    # mesh screen
    c.rect(15, 0, 21, h - 1, STEEL_DARK)
    for y in range(1, h - 1):
        for x in range(16, 21):
            c.px(x, y, STEEL_LIGHT if (x + y) % 3 == 0 else (64, 68, 74))
    for y0 in (0, 34, 66, h - 5):
        c.rect(15, y0, 21, y0 + 4, STEEL)
    # the hatch: a gap in the mesh, mid-counter
    c.rect(16, mid - 9, 20, mid + 9, (0, 0, 0, 0))
    c.rect(15, mid - 10, 21, mid - 9, STEEL)
    c.rect(15, mid + 9, 21, mid + 10, STEEL)
    c.save(OBJ, "m09_hatch_counter1")


def mesh_low(name="m09_mesh_low1", w=48, h=24):
    """A low run of steel mesh partition seen from the front: a steel frame, diamond
    mesh, a mid rail."""
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    for y in range(2, h - 2):
        for x in range(2, w - 2):
            on = (x + y) % 4 == 0 or (x - y) % 4 == 0
            c.px(x, y, STEEL_LIGHT if on else (0, 0, 0, 0))
    c.frame(1, 1, w - 2, h - 2, STEEL)
    c.hline(1, w - 2, h // 2, STEEL)
    for x in (1, w // 2, w - 2):
        c.rect(x - 1 if x > 1 else x, 0, x if x > 1 else x + 1, h - 1, STEEL)
    c.save(OBJ, name)


def keypad(name="m09_keypad1"):
    """A wall keypad: dark body, a 3x4 key grid, a red LED."""
    w, h = 9, 13
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (64, 68, 74))
    c.px(4, 2, RED)
    for j in range(4):
        for i in range(3):
            c.px(2 + i * 2, 4 + j * 2, STEEL_LIGHT)
    c.save(OBJ, name)


def door_controller():
    """The salvage cage's door controller, its cover off and its wires cut: a grey box,
    a dead keypad, red and black wires hanging out of the bottom, ends bare."""
    w, h = 14, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 13, OUTLINE)
    c.rect(1, 1, w - 2, 12, (120, 124, 128))
    c.rect(3, 3, 10, 9, (60, 64, 70))
    for j in range(2):
        for i in range(3):
            c.px(4 + i * 2, 5 + j * 2, GREY)
    for x, col, ln in ((4, RED, 6), (6, BLACK, 4), (8, YELLOW, 7), (10, RED_DARK, 5)):
        for y in range(14, 14 + ln):
            c.px(x + (1 if y > 16 and x % 4 == 0 else 0), y, col)
        c.px(x, 14 + ln, (210, 160, 90))    # bare copper
    c.save(OBJ, "m09_door_controller1")


def crate(word, name):
    """A plank crate, front on, its word stencilled in black across the middle."""
    w, h = 32, 24
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, WOOD)
    for y in (6, 12, 18):
        c.hline(1, w - 2, y, WOOD_DARK)
    c.rect(1, 1, 3, h - 2, WOOD_DARK)
    c.rect(w - 4, 1, w - 2, h - 2, WOOD_DARK)
    c.hline(1, w - 2, 1, WOOD_LIGHT)
    c.rect(4, 8, w - 5, 16, WOOD_LIGHT)
    c.text_centred(0, w - 1, 10, word, BLACK)
    c.save(OBJ, name)


def archive_box(name, kind):
    """A records box, 16x14: 'taped' (lid on, a strip of brown tape, a label) or 'open'
    (lid off, file folders standing in it)."""
    w, h = 16, 14
    c = Canvas(w, h)
    if kind == "taped":
        c.rect(0, 2, w - 1, h - 1, OUTLINE)
        c.rect(1, 3, w - 2, h - 2, CARD)
        c.rect(0, 0, w - 1, 4, OUTLINE)
        c.rect(1, 1, w - 2, 3, (214, 186, 136))
        c.rect(7, 0, 8, h - 2, TAPE)
        c.rect(3, 7, 6, 10, PAPER)
        c.hline(1, w - 2, h - 2, CARD_DARK)
    else:
        c.rect(0, 4, w - 1, h - 1, OUTLINE)
        c.rect(1, 5, w - 2, h - 2, CARD)
        for i, col in enumerate(((220, 200, 120), (190, 210, 230), (230, 220, 190), (220, 200, 120))):
            c.rect(2 + i * 3, 1 + (i % 2), 3 + i * 3, 5, col)
            c.px(2 + i * 3, 1 + (i % 2), OUTLINE)
        c.hline(1, w - 2, 5, CARD_DARK)
        c.hline(1, w - 2, h - 2, CARD_DARK)
    c.save(OBJ, name)


def degausser():
    """A bulk tape degausser on a stand: a grey cabinet with a black tunnel slot, a
    yellow MAGNETIC FIELD label, a red ON lamp."""
    w, h = 28, 24
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (138, 142, 148))
    c.hline(1, w - 2, 1, STEEL_LIGHT)
    c.rect(4, 4, w - 5, 11, (20, 22, 26))
    c.hline(4, w - 5, 11, (70, 74, 80))
    c.rect(4, 14, 13, 19, YELLOW)
    c.rect(6, 15, 11, 18, BLACK)
    c.px(8, 16, YELLOW)
    c.px(9, 17, YELLOW)
    c.rect(20, 15, 22, 17, RED)
    c.hline(1, w - 2, h - 2, STEEL_DARK)
    c.save(OBJ, "m09_degausser1")


def drop_screen():
    """The SAFETYNET drop terminal's wall screen over the reading desk: a slim black
    monitor on a wall arm, a dark blue screen with a header bar and rows of text (the
    scenario's textVariants carry what it says)."""
    w, h = 36, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 21, OUTLINE)
    c.rect(2, 2, w - 3, 19, (14, 24, 44))
    c.rect(3, 3, w - 4, 5, (52, 132, 200))
    for i, ln in enumerate((24, 18, 26, 14)):
        c.hline(4, 4 + ln, 8 + i * 3, (120, 186, 238) if i else (220, 230, 240))
    c.rect(16, 22, 19, 25, (60, 64, 70))          # the wall arm
    c.save(OBJ, "m09_drop_screen1")


def deck_controller():
    """The Recruiter's controller for the tape deck, left on the credenza: a small black
    box with a stubby aerial, a red key switch and a green status lamp."""
    w, h = 18, 14
    c = Canvas(w, h)
    c.rect(13, 0, 14, 4, (90, 94, 100))                # aerial
    c.rect(0, 4, w - 1, h - 1, OUTLINE)
    c.rect(1, 5, w - 2, h - 2, (46, 48, 54))
    c.hline(1, w - 2, 5, (82, 86, 94))
    c.rect(3, 7, 6, 10, RED)
    c.px(4, 8, (250, 200, 200))
    c.rect(9, 8, 10, 9, (70, 200, 110))
    c.hline(9, 15, 11, (120, 124, 130))
    c.save(OBJ, "m09_deck_controller1")


def main():
    logo_sign()
    deck_controller()
    drop_screen()
    plate("BAY 1", "m09_sign_bay1", face=YELLOW, ink=BLACK, rim=(150, 120, 30))
    plate("READING ROOM", "m09_sign_reading1")
    plate("RESTRICTED STACKS", "m09_sign_restricted1", face=(150, 36, 36), ink=CREAM, rim=(96, 22, 22))
    plate("STAFF ONLY", "m09_sign_staff1")
    plate("TAPE STORE", "m09_sign_tape1")
    plate("SALVAGE", "m09_sign_salvage1", face=(150, 36, 36), ink=CREAM, rim=(96, 22, 22))
    plate("BAY 2", "m09_sign_bay2", face=YELLOW, ink=BLACK, rim=(150, 120, 30))
    plate("DIRECTOR", "m09_sign_director1")
    plate("SERIES R", "m09_sign_series_r1", face=(150, 36, 36), ink=CREAM, rim=(96, 22, 22))
    two_line_plate("CLIENT DEPOSITS", "BAYS 1 - 12", "m09_sign_stacks1")
    two_line_plate("RETURNS", "AND ENQUIRIES", "m09_sign_returns1")
    for n in (10, 11, 12):
        bay_plate(n, f"m09_bay_plate{n}")
    bay_label()
    shelf_legend()
    rubber_stamp()
    hatch_counter()
    mesh_low()
    keypad()
    door_controller()
    crate("ALPHA", "m09_crate_alpha1")
    crate("BETA", "m09_crate_beta1")
    archive_box("m09_box_taped1", "taped")
    archive_box("m09_box_open1", "open")
    degausser()


if __name__ == "__main__":
    main()
