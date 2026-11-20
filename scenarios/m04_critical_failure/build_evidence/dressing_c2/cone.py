"""Cipher's cone coverage over Hall 1's walkable floor (geometry only: the engine's LOS
has no occlusion). Floor visible in game: cols 0-9 y 64-256 (workshop below), cols 10-19
y 64-304. Obstacles: bottom 16 px of each floor object's sprite (approximate body) plus the
builder's collision rectangles (Object Layer 1)."""
import json, math, sys
d = json.load(open(sys.argv[1]))
gid = {}
for ts in d['tilesets']:
    for t in ts.get('tiles', []):
        img = t.get('image', '')
        gid[ts['firstgid'] + t['id']] = img.split('/')[-1][:-4]
obst = []
for l in d['layers']:
    if l['type'] != 'objectgroup':
        continue
    if l['name'] == 'Object Layer 1':  # builder collision rectangles (y = top edge)
        for o in l['objects']:
            obst.append((o['x'], o['y'], o['x'] + o['width'], o['y'] + o['height']))
        continue
    for o in l['objects']:
        x, y, w = o['x'], o['y'], o['width']
        if y < 70 or x + w <= 32 or x >= 608:
            continue  # wall items
        obst.append((x, y - 16, x + w, y))
def walkable(px, py):
    if not (32 <= px < 608 and 64 <= py):
        return False
    if py >= (256 if px < 320 else 304):
        return False
    return not any(a <= px < c and b <= py < e for a, b, c, e in obst)
cells = [(x + 4, y + 4) for x in range(32, 608, 8) for y in range(64, 304, 8) if walkable(x + 4, y + 4)]
poses = {"(12,7) dwell, facing S": (384, 224, 90), "(12,3) walking N": (384, 96, -90),
         "(13,3) look E": (416, 96, 0), "(10,3) look W": (320, 96, 180)}
print(f"walkable cells: {len(cells)} (8 px)")
for name, (cx, cy, f) in poses.items():
    seen = [c for c in cells if math.dist(c, (cx, cy)) <= 150 and
            abs((math.degrees(math.atan2(c[1] - cy, c[0] - cx)) - f + 180) % 360 - 180) <= 60]
    door = [c for c in seen if c[1] < 128]
    print(f"  {name}: {len(seen)} cells, {100 * len(seen) / len(cells):.1f}% of walkable floor; door-row cells seen {len(door)}")
