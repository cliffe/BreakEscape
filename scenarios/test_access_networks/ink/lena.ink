VAR hub_quiet = false
=== start ===
# speaker:npc
Lena Fox, finance. My PC is behind the finance door, and that door has a keypad.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Can anyone else sign in at your PC?]
    # speaker:npc
    Only finance staff. Sam has tried, and it turned him away.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
