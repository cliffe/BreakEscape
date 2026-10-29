// ================================================
// Awareness E8, defend only: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e8_after_the_click_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e8_after_the_click_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e8_after_the_click_defend_defend_done:
        Anjali Rao: That's the inbox sorted, thanks. The one move that works for every real sign is the same: report it and leave it be.
    - else:
        Anjali Rao: You're covering a colleague's inbox this morning. They clicked a convincing email and signed in, and now someone else is using their account. Some of what's turned up is a real sign; some is ordinary. Take each one as it comes, and report or check anything that doesn't sit right.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
