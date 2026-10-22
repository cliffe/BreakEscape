// ================================================
// Awareness check, hr, after (BA): Ibrahim Diallo (person, Training Room)
// Tarrowby's IT support lead, 40s, French-Senegalese, in Leeds fifteen years (e2/defend.json _brandAdditions). Hosts the HR check. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
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
        Ibrahim Diallo: That's both logged. Thanks for doing the pair.
    - else:
        Ibrahim Diallo: Welcome back. Ten new ones on the kiosk, same as before. Did the first check? The end screen shows how they compare.
    }
}
+ [Thanks, Ibrahim.]
    Ibrahim Diallo: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
