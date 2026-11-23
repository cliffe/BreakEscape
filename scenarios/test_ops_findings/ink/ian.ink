VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Okafor, IT. A machine's services tell you what it runs. Checking a service tells you what may be wrong with it, and some of that turns out to be nothing.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [What is in the supply cupboard?]
    # speaker:npc
    Manuals and sheets for the office equipment. Take what you need.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
