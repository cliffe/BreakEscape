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

Usage: python3 scripts/room_gen/make_uni_props.py [--out DIR] [--only name1,name2]
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
    """Two lines in 14px: the bottom rim row is painted over so "QUIET" doesn't
    run into it (round 2: in RIM grey on the rim it read as "OUITFT")."""
    c = Canvas(44, 14)
    c.sign_panel(TEAL_DARK)
    c.hline(2, 41, 12, TEAL_DARK)
    c.text_centred(0, 43, 2, "LIBRARY", WHITE)
    c.text_centred(0, 43, 8, "QUIET", TEAL_LIGHT)
    return c


def special_sign():
    c = Canvas(64, 14)
    c.sign_panel(TEAL_DARK)
    c.text_centred(0, 63, 2, "SPECIAL", BRASS)
    c.text_centred(0, 63, 8, "COLLECTIONS", WHITE)
    return c


def staff_sign():
    c = Canvas(64, 14)
    c.sign_panel(TEAL_DARK)
    c.text_centred(0, 63, 2, "COMPUTING", BRASS)
    c.text_centred(0, 63, 8, "STAFF ONLY", WHITE)
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


# --- dressing round 1 (ROOM_DRESSING_R1.md): wall TV, certificate, portrait ----

FRAME_DARK = (81, 48, 45)      # picture frames (picture1, picture11)
FRAME = (113, 73, 65)
FRAME_LIGHT = (175, 97, 68)
GILT = (196, 156, 60)
GILT_DARK = (140, 104, 36)


def wall_tv():
    """Common-room wall TV, front on: black bezel, a quiz show (blue set, two
    contestant podiums, a question bar), a small bracket shadow below."""
    c = Canvas(40, 26)
    c.rect(0, 0, 39, 23, BLACK)
    c.rect(2, 2, 37, 20, NAVY)
    c.rect(2, 2, 37, 9, NAVY_LIGHT)                 # studio back wall
    for x in range(4, 36, 6):                       # stage lights
        c.px(x, 3, YELLOW)
    c.rect(8, 9, 13, 14, MAGENTA)                   # podiums
    c.rect(26, 9, 31, 14, TEAL_LIGHT)
    c.rect(10, 6, 11, 8, (230, 190, 150))           # contestants' heads
    c.rect(28, 6, 29, 8, (150, 100, 70))
    c.rect(4, 16, 35, 19, BLUE)                     # question bar
    c.hline(6, 30, 17, WHITE)
    c.hline(6, 22, 18, STEEL_LIGHT)
    c.px(37, 21, (0, 200, 90))                      # power light on the bezel
    c.rect(14, 24, 25, 25, OUTLINE)                 # wall bracket below
    return c


def certificate():
    """Framed certificate (Sidhu's office): black frame, cream sheet, a title
    line, text lines and a red seal with a ribbon."""
    c = Canvas(18, 14)
    c.rect(0, 0, 17, 13, BLACK)
    c.rect(1, 1, 16, 12, (238, 230, 205))
    c.hline(4, 13, 3, NAVY)
    c.hline(3, 14, 5, GREY_TEXT)
    c.hline(3, 11, 7, GREY_TEXT)
    c.rect(12, 8, 14, 10, RED)                      # seal
    c.px(13, 9, BRASS)
    c.px(12, 11, RED_DARK)
    c.px(14, 11, RED_DARK)
    c.hline(3, 8, 10, INK)                          # signature
    return c


def portrait():
    """The founder's portrait for Special Collections: gilt frame, dark oil
    background, a grey-haired figure in a black gown with a white collar."""
    c = Canvas(22, 28)
    c.rect(0, 0, 21, 27, GILT_DARK)
    c.frame(1, 1, 20, 26, GILT)
    c.rect(2, 2, 19, 25, (46, 38, 34))              # dark varnish
    c.rect(3, 3, 18, 12, (62, 50, 42))              # lighter behind the head
    c.rect(8, 6, 13, 12, (214, 176, 140))           # face
    c.rect(8, 4, 13, 6, (196, 196, 200))            # grey hair
    c.px(7, 6, (196, 196, 200))
    c.px(14, 6, (196, 196, 200))
    c.px(9, 9, INK)                                 # eyes
    c.px(12, 9, INK)
    c.rect(5, 14, 16, 25, BLACK)                    # gown
    c.rect(4, 17, 17, 25, BLACK)
    c.rect(9, 13, 12, 15, WHITE)                    # collar
    c.rect(6, 22, 8, 23, (214, 176, 140))           # a hand on a book
    c.rect(9, 21, 13, 24, RED_DARK)
    c.frame(0, 0, 21, 27, GILT_DARK)
    return c


# --- round 2 (ROOM_DRESSING_R2.md) --------------------------------------------------

BUNTING_COLOURS = (MAGENTA, YELLOW, TEAL_LIGHT, LIME, ORANGE, BLUE)


def bunting(width):
    """A strand of triangular flags on a sagging string, for the back wall."""
    c = Canvas(width, 10)
    sag = lambda x: 1 + round(3 * (1 - ((2 * x / (width - 1)) - 1) ** 2))
    for x in range(width):
        c.px(x, sag(x), OUTLINE)
    for k, x0 in enumerate(range(2, width - 5, 8)):
        col = BUNTING_COLOURS[k % len(BUNTING_COLOURS)]
        top = sag(x0 + 2) + 1
        for j, (off, wdt) in enumerate(((0, 5), (0, 5), (1, 3), (1, 3), (2, 1))):
            for i in range(wdt):
                c.px(x0 + off + i, top + j, col)
    return c


def banner_society():
    """Pull-up banner for the Cyber Security Society, same build as the CryptoSecure one."""
    c = Canvas(22, 58)
    c.rect(4, 0, 17, 1, STEEL_DARK)
    c.rect(2, 1, 19, 53, OUTLINE)
    c.rect(3, 2, 18, 52, BLACK)
    # the society's padlock, as on its poster
    c.frame(8, 5, 13, 9, LIME)
    c.rect(7, 9, 14, 15, LIME)
    c.rect(10, 11, 11, 13, BLACK)
    c.text_centred(3, 18, 19, "SEC", LIME)
    c.text_centred(3, 18, 26, "SOC", WHITE)
    c.rect(3, 34, 18, 36, MAGENTA)
    for y in (40, 42, 44):
        c.hline(5, 16 - (y % 3), y, GREY_TEXT)
    c.text_centred(3, 18, 46, "CTF", YELLOW)
    c.rect(0, 54, 21, 57, STEEL_DARK)
    c.hline(1, 20, 55, STEEL_LIGHT)
    c.hline(0, 21, 57, OUTLINE)
    return c


def build_screen():
    """Dr Schreuders' build (workshop back wall, replaces the landscape picture in
    the smartscreen slot): a wall screen showing a live floor plan of the building,
    rooms drawn to the game's world layout, small figures moving about. Yours (the
    hoodie, yellow) is in the workshop, next to a second one by the scoreboard."""
    c = Canvas(48, 34)
    c.rect(0, 0, 47, 31, BLACK)
    c.rect(2, 2, 45, 29, NAVY)
    # world rooms (x0, y0, x1, y1), floor only, from check_door_alignment's layout
    rooms = {
        "special": (-320, -320, 0, -128), "workshop": (0, -320, 320, -128), "seminar": (320, -320, 640, -128),
        "library": (-640, -64, 0, 0), "corridor": (0, -64, 320, 0), "sidhu": (320, -64, 640, 0),
        "lab": (-320, 64, 0, 320), "foyer": (0, 64, 320, 256), "common": (320, 64, 640, 256),
        "staff": (640, 64, 1280, 320), "lecture": (0, 320, 640, 576),
    }
    sx = lambda x: 3 + round((x + 640) * 41 / 1920)
    sy = lambda y: 3 + round((y + 384) * 25 / 960)
    for name, (x0, y0, x1, y1) in rooms.items():
        col = TEAL_LIGHT if name == "workshop" else TEAL
        c.frame(sx(x0), sy(y0), sx(x1) - 1, sy(y1) - 1, col)
    # figures: you (yellow hood) and a stranger in the workshop, people elsewhere
    for x, y, col in ((15, 8, YELLOW), (18, 7, WHITE), (16, 18, WHITE), (24, 16, WHITE),
                      (34, 18, WHITE), (9, 19, WHITE), (20, 24, WHITE)):
        c.px(x, y, col)
        c.px(x, y + 1, col)
    c.hline(3, 12, 28, STEEL_DARK)                  # status bar
    c.px(44, 28, (0, 200, 90))
    c.rect(18, 32, 29, 33, OUTLINE)                 # wall bracket
    return c


def drinking_fountain():
    """Wall-hung drinking fountain: steel bowl and push button on a back plate."""
    c = Canvas(14, 22)
    c.rect(2, 0, 11, 13, STEEL_LIGHT)               # back plate
    c.frame(2, 0, 11, 13, STEEL_DARK)
    c.rect(0, 12, 13, 17, STEEL)                    # bowl
    c.hline(1, 12, 12, WHITE)
    c.hline(0, 13, 17, STEEL_DARK)
    c.rect(1, 13, 12, 13, STEEL_DARK)               # basin rim shadow
    c.px(6, 11, STEEL_DARK); c.px(7, 11, STEEL_DARK)  # spout
    c.rect(9, 4, 10, 6, BLUE)                       # button
    c.rect(4, 18, 9, 21, STEEL_DARK)                # trap under the bowl
    c.rect(5, 18, 8, 20, STEEL)
    return c


def radiator():
    """Low white panel radiator with fins and a valve, for under a wall poster."""
    c = Canvas(26, 10)
    c.rect(0, 0, 25, 8, WHITE)
    c.frame(0, 0, 25, 8, RIM)
    for x in range(2, 24, 3):
        c.rect(x, 1, x, 7, (214, 217, 222))
    c.hline(0, 25, 9, OUTLINE)
    c.rect(24, 6, 25, 9, STEEL_DARK)                # valve
    return c


def fire_door_sign():
    """UK blue mandatory sign, FIRE DOOR KEEP SHUT, too small to letter."""
    c = Canvas(11, 11)
    for y in range(11):
        for x in range(11):
            d = (x - 5) ** 2 + (y - 5) ** 2
            if d <= 30:
                c.px(x, y, BLUE_DARK if d > 24 else BLUE)
    c.hline(3, 7, 3, WHITE)
    c.hline(2, 8, 5, WHITE)
    c.hline(3, 7, 7, WHITE)
    return c


def dartboard():
    """Dartboard: black surround, 20 alternating black and cream segments, a red
    and green double ring, a red bull."""
    import math
    cream = (232, 220, 186)
    c = Canvas(16, 16)
    for y in range(16):
        for x in range(16):
            dx, dy = x - 7.5, y - 7.5
            r = math.hypot(dx, dy)
            if r > 7.8:
                continue
            seg = int((math.atan2(dy, dx) + math.pi) / (2 * math.pi) * 20) % 20
            if r > 6.6:
                col = BLACK
            elif r > 5.4:
                col = RED if seg % 2 else GREEN
            elif r > 1.6:
                col = BLACK if seg % 2 else cream
            else:
                col = RED
            c.px(x, y, col)
    return c


def small_sign(width, words):
    c = Canvas(width, 11)
    c.sign_panel(TEAL_DARK)
    c.text_centred(0, width - 1, 3, words, WHITE)
    return c


PROPS = {
    "uni_bunting1": lambda: bunting(104),
    "uni_bunting2": lambda: bunting(64),
    "uni_banner_soc1": banner_society,
    "smartscreen2": build_screen,
    "uni_fountain1": drinking_fountain,
    "uni_radiator1": radiator,
    "uni_firedoor_sign1": fire_door_sign,
    "uni_dartboard1": dartboard,
    "uni_sign_returns1": lambda: small_sign(32, "RETURNS"),
    "uni_sign_study1": lambda: small_sign(44, "STUDY AREA"),
    "uni_tv1": wall_tv,
    "uni_certificate1": certificate,
    "uni_portrait1": portrait,
    "uni_crest_sign1": crest_sign,
    "uni_sign_library1": library_sign,
    "uni_sign_special1": special_sign,
    "uni_sign_staff1": staff_sign,
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


# --- lecture theatre writing ledges (tables layer: their bottom-quarter body
# makes a seat row solid; 20px wider than the seat block, so the inset body
# matches the seats) --------------------------------------------------------

LEDGE_TOP = (186, 140, 94)
LEDGE_HI = (212, 170, 120)
LEDGE_EDGE = (128, 86, 54)
LEDGE_DARK = (82, 54, 34)


def ledge(width):
    c = Canvas(width, 12)
    c.rect(0, 0, width - 1, 6, LEDGE_TOP)       # writing surface
    c.hline(0, width - 1, 0, LEDGE_DARK)
    c.hline(1, width - 2, 1, LEDGE_HI)
    c.rect(0, 7, width - 1, 9, LEDGE_EDGE)      # front edge
    c.hline(0, width - 1, 10, LEDGE_DARK)
    for x in range(8, width - 4, 18):           # a bracket under every seat
        c.rect(x, 10, x + 1, 11, LEDGE_DARK)
    c.rect(0, 0, 0, 10, LEDGE_DARK)
    c.rect(width - 1, 0, width - 1, 10, LEDGE_DARK)
    return c


PROPS["lecture_ledge1"] = lambda: ledge(198)   # west block: seats x 96-274
PROPS["lecture_ledge2"] = lambda: ledge(252)   # east block: seats x 340-572


def main(argv):
    out = OBJ
    if "--out" in argv:
        out = Path(argv[argv.index("--out") + 1])
        out.mkdir(parents=True, exist_ok=True)
    only = None
    if "--only" in argv:                         # --only name1,name2: draw just these
        only = set(argv[argv.index("--only") + 1].split(","))
    for name, fn in PROPS.items():
        if only is not None and name not in only:
            continue
        fn().save(out, name)


if __name__ == "__main__":
    main(sys.argv[1:])
