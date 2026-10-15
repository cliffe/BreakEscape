#!/usr/bin/env python3
"""
Register new object sprites so rooms, the validator and the game can use them.

A new object PNG in public/break_escape/assets/objects/ needs five edits before
it can be placed in a room and loaded in game. This does them all:

  1. scripts/room_gen/catalog.json               size + id + gid (generate_rooms.py, room_edit.py)
  2. scripts/room_gen/tilesets_ref.json          tile in the extras tileset (generated rooms embed it)
  3. public/.../rooms/objects_hospital_extras.tsx the same tile, for Tiled and external-tileset maps
  4. public/.../js/core/game.js                  this.load.image(...) after the last extras load
  5. scripts/generate_rooms.py WALL_MOUNTED_EXTRAS  only with --wall (validator: back-wall item)

New tiles go in the "objects/hospital_extras" tileset (firstgid 801), which despite
the name is the general home for PixelLab/hand-drawn props added since 2026; the
next free id is used. Sizes are read from the PNG, so trim it first (never rescale).

Usage:
  register_object.py NAME [NAME ...]           # PNGs already in assets/objects/
  register_object.py --wall directory_sign1    # also mark as wall-mounted
  register_object.py --dry-run NAME            # show what would change

Afterwards: rooms with a builder pick the tile up when regenerated; hand-maintained
rooms get it on their first room_edit.py add/sprite of that name.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OBJ = ROOT / "public/break_escape/assets/objects"
CATALOG = ROOT / "scripts/room_gen/catalog.json"
REF = ROOT / "scripts/room_gen/tilesets_ref.json"
TSX = ROOT / "public/break_escape/assets/rooms/objects_hospital_extras.tsx"
GAME_JS = ROOT / "public/break_escape/js/core/game.js"
GEN = ROOT / "scripts/generate_rooms.py"
FIRSTGID = 801


def main(argv):
    wall = "--wall" in argv
    dry = "--dry-run" in argv
    names = [a for a in argv if not a.startswith("--")]
    if not names:
        sys.exit(__doc__)

    cat = json.loads(CATALOG.read_text())
    ref_raw = REF.read_text()
    ref = json.loads(ref_raw)
    extras = next(t for t in ref if t.get("firstgid") == FIRSTGID)
    tsx = TSX.read_text()
    game = GAME_JS.read_text()
    gen = GEN.read_text()

    known = {Path(t["image"]).stem: t["id"] for t in extras["tiles"]}
    next_id = max(known.values()) + 1
    # insert game.js loads after the load line of the highest-id extras tile
    last_name = max(known, key=known.get)
    anchor = re.search(r"^.*this\.load\.image\('%s'.*\n" % re.escape(last_name), game, re.M)
    if not anchor:
        sys.exit(f"game.js has no load line for {last_name}; add the new loads by hand")

    loads = ""
    for name in names:
        png = OBJ / f"{name}.png"
        if not png.exists():
            sys.exit(f"missing {png}")
        w, h = Image.open(png).size
        if name in known:
            print(f"{name}: already registered as tile {known[name]} (skipped)")
            continue
        tid = next_id
        next_id += 1
        print(f"{name}: tile {tid}, gid {FIRSTGID + tid}, {w}x{h}{' (wall)' if wall else ''}")
        cat["objects"][name] = {"id": tid, "w": w, "h": h, "gid": FIRSTGID + tid}
        extras["tiles"].append({"id": tid, "image": f"../objects/{name}.png", "imageheight": h, "imagewidth": w})
        tsx = tsx.replace("</tileset>", f' <tile id="{tid}">\n  <image source="../objects/{name}.png" '
                                        f'width="{w}" height="{h}"/>\n </tile>\n</tileset>')
        if f"this.load.image('{name}'" not in game:
            loads += f"    this.load.image('{name}', 'objects/{name}.png');\n"
        if wall:
            base = name.rstrip("0123456789")
            m = re.search(r"WALL_MOUNTED_EXTRAS = \{\n(.*?)\n\}", gen, re.S)
            if f'"{base}"' not in m.group(1):
                body = m.group(1).rstrip(",") + f',\n    "{base}",'
                gen = gen[:m.start(1)] + body + gen[m.end(1):]

    extras["tilecount"] = len(extras["tiles"])
    tsx = re.sub(r'tilecount="\d+"', f'tilecount="{extras["tilecount"]}"', tsx, count=1)
    game = game[:anchor.end()] + loads + game[anchor.end():]
    if dry:
        print("dry run: nothing written")
        return
    CATALOG.write_text(json.dumps(cat, indent=2) + "\n")
    REF.write_text(json.dumps(ref, separators=(",", ":")) + ("\n" if ref_raw.endswith("\n") else ""))
    TSX.write_text(tsx)
    GAME_JS.write_text(game)
    GEN.write_text(gen)
    print("registered; now place it (builder or room_edit.py) and re-render")


if __name__ == "__main__":
    main(sys.argv[1:])
