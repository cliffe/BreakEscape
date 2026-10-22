#!/usr/bin/env python3
"""
Hand-drawn wall signs for the awareness training rooms (room_aw_*,
planning_notes/phishing_and_social_engineering/awareness/TRAINING_ROOM_PLAN.md §3.1):

  aw_logo_<company>1          64x19 logo plate in the company's accent (BRAND_SET.md),
                              white capitals, a small mark at the left
  aw_poster_report_<company>1 16x21 side-wall poster: accent header "SEE", an
                              envelope with a red alert dot, "SAY" under it (the report
                              message; "REPORT IT" is 35px in the 3x5 font and the
                              poster is 16px wide)

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (glyphs extended by make_aes_props.py and make_hce_props.py).
The font has no "&", so this script adds one. Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; they are registered with
register_object.py --wall.

Usage: python3 scripts/room_gen/make_aw_props.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

# 4 px wide (one more than the other glyphs): it only ends a line here, so the
# extra column falls in the gap after it
U.FONT.setdefault("&", [
    ".#..",
    "#.#.",
    ".#..",
    "#.##",
    ".##.",
])

WHITE = (240, 242, 244)
OUTLINE = (24, 26, 34)
PAPER = (240, 238, 230)
INK = (44, 44, 52)
RED = (200, 46, 50)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(x + (y - x) * t) for x, y in zip(a, b))


def dark(c):
    return mix(c, (0, 0, 0), 0.4)


def light(c):
    return mix(c, (255, 255, 255), 0.55)


# --- marks (about 9x11, drawn at x0, y0) ----------------------------------------

def mark_oats(c, x0, y0, accent):
    """Brightwell: an ear of oats, a stalk with grains hanging either side."""
    gold, gold_dark = (232, 204, 128), (176, 140, 70)
    for y in range(1, 12):
        c.px(x0 + 4, y0 + y, gold_dark)
    c.px(x0 + 4, y0, gold)
    for k, y in enumerate((2, 5, 8)):
        # left grain then right grain, each 2x2 leaning out from the stalk
        c.rect(x0 + 1, y0 + y, x0 + 2, y0 + y + 1, gold)
        c.px(x0 + 3, y0 + y + 1, gold_dark)
        c.rect(x0 + 6, y0 + y + 1, x0 + 7, y0 + y + 2, gold)
        c.px(x0 + 5, y0 + y + 2, gold_dark)


def mark_chevron(c, x0, y0, accent):
    """Tarrowby: a forward double chevron."""
    for sx in (0, 4):
        for j in range(4):
            c.px(x0 + sx + j, y0 + 2 + j, WHITE)
            c.px(x0 + sx + j + 1, y0 + 2 + j, WHITE)
            c.px(x0 + sx + j, y0 + 9 - j, WHITE)
            c.px(x0 + sx + j + 1, y0 + 9 - j, WHITE)


def mark_quaypost(c, x0, y0, accent):
    """Quayholt: a quay bollard shaped into a Q (a round head, a tail at the foot)."""
    ring = [
        "..###..",
        ".#...#.",
        "#.....#",
        "#.....#",
        "#.....#",
        "#..#..#",
        ".#..##.",
        "..####.",
        "......#",
    ]
    for j, row in enumerate(ring):
        for i, ch in enumerate(row):
            if ch == "#":
                c.px(x0 + 1 + i, y0 + 1 + j, WHITE)
    c.hline(x0, x0 + 8, y0 + 11, light(accent))  # the quay edge


def mark_set_square(c, x0, y0, accent):
    """Merrin & Sallow: a 45-degree set square with its cut-out."""
    for j in range(11):
        for i in range(j + 1):
            inner = 2 <= i <= j - 3 and 4 <= j <= 9
            c.px(x0 + i, y0 + j, light(accent) if inner else WHITE)
    for j in range(4, 10):
        for i in range(2, j - 2):
            c.px(x0 + i, y0 + j, accent)


COMPANIES = {
    "brightwell": ("#2f6f5e", ("BRIGHTWELL", "FOODS"), mark_oats),
    "tarrowby": ("#3b5b8c", ("TARROWBY", "LOGISTICS"), mark_chevron),
    "quayholt": ("#6b4c9a", ("QUAYHOLT", "INSURANCE"), mark_quaypost),
    "merrin_sallow": ("#8a5a2b", ("MERRIN &", "SALLOW"), mark_set_square),
}


def logo(key):
    accent_hex, (top, bottom), mark = COMPANIES[key]
    accent = hexrgb(accent_hex)
    w, h = 64, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, accent)
    c.hline(2, w - 3, h - 3, dark(accent))
    mark(c, 4, 3, accent)
    tx = 17
    c.text(tx, 3, top, WHITE)
    c.hline(tx, w - 5, 9, light(accent))
    c.text(tx, 11, bottom, light(accent) if key != "merrin_sallow" else WHITE)
    c.save(OBJ, f"aw_logo_{key}1")


def poster(key):
    accent = hexrgb(COMPANIES[key][0])
    w, h = 16, 21
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 58, 72))
    c.rect(1, 1, w - 2, h - 2, PAPER)
    c.rect(1, 1, w - 2, 7, accent)
    c.text_centred(1, w - 2, 2, "SEE", WHITE)
    # envelope, 10x6, with the flap's V
    c.rect(3, 9, 12, 14, WHITE)
    c.frame(3, 9, 12, 14, INK)
    for dx, dy in ((4, 10), (5, 11), (6, 12), (7, 13), (8, 13), (9, 12), (10, 11), (11, 10)):
        c.px(dx, dy, INK)
    # a red alert dot at its corner
    c.rect(11, 8, 13, 10, RED)
    c.text_centred(1, w - 2, 15, "SAY", dark(accent))
    c.save(OBJ, f"aw_poster_report_{key}1")


def main():
    for key in COMPANIES:
        logo(key)
        poster(key)


if __name__ == "__main__":
    main()
