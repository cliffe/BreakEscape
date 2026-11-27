// Darren Price, office worker. Short staff chat; he gets tired of prompts.
VAR met_darren = false

=== start ===
{ met_darren:
    -> hub
}
~ met_darren = true
# speaker:npc
Hello. Busy, I'm afraid.
-> hub.choices

=== hub ===
# speaker:npc
Yes?
- (choices)
+ [How are you finding the new sign-in step?]
    # speaker:npc
    Fine, until it asks me ten times in a row.
    # speaker:npc
    After a while I just want it to stop.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
