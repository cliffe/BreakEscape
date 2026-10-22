// ================================================
// Awareness check, mobile, after (AB): Lerato Dlamini (person, Training Room)
// Tarrowby's health and safety adviser, 30s, South African, from Durban (BRAND_SET.md, E6 additions). Runs the depot's toolbox talks, so the before-and-after checks fall to her. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
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
        Lerato Dlamini: That's the second check saved. Thanks for doing both.
    - else:
        Lerato Dlamini: Welcome back. Ten new items on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.
    }
}
+ [Thanks.]
    Lerato Dlamini: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
