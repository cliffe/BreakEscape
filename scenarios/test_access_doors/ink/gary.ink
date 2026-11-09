VAR hub_quiet = false
=== start ===
# speaker:npc
Gary Whitlock, facilities. Imran and I share the one plant room card.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ [Can I scan your card with this card copier?]
    #clone_keycard:PLANT-SHARED-01
    # speaker:npc
    Go ahead. Same card as Imran's, same number.
    -> hub
+ [Who can get into the plant room?]
    # speaker:npc
    The reader's set up for Imran alone. I only go in with him.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
