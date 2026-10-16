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
  - A 10x6 room with a 10x10 room directly south of it (the room_uni_* corridor,
    library and office) shows only y 64-128: the southern room's 2-tile north
    wall covers its bottom two rows. Keep gameplay feet above y 128 there, which
    is stricter than validate_room()'s one-row rule for 6-row rooms.

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
        or name.startswith("planter-fig1-top-ani")   # fig with sway frames (m08 lobby, 2026-10-16)
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
ROOM18_FIRSTGID = 601  # room18's slot in TILESETS; AES_WIDE_SHEETS put the east half of a hall there
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
        floor = HOSPITAL_FLOOR_VARIANTS.get(name, "room_hospital")
        for ts in tilesets:
            if ts.get("name") == "room6":
                ts["name"] = floor
                ts["image"] = ts["image"].replace("room6.png", f"{floor}.png")
    elif name in AES_WIDE_SHEETS:
        # a 20-wide sheet in two halves: west on room6's gids, east on room18's (unused by builder maps)
        west, east = AES_WIDE_SHEETS[name]
        for ts in tilesets:
            if ts.get("name") == "room6":
                ts["name"] = west
                ts["image"] = ts["image"].replace("room6.png", f"{west}.png")
            elif ts.get("name") == "room18":
                ts["name"] = east
                ts["image"] = ts["image"].replace("room18.png", f"{east}.png")
    elif name in UNI_FLOOR_SHEETS or name in ZDS_FLOOR_SHEETS or name in AES_FLOOR_SHEETS or name in HCE_FLOOR_SHEETS \
            or name in QDC_FLOOR_SHEETS or name in PNW_FLOOR_SHEETS:
        floor = (UNI_FLOOR_SHEETS.get(name) or ZDS_FLOOR_SHEETS.get(name) or AES_FLOOR_SHEETS.get(name)
                 or HCE_FLOOR_SHEETS.get(name) or QDC_FLOOR_SHEETS.get(name) or PNW_FLOOR_SHEETS[name])
        for ts in tilesets:
            if ts.get("name") == "room6":
                ts["name"] = floor
                ts["image"] = ts["image"].replace("room6.png", f"{floor}.png")
    return tilesets


# Hospital rooms whose floor is not the clinical vinyl (same walls and tile
# layout; made by room_gen/make_hospital_tileset.py, preloaded in game.js).
# Hand rooms set theirs with `room_edit.py ROOM floor NAME` (the offices and
# conference room use room_hospital_carpet, Dr Kim's office room_hospital_exec).
HOSPITAL_FLOOR_VARIANTS = {
    "room_hospital_servers": "room_hospital_raised",  # raised access floor
    "room_hospital_staff": "room_hospital_kitchen",   # flecked kitchen safety vinyl
}

# University (campus) rooms: room6 repainted with off-white walls, a teal skirting
# and a floor per room type (room_gen/make_uni_tileset.py, preloaded in game.js).
UNI_FLOOR_SHEETS = {
    "room_uni_foyer": "room_uni_foyer",          # terrazzo, brass "M" inlay at the spawn
    "room_uni_lab": "room_uni_carpet",
    "room_uni_common": "room_uni_common",        # warm carpet, kitchen vinyl patch
    "room_uni_corridor": "room_uni",             # sheet vinyl
    "room_uni_library": "room_uni_library",
    "room_uni_office": "room_uni_carpet",
    "room_uni_workshop": "room_uni_workshop",    # concrete, hazard line round the bench
    "room_uni_lecture": "room_uni_lecture",
    "room_uni_special": "room_uni_special",
    "room_uni_seminar": "room_uni_carpet",
    "room_uni_staff": "room_uni_carpet",
}

# Zero Day Syndicate's offices (m03): room6 repainted by room_gen/make_zds_tileset.py,
# cool white walls with a cyan brand line; the server room has slate walls.
ZDS_FLOOR_SHEETS = {
    "room_zds_reception": "room_zds_lobby",      # polished stone, hat-mark inlay at the spawn
    "room_zds_conference": "room_zds_boardroom",  # carpet with a rug under the table
    "room_zds_office": "room_zds_office_floor",  # carpet with a worn rug
    "room_zds_ceo": "room_zds_exec",             # walnut parquet, navy and gold rug under the desk
    "room_zds_servers": "room_zds_raised",       # raised access floor, two cold aisles
    "room_zds_hall": "room_zds_hall",            # the lobby's stone, no decals
    "room_zds_hall_exec": "room_zds_hall_exec",  # carpet with a burgundy runner
}

# Albion Energy Storage (m04): room6 repainted by room_gen/make_aes_tileset.py,
# cream office walls with a green brand line; grey blockwork with a yellow band
# for the plant side.
AES_FLOOR_SHEETS = {
    "room_aes_reception": "room_aes_lobby",      # terrazzo, Albion bolt inlay at the spawn
    "room_aes_ops": "room_aes_carpet",           # blue-grey carpet, kitchenette vinyl NE
    "room_aes_security": "room_aes_security",    # charcoal carpet
    "room_aes_control": "room_aes_control",      # anti-static vinyl tiles
    "room_aes_workshop": "room_aes_workshop",    # sealed concrete, hazard line round the bench
    "room_aes_plant": "room_aes_plant",          # green epoxy, red-hatched box at the ESD
    "room_aes_dock": "room_aes_dock",            # concrete, bay lines, threshold stripes
}
# HashChain Exchange (m06): room6 repainted by room_gen/make_hce_tileset.py,
# midnight navy walls with a bitcoin-amber line front of house, pale grey in the
# back offices, petrol blue with a cyan line in the server room and data centre.
HCE_FLOOR_SHEETS = {
    "room_hce_trading": "room_hce_trading",      # blue-grey carpet tiles, a lighter aisle
    "room_hce_lobby": "room_hce_lobby",          # marble, gold hex-chain inlay
    "room_hce_hall": "room_hce_hall",            # marble (checkpoint)
    "room_hce_office": "room_hce_office",        # taupe carpet (Irina)
    "room_hce_lab": "room_hce_lab",              # grey vinyl, trunking
    "room_hce_servers": "room_hce_servers",      # raised floor, cold aisles
    "room_hce_vault": "room_hce_vault",          # darker raised floor, custody cage line
    "room_hce_exec_hall": "room_hce_exec_hall",  # smoked oak, navy runner
    "room_hce_ceo": "room_hce_ceo",              # smoked oak, amber rug
}
# Quantum Dynamics Corporation (m05): room6 repainted by room_gen/make_qdc_tileset.py,
# lilac-grey walls with a quantum-violet line front of house, white in the lab, sage
# in the break room, graphite in the server side, a red line in the key vault.
QDC_FLOOR_SHEETS = {
    "room_qdc_lobby": "room_qdc_lobby",              # pale stone, violet Bloch-sphere inlay
    "room_qdc_hall": "room_qdc_hall",                # slate carpet tiles (main corridor)
    "room_qdc_server_hall": "room_qdc_server_hall",  # grey vinyl, trunking
    "room_qdc_break": "room_qdc_break",              # wood-effect vinyl, kitchen strip
    "room_qdc_open": "room_qdc_open",                # blue-grey carpet, lighter walkway
    "room_qdc_security": "room_qdc_security",        # plum carpet (Patricia)
    "room_qdc_torres": "room_qdc_torres",            # oak, blue rug
    "room_qdc_lab": "room_qdc_lab",                  # white anti-static tiles, hatched boxes
    "room_qdc_servers": "room_qdc_servers",          # raised floor, cold aisles
    "room_qdc_vault": "room_qdc_vault",              # dark raised floor, red two-person line
}
# Pacific Northwest Regional Grid Control (m07): room6 repainted by
# room_gen/make_pnw_tileset.py, an evergreen line on every wall: pale grey at the
# checkpoint, dark slate on the ops floor, teal-graphite in the server hall, plum
# with a red line in SCADA control, sage blockwork in the generator hall (a wide
# sheet, AES_WIDE_SHEETS), board-marked concrete with a yellow line in the vault.
PNW_FLOOR_SHEETS = {
    "room_pnw_checkpoint": "room_pnw_checkpoint",  # grey terrazzo, fir-and-bolt inlay, walk-off mat
    "room_pnw_ops": "room_pnw_ops",                # dark blue carpet, lighter aisle, supervisor's dais
    "room_pnw_servers": "room_pnw_servers",        # raised floor, a perforated cold aisle
    "room_pnw_scada": "room_pnw_scada",            # dark anti-static tiles
    "room_pnw_vault": "room_pnw_vault",            # wet concrete, cable trench, sump
}
# 20x10 halls whose floor is one 640px sheet cut in two (west half, east half).
AES_WIDE_SHEETS = {
    "room_aes_hall1": ("room_aes_hall1_w", "room_aes_hall1_e"),
    "room_aes_hall2": ("room_aes_hall2_w", "room_aes_hall2_e"),
    "room_pnw_genhall": ("room_pnw_genhall_w", "room_pnw_genhall_e"),  # m07 backup generation hall
}


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
    collisions: list[dict] | None = None,
) -> dict:
    """collisions: rectangles for "Object Layer 1" (name "collision", y = top
    edge), which rooms.js turns into invisible static bodies (usable since
    engine fix E7, October 2026)."""
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
        object_layer("Object Layer 1", 13, list(collisions or [])),
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
WALL_BASE_PX = 59       # skirting starts here (rows 59-61, floor line 62-63): hangings end above it
FLOOR_TOP_PX = 64       # first floor row: north walls are 2 tiles (room_geometry.FLOOR_TOP)
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
    "suppression_panel",
    "aed_cabinet",
    "cctv_camera",
    "nurse_call_display",
    "cctv_monitors",
    "info_screen",
    "handwash_poster",
    "pigeonholes",
    "cable_tray",
    "year_planner",
    "conference_screen",
    "wall_rail",
    "window_blinds",
    "uni_crest_sign",
    "projector_screen",
    "drop_box",
    "uni_directory",
    "uni_doorcard",
    "uni_sign_library",
    "uni_sign_special",
    "uni_timetable",
    "uni_poster",
    "alarm_panel",
    "pegboard_tools",
    "uni_sign_staff",
    "uni_tv",
    "uni_certificate",
    "uni_portrait",
    "uni_bunting",
    "smartscreen",
    "uni_fountain",
    "uni_radiator",
    "uni_firedoor_sign",
    "uni_dartboard",
    "uni_sign_returns",
    "uni_sign_study",
    "whitehat_sign",
    "victoria_portrait",
    "market_board",
    "threat_map",
    "magazine_cover",
    "private_sign",
    "restricted_sign",
    "aes_esd_station",
    "aes_beacon",
    "aes_cable_tray",
    "aes_esd_button",
    "aes_dial_thermometer",
    "aes_h2_detector",
    "aes_vent_fan",
    "aes_ppe_rack",
    "aes_status_display",
    "aes_first_aid",
    "aes_emergency_phone",
    "aes_breaker_panel",
    "aes_pegboard",
    "aes_cctv",
    "aes_lockout_station",
    "aes_hose_reel",
    "aes_radio_charger",
    "aes_hv_sign",
    "aes_bank_c_sign",
    "aes_bank_a_sign",
    "aes_bank_b_sign",
    "aes_esd_sign",
    "aes_inverter_sign",
    "aes_dock_sign",
    "aes_ppe_sign",
    "aes_hv_danger",
    "aes_process_diagram",
    "aes_procedures_sign",
    "aes_round_terminal",
    "aes_logo_sign",
    "aes_gas_detector",
    "aes_hivis_hook",
    "aes_shutter_ctrl",
    "aes_mimic_board",
    "hce_logo_sign",
    "hce_logo_small",
    "hce_ticker",
    "hce_world_clocks",
    "hce_chart_screen",
    "hce_press_clipping",
    "hce_whiteboard_maths",
    "hce_whiteboard_graph",
    "hce_whitepaper_frame",
    "hce_custody_sign",
    "hce_exec_sign",
    "hce_staff_sign",
    "hce_server_sign",
    "hce_lab_sign",
    "hce_block_screen",
    "hce_phd_frame",
    "hce_sconce",
    "hce_art_canvas",
    "qdc_logo_sign",
    "qdc_logo_small",
    "qdc_lab_sign",
    "qdc_server_sign",
    "qdc_vault_sign",
    "qdc_security_sign",
    "qdc_it_sign",
    "qdc_lab_rules",
    "qdc_badge_hook",
    "qdc_laser_warning",
    "qdc_whiteboard_lattice",
    "qdc_whiteboard_net",
    "qdc_suspects_board",
    "qdc_dispatch_screen",
    "qdc_kid_drawing",
    "qdc_poster_secure",
    "qdc_poster_ready",
    "qdc_poster_team",
    "qdc_it_notice",
    "qdc_whiteboard_keys",
    "qdc_two_person_sign",
    "pnw_logo_sign",
    "pnw_evac_board",
    "pnw_nerc_notice",
    "pnw_muster_sign",
    "pnw_video_wall",
    "pnw_substation_map",
    "pnw_countdown",
    "pnw_mimic",
    "notes_plantlog",
    "pnw_genplate_one",
    "pnw_genplate_two",
    "pnw_genplate_three",
    "pnw_ear_sign",
    "pnw_cable_ladder",
    "pnw_splice",
    "pnw_ops_sign",
    "pnw_server_sign",
    "pnw_scada_sign",
    "pnw_genhall_sign",
    "pnw_vault_sign",
    "pnw_security_sign",
    "pnw_hose_reel",
    "hq_logo_sign",
    "hq_logo_small",
    "hq_memorial",
    "hq_alert_screen",
    "hq_ops_board",
    "hq_tactical_board",
    "hq_evidence_wall",
    "hq_disposition",
    "hq_one_way_mirror",
    "hq_recording",
    "hq_badge_reader",
    "hq_poster_postit",
    "hq_poster_ears",
    "hq_poster_red",
    "hq_cipher_board",
    "hq_ops_sign",
    "hq_intel_sign",
    "hq_crypto_sign",
    "hq_server_sign",
    "hq_break_sign",
    "hq_director_sign",
    "hq_archive_sign",
    "hq_interview_sign",
    "qdc_first_aid_cabinet",
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

    # North walls are 2 tiles: the floor must start at y=64, level with north door
    # bottoms (room_gen/room_geometry.py; check every map with check_room_walls.py)
    try:
        from room_gen.check_room_walls import measure
        from room_gen.room_geometry import FLOOR_TOP
        tops = measure(room)
        if tops and any(t != FLOOR_TOP for t in tops):
            warnings.append(f"back wall floor line off the 2-tile standard: floor starts at "
                            f"{sorted(set(tops))}, want {FLOOR_TOP} (fix the room sheet, see room_geometry.py)")
    except Exception as e:
        warnings.append(f"could not measure the back wall ({e})")

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
    # Analysis desk in the open south-east corner for m02's CyberChef laptop, so
    # the admin desk holds only the attack terminal and the drop-site (three
    # terminals on one 62px desk overlapped)
    analysis_table = make_obj("tables", "smalldesk1", 214.0, 290.0, oid)
    oid += 1
    tables = [desk, console_table, analysis_table]

    items = []
    # Back row of racks along the clear mid back wall (x 72-254; both back-wall
    # corners carry N doors), mixed kit rather than one rack repeated: glass- and
    # mesh-door racks, a disk storage array and a tape library at the end of the
    # row, then the room's air-conditioning unit
    for i, name in enumerate(["server_rack1", "server_rack2", "server_rack1",
                              "storage_array1", "tape_library1"]):
        items.append(make_obj("objects", name, 72.0 + 30 * i, 82.0, oid))
        oid += 1
    items.append(make_obj("objects", "aircon_unit1", 222.0, 82.0, oid))
    oid += 1
    # overhead cable tray on the back wall above the row, a bundle dropping into
    # each cabinet (drawn behind the cabinets, so only the tray and drops show)
    items.append(make_obj("objects", "cable_tray1", 70.0, 27.0, oid))
    oid += 1

    # The racks fill the back wall, so wall art would only peek out behind them;
    # a temperature sensor goes on the west side wall between the W door slots.
    items.append(make_obj("objects", "thermometer", 13.0, 150.0, oid))
    oid += 1

    items.append(make_obj("objects", "hospital_chair_north", 162.0, 226.0, oid))  # at the desk, facing it
    oid += 1
    # fire point (no crash cart in a server room): call point on the east wall
    # below the E door row, extinguisher standing against the wall further down,
    # below the UPS panel, so the panel can be reached from the floor in front
    items.append(make_obj("objects", "fire_alarm_point1", 292.0, 150.0, oid))
    oid += 1
    items.append(make_obj("objects", "fire_extinguisher1", 274.0, 238.0, oid))
    oid += 1
    items.append(make_obj("objects", "bin11", 250.0, 230.0, oid))
    oid += 1
    # UPS status panel on the east wall under the call point, by the recovery
    # console (m02 "Backup Power Indicator"); both back-wall corners carry N doors
    items.append(make_obj("objects", "power_panel1", 290.0, 186.0, oid))
    oid += 1
    # gas fire suppression: the HOLD/ABORT station by the E door (between the
    # door row and the call point), the red extinguishant cylinders standing in
    # the open south-west corner
    items.append(make_obj("objects", "suppression_panel1", 293.0, 124.0, oid))
    oid += 1
    items.append(make_obj("objects", "suppression_cylinders1", 34.0, 250.0, oid))
    oid += 1

    # Second row: two more racks on the west, and the UPS battery cabinets on the
    # east, next to the UPS panel they report to (kept west of x 258, out of the
    # E door row). Glass drugs cabinets don't belong in a server room.
    # The second rack is the open network rack: patch panels and switches with the
    # patch leads that fan out to the rest of the room.
    for name, x in [("server_rack2", 72.0), ("network_rack1", 102.0),
                    ("ups_cabinet1", 196.0), ("ups_cabinet1", 227.0)]:
        items.append(make_obj("objects", name, x, 142.0, oid))
        oid += 1
    # KVM crash cart parked in the gap in the second row, in front of the back racks
    items.append(make_obj("objects", "kvm_cart1", 146.0, 142.0, oid))
    oid += 1
    # spare-parts shelving (boxed drives, PSUs, cables) along the open south side
    for x in (104.0, 156.0):
        items.append(make_obj("objects", "supply_shelves1", x, 290.0, oid))
        oid += 1

    table_items = [
        place_on_table(analysis_table, "office-misc-fan2", x_frac=0.80, surface_frac=0.30, obj_id=oid),
    ]
    oid += 1

    conditional_items = [
        make_obj("objects", "safe4", 68.0, 200.0, oid),
    ]
    oid += 1
    # m02's staging cache draws as safe3, so the slot is a safe3 (overrides are drawn
    # from the slot's top-left and a taller texture would hang below the floor line)
    conditional_items.append(make_obj("objects", "safe3", 96.0, 200.0, oid))
    oid += 1
    # m02's operator note is "taped inside the rack door": on the open network
    # rack, feet 1px below the rack's so it draws in front of it, and well away
    # from the desk terminals so a tap on one never asks which you meant
    conditional_items.append(make_obj("objects", "notes1", 117.0, 143.0, oid))
    oid += 1

    # Admin desk: the attack terminal on the left, the drop-site on the right,
    # nothing else (both sprites side by side fill 54 of the desk's 62px)
    conditional_table_items = []
    for name, xf, sf in [
        # slot names must match the scenario type once trailing digits are
        # stripped (core/rooms.js), so "vm-launcher", not "vm-launcher-kali"
        ("vm-launcher", 0.24, 0.36),
        ("flag-station", 0.77, 0.32),
    ]:
        conditional_table_items.append(
            place_on_table(desk, name, x_frac=xf, surface_frac=sf, obj_id=oid)
        )
        oid += 1
    conditional_table_items.append(
        place_on_table(analysis_table, "workstation", x_frac=0.30, surface_frac=0.35, obj_id=oid)
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
        microwave on it, dishwasher; boiler, soap dispensers, notice board),
        with staff pigeon-holes between the handover board and the boiler.
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
    # fridge and dishwasher stand on the same line as the counter units (feet y 110)
    fridge = make_obj("objects", "undercounter_fridge1", 197.0, 110.0, oid)
    oid += 1
    # Dishwasher beside the fridge, finishing the kitchen run (replaces a yellow
    # clinical-waste bin that had no business in a tea room)
    dishwasher = make_obj("objects", "dishwasher1", 219.0, 110.0, oid)
    oid += 1
    tables = [desk, side, table_r, counter, fridge, dishwasher]

    items = []
    # Wall fixtures above the counter: boiler over the left end, a pair of soap
    # dispensers right of the sink, the notice board over the bin
    items.append(make_obj("objects", "hot_water_boiler1", 152.0, 58.0, oid))
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
    # Staff pigeon-holes between the whiteboard and the boiler
    items.append(make_obj("objects", "pigeonholes1", 118.0, 58.0, oid))
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
    # Coat stand against the east wall above the cooler, below the E door row
    items.append(make_obj("objects", "coat_stand1", 272.0, 182.0, oid))
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
    # sits between the whiteboard and the pigeon-holes. The whiteboard and notice board
    # themselves are plain items that scenarios claim with "as-type:".
    conditional_items.append(make_obj("objects", "notes6", 236.0, 54.0, oid))
    oid += 1
    conditional_items.append(make_obj("objects", "notes6", 101.0, 50.0, oid))
    oid += 1

    conditional_table_items = []
    for name, xf, sf in [
        ("workstation", 0.30, 0.34),
        ("notes1", 0.55, 0.42),
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
            # a vending corner: snack and hot-drinks machines side by side, backs
            # flat against the wall (top edge on the skirting, y 70), bin beside them
            ("vending_machine1", 104.0, 130.0),
            ("drinks_vending1", 148.0, 131.0),
            # bin tucked against the wall beside the drinks machine, not mid-corridor
            ("pedal_bin1", 192.0, 90.0),
            # under the fire action notice, standing just below the north wall
            # (top edge on the skirting)
            ("fire_extinguisher1", 236.0, 94.0),
        ],
    )


def room_hospital_hall_ward():
    """
    Clinical corridor outside a ward: an empty trolley bed parked against the
    wall, an IV stand beside it, a slim crash cart and a nurse-call alarm panel.
    """
    return _hospital_hall(
        "room_hospital_hall_ward",
        wall=[
            ("alarm_panel", 66.0, 44.0),
            # ward-entrance hand-wash basin (as in the ward) with the hand-washing
            # poster beside it, where the other corridors hang their boards
            # wall-hung: its pedestal base sits just below the floor line
            ("clinical_sink1", 86.0, 74.0),
            ("handwash_poster1", 172.0, 52.0),
            ("emergency-button", 210.0, 40.0),
            # CCTV camera high on the wall, watching the ward door
            ("cctv_camera1", 230.0, 32.0),
            # trolley bumper rail at bed height, from the basin's east edge to the
            # NE door corner (wall_rail2 is the 128px cut; the rail stops at the basin
            # rather than running behind its splashback)
            ("wall_rail2", 128.0, 58.0),
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
            ("wheelchair1", 126.0, 126.0),
            # against the wall under the bumper rail, not mid-corridor
            ("clinical_waste_bin1", 166.0, 92.0),
            # hand sanitiser on the east side wall, just below the ward door row
            ("sanitiser_dispenser1", 294.0, 128.0),
        ],
    )


def room_hospital_hall_waiting():
    """Outpatient-style corridor: a row of seats under a "now calling" screen, the night cleaner's trolley and wet-floor sign beside them."""
    return _hospital_hall(
        "room_hospital_hall_waiting",
        wall=[
            # outpatients "now calling" screen above the seats
            ("info_screen1", 93.0, 46.0),
            HALL_BOARDS[1],
            ("health_poster4", 66.0, 44.0),
            # public-access defibrillator on the corridor wall
            ("aed_cabinet1", 224.0, 48.0),
            # trolley bumper rail, as in the ward corridor
            ("wall_rail1", 64.0, 58.0),
        ],
        props=[
            # one row of four seats (the staff room and the vestibule already have
            # the water coolers)
            ("hospital_chair_south", 100.0, 104.0),
            ("hospital_chair_south", 116.0, 104.0),
            ("hospital_chair_south", 132.0, 104.0),
            ("hospital_chair_south", 148.0, 104.0),
            # hand sanitiser on the west side wall, just below the door row
            ("sanitiser_dispenser1", 13.0, 128.0),
            # the night cleaner's trolley parked against the wall, east of the seats
            ("cleaning_trolley1", 213.0, 116.0),
            ("wet_floor_sign1", 186.0, 120.0),
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
        ("hospital_chart_board1", 34.0, 48.0),
        # patient leaflets and a no-smoking sign, as at any ward entrance
        ("leaflet_holder1", 84.0, 58.0),
        ("no_smoking_sign1", 118.0, 48.0),
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
        ("pedal_bin1", 36.0, 156.0),  # lower left, by the seats
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
        # the glass supply cabinet stands flat against the back wall on the
        # right, clear of the west door (the wall first-aid cabinet it replaced
        # left no back-wall space outside the N door corners)
        ("medical_cabinet2", 69.0, 80.0),  # foot centre x 95, just west of the NE footprint
        # boxed deliveries on a sack-truck dolly under the cabinet's east end
        ("supply_boxes1", 96.0, 124.0),
        # oxygen cylinders chained in their rack beside the safe, the crash
        # cart parked in the south-east corner
        ("cylinder_rack1", 65.0, 180.0),
        ("crash_cart2", 108.0, 178.0),
    ]:
        items.append(make_obj("objects", sprite, x, y, oid))
        oid += 1
    conditional_items = []
    for sprite, x, y in [
        ("safe1", 32.0, 172.0),   # PIN safe on the floor, lower left
        ("notes6", 64.0, 50.0),   # stock list taped to the back wall, clear of the NW door
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


# ---------------------------------------------------------------------------
# University (campus) rooms: the Computing building of Miskatonic University UK
# (scenarios/lab_tesseract_trials/ROOMS_PLAN.md). Off-white walls with a teal
# skirting on every room; the floor sheet per room is in UNI_FLOOR_SHEETS.
# Coordinates: x = left edge, y = feet. Claimed slots name the scenario object
# that lands on them; other scenarios can reuse the maps through the same base
# types (README "Available Room Types").
# ---------------------------------------------------------------------------

# A 20-wide row from a 10-wide one (templates.json "20x10" uses the same map):
# the side-wall and corner columns stay at the ends, interior columns repeat.
COLS_20 = list(range(9)) + [1, 2, 3] + list(range(2, 10))

# A 20x6 hallway template from the 10x6 one, the same way (the doors layer is
# not read by the engine, which places door sprites itself; it is kept for Tiled).
_H = TEMPLATES["10x6_hall"]
TEMPLATES.setdefault("20x6_hall", {
    "width": 20, "height": 6,
    "walls": [_H["walls"][r * 10 + COLS_20[c]] for r in range(6) for c in range(20)],
    "room": [_H["room"][r * 10 + COLS_20[c]] for r in range(6) for c in range(20)],
    "doors": [_H["doors"][r * 10 + (0 if c == 0 else 9 if c == 19 else 1 if c == 1 else 8 if c == 18 else 2)]
              for r in range(6) for c in range(20)],
})


class _Uni:
    """Collects a builder room's layers and numbers its objects in order."""

    def __init__(self):
        self.oid = 1
        self.tables, self.items, self.table_items = [], [], []
        self.conditional_items, self.conditional_table_items = [], []
        self.collisions = []

    def _next(self):
        oid = self.oid
        self.oid += 1
        return oid

    def table(self, name, x, y, kind="tables"):
        """A table-layer object; catalog 'objects' (counters, workbenches) pass kind='objects'."""
        t = make_obj(kind, name, x, y, self._next())
        self.tables.append(t)
        return t

    def item(self, name, x, y, layer="items"):
        getattr(self, layer).append(make_obj("objects", name, x, y, self._next()))

    def on(self, table, name, x_frac, surface_frac, layer="table_items"):
        getattr(self, layer).append(
            place_on_table(table, name, x_frac=x_frac, surface_frac=surface_frac, obj_id=self._next())
        )

    def solid(self, name, x, y, layer="items", inset=2, depth=10):
        """An item that blocks the player: the sprite plus an invisible collision strip
        along its base (items-layer sprites get no physics body of their own)."""
        self.item(name, x, y, layer=layer)
        w = lookup("objects", name)["w"]
        self.collision(x + inset, y - depth, w - 2 * inset, depth)

    def collision(self, x, y_top, w, h):
        """An invisible blocking rectangle (room pixels; y is the TOP edge)."""
        self.collisions.append({
            "height": h, "id": self._next(), "name": "collision", "rotation": 0,
            "type": "", "visible": True, "width": w, "x": x, "y": y_top,
        })

    def build(self, name, template_key="10x10"):
        kw = {"use_room6": True}
        if template_key == "10x6_hall":
            kw = {"room_override": room6_hall_floor(10, 6)}
        elif template_key == "20x6_hall":
            hall = room6_hall_floor(10, 6)
            kw = {"room_override": [hall[row * 10 + COLS_20[col]] for row in range(6) for col in range(20)]}
        elif template_key == "20x10":
            kw = {"room_override": [ROOM6_FIRSTGID + row * ROOM6_SHEET_COLS + COLS_20[col]
                                    for row in range(10) for col in range(20)]}
        elif template_key == "20x10_wide":
            # AES_WIDE_SHEETS: cols 0-9 from the west half (room6's gids), 10-19 from the east (room18's)
            template_key = "20x10"
            kw = {"room_override": [(ROOM6_FIRSTGID if col < 10 else ROOM18_FIRSTGID) + row * ROOM6_SHEET_COLS + col % 10
                                    for row in range(10) for col in range(20)]}
        if self.collisions:
            kw["collisions"] = self.collisions
        return build_room(
            name=name,
            template_key=template_key,
            tables=self.tables,
            items=self.items,
            table_items=self.table_items,
            conditional_items=self.conditional_items,
            conditional_table_items=self.conditional_table_items,
            **kw,
        )


def room_uni_foyer():
    """
    2×2 GU Computing-school atrium in freshers' week: the school crest, the 1979
    heritage display (Byte Wall, plaque, powers-of-two chart; a display table with
    two papers on it), a recruiter's stand with a lockbox and a laptop, and a
    society's freshers' fair stall. Freshers' fair dressing (round 2): bunting along
    the back wall either side of the crest, the Cyber Security Society's pull-up
    banner and a bunch of balloons in the west half, a second poster on the west wall.
    The banner and balloons are walk-through items (no body), east of the x 32-64
    column to the S door. Jordan stands at (6.5, 3.6), towards the top right, in
    front of the display table, which stands against the back wall under the crest
    (2026-10-11; it was mid-room at x 206, feet 196).

    Doors: N (NW corner), W and E on row 2, S (SW corner, covered rows). The
    player spawns at (160, 144) on the brass "M" inlay in the floor sheet, so
    x 128-192, y 150-200 stays clear, as do the W-E lane (y 64-128) and a south
    lane (x 32-96).
    Slots: plaque1 (as-type:plaque), alarm_panel, chart2 (base chart), notes4 then
    notes2 on the display (as-type:notes), briefcase11 and laptop6 on the stand.
    """
    r = _Uni()
    display = r.table("display_table1", 157.0, 104.0, kind="objects")  # heritage display table (no PC towers), against the back wall under the crest (user, 2026-10-11)
    stand = r.table("display_table1", 100.0, 240.0, kind="objects")  # recruiter's stand (no PC towers)
    # back wall: plaque, Byte Wall, crest (decor), chart; >= 32px between interactables
    r.item("plaque1", 82.0, 52.0)
    r.item("alarm_panel2", 138.0, 52.0)            # the 1979 front panel, lit 01001101 (base alarm_panel)
    r.item("uni_crest_sign1", 174.0, 42.0)
    r.item("chart2", 222.0, 52.0)
    r.item("uni_poster1", 14.0, 136.0)              # west wall, below the door row
    r.item("fire_alarm_point1", 292.0, 132.0)       # east wall
    r.item("cryptosecure_banner1", 182.0, 240.0)    # pull-up banner beside the stand
    # freshers' fair: bunting either side of the crest, above the wall items
    r.item("uni_bunting1", 66.0, 22.0)
    r.item("uni_bunting2", 222.0, 22.0)
    r.item("uni_poster3", 14.0, 200.0)              # west wall: CTF society poster
    r.item("balloons1", 66.0, 196.0)                # walk-through, left of Jordan
    r.item("uni_banner_soc1", 70.0, 250.0)          # the society's pull-up banner
    # a second freshers' fair stall (a society's, purple cloth, leaflets and a sweet jar)
    # where the decor glass case stood: the foyer now reads as a fair, not a museum
    # orthogonal, front-on (round 2, user: the angled freshers_stall1 didn't match)
    r.table("freshers_stall2", 222.0, 253.0, kind="objects")
    # papers on the display: the ASCII chart first, then the tape (scenario order)
    r.on(display, "notes4", 0.17, 0.45, layer="conditional_table_items")
    r.on(display, "notes2", 0.86, 0.45, layer="conditional_table_items")
    r.on(stand, "briefcase11", 0.16, 0.45, layer="conditional_table_items")
    r.on(stand, "laptop6", 0.83, 0.40, layer="conditional_table_items")
    return r.build("room_uni_foyer")


def room_uni_lab():
    """
    2×2 GU computer teaching lab: three benches of PCs (four seats each) facing a
    front wall with a whiteboard and a projector screen, the lecturer's desk at
    the front right with a chair behind it, a photocopier at the back. Door: E on
    row 2; the aisle x 192-222 and the east lane stay clear. Nothing covers the
    bottom rows (no room to the south).
    Every PC has a static chair in front of it (hospital_chair_north, the
    building's seat): wheeled chair-* sprites are pushable and join taps, and a
    chair pushed against a claimed PC would raise a pick-one menu.
    Slots: the first two PCs in table_items (pc11, pc9) are the ones scenario
    `pc` objects claim, before the pc12 decor PCs.
    """
    r = _Uni()
    benches = []
    for feet in (124.0, 196.0, 268.0):
        benches.append((r.table("desk1", 36.0, feet), r.table("desk1", 114.0, feet)))
    (b1a, b1b), (b2a, b2b), (b3a, b3b) = benches
    lect = r.table("hospital_desk1", 222.0, 150.0)
    r.item("whiteboard2", 70.0, 50.0)
    r.item("projector_screen1", 122.0, 54.0)
    r.item("wall_clock1", 222.0, 46.0)
    r.item("uni_timetable1", 14.0, 140.0)           # west wall
    r.item("uni_poster7", 292.0, 140.0)             # east wall: no food or drink
    r.item("hospital_chair_south", 245.0, 118.0)    # lecturer's chair, behind the desk, facing the class
    r.item("photocopier1", 248.0, 264.0)
    r.item("bin8", 226.0, 264.0)
    seats = []                                      # (desk, x_frac) of every PC, for its chair
    # claimed PCs first, at the aisle end of the first two benches
    r.on(b1b, "pc11", 0.80, 0.30)
    r.on(b2b, "pc9", 0.80, 0.30)
    seats += [(b1b, 0.80), (b2b, 0.80)]
    for desk, xf in ((b1a, 0.30), (b1a, 0.78), (b1b, 0.30), (b2a, 0.30), (b2a, 0.78), (b2b, 0.30),
                     (b3a, 0.30), (b3a, 0.78), (b3b, 0.30), (b3b, 0.80)):
        r.on(desk, "pc12", xf, 0.30)
        seats.append((desk, xf))
    for desk, xf in seats:                          # a chair in front of each PC, seen from behind
        r.item("hospital_chair_north", desk["x"] + xf * desk["width"] - 8.0, desk["y"] + 24.0)
    r.on(lect, "laptop1", 0.35, 0.40)
    r.on(lect, "office-misc-lamp3", 0.85, 0.20)
    return r.build("room_uni_lab")


def room_uni_common():
    """
    2×2 GU student common room: noticeboard and society posters, a snack machine,
    student lockers with Locker 4 at the end (conditional, student_locker1), a
    kitchenette on a vinyl patch, a coffee station, a sofa round a low table and
    a high table, a wall TV, and a games corner by the W door: a foosball table
    seen from above (rods across, handles both sides) with Megan playing at its
    east side (scenario 3.1, 5.7 = x 99, feet 182; moved in round 2 from 2.4, 7.6,
    her ink names no spot) and a dartboard on the west wall. The sofa and low
    table sit below the foosball, clear of Megan's sprite (x 85-113, y 111-182)
    and of Cliffe (5.3, 7.4 = x 170, feet 237). Doors: W and E on row 2. The floor
    under the noticeboard and in front of the lockers stays clear; the bottom two
    rows may be covered.
    Slots (as-type): notice_board, vending_machine, student_locker, coffee_station;
    laptop1 on the high table (base laptop).
    """
    r = _Uni()
    counter = r.table("kitchen_counter_sink1", 230.0, 110.0, kind="objects")
    r.table("foosball_table2", 40.0, 196.0, kind="objects")  # games corner, x 40-88; body y 182-196
    low = r.table("smalldesk1", 106.0, 250.0)      # low table beside the sofa, west of Cliffe
    high = r.table("smalldesk1", 220.0, 240.0)
    r.item("notice_board1", 68.0, 54.0)  # 4px lower: keeps its top in reach from the floor
    r.item("uni_poster2", 116.0, 46.0)
    r.item("uni_poster3", 136.0, 46.0)
    r.item("uni_tv1", 166.0, 48.0)                  # wall TV above the lockers
    r.item("hot_water_boiler1", 236.0, 56.0)
    # east wall: the foyer's call point is on the other face of the west wall
    r.item("fire_alarm_point1", 292.0, 132.0)
    r.item("vending_machine1", 114.0, 130.0)
    r.item("student_lockers1", 160.0, 132.0)
    r.item("student_locker1", 210.0, 132.0, layer="conditional_items")  # Candidate Locker 4
    r.item("coffee_station1", 258.0, 172.0)
    r.item("uni_sofa2", 44.0, 252.0)               # below the foosball (bottom 196); front-on (round 3)
    r.item("uni_dartboard1", 13.0, 156.0)          # west wall, below the door row, by the foosball
    # no chair east of the low table: Cliffe stands there (scenario position 5.3, 7.4)
    r.on(counter, "kettle1", 0.25, 0.25)
    r.on(counter, "mugs_tray1", 0.70, 0.30)
    r.on(low, "office-misc-cup2", 0.5, 0.35)
    r.on(high, "laptop1", 0.70, 0.40, layer="conditional_table_items")
    return r.build("room_uni_common")


def room_uni_corridor():
    """
    2×1 GU (10×6) Computing corridor. A 10×10 room to the south covers the bottom
    two rows, so only y 64-128 is floor and the corridor has no free-standing
    furniture: recessed lockers, the department noticeboard with a poster slot
    pinned on it, pigeonholes, a wall drop box with its tag, a fire point and a
    narrow side-wall directory by the E door; round 2 adds a radiator under the
    poster, a wall drinking fountain and a FIRE DOOR KEEP SHUT sign by the
    workshop door (all wall items, x < 256, clear of the NE door corner).
    Doors: S (SW corner), N (NE corner), W and E on row 2.
    Slots: notes6 then notes3 (conditional notes), pigeonholes1, drop_box1
    (conditional), uni_directory1 (as-type for each).
    """
    r = _Uni()
    r.item("student_lockers1", 58.0, 74.0)          # recessed: feet on the floor line
    r.item("notice_board1", 112.0, 50.0)
    r.item("pigeonholes1", 160.0, 52.0)
    r.item("uni_poster4", 192.0, 46.0)
    r.item("uni_radiator1", 191.0, 58.0)            # under the poster, above the skirting
    r.item("uni_fountain1", 242.0, 58.0)            # wall drinking fountain by the workshop door
    r.item("uni_firedoor_sign1", 243.0, 30.0)       # FIRE DOOR KEEP SHUT, for the workshop door
    # the only floor piece: a walk-through wet-floor sign by the W end, below the
    # W door's row (y 64-96) and clear of the S door's column (x 32-64 at the bottom)
    r.item("wet_floor_sign1", 70.0, 124.0)
    r.item("fire_alarm_point1", 14.0, 128.0)        # west wall
    # east wall, just below the door row. 16x18, so its top-left (the tap anchor)
    # is 32px from the E door's centre (304, 80): a click in the open doorway
    # moves the player instead of opening the directory
    r.item("uni_directory1", 292.0, 128.0)
    r.item("notes6", 114.0, 54.0, layer="conditional_items")   # poster on the noticeboard
    r.item("drop_box1", 220.0, 54.0, layer="conditional_items")
    r.item("notes3", 226.0, 59.0, layer="conditional_items")   # tag on the drop box
    return r.build("room_uni_corridor", "10x6_hall")


def room_uni_library():
    """
    4×1 GU (20×6) library. Round 2 doubled it westwards (the E door, the N door to
    Special Collections and every neighbour stay where they were in world space;
    check_door_alignment.py), so it reads as a library rather than a desk.

    East half (x 320-640), front of house: recessed shelves, the LIBRARY sign, the
    issue and returns counter (two desks) under a RETURNS sign, the librarian's
    chair, a self-service kiosk. The teaching lab's north wall covers this half
    below y 128, so gameplay stays in y 64-128; the walk from the E door to the N
    door (NE corner, x 576-608) is clear.
    West half (x 0-320), reading room: nothing to the south, so y 64-160 is floor
    and the bottom row is the room's own south wall. A periodicals stand and
    shelves along the back wall, study carrels under a STUDY AREA sign, a long
    reading table with green lamps and chairs on its north side, a returns trolley.

    Slots: book1 on the returns end of the counter, notes4 on the next desk along,
    their top-left corners 32px+ from each other's centres so a tap opens one
    object, not a pick-one menu (round 1 had them 15px apart). No base-type book or
    notes decor anywhere in this map: it would be claimed before the real slots.
    """
    r = _Uni()
    # -- east half: front of house
    issue = r.table("hospital_desk2", 420.0, 124.0)      # issue desk, librarian's side
    returns = r.table("hospital_desk2", 482.0, 124.0)    # returns end of the counter
    for x in (336.0, 379.0, 422.0):
        r.item("bookcase", x, 74.0)                      # recessed shelves
    r.item("uni_sign_library1", 500.0, 34.0)
    r.item("uni_sign_returns1", 486.0, 50.0)             # under the LIBRARY sign, over the returns end
    r.item("hospital_chair_south", 398.0, 110.0)         # the librarian's chair
    r.item("checkin_kiosk1", 546.0, 120.0)               # self-service kiosk, west of the N door lane
    # -- west half: reading room
    r.item("periodicals_rack1", 34.0, 76.0)              # against the back wall
    for x in (84.0, 127.0, 170.0):
        r.item("bookcase", x, 74.0)
    r.table("study_carrels1", 222.0, 104.0, kind="objects")  # two booths, panels against the wall; solid
    r.item("uni_sign_study1", 228.0, 31.0)
    r.item("uni_radiator1", 286.0, 58.0)                 # under the window-less end of the wall
    reading_a = r.table("desk1", 52.0, 152.0)            # long reading table: two desks end to end
    reading_b = r.table("desk1", 130.0, 152.0)
    for x in (74.0, 112.0, 152.0, 190.0):
        r.item("hospital_chair_south", x, 118.0)         # north side, tucked behind the table
    r.item("book_trolley1", 268.0, 150.0)                # returns waiting to be shelved
    r.on(reading_a, "bankers_lamp1", 0.30, 0.25)
    r.on(reading_b, "bankers_lamp1", 0.70, 0.25)
    r.on(reading_a, "journal_stack1", 0.80, 0.40)
    # scenario slots on the counter: the book first (base book), then the slip
    r.on(returns, "book1", 0.12, 0.35, layer="conditional_table_items")   # top-left x 480, centre 489
    r.on(returns, "notes4", 0.90, 0.50, layer="conditional_table_items")  # top-left x 524: 35px from the book
    r.on(issue, "office-misc-lamp4", 0.20, 0.20)
    r.on(issue, "pc7", 0.62, 0.30)                       # issue PC
    return r.build("room_uni_library", "20x6_hall")


def room_uni_office():
    """
    2×1 GU (10×6) academic's office: door card, a framed certificate, a recessed
    bookcase, a year planner, a desk against the wall with a PC, a handout slot
    and his chair, and a visitor's chair; below them a small meeting table (round
    3). Nothing is south of the office, so the whole floor (y 64-180) shows. Doors:
    W on row 2, N (NE corner); the W-to-N route along y 100-128 stays clear of
    anything solid (the chairs are walk-through items).
    Slots: notes1 on the desk. (The conditional whiteboard1 went when Sidhu's
    ledger board moved to the seminar room.)
    """
    r = _Uni()
    desk = r.table("smalldesk1", 194.0, 111.0)
    r.item("uni_doorcard1", 66.0, 50.0)
    r.item("uni_certificate1", 104.0, 44.0)         # his Hyperledger certification, framed
    r.item("bookcase", 142.0, 74.0)
    r.item("year_planner1", 192.0, 48.0)
    r.item("hospital_chair_north", 203.0, 126.0)    # his chair, in front of the desk
    r.item("hospital_chair2", 170.0, 120.0)         # visitor's chair, facing the desk
    # round 3: the lower half is visible floor (nothing south of the office), so a
    # small meeting table with two chairs, a fire point and extinguisher by the W
    # door, a research poster, a plant in the SW corner and a bin by the desk.
    # All below the W-to-N route (y 100-128) except the wall items; the plant's
    # leaves reach y 102 but only at x 32-70, below the W door row (y 64-96).
    meet = r.table("smalldesk1", 98.0, 172.0)       # x 98-148, top 131
    r.item("hospital_chair2", 78.0, 170.0)          # west side, faces east
    r.item("hospital_chair1", 152.0, 170.0)         # east side, faces west
    r.item("uni_poster8", 14.0, 152.0)              # west wall, below the door row: a chain of hashed blocks
    r.item("fire_alarm_point1", 292.0, 140.0)       # east wall
    r.item("fire_extinguisher1", 270.0, 176.0)      # under the call point
    r.item("plant-large11", 32.0, 178.0)
    r.item("bin8", 222.0, 142.0)                    # beside the desk, under the route's south edge
    r.on(meet, "office-misc-pens", 0.25, 0.35)
    r.on(meet, "office-misc-cup2", 0.70, 0.40)
    r.on(desk, "pc7", 0.35, 0.30)
    r.on(desk, "office-misc-cup", 0.60, 0.40)
    r.on(desk, "notes1", 0.82, 0.50, layer="conditional_table_items")
    return r.build("room_uni_office", "10x6_hall")


def room_uni_workshop():
    """
    2×2 GU maker space: a scoreboard screen and a build screen on the back wall,
    a safety sign, an island workbench inside the floor's hazard line, a parts
    rack against the wall, an electronics bench, binders, a cart, boxed stock and
    a cable on the floor. Door: S (SE corner, covered rows); the east lane
    x 250-288 and the floor under the screens (x 64-180, y 64-100) stay clear, as
    does the floor west of the island where Cliffe stands (x 50-130, y 153-233).
    Slots: conference_screen1 (as-type:conference_screen), smartscreen2 (base
    smartscreen: Dr Schreuders' build, drawn as a floor plan of the building),
    pc5 on the workbench.
    """
    r = _Uni()
    # Island in the middle with a clear walking ring (about x 100-208, y 116-222);
    # the machines stand against the back and west walls; the band y 222-256
    # stays clear from the east lane to Cliffe (x 90, feet 224).
    # round 3: every machine but the parts drawers is a front-on redraw (user: orthogonal props)
    bench = r.table("it_workbench2", 128.0, 198.0, kind="objects")
    r.table("laser_cutter2", 196.0, 128.0, kind="objects")       # back wall, top y 68
    # west wall, top to bottom: drawers, mill, 3D printer; all from x 32 so none
    # overhangs the side wall (round 2: the angled printer_3d1 at x 24 did)
    r.table("component_drawers1", 32.0, 140.0, kind="objects")
    r.table("cnc_mill2", 32.0, 196.0, kind="objects")
    r.table("printer_3d2", 32.0, 250.0, kind="objects")         # orthogonal, on its stand
    r.table("electronics_bench2", 208.0, 200.0, kind="objects")  # east of the island, off the lane
    r.item("conference_screen1", 70.0, 52.0)
    r.item("smartscreen2", 130.0, 50.0)             # the build: a live floor plan (was a landscape picture)
    r.item("pegboard_tools1", 182.0, 57.0)          # over the laser cutter
    r.item("uni_poster6", 240.0, 46.0)              # safety glasses must be worn
    r.item("fire_alarm_point1", 292.0, 132.0)       # east wall (round 3)
    r.on(bench, "pc5", 0.50, 0.30, layer="conditional_table_items")
    return r.build("room_uni_workshop")


def room_uni_lecture():
    """
    4×2 GU (20×10) lecture theatre: whiteboard and projector screen at the front,
    a demonstration bench and a lectern, four tiered rows of seats facing the
    front in two blocks (the tier lines are in the room_uni_lecture floor sheet).
    The seats are walk-through sprites. A writing ledge in front of each row and
    block (tables layer) makes the rows solid: a table's body is its bottom
    quarter inset 10px each side, so a ledge 20px wider than its seat block
    blocks exactly the seats and leaves the aisles open: west x 32-96, centre
    x 274-340, east x 572-608. (Object Layer 1 collision rectangles would be the
    tidier way, but rooms.js throws on them today: createRoom reads `room` before
    its declaration. Don't use build_room(collisions=...) until that is fixed.)
    Door: N (NW corner).
    Slots: whiteboard2 (as-type:whiteboard).
    """
    r = _Uni()
    demo = r.table("desk1", 240.0, 118.0)           # demonstration bench
    r.table("lectern1", 326.0, 118.0, kind="objects")
    r.item("exit_sign1", 80.0, 30.0)
    r.item("whiteboard2", 110.0, 50.0)
    r.item("projector_screen1", 276.0, 54.0)
    r.item("wall_clock1", 420.0, 46.0)
    r.item("uni_poster1", 500.0, 46.0)
    r.item("fire_alarm_point1", 612.0, 132.0)       # east wall
    for feet in (170.0, 202.0, 234.0, 266.0):
        # seat rows seen from behind (3 seats a sprite), 8px below the row line so
        # the backs just overlap their own ledge and the next ledge hides the legs
        for x in (92.0, 153.0, 214.0):
            r.item("lecture_seat_row1", x, feet + 8)
        for x in (334.0, 395.0, 456.0, 517.0):
            r.item("lecture_seat_row1", x, feet + 8)
        r.table("lecture_ledge1", 86.0, feet - 22, kind="objects")
        r.table("lecture_ledge2", 330.0, feet - 22, kind="objects")
    r.on(demo, "laptop6", 0.3, 0.40)
    r.on(demo, "office-misc-speakers", 0.75, 0.25)
    return r.build("room_uni_lecture", "20x10")


def room_uni_special():
    """
    2×2 GU Special Collections: a sign and the founder's portrait, a wall of
    bookcases, a reading table with lamps on the rug (painted in the floor
    sheet), chairs round it, and the archive safe (conditional). Door: S (SE
    corner, covered rows); the east lane x 256-288 stays clear.
    Slots: safe1 (conditional).
    """
    r = _Uni()
    # reading table on the rug (painted in the sheet at x 88-230, y 140-214)
    reading = r.table("hospital_conference_table", 96.0, 206.0)
    r.item("uni_sign_special1", 100.0, 40.0)
    r.item("uni_portrait1", 190.0, 46.0)            # the founder's portrait
    for x in (32.0, 75.0, 118.0, 161.0):
        r.item("bookcase", x, 120.0)                # top edge on y 70
    # orthogonal replacements (round 2, user: the angled case and chest looked odd)
    r.table("plan_chest2", 206.0, 116.0, kind="objects")    # beside the shelves, back to the wall
    r.table("display_case3", 34.0, 250.0, kind="objects")   # 1970s media under glass, by the west wall
    r.item("hospital_chair_south", 134.0, 150.0)    # north side, facing the table
    r.item("hospital_chair_south", 184.0, 150.0)
    r.item("hospital_chair1", 224.0, 200.0)         # east end, faces west
    r.item("safe1", 224.0, 252.0, layer="conditional_items")  # by the door, off the east lane
    r.on(reading, "bankers_lamp1", 0.2, 0.20)
    r.on(reading, "bankers_lamp1", 0.8, 0.20)
    r.on(reading, "book1", 0.5, 0.40)
    return r.build("room_uni_special")


def room_uni_seminar():
    """
    2×2 GU seminar room: windows with blinds either side of a whiteboard, a long
    table with chairs round it, a flip chart and a water cooler. Door: S (SE
    corner, covered rows); the east lane x 256-288 and the floor under the
    whiteboard stay clear.
    Slots: whiteboard1 (as-type:whiteboard).
    """
    r = _Uni()
    table = r.table("hospital_conference_table", 90.0, 206.0)
    r.item("window_blinds1", 70.0, 50.0)
    r.item("whiteboard1", 130.0, 50.0)
    r.item("window_blinds1", 196.0, 50.0)
    for x in (104.0, 145.0, 186.0):
        r.item("hospital_chair_south", x, 150.0)    # north side, facing the table
        r.item("hospital_chair_north", x, 232.0)    # south side, seen from behind
    r.item("hospital_chair2", 70.0, 200.0)          # west end, faces east
    r.item("hospital_chair1", 220.0, 200.0)         # east end, faces west
    r.item("flip_chart1", 44.0, 130.0)
    r.item("water_cooler1", 40.0, 250.0)
    r.item("beanbag_teal1", 196.0, 252.0)           # reading-group bean bags, clear of the east lane
    r.item("beanbag_orange1", 228.0, 248.0)
    # round 3: radiators under the windows, a clock, a fire point on the east wall,
    # a stack of spare chairs and the room's booking sheet. Sidhu stands at
    # (6.75, 3.7) = x 216, feet 118, so the NE floor stays clear.
    # The radiators touch the blinds' bottom pixel row (sill), deliberately.
    r.item("uni_radiator1", 77.0, 59.0)
    r.item("uni_radiator1", 203.0, 59.0)
    r.item("wall_clock1", 252.0, 46.0)
    r.item("fire_alarm_point1", 292.0, 132.0)
    r.item("uni_timetable1", 14.0, 196.0)           # west wall: the room's booking sheet
    r.item("chairs_stacked1", 72.0, 252.0)          # spare chairs, between the cooler and the south row
    r.on(table, "office-misc-pens", 0.3, 0.35)
    r.on(table, "mugs_tray1", 0.7, 0.35)
    r.on(table, "journal_stack1", 0.5, 0.30)
    return r.build("room_uni_seminar")


def room_uni_staff():
    """
    4×2 GU (20×10) open-plan staff office: three face-to-face desk pods (each two
    desk1 joined, a chair on the north and south side), a staff kitchenette in
    the NE corner with pigeonholes over it, a coffee table, a photocopier, a
    bookcase and a filing cabinet, windows with blinds, a noticeboard, a year
    planner, a clock and a "COMPUTING / STAFF ONLY" sign. Door: W on row 2
    (y 64-128 stays clear from the door to x 110). Nothing covers the bottom rows.
    No scenario slots: decor only. The chairs are static (hospital_chair_*), so
    they never join an NPC's pick-one menu.

    Staff desks and standing spots (feet), for NPCs added later
    (ROOMS_PLAN.md section 13):
      pod P1 x 120-198, P2 x 270-348, P3 x 420-498; desk A (north, faces the
      wall) feet 150, desk B (south) feet 189.
      oleg          P1-B (his, occupied)  stand (234, 226)
      staff_slot_2  P1-A / P2-A           stand (234, 140)
      staff_slot_3  P2-A / P3-A           stand (384, 140)
      staff_slot_4  P2-B / P3-B           stand (384, 226)
      staff_slot_5  P3-A, kitchen side    stand (540, 150)
      staff_slot_6  P1-B, west side       stand (60, 226)
    Each spot keeps an NPC's sprite (x-40..x+40, feet-71..feet+9) off the
    other spots and off the clutter.
    """
    r = _Uni()
    pods = []
    for x in (120.0, 270.0, 420.0):
        a = r.table("desk1", x, 150.0)              # desk A, staff sits on its north side
        b = r.table("desk1", x, 189.0)              # desk B, joined below, sits on its south side
        pods.append((a, b))
        r.item("hospital_chair_south", x + 31.0, 118.0)   # behind desk A, facing south
        r.item("hospital_chair_north", x + 31.0, 214.0)   # in front of desk B, facing north
    counter = r.table("kitchen_counter_sink1", 500.0, 110.0, kind="objects")
    fridge = r.table("undercounter_fridge1", 547.0, 110.0, kind="objects")
    coffee = r.table("smalldesk1", 548.0, 250.0)    # coffee table in the SE corner
    # back wall
    r.item("uni_sign_staff1", 72.0, 34.0)
    r.item("window_blinds1", 150.0, 50.0)
    r.item("notice_board1", 200.0, 50.0)
    r.item("window_blinds1", 284.0, 50.0)
    r.item("year_planner1", 334.0, 48.0)
    r.item("wall_clock1", 388.0, 46.0)
    r.item("window_blinds1", 424.0, 50.0)
    r.item("hot_water_boiler1", 504.0, 56.0)
    r.item("pigeonholes1", 540.0, 52.0)
    r.item("fire_alarm_point1", 612.0, 132.0)      # east wall
    # floor against the back wall, in the gaps between the pods
    r.item("photocopier1", 216.0, 116.0)
    r.item("bookcase", 352.0, 120.0)
    r.item("filing_cabinet", 395.0, 124.0)
    r.item("coffee_station1", 572.0, 111.0)
    # staff clutter
    r.item("bag18", 110.0, 205.0)                   # Dr Illiashenko's bag, by his desk
    r.item("bag12", 500.0, 205.0)                   # beside P3-B, not loose mid-floor
    r.item("bin8", 40.0, 290.0)
    r.item("plant-large12-top-ani1", 120.0, 306.0)  # floor plants along the uncovered bottom edge
    r.item("plant-large11-top-ani3", 470.0, 306.0)
    r.item("coat_stand1", 590.0, 200.0)
    r.item("hospital_chair2", 528.0, 248.0)         # at the coffee table, facing east
    # desk tops: P1-B is Dr Illiashenko's (occupied: PC, lamp, mug, binders, phone)
    (a1, b1), (a2, b2), (a3, b3) = pods
    r.on(b1, "pc7", 0.40, 0.30)
    r.on(b1, "office-misc-lamp3", 0.88, 0.18)
    r.on(b1, "office-misc-cup", 0.70, 0.42)
    r.on(b1, "binders1", 0.10, 0.25)
    r.on(b1, "phone4", 0.85, 0.48)
    for desk, extra in ((a1, "office-misc-pens"), (a2, "office-misc-box1"), (b2, "office-misc-smallplant3"),
                        (a3, "mugs_tray1"), (b3, "office-misc-pens")):
        r.on(desk, "pc12", 0.40, 0.30)
        r.on(desk, extra, 0.80, 0.30)
    r.on(counter, "kettle1", 0.25, 0.25)
    r.on(counter, "dirty_mugs1", 0.70, 0.36)
    r.on(fridge, "microwave1", 0.5, 0.18)
    r.on(coffee, "mugs_tray1", 0.5, 0.35)
    return r.build("room_uni_staff", "20x10")


# ---------------------------------------------------------------------------
# Zero Day Syndicate's offices (m03 "Ghost in the Machine"). The firm trades as
# "WhiteHat Security Services": a polished consultancy front (reception,
# conference room, a consultant's office, the CEO's office) over a server room
# that is the real business. Walls and floors: room_gen/make_zds_tileset.py.
# These maps are m03's own, so m01's room_office/room_reception/room_servers and
# the shared room_ceo are untouched. Coordinates: x = left edge, y = feet.
# ---------------------------------------------------------------------------

def room_zds_reception():
    """
    2×2 GU lobby. Back wall: a trophy cabinet of industry awards by the N door, a
    walnut slat feature wall (painted into room_zds_lobby, x 110-224) carrying the
    WHITEHAT sign over a long black reception counter with a cyan light strip, the
    founding plaque east of it, a CCTV camera. A charcoal rug (in the sheet)
    anchors the waiting area. Floor: a brochure rack by
    the west wall, the hat-mark inlay (160, 200) kept clear for the spawn, a
    waiting area along the south edge (black leather sofa facing a glass coffee
    table, a club chair either side facing in), a bean-to-cup coffee machine,
    concrete planters with fig trees in the south corners.
    Door: N (NW corner, kept clear to y 96). Nothing to the south. The
    receptionist (ffion_rees) stands at (7.5, 4.9), clear floor right of the counter.
    Cycle 2 (2026-10-12): the counter grew from 63 to 110 px, the slat wall went
    behind it, the threat map moved to the corridor, the waiting area moved to the
    south edge and the plaque moved off the desk span so it stays in reach.
    Slots (as-type): plaque (Company Founding Plaque), uni_directory on the west
    wall below the door row (Building Directory).
    """
    r = _Uni()
    desk = r.table("reception_counter1", 112.0, 116.0, kind="objects")  # x 112-222, top 72
    r.item("trophy_cabinet1", 66.0, 84.0)            # awards, against the back wall by the N door (decor, no tap)
    r.item("whitehat_sign1", 135.0, 40.0)            # on the slat wall, over the counter
    # founding plaque east of the slat wall: 32px+ from the N door's tap point (cycle 3,
    # regression B2 F-1: at x 70 it shared a pick-one menu with the door) and clear of
    # the counter, so it is in reach from the floor in front of it (x 226-254, y 64-90)
    r.item("plaque1", 230.0, 52.0)
    r.item("cctv_camera1", 280.0, 32.0)              # watching the lobby
    # west wall, centred on the line a player walks up to it (y 126-146): in range
    # (13-24 px) from anywhere along it, not just at the edge (regression R-2)
    r.item("uni_directory1", 14.0, 146.0)
    r.item("brochure_rack1", 36.0, 204.0)            # "our services" brochures, under the directory
    r.item("fire_alarm_point1", 292.0, 132.0)        # east wall
    r.item("fire_extinguisher1", 274.0, 166.0)       # under the call point
    r.item("coffee_station1", 262.0, 230.0)          # bean-to-cup, east side
    # waiting area along the south edge, below the inlay (y 176-224)
    r.item("leather_sofa1", 129.0, 266.0)            # faces the table, back to the inlay
    r.table("glass_coffee_table1", 134.0, 302.0, kind="objects")
    r.item("club_chair_e1", 90.0, 300.0)             # west of the table, facing in
    r.item("club_chair_w1", 194.0, 300.0)            # east of the table, facing in
    r.item("planter_fig1", 36.0, 300.0)              # SW corner (decor band)
    r.item("planter_fig1", 262.0, 300.0)             # SE corner (decor band)
    r.on(desk, "phone4", 0.16, 0.36)
    r.on(desk, "usb_bowl1", 0.80, 0.36)              # a bowl of branded USB sticks, help yourself
    return r.build("room_zds_reception")


def room_zds_conference():
    """
    2×2 GU boardroom on room_zds_boardroom (charcoal rug, cyan inner line, under
    the table and chairs). Back wall: blinds either side of a whiteboard and a
    wall screen with the firm's deck. A black credenza with a phone and an orchid
    under the west blinds, a fig in a concrete planter, a long walnut table with
    black leather chairs on its north side and swivel chairs seen from behind on
    its south, a flip chart at its east end, a drinks trolley below the E door
    row. Door: E on row 2 (y 64-100 kept clear at x 256+).
    Nothing to the south. Victoria Sterling stands at (5, 4) (feet about y 116),
    between the whiteboard and the table, where the ink has her
    clone-at-the-whiteboard beat; the floor under the whiteboard (x 96-140,
    y 64-100) stays clear.
    Slots: whiteboard1 (as-type:whiteboard, Conference Whiteboard), notes1 on the
    table (Presentation Materials).
    """
    r = _Uni()
    table = r.table("zds_conference_table1", 70.0, 276.0, kind="objects")  # x 70-196, top 221
    r.item("window_blinds1", 36.0, 50.0)
    r.item("whiteboard1", 96.0, 52.0)
    r.item("conference_screen1", 152.0, 52.0)
    r.item("window_blinds1", 216.0, 50.0)
    r.item("credenza1", 32.0, 112.0)                 # under the west blinds, x 32-94
    r.item("planter_fig1", 36.0, 214.0)              # west side, beside the rug
    for x in (84.0, 117.0, 150.0):
        r.item("exec_chair_black1", x, 238.0)        # north side, facing the viewer
    for x in (78.0, 152.0):
        # south side, seen from behind. exec_chair_back1 is a static copy of
        # chair-exec-rotate5: swivel chair-* sprites are tappable and joined the
        # Presentation Materials pick-one menu (regression B2 F-3)
        r.item("exec_chair_back1", x, 306.0)
    r.item("bar_cart1", 246.0, 158.0)                # drinks trolley for client pitches, below the E door row
    r.item("flip_chart1", 210.0, 238.0)              # at the table's east end, where a pitch is given
    r.item("fig_plant1", 262.0, 300.0)
    r.item("fire_alarm_point1", 14.0, 140.0)         # west wall
    r.item("power_panel1", 290.0, 152.0)             # east wall below the door row: AV and lighting control
    r.on(table, "notes1", 0.14, 0.40, layer="conditional_table_items")
    r.on(table, "phone4", 0.42, 0.34)                # conference phone
    r.on(table, "office-misc-cup2", 0.60, 0.40)
    r.on(table, "exec_laptop1", 0.82, 0.40)
    return r.build("room_zds_conference")


def room_zds_office():
    """
    2×2 GU consultant's office (Danny Foster's): a whiteboard of network
    diagrams, framed certifications, a bookcase with a pile of books beside it,
    binder shelves, blinds; his desk on the west side with the PC, a cluster of
    coffee cups and a family photo, a side table with his performance review and
    a dying plant, a mini fridge; a camp bed with pizza boxes and energy-drink
    cans beside it (he has been living here), a small lab rack, a coat stand.
    Door: N (NW corner, kept clear to y 96). Nothing to the south. Danny stands at
    (6.5, 4) on clear floor, towards the top right.
    Slots: pc8 on the desk (base pc, Danny's Workstation), picture5 on the desk
    (as-type:picture, Family Photo; no other picture* in this map), notes1 on the
    side table (Performance Review).
    """
    r = _Uni()
    desk = r.table("desk1", 36.0, 180.0)             # x 36-114, top 141
    side = r.table("smalldesk2", 132.0, 182.0)       # x 132-164: review 32px+ from the photo
    r.item("whiteboard1", 72.0, 52.0)
    r.item("uni_certificate1", 126.0, 36.0)
    r.item("uni_certificate1", 126.0, 54.0)
    r.item("bookcase", 150.0, 76.0)
    r.item("book_pile1", 96.0, 82.0)                 # overflow, stacked against the wall under the whiteboard
    r.item("window_blinds1", 200.0, 50.0)
    r.item("binder_shelves1", 244.0, 84.0)
    r.item("chair-grey-1", 62.0, 156.0)              # his chair, behind the desk
    r.item("mini_fridge1", 168.0, 182.0)             # beside the side table
    r.item("servers4", 262.0, 146.0)                 # a small lab rack by the east wall
    r.item("camp_bed1", 222.0, 272.0)                # he has been sleeping here
    r.item("pizza_boxes1", 192.0, 282.0)
    r.item("energy_cans1", 196.0, 252.0)
    r.item("cable_tangle1", 118.0, 204.0)            # spare leads under the desk's end
    r.item("bin8", 40.0, 214.0)
    r.item("plant-large11", 34.0, 300.0)
    r.item("coat_stand1", 270.0, 220.0)
    r.item("fire_alarm_point1", 292.0, 132.0)        # east wall
    r.on(desk, "office-misc-lamp4", 0.07, 0.22)      # his desk lamp: the only light in the night scene
    r.on(desk, "pc8", 0.28, 0.30)                    # further from the photo (regression R-4)
    r.on(desk, "picture5", 0.88, 0.36)
    r.on(desk, "coffee_cups1", 0.62, 0.42)
    r.on(side, "notes1", 0.5, 0.40, layer="conditional_table_items")
    r.on(side, "wilted_plant1", 0.80, 0.22)
    return r.build("room_zds_office")


def room_zds_ceo():
    """
    2×2 GU CEO's office (Victoria Sterling's): walnut parquet with a navy and gold
    rug, a mahogany desk with a leather chair, blinds either side of her own
    portrait, a bookcase, a locked steel filing cabinet in the NE corner, a drinks
    cabinet, a floor globe, her magazine cover framed on the east wall, a black
    leather sofa and glass coffee table, two visitor chairs facing the desk, a
    second trophy cabinet. Door: S (SE corner); a hallway is to the south, so feet
    stay above y 256 and the x 248-292 lane up from the door stays clear.
    Slots: filing_cabinet_locked1 (as-type, Filing Cabinet), pc11 on the desk
    (base pc, Executive Computer; left end, so its top-left is 32px+ from the
    drawer's centre), exec_desk_drawer1 laid exactly over the desk's right
    pedestal (as-type, Desk Drawer).
    """
    r = _Uni()
    desk = r.table("exec_desk_mahogany1", 130.0, 160.0, kind="objects")  # x 130-190, top 107
    r.item("bookcase", 36.0, 76.0)
    r.item("window_blinds1", 88.0, 50.0)
    r.item("victoria_portrait1", 144.0, 54.0)        # her own portrait, behind her chair
    r.item("window_blinds1", 192.0, 50.0)
    r.item("filing_cabinet_locked1", 256.0, 84.0)    # NE corner
    r.item("magazine_cover1", 290.0, 150.0)          # east wall: her on a business magazine cover
    r.item("drinks_cabinet1", 36.0, 150.0)           # decanters, west side
    r.item("floor_globe1", 212.0, 152.0)             # east of the desk, off the rug
    r.item("leather_sofa1", 40.0, 230.0)             # seating area, bottom left
    r.table("glass_coffee_table1", 110.0, 240.0, kind="objects")
    # visitor chairs facing the desk, seen from behind: static copies, so neither joins
    # the Desk Drawer's pick-one menu (regression B2 F-2/F-3)
    r.item("exec_chair_back1", 124.0, 218.0)
    r.item("exec_chair_back1", 160.0, 218.0)
    r.item("trophy_cabinet1", 214.0, 250.0)          # more awards, west of the door lane
    r.on(desk, "pc11", 0.25, 0.32)
    # the drawer overlay: the desk's own right pedestal (sprite x 43-58, y 35-49)
    r.conditional_table_items.append(make_obj("objects", "exec_desk_drawer1", 130.0 + 43, 107.0 + 50, r._next()))
    return r.build("room_zds_ceo")


def room_zds_servers():
    """
    2×2 GU server room, the real business: slate walls, raised floor with two
    perforated cold aisles (rows y 96-128 and 192-224) in front of two rack rows,
    a cable tray over the back row, a wall screen showing the exploit
    marketplace's live board, a wall safe and a whiteboard; the operator's
    brushed-steel desk with the VM terminal, a steel ops bench with the decoding
    laptop and the drop-site terminal, a KVM cart, a precision air-con unit, gas
    suppression. Door: S (SE corner); feet stay above y 256 and the x 248-292
    lane up from the door stays clear.
    Slots: filing_cabinet_locked1 (as-type, Filing Cabinet), safe4 on the back
    wall (base safe, Wall Safe), whiteboard2 (as-type:whiteboard, Server Room
    Whiteboard), pc10 on the operator desk (as-type:pc, VM Access Terminal), workstation and flag-station
    on the bench (top-lefts 32px+ from each other's centres).
    """
    r = _Uni()
    # back row against the wall
    r.item("filing_cabinet_locked1", 36.0, 86.0)
    r.item("server_rack1", 68.0, 84.0)
    r.item("server_rack2", 98.0, 86.0)
    r.item("storage_array1", 128.0, 86.0)
    r.item("cable_tray1", 36.0, 26.0)                # over the back row
    r.item("market_board1", 164.0, 48.0)             # the marketplace's live board
    r.item("safe4", 214.0, 56.0)                     # wall safe
    r.item("whiteboard2", 244.0, 54.0)
    # middle row, west half (racks face the second cold aisle)
    r.item("ups_cabinet1", 32.0, 182.0)
    r.item("server_rack2", 64.0, 184.0)
    r.item("network_rack1", 94.0, 184.0)
    r.item("storage_array1", 128.0, 184.0)
    r.item("server_rack1", 158.0, 182.0)
    # operator desk, east, below the clear floor under the wall fixtures
    op = r.table("zds_desk3", 206.0, 178.0, kind="objects")   # x 206-257, top 139
    # the VM terminal is a black-bezel monitor (pc10) claimed by as-type:pc, not the
    # pink vm-launcher sprite, which looked like a toy in this room (cycle 6)
    r.item("chair-darkgray-1", 222.0, 152.0)
    # ops bench, south-west
    bench = r.table("zds_desk1", 96.0, 246.0, kind="objects")  # x 96-174, top 207
    r.item("kvm_cart1", 180.0, 252.0)
    r.item("aircon_unit1", 220.0, 254.0)             # precision cooling, west of the door lane
    r.item("suppression_cylinders1", 36.0, 252.0)
    r.item("suppression_panel1", 14.0, 230.0)        # west wall, by the cylinders
    r.item("restricted_sign1", 162.0, 59.0)          # RESTRICTED plate under the marketplace board
    # the production row is fenced on the floor by a hazard line (room_zds_raised)
    r.on(op, "pc10", 0.45, 0.45, layer="conditional_table_items")   # top-left y 128, where the old terminal was reached
    r.on(bench, "workstation", 0.18, 0.36, layer="conditional_table_items")
    r.on(bench, "flag-station", 0.85, 0.36, layer="conditional_table_items")
    return r.build("room_zds_servers")


def room_zds_hall():
    """
    2×1 GU (10×6) corridor for m03's two hallways (main_hallway and
    executive_wing_hallway share it). Stone floor and white walls with the brand
    line (room_zds_hall). A 10×10 room to the south covers the bottom two rows, so
    only y 64-128 is floor and everything stands against the back wall or hangs on
    it: the live threat map, the WHITEHAT sign, a water cooler, a fig in a
    concrete planter and a fire point.
    Doors: N (NE corner, x 256-288 kept clear), S (SW corner), W and E on row 2.
    The night guard's patrol in the executive wing (tiles (6,3), (3,4), (5,3))
    runs through y 96-128, clear of the wall pieces (feet 74-76).
    No scenario slots.
    """
    r = _Uni()
    r.item("threat_map1", 40.0, 54.0)
    r.item("whitehat_sign1", 100.0, 40.0)
    r.item("fire_alarm_point1", 172.0, 52.0)
    r.item("water_cooler1", 192.0, 74.0)
    r.item("planter_fig1", 220.0, 76.0)
    return r.build("room_zds_hall", "10x6_hall")


def room_zds_hall_exec():
    """
    2×1 GU (10×6) executive-wing corridor (m03 executive_wing_hallway): the quiet,
    carpeted end of the building, no brand sign. A burgundy runner down the
    corridor (in the sheet, y 82-114), a walnut sideboard against the wall, a
    clock and a framed print, a fire point, and a PRIVATE plate by the NE door to
    the CEO's office. A 10×10 room to the south covers all but y 64-128, so
    everything is on or against the back wall.
    Doors: N (NE corner, x 256-288 clear), S (SW corner), W and E on row 2. The
    night guard (terry_mott) patrols tiles (6,3), (3,4), (5,3) along the runner,
    in front of the wall pieces (he carries a torch at night).
    No scenario slots.
    """
    r = _Uni()
    r.item("fire_alarm_point1", 40.0, 52.0)
    r.item("sideboard1", 58.0, 78.0)                 # walnut sideboard with water and glasses (the boardroom has the black credenza)
    r.item("wall_clock1", 120.0, 46.0)
    r.item("picture10", 160.0, 46.0)
    r.item("private_sign1", 218.0, 42.0)             # beside the CEO's door (NE, x 256+)
    # no floor planter: Terry's waypoints (x 80-208, feet 84-116) would stand him on it
    return r.build("room_zds_hall_exec", "10x6_hall")


# ---------------------------------------------------------------------------
# Albion Energy Storage (m04 "Critical Failure"): a 200 MWh grid battery site on
# a night shift. Walls and floors: room_gen/make_aes_tileset.py; hand-drawn signs
# and the shutter: room_gen/make_aes_props.py; plant (racks, inverters,
# switchgear, generator, BMS cabinet, ESD station, dial thermometer, gas
# detector...): PixelLab, aes_* objects. These maps are m04's own, so the shared
# room_battery_hall, room_it, room_control_1x2gu, room_office, room_reception and
# small_room_1x1gu (used by sis02, m01 and others) are untouched.
# Coordinates: x = left edge, y = feet.
# ---------------------------------------------------------------------------

def _rack_row(r, x0, feet, count):
    """A row of the original dark battery stacks (batrack, 32x72, drawn from photos;
    user, 2026-10-13: kept in preference to new art) from x0, with one collision strip
    along the row's base so the row is solid (a batrack's own table body is only 12 px
    wide, which left 20 px gaps a player could slip through). The stack above the base
    is walk-behind. Returns the x after the row."""
    for i in range(count):
        r.table("batrack", float(x0 + 32 * i), float(feet), kind="objects")
    r.collision(float(x0 + 2), float(feet - 16), float(32 * count - 4), 16.0)
    return x0 + 32 * count


def _rack_block(r, x0, rows, count):
    """Overlapping rows of batrack from x0 at the given feet. The stacks are drawn
    walk-behind, but the block is solid from the first row's base to the last row's
    (cycle 4, review F2: 20 px corridors between overlapping rows read as a bug), so
    the only walk-behind lane is the one in front of the block's top."""
    for feet in rows:
        _rack_row(r, x0, feet, count)
    r.collision(float(x0 + 2), float(rows[0] - 16), float(32 * count - 4), float(rows[-1] - rows[0] + 16))


def room_aes_hall1():
    """
    4×2 GU (20×10) Battery Hall 1: Rack Bank C, packed blocks of the original dark
    battery stacks (batrack). Grey epoxy floor with trunking, drains, door wear, a
    yellow line along the back-wall kit and hatched keep-clear borders
    (room_aes_hall1_w/_e).
    Doors: W and E on row 2 (y 64-100), S in the SW corner (x 32-64); the workshop
    covers cols 0-9 below y 256.
    Cycle 3 (user: fill the door row too; stacks collide only at the base, so the
    player can walk behind them): low kit stands along the back wall (feet 84-88) in
    the gaps between the readable fixtures; the west block (x 108-300) and the east
    block (x 456-584) start at feet 166, so their tops (y 94) overhang the lane along
    the back wall and a player walking it is half hidden behind the stacks. The lane
    y 88-148 is walkable wall to wall.
    Kept clear for Cipher (operative_cipher): his waypoints (12,7), (12,3), (13,3),
    (10,3) (sprite centres x 320-416) are on open floor x 300-456 from the back wall
    to y 256; nothing overhangs them, so he stays in view for timing the crossing.
    Kept clear for reading: the floor under the dial (x 56-100), the status display
    (x 218-264), the H2 detector (x 378-412) and the process diagram (x 462-524).
    Kept clear for walking: the W and E door mouths, the S-door lane x 32-64.
    Slots (as-type): aes_dial_thermometer, aes_status_display, aes_gas_detector,
    aes_process_diagram, aes_round_terminal.
    """
    r = _Uni()
    # rack blocks (72 tall): west 3 rows of 6, east 4 rows of 4
    _rack_block(r, 108, (166, 202, 238), 6)           # Rack Bank C, x 108-300
    _rack_block(r, 456, (166, 202, 238, 278), 4)      # x 456-584
    # back wall
    r.item("aes_ppe_sign1", 38.0, 52.0)
    r.item("aes_dial_thermometer1", 66.0, 56.0)       # top-left 66,33
    r.item("aes_bank_c_sign1", 104.0, 34.0)
    r.item("aes_vent_fan1", 186.0, 48.0)
    r.item("aes_status_display1", 228.0, 54.0)        # top-left 228,34
    r.item("aes_hv_danger1", 272.0, 50.0)
    r.item("aes_gas_detector2", 386.0, 58.0)          # top-left 386,31 (cycle 6 swap; was aes_h2_detector1 at 388,34)
    r.item("aes_vent_fan1", 410.0, 48.0)              # the ventilation outlet over the open floor
    r.item("aes_process_diagram1", 470.0, 52.0)
    r.item("aes_cctv1", 556.0, 32.0)
    r.item("aes_beacon1", 586.0, 44.0)
    # low kit along the back wall, in the gaps between the fixtures a player reads
    r.solid("aes_spill_cabinet1", 106.0, 86.0)
    r.solid("aes_combiner2", 132.0, 86.0)
    r.solid("aes_drum1", 156.0, 86.0)
    r.solid("aes_ppe_cabinet1", 178.0, 88.0)
    r.solid("aes_air_mover1", 268.0, 88.0)
    r.solid("aes_spill_kit1", 528.0, 88.0)
    # west pocket between the S-door lane and the block
    r.solid("aes_suppression1", 64.0, 238.0)
    # the open floor's west edge, clear of Cipher's x 368-400
    r.solid("aes_junction_box1", 304.0, 202.0)       # DC junction box fed from the block
    r.solid("aes_cabinet_dark1", 306.0, 244.0)
    # east edge strip and the SE corner
    r.solid("aes_bms_tower1", 586.0, 196.0)
    r.solid("aes_ladder1", 586.0, 236.0)
    r.solid("aes_bollard1", 594.0, 300.0)
    r.solid("aes_cable_drum1", 420.0, 304.0)
    # side walls
    r.item("aes_round_terminal1", 12.0, 176.0)        # west wall, below the door row
    r.item("fire_extinguisher1", 14.0, 136.0)
    r.item("aes_emergency_phone1", 610.0, 140.0)      # east wall, below the door row
    return r.build("room_aes_hall1", "20x10_wide")


def room_aes_hall2():
    """
    4×2 GU (20×10) Battery Hall 2 / inverter room: rack banks A and B (batrack),
    the BMS cabinet the bypass module is fitted in, a row of string inverters along
    the back wall's east end and a second inverter row in front of it, behind a
    red-hatched HV keep-clear box (room_aes_hall2_w/_e).
    Doors: W on row 2, S in the SW corner (x 32-64); the plant room and the loading
    dock cover the bottom two rows, so floor is y 64-256.
    Relay (operative_relay) patrols row 7 between tiles 5 and 15 (sprite centres
    x 160-480, feet about 240): y 206-256 stays clear from x 100 to 520.
    Kept clear: the W door mouth and a lane x 32-96 down to the S door; a lane along
    the back wall y 88-148 behind the banks (walk-behind), reaching the procedures
    sign and the BMS cabinet.
    Slots (as-type): aes_procedures_sign (Emergency Procedures), aes_bypass_module
    (BMS Interlock-Bypass Module, an overlay on the cabinet), aes_clipboard (Rack Bank Maintenance Manifest, on the
    west wall by the door).
    """
    r = _Uni()
    _rack_block(r, 136, (166, 202), 4)                # Rack Bank A, x 136-264
    _rack_block(r, 296, (166, 202), 4)                # Rack Bank B, x 296-424
    # inverters: a back row against the wall and a front row
    for x in (440.0, 496.0, 552.0):
        r.table("aes_inverter1", x, 120.0, kind="objects")
    r.collision(442.0, 104.0, 164.0, 16.0)
    for x in (452.0, 484.0, 516.0, 548.0):
        r.table("aes_inverter2", x, 202.0, kind="objects")
    r.collision(454.0, 186.0, 124.0, 16.0)
    # back wall
    r.item("aes_gas_detector2", 40.0, 56.0)
    r.item("aes_vent_fan1", 62.0, 48.0)
    r.item("aes_procedures_sign1", 140.0, 56.0)       # Emergency Procedures, read in place
    # BMS cabinet A/B, door open, the bypass module: in the open beside bank A, fully in
    # view and reachable from the floor (cycle 4, review F1: it stood behind the racks)
    # The cabinet is decor in the tables layer; the scenario object claims a crop of its
    # own bypass module laid exactly over it (aes_bypass_module1), so when the engine
    # removes a read note from the scene only the overlay goes and the cabinet stays
    # (cycle 5 walk: the whole cabinet vanished after one read).
    r.table("aes_bms_bypass1", 86.0, 120.0, kind="objects")
    r.collision(88.0, 108.0, 43.0, 12.0)
    r.conditional_table_items.append(make_obj("objects", "aes_bypass_module1", 86.0 + 6, 63.0 + 36, r._next()))
    r.item("aes_bank_a_sign1", 196.0, 34.0)
    r.item("power_panel1", 256.0, 52.0)
    r.item("aes_bank_b_sign1", 296.0, 34.0)
    r.item("aes_hv_danger1", 360.0, 52.0)
    r.solid("aes_combiner2", 392.0, 86.0)
    r.item("aes_inverter_sign1", 470.0, 26.0)
    r.item("aes_cctv1", 586.0, 30.0)
    # west wall: the manifest on a clipboard hook by the door, an extinguisher
    r.item("aes_clipboard1", 12.0, 150.0)
    r.item("fire_extinguisher1", 14.0, 200.0)
    # floor kit east of Relay's beat
    r.solid("aes_chiller1", 522.0, 254.0, depth=14)  # the inverter room's cooling unit
    r.solid("aes_gas_cylinders1", 586.0, 250.0)
    r.solid("aes_cable_drum1", 270.0, 200.0)          # in the gap between the banks
    return r.build("room_aes_hall2", "20x10_wide")


def room_aes_plant():
    """
    2×2 GU inverter / plant room, the finale: green epoxy, a red-hatched keep-clear
    box in front of the ESD (room_aes_plant). Back wall: the EMERGENCY SHUTDOWN plate
    over the ESD station (fixed, x 160), HV switchgear either side; east wall a breaker
    panel and the lockout station; a transformer and the standby generator along the
    south; the plant-room bench on the west side with the Coordination Log; Critical
    Mass's folding table with the command laptop and the marked blueprints east.
    Doors: N in the NW corner (x 32-64), E on row 2. Nothing to the south.
    Static (4,7) and Voltage (7,7) stand on clear floor at x 112-240, y 190-256.
    Slots (as-type): aes_esd_station (ESD pushbutton), laptop (ENTROPY Command
    Laptop); notes1/notes3 on the bench (Coordination Log, Operation Log) and notes4
    on the folding table (Blueprints), top-lefts 32 px+ apart (array order matches the
    scenario's object order).
    """
    r = _Uni()
    # back wall: ESD at the centre, switchgear either side, kept clear in front
    r.item("aes_esd_sign1", 148.0, 30.0)
    r.item("aes_esd_station1", 160.0, 58.0)           # top-left 160,33; the red-hatched box below
    r.table("aes_inverter2", 100.0, 116.0, kind="objects")  # the PCS inverter feeding the banks
    r.collision(102.0, 104.0, 27.0, 12.0)
    r.table("aes_switchgear1", 198.0, 116.0, kind="objects")
    r.collision(200.0, 104.0, 58.0, 12.0)
    r.item("aes_hv_danger1", 106.0, 44.0)
    r.item("exit_sign1", 66.0, 28.0)                 # over the way out, by the N door
    # east wall below the door row
    r.item("aes_breaker_panel1", 266.0, 54.0)  # back wall, by the E door
    # west: the plant-room bench (steel), Static's side
    bench = r.table("zds_desk1", 34.0, 186.0, kind="objects")  # x 34-112, top 147
    r.solid("aes_toolbox1", 40.0, 214.0)
    # east: Critical Mass's folding table, Voltage's command post
    camp = r.table("aes_trestle1", 196.0, 178.0, kind="objects")  # a steel trestle and a folding table: Voltage's command post
    camp2 = r.table("smalldesk2", 250.0, 178.0)
    r.solid("aes_pcs_cabinet1", 118.0, 300.0, depth=14)  # PCS control cabinet
    # south: transformer and generator
    r.solid("aes_transformer1", 34.0, 300.0, depth=14)
    r.solid("aes_hv_sign1", 92.0, 252.0)
    r.solid("aes_generator1", 200.0, 300.0, depth=14)
    r.solid("aes_gas_cylinders1", 266.0, 300.0)
    r.item("fire_extinguisher1", 14.0, 140.0)
    # array order decides which paper lands where (scenario order: Blueprints, Coordination Log, Operation Log)
    r.on(camp2, "notes4", 0.5, 0.45, layer="conditional_table_items")   # Facility Blueprints (Marked)
    r.on(camp, "laptop6", 0.30, 0.35, layer="conditional_table_items")  # ENTROPY Command Laptop, 32 px+ from the plans
    r.on(bench, "notes1", 0.22, 0.40, layer="conditional_table_items")   # Coordination Log
    r.on(bench, "aes_battery_module1", 0.55, 0.30)
    r.on(bench, "notes3", 0.86, 0.40, layer="conditional_table_items")   # Voltage's Operation Log
    return r.build("room_aes_plant")


def room_aes_workshop():
    """
    2×2 GU engineering workshop: sealed concrete, a hazard line round the module
    test bench (room_aes_workshop). Back wall: pegboard of tools, the OT network
    diagram, a clock; the OT comms rack and the BMS jump server's rack against it.
    The terminal bench (steel) with the jump-server terminal and the drop-site
    terminal; a parts bench and an electronics bench; the network monitoring cart;
    spare battery modules, a tool trolley, lockers, a cable drum. The OptiGrid tool
    case is shoved under the terminal bench's end.
    Door: N in the NW corner (x 32-64). Nothing to the south.
    Slots: pc10 on the terminal bench (as-type:pc, BMS Jump Server Terminal),
    flag-station on it (Drop-Site Terminal), kvm_cart1 (as-type:kvm_cart, Network
    Monitoring Station), notes3 on the parts bench (Workshop Access Log),
    briefcase-yellow-1 (as-type, OptiGrid Tool Case).
    """
    r = _Uni()
    r.item("pegboard_tools1", 100.0, 58.0)
    r.item("network_architecture", 160.0, 52.0)
    r.item("wall_clock1", 236.0, 38.0)
    r.item("aes_ppe_sign1", 266.0, 44.0)
    r.table("network_rack1", 222.0, 112.0, kind="objects")
    r.table("server_rack1", 258.0, 110.0, kind="objects")
    r.collision(224.0, 96.0, 64.0, 16.0)
    # terminal bench, west of the middle
    term = r.table("zds_desk1", 100.0, 160.0, kind="objects")   # x 100-178, top 121
    r.item("chair-darkgray-1", 112.0, 184.0)         # in front of the terminal bench
    # module test bench inside the hazard line (90,186)-(230,262)
    r.table("it_workbench2", 104.0, 246.0, kind="objects")
    r.table("electronics_bench2", 166.0, 246.0, kind="objects")
    r.solid("aes_battery_module1", 214.0, 256.0)
    # parts bench along the east wall
    parts = r.table("desk3", 238.0, 200.0)
    r.item("kvm_cart1", 250.0, 270.0, layer="conditional_items")  # Network Monitoring Station
    r.collision(252.0, 258.0, 33.0, 12.0)
    r.solid("aes_lockers_grey1", 34.0, 300.0, depth=12)
    r.solid("supply_shelves1", 34.0, 222.0, depth=12)
    r.item("aes_tool_trolley1", 92.0, 300.0)       # rolls and spins when pushed (2026-10-16): no static box under it
    r.solid("aes_cable_drum1", 124.0, 300.0)
    r.item("fire_extinguisher1", 14.0, 140.0)
    r.item("briefcase-yellow-1", 180.0, 186.0, layer="conditional_items")  # a yellow hard case by the bench's end, 32 px+ from the drop-site terminal  # OptiGrid Tool Case, under the bench's end
    r.on(term, "pc10", 0.22, 0.45, layer="conditional_table_items")
    r.on(term, "flag-station", 0.86, 0.45, layer="conditional_table_items")   # 37 px clear of the PC (cycle 6, review F1)
    r.on(parts, "notes3", 0.50, 0.40, layer="conditional_table_items")
    r.on(parts, "cable_tangle1", 0.5, 0.95)
    return r.build("room_aes_workshop")


def room_aes_security():
    """
    2×2 GU security office: charcoal carpet (room_aes_security). Back wall: the
    camera wall over the console desk, the key cabinet, the radio charger; the
    equipment lockers; a desk with the logs and the access-control printout; a
    kettle and mugs on a side unit; the guard's hi-vis on hooks.
    Door: N in the NW corner (x 32-64). Nothing to the south.
    Slots (as-type): cctv_monitors (Security Camera Monitors), filing_cabinet_locked
    (Security Equipment Locker); notes on the console and the side desk (Camera System
    Logs, Access Control Export).
    """
    r = _Uni()
    r.item("cctv_monitors1", 98.0, 50.0)
    r.item("cctv_monitors2", 146.0, 50.0)
    r.item("key_cabinet1", 196.0, 46.0)
    r.item("aes_radio_charger1", 218.0, 46.0)
    r.item("rota_board1", 238.0, 44.0)               # guard rota
    r.item("aes_hivis_hook1", 66.0, 56.0)            # the guard's hi-vis, hard hat and radio, by the door
    console = r.table("desk1", 104.0, 118.0)          # x 104-182, under the camera wall
    access = r.table("desk2", 182.0, 118.0)           # the console runs on: access control
    r.item("chair-grey-1", 132.0, 148.0)
    r.solid("filing_cabinet_locked1", 240.0, 122.0, depth=12)  # the equipment locker, padlocked
    side = r.table("desk3", 60.0, 200.0)              # the printer desk, west
    r.table("smalldesk2", 236.0, 236.0)               # tea station, east
    r.item("fire_alarm_point1", 14.0, 140.0)
    r.solid("filing_cabinet_steel1", 258.0, 300.0)
    r.solid("bin8", 118.0, 204.0)
    r.solid("undercounter_fridge1", 212.0, 238.0)
    r.solid("photocopier1", 214.0, 300.0)            # printer for the access-control exports
    r.item("chair-grey-2", 76.0, 230.0)              # at the printer desk
    r.solid("aes_dvr1", 252.0, 210.0)                # the CCTV recorder
    r.on(console, "pc8", 0.25, 0.40)
    r.on(console, "notes1", 0.78, 0.45, layer="conditional_table_items")   # Camera System Logs
    r.on(console, "phone4", 0.55, 0.42)
    r.on(access, "security_monitor1", 0.45, 0.40)
    r.on(side, "notes3", 0.30, 0.42, layer="conditional_table_items")      # Access Control Export
    r.on(side, "binders1", 0.80, 0.30)
    r.on(r.tables[-1], "kettle1", 0.3, 0.30)
    r.on(r.tables[-1], "mugs_tray1", 0.75, 0.40)
    return r.build("room_aes_security")


def room_aes_ops():
    """
    2×2 GU operations office (Robert Vance's, the duty engineer): blue-grey carpet,
    a vinyl patch under the night-shift kitchenette (room_aes_carpet). Back wall: a
    site plan, the shift rota board, blinds, the kitchenette (sink, fridge, kettle,
    microwave). Vance's desk with the BMS terminal and his work orders; a second
    desk with the budget memo; the noticeboard with the layout map on the back wall;
    filing cabinets; a coat stand with a hi-vis; the night-shift sofa.
    Doors: N in the NW corner (x 32-64), E on row 2 (y 64-100), S in the SW corner;
    the security office covers the bottom two rows (floor y 64-256).
    Vance (robert_vance) stands at (5,7), sprite centre (160,224): clear floor x
    136-184, y 190-256.
    Slots: pc8 on Vance's desk (BMS Monitoring Terminal), notes1 on it (Work
    Orders), notes3 on the second desk (Budget Cut Memo), notes4 pinned on the
    noticeboard (Facility Layout Map).
    """
    r = _Uni()
    r.item("notice_board1", 104.0, 45.0)              # noticeboard, the layout map pinned on it (raised to match the POV, user 2026-10-16)
    r.item("year_planner1", 204.0, 44.0)              # shift rota, over the kitchenette (raised clear of the kettle)
    # kitchenette back against the wall, as in the POV background (user 2026-10-16)
    counter = r.table("kitchen_counter_sink1", 196.0, 92.0, kind="objects")
    fridge = r.table("undercounter_fridge1", 243.0, 92.0, kind="objects")
    r.collision(198.0, 80.0, 66.0, 12.0)
    desk = r.table("desk1", 196.0, 176.0)             # Vance's desk, x 196-274
    r.item("chair-grey-1", 226.0, 200.0)             # in front of the desk, facing it
    desk2 = r.table("desk3", 60.0, 176.0)             # the day engineer's desk, x 60-111
    # cabinets stand against the back wall, base just below the wall foot (POV, user 2026-10-16)
    r.solid("filing_cabinet", 66.0, 70.0, depth=12)
    r.solid("filing_cabinet", 152.0, 70.0, depth=12)
    r.solid("coat_stand1", 262.0, 150.0)
    r.solid("uni_sofa2", 210.0, 252.0, depth=12)     # the night-shift sofa
    r.solid("bin8", 114.0, 176.0)
    r.item("wall_clock1", 266.0, 44.0)
    r.on(counter, "kettle1", 0.3, 0.25)
    r.on(fridge, "aes_microwave1", 0.5, 0.15)
    r.on(desk, "pc8", 0.35, 0.40)
    r.on(desk, "notes1", 0.90, 0.45, layer="conditional_table_items")
    r.on(desk, "office-misc-cup", 0.62, 0.40)
    # array order decides which paper lands where (scenario order: Work Orders, Layout Map, Budget Memo)
    r.conditional_table_items.append(make_obj("objects", "notes4", 112.0, 39.0, r._next()))  # pinned on the noticeboard
    r.on(desk2, "notes3", 0.50, 0.42, layer="conditional_table_items")
    r.on(desk2, "binders1", 0.12, 0.30)
    return r.build("room_aes_ops")


def room_aes_reception():
    """
    2×2 GU gatehouse reception: terrazzo with the Albion bolt inlay (room_aes_lobby).
    Back wall: the ALBION ENERGY STORAGE sign over the security counter, a site
    safety board, CCTV; a PPE station by the door (hard hats, hi-vis), the visitor
    seating, a water cooler.
    Door: S in the SW corner (x 32-64); the operations office covers the bottom two
    rows (floor y 64-256).
    The guard (security_guard) stands at (7.3,4): feet (234,128), sprite centre about
    (234,97), at the east end of the sign-in counter. Two limits pin the spot: his centre
    must be within 96 px of the player's spawn (160,144) (facePlayerDistance), or he
    never turns to face it and his opening challenge doesn't fire (at (7.8,4), 101 px, it
    didn't); and his 80 px tap frame (x 194-274) must stay off the Procedures paper (at
    (7.1,4) it swallowed it into a pick-one menu). Here: 88 px, and the paper sits at
    x 176-190 (cycle 7).
    Slots: notes1 and notes3 on the counter (Visitor Sign-In Log, Security Desk
    Procedures), top-lefts 32 px+ apart.
    """
    r = _Uni()
    # the gatehouse desk (grey security desk with its monitors) and a steel sign-in
    # counter beside it (cycle 6, review F3: the salmon counter read as a hotel lobby)
    r.table("aes_security_desk1", 96.0, 112.0, kind="objects")   # x 96-157, top 57
    counter = r.table("zds_desk3", 158.0, 112.0, kind="objects")  # x 158-209, the sign-in counter
    gatehouse = r.tables[-2]
    r.collision(96.0, 64.0, 114.0, 48.0)             # nobody gets behind the desks (cycle 7 walk: a gap let the player in)
    r.item("aes_logo_sign1", 124.0, 36.0)
    r.item("aes_cctv1", 274.0, 30.0)
    r.item("aes_ppe_sign1", 40.0, 50.0)
    r.item("aes_ppe_rack1", 62.0, 56.0)              # visitors' hard hats and hi-vis
    r.item("hospital_chart_board1", 200.0, 44.0)     # site safety board: permits and the induction sheet
    r.item("aed_cabinet1", 248.0, 56.0)
    r.item("fire_alarm_point1", 292.0, 132.0)
    r.solid("water_cooler1", 264.0, 200.0)          # east side, clear of the guard's spot
    # visitor seating in the SE corner, a check-in kiosk by the door lane
    r.solid("leather_sofa1", 196.0, 252.0, depth=12)
    r.table("glass_coffee_table1", 200.0, 212.0, kind="objects")  # in front of the sofa
    r.solid("planter_fig1", 264.0, 250.0, depth=12)
    r.solid("checkin_kiosk1", 40.0, 140.0)           # visitor check-in, inside the door lane's top
    r.item("aes_speed_gate1", 96.0, 222.0)           # speed gates on the way in (walk-through)
    # array order follows the scenario's (Sign-In Log, then Procedures)
    r.on(gatehouse, "notes1", 0.65, 0.55, layer="conditional_table_items")  # Visitor Sign-In Log, on the gatehouse desk
    r.on(counter, "notes3", 0.50, 0.45, layer="conditional_table_items")    # Security Desk Procedures, on the sign-in counter
    return r.build("room_aes_reception")


def room_aes_control():
    """
    2×1 GU (10×6) SCADA control room: anti-static vinyl (room_aes_control). The
    console of HMI screens across the back wall on two operator desks, the network
    architecture diagram, an alarm panel, two operator chairs, a printer stand with
    the parameter log, a filing cabinet, an extinguisher.
    Doors: W and E on row 2. Nothing to the south.
    Slots: screens on the console (as-type:screens, SCADA HMI Main Display); notes1
    on the side table (Thermal & Charge Parameters Log), notes3 on the console's
    east end (Emergency Shutdown Procedure).
    """
    r = _Uni()
    d1 = r.table("desk1", 64.0, 90.0)
    d2 = r.table("desk3", 142.0, 90.0)
    r.items.append(make_obj("objects", "screens", 64.0, 86.0, r._next()))
    r.item("aes_mimic_board1", 104.0, 46.0)          # the site's single-line mimic board over the console
    r.item("network_architecture", 236.0, 46.0)
    r.item("wall_clock1", 206.0, 40.0)
    r.solid("filing_cabinet_steel1", 40.0, 176.0)
    r.solid("aes_ups1", 262.0, 176.0)
    r.item("alarm_panel", 40.0, 50.0)
    r.item("chair-grey-2", 92.0, 124.0)
    r.item("chair-grey-2", 156.0, 124.0)
    side = r.table("desk1", 200.0, 150.0)             # the printer table: log and procedure, 46 px apart
    r.item("fire_extinguisher1", 14.0, 150.0)
    r.on(side, "notes1", 0.2, 0.40, layer="conditional_table_items")
    r.on(side, "notes3", 0.8, 0.40, layer="conditional_table_items")
    return r.build("room_aes_control", "10x6_hall")


def room_aes_dock():
    """
    2×2 GU loading dock: concrete with bay lines and a striped threshold at the
    shutter (room_aes_dock). Back wall: the roller shutter (x 112-208) under the
    LOADING BAY 1 sign and a beacon, bollards either side, the delivery clipboard on
    the wall; pallets of modules, a pallet truck, cones; the go-bag dumped by the
    shutter, the escape plan dropped beside it.
    Door: W on row 2. Nothing to the south.
    Slots (as-type): aes_clipboard (Loading Dock Schedule, read in place);
    suitcase8 (Go-Bag); notes2 on the floor by the shutter (Voltage's Escape Plan).
    """
    r = _Uni()
    r.item("aes_roller_shutter1", 112.0, 64.0)
    r.item("aes_dock_sign1", 130.0, 12.0 + 11.0)
    r.item("aes_beacon1", 214.0, 34.0)
    r.item("aes_clipboard1", 236.0, 52.0)             # delivery schedule
    r.solid("aes_bollard1", 96.0, 88.0)
    r.solid("aes_bollard1", 212.0, 88.0)
    r.item("suitcase8", 140.0, 100.0, layer="conditional_items")   # the go-bag, by the shutter
    r.item("notes2", 190.0, 98.0, layer="conditional_items")       # the escape plan, dropped
    # returns, west: pallets of spent modules
    r.solid("aes_pallet1", 40.0, 200.0)
    r.item("aes_battery_module1", 43.0, 186.0)
    r.solid("aes_pallet1", 40.0, 260.0)
    r.solid("aes_pallet1", 40.0, 296.0)
    r.solid("aes_pallet1", 72.0, 296.0)
    r.item("aes_battery_module1", 75.0, 282.0)
    # the bay: tyre marks and a dock plate in the floor sheet, a barrier at its mouth
    r.solid("aes_barrier1", 146.0, 262.0)
    r.solid("aes_pallet_truck1", 110.0, 300.0)
    # deliveries in, east
    r.solid("aes_pallet1", 228.0, 200.0)
    r.solid("aes_pallet1", 256.0, 200.0)
    r.item("aes_battery_module1", 231.0, 186.0)
    r.solid("aes_compressor1", 262.0, 120.0)
    r.solid("aes_spill_kit1", 266.0, 252.0)
    r.solid("cylinder_rack1", 222.0, 252.0)
    r.item("aes_shutter_ctrl1", 86.0, 54.0)          # shutter up/down control, beside the shutter
    r.item("exit_sign1", 36.0, 40.0)
    r.solid("aes_cones1", 250.0, 300.0)
    r.item("fire_extinguisher1", 292.0, 140.0)
    return r.build("room_aes_dock")


# ---------------------------------------------------------------------------
# HashChain Exchange (m06 "Follow the Money"): the Crypto Anarchists' exchange,
# a slick fintech front at night. Walls and floors: room_gen/make_hce_tileset.py;
# hand-drawn signs, ticker and screens: room_gen/make_hce_props.py (hce_*).
# Furniture is the photo-based house set where it exists. These maps are m06's
# own, so the shared room_reception, hall_1x2gu, room_office, room_servers and
# room_ceo are untouched. Coordinates: x = left edge, y = feet.
# ---------------------------------------------------------------------------

def _trading_desk(r, x, feet, monitors, extras=(), chairs=True, chair="chair-grey-4"):
    """A steel trading desk (zds_desk1, 78x39) with its monitors and clutter on it
    (name, x_frac, surface_frac; the first in `monitors` is placed first, so a
    scenario pc claims it), and two mesh chairs seen from behind, tucked in at the
    front edge (the traders face their screens). The desk body is a table, so it
    collides; the chairs are walk-behind decor."""
    d = r.table("zds_desk1", float(x), float(feet), kind="objects")
    for name, xf, sf, *layer in monitors:
        r.on(d, name, xf, sf, layer=layer[0] if layer else "table_items")
    for name, xf, sf, *layer in extras:
        r.on(d, name, xf, sf, layer=layer[0] if layer else "table_items")
    if chairs:
        dy = 12 if chair in ("chair-grey-4", "chair-darkgray-1") else 18
        r.item(chair, float(x + 12), float(feet + dy))
        r.item(chair, float(x + 44), float(feet + dy))
    return d


def room_hce_trading():
    """
    2×2 GU trading floor: the exchange's shop window. Blue-grey carpet with a
    lighter aisle (x 114-180) down the middle (room_hce_trading). Back wall: the
    LED price ticker over a wall of market monitors, and world clocks (London, New
    York, Tokyo) beside the N door. Five steel trading desks in two banks of three
    rows, each with two or three screens and two mesh chairs tucked in, facing the
    screens; the west bank's third row is the photocopier and coffee point.
    Doors: W and E on row 2 (the row y 64-104 stays clear wall to wall), N (NE
    corner, x 256-288), S (SE corner). The east lane x 258-288 runs clear from the
    N and E doors down to the S door. The checkpoint covers the bottom two rows,
    so feet stay at y 256 or above.
    NPCs: Irina at (5,5) and the trader at (5,7) (sprite centres x 160) stand in
    the aisle, which stays clear from y 104 down; her dropped things land there.
    Slots: pc10 on the east bank's front desk (base pc, Trading Workstation; the
    only pc10 and the first pc in table_items), notes3 on the west bank's back
    desk (Daily Trading Report), 70 px+ apart.
    """
    r = _Uni()
    # back wall
    r.item("hce_ticker1", 28.0, 21.0)                # LED ticker, top 12
    r.item("screens", 28.0, 58.0)                    # the market wall, top 21
    r.item("hce_world_clocks1", 212.0, 42.0)         # LDN / NYC / TKY, west of the N door
    # three rows a bank (feet 138, 190, 242); the east bank's front desk goes first: its pc10
    # is the Trading Workstation
    _trading_desk(r, 180, 138, [("pc10", 0.36, 0.42), ("pc6", 0.76, 0.42)],   # pc10 clear of Irina's tap frame (c2 TR-2)
                  [("phone1", 0.95, 0.40), ("coffee_cups1", 0.06, 0.38)])
    _trading_desk(r, 36, 138, [("pc8", 0.24, 0.40), ("pc11", 0.56, 0.40), ("laptop1", 0.86, 0.44)],
                  [("energy_cans1", 0.04, 0.30)])
    _trading_desk(r, 36, 190, [("pc6", 0.28, 0.42), ("pc8", 0.66, 0.40)],
                  [("notes3", 0.92, 0.42, "conditional_table_items"), ("office-misc-headphones", 0.06, 0.34)])
    _trading_desk(r, 180, 190, [("pc11", 0.24, 0.40), ("pc6", 0.62, 0.42)],
                  [("phone3", 0.92, 0.40), ("office-misc-cup", 0.04, 0.34)])
    # the head trader's six-screen station closes the east bank (cycle 2, TR-1)
    r.table("hce_trading_station1", 194.0, 246.0, kind="objects")   # x 194-254: 8 px further from the trader (c5 walk F3)
    # bins at the desk ends on the aisle side
    r.item("bin1", 116.0, 138.0)
    r.item("bin4", 116.0, 190.0)                     # (not at the east desks: the trader stands at x 144-176)
    # the west bank's third row is the coffee and print point
    r.item("photocopier1", 36.0, 244.0)
    r.item("coffee_station1", 74.0, 242.0)
    r.item("mini_fridge1", 100.0, 240.0)
    # side walls, below the door row
    r.item("fire_extinguisher1", 14.0, 140.0)
    r.item("fire_alarm_point1", 292.0, 136.0)
    return r.build("room_hce_trading")


def room_hce_lobby():
    """
    2×2 GU HashChain lobby (reception_lobby, the start room): pale marble with the
    gold hex-chain inlay in front of the counter (room_hce_lobby), navy walls with
    the amber line. Back wall: the HASHCHAIN wordmark over the curved reception
    desk, a candlestick screen, an exit sign by the N door; a bitcoin ATM in the NE
    corner, a visitor kiosk beside the desk. A gold-coin pedestal and a display
    case (a hardware wallet under glass) flank the inlay; a lounge of two club
    chairs and a glass table along the south, fig planters in the corners, a
    brochure rack on the east side.
    Doors: N (NW corner, x 32-64): the lane x 32-70 stays clear down to y 140.
    Nothing to the south, so the floor runs to y 300. The spawn and the inlay
    (x 120-200, y 120-220) stay clear.
    Slots: notes3 on the reception desk (HashChain Exchange Brochure).
    """
    r = _Uni()
    r.item("exit_sign1", 70.0, 34.0)
    r.item("hce_logo_sign1", 122.0, 36.0)            # over the desk
    r.item("hce_sconce1", 106.0, 42.0)               # either side of the wordmark (cycle 3)
    r.item("hce_sconce1", 192.0, 42.0)
    r.item("hce_chart_screen1", 208.0, 54.0)
    desk = r.table("hce_reception_desk1", 129.0, 112.0, kind="objects")   # x 129-191, top 62
    r.on(desk, "notes3", 0.30, 0.30, layer="conditional_table_items")
    r.on(desk, "pc11", 0.66, 0.24)
    r.solid("hce_kiosk1", 204.0, 112.0)              # visitor sign-in kiosk
    r.solid("hce_crypto_atm1", 252.0, 92.0)          # NE corner
    r.solid("hce_price_board1", 32.0, 176.0)         # live price board below the N-door lane (cycle 2, LOB-1)
    r.solid("hce_display_case1", 94.0, 196.0)        # a hardware wallet under glass
    r.solid("hce_coin_pedestal1", 214.0, 196.0)
    r.solid("brochure_rack1", 242.0, 252.0)
    # the lounge, south
    r.solid("club_chair_e1", 92.0, 290.0)
    r.table("glass_coffee_table1", 130.0, 288.0, kind="objects")
    r.solid("club_chair_w1", 184.0, 290.0)
    r.solid("planter_fig1", 34.0, 300.0)
    r.solid("planter_fig1", 254.0, 186.0)
    r.solid("water_cooler1", 36.0, 236.0)
    # side walls
    r.item("fire_extinguisher1", 14.0, 200.0)
    r.item("fire_alarm_point1", 292.0, 150.0)
    return r.build("room_hce_lobby")


def room_hce_hall():
    """
    2×1 GU (10×6) security checkpoint: the lobby's marble, navy walls
    (room_hce_hall). The lobby covers the bottom two rows, so the floor is y 64-128
    and everything stands against the back wall or hangs on it: a STAFF ONLY plate
    and a camera by the N door, the noticeboard with the IT checklist pinned on it,
    the guard's desk with his monitors, a water cooler.
    Doors: S (SW corner, x 32-64), N (NE corner, x 256-288).
    Kept clear for the guard (checkpoint_guard, waypoints (4,4) and (3,4), sprite
    centres x 96-128): x 80-150 below y 90. Kept clear for the pick window: the
    floor x 200-288 (the player's centre x 209-279 within 64 px of the N door).
    Slots: notes4 pinned on the noticeboard (IT New Starter Checklist).
    """
    r = _Uni()
    r.item("key_cabinet1", 38.0, 36.0)               # over the cooler (cycle 2, CP-3)
    r.solid("water_cooler1", 36.0, 84.0)             # NW corner, clear of the noticeboard (cycle 2, CP-1)
    r.item("notice_board1", 70.0, 52.0)              # x 70-112, top 21
    r.conditional_items.append(make_obj("objects", "notes4", 78.0, 44.0, r._next()))   # pinned on it
    r.item("fire_action_notice1", 116.0, 52.0)
    r.item("hce_logo_small1", 142.0, 23.0)
    r.solid("aes_security_desk1", 140.0, 90.0)       # x 140-201: the guard's desk and monitors
    r.item("hce_staff_sign1", 194.0, 28.0)
    r.item("cctv_camera1", 230.0, 52.0)
    return r.build("room_hce_hall", "10x6_hall")


def room_hce_office():
    """
    2×2 GU Irina Volkova's office (the CTO, a cryptographer): taupe carpet, pale
    grey walls with the amber line (room_hce_office). Bookcases and a steel filing
    cabinet along the back wall, her elliptic-curve whiteboard and the framed
    bitcoin white paper; her desk facing the room with a banker's lamp, journals
    piled beside it; a reading corner (club chair, side table with the research
    notes) south-west; a printer table with the Architect's email south-east; a
    coat stand by the door.
    Doors: E on row 2 (x 240-288, y 64-110 kept clear). Nothing to the south: the
    floor runs to y 300.
    Slots: pc11 on her desk (base pc, Irina's Secure Workstation), notes3 on the
    reading table (Cryptography Research Notes), notes1 on the printer table
    (Email: From The Architect); 32 px+ apart, scenario order.
    """
    r = _Uni()
    r.solid("bookcase", 36.0, 84.0)
    r.solid("bookcase", 80.0, 84.0)
    r.item("hce_whiteboard_maths1", 130.0, 54.0)
    r.item("hce_phd_frame1", 184.0, 44.0)            # her doctorate (cycle 2, OFF-1: the white paper is Satoshi's)
    r.solid("filing_cabinet_steel1", 208.0, 86.0)
    r.item("wall_clock1", 240.0, 42.0)
    # her desk, facing the room
    r.item("exec_chair_black1", 136.0, 140.0)
    desk = r.table("exec_desk1", 112.0, 172.0, kind="objects")    # x 112-192, top 126
    r.on(desk, "pc11", 0.40, 0.30)
    r.on(desk, "bankers_lamp1", 0.12, 0.26)
    r.on(desk, "coffee_cups1", 0.80, 0.30)
    r.solid("book_pile1", 84.0, 170.0)
    r.solid("bin2", 64.0, 172.0)
    r.item("chair-grey-4", 128.0, 208.0)             # two visitor chairs facing her desk (c3 OFF-2)
    r.item("chair-grey-4", 160.0, 208.0)
    r.item("book_trolley1", 136.0, 296.0)            # the room's one angled prop; rolls when pushed (2026-10-16)
    r.solid("journal_stack1", 178.0, 296.0)          # (c3 OFF-3: was caught behind the shelves)
    r.solid("magazine_rack2", 120.0, 254.0)          # journals by the reading corner
    # reading corner, SW
    r.solid("club_chair_e1", 38.0, 252.0)
    side = r.table("smalldesk2", 80.0, 250.0)
    r.on(side, "notes3", 0.5, 0.30, layer="conditional_table_items")
    r.solid("fig_plant1", 36.0, 300.0)
    # printer table, SE
    pt = r.table("smalldesk1", 220.0, 250.0)
    r.on(pt, "notes1", 0.30, 0.34, layer="conditional_table_items")
    r.on(pt, "office-misc-hdd6", 0.78, 0.30)
    r.solid("shredder1", 270.0, 252.0)
    r.solid("binder_shelves1", 210.0, 200.0)
    r.solid("coat_stand1", 262.0, 160.0)
    r.item("fire_alarm_point1", 14.0, 150.0)
    return r.build("room_hce_office")


def room_hce_lab():
    """
    2×2 GU blockchain lab (chain analysis): grey vinyl with floor trunking, pale
    grey walls with the amber line (room_hce_lab). Back wall: CHAIN ANALYSIS plate,
    the analysts' transaction-graph whiteboard, two screens (wallet-flow graph and
    order book). Mining rigs and a node shelf down the east side with an air mover;
    two analyst desks in the middle; a Pi-cluster bench and a beanbag west.
    Doors: W on row 2 (x 32-80, y 64-110 kept clear). Nothing to the south.
    Priya (blockchain_analyst) at (6,4) since cycle 3: sprite x 176-208, y 96-160, on clear floor.
    Slots: pc10 on the front desk (base pc, Blockchain Analysis Workstation);
    notes3 and notes1 at either end of the back desk (Network Analysis, Mixing
    Analysis; 50 px+ apart), scenario order.
    """
    r = _Uni()
    r.item("threat_map1", 40.0, 56.0)                # flows of money across the map (cycle 2, LAB-1)
    r.item("hce_lab_sign1", 132.0, 24.0)
    r.item("hce_whiteboard_graph1", 128.0, 56.0)
    r.item("hce_chart_screen3", 180.0, 54.0)
    r.item("hce_chart_screen2", 234.0, 54.0)
    # east: the rigs
    r.solid("hce_mining_rig2", 232.0, 140.0, depth=14)
    r.solid("hce_node_shelf1", 232.0, 200.0, depth=14)
    r.solid("hce_mining_rig1", 226.0, 270.0, depth=14)
    r.solid("aes_air_mover1", 200.0, 290.0)          # blowing at the rigs
    # Priya (blockchain_analyst) at (6,4), moved from (3,3) out of the W door's walk-in line
    # (cycle 2, LAB-2, approved): the floor x 168-216, y 90-172 stays clear for her.
    # the workstation desk, west, below the W-door row
    _trading_desk(r, 40, 166, [("pc10", 0.32, 0.42), ("pc8", 0.72, 0.40)],
                  [("energy_cans1", 0.94, 0.30)], chair="chair-darkgray-1")   # the lab's own back-view chairs (c3 LAB-3, c5 LAB-4)
    # the analysis table: Priya's two papers at either end, 90 px apart (cycle 2, LAB-1)
    t = r.table("zds_conference_table1", 100.0, 240.0, kind="objects")   # x 100-226
    r.on(t, "notes3", 0.10, 0.30, layer="conditional_table_items")
    r.on(t, "laptop3", 0.36, 0.28)
    r.on(t, "pc6", 0.58, 0.30)
    r.on(t, "coffee_cups1", 0.74, 0.28)
    r.on(t, "notes1", 0.90, 0.30, layer="conditional_table_items")
    r.item("chair-darkgray-1", 128.0, 252.0)         # back view, facing the table (c5 LAB-4)
    r.item("chair-darkgray-1", 178.0, 252.0)
    # west: the hardware bench and the beanbags
    r.table("it_workbench1", 36.0, 244.0, kind="objects")
    r.solid("beanbag1", 40.0, 292.0)
    r.solid("pizza_boxes1", 88.0, 294.0)
    r.item("fire_extinguisher1", 292.0, 170.0)
    return r.build("room_hce_lab")


def room_hce_servers():
    """
    2×2 GU server room (the exchange's backend): raised floor with two perforated
    cold aisles, petrol-blue walls with a cyan line (room_hce_servers). A back row
    of racks under a cable tray, the long row of blue servers across the middle,
    an ops bench with the SAFETYNET drop and the rack sheet, the backend console
    desk, a precision air-con unit and the UPS.
    Doors: S (SE corner) and N (NE corner): the east lane x 256-288 runs clear from
    door to door. The trading floor covers the bottom two rows (feet <= 256).
    Slots: pc8 on the console desk (as-type:pc, HashChain Backend Server Terminal),
    flag-station and notes3 on the bench, 32 px+ apart.
    """
    r = _Uni()
    r.item("cable_tray1", 36.0, 27.0)
    r.solid("server_rack1", 36.0, 86.0)
    r.solid("network_rack1", 68.0, 88.0)
    r.solid("server_rack2", 104.0, 88.0)
    r.solid("storage_array1", 136.0, 88.0)
    r.solid("hce_comms_cabinet1", 166.0, 90.0)       # (cycle 2, VLT-2: unlike the data centre's kit)
    r.item("hce_server_sign1", 194.0, 26.0)
    r.solid("aes_ups1", 216.0, 88.0)
    r.table("servers", 34.0, 170.0, kind="objects")  # x 34-255
    # console desk and bench, south
    con = r.table("zds_desk3", 172.0, 240.0, kind="objects")   # x 172-223
    r.on(con, "pc8", 0.45, 0.42, layer="conditional_table_items")
    r.item("chair-grey-4", 186.0, 252.0)
    bench = r.table("zds_desk1", 40.0, 240.0, kind="objects")  # x 40-118
    r.on(bench, "flag-station", 0.22, 0.38, layer="conditional_table_items")
    r.on(bench, "notes3", 0.80, 0.40, layer="conditional_table_items")
    r.solid("kvm_cart1", 126.0, 246.0)
    r.solid("aircon_unit1", 224.0, 252.0)
    r.item("suppression_panel1", 14.0, 210.0)
    return r.build("room_hce_servers")


def room_hce_vault():
    """
    2×2 GU data centre, the custody core: darker raised floor, petrol-blue walls
    with a cyan line (room_hce_vault). The custody cage across the NW: mesh panels
    and a cage door along a hatched floor line (y 150), HSM cabinets and the
    hardware-wallet cabinet inside under a CUSTODY VAULT / TWO-PERSON RULE plate.
    The custody console on its own steel desk in front of the cage door, with the
    cold-storage procedure; the transaction server's terminal beside a block of
    black racks east; EXECUTIVE SUITE plate over the E door's end of the wall
    (the executive wing is through here); gas suppression, supply boxes, tape
    library, UPS.
    Doors: E on row 2, S (SE corner): the east lane x 256-288 stays clear from the E
    door down to the S door (the rack block x 186-250 stands against the back wall,
    west of it). The server room covers the bottom two rows. (Precision cooling is
    the server room's; the custody core has gas suppression, tape library and UPS.)
    Slots (scenario order): pc6 on the server desk (Financial Transaction Server),
    pc10 on the console desk (Custody Console), notes3 on the console desk's far
    end (Cold Storage Procedure, 40 px+ from the console).
    """
    r = _Uni()
    r.item("hce_custody_sign1", 60.0, 30.0)
    r.item("aes_cctv1", 134.0, 34.0)                 # watching the cage door (cycle 2, VLT-3)
    r.solid("hce_hsm1", 36.0, 112.0, depth=12)
    r.solid("server_rack1", 80.0, 110.0)             # (cycle 2, VLT-1: one angled HSM fewer)
    r.solid("hce_wallet_cabinet1", 122.0, 112.0, depth=12)
    # the cage front (y 150): panels either side of the door
    r.solid("hce_cage_panel1", 32.0, 152.0, inset=0, depth=8)
    r.item("hce_cage_door1", 85.0, 152.0)            # the door, shut (walk-behind decor)
    r.collision(85.0, 144.0, 36.0, 8.0)
    r.solid("hce_cage_panel1", 121.0, 152.0, inset=0, depth=8)
    # east: the rack block and the transaction server
    r.item("hce_exec_sign1", 214.0, 30.0)
    r.solid("server_rack2", 186.0, 90.0)
    r.solid("storage_array1", 218.0, 90.0)
    srv = r.table("zds_desk3", 196.0, 168.0, kind="objects")   # x 196-247
    r.on(srv, "pc6", 0.45, 0.42)                     # a standing terminal in the core (c3 VLT-5: no chair)
    # the custody console, in front of the cage door
    con = r.table("zds_desk1", 64.0, 210.0, kind="objects")    # x 64-142
    r.on(con, "pc10", 0.30, 0.42)
    r.on(con, "notes3", 0.90, 0.40, layer="conditional_table_items")
    r.item("chair-grey-4", 82.0, 222.0)
    r.solid("supply_boxes1", 140.0, 252.0)
    r.solid("tape_library1", 172.0, 250.0)
    r.solid("ups_cabinet1", 206.0, 248.0)
    r.solid("suppression_cylinders1", 34.0, 252.0)
    r.item("suppression_panel1", 14.0, 220.0)
    return r.build("room_hce_vault")


def room_hce_exec_hall():
    """
    2×1 GU (10×6) executive wing corridor: smoked oak with a navy and amber runner
    (room_hce_exec_hall), navy walls. The framed press clipping hangs on the back
    wall between two sconces, beside an abstract canvas; a HASHCHAIN plate over a
    console table with an orchid, a trophy cabinet, a PRIVATE plate by the N door, a
    fire point on the west wall, a leather bench against the south wall at the west
    end. Nothing to the south: the floor is y 64-160.
    Doors: W on row 2 (the mouth x 32-60, y 64-100 clear), N (NE corner, x 256-288).
    Kept clear for Kemal (satoshi_minder): his beat (8,4) <-> (4,4), sprite centres
    x 128-256, y 128, so x 112-272 below y 92 stays open; the back-wall furniture
    stands at feet 84-86 and the bench is west of x 104.
    Slots (as-type): hce_press_clipping (Framed Press Clipping).
    """
    r = _Uni()
    r.item("hce_art_canvas1", 36.0, 48.0)            # (cycle 3: a gallery wall, not scenery prints)
    r.item("hce_sconce1", 84.0, 42.0)
    r.item("hce_press_clipping1", 98.0, 54.0)        # top-left 98,24, between two sconces
    r.item("hce_sconce1", 128.0, 42.0)
    r.item("hce_logo_small1", 138.0, 23.0)
    r.solid("hce_console_table1", 136.0, 86.0, depth=8)
    r.solid("trophy_cabinet1", 198.0, 86.0, depth=8)  # industry awards (c3 EXW-3: the gold coin is the lobby's)
    r.item("private_sign1", 216.0, 23.0)
    r.item("fire_alarm_point1", 14.0, 150.0)
    r.solid("hce_bench1", 40.0, 158.0, depth=10)
    return r.build("room_hce_exec_hall", "10x6_hall")


def room_hce_ceo():
    """
    2×2 GU Satoshi's office: smoked oak with an amber and black rug under the desk
    (room_hce_ceo), navy walls. The desk is room_ceo's (desk-ceo2 at x 118, feet
    147) and his chair behind it, so the Signing Case keeps its pinned spot on the
    desk's front edge (3.6, 3.35, elevation 32); two visitor chairs face it. Back
    wall: a block-height screen and the framed bitcoin white paper; the executive
    safe alone in the NE corner (pinned at (8,2)). A hardware wallet in a display
    case and a drinks cabinet west; a black leather sofa, glass table and a fig SW;
    a bar cart, his side table with the manifesto and a laptop east; a floor globe SE.
    Doors: S (SE corner, the lane x 256-288 from y 196 clear). The executive wing
    covers the bottom two rows (feet <= 256). Satoshi at (5,6): x 144-176,
    y 160-224 clear.
    Slots: briefcase11 and safe2 (conditional, claimed then pinned by the
    scenario), notes3 on the side table (Crypto Anarchist Manifesto).
    """
    r = _Uni()
    r.item("hce_block_screen1", 40.0, 52.0)          # his own screen: the chain's block height (cycle 2, CEO-1)
    r.item("hce_whitepaper_frame1", 150.0, 48.0)
    r.item("chair-exec-rotate1", 142.0, 128.0)
    r.table("desk-ceo2", 118.0, 147.0)
    r.conditional_items.append(make_obj("objects", "briefcase11", 121.0, 150.0, r._next()))
    r.conditional_items.append(make_obj("objects", "safe2", 229.0, 66.0, r._next()))
    r.solid("hce_display_case1", 36.0, 130.0)
    r.solid("drinks_cabinet1", 70.0, 112.0)
    r.solid("leather_sofa1", 36.0, 214.0)
    r.table("glass_coffee_table1", 42.0, 250.0, kind="objects")
    # visitor chairs facing the desk, either side of Satoshi (x 144-176 clear) (cycle 2, CEO-2)
    r.item("chair-exec-rotate5", 102.0, 200.0)
    r.item("chair-exec-rotate5", 182.0, 200.0)
    r.solid("floor_globe1", 196.0, 254.0)
    side = r.table("smalldesk1", 228.0, 180.0)
    r.on(side, "notes3", 0.25, 0.30, layer="conditional_table_items")
    r.on(side, "exec_laptop1", 0.75, 0.26)
    r.solid("bar_cart1", 200.0, 140.0)
    r.solid("planter_fig1", 104.0, 254.0)            # SW, off the safe in the NE corner (c3 CEO-4)
    r.item("fire_alarm_point1", 14.0, 160.0)
    return r.build("room_hce_ceo")


# ---------------------------------------------------------------------------
# Quantum Dynamics Corporation (m05 "Insider Trading"): a quantum-cryptography
# research firm in a working day, during the insider hunt. Walls and floors:
# room_gen/make_qdc_tileset.py; hand-drawn signs, notices and screens:
# room_gen/make_qdc_props.py (qdc_*); lab, vault and kitchen kit from PixelLab
# (qdc_*). Furniture is the photo-based house set where it exists. These maps are
# m05's own, so the shared room_reception, hall_1x2gu, room_break, room_IT,
# room_lab, room_office, room_servers and room_ceo are untouched. Coordinates:
# x = left edge, y = feet.
# ---------------------------------------------------------------------------

def room_qdc_lab():
    """
    2×2 GU Dr Halloran's Heisenberg lab: white anti-static tiles, white walls with
    the violet line (room_qdc_lab). Back wall: HEISENBERG LAB plate over the
    cryostat prototype (a hatched keep-clear box round it, a helium dewar beside),
    its control rack under a LASER warning, a fume hood, the lattice whiteboard and
    the laminated LAB RULES notice by the door end of the wall. The laser bench
    (QKD optics) on its own hatched box west, a trolley of optics (rolls and spins
    when pushed); the safety shower and eyewash plumbed into the NE corner, the
    first-aid cabinet on the east wall and a glovebox east; the long lab bench along the south (an instrument
    bench and a steel desk, gloves boxes on it, stools tucked in) and Halloran's
    own small desk below where she stands; the visitor-badge hook on the east wall by the door, empty (a
    prop only: the visitor spare is Halloran's to hand over, never a pickup here).
    Everything square to the walls (cycle 2: the angled PixelLab kit regenerated).
    Doors: E on row 2 (the mouth x 230-288, y 64-118 clear). The break room covers
    the bottom two rows, so feet stay at y 256 or above.
    NPC: Halloran at (6,6), sprite x 176-208, feet ~187: x 160-226, y 116-196 clear,
    and the column x 160-226 open up to the door row, so she is reached from the door.
    Slots: qdc_lab_rules1 (as-type, Lab Rules) on the back wall with clear floor
    under it; notes1 on the bench by a monitor (Conference Lanyard), 100 px+ apart.
    """
    r = _Uni()
    # back wall
    r.item("qdc_lab_sign1", 34.0, 26.0)              # over the cryostat
    r.item("qdc_laser_warning1", 100.0, 24.0)
    r.solid("qdc_cryostat1", 40.0, 104.0, depth=12)  # in the hatched box x 34-100, y 68-116
    r.solid("qdc_instrument_rack1", 96.0, 90.0)      # its control electronics
    r.solid("qdc_dewar1", 100.0, 128.0, depth=12)    # helium for the fridge
    r.solid("qdc_fume_hood1", 134.0, 88.0)
    r.item("qdc_whiteboard_lattice1", 192.0, 54.0)
    r.item("qdc_lab_rules1", 242.0, 54.0)            # Lab Rules, readable from the door row
    # safety shower and eyewash plumbed into the NE corner of the back wall (user 2026-10-16: the
    # free-standing station looked strange); a plain item, no collision, so the E door row stays open
    r.item("qdc_safety_shower1", 268.0, 72.0)
    # west: the laser bench on its hatched box (x 34-124, y 140-188), a trolley of optics
    r.solid("qdc_optical_bench1", 50.0, 180.0, depth=14)
    r.item("instrument_trolley1", 124.0, 190.0)      # rolls and spins when pushed (user 2026-10-16): no static box
    # east: the first-aid cabinet on the east wall below the door, the glovebox, clear of Halloran
    r.item("qdc_first_aid_cabinet1", 289.0, 176.0)
    r.solid("qdc_glovebox1", 232.0, 214.0, depth=12)
    r.item("qdc_badge_hook1", 292.0, 136.0)          # the empty visitor-badge hook, by the door
    r.item("fire_extinguisher1", 292.0, 210.0)
    r.item("qdc_poster_secure1", 14.0, 128.0)
    # the long lab bench along the south: an instrument bench and a steel desk
    lb = r.table("qdc_lab_desk1", 36.0, 250.0, kind="objects")   # x 36-94, its scope and probes on it
    r.on(lb, "test_tube_rack1", 0.86, 0.30)          # (c3 Q8: was on the floor)
    b2 = r.table("zds_desk1", 98.0, 250.0, kind="objects")    # x 98-176
    r.on(b2, "pc8", 0.40, 0.42)
    r.on(b2, "notes1", 0.72, 0.30, layer="conditional_table_items")   # the lanyard, over the monitor's corner
    r.on(b2, "gloves_box1", 0.92, 0.30)
    r.on(b2, "gloves_box1", 0.06, 0.30)
    for x in (60.0, 108.0):
        r.item("hospital_chair_south", x, 218.0)     # lab stools facing the bench. Not "chair-*": those roll
        # when pushed and are tap candidates, and one shoved along the bench raised a menu on the
        # lanyard (c5 walk); these stay put
    # Halloran's own corner, SE
    d = r.table("smalldesk1", 180.0, 254.0)          # x 180-230, below Halloran (c3 Q7)
    r.on(d, "laptop3", 0.30, 0.30)
    r.on(d, "office-misc-cup2", 0.72, 0.32)
    r.solid("book_pile1", 244.0, 254.0)
    return r.build("room_qdc_lab")


def room_qdc_lobby():
    """
    2×2 GU QDC reception (reception_lobby, the start room): pale stone with the
    violet Bloch-sphere inlay at the spawn (room_qdc_lobby), lilac-grey walls with
    the violet line. Back wall: the QUANTUM DYNAMICS wordmark over the security
    reception counter (the staff directory on it), a camera, the 999-readiness
    poster and the dispatch-rollout screen. A sanitiser stand west of the counter;
    the Heisenberg chip in a display case east; a waiting area on a violet rug SE
    (black leather sofa, glass table, club chair, the room's angled piece); a row of
    waiting seats beside a fig, and a brochure rack, SW.
    Doors: N (NW corner, x 32-64): the lane x 32-72 stays clear down to y 140.
    E on row 2 (x 230-288, y 64-118 clear). Nothing to the south: the floor runs
    to y 300. The spawn and the inlay (x 120-200, y 140-230) stay clear.
    Slots: notes3 on the counter (Building Directory).
    """
    r = _Uni()
    r.item("qdc_poster_ready1", 80.0, 50.0)
    r.item("qdc_logo_sign1", 122.0, 34.0)            # over the counter
    r.item("cctv_camera1", 204.0, 30.0)
    r.item("qdc_dispatch_screen1", 232.0, 56.0)      # the 999 rollout, the firm's proudest contract
    desk = r.table("reception_counter1", 104.0, 112.0, kind="objects")   # x 104-214
    r.on(desk, "notes3", 0.22, 0.30, layer="conditional_table_items")
    r.on(desk, "pc11", 0.52, 0.24)
    r.on(desk, "phone1", 0.70, 0.30)
    r.on(desk, "office-misc-smallplant4", 0.90, 0.28)
    r.solid("sanitizer_stand1", 82.0, 112.0)
    r.solid("display_case3", 214.0, 186.0)           # the Heisenberg chip under glass
    # waiting area, SE, on the rug (x 196-290, y 234-300)
    r.solid("leather_sofa1", 214.0, 256.0)
    r.table("glass_coffee_table1", 218.0, 292.0, kind="objects")
    r.solid("club_chair_e1", 178.0, 296.0)
    # south-west: a row of waiting seats, periodicals, a fig
    r.solid("lecture_seat_row1", 72.0, 246.0)        # facing the room, clear of the fig (c3 Q5)
    r.solid("planter_fig1", 36.0, 250.0)
    r.solid("brochure_rack1", 36.0, 300.0)           # front-on (c3 Q4: the periodicals rack was three-quarter)
    r.item("fire_alarm_point1", 14.0, 160.0)
    r.item("fire_extinguisher1", 14.0, 210.0)
    r.item("qdc_poster_secure1", 292.0, 160.0)
    return r.build("room_qdc_lobby")


def room_qdc_hall():
    """
    2×1 GU (10×6) main corridor: slate carpet tiles, lilac-grey walls with the
    violet line (room_qdc_hall). The lobby covers the bottom two rows, so the floor
    is y 64-128 and everything stands against the back wall or hangs on it: a QDC
    plate, a water cooler, the staff noticeboard with Lisa's collection flyer pinned
    on it, a fire action notice, a drinks machine, the Heisenberg team poster, a bin.
    Doors: S (SW corner, x 32-64, the walk-in from the lobby: x 30-72 kept empty),
    W and E on row 2 (y 92-128 open wall to wall), N (NE corner, x 250-290 clear).
    Slots: notes4 pinned on the noticeboard (Noticeboard Flyer), floor under it clear.
    """
    r = _Uni()
    r.item("qdc_logo_small1", 74.0, 28.0)
    r.solid("water_cooler1", 76.0, 86.0, depth=8)
    r.item("notice_board1", 112.0, 54.0)             # x 112-154, top 23
    r.conditional_items.append(make_obj("objects", "notes4", 120.0, 46.0, r._next()))   # the flyer, pinned on it
    r.item("fire_action_notice1", 160.0, 52.0)
    r.solid("drinks_vending1", 184.0, 88.0, depth=8)
    r.item("qdc_poster_team1", 230.0, 50.0)
    r.item("bin1", 230.0, 88.0)
    return r.build("room_qdc_hall", "10x6_hall")


def room_qdc_server_hall():
    """
    2×1 GU (10×6) server hallway behind the badge reader: grey vinyl with floor
    trunking, graphite walls with the violet line (room_qdc_server_hall). Patricia's
    office covers the bottom two rows, so the floor is y 64-128. A cable tray over a
    rack, the UPS and boxed kit, a tool trolley by the W door; RESTRICTED and a
    camera by the server-room door, and IT's printed notice taped on the wall
    beside it, nothing standing in front of it.
    Doors: W on row 2 (the mouth x 32-92, y 64-110 kept clear), N (NE corner, x 250-290).
    Slots: qdc_it_notice1 (as-type, IT Notice: Server Room Access) on the wall
    beside the N door, the floor under it clear.
    """
    r = _Uni()
    r.item("cable_tray1", 40.0, 26.0)                # x 40-190, clear of the sign and camera
    r.solid("server_rack1", 100.0, 86.0, depth=8)
    r.solid("ups_cabinet1", 134.0, 86.0, depth=8)
    r.solid("supply_boxes1", 172.0, 88.0, depth=8)
    r.item("restricted_sign1", 192.0, 24.0)
    r.item("fire_extinguisher1", 204.0, 90.0)
    r.item("qdc_it_notice1", 228.0, 54.0)            # IT's notice, taped by the door (cycle 2: its own sprite)
    r.item("cctv_camera1", 248.0, 30.0)
    r.item("aes_tool_trolley1", 104.0, 126.0)        # under the rack, out of the W-door mouth (c5 R3)
    return r.build("room_qdc_server_hall", "10x6_hall")


def room_qdc_break():
    """
    2×2 GU break room: warm wood-effect vinyl with a kitchen strip along the back,
    sage walls with the violet line (room_qdc_break). Back wall: a white kitchen
    counter (sink, microwave), an under-counter fridge with the collection tin and a
    kettle on it (the tin Lisa's flyer mentions), a wall TV over the gap where Lisa
    stands, the espresso machine with the TalentStack leaflet dropped at its foot, a
    clock. A fridge-freezer on the west wall; two cafe tables with plain chairs;
    a snack machine east; a sofa and two beanbags SW, a foosball table, a magazine
    rack, the recycling bins (paper, glass, general) and a tall plant along the south.
    Everything that lines a wall is square to it (cycle 2).
    Doors: E on row 2 (x 230-288, y 64-118 clear). Nothing to the south.
    NPC: Lisa at (4,4), sprite x 112-144, feet ~123: nothing stands on the floor in
    x 112-156 behind her, and the door row reaches her.
    Slots: notes3 on the floor at the espresso machine's foot (TalentStack Leaflet).
    """
    r = _Uni()
    r.table("qdc_kitchenette1", 32.0, 96.0, kind="objects")       # x 32-86
    uc = r.table("undercounter_fridge1", 88.0, 96.0, kind="objects")   # x 88-110
    r.on(uc, "qdc_collection_tin1", 0.30, 0.40)
    r.on(uc, "kettle1", 0.80, 0.40)
    r.item("uni_tv1", 114.0, 50.0)                   # the news on the wall
    r.solid("qdc_espresso1", 158.0, 96.0, depth=10)  # x 158-202
    r.conditional_items.append(make_obj("objects", "notes3", 202.0, 104.0, r._next()))   # the leaflet, at its foot
    r.item("wall_clock1", 212.0, 42.0)
    r.solid("qdc_fridge1", 34.0, 160.0, depth=12)   # west wall
    # two cafe tables, plain chairs either side
    for x in (84.0, 160.0):
        t = r.table("smalldesk1", x, 196.0)
        r.on(t, "office-misc-cup2" if x < 100 else "mugs_tray1", 0.35, 0.34)
        for dx in (8.0, 28.0):
            r.item("hospital_chair_south", x + dx, 164.0)   # north side, facing the table
            r.item("hospital_chair_north", x + dx, 218.0)   # south side, facing it
    # east
    r.solid("vending_machine1", 244.0, 196.0)
    # south
    r.solid("beanbag_teal1", 40.0, 250.0)
    r.solid("beanbag_orange1", 76.0, 252.0)
    r.solid("uni_sofa2", 36.0, 296.0)
    r.solid("foosball_table2", 116.0, 294.0)
    r.solid("magazine_rack1", 170.0, 298.0)
    r.solid("qdc_recycling_bins1", 190.0, 258.0)
    r.solid("plant-large11", 248.0, 298.0)
    r.item("fire_extinguisher1", 292.0, 160.0)
    return r.build("room_qdc_break")


def room_qdc_open():
    """
    2×2 GU open-plan office: blue-grey carpet with a lighter walkway (x 226-288)
    from the S door to the N door, lilac-grey walls with the violet line
    (room_qdc_open). Back wall: Owen's network whiteboard in the NW, his IT
    workbench under the IT SUPPORT plate, a comms cabinet, the team's key-rotation
    year planner. Two desk banks with monitors and clutter, chairs tucked in; a
    photocopier, a filing cabinet and a bin SW; cables where IT works.
    Doors: W on row 2 (x 32-90, y 64-118 clear), N (NE corner) and S (SE corner):
    the walkway x 226-288 is clear end to end (it is the route between the two
    doors). The corridor covers the bottom two rows, so feet stay at y 256 or above.
    NPC: Owen at (6,4), sprite x 176-208, feet ~123: the floor x 160-226, y 92-136
    stays clear (bank A moved down in cycle 2), so he is reached from the door row
    and from the walkway.
    No scenario objects (Owen hands everything over in person).
    """
    r = _Uni()
    r.item("qdc_whiteboard_net1", 36.0, 54.0)
    r.item("qdc_it_sign1", 100.0, 24.0)
    r.table("it_workbench2", 92.0, 88.0, kind="objects")   # x 92-144
    r.item("comms_cabinet1", 148.0, 56.0)            # on the wall face (c3 Q10)
    r.item("year_planner1", 178.0, 54.0)             # key-rotation windows by region
    r.item("cable_tangle1", 120.0, 104.0)
    # desk bank A (row 1), clear of Owen's feet
    for x, mon, extra in ((40, "pc8", "office-misc-cup"), (120, "pc11", "phone3")):
        d = r.table("zds_desk1", float(x), 178.0, kind="objects")
        r.on(d, mon, 0.30, 0.42)
        r.on(d, extra, 0.78, 0.36)
        r.on(d, "office-misc-smallplant2" if x < 100 else "picture13", 0.58, 0.30)
        r.item("chair-darkgray-1", float(x + 14), 190.0)
        r.item("chair-darkgray-1", float(x + 46), 190.0)
    # desk bank B (row 2) and the print point SW
    d = r.table("zds_desk1", 120.0, 240.0, kind="objects")
    r.on(d, "pc6", 0.30, 0.42)
    r.on(d, "laptop1", 0.75, 0.40)
    r.on(d, "office-misc-smallplant5", 0.95, 0.30)
    r.item("chair-darkgray-1", 134.0, 252.0)
    r.item("chair-darkgray-1", 170.0, 252.0)
    r.solid("photocopier1", 40.0, 248.0)
    r.solid("qdc_filing_steel1", 78.0, 250.0)
    r.item("bin3", 108.0, 250.0)
    r.item("fire_alarm_point1", 292.0, 150.0)
    r.item("fire_extinguisher1", 292.0, 210.0)
    r.item("sanitiser_dispenser1", 14.0, 160.0)
    return r.build("room_qdc_open")


def room_qdc_torres():
    """
    2×2 GU David Torres' office (the cryptography lead): oak boards with a worn blue
    rug under the desk, lilac-grey walls with the violet line (room_qdc_torres).
    Back wall: two bookcases, his son's crayon drawing pinned up, a certificate, his
    key-rotation whiteboard, a steel filing cabinet, a clock. His mahogany desk on
    the rug facing the room, chair and lamp behind (the Mug on its front-right, a
    monitor, a family photo); the scuffed briefcase on the floor at the desk's left
    end; two visitor chairs facing the desk; a sideboard, a book trolley (the
    room's angled prop), a pink reading armchair with journals, a bin, a fig.
    Doors: S (SE corner): the lane x 240-288 from y 140 down stays clear. The open
    office covers the bottom two rows (feet <= 256).
    Slots: office-misc-cup on the desk (the Mug, first in table_items, on the desk
    top), briefcase1 by the desk (as-type:briefcase, Torres' Briefcase), 80 px apart.
    """
    r = _Uni()
    r.solid("bookcase", 36.0, 84.0)
    r.solid("bookcase", 80.0, 84.0)
    r.item("qdc_kid_drawing1", 128.0, 46.0)          # Miguel's drawing; 'WORLD'S BEST DAD' is on the mug
    r.item("uni_certificate1", 154.0, 40.0)
    r.item("qdc_whiteboard_keys1", 174.0, 54.0)      # the key-rotation calendar (cycle 2)
    r.solid("filing_cabinet", 226.0, 86.0)            # wooden, front-on (c3 Q1)
    r.item("wall_clock1", 260.0, 44.0)
    desk = r.table("exec_desk_mahogany1", 130.0, 172.0, kind="objects")   # x 130-190, its chair and lamp built in
    r.on(desk, "office-misc-cup", 0.86, 0.66)        # the Mug, front-right, first: the scenario claims it
    r.on(desk, "pc11", 0.40, 0.56)
    r.on(desk, "picture2", 0.62, 0.58)               # the family photo
    r.item("briefcase1", 104.0, 178.0)               # the briefcase, at the desk's left end
    r.item("chair-darkgray-1", 150.0, 222.0)         # visitor chairs, facing the desk, 32 px+ from the
    r.item("chair-darkgray-1", 184.0, 222.0)         # Mug and the briefcase (chairs are tap candidates)
    r.solid("sideboard1", 36.0, 150.0)
    r.item("book_trolley1", 214.0, 150.0)            # rolls when pushed (2026-10-16)
    r.solid("sofa1", 36.0, 252.0)                    # the reading armchair
    r.solid("journal_stack1", 92.0, 252.0)
    r.solid("bin2", 120.0, 252.0)
    r.solid("fig_plant1", 196.0, 254.0)
    r.item("fire_alarm_point1", 14.0, 160.0)
    return r.build("room_qdc_torres")


def room_qdc_security():
    """
    2×2 GU Patricia Morgan's office (Chief Security Officer): plum carpet,
    lilac-grey walls with the violet line (room_qdc_security). Back wall: her
    suspects board (eight badge photos, two strung to a note) in the NW, the
    SECURITY plate, the vetting binders, a steel filing cabinet and the locked one
    behind her desk, a key cabinet. Her desk mid-room (the incident log, a monitor,
    a phone), her chair, two plain visitor chairs; the CCTV desk SE with its chair;
    a small meeting table SW with four chairs; a coat stand, a wooden cabinet, a
    shredder, a tall plant. No decoy safe (cycle 2: the one lock here is the cabinet).
    Doors: W on row 2 (x 32-126, y 64-118 clear: Patricia stands just inside).
    Nothing to the south: the floor runs to y 300.
    NPC: Patricia at (3,3), sprite x 80-112, feet ~91: x 70-130 clear to y 130.
    Slots: notes3 on her desk (Security Incident Log), filing_cabinet_locked2
    (as-type:filing_cabinet_locked, Locked Filing Cabinet; hand-drawn front-on),
    90 px+ apart.
    """
    r = _Uni()
    r.item("qdc_suspects_board1", 32.0, 54.0)
    r.item("qdc_security_sign1", 140.0, 24.0)
    r.solid("binder_shelves1", 136.0, 88.0)
    r.solid("qdc_filing_steel1", 188.0, 90.0)
    r.solid("filing_cabinet_locked2", 220.0, 90.0)   # the locked one, behind her desk (front-on, c3 Q2)
    r.item("key_cabinet1", 258.0, 44.0)
    r.item("exec_chair_black1", 174.0, 138.0)
    desk = r.table("exec_desk1", 150.0, 172.0, kind="objects")   # x 150-230
    r.on(desk, "notes3", 0.18, 0.40, layer="conditional_table_items")
    r.on(desk, "pc8", 0.54, 0.24)
    r.on(desk, "phone2", 0.86, 0.30)
    r.item("chair-grey-1", 166.0, 216.0)             # visitor chairs, facing her desk (c5 R4), 32 px+
    r.item("chair-grey-1", 200.0, 216.0)             # from the incident log
    r.solid("credenza1", 146.0, 300.0)               # against the south wall (c5 R2)
    r.table("qdc_cctv_desk1", 222.0, 250.0, kind="objects")   # x 222-282
    r.item("hospital_chair_north", 244.0, 276.0)
    r.solid("shredder1", 268.0, 150.0)
    # meeting table SW
    mt = r.table("display_table1", 60.0, 262.0, kind="objects")   # x 60-138, clear of the plant (c5 R1)
    r.on(mt, "binders1", 0.20, 0.30)
    r.on(mt, "coffee_cups1", 0.55, 0.34)
    r.on(mt, "laptop1", 0.82, 0.36)
    for x in (72.0, 110.0):
        r.item("hospital_chair_south", x, 230.0)
        r.item("hospital_chair_north", x, 288.0)
    r.solid("coat_stand1", 36.0, 124.0)               # by the door, clear of the plant (c4)
    r.solid("plant-large12", 34.0, 210.0)            # against the west wall (c3 Q13)
    r.item("fire_extinguisher1", 292.0, 120.0)
    return r.build("room_qdc_security")


def room_qdc_servers():
    """
    2×2 GU server room: raised floor with perforated cold aisles, graphite walls
    with the violet line (room_qdc_servers). A back row of racks under a cable tray,
    SERVER ROOM plate, UPS; a long row of servers across the middle; the research
    network terminal on its own desk and the SAFETYNET drop on a steel bench to
    the south; a precision air-con unit; gas suppression panel.
    Doors: S (SE corner) and N (NE corner): the east lane x 256-288 runs clear from
    door to door. The server hallway covers the bottom two rows (feet <= 256).
    Slots: vm-launcher on the terminal desk (Bludit CMS Server Terminal),
    flag-station on the bench (SAFETYNET Drop-Site Terminal), 80 px apart.
    """
    r = _Uni()
    r.item("cable_tray1", 36.0, 26.0)
    r.solid("server_rack1", 36.0, 86.0)
    r.solid("server_rack2", 68.0, 88.0)
    r.solid("storage_array1", 100.0, 88.0)
    r.solid("server_rack1", 132.0, 86.0)
    r.solid("qdc_rack_black1", 164.0, 90.0)
    r.item("qdc_server_sign1", 192.0, 26.0)
    r.solid("ups_cabinet1", 210.0, 88.0)
    r.table("servers", 34.0, 170.0, kind="objects")    # x 34-255, the east lane x 256-288 stays open
    term = r.table("zds_desk3", 40.0, 240.0, kind="objects")   # x 40-91
    r.on(term, "vm-launcher", 0.30, 0.42)            # a standing terminal: no chair (a chair here is a tap candidate)
    bench = r.table("zds_desk1", 120.0, 240.0, kind="objects")   # x 120-198
    r.on(bench, "flag-station", 0.30, 0.38)
    r.on(bench, "laptop3", 0.78, 0.40)
    r.solid("aircon_unit1", 212.0, 250.0)
    r.item("suppression_panel1", 14.0, 210.0)
    r.item("fire_extinguisher1", 14.0, 150.0)
    return r.build("room_qdc_servers")


def room_qdc_vault():
    """
    2×2 GU key vault (data_center): dark raised floor, darker graphite walls with a
    red security line (room_qdc_vault). Back wall: KEY VAULT / HEISENBERG LEADS ONLY
    over the wall of key safes and the secure key cabinet, behind a red hatched
    two-person line; a camera; TWO-PERSON RULE over the racks and the tape library
    east. Two front-on HSM racks against the east wall; the upload terminal on
    its steel desk mid-room, where Torres works (he stands at its front, (5,7)); a
    second bench west with his printed schedule and manifest; gas suppression; the
    vault access log on a clipboard on the east wall.
    Doors: S (SE corner). The player walks in up x 256-288 and west along y 200-256
    to Torres: nothing stands there (feet of the east-wall kit <= 190), so he is
    reached straight from the door (browser check N3: the old map had a desk by
    the door, which left the player 36 px from him). The server room covers the
    bottom two rows (feet <= 256).
    Slots (scenario order): pc10 on the upload desk (Exfiltration Upload Terminal),
    notes3 at the desk's far end (Sealed TalentStack Envelope, 50 px+ from the
    terminal), notes1 and notes4 at either end of the west bench (Upload Schedule,
    Data Package Manifest, 37 px from the schedule's centre).
    """
    r = _Uni()
    r.item("qdc_vault_sign1", 40.0, 30.0)
    r.solid("qdc_key_lockers1", 40.0, 98.0, depth=12)
    r.solid("qdc_key_cabinet1", 102.0, 98.0, depth=12)
    r.item("aes_cctv1", 146.0, 30.0)
    r.item("qdc_two_person_sign1", 176.0, 26.0)
    r.solid("server_rack2", 176.0, 90.0)
    r.solid("qdc_rack_black1", 208.0, 92.0)
    r.solid("tape_library1", 250.0, 90.0)
    r.solid("qdc_hsm1", 252.0, 186.0)                # an HSM rack against the east wall (c3 Q12)
    r.solid("qdc_hsm1", 218.0, 186.0)
    r.item("aes_clipboard1", 292.0, 150.0)           # the vault access log, on the east wall
    up = r.table("zds_desk1", 120.0, 176.0, kind="objects")   # x 120-198, top 137
    r.on(up, "pc10", 0.40, 0.42)
    r.on(up, "notes3", 0.95, 0.40, layer="conditional_table_items")
    r.on(up, "office-misc-hdd4", 0.08, 0.36)
    bench = r.table("zds_desk1", 36.0, 236.0, kind="objects")  # x 36-114
    r.on(bench, "notes1", 0.15, 0.36, layer="conditional_table_items")
    r.on(bench, "notes4", 0.80, 0.40, layer="conditional_table_items")   # 37 px from the schedule (c3 Q11)
    r.solid("suppression_cylinders1", 34.0, 176.0)
    r.item("suppression_panel1", 14.0, 210.0)
    return r.build("room_qdc_vault")


# ---------------------------------------------------------------------------
# Pacific Northwest Regional Grid Control (m07 "The Architect's Gambit"): a public
# utility's grid control facility outside Portland, at night, mid-evacuation.
# Walls and floors: room_gen/make_pnw_tileset.py; hand-drawn signs, boards, screens,
# the plant log, the cable ladder and the splice: room_gen/make_pnw_props.py
# (pnw_*, notes_*); gensets, transfer switch, control cabinets, consoles, x-ray,
# arch, batteries, day tank: PixelLab (pnw_*). These maps are m07's own, so the
# shared room_security, room_office, room_servers, room_control_1x2gu,
# room_battery_hall and room_archive_1x2gu are untouched.
# Coordinates: x = left edge, y = feet.
# ---------------------------------------------------------------------------

def room_pnw_checkpoint():
    """
    2×2 GU security checkpoint, the start room: grey terrazzo with the PNW
    fir-and-bolt inlay at the spawn, a walk-off mat in the east door mouth
    (room_pnw_checkpoint). Back wall: the PACIFIC NORTHWEST REGIONAL GRID CONTROL
    wordmark over the guard counter, the NERC escort notice and the muster sign under
    it, the evacuation muster board (clear floor under it), the CCTV monitors, a
    camera. The guard counter NW with the badge station, a phone, the radio charger
    and the open visitor ledger; a drinks machine below the E door; two plastic waiting
    seats on the west wall; the screening lane along the south (x-ray, the arch standing
    on the yellow queue line, stanchions); grey lockers SE; extinguisher and call point.
    Doors: E (row 2). The spawn (the inlay, about 160,160) and Hollis's patrol
    (x 96-224, feet 208-245) are clear floor; the E-door mouth (x 232-288,
    y 64-112) is clear.
    Slots (as-type): pnw_badge_printer1 (Contractor Badge Station: a card printer with
    the uncollected badge in its tray) and notes_ledger1 (Audited Visitor Log) on the
    counter, 50 px+ apart; pnw_evac_board1 (as-type, Evacuation Status Board).
    """
    r = _Uni()
    r.item("pnw_logo_sign1", 36.0, 34.0)
    r.item("pnw_nerc_notice1", 38.0, 56.0)
    r.item("pnw_muster_sign1", 110.0, 58.0)
    r.item("pnw_evac_board1", 156.0, 56.0)
    r.item("cctv_monitors1", 214.0, 54.0)
    r.item("cctv_camera1", 264.0, 34.0)
    desk = r.table("reception_counter1", 34.0, 122.0, kind="objects")   # x 34-144, top 78
    r.on(desk, "pnw_badge_printer1", 0.20, 0.36, layer="conditional_table_items")   # Contractor Badge Station (as-type; cycle 2 m10)
    r.on(desk, "phone1", 0.44, 0.34)
    r.on(desk, "aes_radio_charger1", 0.58, 0.34)
    r.on(desk, "notes_ledger1", 0.84, 0.36, layer="conditional_table_items")  # Audited Visitor Log
    r.solid("drinks_vending1", 244.0, 174.0)                         # below the E door mouth (cycle 2 m11: not the ops floor's cooler)
    r.item("hospital_chair2", 36.0, 200.0)                           # two plastic waiting seats facing east (static)
    r.item("hospital_chair2", 36.0, 232.0)
    r.item("fire_alarm_point1", 14.0, 140.0)
    r.item("fire_extinguisher1", 14.0, 176.0)
    # the screening lane along the south wall
    r.solid("pnw_xray1", 36.0, 300.0, depth=12)
    r.solid("pnw_arch1", 108.0, 262.0, depth=8)                      # standing in the lane on the queue line (cycle 2 m12)
    r.solid("stanchions1", 142.0, 296.0, depth=8)
    r.solid("aes_lockers_grey1", 224.0, 302.0, depth=12)
    r.item("aes_ppe_cabinet1", 290.0, 166.0)                        # PPE cabinet on the east wall below the door
    r.solid("coat_stand1", 262.0, 244.0, depth=6)                   # (cycle 3 m-G)
    r.item("bin1", 196.0, 300.0)
    return r.build("room_pnw_checkpoint")


def room_pnw_ops():
    """
    2×2 GU operations floor, the setting's signature room: dark blue carpet tiles, a
    lighter aisle door to door along the top, a raised grey dais at the back for the
    shift supervisor (room_pnw_ops). Back wall: the 147-substation wall map (red
    rings) and the amber situation video wall, five screens wide. Two rows
    of three operator consoles facing the wall, a 32 px gangway between the second
    and third in each row; position 3 (front row, east) is the abandoned workstation,
    its chair pushed back. On the dais the supervisor's desk with the plant key and
    the handover sheet in the tray, a laptop and a phone, his chair shoved aside.
    Coffee station and water cooler SW, binder shelves SE, sanitiser and call point west,
    extinguisher east.
    Doors: W and E (row 2): the aisle y 64-112 runs clear door to door.
    Slots: pnw_substation_map1 (as-type, 147-Substation Wall Map), pnw_video_wall1
    (as-type, Grid Situation Board), pnw_console_pos1 (as-type, Abandoned Operator
    Workstation), key and notes3 on the supervisor's desk (Plant Maintenance Key,
    Shift Handover Sheet) 40 px+ apart. Only the static, angled chair stands near
    position 3 (rolling chairs are tap candidates).
    """
    r = _Uni()
    r.item("pnw_substation_map1", 36.0, 56.0)
    r.item("pnw_video_wall1", 114.0, 58.0)                          # x 114-273: wall-sized (cycle 2 m4)
    # front row (feet 156): A, B, gangway, position 3
    # every console carries a muted position plate 1-6 (user review 2026-10-16: a lone "3" read as a marker)
    con_a = r.table("pnw_console2_p1", 40.0, 156.0, kind="objects")
    r.table("pnw_console1_p2", 104.0, 156.0, kind="objects")
    r.solid("pnw_console_pos1", 200.0, 156.0, depth=12)        # Abandoned Operator Workstation (items layer: as-type only searches item layers)
    r.item("chair-grey-1", 60.0, 178.0)
    r.item("chair-grey-1", 124.0, 178.0)
    r.item("aes_office_chair1", 236.0, 204.0)                    # pushed well back; static, one of the room's two angled pieces
    # position 3's mug is drawn into pnw_console_pos1 (a separate sprite drew behind the console: cycle 3 m-A)
    r.on(con_a, "office-misc-headphones", 0.30, 0.55)              # a headset dropped on console A
    # back row (feet 236)
    r.table("pnw_console1_p4", 40.0, 236.0, kind="objects")
    r.table("pnw_console2_p5", 104.0, 236.0, kind="objects")
    r.table("pnw_console1_p6", 200.0, 236.0, kind="objects")
    r.item("chair-grey-1", 60.0, 258.0)
    # back-row chair F removed (lighting stage, dressing c5 m-1: it sat half behind the binder shelves); console E's chair went in cycle 2
    # the supervisor's dais (x 96-224, y 248-306 on the sheet)
    sup = r.table("desk1", 118.0, 304.0)                          # x 118-196, top 265 (cycle 2 m1: clear of back-row chair E)
    r.on(sup, "key", 0.14, 0.40, layer="conditional_table_items")       # Plant Maintenance Key
    r.on(sup, "laptop1", 0.46, 0.36)
    r.on(sup, "phone2", 0.64, 0.34)
    r.on(sup, "notes3", 0.86, 0.40, layer="conditional_table_items")    # Shift Handover Sheet
    r.item("pnw_office_chair_m1", 86.0, 306.0)                      # shoved aside; static, so it never rolls into the tray (cycle 2 m1)
    r.solid("coffee_station1", 34.0, 300.0)
    r.solid("water_cooler1", 60.0, 300.0)
    r.solid("binder_shelves1", 238.0, 300.0)                     # front-on (the photocopier was three-quarter: cycle 3 m-B)
    r.item("sanitiser_dispenser1", 14.0, 204.0)
    r.item("fire_alarm_point1", 14.0, 150.0)
    r.item("fire_extinguisher1", 292.0, 170.0)
    return r.build("room_pnw_ops")


def room_pnw_servers():
    """
    2×2 GU server hall: raised floor with a perforated cold aisle, teal-graphite
    walls with the evergreen line (room_pnw_servers). Back wall: a cable tray over a
    row of seven racks (rack 4 has the cabling survey note clipped to its door),
    SERVER HALL / RESTRICTED. A middle row of racks ending in the SCADA backup server
    (its own blue rack with a red BKP tag). Two desks to the south: the VM terminal
    and the SAFETYNET relay. Extinguisher and suppression panel on the west wall.
    Doors: W (row 2), N (NW corner) and S (SW corner): all on the west side, so the
    west lane x 32-76 runs clear from door to door and the kit fills the east.
    The generator hall covers the bottom two rows (feet <= 256). Elena (3,7.5)
    stands on clear floor west of the desks.
    Slots: notes_clip1 (as-type) on rack 4 (Cabling Survey Note), pnw_backup_server1
    (as-type, SCADA Backup Server), vm-launcher (VM Access Terminal) and flag-station (SAFETYNET Relay
    Terminal) on their desks, 60 px+ apart; no chairs (tap candidates).
    """
    r = _Uni()
    r.item("cable_tray1", 80.0, 26.0)
    r.item("pnw_server_sign1", 236.0, 32.0)
    for i, rack in enumerate(("server_rack1", "server_rack2", "storage_array1", "server_rack1",
                              "tape_library1", "ups_cabinet1", "server_rack2")):
        r.solid(rack, 76.0 + 30 * i, 94.0 if rack != "ups_cabinet1" else 92.0)
    r.item("notes_clip1", 172.0, 96.0, layer="conditional_items")    # clipped to rack 4's door (x 166-196): paper at y 70-84, feet in front of the rack
    for i in range(5):
        r.solid("server_rack1", 106.0 + 30 * i, 170.0)
    r.solid("pnw_backup_server1", 256.0, 170.0)                     # SCADA Backup Server (as-type; front-on, cycle 3 M-1)
    r.solid("kvm_cart1", 110.0, 200.0, depth=10)                    # Elena's rack terminal, pulled up to the row (cycle 2 M3)
    r.item("pnw_backup_tag1", 259.0, 171.0)
    r.item("aes_toolbox1", 232.0, 194.0)                            # left in the aisle when the alarm went (cycle 3 m-I)
    term = r.table("zds_desk3", 140.0, 248.0, kind="objects")       # x 140-191, 36 px from Elena (cycle 2)
    r.on(term, "vm-launcher", 0.36, 0.42)                           # standing terminal, no chair
    relay = r.table("zds_desk1", 208.0, 248.0, kind="objects")      # x 208-286
    r.on(relay, "flag-station", 0.30, 0.40)
    r.on(relay, "office-misc-hdd2", 0.78, 0.36)
    r.item("fire_extinguisher1", 14.0, 150.0)
    r.item("suppression_panel1", 14.0, 206.0)
    return r.build("room_pnw_servers")


def room_pnw_scada():
    """
    2×1 GU (10×6) SCADA control: dark anti-static tiles, plum-slate walls with a red
    line (room_pnw_scada). Back wall: the countdown display over the operator console
    (west, so Mercer no longer hides it: cycle 2), the PNW 147 mimic board, SCADA
    CONTROL / AUTHORISED ONLY behind Mercer. The charcoal master desk with the cascade
    control position and the signed projection at its east end, beside Mercer. No
    chair (it stood in the walk-in band).
    Doors: S (SW corner, x 32-64). The server room covers rows 4-5, so the floor is
    y 64-128; the band y 104-128 runs clear from the door to Mercer (7,3).
    Slots: scada_historian (via the object's sprite, Cascade Control System) and
    notes3 (Signed Casualty Projection) on the master desk; centre taps unique; pnw_countdown1 (as-type, Cascade Countdown Display).
    """
    r = _Uni()
    r.item("pnw_countdown1", 30.0, 46.0)                            # over the operator console, clear of Mercer (cycle 2 M1)
    r.item("pnw_mimic1", 110.0, 44.0)                               # lighting stage (walk F1): up 8 px so the historian monitor no longer hides its lamps
    r.item("pnw_scada_sign1", 212.0, 30.0)                          # decor: Mercer may stand in front of it
    r.table("pnw_console2", 40.0, 100.0, kind="objects")            # x 40-104
    master = r.table("pnw_master_desk1", 112.0, 104.0, kind="objects")   # x 112-190, top 65; charcoal (cycle 2 M2)
    r.on(master, "scada_historian", 0.34, 0.50, layer="conditional_table_items")
    r.solid("pnw_desk_return1", 190.0, 104.0)                       # the desk reaches Mercer's spot (cycle 3 m-D)
    r.on(master, "notes3", 0.97, 0.42, layer="conditional_table_items")   # clear of the historian's bounds (cycle 2 m6)
    r.item("fire_extinguisher1", 14.0, 112.0)
    r.item("alarm_panel", 290.0, 104.0)
    return r.build("room_pnw_scada", "10x6_hall")


def room_pnw_genhall():
    """
    4×2 GU (20×10) backup generation hall: blue-grey epoxy, sage blockwork with the
    evergreen line (room_pnw_genhall_w/_e). West: the N-door to S-door lane x 32-84
    behind a yellow walkway line. Back wall at the west end, in a hatched keep-clear
    box: BACKUP GENERATION HALL, the automatic transfer switch ATS-1, the plant log
    chained to the wall beside it, the genset control panel. Three yellow gensets in
    hatched boxes across the middle (GEN 1-3 plates on their skids), starter batteries,
    an engine cabinet and a junction box along the back wall; the red fuel day tank
    in its bund at the east end with the hose reel over it; fuel trunking to the sets.
    A steel trestle (radios) and a tool chest west of GEN 1; ATS-1's cover propped against the wall; a cable trolley, a transformer, a spill kit
    and drums along the south of the east half.
    Doors: N and S (NW and SW corners). The cable vault covers rows 8-9 of the west
    half (feet <= 256 for x < 320).
    Slots (as-type): pnw_ats (Backup Power Transfer Switch), pnw_genset_panel (Genset
    Control Panel), notes_plantlog (Plant Maintenance Log). rooms.js reads notes_* as
    its own base type, not notes, so each needs as-type. Top-lefts 36 px+ from
    each other's centres.
    """
    r = _Uni()
    r.item("pnw_genhall_sign1", 96.0, 30.0)
    r.solid("pnw_ats1", 100.0, 104.0)                    # ATS-1, top-left 100,50
    r.item("notes_plantlog1", 138.0, 56.0, layer="conditional_items")   # chained beside the switch (cycle 2 m14: clear of the panel)
    r.item("pnw_ats_cover1", 156.0, 90.0)                           # its cover off, propped on the skirting (cycle 3 m-F; c5 m-2: feet 100 -> 90)
    r.solid("pnw_genset_panel1", 186.0, 104.0)           # x 186-221
    r.item("aes_hv_danger1", 240.0, 52.0)
    # back wall kit east of the box
    r.solid("pnw_batteries1", 270.0, 100.0)
    r.solid("pnw_engine_cabinet1", 330.0, 100.0)
    r.solid("pnw_batteries1", 376.0, 100.0)
    r.solid("pnw_junction_box1", 436.0, 96.0)
    r.solid("pnw_batteries1", 480.0, 100.0)
    r.item("aes_hivis_hook1", 300.0, 44.0)                          # a hi-vis vest left on its hook
    r.item("pnw_ear_sign1", 412.0, 44.0)
    # the gensets in their hatched boxes (x 240-320, 344-424, 448-528; y 140-214)
    for x, plate in ((249.0, "pnw_genplate_one1"), (353.0, "pnw_genplate_two1"), (457.0, "pnw_genplate_three1")):
        r.solid("pnw_genset1", x, 206.0, depth=14)
        r.item(plate, x + 18.0, 207.0)                              # on the set's skid (cycle 3 m-E: they hung over the batteries)
    # fuel day tank in its bund (536-604, 66-140), the hose reel on the wall above
    r.solid("pnw_day_tank1", 541.0, 126.0, depth=12)
    r.item("pnw_hose_reel1", 566.0, 56.0)
    # west of GEN 1: a steel bench with the radio charger
    bench = r.table("aes_trestle2", 116.0, 226.0, kind="objects")   # x 116-168, a steel trestle (cycle 2 m16)
    r.solid("aes_tool_chest1", 180.0, 230.0)
    r.on(bench, "aes_radio_charger1", 0.30, 0.34)
    r.on(bench, "office-misc-cup", 0.70, 0.40)
    # south of the east half (visible down to y 306)
    r.solid("pnw_cable_trolley1", 372.0, 298.0)
    r.solid("pnw_transformer1", 470.0, 300.0, depth=12)
    r.item("aes_spill_kit1", 540.0, 296.0)
    r.item("aes_drum1", 572.0, 298.0)
    r.item("aes_drum1", 588.0, 300.0)
    r.item("fire_alarm_point1", 14.0, 140.0)
    r.item("fire_extinguisher1", 14.0, 176.0)
    return r.build("room_pnw_genhall", "20x10_wide")


def room_pnw_vault():
    """
    2×1 GU (10×6) underground cable vault: wet concrete with damp patches, a
    chequer-plate cable trench along the back wall, a sump grate (room_pnw_vault).
    Board-marked concrete walls with a yellow line. Back wall: CABLE VAULT /
    CONFINED SPACE, a cable ladder loaded with the trunk runs across the wall, the
    splice on it (resin joint, site tape, a small grey device nobody registered), a
    gas detector. The Tomb Gamma printout is wedged in the cable ladder by the
    splice; Park's trestle east with a battery printer and the intercept; one trench
    plate lifted where Park works (laid on the floor, cones beside it); a ladder, a
    cable drum, a ventilation air mover.
    Doors: N (NW corner): the lane x 32-72, y 64-112 is clear. Nothing to the south;
    floor y 64-180. Park (4.5,4.5) stands on clear floor between the splice and his
    trestle.
    Slots: pnw_splice1 (as-type, Trunk Cable Runs); notes_tucked1 (as-type, Tomb Gamma)
    in the ladder and notes1 on the trestle (Intercepted Mail); centre taps unique.
    """
    r = _Uni()
    r.item("pnw_vault_sign1", 72.0, 30.0)
    r.item("pnw_cable_ladder1", 80.0, 54.0)
    r.item("pnw_splice1", 150.0, 58.0)                   # top-left 150,34
    r.item("aes_gas_detector2", 262.0, 44.0)
    r.item("notes_tucked1", 104.0, 52.0, layer="conditional_items")   # wedged in the cable ladder by the splice (cycle 2 m17)
    r.solid("aes_cones1", 96.0, 102.0, depth=6)                     # round the lifted trench plate
    bench = r.table("aes_trestle1", 200.0, 120.0, kind="objects")   # x 200-252
    r.on(bench, "pnw_portable_printer1", 0.28, 0.30)
    r.on(bench, "notes1", 0.76, 0.34, layer="conditional_table_items")
    r.item("aes_ladder1", 266.0, 112.0)
    r.solid("aes_cable_drum1", 196.0, 176.0)
    r.solid("aes_air_mover1", 84.0, 172.0, depth=8)                 # confined-space ventilation (cycle 2 m19)
    r.item("fire_extinguisher1", 14.0, 150.0)
    return r.build("room_pnw_vault", "10x6_hall")


def main():
    # Hand-maintained (do not regenerate — edit .tmj in Tiled, then export JSON):
    #   room_hospital_office, room_hospital_cto_office, room_hospital_meeting
    #   room_hospital_office_it, room_hospital_office_cto, room_hospital_office_security
    #   (copies of room_hospital_office, edited with scripts/room_gen/room_edit.py)
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
        "room_uni_foyer": room_uni_foyer,
        "room_uni_lab": room_uni_lab,
        "room_uni_common": room_uni_common,
        "room_uni_corridor": room_uni_corridor,
        "room_uni_library": room_uni_library,
        "room_uni_office": room_uni_office,
        "room_uni_workshop": room_uni_workshop,
        "room_uni_lecture": room_uni_lecture,
        "room_uni_special": room_uni_special,
        "room_uni_seminar": room_uni_seminar,
        "room_uni_staff": room_uni_staff,
        "room_zds_reception": room_zds_reception,
        "room_zds_conference": room_zds_conference,
        "room_zds_office": room_zds_office,
        "room_zds_ceo": room_zds_ceo,
        "room_zds_servers": room_zds_servers,
        "room_zds_hall": room_zds_hall,
        "room_zds_hall_exec": room_zds_hall_exec,
        "room_aes_hall1": room_aes_hall1,
        "room_aes_hall2": room_aes_hall2,
        "room_aes_plant": room_aes_plant,
        "room_aes_workshop": room_aes_workshop,
        "room_aes_security": room_aes_security,
        "room_aes_ops": room_aes_ops,
        "room_aes_reception": room_aes_reception,
        "room_aes_control": room_aes_control,
        "room_aes_dock": room_aes_dock,
        "room_hce_trading": room_hce_trading,
        "room_hce_lobby": room_hce_lobby,
        "room_hce_hall": room_hce_hall,
        "room_hce_office": room_hce_office,
        "room_hce_lab": room_hce_lab,
        "room_hce_servers": room_hce_servers,
        "room_hce_vault": room_hce_vault,
        "room_hce_exec_hall": room_hce_exec_hall,
        "room_hce_ceo": room_hce_ceo,
        "room_qdc_lab": room_qdc_lab,
        "room_qdc_lobby": room_qdc_lobby,
        "room_qdc_hall": room_qdc_hall,
        "room_qdc_server_hall": room_qdc_server_hall,
        "room_qdc_break": room_qdc_break,
        "room_qdc_open": room_qdc_open,
        "room_qdc_torres": room_qdc_torres,
        "room_qdc_security": room_qdc_security,
        "room_qdc_servers": room_qdc_servers,
        "room_qdc_vault": room_qdc_vault,
        "room_pnw_checkpoint": room_pnw_checkpoint,
        "room_pnw_ops": room_pnw_ops,
        "room_pnw_servers": room_pnw_servers,
        "room_pnw_scada": room_pnw_scada,
        "room_pnw_genhall": room_pnw_genhall,
        "room_pnw_vault": room_pnw_vault,
    }
    # m08's SAFETYNET HQ rooms (room_hq_*) live in room_gen/hq_rooms.py.
    sys.path.insert(0, str(REF_DIR))
    import hq_rooms
    builders.update(hq_rooms.register(sys.modules[__name__]))
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
