#!/usr/bin/env python3
"""Review strips (x10, nearest-neighbour). Usage:
  make_strips.py contact OUT.png cand1 cand2 ...   candidates pasted on rest inside MASK, face crop
  make_strips.py final                              final 7-frame sheet strip + rest->viseme->rest strip"""
import sys, pathlib
from PIL import Image, ImageDraw
import numpy as np
HERE = pathlib.Path(__file__).parent
MASK = (52, 25, 70, 37)
CROP = (40, 14, 84, 46)  # face crop for review
S = 10
rest = np.array(Image.open(HERE / 'rest.png').convert('RGBA'))
def comp(name):
    c = np.array(Image.open(HERE / 'candidates' / f'{name}.png').convert('RGBA'))
    out = rest.copy(); x0, y0, x1, y1 = MASK
    m = np.zeros(rest.shape[:2], bool); m[y0:y1+1, x0:x1+1] = True
    sel = m & (rest[..., 3] > 0); out[sel] = c[sel]; return out
def tile(arr, label):
    x0, y0, x1, y1 = CROP
    im = Image.fromarray(arr[y0:y1, x0:x1]).resize(((x1-x0)*S, (y1-y0)*S), Image.NEAREST)
    bg = Image.new('RGBA', (im.width, im.height+16), 'white'); bg.paste(im, (0, 16), im)
    ImageDraw.Draw(bg).text((3, 2), label, fill='black'); return bg
def row(tiles, out):
    W = Image.new('RGBA', (sum(t.width for t in tiles)+4*len(tiles), tiles[0].height), 'white')
    x = 0
    for t in tiles: W.paste(t, (x, 0)); x += t.width+4
    W.save(out)
if sys.argv[1] == 'contact':
    names = sys.argv[3:]
    ts = [tile(rest, 'rest')] + [tile(comp(n), n) for n in names]
    # wrap at 4 per row
    rows = [ts[i:i+4] for i in range(0, len(ts), 4)]
    ims = []
    for r in rows:
        tmp = HERE / 'strips' / '_tmp.png'; row(r, tmp); ims.append(Image.open(tmp).convert('RGBA'))
    H = Image.new('RGBA', (max(i.width for i in ims), sum(i.height for i in ims)), 'white'); y = 0
    for i in ims: H.paste(i, (0, y)); y += i.height
    H.save(sys.argv[2]); (HERE / 'strips' / '_tmp.png').unlink()
if sys.argv[1] == 'final':
    sheet = np.array(Image.open(HERE.parents[2].parent / 'public/break_escape/assets/characters/anjali_rao_visemes.png').convert('RGBA'))
    names = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
    fr = [sheet[:, i*128:(i+1)*128] for i in range(7)]
    row([tile(f, n) for f, n in zip(fr, names)], HERE / 'strips' / 'strip_all_x10.png')
    # rest -> viseme -> rest for each new frame
    ts = []
    for n in ['teeth', 'round', 'small_open', 'medium_open', 'wide_open']:
        f = fr[names.index(n)]
        ts += [tile(fr[0], 'rest'), tile(f, n), tile(fr[0], 'rest')]
    rows = [ts[i:i+6] for i in range(0, len(ts), 6)]
    ims = []
    for r in rows:
        t = HERE / 'strips' / '_tmp.png'; row(r, t); ims.append(Image.open(t).convert('RGBA'))
    H = Image.new('RGBA', (max(i.width for i in ims), sum(i.height for i in ims)), 'white'); y = 0
    for i in ims: H.paste(i, (0, y)); y += i.height
    H.save(HERE / 'strips' / 'strip_rest_viseme_rest_x10.png'); (HERE / 'strips' / '_tmp.png').unlink()
