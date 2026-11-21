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
VAR episode_e6_texts_and_qr_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca06_host_said = false
VAR kit_ca06_out = false
VAR kit_ca06_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca06_done || not kit_ca06_out) && not kit_ca06_host_said:
        { kit_key_caught:
            { kit_caught:
                Chidi Okeke: You flagged that fake barrier code to me before anyone scanned it, so nothing of yours ever reached them.
            - else:
                Chidi Okeke: You flagged that barrier code, so it got checked before a card or a sign-in was tapped into it.
            }
            Chidi Okeke: To the people who send these, one scan is a card to drain or a sign-in to walk in behind, and you handed them neither.
        - else:
            Chidi Okeke: Trust a code like that and it can empty a colleague's card, or hand over a sign-in they spend the next day winning back.
            Chidi Okeke: To whoever sends these, one scan is a card to drain or a sign-in to walk in behind, and a text from a new number keeps the thread going.
        }
        ~ kit_ca06_host_said = true
    - else:
    { episode_e6_texts_and_qr_defend_complete:
        Chidi Okeke: There, both ends done. If a message wants a code scanned or a link tapped, open the app yourself instead.
    - else:
        { phish_mobile_staff_attempts > 0:
            Chidi Okeke: Your message has gone over to Kaylee. Now take the other seat and go through a Tarrowby work phone, the way it would land on your break.
        - else:
            Chidi Okeke: Welcome to the Tarrowby exercise. Start at the kiosk: look at what's public, write one message, then swap seats and go through the work phone it lands on.
        }
    }
    }
}
+ [Thanks, Chidi.]
    Chidi Okeke: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
