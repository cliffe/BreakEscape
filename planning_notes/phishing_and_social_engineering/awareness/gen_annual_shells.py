#!/usr/bin/env python3
"""Build the core_17 annual edition shell (ca_annual_2027_defend), from
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
from title_art import with_title_art  # noqa: E402
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


# Hosts that now have their own committed sprite art (v2 pipeline, 2026-11-01);
# these emit their own key, others keep the shared generic placeholder sprite.
OWN_ART_HOSTS = {
    'anjali_rao', 'niamh_doherty', 'darren_price', 'julian_sallow', 'jun_watanabe',
    'graham_whitfield', 'adaeze_okafor', 'fatima_begum', 'thandiwe_moyo', 'chidi_okeke',
    'agnieszka_duda', 'yasmin_chaudhry', 'joanne_pell', 'sofia_marchetti',
    'ibrahim_diallo', 'lerato_dlamini',

    # 2026-11-03: second host-art batch (v2 pipeline walk sprites + talk/visemes)
    'gwen_pritchard', 'nilesh_solanki', 'tomasz_wisniewski', 'zainab_hussain', 'ama_owusu',
    'lorna_easton', 'yusuf_demir',
}


VOICES = {
    "adaeze_okafor": {
        "name": "Gacrux",
        "style": "Brightwell's finance manager, in her 40s, who came up through accounts payable, warm and direct. Speak with a consistent British accent with a light Nigerian inflection throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "gwen_pritchard": {
        "name": "Sulafat",
        "style": "Brightwell's IT service desk lead, in her late 30s, friendly and practical. Speak with a consistent South Wales accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "agnieszka_duda": {
        "name": "Callirrhoe",
        "style": "Brightwell's part-time payroll officer, in her 30s, calm and matter-of-fact. Speak with a consistent, lightly Polish-accented English throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "graham_whitfield": {
        "name": "Umbriel",
        "style": "Brightwell's finance training lead, in his early 60s, unhurried and kind; a neutral proctor for the year-end edition. Speak with a consistent West Yorkshire accent from Halifax throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "joanne_pell": {
        "name": "Zephyr",
        "style": "Brightwell's learning and development coordinator, in her late 40s, brisk and friendly. Speak with a consistent East Midlands accent from Leicester throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "nilesh_solanki": {
        "name": "Iapetus",
        "style": "Tarrowby's IT service desk analyst, in his 30s, patient and helpful with an \"ask first\" manner. Speak with a consistent East Midlands accent from Leicester throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "fatima_begum": {
        "name": "Vindemiatrix",
        "style": "Tarrowby's recruitment lead and owner of the recruitment inbox, in her 30s, friendly and organised. Speak with a consistent Yorkshire accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "chidi_okeke": {
        "name": "Zubenelgenubi",
        "style": "Tarrowby's fleet coordinator at the Shipley depot, in his 40s, easy-going and knows every driver. Speak with a consistent West Yorkshire accent with a light Nigerian inflection throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "zainab_hussain": {
        "name": "Achernar",
        "style": "Tarrowby's field service engineer, in her 30s, steady and down-to-earth; eight years working from vans and trains. Speak with a consistent northern English accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "jun_watanabe": {
        "name": "Puck",
        "style": "Tarrowby's HR assistant, in his early 20s, in his first job, eager and polite. Speak with a consistent southern English accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "lerato_dlamini": {
        "name": "Gacrux",
        "style": "Tarrowby's health and safety adviser, in her 30s, confident and direct; runs the depot toolbox talks. Speak with a consistent South African accent from Durban throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "ibrahim_diallo": {
        "name": "Sadaltager",
        "style": "Tarrowby's IT support lead, in his 40s, patient and unhurried; fifteen years in Leeds. Speak with a consistent English accent with a light French-West African inflection, now settled in Leeds, throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "anjali_rao": {
        "name": "Kore",
        "style": "Quayholt's information security analyst, about 35, who moved to the UK from Bengaluru; calm and attentive. Speak with a consistent educated Indian English accent, softened by years in the UK, throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "niamh_doherty": {
        "name": "Leda",
        "style": "Quayholt's internal communications officer and IT trainer, in her mid 20s, bright, quick and a little wry. Speak with a consistent Northern Irish accent from Belfast throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "darren_price": {
        "name": "Orus",
        "style": "Quayholt's security awareness lead, in his 50s, measured and dry. Speak with a consistent Bristol and West Country accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "sofia_marchetti": {
        "name": "Despina",
        "style": "Quayholt's HR adviser, in her 30s, warm and approachable; second-generation Italian-British. Speak with a consistent southern English accent with a light Italian-British lilt throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "julian_sallow": {
        "name": "Rasalgethi",
        "style": "Merrin & Sallow's co-founding partner, in his mid 60s, calm, measured and a little wry; sits on planning panels. Speak with a consistent southern English accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "yasmin_chaudhry": {
        "name": "Laomedeia",
        "style": "Merrin & Sallow's finance controller, in her 40s, measured and precise; the person a PA should ring about money. Speak with a consistent southern English accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "thandiwe_moyo": {
        "name": "Pulcherrima",
        "style": "Merrin & Sallow's studio manager, in her 30s, calm and capable. Speak with a consistent southern English accent with a light Zimbabwean inflection throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "delphine_reception": {
        "name": "Despina",
        "style": "Merrin & Sallow's front-of-house coordinator, in her 30s, poised and polite under a little pressure at the desk. Speak with a consistent southern English accent with a light Mediterranean lilt throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "lorna_easton": {
        "name": "Erinome",
        "style": "Merrin & Sallow's reception and facilities lead, in her 40s, warm and reassuring. Speak with a consistent north-west England accent from Lancashire throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "ama_owusu": {
        "name": "Autonoe",
        "style": "Security lead on Merrin & Sallow's outsourced IT provider (Fenlow Managed IT), in her 40s, warm and practical. Speak with a consistent London and southern English accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "tomasz_wisniewski": {
        "name": "Algieba",
        "style": "Carrholme's Data Protection Officer, in his 50s, careful and reassuring; in the UK 25 years. Speak with a consistent, lightly Polish-accented English, softened by long years in the UK, throughout — do not shift to any other accent.",
        "language": "en-GB"
    },
    "yusuf_demir": {
        "name": "Alnilam",
        "style": "Carrholme's information security lead, in his 40s, steady and practical. Speak with a consistent British accent throughout — do not shift to any other accent.",
        "language": "en-GB"
    }
}


def host_npc(host, done_global, task_id, ink_path):
    key = host['id'] if host['id'] in OWN_ART_HOSTS else host['sprite']
    sheet = host['id'] if host['id'] in OWN_ART_HOSTS else f"{host['sprite']}_v2"
    return {
        'id': host['id'],
        'voice': VOICES[host['id']],
        'displayName': host['displayName'],
        'npcType': 'person',
        'position': copy.deepcopy(training_room.HOST_POSITION),
        'spriteSheet': sheet,
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
    'display': 'Year-end review: spot it',
    'desc': "An awareness edition of about 10 minutes for all staff, on the defending side only. A mixed run of the year's messages across email, calls, a voicemail, a text, a sign-in prompt and a web page, from three fictional companies. Your organiser places your existing role post-check after it, which compares against your role pre-check. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
    'minutes': 10,
    'conclusion': ('Year in review done', "You've worked through the year's messages. The debrief goes through each one."),
}


def build():
    frag = json.load(open(CFG['frag']))
    sets = {s['id']: s for s in frag['triageSets']}
    EP = strip_private(copy.deepcopy(frag['awarenessEpisode']))
    ep_id = EP['id']
    mission = awareness_deploy.mission_name(ep_id)
    prefix = f'episode_{ep_id}_defend_'
    done = f'{prefix}complete'
    s = clean_set(sets, CFG['set'])
    assert s['outcome']['setGlobalPrefix'] == prefix, 'fragment prefix does not match the episode id'
    assert EP['conclusionTaskId'] == CFG['task'][0]
    globals_ = {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
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
    meta = with_title_art(meta, mission)
    meta = awareness_deploy.with_result_fields(meta, sc)
    with open(os.path.join(d, 'mission.json'), 'w') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write('\n')
    with open(os.path.join(d, 'ink', f'{ink_name}.ink'), 'w') as f:
        f.write(ink)


if __name__ == '__main__':
    main()
