VAR hub_quiet = false
=== start ===
# speaker:npc
Priya Nair, security. Both doors through there are security staff only.
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
    #clone_keycard:SEC-PRIYA-01
    # speaker:npc
    Try it. It's a DESFire card, so you'll only get the number off it, not the keys.
    -> hub
+ [What's the difference between the two doors?]
    # speaker:npc
    The CCTV reader only checks the card number. The evidence store reader checks the card's keys as well.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Mind how you go.
    -> hub
