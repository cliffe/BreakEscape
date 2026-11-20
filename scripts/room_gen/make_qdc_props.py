#!/usr/bin/env python3
"""
Hand-drawn props for m05's Quantum Dynamics Corporation rooms (room_qdc_* in
generate_rooms.py): the QDC wordmark and plates, the Heisenberg lab's notices and
the visitor-badge hook, whiteboards, wall screens, the collection tin, the
child's drawing in Torres' office, posters. Drawn pixel by pixel at native size
with the Canvas and 3x5 font from make_uni_props.py (extended by make_aes_props.py
and make_hce_props.py). Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_qdc_props.py [--only name1,name2]
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas, WHITE, STEEL, STEEL_LIGHT, STEEL_DARK  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

VIOLET = (112, 70, 196)
VIOLET_LIGHT = (160, 120, 236)
VIOLET_DARK = (60, 36, 116)
GOLD = (214, 176, 80)
INK = (40, 40, 52)
GREY = (140, 140, 152)
RED = (196, 44, 50)
PAPER = (246, 246, 240)
SCREEN_BG = (14, 18, 34)
GREEN = (70, 200, 110)
AMBER = (232, 160, 40)


def bloch(c, cx, cy, r, ring=VIOLET, axis=VIOLET_DARK, tip=GOLD):
    """The QDC mark: a ring, its equator, an axis and the state vector with a gold tip."""
    for y in range(cy - r - 1, cy + r + 2):
        for x in range(cx - r - 1, cx + r + 2):
            d = math.hypot(x - cx, y - cy)
            if r - 0.7 <= d < r + 0.5:
                c.px(x, y, ring)
    for x in range(cx - r + 1, cx + r):
        if (x - cx) % 2 == 0:
            c.px(x, cy, ring)
    for y in range(cy - r + 1, cy + r):
        c.px(cx, y, axis)
    k = max(1, r - 2)
    c.px(cx + k // 2, cy - k // 2, tip)
    c.px(cx + k // 2 + 1, cy - k // 2 - 1, tip)


def logo_sign():
    """QUANTUM DYNAMICS wordmark: violet on a white panel, the Bloch mark at the left."""
    w, h = 76, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 58, 72))
    c.rect(1, 1, w - 2, h - 2, WHITE)
    c.hline(1, w - 2, h - 2, VIOLET)
    bloch(c, 9, 9, 6)
    c.text(18, 4, "QUANTUM", VIOLET)
    c.text(18, 10, "DYNAMICS", INK)
    c.save(OBJ, "qdc_logo_sign1")


def logo_small():
    """A small QDC plate for corridors and doors."""
    w, h = 32, 13
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 58, 72))
    c.rect(1, 1, w - 2, h - 2, WHITE)
    bloch(c, 7, 6, 4)
    c.text(14, 4, "QDC", VIOLET)
    c.save(OBJ, "qdc_logo_small1")


def plate(text, face, ink, name, rim=None):
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, (30, 28, 40))
    c.frame(1, 1, w - 2, 9, rim or face)
    c.rect(2, 2, w - 3, 8, face)
    c.text(4, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, face, ink, name, ink2=None):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.rect(0, 0, w - 1, 16, (30, 28, 40))
    c.rect(1, 1, w - 2, 15, face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink2 or ink)
    c.save(OBJ, name)


def lab_rules():
    """The laminated LAB RULES notice: a glossy white sheet with a violet header band,
    LAB RULES in white, three numbered lines (1 has a glove), a signature, tape at the top."""
    w, h = 22, 28
    c = Canvas(w, h)
    c.rect(0, 1, w - 1, h - 1, (170, 176, 186))        # laminate edge
    c.rect(1, 2, w - 2, h - 2, PAPER)
    c.rect(1, 2, w - 2, 9, VIOLET)
    c.text(2, 3, "RULES", WHITE)
    # 1. a glove
    c.text(2, 11, "1", INK)
    c.rect(6, 12, 9, 15, (80, 140, 220))
    c.px(6, 11, (80, 140, 220))
    c.px(8, 11, (80, 140, 220))
    c.hline(11, w - 3, 12, GREY)
    c.hline(11, w - 5, 14, GREY)
    c.text(2, 17, "2", INK)
    c.hline(6, w - 3, 18, GREY)
    c.hline(6, w - 6, 20, GREY)
    c.text(2, 22, "3", INK)
    c.hline(6, w - 4, 23, GREY)
    c.hline(10, w - 3, 25, (60, 60, 140))              # R. Halloran's signature
    # tape and laminate shine
    c.rect(8, 0, 13, 2, (226, 222, 190))
    c.px(w - 3, 3, (255, 255, 255))
    c.save(OBJ, "qdc_lab_rules1")


def badge_hook():
    """The lab's visitor-badge hook by the door: a small white plate, VIS in violet, two
    brass hooks, one empty, the other with a red lanyard and nothing on it."""
    w, h = 14, 22
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (90, 92, 104))
    c.rect(1, 1, w - 2, h - 2, WHITE)
    c.text(1, 2, "VIS", VIOLET)
    for x in (4, 9):
        c.rect(x, 9, x + 1, 10, (150, 120, 50))
        c.px(x + 1, 11, (150, 120, 50))
    # second hook: an empty lanyard loop (the badge is the visitor spare, #4471, which isn't here)
    for y in range(12, 19):
        c.px(9 if y < 18 else 10, y, RED)
        c.px(11, y, RED)
    c.hline(9, 11, 19, RED)
    c.hline(2, w - 3, h - 3, GREY)
    c.save(OBJ, "qdc_badge_hook1")


def laser_warning():
    """An illuminated LASER ON warning box: red face, white text, a yellow triangle."""
    w, h = 34, 11
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (40, 36, 40))
    c.rect(1, 1, w - 2, h - 2, (220, 50, 50))
    for j in range(6):
        c.hline(4 - j // 2, 4 + j // 2, 2 + j, (250, 210, 40))
    c.px(4, 4, INK)
    c.px(4, 5, INK)
    c.text(9, 3, "LASER", WHITE)
    c.save(OBJ, "qdc_laser_warning1")


def whiteboard(name, kind):
    """A 46x30 whiteboard: 'lattice' (Halloran's: a lattice of dots, two basis vectors,
    a short vector in red, LWE), 'network' (Owen's: boxes and links, CORE SW, a red ring),
    'suspects' (Patricia's corkboard: eight badge photos, two strung to a note)."""
    w, h = 46, 30
    c = Canvas(w, h)
    blue, red, black = (40, 80, 180), (190, 50, 50), (40, 40, 46)
    if kind == "suspects":
        c.rect(0, 0, w - 1, h - 1, (110, 76, 44))
        c.rect(2, 2, w - 3, h - 3, (196, 156, 104))
        for i in range(8):
            x, y = 4 + (i % 4) * 10, 4 + (i // 4) * 12
            c.rect(x, y, x + 6, y + 8, PAPER)
            c.rect(x + 2, y + 1, x + 4, y + 3, (120, 96, 80) if i % 3 else (70, 54, 44))
            c.rect(x + 1, y + 4, x + 5, y + 7, (90, 100, 130) if i % 2 else (60, 64, 80))
            c.px(x + 3, y, red)
        c.rect(30, 20, 41, 26, (250, 240, 150))     # a sticky note
        c.hline(32, 39, 22, GREY)
        c.hline(32, 37, 24, GREY)
        for (sx, sy) in ((7, 13), (37, 13)):
            n = max(abs(35 - sx), abs(20 - sy))
            for k in range(n + 1):
                c.px(sx + (35 - sx) * k // n, sy + (20 - sy) * k // n, red)
        c.save(OBJ, name)
        return
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (240, 242, 244))
    c.hline(4, w - 5, h - 3, STEEL)
    c.rect(8, h - 3, 11, h - 3, blue)
    c.rect(14, h - 3, 17, h - 3, red)
    if kind == "lattice":
        for j in range(5):
            for i in range(7):
                x, y = 5 + i * 5 + j * 2, 5 + j * 4
                if x < w - 4:
                    c.px(x, y, black)
        for k in range(10):                      # basis vectors from a lattice point
            c.px(15 + k, 13, blue)
        for k in range(5):
            c.px(15 + k // 2 + k % 2, 13 - k, blue)
        for k in range(4):
            c.px(15 + k, 13 + k // 2, red)
        c.text(30, 20, "LWE", red)
        c.text(4, 23, "N=1024", blue)
    else:
        boxes = [(4, 5, 14, 10), (18, 5, 28, 10), (32, 5, 42, 10), (18, 18, 28, 23)]
        for x0, y0, x1, y1 in boxes:
            c.frame(x0, y0, x1, y1, black)
        for x in (9, 23, 37):
            for y in range(11, 18):
                c.px(x + (23 - x) * (y - 11) // 7, y, blue)
        c.text(19, 6, "SW", black)
        c.text(5, 6, "WEB", blue)
        c.text(33, 6, "LAB", blue)
        for a in range(0, 360, 20):                 # a red ring round the lab link
            c.px(37 + int(6 * math.cos(math.radians(a))), 8 + int(4 * math.sin(math.radians(a))), red)
        c.text(4, 20, "VLAN", red)
    c.save(OBJ, name)


def dispatch_screen():
    """A wall screen: the 999 dispatch network rollout, a rough map of Britain in green
    dots with region markers and a progress bar."""
    w, h = 48, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, SCREEN_BG)
    c.text(3, 3, "999", RED)
    c.text(17, 3, "ROLLOUT", (170, 180, 210))
    # a rough island shape: a column of dots that widens to the south
    shape = [(8, 2), (9, 2), (8, 3), (9, 4), (8, 5), (7, 6), (8, 7), (7, 8), (9, 9), (6, 10)]
    for k, (cx, half) in enumerate(shape):
        y = 10 + k * 1 + k // 2
        for x in range(cx - half + 4, cx + half + 5):
            c.px(x, y, (50, 150, 90))
    for (x, y, col) in ((13, 12, GREEN), (11, 16, GREEN), (14, 21, AMBER), (16, 24, AMBER), (9, 22, GREY)):
        c.px(x, y, col)
        c.px(x + 1, y, col)
    for y in range(10, 26, 3):
        c.hline(26, 26 + (y * 7) % 16, y, (90, 110, 150))
    c.rect(26, 26, 44, 27, (40, 50, 70))
    c.rect(26, 26, 37, 27, GREEN)
    c.save(OBJ, "qdc_dispatch_screen1")


def kid_drawing():
    """Miguel's crayon drawing pinned to Torres' wall: four stick figures and a dog under
    a yellow sun, on a sheet with a red pin."""
    w, h = 22, 17
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (200, 196, 186))
    c.rect(1, 1, w - 2, h - 2, (252, 250, 244))
    c.rect(17, 2, 19, 4, (250, 200, 40))            # sun
    c.hline(1, w - 2, h - 3, (60, 170, 70))          # grass
    for i, (x, col, tall) in enumerate(((3, (40, 70, 200), 8), (7, (200, 50, 140), 7), (11, (220, 120, 30), 5), (14, (40, 160, 200), 4))):
        top = h - 3 - tall
        c.px(x, top, col)
        for y in range(top + 1, h - 4):
            c.px(x, y, col)
        c.px(x - 1, top + 2, col)
        c.px(x + 1, top + 2, col)
        c.px(x - 1, h - 4, col)
        c.px(x + 1, h - 4, col)
    c.hline(17, 19, h - 5, (120, 80, 40))            # the dog
    c.px(19, h - 6, (120, 80, 40))
    c.px(17, h - 4, (120, 80, 40))
    c.px(19, h - 4, (120, 80, 40))
    c.px(10, 0, RED)
    c.px(10, 1, RED)
    c.save(OBJ, "qdc_kid_drawing1")


def collection_tin():
    """The collection tin on the break-room counter: a round tin with a slot and a
    hand-written label."""
    w, h = 10, 12
    c = Canvas(w, h)
    c.rect(1, 2, 8, 11, (150, 156, 168))
    c.rect(2, 2, 7, 10, (196, 200, 210))
    c.hline(1, 8, 1, (110, 114, 126))
    c.hline(3, 6, 1, (30, 30, 36))                   # the slot
    c.rect(2, 5, 7, 8, (250, 240, 150))              # label
    c.hline(3, 6, 6, (60, 60, 140))
    c.px(4, 7, (200, 60, 90))                         # a heart
    c.save(OBJ, "qdc_collection_tin1")


def poster(name, kind):
    """16x21 corporate posters: 'secure' (a padlock, THINK), 'ready' (999 READY, a violet
    tick), 'team' (the Heisenberg team photo, eight heads)."""
    w, h = 16, 21
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (60, 58, 72))
    if kind == "secure":
        # LOCK YOUR SCREEN: a monitor with a small padlock on it
        c.rect(1, 1, w - 2, h - 2, VIOLET_DARK)
        c.rect(3, 3, 12, 10, (200, 204, 216))
        c.rect(4, 4, 11, 9, SCREEN_BG)
        c.hline(6, 9, 11, (200, 204, 216))
        c.frame(7, 4, 8, 6, GOLD)
        c.rect(6, 6, 9, 8, GOLD)
        c.text(1, 14, "LOCK", WHITE)
    elif kind == "ready":
        c.rect(1, 1, w - 2, h - 2, WHITE)
        c.text(2, 3, "999", RED)
        for k in range(4):
            c.px(4 + k, 10 + k // 2 + (k % 2), VIOLET)
        for k in range(6):
            c.px(8 + k, 12 - k, VIOLET)
        c.hline(2, w - 3, 16, GREY)
        c.hline(2, w - 5, 18, GREY)
    else:
        c.rect(1, 1, w - 2, h - 2, (230, 226, 216))
        c.rect(2, 3, w - 3, 13, (120, 150, 190))
        for i in range(8):
            x, y = 3 + (i % 4) * 3, 5 + (i // 4) * 4
            c.px(x, y, (90, 60, 40) if i % 3 else (220, 190, 160))
            c.px(x, y + 1, (60, 60, 80))
        c.hline(3, w - 4, 16, INK)
        c.hline(3, w - 6, 18, GREY)
    c.save(OBJ, name)


def it_notice():
    """IT's printed notice, taped flat on the server-hallway wall: a white A4 sheet,
    IT SECURITY NOTICE in violet, lines of print, a key icon, tape at two corners."""
    w, h = 18, 24
    c = Canvas(w, h)
    c.rect(0, 1, w - 1, h - 1, (176, 180, 190))
    c.rect(1, 2, w - 2, h - 2, PAPER)
    c.text(2, 3, "IT", VIOLET)
    c.hline(11, w - 3, 4, VIOLET)
    c.hline(2, w - 3, 9, GREY)
    c.hline(2, w - 5, 11, GREY)
    c.hline(2, w - 3, 13, GREY)
    c.rect(3, 16, 5, 18, (200, 150, 40))          # a key
    c.hline(6, 11, 17, (200, 150, 40))
    c.px(10, 18, (200, 150, 40))
    c.hline(2, w - 6, 21, GREY)
    c.rect(1, 0, 4, 2, (226, 222, 190))
    c.rect(w - 5, 0, w - 2, 2, (226, 222, 190))
    c.save(OBJ, "qdc_it_notice1")


def key_rotation_board():
    """Torres' whiteboard: the key-rotation calendar for the dispatch rollout. A grid of
    dates, most crossed off in blue, two ringed in red, KEY ROT. at the top."""
    w, h = 46, 30
    c = Canvas(w, h)
    blue, red, black = (40, 80, 180), (190, 50, 50), (40, 40, 46)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (240, 242, 244))
    c.hline(4, w - 5, h - 3, STEEL)
    c.text(4, 4, "KEY ROT", black)
    for j in range(3):
        for i in range(7):
            x, y = 4 + i * 6, 11 + j * 5
            c.frame(x, y, x + 4, y + 3, (170, 170, 180))
            if j * 7 + i < 15:
                c.px(x + 1, y + 1, blue)
                c.px(x + 2, y + 2, blue)
                c.px(x + 3, y + 1, blue)
    for (x, y) in ((4 + 1 * 6, 21), (4 + 3 * 6, 21)):
        c.frame(x - 1, y - 1, x + 5, y + 4, red)
    c.save(OBJ, "qdc_whiteboard_keys1")


def filing_cabinet(name, locked):
    """A front-on steel four-drawer filing cabinet, 29x60: light grey body, a darker
    plinth, four drawer fronts with label holders and pull handles; the locked one adds
    a vertical lock bar down the right edge with a padlock at the top drawer."""
    w, h = 29, 60
    c = Canvas(w, h)
    body, dark, light = (150, 156, 166), (96, 100, 110), (186, 190, 198)
    c.rect(0, 0, w - 1, h - 1, (52, 54, 62))
    c.rect(1, 1, w - 2, h - 2, body)
    c.hline(1, w - 2, 1, light)
    for k in range(4):
        y0 = 3 + k * 13
        c.frame(3, y0, w - 4, y0 + 11, dark)
        c.hline(4, w - 5, y0 + 1, light)
        c.rect(11, y0 + 2, 17, y0 + 4, (226, 226, 220))         # label holder
        c.rect(10, y0 + 7, 18, y0 + 8, (70, 72, 80))           # pull
    c.rect(1, h - 4, w - 2, h - 2, dark)
    if locked:
        c.rect(w - 6, 3, w - 5, h - 6, (60, 62, 70))           # lock bar
        c.rect(w - 8, 6, w - 3, 11, (196, 160, 60))            # padlock
        c.frame(w - 7, 3, w - 4, 6, (110, 110, 118))
        c.px(w - 6, 9, (60, 50, 30))
    c.save(OBJ, name)


def hsm_rack():
    """A front-on HSM rack for the key vault, 32x58: a black cabinet holding four
    hardware security modules (grey faces, a keypad, a red/green status pair, a small
    display) above a patch panel."""
    w, h = 32, 58
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (20, 20, 26))
    c.rect(1, 1, w - 2, h - 2, (36, 36, 44))
    for k in range(4):
        y0 = 4 + k * 10
        c.rect(3, y0, w - 4, y0 + 7, (120, 124, 134))
        c.hline(3, w - 4, y0, (160, 164, 172))
        c.rect(5, y0 + 2, 12, y0 + 5, (20, 40, 40))           # display
        c.hline(6, 10, y0 + 3, (70, 220, 160))
        for j in range(2):
            for i in range(3):
                c.px(15 + i * 2, y0 + 2 + j * 2, (50, 52, 60))  # keypad
        c.px(23, y0 + 3, (70, 220, 90))
        c.px(25, y0 + 3, (230, 60, 50) if k == 2 else (70, 220, 90))
    c.rect(3, 45, w - 4, 50, (24, 24, 30))                      # patch panel
    for i in range(5, w - 5, 3):
        c.px(i, 47, (90, 170, 230))
    c.rect(1, h - 4, w - 2, h - 2, (14, 14, 18))
    c.save(OBJ, "qdc_hsm1")


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    jobs = {
        "qdc_logo_sign1": logo_sign,
        "qdc_logo_small1": logo_small,
        "qdc_lab_sign1": lambda: plate("HEISENBERG LAB", VIOLET, WHITE, "qdc_lab_sign1", rim=VIOLET_LIGHT),
        "qdc_server_sign1": lambda: plate("SERVER ROOM", (44, 50, 88), VIOLET_LIGHT, "qdc_server_sign1", rim=VIOLET_LIGHT),
        "qdc_vault_sign1": lambda: two_line_plate("KEY VAULT", "HEISENBERG LEADS ONLY", RED, WHITE,
                                                  "qdc_vault_sign1", ink2=(250, 220, 210)),
        "qdc_security_sign1": lambda: plate("SECURITY", (64, 62, 76), WHITE, "qdc_security_sign1", rim=VIOLET),
        "qdc_it_sign1": lambda: plate("IT SUPPORT", VIOLET, WHITE, "qdc_it_sign1"),
        "qdc_lab_rules1": lab_rules,
        "qdc_it_notice1": it_notice,
        "qdc_filing_steel1": lambda: filing_cabinet("qdc_filing_steel1", False),
        "filing_cabinet_locked2": lambda: filing_cabinet("filing_cabinet_locked2", True),
        "qdc_hsm1": hsm_rack,
        "qdc_whiteboard_keys1": key_rotation_board,
        "qdc_two_person_sign1": lambda: plate("TWO-PERSON RULE", RED, WHITE, "qdc_two_person_sign1"),
        "qdc_badge_hook1": badge_hook,
        "qdc_laser_warning1": laser_warning,
        "qdc_whiteboard_lattice1": lambda: whiteboard("qdc_whiteboard_lattice1", "lattice"),
        "qdc_whiteboard_net1": lambda: whiteboard("qdc_whiteboard_net1", "network"),
        "qdc_suspects_board1": lambda: whiteboard("qdc_suspects_board1", "suspects"),
        "qdc_dispatch_screen1": dispatch_screen,
        "qdc_kid_drawing1": kid_drawing,
        "qdc_collection_tin1": collection_tin,
        "qdc_poster_secure1": lambda: poster("qdc_poster_secure1", "secure"),
        "qdc_poster_ready1": lambda: poster("qdc_poster_ready1", "ready"),
        "qdc_poster_team1": lambda: poster("qdc_poster_team1", "team"),
    }
    for name, fn in jobs.items():
        if only is None or name in only:
            fn()


if __name__ == "__main__":
    main()
