VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca07_moved = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
    { kit_ep == "ca07": -> ca07 }
}
Gwen Pritchard: Hello there. Grab a coffee if you need one.
-> bye

=== ca07 ===
{ kit_ca07_moved && kit_key_caught:
    -> bye
}
{ kit_key_caught:
    Gwen Pritchard: Good catch. Someone wanting it kept quiet is the real warning.
- else:
    Gwen Pritchard: Payment run's frozen while they re-check it. Nervy few hours ahead.
}
-> bye

// ca01 is kept the last episode knot before bye so the QS stub test reads only its branch lines.
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

=== ca01_react ===
{ kit_key_caught:
    Gwen Pritchard: Someone caught that bank change. They swap the details and let our own payment run pay them instead. #delivery: warm, approving
- else:
    Gwen Pritchard: A changed bank detail sails through if nobody checks. One call on the number you already hold stops it dead. #delivery: practical, matter-of-fact
}
-> bye
