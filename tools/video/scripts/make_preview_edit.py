#!/usr/bin/env python3
"""Catalogue preview (Hacktivity placement D) from an approved Cyber Aware trailer edit. Plan: docs/video/CA_PREVIEW_CUTS_PLAN.md.

  python3 tools/video/scripts/make_preview_edit.py <trailer edit id> <mission name> <shot>[:<offset>:<dur>] ...
  e.g. make_preview_edit.py ca03_trailer_r1 ca03_helpdesk_reset build:0:4.5 lands:0:4.5 flip:0:2.5 queue_a:0.5:5 office:0:4

Writes tools/video/edits/<epNN>_preview.json: the named gameplay shots in the order given, each cut to <dur> s starting <offset> s
into the trailer shot (so the preview never shows a frame outside the trailer's own in/out points), with no music, narrator,
captions, lines or seat labels (the tile crops the frame with CSS and shows the episode name itself). With no offset and dur
the whole trailer shot is used. The loop cross-fade is added after the render (render_preview.sh), not in the edit.
"""
import json, sys, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
src_id, mission_name, picks = sys.argv[1], sys.argv[2], sys.argv[3:]
if not picks: sys.exit(__doc__)
d = json.load(open(f'{REPO}/tools/video/edits/{src_id}.json'))
S = {s['id']: s for s in d['shots']}
ep = d['mission']
shots = []
for p in picks:
    sid, *rest = p.split(':')
    s = S.get(sid)
    if not s: sys.exit(f'no shot {sid} in {src_id}: {list(S)}')
    if s.get('type') != 'gameplay': sys.exit(f'{sid} is {s.get("type")}, not gameplay')
    off, dur = (float(rest[0]), float(rest[1])) if rest else (0.0, s['duration'])
    if off < 0 or off + dur > s['duration'] + 1e-6: sys.exit(f'{sid}: {off}+{dur} runs past the trailer shot ({s["duration"]} s)')
    src = dict(s['source']); a = src['in'] + off
    src['in'], src['out'] = round(a, 3), round(a + dur, 3)
    n = {'id': sid, 'type': 'gameplay', 'duration': round(dur, 3), 'join': {'type': 'cut'}, 'source': src,
         'audio': {'gain_db': -60}, 'seat': 'full', 'framing': {'16:9': s.get('framing', {}).get('16:9', {'cx': 0.5, 'cy': 0.5, 'zoom': 1.0})},
         'caption': {'16:9': False, '9:16': False, '1:1': False},
         'spoiler': dict(s.get('spoiler', {}), note=f'PREVIEW from {src_id}/{sid}: {off:.2f} s in, {dur:.2f} s (inside the trailer shot; same spoiler judgement) | ' + (s.get('spoiler', {}).get('note') or ''))}
    shots.append(n)
length = round(sum(s['duration'] for s in shots), 3)
out = {'mission': ep, 'id': f'{ep}_preview', 'kind': 'preview', 'theme': d.get('theme', 'ca'),
       'title': f'Cyber Aware {ep} catalogue preview ({mission_name}_preview.mp4), silent loop from {src_id}',
       'preview_for': mission_name, 'source_edit': src_id, 'fps': d.get('fps', 30), 'length': length,
       'music': {'none': True}, 'beat': d.get('beat'), 'duck': d.get('duck'), 'audio': d.get('audio', {}), 'shots': shots, 'vo': []}
p = f'{REPO}/tools/video/edits/{ep}_preview.json'
with open(p, 'w') as f:
    json.dump(out, f, indent=1, ensure_ascii=False); f.write('\n')
print(p, 'length', length, [(s['id'], s['duration']) for s in shots])
if not 17.5 <= length <= 22.5: print('WARNING: preview should be about 20 s (18 to 22)')
