VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca16_out = false  // Synced scenario global
VAR kit_ca16_asked = false
VAR kit_ca16_signin_choice = ""  // Synced scenario global
VAR kit_ca16_done = false

=== start ===
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca16_asked || (kit_ca16_out && not kit_ca16_done):
    -> ca16_signin
}
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
    Niamh Doherty: Good spot on that sign-in prompt nobody started. One tap and they'd have been in.
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

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca16_signin ===
{ kit_ca16_signin_choice == "desk" || kit_ca16_signin_choice == "lend" || kit_ca16_signin_choice == "silent" || kit_ca16_done:
    -> ca16
}
Niamh Doherty: It won't take my password at all. Could I borrow your login for an hour?
{ kit_ca16_signin_choice == "":
    ~ kit_ca16_signin_choice = "asked"
}
+ [I can't lend mine, but the service desk can sort yours.]
    ~ kit_ca16_signin_choice = "desk"
    Niamh Doherty: No, you're right. I'll ring the service desk.
    #exit_conversation
    -> DONE
+ [Go on, take mine for an hour. I'll sign you in.]
    ~ kit_ca16_signin_choice = "lend"
    Niamh Doherty: Ta, you're a star. I'll be quick. #delivery: quick, grateful, already turning back to work
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca16_signin_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice shows only "(End of conversation)" in person-chat (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
