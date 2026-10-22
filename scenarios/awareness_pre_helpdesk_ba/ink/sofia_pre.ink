// ================================================
// Awareness check, helpdesk, before (BA): Sofia Marchetti (person, Training Room)
// Quayholt's HR adviser, 30s, Italian-British, second generation (BRAND_SET.md, E5 additions). Runs the before-and-after checks for HR. Placeholder sprite until P7-Z3.
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
        Sofia Marchetti: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Sofia Marchetti: Hello. Before the training there's a short check on the kiosk: ten items from the service desk queue. Just do what you'd normally do on a shift.
    }
}
+ [Thanks.]
    Sofia Marchetti: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
