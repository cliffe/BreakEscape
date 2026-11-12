VAR hub_quiet = false
VAR lent_phone = false
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
+ {not lent_phone} [Could I borrow your phone for a bit?]
    #give_item:phone_friendface
    # speaker:npc
    Go on then. I'll have to use my PC instead.
    ~ lent_phone = true
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
