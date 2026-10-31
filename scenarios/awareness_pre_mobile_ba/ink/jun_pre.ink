// ================================================
// Awareness check, mobile, before (BA): Jun Watanabe (person, Training Room)
// Tarrowby's HR assistant, early 20s, Japanese-British, first job (BRAND_SET.md, Tarrowby cast). Runs the before-and-after checks for HR. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
// ================================================

VAR triage_pre_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_pre_complete:
        Jun Watanabe: Lovely, first check saved. There's a matching one after the training, and you'll see how the two stack up.
    - else:
        Jun Watanabe: Hiya. There's a short check on the kiosk before we start: ten texts, notices and emails from a work phone. Just go with what you'd normally do.
    }
}
+ [Thanks.]
    Jun Watanabe: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
