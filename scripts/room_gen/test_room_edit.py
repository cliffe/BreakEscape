"""Tests for room_edit.py: the firstgid overlap check and ordered tileset insert
(SEAT_BOX_PLAN.md slice 4), and set-map-prop (slice 2).

Run with: python3 -m unittest scripts/room_gen/test_room_edit.py
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import room_edit  # noqa: E402
from room_edit import Room, _tiled_obj, gid_clash, gid_span  # noqa: E402

OBJ = '{"gid":1,"height":10,"id":1,"name":"","rotation":0,"type":"","visible":true,"width":10,"x":0,"y":10}'


def ts(name, firstgid, count=None, ids=None, source=None):
    if source:
        return {"firstgid": firstgid, "source": source}
    t = {"columns": 0, "firstgid": firstgid, "name": name}
    if count is not None:
        t["tilecount"] = count
    if ids is not None:
        t["tiles"] = [{"id": i, "image": f"../objects/{name}_{i}.png", "imageheight": 8, "imagewidth": 8} for i in ids]
    return t


def tiled_text(tilesets, props=None):
    """A map laid out as Tiled 1.11 writes it (a Doc, edited as text)."""
    head = '{ "compressionlevel":-1,\n "height":2,\n "infinite":false,\n'
    head += ' "layers":[{"name":"tables", "objects":[' + OBJ + '], "type":"objectgroup"}],\n'
    head += ' "nextlayerid":2,\n "nextobjectid":2,\n "orientation":"orthogonal",\n'
    if props is not None:
        head += ' "properties":[\n' + ", \n".join(_tiled_obj(p, 8) for p in props) + '],\n'
    head += ' "renderorder":"right-down",\n "tiledversion":"1.11.2",\n "tileheight":32,\n'
    head += ' "tilesets":[\n' + ", \n".join(_tiled_obj(t, 8) for t in tilesets) + '],\n'
    return head + ' "tilewidth":32,\n "type":"map",\n "version":"1.10",\n "width":2\n}'


def py_text(tilesets, props=None):
    """A map written by json.dump(indent=1) (a PyDoc)."""
    m = json.loads(tiled_text(tilesets))
    if props is not None:
        m["properties"] = props
    return json.dumps(m, indent=1)


BASE = [ts("office", 1, 100, None), ts("tables", 103, 11, range(11)), ts("room_lw_tiles_20", 1500, 200)]
OBJECTS = ts("objects", 115, 373, list(range(373)) + [379])


class RoomDir(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.patch = mock.patch.object(room_edit, "ROOMS", self.dir)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()
        self.tmp.cleanup()

    def write(self, name, text):
        (self.dir / name).write_text(text)


class GidRanges(RoomDir):
    def test_span_uses_ids_past_the_count(self):
        self.assertEqual(gid_span(OBJECTS), 380)
        self.assertEqual(gid_span(ts("hospital_extras", 801, 663, [0, 673])), 674)
        self.assertEqual(gid_span(ts("bare", 5)), 1)

    def test_clean_insert_below_a_high_tileset_goes_in_firstgid_order(self):
        for maker, name in ((tiled_text, "doc"), (py_text, "py")):
            with self.subTest(name):
                self.write(f"r_{name}.json", maker(BASE))
                room = Room(f"r_{name}")
                with mock.patch.object(room_edit, "ref_tileset_for", return_value=OBJECTS):
                    room.ensure_sprite("objects_379")
                room.save()
                m = json.loads((self.dir / f"r_{name}.json").read_text())
                self.assertEqual([t["firstgid"] for t in m["tilesets"]], [1, 103, 115, 1500])
                self.assertEqual(room_edit.gid_map(m)["objects_379"], 115 + 379)

    def test_real_clash_names_the_tileset(self):
        self.write("r.json", tiled_text(BASE + [ts("blocker", 400, 10, range(10))]))
        room = Room("r")
        with mock.patch.object(room_edit, "ref_tileset_for", return_value=OBJECTS):
            with self.assertRaises(SystemExit) as cm:
                room.ensure_sprite("objects_1")
        self.assertIn("blocker", str(cm.exception))
        self.assertIn("400-409", str(cm.exception))

    def test_ids_past_the_count_clash(self):
        existing = [OBJECTS]
        self.assertIsNotNone(gid_clash(existing, ts("x", 494, 1)))   # 115 + 380 - 1
        self.assertIsNone(gid_clash(existing, ts("x", 495, 1)))
        # the old check (last firstgid + tilecount) would have let 490 through: 115 + 373 = 488
        self.assertIsNotNone(gid_clash(existing, ts("x", 490, 4)))

    def test_external_source_range_is_read_from_the_tsx(self):
        (self.dir / "ext.tsx").write_text(
            '<?xml version="1.0"?>\n<tileset name="ext" tilecount="5" columns="0">'
            '<tile id="0"><image source="a.png"/></tile><tile id="9"><image source="b.png"/></tile></tileset>')
        existing = [ts(None, 600, source="ext.tsx")]
        self.assertEqual(gid_span(existing[0]), 10)
        self.assertIsNotNone(gid_clash(existing, ts("x", 609, 1)))
        self.assertIsNone(gid_clash(existing, ts("x", 610, 1)))
        self.assertEqual(gid_span(ts(None, 700, source="missing.tsx")), 1)


class SetMapProp(RoomDir):
    def check(self, stem, files):
        room = Room(stem)
        room.set_map_prop("deskBoxes", "footprint")
        room.save()
        first = {f: (self.dir / f).read_bytes() for f in files}
        for f in files:
            m = json.loads(first[f])
            self.assertEqual(m["properties"], [{"name": "deskBoxes", "type": "string", "value": "footprint"}][:1]
                             if len(m["properties"]) == 1 else m["properties"])
            keys = list(m)
            self.assertLess(keys.index("orientation"), keys.index("properties"))
            self.assertLess(keys.index("properties"), keys.index("renderorder"))
        again = Room(stem)
        for i in range(len(again.docs)):
            self.assertEqual(again.map_property("deskBoxes", doc=i), "footprint")
        again.set_map_prop("deskBoxes", "footprint")
        again.save()
        for f in files:
            self.assertEqual((self.dir / f).read_bytes(), first[f], f"{f} changed on a second run")

    def test_doc_without_twin(self):
        self.write("a.json", tiled_text(BASE))
        self.check("a", ["a.json"])
        self.assertIn(' "properties":[\n        {\n         "name":"deskBoxes",', (self.dir / "a.json").read_text())

    def test_doc_with_tmj_twin(self):
        self.write("b.json", tiled_text(BASE))
        self.write("b.tmj", tiled_text(BASE))
        self.check("b", ["b.json", "b.tmj"])

    def test_pydoc(self):
        self.write("c.json", py_text(BASE))
        self.check("c", ["c.json"])

    def test_existing_entries_kept_and_value_replaced(self):
        props = [{"name": "mood", "type": "string", "value": "night"},
                 {"name": "deskBoxes", "type": "string", "value": "legacy"}]
        self.write("d.json", tiled_text(BASE, props))
        self.write("d.tmj", py_text(BASE, {"deskBoxes": "legacy", "mood": "night"}))  # plain-object form
        room = Room("d")
        self.assertEqual(room.map_property("deskBoxes", doc=1), "legacy")
        room.set_map_prop("deskBoxes", "footprint")
        room.save()
        for f in ("d.json", "d.tmj"):
            m = json.loads((self.dir / f).read_text())
            self.assertEqual(m["properties"], [{"name": "deskBoxes", "type": "string", "value": "footprint"},
                                               {"name": "mood", "type": "string", "value": "night"}], f)

    def test_cli(self):
        self.write("e.json", tiled_text(BASE))
        room_edit.main(["e", "set-map-prop", "deskBoxes", "footprint"])
        self.assertEqual(Room("e").map_property("deskBoxes"), "footprint")


if __name__ == "__main__":
    unittest.main()
