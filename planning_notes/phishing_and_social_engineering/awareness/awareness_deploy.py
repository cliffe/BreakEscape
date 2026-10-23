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
    "When a message pressures you to move money, grant access or read back a code, stop and check "
    "it using contact details you already have, rather than the ones the message gives you. Taking "
    "a minute to confirm is always a fair thing to do."
)


AWARENESS_RULE_OF_THUMB_HEADING = 'The habit to keep'


def awareness_block():
    """The social.awareness block every shell carries."""
    return {'ruleOfThumb': {'heading': AWARENESS_RULE_OF_THUMB_HEADING, 'text': AWARENESS_RULE_OF_THUMB_TEXT}}
