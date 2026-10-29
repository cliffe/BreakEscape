// ================================================
// Awareness check, data_conduct, after (AB): Tomasz Wisniewski (person, Training Room)
// Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years (BRAND_SET.md, E11 additions). Receives the reports. Runs the before-and-after checks for the AB pair. Placeholder sprite until PixelLab.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_checks_v2_shells.py.
// ================================================

VAR triage_post_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_post_done:
        Tomasz Wisniewski: Check saved. Thank you for doing it.
    - else:
        Tomasz Wisniewski: Welcome back. Ten fresh items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.
    }
}
+ [Thanks, Tomasz.]
    Tomasz Wisniewski: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
