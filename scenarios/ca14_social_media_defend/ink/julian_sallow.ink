// ================================================
// Awareness E14, defend only: Julian Sallow (person, Training Room)
// Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican heritage (e4/defend.json _brandAdditions). Hosts the E4 BA check pair, and here welcomes the learner and receives the reports. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e14_social_media_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e14_social_media_defend_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e14_social_media_defend_defend_complete:
        Julian Sallow: That's the feed and the inbox done, thanks. The tell is always what they ask for, not how friendly they are. Report anything that asks about our systems.
    - else:
        Julian Sallow: You're on an authorised exercise. A feed and an inbox: some posts give too much away, some messages fish for how we work. Take each as it comes.
    }
}
+ [Thanks, Julian.]
    Julian Sallow: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
