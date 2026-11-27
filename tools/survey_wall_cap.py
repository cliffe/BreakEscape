#!/usr/bin/env python3
"""Survey the south-wall cap band on the bottom tile row of every room map.

For each public/break_escape/assets/rooms/*.json and each tile layer, take row h-1, look up the
tileset frame of each tile and measure the cap band from the bottom of the tile: the run of pixel
rows (from the bottom) that are entirely wall-cap colours (dark grey line, white, dark grey line, judged on each row's dominant colour).
The two grey lines are capped at 2 px each (on some tiles the wall face is also dark grey).
Prints the distribution of band heights over (tileset image, frame) pairs and over maps.
Used by behind-wall-fade.js (WALL_CAP_PX); see planning_notes/behind_wall_fade/DESIGN.md section 5.
"""
import collections, glob, json, os, sys
from PIL import Image

ROOMS = os.path.join(os.path.dirname(__file__), '..', 'public', 'break_escape', 'assets', 'rooms')
FLAGS = 0xF0000000

def dominant(img, x0, y, tw):
    c = collections.Counter(img.getpixel((x0 + x, y)) for x in range(tw))
    return c.most_common(1)[0][0]

def kind(px):
    r, g, b, a = px
    if a < 250: return 'x'
    if min(r, g, b) >= 235 and max(r, g, b) - min(r, g, b) <= 8: return 'w'          # white
    if max(r, g, b) <= 120 and max(r, g, b) - min(r, g, b) <= 40: return 'd'         # dark grey line
    return 'x'

def band(img, col, row, tw, th):
    """Rows from the bottom: dark run, white run, dark run (the cap); stops at the wall face."""
    x0, y0 = col * tw, row * th
    kinds = [kind(dominant(img, x0, y0 + y, tw)) for y in range(th - 1, -1, -1)]
    n, i = 0, 0
    for want in 'dwd':
        j = i
        while j < len(kinds) and kinds[j] == want and (want == 'w' or j - i < 2): j += 1   # grey lines are 2 px
        if j == i: return 0 if want != 'd' or i == 0 else n   # no white at all: not a cap
        n += j - i; i = j
    return n

images = {}
frame_h = {}          # (image, frame) -> band
per_map = collections.defaultdict(set)
for f in sorted(glob.glob(os.path.join(ROOMS, '*.json'))):
    d = json.load(open(f))
    W, H = d['width'], d['height']
    sets = sorted([t for t in d['tilesets'] if 'image' in t and t.get('columns')], key=lambda t: t['firstgid'])
    for l in d['layers']:
        if l.get('type') != 'tilelayer': continue
        for c in range(W):
            g = l['data'][(H - 1) * W + c] & ~FLAGS
            if not g: continue
            ts = [t for t in sets if t['firstgid'] <= g]
            if not ts: continue
            t = ts[-1]; i = g - t['firstgid']
            if i >= t['tilecount']: continue
            path = os.path.normpath(os.path.join(ROOMS, t['image']))
            if path not in images: images[path] = Image.open(path).convert('RGBA')
            key = (os.path.basename(path), i)
            if key not in frame_h:
                cols = t['columns']
                frame_h[key] = band(images[path], i % cols, i // cols, t['tilewidth'], t['tileheight'])
            per_map[os.path.basename(f)].add(frame_h[key])

dist = collections.Counter(frame_h.values())
print('maps surveyed:', len(per_map))
print('distinct (tileset, frame) pairs:', len(frame_h), ' tilesets:', len({k[0] for k in frame_h}))
print('band height -> frame count:', dict(sorted(dist.items())))
odd = {k: v for k, v in frame_h.items() if v != 12}
print('frames with band != 12:', len(odd))
for k, v in sorted(odd.items())[:40]: print('  ', k, v)
multi = {m: sorted(v) for m, v in per_map.items() if v != {12}}
print('maps whose bottom-row tiles are not all 12:', len(multi))
for m, v in sorted(multi.items())[:40]: print('  ', m, v)
