VAR hub_quiet = false
=== start ===
# speaker:npc
Dana Reyes, finance. The office through there is finance staff only.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ [Can I scan your badge with this card copier?]
    #clone_keycard:FIN-DANA-01
    # speaker:npc
    Go on, then. It's an old proximity card, it reads in a second.
    -> hub
+ [What's in the office?]
    # speaker:npc
    Desks, and a cabinet that opens for anyone in finance.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Right you are.
    -> hub
