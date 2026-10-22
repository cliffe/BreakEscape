// ================================================
// Awareness E6, full episode: Chidi Okeke (person, Training Room)
// Tarrowby's fleet coordinator at the Shipley depot, 40s, Nigerian-British
// (BRAND_SET.md, E6 additions). Easy-going, knows every driver. Placeholder
// sprite until P7-Z3. He frames the exercise; the kiosk does the rest.
// His record carries the mappings that complete land_mobile_staff (once a
// message has been sent: phish_mobile_staff_attempts > 0) and check_work_phone
// (on the defend set's done global, 11 S5.1), so the ink only reads those
// globals for its welcome line, and the middle line keys on the attempt, not
// on whether it landed (B1: scoring is defence only).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_mobile_staff_attempts = 0
VAR episode_e6_texts_and_qr_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e6_texts_and_qr_defend_done:
        Chidi Okeke: There, you've done it from both ends. On a phone it's the same move each time: if a text, a notice or an email wants a code scanned or a short link tapped, open the app yourself or ring someone on a number you already hold.
    - else:
        { phish_mobile_staff_attempts > 0:
            Chidi Okeke: Your message has gone over to the depot. Now take the other seat at the kiosk and go through what's waiting on a Tarrowby work phone, the way it would land on your break.
        - else:
            Chidi Okeke: Welcome to the Tarrowby exercise. Start at the kiosk: look at what's public, write one message as the red team, then swap seats and go through a work phone like the one it landed on.
        }
    }
}
+ [Thanks, Chidi.]
    Chidi Okeke: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
