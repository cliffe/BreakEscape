// ================================================
// Awareness check, general_v2, before (BA): Darren Price (person, Training Room)
// Quayholt's service desk team lead and owner of the verification script, 40s, white, from Bristol (BRAND_SET.md). Steady, a bit dry. Placeholder sprite until PixelLab.
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
        Darren Price: First check's saved. You'll do another afterwards and we'll see how the two compare.
    - else:
        Darren Price: Darren here, I run the service desk. Quick check on the kiosk before the training: ten items from a Quayholt inbox. Just do what you'd normally do.
    }
}
+ [Thanks, Darren.]
    Darren Price: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
