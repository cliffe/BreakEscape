// ================================================
// Awareness E1, full episode: Adaeze Okafor (person, Training Room)
// Brightwell's finance manager, 40s, Nigerian-British, came up through accounts
// payable. Warm and direct. She frames the exercise; the kiosk does the rest.
// Her record carries the mappings that complete land_supplier_contact (on the
// phish-attempt global, value > 0) and sort_payments_inbox (on the defend set's
// done global, 11 S5.1), so the ink reads the attempt count and the done global
// only for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_supplier_contact_attempts = 0
VAR episode_e1_invoice_fraud_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e1_invoice_fraud_defend_done:
        Adaeze Okafor: You've worked it from both ends now.
        Adaeze Okafor: Whoever asks you to move money or change bank details, ring them back on a number you already hold first. That habit is what I'd want from my team.
    - else:
        { phish_supplier_contact_attempts > 0:
            Adaeze Okafor: Your message has gone. Now take the other seat at the kiosk and read the payments inbox the way it would land on a busy afternoon.
        - else:
            Adaeze Okafor: Welcome to the Brightwell exercise. Start at the kiosk: research us and our supplier, write one email as the red team, then swap seats and cover the payments inbox.
        }
    }
}
+ [Thanks, Adaeze.]
    Adaeze Okafor: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
