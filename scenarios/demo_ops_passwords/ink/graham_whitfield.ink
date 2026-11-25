// Graham Whitfield, IT. Short chat plus log_offer, offered while act_evening is true.
VAR act_evening = false
VAR met_graham = false

=== start ===
{ met_graham:
    -> hub
}
~ met_graham = true
# speaker:npc
Now then. You'll be the visitor.
-> hub.choices

=== hub ===
# speaker:npc
Go on, then.
- (choices)
+ [Do you change your password often?]
    # speaker:npc
    I've one I like. Why would I change it?
    -> choices
+ { act_evening } [What about the sign-in log?]
    -> log_offer
+ [I'll let you get on.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END

=== log_offer ===
# speaker:npc
Every sign-in leaves a row. Open the log PC and find yours.
# speaker:npc
Then look at the small hours. One row doesn't belong.
-> hub.choices
