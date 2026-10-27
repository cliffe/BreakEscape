#!/usr/bin/env python3
"""Darken near-yellow edge pixels that touch transparency (no resampling).
usage: defringe_yellow.py file.png [...]   (rewrites in place; prints count)"""
import sys, colorsys
from PIL import Image

def near_yellow(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return 38 <= h * 360 <= 65 and s > 0.35 and v > 0.45

def defringe(im, reach=5):
    px = im.load(); w, h = im.size
    def transp(x, y):
        return not (0 <= x < w and 0 <= y < h) or px[x, y][3] < 128
    todo = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128 or not near_yellow(r, g, b):
                continue
            if any(transp(x + dx, y + dy) for dx in range(-reach, reach + 1)
                   for dy in range(-reach, reach + 1)):
                todo.append((x, y))
    for x, y in todo:
        ns = [px[x + dx, y + dy] for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)
              if 0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] >= 128
              and not near_yellow(*px[x + dx, y + dy][:3])]
        if ns:
            r = sum(n[0] for n in ns) // len(ns); g = sum(n[1] for n in ns) // len(ns); b = sum(n[2] for n in ns) // len(ns)
        else:
            r, g, b = px[x, y][:3]
        px[x, y] = (int(r * .55), int(g * .55), int(b * .55), px[x, y][3])
    return len(todo)

if __name__ == "__main__":
    for f in sys.argv[1:]:
        im = Image.open(f).convert("RGBA")
        n = defringe(im)
        im.save(f)
        print(f, n)
