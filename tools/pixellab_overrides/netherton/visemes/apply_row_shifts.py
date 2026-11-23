#!/usr/bin/env python3
"""Re-register Netherton's nose/moustache rows on the viseme sheet (integer shifts only).

The `pick` composite left the moustache band of `round` and `small_open` one pixel left of
the bust's. This moves those row bands +1 px in x (columns 56..75, edges refilled from the
rest frame). Run after any `pick netherton visemes ...`; it refuses to run twice (the sheet's
.json records `rowShifts`).
Usage: python3 apply_row_shifts.py [characters_dir]
"""
import json, sys, numpy as np
from pathlib import Path
from PIL import Image

d = Path(sys.argv[1] if len(sys.argv) > 1 else "public/break_escape/assets/characters")
png, js = d / "netherton_visemes.png", d / "netherton_visemes.json"
meta = json.loads(js.read_text())
if "rowShifts" in meta:
    sys.exit("already applied")
FREEZE_BELOW = 30  # rows 0..30 of every mouth viseme are copied from rest (nose and moustache top stay put)
FROZEN = ["teeth", "round", "small_open", "medium_open", "wide_open"]  # not blink (eyes only)
SHIFTS = {"round": (28, 33, 1), "small_open": (27, 30, 1)}  # name: first row, last row, dx
X0, X1 = 56, 75
a = np.array(Image.open(png).convert("RGBA"))
for name, (y0, y1, dx) in SHIFTS.items():
    c = meta["visemes"].index(name) * 128
    f, rest = a[:, c:c + 128].copy(), a[:, 0:128]
    for y in range(y0, y1 + 1):
        row = f[y].copy()
        f[y, X0:X1 + dx + 1] = rest[y, X0:X1 + dx + 1]
        f[y, X0 + dx:X1 + dx] = row[X0:X1]
    a[:, c:c + 128] = f
for name in FROZEN:
    c = meta["visemes"].index(name) * 128
    a[0:FREEZE_BELOW + 1, c:c + 128] = a[0:FREEZE_BELOW + 1, 0:128]
meta["frozenRows"] = {"rows": [0, FREEZE_BELOW], "frames": FROZEN, "source": "rest frame"}
meta["rowShifts"] = {k: {"rows": [v[0], v[1]], "dx": v[2], "cols": [X0, X1]} for k, v in SHIFTS.items()}
Image.fromarray(a).save(png)
js.write_text(json.dumps(meta, indent=2) + "\n")
