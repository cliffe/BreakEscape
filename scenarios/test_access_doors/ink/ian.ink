VAR ian_badge_lent = false
VAR hub_quiet = false

=== start ===
# speaker:npc
Ian Shaw, IT. The server room's through there, IT staff only.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ {not ian_badge_lent} [Could I borrow your spare badge?]
    ~ ian_badge_lent = true
    #give_item:keycard:ian_spare_badge
    # speaker:npc
    Here's my spare. Bring it back when you're done.
    -> hub
+ {ian_badge_lent} [About that spare badge.]
    # speaker:npc
    Keep it for now. It's the same card as mine, so it opens what I can open.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    No bother.
    -> hub
