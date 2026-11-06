import sys
from PIL import Image, ImageDraw
# review.py OUT tour.png concept.png px400.png blended.png preview.png [tour_crop x0,y0,x1,y1]
out, tour, concept, px, blended, prev = sys.argv[1:7]
crop = sys.argv[7] if len(sys.argv) > 7 else None
H = 800
def fit(im, h=H):
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.NEAREST)
t = Image.open(tour).convert('RGB')
if crop: t = t.crop(tuple(int(v) for v in crop.split(',')))
tiles = [fit(t), fit(Image.open(concept).convert('RGB')), fit(Image.open(px).convert('RGB')), fit(Image.open(blended).convert('RGB'))]
top_w = sum(i.width for i in tiles) + 10 * (len(tiles) - 1)
p = Image.open(prev).convert('RGB')
p = p.resize((round(p.width * (top_w / 2) / p.width), round(p.height * (top_w / 2) / p.width)), Image.NEAREST) if p.width < top_w / 2 else p
canvas = Image.new('RGB', (max(top_w, p.width), H + 20 + p.height), (20, 20, 24))
x = 0
labels = ['in game (tour)', 'Gemini concept', '400px PixelLab', 'blended (used)']
d = ImageDraw.Draw(canvas)
for im, lab in zip(tiles, labels):
    canvas.paste(im, (x, 0)); d.text((x + 6, 6), lab, fill=(255, 255, 0)); x += im.width + 10
canvas.paste(p, (0, H + 20)); d.text((6, H + 26), 'game-chat preview (NPC speaking, then player)', fill=(255, 255, 0))
canvas.save(out)
print(out, canvas.size)
