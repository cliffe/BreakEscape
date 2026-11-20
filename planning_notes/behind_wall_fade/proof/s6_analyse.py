# Pixel readings for the s6 shots: python3 s6_analyse.py test|m01
import json, sys
from PIL import Image
w = sys.argv[1]
g = json.load(open(f's6_{w}.json'))
A, B, U = [Image.open(f's6_{w}_{n}.png').convert('RGB') for n in ('faded', 'hidden', 'unfaded')]
z = g['zoom']; sx, sy = g['scrollX'], g['scrollY']
Sy = g['Spos']['y']; px = g['player']['bodyCenterX']
X = lambda wx: round((wx - sx) * z); Y = lambda wy: round((wy - sy) * z)
def diff(a, b, x0, x1, y0, y1):
    n = d = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            n += 1; p, q = a.getpixel((x, y)), b.getpixel((x, y))
            if max(abs(p[i] - q[i]) for i in range(3)) > 4: d += 1
    return d, n
cx = X(px)
# columns well clear of the player (and anything else): 48..16 px left of the player is not guaranteed clear, use 60 px each side
for name, (x0, x1) in {'player cols': (cx - 14, cx + 14), 'clear cols': (cx + 80, cx + 160)}.items():
    for lab, (r0, r1) in {'above band (S.y+36..51)': (36, 52), 'band rows (S.y+52..63)': (52, 64)}.items():
        # faded-without-player vs unfaded: stripe gone => band rows equal
        d, n = diff(B, U, x0, x1, Y(Sy + r0), Y(Sy + r1))
        print(f'{name:12s} {lab:26s} hidden-player vs unfaded: {d}/{n} px differ')
# feet: faded with player vs faded without player, per 4-row slice
for r in range(36, 64, 4):
    d, n = diff(A, B, cx - 24, cx + 24, Y(Sy + r), Y(Sy + r + 4))
    print(f'player vs no-player S.y+{r}..{r+4}: {d}/{n} px differ')
# mean blend at the feet row: pixel in A vs B vs raw
for r in (56, 58, 60):
    y = Y(Sy + r); row = [(x, A.getpixel((x, y)), B.getpixel((x, y))) for x in range(cx - 24, cx + 24) if A.getpixel((x, y)) != B.getpixel((x, y))]
    print(f'row S.y+{r}: {len(row)} differing px; sample A/B', row[:2])
# crops: 4x nearest around the feet strip
box = (cx - 40, Y(Sy + 36), cx + 40, Y(Sy + 76))
for n, im in (('faded', A), ('hidden', B), ('unfaded', U)):
    im.crop(box).resize((80 * 4, 40 * 4), Image.NEAREST).save(f's6_{w}_crop4x_{n}.png')
