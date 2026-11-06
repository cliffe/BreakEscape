#!/usr/bin/env python3
"""List desk-top items that hang past their desk's front edge, from a room snapshot
(tools/playtest/room-snapshot.mjs). Covers scenario-placed objects as well as Tiled ones.

  python3 tools/seated_scale/audit_snapshot.py <snapshot.json> [--all]

An item is on a desk when its sprite overlaps the desk's, its base row lies between the desk's
top and floor, and it draws above the desk. Monitors and lamps should stand 3 rows behind the
front edge; other items should not pass it by more than 2 rows (fix_maps.py's rule).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from fix_maps import TOPS, STANDING, FLAT_LIMIT, STAND_TARGET  # noqa: E402

NOT_ITEMS = set(TOPS) | {"smalldesk1", "smalldesk2"}


def rect(o):
    x0 = o["x"] - o["w"] * o["ox"]
    y0 = o["y"] - o["h"] * o["oy"]
    return x0, y0, x0 + o["w"], y0 + o["h"]


def main(path, show_all):
    snap = json.load(open(path))["scenarios"]
    bad = []
    for scen, s in sorted(snap.items()):
        for room, sprites in (s.get("rooms") or {}).items():
            desks = [o for o in sprites if o["key"] in TOPS and o.get("visible", True)]
            for o in sprites:
                if o["key"] in NOT_ITEMS or "chair" in o["key"] or not o.get("visible", True):
                    continue
                x0, y0, x1, y1 = rect(o)
                hits = []
                for d in desks:
                    dx0, dy0, dx1, dy1 = rect(d)
                    if x0 < dx1 and dx0 < x1 and dy0 <= y1 - 1 <= dy1 and o["depth"] > d["depth"]:
                        hits.append(d)
                if not hits:
                    continue
                d = max(hits, key=lambda d: rect(d)[1])
                top_row, front_row = TOPS[d["key"]]
                past = (y1 - 1) - (rect(d)[1] + front_row)
                stand = bool(STANDING.match(o["key"]))
                limit = STAND_TARGET + 0.5 if stand else FLAT_LIMIT
                if past > limit or show_all:
                    bad.append((scen, room, o["id"], o["key"], d["key"], round(past, 1)))
    for b in bad:
        print("%s\t%s\t%s\t%s on %s\t%+.1f" % b)
    print("total", len(bad), file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], "--all" in sys.argv)
