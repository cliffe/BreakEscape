#!/usr/bin/env python3
"""Port of the engine's room BFS (core/rooms.js calculateRoomPositions +
position*Single/Multiple) and door placement (systems/doors.js) to check that
the two door gaps of every connection coincide. Usage:
  door_align.py <rendered scenario json>
Only single (string) connections are modelled exactly; array connections are
reported as UNMODELLED.
"""
import json, re, sys, os

ROOT = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'
TILE = 32; GUW = 160; GUH = 128; VTOP = 2

# type -> tilemap file, parsed from game.js
gamejs = open(os.path.join(ROOT, 'public/break_escape/js/core/game.js')).read()
TMAP = dict(re.findall(r"tilemapTiledJSON\('([^']+)',\s*'rooms/([^']+)'\)", gamejs))

def dims(rtype):
    d = json.load(open(os.path.join(ROOT, 'public/break_escape/assets/rooms', TMAP[rtype])))
    w, h = d['width'], d['height']
    return dict(w=w*TILE, h=h*TILE, stack=(h-VTOP)*TILE, wt=w, ht=h)

def grid(x, y): return (x // GUW, y // GUH)
def par(x, y):
    gx, gy = grid(x, y); return ((gx + gy) % 2 + 2) % 2
def align(x, y): return ((x // GUW) * GUW, (y // GUH) * GUH)

def pos_single(d, cur, con, cp, D):
    c, n = D[cur], D[con]
    if d == 'south':
        y = cp[1] + c['stack']
        x = cp[0]
        if c['w'] != n['w'] and par(cp[0], cp[1]) == 1:
            x = cp[0] + c['w'] - n['w']
    elif d == 'north':
        y = cp[1] - n['stack']
        x = cp[0]
        if c['w'] != n['w'] and par(cp[0], cp[1]) == 1:
            x = cp[0] + c['w'] - n['w']
    elif d == 'east':
        x, y = cp[0] + c['w'], cp[1]
    else:
        x, y = cp[0] - n['w'], cp[1]
    return align(x, y)

def door(rid, d, P, D):
    p, m = P[rid], D[rid]
    if d == 'north':
        right = par(p[0], p[1]) == 1
        return (p[0] + m['w'] - 48 if right else p[0] + 48, p[1] + TILE)
    if d == 'south':
        right = par(p[0], p[1] + m['stack']) == 1
        return (p[0] + m['w'] - 48 if right else p[0] + 48, p[1] + m['h'] - TILE)
    if d == 'east':
        return (p[0] + m['w'] - 16, p[1] + 80)
    return (p[0] + 16, p[1] + 80)

OPP = dict(north='south', south='north', east='west', west='east')

def run(path):
    sc = json.load(open(path))
    rooms = sc['rooms']
    D = {r: dims(v['type']) for r, v in rooms.items()}
    P = {sc['startRoom']: (0, 0)}; q = [sc['startRoom']]; unmod = []
    while q:
        cur = q.pop(0)
        for d in ('north', 'south', 'east', 'west'):
            con = rooms[cur].get('connections', {}).get(d)
            if not con: continue
            lst = con if isinstance(con, list) else [con]
            un = [r for r in lst if r not in P]
            if not un: continue
            if len(un) > 1:
                unmod.append(f'{cur}.{d}={un}'); continue
            P[un[0]] = pos_single(d, cur, un[0], P[cur], D); q.append(un[0])
    bad = 0
    for a, v in rooms.items():
        for d, con in v.get('connections', {}).items():
            if isinstance(con, list): continue
            b = con
            if a not in P or b not in P: continue
            back = rooms[b].get('connections', {}).get(OPP[d])
            if back != a:
                print(f'  ?? {a} {d}->{b}: reverse is {back!r}'); continue
            if a > b: continue  # each pair once
            da, db = door(a, d, P, D), door(b, OPP[d], P, D)
            axis = 0 if d in ('north', 'south') else 1
            ok = da[axis] == db[axis]
            if not ok: bad += 1
            print(f"  {'OK ' if ok else 'BAD'} {a}({D[a]['wt']}x{D[a]['ht']}) {d}->{b}({D[b]['wt']}x{D[b]['ht']}): "
                  f"door {da} vs {db}")
    for u in unmod: print('  UNMODELLED multi:', u)
    return bad

if __name__ == '__main__':
    tot = 0
    for p in sys.argv[1:]:
        print(p); tot += run(p)
    sys.exit(1 if tot else 0)
