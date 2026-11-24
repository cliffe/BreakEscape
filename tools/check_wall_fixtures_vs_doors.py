#!/usr/bin/env python3
"""Flag wall fixtures (posters, screens, signs, boards) that overlap a door.

Usage:
  python3 tools/check_wall_fixtures_vs_doors.py scenarios/m05_insider_trading/scenario.json.erb [...]
  python3 tools/check_wall_fixtures_vs_doors.py --all          # every m01-m10 scenario
  python3 tools/check_wall_fixtures_vs_doors.py --map room_qdc_lobby --door north-left   # one map, no scenario

For each scenario room the script works out where the engine draws each door
(same placement as scripts/check_door_alignment.py, which ports core/rooms.js
and systems/doors.js), then compares each wall fixture on that room's map
against the door's span on the same wall:

  north door  x centre +-16, y 0-64   (back-wall fixtures: bottom above the floor line)
  east door   x w-32..w, y centre +-16 (side-wall fixtures)
  west door   x 0..32,  y centre +-16
  south doors sit under the room's lower edge and are not checked.

A wall fixture is a sprite that generate_rooms.is_wall_mounted() names, or any
map sprite whose feet are on the back wall (bottom <= 62). Only map sprites are
read: scenario "position" overrides on objects are not modelled.
When a room's grid position can't be worked out (array connections), a single
north door is checked at both corners and the finding says so.

--both-corners also tests a single north door at the other corner. The engine places
rooms by a BFS from the start room and picks the door side from grid parity, so a take
recorded with --start-room (as the trailers do) shows the door on the other side.

Exit status 1 if any overlap is found, else 0.
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import check_door_alignment as cda  # noqa: E402
import generate_rooms as gr  # noqa: E402

TILE = 32
DOOR_HALF = 16          # a door is one tile wide / tall
FLOOR_LINE = 62         # a sprite with its feet above this stands on the back wall
SIDE_STRIP = 30         # side-wall fixtures sit within this many px of the edge
ROOMS_DIR = ROOT / "public/break_escape/assets/rooms"


def snap(room_x, x):
    return room_x + (int((x - room_x) // TILE) + 0.5) * TILE


def map_fixtures(map_name):
    """Wall fixtures of a map: [(label, left, right, top, bottom, side)] in room px.
    side is 'back' or 'west'/'east'."""
    room = json.load(open(ROOMS_DIR / cda.TMAP.get(map_name, f"{map_name}.json")))
    w = room["width"] * TILE
    gid_to_name = {}
    for kind in ("objects", "tables"):
        for name, info in gr.CATALOG[kind].items():
            gid_to_name[info["gid"]] = name
    for ts in room["tilesets"]:
        for t in ts.get("tiles", []):
            if "image" in t:
                gid_to_name[ts["firstgid"] + t["id"]] = Path(t["image"]).stem
    out = []
    for layer in room["layers"]:
        if layer["name"] not in ("items", "conditional_items", "tables"):
            continue
        for o in layer.get("objects", []):
            if not o.get("gid"):
                continue
            name = gid_to_name.get(o["gid"], f"gid{o['gid']}")
            left, right = o["x"], o["x"] + o["width"]
            top, bottom = o["y"] - o["height"], o["y"]
            on_back = bottom <= FLOOR_LINE
            wall = gr.is_wall_mounted(name)
            if not (wall or on_back):
                continue
            label = f"{name} (#{o['id']} {layer['name']})"
            if on_back:
                out.append((label, left, right, top, bottom, "back"))
            elif left < SIDE_STRIP:
                out.append((label, left, right, top, bottom, "west"))
            elif right > w - SIDE_STRIP:
                out.append((label, left, right, top, bottom, "east"))
    return out, w


def check_map_against_doors(map_name, doors, fixtures=None):
    """doors: [(direction, centre)] where centre is x for north and y for east/west.
    Returns a list of message strings."""
    fixtures, w = fixtures or map_fixtures(map_name)
    msgs = []
    for direction, centre, note in doors:
        for label, left, right, top, bottom, side in fixtures:
            if direction == "north" and side == "back":
                x0, x1 = centre - DOOR_HALF, centre + DOOR_HALF
                if left < x1 and right > x0 and top < 64:
                    msgs.append(f"{label} x {left:.0f}-{right:.0f} y {top:.0f}-{bottom:.0f} overlaps the "
                                f"north door x {x0:.0f}-{x1:.0f}{note}")
            elif direction in ("east", "west") and side == direction:
                y0, y1 = centre - DOOR_HALF, centre + DOOR_HALF
                if top < y1 and bottom > y0:
                    msgs.append(f"{label} x {left:.0f}-{right:.0f} y {top:.0f}-{bottom:.0f} overlaps the "
                                f"{direction} door y {y0:.0f}-{y1:.0f}{note}")
    return msgs


def positions(sc, D):
    P = {sc["startRoom"]: (0, 0)}
    q = [sc["startRoom"]]
    rooms = sc["rooms"]
    while q:
        cur = q.pop(0)
        for d in ("north", "south", "east", "west"):
            con = rooms[cur].get("connections", {}).get(d)
            if not con:
                continue
            lst = con if isinstance(con, list) else [con]
            un = [r for r in lst if r not in P]
            if len(un) != 1:
                continue
            P[un[0]] = cda.pos_single(d, cur, un[0], P[cur], D)
            q.append(un[0])
    return P


def room_doors(rid, rooms, D, P):
    """[(direction, centre, note)] of this room's N/E/W doors, as the engine places them."""
    conns = rooms[rid].get("connections", {})
    w, h = D[rid]["w"], D[rid]["h"]
    out = []
    n = conns.get("north")
    if n:
        lst = n if isinstance(n, list) else [n]
        if len(lst) > 1:
            inset = TILE * 1.5
            spacing = (w - 2 * inset) / (len(lst) - 1)
            for i in range(len(lst)):
                out.append(("north", snap(0, inset + spacing * i), ""))
        else:
            other = rooms.get(lst[0], {}).get("connections", {}).get("south")
            if isinstance(other, list) and len(other) > 1 and rid in other and rid in P and lst[0] in P:
                inset = TILE * 1.5
                spacing = (D[lst[0]]["w"] - 2 * inset) / (len(other) - 1)
                ax = snap(P[lst[0]][0], P[lst[0]][0] + inset + spacing * other.index(rid))
                out.append(("north", ax - P[rid][0], ""))
            elif rid in P:
                right = cda.par(*P[rid]) == 1
                out.append(("north", w - 48 if right else 48, ""))
            else:
                out.append(("north", 48, " (grid position unknown, left corner)"))
                out.append(("north", w - 48, " (grid position unknown, right corner)"))
    for d in ("east", "west"):
        c = conns.get(d)
        if not c:
            continue
        lst = c if isinstance(c, list) else [c]
        if len(lst) == 1:
            out.append((d, TILE * 2.5, ""))
        else:
            top, bottom = TILE * 2.5, h - TILE * 2.5
            for i in range(len(lst)):
                out.append((d, top + (bottom - top) / (len(lst) - 1) * i, ""))
    return out


def check_scenario(path, both_corners=False):
    sc = cda.load_scenario(path)
    rooms = sc["rooms"]
    D = {r: cda.dims(v["type"]) for r, v in rooms.items()}
    P = positions(sc, D)
    found = []
    for rid, v in rooms.items():
        fixtures = map_fixtures(v["type"])
        doors = room_doors(rid, rooms, D, P)
        if both_corners:
            # Door sides follow the grid parity of the BFS from the start room, so a
            # take recorded with --start-room flips them. Also test the other corner.
            w = D[rid]["w"]
            extra = []
            for d, c, _ in doors:
                if d == "north" and c in (48, w - 48):
                    extra.append(("north", w - 48 if c == 48 else 48, " (other corner: a different start room flips the door side)"))
            doors += extra
        for m in check_map_against_doors(v["type"], doors, fixtures):
            found.append(f"{rid} [{v['type']}]: {m}")
    return found


def main(argv):
    if "--map" in argv:
        i = argv.index("--map")
        name = argv[i + 1]
        j = argv.index("--door") + 1
        side, _, corner = argv[j].partition("-")
        w = map_fixtures(name)[1]
        centre = (48 if corner != "right" else w - 48) if side == "north" else 80
        msgs = check_map_against_doors(name, [(side, centre, "")])
        print("\n".join(msgs) or "no overlaps")
        return 1 if msgs else 0
    paths = [a for a in argv if not a.startswith("--")]
    if "--all" in argv:
        paths = sorted(str(p) for p in (ROOT / "scenarios").glob("m[01][0-9]_*/scenario.json.erb"))
    if not paths:
        print(__doc__)
        return 2
    total = 0
    for p in paths:
        found = check_scenario(p, "--both-corners" in argv)
        print(f"{p}: {len(found)} overlap(s)")
        for f in found:
            print("  " + f)
        total += len(found)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
