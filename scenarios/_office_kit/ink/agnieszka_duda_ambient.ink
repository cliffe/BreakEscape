VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_fraud_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Agnieszka Duda: Hiya. The water cooler's over there if you need it.
-> bye

=== ca01 ===
{ kit_fraud_caught:
    Agnieszka Duda: Nice one, catching that. Saved the whole floor a headache.
- else:
    Agnieszka Duda: Busy one on the payments inbox today. Those bank-change emails keep coming.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
