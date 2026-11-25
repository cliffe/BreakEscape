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
        out.append(m)
    cue = {'eventPattern': 'game_loaded', 'condition': f'{live} && globalVars.{asked_key} === true',
           'onceOnly': True, 'delayMs': ask['delayMs'], 'askCue': True, 'whenPerceivable': True,
           'askCueUntil': choice_key, 'askCueMs': ask['askCueMs'], 'askCueQuiet': True}
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
        maps = rec.get('eventMappings', [])
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


def room_npcs(kit, row, prefix=None):
    """The two ambient staff as room NPC records, then the set piece's own `npcs`. Empty for tier none."""
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
        out.append(npc)
    # a set piece's own `npcs` (ca12's visitor): kit-owned records, after the ambient pair, written as the
    # set piece has them (placeholders filled in; no currentKnot/storyPath defaults, the record carries them)
    out.extend(_subst(copy.deepcopy(_set_piece(kit, row).get('npcs', [])), prefix, row))
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


def host_mappings(kit, row, prefix, state_global):
    """Host eventMappings, to be appended after the host's existing ones (plan 6.1)."""
    if not active(row) or is_convention(row):
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


def build(kit, row, prefix, state_global):
    """Everything the kit owns for one shell, in one dict (the form the tests compare)."""
    kit = apply_override(kit, row)
    check_pool(kit)
    out = {
        'npcs': room_npcs(kit, row, prefix),
        'objects': room_objects(kit, row, prefix),
        'globals': kit_globals(kit, row, prefix),
        'timers': kit_timers(kit, row, prefix),
        'mappings': host_mappings(kit, row, prefix, state_global),
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


def is_kit_mapping(m):
    """A host mapping is kit-owned when its setGlobal key, knot (knot or targetKnot) or condition names a kit_ global."""
    sg = m.get('setGlobal')
    if isinstance(sg, dict) and any(str(k).startswith('kit_') for k in sg):
        return True
    return bool(KIT_NAME.search(str(m.get('condition', '')))) or bool(KIT_NAME.search(str(m.get('knot', ''))) or KIT_NAME.search(str(m.get('targetKnot', ''))))


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


def merge_list(old, new, owned, ident):
    """Merge a kit's `new` records into the shell's `old` list without moving anything: a record `owned`
    by the kit stays where it is (replaced by the kit's current copy with the same `ident`; dropped when
    the kit no longer produces it), a hand-written record stays where it is, and kit records the shell
    has not got yet go last. The server keys eventMappings by index, so existing ones must never move."""
    pending = {}
    for n in new:
        pending.setdefault(ident(n), []).append(n)
    used = set()
    out = []
    for o in old:
        if not owned(o):
            out.append(o)
            continue
        q = pending.get(ident(o))
        if q:
            n = q.pop(0)
            used.add(id(n))
            out.append(n)
    return out + [n for n in new if id(n) not in used]


def merge_dict(old, new, owned_key):
    """merge_list for a dict: kit-owned keys keep their position (new value), others stay, new keys go last."""
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
    return _map_id(m)


def member_ident(m):
    return m.get('id')


def apply_kit(sc, kit, row, host_id=None):
    """The shell with the kit's content applied (a new dict). Tier none returns an unchanged copy.
    Old kit-owned members are removed first, so applying twice gives the same result."""
    if not active(row):
        return copy.deepcopy(sc)
    orig = copy.deepcopy(sc)
    out = strip_kit(sc, host_id)
    prefix, state_global = shell_ids(out, row)
    b = build(kit, row, prefix, state_global)
    tr = out['rooms']['training_room']
    otr = orig['rooms']['training_room']
    tr['npcs'] = merge_list(otr['npcs'], b['npcs'], is_kit_member, member_ident)
    tr['objects'] = merge_list(otr.get('objects', []), b['objects'], is_kit_member, member_ident)
    host = _find_host(out, host_id)
    ohost = _find_host(orig, host_id)
    if b['mappings'] or 'eventMappings' in host:       # a convention row has none: add no empty list
        host['eventMappings'] = merge_list(ohost.get('eventMappings', []), b['mappings'], is_kit_mapping, map_ident)
    out['globalVariables'] = merge_dict(orig.get('globalVariables', {}), b['globals'], lambda k: k.startswith('kit_'))
    top = [(k, v) for k, v in b['scenario'].items() if k == 'npcThoughts']
    out = _insert_after(out, 'disableAttacks', top)
    after = []
    for k, v in b['scenario'].items():
        if k == 'npcThoughts':
            continue
        if k == 'chatter' and isinstance(out.get('chatter'), dict):
            # the shell's own pools stay; the kit's kit_ ones keep their place, new ones go last
            out['chatter'] = merge_dict(orig.get('chatter') or {}, v, lambda k: str(k).startswith('kit_'))
        else:
            after.append((k, v))
    after.extend(shell_flags(row).items())
    if b['timers']:
        if 'timers' in out:
            out['timers'] = merge_list(orig.get('timers', []), b['timers'],
                                       lambda t: str(t.get('id', '')).startswith('kit_'), member_ident)
        else:
            after.append(('timers', b['timers']))
    for key in KIT_KEYED:
        if key in b:
            cur = out.get(key)
            if isinstance(cur, dict):
                out[key] = merge_dict(orig.get(key) or {}, b[key], lambda k: str(k).startswith('kit_'))
            elif isinstance(cur, list):
                out[key] = merge_list(orig.get(key) or [], b[key], is_kit_member, member_ident)
            else:
                after.append((key, b[key]))
    out = _insert_after(out, 'globalVariables', after)
    if b['stepAway'] and 'stepAways' not in out['social']['awarenessEpisode']:
        out['social']['awarenessEpisode']['stepAway'] = True
    if b.get('messageGlobals'):
        oc = key_outcome(out)
        if oc is None:
            raise ValueError(f"{row['id']}: keyMessage needs a triage set with an outcome")
        oc['messageGlobals'] = merge_dict(key_outcome(orig).get('messageGlobals') or {}, b['messageGlobals'],
                                          lambda k: str(key_outcome(orig)['messageGlobals'][k]).startswith('kit_'))
    if b.get('messageCaughtVerdicts'):
        oc = key_outcome(out)
        oc['messageCaughtVerdicts'] = {**oc.get('messageCaughtVerdicts', {}), **b['messageCaughtVerdicts']}
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
    """What a mapping is, apart from its wording: the event, the globals it sets and the kinds of effect it has.
    Conditions, delays, bark text and values can change in the kit data and be regenerated; a mapping whose
    identity the kit data does not produce was written by hand."""
    return (m.get('eventPattern'), tuple(sorted((m.get('setGlobal') or {}))),
            tuple(k for k in ('needs', 'patrolOverride', 'bark', 'knot', 'targetKnot') if k in m))


def hand_written(old, new):
    """What a regeneration would erase: kit-owned members of the old shell (`old` is kit_owned()) that the kit
    data (`new` is build()) does not produce. Members are matched by id or name (npcs, objects, timers,
    globals, chatter pools), mappings by _map_id (host and per-NPC). Returns a list of readable strings."""
    lost = []
    new_npcs = {n['id']: n for n in new['npcs']}
    for n in old['npcs']:
        t = new_npcs.get(n['id'])
        if t is None:
            lost.append(f"npc {n['id']}")
            continue
        have = {_map_id(m) for m in t.get('eventMappings', [])}
        lost += [f"npc {n['id']} mapping on {m.get('eventPattern')}" for m in n.get('eventMappings', []) if _map_id(m) not in have]
    for kind, key in (('object', 'objects'), ('timer', 'timers')):
        ids = {x.get('id') for x in new[key]}
        lost += [f"{kind} {x.get('id')}" for x in old[key] if x.get('id') not in ids]
    lost += [f'global {k}' for k in old['globals'] if k not in new['globals']]
    have = {_map_id(m) for m in new['mappings']}
    lost += [f"host mapping on {m.get('eventPattern')} setting {sorted(m.get('setGlobal') or {})}"
             for m in old['mappings'] if _map_id(m) not in have]
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
    groups = {}
    for m in new_ms:
        groups.setdefault(_map_id(m), []).append(m)
    seen = {}
    for m in old_ms:
        i = _map_id(m)
        k = seen.get(i, 0)
        seen[i] = k + 1
        cands = groups.get(i, [])
        if k < len(cands):
            out += [f"{who} mapping on {m.get('eventPattern')} (sets {sorted(m.get('setGlobal') or {})}) field {f}"
                    for f in _fields(m, cands[k])]
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
