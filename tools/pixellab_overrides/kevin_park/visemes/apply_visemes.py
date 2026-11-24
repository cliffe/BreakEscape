#!/usr/bin/env python3
"""Rebuild kevin_park_visemes.png: before_sheet.png with teeth, small_open,
medium_open and wide_open replaced by the picked PixelLab inpaint candidates,
pasted onto rest inside MASK only, and only where rest is opaque.
Usage: python3 apply_visemes.py [out.png]   (default: the game sheet)"""
import sys, pathlib
from PIL import Image
import numpy as np
HERE = pathlib.Path(__file__).parent
GAME = HERE.parents[2].parent / 'public/break_escape/assets/characters/kevin_park_visemes.png'
MASK = (58, 30, 77, 40)  # x0,y0,x1,y1 inclusive (20x11)
PICKS = {'teeth': 'teeth_s43', 'small_open': 'small_s51',
         'medium_open': 'med_s31', 'wide_open': 'wide_s62'}
ORDER = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
sheet = np.array(Image.open(HERE / 'before_sheet.png').convert('RGBA'))
rest = sheet[:, :128].copy()
for name, cand in PICKS.items():
    c = np.array(Image.open(HERE / 'candidates' / f'{cand}.png').convert('RGBA'))
    out = rest.copy()
    x0, y0, x1, y1 = MASK
    m = np.zeros(rest.shape[:2], bool); m[y0:y1+1, x0:x1+1] = True
    sel = m & (rest[..., 3] > 0)
    out[sel] = c[sel]
    i = ORDER.index(name)
    sheet[:, i*128:(i+1)*128] = out
Image.fromarray(sheet).save(sys.argv[1] if len(sys.argv) > 1 else GAME)
