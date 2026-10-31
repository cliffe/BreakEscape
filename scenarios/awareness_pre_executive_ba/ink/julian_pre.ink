// ================================================
// Awareness check, executive, before (BA): Julian Sallow (person, Training Room)
// Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican heritage (e4/defend.json _brandAdditions). Hosts the BA check pair, and is no longer impersonated in either check form (C2-m16). Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
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
        Julian Sallow: That's your first check recorded. There's a second after the training, and you'll see how the two stand together.
    - else:
        Julian Sallow: Good of you to sit this. There's a short check on the kiosk first: ten emails and voicemails a PA might get. Deal with them as you would.
    }
}
+ [Thanks, Julian.]
    Julian Sallow: Not at all.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
