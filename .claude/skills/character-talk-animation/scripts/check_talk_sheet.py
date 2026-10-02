#!/usr/bin/env python3
"""Verify a Break Escape talk sheet: 2x2 grid, square, and only the face moves.

Usage: check_talk_sheet.py <name>_talk.png
"""
import sys

import numpy as np
from PIL import Image


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    ok = True

    if w != h:
        print(f"FAIL  not square: {w}x{h}")
        ok = False
    if w < 256 or w % 2:
        print(f"FAIL  width must be even and >= 256 for the renderer to treat it as a 2x2 sheet (got {w})")
        ok = False
    if not ok:
        sys.exit(1)

    s = w // 2
    a = np.array(im).astype(np.int16)
    f = [a[r * s:(r + 1) * s, c * s:(c + 1) * s] for r in range(2) for c in range(2)]
    print(f"{path}: {w}x{h}, frame size {s}x{s}")

    for i in range(1, 4):
        m = np.abs(f[0] - f[i]).sum(axis=2) > 0
        n = int(m.sum())
        if n == 0:
            print(f"  frame {i}: WARN identical to frame 0 (no mouth movement)")
            ok = False
            continue
        ys, xs = np.nonzero(m)
        box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
        below = int(m[int(s * 0.55):, :].sum())
        note = ""
        if below:
            note = f"  <-- WARN {below}px change below the head line (body drift)"
            ok = False
        print(f"  frame {i}: {n:>5} px changed, bbox x{box[0]}-{box[2]} y{box[1]}-{box[3]}{note}")

    print("OK" if ok else "PROBLEMS FOUND")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
