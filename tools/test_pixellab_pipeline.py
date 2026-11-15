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
from pixellab_pipeline import clear_edge_white, clear_white_backgrounds  # noqa: E402

WHITE = (254, 255, 254, 255)
OFF_WHITE = (254, 252, 250, 255)
OUTLINE = (20, 20, 30, 255)
SKIN = (179, 119, 81, 255)
HAIR = (204, 203, 203, 255)
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


if __name__ == "__main__":
    unittest.main()
