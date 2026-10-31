#!/usr/bin/env python3
"""Find suspect frames in a PixelLab character export, for a human or agent to confirm.

PixelLab template animations sometimes produce a bad frame: a north walk frame that turns to
face south, a side view mirrored the wrong way, a frame drawn smaller, or an off-model frame
(wrong clothes, wrong colours). Re-rolling the direction often repeats the mistake, so the
cheaper path is to find the frame and patch it (see `pixellab_pipeline.py fix`).

This module makes the contact sheets an agent (or person) reviews, and adds cheap hints.
Looking at the sheets is the real detector: a vision model spots a wrong-facing frame, teal
trousers or a shrunken figure at a glance, where pixel statistics give false alarms on
legitimately extreme poses and miss colour drift. Treat flags as "look here first", never as
a verdict, and review every sheet even when nothing is flagged.

Checks per frame (codes appear in the report and on the contact sheet):
  FACING  head colours closer to the opposite direction's rotation than the expected one
          (catches some north<->south turns: the face shows, or the back of the head shows)
  JUMP    much larger change from both neighbours than the rest of the strip

Checks per strip (one animation in one direction), because PixelLab often gets a whole
direction wrong rather than one frame:
  CANVAS  the strip's frames are a different size from the rotation (a later backfill);
          the converter places each size separately, so this is informational

Recorded in the report but not flagged, because a review of 10 characters found them to be
almost all false alarms: mirror (head silhouette vs the mirrored rotation), area (figure size
vs the rotation; side views are simply narrower), off_palette and region_dist (colour drift,
which they also failed to catch). That review found ~4 real defects among 127 flags; the real
ones (a south idle facing away, a missing ponytail, skin tone and clothing drift, an added tie)
were all found by looking. Hence: the sheets are the product, the flags are a footnote.

Usage (normally via pixellab_pipeline.py qa):
  pixellab_frame_qa.py <export dir> [--out report_dir]
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

DIRECTIONS = ["south", "south-east", "east", "north-east",
              "north", "north-west", "west", "south-west"]
MIRROR = {"east": "west", "west": "east", "north-east": "north-west", "north-west": "north-east",
          "south-east": "south-west", "south-west": "south-east", "north": "north", "south": "south"}
SIDE_VIEWS = {"east", "west", "north-east", "north-west", "south-east", "south-west"}
# Poses where the figure legitimately changes shape a lot: only PALETTE applies late in these.
FREE_POSE = {"falling-back-death"}


def export_root(path):
    path = Path(path)
    if (path / "animations").is_dir():
        return path
    return next(p for p in sorted(path.iterdir()) if (p / "animations").is_dir())


def normalise(name):
    """'Breathing_Idle' / 'Breathing_Idle-9fa0f8f5' -> 'breathing-idle' (as the converter does)."""
    import re
    name = re.sub(r"-[0-9a-f]{8}$", "", name).replace("_", "-").lower()
    return "walk" if name == "animation" else name


def rgba(path):
    return np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32)


def bbox(a):
    ys, xs = np.nonzero(a[..., 3] > 0)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(ys) else None


def head(a):
    """Top 30% of the figure, where facing is decided (face vs back of head)."""
    b = bbox(a)
    if b is None:
        return None
    x0, y0, x1, y1 = b
    return a[y0:y0 + max(2, int((y1 - y0) * 0.30)), x0:x1]


def colour_hist(region):
    """Alpha-weighted 64-bin colour histogram (4 levels per channel)."""
    if region is None or region.size == 0:
        return np.zeros(64)
    q = (region[..., :3] // 64).astype(int)
    idx = q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]
    h = np.bincount(idx.ravel(), weights=(region[..., 3] / 255).ravel(), minlength=64)
    return h / max(h.sum(), 1e-6)


def region_hists(a):
    """Colour histograms of the figure's head, torso and legs thirds."""
    b = bbox(a)
    if b is None:
        return [np.zeros(64)] * 3
    x0, y0, x1, y1 = b
    h = y1 - y0
    cuts = [y0, y0 + int(h * 0.3), y0 + int(h * 0.62), y1]
    return [colour_hist(a[cuts[i]:cuts[i + 1], x0:x1]) for i in range(3)]


def head_mask(a, size=(12, 8)):
    """Head silhouette, normalised to a fixed grid, for the left/right test."""
    h = head(a)
    if h is None:
        return np.zeros(size[::-1])
    im = Image.fromarray((h[..., 3] > 0).astype(np.uint8) * 255).resize(size, Image.BILINEAR)
    return np.asarray(im, dtype=np.float32) / 255


def palette(rotations):
    px = np.concatenate([r[r[..., 3] > 0][:, :3] for r in rotations.values()])
    return np.unique((px // 8).astype(int), axis=0) * 8 + 4


def off_palette_fraction(a, pal):
    px = a[a[..., 3] > 0][:, :3]
    if not len(px):
        return 0.0
    d = np.sqrt(((px[:, None, :] - pal[None, :, :]) ** 2).sum(-1)).min(1)
    return float((d > 48).mean())


def frame_diff(a, b):
    return float(np.abs(a - b).mean() / 255)


def analyse(export_dir):
    root = export_root(export_dir)
    rot = {d: rgba(root / "rotations" / f"{d}.png") for d in DIRECTIONS
           if (root / "rotations" / f"{d}.png").exists()}
    pal = palette(rot)
    rot_hist = {d: colour_hist(head(a)) for d, a in rot.items()}
    rot_mask = {d: head_mask(a) for d, a in rot.items()}
    rot_area = {d: max(1, int((a[..., 3] > 0).sum())) for d, a in rot.items()}
    rot_regions = {d: region_hists(a) for d, a in rot.items()}

    strips = []
    for anim_dir in sorted((root / "animations").iterdir()):
        anim = normalise(anim_dir.name)
        for dir_dir in sorted(anim_dir.iterdir()):
            d = dir_dir.name
            if d not in rot:
                continue
            paths = sorted(dir_dir.glob("*.png"))
            frames = [rgba(p) for p in paths]
            opp = DIRECTIONS[(DIRECTIONS.index(d) + 4) % 8]
            diffs = [frame_diff(frames[i], frames[(i + 1) % len(frames)]) for i in range(len(frames))]
            med = float(np.median(diffs)) if diffs else 0
            results = []
            for i, (p, a) in enumerate(zip(paths, frames)):
                flags, notes = [], {}
                late_free = anim in FREE_POSE and i >= 2
                hh = colour_hist(head(a))
                d_exp = np.abs(hh - rot_hist[d]).sum()
                d_opp = np.abs(hh - rot_hist[opp]).sum()
                notes["facing"] = round(float(d_opp / max(d_exp, 1e-6)), 2)
                if not late_free and d_opp < 0.6 * d_exp:
                    flags.append("FACING")
                if d in SIDE_VIEWS and not late_free:
                    m = head_mask(a)
                    same = np.abs(m - rot_mask[d]).mean()
                    flip = np.abs(m - rot_mask[d][:, ::-1]).mean()
                    notes["mirror"] = round(float(flip / max(same, 1e-6)), 2)
                    # recorded only; see module docstring
                notes["area"] = round(float((a[..., 3] > 0).sum() / rot_area[d]), 2)
                notes["canvas"] = list(Image.open(p).size)
                notes["off_palette"] = round(off_palette_fraction(a, pal), 3)
                if len(frames) >= 3 and med > 0:
                    prev_d, next_d = diffs[i - 1], diffs[i]
                    if anim not in FREE_POSE and min(prev_d, next_d) > 2.5 * med:
                        flags.append("JUMP")
                results.append({"frame": p.name, "flags": flags, "notes": notes})
            # Strip-level appearance vs the rotation for this direction.
            usable = frames[:2] if anim in FREE_POSE else frames
            regions = [region_hists(a) for a in usable]
            region_dist = [float(np.mean([np.abs(r[k] - rot_regions[d][k]).sum() for r in regions]))
                           for k in range(3)]
            areas = [f["notes"]["area"] for f in results[:len(usable)]]
            strips.append({"animation": anim, "direction": d, "folder": str(dir_dir),
                           "frames": results, "flags": [],
                           "notes": {"region_dist": [round(x, 3) for x in region_dist],
                                     "median_area": round(float(np.median(areas)), 2)}})

    rot_size = {d: [a.shape[1], a.shape[0]] for d, a in rot.items()}
    for s in strips:
        if s["frames"] and s["frames"][0]["notes"]["canvas"] != rot_size[s["direction"]]:
            s["flags"].append(f"CANVAS:{s['frames'][0]['notes']['canvas'][0]}px")
    return {"root": str(root), "strips": strips}


def contact_sheets(report, out_dir, scale=3):
    """One sheet per animation: a row per direction, rotation first, flagged frames boxed in red."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    root = Path(report["root"])
    by_anim = {}
    for s in report["strips"]:
        by_anim.setdefault(s["animation"], []).append(s)
    paths = []
    for anim, strips in by_anim.items():
        strips.sort(key=lambda s: DIRECTIONS.index(s["direction"]))
        # Cells are sized to the largest frame and every image is placed at native size,
        # aligned on the figure, so a frame on a bigger canvas isn't shrunk into looking
        # smaller than the rotation.
        imgs = [Image.open(root / "rotations" / f"{st['direction']}.png") for st in strips]
        imgs += [Image.open(Path(st["folder"]) / f["frame"]) for st in strips for f in st["frames"]]
        size = max(max(im.size) for im in imgs)
        c = size * scale
        cols = 1 + max(len(s["frames"]) for s in strips)
        sheet = Image.new("RGB", (cols * c, len(strips) * (c + 14)), (140, 140, 140))
        dr = ImageDraw.Draw(sheet)
        for r, s in enumerate(strips):
            y = r * (c + 14)
            cells = [("rot", root / "rotations" / f"{s['direction']}.png", [])]
            cells += [(f["frame"].replace("frame_0", "f").replace(".png", ""),
                       Path(s["folder"]) / f["frame"], f["flags"]) for f in s["frames"]]
            for i, (label, p, flags) in enumerate(cells):
                raw = Image.open(p).convert("RGBA")
                placed = Image.new("RGBA", (size, size), (0, 0, 0, 0))
                bb = raw.getbbox() or (0, 0, raw.width, raw.height)
                # Align on the figure (centre, feet), as the converter does in the atlas
                placed.paste(raw, (size // 2 - (bb[0] + bb[2]) // 2, size - 3 - bb[3]))
                im = placed.resize((c, c), Image.NEAREST)
                sheet.paste(im, (i * c, y + 14), im)
                if i == 0:
                    flags = s["flags"]
                    text = f"{s['direction']} rot {' '.join(flags)}"
                else:
                    text = f"{label} {' '.join(flags)}"
                dr.text((i * c + 2, y + 1), text, fill=(255, 0, 0) if flags else (0, 0, 0))
                if flags:
                    dr.rectangle([i * c, y + 14, i * c + c - 1, y + 13 + c], outline=(255, 0, 0), width=2)
        path = out_dir / f"qa_{anim}.png"
        sheet.save(path)
        paths.append(path)
    return paths


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("export_dir")
    ap.add_argument("--out", help="write report.json and contact sheets here")
    args = ap.parse_args()
    report = analyse(args.export_dir)
    flagged = [(s["animation"], s["direction"], "(whole strip)", s["flags"])
               for s in report["strips"] if s["flags"]]
    flagged += [(s["animation"], s["direction"], f["frame"], f["flags"])
                for s in report["strips"] for f in s["frames"] if f["flags"]]
    for row in flagged:
        print(*row)
    print(f"{len(flagged)} suspect(s)")
    if args.out:
        Path(args.out).mkdir(parents=True, exist_ok=True)
        (Path(args.out) / "report.json").write_text(json.dumps(report, indent=1))
        for p in contact_sheets(report, args.out):
            print(p)


if __name__ == "__main__":
    main()
