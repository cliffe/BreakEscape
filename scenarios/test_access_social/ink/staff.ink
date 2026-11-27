VAR hub_quiet = false
=== start ===
# speaker:npc
Sorry, busy. What is it?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [How's work today?]
    # speaker:npc
    Ask me again when the systems are working.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
