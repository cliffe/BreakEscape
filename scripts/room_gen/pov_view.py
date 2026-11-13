#!/usr/bin/env python3
"""Make a per-position view of a room's approved POV concept, so the part of the room around an
NPC sits beside their chat portrait (portrait centred ~83% across the image, covering ~67-99%).

Two ways, both from the approved concept so the room's style and items stay the same:

  shift  Move the picture right (or left) by a share of its width and fill the gap with flat
         magenta, for Gemini to outpaint ("Replace the solid magenta strip ... the LEFT side wall
         continues towards the camera ..."). Keeps the room's scale. For rooms up to ~12 tiles.
  crop   Cut a square from the concept: the same picture through a narrower lens, so the room
         looks bigger. For wide rooms, which Gemini draws too small. Any part beyond the
         concept's edges is filled magenta to outpaint. Keep the crop 400 px or more wide (the
         shipped background is 400 px).

Usage:
  python3 scripts/room_gen/pov_view.py CONCEPT OUT --shift 0.3          (negative shifts left)
  python3 scripts/room_gen/pov_view.py CONCEPT OUT --crop 0.45 1.0      (shares of the width)
  python3 scripts/room_gen/pov_view.py --suggest SHARE DEPTH [--room-tiles N]
SHARE and DEPTH are the NPC's numbers from the pov_prep inventory (share of the way across, and
how far their feet are from the back wall, both 0-1). --suggest prints a shift (and a crop for a
wide room). It is a rough model of the perspective: check the result with pov_chat_preview.py.
"""
import argparse

from PIL import Image

MAGENTA = (255, 0, 255)
TARGET = 0.75          # where the NPC's spot should land across the image


def npc_x_in_concept(share, depth):
    """Rough x (0-1) of a floor spot in a one-point concept: the back wall spans ~55% of the
    width, and the room widens towards the camera."""
    k = 0.55 + 0.6 * depth
    return 0.5 + (share - 0.5) * k


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("concept", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--shift", type=float, help="share of the width to move the picture right (negative: left)")
    ap.add_argument("--crop", nargs=2, type=float, metavar=("X0", "X1"), help="square crop, shares of the width")
    ap.add_argument("--suggest", nargs=2, type=float, metavar=("SHARE", "DEPTH"))
    ap.add_argument("--room-tiles", type=int, default=10, help="room width in tiles (wide rooms get a crop)")
    a = ap.parse_args()

    if a.suggest:
        x = npc_x_in_concept(*a.suggest)
        print(f"NPC spot ~{x:.0%} across the concept")
        if a.room_tiles > 12:
            w = max(0.6, min(0.85, 10 / a.room_tiles * 1.5))   # 0.55 of a 20-tile room made Oleg look small (user, 2026-10-12)
            x0 = x - TARGET * w
            print(f"wide room: --crop {x0:.2f} {x0 + w:.2f}" + ("  (runs off the left edge: outpaint the magenta)" if x0 < 0 else "")
                  + ("  (runs off the right edge: outpaint the magenta)" if x0 + w > 1 else ""))
        sh = TARGET - x
        if abs(sh) < 0.08:
            print("shift: none needed (the room-wide view already suits this NPC)")
        else:
            print(f"--shift {sh:.2f}")
        return

    if not (a.concept and a.out) or (a.shift is None) == (a.crop is None):
        ap.error("CONCEPT OUT and one of --shift / --crop")
    im = Image.open(a.concept).convert("RGB")
    W, H = im.size
    if a.shift is not None:
        d = round(a.shift * W)
        out = Image.new("RGB", (W, H), MAGENTA)
        out.paste(im, (d, 0))
    else:
        x0, x1 = round(a.crop[0] * W), round(a.crop[1] * W)
        side = x1 - x0
        y0 = (H - side) // 2
        out = Image.new("RGB", (side, side), MAGENTA)
        out.paste(im, (-x0, -y0))
        if side < 400:
            print(f"!! crop is only {side} px wide: below the 400 px shipped size")
    out.save(a.out)
    print(f"wrote {a.out} ({out.width}x{out.height})")


if __name__ == "__main__":
    main()
