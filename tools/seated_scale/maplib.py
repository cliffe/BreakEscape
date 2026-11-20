"""Shared helpers for the seated-scale fixes (docs/achitechture/SEATED_SCALE_AUDIT.md).

Text-level edits to Tiled maps (.json and .tmj, both JSON) and external tilesets (.tsx), so
the files keep their formatting and key order: an object is found by its id inside "layers",
a tile by its image name inside "tilesets", and only the numbers asked for are rewritten.
"""
import glob
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ASSETS = os.path.join(ROOT, "public", "break_escape", "assets")
ROOMS = os.path.join(ASSETS, "rooms")
GID_MASK = 0x1FFFFFFF

# Maps the user has asked us not to touch (standing rule): fixes are reported instead.
PROTECTED = {"room_lw_office", "room_lw_reception", "room_se_engagement", "room_lw_records", "room_lw_ceo"}


def fmt(v):
    """Tiled-style number: integers without a point, others to 15 significant digits."""
    if abs(v - round(v)) < 1e-9:
        return str(int(round(v)))
    return "%.15g" % v


def map_paths():
    """Every room map: (.json path, .tmj twin or None)."""
    out = []
    for p in sorted(glob.glob(os.path.join(ROOMS, "*.json"))):
        twin = p[:-5] + ".tmj"
        out.append((p, twin if os.path.exists(twin) else None))
    return out


def tile_names(m):
    """gid -> image basename (no extension), for embedded collection tilesets."""
    names = {}
    for t in m.get("tilesets", []):
        for tile in t.get("tiles", []):
            img = tile.get("image")
            if img:
                names[t["firstgid"] + tile["id"]] = os.path.splitext(os.path.basename(img))[0]
    return names


def objects(m):
    """Yield (layer name, object) for every object with a gid."""
    for L in m.get("layers", []):
        if L.get("type") != "objectgroup":
            continue
        for o in L.get("objects", []):
            if o.get("gid"):
                yield L["name"], o


def _span(text, start):
    """Enclosing {...} of position start: returns (open, close) indices."""
    depth = 0
    i = start
    while i >= 0:
        c = text[i]
        if c == "}":
            depth += 1
        elif c == "{":
            if depth == 0:
                break
            depth -= 1
        i -= 1
    o = i
    depth = 0
    j = o
    in_str = False
    while j < len(text):
        c = text[j]
        if in_str:
            if c == "\\":
                j += 2
                continue
            if c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return o, j
        j += 1
    raise ValueError("unbalanced braces")


def _top_level_key(body, key):
    """Match of "key": <number> at brace depth 1 inside an object body (body includes the braces)."""
    for mt in re.finditer(r'"%s"\s*:\s*(-?[0-9.eE+-]+)' % re.escape(key), body):
        depth = 0
        for c in body[:mt.start()]:
            if c in "{[":
                depth += 1
            elif c in "}]":
                depth -= 1
        if depth == 1:
            return mt
    return None


def _set_num(body, key, value):
    mt = _top_level_key(body, key)
    if not mt:
        raise KeyError(key)
    new = fmt(value)
    if "." in mt.group(1) and "." not in new:
        new += ".0"  # keep the file's own style (Python-written .tmj files use 74.0)
    return body[:mt.start(1)] + new + body[mt.end(1):]


def _set_int_raw(body, key, value):
    mt = _top_level_key(body, key)
    if not mt:
        raise KeyError(key)
    return body[:mt.start(1)] + str(value) + body[mt.end(1):]


def layers_region(text):
    a = text.index('"layers"')
    b = text.index('"tilesets"') if '"tilesets"' in text else len(text)
    if b < a:  # tilesets before layers (not Tiled's order, but be safe)
        b = len(text)
    return a, b


def edit_object(text, obj_id, **changes):
    """Rewrite numeric keys (x, y, width, height, gid) of the object with this id."""
    a, b = layers_region(text)
    for mt in re.finditer(r'"id"\s*:\s*%d(?![0-9.])' % obj_id, text[a:b]):
        pos = a + mt.start()
        o, c = _span(text, pos)
        body = text[o:c + 1]
        if not _top_level_key(body, "gid") or _top_level_key(body, "id").start() != mt.start() + a - o:
            continue
        for k, v in changes.items():
            body = _set_int_raw(body, k, v) if k == "gid" else _set_num(body, k, v)
        return text[:o] + body + text[c + 1:]
    raise KeyError("object %d not found" % obj_id)


def tilesets_region(text):
    a = text.index('"tilesets"')
    return a, len(text)


def edit_tile_image(text, image_name, imageheight=None, imagewidth=None):
    """Set imageheight/imagewidth on every embedded tile whose image basename is image_name."""
    a, _ = tilesets_region(text)
    n = 0
    pat = re.compile(r'"image"\s*:\s*"[^"]*/%s\.png"' % re.escape(image_name))
    while True:
        mt = pat.search(text, a)
        if not mt:
            break
        o, c = _span(text, mt.start())
        body = text[o:c + 1]
        if imageheight is not None:
            body = _set_num(body, "imageheight", imageheight)
        if imagewidth is not None:
            body = _set_num(body, "imagewidth", imagewidth)
        text = text[:o] + body + text[c + 1:]
        a = o + len(body)
        n += 1
    return text, n


def edit_tsx(path, image_name, height):
    """External tileset (XML): <image ... height="N" source=".../name.png"/>. Returns count."""
    s = open(path).read()
    pat = re.compile(r'<image\b[^>]*source="[^"]*/%s\.png"[^>]*/>' % re.escape(image_name))
    n = 0

    def rep(mt):
        nonlocal n
        n += 1
        return re.sub(r'\bheight="\d+"', 'height="%d"' % height, mt.group(0))
    s2 = pat.sub(rep, s)
    if n:
        open(path, "w").write(s2)
    return n


def add_tile_like(text, m, like_name, new_name, w, h):
    """Add a tile for new_name to the embedded tileset holding like_name; returns (text, gid).

    The new id is one past the tileset's highest id, and only when that gid is free (below the
    next tileset's firstgid); otherwise raises.
    """
    for t in m["tilesets"]:
        tiles = t.get("tiles", [])
        hit = [x for x in tiles if os.path.splitext(os.path.basename(x.get("image", "")))[0] == like_name]
        if not hit:
            continue
        new_id = max(x["id"] for x in tiles) + 1
        gid = t["firstgid"] + new_id
        later = [u["firstgid"] for u in m["tilesets"] if u["firstgid"] > t["firstgid"]]
        if later and gid >= min(later):
            raise ValueError("no free gid after %s" % like_name)
        a, _ = tilesets_region(text)
        pat = re.compile(r'"image"\s*:\s*"([^"]*/)%s\.png"' % re.escape(like_name))
        mt = pat.search(text, a)
        o, c = _span(text, mt.start())
        body = text[o:c + 1]
        nb = re.sub(r'/%s\.png"' % re.escape(like_name), '/%s.png"' % new_name, body)
        nb = _set_int_raw(nb, "id", new_id)
        nb = _set_num(nb, "imageheight", h)
        nb = _set_num(nb, "imagewidth", w)
        # copy the separator that follows the like tile (",\n   ...") so the layout matches
        sep_m = re.match(r'\s*,\s*', text[c + 1:])
        sep = sep_m.group(0) if sep_m else ",\n"
        text = text[:c + 1] + sep + nb + text[c + 1:]
        return text, gid, t["firstgid"]
    raise KeyError(like_name)


def bump_tilecount(text, firstgid, delta=1):
    a, _ = tilesets_region(text)
    for mt in re.finditer(r'"firstgid"\s*:\s*%d(?![0-9])' % firstgid, text[a:]):
        o, c = _span(text, a + mt.start())
        body = text[o:c + 1]
        tc = _top_level_key(body, "tilecount")
        if tc:
            body = body[:tc.start(1)] + str(int(tc.group(1)) + delta) + body[tc.end(1):]
            return text[:o] + body + text[c + 1:]
    return text


def save_checked(path, text):
    json.loads(text)
    open(path, "w").write(text)
