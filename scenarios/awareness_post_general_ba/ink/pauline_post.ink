// ================================================
// Awareness check, general, after (BA): Pauline Hendry (person, Training Room)
// Quayholt's payroll officer, 60s, Jamaican-British, thirty years at Quayholt (BRAND_SET.md, E5 additions). Hosting the check for her floor. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
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
        Pauline Hendry: That's the second check saved. Thanks for doing both.
    - else:
        Pauline Hendry: Welcome back. Ten new emails and pages on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.
    }
}
+ [Thanks.]
    Pauline Hendry: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
