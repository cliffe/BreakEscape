// ================================================
// Awareness E10, defend only: Niamh Doherty (person, Training Room)
// Quayholt's internal communications officer, mid 20s, Northern Irish (BRAND_SET.md, E5 additions). Quick and friendly. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e10_downloads_and_fake_checks_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e10_downloads_and_fake_checks_defend_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e10_downloads_and_fake_checks_defend_defend_complete:
        Niamh Doherty: That's the morning sorted, thanks. The rule holds every time: no honest web page ever needs you to paste, run, install or call.
    - else:
        Niamh Doherty: The kiosk has a morning of web pages, the kind that turn up while you work. For each, decide: carry on, close and report, or go the trusted way.
    }
}
+ [Thanks, Niamh.]
    Niamh Doherty: No bother.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
