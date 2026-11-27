#!/usr/bin/env python3
"""Deployment settings shared by every awareness shell (FUN_DECISIONS aw4).

The rule of thumb (aw4) is one short line shown above the Monday card in every episode's debrief,
so a learner doing several episodes meets the same spine each time. It must be identical in all 38
awareness shells: the four shell generators read it from here, and the seven hand-authored full
episodes carry the same literal. test/js/social-awareness-rule-of-thumb.test.mjs enforces that they
all match, so if this text changes the seven full erbs have to be updated to match (and vice versa).

The engine reads it from social.awareness.ruleOfThumb ({ text } here, so the debrief's default
heading "The habit to keep" is used). See episode-model.js awarenessSettings and debrief-view.js.
"""

import re
import sys
from pathlib import Path


_REPO = None


def repo_root():
    """Repository root for a generator or the splice tool: --repo <path> (removed from sys.argv),
    else the checkout this script sits in. No environment variable: a stale BREAKESCAPE_REPO could
    point a worktree run at the main checkout. The resolved root is printed once per run."""
    global _REPO
    if _REPO is not None:
        return _REPO
    argv = sys.argv[1:]
    repo = None
    if '--repo' in argv:
        i = argv.index('--repo')
        if i + 1 >= len(argv):
            sys.exit('--repo needs a path')
        repo = argv[i + 1]
        del argv[i:i + 2]
        sys.argv[1:] = argv
    _REPO = str(Path(repo).resolve()) if repo else str(Path(__file__).resolve().parents[3])
    print(f'repo root: {_REPO}')
    return _REPO


def hand_authored_ids():
    """Shell folder names that episodes.json marks handAuthored: generators must not write them.
    Read from <repo root>/AW/office_kits/episodes.json; a missing or unreadable file stops the run."""
    import json
    path = Path(repo_root()) / 'planning_notes' / 'phishing_and_social_engineering' / 'awareness' / 'office_kits' / 'episodes.json'
    try:
        rows = json.loads(path.read_text()).get('episodes', [])
        return {r['id'] for r in rows if r.get('handAuthored')}
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as e:
        sys.exit(f'cannot read {path}: {e}')


def required_out_dir(script):
    """The output folder argument, required: there is no default into the repo's scenarios/."""
    argv = sys.argv[1:]
    if not argv or argv[0].startswith('-'):
        sys.exit(f'usage: {script} [--repo <checkout>] <out_dir>   (the output folder is required)')
    return argv[0]

AWARENESS_RULE_OF_THUMB_TEXT = (
    "When a message pressures you to move money, grant access, sign in or read back a code, "
    "stop and check it yourself through a route you already trust, not the link, number or "
    "page the message gives you. Taking a minute to confirm is always a fair thing to do."
)


AWARENESS_RULE_OF_THUMB_HEADING = 'The habit to keep'


# Scenario folder names (renamed 2026-11-01 from awareness_*): episodes are
# ca<NN>_<topic>[_defend], the checks ca_<pre|post>_<role>_<ab|ba>, the opening
# brief ca00_first_play and the annual round ca_annual_2027_defend.
def mission_name(ep_id):
    """Folder name for an episode id such as 'e8_after_the_click_defend' or 'core_17_annual_2027_defend'."""
    m = re.fullmatch(r'e(\d+)_(.+)', ep_id)
    if m:
        return f'ca{int(m.group(1)):02d}_{m.group(2)}'
    if ep_id == 'core_00_first_play':
        return 'ca00_first_play'
    if ep_id.startswith('core_17_'):
        return 'ca_' + ep_id[len('core_17_'):]
    raise ValueError(f'no folder name rule for episode id {ep_id!r}')


def awareness_block():
    """The social.awareness block every shell carries."""
    return {'ruleOfThumb': {'heading': AWARENESS_RULE_OF_THUMB_HEADING, 'text': AWARENESS_RULE_OF_THUMB_TEXT}}


def music_block():
    """The scenario-level music block every CA scenario carries (owner direction D331, 23 Nov): the
    PeaceFolk playlist (public/break_escape/js/music/music-config.js) from game load. One event, so
    the engine never falls back to the default noir playlist. The 20 hand-authored full episodes
    carry the same literal (test/js/social-awareness-music.test.mjs enforces that all of them match)."""
    return {'events': [{
        'trigger': 'game_loaded',
        'playlist': 'peacefolk',
        'fade': False,
        '_comment': 'Cyber Aware score: the PeaceFolk tracks (D331)',
    }]}


# Scheme-A catalogue titles (CyberAware form, 2026-10-31). Check listings read
# "Starting check: <group>" / "Final check: <group>"; AB/BA share a title.
CHECK_GROUPS = {
    'finance': 'Finance team', 'hr': 'HR and recruitment', 'helpdesk': 'IT help desk',
    'executive': 'Executive assistants', 'mobile': 'Staff with a work phone',
    'data_conduct': 'Data and conduct', 'general_v2': 'All staff', 'general': 'All staff (original)',
}

# The organiser-only note carried by every role check (moved out of the learner description).
CHECK_ORGANISER_NOTE = (
    "each role's check tests the channel that role meets in its episode, and in a session that runs "
    "more than one episode only the learner's primary-role check is recorded."
)


def check_title(stage, role_word):
    """Scheme-A check title: 'Starting check: <group>' (pre) or 'Final check: <group>' (post)."""
    return f"{'Starting' if stage == 'pre' else 'Final'} check: {CHECK_GROUPS[role_word]}"


# mission.json "resultGlobal" + "stage" (read by BreakEscape::Mission#result_global /
# #result_stage, checked by scripts/validate_scenario.rb check_mission_result). Every
# awareness check and episode declares exactly one numeric *_percent global that holds
# its result; the stage is read from that global's name the same way Mission#result_stage
# does (triage_pre_* -> pre, triage_post_* -> post, episode_* -> episode). core_00 has no
# result global, so it gets neither field.
def result_fields(scenario):
    """{'resultGlobal': ..., 'stage': ...} for a scenario, or {} when it has no result."""
    gv = scenario.get('globalVariables', {}) if isinstance(scenario, dict) else {}
    pcts = [k for k, v in gv.items() if k.endswith('_percent') and isinstance(v, (int, float))]
    if len(pcts) != 1:
        return {}
    name = pcts[0]
    if name.startswith('triage_pre_'):
        stage = 'pre'
    elif name.startswith('triage_post_'):
        stage = 'post'
    else:
        stage = 'episode'
    return {'resultGlobal': name, 'stage': stage}


def with_result_fields(meta, scenario):
    """Return meta with resultGlobal + stage inserted right after 'scoring' (no-op with no result)."""
    rf = result_fields(scenario)
    if not rf:
        return meta
    out = {}
    for k, v in meta.items():
        out[k] = v
        if k == 'scoring':
            out['resultGlobal'] = rf['resultGlobal']
            out['stage'] = rf['stage']
    if 'resultGlobal' not in out:  # meta had no 'scoring' key
        out.update(rf)
    return out
