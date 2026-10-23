#!/usr/bin/env python3
"""Assemble a Break Escape 2x2 talk sheet from a base bust + candidate speaking frames.

Frame 0 (the base) is the canonical pose. Frames 1-3 are copies of the base with ONLY
the face region replaced by the corresponding region of a candidate frame, so the body,
arms and shoulders are guaranteed byte-identical across the sheet.

Usage:
  build_talk_sheet.py --base bust.png --frames anim/*.png --out out_talk.png
  build_talk_sheet.py --base bust.png --frames anim/*.png --out out_talk.png \
                      --face 40,0,90,55 --pick 3,5,7
"""
import argparse
import sys

import numpy as np
from PIL import Image


def load_rgba(path, size):
    im = Image.open(path).convert("RGBA")
    if im.size != size:
        im = im.resize(size, Image.NEAREST)
    return np.array(im).astype(np.int16)


def diff_mask(a, b):
    return np.abs(a - b).sum(axis=2) > 0


def auto_face_box(base, frames):
    """Union of change regions, clipped to the upper 55% of the canvas (the head)."""
    h, w = base.shape[:2]
    acc = np.zeros((h, w), dtype=bool)
    for f in frames:
        acc |= diff_mask(base, f)
    acc[int(h * 0.55):, :] = False
    ys, xs = np.nonzero(acc)
    if len(ys) == 0:
        # Fall back to the central-upper third, a safe head box for a 128px bust.
        return (int(w * 0.28), 0, int(w * 0.72), int(h * 0.45))
    pad = 2
    return (
        max(0, xs.min() - pad),
        max(0, ys.min() - pad),
        min(w, xs.max() + 1 + pad),
        min(h, ys.max() + 1 + pad),
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="frame 0 / closed-mouth bust PNG")
    ap.add_argument("--frames", required=True, nargs="+", help="candidate speaking frames")
    ap.add_argument("--out", required=True)
    ap.add_argument("--face", help="x0,y0,x1,y1 face box override (base-image coords)")
    ap.add_argument("--pick", help="comma-separated 1-based indices into --frames to force")
    ap.add_argument("--mouth", help="cx,cy,rx,ry: paste only this ellipse (the lips) instead of "
                    "the whole face box. Talk models redraw the cheeks and chin a shade off, "
                    "which shows as a flickering rectangle; the ellipse keeps the bust's skin.")
    args = ap.parse_args()

    base_im = Image.open(args.base).convert("RGBA")
    size = base_im.size
    if size[0] != size[1]:
        sys.exit(f"base must be square, got {size}")
    base = np.array(base_im).astype(np.int16)

    cands = [load_rgba(p, size) for p in args.frames]
    names = list(args.frames)

    if args.face:
        x0, y0, x1, y1 = (int(v) for v in args.face.split(","))
    else:
        x0, y0, x1, y1 = auto_face_box(base, cands)
    print(f"face box: ({x0},{y0})-({x1},{y1})")

    # Score each candidate by how much it changes INSIDE the face box, and penalise
    # candidates whose change is mostly outside it (body drift rather than mouth motion).
    scored = []
    for i, (nm, c) in enumerate(zip(names, cands)):
        m = diff_mask(base, c)
        inside = int(m[y0:y1, x0:x1].sum())
        outside = int(m.sum()) - inside
        scored.append((i, nm, inside, outside))
        print(f"  [{i+1}] {nm}: inside={inside} outside={outside}")

    if args.pick:
        idx = [int(v) - 1 for v in args.pick.split(",")]
    else:
        usable = [s for s in scored if s[2] > 0]
        if not usable:
            sys.exit("no candidate frame changes anything inside the face box")
        # Prefer the most mouth-motion; then spread the picks across the sequence so
        # the three speaking frames look like distinct visemes rather than near-dupes.
        usable.sort(key=lambda s: -s[2])
        idx = [s[0] for s in usable[:6]]
        idx.sort()
        if len(idx) > 3:
            idx = [idx[0], idx[len(idx) // 2], idx[-1]]
    while len(idx) < 3:
        idx.append(idx[-1] if idx else 0)
    idx = idx[:3]
    print("picked frames:", [i + 1 for i in idx])

    w = size[0]
    sheet = Image.new("RGBA", (w * 2, w * 2), (0, 0, 0, 0))
    sheet.paste(base_im, (0, 0))

    positions = [(w, 0), (0, w), (w, w)]
    for slot, (i, (px, py)) in enumerate(zip(idx, positions), start=1):
        frame = base_im.copy()
        src = Image.open(names[i]).convert("RGBA")
        if src.size != size:
            src = src.resize(size, Image.NEAREST)
        if args.mouth:
            cx, cy, rx, ry = (float(v) for v in args.mouth.split(","))
            yy, xx = np.mgrid[0:size[1], 0:size[0]]
            inside = ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1.0
            out = np.array(frame)
            out[inside] = np.array(src)[inside]  # hard replace inside the lips ellipse
            frame = Image.fromarray(out)
        else:
            face = src.crop((x0, y0, x1, y1))
            frame.paste(face, (x0, y0))  # hard paste: replace, do not alpha-blend
        changed = int(diff_mask(base, np.array(frame).astype(np.int16)).sum())
        print(f"frame {slot} <- {names[i]}: {changed} px changed")
        sheet.paste(frame, (px, py))

    sheet.save(args.out)
    print(f"wrote {args.out} ({sheet.size[0]}x{sheet.size[1]})")


if __name__ == "__main__":
    main()
