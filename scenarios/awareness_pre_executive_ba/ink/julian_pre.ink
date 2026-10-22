// ================================================
// Awareness check, executive, before (BA): Julian Sallow (person, Training Room)
// Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican heritage (e4/defend.json _brandAdditions). Hosts the check for the PAs. He is impersonated in form B rows 4 and 5. Placeholder sprite until P7-Z3.
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
        Julian Sallow: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Julian Sallow: Hello. Before the training there's a short check on the kiosk: ten emails and voicemails of the kind a PA gets. Just do what you'd normally do.
    }
}
+ [Thanks.]
    Julian Sallow: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
