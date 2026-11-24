#!/usr/bin/env python3
"""Rebuild ray_hollis_visemes.png from rest.png + the picked PixelLab inpaint candidates.
Run from the repo root. Each candidate is pasted back inside MASK only, so pixels outside
the mouth mask are always the rest frame's. Blink is kept from blink_frame.png."""
from PIL import Image
D = 'tools/pixellab_overrides/ray_hollis/visemes/'
OUT = 'public/break_escape/assets/characters/ray_hollis_visemes'
MASK = (64, 24, 75, 32)  # x0,y0,x1,y1 exclusive
PICKS = {'teeth': 'teeth_s21', 'round': 'round_s32', 'small_open': 'small_open_s42',
         'medium_open': 'medium_open_s52', 'wide_open': 'wide_open_s13'}
ORDER = ['rest', 'teeth', 'round', 'small_open', 'medium_open', 'wide_open', 'blink']
rest = Image.open(D + 'rest.png').convert('RGBA')
frames = {'rest': rest, 'blink': Image.open(D + 'blink_frame.png').convert('RGBA')}
# The face edge runs through the mask's right side: paste only where rest is opaque, so
# the silhouette never changes (the inpaints add 1-6 jaw pixels on the background).
keep = rest.getchannel('A').crop(MASK).point(lambda a: 255 if a else 0)
for k, c in PICKS.items():
    f = rest.copy()
    f.paste(Image.open(D + 'cands/' + c + '.png').convert('RGBA').crop(MASK), MASK[:2], keep)
    frames[k] = f
sheet = Image.new('RGBA', (128 * len(ORDER), 128))
for i, k in enumerate(ORDER):
    sheet.paste(frames[k], (i * 128, 0))
sheet.save(OUT + '.png')
