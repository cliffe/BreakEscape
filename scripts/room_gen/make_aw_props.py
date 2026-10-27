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
The logo plates use a local copy of the font with a round Q, a 4-wide N and an
"&" (the shared glyphs read as 9, n and nothing). Nothing is rescaled.

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

# The logo plates use their own copy of the 3x5 font, so other props keep the
# shared glyphs. Four overrides (ROOMS_REVIEW_C1 M2, t1): the shared Q reads as
# a 9 and the N as a lower-case n, and the 3x5 font has no "&". These are 4 px
# wide; logo_text() advances by each glyph's own width plus a 1 px gap.
LOGO_FONT = dict(U.FONT)
LOGO_FONT.update({
    "Q": [".##.", "#..#", "#..#", "#.#.", ".#.#"],
    "N": ["#..#", "##.#", "#.##", "#..#", "#..#"],
    "W": ["#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],     # C2 m1: the shared W reads as an H
    "M": ["#...#", "##.##", "#.#.#", "#...#", "#...#"],     # C3 m1: the shared M reads as an H
    "&": [".#..", "#.#.", ".#..", "#.#.", ".#.#"],
})


def logo_text(c, x, y, s, colour):
    for ch in s:
        g = LOGO_FONT[ch]
        for j, row in enumerate(g):
            for i, v in enumerate(row):
                if v == "#":
                    c.px(x + i, y + j, colour)
        x += len(g[0]) + 1


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
    logo_text(c, tx, 3, top, WHITE)
    c.hline(tx, w - 5, 9, light(accent))
    logo_text(c, tx, 11, bottom, WHITE)   # C2 t1: white, as Merrin's was
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


# --- room dressing (ROOMS_REVIEW_C1 M1, M3, m1, m3, t3) ------------------------

OAT_GOLD, OAT_DARK, CREAM = (232, 204, 128), (176, 140, 70), (240, 232, 206)


def oatbox():
    """Brightwell: an open carton of the company's oat bars, for the training table
    (14x13; the open top shows the wrapped bars, the front the oat mark)."""
    accent = hexrgb(COMPANIES["brightwell"][0])
    edge = dark(accent)
    c = Canvas(14, 13)
    # open top: bars stood on end in a row, gold and cream wrappers
    c.rect(0, 0, 13, 4, edge)
    for i, x in enumerate(range(1, 13, 2)):
        col = OAT_GOLD if i % 2 == 0 else CREAM
        c.rect(x, 1, x + 1, 3, col)
        c.px(x, 1, mix(col, (255, 255, 255), 0.4))
    # front face
    c.rect(0, 4, 13, 12, edge)
    c.rect(1, 5, 12, 11, accent)
    c.hline(1, 12, 5, light(accent))
    for y in range(6, 11):                       # a little oat ear
        c.px(3, y, OAT_DARK)
    for y in (6, 8):
        c.px(2, y, OAT_GOLD)
        c.px(4, y + 1, OAT_GOLD)
    c.rect(6, 7, 11, 9, CREAM)                   # label
    c.hline(7, 10, 8, OAT_DARK)
    c.hline(1, 12, 11, dark(accent))
    c.save(OBJ, "aw_brightwell_oatbox1")


def range_poster():
    """Brightwell: a framed product-range poster, three cartons under a green header (30x24)."""
    accent = hexrgb(COMPANIES["brightwell"][0])
    c = Canvas(30, 24)
    c.rect(0, 0, 29, 23, (92, 70, 48))           # wooden frame
    c.frame(1, 1, 28, 22, (128, 98, 66))
    c.rect(2, 2, 27, 21, PAPER)
    c.rect(2, 2, 27, 8, accent)
    logo_text(c, 6, 3, "RANGE", WHITE)
    packs = [(accent, OAT_GOLD), ((196, 120, 48), CREAM), ((150, 52, 58), OAT_GOLD)]
    for k, (box, band) in enumerate(packs):
        x0 = 4 + k * 8
        c.rect(x0, 11, x0 + 5, 19, dark(box))
        c.rect(x0 + 1, 12, x0 + 4, 18, box)
        c.hline(x0 + 1, x0 + 4, 15, band)
        c.px(x0 + 2, 13, band)
    c.hline(3, 26, 20, light(accent))
    c.save(OBJ, "aw_brightwell_range1")


def hard_hat():
    """Tarrowby: a yellow hard hat put down on the table (14x10)."""
    yel, shade_, hi, edge = (240, 196, 40), (196, 150, 20), (255, 232, 130), (96, 72, 20)
    c = Canvas(14, 10)
    rows = ["....######....",
            "..##########..",
            ".############.",
            ".############.",
            ".############.",
            "##############",
            "##############"]
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == "#":
                c.px(i, j + 1, yel)
    for j, row in enumerate(rows):               # outline
        xs = [i for i, ch in enumerate(row) if ch == "#"]
        c.px(xs[0], j + 1, edge)
        c.px(xs[-1], j + 1, edge)
    c.hline(4, 9, 1, edge)
    c.hline(0, 13, 7, edge)
    c.hline(0, 13, 8, shade_)                    # the brim's shadowed lip
    c.hline(1, 12, 9, edge)
    for y in range(2, 6):                        # the ridge down the middle
        c.px(7, y, shade_)
    c.px(4, 3, hi)
    c.px(5, 2, hi)
    c.hline(1, 12, 6, shade_)
    c.save(OBJ, "aw_hard_hat1")


def queue_screen():
    """Quayholt: the IT service-desk queue on a wall screen (48x30). Replaces the
    sign-in page with its green button, which read as something to press (m3, t5)."""
    accent = hexrgb(COMPANIES["quayholt"][0])
    c = Canvas(48, 30)
    c.rect(0, 0, 47, 29, (36, 36, 44))
    c.rect(2, 2, 45, 26, (18, 26, 52))
    c.rect(2, 2, 45, 8, accent)
    logo_text(c, 4, 3, "QUEUE", WHITE)
    c.rect(33, 4, 43, 6, light(accent))          # ticket count block
    dots = [(70, 200, 110), (70, 200, 110), (232, 180, 60), (70, 200, 110), (210, 70, 70)]
    for k, dot in enumerate(dots):
        y = 11 + k * 3
        c.rect(5, y, 6, y + 1, dot)
        c.hline(9, 9 + (22 if k % 2 else 28), y, (150, 166, 200))
        c.hline(40, 43, y, (96, 112, 150))
    c.rect(22, 27, 25, 28, (60, 60, 70))         # mount
    c.px(44, 27, (200, 90, 90))
    c.save(OBJ, "aw_quayholt_queue1")


def recolour(src, dst, hue, sat_scale, val_scale=1.0):
    """Shift the saturated (teal) pixels of a sprite to another hue; greys stay.
    Same size, pixel for pixel."""
    import colorsys
    from PIL import Image
    im = Image.open(OBJ / f"{src}.png").convert("RGBA")
    p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = p[x, y]
            if not a:
                continue
            h, sat, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if sat > 0.25 and 0.40 < h < 0.60:
                r2, g2, b2 = colorsys.hsv_to_rgb(hue, min(1, sat * sat_scale), min(1, v * val_scale))
                p[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    im.save(OBJ / f"{dst}.png")


def copy_static(src, dst):
    """A pixel-exact copy under a name the engine doesn't treat as a wheeled chair
    (rooms.js: every `chair-*` sprite rolls when walked into)."""
    from PIL import Image
    Image.open(OBJ / f"{src}.png").save(OBJ / f"{dst}.png")


def dressing():
    oatbox()
    range_poster()
    hard_hat()
    queue_screen()
    # Tarrowby: slate-blue stacking chairs instead of the teal seminar set (M3)
    for src, dst in (("hospital_chair_south", "aw_chair_south_slate1"),
                     ("hospital_chair_north", "aw_chair_north_slate1"),
                     ("hospital_chair1", "aw_chair_w_slate1"),
                     ("chairs_stacked1", "aw_chairs_stacked_slate1")):
        recolour(src, dst, hue=0.60, sat_scale=0.75, val_scale=1.05)
    # Quayholt: charcoal chairs, so it no longer shares Brightwell's teal set (C2 m3)
    for src, dst in (("hospital_chair_south", "aw_chair_south_charcoal1"),
                     ("hospital_chair_north", "aw_chair_north_charcoal1"),
                     ("hospital_chair1", "aw_chair_w_charcoal1")):
        recolour(src, dst, hue=0.62, sat_scale=0.12, val_scale=0.55)
    # Quayholt: the spare desk's PC, switched off (pc8 glows through EMITTERS' /^pc\d*/)
    copy_static("pc8", "aw_pc_off1")
    # Merrin & Sallow: the studio chairs, static (t3)
    copy_static("chair-white-1-rotate5", "aw_studio_chair_s1")
    copy_static("chair-white-1-rotate1", "aw_studio_chair_n1")


def main():
    for key in COMPANIES:
        logo(key)
        poster(key)
    dressing()


if __name__ == "__main__":
    main()
