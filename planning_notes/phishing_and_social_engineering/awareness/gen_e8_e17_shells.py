#!/usr/bin/env python3
"""Build the defend-only shells for the new awareness episodes (E8, E17 and E19 now; the rest are added to
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
    'gwen': {
        'id': 'gwen_pritchard', 'displayName': 'Gwen Pritchard', 'sprite': 'female_telecom',
        'about': "Brightwell Foods' IT service desk lead, late 30s, Welsh (BRAND_SET.md, Brightwell cast). She runs the announced assistant demo and receives the reports. Placeholder sprite until the PixelLab reset.",
    },
    'anjali': {
        'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist',
        'about': "Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.",
    },
    'lorna': {
        'id': 'lorna_easton', 'displayName': 'Lorna Easton', 'sprite': 'female_office_worker',
        'about': "Merrin & Sallow's reception and facilities lead, 40s, white, north-west England (BRAND_SET.md, E12 additions). The studio kiosk host: she welcomes the learner and receives the reports. Reuses a built sprite (no influence bust needed). Placeholder sprite until the PixelLab reset.",
    },
    'nilesh': {
        'id': 'nilesh_solanki', 'displayName': 'Nilesh Solanki', 'sprite': 'male_telecom',
        'about': "Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester (BRAND_SET.md, E6 additions). The natural 'ask first' voice for acceptable use. Placeholder sprite until the PixelLab reset.",
    },
    'zainab': {
        'id': 'zainab_hussain', 'displayName': 'Zainab Hussain', 'sprite': 'female_blowse',
        'about': "Tarrowby's field service engineer, 30s, British Bangladeshi, wears a hijab; eight years working from vans, cafés and trains (BRAND_SET.md, E20 additions). The on-the-road explainer; welcomes the learner, carries the feedback and debrief, and voices Tarrowby's controls. Placeholder sprite female_blowse until the PixelLab reset.",
    },
    'tomasz': {
        'id': 'tomasz_wisniewski', 'displayName': 'Tomasz Wiśniewski', 'sprite': 'male_office_worker',
        'about': "Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years (BRAND_SET.md, Carrholme section). Precise, kind, dry; he receives the reports. Placeholder sprite until the PixelLab reset.",
    },
    # E14: copied verbatim from gen_e2_e4_shells.py HOSTS['julian'] (built E4 cast; no new host art).
    'julian': {
        'id': 'julian_sallow', 'displayName': 'Julian Sallow', 'sprite': 'male_office_worker',
        'about': "Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican heritage (e4/defend.json _brandAdditions). Hosts the E4 BA check pair, and here welcomes the learner and receives the reports. Placeholder sprite until the PixelLab reset.",
    },
    # E10: copied verbatim from gen_e3_e5_shells.py HOSTS['niamh'] (E5's host; built Quayholt cast, no new host art).
    'niamh': {
        'id': 'niamh_doherty', 'displayName': 'Niamh Doherty', 'sprite': 'female_telecom',
        'about': "Quayholt's internal communications officer, mid 20s, Northern Irish (BRAND_SET.md, E5 additions). Quick and friendly. Placeholder sprite until the PixelLab reset.",
    },
    # E18: new named Merrin & Sallow host (one new art set), from the 03_WORLD_AND_CAST.md no-clash pool.
    'ama': {
        'id': 'ama_owusu', 'displayName': 'Ama Owusu', 'sprite': 'female_scientist',
        'about': "Security lead on Merrin & Sallow's outsourced IT and security contract (Fenlow Managed IT), 40s, Black British of Ghanaian heritage (BRAND_SET.md, E18 additions). Welcomes the learner, carries the feedback and debrief, and voices the organisation's controls as the provider's. Reuses a built sprite (placeholder until the PixelLab reset).",
    },
}

# Host lines: (before, after, choice, reply). One welcome line; the kiosk does the rest.
LINES = {
    # E13: the brief's drafted lines ran over the 30-word dialoguelint cap, so they are trimmed here.
    ('e13', 'defend'): (
        "Brightwell's switched on its assistant, and the kiosk has the inbox beside it: a supplier email, a voicemail and a video call. Some are real, some aren't.",
        "That's them all handled, thanks. Whoever the voice or the face belongs to, checking another way on a number you already hold is the move that always works.",
        'Thanks, Gwen.', 'Any time.'),
    ('e12', 'defend'): (
        "You're on reception this morning. Visitors come one at a time: some are on the list, some aren't, and one or two will try it on. Take each as it comes, sign people in and escort them, and check or report anyone who pushes past a check.",
        "That's the desk cleared, thanks. The move that works for every pushy visitor is the same: check the list, escort them, and report anyone who won't be checked.",
        'Thanks, Lorna.', 'Any time.'),
    ('e8', 'defend'): (
        "You're covering a colleague's inbox. They clicked a convincing email, so someone else is using their account. Some signs are real, some are ordinary. Report anything that doesn't sit right.",
        "That's the inbox sorted, thanks. The one move that works for every real sign is the same: report it and let the team act.",
        'Thanks, Anjali.', 'Any time.'),
    # E17 and E19: the brief's drafted lines ran over the dialoguelint 30-word cap, so they are trimmed here.
    ('e17', 'defend'): (
        "Nilesh, service desk. Every rule here has a 'because'. Allowed, Not allowed, Ask first, and Ask first is never wrong. Sort the cards, then a short inbox.",
        "That's the lot, thanks. When you're not sure, ask first, the software portal usually answers the same day; and if you make a mistake, report it.",
        'Thanks, Nilesh.', 'Any time.'),
    ('e19', 'defend'): (
        "You're covering this desk inbox. Some of it is ordinary, some tries to open a door, and one colleague's screen has locked. Didn't expect it? Report it.",
        "That's the inbox sorted, thanks. If you didn't start it, deny it and report it. If a screen locks, call it in, don't pay and don't touch it.",
        'Thanks, Anjali.', 'Any time.'),
    # E11 and E15: the brief's drafted lines ran over the 30-word cap, so they are trimmed here.
    ('e11', 'defend'): (
        "You're covering the Care Laundry desk inbox. Some of it is routine, some belongs with me as DPO, some was sent to catch you out. Report anything that doesn't sit right.",
        "That's the inbox sorted, thanks. Anything about someone's personal data, a request, a breach or a complaint, comes to the DPO the same day.",
        'Thanks, Tomasz.', 'Any time.'),
    ('e15', 'defend'): (
        "Nilesh, service desk. Found sticks, 'quicker way' messages, then a board to match each shortcut to its approved swap. Ask us first, we'd rather help than clean up.",
        "That's the lot sorted, thanks. If the official way's ever slow, tell us and we'll fix it, we can't mend what we don't know about.",
        'Thanks, Nilesh.', 'Any time.'),
    # E20: the brief's drafted lines ran over the 30-word cap, so they are trimmed here.
    ('e20', 'defend'): (
        "The kiosk has the networks and pages you meet on the road. Connect, report, or ask the venue first. A page wanting your work password is a trap. Nothing's real.",
        "That's them sorted, thanks. On the venue's network with the VPN, ordinary work is fine. A Wi-Fi page wanting your work password is a fake; if unsure, use your hotspot.",
        'Thanks, Zainab.', 'Any time.'),
    ('e9', 'defend'): (
        "Your own account now: prompts coming in, and a few password choices. Deny anything you didn't start, and pick the stronger option each time. Nothing you type here is real.",
        "That's it locked down, thanks. A different password for every account, kept in a manager, and deny what you didn't start: that's the whole of it.",
        'Thanks, Nilesh.', 'Any time.'),
    ('e16', 'defend'): (
        "Anjali Rao, information security. It's a leaver's week. You're not here to catch anyone: keep your login yours, tell me what you're offered, and bring me facts, not a theory.",
        "That's them sorted, thanks. Your login is you, offers get reported, and a concern goes to the right person as facts, never a verdict on anyone.",
        'Thanks, Anjali.', 'Any time.'),
    # E14: the brief's drafted lines ran over the dialoguelint 30-word cap, so they are trimmed here.
    ('e14', 'defend'): (
        "You're on an authorised exercise. A feed and an inbox: some posts give too much away, some messages fish for how we work. Take each as it comes.",
        "That's the feed and the inbox done, thanks. The tell is always what they ask for, not how friendly they are: share nothing about our systems, and report it.",
        'Thanks, Julian.', 'Any time.'),
    # E10: the brief's drafted lines ran over the dialoguelint 30-word cap, so they are trimmed here.
    ('e10', 'defend'): (
        "The kiosk has a morning of web pages, the kind that turn up while you work. For each, decide: carry on, close and report, or go the trusted way.",
        "That's the morning sorted, thanks. The rule holds every time: no honest web page ever needs you to paste, run, install or call.",
        'Thanks, Niamh.', 'No bother.'),
    # E18: the brief's drafted lines ran over the 30-word dialoguelint cap, so they are trimmed here.
    ('e18', 'defend'): (
        "Your own seat now. After a sweep the alerts come thick and fast, some real, some fakes. Report the fakes, and never type a password to unlock or check anything.",
        "That's them sorted, thanks. A genuine alert never asks for your password; the fakes always do. Report the fakes, and change a reused password on the real site.",
        'Thanks, Ama.', 'Any time.'),
}

EPISODES = {
    'e12': {
        'frag': f'{AW}/e12/defend.json',
        'full_id': 'e12_visitor_tailgater',
        'role_word': 'general',
        'role_label': 'all staff',
        'defend_set': 'e12_reception_desk',
        'defend_host': 'lorna',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Physical security', 'Social engineering', 'Security awareness', 'Tailgating']}],
        'defend': {
            'name': 'Visitor and tailgater: the reception desk',
            'brief': "You're on an authorised exercise at Merrin & Sallow Architects, a fictional architecture practice. You're covering the reception desk, and visitors arrive one at a time: some are expected, some are not, and one or two are trying to talk their way in. Handle each one, and check or report anyone who pushes past a check. Checking or reporting when you're unsure is always fine and never marked down.",
            'endGoal': 'Work the reception desk at the training kiosk.',
            'aim': ('reception_desk_aim', 'Cover the reception desk', 'Work through the visitors at the reception desk at the training kiosk.'),
            'task': ('work_reception_desk', 'Work through the reception desk'),
            'kiosk': ("A touch-screen kiosk showing the Merrin & Sallow reception desk: a handful of visitors to handle.",
                      "A touch-screen kiosk showing the Merrin & Sallow reception desk. The visitors are all handled."),
            'display': 'Awareness E12: Visitor and tailgater (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Cover the reception desk at Merrin & Sallow Architects, a fictional architecture practice: some visitors are expected, some are not, and one or two are trying to talk their way in. Each answer is explained, and checking or reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Work through the visitors at the reception desk and decide what to do with each one. A genuine visitor never minds being signed in and escorted; the one who pushes to skip a check is the one to report. There's no clock on you here.",
            'conclusion': ('Reception desk handled', "You've handled the visitors at the reception desk and finished this episode."),
        },
    },
    'e13': {
        'frag': f'{AW}/e13/defend.json',
        'full_id': 'e13_ai_assistant',
        'role_word': 'general',
        'role_label': 'all staff',
        'defend_set': 'e13_assistant_inbox',
        'defend_host': 'gwen',
        # No 'forms'/'check_hosts': E13 feeds general_v2, built by 10's own generator, not this one.
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Deepfakes', 'Prompt injection', 'AI assistants', 'Security awareness']}],
        'defend': {
            'name': 'The AI assistant: what comes at you',
            'brief': "You're on an authorised exercise at Brightwell Foods, a fictional company, which has switched on its own approved assistant. Messages are waiting: a supplier email, a voicemail and a video call. Some are real and some were built to look right, a voice you know, a face you trust. Decide what to do with each, and check another way when a message pushes you to move money, send data or sign in. Reporting or checking when you're unsure is always fine and never marked down.",
            'endGoal': 'Handle the supplier email, the voicemail and the video call at the training kiosk.',
            'aim': ('assistant_inbox_aim', 'Handle what comes at you', 'Go through the supplier email, the voicemail and the video call at the training kiosk.'),
            'task': ('handle_assistant_inbox', 'Handle the messages'),
            'kiosk': ("A touch-screen kiosk showing Brightwell's inbox beside the approved assistant: a supplier email, a voicemail and a video call to handle.",
                      "A touch-screen kiosk showing Brightwell's inbox beside the approved assistant. The messages are all handled."),
            'display': 'Awareness E13: The AI assistant (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Handle a supplier email, a voicemail and a video call at Brightwell Foods, a fictional company, beside its approved assistant: some are real and some were built to look right. Each answer is explained, and checking another way when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the messages and decide what to do with each one. You can't reliably spot a fake voice or face, so when a message asks for money, data or a sign-in, check another way, on a number or channel you already hold. Work through them at your own pace.",
            'conclusion': ('Messages handled', "You've handled the supplier email, the voicemail and the video call and finished this episode."),
        },
    },
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
            'defendIntro': "Go through the signs in the colleague's inbox and decide what to do with each one. Some are a real sign that someone else is in the account, and some are ordinary; the one move that works for every real sign is to report it and let the team act. Take them at your own pace.",
            'conclusion': ('Signs sorted', "You've sorted the signs in the colleague's inbox and finished this episode."),
        },
    },
    'e17': {
        'frag': f'{AW}/e17/defend.json',
        'full_id': 'e17_acceptable_use',
        'defend_set': 'e17_acceptable_use_inbox',
        'defend_host': 'nilesh',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Acceptable use', 'Security policy', 'Monitoring', 'Security awareness']}],
        'defend': {
            'name': 'Acceptable use: can I?',
            'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional firm. Three answers: Allowed, Not allowed, Ask first. You'll sort a set of everyday 'can I?' moments against the firm's own rules, with the reason on screen, and handle a few messages that arrive in the inbox. When you're not sure, ask first.",
            'endGoal': 'Sort the "can I?" cards and handle the inbox at the training kiosk.',
            'aim': ('acceptable_use_aim', 'Sort the can I moments', 'Sort the "can I?" cards and handle the inbox at the training kiosk.'),
            'task': ('sort_can_i', 'Sort the can I moments'),
            'kiosk': ("A touch-screen kiosk showing the 'can I?' cards and a short inbox at Tarrowby Logistics: everyday moments to sort against the firm's rules.",
                      "A touch-screen kiosk showing the 'can I?' cards and a short inbox at Tarrowby Logistics. The cards and the inbox are all done."),
            'display': 'Awareness E17: Acceptable use',
            'desc': "An awareness episode of about 12 minutes for all staff. Sort everyday 'can I?' moments against Tarrowby Logistics' own rules, a fictional haulier, and handle a short inbox. Each answer has its reason on screen, Ask first is never the wrong answer, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 12,
            'defendIntro': "Sort the everyday 'can I?' moments into Allowed, Not allowed or Ask first, with the reason on screen, then handle the short inbox. When you're not sure, Ask first, it's never the wrong answer. There's no clock on you here.",
            'conclusion': ('Acceptable use done', "You've sorted the 'can I?' moments and handled the inbox, and finished this episode."),
        },
    },
    'e19': {
        'frag': f'{AW}/e19/defend.json',
        'full_id': 'e19_malware_and_updates',
        'defend_set': 'e19_lock_the_doors',
        'defend_host': 'anjali',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Malware', 'Ransomware', 'Software updates', 'Security awareness', 'Incident reporting']}],
        'defend': {
            'name': 'Malware and updates: the desk inbox',
            'brief': "You're on an authorised exercise at Quayholt Insurance, a fictional company. You're covering a desk inbox this afternoon. Some of what turns up is ordinary, some is a program or a page trying to get you to open a door, and one is a colleague whose screen has just locked. Sort it, and report or check anything that doesn't sit right. Reporting when you're unsure is always fine and never marked down. No real malware runs here.",
            'endGoal': 'Sort the desk inbox at the training kiosk.',
            'aim': ('lock_the_doors_aim', 'Sort the desk inbox', 'Sort the items waiting at the desk at the training kiosk.'),
            'task': ('lock_the_doors', 'Sort the desk inbox'),
            'kiosk': ("A touch-screen kiosk showing a Quayholt desk inbox: a handful of items to sort, some of them trying to open a door.",
                      "A touch-screen kiosk showing a Quayholt desk inbox. The items are all sorted."),
            'display': 'Awareness E19: Malware, ransomware and updates (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Cover a desk inbox at Quayholt Insurance, a fictional company: a document that wants you to switch something on, an app that wants to read your mail, a warning from the security software, a colleague whose screen has locked, and the genuine ones mixed in. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real malware runs.",
            'minutes': 8,
            'defendIntro': "Take the desk inbox one item at a time and decide what to do with each. A program, a file or an app that wants to run or wants your access can do whatever you can do, so if you didn't expect it, don't open the door: report it. If a screen has locked, get it to the security team straight away. There's no clock on you here.",
            'conclusion': ('Desk inbox sorted', "You've sorted the desk inbox and finished this episode."),
        },
    },
    'e20': {
        'frag': f'{AW}/e20/defend.json',
        'full_id': 'e20_remote_and_mobile_working',
        'defend_set': 'e20_on_the_road_inbox',
        'defend_host': 'zainab',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Remote working', 'Mobile devices', 'Public Wi-Fi', 'Shoulder surfing', 'Security awareness']}],
        'defend': {
            'name': 'On the road: tell the safe networks and pages from the fakes',
            'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional company. You're working away from the depot and the public networks and sign-in pages keep coming up: the café's Wi-Fi and a look-alike, a page that wants your work password, a notice about a lost device. Some are safe and some are built to catch you. Handle each one, and never type your work password into a Wi-Fi page. No real network is joined and no real password is typed here.",
            'endGoal': 'Sort the networks and pages at the training kiosk.',
            'aim': ('tell_them_apart_aim', 'Tell the safe networks and pages from the fakes', 'Work through the public networks and sign-in pages at the training kiosk.'),
            'task': ('tell_them_apart', 'Sort the networks and pages'),
            'kiosk': ("A touch-screen kiosk showing the public networks and sign-in pages you meet on the road: some safe, some look-alikes to catch you.",
                      "A touch-screen kiosk showing the public networks and sign-in pages. They are all sorted."),
            'display': 'Awareness E20: Remote and mobile working (defend only)',
            'desc': "An awareness episode of about 8 minutes for staff who work away from the office, on the sorting side only. Working away from Tarrowby Logistics, a fictional haulier: the café's real Wi-Fi and a look-alike, a page that wants your work password, a genuine lost-device notice and a fake one. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real network is joined and no real password is typed.",
            'minutes': 8,
            'defendIntro': "Go through the public networks and sign-in pages and decide what to do with each one. On the venue's own network, with the VPN, ordinary work is fine; a page that wants your work password, or a network named to look like the venue's, is the trap. Ask the venue for the network's name if you're unsure, and there's no clock on you here.",
            'conclusion': ('Networks and pages sorted', "You've sorted the safe networks and pages from the look-alikes and finished this episode."),
        },
    },
    'e11': {
        'frag': f'{AW}/e11/defend.json',
        'full_id': 'e11_misdirected_data',
        'defend_set': 'e11_carrholme_desk',
        'defend_host': 'tomasz',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Data protection', 'Information handling', 'Incident reporting', 'Security awareness']}],
        'defend': {
            'name': 'Misdirected data: the Care Laundry desk inbox',
            'brief': "You're on an authorised exercise at Carrholme Services, a fictional firm. You are covering the Care Laundry desk this morning. Items are waiting in the inbox: some are routine, some are requests or complaints that belong with someone else, and one or two were made to trick you. Sort them, and check or report anything that doesn't sit right. Reporting or checking when you are unsure is always fine and never marked down, though a real one does take a colleague's time to check.",
            'endGoal': 'Sort the Care Laundry desk inbox at the training kiosk.',
            'aim': ('desk_inbox_aim', 'Clear the Care Laundry desk inbox', 'Sort the items waiting at the Care Laundry desk at the training kiosk.'),
            'task': ('sort_desk_inbox', 'Sort the Care Laundry desk inbox'),
            'kiosk': ("A touch-screen kiosk showing the Care Laundry desk inbox at Carrholme Services: a handful of items to sort.",
                      "A touch-screen kiosk showing the Care Laundry desk inbox at Carrholme Services. The items are all sorted."),
            'display': 'Awareness E11: Misdirected data (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Cover the Care Laundry desk inbox at Carrholme Services, a fictional support-services firm: some items are routine, some are requests or complaints that belong with the DPO, and one or two were made to trick you. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Take the Care Laundry desk inbox one item at a time and decide what to do with each. Anything about someone's personal data, a request to see, correct or delete it, or a breach, goes to the DPO the same day; report or check anything that doesn't sit right. There's no clock on you here.",
            'conclusion': ('Desk inbox sorted', "You've sorted the Care Laundry desk inbox and finished this episode."),
        },
    },
    'e15': {
        'frag': f'{AW}/e15/defend.json',
        'full_id': 'e15_shadow_it',
        'defend_set': 'e15_shortcuts_inbox',
        'defend_host': 'nilesh',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Removable media', 'Cloud storage', 'Shadow IT', 'Security awareness']}],
        'defend': {
            'name': 'Shadow IT: the shortcuts',
            'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional firm. A pack is due by Monday and the share is slow. Found sticks and 'quicker way' messages are waiting: some are safe, some aren't. Sort them, and match each shortcut to the approved way. Reporting or checking when you're unsure is always fine and never marked down.",
            'endGoal': 'Sort the inbox and match the swaps at the training kiosk.',
            'aim': ('shortcuts_aim', 'Sort the shortcuts', 'Go through the found sticks and shortcut messages and match each to the approved way at the training kiosk.'),
            'task': ('sort_shortcuts', 'Sort the shortcuts'),
            'kiosk': ("A touch-screen kiosk showing a Tarrowby desktop: found sticks, shortcut messages and the approved swaps to match.",
                      "A touch-screen kiosk showing a Tarrowby desktop. The sticks and messages are sorted and the swaps are matched."),
            'display': 'Awareness E15: Shadow IT (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Sort found sticks and shortcut messages at Tarrowby Logistics, a fictional haulier, and match each shortcut to its approved way. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Now go through the found sticks and 'quicker way' messages and decide what to do with each. A found or posted stick goes to IT unplugged; if the official way is slow, ask IT rather than build a way round it. There's no clock on you here.",
            'conclusion': ('Shortcuts sorted', "You've sorted the inbox and matched the approved swaps, and finished this episode."),
        },
    },
    'e9': {
        'frag': f'{AW}/e9/defend.json',
        'full_id': 'e9_passwords',
        'defend_set': 'e9_lock_it_down',
        'defend_host': 'nilesh',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Passwords', 'Passphrases', 'Multi-factor authentication', 'Security awareness', 'Usable security']}],
        'defend': {
            'name': 'Passwords and sign-in: lock the account down',
            'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional company. Someone has a password of yours, from a breach of a site you forgot you used, and your phone is buzzing with prompts. Lock the account down: handle the prompts, choose stronger passwords, and don't hand anything to a message dressed up as IT. No real password is ever typed here.",
            'endGoal': 'Lock the account down at the training kiosk.',
            'aim': ('lock_down_aim', 'Lock your account down', 'Work through the sign-in prompts and password choices at the training kiosk.'),
            'task': ('lock_the_account', 'Lock your account down'),
            'kiosk': ("A touch-screen kiosk set up as your Tarrowby account under attack: sign-in prompts to handle and password choices to make.",
                      "A touch-screen kiosk set up as your Tarrowby account. The prompts are handled and the account is locked down."),
            'display': 'Awareness E9: Passwords and password managers (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Your own account at Tarrowby Logistics, a fictional haulier, is under attack: sign-in prompts you didn't start, a message dressed up as IT, and password choices to make. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real password is ever typed.",
            'minutes': 8,
            'defendIntro': "Go through the sign-in prompts and password choices and decide what to do with each one. If you didn't start a prompt, deny it and report it. Pick the stronger option each time. There's no clock on you, and no real password is typed here.",
            'conclusion': ('Account locked down', "You've handled the prompts and chosen the stronger options, and finished this episode."),
        },
    },
    'e16': {
        'frag': f'{AW}/e16/defend.json',
        'full_id': 'e16_insider_risk',
        'defend_set': 'e16_leaver_week_inbox',
        'defend_host': 'anjali',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Insider risk', 'Incident reporting', 'Access control', 'Security awareness']}],
        'defend': {
            'name': "Insider risk: a leaver's week",
            'brief': "You're on an authorised exercise at Quayholt Insurance, a fictional firm, during a leaver's last week. Messages are waiting: an offer, a request to borrow a login, some sign-in prompts, a favour. Sort them, and learn to raise a concern as facts, not a verdict on anyone. Reporting or checking when you're unsure is always fine and never marked down. You are not being asked to investigate anyone.",
            'endGoal': 'Sort the messages and raise a concern fairly at the training kiosk.',
            'aim': ('leaver_week_aim', 'Handle the leaver week', 'Go through the messages and the raise-a-concern step at the training kiosk.'),
            'task': ('handle_leaver_week', 'Handle the messages'),
            'kiosk': ("A touch-screen kiosk showing a short set of messages from a leaver's last week at Quayholt, and a fair way to raise a concern.",
                      "A touch-screen kiosk showing a short set of messages from a leaver's last week at Quayholt. The messages are sorted and the concern step is done."),
            'display': 'Awareness E16: Insider risk (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Sort a short set of messages from a leaver's last week at Quayholt Insurance, a fictional insurer, and learn to raise a concern as facts, not a verdict. Each answer is explained, reporting when you're unsure is always fine and never marked down, and you are never asked to investigate anyone.",
            'minutes': 8,
            'defendIntro': "Go through the messages and decide what to do with each one, then raise a concern as facts, not a verdict on anyone. Keep your login to yourself, report what gets offered to you, and deny any sign-in prompt you didn't start. There's no clock on you here, and you are not being asked to investigate anyone.",
            'conclusion': ('Leaver week handled', "You've sorted the messages and raised a concern fairly, and finished this episode."),
        },
    },
    'e14': {
        'frag': f'{AW}/e14/defend.json',
        'full_id': 'e14_social_media',
        'defend_set': 'e14_social_dms',
        'defend_host': 'julian',
        # E14: the sortDrill (Post or Not?) and privacyPanel come from e14/full_only.json via
        # defend_half_keys, so the defend-only shell carries both (section 13). The privacyPanel's
        # closesFacts name se_intel_df_* facts; a defend-only shell has no attack/OSINT, so
        # social.intelFacts would be absent and awareness.rb privacy_panel_checks would reject every
        # closesFacts id as undeclared. Smallest fix: carry the five facts (text + reduceNote only,
        # the two keys privacy-model.js reads) here and inject them into the defend-only social below;
        # no provides/subject/source, so board.rb needs nothing more and nothing else references them.
        'defend_intel_facts': {
            'df_profile': {
                'text': "Dani Fenwick is a junior architect at Merrin & Sallow, on the studio team, and his manager is the studio manager, Thandiwe Moyo.",
                'reduceNote': "Lock your profile down: an attacker reads your employer, team and manager straight off a public profile.",
            },
            'df_system': {
                'text': "A job advert Dani reposted names the practice's new finance system by name.",
                'reduceNote': "Don't name internal systems, security tools or suppliers; a hiring post can give one away.",
            },
            'df_badge': {
                'text': "Dani's 'new kit' photo shows a lanyard and a whiteboard in shot, confirming the system and his level of access.",
                'reduceNote': "No badge, pass or screen in a photo; check what's behind you before you post.",
            },
            'df_leave': {
                'text': "Dani's leave countdown says he is away all next week.",
                'reduceNote': "Keep leave private: 'away all week' tells an attacker when to strike and who's covering.",
            },
            'df_pet': {
                'text': "Dani's dog photo, captioned as a 'name a pet' answer, gives his dog's name, a common security-question answer.",
                'reduceNote': "Keep pet, school, birthday and first car out of public view; use a made-up security answer kept in your manager.",
            },
        },
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Social media', 'Open source intelligence', 'Oversharing', 'Security awareness']}],
        'defend': {
            'name': 'Social media: the feed and the inbox',
            'brief': "You're on an authorised exercise at Merrin & Sallow Architects, a fictional practice. A feed and an inbox are waiting: some posts are fine, some give too much away, and some messages were made to pull work details out of you. Sort them, close the gaps, and report the fakes. Reporting or checking when you're unsure is always fine and never marked down.",
            'endGoal': 'Sort the feed and the inbox at the training kiosk.',
            'aim': ('social_inbox_aim', 'Sort the feed and inbox', 'Go through the messages, the feed drill and your own settings at the training kiosk.'),
            'task': ('sort_social_inbox', 'Sort the feed and inbox'),
            'kiosk': ("A touch-screen kiosk showing a feed and an inbox at Merrin & Sallow: posts to weigh, messages to sort and settings to tighten.",
                      "A touch-screen kiosk showing a feed and an inbox at Merrin & Sallow. The feed, the inbox and the settings are all done."),
            'display': 'Awareness E14: Social media and oversharing (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Sort a feed and an inbox at Merrin & Sallow Architects, a fictional practice: some posts give too much away, and some messages were built to pull work details out of you. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the inbox and decide what to do with each message, mark the feed drafts Post, Tweak or Hold, and tighten your own settings. A friendly opener that steers to your firm's systems or who runs IT is still reconnaissance; report it. There's no clock on you here.",
            'conclusion': ('Feed and inbox done', "You've sorted the feed and the inbox and tightened the settings, and finished this episode."),
        },
    },
    'e10': {
        'frag': f'{AW}/e10/defend.json',
        'full_id': 'e10_downloads_and_fake_checks',
        'defend_set': 'e10_browser_morning',
        'defend_host': 'niamh',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Phishing', 'Safe web', 'Malware', 'Security awareness', 'Usable security']}],
        'defend': {
            'name': 'Downloads and fake checks: a morning of web pages',
            'brief': "You're on an authorised exercise at Quayholt Insurance, a fictional company. You've a morning of ordinary work to get through, and the web keeps getting in the way: downloads, 'verify you are human' boxes, pop-ups that want you to call. For each page, decide whether to carry on, close and report, or go the trusted way. Nothing here touches a real site or runs on your computer.",
            'endGoal': "Sort the morning's web pages at the training kiosk.",
            'aim': ('browser_morning_aim', "Work through the morning's web pages", 'Work through the browser screens at the training kiosk.'),
            'task': ('work_browser_morning', 'Work through the web pages'),
            'kiosk': ("A touch-screen kiosk showing a morning of Quayholt browser screens to sort.",
                      "A touch-screen kiosk showing a morning of Quayholt browser screens. They are all sorted."),
            'display': 'Awareness E10: Downloads and fake checks (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. A morning of web pages at Quayholt Insurance, a fictional company: fake checks, fake updates, fake alarms, extension prompts and dangerous downloads, with the genuine ones mixed in. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
            'minutes': 8,
            'defendIntro': "Go through the morning's web pages and decide what to do with each one: carry on, close and report, or go the trusted way. The rule holds as you go: no honest web page ever needs you to paste, run, install or call. Take them at your own pace.",
            'conclusion': ('Web pages sorted', "You've sorted the morning's web pages and finished this episode."),
        },
    },
    'e18': {
        'frag': f'{AW}/e18/defend.json',
        'full_id': 'e18_credential_attacks_at_scale',
        'defend_set': 'e18_atscale_inbox',
        'defend_host': 'ama',
        'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
                   'keywords': ['Passwords', 'Credential stuffing', 'Password spraying', 'Security awareness', 'Multi-factor authentication']}],
        'defend': {
            'name': 'Credential alerts: tell the real from the fake',
            'brief': "You're on an authorised exercise at Merrin & Sallow Architects, a fictional company. A campaign has swept the practice, and the alerts are arriving: your account locked, a new sign-in, a breach warning. Some are genuine and some are fakes built to catch you. Handle each one, and never type a password to 'check' or 'unlock' anything. No real password is ever typed here.",
            'endGoal': 'Handle the security alerts at the training kiosk.',
            'aim': ('tell_them_apart_aim', 'Tell the real alerts from the fakes', 'Work through the security alerts at the training kiosk.'),
            'task': ('handle_the_alerts', 'Handle the security alerts'),
            'kiosk': ("A touch-screen kiosk showing the alerts after a credential sweep of the practice: some genuine, some fakes to catch you.",
                      "A touch-screen kiosk showing the alerts after a credential sweep. They are all handled."),
            'display': 'Awareness E18: Credential stuffing and password spraying (defend only)',
            'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. A campaign has swept Merrin & Sallow Architects, a fictional practice, and the alerts are arriving: a lockout, a sign-in alert, a breach warning, some genuine and some fakes. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real password is ever typed.",
            'minutes': 8,
            'defendIntro': "Go through the security alerts and decide what to do with each one. Genuine notices never need you to type a password to unlock or check anything; the ones that do are fakes. Report the fakes, act on the real ones the safe way, and there's no clock on you here.",
            'conclusion': ('Alerts handled', "You've sorted the genuine alerts from the fakes and finished this episode."),
        },
    },
}


def load(ekey):
    frag = json.load(open(EPISODES[ekey]['frag']))
    return {s['id']: s for s in frag['triageSets']}, frag['awarenessEpisode']


DEFEND_HALF_KEYS = ('sortDrill', 'concernForm', 'privacyPanel')


def defend_half_keys(cfg, ep=None):
    """Defend-half keys come from full_only.json; a key that is not there is taken from the shared
    fragment's awarenessEpisode (`ep`), as E15's sortDrill is (it lives in defend.json)."""
    path = cfg.get('full_only') or os.path.join(os.path.dirname(cfg['frag']), 'full_only.json')
    fo = json.load(open(path)) if os.path.exists(path) else {}
    out = {k: strip_private(copy.deepcopy(fo[k])) for k in DEFEND_HALF_KEYS if k in fo}
    for k in DEFEND_HALF_KEYS:
        if k not in out and isinstance(ep, dict) and k in ep:
            out[k] = strip_private(copy.deepcopy(ep[k]))
    return out


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
    # Defend-half episode keys run inside the defend stage, so a defend-only shell carries them too.
    # They are read from the episode's full_only.json (or an explicit EPISODES 'full_only' path), never
    # from defend.json. mistake, flip, flipMontageByChoice, flipAftermath, guess and world stay out.
    ep.update(defend_half_keys(cfg, EP))
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
    social = {'triageSets': [s], 'awarenessEpisode': ep}
    # E14 only: the defend-only shell keeps the privacyPanel (a defend-half key), whose closesFacts
    # name se_intel_df_* facts. With no attack half there is no social.intelFacts, so declare the
    # named facts here (text + reduceNote only) for the panel to render and the validator to accept.
    # Each declared fact's se_intel_<id> global must also be declared (facts are synced to ink); the
    # panel reads them read-only and in a defend-only shell they stay false (no board was collected).
    if cfg.get('defend_intel_facts'):
        social['intelFacts'] = copy.deepcopy(cfg['defend_intel_facts'])
        for _fid in cfg['defend_intel_facts']:
            globals_[f'se_intel_{_fid}'] = False
    sc = scenario(mission, d['name'], d['brief'], d['endGoal'], d['aim'], d['task'], done, globals_,
                       social, host, ink_name, d['kiosk'], d['conclusion'])
    meta = meta_for(d['display'], d['desc'], d['minutes'], cfg['cybok'])
    ink = ink_source(f"Awareness {ekey.upper()}, defend only", host, done, LINES[(ekey, 'defend')])
    return mission, sc, meta, ink_name, ink


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: gen_e8_e17_shells.py [--repo <checkout>] <out_dir>')
    out = sys.argv[1]
    built = [defend_only(k) for k in ('e8', 'e11', 'e15', 'e17', 'e19', 'e9', 'e16', 'e20', 'e14', 'e13', 'e12', 'e10', 'e18')]
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
