// Delphine Arvanitis, office worker. Short staff chat (reopen pattern). Names no fact value.
VAR met_delphine = false

=== start ===
{ met_delphine:
    -> hub
}
~ met_delphine = true
# speaker:npc
Hello. You're the visitor Ama mentioned.
-> hub.choices

=== hub ===
# speaker:npc
Yes?
- (choices)
+ [Do you lock your screen?]
    # speaker:npc
    The moment I get up, it locks itself. IT insisted.
    -> choices
+ [Do you post much?]
    # speaker:npc
    Niamh says I post too much. It's only photos and little updates.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Thanks.
    # exit_conversation
    -> END
