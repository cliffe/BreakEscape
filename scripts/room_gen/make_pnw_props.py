#!/usr/bin/env python3
"""
Hand-drawn props for m07's Pacific Northwest Regional Grid Control rooms (room_pnw_*
in generate_rooms.py): the PNW Grid wordmark and plates, the evacuation muster board,
the visitor ledger, the operations floor's video wall and substation map, the SCADA
countdown and mimic board, the generator hall's chained plant log and genset plates,
the cable vault's cable ladder and the splice, small labels. Drawn pixel by pixel at
native size with the Canvas and 3x5 font from make_uni_props.py (extended by
make_aes_props.py and make_hce_props.py). Nothing is rescaled.

pnw_console_pos1 is PixelLab's pnw_console1 with a POS 3 tag added (the Abandoned
Operator Workstation claims it with as-type:pnw_console_pos), so the frame is read,
not redrawn.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_pnw_props.py [--only name1,name2]
"""

import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas, WHITE, STEEL, STEEL_LIGHT, STEEL_DARK  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

EVERGREEN = (36, 112, 84)
EVERGREEN_LIGHT = (84, 172, 128)
EVERGREEN_DARK = (22, 70, 52)
AMBER = (232, 150, 40)
AMBER_DIM = (150, 92, 24)
INK = (40, 40, 48)
GREY = (140, 142, 150)
RED = (200, 44, 48)
RED_DARK = (130, 26, 30)
PAPER = (246, 245, 238)
SCREEN_BG = (12, 16, 26)
GREEN = (70, 200, 110)
YELLOW = (236, 196, 40)
BLUE_MARKER = (40, 80, 180)
CABLE = (28, 28, 32)
CABLE_HI = (62, 62, 70)


def line(c, x0, y0, x1, y1, col):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for k in range(n + 1):
        c.px(round(x0 + (x1 - x0) * k / n), round(y0 + (y1 - y0) * k / n), col)


def ring(c, cx, cy, r, col):
    for a in range(0, 360, 12):
        c.px(round(cx + r * math.cos(math.radians(a))), round(cy + r * math.sin(math.radians(a))), col)


def mark(c, x, y):
    """The PNW Grid mark, 11x13: an evergreen fir with an amber bolt across it."""
    for j, half in enumerate((0, 1, 1, 2, 2, 3, 3, 4, 4, 5)):
        c.hline(x + 5 - half, x + 5 + half, y + j, EVERGREEN)
    c.rect(x + 5, y + 10, x + 5, y + 12, (100, 70, 40))
    for (a, b) in (((x + 8, y + 1), (x + 5, y + 5)), ((x + 5, y + 5), (x + 7, y + 5)),
                   ((x + 7, y + 5), (x + 3, y + 10))):
        line(c, *a, *b, AMBER)


def plate(text, face, ink, name, rim=None):
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, (30, 30, 36))
    c.frame(1, 1, w - 2, 9, rim or face)
    c.rect(2, 2, w - 3, 8, face)
    c.text(4, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, face, ink, name, ink2=None):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.rect(0, 0, w - 1, 16, (30, 30, 36))
    c.rect(1, 1, w - 2, 15, face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink2 or ink)
    c.save(OBJ, name)


# --- checkpoint ------------------------------------------------------------------

def logo_sign():
    """PACIFIC NORTHWEST / REGIONAL GRID CONTROL on a white panel, the mark at the left,
    an evergreen rule along the foot."""
    l1, l2 = "PACIFIC NORTHWEST", "REGIONAL GRID CONTROL"
    w = len(l2) * 4 - 1 + 20
    h = 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (52, 56, 58))
    c.rect(1, 1, w - 2, h - 2, WHITE)
    c.hline(1, w - 2, h - 2, EVERGREEN)
    mark(c, 3, 3)
    c.text(17, 4, l1, EVERGREEN_DARK)
    c.text(17, 10, l2, INK)
    c.save(OBJ, "pnw_logo_sign1")


def evac_board():
    """The muster whiteboard, mid-evacuation: a red EVACUATION header, five department
    rows with tallies, names crossed off in marker down the left column and then not."""
    w, h = 52, 34
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (242, 243, 244))
    c.rect(2, 2, w - 3, 8, RED)
    c.text_centred(2, w - 3, 3, "EVACUATION", WHITE)
    for i in range(5):
        y = 11 + i * 4
        c.hline(4, 20, y, INK)                       # department
        c.hline(24, 30, y, BLUE_MARKER)              # tally
        if i != 3:
            c.hline(33, 36, y, GREEN)                # CLEAR
        else:
            c.hline(33, 36, y, RED)                  # SECURITY 5/6
    c.text(38, 23, "?", RED)                         # contractors: unknown
    for y in range(11, 28, 2):                       # a list of names, crossed off, then stopping
        c.hline(40, 47, y, GREY)
        if y < 21:
            line(c, 39, y + 1, 48, y - 1, RED)
    c.hline(4, w - 5, h - 3, STEEL)
    c.rect(8, h - 3, 11, h - 3, RED)
    c.rect(14, h - 3, 17, h - 3, BLUE_MARKER)
    c.save(OBJ, "pnw_evac_board1")


def nerc_notice():
    """NERC CIP / ESCORT REQUIRED: a blue compliance plate."""
    two_line_plate("NERC CIP-006", "ESCORT REQUIRED", (40, 76, 150), WHITE, "pnw_nerc_notice1")


def muster_sign():
    """Green safe-condition sign: MUSTER / NORTH / LOT (cycle 2: "N LOT" read as a code)."""
    w, h = 30, 23
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (20, 90, 50))
    c.rect(1, 1, w - 2, h - 2, (30, 140, 80))
    c.text_centred(0, w - 1, 3, "MUSTER", WHITE)
    c.text_centred(0, w - 1, 9, "NORTH", WHITE)
    c.text_centred(0, w - 1, 15, "LOT", WHITE)
    c.save(OBJ, "pnw_muster_sign1")


def visitor_ledger():
    """The bound visitor log lying open on the counter: a black cover, two ruled pages,
    a pen in the gutter. Named notes_* so a scenario `notes` object claims it."""
    w, h = 20, 12
    c = Canvas(w, h)
    c.rect(0, 1, w - 1, h - 1, (30, 30, 34))
    c.rect(1, 1, 9, h - 2, PAPER)
    c.rect(10, 1, w - 2, h - 2, PAPER)
    c.rect(9, 1, 10, h - 2, (200, 198, 186))
    for y in range(3, h - 2, 2):
        c.hline(2, 8, y, GREY)
        c.hline(11, w - 3, y, GREY)
    line(c, 12, 9, 18, 3, (20, 40, 120))            # the pen
    c.px(18, 3, (200, 200, 200))
    c.save(OBJ, "notes_ledger1")


# --- operations floor ------------------------------------------------------------

def video_wall(running=False, name="pnw_video_wall1"):
    """The situation board: a 4x2 wall of screens in a black frame, every panel amber.
    Top row: the regional map (amber lines, nodes); load curve; breaker status grid; an
    alarm list. Bottom row: REMOTE SESSION in red, rebalancing DISABLED, the clock, the
    population figure as bars.

    running=True (blind run A fixes, L1): the face for countdown_expired. Same frame,
    same panels, but the top-left map panel (Seattle, step 01) has gone red: dark red
    ground, red lines, bright nodes. Swapped in by the object's spriteVariants."""
    w, h = 159, 42
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (20, 22, 28))
    pw, ph = 30, 18
    order = [0, 1, 2, 3, 8, 4, 5, 6, 7, 9]   # cycle 2: a fifth column (wall-sized), panels 8-9 extra
    for row in range(2):
        for col in range(5):
            x0, y0 = 2 + col * (pw + 1), 2 + row * (ph + 1)
            c.rect(x0, y0, x0 + pw - 1, y0 + ph - 1, SCREEN_BG)
            c.hline(x0, x0 + pw - 1, y0, (50, 40, 20))
            k = order[row * 5 + col]
            if k == 0:   # map
                pts = [(4, 14), (9, 9), (15, 11), (21, 5), (26, 8), (13, 4), (9, 9)]
                if running:   # step 01 executed: the Seattle panel goes red
                    c.rect(x0, y0, x0 + pw - 1, y0 + ph - 1, (70, 10, 14))
                    c.hline(x0, x0 + pw - 1, y0, (120, 24, 24))
                lc, nc = (RED, (255, 90, 80)) if running else (AMBER_DIM, AMBER)
                for a, b in zip(pts, pts[1:]):
                    line(c, x0 + a[0], y0 + a[1], x0 + b[0], y0 + b[1], lc)
                for p in pts:
                    c.px(x0 + p[0], y0 + p[1], nc)
            elif k == 1:  # load curve
                for i in range(pw - 4):
                    yy = 12 - int(5 * math.sin(i / 4.0)) - i // 6
                    c.px(x0 + 2 + i, y0 + yy, AMBER)
                c.hline(x0 + 2, x0 + pw - 3, y0 + 15, AMBER_DIM)
            elif k == 2:  # breaker status grid
                for j in range(3):
                    for i in range(6):
                        col_ = AMBER if (i + j) % 4 else RED
                        c.rect(x0 + 3 + i * 4, y0 + 3 + j * 5, x0 + 5 + i * 4, y0 + 5 + j * 5, col_)
            elif k == 3:  # alarm list
                for j in range(5):
                    c.hline(x0 + 2, x0 + 4, y0 + 3 + j * 3, RED if j < 2 else AMBER)
                    c.hline(x0 + 6, x0 + pw - 4 - (j * 3) % 7, y0 + 3 + j * 3, AMBER_DIM)
            elif k == 4:
                c.text(x0 + 3, y0 + 3, "REMOTE", RED)
                c.text(x0 + 3, y0 + 10, "SESSION", AMBER)
            elif k == 5:
                c.text(x0 + 3, y0 + 3, "REBAL", AMBER)
                c.text(x0 + 3, y0 + 10, "OFF", RED)
            elif k == 6:
                c.text(x0 + 5, y0 + 6, "02:17", AMBER)
            elif k == 8:  # a camera wall: four amber-tinted feeds
                for j in range(2):
                    for i in range(2):
                        c.rect(x0 + 2 + i * 14, y0 + 2 + j * 8, x0 + 13 + i * 14, y0 + 8 + j * 8, (60, 44, 18))
                        c.hline(x0 + 4 + i * 14, x0 + 10 + i * 14, y0 + 6 + j * 8, AMBER_DIM)
            elif k == 9:
                c.text(x0 + 3, y0 + 3, "8.41M", AMBER)
                c.text(x0 + 3, y0 + 10, "SERVED", AMBER_DIM)
            else:
                for i, hh in enumerate((6, 9, 12, 8, 11, 7)):
                    c.rect(x0 + 3 + i * 4, y0 + ph - 3 - hh, x0 + 5 + i * 4, y0 + ph - 3, AMBER)
    c.save(OBJ, name)


def substation_map():
    """The 147-substation wall map, framed: pale paper, a blue coastline down the left,
    the Columbia in blue across, black transmission lines, small squares for
    substations, and red marker rings round a scatter of them; a red scrawl below."""
    w, h = 72, 38
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 60, 66))
    c.rect(1, 1, w - 2, h - 2, (236, 232, 214))
    for y in range(2, h - 8):                                   # coastline
        c.px(5 + int(2 * math.sin(y / 3.0)), y, (70, 120, 190))
    for x in range(6, w - 3):                                   # the river
        c.px(x, 14 + int(1.5 * math.sin(x / 5.0)), (110, 160, 210))
    subs = []
    for gy in range(4):                                         # a jittered grid, so they spread
        for gx in range(7):
            hsh = (gx * 73856093) ^ (gy * 19349663)
            subs.append((11 + gx * 8 + hsh % 5, 5 + gy * 6 + (hsh >> 4) % 4))
    for i, a in enumerate(subs):                                # lines to the east and south neighbours
        if i % 7 != 6:
            line(c, a[0], a[1], subs[i + 1][0], subs[i + 1][1], (90, 90, 96))
        if i + 7 < len(subs) and i % 2 == 0:
            line(c, a[0], a[1], subs[i + 7][0], subs[i + 7][1], (90, 90, 96))
    for x, y in subs:
        c.rect(x - 1, y - 1, x, y, INK)
    for i, (x, y) in enumerate(subs):
        if i % 4 == 1:
            ring(c, x, y, 3, RED)
    c.hline(8, 40, h - 5, RED)                                  # the scrawl underneath
    c.hline(10, 56, h - 3, RED)
    c.save(OBJ, "pnw_substation_map1")


def console_pos():
    """pnw_console1 (PixelLab) with an amber position-3 tag on the desk front."""
    im = Image.open(OBJ / "pnw_console1.png").convert("RGBA")
    c = Canvas(im.width, im.height)
    c.img.paste(im, (0, 0))
    c.p = c.img.load()
    x0, y0 = im.width // 2 - 5, im.height - 16
    c.rect(x0, y0, x0 + 8, y0 + 8, (30, 30, 36))
    c.rect(x0 + 1, y0 + 1, x0 + 7, y0 + 7, AMBER)
    c.text(x0 + 3, y0 + 2, "3", INK)
    # coffee still warm, left by the keyboard (cycle 3: a separate mug sprite drew behind the console)
    mx, my = im.width - 15, 22
    c.rect(mx, my, mx + 4, my + 5, WHITE)
    c.rect(mx + 1, my, mx + 3, my, (110, 70, 40))
    c.px(mx + 5, my + 2, WHITE)
    c.px(mx + 5, my + 3, WHITE)
    c.px(mx + 2, my - 2, (200, 200, 200))
    c.px(mx + 3, my - 3, (200, 200, 200))
    c.save(OBJ, "pnw_console_pos1")


# --- server hall -------------------------------------------------------------------

def clip_note():
    """The cabling survey note clipped to a rack door: a small sheet, a steel bulldog
    clip, handwritten lines. Named notes_* so a scenario `notes` object claims it."""
    w, h = 11, 26                                     # paper in the top 14 px, clear below (cycle 2,
    c = Canvas(w, h)                                  # m8: feet in front of the rack, paper at door height)
    ph = 14
    c.rect(0, 2, w - 1, ph - 1, (180, 178, 168))
    c.rect(1, 3, w - 2, ph - 2, PAPER)
    c.rect(3, 0, 7, 3, STEEL_DARK)
    c.rect(4, 1, 6, 2, STEEL_LIGHT)
    for y in range(5, ph - 2, 2):
        c.hline(2, w - 3 - (y % 3), y, (40, 60, 140))
    c.save(OBJ, "notes_clip1")


def backup_tag():
    """A red asset tag for the rack front: SCADA BKP."""
    w, h = 23, 7
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, RED_DARK)
    c.rect(1, 1, w - 2, h - 2, RED)
    c.text(2, 1, "BKP", WHITE)
    c.rect(15, 2, 20, 4, WHITE)
    c.save(OBJ, "pnw_backup_tag1")


# --- SCADA control ------------------------------------------------------------------

def countdown():
    """The countdown display, four feet wide: black, a red SEQUENCE LOADED header, a
    big red 00:00:00 in blocks, a row of four step lamps (Seattle first), AWAITING HOST."""
    w, h = 76, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (26, 26, 30))
    c.rect(2, 2, w - 3, h - 3, (8, 6, 8))
    c.text_centred(2, w - 3, 4, "SEQUENCE LOADED", RED)
    digits = "--:--"
    c.text_centred(2, w - 3, 12, digits, (255, 70, 60))
    c.text_centred(2, w - 3, 13, digits, (180, 30, 30))
    for i in range(4):
        x = 14 + i * 13
        c.rect(x, 21, x + 7, 24, RED if i == 0 else (90, 20, 20))
    c.text_centred(2, w - 3, 26, "AWAITING HOST", (170, 60, 50))
    c.save(OBJ, "pnw_countdown1")


def countdown_face(header, middle, lamps, footer, name, bright=True):
    """A state face for the countdown display (lighting stage, review c1 M2: the
    sprite read AWAITING HOST in every state). Drawn on the same 76x32 frame;
    lamps is four colours, Seattle first. Swapped in by the object's spriteVariants."""
    w, h = 76, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (26, 26, 30))
    c.rect(2, 2, w - 3, h - 3, (8, 6, 8))
    hi, lo = ((255, 70, 60), (180, 30, 30)) if bright else ((120, 40, 36), (80, 22, 22))
    c.text_centred(2, w - 3, 4, header, RED if bright else (130, 40, 36))
    c.text_centred(2, w - 3, 12, middle, hi)
    c.text_centred(2, w - 3, 13, middle, lo)
    for i, col in enumerate(lamps):
        x = 14 + i * 13
        c.rect(x, 21, x + 7, 24, col)
    c.text_centred(2, w - 3, 26, footer, (170, 60, 50) if bright else (100, 40, 36))
    c.save(OBJ, name)


def countdown_states():
    dim = (90, 20, 20)
    countdown_face("SEQUENCE ARMED", "PENDING", [RED, RED, RED, RED], "CLOCK RUNNING",
                   "pnw_countdown_armed1")
    countdown_face("SEQUENCE RUNNING", "STEP 01", [(150, 150, 150), RED, RED, RED], "01 EXECUTED",
                   "pnw_countdown_running1")
    countdown_face("SEQUENCE ABORTED", "--:--", [dim, dim, dim, dim], "STOPPED",
                   "pnw_countdown_aborted1", bright=False)


def mimic_board():
    """A single-line mimic board: the 500 kV bus across the top, feeders dropping to
    breaker squares, green for closed, one red; PNW 147 in the corner."""
    w, h = 96, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (54, 58, 62))
    c.rect(1, 1, w - 2, h - 2, (214, 218, 210))
    c.text(3, 3, "PNW 147", EVERGREEN_DARK)
    c.hline(4, w - 5, 11, INK)
    c.hline(4, w - 5, 12, INK)
    for i in range(10):
        x = 9 + i * 9
        c.rect(x, 13, x, 18, INK)
        col = RED if i in (2, 7) else (40, 160, 70)
        c.rect(x - 2, 19, x + 2, 22, col)
        c.rect(x, 23, x, 26, INK)
    c.save(OBJ, "pnw_mimic1")


# --- generator hall -----------------------------------------------------------------

def plant_log():
    """The plant maintenance log on a clipboard, chained to the wall: a steel chain from
    a wall eye, a brown board, a sheet of initialled entries. Named notes_* so a scenario
    `notes` object claims it."""
    w, h = 16, 26
    c = Canvas(w, h)
    c.rect(7, 0, 8, 1, STEEL_DARK)                     # wall eye
    for y in range(2, 7):
        c.px(7 + (y % 2), y, STEEL)                    # chain
    c.rect(1, 7, w - 2, h - 1, (122, 86, 50))
    c.rect(5, 6, 10, 8, STEEL_LIGHT)                   # clip
    c.rect(2, 9, w - 3, h - 2, PAPER)
    for y in range(11, h - 3, 2):
        c.hline(3, w - 6, y, GREY)
        c.px(w - 4, y, BLUE_MARKER)                    # initials
    c.save(OBJ, "notes_plantlog1")


def gen_plates():
    for n, word in ((1, "GEN 1"), (2, "GEN 2"), (3, "GEN 3")):
        w = len(word) * 4 - 1 + 6
        c = Canvas(w, 9)
        c.rect(0, 0, w - 1, 8, (30, 30, 36))
        c.rect(1, 1, w - 2, 7, YELLOW)
        c.text(3, 2, word, INK)
        c.save(OBJ, f"pnw_genplate_{['one', 'two', 'three'][n - 1]}1")


def ear_sign():
    """Blue mandatory sign: ear defenders, EAR PROT."""
    w, h = 24, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (230, 230, 230))
    for y in range(2, 14):
        for x in range(6, 18):
            if math.hypot(x - 11.5, y - 7.5) <= 6:
                c.px(x, y, (30, 90, 170))
    c.rect(8, 6, 9, 10, WHITE)
    c.rect(14, 6, 15, 10, WHITE)
    c.hline(9, 14, 5, WHITE)
    c.text(2, 15, "EARS", (30, 90, 170))
    c.save(OBJ, "pnw_ear_sign1")


# --- cable vault ---------------------------------------------------------------------

def cable_ladder():
    """A wall-mounted cable ladder running the width of the vault, loaded with black
    trunk cables that sag between rungs; steel brackets every 32 px."""
    w, h = 200, 22
    c = Canvas(w, h)
    for x in range(0, w, 32):
        c.rect(x, 0, x + 2, h - 1, STEEL_DARK)          # brackets
    c.hline(0, w - 1, 4, STEEL)
    c.hline(0, w - 1, 17, STEEL)
    for x in range(0, w, 8):
        c.rect(x, 5, x, 16, STEEL_DARK)                 # rungs
    for k, yb in enumerate((7, 10, 13)):
        for x in range(w):
            sag = int(1.5 * math.sin(math.pi * (x % 32) / 32))
            c.px(x, yb + sag, CABLE)
            c.px(x, yb + sag + 1, CABLE)
            if x % 5 == k:
                c.px(x, yb + sag, CABLE_HI)
    c.save(OBJ, "pnw_cable_ladder1")


def splice():
    """The splice: a black resin joint on the trunk run, site tape (yellow-green), and
    a small grey box with a blinking green lamp wired into it, on nobody's register."""
    w, h = 30, 24
    c = Canvas(w, h)
    for yb in (8, 12):
        c.rect(0, yb, w - 1, yb + 1, CABLE)
    c.rect(6, 5, 21, 16, (20, 20, 22))                  # resin joint
    c.rect(7, 6, 20, 7, (52, 52, 58))
    for x in (5, 22):
        c.rect(x, 6, x + 1, 15, (200, 200, 40))         # site tape
        c.px(x, 9, (40, 150, 70))
        c.px(x + 1, 12, (40, 150, 70))
    c.rect(10, 17, 19, 23, (150, 154, 160))             # the device
    c.frame(10, 17, 19, 23, (80, 84, 90))
    c.px(12, 19, (90, 240, 120))
    c.rect(14, 19, 17, 21, (40, 44, 50))
    line(c, 15, 16, 15, 17, (200, 40, 40))
    c.save(OBJ, "pnw_splice1")


def master_desk():
    """The SCADA master control desk: desk1's shape (tables/desk1.png) recoloured to
    charcoal steel with a red edge strip, so the win condition isn't on the office
    table the ops supervisor uses. Same size, so slot fractions hold; no rescale."""
    src = Image.open(OBJ.parent / "tables/desk1.png").convert("RGBA")
    out = src.copy()
    p = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = p[x, y]
            if not a:
                continue
            lum = (299 * r + 587 * g + 114 * b) // 1000
            warm = r - b > 30
            if warm:   # the wooden top and legs -> charcoal, keeping the shading
                v = 34 + lum // 4
                p[x, y] = (v, v + 2, v + 8, a)
            else:
                p[x, y] = (max(0, r - 30), max(0, g - 30), max(0, b - 20), a)
    top = [y for y in range(src.height) if p[src.width // 2, y][3]]
    if top:
        ty = top[0] + 1
        for x in range(2, src.width - 2):
            if p[x, ty][3]:
                p[x, ty] = (*RED, 255)
    out.save(OBJ / "pnw_master_desk1.png")
    print("wrote pnw_master_desk1", out.size)


def badge_printer():
    """The contractor badge station: a grey card printer with a keypad and a small
    screen, a printed badge sitting in the output tray (white card, green stripe)."""
    w, h = 28, 20
    c = Canvas(w, h)
    c.rect(0, 3, w - 1, h - 1, (60, 64, 70))
    c.rect(1, 4, w - 2, h - 2, (150, 156, 164))
    c.rect(1, 4, w - 2, 5, (190, 196, 204))
    c.rect(3, 7, 11, 11, (20, 40, 34))              # screen
    c.hline(4, 9, 9, GREEN)
    for j in range(3):                              # keypad
        for i in range(3):
            c.px(15 + i * 2, 7 + j * 2, (40, 42, 48))
    c.rect(4, 13, w - 5, 15, (40, 42, 48))          # card slot / tray
    c.rect(8, 0, 19, 13, WHITE)                     # the uncollected badge, standing in the tray
    c.rect(8, 0, 19, 2, EVERGREEN)
    c.rect(10, 4, 13, 8, (120, 130, 140))
    c.hline(14, 18, 5, GREY)
    c.hline(14, 17, 7, GREY)
    c.save(OBJ, "pnw_badge_printer1")


def ats_cover():
    """ATS-1's cover plate, off, leaning against the wall, a screw on the floor."""
    w, h = 26, 9
    # cycle 3: lying flat it read as a plinth; now leaning against the wall, 14x30
    w, h = 16, 30
    c = Canvas(w, h)
    for y in range(h - 1):
        lean = (h - 1 - y) // 10            # the top leans back towards the wall
        c.rect(1 + lean, y, 12 + lean, y, (118, 124, 130))
        c.px(lean, y, (70, 74, 80))
        c.px(13 + lean, y, (70, 74, 80))
    c.hline(0, 13, h - 1, (70, 74, 80))
    for (x, y) in ((4, 4), (10, 4), (3, 24), (9, 24)):
        c.px(x, y, (60, 62, 66))
    c.rect(4, 11, 9, 13, (230, 200, 40))   # the warning label
    c.px(15, h - 2, (190, 190, 196))        # a screw on the floor
    c.save(OBJ, "pnw_ats_cover1")


def tucked_printout():
    """The Tomb Gamma printout wedged into the cable ladder: a folded sheet at an angle,
    black redaction bars. Named notes_* (claimed with as-type:notes_tucked)."""
    w, h = 12, 14
    c = Canvas(w, h)
    pts = [(2, 0), (11, 2), (9, 13), (0, 11)]
    for y in range(h):
        for x in range(w):
            # inside the quad (a slightly rotated sheet)
            inside = all(((bx - ax) * (y - ay) - (by - ay) * (x - ax)) >= 0
                         for (ax, ay), (bx, by) in zip(pts, pts[1:] + pts[:1]))
            if inside:
                c.px(x, y, PAPER)
    for y in (4, 6, 9):
        c.hline(3, 8, y, (20, 20, 22))
    c.hline(3, 6, 7, GREY)
    line(c, 2, 0, 0, 11, (170, 168, 158))
    c.save(OBJ, "notes_tucked1")


def backup_server():
    """The SCADA backup server: server_rack1's shape recoloured to a blue-steel cabinet
    (front-on, the same 30x55 as its neighbours; cycle 3: servers4 was three-quarter),
    with an amber activity strip, since the cascade is running on it."""
    src = Image.open(OBJ / "server_rack1.png").convert("RGBA")
    out = src.copy()
    p = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = p[x, y]
            if not a:
                continue
            lum = (299 * r + 587 * g + 114 * b) // 1000
            if max(r, g, b) - min(r, g, b) < 40:   # the greys -> blue steel
                p[x, y] = (lum * 5 // 10, lum * 7 // 10, min(255, lum + 40), a)
    for y in range(12, src.height - 10, 6):
        p[src.width - 6, y] = (*AMBER, 255)
        p[src.width - 7, y] = (*AMBER, 255)
    out.save(OBJ / "pnw_backup_server1.png")
    print("wrote pnw_backup_server1", out.size)


def chair_mirror():
    """aes_office_chair1 mirrored, an exact pixel copy (no resize), so the ops floor's two
    pushed-back chairs don't face the same way."""
    Image.open(OBJ / "aes_office_chair1.png").transpose(Image.FLIP_LEFT_RIGHT).save(OBJ / "pnw_office_chair_m1.png")
    print("wrote pnw_office_chair_m1")


def desk_return():
    """An 18 px desk return: the right end of pnw_master_desk1, cropped (not rescaled), so
    the master desk reaches Mercer's spot."""
    src = Image.open(OBJ / "pnw_master_desk1.png").convert("RGBA")
    src.crop((src.width - 18, 0, src.width, src.height)).save(OBJ / "pnw_desk_return1.png")
    print("wrote pnw_desk_return1")


def portable_printer():
    """A small battery printer with a sheet half out."""
    w, h = 16, 11
    c = Canvas(w, h)
    c.rect(0, 4, w - 1, h - 1, (52, 54, 60))
    c.rect(1, 5, w - 2, 6, (90, 94, 100))
    c.rect(3, 0, 12, 4, PAPER)
    c.hline(4, 10, 2, GREY)
    c.px(13, 8, GREEN)
    c.save(OBJ, "pnw_portable_printer1")


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    jobs = {
        "logo": logo_sign, "evac": evac_board, "nerc": nerc_notice, "muster": muster_sign,
        "ledger": visitor_ledger, "video": video_wall,
        "video_running": lambda: video_wall(running=True, name="pnw_video_wall_running1"), "map": substation_map, "pos": console_pos,
        "clip": clip_note, "tag": backup_tag, "countdown": countdown, "countdown_states": countdown_states, "mimic": mimic_board,
        "log": plant_log, "genplates": gen_plates, "ear": ear_sign, "ladder": cable_ladder,
        "splice": splice, "printer": portable_printer, "master": master_desk,
        "badge": badge_printer, "cover": ats_cover, "tucked": tucked_printout,
        "bkp": backup_server, "chairm": chair_mirror, "return": desk_return,
        "plates": lambda: (
            plate("OPERATIONS", EVERGREEN, WHITE, "pnw_ops_sign1"),
            two_line_plate("SERVER HALL", "RESTRICTED", (40, 44, 50), WHITE, "pnw_server_sign1", ink2=RED),
            two_line_plate("SCADA CONTROL", "AUTHORISED ONLY", RED, WHITE, "pnw_scada_sign1"),
            two_line_plate("BACKUP", "GENERATION HALL", EVERGREEN, WHITE, "pnw_genhall_sign1"),
            two_line_plate("CABLE VAULT", "CONFINED SPACE", YELLOW, INK, "pnw_vault_sign1"),
            plate("SECURITY", EVERGREEN, WHITE, "pnw_security_sign1"),
        ),
    }
    for k, fn in jobs.items():
        if only is None or k in only:
            fn()


if __name__ == "__main__":
    main()
