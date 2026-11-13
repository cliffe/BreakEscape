#!/usr/bin/env python3
"""Seated-scale map fixes (docs/achitechture/SEATED_SCALE_AUDIT.md, approved 2026-11-06).

Per room map (.json and its .tmj twin, edited together, formatting kept):

  1. hospital_desk1/2 and exec_desk1 lose 4 leg rows (tools/seated_scale/fix_sprites.py): the
     placement keeps its floor line (y), its height drops by 4, and every item on that desk
     moves 4 px down with the top.
  2. smalldesk1 -> desk3 and smalldesk2 -> desk2 where a chair stands at the desk (static or
     swivel), floor line and centre kept.
  3. bankers_lamp1 -> office-misc-lamp4, centre and base kept.
  4. Hospital chair family (+4 rows north views, +3 south) and m10_steel_chair1 (+5): height and
     y grow by the added rows, so the top stays where it was (the game draws from the top).
  5. Desk-top items: monitors and lamps stand 3 rows behind the top's front edge at least;
     other items (keyboards, phones, notes, laptops) no more than 0 rows past it. Only items
     that hang further forward move, and only backwards.
  6. Embedded tileset image heights for the edited sprites.

Usage:
  python3 tools/seated_scale/fix_maps.py [--apply] [--only room_a,room_b] [--skip room_x]
         [--report out.json]
Dry run by default: prints every planned change. Protected maps (maplib.PROTECTED) are
reported, never written.
"""
import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(__file__))
import maplib as ml  # noqa: E402

SHRINK = {"hospital_desk1": 4, "hospital_desk2": 4, "exec_desk1": 4}
CHAIR_ROWS = {"hospital_chair_north": 4, "hospital_chair_north2": 4, "aw_chair_north_charcoal1": 4,
              "aw_chair_north_slate1": 4, "hospital_chair_south": 3, "aw_chair_south_charcoal1": 3,
              "aw_chair_south_slate1": 3, "m10_steel_chair1": 5}
SWAP_DESK = {"smalldesk1": ("desk3", 51, 39), "smalldesk2": ("desk2", 44, 39)}
SWAP_LAMP = {"bankers_lamp1": ("office-misc-lamp4", 12, 23)}
# Original image heights (before fix_sprites.py), so the script can be re-run safely.
ORIG_H = {"hospital_desk1": 48, "hospital_desk2": 48, "exec_desk1": 46, "hospital_chair_north": 26,
          "hospital_chair_north2": 26, "aw_chair_north_charcoal1": 26, "aw_chair_north_slate1": 26,
          "hospital_chair_south": 32, "aw_chair_south_charcoal1": 32, "aw_chair_south_slate1": 32,
          "m10_steel_chair1": 26}
SEATS = set("hospital_chair_south aw_chair_south_charcoal1 aw_chair_south_slate1 hospital_chair_north "
            "hospital_chair_north2 aw_chair_north_charcoal1 aw_chair_north_slate1 exec_chair_back1 "
            "exec_chair_black1 aw_studio_chair_n1 m10_steel_chair1 chair-waiting-left-1 "
            "chair-waiting-right-1 aw_studio_chair_s1 sofa1 club_chair_e1 club_chair_w1 leather_chair1 "
            "chair-darkgray-1 chair-grey-1 chair-grey-4 chair-white-1 chair-white-2 chair-exec".split())
# Desk tops measured by scripts/room_gen/measure_table_surfaces.py (surfaceTop, surfaceFront),
# the reliable "top-run" ones of desks and tables. Rows below the front edge are unchanged by
# the leg-row removal, so these stay valid for the shortened desks.
TOPS = {"desk1": (0, 16), "desk2": (0, 16), "desk3": (0, 16), "zds_desk1": (0, 16), "zds_desk3": (0, 16),
        "display_table1": (0, 16), "exec_desk1": (1, 17), "hospital_desk1": (2, 18),
        "hospital_desk2": (2, 18), "hospital_conference_table": (2, 30), "zds_conference_table1": (2, 30),
        "smalldesk1": (2, 26), "smalldesk2": (2, 26), "pnw_master_desk1": (2, 16),
        "pnw_desk_return1": (2, 16), "hq_interview_table1": (1, 17), "m10_steel_bench1": (2, 17),
        "aes_trestle1": (1, 18), "aes_trestle2": (2, 17)}
STANDING = re.compile(r"^(pc\d+|aw_pc|.*monitor|.*imac|office-misc-lamp\d|bankers_lamp|desk_lamp|.*_lamp\d*$|"
                      r"computer|.*screen|crt|tv\d)", re.I)
STAND_TARGET = -3   # base row 3 rows behind the front edge
FLAT_TARGET = 0     # base row on the front edge
FLAT_LIMIT = 2      # flat items move only when they hang more than this past the edge
# Chairs that mean "someone sits at this desk" for the smalldesk swap (not sofas or side seats).
DESK_SEATS = set("hospital_chair_south aw_chair_south_charcoal1 aw_chair_south_slate1 hospital_chair_north "
                 "hospital_chair_north2 aw_chair_north_charcoal1 aw_chair_north_slate1 exec_chair_back1 "
                 "exec_chair_black1 aw_studio_chair_n1 aw_studio_chair_s1 m10_steel_chair1 chair-darkgray-1 "
                 "chair-grey-1 chair-grey-4 chair-white-1 chair-white-2 chair-exec".split())
ITEM_LAYERS = ("table_items", "conditional_table_items")


def resolve_names(m, map_dir):
    """gid -> image name, embedded and external (.tsx) tilesets."""
    names = ml.tile_names(m)
    for t in m.get("tilesets", []):
        if "source" not in t:
            continue
        p = os.path.normpath(os.path.join(map_dir, t["source"]))
        if not os.path.exists(p):
            continue
        root = ET.parse(p).getroot()
        for tile in root.findall("tile"):
            img = tile.find("image")
            if img is not None:
                names[t["firstgid"] + int(tile.get("id"))] = os.path.splitext(os.path.basename(img.get("source")))[0]
    return names


def gid_for(names, name):
    for g, n in names.items():
        if n == name:
            return g
    return None


def plan_map(path, items_only=False):
    """Planned changes for one .json map: {obj_id: {key: new}}, tile height edits, notes."""
    m = json.load(open(path))
    names = resolve_names(m, os.path.dirname(path))
    objs = []
    for lname, o in ml.objects(m):
        n = names.get(o["gid"] & ml.GID_MASK)
        if n:
            objs.append((lname, o, n))
    tables = [(o, n) for l, o, n in objs if l.startswith("tables") or n in TOPS or n in SHRINK]
    tables = [(o, n) for o, n in tables if n in TOPS or n in SWAP_DESK]
    edits, notes, add_tiles = {}, [], []

    def setv(o, **kv):
        edits.setdefault(o["id"], {}).update(kv)

    def cur(o, k):
        return edits.get(o["id"], {}).get(k, o[k])

    def table_of(o):
        x0, x1, y0, y1 = o["x"], o["x"] + o["width"], o["y"] - o["height"], o["y"]
        hits = [(t, n) for t, n in tables if t is not o and x0 < t["x"] + t["width"] and x1 > t["x"]
                and y0 < t["y"] and y1 > t["y"] - t["height"]]
        return max(hits, key=lambda tn: tn[0]["y"] - tn[0]["height"]) if hits else None

    items = [(l, o, n) for l, o, n in objs if l in ITEM_LAYERS and not o.get("rotation")]
    group = {o["id"]: table_of(o) for l, o, n in items}
    chairs = [(o, n) for l, o, n in objs if re.sub(r"-?rotate\d+$", "", n) in SEATS]

    # 1. shorter desks: keep the floor, move the items with the top
    for t, n in tables:
        if n in SHRINK and t["height"] == ORIG_H[n] and not items_only:
            k = SHRINK[n]
            setv(t, height=t["height"] - k)
            for l, o, on in items:
                g = group[o["id"]]
                if g and g[0] is t:
                    setv(o, y=o["y"] + k)
    # 2. smalldesk -> desk3/desk2 where someone sits
    tname = {}
    for t, n in tables:
        tname[t["id"]] = n
        if n not in SWAP_DESK or items_only:
            continue
        x0, y0, x1, y1 = t["x"], t["y"] - t["height"], t["x"] + t["width"], t["y"]
        sat = []
        for c, cn in chairs:
            if re.sub(r"-?rotate\d+$", "", cn) not in DESK_SEATS:
                continue
            dx = max(x0 - (c["x"] + c["width"]), c["x"] - x1, 0)
            dy = max(y0 - c["y"], (c["y"] - c["height"]) - y1, 0)
            if dx <= 8 and dy <= 16:
                sat.append(cn)
        if not sat:
            continue
        new, w, h = SWAP_DESK[n]
        g = gid_for(names, new)
        if g is None:
            add_tiles.append((n, new, w, h))
            g = ("NEW", new)
        flags = t["gid"] & ~ml.GID_MASK
        setv(t, gid=(g if isinstance(g, tuple) else g | flags), width=w, height=h,
             x=t["x"] + (t["width"] - w) // 2)
        tname[t["id"]] = new
        notes.append("swap %s -> %s (id %d, chairs %s)" % (n, new, t["id"], ",".join(sorted(set(sat)))))
    # 3. banker's lamp -> office-misc-lamp4
    for l, o, n in objs:
        if n in SWAP_LAMP:
            new, w, h = SWAP_LAMP[n]
            g = gid_for(names, new)
            if g is None:
                add_tiles.append((n, new, w, h))
                g = ("NEW", new)
            flags = o["gid"] & ~ml.GID_MASK
            setv(o, gid=(g if isinstance(g, tuple) else g | flags), width=w, height=h,
                 x=o["x"] + (o["width"] - w) // 2)
    # 4. chairs: taller, top kept
    for l, o, n in objs:
        if n in CHAIR_ROWS and o["height"] == ORIG_H[n] and not items_only:
            k = CHAIR_ROWS[n]
            setv(o, height=o["height"] + k, y=o["y"] + k)
    # 5. desk-top items
    for l, o, n in items:
        g = group[o["id"]]
        if not g:
            continue
        t, _ = g
        tn = tname[t["id"]]
        if tn not in TOPS:
            continue
        top_row, front_row = TOPS[tn]
        T = cur(t, "y") - cur(t, "height")
        front = T + front_row
        y = cur(o, "y")
        past = (y - 1) - front
        stand = bool(STANDING.match(SWAP_LAMP.get(n, (n,))[0]))
        target = STAND_TARGET if stand else FLAT_TARGET
        if (stand and past > target + 0.5) or (not stand and past > FLAT_LIMIT):
            dy = -round(past - target)
            ny = y + dy
            back = T + top_row + 2
            if ny - 1 < back:
                ny = back + 1
            if ny < y:
                setv(o, y=ny)
                notes.append("item %s id %d on %s: base %+.1f -> %+.1f" % (n, o["id"], tn, past, (ny - 1) - front))
    # 6. tile heights touched
    tile_h = {}
    for n in ([] if items_only else set(SHRINK) | set(CHAIR_ROWS)):
        if gid_for(ml.tile_names(m), n) is not None:
            d = -SHRINK[n] if n in SHRINK else CHAIR_ROWS[n]
            tile_h[n] = ORIG_H[n] + d
    return m, names, edits, notes, add_tiles, tile_h


def apply_to(path, m, names_json, edits, add_tiles, tile_h, report, is_twin=False):
    text = open(path).read()
    tm = json.loads(text) if is_twin else m
    tnames = resolve_names(tm, os.path.dirname(path))
    tobjs = {o["id"]: o for _, o in ml.objects(tm)}
    jobjs = {o["id"]: o for _, o in ml.objects(m)}
    new_gid = {}
    for like, new, w, h in add_tiles:
        if new in new_gid or gid_for(tnames, new) is not None:
            continue
        try:
            text, gid, fg = ml.add_tile_like(text, tm, like, new, w, h)
            text = ml.bump_tilecount(text, fg)
            tm = json.loads(text)
            new_gid[new] = gid
        except (KeyError, ValueError) as e:
            report.append("  %s: cannot add tile %s (%s)" % (os.path.basename(path), new, e))
    for oid, ch in edits.items():
        jo, to = jobjs[oid], tobjs.get(oid)
        if is_twin and (to is None or tnames.get(to["gid"] & ml.GID_MASK) != names_json.get(jo["gid"] & ml.GID_MASK)
                        or abs(to["x"] - jo["x"]) > 0.01 or abs(to["y"] - jo["y"]) > 0.01):
            report.append("  twin %s: object %d differs, skipped" % (os.path.basename(path), oid))
            continue
        ch = dict(ch)
        if "gid" in ch:
            g = ch["gid"]
            name = g[1] if isinstance(g, tuple) else names_json.get(g & ml.GID_MASK)
            tg = new_gid.get(name) or gid_for(tnames, name)
            if tg is None:
                report.append("  %s: no tile for %s, object %d left" % (os.path.basename(path), name, oid))
                continue
            ch["gid"] = tg | ((to or jo)["gid"] & ~ml.GID_MASK)
        text = ml.edit_object(text, oid, **ch)
    for n, h in tile_h.items():
        text, _ = ml.edit_tile_image(text, n, imageheight=h)
    return text


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--skip", default="")
    ap.add_argument("--report")
    ap.add_argument("--items-only", action="store_true",
                    help="only desk-top items and lamp swaps (maps another agent is editing)")
    a = ap.parse_args(argv)
    only = set(filter(None, a.only.split(",")))
    skip = set(filter(None, a.skip.split(",")))
    summary = {}
    for jp, twin in ml.map_paths():
        room = os.path.basename(jp)[:-5]
        if (only and room not in only) or room in skip:
            continue
        try:
            m, names, edits, notes, add_tiles, tile_h = plan_map(jp, a.items_only)
        except (json.JSONDecodeError, KeyError) as e:
            continue
        if not edits and not tile_h:
            continue
        summary[room] = {"objects": len(edits), "notes": notes, "tiles": tile_h,
                         "protected": room in ml.PROTECTED, "twin": bool(twin)}
        print("%s%s: %d objects, tiles %s" % (room, " (PROTECTED, not written)" if room in ml.PROTECTED else "",
                                             len(edits), tile_h))
        for n in notes:
            print("  " + n)
        if a.apply and room not in ml.PROTECTED:
            rep = []
            ml.save_checked(jp, apply_to(jp, m, names, edits, add_tiles, tile_h, rep))
            if twin:
                ml.save_checked(twin, apply_to(twin, m, names, edits, add_tiles, tile_h, rep, is_twin=True))
            for r in rep:
                print(r)
            summary[room]["warnings"] = rep
    if a.apply and not a.items_only:
        for tsx in ("tables.tsx", "objects.tsx", "objects_hospital_extras.tsx"):
            p = os.path.join(ml.ROOMS, tsx)
            for n in set(SHRINK) | set(CHAIR_ROWS):
                d = -SHRINK[n] if n in SHRINK else CHAIR_ROWS[n]
                ml.edit_tsx(p, n, ORIG_H[n] + d)
    if a.report:
        json.dump(summary, open(a.report, "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
