#!/usr/bin/env python3
"""Check that the two door gaps of every room connection coincide.

Ports the engine's room BFS (core/rooms.js calculateRoomPositions +
position*Single) and door placement (systems/doors.js).

Usage:
  python3 scripts/check_door_alignment.py scenarios/<m>/scenario.json.erb [...]
  python3 scripts/check_door_alignment.py [--json] <scenario.json | scenario.json.erb>

A .json.erb file is rendered here (same stubs as scripts/validate_scenario.rb,
no VM context). Exit status is 1 if any door pair is misaligned, else 0.
Only single (string) connections are modelled exactly; array connections
(one direction leading to several rooms) are reported as UNMODELLED and do
not affect the exit status. --json prints one machine-readable object per
file (used by validate_scenario.rb).
"""
import json, re, sys, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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

RENDER_RB = r"""
require 'erb'; require 'json'; require 'base64'
def base64_encode(t); Base64.strict_encode64(t); end
def vm_context; {}; end
def vm_object(n, o = {}); o.merge('system_name' => n).to_json; end
def flags_for_vm(vm, flags = []); flags.to_json; end
def vm_flags_json(vm, flags = []); flags.to_json; end
puts JSON.generate(JSON.parse(ERB.new(File.read(ARGV[0]), trim_mode: '-').result(binding)))
"""

def load_scenario(path):
    if not path.endswith('.erb'):
        return json.load(open(path))
    r = subprocess.run(['ruby', '-e', RENDER_RB, path], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError('ERB render failed: ' + r.stderr.strip()[:500])
    return json.loads(r.stdout)

def run(path, as_json=False):
    sc = load_scenario(path)
    result = dict(file=path, bad=[], ok=[], unmodelled=[])
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
                if not as_json: print(f'  ?? {a} {d}->{b}: reverse is {back!r}')
                continue
            if a > b: continue  # each pair once
            da, db = door(a, d, P, D), door(b, OPP[d], P, D)
            axis = 0 if d in ('north', 'south') else 1
            ok = da[axis] == db[axis]
            if not ok: bad += 1
            line = (f"{a}({D[a]['wt']}x{D[a]['ht']}) {d}->{b}({D[b]['wt']}x{D[b]['ht']}): "
                    f"door {da} vs {db}")
            result['ok' if ok else 'bad'].append(dict(a=a, b=b, dir=d, detail=line))
            if not as_json:
                print(f"  {'OK ' if ok else 'BAD'} {line}")
    result['unmodelled'] = unmod
    if not as_json:
        for u in unmod: print('  UNMODELLED multi:', u)
    return result

if __name__ == '__main__':
    args = sys.argv[1:]
    as_json = '--json' in args
    paths = [a for a in args if a != '--json']
    if not paths:
        print(__doc__); sys.exit(2)
    tot = 0
    for p in paths:
        if not as_json: print(p)
        try:
            res = run(p, as_json)
        except Exception as e:
            print(json.dumps(dict(file=p, error=str(e))) if as_json else f'  ERROR: {e}')
            tot += 1; continue
        tot += len(res['bad'])
        if as_json: print(json.dumps(res))
    sys.exit(1 if tot else 0)
