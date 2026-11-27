VAR hub_quiet = false
=== start ===
# speaker:npc
Imran Siddiqui, maintenance. The plant room's mine.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ [Can I scan your card?]
    # speaker:npc
    No, my card stays on my belt. Ask Gary if you must.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
