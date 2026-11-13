"""Assemble the chosen batch-1 pieces into art_batch1/final/ at native size.

Only crops (of transparent margin or a 1px generator border), pixel recolours and
hand-placed pixels. Nothing is resized. Run with python3 -I from anywhere.
"""
import os
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'final')
os.makedirs(OUT, exist_ok=True)

def load(rel):
    return Image.open(os.path.join(HERE, rel)).convert('RGBA')

def trim(im):
    return im.crop(im.getbbox())

def centre(im):
    # shift the content to the middle of its canvas (whole pixels; no scaling)
    l, t, r, b = im.getbbox()
    c = Image.new('RGBA', im.size, (0, 0, 0, 0))
    c.alpha_composite(im.crop((l, t, r, b)), ((im.width - (r - l)) // 2, (im.height - (b - t)) // 2))
    return c

def save(im, name):
    if im.size == (16, 16):
        im = centre(im)
    im.save(os.path.join(OUT, name))
    print(name, im.size)

# --- picks straight from PixelLab (crop transparent margin only where noted)
save(trim(load('obj1_mail_terminal_v2/c08.png')), 'mail_terminal.png')
save(trim(load('obj2_case_file_v2/c31.png')), 'case-file.png')
# Pro returned the bust wrapped horizontally by half its width; offset is a pixel shift, not a scale
save(ImageChops.offset(load('npc5_hampshire/c10.png'), 16, 0), 'hampshire_headshot.png')
save(load('ui1_frame/c03.png'), 'mail-frame.png')
for name, src in [('mail-inbox.png', 'ui1_inbox/c60.png'), ('mail-sent.png', 'ui1_sent/c40.png'),
                  ('mail-new.png', 'ui3_newmail/c09.png'), ('mail-account.png', 'ui1_account/c00.png'),
                  ('attach-document.png', 'ui2_document/c09.png'), ('attach-pdf.png', 'ui2_pdf_v2/c12.png'),
                  ('attach-spreadsheet.png', 'ui2_spreadsheet/c63.png'), ('attach-archive.png', 'ui2_archive/c41.png'),
                  ('attach-image.png', 'ui2_image/c09.png'), ('attach-link.png', 'ui2_link/c52.png'),
                  ('mark-tick.png', 'ui4_tick/c56.png'), ('mark-cross.png', 'ui4_cross/c59.png'),
                  ('mark-question.png', 'ui4_question/c47.png'), ('mark-exclamation.png', 'ui4_exclamation/c18.png'),
                  ('board-ready.png', 'ui7_ready/c56.png')]:
    save(load(src), name)
save(trim(load('ui6_pushpin/c00.png')), 'board-pushpin.png')

# cork: PixelLab drew a 1px dark border round the texture; crop it so the tile repeats
save(load('ui6_cork/c01.png').crop((1, 1, 63, 63)), 'board-cork.png')

# pinned card: crop transparent margin
card = load('ui6_card/c13.png')
save(trim(card), 'board-card-pinned.png')
# plain card for 9-slicing: paint the pin out (pin sits on the top edge, x 22-28, y 6-14)
plain = card.copy(); px = plain.load()
edge = px[10, 9]; paper = px[10, 12]
for y in range(6, 9):
    for x in range(20, 30):
        px[x, y] = (0, 0, 0, 0)
for x in range(20, 30):
    px[x, 9] = edge
for y in range(10, 15):
    for x in range(20, 30):
        px[x, y] = paper
save(trim(plain), 'board-card.png')

# not-ready lamp: the ready lamp with its glass switched off and an amber dash
ready = load('ui7_ready/c56.png'); off = ready.copy(); p = off.load()
for y in range(16):
    for x in range(16):
        r, g, b, a = p[x, y]
        if a == 0:
            continue
        if g > 120 and g > r + 15 or (r > 200 and g > 200 and b > 150):   # green glass and white tick
            p[x, y] = (40, 52, 74, 255) if (x + y) % 5 else (52, 66, 92, 255)
        elif g > r + 25:   # green glow on the ring
            p[x, y] = (47, 56, 72, 255)
AMBER, AMBER_D = (255, 176, 58, 255), (192, 122, 28, 255)
for x in range(5, 11):
    p[x, 7] = AMBER; p[x, 8] = AMBER_D
save(off, 'board-not-ready.png')

# --- hand-placed pieces in the secops palette (css/ui-themes.css)
OUTL = (2, 2, 6, 255); LINE = (47, 95, 158, 255); SLOT = (21, 29, 53, 255)
FRAME = (95, 190, 223, 255); FAINT = (88, 113, 154, 255)

def grid(rows, colours):
    h, w = len(rows), len(rows[0]); im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); q = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != '.':
                q[x, y] = colours[ch]
    return im

# unread dot 8x8: amber accent with outline and a highlight
save(grid(['..oooo..',
           '.oAAAAo.',
           'oAHAAAAo',
           'oAAAAADo',
           'oAAAAADo',
           'oAAAADDo',
           '.oADDDo.',
           '..oooo..'],
          {'o': OUTL, 'A': AMBER, 'H': (255, 226, 160, 255), 'D': AMBER_D}), 'mail-unread-dot.png')

def chip(border, w=24, h=12):
    rows = []
    for y in range(h):
        r = ''
        for x in range(w):
            cx = min(x, w - 1 - x); cy = min(y, h - 1 - y)
            if cx + cy < 2:
                r += '.'
            elif cx == 0 or cy == 0 or cx + cy == 2:
                r += 'o'
            elif cx == 1 or cy == 1 or cx + cy == 3:
                r += 'b'
            else:
                r += 's'
        rows.append(r)
    return grid(rows, {'o': OUTL, 'b': border, 's': SLOT})

save(chip(LINE), 'mail-chip-attachment.png')   # 9-slice 4
save(chip(FRAME), 'mail-chip-account.png')     # 9-slice 4

# empty slot 16x16: dashed square and a "?" (reads on cream cards and on navy)
DASH = (125, 116, 104, 255)
rows = ['................',
        '.dd.dd.dd.dd.dd.',
        '.d............d.',
        '................',
        '.d....qqqq....d.',
        '.d...qq..qq...d.',
        '.........qq.....',
        '........qq....d.',
        '.d.....qq.....d.',
        '.d.....qq.......',
        '................',
        '.d.....qq.....d.',
        '.d.....qq.....d.',
        '................',
        '.d............d.',
        '.dd.dd.dd.dd.dd.']
save(grid(rows, {'d': DASH, 'q': DASH}), 'board-slot-empty.png')

# string: 8x2 tile of red yarn, repeats along x; rotate with CSS transform for angles
save(grid(['RrRRhRrR',
           'dRddRdRd'],
          {'R': (192, 40, 42, 255), 'r': (168, 32, 36, 255), 'h': (226, 86, 80, 255), 'd': (124, 21, 24, 255)}),
     'board-string.png')
