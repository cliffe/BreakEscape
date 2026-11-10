#!/usr/bin/env python3
"""
Draw "locked screen" candidates for a PC object sprite.

Each candidate is the base sprite with only its screen interior repainted, so
the body (bezel, stand, keyboard, mouse) stays pixel-identical. This is the
same trick pc_ransomware.png uses on pc.png. The art is flat and hand placed:
palette colours sampled from pc.png, no anti-aliasing, fully opaque pixels.

Candidates:
  a  dark navy screen, one large centred padlock
  b  blue-violet screen, a clock line over a small padlock
  c  dim screen, a small padlock over a row of password dots

The screen interior of `pc` is x 3..24, y 1..13 (inclusive, 22x13 = 286 px),
which is exactly the area pc_ransomware.png repaints. Other bases need --rect.

Usage:
  python3 scripts/room_gen/make_locked_screen.py pc --out DIR
      writes DIR/candidate_{a,b,c}.png and DIR/contact_sheet.png
  python3 scripts/room_gen/make_locked_screen.py pc3 --rect 4,2,20,12 --out DIR
  python3 scripts/room_gen/make_locked_screen.py pc_desktop --install a
      writes assets/objects/pc_desktop_locked.png from candidate a (only once picked).
      The engine shows `<texture key>_locked` for a locked screen, so install under the
      sprite's texture key: `pc_desktop` (a copy of pc.png), not `pc` (which loads pc1.png).

Output is deterministic: the same base sprite gives the same bytes.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OBJECTS = ROOT / "public/break_escape/assets/objects"

# Screen interior per base, inclusive (x0, y0, x1, y1).
# pc_desktop.png is a copy of pc.png under the name of its texture key: the engine loads the
# key `pc` from pc1.png (different art), so the navy desktop PC and its locked look are the
# keys `pc_desktop` and `pc_desktop_locked` (systems/screen-states.js).
RECTS = {"pc": (3, 1, 24, 13), "pc_desktop": (3, 1, 24, 13)}

# Colours that already occur in pc.png.
BEZEL = (23, 25, 75, 255)
DIM = (28, 29, 84, 255)        # one step up from the bezel
NAVY = (42, 35, 100, 255)
VIOLET = (58, 43, 131, 255)    # the desktop's taskbar colour
MID = (75, 59, 137, 255)
PALE = (151, 155, 209, 255)    # mouse highlight
GREY = (206, 204, 211, 255)
WHITE = (230, 229, 231, 255)

# 3x5 digits for the clock line.
DIGITS = {
    "0": ["###", "#.#", "#.#", "#.#", "###"],
    "9": ["###", "#.#", "###", "..#", "###"],
    "4": ["#.#", "#.#", "###", "..#", "..#"],
    "1": [".#.", "##.", ".#.", ".#.", "###"],
    ":": [".", "#", ".", "#", "."],
}

PADLOCK_BIG = [        # 7x8: shackle 3 rows, body 5 rows, keyhole 'o'
    "..###..",
    ".#...#.",
    ".#...#.",
    "#######",
    "###o###",
    "###o###",
    "#######",
    "#######",
]
PADLOCK_SMALL = [      # 7x5: shackle 2 rows, body 3 rows
    ".#####.",
    ".#...#.",
    "#######",
    "###o###",
    "#######",
]
PADLOCK_MID = [        # 7x6: shackle 3 rows, body 3 rows
    ".#####.",
    ".#...#.",
    ".#...#.",
    "#######",
    "###o###",
    "#######",
]


def stamp(img, rows, x, y, colour, hole=None):
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch == "#":
                img.putpixel((x + dx, y + dy), colour)
            elif ch == "o" and hole:
                img.putpixel((x + dx, y + dy), hole)


def fill(img, rect, colour):
    x0, y0, x1, y1 = rect
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            img.putpixel((x, y), colour)


def centre_x(rect, width):
    return rect[0] + (rect[2] - rect[0] + 1 - width) // 2


def centre_y(rect, height):
    return rect[1] + (rect[3] - rect[1] + 1 - height) // 2


def candidate_a(img, rect):
    """Dark navy screen, one large padlock."""
    fill(img, rect, NAVY)
    stamp(img, PADLOCK_BIG, centre_x(rect, 7), centre_y(rect, 8), WHITE, NAVY)


def candidate_b(img, rect):
    """Blue-violet screen, clock line over a small padlock."""
    fill(img, rect, VIOLET)
    text = "09:41"
    width = sum(len(DIGITS[c][0]) for c in text) + len(text) - 1
    block = 5 + 1 + 5
    x, y = centre_x(rect, width), centre_y(rect, block)
    for c in text:
        stamp(img, DIGITS[c], x, y, PALE)
        x += len(DIGITS[c][0]) + 1
    stamp(img, PADLOCK_SMALL, centre_x(rect, 7), y + 6, WHITE, VIOLET)


def candidate_c(img, rect):
    """Dim screen, small padlock over four password dots."""
    fill(img, rect, DIM)
    block = 6 + 2 + 2
    y = centre_y(rect, block)
    stamp(img, PADLOCK_MID, centre_x(rect, 7), y, WHITE, DIM)
    dots, x = 4, centre_x(rect, 4 * 2 + 3 * 2)
    for i in range(dots):
        stamp(img, ["##", "##"], x + i * 4, y + 8, PALE)


CANDIDATES = {"a": candidate_a, "b": candidate_b, "c": candidate_c}
LABELS = {
    "a": "A padlock",
    "b": "B clock + padlock",
    "c": "C padlock + dots",
}


def build(base_img, rect, key):
    img = base_img.copy()
    CANDIDATES[key](img, rect)
    # The body must not change: check every pixel outside the rectangle.
    x0, y0, x1, y1 = rect
    for y in range(img.height):
        for x in range(img.width):
            inside = x0 <= x <= x1 and y0 <= y <= y1
            if not inside and img.getpixel((x, y)) != base_img.getpixel((x, y)):
                raise SystemExit(f"candidate {key} changed a body pixel at {x},{y}")
    return img


def contact_sheet(tiles, path, scale=8):
    """tiles: list of (label, image). Two panels (mid grey, dark), each with a
    1x row and a nearest-neighbour `scale`x row."""
    font = ImageFont.load_default()
    w, h = tiles[0][1].size
    pad, label_h = 16, 14
    cell = w * scale + pad
    panel_w = pad + cell * len(tiles)
    panel_h = pad + label_h + h + pad + h * scale + pad
    sheet = Image.new("RGBA", (panel_w, panel_h * 2), (0, 0, 0, 255))
    draw = ImageDraw.Draw(sheet)
    panels = [((128, 128, 128, 255), (0, 0, 0, 255)), ((24, 24, 30, 255), (235, 235, 235, 255))]
    for p, (bg, ink) in enumerate(panels):
        top = p * panel_h
        draw.rectangle([0, top, panel_w, top + panel_h], fill=bg)
        for i, (label, img) in enumerate(tiles):
            x = pad + i * cell
            draw.text((x, top + pad - 4), label, fill=ink, font=font)
            sheet.alpha_composite(img, (x, top + pad + label_h))
            big = img.resize((w * scale, h * scale), Image.NEAREST)
            sheet.alpha_composite(big, (x, top + pad + label_h + h + pad))
    sheet.convert("RGB").save(path, optimize=False)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("base", help="object sprite key, e.g. pc")
    ap.add_argument("--rect", help="screen interior x0,y0,x1,y1 (inclusive)")
    ap.add_argument("--out", help="directory for the candidates and contact sheet")
    ap.add_argument("--install", choices=sorted(CANDIDATES), help="write <base>_locked.png into assets/objects")
    args = ap.parse_args()

    if args.rect:
        rect = tuple(int(v) for v in args.rect.split(","))
    elif args.base in RECTS:
        rect = RECTS[args.base]
    else:
        sys.exit(f"no screen rectangle known for '{args.base}'; pass --rect x0,y0,x1,y1")
    if len(rect) != 4 or rect[2] - rect[0] + 1 < 17 or rect[3] - rect[1] + 1 < 12:
        sys.exit("the screen rectangle must be at least 17x12 for these layouts")
    if not args.out and not args.install:
        sys.exit("give --out DIR (candidates) or --install a|b|c")

    base_img = Image.open(OBJECTS / f"{args.base}.png").convert("RGBA")
    built = {k: build(base_img, rect, k) for k in sorted(CANDIDATES)}

    if args.out:
        out = Path(args.out)
        out.mkdir(parents=True, exist_ok=True)
        for k, img in built.items():
            img.save(out / f"candidate_{k}.png", optimize=False)
        tiles = [(f"{args.base}.png", base_img)]
        ransom = OBJECTS / f"{args.base}_ransomware.png"
        if ransom.exists():
            tiles.append((ransom.name, Image.open(ransom).convert("RGBA")))
        tiles += [(LABELS[k], built[k]) for k in sorted(built)]
        contact_sheet(tiles, out / "contact_sheet.png")
        print(f"wrote {len(built)} candidates and contact_sheet.png to {out}")
    if args.install:
        dest = OBJECTS / f"{args.base}_locked.png"
        built[args.install].save(dest, optimize=False)
        print(f"installed candidate {args.install} as {dest}")


if __name__ == "__main__":
    main()
