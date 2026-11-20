VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
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

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
