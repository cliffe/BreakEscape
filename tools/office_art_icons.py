#!/usr/bin/env python3
"""Builds the office-life art picked on 2026-11-06 from one PixelLab sheet.

Source: create_image_pro job 4c061f1f-02af-4bd8-96bd-cf5e93940b2e (96x32, 16
candidates). The user picked cake 0.0, socket 12.1, closed lock 15.1 and phone
0.3 (candidate.piece, pieces split on empty columns). The open lock is a hand
edit of the closed one: the hoop moved left by the leg spacing (9 px) so its
right leg sits in the left-hand hole and the hoop swings off the side.

No resampling: pixels are copied one by one. Rows and columns are dropped to
fit 16 px; near-black outline pixels become the icon set's shared #16141e.

Outputs:
  assets/icons/npc-lock.png       16x16, body at x 0-14
  assets/icons/npc-lock-open.png  23x16, body at x 8-22 (align bodies: +8 px)
  assets/icons/npc-phone.png      16x16
  assets/objects/cake1.png        25x27 (as generated)
  assets/objects/wall_socket1.png 17x18 (as generated)
"""
import os
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, 'tools', 'office_art_sources')
ASSETS = os.path.join(REPO, 'public', 'break_escape', 'assets')
OUTLINE = (0x16, 0x14, 0x1e, 255)
T = (0, 0, 0, 0)


def grid(im):
    im = im.convert('RGBA')
    return [[im.getpixel((x, y)) for x in range(im.width)] for y in range(im.height)]


def outline(g):
    return [[OUTLINE if c[3] and max(c[:3]) < 20 else c for c in r] for r in g]


def piece(sheet, index):
    """The index-th piece of a sheet, split on empty columns, after rolling any
    wrapped rows back to the top (the generator wraps some candidates)."""
    im = Image.open(os.path.join(SRC, sheet)).convert('RGBA')
    a = im.split()[3]
    w, h = im.size
    empty = [y for y in range(h) if not any(a.getpixel((x, y)) for x in range(w))]
    if empty and 0 not in empty and h - 1 not in empty:
        from PIL import ImageChops
        im = ImageChops.offset(im, 0, -empty[len(empty) // 2] - 1)
        a = im.split()[3]
    cols = [any(a.getpixel((x, y)) for y in range(h)) for x in range(w)]
    runs, x = [], 0
    while x < w:
        if cols[x]:
            s = x
            while x < w and cols[x]:
                x += 1
            runs.append((s, x))
        else:
            x += 1
    s, e = runs[index]
    p = im.crop((s, 0, e, h))
    return p.crop(p.getbbox())


def save(g, path):
    im = Image.new('RGBA', (len(g[0]), len(g)))
    for y, r in enumerate(g):
        for x, c in enumerate(r):
            im.putpixel((x, y), tuple(c))
    im.save(path)


def main():
    lock = outline(grid(Image.open(os.path.join(SRC, 'lock_c15_1.png'))))  # 15x21
    rows = [0, 1, 2, 3, 4, 7, 9, 10, 12, 13, 15, 16, 17, 18, 19, 20]
    hoop_rows = 6
    save([lock[r] + [T] for r in rows], os.path.join(ASSETS, 'icons', 'npc-lock.png'))
    op = [[T] * 23 for _ in range(16)]
    for y, r in enumerate(rows):
        for x, c in enumerate(lock[r]):
            if y < hoop_rows:
                if c[3]:
                    op[y][x - 1] = c      # -9 shift, +8 canvas offset
            else:
                op[y][x + 8] = c
    for x in range(5):
        op[hoop_rows][x] = OUTLINE        # cap the free leg
    save(op, os.path.join(ASSETS, 'icons', 'npc-lock-open.png'))

    phone = outline(grid(Image.open(os.path.join(SRC, 'phone_c0_3.png'))))  # 19x19
    keep_r = [r for r in range(19) if r not in (10, 13, 15)]
    keep_c = [c for c in range(19) if c not in (3, 7, 17)]
    save([[phone[r][c] for c in keep_c] for r in keep_r], os.path.join(ASSETS, 'icons', 'npc-phone.png'))

    piece('sheet_c0.png', 0).save(os.path.join(ASSETS, 'objects', 'cake1.png'))
    piece('sheet_c12.png', 1).save(os.path.join(ASSETS, 'objects', 'wall_socket1.png'))


if __name__ == '__main__':
    main()
