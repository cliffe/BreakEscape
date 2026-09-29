#!/usr/bin/env python3
"""
Generate Break Escape Tiled rooms (.tmj + game-ready .json with embedded tilesets).

Perspective rules (top-down hybrid):
  - Top 2 tile rows = back wall (visual only). Floor playable area starts below that.
  - Desk sprites: upper portion = tabletop surface; lower portion = front legs.
  - table_items / conditional_table_items must sit on the tabletop, not on the legs
    and not floating above the desk.

Table-surface placement (item bottom Y relative to table sprite):
  - Prefer frac_from_top in ~0.15–0.50 for flat desks (desk1/2/3, smalldesk*).
  - Tall props (lamps, small plants) sit nearer the back edge (~0.10–0.25).
  - Notes / phones / laptops sit mid-surface (~0.30–0.48).
  - Avoid frac_from_top > ~0.55 (looks like the item is on the legs).

Prop rules:
  - PCs/monitors always on desks (never floor). Usually conditional_table_items.
  - Never place keyboard sprites — PC art already includes a keyboard.
  - Small plants (plant-flat-pot*, office-misc-smallplant*) go on desks, not floor.
  - Regular plant-large / plant-large1–10 go on desks (table_items), not floor.
  - Floor interactive plants only: plant-large11/12/13 and plant-large{11,12,13}-top-ani*
    (these bump-animate with the player). Prefer 2+ when used; line-up is optional
    (they're large — corners / opposite sides often look better).
  - Hospital rooms (room_hospital*) carry no plants at all, floor or desk.
  - lamp-stand*: never place just one — use 2+ in a straight line (same X or Y).
  - Face-on wall-backed furniture (vending_machine1, bookcase) stands with its
    back to the back wall: sprite top edge on the skirting, i.e. y - h = 70
    (FLOOR_TOP_PX). Bookcases may stand free only when deliberately dividing
    the room (e.g. a pair forming a nook).
  - Chairs face their table: hospital_chair2 faces east (use it west of a table),
    hospital_chair1 faces west (east of a table), hospital_chair_south faces the
    viewer (north of a table), hospital_chair_north is seen from behind (south).
  - Wall pictures: place on clear back-wall spans; avoid overlapping filing
    cabinets, bookcases, servers, chalkboards.
  - Door corner clearance (keep free of furniture/props):
      NW tiles:  W D      NE (mirrored):  D W
                 W D                       D W
                 D F                       F D
    i.e. reserve the top-left and top-right 2×3 tile footprints
    (px: [0,64)×[0,96) and [width-64,width)×[0,96)).
  - Bottom 2 tile rows may be covered by a room to the south — keep gameplay /
    furniture feet above (height-2)*tileSize. Aesthetic props (floor plants,
    lamp-stands, bins) are fine in that band.

Layers (required):
  walls, room, doors, tables, items, conditional_items,
  table_items, conditional_table_items
  (optional empty "Object Layer 1")

Usage:
  python3 scripts/generate_rooms.py [room ...]      # regenerate (all, or named rooms)
  python3 scripts/generate_rooms.py --check [room ...]  # validate existing .json only

Review what a room looks like without launching the game:
  python3 scripts/render_room_preview.py 'room_hospital_*' --sheet [--grid]
  (writes PNGs + contact_sheet.png to scripts/room_gen/previews/)

Exports game JSON via:
  ~/bin/Tiled-1.11.2_Linux_Qt-6_x86_64.AppImage --embed-tilesets --export-map json <tmj> <json>
(override binary with TILED_BIN=...)
"""

from __future__ import annotations

import copy
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOMS_DIR = ROOT / "public/break_escape/assets/rooms"
REF_DIR = Path(__file__).resolve().parent / "room_gen"

TILE = 32

# Tiled 1.11.2 AppImage (user install). Override with TILED_BIN if needed.
TILED_BIN = Path(
    os.environ.get(
        "TILED_BIN",
        str(Path.home() / "bin/Tiled-1.11.2_Linux_Qt-6_x86_64.AppImage"),
    )
)

# NW / NE door footprints (see WD/WD/DF pattern) — keep clear of props
DOOR_CORNER_TILES = 2  # width in tiles
DOOR_CORNER_ROWS = 3   # height in tiles


def door_corner_rects(map_w_tiles: int):
    """Pixel AABBs [x0,x1)×[y0,y1) that must stay clear for N/W and N/E doors."""
    w = DOOR_CORNER_TILES * TILE
    h = DOOR_CORNER_ROWS * TILE
    map_w = map_w_tiles * TILE
    return [
        (0, w, 0, h),  # NW
        (map_w - w, map_w, 0, h),  # NE
    ]


def aabb_intersects(obj, rect) -> bool:
    x0, x1, y0, y1 = rect
    left, right = obj["x"], obj["x"] + obj["width"]
    top, bottom = obj["y"] - obj["height"], obj["y"]
    return not (right <= x0 or left >= x1 or bottom <= y0 or top >= y1)


def foot_in_rect(obj, rect) -> bool:
    """True if the object's floor contact point sits inside the door footprint."""
    x0, x1, y0, y1 = rect
    cx = obj["x"] + obj["width"] / 2
    fy = obj["y"]  # Tiled tile-object y is bottom edge
    return x0 <= cx < x1 and y0 <= fy < y1


def is_wall_hanging(name: str) -> bool:
    return (
        name.startswith("picture")
        or name.startswith("chalkboard")
        or name.startswith("hospital_chart_board")
        or name in ("chart", "chart2")
    )


def is_aesthetic_prop(name: str) -> bool:
    """Props that are fine in the bottom 2 rows (may be partly covered)."""
    return (
        is_floor_plant(name)
        or name.startswith("lamp-stand")
        or name.startswith("bin")
        or name.startswith("plant-flat-pot")
        or name.startswith("office-misc-smallplant")
        or name.startswith("sanitizer_stand")
        or is_desk_plant_large(name)
    )


def is_floor_plant(name: str) -> bool:
    """Interactive floor plants (bump animation)."""
    return (
        name.startswith("plant-large11")
        or name.startswith("plant-large12")
        or name.startswith("plant-large13")
    )


def is_desk_plant_large(name: str) -> bool:
    """Non-interactive plant-large variants that belong on desks."""
    if not name.startswith("plant-large"):
        return False
    if is_floor_plant(name) or "displacement" in name:
        return False
    return True


def load_json(path: Path):
    with open(path) as f:
        return json.load(f)


CATALOG = load_json(REF_DIR / "catalog.json")
TILESETS = load_json(REF_DIR / "tilesets_ref.json")
TEMPLATES = load_json(REF_DIR / "templates.json")


def lookup(kind: str, name: str) -> dict:
    pool = CATALOG[kind]
    if name not in pool:
        # fuzzy: exact prefix match preferring shortest
        matches = [k for k in pool if k == name or k.startswith(name)]
        if not matches:
            raise KeyError(f"Unknown {kind} '{name}'. Close: {[k for k in pool if name.split('-')[0] in k][:8]}")
        name = sorted(matches, key=len)[0]
    return pool[name]


def make_obj(kind: str, name: str, x: float, y: float, obj_id: int) -> dict:
    info = lookup(kind, name)
    return {
        "gid": info["gid"],
        "height": info["h"],
        "id": obj_id,
        "name": "",
        "rotation": 0,
        "type": "",
        "visible": True,
        "width": info["w"],
        "x": round(x, 3),
        "y": round(y, 3),
    }


def place_on_table(
    table: dict,
    item_name: str,
    *,
    x_frac: float,
    surface_frac: float,
    obj_id: int,
) -> dict:
    """
    Place an object on a table's surface.

    x_frac: 0 = left edge of table, 1 = right edge (item left aligned via center).
    surface_frac: 0 = top of table sprite (back of top), 1 = bottom (legs).
                  Use ~0.15–0.50 for tabletop.
    """
    info = lookup("objects", item_name)
    tw, th = table["width"], table["height"]
    # Center the item horizontally at x_frac
    x = table["x"] + x_frac * tw - info["w"] / 2
    # Item bottom Y from table sprite top
    item_bottom = (table["y"] - th) + surface_frac * th
    return make_obj("objects", item_name, x, item_bottom, obj_id)


def object_layer(name: str, layer_id: int, objects: list) -> dict:
    return {
        "draworder": "topdown",
        "id": layer_id,
        "name": name,
        "objects": objects,
        "opacity": 1,
        "type": "objectgroup",
        "visible": True,
        "x": 0,
        "y": 0,
    }


def tile_layer(name: str, layer_id: int, width: int, height: int, data: list, visible=True) -> dict:
    return {
        "data": data,
        "height": height,
        "id": layer_id,
        "name": name,
        "opacity": 1,
        "type": "tilelayer",
        "visible": visible,
        "width": width,
        "x": 0,
        "y": 0,
    }


ROOM6_FIRSTGID = 701
ROOM6_SHEET_COLS = 10


def room6_floor(width: int, height: int) -> list[int]:
    """Fill the room layer with room6 tiles (same pattern as room_servers)."""
    return [
        ROOM6_FIRSTGID + y * ROOM6_SHEET_COLS + x
        for y in range(height)
        for x in range(width)
    ]


def room6_hall_floor(width: int, height: int) -> list[int]:
    """
    room6 fill for a shallow through-corridor (e.g. a 2×1-GU hallway).

    A full room is tall enough that its last tile row lands on room6's own
    bottom row (the south-wall band). A hallway is only a few rows deep, so a
    naive top-to-bottom fill would leave a plain floor row along the south edge
    with no wall. Here the top rows keep room6's back-wall band and the bottom
    row is pinned to room6's south-wall row (the bottom of the source sheet);
    the collision walls layer carries the matching office south wall (91–100).
    """
    src_rows = list(range(height - 1)) + [ROOM6_SHEET_COLS - 1]  # last = room6 bottom row
    return [
        ROOM6_FIRSTGID + r * ROOM6_SHEET_COLS + x
        for r in src_rows
        for x in range(width)
    ]


def place_ward_posters(items: list, oid: int, placements: list[tuple[str, float, float]]) -> int:
    """Hang medical chart posters (same assets as room_hospital_ward) on the back wall."""
    for name, x, y in placements:
        items.append(make_obj("objects", name, x, y, oid))
        oid += 1
    return oid


def room_tilesets(name: str) -> list[dict]:
    """
    Hospital rooms use room_hospital.png, a clinical recolour of room6 with the
    same tile layout (see room_gen/make_hospital_tileset.py), so only the
    tileset's name/texture key and image change; gids stay on ROOM6_FIRSTGID.
    """
    tilesets = copy.deepcopy(TILESETS)
    if name.startswith("room_hospital"):
        for ts in tilesets:
            if ts.get("name") == "room6":
                ts["name"] = "room_hospital"
                ts["image"] = ts["image"].replace("room6.png", "room_hospital.png")
    return tilesets


def build_room(
    *,
    name: str,
    template_key: str,
    tables: list[dict],
    items: list[dict],
    table_items: list[dict],
    conditional_items: list[dict],
    conditional_table_items: list[dict],
    use_room6: bool = False,
    room_override: list[int] | None = None,
) -> dict:
    tmpl = TEMPLATES[template_key]
    w, h = tmpl["width"], tmpl["height"]
    if room_override is not None:
        room_data = list(room_override)
    elif use_room6:
        room_data = room6_floor(w, h)
    else:
        room_data = list(tmpl["room"])

    layers = [
        tile_layer("walls", 10, w, h, list(tmpl["walls"])),
        tile_layer("room", 1, w, h, room_data),
        tile_layer("doors", 3, w, h, list(tmpl["doors"]), visible=False),
        object_layer("tables", 4, tables),
        object_layer("items", 5, items),
        object_layer("conditional_items", 7, conditional_items),
        object_layer("conditional_table_items", 11, conditional_table_items),
        object_layer("table_items", 12, table_items),
        object_layer("Object Layer 1", 13, []),
    ]

    next_oid = 1
    for layer in layers:
        for obj in layer.get("objects", []):
            next_oid = max(next_oid, obj["id"] + 1)

    return {
        "compressionlevel": -1,
        "editorsettings": {
            "export": {
                "format": "json",
                "target": f"{name}.json",
            }
        },
        "height": h,
        "infinite": False,
        "layers": layers,
        "nextlayerid": 14,
        "nextobjectid": next_oid,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.11.2",
        "tileheight": TILE,
        "tilesets": room_tilesets(name),
        "tilewidth": TILE,
        "type": "map",
        "version": "1.10",
        "width": w,
    }


def export_json_with_tiled(tmj_path: Path, json_path: Path) -> bool:
    """Export map JSON via Tiled CLI with --embed-tilesets. Returns True on success."""
    if not TILED_BIN.is_file():
        print(f"  Tiled not found at {TILED_BIN} — writing JSON copy fallback")
        return False

    cmd = [
        str(TILED_BIN),
        # AppImages need FUSE, which is unavailable in some sandboxes; extracting
        # first works everywhere and costs a little startup time.
        *(["--appimage-extract-and-run"] if TILED_BIN.name.endswith("AppImage") else []),
        "--embed-tilesets",
        "--export-map",
        "json",
        str(tmj_path),
        str(json_path),
    ]
    env = os.environ.copy()
    # AppImage ships xcb only (no offscreen). Prefer existing DISPLAY.
    if env.get("QT_QPA_PLATFORM") == "offscreen":
        env.pop("QT_QPA_PLATFORM", None)
    env.setdefault("QT_QPA_PLATFORM", "xcb")
    try:
        result = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            env=env,
            timeout=120,
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        print(f"  Tiled export failed ({e}) — writing JSON copy fallback")
        return False

    if result.returncode != 0 or not json_path.is_file():
        err = (result.stderr or result.stdout or "").strip()
        print(f"  Tiled export failed (exit {result.returncode}): {err[:300]}")
        return False

    print(f"  Exported {json_path.name} via Tiled --embed-tilesets")
    return True


def write_room(room: dict, stem: str):
    """Write .tmj, then export game-ready .json with Tiled --embed-tilesets."""
    tmj_path = ROOMS_DIR / f"{stem}.tmj"
    json_path = ROOMS_DIR / f"{stem}.json"

    with open(tmj_path, "w") as f:
        json.dump(room, f, indent=1)
        f.write("\n")

    if not export_json_with_tiled(tmj_path, json_path):
        # Fallback: maps already carry embedded tilesets from the reference set
        with open(json_path, "w") as f:
            json.dump(room, f, indent=1)
            f.write("\n")
        print(f"Wrote {tmj_path.name} and {json_path.name} (fallback copy)")
    else:
        print(f"Wrote {tmj_path.name}")


# ---------------------------------------------------------------------------
# Room definitions
# ---------------------------------------------------------------------------

def room_small_office_4():
    """
    1×1 GU (5×6): desk on the LEFT wall, chair south of desk, bookcase right,
    picture on clear back wall. Distinct from rooms 1–3.
    """
    oid = 1

    # desk3 — clear of NW door footprint (x 0–64, y 0–96)
    desk = make_obj("tables", "desk3", 64.0, 100.0, oid)
    oid += 1
    tables = [desk]

    items = []
    # Picture on clear mid back-wall (between NW and NE door footprints)
    items.append(make_obj("objects", "picture5", 72.0, 34.0, oid)); oid += 1
    # Bookcase — keep feet above bottom 2 rows (y < 128 on 5×6)
    items.append(make_obj("objects", "bookcase", 100.0, 120.0, oid)); oid += 1
    # chair south of desk
    items.append(make_obj("objects", "chair-white-1-rotate2", 72.0, 124.0, oid)); oid += 1
    items.append(make_obj("objects", "bin3", 110.0, 125.0, oid)); oid += 1

    table_items = [
        place_on_table(desk, "office-misc-lamp3", x_frac=0.18, surface_frac=0.18, obj_id=oid),
    ]
    oid += 1
    table_items.append(
        place_on_table(desk, "office-misc-smallplant5", x_frac=0.82, surface_frac=0.16, obj_id=oid)
    )
    oid += 1
    table_items.append(
        place_on_table(desk, "plant-flat-pot4", x_frac=0.08, surface_frac=0.22, obj_id=oid)
    )
    oid += 1
    table_items.append(
        place_on_table(desk, "plant-large6", x_frac=0.45, surface_frac=0.14, obj_id=oid)
    )
    oid += 1

    conditional_items = []
    # Keep feet above bottom 2 rows (y < 128 on 5×6)
    for name, x, y in [
        ("bag18", 36.0, 118.0),
        ("bag24", 55.0, 125.0),
        ("suitcase8", 36.0, 105.0),
        ("briefcase11", 100.0, 125.0),
        ("safe4", 115.0, 110.0),
        ("fingerprint-brush-red", 80.0, 50.0),
    ]:
        conditional_items.append(make_obj("objects", name, x, y, oid)); oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("pc5", 0.60, 0.30),
        ("phone4", 0.90, 0.28),
        ("notes1", 0.28, 0.45),
        ("notes2", 0.75, 0.48),
        ("notes3", 0.48, 0.42),
        ("laptop6", 0.20, 0.38),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1

    return build_room(
        name="small_office_room4_1x1gu",
        template_key="5x6",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
    )


def room_security():
    """
    2×2 GU (10×10): security office — dual desks, monitors, chalkboard,
    waiting chairs, filing cabinets along the back.
    """
    oid = 1

    desk_l = make_obj("tables", "desk1", 64.0, 150.0, oid); oid += 1
    desk_r = make_obj("tables", "desk1", 178.0, 150.0, oid); oid += 1
    tables = [desk_l, desk_r]

    items = []
    # Back-wall filing — clear of NW/NE door footprints (x 0–64 and 256–320, y 0–96)
    for x in (68, 96, 124, 198, 226):
        items.append(make_obj("objects", "filing_cabinet", x, 66.0, oid)); oid += 1
    items.append(make_obj("objects", "chalkboard3", 145.0, 70.0, oid)); oid += 1
    # Pictures in clear wall gaps between cabinet groups / chalkboard
    items.append(make_obj("objects", "picture8", 155.0, 42.0, oid)); oid += 1
    items.append(make_obj("objects", "picture12", 178.0, 42.0, oid)); oid += 1

    # Chairs south of desks
    items.append(make_obj("objects", "chair-white-1-rotate2", 86.0, 178.0, oid)); oid += 1
    items.append(make_obj("objects", "chair-white-1-rotate2", 200.0, 178.0, oid)); oid += 1

    # Waiting chairs along left / right walls (above bottom 2 rows: y < 256)
    for y in (190.0, 215.0, 240.0):
        items.append(make_obj("objects", "chair-waiting-right-1", 40.0, y, oid)); oid += 1
        items.append(make_obj("objects", "chair-waiting-left-1", 245.0, y, oid)); oid += 1

    items.append(make_obj("objects", "bin2", 160.0, 175.0, oid)); oid += 1
    # Interactive floor plants (large) — pair on opposite sides; bottom rows OK
    items.append(make_obj("objects", "plant-large11-top-ani1", 40.0, 300.0, oid)); oid += 1
    items.append(make_obj("objects", "plant-large12-top-ani3", 216.0, 300.0, oid)); oid += 1

    table_items = []
    for desk, lamp_xf, cup_xf, plant_xf, large_xf in [
        (desk_l, 0.12, 0.82, 0.95, 0.35),
        (desk_r, 0.88, 0.18, 0.05, 0.65),
    ]:
        table_items.append(
            place_on_table(desk, "office-misc-lamp3", x_frac=lamp_xf, surface_frac=0.16, obj_id=oid)
        )
        oid += 1
        table_items.append(
            place_on_table(desk, "office-misc-cup", x_frac=cup_xf, surface_frac=0.35, obj_id=oid)
        )
        oid += 1
        table_items.append(
            place_on_table(desk, "office-misc-smallplant3", x_frac=plant_xf, surface_frac=0.18, obj_id=oid)
        )
        oid += 1
        # Regular plant-large on desk
        table_items.append(
            place_on_table(desk, "plant-large6", x_frac=large_xf, surface_frac=0.14, obj_id=oid)
        )
        oid += 1

    conditional_items = []
    for name, x, y in [
        ("safe2", 68.0, 100.0),
        ("safe3", 250.0, 100.0),
        ("bag14", 48.0, 210.0),
        ("bag20", 250.0, 220.0),
        ("suitcase6", 55.0, 250.0),
        ("briefcase8", 240.0, 250.0),
        ("fingerprint-brush-red", 155.0, 100.0),
        ("key", 160.0, 55.0),
        ("lockpick", 175.0, 105.0),
    ]:
        conditional_items.append(make_obj("objects", name, x, y, oid)); oid += 1

    conditional_table_items = []
    for desk, pc_xf in [(desk_l, 0.55), (desk_r, 0.45)]:
        conditional_table_items.append(
            place_on_table(desk, "pc5", x_frac=pc_xf, surface_frac=0.28, obj_id=oid)
        )
        oid += 1
        conditional_table_items.append(
            place_on_table(desk, "phone4", x_frac=0.90 if desk is desk_l else 0.10, surface_frac=0.30, obj_id=oid)
        )
        oid += 1
        for notes, xf, sf in [
            ("notes1", 0.22, 0.46),
            ("notes2", 0.48, 0.48),
            ("notes3", 0.72, 0.44),
        ]:
            conditional_table_items.append(
                place_on_table(desk, notes, x_frac=xf, surface_frac=sf, obj_id=oid)
            )
            oid += 1

    return build_room(
        name="room_security",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
    )


def room_lab():
    """
    2×2 GU (10×10): tech / lab workspace — workbenches, PCs, storage, server unit.
    """
    oid = 1

    # Three work desks along mid room (clear of door corner footprints)
    desk_a = make_obj("tables", "desk1", 64.0, 140.0, oid); oid += 1
    desk_b = make_obj("tables", "desk2", 150.0, 140.0, oid); oid += 1
    desk_c = make_obj("tables", "desk1", 210.0, 140.0, oid); oid += 1
    # Side bench
    desk_d = make_obj("tables", "smalldesk1", 64.0, 220.0, oid); oid += 1
    tables = [desk_a, desk_b, desk_c, desk_d]

    items = []
    # Back wall: servers + cabinets + chalkboard — clear of NW/NE door corners
    items.append(make_obj("objects", "servers3", 68.0, 78.0, oid)); oid += 1
    items.append(make_obj("objects", "servers4", 130.0, 78.0, oid)); oid += 1
    items.append(make_obj("objects", "filing_cabinet", 168.0, 70.0, oid)); oid += 1
    items.append(make_obj("objects", "filing_cabinet", 198.0, 70.0, oid)); oid += 1
    items.append(make_obj("objects", "chalkboard2", 210.0, 72.0, oid)); oid += 1
    # Picture in clear gap (avoid chalkboard / cabinets / door corners)
    items.append(make_obj("objects", "picture10", 155.0, 42.0, oid)); oid += 1

    # Chairs at desks
    items.append(make_obj("objects", "chair-white-2-rotate5", 82.0, 168.0, oid)); oid += 1
    items.append(make_obj("objects", "chair-white-2-rotate5", 155.0, 168.0, oid)); oid += 1
    items.append(make_obj("objects", "chair-white-2-rotate5", 230.0, 168.0, oid)); oid += 1
    items.append(make_obj("objects", "chair-white-1-rotate2", 72.0, 248.0, oid)); oid += 1

    items.append(make_obj("objects", "bin8", 185.0, 175.0, oid)); oid += 1
    # Lamp-stands in a vertical line along the west wall
    for y, variant in ((170.0, "lamp-stand3"), (220.0, "lamp-stand4"), (280.0, "lamp-stand3")):
        items.append(make_obj("objects", variant, 36.0, y, oid)); oid += 1
    # Interactive floor plants (large) — pair on opposite sides; bottom rows OK
    items.append(make_obj("objects", "plant-large12-top-ani1", 48.0, 300.0, oid)); oid += 1
    items.append(make_obj("objects", "plant-large11-top-ani3", 208.0, 300.0, oid)); oid += 1

    table_items = []
    for desk, props in [
        (desk_a, [
            ("office-misc-hdd3", 0.15, 0.22),
            ("office-misc-fan", 0.85, 0.20),
            ("office-misc-smallplant3", 0.95, 0.16),
            ("plant-large6", 0.40, 0.14),
        ]),
        (desk_b, [
            ("office-misc-speakers6", 0.25, 0.22),
            ("office-misc-lamp3", 0.80, 0.16),
            ("plant-large4", 0.50, 0.16),
        ]),
        (desk_c, [
            ("office-misc-hdd6", 0.12, 0.24),
            ("office-misc-pencils5", 0.88, 0.18),
            ("office-misc-smallplant5", 0.05, 0.16),
            ("plant-large8", 0.55, 0.12),
        ]),
        (desk_d, [
            ("office-misc-cup5", 0.70, 0.30),
            ("office-misc-lamp", 0.25, 0.18),
            ("plant-flat-pot2", 0.90, 0.20),
        ]),
    ]:
        for name, xf, sf in props:
            table_items.append(place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid))
            oid += 1

    conditional_items = []
    for name, x, y in [
        ("safe5", 250.0, 105.0),
        ("bag7", 48.0, 200.0),
        ("bag12", 250.0, 210.0),
        ("suitcase12", 260.0, 180.0),
        ("briefcase-red-1", 110.0, 250.0),
        ("fingerprint-brush-red", 200.0, 100.0),
        ("lab-workstation", 230.0, 250.0),
    ]:
        try:
            conditional_items.append(make_obj("objects", name, x, y, oid)); oid += 1
        except KeyError as e:
            print(f"  skip conditional {name}: {e}")

    conditional_table_items = []
    for desk, props in [
        (desk_a, [("pc5", 0.65, 0.28), ("notes1", 0.20, 0.46), ("laptop6", 0.85, 0.38)]),
        (desk_b, [("pc11", 0.50, 0.30), ("notes2", 0.20, 0.45), ("phone4", 0.85, 0.32)]),
        (desk_c, [("pc12", 0.40, 0.28), ("notes3", 0.75, 0.44), ("laptop1", 0.15, 0.36)]),
        (desk_d, [("notes1", 0.55, 0.42), ("notes4", 0.30, 0.48)]),
    ]:
        for name, xf, sf in props:
            conditional_table_items.append(
                place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
            )
            oid += 1

    return build_room(
        name="room_lab",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
    )


WALL_TOP_PX = 12        # top of the back-wall band in the room art
WALL_FRAME_PX = 12      # white-and-black frame round the room edge (x or y 0-11)
WALL_BASE_PX = 61       # skirting starts here: wall hangings end above it
FLOOR_TOP_PX = 66       # first floor pixel row under the back wall (hospital tileset)
SIDE_WALL_PX = 24       # floor furniture should not lean further onto the side walls
FOOTPRINT_PX = 12       # bottom strip of a floor sprite treated as its floor contact


def is_wall_mounted(name: str) -> bool:
    """Things fixed to a wall: inside the back-wall band or on a side-wall strip."""
    return (
        (is_wall_hanging(name) and not name.startswith("chalkboard"))
        or name.startswith("notes")
        or name in ("office-misc-clock", "smartscreen", "alarm_panel", "emergency-button", "thermometer")
        or name.rstrip("0123456789") in WALL_MOUNTED_EXTRAS
    )


# PixelLab hospital extras (tileset objects/hospital_extras) that hang on a wall
WALL_MOUNTED_EXTRAS = {
    "first_aid_cabinet", "sanitiser_dispenser", "rota_board", "xray_lightbox",
    "fire_alarm_point", "exit_sign", "eye_chart",
    "hot_water_boiler", "soap_dispenser", "notice_board", "directory_sign",
    "whiteboard",
    "key_cabinet",
    "plaque",
    "power_panel",
    "health_poster",
    "leaflet_holder",
    "wall_clock",
    "bedhead_panel",
    "ppe_dispenser",
    "fire_action_notice",
    "comms_cabinet",
    "no_smoking_sign",
}


def sprite_bounds_warnings(room: dict, layers: dict, gid_to_name: dict) -> list[str]:
    """
    Catch what reads as broken in a render: sprites past the map edge, floor
    objects standing on the back wall, wall art hanging off the wall band,
    furniture pushed into the side walls, and overlapping footprints.
    """
    warnings = []
    map_w, map_h = room["width"] * TILE, room["height"] * TILE
    floor_objs, wall_objs = [], []
    for lname in ("tables", "items", "conditional_items"):
        for o in layers[lname].get("objects", []):
            if not o.get("gid"):
                continue
            n = gid_to_name.get(o["gid"], f"gid{o['gid']}")
            left, right = o["x"], o["x"] + o["width"]
            top, bottom = o["y"] - o["height"], o["y"]
            label = f"{n} (#{o['id']} {lname})"
            if left < 0 or right > map_w or top < 0 or bottom > map_h:
                warnings.append(f"{label} extends off the map ({left:.0f},{top:.0f})-({right:.0f},{bottom:.0f})")
            if is_wall_mounted(n):
                on_back = top >= WALL_TOP_PX - 4 and bottom <= FLOOR_TOP_PX + 2
                on_side = left < SIDE_WALL_PX + 4 or right > map_w - SIDE_WALL_PX - 4
                if not (on_back or on_side):
                    warnings.append(f"{label} is off the walls (y {top:.0f}-{bottom:.0f}, x {left:.0f}-{right:.0f})")
                # hangings sit on the wall face: inside the frame, above the skirting
                if (top < WALL_FRAME_PX or left < WALL_FRAME_PX or right > map_w - WALL_FRAME_PX
                        or bottom > map_h - WALL_FRAME_PX):
                    warnings.append(f"{label} overlaps the wall frame ({left:.0f},{top:.0f})-({right:.0f},{bottom:.0f})")
                elif on_back and not on_side and bottom > WALL_BASE_PX:
                    warnings.append(f"{label} hangs over the skirting (bottom y={bottom:.0f} > {WALL_BASE_PX})")
                corner = DOOR_CORNER_TILES * TILE
                if on_back and not on_side and (left < corner or right > map_w - corner):
                    warnings.append(f"{label} on the back wall where a N door is drawn (x {left:.0f}-{right:.0f})")
                wall_objs.append((label, left, right, top, bottom))
                continue
            if bottom < FLOOR_TOP_PX - 6:
                warnings.append(f"{label} stands on the back wall (foot y={bottom:.0f} < {FLOOR_TOP_PX})")
            if top < WALL_FRAME_PX:
                warnings.append(f"{label} overlaps the wall frame (top y={top:.0f})")
            # wall safes may sit on a side wall; floor plants lean by design
            if not (is_floor_plant(n) or n.startswith("safe")) and (left < SIDE_WALL_PX or right > map_w - SIDE_WALL_PX):
                warnings.append(f"{label} pushed into a side wall (x {left:.0f}-{right:.0f})")
            foot_top = bottom - min(FOOTPRINT_PX, o["height"])
            floor_objs.append((label, left, right, foot_top, bottom))

    def overlap(a, b, slack):
        return (min(a[2], b[2]) - max(a[1], b[1]) > slack
                and min(a[4], b[4]) - max(a[3], b[3]) > slack)

    for i, a in enumerate(floor_objs):
        for b in floor_objs[i + 1:]:
            if overlap(a, b, 2):
                warnings.append(f"footprints overlap: {a[0]} / {b[0]}")
    for i, a in enumerate(wall_objs):
        for b in wall_objs[i + 1:]:
            if overlap(a, b, 1):
                warnings.append(f"wall items overlap: {a[0]} / {b[0]}")
    return warnings


def validate_room(room: dict, stem: str):
    """Basic structural + table-surface checks."""
    layers = {l["name"]: l for l in room["layers"]}
    required = [
        "walls", "room", "doors", "tables", "items",
        "conditional_items", "table_items", "conditional_table_items",
    ]
    missing = [n for n in required if n not in layers]
    if missing:
        raise SystemExit(f"{stem}: missing layers {missing}")

    # Valid GIDs: for image tilesets use contiguous range; for collection
    # tilesets (sparse ids) use firstgid + each tile id.
    valid_gids = set()
    for ts in room["tilesets"]:
        fg = ts["firstgid"]
        tiles = ts.get("tiles")
        if tiles:
            for t in tiles:
                valid_gids.add(fg + t["id"])
        else:
            tc = ts.get("tilecount") or 1
            valid_gids.update(range(fg, fg + tc))

    def gid_ok(gid):
        return gid in valid_gids

    bad = []
    for lname, layer in layers.items():
        for obj in layer.get("objects", []):
            gid = obj.get("gid", 0)
            if gid and not gid_ok(gid):
                bad.append((lname, obj["id"], gid))
    if bad:
        raise SystemExit(f"{stem}: bad GIDs {bad[:10]}")

    # Surface check — match each item to the nearest table by Y among x-overlapping desks
    table_objs = layers["tables"]["objects"]
    warnings = []

    def nearest_table(item):
        icx = item["x"] + item["width"] / 2
        best, best_score = None, 1e9
        for t in table_objs:
            if not (t["x"] - 12 <= icx <= t["x"] + t["width"] + 12):
                continue
            mid = t["y"] - t["height"] / 2
            score = abs(item["y"] - mid)
            if score < best_score:
                best, best_score = t, score
        return best

    for lname in ("table_items", "conditional_table_items"):
        for item in layers[lname]["objects"]:
            t = nearest_table(item)
            if not t:
                warnings.append(f"item {item['id']} on {lname} not over any table")
                continue
            above = t["y"] - item["y"]
            frac = (item["y"] - (t["y"] - t["height"])) / t["height"]
            if above <= 0:
                warnings.append(f"item {item['id']} at/below table legs (above={above:.1f})")
            elif frac > 0.60:
                warnings.append(f"item {item['id']} may be on legs (frac_from_top={frac:.2f})")
            elif frac < -0.05:
                warnings.append(f"item {item['id']} may float above desk (frac_from_top={frac:.2f})")

    # Prop-policy checks
    gid_to_name = {}
    for kind in ("objects", "tables"):
        for name, info in CATALOG[kind].items():
            gid_to_name[info["gid"]] = name
    # Hand-made maps can embed differently numbered collection tilesets, so
    # names from the map's own tiles win over the catalog's gids.
    for ts in room["tilesets"]:
        for t in ts.get("tiles", []):
            if "image" in t:
                gid_to_name[ts["firstgid"] + t["id"]] = Path(t["image"]).stem

    def names_in(layer_name):
        return [gid_to_name.get(o["gid"], f"gid{o['gid']}") for o in layers[layer_name].get("objects", [])]

    banned_kb_prefix = "keyboard"
    floor_layers = ("items", "conditional_items")
    desk_layers = ("table_items", "conditional_table_items")

    for lname in floor_layers:
        for n in names_in(lname):
            if n == "pc" or (n.startswith("pc") and len(n) > 2 and n[2].isdigit()):
                warnings.append(f"PC on floor layer {lname}: {n}")
            if n.startswith("plant-flat-pot") or n.startswith("office-misc-smallplant"):
                warnings.append(f"small plant on floor layer {lname}: {n}")

    for lname in desk_layers + floor_layers:
        for n in names_in(lname):
            if n.startswith(banned_kb_prefix):
                warnings.append(f"keyboard sprite not allowed ({n} on {lname})")

    # lamp-stand: require 2+ in a line when present
    # floor plants 11/12/13: require 2+ when present; line-up optional (they're large)
    lamp_positions = []
    floor_plant_count = 0
    for lname in floor_layers:
        for o in layers[lname].get("objects", []):
            n = gid_to_name.get(o["gid"], "")
            if n.startswith("lamp-stand"):
                lamp_positions.append((o["x"], o["y"]))
            elif is_floor_plant(n):
                floor_plant_count += 1

    if len(lamp_positions) == 1:
        warnings.append("only one lamp-stand — place 2+ in a line")
    elif len(lamp_positions) >= 2:
        xs = [p[0] for p in lamp_positions]
        ys = [p[1] for p in lamp_positions]
        same_x = max(xs) - min(xs) <= 8
        same_y = max(ys) - min(ys) <= 8
        if not (same_x or same_y):
            warnings.append("lamp-stand placements not in a line (vary both X and Y)")

    if floor_plant_count == 1:
        warnings.append("only one floor plant-large11/12/13 — prefer 2+")

    # Desk-only plant-large must not be on floor; floor plants must be 11/12/13
    for lname in floor_layers:
        for n in names_in(lname):
            if is_desk_plant_large(n):
                warnings.append(f"desk plant-large on floor ({n} on {lname}) — use plant-large11/12/13*")
    for lname in desk_layers:
        for n in names_in(lname):
            if is_floor_plant(n):
                warnings.append(f"interactive floor plant on desk ({n} on {lname})")

    # Door corner clearance — object feet must not sit in WD/WD/DF footprints.
    # Wall hangings (pictures/chalkboards) are allowed on the back wall band.
    corners = door_corner_rects(room["width"])
    for lname in ("tables", "items", "conditional_items"):
        for o in layers[lname].get("objects", []):
            n = gid_to_name.get(o["gid"], f"id{o['id']}")
            # wall items get their own N-door warning in sprite_bounds_warnings
            if is_wall_hanging(n) or is_wall_mounted(n):
                continue
            for i, rect in enumerate(corners):
                if foot_in_rect(o, rect):
                    corner = "NW" if i == 0 else "NE"
                    warnings.append(f"{n} foot in {corner} door footprint on {lname}")

    # Hospital rooms carry no plants at all (floor or desk).
    if stem.startswith("room_hospital"):
        for lname in desk_layers + floor_layers:
            for n in names_in(lname):
                if is_floor_plant(n) or is_desk_plant_large(n) or n.startswith(
                    ("plant-flat-pot", "office-misc-smallplant")
                ):
                    warnings.append(f"plant in a hospital room ({n} on {lname})")

    # Bottom 2 tile rows may be obscured by a southern neighbour.
    # Aesthetic props (plants, lamps, bins) are allowed there.
    # Corridors (6 rows) bake their own south wall and nothing covers them, so
    # only that wall row is off limits there.
    bottom_rows = 1 if room["height"] <= 6 else 2
    bottom_y0 = (room["height"] - bottom_rows) * TILE
    for lname in ("tables", "items", "conditional_items"):
        for o in layers[lname].get("objects", []):
            if o["y"] < bottom_y0:
                continue
            n = gid_to_name.get(o["gid"], f"id{o['id']}")
            if is_aesthetic_prop(n):
                continue
            warnings.append(
                f"{n} foot in bottom 2 rows on {lname} (y={o['y']:.0f} >= {bottom_y0})"
            )

    warnings += sprite_bounds_warnings(room, layers, gid_to_name)

    n_objs = sum(
        len(layers[n].get("objects", []))
        for n in required
        if layers[n].get("type") == "objectgroup"
    )
    print(f"  validate {stem}: OK ({n_objs} objs)")
    for w in warnings:
        print(f"    WARN: {w}")
    return warnings


def room_hospital_office():
    """
    2×2 GU (10×10) hospital admin office on room6 tiles — grey clinical walls,
    hospital desks, medical cabinets, chart boards, sanitizer, crash cart.
    """
    oid = 1

    desk_l = make_obj("tables", "hospital_desk1", 64.0, 150.0, oid)
    oid += 1
    desk_r = make_obj("tables", "hospital_desk2", 178.0, 150.0, oid)
    oid += 1
    tables = [desk_l, desk_r]

    items = []
    # Medical cabinets along clear mid back-wall (avoid NW/NE door footprints)
    for x in (72, 126, 180):
        items.append(make_obj("objects", "medical_cabinet1", x, 70.0, oid))
        oid += 1
    items.append(make_obj("objects", "medical_cabinet2", 220.0, 70.0, oid))
    oid += 1

    # Chart boards on clear back wall
    items.append(make_obj("objects", "hospital_chart_board1", 150.0, 48.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chart_board2", 100.0, 48.0, oid))
    oid += 1
    # Ward medical posters
    oid = place_ward_posters(
        items,
        oid,
        [
            ("chart2", 80.0, 42.0),
            ("chart", 175.0, 44.0),
            ("chart2", 205.0, 42.0),
            ("chart", 235.0, 48.0),
        ],
    )

    # Chairs south of desks
    items.append(make_obj("objects", "hospital_chair1", 86.0, 178.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair2", 200.0, 178.0, oid))
    oid += 1

    # Waiting chairs along side walls (above bottom 2 rows: y < 256)
    for y in (200.0, 230.0):
        items.append(make_obj("objects", "hospital_chair1", 40.0, y, oid))
        oid += 1
        items.append(make_obj("objects", "hospital_chair2", 250.0, y, oid))
        oid += 1

    items.append(make_obj("objects", "crash_cart1", 145.0, 220.0, oid))
    oid += 1
    items.append(make_obj("objects", "sanitizer_stand1", 120.0, 175.0, oid))
    oid += 1
    items.append(make_obj("objects", "sanitizer_stand2", 175.0, 175.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin2", 160.0, 190.0, oid))
    oid += 1

    # No plants in hospital rooms (the validator warns on any)
    table_items = []
    for desk, lamp_xf in [
        (desk_l, 0.14),
        (desk_r, 0.86),
    ]:
        table_items.append(
            place_on_table(desk, "office-misc-lamp3", x_frac=lamp_xf, surface_frac=0.18, obj_id=oid)
        )
        oid += 1

    conditional_items = [
        make_obj("objects", "safe4", 250.0, 120.0, oid),
    ]
    oid += 1
    conditional_items.append(make_obj("objects", "filing_cabinet", 68.0, 120.0, oid))
    oid += 1

    conditional_table_items = []
    for desk, pc_xf, notes_xf, phone_xf in [
        (desk_l, 0.55, 0.28, 0.90),
        (desk_r, 0.45, 0.72, 0.10),
    ]:
        conditional_table_items.append(
            place_on_table(desk, "pc5", x_frac=pc_xf, surface_frac=0.32, obj_id=oid)
        )
        oid += 1
        conditional_table_items.append(
            place_on_table(desk, "notes1", x_frac=notes_xf, surface_frac=0.45, obj_id=oid)
        )
        oid += 1
        conditional_table_items.append(
            place_on_table(desk, "phone4", x_frac=phone_xf, surface_frac=0.30, obj_id=oid)
        )
        oid += 1

    return build_room(
        name="room_hospital_office",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


def room_hospital_cto_office():
    """
    1×1 GU (5×6) smaller hospital CTO/doctor office on room6 — desk, cabinet,
    chart board, sanitizer. Suited to Dr. Kim-style rooms.
    """
    oid = 1

    desk = make_obj("tables", "hospital_desk1", 64.0, 100.0, oid)
    oid += 1
    tables = [desk]

    items = []
    items.append(make_obj("objects", "hospital_chart_board1", 72.0, 40.0, oid))
    oid += 1
    oid = place_ward_posters(
        items,
        oid,
        [
            ("chart2", 48.0, 38.0),
            ("chart", 100.0, 42.0),
        ],
    )
    items.append(make_obj("objects", "medical_cabinet1", 54.0, 70.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair2", 72.0, 124.0, oid))
    oid += 1
    items.append(make_obj("objects", "sanitizer_stand1", 40.0, 110.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin3", 120.0, 125.0, oid))
    oid += 1

    table_items = [
        place_on_table(desk, "office-misc-lamp3", x_frac=0.16, surface_frac=0.18, obj_id=oid),
    ]
    oid += 1

    conditional_items = [
        make_obj("objects", "safe4", 115.0, 110.0, oid),
    ]
    oid += 1
    conditional_items.append(make_obj("objects", "crash_cart2", 36.0, 125.0, oid))
    oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("pc5", 0.55, 0.32),
        ("notes1", 0.28, 0.45),
        ("phone4", 0.88, 0.28),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1

    return build_room(
        name="room_hospital_cto_office",
        template_key="5x6",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


def room_hospital_reception():
    """
    2×2 GU hospital reception on room6 — wide desk, waiting chairs, sanitizers,
    chart boards. Hospital-themed stand-in for room_reception.
    """
    oid = 1

    desk = make_obj("tables", "reception_table1", 72.0, 110.0, oid)
    oid += 1
    tables = [desk]

    items = []
    # Chart boards / pictures on clear mid back-wall
    items.append(make_obj("objects", "hospital_chart_board1", 140.0, 46.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chart_board2", 100.0, 46.0, oid))
    oid += 1
    items.append(make_obj("objects", "picture11", 190.0, 48.0, oid))
    oid += 1
    oid = place_ward_posters(
        items,
        oid,
        [
            ("chart2", 78.0, 42.0),
            ("chart", 165.0, 44.0),
            ("chart2", 220.0, 42.0),
            ("chart", 245.0, 50.0),
        ],
    )

    # Medical cabinets flanking clear mid-wall (avoid NW/NE door footprints)
    items.append(make_obj("objects", "medical_cabinet1", 72.0, 78.0, oid))
    oid += 1
    items.append(make_obj("objects", "medical_cabinet2", 210.0, 78.0, oid))
    oid += 1

    # Waiting chairs in two facing rows (above bottom 2 rows: y < 256)
    for y in (200.0, 230.0):
        items.append(make_obj("objects", "hospital_chair1", 80.0, y, oid))
        oid += 1
        items.append(make_obj("objects", "hospital_chair2", 160.0, y, oid))
        oid += 1

    items.append(make_obj("objects", "sanitizer_stand1", 120.0, 130.0, oid))
    oid += 1
    items.append(make_obj("objects", "sanitizer_stand2", 200.0, 130.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin2", 250.0, 120.0, oid))
    oid += 1

    # Lamp stands in a line (validator prefers 2+)

    table_items = [
        place_on_table(desk, "office-misc-lamp4", x_frac=0.08, surface_frac=0.22, obj_id=oid),
    ]
    oid += 1
    table_items.append(
        place_on_table(desk, "office-misc-lamp4", x_frac=0.92, surface_frac=0.22, obj_id=oid)
    )
    oid += 1
    table_items.append(
        place_on_table(desk, "phone1", x_frac=0.65, surface_frac=0.35, obj_id=oid)
    )
    oid += 1

    conditional_items = [
        make_obj("objects", "safe2", 250.0, 150.0, oid),
    ]
    oid += 1
    conditional_items.append(make_obj("objects", "safe3", 68.0, 150.0, oid))
    oid += 1
    conditional_items.append(make_obj("objects", "crash_cart2", 250.0, 220.0, oid))
    oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("pc10", 0.35, 0.32),
        ("laptop6", 0.50, 0.38),
        ("notes1", 0.42, 0.48),
        ("notes3", 0.58, 0.45),
        ("phone4", 0.75, 0.35),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1

    return build_room(
        name="room_hospital_reception",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


def room_hospital_meeting():
    """
    2×2 GU hospital conference / press room on room6 — dual desks, hospital
    chairs, chart boards, sanitizer. Hospital-themed stand-in for room_meeting.
    """
    oid = 1

    desk_a = make_obj("tables", "hospital_desk1", 80.0, 160.0, oid)
    oid += 1
    desk_b = make_obj("tables", "hospital_desk2", 160.0, 160.0, oid)
    oid += 1
    tables = [desk_a, desk_b]

    items = []
    # Presentation wall
    items.append(make_obj("objects", "smartscreen", 136.0, 55.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chart_board1", 90.0, 48.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chart_board2", 200.0, 48.0, oid))
    oid += 1
    oid = place_ward_posters(
        items,
        oid,
        [
            ("chart2", 70.0, 42.0),
            ("chart", 120.0, 44.0),
            ("chart2", 180.0, 42.0),
            ("chart", 230.0, 48.0),
        ],
    )

    # Chairs around conference desks — face the table (N/S)
    # South of desks → face north; north of desks → face south
    items.append(make_obj("objects", "hospital_chair_north", 100.0, 190.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair_north", 180.0, 190.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair_south", 100.0, 130.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair_south", 180.0, 130.0, oid))
    oid += 1

    # Side waiting chairs (east/west facing)
    for y in (210.0, 235.0):
        items.append(make_obj("objects", "hospital_chair1", 40.0, y, oid))
        oid += 1
        items.append(make_obj("objects", "hospital_chair2", 250.0, y, oid))
        oid += 1

    items.append(make_obj("objects", "sanitizer_stand1", 130.0, 185.0, oid))
    oid += 1
    items.append(make_obj("objects", "sanitizer_stand2", 175.0, 185.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin2", 145.0, 175.0, oid))
    oid += 1


    table_items = []
    for desk, lamp_xf, plant_xf in [
        (desk_a, 0.12, 0.88),
        (desk_b, 0.88, 0.12),
    ]:
        table_items.append(
            place_on_table(desk, "office-misc-lamp3", x_frac=lamp_xf, surface_frac=0.18, obj_id=oid)
        )
        oid += 1
        table_items.append(
            place_on_table(desk, "office-misc-pencils5", x_frac=plant_xf, surface_frac=0.30, obj_id=oid)
        )
        oid += 1

    conditional_items = [
        make_obj("objects", "safe2", 240.0, 100.0, oid),
    ]
    oid += 1
    conditional_items.append(make_obj("objects", "safe3", 68.0, 100.0, oid))
    oid += 1
    conditional_items.append(make_obj("objects", "tablet", 100.0, 55.0, oid))
    oid += 1
    conditional_items.append(make_obj("objects", "tablet", 200.0, 55.0, oid))
    oid += 1

    conditional_table_items = []
    for desk, xf_notes, xf_laptop in [
        (desk_a, 0.40, 0.60),
        (desk_b, 0.60, 0.40),
    ]:
        conditional_table_items.append(
            place_on_table(desk, "notes1", x_frac=xf_notes, surface_frac=0.45, obj_id=oid)
        )
        oid += 1
        conditional_table_items.append(
            place_on_table(desk, "laptop6", x_frac=xf_laptop, surface_frac=0.35, obj_id=oid)
        )
        oid += 1

    return build_room(
        name="room_hospital_meeting",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


def room_hospital_servers():
    """
    2×2 GU hospital server / infrastructure room on room6 — server racks plus
    a hospital admin desk. Hospital-themed stand-in for room_servers.
    """
    oid = 1

    # Admin desk mid-south of racks (clear of door corners)
    desk = make_obj("tables", "hospital_desk1", 140.0, 200.0, oid)
    oid += 1
    # Side table for the backup/recovery console (m02 backup_recovery object)
    console_table = make_obj("tables", "smalldesk2", 210.0, 204.0, oid)
    oid += 1
    tables = [desk, console_table]

    items = []
    # Back row of racks along the clear mid back wall (x 72-254; both back-wall
    # corners carry N doors), glass-door and mesh-door racks alternating, with the
    # room's air-conditioning unit standing at the end of the row
    for i, name in enumerate(["server_rack1", "server_rack2", "server_rack1",
                              "server_rack2", "server_rack1"]):
        items.append(make_obj("objects", name, 72.0 + 30 * i, 82.0, oid))
        oid += 1
    items.append(make_obj("objects", "aircon_unit1", 222.0, 82.0, oid))
    oid += 1

    # The racks fill the back wall, so wall art would only peek out behind them;
    # a temperature sensor goes on the west side wall between the W door slots.
    items.append(make_obj("objects", "thermometer", 13.0, 150.0, oid))
    oid += 1

    items.append(make_obj("objects", "hospital_chair_north", 162.0, 226.0, oid))  # at the desk, facing it
    oid += 1
    # fire point (no crash cart in a server room): call point on the east wall
    # below the E door row, extinguisher standing beneath it
    items.append(make_obj("objects", "fire_alarm_point1", 292.0, 150.0, oid))
    oid += 1
    items.append(make_obj("objects", "fire_extinguisher1", 274.0, 196.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin11", 250.0, 230.0, oid))
    oid += 1
    # UPS status panel on the east wall under the call point, by the recovery
    # console (m02 "Backup Power Indicator"); both back-wall corners carry N doors
    items.append(make_obj("objects", "power_panel1", 290.0, 186.0, oid))
    oid += 1

    # Second row: two more racks on the west, and the UPS battery cabinets on the
    # east, next to the UPS panel they report to (kept west of x 258, out of the
    # E door row). Glass drugs cabinets don't belong in a server room.
    for name, x in [("server_rack2", 72.0), ("server_rack1", 102.0),
                    ("ups_cabinet1", 196.0), ("ups_cabinet1", 227.0)]:
        items.append(make_obj("objects", name, x, 142.0, oid))
        oid += 1

    table_items = [
        place_on_table(desk, "office-misc-fan2", x_frac=0.12, surface_frac=0.20, obj_id=oid),
    ]
    oid += 1
    table_items.append(
        place_on_table(desk, "office-misc-hdd3", x_frac=0.88, surface_frac=0.28, obj_id=oid)
    )
    oid += 1

    conditional_items = [
        make_obj("objects", "safe4", 68.0, 200.0, oid),
    ]
    oid += 1
    # m02's staging cache draws as safe3, so the slot is a safe3 (overrides are drawn
    # from the slot's top-left and a taller texture would hang below the floor line)
    conditional_items.append(make_obj("objects", "safe3", 96.0, 200.0, oid))
    oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("workstation", 0.45, 0.32),
        # slot names must match the scenario type once trailing digits are
        # stripped (core/rooms.js), so "vm-launcher", not "vm-launcher-kali"
        ("vm-launcher", 0.70, 0.35),
        ("pin-cracker", 0.10, 0.46),
        ("notes1", 0.25, 0.48),
        ("notes3", 0.85, 0.45),
        ("flag-station", 0.55, 0.28),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1
    conditional_table_items.append(
        place_on_table(console_table, "backup_recovery", x_frac=0.5, surface_frac=0.45, obj_id=oid)
    )
    oid += 1

    return build_room(
        name="room_hospital_servers",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


# Staff-room kitchenette strip on the back wall (px). Wall fixtures (boiler, soap
# dispensers, notice board) go in the band above it (y 12-70), counters/fridge/bin
# stand on the floor below it with their top edge on the skirting (y 70).
STAFF_KITCHEN_X = (146.0, 256.0)
STAFF_KITCHEN_FLOOR_Y = (70.0, 118.0)


def room_hospital_staff():
    """
    2×2 GU hospital night staff / handover room on hospital tiles.

    The one room in a ransomed hospital that still works: a paper handover board,
    tea things left mid-shift, a standalone clerk's PC that was switched off when
    the encryption ran. Doors on all four sides (corridor S, CTO N, boardroom W,
    IT E); N doors are drawn in the back-wall corners and side doors on row 2
    (y 64-96), so those stay clear.

    Layout:
      - Back wall, x 64-146: the scenario's handover board and snag list, with
        clear floor underneath so the player can walk up and read them.
      - Back wall, x 146-256: kitchenette (counter + sink, fridge with the
        microwave on it, yellow bin; boiler, soap dispensers, notice board).
      - y 118-150 across the right half, and y 70-118 across the left half, stay
        open as the W-E walkway; a N-S aisle (x ~142-180) runs to the S door.
      - Left zone: the clerk's desk (scenario workstation + notes) with staff
        lockers and a bin, and the low tea table (id_badge slot) below it.
      - Right zone: a second table with a chair on three sides.
    Every chair faces its table: hospital_chair2 faces east, hospital_chair1
    faces west, hospital_chair_south faces the viewer, hospital_chair_north is
    seen from behind. The bottom two rows (covered by the corridor) stay clear.
    """
    oid = 1

    # Clerk's desk, left zone, clear of the walkway under the notices
    desk = make_obj("tables", "hospital_desk2", 86.0, 173.0, oid)
    oid += 1
    # Low tea table below it (id_badge slot + mugs)
    side = make_obj("tables", "smalldesk1", 74.0, 248.0, oid)
    oid += 1
    # Second table where the sofa used to be, right zone
    table_r = make_obj("tables", "smalldesk1", 198.0, 210.0, oid)
    oid += 1
    # KITCHENETTE: back wall x 146-256, backs flush with the skirting (top y 70),
    # feet above the y 118 walkway. The counter and fridge sit in the tables
    # layer (hospital_extras gids) so the mugs and microwave group onto them.
    counter = make_obj("objects", "kitchen_counter_sink1", 150.0, 110.0, oid)
    oid += 1
    fridge = make_obj("objects", "undercounter_fridge1", 197.0, 99.0, oid)
    oid += 1
    tables = [desk, side, table_r, counter, fridge]

    items = []
    items.append(make_obj("objects", "yellow_bin1", 223.0, 99.0, oid))
    oid += 1
    # Wall fixtures above the counter: boiler over the left end, a pair of soap
    # dispensers right of the sink, the notice board over the bin
    items.append(make_obj("objects", "hot_water_boiler1", 152.0, 60.0, oid))
    oid += 1
    items.append(make_obj("objects", "soap_dispenser1", 176.0, 56.0, oid))
    oid += 1
    items.append(make_obj("objects", "soap_dispenser1", 189.0, 56.0, oid))
    oid += 1
    items.append(make_obj("objects", "notice_board1", 214.0, 52.0, oid))
    oid += 1
    # Handover whiteboard at the west end of the back wall
    items.append(make_obj("objects", "rota_board1", 68.0, 50.0, oid))
    oid += 1

    # Clerk's corner: a bank of staff lockers against the west wall (below the
    # W door row), the clerk's chair pulled up to the desk, a bin beside it
    items.append(make_obj("objects", "staff_lockers1", 30.0, 180.0, oid))
    oid += 1
    items.append(make_obj("objects", "hospital_chair_north", 109.0, 196.0, oid))  # faces the desk
    oid += 1
    items.append(make_obj("objects", "pedal_bin1", 152.0, 173.0, oid))
    oid += 1

    # Tea table: a chair either side, both turned in
    items.append(make_obj("objects", "hospital_chair2", 56.0, 246.0, oid))  # faces east
    oid += 1
    items.append(make_obj("objects", "hospital_chair1", 125.0, 246.0, oid))  # faces west
    oid += 1

    # Right table: chairs west, east and north of it, all facing it
    items.append(make_obj("objects", "hospital_chair2", 180.0, 208.0, oid))  # faces east
    oid += 1
    items.append(make_obj("objects", "hospital_chair1", 249.0, 208.0, oid))  # faces west
    oid += 1
    items.append(make_obj("objects", "hospital_chair_south", 215.0, 182.0, oid))  # faces south
    oid += 1

    # Water cooler in the SE corner, out of the E door's path
    items.append(make_obj("objects", "water_cooler1", 270.0, 232.0, oid))
    oid += 1

    table_items = [
        place_on_table(desk, "office-misc-cup3", x_frac=0.80, surface_frac=0.42, obj_id=oid),
    ]
    oid += 1
    # tea things at the right end, clear of the ID badge slot on the left
    table_items.append(place_on_table(side, "mugs_tray1", x_frac=0.76, surface_frac=0.30, obj_id=oid))
    oid += 1
    table_items.append(place_on_table(table_r, "office-misc-cup", x_frac=0.35, surface_frac=0.40, obj_id=oid))
    oid += 1
    table_items.append(place_on_table(counter, "dirty_mugs1", x_frac=0.24, surface_frac=0.36, obj_id=oid))
    oid += 1
    table_items.append(place_on_table(fridge, "microwave1", x_frac=0.5, surface_frac=0.18, obj_id=oid))
    oid += 1
    # Slot for a dropped ID badge (m02 staff_room), else it lands on the floor
    id_badge_slot = place_on_table(side, "id_badge", x_frac=0.30, surface_frac=0.48, obj_id=oid)
    oid += 1

    conditional_items = []
    # Wall notes slots (taped sheets). The first hangs over the notice board's
    # lower edge, drawn on top of it (bottom y 54 > the board's 52); the second
    # sits between the whiteboard and the boiler. The whiteboard and notice board
    # themselves are plain items that scenarios claim with "as-type:".
    conditional_items.append(make_obj("objects", "notes6", 236.0, 54.0, oid))
    oid += 1
    conditional_items.append(make_obj("objects", "notes6", 116.0, 50.0, oid))
    oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("workstation", 0.30, 0.34),
        ("notes1", 0.55, 0.46),
        ("notes2", 0.12, 0.44),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1
    conditional_table_items.append(id_badge_slot)

    return build_room(
        name="room_hospital_staff",
        template_key="10x10",
        tables=tables,
        items=items,
        table_items=table_items,
        conditional_items=conditional_items,
        conditional_table_items=conditional_table_items,
        use_room6=True,
    )


def _hospital_hall(name: str, wall: list, props: list) -> dict:
    """
    2×1 GU (10×6) hospital corridor on hospital tiles — a shallow through-hallway.

    Unlike the full-size hospital rooms, a corridor has no room to its south to
    cover its bottom edge, so the south wall must be baked in: the room layer's
    bottom row uses the sheet's south-wall band (via room6_hall_floor) and the
    walls collision layer carries the office south wall (91–100, from the template).

    Every variant shares the same scenario slots (a wall notes anchor between the
    boards plus three floor pickups) so scenarios can swap variants freely; only
    the dressing differs. wall/props are (sprite, x, y) lists. Keep x 64-256 on the
    back wall (corners are where N doors are drawn), keep the side-door rows
    (y 64-100 at x < 64 and x > 256) clear, and keep the walkway open.
    """
    oid = 1
    items = []
    for sprite, x, y in wall + props:
        items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1

    conditional_items = []
    # Notes slot on the back wall (a notice taped up between the boards) — gives
    # scenario notes objects a wall anchor instead of a fallback position.
    conditional_items.append(make_obj("objects", "notes6", 146.0, 50.0, oid))
    oid += 1
    for sprite, x, y in [
        ("fingerprint-brush-red", 150.0, 100.0),
        ("bag14", 90.0, 116.0),
        ("briefcase8", 214.0, 118.0),
    ]:
        conditional_items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1

    return build_room(
        name=name,
        template_key="10x6_hall",
        tables=[],
        items=items,
        table_items=[],
        conditional_items=conditional_items,
        conditional_table_items=[],
        room_override=room6_hall_floor(10, 6),
    )


# Back wall shared by the corridors: two chart boards with the notes slot between
HALL_BOARDS = [
    ("hospital_chart_board1", 90.0, 46.0),
    ("hospital_chart_board2", 172.0, 52.0),
]


def room_hospital_hall():
    """Admin-side corridor: a sanitizer stand and a wall dispenser, a vending machine
    and a fire point (call point and fire action notice on the wall, the
    extinguisher standing under them). A ward
    directory sign takes the first board's place (scenarios: "as-type:directory_sign")."""
    return _hospital_hall(
        "room_hospital_hall",
        wall=[
            ("directory_sign1", 96.0, 48.0),
            HALL_BOARDS[1],
            ("chart2", 66.0, 42.0),
            ("fire_alarm_point1", 213.0, 50.0),
            # fire action notice beside the call point, as by every UK fire point
            ("fire_action_notice1", 232.0, 48.0),
        ],
        props=[
            ("sanitizer_stand1", 70.0, 122.0),
            # the east end gets a wall dispenser (below the E door row) rather
            # than a second floor stand
            ("sanitiser_dispenser1", 294.0, 128.0),
            ("pedal_bin1", 170.0, 122.0),
            # back flat against the wall: top edge on the skirting (y 70)
            ("vending_machine1", 124.0, 130.0),
            # beside the call point, clear of the briefcase slot at x 214
            ("fire_extinguisher1", 192.0, 122.0),
        ],
    )


def room_hospital_hall_ward():
    """
    Clinical corridor outside a ward: an empty trolley bed parked against the
    wall, an IV stand beside it, a slim crash cart and a nurse-call alarm panel.
    """
    return _hospital_hall(
        "room_hospital_hall_ward",
        wall=HALL_BOARDS + [
            ("alarm_panel", 68.0, 44.0),
            ("emergency-button", 222.0, 40.0),
            ("chart", 242.0, 44.0),
        ],
        props=[
            # the trolley bed is 63px tall, so it parks at the east end, out of
            # the walkway; the south wall band still covers its wheels
            # bed_empty and iv_stand1 roll and spin when pushed (8-direction swap in
            # rooms.js); the stand is iv_stand1, not infusion_pump, so the ward's
            # bedside pumps stay static
            ("bed_empty", 214.0, 152.0),
            ("iv_stand1", 189.0, 128.0),
            # crash_cart1 rolls and spins when pushed (8-direction swap in rooms.js)
            ("crash_cart1", 36.0, 124.0),
            ("wheelchair1", 110.0, 126.0),
            ("clinical_waste_bin1", 164.0, 122.0),
            # hand sanitiser on the east side wall, just below the ward door row
            ("sanitiser_dispenser1", 294.0, 128.0),
        ],
    )


def room_hospital_hall_waiting():
    """Outpatient-style corridor: a row of seats under the boards either side of a water cooler."""
    return _hospital_hall(
        "room_hospital_hall_waiting",
        wall=HALL_BOARDS + [
            ("health_poster4", 66.0, 44.0),
            ("health_poster6", 222.0, 44.0),
        ],
        props=[
            ("hospital_chair_south", 100.0, 104.0),
            ("hospital_chair_south", 120.0, 104.0),
            ("hospital_chair_south", 176.0, 104.0),
            ("hospital_chair_south", 196.0, 104.0),
            ("water_cooler1", 146.0, 112.0),
            # hand sanitiser on the west side wall, just below the door row
            ("sanitiser_dispenser1", 13.0, 128.0),
        ],
    )

def room_hospital_waiting_1x1gu():
    """
    1×1 GU (5×6) hospital waiting area / vestibule on hospital tiles.

    The 5x6 template's room layer uses room1 (office-updated) cells; room_hospital
    has the same 10x10 layout, so each cell maps to the same cell of the hospital
    sheet. Side doors land on row 2 (y 64-96) of either wall, so that row stays
    clear as the walkway; the seats sit back to back in the middle below it.
    """
    tmpl = TEMPLATES["5x6"]
    room_data = [ROOM6_FIRSTGID + g - 1 if 1 <= g <= 100 else g for g in tmpl["room"]]
    oid = 1
    items = []
    for sprite, x, y in [
        # back wall notices
        ("hospital_chart_board1", 40.0, 48.0),
        ("health_poster5", 92.0, 44.0),
        ("health_poster1", 114.0, 44.0),
        # side-wall posters below the doors
        ("chart2", 12.0, 142.0),
        ("chart", 135.0, 140.0),
        # a back-to-back seating block in the middle, below the door walkway:
        # a row facing the back wall's notices (chair_north, seen from behind)
        # with a row facing south tucked against its back. Open walkways of
        # 32px either side run from the doors down to the rest of the room.
        ("hospital_chair_north", 56.0, 126.0),
        ("hospital_chair_north", 72.0, 126.0),
        ("hospital_chair_north", 88.0, 126.0),
        ("hospital_chair_south", 56.0, 152.0),
        ("hospital_chair_south", 72.0, 152.0),
        ("hospital_chair_south", 88.0, 152.0),
        ("water_cooler1", 110.0, 158.0),  # lower right, off the paths, above the bottom row
        ("sanitiser_dispenser1", 133.0, 120.0),  # east side wall, under the door row
    ]:
        items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1
    return build_room(
        name="room_hospital_waiting_1x1gu",
        template_key="5x6",
        tables=[],
        items=items,
        table_items=[],
        conditional_items=[],
        conditional_table_items=[],
        room_override=room_data,
    )


def room_hospital_storage_1x1gu():
    """
    1×1 GU (5×6) hospital store room on hospital tiles: a drugs cabinet against
    the back wall, a crash cart, boxed supplies and slots for a floor safe and a
    wall-hung stock list. Doors can land on row 2 (y 64-96) of either side wall,
    so the left of the room below the doors stays open.
    """
    tmpl = TEMPLATES["5x6"]
    room_data = [ROOM6_FIRSTGID + g - 1 if 1 <= g <= 100 else g for g in tmpl["room"]]
    oid = 1
    items = []
    for sprite, x, y in [
        ("first_aid_cabinet1", 92.0, 60.0),
        ("medical_cabinet2", 74.0, 132.0),
        ("crash_cart2", 102.0, 176.0),
        ("office-misc-box1", 70.0, 168.0),
        ("office-misc-box1", 80.0, 178.0),
        ("office-misc-box1", 66.0, 182.0),
    ]:
        items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1
    conditional_items = []
    for sprite, x, y in [
        ("safe1", 36.0, 172.0),   # PIN safe on the floor, lower left
        ("notes6", 70.0, 50.0),   # stock list taped to the back wall, clear of the NW door
    ]:
        conditional_items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1
    return build_room(
        name="room_hospital_storage_1x1gu",
        template_key="5x6",
        tables=[],
        items=items,
        table_items=[],
        conditional_items=conditional_items,
        conditional_table_items=[],
        room_override=room_data,
    )


def main():
    # Hand-maintained (do not regenerate — edit .tmj in Tiled, then export JSON):
    #   room_hospital_office, room_hospital_cto_office, room_hospital_meeting
    # room_hospital_reception's .json has also been hand-edited since it was
    # generated (45 objects vs the builder's 34) — regenerating it loses that.
    builders = {
        "small_office_room4_1x1gu": room_small_office_4,
        "room_security": room_security,
        "room_lab": room_lab,
        "room_hospital_reception": room_hospital_reception,
        "room_hospital_servers": room_hospital_servers,
        "room_hospital_hall": room_hospital_hall,
        "room_hospital_hall_ward": room_hospital_hall_ward,
        "room_hospital_hall_waiting": room_hospital_hall_waiting,
        "room_hospital_waiting_1x1gu": room_hospital_waiting_1x1gu,
        "room_hospital_storage_1x1gu": room_hospital_storage_1x1gu,
        "room_hospital_staff": room_hospital_staff,
    }
    # Optionally restrict to specific rooms (argv) so already-updated rooms are
    # not clobbered, e.g.  python3 scripts/generate_rooms.py room_hospital_hall
    requested = sys.argv[1:]
    # --check: validate the existing .json maps (incl. hand-maintained ones)
    # without regenerating, e.g.  python3 scripts/generate_rooms.py --check room_hospital_office
    if requested and requested[0] == "--check":
        for stem in requested[1:] or list(builders):
            validate_room(load_json(ROOMS_DIR / f"{stem}.json"), stem)
        return
    if requested:
        unknown = [r for r in requested if r not in builders]
        if unknown:
            raise SystemExit(f"Unknown room(s): {unknown}. Known: {list(builders)}")
        rooms = {k: builders[k] for k in requested}
    else:
        rooms = builders

    for stem, builder in rooms.items():
        print(f"\nGenerating {stem}...")
        room = builder()
        validate_room(room, stem)
        write_room(room, stem)


if __name__ == "__main__":
    main()
