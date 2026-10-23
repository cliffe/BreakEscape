// ================================================
// Awareness E6, defend only: Chidi Okeke (person, Training Room)
// Tarrowby's fleet coordinator at the Shipley depot, 40s, Nigerian-British (BRAND_SET.md, E6 additions). Easy-going, knows every driver. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e6_texts_and_qr_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
// ================================================

VAR episode_e6_texts_and_qr_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e6_texts_and_qr_defend_defend_done:
        Chidi Okeke: That's the phone cleared. If a text or a notice wants a code scanned or a short link tapped, open the app yourself instead.
    - else:
        Chidi Okeke: Grab a seat, you're on your break. The kiosk's set up like a work phone, with texts, a couple of notices from the yard and an email. No rush.
    }
}
+ [Thanks, Chidi.]
    Chidi Okeke: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
