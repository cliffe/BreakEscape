VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca13_moved = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
    { kit_ep == "ca13": -> ca13 }
}
Agnieszka Duda: Hiya. The water cooler's over there if you need it.
-> bye

=== ca13 ===
{ kit_ca13_moved && kit_key_caught:
    -> bye
}
{ kit_key_caught:
    Agnieszka Duda: Well spotted. That assistant will summarise anything, even a trap.
- else:
    Agnieszka Duda: A customer rang asking why we'd been in touch. Nobody here had.
}
-> bye

// ca01 is kept the last episode knot before bye so the QS stub test reads only its branch lines.
=== ca01 ===
{ kit_key_caught:
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
