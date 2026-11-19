#!/usr/bin/env python3
"""The awareness "living office" kit (LIVING_OFFICE_PLAN.md 4.1 to 4.4, 6.1, 6.7).

Pure functions: a company kit (office_kits/<company>.json) plus an episode row
(office_kits/episodes.json) in; room NPCs, room objects, globals, timers, host mappings and
top-level scenario fields out. Tier 'none' (or no row) returns empty lists and dicts and
adds no key anywhere, so a generator that passes 'none' stays byte-identical.

Row fields are described in the _note of episodes.json. `prefix` is always the shell's own
setGlobalPrefix and `state_global` its episode_<id>_state, read from the shell by the caller
(see shell_ids), never built here.

CLI (nothing writes into the repo):
  office_kit.py [--repo <checkout>] export <shell folder>   print the kit-owned members as JSON
"""
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
KITS_DIR = os.path.join(HERE, 'office_kits')

TIERS = ('none', 'S', 'T', 'O', 'E')
SHARED_BOOLS = ('kit_attack_done', 'kit_defend_done', 'kit_quiet', 'kit_caught')
CAUGHT_PERCENT = 85   # the one threshold in the course (plan 6.1)
KIOSK_FINISHED = 'globalVars.kit_defend_done === true && globalVars.kit_quiet === false'


# ---- data ----------------------------------------------------------------------

def load_kit(company, kits_dir=None):
    with open(os.path.join(kits_dir or KITS_DIR, f'{company}.json')) as f:
        return json.load(f)


def load_rows(kits_dir=None):
    with open(os.path.join(kits_dir or KITS_DIR, 'episodes.json')) as f:
        return json.load(f)['episodes']


def row_for(shell, kits_dir=None):
    """The episodes.json row for a shell folder name, or None."""
    for r in load_rows(kits_dir):
        if r.get('id') == shell:
            return r
    return None


def tier_of(row):
    t = (row or {}).get('tier', 'none')
    if t not in TIERS:
        raise ValueError(f'unknown tier {t!r}; expected one of {TIERS}')
    return t


def active(row):
    return tier_of(row) != 'none'


def chain_id(row):
    return row.get('chainId') or row['ep']


def out_global(row):
    return f'kit_{chain_id(row)}_out'


def shell_ids(sc):
    """(prefix, state_global) read from a shell: its defend set's setGlobalPrefix and episode state."""
    ep = sc['social']['awarenessEpisode']
    prefix = sc['social']['triageSets'][0]['outcome']['setGlobalPrefix']
    return prefix, f"episode_{ep['id']}_state"


def _set_piece(kit, row):
    name = row.get('setPiece')
    if not name:
        return {}
    pieces = kit.get('setPieces', {})
    if name not in pieces:
        raise KeyError(f'kit {kit.get("company")!r} has no set piece {name!r}')
    return pieces[name]


def _subst(node, prefix, row):
    """Fill {prefix}, {ep} and {out} in every string of a set-piece fragment."""
    if isinstance(node, str):
        return (node.replace('{prefix}', prefix or '').replace('{ep}', row['ep']).replace('{out}', out_global(row)))
    if isinstance(node, list):
        return [_subst(v, prefix, row) for v in node]
    if isinstance(node, dict):
        return {k: _subst(v, prefix, row) for k, v in node.items()}
    return node


# ---- kit output ----------------------------------------------------------------

def _pool(kit):
    p = kit['pool']
    return {'lines': list(p['lines']), 'requireGlobal': copy.deepcopy(p['requireGlobal'])}


def room_npcs(kit, row, prefix=None):
    """The two ambient staff as room NPC records. Empty for tier none."""
    if not active(row):
        return []
    pool_key = kit['pool']['key']
    out = []
    patches = _subst(_set_piece(kit, row).get('staff', {}), prefix, row)
    for person in row['ambient']:
        s = copy.deepcopy(kit['staff'][person])
        lines = s.pop('chatterLines')
        sheet = s.pop('spriteSheet')
        npc = {
            'id': f'kit_{person}',
            'displayName': s.pop('displayName'),
            'person': person,
            'npcType': 'person',
            'position': s.pop('position'),
            'spriteSheet': sheet,
            'spriteTalk': f'assets/characters/{sheet}_talk.png',
            'spriteVisemes': f'assets/characters/{sheet}_visemes.png',
            'storyPath': f'scenarios/_office_kit/ink/{person}_ambient.json',
            'currentKnot': 'start',
            'needsHome': s.pop('needsHome'),
            'needsRooms': ['training_room'],
        }
        npc.update(s)
        # the pool is spoken only through the engine-spoken coffee topic, in the object form
        # that carries the same gate as the top-level pool (validator V13)
        npc['chatter'] = {pool_key: {'lines': lines, 'requireGlobal': copy.deepcopy(kit['pool']['requireGlobal'])}}
        npc.update(patches.get(person, {}))
        out.append(npc)
    return out


def room_objects(kit, row, prefix=None):
    """Need sources plus the set piece's objects. Empty for tier none."""
    if not active(row):
        return []
    pool_key = kit['pool']['key']
    out = []
    for src in kit.get('sources', []):
        o = copy.deepcopy(src)
        aff = o.get('affordance', {})
        if aff.get('chatter') == 'pool':
            aff['chatter'] = pool_key
        out.append(o)
    out.extend(_subst(copy.deepcopy(_set_piece(kit, row).get('objects', [])), prefix, row))
    return out


def kit_globals(kit, row, prefix=None):
    """Globals to declare in globalVariables. Empty for tier none."""
    if not active(row):
        return {}
    g = {k: False for k in SHARED_BOOLS}
    g['kit_ep'] = row['ep']
    if row.get('stepAway'):
        g[out_global(row)] = False
    g.update(_subst(copy.deepcopy(_set_piece(kit, row).get('globals', {})), prefix, row))
    return g


def kit_timers(kit, row, prefix=None):
    if not active(row):
        return []
    return _subst(copy.deepcopy(_set_piece(kit, row).get('timers', [])), prefix, row)


def host_mappings(kit, row, prefix, state_global):
    """Host eventMappings, to be appended after the host's existing ones (plan 6.1)."""
    if not active(row):
        return []
    state = f'global_variable_changed:{state_global}'
    complete = f'global_variable_changed:{prefix}complete'
    m = [{'eventPattern': state, 'onceOnly': True, 'setGlobal': {'kit_quiet': True}}]
    if row.get('attack'):
        m.append({'eventPattern': state, 'condition': "data.value.stage === 'defend'",
                  'onceOnly': True, 'setGlobal': {'kit_attack_done': True}})
    m.append({'eventPattern': complete, 'condition': 'value === true', 'onceOnly': True,
              'setGlobal': {'kit_defend_done': True}})
    m.append({'eventPattern': complete,
              'condition': f'value === true && globalVars.{prefix}percent >= {CAUGHT_PERCENT}',
              'onceOnly': True, 'setGlobal': {'kit_caught': True}})
    m.append({'eventPattern': state, 'condition': "data.value.done.includes('debrief')",
              'onceOnly': True, 'setGlobal': {'kit_quiet': False}})
    if row.get('stepAway'):
        # The panel's Close can leave done without 'debrief'; debriefSeen is the second release.
        # Conditions support && only, never ||, so it is its own mapping.
        m.append({'eventPattern': state, 'condition': 'data.value.debriefSeen === true',
                  'onceOnly': True, 'setGlobal': {'kit_quiet': False}})
        step = {'eventPattern': 'episode_step_away', 'condition': 'globalVars.kit_defend_done === true',
                'onceOnly': True, 'setGlobal': {out_global(row): True}}
        if row.get('stepAwayBark'):
            step['bark'] = row['stepAwayBark']
        m.append(step)
    m.extend(_subst(copy.deepcopy(_set_piece(kit, row).get('mappings', [])), prefix, row))
    return m


def scenario_fields(kit, row):
    """Top-level scenario keys the kit adds: npcThoughts and the shared pool (the coffee topic).
    Empty for tier none."""
    if not active(row):
        return {}
    f = copy.deepcopy(kit.get('scenario', {}))
    f['chatter'] = {kit['pool']['key']: _pool(kit)}
    return f


def kiosk_condition(row):
    """The kiosk's finished-text condition in a shell with the step-away panel, else None."""
    return KIOSK_FINISHED if active(row) and row.get('stepAway') else None


def build(kit, row, prefix, state_global):
    """Everything the kit owns for one shell, in one dict (the form the tests compare)."""
    return {
        'npcs': room_npcs(kit, row, prefix),
        'objects': room_objects(kit, row, prefix),
        'globals': kit_globals(kit, row, prefix),
        'timers': kit_timers(kit, row, prefix),
        'mappings': host_mappings(kit, row, prefix, state_global),
        'scenario': scenario_fields(kit, row),
        'stepAway': bool(active(row) and row.get('stepAway')),
    }


# ---- ownership (plan 4.2) ------------------------------------------------------

def _mentions_kit(v):
    if isinstance(v, str):
        return 'kit_' in v
    if isinstance(v, dict):
        return any(_mentions_kit(k) or _mentions_kit(x) for k, x in v.items())
    if isinstance(v, list):
        return any(_mentions_kit(x) for x in v)
    return False


def is_kit_member(m):
    return isinstance(m, dict) and str(m.get('id', '')).startswith('kit_')


def is_kit_mapping(m):
    """A host mapping is kit-owned when its setGlobal key, knot or condition names a kit_ global."""
    sg = m.get('setGlobal')
    if isinstance(sg, dict) and any(str(k).startswith('kit_') for k in sg):
        return True
    return 'kit_' in str(m.get('condition', '')) or 'kit_' in str(m.get('knot', ''))


KIT_TOP_KEYS = ('npcThoughts', 'chatter', 'officePresets')


def _find_host(sc, host_id=None):
    npcs = sc['rooms']['training_room']['npcs']
    if host_id:
        hits = [n for n in npcs if n.get('id') == host_id]
    else:
        own = f"scenarios/{sc.get('scenario_id')}/ink/"
        hits = [n for n in npcs if not is_kit_member(n) and str(n.get('storyPath', '')).startswith(own)]
        if not hits:
            hits = [n for n in npcs if not is_kit_member(n)][:1]
    if len(hits) != 1:
        raise ValueError(f'expected one host NPC, found {len(hits)}')
    return hits[0]


def strip_kit(sc, host_id=None):
    """A deep copy of a parsed shell with every kit-owned member removed."""
    sc = copy.deepcopy(sc)
    tr = sc['rooms']['training_room']
    tr['npcs'] = [n for n in tr['npcs'] if not is_kit_member(n)]
    tr['objects'] = [o for o in tr.get('objects', []) if not is_kit_member(o)]
    host = _find_host(sc, host_id)
    if 'eventMappings' in host:
        host['eventMappings'] = [m for m in host['eventMappings'] if not is_kit_mapping(m)]
    gv = sc.get('globalVariables', {})
    for k in [k for k in gv if k.startswith('kit_')]:
        del gv[k]
    for k in KIT_TOP_KEYS:
        sc.pop(k, None)
    if 'timers' in sc:
        sc['timers'] = [t for t in sc['timers'] if not str(t.get('id', '')).startswith('kit_')]
        if not sc['timers']:
            del sc['timers']
    for key in ('resources', 'roles'):
        if isinstance(sc.get(key), dict):      # keyed by id
            sc[key] = {k: v for k, v in sc[key].items() if not str(k).startswith('kit_')}
        elif isinstance(sc.get(key), list):
            sc[key] = [r for r in sc[key] if not is_kit_member(r)]
        if key in sc and not sc[key]:
            del sc[key]
    sc['social']['awarenessEpisode'].pop('stepAway', None)
    return sc


def _insert_after(d, after_key, items):
    """d with the (key, value) pairs of `items` placed right after after_key (else at the end)."""
    out = {}
    done = False
    for k, v in d.items():
        out[k] = v
        if k == after_key:
            for ik, iv in items:
                out[ik] = iv
            done = True
    if not done:
        for ik, iv in items:
            out[ik] = iv
    return out


def apply_kit(sc, kit, row, host_id=None):
    """The shell with the kit's content applied (a new dict). Tier none returns an unchanged copy.
    Old kit-owned members are removed first, so applying twice gives the same result."""
    if not active(row):
        return copy.deepcopy(sc)
    out = strip_kit(sc, host_id)
    prefix, state_global = shell_ids(out)
    b = build(kit, row, prefix, state_global)
    tr = out['rooms']['training_room']
    tr['npcs'] = tr['npcs'] + b['npcs']
    tr['objects'] = tr['objects'] + b['objects']
    host = _find_host(out, host_id)
    host['eventMappings'] = host.get('eventMappings', []) + b['mappings']
    out['globalVariables'].update(b['globals'])
    top = [(k, v) for k, v in b['scenario'].items() if k == 'npcThoughts']
    out = _insert_after(out, 'disableAttacks', top)
    after = [(k, v) for k, v in b['scenario'].items() if k != 'npcThoughts']
    if b['timers']:
        after.append(('timers', b['timers']))
    out = _insert_after(out, 'globalVariables', after)
    if b['stepAway']:
        out['social']['awarenessEpisode']['stepAway'] = True
    return out


def patch_kiosk(sc, row):
    """Kiosk 'finished' variants keyed on the kit's quiet state, in a shell with the panel. Used for
    generated shells only; a hand-authored shell edits its kiosk by hand (plan 4.4)."""
    cond = kiosk_condition(row)
    if not cond:
        return sc
    for o in sc['rooms']['training_room']['objects']:
        if o.get('type') == 'kiosk':
            for v in o.get('observationVariants', []):
                v['condition'] = cond
    return sc


def kit_owned(sc, host_id=None):
    """The kit-owned members of a parsed shell, in the same form as build() (for comparisons)."""
    tr = sc['rooms']['training_room']
    host = _find_host(sc, host_id)
    gv = sc.get('globalVariables', {})
    return {
        'npcs': [n for n in tr['npcs'] if is_kit_member(n)],
        'objects': [o for o in tr.get('objects', []) if is_kit_member(o)],
        'globals': {k: v for k, v in gv.items() if k.startswith('kit_')},
        'timers': [t for t in sc.get('timers', []) if str(t.get('id', '')).startswith('kit_')],
        'mappings': [m for m in host.get('eventMappings', []) if is_kit_mapping(m)],
        'scenario': {k: sc[k] for k in KIT_TOP_KEYS if k in sc},
        'stepAway': sc['social']['awarenessEpisode'].get('stepAway') is True,
    }


def main():
    sys.path.insert(0, HERE)
    import awareness_deploy
    repo = awareness_deploy.repo_root()
    argv = sys.argv[1:]
    if len(argv) != 2 or argv[0] != 'export':
        sys.exit('usage: office_kit.py [--repo <checkout>] export <shell folder>')
    shell = argv[1]
    row = row_for(shell)
    if not row or not active(row):
        sys.exit(f'no kit row with a tier for {shell}')
    with open(os.path.join(repo, 'scenarios', shell, 'scenario.json.erb')) as f:
        sc = json.load(f)
    prefix, state_global = shell_ids(sc)
    print(json.dumps(build(load_kit(row['company']), row, prefix, state_global), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
