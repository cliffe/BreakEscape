#!/usr/bin/env python3
"""Build the core_00 first-play brief shell (awareness_core_00_first_play), from
awareness/core00/defend.json, core00/ink/anjali_rao.ink and core00/WIRING_NOTES.md (WP-12 Part A).

A small sibling of gen_annual_shells.py (and gen_e8_e17_shells.py) (implementation/01_PIPELINE.md P4): the helpers are copied,
not imported, so neither generator can change the other's shells. Same safety rules:
  - the repo comes from --repo <path> or the BREAKESCAPE_REPO environment variable, falling back to
    this script's own path (right only when it is run from awareness/ in the real checkout);
  - the output folder is a required argument: there is no default into scenarios/.

The fragment holds the whole awarenessEpisode block (ENG-10 variant brief, seven briefCards, doneGlobal,
oncePerLearner). There is no triage set. The host ink is core00/ink/anjali_rao.ink, copied verbatim.

Usage: gen_core00_shell.py [--repo <checkout>] <out_dir>
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
GEN = 'planning_notes/phishing_and_social_engineering/awareness/gen_core00_shell.py'

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



HOST = {'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist'}
MISSION = 'awareness_core_00_first_play'
DONE = 'episode_core_00_first_play_done'
TASK = 'complete_brief'

META = {
    'display_name': 'Before you start: how this works',
    'description': "A short brief shown before your first episode at Quayholt Insurance, a fictional company. It covers how the course works, that nothing real is asked for, what is recorded and who sees it, the habit to keep, and how to report. There is nothing to get wrong.",
    'organiser_note': "place this as the opening mission so a learner meets it before their first episode.",
    'difficulty_level': 1,
    'scoring': 'completion',
    'secgen_scenario': None,
    'collection': 'training',
    'ui_theme': 'general',
    'estimated_duration_minutes': 5,
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Security awareness', 'Phishing', 'Reporting']}],
}


def build():
    frag = json.load(open(f'{AW}/core00/defend.json'))
    EP = strip_private(copy.deepcopy(frag['awarenessEpisode']))
    assert EP['doneGlobal'] == DONE and EP['conclusionTaskId'] == TASK
    ep_id = EP['id']
    globals_ = {
        'se_awareness_records': [],
        f'episode_{ep_id}_state': {},
        DONE: False,
    }
    sc = scenario(
        MISSION, 'Before you start: how this works',
        "You're on an authorised exercise at Quayholt Insurance, a fictional company. This is a short brief before your first episode: how the course works, what is recorded, and how to report. Nothing real is asked for and there is nothing to get wrong.",
        'Read the brief at the training kiosk.',
        ('finish_brief_aim', 'Read the brief', 'Read the brief at the kiosk.'),
        (TASK, 'Read the brief'), DONE, globals_, {'awarenessEpisode': EP}, HOST, HOST['id'],
        ('A touch-screen kiosk with a short brief for new learners, ready to read.',
         'A touch-screen kiosk. The brief has been read.'),
        ("You're set", "That's the brief. Start your first episode whenever you're ready."))
    # scenario() keys the kiosk's "done" variant on episode_<id>_defend_done; a brief has none, so use DONE.
    for o in sc['rooms']['training_room']['objects']:
        for v in o.get('observationVariants', []):
            v['condition'] = f'globalVars.{DONE}'
    ink = open(f'{AW}/core00/ink/anjali_rao.ink').read()
    return MISSION, sc, META, HOST['id'], ink


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: gen_core00_shell.py [--repo <checkout>] <out_dir>')
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
