VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca11": -> ca11 }
}
Yusuf Demir: Morning. I'm Yusuf, I keep an eye on security here. Grab a water if you need one.
-> bye

=== ca11 ===
{ kit_key_caught:
    Yusuf Demir: Good catch on that export bound for the wrong inbox. A checked recipient keeps residents' details inside the building.
- else:
    Yusuf Demir: Handovers go out fast when it's busy. One wrong recipient and resident details land where they shouldn't.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
