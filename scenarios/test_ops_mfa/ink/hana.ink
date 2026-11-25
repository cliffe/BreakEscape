VAR hub_quiet = false
VAR lent_device = false
=== start ===
# speaker:npc
Hana Quill, accounts. What can I do for you?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ {not lent_device} [Could I borrow your code device?]
    #give_item:code_device
    # speaker:npc
    Go on then. Bring it back when you are done.
    ~ lent_device = true
    -> hub
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub
