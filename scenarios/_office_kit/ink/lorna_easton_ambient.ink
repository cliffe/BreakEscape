VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca14_out = false  // Synced scenario global
VAR kit_ca14_asked = false
VAR kit_ca14_photo_choice = ""  // Synced scenario global
VAR kit_ca14_seen = false
VAR kit_ca14_moved = false
VAR kit_ca14_done = false
VAR kit_ca18_out = false  // Synced scenario global
VAR kit_ca18_asked = false
VAR kit_ca18_reset_choice = ""  // Synced scenario global
VAR kit_ca18_moved = false
VAR kit_ca18_done = false

=== start ===
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca14_asked || (kit_ca14_out && not kit_ca14_done):
    -> ca14_photo
}
{ kit_ca18_asked || (kit_ca18_out && not kit_ca18_done):
    -> ca18_reset
}
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

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
// "Let me have a look first." writes nothing: the choice stays "asked" and the learner can come back.
=== ca14_photo ===
{ kit_ca14_moved:
    -> bye
}
{ kit_ca14_photo_choice == "crop" || kit_ca14_photo_choice == "post" || kit_ca14_photo_choice == "silent" || kit_ca14_done:
    -> ca14
}
Lorna Easton: It's all of us at our desks. Fine to post?
{ kit_ca14_photo_choice == "":
    ~ kit_ca14_photo_choice = "asked"
}
+ {kit_ca14_seen} [Crop the board out first. Anyone could zoom in on that.]
    ~ kit_ca14_photo_choice = "crop"
    Lorna Easton: Well spotted. I'll crop it to just us.
    #exit_conversation
    -> DONE
+ [Post it. It's only the team at their desks.]
    ~ kit_ca14_photo_choice = "post"
    Lorna Easton: Brilliant. It's up. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ {not kit_ca14_seen} [Let me have a look first.]
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca14_photo_choice = "silent"
    #exit_conversation
    -> DONE

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca18_reset ===
{ kit_ca18_moved:
    -> bye
}
{ kit_ca18_reset_choice == "words" || kit_ca18_reset_choice == "save" || kit_ca18_reset_choice == "silent" || kit_ca18_done:
    -> ca18
}
Lorna Easton: Kept my old one, changed the season. One less thing to remember. That'll do, won't it?
{ kit_ca18_reset_choice == "":
    ~ kit_ca18_reset_choice = "asked"
}
+ [Start again with three random words, then press Save.]
    ~ kit_ca18_reset_choice = "words"
    Lorna Easton: Ah, makes sense. Three random words it is.
    #exit_conversation
    -> DONE
+ [Save it. The reset page accepted it, so it's fine.]
    ~ kit_ca18_reset_choice = "save"
    Lorna Easton: Lovely. That's saved. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca18_reset_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
