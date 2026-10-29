// ================================================
// Awareness check, data_conduct, before (BA): Yusuf Demir (person, Training Room)
// Carrholme Services' information security lead, 40s, British Turkish (data_conduct _brandAdditions). Runs the before-and-after checks for the BA pair; steady, practical. Placeholder sprite until PixelLab.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_checks_v2_shells.py.
// ================================================

VAR triage_pre_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_pre_done:
        Yusuf Demir: First check's saved. You'll do another afterwards and we'll compare the two.
    - else:
        Yusuf Demir: Yusuf here, I look after information security at Carrholme. Quick check on the kiosk before the training: ten items from a Carrholme inbox. Just do what you'd normally do.
    }
}
+ [Thanks, Yusuf.]
    Yusuf Demir: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
