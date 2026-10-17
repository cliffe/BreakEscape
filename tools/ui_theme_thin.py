#!/usr/bin/env python3
"""Draw the thin-bezel UI theme art, for drawing at 2x like the game world.

The themes use this set for the small squares (inventory slots, HUD buttons,
close buttons) and the portrait rings; panels and wide buttons use the thicker
PixelLab art one folder up (see the header of css/ui-themes.css).

    python3 tools/ui_theme_thin.py [theme ...]     (all themes when none named)

Writes public/break_escape/assets/ui/themes/<theme>/thin/{frame,button,portrait}.png.
Colours are sampled from each theme's PixelLab art in the folder above, so the
thin set reads as the same theme. One art pixel here is one game pixel on
screen (the HUD draws these at 2x, the scale the game world uses at 1080p).

frame.png    16x16 9-slice, border FRAME_SLICE[theme] px
button.png   12x12 9-slice with a filled face, border 3 px
portrait.png the avatar ring (32 px opening, fits the 32 px headshot) with the
             action badge ring (28 px opening, fits the hand frames) attached
             at its lower right; geometry in PORTRAIT below, mirrored in
             ui-themes.css
"""
import math
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'public/break_escape/assets/ui/themes'
CLEAR = (0, 0, 0, 0)

THEMES = {
    'spy': dict(
        outline=(10, 8, 10), hi=(138, 145, 150), mid=(97, 101, 106), lo=(62, 64, 68),
        trim=(212, 188, 138), trim_lo=(150, 128, 84), inner=(14, 14, 15), fill=(33, 35, 37),
        face=(84, 90, 97), face_hi=(118, 124, 130),
        style='bevel_trim', corner='rivet', rim='trim'),
    'cyberpunk': dict(
        outline=(3, 10, 28), hi=(65, 240, 251), mid=(40, 170, 190), lo=(25, 110, 130),
        trim=(230, 54, 206), trim_lo=(150, 28, 130), inner=(10, 4, 24), fill=(18, 6, 41),
        face=(33, 15, 57), face_hi=(52, 26, 86),
        style='line', corner='bracket', chamfer=2, rim='hi', arcs=True, button_brackets=True),
    'general': dict(
        outline=(14, 13, 23), hi=(224, 227, 242), mid=(109, 124, 142), lo=(52, 64, 89),
        trim=(109, 124, 142), trim_lo=(52, 64, 89), inner=(16, 20, 40), fill=(27, 37, 62),
        face=(82, 101, 126), face_hi=(120, 138, 162),
        style='bevel', rim='bevel'),
    'crt': dict(
        outline=(0, 9, 2), hi=(110, 247, 122), mid=(89, 166, 96), lo=(51, 117, 69),
        trim=(110, 247, 122), trim_lo=(51, 117, 69), inner=(0, 6, 1), fill=(3, 16, 6),
        face=(8, 34, 12), face_hi=(14, 52, 20),
        style='double', rim='hi'),
    # Carved stone with glowing green runes
    'eldritch': dict(
        outline=(5, 4, 10), hi=(113, 110, 121), mid=(79, 79, 87), lo=(58, 50, 68),
        trim=(142, 215, 129), trim_lo=(88, 150, 84), inner=(37, 29, 47), fill=(22, 15, 30),
        face=(79, 79, 87), face_hi=(113, 110, 121),
        style='bevel_trim', corner='rivet', rim='trim', arcs=True),
    # Green board, copper traces, solder pads at the corners
    'circuit': dict(
        outline=(9, 14, 17), hi=(51, 106, 71), mid=(42, 105, 64), lo=(29, 65, 47),
        trim=(234, 182, 91), trim_lo=(174, 135, 81), inner=(23, 71, 59), fill=(37, 86, 56),
        face=(45, 119, 64), face_hi=(62, 124, 78),
        style='trim_first', corner='rivet', rim='trim'),
    # Gunmetal console, electric blue light strip, amber status lights
    'secops': dict(
        outline=(2, 2, 6), hi=(95, 190, 223), mid=(63, 74, 91), lo=(34, 99, 181),
        trim=(229, 134, 39), trim_lo=(150, 90, 30), inner=(9, 14, 38), fill=(21, 29, 53),
        face=(65, 77, 102), face_hi=(102, 117, 138),
        style='line', corner='rivet', rim='hi', arcs=True),
}

FRAME_SLICE = {'spy': 4, 'cyberpunk': 5, 'general': 4, 'crt': 4, 'eldritch': 4, 'circuit': 4, 'secops': 4}

# Art-pixel geometry of portrait.png (CSS uses twice these)
PORTRAIT = dict(w=64, h=52,
                avatar=dict(cx=20, cy=20, opening=32, ring=4),
                badge=dict(cx=46, cy=34, opening=28, ring=3))


def rgba(c, a=255):
    return (*c, a)


def ring_colour(t, theme, layer, side):
    """Colour of bezel layer (0 = outermost) on a side: 'tl' lit, 'br' shaded."""
    p = THEMES[theme]
    if layer == 0:
        return p['outline']
    lit = side == 'tl'
    layers = {
        # stone/steel bevel, then a trim line, then shadow (spy, eldritch)
        'bevel_trim': [None, p['hi'] if lit else p['lo'], p['trim'] if lit else p['trim_lo'], p['inner']],
        'bevel': [None, p['hi'] if lit else p['lo'], p['mid'], p['inner']],
        # one bright line on a dark bezel (cyberpunk, secops)
        'line': [None, p['hi'], p['outline'], p['inner'], p['inner']],
        'double': [None, p['hi'], p['inner'], p['lo'], p['inner']],
        # a metal trace first, then the board (circuit)
        'trim_first': [None, p['trim'] if lit else p['trim_lo'], p['mid'], p['inner'], p['inner']],
    }[p['style']]
    return layers[layer]


def draw_frame(theme):
    size, n = 16, FRAME_SLICE[theme]
    p = THEMES[theme]
    im = Image.new('RGBA', (size, size), rgba(p['fill']))
    for y in range(size):
        for x in range(size):
            layer = min(x, y, size - 1 - x, size - 1 - y)
            if layer >= n:
                continue
            side = 'tl' if min(x, y) <= min(size - 1 - x, size - 1 - y) else 'br'
            im.putpixel((x, y), rgba(ring_colour(None, theme, layer, side) or p['fill']))
    # Corners: round the outside by one pixel (chamfer two for cyberpunk)
    cut = p.get('chamfer', 1)
    for cx, cy, dx, dy in [(0, 0, 1, 1), (size - 1, 0, -1, 1), (0, size - 1, 1, -1), (size - 1, size - 1, -1, -1)]:
        for i in range(cut):
            for j in range(cut - i):
                im.putpixel((cx + dx * i, cy + dy * j), CLEAR)
        # the outline steps in along the cut
        for i in range(cut):
            im.putpixel((cx + dx * (cut - i), cy + dy * i), rgba(p['outline']))
            im.putpixel((cx + dx * i, cy + dy * (cut - i)), rgba(p['outline']))
        if p.get('corner') == 'rivet':                                         # rivet, rune or pad
            im.putpixel((cx + dx * 2, cy + dy * 2), rgba(p.get('corner_colour', p['trim'])))
        if p.get('corner') == 'bracket':
            for k in range(2, 5):                                              # magenta bracket
                im.putpixel((cx + dx * k, cy + dy * 1), rgba(p['trim']))
                im.putpixel((cx + dx * 1, cy + dy * k), rgba(p['trim']))
            im.putpixel((cx + dx * 2, cy + dy * 2), rgba(p['trim']))
    return im


def draw_button(theme):
    size, n = 12, 3
    p = THEMES[theme]
    im = Image.new('RGBA', (size, size), rgba(p['face']))
    for y in range(size):
        for x in range(size):
            layer = min(x, y, size - 1 - x, size - 1 - y)
            if layer == 0:
                c = p['outline']
            elif layer == 1:
                lit = min(x, y) <= min(size - 1 - x, size - 1 - y)
                c = {'trim': p['trim'], 'hi': p['hi'], 'bevel': p['hi'] if lit else p['lo']}[p['rim']]
            elif layer == 2:
                c = p['face_hi'] if y == 2 else p['face']
            else:
                continue
            im.putpixel((x, y), rgba(c))
    for cx, cy in [(0, 0), (size - 1, 0), (0, size - 1), (size - 1, size - 1)]:
        im.putpixel((cx, cy), CLEAR)
    if p.get('button_brackets'):
        for cx, cy, dx, dy in [(1, 1, 1, 1), (size - 2, 1, -1, 1), (1, size - 2, 1, -1), (size - 2, size - 2, -1, -1)]:
            im.putpixel((cx, cy), rgba(p['trim']))
            im.putpixel((cx + dx, cy), rgba(p['trim']))
            im.putpixel((cx, cy + dy), rgba(p['trim']))
    return im


def draw_ring(im, theme, cx, cy, opening, ring):
    """Concentric bezel around a circular opening, lit from the top left."""
    p = THEMES[theme]
    r_in = opening / 2
    r_out = r_in + ring
    for y in range(im.height):
        for x in range(im.width):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            d = math.hypot(dx, dy)
            if d > r_out:
                continue
            if d <= r_in:
                im.putpixel((x, y), rgba(p['fill']))
                continue
            layer = min(ring - 1, int(r_out - d))       # 0 = outermost
            side = 'tl' if dx + dy < 0 else 'br'
            c = ring_colour(None, theme, layer, side) or p['fill']
            if p.get('arcs') and layer == 0:
                ang = math.degrees(math.atan2(dy, dx)) % 360
                if 200 <= ang <= 250 or 20 <= ang <= 70:
                    c = p.get('arc_colour', p['trim'])
            im.putpixel((x, y), rgba(c))


def draw_portrait(theme):
    g = PORTRAIT
    im = Image.new('RGBA', (g['w'], g['h']), CLEAR)
    a, b = g['avatar'], g['badge']
    draw_ring(im, theme, a['cx'], a['cy'], a['opening'], a['ring'])
    draw_ring(im, theme, b['cx'], b['cy'], b['opening'], b['ring'])
    return im


def main(names=None):
    for theme in names or THEMES:
        d = OUT / theme / 'thin'
        d.mkdir(parents=True, exist_ok=True)
        draw_frame(theme).save(d / 'frame.png')
        draw_button(theme).save(d / 'button.png')
        draw_portrait(theme).save(d / 'portrait.png')
        print(f'{d}: frame slice {FRAME_SLICE[theme]}, button slice 3, portrait {PORTRAIT["w"]}x{PORTRAIT["h"]}')


if __name__ == '__main__':
    import sys
    main(sys.argv[1:])
