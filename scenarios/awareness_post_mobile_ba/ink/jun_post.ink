// ================================================
// Awareness check, mobile, after (BA): Jun Watanabe (person, Training Room)
// Tarrowby's HR assistant, early 20s, Japanese-British, first job (BRAND_SET.md, Tarrowby cast). Runs the before-and-after checks for HR. Placeholder sprite until P7-Z3.
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
        Jun Watanabe: That's it in. Thanks for doing it; it all helps.
    - else:
        Jun Watanabe: Welcome back. Ten new items waiting on the kiosk, same as last time. If you did the first check, the end screen shows the two side by side.
    }
}
+ [Thanks.]
    Jun Watanabe: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
