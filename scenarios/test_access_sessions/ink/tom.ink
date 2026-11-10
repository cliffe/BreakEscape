VAR hub_quiet = false
=== start ===
# speaker:npc
Tom Fletcher, facilities. I'm at my desk.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [You're wanted somewhere else. Off you go.] #exit_conversation
    ~ hub_quiet = true
    #set_global:tom_removed:true
    #remove_npc
    # speaker:npc
    Fine. I'm off, then.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Right you are.
    -> hub
