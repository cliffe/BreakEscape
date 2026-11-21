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
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e14_social_media_defend_defend_complete:
        { kit_key_caught:
            Julian Sallow: You checked that new contact by a known route, so the account wearing a partner's name got nothing out of the studio.
            Julian Sallow: It reads like an insider because it's built from our public posts. The name alone is never the proof.
        - else:
            Julian Sallow: That second account in a partner's name, friendly and knowing our details, was the one to doubt.
            Julian Sallow: It was trusted, so a security answer went public, and a week later we were resetting it and reporting the fake account.
        }
    - else:
        Julian Sallow: You're on an authorised exercise. Some posts in the feed give too much away, and some messages in the inbox fish for how we work.
    }
}
+ [Thanks, Julian.]
    Julian Sallow: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
