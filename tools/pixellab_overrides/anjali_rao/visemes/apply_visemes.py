#!/usr/bin/env python3
"""Rebuild anjali_rao_visemes.png (+ .json): before_sheet.png with teeth, small_open,
medium_open and round replaced by the picked PixelLab inpaint candidates,
pasted onto rest inside MASK only, and only where rest is opaque. round and blink
come from before_sheet.png (wide_open = its round frame).
Usage: python3 apply_visemes.py [out.png]   (default: the game sheet; also writes the .json beside it)"""
import sys, json, pathlib
from PIL import Image
import numpy as np
HERE = pathlib.Path(__file__).parent
GAME = HERE.parents[2].parent / 'public/break_escape/assets/characters/anjali_rao_visemes.png'
MASK = (52, 25, 70, 37)  # x0,y0,x1,y1 inclusive (19x13)
PICKS = {'teeth': 'teeth_s12', 'small_open': 'small_s23',
         'medium_open': 'med_s32', 'round': 'wide_s42'}
# frames copied from another slot of before_sheet.png (owner, 24 Nov: wide_s43 too wide; the old round frame becomes wide_open)
FROM_BEFORE = {'wide_open': 'round'}
ORDER = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
SOURCE = ('pixellab /inpaint-image-pro-flash on the rest frame, rectangle mask x52-70 y25-37 (128px), '
          'one generation per call; picks pasted onto rest inside the mask, opaque pixels only: '
          + ', '.join(f'{k}:{v}' for k, v in PICKS.items())
          + '; wide_open is the earlier sheet\'s round frame (talk-frame lower face, owner pick 24 Nov); blink kept from the earlier sheet (inpaint i01, eyes mask)')
sheet = np.array(Image.open(HERE / 'before_sheet.png').convert('RGBA'))
rest = sheet[:, :128].copy()
before = sheet.copy()
x0, y0, x1, y1 = MASK
m = np.zeros(rest.shape[:2], bool); m[y0:y1+1, x0:x1+1] = True
for name, cand in PICKS.items():
    c = np.array(Image.open(HERE / 'candidates' / f'{cand}.png').convert('RGBA'))
    out = rest.copy()
    sel = m & (rest[..., 3] > 0)
    out[sel] = c[sel]
    i = ORDER.index(name)
    sheet[:, i*128:(i+1)*128] = out
for name, src in FROM_BEFORE.items():
    i, j = ORDER.index(name), ORDER.index(src)
    sheet[:, i*128:(i+1)*128] = before[:, j*128:(j+1)*128]
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else GAME
Image.fromarray(sheet).save(dest)
meta = json.load(open(HERE / 'before_sheet.json'))
meta['source'] = SOURCE
json.dump(meta, open(dest.with_suffix('.json'), 'w'), indent=2); open(dest.with_suffix('.json'), 'a').write('\n')
# check: nothing outside the mask differs from rest in the mouth frames (blink is an eye frame)
for name in ORDER[1:6]:
    i = ORDER.index(name); f = sheet[:, i*128:(i+1)*128]
    d = (f != rest).any(2) & ~m
    print(f'{name}: pixels outside mask differing from rest = {int(d.sum())}')
