#!/usr/bin/env python3
"""
Trim and install PixelLab "Create Object" sprites as game objects.

Never rescale pixel art: generate each batch at the size it will be used (the
object endpoint's canvas follows its style references, so pad those onto a
canvas of the target size). This only trims the transparent border.

Usage: import_pixellab_objects.py spec.json   # [{"src": ..., "name": ...}, ...]
"""
import json
import sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"


def install(src: str, name: str) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    im = im.crop(im.getbbox())
    path = OUT / f"{name}.png"
    im.save(path)
    print(f"wrote {path.name} {im.size}")
    return im


if __name__ == "__main__":
    for item in json.loads(Path(sys.argv[1]).read_text()):
        install(item["src"], item["name"])
