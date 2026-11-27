VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Shaw, IT. My PC only lets IT staff sign in.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Can anyone use your PC?]
    # speaker:npc
    Only IT accounts. Anyone else gets told their account can't sign in here, even with the right password.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Right you are.
    -> hub
