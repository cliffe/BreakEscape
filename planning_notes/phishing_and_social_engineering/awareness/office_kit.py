#!/usr/bin/env python3
"""The awareness "living office" kit (LIVING_OFFICE_PLAN.md 4.1 to 4.4, 6.1, 6.7).

Pure functions: a company kit (office_kits/<company>.json) plus an episode row
(office_kits/episodes.json) in; room NPCs, room objects, globals, timers, host mappings and
top-level scenario fields out. Tier 'none' (or no row) returns empty lists and dicts and
adds no key anywhere, so a generator that passes 'none' stays byte-identical.

Row fields are described in the _note of episodes.json. `prefix` is always the shell's own
setGlobalPrefix and `state_global` its episode_<id>_state, read from the shell by the caller
(see shell_ids), never built here.

Ownership: every kit-owned record (a kit NPC, object, timer, global, chatter pool or host mapping, and
its conditions, delays and other fields) is regenerated from the kit data. A hand edit to one in a shell
is reverted by the next --kit run; apply_training_room.py warns (reverts()) and refuses to erase a
record the kit data does not produce (hand_written()). Make changes in the set piece in the kit file.

CLI (nothing writes into the repo):
  office_kit.py [--repo <checkout>] export <shell folder>   print the kit-owned members as JSON
"""
import copy
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
KITS_DIR = os.path.join(HERE, 'office_kits')

TIERS = ('none', 'S', 'T', 'O', 'E')
SHARED_BOOLS = ('kit_attack_done', 'kit_defend_done', 'kit_quiet', 'kit_caught')
CAUGHT_PERCENT = 85   # the one threshold in the course (plan 6.1)
KEY_GLOBAL = 'kit_key_caught'   # the one generic global a row's keyMessage writes (plan 4.2)
KIOSK_FINISHED = 'globalVars.kit_defend_done === true && globalVars.kit_quiet === false'

# Every eventMapping the kit generates (host mappings and each kit NPC's own) carries a stable internal key,
# `_kitKey`, written in the kit data (office_kits/*.json for set-piece mappings, host_mappings() for the shared
# ones). The key names the mapping, never its content: a kit edit changes what a mapping says, not which one
# it is. The merge decides by key; the key never reaches a scenario file (build() strips it). The other
# lists (npcs, objects, timers, resources, roles) are keyed by their `id`, chatter and globals by their dict key.
KEY = '_kitKey'


def strip_keys(x):
    """A deep copy of x with every `_kitKey` removed (the form that reaches a scenario file)."""
    if isinstance(x, dict):
        return {k: strip_keys(v) for k, v in x.items() if k != KEY}
    if isinstance(x, list):
        return [strip_keys(v) for v in x]
    return x


def _ensure_keys(maps, label='mappings'):
    """Every mapping in this one list has a unique `_kitKey`. A mapping written without one (a test fixture,
    never the real kit files, which test_office_kit checks) gets `auto:<event>:<purpose>:<n>` from its place
    among same-event-and-purpose siblings. Duplicates raise."""
    seen = {}
    for m in maps:
        if KEY not in m:
            i = _map_id(m)
            n = seen.get(i, 0)
            seen[i] = n + 1
            m[KEY] = f'auto:{i[0]}:{",".join(map(str, i[1]))}:{n}'
    keys = [m[KEY] for m in maps]
    dup = sorted({k for k in keys if keys.count(k) > 1})
    if dup:
        raise ValueError(f'{label}: duplicate _kitKey {", ".join(map(str, dup))}')
    return maps


# ---- data ----------------------------------------------------------------------

def load_kit(company, kits_dir=None):
    with open(os.path.join(kits_dir or KITS_DIR, f'{company}.json')) as f:
        kit = json.load(f)
    check_pool(kit)
    return kit


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


def is_convention(row):
    """True for the ca00 convention form (brief 1.3): no triage set, no chatter, no host mappings, kit_ep
    the only kit global; each kit NPC opens on the row's `stub` knot."""
    return bool((row or {}).get('convention'))


def has_pool(kit):
    """False for a pool-exempt kit (`pool: null`, D12): no top-level pool, no chatter anywhere."""
    return kit.get('pool') is not None


def check_pool(kit):
    """A kit with `pool: null` needs a non-empty `poolExempt` reason and no source carrying `chatter`;
    a kit with a pool has no `poolExempt`. Raises ValueError."""
    name = kit.get('company')
    exempt = kit.get('poolExempt')
    if has_pool(kit):
        if exempt is not None:
            raise ValueError(f'kit {name!r}: poolExempt is only for a kit with pool: null')
        return
    if 'pool' not in kit:
        raise ValueError(f'kit {name!r}: needs a pool, or pool: null with a poolExempt reason')
    if not (isinstance(exempt, str) and exempt.strip()):
        raise ValueError(f'kit {name!r}: pool is null, so poolExempt must be a non-empty reason')
    for src in kit.get('sources', []):
        if (src.get('affordance') or {}).get('chatter'):
            raise ValueError(f"kit {name!r}: pool is exempt, but source {src.get('id')!r} carries chatter")
    for person, rec in kit.get('staff', {}).items():
        if rec.get('chatterLines'):
            raise ValueError(f'kit {name!r}: pool is exempt, but {person!r} has chatterLines')


def chain_id(row):
    return row.get('chainId') or row['ep']


def out_global(row):
    return f'kit_{chain_id(row)}_out'


def shell_ids(sc, row=None):
    """(prefix, state_global) read from a shell: the row's `prefix` if it has one, else its defend set's
    setGlobalPrefix, plus the episode state global. ca00_first_play has no triage set (a brief episode
    ends on episode_<id>_done, which is not <prefix>complete), so a ca00 row must name its own `prefix`:
    the row is the one place that already carries per-shell kit decisions, and guessing a prefix from the
    shell would wire host mappings to an event that never fires."""
    ep = sc['social']['awarenessEpisode']
    if is_convention(row):
        return None, f"episode_{ep['id']}_state"     # no triage set and no <prefix>complete (brief 1.3)
    prefix = (row or {}).get('prefix')
    if prefix is None:
        sets = sc['social'].get('triageSets') or []
        if not sets:
            raise ValueError(f"shell {ep['id']!r} has no triage set: its episodes.json row needs a 'prefix'")
        prefix = sets[0]['outcome']['setGlobalPrefix']
    return prefix, f"episode_{ep['id']}_state"


CHECK_ID = re.compile(r'^ca_(pre|post|annual)_')


def refuse_check_row(row):
    """Check and annual shells never carry the kit (plan 4.4); refuse a tiered row for one."""
    if active(row) and CHECK_ID.match(str(row.get('id', ''))):
        raise ValueError(f"{row['id']}: check and annual shells never carry the office kit")


def refuse_hand_authored_row(row):
    """A generator never writes a hand-authored shell; only apply_training_room.py --kit touches it."""
    if active(row) and row.get('handAuthored'):
        raise ValueError(f"{row['id']}: hand-authored, a generator must not write it")


def _set_piece(kit, row):
    name = row.get('setPiece')
    if not name:
        return {}
    pieces = kit.get('setPieces', {})
    if name not in pieces:
        raise KeyError(f'kit {kit.get("company")!r} has no set piece {name!r}')
    return step_away_defaults(pieces[name])


REPLY_MS = 45000   # the step-away reply window; a set piece may override it with `replyMs`
BACKSTOP_MS = 60000   # `_t_done_out` ends the beat this long after the ask-based `_t_done` would have


def _strip_quiet(cond):
    if not cond:
        return cond
    return cond.replace(' && globalVars.kit_quiet === true', '')


def _ask_condition(cond, done_key, choice_key):
    """The ask's condition without the quiet flag, and with `not done` and `not answered yet`."""
    cond = _strip_quiet(cond) or 'true'
    for term in (f'!globalVars.{done_key}', f"globalVars.{choice_key} === ''"):
        if term not in cond:
            cond += f' && {term}'
    return cond


def _rearm_mappings(ask, twins, out_key, asked_key, done_key, choice_key):
    """Re-arm after a reload. Pending and held mappings live in memory only, so a player who reloaded while
    the ask waited (its trigger already true, so it never fires again) would never be asked. On `game_loaded`:
    ask now if the beat is live, nobody has been asked and it is not over; or, if the ask was made and not
    yet answered, show the marker again (the reply timer resumes by itself)."""
    if ':' not in str(ask['eventPattern']):
        return []   # not a global-change trigger: nothing to catch up after a reload
    trigger = str(ask['eventPattern']).split(':', 1)[1]
    live = f'globalVars.{trigger} === true && globalVars.{out_key} === true && !globalVars.{done_key} && globalVars.{choice_key} === \'\''
    out = []
    for src in twins + [ask]:
        m = copy.deepcopy(src)
        m['eventPattern'] = 'game_loaded'
        m['condition'] = f'{live} && globalVars.{asked_key} !== true'
        m['onceOnly'] = True
        m[KEY] = f'{src[KEY]}~rearm'
        out.append(m)
    cue = {'eventPattern': 'game_loaded', 'condition': f'{live} && globalVars.{asked_key} === true',
           'onceOnly': True, 'delayMs': ask['delayMs'], 'askCue': True, 'whenPerceivable': True,
           'askCueUntil': choice_key, 'askCueMs': ask['askCueMs'], 'askCueQuiet': True, KEY: f'{ask[KEY]}~rearm_cue'}
    out.append(cue)
    return out


def step_away_defaults(piece):
    """The one shared step-away mechanism (ask cue, fair reply window), applied to every set piece
    whose reply timer starts on an `*_asked` global and lapses a `*_choice` to its no-answer value ('silent', or 'leave' in ca15). Returns a
    copy. The timer's delayMs becomes the piece's `replyMs` (default REPLY_MS). The mapping that sets
    the asked global gets `askCue` (a marker and a toast naming the colleague when it fires) and
    `whenPerceivable` (it waits until no minigame is open and the colleague is on camera or in the
    player's room, so the clock starts when the ask can be noticed); the colleague's ask bark
    mapping on the same event waits with it. Both need a delayMs to wait on, so at least 1 ms."""
    piece = copy.deepcopy(piece)
    asked = set()
    choice_key = None
    old_reply = None
    for t in piece.get('timers', []):
        sg = t.get('setGlobal') or {}
        if str(t.get('startOnGlobal', '')).endswith('_asked') and any(str(k).endswith('_choice') for k in sg):
            old_reply = t['delayMs'] if old_reply is None else old_reply
            t['delayMs'] = piece.get('replyMs', REPLY_MS)
            asked.add(t['startOnGlobal'])
            choice_key = next(k for k in sg if str(k).endswith('_choice'))
    done_key = None
    out_key = None
    # The `_t_done` fallback counted from `out`, but the ask now waits until it can be noticed, so a
    # fixed time from `out` can end the episode before the reply window lapses and the follow-through
    # runs (ca05 busy run: done at 60 s, silent at 100 s, so the follow-through never played). Count it
    # from the ask instead, keeping the same tail the piece allowed after its (old) reply window.
    # That timer never starts if the ask never fires (it was dropped, or the player reloaded while it
    # waited), and the success screen is held until `done`, so a second timer, `_t_done_out`, counts
    # from `out` with a margin of BACKSTOP_MS over the first and ends the beat regardless.
    if len(asked) == 1:
        (ask,) = asked
        extra = []
        for t in piece.get('timers', []):
            if str(t.get('id', '')).endswith('_t_done') and str(t.get('startOnGlobal', '')) != ask \
                    and str(t.get('startOnGlobal', '')).endswith(('{out}', '_out')):
                out_start = t['startOnGlobal']
                t['delayMs'] = max(t['delayMs'] - old_reply, 20000) + piece.get('replyMs', REPLY_MS)
                t['startOnGlobal'] = ask
                backstop = copy.deepcopy(t)
                backstop['id'] = t['id'] + '_out'
                backstop['startOnGlobal'] = out_start
                backstop['delayMs'] = t['delayMs'] + BACKSTOP_MS
                # a live ask belongs to `_t_done` (it starts on the ask); the backstop only ends a beat
                # that was never asked, so it cannot cut a reply window held past BACKSTOP_MS
                bc = backstop.get('condition') or 'true'
                backstop['condition'] = f"{bc} && globalVars.{ask} !== true"
                extra.append(backstop)
                done_key = next(iter(t.get('setGlobal') or {}), None)
                out_key = out_start
        piece['timers'] = [t for t in piece.get('timers', []) if t['id'] not in {e['id'] for e in extra}] + extra
    for rec in piece.get('staff', {}).values():
        maps = _ensure_keys(rec.get('eventMappings', []), 'set piece staff eventMappings')
        rearm = []
        for m in maps:
            if asked & set((m.get('setGlobal') or {}).keys()):
                m['askCue'] = True
                m['whenPerceivable'] = True
                m['delayMs'] = max(1, m.get('delayMs') or 0)
                if choice_key:
                    m['askCueUntil'] = choice_key
                m['askCueMs'] = piece.get('replyMs', REPLY_MS)
                twins = [b for b in maps if b is not m and b.get('bark') and b.get('targetKnot')
                         and b['eventPattern'] == m['eventPattern'] and (b.get('delayMs') or 0) == (m.get('delayMs') or 0)]
                for b in twins:
                    b['whenPerceivable'] = True
                if done_key and choice_key:
                    # the ask holds (delayMs, perceivable) and is judged again when it lapses: it must not
                    # depend on the kiosk's quiet flag (closing the debrief again clears it, and the dropped
                    # ask left the success screen held for ever), and must not run once the colleague has
                    # been answered or the beat is over
                    for x in [m] + twins:
                        x['condition'] = _ask_condition(x.get('condition'), done_key, choice_key)
                    rearm += _rearm_mappings(m, twins, out_key, ask, done_key, choice_key)
        if done_key and choice_key:
            # the follow-through (a witness reacts to the colleague's answer) is not tied to the quiet flag either
            for m in maps:
                if str(m.get('eventPattern', '')).endswith(f':{choice_key}'):
                    m['condition'] = _strip_quiet(m.get('condition'))
        # appended last: the server keys a mapping by its index
        maps.extend(rearm)
    if done_key and choice_key:
        # a follow-through spoken by the host (ca02, ca07, ca18: the piece's own `mappings`) gets the same treatment
        for m in piece.get('mappings', []):
            if str(m.get('eventPattern', '')).endswith(f':{choice_key}'):
                m['condition'] = _strip_quiet(m.get('condition'))
    return piece


def _subst(node, prefix, row):
    """Fill {prefix}, {ep}, {chain} and {out} in every string of a set-piece fragment."""
    if isinstance(node, str):
        return (node.replace('{prefix}', prefix or '').replace('{ep}', row['ep'])
                .replace('{chain}', chain_id(row)).replace('{out}', out_global(row)))
    if isinstance(node, list):
        return [_subst(v, prefix, row) for v in node]
    if isinstance(node, dict):
        return {_subst(k, prefix, row): _subst(v, prefix, row) for k, v in node.items()}
    return node


# ---- kit output ----------------------------------------------------------------

def _pool(kit):
    p = kit['pool']
    return {'lines': list(p['lines']), 'requireGlobal': copy.deepcopy(p['requireGlobal'])}


def room_npcs(kit, row, prefix=None, keyed=False):
    """The two ambient staff as room NPC records, then the set piece's own `npcs`. Empty for tier none.
    With `keyed`, each NPC's eventMappings carry their `_kitKey`."""
    out = _room_npcs(kit, row, prefix)
    return out if keyed else strip_keys(out)


def _room_npcs(kit, row, prefix=None):
    if not active(row):
        return []
    # chatter is written only for a kit with a pool and a row that is not the convention form
    pool_key = kit['pool']['key'] if has_pool(kit) and not is_convention(row) else None
    out = []
    patches = _subst(_set_piece(kit, row).get('staff', {}), prefix, row)
    for person in row['ambient']:
        s = copy.deepcopy(kit['staff'][person])
        lines = s.pop('chatterLines', None)
        if lines is not None and not has_pool(kit):
            raise ValueError(f'kit {kit.get("company")!r}: {person!r} has chatterLines but the kit has no pool')
        if lines is None and pool_key is not None:
            raise KeyError(f'kit {kit.get("company")!r}: {person!r} has no chatterLines')
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
            'currentKnot': row['stub'] if is_convention(row) else 'start',
        }
        if 'needs' in s:
            npc['needsHome'] = s.pop('needsHome')
            npc['needsRooms'] = ['training_room']
        else:
            # a seated, needs-free colleague (D12): the needs system never registers them, so they
            # carry no home or rooms; `seated` and `position` (a desk chair) come from the record
            for k in ('needsHome', 'needsRooms', 'needsSpeed', 'chatterCooldownMin'):
                s.pop(k, None)
        npc.update(s)
        if pool_key is not None:
            # the pool is spoken only through the engine-spoken coffee topic, in the object form
            # that carries the same gate as the top-level pool (validator V13)
            npc['chatter'] = {pool_key: {'lines': lines, 'requireGlobal': copy.deepcopy(kit['pool']['requireGlobal'])}}
        npc.update(patches.get(person, {}))
        if 'eventMappings' in npc:
            _ensure_keys(npc['eventMappings'], f"{row['id']} {npc['id']} eventMappings")
        out.append(npc)
    # a set piece's own `npcs` (ca12's visitor): kit-owned records, after the ambient pair, written as the
    # set piece has them (placeholders filled in; no currentKnot/storyPath defaults, the record carries them)
    for extra in _subst(copy.deepcopy(_set_piece(kit, row).get('npcs', [])), prefix, row):
        if 'eventMappings' in extra:
            _ensure_keys(extra['eventMappings'], f"{row['id']} {extra.get('id')} eventMappings")
        out.append(extra)
    return out


def room_objects(kit, row, prefix=None):
    """Need sources plus the set piece's objects. Empty for tier none."""
    if not active(row):
        return []
    pool_key = kit['pool']['key'] if has_pool(kit) else None
    out = []
    for src in kit.get('sources', []):
        o = copy.deepcopy(src)
        aff = o.get('affordance', {})
        if is_convention(row):
            aff.pop('chatter', None)       # the convention form has no chatter; the need affordance stays
        elif aff.get('chatter') == 'pool':
            aff['chatter'] = pool_key
        out.append(o)
    out.extend(_subst(copy.deepcopy(_set_piece(kit, row).get('objects', [])), prefix, row))
    return out


def kit_globals(kit, row, prefix=None):
    """Globals to declare in globalVariables. Empty for tier none."""
    if not active(row):
        return {}
    if is_convention(row):
        return {'kit_ep': row['ep']}       # the shared mappings never fire in ca00, so declare nothing else
    g = {k: False for k in SHARED_BOOLS}
    g['kit_ep'] = row['ep']
    if row.get('stepAway'):
        g[out_global(row)] = False
    g.update(_subst(copy.deepcopy(_set_piece(kit, row).get('globals', {})), prefix, row))
    if row.get('hostLine'):
        # The hub-first host layer-2 "said once" flag (plan 6.6), declared only for a row whose shell
        # has a host line (the explicit hostLine field; keyMessage is a different thing). Set pieces
        # no longer hard-code it. setdefault keeps its position if a set piece still declares it.
        g.setdefault(f"kit_{row['ep']}_host_said", False)
    if row.get('keyMessage'):
        g[KEY_GLOBAL] = False
    return g


def message_globals(row):
    """The outcome.messageGlobals entry the row's keyMessage writes into the shell's triage set: the one
    message the episode's key lesson rides on (did the learner catch it) -> the generic kit_key_caught.
    Empty for tier none or a row with no keyMessage."""
    if not active(row) or not row.get('keyMessage'):
        return {}
    return {row['keyMessage']: KEY_GLOBAL}


def piece_message_globals(kit, row):
    """The set piece's own outcome.messageGlobals entries (message id -> a kit_ global), written beside the
    row's keyMessage one. The engine writes each true when that message was caught (Report, Delete or Verify)
    and false otherwise, so a kit_ global that stays false on a phish means it was trusted (or left unanswered)."""
    if not active(row) or is_convention(row):
        return {}
    mg = copy.deepcopy(_set_piece(kit, row).get('messageGlobals', {}))
    bad = [v for v in mg.values() if not str(v).startswith('kit_')]
    if bad:
        raise ValueError(f"{row['id']}: set piece messageGlobals names must start kit_, not {bad!r}")
    return mg


CAUGHT_VERDICTS = ('report', 'delete', 'verify')


def message_caught_verdicts(row):
    """The outcome.messageCaughtVerdicts entry for the row's keyMessage: the verdicts that count as
    caught for it (the row's keyCaughtVerdicts, e.g. ['report'] for a breach notice whose lesson is to
    report it), so a Delete does not set kit_key_caught (W2 build review M1). Empty when the row has no
    keyMessage or no keyCaughtVerdicts: the engine default (Report, Delete or Verify) then applies."""
    v = row.get('keyCaughtVerdicts')
    if not message_globals(row) or not v:
        return {}
    if not isinstance(v, list) or not all(x in CAUGHT_VERDICTS for x in v):
        raise ValueError(f"{row['id']}: keyCaughtVerdicts must be a list drawn from {CAUGHT_VERDICTS}, not {v!r}")
    return {row['keyMessage']: list(v)}


def kit_timers(kit, row, prefix=None):
    if not active(row):
        return []
    return _subst(copy.deepcopy(_set_piece(kit, row).get('timers', [])), prefix, row)


def host_mappings(kit, row, prefix, state_global, keyed=False):
    """Host eventMappings, to be appended after the host's existing ones (plan 6.1). With `keyed`, each record
    carries its `_kitKey` (the merge reads it; nothing written to a scenario does)."""
    if not active(row) or is_convention(row):
        return []
    m = _host_mappings(kit, row, prefix, state_global)
    return m if keyed else strip_keys(m)


def _host_mappings(kit, row, prefix, state_global):
    state = f'global_variable_changed:{state_global}'
    complete = f'global_variable_changed:{prefix}complete'
    m = [{KEY: 'quiet_on', 'eventPattern': state, 'onceOnly': True, 'setGlobal': {'kit_quiet': True}}]
    if row.get('attack'):
        m.append({KEY: 'attack_done', 'eventPattern': state, 'condition': "data.value.stage === 'defend'",
                  'onceOnly': True, 'setGlobal': {'kit_attack_done': True}})
    m.append({KEY: 'defend_done', 'eventPattern': complete, 'condition': 'value === true', 'onceOnly': True,
              'setGlobal': {'kit_defend_done': True}})
    m.append({KEY: 'caught', 'eventPattern': complete,
              'condition': f'value === true && globalVars.{prefix}percent >= {CAUGHT_PERCENT}',
              'onceOnly': True, 'setGlobal': {'kit_caught': True}})
    m.append({KEY: 'quiet_off_debrief', 'eventPattern': state, 'condition': "data.value.done.includes('debrief')",
              'onceOnly': True, 'setGlobal': {'kit_quiet': False}})
    if row.get('stepAway'):
        # The panel's Close can leave done without 'debrief'; debriefSeen is the second release.
        # Conditions support && only, never ||, so it is its own mapping.
        m.append({KEY: 'quiet_off_debrief_seen', 'eventPattern': state, 'condition': 'data.value.debriefSeen === true',
                  'onceOnly': True, 'setGlobal': {'kit_quiet': False}})
        step = {KEY: 'step_away', 'eventPattern': 'episode_step_away', 'condition': 'globalVars.kit_defend_done === true',
                'onceOnly': True, 'setGlobal': {out_global(row): True}}
        if row.get('stepAwayBark'):
            step['bark'] = row['stepAwayBark']
        m.append(step)
    m.extend(_ensure_keys(_subst(copy.deepcopy(_set_piece(kit, row).get('mappings', [])), prefix, row),
                          'set piece mappings'))
    return _ensure_keys(m, f"{row['id']} host mappings")


def scenario_fields(kit, row):
    """Top-level scenario keys the kit adds: npcThoughts and the shared pool (the coffee topic).
    Empty for tier none."""
    if not active(row):
        return {}
    f = copy.deepcopy(kit.get('scenario', {}))
    if is_convention(row):
        f['npcThoughts'] = False       # nothing is spoken unprompted in ca00: no pool, no thoughts
    elif has_pool(kit):
        f['chatter'] = {kit['pool']['key']: _pool(kit)}
    return f


TTS_FLAG = 'ttsPregenerateChatter'


def shell_flags(row):
    """Shell-level flags the kit sets on a course shell (D306 step 2): ttsPregenerateChatter, so a voicing batch
    lists the kit's chatter and exchange lines. Kept out of scenario_fields/build (and so out of kit_owned)
    because the pinned gate A fixture must stay byte-identical: the fixture and the test_ scenarios get none.
    Empty for tier none. Checks and the annual are refused by the kit before they get here."""
    if not active(row) or row.get('fixture') or str(row.get('id', '')).startswith('test_'):
        return {}
    return {TTS_FLAG: True}


def kiosk_condition(row):
    """The kiosk's finished-text condition in a shell with the step-away panel, else None."""
    return KIOSK_FINISHED if active(row) and row.get('stepAway') else None


def _merge_override(dst, patch):
    """Deep-merge patch into dst in place. A patch value of None deletes that key."""
    for k, v in patch.items():
        if v is None:
            dst.pop(k, None)
        elif isinstance(v, dict) and isinstance(dst.get(k), dict):
            _merge_override(dst[k], v)
        else:
            dst[k] = copy.deepcopy(v)
    return dst


def apply_override(kit, row):
    """A copy of the kit with the row's `override` applied (pool, sources by id, staff by person).
    Used only to pin a test fixture to its frozen placeholder positions and timings (4.3)."""
    ov = (row or {}).get('override')
    if not ov:
        return kit
    kit = copy.deepcopy(kit)
    if ov.get('pool') and kit.get('pool'):
        _merge_override(kit['pool'], ov['pool'])
    for src in kit.get('sources', []):
        patch = ov.get('sources', {}).get(src.get('id'))
        if patch:
            _merge_override(src, patch)
    for person, patch in ov.get('staff', {}).items():
        if person in kit.get('staff', {}):
            _merge_override(kit['staff'][person], patch)
    return kit


def kit_keyed(kit, row):
    """Kit `resources` / `roles` to add to the shell's own collections (a dict keyed by id, or a list of
    records with an id). Empty for tier none or a kit with none; every id must start kit_ so strip_kit owns it."""
    if not active(row):
        return {}
    out = {}
    piece = _set_piece(kit, row)
    for key in KIT_KEYED:
        v = kit.get(key)
        extra = piece.get(key) if key == 'resources' else None   # a set piece's own resources, for its row only
        if extra:
            if v and isinstance(v, dict) != isinstance(extra, dict):
                raise ValueError(f'set piece {key} and kit {key} must both be dicts or both be lists')
            if not v:
                v = extra
            elif isinstance(v, dict):
                v = {**v, **extra}
            else:
                v = list(v) + list(extra)
        if not v:
            continue
        ids = list(v) if isinstance(v, dict) else [r.get('id') for r in v]
        bad = [i for i in ids if not str(i).startswith('kit_')]
        if bad:
            raise ValueError(f'kit {key} ids must start with kit_: {bad}')
        out[key] = copy.deepcopy(v)
    return out


def build(kit, row, prefix, state_global, keyed=False):
    """Everything the kit owns for one shell, in one dict (the form the tests compare). With `keyed`, the
    host mappings and each NPC's eventMappings keep their `_kitKey` (what the merge reads); otherwise the keys
    are stripped, so the result is exactly what reaches a scenario file."""
    out = _build(kit, row, prefix, state_global)
    return out if keyed else strip_keys(out)


def _build(kit, row, prefix, state_global):
    kit = apply_override(kit, row)
    check_pool(kit)
    out = {
        'npcs': room_npcs(kit, row, prefix, keyed=True),
        'objects': room_objects(kit, row, prefix),
        'globals': kit_globals(kit, row, prefix),
        'timers': kit_timers(kit, row, prefix),
        'mappings': host_mappings(kit, row, prefix, state_global, keyed=True),
        'scenario': scenario_fields(kit, row),
        'stepAway': bool(active(row) and row.get('stepAway')),
    }
    mg = {**message_globals(row), **piece_message_globals(kit, row)}
    if mg:
        out['messageGlobals'] = mg
    if message_caught_verdicts(row):
        out['messageCaughtVerdicts'] = message_caught_verdicts(row)
    out.update(kit_keyed(kit, row))     # resources / roles: present only when the kit has them
    return out


# ---- ownership (plan 4.2) ------------------------------------------------------

# a kit_ name, not the tail of another one (skit_x, payload_kit_x)
KIT_NAME = re.compile(r'(?<![A-Za-z0-9_])kit_')


def _mentions_kit(v):
    if isinstance(v, str):
        return bool(KIT_NAME.search(v))
    if isinstance(v, dict):
        return any(_mentions_kit(k) or _mentions_kit(x) for k, x in v.items())
    if isinstance(v, list):
        return any(_mentions_kit(x) for x in v)
    return False


def is_kit_member(m):
    return isinstance(m, dict) and str(m.get('id', '')).startswith('kit_')


KIT_COND = re.compile(r'globalVars\.kit_')


def is_kit_mapping(m):
    """A host mapping is kit-owned when its setGlobal key is a kit_ global, its knot (or targetKnot) is named
    kit_*, or its condition reads a kit global as `globalVars.kit_*` (the only form kit-built conditions use).
    A hand mapping that merely mentions kit_ in other words is not claimed."""
    sg = m.get('setGlobal')
    if isinstance(sg, dict) and any(str(k).startswith('kit_') for k in sg):
        return True
    return bool(KIT_COND.search(str(m.get('condition', '')))) or bool(KIT_NAME.search(str(m.get('knot', ''))) or KIT_NAME.search(str(m.get('targetKnot', ''))))


# top-level keys the kit owns whole; `chatter` is shared with the shell, so only its kit_ keys are the kit's
KIT_TOP_KEYS = ('npcThoughts', 'officePresets')
KIT_KEYED = ('resources', 'roles')   # shell-owned collections the kit may add kit_ entries to


def kit_chatter(sc):
    c = sc.get('chatter')
    return {k: v for k, v in c.items() if str(k).startswith('kit_')} if isinstance(c, dict) else {}


def _find_host(sc, host_id=None):
    npcs = sc['rooms']['training_room']['npcs']
    if host_id:
        hits = [n for n in npcs if n.get('id') == host_id]
    else:
        own = f"scenarios/{sc.get('scenario_id')}/ink/"
        # positioned only, as find_host_span does: ca03's Leila shares the host's ink but has no position
        hits = [n for n in npcs if not is_kit_member(n) and 'position' in n and str(n.get('storyPath', '')).startswith(own)]
        if not hits:
            hits = [n for n in npcs if not is_kit_member(n)][:1]
    if len(hits) != 1:
        raise ValueError(f'expected one host NPC, found {len(hits)}')
    return hits[0]


def key_outcome(sc):
    """The outcome object of the shell's first triage set (the one shell_ids reads), or None."""
    sets = sc.get('social', {}).get('triageSets') or []
    return sets[0].get('outcome') if sets and isinstance(sets[0].get('outcome'), dict) else None


def _kit_message_globals(outcome):
    mg = (outcome or {}).get('messageGlobals')
    return {k: v for k, v in mg.items() if str(v).startswith('kit_')} if isinstance(mg, dict) else {}


def _kit_caught_verdicts(outcome):
    """The kit-owned outcome.messageCaughtVerdicts entries: those for a message the kit's
    messageGlobals lists (a kit_ global)."""
    mcv = (outcome or {}).get('messageCaughtVerdicts')
    ids = _kit_message_globals(outcome)
    return {k: v for k, v in mcv.items() if k in ids} if isinstance(mcv, dict) else {}


def has_step_away(episode):
    """True when an awarenessEpisode carries the kit's step-away: the legacy `stepAway: true`, or a hand-written
    `stepAways` list (plan E3) with a post-defend `episode_step_away` beat. The two are exclusive (the validator
    rejects both set), and the kit never adds `stepAway` beside a `stepAways` list."""
    if not isinstance(episode, dict):
        return False
    if isinstance(episode.get('stepAways'), list):
        return any(isinstance(b, dict) and b.get('after') == 'defend' and b.get('event') == 'episode_step_away'
                   for b in episode['stepAways'])
    return episode.get('stepAway') is True


def strip_kit(sc, host_id=None):
    """A deep copy of a parsed shell with every kit-owned member removed."""
    sc = copy.deepcopy(sc)
    tr = sc['rooms']['training_room']
    tr['npcs'] = [n for n in tr['npcs'] if not is_kit_member(n)]
    tr['objects'] = [o for o in tr.get('objects', []) if not is_kit_member(o)]
    host = _find_host(sc, host_id)
    if 'eventMappings' in host:
        kept = [m for m in host['eventMappings'] if not is_kit_mapping(m)]
        if kept or len(kept) == len(host['eventMappings']):
            host['eventMappings'] = kept
        else:
            del host['eventMappings']      # the kit created it: leave no empty list behind
    gv = sc.get('globalVariables', {})
    for k in [k for k in gv if k.startswith('kit_')]:
        del gv[k]
    for k in KIT_TOP_KEYS:
        sc.pop(k, None)
    sc.pop(TTS_FLAG, None)         # set by shell_flags on a course shell, never on the fixture
    if isinstance(sc.get('chatter'), dict):
        sc['chatter'] = {k: v for k, v in sc['chatter'].items() if not str(k).startswith('kit_')}
        if not sc['chatter']:
            del sc['chatter']
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
    # `stepAway` is the kit's; a `stepAways` list is hand-written (it also holds the shell's own world beats),
    # so it stays through strip and apply, and apply_kit then adds no `stepAway` beside it.
    sc['social']['awarenessEpisode'].pop('stepAway', None)
    oc = key_outcome(sc)
    if _kit_caught_verdicts(oc):
        rest = {k: v for k, v in oc['messageCaughtVerdicts'].items() if k not in _kit_message_globals(oc)}
        if rest:
            oc['messageCaughtVerdicts'] = rest
        else:
            del oc['messageCaughtVerdicts']
    if _kit_message_globals(oc):
        rest = {k: v for k, v in oc['messageGlobals'].items() if not str(v).startswith('kit_')}
        if rest:
            oc['messageGlobals'] = rest
        else:
            del oc['messageGlobals']       # the kit created it: leave no empty object behind
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


class KitMergeError(ValueError):
    """A regeneration would move an existing record or clash with a hand-written one."""


def _keyed(records, ident):
    """[(ident, n)] where n counts earlier records with the same ident: the nth of an ident is one identity."""
    seen = {}
    out = []
    for r in records:
        i = ident(r)
        out.append((i, seen.get(i, 0)))
        seen[i] = seen.get(i, 0) + 1
    return out


def merge_plan(old, new, owned, ident, label='list', strict=False, unique=False):
    """What merging a kit's `new` records into the shell's `old` list does, as [(op, old_index, record)]:
    ('keep', i, None) a hand record or an untouched one stays; ('set', i, rec) a record `owned` by the kit
    stays at i, replaced by the kit's current copy with the same identity (`ident`, then the nth of it among
    the owned ones); ('add', None, rec) a kit record the shell has not got goes last. A kit record the kit no
    longer produces is dropped. With `strict` (eventMappings: the server keys them by index), dropping one
    that has any record after it raises KitMergeError, since that would shift the later ones; at the end of
    the list it is fine. With `unique`, a kit record whose ident is a hand record's raises (id collision)."""
    if unique:
        hand = {ident(o) for o in old if not owned(o) and ident(o) is not None}
        clash = sorted(str(ident(n)) for n in new if ident(n) in hand)
        if clash:
            raise KitMergeError(f"{label}: a hand-written record and a kit record share the id {', '.join(clash)}")
        # Ownership is by key: an old record is the kit's copy when its id is one the kit generates. A second
        # old record with such an id is a hand-written one sharing it (a regenerated shell holds each once).
        gen = {ident(n) for n in new}
        ids = [ident(o) for o in old if ident(o) in gen]
        twice = sorted({str(i) for i in ids if ids.count(i) > 1})
        if twice:
            raise KitMergeError(f"{label}: a hand-written record and a kit record share the id {', '.join(twice)}")
    pending = {k: n for k, n in zip(_keyed(new, ident), new)}
    owned_keys = iter(_keyed([o for o in old if owned(o)], ident))
    used = set()
    plan = []
    gone = None
    for i, o in enumerate(old):
        if not owned(o):
            k = None
        else:
            k = next(owned_keys)
        n = pending.get(k) if k is not None else None
        if k is None:
            plan.append(('keep', i, None))
            if strict and gone is not None:
                raise KitMergeError(
                    f"{label}: the kit no longer produces the mapping at index {gone[0]} {gone[1]!r}, and records "
                    f"follow it (index {i}), so regenerating would shift them. Keep that mapping in the kit data, "
                    f"or edit the shell's list by hand.")
        elif n is None:
            if gone is None:
                gone = (i, k[0])
        else:
            used.add(k)
            plan.append(('set', i, n))
            if strict and gone is not None:
                raise KitMergeError(
                    f"{label}: the kit no longer produces the mapping at index {gone[0]} {gone[1]!r}, and records "
                    f"follow it (index {i}), so regenerating would shift them. Keep that mapping in the kit data, "
                    f"or edit the shell's list by hand.")
    plan += [('add', None, n) for k, n in zip(_keyed(new, ident), new) if k not in used]
    return plan


def merge_list(old, new, owned, ident, label='list', strict=False, unique=False):
    """Merge a kit's `new` records into the shell's `old` list without moving anything (see merge_plan)."""
    return [old[i] if op == 'keep' else rec for op, i, rec in merge_plan(old, new, owned, ident, label, strict, unique)]


def merge_dict(old, new, owned_key, label='dict'):
    """merge_list for a dict: kit-owned keys keep their position (new value), others stay, new keys go last.
    A hand key the kit also writes raises KitMergeError."""
    clash = sorted(str(k) for k in new if k in old and not owned_key(k))
    if clash:
        raise KitMergeError(f"{label}: a hand-written entry and a kit entry share the key {', '.join(clash)}")
    out = {}
    for k, v in old.items():
        if not owned_key(k):
            out[k] = v
        elif k in new:
            out[k] = new[k]
    for k, v in new.items():
        if k not in out:
            out[k] = v
    return out


def map_ident(m):
    """What a kit mapping is for (the key merge_plan pairs old and new by, with the nth of it)."""
    return _map_id(m)


def member_ident(m):
    return m.get('id')


def _strong_kit_mapping(m):
    """A mapping that sets a kit_ global or runs a kit_ knot: surely the kit's when the kit used to write it.
    One that only reads a kit_ global in its condition (the step-away mapping, a hand follow-through) is not."""
    sg = m.get('setGlobal')
    return (isinstance(sg, dict) and any(str(k).startswith('kit_') for k in sg)) or bool(
        KIT_NAME.search(str(m.get('knot', ''))) or KIT_NAME.search(str(m.get('targetKnot', ''))))


def _purpose_elems(m):
    return set(_map_id(m)[1])


def _summ(m):
    """One line naming a mapping: its event, what it sets or runs, and the start of its condition."""
    sg = sorted(m.get('setGlobal') or {})
    what = f"sets {sg}" if sg else f"knot {m.get('knot') or m.get('targetKnot')}" if (m.get('knot') or m.get('targetKnot')) else 'no set/knot'
    return f"{m.get('eventPattern')} ({what}; {str(m.get('condition', ''))[:50]!r})"


def match_mappings(old, new, candidate, orphan_ok, label='mappings'):
    """One-off matcher: the key (a new record's `_kitKey`) of each record in the shell's `old` list, from what
    the shell holds today. The result is parallel to `old`: a key string (the kit still writes it), ('orphan', n)
    (a record the kit used to write and no longer does) or None (a hand record). Everything after this step
    is decided by key, not by content.
      1. an old candidate equal to a new record is that record (the usual case: the shell was generated);
      2. of the rest, old and new with the same event and purpose pair up in order when there are the same
         number of each; an uneven count (an edit and an insert at once) cannot be told apart and raises;
      3. of the rest, one old and one new on the same event that share a purpose element (a kit_ global or a
         knot) pair up (a mapping that gained a second kit_ global).
    A candidate still unmatched is an orphan when `orphan_ok` (it is a kit mapping the kit dropped), else hand."""
    plain = [strip_keys(n) for n in new]
    keys = [None] * len(old)
    free_new = list(range(len(new)))
    cand = [i for i, o in enumerate(old) if candidate(o)]
    for i in cand:
        for j in free_new:
            if plain[j] == old[i]:
                keys[i] = new[j][KEY]
                free_new.remove(j)
                break
    left = [i for i in cand if keys[i] is None]
    groups = {}
    for i in left:
        groups.setdefault(_map_id(old[i]), ([], []))[0].append(i)
    for j in free_new:
        g = groups.get(_map_id(new[j]))
        if g:
            g[1].append(j)
    for ident, (oi, nj) in groups.items():
        if oi and nj and len(oi) != len(nj):
            raise KitMergeError(f"{label}: {len(oi)} old and {len(nj)} new kit mapping(s) share {_summ(old[oi[0]])[:60]}, "
                                f"and the kit data changed more than one of them, so which is which cannot be told. "
                                f"Edit the kit data in separate steps (an edit, then an insert).")
        for i, j in zip(oi, nj):
            keys[i] = new[j][KEY]
            free_new.remove(j)
    left = [i for i in cand if keys[i] is None]
    for i in list(left):
        ev = old[i].get('eventPattern')
        near_new = [j for j in free_new if new[j].get('eventPattern') == ev and _purpose_elems(new[j]) & _purpose_elems(old[i])]
        near_old = [k for k in left if old[k].get('eventPattern') == ev and _purpose_elems(old[k]) & _purpose_elems(old[i])]
        if len(near_new) == 1 and len(near_old) == 1:
            keys[i] = new[near_new[0]][KEY]
            free_new.remove(near_new[0])
            left.remove(i)
    for n, i in enumerate(i for i in cand if keys[i] is None):
        if orphan_ok(old[i]):
            keys[i] = ('orphan', n)
    return keys


def keyed_plan(old, old_keys, new, label):
    """[(op, old_index, record)] for a list the server keys by index: ('keep', i, None) a hand record stays;
    ('set', i, rec) a kit record stays at its index with the kit's current copy (matched by key); ('add', None,
    rec) a kit record the shell lacks goes after every old one. A kit record the kit dropped comes off the list
    only when nothing after it stays; otherwise the later records would shift, which raises KitMergeError."""
    new_by_key = {}
    for n in new:
        if n[KEY] in new_by_key:
            raise ValueError(f'{label}: duplicate _kitKey {n[KEY]}')
        new_by_key[n[KEY]] = n
    plan, used, gone = [], set(), None
    for i, (o, k) in enumerate(zip(old, old_keys)):
        if k is None or isinstance(k, str):
            if gone is not None:
                raise KitMergeError(
                    f"{label}: the kit no longer produces the mapping at index {gone[0]} {_summ(gone[1])}"
                    f"{' (ledger key ' + repr(gone[2]) + ': key renamed or removed)' if gone[2] else ''}, and records "
                    f"follow it (index {i}), so regenerating would shift them. Keep that mapping in the kit data, "
                    f"or edit the shell's list by hand.")
        if k is None:
            plan.append(('keep', i, None))
        elif isinstance(k, str):
            used.add(k)
            plan.append(('set', i, strip_keys(new_by_key[k])))
        elif gone is None:
            gone = (i, o, k[2] if len(k) > 2 else None)
    plan += [('add', None, strip_keys(n)) for n in new if n[KEY] not in used]
    return plan


def check_positions(label, old, old_keys, merged, new):
    """The backstop for an index-keyed list: for every index i of the old list, merged[i] must be the same
    record (a hand record unchanged; a kit record the one with the same key). A kit record the kit dropped
    may only leave off the end, and new records go after every old one. Anything else raises KitMergeError
    naming the list, the index and the two records."""
    by_key = {n[KEY]: strip_keys(n) for n in new}
    for i, (o, k) in enumerate(zip(old, old_keys)):
        got = merged[i] if i < len(merged) else None
        if k is None:
            ok = got == o
        elif isinstance(k, str):
            ok = got == by_key[k]
        else:
            ok = got is None        # dropped: only from the end
        if not ok:
            raise KitMergeError(f"{label}: index {i} would change from {_summ(o)} to "
                                f"{_summ(got) if got is not None else 'nothing'}; the server keys this list by index, "
                                f"so a mapping may only change in place, be dropped from the end, or be added last")


LEDGER_DIR = os.path.join(KITS_DIR, 'ledger')


def ledger_path(sid, ledger_dir=None):
    return os.path.join(ledger_dir or LEDGER_DIR, f'{sid}.json')


def record_hash(rec):
    """Short content fingerprint of one record as written to the shell: sha256 of its canonical JSON (sorted
    keys, compact separators, `_kitKey` stripped), first 8 hex digits."""
    blob = json.dumps(strip_keys(rec), sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()[:8]


def load_ledger(sid, ledger_dir=None):
    """The shell's stored ledger {'host': [key|None, ...], 'npc:<id>': [...], '_hashes': {list: [h, ...]}}, or
    None when it has none. `_hashes` is left out for an old key-only ledger (no content check then)."""
    path = ledger_path(sid, ledger_dir)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        doc = json.load(f)
    keys, hashes = {}, {}
    for name, entries in doc['lists'].items():
        keys[name] = [e['k'] if isinstance(e, dict) else e for e in entries]
        if all(isinstance(e, dict) for e in entries):
            hashes[name] = [e['h'] for e in entries]
    if hashes and len(hashes) == len(keys):
        keys['_hashes'] = hashes
    return keys


def ledger_text(sid, lists):
    """Plain, sorted, one entry per line ({"k": key-or-null, "h": content hash}), so a diff shows exactly
    which index changed."""
    hashes = lists['_hashes']
    out = ['{', f' "scenario": {json.dumps(sid)},', ' "lists": {']
    names = sorted(k for k in lists if k != '_hashes')
    for ni, name in enumerate(names):
        if len(lists[name]) != len(hashes[name]):
            raise KitMergeError(f"{sid} {name}: {len(lists[name])} ledger keys but {len(hashes[name])} hashes")
        out.append(f'  {json.dumps(name)}: [')
        for i, (k, h) in enumerate(zip(lists[name], hashes[name])):
            out.append('   ' + json.dumps({'k': k, 'h': h}) + (',' if i < len(lists[name]) - 1 else ''))
        out.append('  ]' + (',' if ni < len(names) - 1 else ''))
    out += [' }', '}', '']
    return '\n'.join(out)


def save_ledger(sid, lists, ledger_dir=None, path=None):
    path = path or ledger_path(sid, ledger_dir)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    text = ledger_text(sid, lists)      # built first: a failure writes nothing
    with open(path, 'w') as f:
        f.write(text)
    return path


def _ledger_keys(old, ledger_list, new, label, sid, hashes=None):
    """The key of each record of the shell's `old` list, read from the stored ledger (no content matching):
    a str when the kit still writes that key, None for a hand record, ('orphan', i, key) when the kit no
    longer has the key (dropped, or renamed: a rename is a drop plus an insert)."""
    resync = f"resync with: apply_training_room.py --rebuild-ledger {sid} (infers the keys once from the shell as it is)"
    if len(ledger_list) != len(old):
        raise KitMergeError(f"{label}: the key ledger holds {len(ledger_list)} entries but the shell's list holds "
                            f"{len(old)}, so the shell was edited out of step with the ledger; {resync}")
    seen = [k for k in ledger_list if k is not None]
    if len(seen) != len(set(seen)):
        raise KitMergeError(f"{label}: the key ledger repeats a key; {resync}")
    kit_keys = {n[KEY] for n in new}
    if hashes is not None:
        _check_hashes(old, ledger_list, hashes, new, label, sid)
    return [None if k is None else k if k in kit_keys else ('orphan', i, k) for i, k in enumerate(ledger_list)]


def _check_hashes(old, ledger_list, hashes, new, label, sid):
    """The shell's records must still be the ones the ledger recorded (same length, same keys already
    checked). Kit entries must hash to the stored h. Hand entries may have been edited, but must not be a
    kit record: not one stored under a kit entry's h (a swap), nor one the kit builds now."""
    fix = (f"shell edited by hand or out of step; run apply_training_room.py --rebuild-ledger {sid} "
           f"after checking")
    if len(hashes) != len(old):
        raise KitMergeError(f"{label}: the key ledger holds {len(hashes)} hashes for {len(old)} records; {fix}")
    now = [record_hash(o) for o in old]
    kit_stored = {h for k, h in zip(ledger_list, hashes) if k is not None}
    built = {n[KEY]: record_hash(n) for n in new}
    for i, (k, h, cur) in enumerate(zip(ledger_list, hashes, now)):
        if k is not None:
            if cur != h:
                raise KitMergeError(f"{label}: scenario {sid}, list {label.split(' ', 1)[1]}, index {i}, key {k!r}: "
                                    f"the record no longer matches the ledger; {fix}")
        elif cur in kit_stored:
            raise KitMergeError(f"{label}: scenario {sid}, index {i} is a hand record in the ledger but holds a "
                                f"stored kit record (a hand/kit swap); {fix}")
        elif cur in built.values():
            bk = next(b for b, bh in built.items() if bh == cur)
            raise KitMergeError(f"{label}: scenario {sid}, index {i} is a hand record in the ledger but equals the "
                                f"kit's record {bk!r}; {fix}")
    have = set(ledger_list)
    for key, bh in built.items():
        if key in have:
            continue
        # A record whose ledger key the kit no longer builds is a rename or a drop: keyed_plan reports that.
        at = [i for i, cur in enumerate(now) if cur == bh and (ledger_list[i] is None or ledger_list[i] in built)]
        if at:
            raise KitMergeError(f"{label}: scenario {sid}, key {key!r} is not in the ledger but its record is "
                                f"already at index {at[0]}; appending it would duplicate it; {fix}")


def _ledger_from_keys(keys):
    """The ledger list for inferred keys: a str stays, None stays, an orphan gets a stable placeholder."""
    return [k if k is None or isinstance(k, str) else f'orphan:{k[1]}' for k in keys]


def _ledger_after(keys, plan, new):
    """The ledger list for the merged list: old positions in order (dropped ones gone), then added keys."""
    used = {keys[i] for op, i, _ in plan if op == 'set'}
    return [keys[i] for op, i, _ in plan if op != 'add'] + [n[KEY] for n in new if n[KEY] not in used]


def merge_keyed_mappings(old, new, label, candidate, orphan_ok, ledger_list=None, sid='', hashes=None):
    """Merge a kit's keyed `new` mappings into the shell's `old` list. Returns (merged list, plan, old keys,
    orphans, new ledger list); the position guard has already run. With `ledger_list` (the stored keys of
    the old records) no content is matched: the record at index i has the ledger's key. Without one the keys
    are inferred from content once (match_mappings: bootstrap and rebuild only)."""
    if ledger_list is None:
        keys = match_mappings(old, new, candidate, orphan_ok, label)
    else:
        keys = _ledger_keys(old, ledger_list, new, label, sid, hashes)
    plan = keyed_plan(old, keys, new, label)
    merged = [old[i] if op == 'keep' else rec for op, i, rec in plan]
    check_positions(label, old, keys, merged, new)
    orphans = [old[i] for i, k in enumerate(keys) if isinstance(k, tuple)]
    return merged, plan, keys, orphans, _ledger_after(keys, plan, new)


def infer_ledger(orig, bk, sid, host_id=None):
    """The ledger of the shell `orig` as it stands, inferred from content once against the keyed build `bk`
    (bootstrap and --rebuild-ledger). Raises KitMergeError where the inference cannot tell records apart."""
    ohost = _find_host(orig, host_id)
    lists = {'host': _ledger_from_keys(match_mappings(
        ohost.get('eventMappings', []), bk['mappings'], is_kit_mapping, _strong_kit_mapping, f'{sid} host eventMappings'))}
    hashes = {'host': [record_hash(m) for m in ohost.get('eventMappings', [])]}
    for n in orig['rooms']['training_room']['npcs']:
        if is_kit_member(n) and n.get('eventMappings'):
            nk = next((x for x in bk['npcs'] if x['id'] == n['id']), None)
            ml = nk.get('eventMappings', []) if nk else []
            lists[f"npc:{n['id']}"] = _ledger_from_keys(match_mappings(
                n['eventMappings'], ml, lambda m: True, lambda m: True, f"{sid} npc {n['id']} eventMappings"))
            hashes[f"npc:{n['id']}"] = [record_hash(m) for m in n['eventMappings']]
    lists['_hashes'] = hashes
    return lists


def prepare(orig, bk, sid, host_id=None, ledger=None):
    """Everything a merge decides about eventMappings, from the shell `orig` and the keyed build `bk`: the host
    list and each kit NPC's own list (M2), merged by key with the position guard run. `ledger` is the stored
    {'host': [...], 'npc:<id>': [...]} key ledger (None: infer once). Returns a namespace:
    b (the plain build, its NPCs carrying the merged eventMappings), host_merged, host_plan, host_keys,
    npc_lists {npc id: (label, old list, old keys, keyed new list)}, lost (strings for hand_written) and
    ledger (the ledger of the merged shell)."""
    import types
    b = strip_keys(bk)
    ohost = _find_host(orig, host_id)
    old = ohost.get('eventMappings', [])
    host_label = f'{sid} host eventMappings'
    lget = (lambda k: ledger.get(k, [])) if ledger is not None else (lambda k: None)
    hget = (lambda k: ledger['_hashes'].get(k, [])) if ledger is not None and '_hashes' in ledger else (lambda k: None)
    merged, plan, keys, orphans, new_led = merge_keyed_mappings(
        old, bk['mappings'], host_label, is_kit_mapping, _strong_kit_mapping, lget('host'), sid, hget('host'))
    out_ledger = {'host': new_led}
    out_hashes = {'host': [record_hash(m) for m in merged]}
    lost = [f"host mapping on {m.get('eventPattern')} setting {sorted(m.get('setGlobal') or {})}" for m in orphans]
    old_npcs = {n['id']: n for n in orig['rooms']['training_room']['npcs'] if is_kit_member(n)}
    npc_lists = {}
    for nk, n in zip(bk['npcs'], b['npcs']):
        o = old_npcs.get(nk['id'])
        ml = nk.get('eventMappings', [])
        if o is None:
            if ml:
                out_ledger[f"npc:{nk['id']}"] = [m[KEY] for m in ml]
                out_hashes[f"npc:{nk['id']}"] = [record_hash(m) for m in ml]
            continue
        ol = o.get('eventMappings', [])
        if not ml and not ol:
            continue
        label = f"{sid} npc {nk['id']} eventMappings"
        nm, nplan, nkeys, norph, nled = merge_keyed_mappings(
            ol, ml, label, lambda m: True, lambda m: True, lget(f"npc:{nk['id']}"), sid,
            hget(f"npc:{nk['id']}"))
        if nm:
            n['eventMappings'] = nm
            out_ledger[f"npc:{nk['id']}"] = nled
            out_hashes[f"npc:{nk['id']}"] = [record_hash(m) for m in nm]
        else:
            n.pop('eventMappings', None)
        npc_lists[nk['id']] = (label, ol, nkeys, ml)
        lost += [f"npc {nk['id']} mapping on {m.get('eventPattern')}" for m in norph]
    out_ledger['_hashes'] = out_hashes
    return types.SimpleNamespace(b=b, host_merged=merged, host_plan=plan, host_keys=keys, host_old=old,
                                 host_new=bk['mappings'], npc_lists=npc_lists, lost=lost, ledger=out_ledger)


def apply_kit(sc, kit, row, host_id=None, ledger=None, ledger_out=None):
    """The shell with the kit's content applied (a new dict). Tier none returns an unchanged copy.
    Old kit-owned members are removed first, so applying twice gives the same result. `ledger` is the shell's
    stored key ledger (None: keys are inferred from content, for bootstrap); `ledger_out`, a dict, receives
    the ledger of the result."""
    if not active(row):
        return copy.deepcopy(sc)
    orig = copy.deepcopy(sc)
    out = strip_kit(sc, host_id)
    prefix, state_global = shell_ids(out, row)
    sid = row['id']
    prep = prepare(orig, build(kit, row, prefix, state_global, keyed=True), sid, host_id, ledger)
    if ledger_out is not None:
        ledger_out.update(prep.ledger)
    b = prep.b      # the plain build; its kit NPCs carry their eventMappings merged by key (M2)
    tr = out['rooms']['training_room']
    otr = orig['rooms']['training_room']
    tr['npcs'] = merge_list(otr['npcs'], b['npcs'], is_kit_member, member_ident, f'{sid} npcs', unique=True)
    tr['objects'] = merge_list(otr.get('objects', []), b['objects'], is_kit_member, member_ident, f'{sid} objects', unique=True)
    host = _find_host(out, host_id)
    ohost = _find_host(orig, host_id)
    if prep.host_merged or 'eventMappings' in host:       # a convention row has none: add no empty list
        host['eventMappings'] = prep.host_merged
    out['globalVariables'] = merge_dict(orig.get('globalVariables', {}), b['globals'], lambda k: k.startswith('kit_'), f'{sid} globalVariables')
    top = [(k, v) for k, v in b['scenario'].items() if k == 'npcThoughts']
    out = _insert_after(out, 'disableAttacks', top)
    after = []
    for k, v in b['scenario'].items():
        if k == 'npcThoughts':
            continue
        if k == 'chatter' and isinstance(orig.get('chatter'), dict):
            # the shell's own pools stay; the kit's kit_ ones keep their place, new ones go last. Merged
            # against the original even when every pool is the kit's (strip_kit then dropped the key)
            merged = merge_dict(orig['chatter'], v, lambda k: str(k).startswith('kit_'), f'{sid} chatter')
            if isinstance(out.get('chatter'), dict):
                out['chatter'] = merged
            else:
                after.append((k, merged))
        else:
            after.append((k, v))
    after.extend(shell_flags(row).items())
    if b['timers']:
        if 'timers' in out:
            out['timers'] = merge_list(orig.get('timers', []), b['timers'],
                                       lambda t: str(t.get('id', '')).startswith('kit_'), member_ident, f'{sid} timers', unique=True)
        else:       # all-kit (strip_kit dropped the key) or new: still merged against the original order
            after.append(('timers', merge_list(orig.get('timers', []), b['timers'],
                                               lambda t: str(t.get('id', '')).startswith('kit_'), member_ident,
                                               f'{sid} timers', unique=True)))
    for key in KIT_KEYED:
        if key in b:
            cur = out.get(key)
            if isinstance(cur, dict):
                out[key] = merge_dict(orig.get(key) or {}, b[key], lambda k: str(k).startswith('kit_'), f'{sid} {key}')
            elif isinstance(cur, list):
                out[key] = merge_list(orig.get(key) or [], b[key], is_kit_member, member_ident, f'{sid} {key}', unique=True)
            elif isinstance(orig.get(key), dict):      # all-kit: strip_kit dropped it; keep the old order
                after.append((key, merge_dict(orig[key], b[key], lambda k: str(k).startswith('kit_'), f'{sid} {key}')))
            elif isinstance(orig.get(key), list):
                after.append((key, merge_list(orig[key], b[key], is_kit_member, member_ident, f'{sid} {key}', unique=True)))
            else:
                after.append((key, b[key]))
    out = _insert_after(out, 'globalVariables', after)
    if b['stepAway'] and 'stepAways' not in out['social']['awarenessEpisode']:
        out['social']['awarenessEpisode']['stepAway'] = True
    if b.get('messageGlobals'):
        oc = key_outcome(out)
        if oc is None:
            raise ValueError(f"{row['id']}: keyMessage needs a triage set with an outcome")
        omg = key_outcome(orig).get('messageGlobals') or {}
        oc['messageGlobals'] = merge_dict(omg, b['messageGlobals'], lambda k: str(omg[k]).startswith('kit_'),
                                          f'{sid} messageGlobals')
    if b.get('messageCaughtVerdicts'):
        oc = key_outcome(out)
        okit = _kit_message_globals(key_outcome(orig))      # the kit owns the verdicts for its own message ids
        oc['messageCaughtVerdicts'] = merge_dict(key_outcome(orig).get('messageCaughtVerdicts') or {},
                                                 b['messageCaughtVerdicts'], lambda k: k in okit,
                                                 f'{sid} messageCaughtVerdicts')
    return out


def patch_kiosk(sc, row):
    """Kiosk 'finished' variants keyed on the kit's quiet state, in a shell with the panel. Used for
    generated shells only; a hand-authored shell edits its kiosk by hand (plan 4.4)."""
    cond = kiosk_condition(row)
    if not cond:
        return sc
    patched = 0
    for o in sc['rooms']['training_room']['objects']:
        if o.get('type') == 'kiosk':
            for v in o.get('observationVariants', []):
                # only the existing "finished" variant, keyed on the defend-complete global;
                # other variants (and kiosks with none) are left untouched
                if '_defend_complete' in str(v.get('condition', '')):
                    v['condition'] = cond
                    patched += 1
    assert patched, 'patch_kiosk: no finished (_defend_complete) kiosk variant to key on the panel'
    return sc


def kit_owned(sc, host_id=None):
    """The kit-owned members of a parsed shell, in the same form as build() (for comparisons)."""
    tr = sc['rooms']['training_room']
    host = _find_host(sc, host_id)
    gv = sc.get('globalVariables', {})
    out = {
        'npcs': [n for n in tr['npcs'] if is_kit_member(n)],
        'objects': [o for o in tr.get('objects', []) if is_kit_member(o)],
        'globals': {k: v for k, v in gv.items() if k.startswith('kit_')},
        'timers': [t for t in sc.get('timers', []) if str(t.get('id', '')).startswith('kit_')],
        'mappings': [m for m in host.get('eventMappings', []) if is_kit_mapping(m)],
        'scenario': {**{k: sc[k] for k in KIT_TOP_KEYS if k in sc},
                     **({'chatter': kit_chatter(sc)} if kit_chatter(sc) else {})},
        'stepAway': has_step_away(sc['social']['awarenessEpisode']),
    }
    mg = _kit_message_globals(key_outcome(sc))
    if mg:
        out['messageGlobals'] = mg
    mcv = _kit_caught_verdicts(key_outcome(sc))
    if mcv:
        out['messageCaughtVerdicts'] = mcv
    for key in KIT_KEYED:
        v = sc.get(key)
        mine = ({k: x for k, x in v.items() if str(k).startswith('kit_')} if isinstance(v, dict)
                else [x for x in v if is_kit_member(x)] if isinstance(v, list) else None)
        if mine:
            out[key] = mine
    return out


def _map_id(m):
    """What a kit mapping is for, not how it is worded or built: its event and its purpose. The purpose is the
    kit_ globals it sets, else the knot it runs, else any other global it sets (the step-away mapping sets the
    row's out global), else nothing. Conditions, delays, bark text, values and the effect kinds can change in
    the kit data and the mapping keeps its identity. Two mappings with the same event and purpose are told
    apart by position among the kit's mappings (merge_plan's nth), never by their content."""
    sg = sorted(m.get('setGlobal') or {})
    kit_keys = tuple(k for k in sg if str(k).startswith('kit_'))
    if kit_keys:
        purpose = ('sets',) + kit_keys
    elif m.get('knot') or m.get('targetKnot'):
        purpose = ('knot', m.get('knot'), m.get('targetKnot'))
    elif sg:
        purpose = ('sets',) + tuple(sg)
    else:
        purpose = ()
    return (m.get('eventPattern'), purpose)


def mapping_keys(mappings):
    """[(_map_id, n)] for a list of kit mappings: identities the merge pairs old and new by."""
    return _keyed(mappings, _map_id)


def hand_written(old, new, maps_lost=None):
    """What a regeneration would erase: kit-owned members of the old shell (`old` is kit_owned()) that the kit
    data (`new` is build()) does not produce. Members are matched by id or name (npcs, objects, timers,
    globals, chatter pools), mappings by _map_id (host and per-NPC). With `maps_lost` (prepare().lost: the
    mappings the key matcher found orphaned) the mappings are judged by key instead. Returns a list of readable strings."""
    lost = []
    new_npcs = {n['id']: n for n in new['npcs']}
    for n in old['npcs']:
        t = new_npcs.get(n['id'])
        if t is None:
            lost.append(f"npc {n['id']}")
            continue
        if maps_lost is None:
            have = set(mapping_keys(t.get('eventMappings', [])))
            lost += [f"npc {n['id']} mapping on {m.get('eventPattern')}"
                     for m, k in zip(n.get('eventMappings', []), mapping_keys(n.get('eventMappings', []))) if k not in have]
    for kind, key in (('object', 'objects'), ('timer', 'timers')):
        ids = {x.get('id') for x in new[key]}
        lost += [f"{kind} {x.get('id')}" for x in old[key] if x.get('id') not in ids]
    lost += [f'global {k}' for k in old['globals'] if k not in new['globals']]
    if maps_lost is None:
        have = set(mapping_keys(new['mappings']))
        lost += [f"host mapping on {m.get('eventPattern')} setting {sorted(m.get('setGlobal') or {})}"
                 for m, k in zip(old['mappings'], mapping_keys(old['mappings'])) if k not in have]
    else:
        lost += maps_lost
    lost += [f'chatter pool {k}' for k in old['scenario'].get('chatter', {}) if k not in new['scenario'].get('chatter', {})]
    lost += [f'messageGlobals {k}' for k in old.get('messageGlobals', {}) if k not in new.get('messageGlobals', {})]
    lost += [f'messageCaughtVerdicts {k}' for k in old.get('messageCaughtVerdicts', {})
             if k not in new.get('messageCaughtVerdicts', {})]
    for key in KIT_KEYED:
        have = set(new.get(key, {}) if isinstance(new.get(key), dict) else [r.get('id') for r in new.get(key, [])])
        mine = old.get(key, {})
        lost += [f'{key} {i}' for i in (list(mine) if isinstance(mine, dict) else [r.get('id') for r in mine]) if i not in have]
    return lost


def _fields(a, b, skip=()):
    return sorted(k for k in set(a) | set(b) if k not in skip and a.get(k) != b.get(k))


def reverts(old, new):
    """Kit-owned records the regeneration keeps (matched by id, mappings by _map_id) but whose fields it
    would change: a hand edit to a condition, delay, position or any other field is reverted without
    the guard refusing. Covers kit NPC fields and mappings, kit objects and timers (every field), kit
    global values, host mappings, the kit's chatter pool lines (per NPC id) and the kit_ entries of
    outcome.messageGlobals. Not covered: the host's other fields and any record that is not kit-owned.
    A kit-data edit shows up here too, so the caller warns and does not refuse (hand_written lists what
    would be erased outright). Returns readable strings."""
    out = []
    new_npcs = {n['id']: n for n in new['npcs']}
    for n in old['npcs']:
        t = new_npcs.get(n['id'])
        if t is None:
            continue
        out += [f"npc {n['id']} field {f}" for f in _fields(n, t, skip=('eventMappings',))]
        out += _mapping_changes(f"npc {n['id']}", n.get('eventMappings', []), t.get('eventMappings', []))
    for kind, key in (('object', 'objects'), ('timer', 'timers')):
        by_id = {x.get('id'): x for x in new[key]}
        for x in old[key]:
            t = by_id.get(x.get('id'))
            if t is not None:
                out += [f"{kind} {x.get('id')} field {f}" for f in _fields(x, t)]
    out += [f'global {k} value {old["globals"][k]!r} -> {new["globals"][k]!r}'
            for k in old['globals'] if k in new['globals'] and old['globals'][k] != new['globals'][k]]
    out += _mapping_changes('host', old['mappings'], new['mappings'])
    oc, nc = old['scenario'].get('chatter', {}), new['scenario'].get('chatter', {})
    out += [f'chatter pool {k} changed' for k in oc if k in nc and oc[k] != nc[k]]
    om, nm = old.get('messageGlobals', {}), new.get('messageGlobals', {})
    out += [f'messageGlobals {k} value {om[k]!r} -> {nm[k]!r}' for k in om if k in nm and om[k] != nm[k]]
    ov, nv = old.get('messageCaughtVerdicts', {}), new.get('messageCaughtVerdicts', {})
    out += [f'messageCaughtVerdicts {k} value {ov[k]!r} -> {nv[k]!r}' for k in ov if k in nv and ov[k] != nv[k]]
    return out


def _mapping_changes(who, old_ms, new_ms):
    out = []
    by_key = dict(zip(mapping_keys(new_ms), new_ms))
    for m, k in zip(old_ms, mapping_keys(old_ms)):
        t = by_key.get(k)
        if t is not None:
            out += [f"{who} mapping on {m.get('eventPattern')} (sets {sorted(m.get('setGlobal') or {})}) field {f}"
                    for f in _fields(m, t)]
    return out


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
    prefix, state_global = shell_ids(sc, row)
    print(json.dumps(build(load_kit(row['company']), row, prefix, state_global), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
