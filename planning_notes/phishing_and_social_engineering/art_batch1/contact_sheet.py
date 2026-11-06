"""Viewing-only contact sheet: chosen pieces beside existing assets, nearest-neighbour x3."""
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); FIN = os.path.join(HERE, 'final')
A = os.path.join(HERE, '../../../public/break_escape/assets')
S = 3
def L(p): return Image.open(p).convert('RGBA')
rows = [
  ('Room objects (existing pc.png, notice_board1.png for scale)', '#5a5a5a',
   [(A+'/objects/pc.png','pc (existing)'), (FIN+'/mail_terminal.png','mail_terminal'),
    (A+'/objects/notice_board1.png','notice_board1 (existing)'), (FIN+'/case-file.png','case-file')]),
  ('Headshots (existing beside Hampshire)', '#5a5a5a',
   [(A+'/characters/female_office_worker_v2_headshot.png','existing'), (A+'/characters/hamza_iqbal_headshot.png','existing'),
    (FIN+'/hampshire_headshot.png','hampshire')]),
  ('Mail chrome on --ui-surface (existing icons/notes.png, heart.png for scale)', '#0c1224',
   [(A+'/icons/notes.png','notes (existing)'), (A+'/icons/heart.png','heart (existing)')] +
   [(FIN+'/'+n+'.png', n) for n in ['mail-inbox','mail-sent','mail-new','mail-account','mail-unread-dot','mail-chip-attachment','mail-chip-account']]),
  ('Attachment kinds and marks', '#0c1224',
   [(FIN+'/'+n+'.png', n.split('-',1)[1]) for n in ['attach-document','attach-pdf','attach-spreadsheet','attach-archive','attach-image','attach-link','mark-tick','mark-cross','mark-question','mark-exclamation']]),
  ('Frames (existing secops frame.png beside mail-frame)', '#2a2a2a',
   [(A+'/ui/themes/secops/frame.png','secops frame (existing)'), (FIN+'/mail-frame.png','mail-frame')]),
]
board = [(FIN+'/'+n+'.png', n.replace('board-','')) for n in ['board-card','board-card-pinned','board-pushpin','board-slot-empty','board-ready','board-not-ready','board-string']]
pad = 12; lab = 14
def row_img(title, bg, items):
    ims = [(L(p).resize((L(p).width*S, L(p).height*S), Image.NEAREST), t) for p, t in items]
    w = sum(max(i.width, len(t)*6) + pad for i, t in ims) + pad
    h = max(i.height for i, _ in ims) + lab*2 + pad*2
    c = Image.new('RGBA', (max(w, len(title)*6+2*pad), h), bg); d = ImageDraw.Draw(c)
    d.text((pad, 4), title, fill='white'); x = pad
    for i, t in ims:
        c.alpha_composite(i, (x, lab + pad)); d.text((x, lab + pad + i.height + 2), t, fill='white')
        x += max(i.width, len(t)*6) + pad
    return c
parts = [row_img(*r) for r in rows]
# board row drawn on the tiled cork at the same scale
b = row_img('Board pieces on board-cork.png (tiled)', '#000000', board)
cork = L(FIN+'/board-cork.png'); cork = cork.resize((cork.width*S, cork.height*S), Image.NEAREST)
bg = Image.new('RGBA', b.size)
for yy in range(0, b.height, cork.height):
    for xx in range(0, b.width, cork.width): bg.paste(cork, (xx, yy))
bg.alpha_composite(Image.new('RGBA', (b.width, lab+2), (0,0,0,160)))
dd = ImageDraw.Draw(bg); dd.text((pad, 4), 'Board pieces on board-cork.png (tiled)', fill='white')
x = pad
for p, t in board:
    i = L(p); i = i.resize((i.width*S, i.height*S), Image.NEAREST)
    bg.alpha_composite(i, (x, lab + pad)); dd.text((x, lab + pad + i.height + 2), t, fill='black')
    x += max(i.width, len(t)*6) + pad
parts.append(bg)
W = max(p.width for p in parts); H = sum(p.height for p in parts)
sheet = Image.new('RGBA', (W, H), '#202020'); y = 0
for p in parts: sheet.paste(p, (0, y)); y += p.height
sheet.save(os.path.join(HERE, 'contact_sheet.png')); print(sheet.size)
