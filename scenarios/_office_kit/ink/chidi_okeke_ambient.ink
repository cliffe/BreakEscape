VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca09_asked = false
VAR kit_ca09_note_choice = ""  // Synced scenario global
VAR kit_ca09_note_seen = false
VAR kit_ca09_done = false
VAR kit_ca02_out = false  // Synced scenario global
VAR kit_ca02_asked = false
VAR kit_ca02_cv_choice = ""  // Synced scenario global
VAR kit_ca02_moved = false
VAR kit_ca02_done = false

=== start ===
{ kit_ca09_asked:
    -> ca09_note
}
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca02_asked || (kit_ca02_out && not kit_ca02_done):
    -> ca02_cv
}
{ kit_defend_done:
    { kit_ep == "ca02": -> ca02 }
    { kit_ep == "ca09": -> ca09 }
    { kit_ep == "ca15": -> ca15 }
    { kit_ep == "ca20": -> ca20 }
}
Chidi Okeke: Now then. Drinks machine's over there if you fancy one.
-> bye

=== ca02 ===
{ kit_key_caught:
    Chidi Okeke: Good one, spotting that dodgy application. The lads in HR open attachments all day, so nice to have someone watching their backs.
- else:
    Chidi Okeke: Recruitment inbox never stops. All sorts of attachments land in there from folk we've never met.
}
-> bye

=== ca09 ===
{ kit_key_caught:
    Chidi Okeke: Nice. Get everyone on a manager and a passkey and each sign-in's one person's, no more shared logins on sticky notes.
- else:
    Chidi Okeke: We still share a login or two on the fleet desk. Nobody could say who did what, mind.
}
-> bye

=== ca15 ===
{ kit_key_caught:
    Chidi Okeke: Nice. Deadline on and a free transfer tool looks grand, but then nobody can say where the client pack's gone.
- else:
    Chidi Okeke: We're always chasing a quicker way to shift big files before a deadline. The approved one feels slow.
}
-> bye

=== ca20 ===
{ kit_key_caught:
    Chidi Okeke: Nice one. Report a lost device the minute it's gone and IT wipes it before anyone reads a thing.
- else:
    Chidi Okeke: Half my week's out of the van. You forget what's sat on that tablet if you leave it somewhere.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca09_note ===
{ kit_ca09_note_choice == "mention" || kit_ca09_note_choice == "fine" || kit_ca09_note_choice == "silent" || kit_ca09_done:
    -> ca09
}
Chidi Okeke: Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag?
{ kit_ca09_note_choice == "":
    ~ kit_ca09_note_choice = "asked"
}
+ {kit_ca09_note_seen} [I'd take that note down. Anyone passing can read it.]
    ~ kit_ca09_note_choice = "mention"
    Chidi Okeke: Fair point, that. I'll have it down and ask Nilesh about a password manager.
    #exit_conversation
    -> DONE
+ [Sounds sorted. At least you won't forget it now.]
    ~ kit_ca09_note_choice = "fine"
    Chidi Okeke: Grand, that. Back to it, then.
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca09_note_choice = "silent"
    #exit_conversation
    -> DONE

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca02_cv ===
{ kit_ca02_moved:
    -> bye
}
{ kit_ca02_cv_choice == "report" || kit_ca02_cv_choice == "enable" || kit_ca02_cv_choice == "silent" || kit_ca02_done:
    -> ca02
}
Chidi Okeke: Microsoft's blocked it. He's sent steps to get round it. Do I?
{ kit_ca02_cv_choice == "":
    ~ kit_ca02_cv_choice = "asked"
}
+ [Report it and tell Fatima. A real CV opens without that.]
    ~ kit_ca02_cv_choice = "report"
    Chidi Okeke: Right. Reported it, and I'll give Fatima a shout.
    #exit_conversation
    -> DONE
+ [Follow his steps. It's only a CV.]
    ~ kit_ca02_cv_choice = "enable"
    Chidi Okeke: Grand. Clicked it. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca02_cv_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca02_react ===
{ kit_key_caught:
    Chidi Okeke: Good spot. That blocked CV was the whole trick. Follow his steps and you run whatever's tucked inside. #delivery: easy-going, approving
- else:
    Chidi Okeke: A real CV just opens. One that talks you round Office's block is after that one step to let it loose. #delivery: easy-going, matter-of-fact
}
-> bye

=== ca09_react ===
{ kit_key_caught:
    Chidi Okeke: That message wants your sign-in number read back, and that number's sat on their screen. Real IT never asks for it. #delivery: easy-going, approving
- else:
    Chidi Okeke: No real IT desk asks you to read back a code or tap approve. Do either and you've handed them the account. #delivery: easy-going, matter-of-fact
}
-> bye

=== ca15_react ===
{ kit_key_caught:
    Chidi Okeke: Good call. Posted in or dropped in a car park, it's the same bait, left hoping someone plugs it in for a look. #delivery: easy-going, approving
- else:
    Chidi Okeke: A stick that turns up, posted or found, is a tempting thing, and that's the whole point of it. It goes to IT, never into your PC. #delivery: easy-going, matter-of-fact
}
-> bye

=== ca20_react ===
{ kit_key_caught:
    Chidi Okeke: Good eye. No wifi page needs your work password. One that asks is just after it, to sign in as you later. #delivery: easy-going, approving
- else:
    Chidi Okeke: A café wifi page wanting your work password is the trap, dressed up on a near-enough web address. Accept the terms, nowt else. #delivery: easy-going, matter-of-fact
}
-> bye
