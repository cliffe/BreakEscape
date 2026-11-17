=== start ===
# speaker:npc
You shouldn't be back here. Turn around.
-> hub

=== hub ===
+ [Easy, I'm just looking.]
    # speaker:npc
    I said turn around. This is the last time I'll ask nicely.
    -> hub
+ [Backing off.] #exit_conversation
    # speaker:npc
    Good. Keep walking.
    -> hub
