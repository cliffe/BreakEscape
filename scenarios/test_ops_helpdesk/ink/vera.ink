VAR hub_quiet = false
VAR lent_phone = false
=== start ===
# speaker:npc
Vera Holt, records. The vault PC is mine.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ {not lent_phone} [Could I borrow your phone for a minute?]
    #give_item:phone_friendface
    # speaker:npc
    Fine. Do not lose it.
    ~ lent_phone = true
    -> hub
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub
