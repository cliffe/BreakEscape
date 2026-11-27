// Graham Whitfield, IT (recon showcase). Contract: SHOWCASE_PLAN.md 8.3.1.
// log_offer: evening only. The cooler exchange knot is copied from office_life_showcase.

VAR act_evening = false
VAR read_log_done = false
VAR use_card_done = false
VAR printer_fixed = false
VAR printer_fix_told = false
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
+ { act_evening and not read_log_done } [Ama said you'd show me the network log.]
    -> log_offer
+ [Do you get away from your desk much?]
    # speaker:npc
    Only for the cooler. It's where you hear things.
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
Want to see what you looked like from here? The network log PC's just there.
# speaker:npc
Every sweep, scan, test, plug and share you opened is a row. Yours come after the early ones.
# speaker:npc
Before the office opened, someone swept the whole network from the kitchen port. A sweep at an odd hour from an odd place is what I look for. Find it and flag it.
{ use_card_done and not printer_fixed:
    ~ printer_fixed = true
    #set_global:printer_fixed:true
    ~ printer_fix_told = true
    #set_global:printer_fix_told:true
    # speaker:npc
    I've changed the printer's factory login tonight. Have a look at its admin page now.
}
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
