VAR hub_quiet = false
=== start ===
# speaker:npc
Moira Hale, records. What can I do for you?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [How is the day going?]
    # speaker:npc
    Busy. Records never stop.
    -> hub
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub
