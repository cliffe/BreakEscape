VAR hub_quiet = false
=== start ===
# speaker:npc
Mei Lin, legal. I'm right here at my desk.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Could you duck out of sight for a moment?] #exit_conversation
    ~ hub_quiet = true
    #set_global:mei_hidden:true
    # speaker:npc
    If it helps the test. I'll stay at my desk, you just won't see me.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Right you are.
    -> hub
