#!/usr/bin/env python3
"""Show what a Gemini edit changed: BEFORE and AFTER side by side, changed areas outlined in red.

Gemini can report success and return the input re-encoded, or change something you didn't ask
for (a door's glass, some lettering). A single difference number can't tell those apart from a
small real edit, so look at the outlines. Prints the share of the image that changed.

Usage:
  python3 scripts/room_gen/pov_diff.py BEFORE.png AFTER.png OUT.png
"""
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    a = Image.open(sys.argv[1]).convert("RGB").resize((512, 512), Image.LANCZOS)
    b = Image.open(sys.argv[2]).convert("RGB").resize((512, 512), Image.LANCZOS)
    d = ImageChops.difference(a, b).convert("L").filter(ImageFilter.GaussianBlur(2))
    mask = d.point(lambda v: 255 if v > 28 else 0).filter(ImageFilter.MaxFilter(9))
    share = sum(mask.histogram()[255:]) / (512 * 512) * 100
    edge = ImageChops.difference(mask, mask.filter(ImageFilter.MinFilter(5)))
    red = Image.new("RGB", (512, 512), (255, 0, 0))
    out = Image.new("RGB", (1034, 540), (30, 30, 30))
    out.paste(a, (0, 28))
    out.paste(Image.composite(red, b, edge), (522, 28))
    dr = ImageDraw.Draw(out)
    dr.text((6, 8), "before", fill=(230, 230, 230))
    dr.text((528, 8), f"after: changed areas outlined ({share:.1f}% of the image)", fill=(230, 230, 230))
    out.save(sys.argv[3])
    print(f"changed {share:.1f}% -> {sys.argv[3]}")


if __name__ == "__main__":
    main()
