#!/usr/bin/env python3
"""
Estimate the usable top surface of every table and desk sprite (prototype, free: pixels only).

For each candidate sprite it finds, in sprite pixels (origin top-left, y down):

  surfaceTop    first row of the flat top (the back edge of the usable surface)
  surfaceFront  first row of the front face / apron below the top (the front edge;
                also the line a south-side sitter meets)
  insetL/insetR columns of the top's left and right edge, from the sprite's sides

Method: the flat top is a run of nearly full-width rows of one colour near the top of
the sprite. The front edge is the first row after that run where the colour changes
sharply (a darker apron or lip) or the opaque width drops (legs, an open frame).
A 1-2px outline row above the top is skipped. A second strong band above the found top
(a hutch, a back panel, a screen riser) is reported as `backPanel` and lowers the
confidence, because the usable top may then be the lower band.

Confidence (0-1) combines the contrast of the front-edge change, how even the top is,
and whether the top's depth is a plausible share of the sprite's height.

Usage:
  python3 scripts/room_gen/measure_table_surfaces.py [--out DIR] [--only name,name]

Writes DIR/table_surfaces_estimates.json and DIR/contact_sheet_NN.png (each sprite at
4x, nearest-neighbour, with the lines drawn over it: green surfaceTop, red surfaceFront,
blue insets, orange backPanel). Read-only on the repo; it changes no asset.
"""
import argparse
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ASSETS = os.path.join(ROOT, "public", "break_escape", "assets")
CATALOG = os.path.join(ROOT, "scripts", "room_gen", "catalog.json")
ROOMS = os.path.join(ASSETS, "rooms")

INCLUDE = re.compile(r"desk|table|bench|counter|console|workbench|credenza|sideboard|trestle|carrel"
                     r"|ledge|kitchenette|stall|worktop|trolley|plan_chest|steel_stand")
EXCLUDE = re.compile(r"lamp|chair|sofa|coffee_station|vm-launcher|tablet|timetable|sink_only|fridge"
                     r"|dishwasher|_pos1$|_p\d$|kiosk|safe|drawer|workstation|flag-station|_station1$"
                     r"|substation_map|notes_|printer|shelves|hce_bench1|cable_trolley|book_trolley"
                     r"|linen_cart|cleaning_trolley|drug_trolley|instrument_trolley")
# Kept even though the name filters would drop them: things that carry items.
FORCE = {"kitchen_counter_sink1", "hce_trading_station1"}
SCALE = 4


def candidates():
    cat = json.load(open(CATALOG))
    out = []
    for name, info in cat.get("tables", {}).items():
        out.append((name, "tables", info))
    for name, info in cat.get("objects", {}).items():
        if name in FORCE or (INCLUDE.search(name) and not EXCLUDE.search(name)):
            out.append((name, "objects", info))
    return out


def sprite_path(name, kind):
    for sub in ([kind] if kind else []) + ["tables", "objects"]:
        p = os.path.join(ASSETS, sub, f"{name}.png")
        if os.path.exists(p):
            return p
    return None


def tables_layer_usage():
    """How often each sprite sits in a room's tables layer (to rank what matters)."""
    use = {}
    for fn in os.listdir(ROOMS):
        if not fn.endswith(".json"):
            continue
        try:
            m = json.load(open(os.path.join(ROOMS, fn)))
        except Exception:
            continue
        gid = {}
        for ts in m.get("tilesets", []):
            if "tiles" in ts:
                for t in ts["tiles"]:
                    gid[ts["firstgid"] + t["id"]] = os.path.basename(t.get("image", ""))[:-4]
            elif "image" in ts:
                gid[ts["firstgid"]] = os.path.basename(ts["image"])[:-4]
        for layer in m.get("layers", []):
            if layer.get("type") != "objectgroup":
                continue
            for o in layer.get("objects", []):
                g = o.get("gid", 0) & 0x1FFFFFFF
                if g in gid:
                    n = gid[g]
                    use.setdefault(n, {"rooms": set(), "layers": set()})
                    use[n]["rooms"].add(fn[:-5])
                    use[n]["layers"].add(layer["name"])
    return use


def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def top_run(im, alpha, y0, y1, bw):
    """Pass 1: the flat top as a run of rows from the first opaque row down, each close in
    colour (median of the middle 60% of the row) to the run so far. Returns (top, front)."""
    h = im.shape[0]
    rowcol = np.zeros((h, 3))
    cover = alpha.sum(axis=1) / bw
    for y in range(h):
        m = alpha[y]
        if not m.any():
            continue
        cols = np.where(m)[0]
        a, b = cols.min(), cols.max()
        pad = int((b - a + 1) * 0.2)
        mm = m.copy()
        mm[: a + pad] = False
        mm[b - pad + 1:] = False
        rowcol[y] = np.median(im[y, mm if mm.any() else m, :3], axis=0)

    def cd(a, b):
        return float(np.sqrt(((rowcol[a] - rowcol[b]) ** 2).sum()))
    top = y0
    for _ in range(2):  # skip a 1-2px outline
        if top + 1 <= y1 and cd(top, top + 1) > 40:
            top += 1
    run, y = [top], top + 1
    while y <= y1:
        ref = np.median(rowcol[run], axis=0)
        d = float(np.sqrt(((rowcol[y] - ref) ** 2).sum()))
        if d <= 28 and cover[y] >= 0.75 * cover[run].max():
            run.append(y); y += 1; continue
        if y + 1 <= y1 and float(np.sqrt(((rowcol[y + 1] - ref) ** 2).sum())) <= 22 \
                and cover[y + 1] >= 0.75 * cover[run].max():
            run += [y, y + 1]; y += 2; continue
        break
    return top, y


def measure(path):
    im = np.array(Image.open(path).convert("RGBA")).astype(float)
    h, w = im.shape[:2]
    alpha = im[..., 3] > 16
    if not alpha.any():
        return None
    ys = np.where(alpha.any(axis=1))[0]
    xs = np.where(alpha.any(axis=0))[0]
    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    bw = x1 - x0 + 1
    sprite_h = y1 - y0 + 1
    rgb = im[..., :3]
    q = (rgb // 24).astype(int)
    key = q[..., 0] * 10000 + q[..., 1] * 100 + q[..., 2]

    # Per row: the commonest colour (quantised) and the share of the sprite's width it covers.
    # Items drawn on a top hide part of it, but the top's colour still dominates its rows.
    mode_col = np.zeros((h, 3))
    mode_frac = np.zeros(h)
    cover = alpha.sum(axis=1) / bw
    for y in range(h):
        m = alpha[y]
        if not m.any():
            continue
        vals, counts = np.unique(key[y][m], return_counts=True)
        k = vals[counts.argmax()]
        sel = m & (key[y] == k)
        mode_col[y] = rgb[y][sel].mean(axis=0)
        mode_frac[y] = sel.sum() / bw

    def dist(a, b):
        return float(np.sqrt(((a - b) ** 2).sum()))

    def L(c):
        return c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114

    # Pass 1 (plain tops: desk1, the hospital and conference tables): a run from the top row.
    # Accepted when it is a plausible share of the height and ends at a real edge.
    t1, f1 = top_run(im, alpha, y0, y1, bw)
    method = "top-run"
    best = None
    if f1 <= y1 and (f1 - t1) >= 0.15 * sprite_h and (f1 - t1) <= 0.75 * sprite_h:
        band = slice(t1, f1)
        sel = alpha[band]
        col = rgb[band][sel].mean(axis=0) if sel.any() else mode_col[t1]
        best = (t1, f1, float(np.mean(mode_frac[band])), col)

    # Runs of rows that share one dominant colour over a good share of the width
    runs, y = [], y0
    while y <= y1:
        if mode_frac[y] < 0.3:
            y += 1
            continue
        s, ref = y, [mode_col[y]]
        y += 1
        while y <= y1:
            mean = np.mean(ref, axis=0)
            if mode_frac[y] >= 0.3 and dist(mode_col[y], mean) <= 30:
                ref.append(mode_col[y]); y += 1; continue
            # allow a single seam / highlight row inside a top
            if y + 1 <= y1 and mode_frac[y + 1] >= 0.3 and dist(mode_col[y + 1], mean) <= 30:
                ref += [mode_col[y + 1]]; y += 2; continue
            break
        runs.append((s, y, float(np.mean(mode_frac[s:y])), np.mean(ref, axis=0)))
    best_score = 1e9 if best else -1
    if not best:
        method = "band"
    for i, (s, e, frac, col) in enumerate(runs if not best else []):
        n = e - s
        if n < 3 or s > y0 + 0.65 * sprite_h:
            continue
        nxt = runs[i + 1][3] if i + 1 < len(runs) else None
        lighter = 1.0 if (nxt is None or L(col) >= L(nxt) - 4) else 0.6
        early = 1.0 - 0.6 * (s - y0) / sprite_h
        score = n * frac * lighter * early
        if score > best_score:
            best, best_score = (s, e, frac, col), score
    if best is None:
        return {"w": w, "h": h, "opaque": [x0, y0, x1, y1], "surfaceTop": y0, "surfaceFront": y0,
                "insetL": x0, "insetR": w - 1 - x1, "backPanel": None, "depthPx": 0,
                "confidence": 0.0, "method": "none", "why": {"note": "no flat band"}}
    s, e, frac, col = best
    # The back edge: walk up while the top's colour still shows in the row (items stand on it)
    top = s
    while method == "band" and top - 1 >= y0:
        r = top - 1
        share = (alpha[r] & (np.sqrt(((rgb[r] - col) ** 2).sum(axis=1)) <= 30)).sum() / bw
        if share >= 0.15:
            top = r
        else:
            break
    front = e
    depth = front - top

    # A back panel / hutch: a wide band above the top that is not the top's colour
    back_panel = None
    if top - y0 >= 4 and cover[y0:top].mean() >= 0.6:
        back_panel = [y0, top]

    below = min(front, y1)
    contrast = abs(L(mode_col[below]) - L(col)) if below != front - 1 else 0
    cover_drop = max(0.0, float(np.median(cover[top:front]) - cover[below]))
    evenness = float(np.std([L(c) for c in mode_col[s:e]])) if e - s > 1 else 30.0

    close = (np.sqrt(((rgb[top:front] - col) ** 2).sum(axis=2)) <= 34) & alpha[top:front]
    colfrac = close.mean(axis=0) if front > top else np.zeros(w)
    good = np.where(colfrac >= 0.3)[0]
    insetL = int(good.min()) if len(good) else x0
    insetR = int(w - 1 - good.max()) if len(good) else w - 1 - x1

    share = depth / sprite_h
    c_contrast = min(1.0, contrast / 50.0 + cover_drop * 1.5)
    c_even = max(0.0, 1.0 - evenness / 25.0)
    c_share = 1.0 if 0.15 <= share <= 0.7 else (0.5 if 0.08 <= share <= 0.85 else 0.1)
    c_clean = min(1.0, frac / 0.8)   # items baked on the top lower it
    conf = round(0.35 * c_contrast + 0.15 * c_even + 0.25 * c_share + 0.25 * c_clean, 2)
    if back_panel:
        conf = round(conf * 0.85, 2)
    # Pass 2 is right about a third of the time on the first sheet (props with things drawn
    # on their tops): never let it pass review on its own.
    if method == "band":
        conf = min(conf, 0.55)

    return {
        "w": w, "h": h,
        "opaque": [x0, y0, x1, y1],
        "surfaceTop": int(top),
        "surfaceFront": int(front),
        "insetL": insetL, "insetR": insetR,
        "backPanel": back_panel,
        "depthPx": int(depth),
        "confidence": conf,
        "method": method,
        "why": {"contrast": round(float(contrast), 1), "coverDrop": round(float(cover_drop), 2),
                "evenness": round(evenness, 1), "share": round(share, 2), "topShare": round(frac, 2)},
    }


def draw_sheets(results, outdir, per_page=16, page_w=1800):
    pages, cur, x, y, row_h = [], [], 12, 12, 0
    tiles = []
    for name, r in results:
        img = Image.open(r["path"]).convert("RGBA")
        bg = Image.new("RGBA", img.size, (236, 230, 220, 255))
        bg.alpha_composite(img)
        big = bg.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST)  # integer, nearest
        d = ImageDraw.Draw(big)
        W, H = big.size
        if r.get("backPanel"):
            for yy in r["backPanel"]:
                d.line([(0, yy * SCALE), (W, yy * SCALE)], fill=(255, 150, 0, 255), width=1)
        d.line([(0, r["surfaceTop"] * SCALE), (W, r["surfaceTop"] * SCALE)], fill=(0, 200, 0, 255), width=2)
        d.line([(0, r["surfaceFront"] * SCALE), (W, r["surfaceFront"] * SCALE)], fill=(230, 0, 0, 255), width=2)
        d.line([(r["insetL"] * SCALE, 0), (r["insetL"] * SCALE, H)], fill=(0, 90, 255, 255), width=1)
        xr = (r["w"] - r["insetR"]) * SCALE
        d.line([(xr, 0), (xr, H)], fill=(0, 90, 255, 255), width=1)
        tiles.append((name, r, big))

    def flush(page):
        if not page:
            return
        hgt = max(t[3] + t[2].size[1] + 40 for t in page) + 12
        sheet = Image.new("RGB", (page_w, hgt), (40, 40, 48))
        d = ImageDraw.Draw(sheet)
        for name, r, big, py, px in [(a, b, c, e, f) for a, b, c, e, f in page]:
            sheet.paste(big, (px, py + 30))
            flag = "" if r["confidence"] >= 0.6 else "  LOW"
            d.text((px, py + 2), f"{name} {r['w']}x{r['h']}", fill=(255, 255, 255))
            d.text((px, py + 14), f"top {r['surfaceTop']} front {r['surfaceFront']} c={r['confidence']}{flag}",
                   fill=(255, 220, 120) if flag else (170, 255, 170))
        pages.append(sheet)

    page, x, y, row_h = [], 12, 12, 0
    for name, r, big in tiles:
        bw, bh = big.size
        cw = max(bw, 230)
        if x + cw > page_w - 12:
            x, y, row_h = 12, y + row_h + 50, 0
        if len(page) >= per_page:
            flush(page)
            page, x, y, row_h = [], 12, 12, 0
        page.append((name, r, big, y, x))
        x += cw + 24
        row_h = max(row_h, bh)
    flush(page)
    paths = []
    for i, s in enumerate(pages, 1):
        p = os.path.join(outdir, f"contact_sheet_{i:02d}.png")
        s.save(p)
        paths.append(p)
    return paths


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--out", required=True, help="output folder (keep it outside the repo)")
    ap.add_argument("--only", default="")
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    only = set(filter(None, a.only.split(",")))
    use = tables_layer_usage()
    results = []
    for name, kind, info in candidates():
        if only and name not in only:
            continue
        p = sprite_path(name, kind)
        if not p:
            continue
        r = measure(p)
        if not r:
            continue
        r["path"] = p
        u = use.get(name)
        r["usedIn"] = sorted(u["rooms"]) if u else []
        r["layers"] = sorted(u["layers"]) if u else []
        results.append((name, r))
    results.sort(key=lambda t: (-len(t[1]["usedIn"]), t[0]))
    out = {n: {k: v for k, v in r.items() if k != "path"} | {"sprite": os.path.relpath(r["path"], ROOT)}
           for n, r in results}
    jp = os.path.join(a.out, "table_surfaces_estimates.json")
    with open(jp, "w") as f:
        json.dump(out, f, indent=1)
    sheets = draw_sheets(results, a.out)
    low = [n for n, r in results if r["confidence"] < 0.6]
    print(f"{len(results)} sprites measured; {len(results) - len(low)} at confidence >= 0.6, {len(low)} low")
    print("JSON:", jp)
    for s in sheets:
        print("sheet:", s)


if __name__ == "__main__":
    main(sys.argv[1:])
