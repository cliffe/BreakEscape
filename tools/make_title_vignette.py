#!/usr/bin/env python3
"""Make the title screen's stepped pixel vignette (critique A38).

A small RGBA image of flat black bands, darker towards the edges, with hard stair-stepped
edges and no gradient. The title screen stretches it over the whole screen with
image-rendering: pixelated, so each source pixel is a chunky block like the rest of the
game's art.

    python3 tools/make_title_vignette.py [out.png] [--art]

--art makes the variant for title screens with a painted backdrop (title-vignette-art.png):
the same oval vignette, plus a darker zone to the right and along the bottom where the title
text sits. The extra darkening is baked in as the same square blocks, with curved steps, so
no straight full-height bands cross the art.
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


# Art variant: an oval centred up and to the left; steps (distance, alpha) grow to the right
# and bottom edges, where the title text sits
ART_CX, ART_CY, ART_RX, ART_RY = 0.26 * W, 0.34 * H, 0.52 * W, 0.56 * H
ART_STEPS = [(0.50, 0), (0.62, 25), (0.74, 50), (0.86, 80), (0.98, 115), (1.10, 150),
             (1.22, 185), (1.34, 210), (99, 225)]


def art_alpha_at(x, y):
    dx = (x + 0.5 - ART_CX) / ART_RX
    dy = (y + 0.5 - ART_CY) / ART_RY
    d = (dx * dx + dy * dy) ** 0.5
    extra = ART_STEPS[-1][1]
    for limit, a in ART_STEPS:
        if d < limit:
            extra = a
            break
    return max(alpha_at(x, y), extra)


def main():
    args = [a for a in sys.argv[1:] if a != '--art']
    art = '--art' in sys.argv[1:]
    default = 'title-vignette-art.png' if art else 'title-vignette.png'
    out = args[0] if args else 'public/break_escape/assets/ui/' + default
    fn = art_alpha_at if art else alpha_at
    img = Image.new('RGBA', (W, H))
    img.putdata([(0, 0, 0, fn(x, y)) for y in range(H) for x in range(W)])
    img.save(out, optimize=True)
    print(f'wrote {out} ({W}x{H}, {len(set(p[3] for p in img.getdata()))} shades)')


if __name__ == '__main__':
    main()
