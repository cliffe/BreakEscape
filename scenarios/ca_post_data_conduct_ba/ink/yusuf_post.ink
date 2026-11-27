// ================================================
// Awareness check, data_conduct, after (BA): Yusuf Demir (person, Training Room)
// Carrholme Services' information security lead, 40s, British Turkish (data_conduct _brandAdditions). Runs the before-and-after checks for the BA pair; steady, practical. Placeholder sprite until PixelLab.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_checks_v2_shells.py.
// ================================================

VAR triage_post_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_post_complete:
        Yusuf Demir: Check saved. Thanks for doing it.
    - else:
        Yusuf Demir: Back again. Ten new items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.
    }
}
+ [Thanks, Yusuf.]
    Yusuf Demir: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
