=== start ===
# speaker:npc
Oh, hello. I'm just clearing the mugs people keep leaving about.
-> hub

=== hub ===
+ [What are you working on?]
    # speaker:npc
    Month-end, mostly. I keep the folder on me so nobody walks off with it.
    -> hub
+ [Those mugs again?]
    # speaker:npc
    Somebody always leaves them on the floor. I'll take them through to the kitchen.
    -> hub
+ [I'll leave you to it.] #exit_conversation
    # speaker:npc
    Thanks. Mind the wet floor.
    -> hub
