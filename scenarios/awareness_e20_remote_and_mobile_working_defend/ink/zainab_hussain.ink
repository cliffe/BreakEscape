// ================================================
// Awareness E20, defend only: Zainab Hussain (person, Training Room)
// Tarrowby's field service engineer, 30s, British Bangladeshi, wears a hijab; eight years working from vans, cafés and trains (BRAND_SET.md, E20 additions). The on-the-road explainer; welcomes the learner, carries the feedback and debrief, and voices Tarrowby's controls. Placeholder sprite female_blowse until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e20_remote_and_mobile_working_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e20_remote_and_mobile_working_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e20_remote_and_mobile_working_defend_defend_done:
        Zainab Hussain: That's them sorted, thanks. On the venue's network with the VPN, ordinary work is fine. A Wi-Fi page wanting your work password is a fake; if unsure, use your hotspot.
    - else:
        Zainab Hussain: The kiosk has the networks and pages you meet on the road. Connect, report, or ask the venue first. A page wanting your work password is a trap. Nothing's real.
    }
}
+ [Thanks, Zainab.]
    Zainab Hussain: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
