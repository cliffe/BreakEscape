#!/usr/bin/env python3
"""Tests for tools/check_wall_fixtures_vs_doors.py.
Run: python3 -m unittest tools/test_check_wall_fixtures_vs_doors.py
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_wall_fixtures_vs_doors as c  # noqa: E402


def fx(left, right, top=20, bottom=50, side="back", label="poster1 (#1 items)"):
    return (label, left, right, top, bottom, side)


class OverlapRules(unittest.TestCase):
    def check(self, doors, fixtures):
        return c.check_map_against_doors("x", doors, ([*fixtures], 320))

    def test_back_wall_fixture_over_north_door_is_flagged(self):
        self.assertEqual(len(self.check([("north", 272, "")], [fx(248, 271)])), 1)

    def test_fixture_clear_of_north_door_is_fine(self):
        self.assertEqual(self.check([("north", 48, "")], [fx(80, 96)]), [])

    def test_fixture_touching_door_edge_is_fine(self):
        self.assertEqual(self.check([("north", 48, "")], [fx(64, 80)]), [])

    def test_side_fixture_on_east_door_row_is_flagged(self):
        f = fx(294, 308, 70, 90, side="east")
        self.assertEqual(len(self.check([("east", 80, "")], [f])), 1)

    def test_side_fixture_below_east_door_is_fine(self):
        f = fx(294, 308, 100, 120, side="east")
        self.assertEqual(self.check([("east", 80, "")], [f]), [])

    def test_west_fixture_ignored_by_east_door(self):
        f = fx(14, 28, 70, 90, side="west")
        self.assertEqual(self.check([("east", 80, "")], [f]), [])


class RealMaps(unittest.TestCase):
    def test_m05_lobby_north_door_left_corner_has_no_overlap(self):
        self.assertEqual(c.check_map_against_doors("room_qdc_lobby", [("north", 48, "")]), [])

    def test_known_overlap_is_caught_in_a_real_map(self):
        # server_hall camera at x 248-271 against a north door at the right corner
        msgs = c.check_map_against_doors("room_qdc_server_hall", [("north", 272, "")])
        self.assertTrue(any("cctv_camera" in m for m in msgs), msgs)


if __name__ == "__main__":
    unittest.main()
