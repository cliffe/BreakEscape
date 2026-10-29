#!/usr/bin/env python3
"""Build the defend-only shells for the new awareness episodes (E8 now; E9 to E17 are added to
EPISODES and HOSTS as each is wired), from awareness/eN/defend.json.

New generator for the E8 to E17 wave (implementation/01_PIPELINE.md P4). Its helpers are copied
from gen_e6_e7_shells.py, not imported, so the built generators and the shells they write cannot
be changed by this one. Differences, all to make it safe by construction:
  - the repo comes from --repo <path> or the BREAKESCAPE_REPO environment variable, falling back to
    this script's own path (right only when it is run from awareness/ in the real checkout), so no
    home folder is hard-coded;
  - the output folder is a required argument: there is no default into scenarios/;
  - it builds only the full episodes' defend-only shells. The check shells for the new topics belong
    to gen_checks_v2_shells.py.

Usage: gen_e8_e17_shells.py [--repo <checkout>] <out_dir>
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
GEN = 'planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py'

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


# Hosts: built cast from BRAND_SET.md. Sprite keys are existing placeholders (no image generation)
# until the PixelLab reset.
HOSTS = {
    'anjali': {
        'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist',
        'about': "Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.",
    },
}

# Host lines: (before, after, choice, reply). One welcome line; the kiosk does the rest.
LINES = {
    ('e8', 'defend'): (
        "You're covering a colleague's inbox this morning. They clicked a convincing email and signed in, and now someone else is using their account. Some of what's turned up is a real sign; some is ordinary. Take each one as it comes, and report or check anything that doesn't sit right.",
        "That's the inbox sorted, thanks. The one move that works for every real sign is the same: report it and leave it be.",
        'Thanks, Anjali.', 'Any time.'),
}

EPISODES = {
    'e8': {
        'frag': f'{AW}/e8/defend.json',
        'full_id': 'e8_after_the_click',
        'defend_set': 'e8_used_account',
        'defend_host': 'anjali',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Phishing', 'Incident reporting', 'Security awareness', 'Usable security']}],
        'defend': {
            'name': 'After the click: the signs that follow',
            'brief': "You're on an authorised exercise at Quayholt Insurance, a fictional company. A colleague clicked a convincing email and signed in, and now their account is being used. You're covering their inbox. Some of what turns up is a real sign that something is wrong, and some is ordinary. Sort it, and report or check anything that doesn't sit right. Reporting when you're unsure is always fine and never marked down.",
            'endGoal': "Sort the signs in the colleague's inbox at the training kiosk.",
            'aim': ('used_account_aim', 'Sort the signs that follow', "Work through the signs in the colleague's inbox at the training kiosk."),
            'task': ('sort_the_signs', 'Sort the signs that follow'),
            'kiosk': ("A touch-screen kiosk showing the colleague's Quayholt inbox after a click: a handful of signs to sort.",
                      "A touch-screen kiosk showing the colleague's Quayholt inbox after a click. The signs are all sorted."),
            'display': 'Awareness E8: After the click (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Sit in a colleague's seat at Quayholt Insurance, a fictional company, after they clicked a convincing email: some of what turns up in their account is a real sign that something is wrong, and some is ordinary. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the signs in the colleague's inbox and decide what to do with each one. Some are a real sign that someone else is in the account, and some are ordinary; the one move that works for every real sign is to report it and leave the device as it is. Take them at your own pace.",
            'conclusion': ('Signs sorted', "You've sorted the signs in the colleague's inbox and finished this episode."),
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
        f'{prefix}pass': False,
    }
    host = HOSTS[cfg['defend_host']]
    ink_name = host['id']
    sc = scenario(mission, d['name'], d['brief'], d['endGoal'], d['aim'], d['task'], done, globals_,
                       {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, d['kiosk'], d['conclusion'])
    meta = meta_for(d['display'], d['desc'], d['minutes'], cfg['cybok'])
    ink = ink_source(f"Awareness {ekey.upper()}, defend only", host, done, LINES[(ekey, 'defend')])
    return mission, sc, meta, ink_name, ink


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: gen_e8_e17_shells.py [--repo <checkout>] <out_dir>')
    out = sys.argv[1]
    built = [defend_only('e8')]
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
