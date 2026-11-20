#!/usr/bin/env python3
"""
Generate room props and conversation backgrounds with the PixelLab REST API.

Images go from disk to HTTP inside this script (never through the PixelLab MCP as
base64, which corrupts uploads). Uses the PixelLab client in tools/pixellab_pipeline.py.

props: one /create-1-direction-object call returns 64 candidate frames spread over
the item descriptions you give it (2 phrasings per item is a good spread). The
output canvas follows the style references, so each reference is padded onto a
CANVAS x CANVAS transparent square: pick the canvas for the size the prop will
be used at (16, 24, 32, 48, 64) and batch items of similar size together. Never
resize the results; if an item comes back at the wrong scale, regenerate it with
a different canvas. About 20 generations per call.

  pixellab_props.py props OUT_DIR --canvas 32 --refs rota_board1,notice_board1 \
      --items items.json [--theme "hospital furniture and equipment"] [--dry-run]

  items.json: ["a wall-mounted ward directory sign, NHS blue, front view", ...]

  Writes OUT_DIR/<id>_NN.png per frame and OUT_DIR/contact.png (frames on the room
  floor colour, 4x, numbered). Pick frames, then install with
  import_pixellab_objects.py and register_object.py.

background: a 320x320 image for person-chat "background" fields (assets/backgrounds/),
about 1 generation per variant.

  pixellab_props.py background OUT_DIR --prompt "..." [--variants 2] [--seed 1000]
"""
import argparse
import json
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
OBJ = ROOT / "public/break_escape/assets/objects"
FLOOR = (202, 215, 221, 255)  # hospital floor; close enough to judge any room's props


def contact_sheet(frames, out, scale=4):
    cell = max(max(f.width, f.height) for f in frames) + 4
    cols = 8
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * (cell + 10)), FLOOR)
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames):
        x, y = (i % cols) * cell, (i // cols) * (cell + 10)
        sheet.alpha_composite(f, (x + (cell - f.width) // 2, y + 10 + cell - 4 - f.height))
        d.text((x + 2, y), str(i), fill=(0, 0, 0, 255))
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(out)


def cmd_props(a):
    items = json.loads(Path(a.items).read_text())
    style = []
    for name in a.refs.split(","):
        im = Image.open(OBJ / f"{name}.png").convert("RGBA")
        if im.width > a.canvas or im.height > a.canvas:
            sys.exit(f"reference {name} {im.size} is bigger than the {a.canvas}px canvas")
        c = Image.new("RGBA", (a.canvas, a.canvas))
        c.alpha_composite(im, ((a.canvas - im.width) // 2, a.canvas - im.height))
        style.append(c)
    body = {"description": f"{a.theme}, top-down RPG game props in the style of the reference",
            "view": "top-down", "item_descriptions": items}
    if a.dry_run:
        print(json.dumps({**body, "style_images": [f"<{a.canvas}px {n}>" for n in a.refs.split(",")]}, indent=1))
        print("about 20 generations")
        return
    from pixellab_pipeline import PixelLab, b64_image
    body["style_images"] = [b64_image(s) for s in style]
    api = PixelLab()
    resp = api.post("/create-1-direction-object", body)
    oid = resp["object_id"]
    print("object", oid)
    while True:
        o = api.get(f"/objects/{oid}")
        if o.get("status") not in ("queued", "processing", "pending"):
            break
        time.sleep(10)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / f"object_{oid[:8]}.json").write_text(json.dumps(o, indent=1))
    frames = []
    for i in range(len(o.get("storage_urls") or {})):
        im = api.download(o["storage_urls"][f"frame_{i}"])
        im = im.crop(im.getbbox()) if im.getbbox() else im
        im.save(out / f"{oid[:8]}_{i:02d}.png")
        frames.append(im)
    if frames:
        contact_sheet(frames, out / "contact.png")
    print(f"status {o.get('status')}: {len(frames)} frames, contact sheet {out / 'contact.png'}")


def cmd_background(a):
    if a.dry_run:
        print(f"{a.variants} x /create-image-pixflux 320x320: {a.prompt}")
        return
    from pixellab_pipeline import PixelLab, decode_image, find_images
    api = PixelLab()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for i in range(a.variants):
        resp = api.post("/create-image-pixflux", {"description": a.prompt, "image_size": {"width": 320, "height": 320},
                                                  "text_guidance_scale": a.guidance, "seed": a.seed + i})
        decode_image(find_images(resp)[0]).save(out / f"v{i}.png")
        print(f"v{i}.png", resp.get("usage"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("props")
    p.add_argument("out")
    p.add_argument("--canvas", type=int, required=True)
    p.add_argument("--refs", required=True, help="comma-separated existing object names used as style references")
    p.add_argument("--items", required=True, help="JSON list of item descriptions")
    p.add_argument("--theme", default="hospital furniture and equipment")
    p.add_argument("--dry-run", action="store_true")
    b = sub.add_parser("background")
    b.add_argument("out")
    b.add_argument("--prompt", required=True)
    b.add_argument("--variants", type=int, default=2)
    b.add_argument("--seed", type=int, default=1000)
    b.add_argument("--guidance", type=float, default=8)
    b.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    {"props": cmd_props, "background": cmd_background}[a.cmd](a)


if __name__ == "__main__":
    main()
