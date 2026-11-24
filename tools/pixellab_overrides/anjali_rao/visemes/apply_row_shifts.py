#!/usr/bin/env python3
"""Re-register Anjali Rao's medium_open viseme to the rest frame (integer shifts only).

medium_open was pasted with the head +1,-1 px, so its mouth sits one pixel right of every other
frame (corners at x 58/65 against rest's 57/64, lips 60-63 against 59-62) and its nose rows
22-25 differ from rest, so the face twitches when the viseme plays (owner, 24 Nov: "mouth
shifted over by a pixel"). This moves medium_open's mouth band (rows 26..35, cols 54..68) -1 px
in x, refilling the vacated column from rest, and freezes rows 0..25 of every mouth viseme from
the rest frame (the approach VID1 used for Netherton). teeth and round sit at most half a pixel
off-centre, which no integer shift improves, so they keep their mouths.
Run after any `pick anjali_rao visemes ...`; it refuses to run twice (the sheet's .json records `rowShifts`).
Usage: python3 apply_row_shifts.py [characters_dir]
"""
import json, sys, numpy as np
from pathlib import Path
from PIL import Image

d = Path(sys.argv[1] if len(sys.argv) > 1 else "public/break_escape/assets/characters")
png, js = d / "anjali_rao_visemes.png", d / "anjali_rao_visemes.json"
meta = json.loads(js.read_text())
if "rowShifts" in meta:
    sys.exit("already applied")
FREEZE_BELOW = 25  # rows 0..25 of every mouth viseme are copied from rest (nose stays put)
FROZEN = ["teeth", "round", "small_open", "medium_open", "wide_open"]  # not blink (eyes only)
SHIFTS = {"medium_open": (26, 35, -1)}  # name: first row, last row, dx
X0, X1 = 54, 68
a = np.array(Image.open(png).convert("RGBA"))
for name, (y0, y1, dx) in SHIFTS.items():
    c = meta["visemes"].index(name) * 128
    f, rest = a[:, c:c + 128].copy(), a[:, 0:128]
    for y in range(y0, y1 + 1):
        row = f[y].copy()
        f[y, X0 + min(dx, 0):X1 + max(dx, 0) + 1] = rest[y, X0 + min(dx, 0):X1 + max(dx, 0) + 1]
        f[y, X0 + dx:X1 + dx + 1] = row[X0:X1 + 1]
    a[:, c:c + 128] = f
for name in FROZEN:
    c = meta["visemes"].index(name) * 128
    a[0:FREEZE_BELOW + 1, c:c + 128] = a[0:FREEZE_BELOW + 1, 0:128]
meta["frozenRows"] = {"rows": [0, FREEZE_BELOW], "frames": FROZEN, "source": "rest frame"}
meta["rowShifts"] = {k: {"rows": [v[0], v[1]], "dx": v[2], "cols": [X0, X1]} for k, v in SHIFTS.items()}
Image.fromarray(a).save(png)
js.write_text(json.dumps(meta, indent=2) + "\n")
print("applied", meta["rowShifts"], "frozen rows 0..%d" % FREEZE_BELOW)
