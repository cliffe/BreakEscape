// Niamh Doherty, office worker. Colour and feed gossip. Names no fact value.
VAR met_niamh = false

=== start ===
{ met_niamh:
    -> hub
}
~ met_niamh = true
# speaker:npc
Oh, hello. Mind the mugs.
-> hub.choices

=== hub ===
# speaker:npc
What's up?
- (choices)
+ [Anything worth reading on the office feed?]
    # speaker:npc
    Delphine's on there again. You can learn a lot about her.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    See you.
    # exit_conversation
    -> END
