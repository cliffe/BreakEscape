// ================================================
// Awareness E1, inbox only: Adaeze Okafor (person, Training Room)
// Brightwell's finance manager, 40s, Nigerian-British, came up through accounts
// payable. Warm and direct. One welcome line; the kiosk does the rest. Her record
// carries the mapping that completes sort_payments_inbox when the set's done
// global changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR episode_e1_invoice_fraud_defend_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e1_invoice_fraud_defend_defend_complete:
        Adaeze Okafor: That's the inbox sorted, thank you. If anything still bothers you, ring the sender on a number we already hold.
    - else:
        Adaeze Okafor: Thanks for covering the payments inbox before the three o'clock run. It's open on the kiosk.
    }
}
+ [Thanks, Adaeze.]
    Adaeze Okafor: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
