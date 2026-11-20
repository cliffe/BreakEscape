#!/usr/bin/env python3
"""Convert a painted background concept to a pixel-art background with PixelLab pixflux.

The concept (usually a 1024x1024 Gemini image) is centre-cropped square, resized to
the target size and used as pixflux's init image, so PixelLab redraws it as pixel art
at that size (it is not a downscale of finished pixel art).

Standard: 400x400 (pixflux's maximum), init strength 500. Keep the concept as
public/break_escape/assets/backgrounds/<name>_nonpixelart.png next to <name>.png.
Text on signs survives better at a higher strength (e.g. 600).

Usage:
  python3 tools/pixelate_background.py CONCEPT.png OUT_DIR "pixel art, <scene description>" \
      [--strengths 500] [--seed 42] [--size 400]
Writes OUT_DIR/<concept stem>_px<size>_s<strength>_seed<seed>.png for each strength.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixellab_pipeline import PixelLab, b64_image, decode_image, find_images  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("concept", type=Path)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("description")
    ap.add_argument("--strengths", default="500", help="comma-separated init strengths, e.g. 400,500,600")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--size", type=int, default=400, help="square size in pixels (pixflux max 400)")
    a = ap.parse_args()

    im = Image.open(a.concept).convert("RGBA")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((a.size, a.size), Image.LANCZOS)
    a.out_dir.mkdir(parents=True, exist_ok=True)
    api = PixelLab()
    for st in [int(x) for x in a.strengths.split(",")]:
        body = {"description": a.description, "image_size": {"width": a.size, "height": a.size},
                "init_image": b64_image(im), "init_image_strength": st, "text_guidance_scale": 8, "seed": a.seed}
        resp = api.post("/create-image-pixflux", body)
        out = a.out_dir / f"{a.concept.stem}_px{a.size}_s{st}_seed{a.seed}.png"
        decode_image(find_images(resp)[0]).convert("RGB").save(out)
        print(out, resp.get("usage"))


if __name__ == "__main__":
    main()
