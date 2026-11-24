#!/usr/bin/env python3
"""Rebuild thandiwe_moyo_visemes.png: before_sheet.png with the rest frame's eye band
(EYES box, opaque rest pixels only) copied onto every mouth frame, so the eyes stay still
while she talks (owner, 24 Nov: the eyes blinked on the mouth-shape frames). No new generations.
Usage: python3 copy_rest_eyes.py [out.png]   (default: the game sheet; also writes the .json beside it)"""
import sys, json, pathlib
from PIL import Image
import numpy as np
HERE = pathlib.Path(__file__).parent
GAME = HERE.parents[2].parent / 'public/break_escape/assets/characters/thandiwe_moyo_visemes.png'
EYES = (54, 15, 76, 22)  # x0,y0,x1,y1 inclusive, 128px frame
ORDER = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
sheet = np.array(Image.open(HERE / 'before_sheet.png').convert('RGBA'))
rest = sheet[:, :128].copy()
x0, y0, x1, y1 = EYES
m = np.zeros(rest.shape[:2], bool); m[y0:y1+1, x0:x1+1] = True
sel = m & (rest[..., 3] > 0)
for name in ORDER[1:6]:
    i = ORDER.index(name); f = sheet[:, i*128:(i+1)*128]
    f[sel] = rest[sel]
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else GAME
Image.fromarray(sheet).save(dest)
meta = json.load(open(HERE / 'before_sheet.json'))
meta['source'] = meta['source'] + f'; rest eye band x{x0}-{x1} y{y0}-{y1} copied onto teeth..wide_open (owner, 24 Nov)'
json.dump(meta, open(dest.with_suffix('.json'), 'w'), indent=2); open(dest.with_suffix('.json'), 'a').write('\n')
for name in ORDER[1:6]:
    i = ORDER.index(name); f = sheet[:, i*128:(i+1)*128]
    print(f'{name}: eye-band pixels differing from rest = {int(((f != rest).any(2) & m).sum())}')
