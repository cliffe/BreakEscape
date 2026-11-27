"""Tests for the desk footprint data (SEAT_BOX_PLAN.md 2.3, 2.4).

- `measure_table_surfaces.py --footprint` reproduces the experiment's numbers from the PNGs.
- Coverage: every texture used in a Tiled `tables` layer, and every catalogue name the
  measurer's surface filter picks, has a `foot` entry, a `legacyBox` line or a `pending` line in
  public/break_escape/assets/table_surfaces.json, so a desk on today's box is a choice.

Run with: python3 -m unittest scripts/room_gen/test_table_surfaces.py
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import measure_table_surfaces as mts  # noqa: E402

DATA = Path(mts.ASSETS) / "table_surfaces.json"


class Footprint(unittest.TestCase):
    def fp(self, name):
        return mts.footprint(mts.sprite_path(name, "tables"))

    def test_desk1_and_smalldesk1(self):
        self.assertEqual(self.fp("desk1"), {"foot": 16, "floor": 39, "x": [0, 78], "w": 78, "h": 39})
        self.assertEqual(self.fp("zds_desk1")["foot"], 16)
        sd = self.fp("smalldesk1")
        self.assertEqual(sd["foot"], 27)  # rows 0-26 the top with its highlight lip, 27 the front face
        self.assertEqual(sd["floor"], 41)

    def test_entry_leaves_defaults_out(self):
        self.assertEqual(mts.footprint_entry(self.fp("desk1")), {"foot": 16, "source": "measured"})
        e = mts.footprint_entry({"foot": 18, "floor": 47, "x": [1, 61], "w": 62, "h": 48})
        self.assertEqual(e, {"foot": 18, "floor": 47, "x": [1, 61], "source": "measured"})


class Coverage(unittest.TestCase):
    def test_every_surface_texture_is_deliberate(self):
        data = json.loads(DATA.read_text())
        has_foot = {k for k, e in data["sprites"].items() if e.get("foot")}
        covered = has_foot | set(data["legacyBox"]) | set(data.get("pending", []))
        use = mts.tables_layer_usage()
        tables = {n for n, u in use.items() if "tables" in u["layers"]}
        surfaces = {n for n, _, _ in mts.candidates()}
        missing = sorted((tables | surfaces) - covered)
        self.assertEqual(missing, [], "add a foot entry (measure_table_surfaces.py --footprint), "
                                      "a legacyBox line or a pending line for these")

    def test_no_texture_in_two_lists(self):
        data = json.loads(DATA.read_text())
        sprites, legacy, pending = set(data["sprites"]), set(data["legacyBox"]), set(data.get("pending", []))
        self.assertFalse(sprites & legacy)
        self.assertFalse(sprites & pending)
        self.assertFalse(legacy & pending)


if __name__ == "__main__":
    unittest.main()
