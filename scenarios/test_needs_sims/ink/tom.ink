=== start ===
# speaker:npc
Hiya. Don't mind me, I'm only thinking about lunch.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Coffee first, then food from the kitchen fridge, then back to my desk.
    # speaker:npc
    If Amara's already at the coffee station I'll wait, or try the kitchen one.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Right you are.
    -> hub
