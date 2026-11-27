#!/usr/bin/env python3
"""Build a screenshot slideshow MP4 from a folder of 1920x1080 stills. See make-slideshow.sh."""
import argparse, json, os, re, subprocess, sys, shutil
from PIL import Image, ImageDraw, ImageFont

FPS = 25
def run(cmd):
    print('+', ' '.join(map(str, cmd))[:200], flush=True)
    return subprocess.run(['nice', '-n', '19'] + [str(c) for c in cmd], check=True, capture_output=True, text=True)

def gradient(w=1920, h=1080, top=(10, 14, 46), bot=(62, 24, 94)):
    im = Image.new('RGB', (w, h)); px = im.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(w): px[x, y] = c
    return im

def card(path, lines, font):
    im = gradient(); d = ImageDraw.Draw(im)
    y = 540 - sum(s + 40 for _, s, _ in lines) // 2
    for text, size, col in lines:
        f = ImageFont.truetype(font, size); w = d.textlength(text, font=f)
        while w > 1800 and size > 16: size -= 4; f = ImageFont.truetype(font, size); w = d.textlength(text, font=f)   # long titles shrink to fit
        d.text(((1920 - w) // 2 + 4, y + 4), text, font=f, fill=(0, 0, 0)); d.text(((1920 - w) // 2, y), text, font=f, fill=col)
        y += size + 40
    im.save(path)

def captioned(src, dst, text, font):
    im = Image.open(src).convert('RGB'); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(font, 26); w = d.textlength(text, font=f)
    d.rectangle((0, 990, 1920, 1080), fill=(8, 8, 24)); d.text(((1920 - w) // 2, 1022), text, font=f, fill=(255, 255, 255))
    im.save(dst)

def main():
    a = argparse.ArgumentParser()
    a.add_argument('stills'); a.add_argument('--captions'); a.add_argument('--out', required=True)
    a.add_argument('--title', default='SAFETYNET: Licence to Hack'); a.add_argument('--subtitle', default='Mission 1: First Contact')
    a.add_argument('--end1', default='Play now'); a.add_argument('--end2', default='hacktivity.co.uk')
    a.add_argument('--music', required=True); a.add_argument('--font', required=True)
    a.add_argument('--hold', type=float, default=3.0); a.add_argument('--xfade', type=float, default=0.5)
    a.add_argument('--card-secs', type=float, default=4.0); a.add_argument('--burn-captions', action='store_true')
    a.add_argument('--lufs', type=float, default=-14); a.add_argument('--work', required=True)
    a.add_argument('--review', help='also write a small review encode here')
    o = a.parse_args()
    os.makedirs(o.work, exist_ok=True)
    caps = json.load(open(o.captions)) if o.captions else [{'file': f} for f in sorted(os.listdir(o.stills)) if re.match(r'\d+_.*\.png$', f)]
    items = []
    card(f'{o.work}/c_open.png', [(o.title.upper(), 88, (255, 255, 255)), (o.subtitle, 36, (200, 170, 255))], o.font); items.append(('c_open.png', o.card_secs + 1))
    card(f'{o.work}/c_end.png', [(o.end1, 56, (255, 255, 255)), (o.end2, 44, (120, 255, 170))], o.font)
    for i, c in enumerate(caps):
        src = os.path.join(o.stills, c['file']); dst = f'{o.work}/s{i:02d}.png'
        if o.burn_captions and c.get('caption'): captioned(src, dst, c['caption'], o.font)
        else: shutil.copy(src, dst)
        items.append((f's{i:02d}.png', o.hold))
    items.append(('c_end.png', o.card_secs + 1))
    # clips: 4x nearest upscale then zoompan (source px stay crisp), alternating zoom in / out / pan
    clips = []
    for k, (f, secs) in enumerate(items):
        n = int(round((secs + o.xfade) * FPS)); out = f'{o.work}/clip{k:02d}.mp4'
        if os.environ.get('REUSE_CLIPS') and os.path.exists(out): clips.append((out, n / FPS)); continue
        big = f'{o.work}/big{k:02d}.png'
        Image.open(f'{o.work}/{f}').convert('RGB').resize((7680, 4320), Image.NEAREST).save(big)
        card_clip = f.startswith('c_')
        z = 0.06 if not card_clip else 0.03
        mode = k % 4
        if mode == 0: zz, xx, yy = f'1+{z}*on/{n}', 'iw/2-iw/zoom/2', 'ih/2-ih/zoom/2'
        elif mode == 1: zz, xx, yy = f'1+{z}-{z}*on/{n}', 'iw/2-iw/zoom/2', 'ih/2-ih/zoom/2'
        elif mode == 2: zz, xx, yy = f'1+{z}', f'(iw-iw/zoom)*on/{n}', 'ih/2-ih/zoom/2'
        else: zz, xx, yy = f'1+{z}', f'(iw-iw/zoom)*(1-on/{n})', 'ih/2-ih/zoom/2'
        run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-i', big, '-vf',
             f"zoompan=z='{zz}':x='{xx}':y='{yy}':d={n}:s=1920x1080:fps={FPS},format=yuv420p",
             '-frames:v', n, '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', out])
        os.remove(big); clips.append((out, n / FPS))
    # xfade chain
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for c, _ in clips: cmd += ['-i', c]
    fl, last, t = [], '[0:v]', clips[0][1]
    for i in range(1, len(clips)):
        off = t - o.xfade; nxt = f'[v{i}]'
        fl.append(f'{last}[{i}:v]xfade=transition=fade:duration={o.xfade}:offset={off:.3f}{nxt}'); last = nxt; t = off + clips[i][1]
    total = t
    fl.append(f'{last}format=yuv420p[vout]')
    vid = f'{o.work}/video.mp4'
    run(cmd + ['-filter_complex', ';'.join(fl), '-map', '[vout]', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-r', FPS, vid])
    # audio: fade, two-pass loudnorm
    af = f'atrim=0:{total:.3f},asetpts=N/SR/TB,afade=t=in:d=2,afade=t=out:st={total-3:.3f}:d=3'
    m = run(['ffmpeg', '-v', 'info', '-y', '-i', o.music, '-af', af + f',loudnorm=I={o.lufs}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    j = json.loads(m.stderr[m.stderr.rindex('{'):])
    ln = (f"loudnorm=I={o.lufs}:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    aud = f'{o.work}/audio.m4a'
    run(['ffmpeg', '-v', 'error', '-y', '-i', o.music, '-af', af + ',' + ln + ',aresample=48000,aformat=sample_fmts=fltp', '-vn', '-ar', 48000, '-c:a', 'aac', '-b:a', '192k', aud])
    os.makedirs(os.path.dirname(o.out), exist_ok=True)
    run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', aud, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-t', f'{total:.3f}', '-movflags', '+faststart', o.out])
    if o.review:
        run(['ffmpeg', '-v', 'error', '-y', '-i', o.out, '-vf', 'scale=1280:720:flags=neighbor', '-c:v', 'libx264', '-crf', '27', '-maxrate', '1500k', '-bufsize', '3000k',
             '-preset', 'slow', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', o.review])
    chk = run(['ffmpeg', '-i', o.out, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    print(chk[chk.rindex('Integrated loudness'):])
    print('duration', round(total, 2))
main()
