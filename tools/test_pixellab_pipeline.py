#!/usr/bin/env python3
"""Unit tests for tools/pixellab_pipeline.py (no network).

Run: python3 -m unittest tools/test_pixellab_pipeline.py -v
"""
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixellab_pipeline import (clear_edge_white, clear_white_backgrounds,  # noqa: E402
                               parse_pose_from, take_pose_from_state,
                               apply_stored_import_settings)
from convert_pixellab_to_spritesheet import normalize_anim_type  # noqa: E402

WHITE = (254, 255, 254, 255)
OFF_WHITE = (254, 252, 250, 255)
OUTLINE = (20, 20, 30, 255)
SKIN = (179, 119, 81, 255)
HAIR = (204, 203, 203, 255)
HALO = (220, 220, 221, 255)
CLEAR = (0, 0, 0, 0)


def figure_frame(background=WHITE, border=1):
    """A 20x20 frame: a 1px transparent border (as PixelLab exports have), the given
    background, and an outlined figure with an enclosed 2x2 white badge and a lone white
    eye pixel inside it, a light grey hair row, and a diagonal-only gap in the outline."""
    a = np.zeros((20, 20, 4), dtype=np.uint8)
    a[:] = background
    if border:
        a[:border, :] = CLEAR
        a[-border:, :] = CLEAR
        a[:, :border] = CLEAR
        a[:, -border:] = CLEAR
    a[5:15, 5:15] = OUTLINE        # outline box
    a[6:14, 6:14] = SKIN           # body
    a[6, 6:14] = HAIR              # light grey but below the threshold
    a[9:11, 9:11] = WHITE          # enclosed badge
    a[7, 12] = WHITE               # enclosed eye white
    # A white pixel inside the outline that touches the background only diagonally
    # (outline corner at (5,5) cut away to background, (6,6) white): must survive.
    a[5, 5] = background
    a[6, 6] = WHITE
    return a


class ClearEdgeWhiteTest(unittest.TestCase):
    def test_edge_connected_background_clears(self):
        a = figure_frame()
        out, n = clear_edge_white(Image.fromarray(a, "RGBA"))
        b = np.asarray(out)
        bg = np.ones((20, 20), bool)
        bg[5:15, 5:15] = False
        bg[5, 5] = True  # the cut corner is background too
        opaque_bg = bg & (a[..., 3] > 0)
        self.assertEqual(n, int(opaque_bg.sum()))
        self.assertTrue((b[bg][:, 3] == 0).all(), "background left opaque")

    def test_off_white_background_clears(self):
        out, n = clear_edge_white(Image.fromarray(figure_frame(OFF_WHITE), "RGBA"))
        b = np.asarray(out)
        self.assertGreater(n, 0)
        self.assertEqual(b[1, 1, 3], 0)

    def test_enclosed_white_survives(self):
        a = figure_frame()
        b = np.asarray(clear_edge_white(Image.fromarray(a, "RGBA"))[0])
        np.testing.assert_array_equal(b[9:11, 9:11], a[9:11, 9:11])   # badge
        np.testing.assert_array_equal(b[7, 12], a[7, 12])             # eye white
        np.testing.assert_array_equal(b[6, 6], a[6, 6])               # diagonal-only contact
        np.testing.assert_array_equal(b[6, 7:14], a[6, 7:14])         # light grey hair
        np.testing.assert_array_equal(b[6:14, 6:14], a[6:14, 6:14])   # whole interior

    def test_transparent_frame_unchanged(self):
        a = figure_frame(CLEAR, border=0)
        out, n = clear_edge_white(Image.fromarray(a, "RGBA"))
        self.assertEqual(n, 0)
        np.testing.assert_array_equal(np.asarray(out), a)

    def test_halo_and_speck_clear(self):
        # Animation frames carry a 1px light halo (220) round the outline, and the odd speck.
        a = figure_frame()
        a[4, 5:15] = HALO
        a[5:15, 4] = HALO
        a[2, 17] = HALO  # a lone speck, joined to nothing
        b = np.asarray(clear_edge_white(Image.fromarray(a, "RGBA"))[0])
        self.assertTrue((b[4, 5:15, 3] == 0).all())
        self.assertTrue((b[5:15, 4, 3] == 0).all())
        self.assertEqual(b[2, 17, 3], 0)
        np.testing.assert_array_equal(b[5:15, 5:15][1:, 1:], a[5:15, 5:15][1:, 1:])

    def test_speck_pass_spares_enclosed_and_dark(self):
        # A dark one-pixel spur on the outline stays; specks are only light pixels.
        a = figure_frame()
        a[15, 9] = OUTLINE
        b = np.asarray(clear_edge_white(Image.fromarray(a, "RGBA"))[0])
        np.testing.assert_array_equal(b[15, 9], a[15, 9])

    def test_white_figure_touching_edge_without_outline_is_cleared(self):
        # Documents the limit: near-white that reaches the edge is treated as background.
        a = figure_frame()
        a[10, 0:5] = WHITE
        b = np.asarray(clear_edge_white(Image.fromarray(a, "RGBA"))[0])
        self.assertEqual(b[10, 2, 3], 0)

    def test_export_folder_pass(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "rotations").mkdir()
            strip = root / "animations" / "walk" / "south"
            strip.mkdir(parents=True)
            Image.fromarray(figure_frame(), "RGBA").save(root / "rotations" / "south.png")
            Image.fromarray(figure_frame(), "RGBA").save(strip / "frame_000.png")
            clean = figure_frame(CLEAR, border=0)
            Image.fromarray(clean, "RGBA").save(strip / "frame_001.png")
            before = (strip / "frame_001.png").read_bytes()
            frames, pixels = clear_white_backgrounds(root)
            self.assertEqual(frames, 2)
            self.assertGreater(pixels, 0)
            self.assertEqual((strip / "frame_001.png").read_bytes(), before)
            self.assertEqual(np.asarray(Image.open(strip / "frame_000.png"))[1, 1, 3], 0)
            self.assertEqual(clear_white_backgrounds(root), (0, 0))  # idempotent


COMPASS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]


class PoseFromTest(unittest.TestCase):
    """--pose-from: a standing state's 8 rotations become pose_<name> frames."""

    def state(self, tmp, n=8, background=WHITE):
        rot = Path(tmp) / "state" / "rotations"
        rot.mkdir(parents=True)
        for d in COMPASS[:n]:
            Image.fromarray(figure_frame(background), "RGBA").save(rot / f"{d}.png")
        return rot.parent

    def test_copies_eight_rotations_and_flood_fills_them(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = self.state(tmp)
            root = Path(tmp) / "export"
            (root / "rotations").mkdir(parents=True)
            take_pose_from_state(root, src, {"id": "x" * 36}, "drink")
            frames = sorted((root / "animations" / "pose_drink").rglob("*.png"))
            self.assertEqual(len(frames), 8)
            self.assertEqual({f.parent.name for f in frames}, set(COMPASS))
            self.assertTrue(all(f.name == "frame_000.png" for f in frames))
            # The import's white pass covers the pose frames like every animation frame
            changed, _ = clear_white_backgrounds(root)
            self.assertEqual(changed, 8)
            self.assertEqual(Image.open(frames[0]).getpixel((2, 2))[3], 0)

    def test_wrong_rotation_count_exits_and_leaves_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = self.state(tmp, n=4)
            root = Path(tmp) / "export"
            with self.assertRaises(SystemExit):
                take_pose_from_state(root, src, {"id": "x" * 36}, "phone")
            self.assertFalse((root / "animations" / "pose_phone").exists())

    def test_unknown_name_exits(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(SystemExit):
                take_pose_from_state(Path(tmp), self.state(tmp), {"id": "x" * 36}, "dance")

    def test_parse_merges_over_stored(self):
        stored = {"drink": "a" * 36, "phone": "b" * 36}
        got = parse_pose_from(["phone=" + "c" * 36, "use = " + "d" * 36], stored)
        self.assertEqual(got, {"drink": "a" * 36, "phone": "c" * 36, "use": "d" * 36})
        self.assertEqual(stored["phone"], "b" * 36)   # the stored dict is not changed
        self.assertEqual(parse_pose_from(None, None), {})

    def test_parse_rejects_bad_values(self):
        for bad in (["drink"], ["drink="], ["wave=" + "a" * 36]):
            with self.assertRaises(SystemExit):
                parse_pose_from(bad)

    def test_converter_keeps_pose_names(self):
        self.assertEqual(normalize_anim_type("pose_drink"), "pose_drink")
        self.assertEqual(normalize_anim_type("pose_use"), "pose_use")
        self.assertEqual(normalize_anim_type("Breathing_Idle-9fa0f8f5"), "breathing-idle")
        self.assertEqual(normalize_anim_type("sit"), "sit")


class StoredImportSettingsTest(unittest.TestCase):
    """A re-import keeps sit_from, poses and idle_from, by key or by id with --key."""

    CID = "f9fdf0ce-34a5-424e-a4c1-af43aaaa8f37"
    MANIFEST = {"mow": {"character_id": CID, "sit_from": "sit-id", "idle_from": "idle-id",
                        "poses": {"drink": "d1", "phone": "p1", "use": "u1"}}}

    def args(self, target, key=None, pose_from=None):
        import argparse
        return argparse.Namespace(target=target, key=key, pose_from=pose_from, idle_from=None,
                                  sit_from=None, white_threshold=None)

    def test_by_key(self):
        a = self.args("mow", pose_from=["phone=p2"])
        apply_stored_import_settings(a, self.MANIFEST)
        self.assertEqual((a.target, a.key, a.sit_from, a.idle_from), (self.CID, "mow", "sit-id", "idle-id"))
        self.assertEqual(a.poses, {"drink": "d1", "phone": "p2", "use": "u1"})

    def test_by_id_or_url_with_key_of_the_same_character(self):
        for target in (self.CID, f"https://www.pixellab.ai/characters/{self.CID}"):
            a = self.args(target, key="mow", pose_from=["use=u2"])
            apply_stored_import_settings(a, self.MANIFEST)
            self.assertEqual(a.sit_from, "sit-id", target)
            self.assertEqual(a.poses, {"drink": "d1", "phone": "p1", "use": "u2"})

    def test_key_of_another_character_keeps_nothing(self):
        a = self.args("0" * 36, key="mow", pose_from=["use=u2"])
        apply_stored_import_settings(a, self.MANIFEST)
        self.assertIsNone(a.sit_from)
        self.assertEqual(a.poses, {"use": "u2"})


if __name__ == "__main__":
    unittest.main()
