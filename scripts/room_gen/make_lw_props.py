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


def main():
    logo_sign()
    plate("BRIEFING", "lw_sign_briefing1")
    plate("RECORDS", "lw_sign_records1")
    plate("ADMIN", "lw_sign_admin1")


if __name__ == "__main__":
    main()
