VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca05_asked = false
VAR kit_ca05_prompt_choice = ""  // Synced scenario global
VAR kit_ca05_moved = false
VAR kit_ca05_done = false

=== start ===
{ kit_ca05_asked:
    -> ca05_prompt
}
{ kit_defend_done:
    { kit_ep == "ca00": -> ca00 }
    { kit_ep == "ca05": -> ca05 }
    { kit_ep == "ca08": -> ca08 }
    { kit_ep == "ca10": -> ca10 }
    { kit_ep == "ca16": -> ca16 }
    { kit_ep == "ca19": -> ca19 }
}
Darren Price: Alright. Help yourself to the cooler if you're parched.
-> bye

// ca00 convention (brief 1.3): staff open on this knot directly, no branch.
=== ca00 ===
Darren Price: Welcome aboard. Good to have you on the floor with us.
-> bye

=== ca05 ===
{ kit_key_caught:
    Darren Price: Nice catch on that fake sign-in page. Looked just like the real portal, didn't it.
- else:
    Darren Price: Seen a few lookalike login pages doing the rounds. Hard to tell from the real thing now.
}
-> bye

=== ca08 ===
{ kit_key_caught:
    Darren Price: Good call flagging that one fast. A quick shout saves us a lot of grief later.
- else:
    Darren Price: One of the machines went down earlier. Always a scramble when a shared system drops.
}
-> bye

=== ca10 ===
{ kit_key_caught:
    Darren Price: Well spotted. Those fake device-check prompts catch people out all the time.
- else:
    Darren Price: Had a laptop out of action this week. Dodgy download, by the looks of it.
}
-> bye

=== ca16 ===
{ kit_key_caught:
    Darren Price: Good thinking. Keeping sign-ins to one person saves a lot of untangling later.
- else:
    Darren Price: Folk still share logins when they're stuck. Makes it murder to work out who did what.
}
-> bye

=== ca19 ===
{ kit_key_caught:
    Darren Price: Nice one. Catching it early means IT can box it off before it spreads.
- else:
    Darren Price: IT pulled a machine off the network today. Updates had slipped, apparently.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca05_prompt ===
{ kit_ca05_moved:
    -> bye
}
{ kit_ca05_prompt_choice == "stop" || kit_ca05_prompt_choice == "approve" || kit_ca05_prompt_choice == "silent" || kit_ca05_done:
    -> ca05
}
Darren Price: Password's in, and now my phone wants me to approve it. Fine to say yes?
{ kit_ca05_prompt_choice == "":
    ~ kit_ca05_prompt_choice = "asked"
}
+ [Deny it. Check voicemail the usual way, and report it now.]
    ~ kit_ca05_prompt_choice = "stop"
    Darren Price: Right, denied. I'll report it now and change my password.
    #exit_conversation
    -> DONE
+ [Approve it. The prompt's from Quayholt, so it's real.]
    ~ kit_ca05_prompt_choice = "approve"
    Darren Price: Done. That's me in. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca05_prompt_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice shows only "(End of conversation)" in person-chat (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
