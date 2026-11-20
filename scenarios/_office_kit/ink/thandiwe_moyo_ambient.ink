VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca12_screen_asked = false
VAR kit_ca12_screen_choice = ""
VAR kit_ca12_screen_seen = false
VAR kit_ca12_done = false

// Her click after the look-up request lands here: before an answer it offers the choice,
// after one it falls through to the ca12 stub (see ca12_screen).
=== start ===
{ kit_ca12_screen_asked:
    -> ca12_screen
}
{ kit_defend_done:
    { kit_ep == "ca12": -> ca12 }
}
Thandiwe Moyo: Head down on a plan set.
-> bye

=== ca12 ===
Thandiwe Moyo: {kit_key_caught: Sounds like the front desk had a good morning.|Long morning on the plan sets. Bet the desk's been busy.}
-> bye

// Reached from the return bark (C1). A bark's knot sticks, so a second entry never re-answers.
// The bubble closes when "asked" is written, so the knot opens on the bark's own words.
=== ca12_screen ===
// Once the beat is over (kit_ca12_done) a late click gets the stub, so no answer lands after the recap.
{ kit_ca12_screen_choice == "mention" || kit_ca12_screen_choice == "silent" || kit_ca12_done:
    -> ca12
}
Thandiwe Moyo: Right, that's me back. Anything I should know?
{ kit_ca12_screen_choice == "":
    ~ kit_ca12_screen_choice = "asked"
}
+ {kit_ca12_screen_seen} [Your screen was open while you were away.]
    ~ kit_ca12_screen_choice = "mention"
    Thandiwe Moyo: Oh, good shout. Locked. Easy to do when you've only nipped off.
    #exit_conversation
    -> DONE
+ [All quiet.]
    ~ kit_ca12_screen_choice = "silent"
    Thandiwe Moyo: Okay. Back to work, then.
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca12_screen_choice = "silent"
    Thandiwe Moyo: Okay. Back to work, then.
    #exit_conversation
    -> DONE

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
