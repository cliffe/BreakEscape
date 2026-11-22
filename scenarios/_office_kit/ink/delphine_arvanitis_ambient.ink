VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca14_moved = false
VAR kit_ca18_moved = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca14": -> ca14 }
    { kit_ep == "ca18": -> ca18 }
}
Delphine Arvanitis: Morning. The studio's just through here.
-> bye

=== ca14 ===
{ kit_ca14_moved:
    -> bye
}
{ kit_key_caught:
    Delphine Arvanitis: Good eye. Those public posts are exactly what they build on.
- else:
    Delphine Arvanitis: Someone's set up a profile pretending to be a partner. Cheeky.
}
-> bye

=== ca18 ===
{ kit_ca18_moved && kit_key_caught:
    -> bye
}
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

=== ca14_react ===
{ kit_key_caught:
    Delphine Arvanitis: Good eye. They copy a partner's face and name off what we post, then slide in as someone we'd all trust. #delivery: poised, approving
- else:
    Delphine Arvanitis: A fake profile of someone senior is built from our own photos and posts. The less we share, the less they can copy. #delivery: polite, matter-of-fact
}
-> bye

=== ca18_react ===
{ kit_key_caught:
    Delphine Arvanitis: Nicely caught. Those "account locked" emails go out by the thousand, and the reset link is where they collect passwords. #delivery: poised, approving
- else:
    Delphine Arvanitis: An "account locked" warning goes out wide, hoping a few click through and type their password straight into the attacker's page. #delivery: polite, matter-of-fact
}
-> bye
