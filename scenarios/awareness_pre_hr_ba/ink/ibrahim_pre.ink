// ================================================
// Awareness check, hr, before (BA): Ibrahim Diallo (person, Training Room)
// Tarrowby's IT support lead, 40s, French-Senegalese, in Leeds fifteen years (e2/defend.json _brandAdditions). Hosts the HR check. Placeholder sprite until P7-Z3.
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
        Ibrahim Diallo: Good, your first check is logged. You'll do the matching one after the training and see the two compared.
    - else:
        Ibrahim Diallo: Hello. There's a short check on the kiosk before the training: ten emails of the sort that land in recruitment. Just handle them as you normally would.
    }
}
+ [Thanks, Ibrahim.]
    Ibrahim Diallo: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
