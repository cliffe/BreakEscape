#!/usr/bin/env python3
"""Wave 4: build the E6 (mobile) defend-only shell and its four mobile check missions (pre and
post, AB and BA), and the E7 (voice) defend-only shell, from awareness/e6/defend.json and
awareness/e7/defend.json.

Adapted from gen_e3_e5_shells.py; its helpers are copied in, not imported, so the two can change
separately. Differences from that script, all
matching the rules the shells have to meet now:
  - every aim with missionConclusion carries a `success` conclusionScreen (the training ending);
  - `se_awareness_records` is declared as [] (the store writes an array);
  - the defend-only shells set strings.defendIntro, because the runner's default line talks
    about an inbox, which is wrong for a work phone or a voicemail line;
  - E7 sets strings.voicePanel (the debrief panel on how a voice gets copied; the defendOnly
    line and the Monday card already say a voice is not proof and to ring back).

E7 has no check missions: its role is everyone, and it reuses the general-staff forms
(awareness_{pre,post}_general_{ab,ba}), which already have shells.

Usage: gen_e6_e7_shells.py [out_dir]   (default: the repo's scenarios/)
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
GEN = 'planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py'

PLAYER = {
    'id': 'player',
    'displayName': 'Learner',
    'spriteSheet': 'female_office_worker_v2',
    'spriteTalk': 'assets/characters/female_office_worker_talk.png',
    'spriteConfig': {'idleFrameRate': 6, 'walkFrameRate': 12},
}


# ---- helpers, as in gen_e3_e5_shells.py (copied, not imported, so a change there can't break this) ----

def strip_private(obj):
    """Drop authoring notes (keys starting with '_') at every level."""
    if isinstance(obj, dict):
        return {k: strip_private(v) for k, v in obj.items() if not k.startswith('_')}
    if isinstance(obj, list):
        return [strip_private(v) for v in obj]
    return obj


# B1 / N7 (CHECK_PARITY_AUDIT, playtest P2): explicit, stable reorder of each form's canonical
# `messages` (new[i] = old[order[i]]), so forms A and B no longer share one per-slot pattern. The
# permutations put the phish in DISJOINT ordinal slots across A and B: no slot is a phish in both forms
# of a pair (the earlier reorder left one shared phish slot per role — playtest N7). Scoring is per
# item, so a pure reorder changes no counts, no flag multiset.
PERMUTE = {
    'mobile_form_a': [1, 2, 8, 6, 7, 5, 4, 9, 3, 0],
    'mobile_form_b': [4, 3, 6, 7, 8, 9, 1, 2, 0, 5],
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
    (observationVariants on episode_<id>_defend_complete, so the kiosk stops saying items are waiting)."""
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
            {'condition': f'globalVars.episode_{ep_id}_defend_complete', 'value': done_obs}]
    obj['minigameData'] = {'episodeId': ep_id}
    return obj


def scenario(mission, name, brief, end_goal, aim, task, done, globals_, social, host, ink_name,
             kiosk_obs, ending, extra=None):
    """ending: (title, body) of the training success screen (README "The ending convention")."""
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
            'conclusionScreen': {'type': 'success', 'title': ending[0], 'body': ending[1]},
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
// Written by {GEN}.
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


# Hosts: people from BRAND_SET.md (Tarrowby's E6 additions, Brightwell's E1 cast). Sprite keys are
# existing placeholders (no image generation) until P7-Z3.
HOSTS = {
    'chidi': {
        'id': 'chidi_okeke', 'displayName': 'Chidi Okeke', 'sprite': 'male_telecom',
        'about': "Tarrowby's fleet coordinator at the Shipley depot, 40s, Nigerian-British (BRAND_SET.md, E6 additions). Easy-going, knows every driver. Placeholder sprite until P7-Z3.",
    },
    'lerato': {
        'id': 'lerato_dlamini', 'displayName': 'Lerato Dlamini', 'sprite': 'female_telecom',
        'about': "Tarrowby's health and safety adviser, 30s, South African, from Durban (BRAND_SET.md, E6 additions). Runs the depot's toolbox talks, so the before-and-after checks fall to her. Placeholder sprite until P7-Z3.",
    },
    'jun': {
        'id': 'jun_watanabe', 'displayName': 'Jun Watanabe', 'sprite': 'male_office_worker',
        'about': "Tarrowby's HR assistant, early 20s, Japanese-British, first job (BRAND_SET.md, Tarrowby cast). Runs the before-and-after checks for HR. Placeholder sprite until P7-Z3.",
    },
    'agnieszka': {
        'id': 'agnieszka_duda', 'displayName': 'Agnieszka Duda', 'sprite': 'female_blowse',
        'about': "Brightwell's payroll officer, 30s, Polish, part-time (BRAND_SET.md, Brightwell cast). Hands over the finance line on her way into the quarter-end meeting. Placeholder sprite until P7-Z3.",
    },
}

# Host lines: (before, after, choice, reply). One welcome line; the kiosk does the rest.
LINES = {
    ('e6', 'defend'): (
        "Grab a seat, you're on your break. The kiosk's set up like a work phone, with texts, a couple of notices from the yard and an email. No rush.",
        "That's the phone cleared. If a text or a notice wants a code scanned or a short link tapped, open the app yourself instead.",
        'Thanks, Chidi.', 'Any time.'),
    ('e7', 'defend'): (
        "Thanks for covering the phones while we're in the quarter-end meeting. Three voicemails and two emails have come in on the kiosk. Take your time with each.",
        "All five done, thanks. Whoever's voice it is, ringing back on the number we already hold settles it.",
        'Thanks, Agnieszka.', 'See you after the meeting.'),
}

# C2-m18: the check hosts said word-for-word identical lines. Give each host (and each
# stage) its own, so the before and after welcomes read as two different people.
CHECK_LINES = {
    ('lerato_dlamini', 'pre'): (
        "Morning. Before the training, a short check on the kiosk: ten texts, notices and emails from a Tarrowby work phone. Treat them like a normal shift.",
        "Good, that's your before check logged. We'll run the same kind of check after the training and line the two up.",
        'Thanks.', 'Any time.'),
    ('lerato_dlamini', 'post'): (
        "You're back. Ten fresh items on the kiosk, the same idea as the first check. The end screen lines this one up against the one you did before.",
        "That's logged. Thanks for sitting it; it helps us see what the training shifted.",
        'Thanks.', 'Any time.'),
    ('jun_watanabe', 'pre'): (
        "Hiya. There's a short check on the kiosk before we start: ten texts, notices and emails from a work phone. Just go with what you'd normally do.",
        "Lovely, first check saved. There's a matching one after the training, and you'll see how the two stack up.",
        'Thanks.', 'No problem.'),
    ('jun_watanabe', 'post'): (
        "Welcome back. Ten new items waiting on the kiosk, same as last time. If you did the first check, the end screen shows the two side by side.",
        "That's it in. Thanks for doing it; it all helps.",
        'Thanks.', 'No problem.'),
}

EPISODES = {
    'e6': {
        'frag': f'{AW}/e6/defend.json',
        'full_id': 'e6_texts_and_qr',
        'role_word': 'mobile',
        'role_label': 'staff with a work phone',
        'company': 'Tarrowby Logistics, a fictional company',
        'defend_set': 'e6_phone_messages',
        'forms': ('mobile_form_a', 'mobile_form_b'),
        'defend_host': 'chidi',
        'check_hosts': {'ab': 'lerato', 'ba': 'jun'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Smishing', 'QR code phishing', 'Mobile security', 'Security awareness']}],
        'defend': {
            'name': 'Texts and QR codes: your work phone',
            'brief': "Awareness episode E6, phone only. It's your break at the Shipley depot of Tarrowby Logistics, a fictional haulier, and six things are waiting on your work phone: texts, two printed notices with QR codes and an email. Some are real and some were built to trick you: decide what to do with each, and report or check anything that doesn't sit right.",
            'endGoal': 'Go through the six items on the work phone at the training kiosk.',
            'aim': ('work_phone_aim', 'Check the work phone', 'Go through the six items on the work phone at the training kiosk.'),
            'task': ('check_work_phone', 'Check the work phone'),
            'kiosk': ('A touch-screen kiosk set up as a Tarrowby work phone, with texts, notices and an email waiting.',
             'A touch-screen kiosk set up as a Tarrowby work phone. Nothing left to do here.'),
            'display': 'Texts and QR codes: spot it',
            'desc': "An awareness episode of about 8 minutes for staff with a work phone, on the defending side only. Six items on a phone at Tarrowby Logistics, a fictional haulier: texts, printed notices with QR codes and an email. Some are real and some were built to trick you. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the work phone and decide what to do with each text, notice and email. On a notice, check where the code goes before you would scan it. There's no clock on you here; the whole job is one or two small habits.",
            'conclusion': ('Work phone done', "That's the work phone finished. The debrief goes through each item."),
        },
        'check': {
            'items_pre': 'Ten items from a Tarrowby work phone: texts, printed notices with QR codes, and emails.',
            'items_post': 'Ten new items from a Tarrowby work phone, the same kinds as before.',
            'scope': 'Authorised exercise at Tarrowby Logistics, a fictional company. In scope: ten items on a Tarrowby work phone.',
            'kiosk': 'A touch-screen kiosk set up as a Tarrowby work phone, with ten items ready for the {nth} check.',
            'aim_desc': 'Go through ten items at the training kiosk.',
            'end': 'Go through the ten items at the training kiosk.',
            'name': 'Work phone check',
            'minutes': 9,
        },
    },
    'e7': {
        'frag': f'{AW}/e7/defend.json',
        'full_id': 'e7_voice_ceo',
        'defend_set': 'e7_finance_line',
        'defend_host': 'agnieszka',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Vishing', 'Voice cloning', 'CEO fraud', 'Security awareness']}],
        'defend': {
            'name': 'Voice and the CEO: the finance line',
            'brief': "Awareness episode E7, phone and inbox only. You're covering the finance office's phone and inbox at Brightwell Foods, a fictional food manufacturer, on a Friday afternoon. Three voicemails and two emails are waiting, and you can't always tell by the voice who left them: decide what to do with each, and ring back or report anything that doesn't sit right.",
            'endGoal': 'Go through the voicemails and emails at the training kiosk.',
            'aim': ('finance_line_aim', 'Cover the finance line', 'Go through the three voicemails and two emails at the training kiosk.'),
            'task': ('check_finance_line', 'Cover the finance line'),
            'kiosk': ("A touch-screen kiosk showing the finance office's phone and inbox, with voicemails and emails waiting.",
             "A touch-screen kiosk showing the finance office's phone and inbox. Nothing left to do here."),
            'display': 'Cloned voices and the CEO: spot it',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Cover the finance office's phone and inbox at Brightwell Foods, a fictional company: three voicemails, one of them in a copied voice, and two emails. Each answer is explained, and ringing back when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the voicemails and emails and decide what to do with each one. Read each voicemail's transcript: what it asks you to do matters more than whose voice it is. Work through them at your own pace; it all comes back to ringing the person yourself.",
            'voicePanel': {
                'heading': 'How a voice gets copied',
                'text': "Recordings of someone speaking in public, such as a talk, an interview or a company video, can be used to make new sentences in a voice that sounds like theirs. If you can't reach the person to check, ask someone who would know, such as the finance manager.",
            },
            'conclusion': ('Finance line done', "You've worked through all five messages. The debrief goes through each one."),
        },
    },
}


def load(ekey):
    frag = json.load(open(EPISODES[ekey]['frag']))
    return {s['id']: s for s in frag['triageSets']}, frag['awarenessEpisode']


def meta_for(display, desc, minutes, cybok, organiser_note=None):
    m = {
        'display_name': display,
        'description': desc,
    }
    if organiser_note:
        m['organiser_note'] = organiser_note
    m.update({
        'difficulty_level': 1,
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': minutes,
        'cybok': cybok,
    })
    return m


def defend_only(ekey):
    cfg = EPISODES[ekey]
    d = cfg['defend']
    sets, EP = load(ekey)
    ep_id = f"{cfg['full_id']}_defend"
    mission = f'awareness_{ep_id}'
    prefix = f'episode_{ep_id}_defend_'          # doubled `_defend_defend_`, as defendPrefix() gives
    done = f'{prefix}complete'
    s = clean_set(sets, cfg['defend_set'])
    s['outcome']['setGlobalPrefix'] = prefix
    strings = strip_private(copy.deepcopy(EP['strings']))
    # m27: a defend-only shell has no flip stage, so drop the flip-only strings
    # (the runner never reads them). Keep noBlameLine, defendOnly, mondayCard, brief.
    for _flip_key in ('flipHeading', 'flipIntro', 'flipDefenderLine', 'flipNoSend',
                      'flipMissed', 'flipPageIntro', 'flipCallIntro'):
        strings.pop(_flip_key, None)
    strings['brief'] = EP['_defendOnly']['brief']
    strings['defendIntro'] = d['defendIntro']
    if 'voicePanel' in d:
        strings['voicePanel'] = copy.deepcopy(d['voicePanel'])
    defend = strip_private(copy.deepcopy(EP['defend']))
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
        'debrief': strip_private(copy.deepcopy(EP['debrief'])),
    }
    globals_ = {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
    }
    host = HOSTS[cfg['defend_host']]
    ink_name = host['id']
    sc = scenario(mission, d['name'], d['brief'], d['endGoal'], d['aim'], d['task'], done, globals_,
                       {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, d['kiosk'], d['conclusion'])
    meta = meta_for(d['display'], d['desc'], d['minutes'], cfg['cybok'])
    ink = ink_source(f"Awareness {ekey.upper()}, defend only", host, done, LINES[(ekey, 'defend')])
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
    done = f'{prefix}complete'
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
    }
    extra = {}
    pre_mission = f'awareness_pre_{word}_{pair}'
    if stage == 'pre':
        extra['exportGlobals'] = ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_complete']
    else:
        # Imported names are not redeclared (as the committed E1, E3 and E5 post shells).
        extra['importGlobals'] = [
            {'from': pre_mission, 'var': 'triage_pre_percent', 'as': 'triage_pre_percent', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_reportRate', 'as': 'triage_pre_reportRate', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_complete', 'as': 'triage_pre_complete', 'default': False},
            {'from': pre_mission, 'completed': 'pre_check_completed'},
        ]
    host = HOSTS[cfg['check_hosts'][pair]]
    letters = pair.upper()
    first, second = letters[0], letters[1]
    company = cfg['company']
    if stage == 'pre':
        name = f"{c['name']}: before ({letters})"
        brief = (f"The first of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_pre']} Decide what to do with each one. Your result is saved so the second check can compare with it.")
        aim = ('first_check_aim', 'Do the first check', c['aim_desc'])
        task = ('finish_check', 'Finish the first check')
        display = awareness_deploy.check_title('pre', word)
        desc = (f"A short check for {cfg['role_label']} at {company}, taken before the awareness episodes (pair {letters}). "
                f"{c['items_pre']} The result is kept so the matching after-check (awareness_post_{word}_{pair}) "
                "can show how the two compare.")
        obs = c['kiosk'].format(nth='first')
        conclusion = ('First check done', 'Your result is saved, ready for the second check to compare with.')
    else:
        name = f"{c['name']}: after ({letters})"
        brief = (f"The second of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_post']} If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', c['aim_desc'])
        task = ('finish_check', 'Finish the second check')
        display = awareness_deploy.check_title('post', word)
        desc = (f"A short check for {cfg['role_label']} at {company}, taken after the awareness episodes (pair {letters}). "
                f"{c['items_post']} It is matched to the first check (awareness_pre_{word}_{pair}), and the end screen "
                "compares the two results when the first check was finished.")
        obs = c['kiosk'].format(nth='second')
        conclusion = ('Second check done', 'Thanks for taking the time with it. If you also sat the earlier check, the results are shown side by side.')
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, c['end'], aim, task, done, globals_,
                       {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, conclusion, extra)
    meta = meta_for(display, desc, c['minutes'], cfg['cybok'], awareness_deploy.CHECK_ORGANISER_NOTE)
    when = 'before' if stage == 'pre' else 'after'
    ink = ink_source(f"Awareness check, {word}, {when} ({letters})", host, done, CHECK_LINES[(host['id'], stage)])
    return mission, sc, meta, ink_name, ink


# Top-level titleScreenName (engine batch 14), placed right after scenario_name. Values match the committed
# shells (owner decision 2026-10-30): checks say Starting check / Final check, defend shells use the episode name.
TITLE_NAMES = {'awareness_e6_texts_and_qr_defend': 'Texts and QR codes', 'awareness_e7_voice_ceo_defend': 'Cloned voices and the CEO'}


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
    built = [defend_only('e6')]
    built += [check('e6', p, st) for p in ('ab', 'ba') for st in ('pre', 'post')]
    built.append(defend_only('e7'))
    for mission, sc, meta, ink_name, ink in built:
        sc = with_title_screen_name(sc, mission)
        d = os.path.join(out, mission)
        os.makedirs(os.path.join(d, 'ink'), exist_ok=True)
        with open(os.path.join(d, 'scenario.json.erb'), 'w') as f:
            json.dump(sc, f, indent=2, ensure_ascii=False)
            f.write('\n')
        meta = with_title_art(meta, mission)
        meta = awareness_deploy.with_result_fields(meta, sc)
        with open(os.path.join(d, 'mission.json'), 'w') as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
            f.write('\n')
        with open(os.path.join(d, 'ink', f'{ink_name}.ink'), 'w') as f:
            f.write(ink)
        print('wrote', d)


if __name__ == '__main__':
    main()
