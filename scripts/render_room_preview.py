#!/usr/bin/env python3
"""
Render a Break Escape room (game-ready .json with embedded tilesets) to a PNG,
so generated rooms can be reviewed without launching the game.

Tile layers are drawn in file order, then every object layer's sprites are
depth-sorted the way core/rooms.js does (bottom edge, back-wall elevation,
table items grouped above their table).

Usage:
  python3 scripts/render_room_preview.py room_hospital_staff [more rooms...] [--scale 2] [--out DIR]
  python3 scripts/render_room_preview.py --sheet room_hospital_*   # one contact sheet
"""

from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ROOMS_DIR = ROOT / "public/break_escape/assets/rooms"
FLIP_H, FLIP_V, FLIP_D = 0x80000000, 0x40000000, 0x20000000
GID_MASK = 0x1FFFFFFF

_img_cache: dict[Path, Image.Image] = {}


def load_img(path: Path) -> Image.Image | None:
    if path not in _img_cache:
        try:
            _img_cache[path] = Image.open(path).convert("RGBA")
        except FileNotFoundError:
            _img_cache[path] = None
    return _img_cache[path]


def resolve_gid(tilesets: list, gid: int):
    """Return the tile image (cropped from a sheet or a per-tile image) for gid."""
    raw = gid & GID_MASK
    ts = max((t for t in tilesets if t["firstgid"] <= raw), key=lambda t: t["firstgid"])
    local = raw - ts["firstgid"]
    if "image" in ts:
        sheet = load_img((ROOMS_DIR / ts["image"]).resolve())
        if sheet is None:
            return None
        tw, th = ts["tilewidth"], ts["tileheight"]
        cols = ts.get("columns") or max(1, sheet.width // tw)
        x, y = (local % cols) * tw, (local // cols) * th
        img = sheet.crop((x, y, x + tw, y + th))
    else:
        tile = next((t for t in ts.get("tiles", []) if t["id"] == local), None)
        if tile is None:
            return None
        img = load_img((ROOMS_DIR / tile["image"]).resolve())
        if img is None:
            return None
    if gid & FLIP_H:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if gid & FLIP_V:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
    return img


def render(stem: str, grid: bool = False) -> Image.Image:
    room = json.loads((ROOMS_DIR / f"{stem}.json").read_text())
    tw, th = room["tilewidth"], room["tileheight"]
    canvas = Image.new("RGBA", (room["width"] * tw, room["height"] * th), (20, 20, 24, 255))
    tilesets = room["tilesets"]

    sprites = []  # (depth, layer name, obj)
    table_objs = []
    for layer in room["layers"]:
        if not layer.get("visible", True):
            continue
        if layer["type"] == "tilelayer":
            for i, gid in enumerate(layer["data"]):
                if not gid:
                    continue
                img = resolve_gid(tilesets, gid)
                if img is not None:
                    x, y = (i % layer["width"]) * tw, (i // layer["width"]) * th
                    canvas.alpha_composite(img, (x, y))
        elif layer["type"] == "objectgroup":
            for obj in layer["objects"]:
                if "gid" in obj:
                    sprites.append((None, layer["name"], obj))
                    if layer["name"] == "tables":
                        table_objs.append(obj)

    # Depth as core/rooms.js sets it: bottom-Y, plus elevation for items whose
    # foot is on the back wall (top 2 rows); table items sit just above the
    # nearest table so a desk never hides what is on it.
    back_wall = 2 * th
    placed = []
    for n, (_, lname, obj) in enumerate(sprites):
        bottom = obj["y"]
        if lname in ("table_items", "conditional_table_items") and table_objs:
            cx = obj["x"] + obj["width"] / 2
            table = min(table_objs, key=lambda t: (abs(t["x"] + t["width"] / 2 - cx) + abs(t["y"] - bottom)))
            depth = table["y"] + 0.5 + 0.01 * (n + 1)
        else:
            depth = bottom + 0.5 + (back_wall - bottom if bottom < back_wall else 0)
        placed.append((depth, lname, obj))

    missing = []
    for _, lname, obj in sorted(placed, key=lambda s: s[0]):
        img = resolve_gid(tilesets, obj["gid"])
        if img is None:
            missing.append(obj.get("name") or obj["gid"])
            continue
        w, h = int(round(obj["width"])), int(round(obj["height"]))
        if img.size != (w, h) and w > 0 and h > 0:
            img = img.resize((w, h), Image.NEAREST)
        # Tiled tile objects are anchored bottom-left
        canvas.alpha_composite(img, (int(round(obj["x"])), int(round(obj["y"] - h))))

    if grid:
        d = ImageDraw.Draw(canvas)
        for x in range(0, canvas.width, tw):
            d.line([(x, 0), (x, canvas.height)], fill=(255, 255, 255, 40))
        for y in range(0, canvas.height, th):
            d.line([(0, y), (canvas.width, y)], fill=(255, 255, 255, 40))
    if missing:
        print(f"  {stem}: missing sprite images for {missing}")
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rooms", nargs="+", help="room stems or globs, e.g. room_hospital_*")
    ap.add_argument("--scale", type=int, default=2)
    ap.add_argument("--grid", action="store_true")
    ap.add_argument("--sheet", action="store_true", help="also write a contact sheet of all rooms")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent / "room_gen/previews"))
    args = ap.parse_args()

    stems = []
    for r in args.rooms:
        if any(c in r for c in "*?["):
            stems += sorted(Path(p).stem for p in glob.glob(str(ROOMS_DIR / f"{r}.json")))
        else:
            stems.append(Path(r).stem)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    images = []
    for stem in stems:
        img = render(stem, grid=args.grid)
        img = img.resize((img.width * args.scale, img.height * args.scale), Image.NEAREST)
        path = out / f"{stem}.png"
        img.save(path)
        images.append((stem, img))
        print(f"wrote {path}")

    if args.sheet and images:
        pad, label = 16, 20
        cols = min(3, len(images))
        rows = -(-len(images) // cols)
        cw = max(i.width for _, i in images) + pad
        ch = max(i.height for _, i in images) + pad + label
        sheet = Image.new("RGBA", (cols * cw + pad, rows * ch + pad), (40, 40, 48, 255))
        d = ImageDraw.Draw(sheet)
        for n, (stem, img) in enumerate(images):
            x, y = pad + (n % cols) * cw, pad + (n // cols) * ch
            d.text((x, y), stem, fill=(230, 230, 230, 255))
            sheet.alpha_composite(img, (x, y + label))
        path = out / "contact_sheet.png"
        sheet.save(path)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
