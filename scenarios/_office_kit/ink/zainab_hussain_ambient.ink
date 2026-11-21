VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca02": -> ca02 }
    { kit_ep == "ca06": -> ca06 }
}
Zainab Hussain: Hiya. Help yourself to the drinks machine, it's just there.
-> bye

=== ca02 ===
{ kit_key_caught:
    Zainab Hussain: Nice catch on that CV. One file that wants a second click to open, and you're off the road for a week.
- else:
    Zainab Hussain: Heard HR had a scare with an application. Easy to click when the inbox is heaving.
}
-> bye

=== ca06 ===
{ kit_key_caught:
    Zainab Hussain: Nice one. Out on the road you'd scan that barrier code in a heartbeat, so glad you clocked it.
- else:
    Zainab Hussain: I'm forever scanning codes out at the depots. One day one of them won't be what it says.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
