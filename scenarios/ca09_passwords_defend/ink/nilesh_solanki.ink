// ================================================
// Awareness E9, defend only: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester (BRAND_SET.md, E6 additions). The natural 'ask first' voice for acceptable use. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e9_passwords_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e9_passwords_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e9_passwords_defend_defend_complete:
        { kit_key_caught:
            Nilesh Solanki: You didn't read that code back to the text pretending to be IT, so the one-time code stayed yours and the account held.
            Nilesh Solanki: A manager and a passkey make a reused password harmless, and every sign-in belongs to one person.
        - else:
            Nilesh Solanki: That text posing as IT, asking you to read a code back, was the one to stop.
            Nilesh Solanki: The account opened on a reused password, and with shared logins the audit couldn't say who had done what.
        }
    - else:
        Nilesh Solanki: Your own account now: prompts coming in, and a few password choices. Deny anything you didn't start, and pick the stronger option each time. Nothing you type here is real.
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
