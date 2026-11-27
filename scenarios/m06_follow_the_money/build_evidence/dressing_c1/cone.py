"""Sight-cone coverage for m06's two hall watchers, over walkable floor (geometry only:
the engine's LOS has no occlusion, npc-los.js). Obstacles: the builder's collision
rectangles (Object Layer 1) plus the bottom 10 px of each floor object (y >= 70).
Usage: cone.py MAP.json guard|kemal"""
import json, math, sys
d = json.load(open(sys.argv[1]))
who = sys.argv[2]
obst = []
for l in d['layers']:
    if l['type'] != 'objectgroup':
        continue
    for o in l['objects']:
        if l['name'] == 'Object Layer 1':
            obst.append((o['x'], o['y'], o['x'] + o['width'], o['y'] + o['height']))
        elif o['y'] >= 70 and l['name'] in ('tables', 'items'):
            obst.append((o['x'], o['y'] - 10, o['x'] + o['width'], o['y']))
floor_bottom = 128 if who == 'guard' else 160
def walkable(px, py):
    if not (32 <= px < 288 and 64 <= py < floor_bottom):
        return False
    return not any(a <= px < c and b <= py < e for a, b, c, e in obst)
cells = [(x + 4, y + 4) for x in range(32, 288, 8) for y in range(64, floor_bottom, 8) if walkable(x + 4, y + 4)]
if who == 'guard':
    rng, poses = 210, {"(4,4) facing E": (128, 128, 0), "(4,4) facing S (first 4 s)": (128, 128, 90),
                       "(3,4) facing E": (96, 128, 0), "(3,4) facing W": (96, 128, 180)}
    window = [c for c in cells if 209 <= c[0] <= 279 and c[1] <= 96]
else:
    rng, poses = 150, {"(8,4) dwell facing E": (256, 128, 0), "walking E from (4,4)": (192, 128, 0),
                       "(4,4) dwell facing W": (128, 128, 180)}
    window = [c for c in cells if 248 <= c[0] <= 296 and c[1] <= 96]   # under the N door
print(f"{sys.argv[1].split('/')[-1]}: walkable cells {len(cells)} (8 px); window cells {len(window)}")
for name, (cx, cy, f) in poses.items():
    seen = [c for c in cells if math.dist(c, (cx, cy)) <= rng and
            abs((math.degrees(math.atan2(c[1] - cy, c[0] - cx)) - f + 180) % 360 - 180) <= 60]
    win = [c for c in seen if c in window]
    print(f"  {name}: {len(seen)} cells ({100 * len(seen) / max(1, len(cells)):.1f}%); window cells seen {len(win)}/{len(window)}")
