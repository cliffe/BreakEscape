VAR hub_quiet = false
VAR lent_card = false
VAR technique_used_seen = false
=== start ===
# speaker:npc
Ian Okafor, IT. I keep the machines here running. If you are looking over the network, ask me what I know about them.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Anything I should read up on before I look at these machines?]
    # speaker:npc
    There is a note in the cabinet by the front door about devices and the accounts they ship with.
    -> hub
+ {not lent_card} [Do you have any notes on the storage machines?]
    #give_item:technique_card
    # speaker:npc
    I made notes when the storage service was last updated. Keep them, I have a copy.
    ~ lent_card = true
    -> hub
+ {technique_used_seen} [I think one of your notes just paid off.]
    # speaker:npc
    Good. Keep the notes somewhere safe.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    See you.
    -> hub
