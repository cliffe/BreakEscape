#!/usr/bin/env python3
"""Make the title screen's stepped pixel vignette (critique A38).

A small RGBA image of flat black bands, darker towards the edges, with hard stair-stepped
edges and no gradient. The title screen stretches it over the whole screen with
image-rendering: pixelated, so each source pixel is a chunky block like the rest of the
game's art.

    python3 tools/make_title_vignette.py [out.png]
"""
import sys
from PIL import Image

W, H = 160, 120          # stretched to the screen: about 8px blocks on a 1400x1000 window
# (distance from the centre on a 0..1 ellipse, alpha): flat steps, no blending
STEPS = [(0.70, 0), (0.82, 70), (0.92, 130), (1.02, 185), (99, 235)]


def alpha_at(x, y):
    # The centre of the pixel, on an ellipse that reaches 1.0 at the middle of each edge
    dx = (x + 0.5 - W / 2) / (W / 2)
    dy = (y + 0.5 - H / 2) / (H / 2)
    d = (dx * dx + dy * dy) ** 0.5
    for limit, a in STEPS:
        if d < limit:
            return a
    return STEPS[-1][1]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/break_escape/assets/ui/title-vignette.png'
    img = Image.new('RGBA', (W, H))
    img.putdata([(0, 0, 0, alpha_at(x, y)) for y in range(H) for x in range(W)])
    img.save(out, optimize=True)
    print(f'wrote {out} ({W}x{H}, {len(STEPS)} shades)')


if __name__ == '__main__':
    main()
