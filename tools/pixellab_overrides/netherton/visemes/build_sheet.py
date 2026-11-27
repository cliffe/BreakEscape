#!/usr/bin/env python3
"""Rebuild netherton_visemes.png from rest.png + the picked PixelLab inpaint candidates.
Run from the repo root. Each candidate is pasted back inside MASK only, so pixels outside
the mouth mask are always the rest frame's. Blink is kept from blink_frame.png."""
import json, sys
from PIL import Image
D = 'tools/pixellab_overrides/netherton/visemes/'
OUT = 'public/break_escape/assets/characters/netherton_visemes'
MASK = (57, 32, 73, 41)  # x0,y0,x1,y1 exclusive
PICKS = {'teeth': 'teeth_s23', 'round': 'round_s33', 'small_open': 'small_open_s42',
         'medium_open': 'medium_open_s51', 'wide_open': 'wide_open_s12'}
ORDER = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
rest = Image.open(D + 'rest.png').convert('RGBA')
frames = {'rest': rest, 'blink': Image.open(D + 'blink_frame.png').convert('RGBA')}
for k, c in PICKS.items():
    f = rest.copy()
    f.paste(Image.open(D + 'cands/' + c + '.png').convert('RGBA').crop(MASK), MASK[:2])
    frames[k] = f
sheet = Image.new('RGBA', (128 * len(ORDER), 128))
for i, k in enumerate(ORDER):
    sheet.paste(frames[k], (i * 128, 0))
sheet.save(OUT + '.png')
