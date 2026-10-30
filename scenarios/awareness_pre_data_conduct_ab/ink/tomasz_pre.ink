// ================================================
// Awareness check, data_conduct, before (AB): Tomasz Wisniewski (person, Training Room)
// Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years (BRAND_SET.md, E11 additions). Receives the reports. Runs the before-and-after checks for the AB pair. Placeholder sprite until PixelLab.
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
        Tomasz Wisniewski: That's your first check saved. We'll do another after the training and see how the two compare.
    - else:
        Tomasz Wisniewski: I'm Tomasz, the data protection officer here. There's a short check on the kiosk first: ten items about data and conduct from a Carrholme inbox. Do what you'd normally do.
    }
}
+ [Thanks, Tomasz.]
    Tomasz Wisniewski: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
