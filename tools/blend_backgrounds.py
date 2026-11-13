#!/usr/bin/env python3
"""Make a blended version of each pixel-art background: the painted concept resized to the
pixel art's size and laid over it at 50% opacity.

For every <name>.png in the folder that has a <name>_nonpixelart.png beside it, writes
<name>_blended.png. The pixel art itself is never resized; the concept is resized to match it.

Usage:
  python3 tools/blend_backgrounds.py [DIR] [--opacity 0.5] [--only NAME ...]
DIR defaults to public/break_escape/assets/backgrounds/rooms.
"""
import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", nargs="?", type=Path, default=ROOT / "public/break_escape/assets/backgrounds/rooms")
    ap.add_argument("--opacity", type=float, default=0.5, help="opacity of the concept layer (0-1)")
    ap.add_argument("--only", nargs="*", help="background names (without .png) to process")
    a = ap.parse_args()

    done = 0
    for concept in sorted(a.dir.glob("*_nonpixelart.png")):
        name = concept.name[: -len("_nonpixelart.png")]
        if a.only and name not in a.only:
            continue
        pixel = a.dir / f"{name}.png"
        if not pixel.exists():
            print(f"skip {name}: no {pixel.name}")
            continue
        base = Image.open(pixel).convert("RGB")
        top = Image.open(concept).convert("RGB").resize(base.size, Image.LANCZOS)
        Image.blend(base, top, a.opacity).save(a.dir / f"{name}_blended.png")
        done += 1
    print(f"wrote {done} blended backgrounds in {a.dir}")


if __name__ == "__main__":
    main()
