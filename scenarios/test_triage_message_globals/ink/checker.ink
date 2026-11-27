// Test fixture for the triage option outcome.messageGlobals. The checker reports the one
// global the triage set writes for the listed phish (tmg_fraud), and the round's complete flag.

VAR tmg_complete = false
VAR tmg_fraud_caught = false

=== start ===
{tmg_complete:
    -> report
- else:
    Sort the inbox at the workstation first, then come back.
    #exit_conversation
    -> END
}

=== report ===
{tmg_fraud_caught:
    Fraud email: caught.
- else:
    Fraud email: not caught.
}
#exit_conversation
-> END
