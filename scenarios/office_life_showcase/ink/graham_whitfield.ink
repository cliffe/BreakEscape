// Graham Whitfield, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (the cooler), no variable, no consequence.
// The cooler exchange knot (exchange_cooler_chat) is at the foot of this file.

// met_graham: ink-local VAR so the first-meeting line plays once; a re-talk (after
// an ended story or a reload) opens at the hub reopen line. See ama_owusu.ink.
VAR met_graham = false

=== start ===
{ met_graham:
    -> hub
}
~ met_graham = true
# speaker:npc
Now then. You'll be the visitor Ama mentioned.
-> hub.choices

=== hub ===
# speaker:npc
Go on, then.
- (choices)
+ [Do you get away from your desk much?]
    # speaker:npc
    Only for the cooler. It's where you hear things.
    # speaker:npc
    My screen locks itself, mind. IT set it to twenty seconds.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END

// Played once by the needs system when Graham and Agnieszka chat at the cooler
// and the viewer is in earshot. Never reached from the player's conversation.
=== exchange_cooler_chat ===
Graham Whitfield: Not seen you at the cooler all week.
Agnieszka Duda: I've been hiding at my desk, Graham.
Graham Whitfield: Deadline? I'll not keep you long.
Agnieszka Duda: You never do. Five minutes at most.
Graham Whitfield: Then back to it. Same time tomorrow?
-> DONE
