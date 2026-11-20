// ================================================
// Fixture A draft: the three hidden hostiles (doorman, lookout, acolyte).
// Each starts hidden (behavior.initiallyHidden) and is turned visible and
// hostile by reveal_hostiles (§5.7). One shared story; each NPC's currentKnot
// picks its line. They are not for talking to: one line, then out.
// ================================================

=== doorman ===
Doorman: The lodge says you're leaving. One way or another.
#exit_conversation
-> doorman_rest

=== doorman_rest ===
Doorman: Still here?
+ [Back off.]
    Doorman: Make me.
    #exit_conversation
    -> doorman_rest

=== lookout ===
Lookout: She said someone would bring the phone. Didn't say they'd stay.
#exit_conversation
-> lookout_rest

=== lookout_rest ===
Lookout: You again.
+ [Who sent you?]
    Lookout: Nobody you'll meet.
    #exit_conversation
    -> lookout_rest

=== acolyte ===
Acolyte: You let one of us walk, and now there's no one to hold the door.
#exit_conversation
-> acolyte_rest

=== acolyte_rest ===
Acolyte: The door is listening.
+ [Step away from the altar.]
    Acolyte: Come and move me.
    #exit_conversation
    -> acolyte_rest
