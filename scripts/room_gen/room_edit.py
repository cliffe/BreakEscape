#!/usr/bin/env python3
"""
Edit a hand-maintained room map (.json and .tmj together) without reformatting it.

Tiled writes its own JSON layout; re-dumping with json.dump would rewrite every
line and bury the real change in the diff. This splices the text instead, so the
untouched parts of both files stay byte-identical. Files that were written by
json.dump(indent=1) are edited as data and re-dumped the same way.

Use it for rooms that have no builder in scripts/generate_rooms.py (or whose
builder must not be re-run). Rooms with a builder: edit the builder and run
`python3 scripts/generate_rooms.py <room>` instead.

CLI (one operation per call; object ids come from `list`):
  room_edit.py ROOM list [SUBSTR]            # objects: layer, id, sprite, x, y, size
  room_edit.py ROOM move ID X Y              # x = left edge, y = feet (bottom)
  room_edit.py ROOM sprite ID NAME           # swap the image (keeps id, x, y, layer)
  room_edit.py ROOM add LAYER NAME X Y       # append; prints the new id
  room_edit.py ROOM delete ID [ID ...]
  room_edit.py ROOM relayer ID LAYER         # move to another layer, appended last
  room_edit.py ROOM floor NAME               # point the room6-layout floor tileset at
                                             # tiles/rooms/NAME.png (e.g. room_hospital_carpet)

Several edits at once, from Python:
  import sys; sys.path.insert(0, 'scripts/room_gen'); from room_edit import Room
  r = Room('room_hospital_ward'); r.move(215, x=118); r.add('items', 'rota_board1', 478, 58); r.save()

Sprites not yet in the room's tilesets are pulled in from tilesets_ref.json; an
embedded tileset copy that predates newly registered tiles is refreshed in place.
Both Tiled's multi-line object blocks and the one-object-per-line entries some
hand-edited maps carry (room_hospital_office, _reception) can be moved, deleted
and appended to.
"""
import copy
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROOMS = ROOT / "public/break_escape/assets/rooms"
REF = ROOT / "scripts/room_gen"
OBJ_KEYS = ["gid", "height", "id", "name", "rotation", "type", "visible", "width", "x", "y"]


# ---------------------------------------------------------------- Tiled JSON text

def _s(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False).replace("/", "\\/")
    if isinstance(v, float):
        return repr(v)
    return str(v)


def _num(v):
    return _s(int(v) if float(v).is_integer() else float(v))


def _tiled_obj(d, b):
    """Serialise a dict the way Tiled 1.11 lays out an element of an array at indent b."""
    pad = " " * (b + 1)
    lines = []
    for key, val in d.items():
        if isinstance(val, dict):
            v = "\n" + _tiled_obj(val, b + 4)
        elif isinstance(val, list) and val and isinstance(val[0], dict):
            v = "[\n" + ", \n".join(_tiled_obj(e, b + 8) for e in val) + "]"
        elif isinstance(val, list):
            v = "[" + ", ".join(_s(e) for e in val) + "]"
        else:
            v = _s(val)
        lines.append(f'"{key}":{v}')
    return " " * b + "{\n" + pad + (",\n" + pad).join(lines) + "\n" + " " * b + "}"


# ---------------------------------------------------------------- catalogue lookups

CAT = json.loads((REF / "catalog.json").read_text())
REF_TILESETS = json.loads((REF / "tilesets_ref.json").read_text())


def size(name):
    for k in ("objects", "tables"):
        if name in CAT.get(k, {}):
            return CAT[k][name]["w"], CAT[k][name]["h"]
    raise KeyError(f"{name} is not in scripts/room_gen/catalog.json (register it first)")


def ref_tileset_for(name):
    for ts in REF_TILESETS:
        for t in ts.get("tiles", []):
            if Path(t.get("image", "")).stem == name:
                return ts
    raise KeyError(f"{name} is in no tileset in tilesets_ref.json")


def _tsx_tiles(source):
    """Image tiles of an external tileset. Some .tmj files carry stale relative
    paths, so fall back to the file of that name in the rooms folder."""
    for path in (ROOMS / source, ROOMS / Path(source).name):
        if path.exists():
            root = ET.parse(path).getroot()
            return [{"id": int(t.get("id")), "image": t.find("image").get("source")}
                    for t in root.iter("tile") if t.find("image") is not None]
    return []


def gid_map(m):
    """sprite stem -> gid, for every image tile in the map's tilesets (external .tsx included)."""
    out = {}
    for ts in m["tilesets"]:
        tiles = ts.get("tiles")
        if tiles is None and ts.get("source", "").endswith(".tsx"):
            tiles = _tsx_tiles(ts["source"])
        for t in tiles or []:
            if "image" in t:
                out.setdefault(Path(t["image"]).stem, ts["firstgid"] + t["id"])
    return out


# ---------------------------------------------------------------- documents

class Doc:
    """A Tiled-written file, edited as text."""

    def __init__(self, path):
        self.path = path
        self.text = path.read_text()

    @property
    def m(self):
        return json.loads(self.text)

    def block_span(self, oid):
        pat = re.compile(r'(?m)^( *)\{\n *"gid":\d+,\n *"height":[\d.]+,\n *"id":%d,\n(?:.*\n)*?\1\}' % oid)
        hits = list(pat.finditer(self.text))
        if not hits:  # some hand-edited maps carry one-object-per-line entries
            pat = re.compile(r'(?m)^( *)\{"gid":\d+,"height":[\d.]+,"id":%d,[^\n]*\}' % oid)
            hits = list(pat.finditer(self.text))
        assert len(hits) == 1, (self.path.name, oid, len(hits))
        return hits[0]

    def set_fields(self, oid, **kv):
        mt = self.block_span(oid)
        blk = mt.group(0)
        for k, v in kv.items():
            blk, n = re.subn(r'"%s":[^,\n}]*' % k, f'"{k}":' + (_num(v) if k in ("x", "y") else _s(v)), blk, count=1)
            assert n == 1, (oid, k)
        self.text = self.text[:mt.start()] + blk + self.text[mt.end():]

    def delete(self, oid):
        mt = self.block_span(oid)
        s, e = mt.start(), mt.end()
        after = re.match(r",[ ]?\n(?: *\n)?", self.text[e:])
        before = re.search(r",[ ]?\n(?: *\n)?$", self.text[:s])
        if after:        # not last: drop the block and the separator after it
            self.text = self.text[:s] + self.text[e + after.end():]
        elif before:     # last: drop the separator before it and the block
            self.text = self.text[:before.start()] + self.text[e:]
        else:            # only element: leave an empty array
            pre = re.search(r"\[\n$", self.text[:s])
            self.text = self.text[:pre.start()] + "[]" + self.text[e + 1:]

    def append_obj(self, layer, obj):
        lm = re.search(r'"name":"%s",\n' % re.escape(layer), self.text)
        assert lm, f"no layer {layer!r} in {self.path.name}"
        om = re.compile(r'"objects":(\[\]|\[\n)').search(self.text, lm.end())  # keys are alphabetical
        assert om, layer
        if om.group(1) == "[]":
            line_start = self.text.rfind("\n", 0, om.start()) + 1
            b = (om.start() - line_start) + 7
            self.text = self.text[:om.start()] + '"objects":[\n' + _tiled_obj(obj, b) + "]" + self.text[om.end():]
            return
        # find the array's closing bracket by parsing it (entries may be multi-line
        # Tiled blocks or one-object-per-line), then append before it
        arr_start = om.start() + len('"objects":')
        _, end = json.JSONDecoder().raw_decode(self.text, arr_start)
        first = re.match(r" *", self.text[om.end():]).group(0)
        if self.text.startswith("{\n", om.end() + len(first)):
            b = len(first)  # indent of the existing Tiled blocks
        else:
            line_start = self.text.rfind("\n", 0, om.start()) + 1
            b = (om.start() - line_start) + 7
        pos = end - 1
        self.text = self.text[:pos] + ", \n" + _tiled_obj(obj, b) + self.text[pos:]

    def _tileset_block(self, firstgid):
        pat = re.compile(r'(?m)^( *)\{\n(?: *"columns":\d+,\n)? *"firstgid":%d,\n(?:.*\n)*?\1\}' % firstgid)
        return pat.search(self.text)

    def put_tileset(self, ts):
        """Append ts, or replace the existing entry with the same firstgid."""
        mt = self._tileset_block(ts["firstgid"])
        if mt:
            b = len(mt.group(1))
            self.text = self.text[:mt.start()] + _tiled_obj(ts, b) + self.text[mt.end():]
            return
        tm = self.text.rfind('"tilesets":[\n')
        b = len(re.match(r" *", self.text[tm + len('"tilesets":[\n'):]).group(0))
        close = re.compile(r"(?m)^%s\}\]" % (" " * b)).search(self.text, tm)
        pos = close.start() + b + 1
        self.text = self.text[:pos] + ", \n" + _tiled_obj(ts, b) + self.text[pos:]

    def set_next_id(self, n):
        self.text = re.sub(r'"nextobjectid": ?\d+',
                           lambda mm: mm.group(0).split(":")[0] + ":" + (" " if ": " in mm.group(0) else "") + str(n),
                           self.text, count=1)

    def save(self):
        json.loads(self.text)
        self.path.write_text(self.text)


class PyDoc:
    """A file written by json.dump(indent=1): edit the parsed map and re-dump it."""

    def __init__(self, path):
        self.path = path
        self.data = json.loads(path.read_text())

    @property
    def m(self):
        return self.data

    def _find(self, oid):
        for layer in self.data["layers"]:
            for o in layer.get("objects", []):
                if o["id"] == oid:
                    return layer, o
        raise KeyError(oid)

    def set_fields(self, oid, **kv):
        self._find(oid)[1].update(kv)

    def delete(self, oid):
        layer, o = self._find(oid)
        layer["objects"].remove(o)

    def append_obj(self, layer, obj):
        next(lay for lay in self.data["layers"] if lay["name"] == layer)["objects"].append(obj)

    def put_tileset(self, ts):
        tss = self.data["tilesets"]
        for i, t in enumerate(tss):
            if t["firstgid"] == ts["firstgid"]:
                tss[i] = ts
                return
        tss.append(ts)

    def set_next_id(self, n):
        self.data["nextobjectid"] = n

    def save(self):
        self.path.write_text(json.dumps(self.data, indent=1))


def make_doc(path):
    return PyDoc(path) if path.read_text().startswith('{\n "') else Doc(path)


class Room:
    def __init__(self, stem):
        self.stem = stem
        self.docs = [make_doc(ROOMS / f"{stem}.json")]
        tmj = ROOMS / f"{stem}.tmj"
        if tmj.exists():
            self.docs.append(make_doc(tmj))

    def objects(self):
        m = self.docs[0].m
        g = {v: k for k, v in gid_map(m).items()}
        for layer in m["layers"]:
            for o in layer.get("objects") or []:
                yield layer["name"], o, g.get(o.get("gid"), "?")

    def ensure_sprite(self, name):
        """Make sure every doc's tilesets include `name` (adds or refreshes its tileset)."""
        for d in self.docs:
            if name in gid_map(d.m):
                continue
            ts = ref_tileset_for(name)
            existing = next((t for t in d.m["tilesets"] if t["firstgid"] == ts["firstgid"]), None)
            if existing and "source" in existing:
                raise SystemExit(f"{d.path.name}: {name} is missing from external {existing['source']}; register it there")
            if not existing:
                last = max(d.m["tilesets"], key=lambda t: t["firstgid"])
                assert last["firstgid"] + (last.get("tilecount") or 100) <= ts["firstgid"], "firstgid clash"
            d.put_tileset(copy.deepcopy(ts))

    def move(self, oid, x=None, y=None):
        kv = {k: v for k, v in (("x", x), ("y", y)) if v is not None}
        for d in self.docs:
            d.set_fields(oid, **kv)

    def delete(self, oid):
        for d in self.docs:
            d.delete(oid)

    def relayer(self, oid, layer):
        for d in self.docs:
            o = next(o for lay in d.m["layers"] for o in lay.get("objects", []) if o["id"] == oid)
            d.delete(oid)
            d.append_obj(layer, o)

    def sprite(self, oid, name):
        self.ensure_sprite(name)
        w, h = size(name)
        for d in self.docs:
            d.set_fields(oid, gid=gid_map(d.m)[name], width=w, height=h)

    def add(self, layer, name, x, y):
        self.ensure_sprite(name)
        oid = max(d.m["nextobjectid"] for d in self.docs)
        w, h = size(name)
        for d in self.docs:
            d.append_obj(layer, dict(zip(OBJ_KEYS, [gid_map(d.m)[name], h, oid, "", 0, "", True, w, x, y])))
            d.set_next_id(oid + 1)
        return oid

    def floor(self, name):
        """Swap the floor/wall sheet (room6 or a room_hospital* recolour, same tile
        layout) for another variant; the tile gids stay the same."""
        if not (ROOT / "public/break_escape/assets/tiles/rooms" / f"{name}.png").exists():
            raise SystemExit(f"no tiles/rooms/{name}.png (make it first, e.g. make_hospital_tileset.py)")
        for d in self.docs:
            ts = next((t for t in d.m["tilesets"] if "image" in t
                       and re.fullmatch(r"room6|room_hospital(_[a-z]+)?", Path(t["image"]).stem)), None)
            if ts is None:
                raise SystemExit(f"{d.path.name}: no room6-layout floor tileset")
            new = dict(ts, name=name, image=ts["image"].rsplit("/", 1)[0] + f"/{name}.png")
            d.put_tileset(new)

    def save(self):
        nxt = max(max(d.m["nextobjectid"] for d in self.docs),
                  1 + max(o["id"] for d in self.docs for lay in d.m["layers"] for o in lay.get("objects", [])))
        for d in self.docs:
            d.set_next_id(nxt)
            d.save()


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    room, op, args = Room(argv[0]), argv[1], argv[2:]
    if op == "list":
        pat = args[0] if args else ""
        for layer, o, name in room.objects():
            if pat in name:
                print(f"{layer[:22]:22} #{o['id']:<4} {name:28} x={o['x']:.0f} y={o['y']:.0f} {o['width']}x{o['height']}")
        return
    if op == "move":
        room.move(int(args[0]), x=float(args[1]), y=float(args[2]))
    elif op == "sprite":
        room.sprite(int(args[0]), args[1])
    elif op == "add":
        print("added", room.add(args[0], args[1], float(args[2]), float(args[3])))
    elif op == "delete":
        for a in args:
            room.delete(int(a))
    elif op == "relayer":
        room.relayer(int(args[0]), args[1])
    elif op == "floor":
        room.floor(args[0])
    else:
        sys.exit(f"unknown operation {op!r}\n{__doc__}")
    room.save()
    print(f"saved {room.stem} ({', '.join(d.path.suffix for d in room.docs)})")


if __name__ == "__main__":
    main(sys.argv[1:])
