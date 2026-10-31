// ================================================
// Awareness check, general, before (BA): Pauline Hendry (person, Training Room)
// Quayholt's payroll officer, 60s, Jamaican-British, thirty years at Quayholt (BRAND_SET.md, E5 additions). Hosting the check for her floor. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
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
        Pauline Hendry: First check saved. There's another after the training, and you'll see how they compare.
    - else:
        Pauline Hendry: I'm Pauline from Payroll, looking after this check. There's a short one on the kiosk first: ten emails and pages from a Quayholt inbox. Just do what you'd normally do.
    }
}
+ [Thanks, Pauline.]
    Pauline Hendry: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
