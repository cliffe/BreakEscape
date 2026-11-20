=== start ===
# speaker:npc
Afternoon. I'm just here for the phone lines.
-> hub

=== hub ===
+ [How's the job going?]
    # speaker:npc
    Slow. Ceiling tiles, cables, the usual. Nobody here says much to me.
    # speaker:npc
    I'll get a drink at the cooler when I'm parched. They tend to wait until I've gone.
    -> hub
+ [I'll leave you to it.] #exit_conversation
    # speaker:npc
    Cheers.
    -> hub
