// Yusuf Demir, operations. Short staff chat; he keeps his phone close, mostly.
VAR met_yusuf = false

=== start ===
{ met_yusuf:
    -> hub
}
~ met_yusuf = true
# speaker:npc
Hey. Operations never stops.
-> hub.choices

=== hub ===
# speaker:npc
What's up?
- (choices)
+ [Is your phone always on you?]
    # speaker:npc
    Nearly always. The coffee machine is my weak spot.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    See you.
    # exit_conversation
    -> END
