#!/usr/bin/env python3
"""
Castor centre of each swivel chair's rotation sheet (SEAT_BOX_PLAN.md section 5, step 1).

For every frame of a rotation sheet (<base>1.png .. <base>8.png in assets/objects) it finds
the opaque pixels in the bottom 6 rows of the frame's opaque area (the castor star) and
takes the centre of their bounding box. It prints, per family, the frame size, each
frame's centre and bounding box, the mean centre over the 8 frames and the spread
(max - min) on each axis, plus the chair body today (rooms.js STATIC_SWIVEL_PROPS, or
the generic bottom-third box with a 5 px inset) and its centre for comparison.

Usage:
  python3 scripts/room_gen/measure_castors.py [--json OUT] [--rows 6]

Read-only on the repo; it changes no asset.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OBJECTS = os.path.join(ROOT, "public", "break_escape", "assets", "objects")

# rotation base -> seat family (seating.js SWIVEL_SEATS)
SHEETS = {
    "chair-darkgray-1-rotate": "office40",
    "chair-grey-1-rotate": "office40",
    "chair-grey-4-rotate": "office40",
    "chair-white-1-rotate": "white32",
    "chair-white-2-rotate": "white32",
    "chair-exec-rotate": "exec",
}
# bodies set in rooms.js STATIC_SWIVEL_PROPS (rotation-frame px); others take the generic box
BODIES = {
    "chair-darkgray-1-rotate": (18, 8, 11, 31),
    "chair-grey-1-rotate": (18, 8, 11, 31),
    "chair-grey-4-rotate": (18, 8, 11, 31),
}


def generic_body(w, h):
    """rooms.js: width - 10, bottom third, 5 px inset."""
    return (w - 10, h / 3, 5, h - h / 3)


def measure(base, rows):
    frames = []
    for i in range(1, 9):
        p = os.path.join(OBJECTS, f"{base}{i}.png")
        a = np.array(Image.open(p).convert("RGBA"))[:, :, 3] > 0
        ys, xs = np.nonzero(a)
        if not len(ys):
            continue
        bottom = ys.max()
        band = a[bottom - rows + 1: bottom + 1, :]
        bys, bxs = np.nonzero(band)
        x0, x1 = bxs.min(), bxs.max()
        y0, y1 = bys.min() + bottom - rows + 1, bys.max() + bottom - rows + 1
        frames.append({
            "frame": i, "size": [a.shape[1], a.shape[0]],
            "castor": [round((x0 + x1 + 1) / 2, 1), round((y0 + y1 + 1) / 2, 1)],
            "box": [int(x0), int(y0), int(x1 - x0 + 1), int(y1 - y0 + 1)],
            "bottom": int(bottom),
        })
    cx = [f["castor"][0] for f in frames]
    cy = [f["castor"][1] for f in frames]
    w, h = frames[0]["size"]
    body = BODIES.get(base) or generic_body(w, h)
    return {
        "base": base, "family": SHEETS[base], "frame": [w, h], "frames": frames,
        "mean": [round(float(np.mean(cx)), 2), round(float(np.mean(cy)), 2)],
        "spread": [round(max(cx) - min(cx), 1), round(max(cy) - min(cy), 1)],
        "starWidth": [min(f["box"][2] for f in frames), max(f["box"][2] for f in frames)],
        "body": [round(v, 2) for v in body],
        "bodyCentre": [round(body[2] + body[0] / 2, 2), round(body[3] + body[1] / 2, 2)],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default=None)
    ap.add_argument("--rows", type=int, default=6)
    args = ap.parse_args()
    out = [measure(b, args.rows) for b in SHEETS]
    for r in out:
        print(f"{r['base']:<26} {r['family']:<9} frame {r['frame'][0]}x{r['frame'][1]}  "
              f"castor mean ({r['mean'][0]}, {r['mean'][1]}) spread ({r['spread'][0]}, {r['spread'][1]})  "
              f"star width {r['starWidth'][0]}-{r['starWidth'][1]}  "
              f"body {r['body']} centre ({r['bodyCentre'][0]}, {r['bodyCentre'][1]})")
        for f in r["frames"]:
            print(f"    frame {f['frame']}: castor ({f['castor'][0]}, {f['castor'][1]}) box {f['box']} bottom row {f['bottom']}")
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(out, fh, indent=1)


if __name__ == "__main__":
    main()
