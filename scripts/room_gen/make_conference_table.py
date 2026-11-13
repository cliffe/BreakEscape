#!/usr/bin/env python3
"""
Build tables/hospital_conference_table.png from hospital_desk1.png, so the
boardroom table matches the desks' palette and outline exactly.

The desk's tabletop is stretched (middle columns repeated for length, middle
surface rows repeated for depth); its solid modesty panel is replaced by a thin
apron, four legs and a soft floor shadow, which reads as a meeting table
rather than an office desk.

Usage: python3 scripts/room_gen/make_conference_table.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/break_escape/assets/tables/hospital_desk1.png"
OUT = ROOT / "public/break_escape/assets/tables/hospital_conference_table.png"

WIDTH = 126
EXTRA_DEPTH = 12          # surface rows added to the tabletop
TOP_END = 21              # desk rows 0..20 = tabletop + front edge
APRON = (21, 24)          # dark rows under the edge
LEG_ROWS = 18             # visible leg length below the apron
SHADOW = (0, 0, 0, 60)


def stretch_x(img, width):
    """Repeat the plain middle columns (20..40) to reach width."""
    left, right = img.crop((0, 0, 20, img.height)), img.crop((41, 0, img.width, img.height))
    mid = img.crop((20, 0, 41, img.height))
    out = Image.new("RGBA", (width, img.height))
    out.paste(left, (0, 0))
    x = 20
    while x < width - right.width:
        out.paste(mid, (x, 0))
        x += mid.width
    out.paste(right, (width - right.width, 0))
    return out


def flatten_surface(img, top_h):
    """Repeated desk columns band the lightly textured top; repaint it flat."""
    from collections import Counter
    px = img.load()
    inner = [(x, y) for y in range(4, top_h - 4) for x in range(4, img.width - 4)]
    base = Counter(px[x, y] for x, y in inner).most_common(1)[0][0]
    light = tuple(min(255, c + 10) for c in base[:3]) + (255,)
    for x, y in inner:
        px[x, y] = light if y < 7 else base


def main():
    desk = stretch_x(Image.open(SRC).convert("RGBA"), WIDTH)
    top = desk.crop((0, 0, WIDTH, TOP_END))
    surface_row = desk.crop((0, 12, WIDTH, 13))
    apron = desk.crop((0, APRON[0], WIDTH, APRON[1]))
    leg = desk.crop((3, 24, 7, 43))          # outline + light + dark leg strip
    foot = desk.crop((3, 43, 7, 46))

    top_h = TOP_END + EXTRA_DEPTH
    height = top_h + apron.height + LEG_ROWS + 1
    out = Image.new("RGBA", (WIDTH, height), (0, 0, 0, 0))

    # floor shadow under the table, between the legs
    shadow = Image.new("RGBA", (WIDTH - 10, LEG_ROWS - 4), SHADOW)
    out.alpha_composite(shadow, (5, top_h + apron.height + 2))

    # tabletop: rows 0..12, then repeated surface rows, then the rest
    out.alpha_composite(top.crop((0, 0, WIDTH, 12)), (0, 0))
    for k in range(EXTRA_DEPTH + 1):
        out.alpha_composite(surface_row, (0, 12 + k))
    out.alpha_composite(top.crop((0, 13, WIDTH, TOP_END)), (0, 13 + EXTRA_DEPTH))
    out.alpha_composite(apron, (0, top_h))
    flatten_surface(out, top_h)

    y0 = top_h + apron.height
    for lx in (4, WIDTH - 8, 30, WIDTH - 34):
        seg = leg.crop((0, 0, 4, min(LEG_ROWS, leg.height)))
        out.alpha_composite(seg, (lx, y0))
        out.alpha_composite(foot.crop((0, 0, 4, 1)), (lx, y0 + seg.height))
    out.save(OUT)
    print(f"wrote {OUT} {out.size}")


if __name__ == "__main__":
    main()
