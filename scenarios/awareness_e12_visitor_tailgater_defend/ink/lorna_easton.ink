// ================================================
// Awareness E12, defend only: Lorna Easton (person, Training Room)
// Merrin & Sallow's reception and facilities lead, 40s, white, north-west England (BRAND_SET.md, E12 additions). The studio kiosk host: she welcomes the learner and receives the reports. Reuses a built sprite (no influence bust needed). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e12_visitor_tailgater_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e12_visitor_tailgater_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e12_visitor_tailgater_defend_defend_done:
        Lorna Easton: That's the desk cleared, thanks. The move that works for every pushy visitor is the same: check the list, escort them, and report anyone who won't be checked.
    - else:
        Lorna Easton: You're on reception this morning. Visitors come one at a time: some are on the list, some aren't, and one or two will try it on. Take each as it comes, sign people in and escort them, and check or report anyone who pushes past a check.
    }
}
+ [Thanks, Lorna.]
    Lorna Easton: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
