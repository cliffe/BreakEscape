VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Shaw, IT. The door controller in the store has no screen. I manage it from my desk, over the network.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [So nobody can sign in at the box itself?]
    # speaker:npc
    No keyboard, no screen. You'd need to be on the network, and you'd need my password.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
