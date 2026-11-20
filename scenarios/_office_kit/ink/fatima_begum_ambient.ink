VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca06": -> ca06 }
    { kit_ep == "ca09": -> ca09 }
    { kit_ep == "ca15": -> ca15 }
    { kit_ep == "ca17": -> ca17 }
    { kit_ep == "ca20": -> ca20 }
}
Fatima Begum: Morning. Grab a cold drink from the machine if you're parched.
-> bye

=== ca06 ===
{ kit_key_caught:
    Fatima Begum: Good spot on that parking text. A code on an official-looking notice is easy to trust, and that's the whole trick.
- else:
    Fatima Begum: Those parking-permit texts keep doing the rounds. Everyone scans a code without a second thought these days.
}
-> bye

=== ca09 ===
{ kit_key_caught:
    Fatima Begum: Good work. A password reused on some hobby site opening a work account, that's how they walk straight in.
- else:
    Fatima Begum: Half the office still uses the same password everywhere. Scary when you think about it.
}
-> bye

=== ca15 ===
{ kit_key_caught:
    Fatima Begum: Good call on that stick. A found USB goes to IT unopened. Plugging it in is exactly what they're banking on.
- else:
    Fatima Begum: Someone found a USB stick by the desks the other week. Tempting to just plug it in and have a look.
}
-> bye

=== ca17 ===
{ kit_key_caught:
    Fatima Begum: Nicely sorted. Knowing what's fine on a work machine and what isn't saves a lot of bother down the line.
- else:
    Fatima Begum: The acceptable-use stuff feels dry, but it's worth knowing where the line sits before you cross it.
}
-> bye

=== ca20 ===
{ kit_key_caught:
    Fatima Begum: Good. A work password typed on some lookalike cafe wifi, and they're into your account from another town.
- else:
    Fatima Begum: So much of the job's on the move now. Easy to drop your guard on a train or in a cafe.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
