# Split PixelLab beanbag1 (two overlapping bags) into one bag per sprite, no rescale:
# keep the front (orange) bag with its outline, close its open left edge, crop;
# make a teal copy by mapping orange shades onto the teal bag's shades by brightness rank.
import colorsys
from PIL import Image
O = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/public/break_escape/assets/objects/'
im = Image.open(O + 'beanbag1.png').convert('RGBA'); p = im.load(); W, H = im.size
def kind(c):
    if c[3] == 0: return ' '
    h, s, v = colorsys.rgb_to_hsv(*[x / 255 for x in c[:3]])
    if v < 0.25: return '#'
    if s > 0.3 and (h < 0.12 or h > 0.95): return 'o'
    if s > 0.2 and 0.4 < h < 0.6: return 't'
    return '?'
K = [[kind(p[x, y]) for x in range(W)] for y in range(H)]
def near_o(x, y):
    return any(0 <= x + dx < W and 0 <= y + dy < H and K[y + dy][x + dx] == 'o' for dx in (-1, 0, 1) for dy in (-1, 0, 1))
outline = next(p[x, y] for y in range(H) for x in range(W) if K[y][x] == '#')
out = Image.new('RGBA', (W, H)); q = out.load()
for y in range(H):
    for x in range(W):
        k = K[y][x]
        if k == 'o': q[x, y] = p[x, y]
        elif k in '#?' and near_o(x, y): q[x, y] = p[x, y]
        elif k == 't' and near_o(x, y): q[x, y] = outline   # close the edge where the bags touched
orange = out.crop(out.getbbox()); orange.save(O + 'beanbag_orange1.png')
teal_cols = sorted({p[x, y] for y in range(H) for x in range(W) if K[y][x] == 't'}, key=lambda c: sum(c[:3]))
org_cols = sorted({c for c in orange.getdata() if c[3] and kind(c) == 'o'}, key=lambda c: sum(c[:3]))
m = {c: teal_cols[round(i * (len(teal_cols) - 1) / max(1, len(org_cols) - 1))] for i, c in enumerate(org_cols)}
teal = orange.copy(); t = teal.load()
for y in range(teal.height):
    for x in range(teal.width):
        if t[x, y] in m: t[x, y] = m[t[x, y]]
teal.save(O + 'beanbag_teal1.png')
print('orange', orange.size, 'teal', teal.size, len(org_cols), '->', len(teal_cols))
