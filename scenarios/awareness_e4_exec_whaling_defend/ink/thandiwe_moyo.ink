// ================================================
// Awareness E4, defend only: Thandiwe Moyo (person, Training Room)
// Merrin & Sallow's studio manager, 30s, Zimbabwean-British (e4/defend.json _brandAdditions). Settles the learner into Tomás's seat for the episode. Impersonated on a look-alike firm domain in both check forms (row 6, C2-M6), but she hosts no check mission, so no check host is spoofed (C2-m16). Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e4_exec_whaling_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
// ================================================

VAR episode_e4_exec_whaling_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e4_exec_whaling_defend_defend_done:
        Thandiwe Moyo: That's everything cleared, thanks. When it's money and it's in a hurry, ring her on the number you already have, or ask Yasmin.
    - else:
        Thandiwe Moyo: Morning, Tomás. Catherine flies out today, and her inbox and voicemail have filled up already. Five things are waiting on the kiosk. Take them one at a time.
    }
}
+ [Thanks, Thandiwe.]
    Thandiwe Moyo: Shout if anything else comes in.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
