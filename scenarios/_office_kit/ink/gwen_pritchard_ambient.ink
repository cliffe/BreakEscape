VAR kit_defend_done = false
VAR kit_ep = ""

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Gwen Pritchard: Morning. Grab a coffee if you need one.
-> bye

=== ca01 ===
Gwen Pritchard: Good spot on that invoice. Phone the supplier next time too.
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
