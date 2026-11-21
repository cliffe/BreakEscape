VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca13_asked = false
VAR kit_ca13_send_choice = ""  // Synced scenario global
VAR kit_ca13_moved = false
VAR kit_ca13_done = false

=== start ===
{ kit_ca13_asked:
    -> ca13_send
}
{ kit_defend_done:
    { kit_ep == "ca07": -> ca07 }
    { kit_ep == "ca13": -> ca13 }
}
Graham Whitfield: Morning. Help yourself to a brew.
-> bye

=== ca07 ===
{ kit_key_caught:
    Graham Whitfield: Good ear. A voice on the phone proves nothing by itself.
- else:
    Graham Whitfield: Finance are re-checking every recent run by hand. Slow going.
}
-> bye

=== ca13 ===
{ kit_key_caught:
    Graham Whitfield: Nice. You checked it yourself instead of trusting that summary.
- else:
    Graham Whitfield: Finance are chasing a payment that shouldn't have gone. The assistant sounded so sure.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca13_send ===
{ kit_ca13_moved || (kit_ca13_send_choice == "ring" && not kit_key_caught):
    -> bye
}
{ kit_ca13_send_choice == "ring" || kit_ca13_send_choice == "send" || kit_ca13_send_choice == "silent" || kit_ca13_done:
    -> ca13
}
Graham Whitfield: Assistant says Pennine Oat Mills need our customer list for a recall. Reply's drafted. Just send it?
{ kit_ca13_send_choice == "":
    ~ kit_ca13_send_choice = "asked"
}
+ [Ring Pennine on the number we hold. The assistant can't tell who's asking.]
    ~ kit_ca13_send_choice = "ring"
    Graham Whitfield: Fair enough. I'll ring them on the number on file, and report the email to Gwen.
    #exit_conversation
    -> DONE
+ [A recall's urgent. Send it now and tell Gwen after.]
    ~ kit_ca13_send_choice = "send"
    Graham Whitfield: Right you are. Sent. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca13_send_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
