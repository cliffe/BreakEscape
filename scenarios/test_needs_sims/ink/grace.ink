=== start ===
# speaker:npc
Hello, love. I keep this place tidy, whether anyone asks or not.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Any dirty mugs left about, I take them to the washing-up tray in the kitchen.
    # speaker:npc
    And now and then I put my feet up on the lounge sofa.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Mind how you go.
    -> hub
