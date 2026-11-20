#!/usr/bin/env python3
"""Seated-scale sprite edits (docs/achitechture/SEATED_SCALE_AUDIT.md, approved 2026-11-06).

Native-size row edits only, never a resample: chair legs grow by repeating one plain leg row,
the tall desks lose four rows of plain legs and panel. Each sprite is edited only while it
still has its original height, so the script can be re-run. The originals are in git history
(before commit "Seated scale: sprites").

  python3 tools/seated_scale/fix_sprites.py [--apply]
"""
import os
import sys

import numpy as np
from PIL import Image

A = os.path.join(os.path.dirname(__file__), "..", "..", "public", "break_escape", "assets")

# name: (folder, original height, op, row, count)
EDITS = {
    "hospital_chair_north": ("objects", 26, "dup", 20, 4),
    "hospital_chair_north2": ("objects", 26, "dup", 20, 4),
    "aw_chair_north_charcoal1": ("objects", 26, "dup", 20, 4),
    "aw_chair_north_slate1": ("objects", 26, "dup", 20, 4),
    "hospital_chair_south": ("objects", 32, "dup", 27, 3),
    "aw_chair_south_charcoal1": ("objects", 32, "dup", 27, 3),
    "aw_chair_south_slate1": ("objects", 32, "dup", 27, 3),
    "m10_steel_chair1": ("objects", 26, "dup", 21, 5),
    "hospital_desk1": ("tables", 48, "del", 33, 4),
    "hospital_desk2": ("tables", 48, "del", 33, 4),
    "exec_desk1": ("objects", 46, "del", 31, 4),
}


def edit(a, op, row, k):
    if op == "dup":
        return np.concatenate([a[:row + 1]] + [a[row:row + 1]] * k + [a[row + 1:]], 0)
    return np.concatenate([a[:row], a[row + k:]], 0)


def main(apply):
    for name, (folder, h0, op, row, k) in EDITS.items():
        p = os.path.join(A, folder, name + ".png")
        im = Image.open(p)
        if im.height != h0:
            print("%s: height %d, already edited" % (name, im.height))
            continue
        mode = im.mode
        a = np.array(im)
        b = edit(a, op, row, k)
        print("%s: %s row %d x%d, %dx%d -> %dx%d" % (name, op, row, k, im.width, im.height, b.shape[1], b.shape[0]))
        if apply:
            out = Image.fromarray(b, mode=mode)
            if mode == "P":
                out.putpalette(im.getpalette())
                if "transparency" in im.info:
                    out.info["transparency"] = im.info["transparency"]
            out.save(p, **({"transparency": im.info["transparency"]} if "transparency" in im.info else {}))


if __name__ == "__main__":
    main("--apply" in sys.argv)
