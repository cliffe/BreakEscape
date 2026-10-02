"""Predict which CORNER of a room each door lands on, without running the game.

    ruby scripts/validate_scenario.rb <scenario>     # tells you rooms do not OVERLAP
    python3 scripts/predict_door_sides.py <scenario> # tells you WHERE the doors are

The validator proves the layout is geometrically legal. It says nothing about which
side of a wall a door ends up on -- and that is what decides whether the player walks
into a ward at the top-left or the bottom-right. Use this when a room's art only
works from a particular approach.

Placement mirrors validate_scenario.rb geom_* (which itself mirrors core/rooms.js).
Door sides mirror systems/doors.js placeNorth/South/East/WestDoorSingle|Multiple.

THE RULES IT ENCODES
  N/S single door : corner chosen by parity of (gridX + gridY). For a north door
                    that is the room origin; for a south door it is the SHARED
                    BOTTOM WALL. A room an even number of GU tall therefore gets
                    its north and south doors on the SAME side -- you cannot have
                    top-left and bottom-right on one room by parity alone.
  N/S single door, where the NEIGHBOUR has an ARRAY on the opposite side:
                    parity is ignored and the door aligns to this room's index in
                    that array. This is the only reliable way to FORCE a side.
  E/W single door : ALWAYS 2.5 tiles down from the room top. There is no parity.
  E/W multiple    : first at the top, last at the bottom, rest spread evenly.
  N/S multiple    : first at the left, last at the right, rest spread evenly.

CAVEAT worth knowing before you design around a multi-room side: rooms.js filters
already-positioned rooms out of a connection array, so a side with several rooms is
only POSITIONED correctly when all of them are leaves reached solely through that
room. The route back into the rest of the map can never be the second element.
"""
import json, subprocess, sys, collections, os

TILE = 32
GU_W = 160          # 5 tiles
GU_H = 128          # 4 tiles
VISUAL_TOP = 2      # top wall rows excluded from stacking height

REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'

def load(scn):
    out = subprocess.run(['ruby', f'{REPO}/scripts/validate_scenario.rb', scn, '--output-json'],
                         capture_output=True, text=True, cwd=REPO).stdout
    js = out[out.index('{'):]
    d = 0
    for i, c in enumerate(js):
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0:
                js = js[:i+1]; break
    return json.loads(js)

TYPE_TILES = {}
def tiles_for(rtype):
    """Room tilemaps ship as .tmj or .json depending on vintage; some types have
    neither, in which case the scenario must declare explicit dimensions."""
    if rtype not in TYPE_TILES:
        dims = None
        for ext in ('tmj', 'json'):
            p = f'{REPO}/public/break_escape/assets/rooms/{rtype}.{ext}'
            if os.path.exists(p):
                try:
                    tj = json.load(open(p))
                    if tj.get('width') and tj.get('height'):
                        dims = (tj['width'], tj['height']); break
                except Exception:
                    pass
        TYPE_TILES[rtype] = dims
    return TYPE_TILES[rtype]

def dims_for(room, rid=''):
    # The engine sizes rooms from the TILEMAP by type (core/rooms.js reads
    # cache.tilemap.get(room.type)); the scenario `dimensions` field is IGNORED
    # for layout. Only fall back to `dimensions` when a type has no tilemap.
    t = tiles_for(room['type'])
    if t is not None:
        wt, ht = t
    elif 'dimensions' in room:
        wt, ht = room['dimensions']['width'], room['dimensions']['height']
    else:
        raise SystemExit(
            f"room '{rid}' uses type '{room['type']}', which has no tilemap in "
            f"public/break_escape/assets/rooms/ and no explicit \"dimensions\" in the "
            f"scenario. Add a tilemap or dimensions to predict its doors.")
    return {'w': wt*TILE, 'stack': (ht-VISUAL_TOP)*TILE, 'wt': wt, 'ht': ht}

def align(x, y):
    return ((x // GU_W) * GU_W if x >= 0 else -((-x + GU_W - 1)//GU_W)*GU_W if x % GU_W else x,
            (y // GU_H) * GU_H if y >= 0 else -((-y + GU_H - 1)//GU_H)*GU_H if y % GU_H else y)

def floordiv(a, b):
    import math
    return math.floor(a/b)

def align2(x, y):
    return (floordiv(x, GU_W)*GU_W, floordiv(y, GU_H)*GU_H)

def grid_sum(x, y):
    return floordiv(x, GU_W) + floordiv(y, GU_H)

def edge_x(cd, kd, cpos):
    if cd['w'] == kd['w']:
        return cpos[0]
    s = grid_sum(cpos[0], cpos[1])
    return cpos[0] + cd['w'] - kd['w'] if ((s % 2)+2) % 2 == 1 else cpos[0]

def place_single(direction, cd, kd, cpos):
    if direction == 'north': return align2(edge_x(cd, kd, cpos), cpos[1] - kd['stack'])
    if direction == 'south': return align2(edge_x(cd, kd, cpos), cpos[1] + cd['stack'])
    if direction == 'east':  return align2(cpos[0] + cd['w'], cpos[1])
    if direction == 'west':  return align2(cpos[0] - kd['w'], cpos[1])

def place_multi(direction, cd, kds, cpos):
    out = {}
    if direction in ('north', 'south'):
        total = sum(k['w'] for k in kds.values())
        ax = align2(cpos[0] + (cd['w']-total)//2, 0)[0]
        first = list(kds.values())[0]
        fo = min(ax+first['w'], cpos[0]+cd['w']) - max(ax, cpos[0])
        if fo < GU_W: ax = align2(cpos[0]-first['w']+GU_W, 0)[0]
        last = list(kds.values())[-1]
        ls = ax+total-last['w']
        lo = min(ax+total, cpos[0]+cd['w']) - max(ls, cpos[0])
        if lo < GU_W: ax = align2(cpos[0]+cd['w']-total-last['w']+GU_W, 0)[0]
        cx = ax
        ay = align2(0, cpos[1]+cd['stack'])[1] if direction == 'south' else None
        for rid, kd in kds.items():
            ry = align2(0, cpos[1]-kd['stack'])[1] if direction == 'north' else ay
            out[rid] = (cx, ry); cx += kd['w']
    else:
        total = sum(k['stack'] for k in kds.values())
        ay = align2(0, cpos[1] + (cd['stack']-total)//2)[1]
        first = list(kds.values())[0]
        fo = min(ay+first['stack'], cpos[1]+cd['stack']) - max(ay, cpos[1])
        if fo < GU_H: ay = align2(0, cpos[1]-first['stack']+GU_H)[1]
        last = list(kds.values())[-1]
        ls = ay+total-last['stack']
        lo = min(ay+total, cpos[1]+cd['stack']) - max(ls, cpos[1])
        if lo < GU_H: ay = align2(0, cpos[1]+cd['stack']-total-last['stack']+GU_H)[1]
        cy = ay
        for rid, kd in kds.items():
            x = align2(cpos[0]+cd['w'], 0)[0] if direction == 'east' else align2(cpos[0]-kd['w'], 0)[0]
            out[rid] = (x, cy); cy += kd['stack']
    return out

def compute(scn):
    sc = load(scn)
    rooms = sc['rooms']
    D = {rid: dims_for(r, rid) for rid, r in rooms.items()}
    pos = {sc['startRoom']: (0, 0)}
    processed = {sc['startRoom']}
    q = collections.deque([sc['startRoom']])
    while q:
        cur = q.popleft()
        conns = rooms[cur].get('connections') or {}
        for d in ('north', 'south', 'east', 'west'):
            c = conns.get(d)
            if not c: continue
            lst = c if isinstance(c, list) else [c]
            un = [r for r in lst if r not in processed]
            if not un: continue
            if len(un) == 1:
                pos[un[0]] = place_single(d, D[cur], D[un[0]], pos[cur])
                processed.add(un[0]); q.append(un[0])
            else:
                for rid, p in place_multi(d, D[cur], {r: D[r] for r in un}, pos[cur]).items():
                    pos[rid] = p; processed.add(rid); q.append(rid)
    return sc, rooms, D, pos

def door_report(scn):
    sc, rooms, D, pos = compute(scn)
    print(f"{'room':26}{'grid':>10}  doors")
    print('-'*86)
    for rid, r in rooms.items():
        p = pos.get(rid)
        if p is None:
            print(f'{rid:26}{"UNPLACED":>10}'); continue
        g = (floordiv(p[0], GU_W), floordiv(p[1], GU_H))
        conns = r.get('connections') or {}
        notes = []
        for d in ('north', 'south', 'east', 'west'):
            c = conns.get(d)
            if not c: continue
            lst = c if isinstance(c, list) else [c]
            if d in ('north', 'south'):
                # does the neighbour have a multi array on the opposite side? -> aligned
                opp = 'south' if d == 'north' else 'north'
                other = rooms[lst[0]].get('connections', {}).get(opp) if len(lst) == 1 else None
                if len(lst) == 1 and isinstance(other, list) and len(other) > 1 and rid in other:
                    idx = other.index(rid)
                    side = 'ALIGNED#%d(%s)' % (idx, 'left' if idx == 0 else 'right' if idx == len(other)-1 else 'mid')
                elif len(lst) == 1:
                    if d == 'north':
                        s = grid_sum(p[0], p[1])
                    else:
                        s = grid_sum(p[0], p[1] + D[rid]['stack'])
                    side = 'RIGHT' if ((s % 2)+2) % 2 == 1 else 'LEFT'
                else:
                    side = 'spread ' + ','.join(f'{n}@{"left" if i==0 else "right" if i==len(lst)-1 else "mid"}' for i, n in enumerate(lst))
                notes.append(f'{d}={side}')
            else:
                if len(lst) == 1:
                    notes.append(f'{d}=TOP(y2.5)')
                else:
                    notes.append(f'{d}=' + ','.join(f'{n}@{"top" if i==0 else "bottom" if i==len(lst)-1 else "mid"}' for i, n in enumerate(lst)))
        print(f'{rid:26}{str(g):>10}  ' + '   '.join(notes))

if __name__ == '__main__':
    door_report(sys.argv[1])
