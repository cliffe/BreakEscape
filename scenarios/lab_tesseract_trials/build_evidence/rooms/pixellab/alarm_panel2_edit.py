# Byte Wall panel: PixelLab P3 frame 03, pixel-edited (no rescale).
# 1. add the missing left frame (2 columns mirrored from the right edge);
# 2. repaint the lamp row as 8 even lamps, lit for 01001101 (128..1: 64, 8, 4, 1 lit).
import sys, glob
from PIL import Image
src = sorted(glob.glob(sys.argv[1] + '/*_03.png'))[0]
im = Image.open(src).convert('RGBA'); w, h = im.size
out = Image.new('RGBA', (w + 2, h), (0, 0, 0, 0)); out.alpha_composite(im, (2, 0))
p = out.load(); sp = im.load()
for y in range(1, h - 1):
    p[0, y] = sp[w - 1, y]          # outline column
    p[1, y] = sp[w - 2, y]          # frame column
p[1, 0] = sp[w - 2, 0]; p[1, h - 1] = sp[w - 2, h - 1]
BG = (42, 62, 81, 255); OFF = (66, 52, 44, 255); OFF_HI = (92, 74, 60, 255)
LIT = (240, 168, 56, 255); LIT_HI = (255, 226, 150, 255); RIM = (27, 45, 61, 255)
for y in range(5, 9):
    for x in range(2, 2 + 28):
        p[x, y] = BG
bits = [0, 1, 0, 0, 1, 1, 0, 1]
for k, b in enumerate(bits):
    x0 = 3 + round(k * 3.5)
    for dx in range(2):
        for dy in range(2):
            p[x0 + dx, 6 + dy] = (LIT if b else OFF)
    p[x0, 6] = LIT_HI if b else OFF_HI
    p[x0, 8] = RIM; p[x0 + 1, 8] = RIM
out.save(sys.argv[2]); print('wrote', sys.argv[2], out.size)
