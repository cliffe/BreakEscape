#!/usr/bin/env python3
"""
Hand-drawn university props for the room_uni_* maps (ROOMS_PLAN.md, lab_tesseract_trials, 4.1).

Every sprite is drawn pixel by pixel at its native size with PIL, using the
palette and outline of the existing wall signs (directory_sign1, exit_sign1,
fire_action_notice1, whiteboard1: grey frame (100,98,105), light rim
(178,180,186), white faces, the hospital blue) plus the university teal of the
room sheets. The two locker sprites are pixel edits of staff_lockers1: the
letters P/B/C become 1/2/3, and the single locker is that art's first column,
numbered 4, with a four-digit keypad on its door.

Nothing is rescaled. Miskatonic is fictional; the crest is a plain shield with an M.

Writes PNGs into public/break_escape/assets/objects/ (then register them with
register_object.py, --wall for the wall items).

Usage: python3 scripts/room_gen/make_uni_props.py [--out DIR]
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OBJ = ROOT / "public/break_escape/assets/objects"

CLEAR = (0, 0, 0, 0)
OUTLINE = (100, 98, 105)
RIM = (178, 180, 186)
WHITE = (245, 246, 247)
PAPER = (233, 237, 239)
INK = (43, 42, 49)
GREY_TEXT = (137, 140, 148)
BLUE = (0, 94, 184)
BLUE_DARK = (0, 72, 146)
NAVY = (16, 36, 74)
NAVY_LIGHT = (40, 62, 104)
TEAL = (38, 98, 108)
TEAL_DARK = (24, 66, 74)
TEAL_LIGHT = (78, 146, 152)
RED = (180, 37, 40)
RED_DARK = (130, 26, 30)
GREEN = (4, 125, 45)
YELLOW = (253, 232, 43)
YELLOW_DARK = (210, 180, 30)
BRASS = (223, 196, 39)
BRASS_DARK = (170, 130, 28)
STEEL = (150, 156, 164)
STEEL_LIGHT = (186, 191, 198)
STEEL_DARK = (96, 101, 110)
MAGENTA = (176, 52, 128)
ORANGE = (236, 128, 40)
LIME = (110, 200, 80)
BLACK = (24, 24, 28)

# 3x5 pixel font
FONT = {
    "A": ["###", "#.#", "###", "#.#", "#.#"], "B": ["##.", "#.#", "##.", "#.#", "##."],
    "C": ["###", "#..", "#..", "#..", "###"], "D": ["##.", "#.#", "#.#", "#.#", "##."],
    "E": ["###", "#..", "##.", "#..", "###"], "F": ["###", "#..", "##.", "#..", "#.."],
    "G": ["###", "#..", "#.#", "#.#", "###"], "H": ["#.#", "#.#", "###", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"], "K": ["#.#", "#.#", "##.", "#.#", "#.#"],
    "L": ["#..", "#..", "#..", "#..", "###"], "M": ["#.#", "###", "###", "#.#", "#.#"],
    "N": ["##.", "#.#", "#.#", "#.#", "#.#"], "O": ["###", "#.#", "#.#", "#.#", "###"],
    "P": ["###", "#.#", "###", "#..", "#.."], "Q": ["###", "#.#", "#.#", "###", "..#"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"], "S": ["###", "#..", "###", "..#", "###"],
    "T": ["###", ".#.", ".#.", ".#.", ".#."], "U": ["#.#", "#.#", "#.#", "#.#", "###"],
    "W": ["#.#", "#.#", "###", "###", "#.#"], "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
    "V": ["#.#", "#.#", "#.#", "#.#", ".#."], "X": ["#.#", "#.#", ".#.", "#.#", "#.#"],
    "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"],
    "3": ["##.", "..#", ".#.", "..#", "##."], "4": ["#.#", "#.#", "###", "..#", "..#"],
    "!": [".#.", ".#.", ".#.", "...", ".#."], " ": ["...", "...", "...", "...", "..."],
}


class Canvas:
    def __init__(self, w, h, fill=CLEAR):
        self.img = Image.new("RGBA", (w, h), fill if len(fill) == 4 else (*fill, 255))
        self.p = self.img.load()
        self.w, self.h = w, h

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.p[x, y] = c if len(c) == 4 else (*c, 255)

    def rect(self, x0, y0, x1, y1, c):
        """Filled rectangle, inclusive corners."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def frame(self, x0, y0, x1, y1, c):
        for x in range(x0, x1 + 1):
            self.px(x, y0, c)
            self.px(x, y1, c)
        for y in range(y0, y1 + 1):
            self.px(x0, y, c)
            self.px(x1, y, c)

    def hline(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)

    def text(self, x, y, s, c):
        for ch in s:
            g = FONT[ch]
            for j, row in enumerate(g):
                for i, v in enumerate(row):
                    if v == "#":
                        self.px(x + i, y + j, c)
            x += 4

    def text_centred(self, cx0, cx1, y, s, c):
        width = len(s) * 4 - 1
        self.text(cx0 + (cx1 - cx0 + 1 - width) // 2, y, s, c)

    def sign_panel(self, face):
        """The house style of the existing wall signs: grey outline, light rim, coloured face."""
        self.rect(0, 0, self.w - 1, self.h - 1, OUTLINE)
        self.frame(1, 1, self.w - 2, self.h - 2, RIM)
        self.rect(2, 2, self.w - 3, self.h - 3, face)

    def save(self, out_dir, name):
        path = Path(out_dir) / f"{name}.png"
        self.img.save(path)
        print(f"wrote {path} {self.w}x{self.h}")


# --- signs and panels -----------------------------------------------------------

def shield(c, x0, y0, field=TEAL, rim=BRASS, letter=WHITE):
    """A 9x10 shield with an M: flat top, sides straight for 6 rows, then a point."""
    rows = [9, 9, 9, 9, 9, 9, 7, 5, 3, 1]
    for j, wdt in enumerate(rows):
        off = (9 - wdt) // 2
        for i in range(wdt):
            edge = i == 0 or i == wdt - 1 or j == 0 or (j == len(rows) - 1)
            c.px(x0 + off + i, y0 + j, rim if edge else field)
    m = ["#...#", "##.##", "#.#.#", "#...#", "#...#"]
    for j, row in enumerate(m):
        for i, v in enumerate(row):
            if v == "#":
                c.px(x0 + 2 + i, y0 + 2 + j, letter)


def crest_sign():
    c = Canvas(44, 22)
    c.sign_panel(TEAL_DARK)
    shield(c, 17, 3)
    c.hline(4, 14, 7, TEAL_LIGHT)   # "MISKATONIC" either side, too small to letter
    c.hline(29, 39, 7, TEAL_LIGHT)
    c.text_centred(0, 43, 15, "COMPUTING", WHITE)
    return c


def library_sign():
    c = Canvas(44, 14)
    c.sign_panel(TEAL_DARK)
    c.text_centred(0, 43, 2, "LIBRARY", WHITE)
    c.text_centred(0, 43, 8, "QUIET", RIM)
    return c


def special_sign():
    c = Canvas(64, 14)
    c.sign_panel(TEAL_DARK)
    c.text_centred(0, 63, 2, "SPECIAL", BRASS)
    c.text_centred(0, 63, 8, "COLLECTIONS", WHITE)
    return c


def directory():
    """Narrow side-wall directory: a title bar and three lines, each with an arrow
    (W, E, N). 16x18, so it fits under a side door with its top-left corner (the
    tap anchor) more than 32px from the door's centre."""
    c = Canvas(16, 18)
    c.sign_panel(BLUE)
    c.rect(2, 2, 13, 3, NAVY)
    c.hline(4, 11, 2, WHITE)
    for k, a in enumerate(["L", "R", "U"]):
        y = 6 + k * 4
        # thick chevrons: a shaft and thin arms on a 3px band read as crosses
        pts = {"L": [(4, -1), (3, 0), (4, 1), (5, -1), (4, 0), (5, 1)],
               "R": [(4, -1), (5, 0), (4, 1), (5, -1), (6, 0), (5, 1)],
               "U": [(3, 1), (4, 0), (5, -1), (6, 0), (7, 1), (4, 1), (5, 0), (6, 1)]}[a]
        for dx, dy in pts:
            c.px(dx, y + dy, WHITE)
        c.hline(9, 12 - (k % 2), y, WHITE)
    return c


def door_card():
    c = Canvas(20, 24)
    c.rect(0, 0, 19, 15, OUTLINE)
    c.rect(1, 1, 18, 14, WHITE)
    c.rect(1, 1, 18, 4, TEAL)
    c.hline(3, 16, 3, WHITE)             # "SCHOOL OF COMPUTING"
    c.hline(3, 14, 7, INK)               # Dr S. Selvarajan
    c.hline(3, 11, 9, GREY_TEXT)         # Reader in Cyber Security
    c.hline(3, 13, 12, GREY_TEXT)
    # yellow office-hours slip taped under the card
    c.rect(3, 15, 17, 23, YELLOW_DARK)
    c.rect(4, 16, 16, 22, (250, 236, 120))
    c.hline(6, 14, 15, (220, 220, 210))  # tape
    c.hline(5, 14, 18, INK)
    c.hline(5, 12, 20, GREY_TEXT)
    return c


def timetable():
    c = Canvas(16, 22)
    c.rect(0, 0, 15, 21, OUTLINE)
    c.rect(1, 1, 14, 20, PAPER)
    c.rect(1, 1, 14, 3, TEAL)
    c.hline(3, 12, 2, WHITE)
    cells = [BLUE, LIME, ORANGE, MAGENTA, PAPER]
    for row in range(5):
        y = 5 + row * 3
        c.px(2, y, GREY_TEXT); c.px(2, y + 1, GREY_TEXT)
        for col in range(4):
            x = 4 + col * 3
            colour = cells[(row * 3 + col * 2) % len(cells)]
            if colour != PAPER:
                c.rect(x, y, x + 1, y + 1, colour)
    return c


def projector_screen():
    """Wall projector screen: grey case bar, white screen with a title slide."""
    c = Canvas(88, 42)
    c.rect(0, 0, 87, 4, OUTLINE)
    c.rect(1, 1, 86, 3, STEEL_LIGHT)
    c.hline(1, 86, 3, STEEL)
    c.rect(2, 5, 85, 39, RIM)
    c.rect(3, 5, 84, 38, WHITE)
    # slide: teal band, title, subtitle lines, crest
    c.rect(8, 9, 79, 31, PAPER)
    c.rect(8, 9, 79, 12, TEAL)
    shield(c, 11, 15)
    c.text(24, 15, "WELCOME TO", NAVY)
    c.text(24, 22, "COMPUTING", TEAL)
    c.hline(24, 70, 28, GREY_TEXT)
    # bottom bar and pull cord
    c.rect(2, 39, 85, 40, OUTLINE)
    c.px(44, 41, OUTLINE)
    return c


def drop_box():
    """Wall-mounted steel post box: post slot, a small keypad, the CryptoSecure mark."""
    c = Canvas(20, 24)
    c.rect(0, 0, 19, 23, STEEL_DARK)
    c.rect(1, 1, 18, 22, STEEL)
    c.hline(1, 18, 1, STEEL_LIGHT)
    c.rect(1, 1, 1, 22, STEEL_LIGHT)
    # sloped hood and slot
    c.rect(3, 4, 16, 5, STEEL_DARK)
    c.hline(4, 15, 5, BLACK)
    # CryptoSecure mark: navy roundel with a key
    c.rect(3, 9, 8, 14, NAVY)
    c.px(4, 11, YELLOW); c.px(5, 11, YELLOW); c.px(4, 12, YELLOW); c.px(5, 12, YELLOW)
    c.hline(6, 7, 12, YELLOW)
    # keypad: dark panel, 3x3 keys
    c.rect(11, 9, 17, 17, BLACK)
    for j in range(3):
        for i in range(3):
            c.px(12 + i * 2, 10 + j * 2, STEEL_LIGHT)
    c.px(16, 16, GREEN)
    # hinge line and foot shadow
    c.hline(2, 17, 20, STEEL_DARK)
    c.hline(0, 19, 23, OUTLINE)
    return c


def banner():
    """Pull-up banner on its foot: CryptoSecure mark, the studentship, slogan lines."""
    c = Canvas(22, 58)
    c.rect(4, 0, 17, 1, STEEL_DARK)          # top rail
    c.rect(2, 1, 19, 53, OUTLINE)
    c.rect(3, 2, 18, 52, NAVY)
    # padlock logo
    c.frame(8, 5, 13, 9, YELLOW)
    c.rect(7, 9, 14, 15, YELLOW)
    c.rect(10, 11, 11, 13, NAVY)
    c.hline(5, 16, 18, WHITE)                 # CRYPTOSECURE
    c.hline(6, 15, 20, TEAL_LIGHT)
    c.text_centred(3, 18, 24, "KEY", YELLOW)  # THE KEYHOLDER STUDENTSHIP
    c.hline(5, 16, 31, WHITE)
    c.hline(5, 14, 33, WHITE)
    c.rect(3, 37, 18, 40, TEAL)
    for y in (43, 45, 47):
        c.hline(5, 16 - (y % 3), y, NAVY_LIGHT)
    # foot cassette
    c.rect(0, 54, 21, 57, STEEL_DARK)
    c.hline(1, 20, 55, STEEL_LIGHT)
    c.hline(0, 21, 57, OUTLINE)
    return c


# --- posters (16x21, as health_poster1) ------------------------------------------

def poster_base(bg):
    c = Canvas(16, 21)
    c.rect(0, 0, 15, 20, RIM)
    c.rect(1, 1, 14, 19, bg)
    return c


def poster_freshers():
    c = poster_base(MAGENTA)
    # balloons and a star burst
    for cx, cy, col in ((4, 5, YELLOW), (8, 3, LIME), (11, 6, ORANGE)):
        c.rect(cx - 1, cy - 1, cx + 1, cy + 1, col)
        c.px(cx, cy + 2, WHITE); c.px(cx, cy + 3, WHITE)
    c.text_centred(0, 15, 11, "HI!", WHITE)
    c.hline(3, 12, 17, YELLOW)
    return c


def poster_society():
    c = poster_base(BLACK)
    c.frame(6, 3, 9, 6, LIME)
    c.rect(5, 6, 10, 10, LIME)
    c.px(7, 8, BLACK); c.px(8, 8, BLACK)
    c.text_centred(0, 15, 12, "SEC", LIME)
    c.hline(3, 12, 18, GREY_TEXT)
    return c


def poster_ctf():
    c = poster_base(NAVY)
    # red flag on a pole
    c.rect(4, 2, 4, 10, WHITE)
    c.rect(5, 2, 10, 5, RED)
    c.rect(5, 6, 8, 6, RED_DARK)
    c.text_centred(0, 15, 12, "CTF", YELLOW)
    c.hline(3, 12, 18, TEAL_LIGHT)
    return c


def poster_verify():
    c = poster_base(WHITE)
    c.rect(1, 1, 14, 4, NAVY)
    c.hline(3, 12, 2, YELLOW)
    # big tick
    for i, (x, y) in enumerate([(4, 10), (5, 11), (6, 12), (7, 11), (8, 10), (9, 9), (10, 8), (11, 7)]):
        c.px(x, y, GREEN); c.px(x, y + 1, GREEN)
    c.hline(3, 12, 16, INK)
    c.hline(4, 11, 18, GREY_TEXT)
    return c


def poster_glasses():
    """UK blue mandatory sign: safety glasses must be worn."""
    c = poster_base(WHITE)
    for y in range(2, 13):
        for x in range(2, 14):
            if (x - 7.5) ** 2 + (y - 7.5) ** 2 <= 30:
                c.px(x, y, BLUE)
    c.rect(4, 7, 6, 8, WHITE); c.rect(9, 7, 11, 8, WHITE); c.hline(7, 8, 7, WHITE)
    c.hline(3, 12, 15, INK)
    c.hline(4, 11, 17, GREY_TEXT)
    return c


def poster_no_food():
    """Prohibition sign: a cup and a sandwich under a red slash."""
    c = poster_base(WHITE)
    for y in range(2, 14):
        for x in range(2, 14):
            d = (x - 7.5) ** 2 + (y - 7.5) ** 2
            if 20 <= d <= 34:
                c.px(x, y, RED)
    c.rect(5, 7, 7, 10, INK)        # cup
    c.px(8, 8, INK)
    c.rect(9, 9, 10, 10, ORANGE)    # sandwich
    for i in range(8):
        c.px(4 + i, 4 + i, RED)
        c.px(5 + i, 4 + i, RED)
    c.hline(3, 12, 16, INK)
    c.hline(4, 11, 18, GREY_TEXT)
    return c


# --- lockers (pixel edits of staff_lockers1) ---------------------------------------

LOCKER_DOOR = (75, 109, 149)
LOCKER_DIGIT = (242, 243, 244)


def digit(c, x, y, ch):
    for j, row in enumerate(FONT[ch]):
        for i, v in enumerate(row):
            if v == "#":
                c.px(x + i, y + j, LOCKER_DIGIT)


def student_lockers():
    src = Image.open(OBJ / "staff_lockers1.png").convert("RGBA")
    c = Canvas(src.width, src.height)
    c.img.paste(src)
    c.p = c.img.load()
    # clear the letters (rows 21-25 inside each door) and number the doors 1-3
    for x0, x1, dx, ch in ((4, 12, 6, "1"), (21, 29, 22, "2"), (38, 46, 40, "3")):
        c.rect(x0, 21, x1, 25, LOCKER_DOOR)
        digit(c, dx, 21, ch)
    return c


def student_locker():
    """One column (the first door of staff_lockers1), numbered 4, with a keypad."""
    src = Image.open(OBJ / "staff_lockers1.png").convert("RGBA").crop((0, 0, 16, 62))
    c = Canvas(16, 62)
    c.img.paste(src)
    c.p = c.img.load()
    c.rect(4, 21, 12, 25, LOCKER_DOOR)
    digit(c, 6, 21, "4")
    # four-digit keypad above the handle: dark panel, 3x4 keys, a green lamp
    c.rect(5, 27, 11, 33, (35, 43, 60))
    for j in range(3):
        for i in range(3):
            c.px(6 + i * 2, 28 + j * 2, (169, 180, 185))
    c.px(10, 33, (0, 200, 90))
    return c


PROPS = {
    "uni_crest_sign1": crest_sign,
    "uni_sign_library1": library_sign,
    "uni_sign_special1": special_sign,
    "uni_directory1": directory,
    "uni_doorcard1": door_card,
    "uni_timetable1": timetable,
    "projector_screen1": projector_screen,
    "drop_box1": drop_box,
    "cryptosecure_banner1": banner,
    "uni_poster1": poster_freshers,
    "uni_poster2": poster_society,
    "uni_poster3": poster_ctf,
    "uni_poster4": poster_verify,
    "uni_poster6": poster_glasses,
    "uni_poster7": poster_no_food,
    "student_lockers1": student_lockers,
    "student_locker1": student_locker,
}


def main(argv):
    out = OBJ
    if "--out" in argv:
        out = Path(argv[argv.index("--out") + 1])
        out.mkdir(parents=True, exist_ok=True)
    for name, fn in PROPS.items():
        fn().save(out, name)


if __name__ == "__main__":
    main(sys.argv[1:])
