VAR kit_defend_done = false
VAR kit_ep = ""

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Agnieszka: Hiya. The water cooler's over there if you need it.
-> bye

=== ca01 ===
Agnieszka: Nice work flagging that one. Reporting it helps the whole floor.
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
