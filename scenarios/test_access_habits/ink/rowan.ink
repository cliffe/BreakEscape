VAR hub_quiet = false
=== start ===
# speaker:npc
Morning. This is the habits test floor: eight beats, a sign at each.
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
    Some lock their screens and some don't. Nobody will tell you which: you have to watch.
    -> hub
+ [Where are the beats?]
    # speaker:npc
    Dana is north, Ian east, Priya south and Lena west.
    # speaker:npc
    Omar is beyond Dana, Kai beyond Ian, Mei beyond Priya and Tom beyond Lena.
    -> hub
+ [I'll get started.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Good luck.
    -> hub
