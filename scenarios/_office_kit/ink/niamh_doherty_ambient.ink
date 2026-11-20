VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca00": -> ca00 }
    { kit_ep == "ca03": -> ca03 }
    { kit_ep == "ca08": -> ca08 }
    { kit_ep == "ca16": -> ca16 }
    { kit_ep == "ca19": -> ca19 }
}
Niamh Doherty: Hiya. There's a water cooler over by the wall if you need it.
-> bye

// ca00 convention (brief 1.3): staff open on this knot directly, no branch.
=== ca00 ===
Niamh Doherty: Hiya, welcome in. Give us a shout if you need anything at all.
-> bye

=== ca03 ===
{ kit_key_caught:
    Niamh Doherty: Good spot on that reset call. They nearly talked a password straight out of someone.
- else:
    Niamh Doherty: Helpdesk's had a run of odd reset calls lately. Keeps us all on our toes.
}
-> bye

=== ca08 ===
{ kit_key_caught:
    Niamh Doherty: Lovely work flagging that quick. The sooner it's reported, the sooner we're back up.
- else:
    Niamh Doherty: Half the floor was locked out of a system earlier. Proper pain when it happens.
}
-> bye

=== ca16 ===
{ kit_key_caught:
    Niamh Doherty: Nice one. Easier all round when everyone's working under their own name.
- else:
    Niamh Doherty: Someone got locked out and asked to borrow a login. Tempting, but it gets messy.
}
-> bye

=== ca19 ===
{ kit_key_caught:
    Niamh Doherty: Good catch. Spotting it early let IT shut it down before it got anywhere.
- else:
    Niamh Doherty: One of the desks got isolated by IT today. Something slipped through, I heard.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice shows only "(End of conversation)" in person-chat (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
