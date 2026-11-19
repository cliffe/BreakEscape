VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Gwen Pritchard: Hello, love. Grab a coffee if you need one.
-> bye

=== ca01 ===
{ kit_key_caught:
    Gwen Pritchard: Good spot on that bank-details email. That one would've sailed straight through.
- else:
    Gwen Pritchard: Heard you've been through the inbox. Some real traps in there lately.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
