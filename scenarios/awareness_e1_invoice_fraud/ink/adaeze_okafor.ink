// ================================================
// Awareness E1, full episode: Adaeze Okafor (person, Training Room)
// Brightwell's finance manager, 40s, Nigerian-British, came up through accounts
// payable. Warm and direct. She frames the exercise; the kiosk does the rest.
// Her record carries the mappings that complete land_supplier_contact (on the
// phish-landed global) and sort_payments_inbox (on the defend set's done global,
// 11 S5.1), so the ink only reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_supplier_contact_landed = false
VAR episode_e1_invoice_fraud_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e1_invoice_fraud_defend_done:
        Adaeze Okafor: That's both sides done, thank you. The trick is the same whichever seat you're in: if an email asks you to move money or change bank details, check it on a number you already hold before you act.
    - else:
        { phish_supplier_contact_landed:
            Adaeze Okafor: Your email got through to the finance inbox. Now take the other seat at the kiosk and sort the payments inbox the way it would land in real life.
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
