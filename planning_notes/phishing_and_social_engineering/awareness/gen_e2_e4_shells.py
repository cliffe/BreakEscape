#!/usr/bin/env python3
"""Wave 4: build the E2 (HR and recruitment) and E4 (executive PA) defend-only shells and their
pre and post check missions (AB and BA), from the wave 4 defend fragments e2/defend.json and
e4/defend.json.

Adapted from gen_e3_e5_shells.py (P7-Y1). Differences from that script:
  - every aim carries a `conclusionScreen` of type `success` (the training ending, as the
    E1 shells have since 55bfc0f7);
  - `se_awareness_records` is declared as `[]`, the shape the measurement store writes (P7-X2);
  - the company line in the check briefs comes from the episode, not a fixed Quayholt string;
  - the defend-only shell carries the debrief panels: E2's macro concept panel (the fragment's
    top-level `_conceptPanel`) as `strings.conceptPanel`, and E4's copied-voice panel
    (`awarenessEpisode._voicePanel`) as `strings.voicePanel`.

Usage: gen_e2_e4_shells.py [out_dir]   (default: the repo's scenarios/)
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import training_room  # noqa: E402

REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'
AW = f'{REPO}/planning_notes/phishing_and_social_engineering/awareness'
GENERATOR = 'planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py'

PLAYER = {
    'id': 'player',
    'displayName': 'Learner',
    'spriteSheet': 'female_office_worker_v2',
    'spriteTalk': 'assets/characters/female_office_worker_talk.png',
    'spriteConfig': {'idleFrameRate': 6, 'walkFrameRate': 12},
}

# Hosts: Tarrowby Logistics and Merrin & Sallow people from BRAND_SET.md section 3 and the
# fragments' _brandAdditions. None of them sends or is impersonated in the set their own mission
# shows, except where noted. Sprite keys are existing placeholders (no image generation) until P7-Z3.
HOSTS = {
    'fatima': {
        'id': 'fatima_begum', 'displayName': 'Fatima Begum', 'sprite': 'female_blowse',
        'about': "Tarrowby's recruitment lead and owner of the recruitment inbox, 30s, British Bangladeshi (BRAND_SET.md). In interviews all morning, so the learner covers her inbox. Placeholder sprite until P7-Z3.",
    },
    'jun': {
        'id': 'jun_watanabe', 'displayName': 'Jun Watanabe', 'sprite': 'male_office_worker',
        'about': "Tarrowby's HR assistant, early 20s, Japanese-British, in his first job (BRAND_SET.md). Hosts the HR check for his team. Placeholder sprite until P7-Z3.",
    },
    'ibrahim': {
        'id': 'ibrahim_diallo', 'displayName': 'Ibrahim Diallo', 'sprite': 'male_nerd',
        'about': "Tarrowby's IT support lead, 40s, French-Senegalese, in Leeds fifteen years (e2/defend.json _brandAdditions). Hosts the HR check. Placeholder sprite until P7-Z3.",
    },
    'thandiwe': {
        'id': 'thandiwe_moyo', 'displayName': 'Thandiwe Moyo', 'sprite': 'female_scientist',
        'about': "Merrin & Sallow's studio manager, 30s, Zimbabwean-British (e4/defend.json _brandAdditions). Settles the learner into Tomás's seat for the episode. Impersonated on a look-alike firm domain in both check forms (row 6, C2-M6), but she hosts no check mission, so no check host is spoofed (C2-m16). Placeholder sprite until P7-Z3.",
    },
    'yasmin': {
        'id': 'yasmin_chaudhry', 'displayName': 'Yasmin Chaudhry', 'sprite': 'female_blowse',
        'about': "Merrin & Sallow's finance controller, 40s, British Pakistani (BRAND_SET.md). Hosts the AB check pair; she is the person a PA should ring about money. No longer impersonated in either check form (C2-m16). Placeholder sprite until P7-Z3.",
    },
    'julian': {
        'id': 'julian_sallow', 'displayName': 'Julian Sallow', 'sprite': 'male_office_worker',
        'about': "Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican heritage (e4/defend.json _brandAdditions). Hosts the BA check pair, and is no longer impersonated in either check form (C2-m16). Placeholder sprite until P7-Z3.",
    },
}

# Host lines: (before, after, choice, reply). One welcome line; the kiosk does the rest.
LINES = {
    ('e2', 'defend'): (
        "Thanks for covering the recruitment inbox while I'm in interviews. Six messages are waiting on the kiosk. Treat them the way you would on a normal day.",
        "That's the inbox sorted, thanks. A real CV opens fine in the viewer, so anything that asks for more than that gets a second look from me.",
        'Thanks, Fatima.', 'Any time.'),
    ('e4', 'defend'): (
        "Morning, Tomás. Catherine flies out today, and her inbox and voicemail have filled up already. Five things are waiting on the kiosk. Take them one at a time.",
        "That's everything cleared, thanks. When it's money and it's in a hurry, ring her on the number you already have, or ask Yasmin.",
        'Thanks, Thandiwe.', 'Shout if anything else comes in.'),
    ('e2', 'pre'): (
        "Hi. Before the training there's a short check on the kiosk: ten emails from the recruitment inbox. Just do what you'd normally do with them.",
        "That's your first check saved. You'll do another after the training, and see how the two compare.",
        'Thanks.', 'No problem.'),
    ('e2', 'post'): (
        "Welcome back. Ten new emails on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "That's the second check saved. Thanks for doing both.",
        'Thanks.', 'No problem.'),
    ('e4', 'pre'): (
        "Hello. Before the training there's a short check on the kiosk: ten emails and voicemails of the kind a PA gets. Just do what you'd normally do.",
        "That's your first check saved. You'll do another after the training, and see how the two compare.",
        'Thanks.', "You're welcome."),
    ('e4', 'post'): (
        "Welcome back. Ten new emails and voicemails on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.",
        "That's the second check saved. Thanks for doing both.",
        'Thanks.', "You're welcome."),
}

# C2-m18: the check hosts had identical pre and post lines per episode. Give each host
# (jun, ibrahim, yasmin, julian) their own wording so the ten check hosts don't read as
# one template. Keyed by (host_key, stage); each is (before, after, choice, reply).
CHECK_LINES = {
    ('jun', 'pre'): (
        "Morning. Before the training there's a quick check on the kiosk, ten emails off the recruitment inbox. Treat them the way you would any morning.",
        "Brilliant, that's your first one saved. There's a second after the training, and you'll see how the two line up.",
        'Thanks, Jun.', 'No bother.'),
    ('jun', 'post'): (
        "You're back. Ten fresh ones on the kiosk, same drill. If you did the first check, the end screen puts the two side by side.",
        "That's the pair of them in. Thanks for sitting both.",
        'Thanks, Jun.', 'No bother.'),
    ('ibrahim', 'pre'): (
        "Hello. There's a short check on the kiosk before the training: ten emails of the sort that land in recruitment. Just handle them as you normally would.",
        "Good, your first check is logged. You'll do the matching one after the training and see the two compared.",
        'Thanks, Ibrahim.', 'Any time.'),
    ('ibrahim', 'post'): (
        "Welcome back. Ten new ones on the kiosk, same as before. Did the first check? The end screen shows how they compare.",
        "That's both logged. Thanks for doing the pair.",
        'Thanks, Ibrahim.', 'Any time.'),
    ('yasmin', 'pre'): (
        "Hello. Before the training there's a short check on the kiosk: ten emails and voicemails of the kind a PA gets. Do what you'd normally do with them.",
        "That's your first check saved. You'll take the second after the training, and the two get compared.",
        'Thanks, Yasmin.', "You're welcome."),
    ('yasmin', 'post'): (
        "Welcome back. Ten new emails and voicemails on the kiosk, same idea. If you took the first check, the end screen compares them.",
        "That's the second one in. Thank you for taking both.",
        'Thanks, Yasmin.', "You're welcome."),
    ('julian', 'pre'): (
        "Good of you to sit this. There's a short check on the kiosk first: ten emails and voicemails a PA might get. Deal with them as you would.",
        "That's your first check recorded. There's a second after the training, and you'll see how the two stand together.",
        'Thanks, Julian.', 'Not at all.'),
    ('julian', 'post'): (
        "Back with us. Ten more on the kiosk, the same sort as before. If you did the first, the end screen sets them side by side.",
        "Both done. We're grateful you sat the pair.",
        'Thanks, Julian.', 'Not at all.'),
}

CHECK_ENDINGS = {
    'pre': {'type': 'success', 'title': 'First check done',
            'body': 'Your result is saved, ready for the second check to compare with.'},
    'post': {'type': 'success', 'title': 'Second check done',
             'body': 'Thank you for taking both checks.'},
}

EPISODES = {
    'e2': {
        'frag': f'{AW}/e2/defend.json',
        'full_id': 'e2_cv_lures',
        'role_word': 'hr',
        'display_word': 'HR',
        'role_label': 'HR and recruitment staff',
        'company_line': 'Tarrowby Logistics, a fictional company',
        'defend_set': 'e2_recruitment_inbox',
        'forms': ('hr_form_a', 'hr_form_b'),
        'defend_host': 'fatima',
        'check_hosts': {'ab': 'jun', 'ba': 'ibrahim'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Phishing', 'Malicious documents', 'Security awareness', 'Usable security']}],
        'defend': {
            'name': 'CV lures: the recruitment inbox',
            'brief': "Awareness episode E2, inbox only. You're covering the recruitment inbox at Tarrowby Logistics, a fictional haulier, and six messages are waiting, applications and CVs among them. Some are real and some were built to trick you: sort them, and report anything that doesn't sit right.",
            'endGoal': 'Sort the six messages at the training kiosk.',
            'aim': ('recruitment_inbox_aim', 'Cover the recruitment inbox', 'Sort the recruitment inbox at the training kiosk.'),
            'task': ('sort_recruitment_inbox', 'Sort the recruitment inbox'),
            'kiosk': ('A touch-screen kiosk showing the Tarrowby recruitment inbox. Six messages are waiting.',
             'A touch-screen kiosk showing the Tarrowby recruitment inbox. All six messages are sorted.'),
            'display': 'Awareness E2: CV lures (inbox only)',
            'desc': "An eight-minute awareness episode for HR and recruitment staff, on the inbox side only. Cover the recruitment inbox at Tarrowby Logistics, a fictional company: six messages, applications and CVs among them, some real and some built to trick you. Each answer is explained, and reporting a real message never costs you anything.",
            'minutes': 8,
            'ending': {'type': 'success', 'title': 'Recruitment inbox done',
                       'body': "You've sorted all six messages and finished this episode."},
        },
        'check': {
            'items_pre': 'Ten emails from the Tarrowby recruitment inbox: applications, CVs and messages from colleagues and agencies.',
            'items_post': 'Ten new emails from the Tarrowby recruitment inbox, the same kinds as before.',
            'scope': 'Authorised exercise at Tarrowby Logistics, a fictional company. In scope: ten emails from the Tarrowby recruitment inbox.',
            'kiosk': 'A touch-screen kiosk with ten emails from the recruitment inbox, ready for the {nth} check.',
            'aim_desc': 'Sort ten emails at the training kiosk.',
            'end': 'Sort the ten emails at the training kiosk.',
            'name': 'Recruitment inbox check',
            'minutes': 4,
        },
    },
    'e4': {
        'frag': f'{AW}/e4/defend.json',
        'full_id': 'e4_exec_whaling',
        'role_word': 'executive',
        'display_word': 'executive PA',
        'role_label': 'executive assistants and PAs',
        'company_line': 'Merrin & Sallow Architects, a fictional practice',
        'defend_set': 'e4_pa_inbox',
        'forms': ('executive_form_a', 'executive_form_b'),
        'defend_host': 'thandiwe',
        'check_hosts': {'ab': 'yasmin', 'ba': 'julian'},
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Whaling', 'Vishing', 'Voice cloning', 'Security awareness']}],
        'defend': {
            'name': "Executive whaling: the PA's inbox",
            'brief': "Awareness episode E4, inbox only. You're Tomás Carvalho, PA to the managing partner of Merrin & Sallow Architects, a fictional practice, and she's travelling today. Five emails and voicemails are waiting. Some are real and some were made to trick you, one of them in a voice that sounds like hers.",
            'endGoal': 'Work through the five emails and voicemails at the training kiosk.',
            'aim': ('pa_inbox_aim', "Cover the PA's inbox", "Work through the PA's emails and voicemails at the training kiosk."),
            'task': ('sort_pa_inbox', "Sort the PA's inbox"),
            'kiosk': ("A touch-screen kiosk showing Tomás Carvalho's inbox. Five emails and voicemails are waiting.",
             "A touch-screen kiosk showing Tomás Carvalho's inbox. The emails and voicemails are all dealt with."),
            'display': 'Awareness E4: Executive whaling (inbox only)',
            'desc': "An eight-minute awareness episode for executive assistants and PAs, on the inbox side only. Sit in the PA's seat at Merrin & Sallow Architects, a fictional practice, while the managing partner travels: five emails and voicemails, some real and some made to trick you, one in a copied voice. Each answer is explained, and checking or reporting a real message never costs you anything.",
            'minutes': 8,
            'ending': {'type': 'success', 'title': 'PA inbox done',
                       'body': "You've worked through all five messages and finished this episode."},
        },
        'check': {
            'items_pre': "Ten emails and voicemails from a managing partner's PA inbox.",
            'items_post': "Ten new emails and voicemails from a PA's inbox, the same kinds as before.",
            'scope': "Authorised exercise at Merrin & Sallow Architects, a fictional practice. In scope: ten emails and voicemails in a PA's inbox.",
            'kiosk': "A touch-screen kiosk with ten emails and voicemails from a PA's inbox, ready for the {nth} check.",
            'aim_desc': 'Work through ten items at the training kiosk.',
            'end': 'Work through the ten items at the training kiosk.',
            'name': 'PA inbox check',
            'minutes': 5,
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
    return {s['id']: s for s in frag['triageSets']}, frag['awarenessEpisode'], frag


def panels(ekey, frag, EP):
    """The debrief panels the fragment drafted, as strings keys."""
    out = {}
    if ekey == 'e2' and isinstance(frag.get('_conceptPanel'), dict):
        text = frag['_conceptPanel']['text']
        lead = "Why 'enable content' matters. "
        if text.startswith(lead):     # the draft's first sentence is its heading
            out['conceptPanel'] = {'heading': lead.strip().rstrip('.'), 'text': text[len(lead):]}
        else:
            out['conceptPanel'] = {'text': text}
    if ekey == 'e4' and isinstance(EP.get('_voicePanel'), dict):
        out['voicePanel'] = strip_private(EP['_voicePanel'])
    return out


# B1 (CHECK_PARITY_AUDIT): explicit, stable reorder of each form's canonical `messages`
# (new[i] = old[order[i]]), so forms A and B no longer share one per-slot pattern. Verified
# (seed 20261022): phish in different ordinal slots across A/B, no phish flag-signature at the same
# slot. Scoring is per item, so a pure reorder changes no counts.
PERMUTE = {
    'hr_form_a': [5, 8, 7, 0, 2, 6, 4, 3, 9, 1],
    'hr_form_b': [2, 4, 5, 7, 0, 8, 3, 1, 6, 9],
    'executive_form_a': [3, 7, 6, 8, 4, 2, 9, 5, 1, 0],
    'executive_form_b': [9, 8, 2, 0, 5, 7, 4, 3, 6, 1],
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


def scenario(mission, name, brief, end_goal, aim, task, done, ending, globals_, social, host,
             ink_name, kiosk_obs, extra=None):
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
// Written by {GENERATOR}.
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


def round_globals(ep_id, prefix, done):
    return {
        f'episode_{ep_id}_state': {},
        'se_awareness_records': [],
        f'{prefix}percent': 0,
        f'{prefix}reportRate': 0,
        done: False,
        f'{prefix}pass': False,
    }


def defend_only(ekey):
    cfg = EPISODES[ekey]
    d = cfg['defend']
    sets, EP, frag = load(ekey)
    ep_id = f"{cfg['full_id']}_defend"
    mission = f'awareness_{ep_id}'
    prefix = f'episode_{ep_id}_defend_'          # doubled `_defend_defend_`, as defendPrefix() gives
    done = f'{prefix}done'
    s = clean_set(sets, cfg['defend_set'])
    s['outcome']['setGlobalPrefix'] = prefix
    strings = copy.deepcopy(EP['strings'])
    strings['brief'] = EP['_defendOnly']['brief']
    # m27: a defend-only shell never shows the flip, so drop the flip-only strings
    # (a later author could otherwise wire them up). Keep brief, noBlameLine, mondayCard,
    # defendOnly, defendIntro and the debrief panels.
    for k in ('flipHeading', 'flipIntro', 'flipDefenderLine', 'flipNoSend',
              'flipMissed', 'flipPageIntro', 'flipCallIntro'):
        strings.pop(k, None)
    strings.update(panels(ekey, frag, EP))
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
        'debrief': copy.deepcopy(EP['debrief']),
    }
    host = HOSTS[cfg['defend_host']]
    ink_name = host['id']
    sc = scenario(mission, d['name'], d['brief'], d['endGoal'], d['aim'], d['task'], done, d['ending'],
                  round_globals(ep_id, prefix, done),
                  {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, d['kiosk'])
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
    sets, EP, _frag = load(ekey)
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
    company = cfg['company_line']
    if stage == 'pre':
        name = f"{c['name']}: before ({letters})"
        brief = (f"The first of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_pre']} Decide what to do with each one. Your result is saved so the second check can compare with it.")
        aim = ('first_check_aim', 'Do the first check', c['aim_desc'])
        task = ('finish_check', 'Finish the first check')
        display = f"Awareness check: {cfg['display_word']}, before ({letters})"
        desc = (f"A short check for {cfg['role_label']} at {company}, taken before the awareness episodes (pair {letters}). "
                f"{c['items_pre']} The result is kept so the matching after-check (awareness_post_{word}_{pair}) "
                "can show how the two compare.")
        obs = c['kiosk'].format(nth='first')
    else:
        name = f"{c['name']}: after ({letters})"
        brief = (f"The second of two short checks for {cfg['role_label']} at {company}. "
                 f"{c['items_post']} If you took the first check, the end screen shows how the two compare.")
        aim = ('second_check_aim', 'Do the second check', c['aim_desc'])
        task = ('finish_check', 'Finish the second check')
        display = f"Awareness check: {cfg['display_word']}, after ({letters})"
        desc = (f"A short check for {cfg['role_label']} at {company}, taken after the awareness episodes (pair {letters}). "
                f"{c['items_post']} It is matched to the first check (awareness_pre_{word}_{pair}), and the end screen "
                "compares the two results when the first check was finished.")
        obs = c['kiosk'].format(nth='second')
    ink_name = f"{host['id'].split('_')[0]}_{stage}"
    sc = scenario(mission, name, brief, c['end'], aim, task, done, CHECK_ENDINGS[stage],
                  round_globals(ep_id, prefix, done),
                  {'triageSets': [s], 'awarenessEpisode': ep}, host, ink_name, obs, extra)
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
    ink = ink_source(header, host, done, CHECK_LINES[(cfg['check_hosts'][pair], stage)])
    return mission, sc, meta, ink_name, ink


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else REPO + '/scenarios'
    built = []
    for ekey in ('e2', 'e4'):
        built.append(defend_only(ekey))
        built += [check(ekey, p, st) for p in ('ab', 'ba') for st in ('pre', 'post')]
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
