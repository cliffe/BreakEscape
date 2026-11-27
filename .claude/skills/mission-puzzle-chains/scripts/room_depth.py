#!/usr/bin/env python3
"""
Room traversal depth for a Break Escape scenario, plus an empty-room and lock report.

Depth = breadth-first distance from the start room, which is also the order the engine
places rooms (public/break_escape/js/core/rooms.js:1545-1640). Use it to build the
boss-key audit: compare the depth at which a lock is first SEEN against the depth at
which its key or code becomes available.

Usage:
    python3 room_depth.py <scenario_dir_or_erb>

e.g. python3 .claude/skills/mission-puzzle-chains/scripts/room_depth.py m03_ghost_in_the_machine

Reads scenario.json.erb as text (it contains Ruby, so it is not parseable as JSON) and
extracts room blocks, connections, locks and contents by structural scan.
"""
import os
import re
import sys
from collections import defaultdict, deque

LOCKABLE = ('"locked": true', '"lockType"')


def find_scenario(arg):
    for cand in (arg,
                 os.path.join(arg, 'scenario.json.erb'),
                 os.path.join('scenarios', arg, 'scenario.json.erb')):
        if os.path.isfile(cand):
            return cand
    sys.exit(f"No scenario.json.erb found for: {arg}")


def brace_block(src, start):
    """Return the {...} block beginning at the first '{' at or after `start`."""
    i = src.index('{', start)
    depth, j = 0, i
    while j < len(src):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
        j += 1
    return src[i:]


def parse_rooms(src):
    """Rooms live under the top-level "rooms" key as "<id>": { ... }."""
    m = re.search(r'"rooms"\s*:\s*\{', src)
    if not m:
        sys.exit("No \"rooms\" block found.")
    rooms_blk = brace_block(src, m.start())
    rooms = {}
    # room ids are keys at one nesting level inside the rooms block
    for rm in re.finditer(r'\n    "([a-zA-Z0-9_]+)"\s*:\s*\{', rooms_blk):
        rooms[rm.group(1)] = brace_block(rooms_blk, rm.start())
    return rooms


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = find_scenario(sys.argv[1])
    src = open(path, encoding='utf-8').read()
    rooms = parse_rooms(src)
    if not rooms:
        sys.exit("Parsed zero rooms — the scenario layout may not match the expected shape.")

    sm = re.search(r'"startRoom"\s*:\s*"([a-zA-Z0-9_]+)"', src)
    start = sm.group(1) if sm else next(iter(rooms))

    adj = defaultdict(set)
    for rid, blk in rooms.items():
        cm = re.search(r'"connections"\s*:\s*\{(.*?)\}', blk, re.S)
        if cm:
            for _, tgt in re.findall(r'"(north|south|east|west)"\s*:\s*"([a-zA-Z0-9_]+)"',
                                     cm.group(1)):
                adj[rid].add(tgt)
                adj[tgt].add(rid)

    depth, q = {start: 0}, deque([start])
    while q:
        n = q.popleft()
        for k in sorted(adj[n]):
            if k not in depth:
                depth[k] = depth[n] + 1
                q.append(k)

    print(f"scenario : {path}")
    print(f"start    : {start}")
    print(f"rooms    : {len(rooms)}\n")

    print("DEPTH  ROOM                            LOCKED  LOCKS  NPCS  OBJS  NOTE")
    print("-" * 78)
    empties, unreachable = [], []
    for rid in sorted(rooms, key=lambda r: (depth.get(r, 999), r)):
        blk = rooms[rid]
        d = depth.get(rid)
        room_locked = bool(re.search(r'"locked"\s*:\s*true', blk[:blk.find('"objects"') if '"objects"' in blk else len(blk)]))
        n_locks = len(re.findall(r'"lockType"\s*:', blk))
        npcs = re.search(r'"npcs"\s*:\s*\[\s*\]', blk)
        objs = re.search(r'"objects"\s*:\s*\[\s*\]', blk)
        n_npc = 0 if npcs else len(re.findall(r'"npcType"\s*:', blk))
        n_obj = 0 if objs else len(re.findall(r'"observations"\s*:', blk))
        note = ''
        if npcs and objs:
            note = 'EMPTY — corridor doing the work of nothing'
            empties.append(rid)
        if d is None:
            note = 'UNREACHABLE from start'
            unreachable.append(rid)
        print(f"{str(d if d is not None else '-'):>5}  {rid:<30}  "
              f"{'yes' if room_locked else '   ':<6}  {n_locks:>5}  {n_npc:>4}  {n_obj:>4}  {note}")

    print()
    if unreachable:
        print(f"!! UNREACHABLE ROOMS: {', '.join(unreachable)}")
    print(f"empty rooms : {len(empties)}/{len(rooms)}"
          + (f"  ({', '.join(empties)})" if empties else ""))
    print(f"lockType declarations : {len(re.findall(r'\"lockType\"\s*:', src))}")
    print("\nNext: for each lock, find the depth at which its key/code first becomes")
    print("available, and mark it boss-key / key-before-lock / same-room.")


if __name__ == '__main__':
    main()
