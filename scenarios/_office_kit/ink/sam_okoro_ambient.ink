VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_e1_screen_choice = ""

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Sam Okoro: Morning. Mind the cables by my desk.
-> bye

=== ca01 ===
Sam Okoro: Good spot on that invoice. Phone the supplier next time too.
-> bye

// Reached from the return bark: Sam is back at a screen that stayed on while he was away.
=== kit_e1_screen ===
Sam Okoro: Was my screen on the whole time I was away?
+ [Yes, it was still on. Worth locking it before a break.]
    ~ kit_e1_screen_choice = "mention"
    Sam Okoro: Thanks. I'll lock it next time I get up.
    -> bye
+ [Nothing, just saying hello.]
    ~ kit_e1_screen_choice = "none"
    Sam Okoro: Hello. Back to it, then.
    -> bye

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
