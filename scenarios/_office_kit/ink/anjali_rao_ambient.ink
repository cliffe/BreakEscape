VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca05_moved = false
VAR kit_ca10_moved = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca03": -> ca03 }
    { kit_ep == "ca05": -> ca05 }
    { kit_ep == "ca10": -> ca10 }
}
Anjali Rao: Hello. Grab a drink from the cooler whenever you like.
-> bye

=== ca03 ===
{ kit_key_caught:
    Anjali Rao: Well caught. They'd have kept sending those until somebody gave in.
- else:
    Anjali Rao: We've had a few callers pushing for password resets this week. Worth a second look.
}
-> bye

=== ca05 ===
{ kit_ca05_moved && kit_key_caught:
    -> bye
}
{ kit_key_caught:
    Anjali Rao: Good spot. The page was a near-perfect copy of our own sign-in.
- else:
    Anjali Rao: The alerts keep flagging lookalike sign-in pages. They're getting harder to tell apart.
}
-> bye

=== ca10 ===
{ kit_ca10_moved:
    -> bye
}
{ kit_key_caught:
    Anjali Rao: Nicely done. Those fake security checks are built to look completely routine.
- else:
    Anjali Rao: Had a device pulled for a dodgy download today. The fake check looked genuine enough.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice shows only "(End of conversation)" in person-chat (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca03_react ===
{ kit_key_caught:
    Anjali Rao: Someone clocked that late-night sign-in prompt for what it was. They've already got the password, and that tap is the only thing left in their way. #delivery: approving, calm
- else:
    Anjali Rao: A sign-in prompt you never kicked off means someone already has the password and is hoping you'll tap yes. Deny it. #delivery: calm, matter-of-fact
}
-> bye
