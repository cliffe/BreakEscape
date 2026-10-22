// ================================================
// Awareness check, mobile, before (AB): Lerato Dlamini (person, Training Room)
// Tarrowby's health and safety adviser, 30s, South African, from Durban (BRAND_SET.md, E6 additions). Runs the depot's toolbox talks, so the before-and-after checks fall to her. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
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
        Lerato Dlamini: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Lerato Dlamini: Morning. Before the training there's a short check on the kiosk: ten texts, notices and emails from a Tarrowby work phone. Just do what you'd normally do.
    }
}
+ [Thanks.]
    Lerato Dlamini: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
