VAR hub_quiet = false
=== start ===
# speaker:npc
Lena Fox, finance. Now we've met, the known-people PC will show my account.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Why would it show you now?]
    # speaker:npc
    That PC lists only people you have come across. You hadn't, until you walked in here.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
