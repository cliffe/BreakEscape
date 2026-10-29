// ================================================
// Awareness E17, defend only: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester (BRAND_SET.md, E6 additions). The natural 'ask first' voice for acceptable use. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e17_acceptable_use_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e17_acceptable_use_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e17_acceptable_use_defend_defend_done:
        Nilesh Solanki: That's the lot, thanks. When you're not sure, ask first, the software portal usually answers the same day; and if you make a mistake, report it.
    - else:
        Nilesh Solanki: Nilesh, service desk. Every rule here has a 'because'. Allowed, Not allowed, Ask first, and Ask first is never wrong. Sort the cards, then a short inbox.
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
