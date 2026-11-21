// ================================================
// Awareness E6, defend only: Chidi Okeke (person, Training Room)
// Tarrowby's fleet coordinator at the Shipley depot, 40s, Nigerian-British (BRAND_SET.md, E6 additions). Easy-going, knows every driver. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e6_texts_and_qr_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
// ================================================

VAR episode_e6_texts_and_qr_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e6_texts_and_qr_defend_defend_complete:
        { kit_key_caught:
            Chidi Okeke: You flagged that QR code taped to the car park barrier, so nobody's card details went to its page.
            Chidi Okeke: Anyone can tape a code to a barrier. Check with Facilities before a code gets your card details.
        - else:
            Chidi Okeke: That QR code taped to the car park barrier was the one to stop.
            Chidi Okeke: Nobody can see where a taped-up code goes before they scan it. The page behind it would take your card details and number plate.
        }
    - else:
        Chidi Okeke: Grab a seat, you're on your break. The kiosk's set up like a work phone, with texts, a couple of notices from the yard and an email. No rush.
    }
}
+ [Thanks, Chidi.]
    Chidi Okeke: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
