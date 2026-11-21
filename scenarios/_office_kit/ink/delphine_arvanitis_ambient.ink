VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca14": -> ca14 }
    { kit_ep == "ca18": -> ca18 }
}
Delphine Arvanitis: Morning. The studio's just through here.
-> bye

=== ca14 ===
{ kit_key_caught:
    Delphine Arvanitis: Good eye. Those public posts are exactly what they build on.
- else:
    Delphine Arvanitis: Someone's set up a profile pretending to be a partner. Cheeky.
}
-> bye

=== ca18 ===
{ kit_key_caught:
    Delphine Arvanitis: Well done. A warning email is never a reason to re-enter a password.
- else:
    Delphine Arvanitis: We've all been asked to reset our logins today. Something got reused.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
