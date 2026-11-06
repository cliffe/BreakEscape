#!/usr/bin/env python3
"""
Hand-drawn wall signs for the physical-pentest lab (scenarios/lab_physical_pentest):
Ledgerwell Ltd's own wordmark for the briefing room, and name plates for the lab's
rooms (BRIEFING, RECORDS, ADMIN), so the lab no longer borrows Tarnside's
navy/teal signs from the social-engineering lab.

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (glyphs extended by make_aes_props.py and make_hce_props.py),
in the shape of m08's hq_*_sign1 plates — same construction as make_se_props.py,
but in Ledgerwell's bottle-green and brass. Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; register with
register_object.py --wall.

Usage: python3 scripts/room_gen/make_lw_props.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402,F401
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

# Ledgerwell's colours: a dark bottle-green plate with a brass rule, cream letters.
PLATE = (20, 44, 34)
BRASS = (176, 138, 60)
BRASS_DARK = (120, 94, 40)
CREAM = (238, 236, 222)
GREY = (150, 158, 150)
OUTLINE = (18, 24, 20)


def monogram(c, x0, y0):
    """A 9x11 brass plate carrying a dark 'LW' monogram: Ledgerwell's mark."""
    c.rect(x0, y0, x0 + 8, y0 + 10, BRASS_DARK)
    c.rect(x0 + 1, y0 + 1, x0 + 7, y0 + 9, BRASS)
    # LW in the 3x5 font is 7px wide; centre it in the 7px inner face
    c.text(x0 + 1, y0 + 3, "LW", PLATE)


def logo_sign():
    """LEDGERWELL over LTD in two lines, the brass 'LW' mark at the left, on a
    bottle-green plate with a brass rule along the foot (like se_logo_sign1)."""
    w, h = 72, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, PLATE)
    c.hline(2, w - 3, h - 3, BRASS)
    monogram(c, 4, 3)
    c.text(17, 3, "LEDGERWELL", CREAM)
    c.hline(17, 57, 9, BRASS_DARK)
    c.text(17, 11, "LTD", GREY)
    c.save(OBJ, "lw_logo_sign1")


def plate(text, name):
    """A room name plate, the hq_ops_sign1 shape: outline, brass rim, green face,
    cream capitals, 11px tall."""
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, OUTLINE)
    c.frame(1, 1, w - 2, 9, BRASS)
    c.rect(2, 2, w - 3, 8, PLATE)
    c.text(4, 3, text, CREAM)
    c.save(OBJ, name)


# --- the Ledgerwell identity props (ROOM_IDENTITY_PLAN.md S1, S2, S3, S9) ------------
# All drawn or recoloured at native size; nothing is rescaled.

WALNUT = (96, 64, 42)
WALNUT_HI = (122, 82, 54)
WALNUT_LO = (66, 42, 28)
WALNUT_EDGE = (40, 26, 18)
CREAM_FRAME = (232, 224, 200)
CREAM_SHADE = (196, 186, 160)
BAIZE = (38, 104, 70)
BAIZE_LO = (30, 88, 58)


def credenza():
    """A low walnut sideboard, 64x36, flat front on, two panelled doors, brass pulls,
    a flat clear top for the kit (the old partners' room, briefing direction A)."""
    w, h = 64, 36
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, 9, WALNUT_EDGE)            # top slab
    c.rect(1, 1, w - 2, 8, WALNUT_HI)
    c.hline(1, w - 2, 8, WALNUT)
    c.rect(0, 10, w - 1, h - 3, WALNUT_EDGE)       # carcass
    c.rect(1, 10, w - 2, h - 4, WALNUT)
    for x0 in (4, 34):                              # two doors, each a raised panel
        c.rect(x0, 13, x0 + 25, h - 7, WALNUT_LO)
        c.rect(x0 + 1, 14, x0 + 24, h - 8, WALNUT)
        c.frame(x0 + 4, 17, x0 + 21, h - 11, WALNUT_HI)
        c.frame(x0 + 5, 18, x0 + 20, h - 12, WALNUT_LO)
    c.rect(31, 18, 32, 24, BRASS)                   # brass pulls at the meeting stile
    c.rect(28, 20, 29, 22, BRASS)
    c.rect(34, 20, 35, 22, BRASS)
    c.rect(2, h - 2, 6, h - 1, WALNUT_EDGE)         # feet
    c.rect(w - 7, h - 2, w - 3, h - 1, WALNUT_EDGE)
    c.save(OBJ, "lw_credenza1")


def sash_window():
    """A sash window, 40x40: cream frame, two sashes of 2x3 panes, a dull grey-blue day
    behind, a stone sill (a window for the back wall, S9)."""
    w, h = 40, 40
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 56, 44))
    c.rect(1, 1, w - 2, h - 5, CREAM_FRAME)
    c.rect(4, 4, w - 5, h - 8, (60, 56, 44))
    for r in range(2):                       # upper and lower sash
        y0 = 5 + r * 15
        for col in range(2):
            x0 = 5 + col * 15
            c.rect(x0, y0, x0 + 13, y0 + 13, (150, 178, 196))
            c.rect(x0, y0, x0 + 13, y0 + 3, (176, 200, 214))
            c.px(x0 + 2, y0 + 2, (232, 240, 244))
    c.rect(4, 19, w - 5, 20, CREAM_SHADE)    # meeting rail
    c.hline(1, w - 2, 1, (250, 246, 232))
    c.rect(0, h - 4, w - 1, h - 3, CREAM_SHADE)   # sill
    c.rect(0, h - 2, w - 1, h - 1, (150, 144, 128))
    c.save(OBJ, "lw_sash_window1")


def baize_board():
    """A green baize notice board, 42x31 (same footprint as notice_board1): oak frame,
    baize field, a typed sheet pinned with brass drawing pins."""
    w, h = 42, 31
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, WALNUT_EDGE)
    c.rect(1, 1, w - 2, h - 2, (150, 104, 62))
    c.rect(3, 3, w - 4, h - 4, BAIZE)
    for y in range(3, h - 3):
        for x in range(3, w - 3):
            if (x * 7 + y * 13) % 11 == 0:
                c.px(x, y, BAIZE_LO)
    c.rect(8, 5, 25, 24, (240, 236, 222))    # the signed RoE sheet
    c.frame(8, 5, 25, 24, (200, 196, 182))
    for j in range(5):
        c.hline(10, 23 if j % 2 == 0 else 20, 8 + j * 3, (120, 118, 112))
    c.hline(10, 16, 22, (40, 70, 140))        # a signature
    c.rect(29, 6, 37, 14, (232, 226, 190))    # a small memo
    c.hline(30, 36, 9, (150, 146, 130))
    c.hline(30, 34, 11, (150, 146, 130))
    for x, y in ((16, 6), (32, 7)):
        c.rect(x, y, x + 1, y + 1, BRASS)
    c.save(OBJ, "lw_baize_board1")


def oval_table():
    """A walnut oval table, 80x40, seen from above and square to the room (an ellipse,
    a lighter inlaid band, a dark edge)."""
    w, h = 80, 40
    c = Canvas(w, h)
    cx, rx, ry = (w - 1) / 2, w / 2, (h - 5) / 2
    for lift, kind in ((4, "edge"), (3, "side"), (2, "side"), (1, "side"), (0, "top")):
        cy = ry + 0.5 + lift
        for y in range(h):
            for x in range(w):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d > 1.0:
                    continue
                if kind == "top":
                    col = WALNUT_EDGE if d > 0.93 else (WALNUT_HI if d > 0.84 else WALNUT)
                    if d < 0.7 and (x + y * 2) % 23 == 0:
                        col = WALNUT_HI
                else:
                    col = WALNUT_EDGE if kind == "edge" else WALNUT_LO
                c.px(x, y, col)
    c.save(OBJ, "lw_oval_table1")


def more_plates():
    plate("POST ROOM", "lw_sign_post1")
    plate("ACCOUNTS", "lw_sign_accounts1")
    plate("RECORDS OFFICE", "lw_sign_records_office1")
    plate("STAFF ONLY", "lw_sign_staff_only1")
    plate("FIRE DOOR KEEP SHUT", "lw_sign_fire_door1")
    plate("PRESS TO EXIT", "lw_sign_press_exit1")
    plate("KIT ROOM", "lw_sign_kitroom1")


def directory_board():
    """Staff directory, 40x48: a green felt board in an oak frame, a brass header, rows of
    slotted white letters (names) and room numbers."""
    w, h = 40, 48
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, WALNUT_EDGE)
    c.rect(1, 1, w - 2, h - 2, (150, 104, 62))
    c.rect(3, 3, w - 4, h - 4, PLATE)
    c.rect(4, 4, w - 5, 11, BRASS_DARK)
    c.rect(4, 4, w - 5, 10, BRASS)
    c.text_centred(4, w - 5, 5, "STAFF", PLATE)
    for j in range(6):
        y = 15 + j * 5
        n = (6, 9, 7, 8, 5, 9)[j]
        c.hline(6, 6 + n * 2, y, CREAM)
        c.hline(6, 6 + n * 2, y + 1, (200, 198, 184))
        c.hline(w - 10, w - 7, y, GREY)
        c.hline(w - 10, w - 7, y + 1, (110, 118, 110))
    c.save(OBJ, "lw_directory1")


def evac_plan():
    """The evacuation plan as a drawn plan, 32x24: a framed sheet with the floor outline,
    room cells, a green arrow along the route to the stairs and a red 'you are here' dot."""
    w, h = 32, 24
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 64, 60))
    c.rect(1, 1, w - 2, h - 2, (240, 238, 226))
    c.frame(3, 3, w - 4, h - 4, (50, 50, 48))      # outer wall
    for x in (11, 19, 25):
        for y in range(3, 11):
            c.px(x, y, (50, 50, 48))
    c.hline(3, w - 4, 10, (50, 50, 48))            # corridor wall
    c.hline(3, w - 4, 14, (50, 50, 48))
    for x in (9, 17, 24):
        for y in range(14, h - 3):
            c.px(x, y, (50, 50, 48))
    c.rect(4, 11, w - 5, 13, (214, 226, 214))      # the corridor
    for x in range(5, 27):                          # green evacuation route and head
        c.px(x, 12, (30, 140, 70))
    for d in range(3):
        c.px(26 - d, 11 + d, (30, 140, 70))
        c.px(26 - d, 13 - d, (30, 140, 70))
    c.rect(7, 11, 8, 12, (200, 40, 40))             # you are here
    c.rect(26, 4, 28, 6, (30, 140, 70))             # assembly point / exit
    c.save(OBJ, "lw_evac_plan1")


def ledger_shelves():
    """binder_shelves1 recoloured, 48x60 (same size, no rescale): the coloured spines
    become bottle-green cloth ledgers with a gold year label on each."""
    from PIL import Image
    import colorsys
    src = Image.open(OBJ / "binder_shelves1.png").convert("RGBA")
    out = src.copy()
    sp, op = src.load(), out.load()
    spine = {}
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if a == 0:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if ss > 0.32 and vv > 0.25:
                nr, ng, nb = colorsys.hsv_to_rgb(0.40 + (hash((x, y // 9)) % 5) * 0.004, 0.62, min(0.62, vv * 0.8))
                op[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
                spine.setdefault((x, y // 1), True)
    # gold year labels: one 2px dash on each green spine, near the top of the book
    for y in range(src.height - 1):
        for x in range(src.width):
            if op[x, y] != sp[x, y] and op[x, y + 1] != sp[x, y + 1] and x % 3 == 1 \
               and op[x, y - 1] == sp[x, y - 1]:
                op[x, y + 1] = (200, 164, 70, 255)
    out.save(OBJ / "lw_ledger_shelves1.png")
    print("wrote lw_ledger_shelves1 48x60")


def pigeonhole_run():
    """Three pigeonholes1 side by side (84x27, tiled at native size) with a few letters
    in the holes: the staff post wall (S3)."""
    from PIL import Image
    src = Image.open(OBJ / "pigeonholes1.png").convert("RGBA")
    out = Image.new("RGBA", (src.width * 3, src.height), (0, 0, 0, 0))
    for i in range(3):
        out.paste(src, (i * src.width, 0))
    px = out.load()
    for (x, y) in ((6, 8), (21, 8), (36, 15), (50, 8), (63, 15), (77, 8), (12, 19), (70, 19)):
        for dx in range(5):
            px[x + dx, y] = (244, 240, 226, 255)
            px[x + dx, y + 1] = (206, 200, 184, 255)
    out.save(OBJ / "lw_pigeonholes3.png")
    print("wrote lw_pigeonholes3 84x27")


def exit_button():
    """A PRESS TO EXIT plate with a green push button, 14x22 (the retrofitted door, S5)."""
    w, h = 14, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.frame(1, 1, w - 2, h - 2, BRASS)
    c.rect(2, 2, w - 3, h - 3, PLATE)
    c.rect(4, 4, 9, 9, (24, 110, 60))
    c.frame(4, 4, 9, 9, (90, 200, 120))
    c.text(3, 12, "EX", CREAM)
    c.hline(3, w - 4, 18, BRASS_DARK)
    c.save(OBJ, "lw_exit_button1")


def main():
    credenza()
    sash_window()
    baize_board()
    oval_table()
    more_plates()
    directory_board()
    evac_plan()
    ledger_shelves()
    pigeonhole_run()
    exit_button()
    logo_sign()
    plate("BRIEFING", "lw_sign_briefing1")
    plate("RECORDS", "lw_sign_records1")
    plate("ADMIN", "lw_sign_admin1")


if __name__ == "__main__":
    main()
