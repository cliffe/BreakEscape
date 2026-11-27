#!/usr/bin/env python3
"""
Check that every room map's north wall is 2 tiles high: the floor line on rows
62-63 and the floor starting at y=64, level with the bottom of a north door
(see room_geometry.py).

For each map it rebuilds the top three tile rows from the map's tile layers (in
draw order, so the room sheet and any wall layer on top both count) and finds
where the floor starts in a few columns across the back wall. Object layers
(furniture, props) are ignored.

Usage:
  check_room_walls.py                      # every map in assets/rooms
  check_room_walls.py 'room_hospital_*'    # a glob of map stems
  check_room_walls.py --scenario scenarios/m02_ransomed_trust/scenario.json.erb

Exit status 1 if any checked map is off the standard.
"""
import fnmatch
import json
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_geometry import FLOOR_TOP, TILE, floor_top  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
ROOMS = ROOT / "public/break_escape/assets/rooms"
_sheets = {}


def sheet(path):
    if path not in _sheets:
        _sheets[path] = Image.open(path).convert("RGBA")
    return _sheets[path]


def tile_image(m, gid):
    """(image, box) for a gid from an image-based (not collection) tileset, or None."""
    gid &= 0x1FFFFFFF  # drop flip flags
    best = None
    for ts in m["tilesets"]:
        if ts["firstgid"] <= gid and (best is None or ts["firstgid"] > best["firstgid"]):
            best = ts
    if not best or "image" not in best:
        return None
    local = gid - best["firstgid"]
    cols = best.get("columns") or (best["imagewidth"] // best["tilewidth"])
    tw, th = best["tilewidth"], best["tileheight"]
    x, y = (local % cols) * tw, (local // cols) * th
    return sheet((ROOMS / best["image"]).resolve()), (x, y, x + tw, y + th)


def column_pixels(m, col, px):
    """Pixels of map column `col` at x offset px within the tile, for the top three rows."""
    out = [(0, 0, 0, 0)] * (3 * TILE)
    for layer in m["layers"]:
        if layer.get("type") != "tilelayer" or not layer.get("visible", True):
            continue
        if "door" in layer["name"].lower():
            continue  # doors are sprites in game; the map's door tiles aren't drawn
        w = layer["width"]
        for row in range(min(3, layer["height"])):
            gid = layer["data"][row * w + col]
            if not gid:
                continue
            ti = tile_image(m, gid)
            if not ti:
                continue
            im, (x0, y0, _, _) = ti
            for dy in range(TILE):
                p = im.getpixel((x0 + px, y0 + dy))
                if p[3] > 0:
                    out[row * TILE + dy] = p
    return out


def check_map(path):
    return measure(json.loads(path.read_text()))


def measure(m):
    """Floor tops measured in each interior column of a loaded map that has a measurable
    back wall (columns under a side wall or a drawn-in door read None and are left out)."""
    w = m["width"]
    tops = [floor_top(column_pixels(m, c, TILE // 2)) for c in range(1, w - 1)]
    return [t for t in tops if t is not None]


def main(argv):
    pats, scen = [], None
    if "--scenario" in argv:
        scen = Path(argv[argv.index("--scenario") + 1])
        pats = sorted(set(re.findall(r'"type":\s*"(room_[A-Za-z0-9_]+)"', scen.read_text())))
    else:
        pats = [a for a in argv if not a.startswith("--")] or ["*"]
    maps = sorted(p for p in ROOMS.glob("*.json") if any(fnmatch.fnmatch(p.stem.lower(), pat.lower()) for pat in pats))
    bad = 0
    for p in maps:
        try:
            tops = check_map(p)
        except Exception as e:  # not a room map, or a missing sheet
            print(f"  skip   {p.stem}: {e}")
            continue
        if not tops:
            print(f"  skip   {p.stem}: no measurable back wall (narrow room or no floor line)")
            continue
        ok = all(t == FLOOR_TOP for t in tops)
        bad += not ok
        shown = sorted(set(tops))
        print(f"  {'ok  ' if ok else 'OFF '}   {p.stem}: floor starts at {shown} (want {FLOOR_TOP})")
    print(f"{bad} map(s) off the standard")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
