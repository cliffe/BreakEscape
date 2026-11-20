VAR hub_quiet = false
=== start ===
# speaker:npc
Morning. This is the unlocked-sessions test floor: eleven beats, a sign at each.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ [What is this place?]
    # speaker:npc
    Everyone here has their own PC and keeps getting up for coffee.
    # speaker:npc
    Whether you can use a PC depends on whether its owner is there, and whether the screen locked when they left.
    -> hub
+ [Where are the beats?]
    # speaker:npc
    Dana is north, Ian east, Priya south and the hot desk west.
    # speaker:npc
    Omar is beyond Dana, Kai beyond Ian, Mei beyond Priya and Tom beyond the hot desk.
    -> hub
+ [I'll get started.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Good luck.
    -> hub
