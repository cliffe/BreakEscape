// Graham Whitfield, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (the cooler), no variable, no consequence.
// The cooler exchange knot (exchange_cooler_chat) is a later slice, not here.

=== start ===
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
