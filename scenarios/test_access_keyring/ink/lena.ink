VAR hub_quiet = false
=== start ===
# speaker:npc
Lena Fox, finance. My PC is in the office, east. The sticky note is a bad habit, I know.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Is that your .rdp file in the lobby?]
    # speaker:npc
    A saved connection to my desktop. Handy, until it isn't.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
