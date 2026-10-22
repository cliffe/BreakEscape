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
  - E7 sets strings.voicePanel (the debrief's "a voice is not proof" panel).

E7 has no check missions: its role is everyone, and it reuses the general-staff forms
(awareness_{pre,post}_general_{ab,ba}), which already have shells.

Usage: gen_e6_e7_shells.py [out_dir]   (default: the repo's scenarios/)
"""
import copy
import json
import os
import sys

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


def clean_set(sets, set_id, stage=None, comparison=None):
    s = strip_private(copy.deepcopy(sets[set_id]))
    s.pop('pairedWith', None)
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
        'position': {'x': 3, 'y': 3},
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
    return {
        'type': 'kiosk',
        'id': 'training_kiosk',
        'name': 'Training kiosk',
        'position': {'x': 6, 'y': 2},
        'takeable': False,
        'interactable': True,
        'active': True,
        'locked': False,
        'observations': observations,
        'minigameData': {'episodeId': ep_id},
    }


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
    sc['rooms'] = {
        'training_room': {
            'type': 'room_office',
            'door_sign': 'Training Room',
            'connections': {},
            'npcs': [host_npc(host, done, task[0], ink_path)],
            'objects': [kiosk(ep_id, kiosk_obs)],
        }
    }
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
    ('e6', 'pre'): (
        "Morning. Before the training there's a short check on the kiosk: ten texts, notices and emails from a Tarrowby work phone. Just do what you'd normally do.",
        "That's your first check saved. You'll do another after the training, and see how the two compare.",
        'Thanks.', 'No problem.'),
    ('e6', 'post'): (
        "Welcome back. Ten new items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "That's the second check saved. Thanks for doing both.",
        'Thanks.', 'No problem.'),
    ('e7', 'defend'): (
        "Thanks for covering the phones while we're in the quarter-end meeting. Three voicemails and two emails have come in on the kiosk. Take your time with each.",
        "All five done, thanks. Whoever's voice it is, ringing back on the number we already hold settles it.",
        'Thanks, Agnieszka.', 'See you after the meeting.'),
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
            'kiosk': 'A touch-screen kiosk set up as a Tarrowby work phone, with texts, notices and an email waiting.',
            'display': 'Awareness E6: Texts and QR codes (phone only)',
            'desc': "An eight-minute awareness episode for staff with a work phone, on the defending side only. Six items on a phone at Tarrowby Logistics, a fictional haulier: texts, printed notices with QR codes and an email. Some are real and some were built to trick you. Each answer is explained, and reporting a real message never costs you anything.",
            'minutes': 8,
            'defendIntro': "Go through the work phone and decide what to do with each text, notice and email. On a notice, check where the code goes before you would scan it. Take your time: there is no trick to it, just the habits that catch these.",
            'conclusion': ('Work phone done', "You've been through all six items and finished this episode."),
        },
        'check': {
            'items_pre': 'Ten items from a Tarrowby work phone: texts, printed notices with QR codes, and emails.',
            'items_post': 'Ten new items from a Tarrowby work phone, the same kinds as before.',
            'scope': 'Authorised exercise at Tarrowby Logistics, a fictional company. In scope: ten items on a Tarrowby work phone.',
            'kiosk': 'A touch-screen kiosk set up as a Tarrowby work phone, with ten items ready for the {nth} check.',
            'aim_desc': 'Go through ten items at the training kiosk.',
            'end': 'Go through the ten items at the training kiosk.',
            'name': 'Work phone check',
            'minutes': 4,
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
            'kiosk': "A touch-screen kiosk showing the finance office's phone and inbox, with voicemails and emails waiting.",
            'display': 'Awareness E7: Voice and the CEO (phone and inbox only)',
            'desc': "An eight-minute awareness episode for all staff, on the defending side only. Cover the finance office's phone and inbox at Brightwell Foods, a fictional company: three voicemails, one of them in a copied voice, and two emails. Each answer is explained, and ringing someone back on a number you already hold never costs you anything.",
            'minutes': 8,
            'defendIntro': "Go through the voicemails and emails and decide what to do with each one. Read each voicemail's transcript: what it asks you to do matters more than whose voice it is. Take your time: there is no trick to it, just the habits that catch these.",
            'voicePanel': {
                'heading': 'A voice is not proof',
                'text': "A voice can be copied. Recordings of someone speaking in public, such as a talk, an interview or a company video, can be used to make new sentences in a voice that sounds like theirs. So a familiar voice on a voicemail or a call doesn't tell you who is speaking, and an email that backs it up doesn't either. What still works is the route: ring the person back on a number you already hold, or check with someone who would know, such as the finance manager.",
            },
            'conclusion': ('Finance line done', "You've been through all five messages and finished this episode."),
        },
    },
}


def load(ekey):
    frag = json.load(open(EPISODES[ekey]['frag']))
    return {s['id']: s for s in frag['triageSets']}, frag['awarenessEpisode']


def meta_for(display, desc, minutes, cybok):
    return {
        'display_name': display,
        'description': desc,
        'difficulty_level': 1,
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': minutes,
        'cybok': cybok,
    }


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
    strings = strip_private(copy.deepcopy(EP['strings']))
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
        f'{prefix}pass': False,
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
        # Imported names are not redeclared (as the committed E1, E3 and E5 post shells).
        extra['importGlobals'] = [
            {'from': pre_mission, 'var': 'triage_pre_percent', 'as': 'triage_pre_percent', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_reportRate', 'as': 'triage_pre_reportRate', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_done', 'as': 'triage_pre_done', 'default': False},
            {'from': pre_mission, 'completed': 'pre_check_completed'},
        ]
    host = HOSTS[cfg['check_hosts'][pair]]
    letters = pair.upper()
    first, second = letters[0], letters[1]
    company = cfg['company']
    if stage == 'pre':
        name = f"{c['name']}: before ({letters})"
        brief = (f"The first of two short checks for {cfg['role_label']} at {company} (pair {letters}, form {first}). "
                 f"{c['items_pre']} Decide what to do with each one. Your result is saved so the second check can compare with it.")
        aim = ('first_check_aim', 'Do the first check', c['aim_desc'])
        task = ('finish_check', 'Finish the first check')
        display = f'Awareness check: {word}, before ({letters})'
        desc = (f"A short check for {cfg['role_label']} at {company}, taken before the awareness episodes (pair {letters}). "
                f"{c['items_pre']} The result is kept so the matching after-check (awareness_post_{word}_{pair}) "
                "can show how the two compare.")
        obs = c['kiosk'].format(nth='first')
        conclusion = ('First check done', 'Your result is saved, ready for the second check to compare with.')
    else:
        name = f"{c['name']}: after ({letters})"
        brief = (f"The second of two short checks for {cfg['role_label']} at {company} (pair {letters}, form {second}). "
                 f"{c['items_post']} If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', c['aim_desc'])
        task = ('finish_check', 'Finish the second check')
        display = f'Awareness check: {word}, after ({letters})'
        desc = (f"A short check for {cfg['role_label']} at {company}, taken after the awareness episodes (pair {letters}). "
                f"{c['items_post']} It is matched to the first check (awareness_pre_{word}_{pair}), and the end screen "
                "compares the two results when the first check was finished.")
        obs = c['kiosk'].format(nth='second')
        conclusion = ('Second check done', 'Thank you for taking both checks.')
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, c['end'], aim, task, done, globals_,
                       {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, conclusion, extra)
    meta = meta_for(display, desc, c['minutes'], cfg['cybok'])
    when = 'before' if stage == 'pre' else 'after'
    ink = ink_source(f"Awareness check, {word}, {when} ({letters})", host, done, LINES[(ekey, stage)])
    return mission, sc, meta, ink_name, ink


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else REPO + '/scenarios'
    built = [defend_only('e6')]
    built += [check('e6', p, st) for p in ('ab', 'ba') for st in ('pre', 'post')]
    built.append(defend_only('e7'))
    for mission, sc, meta, ink_name, ink in built:
        d = os.path.join(out, mission)
        os.makedirs(os.path.join(d, 'ink'), exist_ok=True)
        with open(os.path.join(d, 'scenario.json.erb'), 'w') as f:
            json.dump(sc, f, indent=2, ensure_ascii=False)
            f.write('\n')
        with open(os.path.join(d, 'mission.json'), 'w') as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
            f.write('\n')
        with open(os.path.join(d, 'ink', f'{ink_name}.ink'), 'w') as f:
            f.write(ink)
        print('wrote', d)


if __name__ == '__main__':
    main()
