// Graham Whitfield, IT (recon showcase). Contract: SHOWCASE_PLAN.md 8.3.1.
// log_offer: evening only. The cooler exchange knot is copied from office_life_showcase.

VAR act_evening = false
// met_graham: ink-local first-meeting flag (see ama_owusu.ink).
VAR met_graham = false

=== start ===
{ met_graham:
    -> hub
}
~ met_graham = true
# speaker:npc
Now then. You'll be the visitor Ama mentioned.
-> hub

=== hub ===
# speaker:npc
Go on, then.
- (choices)
+ { act_evening } [Want to see what you looked like from here?]
    -> log_offer
+ [Do you get away from your desk much?]
    # speaker:npc
    Only for the cooler. It's where you hear things.
    # speaker:npc
    My screen locks itself, mind. IT set it to twenty seconds.
    -> choices
+ [What do you keep an eye on?]
    # speaker:npc
    The network, mostly. The printer, the file server, the camera.
    # speaker:npc
    I don't watch it all day. The log does that for me.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END

=== log_offer ===
# speaker:npc
Go on, have a look. The network log PC is just there.
# speaker:npc
Every sweep, scan and test you did is a row. Find your own.
# speaker:npc
Then see if you can spot the one that isn't you. Something odd came in before you did.
-> hub

// Played once by the needs system when Graham and Agnieszka chat at the cooler
// and the viewer is in earshot. Never reached from the player's conversation.
=== exchange_cooler_chat ===
Graham Whitfield: Not seen you at the cooler all week.
Agnieszka Duda: I've been hiding at my desk, Graham.
Graham Whitfield: Deadline? I'll not keep you long.
Agnieszka Duda: You never do. Five minutes at most.
Graham Whitfield: Then back to it. Same time tomorrow?
-> DONE
