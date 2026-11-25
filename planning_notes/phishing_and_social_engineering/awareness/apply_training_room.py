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

Usage: python3 apply_training_room.py [--repo <checkout>]           # patch the 7 shells in the repo
       python3 apply_training_room.py [--repo <checkout>] <outdir>  # write patched copies to <outdir>

The repository root is --repo <path>, else the checkout this script sits
in, so a run from a worktree touches that worktree, never the main checkout.

Refresh (shells already wired, every wired awareness shell): re-splice the fields that
come from training_room.py and training_room_lighting.json after either changes,
leaving everything else in the file byte for byte:

  * top-level lighting, rooms.training_room.lighting, the host's position,
    rooms.training_room.chatBackground (inserted after door_sign if absent)

       python3 apply_training_room.py [--repo <checkout>] --refresh           # in place
       python3 apply_training_room.py [--repo <checkout>] --refresh <outdir>  # patched copies to <outdir>

Kit mode (living office, LIVING_OFFICE_PLAN.md 4.4): splice the office kit's content into every shell
whose episodes.json row has a tier (a hand-authored shell, or a generated one you want to patch):

       python3 apply_training_room.py [--repo <checkout>] --kit <outdir> [--allow-drop]   # patched copies to <outdir>

The outdir is required: the tool never writes into scenarios/ (generate into scratch, diff, copy back what
you mean to change). A shell holding hand-written kit content that the kit data would not write back is
refused with the names of what would go; move it into the kit data (a set piece's staff patches, mappings,
globals, timers, objects), or pass --allow-drop to erase it on purpose.

Old kit-owned members (office_kit ownership by name) are removed and the current ones inserted as
text; every other byte of the file is left alone. The result is loaded and must equal
office_kit.apply_kit() of the old shell, so the only differences are kit-owned places. A shell with no
tiered row is skipped; a row for a shell that does not exist is an error. The kiosk's finished text
is a hand edit and is not touched.

The host is found by id (the NPC whose storyPath is its own shell's ink) and its position
replaced by structure, so room NPCs that also carry a position (kit staff) do not matter.
"""
import copy
import json
import re
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import training_room  # noqa: E402
import awareness_deploy  # noqa: E402
import office_kit  # noqa: E402

REPO = awareness_deploy.repo_root()   # --repo <path>, else this script's own checkout

FULL_SHELLS = [
    'ca01_invoice_fraud',
    'ca02_cv_lures',
    'ca03_helpdesk_reset',
    'ca04_exec_whaling',
    'ca05_signin_pages',
    'ca06_texts_and_qr',
    'ca07_voice_ceo',
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


_DEC = json.JSONDecoder()


def _ws(text, i):
    while text[i] in ' \t\r\n':
        i += 1
    return i


def _members(text, i):
    """Yield (key, value_start, value_end) for each member of the JSON object whose '{' is at i."""
    assert text[i] == '{', 'expected an object'
    i = _ws(text, i + 1)
    while text[i] != '}':
        key, i = _DEC.raw_decode(text, i)
        i = _ws(text, i)
        assert text[i] == ':', 'malformed object'
        i = _ws(text, i + 1)
        start = i
        _, i = _DEC.raw_decode(text, i)
        yield key, start, i
        i = _ws(text, i)
        if text[i] == ',':
            i = _ws(text, i + 1)


def _elements(text, i):
    """Yield (value_start, value_end) for each element of the JSON array whose '[' is at i."""
    assert text[i] == '[', 'expected an array'
    i = _ws(text, i + 1)
    while text[i] != ']':
        start = i
        _, i = _DEC.raw_decode(text, i)
        yield start, i
        i = _ws(text, i)
        if text[i] == ',':
            i = _ws(text, i + 1)


def _member(text, obj_start, key):
    """(start, end) of the value of `key` in the object at obj_start; exactly one must exist."""
    hits = [(a, b) for k, a, b in _members(text, obj_start) if k == key]
    assert len(hits) == 1, f'{key!r}: {len(hits)} matches'
    return hits[0]


def _root(text):
    return _ws(text, 0)


def _training_room(text):
    ra, _ = _member(text, _root(text), 'rooms')
    return _member(text, ra, 'training_room')[0]


def find_host_span(text, host_id=None, shell=None):
    """(start, end) of the host NPC object in rooms.training_room.npcs, found by id.

    With no host_id the host is the one positioned NPC whose storyPath is this shell's own ink
    (scenarios/<shell>/ink/<name>.json; checks name it <person>_pre.json), so `shell` (the folder name)
    is then required. Kit staff point at scenarios/_office_kit/ and another shell's ink never matches;
    a second story NPC without a position (ca03's Leila) does not match either. If a shell ever
    has two, pass host_id."""
    assert host_id is not None or shell, 'find_host_span needs a host_id or the shell folder name'
    tr = _training_room(text)
    na, _ = _member(text, tr, 'npcs')
    found = []
    for a, b in _elements(text, na):
        npc = json.loads(text[a:b])
        if host_id is not None:
            ok = npc.get('id') == host_id
        else:
            sp = npc.get('storyPath', '')
            ok = 'position' in npc and bool(re.fullmatch(rf'scenarios/{re.escape(shell)}/ink/[^/]+\.json', sp))
        if ok:
            found.append((a, b))
    assert len(found) == 1, f'expected one host NPC, found {len(found)}'
    return found[0]


def _replace(text, span, new):
    return text[:span[0]] + new + text[span[1]:]


def refresh_text(text, host_id=None, shell=None):
    """Re-splice scenario lighting, room lighting, chatBackground and the host position from
    training_room. Every member is found by structure (key path and NPC id), not by a text line."""
    old = json.loads(text)
    company = old['social']['awarenessEpisode']['company']
    rf = training_room.room_fields(company)
    text = _replace(text, _member(text, _root(text), 'lighting'),
                    _indented(training_room.scenario_lighting(company), 2))
    tr = _training_room(text)
    text = _replace(text, _member(text, tr, 'lighting'), _indented(rf['lighting'], 6))
    ha, hb = find_host_span(text, host_id, shell)
    pa, pb = _member(text, ha, 'position')
    text = _replace(text, (pa, pb), _indented(copy.deepcopy(training_room.HOST_POSITION), 10))
    if 'chatBackground' in rf:
        tr = _training_room(text)
        if any(k == 'chatBackground' for k, _, _ in _members(text, tr)):
            text = _replace(text, _member(text, tr, 'chatBackground'), json.dumps(rf['chatBackground']))
        else:
            _, de = _member(text, tr, 'door_sign')
            assert text[de:de + 2] == ',\n', 'door_sign is not followed by a comma and newline'
            text = text[:de + 2] + f'      "chatBackground": {json.dumps(rf["chatBackground"])},\n' + text[de + 2:]
    # the result must equal the old shell with exactly those fields replaced
    exp = copy.deepcopy(old)
    exp['lighting'] = training_room.scenario_lighting(company)
    exp['rooms']['training_room']['lighting'] = rf['lighting']
    if 'chatBackground' in rf:
        # same key order as the generators: type, door_sign, chatBackground, lighting
        trd = exp['rooms']['training_room']
        rebuilt = {}
        for k, v in trd.items():
            if k == 'chatBackground':
                continue
            rebuilt[k] = v
            if k == 'door_sign':
                rebuilt['chatBackground'] = rf['chatBackground']
        exp['rooms']['training_room'] = rebuilt
    new_host = json.loads(text[slice(*find_host_span(text, host_id, shell))])
    hosts = [n for n in exp['rooms']['training_room']['npcs'] if n.get('id') == new_host.get('id')]
    assert len(hosts) == 1, 'expected one host NPC by id'
    hosts[0]['position'] = copy.deepcopy(training_room.HOST_POSITION)
    assert json.loads(text) == exp, 'refresh changed more than the host position, lighting and chatBackground'
    return text


def refresh(outdir):
    import glob
    for path in sorted(glob.glob(os.path.join(REPO, 'scenarios', 'ca*', 'scenario.json.erb'))):
        name = os.path.basename(os.path.dirname(path))
        if not re.match(r'ca(\d{2}|_pre|_post|_annual)_', name):
            continue
        text = open(path).read()
        if not json.loads(text)['rooms']['training_room']['type'].startswith('room_aw_'):
            print('SKIP (not wired):', name)
            continue
        new = refresh_text(text, shell=name)
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


# ---- kit mode ------------------------------------------------------------------

def _members_full(text, i):
    """Like _members but also yields the key's start: (key, key_start, value_start, value_end)."""
    i = _ws(text, i + 1)
    while text[i] != '}':
        ks = i
        key, i = _DEC.raw_decode(text, i)
        i = _ws(text, i)
        i = _ws(text, i + 1)
        vs = i
        _, i = _DEC.raw_decode(text, i)
        yield key, ks, vs, i
        i = _ws(text, i)
        if text[i] == ',':
            i = _ws(text, i + 1)


def _line_indent(text, pos):
    return text[text.rfind('\n', 0, pos) + 1:pos]


def _rebuild(text, start, pieces, pad, close_pad):
    """Replace the object or array whose bracket is at `start` with its kept member texts and the new
    ones, one per line at `pad`. Returns the new text; unchanged when `pieces` equals the old pieces."""
    end = _DEC.raw_decode(text, start)[1]
    opener, closer = text[start], text[end - 1]
    if not pieces:
        body = opener + closer
    else:
        body = opener + '\n' + pad + (',\n' + pad).join(pieces) + '\n' + close_pad + closer
    return text[:start] + body + text[end:]


def _splice_object(text, start, drop, add, after=None):
    """Object at `start`: drop members whose key satisfies `drop`, add (key, value) pairs `add` right
    after the kept member `after` (else at the end). Kept members keep their own text. Returns new text."""
    kept, olds = [], []
    first_key = None
    after_at = None
    for key, ks, vs, ve in _members_full(text, start):
        first_key = ks if first_key is None else first_key
        s = text[ks:ve]
        olds.append(s)
        if not drop(key):
            kept.append(s)
            if key == after:
                after_at = len(kept)
    close_pad = _line_indent(text, start)
    close_pad = close_pad[:len(close_pad) - len(close_pad.lstrip())]
    if first_key is None or '\n' not in text[start:first_key]:
        pad = close_pad + '  '        # empty or compact object ({"a": 1}): members go one per line, 2 deeper than the brace
    else:
        pad = _line_indent(text, first_key)
    fresh = [json.dumps(k) + ': ' + _indented(v, len(pad)) for k, v in add]
    pieces = kept + fresh if after_at is None else kept[:after_at] + fresh + kept[after_at:]
    if pieces == olds:
        return text
    return _rebuild(text, start, pieces, pad, close_pad)


def _splice_array(text, start, drop, add):
    """Array at `start`: drop elements satisfying `drop(parsed)`, append the values in `add`."""
    kept, olds = [], []
    first = None
    for a, b in _elements(text, start):
        first = a if first is None else first
        s = text[a:b]
        olds.append(s)
        if not drop(json.loads(s)):
            kept.append(s)
    ind = _line_indent(text, start)
    close_pad = ind[:len(ind) - len(ind.lstrip())]
    pad = _line_indent(text, first) if first is not None else close_pad + '  '
    pad = pad[:len(pad) - len(pad.lstrip())] if first is not None and pad.strip() else pad
    fresh = [_indented(v, len(pad)) for v in add]
    pieces = kept + fresh
    if pieces == olds:
        return text
    return _rebuild(text, start, pieces, pad, close_pad)


def _try_member(text, obj_start, key):
    hits = [(a, b) for k, a, b in _members(text, obj_start) if k == key]
    assert len(hits) <= 1, f'{key!r}: {len(hits)} matches'
    return hits[0] if hits else None


def _first_set_outcome(text):
    """Start of social.triageSets[0].outcome (the set office_kit.key_outcome reads)."""
    social = _member(text, _root(text), 'social')[0]
    sets = _member(text, social, 'triageSets')[0]
    first = next(_elements(text, sets))[0]
    return _member(text, first, 'outcome')[0]


class WouldDropHandWrittenContent(Exception):
    """Regenerating would erase kit-owned content the kit data does not produce."""


def kit_text(text, kit, row, shell, allow_drop=False):
    """Splice the kit into one shell's text. Returns the new text. Refuses (WouldDropHandWrittenContent)
    when the shell holds kit-owned content that the kit data would not write back, unless allow_drop."""
    old = json.loads(text)
    host_id = office_kit._find_host(old)['id']
    expect = office_kit.apply_kit(old, kit, row, host_id=host_id)
    prefix, state_global = office_kit.shell_ids(old, row)
    b = office_kit.build(kit, row, prefix, state_global)
    mine = office_kit.kit_owned(old, host_id)
    lost = office_kit.hand_written(mine, b)
    if lost and not allow_drop:
        raise WouldDropHandWrittenContent(
            f"{shell}: --kit would drop hand-written kit content it cannot regenerate: " + '; '.join(lost)
            + ". Move it into the kit data (the set piece's staff patches, mappings, globals, timers, objects) "
            + f"or pass --allow-drop {shell} to erase it on purpose.")
    if lost:
        print(f"{shell}: --allow-drop {shell}: DROPPING " + str(len(lost)) + ' item(s):', file=sys.stderr)
        for item in lost:
            print('  - ' + item, file=sys.stderr)
    # Records the regeneration keeps by id but rewrites: a hand edit to a condition, delay or field is
    # reverted without a refusal (kit data changes show here too, so this warns and does not refuse).
    changed = office_kit.reverts(mine, b)
    if changed:
        print(f"{shell}: WARNING, --kit rewrites {len(changed)} kit-owned field(s) from the kit data. Expected "
              "after a kit-data edit; a hand edit made in the shell is reverted (move it into the kit data):",
              file=sys.stderr)
        for item in changed:
            print('  ~ ' + item, file=sys.stderr)
    is_kit = lambda e: office_kit.is_kit_member(e)  # noqa: E731

    # host mappings (deepest first, so the spans above are re-found afterwards)
    ha, _ = find_host_span(text, host_id, shell)
    em = _try_member(text, ha, 'eventMappings')
    cur = json.loads(text[em[0]:em[1]]) if em else []
    if em and not (cur and all(office_kit.is_kit_mapping(m) for m in cur)):
        text = _splice_array(text, em[0], office_kit.is_kit_mapping, b['mappings'])
    elif not b['mappings'] and not em:
        pass     # the convention form (ca00) has no kit host mappings: add no empty list
    else:
        # none yet, or only kit mappings (strip_kit drops the key then): (re)create it at the host's end
        if em:
            text = _splice_object(text, ha, lambda k: k == 'eventMappings', [])
        ha, _ = find_host_span(text, host_id, shell)
        text = _splice_object(text, ha, lambda k: False, [('eventMappings', b['mappings'])])
    # room npcs and objects
    tr = _training_room(text)
    text = _splice_array(text, _member(text, tr, 'npcs')[0], is_kit, b['npcs'])
    tr = _training_room(text)
    text = _splice_array(text, _member(text, tr, 'objects')[0], is_kit, b['objects'])
    # social.awarenessEpisode.stepAway
    social = _member(text, _root(text), 'social')[0]
    epa = _member(text, social, 'awarenessEpisode')[0]
    # a hand-written `stepAways` list stands in for it: never add `stepAway` beside the list (validator: both set)
    has_list = any(k == 'stepAways' for k, _, _ in _members(text, epa))
    text = _splice_object(text, epa, lambda k: k == 'stepAway', [('stepAway', True)] if b['stepAway'] and not has_list else [])
    # social.triageSets[0].outcome.messageGlobals (the row's keyMessage)
    if not office_kit.is_convention(row):    # the convention form (ca00) has no triage set
        oc = _first_set_outcome(text)
        own_mg = [v for k, a, bb in _members(text, oc) if k == 'messageGlobals' for v in [json.loads(text[a:bb])]]
        if not own_mg or all(str(v).startswith('kit_') for v in own_mg[0].values()):
            text = _splice_object(text, oc, lambda k: k == 'messageGlobals',
                                  [('messageGlobals', b['messageGlobals'])] if b.get('messageGlobals') else [])
        else:    # the shell's own non-kit entries stay; the kit's are merged in as apply_kit does
            # (old kit_ entries are dropped first, as office_kit.strip_kit does: wrap-fix review m4)
            mg = {**{k: v for k, v in own_mg[0].items() if not str(v).startswith('kit_')}, **b.get('messageGlobals', {})}
            text = _splice_object(text, oc, lambda k: k == 'messageGlobals', [('messageGlobals', mg)])
        # social.triageSets[0].outcome.messageCaughtVerdicts (the row's keyCaughtVerdicts): the kit owns
        # the entries for its own messageGlobals ids, old and new; any other entry stays
        kit_ids = ({k for k, v in own_mg[0].items() if str(v).startswith('kit_')} if own_mg else set()) \
            | set(b.get('messageGlobals', {}))
        oc = _first_set_outcome(text)
        own_mcv = [json.loads(text[a:bb]) for k, a, bb in _members(text, oc) if k == 'messageCaughtVerdicts']
        mcv = {**{k: v for k, v in (own_mcv[0] if own_mcv else {}).items() if k not in kit_ids},
               **b.get('messageCaughtVerdicts', {})}
        if own_mcv or mcv:
            text = _splice_object(text, oc, lambda k: k == 'messageCaughtVerdicts',
                                  [('messageCaughtVerdicts', mcv)] if mcv else [])
    # globals
    gv = _member(text, _root(text), 'globalVariables')[0]
    text = _splice_object(text, gv, lambda k: k.startswith('kit_'), list(b['globals'].items()))
    # top-level keys, in the same places as office_kit.apply_kit: npcThoughts after disableAttacks;
    # officePresets, chatter, timers, resources and roles after globalVariables
    tl = _try_member(text, _root(text), 'timers')
    if tl:
        text = _splice_array(text, tl[0], lambda e: str(e.get('id', '')).startswith('kit_'), b['timers'])
        tl = _try_member(text, _root(text), 'timers')
        if json.loads(text[tl[0]:tl[1]]) == []:
            text = _splice_object(text, _root(text), lambda k: k == 'timers', [])
            tl = None
    ch = _try_member(text, _root(text), 'chatter')
    ch_own = bool(ch) and any(not str(k).startswith('kit_') for k in json.loads(text[ch[0]:ch[1]]))
    if ch and ch_own:    # the shell's own pools stay; only the kit_ keys are replaced
        text = _splice_object(text, ch[0], lambda k: k.startswith('kit_'), list(b['scenario']['chatter'].items()))
    adds = []
    for k, v in b['scenario'].items():
        if k != 'npcThoughts' and not (k == 'chatter' and ch_own):
            adds.append((k, v))
    flags = office_kit.shell_flags(row)
    text = _splice_object(text, _root(text), lambda k: k == office_kit.TTS_FLAG, [])   # re-added with adds, so a rerun is stable
    adds.extend(flags.items())
    if b['timers'] and not tl:
        adds.append(('timers', b['timers']))
    for key in office_kit.KIT_KEYED:   # kit-owned entries are replaced inside the shell's collection, or the collection is created
        mem = _try_member(text, _root(text), key)
        if mem:
            if text[mem[0]] == '{':
                text = _splice_object(text, mem[0], lambda k: k.startswith('kit_'), list(b.get(key, {}).items()))
            else:
                text = _splice_array(text, mem[0], is_kit, b.get(key, []))
            mem = _try_member(text, _root(text), key)
            if not json.loads(text[mem[0]:mem[1]]):
                text = _splice_object(text, _root(text), lambda k, key=key: k == key, [])
                mem = None
        if not mem and key in b:
            adds.append((key, b[key]))
    text = _splice_object(text, _root(text), lambda k: k in office_kit.KIT_TOP_KEYS or (k == 'chatter' and not ch_own),
                          [(k, v) for k, v in b['scenario'].items() if k == 'npcThoughts'], after='disableAttacks')
    text = _splice_object(text, _root(text), lambda k: False, adds, after='globalVariables')
    # compared as text, not dict equality, so key order must agree too (a later --kit run changes nothing)
    assert json.dumps(json.loads(text)) == json.dumps(expect), f'{shell}: kit splice differs from office_kit.apply_kit'
    return text


def kit(outdir, allow_drop=()):
    """Splice the kit into every tiered row's shell, writing patched copies into outdir (required: the
    tool never writes into scenarios/). Every text is built (and every row checked) before any file is
    written, so a failure on a later shell leaves the earlier ones untouched."""
    if not outdir:
        sys.exit('--kit needs an output folder: apply_training_room.py --kit <outdir> [--allow-drop <shell>]... '
                 '(nothing is written into scenarios/)')
    allow_drop = set(allow_drop)
    rows_all = office_kit.load_rows()
    fixtures = allow_drop & {r['id'] for r in rows_all if r.get('fixture')}
    if fixtures:
        sys.exit('--allow-drop names a fixture shell, which --kit skips (its chain is hand-authored): ' + ', '.join(sorted(fixtures)))
    unknown = allow_drop - {r['id'] for r in rows_all if office_kit.tier_of(r) != 'none'}
    if unknown:
        sys.exit('--allow-drop names no kit shell: ' + ', '.join(sorted(unknown)))
    plan = []
    for row in office_kit.load_rows():
        if office_kit.tier_of(row) == 'none':
            continue
        name = row['id']
        if row.get('fixture'):
            # The gate A fixture's kit_ chain is hand-authored; strip_kit would remove it and nothing re-adds it.
            print('SKIP (fixture, hand-authored chain):', name)
            continue
        try:
            office_kit.refuse_check_row(row)
        except ValueError as e:
            sys.exit(str(e))
        path = os.path.join(REPO, 'scenarios', name, 'scenario.json.erb')
        if not os.path.exists(path):
            sys.exit(f'episodes.json row {name} has no shell at {path}')
        text = open(path).read()
        try:
            new = kit_text(text, office_kit.load_kit(row['company']), row, name, allow_drop=name in allow_drop)
        except WouldDropHandWrittenContent as e:
            sys.exit(str(e))
        plan.append((name, path, text, new))
    for name, path, text, new in plan:
        d = os.path.join(outdir, name)
        os.makedirs(d, exist_ok=True)
        dest = os.path.join(d, 'scenario.json.erb')
        with open(dest, 'w') as f:
            f.write(new)
        print('wrote', dest, '' if new != text else '(unchanged)')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--kit':
        rest, allow = [], []
        args = iter(sys.argv[2:])
        for a in args:
            if a == '--allow-drop':     # per shell: --allow-drop <shell>, repeatable; never the whole run
                shell = next(args, None)
                if not shell or shell.startswith('-'):
                    sys.exit('--allow-drop needs a shell name (repeatable): --allow-drop <shell>')
                allow.append(shell)
            else:
                rest.append(a)
        kit(rest[0] if rest else None, allow_drop=allow)
        return
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
