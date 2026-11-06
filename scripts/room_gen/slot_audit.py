#!/usr/bin/env python3
"""
Check that every scenario object has a map slot to land on.

rooms.js places each scenario object on an unreserved map sprite of the same
base type (the image name with trailing digits stripped, so "notes" matches
notes1..notes6). When a room runs out of matching sprites the object is dropped
at a random free spot, which reads as clutter on the floor or on top of other
furniture. The validator doesn't catch this; this script does.

Matching rules mirrored from rooms.js (TiledItemPool / processScenarioObjects...):
  - "position": "as-type:X" claims a sprite of base type X (often a decor item).
  - otherwise "sprite": "K" is tried as a base-type key first, then "type".
  - tableItems of a "type": "table" object are matched the same way.
  - layers are searched items, table_items, conditional_items,
    conditional_table_items; within a layer the first unreserved sprite wins.

It also warns when a "sprite" override is more than 4px taller than the slot it
lands on: overrides are drawn from the slot's top-left, so a taller texture hangs
down (a chalkboard on a notes slot ends up standing on the wall). tableItems with
no slot are fine: rooms.js lays them out on their table.

--notes reviews how each readable "notes" object is presented. Only loose papers
should open as a notebook page. The review flags:
  FIXED  a note that lands on a fixture (an as-type or sprite that isn't a notes
         sprite: board, sign, plaque, panel, screen...) without "readDisplay":
         "gameDisplay", or one that is takeable
  OPEN   furniture you would open (cabinet, locker, drawer...) written as a note
         about its contents: make it a container with "contents"
  LIVE   a note with textVariants that still copies into notes: add
         "addToNotes": false so no stale snapshot is kept
These are prompts to look, not errors, and don't change the exit status.

Usage:
  slot_audit.py scenarios/m02_ransomed_trust/scenario.json.erb [more.erb ...]
  slot_audit.py --all            # every scenario
  slot_audit.py --verbose ...    # also list which slot each object takes
  slot_audit.py --notes ...      # also review how notes objects are presented
"""
import collections
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ROOMS = ROOT / "public/break_escape/assets/rooms"
OBJECTS = ROOT / "public/break_escape/assets/objects"
LAYER_ORDER = ["items", "table_items", "conditional_items", "conditional_table_items"]

RENDER_RB = """
require "./scripts/validate_scenario.rb"
r = render_erb_to_json(ARGV[0])
puts(r.is_a?(String) ? r : JSON.generate(r))
"""


def render(erb):
    out = subprocess.run(["ruby", "-e", RENDER_RB, str(erb)], cwd=ROOT, capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError(out.stderr.strip()[-400:])
    return json.loads(out.stdout)


def base_type(image_name):
    b = re.sub(r"\d+$", "", image_name)
    return "notes" if b == "note" else b


def slots_for(room_type):
    """{base type: [(layer, image, obj), ...]} in rooms.js search order, or None if no map."""
    path = ROOMS / f"{room_type}.json"
    if not path.exists():
        # game.js registers some keys in lower case for mixed-case files (room_it -> room_IT.json)
        path = next((p for p in ROOMS.glob("*.json") if p.stem.lower() == room_type.lower()), None)
    if path is None or not path.exists():
        return None
    m = json.loads(path.read_text())
    gids = {}
    for ts in m["tilesets"]:
        for t in ts.get("tiles", []):
            if "image" in t:
                gids[ts["firstgid"] + t["id"]] = Path(t["image"]).stem
    by_layer = {lay["name"]: lay.get("objects") or [] for lay in m["layers"] if lay.get("type") == "objectgroup"}
    out = collections.defaultdict(list)
    for name in LAYER_ORDER:
        for o in by_layer.get(name, []):
            img = gids.get(o.get("gid"))
            if img:
                out[base_type(img)].append((name, img, o))
    return out


def sprite_height(key):
    p = OBJECTS / f"{key}.png"
    return Image.open(p).height if p.exists() else None


def audit(scenario, verbose=False):
    problems = 0
    for rid, room in scenario.get("rooms", {}).items():
        pool = slots_for(room.get("type", ""))
        if pool is None:
            continue
        taken = collections.Counter()
        lines = []

        def claim(obj):
            pos = obj.get("position")
            keys = []
            if isinstance(pos, str) and pos.startswith("as-type:"):
                keys = [pos[8:]]
            else:
                if isinstance(obj.get("sprite"), str):
                    keys.append(obj["sprite"])
                keys.append(obj.get("type"))
            for k in keys:
                if taken[k] < len(pool.get(k, [])):
                    layer, img, o = pool[k][taken[k]]
                    taken[k] += 1
                    return k, layer, img, o
            return keys[-1], None, None, None

        objs = []
        for o in room.get("objects", []):
            if o.get("type") == "table" and isinstance(o.get("tableItems"), list):
                objs += [(t, True) for t in o["tableItems"]]
            else:
                objs.append((o, False))
        for o, on_table in objs:
            label = f'{o.get("type")} "{o.get("name", "")}"'
            key, layer, img, slot = claim(o)
            if slot is None:
                if on_table:   # rooms.js lays unmatched tableItems out on their table
                    if verbose:
                        lines.append(f"  table    {label}: no '{key}' slot, laid out on its table")
                    continue
                lines.append(f"  NO SLOT  {label}: no free '{key}' sprite -> random position")
                problems += 1
                continue
            if verbose:
                lines.append(f"  ok       {label} -> {img} ({layer}) at {slot['x']:.0f},{slot['y']:.0f}")
            spr = o.get("sprite")
            if isinstance(spr, str) and spr != img:
                h = sprite_height(spr)
                if h is not None and h - slot["height"] > 4:
                    lines.append(f"  SIZE     {label}: sprite {spr} is {h}px tall on a {slot['height']}px {img} slot "
                                 f"(drawn from the slot's top-left); use as-type onto a real {base_type(spr)} instead")
                    problems += 1
        if lines:
            print(f"{rid} ({room.get('type')})")
            print("\n".join(lines))
    return problems


OPEN_WORDS = re.compile(r"\b(cabinet|locker|drawer|cupboard|filing|shelf|shelves|box|crate|fridge|cart|"
                        r"trolley|bag|chest|wardrobe|bin)s?\b", re.I)


def notes_review(scenario):
    """Print FIXED / OPEN / LIVE prompts for readable notes objects; returns how many."""
    hints = 0
    for rid, room in scenario.get("rooms", {}).items():
        objs = []
        for o in room.get("objects", []):
            objs.append(o)
            if o.get("type") == "table" and isinstance(o.get("tableItems"), list):
                objs += o["tableItems"]
        lines = []
        for o in objs:
            if o.get("type") != "notes" or not o.get("readable", True):
                continue
            name = o.get("name", "")
            pos = o.get("position")
            # what it lands on decides: a notes sprite is a loose paper, anything
            # else (as-type or a sprite override) is a fixture read where it is
            if isinstance(pos, str) and pos.startswith("as-type:"):
                lands_on = pos[8:]
            elif isinstance(o.get("sprite"), str):
                lands_on = base_type(o["sprite"])
            else:
                lands_on = "notes"
            in_place = o.get("readDisplay") == "gameDisplay"
            fixture = lands_on != "notes"
            if fixture and not in_place:
                lines.append(f'  FIXED  "{name}": read in place? add "readDisplay": "gameDisplay"')
            if fixture and o.get("takeable"):
                lines.append(f'  FIXED  "{name}": a fixture should not be takeable')
            if OPEN_WORDS.search(name) and not in_place and "contents" not in o:
                lines.append(f'  OPEN   "{name}": furniture to open? make it a container with "contents"')
            if o.get("textVariants") and o.get("addToNotes", True) is not False:
                lines.append(f'  LIVE   "{name}": has textVariants; add "addToNotes": false')
        if lines:
            print(f"{rid} (notes review)")
            print("\n".join(lines))
            hints += len(lines)
    return hints


def main(argv):
    verbose = "--verbose" in argv
    notes = "--notes" in argv
    args = [a for a in argv if not a.startswith("--")]
    if "--all" in argv:
        args = sorted(str(p) for p in (ROOT / "scenarios").glob("*/scenario.json.erb"))
    if not args:
        sys.exit(__doc__)
    total = 0
    for erb in args:
        print(f"== {erb}")
        try:
            scenario = render(erb)
            total += audit(scenario, verbose)
            if notes:
                print(f"{notes_review(scenario)} notes prompt(s)")
        except Exception as e:
            print(f"  could not render: {e}")
    print(f"{total} problem(s)")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
