#!/usr/bin/env python3
"""Build the check shells for the "v2" topic check pairs (10_CHECK_FORMS.md):
awareness_{pre,post}_<role_word>_{ab,ba}, four shells per pair, from
awareness/checks_v2/<pair>.json.

Built: general_v2 (Quayholt, Verify off) and data_conduct (Carrholme, Verify on). A further pair is one more
EPISODES entry (plus its HOSTS, CHECK_LINES and PERMUTE rows); main() builds it with no other change.

Helpers are copied from gen_e6_e7_shells.py (not imported, so a change there cannot break this);
check() reads the company from cfg['company'].

Safe by construction (01_PIPELINE.md P0 and P4):
  - the repo comes from --repo <path>, else $BREAKESCAPE_REPO, else this script's own path
    (Path(__file__).resolve().parents[3], right only when run from AW/ in the real checkout);
  - the output folder is a required argument, so this can never default into scenarios/.

Usage: gen_checks_v2_shells.py [--repo REPO] OUT_DIR
Run it into a scratch folder, prove a no-change rerun is byte-identical, then copy in only the new files.
"""
import copy
import json
import os
import sys
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import training_room  # noqa: E402
import awareness_deploy  # noqa: E402


def _parse_args(argv):
    repo = os.environ.get('BREAKESCAPE_REPO')
    out = None
    i = 0
    while i < len(argv):
        if argv[i] == '--repo' and i + 1 < len(argv):
            repo = argv[i + 1]
            i += 2
        elif out is None and not argv[i].startswith('--'):
            out = argv[i]
            i += 1
        else:
            sys.exit('Usage: gen_checks_v2_shells.py [--repo REPO] OUT_DIR')
    if out is None:
        sys.exit('Usage: gen_checks_v2_shells.py [--repo REPO] OUT_DIR   (the output folder is required)')
    return repo or str(Path(__file__).resolve().parents[3]), out


REPO, OUT_DIR = _parse_args(sys.argv[1:]) if __name__ == '__main__' else (
    os.environ.get('BREAKESCAPE_REPO') or str(Path(__file__).resolve().parents[3]), None)
AW = f'{REPO}/planning_notes/phishing_and_social_engineering/awareness'
GEN = 'planning_notes/phishing_and_social_engineering/awareness/gen_checks_v2_shells.py'

PLAYER = {
    'id': 'player',
    'displayName': 'Learner',
    'spriteSheet': 'female_office_worker_v2',
    'spriteTalk': 'assets/characters/female_office_worker_talk.png',
    'spriteConfig': {'idleFrameRate': 6, 'walkFrameRate': 12},
}


def strip_private(obj):
    """Drop authoring notes (keys starting with '_') at every level."""
    if isinstance(obj, dict):
        return {k: strip_private(v) for k, v in obj.items() if not k.startswith('_')}
    if isinstance(obj, list):
        return [strip_private(v) for v in obj]
    return obj


# new[i] = old[order[i]]. Phish land in disjoint ordinal slots across A and B (CHECK_PARITY_AUDIT B1).
PERMUTE = {
    'general_v2_form_a': [1, 0, 2, 3, 4, 5, 6, 8, 7, 9],
    'general_v2_form_b': [0, 1, 3, 2, 4, 6, 5, 8, 9, 7],
    'data_conduct_form_a': [1, 0, 2, 3, 4, 5, 6, 8, 7, 9],
    'data_conduct_form_b': [0, 1, 3, 2, 4, 6, 5, 8, 9, 7],
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


HOSTS = {
    'anjali': {
        'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist',
        'about': "Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Runs the before-and-after checks. Placeholder sprite until PixelLab.",
    },
    'darren': {
        'id': 'darren_price', 'displayName': 'Darren Price', 'sprite': 'male_telecom',
        'about': "Quayholt's service desk team lead and owner of the verification script, 40s, white, from Bristol (BRAND_SET.md). Steady, a bit dry. Placeholder sprite until PixelLab.",
    },
    'tomasz': {
        'id': 'tomasz_wisniewski', 'displayName': 'Tomasz Wisniewski', 'sprite': 'male_office_worker',
        'about': "Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years (BRAND_SET.md, E11 additions). Receives the reports. Runs the before-and-after checks for the AB pair. Placeholder sprite until PixelLab.",
    },
    'yusuf': {
        'id': 'yusuf_demir', 'displayName': 'Yusuf Demir', 'sprite': 'male_telecom',
        'about': "Carrholme Services' information security lead, 40s, British Turkish (data_conduct _brandAdditions). Runs the before-and-after checks for the BA pair; steady, practical. Placeholder sprite until PixelLab.",
    },
}

CHECK_LINES = {
    ('anjali_rao', 'pre'): (
        "I'm Anjali, I look after security here. There's a short check on the kiosk first: ten items from a Quayholt inbox. Do what you'd normally do.",
        "That's your first check saved. We'll do another after the training and see how the two compare.",
        'Thanks, Anjali.', 'Any time.'),
    ('anjali_rao', 'post'): (
        "Welcome back. Ten fresh items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "Check saved. Thanks for doing it.",
        'Thanks, Anjali.', 'Any time.'),
    ('darren_price', 'pre'): (
        "Darren here, I run the service desk. Quick check on the kiosk before the training: ten items from a Quayholt inbox. Just do what you'd normally do.",
        "First check's saved. You'll do another afterwards and we'll see how the two compare.",
        'Thanks, Darren.', 'No problem.'),
    ('darren_price', 'post'): (
        "Back again. Ten new items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "Check saved. Thanks for doing it.",
        'Thanks, Darren.', 'No problem.'),
    ('tomasz_wisniewski', 'pre'): (
        "I'm Tomasz, the data protection officer here. There's a short check on the kiosk first: ten items about data and conduct from a Carrholme inbox. Do what you'd normally do.",
        "That's your first check saved. We'll do another after the training and see how the two compare.",
        'Thanks, Tomasz.', "You're welcome."),
    ('tomasz_wisniewski', 'post'): (
        "Welcome back. Ten fresh items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "Check saved. Thank you for doing it.",
        'Thanks, Tomasz.', "You're welcome."),
    ('yusuf_demir', 'pre'): (
        "Yusuf here, I look after information security at Carrholme. Quick check on the kiosk before the training: ten items from a Carrholme inbox. Just do what you'd normally do.",
        "First check's saved. You'll do another afterwards and we'll compare the two.",
        'Thanks, Yusuf.', 'No problem.'),
    ('yusuf_demir', 'post'): (
        "Back again. Ten new items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "Check saved. Thanks for doing it.",
        'Thanks, Yusuf.', 'No problem.'),
}

EPISODES = {
    'general_v2': {
        'frag': f'{AW}/checks_v2/general_v2.json',
        'role_word': 'general_v2',
        'role_label': 'all staff',
        'company': 'Quayholt Insurance, a fictional company',
        'forms': ('general_v2_form_a', 'general_v2_form_b'),
        'check_hosts': {'ab': 'anjali', 'ba': 'darren'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Security awareness', 'Phishing', 'Multi-factor authentication', 'Deepfakes']}],
        'check': {
            'name': 'Everyday threats check',
            'items_pre': 'Ten items from a Quayholt inbox: emails, a browser page and a sign-in prompt.',
            'items_post': 'Ten new items from a Quayholt inbox, the same kinds as before.',
            'scope': 'Authorised exercise at Quayholt Insurance, a fictional company. In scope: ten items in a Quayholt inbox.',
            'kiosk': 'A touch-screen kiosk set up as a Quayholt inbox, with ten items ready for the {nth} check.',
            'aim_desc': 'Go through ten items at the training kiosk.',
            'end': 'Go through the ten items at the training kiosk.',
            'minutes': 9,
        },
    },
    'data_conduct': {
        'frag': f'{AW}/checks_v2/data_conduct.json',
        'role_word': 'data_conduct',
        'role_label': 'all staff',
        'company': 'Carrholme Services, a fictional company',
        'forms': ('data_conduct_form_a', 'data_conduct_form_b'),
        'check_hosts': {'ab': 'tomasz', 'ba': 'yusuf'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Security awareness', 'Data protection', 'Insider risk', 'Acceptable use']}],
        'check': {
            'name': 'Data and conduct check',
            'items_pre': 'Ten items from a Carrholme inbox and phone: emails and a call about data and conduct.',
            'items_post': 'Ten new items from a Carrholme inbox and phone, the same kinds as before.',
            'scope': 'Authorised exercise at Carrholme Services, a fictional company. In scope: ten items from a Carrholme inbox and phone.',
            'kiosk': 'A touch-screen kiosk set up as a Carrholme inbox and phone, with ten items ready for the {nth} check.',
            'aim_desc': 'Go through ten items at the training kiosk.',
            'end': 'Go through the ten items at the training kiosk.',
            'minutes': 9,
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
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': minutes,
        'cybok': cybok,
    }


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
        brief = (f"The first of two short checks for {cfg['role_label']} at {company}. "
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
        brief = (f"The second of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_post']} If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', c['aim_desc'])
        task = ('finish_check', 'Finish the second check')
        display = f'Awareness check: {word}, after ({letters})'
        desc = (f"A short check for {cfg['role_label']} at {company}, taken after the awareness episodes (pair {letters}). "
                f"{c['items_post']} It is matched to the first check (awareness_pre_{word}_{pair}), and the end screen "
                "compares the two results when the first check was finished.")
        obs = c['kiosk'].format(nth='second')
        conclusion = ('Second check done', 'Thanks for taking the time with it. If you also sat the earlier check, the results are shown side by side.')
    desc += (" Organiser note: each role's check tests the channel that role meets in its "
             "episode, and in a session that runs more than one episode only the learner's "
             "primary-role check is recorded.")
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, c['end'], aim, task, done, globals_,
                       {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, conclusion, extra)
    meta = meta_for(display, desc, c['minutes'], cfg['cybok'])
    when = 'before' if stage == 'pre' else 'after'
    ink = ink_source(f"Awareness check, {word}, {when} ({letters})", host, done, CHECK_LINES[(host['id'], stage)])
    return mission, sc, meta, ink_name, ink


def main():
    out = OUT_DIR
    built = [check(k, p, st) for k in EPISODES for p in ('ab', 'ba') for st in ('pre', 'post')]
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
