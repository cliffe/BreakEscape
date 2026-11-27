// ================================================
// Awareness E20, defend only: Zainab Hussain (person, Training Room)
// Tarrowby's field service engineer, 30s, British Bangladeshi, wears a hijab; eight years working from vans, cafés and trains (BRAND_SET.md, E20 additions). The on-the-road explainer; welcomes the learner, carries the feedback and debrief, and voices Tarrowby's controls. Placeholder sprite female_blowse until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e20_remote_and_mobile_working_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e20_remote_and_mobile_working_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e20_remote_and_mobile_working_defend_defend_complete:
        { kit_key_caught:
            Zainab Hussain: You treated that Wi-Fi sign-in page as a trap, so your work password never reached a look-alike site.
            Zainab Hussain: A Wi-Fi page has no reason to want your work password. If one asks, close it and use your hotspot.
        - else:
            Zainab Hussain: That look-alike Wi-Fi page asking for your work password was the one to stop.
            Zainab Hussain: That page only wants one thing, your work password. Whoever put it up could sign in as you from anywhere.
        }
    - else:
        Zainab Hussain: The kiosk has the networks and pages you meet on the road, all made up. Connect, report or ask the venue. A page wanting your work password is a trap.
    }
}
+ [Thanks, Zainab.]
    Zainab Hussain: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
