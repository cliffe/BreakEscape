#!/usr/bin/env python3
"""
Recolours for m03's Zero Day Syndicate rooms (no resizing; same pixels, new palette).

  zds_conference_table1  hospital_conference_table in dark walnut (boardroom)

Usage: python3 scripts/room_gen/make_zds_props.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
TABLES = ROOT / "public/break_escape/assets/tables"
OBJECTS = ROOT / "public/break_escape/assets/objects"

# walnut, by the source's brightness: highlight, top, edge, legs, outline
BANDS = [(225, (132, 86, 54)), (200, (100, 62, 38)), (130, (74, 45, 28)), (60, (52, 32, 20)), (20, (32, 19, 12))]


def walnut(c):
    r, g, b, a = c
    if a < 255:
        return c  # keep the soft floor shadow and transparency
    lum = (299 * r + 587 * g + 114 * b) / 1000
    for floor, col in BANDS:
        if lum >= floor:
            return (*col, 255)
    return (14, 8, 6, 255)  # outline


def main():
    src = Image.open(TABLES / "hospital_conference_table.png").convert("RGBA")
    out = src.copy()
    sp, op = src.load(), out.load()
    for y in range(src.height):
        for x in range(src.width):
            op[x, y] = walnut(sp[x, y])
    path = OBJECTS / "zds_conference_table1.png"
    out.save(path)
    print(f"wrote {path.relative_to(ROOT)} {out.size}")


if __name__ == "__main__":
    main()
