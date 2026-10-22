// ================================================
// Awareness check, general, before (AB): Owen Treharne (person, Training Room)
// Quayholt's facilities manager, 50s, Welsh, from the Rhondda (BRAND_SET.md, E5 additions). Hosting the check for his floor. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
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
        Owen Treharne: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Owen Treharne: Morning. Before the training there's a short check on the kiosk: ten emails and pages from a Quayholt inbox. Just do what you'd normally do.
    }
}
+ [Thanks.]
    Owen Treharne: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
