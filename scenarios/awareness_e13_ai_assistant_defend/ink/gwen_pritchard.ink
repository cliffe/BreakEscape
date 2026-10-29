// ================================================
// Awareness E13, defend only: Gwen Pritchard (person, Training Room)
// Brightwell Foods' IT service desk lead, late 30s, Welsh (BRAND_SET.md, Brightwell cast). She runs the announced assistant demo and receives the reports. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e13_ai_assistant_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e13_ai_assistant_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e13_ai_assistant_defend_defend_done:
        Gwen Pritchard: That's them all handled, thanks. Whoever the voice or the face belongs to, checking another way on a number you already hold is the move that always works.
    - else:
        Gwen Pritchard: Brightwell's switched on its assistant, and the kiosk has the inbox beside it: a supplier email, a voicemail and a video call. Some are real, some aren't.
    }
}
+ [Thanks, Gwen.]
    Gwen Pritchard: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
