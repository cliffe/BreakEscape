VAR hub_quiet = false
=== start ===
# speaker:npc
Can't stop, I'm in the middle of something.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Do you lock your screen when you get up?]
    # speaker:npc
    Depends how much of a hurry I'm in.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
