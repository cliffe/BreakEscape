#!/usr/bin/env python3
"""P7-Y1: build the E3 (helpdesk) and E5 (general staff) defend-only shells and their
pre and post check missions (AB and BA), from P7-S's and P7-V's defend fragments.

Adapted from gen_e1_shells.py (P7-J). Two differences from that script, both matching the
committed E1 shells rather than the script that made them:
  - the post check does not redeclare the names it imports (the validator rejects the collision);
  - the host's one-line ink is written here too, so a re-run rebuilds the whole folder.

Usage: gen_e3_e5_shells.py [out_dir]   (default: the repo's scenarios/)
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from title_art import with_title_art  # noqa: E402
import training_room  # noqa: E402
import awareness_deploy  # noqa: E402

REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'
AW = f'{REPO}/planning_notes/phishing_and_social_engineering/awareness'

PLAYER = {
    'id': 'player',
    'displayName': 'Learner',
    'spriteSheet': 'female_office_worker_v2',
    'spriteTalk': 'assets/characters/female_office_worker_talk.png',
    'spriteConfig': {'idleFrameRate': 6, 'walkFrameRate': 12},
}

# Hosts: Quayholt Insurance people from BRAND_SET.md section 3 and its E5 additions. Sprite keys
# are existing placeholders (no image generation) until P7-Z3.
HOSTS = {
    'darren': {
        'id': 'darren_price', 'displayName': 'Darren Price', 'sprite': 'male_telecom',
        'about': "Quayholt's service desk team lead and owner of the verification script, 40s, white, from Bristol (BRAND_SET.md). Steady, a bit dry. Placeholder sprite until P7-Z3.",
    },
    'niamh': {
        'id': 'niamh_doherty', 'displayName': 'Niamh Doherty', 'sprite': 'female_telecom',
        'about': "Quayholt's internal communications officer, mid 20s, Northern Irish (BRAND_SET.md, E5 additions). Quick and friendly. Placeholder sprite until P7-Z3.",
    },
    'anjali': {
        'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist',
        'about': "Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Runs the before-and-after checks. Placeholder sprite until P7-Z3.",
    },
    'sofia': {
        'id': 'sofia_marchetti', 'displayName': 'Sofia Marchetti', 'sprite': 'female_blowse',
        'about': "Quayholt's HR adviser, 30s, Italian-British, second generation (BRAND_SET.md, E5 additions). Runs the before-and-after checks for HR. Placeholder sprite until P7-Z3.",
    },
    'owen': {
        'id': 'owen_treharne', 'displayName': 'Owen Treharne', 'sprite': 'male_office_worker',
        'about': "Quayholt's facilities manager, 50s, Welsh, from the Rhondda (BRAND_SET.md, E5 additions). Hosting the check for his floor. Placeholder sprite until P7-Z3.",
    },
    'pauline': {
        'id': 'pauline_hendry', 'displayName': 'Pauline Hendry', 'sprite': 'female_blowse',
        'about': "Quayholt's payroll officer, 60s, Jamaican-British, thirty years at Quayholt (BRAND_SET.md, E5 additions). Hosting the check for her floor. Placeholder sprite until P7-Z3.",
    },
}

# Defend-host lines: (before, after, choice, reply). One welcome line; the kiosk does the rest.
LINES = {
    ('e3', 'defend'): (
        "You're in Leila's seat this morning. Three calls are queued on the kiosk, and there's a sign-in prompt from overnight on her phone. Take your time with each one.",
        "That's the queue cleared, thanks. If a caller won't let you ring them back, that tells you most of what you need.",
        'Thanks, Darren.', 'Shout if you need me.'),
    ('e5', 'defend'): (
        "Hiya. There are five pages open on the kiosk, each one from a link somebody got this morning. Have a look at each before you'd sign in.",
        "That's all five checked. The address bar is the bit to read, every time.",
        'Thanks, Niamh.', 'No bother.'),
}

# Check-host lines, varied per host (C2-m18: the post hosts no longer share one script).
# Keyed by host id, then stage. (before, after, choice, reply).
CHECK_LINES = {
    'anjali_rao': {
        'pre': (
            "I'm Anjali, I look after security here. There's a short check on the kiosk first: ten items from the service desk queue. Do what you'd normally do on a shift.",
            "That's your first check saved. We'll do another after the training and see how the two compare.",
            'Thanks, Anjali.', 'Any time.'),
        'post': (
            "Welcome back. Ten fresh items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
            "Check saved. Thanks for doing it.",
            'Thanks, Anjali.', 'Any time.'),
    },
    'sofia_marchetti': {
        'pre': (
            "Hiya, I'm Sofia from HR. There's a short check on the kiosk first: ten items from the service desk queue. Just handle them the way you usually would.",
            "First check saved. There's a matching one after the training, and you'll see how they compare.",
            'Thanks, Sofia.', 'No trouble.'),
        'post': (
            "Good to see you back. Ten new items on the kiosk, same as before. If you did the first check, the end screen compares the two.",
            "That's saved. Thanks for sitting it.",
            'Thanks, Sofia.', 'No trouble.'),
    },
    'owen_treharne': {
        'pre': (
            "Owen here, Facilities. Short one on the kiosk before the training: ten emails and pages from a Quayholt inbox. Just do what you'd normally do.",
            "First check's saved. You'll do another afterwards and see how the two line up.",
            'Thanks, Owen.', 'No bother at all.'),
        'post': (
            "Back again, good. Ten new emails and pages on the kiosk, same idea as last time. If you did the first, the end screen shows how they compare.",
            "Check saved. Thanks for doing it.",
            'Thanks, Owen.', 'No bother at all.'),
    },
    'pauline_hendry': {
        'pre': (
            "I'm Pauline from Payroll, looking after this check. There's a short one on the kiosk first: ten emails and pages from a Quayholt inbox. Just do what you'd normally do.",
            "First check saved. There's another after the training, and you'll see how they compare.",
            'Thanks, Pauline.', "You're welcome."),
        'post': (
            "Welcome back. Ten new emails and pages waiting on the kiosk, same idea as before. If you did the first check, the end screen compares them.",
            "Check saved. Thank you for doing it.",
            'Thanks, Pauline.', "You're welcome."),
    },
}

EPISODES = {
    'e3': {
        'frag': f'{AW}/e3/defend.json',
        'full_id': 'e3_helpdesk_reset',
        'role_word': 'helpdesk',
        'role_label': 'IT service desk staff',
        'defend_set': 'e3_service_desk_queue',
        'forms': ('helpdesk_form_a', 'helpdesk_form_b'),
        'defend_host': 'darren',
        'check_hosts': {'ab': 'anjali', 'ba': 'sofia'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Social engineering', 'Vishing', 'MFA fatigue', 'Security awareness']}],
        'defend': {
            'name': 'Helpdesk reset: the service desk queue',
            'brief': "Awareness episode E3, service desk only. You're in Leila Nassar's seat on the IT service desk at Quayholt Insurance, a fictional insurer. Three calls are waiting and a sign-in prompt from overnight is still on your phone: help the real callers, and ring back or escalate anything that doesn't sit right.",
            'endGoal': 'Take the three calls and the sign-in prompt at the training kiosk.',
            'aim': ('service_desk_aim', 'Cover the service desk', 'Work through the service desk queue at the training kiosk.'),
            'task': ('work_service_desk_queue', 'Work through the service desk queue'),
            'kiosk': ("A touch-screen kiosk showing the Quayholt service desk queue. Three calls are waiting, and a phone beside it shows a sign-in prompt.",
             'A touch-screen kiosk showing the Quayholt service desk queue. Episode finished.'),
            'display': 'Awareness E3: Helpdesk reset (service desk only)',
            'desc': "An awareness episode of about 8 minutes for IT service desk staff, on the defending side only. Sit in the service desk seat at Quayholt Insurance, a fictional company: three callers want password resets or changes to their sign-in, and a sign-in prompt turns up on your own phone. Each answer is explained, and ringing back when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'ending': ('Service desk queue done', "That's the three calls and the sign-in prompt finished. The debrief goes through each one."),
        },
        'check': {
            'items_pre': 'Ten items from the IT service desk queue: calls, a voicemail, emails and a sign-in prompt.',
            'items_post': 'Ten new items from the IT service desk queue, the same kinds as before.',
            'scope': 'Authorised exercise at Quayholt Insurance, a fictional company. In scope: ten items from the Quayholt IT service desk queue.',
            'kiosk': 'A touch-screen kiosk with ten items from the service desk queue, ready for the {nth} check.',
            'aim_desc': 'Work through ten items at the training kiosk.',
            'end': 'Work through the ten items at the training kiosk.',
            'name': 'Service desk check',
            'minutes': 9,
        },
    },
    'e5': {
        'frag': f'{AW}/e5/defend.json',
        'full_id': 'e5_signin_pages',
        'role_word': 'general',
        'role_label': 'all staff',
        'defend_set': 'e5_links_inbox',
        'forms': ('general_form_a', 'general_form_b'),
        'defend_host': 'niamh',
        'check_hosts': {'ab': 'owen', 'ba': 'pauline'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Phishing', 'Credential harvesting', 'Security awareness', 'Usable security']}],
        'defend': {
            'name': 'Sign-in pages: check before you type',
            'brief': "Awareness episode E5, pages only. Five web pages are open, each one reached from a link in an inbox at Quayholt Insurance, a fictional insurer. Some are real and some were built to collect your password: decide whether you'd sign in, and report anything that doesn't sit right.",
            'endGoal': 'Check the five pages at the training kiosk.',
            'aim': ('signin_pages_aim', 'Check the sign-in pages', 'Check the five pages at the training kiosk.'),
            'task': ('check_signin_pages', 'Check the sign-in pages'),
            'kiosk': ('A touch-screen kiosk with five web pages open, each reached from a link in a Quayholt inbox.',
             'A touch-screen kiosk with five web pages open, each reached from a link in a Quayholt inbox. You have checked them all.'),
            'display': 'Awareness E5: Sign-in pages (pages only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Five web pages from links in an inbox at Quayholt Insurance, a fictional company: some are the real sign-in, some were built to collect passwords. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'ending': ('Sign-in pages checked', "That's all five pages finished. The debrief goes through each one."),
        },
        'check': {
            'items_pre': 'Ten items from a Quayholt inbox, emails and pages opened from links.',
            'items_post': 'Ten new items from a Quayholt inbox, the same kinds as before.',
            'scope': 'Authorised exercise at Quayholt Insurance, a fictional company. In scope: ten items from a Quayholt inbox, emails and pages opened from links.',
            'kiosk': 'A touch-screen kiosk with ten emails and pages from a Quayholt inbox, ready for the {nth} check.',
            'aim_desc': 'Sort ten items at the training kiosk.',
            'end': 'Sort the ten items at the training kiosk.',
            'name': 'Inbox and sign-in check',
            'minutes': 9,
        },
    },
}


def strip_private(obj):
    """Drop authoring notes (keys starting with '_') at every level."""
    if isinstance(obj, dict):
        return {k: strip_private(v) for k, v in obj.items() if not k.startswith('_')}
    if isinstance(obj, list):
        return [strip_private(v) for v in obj]
    return obj


def load(ekey):
    frag = json.load(open(EPISODES[ekey]['frag']))
    return {s['id']: s for s in frag['triageSets']}, frag['awarenessEpisode']


# B1 / N7 (CHECK_PARITY_AUDIT, playtest P2): explicit, stable reorder of each form's canonical
# `messages` (new[i] = old[order[i]]), so forms A and B no longer share one per-slot pattern. The
# permutations put the phish in DISJOINT ordinal slots across A and B: no slot is a phish in both forms
# of a pair (the earlier reorder left slot 3 a phish in both the helpdesk pre and post — playtest N7).
# Scoring is per item, so a pure reorder changes no counts, no flag multiset.
PERMUTE = {
    'helpdesk_form_a': [4, 0, 5, 6, 7, 3, 2, 8, 1, 9],
    'helpdesk_form_b': [8, 3, 6, 5, 7, 2, 1, 9, 0, 4],
    'general_form_a': [5, 0, 1, 3, 6, 2, 8, 4, 7, 9],
    'general_form_b': [4, 7, 3, 9, 1, 8, 5, 6, 0, 2],
}


def clean_set(sets, set_id, stage=None, comparison=None):
    s = strip_private(copy.deepcopy(sets[set_id]))
    s.pop('pairedWith', None)
    if set_id in PERMUTE and isinstance(s.get('messages'), list):
        s['messages'] = [s['messages'][i] for i in PERMUTE[set_id]]
    if stage:
        s['stage'] = stage
    if comparison:
        s['comparison'] = comparison
    return s


def host_npc(host, done_global, task_id, ink_path):
    key = host['sprite']
    return {
        'id': host['id'],
        'displayName': host['displayName'],
        'npcType': 'person',
        'position': copy.deepcopy(training_room.HOST_POSITION),
        'spriteSheet': f'{key}_v2',
        'spriteTalk': f'assets/characters/{key}_talk.png',
        'spriteVisemes': f'assets/characters/{key}_visemes.png',
        'storyPath': ink_path,
        'currentKnot': 'start',
        'eventMappings': [{
            'eventPattern': f'global_variable_changed:{done_global}',
            'condition': 'value === true',
            'onceOnly': True,
            'completeTask': task_id,
        }],
    }


def kiosk(ep_id, observations):
    """observations: a string, or (before, after) where `after` shows once the round is done
    (observationVariants on episode_<id>_defend_done, so the kiosk stops saying items are waiting)."""
    done_obs = None
    if isinstance(observations, tuple):
        observations, done_obs = observations
    obj = {
        'type': 'kiosk',
        'id': 'training_kiosk',
        'name': 'Training kiosk',
        'takeable': False,
        'interactable': True,
        'active': True,
        'locked': False,
        'observations': observations,
    }
    if done_obs:
        obj['observationVariants'] = [
            {'condition': f'globalVars.episode_{ep_id}_defend_done', 'value': done_obs}]
    obj['minigameData'] = {'episodeId': ep_id}
    return obj


def success_screen(title, body):
    """The ending for a short training episode (README_scenario_design.md, "The ending convention")."""
    return {'type': 'success', 'title': title, 'body': body}


def scenario(mission, name, brief, end_goal, aim, task, done, globals_, social, host, ink_name,
             kiosk_obs, ending, extra=None):
    ink_path = f'scenarios/{mission}/ink/{ink_name}.json'
    ep_id = social['awarenessEpisode']['id']
    sc = {
        'scenario_id': mission,
        'scenario_name': name,
        'scenario_brief': brief,
        'endGoal': end_goal,
        'version': '1.0',
        'disableAttacks': True,
        'startRoom': 'training_room',
        'startPosition': copy.deepcopy(training_room.START_POSITION),
        'player': PLAYER,
        'objectives': [{
            'aimId': aim[0],
            'title': aim[1],
            'description': aim[2],
            'status': 'active',
            'order': 0,
            'missionConclusion': True,
            'concludeRequires': {'globals': [done]},
            'conclusionScreen': ending,
            'tasks': [{'taskId': task[0], 'title': task[1], 'type': 'custom', 'status': 'active'}],
        }],
        'globalVariables': globals_,
    }
    if extra:
        sc.update(extra)
    sc['social'] = social
    # aw4: the deployment-wide rule of thumb, identical in every awareness shell.
    sc['social']['awareness'] = awareness_deploy.awareness_block()
    company = social['awarenessEpisode']['company']
    sc['lighting'] = training_room.scenario_lighting(company)
    rf = training_room.room_fields(company)
    tr = {'type': rf['type'], 'door_sign': 'Training Room'}
    if 'chatBackground' in rf:
        tr['chatBackground'] = rf['chatBackground']
    tr['lighting'] = rf['lighting']
    tr['connections'] = {}
    tr['npcs'] = [host_npc(host, done, task[0], ink_path)]
    tr['objects'] = [kiosk(ep_id, kiosk_obs)]
    sc['rooms'] = {'training_room': tr}
    return sc


def ink_source(header, host, done, lines):
    before, after, choice, reply = lines
    n = host['displayName']
    return f"""// ================================================
// {header}: {n} (person, Training Room)
// {host['about']}
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when {done} changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
// ================================================

VAR {done} = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{{ hub_quiet:
    ~ hub_quiet = false
- else:
    {{ {done}:
        {n}: {after}
    - else:
        {n}: {before}
    }}
}}
+ [{choice}]
    {n}: {reply}
    ~ hub_quiet = true
    #exit_conversation
    -> hub
"""


def defend_only(ekey):
    cfg = EPISODES[ekey]
    d = cfg['defend']
    sets, EP = load(ekey)
    ep_id = f"{cfg['full_id']}_defend"
    mission = f'awareness_{ep_id}'
    prefix = f'episode_{ep_id}_defend_'          # doubled `_defend_defend_`, as defendPrefix() gives
    done = f'{prefix}done'
    s = clean_set(sets, cfg['defend_set'])
    s['outcome']['setGlobalPrefix'] = prefix
    strings = copy.deepcopy(EP['strings'])
    strings['brief'] = EP['_defendOnly']['brief']
    # m27: the defend-only runner never shows the flip, so drop the flip-only strings
    # (a later author could otherwise wire dead copy back in). Keep noBlameLine, mondayCard,
    # defendOnly, brief and defendIntro.
    for _k in ('flipHeading', 'flipIntro', 'flipDefenderLine', 'flipNoSend',
               'flipMissed', 'flipPageIntro', 'flipCallIntro'):
        strings.pop(_k, None)
    defend = strip_private(copy.deepcopy(EP['defend']))   # keeps E3's calls and callsFrom
    defend['stage'] = None
    ep = {
        'id': ep_id,
        'role': EP['role'], 'company': EP['company'], 'brand': copy.deepcopy(EP['brand']),
        'variant': 'defendOnly',
        'durationTargetMin': d['minutes'],
        'scopeNote': EP['_defendOnly']['scopeNote'],
        'stages': ['brief', 'defend', 'debrief'],
        'conclusionTaskId': d['task'][0],
        'defend': {'setId': defend.pop('setId'), 'stage': defend.pop('stage'),
                   'reportAlwaysVisible': defend.pop('reportAlwaysVisible', True), **defend},
        'strings': strings,
        'debrief': copy.deepcopy(EP['debrief']),
    }
    globals_ = {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
        f'{prefix}pass': False,
    }
    host = HOSTS[cfg['defend_host']]
    ink_name = host['id']
    sc = scenario(mission, d['name'], d['brief'], d['endGoal'], d['aim'], d['task'], done, globals_,
                  {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, d['kiosk'],
                  success_screen(*d['ending']))
    meta = {
        'display_name': d['display'],
        'description': d['desc'],
        'difficulty_level': 1,
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': d['minutes'],
        'cybok': cfg['cybok'],
    }
    header = f"Awareness {ekey.upper()}, defend only"
    ink = ink_source(header, host, done, LINES[(ekey, 'defend')])
    return mission, sc, meta, ink_name, ink


def check(ekey, pair, stage):
    cfg = EPISODES[ekey]
    c = cfg['check']
    sets, EP = load(ekey)
    word = cfg['role_word']
    mission = f'awareness_{stage}_{word}_{pair}'
    ep_id = f'{stage}_{word}_{pair}'
    fa, fb = cfg['forms']
    form = {('ab', 'pre'): fa, ('ab', 'post'): fb, ('ba', 'pre'): fb, ('ba', 'post'): fa}[(pair, stage)]
    comparison = {'requireGlobal': 'pre_check_completed'} if stage == 'post' else None
    s = clean_set(sets, form, stage=stage, comparison=comparison)
    prefix = f'triage_{stage}_'
    done = f'{prefix}done'
    ep = {
        'id': ep_id,
        'role': EP['role'], 'company': EP['company'], 'brand': copy.deepcopy(EP['brand']),
        'variant': 'full',
        'durationTargetMin': c['minutes'],
        'scopeNote': c['scope'],
        'stages': ['check'],
        'conclusionTaskId': 'finish_check',
        'defend': {'setId': form, 'stage': stage, 'reportAlwaysVisible': True},
    }
    globals_ = {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
        f'{prefix}pass': False,
    }
    extra = {}
    pre_mission = f'awareness_pre_{word}_{pair}'
    if stage == 'pre':
        extra['exportGlobals'] = ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_done']
    else:
        # Imported names are not redeclared (as the committed E1 post shells).
        extra['importGlobals'] = [
            {'from': pre_mission, 'var': 'triage_pre_percent', 'as': 'triage_pre_percent', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_reportRate', 'as': 'triage_pre_reportRate', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_done', 'as': 'triage_pre_done', 'default': False},
            {'from': pre_mission, 'completed': 'pre_check_completed'},
        ]
    host = HOSTS[cfg['check_hosts'][pair]]
    letters = pair.upper()
    first, second = letters[0], letters[1]
    company = 'Quayholt Insurance, a fictional company'
    if stage == 'pre':
        name = f"{c['name']}: before ({letters})"
        brief = (f"The first of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_pre']} Decide what to do with each one. Your result is saved so the second check can compare with it.")
        aim = ('first_check_aim', 'Do the first check', c['aim_desc'])
        task = ('finish_check', 'Finish the first check')
        display = f'Awareness check: {word}, before ({letters})'
        desc = (f"A short check for {cfg['role_label']} at {company}, taken before the awareness episodes (pair {letters}). "
                f"{c['items_pre']} The result is kept so the matching after-check (awareness_post_{word}_{pair}) "
                "can show how the two compare.")
        obs = c['kiosk'].format(nth='first')
        ending = success_screen('First check done', 'Your result is saved, ready for the second check to compare with.')
    else:
        name = f"{c['name']}: after ({letters})"
        brief = (f"The second of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_post']} If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', c['aim_desc'])
        task = ('finish_check', 'Finish the second check')
        display = f'Awareness check: {word}, after ({letters})'
        desc = (f"A short check for {cfg['role_label']} at {company}, taken after the awareness episodes (pair {letters}). "
                f"{c['items_post']} It is matched to the first check (awareness_pre_{word}_{pair}), and the end screen "
                "compares the two results when the first check was finished.")
        obs = c['kiosk'].format(nth='second')
        ending = success_screen('Second check done', 'Thanks for taking the time with it. If you also sat the earlier check, the results are shown side by side.')
    desc += (" Organiser note: each role's check tests the channel that role meets in its "
             "episode, and in a session that runs more than one episode only the learner's "
             "primary-role check is recorded.")
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, c['end'], aim, task, done, globals_,
                  {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, ending, extra)
    meta = {
        'display_name': display,
        'description': desc,
        'difficulty_level': 1,
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': c['minutes'],
        'cybok': cfg['cybok'],
    }
    when = 'before' if stage == 'pre' else 'after'
    header = f"Awareness check, {word}, {when} ({letters})"
    ink = ink_source(header, host, done, CHECK_LINES[host['id']][stage])
    return mission, sc, meta, ink_name, ink


# Top-level titleScreenName (engine batch 14), placed right after scenario_name. Values match the committed
# shells (owner decision 2026-10-30): checks say Starting check / Final check, defend shells use the episode name.
TITLE_NAMES = {'awareness_e3_helpdesk_reset_defend': 'Help desk password resets', 'awareness_e5_signin_pages_defend': 'Fake sign-in pages'}


def with_title_screen_name(sc, mission):
    if '_pre_' in mission:
        title = 'Starting check'
    elif '_post_' in mission:
        title = 'Final check'
    else:
        title = TITLE_NAMES.get(mission)
    if title is None:
        return sc
    return {k2: v2 for k, v in sc.items() for k2, v2 in
            (((k, v), ('titleScreenName', title)) if k == 'scenario_name' else ((k, v),))}


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else REPO + '/scenarios'
    built = []
    for ekey in ('e3', 'e5'):
        built.append(defend_only(ekey))
        built += [check(ekey, p, st) for p in ('ab', 'ba') for st in ('pre', 'post')]
    for mission, sc, meta, ink_name, ink in built:
        sc = with_title_screen_name(sc, mission)
        d = os.path.join(out, mission)
        os.makedirs(os.path.join(d, 'ink'), exist_ok=True)
        with open(os.path.join(d, 'scenario.json.erb'), 'w') as f:
            json.dump(sc, f, indent=2, ensure_ascii=False)
            f.write('\n')
        meta = with_title_art(meta, mission)
        with open(os.path.join(d, 'mission.json'), 'w') as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
            f.write('\n')
        with open(os.path.join(d, 'ink', f'{ink_name}.ink'), 'w') as f:
            f.write(ink)
        print('wrote', d)


if __name__ == '__main__':
    main()
