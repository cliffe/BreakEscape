#!/usr/bin/env python3
"""Find hand edits to walk atlases that tools/pixellab_overrides doesn't know about.

`pixellab_pipeline.py import` rebuilds an atlas from the PixelLab ZIP export plus the committed
frame overrides, so an edit painted straight onto public/.../characters/<key>.png is lost on
the next import (e.g. after adding an animation). This rebuilds each atlas offline from the
local export (tmp/pixellab/_export/<key>) and the overrides, then diffs it frame by frame
against the committed atlas. Any frame that differs is an untracked hand edit. Frames that
have an override file are skipped (a `fix` not yet rebuilt into the atlas differs on purpose),
so an edit painted over an already-overridden frame is not caught. `pixellab_pipeline.py
import` runs this check itself before replacing an existing atlas.

    python3 tools/pixellab_drift_audit.py                 # every key in pixellab_characters.json
    python3 tools/pixellab_drift_audit.py female_nurse2_v2
    python3 tools/pixellab_drift_audit.py female_nurse2_v2 --adopt   # save drifted frames as overrides

--adopt crops each drifted frame out of the committed atlas back to the export frame's size and
position and writes it to tools/pixellab_overrides/<key>/<animation>/<direction>/frame_NNN.png,
so the committed atlas becomes reproducible. Run the audit again afterwards: it should be clean.
Nothing in public/ is modified.
"""
import argparse
import contextlib
import io
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "tools"))
from convert_pixellab_to_spritesheet import process_character  # noqa: E402

ASSETS = REPO / "public/break_escape/assets/characters"
EXPORTS = REPO / "tmp/pixellab/_export"
OVERRIDES = REPO / "tools/pixellab_overrides"
WORK = REPO / "tmp/pixellab/_drift"


def export_root(export_dir):
    sf = export_dir / ".state_folder"
    if sf.exists():
        return export_dir / sf.read_text().strip()
    return next(p for p in [export_dir, *sorted(export_dir.iterdir())] if (p / "animations").is_dir())


def frames(png, js):
    im = Image.open(png).convert("RGBA")
    out = {}
    for name, v in json.loads(Path(js).read_text())["frames"].items():
        f = v["frame"]
        out[name] = im.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    return out


def changed(a, b):
    return sum(1 for p in ImageChops.difference(a, b).getdata() if any(p))


def audit(key):
    """Returns (status, {frame name: changed pixels | reason}, export root)."""
    if not (ASSETS / f"{key}.png").exists():
        return "no atlas", {}, None
    if not (EXPORTS / key).exists():
        return "no local export in tmp/pixellab/_export (cannot check)", {}, None
    work = WORK / "work" / key
    shutil.rmtree(work, ignore_errors=True)
    shutil.copytree(EXPORTS / key, work)
    root = export_root(work)
    ov = OVERRIDES / key
    for f in ov.rglob("*.png") if ov.exists() else []:
        rel = f.relative_to(ov)
        dest = root / rel if rel.parts[0] == "rotations" else root / "animations" / rel
        if dest.parent.exists():
            shutil.copy(f, dest)
    out = WORK / "atlas" / key
    out.mkdir(parents=True, exist_ok=True)
    with contextlib.redirect_stdout(io.StringIO()):
        if not process_character(work, out, key=key):
            return "rebuild failed", {}, None
    committed = frames(ASSETS / f"{key}.png", ASSETS / f"{key}.json")
    rebuilt = frames(out / f"{key}.png", out / f"{key}.json")
    drift = {}
    for n in sorted(set(committed) | set(rebuilt)):
        anim, rest = n.split("_", 1)
        direction, fr = rest.rsplit("_frame_", 1)
        if (ov / anim / direction / f"frame_{fr}.png").exists() or n not in committed:
            continue  # a fix or a new animation not yet built into the atlas: expected
        if n not in rebuilt:
            drift[n] = "missing in rebuild"
        elif committed[n].size != rebuilt[n].size:
            drift[n] = "frame size differs"
        elif px := changed(committed[n], rebuilt[n]):
            drift[n] = px
    return ("drifted" if drift else "clean"), drift, export_root(EXPORTS / key)


def adopt(key, drift, root):
    committed = frames(ASSETS / f"{key}.png", ASSETS / f"{key}.json")
    for n, px in drift.items():
        if not isinstance(px, int):
            print(f"  skip {n}: {px} (fix by hand)")
            continue
        anim, rest = n.split("_", 1)
        direction, fr = rest.rsplit("_frame_", 1)
        ex = Image.open(root / "animations" / anim / direction / f"frame_{fr}.png").convert("RGBA")
        cell = committed[n]

        def placed(ox, oy):
            c = Image.new("RGBA", cell.size)
            c.paste(ex, (ox, oy))
            return c

        # The converter pads the export frame onto the canvas; find where by best match.
        _, ox, oy = min((changed(placed(x, y), cell), x, y)
                        for x in range(cell.width - ex.width + 1)
                        for y in range(cell.height - ex.height + 1))
        crop = cell.crop((ox, oy, ox + ex.width, oy + ex.height))
        full = Image.new("RGBA", cell.size)
        full.paste(crop, (ox, oy))
        outside = changed(full, cell)
        dest = OVERRIDES / key / anim / direction / f"frame_{fr}.png"
        dest.parent.mkdir(parents=True, exist_ok=True)
        crop.save(dest)
        note = f", {outside} edited px outside the export frame were lost" if outside else ""
        print(f"  adopted {n} -> {dest.relative_to(REPO)}{note}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("keys", nargs="*", help="atlas keys (default: every key in tools/pixellab_characters.json)")
    ap.add_argument("--adopt", action="store_true", help="save drifted frames as overrides")
    args = ap.parse_args()
    keys = args.keys or sorted(json.loads((REPO / "tools/pixellab_characters.json").read_text()))
    dirty = 0
    for key in keys:
        status, drift, root = audit(key)
        print(f"{key}: {status}" + (f", {len(drift)} frame(s)" if drift else ""))
        strips = {}
        for n, px in drift.items():
            strips.setdefault(n.rsplit("_frame_", 1)[0], []).append(f"{n.rsplit('_', 1)[1]}:{px}")
        for s, fs in sorted(strips.items()):
            print(f"    {s}  {' '.join(fs)}")
        if drift:
            dirty += 1
            if args.adopt:
                adopt(key, drift, root)
    sys.exit(1 if dirty and not args.adopt else 0)


if __name__ == "__main__":
    main()
