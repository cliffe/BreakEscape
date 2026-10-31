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

AWARENESS_RULE_OF_THUMB_TEXT = (
    "When a message pressures you to move money, grant access, sign in or read back a code, "
    "stop and check it yourself through a route you already trust, not the link, number or "
    "page the message gives you. Taking a minute to confirm is always a fair thing to do."
)


AWARENESS_RULE_OF_THUMB_HEADING = 'The habit to keep'


def awareness_block():
    """The social.awareness block every shell carries."""
    return {'ruleOfThumb': {'heading': AWARENESS_RULE_OF_THUMB_HEADING, 'text': AWARENESS_RULE_OF_THUMB_TEXT}}


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
