=== start ===
# speaker:npc
Come in. The lounge is free, apart from me.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Planning next week on my laptop.
    # speaker:npc
    When I need a break I wander to the kitchen for a coffee and a natter.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    See you.
    -> hub
