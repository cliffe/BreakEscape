VAR hub_quiet = false
=== start ===
# speaker:npc
Dana Reeve, finance. Can I help?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Could I borrow your phone?]
    # speaker:npc
    No. It stays with me.
    -> hub
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub
