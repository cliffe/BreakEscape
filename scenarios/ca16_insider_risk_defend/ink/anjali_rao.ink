// ================================================
// Awareness E16, defend only: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e16_insider_risk_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e16_insider_risk_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e16_insider_risk_defend_defend_complete:
        { kit_key_caught:
            Anjali Rao: You kept your sign-in to yourself and sent him to the service desk, so none of his actions landed under your name.
            Anjali Rao: Lending a login feels kind, but it leaves you answerable for whatever is done with it.
        - else:
            Anjali Rao: That ask to borrow your sign-in, from a colleague locked out and under pressure, was the one to turn down.
            Anjali Rao: Ten minutes on your login would sit in the audit under your name, and he might reach data he has no business in.
        }
    - else:
        Anjali Rao: Anjali Rao, information security. Insider risk is harm from people who already have access. Mostly it's an accident, now and then it's on purpose.
        Anjali Rao: You're not here to catch anyone. Start at the kiosk. Raise a concern as facts, then sort the messages. Tell me what you're offered.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
