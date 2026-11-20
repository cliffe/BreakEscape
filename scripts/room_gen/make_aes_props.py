#!/usr/bin/env python3
"""
Hand-drawn props for m04's Albion Energy Storage rooms (room_aes_* in
generate_rooms.py): signs, plates, the process-diagram poster, the duty-round
wall terminal and the loading-dock roller shutter. Drawn pixel by pixel at
native size with the Canvas and 3x5 font from make_uni_props.py (extended here
with the missing letters and digits), in the house style of the existing wall
signs. Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_aes_props.py [--only name1,name2]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
from make_uni_props import Canvas, OUTLINE, RIM, WHITE, PAPER, INK, GREY_TEXT, BLUE, RED, RED_DARK, \
    YELLOW, YELLOW_DARK, STEEL, STEEL_LIGHT, STEEL_DARK, BLACK, LIME  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

U.FONT.update({
    "J": ["..#", "..#", "..#", "#.#", "###"], "Z": ["###", "..#", ".#.", "#..", "###"],
    "0": ["###", "#.#", "#.#", "#.#", "###"], "5": ["###", "#..", "##.", "..#", "##."],
    "6": ["###", "#..", "###", "#.#", "###"], "7": ["###", "..#", ".#.", ".#.", ".#."],
    "8": ["###", "#.#", "###", "#.#", "###"], "9": ["###", "#.#", "###", "..#", "###"],
    "-": ["...", "...", "###", "...", "..."], "/": ["..#", "..#", ".#.", "#..", "#.."],
    ".": ["...", "...", "...", "...", ".#."], ":": ["...", ".#.", "...", ".#.", "..."],
})

GREEN = (46, 132, 90)
GREEN_DARK = (30, 92, 62)
SAFE_GREEN = (0, 132, 80)
AMBER = (240, 168, 40)
SCREEN = (20, 40, 32)
SCREEN_TEXT = (90, 210, 120)


def plate(text, face, ink, name, pad=2):
    w = len(text) * 4 - 1 + 2 * (pad + 2)
    c = Canvas(w, 11)
    c.sign_panel(face)
    c.text(pad + 2, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, face, ink, name):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.sign_panel(face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink)
    c.save(OBJ, name)


def ppe_sign():
    """Blue mandatory sign: a white hard hat in a blue disc, PPE under it."""
    c = Canvas(20, 27)
    c.sign_panel(WHITE)
    cx, cy, r = 10, 10, 7
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx + 0.5) ** 2 + (y - cy + 0.5) ** 2 <= r * r:
                c.px(x, y, BLUE)
    for x, y0 in ((7, 8), (8, 7), (9, 7), (10, 7), (11, 7), (12, 8)):
        c.rect(x, y0, x, 11, WHITE)
    c.hline(5, 14, 12, WHITE)
    c.text_centred(0, 19, 19, "PPE", BLUE)
    c.save(OBJ, "aes_ppe_sign1")


def hv_danger_sign():
    """Yellow warning triangle with a black bolt, DANGER HV underneath."""
    c = Canvas(26, 27)
    c.sign_panel(YELLOW)
    for j in range(13):
        half = j // 2 + 1
        for x in range(13 - half, 13 + half):
            edge = x in (13 - half, 13 + half - 1) or j == 12
            c.px(x, 3 + j, BLACK if edge else YELLOW)
    for (x, y) in ((14, 7), (13, 8), (12, 9), (13, 9), (14, 9), (13, 10), (12, 11), (12, 12)):
        c.px(x, y, BLACK)
    c.text_centred(0, 25, 18, "HV", BLACK)
    c.save(OBJ, "aes_hv_danger1")


def process_diagram():
    """BESS process poster: title bar, grid -> PCS -> racks -> inverter -> grid, coloured boxes."""
    c = Canvas(46, 30)
    c.rect(0, 0, 45, 29, OUTLINE)
    c.rect(1, 1, 44, 28, PAPER)
    c.rect(1, 1, 44, 7, GREEN)
    c.text_centred(1, 44, 2, "BESS", WHITE)
    boxes = [(3, (90, 120, 180)), (13, (220, 150, 50)), (23, (200, 70, 60)), (33, (90, 160, 100))]
    for x, col in boxes:
        c.rect(x, 12, x + 7, 18, col)
        c.frame(x, 12, x + 7, 18, INK)
    for x in (11, 21, 31):
        c.hline(x, x + 1, 15, INK)
    # hydrogen detection and ESD row
    c.rect(8, 22, 20, 26, (240, 210, 80))
    c.frame(8, 22, 20, 26, INK)
    c.rect(25, 22, 37, 26, RED)
    c.frame(25, 22, 37, 26, INK)
    c.px(26, 21, INK)
    c.px(27, 20, INK)
    for x in range(3, 43, 3):
        c.px(x, 9, GREY_TEXT)
    c.save(OBJ, "aes_process_diagram1")


def procedures_sign():
    """Green safe-condition notice: EMERGENCY ACTIONS and four numbered lines."""
    c = Canvas(28, 34)
    c.rect(0, 0, 27, 33, OUTLINE)
    c.rect(1, 1, 26, 32, WHITE)
    c.rect(1, 1, 26, 8, SAFE_GREEN)
    c.text_centred(1, 26, 2, "ACTION", WHITE)
    for i, y in enumerate((11, 16, 21, 26)):
        c.text(3, y, str(i + 1), SAFE_GREEN)
        c.hline(8, 24 - (i % 2) * 4, y + 2, GREY_TEXT)
    c.save(OBJ, "aes_procedures_sign1")


def round_terminal():
    """The duty-round wall terminal: grey box, small green screen, a card reader and a status lamp."""
    c = Canvas(18, 24)
    c.rect(0, 0, 17, 23, OUTLINE)
    c.rect(1, 1, 16, 22, STEEL_LIGHT)
    c.rect(1, 21, 16, 22, STEEL)
    c.rect(3, 3, 14, 10, BLACK)
    c.rect(4, 4, 13, 9, SCREEN)
    c.hline(5, 11, 5, SCREEN_TEXT)
    c.hline(5, 9, 7, SCREEN_TEXT)
    c.rect(4, 13, 13, 17, STEEL_DARK)
    c.hline(5, 12, 15, BLACK)
    c.px(14, 19, LIME)
    c.px(3, 19, AMBER)
    c.save(OBJ, "aes_round_terminal1")


def logo_sign():
    """Reception sign: green panel, white bolt mark, ALBION ENERGY STORAGE in two lines."""
    w = 69
    c = Canvas(w, 19)
    c.rect(0, 0, w - 1, 18, GREEN_DARK)
    c.rect(1, 1, w - 2, 17, GREEN)
    bolt = ["..##", ".##.", "####", ".##.", "##..", "#..."]
    for j, row in enumerate(bolt):
        for i, ch in enumerate(row):
            if ch == "#":
                c.rect(3 + i * 1, 4 + j * 2, 3 + i * 1, 5 + j * 2, WHITE)
    c.text(10, 4, "ALBION", WHITE)
    c.text(10, 10, "ENERGY STORAGE", (200, 230, 210))
    c.save(OBJ, "aes_logo_sign1")


def roller_shutter():
    """Loading-bay roller shutter, 96x52: steel frame and box, horizontal corrugated slats,
    a hazard-striped bottom rail. Stands on the floor line like a door."""
    w, h = 96, 52
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(0, 0, w - 1, 6, STEEL_DARK)       # the roll box
    c.hline(1, w - 2, 1, STEEL)
    c.rect(0, 0, 3, h - 1, STEEL_DARK)       # guide rails
    c.rect(w - 4, 0, w - 1, h - 1, STEEL_DARK)
    for y in range(7, h - 5):
        col = STEEL_LIGHT if (y - 7) % 4 in (0, 1) else (STEEL if (y - 7) % 4 == 2 else (120, 126, 134))
        c.hline(4, w - 5, y, col)
    for x in range(4, w - 4):
        for y in range(h - 5, h - 1):
            c.px(x, y, YELLOW if ((x + y) // 3) % 2 == 0 else BLACK)
    c.rect(w - 12, 22, w - 9, 27, YELLOW_DARK)  # pull handle box
    c.save(OBJ, "aes_roller_shutter1")


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    jobs = {
        "aes_bank_c_sign1": lambda: plate("RACK BANK C", (30, 92, 62), WHITE, "aes_bank_c_sign1"),
        "aes_bank_a_sign1": lambda: plate("RACK BANK A", (30, 92, 62), WHITE, "aes_bank_a_sign1"),
        "aes_bank_b_sign1": lambda: plate("RACK BANK B", (30, 92, 62), WHITE, "aes_bank_b_sign1"),
        "aes_esd_sign1": lambda: two_line_plate("EMERGENCY", "SHUTDOWN", RED, WHITE, "aes_esd_sign1"),
        "aes_inverter_sign1": lambda: plate("INVERTERS - HV", YELLOW, BLACK, "aes_inverter_sign1"),
        "aes_dock_sign1": lambda: plate("LOADING BAY 1", YELLOW, BLACK, "aes_dock_sign1"),
        "aes_ppe_sign1": ppe_sign,
        "aes_hv_danger1": hv_danger_sign,
        "aes_process_diagram1": process_diagram,
        "aes_procedures_sign1": procedures_sign,
        "aes_round_terminal1": round_terminal,
        "aes_logo_sign1": logo_sign,
        "aes_roller_shutter1": roller_shutter,
    }
    for name, fn in jobs.items():
        if only is None or name in only:
            fn()


if __name__ == "__main__":
    main()
