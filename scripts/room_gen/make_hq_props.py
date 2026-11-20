#!/usr/bin/env python3
"""
Hand-drawn props for m08's SAFETYNET headquarters rooms (room_hq_* in
room_gen/hq_rooms.py): the SAFETYNET wordmark and room plates, the memorial wall,
the Level Red alert screen, the operations board, the four-site tactical board,
the interrogation suite's evidence wall, disposition screen, one-way mirror and
RECORDING lamp, the three suspects' lockers (0x23, 0x47, 0x88), badge readers,
security posters, the crypto lab's cipher whiteboard, the visitor badge printer,
the confidential-waste console and the post-it on the coffee machine.

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (extended by make_aes_props.py and make_hce_props.py). Nothing
is rescaled. Wall screens whose text changes in play (the evidence wall, the
disposition screen, the alert board) are drawn generic, never with a name.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_hq_props.py [--only name1,name2]
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402,F401
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas, WHITE, STEEL, STEEL_LIGHT, STEEL_DARK  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

SN_BLUE = (52, 132, 200)
SN_BLUE_LIGHT = (120, 186, 238)
SN_BLUE_DARK = (24, 56, 100)
NAVY = (18, 26, 46)
SILVER = (188, 196, 208)
GOLD = (212, 176, 84)
INK = (36, 38, 48)
GREY = (140, 142, 152)
RED = (204, 44, 48)
RED_DARK = (120, 24, 30)
PAPER = (244, 244, 238)
SCREEN_BG = (12, 18, 32)
GREEN = (70, 196, 110)
AMBER = (232, 160, 40)
OUTLINE = (24, 26, 34)


def line(c, x0, y0, x1, y1, col):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for k in range(n + 1):
        c.px(x0 + (x1 - x0) * k // n, y0 + (y1 - y0) * k // n, col)


def seal(c, cx, cy, r):
    """The SAFETYNET mark: a silver ring, a blue field crossed by a net, a shield."""
    for y in range(cy - r - 1, cy + r + 2):
        for x in range(cx - r - 1, cx + r + 2):
            d = math.hypot(x - cx, y - cy)
            if r - 0.8 <= d < r + 0.5:
                c.px(x, y, SILVER)
            elif d < r - 0.8:
                net = (x - cx + y - cy) % 3 == 0 or (x - cx - (y - cy)) % 3 == 0
                c.px(x, y, SN_BLUE if net else SN_BLUE_DARK)
    sw = max(2, r // 2)
    for j in range(-sw, sw + 2):
        half = sw if j < sw // 2 else max(0, sw - (j - sw // 2) * 2)
        c.px(cx - half, cy + j, SILVER)
        c.px(cx + half, cy + j, SILVER)
    c.hline(cx - sw, cx + sw, cy - sw, SILVER)


def logo_sign():
    """SAFETYNET wordmark for the lobby: silver letters on a navy panel, the seal at the
    left, a blue rule, THE CITADEL under it in small grey."""
    w, h = 82, 21
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, NAVY)
    c.hline(2, w - 3, h - 3, SN_BLUE)
    seal(c, 10, 10, 7)
    c.text(21, 4, "SAFETYNET", SILVER)
    c.hline(21, 55, 10, SN_BLUE_DARK)
    c.text(21, 12, "THE CITADEL", GREY)
    c.save(OBJ, "hq_logo_sign1")


def logo_small():
    w, h = 30, 13
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, NAVY)
    seal(c, 6, 6, 4)
    c.text(13, 4, "SN", SILVER)
    c.px(21, 8, SN_BLUE)
    c.save(OBJ, "hq_logo_small1")


def plate(text, face, ink, name, rim=None):
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, OUTLINE)
    c.frame(1, 1, w - 2, 9, rim or face)
    c.rect(2, 2, w - 3, 8, face)
    c.text(4, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, face, ink, name, ink2=None):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.rect(0, 0, w - 1, 16, OUTLINE)
    c.rect(1, 1, w - 2, 15, face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink2 or ink)
    c.save(OBJ, name)


def memorial():
    """The memorial wall: a black granite panel, SAFETYNET seal at the top, rows of small
    gold stars for agents lost, two new ones at the end of the last row, brighter."""
    w, h = 50, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (14, 14, 18))
    c.rect(1, 1, w - 2, h - 2, (32, 32, 40))
    for y in range(2, h - 2):                      # a polished streak
        x = 6 + (y * 2) // 3
        if x < w - 2:
            c.px(x, y, (48, 48, 58))
    seal(c, w // 2, 6, 3)
    star = [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)]
    for row in range(3):
        n = 9 if row < 2 else 6
        for i in range(n):
            x0, y0 = 4 + i * 5, 12 + row * 5
            for dx, dy in star:
                c.px(x0 + dx, y0 + dy, GOLD if row < 2 or i < 4 else (255, 232, 140))
    c.save(OBJ, "hq_memorial1")


def flowers():
    """A low vase of white lilies left under the memorial."""
    w, h = 16, 18
    c = Canvas(w, h)
    c.rect(5, 11, 10, 17, (60, 64, 80))
    c.rect(6, 12, 9, 16, (90, 96, 118))
    for x, y in ((3, 4), (7, 2), (11, 4), (5, 7), (10, 7), (8, 5)):
        line(c, x, y + 2, 7 + (x > 7), 11, (60, 120, 60))
        c.rect(x - 1, y, x + 1, y + 1, (246, 246, 240))
        c.px(x, y - 1, (246, 246, 240))
        c.px(x, y + 1, (230, 200, 90))
    c.save(OBJ, "hq_flowers1")


def alert_screen():
    """The lobby's Security Alert Board: a wall screen on a red background, LEVEL RED,
    a pulsing bar and lines of notice text (no names)."""
    w, h = 48, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, (150, 22, 28))
    c.rect(1, 1, w - 2, 9, (196, 34, 40))
    c.text(4, 3, "LEVEL", WHITE)
    c.text(26, 3, "RED", WHITE)
    for y in (13, 16, 19):
        c.hline(4, 4 + 30 + (y * 5) % 10, y, (240, 190, 190))
    c.rect(4, 23, w - 5, 25, (110, 14, 20))
    c.rect(4, 23, 30, 25, (250, 120, 120))
    c.save(OBJ, "hq_alert_screen1")


def ops_board():
    """The operations floor's status wall: two joined screens. Left, a dark world map
    with four red site markers; right, rows of operations each with a red bar, an amber
    INVESTIGATION banner along the foot."""
    w, h = 98, 34
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (26, 26, 32))
    c.rect(1, 1, w - 2, h - 2, SCREEN_BG)
    c.px(w // 2, 1, (40, 40, 48))
    for y in range(1, h - 1):
        c.px(w // 2, y, (40, 40, 48))
    c.text(3, 3, "GLOBAL OPS", SN_BLUE_LIGHT)
    # a rough world map in dots
    blobs = [(8, 12, 7, 4), (14, 20, 3, 4), (25, 11, 4, 3), (27, 18, 3, 4), (36, 12, 7, 4), (42, 22, 3, 2)]
    for bx, by, rx, ry in blobs:
        for y in range(by - ry, by + ry + 1):
            for x in range(bx - rx, bx + rx + 1):
                if ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 <= 1 and (x + y) % 2 == 0:
                    c.px(x, y, (40, 90, 130))
    for x, y in ((9, 13), (12, 15), (6, 11), (10, 18)):
        c.rect(x - 1, y - 1, x + 1, y + 1, RED)
    c.text(52, 3, "STATUS", SN_BLUE_LIGHT)
    for k in range(3):
        y = 10 + k * 5
        c.hline(52, 66, y, (130, 140, 160))
        c.rect(70, y - 1, 94, y + 1, (170, 30, 36))
    c.rect(3, h - 8, w - 4, h - 3, (170, 30, 36))
    c.text_centred(3, w - 4, h - 7, "INVESTIGATION", WHITE)
    c.save(OBJ, "hq_ops_board1")


def tactical_board():
    """The four-site night tactical board in intelligence analysis: a whiteboard with a
    hand-drawn map, four sites circled in red, three crossed, arrows from one team
    square, a 'T-0' scrawl. Still up."""
    w, h = 62, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (238, 240, 242))
    c.hline(4, w - 5, h - 3, STEEL)
    blue, red, black = (40, 80, 180), (196, 46, 50), (50, 50, 58)
    # coast line
    pts = [(4, 22), (10, 18), (14, 20), (20, 12), (26, 14), (30, 8), (36, 10), (44, 6), (50, 9), (57, 7)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        line(c, x0, y0, x1, y1, blue)
    sites = [(12, 24), (24, 20), (40, 16), (52, 22)]
    for i, (sx, sy) in enumerate(sites):
        for a in range(0, 360, 30):
            c.px(sx + int(3 * math.cos(math.radians(a))), sy + int(3 * math.sin(math.radians(a))), red)
        if i != 3:
            line(c, sx - 2, sy - 2, sx + 2, sy + 2, red)
            line(c, sx - 2, sy + 2, sx + 2, sy - 2, red)
        else:
            c.px(sx, sy, black)
    c.frame(28, 25, 33, 28, black)                   # the one team
    for sx, sy in sites[:3]:
        line(c, 30, 25, sx, sy + 3, black)
    c.text(4, 3, "T-0", red)
    c.text(44, 25, "4/1", black)
    c.save(OBJ, "hq_tactical_board1")


def evidence_wall():
    """The interrogation suite's evidence wall screen: CASE FILE header, three blank
    person-of-interest cards (silhouettes, no names), a timeline strip below."""
    w, h = 64, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (26, 26, 32))
    c.rect(1, 1, w - 2, h - 2, (16, 24, 40))
    c.text(3, 3, "CASE FILE", SN_BLUE_LIGHT)
    for i in range(3):
        x0 = 4 + i * 20
        c.rect(x0, 10, x0 + 15, 23, (34, 44, 66))
        c.frame(x0, 10, x0 + 15, 23, (70, 90, 124))
        c.rect(x0 + 6, 12, x0 + 9, 15, (90, 100, 120))     # head
        c.rect(x0 + 4, 16, x0 + 11, 21, (90, 100, 120))    # shoulders
        c.text(x0 + 4, 24, "?", (200, 200, 210))
    c.hline(4, w - 5, 29, (70, 90, 124))
    for x in (10, 22, 35, 48, 57):
        c.px(x, 28, AMBER)
        c.px(x, 30, AMBER)
    c.save(OBJ, "hq_evidence_wall1")


def evidence_wall_named(name, verdict, bar):
    """The evidence wall once 0x47 is named (scenario spriteVariants, in the
    textVariants' order): one subject card, ringed red and labelled 0X47, the case
    lines beside it, and a verdict bar (amber PENDING before the relay chain is in,
    red CONCLUSIVE after). Never shown before the naming."""
    w, h = 64, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (26, 26, 32))
    c.rect(1, 1, w - 2, h - 2, (16, 24, 40))
    c.text(3, 3, "CASE FILE", SN_BLUE_LIGHT)
    x0 = 4
    c.rect(x0, 10, x0 + 15, 23, (34, 44, 66))
    c.frame(x0, 10, x0 + 15, 23, RED)
    c.rect(x0 + 6, 12, x0 + 9, 15, (150, 160, 180))
    c.rect(x0 + 4, 16, x0 + 11, 21, (150, 160, 180))
    c.text(x0 + 0, 24, "0X47", (240, 200, 200))
    n_lines = 5 if verdict == "CONCLUSIVE" else 2
    for k in range(5):
        y = 11 + k * 3
        col = (170, 180, 200) if k < n_lines else (50, 60, 84)
        c.hline(24, 24 + 22 + (k * 7) % 12, y, col)
    c.rect(20, 25, w - 3, 30, bar)
    c.text_centred(20, w - 3, 26, verdict, WHITE)
    c.save(OBJ, name)


def disposition_screen():
    """The detention disposition screen: a small wall terminal, SAFETYNET blue UI,
    blank fields and a signature box."""
    w, h = 34, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, (226, 232, 240))
    c.rect(1, 1, w - 2, 7, SN_BLUE_DARK)
    seal(c, 5, 4, 2)
    c.text(10, 2, "DISP", WHITE)
    for y in (10, 14):
        c.hline(3, 11, y, GREY)
        c.rect(13, y - 1, w - 4, y + 1, WHITE)
        c.frame(13, y - 1, w - 4, y + 1, (170, 176, 186))
    c.frame(3, 18, w - 4, 23, (170, 176, 186))
    line(c, 6, 22, 12, 20, (120, 126, 140))
    c.save(OBJ, "hq_disposition1")


def disposition_entry(name, word, bar, signed):
    """The disposition screen with an entry (scenario spriteVariants, in the
    textVariants' order): the fields filled, a status bar (AWAITING blue, HANDOVER
    red for detention, RETAINED amber for the controlled asset), and the
    countersignature drawn in once the Director has signed."""
    w, h = 34, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, (226, 232, 240))
    c.rect(1, 1, w - 2, 7, SN_BLUE_DARK)
    seal(c, 5, 4, 2)
    c.text(10, 2, "DISP", WHITE)
    c.hline(3, 11, 10, GREY)
    c.rect(13, 9, w - 4, 11, WHITE)
    c.hline(14, 26, 10, INK)
    c.rect(1, 13, w - 2, 19, bar)
    c.text(2, 14, word, WHITE)
    c.frame(3, 20, w - 4, 24, (170, 176, 186))
    if signed:
        line(c, 6, 23, 10, 21, INK)
        line(c, 10, 21, 13, 23, INK)
        line(c, 13, 23, 19, 21, INK)
    c.save(OBJ, name)


def one_way_mirror():
    """The one-way mirror along the interrogation room's back wall: dark glass in a
    steel frame, a faint reflection streak."""
    w, h = 96, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (70, 74, 82))
    c.frame(1, 1, w - 2, h - 2, (150, 156, 166))
    c.rect(2, 2, w - 3, h - 3, (28, 34, 44))
    for k in range(3):
        for y in range(3, h - 3):
            x = 14 + k * 30 + (h - y) // 2
            if x < w - 3:
                c.px(x, y, (52, 62, 78))
                c.px(x + 1, y, (40, 48, 62))
    c.hline(2, w - 3, h - 3, (60, 64, 72))
    c.save(OBJ, "hq_one_way_mirror1")


def recording_lamp():
    """RECORDING lamp on the interview room's back wall, drawn switched off: a dark
    maroon box, the word in dull rose. It is a scenario object (recording_lamp, as-type
    hq_recording) whose spriteVariants swap in the lit face below while the confrontation
    is on, with a red `above` glow from the room's lighting block as spill; the rest of
    the time the art must read as an unlit lamp."""
    w, h = 48, 11
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 26, 28))
    # Pale letters on a dark box: unlit, they read as a printed sign; under the red
    # glow the box goes red and the letters pink-white, as a lit lamp does.
    c.rect(1, 1, w - 2, h - 2, (74, 22, 26))
    c.rect(3, 4, 5, 6, (176, 150, 150))
    c.text(8, 3, "RECORDING", (176, 168, 168))
    c.save(OBJ, "hq_recording1")
    # The lit face (the dressing stage's original art): recording_lamp's spriteVariants
    # value during the confrontation (DECISIONS_PENDING L1, done).
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 26, 28))
    c.rect(1, 1, w - 2, h - 2, (226, 52, 52))
    c.rect(3, 4, 5, 6, (255, 220, 220))
    c.text(8, 3, "RECORDING", WHITE)
    c.save(OBJ, "hq_recording_on1")


def badge_reader():
    """A wall badge reader by a door: dark body, card pad, the LED blinking red."""
    w, h = 8, 12
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (60, 64, 76))
    c.rect(2, 2, w - 3, 6, (36, 40, 50))
    c.frame(2, 2, w - 3, 6, (90, 96, 110))
    c.rect(3, 8, 4, 9, (255, 60, 60))
    c.px(5, 9, (150, 30, 30))
    c.save(OBJ, "hq_badge_reader1")


def poster(name, kind):
    """16x21 security posters: 'postit' (a yellow post-it struck through: NO), 'ears'
    (an ear and WALLS), 'red' (the posture: LEVEL RED, a shield)."""
    w, h = 16, 21
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (50, 52, 62))
    if kind == "postit":
        c.rect(1, 1, w - 2, h - 2, WHITE)
        c.rect(3, 3, 12, 11, (250, 226, 90))
        c.hline(4, 10, 6, GREY)
        c.hline(4, 9, 8, GREY)
        line(c, 2, 12, 13, 2, RED)
        line(c, 3, 12, 14, 2, RED)
        c.text(4, 14, "NO", RED)
    elif kind == "ears":
        c.rect(1, 1, w - 2, h - 2, NAVY)
        for a in range(-90, 200, 15):                 # an ear
            c.px(8 + int(4 * math.cos(math.radians(a))), 7 + int(5 * math.sin(math.radians(a))), (230, 190, 160))
        c.px(8, 7, (230, 190, 160))
        c.px(9, 8, (230, 190, 160))
        c.text(2, 14, "SHH", SILVER)
    else:
        c.rect(1, 1, w - 2, h - 2, (150, 24, 30))
        seal(c, 8, 7, 4)
        c.text(2, 14, "RED", WHITE)
    c.save(OBJ, name)


def cipher_board():
    """The crypto lab's whiteboard: a letter-frequency bar chart, a Caesar wheel, a
    ROT13 scrawl in red."""
    w, h = 46, 30
    c = Canvas(w, h)
    blue, red, black = (40, 80, 180), (190, 50, 50), (40, 40, 46)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (240, 242, 244))
    c.hline(4, w - 5, h - 3, STEEL)
    bars = [7, 2, 4, 5, 9, 2, 3, 5, 6, 1, 2, 4]
    for i, b in enumerate(bars):
        c.rect(4 + i * 2, 22 - b, 4 + i * 2, 21, blue)
    c.hline(3, 28, 22, black)
    for a in range(0, 360, 12):
        c.px(36 + int(6 * math.cos(math.radians(a))), 12 + int(6 * math.sin(math.radians(a))), black)
        c.px(36 + int(3 * math.cos(math.radians(a))), 12 + int(3 * math.sin(math.radians(a))), blue)
    line(c, 36, 12, 36, 6, red)
    c.text(4, 4, "ROT", red)
    c.text(17, 4, "13", red)
    c.save(OBJ, "hq_cipher_board1")


def locker(name, label, kind):
    """A steel staff locker, front on, 20x52: a vented door, a key cylinder, a printed
    label plate with the agent's hex number. 'stickers' (0x23: conference stickers all
    over the door), 'plain' (0x47: the neat label and nothing else), 'tag' (0x88: an
    airline luggage tag looped through the handle).

    52 px tall, not 62 (confirmation walk L3): the engine measures interaction range
    (32 px) from a map sprite's top-left, and a player standing at the foot of a wall
    locker has their centre about 26 px above its feet, so a taller locker can't be
    reached from the floor in front of it."""
    w, h = 20, 52
    c = Canvas(w, h)
    body, hi, dark = (96, 108, 126), (124, 136, 154), (60, 70, 86)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, 5, hi)                       # the top cap
    c.hline(1, w - 2, 6, dark)
    c.rect(1, 7, w - 2, h - 3, body)
    c.frame(2, 8, w - 3, h - 4, dark)                # the door
    c.hline(1, w - 2, h - 2, (40, 44, 54))           # plinth
    for y in (11, 13):                               # vents
        c.hline(5, w - 6, y, dark)
    for y in (h - 10, h - 8):
        c.hline(5, w - 6, y, dark)
    # label plate
    c.rect(2, 16, 18, 22, PAPER)
    c.frame(2, 16, 18, 22, (150, 150, 156))
    c.text(3, 17, label, INK)
    # key cylinder and handle
    c.rect(14, 26, 16, 31, (60, 64, 72))
    c.rect(15, 27, 15, 28, (200, 170, 70))
    c.px(15, 30, (30, 30, 36))
    if kind == "stickers":
        for (x, y, col, sw, sh) in ((4, 25, (220, 60, 60), 4, 3), (9, 27, (250, 210, 60), 3, 3),
                                    (4, 30, (70, 170, 90), 3, 4), (8, 33, (140, 80, 200), 5, 3),
                                    (5, 37, WHITE, 6, 3), (12, 38, (60, 140, 220), 3, 3)):
            c.rect(x, y, x + sw - 1, y + sh - 1, col)
        c.hline(6, 9, 38, INK)                       # DO NOT ROT13 ME, too small to read
    elif kind == "tag":
        c.px(13, 32, (230, 230, 220))
        c.px(13, 33, (230, 230, 220))
        c.rect(10, 34, 14, 41, (230, 120, 40))
        c.rect(11, 35, 13, 37, PAPER)
        c.px(12, 39, INK)
    c.save(OBJ, name)


def badge_printer():
    """The visitor badge printer on the reception counter: a grey card printer with a
    small screen and a blank white card half out of the slot."""
    w, h = 22, 16
    c = Canvas(w, h)
    c.rect(1, 4, w - 2, h - 1, (40, 42, 50))
    c.rect(2, 5, w - 3, h - 2, (120, 126, 138))
    c.rect(2, 5, w - 3, 7, (150, 156, 168))
    c.rect(4, 9, 9, 12, SCREEN_BG)
    c.rect(5, 10, 7, 11, (220, 70, 70))              # the PIN prompt, red
    c.rect(12, 0, 19, 6, WHITE)                      # a blank card in the slot
    c.frame(12, 0, 19, 6, (170, 176, 186))
    c.hline(11, 20, 6, (30, 30, 36))
    c.rect(14, 2, 15, 3, SN_BLUE)
    c.save(OBJ, "hq_badge_printer1")


def confidential_bin():
    """A grey confidential-waste console with a posting slot and a red label."""
    w, h = 22, 32
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (92, 96, 106))
    c.rect(1, 1, w - 2, 5, (116, 120, 130))
    c.rect(4, 3, w - 5, 4, (20, 20, 26))             # the slot
    c.rect(3, 9, w - 4, 15, (190, 40, 44))
    c.text(5, 10, "CW", WHITE)
    c.hline(1, w - 2, h - 2, (50, 52, 60))
    c.rect(w - 6, 18, w - 5, 21, (60, 62, 70))       # the lock
    c.save(OBJ, "hq_confidential_bin1")


def postit():
    """The facilities post-it on the coffee machine: a small yellow square with two
    lines of handwriting and a curled corner."""
    w, h = 9, 9
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (250, 226, 80))
    c.hline(1, 6, 2, (70, 70, 120))
    c.hline(1, 5, 4, (70, 70, 120))
    c.hline(1, 6, 6, (70, 70, 120))
    c.px(w - 1, h - 1, (0, 0, 0, 0))
    c.px(w - 2, h - 1, (200, 176, 50))
    c.px(w - 1, h - 2, (200, 176, 50))
    c.save(OBJ, "notes_postit1")


def legal_pad():
    """A yellow legal pad left on a table: ruled lines, writing, a pen alongside."""
    w, h = 14, 16
    c = Canvas(w, h)
    c.rect(0, 0, 11, h - 1, (240, 222, 120))
    c.rect(0, 0, 11, 2, (150, 40, 40))
    for y in range(4, h - 1, 2):
        c.hline(1, 10, y, (170, 176, 210))
        c.hline(1, 3 + (y * 7) % 7, y, (40, 40, 90))
    line(c, 12, 2, 13, 14, (30, 60, 150))
    c.save(OBJ, "notes_legalpad1")


def sign_set():
    plate("OPERATIONS", NAVY, SILVER, "hq_ops_sign1", rim=SN_BLUE)
    plate("INTELLIGENCE", NAVY, SILVER, "hq_intel_sign1", rim=SN_BLUE)
    plate("CRYPTOGRAPHY", NAVY, SILVER, "hq_crypto_sign1", rim=SN_BLUE)
    plate("SERVER ROOM", NAVY, SILVER, "hq_server_sign1", rim=SN_BLUE)
    plate("STAFF ROOM", NAVY, SILVER, "hq_break_sign1", rim=SN_BLUE)
    plate("DIRECTOR", (70, 52, 30), GOLD, "hq_director_sign1", rim=GOLD)
    two_line_plate("ARCHIVES", "AUTHORISED ONLY", NAVY, SILVER, "hq_archive_sign1", ink2=(230, 90, 90))
    plate("INTERVIEW 1", (226, 228, 232), INK, "hq_interview_sign1", rim=(150, 154, 160))


def desk_safe():
    """The Director's biometric safe, tucked against the desk's end: a squat steel
    box front on, a fingerprint reader glowing green, a keypad below it, a handle."""
    w, h = 24, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, (112, 118, 130))
    c.rect(1, 1, w - 2, 3, (140, 146, 158))
    c.frame(3, 5, w - 4, h - 4, (80, 86, 98))
    c.rect(6, 8, 11, 12, (20, 40, 30))             # the reader
    c.rect(7, 9, 10, 11, (70, 220, 120))
    for j in range(3):                              # the keypad fallback
        for i in range(3):
            c.px(6 + i * 2, 15 + j * 2, (220, 224, 232))
    c.rect(15, 12, 17, 20, (60, 64, 74))           # handle
    c.hline(1, w - 2, h - 2, (60, 64, 74))
    c.save(OBJ, "hq_desk_safe1")


def notebook():
    """Phantom's private notebook: a black hardback with an elastic band and a pencil."""
    w, h = 14, 12
    c = Canvas(w, h)
    c.rect(0, 1, 10, h - 1, (30, 30, 36))
    c.rect(1, 2, 9, h - 2, (46, 46, 54))
    c.rect(8, 1, 8, h - 1, (180, 60, 50))          # the band
    c.hline(1, 9, h - 1, (230, 226, 210))          # page edges
    line(c, 11, 2, 13, 10, (200, 170, 60))
    c.save(OBJ, "notes_notebook1")


def recorder():
    """A digital interview recorder on the table: a black twin-deck box, red light."""
    w, h = 16, 9
    c = Canvas(w, h)
    c.rect(0, 1, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 2, w - 2, h - 2, (56, 58, 66))
    c.rect(2, 3, 6, 6, (20, 20, 24))
    c.rect(8, 3, 12, 6, (20, 20, 24))
    c.px(14, 3, (240, 60, 60))
    c.save(OBJ, "hq_recorder1")


PROPS = {
    "logo": logo_sign, "logo_small": logo_small, "memorial": memorial, "flowers": flowers,
    "alert": alert_screen, "ops_board": ops_board, "tactical": tactical_board,
    "evidence": evidence_wall, "disposition": disposition_screen, "mirror": one_way_mirror,
    # Lighting stage: faces per story state, wired as spriteVariants (loaded on demand
    # by rooms.js, not registered in the shared catalog).
    "evidence_named": lambda: [
        evidence_wall_named("hq_evidence_wall_named1", "PENDING", (176, 112, 24)),
        evidence_wall_named("hq_evidence_wall_closed1", "CONCLUSIVE", RED)],
    "disposition_entry": lambda: [
        disposition_entry("hq_disposition_awaiting1", "AWAITING", SN_BLUE, False),
        disposition_entry("hq_disposition_handover1", "HANDOVER", RED, True),
        disposition_entry("hq_disposition_retained1", "RETAINED", (196, 128, 24), True)],
    "recording": recording_lamp, "badge_reader": badge_reader,
    "posters": lambda: [poster("hq_poster_postit1", "postit"), poster("hq_poster_ears1", "ears"),
                        poster("hq_poster_red1", "red")],
    "cipher": cipher_board,
    "lockers": lambda: [locker("hq_locker_a1", "0X23", "stickers"), locker("hq_locker_b1", "0X47", "plain"),
                        locker("hq_locker_c1", "0X88", "tag")],
    "badge_printer": badge_printer, "bin": confidential_bin, "postit": postit, "pad": legal_pad,
    "signs": sign_set,
    "desk_safe": desk_safe, "notebook": notebook, "recorder": recorder,
}


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    for k, fn in PROPS.items():
        if only is None or k in only:
            fn()


if __name__ == "__main__":
    main()
