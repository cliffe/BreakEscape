VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Okafor, IT. The office network does not list itself to a visitor's box: you have to sweep it first. The notes you need are in the cabinet by the front door.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Where do I plug the box in?]
    # speaker:npc
    The office port is in this lobby, by the front desk.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
