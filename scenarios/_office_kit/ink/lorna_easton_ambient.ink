VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca04": -> ca04 }
    { kit_ep == "ca14": -> ca14 }
    { kit_ep == "ca18": -> ca18 }
}
Lorna Easton: Hiya. Grab five on the sofa if you need it.
-> bye

=== ca04 ===
{ kit_key_caught:
    Lorna Easton: Nice one. When it's urgent and hush-hush, that's the tell.
- else:
    Lorna Easton: The partner came back knowing nothing about any payment. Awful moment.
}
-> bye

=== ca14 ===
{ kit_key_caught:
    Lorna Easton: Good shout. A new account with a familiar name is worth a second look.
- else:
    Lorna Easton: Turns out there's a fake account in a partner's name. Everyone's comparing notes.
}
-> bye

=== ca18 ===
{ kit_key_caught:
    Lorna Easton: Smart. A lockout warning is no reason to type your password anywhere.
- else:
    Lorna Easton: The provider's resetting logins after sign-ins from somewhere odd. Big clean-up.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
