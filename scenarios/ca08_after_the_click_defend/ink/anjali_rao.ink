// ================================================
// Awareness E8, defend only: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e8_after_the_click_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e8_after_the_click_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e8_after_the_click_defend_defend_complete:
        { kit_key_caught:
            Anjali Rao: You reported that sign-in prompt fast, so we isolated the account before it could send messages, reset passwords or reach the shared drive.
            Anjali Rao: A trusted internal account is worth more to them than any outside one. Speed is what closes the gap.
        - else:
            Anjali Rao: That sign-in prompt from a PC abroad, the one you hadn't started, was the one to report at once.
            Anjali Rao: Unreported, the account stays open to them. They could send messages in Ayaan's name, lock him out and reach the shared drive.
        }
    - else:
        Anjali Rao: You're covering Ayaan's inbox at the training kiosk. He clicked a convincing email, so someone else is in his account. Some signs are real, some ordinary. Report anything odd.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
