// ================================================
// Awareness check, executive, before (AB): Yasmin Chaudhry (person, Training Room)
// Merrin & Sallow's finance controller, 40s, British Pakistani (BRAND_SET.md). Runs the before-and-after checks; she is the person a PA should ring about money. Her name is spoofed in form A row 6. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
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
        Yasmin Chaudhry: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Yasmin Chaudhry: Hello. Before the training there's a short check on the kiosk: ten emails and voicemails of the kind a PA gets. Just do what you'd normally do.
    }
}
+ [Thanks.]
    Yasmin Chaudhry: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
