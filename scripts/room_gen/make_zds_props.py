#!/usr/bin/env python3
"""
Recolours for m03's Zero Day Syndicate rooms (no resizing; same pixels, new palette).

  zds_conference_table1  hospital_conference_table in dark walnut with a faint grain (boardroom)
  zds_desk1, zds_desk3   desk1 / desk3 with a brushed-steel top and graphite legs (server room);
                         the PC tower under the desk keeps its colours

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


def grain(x, y, c):
    """A faint long grain on the walnut top: a darker pixel run every few rows."""
    if c[:3] != BANDS[1][1]:
        return c
    h = ((y * 7919) ^ ((x // 9) * 104729)) % 11
    if y % 3 == 0 and h < 3:
        return (90, 55, 33, 255)
    return c


# steel, by the source's brightness: top highlight, top, edge, legs
STEEL = [(215, (176, 184, 194)), (170, (150, 158, 170)), (110, (96, 104, 118)), (40, (62, 68, 80))]


def steel(c):
    r, g, b, a = c
    if a < 255 or r < b + 25:
        return c  # transparency, shadow, and the cool-coloured PC tower stay as they are
    lum = (299 * r + 587 * g + 114 * b) / 1000
    for floor, col in STEEL:
        if lum >= floor:
            return (*col, 255)
    return (30, 32, 38, 255)


def recolour(src_path, name, fn, post=None):
    src = Image.open(src_path).convert("RGBA")
    out = src.copy()
    sp, op = src.load(), out.load()
    for y in range(src.height):
        for x in range(src.width):
            c = fn(sp[x, y])
            op[x, y] = post(x, y, c) if post else c
    path = OBJECTS / f"{name}.png"
    out.save(path)
    print(f"wrote {path.relative_to(ROOT)} {out.size}")


def main():
    recolour(TABLES / "hospital_conference_table.png", "zds_conference_table1", walnut, grain)
    recolour(TABLES / "desk1.png", "zds_desk1", steel)
    recolour(TABLES / "desk3.png", "zds_desk3", steel)


if __name__ == "__main__":
    main()
