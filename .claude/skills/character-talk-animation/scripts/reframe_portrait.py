#!/usr/bin/env python3
"""Crop a Gemini portrait so the character fills the square, and mirror it to face right.

The background doesn't need to be transparent: the PixelLab bust stage removes it
(background_removal_task "remove_complex_background"). It is only used here to find the
character's bounding box. By default its colour is sampled from the four corners, and the
pixels close to it that connect to the border are treated as background. Flood-filling from
the border, rather than matching the colour anywhere, keeps a similar colour inside the
character (a white lab coat on a pale background) from counting as background.

If the background isn't plain enough to find (a gradient or vignette), the character's box
comes out as the whole image and nothing is cropped; the script says so.

--key also writes the background as alpha 0. It isn't needed for the pipeline, and on a
garment close to the background colour it punches holes, so check the result over a
contrasting colour if you use it.

The Break Escape dialogue cast faces RIGHT (three-quarter turn toward the right of
the frame). Gemini is unreliable at honouring a left/right instruction in the prompt,
so orientation is fixed here instead: pass --flip to mirror the character horizontally.
Gemini's default output for this prompt faces left, so --flip is the normal case.

Usage:
  reframe_portrait.py <portrait.png> [-o out.png] [--size 1024]
                       [--bg-color auto|R,G,B] [--tolerance 40] [--key] [--flip]
"""
import argparse
from collections import deque

import numpy as np
from PIL import Image


def background_mask(rgb, bg_color, tolerance):
    """Border-connected pixels close to the background colour."""
    h, w = rgb.shape[:2]
    dist = np.sqrt(((rgb - np.array(bg_color)) ** 2).sum(axis=2))
    bgish = dist <= tolerance

    seen = np.zeros((h, w), dtype=bool)
    q = deque()

    def push(y, x):
        if bgish[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w:
                push(ny, nx)
    return seen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("-o", "--out", help="defaults to overwriting the input")
    ap.add_argument("--size", type=int, default=1024, help="output edge length")
    ap.add_argument(
        "--bg-color", default="auto",
        help="R,G,B of the background, or 'auto' (default) to take the median of the four corners",
    )
    ap.add_argument(
        "--tolerance", type=float, default=40,
        help="max RGB Euclidean distance from --bg-color still counted as background",
    )
    ap.add_argument("--key", action="store_true",
                    help="also make the background transparent (not needed for the PixelLab bust)")
    ap.add_argument(
        "--flip", action="store_true",
        help="mirror horizontally so the character faces right (the cast convention). "
             "Gemini's default output for this prompt faces left, so this is usually wanted.",
    )
    args = ap.parse_args()
    src = Image.open(args.image).convert("RGB")
    rgb = np.array(src).astype(int)
    if args.bg_color == "auto":
        k = 8
        corners = np.concatenate([rgb[:k, :k], rgb[:k, -k:], rgb[-k:, :k], rgb[-k:, -k:]]).reshape(-1, 3)
        bg_color = tuple(int(v) for v in np.median(corners, axis=0))
    else:
        bg_color = tuple(int(c) for c in args.bg_color.split(","))
    print(f"background colour: {bg_color}")
    bg = background_mask(rgb, bg_color, args.tolerance)

    ys, xs = np.nonzero(~bg)
    if len(ys) == 0:
        raise SystemExit("the whole image matched the background colour; check --bg-color")
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    print(f"character bbox: x{x0}-{x1} y{y0}-{y1} of {src.size}")
    if (x0, y0, x1 + 1, y1 + 1) == (0, 0, *src.size):
        print("background not found (not plain enough?): not cropped")
    alpha = np.where(bg & args.key, 0, 255).astype(np.uint8)
    rgba = Image.fromarray(np.dstack([np.array(src), alpha]), "RGBA")

    # Square crop the height of the character, centred on it horizontally. The character
    # is normally cut off at the bottom edge already, so height is the binding dimension.
    side = y1 - y0 + 1
    cx = (x0 + x1) // 2
    left = max(0, min(src.size[0] - side, cx - side // 2))
    top = max(0, min(src.size[1] - side, y0))

    out = rgba.crop((left, top, left + side, top + side))
    out = out.resize((args.size, args.size), Image.LANCZOS)
    if args.flip:
        out = out.transpose(Image.FLIP_LEFT_RIGHT)
        print("flipped horizontally: character now faces right")
    out.save(args.out or args.image)
    print(f"wrote {args.out or args.image} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
