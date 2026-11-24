VAR hub_quiet = false
=== start ===
# speaker:npc
Ian Okafor, IT. The office network does not list itself to a visitor's box: you have to sweep it first.
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
    The guest port and the office port are both in this lobby. The guest network lists its machines as soon as you look.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
