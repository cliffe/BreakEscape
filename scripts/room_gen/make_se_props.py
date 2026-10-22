#!/usr/bin/env python3
"""
Hand-drawn wall signs for the social-engineering lab (lab_social_engineering):
the Tarnside Assurance wordmark for the Engagement Office, and one name plate per
lab room (ENGAGEMENT, RECON, OPERATIONS, BLUE TEAM).

Drawn pixel by pixel at native size with the Canvas and 3x5 font from
make_uni_props.py (glyphs extended by make_aes_props.py and make_hce_props.py),
in the shape of m08's hq_*_sign1 plates. Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; they are registered with
register_object.py --wall.

Usage: python3 scripts/room_gen/make_se_props.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402,F401
import make_aes_props  # noqa: E402,F401  (digits and punctuation)
import make_hce_props  # noqa: E402,F401  (more glyphs)
from make_uni_props import Canvas  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

# Tarnside's colours: a deep slate-navy plate with a teal rule, white letters.
PLATE = (22, 34, 52)
TEAL = (46, 168, 160)
TEAL_DARK = (24, 92, 92)
WHITE = (236, 240, 244)
GREY = (150, 160, 172)
OUTLINE = (24, 26, 34)


def shield_tick(c, x0, y0):
    """An 9x11 shield in teal with a white tick: Tarnside's mark."""
    rows = [9, 9, 9, 9, 9, 9, 9, 7, 5, 3, 1]
    for j, w in enumerate(rows):
        off = (9 - w) // 2
        for i in range(w):
            edge = i == 0 or i == w - 1 or j == 0 or j == len(rows) - 1
            c.px(x0 + off + i, y0 + j, TEAL_DARK if edge else TEAL)
    # the tick: short arm down-right, long arm up-right, 1px wide on a 9px shield
    for x, y in ((2, 5), (3, 6), (4, 7), (5, 6), (5, 5), (6, 4), (6, 3)):
        c.px(x0 + x, y0 + y, WHITE)


def logo_sign():
    """TARNSIDE over ASSURANCE in two lines, the shield-and-tick mark at the left,
    on a navy plate with a teal rule along the foot (like hq_logo_sign1, 82x21)."""
    w, h = 64, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, OUTLINE)
    c.rect(1, 1, w - 2, h - 2, PLATE)
    c.hline(2, w - 3, h - 3, TEAL)
    shield_tick(c, 4, 3)
    c.text(17, 3, "TARNSIDE", WHITE)
    c.hline(17, 47, 9, TEAL_DARK)
    c.text(17, 11, "ASSURANCE", GREY)
    c.save(OBJ, "se_logo_sign1")


def plate(text, name):
    """A room name plate, the hq_ops_sign1 shape: outline, teal rim, navy face,
    white capitals, 11px tall."""
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, OUTLINE)
    c.frame(1, 1, w - 2, 9, TEAL)
    c.rect(2, 2, w - 3, 8, PLATE)
    c.text(4, 3, text, WHITE)
    c.save(OBJ, name)


def main():
    logo_sign()
    plate("ENGAGEMENT", "se_sign_engagement1")
    plate("RECON", "se_sign_recon1")
    plate("OPERATIONS", "se_sign_ops1")
    plate("BLUE TEAM", "se_sign_blueteam1")


if __name__ == "__main__":
    main()
