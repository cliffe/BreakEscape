VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Shaw, IT. The server rack is behind me. That card on the desk records my sign-in.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [What does the drop box do?]
    # speaker:npc
    Plug it into the wall port and it gives you a foothold on our network.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Right.
    -> hub
