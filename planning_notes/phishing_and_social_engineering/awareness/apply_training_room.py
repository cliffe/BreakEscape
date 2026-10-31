#!/usr/bin/env python3
"""Splice the training-room wiring (TRAINING_ROOM_PLAN.md §6) into the 7
hand-written full awareness shells, preserving their original formatting.

The full shells have mixed formatting (two round-trip through json.dumps(indent=2),
five do not), so we never re-dump them. Instead we splice the same six fields the
generators now add as text, then load the result and assert it equals the old JSON
with exactly those fields changed:

  * rooms.training_room.type        room_office -> room_aw_<company>
  * rooms.training_room.npcs[0].position  {3,3} -> HOST_POSITION
  * objects[kiosk].position         removed (the map slot places the kiosk)
  * top-level startPosition         inserted after startRoom
  * top-level lighting              inserted before rooms
  * rooms.training_room.lighting    inserted after door_sign

chatBackground (the room-wide POV background) is spliced by --refresh, after door_sign.

Usage: python3 apply_training_room.py           # patch the 7 shells in the repo
       python3 apply_training_room.py <outdir>  # write patched copies to <outdir>

Refresh (shells already wired, all 38 awareness shells): re-splice the fields that
come from training_room.py and training_room_lighting.json after either changes,
leaving everything else in the file byte for byte:

  * top-level lighting, rooms.training_room.lighting, the host's position,
    rooms.training_room.chatBackground (inserted after door_sign if absent)

       python3 apply_training_room.py --refresh           # in place
       python3 apply_training_room.py --refresh <outdir>  # patched copies to <outdir>
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import training_room  # noqa: E402

REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'

FULL_SHELLS = [
    'awareness_e1_invoice_fraud',
    'awareness_e2_cv_lures',
    'awareness_e3_helpdesk_reset',
    'awareness_e4_exec_whaling',
    'awareness_e5_signin_pages',
    'awareness_e6_texts_and_qr',
    'awareness_e7_voice_ceo',
]

HOST_BLOCK_OLD = (
    '          "position": {\n'
    '            "x": 3,\n'
    '            "y": 3\n'
    '          },\n'
)
KIOSK_BLOCK_OLD = (
    '          "position": {\n'
    '            "x": 6,\n'
    '            "y": 2\n'
    '          },\n'
)


def _indented(value, base):
    """json.dumps(value, indent=2), with every line after the first shifted right
    by `base` spaces so it sits under a key at `base` indentation."""
    pad = ' ' * base
    return json.dumps(value, indent=2, ensure_ascii=False).replace('\n', '\n' + pad)


def expected(old):
    """The old shell with exactly the six wiring fields applied (field-wise, order
    independent), used to assert the text splice is correct."""
    d = copy.deepcopy(old)
    company = d['social']['awarenessEpisode']['company']
    out = {}
    for k, v in d.items():
        if k == 'rooms':
            out['lighting'] = training_room.scenario_lighting(company)
        out[k] = v
        if k == 'startRoom':
            out['startPosition'] = copy.deepcopy(training_room.START_POSITION)
    tr = copy.deepcopy(out['rooms']['training_room'])
    rf = training_room.room_fields(company)
    newtr = {'type': rf['type'], 'door_sign': tr['door_sign']}
    if 'chatBackground' in rf:
        newtr['chatBackground'] = rf['chatBackground']
    newtr['lighting'] = rf['lighting']
    for k, v in tr.items():
        if k in ('type', 'door_sign'):
            continue
        newtr[k] = v
    for n in newtr['npcs']:
        if n.get('position') == {'x': 3, 'y': 3}:
            n['position'] = copy.deepcopy(training_room.HOST_POSITION)
    for o in newtr['objects']:
        if o.get('type') == 'kiosk':
            o.pop('position', None)
    out['rooms'] = {'training_room': newtr}
    return out


def patch_text(text, company):
    rf = training_room.room_fields(company)
    room_type = rf['type']
    room_lighting = rf['lighting']
    scen_lighting = training_room.scenario_lighting(company)
    start_pos = copy.deepcopy(training_room.START_POSITION)

    # 1. room type
    assert text.count('      "type": "room_office",') == 1, 'room type not unique'
    text = text.replace('      "type": "room_office",',
                        f'      "type": "{room_type}",', 1)

    # 2. host position {3,3} -> HOST_POSITION  (unique block)
    assert text.count(HOST_BLOCK_OLD) == 1, 'host position block not unique'
    host_new = (
        '          "position": {\n'
        f'            "x": {training_room.HOST_POSITION["x"]},\n'
        f'            "y": {training_room.HOST_POSITION["y"]}\n'
        '          },\n'
    )
    text = text.replace(HOST_BLOCK_OLD, host_new, 1)

    # 3. kiosk position removed (unique block)
    assert text.count(KIOSK_BLOCK_OLD) == 1, 'kiosk position block not unique'
    text = text.replace(KIOSK_BLOCK_OLD, '', 1)

    # 4. startPosition after startRoom (top level, 2-space base)
    anchor = '  "startRoom": "training_room",\n'
    assert text.count(anchor) == 1, 'startRoom anchor not unique'
    text = text.replace(anchor, anchor + f'  "startPosition": {_indented(start_pos, 2)},\n', 1)

    # 5. scenario lighting before rooms (top level, 2-space base)
    anchor = '  "rooms": {\n'
    assert text.count(anchor) == 1, 'rooms anchor not unique'
    text = text.replace(anchor, f'  "lighting": {_indented(scen_lighting, 2)},\n' + anchor, 1)

    # 6. room lighting after door_sign (6-space base)
    anchor = '      "door_sign": "Training Room",\n'
    assert text.count(anchor) == 1, 'door_sign anchor not unique'
    text = text.replace(anchor, anchor + f'      "lighting": {_indented(room_lighting, 6)},\n', 1)

    return text


def _value_span(text, anchor):
    """(start, end) of the JSON value after the one line `anchor` (e.g. '  "lighting": ')."""
    import re
    hits = [m for m in re.finditer(r'(?m)^' + re.escape(anchor), text)]
    assert len(hits) == 1, f'{anchor!r}: {len(hits)} matches'
    start = hits[0].end()
    _, end = json.JSONDecoder().raw_decode(text, start)
    return start, end


def refresh_text(text):
    """Re-splice scenario lighting, room lighting and the host position from training_room."""
    old = json.loads(text)
    company = old['social']['awarenessEpisode']['company']
    rf = training_room.room_fields(company)
    for anchor, value, base in (
            ('  "lighting": ', training_room.scenario_lighting(company), 2),
            ('      "lighting": ', rf['lighting'], 6)):
        a, b = _value_span(text, anchor)
        text = text[:a] + _indented(value, base) + text[b:]
    a, b = _value_span(text, '          "position": ')
    text = text[:a] + _indented(copy.deepcopy(training_room.HOST_POSITION), 10) + text[b:]
    if 'chatBackground' in rf:
        if '\n      "chatBackground": ' in text:
            a, b = _value_span(text, '      "chatBackground": ')
            text = text[:a] + json.dumps(rf['chatBackground']) + text[b:]
        else:
            anchor = '      "door_sign": "Training Room",\n'
            assert text.count(anchor) == 1, 'door_sign anchor not unique'
            text = text.replace(anchor, anchor + f'      "chatBackground": {json.dumps(rf["chatBackground"])},\n', 1)
    # the result must equal the old shell with exactly those three fields replaced
    exp = copy.deepcopy(old)
    exp['lighting'] = training_room.scenario_lighting(company)
    exp['rooms']['training_room']['lighting'] = rf['lighting']
    if 'chatBackground' in rf:
        # same key order as the generators: type, door_sign, chatBackground, lighting
        tr = exp['rooms']['training_room']
        rebuilt = {}
        for k, v in tr.items():
            if k == 'chatBackground':
                continue
            rebuilt[k] = v
            if k == 'door_sign':
                rebuilt['chatBackground'] = rf['chatBackground']
        exp['rooms']['training_room'] = rebuilt
    hosts = [n for n in exp['rooms']['training_room']['npcs'] if 'position' in n]
    assert len(hosts) == 1, 'expected one positioned host'
    hosts[0]['position'] = copy.deepcopy(training_room.HOST_POSITION)
    assert json.loads(text) == exp, 'refresh changed more than the four fields'
    return text


def refresh(outdir):
    import glob
    for path in sorted(glob.glob(os.path.join(REPO, 'scenarios', 'awareness_*', 'scenario.json.erb'))):
        name = os.path.basename(os.path.dirname(path))
        text = open(path).read()
        if not json.loads(text)['rooms']['training_room']['type'].startswith('room_aw_'):
            print('SKIP (not wired):', name)
            continue
        new = refresh_text(text)
        dest = path
        if outdir:
            d = os.path.join(outdir, name)
            os.makedirs(d, exist_ok=True)
            dest = os.path.join(d, 'scenario.json.erb')
        elif new == text:
            continue
        with open(dest, 'w') as f:
            f.write(new)
        print('wrote', dest, '' if new != text else '(unchanged)')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--refresh':
        refresh(sys.argv[2] if len(sys.argv) > 2 else None)
        return
    outdir = sys.argv[1] if len(sys.argv) > 1 else None
    for name in FULL_SHELLS:
        path = os.path.join(REPO, 'scenarios', name, 'scenario.json.erb')
        text = open(path).read()
        old = json.loads(text)
        if 'startPosition' in old or 'lighting' in old:
            print('SKIP (already wired):', name)
            continue
        company = old['social']['awarenessEpisode']['company']
        patched_text = patch_text(text, company)
        patched = json.loads(patched_text)          # must parse
        exp = expected(old)
        assert patched == exp, f'{name}: patched JSON != expected transform'
        if outdir:
            d = os.path.join(outdir, name)
            os.makedirs(d, exist_ok=True)
            dest = os.path.join(d, 'scenario.json.erb')
        else:
            dest = path
        with open(dest, 'w') as f:
            f.write(patched_text)
        print('wrote', dest)


if __name__ == '__main__':
    main()
