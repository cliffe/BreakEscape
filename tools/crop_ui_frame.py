#!/usr/bin/env python3
"""Crop a PixelLab UI panel to its visible pixels for use as a CSS 9-slice frame.

    python3 tools/crop_ui_frame.py <in.png> <out.png>

PixelLab draws the panel somewhere on a transparent 192px+ canvas; the
border-image slice needs the frame's own edges. No resampling is done.
"""
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
# Ignore near-transparent stray pixels when finding the frame's edges
alpha = im.getchannel('A').point(lambda a: 255 if a > 32 else 0)
frame = im.crop(alpha.getbbox())
frame.save(dst)
mid_y, mid_x = frame.height // 2, frame.width // 2
row = [frame.getpixel((x, mid_y))[:3] for x in range(frame.width)]
print(f'{dst}: {frame.width}x{frame.height}; interior colour at centre {frame.getpixel((mid_x, mid_y))[:3]}')
