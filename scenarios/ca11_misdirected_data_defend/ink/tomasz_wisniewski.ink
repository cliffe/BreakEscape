// ================================================
// Awareness E11, defend only: Tomasz Wiśniewski (person, Training Room)
// Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years (BRAND_SET.md, Carrholme section). Precise, kind, dry; he receives the reports. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e11_misdirected_data_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e11_misdirected_data_defend_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e11_misdirected_data_defend_defend_complete:
        Tomasz Wiśniewski: That's the inbox sorted, thanks. Anything about someone's personal data, a request, a breach or a complaint, comes to the DPO the same day.
    - else:
        Tomasz Wiśniewski: You're covering the Care Laundry desk inbox. Some is routine, some needs the data protection lead, and some was sent to catch you out. Report anything that looks wrong.
    }
}
+ [Thanks, Tomasz.]
    Tomasz Wiśniewski: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
