VAR hub_quiet = false
VAR gave_copy = false
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
+ {not gave_copy} [Could I have a copy of that connection file?]
    # speaker:npc
    ~ gave_copy = true
    Sure. Don't lose it.
    #give_item:text_file:lena_rdp_gift
    # speaker:npc
    Same one, saved with my password. Treat it like the password.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
