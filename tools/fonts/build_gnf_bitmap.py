#!/usr/bin/env python3
"""
Build the GNF bitmap font that Phaser's BitmapText draws inside the game canvas.

GNF is drawn on a grid: every outline point sits on a multiple of 200 font units (with a half
pixel left side bearing of 100 units), and the em is 2048 units. So one font pixel is 200 units
and the native size is 2048 / 200 = 10.24 px per em. At that size, with the pen half a pixel to
the left, every glyph lands on whole pixels.

What this does, for each wanted character the font has:
  1. Draws it at the native size (10.24 px) with anti-aliasing off (Pillow fontmode "1").
  2. Checks it: draws it again at 50 times the native size (one font pixel = 50 x 50) and reads
     how much of each native pixel the outline covers. Every native pixel must be fully on
     (at least 90%) or fully off (at most 10%: see SLIVER), and the native drawing must agree with the
     coverage at every pixel. A glyph that fails stops the build. The large drawing is only a
     check; nothing is resized into the output.
  3. Packs the glyphs into a white-on-clear sheet and writes the AngelCode BMFont XML that
     Phaser's load.bitmapFont reads. A second sheet, gnf-outline, has each glyph with a 1 px
     black outline (8 neighbours) for text that had a stroke.

Usage:
  python3 tools/fonts/build_gnf_bitmap.py            build into public/break_escape/assets/fonts/gnf-bitmap
  python3 tools/fonts/build_gnf_bitmap.py --check    build into a temporary folder and compare with the committed files
Only Pillow is needed.
"""
import argparse
import io
import os
import struct
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT_PATH = os.path.join(ROOT, "public", "break_escape", "assets", "fonts", "gnf.ttf")
OUT_DIR = os.path.join(ROOT, "public", "break_escape", "assets", "fonts", "gnf-bitmap")

UNITS_PER_PIXEL = 200          # GNF's grid, in font units
CHECK_FACTOR = 50              # the coverage check's drawing: 50 x 50 per native pixel
# A few accent contours overlap the letter's cells by 4 to 12 font units (at most 6% of a pixel),
# so a pixel counts as fully off up to SLIVER coverage and fully on from 1 - SLIVER.
SLIVER = 0.10
ASCENT_PX = 9                  # rows above the baseline (accented capitals reach 1800 units)
DESCENT_PX = 2                 # rows below it (descenders reach -400 units)
LINE_HEIGHT = 12               # one clear row between a descender and the next line's accents
SHEET_W = 256
PAD = 1                        # clear pixels between glyphs on the sheet

# Wanted: printable ASCII, Latin-1 (the £ sign and the accented letters in our names), the
# Latin Extended-A letters seen in names, and the punctuation the scenarios use.
WANTED = (
    [chr(c) for c in range(0x20, 0x7F)]
    + [chr(c) for c in range(0xA1, 0x100) if c != 0xAD]
    + list("ŁłŚśŠšŽžŒœ")
    + list("–—‘’“”…•€←↑→↓✓✗")
)


def read_cmap(path):
    """The set of code points the font maps (cmap format 4 and 12 subtables)."""
    data = open(path, "rb").read()
    num_tables = struct.unpack(">H", data[4:6])[0]
    off = None
    for i in range(num_tables):
        tag, _cs, o, _ln = struct.unpack(">4sIII", data[12 + 16 * i: 28 + 16 * i])
        if tag == b"cmap":
            off = o
    if off is None:
        raise SystemExit("no cmap table in " + path)
    n = struct.unpack(">H", data[off + 2: off + 4])[0]
    cps = set()
    for i in range(n):
        _pid, _eid, sub = struct.unpack(">HHI", data[off + 4 + 8 * i: off + 12 + 8 * i])
        s = off + sub
        fmt = struct.unpack(">H", data[s: s + 2])[0]
        if fmt == 4:
            segx2 = struct.unpack(">H", data[s + 6: s + 8])[0]
            segs = segx2 // 2
            ends = struct.unpack(">%dH" % segs, data[s + 14: s + 14 + segx2])
            starts = struct.unpack(">%dH" % segs, data[s + 16 + segx2: s + 16 + 2 * segx2])
            deltas = struct.unpack(">%dh" % segs, data[s + 16 + 2 * segx2: s + 16 + 3 * segx2])
            ro_at = s + 16 + 3 * segx2
            ranges = struct.unpack(">%dH" % segs, data[ro_at: ro_at + segx2])
            for k in range(segs):
                for c in range(starts[k], ends[k] + 1):
                    if c == 0xFFFF:
                        continue
                    if ranges[k] == 0:
                        gid = (c + deltas[k]) & 0xFFFF
                    else:
                        a = ro_at + 2 * k + ranges[k] + 2 * (c - starts[k])
                        gid = struct.unpack(">H", data[a: a + 2])[0]
                        if gid:
                            gid = (gid + deltas[k]) & 0xFFFF
                    if gid:
                        cps.add(c)
        elif fmt == 12:
            ngroups = struct.unpack(">I", data[s + 12: s + 16])[0]
            for g in range(ngroups):
                a, b, _g0 = struct.unpack(">III", data[s + 16 + 12 * g: s + 28 + 12 * g])
                cps.update(range(a, b + 1))
    return cps


def units_per_em(path):
    data = open(path, "rb").read()
    num_tables = struct.unpack(">H", data[4:6])[0]
    for i in range(num_tables):
        tag, _cs, o, _ln = struct.unpack(">4sIII", data[12 + 16 * i: 28 + 16 * i])
        if tag == b"head":
            return struct.unpack(">H", data[o + 18: o + 20])[0]
    raise SystemExit("no head table")


class GlyphError(Exception):
    pass


def render_glyph(ch, native, big, native_px):
    """(bitmap rows of 0/1 over the line box, advance in px); raises GlyphError if off grid."""
    cell_w = 24
    cell_h = ASCENT_PX + DESCENT_PX
    left = 4                                   # pen origin column inside the cell
    m = Image.new("L", (cell_w, cell_h + 2), 0)
    d = ImageDraw.Draw(m)
    d.fontmode = "1"                           # anti-aliasing off
    d.text((left - 0.5, ASCENT_PX + 1), ch, font=native, fill=255, anchor="ls")
    k = CHECK_FACTOR
    b = Image.new("L", (cell_w * k, (cell_h + 2) * k), 0)
    ImageDraw.Draw(b).text((left * k - k // 2, (ASCENT_PX + 1) * k), ch, font=big, fill=255, anchor="ls")
    rows = []
    for y in range(cell_h + 2):
        row = []
        for x in range(cell_w):
            v = m.getpixel((x, y))
            if v not in (0, 255):
                raise GlyphError("%r: native pixel (%d,%d) is %d, not fully on or off" % (ch, x, y, v))
            box = b.crop((x * k, y * k, x * k + k, y * k + k))
            cov = sum(box.getdata()) / (255.0 * k * k)
            if SLIVER < cov < 1 - SLIVER:
                raise GlyphError("%r: pixel (%d,%d) is %.0f%% covered: the outline is off the grid" % (ch, x, y, cov * 100))
            if (cov >= 0.5) != (v == 255):
                raise GlyphError("%r: pixel (%d,%d) native %d disagrees with coverage %.2f" % (ch, x, y, v, cov))
            row.append(1 if v else 0)
        rows.append(row)
    if any(rows[0]) or any(rows[-1]):
        raise GlyphError("%r: ink outside the %d px line box" % (ch, cell_h))
    rows = rows[1:-1]
    adv = native.getlength(ch)
    if abs(adv - round(adv)) > 0.01:
        raise GlyphError("%r: advance %.3f px is not whole" % (ch, adv))
    return rows, left, int(round(adv))


def ink_box(rows):
    xs = [x for r in rows for x, v in enumerate(r) if v]
    ys = [y for y, r in enumerate(rows) if any(r)]
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def outlined(rows):
    """Rows of 0 clear, 1 outline, 2 fill: the glyph grown by 1 px, padded by 1 on every side."""
    h, w = len(rows), len(rows[0])
    out = [[0] * (w + 2) for _ in range(h + 2)]
    for y in range(h):
        for x in range(w):
            if rows[y][x]:
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        if out[y + 1 + dy][x + 1 + dx] == 0:
                            out[y + 1 + dy][x + 1 + dx] = 1
    for y in range(h):
        for x in range(w):
            if rows[y][x]:
                out[y + 1][x + 1] = 2
    return out


def pack(glyphs, outline):
    """Sheet image and per-glyph rects. glyphs: list of (code, rows, left, adv)."""
    placed = []
    x = y = PAD
    row_h = 0
    for code, rows, left, adv in glyphs:
        grid = outlined(rows) if outline else rows
        shift = 1 if outline else 0
        box = ink_box([[1 if v else 0 for v in r] for r in grid])
        if box is None:
            placed.append((code, None, 0, 0, adv, None))
            continue
        x0, y0, x1, y1 = box
        w, h = x1 - x0 + 1, y1 - y0 + 1
        if x + w + PAD > SHEET_W:
            x = PAD
            y += row_h + PAD
            row_h = 0
        placed.append((code, (x, y, w, h), x0 - left - shift, y0 - shift, adv, (grid, x0, y0)))
        x += w + PAD
        row_h = max(row_h, h)
    height = y + row_h + PAD
    sheet_h = 1
    while sheet_h < height:
        sheet_h *= 2
    img = Image.new("RGBA", (SHEET_W, sheet_h), (0, 0, 0, 0))
    px = img.load()
    for code, rect, _xo, _yo, _adv, src in placed:
        if rect is None:
            continue
        sx, sy, w, h = rect
        grid, x0, y0 = src
        for yy in range(h):
            for xx in range(w):
                v = grid[y0 + yy][x0 + xx]
                if v == 2 or (v == 1 and not outline):
                    px[sx + xx, sy + yy] = (255, 255, 255, 255)
                elif v == 1:
                    px[sx + xx, sy + yy] = (0, 0, 0, 255)
    return img, placed, sheet_h


def bmfont_xml(face, png_name, placed, sheet_h, outline):
    lines = [
        '<?xml version="1.0"?>',
        "<!-- Built by tools/fonts/build_gnf_bitmap.py from gnf.ttf at its native 10.24 px; do not edit by hand. -->",
        "<font>",
        '  <info face="%s" size="%d" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="0" aa="0" padding="0,0,0,0" spacing="%d,%d" outline="%d"/>'
        % (face, LINE_HEIGHT, PAD, PAD, 1 if outline else 0),
        '  <common lineHeight="%d" base="%d" scaleW="%d" scaleH="%d" pages="1" packed="0"/>'
        % (LINE_HEIGHT, ASCENT_PX, SHEET_W, sheet_h),
        "  <pages>",
        '    <page id="0" file="%s"/>' % png_name,
        "  </pages>",
        '  <chars count="%d">' % len(placed),
    ]
    for code, rect, xo, yo, adv, _src in placed:
        x, y, w, h = rect if rect else (0, 0, 0, 0)
        lines.append('    <char id="%d" x="%d" y="%d" width="%d" height="%d" xoffset="%d" yoffset="%d" xadvance="%d" page="0" chnl="15"/>'
                     % (code, x, y, w, h, xo if rect else 0, yo if rect else 0, adv))
    lines += ["  </chars>", "</font>", ""]
    return "\n".join(lines)


def build(out_dir, quiet=False):
    upem = units_per_em(FONT_PATH)
    native_px = upem / float(UNITS_PER_PIXEL)
    native = ImageFont.truetype(FONT_PATH, native_px)
    big = ImageFont.truetype(FONT_PATH, native_px * CHECK_FACTOR)
    if abs(native_px * CHECK_FACTOR - round(native_px * CHECK_FACTOR)) > 1e-9:
        raise SystemExit("check size is not whole")
    cmap = read_cmap(FONT_PATH)
    glyphs, missing, errors = [], [], []
    for ch in WANTED:
        if ord(ch) not in cmap:
            missing.append(ch)
            continue
        try:
            rows, left, adv = render_glyph(ch, native, big, native_px)
        except GlyphError as e:
            errors.append(str(e))
            continue
        glyphs.append((ord(ch), rows, left, adv))
    if errors:
        for e in errors:
            print("FAIL", e, file=sys.stderr)
        raise SystemExit(1)
    os.makedirs(out_dir, exist_ok=True)
    for name, outline in (("gnf", False), ("gnf-outline", True)):
        img, placed, sheet_h = pack(glyphs, outline)
        # The finished sheet must hold only clear, white or (outline) black pixels
        allowed = {(0, 0, 0, 0), (255, 255, 255, 255)} | ({(0, 0, 0, 255)} if outline else set())
        bad = [p for p in img.getdata() if p not in allowed]
        if bad:
            raise SystemExit("%s: %d pixels are neither fully on nor fully off" % (name, len(bad)))
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        open(os.path.join(out_dir, name + ".png"), "wb").write(buf.getvalue())
        open(os.path.join(out_dir, name + ".xml"), "w", encoding="utf-8").write(
            bmfont_xml(name, name + ".png", placed, sheet_h, outline))
    report = "GNF native size %.2f px/em (%d units per pixel, upem %d); %d glyphs; line height %d, base %d" % (
        native_px, UNITS_PER_PIXEL, upem, len(glyphs), LINE_HEIGHT, ASCENT_PX)
    open(os.path.join(out_dir, "MISSING.txt"), "w", encoding="utf-8").write(
        "Characters wanted but not in gnf.ttf (BitmapText draws nothing for them):\n"
        + "".join("U+%04X %s\n" % (ord(c), c) for c in missing))
    if not quiet:
        print(report)
        print("missing from the font:", " ".join("U+%04X" % ord(c) for c in missing) or "none")
    return glyphs, missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="build to a temporary folder and compare with the committed files")
    ap.add_argument("--out", default=OUT_DIR)
    args = ap.parse_args()
    if not args.check:
        build(args.out)
        return
    with tempfile.TemporaryDirectory() as tmp:
        build(tmp, quiet=True)
        stale = []
        for name in ("gnf.png", "gnf.xml", "gnf-outline.png", "gnf-outline.xml", "MISSING.txt"):
            a = os.path.join(tmp, name)
            b = os.path.join(OUT_DIR, name)
            if not os.path.exists(b):
                stale.append(name + " (not built)")
                continue
            if name.endswith(".png"):
                same = list(Image.open(a).convert("RGBA").getdata()) == list(Image.open(b).convert("RGBA").getdata())
            else:
                same = open(a, "rb").read() == open(b, "rb").read()
            if not same:
                stale.append(name)
        if stale:
            print("stale:", ", ".join(stale), "(run tools/fonts/build_gnf_bitmap.py)")
            raise SystemExit(1)
        print("gnf-bitmap is up to date and every glyph is on the pixel grid")


if __name__ == "__main__":
    main()
