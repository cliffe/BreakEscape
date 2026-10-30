// ================================================
// Awareness E16, defend only: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e16_insider_risk_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e16_insider_risk_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e16_insider_risk_defend_defend_done:
        Anjali Rao: That's them sorted, thanks. Your login is you, offers get reported, and a concern goes to the right person as facts, never a verdict on anyone.
    - else:
        Anjali Rao: Anjali Rao, information security. You're not here to catch anyone. Start at the kiosk: raise a concern as facts, then sort the messages. Tell me what you're offered.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
