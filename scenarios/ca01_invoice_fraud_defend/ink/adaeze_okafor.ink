// ================================================
// Awareness E1, inbox only: Adaeze Okafor (person, Training Room)
// Brightwell's finance manager, 40s, Nigerian-British, came up through accounts
// payable. Warm and direct. One welcome line; the kiosk does the rest. Her record
// carries the mapping that completes sort_payments_inbox when the set's done
// global changes (11 S5.1), so the ink only reads that global.
// Layer 2 host line (plan 6.6): a defend-only twin has no attack half, so the line
// speaks of the incident as the firm's own case. The hub speaks first on
// kit_defend_done && not kit_ca01_host_said, branches on kit_key_caught (did the
// learner catch the bank-change email), then sets kit_ca01_host_said. Those three
// kit_ globals come from the kit data (episodes.json keyMessage, tier S).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR episode_e1_invoice_fraud_defend_defend_complete = false
VAR kit_defend_done = false
VAR kit_key_caught = false
VAR kit_ca01_host_said = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && not kit_ca01_host_said:
        { kit_key_caught:
            Adaeze Okafor: You spotted that bank-change email, so the run paid Harlow's real account, not the one the email asked for.
            Adaeze Okafor: That's the one these usually go wrong on.
        - else:
            Adaeze Okafor: That bank-change email was the one to stop.
            Adaeze Okafor: Swap an l for a 1 in the address and Harlow's payment goes to an account the sender controls, with Harlow still waiting. Easy to miss on a busy afternoon.
        }
        ~ kit_ca01_host_said = true
    - else:
        { episode_e1_invoice_fraud_defend_defend_complete:
            Adaeze Okafor: That's the inbox sorted, thank you.
            Adaeze Okafor: We got caught by one of these once, a bank-change email we took at face value, and it took an age to get the money back.
            Adaeze Okafor: So now we ring the supplier back on a number we already hold before any payee change.
        - else:
            Adaeze Okafor: Thanks for covering the payments inbox before the three o'clock run. It's open on the kiosk.
        }
    }
}
+ [Thanks, Adaeze.]
    Adaeze Okafor: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
