#!/usr/bin/env python3
"""Drive the PixelLab REST API (v2) through the Break Escape character pipeline.

Turns one smooth Gemini concept portrait into:

  1. bust       a 128x128 pixel-art dialogue bust            -> <name>_talk_init.png
  2. talk       mouth-movement frames, built into a 2x2 sheet -> <name>_talk.png
  3. character  an 8-direction walk character in the house style (a PixelLab character id)
  4. animate    the standard six template animations in all 8 directions (gaps only)
  5. import     the character ZIP from the API, converted to <key>.png/.json/_headshot.png

Each paid stage can generate several alternatives. Nothing moves on until a variant is
chosen with `pick`, so a human (or an agent showing them the contact sheet) is always in
the loop between stages. Images go from disk straight to HTTP, so they never pass through
an agent's context as base64.

Everything for one character lives in a work directory (default tmp/pixellab/<name>/):

  state.json          prompt, description, every job submitted (id, params, cost, outputs), picks
  concept.png         the Gemini portrait this run started from
  bust/b01.png ...    stage 1 candidates, plus bust/contact.png
  talk/t01/f00.png .. stage 2 candidates (one folder per variant), plus talk/contact.png
  visemes/i01/*.png   optional stage 2 alternative: named mouth shapes, inpainted on the mouth
  character/c01/*.png stage 3 candidates (8 rotations each), plus character/contact.png

Typical run (see .claude/skills/pixellab-character-pipeline/SKILL.md for the full workflow):

  pixellab_pipeline.py init nurse_kim --concept .../nurse_kim_nonpixelart.png --prompt-file p.txt
  pixellab_pipeline.py bust nurse_kim --variants 4
  pixellab_pipeline.py pick nurse_kim bust b03
  pixellab_pipeline.py talk nurse_kim --variants 2
  pixellab_pipeline.py pick nurse_kim talk t01 --frames 3,5,7
  pixellab_pipeline.py character nurse_kim --variants 1
  pixellab_pipeline.py pick nurse_kim character c01
  pixellab_pipeline.py animate nurse_kim
  pixellab_pipeline.py import nurse_kim --register

`animate` and `import` also take any character id or pixellab.ai URL, for characters made
outside the pipeline:  pixellab_pipeline.py import <url> --key bernie_nwosu --register

Other commands: status, collect (finish jobs a killed run left pending), balance, visemes.
Every paid command accepts --dry-run, which prints the request without sending it.

Auth: PIXELLAB_API_KEY (or PIXELLAB_API_TOKEN) env var, else the Authorization header of
the `pixellab` MCP server in ~/.claude.json. The token is never printed.
"""
import argparse
import base64
import concurrent.futures
import io
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from PIL import Image, ImageChops, ImageDraw

API = "https://api.pixellab.ai/v2"
REPO = Path(__file__).resolve().parent.parent
CHARACTERS_DIR = REPO / "public/break_escape/assets/characters"
TALK_SCRIPTS = REPO / ".claude/skills/character-talk-animation/scripts"
DEFAULT_WORKDIR = REPO / "tmp/pixellab"

# The account has 8 concurrent job slots, shared with anything running in the web UI.
MAX_PARALLEL = 8
POLL_SECONDS = 8
POLL_TIMEOUT = 45 * 60

# Gary Whitlock: the house-style reference for new walk characters (60px, low top-down).
DEFAULT_STYLE_CHARACTER = "2b2d5800-1695-4dcd-bdc4-593bc34e4b43"

DEFAULT_TALK_ACTION = (
    "Eyes remain open and still. Head does not move, keep the eyes in a fixed position. "
    "Only the mouth and jaw are animated. The character stands perfectly still, maintaining "
    "steady eye contact as their mouth begins to animate with speech. Their lips part and "
    "continuously move through a series of natural vocalization shapes, cycling through "
    'rounded "oo" and "ah" formations followed by the wider, flatter "ee" position. '
    "Throughout the sequence, their jaw moves fluidly to articulate the words, while their "
    "head, eyes, and posture remain completely fixed in place, focusing entirely on the act "
    "of speaking."
)

DIRECTIONS = ["south", "south-east", "east", "north-east",
              "north", "north-west", "west", "south-west"]


# --------------------------------------------------------------------------- auth + HTTP

def load_token():
    for var in ("PIXELLAB_API_KEY", "PIXELLAB_API_TOKEN"):
        if os.environ.get(var):
            return "Bearer " + os.environ[var].removeprefix("Bearer ").strip()
    cfg = Path.home() / ".claude.json"
    if cfg.exists():
        data = json.loads(cfg.read_text())
        servers = [data.get("mcpServers", {})]
        servers += [p.get("mcpServers", {}) for p in data.get("projects", {}).values()]
        for s in servers:
            auth = s.get("pixellab", {}).get("headers", {}).get("Authorization")
            if auth:
                return auth
    sys.exit("No PixelLab token: set PIXELLAB_API_KEY or configure the pixellab MCP server.")


class PixelLab:
    """Thin v2 client. Every call returns parsed JSON; HTTP errors exit with the API's message."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers["Authorization"] = load_token()

    def _call(self, method, path, **kw):
        for attempt in range(4):
            r = self.session.request(method, API + path, timeout=300, **kw)
            # 429 = rate limited or no free job slot; back off and retry rather than fail a batch.
            if r.status_code in (429, 502, 503) and attempt < 3:
                wait = 15 * (attempt + 1)
                print(f"  {r.status_code} on {path}, retrying in {wait}s: {r.text[:160]}")
                time.sleep(wait)
                continue
            if not r.ok:
                raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:600]}")
            return r.json() if r.content else {}

    def get(self, path, **params):
        return self._call("GET", path, params=params)

    def post(self, path, body):
        return self._call("POST", path, json=body)

    def download(self, url):
        r = self.session.get(url, timeout=120) if url.startswith(API) else requests.get(url, timeout=120)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGBA")

    def wait_job(self, job_id, label=""):
        """Poll /background-jobs until completed. Returns last_response; raises on failure."""
        start = time.time()
        while True:
            job = self.get(f"/background-jobs/{job_id}")
            status = job.get("status")
            if status == "completed":
                return job.get("last_response") or {}, job.get("usage")
            if status == "failed":
                raise RuntimeError(f"job {job_id} failed: {json.dumps(job.get('last_response'))[:400]}")
            if time.time() - start > POLL_TIMEOUT:
                raise TimeoutError(f"job {job_id} still {status} after {POLL_TIMEOUT}s; run `collect` later")
            print(f"  {label} {job_id[:8]}: {status}")
            time.sleep(POLL_SECONDS)


# ------------------------------------------------------------------------- image helpers

def b64_image(im):
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return {"type": "base64", "base64": base64.b64encode(buf.getvalue()).decode(), "format": "png"}


def decode_image(obj):
    """Accept a Base64Image dict, a bare base64 string, or a data: URL."""
    if isinstance(obj, dict):
        obj = obj.get("base64", "")
    if obj.startswith("data:"):
        obj = obj.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(obj))).convert("RGBA")


def find_images(node):
    """Collect every image in a job response, in document order.

    Response shapes differ per endpoint (`images`, `image`, `frames`, nested lists), so walk
    the whole structure for Base64Image-shaped dicts rather than hard-coding each one.
    """
    found = []
    if isinstance(node, dict):
        if isinstance(node.get("base64"), str) and len(node["base64"]) > 64:
            return [node]
        for v in node.values():
            found += find_images(v)
    elif isinstance(node, list):
        for v in node:
            found += find_images(v)
    return found


def fit_square(im, size):
    """Shrink an RGBA image onto a transparent size x size canvas, preserving aspect."""
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return canvas


def contact_sheet(rows, out_path, cell=128, scale=2):
    """Save a labelled grid for choosing between variants.

    rows: list of (row_label, [(cell_label, PIL image), ...]). Pixel art is upscaled with
    NEAREST so it stays crisp when viewed; transparency shows as a mid-grey checkerboard.
    """
    c = cell * scale
    label_h = 16
    cols = max(len(cells) for _, cells in rows)
    sheet = Image.new("RGB", (cols * c, len(rows) * (c + label_h * 2)), (40, 40, 40))
    draw = ImageDraw.Draw(sheet)
    for r, (row_label, cells) in enumerate(rows):
        y = r * (c + label_h * 2)
        draw.text((4, y + 2), row_label, fill=(255, 220, 0))
        for i, (cell_label, im) in enumerate(cells):
            x = i * c
            bg = Image.new("RGB", (c, c), (150, 150, 150))
            bd = ImageDraw.Draw(bg)
            for yy in range(0, c, 16):
                for xx in range(0, c, 16):
                    if (xx // 16 + yy // 16) % 2:
                        bd.rectangle([xx, yy, xx + 15, yy + 15], fill=(120, 120, 120))
            tile = fit_square(im, cell) if im.size != (cell, cell) else im
            tile = tile.resize((c, c), Image.NEAREST)
            bg.paste(tile, (0, 0), tile)
            sheet.paste(bg, (x, y + label_h))
            draw.text((x + 4, y + label_h + c + 2), cell_label, fill=(255, 255, 255))
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    return out_path


# ------------------------------------------------------------------------------ state

class Run:
    """One character's work directory and its state.json."""

    def __init__(self, name, workdir=None):
        self.name = name
        self.dir = Path(workdir or DEFAULT_WORKDIR) / name
        self.state_path = self.dir / "state.json"
        self.state = json.loads(self.state_path.read_text()) if self.state_path.exists() else None
        self.lock = threading.RLock()  # bust variants run in threads and all write state.json

    def require(self):
        if self.state is None:
            sys.exit(f"No run for '{self.name}' in {self.dir}. Start with `init`.")
        return self

    def save(self):
        with self.lock:
            self.dir.mkdir(parents=True, exist_ok=True)
            # default=: numpy ints and the like must never stop a paid job id being recorded
            self.state_path.write_text(json.dumps(self.state, indent=2, default=lambda o: o.item()
                                                  if hasattr(o, "item") else str(o)))

    def next_ids(self, stage, prefix, n):
        taken = {j["variant"] for j in self.state["jobs"] if j["stage"] == stage}
        out, i = [], 1
        while len(out) < n:
            vid = f"{prefix}{i:02d}"
            if vid not in taken:
                out.append(vid)
            i += 1
        return out

    def add_job(self, **job):
        job.setdefault("created", datetime.now(timezone.utc).isoformat(timespec="seconds"))
        job.setdefault("status", "submitted")
        with self.lock:
            self.state["jobs"].append(job)
            self.save()
        return job

    def jobs(self, stage, status=None):
        return [j for j in self.state["jobs"]
                if j["stage"] == stage and (status is None or j["status"] == status)]

    def picked(self, stage):
        pick = self.state["picks"].get(stage)
        if not pick:
            sys.exit(f"No {stage} picked yet. Run `{stage}`, look at {stage}/contact.png, then `pick {self.name} {stage} <id>`.")
        return pick


def record_usage(job, usage):
    if usage:
        job["usage"] = usage


def total_usage(jobs):
    return sum((j.get("usage") or {}).get("generations") or 0 for j in jobs)


# ------------------------------------------------------------------------------ init

def cmd_init(args):
    run = Run(args.name, args.workdir)
    if run.state and not args.force:
        sys.exit(f"{run.state_path} already exists. Use --force to start over (old candidates are kept on disk).")
    if not args.concept and not args.bust:
        sys.exit("give --concept (a new character) or --bust (an existing talk bust or sheet)")
    if args.bust and not args.concept:
        return init_from_bust(run, args)
    concept = Path(args.concept)
    im = Image.open(concept).convert("RGBA")
    prompt_file = args.prompt_file
    if not prompt_file and not args.prompt:
        # character-talk-animation saves the Gemini prompt beside the portrait.
        sibling = concept.with_name(concept.stem + "_prompt.txt")
        prompt_file = sibling if sibling.exists() else None
    prompt = Path(prompt_file).read_text().strip() if prompt_file else args.prompt
    if not prompt:
        sys.exit("Give the Gemini prompt with --prompt-file or --prompt "
                 f"(or save it as {concept.stem}_prompt.txt beside the portrait).")
    # The character description is the start of the Gemini prompt: the "Make portrait for"
    # line and the physical description, stopping before the pose/style boilerplate.
    description = args.description or "\n".join(prompt.splitlines()[:2])
    run.dir.mkdir(parents=True, exist_ok=True)
    im.save(run.dir / "concept.png")
    run.state = {
        "name": args.name,
        "concept_source": str(concept),
        "prompt": prompt,
        "description": description,
        "jobs": [],
        "picks": {},
    }
    run.save()
    if args.bust:
        # An existing bust (e.g. a manual web-UI result) joins the bust candidates as b00.
        existing = Image.open(args.bust).convert("RGBA")
        (run.dir / "bust").mkdir(exist_ok=True)
        existing.save(run.dir / "bust" / "b00.png")
        run.add_job(stage="bust", variant="b00", endpoint="adopted", status="completed",
                    outputs=["bust/b00.png"], params={"source": str(args.bust)})
        print(f"added {args.bust} as bust candidate b00")
    print(f"Initialised {run.dir}")
    print(f"description (used for the walk character):\n  {description}")
    print(f"next: pixellab_pipeline.py bust {args.name} --variants 4")


def init_from_bust(run, args):
    """Start a run from an existing bust, e.g. to add lip sync to a character that already
    has a talk sheet. A 2x2 talk sheet is accepted: its top-left (mouth closed) cell is used."""
    im = Image.open(args.bust).convert("RGBA")
    w, h = im.size
    if w == h and w >= 256 and w % 2 == 0:
        im = im.crop((0, 0, w // 2, h // 2))
    run.dir.mkdir(parents=True, exist_ok=True)
    (run.dir / "bust").mkdir(exist_ok=True)
    im.save(run.dir / "bust" / "b00.png")
    run.state = {"name": args.name, "concept_source": None, "bust_source": str(args.bust),
                 "prompt": args.prompt or "", "description": args.description or "",
                 "jobs": [], "picks": {"bust": "b00"}}
    run.add_job(stage="bust", variant="b00", endpoint="adopted", status="completed",
                outputs=["bust/b00.png"], params={"source": str(args.bust)})
    print(f"Initialised {run.dir} from existing bust {args.bust} ({im.size[0]}x{im.size[1]}), picked as b00")
    print(f"next: pixellab_pipeline.py visemes {args.name} --dry-run   (writes the mask previews; then add --mouth/--eyes)")


# --------------------------------------------------------------- stage 1: pixel-art bust

def bust_request(run, args, seed):
    """Web UI 'Image to image': Gemini art as init image, same prompt, transparent background."""
    concept = Image.open(run.dir / "concept.png").convert("RGBA")
    size = args.size
    if args.engine == "pixflux":
        body = {
            "description": run.state["prompt"],
            "image_size": {"width": size, "height": size},
            "init_image": b64_image(fit_square(concept, size)),
            "init_image_strength": args.strength,
            "text_guidance_scale": args.guidance,
            "no_background": True,
            "background_removal_task": "remove_complex_background",
        }
        endpoint = "/create-image-pixflux"
    else:  # image-to-pixelart: the web UI's "Image to pixel art", no prompt
        src = fit_square(concept, min(concept.width, 2048))
        body = {
            "image": b64_image(src),
            "image_size": {"width": src.width, "height": src.height},
            "output_size": {"width": size, "height": size},
            "init_image_strength": args.strength,
            "text_guidance_scale": args.guidance,
            "fixer": args.faithful,
        }
        endpoint = "/image-to-pixelart"
    if seed is not None:
        body["seed"] = seed
    return endpoint, body


def cmd_bust(args):
    run = Run(args.name, args.workdir).require()
    ids = run.next_ids("bust", "b", args.variants)
    seeds = [None if args.seed is None else args.seed + i for i in range(args.variants)]
    params = {k: getattr(args, k) for k in ("engine", "size", "strength", "guidance", "faithful")}
    if args.dry_run:
        return dry_run(*bust_request(run, args, seeds[0]), n=args.variants)

    api = PixelLab()
    out_dir = run.dir / "bust"
    out_dir.mkdir(exist_ok=True)

    def one(vid, seed):
        endpoint, body = bust_request(run, args, seed)
        job = run.add_job(stage="bust", variant=vid, endpoint=endpoint, params=params, seed=seed)
        try:
            resp = api.post(endpoint, body)  # both bust endpoints answer synchronously
            images = find_images(resp)
            if not images:
                raise RuntimeError(f"no image in response: {json.dumps(resp)[:300]}")
            path = out_dir / f"{vid}.png"
            decode_image(images[0]).save(path)
            job.update(status="completed", outputs=[str(path.relative_to(run.dir))])
            record_usage(job, resp.get("usage"))
        except Exception as e:  # keep the batch going; a failed variant is just a missing option
            job.update(status="failed", error=str(e))
        return job

    print(f"Generating {len(ids)} bust variant(s) with {params}")
    with concurrent.futures.ThreadPoolExecutor(min(len(ids), MAX_PARALLEL)) as pool:
        list(pool.map(one, ids, seeds))
    run.save()
    report_stage(run, "bust")


def bust_contact(run):
    cells = [(j["variant"] + (" *" if run.state["picks"].get("bust") == j["variant"] else ""),
              Image.open(run.dir / j["outputs"][0]))
             for j in run.jobs("bust", "completed")]
    if not cells:
        return None
    rows = [(f"{run.name} busts", cells[i:i + 4]) for i in range(0, len(cells), 4)]
    return contact_sheet(rows, run.dir / "bust/contact.png")


# ----------------------------------------------------------- stage 2: talk animation

def talk_request(run, args, seed):
    """Web UI 'Animate > Interpolate frames' (model v3): picked bust as first AND last frame."""
    bust = b64_image(Image.open(run.dir / "bust" / f"{run.picked('bust')}.png").convert("RGBA"))
    body = {
        "first_frame": bust,
        "last_frame": bust,
        "action": args.action,
        "frame_count": args.frames,
        "no_background": True,
        "seed": seed or 0,  # 0 = random
    }
    return "/animate-with-text-v3", body


def cmd_talk(args):
    run = Run(args.name, args.workdir).require()
    run.picked("bust")
    if args.frames % 2:
        sys.exit("--frames must be even (API constraint)")
    ids = run.next_ids("talk", "t", args.variants)
    seeds = [None if args.seed is None else args.seed + i for i in range(args.variants)]
    if args.dry_run:
        return dry_run(*talk_request(run, args, seeds[0]), n=args.variants)

    api = PixelLab()
    for vid, seed in zip(ids, seeds):
        endpoint, body = talk_request(run, args, seed)
        resp = api.post(endpoint, body)
        run.add_job(stage="talk", variant=vid, endpoint=endpoint, job_id=resp["background_job_id"],
                    params={"frames": args.frames, "action": args.action}, seed=seed,
                    usage=resp.get("usage"))
        print(f"submitted {vid}: job {resp['background_job_id']}")
    collect(run, api, "talk")
    report_stage(run, "talk")


def save_talk_frames(run, job, last_response):
    out = run.dir / "talk" / job["variant"]
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, img in enumerate(find_images(last_response)):
        p = out / f"f{i:02d}.png"
        decode_image(img).save(p)
        paths.append(str(p.relative_to(run.dir)))
    if not paths:
        raise RuntimeError(f"job completed with no frames: {json.dumps(last_response)[:300]}")
    job["outputs"] = paths


def change_box(base, frames, side=40):
    """A side x side box centred on where the frames differ most from base (the mouth).

    The model also jitters the whole head by a pixel or two, so a plain bounding box of all
    changes covers hat to collar. Weighting by change magnitude finds the open mouth, which
    swaps skin for a dark cavity and so dominates.
    """
    import numpy as np
    b = np.asarray(base.convert("RGBA"), dtype=np.int32)
    acc = np.zeros(b.shape[:2], dtype=np.float64)
    for f in frames:
        if f.size == base.size:
            acc += np.abs(np.asarray(f, dtype=np.int32) - b)[..., :3].sum(axis=2)
    acc[int(acc.shape[0] * 0.6):, :] = 0
    acc[acc < np.percentile(acc, 99)] = 0
    if acc.sum() == 0:
        return None
    ys, xs = np.indices(acc.shape)
    cx, cy = int((xs * acc).sum() / acc.sum()), int((ys * acc).sum() / acc.sum())
    x0 = int(min(max(0, cx - side // 2), base.width - side))
    y0 = int(min(max(0, cy - side // 2), base.height - side))
    return (x0, y0, x0 + side, y0 + side)


def mouth_face_box(frames, width=42, above=9, below=12):
    """Estimate a box to paste mouths onto the bust: from under the eyes to the chin.

    Only this region is taken from the generated frames, so the bust keeps its own eyes,
    hair and body. That matters: the models tend to close the eyes, and some
    animations re-render every pixel slightly (collar, lanyard), which makes a
    union-of-changes box (build_talk_sheet's default) swallow the whole image.

    The estimate compares the two generated frames that differ most from each other, which
    share the model's re-render drift, so their difference is mostly the mouth. It is only
    accurate to about 5 px, which is the distance between the eyes and the mouth, so `pick`
    always writes face_box_preview.png: check it, and pass --face when the box is off.
    """
    import numpy as np
    arrs = [np.asarray(f.convert("RGBA"), dtype=np.float32)[..., :3] for f in frames]
    arrs = [a for a in arrs if a.shape == arrs[0].shape]
    if len(arrs) < 2:
        return None
    h = arrs[0].shape[0]
    best, pair = -1, None
    for i in range(len(arrs)):
        for j in range(i + 1, len(arrs)):
            d = np.abs(arrs[i] - arrs[j]).sum(axis=2)[: int(h * 0.6)]
            if d.sum() > best:
                best, pair = d.sum(), d
    d = pair
    if not (d > 0).any():
        return None
    d[d < np.percentile(d[d > 0], 90)] = 0
    ys, xs = np.nonzero(d)
    w = d[ys, xs]
    cx, cy = int((xs * w).sum() / w.sum()), int((ys * w).sum() / w.sum())
    width_px = arrs[0].shape[1]
    x0 = int(min(max(0, cx - width // 2), width_px - width))
    y0 = int(min(max(0, cy - above), h - above - below))
    return (x0, y0, x0 + width, y0 + above + below)


def face_box_preview(run, bust, frames, box):
    """Save the face box drawn on the bust and on the most-changed frame, for checking."""
    import numpy as np
    b = np.asarray(bust.convert("RGBA"), dtype=np.int32)
    most = max(frames, key=lambda f: np.abs(np.asarray(f.convert("RGBA"), dtype=np.int32) - b).sum()
               if f.size == bust.size else -1)
    cells = []
    for label, im in (("bust", bust), ("most open", most)):
        im = im.convert("RGBA").copy()
        ImageDraw.Draw(im).rectangle([box[0], box[1], box[2] - 1, box[3] - 1], outline=(255, 0, 0, 255))
        cells.append((label, im))
    path = contact_sheet([(f"face box {box}: mouth and chin inside, eyes outside?", cells)],
                         run.dir / "face_box_preview.png", cell=bust.width, scale=3)
    print(f"face box preview: {path}  (check it; override with --face x0,y0,x1,y1)")


def square_crop(im, box):
    x0, y0, x1, y1 = box
    side = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    crop = im.crop((cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side))
    return crop.resize((im.width, im.height), Image.NEAREST)


def talk_contact(run):
    rows = []
    bust = Image.open(run.dir / "bust" / f"{run.state['picks']['bust']}.png")
    for j in run.jobs("talk", "completed"):
        frames = [(Path(p).stem, Image.open(run.dir / p).convert("RGBA")) for p in j["outputs"]]
        cells = [("bust", bust)] + frames
        rows.append((f"{j['variant']}  (frame numbers for --frames: f01=1, f02=2 ...)", cells))
        # Mouths are a few pixels wide, so add a row zoomed on whatever changed between frames.
        box = change_box(bust, [im for _, im in frames])
        if box:
            rows.append((f"{j['variant']} mouth zoom {box}",
                         [(label, square_crop(im, box)) for label, im in cells]))
    for j in run.jobs("visemes", "completed"):
        frames = [(Path(p).stem, Image.open(run.dir / p).convert("RGBA")) for p in j["outputs"]]
        cells = [("bust", bust)] + frames
        rows.append((f"{j['variant']}  visemes (use {j['variant']}:<name>)", cells))
        box = change_box(bust, [im for _, im in frames])
        if box:
            rows.append((f"{j['variant']} mouth zoom {box}",
                         [(label, square_crop(im, box)) for label, im in cells]))
    return contact_sheet(rows, run.dir / "talk/contact.png") if rows else None


# --------------------------------------------- stage 2 alternative: named visemes

def head_box(bust, side):
    """A side x side square over the head: the top of the figure, centred on the head's columns."""
    import numpy as np
    alpha = np.asarray(bust.split()[3]) > 0
    rows = np.nonzero(alpha.any(axis=1))[0]
    if len(rows) == 0:
        sys.exit("bust is empty")
    top = rows[0]
    head = alpha[top:top + side // 2]  # upper part of the head only, so shoulders don't pull x
    cx = int(np.nonzero(head)[1].mean())
    x0 = int(min(max(0, cx - side // 2), bust.width - side))
    y0 = int(min(max(0, int(top) - 2), bust.height - side))
    return (x0, y0, x0 + side, y0 + side)


def cmd_visemes(args):
    """Named mouth shapes for lip sync, inpainted on the bust (variants iNN).

    One /inpaint-image-pro-flash call per shape, masked to the mouth only, so the nose, jaw
    and the mouth's position on a turned head stay exactly as drawn. About 6 generations per
    shape. (/vocal-animation was tried first and dropped: it assumes a face looking straight
    at the camera, and on three-quarter busts it lost the nose and moved the mouth.)
    """
    run = Run(args.name, args.workdir).require()
    bust = Image.open(run.dir / "bust" / f"{run.picked('bust')}.png").convert("RGBA")
    return visemes_inpaint(run, bust, args)


# What each shape must look like, matching the letter classes in lip-sync.js.
MOUTH_SHAPES = {
    "closed": "full lips pressed together, as when saying 'm', 'b' or 'p': both lips keep their colour "
              "and thickness, meeting in one dark line, no gap or teeth",
    "teeth": "lips parted to show the upper front teeth as a clear row of white pixels, lower lip tucked "
             "just under them, as when saying 'f', 'v' or 's'",
    "round": "lips pushed forward into a small rounded 'o', as when saying 'oo'; a small dark round opening, "
             "narrower than the resting mouth",
    "small_open": "lips parted by a small dark opening about two pixels tall, clearly more open than a "
                  "closed mouth, no teeth showing",
    "medium_open": "mouth half open as when saying 'eh': a dark mouth interior with a hint of upper teeth",
    "wide_open": "mouth clearly open for the vowel 'ah' in ordinary conversation: a dark open mouth about "
                 "twice the height of the closed lips, upper teeth just visible, relaxed, not shouting",
    # Not a mouth: eyes shut for the portrait's idle blink (mask from --eyes, see shape_mask).
    "blink": "eyes closed mid-blink: each upper eyelid lowered so the eye is a dark curved lash line, "
             "eyebrows, skin tone and shading unchanged",
}
# 'closed' comes out as a thin line without lip colour on every take; the resting mouth is
# already closed lips, so by default the sheet leaves 'closed' out and the game falls back
# to 'rest' for m/b/p. Ask for it with --shapes closed,... to try anyway.
DEFAULT_SHAPES = ("teeth", "round", "small_open", "medium_open", "wide_open")
# Shapes whose jaw drops, and by how many pixels at a 128px bust (scaled by --drop). The
# model won't move a jaw when asked, so drop_jaw() moves the chin down first and the model
# only draws the open mouth into the gap and blends the seams.
JAW_DROP = {"medium_open": 1, "wide_open": 2}  # 3px on wide_open read as a shout
JAW_SHAPES = tuple(JAW_DROP)
MIN_CHANGED_PIXELS = 8  # fewer changed pixels than this and a shape reads as the resting mouth
EYES_KEEP = ("Only the eyes change: the mouth, nose, hair and face shape stay exactly as they are.")
MOUTH_KEEP = ("Only the mouth changes. Keep the same lip colour, skin tone, outline and pixel-art shading; "
              "the head is turned, so the mouth stays exactly where it is, not centred.")


def suggest_mouth_box(bust):
    """Guess the mouth mask from lip-coloured pixels (red/pink) in the upper half of the figure.

    Only a starting point: dark or skin-toned lips aren't found, so always check the preview
    and pass --mouth x0,y0,x1,y1 when it's wrong.
    """
    import numpy as np
    a = np.asarray(bust, dtype=np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    rows = np.nonzero((al > 0).any(axis=1))[0]
    if not len(rows):
        return None
    top = rows[0]
    lips = (al > 0) & (r - g > 60) & (b - g > 5) & (r > 120)
    lips[: top + 8] = False  # skip hair/forehead
    lips[top + (rows[-1] - top) // 2:] = False  # upper half only: no ties, lanyards or badges
    ys, xs = np.nonzero(lips)
    if len(xs) < 4 or xs.max() - xs.min() > 24:
        return None
    return (int(xs.min()) - 2, int(ys.min()) - 1, int(xs.max()) + 3, int(ys.max()) + 4)


def mouth_box_preview(run, bust, box, out_name="mouth_box_preview.png", outline=True, jaw=None):
    """A gridded close-up around box, labelled with pixel coordinates, the box outlined as the
    mask (red) and the open shapes' jaw mask in orange."""
    x0, y0, x1, y1 = box
    if jaw:
        x0, y0, x1, y1 = min(x0, jaw[0]), min(y0, jaw[1]), max(x1, jaw[2]), max(y1, jaw[3])
    pad, z = 12, 12
    cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad - 6)
    cx1, cy1 = min(bust.width, x1 + pad), min(bust.height, y1 + pad)
    crop = bust.crop((cx0, cy0, cx1, cy1)).resize(((cx1 - cx0) * z, (cy1 - cy0) * z), Image.NEAREST)
    im = Image.new("RGBA", crop.size, "white")
    im.paste(crop, (0, 0), crop)
    d = ImageDraw.Draw(im)
    for x in range(cx0, cx1 + 1):
        if x % 5 == 0:
            d.line([((x - cx0) * z, 0), ((x - cx0) * z, im.height)], fill=(0, 180, 255, 120))
            d.text(((x - cx0) * z + 2, 2), str(x), fill=(255, 0, 0, 255))
    for y in range(cy0, cy1 + 1):
        if y % 5 == 0:
            d.line([(0, (y - cy0) * z), (im.width, (y - cy0) * z)], fill=(0, 180, 255, 120))
            d.text((2, (y - cy0) * z + 2), str(y), fill=(255, 0, 0, 255))
    for b, colour in ((jaw, (255, 150, 0, 255)), (box if outline else None, (255, 0, 0, 255))):
        if b:
            d.rectangle([(b[0] - cx0) * z, (b[1] - cy0) * z, (b[2] - cx0) * z - 1, (b[3] - cy0) * z - 1],
                        outline=colour, width=2)
    path = run.dir / "visemes" / out_name
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    return path


def mouth_mask(bust, box):
    """White inside the box where the bust is opaque, so a box corner hanging over the
    background can't gain stray pixels around the chin."""
    mask = Image.new("L", bust.size, 0)
    ImageDraw.Draw(mask).rectangle([box[0], box[1], box[2] - 1, box[3] - 1], fill=255)
    return ImageChops.multiply(mask, bust.split()[3].point(lambda a: 255 if a else 0))


def jaw_box(bust, box, jaw):
    """The mouth box widened 3px each side and extended `jaw` rows down past the chin."""
    x0, y0, x1, y1 = box
    return (max(0, x0 - 3), y0, min(bust.width, x1 + 3), min(bust.height, y1 + jaw))


def drop_jaw(bust, params, shape):
    """The bust with everything below the lip line moved down, inside the jaw box.

    The moved block is a column narrower than the jaw box on each side, so its seams (and
    the stretched gap above it) fall inside the mask for the model to redraw. The chin ends
    up over the top of the neck, as a real jaw drop does.
    """
    drop = params.get("drop", {}).get(shape, 0)
    if not drop or not params.get("jaw"):
        return bust
    mx0, my0, mx1, my1 = params["mouth"]
    jx0, jy0, jx1, jy1 = jaw_box(bust, params["mouth"], params["jaw"])
    split = my0 + (my1 - my0) * 2 // 5  # between the lips, near the top of the mouth box
    x0, x1 = jx0 + 2, jx1 - 2
    block = bust.crop((x0, split, x1, jy1 - drop))
    out = bust.copy()
    out.paste(Image.new("RGBA", block.size, (0, 0, 0, 0)), (x0, split + drop))  # clear, then place
    out.paste(block, (x0, split + drop))
    return out


def unwhiten(frame, source, mask, mouth=None):
    """Clean up the model's output inside the mask before it is pasted onto the bust.

    Pro Flash fills transparency with white, so light, grey pixels there go back to
    transparent, and so does any new pixel left with no filled neighbour (a stray speck
    beside the jaw). A jaw line that really moved into the background stays: it is dark
    and joined to the face.
    """
    import numpy as np
    f = np.array(frame)
    src_clear = np.asarray(source)[..., 3] == 0
    rgb = f[..., :3].astype(np.int32)
    greyish_light = (rgb.min(axis=2) >= 190) & (rgb.max(axis=2) - rgb.min(axis=2) <= 40)
    new = src_clear & (np.asarray(mask) > 0) & (f[..., 3] > 0)
    f[new & greyish_light] = 0
    filled = f[..., 3] > 0
    padded = np.pad(filled, 1)
    neighbours = sum(padded[1 + dy:padded.shape[0] - 1 + dy, 1 + dx:padded.shape[1] - 1 + dx]
                     for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    f[new & filled & (neighbours == 0)] = 0
    # A lone changed pixel anywhere (e.g. a light speck on a dark collar) is noise: the mouth
    # and jaw edits always come in clusters
    src = np.asarray(source)
    changed = (np.abs(f.astype(np.int32) - src.astype(np.int32)).sum(axis=2) > 60) & (np.asarray(mask) > 0)
    cp = np.pad(changed, 1)
    near = sum(cp[1 + dy:cp.shape[0] - 1 + dy, 1 + dx:cp.shape[1] - 1 + dx]
               for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    lone = changed & (near == 0)
    f[lone] = src[lone]
    # Teeth belong in the mouth box: light pixels the model adds in the jaw-only part of the
    # mask (chin, neck, hair beside the jaw) are specks, not teeth
    if mouth:
        x0, y0, x1, y1 = mouth
        outside = np.ones(changed.shape, bool)
        outside[y0:y1, x0:x1] = False
        rgb = f[..., :3].astype(np.int32)
        light = (rgb.min(axis=2) >= 170) & (src[..., :3].astype(np.int32).min(axis=2) < 150)
        speck = changed & outside & light
        f[speck] = src[speck]
    return Image.fromarray(f)


def shape_mask(bust, params, shape):
    """The inpaint mask for one shape.

    Most shapes only move the lips, so their mask is the mouth box clipped to the figure.
    Open shapes (JAW_SHAPES) must move the chin down, so theirs is the jaw box, unclipped:
    the jaw line can then spread into the background beside and below the chin.
    """
    jaw = params.get("jaw", 0)
    if shape == "blink":
        return mouth_mask(bust, params["eyes"])  # the same opaque-only box mask, over the eyes
    if jaw and shape in JAW_SHAPES:
        m = Image.new("L", bust.size, 0)
        x0, y0, x1, y1 = jaw_box(bust, params["mouth"], jaw)
        ImageDraw.Draw(m).rectangle([x0, y0, x1 - 1, y1 - 1], fill=255)
        return m
    return mouth_mask(bust, params["mouth"])


def visemes_inpaint(run, bust, args):
    if args.mouth:
        box = tuple(int(v) for v in args.mouth.split(","))
        how = "--mouth"
    else:
        box = suggest_mouth_box(bust)
        how = "guessed from lip colour"
        if not box:
            # No red/pink lips (most of the cast): show a labelled grid over the lower face
            # to read the mouth coordinates from, drawn with no mask.
            hx0, hy0, hx1, hy1 = head_box(bust, 48)
            grid = mouth_box_preview(run, bust, (hx0 + 12, hy0 + 12, hx1 - 12, hy1 - 6),
                                     "face_grid.png", outline=False)
            sys.exit(f"couldn't find the lips by colour. Read {grid} (pixel coordinates every 5px) "
                     "and pass --mouth x0,y0,x1,y1: the lips plus 3-4 rows "
                     "below them, the nostrils outside.")
    preview = mouth_box_preview(run, bust, box, jaw=jaw_box(bust, box, args.jaw) if args.jaw else None)
    print(f"mouth mask {box} ({how}), jaw mask {jaw_box(bust, box, args.jaw)} for {', '.join(JAW_SHAPES)}; "
          f"preview: {preview}\n"
          "  check: red = lips plus a row or two below, nostrils outside; "
          "orange = the chin and a few rows of neck below it.")
    shapes = args.shapes.split(",") if args.shapes else list(DEFAULT_SHAPES) + (["blink"] if args.eyes else [])
    unknown = [s for s in shapes if s not in MOUTH_SHAPES]
    if unknown:
        sys.exit(f"unknown shape(s) {unknown}; choose from {list(MOUTH_SHAPES)}")
    eyes = tuple(int(v) for v in args.eyes.split(",")) if args.eyes else None
    if "blink" in shapes:
        if not eyes:
            sys.exit("blink needs --eyes x0,y0,x1,y1: both eyes and their lids, eyebrows outside "
                     "(read the grid in visemes/face_grid.png or mouth_box_preview.png)")
        print(f"eyes mask {eyes}; preview: {mouth_box_preview(run, bust, eyes, 'eyes_box_preview.png')}\n"
              "  check: both eyes and lids inside, eyebrows and nose outside.")
    subject = args.subject or "the same character"
    drop = {k: max(1, round(v * args.drop * bust.width / 128)) for k, v in JAW_DROP.items()} if args.drop else {}
    params = {"mouth": list(box), "jaw": args.jaw, "drop": drop, "shapes": shapes,
              "eyes": list(eyes) if eyes else None, "subject": subject, "seed": args.seed}

    def body(shape):
        b = {"image": b64_image(drop_jaw(bust, params, shape)), "mask_image": b64_image(shape_mask(bust, params, shape).convert("RGB")),
             "description": f"{subject}, {MOUTH_SHAPES[shape]}. "
                            f"{EYES_KEEP if shape == 'blink' else MOUTH_KEEP}",
             "output_method": "Modify current layer", "no_background": False}
        if args.seed is not None:
            b["seed"] = args.seed
        return b

    if args.dry_run:
        return dry_run("/inpaint-image-pro-flash", body(shapes[0]), n=len(shapes),
                       note=f"one call per shape ({', '.join(shapes)}), ~6 generations each")
    api = PixelLab()
    vid = run.next_ids("visemes", "i", 1)[0]
    ids = {}
    for shape in shapes:  # 6 jobs fit in the 8 concurrent slots
        ids[shape] = api.post("/inpaint-image-pro-flash", body(shape))["background_job_id"]
    job = run.add_job(stage="visemes", variant=vid, endpoint="/inpaint-image-pro-flash",
                      job_id=",".join(ids.values()), job_ids=ids,
                      params=params)
    print(f"submitted {vid}: {len(ids)} inpaint jobs ({', '.join(shapes)})")
    collect(run, api, "visemes")
    report_stage(run, "talk")


def save_inpaint_visemes(run, api, job):
    """Wait for each shape's job; keep only its masked pixels, pasted onto the bust.

    Pro Flash preserves unmasked pixels already; the paste makes that a guarantee, so each
    saved frame is the bust everywhere outside that shape's own mask.
    """
    out = run.dir / "visemes" / job["variant"]
    out.mkdir(parents=True, exist_ok=True)
    bust = Image.open(run.dir / "bust" / f"{run.picked('bust')}.png").convert("RGBA")
    total, outputs, order = 0.0, [], []

    def one(item):
        shape, jid = item
        last, usage = api.wait_job(jid, f"{job['variant']}:{shape}")
        return shape, decode_image(find_images(last)[0]).convert("RGBA"), usage

    with concurrent.futures.ThreadPoolExecutor(MAX_PARALLEL) as pool:
        results = {s: (im, u) for s, im, u in pool.map(one, job["job_ids"].items())}
    for shape in job["params"]["shapes"]:
        im, usage = results[shape]
        if im.size != bust.size:
            raise RuntimeError(f"{shape} came back {im.size}, bust is {bust.size}")
        (out / "raw").mkdir(exist_ok=True)
        im.save(out / "raw" / f"{shape}.png")
        source = drop_jaw(bust, job["params"], shape)  # what was sent: the bust, chin moved for open shapes
        mask = shape_mask(bust, job["params"], shape)
        full = source.copy()
        mouth = None if shape == "blink" else job["params"]["mouth"]  # closing lids add light pixels
        full.paste(unwhiten(im, source, mask, mouth), (0, 0), mask)
        p = out / f"{shape}.png"
        full.save(p)
        outputs.append(str(p.relative_to(run.dir)))
        order.append(shape)
        total += (usage or {}).get("generations") or 0
    job["outputs"] = outputs
    job["viseme_order"] = ["rest"] + order
    record_usage(job, {"type": "generations", "generations": total})
    # A shape the model left (nearly) unchanged is a re-roll, and easy to miss by eye
    import numpy as np
    base = np.asarray(bust, dtype=np.int32)
    changed = {sh: int((np.abs(np.asarray(Image.open(run.dir / o).convert("RGBA"), dtype=np.int32)
                               - base).sum(axis=2) > 60).sum()) for sh, o in zip(order, outputs)}
    job["changed_pixels"] = changed
    same = [sh for sh, n in changed.items() if n < MIN_CHANGED_PIXELS]
    print(f"  {job['variant']} pixels changed per shape: {changed}")
    if same:
        print(f"  WARNING {job['variant']}: {', '.join(same)} barely differ from rest; re-roll with "
              f"--shapes {','.join(same)}")


def write_viseme_sheet(run, job, assets, backup, face=None, swaps=None, omit=None):
    """Install <name>_visemes.png (one row of mouth shapes) and <name>_visemes.json.

    'rest' is the bust itself. Each frame differs from the bust only inside its own mask
    (bigger for the open shapes, so the jaw can drop), so frames go in whole; --face pastes
    only that box instead. The engine reads the sheet through the NPC's "spriteVisemes"
    field (see docs/SPRITE_SYSTEM.md). swaps ("round=i02,teeth=i03")
    take single shapes from other inpaint variants, so one bad shape can be redone alone.
    """
    bust = Image.open(run.dir / "bust" / f"{run.picked('bust')}.png").convert("RGBA")
    if job.get("endpoint") != "/inpaint-image-pro-flash":
        sys.exit(f"{job['variant']} was made with {job.get('endpoint')}, which is no longer supported; "
                 f"run `visemes {run.name}` again")
    order = [Path(p).stem for p in job["outputs"]]
    order = ["rest"] + [s for s in MOUTH_SHAPES if s in order or (swaps and f"{s}=" in swaps)]
    order = [s for s in order if s not in (omit or "").split(",")]  # the game falls back to the nearest shape
    frames = {Path(p).stem: Image.open(run.dir / p).convert("RGBA") for p in job["outputs"]}
    sources = {s: job["variant"] for s in frames}
    for spec in filter(None, (swaps or "").split(",")):
        shape, _, other = spec.partition("=")
        oj = next((j for j in run.jobs("visemes", "completed") if j["variant"] == other), None)
        path = run.dir / "visemes" / other / f"{shape}.png"
        if not oj or not path.exists():
            sys.exit(f"--swap {spec}: no completed variant {other} with a '{shape}' shape")
        if oj.get("params", {}).get("mouth") != job["params"]["mouth"]:
            print(f"  warning: {other} used mouth mask {oj['params'].get('mouth')}, "
                  f"{job['variant']} used {job['params']['mouth']}")
        frames[shape] = Image.open(path).convert("RGBA")
        sources[shape] = other
    box = tuple(int(v) for v in face.split(",")) if face else tuple(job["params"]["mouth"])
    whole = not face  # each inpaint frame is already the bust outside its own mask
    if not whole:
        face_box_preview(run, bust, [f for n, f in frames.items() if n != "rest"], tuple(map(int, box)))
    size = bust.width
    sheet = Image.new("RGBA", (size * len(order), size), (0, 0, 0, 0))
    for i, name in enumerate(order):
        cell = bust.copy()
        if name != "rest" and name in frames:
            if whole:
                cell = frames[name]
            else:
                cell.paste(frames[name].crop(box), box[:2])  # hard paste, as build_talk_sheet does
        sheet.paste(cell, (i * size, 0))
    png = backup(assets / f"{run.name}_visemes.png")
    sheet.save(png)
    meta = backup(assets / f"{run.name}_visemes.json")
    params = {j["variant"]: j.get("params", {}) for j in run.jobs("visemes")}

    def how(shape):
        v = sources[shape]
        d = params[v].get("drop", {}).get(shape) if params[v].get("jaw") else None
        return f"{shape}:{v}" + (f" (chin -{d}px, jaw mask +{params[v]['jaw']} rows)" if d else "")
    source = (f"pixellab /inpaint-image-pro-flash, mouth mask {job['params']['mouth']}; "
              + ", ".join(how(s) for s in order if s in sources))
    meta.write_text(json.dumps({"frameSize": size, "visemes": order, "source": source},
                               indent=2) + "\n")
    print(f"{'whole inpaint frames' if whole else f'face box {tuple(map(int, box))}'}; wrote {png} ({len(order)} shapes: {', '.join(order)}) and {meta.name}")
    print(f'scenario NPC: "spriteVisemes": "assets/characters/{run.name}_visemes.png"  (keep spriteTalk as the fallback)')


# ------------------------------------------------------- stage 3: walk character

def character_request(run, args):
    """Web UI 'Create from Reference > Humanoid > Pro', styled on an existing character."""
    concept = Image.open(run.dir / "concept.png").convert("RGBA")
    body = {
        "description": run.state["description"],
        "image_size": {"width": args.size, "height": args.size},
        "method": "create_from_concept",
        "view": args.view,
        "template_id": "mannequin",
        "concept_image": b64_image(fit_square(concept, min(concept.width, 1024))),
        "style_character_id": args.style_character,
        "no_background": True,
    }
    # reference_image (max 168px) replaces the style character's south sprite as the centre
    # style image, so only send the bust when asked.
    if args.bust_reference:
        body["reference_image"] = b64_image(
            Image.open(run.dir / "bust" / f"{run.picked('bust')}.png").convert("RGBA"))
    if args.seed is not None:
        body["seed"] = args.seed
    return "/create-character-pro", body


def cmd_character(args):
    run = Run(args.name, args.workdir).require()
    api = PixelLab()
    if args.size is None:
        # The web UI auto-detects the style character's size; the API needs it explicitly and
        # fails if image_size is smaller than the style character's sprite content.
        style = api.get(f"/characters/{args.style_character}")
        args.size = max(style["size"]["width"], style["size"]["height"], 32)
        print(f"style character '{style['name'][:40]}' is {style['size']}, using size {args.size}")
    if args.dry_run:
        return dry_run(*character_request(run, args), n=args.variants,
                       note="create-character-pro typically costs 20-40 generations EACH")
    ids = run.next_ids("character", "c", args.variants)
    for i, vid in enumerate(ids):
        endpoint, body = character_request(run, args)
        if args.seed is not None:
            body["seed"] = args.seed + i
        resp = api.post(endpoint, body)
        run.add_job(stage="character", variant=vid, endpoint=endpoint,
                    job_id=resp["background_job_id"], character_id=resp["character_id"],
                    usage=resp.get("usage"),
                    params={"size": args.size, "view": args.view,
                            "style_character": args.style_character,
                            "bust_reference": args.bust_reference})
        print(f"submitted {vid}: character {resp['character_id']}")
    collect(run, api, "character")
    report_stage(run, "character")


def save_character(run, api, job):
    """Wait for the character row to be 'completed', then download its 8 rotations."""
    start = time.time()
    while True:
        ch = api.get(f"/characters/{job['character_id']}")
        if ch["status"] == "completed" and ch.get("rotation_urls"):
            break
        if ch["status"] == "failed":
            raise RuntimeError(f"character {job['character_id']} failed")
        if time.time() - start > POLL_TIMEOUT:
            raise TimeoutError("character still pending; run `collect` later")
        time.sleep(POLL_SECONDS)
    out = run.dir / "character" / job["variant"]
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for d in DIRECTIONS:
        url = ch["rotation_urls"].get(d) or ch["rotation_urls"].get(d.replace("-", "_"))
        if url:
            p = out / f"{d}.png"
            api.download(url).save(p)
            paths.append(str(p.relative_to(run.dir)))
    job["outputs"] = paths
    job["size"] = ch.get("size")


def character_contact(run):
    rows = []
    for j in run.jobs("character", "completed"):
        cells = [(Path(p).stem, Image.open(run.dir / p)) for p in j["outputs"]]
        rows.append((f"{j['variant']}  {j['character_id']}", cells))
    if not rows:
        return None
    cell = max(rows[0][1][0][1].size)
    return contact_sheet(rows, run.dir / "character/contact.png", cell=cell, scale=max(1, 256 // cell))


# ------------------------------------------ stage 4: standard animation set

# The house set (see .claude/skills/pixellab-character-animations): stock skeleton templates,
# 1 generation per direction. Frame counts are what the templates produce; the converter and
# npc-sprites.js animTypeMap expect exactly these six names.
STANDARD_ANIMATIONS = {
    "breathing-idle": 4,
    "walk": 6,
    "cross-punch": 6,
    "lead-jab": 3,
    "taking-punch": 6,
    "falling-back-death": 7,
}
ANIMATE_LOG_DIR = DEFAULT_WORKDIR / "_animate"


def resolve_character(target, workdir=None):
    """A pixellab.ai URL, a bare character id, or a pipeline run name with a picked character."""
    target = target.rstrip("/")
    if "/" in target:
        target = target.rsplit("/", 1)[1]
    if len(target) == 36 and target.count("-") == 4:
        return target
    run = Run(target, workdir).require()
    return run.picked("character")["character_id"]


def animation_inventory(character):
    """{template: {"dirs": set of directions present, "group": group id to extend}}.

    A template can be split across several groups (a backfill that forgot the group id);
    the directions are unioned, and new directions go into the largest group.
    """
    inv = {}
    for anim in character.get("animations") or []:
        tpl = anim.get("animation_type")
        dirs = {d["direction"] for d in anim.get("directions", [])}
        entry = inv.setdefault(tpl, {"dirs": set(), "group": None, "group_size": 0})
        entry["dirs"] |= dirs
        if len(dirs) > entry["group_size"]:
            entry["group"], entry["group_size"] = anim.get("animation_group_id"), len(dirs)
    return inv


def missing_animations(character, templates):
    inv = animation_inventory(character)
    dirs = DIRECTIONS if character.get("directions", 8) == 8 else ["south", "east", "north", "west"]
    missing = [(tpl, d) for tpl in templates for d in dirs if d not in inv.get(tpl, {}).get("dirs", set())]
    return missing, {tpl: inv[tpl]["group"] for tpl in inv}


def cmd_animate(args):
    """Bring a character up to the standard set, filling only the gaps.

    The account has 8 job slots, so jobs are fed in as slots free up; each template's
    directions go into one animation group; failed directions are retried; and job ids
    in flight are logged so a killed run can be resumed without paying twice.
    """
    cid = resolve_character(args.target, args.workdir)
    api = PixelLab()
    character = api.get(f"/characters/{cid}")
    if character["status"] != "completed":
        sys.exit(f"character {cid} is {character['status']}; wait for it to finish first")
    templates = args.templates.split(",") if args.templates else list(STANDARD_ANIMATIONS)
    log_path = ANIMATE_LOG_DIR / f"{cid}.json"
    inflight = json.loads(log_path.read_text()) if log_path.exists() else {}
    if inflight:
        print(f"resuming: {len(inflight)} job(s) from a previous run are still being tracked")

    missing, groups = missing_animations(character, templates)
    # Don't resubmit what a previous run already has in flight.
    queued = {(j["template"], j["direction"]) for j in inflight.values()}
    queue = [m for m in missing if m not in queued]
    print(f"{character['name'][:50]} ({cid}): {character.get('animation_count')} animations, "
          f"{len(missing)} standard direction(s) missing")
    for tpl in templates:
        gaps = [d for t, d in missing if t == tpl]
        if gaps:
            print(f"  {tpl}: missing {gaps}" + (f" (extend group {groups[tpl][:8]})" if groups.get(tpl) else " (new group)"))
    if not missing and not inflight:
        print("nothing to do: the standard set is complete")
        return
    print(f"cost: about {len(queue)} generation(s) (1 per direction, template mode)")
    if args.dry_run:
        return

    ANIMATE_LOG_DIR.mkdir(parents=True, exist_ok=True)
    attempts = {}
    failures = []

    def save_log():
        if inflight:
            log_path.write_text(json.dumps(inflight, indent=2))
        elif log_path.exists():
            log_path.unlink()

    while queue or inflight:
        free = args.slots - len(inflight)
        if queue and free > 0:
            tpl = queue[0][0]
            batch = [m for m in queue if m[0] == tpl][:free]
            body = {"character_id": cid, "template_animation_id": tpl, "mode": "template",
                    "directions": [d for _, d in batch]}
            # Never send action_description: it switches to v3 custom animation (off-model, dearer).
            if groups.get(tpl):
                body["animation_group_id"] = groups[tpl]
            try:
                resp = api.post("/characters/animations", body)
            except RuntimeError as e:
                msg = str(e)
                if "409" in msg:  # direction already in the group: someone else filled it
                    print(f"  {tpl} {body['directions']}: already present, skipping")
                    queue = [m for m in queue if m not in batch]
                    continue
                if "slot" in msg.lower() or "429" in msg:
                    print(f"  no free job slots ({msg[:120]}); waiting")
                    time.sleep(20)
                    continue
                raise
            groups[tpl] = resp.get("animation_group_id") or groups.get(tpl)
            for job_id, d in zip(resp["background_job_ids"], resp["directions"]):
                inflight[job_id] = {"template": tpl, "direction": d}
            queue = [m for m in queue if m not in batch]
            save_log()
            print(f"  submitted {tpl} {resp['directions']} -> group {str(groups[tpl])[:8]}")
            continue

        time.sleep(POLL_SECONDS)
        for job_id, info in list(inflight.items()):
            try:
                status = api.get(f"/background-jobs/{job_id}").get("status")
            except RuntimeError as e:
                if "404" not in str(e):
                    raise
                status = "completed"  # finished jobs get cleaned up; verification below catches gaps
            if status in ("completed", "failed"):
                del inflight[job_id]
                key = (info["template"], info["direction"])
                if status == "failed":
                    attempts[key] = attempts.get(key, 0) + 1
                    if attempts[key] <= args.retries:
                        print(f"  {key[0]}({key[1]}) failed, retry {attempts[key]}/{args.retries}")
                        queue.append(key)
                    else:
                        failures.append(key)
                else:
                    print(f"  done {key[0]}({key[1]})")
        save_log()

    # Heavy-load failures can come back short without a failed status, so check the character.
    character = api.get(f"/characters/{cid}")
    still, _ = missing_animations(character, templates)
    print(f"\nverified: {character.get('animation_count')} animations; "
          f"{'standard set complete' if not still else f'still missing {still}'}")
    if still:
        print(f"rerun `animate {args.target}` to backfill them")
    if failures:
        print(f"gave up after {args.retries} retries on: {failures}")


# ----------------------------------------------- stage 5: import into the game

IMPORT_MANIFEST = REPO / "tools/pixellab_characters.json"
GAME_JS = REPO / "public/break_escape/js/core/game.js"
REGISTER_MARKER = "    // PixelLab API imports (tools/pixellab_pipeline.py import --register)"


def register_atlas(key):
    """Add a this.load.atlas() line for key to game.js preload, once."""
    src = GAME_JS.read_text()
    if f"this.load.atlas('{key}'," in src:
        return False
    entry = (f"    this.load.atlas('{key}',\n"
             f"        `characters/{key}.png?v=${{ASSETS_VERSION}}`,\n"
             f"        `characters/{key}.json?v=${{ASSETS_VERSION}}`);\n")
    if REGISTER_MARKER not in src:
        # Start the section after the last hand-written character atlas.
        anchor = src.rindex("this.load.atlas('male_")
        end = src.index(";\n", anchor) + 2
        src = src[:end] + "\n" + REGISTER_MARKER + "\n" + src[end:]
    start = src.index(REGISTER_MARKER) + len(REGISTER_MARKER) + 1
    # Append after the last entry already in the section.
    pos = start
    while src.startswith("    this.load.atlas(", pos):
        pos = src.index(";\n", pos) + 2
    GAME_JS.write_text(src[:pos] + entry + src[pos:])
    return True


def canonicalise_animation_folders(root, character, api):
    """Rename ZIP animation folders to their template ids (walk, cross-punch, ...).

    The ZIP names folders after the animation's display name, which for web-UI-created
    animations can be 'walking', 'jab_attack' or even 'animating'. The engine's animTypeMap
    only knows the template ids, so a wrongly named folder means an NPC that never animates.
    The ZIP carries no animation ids, so match each folder to an API animation by comparing
    one frame's pixels with the frame the API serves for that animation.
    """
    import numpy as np
    anim_root = root / "animations"
    folders = {f.name: f for f in anim_root.iterdir() if f.is_dir()}
    mapping = {}
    for anim in character.get("animations") or []:
        tpl = anim.get("animation_type")
        d = anim["directions"][0]
        ref = np.asarray(api.download(d["frames"][0]), dtype=np.int16)
        for name, folder in folders.items():
            cand = folder / d["direction"] / "frame_000.png"
            if name in mapping or not cand.exists():
                continue
            img = np.asarray(Image.open(cand).convert("RGBA"), dtype=np.int16)
            if img.shape == ref.shape and np.abs(img - ref).max() <= 2:
                mapping[name] = tpl
                break
    unknown = [n for n in folders if n not in mapping]
    if unknown:
        sys.exit(f"could not match ZIP animation folder(s) {unknown} to an API animation; "
                 "inspect the export by hand")
    for name, tpl in mapping.items():
        src = folders[name]
        dest = anim_root / f"_{tpl}"
        if not dest.exists():
            src.rename(dest)
        else:
            # A template split across groups: merge directions the first folder lacks.
            for dir_dir in src.iterdir():
                if not (dest / dir_dir.name).exists():
                    dir_dir.rename(dest / dir_dir.name)
            shutil.rmtree(src)
    for tmp in anim_root.iterdir():
        tmp.rename(anim_root / tmp.name.lstrip("_"))
    renamed = {k: v for k, v in mapping.items() if k.replace("_", "-").lower() != v}
    if renamed:
        print(f"renamed animation folders to template ids: {renamed}")


OVERRIDES_DIR = REPO / "tools/pixellab_overrides"
QA_DIR = DEFAULT_WORKDIR / "_qa"
MIRROR_DIRECTION = {"east": "west", "west": "east", "north-east": "north-west",
                    "north-west": "north-east", "south-east": "south-west",
                    "south-west": "south-east", "north": "north", "south": "south"}


def apply_overrides(key, root):
    """Copy committed frame fixes (tools/pixellab_overrides/<key>/...) over a fresh export."""
    src = OVERRIDES_DIR / key
    if not src.exists():
        return 0
    n = 0
    for f in src.rglob("*.png"):
        rel = f.relative_to(src)  # <template>/<direction>/frame_NNN.png
        dest = root / "animations" / rel
        if dest.parent.exists():
            shutil.copy(f, dest)
            n += 1
    print(f"applied {n} frame override(s) from {src.relative_to(REPO)}")
    return n


def export_root_for(key):
    export_dir = DEFAULT_WORKDIR / "_export" / key
    if not export_dir.exists():
        sys.exit(f"no export for {key}; run `import <character> --key {key}` first")
    if (export_dir / ".state_folder").exists():
        return export_dir / (export_dir / ".state_folder").read_text().strip()
    return next(p for p in [export_dir, *sorted(export_dir.iterdir())] if (p / "animations").is_dir())


def cmd_qa(args):
    """Contact sheets of every animation, with heuristic hints, for visual review."""
    sys.path.insert(0, str(REPO / "tools"))
    from pixellab_frame_qa import analyse, contact_sheets
    root = export_root_for(args.key)
    report = analyse(root)
    out = QA_DIR / args.key
    sheets = contact_sheets(report, out)
    (out / "report.json").write_text(json.dumps(report, indent=1))
    hints = [(s["animation"], s["direction"], "strip", s["flags"]) for s in report["strips"] if s["flags"]]
    hints += [(s["animation"], s["direction"], f["frame"], f["flags"])
              for s in report["strips"] for f in s["frames"] if f["flags"]]
    print(f"{len(hints)} hint(s) (heuristic; confirm on the sheets):")
    for h in hints:
        print("  ", *h)
    print("contact sheets (review ALL of them, flagged or not):")
    for p in sheets:
        print("  ", p)


def cmd_fix(args):
    """Patch frames without re-rolling the direction; the patch survives re-imports."""
    root = export_root_for(args.key)
    strip = root / "animations" / args.animation / args.direction
    if not strip.exists():
        sys.exit(f"no strip {strip}")
    frames = sorted(strip.glob("*.png"))
    idx = range(len(frames)) if args.frames == "all" else [int(v) for v in args.frames.split(",")]
    method, _, arg = args.use.partition(":")
    new = {}
    if method == "mirror":
        # Same frame index from the opposite side, flipped: exact pose, free. For north and
        # south this flips the frame itself (the other leg forward), which suits walk cycles.
        other = root / "animations" / args.animation / MIRROR_DIRECTION[args.direction]
        for i in idx:
            new[i] = Image.open(other / frames[i].name).convert("RGBA").transpose(Image.FLIP_LEFT_RIGHT)
    elif method == "frame":
        for i in idx:
            new[i] = Image.open(frames[int(arg)]).convert("RGBA")
    elif method == "file":
        if len(idx) != 1:
            sys.exit("file: replaces exactly one frame")
        new[idx[0]] = Image.open(arg).convert("RGBA")
    elif method == "ai":
        new = ai_edit_frames(root, args, frames, list(idx))
        if new is None:
            return
    else:
        sys.exit("--use takes mirror, frame:N, file:PATH or ai")

    out_dir = OVERRIDES_DIR / args.key / args.animation / args.direction
    out_dir.mkdir(parents=True, exist_ok=True)
    before_after = []
    for i, im in new.items():
        before_after.append((f"f{i:02d} before", Image.open(frames[i]).convert("RGBA")))
        before_after.append((f"f{i:02d} after", im))
        im.save(out_dir / frames[i].name)
        shutil.copy(out_dir / frames[i].name, frames[i])
    (QA_DIR / args.key).mkdir(parents=True, exist_ok=True)
    sheet = contact_sheet([(f"{args.key} {args.animation} {args.direction} ({args.use})", before_after)],
                          QA_DIR / args.key / f"fix_{args.animation}_{args.direction}.png",
                          cell=max(im.size), scale=3)
    print(f"wrote {len(new)} override(s) to {out_dir.relative_to(REPO)}")
    print(f"before/after: {sheet}")
    print(f"rebuild the atlas: pixellab_pipeline.py import {args.key} --offline --force")


def cmd_reroll(args):
    """Regenerate one direction of a template animation as trial takes, keep the best as overrides.

    Non-destructive: each take is generated in its own temporary animation group, its frames
    are downloaded, then that temporary group is deleted. The character's original animation
    is never modified. `--accept tNN` installs a take through the same override mechanism as
    `fix`, so re-imports keep it. Several takes help because a re-roll often repeats the error.
    """
    root = export_root_for(args.key)
    strip = root / "animations" / args.animation / args.direction
    trial_dir = QA_DIR / args.key / "reroll" / f"{args.animation}_{args.direction}"
    if args.accept:
        take = trial_dir / args.accept
        if not take.exists():
            sys.exit(f"no take {take}")
        out_dir = OVERRIDES_DIR / args.key / args.animation / args.direction
        out_dir.mkdir(parents=True, exist_ok=True)
        current = sorted(strip.glob("*.png"))
        new = sorted(take.glob("*.png"))
        if len(new) != len(current):
            print(f"note: take has {len(new)} frames, current strip {len(current)}")
        for old in current:
            old.unlink()
        for f in new:
            shutil.copy(f, out_dir / f.name)
            shutil.copy(f, strip / f.name)
        print(f"installed {args.accept} as {len(new)} override frame(s) in {out_dir.relative_to(REPO)}")
        print(f"rebuild the atlas: pixellab_pipeline.py import {args.key} --offline --force")
        return

    manifest = json.loads(IMPORT_MANIFEST.read_text())
    cid = manifest[args.key]["character_id"]
    if args.dry_run:
        print(f"would generate {args.tries} take(s) of {args.animation} {args.direction} "
              f"on {cid}: about {args.tries} generation(s)")
        return
    api = PixelLab()
    existing = sorted(p.name for p in trial_dir.glob("t*")) if trial_dir.exists() else []
    start = int(existing[-1][1:]) + 1 if existing else 1
    for n in range(start, start + args.tries):
        resp = api.post("/characters/animations", {
            "character_id": cid, "template_animation_id": args.animation, "mode": "template",
            "directions": [args.direction]})
        group = resp["animation_group_id"]
        try:
            for job_id in resp["background_job_ids"]:
                api.wait_job(job_id, f"t{n:02d}")
            character = api.get(f"/characters/{cid}")
            anim = next(a for a in character["animations"] if a.get("animation_group_id") == group)
            urls = next(d["frames"] for d in anim["directions"] if d["direction"] == args.direction)
            out = trial_dir / f"t{n:02d}"
            out.mkdir(parents=True, exist_ok=True)
            for i, url in enumerate(urls):
                api.download(url).save(out / f"frame_{i:03d}.png")
            print(f"t{n:02d}: {len(urls)} frames")
        finally:
            # The take lives on locally; remove the temporary group so the character stays clean.
            api._call("DELETE", f"/characters/{cid}/animations",
                      params={"animation_group_id": group, "direction": args.direction})
    rot = Image.open(root / "rotations" / f"{args.direction}.png").convert("RGBA")
    rows = [("current", [("rot", rot)] + [(p.stem[-3:], Image.open(p).convert("RGBA"))
                                          for p in sorted(strip.glob("*.png"))])]
    for take in sorted(trial_dir.glob("t*")):
        rows.append((take.name, [("rot", rot)] + [(p.stem[-3:], Image.open(p).convert("RGBA"))
                                                  for p in sorted(take.glob("*.png"))]))
    size = max(max(im.size) for _, cells in rows for _, im in cells)
    sheet = contact_sheet(rows, trial_dir / "contact.png", cell=size, scale=3)
    print(f"compare: {sheet}")
    print(f"keep one: pixellab_pipeline.py reroll {args.key} {args.animation} {args.direction} --accept tNN")


def ai_edit_frames(root, args, frames, idx):
    """Redraw frames with /edit-images-v2, keeping their poses.

    edit_with_reference (default) uses the rotation for this direction as the reference,
    which pulls colours and proportions back on-model. edit_with_text follows --prompt.
    """
    size = Image.open(frames[0]).size
    images = [Image.open(frames[i]).convert("RGBA") for i in idx]
    body = {"edit_images": [{"image": b64_image(im), "width": im.width, "height": im.height} for im in images],
            "image_size": {"width": max(32, size[0]), "height": max(32, size[1])},
            "no_background": True}
    if args.prompt:
        body.update(method="edit_with_text", description=args.prompt)
    else:
        ref = Image.open(root / "rotations" / f"{args.direction}.png").convert("RGBA")
        body.update(method="edit_with_reference",
                    reference_image={"image": b64_image(ref), "width": ref.width, "height": ref.height})
    if args.dry_run:
        dry_run("/edit-images-v2", body)
        return None
    api = PixelLab()
    resp = api.post("/edit-images-v2", body)
    last, usage = api.wait_job(resp["background_job_id"], "edit")
    print(f"edit usage: {usage or resp.get('usage')}")
    out = [decode_image(x) for x in find_images(last)]
    if len(out) < len(idx):
        sys.exit(f"edit returned {len(out)} image(s) for {len(idx)} frame(s)")
    return {i: (im if im.size == size else fit_square(im, size[0])) for i, im in zip(idx, out)}


def cmd_import(args):
    """Download a character's ZIP from the API and convert it into a game atlas."""
    sys.path.insert(0, str(REPO / "tools"))
    import zipfile

    manifest = json.loads(IMPORT_MANIFEST.read_text()) if IMPORT_MANIFEST.exists() else {}
    if args.target in manifest:  # an already-imported key
        args.key = args.key or args.target
        args.idle_from = args.idle_from or manifest[args.target].get("idle_from")
        args.target = manifest[args.target]["character_id"]
    cid = resolve_character(args.target, args.workdir)
    api = PixelLab()
    character = api.get(f"/characters/{cid}")
    # --idle-from: breathing-idle comes from another state of the same character (e.g. a
    # "hands in pockets" state), every other animation from this one.
    idle_cid = resolve_character(args.idle_from, args.workdir) if args.idle_from else None
    idle_char = api.get(f"/characters/{idle_cid}") if idle_cid else None
    if idle_char and "breathing-idle" not in animation_inventory(idle_char):
        # A web-UI custom animation ("custom-<prompt>") named "Breathing Idle" stands in for
        # the template, e.g. female_hacker_hood_down_v2's hands-in-pockets state.
        for anim in idle_char.get("animations") or []:
            if (anim.get("display_name") or "").strip().lower().replace("_", " ") == "breathing idle":
                anim["animation_type"] = "breathing-idle"
    templates =[t for t in STANDARD_ANIMATIONS if not (idle_cid and t == "breathing-idle")]
    missing, _ = missing_animations(character, templates)
    if idle_char:
        missing += [f"{idle_cid[:8]}:{m}" for m in missing_animations(idle_char, ["breathing-idle"])[0]]
    if missing and not args.allow_incomplete:
        sys.exit(f"{len(missing)} standard direction(s) missing: {missing[:6]}...\n"
                 f"run `animate {args.target}` first, or pass --allow-incomplete")
    key = args.key or (None if len(args.target) == 36 else args.target)
    if not key:
        sys.exit("give --key (the spriteSheet name the scenario will use)")
    if args.offline:
        # Rebuild from the last download, e.g. after `fix`. Overrides are reapplied.
        root = export_root_for(key)
        apply_overrides(key, root)
        return convert_and_record(args, key, cid, character, DEFAULT_WORKDIR / "_export" / key)

    export_dir = DEFAULT_WORKDIR / "_export" / key
    shutil.rmtree(export_dir, ignore_errors=True)
    export_dir.mkdir(parents=True)
    r = api.session.get(f"{API}/characters/{cid}/zip", timeout=600)
    if not r.ok:
        sys.exit(f"ZIP export failed: {r.status_code} {r.text[:300]}")
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        z.extractall(export_dir)
    print(f"downloaded {len(r.content) // 1024} KB for {character['name'][:50]}")
    root = state_folder(export_dir, cid)
    (export_dir / ".state_folder").write_text(root.name)  # read by the converter and `qa`
    canonicalise_animation_folders(root, character, api)
    if idle_char:
        take_idle_from_state(root, state_folder(export_dir, idle_cid, idle_char, api), idle_char, api)
    apply_overrides(key, root)

    return convert_and_record(args, key, cid, character, export_dir)


def state_folder(export_dir, cid, character=None, api=None):
    """The folder holding one state's frames. A character's ZIP carries every state in its
    group (one folder each, listed in metadata.json); fall back to the first folder with
    animations for older single-state exports."""
    meta = export_dir / "metadata.json"
    if meta.exists():
        for st in json.loads(meta.read_text()).get("states", []):
            if st["character"]["id"] == cid:
                return export_dir / st["folder"]
    if character is not None:
        # A state from another group: download its own ZIP beside the main export.
        sub = export_dir / f"_state_{cid[:8]}"
        r = api.session.get(f"{API}/characters/{cid}/zip", timeout=600)
        if not r.ok:
            sys.exit(f"ZIP export of {cid} failed: {r.status_code} {r.text[:300]}")
        import zipfile
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            z.extractall(sub)
        return state_folder(sub, cid)
    return next(p for p in [export_dir, *sorted(export_dir.iterdir())] if (p / "animations").is_dir())


def take_idle_from_state(root, idle_root, idle_char, api):
    """Replace root's breathing-idle with the one from another state's folder."""
    canonicalise_animation_folders(idle_root, idle_char, api)
    src = idle_root / "animations" / "breathing-idle"
    if not src.is_dir():
        sys.exit(f"state {idle_char['id']} has no breathing-idle animation; animate it first")
    dest = root / "animations" / "breathing-idle"
    shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(src, dest)
    print(f"breathing-idle taken from state '{idle_char.get('state_name') or idle_char['id'][:8]}'")


def convert_and_record(args, key, cid, character, export_dir):
    from convert_pixellab_to_spritesheet import process_character
    assets = Path(args.assets_dir)
    for suffix in (".png", ".json", "_headshot.png"):
        existing = assets / f"{key}{suffix}"
        if existing.exists() and not args.force:
            sys.exit(f"{existing} exists; pass --force to replace it (the old files are backed up)")
        if existing.exists():
            keep = DEFAULT_WORKDIR / "_export" / "replaced" / f"{datetime.now():%Y%m%d-%H%M%S}-{existing.name}"
            keep.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(existing, keep)
    if not process_character(export_dir, assets, key=key):
        sys.exit("conversion failed")

    manifest = json.loads(IMPORT_MANIFEST.read_text()) if IMPORT_MANIFEST.exists() else {}
    manifest[key] = {"character_id": cid, "name": character["name"],
                     "size": character.get("size"),
                     "imported": datetime.now(timezone.utc).date().isoformat()}
    if getattr(args, "idle_from", None):
        manifest[key]["idle_from"] = resolve_character(args.idle_from, args.workdir)
    IMPORT_MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")
    print(f"recorded {key} -> {cid} in {IMPORT_MANIFEST.relative_to(REPO)}")
    if args.register:
        print("registered in game.js" if register_atlas(key) else "already registered in game.js")
    else:
        print(f"not registered: add it to game.js preload with --register, or by hand")
    print(f'scenario: "spriteSheet": "{key}"')


# ------------------------------------------------------------ polling / collect

def collect(run, api, stage=None):
    """Wait for every submitted (not yet collected) async job and save its outputs.

    Safe to rerun: jobs already completed or failed are skipped, so a killed run can be
    finished without paying for the generations again.
    """
    pending = [j for j in run.state["jobs"] if j["status"] == "submitted" and j.get("job_id")
               and (stage is None or j["stage"] == stage)]

    def one(job):
        try:
            if job.get("endpoint") == "/inpaint-image-pro-flash":
                save_inpaint_visemes(run, api, job)
            else:
                last, usage = api.wait_job(job["job_id"], job["variant"])
                record_usage(job, usage)
                if job["stage"] == "talk":
                    save_talk_frames(run, job, last)
                elif job["stage"] == "character":
                    save_character(run, api, job)
            job["status"] = "completed"
        except Exception as e:
            job.update(status="failed", error=str(e))
            print(f"  {job['variant']} FAILED: {e}")

    if pending:
        with concurrent.futures.ThreadPoolExecutor(min(len(pending), MAX_PARALLEL)) as pool:
            list(pool.map(one, pending))
        run.save()


def cmd_collect(args):
    run = Run(args.name, args.workdir).require()
    collect(run, PixelLab())
    for stage in ("bust", "talk", "character"):
        if run.jobs(stage) or (stage == "talk" and run.jobs("visemes")):
            report_stage(run, stage)


# ------------------------------------------------------------------------ pick

def resolve_frame(run, spec, default_variant):
    """'5' -> talk/<default>/f05.png;  't02:3' -> talk/t02/f03.png;  'i01:round' -> visemes/i01/round.png"""
    variant, _, frame = spec.rpartition(":")
    variant = variant or default_variant
    folder = run.dir / ("visemes" if variant[:1] == "i" else "talk") / variant
    path = folder / (f"f{int(frame):02d}.png" if frame.isdigit() else f"{frame}.png")
    if not path.exists():
        sys.exit(f"no frame {spec} ({path})")
    return path


def cmd_pick(args):
    run = Run(args.name, args.workdir).require()
    stage, vid = args.stage, args.variant
    job = next((j for j in run.jobs(stage, "completed") if j["variant"] == vid), None)
    if job is None:
        sys.exit(f"{vid} is not a completed {stage} variant. Completed: "
                 f"{[j['variant'] for j in run.jobs(stage, 'completed')]}")
    assets = Path(args.assets_dir)
    assets.mkdir(parents=True, exist_ok=True)

    def backup(dest):
        """Never silently replace a game asset: keep the old one in the work dir."""
        if dest.exists():
            keep = run.dir / "replaced" / f"{datetime.now():%Y%m%d-%H%M%S}-{dest.name}"
            keep.parent.mkdir(exist_ok=True)
            shutil.copy(dest, keep)
            print(f"existing {dest.name} backed up to {keep}")
        return dest

    if stage == "bust":
        dest = backup(assets / f"{run.name}_talk_init.png")
        shutil.copy(run.dir / job["outputs"][0], dest)
        run.state["picks"]["bust"] = vid
        print(f"bust {vid} -> {dest}")
        print(f"next: pixellab_pipeline.py talk {run.name} --variants 2")

    elif stage == "talk":
        bust = run.dir / "bust" / f"{run.picked('bust')}.png"
        dest = backup(assets / f"{run.name}_talk.png")
        cmd = [sys.executable, str(TALK_SCRIPTS / "build_talk_sheet.py"),
               "--base", str(bust), "--out", str(dest)]
        if args.frames:
            specs = args.frames.split(",")
            if len(specs) != 3:
                sys.exit("--frames takes exactly three open-mouth frames, e.g. 3,5,7 or t01:3,t02:5,i01:round")
            cmd += ["--frames", *[str(resolve_frame(run, s, vid)) for s in specs], "--pick", "1,2,3"]
        else:
            # Let build_talk_sheet choose the three most distinct mouths. f00 is the model's
            # copy of the first frame, so leave it out of the candidates.
            cmd += ["--frames", *[str(run.dir / p) for p in job["outputs"][1:]]]
        face = args.face
        if not face:
            used = ([resolve_frame(run, sp, vid) for sp in args.frames.split(",")] if args.frames
                    else [run.dir / p for p in job["outputs"][1:]])
            box = mouth_face_box([Image.open(p).convert("RGBA") for p in used])
            face = ",".join(map(str, box)) if box else None
        if face:
            box = tuple(int(v) for v in face.split(","))
            face_box_preview(run, Image.open(bust).convert("RGBA"),
                             [Image.open(p).convert("RGBA") for p in (
                                 [resolve_frame(run, sp, vid) for sp in args.frames.split(",")]
                                 if args.frames else [run.dir / q for q in job["outputs"][1:]])], box)
            cmd += ["--face", face]
        if args.mouth:
            cmd += ["--mouth", args.mouth]
        subprocess.run(cmd, check=True)
        check = subprocess.run([sys.executable, str(TALK_SCRIPTS / "check_talk_sheet.py"), str(dest)])
        run.state["picks"]["talk"] = {"variant": vid, "frames": args.frames or "auto",
                                      "check": "pass" if check.returncode == 0 else "warnings"}
        if check.returncode:
            print("check_talk_sheet reported warnings. Look at the sheet: small collar drift is often "
                  "invisible in game; otherwise re-pick other frames or pass a tighter --face box.")
        print(f"next: pixellab_pipeline.py character {run.name} --variants 1")

    elif stage == "visemes":
        write_viseme_sheet(run, job, assets, backup, args.face, args.swap, args.omit)
        run.state["picks"]["visemes"] = " ".join(filter(None, [vid, args.swap and f"swap {args.swap}",
                                                               args.omit and f"omit {args.omit}"]))

    elif stage == "character":
        run.state["picks"]["character"] = {"variant": vid, "character_id": job["character_id"]}
        others = [j["character_id"] for j in run.jobs("character", "completed") if j["variant"] != vid]
        print(f"picked character {job['character_id']}  https://www.pixellab.ai/create-character/{job['character_id']}")
        if others:
            print(f"unpicked characters still in the PixelLab account (delete by hand if unwanted): {others}")
        print("next: pixellab-character-animations skill (six templates x 8 directions), then "
              "export and tools/convert_pixellab_to_spritesheet.py")
    run.save()


# ----------------------------------------------------------------- reporting

CONTACT = {"bust": bust_contact, "talk": talk_contact, "character": character_contact}


def report_stage(run, stage):
    jobs = run.jobs(stage) + (run.jobs("visemes") if stage == "talk" else [])
    done = [j["variant"] for j in jobs if j["status"] == "completed"]
    failed = [(j["variant"], j.get("error", "")[:120]) for j in jobs if j["status"] == "failed"]
    pending = [j["variant"] for j in jobs if j["status"] == "submitted"]
    print(f"\n[{stage}] completed: {done or '-'}")
    for vid, err in failed:
        print(f"[{stage}] FAILED {vid}: {err}")
    if pending:
        print(f"[{stage}] still pending: {pending}  (run `collect {run.name}`)")
    print(f"[{stage}] generations charged so far: {total_usage(jobs):g}")
    sheet = CONTACT[stage](run) if done else None
    if sheet:
        print(f"[{stage}] contact sheet: {sheet}")
        print(f"[{stage}] choose with: pixellab_pipeline.py pick {run.name} {stage} <id>")


def cmd_status(args):
    run = Run(args.name, args.workdir).require()
    s = run.state
    print(f"{run.name}  ({run.dir})\npicks: {json.dumps(s['picks'])}")
    for stage in ("bust", "talk", "visemes", "character"):
        js = run.jobs(stage)
        if js:
            print(f"  {stage}: " + ", ".join(f"{j['variant']}={j['status']}" for j in js))
    print(f"generations charged: {total_usage(s['jobs']):g}")
    nxt = ("bust" if "bust" not in s["picks"] else
           "talk" if "talk" not in s["picks"] else
           "character" if "character" not in s["picks"] else None)
    print(f"next stage: {nxt or 'done - hand over to pixellab-character-animations'}")


def cmd_balance(args):
    b = PixelLab().get("/balance")
    sub, cred = b.get("subscription") or {}, b.get("credits") or {}
    print(f"generations: {sub.get('generations')}/{sub.get('total')} ({sub.get('plan')}), credits: ${cred.get('usd')}")


def dry_run(endpoint, body, n=1, note=None):
    def redact(v):
        if isinstance(v, dict) and "base64" in v:
            return f"<png {len(v['base64'])} b64 chars>"
        if isinstance(v, dict):
            return {k: redact(x) for k, x in v.items()}
        if isinstance(v, list):
            return [redact(x) for x in v]
        return v
    print(f"DRY RUN: {n} x POST {endpoint}")
    print(json.dumps(redact(body), indent=2))
    if note:
        print(note)


# ------------------------------------------------------------------------ CLI

def main():
    sys.stdout.reconfigure(line_buffering=True)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--workdir", help=f"parent of per-character work dirs (default {DEFAULT_WORKDIR})")
    ap.add_argument("--assets-dir", default=str(CHARACTERS_DIR),
                    help="where `pick` installs <name>_talk_init.png and <name>_talk.png (default the game's characters dir)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def paid(p, variants):
        p.add_argument("name", help="character file stem, e.g. nurse_kim")
        p.add_argument("--variants", type=int, default=variants, help=f"alternatives to generate (default {variants})")
        p.add_argument("--seed", type=int, help="base seed; variant i uses seed+i (default random)")
        p.add_argument("--dry-run", action="store_true", help="print the request, send nothing")
        return p

    p = sub.add_parser("init", help="start a run from a reframed Gemini portrait")
    p.add_argument("name")
    p.add_argument("--concept", help="<name>_nonpixelart.png after reframe_portrait.py")
    p.add_argument("--bust", help="alone: adopt an existing bust or 2x2 talk sheet (lip sync only); "
                                  "with --concept: add an existing bust as candidate b00")
    p.add_argument("--prompt-file", help="the exact Gemini prompt (default: <concept stem>_prompt.txt beside it)")
    p.add_argument("--prompt", help="the Gemini prompt inline (instead of --prompt-file)")
    p.add_argument("--description", help="walk-character description (default: first two prompt lines)")
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=cmd_init)

    p = paid(sub.add_parser("bust", help="stage 1: pixel-art dialogue bust candidates"), 4)
    p.add_argument("--engine", choices=["pixflux", "pixelart"], default="pixflux",
                   help="pixflux = web 'Image to image' with prompt (default); pixelart = 'Image to pixel art', no prompt")
    p.add_argument("--size", type=int, default=128)
    p.add_argument("--strength", type=int, default=250, help="init_image_strength, 1-999 (default 250)")
    p.add_argument("--guidance", type=float, default=8.0, help="text_guidance_scale, 1-20 (default 8)")
    p.add_argument("--faithful", action="store_true", help="pixelart engine only: fixer/faithful mode")
    p.set_defaults(func=cmd_bust)

    p = paid(sub.add_parser("talk", help="stage 2: mouth animation candidates from the picked bust"), 2)
    p.add_argument("--frames", type=int, default=8, help="frames per variant, even, 4-16 (default 8)")
    p.add_argument("--action", default=DEFAULT_TALK_ACTION)
    p.set_defaults(func=cmd_talk)

    p = sub.add_parser("visemes", help="stage 2 alternative: named mouth shapes for lip sync "
                                        "(inpainted, ~6 generations per shape)")
    p.add_argument("name")
    p.add_argument("--mouth", help="x0,y0,x1,y1 mouth mask on the bust (default: guessed from "
                                   "lip colour). Check visemes/mouth_box_preview.png")
    p.add_argument("--jaw", type=int, default=5,
                   help="rows below the mouth box that open shapes may redraw so the chin can "
                        "drop (default 5; 0 = lips only)")
    p.add_argument("--drop", type=float, default=1.0,
                   help=f"scale for how far the chin is moved down before open shapes are drawn "
                        f"({', '.join(f'{k} {v}px' for k, v in JAW_DROP.items())} at 128px; 0 = don't move it)")
    p.add_argument("--eyes", help="x0,y0,x1,y1 over both eyes; adds a 'blink' frame (eyes shut) "
                                  "that the portrait shows every few seconds while the mouth rests")
    p.add_argument("--shapes", help=f"comma list from {','.join(MOUTH_SHAPES)} "
                                    f"(default {','.join(DEFAULT_SHAPES)}, plus blink with --eyes)")
    p.add_argument("--subject", help="who is speaking, e.g. 'a woman in her fifties' "
                                     "(default 'the same character')")
    p.add_argument("--seed", type=int)
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(func=cmd_visemes)

    p = paid(sub.add_parser("character", help="stage 3: 8-direction walk character (20-40 generations each)"), 1)
    p.add_argument("--style-character", default=DEFAULT_STYLE_CHARACTER,
                   help="PixelLab character id to copy the style from (default Gary Whitlock)")
    p.add_argument("--size", type=int, help="frame size (default: the style character's size)")
    p.add_argument("--view", default="low top-down", choices=["low top-down", "high top-down", "side"])
    p.add_argument("--bust-reference", action="store_true",
                   help="also send the picked bust as reference_image (overrides the style character's centre image)")
    p.set_defaults(func=cmd_character)

    p = sub.add_parser("animate", help="stage 4: fill in the standard 6 animations x 8 directions")
    p.add_argument("target", help="run name, character id, or pixellab.ai character URL")
    p.add_argument("--templates", help=f"comma list (default all six: {','.join(STANDARD_ANIMATIONS)})")
    p.add_argument("--slots", type=int, default=MAX_PARALLEL, help="job slots to use (default 8, the account limit)")
    p.add_argument("--retries", type=int, default=2, help="retries per failed direction (default 2)")
    p.add_argument("--dry-run", action="store_true", help="show what is missing and the cost, send nothing")
    p.set_defaults(func=cmd_animate)

    p = sub.add_parser("import", help="stage 5: download the character ZIP and convert it into a game atlas")
    p.add_argument("target", help="run name, character id, or pixellab.ai character URL")
    p.add_argument("--key", help="spriteSheet key / file stem (default: the run name)")
    p.add_argument("--register", action="store_true", help="add the atlas to game.js preload")
    p.add_argument("--force", action="store_true", help="replace existing <key> files (backed up first)")
    p.add_argument("--allow-incomplete", action="store_true", help="import even if standard animations are missing")
    p.add_argument("--idle-from", help="another state (id or URL) to take breathing-idle from, e.g. a "
                   "'hands in pockets' state; remembered in the manifest for later re-imports")
    p.set_defaults(func=cmd_import)

    p.add_argument("--offline", action="store_true", help="reconvert the last download (after `fix`) without downloading")

    p = sub.add_parser("qa", help="contact sheets + hints for reviewing an imported character's frames")
    p.add_argument("key", help="an imported key, e.g. bernie_nwosu")
    p.set_defaults(func=cmd_qa)

    p = sub.add_parser("fix", help="patch bad frames without re-rolling (saved as overrides)")
    p.add_argument("key")
    p.add_argument("animation", help="template id, e.g. walk")
    p.add_argument("direction", help="e.g. north")
    p.add_argument("frames", help="frame indices, e.g. 3 or 2,3 or all")
    p.add_argument("--use", required=True,
                   help="mirror | frame:N | file:PATH | ai  (ai = /edit-images-v2: ~20 generations per call)")
    p.add_argument("--prompt", help="ai only: edit_with_text instruction (default: match the rotation as reference)")
    p.add_argument("--dry-run", action="store_true", help="ai only: print the request")
    p.set_defaults(func=cmd_fix)

    p = sub.add_parser("reroll", help="trial takes of one direction (1 generation each); --accept keeps one")
    p.add_argument("key")
    p.add_argument("animation", help="template id, e.g. breathing-idle")
    p.add_argument("direction")
    p.add_argument("--tries", type=int, default=2, help="takes to generate (default 2)")
    p.add_argument("--accept", help="install take tNN as overrides")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(func=cmd_reroll)

    p = sub.add_parser("pick", help="choose a variant and move it into the game assets")
    p.add_argument("name")
    p.add_argument("stage", choices=["bust", "talk", "visemes", "character"])
    p.add_argument("variant", help="e.g. b03, t01, i01, c01")
    p.add_argument("--frames", help="talk only: three open-mouth frames, e.g. 3,5,7 or t01:3,t02:6,i01:round (default auto)")
    p.add_argument("--face", help="talk/visemes: x0,y0,x1,y1 face box override (inpaint visemes default to the mouth mask)")
    p.add_argument("--mouth", help="talk only: cx,cy,rx,ry lips ellipse; paste only that instead of the face box. "
                   "Recommended: the talk model redraws the cheeks and chin a shade off, which shows in game "
                   "as a flickering rectangle round the lower face")
    p.add_argument("--swap", help="visemes only: take single shapes from other variants, e.g. round=i02,teeth=i03")
    p.add_argument("--omit", help="visemes only: leave shapes out, e.g. closed (the game then uses rest)")
    p.set_defaults(func=cmd_pick)

    for name, fn, hlp in [("status", cmd_status, "show jobs, picks and the next stage"),
                          ("collect", cmd_collect, "finish async jobs a killed run left pending")]:
        p = sub.add_parser(name, help=hlp)
        p.add_argument("name")
        p.set_defaults(func=fn)
    sub.add_parser("balance", help="remaining generations").set_defaults(func=cmd_balance)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
