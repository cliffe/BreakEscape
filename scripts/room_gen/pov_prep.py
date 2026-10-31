#!/usr/bin/env python3
"""Prepare the inputs for a room's eye-level conversation background (POV background).

Writes into OUT_DIR:
  <room>_topdown.png    the render_room_preview image of the map (scale 2)
  <room>_backwall.png   the back (north) wall strip, cropped from the render and
                        enlarged x2 (nearest neighbour; a Gemini reference, not an asset)
  <room>_inventory.txt  every map sprite sorted into the zones of the camera view
                        (back wall, against the back wall, left/right walls, mid-room,
                        behind the camera), plus the doors from the scenario

The camera stands near the south wall looking north, so the back wall strip, which
the top-down render already draws face-on, is what Gemini copies. See
.claude/skills/room-pov-background/SKILL.md.

Usage:
  python3 scripts/room_gen/pov_prep.py ROOM_TYPE OUT_DIR [--scenario scenarios/<m>/scenario.json.erb --room ROOM_ID]
                                                         [--span X0 X1]
--span limits the view of a wide room to that stretch of the back wall (room px): the strips are cropped
to it and items outside it are listed as out of sight. The inventory suggests a span for each NPC.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from room_edit import Room  # noqa: E402

FLOOR_Y = 64          # floor starts here (room pixels); the back wall is above it
STRIP_BOTTOM = 88     # crop a little floor so things standing against the wall show their feet
WALL_FRAME = 12       # white/black frame round every room
SIDE_COLUMN = 34       # the side walls are about one tile wide
SIDE_WALL = 40        # side-wall fixtures sit within this many px of the frame
WIDE_ROOM_TILES = 12  # wider than this, Gemini shrinks the room: draw a stretch of it (--span)
VIEW_TILES = 10       # the stretch of back wall to draw in a wide room
NPC_AT = 0.75         # where across that stretch the speaking NPC should fall (portrait centre is ~83% of the image)


def zone(x, top, w, bottom, W, H, view=None):
    if x + w <= SIDE_COLUMN:           # inside the left wall column (any height)
        return "left wall"
    if x >= W - SIDE_COLUMN:
        return "right wall"
    if bottom <= FLOOR_Y:
        return "back wall (hung on it)"
    if bottom <= FLOOR_Y + 50:
        return "against the back wall (standing on the floor)"
    if top < FLOOR_Y + 36:
        return "second row (may stand out on the floor in front of the back wall: check the render and tour shot for floor between it and the wall)"
    if bottom > max(H * 0.78, H - 40):
        return "behind the camera (leave out)"
    if bottom > H * 0.78:
        return "near edge (bottom of the frame, mostly cropped; include only if it matters)"
    if x + w <= SIDE_WALL and w <= 30:
        return "left wall"
    if x >= W - SIDE_WALL and w <= 30:
        return "right wall"
    depth = "far" if bottom < H * 0.45 else "mid" if bottom < H * 0.62 else "near"
    cx = x + w / 2
    v0, v1 = view or (0, W)            # left/centre/right of what the frame shows (--span), not of the room
    side = "left" if cx < v0 + (v1 - v0) / 3 else "right" if cx > v0 + 2 * (v1 - v0) / 3 else "centre"
    return f"floor, {depth} {side}"


ORDER = ["back wall (hung on it)", "against the back wall (standing on the floor)",
         "second row (may stand out on the floor in front of the back wall: check the render and tour shot for floor between it and the wall)", "left wall", "right wall"]


def scenario_room(path, room_id):
    """The text of one room's block in a .json or .json.erb scenario (brace-matched), or None."""
    text = Path(path).read_text()
    m = re.search(r'"%s"\s*:\s*\{' % re.escape(room_id), text)
    if not m:
        return None
    depth, i = 1, m.end()
    while depth and i < len(text):
        depth += {"{": 1, "}": -1}.get(text[i], 0)
        i += 1
    return re.sub(r"<%#.*?%>", "", text[m.end() - 1:i], flags=re.S)   # drop ERB comments (disabled objects)


def scenario_doors(seg):
    c = re.search(r'"connections"\s*:\s*(\{[^{}]*\})', seg)
    if not c:
        return {}
    try:
        return json.loads(re.sub(r"<%.*?%>", '""', c.group(1)))
    except json.JSONDecodeError:
        return {"raw": c.group(1)}


def scenario_overrides(seg):
    """(object name, sprite) for objects in the room that set their own sprite."""
    out = []
    for sp in re.finditer(r'"sprite"\s*:\s*"([^"]+)"', seg):
        before = seg[max(0, sp.start() - 800):sp.start()]
        after = seg[sp.end():sp.end() + 800]
        nb = re.findall(r'"name"\s*:\s*"([^"]+)"', before.rsplit("{", 1)[-1])
        na = re.search(r'"name"\s*:\s*"([^"]+)"', after.split("}", 1)[0])
        out.append((nb[-1] if nb else na.group(1) if na else "?", sp.group(1)))
    return out


def scenario_npc_sprites(seg):
    """(npc id, spriteSheet, static?, (x, y) position or None) for NPCs in the room; static ones are drawn as props (patients in beds)."""
    out = []
    for m in re.finditer(r'"id"\s*:\s*"([^"]+)"', seg):
        blk = seg[m.end():m.end() + 1500].split('"id"', 1)[0]
        sh = re.search(r'"spriteSheet"\s*:\s*"([^"]+)"', blk)
        if sh:
            pos = re.search(r'"position"\s*:\s*\{\s*"x"\s*:\s*(-?[\d.]+)\s*,\s*"y"\s*:\s*(-?[\d.]+)', blk)
            out.append((m.group(1), sh.group(1), "staticSprite" in blk,
                        (float(pos.group(1)), float(pos.group(2))) if pos else None))
    return out


def npc_where(pos, W, H):
    """Where an NPC stands, as shares of the room's width and depth (position is the sprite centre, in tiles)."""
    if not pos:
        return "  position not set"
    x, y = pos
    if x > W / 32 or y > H / 32:
        return f"  at ({x:g}, {y:g}): outside the room's tiles (phone-only or placed elsewhere)"
    fx, fy = x * 32 / W, (y + 1) * 32 / H
    return (f"  at ({x:g}, {y:g}) tiles: {fx:.0%} across, feet {fy:.0%} of the way from the back wall."
            f" Back-wall items behind them: x~{x * 32 - 32:.0f}..{x * 32 + 32:.0f}")


def slot_audit_lines(scenario, room_id):
    r = subprocess.run([sys.executable, str(ROOT / "scripts/room_gen/slot_audit.py"), "--verbose", scenario],
                       capture_output=True, text=True)
    lines, on = [], False
    for ln in r.stdout.splitlines():
        if not ln.startswith(" "):
            on = ln.startswith(room_id + " ")
            continue
        if on:
            lines.append(ln)
    return lines


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("room", nargs="?")
    ap.add_argument("out_dir", type=Path, nargs="?")
    ap.add_argument("--scenario")
    ap.add_argument("--room-id", "--room", dest="room_id")
    ap.add_argument("--span", nargs=2, type=float, metavar=("X0", "X1"),
                    help="wide rooms: draw only this stretch of the back wall (room px); the room runs on out of sight")
    ap.add_argument("--list-rooms", action="store_true",
                    help="with --scenario: list every room id and map type (slot_audit skips rooms with no objects)")
    a = ap.parse_args()
    if a.list_rooms:
        seg = scenario_room(a.scenario, "rooms")
        # a room's "type" need not be its first key (e.g. "_comment" can come first); take the first
        # "type" before the room's objects/npcs lists, whose entries have their own "type"
        for rm in re.finditer(r'\n {4}"([A-Za-z0-9_]+)"\s*:\s*\{', seg or ""):
            head = re.split(r'"(?:objects|npcs)"\s*:', (seg or "")[rm.end():rm.end() + 3000], 1)[0]
            tm = re.search(r'"type"\s*:\s*"([^"]+)"', head)
            if tm and not rm.group(1).startswith("_"):
                print(f"{rm.group(1)}  ({tm.group(1)})")
        return
    if not (a.room and a.out_dir):
        ap.error("ROOM_TYPE and OUT_DIR are required")
    # the game maps some room types to differently-cased files (room_it -> room_IT.json)
    rooms_dir = ROOT / "public/break_escape/assets/rooms"
    if not (rooms_dir / f"{a.room}.json").exists():
        hit = [f.stem for f in rooms_dir.glob("*.json") if f.stem.lower() == a.room.lower()]
        if not hit:
            sys.exit(f"no map file for {a.room} in {rooms_dir}")
        print(f"(map type {a.room} -> file {hit[0]}.json)")
        a.room = hit[0]
    a.out_dir.mkdir(parents=True, exist_ok=True)

    subprocess.run([sys.executable, str(ROOT / "scripts/render_room_preview.py"), a.room, "--scale", "2",
                    "--out", str(a.out_dir)], check=True, stdout=subprocess.DEVNULL)
    render = a.out_dir / f"{a.room}.png"
    top = a.out_dir / f"{a.room}_topdown.png"
    render.replace(top)

    m = json.loads((ROOT / f"public/break_escape/assets/rooms/{a.room}.json").read_text())
    W, H = m["width"] * m["tilewidth"], m["height"] * m["tileheight"]
    im = Image.open(top)
    s = im.width // W
    x0, x1 = WALL_FRAME, W - WALL_FRAME
    if a.span:
        x0, x1 = max(x0, int(a.span[0])), min(x1, int(a.span[1]))
    strip = im.crop((x0 * s, (WALL_FRAME - 1) * s, x1 * s, STRIP_BOTTOM * s))
    strip = strip.resize((strip.width * 2, strip.height * 2), Image.NEAREST)
    strip.save(a.out_dir / f"{a.room}_backwall.png")
    # wall only (down to the skirting): the floor band shows second-row sprites cut off under the
    # skirting, which reads as "against the wall"; send this one when the room has free-standing rows
    wall = im.crop((x0 * s, (WALL_FRAME - 1) * s, x1 * s, FLOOR_Y * s))
    wall.resize((wall.width * 2, wall.height * 2), Image.NEAREST).save(a.out_dir / f"{a.room}_backwall_wall.png")

    objs = list(Room(a.room).objects())
    tables = [(o, n) for layer, o, n in objs if layer == "tables"]

    def on_table(o):
        cx, b = o["x"] + o["width"] / 2, o["y"]
        for t, tn in tables:
            if t["x"] <= cx <= t["x"] + t["width"] and t["y"] - t["height"] - 4 <= b <= t["y"]:
                return t, tn
        return None, None

    zones = {}
    for layer, o, name in objs:
        if name == "?":
            name = f"?({o.get('type') or o.get('name') or 'no sprite'}; look at the render)"
        w, h = o["width"], o["height"]
        x, bottom = o["x"], o["y"]          # Tiled tile objects: y is the bottom edge
        cond = " (conditional; see EMPTY below)" if layer.startswith("conditional") else ""
        t, tn = on_table(o) if "table_item" in layer else (None, None)
        if t:
            z = zone(t["x"], t["y"] - t["height"], t["width"], t["y"], W, H, a.span)
            text = f"  on {tn}: {name}  x={x:.0f}..{x + w:.0f}{cond}"
            x = t["x"] + 0.5 + x / 10000      # sort under its table
        else:
            z = zone(x, bottom - h, w, bottom, W, H, a.span)
            text = f"{name}  x={x:.0f}..{x + w:.0f} y={bottom - h:.0f}..{bottom:.0f}{cond}"
            if bottom > FLOOR_Y + 50 and not z.endswith("wall"):
                # feet position: how far out from the back wall the item stands (0.6 m per 32 px tile)
                gap = max(0.0, (bottom - 8 - FLOOR_Y) / 32 * 0.6)
                text += f"  [feet ~{gap:.1f} m out from the back wall; a rough guide, confirm in the render]"
        if a.span:
            b = t or o
            cx = b["x"] + b["width"] / 2
            if cx < a.span[0]:
                z = "out of sight to the left (outside the span: leave out)"
            elif cx > a.span[1]:
                z = "out of sight to the right (outside the span: leave out)"
        zones.setdefault(z, []).append((x, text))

    lines = [f"Room {a.room}: {W}x{H} px ({m['width']}x{m['height']} tiles; about {W / 32 * 0.6:.0f} m wide, {H / 32 * 0.6:.0f} m deep). "
             "Camera near the south wall looking north.",
             "Items left to right within each zone; desk/counter contents are listed under their table.",
             "Names are sprite names: look at the render to see what each one is.", ""]
    if a.span:
        cut = [side for side, c in (("left", a.span[0] > WALL_FRAME + 8), ("right", a.span[1] < W - WALL_FRAME - 8)) if c]
        lines += [f"VIEW: only x={a.span[0]:.0f}..{a.span[1]:.0f} of the back wall ({(a.span[1] - a.span[0]) / 32 * 0.6:.0f} m of it), as in the strips.",
                  f"  The room runs on out of sight to the {' and '.join(cut) or '(neither: the span covers the room)'}:"
                  " tell Gemini the back wall carries on past that edge of the frame, with no side wall or corner there.", ""]
    elif m["width"] > WIDE_ROOM_TILES:
        lines += [f"!! WIDE ROOM ({m['width']} tiles): drawn whole it comes out looking small. Re-run with --span for the"
                  f" NPC who talks here (suggestions in the NPC list), so the frame shows about {VIEW_TILES} tiles of back wall.", ""]
    for z in ORDER + sorted(k for k in zones if k not in ORDER):
        if z in zones:
            lines.append(f"## {z}")
            lines += [f"  {t}" for _, t in sorted(zones[z])]
            lines.append("")
    if a.scenario and a.room_id:
        seg = scenario_room(a.scenario, a.room_id)
        if seg is None:
            lines.append(f"!! room {a.room_id} not found in {a.scenario}")
        else:
            dm = re.search(r'"dimensions"\s*:\s*\{\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+)', seg)
            if dm and (int(dm.group(1)), int(dm.group(2))) != (m["width"], m["height"]):
                lines.append(f"!! scenario dimensions {dm.group(1)}x{dm.group(2)} differ from the map's "
                             f"{m['width']}x{m['height']} tiles; the map is what is drawn.")
                lines.append("")
            lt = re.search(r'"lighting"\s*:\s*\{', seg)
            if lt:
                depth, i = 1, lt.end()
                while depth and i < len(seg):
                    depth += {"{": 1, "}": -1}.get(seg[i], 0)
                    i += 1
                lt_text = re.sub(r"\s+", " ", seg[lt.end() - 1:i])
            lines.append("## lighting config (the mood to draw; compare it when reusing another mission's background)")
            lines.append("  " + (lt_text[:600] if lt else "none in the room (mission default)"))
            plan = Path(a.scenario).parent / "LIGHTING_PLAN.md"
            if plan.exists():
                mood = [ln.strip() for ln in plan.read_text(errors="replace").splitlines()
                        if re.search(r"mood|day|night|evening", ln, re.I)][:4]
                lines.append(f"  mission mood ({plan.relative_to(ROOT) if plan.is_absolute() else plan}):")
                lines += [f"    {m_[:160]}" for m_ in mood] or ["    (read the plan)"]
            lines.append("")
            lines.append("## doors (scenario connections; the render does not draw doors)")
            lines.append(f"  {scenario_doors(seg)}")
            lines.append("  north = a door in the back wall (a single one sits in a back-wall corner);")
            lines.append("  east/west = doors in the side walls (position along the wall: see the in-game tour shot);")
            lines.append("  south = behind the camera.")
            lines.append("  Door art painted into the map's walls (render and strip) is not reliable: trust the connections and the tour shot.")
            lines.append("")
            ov = scenario_overrides(seg)
            lines.append("## scenario sprite overrides (the render shows the map sprite, the game shows these)")
            lines += [f"  {n} -> {sp}" for n, sp in ov] or ["  none"]
            lines.append("")
            audit = slot_audit_lines(a.scenario, a.room_id)
            filled = {(n, int(x)) for n, x in re.findall(r"-> (\S+) \(\w+\) at (-?\d+),", "\n".join(audit))}
            empty = [(n, o) for layer, o, n in objs
                     if layer.startswith("conditional") and (n, int(round(o["x"]))) not in filled]
            lines.append("## EMPTY in this mission: conditional slots no scenario object claims")
            lines.append("  NPCs drawn as static props (e.g. patients in beds) can still fill these: check the NPC list and the tour shot.")
            def empty_zone(o):
                t, _ = on_table(o)
                b = t or o
                return zone(b["x"], b["y"] - b["height"], b["width"], b["y"], W, H, a.span)
            lines += [f"  {n}  x={o['x']:.0f} ({empty_zone(o)})"
                      for n, o in sorted(empty, key=lambda t: t[1]["x"])] or ["  none"]
            lines.append("")
            lines.append("## NPCs in this room (spriteSheet; static ones are drawn as props, not people)")
            for i, sh, st, pos in scenario_npc_sprites(seg):
                lines.append(f"  {i}: {sh}{'  (static)' if st else ''}{npc_where(pos, W, H)}")
                if pos and not st and m["width"] > WIDE_ROOM_TILES and pos[0] <= m["width"]:
                    span = VIEW_TILES * 32
                    sx0 = min(max(0, pos[0] * 32 - NPC_AT * span), W - span)
                    lines.append(f"      suggested --span {sx0:.0f} {sx0 + span:.0f} (puts them about {(pos[0] * 32 - sx0) / span:.0%} across the view)")
            if not scenario_npc_sprites(seg):
                lines.append("  none")
            lines.append("  In the chat the speaking NPC stands at about 83% of the background's width, so what the map")
            lines.append("  shows around them belongs at about 55-90% across (see 'Behind the NPC' in the skill).")
            lines.append("")
            lines.append("## slot audit: which map slot each scenario object takes")
            lines += audit or ["  (none)"]
            lines.append("")
            npcs = re.search(r'"npcs"\s*:\s*\[\s*\]', seg)
            pinned = sorted(set(re.findall(r'"background"\s*:\s*"([^"]+)"', seg)))
            lines.append("## where this background will show")
            if npcs or '"npcs"' not in seg:
                lines.append("  !! no NPCs in this room: the background shows only if an NPC from elsewhere talks here")
            if pinned:
                lines.append("  !! conversations in this room set their own background, which wins over chatBackground:")
                lines += [f"     {bg}  (grep it in the scenario to see which scenes)" for bg in pinned]
            ink = []
            for f in sorted((Path(a.scenario).parent / "ink").glob("*.ink")):
                for n, ln in enumerate(f.read_text(errors="replace").splitlines(), 1):
                    if "Background[" in ln:
                        ink.append(f"     {f.relative_to(ROOT) if f.is_absolute() else f}:{n}: {ln.strip()[:90]}")
            if ink:
                lines.append("  !! the mission's ink sets backgrounds (Background[...] wins over chatBackground;")
                lines.append("     Background[none] means a plain frame). Check which of these play in this room:")
                lines += ink
            if not (npcs or '"npcs"' not in seg or pinned):
                lines.append("  every conversation with this room's NPCs that has no background of its own")
    out = a.out_dir / f"{a.room}_inventory.txt"
    out.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"wrote {top}\nwrote {a.out_dir / (a.room + '_backwall.png')}\nwrote {a.out_dir / (a.room + '_backwall_wall.png')}\nwrote {out}")


if __name__ == "__main__":
    main()
