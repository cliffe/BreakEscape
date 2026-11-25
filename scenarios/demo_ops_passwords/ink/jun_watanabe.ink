// Jun Watanabe, office worker. Colour only.
VAR met_jun = false

=== start ===
{ met_jun:
    -> hub
}
~ met_jun = true
# speaker:npc
Oh, hi. Sorry, I'm a bit swamped.
-> hub.choices

=== hub ===
# speaker:npc
Sorry, still swamped.
- (choices)
+ [Busy day?]
    # speaker:npc
    Always. At least the printer's behaving.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    No worries.
    # exit_conversation
    -> END
