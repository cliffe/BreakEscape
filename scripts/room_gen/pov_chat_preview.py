#!/usr/bin/env python3
"""Show how a conversation background is cropped in the person-chat frame.

Mirrors drawBackground() in public/break_escape/js/minigames/person-chat/person-chat-portraits.js:
the background is drawn at the portrait's pixel scale (canvas height / talk frame size,
calculateSpriteTalkScale) or "cover" if that is larger, centred vertically, right-aligned
while the NPC speaks (NPC on the right) and left-aligned while the player speaks.
Most talk portraits use 128 px frames, so a 400 px background is drawn about 6x and only
a band of it shows. A translucent box marks the speaker's portrait (drawPortraitFrame:
centred, shifted 20% of the width towards the speaker's side).

Usage:
  python3 scripts/room_gen/pov_chat_preview.py BACKGROUND.png OUT.png [--canvas 1400x790] [--frame 128] [--size 400]
Works on the 1024 px concept or the 400 px pixel art: both are shown as the 400 px file would be.
Writes one image: the NPC-speaking frame above the player-speaking frame.
"""
import argparse

from PIL import Image, ImageDraw


def frame(bg, cw, ch, talk_frame, npc):
    s = max(min(cw, ch) / talk_frame, cw / bg.width, ch / bg.height)
    w, h = round(bg.width * s), round(bg.height * s)
    big = bg.resize((w, h), Image.NEAREST)
    x = cw - w if npc else 0
    y = (ch - h) // 2
    out = Image.new("RGB", (cw, ch))
    out.paste(big, (x, y))
    ov = Image.new("RGBA", (cw, ch))
    d = ImageDraw.Draw(ov)
    side = min(cw, ch)
    px0 = int((cw - side) / 2 + (0.2 * cw if npc else -0.2 * cw))
    d.rectangle((px0, (ch - side) // 2, px0 + side, (ch + side) // 2), fill=(255, 0, 255, 50), outline=(255, 0, 255, 200), width=3)
    out = Image.alpha_composite(out.convert("RGBA"), ov).convert("RGB")
    ImageDraw.Draw(out).text((10, 10), "NPC speaking" if npc else "player speaking", fill=(255, 255, 0))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("background")
    ap.add_argument("out")
    ap.add_argument("--canvas", default="1400x790")
    ap.add_argument("--size", type=int, default=400, help="size the background is shipped at (400); concepts are resized to it")
    ap.add_argument("--frame", type=int, default=128, help="talk portrait frame size in px (most are 128)")
    a = ap.parse_args()
    cw, ch = (int(v) for v in a.canvas.split("x"))
    bg = Image.open(a.background).convert("RGB")
    if bg.size != (a.size, a.size):   # a 1024 px concept stands in for the 400 px pixel art
        bg = bg.resize((a.size, a.size), Image.LANCZOS)
    sheet = Image.new("RGB", (cw, ch * 2 + 10), (40, 40, 40))
    sheet.paste(frame(bg, cw, ch, a.frame, True), (0, 0))
    sheet.paste(frame(bg, cw, ch, a.frame, False), (0, ch + 10))
    sheet.thumbnail((1000, 2000))
    sheet.save(a.out)
    print("wrote", a.out)


if __name__ == "__main__":
    main()
