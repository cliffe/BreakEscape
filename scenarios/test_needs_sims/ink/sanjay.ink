=== start ===
# speaker:npc
Oh, hi. Sorry, I'm in the middle of something.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Working at my own desk. I'd rather not borrow anyone else's.
    # speaker:npc
    Later I'll grab some food and have a chat by the water cooler.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Thanks.
    -> hub
