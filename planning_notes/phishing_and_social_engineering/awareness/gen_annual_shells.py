#!/usr/bin/env python3
"""Build the core_17 annual edition shell (awareness_core_17_annual_2027_defend), from
awareness/annual/defend.json and annual/WIRING_NOTES.md (WP-12 Part B).

A small sibling of gen_e8_e17_shells.py (implementation/01_PIPELINE.md P4): the helpers are copied,
not imported, so neither generator can change the other's shells. Same safety rules:
  - the repo comes from --repo <path> or the BREAKESCAPE_REPO environment variable, falling back to
    this script's own path (right only when it is run from awareness/ in the real checkout);
  - the output folder is a required argument: there is no default into scenarios/.

The fragment already holds the whole awarenessEpisode block (variant defendOnly, strings, debrief),
so unlike the episode generators nothing is rebuilt from an `_defendOnly` note: the block is copied
with the authoring notes stripped.

Usage: gen_annual_shells.py [--repo <checkout>] <out_dir>
"""
import copy
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import training_room  # noqa: E402
import awareness_deploy  # noqa: E402


def _arg_repo():
    argv = sys.argv[1:]
    if '--repo' in argv:
        i = argv.index('--repo')
        repo = argv[i + 1]
        del argv[i:i + 2]
        sys.argv[1:] = argv
        return repo
    return os.environ.get('BREAKESCAPE_REPO') or str(Path(__file__).resolve().parents[3])


REPO = _arg_repo()
AW = f'{REPO}/planning_notes/phishing_and_social_engineering/awareness'
GEN = 'planning_notes/phishing_and_social_engineering/awareness/gen_annual_shells.py'

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
    if isinstance(before, (list, tuple)):  # several host lines (each under the 30-word cap)
        before = f'\n        {n}: '.join(before)
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


HOSTS = {
    'graham': {
        'id': 'graham_whitfield', 'displayName': 'Graham Whitfield', 'sprite': 'male_office_worker',
        'about': "Brightwell's finance training lead, early 60s, white British, from Halifax; unhurried and kind. Acts as a neutral proctor for the year-end edition (BRAND_SET.md). Placeholder sprite until the PixelLab reset.",
    },
}

LINES = (
    ("Welcome to the year-end edition. It's a mixed run of this year's messages, across a few channels and a few companies.",
     "Real ones are in there with the scams. Take them one at a time, and say why on each."),
    "That's the year covered, thanks. Check another way, report what doesn't sit right, and leave the rest to the people whose job it is.",
    'Thanks, Graham.', 'Any time.',
)

CFG = {
    'frag': f'{AW}/annual/defend.json',
    'set': 'annual_2027_mixed',
    'host': 'graham',
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Security awareness', 'Phishing', 'Vishing', 'Annual assessment']}],
    'name': 'Year End: the annual mixed edition',
    'brief': "You're on an authorised exercise: a fictional year-end edition. Eight messages from across the year, from three fictional companies, arrive by email, call, voicemail, text, sign-in prompt and web page. Some are real and some are scams. Check another way and report what doesn't sit right. Reporting when you're unsure is always fine and never marked down.",
    'endGoal': 'Work through the year-end messages at the training kiosk.',
    'aim': ('annual_edition_aim', 'Work through the year in review', 'Go through the eight messages at the training kiosk.'),
    'task': ('check_annual_edition', 'Work through the year in review'),
    'kiosk': ('A touch-screen kiosk with eight messages from across the year, waiting to be checked.',
              'A touch-screen kiosk with the year in review. Episode finished.'),
    'display': 'Year End: the annual mixed edition',
    'desc': "An awareness edition of about 10 minutes for all staff, on the defending side only. A mixed run of the year's messages across email, calls, a voicemail, a text, a sign-in prompt and a web page, from three fictional companies. Your organiser places your existing role post-check after it, which compares against your role pre-check. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
    'minutes': 10,
    'conclusion': ('Year in review done', "You've worked through the year's messages. The debrief goes through each one."),
}


def build():
    frag = json.load(open(CFG['frag']))
    sets = {s['id']: s for s in frag['triageSets']}
    EP = strip_private(copy.deepcopy(frag['awarenessEpisode']))
    ep_id = EP['id']
    mission = f'awareness_{ep_id}'
    prefix = f'episode_{ep_id}_defend_'
    done = f'{prefix}done'
    s = clean_set(sets, CFG['set'])
    assert s['outcome']['setGlobalPrefix'] == prefix, 'fragment prefix does not match the episode id'
    assert EP['conclusionTaskId'] == CFG['task'][0]
    globals_ = {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
        f'{prefix}pass': False,
    }
    host = HOSTS[CFG['host']]
    sc = scenario(mission, CFG['name'], CFG['brief'], CFG['endGoal'], CFG['aim'], CFG['task'], done,
                  globals_, {'triageSets': [s], 'awarenessEpisode': EP}, host, host['id'],
                  CFG['kiosk'], CFG['conclusion'])
    meta = meta_for(CFG['display'], CFG['desc'], CFG['minutes'], CFG['cybok'])
    ink = ink_source('Awareness core_17, annual edition', host, done, LINES)
    return mission, sc, meta, host['id'], ink


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: gen_annual_shells.py [--repo <checkout>] <out_dir>')
    out = sys.argv[1]
    mission, sc, meta, ink_name, ink = build()
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


if __name__ == '__main__':
    main()
