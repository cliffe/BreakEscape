#!/usr/bin/env python3
"""P7-J: build the five E1 shells (defend-only + four check missions) from P7-E's fragment."""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import training_room  # noqa: E402
import awareness_deploy  # noqa: E402

REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'
FRAG = json.load(open(f'{REPO}/planning_notes/phishing_and_social_engineering/awareness/e1/defend.json'))
SETS = {s['id']: s for s in FRAG['triageSets']}
EP = FRAG['awarenessEpisode']

HOSTS = {
    'adaeze': {
        'id': 'adaeze_okafor', 'displayName': 'Adaeze Okafor',
        'sprite': 'female_blowse',
        'about': "Brightwell's finance manager, 40s, Nigerian-British, came up through accounts payable (BRAND_SET.md). Placeholder sprite until P7-Z3.",
    },
    'graham': {
        'id': 'graham_whitfield', 'displayName': 'Graham Whitfield',
        'sprite': 'male_office_worker',
        'about': "Brightwell's finance training lead, early 60s, white, from Halifax; unhurried and kind. New for P7-J (not yet in BRAND_SET.md). Placeholder sprite until P7-Z3.",
    },
    'joanne': {
        'id': 'joanne_pell', 'displayName': 'Joanne Pell',
        'sprite': 'female_scientist',
        'about': "Brightwell's learning and development coordinator, late 40s, white British, from Leicester; brisk and friendly. Renamed from Farah Qureshi on 2026-10-27 (name clash with m10). Placeholder sprite until P7-Z3.",
    },
}

PLAYER = {
    'id': 'player',
    'displayName': 'Learner',
    'spriteSheet': 'female_office_worker_v2',
    'spriteTalk': 'assets/characters/female_office_worker_talk.png',
    'spriteConfig': {'idleFrameRate': 6, 'walkFrameRate': 12},
}

CYBOK = [{'ka': 'HF', 'topic': 'Human Factors',
          'keywords': ['Phishing', 'Security awareness', 'Invoice fraud', 'Usable security']}]


def strip_private(obj):
    return {k: v for k, v in obj.items() if not k.startswith('_')}


# B1 / N7 (CHECK_PARITY_AUDIT, playtest P2): break the fixed per-slot pattern between forms A and B.
# Each list is an explicit, stable reorder of the fragment's canonical `messages` order
# (new[i] = old[order[i]]). The permutations are chosen so the phish land in DISJOINT ordinal slots
# across A and B: no slot is a phish in both forms of a pair (the earlier reorder left one shared phish
# slot per role — playtest N7). A learner who takes one form cannot answer the other from slot position
# or flag shape. Scoring is per item, so a pure reorder changes no counts, no flag multiset.
PERMUTE = {
    'finance_form_a': [3, 6, 1, 5, 4, 2, 0, 8, 7, 9],
    'finance_form_b': [9, 2, 7, 1, 6, 8, 5, 0, 4, 3],
}


def clean_set(set_id, stage=None, comparison=None):
    s = strip_private(copy.deepcopy(SETS[set_id]))
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


def brand_block():
    return {k: copy.deepcopy(EP[k]) for k in ('role', 'company', 'brand')}


def defend_only():
    mission = 'awareness_e1_invoice_fraud_defend'
    ep_id = 'e1_invoice_fraud_defend'
    prefix = f'episode_{ep_id}_defend_'
    done = f'{prefix}done'
    s = clean_set('e1_payments_inbox')
    # C2-m23: the defend-only shell has no write/flip stage, so it never replays a
    # player-sent message; drop the authored sender profile the full set carries.
    s.pop('playerSentAuth', None)
    s['outcome']['setGlobalPrefix'] = prefix
    strings = copy.deepcopy(EP['strings'])
    strings['brief'] = EP['_defendOnly']['brief']
    # m27: the defend-only runner never shows the flip, so drop its dead strings.
    for k in ('flipHeading', 'flipIntro', 'flipDefenderLine', 'flipNoSend',
              'flipMissed', 'flipPageIntro', 'flipCallIntro'):
        strings.pop(k, None)
    ep = {
        'id': ep_id, **brand_block(),
        'variant': 'defendOnly',
        'durationTargetMin': 8,
        'scopeNote': EP['_defendOnly']['scopeNote'],
        'stages': ['brief', 'defend', 'debrief'],
        'conclusionTaskId': 'sort_payments_inbox',
        'defend': {'setId': 'e1_payments_inbox', 'stage': None, 'reportAlwaysVisible': True},
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
    sc = scenario(
        mission, 'Invoice fraud: the payments inbox',
        "Awareness episode E1, inbox only. You're covering the payments inbox at Brightwell Foods, a fictional food manufacturer, before the afternoon payment run. Six messages are waiting: sort them, and report or check anything that doesn't sit right.",
        'Sort the six messages in the payments inbox at the training kiosk.',
        ('payments_inbox_aim', 'Cover the payments inbox', 'Sort the payments inbox at the training kiosk.'),
        ('sort_payments_inbox', 'Sort the payments inbox'),
        done, globals_, {'triageSets': [s], 'awarenessEpisode': ep},
        HOSTS['adaeze'], 'adaeze_okafor',
        ("A touch-screen kiosk showing Brightwell's payments inbox. Six messages are waiting.",
             "A touch-screen kiosk showing Brightwell's payments inbox. All six messages are sorted."),
        success_screen('Payments inbox done', "You've sorted all six messages and finished this episode."))
    meta = {
        'display_name': 'Awareness E1: Invoice fraud (inbox only)',
        'description': "An awareness episode of about 8 minutes for finance staff, on the inbox side only. Cover the payments inbox at Brightwell Foods, a fictional company, before the afternoon payment run: six messages, some real and some built to trick you. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
        'difficulty_level': 1,
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': 8,
        'cybok': CYBOK,
    }
    return mission, sc, meta


def check(pair, stage):
    mission = f'awareness_{stage}_finance_{pair}'
    ep_id = f'{stage}_finance_{pair}'
    form = {('ab', 'pre'): 'finance_form_a', ('ab', 'post'): 'finance_form_b',
            ('ba', 'pre'): 'finance_form_b', ('ba', 'post'): 'finance_form_a'}[(pair, stage)]
    comparison = {'requireGlobal': 'pre_check_completed'} if stage == 'post' else None
    s = clean_set(form, stage=stage, comparison=comparison)
    prefix = f'triage_{stage}_'
    done = f'{prefix}done'
    ep = {
        'id': ep_id, **brand_block(),
        'variant': 'full',
        'durationTargetMin': 9,
        'scopeNote': 'Authorised exercise at Brightwell Foods, a fictional company. In scope: ten messages from the Brightwell payments inbox.',
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
    pre_mission = f'awareness_pre_finance_{pair}'
    if stage == 'pre':
        extra['exportGlobals'] = ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_done']
    else:
        # Imported names are not redeclared (the validator rejects the collision).
        extra['importGlobals'] = [
            {'from': pre_mission, 'var': 'triage_pre_percent', 'as': 'triage_pre_percent', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_reportRate', 'as': 'triage_pre_reportRate', 'default': 0},
            {'from': pre_mission, 'var': 'triage_pre_done', 'as': 'triage_pre_done', 'default': False},
            {'from': pre_mission, 'completed': 'pre_check_completed'},
        ]
    host = HOSTS['graham' if pair == 'ab' else 'joanne']
    letters = pair.upper()
    first, second = (letters[0], letters[1])
    if stage == 'pre':
        name = f'Payments inbox check: before ({letters})'
        brief = ("The first of two short checks for finance staff at Brightwell Foods, a fictional company. "
                 "Ten messages from a payments inbox: decide what to do with each one. Your result is saved so the second check can compare with it.")
        aim = ('first_check_aim', 'Do the first check', 'Sort ten messages at the training kiosk.')
        task = ('finish_check', 'Finish the first check')
        display = f'Awareness check: finance, before ({letters})'
        desc = (f"A check of about 8 to 10 minutes for finance staff, taken before the awareness episodes (pair {letters}). "
                "Ten messages from the payments inbox of Brightwell Foods, a fictional company. The result is kept so the "
                f"matching after-check (awareness_post_finance_{pair}) can show how the two compare.")
        obs = 'A touch-screen kiosk with ten messages from a payments inbox, ready for the first check.'
        ending = success_screen('First check done', 'Your result is saved, ready for the second check to compare with.')
    else:
        name = f'Payments inbox check: after ({letters})'
        brief = ("The second of two short checks for finance staff at Brightwell Foods, a fictional company. "
                 "Ten new messages from a payments inbox. If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', 'Sort ten messages at the training kiosk.')
        task = ('finish_check', 'Finish the second check')
        display = f'Awareness check: finance, after ({letters})'
        desc = (f"A check of about 8 to 10 minutes for finance staff, taken after the awareness episodes (pair {letters}). "
                "Ten new messages from the payments inbox of Brightwell Foods, a fictional company, matched to the "
                f"first check (awareness_pre_finance_{pair}). The end screen compares the two results when the first check was finished.")
        obs = 'A touch-screen kiosk with ten messages from a payments inbox, ready for the second check.'
        ending = success_screen('Second check done', 'Thanks for taking the time with it. If you also sat the earlier check, the results are shown side by side.')
    desc += (" Organiser note: each role's check tests the channel that role meets in its "
             "episode, and in a session that runs more than one episode only the learner's "
             "primary-role check is recorded.")
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, 'Sort the ten messages at the training kiosk.', aim, task, done,
                  globals_, {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, ending, extra)
    meta = {
        'display_name': display,
        'description': desc,
        'difficulty_level': 1,
        'scoring': 'completion',
        'secgen_scenario': None,
        'collection': 'training',
        'ui_theme': 'general',
        'estimated_duration_minutes': 9,
        'cybok': CYBOK,
    }
    return mission, sc, meta


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else REPO + '/scenarios'
    built = [defend_only()] + [check(p, st) for p in ('ab', 'ba') for st in ('pre', 'post')]
    for mission, sc, meta in built:
        d = os.path.join(out, mission)
        os.makedirs(os.path.join(d, 'ink'), exist_ok=True)
        with open(os.path.join(d, 'scenario.json.erb'), 'w') as f:
            json.dump(sc, f, indent=2, ensure_ascii=False)
            f.write('\n')
        with open(os.path.join(d, 'mission.json'), 'w') as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print('wrote', d)


if __name__ == '__main__':
    main()
